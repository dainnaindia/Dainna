"use client";

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  Building, Search, PlusCircle, ShieldAlert, Loader2, Edit, Trash2, CheckCircle2,
  Copy, FileSpreadsheet, Database, FileText
} from 'lucide-react';

interface Project {
  projectId: number;
  projectName: string;
  stateId: number | null;
  stateName: string;
  city: string;
  addeddate: string;
}

interface StateObj {
  state_id: number;
  state_name: string;
}

export default function ProjectPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [states, setStates] = useState<StateObj[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<number | null>(null);

  // Form inputs
  const [projectName, setProjectName] = useState('');
  const [stateId, setStateId] = useState('');
  const [city, setCity] = useState('');

  const fetchDropdowns = async () => {
    try {
      const statesRes = await fetch('http://localhost:5000/api/users/states');
      const statesData = await statesRes.json();
      if (statesRes.ok) setStates(statesData.States || []);
    } catch (err) {
      console.error('Dropdown fetch error:', err);
    }
  };

  const fetchProjects = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('http://localhost:5000/api/projects?email=null');
      const data = await response.json();
      if (response.ok) {
        setProjects(data.Projects || []);
      } else {
        setError(data.Msg || 'Failed to retrieve projects.');
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
    fetchProjects();
  }, []);

  const handleOpenAddModal = () => {
    setIsEdit(false);
    setEditingProjectId(null);
    setProjectName('');
    setStateId('');
    setCity('');
    setModalOpen(true);
  };

  const handleOpenEditModal = (p: Project) => {
    setIsEdit(true);
    setEditingProjectId(p.projectId);
    setProjectName(p.projectName || '');
    setStateId(p.stateId ? String(p.stateId) : '');
    setCity(p.city || '');
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    try {
      const response = await fetch(`http://localhost:5000/api/projects/${id}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (response.ok) {
        setProjects(projects.filter(p => p.projectId !== id));
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
      ProjectName: projectName,
      StateID: stateId,
      City: city,
      AdvocateID: null,
      Email: null
    };

    const url = isEdit && editingProjectId
      ? `http://localhost:5000/api/projects/${editingProjectId}`
      : 'http://localhost:5000/api/projects';

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
        fetchProjects();
      } else {
        alert(data.Msg || 'Failed to register project details.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error while saving project.');
    }
  };

  // Export & Copy Handlers
  const handleCopy = () => {
    const headers = ['#', 'Project Name', 'City', 'State'];
    const rows = filteredProjects.map((project, idx) => [
      idx + 1,
      project.projectName,
      project.city,
      project.stateName
    ]);
    const text = [headers.join('\t'), ...rows.map(r => r.join('\t'))].join('\n');
    navigator.clipboard.writeText(text);
    alert('Table copied to clipboard!');
  };

  const handleExportCSV = (filename = 'projects.csv') => {
    const headers = ['#', 'Project Name', 'City', 'State'];
    const rows = filteredProjects.map((project, idx) => [
      idx + 1,
      project.projectName,
      project.city,
      project.stateName
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

  const filteredProjects = projects.filter(p => {
    const full = `${p.projectName} ${p.city} ${p.stateName}`.toLowerCase();
    return full.includes(searchTerm.toLowerCase());
  });

  return (
    <DashboardLayout role="admin">
      <div className="absolute top-10 right-10 w-[400px] h-[400px] rounded-full bg-blue-500/5 blur-[100px] pointer-events-none print:hidden" />

      <div className="space-y-6">
        <div className="flex justify-between items-center print:hidden">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <Building className="text-emerald-500" size={32} />
              System Projects
            </h2>
            <p className="text-slate-400 text-sm mt-1">Configure active township schemes, survey limits, and link them to Advocates</p>
          </div>
          <button
            onClick={handleOpenAddModal}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg text-sm transition-all flex items-center gap-2 cursor-pointer shadow-md"
          >
            <PlusCircle size={16} />
            <span>Add New Project</span>
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3 print:hidden">
            <ShieldAlert size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Filter & Export bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-900 border border-slate-800 rounded-xl shadow-md print:hidden">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input
              type="text"
              placeholder="Search by project name, city, state..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
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
              onClick={() => handleExportCSV('projects.csv')}
              className="p-2 text-emerald-500 hover:text-emerald-400 hover:bg-slate-800 transition-colors border-l border-slate-800"
              title="Export to Excel"
            >
              <FileSpreadsheet size={14} />
            </button>
            <button 
              onClick={() => handleExportCSV('projects.csv')}
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

        {/* Projects Grid Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg overflow-hidden print:border-none print:shadow-none print:bg-transparent">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400 print:hidden">
                <Loader2 className="animate-spin text-emerald-500" size={32} />
                <span>Loading system projects...</span>
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="py-20 text-center text-slate-500 text-sm">
                No project records matching your search queries were found.
              </div>
            ) : (
              <table className="w-full border-collapse text-left text-sm text-slate-300 print:text-black">
                <thead className="bg-slate-950 text-slate-400 text-xs uppercase font-semibold border-b border-slate-800 print:bg-slate-100 print:text-black">
                  <tr>
                    <th className="py-4 px-6 text-center w-12">#</th>
                    <th className="py-4 px-6">Project Name</th>
                    <th className="py-4 px-6">City</th>
                    <th className="py-4 px-6">State</th>
                    <th className="py-4 px-6 text-center w-28 print:hidden">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 print:divide-slate-200">
                  {filteredProjects.map((project, idx) => (
                    <tr key={project.projectId} className="hover:bg-slate-950/40 transition-colors print:hover:bg-transparent">
                      <td className="py-4 px-6 text-center font-medium text-slate-500">{idx + 1}</td>
                      <td className="py-4 px-6 font-semibold text-white print:text-black">{project.projectName}</td>
                      <td className="py-4 px-6">{project.city}</td>
                      <td className="py-4 px-6 text-slate-400 print:text-black">{project.stateName}</td>
                      <td className="py-4 px-6 text-center print:hidden">
                        <div className="flex items-center justify-center gap-3">
                          <button
                            onClick={() => handleOpenEditModal(project)}
                            title="Edit Project"
                            className="p-1.5 rounded bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white transition-all cursor-pointer border-none bg-transparent"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(project.projectId)}
                            title="Remove Project"
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

      {/* Modal Add / Edit Project */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 print:hidden">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden animate-fadeIn">
            <div className="p-6 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Building className="text-emerald-500" size={22} />
                <span>{isEdit ? 'Update Project configurations' : 'Register New Project'}</span>
              </h3>
              <button 
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors text-2xl cursor-pointer border-none bg-transparent"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-slate-400 text-xs font-semibold mb-1">Project Name *</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-1">State *</label>
                  <select
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
                    value={stateId}
                    onChange={(e) => setStateId(e.target.value)}
                  >
                    <option value="">-- SELECT --</option>
                    {states.map(s => (
                      <option key={s.state_id} value={s.state_id}>{s.state_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-1">City *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
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
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg text-sm transition-all cursor-pointer border-none"
                >
                  Save Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
