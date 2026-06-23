const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const BACKEND_URL = 'http://localhost:5000/api';

async function runTest() {
  console.log('--- STARTING ADVOCATE PAYOUT & DRAFT ACCEPTANCE INTEGRATION TEST ---');

  // 1. Get references to test users
  const agentUser = await prisma.user.findFirst({ where: { username: 'agent' } });
  const advUser = await prisma.user.findFirst({ where: { username: 'adv' } });

  if (!agentUser || !advUser) {
    throw new Error('Test users "agent" or "adv" not found. Please seed users first.');
  }

  // Clear any existing notifications for test users to start with a clean slate
  console.log('Cleaning up existing notifications for test users...');
  await prisma.notification.deleteMany({
    where: {
      OR: [
        { toId: advUser.userId },
        { toId: agentUser.userId },
        { fromId: agentUser.userId, toId: null },
        { fromId: advUser.userId, toId: null }
      ]
    }
  });

  // 2. Find or create a draft (OLB) to test on
  const state = await prisma.state_master.findFirst();
  const project = await prisma.project.findFirst();
  if (!state || !project) {
    throw new Error('Required seed data (state_master/project_master) is missing.');
  }

  console.log('Creating dummy OLB/Draft record...');
  const testOlb = await prisma.olb.create({
    data: {
      type: 1, // customize
      draftStatus: 2, // Waiting for Advocate
      stateId: state.state_id,
      district: 'TEST DISTRICT',
      addedby: agentUser.userId,
      addeddate: new Date(),
      modifieddate: new Date(),
      agreementAddeddate: new Date(),
      purchaserFirstName: 'Test',
      purchaserLastName: 'Purchaser',
      agreementDraft: 'This is a test agreement draft.'
    }
  });

  console.log(`Created test OLB with ID: ${testOlb.olbId}`);

  // Create an invoice_master record linked to the OLB
  const testInvoice = await prisma.invoice_master.create({
    data: {
      inv_no: `INV-TEST-${Math.floor(100000 + Math.random() * 900000)}`,
      olb_master: { connect: { olbId: testOlb.olbId } },
      user_master_invoice_master_addedbyTouser_master: { connect: { userId: agentUser.userId } },
      user_master_invoice_master_advocate_idTouser_master: { connect: { userId: advUser.userId } },
      project_master: { connect: { projectId: project.projectId } },
      size: 1000,
      rate: 10,
      grandtotal: 10500,
      adv_amount: 10000,
      payment_status: 0, // Unpaid
      adv_payment_status: 0, // Unpaid
      addeddate: new Date()
    }
  });

  console.log(`Created test Invoice with ID: ${testInvoice.invoice_id}`);

  // 3. Login as Agent to get session token
  console.log('Logging in as agent...');
  const agentLoginRes = await fetch(`${BACKEND_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ UserName: 'agent', Password: 'agent' })
  });
  
  if (!agentLoginRes.ok) {
    throw new Error('Agent login failed');
  }

  const agentCookie = agentLoginRes.headers.get('set-cookie')?.split(';')[0];
  console.log('Agent logged in successfully.');

  // 4. Simulate agent checkout payment using /simulate-success
  console.log('Simulating Agent Checkout Payment via /simulate-success...');
  const paymentSimRes = await fetch(`${BACKEND_URL}/upi/simulate-success`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      Cookie: agentCookie || ''
    },
    body: JSON.stringify({ invoiceId: testInvoice.invoice_id })
  });

  if (!paymentSimRes.ok) {
    const errorText = await paymentSimRes.text();
    throw new Error(`Simulation failed: ${errorText}`);
  }

  console.log('Payment checkout simulated successfully.');

  // 5. Query the database to verify the advocate payout status
  let invoiceDb = await prisma.invoice_master.findUnique({
    where: { invoice_id: testInvoice.invoice_id },
    include: { adv_payment_master: true }
  });

  console.log('Verifying advocate payout state in Database...');
  console.log(`- Invoice payment_status (Agent): ${invoiceDb.payment_status} (Expected: 1)`);
  console.log(`- Invoice adv_payment_status (Advocate): ${invoiceDb.adv_payment_status} (Expected: 4 - Sent / Awaiting Verification)`);
  console.log(`- Payout master payment_status: ${invoiceDb.adv_payment_master?.payment_status} (Expected: 0 - Pending Verification)`);

  if (invoiceDb.payment_status !== 1) {
    throw new Error('Agent payment status is not 1!');
  }
  if (invoiceDb.adv_payment_status !== 4) {
    throw new Error('Advocate payout status was not set to 4 (Pending Verification)!');
  }
  if (invoiceDb.adv_payment_master?.payment_status !== 0) {
    throw new Error('Advocate payout master status was not set to 0 (Pending)!');
  }
  console.log('-> Database statuses are correct!');

  // Check OLB status
  let olbDb = await prisma.olb.findUnique({ where: { olbId: testOlb.olbId } });
  console.log(`- Draft draftStatus: ${olbDb.draftStatus} (Expected: 3 - Received to Advocate)`);
  if (olbDb.draftStatus !== 3) {
    throw new Error('Draft status was not set to 3!');
  }

  // 6. Login as Advocate to get session token
  console.log('Logging in as advocate...');
  const advLoginRes = await fetch(`${BACKEND_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ UserName: 'adv', Password: 'adv' })
  });

  if (!advLoginRes.ok) {
    throw new Error('Advocate login failed');
  }

  const advCookie = advLoginRes.headers.get('set-cookie')?.split(';')[0];
  console.log('Advocate logged in successfully.');

  // 6b. Verify advocate unread notifications count is 2, and marks as read (simulating modal open)
  console.log('Verifying advocate unread counts...');
  const countsRes = await fetch(`${BACKEND_URL}/notifications/unread-counts`, {
    headers: { Cookie: advCookie || '' }
  });
  const countsData = await countsRes.json();
  console.log(`- Initial Advocate Notifications Count: ${countsData.NotificationsCount} (Expected: 2)`);
  if (countsData.NotificationsCount !== 2) {
    throw new Error(`Expected 2 notifications, got ${countsData.NotificationsCount}`);
  }

  // Fetch the notifications list
  console.log('Simulating Advocate viewing notifications list...');
  const notifsListRes = await fetch(`${BACKEND_URL}/notifications`, {
    headers: { Cookie: advCookie || '' }
  });
  const notifsListData = await notifsListRes.json();
  const notificationIds = notifsListData.Notifications?.map(n => n.notificationId) || [];
  console.log(`- Retrieved Notification IDs: ${notificationIds.join(', ')}`);

  if (notificationIds.length === 0) {
    throw new Error('No notification IDs retrieved');
  }

  // Call the mark-read API (simulating the client auto-clear)
  console.log('Triggering auto-clear / mark-read...');
  const markReadRes = await fetch(`${BACKEND_URL}/notifications/mark-read`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: advCookie || ''
    },
    body: JSON.stringify({ notificationIds: notificationIds })
  });
  const markReadData = await markReadRes.json();
  console.log(`- Mark read API response: ${markReadData.Msg}`);

  // Re-verify count is now 0
  const countsRes2 = await fetch(`${BACKEND_URL}/notifications/unread-counts`, {
    headers: { Cookie: advCookie || '' }
  });
  const countsData2 = await countsRes2.json();
  console.log(`- Advocate Notifications Count after viewed: ${countsData2.NotificationsCount} (Expected: 0)`);
  if (countsData2.NotificationsCount !== 0) {
    throw new Error(`Expected 0 notifications after read, got ${countsData2.NotificationsCount}`);
  }
  console.log('-> Notifications viewed & cleared sync verified successfully!');

  // 7. Try to accept the draft while payout is unverified
  console.log('Attempting to accept draft before payment verification (should fail)...');
  const acceptFailRes = await fetch(`${BACKEND_URL}/drafts/accept`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      Cookie: advCookie || ''
    },
    body: JSON.stringify({ OLBID: testOlb.olbId })
  });

  if (acceptFailRes.ok) {
    throw new Error('Accept Draft succeeded but should have failed due to unverified payout!');
  } else {
    const errorData = await acceptFailRes.json();
    console.log(`-> Correctly rejected with status ${acceptFailRes.status}: "${errorData.Msg}"`);
  }

  // 8. Advocate verifies the payment received
  console.log('Advocate confirming payment received (status update)...');
  const advPayId = invoiceDb.adv_pay_id;
  const updateStatusRes = await fetch(`${BACKEND_URL}/billing/invoices/update-adv-payment-status`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      Cookie: advCookie || ''
    },
    body: JSON.stringify({
      AdvPayID: advPayId,
      Status: 1, // Success
      Remarks: 'Verified in bank account'
    })
  });

  if (!updateStatusRes.ok) {
    const errorText = await updateStatusRes.text();
    throw new Error(`Update status failed: ${errorText}`);
  }

  const updateStatusData = await updateStatusRes.json();
  console.log(`Update status response: ${updateStatusData.Msg}`);

  // Query database to verify it changed to success
  invoiceDb = await prisma.invoice_master.findUnique({
    where: { invoice_id: testInvoice.invoice_id },
    include: { adv_payment_master: true }
  });
  console.log(`- Updated Invoice adv_payment_status: ${invoiceDb.adv_payment_status} (Expected: 1)`);
  console.log(`- Updated Payout master payment_status: ${invoiceDb.adv_payment_master?.payment_status} (Expected: 1)`);

  if (invoiceDb.adv_payment_status !== 1 || invoiceDb.adv_payment_master?.payment_status !== 1) {
    throw new Error('Payment status did not update to Success (1) in database!');
  }
  console.log('-> Advocate payout marked as Success (1) successfully!');

  // 9. Try to accept the draft now that payout is verified (should succeed)
  console.log('Attempting to accept draft after payment verification (should succeed)...');
  const acceptRes = await fetch(`${BACKEND_URL}/drafts/accept`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      Cookie: advCookie || ''
    },
    body: JSON.stringify({ OLBID: testOlb.olbId })
  });

  if (!acceptRes.ok) {
    const errorText = await acceptRes.text();
    throw new Error(`Accept draft failed: ${errorText}`);
  }

  const acceptData = await acceptRes.json();
  console.log(`Accept draft response: ${acceptData.Msg}`);

  // Verify draft status in database is now 4
  olbDb = await prisma.olb.findUnique({ where: { olbId: testOlb.olbId } });
  console.log(`- Final Draft draftStatus: ${olbDb.draftStatus} (Expected: 4 - Complete Draft)`);
  if (olbDb.draftStatus !== 4) {
    throw new Error('Draft status was not updated to 4!');
  }
  console.log('-> Draft accepted and completed successfully!');

  // Cleanup test records
  console.log('Cleaning up test records...');
  // Delete notifications generated
  await prisma.notification.deleteMany({
    where: { olbId: testOlb.olbId }
  });
  // Delete invoice and payout
  await prisma.invoice_master.delete({ where: { invoice_id: testInvoice.invoice_id } });
  await prisma.adv_payment_history_master.deleteMany({ where: { adv_pay_id: advPayId } });
  await prisma.adv_payment_master.delete({ where: { adv_pay_id: advPayId } });
  // Delete OLB
  await prisma.olb.delete({ where: { olbId: testOlb.olbId } });
  console.log('Cleanup completed.');

  console.log('\n======================================================');
  console.log('  INTEGRATION TEST PASSED SUCCESSFULLY!');
  console.log('======================================================\n');
}

runTest()
  .catch(err => {
    console.error('Integration test failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
