import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { processSuccessfulPayout } from './upi';

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

// GET /api/billing/invoices
router.get('/invoices', authMiddleware, async (req: Request, res: Response): Promise<any> => {
  const user = req.body.currentUser;
  const status = req.query.status ? parseInt(req.query.status as string) : undefined;
  const projectId = req.query.projectId ? parseInt(req.query.projectId as string) : undefined;
  const stateId = req.query.stateId ? parseInt(req.query.stateId as string) : undefined;
  const city = req.query.city as string;
  const excludeCompleted = req.query.excludeCompleted === 'true';

  try {
    const whereClause: any = {};

    // Filter by role
    if (user.userTypeId === 3) {
      whereClause.addedby = user.userId;
    } else if (user.userTypeId === 4) {
      whereClause.advocate_id = user.userId;
    }

    // Filter by status (e.g. 1 = Success, 2 = Failed, 0 = Pending)
    if (status !== undefined) {
      if (status === 1) {
        whereClause.payment_status = 1;
        whereClause.adv_payment_status = 1;
      } else if (status === 2) {
        whereClause.OR = [
          { payment_status: 2 },
          { adv_payment_status: 2 }
        ];
      } else if (status === 5) {
        whereClause.OR = [
          { payment_status: 5 },
          { adv_payment_status: 5 }
        ];
      } else {
        whereClause.payment_status = status;
      }
    } else {
      whereClause.OR = [
        {
          payment_status: { in: [0, 4] }
        },
        {
          payment_status: null
        },
        {
          payment_status: 1,
          OR: [
            { adv_payment_status: { in: [0, 4] } },
            { adv_payment_status: null }
          ]
        }
      ];
    }

    if (excludeCompleted) {
      whereClause.olb_master = {
        draftStatus: { not: 4 }
      };
    }

    // Filter by project
    if (projectId !== undefined) {
      whereClause.project_id = projectId;
    }

    // Filter by state
    if (stateId !== undefined) {
      whereClause.state_id = stateId;
    }

    // Filter by city (on project_master)
    if (city) {
      whereClause.project_master = {
        city: city
      };
    }

    const invoices = await prisma.invoice_master.findMany({
      where: whereClause,
      include: {
        project_master: true,
        olb_master: true,
        state_master: true,
        user_master_invoice_master_addedbyTouser_master: true,
        user_master_invoice_master_advocate_idTouser_master: true
      },
      orderBy: { invoice_id: 'desc' }
    });

    const formattedInvoices = invoices.map(inv => ({
      invoiceId: inv.invoice_id,
      invoiceNo: inv.invoice_no,
      invNo: inv.inv_no,
      invoiceDate: inv.invoice_date,
      projectName: inv.project_master?.projectName || 'N/A',
      projectCity: inv.project_master?.city || 'N/A',
      projectState: inv.state_master?.state_name || 'N/A',
      size: inv.size ? Number(inv.size) : 0,
      rate: inv.rate || 0,
      finalRate: inv.final_rate || 0,
      total: inv.total || 0,
      sgstAmount: inv.sgst_amount ? Number(inv.sgst_amount) : 0,
      cgstAmount: inv.cgst_amount ? Number(inv.cgst_amount) : 0,
      grandtotal: inv.grandtotal ? Number(inv.grandtotal) : 0,
      paymentStatus: inv.payment_status,
      addeddate: inv.addeddate,
      purchaserName: inv.olb_master ? `${inv.olb_master.purchaserFirstName || ''} ${inv.olb_master.purchaserLastName || ''}`.trim() : 'N/A',
      ownerName: inv.olb_master ? `${inv.olb_master.ownerFirstName || ''} ${inv.olb_master.ownerLastName || ''}`.trim() : 'N/A',
      advocateName: inv.user_master_invoice_master_advocate_idTouser_master
        ? `${inv.user_master_invoice_master_advocate_idTouser_master.firstname || ''} ${inv.user_master_invoice_master_advocate_idTouser_master.surname || ''}`.trim()
        : 'N/A',
      agentName: inv.user_master_invoice_master_addedbyTouser_master
        ? `${inv.user_master_invoice_master_addedbyTouser_master.firstname || ''} ${inv.user_master_invoice_master_addedbyTouser_master.surname || ''}`.trim()
        : 'N/A',
      utr: inv.transaction_ref_no || 'N/A',
      transactionRemarks: inv.transaction_remarks || 'N/A',
      paymentRemarks: inv.payment_remarks || '',
      pgId: inv.pg_id,
      advPaymentStatus: inv.adv_payment_status,
      advocateId: inv.advocate_id,
      olbId: inv.olb_id
    }));

    return res.json({ Status: 100, Invoices: formattedInvoices });
  } catch (error) {
    console.error('List invoices error:', error);
    return res.status(500).json({ Error: 'Internal Server Error' });
  }
});

// GET /api/billing/transaction-history
router.get('/transaction-history', authMiddleware, async (req: Request, res: Response): Promise<any> => {
  const user = req.body.currentUser;
  const status = req.query.status ? parseInt(req.query.status as string) : -1;
  const stateId = req.query.stateId ? parseInt(req.query.stateId as string) : undefined;
  const city = req.query.city as string;
  const projectId = req.query.projectId ? parseInt(req.query.projectId as string) : undefined;
  const startDateStr = req.query.startDate as string;
  const endDateStr = req.query.endDate as string;

  try {
    const whereClause: any = {
      type: 1
    };

    // Filter by role
    if (user.userTypeId === 3) {
      whereClause.invoice_master = {
        addedby: user.userId
      };
    } else if (user.userTypeId === 4) {
      whereClause.invoice_master = {
        advocate_id: user.userId
      };
    } else {
      whereClause.invoice_master = {};
    }

    if (status !== -1) {
      whereClause.payment_status = status;
    }

    if (stateId !== undefined) {
      whereClause.invoice_master.state_id = stateId;
    }

    if (city) {
      whereClause.invoice_master.project_master = {
        city: city
      };
    }

    if (projectId !== undefined) {
      whereClause.invoice_master.project_id = projectId;
    }

    if (startDateStr && endDateStr) {
      const start = new Date(startDateStr);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDateStr);
      end.setHours(23, 59, 59, 999);
      whereClause.transaction_date = {
        gte: start,
        lte: end
      };
    }

    const transactions = await prisma.transaction_history.findMany({
      where: whereClause,
      include: {
        invoice_master: {
          include: {
            project_master: true,
            user_master_invoice_master_addedbyTouser_master: true
          }
        }
      },
      orderBy: { th_id: 'desc' }
    });

    const formattedTransactions = transactions.map(t => ({
      thId: t.th_id,
      amount: t.amount ? Number(t.amount) : 0,
      paymentStatus: t.payment_status,
      paymentRemarks: t.payment_remarks || '',
      transactionRefNo: t.transaction_ref_no || 'N/A',
      transactionRemarks: t.transaction_remarks || 'N/A',
      transactionDate: t.transaction_date,
      screenshot: t.screenshot || '',
      invoiceNo: t.invoice_master?.inv_no || 'N/A',
      projectName: t.invoice_master?.project_master?.projectName || 'N/A',
      projectCity: t.invoice_master?.project_master?.city || 'N/A',
      agentName: t.invoice_master?.user_master_invoice_master_addedbyTouser_master 
        ? `${t.invoice_master.user_master_invoice_master_addedbyTouser_master.firstname || ''} ${t.invoice_master.user_master_invoice_master_addedbyTouser_master.surname || ''}`.trim()
        : 'N/A'
    }));

    return res.json({ Status: 100, Transactions: formattedTransactions });
  } catch (error) {
    console.error('List transaction history error:', error);
    return res.status(500).json({ Error: 'Internal Server Error' });
  }
});

