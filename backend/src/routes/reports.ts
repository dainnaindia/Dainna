import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

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

// GET /api/reports/agent-summary
router.get('/agent-summary', authMiddleware, async (req: Request, res: Response): Promise<any> => {
  const agentId = req.query.AgentID ? parseInt(req.query.AgentID as string) : undefined;
  const projectId = req.query.ProjectID ? parseInt(req.query.ProjectID as string) : undefined;

  if (!agentId) {
    return res.status(400).json({ Error: 'AgentID is required.' });
  }

  try {
    const whereClause: any = {
      addedby: agentId,
      adv_payment_status: 1
    };
    if (projectId && projectId > 0) {
      whereClause.project_id = projectId;
    }

    const invoices = await prisma.invoice_master.findMany({
      where: whereClause,
      include: {
        project_master: true,
        olb_master: true,
        adv_payment_master: true,
        user_master_invoice_master_advocate_idTouser_master: true
      },
      orderBy: { invoice_id: 'desc' }
    });

    const formatted = invoices.map(inv => {
      const size = inv.size ? parseFloat(inv.size.toString()) : 0;
      const rate = inv.rate || 0;
      const total = size * rate;
      const totalGST = total * 0.05; // 5% GST (CGST 2.5% + SGST 2.5%)
      const toAdvocate = total + totalGST;

      return {
        invoiceId: inv.invoice_id,
        projectName: inv.project_master?.projectName || 'N/A',
        projectCity: inv.project_master?.city || 'N/A',
        invNo: inv.inv_no,
        invoiceDate: inv.invoice_date,
        size: inv.size,
        fromAgent: inv.grandtotal ? parseFloat(inv.grandtotal.toString()) : 0,
        handlingChargeAmount: inv.handling_charge_amount ? parseFloat(inv.handling_charge_amount.toString()) : 0,
        advocateName: inv.user_master_invoice_master_advocate_idTouser_master
          ? `${inv.user_master_invoice_master_advocate_idTouser_master.firstname || ''} ${inv.user_master_invoice_master_advocate_idTouser_master.surname || ''}`.trim()
          : 'N/A',
        toAdvocate
      };
    });

    return res.json({ Status: 100, Invoices: formatted });
  } catch (error) {
    console.error('Agent summary error:', error);
    return res.status(500).json({ Error: 'Internal Server Error' });
  }
});

// GET /api/reports/project-summary
router.get('/project-summary', authMiddleware, async (req: Request, res: Response): Promise<any> => {
  const projectId = req.query.ProjectID ? parseInt(req.query.ProjectID as string) : undefined;

  if (!projectId) {
    return res.status(400).json({ Error: 'ProjectID is required.' });
  }

  try {
    const invoices = await prisma.invoice_master.findMany({
      where: {
        project_id: projectId,
        payment_status: 1
      },
      include: {
        project_master: true,
        olb_master: true,
        user_master_invoice_master_addedbyTouser_master: true, // Agent
        user_master_invoice_master_advocate_idTouser_master: true // Advocate
      },
      orderBy: { invoice_id: 'desc' }
    });

    const formatted = invoices.map(inv => {
      const size = inv.size ? parseFloat(inv.size.toString()) : 0;
      const rate = inv.rate || 0;
      const total = size * rate;
      const totalGST = total * 0.05;
      const toAdvocate = inv.adv_payment_status === 1 ? (total + totalGST) : 0;

      return {
        invoiceId: inv.invoice_id,
        invNo: inv.inv_no,
        invoiceDate: inv.invoice_date,
        size: inv.size,
        agentName: inv.user_master_invoice_master_addedbyTouser_master
          ? `${inv.user_master_invoice_master_addedbyTouser_master.firstname || ''} ${inv.user_master_invoice_master_addedbyTouser_master.surname || ''}`.trim()
          : 'N/A',
        fromAgent: inv.grandtotal ? parseFloat(inv.grandtotal.toString()) : 0,
        handlingChargeAmount: inv.handling_charge_amount ? parseFloat(inv.handling_charge_amount.toString()) : 0,
        advocateName: inv.user_master_invoice_master_advocate_idTouser_master
          ? `${inv.user_master_invoice_master_advocate_idTouser_master.firstname || ''} ${inv.user_master_invoice_master_advocate_idTouser_master.surname || ''}`.trim()
          : 'N/A',
        toAdvocate,
        draftStatus: inv.olb_master?.draftStatus || 1
      };
    });

    return res.json({ Status: 100, Invoices: formatted });
  } catch (error) {
    console.error('Project summary error:', error);
    return res.status(500).json({ Error: 'Internal Server Error' });
  }
});

