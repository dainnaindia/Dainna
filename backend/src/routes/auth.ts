import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { sendEmail } from '../utils/mailer';
import { sendSMS } from '../utils/sms';

const router = Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'dainna-secret-super-key-2.0';

// Helper for legacy MD5 verification
function md5(str: string): string {
  return crypto.createHash('md5').update(str).digest('hex');
}

// User login API
router.post('/login', async (req: Request, res: Response): Promise<any> => {
  const { UserName, Password } = req.body;

  if (!UserName || !Password) {
    return res.status(400).json({ Status: 0, Msg: 'Username and password are required.' });
  }

  try {
    const user = await prisma.user.findFirst({
      where: { username: UserName },
    });

    if (!user) {
      return res.status(401).json({ Status: 1, Msg: 'Login Failed. Incorrect username or password.' });
    }

    if ((user.wrongPwdCount || 0) >= 5) {
      // Temporarily lock account
      await prisma.user.update({
        where: { userId: user.userId },
        data: { status: 0 },
      });
      return res.status(403).json({ Status: 0, Msg: 'Your Account Has Temporarily Been Locked Due To Failed Login Attempts.' });
    }

    let passwordMatched = false;
    let needsRehash = false;

    // Check modern Bcrypt hash
    if (user.password && user.password.startsWith('$2')) {
      passwordMatched = await bcrypt.compare(Password, user.password);
    } 
    // Fallback checking for legacy MD5
    else if (user.password === md5(Password)) {
      passwordMatched = true;
      needsRehash = true;
    }

    if (passwordMatched) {
      // Auto-rehash legacy password to modern Bcrypt
      if (needsRehash) {
        const hashed = await bcrypt.hash(Password, 10);
        await prisma.user.update({
          where: { userId: user.userId },
          data: { password: hashed },
        });
      }

      // Reset login failures count
      await prisma.user.update({
        where: { userId: user.userId },
        data: { wrongPwdCount: 0 },
      });

      if (user.status !== 1) {
        return res.status(403).json({ Status: 5, Msg: 'Account is inactive. Please contact support.' });
      }

      // Sign JWT session token
      const token = jwt.sign(
        {
          userId: user.userId,
          username: user.username,
          userTypeId: user.userTypeId,
          firstname: user.firstname,
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Set cookie options
      const isProd = process.env.NODE_ENV === 'production';
      res.cookie('auth_token', token, {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? 'none' : 'lax',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      });

      return res.json({
        Status: 100,
        Msg: 'Login Successful.',
        UserTypeID: user.userTypeId,
        User: {
          userId: user.userId,
          username: user.username,
          firstname: user.firstname,
          userTypeId: user.userTypeId,
        },
      });
    } else {
      // Increment wrong login attempts count
      await prisma.user.update({
        where: { userId: user.userId },
        data: { wrongPwdCount: { increment: 1 } },
      });

      return res.status(401).json({ Status: 4, Msg: 'Login Failed. Incorrect username or password.' });
    }
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ Status: 0, Msg: 'Internal Server Error' });
  }
});

// Logout API
router.post('/logout', (req: Request, res: Response) => {
  res.clearCookie('auth_token');
  return res.json({ Status: 100, Msg: 'Logged out successfully.' });
});

// Verify session API
router.get('/session', async (req: Request, res: Response): Promise<any> => {
  const token = req.cookies?.auth_token || req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ Status: 0, Msg: 'Unauthorized' });
  }

  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { userId: decoded.userId },
      select: {
        userId: true,
        username: true,
        firstname: true,
        userTypeId: true,
        userCode: true,
        userCodeFull: true,
      },
    });

    if (!user) {
      return res.status(401).json({ Status: 0, Msg: 'User session expired or not found.' });
    }

    return res.json({ Status: 100, User: user });
  } catch (err) {
    return res.status(401).json({ Status: 0, Msg: 'Invalid session token' });
  }
});

