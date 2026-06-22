"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import TableToolbar, { TableFooter } from '@/components/TableToolbar';
import { Layers, Loader2, Compass, Link as LinkIcon } from 'lucide-react';

interface SimilarInvoice {
  olbId: number;
  invoiceNo: string;
}

interface SimilarProperty {
  olbId: number;
  invoiceNo: string;
  acceptDate: string | null;
  projectName: string;
  projectCity: string;
  purchaserName: string;
  preparedDate: string | null;
  sentDate: string | null;
  similarInvoices: SimilarInvoice[];
}

const COLUMNS = [
  { key: 'invoiceNo', label: 'Invoice No' },
  { key: 'similarInvoiceNo', label: 'Similar Invoice No' },
  { key: 'date', label: 'Date' },
  { key: 'printingTime', label: 'Printing Time' },
  { key: 'projectName', label: 'Project Name' },
  { key: 'projectCity', label: 'Project City' },
  { key: 'purchaserName', label: 'Purchaser Name' },
  { key: 'preparedDate', label: 'Prepared Date' },
  { key: 'sentDate', label: 'Sent Date' },
  { key: 'acceptDate', label: 'Accept Date' }
];

export default function AgentSimilarPropertyPage() {
  const [records, setRecords] = useState<SimilarProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // DataTables toolbar and footer states
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleColumns, setVisibleColumns] = useState<string[]>(COLUMNS.map(c => c.key));
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchSimilarProperties = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('http://localhost:5000/api/drafts/similar-properties-list', { credentials: 'include' });
      const data = await response.json();
      if (response.ok) {
        setRecords(data.Records || []);
      } else {
        setError(data.Msg || 'Failed to retrieve similar properties list.');
      }
    } catch (err) {
      console.error(err);
      setError('Cannot connect to API server. Ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSimilarProperties();
  }, []);

  const filteredRecords = records.filter(r => {
    const similarInvNos = r.similarInvoices.map(si => si.invoiceNo).join(' ');
    const fullText = `${r.invoiceNo} ${similarInvNos} ${r.projectName} ${r.projectCity} ${r.purchaserName}`.toLowerCase();
    return fullText.includes(searchTerm.toLowerCase());
  });

  const displayedRecords = pageSize === -1
    ? filteredRecords
    : filteredRecords.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const copyTable = () => {
    const text = filteredRecords.map((r, idx) => {
      const acceptDate = r.acceptDate ? new Date(r.acceptDate).toLocaleDateString('en-IN') : 'N/A';
      const acceptTime = r.acceptDate ? new Date(r.acceptDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : 'N/A';
      const preparedDate = r.preparedDate ? new Date(r.preparedDate).toLocaleDateString('en-IN') : 'N/A';
      const sentDate = r.sentDate ? new Date(r.sentDate).toLocaleDateString('en-IN') : 'N/A';
      const similarStr = r.similarInvoices.map(si => si.invoiceNo).join(', ');

      return `${idx + 1}\t${r.invoiceNo}\t${similarStr}\t${acceptDate}\t${acceptTime}\t${r.projectName}\t${r.projectCity}\t${r.purchaserName}\t${preparedDate}\t${sentDate}\t${acceptDate}`;
    }).join('\n');
    navigator.clipboard.writeText(text);
    alert('Table copied to clipboard!');
  };

  const exportCSV = () => {
    const headers = ["#", "Invoice No", "Similar Invoice No", "Date", "Printing Time", "Project Name", "Project City", "Purchaser Name", "Prepared Date", "Sent Date", "Accept Date"];
    const rows = filteredRecords.map((r, idx) => {
      const acceptDate = r.acceptDate ? new Date(r.acceptDate).toLocaleDateString('en-IN') : 'N/A';
      const acceptTime = r.acceptDate ? new Date(r.acceptDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : 'N/A';
      const preparedDate = r.preparedDate ? new Date(r.preparedDate).toLocaleDateString('en-IN') : 'N/A';
      const sentDate = r.sentDate ? new Date(r.sentDate).toLocaleDateString('en-IN') : 'N/A';
      const similarStr = r.similarInvoices.map(si => si.invoiceNo).join(', ');

      return [
        idx + 1,
        r.invoiceNo,
        similarStr,
        acceptDate,
        acceptTime,
        r.projectName,
        r.projectCity,
        r.purchaserName,
        preparedDate,
        sentDate,
        acceptDate
      ];
    });

    const csvContent = [headers.join(","), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8' });
    const encodedUri = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `similar_properties_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(encodedUri);
  };

  return (
    <DashboardLayout role="agent">
      <div className="absolute top-10 right-10 w-[400px] h-[400px] rounded-full bg-blue-500/5 blur-[100px] pointer-events-none" />

      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <Layers className="text-blue-500" size={32} />
            Similar Property Reports
          </h2>
          <p className="text-slate-400 text-sm mt-1">Audit matching survey details and duplicates among your registered properties</p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        <TableToolbar
          totalEntries={records.length}
          filteredEntriesCount={filteredRecords.length}
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

        {/* Similar properties table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
                <Loader2 className="animate-spin text-blue-500" size={28} />
                <span>Comparing properties survey index...</span>
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="py-20 text-center text-slate-500 text-sm">
                No similar properties detected.
              </div>
            ) : (
              <table className="w-full border-collapse text-left text-sm text-slate-300">
                <thead className="bg-slate-950 text-slate-400 text-xs uppercase font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-4 px-6 text-center w-12">#</th>
                    {visibleColumns.includes('invoiceNo') && <th className="py-4 px-6">Invoice No</th>}
                    {visibleColumns.includes('similarInvoiceNo') && <th className="py-4 px-6">Similar Invoice No</th>}
                    {visibleColumns.includes('date') && <th className="py-4 px-6">Date</th>}
                    {visibleColumns.includes('printingTime') && <th className="py-4 px-6">Printing Time</th>}
                    {visibleColumns.includes('projectName') && <th className="py-4 px-6">Project Name</th>}
                    {visibleColumns.includes('projectCity') && <th className="py-4 px-6">Project City</th>}
                    {visibleColumns.includes('purchaserName') && <th className="py-4 px-6">Purchaser Name</th>}
                    {visibleColumns.includes('preparedDate') && <th className="py-4 px-6">Prepared Date</th>}
                    {visibleColumns.includes('sentDate') && <th className="py-4 px-6">Sent Date</th>}
                    {visibleColumns.includes('acceptDate') && <th className="py-4 px-6">Accept Date</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {displayedRecords.map((r, idx) => {
                    const acceptDate = r.acceptDate ? new Date(r.acceptDate).toLocaleDateString('en-IN') : 'N/A';
                    const acceptTime = r.acceptDate ? new Date(r.acceptDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : 'N/A';
                    const preparedDate = r.preparedDate ? new Date(r.preparedDate).toLocaleDateString('en-IN') : 'N/A';
                    const sentDate = r.sentDate ? new Date(r.sentDate).toLocaleDateString('en-IN') : 'N/A';

                    return (
                      <tr key={r.olbId} className="hover:bg-slate-950/40 transition-colors">
                        <td className="py-4 px-6 text-center font-medium text-slate-500">
                          {pageSize === -1 ? idx + 1 : (currentPage - 1) * pageSize + idx + 1}
                        </td>
                        {visibleColumns.includes('invoiceNo') && (
                          <td className="py-4 px-6 font-mono text-xs">
                            <Link href={`/pay_agent?oid=${r.olbId}`} className="text-blue-450 hover:underline font-semibold">
                              {r.invoiceNo}
                            </Link>
                          </td>
                        )}
                        {visibleColumns.includes('similarInvoiceNo') && (
                          <td className="py-4 px-6 font-mono text-xs max-w-xs truncate">
                            <div className="flex flex-wrap gap-1.5">
                              {r.similarInvoices.map((si, sidx) => (
                                <React.Fragment key={si.olbId}>
                                  {sidx > 0 && <span className="text-slate-650 font-sans">,</span>}
                                  <Link href={`/pay_agent?oid=${si.olbId}`} className="text-blue-450 hover:underline">
                                    {si.invoiceNo}
                                  </Link>
                                </React.Fragment>
                              ))}
                            </div>
                          </td>
                        )}
                        {visibleColumns.includes('date') && (
                          <td className="py-4 px-6 font-mono text-xs text-slate-400">{acceptDate}</td>
                        )}
                        {visibleColumns.includes('printingTime') && (
                          <td className="py-4 px-6 font-mono text-xs text-slate-450">{acceptTime}</td>
                        )}
                        {visibleColumns.includes('projectName') && (
                          <td className="py-4 px-6 text-white font-medium">{r.projectName}</td>
                        )}
                        {visibleColumns.includes('projectCity') && (
                          <td className="py-4 px-6 text-slate-350">{r.projectCity}</td>
                        )}
                        {visibleColumns.includes('purchaserName') && (
                          <td className="py-4 px-6 text-slate-300">{r.purchaserName}</td>
                        )}
                        {visibleColumns.includes('preparedDate') && (
                          <td className="py-4 px-6 font-mono text-xs text-slate-400">{preparedDate}</td>
                        )}
                        {visibleColumns.includes('sentDate') && (
                          <td className="py-4 px-6 font-mono text-xs text-slate-400">{sentDate}</td>
                        )}
                        {visibleColumns.includes('acceptDate') && (
                          <td className="py-4 px-6 font-mono text-xs text-slate-400">{acceptDate}</td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          <TableFooter
            filteredEntriesCount={filteredRecords.length}
            totalEntries={records.length}
            currentPage={currentPage}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
