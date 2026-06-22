"use client";

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Mail, Search, ShieldAlert, Loader2, Trash2, Send, Copy } from 'lucide-react';

interface RegLink {
  projectId: number;
  projectName: string;
  stateId: number;
  stateName: string;
  city: string;
  email: string;
  regLinkSentOn: string;
}

interface StateObj {
  state_id: number;
  state_name: string;
}

interface UnassignedProject {
  projectId: number;
  projectName: string;
  city: string;
  state_master?: {
    state_id: number;
    state_name: string;
  } | null;
}

export default function RegLinkPage() {
  const [links, setLinks] = useState<RegLink[]>([]);
  const [pendingProjects, setPendingProjects] = useState<UnassignedProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingLoading, setPendingLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'sent' | 'pending'>('sent');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [states, setStates] = useState<StateObj[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [projects, setProjects] = useState<UnassignedProject[]>([]);
  const [prefilledProject, setPrefilledProject] = useState<any | null>(null);

  // Form inputs
  const [stateId, setStateId] = useState('');
  const [city, setCity] = useState('');
  const [projectId, setProjectId] = useState('');
  const [emailId, setEmailId] = useState('');

  const fetchLinks = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('http://localhost:5000/api/projects/pending-links');
      const data = await response.json();
      if (response.ok) {
        setLinks(data.Links || []);
      } else {
        setError(data.Msg || 'Failed to retrieve registration links.');
      }
    } catch (err) {
      console.error(err);
      setError('Cannot connect to API server. Ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingProjects = async () => {
    setPendingLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/projects/unassigned');
      const data = await response.json();
      if (response.ok) {
        setPendingProjects(data.Projects || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPendingLoading(false);
    }
  };

  const fetchStates = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/users/states');
      const data = await res.json();
      if (res.ok) setStates(data.States || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchLinks();
    fetchPendingProjects();
    fetchStates();
  }, []);

  // Cascading Cities
  useEffect(() => {
    if (!stateId) {
      setCities([]);
      setCity('');
      return;
    }
    fetch(`http://localhost:5000/api/projects/unassigned?StateID=${stateId}`)
      .then(res => res.json())
      .then(data => {
        const list: UnassignedProject[] = data.Projects || [];
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
    fetch(`http://localhost:5000/api/projects/unassigned?StateID=${stateId}&City=${city}`)
      .then(res => res.json())
      .then(data => {
        setProjects(data.Projects || []);
        setProjectId('');
      })
      .catch(err => console.error(err));
  }, [stateId, city]);

  const handleOpenModal = () => {
    setPrefilledProject(null);
    setStateId('');
    setCity('');
    setProjectId('');
    setEmailId('');
    setModalOpen(true);
  };

  const handleOpenPrefilledModal = (p: any) => {
    setPrefilledProject(p);
    setProjectId(String(p.projectId));
    setEmailId('');
    setModalOpen(true);
  };

  const handleRemove = async (id: number) => {
    if (!confirm('Are you sure you want to remove this registration link?')) return;
    try {
      const response = await fetch('http://localhost:5000/api/projects/remove-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ProjectID: id })
      });
      const data = await response.json();
      if (response.ok) {
        setLinks(links.filter(l => l.projectId !== id));
        fetchPendingProjects(); // Move back to pending list
      } else {
        alert(data.Msg || 'Failed to remove registration link.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error while removing link.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/projects/send-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ProjectID: projectId, EmailID: emailId })
      });
      const data = await response.json();
      if (response.ok) {
        setModalOpen(false);
        fetchLinks();
        fetchPendingProjects();
      } else {
        alert(data.Msg || 'Failed to register link.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error.');
    }
  };

  const handleCopyLink = (projId: number) => {
    const url = `http://localhost:3000/register_advocate?pid=${projId}`;
    navigator.clipboard.writeText(url);
    alert('Advocate registration link copied to clipboard!');
  };

  const filteredLinks = links.filter(l => {
    const full = `${l.projectName} ${l.city} ${l.stateName} ${l.email}`.toLowerCase();
    return full.includes(searchTerm.toLowerCase());
  });

  const filteredPending = pendingProjects.filter(p => {
    const stateName = p.state_master?.state_name || '';
    const full = `${p.projectName} ${p.city} ${stateName}`.toLowerCase();
    return full.includes(searchTerm.toLowerCase());
  });

  return (
    <DashboardLayout role="admin">
      <div className="absolute top-10 right-10 w-[400px] h-[400px] rounded-full bg-blue-500/5 blur-[100px] pointer-events-none" />

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <Mail className="text-purple-500" size={32} />
              Registration Links
            </h2>
            <p className="text-slate-400 text-sm mt-1">Track and manage sent advocate registration invitation emails</p>
          </div>
          <button
            onClick={handleOpenModal}
            className="px-5 py-2.5 bg-purple-650 hover:bg-purple-600 text-white font-medium rounded-lg text-sm transition-all flex items-center gap-2 cursor-pointer shadow-md"
          >
            <Send size={16} />
            <span>Send Registration Link</span>
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3">
            <ShieldAlert size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Tab Switcher & Search Bar */}
        <div className="space-y-4">
          <div className="flex border-b border-slate-800">
            <button
              onClick={() => setActiveTab('sent')}
              className={`pb-3 px-6 text-sm font-bold tracking-wider transition-all border-b-2 relative ${
                activeTab === 'sent'
                  ? 'border-purple-500 text-purple-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Sent Invitations ({filteredLinks.length})
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`pb-3 px-6 text-sm font-bold tracking-wider transition-all border-b-2 relative ${
                activeTab === 'pending'
                  ? 'border-purple-500 text-purple-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Pending Links to Send ({filteredPending.length})
            </button>
          </div>

          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl shadow-md flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input
                type="text"
                placeholder={
                  activeTab === 'sent'
                    ? "Search by project name, city, state, advocate email..."
                    : "Search by project name, city, state..."
                }
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Dynamic Tables */}
        {activeTab === 'sent' ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              {loading ? (
                <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
                  <Loader2 className="animate-spin text-purple-500" size={32} />
                  <span>Loading registration links...</span>
                </div>
              ) : filteredLinks.length === 0 ? (
                <div className="py-20 text-center text-slate-500 text-sm">
                  No active registration invitation links found.
                </div>
              ) : (
                <table className="w-full border-collapse text-left text-sm text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 text-xs uppercase font-semibold border-b border-slate-800">
                    <tr>
                      <th className="py-4 px-6 text-center w-12">#</th>
                      <th className="py-4 px-6">Sent Date</th>
                      <th className="py-4 px-6">Advocate Email</th>
                      <th className="py-4 px-6">State</th>
                      <th className="py-4 px-6">City</th>
                      <th className="py-4 px-6">Project Name</th>
                      <th className="py-4 px-6 text-center w-28">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredLinks.map((link, idx) => (
                      <tr key={link.projectId} className="hover:bg-slate-950/40 transition-colors">
                        <td className="py-4 px-6 text-center font-medium text-slate-500">{idx + 1}</td>
                        <td className="py-4 px-6 text-slate-400">
                          {link.regLinkSentOn ? new Date(link.regLinkSentOn).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                        </td>
                        <td className="py-4 px-6 font-semibold text-white">{link.email}</td>
                        <td className="py-4 px-6 text-slate-400">{link.stateName}</td>
                        <td className="py-4 px-6">{link.city}</td>
                        <td className="py-4 px-6">{link.projectName}</td>
                        <td className="py-4 px-6 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleCopyLink(link.projectId)}
                              title="Copy Advocate Link"
                              className="p-1.5 rounded bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white transition-all cursor-pointer border-none"
                            >
                              <Copy size={14} />
                            </button>
                            <button
                              onClick={() => handleRemove(link.projectId)}
                              title="Remove Registration Link"
                              className="p-1.5 rounded bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all cursor-pointer border-none"
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
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              {pendingLoading ? (
                <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
                  <Loader2 className="animate-spin text-purple-500" size={32} />
                  <span>Loading unassigned projects...</span>
                </div>
              ) : filteredPending.length === 0 ? (
                <div className="py-20 text-center text-slate-500 text-sm">
                  No projects are pending to send registration link.
                </div>
              ) : (
                <table className="w-full border-collapse text-left text-sm text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 text-xs uppercase font-semibold border-b border-slate-800">
                    <tr>
                      <th className="py-4 px-6 text-center w-12">#</th>
                      <th className="py-4 px-6">Project Name</th>
                      <th className="py-4 px-6">State</th>
                      <th className="py-4 px-6">City</th>
                      <th className="py-4 px-6 text-center w-28">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredPending.map((project, idx) => (
                      <tr key={project.projectId} className="hover:bg-slate-950/40 transition-colors">
                        <td className="py-4 px-6 text-center font-medium text-slate-500">{idx + 1}</td>
                        <td className="py-4 px-6 font-semibold text-white">{project.projectName}</td>
                        <td className="py-4 px-6 text-slate-400">{project.state_master?.state_name || 'N/A'}</td>
                        <td className="py-4 px-6">{project.city}</td>
                        <td className="py-4 px-6 text-center">
                          <button
                            onClick={() => handleOpenPrefilledModal(project)}
                            title="Send Registration Link"
                            className="px-3 py-1.5 rounded-lg bg-purple-550/20 text-purple-400 hover:bg-purple-650 hover:text-white transition-all cursor-pointer text-xs font-semibold flex items-center gap-1.5 border-none mx-auto"
                          >
                            <Send size={12} />
                            <span>Send Link</span>
                          </button>
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

      {/* Send Email Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden animate-fadeIn">
            <div className="p-6 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Mail className="text-purple-500" size={22} />
                <span>Send Registration Link</span>
              </h3>
              <button 
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors text-lg cursor-pointer border-none bg-transparent"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {prefilledProject ? (
                <>
                  <div>
                    <label className="block text-slate-400 text-xs font-semibold mb-1">State</label>
                    <div className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 text-sm font-semibold select-none">
                      {prefilledProject.state_master?.state_name || 'N/A'}
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 text-xs font-semibold mb-1">City</label>
                    <div className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 text-sm font-semibold select-none">
                      {prefilledProject.city}
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 text-xs font-semibold mb-1">Project Name</label>
                    <div className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm font-bold select-none">
                      {prefilledProject.projectName}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-slate-400 text-xs font-semibold mb-1">State *</label>
                    <select
                      required
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none"
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
                    <select
                      required
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      disabled={!stateId}
                    >
                      <option value="">-- SELECT --</option>
                      {cities.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 text-xs font-semibold mb-1">Project Name *</label>
                    <select
                      required
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none"
                      value={projectId}
                      onChange={(e) => setProjectId(e.target.value)}
                      disabled={!city}
                    >
                      <option value="">-- SELECT --</option>
                      {projects.map(p => (
                        <option key={p.projectId} value={p.projectId}>{p.projectName}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className="block text-slate-400 text-xs font-semibold mb-1">Advocate Email *</label>
                <input
                  type="email"
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none"
                  value={emailId}
                  onChange={(e) => setEmailId(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-850 hover:bg-slate-800 text-slate-300 font-medium rounded-lg text-sm transition-all border-none cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-purple-650 hover:bg-purple-600 text-white font-medium rounded-lg text-sm transition-all border-none cursor-pointer"
                >
                  Send Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
