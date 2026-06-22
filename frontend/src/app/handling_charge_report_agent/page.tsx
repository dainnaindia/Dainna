"use client";

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import TableToolbar, { TableFooter } from '@/components/TableToolbar';
import { Loader2, AlertCircle, ClipboardList } from 'lucide-react';

interface StateObj {
  state_id: number;
  state_name: string;
}

interface Project {
  projectId: number;
  projectName: string;
  city: string;
}

interface ChargeRecord {
  invoiceId: number;
  invNo: string;
  invoiceDate: string;
  agentName: string;
  projectName: string;
  projectCity: string;
  handlingChargeAmount: number;
  grandtotal: number;
}

const COLUMNS = [
  { key: 'invNo', label: 'Invoice No' },
  { key: 'invoiceDate', label: 'Date' },
  { key: 'agentName', label: 'Agent Name' },
  { key: 'projectName', label: 'Project Name' },
  { key: 'projectCity', label: 'Project City' },
  { key: 'handlingChargeAmount', label: 'Handling Charge (₹)' },
  { key: 'grandtotal', label: 'Grand Total (₹)' }
];

export default function HandlingChargeReportAgentPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [records, setRecords] = useState<ChargeRecord[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // States, cities, projects list for filters
  const [states, setStates] = useState<StateObj[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  // Selected filter values
  const [stateId, setStateId] = useState('');
  const [city, setCity] = useState('');
  const [projectId, setProjectId] = useState('');

  // Date ranges
  const [startdate, setStartdate] = useState('');
  const [enddate, setEnddate] = useState('');

  // DataTables Toolbar & Pagination States
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleColumns, setVisibleColumns] = useState<string[]>(COLUMNS.map(c => c.key));
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    // Set default dates to first day of current month and today
    const today = new Date();
    const pad = (num: number) => String(num).padStart(2, '0');
    
    const formattedToday = `${pad(today.getDate())}-${pad(today.getMonth() + 1)}-${today.getFullYear()}`;
    const formattedMonthStart = `01-${pad(today.getMonth() + 1)}-${today.getFullYear()}`;
    
    setStartdate(formattedMonthStart);
    setEnddate(formattedToday);

    // Fetch states
    fetch('http://localhost:5000/api/users/states', { credentials: 'include' })
      .then(res => res.json())
      .then(data => setStates(data.States || []))
      .catch(err => console.error(err));
  }, []);

  // Cascading Cities
  useEffect(() => {
    if (!stateId) {
      setCities([]);
      setCity('');
      return;
    }
    fetch(`http://localhost:5000/api/projects?StateID=${stateId}`, { credentials: 'include' })
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
    fetch(`http://localhost:5000/api/projects?StateID=${stateId}&City=${city}`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        setProjects(data.Projects || []);
        setProjectId('');
      })
      .catch(err => console.error(err));
  }, [stateId, city]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setHasSearched(true);
    setCurrentPage(1);

    try {
      let url = `http://localhost:5000/api/reports/handling-charges?startdate=${startdate}&enddate=${enddate}`;
      if (stateId) url += `&stateId=${stateId}`;
      if (city) url += `&city=${encodeURIComponent(city)}`;
      if (projectId) url += `&projectId=${projectId}`;

      const response = await fetch(url, { credentials: 'include' });
      const data = await response.json();
      if (response.ok) {
        setRecords(data.Records || []);
      } else {
        setError(data.Error || 'Failed to retrieve handling charges report.');
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

  const filteredRecords = records.filter(r => {
    const full = `${r.invNo} ${r.agentName} ${r.projectName} ${r.projectCity}`.toLowerCase();
    return full.includes(searchTerm.toLowerCase());
  });

  const getTotals = () => {
    let charges = 0;
    let grand = 0;
    filteredRecords.forEach(r => {
      charges += r.handlingChargeAmount || 0;
      grand += r.grandtotal || 0;
    });
    return { charges, grand };
  };

  const displayedRecords = pageSize === -1 
    ? filteredRecords 
    : filteredRecords.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const copyTable = () => {
    const text = filteredRecords.map((r, idx) => 
      `${idx + 1}\t${r.invNo || 'N/A'}\t${formatDate(r.invoiceDate)}\t${r.agentName}\t${r.projectName}\t${r.projectCity}\t${r.handlingChargeAmount}\t${r.grandtotal}`
    ).join('\n');
    navigator.clipboard.writeText(text);
    alert('Table copied to clipboard!');
  };

  const exportToCSV = () => {
    const headers = [
      '#',
      'Invoice No',
      'Date',
      'Agent Name',
      'Project Name',
      'Project City',
      'Handling Charge',
      'Grand Total'
    ];

    const rows = filteredRecords.map((r, idx) => [
      idx + 1,
      r.invNo || 'N/A',
      formatDate(r.invoiceDate),
      r.agentName,
      r.projectName,
      r.projectCity,
      r.handlingChargeAmount || 0,
      r.grandtotal || 0
    ]);

    const { charges, grand } = getTotals();
    rows.push([
      '',
      'Total',
      '',
      '',
      '',
      '',
      charges,
      grand
    ]);

    const csvContent = [
        `"Handling Charges Report from ${startdate} to ${enddate}"`,
        '',
        headers.join(','), 
        ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
      ].join('\n');
    
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8' });
    const encodedUri = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `handling_charge_report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totals = getTotals();

  return (
    <DashboardLayout role="admin">
      <div className="absolute top-10 right-10 w-[400px] h-[400px] rounded-full bg-emerald-500/5 blur-[100px] pointer-events-none print:hidden" />
      
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          .no-print, aside, header, button, input, select {
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
          main, .flex-1, .space-y-6 {
            margin: 0 !important;
            padding: 0 !important;
            background-color: transparent !important;
          }
        }
      `}} />

      <div className="space-y-6">
        <div className="flex justify-between items-center print:hidden">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <ClipboardList className="text-emerald-500" size={32} />
              Handling Charges Collection Report
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Analyze handling charges collected from successful agent transactions within a date range.
            </p>
          </div>
        </div>

        {/* Print Header */}
        <div className="hidden print:block text-center border-b border-black pb-4 mb-6">
          <h2 className="text-xl font-bold text-black">Handling Charges Collection Report</h2>
          <p className="text-xs text-black mt-1">From: {startdate} To: {enddate}</p>
          <p className="text-xs text-black">Generated on: {new Date().toLocaleDateString('en-GB')}</p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3 print:hidden">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Filter Panel */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl shadow-md print:hidden">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
              <div>
                <label className="block text-slate-300 text-xs font-semibold mb-1">State</label>
                <select
                  value={stateId}
                  onChange={(e) => setStateId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
                >
                  <option value="">-- ALL --</option>
                  {states.map(s => (
                    <option key={s.state_id} value={s.state_id}>{s.state_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-300 text-xs font-semibold mb-1">City</label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  disabled={!stateId}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                >
                  <option value="">-- ALL --</option>
                  {cities.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-300 text-xs font-semibold mb-1">Project</label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  disabled={!city}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                >
                  <option value="">-- ALL --</option>
                  {projects.map(p => (
                    <option key={p.projectId} value={p.projectId}>{p.projectName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-300 text-xs font-semibold mb-1">Start Date</label>
                <input
                  type="text"
                  placeholder="DD-MM-YYYY"
                  required
                  value={startdate}
                  onChange={(e) => setStartdate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 text-xs font-semibold mb-1">End Date</label>
                <input
                  type="text"
                  placeholder="DD-MM-YYYY"
                  required
                  value={enddate}
                  onChange={(e) => setEnddate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg text-sm transition-all flex items-center gap-2 cursor-pointer shadow-md justify-center"
              >
                <span>Search Charges</span>
              </button>
            </div>
          </form>
        </div>

        {hasSearched && (
          <div className="space-y-6">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400 print:hidden">
                <Loader2 className="animate-spin text-emerald-500" size={28} />
                <span>Generating charges report...</span>
              </div>
            ) : records.length === 0 ? (
              <div className="py-20 text-center text-slate-500 text-sm print:text-black">
                No handling charges registered within the selected filter parameters.
              </div>
            ) : (
              <>
                {/* Aggregated Totals Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 print:grid-cols-2">
                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl print:border-black print:bg-white">
                    <span className="block text-slate-500 text-[10px] uppercase font-bold tracking-wider print:text-black">Total Handling Charges</span>
                    <span className="text-2xl font-extrabold text-emerald-400 mt-1 block print:text-black">₹{totals.charges.toFixed(2)}</span>
                  </div>
                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl print:border-black print:bg-white">
                    <span className="block text-slate-500 text-[10px] uppercase font-bold tracking-wider print:text-black">Grand Total Collection</span>
                    <span className="text-2xl font-extrabold text-white mt-1 block print:text-black">₹{totals.grand.toFixed(2)}</span>
                  </div>
                </div>

                {/* Table Toolbar */}
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
                  onExportExcel={exportToCSV}
                  onExportCSV={exportToCSV}
                />

                {/* Table */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg overflow-hidden print:border-0 print:shadow-none print:bg-white">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-sm text-slate-300 print:text-black">
                      <thead className="bg-slate-950 text-slate-400 text-xs uppercase font-semibold border-b border-slate-800 print:bg-slate-100 print:text-black print:border-black">
                        <tr>
                          <th className="py-4 px-4 text-center w-12">#</th>
                          {visibleColumns.includes('invNo') && <th className="py-4 px-4">Invoice No</th>}
                          {visibleColumns.includes('invoiceDate') && <th className="py-4 px-4">Date</th>}
                          {visibleColumns.includes('agentName') && <th className="py-4 px-4">Agent Name</th>}
                          {visibleColumns.includes('projectName') && <th className="py-4 px-4">Project Name</th>}
                          {visibleColumns.includes('projectCity') && <th className="py-4 px-4">Project City</th>}
                          {visibleColumns.includes('handlingChargeAmount') && <th className="py-4 px-4 text-right">Handling Charge (₹)</th>}
                          {visibleColumns.includes('grandtotal') && <th className="py-4 px-4 text-right">Grand Total (₹)</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 print:divide-black">
                        {displayedRecords.map((r, idx) => (
                          <tr key={r.invoiceId} className="hover:bg-slate-950/40 transition-colors print:hover:bg-transparent">
                            <td className="py-3.5 px-4 text-center font-medium text-slate-500 print:text-black">
                              {pageSize === -1 ? idx + 1 : (currentPage - 1) * pageSize + idx + 1}
                            </td>
                            {visibleColumns.includes('invNo') && (
                              <td className="py-3.5 px-4 font-semibold text-white print:text-black">{r.invNo || 'N/A'}</td>
                            )}
                            {visibleColumns.includes('invoiceDate') && (
                              <td className="py-3.5 px-4 text-xs">{formatDate(r.invoiceDate)}</td>
                            )}
                            {visibleColumns.includes('agentName') && (
                              <td className="py-3.5 px-4">{r.agentName}</td>
                            )}
                            {visibleColumns.includes('projectName') && (
                              <td className="py-3.5 px-4 text-slate-400 print:text-black">{r.projectName}</td>
                            )}
                            {visibleColumns.includes('projectCity') && (
                              <td className="py-3.5 px-4 text-slate-400 print:text-black">{r.projectCity}</td>
                            )}
                            {visibleColumns.includes('handlingChargeAmount') && (
                              <td className="py-3.5 px-4 text-right text-emerald-400 font-semibold">₹{r.handlingChargeAmount.toFixed(2)}</td>
                            )}
                            {visibleColumns.includes('grandtotal') && (
                              <td className="py-3.5 px-4 text-right font-medium">₹{r.grandtotal.toFixed(2)}</td>
                            )}
                          </tr>
                        ))}

                        {/* Summary Total Row */}
                        <tr className="bg-slate-950/50 font-bold border-t border-slate-800 text-white print:bg-slate-50 print:text-black print:border-black">
                          <td className="py-4 px-4"></td>
                          {visibleColumns.includes('invNo') && <td className="py-4 px-4"></td>}
                          {visibleColumns.includes('invoiceDate') && <td className="py-4 px-4 text-right">Total</td>}
                          {visibleColumns.includes('agentName') && <td className="py-4 px-4"></td>}
                          {visibleColumns.includes('projectName') && <td className="py-4 px-4"></td>}
                          {visibleColumns.includes('projectCity') && <td className="py-4 px-4"></td>}
                          {visibleColumns.includes('handlingChargeAmount') && (
                            <td className="py-4 px-4 text-right text-emerald-450 font-bold">₹{totals.charges.toFixed(2)}</td>
                          )}
                          {visibleColumns.includes('grandtotal') && (
                            <td className="py-4 px-4 text-right font-bold">₹{totals.grand.toFixed(2)}</td>
                          )}
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Reusable DataTables Entry Counts & Pagination Footer */}
                  <TableFooter
                    filteredEntriesCount={filteredRecords.length}
                    totalEntries={records.length}
                    currentPage={currentPage}
                    pageSize={pageSize}
                    onPageChange={setCurrentPage}
                  />
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
