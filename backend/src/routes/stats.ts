import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const router = Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'dainna-secret-super-key-2.0';

// Authentication middleware for stats
async function authMiddleware(req: Request, res: Response, next: any): Promise<any> {
  const token = req.cookies?.auth_token || req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ Error: 'Unauthorized' });
  }

  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    req.body.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ Error: 'Invalid session' });
  }
}

// Helper to get start and end of today
function getTodayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

// Helper to get start and end of current month
function getMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

// Admin stats
router.get('/admin', authMiddleware, async (req: Request, res: Response): Promise<any> => {
  try {
    const { start: todayStart, end: todayEnd } = getTodayRange();
    const { start: monthStart, end: monthEnd } = getMonthRange();

    // 1. Agents Today Success Transaction
    // SQL: SELECT invoice_id FROM invoice_master WHERE payment_status='1' AND adv_payment_status='0'
    const totalAgentTodaysSuccessTrans = await prisma.invoice_master.count({
      where: {
        payment_status: 1,
        adv_payment_status: 0
      }
    });

    // 2. Agent Failed Transactions
    // SQL: SELECT invoice_id FROM invoice_master WHERE payment_status='2'
    const totalAgentFailedTransactions = await prisma.invoice_master.count({
      where: {
        payment_status: 2
      }
    });

    // 3. Monthly Completed Transactions (Current Month Completed)
    // SQL: SELECT olb_id FROM olb_master WHERE draft_status='4' AND DATE(accept_date)>='...' AND DATE(accept_date)<='...'
    const totalCurrentMonthCompleted = await prisma.olb.count({
      where: {
        draftStatus: 4,
        acceptDate: { gte: monthStart, lte: monthEnd }
      }
    });

    // 4. Total Completed Transactions
    // SQL: SELECT olb_id FROM olb_master WHERE draft_status='4'
    const totalCompletedTransactions = await prisma.olb.count({
      where: {
        draftStatus: 4
      }
    });

    // 5. Send to Adv Transaction (Total Send to Adv Transactions)
    // SQL: SELECT o.olb_id FROM olb_master o JOIN invoice_master i ON o.olb_id=i.olb_id WHERE o.draft_status='3' AND i.adv_payment_status='4' GROUP BY i.adv_pay_id
    const sendToAdvGroups = await prisma.invoice_master.groupBy({
      by: ['adv_pay_id'],
      where: {
        adv_payment_status: 4,
        olb_master: {
          draftStatus: 3
        }
      }
    });
    const totalSendToAdvTrans = sendToAdvGroups.filter(g => g.adv_pay_id !== null).length;

    // 6. Adv Success Transaction
    // SQL: SELECT i.invoice_id FROM invoice_master i JOIN olb_master o ON i.olb_id=o.olb_id JOIN project_master p ON i.project_id=p.project_id WHERE i.adv_payment_status='1' AND o.draft_status='3' GROUP BY i.adv_pay_id
    const advSuccessGroups = await prisma.invoice_master.groupBy({
      by: ['adv_pay_id'],
      where: {
        adv_payment_status: 1,
        olb_master: {
          draftStatus: 3
        }
      }
    });
    const totalAdvTodaySuccessTrans = advSuccessGroups.filter(g => g.adv_pay_id !== null).length;

    // 7. Adv Failed Transactions
    // SQL: SELECT invoice_id FROM invoice_master WHERE adv_payment_status='2' GROUP BY adv_pay_id
    const advFailedGroups = await prisma.invoice_master.groupBy({
      by: ['adv_pay_id'],
      where: {
        adv_payment_status: 2
      }
    });
    const totalAdvFailedTransactions = advFailedGroups.filter(g => g.adv_pay_id !== null).length;

    // 8. Today Completed Transaction
    // SQL: SELECT olb_id FROM olb_master WHERE draft_status='4' AND DATE(accept_date)='...'
    const totalTodaysCompleted = await prisma.olb.count({
      where: {
        draftStatus: 4,
        acceptDate: { gte: todayStart, lte: todayEnd }
      }
    });

    // 9. Total Customized Draft
    // SQL: SELECT olb_id FROM olb_master WHERE customize_readymade='1'
    const totalCustomizedDraft = await prisma.olb.count({
      where: {
        customizeReadymade: 1
      }
    });

    // 10. Total Readymade Draft
    // SQL: SELECT olb_id FROM olb_master WHERE customize_readymade='2'
    const totalReadymadeDraft = await prisma.olb.count({
      where: {
        customizeReadymade: 2
      }
    });

    // 11. Total Open Land Transaction
    // SQL: SELECT olb_id FROM olb_master WHERE type='1'
    const totalOpenLandTransaction = await prisma.olb.count({
      where: {
        type: 1
      }
    });

    // 12. Total Building Transaction
    // SQL: SELECT olb_id FROM olb_master WHERE type='2'
    const totalBuildingTransaction = await prisma.olb.count({
      where: {
        type: 2
      }
    });

    // 13. Total Agent
    // SQL: SELECT user_id FROM user_master WHERE user_type_id='3' AND status='1'
    const totalAgent = await prisma.user.count({
      where: {
        userTypeId: 3,
        status: 1
      }
    });

    // 14. Total Projects
    // SQL: SELECT project_id FROM project_master
    const totalProject = await prisma.project.count();

    return res.json({
      TotalAgentTodaysSuccessTrans: totalAgentTodaysSuccessTrans,
      TotalAgentFailedTransactions: totalAgentFailedTransactions,
      TotalCurrentMonthCompleted: totalCurrentMonthCompleted,
      TotalCompletedTransactions: totalCompletedTransactions,
      TotalSendToAdvTrans: totalSendToAdvTrans,
      TotalAdvTodaySuccessTrans: totalAdvTodaySuccessTrans,
      TotalAdvFailedTransactions: totalAdvFailedTransactions,
      TotalTodaysCompleted: totalTodaysCompleted,
      TotalCustomizedDraft: totalCustomizedDraft,
      TotalReadymadeDraft: totalReadymadeDraft,
      TotalOpenLandTransaction: totalOpenLandTransaction,
      TotalBuildingTransaction: totalBuildingTransaction,
      TotalAgent: totalAgent,
      TotalProject: totalProject
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return res.status(500).json({ Error: 'Internal Server Error' });
  }
});

// Agent stats
router.get('/agent', authMiddleware, async (req: Request, res: Response): Promise<any> => {
  const user = req.body.user;
  try {
    const { start: todayStart, end: todayEnd } = getTodayRange();
    const { start: monthStart, end: monthEnd } = getMonthRange();

    // Get Agent's WorkingCity
    const agentDetails = await prisma.user.findUnique({
      where: { userId: user.userId },
      select: { workingCity: true }
    });
    const workingCity = agentDetails?.workingCity || '';

    // Success transactions: count invoices with payment_status=1, addedby=user.userId, agent_payment_received_date today
    const totalSuccessTransaction = await prisma.invoice_master.count({
      where: {
        addedby: user.userId,
        payment_status: 1,
        agent_payment_received_date: { gte: todayStart, lte: todayEnd }
      }
    });

    // Failed transactions: count invoices with payment_status=2, addedby=user.userId
    const totalAgentFailedTransactions = await prisma.invoice_master.count({
      where: {
        addedby: user.userId,
        payment_status: 2
      }
    });

    const totalTodaysCompleted = await prisma.olb.count({
      where: {
        addedby: user.userId,
        draftStatus: 4,
        acceptDate: { gte: todayStart, lte: todayEnd }
      }
    });

    const totalCurrentMonthCompleted = await prisma.olb.count({
      where: {
        addedby: user.userId,
        draftStatus: 4,
        acceptDate: { gte: monthStart, lte: monthEnd }
      }
    });

    // Project with City: count projects where city matches agent's workingCity
    const totalAgentProjectWithCity = await prisma.project.count({
      where: {
        city: workingCity
      }
    });

    const totalAgentCompletedDraft = await prisma.olb.count({
      where: {
        addedby: user.userId,
        draftStatus: 4
      }
    });

    const totalPreparedDrafts = await prisma.olb.count({
      where: {
        addedby: user.userId,
        draftStatus: 1,
        agreementAddeddate: { not: null }
      }
    });

    return res.json({
      TotalSuccessTransaction: totalSuccessTransaction,
      TotalAgentFailedTransactions: totalAgentFailedTransactions,
      TotalTodaysCompleted: totalTodaysCompleted,
      TotalCurrentMonthCompleted: totalCurrentMonthCompleted,
      TotalAgentProjectWithCity: totalAgentProjectWithCity,
      TotalAgentCompletedDraft: totalAgentCompletedDraft,
      TotalPreparedDrafts: totalPreparedDrafts
    });
  } catch (error) {
    console.error('Agent stats error:', error);
    return res.status(500).json({ Error: 'Internal Server Error' });
  }
});

// Advocate stats
router.get('/advocate', authMiddleware, async (req: Request, res: Response): Promise<any> => {
  const user = req.body.user;
  try {
    const { start: todayStart, end: todayEnd } = getTodayRange();
    const { start: monthStart, end: monthEnd } = getMonthRange();

    // 1. Received Transactions: Grouped payouts with status 0 (Pending/Received from admin)
    const todayTransactionsGroups = await prisma.invoice_master.groupBy({
      by: ['adv_pay_id'],
      where: {
        advocate_id: user.userId,
        adv_payment_master: {
          payment_status: 0
        }
      }
    });
    const totalAdvTodayTransactions = todayTransactionsGroups.filter(g => g.adv_pay_id !== null).length;

    // 2. Success Transactions: Grouped payouts with status 1 where draftStatus is 3
    const successTransactionsGroups = await prisma.invoice_master.groupBy({
      by: ['adv_pay_id'],
      where: {
        advocate_id: user.userId,
        adv_payment_status: 1,
        olb_master: {
          draftStatus: 3
        }
      }
    });
    const totalAdvSuccessTransactions = successTransactionsGroups.filter(g => g.adv_pay_id !== null).length;

    // 3. Failed Transactions: Grouped payouts with status 2
    const failedTransactionsGroups = await prisma.invoice_master.groupBy({
      by: ['adv_pay_id'],
      where: {
        advocate_id: user.userId,
        adv_payment_status: 2
      }
    });
    const totalAdvFailedTransactions = failedTransactionsGroups.filter(g => g.adv_pay_id !== null).length;

    // 4. Today's Completed Drafts
    const totalTodaysCompleted = await prisma.olb.count({
      where: {
        draftStatus: 4,
        acceptDate: { gte: todayStart, lte: todayEnd },
        invoice_master: {
          some: {
            advocate_id: user.userId
          }
        }
      }
    });

    // 5. Total Agents in the advocate's project city
    const advocateProject = await prisma.project.findFirst({
      where: { advocate_id: user.userId }
    });
    const projectCity = advocateProject?.city || '';
    const totalAgentWithCity = await prisma.user.count({
      where: {
        userTypeId: 3,
        workingCity: projectCity
      }
    });

    // 6. Current Month Completed
    const totalCurrentMonthCompleted = await prisma.olb.count({
      where: {
        draftStatus: 4,
        acceptDate: { gte: monthStart, lte: monthEnd },
        invoice_master: {
          some: {
            advocate_id: user.userId
          }
        }
      }
    });

    // 7. Total Completed Draft
    const totalAdvCompletedTransactions = await prisma.olb.count({
      where: {
        draftStatus: 4,
        invoice_master: {
          some: {
            advocate_id: user.userId
          }
        }
      }
    });

    return res.json({
      TotalAdvTodayTransactions: totalAdvTodayTransactions,
      TotalAdvSuccessTransactions: totalAdvSuccessTransactions,
      TotalAdvFailedTransactions: totalAdvFailedTransactions,
      TotalTodaysCompleted: totalTodaysCompleted,
      TotalAgentWithCity: totalAgentWithCity,
      TotalCurrentMonthCompleted: totalCurrentMonthCompleted,
      TotalAdvCompletedTransactions: totalAdvCompletedTransactions
    });
  } catch (error) {
    console.error('Advocate stats error:', error);
    return res.status(500).json({ Error: 'Internal Server Error' });
  }
});

export default router;
