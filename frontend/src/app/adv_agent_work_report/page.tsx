"use client";

import React, { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Loader2, AlertCircle, FileSpreadsheet, Printer, Search } from 'lucide-react';
import TableToolbar, { TableFooter, ColumnOption } from '@/components/TableToolbar';

interface WorkRecord {
  agentName: string;
  noOfDrafts: number;
  size: number;
  total: number;
}

export default function AdvAgentWorkReportPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [records, setRecords] = useState<WorkRecord[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Search parameters
  const [startdate, setStartdate] = useState('');
  const [enddate, setEnddate] = useState('');
  const [propertyType, setPropertyType] = useState('0'); // 0=ALL, 1=Open Land, 2=Open Building
  const [area, setArea] = useState('0'); // 0=ALL, 1=Urban, 2=Rural, 3=Sector
  const [category, setCategory] = useState('0'); // 0=ALL, 1=Customize, 2=Readymade
  const [sortingBy, setSortingBy] = useState('1'); // 1 = Amount, 2 = SQCM

  // Table options states
  const colOptions: ColumnOption[] = [
    { key: 'agentName', label: 'Agent Name' },
    { key: 'noOfDrafts', label: 'No Of Drafts' },
    { key: 'size', label: 'SQ.CM' },
    { key: 'total', label: 'Amount' }
  ];

  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);
  const [pageSize, setPageSize] = useState(-1);
  const [currentPage, setCurrentPage] = useState(1);
  const [localSearchQuery, setLocalSearchQuery] = useState("");

  useEffect(() => {
    setVisibleColumns(colOptions.map(c => c.key));
  }, []);

  const isColVisible = (key: string) => visibleColumns.includes(key);

  useEffect(() => {
    setCurrentPage(1);
  }, [localSearchQuery, pageSize]);

  useEffect(() => {
    // Set default dates
    const today = new Date();
    const pad = (num: number) => String(num).padStart(2, '0');
    
    const formattedToday = `${pad(today.getDate())}-${pad(today.getMonth() + 1)}-${today.getFullYear()}`;
    const formattedMonthStart = `01-${pad(today.getMonth() + 1)}-${today.getFullYear()}`;
    
    setStartdate(formattedMonthStart);
    setEnddate(formattedToday);
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setHasSearched(true);

    try {
      const url = `http://localhost:5000/api/reports/agent-work-report?startdate=${startdate}&enddate=${enddate}&property_type=${propertyType}&area=${area}&category=${category}&sorting_by=${sortingBy}`;

      const response = await fetch(url);
      const data = await response.json();
      if (response.ok) {
        setRecords(data.Records || []);
      } else {
        setError(data.Error || 'Failed to retrieve agent work report.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection to server failed. Verify backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const filteredRecords = useMemo(() => {
    if (!localSearchQuery.trim()) return records;
    const q = localSearchQuery.toLowerCase();
    return records.filter(r => (r.agentName || '').toLowerCase().includes(q));
  }, [records, localSearchQuery]);

  const paginatedRecords = useMemo(() => {
    if (pageSize === -1) return filteredRecords;
    const start = (currentPage - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, currentPage, pageSize]);

  const totals = useMemo(() => {
    let drafts = 0;
    let size = 0;
    let amount = 0;
    filteredRecords.forEach(r => {
      drafts += r.noOfDrafts || 0;
      size += r.size || 0;
      amount += r.total || 0;
    });
    return { drafts, size, amount };
  }, [filteredRecords]);

  const handleCopyData = () => {
    const headers = [
      '#',
      ...colOptions.filter(c => isColVisible(c.key)).map(c => c.label)
    ];

    const rows = filteredRecords.map((r, idx) => {
      const dataRow: any[] = [idx + 1];
      if (isColVisible('agentName')) dataRow.push(r.agentName);
      if (isColVisible('noOfDrafts')) dataRow.push(r.noOfDrafts || 0);
      if (isColVisible('size')) dataRow.push(r.size || 0);
      if (isColVisible('total')) dataRow.push(r.total || 0);
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

    const rows = filteredRecords.map((r, idx) => {
      const dataRow: any[] = [idx + 1];
      if (isColVisible('agentName')) dataRow.push(r.agentName);
      if (isColVisible('noOfDrafts')) dataRow.push(r.noOfDrafts || 0);
      if (isColVisible('size')) dataRow.push(r.size || 0);
      if (isColVisible('total')) dataRow.push(r.total || 0);
      return dataRow;
    });

    const totalRow = ['Total'];
    colOptions.filter(c => isColVisible(c.key)).forEach(c => {
      if (c.key === 'noOfDrafts') {
        totalRow.push(String(totals.drafts));
      } else if (c.key === 'size') {
        totalRow.push(totals.size.toFixed(2));
      } else if (c.key === 'total') {
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
    link.setAttribute("download", `agent_work_report_${new Date().toISOString().slice(0,10)}.${fileExtension}`);
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
            <h2 className="text-3xl font-extrabold tracking-tight text-white font-sans">Agent Work Report</h2>
            <p className="text-slate-400 text-sm mt-1 font-sans">
              Review work sizes and aggregates registered by agents on your assigned projects.
            </p>
          </div>
        </div>

        {/* Print Header */}
        <div className="hidden print:block text-center border-b border-black pb-4 mb-6">
          <h2 className="text-xl font-bold text-black font-sans">Agent Work Report</h2>
          <p className="text-xs text-black mt-1 font-sans">Date Range: {startdate} to {enddate}</p>
          <p className="text-xs text-black font-sans">Generated on: {new Date().toLocaleDateString('en-GB')}</p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3 print:hidden">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Filters Form */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl shadow-md print:hidden">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
              <div>
                <label className="block text-slate-300 text-xs font-semibold mb-1 font-sans">Date</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="DD-MM-YYYY"
                    required
                    value={startdate}
                    onChange={(e) => setStartdate(e.target.value)}
                    className="w-full h-10 px-3 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                  <span className="text-slate-500 text-xs font-sans">to</span>
                  <input
                    type="text"
                    placeholder="DD-MM-YYYY"
                    required
                    value={enddate}
                    onChange={(e) => setEnddate(e.target.value)}
                    className="w-full h-10 px-3 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-300 text-xs font-semibold mb-1 font-sans">Property Type</label>
                <select
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="0">ALL</option>
                  <option value="1">Open Land</option>
                  <option value="2">Open Building</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-300 text-xs font-semibold mb-1 font-sans">Area</label>
                <select
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="0">ALL</option>
                  <option value="1">Urban</option>
                  <option value="2">Rural</option>
                  <option value="3">Sector Wise</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-300 text-xs font-semibold mb-1 font-sans">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="0">ALL</option>
                  <option value="1">Customize</option>
                  <option value="2">Readymade</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-300 text-xs font-semibold mb-1 font-sans">Sorting By</label>
                <select
                  value={sortingBy}
                  onChange={(e) => setSortingBy(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="1">Amount</option>
                  <option value="2">SQCM</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-6 h-10 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg text-sm transition-all flex items-center gap-2 cursor-pointer shadow-md justify-center w-full sm:w-auto font-sans"
              >
                <Search size={16} />
                <span>Search</span>
              </button>
            </div>
          </form>
        </div>

        {hasSearched && (
          <div className="space-y-6">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400 print:hidden">
                <Loader2 className="animate-spin text-blue-500" size={28} />
                <span>Generating work report...</span>
              </div>
            ) : records.length === 0 ? (
              <div className="py-20 text-center text-slate-500 text-sm print:text-black">
                No matching agent work records found.
              </div>
            ) : (
              <>
                {/* Table Toolbar controls */}
                <TableToolbar
                  totalEntries={records.length}
                  filteredEntriesCount={filteredRecords.length}
                  currentPage={currentPage}
                  pageSize={pageSize}
                  onPageSizeChange={setPageSize}
                  onPageChange={setCurrentPage}
                  searchValue={localSearchQuery}
                  onSearchChange={setLocalSearchQuery}
                  columns={colOptions}
                  visibleColumns={visibleColumns}
                  onVisibleColumnsChange={setVisibleColumns}
                  onCopyData={handleCopyData}
                  onExportExcel={() => exportToCSVFormat('excel')}
                  onExportCSV={() => exportToCSVFormat('csv')}
                  searchPlaceholder="Search agent records..."
                />

                <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg overflow-hidden print:border-0 print:shadow-none print:bg-white">
                  <div className="overflow-x-auto w-full scrollbar-thin">
                    <table className="w-full border-collapse text-left text-sm text-slate-300 print:text-black table-fixed min-w-[500px]">
                      <thead className="bg-slate-950 text-slate-400 text-xs uppercase font-semibold border-b border-slate-800 print:bg-slate-100 print:text-black print:border-black">
                        <tr>
                          <th className="py-4 px-4 text-center w-[60px]">#</th>
                          {isColVisible('agentName') && <th className="py-4 px-4">Agent Name</th>}
                          {isColVisible('noOfDrafts') && <th className="py-4 px-4 text-right w-[120px]">No Of Drafts</th>}
                          {isColVisible('size') && <th className="py-4 px-4 text-right w-[120px]">SQ.CM</th>}
                          {isColVisible('total') && <th className="py-4 px-4 text-right w-[140px]">Amount</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 print:divide-black">
                        {paginatedRecords.map((r, idx) => (
                          <tr key={idx} className="hover:bg-slate-950/40 transition-colors print:hover:bg-transparent">
                            <td className="py-3.5 px-4 text-center font-medium text-slate-500 print:text-black">
                              {(currentPage - 1) * (pageSize === -1 ? 0 : pageSize) + idx + 1}
                            </td>
                            {isColVisible('agentName') && <td className="py-3.5 px-4 font-semibold text-white print:text-black truncate" title={r.agentName}>{r.agentName}</td>}
                            {isColVisible('noOfDrafts') && <td className="py-3.5 px-4 text-right">{r.noOfDrafts}</td>}
                            {isColVisible('size') && <td className="py-3.5 px-4 text-right">{r.size.toFixed(2)}</td>}
                            {isColVisible('total') && <td className="py-3.5 px-4 text-right font-semibold text-emerald-400 print:text-black">₹{r.total.toFixed(2)}</td>}
                          </tr>
                        ))}

                        <tr className="bg-slate-950/50 font-bold border-t border-slate-800 text-white print:bg-slate-50 print:text-black print:border-black">
                          <td className="py-4 px-4"></td>
                          {colOptions.filter(c => isColVisible(c.key)).map(c => {
                            if (c.key === 'agentName') {
                              return <td key={c.key} className="py-4 px-4 text-right text-slate-400">Total</td>;
                            } else if (c.key === 'noOfDrafts') {
                              return <td key={c.key} className="py-4 px-4 text-right">{totals.drafts}</td>;
                            } else if (c.key === 'size') {
                              return <td key={c.key} className="py-4 px-4 text-right">{totals.size.toFixed(2)}</td>;
                            } else if (c.key === 'total') {
                              return <td key={c.key} className="py-4 px-4 text-right font-extrabold text-emerald-455 print:text-black">₹{totals.amount.toFixed(2)}</td>;
                            }
                            return <td key={c.key}></td>;
                          })}
                        </tr>
                      </tbody>
                    </table>
                    <TableFooter
                      filteredEntriesCount={filteredRecords.length}
                      totalEntries={records.length}
                      currentPage={currentPage}
                      pageSize={pageSize}
                      onPageChange={setCurrentPage}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