// POST /api/billing/invoices/add
router.post('/invoices/add', authMiddleware, async (req: Request, res: Response): Promise<any> => {
  const user = req.body.currentUser;
  const {
    OLBID, AdvocateID, ProjectID, StateID, Size, SizeWidth, SizeHeight, Rate, HandlingChargesRate
  } = req.body;

  try {
    const olbIdVal = parseInt(OLBID);
    const projectIdVal = parseInt(ProjectID);
    const advocateIdVal = parseInt(AdvocateID);
    const stateIdVal = StateID ? parseInt(StateID) : null;

    // Get next InvoiceNo (global max + 1)
    const allInvoices = await prisma.invoice_master.findMany({
      select: { invoice_no: true }
    });
    let invoiceNoVal = 1;
    if (allInvoices.length > 0) {
      const nos = allInvoices.map(i => parseInt(i.invoice_no || '0')).filter(n => !isNaN(n));
      if (nos.length > 0) {
        invoiceNoVal = Math.max(...nos) + 1;
      }
    }

    // Get next CustomerID (project max + 1)
    const projectInvoices = await prisma.invoice_master.findMany({
      where: { project_id: projectIdVal },
      select: { customer_id: true }
    });
    let customerIdVal = 1;
    if (projectInvoices.length > 0) {
      const ids = projectInvoices.map(i => parseInt(i.customer_id || '0')).filter(id => !isNaN(id));
      if (ids.length > 0) {
        customerIdVal = Math.max(...ids) + 1;
      }
    }

    // Get State Code
    let stateCode = '00';
    if (stateIdVal) {
      const state = await prisma.state_master.findUnique({
        where: { state_id: stateIdVal }
      });
      if (state && state.state_code) {
        stateCode = state.state_code;
      }
    }

    const invNo = `${stateCode}/${String(invoiceNoVal).padStart(4, '0')}`;

    // Calculate math
    const sizeVal = parseFloat(Size) || 0;
    const sizeWidthVal = parseFloat(SizeWidth) || 0;
    const sizeHeightVal = parseFloat(SizeHeight) || 0;
    const rateVal = parseFloat(Rate) || 0;
    const handlingChargesRateVal = parseFloat(HandlingChargesRate) || 0;

    const finalRateVal = Math.round((rateVal + (rateVal * handlingChargesRateVal / 100)) * 100) / 100;
    const tempRateVal = Math.round((rateVal * handlingChargesRateVal / 100) * 100) / 100;
    const totalVal = Math.round((sizeVal * finalRateVal) * 100) / 100;
    const cgstAmountVal = Math.round((totalVal * 2.5 / 100) * 100) / 100;
    const sgstAmountVal = Math.round((totalVal * 2.5 / 100) * 100) / 100;
    const handlingChargesAmountVal = Math.round((tempRateVal * sizeVal) * 100) / 100;
    const grandTotalVal = Math.round((totalVal + cgstAmountVal + sgstAmountVal) * 100) / 100;

    const invoice = await prisma.invoice_master.create({
      data: {
        olb_id: olbIdVal,
        project_id: projectIdVal,
        advocate_id: advocateIdVal,
        customer_id: String(customerIdVal),
        state_id: stateIdVal,
        inv_no: invNo,
        invoice_no: String(invoiceNoVal),
        invoice_date: new Date(),
        size_width: sizeWidthVal,
        size_height: sizeHeightVal,
        size: sizeVal,
        rate: rateVal,
        final_rate: finalRateVal,
        total: totalVal,
        sgst_rate: 2.5,
        sgst_amount: sgstAmountVal,
        cgst_rate: 2.5,
        cgst_amount: cgstAmountVal,
        handling_charge_rate: handlingChargesRateVal,
        handling_charge_amount: handlingChargesAmountVal,
        grandtotal: grandTotalVal,
        payment_status: 0,
        addedby: user.userId,
        addeddate: new Date()
      }
    });

    return res.json({ Status: 2, InvoiceID: invoice.invoice_id, Msg: 'Invoice Created Successfully.' });
  } catch (error) {
    console.error('Create invoice error:', error);
    return res.status(500).json({ Status: 1, Msg: 'Failed to create invoice.' });
  }
});

