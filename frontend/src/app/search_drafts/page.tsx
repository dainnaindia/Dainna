"use client";

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { FileSpreadsheet, Search, Loader2, AlertCircle, FileText } from 'lucide-react';

interface StateObj {
  state_id: number;
  state_name: string;
}

interface Draft {
  olbId: number;
  district: string;
  ownerFirstName: string;
  ownerLastName: string;
  ownerMobileNo: string;
  purchaserFirstName: string;
  purchaserLastName: string;
  purchaserEmail: string;
  language: string;
}

export default function SearchDraftsPage() {
  const [states, setStates] = useState<StateObj[]>([]);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loadingStates, setLoadingStates] = useState(true);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [area, setArea] = useState('1'); // '1' = Urban, '2' = Rural, '3' = Sector Wise
  const [stateId, setStateId] = useState('');
  const [district, setDistrict] = useState('');
  const [plotArea, setPlotArea] = useState('');
  
  // Urban specific
  const [citySurveyOffice, setCitySurveyOffice] = useState('');
  const [ward, setWard] = useState('');
  const [citySurveyNo, setCitySurveyNo] = useState('');
  const [sheetNo, setSheetNo] = useState('');

  // Rural specific
  const [taluka, setTaluka] = useState('');
  const [village, setVillage] = useState('');

  // Sector specific
  const [sectorNo, setSectorNo] = useState('');
  const [sectorPlotNo, setSectorPlotNo] = useState('');

  useEffect(() => {
    const fetchStates = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/users/states');
        const data = await res.json();
        if (res.ok) {
          setStates(data.States || []);
        }
      } catch (err) {
        console.error('Failed to load states', err);
      } finally {
        setLoadingStates(false);
      }
    };
    fetchStates();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingSearch(true);
    setError('');
    setSearched(true);

    const searchParams: any = {
      Area: parseInt(area),
      StateID: stateId ? parseInt(stateId) : undefined,
      District: district || undefined,
      PlotArea: plotArea || undefined,
    };

    if (area === '1') {
      searchParams.CitySurveyOffice = citySurveyOffice || undefined;
      searchParams.Ward = ward || undefined;
      searchParams.CitySurveyNo = citySurveyNo || undefined;
      searchParams.SheetNo = sheetNo || undefined;
    } else if (area === '2') {
      searchParams.Taluka = taluka || undefined;
      searchParams.Village = village || undefined;
      searchParams.CitySurveyNo = citySurveyNo || undefined; // Survey No is saved under citySurveyNo column
      searchParams.SectorPlotNo = sectorPlotNo || undefined; // Plot No saved under sectorPlotNo column
    } else if (area === '3') {
      searchParams.Taluka = taluka || undefined;
      searchParams.Village = village || undefined;
      searchParams.SectorNo = sectorNo || undefined;
      searchParams.SectorPlotNo = sectorPlotNo || undefined;
    }

    try {
      const response = await fetch('http://localhost:5000/api/drafts/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(searchParams)
      });
      const data = await response.json();
      if (response.ok) {
        setDrafts(data.Drafts || []);
      } else {
        setError(data.Error || 'Failed to complete search.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection to backend failed.');
    } finally {
      setLoadingSearch(false);
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="absolute top-10 right-10 w-[400px] h-[400px] rounded-full bg-blue-500/5 blur-[100px] pointer-events-none" />
      
      <div className="space-y-6 max-w-5xl mx-auto">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <Search className="text-blue-500" size={32} />
            Search Draft Records
          </h2>
          <p className="text-slate-400 text-sm mt-1">Search and filter legal draft registers based on territory boundaries.</p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Search Panel */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl shadow-lg">
          <form onSubmit={handleSearch} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              
              {/* Area Radio Buttons */}
              <div className="md:col-span-2">
                <label className="block text-slate-400 text-xs font-semibold mb-2">Area Type *</label>
                <div className="flex gap-4 p-2 bg-slate-950 border border-slate-800 rounded-lg">
                  <label className="flex items-center gap-2 text-sm text-slate-350 cursor-pointer">
                    <input
                      type="radio"
                      name="area"
                      value="1"
                      checked={area === '1'}
                      onChange={() => setArea('1')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span>Urban</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-350 cursor-pointer">
                    <input
                      type="radio"
                      name="area"
                      value="2"
                      checked={area === '2'}
                      onChange={() => setArea('2')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span>Rural</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-350 cursor-pointer">
                    <input
                      type="radio"
                      name="area"
                      value="3"
                      checked={area === '3'}
                      onChange={() => setArea('3')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span>Sector Wise</span>
                  </label>
                </div>
              </div>

              {/* State */}
              <div>
                <label className="block text-slate-400 text-xs font-semibold mb-2">State</label>
                {loadingStates ? (
                  <div className="h-10 bg-slate-950 border border-slate-800 rounded-lg flex items-center px-3">
                    <Loader2 className="animate-spin text-blue-500 mr-2" size={14} />
                    <span className="text-xs text-slate-500">Loading states...</span>
                  </div>
                ) : (
                  <select
                    className="w-full h-10 px-3 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                    value={stateId}
                    onChange={(e) => setStateId(e.target.value)}
                  >
                    <option value="">-- SELECT --</option>
                    {states.map((s) => (
                      <option key={s.state_id} value={s.state_id}>
                        {s.state_name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* District */}
              <div>
                <label className="block text-slate-400 text-xs font-semibold mb-2">District</label>
                <input
                  type="text"
                  placeholder="Enter district name"
                  className="w-full h-10 px-3 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                />
              </div>

            </div>

            {/* Area Conditional Fields */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-4 border-t border-slate-800/40">
              
              {/* Plot Area is required across all search sets */}
              <div>
                <label className="block text-slate-400 text-xs font-semibold mb-2">Plot Area (SQMT)</label>
                <input
                  type="text"
                  placeholder="e.g. 500"
                  className="w-full h-10 px-3 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                  value={plotArea}
                  onChange={(e) => setPlotArea(e.target.value.replace(/[^0-9.]/g, ''))}
                />
              </div>

              {/* Urban fields */}
              {area === '1' && (
                <>
                  <div>
                    <label className="block text-slate-400 text-xs font-semibold mb-2">City Survey Office</label>
                    <input
                      type="text"
                      className="w-full h-10 px-3 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                      value={citySurveyOffice}
                      onChange={(e) => setCitySurveyOffice(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-xs font-semibold mb-2">Ward</label>
                    <input
                      type="text"
                      className="w-full h-10 px-3 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                      value={ward}
                      onChange={(e) => setWard(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-xs font-semibold mb-2">Survey No / CTS No</label>
                    <input
                      type="text"
                      className="w-full h-10 px-3 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                      value={citySurveyNo}
                      onChange={(e) => setCitySurveyNo(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-xs font-semibold mb-2">Sheet No</label>
                    <input
                      type="text"
                      className="w-full h-10 px-3 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                      value={sheetNo}
                      onChange={(e) => setSheetNo(e.target.value)}
                    />
                  </div>
                </>
              )}

              {/* Rural fields */}
              {area === '2' && (
                <>
                  <div>
                    <label className="block text-slate-400 text-xs font-semibold mb-2">Taluka</label>
                    <input
                      type="text"
                      className="w-full h-10 px-3 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                      value={taluka}
                      onChange={(e) => setTaluka(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-xs font-semibold mb-2">Village</label>
                    <input
                      type="text"
                      className="w-full h-10 px-3 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                      value={village}
                      onChange={(e) => setVillage(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-xs font-semibold mb-2">Survey No / Block No</label>
                    <input
                      type="text"
                      className="w-full h-10 px-3 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                      value={citySurveyNo}
                      onChange={(e) => setCitySurveyNo(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-xs font-semibold mb-2">Plot No</label>
                    <input
                      type="text"
                      className="w-full h-10 px-3 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                      value={sectorPlotNo}
                      onChange={(e) => setSectorPlotNo(e.target.value)}
                    />
                  </div>
                </>
              )}

              {/* Sector Wise fields */}
              {area === '3' && (
                <>
                  <div>
                    <label className="block text-slate-400 text-xs font-semibold mb-2">Taluka</label>
                    <input
                      type="text"
                      className="w-full h-10 px-3 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                      value={taluka}
                      onChange={(e) => setTaluka(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-xs font-semibold mb-2">Village</label>
                    <input
                      type="text"
                      className="w-full h-10 px-3 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                      value={village}
                      onChange={(e) => setVillage(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-xs font-semibold mb-2">Sector No</label>
                    <input
                      type="text"
                      className="w-full h-10 px-3 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                      value={sectorNo}
                      onChange={(e) => setSectorNo(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-xs font-semibold mb-2">Plot No</label>
                    <input
                      type="text"
                      className="w-full h-10 px-3 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                      value={sectorPlotNo}
                      onChange={(e) => setSectorPlotNo(e.target.value)}
                    />
                  </div>
                </>
              )}

            </div>

            <div className="flex justify-end pt-4 border-t border-slate-800">
              <button
                type="submit"
                disabled={loadingSearch}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-sm transition-all flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
              >
                {loadingSearch ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <Search size={16} />
                    <span>Search Records</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Results Grid */}
        {searched && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex items-center gap-3 bg-slate-900/50">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                <FileSpreadsheet size={20} />
              </div>
              <h3 className="font-semibold text-lg text-white">Matching Draft Documents</h3>
            </div>

            <div className="overflow-x-auto">
              {loadingSearch ? (
                <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
                  <Loader2 className="animate-spin text-blue-500" size={28} />
                  <span>Locating files...</span>
                </div>
              ) : drafts.length === 0 ? (
                <div className="py-20 text-center text-slate-500 text-sm">
                  No matching drafts found for this query filter.
                </div>
              ) : (
                <table className="w-full border-collapse text-left text-sm text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 text-xs uppercase font-semibold border-b border-slate-800">
                    <tr>
                      <th className="py-4 px-6 text-center w-12">#</th>
                      <th className="py-4 px-6">District</th>
                      <th className="py-4 px-6">Owner Name</th>
                      <th className="py-4 px-6">Owner Mobile</th>
                      <th className="py-4 px-6">Purchaser Name</th>
                      <th className="py-4 px-6">Purchaser Email</th>
                      <th className="py-4 px-6 text-center w-20">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {drafts.map((draft, idx) => (
                      <tr key={draft.olbId} className="hover:bg-slate-950/40 transition-colors">
                        <td className="py-4 px-6 text-center font-medium text-slate-500">{idx + 1}</td>
                        <td className="py-4 px-6 font-semibold text-white">{draft.district}</td>
                        <td className="py-4 px-6">{draft.ownerFirstName} {draft.ownerLastName}</td>
                        <td className="py-4 px-6 text-slate-400">{draft.ownerMobileNo || 'N/A'}</td>
                        <td className="py-4 px-6">{draft.purchaserFirstName} {draft.purchaserLastName}</td>
                        <td className="py-4 px-6 text-slate-400">{draft.purchaserEmail || 'N/A'}</td>
                        <td className="py-4 px-6 text-center">
                          <a
                            href={`/pay_advocate?oid=${draft.olbId}`}
                            title="View / Edit Draft Details"
                            className="inline-flex items-center justify-center p-1.5 rounded bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white transition-all cursor-pointer"
                          >
                            <FileText size={14} />
                          </a>
                        </td>
                      </tr>
                    ))}
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
