import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runUsernameRecoveryTests() {
  console.log('--- Starting Forgot Username Recovery Flow Tests ---');

  // Find a test user (e.g. an agent or advocate)
  const testUser = await prisma.user.findFirst({
    where: {
      status: 1,
      email: { not: '' }
    }
  });

  if (!testUser) {
    console.error('No suitable test user found with registered Email.');
    process.exit(1);
  }

  const registeredEmail = testUser.email || '';
  const expectedUsername = testUser.username || '';

  console.log(`Using test user registered email: ${registeredEmail}`);
  console.log(`Expected username to retrieve: ${expectedUsername}`);

  // Base API url
  const apiBase = 'http://localhost:5000/api/auth';

  // Step 1: Request OTP via email
  console.log('\n[Step 1] Requesting Forgot Username OTP...');
  // Force test environment to get OTP back in response
  process.env.NODE_ENV = 'test';

  const forgotRes = await fetch(`${apiBase}/forgot-username`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: registeredEmail })
  });

  const forgotData: any = await forgotRes.json();
  console.log('Forgot Username response status:', forgotRes.status);
  console.log('Response body:', forgotData);
  if (!forgotRes.ok || forgotData.Status !== 100 || !forgotData.otp) {
    throw new Error('Forgot Username OTP request failed');
  }

  const receivedOtp = forgotData.otp;
  console.log(`Retrieved simulated OTP: ${receivedOtp}`);

  // Step 2: Verify OTP and trigger email username dispatch
  console.log('\n[Step 2] Verifying OTP and requesting username list...');
  const verifyRes = await fetch(`${apiBase}/verify-username-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: registeredEmail, otp: receivedOtp })
  });

  const verifyData: any = await verifyRes.json();
  console.log('Verify OTP response status:', verifyRes.status);
  console.log('Response body:', verifyData);
  if (!verifyRes.ok || verifyData.Status !== 100) {
    throw new Error('Failed to verify OTP or retrieve usernames');
  }

  console.log('\n--- All Forgot Username Recovery Flow Tests Passed Successfully ---');
}

runUsernameRecoveryTests()
  .catch(err => {
    console.error('Username recovery test failed:', err);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