// POST /api/billing/invoices/update-payment
router.post('/invoices/update-payment', authMiddleware, async (req: Request, res: Response): Promise<any> => {
  const user = req.body.currentUser;
  const { InvoiceID, OLBID, Amount, TransactionRefNo, TransactionRemarks, ScreenshotBase64, ScreenshotName } = req.body;

  try {
    const invoiceIdVal = parseInt(InvoiceID);
    const olbIdVal = parseInt(OLBID);
    const amountVal = parseFloat(Amount) || 0;

    // 1. Update invoice status to 4 (Waiting approval)
    await prisma.invoice_master.update({
      where: { invoice_id: invoiceIdVal },
      data: {
        payment_status: 4,
        transaction_ref_no: TransactionRefNo,
        transaction_remarks: TransactionRemarks || '',
        pg_id: 1,
        adv_payment_status: 0
      }
    });

    // 2. Update draft status to 2 (Waiting for advocate)
    await prisma.olb.update({
      where: { olbId: olbIdVal },
      data: {
        draftStatus: 2,
        sentDate: new Date()
      }
    });

    // 3. Insert transaction history entry
    const th = await prisma.transaction_history.create({
      data: {
        type: 1,
        invoice_id: invoiceIdVal,
        olb_id: olbIdVal,
        amount: amountVal,
        payment_status: 4,
        transaction_ref_no: TransactionRefNo,
        transaction_remarks: TransactionRemarks || '',
        transaction_date: new Date()
      }
    });

    // 4. File upload (Screenshot)
    let screenshotNameSaved = '';
    if (ScreenshotBase64 && ScreenshotName) {
      const fs = require('fs');
      const path = require('path');
      const uploadDir = path.join(process.cwd(), 'uploads', 'payment-screenshot');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      const extension = ScreenshotName.split('.').pop() || 'jpg';
      screenshotNameSaved = `Screenshot_${th.th_id}.${extension}`;
      const filePath = path.join(uploadDir, screenshotNameSaved);
      const buffer = Buffer.from(ScreenshotBase64, 'base64');
      fs.writeFileSync(filePath, buffer);

      // Save filename to transaction history
      await prisma.transaction_history.update({
        where: { th_id: th.th_id },
        data: { screenshot: screenshotNameSaved }
      });
    }

    // 5. Create Notification
    const agentName = `${user.firstname || ''} ${user.surname || ''}`.trim() || 'Agent';
    const invoice = await prisma.invoice_master.findUnique({
      where: { invoice_id: invoiceIdVal },
      include: { project_master: true }
    });
    const invoiceNo = invoice?.inv_no || 'N/A';
    const projectName = invoice?.project_master?.projectName || 'N/A';

    const msg = `Payment Received Against New Invoice - ${invoiceNo} Of Project - ${projectName} From : ${agentName}`;

    await prisma.notification.create({
      data: {
        fromId: user.userId,
        olbId: olbIdVal,
        action: 'On Payment Sent',
        title: 'New Payment Received',
        message: msg,
        status: 0,
        sendtime: new Date()
      }
    });

    return res.json({ Status: 4, Msg: 'Invoice Payment Submitted Successfully.' });
  } catch (error) {
    console.error('Update payment error:', error);
    return res.status(500).json({ Status: 3, Msg: 'Failed to submit invoice payment.' });
  }
});

// GET /api/billing/rates (Calculate agent rates)

router.get('/rates', authMiddleware, async (req: Request, res: Response): Promise<any> => {
  const currentUser = req.body.currentUser;

  try {
    const user = await prisma.user.findUnique({
      where: { userId: currentUser.userId }
    });

    if (!user || !user.workingCity) {
      return res.status(400).json({ Status: 0, Msg: 'Working city not found for this user.' });
    }

    const handlingCharges = await prisma.handling_charges.findMany({
      where: { city: user.workingCity },
      include: {
        state_master: true,
        project_master: true
      }
    });

    const advocateIds = handlingCharges
      .map(c => c.project_master?.advocate_id)
      .filter((id): id is number => id !== null && id !== undefined);

    const advocates = await prisma.user.findMany({
      where: { userId: { in: advocateIds } },
      select: { userId: true, ratePerSqmt: true }
    });

    const advocateRateMap = new Map(advocates.map(a => [a.userId, a.ratePerSqmt || 0]));

    const calculatedRates = handlingCharges.map(charge => {
      const advId = charge.project_master?.advocate_id;
      const ratePerSqmt = advId ? (advocateRateMap.get(advId) || 0) : 0;
      const chargeInPerc = charge.charge_in_perc || 0;
      const handlingChargeAmount = (ratePerSqmt * chargeInPerc) / 100;
      const finalRate = Math.round((ratePerSqmt + handlingChargeAmount) * 100) / 100;

      return {
        chargeId: charge.charge_id,
        stateName: charge.state_master?.state_name || 'N/A',
        city: charge.city,
        projectName: charge.project_master?.projectName || 'N/A',
        rate: finalRate
      };
    });

    return res.json({ Status: 100, Rates: calculatedRates });
  } catch (error) {
    console.error('Calculate rates error:', error);
    return res.status(500).json({ Error: 'Internal Server Error' });
  }
});

// GET /api/billing/handling-charges
router.get('/handling-charges', authMiddleware, async (req: Request, res: Response): Promise<any> => {
  const stateId = req.query.stateId ? parseInt(req.query.stateId as string) : undefined;
  const city = req.query.city as string | undefined;

  try {
    const whereClause: any = {};
    if (stateId !== undefined) {
      whereClause.state_id = stateId;
    }
    if (city) {
      whereClause.city = city;
    }

    const charges = await prisma.handling_charges.findMany({
      where: whereClause,
      include: {
        state_master: true,
        project_master: true
      },
      orderBy: { charge_id: 'desc' }
    });

    const formattedCharges = charges.map(c => ({
      chargeId: c.charge_id,
      stateId: c.state_id,
      stateName: c.state_master?.state_name || 'N/A',
      city: c.city,
      projectId: c.project_id,
      projectName: c.project_master?.projectName || 'N/A',
      chargeInPerc: c.charge_in_perc,
      addeddate: c.addeddate
    }));

    return res.json({ Status: 100, Charges: formattedCharges });
  } catch (error) {
    console.error('List handling charges error:', error);
    return res.status(500).json({ Error: 'Internal Server Error' });
  }
});

// POST /api/billing/handling-charges (Create charge)
router.post('/handling-charges', authMiddleware, async (req: Request, res: Response): Promise<any> => {
  const { StateID, City, ProjectID, ChargesInPerc } = req.body;

  if (!StateID || !City || !ProjectID || ChargesInPerc === undefined) {
    return res.status(400).json({ Status: 0, Msg: 'State, City, Project, and Percentage charge are required.' });
  }

  try {
    const stateIdVal = parseInt(StateID);
    const projectIdVal = parseInt(ProjectID);
    const chargeVal = parseFloat(ChargesInPerc);

    // Check duplicate
    const duplicate = await prisma.handling_charges.findFirst({
      where: {
        state_id: stateIdVal,
        city: City,
        project_id: projectIdVal
      }
    });

    if (duplicate) {
      return res.status(400).json({ Status: 0, Msg: 'Handling charge already exists for this Project configuration.' });
    }

    const newCharge = await prisma.handling_charges.create({
      data: {
        state_id: stateIdVal,
        city: City,
        project_id: projectIdVal,
        charge_in_perc: chargeVal,
        addedby: req.body.currentUser.userId,
        addeddate: new Date()
      }
    });

    return res.json({ Status: 2, Msg: 'Handling charge created successfully.', ChargeID: newCharge.charge_id });
  } catch (error) {
    console.error('Create handling charge error:', error);
    return res.status(500).json({ Status: 1, Msg: 'Failed to create handling charge.' });
  }
});

