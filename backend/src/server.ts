import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { Prisma, PrismaClient } from '@prisma/client';

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

// Auto-reset sequences on PostgreSQL connection to prevent unique constraint failures (P2002)
const prismaForSeq = new PrismaClient();
async function resetPostgresSequences() {
  const dbUrl = process.env.DATABASE_URL || '';
  if (dbUrl.startsWith('postgres') || dbUrl.startsWith('postgresql')) {
    console.log('[Startup] PostgreSQL database URL detected. Ensuring sequences are in sync...');
    const sequenceTables = [
      { name: 'user_type_master', id: 'user_type_id' },
      { name: 'security_que_master', id: 'sq_id' },
      { name: 'state_master', id: 'state_id' },
      { name: 'user_master', id: 'user_id' },
      { name: 'project_master', id: 'project_id' },
      { name: 'olb_master', id: 'olb_id' },
      { name: 'chat_master', id: 'chat_id' },
      { name: 'adv_payment_master', id: 'adv_pay_id' },
      { name: 'notification_master', id: 'notification_id' },
      { name: 'adv_payment_history_master', id: 'adv_pay_history_id' },
      { name: 'company_master', id: 'company_id' },
      { name: 'handling_charges', id: 'charge_id' },
      { name: 'payment_gateway_master', id: 'pg_id' },
      { name: 'invoice_master', id: 'invoice_id' },
      { name: 'invoice_payment_master', id: 'ip_id' },
      { name: 'login_history', id: 'login_id' },
      { name: 'olb_item_master', id: 'olb_item_id' },
      { name: 'transaction_history', id: 'th_id' }
    ];

    for (const table of sequenceTables) {
      try {
        const query = `SELECT setval(pg_get_serial_sequence('"${table.name}"', '${table.id}'), COALESCE(MAX("${table.id}"), 0) + 1, false) FROM "${table.name}"`;
        await prismaForSeq.$queryRawUnsafe(query);
      } catch (err: any) {
        // Suppress warning if sequence or relation doesn't exist
      }
    }
    console.log('[Startup] PostgreSQL sequences reset completed successfully.');
  }
}

// Start listening
app.listen(PORT, () => {
  console.log(`[Server] Express server running on port ${PORT}`);
  resetPostgresSequences()
    .catch(err => console.error('[Startup] Failed to reset sequences:', err))
    .finally(() => prismaForSeq.$disconnect());
});
