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

  // ==========================================
  // Fallback Test: User has no email registered
  // ==========================================
  console.log('\n--- Starting Fallback Password Recovery Tests (No Email) ---');
  
  const originalEmail = testUser.email;
  console.log(`Temporarily removing email for user ${username}...`);
  await prisma.user.update({
    where: { username },
    data: { email: '' }
  });

  try {
    // Fallback Step 1: Request Password Recovery details (should have empty email)
    console.log('\n[Fallback Step 1] Requesting Forgot Password details...');
    const fbForgotRes = await fetch(`${apiBase}/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username })
    });
    const fbForgotData: any = await fbForgotRes.json();
    console.log('Forgot Password response:', fbForgotData);
    if (!fbForgotRes.ok || fbForgotData.email !== '') {
      throw new Error('Fallback Forgot Password details are incorrect');
    }

    // Fallback Step 2: Try email OTP (should fail/return 400 since email is empty)
    console.log('\n[Fallback Step 2] Requesting OTP via Email (expected to fail)...');
    const fbEmailOtpRes = await fetch(`${apiBase}/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, method: 'email' })
    });
    const fbEmailOtpData: any = await fbEmailOtpRes.json();
    console.log('Email OTP response status (expect 400):', fbEmailOtpRes.status);
    console.log('Response body:', fbEmailOtpData);
    if (fbEmailOtpRes.ok || fbEmailOtpData.Status !== 0) {
      throw new Error('Email OTP should have failed due to missing email address');
    }

    // Fallback Step 3: Request OTP via SMS (should succeed)
    console.log('\n[Fallback Step 3] Requesting OTP via SMS...');
    const fbSmsOtpRes = await fetch(`${apiBase}/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, method: 'sms' })
    });
    const fbSmsOtpData: any = await fbSmsOtpRes.json();
    console.log('SMS OTP response status:', fbSmsOtpRes.status);
    console.log('Response body:', fbSmsOtpData);
    if (!fbSmsOtpRes.ok || fbSmsOtpData.Status !== 100 || !fbSmsOtpData.otp) {
      throw new Error('Failed to request OTP via SMS');
    }
    const fbReceivedOtp = fbSmsOtpData.otp;

    // Fallback Step 4: Verify SMS OTP (should succeed, and reset link should send via SMS fallback)
    console.log('\n[Fallback Step 4] Verifying OTP and generating reset token...');
    const fbVerifyRes = await fetch(`${apiBase}/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, otp: fbReceivedOtp })
    });
    const fbVerifyData: any = await fbVerifyRes.json();
    console.log('Verify OTP response:', fbVerifyData);
    if (!fbVerifyRes.ok || fbVerifyData.Status !== 100 || !fbVerifyData.token) {
      throw new Error('Failed to verify OTP or retrieve reset token in fallback mode');
    }
    const fbResetToken = fbVerifyData.token;

    // Fallback Step 5: Reset Password using the token
    console.log('\n[Fallback Step 5] Resetting password...');
    const fbNewPassword = 'FallbackPassword987!';
    const fbResetRes = await fetch(`${apiBase}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: fbResetToken, newPassword: fbNewPassword })
    });
    if (!fbResetRes.ok) {
      throw new Error('Failed to reset password in fallback mode');
    }

    // Fallback Step 6: Verify login works with fallback reset password
    console.log('\n[Fallback Step 6] Verifying login with new fallback password...');
    const fbLoginRes = await fetch(`${apiBase}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ UserName: username, Password: fbNewPassword })
    });
    if (!fbLoginRes.ok) {
      throw new Error('Failed to login using the fallback reset password');
    }
    console.log('Fallback login successful!');

  } finally {
    // Restore original details directly in DB to prevent locking user out
    console.log('\n[Restore] Restoring user original password hash and email address...');
    await prisma.user.update({
      where: { username },
      data: { 
        password: originalPasswordHash,
        email: originalEmail
      }
    });
    console.log('Original user details restored successfully.');
  }

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
