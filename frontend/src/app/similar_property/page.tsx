"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { Loader2, AlertCircle, FileSpreadsheet, Printer, Copy } from 'lucide-react';

interface SimilarInvoice {
  olbId: number;
  invoiceNo: string;
}

interface SimilarRecord {
  olbId: number;
  invoiceNo: string;
  acceptDate?: string;
  projectName: string;
  projectCity: string;
  purchaserName: string;
  preparedDate?: string;
  sentDate?: string;
  similarInvoices: SimilarInvoice[];
}

export default function SimilarPropertyPage() {
  const [records, setRecords] = useState<SimilarRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSimilarRecords();
  }, []);

  const fetchSimilarRecords = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('http://localhost:5000/api/drafts/similar-properties-list');
      const data = await response.json();
      if (response.ok) {
        setRecords(data.Records || []);
      } else {
        setError(data.Error || 'Failed to retrieve duplicate survey listings.');
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

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return 'N/A';
      return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch {
      return 'N/A';
    }
  };

  const exportToCSV = () => {
    const headers = [
      '#',
      'Invoice No',
      'Similar Invoice Nos',
      'Date',
      'Printing Time',
      'Project Name',
      'Project City',
      'Purchaser Name',
      'Prepared Date',
      'Sent Date',
      'Accept Date'
    ];

    const rows = records.map((rec, idx) => {
      const similarNos = rec.similarInvoices.map(s => s.invoiceNo).join(' | ');
      return [
        idx + 1,
        rec.invoiceNo || 'N/A',
        similarNos || 'N/A',
        formatDate(rec.acceptDate),
        formatTime(rec.acceptDate),
        rec.projectName,
        rec.projectCity,
        rec.purchaserName,
        formatDate(rec.preparedDate),
        formatDate(rec.sentDate),
        formatDate(rec.acceptDate)
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
    
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8' });
    const encodedUri = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `similar_properties_report_${new Date().toISOString().slice(0,10)}.csv`);
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
              <Copy className="text-blue-500" size={32} />
              Similar Properties Matcher
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Tracks and flags duplicate land/building survey parameter drafts registered within the database.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={exportToCSV}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-sm transition-all flex items-center gap-2 border border-slate-700 cursor-pointer"
            >
              <FileSpreadsheet size={16} />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-sm transition-all flex items-center gap-2 border border-slate-700 cursor-pointer"
            >
              <Printer size={16} />
              <span>Print Report</span>
            </button>
          </div>
        </div>

        <div className="print:block hidden mb-6">
          <h2 className="text-2xl font-bold text-black text-center">DAINNA - Similar Survey Properties</h2>
          <p className="text-black text-xs text-center">Generated on: {new Date().toLocaleString()}</p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3 print:hidden">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Table list */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg overflow-hidden print:border-0 print:shadow-none print:bg-white">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400 print:hidden">
                <Loader2 className="animate-spin text-blue-500" size={28} />
                <span>Scanning database for duplicates...</span>
              </div>
            ) : records.length === 0 ? (
              <div className="py-20 text-center text-slate-500 text-sm print:text-black">
                No similar property entries detected. System checks are clean.
              </div>
            ) : (
              <table className="w-full border-collapse text-left text-sm text-slate-300 print:text-black">
                <thead className="bg-slate-950 text-slate-400 text-xs uppercase font-semibold border-b border-slate-800 print:bg-slate-100 print:text-black print:border-black">
                  <tr>
                    <th className="py-4 px-4 text-center w-12">#</th>
                    <th className="py-4 px-4">Invoice No</th>
                    <th className="py-4 px-4">Similar Invoice Nos</th>
                    <th className="py-4 px-4">Date</th>
                    <th className="py-4 px-4">Printing Time</th>
                    <th className="py-4 px-4">Project Name</th>
                    <th className="py-4 px-4">Project City</th>
                    <th className="py-4 px-4">Purchaser Name</th>
                    <th className="py-4 px-4">Prepared Date</th>
                    <th className="py-4 px-4">Sent Date</th>
                    <th className="py-4 px-4">Accept Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 print:divide-black">
                  {records.map((rec, idx) => (
                    <tr key={rec.olbId} className="hover:bg-slate-950/40 transition-colors print:hover:bg-transparent">
                      <td className="py-3.5 px-4 text-center font-medium text-slate-500 print:text-black">{idx + 1}</td>
                      <td className="py-3.5 px-4 font-semibold text-white print:text-black">
                        <Link href={`/pay_advocate?oid=${rec.olbId}`} className="text-blue-400 hover:text-blue-300 hover:underline">
                          {rec.invoiceNo}
                        </Link>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1.5 print:block print:space-x-1">
                          {rec.similarInvoices.map(s => (
                            <Link
                              key={s.olbId}
                              href={`/pay_advocate?oid=${s.olbId}`}
                              className="px-2 py-0.5 rounded text-xs font-semibold bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all print:bg-transparent print:text-black print:underline"
                            >
                              {s.invoiceNo}
                            </Link>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs">{formatDate(rec.acceptDate)}</td>
                      <td className="py-3.5 px-4 text-xs">{formatTime(rec.acceptDate)}</td>
                      <td className="py-3.5 px-4 font-medium">{rec.projectName}</td>
                      <td className="py-3.5 px-4 text-slate-450 print:text-black">{rec.projectCity}</td>
                      <td className="py-3.5 px-4 text-slate-400 print:text-black">{rec.purchaserName}</td>
                      <td className="py-3.5 px-4 text-xs">{formatDate(rec.preparedDate)}</td>
                      <td className="py-3.5 px-4 text-xs">{formatDate(rec.sentDate)}</td>
                      <td className="py-3.5 px-4 text-xs">{formatDate(rec.acceptDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
