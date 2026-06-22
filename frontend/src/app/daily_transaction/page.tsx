"use client";

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Landmark, Search, Loader2, FileSpreadsheet, Printer, Copy, FileText, CheckCircle, HelpCircle } from 'lucide-react';

interface Invoice {
  invoiceId: number;
  invoiceNo: string;
  invNo: string;
  projectName: string;
  projectCity: string;
  projectState: string;
  agentName: string;
  size: number;
  grandtotal: number;
  paymentStatus: number;
  addeddate: string;
  purchaserName: string;
  utr: string;
  transactionRemarks: string;
  advPaymentStatus: number;
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

export default function DailyTransactionPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Dropdown filter list states
  const [states, setStates] = useState<StateObj[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  // Selected filter values
  const [stateId, setStateId] = useState('');
  const [city, setCity] = useState('');
  const [projectId, setProjectId] = useState('');

  // Modal states
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);
  const [detailInvoice, setDetailInvoice] = useState<any>(null);
  const [fetchingDetail, setFetchingDetail] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [reviewStatus, setReviewStatus] = useState('1'); // '1' = Approve, '2' = Reject
  const [reviewRemarks, setReviewRemarks] = useState('');
  const [reviewError, setReviewError] = useState('');

  // Fetch states on mount
  useEffect(() => {
    fetch('http://localhost:5000/api/users/states')
      .then(res => res.json())
      .then(data => setStates(data.States || []))
      .catch(err => console.error('Error fetching states:', err));
    fetchInvoices();
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

  const fetchInvoices = async (sId = '', c = '', pId = '') => {
    setLoading(true);
    setError('');
    try {
      let url = 'http://localhost:5000/api/billing/invoices';
      const params = [];
      if (sId) params.push(`stateId=${sId}`);
      if (c) params.push(`city=${encodeURIComponent(c)}`);
      if (pId) params.push(`projectId=${pId}`);

      if (params.length > 0) {
        url += `?${params.join('&')}`;
      }

      const response = await fetch(url);
      const data = await response.json();
      if (response.ok) {
        setInvoices(data.Invoices || []);
      } else {
        setError(data.Msg || 'Failed to retrieve daily transactions.');
      }
    } catch (err) {
      console.error(err);
      setError('Cannot connect to API server. Ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchInvoices(stateId, city, projectId);
  };

  const handleOpenReviewModal = async (id: number) => {
    setSelectedInvoiceId(id);
    setFetchingDetail(true);
    setReviewError('');
    setReviewRemarks('');
    try {
      const res = await fetch(`http://localhost:5000/api/billing/invoices/${id}`);
      const data = await res.json();
      if (res.ok && data.Status === 100) {
        setDetailInvoice(data.Invoice);
        setReviewStatus(data.Invoice.paymentStatus === 2 ? '2' : '1');
        setReviewRemarks(data.Invoice.paymentRemarks || '');
      } else {
        setReviewError(data.Msg || 'Failed to load transaction details.');
      }
    } catch (err) {
      console.error(err);
      setReviewError('Connection to server failed.');
    } finally {
      setFetchingDetail(false);
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceId || !detailInvoice) return;

    setUpdateLoading(true);
    setReviewError('');
    try {
      const res = await fetch('http://localhost:5000/api/billing/invoices/update-payment-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          InvoiceID: selectedInvoiceId,
          OLBID: detailInvoice.olbId,
          Status: parseInt(reviewStatus),
          Remarks: reviewRemarks,
          TransactionRefNo: detailInvoice.transactionRefNo
        })
      });
      const data = await res.json();
      if (res.ok && data.Status === 4) {
        setSelectedInvoiceId(null);
        setDetailInvoice(null);
        fetchInvoices(stateId, city, projectId);
      } else {
        setReviewError(data.Msg || 'Failed to update payment status.');
      }
    } catch (err) {
      console.error(err);
      setReviewError('Failed to submit status update.');
    } finally {
      setUpdateLoading(false);
    }
  };

  const filteredInvoices = invoices.filter(i => {
    const full = `${i.invoiceNo} ${i.invNo} ${i.projectName} ${i.purchaserName} ${i.agentName} ${i.utr}`.toLowerCase();
    return full.includes(searchTerm.toLowerCase());
  });

  // Export functions
  const exportCSV = () => {
    const headers = ['#', 'Invoice No', 'Date', 'State', 'City', 'Project Name', 'Agent Name', 'Amount', 'UTR', 'Transaction Remarks', 'Payment Status', 'Status'];
    const rows = filteredInvoices.map((inv, idx) => [
      idx + 1,
      inv.invNo || inv.invoiceNo,
      new Date(inv.addeddate).toLocaleDateString('en-GB').replace(/\//g, '-'),
      inv.projectState,
      inv.projectCity,
      inv.projectName,
      inv.agentName,
      inv.grandtotal.toFixed(2),
      inv.utr,
      inv.transactionRemarks,
      inv.paymentStatus === 1 ? 'Received' : inv.paymentStatus === 2 ? 'Failed' : 'Pending',
      inv.paymentStatus !== 1 ? 'N/A' : inv.advPaymentStatus === 1 ? 'Success' : inv.advPaymentStatus === 2 ? 'Failed' : inv.advPaymentStatus === 4 ? 'Awaiting Approval' : 'Waiting for Advocate'
    ]);
    const csvContent = [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8' });
    const encodedUri = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `daily_transactions_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(encodedUri);
  };

  const copyTable = () => {
    const text = filteredInvoices.map((inv, idx) => 
      `${idx + 1}\t${inv.invNo || inv.invoiceNo}\t${new Date(inv.addeddate).toLocaleDateString('en-GB').replace(/\//g, '-')}\t${inv.projectName}\t${inv.agentName}\t₹${inv.grandtotal.toFixed(2)}\t${inv.utr}`
    ).join('\n');
    navigator.clipboard.writeText(text);
    alert('Table copied to clipboard!');
  };

  const getAdvPaymentStatusBadge = (inv: Invoice) => {
    if (inv.paymentStatus !== 1) {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-500 border border-slate-700/40">
          N/A
        </span>
      );
    }
    switch (inv.advPaymentStatus) {
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
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 animate-pulse">
            Sent to Advocate
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
            Waiting for Advocate
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
              <Landmark className="text-blue-500" size={32} />
              Daily Transaction
            </h2>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm print:hidden">
            {error}
          </div>
        )}

        {/* Filter bar cascading State -> City -> Project */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl shadow-md print:hidden">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row items-end gap-4">
            <div className="w-full md:w-1/4">
              <label className="block text-slate-300 text-xs font-semibold mb-1">State</label>
              <select
                value={stateId}
                onChange={(e) => setStateId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:border-blue-500"
              >
                <option value="">-- SELECT --</option>
                {states.map(s => (
                  <option key={s.state_id} value={s.state_id}>{s.state_name}</option>
                ))}
              </select>
            </div>
            <div className="w-full md:w-1/4">
              <label className="block text-slate-300 text-xs font-semibold mb-1">City</label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                disabled={!stateId}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:border-blue-500 disabled:opacity-50"
              >
                <option value="">-- SELECT --</option>
                {cities.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="w-full md:w-1/4">
              <label className="block text-slate-300 text-xs font-semibold mb-1">Project Name</label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                disabled={!city}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:border-blue-500 disabled:opacity-50"
              >
                <option value="">-- SELECT --</option>
                {projects.map(p => (
                  <option key={p.projectId} value={p.projectId}>{p.projectName}</option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-xs transition-all flex items-center gap-2 cursor-pointer shadow-md justify-center w-full md:w-auto shrink-0"
            >
              <Search size={14} />
              <span>Search</span>
            </button>
          </form>
        </div>

        {/* Action icons, matching legacy toolbar details */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Show all rows</span>
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
        <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
                <Loader2 className="animate-spin text-blue-500" size={32} />
                <span>Loading daily records...</span>
              </div>
            ) : filteredInvoices.length === 0 ? (
              <div className="py-20 text-center text-slate-500 text-sm">
                No transactions were found.
              </div>
            ) : (
              <table className="w-full border-collapse text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-3 text-center w-10">#</th>
                    <th className="py-3 px-3">Invoice No</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">State</th>
                    <th className="py-3 px-3">City</th>
                    <th className="py-3 px-3">Project Name</th>
                    <th className="py-3 px-3">Agent Name</th>
                    <th className="py-3 px-3 text-right">Amount</th>
                    <th className="py-3 px-3">UTR</th>
                    <th className="py-3 px-3">Transaction Remarks</th>
                    <th className="py-3 px-3 text-center w-24">Payment Status</th>
                    <th className="py-3 px-3 text-center w-28">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredInvoices.map((inv, idx) => (
                    <tr 
                      key={inv.invoiceId} 
                      onClick={() => handleOpenReviewModal(inv.invoiceId)}
                      className="hover:bg-slate-950/40 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-3 text-center font-medium text-slate-500">{idx + 1}</td>
                      <td className="py-3 px-3 font-mono text-blue-400 font-semibold">{inv.invNo || inv.invoiceNo}</td>
                      <td className="py-3 px-3 text-slate-400">{new Date(inv.addeddate).toLocaleDateString('en-GB').replace(/\//g, '-')}</td>
                      <td className="py-3 px-3 text-slate-400 truncate max-w-[90px]">{inv.projectState}</td>
                      <td className="py-3 px-3 text-slate-450 truncate max-w-[90px]">{inv.projectCity}</td>
                      <td className="py-3 px-3 font-semibold text-white truncate max-w-[120px]">{inv.projectName}</td>
                      <td className="py-3 px-3 text-slate-300 truncate max-w-[110px]">{inv.agentName}</td>
                      <td className="py-3 px-3 text-right font-bold text-white whitespace-nowrap">₹ {Number(inv.grandtotal || 0).toFixed(2)}</td>
                      <td className="py-3 px-3">
                        <span className="font-mono text-blue-400 hover:underline cursor-pointer truncate max-w-[80px] block">
                          {inv.utr}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-400 truncate max-w-[120px]">{inv.transactionRemarks}</td>
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                          inv.paymentStatus === 1 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : inv.paymentStatus === 2
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          <span>{inv.paymentStatus === 1 ? 'Received' : inv.paymentStatus === 2 ? 'Failed' : 'Pending'}</span>
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        {getAdvPaymentStatusBadge(inv)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Payment Review Modal */}
      {selectedInvoiceId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center shrink-0">
              <h3 className="font-bold text-white text-base">Verify Invoice Payment</h3>
              <button 
                onClick={() => { setSelectedInvoiceId(null); setDetailInvoice(null); }}
                className="text-slate-400 hover:text-white text-lg font-semibold cursor-pointer focus:outline-none"
              >
                &times;
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {fetchingDetail ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
                  <Loader2 className="animate-spin text-blue-500" size={24} />
                  <span className="text-xs">Loading transaction metadata...</span>
                </div>
              ) : reviewError ? (
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                  {reviewError}
                </div>
              ) : detailInvoice ? (
                <form onSubmit={handleUpdateStatus} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-850">
                      <span className="text-slate-400 block mb-0.5">Project</span>
                      <span className="font-bold text-white">{detailInvoice.projectName}</span>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-850">
                      <span className="text-slate-400 block mb-0.5">Invoice ID</span>
                      <span className="font-bold text-blue-400 font-mono">{detailInvoice.invNo}</span>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-850">
                      <span className="text-slate-400 block mb-0.5">Amount</span>
                      <span className="font-bold text-emerald-400 font-mono">₹ {detailInvoice.grandtotal}</span>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-850">
                      <span className="text-slate-400 block mb-0.5">UTR / Transaction Ref</span>
                      <span className="font-bold text-white font-mono">{detailInvoice.transactionRefNo || 'N/A'}</span>
                    </div>
                  </div>

                  {detailInvoice.transactionRemarks && (
                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-850 text-xs">
                      <span className="text-slate-400 block mb-0.5">Agent Remarks</span>
                      <span className="text-slate-200">{detailInvoice.transactionRemarks}</span>
                    </div>
                  )}

                  {detailInvoice.screenshot ? (
                    <div className="space-y-1.5 text-xs">
                      <span className="text-slate-400 block">Payment Screenshot Receipt:</span>
                      <a 
                        href={`http://localhost:5000/uploads/payment-screenshot/${detailInvoice.screenshot}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block px-3 py-2 bg-blue-600/10 border border-blue-500/20 hover:border-blue-500/40 text-blue-400 hover:text-blue-300 font-semibold rounded-lg transition-colors cursor-pointer text-xs"
                      >
                        Open Screenshot Receipt ↗
                      </a>
                    </div>
                  ) : (
                    <div className="text-slate-500 text-xs italic bg-slate-950 p-3 rounded-lg border border-slate-850">
                      No screenshot uploaded for this transaction.
                    </div>
                  )}

                  <div className="border-t border-slate-800 pt-4 space-y-3">
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 text-xs font-semibold text-slate-200 cursor-pointer">
                        <input 
                          type="radio" 
                          name="reviewStatus" 
                          value="1" 
                          checked={reviewStatus === '1'}
                          onChange={() => setReviewStatus('1')}
                          className="text-blue-600 bg-slate-950 border-slate-800 focus:ring-blue-500"
                        />
                        <span>Approve Payment (Success)</span>
                      </label>
                      <label className="flex items-center gap-2 text-xs font-semibold text-slate-200 cursor-pointer">
                        <input 
                          type="radio" 
                          name="reviewStatus" 
                          value="2" 
                          checked={reviewStatus === '2'}
                          onChange={() => setReviewStatus('2')}
                          className="text-red-600 bg-slate-950 border-slate-800 focus:ring-red-500"
                        />
                        <span>Reject Payment (Failed)</span>
                      </label>
                    </div>

                    <div>
                      <label className="block text-slate-350 text-xs font-semibold mb-1">
                        Verification Remarks
                      </label>
                      <textarea
                        rows={2}
                        value={reviewRemarks}
                        onChange={(e) => setReviewRemarks(e.target.value)}
                        placeholder="Add reason for approval or rejection remarks..."
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-700 text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="pt-2 flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => { setSelectedInvoiceId(null); setDetailInvoice(null); }}
                        className="px-4 py-2 bg-slate-850 hover:bg-slate-800 text-slate-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={updateLoading}
                        className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-xs transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {updateLoading ? (
                          <>
                            <Loader2 className="animate-spin" size={12} />
                            <span>Updating...</span>
                          </>
                        ) : (
                          <span>Submit Verification</span>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
