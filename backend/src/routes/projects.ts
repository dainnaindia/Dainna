import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
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

// GET /api/projects
router.get('/', authMiddleware, async (req: Request, res: Response): Promise<any> => {
  const { StateID, City, email } = req.query;

  try {
    const whereClause: any = {};
    if (StateID) {
      whereClause.state_id = parseInt(StateID as string);
    }
    if (City) {
      whereClause.city = City as string;
    }
    if (email === 'null') {
      whereClause.email = null;
    } else if (email === 'notnull') {
      whereClause.email = { not: null, notIn: [''] };
    }

    const projects = await prisma.project.findMany({
      where: whereClause,
      include: {
        state_master: true
      },
      orderBy: { projectId: 'desc' }
    });

    // We also need advocate names. Let's fetch advocate user details
    const advocates = await prisma.user.findMany({
      where: { userTypeId: 4 },
      select: { userId: true, firstname: true, middlename: true, surname: true }
    });

    const advocateMap = new Map(advocates.map(a => [a.userId, `${a.firstname} ${a.middlename || ''} ${a.surname}`.trim()]));

    const formattedProjects = projects.map(p => ({
      projectId: p.projectId,
      projectName: p.projectName,
      stateId: p.state_id,
      stateName: p.state_master?.state_name || '',
      city: p.city,
      advocateId: p.advocate_id,
      advocateName: p.advocate_id ? (advocateMap.get(p.advocate_id) || 'Unknown') : 'None',
      email: p.email,
      addeddate: p.addeddate
    }));

    return res.json({ Status: 100, Projects: formattedProjects });
  } catch (error) {
    console.error('List projects error:', error);
    return res.status(500).json({ Error: 'Internal Server Error' });
  }
});

// GET /api/projects/rate-list (Staff rate list based on workingCity)
router.get('/rate-list', authMiddleware, async (req: Request, res: Response): Promise<any> => {
  const currentUser = req.body.currentUser;

  try {
    const user = await prisma.user.findUnique({
      where: { userId: currentUser.userId }
    });

    if (!user || !user.workingCity) {
      return res.status(400).json({ Status: 0, Msg: 'Working city not found for this user.' });
    }

    const handlingCharges = await prisma.handling_charges.findMany({
      where: { city: user.workingCity },
      include: {
        state_master: true,
        project_master: true
      }
    });

    const advocateIds = handlingCharges
      .map(c => c.project_master?.advocate_id)
      .filter((id): id is number => id !== null && id !== undefined);

    const advocates = await prisma.user.findMany({
      where: { userId: { in: advocateIds } },
      select: { userId: true, ratePerSqmt: true }
    });

    const advocateRateMap = new Map(advocates.map(a => [a.userId, a.ratePerSqmt || 0]));

    const calculatedRates = handlingCharges.map(charge => {
      const advId = charge.project_master?.advocate_id;
      const ratePerSqmt = advId ? (advocateRateMap.get(advId) || 0) : 0;

      return {
        chargeId: charge.charge_id,
        stateName: charge.state_master?.state_name || 'N/A',
        city: charge.city,
        projectName: charge.project_master?.projectName || 'N/A',
        rate: ratePerSqmt
      };
    });

    return res.json({ Status: 100, Rates: calculatedRates });
  } catch (error) {
    console.error('Calculate staff rates error:', error);
    return res.status(500).json({ Error: 'Internal Server Error' });
  }
});

// GET /api/projects/staff-bank-details (Staff bank details based on workingCity)
router.get('/staff-bank-details', authMiddleware, async (req: Request, res: Response): Promise<any> => {
  const currentUser = req.body.currentUser;

  try {
    const user = await prisma.user.findUnique({
      where: { userId: currentUser.userId }
    });

    if (!user || !user.workingCity) {
      return res.status(400).json({ Status: 0, Msg: 'Working city not found for this user.' });
    }

    const projects = await prisma.project.findMany({
      where: {
        city: user.workingCity,
        advocate_id: { not: null }
      },
      include: {
        state_master: true
      }
    });

    const advocateIds = projects
      .map(p => p.advocate_id)
      .filter((id): id is number => id !== null && id !== undefined);

    const advocates = await prisma.user.findMany({
      where: { userId: { in: advocateIds } },
      select: {
        userId: true,
        bankName: true,
        bankBranch: true,
        bankIfscCode: true,
        bankAcHolder: true,
        bankAcNo: true
      }
    });

    const advocateMap = new Map(advocates.map(a => [a.userId, a]));

    const formattedDetails = projects.map(p => {
      const advocate = p.advocate_id ? advocateMap.get(p.advocate_id) : null;
      return {
        projectId: p.projectId,
        stateName: p.state_master?.state_name || 'N/A',
        city: p.city || 'N/A',
        projectName: p.projectName || 'N/A',
        bankName: advocate?.bankName || 'N/A',
        bankBranch: advocate?.bankBranch || 'N/A',
        bankIfscCode: advocate?.bankIfscCode || 'N/A',
        bankAcHolder: advocate?.bankAcHolder || 'N/A',
        bankAcNo: advocate?.bankAcNo || 'N/A'
      };
    });

    return res.json({ Status: 100, BankDetails: formattedDetails });
  } catch (error) {
    console.error('Calculate staff bank details error:', error);
    return res.status(500).json({ Error: 'Internal Server Error' });
  }
});

