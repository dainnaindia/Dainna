import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { sendEmail } from '../utils/mailer';

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

// GET /api/users/agents (Admin only)
router.get('/agents', authMiddleware, async (req: Request, res: Response): Promise<any> => {
  try {
    const agents = await prisma.user.findMany({
      where: { userTypeId: 3 },
      orderBy: { userId: 'desc' }
    });
    return res.json({ Status: 100, Agents: agents });
  } catch (error) {
    console.error('List agents error:', error);
    return res.status(500).json({ Error: 'Internal Server Error' });
  }
});

// GET /api/users/advocates (Admin only)
router.get('/advocates', authMiddleware, async (req: Request, res: Response): Promise<any> => {
  try {
    const advocates = await prisma.user.findMany({
      where: { userTypeId: 4 },
      orderBy: { userId: 'desc' }
    });
    return res.json({ Status: 100, Advocates: advocates });
  } catch (error) {
    console.error('List advocates error:', error);
    return res.status(500).json({ Error: 'Internal Server Error' });
  }
});

// POST /api/users/register (Admin registers agent/advocate)
router.post('/register', authMiddleware, async (req: Request, res: Response): Promise<any> => {
  const {
    Firstname, Middlename, Surname, Firmname, Username, Password, Mobile, Email,
    Address, StateID, City, WorkingCity, OfficePhone, AadharNo, SqId, SecurityAns,
    RatePerSqmt, UserTypeID, SecurePin
  } = req.body;

  if (!Username || !Password || !UserTypeID) {
    return res.status(400).json({ Status: 0, Msg: 'Username, Password, and Role are required.' });
  }

  try {
    // Check if username already exists
    const existingUser = await prisma.user.findFirst({
      where: { username: Username }
    });
    if (existingUser) {
      return res.status(400).json({ Status: 0, Msg: 'Username already exists.' });
    }

    const hashedPassword = await bcrypt.hash(Password, 10);
    const userTypeIDVal = parseInt(UserTypeID);
    const stateIdVal = StateID ? parseInt(StateID) : null;
    const sqIdVal = SqId ? parseInt(SqId) : null;
    const rateVal = RatePerSqmt ? parseFloat(RatePerSqmt) : null;

    // Generate legacy user code (simple random or sequence)
    const userCodeVal = Math.floor(1000 + Math.random() * 9000);
    const prefix = userTypeIDVal === 3 ? 'AGT' : userTypeIDVal === 2 ? 'STF' : 'ADV';
    const userCodeFullVal = `DAINNA-${prefix}-${userCodeVal}`;

    const newUser = await prisma.user.create({
      data: {
        firstname: Firstname || '',
        middlename: Middlename || '',
        surname: Surname || '',
        firmname: Firmname || '',
        username: Username,
        password: hashedPassword,
        mobile: Mobile || '',
        email: Email || '',
        address: Address || '',
        stateId: stateIdVal,
        city: City || '',
        workingCity: WorkingCity || '',
        officePhone: OfficePhone || '',
        aadharNo: AadharNo || '',
        sqId: sqIdVal,
        securityAns: SecurityAns || '',
        userTypeId: userTypeIDVal,
        ratePerSqmt: rateVal,
        securePin: SecurePin || '',
        status: 1, // Active by default
        userCode: userCodeVal,
        userCodeFull: userCodeFullVal,
        addedby: req.body.currentUser.userId,
        addeddate: new Date()
      }
    });

    return res.json({ Status: 2, Msg: 'User registered successfully.', UserID: newUser.userId });
  } catch (error) {
    console.error('Register user error:', error);
    return res.status(500).json({ Status: 1, Msg: 'Registration failed.' });
  }
});

// PUT /api/users/status/:id (Toggle active/inactive status)
router.put('/status/:id', authMiddleware, async (req: Request, res: Response): Promise<any> => {
  const userId = parseInt(req.params.id);
  const { Status } = req.body; // expected 1 (active) or 0 (inactive)

  try {
    await prisma.user.update({
      where: { userId },
      data: {
        status: parseInt(Status) === 1 ? 1 : 0,
        modifiedby: req.body.currentUser.userId,
        modifieddate: new Date()
      }
    });
    return res.json({ Status: 100, Msg: 'User status updated successfully.' });
  } catch (error) {
    console.error('Toggle status error:', error);
    return res.status(500).json({ Error: 'Internal Server Error' });
  }
});

// GET /api/users/profile
router.get('/profile', authMiddleware, async (req: Request, res: Response): Promise<any> => {
  const currentUser = req.body.currentUser;
  try {
    const user = await prisma.user.findUnique({
      where: { userId: currentUser.userId }
    });
    if (!user) {
      return res.status(404).json({ Error: 'User not found.' });
    }

    // If advocate, fetch associated project
    let project = null;
    if (user.userTypeId === 4) {
      project = await prisma.project.findFirst({
        where: { advocate_id: user.userId },
        include: { state_master: true }
      });
    }

    return res.json({ Status: 100, User: user, Project: project });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({ Error: 'Internal Server Error' });
  }
});

