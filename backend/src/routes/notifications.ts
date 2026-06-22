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

// GET /api/notifications/unread-counts
router.get('/unread-counts', authMiddleware, async (req: Request, res: Response): Promise<any> => {
  const user = req.body.currentUser;

  try {
    if (user.userTypeId === 1 || user.userTypeId === 2) {
      // Admin / Staff
      // Agent notifications (toId is null, from userTypeId = 3)
      const agentNotificationsCount = await prisma.notification.count({
        where: {
          toId: null,
          status: { in: [0, 1] },
          user_master_notification_master_from_idTouser_master: {
            userTypeId: 3
          }
        }
      });

      // Advocate notifications (toId is null, from userTypeId = 4)
      const advocateNotificationsCount = await prisma.notification.count({
        where: {
          toId: null,
          status: { in: [0, 1] },
          user_master_notification_master_from_idTouser_master: {
            userTypeId: 4
          }
        }
      });

      // Agent Chats (general chat, toId = 1, from userTypeId = 3, type = 0)
      const agentChatsCount = await prisma.chat.count({
        where: {
          toId: user.userId,
          status: 0,
          type: 0,
          user_master_chat_master_from_idTouser_master: {
            userTypeId: 3
          }
        }
      });

      // Agent Help (support chat, toId = 1, from userTypeId = 3, type = 1)
      const agentHelpsCount = await prisma.chat.count({
        where: {
          toId: user.userId,
          status: 0,
          type: 1,
          user_master_chat_master_from_idTouser_master: {
            userTypeId: 3
          }
        }
      });

      // Advocate Chats (general chat, toId = 1, from userTypeId = 4, type = 0)
      const advocateChatsCount = await prisma.chat.count({
        where: {
          toId: user.userId,
          status: 0,
          type: 0,
          user_master_chat_master_from_idTouser_master: {
            userTypeId: 4
          }
        }
      });

      // Advocate Help (support chat, toId = 1, from userTypeId = 4, type = 1)
      const advocateHelpsCount = await prisma.chat.count({
        where: {
          toId: user.userId,
          status: 0,
          type: 1,
          user_master_chat_master_from_idTouser_master: {
            userTypeId: 4
          }
        }
      });

      return res.json({
        Status: 100,
        AgentNotificationsCount: agentNotificationsCount,
        AdvocateNotificationsCount: advocateNotificationsCount,
        AgentChatsCount: agentChatsCount,
        AgentHelpsCount: agentHelpsCount,
        AdvocateChatsCount: advocateChatsCount,
        AdvocateHelpsCount: advocateHelpsCount
      });
    } else {
      // Agent or Advocate
      const chatsCount = await prisma.chat.count({
        where: {
          toId: user.userId,
          status: 0
        }
      });

      const notificationsCount = await prisma.notification.count({
        where: {
          toId: user.userId,
          status: { in: [0, 1] }
        }
      });

      return res.json({
        Status: 100,
        ChatsCount: chatsCount,
        NotificationsCount: notificationsCount
      });
    }
  } catch (error) {
    console.error('Fetch unread counts error:', error);
    return res.status(500).json({ Error: 'Internal Server Error' });
  }
});

// GET /api/notifications
router.get('/', authMiddleware, async (req: Request, res: Response): Promise<any> => {
  const user = req.body.currentUser;
  const type = req.query.type as string; // 'agent' or 'advocate' for admin, ignored for others

  try {
    let whereClause: any = {
      status: { in: [0, 1] }
    };

    if (user.userTypeId === 1 || user.userTypeId === 2) {
      whereClause.toId = null;
      if (type === 'agent') {
        whereClause.user_master_notification_master_from_idTouser_master = {
          userTypeId: 3
        };
      } else if (type === 'advocate') {
        whereClause.user_master_notification_master_from_idTouser_master = {
          userTypeId: 4
        };
      }
    } else {
      whereClause.toId = user.userId;
    }

    const notifications = await prisma.notification.findMany({
      where: whereClause,
      include: {
        user_master_notification_master_from_idTouser_master: {
          select: {
            userId: true,
            firstname: true,
            middlename: true,
            surname: true,
            firmname: true
          }
        }
      },
      orderBy: { sendtime: 'desc' }
    });

    const formatted = notifications.map(n => ({
      notificationId: n.notificationId,
      fromId: n.fromId,
      toId: n.toId,
      olbId: n.olbId,
      action: n.action,
      title: n.title,
      message: n.message,
      status: n.status,
      sendtime: n.sendtime,
      senderName: n.user_master_notification_master_from_idTouser_master
        ? `${n.user_master_notification_master_from_idTouser_master.firstname || ''} ${n.user_master_notification_master_from_idTouser_master.surname || ''}`.trim()
        : 'System'
    }));

    return res.json({ Status: 100, Notifications: formatted });
  } catch (error) {
    console.error('Fetch notifications error:', error);
    return res.status(500).json({ Error: 'Internal Server Error' });
  }
});

// POST /api/notifications/mark-read
router.post('/mark-read', authMiddleware, async (req: Request, res: Response): Promise<any> => {
  const { notificationIds } = req.body;

  if (!notificationIds || !Array.isArray(notificationIds)) {
    return res.status(400).json({ Status: 0, Msg: 'Notification list is required.' });
  }

  try {
    await prisma.notification.updateMany({
      where: {
        notificationId: { in: notificationIds.map(id => parseInt(id)) }
      },
      data: {
        status: 2,
        seentime: new Date()
      }
    });

    return res.json({ Status: 2, Msg: 'Notifications marked as read successfully.' });
  } catch (error) {
    console.error('Mark read error:', error);
    return res.status(500).json({ Status: 1, Msg: 'Failed to update notifications.' });
  }
});

// POST /api/notifications/send-help
router.post('/send-help', authMiddleware, async (req: Request, res: Response): Promise<any> => {
  const user = req.body.currentUser;
  const { SupportType, Message } = req.body;

  if (!SupportType || !Message) {
    return res.status(400).json({ Status: 0, Msg: 'Support type and message content are required.' });
  }

  try {
    // Insert ticket into chat_master where toId = 1 (Admin) and supportType is defined
    const newChat = await prisma.chat.create({
      data: {
        fromId: user.userId,
        toId: 1, // System Admin
        message: Message,
        supportType: parseInt(SupportType),
        type: 1, // Support ticket type
        status: 0,
        sendtime: new Date()
      }
    });

    // Auto responder matching legacy behavior
    const autoRevertMessage = "Thank you for contacting us. We have received your request. Our team will contact you as soon as possible";
    await prisma.chat.create({
      data: {
        fromId: 1,
        toId: user.userId,
        message: autoRevertMessage,
        status: 0,
        sendtime: new Date()
      }
    });

    return res.json({ Status: 2, Msg: 'Help request submitted successfully.' });
  } catch (error) {
    console.error('Send help error:', error);
    return res.status(500).json({ Status: 1, Msg: 'Failed to submit help ticket.' });
  }
});

export default router;
