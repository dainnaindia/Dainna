"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import TableToolbar, { TableFooter } from '@/components/TableToolbar';
import { Hourglass, Loader2, AlertCircle, Eye } from 'lucide-react';

interface OlbItem {
  olb_item_id: number;
  survey_no_new: string | null;
  survey_no_old: string | null;
}

interface Invoice {
  invoice_id: number;
  inv_no: string | null;
  addeddate: string | null;
  payment_status: number | null;
  adv_payment_status: number | null;
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
  sentDate: string;
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
  olb_item_master?: OlbItem[];
  invoice_master?: Invoice[];
}

interface Project {
  projectId: number;
  projectName: string;
  city: string;
}

const COLUMNS = [
  { key: 'invoiceNo', label: 'Invoice No' },
  { key: 'date', label: 'Date' },
  { key: 'time', label: 'Time' },
  { key: 'category', label: 'Category' },
  { key: 'customerName', label: 'Customer Name' },
  { key: 'customerNo', label: 'Customer No' },
  { key: 'ownerName', label: 'Owner Name' },
  { key: 'propertyAddress', label: 'Property Address' },
  { key: 'preparedDate', label: 'Prepared Date' },
  { key: 'sentDate', label: 'Sent Date' },
  { key: 'paymentStatus', label: 'Payment Status' },
  { key: 'status', label: 'Status' }
];

