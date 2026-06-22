"use client";

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import TableToolbar, { TableFooter, ColumnOption } from '@/components/TableToolbar';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  ArrowLeft, Loader2, AlertCircle, Eye, Printer, FileSpreadsheet 
} from 'lucide-react';

interface Invoice {
  invoiceId: number;
  invNo: string;
  addeddate: string;
  size: number;
  rate: number;
  grandtotal: number;
  advAmount: number;
  paymentStatus: number;
  advPaymentStatus: number;
  olbId: number;
  customizeReadymade?: number | null;
  preparedDate?: string | null;
  sentDate?: string | null;
  draftStatus?: number | null;
}

interface PaymentDetail {
  advPayId: number;
  transactionId: string;
  transactionDate: string;
  paymentMethod: string;
  remarks: string;
  amount: number;
  paymentStatus: number;
  paymentRemarks: string;
  advocateName: string;
  agentName: string;
  projectName: string;
  projectCity: string;
  projectState: string;
  invoices: Invoice[];
}

function ViewAdvocateTransHistoryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pid = searchParams.get('pid');

  const [payment, setPayment] = useState<PaymentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Search input state
  const [searchTerm, setSearchTerm] = useState('');

  // Table options states
  const colOptions: ColumnOption[] = [
    { key: 'invNo', label: 'Draft No' },
    { key: 'addeddate', label: 'Date' },
    { key: 'addedtime', label: 'Time' },
    { key: 'size', label: 'Size' },
    { key: 'agentName', label: 'Agent Name' },
    { key: 'category', label: 'Category' },
    { key: 'preparedDate', label: 'Prepared Date' },
    { key: 'sentDate', label: 'Sent Date' },
    { key: 'status', label: 'Status' },
    { key: 'amount', label: 'Amount (₹)' }
  ];

  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);
  const [pageSize, setPageSize] = useState(-1);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setVisibleColumns(colOptions.map(c => c.key));
  }, []);

  const isColVisible = (key: string) => visibleColumns.includes(key);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, pageSize]);

  const fetchPaymentDetail = async () => {
    if (!pid) {
      setError('Invalid Payout ID.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`http://localhost:5000/api/billing/adv-payments/${pid}`);
      const data = await response.json();
      if (response.ok && data.Payment) {
        setPayment(data.Payment);
      } else {
        setError(data.Error || 'Failed to retrieve payout details.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection to backend API failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentDetail();
  }, [pid]);

  // Filter invoices locally based on search input
  const filteredInvoices = useMemo(() => {
    if (!payment) return [];
    return payment.invoices.filter(inv => {
      const q = searchTerm.toLowerCase();
      return (inv.invNo || '').toLowerCase().includes(q) ||
             (payment.agentName || '').toLowerCase().includes(q) ||
             (getCategoryText(inv.customizeReadymade) || '').toLowerCase().includes(q) ||
             (getDraftStatusTextRaw(inv.draftStatus) || '').toLowerCase().includes(q);
    });
  }, [payment, searchTerm]);

  const paginatedInvoices = useMemo(() => {
    if (pageSize === -1) return filteredInvoices;
    const start = (currentPage - 1) * pageSize;
    return filteredInvoices.slice(start, start + pageSize);
  }, [filteredInvoices, currentPage, pageSize]);

  // Calculate totals
  const totals = useMemo(() => {
    const totalSize = filteredInvoices.reduce((sum, inv) => sum + inv.size, 0);
    const totalAmount = filteredInvoices.reduce((sum, inv) => sum + ((inv.size * inv.rate) * 1.05), 0);
    return { size: totalSize, amount: totalAmount };
  }, [filteredInvoices]);


  const getStatusText = (statusNum: number) => {
    if (statusNum === 4) return <span className="text-amber-400 font-semibold">Sent / Pending</span>;
    if (statusNum === 1) return <span className="text-emerald-400 font-semibold">Success</span>;
    if (statusNum === 2) return <span className="text-rose-400 font-semibold">Failed</span>;
    return <span className="text-slate-400 font-semibold">Unknown</span>;
  };

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return 'N/A';
      return d.toLocaleDateString('en-GB').replace(/\//g, '-');
    } catch {
      return 'N/A';
    }
  };

  const getCategoryText = (cat?: number | null) => {
    if (cat === 1) return 'Customize';
    if (cat === 2) return 'Readymade';
    return 'N/A';
  };

  const getDraftStatusLabel = (statusNum?: number | null) => {
    switch (statusNum) {
      case 1:
        return <span className="text-red-400 font-semibold">Prepared Draft</span>;
      case 2:
        return <span className="text-indigo-400 font-semibold">Waiting for Advocate</span>;
      case 3:
        return <span className="text-amber-400 font-semibold">Received to Advocate</span>;
      case 4:
        return <span className="text-emerald-400 font-semibold">Complete Draft</span>;
      default:
        return <span className="text-slate-500">N/A</span>;
    }
  };

  const getDraftStatusTextRaw = (statusNum?: number | null) => {
    switch (statusNum) {
      case 1: return 'Prepared Draft';
      case 2: return 'Waiting for Advocate';
      case 3: return 'Received to Advocate';
      case 4: return 'Complete Draft';
      default: return 'N/A';
    }
  };

  const exportToCSV = () => {
    if (!payment) return;
    const headers = [
      '#', 
      'Draft No', 
      'Date', 
      'Time', 
      'Size', 
      'Agent Name', 
      'Category', 
      'Prepared Date', 
      'Sent Date', 
      'Status', 
      'Amount'
    ];
    const rows = payment.invoices.map((inv, idx) => {
      const date = new Date(inv.addeddate);
      const amountVal = (inv.size * inv.rate) * 1.05;
      return [
        idx + 1,
        inv.invNo || 'N/A',
        date.toLocaleDateString('en-GB').replace(/\//g, '-'),
        date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        inv.size.toFixed(2),
        payment.agentName,
        getCategoryText(inv.customizeReadymade),
        formatDate(inv.preparedDate),
        formatDate(inv.sentDate),
        getDraftStatusTextRaw(inv.draftStatus),
        amountVal.toFixed(2)
      ];
    });

    const totalSize = payment.invoices.reduce((sum, inv) => sum + inv.size, 0);
    const totalAmount = payment.invoices.reduce((sum, inv) => sum + ((inv.size * inv.rate) * 1.05), 0);
    rows.push(['', 'Total', '', '', totalSize.toFixed(2), '', '', '', '', '', totalAmount.toFixed(2)]);

    const contentText = [
        `"Payout Details for Transaction - ${payment.transactionId}"`,
        '',
        headers.join(','), 
        ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
      ].join('\n');
    
    const blob = new Blob(['\uFEFF' + contentText], { type: 'text/csv;charset=utf-8' });
    const encodedUri = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `payout_detail_${payment.transactionId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <DashboardLayout role="advocate">
        <div className="h-[60vh] flex flex-col items-center justify-center gap-3 text-slate-400">
          <Loader2 className="animate-spin text-blue-500" size={32} />
          <span>Loading transaction details...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !payment) {
    return (
      <DashboardLayout role="advocate">
        <div className="p-6 space-y-4 max-w-lg mx-auto bg-slate-900 border border-slate-800 rounded-xl mt-10">
          <div className="flex items-center gap-2.5 text-red-500 font-semibold mb-2">
            <AlertCircle size={24} />
            <span>Error Occurred</span>
          </div>
          <p className="text-slate-300 text-sm">{error || 'Payout details could not be loaded.'}</p>
          <button 
            onClick={() => router.push('/adv_trans_history')}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer font-sans"
          >
            Go Back
          </button>
        </div>
      </DashboardLayout>
    );
  }
  const handleCopyData = () => {
    if (!payment) return;
    const headers = [
      '#',
      ...colOptions.filter(c => isColVisible(c.key)).map(c => c.label)
    ];

    const rows = filteredInvoices.map((inv, idx) => {
      const date = new Date(inv.addeddate);
      const amountVal = (inv.size * inv.rate) * 1.05;

      const dataRow: any[] = [idx + 1];
      if (isColVisible('invNo')) dataRow.push(inv.invNo || 'N/A');
      if (isColVisible('addeddate')) dataRow.push(date.toLocaleDateString('en-IN'));
      if (isColVisible('addedtime')) dataRow.push(date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      if (isColVisible('size')) dataRow.push(inv.size.toFixed(2));
      if (isColVisible('agentName')) dataRow.push(payment.agentName);
      if (isColVisible('category')) dataRow.push(getCategoryText(inv.customizeReadymade));
      if (isColVisible('preparedDate')) dataRow.push(formatDate(inv.preparedDate));
      if (isColVisible('sentDate')) dataRow.push(formatDate(inv.sentDate));
      if (isColVisible('status')) dataRow.push(getDraftStatusTextRaw(inv.draftStatus));
      if (isColVisible('amount')) dataRow.push(amountVal.toFixed(2));
      return dataRow;
    });

    const content = [headers.join('\t'), ...rows.map(r => r.join('\t'))].join('\n');
    navigator.clipboard.writeText(content);
    alert('Table data copied to clipboard!');
  };

  const exportToCSVFormat = (type: 'csv' | 'excel') => {
    if (!payment) return;
    const headers = [
      '#',
      ...colOptions.filter(c => isColVisible(c.key)).map(c => c.label)
    ];

    const rows = filteredInvoices.map((inv, idx) => {
      const date = new Date(inv.addeddate);
      const amountVal = (inv.size * inv.rate) * 1.05;

      const dataRow: any[] = [idx + 1];
      if (isColVisible('invNo')) dataRow.push(inv.invNo || 'N/A');
      if (isColVisible('addeddate')) dataRow.push(date.toLocaleDateString('en-IN'));
      if (isColVisible('addedtime')) dataRow.push(date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      if (isColVisible('size')) dataRow.push(inv.size.toFixed(2));
      if (isColVisible('agentName')) dataRow.push(payment.agentName);
      if (isColVisible('category')) dataRow.push(getCategoryText(inv.customizeReadymade));
      if (isColVisible('preparedDate')) dataRow.push(formatDate(inv.preparedDate));
      if (isColVisible('sentDate')) dataRow.push(formatDate(inv.sentDate));
      if (isColVisible('status')) dataRow.push(getDraftStatusTextRaw(inv.draftStatus));
      if (isColVisible('amount')) dataRow.push(amountVal.toFixed(2));
      return dataRow;
    });

    const totalRow = ['Total'];
    colOptions.filter(c => isColVisible(c.key)).forEach(c => {
      if (c.key === 'size') {
        totalRow.push(totals.size.toFixed(2));
      } else if (c.key === 'amount') {
        totalRow.push(totals.amount.toFixed(2));
      } else {
        totalRow.push('');
      }
    });
    rows.push(totalRow);

    const separator = type === 'csv' ? ',' : '\t';
    const fileExtension = type === 'csv' ? 'csv' : 'xls';
    const mimeType = type === 'csv' ? 'text/csv;charset=utf-8' : 'application/vnd.ms-excel;charset=utf-8';

    const fileContent = [headers.join(separator), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(separator))].join('\n');
    
    const blob = new Blob(['\uFEFF' + fileContent], { type: mimeType });
    const encodedUri = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `payout_detail_${payment.transactionId}.${fileExtension}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <DashboardLayout role="advocate">
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
          }
          aside, header, button, .no-print, .filter-bar {
            display: none !important;
          }
          main, .flex-1, .p-6 {
            padding: 0 !important;
            margin: 0 !important;
            background-color: #ffffff !important;
          }
          .print-card {
            border: 1px solid #000000 !important;
            box-shadow: none !important;
            color: #000000 !important;
            background-color: #ffffff !important;
          }
          th, td {
            border: 1px solid #000000 !important;
            color: #000000 !important;
          }
        }
      `}} />

      <div className="space-y-6">
        
        {/* Navigation Actions */}
        <div className="flex justify-between items-center no-print bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm select-none">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.push('/adv_trans_history')}
              className="p-2 bg-slate-855 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-all flex items-center gap-1 cursor-pointer focus:outline-none"
            >
              <ArrowLeft size={16} />
              <span className="text-xs font-semibold">Back</span>
            </button>
            <h3 className="text-lg font-bold text-white font-sans">Draft Detail</h3>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={exportToCSV}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer border border-slate-700 font-sans"
            >
              <FileSpreadsheet size={14} />
              <span>Excel</span>
            </button>
            <button 
              onClick={handlePrint}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer border border-slate-700 font-sans"
            >
              <Printer size={14} />
              <span>Print</span>
            </button>
          </div>
        </div>

        {/* Master Payout Details Card */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl shadow-lg space-y-4 print-card">
          <h4 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2 font-sans">payout details</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
            <div>
              <span className="block text-slate-500 text-xs font-semibold font-sans">Transaction ID</span>
              <span className="text-white font-semibold block mt-1">{payment.transactionId || 'N/A'}</span>
            </div>
            <div>
              <span className="block text-slate-500 text-xs font-semibold font-sans">Date</span>
              <span className="text-slate-300 block mt-1">
                {payment.transactionDate ? new Date(payment.transactionDate).toLocaleDateString('en-IN') : 'N/A'}
              </span>
            </div>
            <div>
              <span className="block text-slate-500 text-xs font-semibold font-sans">Payment Method</span>
              <span className="text-slate-300 block mt-1">{payment.paymentMethod || 'N/A'}</span>
            </div>
            <div>
              <span className="block text-slate-500 text-xs font-semibold font-sans">Payout Status</span>
              <span className="block mt-1">{getStatusText(payment.paymentStatus)}</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm pt-2">
            <div>
              <span className="block text-slate-500 text-xs font-semibold font-sans">Remarks</span>
              <span className="text-slate-300 block mt-1">{payment.remarks || 'No transfer remarks.'}</span>
            </div>
            {payment.paymentRemarks && (
              <div>
                <span className="block text-slate-550 text-xs font-semibold font-sans">Status Update Remarks</span>
                <span className="text-slate-300 block mt-1">{payment.paymentRemarks}</span>
              </div>
            )}
          </div>
        </div>

        {/* Table Toolbar controls */}
        <TableToolbar
          totalEntries={payment.invoices.length}
          filteredEntriesCount={filteredInvoices.length}
          currentPage={currentPage}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
          onPageChange={setCurrentPage}
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          columns={colOptions}
          visibleColumns={visibleColumns}
          onVisibleColumnsChange={setVisibleColumns}
          onCopyData={handleCopyData}
          onExportExcel={() => exportToCSVFormat('excel')}
          onExportCSV={() => exportToCSVFormat('csv')}
          searchPlaceholder="Search invoices..."
        />

        {/* Invoices List Section */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg overflow-hidden print-card">
          <div className="p-4 bg-slate-900/50 border-b border-slate-800 flex justify-between items-center filter-bar select-none">
            <h4 className="text-base font-bold text-white font-sans">View Transaction</h4>
          </div>

          <div className="overflow-x-auto w-full scrollbar-thin">
            <table className="w-full border-collapse text-left text-sm text-slate-300 table-auto">
              <thead className="bg-slate-955 text-slate-400 text-xs uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4 text-center w-[50px]">#</th>
                  {isColVisible('invNo') && <th className="py-3.5 px-4 w-[130px]">Draft No</th>}
                  {isColVisible('addeddate') && <th className="py-3.5 px-4 w-[100px]">Date</th>}
                  {isColVisible('addedtime') && <th className="py-3.5 px-4 w-[80px]">Time</th>}
                  {isColVisible('size') && <th className="py-3.5 px-4 text-right w-[80px]">Size</th>}
                  {isColVisible('agentName') && <th className="py-3.5 px-4 w-[150px]">Agent Name</th>}
                  {isColVisible('category') && <th className="py-3.5 px-4 w-[110px]">Category</th>}
                  {isColVisible('preparedDate') && <th className="py-3.5 px-4 w-[115px]">Prepared Date</th>}
                  {isColVisible('sentDate') && <th className="py-3.5 px-4 w-[115px]">Sent Date</th>}
                  {isColVisible('status') && <th className="py-3.5 px-4 text-center w-[130px]">Status</th>}
                  {isColVisible('amount') && <th className="py-3.5 px-4 text-right w-[110px]">Amount (₹)</th>}
                  <th className="py-3.5 px-4 text-center w-[60px] no-print">#</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {paginatedInvoices.map((inv, idx) => {
                  const date = new Date(inv.addeddate);
                  const amountVal = (inv.size * inv.rate) * 1.05;
                  return (
                    <tr key={inv.invoiceId} className="hover:bg-slate-950/40 transition-colors">
                      <td className="py-3 px-4 text-center text-slate-500">
                        {(currentPage - 1) * (pageSize === -1 ? 0 : pageSize) + idx + 1}
                      </td>
                      {isColVisible('invNo') && <td className="py-3 px-4 font-semibold text-white truncate" title={inv.invNo || ''}>{inv.invNo || 'N/A'}</td>}
                      {isColVisible('addeddate') && <td className="py-3 px-4 whitespace-nowrap">{date.toLocaleDateString('en-IN')}</td>}
                      {isColVisible('addedtime') && <td className="py-3 px-4 whitespace-nowrap">{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>}
                      {isColVisible('size') && <td className="py-3 px-4 text-right">{inv.size.toFixed(2)}</td>}
                      {isColVisible('agentName') && <td className="py-3 px-4 truncate" title={payment.agentName}>{payment.agentName}</td>}
                      {isColVisible('category') && <td className="py-3 px-4">{getCategoryText(inv.customizeReadymade)}</td>}
                      {isColVisible('preparedDate') && <td className="py-3 px-4 whitespace-nowrap">{formatDate(inv.preparedDate)}</td>}
                      {isColVisible('sentDate') && <td className="py-3 px-4 whitespace-nowrap">{formatDate(inv.sentDate)}</td>}
                      {isColVisible('status') && <td className="py-3 px-4 text-center">{getDraftStatusLabel(inv.draftStatus)}</td>}
                      {isColVisible('amount') && <td className="py-3 px-4 text-right font-bold text-blue-400">₹{amountVal.toFixed(2)}</td>}
                      <td className="py-3 px-4 text-center no-print">
                        <button
                          type="button"
                          onClick={() => router.push(`/pay_advocate?oid=${inv.olbId}&page=SuccessTransaction`)}
                          className="p-1 rounded bg-blue-500/10 text-blue-400 hover:bg-blue-50 hover:text-white cursor-pointer"
                          title="View Draft Clauses"
                        >
                          <Eye size={12} />
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {/* Total Row */}
                <tr className="bg-slate-950/40 font-bold border-t border-slate-800 text-white select-none">
                  <td className="py-3.5 px-4 text-right">Total:</td>
                  {colOptions.filter(c => isColVisible(c.key)).map(c => {
                    if (c.key === 'size') {
                      return <td key={c.key} className="py-3.5 px-4 text-right font-extrabold">{totals.size.toFixed(2)}</td>;
                    } else if (c.key === 'amount') {
                      return <td key={c.key} className="py-3.5 px-4 text-right font-extrabold text-blue-400">₹{totals.amount.toFixed(2)}</td>;
                    }
                    return <td key={c.key}></td>;
                  })}
                  <td className="py-3.5 px-4 no-print"></td>
                </tr>
              </tbody>
            </table>
            <TableFooter
              filteredEntriesCount={filteredInvoices.length}
              totalEntries={payment.invoices.length}
              currentPage={currentPage}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>

        <div className="pt-4 no-print">
          <button 
            id="back_btn"
            onClick={() => router.push('/adv_trans_history')}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg text-sm transition-all cursor-pointer shadow-md font-sans"
          >
            Back
          </button>
        </div>

      </div>

    </DashboardLayout>
  );
}

export default function ViewAdvocateTransHistoryPage() {
  return (
    <Suspense fallback={
      <div className="h-[60vh] flex flex-col items-center justify-center gap-3 text-slate-400 bg-slate-950">
        <Loader2 className="animate-spin text-blue-500" size={32} />
        <span>Loading details view...</span>
      </div>
    }>
      <ViewAdvocateTransHistoryContent />
    </Suspense>
  );
}