// GET /api/reports/agent-work-report
router.get('/agent-work-report', authMiddleware, async (req: Request, res: Response): Promise<any> => {
  const user = req.body.currentUser;
  const { startdate, enddate, property_type, area, category, stateid, city, sorting_by } = req.query;

  try {
    const whereClause: any = {};

    // Scopes output based on user role
    if (user.userTypeId === 3) {
      whereClause.addedby = user.userId;
      whereClause.payment_status = 1;
    } else {
      whereClause.adv_payment_status = 1;
      if (user.userTypeId === 4) {
        whereClause.advocate_id = user.userId;
      }
    }

    if (startdate && enddate) {
      const [sDay, sMonth, sYear] = (startdate as string).split('-');
      const [eDay, eMonth, eYear] = (enddate as string).split('-');
      whereClause.invoice_date = {
        gte: new Date(`${sYear}-${sMonth}-${sDay}T00:00:00.000Z`),
        lte: new Date(`${eYear}-${eMonth}-${eDay}T23:59:59.999Z`)
      };
    }

    if (stateid) {
      whereClause.state_id = parseInt(stateid as string);
    }

    const olbWhere: any = {};
    if (property_type && parseInt(property_type as string) > 0) {
      olbWhere.type = parseInt(property_type as string);
    }
    if (area && parseInt(area as string) > 0) {
      olbWhere.area = parseInt(area as string);
    }
    if (category && parseInt(category as string) > 0) {
      olbWhere.customizeReadymade = parseInt(category as string);
    }

    if (Object.keys(olbWhere).length > 0) {
      whereClause.olb_master = olbWhere;
    }

    const projectWhere: any = {};
    if (city) {
      projectWhere.city = city as string;
    }
    if (Object.keys(projectWhere).length > 0) {
      whereClause.project_master = projectWhere;
    }

    const invoices = await prisma.invoice_master.findMany({
      where: whereClause,
      include: {
        user_master_invoice_master_addedbyTouser_master: true, // Agent
        olb_master: true,
        project_master: true
      }
    });

    // Group by agent AND project (or only by agent for advocate)
    let result: any[] = [];

    if (user.userTypeId === 4) {
      const agentGroups = new Map<number, { agentName: string; noOfDrafts: number; size: number; total: number }>();

      for (const inv of invoices) {
        const agent = inv.user_master_invoice_master_addedbyTouser_master;
        if (!agent) continue;
        const agentId = agent.userId;
        const sizeVal = inv.size ? parseFloat(inv.size.toString()) : 0;
        const rateVal = inv.rate ? parseFloat(inv.rate.toString()) : 0;
        const isDraftPaid = inv.adv_pay_id && inv.adv_pay_id > 0;
        const countDraft = isDraftPaid ? 1 : 0;
        const totalVal = isDraftPaid ? (sizeVal * rateVal) * 1.05 : 0;

        if (!agentGroups.has(agentId)) {
          agentGroups.set(agentId, {
            agentName: `${agent.firstname || ''} ${agent.surname || ''}`.trim(),
            noOfDrafts: 0,
            size: 0,
            total: 0
          });
        }

        const group = agentGroups.get(agentId)!;
        group.noOfDrafts += countDraft;
        group.size = Math.round((group.size + sizeVal) * 100) / 100;
        group.total = Math.round((group.total + totalVal) * 100) / 100;
      }
      result = Array.from(agentGroups.values());
    } else {
      const agentGroups = new Map<string, { agentName: string; projectName: string; size: number; total: number }>();

      for (const inv of invoices) {
        const agent = inv.user_master_invoice_master_addedbyTouser_master;
        if (!agent) continue;
        const agentId = agent.userId;
        const projectId = inv.project_id || 0;
        const key = `${agentId}-${projectId}`;
        const sizeVal = inv.size ? parseFloat(inv.size.toString()) : 0;
        const totalVal = inv.grandtotal ? parseFloat(inv.grandtotal.toString()) : 0;

        if (!agentGroups.has(key)) {
          agentGroups.set(key, {
            agentName: `${agent.firstname || ''} ${agent.surname || ''}`.trim(),
            projectName: inv.project_master?.projectName || 'N/A',
            size: 0,
            total: 0
          });
        }

        const group = agentGroups.get(key)!;
        group.size = Math.round((group.size + sizeVal) * 100) / 100;
        group.total = Math.round((group.total + totalVal) * 100) / 100;
      }
      result = Array.from(agentGroups.values());
    }

    // Sorting
    const sortBy = parseInt(sorting_by as string) || 1;
    if (sortBy === 1) {
      result.sort((a, b) => b.total - a.total);
    } else {
      result.sort((a, b) => b.size - a.size);
    }

    return res.json({ Status: 100, Records: result });
  } catch (error) {
    console.error('Agent work report error:', error);
    return res.status(500).json({ Error: 'Internal Server Error' });
  }
});

