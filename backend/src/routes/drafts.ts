import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { processSuccessfulPayout } from './upi';

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

// GET /api/drafts/advocate-status
router.get('/advocate-status', authMiddleware, async (req: Request, res: Response): Promise<any> => {
  const user = req.body.currentUser;

  try {
    const whereClause: any = {
      draftStatus: { in: [2, 3, 4, 5] }
    };

    // Filter by user role (Agents see their own, Advocates see assigned, Admins/Staff see all)
    if (user.userTypeId === 3) {
      whereClause.addedby = user.userId;
    } else if (user.userTypeId === 4) {
      whereClause.invoice_master = {
        some: { advocate_id: user.userId }
      };
    }

    const drafts = await prisma.olb.findMany({
      where: whereClause,
      include: {
        state_master: true,
        user_master_olb_master_addedbyTouser_master: {
          select: {
            userId: true,
            firstname: true,
            middlename: true,
            surname: true
          }
        },
        invoice_master: {
          include: {
            project_master: true,
            user_master_invoice_master_advocate_idTouser_master: {
              select: {
                userId: true,
                firstname: true,
                middlename: true,
                surname: true
              }
            }
          }
        }
      },
      orderBy: { modifieddate: 'desc' }
    });

    return res.json({ Status: 100, Drafts: drafts });
  } catch (error) {
    console.error('Fetch advocate drafts status error:', error);
    return res.status(500).json({ Error: 'Internal Server Error' });
  }
});

// GET /api/drafts/list
router.get('/list', authMiddleware, async (req: Request, res: Response): Promise<any> => {
  const user = req.body.currentUser;
  const statusFilter = req.query.status ? parseInt(req.query.status as string) : undefined;
  const stateId = req.query.stateId ? parseInt(req.query.stateId as string) : undefined;
  const city = req.query.city as string;
  const projectId = req.query.projectId ? parseInt(req.query.projectId as string) : undefined;
  const typeFilter = req.query.type ? parseInt(req.query.type as string) : undefined;

  try {
    const whereClause: any = {};
    
    // Filter by user role (Agents see their own, Advocates see sent drafts, Admins/Staff see all)
    if (user.userTypeId === 3) {
      whereClause.addedby = user.userId;
    } else if (user.userTypeId === 4) {
      // Advocate sees drafts sent to them
      whereClause.invoice_master = {
        some: { advocate_id: user.userId }
      };
    }
    
    // Filter by draftStatus if provided
    if (statusFilter !== undefined) {
      whereClause.draftStatus = statusFilter;
    }
    
    // Filter by type if provided and not 0 (ALL)
    if (typeFilter !== undefined && typeFilter !== 0) {
      whereClause.type = typeFilter;
    }
    
    // Ensure agreement draft is created (meaning it has been prepared)
    whereClause.agreementAddeddate = { not: null };

    // Apply project/state/city filters if provided
    if (stateId !== undefined || city || projectId !== undefined) {
      const invoiceFilter: any = {};
      const projectFilter: any = {};

      if (stateId !== undefined) projectFilter.state_id = stateId;
      if (city) projectFilter.city = city;
      if (projectId !== undefined) projectFilter.projectId = projectId;

      invoiceFilter.project_master = projectFilter;
      whereClause.invoice_master = {
        some: invoiceFilter
      };
    }

    const drafts = await prisma.olb.findMany({
      where: whereClause,
      include: {
        state_master: true,
        user_master_olb_master_addedbyTouser_master: {
          select: {
            userId: true,
            firstname: true,
            middlename: true,
            surname: true
          }
        },
        invoice_master: {
          include: {
            project_master: {
              include: {
                state_master: true
              }
            },
            user_master_invoice_master_advocate_idTouser_master: {
              select: {
                userId: true,
                firstname: true,
                middlename: true,
                surname: true
              }
            },
            adv_payment_master: true
          }
        },
        olb_item_master: true
      },
      orderBy: { modifieddate: 'desc' }
    });

    return res.json({ Status: 100, Drafts: drafts });
  } catch (error) {
    console.error('List drafts error:', error);
    return res.status(500).json({ Error: 'Internal Server Error' });
  }
});

// POST /api/drafts/prepare
router.post('/prepare', authMiddleware, async (req: Request, res: Response): Promise<any> => {
  const { OLBID, CustomizeReadymade, Language, AgreementDraft, PropertyDetail } = req.body;

  try {
    const olbIdVal = parseInt(OLBID);
    const crVal = parseInt(CustomizeReadymade) || 1;

    const updated = await prisma.olb.update({
      where: { olbId: olbIdVal },
      data: {
        customizeReadymade: crVal,
        language: Language || 'english',
        agreementDraft: AgreementDraft || '',
        draftStatus: 1, // Prepared
        agreementAddeddate: new Date(),
        propertyDetail: PropertyDetail || '',
        preparedDate: new Date()
      }
    });

    return res.json({ Status: 2, Msg: 'Prepared Draft Inserted Successfully.', OLBID: updated.olbId });
  } catch (error) {
    console.error('Prepare draft error:', error);
    return res.status(500).json({ Status: 1, Msg: 'Failed to prepare Draft.' });
  }
});

