"use client";

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Landmark, Search, Loader2, FileText, Printer, FileSpreadsheet, Copy } from 'lucide-react';

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
  agentName: string;
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

export default function TransHistoryAgentPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Dropdown filter list states
  const [states, setStates] = useState<StateObj[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  // Selected filter values
  const [status, setStatus] = useState('-1');
  const [stateId, setStateId] = useState('');
  const [city, setCity] = useState('');
  const [projectId, setProjectId] = useState('');

  // Date Range values (initially first day of current month to today)
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Initial dates helper
  useEffect(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const formatDate = (date: Date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };
    setStartDate(formatDate(firstDay));
    setEndDate(formatDate(now));
  }, []);

  // Fetch states on mount
  useEffect(() => {
    fetch('http://localhost:5000/api/users/states')
      .then(res => res.json())
      .then(data => setStates(data.States || []))
      .catch(err => console.error('Error fetching states:', err));
  }, []);

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

  const fetchTransactions = async (st = '-1', sId = '', c = '', pId = '', startD = '', endD = '') => {
    setLoading(true);
    setError('');
    try {
      let url = 'http://localhost:5000/api/billing/transaction-history';
      const params = [];
      if (st !== '-1') params.push(`status=${st}`);
      if (sId) params.push(`stateId=${sId}`);
      if (c) params.push(`city=${encodeURIComponent(c)}`);
      if (pId) params.push(`projectId=${pId}`);
      if (startD) params.push(`startDate=${startD}`);
      if (endD) params.push(`endDate=${endD}`);

      if (params.length > 0) {
        url += `?${params.join('&')}`;
      }

      const response = await fetch(url);
      const data = await response.json();
      if (response.ok) {
        setTransactions(data.Transactions || []);
      } else {
        setError(data.Msg || 'Failed to retrieve transaction logs.');
      }
    } catch (err) {
      console.error(err);
      setError('Cannot connect to API server. Ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch initial records when dates are set
  useEffect(() => {
    if (startDate && endDate) {
      fetchTransactions(status, stateId, city, projectId, startDate, endDate);
    }
  }, [startDate, endDate]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTransactions(status, stateId, city, projectId, startDate, endDate);
  };

  const filteredTransactions = transactions.filter(t => {
    const full = `${t.invoiceNo} ${t.projectName} ${t.agentName} ${t.transactionRefNo} ${t.transactionRemarks}`.toLowerCase();
    return full.includes(searchTerm.toLowerCase());
  });

  // Calculate sum total
  const totalAmount = filteredTransactions.reduce((acc, curr) => acc + curr.amount, 0);

  // CSV export
  const exportCSV = () => {
    const headers = ['#', 'Agent Name', 'Project Name', 'City', 'Invoice No', 'UTR', 'Date', 'Transaction Remarks', 'Amount', 'Payment Remarks', 'Status'];
    const rows = filteredTransactions.map((t, idx) => [
      idx + 1,
      t.agentName,
      t.projectName,
      t.projectCity,
      t.invoiceNo,
      t.transactionRefNo,
      t.transactionDate ? new Date(t.transactionDate).toLocaleDateString('en-GB').replace(/\//g, '-') : 'N/A',
      t.transactionRemarks,
      t.amount.toFixed(2),
      t.paymentRemarks,
      t.paymentStatus === 1 ? 'Success' : t.paymentStatus === 2 ? 'Failed' : t.paymentStatus === 4 ? 'Sent' : 'Pending'
    ]);
    const csvContent = [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8' });
    const encodedUri = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `transaction_history_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyTable = () => {
    const text = filteredTransactions.map((t, idx) => 
      `${idx + 1}\t${t.agentName}\t${t.projectName}\t${t.projectCity}\t${t.invoiceNo}\t${t.transactionRefNo}\t${t.amount.toFixed(2)}\t${t.paymentStatus === 1 ? 'Success' : 'Pending'}`
    ).join('\n');
    navigator.clipboard.writeText(text);
    alert('Table copied to clipboard!');
  };

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 1:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Success
          </span>
        );
      case 2:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            Failed
          </span>
        );
      case 4:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            Sent
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            Pending
          </span>
        );
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="absolute top-10 right-10 w-[400px] h-[400px] rounded-full bg-blue-500/5 blur-[100px] pointer-events-none print:hidden" />

      <div className="space-y-6">
        <div className="flex justify-between items-center print:hidden">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <FileText className="text-blue-500" size={32} />
              Transaction History
            </h2>
            <p className="text-slate-400 text-sm mt-1">Audit log tracking all compiled agreements, payments, and invoices in Dainna</p>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm print:hidden">
            {error}
          </div>
        )}

        {/* Filter bar */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl shadow-md print:hidden">
          <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4 items-end">
            <div className="w-full">
              <label className="block text-slate-300 text-xs font-semibold mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:border-blue-500"
              >
                <option value="-1">ALL</option>
                <option value="0">Pending</option>
                <option value="4">Sent</option>
                <option value="1">Success</option>
                <option value="2">Failed</option>
              </select>
            </div>
            <div className="w-full">
              <label className="block text-slate-300 text-xs font-semibold mb-1">State</label>
              <select
                value={stateId}
                onChange={(e) => setStateId(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:border-blue-500"
              >
                <option value="">-- SELECT --</option>
                {states.map(s => (
                  <option key={s.state_id} value={s.state_id}>{s.state_name}</option>
                ))}
              </select>
            </div>
            <div className="w-full">
              <label className="block text-slate-300 text-xs font-semibold mb-1">City</label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                disabled={!stateId}
                className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:border-blue-500 disabled:opacity-50"
              >
                <option value="">-- SELECT --</option>
                {cities.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="w-full">
              <label className="block text-slate-300 text-xs font-semibold mb-1">Project Name</label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                disabled={!city}
                className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:border-blue-500 disabled:opacity-50"
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
                className="w-full h-[34px] bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-md justify-center shrink-0"
              >
                <Search size={13} />
                <span>Search</span>
              </button>
            </div>
          </form>
        </div>

        {/* Action icons */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2">
            <button 
              onClick={copyTable}
              className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-lg transition-all cursor-pointer"
              title="Copy"
            >
              <Copy size={13} />
            </button>
            <button 
              onClick={exportCSV}
              className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-lg transition-all cursor-pointer"
              title="CSV / Excel"
            >
              <FileSpreadsheet size={13} />
            </button>
            <button 
              onClick={() => window.print()}
              className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-lg transition-all cursor-pointer"
              title="Print"
            >
              <Printer size={13} />
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Invoices Table */}
        <div id="PrintReport" className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg overflow-hidden">
          <div className="p-4 bg-slate-950 border-b border-slate-800 flex justify-between items-center text-xs text-slate-400 font-semibold hidden print:flex">
            <span>Report Date: [{startDate ? new Date(startDate).toLocaleDateString('en-GB') : ''} To {endDate ? new Date(endDate).toLocaleDateString('en-GB') : ''}]</span>
            <span className="text-sm text-white">Transaction History</span>
            <span>Report Generated On: {new Date().toLocaleDateString('en-GB')}</span>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
                <Loader2 className="animate-spin text-blue-500" size={32} />
                <span>Loading transaction logs...</span>
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="py-20 text-center text-slate-500 text-sm">
                No transactions were found.
              </div>
            ) : (
              <table id="ReportTable" className="w-full border-collapse text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-3 text-center w-10">#</th>
                    <th className="py-3 px-3">Agent Name</th>
                    <th className="py-3 px-3">Project Name</th>
                    <th className="py-3 px-3">City</th>
                    <th className="py-3 px-3">Invoice No</th>
                    <th className="py-3 px-3">UTR</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Transaction Remarks</th>
                    <th className="py-3 px-3 text-right">Amount</th>
                    <th className="py-3 px-3 font-semibold">Payment Remarks</th>
                    <th className="py-3 px-3 text-center w-24">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredTransactions.map((t, idx) => (
                    <tr 
                      key={t.thId} 
                      className="hover:bg-slate-950/40 transition-colors"
                    >
                      <td className="py-3 px-3 text-center font-medium text-slate-500">{idx + 1}</td>
                      <td className="py-3 px-3 font-semibold text-slate-200 truncate max-w-[120px]">{t.agentName}</td>
                      <td className="py-3 px-3 font-medium text-white truncate max-w-[130px]">{t.projectName}</td>
                      <td className="py-3 px-3 text-slate-400 truncate max-w-[95px]">{t.projectCity}</td>
                      <td className="py-3 px-3 font-mono text-blue-400 font-semibold">{t.invoiceNo}</td>
                      <td className="py-3 px-3 font-mono">
                        {t.screenshot ? (
                          <a 
                            href={`http://localhost:5000/uploads/payment-screenshot/${t.screenshot}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:underline"
                          >
                            {t.transactionRefNo}
                          </a>
                        ) : (
                          <span className="text-slate-400">{t.transactionRefNo}</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-400">
                        {t.transactionDate ? new Date(t.transactionDate).toLocaleDateString('en-GB').replace(/\//g, '-') : 'N/A'}
                      </td>
                      <td className="py-3 px-3 text-slate-400 truncate max-w-[150px]">{t.transactionRemarks}</td>
                      <td className="py-3 px-3 text-right font-bold text-white whitespace-nowrap">₹ {t.amount.toFixed(2)}</td>
                      <td className="py-3 px-3 text-slate-300 truncate max-w-[150px]">{t.paymentRemarks || 'N/A'}</td>
                      <td className="py-3 px-3 text-center">
                        {getStatusBadge(t.paymentStatus)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-950 font-bold border-t border-slate-850">
                    <td colSpan={8} className="py-3.5 px-3 text-right text-slate-400 font-semibold uppercase">Total</td>
                    <td className="py-3.5 px-3 text-right text-emerald-400 text-sm whitespace-nowrap">₹ {totalAmount.toFixed(2)}</td>
                    <td colSpan={2} className="py-3.5 px-3"></td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
