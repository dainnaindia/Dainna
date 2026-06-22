"use client";

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Loader2, AlertCircle, FileSpreadsheet, Printer, Search, ClipboardList } from 'lucide-react';

interface ProjectOption {
  projectId: number;
  projectName: string;
  city: string;
  state_master?: {
    state_name: string;
  };
}

interface SummaryInvoice {
  invoiceId: number;
  invNo: string;
  invoiceDate: string;
  size: number;
  agentName: string;
  fromAgent: number;
  handlingChargeAmount: number;
  advocateName: string;
  toAdvocate: number;
  draftStatus: number;
}

export default function ProjectWiseSummaryPage() {
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  
  const [invoices, setInvoices] = useState<SummaryInvoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  // Totals
  const [totals, setTotals] = useState({
    received: 0,
    given: 0,
    profit: 0,
    pending: 0
  });

  useEffect(() => {
    // Load projects list
    fetch('http://localhost:5000/api/projects')
      .then(res => res.json())
      .then(data => setProjects(data.Projects || []))
      .catch(err => console.error('Error fetching projects:', err));
  }, []);

  const fetchSummary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) return;

    setLoading(true);
    setError('');
    setHasSearched(true);
    try {
      const response = await fetch(`http://localhost:5000/api/reports/project-summary?ProjectID=${selectedProjectId}`);
      const data = await response.json();
      if (response.ok) {
        const list: SummaryInvoice[] = data.Invoices || [];
        setInvoices(list);

        // Calculate totals
        let received = 0;
        let given = 0;
        let profit = 0;
        list.forEach(inv => {
          received += inv.fromAgent || 0;
          given += inv.toAdvocate || 0;
          profit += inv.handlingChargeAmount || 0;
        });
        const pending = received - given - profit;
        setTotals({ received, given, profit, pending });
      } else {
        setError(data.Error || 'Failed to retrieve project summary report.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection to server failed. Verify backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const getDraftStatusText = (status: number) => {
    switch (status) {
      case 1:
        return <span className="text-red-400">Prepared Draft</span>;
      case 2:
        return <span className="text-indigo-400">Waiting for Advocate</span>;
      case 3:
        return <span className="text-amber-400">Received to Advocate</span>;
      case 4:
        return <span className="text-emerald-400">Complete Draft</span>;
      default:
        return <span className="text-slate-400">N/A</span>;
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

  const exportToCSV = () => {
    const selectedProj = projects.find(p => p.projectId === parseInt(selectedProjectId));
    const projName = selectedProj ? `${selectedProj.projectName} - ${selectedProj.city}` : 'N/A';

    const headers = [
      '#',
      'Draft Detail (InvNo | Date | Size)',
      'Agent Name',
      'From Agent',
      'Handling Charge',
      'Advocate Name',
      'To Advocate',
      'Draft Status'
    ];

    const rows = invoices.map((inv, idx) => [
      idx + 1,
      `${inv.invNo || 'N/A'} | ${formatDate(inv.invoiceDate)} | ${inv.size || 0}`,
      inv.agentName,
      inv.fromAgent || 0,
      inv.handlingChargeAmount || 0,
      inv.advocateName,
      inv.toAdvocate || 0,
      inv.draftStatus === 4 ? 'Complete Draft' : 'Prepared/Pending'
    ]);

    // Append totals row
    rows.push([
      '',
      'Total',
      '',
      totals.received,
      totals.profit,
      '',
      totals.given,
      ''
    ]);

    const csvContent = [
        `"Project Wise Summary of ${projName}"`,
        `"Report Generated On: ${new Date().toLocaleDateString('en-GB')}"`,
        `"Received,Given,Profit,Pending"`,
        `"${totals.received},${totals.given},${totals.profit},${totals.pending}"`,
        '',
        headers.join(','), 
        ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
      ].join('\n');
    
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8' });
    const encodedUri = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `project_summary_${selectedProjectId}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const selectedProjObj = projects.find(p => p.projectId === parseInt(selectedProjectId));

  return (
    <DashboardLayout role="admin">
      <div className="absolute top-10 right-10 w-[400px] h-[400px] rounded-full bg-blue-500/5 blur-[100px] pointer-events-none print:hidden" />
      
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          .print\\:hidden {
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
          .main-content {
            margin: 0 !important;
            padding: 0 !important;
          }
        }
      `}</style>

      <div className="space-y-6">
        <div className="flex justify-between items-center print:hidden">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <ClipboardList className="text-blue-500" size={32} />
              Project Wise Summary
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Select township project and analyze collections, advocate fees, and project earnings.
            </p>
          </div>
          {hasSearched && invoices.length > 0 && (
            <div className="flex gap-3">
              <button
                onClick={exportToCSV}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-sm transition-all flex items-center gap-2 border border-slate-700 cursor-pointer"
              >
                <FileSpreadsheet size={16} />
                <span>Export Excel</span>
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-sm transition-all flex items-center gap-2 border border-slate-700 cursor-pointer"
              >
                <Printer size={16} />
                <span>Print Summary</span>
              </button>
            </div>
          )}
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
            <div className="w-full sm:w-96">
              <label className="block text-slate-300 text-xs font-semibold mb-1" htmlFor="project">Project Name</label>
              <select
                id="project"
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="">-- SELECT --</option>
                {projects.map(p => (
                  <option key={p.projectId} value={p.projectId}>
                    {p.projectName} - {p.city} - {p.state_master?.state_name || ''}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg text-sm transition-all flex items-center gap-2 cursor-pointer shadow-md w-full sm:w-auto justify-center"
            >
              <Search size={16} />
              <span>Analyze Project</span>
            </button>
          </form>
        </div>

        {hasSearched && (
          <div className="space-y-6">
            {/* Header Title for Print */}
            <div className="hidden print:block text-center border-b border-black pb-4 mb-6">
              <h2 className="text-xl font-bold text-black">
                Project Wise Summary of {selectedProjObj?.projectName} - {selectedProjObj?.city}
              </h2>
              <p className="text-xs text-black mt-1">Generated on: {new Date().toLocaleDateString('en-GB')}</p>
            </div>

            {/* Aggregated Totals Grid */}
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400 print:hidden">
                <Loader2 className="animate-spin text-blue-500" size={28} />
                <span>Compiling summary...</span>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:grid-cols-4">
                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl print:border-black print:bg-white">
                    <span className="block text-slate-500 text-[10px] uppercase font-bold tracking-wider print:text-black">Received</span>
                    <span className="text-2xl font-extrabold text-white mt-1 block print:text-black">₹{totals.received.toFixed(2)}</span>
                  </div>
                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl print:border-black print:bg-white">
                    <span className="block text-slate-500 text-[10px] uppercase font-bold tracking-wider print:text-black">Given</span>
                    <span className="text-2xl font-extrabold text-white mt-1 block print:text-black">₹{totals.given.toFixed(2)}</span>
                  </div>
                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl print:border-black print:bg-white">
                    <span className="block text-slate-500 text-[10px] uppercase font-bold tracking-wider print:text-black">Profit</span>
                    <span className="text-2xl font-extrabold text-emerald-400 mt-1 block print:text-black">₹{totals.profit.toFixed(2)}</span>
                  </div>
                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl print:border-black print:bg-white">
                    <span className="block text-slate-500 text-[10px] uppercase font-bold tracking-wider print:text-black">Pending</span>
                    <span className="text-2xl font-extrabold text-blue-400 mt-1 block print:text-black">₹{totals.pending.toFixed(2)}</span>
                  </div>
                </div>

                {/* Detailed Table */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg overflow-hidden print:border-0 print:shadow-none print:bg-white">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-sm text-slate-300 print:text-black">
                      <thead className="bg-slate-950 text-slate-400 text-xs uppercase font-semibold border-b border-slate-800 print:bg-slate-100 print:text-black print:border-black">
                        <tr>
                          <th className="py-4 px-4 text-center w-12">#</th>
                          <th className="py-4 px-4">Draft Detail (InvNo | Date | Size)</th>
                          <th className="py-4 px-4">Agent Name</th>
                          <th className="py-4 px-4 text-right">From Agent (₹)</th>
                          <th className="py-4 px-4 text-right">Handling Charge (₹)</th>
                          <th className="py-4 px-4">Advocate Name</th>
                          <th className="py-4 px-4 text-right">To Advocate (₹)</th>
                          <th className="py-4 px-4">Draft Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 print:divide-black">
                        {invoices.map((inv, idx) => (
                          <tr key={inv.invoiceId} className="hover:bg-slate-950/40 transition-colors print:hover:bg-transparent">
                            <td className="py-3 px-4 text-center font-medium text-slate-500 print:text-black">{idx + 1}</td>
                            <td className="py-3 px-4 font-semibold text-white print:text-black">
                              {`${inv.invNo || 'N/A'} | ${formatDate(inv.invoiceDate)} | ${inv.size || 0}`}
                            </td>
                            <td className="py-3 px-4">{inv.agentName}</td>
                            <td className="py-3 px-4 text-right font-medium">₹{inv.fromAgent.toFixed(2)}</td>
                            <td className="py-3 px-4 text-right text-emerald-400 font-semibold">₹{inv.handlingChargeAmount.toFixed(2)}</td>
                            <td className="py-3 px-4">{inv.advocateName}</td>
                            <td className="py-3 px-4 text-right font-medium text-blue-400">₹{inv.toAdvocate.toFixed(2)}</td>
                            <td className="py-3 px-4 text-xs font-semibold">{getDraftStatusText(inv.draftStatus)}</td>
                          </tr>
                        ))}

                        {/* Summary Total Row */}
                        <tr className="bg-slate-950/50 font-bold border-t border-slate-800 text-white print:bg-slate-50 print:text-black print:border-black">
                          <td className="py-4 px-4"></td>
                          <td className="py-4 px-4"></td>
                          <td className="py-4 px-4 text-right">Total</td>
                          <td className="py-4 px-4 text-right font-bold">₹{totals.received.toFixed(2)}</td>
                          <td className="py-4 px-4 text-right text-emerald-450 font-bold">₹{totals.profit.toFixed(2)}</td>
                          <td className="py-4 px-4"></td>
                          <td className="py-4 px-4 text-right font-bold text-blue-400">₹{totals.given.toFixed(2)}</td>
                          <td className="py-4 px-4"></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