// PUT /api/users/profile (Edit current user's profile info)
router.put('/profile', authMiddleware, async (req: Request, res: Response): Promise<any> => {
  const currentUser = req.body.currentUser;
  const {
    Firstname, Middlename, Surname, Email, Mobile, Address,
    District, City, StateID, Postcode, OfficePhone, AadharNo,
    Password, SecurePin, RatePerSqmt,
    BankName, BankBranch, BankIfscCode, BankAcHolder, BankAcNo
  } = req.body;

  try {
    const updateData: any = {
      firstname: Firstname,
      middlename: Middlename,
      surname: Surname,
      email: Email,
      mobile: Mobile,
      address: Address,
      district: District,
      city: City,
      stateId: StateID ? parseInt(StateID) : undefined,
      postcode: Postcode,
      officePhone: OfficePhone,
      aadharNo: AadharNo,
      securePin: SecurePin,
      bankName: BankName,
      bankBranch: BankBranch,
      bankIfscCode: BankIfscCode,
      bankAcHolder: BankAcHolder,
      bankAcNo: BankAcNo,
      modifiedby: currentUser.userId,
      modifieddate: new Date()
    };

    if (Password) {
      updateData.password = await bcrypt.hash(Password, 10);
    }

    if (RatePerSqmt !== undefined) {
      updateData.ratePerSqmt = parseFloat(RatePerSqmt) || null;
    }

    await prisma.user.update({
      where: { userId: currentUser.userId },
      data: updateData
    });
    return res.json({ Status: 100, Msg: 'Profile updated successfully.' });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ Error: 'Internal Server Error' });
  }
});

// GET /api/users/states
router.get('/states', async (req: Request, res: Response): Promise<any> => {
  try {
    const states = await prisma.state_master.findMany({
      orderBy: { state_name: 'asc' }
    });
    return res.json({ Status: 100, States: states });
  } catch (error) {
    console.error('Get states error:', error);
    return res.status(500).json({ Error: 'Internal Server Error' });
  }
});

// GET /api/users/security-questions
router.get('/security-questions', async (req: Request, res: Response): Promise<any> => {
  try {
    const questions = await prisma.security_que_master.findMany({
      orderBy: { sq_id: 'asc' }
    });
    return res.json({ Status: 100, Questions: questions });
  } catch (error) {
    console.error('Get security questions error:', error);
    return res.status(500).json({ Error: 'Internal Server Error' });
  }
});

