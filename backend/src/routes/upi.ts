import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const router = Router();
const prisma = new PrismaClient();

// Merchant VPA configuration (Admin merchant address)
const MERCHANT_UPI_ID = process.env.MERCHANT_UPI_ID || 'admin-dainna@icici';
const MERCHANT_NAME = process.env.MERCHANT_NAME || 'DAINNA ADMIN PORTAL';
const WEBHOOK_SECRET = process.env.UPI_WEBHOOK_SECRET || 'dainna-upi-webhook-secret-key';

/**
 * Helper to process all database side effects of a successful UPI payment:
 * 1. Mark invoice as paid (payment_status = 1) & store UTR
 * 2. Calculate Advocate Cut split (size * rate)
 * 3. Automate split bank payout to advocate (create adv_payment_master with payment_status = 1)
 * 4. Transition Draft status to 3 (Received to Advocate)
 * 5. Log in transaction_history
 * 6. Send automatic notifications to Agent and Advocate
 */
async function processSuccessfulPayment(invoiceId: number, utr: string, remarks: string = '') {
  return await prisma.$transaction(async (tx) => {
    // 1. Fetch invoice details
    const invoice = await tx.invoice_master.findUnique({
      where: { invoice_id: invoiceId },
      include: {
        olb_master: true,
        project_master: true,
        user_master_invoice_master_advocate_idTouser_master: true
      }
    });

    if (!invoice) {
      throw new Error(`Invoice with ID ${invoiceId} not found.`);
    }

    if (invoice.payment_status === 1) {
      // Payment already processed, return early to avoid duplicates
      return invoice;
    }

    const sizeVal = Number(invoice.size) || 0;
    const rateVal = invoice.rate || 0;
    const advocateId = invoice.advocate_id;
    const olbId = invoice.olb_id;

    // 2. Calculate Advocate Split Cut (size * rate)
    const advCutAmount = Math.round((sizeVal * rateVal) * 100) / 100;

    let realInvNo = invoice.inv_no;
    let realInvoiceNo = invoice.invoice_no;

    if (invoice.invoice_no && invoice.invoice_no.startsWith('TEMP')) {
      // Get next real InvoiceNo (global max + 1)
      const allInvoices = await tx.invoice_master.findMany({
        where: {
          NOT: {
            invoice_no: { startsWith: 'TEMP' }
          }
        },
        select: { invoice_no: true }
      });
      let invoiceNoVal = 1;
      if (allInvoices.length > 0) {
        const nos = allInvoices.map(i => parseInt(i.invoice_no || '0')).filter(n => !isNaN(n));
        if (nos.length > 0) {
          invoiceNoVal = Math.max(...nos) + 1;
        }
      }

      let stateCode = '00';
      if (invoice.state_id) {
        const stateObj = await tx.state_master.findUnique({
          where: { state_id: invoice.state_id }
        });
        if (stateObj && stateObj.state_code) {
          stateCode = stateObj.state_code;
        }
      }
      realInvNo = `${stateCode}/${String(invoiceNoVal).padStart(4, '0')}`;
      realInvoiceNo = String(invoiceNoVal);
    }

    // 5. Update invoice_master (Set Agent Payment Success, but NOT Advocate Payout details yet)
    const updatedInvoice = await tx.invoice_master.update({
      where: { invoice_id: invoiceId },
      data: {
        payment_status: 1, // Success
        transaction_ref_no: utr,
        transaction_remarks: remarks || 'Paid via UPI Gateway',
        adv_amount: advCutAmount,
        agent_payment_received_by: 1,
        agent_payment_received_date: new Date(),
        inv_no: realInvNo,
        invoice_no: realInvoiceNo
      }
    });

    // 6. Transition Draft status to 3 (Received to Advocate)
    if (olbId) {
      await tx.olb.update({
        where: { olbId: olbId },
        data: {
          draftStatus: 3, // Received to Advocate
          sentDate: new Date(),
          modifieddate: new Date()
        }
      });
    }

    // 7. Insert entry into transaction_history (Agent payment)
    await tx.transaction_history.create({
      data: {
        type: 1, // Receipt
        invoice_id: invoiceId,
        olb_id: olbId,
        amount: invoice.grandtotal,
        payment_status: 1, // Success
        transaction_ref_no: utr,
        transaction_remarks: remarks || 'Paid via UPI Gateway',
        transaction_date: new Date(),
        screenshot: null // No manual screenshot upload required
      }
    });

    // 8. Create Notifications
    const projName = invoice.project_master?.projectName || 'N/A';
    
    // Notification for Agent
    if (invoice.addedby) {
      await tx.notification.create({
        data: {
          fromId: 1,
          toId: invoice.addedby,
          olbId: olbId,
          action: 'On Payment Success',
          title: 'Payment Confirmed',
          message: `Your payment of ₹${invoice.grandtotal} against Invoice ${invoice.inv_no} (Project: ${projName}) has been processed successfully.`,
          status: 0,
          sendtime: new Date()
        }
      });
    }

    // Notification for Advocate (Draft received)
    if (advocateId) {
      await tx.notification.create({
        data: {
          fromId: 1,
          toId: advocateId,
          olbId: olbId,
          action: 'On Payment Sent',
          title: 'New Draft Assigned',
          message: `New draft assigned for Invoice ${invoice.inv_no} (Project: ${projName}). A split payout of ₹${advCutAmount} will be processed upon draft acceptance.`,
          status: 0,
          sendtime: new Date()
        }
      });
    }

    return updatedInvoice;
  });
}

