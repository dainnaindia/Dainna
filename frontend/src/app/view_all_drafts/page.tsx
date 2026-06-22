"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { FileSpreadsheet, Search, Loader2, AlertCircle, Printer, Eye } from 'lucide-react';

interface UserSelect {
  userId: number;
  firstname: string;
  middlename?: string;
  surname: string;
}

interface Draft {
  olbId: number;
  draftStatus: number;
  customizeReadymade: number;
  district: string;
  taluka: string;
  village: string;
  areaSqMt?: number;
  purchaserFirstName: string;
  purchaserLastName: string;
  preparedDate?: string;
  sentDate?: string;
  acceptDate?: string;
  user_master_olb_master_addedbyTouser_master?: UserSelect;
  invoice_master?: Array<{
    inv_no?: string;
    addeddate?: string;
    project_master?: {
      projectName: string;
      city: string;
      state_master?: {
        state_name: string;
      };
    };
    user_master_invoice_master_advocate_idTouser_master?: UserSelect;
  }>;
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

export default function ViewAllDraftsPage() {
  const router = useRouter();
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Dropdown states
  const [states, setStates] = useState<StateObj[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  // Filters
  const [stateId, setStateId] = useState('');
  const [city, setCity] = useState('');
  const [projectId, setProjectId] = useState('');

  useEffect(() => {
    // Fetch initial drafts list
    fetchDrafts();
    // Fetch states for filter
    fetch('http://localhost:5000/api/users/states')
      .then(res => res.json())
      .then(data => setStates(data.States || []))
      .catch(err => console.error('Error fetching states:', err));
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

  const fetchDrafts = async (sId = '', c = '', pId = '') => {
    setLoading(true);
    setError('');
    try {
      let url = 'http://localhost:5000/api/drafts/list';
      const params = [];
      if (sId) params.push(`stateId=${sId}`);
      if (c) params.push(`city=${encodeURIComponent(c)}`);
      if (pId) params.push(`projectId=${pId}`);
      if (params.length > 0) {
        url += `?${params.join('&')}`;
      }

      const response = await fetch(url);
      const data = await response.json();
      if (response.ok) {
        setDrafts(data.Drafts || []);
      } else {
        setError(data.Msg || 'Failed to retrieve drafts listings.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection to server failed. Verify backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDrafts(stateId, city, projectId);
  };

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 1:
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-red-500/10 text-red-400">Prepared Draft</span>;
      case 2:
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-indigo-500/10 text-indigo-400">Waiting for Advocate</span>;
      case 3:
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-500/10 text-amber-400">Received to Advocate</span>;
      case 4:
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-400">Complete Draft</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-500/10 text-slate-400">Unknown</span>;
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

  const exportToCSV = () => {
    const headers = [
      '#',
      'Invoice No',
      'Agent Name',
      'Advocate Name',
      'Project State',
      'Project City',
      'Project Name',
      'Purchaser Name',
      'Property Address',
      'Prepared Date',
      'Sent Date',
      'Accept Date',
      'Status'
    ];

    const rows = drafts.map((draft, idx) => {
      const inv = draft.invoice_master?.[0];
      const agent = draft.user_master_olb_master_addedbyTouser_master;
      const adv = inv?.user_master_invoice_master_advocate_idTouser_master;
      const agentName = agent ? `${agent.firstname} ${agent.surname}` : 'N/A';
      const advName = adv ? `${adv.firstname} ${adv.surname}` : 'N/A';
      const stateName = inv?.project_master?.state_master?.state_name || 'N/A';
      const address = `${stateName} ${draft.district || ''} ${draft.taluka || ''} ${draft.village || ''}`.trim();
      let statusText = '';
      if (draft.draftStatus === 1) statusText = 'Prepared Draft';
      else if (draft.draftStatus === 2) statusText = 'Waiting for Advocate';
      else if (draft.draftStatus === 3) statusText = 'Received to Advocate';
      else if (draft.draftStatus === 4) statusText = 'Complete Draft';
      else statusText = 'Unknown';

      return [
        idx + 1,
        inv?.inv_no || 'N/A',
        agentName,
        advName,
        stateName,
        inv?.project_master?.city || 'N/A',
        inv?.project_master?.projectName || 'N/A',
        `${draft.purchaserFirstName || ''} ${draft.purchaserLastName || ''}`.trim(),
        address,
        formatDate(draft.preparedDate),
        formatDate(draft.sentDate),
        formatDate(draft.acceptDate),
        statusText
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
    
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8' });
    const encodedUri = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `all_drafts_report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

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
            <h2 className="text-3xl font-extrabold tracking-tight text-white">All Drafts Database</h2>
            <p className="text-slate-400 text-sm mt-1">Search and view all drafts prepared or submitted across Dainna.</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={exportToCSV}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-sm transition-all flex items-center gap-2 border border-slate-700 cursor-pointer"
            >
              <FileSpreadsheet size={16} />
              <span>Export CSV</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-sm transition-all flex items-center gap-2 border border-slate-700 cursor-pointer"
            >
              <Printer size={16} />
              <span>Print Report</span>
            </button>
          </div>
        </div>

        <div className="print:block hidden mb-6">
          <h2 className="text-2xl font-bold text-black text-center">DAINNA - All Drafts Report</h2>
          <p className="text-black text-xs text-center">Generated on: {new Date().toLocaleString()}</p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3 print:hidden">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Filter Toolbar */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl shadow-md print:hidden">
          <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row items-end gap-4">
            <div className="w-full md:w-1/4">
              <label className="block text-slate-300 text-xs font-semibold mb-1" htmlFor="state">State</label>
              <select
                id="state"
                value={stateId}
                onChange={(e) => setStateId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="">-- SELECT --</option>
                {states.map(s => (
                  <option key={s.state_id} value={s.state_id}>{s.state_name}</option>
                ))}
              </select>
            </div>
            <div className="w-full md:w-1/4">
              <label className="block text-slate-300 text-xs font-semibold mb-1" htmlFor="city">City</label>
              <select
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                disabled={!stateId}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 disabled:opacity-50"
              >
                <option value="">-- SELECT --</option>
                {cities.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="w-full md:w-1/4">
              <label className="block text-slate-300 text-xs font-semibold mb-1" htmlFor="project">Project Name</label>
              <select
                id="project"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                disabled={!city}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 disabled:opacity-50"
              >
                <option value="">-- SELECT --</option>
                {projects.map(p => (
                  <option key={p.projectId} value={p.projectId}>{p.projectName}</option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg text-sm transition-all flex items-center gap-2 cursor-pointer shadow-md justify-center w-full md:w-auto"
            >
              <Search size={16} />
              <span>Search</span>
            </button>
          </form>
        </div>

        {/* Table list */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg overflow-hidden print:border-0 print:shadow-none print:bg-white">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400 print:hidden">
                <Loader2 className="animate-spin text-blue-500" size={28} />
                <span>Loading drafts...</span>
              </div>
            ) : drafts.length === 0 ? (
              <div className="py-20 text-center text-slate-500 text-sm print:text-black">
                No draft records found matching the search criteria.
              </div>
            ) : (
              <table className="w-full border-collapse text-left text-sm text-slate-300 print:text-black">
                <thead className="bg-slate-950 text-slate-400 text-xs uppercase font-semibold border-b border-slate-800 print:bg-slate-100 print:text-black print:border-black">
                  <tr>
                    <th className="py-4 px-4 text-center w-12">#</th>
                    <th className="py-4 px-4">Invoice No</th>
                    <th className="py-4 px-4">Agent Name</th>
                    <th className="py-4 px-4">Advocate Name</th>
                    <th className="py-4 px-4">State</th>
                    <th className="py-4 px-4">City</th>
                    <th className="py-4 px-4">Project Name</th>
                    <th className="py-4 px-4">Purchaser Name</th>
                    <th className="py-4 px-4">Property Address</th>
                    <th className="py-4 px-4">Prepared</th>
                    <th className="py-4 px-4">Sent</th>
                    <th className="py-4 px-4">Accepted</th>
                    <th className="py-4 px-4">Status</th>
                    <th className="py-4 px-4 text-center w-16 print:hidden">View</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 print:divide-black">
                  {drafts.map((draft, idx) => {
                    const inv = draft.invoice_master?.[0];
                    const agent = draft.user_master_olb_master_addedbyTouser_master;
                    const adv = inv?.user_master_invoice_master_advocate_idTouser_master;
                    const agentName = agent ? `${agent.firstname || ''} ${agent.surname || ''}`.trim() : 'N/A';
                    const advName = adv ? `${adv.firstname || ''} ${adv.surname || ''}`.trim() : 'N/A';
                    const stateName = inv?.project_master?.state_master?.state_name || 'N/A';
                    const address = `${stateName} ${draft.district || ''} ${draft.taluka || ''} ${draft.village || ''}`.trim();

                    return (
                      <tr key={draft.olbId} className="hover:bg-slate-950/40 transition-colors print:hover:bg-transparent">
                        <td className="py-3 px-4 text-center font-medium text-slate-500 print:text-black">{idx + 1}</td>
                        <td className="py-3 px-4 font-semibold text-white print:text-black">{inv?.inv_no || 'N/A'}</td>
                        <td className="py-3 px-4">{agentName}</td>
                        <td className="py-3 px-4">{advName}</td>
                        <td className="py-3 px-4 text-slate-400 print:text-black">{stateName}</td>
                        <td className="py-3 px-4 text-slate-400 print:text-black">{inv?.project_master?.city || 'N/A'}</td>
                        <td className="py-3 px-4 font-medium">{inv?.project_master?.projectName || 'N/A'}</td>
                        <td className="py-3 px-4 text-slate-400 print:text-black">
                          {`${draft.purchaserFirstName || ''} ${draft.purchaserLastName || ''}`.trim() || 'N/A'}
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-500 print:text-black">{address}</td>
                        <td className="py-3 px-4 text-xs">{formatDate(draft.preparedDate)}</td>
                        <td className="py-3 px-4 text-xs">{formatDate(draft.sentDate)}</td>
                        <td className="py-3 px-4 text-xs">{formatDate(draft.acceptDate)}</td>
                        <td className="py-3 px-4">{getStatusBadge(draft.draftStatus)}</td>
                        <td className="py-3 px-4 text-center print:hidden">
                          <button
                            onClick={() => router.push(`/view_draft_detail?oid=${draft.olbId}&page=AllDrafts`)}
                            className="p-1.5 rounded bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white transition-all cursor-pointer"
                            title="View Detail Card"
                          >
                            <Eye size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
