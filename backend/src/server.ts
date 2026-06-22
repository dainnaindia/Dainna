import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { Prisma } from '@prisma/client';

// Override Prisma Decimal serialization to output numbers instead of strings in JSON
(Prisma.Decimal.prototype as any).toJSON = function () {
  return this.toNumber();
};

import authRouter from './routes/auth';
import statsRouter from './routes/stats';
import propertiesRouter from './routes/properties';
import draftsRouter from './routes/drafts';
import usersRouter from './routes/users';
import projectsRouter from './routes/projects';
import billingRouter from './routes/billing';
import contactsRouter from './routes/contacts';
import reportsRouter from './routes/reports';
import notificationsRouter from './routes/notifications';
import chatRouter from './routes/chat';
import upiRouter from './routes/upi';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Configure Middleware
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const corsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000').split(',').map(o => o.trim());
    if (corsOrigins.includes('*') || corsOrigins.includes(origin) || origin.endsWith('.vercel.app') || origin.startsWith('http://localhost:')) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Define routes
app.use('/api/auth', authRouter);
app.use('/api/stats', statsRouter);
app.use('/api/properties', propertiesRouter);
app.use('/api/drafts', draftsRouter);
app.use('/api/users', usersRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/billing', billingRouter);
app.use('/api/chat', chatRouter);
app.use('/api/contacts', contactsRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/upi', upiRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Start listening
app.listen(PORT, () => {
  console.log(`[Server] Express server running on port ${PORT}`);
});
