"use client";

import React, { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  Percent, Search, PlusCircle, ShieldAlert, Loader2, Edit, Trash2, CheckCircle2,
  Copy, FileSpreadsheet, Database, FileText
} from 'lucide-react';

interface HandlingCharge {
  chargeId: number;
  stateId: number | null;
  stateName: string;
  city: string;
  projectId: number | null;
  projectName: string;
  chargeInPerc: number | null;
  addeddate: string;
}

interface StateObj {
  state_id: number;
  state_name: string;
}

interface Project {
  projectId: number;
  projectName: string;
  city: string;
  stateId: number | null;
}

export default function HandlingChargesPage() {
  const [charges, setCharges] = useState<HandlingCharge[]>([]);
  const [states, setStates] = useState<StateObj[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Top Search Filter States
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [searchState, setSearchState] = useState('');
  const [searchCity, setSearchCity] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editingChargeId, setEditingChargeId] = useState<number | null>(null);

  // Form inputs (Modal)
  const [formStateId, setFormStateId] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formProjectId, setFormProjectId] = useState('');
  const [formChargeInPerc, setFormChargeInPerc] = useState('');

  const fetchDropdowns = async () => {
    try {
      const statesRes = await fetch('http://localhost:5000/api/users/states');
      const statesData = await statesRes.json();
      if (statesRes.ok) setStates(statesData.States || []);

      const projRes = await fetch('http://localhost:5000/api/projects');
      const projData = await projRes.json();
      if (projRes.ok) setProjects(projData.Projects || []);
    } catch (err) {
      console.error('Dropdown fetch error:', err);
    }
  };

  const fetchCharges = async (stateIdParam?: string, cityParam?: string) => {
    setLoading(true);
    setError('');
    try {
      let url = 'http://localhost:5000/api/billing/handling-charges';
      const params = [];
      if (stateIdParam) params.push(`stateId=${stateIdParam}`);
      if (cityParam) params.push(`city=${cityParam}`);
      if (params.length > 0) {
        url += `?${params.join('&')}`;
      }

      const response = await fetch(url);
      const data = await response.json();
      if (response.ok) {
        setCharges(data.Charges || []);
      } else {
        setError(data.Msg || 'Failed to retrieve handling charges.');
      }
    } catch (err) {
      console.error(err);
      setError('Cannot connect to API server. Ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDropdowns();
  }, []);

  // Compute distinct cities for top search filter based on selected State
  const searchAvailableCities = useMemo(() => {
    if (!selectedState) return [];
    const filtered = projects.filter(p => String(p.stateId) === selectedState);
    const citiesSet = new Set(filtered.map(p => p.city).filter(Boolean));
    return Array.from(citiesSet).sort();
  }, [projects, selectedState]);

  // Compute distinct cities for Add/Edit Modal based on State
  const formAvailableCities = useMemo(() => {
    if (!formStateId) return [];
    const filtered = projects.filter(p => String(p.stateId) === formStateId);
    const citiesSet = new Set(filtered.map(p => p.city).filter(Boolean));
    return Array.from(citiesSet).sort();
  }, [projects, formStateId]);

  // Compute projects for Add/Edit Modal based on State and City, excluding those already configured
  const formAvailableProjects = useMemo(() => {
    if (!formStateId || !formCity) return [];
    return projects.filter(p => {
      const matchStateAndCity = String(p.stateId) === formStateId && p.city.toLowerCase() === formCity.toLowerCase();
      if (!matchStateAndCity) return false;

      // Filter out projects that already have handling charges configured
      const hasCharge = charges.some(c => c.projectId === p.projectId && c.chargeId !== editingChargeId);
      return !hasCharge;
    });
  }, [projects, formStateId, formCity, charges, editingChargeId]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchState(selectedState);
    setSearchCity(selectedCity);
    fetchCharges(selectedState, selectedCity);
  };

  const handleOpenAddModal = () => {
    setIsEdit(false);
    setEditingChargeId(null);
    setFormStateId('');
    setFormCity('');
    setFormProjectId('');
    setFormChargeInPerc('');
    setModalOpen(true);
  };

  const handleOpenEditModal = (c: HandlingCharge) => {
    setIsEdit(true);
    setEditingChargeId(c.chargeId);
    setFormStateId(c.stateId ? String(c.stateId) : '');
    setFormCity(c.city || '');
    setFormProjectId(c.projectId ? String(c.projectId) : '');
    setFormChargeInPerc(c.chargeInPerc ? String(c.chargeInPerc) : '');
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to remove this handling charge?')) return;
    try {
      const response = await fetch(`http://localhost:5000/api/billing/handling-charges/${id}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (response.ok) {
        setCharges(charges.filter(c => c.chargeId !== id));
      } else {
        alert(data.Msg || 'Delete request failed.');
      }
    } catch (err) {
      console.error(err);
      alert('Delete request failed.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const payload = {
      StateID: formStateId,
      City: formCity,
      ProjectID: formProjectId,
      ChargesInPerc: formChargeInPerc
    };

    const url = isEdit && editingChargeId
      ? `http://localhost:5000/api/billing/handling-charges/${editingChargeId}`
      : 'http://localhost:5000/api/billing/handling-charges';

    const method = isEdit ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (response.ok && (data.Status === 2 || data.Status === 100)) {
        setModalOpen(false);
        fetchCharges(searchState, searchCity);
      } else {
        alert(data.Msg || 'Failed to save handling charges.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error while saving handling charge.');
    }
  };

  // Export & Copy Handlers
  const handleCopy = () => {
    const headers = ['#', 'State', 'City', 'Project Name', 'Charge (%)'];
    const rows = filteredCharges.map((c, idx) => [
      idx + 1,
      c.stateName,
      c.city,
      c.projectName,
      c.chargeInPerc
    ]);
    const text = [headers.join('\t'), ...rows.map(r => r.join('\t'))].join('\n');
    navigator.clipboard.writeText(text);
    alert('Table copied to clipboard!');
  };

  const handleExportCSV = (filename = 'handling_charges.csv') => {
    const headers = ['#', 'State', 'City', 'Project Name', 'Charge (%)'];
    const rows = filteredCharges.map((c, idx) => [
      idx + 1,
      c.stateName,
      c.city,
      c.projectName,
      c.chargeInPerc
    ]);
    const csvContent = [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8' });
    const encodedUri = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(encodedUri);
  };

  const filteredCharges = charges.filter(c => {
    const full = `${c.projectName} ${c.city} ${c.stateName}`.toLowerCase();
    return full.includes(searchTerm.toLowerCase());
  });

  return (
    <DashboardLayout role="admin">
      <div className="absolute top-10 right-10 w-[400px] h-[400px] rounded-full bg-blue-500/5 blur-[100px] pointer-events-none print:hidden" />

      <div className="space-y-6">
        <div className="flex justify-between items-center print:hidden">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <Percent className="text-blue-500" size={32} />
              Handling Charges Settings
            </h2>
            <p className="text-slate-400 text-sm mt-1">Configure dynamic commission fees mapped to states, cities, and development projects</p>
          </div>
          <button
            onClick={handleOpenAddModal}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg text-sm transition-all flex items-center gap-2 cursor-pointer shadow-md"
          >
            <PlusCircle size={16} />
            <span>Add New Handling Charge</span>
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3 print:hidden">
            <ShieldAlert size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Top Dropdown Search Filters */}
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-3 gap-6 p-5 bg-slate-900 border border-slate-800 rounded-xl shadow-md print:hidden">
          <div>
            <label className="block text-slate-400 text-xs font-semibold mb-1.5">State</label>
            <select
              value={selectedState}
              onChange={(e) => {
                setSelectedState(e.target.value);
                setSelectedCity(''); // Clear city on state change
              }}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="">-- ALL --</option>
              {states.map(s => (
                <option key={s.state_id} value={s.state_id}>{s.state_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-400 text-xs font-semibold mb-1.5">City</label>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="">-- ALL --</option>
              {searchAvailableCities.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full md:w-auto px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md border-none"
            >
              <CheckCircle2 size={16} />
              <span>Search</span>
            </button>
          </div>
        </form>

        {/* Display data only if state query has been submitted, matching legacy `if(isset($_GET['state']))` */}
        {searchState ? (
          <div className="space-y-6 animate-fadeIn">
            {/* Filter & Export toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-900 border border-slate-800 rounded-xl shadow-md print:hidden">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input
                  type="text"
                  placeholder="Search by project name, city..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="flex items-center border border-slate-800 bg-slate-950 rounded-lg p-0.5 overflow-hidden">
                <button 
                  onClick={handleCopy}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  title="Copy Table"
                >
                  <Copy size={14} />
                </button>
                <button 
                  onClick={() => handleExportCSV('handling_charges.csv')}
                  className="p-2 text-emerald-500 hover:text-emerald-400 hover:bg-slate-800 transition-colors border-l border-slate-800"
                  title="Export to Excel"
                >
                  <FileSpreadsheet size={14} />
                </button>
                <button 
                  onClick={() => handleExportCSV('handling_charges.csv')}
                  className="p-2 text-amber-500 hover:text-amber-400 hover:bg-slate-800 transition-colors border-l border-slate-800"
                  title="Export to CSV"
                >
                  <Database size={14} />
                </button>
                <button 
                  onClick={() => window.print()}
                  className="p-2 text-red-500 hover:text-red-400 hover:bg-slate-800 transition-colors border-l border-slate-800"
                  title="Print Layout"
                >
                  <FileText size={14} />
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg overflow-hidden print:border-none print:shadow-none print:bg-transparent">
              <div className="overflow-x-auto">
                {loading ? (
                  <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400 print:hidden">
                    <Loader2 className="animate-spin text-blue-500" size={32} />
                    <span>Loading handling charges settings...</span>
                  </div>
                ) : filteredCharges.length === 0 ? (
                  <div className="py-20 text-center text-slate-500 text-sm">
                    No handling charges configured matching your queries.
                  </div>
                ) : (
                  <table className="w-full border-collapse text-left text-sm text-slate-300 print:text-black">
                    <thead className="bg-slate-950 text-slate-400 text-xs uppercase font-semibold border-b border-slate-800 print:bg-slate-100 print:text-black">
                      <tr>
                        <th className="py-4 px-6 text-center w-12">#</th>
                        <th className="py-4 px-6">State</th>
                        <th className="py-4 px-6">City</th>
                        <th className="py-4 px-6">Project Name</th>
                        <th className="py-4 px-6 text-right">Charge (%)</th>
                        <th className="py-4 px-6 text-center w-28 print:hidden">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 print:divide-slate-200">
                      {filteredCharges.map((c, idx) => (
                        <tr key={c.chargeId} className="hover:bg-slate-950/40 transition-colors print:hover:bg-transparent">
                          <td className="py-4 px-6 text-center font-medium text-slate-500">{idx + 1}</td>
                          <td className="py-4 px-6 font-semibold text-white print:text-black">{c.stateName}</td>
                          <td className="py-4 px-6">{c.city}</td>
                          <td className="py-4 px-6 text-slate-400 print:text-black">{c.projectName}</td>
                          <td className="py-4 px-6 text-right text-blue-400 font-bold print:text-black">{c.chargeInPerc}%</td>
                          <td className="py-4 px-6 text-center print:hidden">
                            <div className="flex items-center justify-center gap-3">
                              <button
                                onClick={() => handleOpenEditModal(c)}
                                title="Edit Charges"
                                className="p-1.5 rounded bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white transition-all cursor-pointer border-none bg-transparent"
                              >
                                <Edit size={14} />
                              </button>
                              <button
                                onClick={() => handleDelete(c.chargeId)}
                                title="Remove Charges"
                                className="p-1.5 rounded bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all cursor-pointer border-none bg-transparent"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl bg-slate-900/30">
            Please select a State above and click Search to load Handling Charges settings.
          </div>
        )}
      </div>

      {/* Modal Add / Edit Handling Charge */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 print:hidden">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden animate-fadeIn">
            <div className="p-6 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Percent className="text-blue-500" size={22} />
                <span>{isEdit ? 'Update Handling Charge Rate' : 'Add New Handling Charge'}</span>
              </h3>
              <button 
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors text-2xl cursor-pointer border-none bg-transparent"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-1">State *</label>
                  <select
                    required
                    disabled={isEdit}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 disabled:opacity-50"
                    value={formStateId}
                    onChange={(e) => {
                      setFormStateId(e.target.value);
                      setFormCity(''); // Clear city on state change
                      setFormProjectId(''); // Clear project on state change
                    }}
                  >
                    <option value="">-- SELECT --</option>
                    {states.map(s => (
                      <option key={s.state_id} value={s.state_id}>{s.state_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-1">City *</label>
                  {isEdit ? (
                    <input
                      type="text"
                      readOnly
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none opacity-50"
                      value={formCity}
                    />
                  ) : (
                    <select
                      required
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                      value={formCity}
                      onChange={(e) => {
                        setFormCity(e.target.value);
                        setFormProjectId(''); // Clear project on city change
                      }}
                    >
                      <option value="">-- SELECT --</option>
                      {formAvailableCities.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="md:col-span-2">
                  <label className="block text-slate-400 text-xs font-semibold mb-1">Project Name *</label>
                  {isEdit ? (
                    <input
                      type="text"
                      readOnly
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none opacity-50"
                      value={projects.find(p => String(p.projectId) === formProjectId)?.projectName || 'N/A'}
                    />
                  ) : (
                    <select
                      required
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                      value={formProjectId}
                      onChange={(e) => setFormProjectId(e.target.value)}
                    >
                      <option value="">-- SELECT --</option>
                      {formAvailableProjects.map(p => (
                        <option key={p.projectId} value={p.projectId}>{p.projectName}</option>
                      ))}
                    </select>
                  )}
                </div>
                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-1">Charge (%) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 5.5"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none text-right focus:border-blue-500"
                    value={formChargeInPerc}
                    onChange={(e) => setFormChargeInPerc(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-755 text-slate-300 font-medium rounded-lg text-sm transition-all cursor-pointer border-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg text-sm transition-all cursor-pointer border-none"
                >
                  Save Charges
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
