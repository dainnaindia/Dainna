"use client";

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Loader2, AlertCircle, FileSpreadsheet, Printer, Search } from 'lucide-react';

interface StateObj {
  state_id: number;
  state_name: string;
}

interface WorkRecord {
  advocateName: string;
  projectName: string;
  size: number;
  total: number;
}

export default function AdminAdvWorkReportPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [records, setRecords] = useState<WorkRecord[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // States & cities dropdown filters
  const [states, setStates] = useState<StateObj[]>([]);
  const [cities, setCities] = useState<string[]>([]);

  // Search parameters
  const [startdate, setStartdate] = useState('');
  const [enddate, setEnddate] = useState('');
  const [propertyType, setPropertyType] = useState('0'); // 0=ALL, 1=Open Land, 2=Open Building
  const [area, setArea] = useState('0'); // 0=ALL, 1=Urban, 2=Rural, 3=Sector
  const [category, setCategory] = useState('0'); // 0=ALL, 1=Customize, 2=Readymade
  const [stateId, setStateId] = useState('');
  const [city, setCity] = useState('');
  const [sortingBy, setSortingBy] = useState('1'); // 1 = Total Amount, 2 = Size

  useEffect(() => {
    // Set default dates
    const today = new Date();
    const pad = (num: number) => String(num).padStart(2, '0');
    
    const formattedToday = `${pad(today.getDate())}-${pad(today.getMonth() + 1)}-${today.getFullYear()}`;
    const formattedMonthStart = `01-${pad(today.getMonth() + 1)}-${today.getFullYear()}`;
    
    setStartdate(formattedMonthStart);
    setEnddate(formattedToday);

    // Fetch states
    fetch('http://localhost:5000/api/users/states')
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
    fetch(`http://localhost:5000/api/projects?StateID=${stateId}`)
      .then(res => res.json())
      .then(data => {
        const list: any[] = data.Projects || [];
        const uniqueCities = Array.from(new Set(list.map(p => p.city).filter(Boolean)));
        setCities(uniqueCities);
        setCity('');
      })
      .catch(err => console.error(err));
  }, [stateId]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setHasSearched(true);

    try {
      let url = `http://localhost:5000/api/reports/advocate-work-report?startdate=${startdate}&enddate=${enddate}&property_type=${propertyType}&area=${area}&category=${category}&sorting_by=${sortingBy}`;
      if (stateId) url += `&stateid=${stateId}`;
      if (city) url += `&city=${encodeURIComponent(city)}`;

      const response = await fetch(url);
      const data = await response.json();
      if (response.ok) {
        setRecords(data.Records || []);
      } else {
        setError(data.Error || 'Failed to retrieve advocate work report.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection to server failed. Verify backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const getTotals = () => {
    let size = 0;
    let amount = 0;
    records.forEach(r => {
      size += r.size || 0;
      amount += r.total || 0;
    });
    return { size, amount };
  };

  const exportToCSV = () => {
    const headers = ['#', 'Advocate Name', 'Project Name', 'Size (Sq.Ft)', 'Total Payout'];
    const rows = records.map((r, idx) => [
      idx + 1,
      r.advocateName,
      r.projectName,
      r.size || 0,
      r.total || 0
    ]);

    const { size, amount } = getTotals();
    rows.push(['', 'Total', '', size, amount]);

    const csvContent = [
        `"Admin Advocate Work Report from ${startdate} to ${enddate}"`,
        '',
        headers.join(','), 
        ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
      ].join('\n');
    
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8' });
    const encodedUri = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `admin_advocate_work_report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(encodedUri);
  };

  const totals = getTotals();

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
            <h2 className="text-3xl font-extrabold tracking-tight text-white">Advocate Work Report</h2>
            <p className="text-slate-400 text-sm mt-1">
              Admin interface to analyze total work size and payout aggregates grouped by advocate and project.
            </p>
          </div>
          {hasSearched && records.length > 0 && (
            <div className="flex gap-3">
              <button
                onClick={exportToCSV}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-sm transition-all flex items-center gap-2 border border-slate-700 cursor-pointer"
              >
                <FileSpreadsheet size={16} />
                <span>Export Excel</span>
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-sm transition-all flex items-center gap-2 border border-slate-700 cursor-pointer"
              >
                <Printer size={16} />
                <span>Print Report</span>
              </button>
            </div>
          )}
        </div>

        {/* Print Header */}
        <div className="hidden print:block text-center border-b border-black pb-4 mb-6">
          <h2 className="text-xl font-bold text-black">Advocate Work Report (Admin)</h2>
          <p className="text-xs text-black mt-1">Date Range: {startdate} to {enddate}</p>
          <p className="text-xs text-black">Generated on: {new Date().toLocaleDateString('en-GB')}</p>
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
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-slate-300 text-xs font-semibold mb-1">Start Date</label>
                <input
                  type="text"
                  placeholder="DD-MM-YYYY"
                  required
                  value={startdate}
                  onChange={(e) => setStartdate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
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
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 text-xs font-semibold mb-1">Property Type</label>
                <select
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="0">ALL</option>
                  <option value="1">Open Land</option>
                  <option value="2">Open Building</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-300 text-xs font-semibold mb-1">Area Category</label>
                <select
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="0">ALL</option>
                  <option value="1">Urban</option>
                  <option value="2">Rural</option>
                  <option value="3">Sector-wise</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
              <div>
                <label className="block text-slate-300 text-xs font-semibold mb-1">Draft Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="0">ALL</option>
                  <option value="1">Customize</option>
                  <option value="2">Readymade</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-300 text-xs font-semibold mb-1">State</label>
                <select
                  value={stateId}
                  onChange={(e) => setStateId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
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
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 disabled:opacity-50"
                >
                  <option value="">-- ALL --</option>
                  {cities.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-300 text-xs font-semibold mb-1">Sorting By</label>
                <select
                  value={sortingBy}
                  onChange={(e) => setSortingBy(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="1">Total Payout</option>
                  <option value="2">Total Size</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg text-sm transition-all flex items-center gap-2 cursor-pointer shadow-md justify-center w-full sm:w-auto"
              >
                <Search size={16} />
                <span>Search Report</span>
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
                No matching advocate work records found.
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 print:grid-cols-2">
                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl print:border-black print:bg-white">
                    <span className="block text-slate-500 text-[10px] uppercase font-bold tracking-wider print:text-black font-semibold">Total Size Sum (Sq.Ft)</span>
                    <span className="text-2xl font-extrabold text-white mt-1 block print:text-black">{totals.size.toFixed(2)}</span>
                  </div>
                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl print:border-black print:bg-white">
                    <span className="block text-slate-500 text-[10px] uppercase font-bold tracking-wider print:text-black font-semibold">Total Payouts (₹)</span>
                    <span className="text-2xl font-extrabold text-blue-400 mt-1 block print:text-black">₹{totals.amount.toFixed(2)}</span>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg overflow-hidden print:border-0 print:shadow-none print:bg-white">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-sm text-slate-300 print:text-black">
                      <thead className="bg-slate-950 text-slate-400 text-xs uppercase font-semibold border-b border-slate-800 print:bg-slate-100 print:text-black print:border-black">
                        <tr>
                          <th className="py-4 px-4 text-center w-12">#</th>
                          <th className="py-4 px-4">Advocate Name</th>
                          <th className="py-4 px-4">Project Name</th>
                          <th className="py-4 px-4 text-right">Size (Sq.Ft)</th>
                          <th className="py-4 px-4 text-right">Total Payouts (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 print:divide-black">
                        {records.map((r, idx) => (
                          <tr key={idx} className="hover:bg-slate-950/40 transition-colors print:hover:bg-transparent">
                            <td className="py-3.5 px-4 text-center font-medium text-slate-500 print:text-black">{idx + 1}</td>
                            <td className="py-3.5 px-4 font-semibold text-white print:text-black">{r.advocateName}</td>
                            <td className="py-3.5 px-4">{r.projectName}</td>
                            <td className="py-3.5 px-4 text-right">{r.size.toFixed(2)}</td>
                            <td className="py-3.5 px-4 text-right font-semibold text-blue-450 print:text-black">₹{r.total.toFixed(2)}</td>
                          </tr>
                        ))}

                        <tr className="bg-slate-950/50 font-bold border-t border-slate-800 text-white print:bg-slate-50 print:text-black print:border-black">
                          <td className="py-4 px-4">Total</td>
                          <td className="py-4 px-4"></td>
                          <td className="py-4 px-4"></td>
                          <td className="py-4 px-4 text-right">{totals.size.toFixed(2)}</td>
                          <td className="py-4 px-4 text-right font-extrabold text-blue-400 print:text-black">₹{totals.amount.toFixed(2)}</td>
                        </tr>
                      </tbody>
                    </table>
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
