"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FileSpreadsheet, Search, Loader2, AlertCircle, Printer, Eye, X, Check, AlertTriangle, Download } from 'lucide-react';
import TableToolbar, { TableFooter, ColumnOption } from '@/components/TableToolbar';

interface InvoiceDetail {
  invoiceId: number;
  invNo: string;
  grandtotal: number;
  advAmount: number;
  size: number;
  rate: number;
  addeddate: string;
  paymentStatus: number;
  advPaymentStatus: number;
  olbId: number;
  draftStatus?: number | null;
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

interface PaymentRecord {
  advPayId: number;
  transactionId: string;
  transactionDate: string;
  paymentMethod: string;
  remarks: string;
  amount: number;
  paymentStatus: number; // 4=Sent/Pending, 1=Success, 2=Failed
  paymentRemarks: string;
  advocateName: string;
  agentName: string;
  projectName: string;
  projectCity: string;
  projectState: string;
  invoices: InvoiceDetail[];
}

interface StateObj {
  state_id: number;
  state_name: string;
}

interface Project {
  projectId: number;
  projectName: string;
  city: string;
}

interface Props {
  role: 'admin' | 'advocate';
  statusFilter?: number; // 4=Sent/Pending, 1=Success, 2=Failed, undefined=History
  title: string;
  subtitle: string;
}

export default function AdvocatePayoutsList({ role, statusFilter, title, subtitle }: Props) {
  const router = useRouter();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal state
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);
  const [remarks, setRemarks] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  // Filter dropdown states
  const [states, setStates] = useState<StateObj[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  // Filter selection values
  const [stateId, setStateId] = useState('');
  const [city, setCity] = useState('');
  const [projectId, setProjectId] = useState('');

  // Local status selection state (only used if statusFilter is undefined)
  const [localStatus, setLocalStatus] = useState('-1');

  // Date Range values
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Table length, search, and visibility states
  const [pageSize, setPageSize] = useState(-1);
  const [currentPage, setCurrentPage] = useState(1);
  const [localSearchQuery, setLocalSearchQuery] = useState("");
  const [acceptingOlbId, setAcceptingOlbId] = useState<number | null>(null);

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
    try {
      // 1. Accept draft in database
      const res = await fetch('http://localhost:5000/api/drafts/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ OLBID: olbId })
      });
      const data = await res.json();
      if (res.ok && data.OLBID) {
        alert('Draft accepted successfully! Downloading Word file...');
        
        // 2. Fetch details for Word download
        const detailsRes = await fetch(`http://localhost:5000/api/billing/draft-details/${olbId}`);
        const detailsData = await detailsRes.json();
        if (detailsRes.ok && detailsData.Status === 100 && detailsData.Draft) {
          await downloadWordDraft(detailsData.Draft);
        } else {
          console.warn('Could not fetch full draft details for download.');
        }

        // 3. Refresh payouts list
        fetchPayments(stateId, city, projectId);
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

  const colOptions = useMemo<ColumnOption[]>(() => {
    if (role === 'advocate') {
      if (statusFilter !== undefined) {
        return [
          { key: 'invoiceNo', label: 'Draft No' },
          { key: 'transactionId', label: 'Transaction ID' },
          { key: 'transactionDate', label: 'Date' },
          { key: 'paymentMethod', label: 'Payment Method' },
          { key: 'amount', label: 'Amount' },
          { key: 'noOfDrafts', label: 'No of Drafts' },
          { key: 'remarks', label: 'Remarks' },
        ];
      } else {
        return [
          { key: 'invoiceNo', label: 'Draft No' },
          { key: 'transactionId', label: 'Transaction ID' },
          { key: 'transactionDate', label: 'Date' },
          { key: 'paymentMethod', label: 'Payment Method' },
          { key: 'amount', label: 'Amount' },
          { key: 'remarks', label: 'Remarks' },
          { key: 'paymentStatus', label: 'Status' },
        ];
      }
    } else {
      return [
        { key: 'invoiceNo', label: 'Draft No' },
        { key: 'transactionId', label: 'Transaction ID' },
        { key: 'transactionDate', label: 'Date' },
        { key: 'paymentMethod', label: 'Payment Method' },
        { key: 'amount', label: 'Amount' },
        { key: 'advocateName', label: 'Advocate' },
        { key: 'agentName', label: 'Agent' },
        { key: 'projectState', label: 'State' },
        { key: 'projectCity', label: 'City' },
        { key: 'projectName', label: 'Project' },
        { key: 'paymentStatus', label: 'Status' },
      ];
    }
  }, [role, statusFilter]);

  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);

  useEffect(() => {
    setVisibleColumns(colOptions.map(c => c.key));
  }, [colOptions]);

  const isColVisible = (key: string) => visibleColumns.includes(key);

  // Reset page on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [localSearchQuery, pageSize]);

  useEffect(() => {
    // Set initial date range (first day of current month to today)
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const formatDateStr = (date: Date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };
    setStartDate(formatDateStr(firstDay));
    setEndDate(formatDateStr(now));

    // Fetch filter states
    fetch('http://localhost:5000/api/users/states')
      .then(res => res.json())
      .then(data => setStates(data.States || []))
      .catch(err => console.error('Error fetching states:', err));
  }, []);

  // Fetch payments when localStatus, state, city, project or statusFilter change
  useEffect(() => {
    fetchPayments(stateId, city, projectId);
  }, [statusFilter, localStatus]);

  // Cascading Cities
  useEffect(() => {
    if (!stateId) {
      setCities([]);
      setCity('');
      return;
    }
    fetch(`http://localhost:5000/api/projects?StateID=${stateId}`)
      .then(res => res.json())
      .then(data => {
        const list: Project[] = data.Projects || [];
        const uniqueCities = Array.from(new Set(list.map(p => p.city).filter(Boolean)));
        setCities(uniqueCities);
        setCity('');
      })
      .catch(err => console.error(err));
  }, [stateId]);

  // Cascading Projects
  useEffect(() => {
    if (!stateId || !city) {
      setProjects([]);
      setProjectId('');
      return;
    }
    fetch(`http://localhost:5000/api/projects?StateID=${stateId}&City=${city}`)
      .then(res => res.json())
      .then(data => {
        setProjects(data.Projects || []);
        setProjectId('');
      })
      .catch(err => console.error(err));
  }, [stateId, city]);

  const fetchPayments = async (sId = '', c = '', pId = '') => {
    setLoading(true);
    setError('');
    try {
      let url = 'http://localhost:5000/api/billing/adv-payments';
      const params = [];

      // Determine active status filter
      const activeStatus = statusFilter !== undefined ? statusFilter : (localStatus !== '-1' ? parseInt(localStatus) : undefined);
      if (activeStatus !== undefined) params.push(`status=${activeStatus}`);
      if (sId) params.push(`stateId=${sId}`);
      if (c) params.push(`city=${encodeURIComponent(c)}`);
      if (pId) params.push(`projectId=${pId}`);

      if (params.length > 0) {
        url += `?${params.join('&')}`;
      }

      const response = await fetch(url, {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('token') : ''}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setPayments(data.Payments || []);
      } else {
        setError(data.Error || 'Failed to retrieve advocate payments.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection to server failed. Verify backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPayments(stateId, city, projectId);
  };

  const handleStatusUpdate = async (payId: number, status: number) => {
    if (!remarks.trim() && status === 2) {
      alert('Remarks are required for rejection.');
      return;
    }
    const label = status === 1 ? 'approve' : 'reject';
    if (!confirm(`Are you sure you want to ${label} this payout?`)) return;

    setSubmittingAction(true);
    try {
      const response = await fetch('http://localhost:5000/api/billing/invoices/update-adv-payment-status', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          AdvPayID: payId,
          Status: status,
          Remarks: remarks
        })
      });

      const data = await response.json();
      if (response.ok) {
        alert('Payout status updated successfully!');
        setSelectedPayment(null);
        setRemarks('');
        fetchPayments(stateId, city, projectId);
      } else {
        alert(data.Msg || 'Failed to update payout status.');
      }
    } catch (err) {
      console.error(err);
      alert('Network request failed.');
    } finally {
      setSubmittingAction(false);
    }
  };

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 4:
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">Sent / Pending</span>;
      case 1:
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Approved</span>;
      case 2:
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">Rejected</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">Unknown</span>;
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return 'N/A';
      return d.toLocaleDateString('en-GB').replace(/\//g, '-');
    } catch {
      return 'N/A';
    }
  };

