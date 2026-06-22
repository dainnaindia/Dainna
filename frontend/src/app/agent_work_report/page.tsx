"use client";

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { FileBarChart2, Loader2, Search, Printer, FileSpreadsheet } from 'lucide-react';

interface ReportRecord {
  projectName: string;
  projectCity: string;
  size: number;
  total: number;
}

export default function AgentWorkReportPage() {
  const [records, setRecords] = useState<ReportRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  // Filters State
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [propertyType, setPropertyType] = useState('0');
  const [area, setArea] = useState('0');
  const [category, setCategory] = useState('0');
  const [sortingBy, setSortingBy] = useState('1');

  const initFilters = () => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    setStartDate(`${y}-${m}-01`);
    setEndDate(`${y}-${m}-${d}`);
  };

  useEffect(() => {
    initFilters();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSearched(true);

    try {
      // Endpoint expects startdate/enddate as DD-MM-YYYY
      const formatToDMY = (dateStr: string) => {
        if (!dateStr) return '';
        const [y, m, d] = dateStr.split('-');
        return `${d}-${m}-${y}`;
      };

      const sdateStr = formatToDMY(startDate);
      const edateStr = formatToDMY(endDate);

      const url = `http://localhost:5000/api/reports/agent-work-report?startdate=${sdateStr}&enddate=${edateStr}&property_type=${propertyType}&area=${area}&category=${category}&sorting_by=${sortingBy}`;
      
      const response = await fetch(url, { credentials: 'include' });
      const data = await response.json();
      if (response.ok) {
        setRecords(data.Records || []);
      } else {
        setError(data.Msg || 'Failed to retrieve work reports.');
      }
    } catch (err) {
      console.error(err);
      setError('Cannot connect to API server. Ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  // Export CSV
  const exportExcel = () => {
    const ptText = propertyType === '0' ? 'ALL' : propertyType === '1' ? 'Open Land' : 'Open Building';
    const areaText = area === '0' ? 'ALL' : area === '1' ? 'Urban' : area === '2' ? 'Rural' : 'Sector Wise';
    const categoryText = category === '0' ? 'ALL' : category === '1' ? 'Customize' : 'Readymade';
    
    const headers = [
      `Agent Work Report [ Property Type: ${ptText} ] [ Area: ${areaText} ] [ Category: ${categoryText} ] [ Dates: ${startDate} to ${endDate} ]`,
      "", "", ""
    ];
    const columnHeaders = ["#", "Project Name", "SQ.CM", "Amount"];
    const rows = records.map((r, idx) => [
      idx + 1,
      `${r.projectName} ${r.projectCity}`,
      r.size,
      r.total
    ]);

    const totalSize = records.reduce((sum, r) => sum + r.size, 0);
    const totalAmount = records.reduce((sum, r) => sum + r.total, 0);
    const totalRow = ["", "Total", totalSize, totalAmount];

    const csvContent = [headers.join(","), columnHeaders.join(","), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(",")), totalRow.join(",")].join("\n");
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8' });
    const encodedUri = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `work_report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(encodedUri);
  };

  const totalSize = records.reduce((sum, r) => sum + r.size, 0);
  const totalAmount = records.reduce((sum, r) => sum + r.total, 0);

  const ptText = propertyType === '0' ? 'ALL' : propertyType === '1' ? 'Open Land' : 'Open Building';
  const areaText = area === '0' ? 'ALL' : area === '1' ? 'Urban' : area === '2' ? 'Rural' : 'Sector Wise';
  const categoryText = category === '0' ? 'ALL' : category === '1' ? 'Customize' : 'Readymade';

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
              <FileBarChart2 className="text-blue-500" size={32} />
              Work Report
            </h2>
            <p className="text-slate-400 text-sm mt-1">Summary reports of your registered lands and buildings with total billing metrics</p>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm no-print">
            {error}
          </div>
        )}

        {/* Legacy style search panel */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl shadow-md no-print">
          <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
            <div>
              <label className="block text-slate-450 text-xs font-semibold mb-1">Date Range</label>
              <div className="flex flex-col gap-1.5">
                <input
                  type="date"
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:border-blue-500 transition-colors"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
                <input
                  type="date"
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:border-blue-500 transition-colors"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-450 text-xs font-semibold mb-1" htmlFor="property-type">Property Type</label>
              <select
                id="property-type"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:border-blue-500 transition-colors"
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
              >
                <option value="0">ALL</option>
                <option value="1">Open Land</option>
                <option value="2">Open Building</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-450 text-xs font-semibold mb-1" htmlFor="area-select">Area</label>
              <select
                id="area-select"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:border-blue-500 transition-colors"
                value={area}
                onChange={(e) => setArea(e.target.value)}
              >
                <option value="0">ALL</option>
                <option value="1">Urban</option>
                <option value="2">Rural</option>
                <option value="3">Sector Wise</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-450 text-xs font-semibold mb-1" htmlFor="category-select">Category</label>
              <select
                id="category-select"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:border-blue-500 transition-colors"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="0">ALL</option>
                <option value="1">Customize</option>
                <option value="2">Readymade</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-450 text-xs font-semibold mb-1" htmlFor="sort-select">Sorting By</label>
              <select
                id="sort-select"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:border-blue-500 transition-colors"
                value={sortingBy}
                onChange={(e) => setSortingBy(e.target.value)}
              >
                <option value="1">Amount</option>
                <option value="2">SQCM</option>
              </select>
            </div>

            <button
              type="submit"
              name="search"
              className="py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <Search size={14} />
              <span>Search</span>
            </button>
          </form>
        </div>

        {/* Action Excel and Print Toolbar */}
        {searched && (
          <div className="flex gap-2 justify-end no-print">
            <button
              onClick={() => window.print()}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg text-xs flex items-center gap-1.5 transition-all border border-slate-700 hover:border-slate-600 cursor-pointer"
            >
              <Printer size={12} />
              <span>Print</span>
            </button>
            <button
              onClick={exportExcel}
              className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-medium rounded-lg text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
            >
              <FileSpreadsheet size={12} />
              <span>Excel</span>
            </button>
          </div>
        )}

        {/* Report Block */}
        {searched && (
          <div id="PrintReport" className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg overflow-hidden">
            
            {/* Print Header */}
            <div className="hidden print:block p-6 border-b border-slate-800 text-xs">
              <div className="flex justify-between font-semibold">
                <span>Agent Work Report With [ Property Type : {ptText} ] [ Area : {areaText} ] [ Category : {categoryText} ] [ From Date : {startDate} To {endDate} ]</span>
                <span>Report Generated On : {new Date().toLocaleDateString('en-IN')}</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              {loading ? (
                <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
                  <Loader2 className="animate-spin text-blue-500" size={28} />
                  <span>Computing work report...</span>
                </div>
              ) : records.length === 0 ? (
                <div className="py-20 text-center text-slate-500 text-sm">
                  No records found matching filters.
                </div>
              ) : (
                <table className="w-full border-collapse text-left text-sm text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 text-xs uppercase font-semibold border-b border-slate-800">
                    <tr>
                      <th className="py-4 px-6 text-center w-12">#</th>
                      <th className="py-4 px-6">Project Name</th>
                      <th className="py-4 px-6 text-right w-32">SQ.CM</th>
                      <th className="py-4 px-6 text-right w-32">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                    {records.map((r, idx) => (
                      <tr key={idx} className="hover:bg-slate-950/40 transition-colors">
                        <td className="py-4 px-6 text-center font-sans font-medium text-slate-500">{idx + 1}</td>
                        <td className="py-4 px-6 font-sans font-semibold text-white">{r.projectName} {r.projectCity}</td>
                        <td className="py-4 px-6 text-right text-slate-350">{r.size}</td>
                        <td className="py-4 px-6 text-right font-bold text-white">₹{r.total.toFixed(2)}</td>
                      </tr>
                    ))}
                    
                    {/* Summary Total Row */}
                    <tr className="bg-slate-950/45 font-sans font-bold border-t border-slate-800">
                      <td colSpan={2} className="py-4 px-6 text-right text-slate-300">Total</td>
                      <td className="py-4 px-6 text-right text-white text-sm">{totalSize}</td>
                      <td className="py-4 px-6 text-right text-white text-sm">₹{totalAmount.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