// POST /api/projects (Register new project)
router.post('/', authMiddleware, async (req: Request, res: Response): Promise<any> => {
  const { ProjectName, StateID, City, AdvocateID, Email } = req.body;

  if (!ProjectName || !StateID || !City) {
    return res.status(400).json({ Status: 0, Msg: 'Project Name, State, and City are required.' });
  }

  try {
    const stateIdVal = parseInt(StateID);
    const advocateIdVal = AdvocateID ? parseInt(AdvocateID) : null;

    // Check duplicate
    const duplicate = await prisma.project.findFirst({
      where: {
        projectName: ProjectName,
        state_id: stateIdVal,
        city: City
      }
    });

    if (duplicate) {
      return res.status(400).json({ Status: 0, Msg: 'Project name already exists for this state and city.' });
    }

    const newProject = await prisma.project.create({
      data: {
        projectName: ProjectName,
        state_id: stateIdVal,
        city: City,
        advocate_id: advocateIdVal,
        email: Email || null,
        addedby: req.body.currentUser.userId,
        addeddate: new Date()
      }
    });

    return res.json({ Status: 2, Msg: 'Project created successfully.', ProjectID: newProject.projectId });
  } catch (error) {
    console.error('Create project error:', error);
    return res.status(500).json({ Status: 1, Msg: 'Failed to create project.' });
  }
});

// PUT /api/projects/:id (Update project)
router.put('/:id', authMiddleware, async (req: Request, res: Response): Promise<any> => {
  const projectId = parseInt(req.params.id);
  const { ProjectName, StateID, City, AdvocateID, Email } = req.body;

  try {
    const stateIdVal = parseInt(StateID);
    const advocateIdVal = AdvocateID ? parseInt(AdvocateID) : null;

    await prisma.project.update({
      where: { projectId },
      data: {
        projectName: ProjectName,
        state_id: stateIdVal,
        city: City,
        advocate_id: advocateIdVal,
        email: Email,
        modifiedby: req.body.currentUser.userId,
        modifieddate: new Date()
      }
    });

    return res.json({ Status: 100, Msg: 'Project updated successfully.' });
  } catch (error) {
    console.error('Update project error:', error);
    return res.status(500).json({ Error: 'Internal Server Error' });
  }
});

// DELETE /api/projects/:id
router.delete('/:id', authMiddleware, async (req: Request, res: Response): Promise<any> => {
  const projectId = parseInt(req.params.id);
  try {
    // Check references in handling_charges or invoice_master
    const referencedCharges = await prisma.handling_charges.count({
      where: { project_id: projectId }
    });
    const referencedInvoices = await prisma.invoice_master.count({
      where: { project_id: projectId }
    });

    if (referencedCharges > 0 || referencedInvoices > 0) {
      return res.status(400).json({ Status: 0, Msg: 'Cannot delete project. Active billing references exist.' });
    }

    await prisma.project.delete({
      where: { projectId }
    });

    return res.json({ Status: 100, Msg: 'Project deleted successfully.' });
  } catch (error) {
    console.error('Delete project error:', error);
    return res.status(500).json({ Error: 'Internal Server Error' });
  }
});

// GET /api/projects/pending-links (List sent registration links)
router.get('/pending-links', authMiddleware, async (req: Request, res: Response): Promise<any> => {
  try {
    const projects = await prisma.project.findMany({
      where: {
        advocate_id: null,
        email: { not: null, notIn: [''] }
      },
      include: {
        state_master: true
      },
      orderBy: { reg_link_sent_on: 'desc' }
    });

    const formatted = projects.map(p => ({
      projectId: p.projectId,
      projectName: p.projectName,
      stateId: p.state_id,
      stateName: p.state_master?.state_name || '',
      city: p.city,
      email: p.email,
      regLinkSentOn: p.reg_link_sent_on
    }));

    return res.json({ Status: 100, Links: formatted });
  } catch (error) {
    console.error('Pending links error:', error);
    return res.status(500).json({ Error: 'Internal Server Error' });
  }
});

