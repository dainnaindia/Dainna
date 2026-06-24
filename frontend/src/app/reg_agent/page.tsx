"use client";

import React, { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  Users, Search, UserPlus, ShieldAlert, Loader2, CheckCircle2, XCircle, 
  Trash2, Copy, FileSpreadsheet, Database, FileText, Eye, Lock
} from 'lucide-react';

interface Agent {
  userId: number;
  userCode: number;
  userCodeFull: string;
  firstname: string;
  middlename: string;
  surname: string;
  firmname: string;
  username: string;
  mobile: string;
  email: string;
  address: string;
  district: string;
  city: string;
  stateId: number | null;
  postcode: string;
  workingCity: string;
  officePhone: string;
  aadharNo: string;
  securePin: string;
  status: number;
  addeddate: string;
}

interface StateMaster {
  state_id: number;
  state_name: string;
  state_code: string;
}

export default function RegAgentPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [states, setStates] = useState<StateMaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Dropdown Filter States
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [searchStateFilter, setSearchStateFilter] = useState('');
  const [searchCityFilter, setSearchCityFilter] = useState('');

  // Search & Pagination States
  const [searchTerm, setSearchTerm] = useState('');
  const [pageLimit, setPageLimit] = useState('all');
  const [searchInputVisible, setSearchInputVisible] = useState(true);

  // Add Modal State
  const [addModalOpen, setAddModalOpen] = useState(false);

  // View/Password Modal State
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewingAgent, setViewingAgent] = useState<Agent | null>(null);

  // Password Update Form State
  const [newPassword, setNewPassword] = useState('');
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Registration Form inputs
  const [firstname, setFirstname] = useState('');
  const [middlename, setMiddlename] = useState('');
  const [surname, setSurname] = useState('');
  const [firmname, setFirmname] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [regStateId, setRegStateId] = useState('');
  const [regCity, setRegCity] = useState('');
  const [workingCity, setWorkingCity] = useState('');
  const [officePhone, setOfficePhone] = useState('');
  const [aadharNo, setAadharNo] = useState('');
  const [securePin, setSecurePin] = useState('');

  // Helper date formatter: DD-MM-YYYY
  const formatDate = (dateStr: any) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}-${month}-${year}`;
    } catch {
      return 'N/A';
    }
  };

  const fetchAgents = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('http://localhost:5000/api/users/agents');
      const data = await response.json();
      if (response.ok) {
        setAgents(data.Agents || []);
      } else {
        setError(data.Msg || 'Failed to retrieve agent records.');
      }
    } catch (err) {
      console.error(err);
      setError('Cannot connect to API server. Ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStates = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/users/states');
      const data = await response.json();
      if (response.ok) {
        setStates(data.States || []);
      }
    } catch (err) {
      console.error('Failed to fetch states:', err);
    }
  };

  useEffect(() => {
    fetchAgents();
    fetchStates();
  }, []);

  // Compute unique cities based on selected state in filter
  const availableCities = useMemo(() => {
    const filtered = selectedState
      ? agents.filter(a => a.stateId === parseInt(selectedState))
      : agents;
    const citiesSet = new Set(filtered.map(a => a.workingCity).filter(Boolean));
    return Array.from(citiesSet).sort();
  }, [agents, selectedState]);

  const handleFilterSearch = () => {
    setSearchStateFilter(selectedState);
    setSearchCityFilter(selectedCity);
  };

  // Status Toggle
  const handleToggleStatus = async (id: number, currentStatus: number) => {
    const newStatus = currentStatus === 1 ? 0 : 1;
    try {
      const response = await fetch(`http://localhost:5000/api/users/status/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Status: newStatus })
      });
      if (response.ok) {
        setAgents(agents.map(a => a.userId === id ? { ...a, status: newStatus } : a));
        if (viewingAgent && viewingAgent.userId === id) {
          setViewingAgent({ ...viewingAgent, status: newStatus });
        }
      } else {
        alert('Failed to update agent status.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error while updating status.');
    }
  };

  // Add Modal actions
  const handleOpenAddModal = () => {
    setFirstname('');
    setMiddlename('');
    setSurname('');
    setFirmname('');
    setUsername('');
    setPassword('');
    setMobile('');
    setEmail('');
    setAddress('');
    setRegStateId('');
    setRegCity('');
    setWorkingCity('');
    setOfficePhone('');
    setAadharNo('');
    setSecurePin('');
    setAddModalOpen(true);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const payload = {
      Firstname: firstname,
      Middlename: middlename,
      Surname: surname,
      Firmname: firmname,
      Username: username,
      Password: password,
      Mobile: mobile,
      Email: email,
      Address: address,
      City: regCity,
      StateID: regStateId,
      WorkingCity: workingCity,
      OfficePhone: officePhone,
      AadharNo: aadharNo,
      UserTypeID: 3, // Agent role
      SecurePin: securePin
    };

    try {
      const response = await fetch('http://localhost:5000/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (response.ok && data.Status === 2) {
        setAddModalOpen(false);
        fetchAgents();
      } else {
        alert(data.Msg || 'Failed to submit agent details.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error while registering agent.');
    }
  };

  // View & Reset Password Modal actions
  const handleOpenViewModal = (agent: Agent) => {
    setViewingAgent(agent);
    setNewPassword('');
    setPasswordSuccess('');
    setPasswordError('');
    setViewModalOpen(true);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewingAgent || !newPassword) return;

    setPasswordSubmitting(true);
    setPasswordSuccess('');
    setPasswordError('');

    try {
      const response = await fetch(`http://localhost:5000/api/users/update-user/${viewingAgent.userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Firstname: viewingAgent.firstname,
          Middlename: viewingAgent.middlename,
          Surname: viewingAgent.surname,
          Firmname: viewingAgent.firmname,
          Username: viewingAgent.username,
          Mobile: viewingAgent.mobile,
          Email: viewingAgent.email,
          Address: viewingAgent.address,
          District: viewingAgent.district || '',
          City: viewingAgent.city || '',
          StateID: viewingAgent.stateId,
          Pincode: viewingAgent.postcode || '',
          WorkingCity: viewingAgent.workingCity,
          OfficePhone: viewingAgent.officePhone || '',
          AadharNo: viewingAgent.aadharNo || '',
          SecurePin: viewingAgent.securePin || '',
          Status: viewingAgent.status,
          Password: newPassword
        })
      });
      const data = await response.json();
      if (response.ok && data.Status === 4) {
        setPasswordSuccess('Password updated successfully!');
        setNewPassword('');
      } else {
        setPasswordError(data.Msg || 'Failed to update password.');
      }
    } catch (err) {
      console.error(err);
      setPasswordError('Network error while updating password.');
    } finally {
      setPasswordSubmitting(false);
    }
  };

  // Delete Agent
  const handleDeleteAgent = async (id: number) => {
    if (!confirm("Are you sure you want to delete this agent? This action cannot be undone.")) {
      return;
    }
    try {
      const response = await fetch(`http://localhost:5000/api/users/${id}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (response.ok && data.Status === 6) {
        setAgents(agents.filter(a => a.userId !== id));
        alert('Agent deleted successfully.');
        if (viewingAgent?.userId === id) {
          setViewModalOpen(false);
        }
      } else {
        alert(data.Msg || 'Failed to delete agent. Ensure no dependencies exist for this user.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error while deleting agent.');
    }
  };

  // Export & Copy Handlers
  const handleCopy = () => {
    const headers = ['#', 'Reg. Date', 'Agent Code', 'Full Name', 'Firmname', 'Working City', 'Address', 'Mobile', 'Email ID', 'Status'];
    const rows = filteredAgents.map((agent, idx) => [
      idx + 1,
      formatDate(agent.addeddate),
      agent.userCodeFull || 'Pending',
      `${agent.firstname} ${agent.middlename || ''} ${agent.surname}`.trim(),
      agent.firmname || 'N/A',
      agent.workingCity || 'N/A',
      agent.address || 'N/A',
      agent.mobile || 'N/A',
      agent.email || 'N/A',
      agent.status === 1 ? 'Active' : 'In Active'
    ]);
    const text = [headers.join('\t'), ...rows.map(r => r.join('\t'))].join('\n');
    navigator.clipboard.writeText(text);
    alert('Table copied to clipboard!');
  };

  const handleExportCSV = (filename = 'registered_agents.csv') => {
    const headers = ['#', 'Reg. Date', 'Agent Code', 'Full Name', 'Firmname', 'Working City', 'Address', 'Mobile', 'Email ID', 'Status'];
    const rows = filteredAgents.map((agent, idx) => [
      idx + 1,
      formatDate(agent.addeddate),
      agent.userCodeFull || 'Pending',
      `${agent.firstname} ${agent.middlename || ''} ${agent.surname}`.trim(),
      agent.firmname || 'N/A',
      agent.workingCity || 'N/A',
      agent.address || 'N/A',
      agent.mobile || 'N/A',
      agent.email || 'N/A',
      agent.status === 1 ? 'Active' : 'In Active'
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

  // Filter list logic
  const filteredAgents = useMemo(() => {
    return agents.filter(a => {
      // Top Dropdown selectors matching active filters on search click
      const matchesState = searchStateFilter ? a.stateId === parseInt(searchStateFilter) : true;
      const matchesCity = searchCityFilter ? a.workingCity === searchCityFilter : true;

      // Text search match
      const searchableStr = `${a.firstname} ${a.middlename || ''} ${a.surname} ${a.userCodeFull} ${a.firmname} ${a.workingCity} ${a.address} ${a.mobile} ${a.email}`.toLowerCase();
      const matchesSearch = searchableStr.includes(searchTerm.toLowerCase());

      return matchesState && matchesCity && matchesSearch;
    });
  }, [agents, searchStateFilter, searchCityFilter, searchTerm]);

  // Paginated/Limited display list
  const displayedAgents = useMemo(() => {
    if (pageLimit === 'all') return filteredAgents;
    return filteredAgents.slice(0, parseInt(pageLimit));
  }, [filteredAgents, pageLimit]);

  return (
    <DashboardLayout role="admin">
      <div className="absolute top-10 right-10 w-[400px] h-[400px] rounded-full bg-blue-500/5 blur-[100px] pointer-events-none print:hidden" />

      <div className="space-y-6">
        {/* Header Title Section */}
        <div className="flex justify-between items-center print:hidden">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <Users className="text-blue-500" size={32} />
              Registered Agent
            </h2>
            <p className="text-slate-400 text-sm mt-1">Check agent registration codes, address credentials, and account statuses</p>
          </div>
          <button
            onClick={handleOpenAddModal}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg text-sm transition-all flex items-center gap-2 cursor-pointer shadow-md"
          >
            <UserPlus size={16} />
            <span>Add New Agent</span>
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3 print:hidden">
            <ShieldAlert size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 1. Dropdown Filters (State & City) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-5 bg-slate-900 border border-slate-800 rounded-xl shadow-md print:hidden">
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
              <option value="">-- SELECT --</option>
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
              <option value="">-- SELECT --</option>
              {availableCities.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleFilterSearch}
              className="w-full md:w-auto px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <CheckCircle2 size={16} />
              <span>Search</span>
            </button>
          </div>
        </div>

        {/* 2. Controls Row (Rows count selector, Export toolbar, and search input) */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-900 border border-slate-800 rounded-xl shadow-md print:hidden">
          <div className="flex items-center gap-3 flex-wrap">
            <select 
              value={pageLimit} 
              onChange={(e) => setPageLimit(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="all">Show all rows</option>
              <option value="10">10 rows</option>
              <option value="25">25 rows</option>
              <option value="50">50 rows</option>
              <option value="100">100 rows</option>
            </select>

            <div className="flex items-center border border-slate-800 bg-slate-950 rounded-lg p-0.5 overflow-hidden">
              <button 
                onClick={() => setSearchInputVisible(!searchInputVisible)}
                className={`p-2 transition-colors ${searchInputVisible ? 'text-blue-400 bg-slate-900' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                title="Toggle Search Box"
              >
                <Search size={14} />
              </button>
              <button 
                onClick={handleCopy}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors border-l border-slate-800"
                title="Copy Table"
              >
                <Copy size={14} />
              </button>
              <button 
                onClick={() => handleExportCSV('registered_agents.csv')}
                className="p-2 text-emerald-500 hover:text-emerald-400 hover:bg-slate-800 transition-colors border-l border-slate-800"
                title="Export to Excel"
              >
                <FileSpreadsheet size={14} />
              </button>
              <button 
                onClick={() => handleExportCSV('registered_agents.csv')}
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

          {searchInputVisible && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Search:</span>
              <input
                type="text"
                placeholder="Type query to filter..."
                className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:border-blue-500 w-48 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* 3. Registered Agent Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg overflow-hidden print:border-none print:shadow-none print:bg-transparent">
          <div className="p-4 bg-slate-950/50 border-b border-slate-800 print:hidden">
            <h3 className="font-semibold text-slate-350 text-sm">View All Agent</h3>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400 print:hidden">
                <Loader2 className="animate-spin text-blue-500" size={32} />
                <span>Loading agents database...</span>
              </div>
            ) : displayedAgents.length === 0 ? (
              <div className="py-20 text-center text-slate-500 text-sm">
                No agent records matching your query were found.
              </div>
            ) : (
              <table className="w-full border-collapse text-left text-xs text-slate-300 print:text-black">
                <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase font-semibold border-b border-slate-800 print:bg-slate-100 print:text-black">
                  <tr>
                    <th className="py-3 px-2.5 text-center w-10">#</th>
                    <th className="py-3 px-2.5 whitespace-nowrap w-[90px]">Reg. Date</th>
                    <th className="py-3 px-2.5 w-[110px]">Agent Code</th>
                    <th className="py-3 px-2.5 max-w-[150px]">Full Name</th>
                    <th className="py-3 px-2.5 max-w-[120px]">Firmname</th>
                    <th className="py-3 px-2.5 w-[100px]">Working City</th>
                    <th className="py-3 px-2.5 max-w-[180px]">Address</th>
                    <th className="py-3 px-2.5 w-[100px]">Mobile</th>
                    <th className="py-3 px-2.5 max-w-[150px]">Email ID</th>
                    <th className="py-3 px-2.5 w-[75px] text-center">Status</th>
                    <th className="py-3 px-2 text-center w-[64px] print:hidden">#</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 print:divide-slate-200">
                  {displayedAgents.map((agent, idx) => (
                    <tr key={agent.userId} className="hover:bg-slate-950/40 transition-colors print:hover:bg-transparent">
                      <td className="py-3 px-2.5 text-center font-medium text-slate-500">{idx + 1}</td>
                      <td className="py-3 px-2.5 whitespace-nowrap">{formatDate(agent.addeddate)}</td>
                      <td className="py-3 px-2.5 font-mono text-[11px] text-blue-400 font-semibold print:text-black truncate max-w-[110px]" title={agent.userCodeFull || 'Pending'}>
                        {agent.userCodeFull || 'Pending'}
                      </td>
                      <td className="py-3 px-2.5 font-semibold text-white print:text-black max-w-[150px] truncate" title={`${agent.firstname} ${agent.middlename || ''} ${agent.surname}`}>
                        {`${agent.firstname} ${agent.middlename || ''} ${agent.surname}`}
                      </td>
                      <td className="py-3 px-2.5 text-slate-300 print:text-black max-w-[120px] truncate" title={agent.firmname || ''}>
                        {agent.firmname || 'N/A'}
                      </td>
                      <td className="py-3 px-2.5 font-medium truncate max-w-[100px]" title={agent.workingCity || 'N/A'}>
                        {agent.workingCity || 'N/A'}
                      </td>
                      <td className="py-3 px-2.5 text-slate-400 print:text-black text-[11px] max-w-[180px] truncate" title={agent.address}>
                        {agent.address || 'N/A'}
                      </td>
                      <td className="py-3 px-2.5 text-slate-300 print:text-black whitespace-nowrap">{agent.mobile || 'N/A'}</td>
                      <td className="py-3 px-2.5 text-slate-400 print:text-black text-[11px] max-w-[150px] truncate" title={agent.email}>
                        {agent.email || 'N/A'}
                      </td>
                      <td className="py-3 px-2.5 text-center whitespace-nowrap">
                        <span
                          onClick={() => handleToggleStatus(agent.userId, agent.status)}
                          title="Click to toggle account status"
                          className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer select-none transition-all w-16 print:border-none print:bg-transparent ${
                            agent.status === 1 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 print:text-green-700' 
                              : 'bg-red-500/10 text-red-400 border border-red-500/20 print:text-red-700'
                          }`}
                        >
                          <span>{agent.status === 1 ? 'Active' : 'In Active'}</span>
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center print:hidden whitespace-nowrap w-[64px]">
                        <div className="flex items-center justify-center gap-0.5">
                          <button
                            onClick={() => handleOpenViewModal(agent)}
                            title="View Details"
                            className="p-1 hover:bg-slate-800 rounded text-blue-400 hover:text-white transition-colors cursor-pointer border-none bg-transparent"
                          >
                            <Eye size={13} />
                          </button>
                          <button
                            onClick={() => handleDeleteAgent(agent.userId)}
                            title="Delete Agent"
                            className="p-1 hover:bg-red-500/10 rounded text-red-500 hover:text-red-400 transition-colors cursor-pointer border-none bg-transparent"
                          >
                            <Trash2 size={13} />
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

      {/* MODAL 1: View Details & Change Password */}
      {viewModalOpen && viewingAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden my-8 animate-fadeIn">
            <div className="p-6 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Users className="text-blue-500" size={22} />
                <span>Agent Information Details</span>
              </h3>
              <button 
                onClick={() => setViewModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors text-2xl font-semibold cursor-pointer border-none bg-transparent"
              >
                &times;
              </button>
            </div>
            
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-950/30 border border-slate-800/50 rounded-xl p-3.5 space-y-2.5">
                  <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">Primary Information</h4>
                  <div className="flex justify-between text-xs border-b border-slate-800/30 pb-1.5">
                    <span className="text-slate-500">Agent Code:</span>
                    <span className="font-mono text-white font-semibold">{viewingAgent.userCodeFull || 'Pending'}</span>
                  </div>
                  <div className="flex justify-between text-xs border-b border-slate-800/30 pb-1.5">
                    <span className="text-slate-500">Full Name:</span>
                    <span className="text-slate-200 font-semibold">{`${viewingAgent.firstname} ${viewingAgent.middlename || ''} ${viewingAgent.surname}`}</span>
                  </div>
                  <div className="flex justify-between text-xs border-b border-slate-800/30 pb-1.5">
                    <span className="text-slate-500">Firm Name:</span>
                    <span className="text-slate-200 font-semibold">{viewingAgent.firmname || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-xs border-b border-slate-800/30 pb-1.5">
                    <span className="text-slate-500">Username:</span>
                    <span className="text-slate-200 font-semibold">{viewingAgent.username}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Status:</span>
                    <span className={`font-semibold ${viewingAgent.status === 1 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {viewingAgent.status === 1 ? 'Active' : 'In Active'}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-950/30 border border-slate-800/50 rounded-xl p-3.5 space-y-2.5">
                  <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">Contact & Address</h4>
                  <div className="flex justify-between text-xs border-b border-slate-800/30 pb-1.5">
                    <span className="text-slate-500">Mobile No:</span>
                    <span className="text-slate-200 font-semibold">{viewingAgent.mobile || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-xs border-b border-slate-800/30 pb-1.5">
                    <span className="text-slate-500">Email ID:</span>
                    <span className="text-slate-200 font-semibold">{viewingAgent.email || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-xs border-b border-slate-800/30 pb-1.5">
                    <span className="text-slate-500">Working City:</span>
                    <span className="text-slate-200 font-semibold">{viewingAgent.workingCity || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-xs border-b border-slate-800/30 pb-1.5">
                    <span className="text-slate-500">Registered City:</span>
                    <span className="text-slate-200 font-semibold">{viewingAgent.city || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">State:</span>
                    <span className="text-slate-200 font-semibold">
                      {states.find(s => s.state_id === viewingAgent.stateId)?.state_name || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-950/30 border border-slate-800/50 rounded-xl p-4 space-y-2.5">
                <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">Office & Documents</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Office Phone:</span>
                    <span className="text-slate-200 font-semibold">{viewingAgent.officePhone || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Aadhar card No:</span>
                    <span className="text-slate-200 font-semibold">{viewingAgent.aadharNo || 'N/A'}</span>
                  </div>

                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Registration Date:</span>
                    <span className="text-slate-200 font-semibold">{formatDate(viewingAgent.addeddate)}</span>
                  </div>
                </div>
                <div className="border-t border-slate-850 pt-2.5 mt-2">
                  <span className="text-xs text-slate-500 block mb-1">Office Address:</span>
                  <p className="text-xs text-slate-300 font-medium leading-relaxed bg-slate-950/50 p-2.5 rounded-lg border border-slate-850">
                    {viewingAgent.address || 'No address details provided.'}
                  </p>
                </div>
              </div>

              {/* Password Change Form */}
              <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-5 space-y-4">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Lock size={16} className="text-amber-500" />
                  <span>Change Agent Password</span>
                </h4>
                
                {passwordSuccess && (
                  <div className="p-3 text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg">
                    {passwordSuccess}
                  </div>
                )}
                {passwordError && (
                  <div className="p-3 text-xs bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg">
                    {passwordError}
                  </div>
                )}

                <form onSubmit={handleUpdatePassword} className="flex gap-3 items-end">
                  <div className="flex-1">
                    <label className="block text-slate-400 text-xs font-semibold mb-1">New Password</label>
                    <input
                      type="text"
                      placeholder="Enter new password (unhashed)"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:border-blue-500"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={passwordSubmitting || !newPassword}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-medium rounded-lg text-xs transition-all shrink-0 cursor-pointer h-9 flex items-center justify-center gap-2 border-none"
                  >
                    {passwordSubmitting ? <Loader2 size={12} className="animate-spin" /> : null}
                    <span>Update Password</span>
                  </button>
                </form>
              </div>

              {/* Actions Footer */}
              <div className="flex justify-between items-center pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => handleDeleteAgent(viewingAgent.userId)}
                  className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-semibold rounded-lg text-xs transition-all cursor-pointer border border-red-500/20"
                >
                  Delete Account
                </button>
                <button
                  type="button"
                  onClick={() => setViewModalOpen(false)}
                  className="px-5 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 font-medium rounded-lg text-xs transition-all cursor-pointer border-none"
                >
                  Close Detail
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Register/Add Agent Form */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden my-8 animate-fadeIn">
            <div className="p-6 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <UserPlus className="text-blue-500" size={22} />
                <span>Register Agent Account</span>
              </h3>
              <button 
                onClick={() => setAddModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors text-2xl font-semibold cursor-pointer border-none bg-transparent"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleRegisterSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none"
                    value={firstname}
                    onChange={(e) => setFirstname(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-1">Middle Name</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none"
                    value={middlename}
                    onChange={(e) => setMiddlename(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-1">Surname *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none"
                    value={surname}
                    onChange={(e) => setSurname(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-1">Firm Name</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none"
                    value={firmname}
                    onChange={(e) => setFirmname(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-1">Working City *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Surat, Mumbai"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none"
                    value={workingCity}
                    onChange={(e) => setWorkingCity(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-1">Username *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-1">Password *</label>
                  <input
                    type="password"
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-1">Mobile No *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-1">Email Address</label>
                  <input
                    type="email"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-1">State ID</label>
                  <select
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none"
                    value={regStateId}
                    onChange={(e) => setRegStateId(e.target.value)}
                  >
                    <option value="">-- SELECT --</option>
                    {states.map(s => (
                      <option key={s.state_id} value={s.state_id}>{s.state_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-1">Registered City</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none"
                    value={regCity}
                    onChange={(e) => setRegCity(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-1">Office Phone</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none"
                    value={officePhone}
                    onChange={(e) => setOfficePhone(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-1">Aadhar Card No</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none"
                    value={aadharNo}
                    onChange={(e) => setAadharNo(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-semibold mb-1">Office Address</label>
                <textarea
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none"
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-850 hover:bg-slate-800 text-slate-300 font-medium rounded-lg text-sm transition-all cursor-pointer border-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg text-sm transition-all cursor-pointer border-none"
                >
                  Register Agent
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