// POST /api/users/public/register (Public agent/advocate signup)
router.post('/public/register', async (req: Request, res: Response): Promise<any> => {
  const {
    Firstname, Middlename, Surname, Firmname, Username, Password, Mobile, Email,
    Address, District, City, StateID, Pincode, WorkingCity, OfficePhone, AadharNo, SqId, SecurityAns,
    TermsAccept, UserTypeID, ProjectID
  } = req.body;

  if (!Username || !Password || !UserTypeID) {
    return res.status(400).json({ Status: 0, Msg: 'Username, Password, and Role are required.' });
  }

  const userTypeIDVal = parseInt(UserTypeID);
  if (userTypeIDVal !== 3 && userTypeIDVal !== 4) {
    return res.status(400).json({ Status: 0, Msg: 'Invalid role for public registration.' });
  }

  try {
    // Check if username already exists
    const existingUser = await prisma.user.findFirst({
      where: { username: Username }
    });
    if (existingUser) {
      return res.status(400).json({ Status: 0, Msg: 'Username already exists.' });
    }

    // If ProjectID is provided, validate email and project details
    let projectPrefix = '';
    if (ProjectID) {
      const project = await prisma.project.findUnique({
        where: { projectId: parseInt(ProjectID) }
      });
      if (!project) {
        return res.status(400).json({ Status: 0, Msg: 'Invalid Project ID.' });
      }
      if (!project.email || project.email.trim().toLowerCase() !== (Email || '').trim().toLowerCase()) {
        return res.status(400).json({ Status: '00', Msg: 'Your Email is Not Registered.' });
      }
      if (project.projectName) {
        projectPrefix = project.projectName.substring(0, 3).toUpperCase();
      }
    }

    const hashedPassword = await bcrypt.hash(Password, 10);
    const stateIdVal = StateID ? parseInt(StateID) : null;
    const sqIdVal = SqId ? parseInt(SqId) : null;

    // Generate legacy user code (simple random or sequence)
    const userCodeVal = Math.floor(1000 + Math.random() * 9000);
    
    // Generate userCodeFullVal based on StateName and WorkingCity if available
    let statePrefix = 'SYS';
    if (stateIdVal) {
      const stateObj = await prisma.state_master.findUnique({
        where: { state_id: stateIdVal }
      });
      if (stateObj && stateObj.state_name) {
        statePrefix = stateObj.state_name.substring(0, 3).toUpperCase();
      }
    }
    const cityPrefix = WorkingCity ? WorkingCity.substring(0, 3).toUpperCase() : 'WCT';
    const digitStr = String(userCodeVal).padStart(4, '0');
    const userCodeFullVal = projectPrefix
      ? `${statePrefix}/${cityPrefix}/${projectPrefix}/${digitStr}`
      : `${statePrefix}/${cityPrefix}/${digitStr}`;

    let verifyToken = null;
    let verifyTokenExpires = null;
    let emailVerifiedStatus = undefined;

    if (userTypeIDVal === 3) {
      verifyToken = crypto.randomBytes(32).toString('hex');
      verifyTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      emailVerifiedStatus = 0;
    }

    const newUser = await prisma.user.create({
      data: {
        firstname: Firstname || '',
        middlename: Middlename || '',
        surname: Surname || '',
        firmname: Firmname || '',
        username: Username,
        password: hashedPassword,
        mobile: Mobile || '',
        email: Email || '',
        address: Address || '',
        district: District || '',
        city: City || '',
        stateId: stateIdVal,
        postcode: Pincode || '',
        workingCity: WorkingCity || '',
        officePhone: OfficePhone || '',
        aadharNo: AadharNo || '',
        sqId: sqIdVal,
        securityAns: SecurityAns || '',
        userTypeId: userTypeIDVal,
        status: 1, // Active by default
        userCode: userCodeVal,
        userCodeFull: userCodeFullVal,
        termsAccept: TermsAccept ? 1 : 0,
        addeddate: new Date(),
        token: verifyToken,
        tokenExpires: verifyTokenExpires,
        emailVerified: emailVerifiedStatus
      }
    });

    if (userTypeIDVal === 3 && verifyToken) {
      const frontendUrl = (process.env.CORS_ORIGIN || 'http://localhost:3000').split(',')[0].trim();
      const verifyLink = `${frontendUrl}/login?verify=${verifyToken}`;
      sendEmail({
        to: Email || '',
        subject: 'Verify Your Dainna Agent Account',
        text: `Welcome to Dainna!\n\nPlease verify your email address by clicking the link below:\n${verifyLink}\n\nThank you!`,
        html: `<h3>Welcome to Dainna!</h3>
<p>Please click the link below to verify your email address and activate your agent account:</p>
<p><a href="${verifyLink}" style="display:inline-block;padding:10px 20px;color:#fff;background-color:#4F46E5;border-radius:6px;text-decoration:none;font-weight:bold;">Verify Account</a></p>
<p>Or copy and paste this URL into your browser:</p>
<p><a href="${verifyLink}">${verifyLink}</a></p>
<p>Thank you!</p>`
      }).catch(err => console.error('Failed to send verification email inside register:', err));
    }

    // Link advocate user to the project
    if (ProjectID) {
      await prisma.project.update({
        where: { projectId: parseInt(ProjectID) },
        data: { advocate_id: newUser.userId }
      });
    }

    return res.json({ Status: 4, Msg: 'Registration successful!', UserCodeFull: userCodeFullVal, UserID: newUser.userId });
  } catch (error) {
    console.error('Public register user error:', error);
    return res.status(500).json({ Status: 3, Msg: 'Registration failed.' });
  }
});

// GET /api/users/staff (Admin only)
router.get('/staff', authMiddleware, async (req: Request, res: Response): Promise<any> => {
  try {
    const staff = await prisma.user.findMany({
      where: { userTypeId: 2 },
      orderBy: { userId: 'desc' }
    });
    return res.json({ Status: 100, Staff: staff });
  } catch (error) {
    console.error('List staff error:', error);
    return res.status(500).json({ Error: 'Internal Server Error' });
  }
});

// POST /api/users/verify-pin
router.post('/verify-pin', authMiddleware, async (req: Request, res: Response): Promise<any> => {
  const { SecurePin } = req.body;
  const currentUser = req.body.currentUser;

  try {
    const user = await prisma.user.findUnique({
      where: { userId: currentUser.userId }
    });
    if (!user || user.securePin !== SecurePin) {
      return res.status(400).json({ Status: 0, Msg: 'Invalid PIN.' });
    }
    return res.json({ Status: 1, Msg: 'PIN verified successfully.' });
  } catch (error) {
    console.error('Verify pin error:', error);
    return res.status(500).json({ Error: 'Internal Server Error' });
  }
});