// PUT /api/billing/handling-charges/:id
router.put('/handling-charges/:id', authMiddleware, async (req: Request, res: Response): Promise<any> => {
  const chargeId = parseInt(req.params.id);
  const { StateID, City, ProjectID, ChargesInPerc } = req.body;

  try {
    const stateIdVal = parseInt(StateID);
    const projectIdVal = parseInt(ProjectID);
    const chargeVal = parseFloat(ChargesInPerc);

    await prisma.handling_charges.update({
      where: { charge_id: chargeId },
      data: {
        state_id: stateIdVal,
        city: City,
        project_id: projectIdVal,
        charge_in_perc: chargeVal,
        modifiedby: req.body.currentUser.userId,
        modifieddate: new Date()
      }
    });

    return res.json({ Status: 2, Msg: 'Handling charge updated successfully.' });
  } catch (error) {
    console.error('Update handling charge error:', error);
    return res.status(500).json({ Status: 1, Msg: 'Failed to update handling charge.' });
  }
});

// DELETE /api/billing/handling-charges/:id
router.delete('/handling-charges/:id', authMiddleware, async (req: Request, res: Response): Promise<any> => {
  const chargeId = parseInt(req.params.id);
  try {
    await prisma.handling_charges.delete({
      where: { charge_id: chargeId }
    });
    return res.json({ Status: 6, Msg: 'Handling charge removed successfully.' });
  } catch (error) {
    console.error('Delete handling charge error:', error);
    return res.status(500).json({ Status: 5, Msg: 'Failed to delete handling charge.' });
  }
});

// GET /api/billing/similar-properties (Filter matching properties)
router.get('/similar-properties', authMiddleware, async (req: Request, res: Response): Promise<any> => {
  const citySurveyNo = req.query.citySurveyNo as string;
  const taluka = req.query.taluka as string;
  const village = req.query.village as string;

  try {
    const properties = await prisma.olb.findMany({
      where: {
        OR: [
          { citySurveyNo: citySurveyNo || undefined },
          { taluka: taluka || undefined },
          { village: village || undefined }
        ]
      },
      orderBy: { olbId: 'desc' }
    });

    return res.json({ Status: 100, Properties: properties });
  } catch (error) {
    console.error('Fetch similar properties error:', error);
    return res.status(500).json({ Error: 'Failed to retrieve similar properties.' });
  }
});

// GET /api/billing/project-details/:projectId
router.get('/project-details/:projectId', authMiddleware, async (req: Request, res: Response): Promise<any> => {
  const projectId = parseInt(req.params.projectId);
  try {
    const project = await prisma.project.findUnique({
      where: { projectId }
    });
    if (!project) {
      return res.status(404).json({ Error: 'Project not found.' });
    }
    
    // Advocate Rate
    let ratePerSqmt = 0;
    if (project.advocate_id) {
      const advocate = await prisma.user.findUnique({
        where: { userId: project.advocate_id },
        select: { ratePerSqmt: true }
      });
      ratePerSqmt = advocate?.ratePerSqmt || 0;
    }
    
    // Handling Charge
    const charge = await prisma.handling_charges.findFirst({
      where: { project_id: projectId }
    });
    const chargeInPerc = charge?.charge_in_perc || 0;
    
    return res.json({
      Status: 100,
      AdvocateID: project.advocate_id,
      StateID: project.state_id,
      RatePerSQMT: ratePerSqmt,
      ChargesinPerc: chargeInPerc
    });
  } catch (error) {
    console.error('Get project billing details error:', error);
    return res.status(500).json({ Error: 'Internal Server Error' });
  }
});

// GET /api/billing/invoices/:id
router.get('/invoices/:id', authMiddleware, async (req: Request, res: Response): Promise<any> => {
  const invoiceId = parseInt(req.params.id);
  try {
    const invoice = await prisma.invoice_master.findUnique({
      where: { invoice_id: invoiceId },
      include: {
        project_master: true,
        olb_master: true,
        user_master_invoice_master_advocate_idTouser_master: true
      }
    });

    if (!invoice) {
      return res.status(404).json({ Status: 0, Msg: 'Invoice not found.' });
    }

    // Find the latest transaction history screenshot if any
    const latestTx = await prisma.transaction_history.findFirst({
      where: { invoice_id: invoiceId },
      orderBy: { th_id: 'desc' },
      select: { screenshot: true }
    });

    return res.json({
      Status: 100,
      Invoice: {
        invoiceId: invoice.invoice_id,
        olbId: invoice.olb_id,
        projectId: invoice.project_id,
        invoiceNo: invoice.invoice_no,
        invNo: invoice.inv_no,
        invoiceDate: invoice.invoice_date,
        grandtotal: invoice.grandtotal,
        size: invoice.size,
        rate: invoice.rate,
        finalRate: invoice.final_rate,
        total: invoice.total,
        sgstRate: invoice.sgst_rate,
        sgstAmount: invoice.sgst_amount,
        cgstRate: invoice.cgst_rate,
        cgstAmount: invoice.cgst_amount,
        handlingChargeRate: invoice.handling_charge_rate,
        handlingChargeAmount: invoice.handling_charge_amount,
        paymentStatus: invoice.payment_status,
        paymentRemarks: invoice.payment_remarks,
        pgId: invoice.pg_id,
        addedby: invoice.addedby,
        projectName: invoice.project_master?.projectName || 'N/A',
        projectCity: invoice.project_master?.city || 'N/A',
        advocateName: invoice.user_master_invoice_master_advocate_idTouser_master
          ? `${invoice.user_master_invoice_master_advocate_idTouser_master.firstname || ''} ${invoice.user_master_invoice_master_advocate_idTouser_master.surname || ''}`.trim()
          : 'N/A',
        screenshot: latestTx?.screenshot || null,
        transactionRefNo: invoice.transaction_ref_no,
        transactionRemarks: invoice.transaction_remarks
      }
    });
  } catch (error) {
    console.error('Get single invoice error:', error);
    return res.status(500).json({ Error: 'Internal Server Error' });
  }
});

