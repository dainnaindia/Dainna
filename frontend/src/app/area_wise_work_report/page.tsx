"use client";

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Loader2, AlertCircle, FileSpreadsheet, Printer, Search, MapPin } from 'lucide-react';

interface StateObj {
  state_id: number;
  state_name: string;
}

interface AreaRecord {
  stateName: string;
  district: string;
  count: number;
  cso?: string;
  ward?: string;
  taluka?: string;
  village?: string;
  sectorNo?: string;
}

export default function AreaWiseWorkReportPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [records, setRecords] = useState<AreaRecord[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // States list for filters
  const [states, setStates] = useState<StateObj[]>([]);

  // Search parameters
  const [startdate, setStartdate] = useState('');
  const [enddate, setEnddate] = useState('');
  const [propertyType, setPropertyType] = useState('0'); // 0=ALL, 1=Open Land, 2=Open Building
  const [category, setCategory] = useState('0'); // 0=ALL, 1=Customize, 2=Readymade
  const [area, setArea] = useState('1'); // 1=Urban, 2=Rural, 3=Sector-wise
  const [stateId, setStateId] = useState('');
  const [district, setDistrict] = useState('');

  // Location sub-filters
  const [cso, setCso] = useState('');
  const [ward, setWard] = useState('');
  const [taluka, setTaluka] = useState('');
  const [village, setVillage] = useState('');
  const [sectorNo, setSectorNo] = useState('');

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

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setHasSearched(true);

    try {
      let url = `http://localhost:5000/api/reports/area-wise?startdate=${startdate}&enddate=${enddate}&property_type=${propertyType}&category=${category}&area=${area}`;
      if (stateId) url += `&stateid=${stateId}`;
      if (district) url += `&district=${encodeURIComponent(district)}`;
      if (area === '1') {
        if (cso) url += `&citysurveyoffice=${encodeURIComponent(cso)}`;
        if (ward) url += `&ward=${encodeURIComponent(ward)}`;
      } else if (area === '2') {
        if (taluka) url += `&taluka=${encodeURIComponent(taluka)}`;
        if (village) url += `&village=${encodeURIComponent(village)}`;
      } else if (area === '3') {
        if (taluka) url += `&taluka=${encodeURIComponent(taluka)}`;
        if (village) url += `&village=${encodeURIComponent(village)}`;
        if (sectorNo) url += `&sectorno=${encodeURIComponent(sectorNo)}`;
      }

      const response = await fetch(url);
      const data = await response.json();
      if (response.ok) {
        setRecords(data.Records || []);
      } else {
        setError(data.Error || 'Failed to retrieve area wise work report.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection to server failed. Verify backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    let headers: string[] = [];
    if (area === '1') {
      headers = ['#', 'State', 'District', 'City Survey Office', 'Ward', 'Count'];
    } else if (area === '2') {
      headers = ['#', 'State', 'District', 'Taluka', 'Village', 'Count'];
    } else if (area === '3') {
      headers = ['#', 'State', 'District', 'Taluka', 'Village', 'Sector No', 'Count'];
    }

    const rows = records.map((r, idx) => {
      if (area === '1') {
        return [idx + 1, r.stateName, r.district, r.cso || '', r.ward || '', r.count];
      } else if (area === '2') {
        return [idx + 1, r.stateName, r.district, r.taluka || '', r.village || '', r.count];
      } else {
        return [idx + 1, r.stateName, r.district, r.taluka || '', r.village || '', r.sectorNo || '', r.count];
      }
    });

    const totalCount = records.reduce((acc, r) => acc + (r.count || 0), 0);
    const totalsRow = new Array(headers.length - 1).fill('');
    totalsRow[0] = 'Total';
    totalsRow[headers.length - 2] = totalCount;
    rows.push(totalsRow);

    const titleText = area === '1' ? 'Urban' : area === '2' ? 'Rural' : 'Sector-wise';
    const csvContent = [
        `"Area Wise Completed Work Report (${titleText}) from ${startdate} to ${enddate}"`,
        '',
        headers.join(','), 
        ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
      ].join('\n');
    
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8' });
    const encodedUri = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `area_wise_report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(encodedUri);
  };

  const totalCompletedDrafts = records.reduce((acc, r) => acc + (r.count || 0), 0);

  return (
    <DashboardLayout role="admin">
      <div className="absolute top-10 right-10 w-[400px] h-[400px] rounded-full bg-indigo-500/5 blur-[100px] pointer-events-none print:hidden" />
      
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
              <MapPin className="text-indigo-500" size={32} />
              Area Wise Work Report
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Analyze completed drafts aggregations grouped by Urban, Rural, or Sector-wise territory subdivisions.
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
          <h2 className="text-xl font-bold text-black">Area Wise Completed Drafts Report</h2>
          <p className="text-xs text-black mt-1">
            Category: {area === '1' ? 'Urban' : area === '2' ? 'Rural' : 'Sector-wise'} | Date: {startdate} to {enddate}
          </p>
          <p className="text-xs text-black">Generated on: {new Date().toLocaleDateString('en-GB')}</p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3 print:hidden">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Filters Panel */}
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
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
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
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 text-xs font-semibold mb-1">Property Type</label>
                <select
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="0">ALL</option>
                  <option value="1">Open Land</option>
                  <option value="2">Open Building</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-300 text-xs font-semibold mb-1">Draft Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="0">ALL</option>
                  <option value="1">Customize</option>
                  <option value="2">Readymade</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-slate-300 text-xs font-semibold mb-1">Area Category</label>
                <select
                  value={area}
                  onChange={(e) => {
                    setArea(e.target.value);
                    // Clear other area sub-filters
                    setCso('');
                    setWard('');
                    setTaluka('');
                    setVillage('');
                    setSectorNo('');
                  }}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="1">Urban</option>
                  <option value="2">Rural</option>
                  <option value="3">Sector-wise</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-300 text-xs font-semibold mb-1">State</label>
                <select
                  value={stateId}
                  onChange={(e) => setStateId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="">-- ALL --</option>
                  {states.map(s => (
                    <option key={s.state_id} value={s.state_id}>{s.state_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-300 text-xs font-semibold mb-1">District</label>
                <input
                  type="text"
                  placeholder="Enter District Name"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Dynamic Cascading Location Fields */}
              {area === '1' && (
                <>
                  <div>
                    <label className="block text-slate-300 text-xs font-semibold mb-1">City Survey Office</label>
                    <input
                      type="text"
                      placeholder="CSO"
                      value={cso}
                      onChange={(e) => setCso(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 text-xs font-semibold mb-1">Ward</label>
                    <input
                      type="text"
                      placeholder="Ward Name"
                      value={ward}
                      onChange={(e) => setWard(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </>
              )}

              {(area === '2' || area === '3') && (
                <>
                  <div>
                    <label className="block text-slate-300 text-xs font-semibold mb-1">Taluka</label>
                    <input
                      type="text"
                      placeholder="Taluka"
                      value={taluka}
                      onChange={(e) => setTaluka(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 text-xs font-semibold mb-1">Village</label>
                    <input
                      type="text"
                      placeholder="Village"
                      value={village}
                      onChange={(e) => setVillage(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </>
              )}

              {area === '3' && (
                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-1">Sector No</label>
                  <input
                    type="text"
                    placeholder="Sector No"
                    value={sectorNo}
                    onChange={(e) => setSectorNo(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg text-sm transition-all flex items-center gap-2 cursor-pointer shadow-md justify-center"
              >
                <Search size={16} />
                <span>Search Records</span>
              </button>
            </div>
          </form>
        </div>

        {hasSearched && (
          <div className="space-y-6">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400 print:hidden">
                <Loader2 className="animate-spin text-indigo-500" size={28} />
                <span>Aggregating territory data...</span>
              </div>
            ) : records.length === 0 ? (
              <div className="py-20 text-center text-slate-500 text-sm print:text-black">
                No draft completions registered for the chosen parameters.
              </div>
            ) : (
              <>
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl w-72 print:border-black print:bg-white">
                  <span className="block text-slate-500 text-[10px] uppercase font-bold tracking-wider print:text-black font-semibold">Total Completed Drafts</span>
                  <span className="text-2xl font-extrabold text-white mt-1 block print:text-black">{totalCompletedDrafts}</span>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg overflow-hidden print:border-0 print:shadow-none print:bg-white">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-sm text-slate-300 print:text-black">
                      <thead className="bg-slate-950 text-slate-400 text-xs uppercase font-semibold border-b border-slate-800 print:bg-slate-100 print:text-black print:border-black">
                        <tr>
                          <th className="py-4 px-4 text-center w-12">#</th>
                          <th className="py-4 px-4">State</th>
                          <th className="py-4 px-4">District</th>
                          {area === '1' && (
                            <>
                              <th className="py-4 px-4">City Survey Office</th>
                              <th className="py-4 px-4">Ward</th>
                            </>
                          )}
                          {(area === '2' || area === '3') && (
                            <>
                              <th className="py-4 px-4">Taluka</th>
                              <th className="py-4 px-4">Village</th>
                            </>
                          )}
                          {area === '3' && <th className="py-4 px-4">Sector No</th>}
                          <th className="py-4 px-4 text-center w-32">Completed Draft Count</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 print:divide-black">
                        {records.map((r, idx) => (
                          <tr key={idx} className="hover:bg-slate-950/40 transition-colors print:hover:bg-transparent">
                            <td className="py-3 px-4 text-center font-medium text-slate-500 print:text-black">{idx + 1}</td>
                            <td className="py-3 px-4 font-semibold text-white print:text-black">{r.stateName}</td>
                            <td className="py-3 px-4">{r.district}</td>
                            {area === '1' && (
                              <>
                                <td className="py-3 px-4">{r.cso || 'N/A'}</td>
                                <td className="py-3 px-4 text-slate-400 print:text-black">{r.ward || 'N/A'}</td>
                              </>
                            )}
                            {(area === '2' || area === '3') && (
                              <>
                                <td className="py-3 px-4">{r.taluka || 'N/A'}</td>
                                <td className="py-3 px-4 text-slate-400 print:text-black">{r.village || 'N/A'}</td>
                              </>
                            )}
                            {area === '3' && <td className="py-3 px-4 text-slate-400 print:text-black">{r.sectorNo || 'N/A'}</td>}
                            <td className="py-3 px-4 text-center font-bold text-indigo-400 print:text-black">{r.count}</td>
                          </tr>
                        ))}

                        <tr className="bg-slate-950/50 font-bold border-t border-slate-800 text-white print:bg-slate-50 print:text-black print:border-black">
                          <td className="py-4 px-4">Total</td>
                          <td className="py-4 px-4"></td>
                          <td className="py-4 px-4"></td>
                          <td className="py-4 px-4"></td>
                          <td className="py-4 px-4"></td>
                          {area === '3' && <td className="py-4 px-4"></td>}
                          <td className="py-4 px-4 text-center font-extrabold">{totalCompletedDrafts}</td>
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
