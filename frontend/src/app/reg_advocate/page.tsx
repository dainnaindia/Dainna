"use client";

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  Users, Search, UserPlus, ShieldAlert, Loader2, CheckCircle2, XCircle,
  Eye, Trash2, Lock
} from 'lucide-react';

interface Advocate {
  userId: number;
  userCodeFull: string;
  firstname: string;
  middlename: string;
  surname: string;
  firmname?: string;
  username: string;
  mobile: string;
  email: string;
  status: number;
  ratePerSqmt: number | null;
  addeddate: string;
  address?: string;
  city?: string;
  workingCity?: string;
  securePin?: string;
  stateId?: number | null;
  officePhone?: string;
  aadharNo?: string;
}

interface StateMaster {
  state_id: number;
  state_name: string;
  state_code: string;
}

export default function RegAdvocatePage() {
  const [advocates, setAdvocates] = useState<Advocate[]>([]);
  const [states, setStates] = useState<StateMaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);

  // View/Password Modal State
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewingAdvocate, setViewingAdvocate] = useState<Advocate | null>(null);

  // Password Update Form State
  const [newPassword, setNewPassword] = useState('');
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Edit Advocate Profile Details Form State
  const [editFirstname, setEditFirstname] = useState('');
  const [editMiddlename, setEditMiddlename] = useState('');
  const [editSurname, setEditSurname] = useState('');
  const [editFirmname, setEditFirmname] = useState('');
  const [editMobile, setEditMobile] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editWorkingCity, setEditWorkingCity] = useState('');
  const [editRatePerSqmt, setEditRatePerSqmt] = useState('');
  const [editSecurePin, setEditSecurePin] = useState('');
  const [detailsSubmitting, setDetailsSubmitting] = useState(false);
  const [detailsSuccess, setDetailsSuccess] = useState('');
  const [detailsError, setDetailsError] = useState('');

  // Form inputs
  const [firstname, setFirstname] = useState('');
  const [middlename, setMiddlename] = useState('');
  const [surname, setSurname] = useState('');
  const [firmname, setFirmname] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [workingCity, setWorkingCity] = useState('');
  const [ratePerSqmt, setRatePerSqmt] = useState('');
  const [securePin, setSecurePin] = useState('');

  const fetchAdvocates = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('http://localhost:5000/api/users/advocates');
      const data = await response.json();
      if (response.ok) {
        setAdvocates(data.Advocates || []);
      } else {
        setError(data.Msg || 'Failed to retrieve advocate records.');
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
    fetchAdvocates();
    fetchStates();
  }, []);

  const handleToggleStatus = async (id: number, currentStatus: number) => {
    const newStatus = currentStatus === 1 ? 0 : 1;
    try {
      const response = await fetch(`http://localhost:5000/api/users/status/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Status: newStatus })
      });
      if (response.ok) {
        setAdvocates(advocates.map(a => a.userId === id ? { ...a, status: newStatus } : a));
        if (viewingAdvocate && viewingAdvocate.userId === id) {
          setViewingAdvocate({ ...viewingAdvocate, status: newStatus });
        }
      } else {
        alert('Failed to update advocate status.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error while updating status.');
    }
  };

  const handleOpenViewModal = (adv: Advocate) => {
    setViewingAdvocate(adv);
    setEditFirstname(adv.firstname || '');
    setEditMiddlename(adv.middlename || '');
    setEditSurname(adv.surname || '');
    setEditFirmname(adv.firmname || '');
    setEditMobile(adv.mobile || '');
    setEditEmail(adv.email || '');
    setEditAddress(adv.address || '');
    setEditCity(adv.city || '');
    setEditWorkingCity(adv.workingCity || '');
    setEditRatePerSqmt(adv.ratePerSqmt !== null ? String(adv.ratePerSqmt) : '');
    setEditSecurePin(adv.securePin || '');
    setNewPassword('');
    setPasswordSuccess('');
    setPasswordError('');
    setDetailsSuccess('');
    setDetailsError('');
    setViewModalOpen(true);
  };

  const handleUpdateDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewingAdvocate) return;

    setDetailsSubmitting(true);
    setDetailsSuccess('');
    setDetailsError('');

    try {
      const response = await fetch(`http://localhost:5000/api/users/update-user/${viewingAdvocate.userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Firstname: editFirstname,
          Middlename: editMiddlename,
          Surname: editSurname,
          Firmname: editFirmname,
          Username: viewingAdvocate.username,
          Mobile: editMobile,
          Email: editEmail,
          Address: editAddress,
          City: editCity,
          WorkingCity: editWorkingCity,
          RatePerSqmt: editRatePerSqmt,
          SecurePin: editSecurePin,
          Status: viewingAdvocate.status
        })
      });
      const data = await response.json();
      if (response.ok && data.Status === 4) {
        setDetailsSuccess('Advocate profile updated successfully!');
        setAdvocates(advocates.map(a => a.userId === viewingAdvocate.userId ? {
          ...a,
          firstname: editFirstname,
          middlename: editMiddlename,
          surname: editSurname,
          firmname: editFirmname,
          mobile: editMobile,
          email: editEmail,
          address: editAddress,
          city: editCity,
          workingCity: editWorkingCity,
          ratePerSqmt: editRatePerSqmt ? parseFloat(editRatePerSqmt) : null,
          securePin: editSecurePin
        } : a));
        setViewingAdvocate({
          ...viewingAdvocate,
          firstname: editFirstname,
          middlename: editMiddlename,
          surname: editSurname,
          firmname: editFirmname,
          mobile: editMobile,
          email: editEmail,
          address: editAddress,
          city: editCity,
          workingCity: editWorkingCity,
          ratePerSqmt: editRatePerSqmt ? parseFloat(editRatePerSqmt) : null,
          securePin: editSecurePin
        });
      } else {
        setDetailsError(data.Msg || 'Failed to update advocate profile.');
      }
    } catch (err) {
      console.error(err);
      setDetailsError('Network error while updating details.');
    } finally {
      setDetailsSubmitting(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewingAdvocate || !newPassword) return;

    setPasswordSubmitting(true);
    setPasswordSuccess('');
    setPasswordError('');

    try {
      const response = await fetch(`http://localhost:5000/api/users/update-user/${viewingAdvocate.userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Firstname: viewingAdvocate.firstname,
          Middlename: viewingAdvocate.middlename,
          Surname: viewingAdvocate.surname,
          Firmname: viewingAdvocate.firmname,
          Username: viewingAdvocate.username,
          Mobile: viewingAdvocate.mobile,
          Email: viewingAdvocate.email,
          Address: viewingAdvocate.address,
          City: viewingAdvocate.city,
          WorkingCity: viewingAdvocate.workingCity,
          RatePerSqmt: viewingAdvocate.ratePerSqmt,
          SecurePin: viewingAdvocate.securePin,
          Status: viewingAdvocate.status,
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

  const handleDeleteAdvocate = async (id: number) => {
    if (!confirm("Are you sure you want to delete this advocate? This action cannot be undone.")) {
      return;
    }
    try {
      const response = await fetch(`http://localhost:5000/api/users/${id}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (response.ok && data.Status === 6) {
        setAdvocates(advocates.filter(a => a.userId !== id));
        alert('Advocate deleted successfully.');
        if (viewingAdvocate?.userId === id) {
          setViewModalOpen(false);
        }
      } else {
        alert(data.Msg || 'Failed to delete advocate. Ensure no dependencies exist for this user.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error while deleting advocate.');
    }
  };

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
    setCity('');
    setWorkingCity('');
    setRatePerSqmt('');
    setSecurePin('');
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
      City: city,
      WorkingCity: workingCity,
      RatePerSqmt: ratePerSqmt,
      UserTypeID: 4, // Advocate role
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
        setModalOpen(false);
        fetchAdvocates();
      } else {
        alert(data.Msg || 'Failed to submit advocate details.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error while registering advocate.');
    }
  };

  const filteredAdvocates = advocates.filter(a => {
    const full = `${a.firstname} ${a.surname} ${a.username}`.toLowerCase();
    return full.includes(searchTerm.toLowerCase());
  });

  return (
    <DashboardLayout role="admin">
      <div className="absolute top-10 right-10 w-[400px] h-[400px] rounded-full bg-blue-500/5 blur-[100px] pointer-events-none" />

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <Users className="text-purple-500" size={32} />
              Registered Advocates
            </h2>
            <p className="text-slate-400 text-sm mt-1">Manage advocate profiles, active case reviews, and SqMt drafting charges</p>
          </div>
          <button
            onClick={handleOpenAddModal}
            className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-lg text-sm transition-all flex items-center gap-2 cursor-pointer shadow-md"
          >
            <UserPlus size={16} />
            <span>Add New Advocate</span>
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3">
            <ShieldAlert size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Filter bar */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl shadow-md flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input
              type="text"
              placeholder="Search by name, username..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Advocates Grid Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
                <Loader2 className="animate-spin text-purple-500" size={32} />
                <span>Loading advocates database...</span>
              </div>
            ) : filteredAdvocates.length === 0 ? (
              <div className="py-20 text-center text-slate-500 text-sm">
                No advocate records matching your query were found.
              </div>
            ) : (
              <table className="w-full border-collapse text-left text-sm text-slate-300">
                <thead className="bg-slate-950 text-slate-400 text-xs uppercase font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-4 px-6 text-center w-12">#</th>
                    <th className="py-4 px-6">Advocate Code</th>
                    <th className="py-4 px-6">Full Name</th>
                    <th className="py-4 px-6">Username</th>
                    <th className="py-4 px-6">Mobile No</th>
                    <th className="py-4 px-6">Email Address</th>
                    <th className="py-4 px-6">Rate / SqMt</th>
                    <th className="py-4 px-6 text-center w-28">Status</th>
                    <th className="py-4 px-6 text-center w-20">#</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredAdvocates.map((adv, idx) => (
                    <tr key={adv.userId} className="hover:bg-slate-950/40 transition-colors">
                      <td className="py-4 px-6 text-center font-medium text-slate-500">{idx + 1}</td>
                      <td className="py-4 px-6 font-mono text-xs text-purple-400">{adv.userCodeFull || 'Pending'}</td>
                      <td className="py-4 px-6 font-semibold text-white">
                        {adv.firstname} {adv.middlename} {adv.surname}
                      </td>
                      <td className="py-4 px-6 text-slate-300">{adv.username}</td>
                      <td className="py-4 px-6 text-slate-400">{adv.mobile || 'N/A'}</td>
                      <td className="py-4 px-6 text-slate-400">{adv.email || 'N/A'}</td>
                      <td className="py-4 px-6 font-bold text-white flex items-center gap-0.5">
                        <span className="text-purple-400 text-xs font-semibold">₹</span>
                        <span>{adv.ratePerSqmt || '0.00'}</span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <button
                          onClick={() => handleToggleStatus(adv.userId, adv.status)}
                          title="Click to toggle account status"
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold cursor-pointer select-none transition-all ${
                            adv.status === 1 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                              : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}
                        >
                          {adv.status === 1 ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                          <span>{adv.status === 1 ? 'Active' : 'Locked'}</span>
                        </button>
                      </td>
                      <td className="py-4 px-6 text-center whitespace-nowrap w-20">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenViewModal(adv)}
                            title="View / Edit Details"
                            className="p-1 hover:bg-slate-800 rounded text-purple-400 hover:text-white transition-colors cursor-pointer border-none bg-transparent"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteAdvocate(adv.userId)}
                            title="Delete Advocate"
                            className="p-1 hover:bg-red-500/10 rounded text-red-500 hover:text-red-400 transition-colors cursor-pointer border-none bg-transparent"
                          >
                            <Trash2 size={16} />
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

      {/* Modal Add Advocate */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden my-8">
            <div className="p-6 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <UserPlus className="text-purple-500" size={22} />
                <span>Register Advocate Account</span>
              </h3>
              <button 
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
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
                  <label className="block text-slate-400 text-xs font-semibold mb-1">Working City</label>
                  <input
                    type="text"
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
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
                  <label className="block text-slate-400 text-xs font-semibold mb-1">Rate / SqMt *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none text-right"
                    value={ratePerSqmt}
                    onChange={(e) => setRatePerSqmt(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-1">Email Address</label>
                  <input
                    type="email"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-1">Secure PIN</label>
                  <input
                    type="text"
                    placeholder="4-digit secure pin"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none"
                    value={securePin}
                    onChange={(e) => setSecurePin(e.target.value)}
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
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-850 hover:bg-slate-800 text-slate-300 font-medium rounded-lg text-sm transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-lg text-sm transition-all"
                >
                  Register Advocate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* MODAL: View/Edit Details & Change Password */}
      {viewModalOpen && viewingAdvocate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden my-8">
            <div className="p-6 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Users className="text-purple-500" size={22} />
                <span>Advocate Information Details</span>
              </h3>
              <button 
                onClick={() => setViewModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors text-2xl font-semibold cursor-pointer border-none bg-transparent"
              >
                &times;
              </button>
            </div>
            
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              
              {/* Form 1: Edit Details */}
              <form onSubmit={handleUpdateDetails} className="space-y-4">
                <h4 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                  <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                  <span>Edit Profile Information</span>
                </h4>

                {detailsSuccess && (
                  <div className="p-3 text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg">
                    {detailsSuccess}
                  </div>
                )}
                {detailsError && (
                  <div className="p-3 text-xs bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg">
                    {detailsError}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-slate-400 text-xs font-semibold mb-1">First Name *</label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:border-purple-500"
                      value={editFirstname}
                      onChange={(e) => setEditFirstname(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-xs font-semibold mb-1">Middle Name</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:border-purple-500"
                      value={editMiddlename}
                      onChange={(e) => setEditMiddlename(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-xs font-semibold mb-1">Surname *</label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:border-purple-500"
                      value={editSurname}
                      onChange={(e) => setEditSurname(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 text-xs font-semibold mb-1">Firm Name</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:border-purple-500"
                      value={editFirmname}
                      onChange={(e) => setEditFirmname(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-xs font-semibold mb-1">Working City</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:border-purple-500"
                      value={editWorkingCity}
                      onChange={(e) => setEditWorkingCity(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-slate-400 text-xs font-semibold mb-1">Mobile No *</label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:border-purple-500"
                      value={editMobile}
                      onChange={(e) => setEditMobile(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-xs font-semibold mb-1">Rate / SqMt *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs text-right focus:outline-none focus:border-purple-500"
                      value={editRatePerSqmt}
                      onChange={(e) => setEditRatePerSqmt(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 text-xs font-semibold mb-1">Email Address</label>
                    <input
                      type="email"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:border-purple-500"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-xs font-semibold mb-1">Secure PIN</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:border-purple-500"
                      value={editSecurePin}
                      onChange={(e) => setEditSecurePin(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 text-xs font-semibold mb-1">Office Address</label>
                    <textarea
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:border-purple-500"
                      rows={2}
                      value={editAddress}
                      onChange={(e) => setEditAddress(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-xs font-semibold mb-1">City</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:border-purple-500"
                      value={editCity}
                      onChange={(e) => setEditCity(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={detailsSubmitting}
                    className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-medium rounded-lg text-xs transition-all flex items-center gap-2 border-none cursor-pointer"
                  >
                    {detailsSubmitting ? <Loader2 size={12} className="animate-spin" /> : null}
                    <span>Save Details</span>
                  </button>
                </div>
              </form>

              {/* Form 2: Change Password */}
              <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-5 space-y-4">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Lock size={16} className="text-amber-500" />
                  <span>Change Advocate Password</span>
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
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:border-purple-500"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={passwordSubmitting || !newPassword}
                    className="px-5 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 disabled:text-slate-650 text-white font-medium rounded-lg text-xs transition-all shrink-0 cursor-pointer h-9 flex items-center justify-center gap-2 border-none"
                  >
                    {passwordSubmitting ? <Loader2 size={12} className="animate-spin" /> : null}
                    <span>Update Password</span>
                  </button>
                </form>
              </div>

              {/* Footer Actions */}
              <div className="flex justify-between items-center pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => handleDeleteAdvocate(viewingAdvocate.userId)}
                  className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-semibold rounded-lg text-xs transition-all cursor-pointer border border-red-500/20"
                >
                  Delete Account
                </button>
                <button
                  type="button"
                  onClick={() => setViewModalOpen(false)}
                  className="px-5 py-2 bg-slate-850 hover:bg-slate-800 text-slate-300 font-medium rounded-lg text-xs transition-all cursor-pointer border-none"
                >
                  Close Detail
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