// GET /api/billing/draft-details/:olbId
router.get('/draft-details/:olbId', authMiddleware, async (req: Request, res: Response): Promise<any> => {
  const olbId = parseInt(req.params.olbId);
  try {
    const olb = await prisma.olb.findUnique({
      where: { olbId },
      include: {
        state_master: true,
        user_master_olb_master_addedbyTouser_master: {
          include: {
            state_master_user_master_state_idTostate_master: true
          }
        },
        invoice_master: {
          include: {
            project_master: {
              include: {
                state_master: true
              }
            },
            user_master_invoice_master_advocate_idTouser_master: {
              include: {
                state_master_user_master_state_idTostate_master: true
              }
            }
          }
        }
      }
    });

    if (!olb) {
      return res.status(404).json({ Status: 0, Msg: 'Draft not found.' });
    }

    return res.json({ Status: 100, Draft: olb });
  } catch (error) {
    console.error('Get single draft details error:', error);
    return res.status(500).json({ Error: 'Internal Server Error' });
  }
});

// POST /api/billing/invoices/update-payment-status (Admin Only)
router.post('/invoices/update-payment-status', authMiddleware, async (req: Request, res: Response): Promise<any> => {
  const user = req.body.currentUser;
  const { InvoiceID, OLBID, Status, Remarks, TransactionRefNo } = req.body;

  try {
    const invoiceIdVal = parseInt(InvoiceID);
    const olbIdVal = parseInt(OLBID);
    const statusVal = parseInt(Status); // 1 = Success, 2 = Failed
    const sentDate = new Date();

    // Update invoice payment status
    await prisma.invoice_master.update({
      where: { invoice_id: invoiceIdVal },
      data: {
        payment_status: statusVal,
        payment_remarks: Remarks || '',
        agent_payment_received_by: user.userId,
        agent_payment_received_date: sentDate
      }
    });

    if (statusVal === 1) {
      // Transition Draft status to 3 (Sent to Advocate) if currently at 2 (Waiting for Advocate)
      await prisma.olb.updateMany({
        where: {
          olbId: olbIdVal,
          draftStatus: 2
        },
        data: {
          draftStatus: 3,
          sentDate: sentDate
        }
      });

      // Auto-trigger payout immediately
      const autoUtr = `AUTO-ADV-${Math.floor(100000000000 + Math.random() * 900000000000)}`;
      await processSuccessfulPayout(invoiceIdVal, autoUtr, 'Automated payout upon manual payment verification', false);
    }

    // Update transaction history status for the matching transaction ref
    await prisma.transaction_history.updateMany({
      where: {
        invoice_id: invoiceIdVal,
        olb_id: olbIdVal,
        transaction_ref_no: TransactionRefNo
      },
      data: {
        payment_status: statusVal,
        payment_remarks: Remarks || ''
      }
    });

    // Create notifications
    const adminName = `${user.firstname || ''} ${user.surname || ''}`.trim() || 'Admin';
    const invoice = await prisma.invoice_master.findUnique({
      where: { invoice_id: invoiceIdVal },
      include: { project_master: true }
    });
    const invoiceNo = invoice?.inv_no || 'N/A';
    const projectName = invoice?.project_master?.projectName || 'N/A';
    const toUserId = invoice?.addedby; // Target Agent/User

    let nAction = 'On Payment Success';
    let title = 'Payment Success';
    let msg = `Payment Successfully Received Of Invoice - ${invoiceNo} Of Project - ${projectName} From : ${adminName}`;

    if (statusVal === 2) {
      nAction = 'On Payment Failed';
      title = 'Payment Failed';
      msg = `We have not received your payment against Invoice No - ${invoiceNo}, if payment deduct in your account so please contact your bank and reverse payment in your account and re try payment from fail transaction option in your penal`;
    }

    if (toUserId) {
      await prisma.notification.create({
        data: {
          fromId: user.userId,
          toId: toUserId,
          olbId: olbIdVal,
          action: nAction,
          title: title,
          message: msg,
          status: 0,
          sendtime: sentDate
        }
      });
    }

    return res.json({ Status: 4, Msg: 'Payment status updated successfully.' });
  } catch (error) {
    console.error('Update payment status error:', error);
    return res.status(500).json({ Status: 3, Msg: 'Failed to update payment status.' });
  }
});

// POST /api/billing/invoices/add-adv-payment (Admin Only)
router.post('/invoices/add-adv-payment', authMiddleware, async (req: Request, res: Response): Promise<any> => {
  const user = req.body.currentUser;
  const { TransactionID, TransactionDate, PaymentMethod, Remarks, Amount, AdvocateID, OLBID } = req.body;

  try {
    const advocateIdVal = parseInt(AdvocateID);
    const amountVal = parseFloat(Amount) || 0;
    const addedBy = user.userId;
    const addedDate = new Date();
    const sentDate = new Date();
    const txDate = TransactionDate ? new Date(TransactionDate) : new Date();

    const olbIds: number[] = Array.isArray(OLBID) ? OLBID.map(id => parseInt(id)) : [parseInt(OLBID)];

    // 1. Create entry in adv_payment_master
    const paymentMaster = await prisma.adv_payment_master.create({
      data: {
        transaction_id: TransactionID,
        transaction_date: txDate,
        payment_method: PaymentMethod || 'NET BANKING',
        remarks: Remarks || '',
        amount: amountVal,
        payment_status: 0, // Pending verification by advocate
        addedby: addedBy,
        addeddate: addedDate
      }
    });

    const apId = paymentMaster.adv_pay_id;

    // 2. Create entry in adv_payment_history_master
    await prisma.adv_payment_history_master.create({
      data: {
        adv_pay_id: apId,
        transaction_id: TransactionID,
        transaction_date: txDate,
        payment_method: PaymentMethod || 'NET BANKING',
        remarks: Remarks || '',
        amount: amountVal,
        payment_status: 0,
        addedby: addedBy,
        addeddate: addedDate
      }
    });

    const adminName = `${user.firstname || ''} ${user.surname || ''}`.trim() || 'Admin';

    // 3. Loop through OLB IDs and update draft and invoice records
    for (const olbIdVal of olbIds) {
      if (isNaN(olbIdVal)) continue;

      // Update draft status to 3 (Sent to Advocate)
      await prisma.olb.update({
        where: { olbId: olbIdVal },
        data: { draftStatus: 3 }
      });

      // Update invoice advocate payment info and status to 4 (Pending)
      await prisma.invoice_master.updateMany({
        where: { olb_id: olbIdVal },
        data: {
          adv_pay_id: apId,
          adv_payment_status: 4
        }
      });

      // Get invoice info for notification
      const invoices = await prisma.invoice_master.findMany({
        where: { olb_id: olbIdVal },
        include: { project_master: true }
      });

      for (const inv of invoices) {
        const invoiceNo = inv.inv_no || 'N/A';
        const projectName = inv.project_master?.projectName || 'N/A';
        const msg = `Payment Received Against New Invoice - ${invoiceNo} Of Project - ${projectName} From : ${adminName}`;

        await prisma.notification.create({
          data: {
            fromId: addedBy,
            toId: advocateIdVal,
            olbId: olbIdVal,
            advPayId: apId,
            action: 'On Payment Sent',
            title: 'New Payment Received',
            message: msg,
            status: 0,
            sendtime: sentDate
          }
        });
      }
    }

    return res.json({ Status: 2, Msg: 'Advocate payment registered successfully.', AdvPayID: apId });
  } catch (error) {
    console.error('Add advocate payment error:', error);
    return res.status(500).json({ Status: 1, Msg: 'Failed to register advocate payment.' });
  }
});

