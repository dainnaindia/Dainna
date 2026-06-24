"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { FileSpreadsheet, Printer, Search, Loader2, AlertCircle, Eye, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import TableToolbar, { TableFooter, ColumnOption } from '@/components/TableToolbar';

interface Draft {
  olbId: number;
  purchaserFirstName: string | null;
  purchaserLastName: string | null;
  preparedDate: string | null;
  sentDate: string | null;
  acceptDate: string | null;
  draftStatus: number;
  user_master_olb_master_addedbyTouser_master?: {
    firstname: string | null;
    middlename: string | null;
    surname: string | null;
  } | null;
  invoice_master: Array<{
    inv_no: string;
    addeddate: string;
    size: string;
    rate: string;
    grandtotal: string;
    adv_payment_master?: {
      transaction_id: string | null;
    } | null;
  }>;
}

export default function AdvCompletedDraftsPage() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Table options states
  const colOptions: ColumnOption[] = [
    { key: 'invNo', label: 'Draft No' },
    { key: 'addeddate', label: 'Date' },
    { key: 'addedtime', label: 'Time' },
    { key: 'size', label: 'Size' },
    { key: 'transactionId', label: 'Transaction No' },
    { key: 'amount', label: 'Amount' },
    { key: 'agentName', label: 'Agent Name' },
    { key: 'purchaserName', label: 'Purchaser Name' },
    { key: 'preparedDate', label: 'Prepared Date' },
    { key: 'sentDate', label: 'Sent Date' },
    { key: 'acceptDate', label: 'Accept Date' },
    { key: 'status', label: 'Status' }
  ];

  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);
  const [pageSize, setPageSize] = useState(-1);
  const [currentPage, setCurrentPage] = useState(1);

  // Sorting state
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (columnKey: string) => {
    if (sortColumn !== columnKey) {
      return <ArrowUpDown size={12} className="text-slate-500 opacity-60 hover:opacity-100 shrink-0" />;
    }
    if (sortOrder === 'asc') {
      return <ArrowUp size={12} className="text-blue-400 font-bold shrink-0" />;
    }
    return <ArrowDown size={12} className="text-blue-400 font-bold shrink-0" />;
  };

  useEffect(() => {
    setVisibleColumns(colOptions.map(c => c.key));
  }, []);

  const isColVisible = (key: string) => visibleColumns.includes(key);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, pageSize]);

  useEffect(() => {
    const fetchDrafts = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await fetch('http://localhost:5000/api/drafts/list?status=4');
        const data = await response.json();
        if (response.ok) {
          setDrafts(data.Drafts || []);
        } else {
          setError(data.Msg || 'Failed to retrieve completed drafts.');
        }
      } catch (err) {
        console.error(err);
        setError('Connection to server failed.');
      } finally {
        setLoading(false);
      }
    };

    fetchDrafts();
  }, []);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "-";
    const pad = (num: number) => String(num).padStart(2, '0');
    return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()}`;
  };

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "-";
    const pad = (num: number) => String(num).padStart(2, '0');
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const filteredDrafts = useMemo(() => {
    if (!searchQuery.trim()) return drafts;
    const q = searchQuery.toLowerCase();
    return drafts.filter(draft => {
      const invoice = draft.invoice_master?.[0];
      const invoiceNo = invoice?.inv_no || '';
      const agentName = [
        draft.user_master_olb_master_addedbyTouser_master?.firstname,
        draft.user_master_olb_master_addedbyTouser_master?.middlename,
        draft.user_master_olb_master_addedbyTouser_master?.surname
      ].filter(Boolean).join(' ').toLowerCase();
      const purchaserName = `${draft.purchaserFirstName || ''} ${draft.purchaserLastName || ''}`.toLowerCase();
      const district = (invoiceNo).toLowerCase(); // invoice number
      const transactionNo = (invoice?.adv_payment_master?.transaction_id || '').toLowerCase();
      
      return invoiceNo.toLowerCase().includes(q) ||
        agentName.includes(q) ||
        purchaserName.includes(q) ||
        transactionNo.includes(q);
    });
  }, [drafts, searchQuery]);

  const totals = useMemo(() => {
    let totalSize = 0;
    let totalAmount = 0;
    
    filteredDrafts.forEach(draft => {
      const invoice = draft.invoice_master?.[0];
      const sizeVal = parseFloat(invoice?.size || '0');
      const rateVal = parseFloat(invoice?.rate || '0');
      const aTotal = sizeVal * rateVal;
      const aTotalGst = aTotal * 0.05;
      const amount = aTotal + aTotalGst;
      
      totalSize += sizeVal;
      totalAmount += amount;
    });
    
    return { size: totalSize, amount: totalAmount };
  }, [filteredDrafts]);

  const sortedDrafts = useMemo(() => {
    if (!sortColumn) return filteredDrafts;

    return [...filteredDrafts].sort((a, b) => {
      let aVal: any = '';
      let bVal: any = '';

      const aInvoice = a.invoice_master?.[0];
      const bInvoice = b.invoice_master?.[0];

      if (sortColumn === 'invNo') {
        aVal = aInvoice?.inv_no || '';
        bVal = bInvoice?.inv_no || '';
      } else if (sortColumn === 'addeddate') {
        aVal = aInvoice?.addeddate ? new Date(aInvoice.addeddate).getTime() : 0;
        bVal = bInvoice?.addeddate ? new Date(bInvoice.addeddate).getTime() : 0;
      } else if (sortColumn === 'addedtime') {
        aVal = aInvoice?.addeddate ? new Date(aInvoice.addeddate).getTime() % (24 * 60 * 60 * 1000) : 0;
        bVal = bInvoice?.addeddate ? new Date(bInvoice.addeddate).getTime() % (24 * 60 * 60 * 1000) : 0;
      } else if (sortColumn === 'size') {
        aVal = parseFloat(aInvoice?.size || '0');
        bVal = parseFloat(bInvoice?.size || '0');
      } else if (sortColumn === 'transactionId') {
        aVal = aInvoice?.adv_payment_master?.transaction_id || '';
        bVal = bInvoice?.adv_payment_master?.transaction_id || '';
      } else if (sortColumn === 'amount') {
        const aSize = parseFloat(aInvoice?.size || '0');
        const aRate = parseFloat(aInvoice?.rate || '0');
        aVal = (aSize * aRate) * 1.05;

        const bSize = parseFloat(bInvoice?.size || '0');
        const bRate = parseFloat(bInvoice?.rate || '0');
        bVal = (bSize * bRate) * 1.05;
      } else if (sortColumn === 'agentName') {
        aVal = [
          a.user_master_olb_master_addedbyTouser_master?.firstname,
          a.user_master_olb_master_addedbyTouser_master?.middlename,
          a.user_master_olb_master_addedbyTouser_master?.surname
        ].filter(Boolean).join(' ');
        bVal = [
          b.user_master_olb_master_addedbyTouser_master?.firstname,
          b.user_master_olb_master_addedbyTouser_master?.middlename,
          b.user_master_olb_master_addedbyTouser_master?.surname
        ].filter(Boolean).join(' ');
      } else if (sortColumn === 'purchaserName') {
        aVal = `${a.purchaserFirstName || ''} ${a.purchaserLastName || ''}`.trim();
        bVal = `${b.purchaserFirstName || ''} ${b.purchaserLastName || ''}`.trim();
      } else if (sortColumn === 'preparedDate') {
        aVal = a.preparedDate ? new Date(a.preparedDate).getTime() : 0;
        bVal = b.preparedDate ? new Date(b.preparedDate).getTime() : 0;
      } else if (sortColumn === 'sentDate') {
        aVal = a.sentDate ? new Date(a.sentDate).getTime() : 0;
        bVal = b.sentDate ? new Date(b.sentDate).getTime() : 0;
      } else if (sortColumn === 'acceptDate') {
        aVal = a.acceptDate ? new Date(a.acceptDate).getTime() : 0;
        bVal = b.acceptDate ? new Date(b.acceptDate).getTime() : 0;
      } else if (sortColumn === 'status') {
        aVal = 'Complete Draft';
        bVal = 'Complete Draft';
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredDrafts, sortColumn, sortOrder]);

  const paginatedDrafts = useMemo(() => {
    if (pageSize === -1) return sortedDrafts;
    const start = (currentPage - 1) * pageSize;
    return sortedDrafts.slice(start, start + pageSize);
  }, [sortedDrafts, currentPage, pageSize]);

  const handleCopyData = () => {
    const headers = [
      '#',
      ...colOptions.filter(c => isColVisible(c.key)).map(c => c.label)
    ];

    const rows = filteredDrafts.map((draft, idx) => {
      const invoice = draft.invoice_master?.[0];
      const sizeVal = parseFloat(invoice?.size || '0');
      const rateVal = parseFloat(invoice?.rate || '0');
      const amount = (sizeVal * rateVal) * 1.05;
      const agentName = [
        draft.user_master_olb_master_addedbyTouser_master?.firstname,
        draft.user_master_olb_master_addedbyTouser_master?.middlename,
        draft.user_master_olb_master_addedbyTouser_master?.surname
      ].filter(Boolean).join(' ') || '-';

      const dataRow: any[] = [idx + 1];
      if (isColVisible('invNo')) dataRow.push(invoice?.inv_no || 'N/A');
      if (isColVisible('addeddate')) dataRow.push(invoice?.addeddate ? formatDate(invoice.addeddate) : 'N/A');
      if (isColVisible('addedtime')) dataRow.push(invoice?.addeddate ? formatTime(invoice.addeddate) : 'N/A');
      if (isColVisible('size')) dataRow.push(sizeVal.toFixed(2));
      if (isColVisible('transactionId')) dataRow.push(invoice?.adv_payment_master?.transaction_id || '-');
      if (isColVisible('amount')) dataRow.push(amount.toFixed(2));
      if (isColVisible('agentName')) dataRow.push(agentName);
      if (isColVisible('purchaserName')) dataRow.push(`${draft.purchaserFirstName || ''} ${draft.purchaserLastName || ''}`.trim() || '-');
      if (isColVisible('preparedDate')) dataRow.push(formatDate(draft.preparedDate));
      if (isColVisible('sentDate')) dataRow.push(formatDate(draft.sentDate));
      if (isColVisible('acceptDate')) dataRow.push(formatDate(draft.acceptDate));
      if (isColVisible('status')) dataRow.push('Complete Draft');
      return dataRow;
    });

    const content = [headers.join('\t'), ...rows.map(r => r.join('\t'))].join('\n');
    navigator.clipboard.writeText(content);
    alert('Table data copied to clipboard!');
  };

  const exportToCSVFormat = (type: 'csv' | 'excel') => {
    const headers = [
      '#',
      ...colOptions.filter(c => isColVisible(c.key)).map(c => c.label)
    ];

    const rows = filteredDrafts.map((draft, idx) => {
      const invoice = draft.invoice_master?.[0];
      const sizeVal = parseFloat(invoice?.size || '0');
      const rateVal = parseFloat(invoice?.rate || '0');
      const amount = (sizeVal * rateVal) * 1.05;
      const agentName = [
        draft.user_master_olb_master_addedbyTouser_master?.firstname,
        draft.user_master_olb_master_addedbyTouser_master?.middlename,
        draft.user_master_olb_master_addedbyTouser_master?.surname
      ].filter(Boolean).join(' ') || '-';

      const dataRow: any[] = [idx + 1];
      if (isColVisible('invNo')) dataRow.push(invoice?.inv_no || 'N/A');
      if (isColVisible('addeddate')) dataRow.push(invoice?.addeddate ? formatDate(invoice.addeddate) : 'N/A');
      if (isColVisible('addedtime')) dataRow.push(invoice?.addeddate ? formatTime(invoice.addeddate) : 'N/A');
      if (isColVisible('size')) dataRow.push(sizeVal.toFixed(2));
      if (isColVisible('transactionId')) dataRow.push(invoice?.adv_payment_master?.transaction_id || '-');
      if (isColVisible('amount')) dataRow.push(amount.toFixed(2));
      if (isColVisible('agentName')) dataRow.push(agentName);
      if (isColVisible('purchaserName')) dataRow.push(`${draft.purchaserFirstName || ''} ${draft.purchaserLastName || ''}`.trim() || '-');
      if (isColVisible('preparedDate')) dataRow.push(formatDate(draft.preparedDate));
      if (isColVisible('sentDate')) dataRow.push(formatDate(draft.sentDate));
      if (isColVisible('acceptDate')) dataRow.push(formatDate(draft.acceptDate));
      if (isColVisible('status')) dataRow.push('Complete Draft');
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
    link.setAttribute("download", `completed_drafts_${new Date().toISOString().slice(0,10)}.${fileExtension}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <DashboardLayout role="advocate">
      <div className="absolute top-10 right-10 w-[400px] h-[400px] rounded-full bg-blue-500/5 blur-[100px] pointer-events-none print:hidden" />
      
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          .print\:hidden {
            display: none !important;
          }
          table {
            border-collapse: collapse !important;
            width: 100% !important;
            color: black !important;
          }
          th, td {
            border: 1px solid #ddd !important;
            padding: 6px !important;
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
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 print:hidden">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white font-sans">Completed Drafts</h2>
            <p className="text-slate-400 text-sm mt-1">Contracts fully audited and completed by the advocate panel</p>
          </div>
        </div>

        {/* Print Header */}
        <div className="hidden print:block text-center border-b border-black pb-4 mb-6">
          <h2 className="text-xl font-bold text-black">Completed Drafts Report</h2>
          <p className="text-xs text-black">Generated on: {new Date().toLocaleDateString('en-GB')}</p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3 print:hidden">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Table Toolbar controls */}
        <TableToolbar
          totalEntries={drafts.length}
          filteredEntriesCount={filteredDrafts.length}
          currentPage={currentPage}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
          onPageChange={setCurrentPage}
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          columns={colOptions}
          visibleColumns={visibleColumns}
          onVisibleColumnsChange={setVisibleColumns}
          onCopyData={handleCopyData}
          onExportExcel={() => exportToCSVFormat('excel')}
          onExportCSV={() => exportToCSVFormat('csv')}
          searchPlaceholder="Search drafts..."
        />

        <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg overflow-hidden">
          <div className="p-5 border-b border-slate-800 flex items-center gap-3 bg-slate-900/50 print:hidden">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
              <FileSpreadsheet size={20} />
            </div>
            <h3 className="font-semibold text-lg text-white">Approved Agreements List</h3>
          </div>

          <div className="overflow-x-auto w-full scrollbar-thin">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
                <Loader2 className="animate-spin text-blue-500" size={28} />
                <span>Loading completed drafts...</span>
              </div>
            ) : filteredDrafts.length === 0 ? (
              <div className="py-20 text-center text-slate-500 text-sm">
                No matching completed drafts found.
              </div>
            ) : (
              <>
                <table className="w-full border-collapse text-left text-xs text-slate-300 table-fixed min-w-[1380px]">
                  <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
                    <tr>
                      <th className="py-4 px-3 text-center w-[50px]">#</th>
                      {isColVisible('invNo') && (
                        <th className="py-4 px-3 w-[120px] cursor-pointer hover:bg-slate-800 select-none" onClick={() => handleSort('invNo')}>
                          <div className="flex items-center gap-1.5">
                            <span>Draft No</span>
                            {getSortIcon('invNo')}
                          </div>
                        </th>
                      )}
                      {isColVisible('addeddate') && (
                        <th className="py-4 px-3 w-[100px] cursor-pointer hover:bg-slate-800 select-none" onClick={() => handleSort('addeddate')}>
                          <div className="flex items-center gap-1.5">
                            <span>Date</span>
                            {getSortIcon('addeddate')}
                          </div>
                        </th>
                      )}
                      {isColVisible('addedtime') && (
                        <th className="py-4 px-3 w-[80px] cursor-pointer hover:bg-slate-800 select-none" onClick={() => handleSort('addedtime')}>
                          <div className="flex items-center gap-1.5">
                            <span>Time</span>
                            {getSortIcon('addedtime')}
                          </div>
                        </th>
                      )}
                      {isColVisible('size') && (
                        <th className="py-4 px-3 w-[80px] cursor-pointer hover:bg-slate-800 select-none" onClick={() => handleSort('size')}>
                          <div className="flex items-center gap-1.5">
                            <span>Size</span>
                            {getSortIcon('size')}
                          </div>
                        </th>
                      )}
                      {isColVisible('transactionId') && (
                        <th className="py-4 px-3 w-[140px] cursor-pointer hover:bg-slate-800 select-none" onClick={() => handleSort('transactionId')}>
                          <div className="flex items-center gap-1.5">
                            <span>Transaction No</span>
                            {getSortIcon('transactionId')}
                          </div>
                        </th>
                      )}
                      {isColVisible('amount') && (
                        <th className="py-4 px-3 w-[100px] cursor-pointer hover:bg-slate-800 select-none" onClick={() => handleSort('amount')}>
                          <div className="flex items-center gap-1.5">
                            <span>Amount</span>
                            {getSortIcon('amount')}
                          </div>
                        </th>
                      )}
                      {isColVisible('agentName') && (
                        <th className="py-4 px-3 w-[150px] cursor-pointer hover:bg-slate-800 select-none" onClick={() => handleSort('agentName')}>
                          <div className="flex items-center gap-1.5">
                            <span>Agent Name</span>
                            {getSortIcon('agentName')}
                          </div>
                        </th>
                      )}
                      {isColVisible('purchaserName') && (
                        <th className="py-4 px-3 w-[150px] cursor-pointer hover:bg-slate-800 select-none" onClick={() => handleSort('purchaserName')}>
                          <div className="flex items-center gap-1.5">
                            <span>Purchaser Name</span>
                            {getSortIcon('purchaserName')}
                          </div>
                        </th>
                      )}
                      {isColVisible('preparedDate') && (
                        <th className="py-4 px-3 w-[110px] cursor-pointer hover:bg-slate-800 select-none" onClick={() => handleSort('preparedDate')}>
                          <div className="flex items-center gap-1.5">
                            <span>Prepared Date</span>
                            {getSortIcon('preparedDate')}
                          </div>
                        </th>
                      )}
                      {isColVisible('sentDate') && (
                        <th className="py-4 px-3 w-[110px] cursor-pointer hover:bg-slate-800 select-none" onClick={() => handleSort('sentDate')}>
                          <div className="flex items-center gap-1.5">
                            <span>Sent Date</span>
                            {getSortIcon('sentDate')}
                          </div>
                        </th>
                      )}
                      {isColVisible('acceptDate') && (
                        <th className="py-4 px-3 w-[110px] cursor-pointer hover:bg-slate-800 select-none" onClick={() => handleSort('acceptDate')}>
                          <div className="flex items-center gap-1.5">
                            <span>Accept Date</span>
                            {getSortIcon('acceptDate')}
                          </div>
                        </th>
                      )}
                      {isColVisible('status') && (
                        <th className="py-4 px-3 w-[120px] cursor-pointer hover:bg-slate-800 select-none" onClick={() => handleSort('status')}>
                          <div className="flex items-center gap-1.5">
                            <span>Status</span>
                            {getSortIcon('status')}
                          </div>
                        </th>
                      )}
                      <th className="py-4 px-3 text-center print:hidden w-[60px]">#</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {paginatedDrafts.map((draft, idx) => {
                      const invoice = draft.invoice_master?.[0];
                      const sizeVal = parseFloat(invoice?.size || '0');
                      const rateVal = parseFloat(invoice?.rate || '0');
                      const amount = (sizeVal * rateVal) * 1.05;

                      const agentName = [
                        draft.user_master_olb_master_addedbyTouser_master?.firstname,
                        draft.user_master_olb_master_addedbyTouser_master?.middlename,
                        draft.user_master_olb_master_addedbyTouser_master?.surname
                      ].filter(Boolean).join(' ') || '-';

                      return (
                        <tr key={draft.olbId} className="hover:bg-slate-950/40 transition-colors">
                          <td className="py-3.5 px-3 text-center font-medium text-slate-500">
                            {(currentPage - 1) * (pageSize === -1 ? 0 : pageSize) + idx + 1}
                          </td>
                          {isColVisible('invNo') && <td className="py-3.5 px-3 font-semibold text-white truncate" title={invoice?.inv_no || ''}>{invoice?.inv_no || '-'}</td>}
                          {isColVisible('addeddate') && (
                            <td className="py-3.5 px-3 text-slate-400 whitespace-nowrap">
                              {invoice?.addeddate ? formatDate(invoice.addeddate) : '-'}
                            </td>
                          )}
                          {isColVisible('addedtime') && (
                            <td className="py-3.5 px-3 text-slate-400 whitespace-nowrap">
                              {invoice?.addeddate ? formatTime(invoice.addeddate) : '-'}
                            </td>
                          )}
                          {isColVisible('size') && <td className="py-3.5 px-3">{sizeVal.toFixed(2)}</td>}
                          {isColVisible('transactionId') && (
                            <td className="py-3.5 px-3 font-mono text-[10px] text-slate-400 truncate" title={invoice?.adv_payment_master?.transaction_id || ''}>
                              {invoice?.adv_payment_master?.transaction_id || '-'}
                            </td>
                          )}
                          {isColVisible('amount') && <td className="py-3.5 px-3 text-white font-semibold">₹{amount.toFixed(2)}</td>}
                          {isColVisible('agentName') && <td className="py-3.5 px-3 truncate" title={agentName}>{agentName}</td>}
                          {isColVisible('purchaserName') && (
                            <td className="py-3.5 px-3 truncate" title={`${draft.purchaserFirstName || ''} ${draft.purchaserLastName || ''}`}>
                              {`${draft.purchaserFirstName || ''} ${draft.purchaserLastName || ''}`.trim() || '-'}
                            </td>
                          )}
                          {isColVisible('preparedDate') && <td className="py-3.5 px-3 text-slate-450 whitespace-nowrap">{formatDate(draft.preparedDate)}</td>}
                          {isColVisible('sentDate') && <td className="py-3.5 px-3 text-slate-450 whitespace-nowrap">{formatDate(draft.sentDate)}</td>}
                          {isColVisible('acceptDate') && <td className="py-3.5 px-3 text-slate-450 whitespace-nowrap">{formatDate(draft.acceptDate)}</td>}
                          {isColVisible('status') && (
                            <td className="py-3.5 px-3">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
                                Complete Draft
                              </span>
                            </td>
                          )}
                          <td className="py-3.5 px-3 text-center print:hidden">
                            <Link 
                              href={`/pay_advocate?oid=${draft.olbId}&page=CompletedDrafts`}
                              className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-slate-800/80 rounded-lg inline-block transition-colors"
                              title="View Draft Card"
                            >
                              <Eye size={15} />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                    
                    {/* Totals row */}
                    <tr className="bg-slate-950/50 font-bold border-t border-slate-800 text-white">
                      <td className="py-4 px-3 text-center">Total</td>
                      {colOptions.filter(c => isColVisible(c.key)).map(c => {
                        if (c.key === 'size') {
                          return <td key={c.key} className="py-4 px-3">{totals.size.toFixed(2)}</td>;
                        } else if (c.key === 'amount') {
                          return <td key={c.key} className="py-4 px-3 text-blue-455">₹{totals.amount.toFixed(2)}</td>;
                        }
                        return <td key={c.key}></td>;
                      })}
                      <td className="py-4 px-3 print:hidden"></td>
                    </tr>
                  </tbody>
                </table>
                <TableFooter
                  filteredEntriesCount={filteredDrafts.length}
                  totalEntries={drafts.length}
                  currentPage={currentPage}
                  pageSize={pageSize}
                  onPageChange={setCurrentPage}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