// GET /api/projects/unassigned (Projects with no advocate or email)
router.get('/unassigned', authMiddleware, async (req: Request, res: Response): Promise<any> => {
  const { StateID, City } = req.query;

  try {
    const whereClause: any = {
      advocate_id: null,
      email: null
    };

    if (StateID) {
      whereClause.state_id = parseInt(StateID as string);
    }
    if (City) {
      whereClause.city = City as string;
    }

    const projects = await prisma.project.findMany({
      where: whereClause,
      include: {
        state_master: true
      },
      orderBy: { projectName: 'asc' }
    });

    return res.json({ Status: 100, Projects: projects });
  } catch (error) {
    console.error('Get unassigned projects error:', error);
    return res.status(500).json({ Error: 'Internal Server Error' });
  }
});

// POST /api/projects/send-link (Send registration link)
router.post('/send-link', authMiddleware, async (req: Request, res: Response): Promise<any> => {
  const { ProjectID, EmailID } = req.body;

  if (!ProjectID || !EmailID) {
    return res.status(400).json({ Status: 0, Msg: 'Project ID and Email ID are required.' });
  }

  try {
    const projectIdVal = parseInt(ProjectID);

    // Update project
    await prisma.project.update({
      where: { projectId: projectIdVal },
      data: {
        email: EmailID,
        reg_link_sent_on: new Date()
      }
    });

    const frontendUrl = (process.env.CORS_ORIGIN || 'http://localhost:3000').split(',')[0].trim();
    const regLink = `${frontendUrl}/register_advocate?pid=${projectIdVal}`;

    sendEmail({
      to: EmailID,
      subject: 'Invitation to Register as Advocate for Project',
      text: `Hello,\n\nYou have been invited to register as the Advocate for a project on Dainna.\n\nPlease click the link below to complete your registration:\n${regLink}\n\nThank you!`,
      html: `<h3>Hello,</h3>
<p>You have been invited to register as the Advocate for a project on Dainna.</p>
<p>Please click the link below to complete your registration:</p>
<p><a href="${regLink}" style="display:inline-block;padding:10px 20px;color:#fff;background-color:#4F46E5;border-radius:6px;text-decoration:none;font-weight:bold;">Register as Advocate</a></p>
<p>Or copy and paste this URL into your browser:</p>
<p><a href="${regLink}">${regLink}</a></p>
<p>Thank you!</p>`
    }).catch(err => console.error('Failed to send advocate registration invite email:', err));

    return res.json({ Status: 2, Msg: 'Registration link sent successfully.' });
  } catch (error) {
    console.error('Send registration link error:', error);
    return res.status(500).json({ Status: 1, Msg: 'Failed to send registration link.' });
  }
});

// POST /api/projects/remove-link (Remove registration link)
router.post('/remove-link', authMiddleware, async (req: Request, res: Response): Promise<any> => {
  const { ProjectID } = req.body;

  if (!ProjectID) {
    return res.status(400).json({ Status: 0, Msg: 'Project ID is required.' });
  }

  try {
    const projectIdVal = parseInt(ProjectID);

    await prisma.project.update({
      where: { projectId: projectIdVal },
      data: {
        email: null,
        reg_link_sent_on: null
      }
    });

    return res.json({ Status: 6, Msg: 'Registration link removed successfully.' });
  } catch (error) {
    console.error('Remove registration link error:', error);
    return res.status(500).json({ Status: 5, Msg: 'Failed to remove link.' });
  }
});

// GET /api/projects/public/:id (Fetch project details for advocate registration, public)
router.get('/public/:id', async (req: Request, res: Response): Promise<any> => {
  const projectId = parseInt(req.params.id);
  if (isNaN(projectId)) {
    return res.status(400).json({ Status: 0, Msg: 'Invalid Project ID.' });
  }
  try {
    const project = await prisma.project.findUnique({
      where: { projectId },
      include: { state_master: true }
    });
    if (!project) {
      return res.status(404).json({ Status: 0, Msg: 'Project not found.' });
    }
    return res.json({
      Status: 100,
      Project: {
        projectId: project.projectId,
        projectName: project.projectName,
        stateId: project.state_id,
        stateName: project.state_master?.state_name || '',
        city: project.city,
        email: project.email
      }
    });
  } catch (error) {
    console.error('Fetch public project error:', error);
    return res.status(500).json({ Error: 'Internal Server Error' });
  }
});

export default router;

