"use client";

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import TableToolbar, { TableFooter, ColumnOption } from '@/components/TableToolbar';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  ArrowLeft, Loader2, AlertCircle, CheckCircle2, Eye, Printer, FileSpreadsheet, RefreshCw, Download, Check
} from 'lucide-react';

interface Invoice {
  invoiceId: number;
  invNo: string;
  addeddate: string;
  size: number;
  rate: number;
  grandtotal: number;
  advAmount: number;
  paymentStatus: number;
  advPaymentStatus: number;
  olbId: number;
  customizeReadymade?: number | null;
  preparedDate?: string | null;
  sentDate?: string | null;
  draftStatus?: number | null;
}

interface PaymentDetail {
  advPayId: number;
  transactionId: string;
  transactionDate: string;
  paymentMethod: string;
  remarks: string;
  amount: number;
  paymentStatus: number;
  paymentRemarks: string;
  advocateName: string;
  agentName: string;
  projectName: string;
  projectCity: string;
  projectState: string;
  invoices: Invoice[];
}

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
    payment_status: number;
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

function ViewAdvocatePaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pid = searchParams.get('pid');
  const sourcePage = searchParams.get('page') || 'DailyTransaction';

  const [payment, setPayment] = useState<PaymentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [acceptingOlbId, setAcceptingOlbId] = useState<number | null>(null);

  // Update Status Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [status, setStatus] = useState('1'); // 1 = Success, 2 = Failed
  const [remarks, setRemarks] = useState('');
  const [submittingStatus, setSubmittingStatus] = useState(false);

  // Search input state
  const [searchTerm, setSearchTerm] = useState('');

  // Table options states
  const colOptions: ColumnOption[] = [
    { key: 'invNo', label: 'Draft No' },
    { key: 'addeddate', label: 'Date' },
    { key: 'addedtime', label: 'Time' },
    { key: 'size', label: 'Size' },
    { key: 'agentName', label: 'Agent Name' },
    { key: 'category', label: 'Category' },
    { key: 'preparedDate', label: 'Prepared Date' },
    { key: 'sentDate', label: 'Sent Date' },
    { key: 'status', label: 'Status' },
    { key: 'amount', label: 'Amount (₹)' }
  ];

  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);
  const [pageSize, setPageSize] = useState(-1);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setVisibleColumns(colOptions.map(c => c.key));
  }, []);

  const isColVisible = (key: string) => visibleColumns.includes(key);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, pageSize]);

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

  const fetchPaymentDetail = async () => {
    if (!pid) {
      setError('Invalid Payout ID.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`http://localhost:5000/api/billing/adv-payments/${pid}`);
      const data = await response.json();
      if (response.ok && data.Payment) {
        setPayment(data.Payment);
      } else {
        setError(data.Error || 'Failed to retrieve payout details.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection to backend API failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
    fetchPaymentDetail();
  }, [pid]);

  const downloadWordDraft = async (activeDraft: DraftDetails) => {
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

  const handleAcceptDraftClick = async (olbId: number) => {
    if (!confirm('Are you sure you want to accept this draft?')) return;
    setAcceptingOlbId(olbId);
    setError('');
    setSuccess('');
    try {
      // 1. Accept draft in database
      const res = await fetch('http://localhost:5000/api/drafts/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ OLBID: olbId })
      });
      const data = await res.json();
      if (res.ok && data.OLBID) {
        setSuccess('Draft accepted successfully! Downloading Word file...');
        
        // 2. Fetch full details to build Word document
        const detailsRes = await fetch(`http://localhost:5000/api/billing/draft-details/${olbId}`);
        const detailsData = await detailsRes.json();
        if (detailsRes.ok && detailsData.Status === 100 && detailsData.Draft) {
          // 3. Initiate download
          await downloadWordDraft(detailsData.Draft);
        } else {
          console.warn('Could not retrieve detailed draft document structure for download.');
        }

        // Refresh payout details list
        fetchPaymentDetail();
      } else {
        setError(data.Msg || 'Failed to accept draft.');
      }
    } catch (err) {
      console.error(err);
      setError('Server connection error.');
    } finally {
      setAcceptingOlbId(null);
    }
  };

  // Filter invoices locally based on search input
  const filteredInvoices = useMemo(() => {
    if (!payment) return [];
    return payment.invoices.filter(inv => {
      const q = searchTerm.toLowerCase();
      return (inv.invNo || '').toLowerCase().includes(q) ||
             (payment.agentName || '').toLowerCase().includes(q) ||
             (getCategoryText(inv.customizeReadymade) || '').toLowerCase().includes(q) ||
             (getDraftStatusTextRaw(inv.draftStatus) || '').toLowerCase().includes(q);
    });
  }, [payment, searchTerm]);

  const paginatedInvoices = useMemo(() => {
    if (pageSize === -1) return filteredInvoices;
    const start = (currentPage - 1) * pageSize;
    return filteredInvoices.slice(start, start + pageSize);
  }, [filteredInvoices, currentPage, pageSize]);

  // Calculate totals
  const totals = useMemo(() => {
    const totalSize = filteredInvoices.reduce((sum, inv) => sum + inv.size, 0);
    const totalAmount = filteredInvoices.reduce((sum, inv) => sum + ((inv.size * inv.rate) * 1.05), 0);
    return { size: totalSize, amount: totalAmount };
  }, [filteredInvoices]);


  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pid) return;
    setSubmittingStatus(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('http://localhost:5000/api/billing/invoices/update-adv-payment-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          AdvPayID: parseInt(pid),
          Status: parseInt(status),
          Remarks: remarks
        })
      });
      const data = await response.json();
      if (response.ok) {
        setSuccess('Payment status updated successfully!');
        setModalOpen(false);
        setRemarks('');
        // Refresh details
        fetchPaymentDetail();
      } else {
        setError(data.Msg || 'Failed to update payment status.');
      }
    } catch (err) {
      console.error(err);
      setError('Server request failed.');
    } finally {
      setSubmittingStatus(false);
    }
  };

  const getStatusText = (statusNum: number) => {
    if (statusNum === 4) return <span className="text-amber-400 font-semibold">Sent / Pending</span>;
    if (statusNum === 1) return <span className="text-emerald-400 font-semibold">Success</span>;
    if (statusNum === 2) return <span className="text-rose-400 font-semibold">Failed</span>;
    return <span className="text-slate-400 font-semibold">Unknown</span>;
  };

  const getBackUrl = () => {
    if (sourcePage === 'SuccessTransaction') return '/adv_success_transaction';
    if (sourcePage === 'FailedTransaction') return '/adv_failed_transaction';
    return '/adv_daily_transaction';
  };

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return 'N/A';
      return d.toLocaleDateString('en-GB').replace(/\//g, '-');
    } catch {
      return 'N/A';
    }
  };

  const getCategoryText = (cat?: number | null) => {
    if (cat === 1) return 'Customize';
    if (cat === 2) return 'Readymade';
    return 'N/A';
  };

  const getDraftStatusLabel = (statusNum?: number | null) => {
    switch (statusNum) {
      case 1:
        return <span className="text-red-400 font-semibold">Prepared Draft</span>;
      case 2:
        return <span className="text-indigo-400 font-semibold">Waiting for Advocate</span>;
      case 3:
        return <span className="text-amber-400 font-semibold">Received to Advocate</span>;
      case 4:
        return <span className="text-emerald-400 font-semibold">Complete Draft</span>;
      default:
        return <span className="text-slate-500">N/A</span>;
    }
  };

  const getDraftStatusTextRaw = (statusNum?: number | null) => {
    switch (statusNum) {
      case 1: return 'Prepared Draft';
      case 2: return 'Waiting for Advocate';
      case 3: return 'Received to Advocate';
      case 4: return 'Complete Draft';
      default: return 'N/A';
    }
  };

  const exportToCSV = () => {
    if (!payment) return;
    const headers = [
      '#', 
      'Draft No', 
      'Date', 
      'Time', 
      'Size', 
      'Agent Name', 
      'Category', 
      'Prepared Date', 
      'Sent Date', 
      'Status', 
      'Amount'
    ];
    const rows = payment.invoices.map((inv, idx) => {
      const date = new Date(inv.addeddate);
      const amountVal = (inv.size * inv.rate) * 1.05;
      return [
        idx + 1,
        inv.invNo || 'N/A',
        date.toLocaleDateString('en-GB').replace(/\//g, '-'),
        date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        inv.size.toFixed(2),
        payment.agentName,
        getCategoryText(inv.customizeReadymade),
        formatDate(inv.preparedDate),
        formatDate(inv.sentDate),
        getDraftStatusTextRaw(inv.draftStatus),
        amountVal.toFixed(2)
      ];
    });

    const totalSize = payment.invoices.reduce((sum, inv) => sum + inv.size, 0);
    const totalAmount = payment.invoices.reduce((sum, inv) => sum + ((inv.size * inv.rate) * 1.05), 0);
    rows.push(['', 'Total', '', '', totalSize.toFixed(2), '', '', '', '', '', totalAmount.toFixed(2)]);

    const contentText = [
        `"Payout Details for Transaction - ${payment.transactionId}"`,
        '',
        headers.join(','), 
        ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
      ].join('\n');
    
    const blob = new Blob(['\uFEFF' + contentText], { type: 'text/csv;charset=utf-8' });
    const encodedUri = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `payout_detail_${payment.transactionId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(encodedUri);
  };

  if (loading) {
    return (
      <DashboardLayout role="advocate">
        <div className="h-[60vh] flex flex-col items-center justify-center gap-3 text-slate-400">
          <Loader2 className="animate-spin text-blue-500" size={32} />
          <span>Loading transaction details...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !payment) {
    return (
      <DashboardLayout role="advocate">
        <div className="p-6 space-y-4 max-w-lg mx-auto bg-slate-900 border border-slate-800 rounded-xl mt-10">
          <div className="flex items-center gap.2.5 text-red-500 font-semibold mb-2">
            <AlertCircle size={24} />
            <span>Error Occurred</span>
          </div>
          <p className="text-slate-300 text-sm">{error || 'Payout details could not be loaded.'}</p>
          <button 
            onClick={() => router.push(getBackUrl())}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Go Back
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const handleCopyData = () => {
    if (!payment) return;
    const headers = [
      '#',
      ...colOptions.filter(c => isColVisible(c.key)).map(c => c.label)
    ];

    const rows = filteredInvoices.map((inv, idx) => {
      const date = new Date(inv.addeddate);
      const amountVal = (inv.size * inv.rate) * 1.05;

      const dataRow: any[] = [idx + 1];
      if (isColVisible('invNo')) dataRow.push(inv.invNo || 'N/A');
      if (isColVisible('addeddate')) dataRow.push(date.toLocaleDateString('en-IN'));
      if (isColVisible('addedtime')) dataRow.push(date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      if (isColVisible('size')) dataRow.push(inv.size.toFixed(2));
      if (isColVisible('agentName')) dataRow.push(payment.agentName);
      if (isColVisible('category')) dataRow.push(getCategoryText(inv.customizeReadymade));
      if (isColVisible('preparedDate')) dataRow.push(formatDate(inv.preparedDate));
      if (isColVisible('sentDate')) dataRow.push(formatDate(inv.sentDate));
      if (isColVisible('status')) dataRow.push(getDraftStatusTextRaw(inv.draftStatus));
      if (isColVisible('amount')) dataRow.push(amountVal.toFixed(2));
      return dataRow;
    });

    const content = [headers.join('\t'), ...rows.map(r => r.join('\t'))].join('\n');
    navigator.clipboard.writeText(content);
    alert('Table data copied to clipboard!');
  };

  const exportToCSVFormat = (type: 'csv' | 'excel') => {
    if (!payment) return;
    const headers = [
      '#',
      ...colOptions.filter(c => isColVisible(c.key)).map(c => c.label)
    ];

    const rows = filteredInvoices.map((inv, idx) => {
      const date = new Date(inv.addeddate);
      const amountVal = (inv.size * inv.rate) * 1.05;

      const dataRow: any[] = [idx + 1];
      if (isColVisible('invNo')) dataRow.push(inv.invNo || 'N/A');
      if (isColVisible('addeddate')) dataRow.push(date.toLocaleDateString('en-IN'));
      if (isColVisible('addedtime')) dataRow.push(date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      if (isColVisible('size')) dataRow.push(inv.size.toFixed(2));
      if (isColVisible('agentName')) dataRow.push(payment.agentName);
      if (isColVisible('category')) dataRow.push(getCategoryText(inv.customizeReadymade));
      if (isColVisible('preparedDate')) dataRow.push(formatDate(inv.preparedDate));
      if (isColVisible('sentDate')) dataRow.push(formatDate(inv.sentDate));
      if (isColVisible('status')) dataRow.push(getDraftStatusTextRaw(inv.draftStatus));
      if (isColVisible('amount')) dataRow.push(amountVal.toFixed(2));
      return dataRow;
    });

    const totalRow = ['Total'];
    colOptions.filter(c => isColVisible(c.key)).forEach(c => {
      if (c.key === 'size') {
        totalRow.push(totals.size.toFixed(2));
      } else if (c.key === 'amount') {
        totalRow.push(totals.amount.toFixed(2));
      } else {
        totalRow.push('');
      }
    });
    rows.push(totalRow);

    const separator = type === 'csv' ? ',' : '\t';
    const fileExtension = type === 'csv' ? 'csv' : 'xls';
    const mimeType = type === 'csv' ? 'text/csv;charset=utf-8' : 'application/vnd.ms-excel;charset=utf-8';

    const fileContent = [headers.join(separator), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(separator))].join('\n');
    
    const blob = new Blob(['\uFEFF' + fileContent], { type: mimeType });
    const encodedUri = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `payout_detail_${payment.transactionId}.${fileExtension}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <DashboardLayout role="advocate">
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
          }
          aside, header, button, .no-print, .filter-bar {
            display: none !important;
          }
          main, .flex-1, .p-6 {
            padding: 0 !important;
            margin: 0 !important;
            background-color: #ffffff !important;
          }
          .print-card {
            border: 1px solid #000000 !important;
            box-shadow: none !important;
            color: #000000 !important;
            background-color: #ffffff !important;
          }
          th, td {
            border: 1px solid #000000 !important;
            color: #000000 !important;
          }
        }
      `}} />

      <div className="space-y-6">
        
        {/* Navigation Actions */}
        <div className="flex justify-between items-center no-print bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm select-none">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.push(getBackUrl())}
              className="p-2 bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-all flex items-center gap-1 cursor-pointer focus:outline-none"
            >
              <ArrowLeft size={16} />
              <span className="text-xs font-semibold">Back</span>
            </button>
            <h3 className="text-lg font-bold text-white font-sans">Draft Detail</h3>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={exportToCSV}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer border border-slate-700 font-sans"
            >
              <FileSpreadsheet size={14} />
              <span>Excel</span>
            </button>
            <button 
              onClick={handlePrint}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer border border-slate-700 font-sans"
            >
              <Printer size={14} />
              <span>Print</span>
            </button>

            {/* Payout Received Button */}
            {payment.paymentStatus === 4 && (
              <button 
                onClick={() => {
                  setStatus('1');
                  setRemarks('');
                  setModalOpen(true);
                }}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-purple-500/10 hover:shadow-purple-500/25 font-sans"
              >
                <RefreshCw size={14} />
                <span>Payment Received ??</span>
              </button>
            )}
          </div>
        </div>

        {success && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-3 animate-fadeIn no-print">
            <CheckCircle2 size={18} className="shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Master Payout Details Card */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl shadow-lg space-y-4 print-card">
          <h4 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2 font-sans">payout details</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
            <div>
              <span className="block text-slate-500 text-xs font-semibold font-sans">Transaction ID</span>
              <span className="text-white font-semibold block mt-1">{payment.transactionId || 'N/A'}</span>
            </div>
            <div>
              <span className="block text-slate-500 text-xs font-semibold font-sans">Date</span>
              <span className="text-slate-300 block mt-1">
                {payment.transactionDate ? new Date(payment.transactionDate).toLocaleDateString('en-IN') : 'N/A'}
              </span>
            </div>
            <div>
              <span className="block text-slate-500 text-xs font-semibold font-sans">Payment Method</span>
              <span className="text-slate-300 block mt-1">{payment.paymentMethod || 'N/A'}</span>
            </div>
            <div>
              <span className="block text-slate-500 text-xs font-semibold font-sans">Payout Status</span>
              <span className="block mt-1">{getStatusText(payment.paymentStatus)}</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm pt-2">
            <div>
              <span className="block text-slate-500 text-xs font-semibold font-sans">Remarks</span>
              <span className="text-slate-300 block mt-1">{payment.remarks || 'No transfer remarks.'}</span>
            </div>
            {payment.paymentRemarks && (
              <div>
                <span className="block text-slate-500 text-xs font-semibold font-sans">Status Update Remarks</span>
                <span className="text-slate-300 block mt-1">{payment.paymentRemarks}</span>
              </div>
            )}
          </div>
        </div>

        {/* Table Toolbar controls */}
        <TableToolbar
          totalEntries={payment.invoices.length}
          filteredEntriesCount={filteredInvoices.length}
          currentPage={currentPage}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
          onPageChange={setCurrentPage}
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          columns={colOptions}
          visibleColumns={visibleColumns}
          onVisibleColumnsChange={setVisibleColumns}
          onCopyData={handleCopyData}
          onExportExcel={() => exportToCSVFormat('excel')}
          onExportCSV={() => exportToCSVFormat('csv')}
          searchPlaceholder="Search invoices..."
        />

        {/* Invoices List Section */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg overflow-hidden print-card">
          <div className="p-4 bg-slate-900/50 border-b border-slate-800 flex justify-between items-center filter-bar select-none">
            <h4 className="text-base font-bold text-white font-sans">View Transaction</h4>
          </div>

          <div className="overflow-x-auto w-full scrollbar-thin">
            <table className="w-full border-collapse text-left text-sm text-slate-300 table-auto">
              <thead className="bg-slate-950 text-slate-400 text-xs uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4 text-center w-[50px]">#</th>
                  {isColVisible('invNo') && <th className="py-3.5 px-4 w-[130px]">Draft No</th>}
                  {isColVisible('addeddate') && <th className="py-3.5 px-4 w-[100px]">Date</th>}
                  {isColVisible('addedtime') && <th className="py-3.5 px-4 w-[80px]">Time</th>}
                  {isColVisible('size') && <th className="py-3.5 px-4 text-right w-[80px]">Size</th>}
                  {isColVisible('agentName') && <th className="py-3.5 px-4 w-[150px]">Agent Name</th>}
                  {isColVisible('category') && <th className="py-3.5 px-4 w-[110px]">Category</th>}
                  {isColVisible('preparedDate') && <th className="py-3.5 px-4 w-[115px]">Prepared Date</th>}
                  {isColVisible('sentDate') && <th className="py-3.5 px-4 w-[115px]">Sent Date</th>}
                  {isColVisible('status') && <th className="py-3.5 px-4 text-center w-[130px]">Status</th>}
                  {isColVisible('amount') && <th className="py-3.5 px-4 text-right w-[110px]">Amount (₹)</th>}
                  {currentUser?.userTypeId === 4 && <th className="py-3.5 px-4 text-center w-[110px] no-print">#</th>}
                  <th className="py-3.5 px-4 text-center w-[60px] no-print">#</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {paginatedInvoices.map((inv, idx) => {
                  const date = new Date(inv.addeddate);
                  const amountVal = (inv.size * inv.rate) * 1.05;
                  return (
                    <tr key={inv.invoiceId} className="hover:bg-slate-950/40 transition-colors">
                      <td className="py-3 px-4 text-center text-slate-500">
                        {(currentPage - 1) * (pageSize === -1 ? 0 : pageSize) + idx + 1}
                      </td>
                      {isColVisible('invNo') && <td className="py-3 px-4 font-semibold text-white truncate" title={inv.invNo || ''}>{inv.invNo || 'N/A'}</td>}
                      {isColVisible('addeddate') && <td className="py-3 px-4 whitespace-nowrap">{date.toLocaleDateString('en-IN')}</td>}
                      {isColVisible('addedtime') && <td className="py-3 px-4 whitespace-nowrap">{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>}
                      {isColVisible('size') && <td className="py-3 px-4 text-right">{inv.size.toFixed(2)}</td>}
                      {isColVisible('agentName') && <td className="py-3 px-4 truncate" title={payment.agentName}>{payment.agentName}</td>}
                      {isColVisible('category') && <td className="py-3 px-4">{getCategoryText(inv.customizeReadymade)}</td>}
                      {isColVisible('preparedDate') && <td className="py-3 px-4 whitespace-nowrap">{formatDate(inv.preparedDate)}</td>}
                      {isColVisible('sentDate') && <td className="py-3 px-4 whitespace-nowrap">{formatDate(inv.sentDate)}</td>}
                      {isColVisible('status') && <td className="py-3 px-4 text-center">{getDraftStatusLabel(inv.draftStatus)}</td>}
                      {isColVisible('amount') && <td className="py-3 px-4 text-right font-bold text-blue-400">₹{amountVal.toFixed(2)}</td>}
                      
                      {currentUser?.userTypeId === 4 && (
                        <td className="py-3 px-4 text-center no-print font-sans">
                          {inv.draftStatus === 3 ? (
                            <button
                              type="button"
                              onClick={() => handleAcceptDraftClick(inv.olbId)}
                              disabled={acceptingOlbId === inv.olbId}
                              className="text-emerald-500 hover:text-emerald-400 hover:underline font-semibold cursor-pointer disabled:opacity-50 disabled:no-underline"
                            >
                              {acceptingOlbId === inv.olbId ? 'Accepting...' : 'Accept Draft'}
                            </button>
                          ) : (
                            <span className="text-slate-500 font-medium">-</span>
                          )}
                        </td>
                      )}

                      <td className="py-3 px-4 text-center no-print">
                        <button
                          type="button"
                          onClick={() => router.push(`/pay_advocate?oid=${inv.olbId}`)}
                          className="p-1 rounded bg-blue-500/10 text-blue-400 hover:bg-blue-50 hover:text-white cursor-pointer"
                          title="View Draft Clauses"
                        >
                          <Eye size={12} />
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {/* Total Row */}
                <tr className="bg-slate-950/40 font-bold border-t border-slate-800 text-white select-none">
                  <td className="py-3.5 px-4 text-right">Total:</td>
                  {colOptions.filter(c => isColVisible(c.key)).map(c => {
                    if (c.key === 'size') {
                      return <td key={c.key} className="py-3.5 px-4 text-right font-extrabold">{totals.size.toFixed(2)}</td>;
                    } else if (c.key === 'amount') {
                      return <td key={c.key} className="py-3.5 px-4 text-right font-extrabold text-blue-400">₹{totals.amount.toFixed(2)}</td>;
                    }
                    return <td key={c.key}></td>;
                  })}
                  {currentUser?.userTypeId === 4 && <td className="py-3.5 px-4 no-print"></td>}
                  <td className="py-3.5 px-4 no-print"></td>
                </tr>
              </tbody>
            </table>
            <TableFooter
              filteredEntriesCount={filteredInvoices.length}
              totalEntries={payment.invoices.length}
              currentPage={currentPage}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>

      </div>

      {/* Payment Received Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 no-print select-none">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden animate-fadeIn">
            
            <div className="p-6 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
              <h3 className="text-base font-bold text-white font-sans">Update Payout Status</h3>
              <button 
                onClick={() => setModalOpen(false)}
                className="text-slate-450 hover:text-white transition-colors text-xl font-semibold focus:outline-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleUpdateStatus} className="p-6 space-y-4">
              <div>
                <label className="block text-slate-400 text-xs font-semibold mb-1 font-sans">Status *</label>
                <select
                  className="w-full h-10 px-3 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="1">Success</option>
                  <option value="2">Failed</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-semibold mb-1 font-sans">Remarks</label>
                <textarea
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 h-24 resize-none"
                  placeholder="Enter payout confirmation notes..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 h-9 bg-slate-850 hover:bg-slate-800 text-slate-350 font-medium rounded-lg text-xs transition-all cursor-pointer font-sans"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={submittingStatus}
                  className="px-4 h-9 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 text-white font-semibold rounded-lg text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-md font-sans"
                >
                  {submittingStatus ? (
                    <>
                      <Loader2 className="animate-spin" size={14} />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <span>Update Status</span>
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </DashboardLayout>
  );
}

export default function ViewAdvocatePaymentPage() {
  return (
    <Suspense fallback={
      <div className="h-[60vh] flex flex-col items-center justify-center gap-3 text-slate-400 bg-slate-950">
        <Loader2 className="animate-spin text-blue-500" size={32} />
        <span>Loading payout view...</span>
      </div>
    }>
      <ViewAdvocatePaymentContent />
    </Suspense>
  );
}
