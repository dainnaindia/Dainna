"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import TableToolbar, { TableFooter } from '@/components/TableToolbar';
import { 
  Hourglass, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  Printer, 
  MessageSquare, 
  CreditCard,
  Search,
  SlidersHorizontal,
  ChevronDown,
  Loader2,
  AlertCircle
} from 'lucide-react';

interface OlbItem {
  olb_item_id: number;
  survey_no_new: string | null;
  survey_no_old: string | null;
}

interface UserSummary {
  userId: number;
  firstname: string;
  middlename: string | null;
  surname: string;
}

interface Invoice {
  invoice_id: number;
  inv_no: string | null;
  invoice_no: string | null;
  addeddate: string | null;
  payment_status: number | null;
  adv_payment_status: number | null;
  adv_amount: number | null;
  adv_transaction_id: string | null;
  advocate_id: number | null;
  project_master: {
    projectId: number;
    projectName: string;
    city: string;
  } | null;
  user_master_invoice_master_advocate_idTouser_master: UserSummary | null;
}

interface Draft {
  olbId: number;
  type: number;
  customizeReadymade: number | null;
  district: string;
  ownerFirstName: string;
  ownerLastName: string;
  purchaserFirstName: string;
  purchaserLastName: string;
  purchaserMobileNo: string;
  language: string;
  preparedDate: string;
  sentDate: string | null;
  modifieddate: string | null;
  area: number | null;
  citySurveyOffice: string | null;
  ward: string | null;
  sheetNo: string | null;
  taluka: string | null;
  village: string | null;
  citySurveyNo: string | null;
  sectorNo: string | null;
  sectorPlotNo: string | null;
  state_master: {
    state_name: string;
  } | null;
  user_master_olb_master_addedbyTouser_master: UserSummary | null;
  invoice_master?: Invoice[];
  draftStatus: number;
}

