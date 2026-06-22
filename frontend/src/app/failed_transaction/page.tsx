"use client";

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Landmark, Search, Loader2, AlertTriangle, Printer, FileSpreadsheet, Copy } from 'lucide-react';

interface Invoice {
  invoiceId: number;
  invoiceNo: string;
  invNo: string;
  projectName: string;
  projectCity: string;
  projectState: string;
  agentName: string;
  size: number;
  rate: number;
  total: number;
  sgstAmount: number;
  cgstAmount: number;
  grandtotal: number;
  addeddate: string;
  purchaserName: string;
  utr: string;
  transactionRemarks: string;
  paymentStatus: number;
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

export default function FailedTransactionPage() {
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

  // Single Verification Modal state (retained for viewing UTR details)
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);
  const [detailInvoice, setDetailInvoice] = useState<any>(null);
  const [fetchingDetail, setFetchingDetail] = useState(false);

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
      let url = 'http://localhost:5000/api/billing/invoices?status=2';
      const params = [];
      if (sId) params.push(`stateId=${sId}`);
      if (c) params.push(`city=${encodeURIComponent(c)}`);
      if (pId) params.push(`projectId=${pId}`);

      if (params.length > 0) {
        url += `&${params.join('&')}`;
      }

      const response = await fetch(url);
      const data = await response.json();
      if (response.ok) {
        setInvoices(data.Invoices || []);
      } else {
        setError(data.Msg || 'Failed to retrieve failed transactions.');
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
    try {
      const res = await fetch(`http://localhost:5000/api/billing/invoices/${id}`);
      const data = await res.json();
      if (res.ok && data.Status === 100) {
        setDetailInvoice(data.Invoice);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFetchingDetail(false);
    }
  };

  const filteredInvoices = invoices.filter(i => {
    const full = `${i.invoiceNo} ${i.invNo} ${i.projectName} ${i.purchaserName} ${i.agentName} ${i.utr}`.toLowerCase();
    return full.includes(searchTerm.toLowerCase());
  });

  // CSV export
  const exportCSV = () => {
    const headers = ['#', 'Invoice No', 'Date', 'Agent Name', 'City', 'Project Name', 'Size', 'Rate', 'Total', 'SGST', 'CGST', 'Grandtotal', 'UTR', 'Transaction Remarks', 'Payment Status'];
    const rows = filteredInvoices.map((inv, idx) => [
      idx + 1,
      inv.invNo || inv.invoiceNo,
      new Date(inv.addeddate).toLocaleDateString('en-GB').replace(/\//g, '-'),
      inv.agentName,
      inv.projectCity,
      inv.projectName,
      inv.size,
      inv.rate,
      inv.total,
      inv.sgstAmount,
      inv.cgstAmount,
      inv.grandtotal.toFixed(2),
      inv.utr,
      inv.transactionRemarks,
      'Failed'
    ]);
    const csvContent = [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8' });
    const encodedUri = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `failed_transactions_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(encodedUri);
  };

  return (
    <DashboardLayout role="admin">
      <div className="absolute top-10 right-10 w-[400px] h-[400px] rounded-full bg-red-500/5 blur-[100px] pointer-events-none print:hidden" />

      <div className="space-y-6">
        <div className="flex justify-between items-center print:hidden">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <AlertTriangle className="text-red-500" size={32} />
              Failed Transaction
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
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:border-red-500"
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
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:border-red-500 disabled:opacity-50"
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
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:border-red-500 disabled:opacity-50"
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
              className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:border-red-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Table list */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
                <Loader2 className="animate-spin text-red-500" size={32} />
                <span>Loading failed records...</span>
              </div>
            ) : filteredInvoices.length === 0 ? (
              <div className="py-20 text-center text-slate-500 text-sm">
                No failed transaction logs were found.
              </div>
            ) : (
              <table className="w-full border-collapse text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-3 text-center w-10">#</th>
                    <th className="py-3 px-3">Invoice No</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Agent Name</th>
                    <th className="py-3 px-3">City</th>
                    <th className="py-3 px-3">Project Name</th>
                    <th className="py-3 px-3 text-right">Size</th>
                    <th className="py-3 px-3 text-right">Rate</th>
                    <th className="py-3 px-3 text-right">Total</th>
                    <th className="py-3 px-3 text-right">SGST</th>
                    <th className="py-3 px-3 text-right">CGST</th>
                    <th className="py-3 px-3 text-right">Grandtotal</th>
                    <th className="py-3 px-3">UTR</th>
                    <th className="py-3 px-3">Transaction Remarks</th>
                    <th className="py-3 px-3 text-center w-24">Payment Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredInvoices.map((inv, idx) => (
                    <tr 
                      key={inv.invoiceId} 
                      className="hover:bg-slate-950/40 transition-colors"
                    >
                      <td className="py-3 px-3 text-center font-medium text-slate-500">{idx + 1}</td>
                      <td className="py-3 px-3 font-mono text-rose-400 font-semibold">{inv.invNo || inv.invoiceNo}</td>
                      <td className="py-3 px-3 text-slate-400">{new Date(inv.addeddate).toLocaleDateString('en-GB').replace(/\//g, '-')}</td>
                      <td className="py-3 px-3 font-semibold text-slate-200 truncate max-w-[110px]">{inv.agentName}</td>
                      <td className="py-3 px-3 text-slate-400 truncate max-w-[90px]">{inv.projectCity}</td>
                      <td className="py-3 px-3 font-medium text-white truncate max-w-[120px]">{inv.projectName}</td>
                      <td className="py-3 px-3 text-right font-mono text-[11px]">{inv.size}</td>
                      <td className="py-3 px-3 text-right font-mono text-[11px]">₹{inv.rate.toFixed(2)}</td>
                      <td className="py-3 px-3 text-right font-mono text-[11px]">₹{inv.total.toFixed(2)}</td>
                      <td className="py-3 px-3 text-right font-mono text-[11px] text-slate-450">₹{inv.sgstAmount.toFixed(2)}</td>
                      <td className="py-3 px-3 text-right font-mono text-[11px] text-slate-450">₹{inv.cgstAmount.toFixed(2)}</td>
                      <td className="py-3 px-3 text-right font-bold text-white whitespace-nowrap">₹ {Number(inv.grandtotal || 0).toFixed(2)}</td>
                      <td className="py-3 px-3 font-mono text-blue-400">
                        <span 
                          onClick={() => handleOpenReviewModal(inv.invoiceId)}
                          className="hover:underline cursor-pointer truncate max-w-[80px] block"
                        >
                          {inv.utr}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-400 truncate max-w-[125px]">{inv.transactionRemarks}</td>
                      <td className="py-3 px-3 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          Failed
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Payment Reference Modal (for viewing UTR snapshot) */}
      {selectedInvoiceId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fade-in print:hidden">
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

            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              {fetchingDetail ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
                  <Loader2 className="animate-spin text-blue-500" size={24} />
                  <span>Loading metadata...</span>
                </div>
              ) : detailInvoice ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
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
                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-850">
                      <span className="text-slate-400 block mb-0.5">Agent Remarks</span>
                      <span className="text-slate-200">{detailInvoice.transactionRemarks}</span>
                    </div>
                  )}

                  {detailInvoice.screenshot ? (
                    <div className="space-y-1.5">
                      <span className="text-slate-400 block font-semibold">Payment Screenshot:</span>
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
                    <div className="text-slate-500 italic bg-slate-950 p-3 rounded-lg border border-slate-850">
                      No screenshot uploaded.
                    </div>
                  )}

                  <div className="pt-4 border-t border-slate-800 flex justify-end">
                    <button
                      onClick={() => { setSelectedInvoiceId(null); setDetailInvoice(null); }}
                      className="px-4 py-2 bg-slate-850 hover:bg-slate-800 text-slate-300 font-semibold rounded-lg"
                    >
                      Close
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