// GET /api/auth/verify-email
router.get('/verify-email', async (req: Request, res: Response): Promise<any> => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ Status: 0, Msg: 'Token is required.' });
  }

  try {
    const user = await prisma.user.findFirst({
      where: {
        token: token as string,
        userTypeId: 3, // Agent only
      },
    });

    if (!user) {
      return res.status(400).json({ Status: 0, Msg: 'Invalid or expired verification token.' });
    }

    await prisma.user.update({
      where: { userId: user.userId },
      data: {
        emailVerified: 1,
        status: 1,
        emailVerifiedOn: new Date(),
      },
    });

    return res.json({ Status: 100, Msg: 'Email verified successfully.' });
  } catch (error) {
    console.error('Email verification error:', error);
    return res.status(500).json({ Status: 0, Msg: 'Internal Server Error' });
  }
});

// POST /api/auth/send-verification-email
router.post('/send-verification-email', async (req: Request, res: Response): Promise<any> => {
  const tokenVal = req.cookies?.auth_token || req.headers.authorization?.split(' ')[1];
  if (!tokenVal) {
    return res.status(401).json({ Status: 0, Msg: 'Unauthorized' });
  }

  try {
    const decoded: any = jwt.verify(tokenVal, JWT_SECRET);
    const userId = decoded.userId;

    const user = await prisma.user.findUnique({
      where: { userId },
    });

    if (!user) {
      return res.status(404).json({ Status: 0, Msg: 'User not found.' });
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.user.update({
      where: { userId },
      data: {
        token: verificationToken,
        tokenExpires,
      },
    });

    const frontendUrl = (process.env.CORS_ORIGIN || 'http://localhost:3000').split(',')[0].trim();
    const verifyLink = `${frontendUrl}/login?verify=${verificationToken}`;

    // Send email verification link
    sendEmail({
      to: user.email || '',
      subject: 'Verify Your Dainna Agent Account',
      text: `Hello ${user.firstname},\n\nPlease verify your email address by clicking the link below:\n${verifyLink}\n\nThank you!`,
      html: `<h3>Hello ${user.firstname},</h3>
<p>Please click the link below to verify your email address and activate your agent account:</p>
<p><a href="${verifyLink}" style="display:inline-block;padding:10px 20px;color:#fff;background-color:#4F46E5;border-radius:6px;text-decoration:none;font-weight:bold;">Verify Account</a></p>
<p>Or copy and paste this URL into your browser:</p>
<p><a href="${verifyLink}">${verifyLink}</a></p>
<p>Thank you!</p>`
    }).catch(err => console.error('Failed to send verification email inside auth:', err));

    return res.json({ Status: 100, Msg: 'Verification email sent.' });
  } catch (error) {
    console.error('Send verification email error:', error);
    return res.status(500).json({ Status: 0, Msg: 'Internal Server Error' });
  }
});

const otpStore = new Map<string, { otp: string; expires: number; method?: string }>();
const resetTokenStore = new Map<string, { username: string; expires: number }>();

function maskEmail(email: string): string {
  if (!email) return '';
  const [local, domain] = email.split('@');
  if (!domain) return email;
  if (local.length <= 2) {
    return `${local[0]}***@${domain}`;
  }
  return `${local[0]}${'*'.repeat(local.length - 2)}${local[local.length - 1]}@${domain}`;
}

function maskMobile(mobile: string): string {
  if (!mobile) return '';
  const clean = mobile.trim();
  if (clean.length <= 4) {
    return '*'.repeat(clean.length);
  }
  return '*'.repeat(clean.length - 4) + clean.slice(-4);
}

// POST /api/auth/forgot-password (Check username and return masked details)
router.post('/forgot-password', async (req: Request, res: Response): Promise<any> => {
  const { username } = req.body;
  if (!username) {
    return res.status(400).json({ Status: 0, Msg: 'Username is required.' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user) {
      return res.status(404).json({ Status: 0, Msg: 'Username not registered in the system.' });
    }

    return res.json({
      Status: 100,
      email: maskEmail(user.email || ''),
      mobile: maskMobile(user.mobile || '')
    });
  } catch (error) {
    console.error('Forgot password lookup error:', error);
    return res.status(500).json({ Status: 0, Msg: 'Internal Server Error' });
  }
});

// POST /api/auth/send-otp (Send 6-digit OTP via SMS or Email)
router.post('/send-otp', async (req: Request, res: Response): Promise<any> => {
  const { username, method } = req.body;
  if (!username || !method) {
    return res.status(400).json({ Status: 0, Msg: 'Username and verification method are required.' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user) {
      return res.status(404).json({ Status: 0, Msg: 'User not found.' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 5 * 60 * 1000; // 5 minutes
    otpStore.set(username, { otp, expires, method });

    if (method === 'email') {
      if (!user.email) {
        return res.status(400).json({ Status: 0, Msg: 'No registered email found for this user.' });
      }
      try {
        const mailResult = await sendEmail({
          to: user.email,
          subject: 'Your Dainna Verification OTP',
          text: `Your One-Time Password (OTP) for password recovery is: ${otp}. It is valid for 5 minutes.`,
          html: `
            <div style="font-family: Arial, sans-serif; color: #333; max-width: 500px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
              <h3 style="color: #1a56db; text-align: center;">Verification OTP</h3>
              <p>Hello ${user.firstname || 'User'},</p>
              <p>Your One-Time Password (OTP) for password recovery is:</p>
              <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #1a56db; border-radius: 4px; margin: 15px 0;">
                ${otp}
              </div>
              <p style="font-size: 12px; color: #666;">This OTP is valid for 5 minutes. Do not share this OTP with anyone.</p>
            </div>
          `
        });
        if (!mailResult || !mailResult.success) {
          console.warn(`[OTP] Email service failed to send OTP to ${user.email}. Fail result:`, mailResult);
          return res.status(400).json({ Status: 0, Msg: 'Email service failed. Please try SMS verification.' });
        }
      } catch (err: any) {
        console.error(`[OTP] Email service threw exception when sending to ${user.email}:`, err);
        return res.status(500).json({ Status: 0, Msg: 'Email service failed with error. Please try SMS verification.' });
      }
    } else if (method === 'sms') {
      if (!user.mobile) {
        return res.status(400).json({ Status: 0, Msg: 'No registered mobile number found for this user.' });
      }
      try {
        const smsResult = await sendSMS({
          to: user.mobile,
          message: `Your Dainna password recovery OTP is: ${otp}. Valid for 5 minutes.`
        });
        if (!smsResult || !smsResult.success) {
          console.warn(`[OTP] SMS service failed to send OTP to ${user.mobile}. Fail result:`, smsResult);
          return res.status(400).json({ Status: 0, Msg: 'SMS service failed. Please try again later.' });
        }
      } catch (err: any) {
        console.error(`[OTP] SMS service threw exception when sending to ${user.mobile}:`, err);
        return res.status(500).json({ Status: 0, Msg: 'SMS service failed with error.' });
      }
    } else {
      return res.status(400).json({ Status: 0, Msg: 'Invalid verification method.' });
    }

    const responsePayload: any = { Status: 100, Msg: 'OTP sent successfully.' };
    if (process.env.NODE_ENV !== 'production') {
      responsePayload.otp = otp;
    }
    return res.json(responsePayload);
  } catch (error: any) {
    console.error('Send OTP error:', error);
    return res.status(500).json({ Status: 0, Msg: error.message || 'Internal Server Error' });
  }
});

// POST /api/auth/verify-otp (Verify OTP and send password reset link)
router.post('/verify-otp', async (req: Request, res: Response): Promise<any> => {
  const { username, otp } = req.body;
  if (!username || !otp) {
    return res.status(400).json({ Status: 0, Msg: 'Username and OTP are required.' });
  }

  try {
    const record = otpStore.get(username);
    if (!record) {
      return res.status(400).json({ Status: 0, Msg: 'No OTP requested or OTP has expired.' });
    }

    if (Date.now() > record.expires) {
      otpStore.delete(username);
      return res.status(400).json({ Status: 0, Msg: 'OTP has expired. Please request a new one.' });
    }

    if (record.otp !== otp.trim()) {
      return res.status(400).json({ Status: 0, Msg: 'Incorrect OTP. Please check and try again.' });
    }

    // OTP verified! Clean up.
    otpStore.delete(username);

    // Generate secure password reset token
    const token = crypto.randomBytes(32).toString('hex');
    const expires = Date.now() + 15 * 60 * 1000; // 15 minutes
    resetTokenStore.set(token, { username, expires });

    // Send reset link
    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user) {
      return res.status(404).json({ Status: 0, Msg: 'User not found.' });
    }

    const frontendUrl = (process.env.CORS_ORIGIN || 'http://localhost:3000').split(',')[0].trim();
    const resetLink = `${frontendUrl}/reset_password?token=${token}`;

    let resetLinkSentEmail = false;

    // Send reset link to Email if present
    if (user.email) {
      try {
        const mailResult = await sendEmail({
          to: user.email,
          subject: 'Reset Your Dainna Password',
          text: `Please click the link below to reset your password:\n${resetLink}\n\nThis link is valid for 15 minutes.`,
          html: `
            <div style="font-family: Arial, sans-serif; color: #333; max-width: 500px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
              <h3 style="color: #1a56db; text-align: center;">Password Reset Request</h3>
              <p>Hello ${user.firstname || 'User'},</p>
              <p>We received a request to reset your password. Please click the button below to proceed:</p>
              <div style="text-align: center; margin: 20px 0;">
                <a href="${resetLink}" style="display:inline-block;padding:12px 24px;color:#fff;background-color:#1a56db;border-radius:6px;text-decoration:none;font-weight:bold;">Reset Password</a>
              </div>
              <p style="font-size: 12px; color: #666;">This link is valid for 15 minutes. If you did not request this, you can ignore this email.</p>
            </div>
          `
        });
        if (mailResult && mailResult.success) {
          resetLinkSentEmail = true;
          console.log(`[Reset Link] Successfully sent reset link via Email to ${user.email}`);
        } else {
          console.warn(`[Reset Link] Email service failed to send reset link to ${user.email}. Fail result:`, mailResult);
        }
      } catch (err) {
        console.error('Failed to send reset link email, falling back to SMS:', err);
      }
    }

    // Send reset link to SMS if email failed or was not registered
    if (!resetLinkSentEmail && user.mobile) {
      try {
        const smsResult = await sendSMS({
          to: user.mobile,
          message: `Reset your Dainna password by clicking this link: ${resetLink}. Link expires in 15 mins.`
        });
        if (smsResult && smsResult.success) {
          console.log(`[Reset Link] Successfully sent fallback reset link via SMS to ${user.mobile}`);
        } else {
          console.error(`[Reset Link] SMS fallback service failed to send reset link to ${user.mobile}. Fail result:`, smsResult);
        }
      } catch (err) {
        console.error('Failed to send reset link SMS:', err);
      }
    }

    const responsePayload: any = { Status: 100, Msg: 'OTP verified successfully. A secure password reset link has been sent to your registered Email and SMS.' };
    if (process.env.NODE_ENV !== 'production') {
      responsePayload.token = token;
    }
    return res.json(responsePayload);
  } catch (error: any) {
    console.error('Verify OTP error:', error);
    return res.status(500).json({ Status: 0, Msg: error.message || 'Internal Server Error' });
  }
});

// POST /api/auth/reset-password (Reset password with token)
router.post('/reset-password', async (req: Request, res: Response): Promise<any> => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    return res.status(400).json({ Status: 0, Msg: 'Token and new password are required.' });
  }

  try {
    const record = resetTokenStore.get(token);
    if (!record) {
      return res.status(400).json({ Status: 0, Msg: 'Invalid or expired password reset token.' });
    }

    if (Date.now() > record.expires) {
      resetTokenStore.delete(token);
      return res.status(400).json({ Status: 0, Msg: 'Password reset token has expired.' });
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { username: record.username },
      data: { password: hashed, wrongPwdCount: 0 }
    });

    // Clean up
    resetTokenStore.delete(token);

    return res.json({ Status: 100, Msg: 'Password updated successfully. You can now login with your new password.' });
  } catch (error: any) {
    console.error('Reset password error:', error);
    return res.status(500).json({ Status: 0, Msg: error.message || 'Internal Server Error' });
  }
});

export default router;