/**
 * Helper to process all database side effects of a successful Advocate UPI payout:
 * 1. Calculate Advocate Cut split (size * rate) * 1.05 (GST)
 * 2. Create entry in adv_payment_master (Success Payout to Advocate)
 * 3. Create entry in adv_payment_history_master
 * 4. Update invoice_master (Link Advocate Payout details and set adv_payment_status = 1)
 * 5. Send payout success notification to the Advocate
 */
export async function processSuccessfulPayout(invoiceId: number, utr: string, remarks: string = '', isSuccess: boolean = true) {
  return await prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice_master.findUnique({
      where: { invoice_id: invoiceId },
      include: {
        olb_master: true,
        project_master: true,
        user_master_invoice_master_advocate_idTouser_master: true
      }
    });

    if (!invoice) {
      throw new Error(`Invoice with ID ${invoiceId} not found.`);
    }

    if (invoice.adv_payment_status === 1) {
      // Payout already processed, return early to avoid duplicates
      return invoice;
    }

    const sizeVal = Number(invoice.size) || 0;
    const rateVal = invoice.rate || 0;
    const advocateId = invoice.advocate_id || 1;
    const olbId = invoice.olb_id;

    // Amount + 5% GST
    const amountPayable = Math.round((sizeVal * rateVal * 1.05) * 100) / 100;

    // 1. Create entry in adv_payment_master
    const advPayment = await tx.adv_payment_master.create({
      data: {
        transaction_id: utr,
        transaction_date: new Date(),
        payment_method: 'UPI_MANUAL_CHECKOUT',
        remarks: remarks || `Auto-captured split payout for Invoice ${invoice.inv_no}`,
        amount: amountPayable,
        payment_status: isSuccess ? 1 : 0, // 1 = Success, 0 = Pending verification by advocate
        addedby: 1, // Admin
        addeddate: new Date()
      }
    });

    const advPayId = advPayment.adv_pay_id;

    // 2. Create entry in adv_payment_history_master
    await tx.adv_payment_history_master.create({
      data: {
        adv_pay_id: advPayId,
        transaction_id: utr,
        transaction_date: new Date(),
        payment_method: 'UPI_MANUAL_CHECKOUT',
        remarks: remarks || `Auto-captured split payout for Invoice ${invoice.inv_no}`,
        amount: amountPayable,
        payment_status: isSuccess ? 1 : 0,
        addedby: 1,
        addeddate: new Date()
      }
    });

    // 3. Update invoice_master linking advocate payout details
    const updateData: any = {
      adv_pay_id: advPayId,
      adv_payment_status: isSuccess ? 1 : 4, // 1 = Success, 4 = Sent to Advocate / Awaiting verification
      adv_transaction_id: utr,
      adv_payment_date: new Date(),
      adv_payment_method: 'UPI_MANUAL_CHECKOUT',
      adv_payment_remarks: remarks || `Auto-captured split payout for Invoice ${invoice.inv_no}`
    };

    if (isSuccess) {
      updateData.adv_payment_received_by = advocateId;
      updateData.adv_payment_received_date = new Date();
    }

    const updatedInvoice = await tx.invoice_master.update({
      where: { invoice_id: invoiceId },
      data: updateData
    });

    // 4. Create Notification for Advocate
    if (advocateId) {
      const projName = invoice.project_master?.projectName || 'N/A';
      
      const actionStr = isSuccess ? 'On Payout Success' : 'On Payment Sent';
      const titleStr = isSuccess ? 'Payment Received' : 'New Payment Received';
      const msgStr = isSuccess 
        ? `Your split payout of ₹${amountPayable} for Invoice ${invoice.inv_no} (Project: ${projName}) has been processed successfully. UTR: ${utr}.`
        : `Payment Received Against New Invoice - ${invoice.inv_no} Of Project - ${projName} From : Admin`;

      await tx.notification.create({
        data: {
          fromId: 1,
          toId: advocateId,
          olbId: olbId,
          advPayId: advPayId,
          action: actionStr,
          title: titleStr,
          message: msgStr,
          status: 0,
          sendtime: new Date()
        }
      });
    }

    return updatedInvoice;
  });
}