// GET /api/reports/advocate-work-report
router.get('/advocate-work-report', authMiddleware, async (req: Request, res: Response): Promise<any> => {
  const { startdate, enddate, property_type, area, category, stateid, city, sorting_by } = req.query;

  try {
    const whereClause: any = {
      adv_payment_status: 1
    };

    if (startdate && enddate) {
      const [sDay, sMonth, sYear] = (startdate as string).split('-');
      const [eDay, eMonth, eYear] = (enddate as string).split('-');
      whereClause.invoice_date = {
        gte: new Date(`${sYear}-${sMonth}-${sDay}T00:00:00.000Z`),
        lte: new Date(`${eYear}-${eMonth}-${eDay}T23:59:59.999Z`)
      };
    }

    if (stateid) {
      whereClause.state_id = parseInt(stateid as string);
    }

    const olbWhere: any = {};
    if (property_type && parseInt(property_type as string) > 0) {
      olbWhere.type = parseInt(property_type as string);
    }
    if (area && parseInt(area as string) > 0) {
      olbWhere.area = parseInt(area as string);
    }
    if (category && parseInt(category as string) > 0) {
      olbWhere.customizeReadymade = parseInt(category as string);
    }

    if (Object.keys(olbWhere).length > 0) {
      whereClause.olb_master = olbWhere;
    }

    const projectWhere: any = {};
    if (city) {
      projectWhere.city = city as string;
    }
    if (Object.keys(projectWhere).length > 0) {
      whereClause.project_master = projectWhere;
    }

    const invoices = await prisma.invoice_master.findMany({
      where: whereClause,
      include: {
        user_master_invoice_master_advocate_idTouser_master: true, // Advocate
        project_master: true
      }
    });

    // Group by advocate AND project
    const advocateGroups = new Map<string, { advocateName: string; projectName: string; size: number; total: number }>();

    for (const inv of invoices) {
      const adv = inv.user_master_invoice_master_advocate_idTouser_master;
      if (!adv) continue;
      const advId = adv.userId;
      const projectId = inv.project_id || 0;
      const key = `${advId}-${projectId}`;
      const sizeVal = inv.size ? parseFloat(inv.size.toString()) : 0;
      
      const size = inv.size ? parseFloat(inv.size.toString()) : 0;
      const rate = inv.rate || 0;
      const total = size * rate;
      const totalGST = total * 0.05;
      const toAdvocate = total + totalGST;

      if (!advocateGroups.has(key)) {
        advocateGroups.set(key, {
          advocateName: `${adv.firstname || ''} ${adv.surname || ''}`.trim(),
          projectName: inv.project_master?.projectName || 'N/A',
          size: 0,
          total: 0
        });
      }

      const group = advocateGroups.get(key)!;
      group.size += sizeVal;
      group.total += toAdvocate;
    }

    let result = Array.from(advocateGroups.values());

    const sortBy = parseInt(sorting_by as string) || 1;
    if (sortBy === 1) {
      result.sort((a, b) => b.total - a.total);
    } else {
      result.sort((a, b) => b.size - a.size);
    }

    return res.json({ Status: 100, Records: result });
  } catch (error) {
    console.error('Advocate work report error:', error);
    return res.status(500).json({ Error: 'Internal Server Error' });
  }
});

// GET /api/reports/handling-charges
router.get('/handling-charges', authMiddleware, async (req: Request, res: Response): Promise<any> => {
  const stateId = req.query.stateId ? parseInt(req.query.stateId as string) : undefined;
  const city = req.query.city as string;
  const projectId = req.query.projectId ? parseInt(req.query.projectId as string) : undefined;
  const startdate = req.query.startdate as string;
  const enddate = req.query.enddate as string;

  try {
    const whereClause: any = {
      payment_status: 1 // Completed agent payments
    };

    if (startdate && enddate) {
      const [sDay, sMonth, sYear] = startdate.split('-');
      const [eDay, eMonth, eYear] = enddate.split('-');
      whereClause.invoice_date = {
        gte: new Date(`${sYear}-${sMonth}-${sDay}T00:00:00.000Z`),
        lte: new Date(`${eYear}-${eMonth}-${eDay}T23:59:59.999Z`)
      };
    }

    if (stateId) {
      whereClause.state_id = stateId;
    }

    const projectWhere: any = {};
    if (city) projectWhere.city = city;
    if (projectId) projectWhere.project_id = projectId; // Note model field name might be project_id or projectId in prisma depending on relation

    if (Object.keys(projectWhere).length > 0) {
      whereClause.project_master = projectWhere;
    }

    const invoices = await prisma.invoice_master.findMany({
      where: whereClause,
      include: {
        project_master: true,
        user_master_invoice_master_addedbyTouser_master: {
          select: {
            firstname: true,
            middlename: true,
            surname: true
          }
        }
      },
      orderBy: { invoice_id: 'desc' }
    });

    const formatted = invoices.map(inv => {
      const agent = inv.user_master_invoice_master_addedbyTouser_master;
      return {
        invoiceId: inv.invoice_id,
        invNo: inv.inv_no,
        invoiceDate: inv.invoice_date,
        agentName: agent ? `${agent.firstname || ''} ${agent.middlename || ''} ${agent.surname || ''}`.trim() : 'N/A',
        projectName: inv.project_master?.projectName || 'N/A',
        projectCity: inv.project_master?.city || 'N/A',
        handlingChargeAmount: inv.handling_charge_amount ? parseFloat(inv.handling_charge_amount.toString()) : 0,
        grandtotal: inv.grandtotal ? parseFloat(inv.grandtotal.toString()) : 0
      };
    });

    return res.json({ Status: 100, Records: formatted });
  } catch (error) {
    console.error('Handling charge report error:', error);
    return res.status(500).json({ Error: 'Internal Server Error' });
  }
});

