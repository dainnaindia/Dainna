"use client";

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import TableToolbar, { TableFooter } from '@/components/TableToolbar';
import { Loader2, AlertCircle, ClipboardList } from 'lucide-react';

interface AgentOption {
  userId: number;
  firstname: string;
  surname: string;
}

interface ProjectOption {
  projectId: number;
  projectName: string;
  city: string;
}

interface SummaryInvoice {
  invoiceId: number;
  projectName: string;
  projectCity: string;
  invNo: string;
  invoiceDate: string;
  size: number;
  fromAgent: number;
  handlingChargeAmount: number;
  advocateName: string;
  toAdvocate: number;
}

const COLUMNS = [
  { key: 'draftDetail', label: 'Draft Detail (InvNo | Date | Size)' },
  { key: 'projectDetails', label: 'Project Details' },
  { key: 'fromAgent', label: 'From Agent (₹)' },
  { key: 'handlingChargeAmount', label: 'Handling Charge (₹)' },
  { key: 'advocateName', label: 'Advocate Name' },
  { key: 'toAdvocate', label: 'To Advocate (₹)' }
];

export default function AgentWiseSummaryPage() {
  const [agents, setAgents] = useState<AgentOption[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  
  const [invoices, setInvoices] = useState<SummaryInvoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  // DataTables Toolbar & Pagination States
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleColumns, setVisibleColumns] = useState<string[]>(COLUMNS.map(c => c.key));
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    // Load agents and projects
    fetch('http://localhost:5000/api/users/agents', { credentials: 'include' })
      .then(res => res.json())
      .then(data => setAgents(data.Agents || []))
      .catch(err => console.error('Error fetching agents:', err));

    fetch('http://localhost:5000/api/projects', { credentials: 'include' })
      .then(res => res.json())
      .then(data => setProjects(data.Projects || []))
      .catch(err => console.error('Error fetching projects:', err));
  }, []);

  const fetchSummary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgentId) return;

    setLoading(true);
    setError('');
    setHasSearched(true);
    setCurrentPage(1);

    try {
      let url = `http://localhost:5000/api/reports/agent-summary?AgentID=${selectedAgentId}`;
      if (selectedProjectId) {
        url += `&ProjectID=${selectedProjectId}`;
      }

      const response = await fetch(url, { credentials: 'include' });
      const data = await response.json();
      if (response.ok) {
        setInvoices(data.Invoices || []);
      } else {
        setError(data.Error || 'Failed to retrieve agent summary report.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection to server failed. Verify backend is running.');
    } finally {
      setLoading(false);
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

  const filteredInvoices = invoices.filter(inv => {
    const full = `${inv.invNo} ${inv.projectName} ${inv.projectCity} ${inv.advocateName}`.toLowerCase();
    return full.includes(searchTerm.toLowerCase());
  });

  const getTotals = () => {
    let fromAgent = 0;
    let handlingChargeAmount = 0;
    let toAdvocate = 0;
    filteredInvoices.forEach(inv => {
      fromAgent += inv.fromAgent || 0;
      handlingChargeAmount += inv.handlingChargeAmount || 0;
      toAdvocate += inv.toAdvocate || 0;
    });
    return { fromAgent, handlingChargeAmount, toAdvocate };
  };

  const totals = getTotals();

  const displayedInvoices = pageSize === -1 
    ? filteredInvoices 
    : filteredInvoices.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const copyTable = () => {
    const text = filteredInvoices.map((inv, idx) => 
      `${idx + 1}\t${inv.invNo || 'N/A'} | ${formatDate(inv.invoiceDate)} | ${inv.size || 0}\t${inv.projectName} - ${inv.projectCity}\t${inv.fromAgent}\t${inv.handlingChargeAmount}\t${inv.advocateName}\t${inv.toAdvocate}`
    ).join('\n');
    navigator.clipboard.writeText(text);
    alert('Table copied to clipboard!');
  };

  const exportToCSV = () => {
    const selectedAgt = agents.find(a => a.userId === parseInt(selectedAgentId));
    const agtName = selectedAgt ? `${selectedAgt.firstname} ${selectedAgt.surname}` : 'N/A';

    const headers = [
      '#',
      'Draft Detail (InvNo | Date | Size)',
      'Project Details',
      'From Agent',
      'Handling Charge',
      'Advocate Name',
      'To Advocate'
    ];

    const rows = filteredInvoices.map((inv, idx) => [
      idx + 1,
      `${inv.invNo || 'N/A'} | ${formatDate(inv.invoiceDate)} | ${inv.size || 0}`,
      `${inv.projectName} - ${inv.projectCity}`,
      inv.fromAgent || 0,
      inv.handlingChargeAmount || 0,
      inv.advocateName,
      inv.toAdvocate || 0
    ]);

    rows.push([
      '',
      'Total',
      '',
      totals.fromAgent,
      totals.handlingChargeAmount,
      '',
      totals.toAdvocate
    ]);

    const csvContent = [
        `"Agent Wise Summary of ${agtName}"`,
        `"Report Generated On: ${new Date().toLocaleDateString('en-GB')}"`,
        '',
        headers.join(','), 
        ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
      ].join('\n');
    
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8' });
    const encodedUri = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `agent_summary_${selectedAgentId}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(encodedUri);
  };

  const selectedAgentObj = agents.find(a => a.userId === parseInt(selectedAgentId));

  return (
    <DashboardLayout role="admin">
      <div className="absolute top-10 right-10 w-[400px] h-[400px] rounded-full bg-blue-500/5 blur-[100px] pointer-events-none print:hidden" />
      
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          .no-print, aside, header, button, input, select {
            display: none !important;
          }
          table {
            border-collapse: collapse !important;
            width: 100% !important;
            color: black !important;
          }
          th, td {
            border: 1px solid #ddd !important;
            padding: 8px !important;
            color: black !important;
            font-size: 10px !important;
          }
          th {
            background-color: #f2f2f2 !important;
          }
          main, .flex-1, .space-y-6 {
            margin: 0 !important;
            padding: 0 !important;
            background-color: transparent !important;
          }
        }
      `}} />

      <div className="space-y-6">
        <div className="flex justify-between items-center print:hidden">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <ClipboardList className="text-blue-500" size={32} />
              Agent Wise Summary
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Select agent and analyze collections, advocate fees, and commissions.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3 print:hidden">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Filter Form */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl shadow-md print:hidden">
          <form onSubmit={fetchSummary} className="flex flex-col sm:flex-row items-end gap-4">
            <div className="w-full sm:w-1/3">
              <label className="block text-slate-300 text-xs font-semibold mb-1" htmlFor="agent">Agent Name</label>
              <select
                id="agent"
                value={selectedAgentId}
                onChange={(e) => setSelectedAgentId(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="">-- SELECT --</option>
                {agents.map(a => (
                  <option key={a.userId} value={a.userId}>
                    {a.firstname} {a.surname}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-full sm:w-1/3">
              <label className="block text-slate-300 text-xs font-semibold mb-1" htmlFor="project">Project Name</label>
              <select
                id="project"
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="">ALL PROJECTS</option>
                {projects.map(p => (
                  <option key={p.projectId} value={p.projectId}>
                    {p.projectName} - {p.city}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg text-sm transition-all flex items-center gap-2 cursor-pointer shadow-md w-full sm:w-auto justify-center"
            >
              <span>Search Summary</span>
            </button>
          </form>
        </div>

        {hasSearched && (
          <div className="space-y-6">
            {/* Header Title for Print */}
            <div className="hidden print:block text-center border-b border-black pb-4 mb-6">
              <h2 className="text-xl font-bold text-black">
                Agent Wise Summary of {selectedAgentObj?.firstname} {selectedAgentObj?.surname}
              </h2>
              <p className="text-xs text-black mt-1">Generated on: {new Date().toLocaleDateString('en-GB')}</p>
            </div>

            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400 print:hidden">
                <Loader2 className="animate-spin text-blue-500" size={28} />
                <span>Compiling summary...</span>
              </div>
            ) : invoices.length === 0 ? (
              <div className="py-20 text-center text-slate-500 text-sm print:text-black">
                No summary records found for this agent.
              </div>
            ) : (
              <>
                {/* Aggregated Totals Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 print:grid-cols-3">
                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl print:border-black print:bg-white">
                    <span className="block text-slate-500 text-[10px] uppercase font-bold tracking-wider print:text-black">From Agent</span>
                    <span className="text-2xl font-extrabold text-white mt-1 block print:text-black">₹{totals.fromAgent.toFixed(2)}</span>
                  </div>
                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl print:border-black print:bg-white">
                    <span className="block text-slate-500 text-[10px] uppercase font-bold tracking-wider print:text-black">Handling Charges</span>
                    <span className="text-2xl font-extrabold text-emerald-400 mt-1 block print:text-black">₹{totals.handlingChargeAmount.toFixed(2)}</span>
                  </div>
                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl print:border-black print:bg-white">
                    <span className="block text-slate-500 text-[10px] uppercase font-bold tracking-wider print:text-black">To Advocate</span>
                    <span className="text-2xl font-extrabold text-blue-400 mt-1 block print:text-black">₹{totals.toAdvocate.toFixed(2)}</span>
                  </div>
                </div>

                {/* Table Toolbar */}
                <TableToolbar
                  totalEntries={invoices.length}
                  filteredEntriesCount={filteredInvoices.length}
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
                  onExportExcel={exportToCSV}
                  onExportCSV={exportToCSV}
                />

                {/* Detailed Table */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg overflow-hidden print:border-0 print:shadow-none print:bg-white">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-sm text-slate-300 print:text-black">
                      <thead className="bg-slate-950 text-slate-400 text-xs uppercase font-semibold border-b border-slate-800 print:bg-slate-100 print:text-black print:border-black">
                        <tr>
                          <th className="py-4 px-4 text-center w-12">#</th>
                          {visibleColumns.includes('draftDetail') && <th className="py-4 px-4">Draft Detail (InvNo | Date | Size)</th>}
                          {visibleColumns.includes('projectDetails') && <th className="py-4 px-4">Project Details</th>}
                          {visibleColumns.includes('fromAgent') && <th className="py-4 px-4 text-right">From Agent (₹)</th>}
                          {visibleColumns.includes('handlingChargeAmount') && <th className="py-4 px-4 text-right">Handling Charge (₹)</th>}
                          {visibleColumns.includes('advocateName') && <th className="py-4 px-4">Advocate Name</th>}
                          {visibleColumns.includes('toAdvocate') && <th className="py-4 px-4 text-right">To Advocate (₹)</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 print:divide-black">
                        {displayedInvoices.map((inv, idx) => (
                          <tr key={inv.invoiceId} className="hover:bg-slate-950/40 transition-colors print:hover:bg-transparent">
                            <td className="py-3 px-4 text-center font-medium text-slate-500 print:text-black">
                              {pageSize === -1 ? idx + 1 : (currentPage - 1) * pageSize + idx + 1}
                            </td>
                            {visibleColumns.includes('draftDetail') && (
                              <td className="py-3 px-4 font-semibold text-white print:text-black">
                                {`${inv.invNo || 'N/A'} | ${formatDate(inv.invoiceDate)} | ${inv.size || 0}`}
                              </td>
                            )}
                            {visibleColumns.includes('projectDetails') && (
                              <td className="py-3 px-4">{inv.projectName} - {inv.projectCity}</td>
                            )}
                            {visibleColumns.includes('fromAgent') && (
                              <td className="py-3 px-4 text-right font-medium">₹{inv.fromAgent.toFixed(2)}</td>
                            )}
                            {visibleColumns.includes('handlingChargeAmount') && (
                              <td className="py-3 px-4 text-right text-emerald-400 font-semibold">₹{inv.handlingChargeAmount.toFixed(2)}</td>
                            )}
                            {visibleColumns.includes('advocateName') && (
                              <td className="py-3 px-4">{inv.advocateName}</td>
                            )}
                            {visibleColumns.includes('toAdvocate') && (
                              <td className="py-3 px-4 text-right font-medium text-blue-400">₹{inv.toAdvocate.toFixed(2)}</td>
                            )}
                          </tr>
                        ))}

                        {/* Summary Total Row */}
                        <tr className="bg-slate-950/50 font-bold border-t border-slate-800 text-white print:bg-slate-50 print:text-black print:border-black">
                          <td className="py-4 px-4"></td>
                          {visibleColumns.includes('draftDetail') && <td className="py-4 px-4"></td>}
                          {visibleColumns.includes('projectDetails') && <td className="py-4 px-4 text-right">Total</td>}
                          {visibleColumns.includes('fromAgent') && <td className="py-4 px-4 text-right font-bold">₹{totals.fromAgent.toFixed(2)}</td>}
                          {visibleColumns.includes('handlingChargeAmount') && (
                            <td className="py-4 px-4 text-right text-emerald-450 font-bold">₹{totals.handlingChargeAmount.toFixed(2)}</td>
                          )}
                          {visibleColumns.includes('advocateName') && <td className="py-4 px-4"></td>}
                          {visibleColumns.includes('toAdvocate') && (
                            <td className="py-4 px-4 text-right font-bold text-blue-400">₹{totals.toAdvocate.toFixed(2)}</td>
                          )}
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Reusable DataTables Entry Counts & Pagination Footer */}
                  <TableFooter
                    filteredEntriesCount={filteredInvoices.length}
                    totalEntries={invoices.length}
                    currentPage={currentPage}
                    pageSize={pageSize}
                    onPageChange={setCurrentPage}
                  />
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
