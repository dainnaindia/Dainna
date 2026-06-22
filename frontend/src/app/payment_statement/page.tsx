"use client";

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Loader2, AlertCircle, FileSpreadsheet, Printer, Search, Download } from 'lucide-react';

interface Project {
  projectId: number;
  projectName: string;
  city?: string;
}

interface StatementRecord {
  invoiceId: number;
  invNo: string;
  projectName: string;
  projectCity: string;
  agentName: string;
  advocateName: string;
  size: number;
  rate: number;
  grandtotal: number;
  advocateCut: number;
  adminCut: number;
  utr: string;
  date: string;
}

interface UserSelect {
  userId: number;
  firstname: string;
  middlename?: string;
  surname: string;
  userCodeFull?: string;
}

export default function PaymentStatementPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [records, setRecords] = useState<StatementRecord[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [agents, setAgents] = useState<UserSelect[]>([]);
  const [advocates, setAdvocates] = useState<UserSelect[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Filters
  const [startdate, setStartdate] = useState('');
  const [enddate, setEnddate] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [selectedAdvocateId, setSelectedAdvocateId] = useState('');

  useEffect(() => {
    // Default dates: month start to today
    const today = new Date();
    const pad = (num: number) => String(num).padStart(2, '0');
    
    // YYYY-MM-DD format for HTML date inputs
    const yyyy = today.getFullYear();
    const mm = pad(today.getMonth() + 1);
    const dd = pad(today.getDate());
    
    setStartdate(`${yyyy}-${mm}-01`);
    setEnddate(`${yyyy}-${mm}-${dd}`);

    // Fetch projects list
    fetch('http://localhost:5000/api/projects')
      .then(res => res.json())
      .then(data => {
        const list = (data.Projects || []).map((p: any) => ({
          projectId: p.projectId || p.project_id,
          projectName: p.projectName || p.project_name,
          city: p.city
        }));
        setProjects(list);
      })
      .catch(err => console.error('Error fetching projects list:', err));

    // Fetch agents list
    fetch('http://localhost:5000/api/users/agents', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        setAgents(data.Agents || []);
      })
      .catch(err => console.error('Error fetching agents:', err));

    // Fetch advocates list
    fetch('http://localhost:5000/api/users/advocates', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        setAdvocates(data.Advocates || []);
      })
      .catch(err => console.error('Error fetching advocates:', err));
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setHasSearched(true);

    try {
      let url = `http://localhost:5000/api/upi/payment-statement?startDate=${startdate}&endDate=${enddate}`;
      if (selectedProjectId) {
        url += `&projectId=${selectedProjectId}`;
      }
      if (selectedAgentId) {
        url += `&agentId=${selectedAgentId}`;
      }
      if (selectedAdvocateId) {
        url += `&advocateId=${selectedAdvocateId}`;
      }

      const response = await fetch(url);
      const data = await response.json();
      if (response.ok) {
        setRecords(data.Statement || []);
      } else {
        setError(data.Error || 'Failed to retrieve payment statements.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection to the server failed. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const getTotals = () => {
    let grandtotal = 0;
    let advocateCut = 0;
    let adminCut = 0;
    records.forEach(r => {
      grandtotal += r.grandtotal || 0;
      advocateCut += r.advocateCut || 0;
      adminCut += r.adminCut || 0;
    });
    return { grandtotal, advocateCut, adminCut };
  };

  const totals = getTotals();

  // Export to CSV
  const exportToCSV = () => {
    const headers = [
      '#', 'Invoice No', 'Date', 'Project Name', 'Agent Name', 
      'Advocate Name', 'Size (Sqm)', 'Total Paid (INR)', 
      'Admin Cut (INR)', 'Advocate Cut (INR)', 'UTR Reference'
    ];
    
    const rows = records.map((r, idx) => [
      idx + 1,
      r.invNo,
      r.date ? new Date(r.date).toLocaleDateString('en-GB') : 'N/A',
      `${r.projectName} (${r.projectCity})`,
      r.agentName,
      r.advocateName,
      r.size || 0,
      r.grandtotal || 0,
      r.adminCut || 0,
      r.advocateCut || 0,
      r.utr
    ]);

    rows.push([
      'Total', '', '', '', '', '', '', 
      totals.grandtotal, 
      totals.adminCut, 
      totals.advocateCut, 
      ''
    ]);

    const csvContent = [
      `Admin Payment Statement Report from ${startdate} to ${enddate}`,
      '',
      headers.join(','), 
      ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8' });
    const encodedUri = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `payment_statement_${startdate}_to_${enddate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to Excel (re-uses CSV content configured for Excel loading)
  const exportToExcel = () => {
    const headers = [
      '#', 'Invoice No', 'Date', 'Project Name', 'Agent Name', 
      'Advocate Name', 'Size (Sqm)', 'Total Paid (INR)', 
      'Admin Cut (INR)', 'Advocate Cut (INR)', 'UTR Reference'
    ];
    
    const rows = records.map((r, idx) => [
      idx + 1,
      r.invNo,
      r.date ? new Date(r.date).toLocaleDateString('en-GB') : 'N/A',
      `${r.projectName} (${r.projectCity})`,
      r.agentName,
      r.advocateName,
      r.size || 0,
      r.grandtotal || 0,
      r.adminCut || 0,
      r.advocateCut || 0,
      r.utr
    ]);

    rows.push([
      'Total', '', '', '', '', '', '', 
      totals.grandtotal, 
      totals.adminCut, 
      totals.advocateCut, 
      ''
    ]);

    // Excel friendly tab separated values format
    const excelContent = [
      `Admin Payment Statement Report from ${startdate} to ${enddate}`,
      '',
      headers.join('\t'),
      ...rows.map(e => e.join('\t'))
    ].join('\r\n');

    const blob = new Blob(['\uFEFF' + excelContent], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const encodedUri = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `payment_statement_${startdate}_to_${enddate}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
            border: 1px solid #000 !important;
            padding: 6px 4px !important;
            color: black !important;
            font-size: 9px !important;
          }
          th {
            background-color: #f2f2f2 !important;
            font-weight: bold !important;
          }
          .main-content {
            margin: 0 !important;
            padding: 0 !important;
          }
        }
      `}</style>

      <div className="space-y-6">
        {/* Header bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white">Payment Statement Download</h2>
            <p className="text-slate-400 text-sm mt-1">
              Download and export statement ledgers with automated transaction split breakdowns.
            </p>
          </div>
          {hasSearched && records.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={exportToExcel}
                className="px-3 py-2 bg-emerald-600/10 hover:bg-emerald-600/25 border border-emerald-500/20 text-emerald-300 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <FileSpreadsheet size={14} />
                <span>Export Excel</span>
              </button>
              <button
                onClick={exportToCSV}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border border-slate-700 cursor-pointer shadow-md"
              >
                <Download size={14} />
                <span>Export CSV</span>
              </button>
              <button
                onClick={() => window.print()}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border border-slate-700 cursor-pointer shadow-md"
              >
                <Printer size={14} />
                <span>Print Report</span>
              </button>
            </div>
          )}
        </div>

        {/* Print Layout Header */}
        <div className="hidden print:block text-center border-b border-black pb-4 mb-6">
          <h2 className="text-xl font-bold text-black uppercase tracking-wider">Dainna Payment Split Statement Ledger</h2>
          <p className="text-xs text-black mt-1">Date Range: {startdate} to {enddate}</p>
          <p className="text-xs text-black">Generated on: {new Date().toLocaleDateString('en-GB')}</p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3 print:hidden">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Filters Box */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl shadow-lg print:hidden">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-slate-350 text-xs font-semibold mb-1">From Date</label>
                <input
                  type="date"
                  required
                  value={startdate}
                  onChange={(e) => setStartdate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-slate-350 text-xs font-semibold mb-1">To Date</label>
                <input
                  type="date"
                  required
                  value={enddate}
                  onChange={(e) => setEnddate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-slate-350 text-xs font-semibold mb-1">Filter by Project</label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="">-- All Projects --</option>
                  {projects.map(p => (
                    <option key={p.projectId} value={p.projectId}>
                      {p.projectName} {p.city ? `(${p.city})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-350 text-xs font-semibold mb-1">Filter by Agent</label>
                <select
                  value={selectedAgentId}
                  onChange={(e) => setSelectedAgentId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="">-- All Agents --</option>
                  {agents.map(a => (
                    <option key={a.userId} value={a.userId}>
                      {a.firstname} {a.surname} {a.userCodeFull ? `(${a.userCodeFull})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-350 text-xs font-semibold mb-1">Filter by Advocate</label>
                <select
                  value={selectedAdvocateId}
                  onChange={(e) => setSelectedAdvocateId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="">-- All Advocates --</option>
                  {advocates.map(a => (
                    <option key={a.userId} value={a.userId}>
                      {a.firstname} {a.surname} {a.userCodeFull ? `(${a.userCodeFull})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs transition-all flex items-center gap-2 cursor-pointer shadow-md justify-center w-full sm:w-auto"
              >
                <Search size={14} />
                <span>Search Statement</span>
              </button>
            </div>
          </form>
        </div>

        {/* Search results */}
        {hasSearched && (
          <div className="space-y-6">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400 print:hidden">
                <Loader2 className="animate-spin text-blue-500" size={28} />
                <span>Generating payment statement data...</span>
              </div>
            ) : records.length === 0 ? (
              <div className="py-20 text-center text-slate-500 text-sm print:text-black">
                No matching successful UPI payment statement records found.
              </div>
            ) : (
              <>
                {/* Aggregate Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 print:grid-cols-3">
                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl print:border-black print:bg-white">
                    <span className="block text-slate-500 text-[10px] uppercase font-bold tracking-wider print:text-black font-semibold">Total Funds Received</span>
                    <span className="text-2xl font-extrabold text-white mt-1 block print:text-black">₹{totals.grandtotal.toFixed(2)}</span>
                  </div>
                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl print:border-black print:bg-white">
                    <span className="block text-slate-500 text-[10px] uppercase font-bold tracking-wider print:text-black font-semibold">Admin Cut (Handling)</span>
                    <span className="text-2xl font-extrabold text-blue-400 mt-1 block print:text-black">₹{totals.adminCut.toFixed(2)}</span>
                  </div>
                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl print:border-black print:bg-white">
                    <span className="block text-slate-500 text-[10px] uppercase font-bold tracking-wider print:text-black font-semibold">Advocate Payouts Cut</span>
                    <span className="text-2xl font-extrabold text-emerald-400 mt-1 block print:text-black">₹{totals.advocateCut.toFixed(2)}</span>
                  </div>
                </div>

                {/* Statements Table */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg overflow-hidden print:border-none print:shadow-none print:bg-white">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-xs text-slate-300 print:text-black">
                      <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800 print:bg-slate-100 print:text-black print:border-black">
                        <tr>
                          <th className="py-3.5 px-3 text-center w-10">#</th>
                          <th className="py-3.5 px-3">Invoice No</th>
                          <th className="py-3.5 px-3">Date</th>
                          <th className="py-3.5 px-3">Project</th>
                          <th className="py-3.5 px-3">Agent</th>
                          <th className="py-3.5 px-3">Advocate</th>
                          <th className="py-3.5 px-3 text-right">Size</th>
                          <th className="py-3.5 px-3 text-right">Total Paid (₹)</th>
                          <th className="py-3.5 px-3 text-right">Admin Cut (₹)</th>
                          <th className="py-3.5 px-3 text-right">Adv Cut (₹)</th>
                          <th className="py-3.5 px-3">UTR Reference</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50 print:divide-black">
                        {records.map((r, idx) => (
                          <tr key={idx} className="hover:bg-slate-950/30 transition-colors print:hover:bg-transparent">
                            <td className="py-3 px-3 text-center font-medium text-slate-500 print:text-black">{idx + 1}</td>
                            <td className="py-3 px-3 font-semibold text-white print:text-black">{r.invNo}</td>
                            <td className="py-3 px-3 text-slate-400 print:text-black">
                              {r.date ? new Date(r.date).toLocaleDateString('en-GB') : 'N/A'}
                            </td>
                            <td className="py-3 px-3">
                              <span className="block font-medium text-slate-200 print:text-black">{r.projectName}</span>
                              <span className="block text-[10px] text-slate-500 print:text-slate-600 leading-none mt-0.5">{r.projectCity}</span>
                            </td>
                            <td className="py-3 px-3">{r.agentName}</td>
                            <td className="py-3 px-3">{r.advocateName}</td>
                            <td className="py-3 px-3 text-right font-mono">{r.size} sqm</td>
                            <td className="py-3 px-3 text-right font-semibold text-slate-200 print:text-black font-mono">₹{r.grandtotal.toFixed(2)}</td>
                            <td className="py-3 px-3 text-right font-semibold text-blue-400 print:text-black font-mono">₹{r.adminCut.toFixed(2)}</td>
                            <td className="py-3 px-3 text-right font-semibold text-emerald-400 print:text-black font-mono">₹{r.advocateCut.toFixed(2)}</td>
                            <td className="py-3 px-3 font-mono text-slate-450 print:text-black select-all">{r.utr}</td>
                          </tr>
                        ))}

                        <tr className="bg-slate-950/60 font-bold border-t border-slate-800 text-white print:bg-slate-50 print:text-black print:border-black">
                          <td className="py-3.5 px-3">Total</td>
                          <td className="py-3.5 px-3"></td>
                          <td className="py-3.5 px-3"></td>
                          <td className="py-3.5 px-3"></td>
                          <td className="py-3.5 px-3"></td>
                          <td className="py-3.5 px-3"></td>
                          <td className="py-3.5 px-3"></td>
                          <td className="py-3.5 px-3 text-right font-mono">₹{totals.grandtotal.toFixed(2)}</td>
                          <td className="py-3.5 px-3 text-right font-mono text-blue-400 print:text-black">₹{totals.adminCut.toFixed(2)}</td>
                          <td className="py-3.5 px-3 text-right font-mono text-emerald-400 print:text-black font-mono">₹{totals.advocateCut.toFixed(2)}</td>
                          <td className="py-3.5 px-3"></td>
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