export default function ViewAllSentDraftPage() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState<any | null>(null);

  // DataTables toolbar & pagination states
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleColumns, setVisibleColumns] = useState<string[]>(COLUMNS.map(c => c.key));
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchSessionAndProjects = async () => {
    try {
      // 1. Fetch current profile to get workingCity
      const profileRes = await fetch('http://localhost:5000/api/users/profile', { credentials: 'include' });
      const profileData = await profileRes.json();
      if (profileRes.ok && profileData.User) {
        setCurrentUser(profileData.User);
        const city = profileData.User.workingCity || '';
        
        // 2. Fetch projects in agent's workingCity
        const projectsRes = await fetch(`http://localhost:5000/api/projects?City=${city}`, { credentials: 'include' });
        const projectsData = await projectsRes.json();
        if (projectsRes.ok) {
          setProjects(projectsData.Projects || []);
        }
      }
    } catch (err) {
      console.error('Error fetching session or projects:', err);
    }
  };

  const fetchDrafts = async (projectId = '') => {
    setLoading(true);
    setError('');
    try {
      const url = `http://localhost:5000/api/drafts/list?status=3${projectId ? `&projectId=${projectId}` : ''}`;
      const response = await fetch(url, { credentials: 'include' });
      const data = await response.json();
      if (response.ok) {
        setDrafts(data.Drafts || []);
      } else {
        setError(data.Msg || 'Failed to retrieve sent drafts.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection to server failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessionAndProjects();
  }, []);

  useEffect(() => {
    fetchDrafts(selectedProjectId);
    setCurrentPage(1);
  }, [selectedProjectId]);

  // Format Helper: Property Address (Area text formatting matching legacy PHP)
  const formatPropertyAddress = (d: Draft) => {
    let areaText = '';
    if (d.area === 1) {
      areaText = `Urban / City Survey Office : ${d.citySurveyOffice || ''} / Ward : ${d.ward || ''} / Survey No : ${d.citySurveyNo || ''} / Sheet No : ${d.sheetNo || ''}`;
    } else if (d.area === 2) {
      areaText = `Rural / Taluka : ${d.taluka || ''} / Village : ${d.village || ''} / Survey No : ${d.citySurveyNo || ''}`;
    } else if (d.area === 3) {
      areaText = `Sector Wise / Taluka : ${d.taluka || ''} / Village : ${d.village || ''} / Sector No : ${d.sectorNo || ''} / Sector Plot No : ${d.sectorPlotNo || ''}`;
    }
    const stateName = d.state_master?.state_name || '';
    return `${d.district || ''} ${stateName} ${areaText}`.trim();
  };

  // Format Helper: Payment Status
  const getPaymentStatusBadge = (invoice: Invoice | null) => {
    if (!invoice) return <span className="text-amber-500 font-semibold">Pending</span>;
    const status = invoice.payment_status;
    if (status === 0) return <span className="text-amber-500 font-semibold">Pending</span>;
    if (status === 1) return <span className="text-emerald-500 font-semibold">Success</span>;
    if (status === 2) return <span className="text-red-500 font-semibold">Failed</span>;
    if (status === 4) return <span className="text-blue-500 font-semibold">Sent</span>;
    return <span className="text-slate-500">—</span>;
  };

  const getPaymentStatusText = (invoice: Invoice | null) => {
    if (!invoice) return 'Pending';
    const status = invoice.payment_status;
    if (status === 0) return 'Pending';
    if (status === 1) return 'Success';
    if (status === 2) return 'Failed';
    if (status === 4) return 'Sent';
    return '—';
  };

  const filteredDrafts = drafts.filter(d => {
    const ownerFull = `${d.ownerFirstName} ${d.ownerLastName}`.toLowerCase();
    const purchaserFull = `${d.purchaserFirstName} ${d.purchaserLastName}`.toLowerCase();
    const address = formatPropertyAddress(d).toLowerCase();
    const categoryText = d.customizeReadymade === 1 ? 'customize' : 'readymade';
    const invNo = (d.invoice_master?.[0]?.inv_no || '').toLowerCase();
    
    const fullSearch = `${invNo} ${ownerFull} ${purchaserFull} ${d.purchaserMobileNo} ${address} ${categoryText} ${d.language}`.toLowerCase();
    return fullSearch.includes(searchTerm.toLowerCase());
  });

  const displayedDrafts = pageSize === -1
    ? filteredDrafts
    : filteredDrafts.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const copyTable = () => {
    const text = filteredDrafts.map((d, idx) => {
      const invoice = d.invoice_master?.[0] || null;
      const date = invoice?.addeddate ? new Date(invoice.addeddate).toLocaleDateString('en-IN') : 'N/A';
      const time = invoice?.addeddate ? new Date(invoice.addeddate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : 'N/A';
      const category = d.customizeReadymade === 1 ? 'Customize' : 'Readymade';
      const prepDateStr = d.preparedDate ? new Date(d.preparedDate).toLocaleDateString('en-IN') : 'N/A';
      const sentDateStr = d.sentDate ? new Date(d.sentDate).toLocaleDateString('en-IN') : 'N/A';
      const pStatus = getPaymentStatusText(invoice);
      const dStatus = 'Waiting for Advocate';
      
      return `${idx + 1}\t${invoice?.inv_no || 'N/A'}\t${date}\t${time}\t${category}\t${d.purchaserFirstName} ${d.purchaserLastName}\t${d.purchaserMobileNo}\t${d.ownerFirstName} ${d.ownerLastName}\t${formatPropertyAddress(d)}\t${prepDateStr}\t${sentDateStr}\t${pStatus}\t${dStatus}`;
    }).join('\n');
    navigator.clipboard.writeText(text);
    alert('Table copied to clipboard!');
  };

  const exportCSV = () => {
    const headers = ["#", "Invoice No", "Date", "Time", "Category", "Customer Name", "Customer No", "Owner Name", "Property Address", "Prepared Date", "Sent Date", "Payment Status", "Status"];
    const rows = filteredDrafts.map((d, idx) => {
      const invoice = d.invoice_master?.[0] || null;
      const date = invoice?.addeddate ? new Date(invoice.addeddate).toLocaleDateString('en-IN') : 'N/A';
      const time = invoice?.addeddate ? new Date(invoice.addeddate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : 'N/A';
      const category = d.customizeReadymade === 1 ? 'Customize' : 'Readymade';
      const prepDateStr = d.preparedDate ? new Date(d.preparedDate).toLocaleDateString('en-IN') : 'N/A';
      const sentDateStr = d.sentDate ? new Date(d.sentDate).toLocaleDateString('en-IN') : 'N/A';
      const pStatus = getPaymentStatusText(invoice);
      const dStatus = 'Waiting for Advocate';
      
      return [
        idx + 1,
        invoice?.inv_no || 'N/A',
        date,
        time,
        category,
        `${d.purchaserFirstName || ''} ${d.purchaserLastName || ''}`.trim(),
        d.purchaserMobileNo || '',
        `${d.ownerFirstName || ''} ${d.ownerLastName || ''}`.trim(),
        formatPropertyAddress(d),
        prepDateStr,
        sentDateStr,
        pStatus,
        dStatus
      ];
    });

    let csvContent = [headers.join(","), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");
      
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8' });
    const encodedUri = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sent_drafts_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <DashboardLayout role="agent">
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          aside, header, button, .no-print, input, select, .select-none {
            display: none !important;
          }
          main, .flex-1, .space-y-6 {
            padding: 0 !important;
            margin: 0 !important;
            background-color: transparent !important;
          }
        }
      `}} />

      <div className="absolute top-10 right-10 w-[400px] h-[400px] rounded-full bg-blue-500/5 blur-[100px] pointer-events-none" />

      <div className="space-y-6">
        <div className="flex justify-between items-center no-print">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white">Sent Drafts</h2>
            <p className="text-slate-400 text-sm mt-1">Contracts currently sent to legal advocates for audit and verification</p>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3 no-print">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Project Name Filter (Legacy Style) */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl shadow-md no-print flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="w-full sm:w-64">
            <label className="block text-slate-400 text-xs font-semibold mb-1" htmlFor="project-filter">Project Name:</label>
            <select
              id="project-filter"
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
            >
              <option value="">-- SELECT PROJECT --</option>
              {projects.map((p) => (
                <option key={p.projectId} value={p.projectId}>
                  {p.projectName}
                </option>
              ))}
            </select>
          </div>
        </div>

        <TableToolbar
          totalEntries={drafts.length}
          filteredEntriesCount={filteredDrafts.length}
          currentPage={currentPage}
          pageSize={pageSize}
          onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
          onPageChange={(page) => setCurrentPage(page)}
          searchValue={searchTerm}
          onSearchChange={(val) => { setSearchTerm(val); setCurrentPage(1); }}
          columns={COLUMNS}
          visibleColumns={visibleColumns}
          onVisibleColumnsChange={setVisibleColumns}
          onCopyData={copyTable}
          onExportExcel={exportCSV}
          onExportCSV={exportCSV}
        />

        {/* Table list */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
                <Loader2 className="animate-spin text-blue-500" size={28} />
                <span>Loading sent drafts...</span>
              </div>
            ) : filteredDrafts.length === 0 ? (
              <div className="py-20 text-center text-slate-500 text-sm">
                No sent drafts found.
              </div>
            ) : (
              <table className="w-full border-collapse text-left text-sm text-slate-350">
                <thead className="bg-slate-950 text-slate-400 text-xs uppercase font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-4 px-6 text-center w-12">#</th>
                    {visibleColumns.includes('invoiceNo') && <th className="py-4 px-6">Invoice No</th>}
                    {visibleColumns.includes('date') && <th className="py-4 px-6">Date</th>}
                    {visibleColumns.includes('time') && <th className="py-4 px-6">Time</th>}
                    {visibleColumns.includes('category') && <th className="py-4 px-6">Category</th>}
                    {visibleColumns.includes('customerName') && <th className="py-4 px-6">Customer Name</th>}
                    {visibleColumns.includes('customerNo') && <th className="py-4 px-6">Customer No</th>}
                    {visibleColumns.includes('ownerName') && <th className="py-4 px-6">Owner Name</th>}
                    {visibleColumns.includes('propertyAddress') && <th className="py-4 px-6">Property Address</th>}
                    {visibleColumns.includes('preparedDate') && <th className="py-4 px-6">Prepared Date</th>}
                    {visibleColumns.includes('sentDate') && <th className="py-4 px-6">Sent Date</th>}
                    {visibleColumns.includes('paymentStatus') && <th className="py-4 px-6">Payment Status</th>}
                    {visibleColumns.includes('status') && <th className="py-4 px-6 text-center">Status</th>}
                    <th className="py-4 px-6 text-center w-16 no-print">#</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {displayedDrafts.map((draft, idx) => {
                    const invoice = draft.invoice_master?.[0] || null;
                    const date = invoice?.addeddate ? new Date(invoice.addeddate).toLocaleDateString('en-IN') : 'N/A';
                    const time = invoice?.addeddate ? new Date(invoice.addeddate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : 'N/A';
                    const category = draft.customizeReadymade === 1 ? 'Customize' : 'Readymade';
                    const prepDateStr = draft.preparedDate ? new Date(draft.preparedDate).toLocaleDateString('en-IN') : 'N/A';
                    const sentDateStr = draft.sentDate ? new Date(draft.sentDate).toLocaleDateString('en-IN') : 'N/A';

                    return (
                      <tr key={draft.olbId} className="hover:bg-slate-950/40 transition-colors">
                        <td className="py-4 px-6 text-center font-medium text-slate-500">
                          {pageSize === -1 ? idx + 1 : (currentPage - 1) * pageSize + idx + 1}
                        </td>
                        {visibleColumns.includes('invoiceNo') && (
                          <td className="py-4 px-6 text-white font-mono text-xs font-semibold">
                            {invoice?.inv_no || 'N/A'}
                          </td>
                        )}
                        {visibleColumns.includes('date') && (
                          <td className="py-4 px-6 font-mono text-xs text-slate-300">
                            {date}
                          </td>
                        )}
                        {visibleColumns.includes('time') && (
                          <td className="py-4 px-6 font-mono text-xs text-slate-400">
                            {time}
                          </td>
                        )}
                        {visibleColumns.includes('category') && (
                          <td className="py-4 px-6">
                            <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              draft.customizeReadymade === 1 
                                ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' 
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}>
                              {category}
                            </span>
                          </td>
                        )}
                        {visibleColumns.includes('customerName') && (
                          <td className="py-4 px-6 text-white font-medium">
                            {`${draft.purchaserFirstName} ${draft.purchaserLastName}`}
                          </td>
                        )}
                        {visibleColumns.includes('customerNo') && (
                          <td className="py-4 px-6 font-mono text-xs text-slate-400">
                            {draft.purchaserMobileNo || '—'}
                          </td>
                        )}
                        {visibleColumns.includes('ownerName') && (
                          <td className="py-4 px-6 text-slate-300 text-xs">
                            {`${draft.ownerFirstName} ${draft.ownerLastName}`}
                          </td>
                        )}
                        {visibleColumns.includes('propertyAddress') && (
                          <td className="py-4 px-6 text-slate-400 text-xs" dangerouslySetInnerHTML={{ __html: formatPropertyAddress(draft) }} />
                        )}
                        {visibleColumns.includes('preparedDate') && (
                          <td className="py-4 px-6 font-mono text-xs text-slate-400">
                            {prepDateStr}
                          </td>
                        )}
                        {visibleColumns.includes('sentDate') && (
                          <td className="py-4 px-6 font-mono text-xs text-slate-300 font-semibold">
                            {sentDateStr}
                          </td>
                        )}
                        {visibleColumns.includes('paymentStatus') && (
                          <td className="py-4 px-6 font-mono text-xs">
                            {getPaymentStatusBadge(invoice)}
                          </td>
                        )}
                        {visibleColumns.includes('status') && (
                          <td className="py-4 px-6 text-center">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              <Hourglass size={12} />
                              <span>Waiting for Advocate</span>
                            </span>
                          </td>
                        )}
                        <td className="py-4 px-6 text-center no-print">
                          <Link href={`/pay_agent?oid=${draft.olbId}`} className="text-blue-450 hover:text-blue-300 transition-colors inline-block" title="View Details">
                            <Eye size={16} />
                          </Link>
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