// POST /api/billing/invoices/update-adv-payment-status
router.post('/invoices/update-adv-payment-status', authMiddleware, async (req: Request, res: Response): Promise<any> => {
  const user = req.body.currentUser;
  const { AdvPayID, Status, Remarks } = req.body;

  try {
    const advPayIdVal = parseInt(AdvPayID);
    const statusVal = parseInt(Status); // 1 = Success, 2 = Failed
    const addedBy = user.userId;
    const addedDate = new Date();
    const sentDate = new Date();

    // Get Advocate Payment details
    const paymentMaster = await prisma.adv_payment_master.findUnique({
      where: { adv_pay_id: advPayIdVal }
    });

    if (!paymentMaster) {
      return res.status(404).json({ Status: 0, Msg: 'Advocate payment record not found.' });
    }

    // Update all associated invoices
    await prisma.invoice_master.updateMany({
      where: { adv_pay_id: advPayIdVal },
      data: {
        adv_payment_status: statusVal,
        adv_ps_remarks: Remarks || '',
        adv_payment_received_by: addedBy,
        adv_payment_received_date: addedDate
      }
    });

    // Update payment master
    await prisma.adv_payment_master.update({
      where: { adv_pay_id: advPayIdVal },
      data: {
        payment_status: statusVal,
        payment_remarks: Remarks || ''
      }
    });

    // Add entry in history
    await prisma.adv_payment_history_master.create({
      data: {
        adv_pay_id: advPayIdVal,
        transaction_id: paymentMaster.transaction_id,
        transaction_date: paymentMaster.transaction_date,
        payment_method: paymentMaster.payment_method,
        remarks: paymentMaster.remarks,
        amount: paymentMaster.amount,
        payment_status: statusVal,
        payment_remarks: Remarks || '',
        addedby: addedBy,
        addeddate: addedDate
      }
    });

    // Create Notification for Admin
    const advocateName = `${user.firstname || ''} ${user.surname || ''}`.trim() || 'Advocate';
    
    // Find invoice and project to get info
    const invoice = await prisma.invoice_master.findFirst({
      where: { adv_pay_id: advPayIdVal },
      include: { project_master: true }
    });

    const invoiceNo = invoice?.inv_no || 'N/A';
    const projectName = invoice?.project_master?.projectName || 'N/A';
    const toUserId = paymentMaster.addedby; // Target Admin

    let nAction = 'On Payment Success';
    let title = 'Payment Success';
    let msg = `Payment Successfully Received Of Invoice - ${invoiceNo} Of Project - ${projectName} From : ${advocateName}`;

    if (statusVal === 2) {
      nAction = 'On Payment Failed';
      title = 'Payment Failed';
      msg = `Payment Failed Of Invoice - ${invoiceNo} Of Project - ${projectName} From : ${advocateName}`;
    }

    if (toUserId) {
      await prisma.notification.create({
        data: {
          fromId: addedBy,
          toId: toUserId,
          olbId: invoice?.olb_id || null,
          advPayId: advPayIdVal,
          action: nAction,
          title: title,
          message: msg,
          status: 0,
          sendtime: sentDate
        }
      });
    }

    return res.json({ Status: 4, Msg: 'Advocate payment status updated successfully.' });
  } catch (error) {
    console.error('Update advocate payment status error:', error);
    return res.status(500).json({ Status: 3, Msg: 'Failed to update advocate payment status.' });
  }
});

