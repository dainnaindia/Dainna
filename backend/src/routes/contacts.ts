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

// POST /api/contacts/submit - Public endpoint to submit contact form
router.post('/submit', async (req: Request, res: Response): Promise<any> => {
  const { name, phone, email, message } = req.body;

  if (!name || !phone || !email || !message) {
    return res.status(400).json({ Status: 0, Msg: 'All fields are required.' });
  }

  try {
    const newMessage = await prisma.contactMessage.create({
      data: {
        name,
        phone,
        email,
        message
      }
    });

    return res.json({ Status: 100, Msg: 'Message sent successfully.', Message: newMessage });
  } catch (error) {
    console.error('Submit contact message error:', error);
    return res.status(500).json({ Error: 'Internal Server Error' });
  }
});

// GET /api/contacts/list - Secured admin/staff endpoint to list messages
router.get('/list', authMiddleware, async (req: Request, res: Response): Promise<any> => {
  const user = req.body.currentUser;

  // Only allow admin (1) and staff (2)
  if (user.userTypeId !== 1 && user.userTypeId !== 2) {
    return res.status(403).json({ Error: 'Forbidden' });
  }

  try {
    const messages = await prisma.contactMessage.findMany({
      orderBy: { id: 'desc' }
    });
    return res.json({ Status: 100, Messages: messages });
  } catch (error) {
    console.error('Get contact messages error:', error);
    return res.status(500).json({ Error: 'Internal Server Error' });
  }
});

// DELETE /api/contacts/:id - Delete a contact message
router.delete('/:id', authMiddleware, async (req: Request, res: Response): Promise<any> => {
  const user = req.body.currentUser;
  const messageId = parseInt(req.params.id);

  if (user.userTypeId !== 1 && user.userTypeId !== 2) {
    return res.status(403).json({ Error: 'Forbidden' });
  }

  try {
    await prisma.contactMessage.delete({
      where: { id: messageId }
    });
    return res.json({ Status: 100, Msg: 'Message deleted successfully.' });
  } catch (error) {
    console.error('Delete contact message error:', error);
    return res.status(500).json({ Error: 'Internal Server Error' });
  }
});

export default router;