// POST /api/drafts/action (send, complete, reject)
router.post('/action', authMiddleware, async (req: Request, res: Response): Promise<any> => {
  const { OLBID, Action } = req.body; // Action can be 'send', 'complete', 'reject'

  try {
    const olbIdVal = parseInt(OLBID);
    let newStatus = 1;
    const updateData: any = {};

    if (Action === 'send') {
      newStatus = 3; // Sent to Advocate
      updateData.sentDate = new Date();
    } else if (Action === 'complete') {
      newStatus = 4; // Completed
      updateData.acceptDate = new Date();
    } else if (Action === 'reject') {
      newStatus = 5; // Rejected / Failed
    } else {
      return res.status(400).json({ Status: 0, Msg: 'Invalid action.' });
    }

    updateData.draftStatus = newStatus;
    updateData.modifieddate = new Date();

    await prisma.olb.update({
      where: { olbId: olbIdVal },
      data: updateData
    });

    return res.json({ Status: 100, Msg: `Draft action '${Action}' successful.` });
  } catch (error) {
    console.error('Draft action error:', error);
    return res.status(500).json({ Status: 0, Msg: 'Failed to apply action to Draft.' });
  }
});

// POST /api/drafts/search
router.post('/search', authMiddleware, async (req: Request, res: Response): Promise<any> => {
  const {
    Area, StateID, District, PlotArea, CitySurveyOffice, Ward,
    CitySurveyNo, SheetNo, Taluka, Village, SectorNo, SectorPlotNo
  } = req.body;

  try {
    const whereClause: any = {};

    if (Area) whereClause.area = parseInt(Area);
    if (StateID) whereClause.stateId = parseInt(StateID);
    if (District) whereClause.district = District;
    if (PlotArea) whereClause.plotArea = PlotArea;
    if (CitySurveyOffice) whereClause.citySurveyOffice = CitySurveyOffice;
    if (Ward) whereClause.ward = Ward;
    if (CitySurveyNo) whereClause.citySurveyNo = CitySurveyNo;
    if (SheetNo) whereClause.sheetNo = SheetNo;
    if (Taluka) whereClause.taluka = Taluka;
    if (Village) whereClause.village = Village;
    if (SectorNo) whereClause.sectorNo = SectorNo;
    if (SectorPlotNo) whereClause.sectorPlotNo = SectorPlotNo;

    const drafts = await prisma.olb.findMany({
      where: whereClause,
      include: {
        state_master: true
      },
      orderBy: { olbId: 'desc' }
    });

    return res.json({ Status: 100, Drafts: drafts });
  } catch (error) {
    console.error('Search drafts error:', error);
    return res.status(500).json({ Error: 'Internal Server Error' });
  }
});