// GET /api/billing/adv-payments (List advocate payout master records)
router.get('/adv-payments', authMiddleware, async (req: Request, res: Response): Promise<any> => {
  const user = req.body.currentUser;
  const status = req.query.status ? parseInt(req.query.status as string) : undefined;
  const stateId = req.query.stateId ? parseInt(req.query.stateId as string) : undefined;
  const city = req.query.city as string;
  const projectId = req.query.projectId ? parseInt(req.query.projectId as string) : undefined;
  const advocateId = req.query.advocateId ? parseInt(req.query.advocateId as string) : undefined;

  try {
    const whereClause: any = {};

    // Filter by status (payment_status in adv_payment_master)
    if (status !== undefined) {
      if (status === 4) {
        whereClause.payment_status = 0;
      } else {
        whereClause.payment_status = status;
      }
    }

    // Role scoping
    if (user.userTypeId === 4) {
      // Advocate only sees payouts made to themselves
      const invoiceFilter: any = { advocate_id: user.userId };
      if (status === 1) {
        invoiceFilter.olb_master = {
          draftStatus: { not: 4 }
        };
      }
      whereClause.invoice_master = {
        some: invoiceFilter
      };
    } else if (advocateId !== undefined) {
      // Admin/Staff filtering by advocate
      whereClause.invoice_master = {
        some: { advocate_id: advocateId }
      };
    }

    // Nested filters for project/state/city via invoice relation
    if (stateId !== undefined || city || projectId !== undefined) {
      const invoiceFilter: any = {};
      
      if (projectId !== undefined) invoiceFilter.project_id = projectId;
      if (stateId !== undefined || city) {
        const projectFilter: any = {};
        if (stateId !== undefined) projectFilter.state_id = stateId;
        if (city) projectFilter.city = city;
        invoiceFilter.project_master = projectFilter;
      }

      whereClause.invoice_master = {
        some: invoiceFilter
      };
    }

    const payments = await prisma.adv_payment_master.findMany({
      where: whereClause,
      include: {
        invoice_master: {
          include: {
            project_master: {
              include: {
                state_master: true
              }
            },
            olb_master: true,
            user_master_invoice_master_advocate_idTouser_master: {
              select: {
                userId: true,
                firstname: true,
                middlename: true,
                surname: true
              }
            },
            user_master_invoice_master_addedbyTouser_master: {
              select: {
                userId: true,
                firstname: true,
                middlename: true,
                surname: true
              }
            }
          }
        }
      },
      orderBy: { adv_pay_id: 'desc' }
    });

    const formatted = payments.map(p => {
      const firstInv = p.invoice_master[0];
      const advocate = firstInv?.user_master_invoice_master_advocate_idTouser_master;
      const agent = firstInv?.user_master_invoice_master_addedbyTouser_master;
      const project = firstInv?.project_master;

      return {
        advPayId: p.adv_pay_id,
        transactionId: p.transaction_id,
        transactionDate: p.transaction_date,
        paymentMethod: p.payment_method,
        remarks: p.remarks,
        amount: p.amount ? parseFloat(p.amount.toString()) : 0,
        paymentStatus: p.payment_status === 0 ? 4 : p.payment_status,
        paymentRemarks: p.payment_remarks,
        advocateName: advocate ? `${advocate.firstname || ''} ${advocate.surname || ''}`.trim() : 'N/A',
        agentName: agent ? `${agent.firstname || ''} ${agent.surname || ''}`.trim() : 'N/A',
        projectName: project?.projectName || 'N/A',
        projectCity: project?.city || 'N/A',
        projectState: project?.state_master?.state_name || 'N/A',
        invoices: p.invoice_master.map(inv => ({
          invoiceId: inv.invoice_id,
          invNo: inv.inv_no,
          grandtotal: inv.grandtotal ? parseFloat(inv.grandtotal.toString()) : 0,
          advAmount: inv.adv_amount ? parseFloat(inv.adv_amount.toString()) : 0,
          size: inv.size ? parseFloat(inv.size.toString()) : 0,
          rate: inv.rate || 0,
          addeddate: inv.addeddate,
          paymentStatus: inv.payment_status,
          advPaymentStatus: inv.adv_payment_status,
          olbId: inv.olb_id,
          customizeReadymade: inv.olb_master?.customizeReadymade || null,
          preparedDate: inv.olb_master?.preparedDate || null,
          sentDate: inv.olb_master?.sentDate || null,
          draftStatus: inv.olb_master?.draftStatus || null
        }))
      };
    });

    return res.json({ Status: 100, Payments: formatted });
  } catch (error) {
    console.error('List advocate payments error:', error);
    return res.status(500).json({ Error: 'Internal Server Error' });
  }
});

// GET /api/billing/adv-payments/:id (Get single advocate payout details)
router.get('/adv-payments/:id', authMiddleware, async (req: Request, res: Response): Promise<any> => {
  const user = req.body.currentUser;
  const payId = parseInt(req.params.id);

  if (isNaN(payId)) {
    return res.status(400).json({ Error: 'Invalid payment ID' });
  }

  try {
    const payment = await prisma.adv_payment_master.findFirst({
      where: {
        adv_pay_id: payId,
        invoice_master: user.userTypeId === 4 ? {
          some: { advocate_id: user.userId }
        } : undefined
      },
      include: {
        invoice_master: {
          include: {
            project_master: {
              include: {
                state_master: true
              }
            },
            olb_master: true,
            user_master_invoice_master_advocate_idTouser_master: {
              select: {
                userId: true,
                firstname: true,
                middlename: true,
                surname: true
              }
            },
            user_master_invoice_master_addedbyTouser_master: {
              select: {
                userId: true,
                firstname: true,
                middlename: true,
                surname: true
              }
            }
          }
        }
      }
    });

    if (!payment) {
      return res.status(404).json({ Error: 'Advocate payment not found' });
    }

    const firstInv = payment.invoice_master[0];
    const advocate = firstInv?.user_master_invoice_master_advocate_idTouser_master;
    const agent = firstInv?.user_master_invoice_master_addedbyTouser_master;
    const project = firstInv?.project_master;

    const formatted = {
      advPayId: payment.adv_pay_id,
      transactionId: payment.transaction_id,
      transactionDate: payment.transaction_date,
      paymentMethod: payment.payment_method,
      remarks: payment.remarks,
      amount: payment.amount ? parseFloat(payment.amount.toString()) : 0,
      paymentStatus: payment.payment_status === 0 ? 4 : payment.payment_status,
      paymentRemarks: payment.payment_remarks,
      advocateName: advocate ? `${advocate.firstname || ''} ${advocate.surname || ''}`.trim() : 'N/A',
      agentName: agent ? `${agent.firstname || ''} ${agent.surname || ''}`.trim() : 'N/A',
      projectName: project?.projectName || 'N/A',
      projectCity: project?.city || 'N/A',
      projectState: project?.state_master?.state_name || 'N/A',
      invoices: payment.invoice_master.map(inv => ({
        invoiceId: inv.invoice_id,
        invNo: inv.inv_no,
        grandtotal: inv.grandtotal ? parseFloat(inv.grandtotal.toString()) : 0,
        advAmount: inv.adv_amount ? parseFloat(inv.adv_amount.toString()) : 0,
        size: inv.size ? parseFloat(inv.size.toString()) : 0,
        rate: inv.rate || 0,
        addeddate: inv.addeddate,
        paymentStatus: inv.payment_status,
        advPaymentStatus: inv.adv_payment_status,
        olbId: inv.olb_id,
        customizeReadymade: inv.olb_master?.customizeReadymade || null,
        preparedDate: inv.olb_master?.preparedDate || null,
        sentDate: inv.olb_master?.sentDate || null,
        draftStatus: inv.olb_master?.draftStatus || null
      }))
    };

    return res.json({ Status: 100, Payment: formatted });
  } catch (error) {
    console.error('Get advocate payment detail error:', error);
    return res.status(500).json({ Error: 'Internal Server Error' });
  }
});

