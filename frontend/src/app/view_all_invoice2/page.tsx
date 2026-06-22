"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import TableToolbar, { TableFooter } from '@/components/TableToolbar';
import { Landmark, Printer, Search, Loader2, FileSpreadsheet } from 'lucide-react';

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
  addeddate: string;
  purchaserName: string;
  ownerName: string;
}

interface Project {
  projectId: number;
  projectName: string;
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

export default function ViewAllInvoice2Page() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // DataTables toolbar and pagination states
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleColumns, setVisibleColumns] = useState<string[]>(COLUMNS.map(c => c.key));
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchSessionAndProjects = async () => {
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

  const fetchInvoices = async (projectId = '') => {
    setLoading(true);
    setError('');
    try {
      const url = `http://localhost:5000/api/billing/invoices?status=1${projectId ? `&projectId=${projectId}` : ''}`;
      const response = await fetch(url, { credentials: 'include' });
      const data = await response.json();
      if (response.ok) {
        setInvoices(data.Invoices || []);
      } else {
        setError(data.Msg || 'Failed to retrieve invoice reports.');
      }
    } catch (err) {
      console.error(err);
      setError('Cannot connect to API server. Ensure the backend is running.');
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

  const handlePrint = (inv: Invoice) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice - ${inv.invNo || inv.invoiceNo}</title>
          <style>
            body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 40px; color: #333; line-height: 1.5; }
            .header { border-bottom: 2px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
            .header h1 { margin: 0; color: #1e3a8a; font-size: 28px; }
            .invoice-details { display: grid; grid-template-cols: 1fr 1fr; gap: 20px; margin-bottom: 40px; }
            .details-block h3 { margin-top: 0; border-bottom: 1px solid #ddd; padding-bottom: 5px; color: #475569; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th { background: #f8fafc; font-weight: bold; text-align: left; }
            th, td { padding: 12px; border: 1px solid #e2e8f0; font-size: 14px; }
            .text-right { text-align: right; }
            .totals { margin-left: auto; width: 300px; margin-top: 20px; }
            .totals table { margin-bottom: 0; }
            .totals td { border: none; padding: 6px 12px; }
            .grand-total { font-weight: bold; font-size: 16px; border-top: 2px double #3b82f6 !important; }
            .footer { margin-top: 60px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px dashed #cbd5e1; padding-top: 20px; }
            @media print {
              body { padding: 0; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1>DAINNA Web Portal</h1>
              <p>Property Legal Agreement Solutions</p>
            </div>
            <div class="text-right">
              <h2>INVOICE</h2>
              <p><strong>Invoice No:</strong> ${inv.invNo || inv.invoiceNo}</p>
              <p><strong>Date:</strong> ${inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString() : new Date(inv.addeddate).toLocaleDateString()}</p>
            </div>
          </div>
          
          <div class="invoice-details">
            <div class="details-block">
              <h3>Property & Project</h3>
              <p><strong>Project:</strong> ${inv.projectName}</p>
              <p><strong>Plot Size:</strong> ${inv.size} SqMt</p>
            </div>
            <div class="details-block">
              <h3>Customer Information</h3>
              <p><strong>Purchaser:</strong> ${inv.purchaserName || 'N/A'}</p>
              <p><strong>Owner:</strong> ${inv.ownerName || 'N/A'}</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th class="text-right">Rate / SqMt</th>
                <th class="text-right">Size (SqMt)</th>
                <th class="text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Agreement Drafting and Advocate Review Verification charges</td>
                <td class="text-right">₹${inv.finalRate.toFixed(2)}</td>
                <td class="text-right">${inv.size}</td>
                <td class="text-right">₹${inv.total.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          <div class="totals">
            <table>
              <tr>
                <td>SGST:</td>
                <td class="text-right">₹${inv.sgstAmount.toFixed(2)}</td>
              </tr>
              <tr>
                <td>CGST:</td>
                <td class="text-right">₹${inv.cgstAmount.toFixed(2)}</td>
              </tr>
              <tr class="grand-total">
                <td>Grand Total:</td>
                <td class="text-right">₹${inv.grandtotal.toFixed(2)}</td>
              </tr>
            </table>
          </div>

          <div class="footer">
            <p>This is a computer-generated transaction invoice sheet and requires no physical signature.</p>
            <p>Dainna Legal Operations Console &copy; 2026</p>
          </div>

          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const filteredInvoices = invoices.filter(i => {
    const full = `${i.invoiceNo} ${i.invNo} ${i.projectName} ${i.purchaserName}`.toLowerCase();
    return full.includes(searchTerm.toLowerCase());
  });

  const displayedInvoices = pageSize === -1
    ? filteredInvoices
    : filteredInvoices.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const copyTable = () => {
    const text = filteredInvoices.map((inv, idx) => {
      const date = inv.addeddate ? new Date(inv.addeddate).toLocaleDateString('en-IN') : 'N/A';
      const time = inv.addeddate ? new Date(inv.addeddate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : 'N/A';
      return `${idx + 1}\t${inv.invNo || 'N/A'}\t${date}\t${time}\t${inv.projectName}\t${inv.size}\t${inv.finalRate}\t${inv.total}\t${inv.sgstAmount}\t${inv.cgstAmount}\t${inv.grandtotal}`;
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
        inv.projectName,
        inv.size,
        inv.finalRate,
        inv.total,
        inv.sgstAmount,
        inv.cgstAmount,
        inv.grandtotal
      ];
    });

    let csvContent = [headers.join(","), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");
      
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8' });
    const encodedUri = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `invoices_${new Date().toISOString().slice(0,10)}.csv`);
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
              <FileSpreadsheet className="text-blue-500" size={32} />
              Invoice Audits & Reports
            </h2>
            <p className="text-slate-400 text-sm mt-1">Generate print-ready copy worksheets and export layout receipts for customer billing records</p>
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
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
            >
              <option value="">-- SELECT --</option>
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

        {/* Invoices table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
                <Loader2 className="animate-spin text-blue-500" size={28} />
                <span>Loading report ledgers...</span>
              </div>
            ) : filteredInvoices.length === 0 ? (
              <div className="py-20 text-center text-slate-500 text-sm">
                No printable payment receipts found.
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
                <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                  {displayedInvoices.map((inv, idx) => {
                    const date = inv.addeddate ? new Date(inv.addeddate).toLocaleDateString('en-IN') : 'N/A';
                    const time = inv.addeddate ? new Date(inv.addeddate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : 'N/A';

                    return (
                      <tr key={inv.invoiceId} className="hover:bg-slate-950/40 transition-colors">
                        <td className="py-4 px-6 text-center font-sans font-medium text-slate-500">
                          {pageSize === -1 ? idx + 1 : (currentPage - 1) * pageSize + idx + 1}
                        </td>
                        {visibleColumns.includes('invoiceNo') && (
                          <td className="py-4 px-6 text-white font-semibold">{inv.invNo || 'N/A'}</td>
                        )}
                        {visibleColumns.includes('date') && (
                          <td className="py-4 px-6 text-slate-350">{date}</td>
                        )}
                        {visibleColumns.includes('time') && (
                          <td className="py-4 px-6 text-slate-450">{time}</td>
                        )}
                        {visibleColumns.includes('projectName') && (
                          <td className="py-4 px-6 text-white font-sans font-medium text-sm">{inv.projectName}</td>
                        )}
                        {visibleColumns.includes('size') && (
                          <td className="py-4 px-6 text-right">{inv.size}</td>
                        )}
                        {visibleColumns.includes('rate') && (
                          <td className="py-4 px-6 text-right">₹{inv.finalRate.toFixed(2)}</td>
                        )}
                        {visibleColumns.includes('total') && (
                          <td className="py-4 px-6 text-right text-slate-400">₹{inv.total.toFixed(2)}</td>
                        )}
                        {visibleColumns.includes('sgst') && (
                          <td className="py-4 px-6 text-right text-slate-450">₹{inv.sgstAmount.toFixed(2)}</td>
                        )}
                        {visibleColumns.includes('cgst') && (
                          <td className="py-4 px-6 text-right text-slate-450">₹{inv.cgstAmount.toFixed(2)}</td>
                        )}
                        {visibleColumns.includes('grandtotal') && (
                          <td className="py-4 px-6 text-right font-bold text-white text-sm">₹{inv.grandtotal.toFixed(2)}</td>
                        )}
                        <td className="py-4 px-6 text-center no-print">
                          <button
                            onClick={() => handlePrint(inv)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded transition-colors cursor-pointer"
                            title="Print"
                          >
                            <Printer size={14} />
                          </button>
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
