"use client";

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  Layers, Edit, Loader2, ShieldAlert,
  Copy, FileSpreadsheet, Database, FileText, Search
} from 'lucide-react';

interface StateObj {
  state_id: number;
  state_name: string;
  state_code: string;
}

export default function StatePage() {
  const [states, setStates] = useState<StateObj[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingState, setEditingState] = useState<StateObj | null>(null);
  const [stateName, setStateName] = useState('');
  const [stateCode, setStateCode] = useState('');

  const fetchStates = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('http://localhost:5000/api/users/states');
      const data = await response.json();
      if (response.ok) {
        setStates(data.States || []);
      } else {
        setError(data.Msg || 'Failed to retrieve state records.');
      }
    } catch (err) {
      console.error(err);
      setError('Cannot connect to API server. Ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStates();
  }, []);

  const handleOpenEditModal = (s: StateObj) => {
    setEditingState(s);
    setStateName(s.state_name || '');
    setStateCode(s.state_code || '');
    setModalOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingState) return;

    try {
      const response = await fetch(`http://localhost:5000/api/users/states/${editingState.state_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ StateName: stateName, StateCode: stateCode })
      });
      const data = await response.json();

      if (response.ok) {
        setModalOpen(false);
        fetchStates();
      } else {
        alert(data.Msg || 'Failed to update state configurations.');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to save changes.');
    }
  };

  // Export & Copy Handlers
  const handleCopy = () => {
    const headers = ['#', 'State Name', 'State Code'];
    const rows = filteredStates.map((s, idx) => [
      idx + 1,
      s.state_name,
      s.state_code || 'N/A'
    ]);
    const text = [headers.join('\t'), ...rows.map(r => r.join('\t'))].join('\n');
    navigator.clipboard.writeText(text);
    alert('Table copied to clipboard!');
  };

  const handleExportCSV = (filename = 'states.csv') => {
    const headers = ['#', 'State Name', 'State Code'];
    const rows = filteredStates.map((s, idx) => [
      idx + 1,
      s.state_name,
      s.state_code || 'N/A'
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
  };

  const filteredStates = states.filter(s => {
    const full = `${s.state_name} ${s.state_code}`.toLowerCase();
    return full.includes(searchTerm.toLowerCase());
  });

  return (
    <DashboardLayout role="admin">
      <div className="absolute top-10 right-10 w-[400px] h-[400px] rounded-full bg-blue-500/5 blur-[100px] pointer-events-none" />

      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <Layers className="text-emerald-500" size={32} />
            State Configurations
          </h2>
          <p className="text-slate-400 text-sm mt-1">Configure active region states and alphanumeric codes</p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3 animate-fadeIn">
            <ShieldAlert size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Export & Filter Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-900 border border-slate-800 rounded-xl shadow-md print:hidden">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input
              type="text"
              placeholder="Search by state name or code..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center border border-slate-800 bg-slate-950 rounded-lg p-0.5 overflow-hidden">
            <button 
              type="button"
              onClick={handleCopy}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors bg-transparent border-none cursor-pointer"
              title="Copy Table"
            >
              <Copy size={14} />
            </button>
            <button 
              type="button"
              onClick={() => handleExportCSV('states.csv')}
              className="p-2 text-emerald-500 hover:text-emerald-400 hover:bg-slate-800 transition-colors border-l border-slate-800 bg-transparent border-t-none border-b-none border-r-none cursor-pointer"
              title="Export to Excel"
            >
              <FileSpreadsheet size={14} />
            </button>
            <button 
              type="button"
              onClick={() => handleExportCSV('states.csv')}
              className="p-2 text-amber-500 hover:text-amber-400 hover:bg-slate-800 transition-colors border-l border-slate-800 bg-transparent border-t-none border-b-none border-r-none cursor-pointer"
              title="Export to CSV"
            >
              <Database size={14} />
            </button>
            <button 
              type="button"
              onClick={() => window.print()}
              className="p-2 text-red-500 hover:text-red-400 hover:bg-slate-800 transition-colors border-l border-slate-800 bg-transparent border-t-none border-b-none border-r-none cursor-pointer"
              title="Print Layout"
            >
              <FileText size={14} />
            </button>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
                <Loader2 className="animate-spin text-emerald-500" size={32} />
                <span>Loading states...</span>
              </div>
            ) : filteredStates.length === 0 ? (
              <div className="py-20 text-center text-slate-500 text-sm">
                No state configurations found matching search.
              </div>
            ) : (
              <table className="w-full border-collapse text-left text-sm text-slate-300">
                <thead className="bg-slate-950 text-slate-400 text-xs uppercase font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-4 px-6 text-center w-16">#</th>
                    <th className="py-4 px-6">State Name</th>
                    <th className="py-4 px-6">State Code</th>
                    <th className="py-4 px-6 text-center w-24">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredStates.map((state, idx) => (
                    <tr key={state.state_id} className="hover:bg-slate-950/40 transition-colors">
                      <td className="py-4 px-6 text-center font-medium text-slate-500">{idx + 1}</td>
                      <td className="py-4 px-6 font-semibold text-white">{state.state_name}</td>
                      <td className="py-4 px-6 text-slate-400">{state.state_code || 'N/A'}</td>
                      <td className="py-4 px-6 text-center">
                        <button
                          onClick={() => handleOpenEditModal(state)}
                          title="Edit State Configurations"
                          className="p-1.5 rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all cursor-pointer"
                        >
                          <Edit size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Layers className="text-emerald-500" size={22} />
                <span>Update State Details</span>
              </h3>
              <button 
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div>
                <label className="block text-slate-400 text-xs font-semibold mb-1">State Name *</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none"
                  value={stateName}
                  onChange={(e) => setStateName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-slate-400 text-xs font-semibold mb-1">State Code</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none"
                  value={stateCode}
                  onChange={(e) => setStateCode(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-850 hover:bg-slate-800 text-slate-300 font-medium rounded-lg text-sm transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg text-sm transition-all"
                >
                  Update State
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