// POST /api/drafts/accept (Advocate accepts draft)
router.post('/accept', authMiddleware, async (req: Request, res: Response): Promise<any> => {
  const { OLBID } = req.body;

  try {
    const olbIdVal = parseInt(OLBID);
    if (isNaN(olbIdVal)) {
      return res.status(400).json({ Status: 0, Msg: 'Invalid draft ID.' });
    }

    const d = await prisma.olb.findUnique({
      where: { olbId: olbIdVal },
      include: {
        state_master: true,
        user_master_olb_master_addedbyTouser_master: true,
        invoice_master: {
          include: {
            user_master_invoice_master_advocate_idTouser_master: true
          }
        }
      }
    });

    if (!d) {
      return res.status(404).json({ Status: 0, Msg: 'Draft not found.' });
    }

    // Ensure that advocate payout status is success (adv_payment_status === 1)
    const hasUnverifiedPayout = d.invoice_master?.some(invoice => invoice.adv_payment_status !== 1);
    if (hasUnverifiedPayout) {
      return res.status(400).json({ Status: 0, Msg: 'Cannot accept draft. Advocate payout is not verified yet.' });
    }

    const updated = await prisma.olb.update({
      where: { olbId: olbIdVal },
      data: {
        draftStatus: 4,
        acceptDate: new Date(),
        modifieddate: new Date()
      }
    });

    // Auto-trigger payouts to advocate for any associated invoices that are already paid by the agent
    if (d.invoice_master && d.invoice_master.length > 0) {
      for (const invoice of d.invoice_master) {
        if (invoice.payment_status === 1 && invoice.adv_payment_status !== 1) {
          const autoUtr = `AUTO-ADV-${Math.floor(100000000000 + Math.random() * 900000000000)}`;
          await processSuccessfulPayout(invoice.invoice_id, autoUtr, 'Automated payout upon draft acceptance', false);
        }
      }
    }

    // Run duplication check
    const whereClause: any = {
      draftStatus: 4,
      olbId: { not: olbIdVal },
      stateId: d.stateId,
      type: d.type,
      area: d.area
    };

    if (d.plotArea) whereClause.plotArea = d.plotArea;
    if (d.areaSqMt) whereClause.areaSqMt = d.areaSqMt;
    if (d.citySurveyOffice) whereClause.citySurveyOffice = d.citySurveyOffice;
    if (d.ward) whereClause.ward = d.ward;
    if (d.citySurveyNo) whereClause.citySurveyNo = d.citySurveyNo;
    if (d.sheetNo) whereClause.sheetNo = d.sheetNo;
    if (d.taluka) whereClause.taluka = d.taluka;
    if (d.village) whereClause.village = d.village;
    if (d.sectorPlotNo) whereClause.sectorPlotNo = d.sectorPlotNo;
    if (d.sectorNo) whereClause.sectorNo = d.sectorNo;

    const duplicate = await prisma.olb.findFirst({
      where: whereClause,
      include: {
        user_master_olb_master_addedbyTouser_master: true,
        invoice_master: {
          include: {
            user_master_invoice_master_advocate_idTouser_master: true
          }
        }
      }
    });

    if (duplicate) {
      const stateName = d.state_master?.state_name || '';
      const district = d.district || '';
      const plotArea = d.plotArea || d.areaSqMt || '';

      // Format AreaText
      let areaText = '';
      if (d.area === 1) {
        areaText = `<b>Urban</b>/ <b>City Survey Office : </b>${d.citySurveyOffice || ''}/ <b>Ward : </b>${d.ward || ''}/ <b>Survey No : </b>${d.citySurveyNo || ''}/ <b>Sheet No : </b>${d.sheetNo || ''}`;
      } else if (d.area === 2) {
        areaText = `<b>Rural</b>/ <b>Taluka : </b>${d.taluka || ''}/ <b>Village : </b>${d.village || ''}/ <b>Survey No : </b>${d.citySurveyNo || ''}/ <b>Plot No : </b>${d.sectorPlotNo || ''}`;
      } else if (d.area === 3) {
        areaText = `<b>Sector Wise</b>/ <b>Taluka : </b>${d.taluka || ''}/ <b>Village : </b>${d.village || ''}/ <b>Sector No : </b>${d.sectorNo || ''}/ <b>Plot No : </b>${d.sectorPlotNo || ''}`;
      }

      // Fetch current advocate details
      const currentUserRecord = await prisma.user.findUnique({
        where: { userId: req.body.currentUser.userId }
      });

      const currentAgentName = [d.user_master_olb_master_addedbyTouser_master?.firstname, d.user_master_olb_master_addedbyTouser_master?.middlename, d.user_master_olb_master_addedbyTouser_master?.surname].filter(Boolean).join(' ');
      const currentAdvName = [currentUserRecord?.firstname, currentUserRecord?.middlename, currentUserRecord?.surname].filter(Boolean).join(' ');
      
      const dupAgentName = [duplicate.user_master_olb_master_addedbyTouser_master?.firstname, duplicate.user_master_olb_master_addedbyTouser_master?.middlename, duplicate.user_master_olb_master_addedbyTouser_master?.surname].filter(Boolean).join(' ');
      
      const duplicateInvoice = duplicate.invoice_master?.[0];
      const dupAdvName = [duplicateInvoice?.user_master_invoice_master_advocate_idTouser_master?.firstname, duplicateInvoice?.user_master_invoice_master_advocate_idTouser_master?.middlename, duplicateInvoice?.user_master_invoice_master_advocate_idTouser_master?.surname].filter(Boolean).join(' ');

      // Messages matching legacy PHP
      const adminMsg = `Draft Detail: ${stateName} ${district} ${plotArea} ${areaText} is alerady Purchase By ${currentAgentName} and Advocate is ${currentAdvName}. and Same Draft is repurchase by ${dupAgentName} and Advocate is ${dupAdvName}. `;
      const agentMsg = `Draft Detail: ${stateName} ${district} ${plotArea} ${areaText} Someone else is also Purchase this draft.`;
      const advMsg = `Draft Detail: ${stateName} ${district} ${plotArea} ${areaText} Someone else is also Purchase this draft.`;
      const iaAgentMsg = `Draft Detail: ${stateName} ${district} ${plotArea} ${areaText} is aleready Purchase by someone else.`;
      const iaAdvMsg = `Draft Detail: ${stateName} ${district} ${plotArea} ${areaText} is aleready Purchase by someone else.`;

      // Insert chats
      // 1. Admin Chat (current advocate -> admin)
      await prisma.chat.create({
        data: {
          fromId: req.body.currentUser.userId,
          toId: 1,
          message: adminMsg,
          status: 0,
          sendtime: new Date(),
          systemEmailSms: 1,
          type: 0
        }
      });

      // 2. Current Agent Chat (admin -> current agent)
      if (d.addedby) {
        await prisma.chat.create({
          data: {
            fromId: 1,
            toId: d.addedby,
            message: agentMsg,
            status: 0,
            sendtime: new Date(),
            systemEmailSms: 1,
            type: 0
          }
        });
      }

      // 3. Current Advocate Chat (admin -> current advocate)
      await prisma.chat.create({
        data: {
          fromId: 1,
          toId: req.body.currentUser.userId,
          message: advMsg,
          status: 0,
          sendtime: new Date(),
          systemEmailSms: 1,
          type: 0
        }
      });

      // 4. Duplicate Agent Chat (admin -> duplicate agent)
      if (duplicate.addedby) {
        await prisma.chat.create({
          data: {
            fromId: 1,
            toId: duplicate.addedby,
            message: iaAgentMsg,
            status: 0,
            sendtime: new Date(),
            systemEmailSms: 1,
            type: 0
          }
        });
      }

      // 5. Duplicate Advocate Chat (admin -> duplicate advocate)
      const duplicateAdvId = duplicateInvoice?.advocate_id;
      if (duplicateAdvId) {
        await prisma.chat.create({
          data: {
            fromId: 1,
            toId: duplicateAdvId,
            message: iaAdvMsg,
            status: 0,
            sendtime: new Date(),
            systemEmailSms: 1,
            type: 0
          }
        });
      }
    }

    return res.json({ Status: 2, Msg: 'Draft accepted successfully.', OLBID: updated.olbId });
  } catch (error) {
    console.error('Accept draft error:', error);
    return res.status(500).json({ Status: 1, Msg: 'Failed to accept Draft.' });
  }
});

