import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

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
      res.cookie('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
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

    console.log(`\n======================================================`);
    console.log(`Verification link generated for Agent [${user.username}]:`);
    console.log(`http://localhost:3000/login?verify=${verificationToken}`);
    console.log(`======================================================\n`);

    return res.json({ Status: 100, Msg: 'Verification email sent (logged to server console).' });
  } catch (error) {
    console.error('Send verification email error:', error);
    return res.status(500).json({ Status: 0, Msg: 'Internal Server Error' });
  }
});

export default router;
