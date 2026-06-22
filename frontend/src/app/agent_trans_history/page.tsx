"use client";

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { History, Loader2, Search, Printer, FileSpreadsheet } from 'lucide-react';

interface Transaction {
  thId: number;
  amount: number;
  paymentStatus: number;
  paymentRemarks: string;
  transactionRefNo: string;
  transactionRemarks: string;
  transactionDate: string;
  screenshot: string;
  invoiceNo: string;
  projectName: string;
  projectCity: string;
}

interface Project {
  projectId: number;
  projectName: string;
}

export default function AgentTransHistoryPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  // Filters State
  const [status, setStatus] = useState('-1');
  const [projectId, setProjectId] = useState('-1');
  
  // Set default date range: first of current month to today
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const initFilters = async () => {
    // Set dates first of month to today
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    setStartDate(`${y}-${m}-01`);
    setEndDate(`${y}-${m}-${d}`);

    try {
      const profileRes = await fetch('http://localhost:5000/api/users/profile', { credentials: 'include' });
      const profileData = await profileRes.json();
      if (profileRes.ok && profileData.User) {
        const city = profileData.User.workingCity || '';
        const projectsRes = await fetch(`http://localhost:5000/api/projects?City=${city}`, { credentials: 'include' });
        const projectsData = await projectsRes.json();
        if (projectsRes.ok) {
          setProjects(projectsData.Projects || []);
        }
      }
    } catch (err) {
      console.error('Projects list fetch failed:', err);
    }
  };

  useEffect(() => {
    initFilters();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSearched(true);

    try {
      let url = `http://localhost:5000/api/billing/transaction-history?status=${status}`;
      if (projectId !== '-1') {
        url += `&projectId=${projectId}`;
      }
      if (startDate && endDate) {
        url += `&startDate=${startDate}&endDate=${endDate}`;
      }

      const response = await fetch(url, { credentials: 'include' });
      const data = await response.json();
      if (response.ok) {
        setTransactions(data.Transactions || []);
      } else {
        setError(data.Msg || 'Failed to retrieve transaction history.');
      }
    } catch (err) {
      console.error(err);
      setError('Cannot connect to API server. Ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  // Export to Excel / CSV
  const exportExcel = () => {
    const headers = ["#", "Invoice No", "Project Name", "UTR", "Date", "Transaction Remarks", "Amount", "Payment Remarks", "Status"];
    const rows = transactions.map((t, idx) => [
      idx + 1,
      t.invoiceNo,
      t.projectName,
      t.transactionRefNo,
      t.transactionDate ? new Date(t.transactionDate).toLocaleDateString('en-IN') : 'N/A',
      t.transactionRemarks,
      t.amount,
      t.paymentRemarks,
      t.paymentStatus === 1 ? 'Success' : t.paymentStatus === 2 ? 'Failed' : t.paymentStatus === 4 ? 'Sent' : 'Pending'
    ]);

    const csvContent = [headers.join(","), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8' });
    const encodedUri = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `transaction_history_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(encodedUri);
  };

  const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);

  return (
    <DashboardLayout role="agent">
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          aside, header, button, .no-print, input, select {
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
            <h2 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <History className="text-blue-500" size={32} />
              Transaction History
            </h2>
            <p className="text-slate-400 text-sm mt-1">Audit log tracking all payment history, deposits, and accounting remarks</p>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm no-print">
            {error}
          </div>
        )}

        {/* Legacy style search panel */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl shadow-md no-print">
          <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-slate-450 text-xs font-semibold mb-1" htmlFor="status-select">Status</label>
              <select
                id="status-select"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="-1">ALL</option>
                <option value="0">Pending</option>
                <option value="4">Sent</option>
                <option value="1">Success</option>
                <option value="2">Failed</option>
              </select>
            </div>
            
            <div>
              <label className="block text-slate-450 text-xs font-semibold mb-1" htmlFor="project-select">Project Name</label>
              <select
                id="project-select"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
              >
                <option value="-1">-- ALL --</option>
                {projects.map((p) => (
                  <option key={p.projectId} value={p.projectId}>
                    {p.projectName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-450 text-xs font-semibold mb-1">Date Range</label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
                <span className="text-slate-500">to</span>
                <input
                  type="date"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <Search size={14} />
              <span>Search</span>
            </button>
          </form>
        </div>

        {/* Action Excel and Print Toolbar */}
        {searched && (
          <div className="flex gap-2 justify-end no-print">
            <button
              onClick={() => window.print()}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg text-xs flex items-center gap-1.5 transition-all border border-slate-700 hover:border-slate-600 cursor-pointer"
            >
              <Printer size={12} />
              <span>Print</span>
            </button>
            <button
              onClick={exportExcel}
              className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-medium rounded-lg text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
            >
              <FileSpreadsheet size={12} />
              <span>Excel</span>
            </button>
          </div>
        )}

        {/* Report block */}
        {searched && (
          <div id="PrintReport" className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg overflow-hidden">
            
            {/* Print Layout Header */}
            <div className="hidden print:flex justify-between items-center p-6 border-b border-slate-800 text-xs">
              <span className="text-slate-400">Report Date: {startDate ? new Date(startDate).toLocaleDateString('en-IN') : ''} to {endDate ? new Date(endDate).toLocaleDateString('en-IN') : ''}</span>
              <span className="font-bold text-sm">Transaction History</span>
              <span className="text-slate-400">Generated On: {new Date().toLocaleDateString('en-IN')}</span>
            </div>

            <div className="overflow-x-auto">
              {loading ? (
                <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
                  <Loader2 className="animate-spin text-blue-500" size={28} />
                  <span>Loading transaction logs...</span>
                </div>
              ) : transactions.length === 0 ? (
                <div className="py-20 text-center text-slate-500 text-sm">
                  No transaction history records found.
                </div>
              ) : (
                <table className="w-full border-collapse text-left text-sm text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 text-xs uppercase font-semibold border-b border-slate-800">
                    <tr>
                      <th className="py-4 px-6 text-center w-12">#</th>
                      <th className="py-4 px-6">Invoice No</th>
                      <th className="py-4 px-6">Project Name</th>
                      <th className="py-4 px-6">UTR</th>
                      <th className="py-4 px-6">Date</th>
                      <th className="py-4 px-6">Transaction Remarks</th>
                      <th className="py-4 px-6 text-right w-24">Amount</th>
                      <th className="py-4 px-6">Payment Remarks</th>
                      <th className="py-4 px-6 text-center w-24">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                    {transactions.map((t, idx) => (
                      <tr key={t.thId} className="hover:bg-slate-950/40 transition-colors">
                        <td className="py-4 px-6 text-center font-sans font-medium text-slate-500">{idx + 1}</td>
                        <td className="py-4 px-6 font-semibold text-white">{t.invoiceNo}</td>
                        <td className="py-4 px-6 font-sans font-medium text-slate-200">{t.projectName}</td>
                        <td className="py-4 px-6 text-blue-450 hover:underline">
                          {t.screenshot ? (
                            <a href={`http://localhost:5000/uploads/payment-screenshot/${t.screenshot}`} target="_blank" rel="noreferrer">
                              {t.transactionRefNo}
                            </a>
                          ) : (
                            t.transactionRefNo
                          )}
                        </td>
                        <td className="py-4 px-6 text-slate-350">
                          {t.transactionDate ? new Date(t.transactionDate).toLocaleDateString('en-IN') : 'N/A'}
                        </td>
                        <td className="py-4 px-6 font-sans text-slate-400">{t.transactionRemarks}</td>
                        <td className="py-4 px-6 text-right font-bold text-white text-sm">₹{t.amount.toFixed(2)}</td>
                        <td className="py-4 px-6 font-sans text-slate-400">{t.paymentRemarks}</td>
                        <td className="py-4 px-6 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                            t.paymentStatus === 1
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : t.paymentStatus === 2
                              ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                              : t.paymentStatus === 4
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {t.paymentStatus === 1 ? 'Success' : t.paymentStatus === 2 ? 'Failed' : t.paymentStatus === 4 ? 'Sent' : 'Pending'}
                          </span>
                        </td>
                      </tr>
                    ))}
                    
                    {/* Total Row */}
                    <tr className="bg-slate-950/45 font-sans font-semibold border-t border-slate-800">
                      <td colSpan={6} className="py-4 px-6 text-right text-slate-300">Total</td>
                      <td className="py-4 px-6 text-right font-bold text-white text-sm">₹{totalAmount.toFixed(2)}</td>
                      <td colSpan={2}></td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
