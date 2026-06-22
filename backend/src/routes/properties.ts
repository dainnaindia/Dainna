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

// GET /api/properties/list
router.get('/list', authMiddleware, async (req: Request, res: Response): Promise<any> => {
  const user = req.body.currentUser;
  const typeFilter = req.query.type ? parseInt(req.query.type as string) : 0;

  try {
    const whereClause: any = {};
    
    // Non-admin users only see their own entries
    if (user.userTypeId !== 1) {
      whereClause.addedby = user.userId;
    }
    
    // Type filter: 1 = Open Land, 2 = Open Building, 0 = ALL
    if (typeFilter === 1 || typeFilter === 2) {
      whereClause.type = typeFilter;
    }

    // Return properties where agreement_addeddate is NULL (matching legacy behavior)
    whereClause.agreementAddeddate = null;

    const properties = await prisma.olb.findMany({
      where: whereClause,
      orderBy: { olbId: 'desc' }
    });

    return res.json({ Status: 100, Properties: properties });
  } catch (error) {
    console.error('List properties error:', error);
    return res.status(500).json({ Error: 'Internal Server Error' });
  }
});

// GET /api/properties/detail/:id
router.get('/detail/:id', authMiddleware, async (req: Request, res: Response): Promise<any> => {
  const olbId = parseInt(req.params.id);
  try {
    const property = await prisma.olb.findUnique({
      where: { olbId },
      include: {
        invoice_master: {
          include: {
            project_master: {
              include: {
                state_master: true
              }
            },
            user_master_invoice_master_advocate_idTouser_master: true,
            user_master_invoice_master_addedbyTouser_master: true
          }
        }
      }
    });
    if (!property) {
      return res.status(404).json({ Status: 0, Msg: 'Property not found.' });
    }

    // Determine or predict invoice ID
    let invoiceIdStr = '';
    if (property.invoice_master && property.invoice_master.length > 0) {
      const inv = property.invoice_master[0];
      invoiceIdStr = inv.inv_no ? inv.inv_no.replace(/\//g, '') : `INV${inv.invoice_id}`;
    } else {
      // Predict the next invoice ID sequence based on state and global invoice count
      let stateCode = 'GUJ'; // Default fallback
      if (property.stateId) {
        const state = await prisma.state_master.findUnique({
          where: { state_id: property.stateId }
        });
        if (state && state.state_code) {
          stateCode = state.state_code;
        }
      }
      
      const lowerUninvoicedCount = await prisma.olb.count({
        where: {
          olbId: { lt: olbId },
          invoice_master: {
            none: {}
          }
        }
      });

      const allInvoices = await prisma.invoice_master.findMany({
        select: { invoice_no: true }
      });
      let nextInvoiceNo = 1;
      if (allInvoices.length > 0) {
        const nos = allInvoices.map(i => parseInt(i.invoice_no || '0')).filter(n => !isNaN(n));
        if (nos.length > 0) {
          nextInvoiceNo = Math.max(...nos) + 1;
        }
      }
      nextInvoiceNo += lowerUninvoicedCount;
      invoiceIdStr = `${stateCode}${String(nextInvoiceNo).padStart(4, '0')}`;
    }

    return res.json({ 
      Status: 100, 
      Property: property,
      GeneratedInvoiceID: invoiceIdStr 
    });
  } catch (error) {
    console.error('Detail property error:', error);
    return res.status(500).json({ Error: 'Internal Server Error' });
  }
});

// POST /api/properties/add-ol (Add Open Land)
router.post('/add-ol', authMiddleware, async (req: Request, res: Response): Promise<any> => {
  const user = req.body.currentUser;
  const {
    Area, StateID, District, PlotArea, CitySurveyOffice, Ward,
    CitySurveyNo, SheetNo, Taluka, Village, SectorNo, SectorPlotNo,
    OwnerFirstName, OwnerMiddleName, OwnerLastName, OwnerMobile,
    PurchaserFirstName, PurchaserMiddleName, PurchaserLastName, PurchaserMobile, PurchaserEmail
  } = req.body;

  try {
    const areaVal = parseInt(Area) || 1;
    let citySurveyOfficeVal = '';
    let wardVal = '';
    let citySurveyNoVal = '';
    let sheetNoVal = '';
    let talukaVal = '';
    let villageVal = '';
    let sectorNoVal = '';
    let sectorPlotNoVal = '';

    if (areaVal === 1) {
      citySurveyOfficeVal = CitySurveyOffice || '';
      wardVal = Ward || '';
      citySurveyNoVal = CitySurveyNo || '';
      sheetNoVal = SheetNo || '';
    } else if (areaVal === 2) {
      talukaVal = Taluka || '';
      villageVal = Village || '';
      citySurveyNoVal = CitySurveyNo || '';
      sectorPlotNoVal = SectorPlotNo || '';
    } else if (areaVal === 3) {
      talukaVal = Taluka || '';
      villageVal = Village || '';
      sectorNoVal = SectorNo || '';
      sectorPlotNoVal = SectorPlotNo || '';
    }

    const stateIdVal = StateID ? parseInt(StateID) : null;

    const newProperty = await prisma.olb.create({
      data: {
        type: 1, // Open Land
        stateId: stateIdVal,
        area: areaVal,
        plotArea: PlotArea || '',
        citySurveyOffice: citySurveyOfficeVal,
        ward: wardVal,
        sheetNo: sheetNoVal,
        district: District || '',
        taluka: talukaVal,
        village: villageVal,
        citySurveyNo: citySurveyNoVal,
        sectorNo: sectorNoVal,
        sectorPlotNo: sectorPlotNoVal,
        ownerFirstName: OwnerFirstName || '',
        ownerMiddleName: OwnerMiddleName || '',
        ownerLastName: OwnerLastName || '',
        ownerMobileNo: OwnerMobile || '',
        purchaserFirstName: PurchaserFirstName || '',
        purchaserMiddleName: PurchaserMiddleName || '',
        purchaserLastName: PurchaserLastName || '',
        purchaserMobileNo: PurchaserMobile || '',
        purchaserEmail: PurchaserEmail || '',
        addedby: user.userId,
        addeddate: new Date(),
      }
    });

    return res.json({ Status: 2, OLBID: newProperty.olbId, Msg: 'Open Land Inserted Successfully.' });
  } catch (error) {
    console.error('Add open land error:', error);
    return res.status(500).json({ Status: 1, Msg: 'Failed to insert Open Land record.' });
  }
});

// POST /api/properties/add-ob (Add Open Building)
router.post('/add-ob', authMiddleware, async (req: Request, res: Response): Promise<any> => {
  const user = req.body.currentUser;
  const {
    Area, StateID, District, BuildingName, FlatShopNo, FloorNo, AreaSQFT,
    CitySurveyOffice, Ward, CitySurveyNo, SheetNo, Taluka, Village, SectorNo, SectorPlotNo,
    OwnerFirstName, OwnerMiddleName, OwnerLastName, OwnerMobile,
    PurchaserFirstName, PurchaserMiddleName, PurchaserLastName, PurchaserMobile, PurchaserEmail
  } = req.body;

  try {
    const areaVal = parseInt(Area) || 1;
    let citySurveyOfficeVal = '';
    let wardVal = '';
    let citySurveyNoVal = '';
    let sheetNoVal = '';
    let talukaVal = '';
    let villageVal = '';
    let sectorNoVal = '';
    let sectorPlotNoVal = '';

    if (areaVal === 1) {
      citySurveyOfficeVal = CitySurveyOffice || '';
      wardVal = Ward || '';
      citySurveyNoVal = CitySurveyNo || '';
      sheetNoVal = SheetNo || '';
    } else if (areaVal === 2) {
      talukaVal = Taluka || '';
      villageVal = Village || '';
      citySurveyNoVal = CitySurveyNo || '';
      sectorPlotNoVal = SectorPlotNo || '';
    } else if (areaVal === 3) {
      talukaVal = Taluka || '';
      villageVal = Village || '';
      sectorNoVal = SectorNo || '';
      sectorPlotNoVal = SectorPlotNo || '';
    }

    const stateIdVal = StateID ? parseInt(StateID) : null;

    const newProperty = await prisma.olb.create({
      data: {
        type: 2, // Open Building
        stateId: stateIdVal,
        area: areaVal,
        areaSqMt: AreaSQFT || '', // map areaSqMt as AreaSQFT matching database structure
        citySurveyOffice: citySurveyOfficeVal,
        ward: wardVal,
        sheetNo: sheetNoVal,
        district: District || '',
        taluka: talukaVal,
        village: villageVal,
        citySurveyNo: citySurveyNoVal,
        sectorNo: sectorNoVal,
        sectorPlotNo: sectorPlotNoVal,
        buildingName: BuildingName || '',
        flatShopNo: FlatShopNo || '',
        floorNo: FloorNo || '',
        ownerFirstName: OwnerFirstName || '',
        ownerMiddleName: OwnerMiddleName || '',
        ownerLastName: OwnerLastName || '',
        ownerMobileNo: OwnerMobile || '',
        purchaserFirstName: PurchaserFirstName || '',
        purchaserMiddleName: PurchaserMiddleName || '',
        purchaserLastName: PurchaserLastName || '',
        purchaserMobileNo: PurchaserMobile || '',
        purchaserEmail: PurchaserEmail || '',
        addedby: user.userId,
        addeddate: new Date(),
      }
    });

    return res.json({ Status: 2, OLBID: newProperty.olbId, Msg: 'Open Building Inserted Successfully.' });
  } catch (error) {
    console.error('Add open building error:', error);
    return res.status(500).json({ Status: 1, Msg: 'Failed to insert Open Building record.' });
  }
});

// PUT /api/properties/update-ol/:id
router.put('/update-ol/:id', authMiddleware, async (req: Request, res: Response): Promise<any> => {
  const user = req.body.currentUser;
  const olbId = parseInt(req.params.id);
  const {
    Area, StateID, District, PlotArea, CitySurveyOffice, Ward,
    CitySurveyNo, SheetNo, Taluka, Village, SectorNo, SectorPlotNo,
    OwnerFirstName, OwnerMiddleName, OwnerLastName, OwnerMobile,
    PurchaserFirstName, PurchaserMiddleName, PurchaserLastName, PurchaserMobile, PurchaserEmail
  } = req.body;

  try {
    const areaVal = parseInt(Area) || 1;
    let citySurveyOfficeVal = '';
    let wardVal = '';
    let citySurveyNoVal = '';
    let sheetNoVal = '';
    let talukaVal = '';
    let villageVal = '';
    let sectorNoVal = '';
    let sectorPlotNoVal = '';

    if (areaVal === 1) {
      citySurveyOfficeVal = CitySurveyOffice || '';
      wardVal = Ward || '';
      citySurveyNoVal = CitySurveyNo || '';
      sheetNoVal = SheetNo || '';
    } else if (areaVal === 2) {
      talukaVal = Taluka || '';
      villageVal = Village || '';
      citySurveyNoVal = CitySurveyNo || '';
      sectorPlotNoVal = SectorPlotNo || '';
    } else if (areaVal === 3) {
      talukaVal = Taluka || '';
      villageVal = Village || '';
      sectorNoVal = SectorNo || '';
      sectorPlotNoVal = SectorPlotNo || '';
    }

    const stateIdVal = StateID ? parseInt(StateID) : null;

    await prisma.olb.update({
      where: { olbId },
      data: {
        stateId: stateIdVal,
        area: areaVal,
        plotArea: PlotArea || '',
        citySurveyOffice: citySurveyOfficeVal,
        ward: wardVal,
        sheetNo: sheetNoVal,
        district: District || '',
        taluka: talukaVal,
        village: villageVal,
        citySurveyNo: citySurveyNoVal,
        sectorNo: sectorNoVal,
        sectorPlotNo: sectorPlotNoVal,
        ownerFirstName: OwnerFirstName || '',
        ownerMiddleName: OwnerMiddleName || '',
        ownerLastName: OwnerLastName || '',
        ownerMobileNo: OwnerMobile || '',
        purchaserFirstName: PurchaserFirstName || '',
        purchaserMiddleName: PurchaserMiddleName || '',
        purchaserLastName: PurchaserLastName || '',
        purchaserMobileNo: PurchaserMobile || '',
        purchaserEmail: PurchaserEmail || '',
        modifiedby: user.userId,
        modifieddate: new Date(),
      }
    });

    return res.json({ Status: 4, Msg: 'Open Land Updated Successfully.' });
  } catch (error) {
    console.error('Update open land error:', error);
    return res.status(500).json({ Status: 3, Msg: 'Failed to update Open Land record.' });
  }
});

// PUT /api/properties/update-ob/:id
router.put('/update-ob/:id', authMiddleware, async (req: Request, res: Response): Promise<any> => {
  const user = req.body.currentUser;
  const olbId = parseInt(req.params.id);
  const {
    Area, StateID, District, BuildingName, FlatShopNo, FloorNo, AreaSQFT,
    CitySurveyOffice, Ward, CitySurveyNo, SheetNo, Taluka, Village, SectorNo, SectorPlotNo,
    OwnerFirstName, OwnerMiddleName, OwnerLastName, OwnerMobile,
    PurchaserFirstName, PurchaserMiddleName, PurchaserLastName, PurchaserMobile, PurchaserEmail
  } = req.body;

  try {
    const areaVal = parseInt(Area) || 1;
    let citySurveyOfficeVal = '';
    let wardVal = '';
    let citySurveyNoVal = '';
    let sheetNoVal = '';
    let talukaVal = '';
    let villageVal = '';
    let sectorNoVal = '';
    let sectorPlotNoVal = '';

    if (areaVal === 1) {
      citySurveyOfficeVal = CitySurveyOffice || '';
      wardVal = Ward || '';
      citySurveyNoVal = CitySurveyNo || '';
      sheetNoVal = SheetNo || '';
    } else if (areaVal === 2) {
      talukaVal = Taluka || '';
      villageVal = Village || '';
      citySurveyNoVal = CitySurveyNo || '';
      sectorPlotNoVal = SectorPlotNo || '';
    } else if (areaVal === 3) {
      talukaVal = Taluka || '';
      villageVal = Village || '';
      sectorNoVal = SectorNo || '';
      sectorPlotNoVal = SectorPlotNo || '';
    }

    const stateIdVal = StateID ? parseInt(StateID) : null;

    await prisma.olb.update({
      where: { olbId },
      data: {
        stateId: stateIdVal,
        area: areaVal,
        areaSqMt: AreaSQFT || '',
        citySurveyOffice: citySurveyOfficeVal,
        ward: wardVal,
        sheetNo: sheetNoVal,
        district: District || '',
        taluka: talukaVal,
        village: villageVal,
        citySurveyNo: citySurveyNoVal,
        sectorNo: sectorNoVal,
        sectorPlotNo: sectorPlotNoVal,
        buildingName: BuildingName || '',
        flatShopNo: FlatShopNo || '',
        floorNo: FloorNo || '',
        ownerFirstName: OwnerFirstName || '',
        ownerMiddleName: OwnerMiddleName || '',
        ownerLastName: OwnerLastName || '',
        ownerMobileNo: OwnerMobile || '',
        purchaserFirstName: PurchaserFirstName || '',
        purchaserMiddleName: PurchaserMiddleName || '',
        purchaserLastName: PurchaserLastName || '',
        purchaserMobileNo: PurchaserMobile || '',
        purchaserEmail: PurchaserEmail || '',
        modifiedby: user.userId,
        modifieddate: new Date(),
      }
    });

    return res.json({ Status: 4, Msg: 'Open Building Updated Successfully.' });
  } catch (error) {
    console.error('Update open building error:', error);
    return res.status(500).json({ Status: 3, Msg: 'Failed to update Open Building record.' });
  }
});


// DELETE /api/properties/:id
router.delete('/:id', authMiddleware, async (req: Request, res: Response): Promise<any> => {
  const olbId = parseInt(req.params.id);
  try {
    await prisma.olb.delete({
      where: { olbId }
    });
    return res.json({ Status: 6, Msg: 'Property Deleted Successfully.' });
  } catch (error) {
    console.error('Delete property error:', error);
    return res.status(500).json({ Status: 5, Msg: 'Failed to delete Property.' });
  }
});

// GET /api/properties/registered
router.get('/registered', authMiddleware, async (req: Request, res: Response): Promise<any> => {
  const typeFilter = req.query.Type ? parseInt(req.query.Type as string) : 1;
  const stateIdFilter = req.query.StateID ? parseInt(req.query.StateID as string) : undefined;
  const cityFilter = req.query.City as string | undefined;
  const projectIdFilter = req.query.ProjectID ? parseInt(req.query.ProjectID as string) : undefined;

  try {
    const whereClause: any = {
      type: typeFilter
    };

    // Filters on invoice relation
    if (stateIdFilter !== undefined || cityFilter || projectIdFilter !== undefined) {
      const projectConditions: any = {};
      if (stateIdFilter !== undefined) projectConditions.state_id = stateIdFilter;
      if (cityFilter) projectConditions.city = cityFilter;
      if (projectIdFilter !== undefined) projectConditions.projectId = projectIdFilter;

      whereClause.invoice_master = {
        some: {
          project_master: projectConditions
        }
      };
    }

    const properties = await prisma.olb.findMany({
      where: whereClause,
      include: {
        state_master: true,
        user_master_olb_master_addedbyTouser_master: true, // Agent detail
        invoice_master: {
          include: {
            project_master: true
          }
        }
      },
      orderBy: { olbId: 'desc' }
    });

    const formatted = properties.map(o => {
      const agent = o.user_master_olb_master_addedbyTouser_master;
      const agentName = agent ? `${agent.firstname || ''} ${agent.middlename || ''} ${agent.surname || ''}`.trim() : 'System';
      const ownerName = `${o.ownerFirstName || ''} ${o.ownerMiddleName || ''} ${o.ownerLastName || ''}`.trim();
      const stateName = o.state_master?.state_name || '';
      const address = `${stateName} ${o.district || ''} ${o.taluka || ''} ${o.village || ''}`.trim();

      const invoice = o.invoice_master[0];
      const projectName = invoice?.project_master?.projectName || 'N/A';
      const city = invoice?.project_master?.city || 'N/A';

      let draftStatusText = 'Prepared Draft';
      if (o.draftStatus === 2) draftStatusText = 'Waiting for Advocate';
      if (o.draftStatus === 3) draftStatusText = 'Received to Advocate';
      if (o.draftStatus === 4) draftStatusText = 'Complete Draft';
      if (o.draftStatus === 5) draftStatusText = 'Failed';

      return {
        olbId: o.olbId,
        agentName,
        ownerName,
        ownerMobile: o.ownerMobileNo,
        address,
        projectName,
        stateName,
        city,
        draftStatus: o.draftStatus,
        draftStatusText
      };
    });

    return res.json({ Status: 100, Properties: formatted });
  } catch (error) {
    console.error('List registered properties error:', error);
    return res.status(500).json({ Error: 'Internal Server Error' });
  }
});

export default router;