// GET /api/reports/area-wise
router.get('/area-wise', authMiddleware, async (req: Request, res: Response): Promise<any> => {
  const user = req.body.currentUser;
  const { startdate, enddate, property_type, category, stateid, district, area, citysurveyoffice, ward, taluka, village, sectorno } = req.query;

  try {
    const whereClause: any = {
      draftStatus: 4 // Only completed drafts
    };

    // Scopes output if user is an Advocate
    if (user.userTypeId === 4) {
      whereClause.invoice_master = {
        some: { advocate_id: user.userId }
      };
    }

    if (stateid) {
      whereClause.stateId = parseInt(stateid as string);
    }
    if (district) {
      whereClause.district = district as string;
    }
    if (area) {
      whereClause.area = parseInt(area as string);
    }
    if (property_type && parseInt(property_type as string) > 0) {
      whereClause.type = parseInt(property_type as string);
    }
    if (category && parseInt(category as string) > 0) {
      whereClause.customizeReadymade = parseInt(category as string);
    }

    if (startdate && enddate) {
      const [sDay, sMonth, sYear] = (startdate as string).split('-');
      const [eDay, eMonth, eYear] = (enddate as string).split('-');
      
      const dateFilter = {
        invoice_date: {
          gte: new Date(`${sYear}-${sMonth}-${sDay}T00:00:00.000Z`),
          lte: new Date(`${eYear}-${eMonth}-${eDay}T23:59:59.999Z`)
        }
      };

      if (whereClause.invoice_master) {
        whereClause.invoice_master.some = {
          ...whereClause.invoice_master.some,
          ...dateFilter
        };
      } else {
        whereClause.invoice_master = {
          some: dateFilter
        };
      }
    }

    const drafts = await prisma.olb.findMany({
      where: whereClause,
      include: {
        state_master: true,
        invoice_master: {
          include: {
            project_master: true
          }
        }
      }
    });

    const areaType = parseInt(area as string) || 1;
    const groups = new Map<string, { stateName: string; district: string; count: number; cso?: string; ward?: string; taluka?: string; village?: string; sectorNo?: string }>();

    for (const d of drafts) {
      let key = '';
      const stateName = d.state_master?.state_name || 'N/A';
      const dist = d.district || 'N/A';

      if (areaType === 1) {
        const cso = d.citySurveyOffice || '';
        const w = d.ward || '';
        
        if (citysurveyoffice && cso !== citysurveyoffice) continue;
        if (ward && w !== ward) continue;

        key = `${stateName}|${dist}|${cso}|${w}`;
        if (!groups.has(key)) {
          groups.set(key, { stateName, district: dist, count: 0, cso, ward: w });
        }
      } else if (areaType === 2) {
        const t = d.taluka || '';
        const v = d.village || '';

        if (taluka && t !== taluka) continue;
        if (village && v !== village) continue;

        key = `${stateName}|${dist}|${t}|${v}`;
        if (!groups.has(key)) {
          groups.set(key, { stateName, district: dist, count: 0, taluka: t, village: v });
        }
      } else if (areaType === 3) {
        const t = d.taluka || '';
        const v = d.village || '';
        const s = d.sectorNo || '';

        if (taluka && t !== taluka) continue;
        if (village && v !== village) continue;
        if (sectorno && s !== sectorno) continue;

        key = `${stateName}|${dist}|${t}|${v}|${s}`;
        if (!groups.has(key)) {
          groups.set(key, { stateName, district: dist, count: 0, taluka: t, village: v, sectorNo: s });
        }
      }

      if (key) {
        groups.get(key)!.count += 1;
      }
    }

    const records = Array.from(groups.values());
    return res.json({ Status: 100, Records: records });
  } catch (error) {
    console.error('Area wise report error:', error);
    return res.status(500).json({ Error: 'Internal Server Error' });
  }
});

export default router;