// 1. POST /api/upi/create-order (Generate dynamic payment request)
router.post('/create-order', async (req: Request, res: Response): Promise<any> => {
  const { invoiceId, gateway } = req.body; // gateway: 'free' | 'charged'

  if (!invoiceId) {
    return res.status(400).json({ Status: 0, Msg: 'Invoice reference ID is required.' });
  }

  try {
    const invoice = await prisma.invoice_master.findUnique({
      where: { invoice_id: parseInt(invoiceId) },
      include: { project_master: true }
    });

    if (!invoice) {
      return res.status(404).json({ Status: 0, Msg: 'Invoice not found.' });
    }

    // Reconstruct the original base invoice amount (G)
    const baseAmount = Number(invoice.total || 0) + 
                       Number(invoice.cgst_amount || 0) + 
                       Number(invoice.sgst_amount || 0) + 
                       Number(invoice.igst_amount || 0);
    const G = Math.round(baseAmount * 100) / 100;

    let finalTotal = G;
    let remarks = '';
    let pgId = 1;

    if (gateway === 'charged') {
      pgId = 2;
      // Formula: T_final = (G + 11.80) / 0.9764
      const tFinal = (G + 11.80) / 0.9764;
      finalTotal = Math.round(tFinal * 100) / 100;
      
      const payoutFee = 11.80;
      const pgFee = Math.round((finalTotal - G - payoutFee) * 100) / 100;
      remarks = `Base: ₹${G.toFixed(2)}, Payout Fee: ₹${payoutFee.toFixed(2)}, PG Fee: ₹${pgFee.toFixed(2)}`;
    } else {
      pgId = 1;
      remarks = `Base: ₹${G.toFixed(2)} (Direct UPI - Free)`;
    }

    // Persist calculated totals and gateway metadata
    await prisma.invoice_master.update({
      where: { invoice_id: invoice.invoice_id },
      data: {
        grandtotal: finalTotal,
        pg_id: pgId,
        payment_remarks: remarks
      }
    });

    const invNoClean = invoice.inv_no ? invoice.inv_no.replace(/\//g, '') : `INV${invoice.invoice_id}`;

    if (gateway === 'charged') {
      return res.json({
        Status: 100,
        Gateway: 'charged',
        Amount: finalTotal,
        BaseAmount: G,
        PayoutFee: 11.80,
        PgFee: Math.round((finalTotal - G - 11.80) * 100) / 100,
        InvoiceNo: invoice.inv_no,
        InvoiceId: invoice.invoice_id
      });
    } else {
      // Generate dynamic UPI Payment Intent URI
      const upiUri = `upi://pay?pa=${MERCHANT_UPI_ID}&pn=${encodeURIComponent(MERCHANT_NAME)}&cu=INR&tn=${invNoClean}&tr=${invoice.invoice_id}&am=${finalTotal}`;
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(upiUri)}`;

      return res.json({
        Status: 100,
        Gateway: 'free',
        MerchantUpiId: MERCHANT_UPI_ID,
        Amount: finalTotal,
        UpiUri: upiUri,
        QrCodeUrl: qrCodeUrl,
        InvoiceNo: invoice.inv_no,
        InvoiceId: invoice.invoice_id
      });
    }
  } catch (error) {
    console.error('Create UPI payment order error:', error);
    return res.status(500).json({ Status: 0, Msg: 'Internal server error while generating payment request.' });
  }
});

// 2. GET /api/upi/check-status/:invoiceId (Client polling status check)
router.get('/check-status/:invoiceId', async (req: Request, res: Response): Promise<any> => {
  const invoiceId = parseInt(req.params.invoiceId);

  if (isNaN(invoiceId)) {
    return res.status(400).json({ Status: 0, Msg: 'Invalid invoice ID.' });
  }

  try {
    const invoice = await prisma.invoice_master.findUnique({
      where: { invoice_id: invoiceId },
      select: {
        invoice_id: true,
        payment_status: true,
        transaction_ref_no: true,
        grandtotal: true,
        inv_no: true,
        olb_id: true
      }
    });

    if (!invoice) {
      return res.status(404).json({ Status: 0, Msg: 'Invoice not found.' });
    }

    return res.json({
      Status: 100,
      InvoiceId: invoice.invoice_id,
      PaymentStatus: invoice.payment_status,
      Utr: invoice.transaction_ref_no || null,
      Grandtotal: invoice.grandtotal,
      InvoiceNo: invoice.inv_no,
      OlbId: invoice.olb_id
    });
  } catch (error) {
    console.error('Check payment status error:', error);
    return res.status(500).json({ Status: 0, Msg: 'Internal server error checking payment status.' });
  }
});

// 3. POST /api/upi/webhook (Official Webhook Handler)
router.post('/webhook', async (req: Request, res: Response): Promise<any> => {
  // Webhook Signature verification (Example structure)
  const signature = req.headers['x-upi-signature'];
  const payload = JSON.stringify(req.body);

  if (signature) {
    const expectedSignature = crypto
      .createHmac('sha256', WEBHOOK_SECRET)
      .update(payload)
      .digest('hex');

    if (signature !== expectedSignature) {
      return res.status(400).json({ Status: 0, Msg: 'Invalid webhook signature verification.' });
    }
  }

  const { invoiceId, utr, status, remarks } = req.body;

  if (!invoiceId || !utr || status !== 'SUCCESS') {
    return res.status(400).json({ Status: 0, Msg: 'Invalid callback parameters.' });
  }

  try {
    const invId = parseInt(invoiceId);
    const invoice = await prisma.invoice_master.findUnique({
      where: { invoice_id: invId }
    });

    if (!invoice) {
      return res.status(404).json({ Status: 0, Msg: 'Invoice not found.' });
    }

    if (invoice.payment_status !== 1) {
      await processSuccessfulPayment(invId, utr, remarks);
      // Auto-trigger payout immediately
      const invAfter = await prisma.invoice_master.findUnique({
        where: { invoice_id: invId }
      });
      if (invAfter && invAfter.payment_status === 1 && invAfter.adv_payment_status !== 1) {
        const autoUtr = `AUTO-ADV-${Math.floor(100000000000 + Math.random() * 900000000000)}`;
        await processSuccessfulPayout(invId, autoUtr, 'Automated payout upon agent payment confirmation', false);
      }
    } else if (invoice.adv_payment_status !== 1) {
      await processSuccessfulPayout(invId, utr, remarks, false);
    }

    return res.json({ Status: 100, Msg: 'Webhook processed successfully.' });
  } catch (error: any) {
    console.error('Webhook processing error:', error);
    return res.status(500).json({ Status: 0, Msg: error.message || 'Failed to process webhook.' });
  }
});

// 4. POST /api/upi/simulate-success (Helper simulation callback for developer sandbox testing)
router.post('/simulate-success', async (req: Request, res: Response): Promise<any> => {
  const { invoiceId, utr } = req.body;

  if (!invoiceId) {
    return res.status(400).json({ Status: 0, Msg: 'Invoice ID is required for simulation.' });
  }

  const generatedUtr = utr || `UTR${Math.floor(100000000000 + Math.random() * 900000000000)}`;

  try {
    const invoice = await prisma.invoice_master.findUnique({
      where: { invoice_id: parseInt(invoiceId) }
    });

    if (!invoice) {
      return res.status(404).json({ Status: 0, Msg: 'Invoice not found.' });
    }

    const remarks = invoice.pg_id === 2 ? 'Paid via Charged Payment Gateway' : 'Paid via Free Direct UPI QR';
    const updatedInvoice = await processSuccessfulPayment(invoice.invoice_id, generatedUtr, remarks);
    
    // Auto-trigger payout immediately
    const invAfter = await prisma.invoice_master.findUnique({
      where: { invoice_id: updatedInvoice.invoice_id }
    });
    if (invAfter && invAfter.payment_status === 1 && invAfter.adv_payment_status !== 1) {
      const autoUtr = `AUTO-ADV-${Math.floor(100000000000 + Math.random() * 900000000000)}`;
      await processSuccessfulPayout(invAfter.invoice_id, autoUtr, 'Automated payout upon agent payment confirmation', false);
    }

    return res.json({
      Status: 100,
      Msg: 'Simulation checkout payment successful.',
      InvoiceId: updatedInvoice.invoice_id,
      Utr: generatedUtr
    });
  } catch (error: any) {
    console.error('Simulation check error:', error);
    return res.status(500).json({ Status: 0, Msg: error.message || 'Simulation payment process failed.' });
  }
});

// 4b. POST /api/upi/create-payout-order (Generate dynamic payout request)
router.post('/create-payout-order', async (req: Request, res: Response): Promise<any> => {
  const { invoiceId } = req.body;

  if (!invoiceId) {
    return res.status(400).json({ Status: 0, Msg: 'Invoice reference ID is required.' });
  }

  try {
    const invoice = await prisma.invoice_master.findUnique({
      where: { invoice_id: parseInt(invoiceId) },
      include: {
        project_master: true,
        user_master_invoice_master_advocate_idTouser_master: true
      }
    });

    if (!invoice) {
      return res.status(404).json({ Status: 0, Msg: 'Invoice not found.' });
    }

    const advocate = invoice.user_master_invoice_master_advocate_idTouser_master;
    if (!advocate) {
      return res.status(400).json({ Status: 0, Msg: 'Advocate details not associated with this invoice.' });
    }

    const { bankAcNo, bankIfscCode, bankAcHolder } = advocate;
    if (!bankAcNo || !bankIfscCode) {
      return res.status(400).json({ Status: 0, Msg: 'Advocate has not set up bank details (Account Number or IFSC missing).' });
    }

    // Payee VPA format for direct bank account via UPI: [account]@[ifsc].ifsc.npci
    const payeeVpa = `${bankAcNo}@${bankIfscCode}.ifsc.npci`;
    const payeeName = bankAcHolder || `${advocate.firstname || ''} ${advocate.surname || ''}`.trim() || 'Advocate';
    
    // Calculate amountPayable: (size * rate) * 1.05 (Amount + 5% GST)
    const sizeVal = Number(invoice.size) || 0;
    const rateVal = invoice.rate || 0;
    const amountPayable = Math.round((sizeVal * rateVal * 1.05) * 100) / 100;

    const invNoClean = invoice.inv_no ? invoice.inv_no.replace(/\//g, '') : `INV${invoice.invoice_id}`;
    const upiUri = `upi://pay?pa=${payeeVpa}&pn=${encodeURIComponent(payeeName)}&cu=INR&tn=${invNoClean}&tr=PAYOUT-${invoice.invoice_id}&am=${amountPayable}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(upiUri)}`;

    return res.json({
      Status: 100,
      PayeeVpa: payeeVpa,
      PayeeName: payeeName,
      Amount: amountPayable,
      UpiUri: upiUri,
      QrCodeUrl: qrCodeUrl,
      InvoiceNo: invoice.inv_no
    });
  } catch (error) {
    console.error('Create UPI payout order error:', error);
    return res.status(500).json({ Status: 0, Msg: 'Internal server error generating payout request.' });
  }
});

// 4c. GET /api/upi/check-payout-status/:invoiceId (Client polling payout status check)
router.get('/check-payout-status/:invoiceId', async (req: Request, res: Response): Promise<any> => {
  const invoiceId = parseInt(req.params.invoiceId);

  if (isNaN(invoiceId)) {
    return res.status(400).json({ Status: 0, Msg: 'Invalid invoice ID.' });
  }

  try {
    const invoice = await prisma.invoice_master.findUnique({
      where: { invoice_id: invoiceId },
      select: {
        invoice_id: true,
        adv_payment_status: true,
        adv_transaction_id: true,
        adv_amount: true,
        inv_no: true,
        olb_id: true
      }
    });

    if (!invoice) {
      return res.status(404).json({ Status: 0, Msg: 'Invoice not found.' });
    }

    return res.json({
      Status: 100,
      InvoiceId: invoice.invoice_id,
      AdvPaymentStatus: invoice.adv_payment_status,
      Utr: invoice.adv_transaction_id || null,
      Amount: invoice.adv_amount,
      InvoiceNo: invoice.inv_no,
      OlbId: invoice.olb_id
    });
  } catch (error) {
    console.error('Check payout status error:', error);
    return res.status(500).json({ Status: 0, Msg: 'Internal server error checking payout status.' });
  }
});

// 4d. POST /api/upi/simulate-payout-success (Simulation helper for advocate payout)
router.post('/simulate-payout-success', async (req: Request, res: Response): Promise<any> => {
  const { invoiceId, utr } = req.body;

  if (!invoiceId) {
    return res.status(400).json({ Status: 0, Msg: 'Invoice ID is required for simulation.' });
  }

  const generatedUtr = utr || `UTR-ADV-${Math.floor(100000000000 + Math.random() * 900000000000)}`;

  try {
    const updatedInvoice = await processSuccessfulPayout(parseInt(invoiceId), generatedUtr, 'Simulated UPI Gateway Advocate Payout', false);
    return res.json({
      Status: 100,
      Msg: 'Simulation checkout advocate payout successful.',
      InvoiceId: updatedInvoice.invoice_id,
      Utr: generatedUtr
    });
  } catch (error: any) {
    console.error('Simulation payout check error:', error);
    return res.status(500).json({ Status: 0, Msg: error.message || 'Simulation payout process failed.' });
  }
});

// 5. GET /api/upi/payment-statement (Statement download report with project & date range filters)
router.get('/payment-statement', async (req: Request, res: Response): Promise<any> => {
  const projectId = req.query.projectId ? parseInt(req.query.projectId as string) : undefined;
  const advocateId = req.query.advocateId ? parseInt(req.query.advocateId as string) : undefined;
  const agentId = req.query.agentId ? parseInt(req.query.agentId as string) : undefined;
  const startDateStr = req.query.startDate as string;
  const endDateStr = req.query.endDate as string;

  try {
    const whereClause: any = {
      payment_status: 1 // Only successful payments
    };

    if (projectId !== undefined && !isNaN(projectId)) {
      whereClause.project_id = projectId;
    }

    if (advocateId !== undefined && !isNaN(advocateId)) {
      whereClause.advocate_id = advocateId;
    }

    if (agentId !== undefined && !isNaN(agentId)) {
      whereClause.addedby = agentId;
    }

    if (startDateStr && endDateStr) {
      const start = new Date(startDateStr);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDateStr);
      end.setHours(23, 59, 59, 999);
      whereClause.invoice_date = {
        gte: start,
        lte: end
      };
    }

    const invoices = await prisma.invoice_master.findMany({
      where: whereClause,
      include: {
        project_master: true,
        user_master_invoice_master_addedbyTouser_master: true,
        user_master_invoice_master_advocate_idTouser_master: true
      },
      orderBy: { invoice_id: 'desc' }
    });

    const statement = invoices.map(inv => {
      const sizeVal = Number(inv.size) || 0;
      const rateVal = inv.rate || 0;
      const grandtotal = Number(inv.grandtotal) || 0;
      const advocateCut = inv.adv_amount ? Number(inv.adv_amount) : Math.round((sizeVal * rateVal) * 100) / 100;
      const adminCut = Math.round((grandtotal - advocateCut) * 100) / 100;

      return {
        invoiceId: inv.invoice_id,
        invNo: inv.inv_no,
        projectName: inv.project_master?.projectName || 'N/A',
        projectCity: inv.project_master?.city || 'N/A',
        agentName: inv.user_master_invoice_master_addedbyTouser_master 
          ? `${inv.user_master_invoice_master_addedbyTouser_master.firstname || ''} ${inv.user_master_invoice_master_addedbyTouser_master.surname || ''}`.trim()
          : 'N/A',
        advocateName: inv.user_master_invoice_master_advocate_idTouser_master
          ? `${inv.user_master_invoice_master_advocate_idTouser_master.firstname || ''} ${inv.user_master_invoice_master_advocate_idTouser_master.surname || ''}`.trim()
          : 'N/A',
        size: sizeVal,
        rate: rateVal,
        grandtotal: grandtotal,
        advocateCut: advocateCut,
        adminCut: adminCut,
        utr: inv.transaction_ref_no || 'N/A',
        date: inv.invoice_date
      };
    });

    return res.json({ Status: 100, Statement: statement });
  } catch (error) {
    console.error('Payment statement error:', error);
    return res.status(500).json({ Error: 'Internal Server Error' });
  }
});

export default router;