// POST /api/billing/invoices/remove-draft
router.post('/invoices/remove-draft', authMiddleware, async (req: Request, res: Response): Promise<any> => {
  const { InvoiceID, OLBID } = req.body;
  try {
    const invoiceIdVal = parseInt(InvoiceID);
    const olbIdVal = parseInt(OLBID);

    await prisma.olb.update({
      where: { olbId: olbIdVal },
      data: { draftStatus: 5 }
    });

    await prisma.invoice_master.update({
      where: { invoice_id: invoiceIdVal },
      data: { payment_status: 5 }
    });

    return res.json({ Status: 6, Msg: 'Draft removed successfully.' });
  } catch (error) {
    console.error('Remove draft error:', error);
    return res.status(500).json({ Status: 0, Msg: 'Failed to remove draft.' });
  }
});

// POST /api/billing/invoices/verify-adv-payout
router.post('/invoices/verify-adv-payout', authMiddleware, async (req: Request, res: Response): Promise<any> => {
  const user = req.body.currentUser;
  const { invoiceId, utr, remarks } = req.body;

  // Validate that the requesting user is an Admin (userTypeId = 1)
  if (!user || user.userTypeId !== 1) {
    return res.status(403).json({ Status: 0, Msg: 'Access denied. Only Admins can verify payouts.' });
  }

  if (!invoiceId || !utr) {
    return res.status(400).json({ Status: 0, Msg: 'Invoice ID and UTR/Transaction Reference Number are required.' });
  }

  const cleanUtr = utr.trim();
  if (!cleanUtr) {
    return res.status(400).json({ Status: 0, Msg: 'UTR cannot be empty.' });
  }

  try {
    const invId = parseInt(invoiceId);
    if (isNaN(invId)) {
      return res.status(400).json({ Status: 0, Msg: 'Invalid invoice ID.' });
    }

    // Check duplicate UTR in adv_payment_master.transaction_id
    const duplicatePayout = await prisma.adv_payment_master.findFirst({
      where: { transaction_id: cleanUtr }
    });

    if (duplicatePayout) {
      return res.status(400).json({ Status: 0, Msg: 'Duplicate transaction reference or UTR.' });
    }

    // Retrieve the invoice to verify draftStatus
    const invoice = await prisma.invoice_master.findUnique({
      where: { invoice_id: invId },
      include: {
        olb_master: true,
        project_master: true,
        user_master_invoice_master_advocate_idTouser_master: true
      }
    });

    if (!invoice) {
      return res.status(404).json({ Status: 0, Msg: 'Invoice not found.' });
    }

    // Verify it has been accepted (draftStatus === 4)
    if (!invoice.olb_master || invoice.olb_master.draftStatus !== 4) {
      return res.status(400).json({ Status: 0, Msg: 'Payout cannot be processed because the draft is not in Accepted status.' });
    }

    if (invoice.adv_payment_status === 1) {
      return res.status(400).json({ Status: 0, Msg: 'Payout for this invoice has already been completed.' });
    }

    const sizeVal = Number(invoice.size) || 0;
    const rateVal = invoice.rate || 0;
    const advocateId = invoice.advocate_id || 1;
    const olbId = invoice.olb_id;

    // Amount + 5% GST
    const amountPayable = Math.round((sizeVal * rateVal * 1.05) * 100) / 100;

    // Execute in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create entry in adv_payment_master (Success Payout to Advocate)
      const advPayment = await tx.adv_payment_master.create({
        data: {
          transaction_id: cleanUtr,
          transaction_date: new Date(),
          payment_method: 'UPI_MANUAL_CHECKOUT',
          remarks: remarks || `Manual split payout for Invoice ${invoice.inv_no}`,
          amount: amountPayable,
          payment_status: 1, // Success
          addedby: user.userId, // Admin user id
          addeddate: new Date()
        }
      });

      const advPayId = advPayment.adv_pay_id;

      // 2. Create entry in adv_payment_history_master
      await tx.adv_payment_history_master.create({
        data: {
          adv_pay_id: advPayId,
          transaction_id: cleanUtr,
          transaction_date: new Date(),
          payment_method: 'UPI_MANUAL_CHECKOUT',
          remarks: remarks || `Manual split payout for Invoice ${invoice.inv_no}`,
          amount: amountPayable,
          payment_status: 1,
          addedby: user.userId,
          addeddate: new Date()
        }
      });

      // 3. Update invoice_master linking advocate payout details and marking it as successful
      const updatedInvoice = await tx.invoice_master.update({
        where: { invoice_id: invId },
        data: {
          adv_pay_id: advPayId,
          adv_payment_status: 1, // Success
          adv_payment_received_by: advocateId,
          adv_payment_received_date: new Date(),
          adv_transaction_id: cleanUtr,
          adv_payment_date: new Date(),
          adv_payment_method: 'UPI_MANUAL_CHECKOUT',
          adv_payment_remarks: remarks || `Manual split payout for Invoice ${invoice.inv_no}`
        }
      });

      // 4. Create Notification for Advocate about successful payout receipt
      if (advocateId) {
        const projName = invoice.project_master?.projectName || 'N/A';
        await tx.notification.create({
          data: {
            fromId: user.userId,
            toId: advocateId,
            olbId: olbId,
            advPayId: advPayId,
            action: 'On Payout Success',
            title: 'Payment Received',
            message: `Your split payout of ₹${amountPayable} for Invoice ${invoice.inv_no} (Project: ${projName}) has been processed successfully. UTR: ${cleanUtr}.`,
            status: 0,
            sendtime: new Date()
          }
        });
      }

      return { updatedInvoice, advPayId };
    });

    return res.json({
      Status: 100,
      Msg: 'Advocate payout recorded successfully.',
      InvoiceId: invId,
      Utr: cleanUtr,
      Amount: amountPayable,
      AdvPayId: result.advPayId
    });
  } catch (error: any) {
    console.error('Verify advocate payout error:', error);
    return res.status(500).json({ Status: 0, Msg: error.message || 'Internal server error processing payout.' });
  }
});

export default router;

