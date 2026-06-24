import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function runRecoveryTests() {
  console.log('--- Starting Password Recovery OTP Flow Tests ---');

  // Find a test user (e.g. an agent or advocate)
  const testUser = await prisma.user.findFirst({
    where: {
      status: 1,
      email: { not: '' },
      mobile: { not: '' }
    }
  });

  if (!testUser) {
    console.error('No suitable test user found with registered Email and Mobile.');
    process.exit(1);
  }

  const username = testUser.username || '';
  const originalPasswordHash = testUser.password || '';

  console.log(`Using test user: ${username}`);
  console.log(`Original Password Hash: ${originalPasswordHash}`);

  // Base API url
  const apiBase = 'http://localhost:5000/api/auth';

  // Step 1: Request Password Recovery
  console.log('\n[Step 1] Requesting Forgot Password details...');
  const forgotRes = await fetch(`${apiBase}/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username })
  });

  const forgotData: any = await forgotRes.json();
  console.log('Forgot Password response status:', forgotRes.status);
  console.log('Response body:', forgotData);
  if (!forgotRes.ok || forgotData.Status !== 100) {
    throw new Error('Forgot Password lookup failed');
  }

  if (!forgotData.email.includes('*') || !forgotData.mobile.includes('*')) {
    throw new Error('Email or Mobile details were not correctly masked in the response');
  }
  console.log('Masked details verified successfully.');

  // Step 2: Send OTP
  console.log('\n[Step 2] Requesting OTP via Email...');
  // Force test environment
  process.env.NODE_ENV = 'test';
  
  const otpRes = await fetch(`${apiBase}/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, method: 'email' })
  });

  const otpData: any = await otpRes.json();
  console.log('Send OTP response status:', otpRes.status);
  console.log('Response body (with OTP in test mode):', otpData);
  if (!otpRes.ok || otpData.Status !== 100 || !otpData.otp) {
    throw new Error('Failed to request OTP or retrieve OTP payload');
  }

  const receivedOtp = otpData.otp;
  console.log(`Retrieved simulated OTP: ${receivedOtp}`);

  // Step 3: Verify OTP
  console.log('\n[Step 3] Verifying OTP and generating reset token...');
  const verifyRes = await fetch(`${apiBase}/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, otp: receivedOtp })
  });

  const verifyData: any = await verifyRes.json();
  console.log('Verify OTP response status:', verifyRes.status);
  console.log('Response body (with reset token in test mode):', verifyData);
  if (!verifyRes.ok || verifyData.Status !== 100 || !verifyData.token) {
    throw new Error('Failed to verify OTP or retrieve reset token');
  }

  const resetToken = verifyData.token;
  console.log(`Retrieved Reset Token: ${resetToken}`);

  // Step 4: Reset Password
  console.log('\n[Step 4] Resetting password to a temporary value...');
  const newPassword = 'TemporaryNewPassword123!';
  const resetRes = await fetch(`${apiBase}/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: resetToken, newPassword })
  });

  const resetData: any = await resetRes.json();
  console.log('Reset Password response status:', resetRes.status);
  console.log('Response body:', resetData);
  if (!resetRes.ok || resetData.Status !== 100) {
    throw new Error('Failed to reset password using token');
  }

  // Step 5: Verify new login works, then restore original password hash
  console.log('\n[Step 5] Verifying login with new password...');
  const loginRes = await fetch(`${apiBase}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ UserName: username, Password: newPassword })
  });

  const loginData: any = await loginRes.json();
  console.log('Login response status:', loginRes.status);
  if (!loginRes.ok) {
    throw new Error('Failed to login using the newly reset password');
  }
  console.log('Login successful! New credentials validated.');

  // Restore original password hash directly in DB to prevent locking user out
  console.log('\n[Step 6] Restoring user original password hash...');
  await prisma.user.update({
    where: { username },
    data: { password: originalPasswordHash }
  });
  console.log('Original password hash restored successfully.');

  console.log('\n--- All Password Recovery OTP Flow Tests Passed Successfully ---');
}

runRecoveryTests()
  .catch(err => {
    console.error('Password recovery test failed:', err);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
