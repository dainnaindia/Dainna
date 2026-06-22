import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const router = Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'dainna-secret-super-key-2.0';

// Authentication middleware
async function authMiddleware(req: Request, res: Response, next: any): Promise<any> {
  const token = req.cookies?.auth_token || req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ Error: 'Unauthorized' });
  }
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    req.body.currentUser = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ Error: 'Invalid session' });
  }
}

// GET /api/chat/contacts (Retrieve contacts list based on role)
router.get('/contacts', authMiddleware, async (req: Request, res: Response): Promise<any> => {
  const user = req.body.currentUser;

  try {
    // If agent or advocate, contact is always Admin (userId = 1)
    if (user.userTypeId === 3 || user.userTypeId === 4) {
      const pendingCount = await prisma.chat.count({
        where: {
          fromId: 1,
          toId: user.userId,
          status: 0
        }
      });

      return res.json({
        Status: 100,
        Contacts: [
          {
            userId: 1,
            name: 'System Admin Support',
            userTypeId: 1,
            pendingCount
          }
        ]
      });
    }

    // If Admin (1), get all Agents and Advocates
    const users = await prisma.user.findMany({
      where: {
        userTypeId: { in: [3, 4] }
      },
      select: {
        userId: true,
        firstname: true,
        middlename: true,
        surname: true,
        userTypeId: true
      }
    });

    // Get pending message counts for each contact sent to Admin
    const pendingMessages = await prisma.chat.groupBy({
      by: ['fromId'],
      where: {
        toId: user.userId,
        status: 0
      },
      _count: {
        chatId: true
      }
    });

    const pendingMap = new Map(pendingMessages.map(pm => [pm.fromId, pm._count.chatId]));

    const contacts = users.map(u => ({
      userId: u.userId,
      name: `${u.firstname} ${u.middlename || ''} ${u.surname}`.trim(),
      userTypeId: u.userTypeId,
      pendingCount: pendingMap.get(u.userId) || 0
    }));

    // Sort: contacts with pending messages first
    contacts.sort((a, b) => b.pendingCount - a.pendingCount);

    return res.json({ Status: 100, Contacts: contacts });
  } catch (error) {
    console.error('List chat contacts error:', error);
    return res.status(500).json({ Error: 'Internal Server Error' });
  }
});

// GET /api/chat/messages/:otherId (Get message history with a user)
router.get('/messages/:otherId', authMiddleware, async (req: Request, res: Response): Promise<any> => {
  const user = req.body.currentUser;
  const otherId = parseInt(req.params.otherId);

  try {
    // Retrieve historical chat logs between current user and otherId
    const messages = await prisma.chat.findMany({
      where: {
        OR: [
          { fromId: user.userId, toId: otherId },
          { fromId: otherId, toId: user.userId }
        ]
      },
      orderBy: { chatId: 'asc' }
    });

    // Mark messages from otherId to current user as read (status = 1)
    await prisma.chat.updateMany({
      where: {
        fromId: otherId,
        toId: user.userId,
        status: 0
      },
      data: {
        status: 1,
        receivetime: new Date(),
        seentime: new Date()
      }
    });

    return res.json({ Status: 100, Messages: messages });
  } catch (error) {
    console.error('Get chat messages error:', error);
    return res.status(500).json({ Error: 'Internal Server Error' });
  }
});

// POST /api/chat/send (Send a message)
router.post('/send', authMiddleware, async (req: Request, res: Response): Promise<any> => {
  const user = req.body.currentUser;
  const { ToID, Message, SupportType } = req.body;

  if (!ToID || !Message) {
    return res.status(400).json({ Status: 0, Msg: 'Recipient and message content are required.' });
  }

  try {
    const toIdVal = parseInt(ToID);
    const supportTypeVal = SupportType ? parseInt(SupportType) : null;

    const newChat = await prisma.chat.create({
      data: {
        fromId: user.userId,
        toId: toIdVal,
        message: Message,
        supportType: supportTypeVal,
        type: supportTypeVal ? 1 : 0, // HelpCategory message if supportType is present
        status: 0,
        sendtime: new Date()
      }
    });

    // If agent sent help message, auto-revert message matching legacy behavior
    if (user.userTypeId === 3 && supportTypeVal) {
      const autoRevertMessage = "Thank you for contacting us. We have received your request. Our team will contact you as soon as possible";
      await prisma.chat.create({
        data: {
          fromId: toIdVal,
          toId: user.userId,
          message: autoRevertMessage,
          status: 0,
          sendtime: new Date()
        }
      });
    }

    return res.json({ Status: 2, Msg: 'Message sent successfully.', Chat: newChat });
  } catch (error) {
    console.error('Send chat message error:', error);
    return res.status(500).json({ Status: 1, Msg: 'Failed to send message.' });
  }
});

// POST /api/chat/bulk (Send bulk broadcast messages)
router.post('/bulk', authMiddleware, async (req: Request, res: Response): Promise<any> => {
  const user = req.body.currentUser;
  const { SystemEmailSMS, ToIDs, Message } = req.body; // ToIDs can be [0] (all) or list of userIds

  if (!ToIDs || !Message || !SystemEmailSMS) {
    return res.status(400).json({ Status: 0, Msg: 'System method, target recipients, and message are required.' });
  }

  try {
    const systemVal = parseInt(SystemEmailSMS);
    const targets = Array.isArray(ToIDs) ? ToIDs.map((t: any) => parseInt(t)) : [parseInt(ToIDs)];
    
    let targetIds: number[] = [];

    // If 0 is in targets, it means send to all active users matching agent/advocate role
    if (targets.includes(0)) {
      const allUsers = await prisma.user.findMany({
        where: { userTypeId: { in: [3, 4] }, status: 1 },
        select: { userId: true }
      });
      targetIds = allUsers.map(u => u.userId);
    } else {
      targetIds = targets;
    }

    // Insert message record for each target recipient in chat_master
    const chatData = targetIds.map(tid => ({
      fromId: user.userId,
      toId: tid,
      message: Message,
      systemEmailSms: systemVal,
      status: 0,
      sendtime: new Date()
    }));

    await prisma.chat.createMany({
      data: chatData
    });

    return res.json({ Status: 2, Msg: 'Bulk message sent successfully.' });
  } catch (error) {
    console.error('Send bulk message error:', error);
    return res.status(500).json({ Status: 1, Msg: 'Failed to send bulk message.' });
  }
});

export default router;