export default function AdvocateDraftStatusPage() {
  const router = useRouter();
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [role, setRole] = useState<'admin' | 'agent' | 'advocate'>('agent');
  const [userTypeId, setUserTypeId] = useState<number | null>(null);

  // Admin filter selections
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedAgent, setSelectedAgent] = useState('');
  const [selectedAdvocate, setSelectedAdvocate] = useState('');

  // DataTables toolbar and pagination states
  const [searchTerm, setSearchTerm] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Dynamic values extracted from drafts for filters
  const [projectsList, setProjectsList] = useState<string[]>([]);
  const [agentsList, setAgentsList] = useState<string[]>([]);
  const [advocatesList, setAdvocatesList] = useState<string[]>([]);

  // Fetch session and role details
  const fetchSessionAndData = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Fetch current profile
      const profileRes = await fetch('http://localhost:5000/api/users/profile', { credentials: 'include' });
      const profileData = await profileRes.json();
      if (!profileRes.ok || !profileData.User) {
        router.push('/login');
        return;
      }

      const utype = profileData.User.userTypeId;
      setUserTypeId(utype);
      
      let computedRole: 'admin' | 'agent' | 'advocate' = 'agent';
      if (utype === 1 || utype === 2) {
        computedRole = 'admin';
      } else if (utype === 4) {
        computedRole = 'advocate';
      }
      setRole(computedRole);

      // 2. Fetch drafts advocate status list
      const statusRes = await fetch('http://localhost:5000/api/drafts/advocate-status', { credentials: 'include' });
      const statusData = await statusRes.json();
      if (statusRes.ok) {
        const draftsData = statusData.Drafts || [];
        setDrafts(draftsData);

        // Extract unique filters dynamically for Admins
        if (computedRole === 'admin') {
          const projs = new Set<string>();
          const ags = new Set<string>();
          const advs = new Set<string>();

          draftsData.forEach((d: Draft) => {
            const invoice = d.invoice_master?.[0] || null;
            if (invoice?.project_master?.projectName) {
              projs.add(invoice.project_master.projectName);
            }
            if (d.user_master_olb_master_addedbyTouser_master) {
              const name = `${d.user_master_olb_master_addedbyTouser_master.firstname} ${d.user_master_olb_master_addedbyTouser_master.surname}`.trim();
              ags.add(name);
            }
            if (invoice?.user_master_invoice_master_advocate_idTouser_master) {
              const name = `${invoice.user_master_invoice_master_advocate_idTouser_master.firstname} ${invoice.user_master_invoice_master_advocate_idTouser_master.surname}`.trim();
              advs.add(name);
            }
          });

          setProjectsList(Array.from(projs).sort());
          setAgentsList(Array.from(ags).sort());
          setAdvocatesList(Array.from(advs).sort());
        }
      } else {
        setError(statusData.Msg || 'Failed to retrieve advocate status tracking list.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection to server failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessionAndData();
  }, []);

  // Format Helper: Property details
  const formatPropertyAddress = (d: Draft) => {
    let areaText = '';
    if (d.area === 1) {
      areaText = `Urban/ City Survey Office : ${d.citySurveyOffice || ''}/ Ward : ${d.ward || ''}/ Survey No : ${d.citySurveyNo || ''}`;
    } else if (d.area === 2) {
      areaText = `Rural/ Taluka : ${d.taluka || ''}/ Village : ${d.village || ''}/ Survey No : ${d.citySurveyNo || ''}`;
    } else if (d.area === 3) {
      areaText = `Sector Wise/ Taluka : ${d.taluka || ''}/ Village : ${d.village || ''}/ Sector No : ${d.sectorNo || ''}/ Plot No : ${d.sectorPlotNo || ''}`;
    }
    const stateName = d.state_master?.state_name || '';
    return `${stateName} - ${d.district || ''} / ${areaText}`;
  };

  // Helper: Draft Stage rendering
  const getStageLabelAndBadge = (d: Draft) => {
    const invoice = d.invoice_master?.[0] || null;
    const pStatus = invoice?.payment_status;
    const dStatus = d.draftStatus;

    if (pStatus === 4 || pStatus === 0 || dStatus === 2) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <Hourglass size={12} className="animate-spin" />
          <span>Payment Verify Pending</span>
        </span>
      );
    }
    if (pStatus === 1 && dStatus === 3) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
          <Hourglass size={12} />
          <span>Draft Acceptance Pending</span>
        </span>
      );
    }
    if (pStatus === 1 && dStatus === 4) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-450 border border-emerald-500/20">
          <CheckCircle2 size={12} />
          <span>Draft Approved & Completed</span>
        </span>
      );
    }
    if (dStatus === 5 || pStatus === 2) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
          <XCircle size={12} />
          <span>Draft Rejected / Failed</span>
        </span>
      );
    }
    return <span className="text-slate-500">—</span>;
  };

  const getStageText = (d: Draft) => {
    const invoice = d.invoice_master?.[0] || null;
    const pStatus = invoice?.payment_status;
    const dStatus = d.draftStatus;

    if (pStatus === 4 || pStatus === 0 || dStatus === 2) return 'Payment Verify Pending';
    if (pStatus === 1 && dStatus === 3) return 'Draft Acceptance Pending';
    if (pStatus === 1 && dStatus === 4) return 'Draft Approved & Completed';
    if (dStatus === 5 || pStatus === 2) return 'Draft Rejected';
    return '—';
  };

  // Helper: Advocate Payout Status rendering
  const getPayoutStatusBadge = (invoice: Invoice | null) => {
    if (!invoice) return <span className="px-2 py-0.5 rounded text-xs bg-slate-800 text-slate-400">Not Initiated</span>;
    const status = invoice.adv_payment_status;
    if (status === 0) {
      return <span className="px-2 py-0.5 rounded text-xs font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">Pending Verification</span>;
    }
    if (status === 1) {
      return <span className="px-2 py-0.5 rounded text-xs font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Paid</span>;
    }
    if (status === 2) {
      return <span className="px-2 py-0.5 rounded text-xs font-bold uppercase bg-red-500/10 text-red-400 border border-red-500/20">Failed</span>;
    }
    if (status === 4) {
      return <span className="px-2 py-0.5 rounded text-xs font-bold uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">Processing</span>;
    }
    return <span className="px-2 py-0.5 rounded text-xs bg-slate-800 text-slate-400">Not Initiated</span>;
  };

  const getPayoutStatusText = (invoice: Invoice | null) => {
    if (!invoice) return 'Not Initiated';
    const status = invoice.adv_payment_status;
    if (status === 0) return 'Pending Verification';
    if (status === 1) return 'Paid';
    if (status === 2) return 'Failed';
    if (status === 4) return 'Processing';
    return 'Not Initiated';
  };

  // Filtering Logic
  const filteredDrafts = drafts.filter(d => {
    const invoice = d.invoice_master?.[0] || null;
    
    // Project filter (Admin)
    if (selectedProject && invoice?.project_master?.projectName !== selectedProject) return false;

    // Agent filter (Admin)
    const agentName = d.user_master_olb_master_addedbyTouser_master
      ? `${d.user_master_olb_master_addedbyTouser_master.firstname} ${d.user_master_olb_master_addedbyTouser_master.surname}`.trim()
      : '';
    if (selectedAgent && agentName !== selectedAgent) return false;

    // Advocate filter (Admin)
    const advocateName = invoice?.user_master_invoice_master_advocate_idTouser_master
      ? `${invoice.user_master_invoice_master_advocate_idTouser_master.firstname} ${invoice.user_master_invoice_master_advocate_idTouser_master.surname}`.trim()
      : '';
    if (selectedAdvocate && advocateName !== selectedAdvocate) return false;

    // Search bar filter
    const ownerFull = `${d.ownerFirstName} ${d.ownerLastName}`.toLowerCase();
    const purchaserFull = `${d.purchaserFirstName} ${d.purchaserLastName}`.toLowerCase();
    const address = formatPropertyAddress(d).toLowerCase();
    const invNo = (invoice?.inv_no || '').toLowerCase();
    const stage = getStageText(d).toLowerCase();
    
    const fullSearch = `${invNo} ${ownerFull} ${purchaserFull} ${d.purchaserMobileNo} ${address} ${stage} ${advocateName.toLowerCase()}`.toLowerCase();
    return fullSearch.includes(searchTerm.toLowerCase());
  });

  const displayedDrafts = pageSize === -1
    ? filteredDrafts
    : filteredDrafts.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Copy table action
  const copyTable = () => {
    const text = filteredDrafts.map((d, idx) => {
      const invoice = d.invoice_master?.[0] || null;
      const date = d.sentDate ? new Date(d.sentDate).toLocaleDateString('en-IN') : 'N/A';
      const stage = getStageText(d);
      const advName = invoice?.user_master_invoice_master_advocate_idTouser_master
        ? `${invoice.user_master_invoice_master_advocate_idTouser_master.firstname} ${invoice.user_master_invoice_master_advocate_idTouser_master.surname}`.trim()
        : 'N/A';
      const agentName = d.user_master_olb_master_addedbyTouser_master
        ? `${d.user_master_olb_master_addedbyTouser_master.firstname} ${d.user_master_olb_master_addedbyTouser_master.surname}`.trim()
        : 'N/A';

      if (role === 'admin') {
        const pStatus = getPayoutStatusText(invoice);
        const pAmount = invoice?.adv_amount ? `₹${invoice.adv_amount}` : 'N/A';
        const pUtr = invoice?.adv_transaction_id || 'N/A';
        return `${idx + 1}\t${date}\t${invoice?.inv_no || 'N/A'}\t${agentName}\t${invoice?.project_master?.projectName || 'N/A'}\t${advName}\t${stage}\t${pStatus}\t${pAmount}\t${pUtr}`;
      } else if (role === 'advocate') {
        return `${idx + 1}\t${date}\t${invoice?.inv_no || 'N/A'}\t${agentName}\t${invoice?.project_master?.projectName || 'N/A'}\t${stage}`;
      } else {
        return `${idx + 1}\t${date}\t${invoice?.inv_no || 'N/A'}\t${invoice?.project_master?.projectName || 'N/A'}\t${advName}\t${stage}`;
      }
    }).join('\n');
    navigator.clipboard.writeText(text);
    alert('Table copied to clipboard!');
  };

  // Export CSV action
  const exportCSV = () => {
    let headers = ["#", "Date Sent", "Draft No", "Project Name", "Advocate Name", "Current Stage"];
    if (role === 'admin') {
      headers = ["#", "Date Sent", "Draft No", "Agent Name", "Project Name", "Advocate Name", "Current Stage", "Payout Status", "Payout Amount", "Payout UTR"];
    } else if (role === 'advocate') {
      headers = ["#", "Date Sent", "Draft No", "Agent Name", "Project Name", "Current Stage"];
    }

    const rows = filteredDrafts.map((d, idx) => {
      const invoice = d.invoice_master?.[0] || null;
      const date = d.sentDate ? new Date(d.sentDate).toLocaleDateString('en-IN') : 'N/A';
      const stage = getStageText(d);
      const advName = invoice?.user_master_invoice_master_advocate_idTouser_master
        ? `${invoice.user_master_invoice_master_advocate_idTouser_master.firstname} ${invoice.user_master_invoice_master_advocate_idTouser_master.surname}`.trim()
        : 'N/A';
      const agentName = d.user_master_olb_master_addedbyTouser_master
        ? `${d.user_master_olb_master_addedbyTouser_master.firstname} ${d.user_master_olb_master_addedbyTouser_master.surname}`.trim()
        : 'N/A';

      if (role === 'admin') {
        const pStatus = getPayoutStatusText(invoice);
        const pAmount = invoice?.adv_amount ? String(invoice.adv_amount) : 'N/A';
        const pUtr = invoice?.adv_transaction_id || 'N/A';
        return [
          idx + 1,
          date,
          invoice?.inv_no || 'N/A',
          agentName,
          invoice?.project_master?.projectName || 'N/A',
          advName,
          stage,
          pStatus,
          pAmount,
          pUtr
        ];
      } else if (role === 'advocate') {
        return [
          idx + 1,
          date,
          invoice?.inv_no || 'N/A',
          agentName,
          invoice?.project_master?.projectName || 'N/A',
          stage
        ];
      } else {
        return [
          idx + 1,
          date,
          invoice?.inv_no || 'N/A',
          invoice?.project_master?.projectName || 'N/A',
          advName,
          stage
        ];
      }
    });

    let csvContent = [headers.join(","), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");
      
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8' });
    const encodedUri = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `advocate_draft_status_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getTableColumns = () => {
    if (role === 'admin') {
      return [
        { key: 'sentDate', label: 'Date Sent' },
        { key: 'invoiceNo', label: 'Draft No' },
        { key: 'agentName', label: 'Agent Name' },
        { key: 'projectName', label: 'Project Name' },
        { key: 'advocateName', label: 'Advocate Name' },
        { key: 'draftStatus', label: 'Current Stage' },
        { key: 'payoutStatus', label: 'Payout Status' }
      ];
    } else if (role === 'advocate') {
      return [
        { key: 'sentDate', label: 'Date Sent' },
        { key: 'invoiceNo', label: 'Draft No' },
        { key: 'agentName', label: 'Agent Name' },
        { key: 'projectName', label: 'Project Name' },
        { key: 'draftStatus', label: 'Current Stage' }
      ];
    } else {
      return [
        { key: 'sentDate', label: 'Date Sent' },
        { key: 'invoiceNo', label: 'Draft No' },
        { key: 'projectName', label: 'Project Name' },
        { key: 'advocateName', label: 'Advocate Name' },
        { key: 'draftStatus', label: 'Current Stage' }
      ];
    }
  };

  return (
    <DashboardLayout role={role}>
      <div className="absolute top-10 right-10 w-[400px] h-[400px] rounded-full bg-blue-500/5 blur-[100px] pointer-events-none" />

      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white">Advocate Draft Status</h2>
          <p className="text-slate-400 text-sm mt-1">
            {role === 'admin' 
              ? 'Global oversight of paid drafts, legal audit stages, and advocate payout ledger cuts.'
              : role === 'advocate'
                ? 'Track assigned legal drafts, current auditing verification stages, and payouts.'
                : 'Monitor the status of your prepared drafts currently pending advocate audit review.'
            }
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Dropdown Filters (Admin Only) */}
        {role === 'admin' && !loading && drafts.length > 0 && (
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl shadow-md grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-400 text-xs font-semibold mb-1" htmlFor="admin-project-filter">Project Name:</label>
              <select
                id="admin-project-filter"
                value={selectedProject}
                onChange={(e) => { setSelectedProject(e.target.value); setCurrentPage(1); }}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
              >
                <option value="">-- ALL PROJECTS --</option>
                {projectsList.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-slate-400 text-xs font-semibold mb-1" htmlFor="admin-agent-filter">Agent Name:</label>
              <select
                id="admin-agent-filter"
                value={selectedAgent}
                onChange={(e) => { setSelectedAgent(e.target.value); setCurrentPage(1); }}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
              >
                <option value="">-- ALL AGENTS --</option>
                {agentsList.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-slate-400 text-xs font-semibold mb-1" htmlFor="admin-advocate-filter">Advocate Name:</label>
              <select
                id="admin-advocate-filter"
                value={selectedAdvocate}
                onChange={(e) => { setSelectedAdvocate(e.target.value); setCurrentPage(1); }}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
              >
                <option value="">-- ALL ADVOCATES --</option>
                {advocatesList.map(adv => <option key={adv} value={adv}>{adv}</option>)}
              </select>
            </div>
          </div>
        )}

        <TableToolbar
          totalEntries={drafts.length}
          filteredEntriesCount={filteredDrafts.length}
          currentPage={currentPage}
          pageSize={pageSize}
          onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
          onPageChange={(page) => setCurrentPage(page)}
          searchValue={searchTerm}
          onSearchChange={(val) => { setSearchTerm(val); setCurrentPage(1); }}
          columns={getTableColumns()}
          visibleColumns={getTableColumns().map(c => c.key)}
          onVisibleColumnsChange={() => {}}
          onCopyData={copyTable}
          onExportExcel={exportCSV}
          onExportCSV={exportCSV}
        />

        {/* Data Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
                <Loader2 className="animate-spin text-blue-500" size={28} />
                <span>Loading advocate draft status...</span>
              </div>
            ) : filteredDrafts.length === 0 ? (
              <div className="py-20 text-center text-slate-500 text-sm">
                No drafts found matching the current filters.
              </div>
            ) : (
              <table className="w-full border-collapse text-left text-sm text-slate-300">
                <thead className="bg-slate-950 text-slate-400 text-xs uppercase font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-4 px-6 text-center w-12">#</th>
                    <th className="py-4 px-6">Date Sent</th>
                    <th className="py-4 px-6">Draft No</th>
                    {role !== 'agent' && <th className="py-4 px-6">Agent Name</th>}
                    <th className="py-4 px-6">Project Name</th>
                    {role !== 'advocate' && <th className="py-4 px-6">Advocate Name</th>}
                    <th className="py-4 px-6">Current Stage</th>
                    {role === 'admin' && (
                      <>
                        <th className="py-4 px-6">Payout Status</th>
                        <th className="py-4 px-6 text-right">Amount</th>
                        <th className="py-4 px-6">UTR</th>
                      </>
                    )}
                    <th className="py-4 px-6 text-center w-24">#</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {displayedDrafts.map((draft, idx) => {
                    const invoice = draft.invoice_master?.[0] || null;
                    const dateStr = draft.sentDate ? new Date(draft.sentDate).toLocaleDateString('en-IN') : 'N/A';
                    
                    const agentName = draft.user_master_olb_master_addedbyTouser_master
                      ? `${draft.user_master_olb_master_addedbyTouser_master.firstname} ${draft.user_master_olb_master_addedbyTouser_master.surname}`.trim()
                      : 'N/A';
                    const advocateName = invoice?.user_master_invoice_master_advocate_idTouser_master
                      ? `${invoice.user_master_invoice_master_advocate_idTouser_master.firstname} ${invoice.user_master_invoice_master_advocate_idTouser_master.surname}`.trim()
                      : 'N/A';

                    const isCompleted = draft.draftStatus === 4;
                    const isAcceptPending = invoice?.payment_status === 1 && draft.draftStatus === 3;
                    const isPayoutFailedOrNotInit = invoice && invoice.adv_payment_status !== 1;

                    return (
                      <tr key={draft.olbId} className="hover:bg-slate-950/40 transition-colors">
                        <td className="py-4 px-6 text-center font-medium text-slate-500">
                          {pageSize === -1 ? idx + 1 : (currentPage - 1) * pageSize + idx + 1}
                        </td>
                        <td className="py-4 px-6 text-white font-mono text-xs">
                          {dateStr}
                        </td>
                        <td className="py-4 px-6 text-white font-mono text-xs font-semibold">
                          {invoice?.inv_no || 'N/A'}
                        </td>
                        {role !== 'agent' && (
                          <td className="py-4 px-6 text-slate-300 text-xs">
                            {agentName}
                          </td>
                        )}
                        <td className="py-4 px-6 text-slate-350 font-semibold text-xs">
                          {invoice?.project_master?.projectName || 'N/A'}
                        </td>
                        {role !== 'advocate' && (
                          <td className="py-4 px-6 text-slate-300 text-xs">
                            {advocateName}
                          </td>
                        )}
                        <td className="py-4 px-6">
                          {getStageLabelAndBadge(draft)}
                        </td>
                        {role === 'admin' && (
                          <>
                            <td className="py-4 px-6">
                              {getPayoutStatusBadge(invoice)}
                            </td>
                            <td className="py-4 px-6 text-right font-mono text-xs text-blue-400 font-bold">
                              {invoice?.adv_amount ? `₹${invoice.adv_amount.toFixed(2)}` : '—'}
                            </td>
                            <td className="py-4 px-6 font-mono text-xs text-slate-400">
                              {invoice?.adv_transaction_id || '—'}
                            </td>
                          </>
                        )}
                        <td className="py-4 px-6">
                          <div className="flex items-center justify-center gap-2">
                            {/* Action: View/Print Details */}
                            {role === 'agent' ? (
                              <button
                                onClick={() => router.push(`/view_draft_detail?oid=${draft.olbId}`)}
                                disabled={!isCompleted}
                                title={isCompleted ? "View/Print Draft" : "Draft not yet approved by advocate"}
                                className={`p-1.5 rounded transition-colors ${
                                  isCompleted 
                                    ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white cursor-pointer' 
                                    : 'bg-slate-850 text-slate-650 opacity-40 cursor-not-allowed'
                                }`}
                              >
                                <Printer size={13} />
                              </button>
                            ) : (
                              <button
                                onClick={() => router.push(`/view_draft_detail?oid=${draft.olbId}`)}
                                title="View/Print Draft"
                                className="p-1.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white cursor-pointer transition-colors"
                              >
                                <Printer size={13} />
                              </button>
                            )}

                            {/* Action: Advocate Audit shortcut */}
                            {role === 'advocate' && (
                              <button
                                onClick={() => router.push(`/add_agreement_draft?oid=${draft.olbId}`)}
                                disabled={!isAcceptPending}
                                title={isAcceptPending ? "Audit & Complete Draft" : "Not awaiting acceptance"}
                                className={`p-1.5 rounded transition-colors ${
                                  isAcceptPending
                                    ? 'bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white cursor-pointer'
                                    : 'bg-slate-850 text-slate-650 opacity-40 cursor-not-allowed'
                                }`}
                              >
                                <Eye size={13} />
                              </button>
                            )}

                            {/* Action: Admin quick chat & manual register payout */}
                            {role === 'admin' && (
                              <>
                                {/* Quick Chat */}
                                {invoice?.advocate_id && (
                                  <button
                                    onClick={() => router.push(`/message?uid=${invoice.advocate_id}`)}
                                    title={`Chat with Advocate ${advocateName}`}
                                    className="p-1.5 rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white cursor-pointer transition-colors"
                                  >
                                    <MessageSquare size={13} />
                                  </button>
                                )}
                                {/* Register Payout */}
                                {isPayoutFailedOrNotInit && invoice && (
                                  <button
                                    onClick={() => router.push(`/pay_advocate?iid=${invoice.invoice_id}`)}
                                    title="Register Manual Payout"
                                    className="p-1.5 rounded bg-purple-500/10 text-purple-400 hover:bg-purple-500 hover:text-white cursor-pointer transition-colors"
                                  >
                                    <CreditCard size={13} />
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          <TableFooter
            filteredEntriesCount={filteredDrafts.length}
            totalEntries={drafts.length}
            currentPage={currentPage}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