  // Filter payments locally on client side for date range & search
  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      if (startDate && p.transactionDate) {
        const pDate = new Date(p.transactionDate);
        pDate.setHours(0, 0, 0, 0);
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (pDate < start) return false;
      }
      if (endDate && p.transactionDate) {
        const pDate = new Date(p.transactionDate);
        pDate.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (pDate > end) return false;
      }

      if (localSearchQuery.trim()) {
        const q = localSearchQuery.toLowerCase();
        const matchesSearch = 
          (p.transactionId || '').toLowerCase().includes(q) ||
          (p.paymentMethod || '').toLowerCase().includes(q) ||
          (p.remarks || '').toLowerCase().includes(q) ||
          (p.advocateName || '').toLowerCase().includes(q) ||
          (p.agentName || '').toLowerCase().includes(q) ||
          (p.projectName || '').toLowerCase().includes(q) ||
          (p.projectCity || '').toLowerCase().includes(q) ||
          (p.projectState || '').toLowerCase().includes(q);
        if (!matchesSearch) return false;
      }
      return true;
    });
  }, [payments, startDate, endDate, localSearchQuery]);

  const paginatedPayments = useMemo(() => {
    if (pageSize === -1) return filteredPayments;
    const start = (currentPage - 1) * pageSize;
    return filteredPayments.slice(start, start + pageSize);
  }, [filteredPayments, currentPage, pageSize]);

  const totalAmount = useMemo(() => {
    return filteredPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  }, [filteredPayments]);

  const handleCopyData = () => {
    const headers = [
      '#',
      ...colOptions.filter(c => isColVisible(c.key)).map(c => c.label)
    ];

    const rows = filteredPayments.map((p, idx) => {
      let statusText = '';
      if (p.paymentStatus === 4) statusText = 'Sent/Pending';
      else if (p.paymentStatus === 1) statusText = 'Approved';
      else if (p.paymentStatus === 2) statusText = 'Rejected';

      const dataRow: any[] = [idx + 1];
      if (isColVisible('invoiceNo')) {
        dataRow.push(p.invoices?.map(i => i.invNo).filter(Boolean).join(', ') || 'N/A');
      }
      if (isColVisible('transactionId')) dataRow.push(p.transactionId || 'N/A');
      if (isColVisible('transactionDate')) dataRow.push(formatDate(p.transactionDate));
      if (isColVisible('paymentMethod')) dataRow.push(p.paymentMethod || 'N/A');
      if (isColVisible('amount')) dataRow.push(p.amount || 0);
      if (role === 'advocate') {
        if (statusFilter !== undefined && isColVisible('noOfDrafts')) {
          dataRow.push(p.invoices?.length || 0);
        }
        if (isColVisible('remarks')) dataRow.push(p.remarks || '-');
        if (statusFilter === undefined && isColVisible('paymentStatus')) {
          dataRow.push(statusText);
        }
      } else {
        if (isColVisible('advocateName')) dataRow.push(p.advocateName || 'N/A');
        if (isColVisible('agentName')) dataRow.push(p.agentName || 'N/A');
        if (isColVisible('projectState')) dataRow.push(p.projectState || 'N/A');
        if (isColVisible('projectCity')) dataRow.push(p.projectCity || 'N/A');
        if (isColVisible('projectName')) dataRow.push(p.projectName || 'N/A');
        if (isColVisible('paymentStatus')) dataRow.push(statusText);
      }
      return dataRow;
    });

    const content = [headers.join('\t'), ...rows.map(r => r.join('\t'))].join('\n');
    navigator.clipboard.writeText(content);
    alert('Table data copied to clipboard!');
  };

  const exportToCSVFormat = (type: 'csv' | 'excel') => {
    const headers = [
      '#',
      ...colOptions.filter(c => isColVisible(c.key)).map(c => c.label)
    ];

    const rows = filteredPayments.map((p, idx) => {
      let statusText = '';
      if (p.paymentStatus === 4) statusText = 'Sent/Pending';
      else if (p.paymentStatus === 1) statusText = 'Approved';
      else if (p.paymentStatus === 2) statusText = 'Rejected';

      const dataRow: any[] = [idx + 1];
      if (isColVisible('invoiceNo')) {
        dataRow.push(p.invoices?.map(i => i.invNo).filter(Boolean).join(', ') || 'N/A');
      }
      if (isColVisible('transactionId')) dataRow.push(p.transactionId || 'N/A');
      if (isColVisible('transactionDate')) dataRow.push(formatDate(p.transactionDate));
      if (isColVisible('paymentMethod')) dataRow.push(p.paymentMethod || 'N/A');
      if (isColVisible('amount')) dataRow.push(p.amount || 0);
      if (role === 'advocate') {
        if (statusFilter !== undefined && isColVisible('noOfDrafts')) {
          dataRow.push(p.invoices?.length || 0);
        }
        if (isColVisible('remarks')) dataRow.push(p.remarks || '-');
        if (statusFilter === undefined && isColVisible('paymentStatus')) {
          dataRow.push(statusText);
        }
      } else {
        if (isColVisible('advocateName')) dataRow.push(p.advocateName || 'N/A');
        if (isColVisible('agentName')) dataRow.push(p.agentName || 'N/A');
        if (isColVisible('projectState')) dataRow.push(p.projectState || 'N/A');
        if (isColVisible('projectCity')) dataRow.push(p.projectCity || 'N/A');
        if (isColVisible('projectName')) dataRow.push(p.projectName || 'N/A');
        if (isColVisible('paymentStatus')) dataRow.push(statusText);
      }
      return dataRow;
    });

    const totalRow = ['Total'];
    colOptions.filter(c => isColVisible(c.key)).forEach(c => {
      if (c.key === 'amount') {
        totalRow.push(totalAmount.toFixed(2));
      } else {
        totalRow.push('');
      }
    });
    rows.push(totalRow);

    const separator = type === 'csv' ? ',' : '\t';
    const fileExtension = type === 'csv' ? 'csv' : 'xls';
    const mimeType = type === 'csv' ? 'text/csv;charset=utf-8' : 'application/vnd.ms-excel;charset=utf-8';

    const contentText = [headers.join(separator), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(separator))].join('\n');
    
    const blob = new Blob(['\uFEFF' + contentText], { type: mimeType });
    const encodedUri = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `advocate_payouts_${new Date().toISOString().slice(0,10)}.${fileExtension}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(encodedUri);
  };

  return (
    <>
      <div className="absolute top-10 right-10 w-[400px] h-[400px] rounded-full bg-blue-500/5 blur-[100px] pointer-events-none print:hidden" />
      
      <div className="space-y-6">
        <div className="flex justify-between items-center print:hidden">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white">{title}</h2>
            <p className="text-slate-400 text-sm mt-1">{subtitle}</p>
          </div>
        </div>

        <div className="print:block hidden mb-6 text-black">
          <h2 className="text-2xl font-bold text-center">DAINNA - Advocate Payouts Report</h2>
          <p className="text-xs text-center">Generated on: {new Date().toLocaleString()}</p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3 print:hidden">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Filter Date/Cascades Block */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl shadow-md print:hidden">
          <form onSubmit={handleSearchSubmit} className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-${statusFilter === undefined ? '7' : '6'} gap-4 items-end`}>
            {statusFilter === undefined && (
              <div className="w-full">
                <label className="block text-slate-300 text-xs font-semibold mb-1">Status</label>
                <select
                  value={localStatus}
                  onChange={(e) => setLocalStatus(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:border-blue-500"
                >
                  <option value="-1">ALL</option>
                  <option value="4">Pending</option>
                  <option value="1">Success</option>
                  <option value="2">Failed</option>
                </select>
              </div>
            )}
            <div className="w-full">
              <label className="block text-slate-300 text-xs font-semibold mb-1" htmlFor="state">State</label>
              <select
                id="state"
                value={stateId}
                onChange={(e) => setStateId(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:border-blue-500"
              >
                <option value="">-- SELECT --</option>
                {states.map(s => (
                  <option key={s.state_id} value={s.state_id}>{s.state_name}</option>
                ))}
              </select>
            </div>
            <div className="w-full">
              <label className="block text-slate-300 text-xs font-semibold mb-1" htmlFor="city">City</label>
              <select
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                disabled={!stateId}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:border-blue-500 disabled:opacity-50"
              >
                <option value="">-- SELECT --</option>
                {cities.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="w-full">
              <label className="block text-slate-300 text-xs font-semibold mb-1" htmlFor="project">Project Name</label>
              <select
                id="project"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                disabled={!city}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:border-blue-500 disabled:opacity-50"
              >
                <option value="">-- SELECT --</option>
                {projects.map(p => (
                  <option key={p.projectId} value={p.projectId}>{p.projectName}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2 md:col-span-2 lg:col-span-2 w-full">
              <label className="block text-slate-300 text-xs font-semibold mb-1">Date Range</label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-1/2 px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:border-blue-500"
                />
                <span className="text-slate-400 text-xs font-semibold">⇌</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-1/2 px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
            <div className="w-full sm:col-span-1 md:col-span-1 lg:col-span-1">
              <button
                type="submit"
                className="w-full h-[34px] bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-md justify-center shrink-0 animate-pulse"
              >
                <Search size={13} />
                <span>Fetch</span>
              </button>
            </div>
          </form>
        </div>

        {/* DataTables Operational Toolbar */}
        <TableToolbar
          totalEntries={payments.length}
          filteredEntriesCount={filteredPayments.length}
          currentPage={currentPage}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
          onPageChange={setCurrentPage}
          searchValue={localSearchQuery}
          onSearchChange={setLocalSearchQuery}
          columns={colOptions}
          visibleColumns={visibleColumns}
          onVisibleColumnsChange={setVisibleColumns}
          onCopyData={handleCopyData}
          onExportExcel={() => exportToCSVFormat('excel')}
          onExportCSV={() => exportToCSVFormat('csv')}
        />

        {/* Payouts Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg overflow-hidden print:border-0 print:shadow-none print:bg-white print:text-black">
          <div className="overflow-x-auto w-full scrollbar-thin">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400 print:hidden">
                <Loader2 className="animate-spin text-blue-500" size={28} />
                <span>Loading payouts...</span>
              </div>
            ) : filteredPayments.length === 0 ? (
              <div className="py-20 text-center text-slate-500 text-sm print:text-black">
                No advocate payouts found.
              </div>
            ) : (
              <>
                <table className="w-full border-collapse text-left text-xs text-slate-300 print:text-black table-fixed min-w-[1500px]">
                  <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800 print:bg-slate-100 print:text-black print:border-black">
                    {role === 'advocate' ? (
                      statusFilter !== undefined ? (
                        <tr>
                          <th className="py-3 px-3 text-center w-[50px]">#</th>
                          {isColVisible('invoiceNo') && <th className="py-3 px-3 w-[150px]">Draft No</th>}
                          {isColVisible('transactionId') && <th className="py-3 px-3 w-[180px]">Transaction ID</th>}
                          {isColVisible('transactionDate') && <th className="py-3 px-3 w-[120px]">Date</th>}
                          {isColVisible('paymentMethod') && <th className="py-3 px-3 w-[120px]">Method</th>}
                          {isColVisible('amount') && <th className="py-3 px-3 text-right w-[110px]">Amount</th>}
                          {isColVisible('noOfDrafts') && <th className="py-3 px-3 text-center w-[100px]">Drafts</th>}
                          {isColVisible('remarks') && <th className="py-3 px-3 w-[180px]">Remarks</th>}
                          {statusFilter === 1 && <th className="py-3 px-3 text-center w-[110px] print:hidden">#</th>}
                          <th className="py-3 px-3 text-center w-[60px] print:hidden">#</th>
                        </tr>
                      ) : (
                        <tr>
                          <th className="py-3 px-3 text-center w-[50px]">#</th>
                          {isColVisible('invoiceNo') && <th className="py-3 px-3 w-[150px]">Draft No</th>}
                          {isColVisible('transactionId') && <th className="py-3 px-3 w-[180px]">Transaction ID</th>}
                          {isColVisible('transactionDate') && <th className="py-3 px-3 w-[120px]">Date</th>}
                          {isColVisible('paymentMethod') && <th className="py-3 px-3 w-[120px]">Method</th>}
                          {isColVisible('amount') && <th className="py-3 px-3 text-right w-[110px]">Amount</th>}
                          {isColVisible('remarks') && <th className="py-3 px-3 w-[180px]">Remarks</th>}
                          {isColVisible('paymentStatus') && <th className="py-3 px-3 w-[120px]">Status</th>}
                          <th className="py-3 px-3 text-center w-[60px] print:hidden">#</th>
                        </tr>
                      )
                    ) : (
                      <tr>
                        <th className="py-3 px-3 text-center w-[50px]">#</th>
                        {isColVisible('invoiceNo') && <th className="py-3 px-3 w-[150px]">Draft No</th>}
                        {isColVisible('transactionId') && <th className="py-3 px-3 w-[180px]">Transaction ID</th>}
                        {isColVisible('transactionDate') && <th className="py-3 px-3 w-[110px]">Date</th>}
                        {isColVisible('paymentMethod') && <th className="py-3 px-3 w-[100px]">Method</th>}
                        {isColVisible('amount') && <th className="py-3 px-3 text-right w-[100px]">Amount</th>}
                        {isColVisible('advocateName') && <th className="py-3 px-3 w-[150px]">Advocate</th>}
                        {isColVisible('agentName') && <th className="py-3 px-3 w-[150px]">Agent</th>}
                        {isColVisible('projectState') && <th className="py-3 px-3 w-[100px]">State</th>}
                        {isColVisible('projectCity') && <th className="py-3 px-3 w-[100px]">City</th>}
                        {isColVisible('projectName') && <th className="py-3 px-3 w-[150px]">Project</th>}
                        {isColVisible('paymentStatus') && <th className="py-3 px-3 w-[100px]">Status</th>}
                        <th className="py-3 px-3 text-center w-[60px] print:hidden">#</th>
                      </tr>
                    )}
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 print:divide-black">
                    {paginatedPayments.map((p, idx) => (
                      <tr key={p.advPayId} className="hover:bg-slate-950/40 transition-colors print:hover:bg-transparent">
                        {role === 'advocate' ? (
                          statusFilter !== undefined ? (
                            <>
                              <td className="py-3 px-3 text-center font-medium text-slate-500 print:text-black">
                                {(currentPage - 1) * (pageSize === -1 ? 0 : pageSize) + idx + 1}
                              </td>
                              {isColVisible('invoiceNo') && (
                                <td className="py-3 px-3 font-semibold text-slate-350 print:text-black truncate" title={p.invoices?.map(i => i.invNo).join(', ') || 'N/A'}>
                                  {p.invoices && p.invoices.length > 0 ? (
                                    p.invoices.map((inv, idx2) => (
                                      <span key={inv.invoiceId}>
                                        {idx2 > 0 && ', '}
                                        <Link href={`/pay_advocate?oid=${inv.olbId}`} className="text-purple-400 hover:text-purple-300 underline font-semibold">
                                          {inv.invNo}
                                        </Link>
                                      </span>
                                    ))
                                  ) : (
                                    'N/A'
                                  )}
                                </td>
                              )}
                              {isColVisible('transactionId') && (
                                <td className="py-3 px-3 font-semibold text-white print:text-black truncate" title={p.transactionId}>
                                  {p.transactionId || 'N/A'}
                                </td>
                              )}
                              {isColVisible('transactionDate') && <td className="py-3 px-3 text-slate-400">{formatDate(p.transactionDate)}</td>}
                              {isColVisible('paymentMethod') && <td className="py-3 px-3 text-slate-400 print:text-black truncate" title={p.paymentMethod}>{p.paymentMethod}</td>}
                              {isColVisible('amount') && <td className="py-3 px-3 text-right font-bold text-blue-400 print:text-black">₹{p.amount.toFixed(2)}</td>}
                              {isColVisible('noOfDrafts') && <td className="py-3 px-3 text-center font-medium text-slate-350 print:text-black">{p.invoices?.length || 0}</td>}
                              {isColVisible('remarks') && <td className="py-3 px-3 text-slate-400 print:text-black truncate" title={p.remarks}>{p.remarks || '-'}</td>}
                              
                              {statusFilter === 1 && (
                                <td className="py-3 px-3 text-center print:hidden font-sans">
                                  {p.invoices?.[0] && p.invoices[0].draftStatus === 3 ? (
                                    <button
                                      type="button"
                                      onClick={() => handleAcceptDraftClick(p.invoices[0].olbId)}
                                      disabled={acceptingOlbId === p.invoices[0].olbId}
                                      className="text-emerald-500 hover:text-emerald-400 hover:underline font-semibold cursor-pointer disabled:opacity-50 disabled:no-underline"
                                    >
                                      {acceptingOlbId === p.invoices[0].olbId ? 'Accepting...' : 'Accept Draft'}
                                    </button>
                                  ) : (
                                    <span className="text-slate-500 font-medium">-</span>
                                  )}
                                </td>
                              )}
                            </>
                          ) : (
                            <>
                              <td className="py-3 px-3 text-center font-medium text-slate-500 print:text-black">
                                {(currentPage - 1) * (pageSize === -1 ? 0 : pageSize) + idx + 1}
                              </td>
                              {isColVisible('invoiceNo') && (
                                <td className="py-3 px-3 font-semibold text-slate-350 print:text-black truncate" title={p.invoices?.map(i => i.invNo).join(', ') || 'N/A'}>
                                  {p.invoices && p.invoices.length > 0 ? (
                                    p.invoices.map((inv, idx2) => (
                                      <span key={inv.invoiceId}>
                                        {idx2 > 0 && ', '}
                                        <Link href={`/pay_advocate?oid=${inv.olbId}`} className="text-purple-400 hover:text-purple-300 underline font-semibold">
                                          {inv.invNo}
                                        </Link>
                                      </span>
                                    ))
                                  ) : (
                                    'N/A'
                                  )}
                                </td>
                              )}
                              {isColVisible('transactionId') && (
                                <td className="py-3 px-3 font-semibold text-white print:text-black truncate" title={p.transactionId}>
                                  {p.transactionId || 'N/A'}
                                </td>
                              )}
                              {isColVisible('transactionDate') && <td className="py-3 px-3 text-slate-400">{formatDate(p.transactionDate)}</td>}
                              {isColVisible('paymentMethod') && <td className="py-3 px-3 text-slate-400 print:text-black truncate" title={p.paymentMethod}>{p.paymentMethod}</td>}
                              {isColVisible('amount') && <td className="py-3 px-3 text-right font-bold text-blue-400 print:text-black">₹{p.amount.toFixed(2)}</td>}
                              {isColVisible('remarks') && <td className="py-3 px-3 text-slate-400 print:text-black truncate" title={p.remarks}>{p.remarks || '-'}</td>}
                              {isColVisible('paymentStatus') && <td className="py-3 px-3">{getStatusBadge(p.paymentStatus)}</td>}
                            </>
                          )
                        ) : (
                          <>
                            <td className="py-3 px-3 text-center font-medium text-slate-500 print:text-black">
                              {(currentPage - 1) * (pageSize === -1 ? 0 : pageSize) + idx + 1}
                            </td>
                            {isColVisible('invoiceNo') && (
                              <td className="py-3 px-3 font-semibold text-slate-355 print:text-black truncate" title={p.invoices?.map(i => i.invNo).join(', ') || 'N/A'}>
                                {p.invoices && p.invoices.length > 0 ? (
                                  p.invoices.map((inv, idx2) => (
                                    <span key={inv.invoiceId}>
                                      {idx2 > 0 && ', '}
                                      <Link href={`/pay_advocate?oid=${inv.olbId}`} className="text-purple-400 hover:text-purple-300 underline font-semibold">
                                        {inv.invNo}
                                      </Link>
                                    </span>
                                  ))
                                ) : (
                                  'N/A'
                                )}
                              </td>
                            )}
                            {isColVisible('transactionId') && (
                              <td className="py-3 px-3 font-semibold text-white print:text-black truncate" title={p.transactionId}>
                                {p.transactionId || 'N/A'}
                              </td>
                            )}
                            {isColVisible('transactionDate') && <td className="py-3 px-3 text-slate-400">{formatDate(p.transactionDate)}</td>}
                            {isColVisible('paymentMethod') && <td className="py-3 px-3 text-slate-400 print:text-black truncate" title={p.paymentMethod}>{p.paymentMethod}</td>}
                            {isColVisible('amount') && <td className="py-3 px-3 text-right font-bold text-blue-400 print:text-black">₹{p.amount.toFixed(2)}</td>}
                            {isColVisible('advocateName') && <td className="py-3 px-3 font-semibold text-slate-200 print:text-black truncate" title={p.advocateName}>{p.advocateName}</td>}
                            {isColVisible('agentName') && <td className="py-3 px-3 text-slate-400 print:text-black truncate" title={p.agentName}>{p.agentName}</td>}
                            {isColVisible('projectState') && <td className="py-3 px-3 text-slate-400 print:text-black truncate" title={p.projectState}>{p.projectState}</td>}
                            {isColVisible('projectCity') && <td className="py-3 px-3 text-slate-400 print:text-black truncate" title={p.projectCity}>{p.projectCity}</td>}
                            {isColVisible('projectName') && <td className="py-3 px-3 font-medium text-white print:text-black truncate" title={p.projectName}>{p.projectName}</td>}
                            {isColVisible('paymentStatus') && <td className="py-3 px-3">{getStatusBadge(p.paymentStatus)}</td>}
                          </>
                        )}
                        <td className="py-3 px-3 text-center print:hidden">
                          {role === 'advocate' ? (
                            <Link 
                              href={statusFilter === undefined ? `/view_advocate_trans_history?pid=${p.advPayId}&page=TransactionHistory` : `/view_advocate_payment?pid=${p.advPayId}`}
                              className="p-1.5 rounded bg-blue-500/10 text-blue-400 hover:bg-slate-800/80 hover:text-white transition-all cursor-pointer inline-block"
                              title="View Payout Details"
                            >
                              <Eye size={14} />
                            </Link>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedPayment(p);
                                setRemarks(p.paymentRemarks || '');
                              }}
                              className="p-1.5 rounded bg-blue-500/10 text-blue-400 hover:bg-blue-50 hover:text-white transition-all cursor-pointer"
                              title="View Details"
                            >
                              <Eye size={14} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {/* Total Row */}
                    <tr className="bg-slate-950/50 font-bold border-t border-slate-800 text-white">
                      <td className="py-3 px-3 text-center">Total</td>
                      {colOptions.filter(c => isColVisible(c.key)).map(c => {
                        if (c.key === 'amount') {
                          return <td key={c.key} className="py-3 px-3 text-right text-blue-400">₹{totalAmount.toFixed(2)}</td>;
                        }
                        return <td key={c.key}></td>;
                      })}
                      {statusFilter === 1 && <td className="print:hidden"></td>}
                      <td className="print:hidden"></td>
                    </tr>
                  </tbody>
                </table>
                <TableFooter
                  filteredEntriesCount={filteredPayments.length}
                  totalEntries={payments.length}
                  currentPage={currentPage}
                  pageSize={pageSize}
                  onPageChange={setCurrentPage}
                />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn print:hidden">
          <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/40">
              <div>
                <h3 className="text-xl font-bold text-white">Payout Transaction Details</h3>
                <p className="text-xs text-slate-400 mt-1">Transaction Ref: <span className="font-semibold text-blue-400">{selectedPayment.transactionId}</span></p>
              </div>
              <button
                onClick={() => setSelectedPayment(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 transition-all cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-950/50 border border-slate-800/80">
                <div>
                  <span className="block text-slate-550 text-[10px] uppercase font-bold tracking-wider">Advocate</span>
                  <span className="font-semibold text-white text-xs">{selectedPayment.advocateName}</span>
                </div>
                <div>
                  <span className="block text-slate-550 text-[10px] uppercase font-bold tracking-wider">Date / Method</span>
                  <span className="text-slate-300 text-xs">{formatDate(selectedPayment.transactionDate)} ({selectedPayment.paymentMethod})</span>
                </div>
                <div>
                  <span className="block text-slate-550 text-[10px] uppercase font-bold tracking-wider">Total Amount</span>
                  <span className="font-bold text-blue-400 text-xs">₹{selectedPayment.amount.toFixed(2)}</span>
                </div>
                <div>
                  <span className="block text-slate-550 text-[10px] uppercase font-bold tracking-wider">Status</span>
                  <span className="text-xs">{getStatusBadge(selectedPayment.paymentStatus)}</span>
                </div>
              </div>

              {selectedPayment.remarks && (
                <div className="p-3 bg-slate-800/30 border border-slate-800 rounded-lg text-xs text-slate-405">
                  <span className="font-bold text-slate-300 block mb-1">Transfer Remarks:</span>
                  {selectedPayment.remarks}
                </div>
              )}

              {/* Invoices List */}
              <div className="space-y-3">
                <h4 className="font-bold text-xs text-white flex items-center gap-2">
                  <span>Linked Drafts ({selectedPayment.invoices.length})</span>
                </h4>

                <div className="border border-slate-800/80 rounded-xl overflow-hidden bg-slate-950/20">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950/80 text-slate-400 uppercase font-semibold border-b border-slate-800">
                      <tr>
                        <th className="py-3 px-4 text-center w-10">#</th>
                        <th className="py-3 px-4">Draft No</th>
                        <th className="py-3 px-4 text-right">Size (Sq.Ft)</th>
                        <th className="py-3 px-4 text-right">Rate</th>
                        <th className="py-3 px-4 text-right">Invoice Total</th>
                        <th className="py-3 px-4 text-right">Advocate Fee</th>
                        <th className="py-3 px-4 text-center">Status</th>
                        <th className="py-3 px-4 text-center w-16">Link</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40">
                      {selectedPayment.invoices.map((inv, idx) => (
                        <tr key={inv.invoiceId} className="hover:bg-slate-950/20 transition-colors">
                          <td className="py-3 px-4 text-center text-slate-500">{idx + 1}</td>
                          <td className="py-3 px-4 font-semibold text-white">{inv.invNo || 'N/A'}</td>
                          <td className="py-3 px-4 text-right">{inv.size.toFixed(2)}</td>
                          <td className="py-3 px-4 text-right">₹{inv.rate.toFixed(2)}</td>
                          <td className="py-3 px-4 text-right text-slate-450">₹{inv.grandtotal.toFixed(2)}</td>
                          <td className="py-3 px-4 text-right font-semibold text-blue-400">₹{inv.advAmount.toFixed(2)}</td>
                          <td className="py-3 px-4 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium ${
                              inv.advPaymentStatus === 1 ? 'bg-emerald-500/10 text-emerald-400' :
                              inv.advPaymentStatus === 2 ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400'
                            }`}>
                              {inv.advPaymentStatus === 1 ? 'Approved' : inv.advPaymentStatus === 2 ? 'Rejected' : 'Sent/Pending'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => {
                                setSelectedPayment(null);
                                router.push(`/pay_advocate?oid=${inv.olbId}`);
                              }}
                              className="p-1 rounded bg-blue-500/10 text-blue-400 hover:bg-blue-50 hover:text-white cursor-pointer"
                              title="Go to Card Detail"
                            >
                              <Eye size={12} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action Form (Advocate Role & Payout is Sent/Pending) */}
              {role === 'advocate' && selectedPayment.paymentStatus === 4 && (
                <div className="pt-4 border-t border-slate-800 space-y-4">
                  <div className="flex items-center gap-2 text-amber-400">
                    <AlertTriangle size={18} />
                    <h5 className="font-bold text-sm">Awaiting Your Approval Action</h5>
                  </div>

                  <div>
                    <label className="block text-slate-400 text-xs font-semibold mb-2">Remarks / Notes</label>
                    <textarea
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="Enter approval details or rejection reason here..."
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500 min-h-[80px]"
                    />
                  </div>

                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      disabled={submittingAction}
                      onClick={() => handleStatusUpdate(selectedPayment.advPayId, 2)}
                      className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-medium rounded-lg text-xs transition-all flex items-center gap-2 cursor-pointer shadow-md"
                    >
                      <X size={16} />
                      <span>Reject Payout</span>
                    </button>
                    <button
                      type="button"
                      disabled={submittingAction}
                      onClick={() => handleStatusUpdate(selectedPayment.advPayId, 1)}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium rounded-lg text-xs transition-all flex items-center gap-2 cursor-pointer shadow-md"
                    >
                      <Check size={16} />
                      <span>Approve Payout</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Remarks History if Completed */}
              {selectedPayment.paymentStatus !== 4 && selectedPayment.paymentRemarks && (
                <div className="pt-4 border-t border-slate-800 text-xs text-slate-450">
                  <span className="font-bold text-slate-350 block mb-1">Status Remarks:</span>
                  {selectedPayment.paymentRemarks}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
