"use client";

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  Users, Search, ShieldAlert, Loader2, Edit, Trash2, CheckCircle2 
} from 'lucide-react';
import Link from 'next/link';

interface Staff {
  userId: number;
  userCodeFull: string;
  firstname: string;
  middlename: string;
  surname: string;
  username: string;
  mobile: string;
  email: string;
  officePhone: string;
  status: number;
  city: string;
  address: string;
  district: string;
  stateId: number | null;
  postcode: string;
  workingCity: string;
  aadharNo: string;
  securePin: string;
}

interface StateObj {
  state_id: number;
  state_name: string;
}

export default function ViewAllStaffPage() {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [states, setStates] = useState<StateObj[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);

  // Edit fields
  const [firstname, setFirstname] = useState('');
  const [middlename, setMiddlename] = useState('');
  const [surname, setSurname] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [district, setDistrict] = useState('');
  const [city, setCity] = useState('');
  const [stateId, setStateId] = useState('');
  const [postcode, setPostcode] = useState('');
  const [workingCity, setWorkingCity] = useState('');
  const [officePhone, setOfficePhone] = useState('');
  const [aadharNo, setAadharNo] = useState('');
  const [status, setStatus] = useState('1');
  const [securePin, setSecurePin] = useState('');

  const fetchStates = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/users/states');
      const data = await res.json();
      if (res.ok) setStates(data.States || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStaff = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('http://localhost:5000/api/users/staff');
      const data = await response.json();
      if (response.ok) {
        setStaffList(data.Staff || []);
      } else {
        setError(data.Msg || 'Failed to retrieve staff records.');
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
    fetchStaff();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to remove this staff account?')) return;
    try {
      const response = await fetch(`http://localhost:5000/api/users/${id}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (response.ok) {
        setStaffList(staffList.filter(s => s.userId !== id));
      } else {
        alert(data.Msg || 'Failed to delete staff member.');
      }
    } catch (err) {
      console.error(err);
      alert('Delete request failed.');
    }
  };

  const handleOpenEditModal = (s: Staff) => {
    setEditingStaff(s);
    setFirstname(s.firstname || '');
    setMiddlename(s.middlename || '');
    setSurname(s.surname || '');
    setUsername(s.username || '');
    setPassword(''); // blank by default
    setMobile(s.mobile || '');
    setEmail(s.email || '');
    setAddress(s.address || '');
    setDistrict(s.district || '');
    setCity(s.city || '');
    setStateId(s.stateId ? String(s.stateId) : '');
    setPostcode(s.postcode || '');
    setWorkingCity(s.workingCity || '');
    setOfficePhone(s.officePhone || '');
    setAadharNo(s.aadharNo || '');
    setStatus(String(s.status ?? 1));
    setSecurePin(s.securePin || '');
    setModalOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;

    const payload = {
      Firstname: firstname,
      Middlename: middlename,
      Surname: surname,
      Username: username,
      Password: password || undefined,
      Mobile: mobile,
      Email: email,
      Address: address,
      District: district,
      City: city,
      StateID: stateId || null,
      Pincode: postcode,
      WorkingCity: workingCity,
      OfficePhone: officePhone,
      AadharNo: aadharNo,
      Status: status,
      SecurePin: securePin
    };

    try {
      const response = await fetch(`http://localhost:5000/api/users/update-user/${editingStaff.userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();

      if (response.ok) {
        setModalOpen(false);
        fetchStaff();
      } else {
        alert(data.Msg || 'Failed to update staff credentials.');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to save changes.');
    }
  };

  const filteredStaff = staffList.filter(s => {
    const full = `${s.firstname} ${s.middlename} ${s.surname} ${s.username} ${s.mobile} ${s.email}`.toLowerCase();
    return full.includes(searchTerm.toLowerCase());
  });

  return (
    <DashboardLayout role="admin">
      <div className="absolute top-10 right-10 w-[400px] h-[400px] rounded-full bg-blue-500/5 blur-[100px] pointer-events-none" />

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <Users className="text-blue-500" size={32} />
              Administrative Staff
            </h2>
            <p className="text-slate-400 text-sm mt-1">View, update, or remove registered system staff accounts</p>
          </div>
          <Link
            href="/add_staff"
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg text-sm transition-all flex items-center gap-2 cursor-pointer shadow-md"
          >
            <span>+ Add New Staff</span>
          </Link>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3">
            <ShieldAlert size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl shadow-md flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input
              type="text"
              placeholder="Search by staff name, username, email, phone..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
                <Loader2 className="animate-spin text-blue-500" size={32} />
                <span>Loading staff list...</span>
              </div>
            ) : filteredStaff.length === 0 ? (
              <div className="py-20 text-center text-slate-500 text-sm">
                No staff records matching your search queries were found.
              </div>
            ) : (
              <table className="w-full border-collapse text-left text-sm text-slate-300">
                <thead className="bg-slate-950 text-slate-400 text-xs uppercase font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-4 px-6 text-center w-12">#</th>
                    <th className="py-4 px-6">Name</th>
                    <th className="py-4 px-6">Username</th>
                    <th className="py-4 px-6">Mobile</th>
                    <th className="py-4 px-6">Email</th>
                    <th className="py-4 px-6">Office Phone</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6 text-center w-28">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredStaff.map((staff, idx) => (
                    <tr key={staff.userId} className="hover:bg-slate-950/40 transition-colors">
                      <td className="py-4 px-6 text-center font-medium text-slate-500">{idx + 1}</td>
                      <td className="py-4 px-6 font-semibold text-white">
                        {`${staff.firstname || ''} ${staff.middlename || ''} ${staff.surname || ''}`.trim()}
                      </td>
                      <td className="py-4 px-6">{staff.username}</td>
                      <td className="py-4 px-6 text-slate-400">{staff.mobile || 'N/A'}</td>
                      <td className="py-4 px-6 text-slate-400">{staff.email || 'N/A'}</td>
                      <td className="py-4 px-6 text-slate-400">{staff.officePhone || 'N/A'}</td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                          staff.status === 1 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                        }`}>
                          {staff.status === 1 ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-3">
                          <button
                            onClick={() => handleOpenEditModal(staff)}
                            title="Edit Staff Member"
                            className="p-1.5 rounded bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white transition-all cursor-pointer"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(staff.userId)}
                            title="Remove Staff Member"
                            className="p-1.5 rounded bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all cursor-pointer"
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

      {/* Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Edit className="text-blue-500" size={22} />
                <span>Edit Staff Member Details</span>
              </h3>
              <button 
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors text-lg cursor-pointer animate-none"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleUpdate} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <label className="block text-slate-400 text-xs font-semibold mb-1">Password (Leave blank to keep same)</label>
                  <input
                    type="password"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-1">Mobile *</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
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
                  <label className="block text-slate-400 text-xs font-semibold mb-1">Aadhar No</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none"
                    value={aadharNo}
                    onChange={(e) => setAadharNo(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-1">City</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-1">Working City</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none"
                    value={workingCity}
                    onChange={(e) => setWorkingCity(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-1">State</label>
                  <select
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-1">District</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-1">Pincode</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none"
                    value={postcode}
                    onChange={(e) => setPostcode(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-1">Status</label>
                  <select
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="1">Active</option>
                    <option value="0">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-1">Address</label>
                  <textarea
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none h-20 resize-none"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-1">Security PIN (Secure pin code)</label>
                  <input
                    type="password"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none"
                    value={securePin}
                    onChange={(e) => setSecurePin(e.target.value)}
                  />
                </div>
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
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg text-sm transition-all"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