// GET /api/drafts/similar-properties-list
router.get('/similar-properties-list', authMiddleware, async (req: Request, res: Response): Promise<any> => {
  const user = req.body.currentUser;
  try {
    const queryClause: any = { draftStatus: 4 };
    if (user.userTypeId === 3) {
      queryClause.addedby = user.userId;
    }
    const drafts = await prisma.olb.findMany({
      where: queryClause,
      include: {
        invoice_master: {
          include: {
            project_master: true
          }
        }
      },
      orderBy: { acceptDate: 'asc' }
    });

    const records = [];

    for (const d of drafts) {
      const whereClause: any = {
        draftStatus: 4,
        olbId: { not: d.olbId },
        stateId: d.stateId,
        type: d.type,
        area: d.area
      };

      if (d.plotArea) whereClause.plotArea = d.plotArea;
      if (d.areaSqMt) whereClause.areaSqMt = d.areaSqMt;
      if (d.citySurveyOffice) whereClause.citySurveyOffice = d.citySurveyOffice;
      if (d.ward) whereClause.ward = d.ward;
      if (d.citySurveyNo) whereClause.citySurveyNo = d.citySurveyNo;
      if (d.sheetNo) whereClause.sheetNo = d.sheetNo;
      if (d.taluka) whereClause.taluka = d.taluka;
      if (d.village) whereClause.village = d.village;
      if (d.sectorPlotNo) whereClause.sectorPlotNo = d.sectorPlotNo;
      if (d.sectorNo) whereClause.sectorNo = d.sectorNo;

      const matches = await prisma.olb.findMany({
        where: whereClause,
        include: {
          invoice_master: true
        }
      });

      if (matches.length > 0) {
        const firstInvoice = d.invoice_master[0];
        const project = firstInvoice?.project_master;

        records.push({
          olbId: d.olbId,
          invoiceNo: firstInvoice?.inv_no || 'N/A',
          acceptDate: d.acceptDate,
          projectName: project?.projectName || 'N/A',
          projectCity: project?.city || 'N/A',
          purchaserName: `${d.purchaserFirstName || ''} ${d.purchaserLastName || ''}`.trim(),
          preparedDate: d.preparedDate,
          sentDate: d.sentDate,
          similarInvoices: matches.map(m => ({
            olbId: m.olbId,
            invoiceNo: m.invoice_master[0]?.inv_no || 'N/A'
          }))
        });
      }
    }

    return res.json({ Status: 100, Records: records });
  } catch (error) {
    console.error('Similar properties list error:', error);
    return res.status(500).json({ Error: 'Internal Server Error' });
  }
});

export default router;
