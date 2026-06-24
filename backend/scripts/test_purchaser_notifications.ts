import { sendSMS } from '../src/utils/sms';
import { sendEmail } from '../src/utils/mailer';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runTests() {
  console.log('--- Starting Purchaser Notification Tests ---');

  // Test 1: Verify SMS Utility (console provider mode)
  console.log('\n[Test 1] Testing SMS Utility in Console/Simulation Mode...');
  const smsResult = await sendSMS({
    to: '9876543210',
    message: 'Test SMS: Your Dainna draft is ready.'
  });
  console.log('SMS Result:', smsResult);
  if (!smsResult.success) {
    throw new Error('SMS Utility failed in simulation mode');
  }

  // Test 2: Verify Mailer Utility simulation
  console.log('\n[Test 2] Testing Mailer Utility...');
  try {
    const emailResult = await sendEmail({
      to: 'test-purchaser@example.com',
      subject: 'Dainna Test Email',
      text: 'This is a test notification.',
      html: '<h3>Test</h3><p>This is a test notification.</p>'
    });
    console.log('Email Result:', emailResult);
  } catch (err: any) {
    console.warn('Email send threw expected configuration warning:', err.message || err);
  }

  // Test 3: Fetch a draft from database and verify relation fields
  console.log('\n[Test 3] Fetching draft from DB to verify schema...');
  const testDraft = await prisma.olb.findFirst({
    include: {
      state_master: true,
      user_master_olb_master_addedbyTouser_master: true
    }
  });

  if (testDraft) {
    console.log(`Found draft ID: ${testDraft.olbId}`);
    console.log(`Purchaser Name: ${testDraft.purchaserFirstName} ${testDraft.purchaserLastName}`);
    console.log(`Purchaser Mobile: ${testDraft.purchaserMobileNo || 'N/A'}`);
    console.log(`Purchaser Email: ${testDraft.purchaserEmail || 'N/A'}`);
  } else {
    console.log('No drafts found in database to test.');
  }

  console.log('\n--- Purchaser Notification Tests Completed ---');
}

runTests()
  .catch(err => {
    console.error('Test run failed:', err);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