// POST /api/users/forgot-pin
router.post('/forgot-pin', authMiddleware, async (req: Request, res: Response): Promise<any> => {
  const { EmailID } = req.body;
  const currentUser = req.body.currentUser;

  try {
    const user = await prisma.user.findUnique({
      where: { userId: currentUser.userId }
    });
    if (!user || !user.email || user.email.trim().toLowerCase() !== (EmailID || '').trim().toLowerCase()) {
      return res.json({ Status: 0, Msg: 'Please Enter Registered Email ID.' });
    }
    // Send email with the secure pin
    sendEmail({
      to: user.email,
      subject: 'Dainna Secure PIN Recovery',
      text: `Hello ${user.firstname},\n\nWe received a request to recover your Secure PIN. Below is your PIN:\n\nSecure PIN: ${user.securePin}\n\nIf you did not request this, please secure your account.\n\nThank you!`,
      html: `<h3>Hello ${user.firstname},</h3>
<p>We received a request to recover your Secure PIN. Below is your PIN:</p>
<p><strong>Secure PIN: <span style="font-size: 18px; color: #4F46E5;">${user.securePin}</span></strong></p>
<p>If you did not request this, please secure your account immediately.</p>
<p>Thank you!</p>`
    }).catch(err => console.error('Failed to send PIN recovery email:', err));
    return res.json({ Status: 2, Msg: 'Check Your Email For Secure Pin.' });
  } catch (error) {
    console.error('Forgot PIN error:', error);
    return res.status(500).json({ Status: 1, Msg: 'Internal Server Error' });
  }
});

// PUT /api/users/states/:id (Update state details)
router.put('/states/:id', authMiddleware, async (req: Request, res: Response): Promise<any> => {
  const stateId = parseInt(req.params.id);
  const { StateName, StateCode } = req.body;

  try {
    const existing = await prisma.state_master.findFirst({
      where: {
        state_name: StateName,
        NOT: { state_id: stateId }
      }
    });

    if (existing) {
      return res.status(400).json({ Status: 0, Msg: 'State name already exists.' });
    }

    await prisma.state_master.update({
      where: { state_id: stateId },
      data: {
        state_name: StateName,
        state_code: StateCode,
        modifiedby: req.body.currentUser.userId,
        modifieddate: new Date()
      }
    });

    return res.json({ Status: 4, Msg: 'State updated successfully.' });
  } catch (error) {
    console.error('Update state error:', error);
    return res.status(500).json({ Status: 3, Msg: 'Failed to update state.' });
  }
});

// PUT /api/users/update-user/:id (Update any user details)
router.put('/update-user/:id', authMiddleware, async (req: Request, res: Response): Promise<any> => {
  const userId = parseInt(req.params.id);
  const {
    Firstname, Middlename, Surname, Firmname, Username, Password, Mobile, Email,
    Address, District, City, StateID, Pincode, WorkingCity, OfficePhone, AadharNo,
    RatePerSqmt, Status, SecurePin
  } = req.body;

  try {
    const updateData: any = {
      firstname: Firstname,
      middlename: Middlename,
      surname: Surname,
      firmname: Firmname,
      username: Username,
      mobile: Mobile,
      email: Email,
      address: Address,
      district: District,
      city: City,
      stateId: StateID ? parseInt(StateID) : null,
      postcode: Pincode,
      workingCity: WorkingCity,
      officePhone: OfficePhone,
      aadharNo: AadharNo,
      securePin: SecurePin,
      status: Status !== undefined ? parseInt(Status) : undefined,
      modifiedby: req.body.currentUser.userId,
      modifieddate: new Date()
    };

    if (Password) {
      updateData.password = await bcrypt.hash(Password, 10);
    }
    if (RatePerSqmt !== undefined) {
      updateData.ratePerSqmt = parseFloat(RatePerSqmt) || null;
    }

    await prisma.user.update({
      where: { userId },
      data: updateData
    });

    return res.json({ Status: 4, Msg: 'User updated successfully.' });
  } catch (error) {
    console.error('Update user error:', error);
    return res.status(500).json({ Status: 3, Msg: 'Failed to update user.' });
  }
});

// DELETE /api/users/:id
router.delete('/:id', authMiddleware, async (req: Request, res: Response): Promise<any> => {
  const userId = parseInt(req.params.id);
  try {
    await prisma.user.delete({
      where: { userId }
    });
    return res.json({ Status: 6, Msg: 'User deleted successfully.' });
  } catch (error) {
    console.error('Delete user error:', error);
    if ((error as any).code === 'P2003') {
      // Foreign key constraint violation in Prisma
      return res.status(400).json({ Status: '00', Msg: 'Reference exists for this user.' });
    }
    return res.status(500).json({ Status: '5', Msg: 'Failed to delete user.' });
  }
});

export default router;
