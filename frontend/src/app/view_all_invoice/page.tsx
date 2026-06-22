"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import TableToolbar, { TableFooter } from '@/components/TableToolbar';
import { Landmark, Loader2, AlertCircle, Eye } from 'lucide-react';

interface Invoice {
  invoiceId: number;
  invoiceNo: string;
  invNo: string;
  invoiceDate: string;
  projectName: string;
  size: number;
  rate: number;
  finalRate: number;
  total: number;
  sgstAmount: number;
  cgstAmount: number;
  grandtotal: number;
  paymentStatus: number;
  addeddate: string;
  purchaserName: string;
  olbId: number | null;
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
  { key: 'projectName', label: 'Project Name' },
  { key: 'size', label: 'Size' },
  { key: 'rate', label: 'Rate' },
  { key: 'total', label: 'Total' },
  { key: 'sgst', label: 'SGST' },
  { key: 'cgst', label: 'CGST' },
  { key: 'grandtotal', label: 'Grandtotal' }
];

export default function ViewAllInvoicePage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState<any | null>(null);

  // DataTables state variables
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleColumns, setVisibleColumns] = useState<string[]>(COLUMNS.map(c => c.key));
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchSessionAndProjects = async () => {
    try {
      const profileRes = await fetch('http://localhost:5000/api/users/profile', { credentials: 'include' });
      const profileData = await profileRes.json();
      if (profileRes.ok && profileData.User) {
        setCurrentUser(profileData.User);
        const city = profileData.User.workingCity || '';
        
        const projectsRes = await fetch(`http://localhost:5000/api/projects?City=${city}`, { credentials: 'include' });
        const projectsData = await projectsRes.json();
        if (projectsRes.ok) {
          setProjects(projectsData.Projects || []);
        }
      }
    } catch (err) {
      console.error('Session/Projects load failed:', err);
    }
  };

  const fetchInvoices = async (projectId = '') => {
    setLoading(true);
    setError('');
    try {
      const url = `http://localhost:5000/api/billing/invoices?status=1&excludeCompleted=true${projectId ? `&projectId=${projectId}` : ''}`;
      const response = await fetch(url, { credentials: 'include' });
      const data = await response.json();
      if (response.ok) {
        setInvoices(data.Invoices || []);
      } else {
        setError(data.Msg || 'Failed to retrieve invoices.');
      }
    } catch (err) {
      console.error(err);
      setError('Cannot connect to API server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessionAndProjects();
  }, []);

  useEffect(() => {
    fetchInvoices(selectedProjectId);
    setCurrentPage(1);
  }, [selectedProjectId]);

  const filteredInvoices = invoices.filter(i => {
    const full = `${i.invNo} ${i.invoiceNo} ${i.projectName} ${i.purchaserName}`.toLowerCase();
    return full.includes(searchTerm.toLowerCase());
  });

  const displayedInvoices = pageSize === -1
    ? filteredInvoices
    : filteredInvoices.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const copyTable = () => {
    const text = filteredInvoices.map((inv, idx) => {
      const date = inv.addeddate ? new Date(inv.addeddate).toLocaleDateString('en-IN') : 'N/A';
      const time = inv.addeddate ? new Date(inv.addeddate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : 'N/A';
      return `${idx + 1}\t${inv.invNo || 'N/A'}\t${date}\t${time}\t${inv.projectName}\t${inv.size}\t${inv.rate}\t${inv.total}\t₹${inv.sgstAmount.toFixed(2)}\t₹${inv.cgstAmount.toFixed(2)}\t₹${inv.grandtotal.toFixed(2)}`;
    }).join('\n');
    navigator.clipboard.writeText(text);
    alert('Table copied to clipboard!');
  };

  const exportCSV = () => {
    const headers = ["#", "Invoice No", "Date", "Time", "Project Name", "Size", "Rate", "Total", "SGST", "CGST", "Grandtotal"];
    const rows = filteredInvoices.map((inv, idx) => {
      const date = inv.addeddate ? new Date(inv.addeddate).toLocaleDateString('en-IN') : 'N/A';
      const time = inv.addeddate ? new Date(inv.addeddate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : 'N/A';
      return [
        idx + 1,
        inv.invNo || 'N/A',
        date,
        time,
        inv.projectName || '',
        inv.size || 0,
        inv.rate || 0,
        inv.total || 0,
        `₹${inv.sgstAmount.toFixed(2)}`,
        `₹${inv.cgstAmount.toFixed(2)}`,
        `₹${inv.grandtotal.toFixed(2)}`
      ];
    });

    let csvContent = [headers.join(","), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");
      
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8' });
    const encodedUri = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `success_payments_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
              <Landmark className="text-emerald-500" size={32} />
              Success Payments & Invoices
            </h2>
            <p className="text-slate-400 text-sm mt-1">Review finalized invoices, verified transactions, and accounting audit receipts</p>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm no-print">
            {error}
          </div>
        )}

        {/* Project Dropdown Filter (Legacy Style) */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl shadow-md no-print flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="w-full sm:w-64">
            <label className="block text-slate-400 text-xs font-semibold mb-1" htmlFor="project-filter">Project Name:</label>
            <select
              id="project-filter"
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
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
          onExportExcel={exportCSV}
          onExportCSV={exportCSV}
        />

        {/* Table list */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
                <Loader2 className="animate-spin text-blue-500" size={28} />
                <span>Loading payments list...</span>
              </div>
            ) : filteredInvoices.length === 0 ? (
              <div className="py-20 text-center text-slate-500 text-sm">
                No success transactions found.
              </div>
            ) : (
              <table className="w-full border-collapse text-left text-sm text-slate-300">
                <thead className="bg-slate-950 text-slate-400 text-xs uppercase font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-4 px-6 text-center w-12">#</th>
                    {visibleColumns.includes('invoiceNo') && <th className="py-4 px-6">Invoice No</th>}
                    {visibleColumns.includes('date') && <th className="py-4 px-6">Date</th>}
                    {visibleColumns.includes('time') && <th className="py-4 px-6">Time</th>}
                    {visibleColumns.includes('projectName') && <th className="py-4 px-6">Project Name</th>}
                    {visibleColumns.includes('size') && <th className="py-4 px-6 text-right">Size</th>}
                    {visibleColumns.includes('rate') && <th className="py-4 px-6 text-right">Rate</th>}
                    {visibleColumns.includes('total') && <th className="py-4 px-6 text-right">Total</th>}
                    {visibleColumns.includes('sgst') && <th className="py-4 px-6 text-right">SGST</th>}
                    {visibleColumns.includes('cgst') && <th className="py-4 px-6 text-right">CGST</th>}
                    {visibleColumns.includes('grandtotal') && <th className="py-4 px-6 text-right">Grandtotal</th>}
                    <th className="py-4 px-6 text-center w-16 no-print">#</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {displayedInvoices.map((inv, idx) => {
                    const date = inv.addeddate ? new Date(inv.addeddate).toLocaleDateString('en-IN') : 'N/A';
                    const time = inv.addeddate ? new Date(inv.addeddate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : 'N/A';

                    return (
                      <tr key={inv.invoiceId} className="hover:bg-slate-950/40 transition-colors">
                        <td className="py-4 px-6 text-center font-medium text-slate-500">
                          {pageSize === -1 ? idx + 1 : (currentPage - 1) * pageSize + idx + 1}
                        </td>
                        {visibleColumns.includes('invoiceNo') && (
                          <td className="py-4 px-6 text-white font-mono text-xs font-semibold">
                            {inv.invNo || 'N/A'}
                          </td>
                        )}
                        {visibleColumns.includes('date') && (
                          <td className="py-4 px-6 font-mono text-xs text-slate-350">{date}</td>
                        )}
                        {visibleColumns.includes('time') && (
                          <td className="py-4 px-6 font-mono text-xs text-slate-450">{time}</td>
                        )}
                        {visibleColumns.includes('projectName') && (
                          <td className="py-4 px-6 text-white font-medium">{inv.projectName}</td>
                        )}
                        {visibleColumns.includes('size') && (
                          <td className="py-4 px-6 text-right font-mono text-xs">{inv.size}</td>
                        )}
                        {visibleColumns.includes('rate') && (
                          <td className="py-4 px-6 text-right font-mono text-xs">₹{inv.rate.toFixed(2)}</td>
                        )}
                        {visibleColumns.includes('total') && (
                          <td className="py-4 px-6 text-right font-mono text-xs text-slate-400">₹{inv.total.toFixed(2)}</td>
                        )}
                        {visibleColumns.includes('sgst') && (
                          <td className="py-4 px-6 text-right font-mono text-xs text-slate-400">₹{inv.sgstAmount.toFixed(2)}</td>
                        )}
                        {visibleColumns.includes('cgst') && (
                          <td className="py-4 px-6 text-right font-mono text-xs text-slate-400">₹{inv.cgstAmount.toFixed(2)}</td>
                        )}
                        {visibleColumns.includes('grandtotal') && (
                          <td className="py-4 px-6 text-right font-bold text-white text-base">₹{inv.grandtotal.toFixed(2)}</td>
                        )}
                        <td className="py-4 px-6 text-center no-print">
                          {inv.olbId ? (
                            <Link href={`/pay_agent?oid=${inv.olbId}`} className="text-blue-450 hover:text-blue-300 transition-colors inline-block" title="View Details">
                              <Eye size={16} />
                            </Link>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          <TableFooter
            filteredEntriesCount={filteredInvoices.length}
            totalEntries={invoices.length}
            currentPage={currentPage}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
