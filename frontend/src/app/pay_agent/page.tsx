"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  Printer, ArrowLeft, Loader2, ShieldAlert, Calendar, Download
} from 'lucide-react';

interface DraftDetails {
  olbId: number;
  type: number;
  draftStatus: number;
  stateId: number | null;
  plotArea: string | null;
  citySurveyOffice: string | null;
  ward: string | null;
  sheetNo: string | null;
  district: string | null;
  taluka: string | null;
  village: string | null;
  citySurveyNo: string | null;
  sectorNo: string | null;
  sectorPlotNo: string | null;
  areaSqMt: string | null;
  ownerFirstName: string | null;
  ownerMiddleName: string | null;
  ownerLastName: string | null;
  ownerMobileNo: string | null;
  purchaserFirstName: string | null;
  purchaserMiddleName: string | null;
  purchaserLastName: string | null;
  purchaserMobileNo: string | null;
  purchaserEmail: string | null;
  language: string | null;
  agreementDraft: string | null;
  agreementAddeddate: string | null;
  propertyDetail: string | null;
  preparedDate: string | null;
  sentDate: string | null;
  acceptDate: string | null;
  area: number | null;
  addedby: number | null;
  state_master: {
    state_name: string;
  } | null;
  user_master_olb_master_addedbyTouser_master: {
    userId: number;
    firstname: string;
    middlename: string;
    surname: string;
    firmname: string | null;
    mobile: string | null;
    address: string | null;
    district: string | null;
    city: string | null;
    state_master_user_master_state_idTostate_master: {
      state_name: string;
    } | null;
  } | null;
  invoice_master: Array<{
    invoice_id: number;
    inv_no: string;
    advocate_id: number;
    project_id: number;
    size: number;
    rate: number;
    grandtotal: number;
    handling_charge_amount: number;
    adv_payment_status: number;
    project_master: {
      projectName: string;
      city: string;
    } | null;
    user_master_invoice_master_advocate_idTouser_master: {
      userId: number;
      firstname: string;
      middlename: string;
      surname: string;
      mobile: string | null;
      address: string | null;
      district: string | null;
      city: string | null;
      bankName: string | null;
      bankBranch: string | null;
      bankIfscCode: string | null;
      bankAcHolder: string | null;
      bankAcNo: string | null;
      state_master_user_master_state_idTostate_master: {
        state_name: string;
      } | null;
    } | null;
  }>;
}

function PayAgentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const olbId = searchParams.get('oid');

  const [draft, setDraft] = useState<DraftDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState<any | null>(null);

  const fetchSession = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/auth/session');
      const data = await res.json();
      if (res.ok && data.Status === 100) {
        setCurrentUser(data.User);
      }
    } catch (err) {
      console.error('Session fetch failed', err);
    }
  };

  const fetchDetails = async () => {
    if (!olbId) {
      setError('Invalid Draft/OLB ID.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`http://localhost:5000/api/billing/draft-details/${olbId}`);
      const data = await res.json();
      if (res.ok && data.Status === 100) {
        setDraft(data.Draft);
      } else {
        setError(data.Msg || 'Failed to retrieve draft details.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection to server failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
    fetchDetails();
  }, [olbId]);

  const handlePrint = () => {
    window.print();
  };

  const downloadWordDraft = async (customDraft?: DraftDetails) => {
    const activeDraft = customDraft || draft;
    if (!activeDraft) return;
    const content = activeDraft.agreementDraft || 'Agreement draft text content not created yet.';
    
    // Formatting variables
    let aText = '';
    if (activeDraft.area === 1) {
      aText = `Urban / City Survey Office : ${activeDraft.citySurveyOffice || ''} / Ward : ${activeDraft.ward || ''} / Survey No : ${activeDraft.citySurveyNo || ''} / Sheet No : ${activeDraft.sheetNo || ''}`;
    } else if (activeDraft.area === 2) {
      aText = `Rural / Taluka : ${activeDraft.taluka || ''} / Village : ${activeDraft.village || ''} / Survey No : ${activeDraft.citySurveyNo || ''} / Plot No : ${activeDraft.sectorPlotNo || ''}`;
    } else if (activeDraft.area === 3) {
      aText = `Sector Wise / Taluka : ${activeDraft.taluka || ''} / Village : ${activeDraft.village || ''} / Sector No : ${activeDraft.sectorNo || ''} / Plot No : ${activeDraft.sectorPlotNo || ''}`;
    }

    const plotOrSqmt = activeDraft.type === 1 ? activeDraft.plotArea : activeDraft.areaSqMt;
    const invMaster = activeDraft.invoice_master?.[0];
    const propertyDetailStr = `Property Details : ${activeDraft.district || ''} ${aText} Area : ${plotOrSqmt || ''} (ID : ${invMaster?.inv_no || ''})`;
    const agentProfile = activeDraft.user_master_olb_master_addedbyTouser_master;
    const agentAddr = agentProfile ? `${agentProfile.address || ''} ${agentProfile.district || ''} ${agentProfile.city || ''} ${agentProfile.state_master_user_master_state_idTostate_master?.state_name || ''}` : '';
    const agentDetail1Str = `Agent Name : ${agentProfile ? `${agentProfile.firstname || ''} ${agentProfile.surname || ''}` : ''} ${agentProfile?.firmname ? `(Firm: ${agentProfile.firmname})` : ''} Address : ${agentAddr} Contact No : ${agentProfile?.mobile || ''}`;

    const dateStr = new Date().toLocaleDateString('en-IN');

    // Parse agreement paragraphs and format headings dynamically
    const paragraphsHtml = content
      .split('\n')
      .map(p => p.trim())
      .filter(Boolean)
      .map((trimmed, idx) => {
        // Dynamic heading detection (lines that are short and fully capitalized, or start with articles/sections)
        const isHeader = trimmed.length < 60 && (
          trimmed === trimmed.toUpperCase() || 
          /^(article|section|schedule|clause)\b/i.test(trimmed) ||
          /^[0-9]+\.\s+[A-Z\s]+$/.test(trimmed)
        );
        
        if (isHeader) {
          return `<p style="margin-top: 6pt; margin-bottom: 2pt; text-align: center; line-height: 1.15; font-family: 'Times New Roman', Times, serif; font-size: 12pt; font-weight: bold; color: #000000;">${trimmed}</p>`;
        }
        
        return `<p style="margin-bottom: 4pt; text-align: justify; text-indent: 0.5in; line-height: 1.15; font-family: 'Times New Roman', Times, serif; font-size: 12pt; color: #000000;">${trimmed}</p>`;
      })
      .join('');

    const detailHtml = `
      <p style="margin-top: 6pt; margin-bottom: 2pt; font-family: 'Times New Roman', Times, serif; font-size: 12pt; font-weight: bold; color: #000000;">PROPERTY DETAILS</p>
      <p style="margin-bottom: 4pt; text-align: justify; line-height: 1.15; font-family: 'Times New Roman', Times, serif; font-size: 12pt; color: #000000;">${propertyDetailStr}</p>
      <p style="margin-top: 6pt; margin-bottom: 2pt; font-family: 'Times New Roman', Times, serif; font-size: 12pt; font-weight: bold; color: #000000;">AGENT DETAILS</p>
      <p style="margin-bottom: 4pt; text-align: justify; line-height: 1.15; font-family: 'Times New Roman', Times, serif; font-size: 12pt; color: #000000;">
        ${agentDetail1Str}<br/>
        <strong>DATE OF AGREEMENT:</strong> ${dateStr}
      </p>
    `;

    const htmlString = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <title>Draft Document</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          @page WordSection1 {
            size: 8.5in 11.0in;
            margin: 1.0in 1.0in 1.0in 1.0in;
            mso-header-margin: .5in;
            mso-footer-margin: .5in;
            mso-paper-source: 0;
          }
          div.WordSection1 {
            page: WordSection1;
          }
          body {
            font-family: "Times New Roman", Times, serif;
            font-size: 12pt;
            line-height: 1.15;
            color: #000000;
          }
        </style>
      </head>
      <body>
        <div class="WordSection1">
          ${paragraphsHtml}
          ${detailHtml}
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([htmlString], { type: 'application/msword' });
    const filename = `${invMaster?.inv_no ? invMaster.inv_no.replace(/\//g, '_') : activeDraft.olbId}.doc`;

    // Attempt native folder and name picker dialog using File System Access API
    if (typeof window !== 'undefined' && 'showSaveFilePicker' in window) {
      try {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: filename,
          id: 'dainna-drafts-dir',
          types: [{
            description: 'Word Document (.doc)',
            accept: {
              'application/msword': ['.doc'],
            },
          }],
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') {
          console.log('User cancelled save operation');
          return;
        }
        console.warn('showSaveFilePicker failed, falling back to legacy download:', err);
      }
    }

    // Fallback: Legacy link-based download
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getRole = () => {
    if (!currentUser) return 'agent';
    if (currentUser.userTypeId === 3) return 'agent';
    if (currentUser.userTypeId === 4) return 'advocate';
    return 'admin';
  };

  if (loading) {
    return (
      <DashboardLayout role={getRole()}>
        <div className="h-[60vh] flex flex-col items-center justify-center gap-3 text-slate-400">
          <Loader2 className="animate-spin text-blue-500" size={32} />
          <span>Fetching draft details...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !draft) {
    return (
      <DashboardLayout role={getRole()}>
        <div className="p-6 space-y-4 max-w-lg mx-auto bg-slate-900 border border-slate-800 rounded-xl mt-10">
          <div className="flex items-center gap-2.5 text-red-500 font-semibold mb-2">
            <ShieldAlert size={24} />
            <span>Error Occurred</span>
          </div>
          <p className="text-slate-300 text-sm">{error || 'Draft details could not be loaded.'}</p>
          <button 
            onClick={() => router.back()}
            className="px-4 py-2 bg-slate-850 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Go Back
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const invoice = draft.invoice_master?.[0] || null;
  const agent = draft.user_master_olb_master_addedbyTouser_master;
  const advocate = invoice?.user_master_invoice_master_advocate_idTouser_master || null;

  // Formatting strings
  const formattedPrepDate = draft.preparedDate ? new Date(draft.preparedDate).toLocaleDateString('en-IN') : 'N/A';
  const formattedSentDate = draft.sentDate ? new Date(draft.sentDate).toLocaleDateString('en-IN') : 'N/A';
  const formattedAcceptDate = draft.acceptDate ? new Date(draft.acceptDate).toLocaleDateString('en-IN') : 'N/A';

  // Area text formatting
  let areaText = '';
  if (draft.area === 1) {
    areaText = `Urban / City Survey Office : ${draft.citySurveyOffice || ''} / Ward : ${draft.ward || ''} / Survey No : ${draft.citySurveyNo || ''} / Sheet No : ${draft.sheetNo || ''}`;
  } else if (draft.area === 2) {
    areaText = `Rural / Taluka : ${draft.taluka || ''} / Village : ${draft.village || ''} / Survey No : ${draft.citySurveyNo || ''} / Plot No : ${draft.sectorPlotNo || ''}`;
  } else if (draft.area === 3) {
    areaText = `Sector Wise / Taluka : ${draft.taluka || ''} / Village : ${draft.village || ''} / Sector No : ${draft.sectorNo || ''} / Plot No : ${draft.sectorPlotNo || ''}`;
  }

  const plotAreaOrSqmt = draft.type === 1 ? draft.plotArea : draft.areaSqMt;
  const propertyDetailString = `Property Details : ${draft.district || ''} ${areaText} Area : ${plotAreaOrSqmt || ''} (ID : ${invoice?.inv_no || ''})`;
  const agentAddressFull = agent ? `${agent.address || ''} ${agent.district || ''} ${agent.city || ''} ${agent.state_master_user_master_state_idTostate_master?.state_name || ''}` : '';
  const agentDetail1String = `Agent Name : ${agent ? `${agent.firstname || ''} ${agent.surname || ''}` : ''} ${agent?.firmname ? `(Firm: ${agent.firmname})` : ''} Address : ${agentAddressFull} Contact No : ${agent?.mobile || ''}`;

  // Math
  const aSize = invoice?.size || 0;
  const aRate = invoice?.rate || 0;
  const aTotal = aSize * aRate;
  const aSGST = aTotal * 2.5 / 105; // Matches handling
  const aCGST = aTotal * 2.5 / 105;
  const aTotalGST = aSGST + aCGST;
  const amountPayable = aTotal; 

  return (
    <DashboardLayout role={getRole()}>
      {/* Printable styling setup */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
          }
          aside, header, button, .no-print {
            display: none !important;
          }
          main, .flex-1, .p-6 {
            padding: 0 !important;
            margin: 0 !important;
            background-color: #ffffff !important;
          }
          .print-card {
            background-color: #ffffff !important;
            border: 1px solid #000000 !important;
            color: #000000 !important;
            box-shadow: none !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          .print-td {
            border: 1px solid #000000 !important;
            color: #000000 !important;
            background-color: #ffffff !important;
          }
        }
      `}} />

      <div className="space-y-6">
        
        {/* Navigation Actions */}
        <div className="flex justify-between items-center no-print bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm select-none">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.back()}
              className="p-2 bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-all flex items-center gap-1 cursor-pointer focus:outline-none"
            >
              <ArrowLeft size={16} />
              <span className="text-xs font-semibold">Back</span>
            </button>
            <h3 className="text-lg font-bold text-white">Draft Detail</h3>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={handlePrint}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/25"
            >
              <Printer size={14} />
              <span>Print Draft Card</span>
            </button>

            {draft.draftStatus === 4 && (
              <button 
                onClick={() => downloadWordDraft()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-blue-500/10 hover:shadow-blue-500/25"
              >
                <Download size={14} />
                <span>Download Word Draft</span>
              </button>
            )}
          </div>
        </div>

        {/* The Printable Draft Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg print-card select-none">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm text-slate-350 border border-slate-800 print-td">
              <tbody>
                {/* Headers */}
                <tr className="bg-slate-950 border-b border-slate-800 print-td">
                  <td colSpan={16} className="py-2.5 px-4 font-bold text-white print-td">Agent Detail</td>
                  <td className="w-4 border-r border-slate-800 print-td"></td>
                  <td colSpan={16} className="py-2.5 px-4 font-bold text-white print-td">Customer Details</td>
                  <td className="w-4 border-r border-slate-800 print-td"></td>
                  <td colSpan={16} className="py-2.5 px-4 font-bold text-white print-td">Draft Dates</td>
                </tr>

                {/* Rows 1 */}
                <tr className="border-b border-slate-805 print-td">
                  <td colSpan={5} className="py-2 px-3 text-slate-450 border-r border-slate-850 font-medium print-td">Name:</td>
                  <td colSpan={11} className="py-2 px-3 text-white border-r border-slate-800 font-semibold print-td">
                    {agent ? `${agent.firstname || ''} ${agent.surname || ''}`.trim() : 'N/A'}
                  </td>
                  <td className="border-r border-slate-800 print-td"></td>
                  <td colSpan={5} className="py-2 px-3 text-slate-450 border-r border-slate-850 font-medium print-td">Name:</td>
                  <td colSpan={11} className="py-2 px-3 text-white border-r border-slate-800 font-semibold print-td">
                    {`${draft.purchaserFirstName || ''} ${draft.purchaserLastName || ''}`.trim() || 'N/A'}
                  </td>
                  <td className="border-r border-slate-800 print-td"></td>
                  <td colSpan={8} className="py-2 px-3 text-slate-450 border-r border-slate-850 font-medium print-td">Prepared:</td>
                  <td colSpan={8} className="py-2 px-3 text-white font-semibold print-td">{formattedPrepDate}</td>
                </tr>

                {/* Rows 2 */}
                <tr className="border-b border-slate-805 print-td">
                  <td colSpan={5} className="py-2 px-3 text-slate-450 border-r border-slate-850 font-medium print-td">Contact No:</td>
                  <td colSpan={11} className="py-2 px-3 text-white border-r border-slate-800 print-td">
                    {agent?.mobile || 'N/A'}
                  </td>
                  <td className="border-r border-slate-800 print-td"></td>
                  <td colSpan={5} className="py-2 px-3 text-slate-450 border-r border-slate-850 font-medium print-td">Contact No:</td>
                  <td colSpan={11} className="py-2 px-3 text-white border-r border-slate-800 print-td">
                    {draft.purchaserMobileNo || 'N/A'}
                  </td>
                  <td className="border-r border-slate-800 print-td"></td>
                  <td colSpan={8} className="py-2 px-3 text-slate-450 border-r border-slate-850 font-medium print-td">Sent Date:</td>
                  <td colSpan={8} className="py-2 px-3 text-white font-semibold print-td">{formattedSentDate}</td>
                </tr>

                {/* Rows 3 */}
                <tr className="border-b border-slate-805 print-td">
                  <td colSpan={5} className="py-2 px-3 text-slate-450 border-r border-slate-850 font-medium print-td">Firm Name:</td>
                  <td colSpan={11} className="py-2 px-3 text-white border-r border-slate-800 print-td">
                    {agent?.firmname || 'N/A'}
                  </td>
                  <td className="border-r border-slate-800 print-td"></td>
                  <td colSpan={5} className="py-2 px-3 text-slate-450 border-r border-slate-850 font-medium print-td">Email:</td>
                  <td colSpan={11} className="py-2 px-3 text-white border-r border-slate-800 print-td">
                    {draft.purchaserEmail || 'N/A'}
                  </td>
                  <td className="border-r border-slate-800 print-td"></td>
                  <td colSpan={8} className="py-2 px-3 text-slate-450 border-r border-slate-850 font-medium print-td">Accept Date:</td>
                  <td colSpan={8} className="py-2 px-3 text-white font-semibold print-td">{formattedAcceptDate}</td>
                </tr>

                {/* Rows 4 */}
                <tr className="border-b border-slate-800 print-td">
                  <td colSpan={5} className="py-2 px-3 text-slate-450 border-r border-slate-850 font-medium print-td">Address:</td>
                  <td colSpan={11} className="py-2 px-3 text-slate-300 border-r border-slate-800 text-xs print-td">
                    {agentAddressFull || 'N/A'}
                  </td>
                  <td className="border-r border-slate-800 print-td"></td>
                  <td colSpan={16} className="border-r border-slate-800 print-td"></td>
                  <td className="border-r border-slate-800 print-td"></td>
                  <td colSpan={16} className="print-td"></td>
                </tr>

                {/* Separator row */}
                <tr className="bg-slate-950 border-b border-slate-800 print-td">
                  <td colSpan={50} className="py-2 px-4 text-center font-bold text-white tracking-widest print-td">DRAFT DOCUMENT CONTENT</td>
                </tr>

                {/* Draft Content Frame */}
                <tr className="border-b border-slate-800 print-td">
                  <td colSpan={50} className="py-6 px-6 text-slate-100 print-td font-sans leading-relaxed text-sm bg-slate-950/20 select-text whitespace-pre-wrap">
                    <div className="prose prose-invert max-w-none mb-6">
                      {draft.agreementDraft || 'Agreement draft text content not created yet.'}
                    </div>
                    <div className="border-t border-slate-800/60 pt-4 mt-6 text-xs text-slate-400 space-y-1">
                      <p>{propertyDetailString}</p>
                      <p>{agentDetail1String}</p>
                    </div>
                  </td>
                </tr>

                {/* Bottom headers */}
                <tr className="bg-slate-950 border-b border-slate-800 print-td">
                  <td colSpan={16} className="py-2.5 px-4 font-bold text-white print-td">Advocate Detail</td>
                  <td className="w-4 border-r border-slate-800 print-td"></td>
                  <td colSpan={16} className="py-2.5 px-4 font-bold text-white print-td">Bank Account Details</td>
                  <td className="w-4 border-r border-slate-800 print-td"></td>
                  <td colSpan={16} className="py-2.5 px-4 font-bold text-white print-td">Billing Payout Details</td>
                </tr>

                {/* Advocate Detail Row 1 */}
                <tr className="border-b border-slate-805 print-td">
                  <td colSpan={6} className="py-2 px-3 text-slate-450 border-r border-slate-850 font-medium print-td">Name:</td>
                  <td colSpan={10} className="py-2 px-3 text-white border-r border-slate-800 font-semibold print-td">
                    {advocate ? `${advocate.firstname || ''} ${advocate.surname || ''}`.trim() : 'N/A'}
                  </td>
                  <td className="border-r border-slate-800 print-td"></td>
                  <td colSpan={7} className="py-2 px-3 text-slate-450 border-r border-slate-850 font-medium print-td">Account No:</td>
                  <td colSpan={9} className="py-2 px-3 text-white border-r border-slate-800 font-semibold print-td">
                    {advocate?.bankAcNo || 'N/A'}
                  </td>
                  <td className="border-r border-slate-800 print-td"></td>
                  <td colSpan={10} className="py-2 px-3 text-slate-450 border-r border-slate-850 font-medium print-td">
                    Paid Amount by Agent:
                  </td>
                  <td colSpan={6} className="py-2 px-3 text-white font-bold print-td">
                    ₹{(invoice?.grandtotal || 0).toFixed(2)}
                  </td>
                </tr>

                {/* Advocate Detail Row 2 */}
                <tr className="border-b border-slate-805 print-td">
                  <td colSpan={6} className="py-2 px-3 text-slate-450 border-r border-slate-850 font-medium print-td">Address:</td>
                  <td colSpan={10} className="py-2 px-3 text-slate-300 border-r border-slate-800 text-xs print-td">
                    {advocate ? `${advocate.address || ''} ${advocate.district || ''} ${advocate.city || ''} ${advocate.state_master_user_master_state_idTostate_master?.state_name || ''}` : 'N/A'}
                  </td>
                  <td className="border-r border-slate-800 print-td"></td>
                  <td colSpan={7} className="py-2 px-3 text-slate-450 border-r border-slate-850 font-medium print-td">Account Name:</td>
                  <td colSpan={9} className="py-2 px-3 text-white border-r border-slate-800 print-td">
                    {advocate?.bankAcHolder || 'N/A'}
                  </td>
                  <td className="border-r border-slate-800 print-td"></td>
                  <td colSpan={10} className="py-2 px-3 text-slate-450 border-r border-slate-850 font-medium print-td">
                    Handling Charge Amt:
                  </td>
                  <td colSpan={6} className="py-2 px-3 text-white font-bold print-td">
                    ₹{(invoice?.handling_charge_amount || 0).toFixed(2)}
                  </td>
                </tr>

                {/* Advocate Detail Row 3 */}
                <tr className="border-b border-slate-805 print-td">
                  <td colSpan={6} className="py-2 px-3 text-slate-450 border-r border-slate-850 font-medium print-td">Project Name:</td>
                  <td colSpan={10} className="py-2 px-3 text-white border-r border-slate-800 print-td">
                    {invoice?.project_master?.projectName || 'N/A'}
                  </td>
                  <td className="border-r border-slate-800 print-td"></td>
                  <td colSpan={7} className="py-2 px-3 text-slate-450 border-r border-slate-850 font-medium print-td">IFSC Code:</td>
                  <td colSpan={9} className="py-2 px-3 text-white border-r border-slate-800 print-td">
                    {advocate?.bankIfscCode || 'N/A'}
                  </td>
                  <td className="border-r border-slate-800 print-td"></td>
                  <td colSpan={10} className="py-2 px-3 text-slate-450 border-r border-slate-850 font-semibold text-blue-400 print-td">
                    To Pay:
                  </td>
                  <td colSpan={6} className="py-2 px-3 text-emerald-400 font-extrabold text-base print-td">
                    ₹{((invoice?.grandtotal || 0) - (invoice?.handling_charge_amount || 0)).toFixed(2)}
                  </td>
                </tr>

                {/* Advocate Detail Row 4 */}
                <tr className="print-td">
                  <td colSpan={6} className="py-2 px-3 text-slate-450 border-r border-slate-850 font-medium print-td">Project City:</td>
                  <td colSpan={10} className="py-2 px-3 text-white border-r border-slate-800 print-td">
                    {invoice?.project_master?.city || 'N/A'}
                  </td>
                  <td className="border-r border-slate-800 print-td"></td>
                  <td colSpan={7} className="py-2 px-3 text-slate-450 border-r border-slate-850 font-medium print-td">Bank Branch:</td>
                  <td colSpan={9} className="py-2 px-3 text-white border-r border-slate-800 print-td">
                    {advocate?.bankBranch || 'N/A'}
                  </td>
                  <td className="border-r border-slate-800 print-td"></td>
                  <td colSpan={16} className="print-td"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </DashboardLayout>
  );
}

export default function PayAgentPage() {
  return (
    <Suspense fallback={
      <div className="h-[60vh] flex flex-col items-center justify-center gap-3 text-slate-400 bg-slate-950">
        <Loader2 className="animate-spin text-blue-500" size={32} />
        <span>Loading payment info...</span>
      </div>
    }>
      <PayAgentContent />
    </Suspense>
  );
}
