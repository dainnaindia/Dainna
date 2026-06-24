import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runVercelFallbackTests() {
  console.log('--- Starting Vercel SMTP Fallback Integration Tests ---');

  // Find a test user
  const testUser = await prisma.user.findFirst({
    where: {
      status: 1,
      email: { not: '' }
    }
  });

  if (!testUser) {
    console.error('No suitable test user found.');
    process.exit(1);
  }

  const username = testUser.username || '';
  const originalEmail = testUser.email || '';
  console.log(`Using test user: ${username} | Original Email: ${originalEmail}`);

  const apiBase = 'http://localhost:5000/api/auth';

  // 1. Temporarily change user email to simulate failure keyword
  const simulateFailureEmail = `${username}-simulate-failure@test.com`;
  console.log(`\n[Step 1] Temporarily setting user email to ${simulateFailureEmail} to trigger simulated SMTP failure...`);
  await prisma.user.update({
    where: { username },
    data: { email: simulateFailureEmail }
  });

  try {
    // 2. Call send-otp to email (should fail SMTP, but return fallback token)
    console.log('\n[Step 2] Triggering OTP via Email (local SMTP should fail)...');
    process.env.NODE_ENV = 'test';

    const otpRes = await fetch(`${apiBase}/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, method: 'email' })
    });

    const otpData: any = await otpRes.json();
    console.log('Send OTP response status:', otpRes.status);
    console.log('Response body:', otpData);

    if (!otpRes.ok || otpData.Status !== 100 || !otpData.vercelFallbackToken) {
      throw new Error('Expected vercelFallbackToken in response but none was returned.');
    }

    const fallbackToken = otpData.vercelFallbackToken;
    console.log(`Retrieved Vercel Fallback Token: ${fallbackToken}`);

    // 3. Simulate Vercel fetching the pending email content from backend
    console.log('\n[Step 3] Simulating Vercel serverless function fetching payload from Render backend...');
    const fetchRes = await fetch(`${apiBase}/fetch-pending-email?token=${fallbackToken}`);
    const fetchData: any = await fetchRes.json();
    console.log('Fetch pending email response status:', fetchRes.status);
    console.log('Response body:', fetchData);

    if (!fetchRes.ok || !fetchData.success || !fetchData.payload) {
      throw new Error('Failed to retrieve pending email payload from backend.');
    }

    const payload = fetchData.payload;
    console.log('Successfully retrieved email payload:');
    console.log(`- To     : ${payload.to}`);
    console.log(`- Subject: ${payload.subject}`);
    if (payload.to !== simulateFailureEmail) {
      throw new Error('Payload recipient does not match simulated failure email.');
    }

    // 4. Verify Single-Use Guarantee (second fetch should fail 404)
    console.log('\n[Step 4] Verifying single-use security guarantee (subsequent fetch should fail)...');
    const secondFetchRes = await fetch(`${apiBase}/fetch-pending-email?token=${fallbackToken}`);
    const secondFetchData: any = await secondFetchRes.json();
    console.log('Second fetch status (expect 404):', secondFetchRes.status);
    console.log('Response body:', secondFetchData);

    if (secondFetchRes.ok || secondFetchData.success) {
      throw new Error('Security vulnerability: Single-use token was reused.');
    }
    console.log('Security check passed: Token was invalidated on first pull.');

    console.log('\n--- Vercel SMTP Fallback Integration Tests Passed Successfully ---');

  } finally {
    // Restore original email
    console.log('\n[Clean Up] Restoring original email address for test user...');
    await prisma.user.update({
      where: { username },
      data: { email: originalEmail }
    });
    console.log('Original email address restored.');
  }
}

runVercelFallbackTests()
  .catch(err => {
    console.error('Vercel fallback test failed:', err);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
