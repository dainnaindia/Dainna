"use client";

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Layers, Search, ShieldAlert, Loader2 } from 'lucide-react';

interface Property {
  olbId: number;
  agentName: string;
  ownerName: string;
  ownerMobile: string;
  address: string;
  projectName: string;
  stateName: string;
  city: string;
  draftStatus: number;
  draftStatusText: string;
}

interface StateObj {
  state_id: number;
  state_name: string;
}

interface Project {
  projectId: number;
  projectName: string;
  city: string;
}

export default function RegLandPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Select options
  const [states, setStates] = useState<StateObj[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  // Search parameters
  const [stateId, setStateId] = useState('');
  const [city, setCity] = useState('');
  const [projectId, setProjectId] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
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
    fetch(`http://localhost:5000/api/projects?StateID=${stateId}&City=${city}`)
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

    let url = `http://localhost:5000/api/properties/registered?Type=1`;
    if (stateId) url += `&StateID=${stateId}`;
    if (city) url += `&City=${encodeURIComponent(city)}`;
    if (projectId) url += `&ProjectID=${projectId}`;

    try {
      const response = await fetch(url);
      const data = await response.json();
      if (response.ok) {
        setProperties(data.Properties || []);
      } else {
        setError(data.Msg || 'Failed to retrieve land property portfolio.');
      }
    } catch (err) {
      console.error(err);
      setError('Cannot connect to API server. Ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="absolute top-10 right-10 w-[400px] h-[400px] rounded-full bg-blue-500/5 blur-[100px] pointer-events-none" />

      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <Layers className="text-blue-500" size={32} />
            Registered Land Property
          </h2>
          <p className="text-slate-400 text-sm mt-1">View and track all land properties registered under townships</p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3">
            <ShieldAlert size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSearch} className="p-6 bg-slate-900 border border-slate-800 rounded-xl shadow-lg space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-slate-400 text-xs font-semibold mb-2">State *</label>
              <select
                required
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
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
              <label className="block text-slate-400 text-xs font-semibold mb-2">City</label>
              <select
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
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
              <label className="block text-slate-400 text-xs font-semibold mb-2">Project Name</label>
              <select
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
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
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg text-sm transition-all flex items-center gap-2 cursor-pointer shadow-md"
            >
              <Search size={16} />
              <span>Search Lands</span>
            </button>
          </div>
        </form>

        {hasSearched && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg overflow-hidden animate-fadeIn">
            <div className="overflow-x-auto">
              {loading ? (
                <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
                  <Loader2 className="animate-spin text-blue-500" size={32} />
                  <span>Loading registered land records...</span>
                </div>
              ) : properties.length === 0 ? (
                <div className="py-20 text-center text-slate-550 text-sm font-medium">
                  No registered land properties found matching these filter credentials.
                </div>
              ) : (
                <table className="w-full border-collapse text-left text-sm text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 text-xs uppercase font-semibold border-b border-slate-800">
                    <tr>
                      <th className="py-4 px-6 text-center w-12">#</th>
                      <th className="py-4 px-6">Agent Name</th>
                      <th className="py-4 px-6">Owner Name</th>
                      <th className="py-4 px-6">Property Address</th>
                      <th className="py-4 px-6">Project Name</th>
                      <th className="py-4 px-6">State</th>
                      <th className="py-4 px-6">City</th>
                      <th className="py-4 px-6">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {properties.map((prop, idx) => (
                      <tr key={prop.olbId} className="hover:bg-slate-950/40 transition-colors">
                        <td className="py-4 px-6 text-center font-medium text-slate-500">{idx + 1}</td>
                        <td className="py-4 px-6 font-semibold text-white">{prop.agentName}</td>
                        <td className="py-4 px-6">{prop.ownerName}</td>
                        <td className="py-4 px-6 text-slate-450">{prop.address}</td>
                        <td className="py-4 px-6">{prop.projectName}</td>
                        <td className="py-4 px-6 text-slate-400">{prop.stateName}</td>
                        <td className="py-4 px-6 text-slate-400">{prop.city}</td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                            prop.draftStatus === 4 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'
                          }`}>
                            {prop.draftStatusText}
                          </span>
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
