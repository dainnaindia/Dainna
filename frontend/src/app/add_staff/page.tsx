"use client";

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { UserPlus, ShieldAlert, Loader2, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface StateObj {
  state_id: number;
  state_name: string;
}

export default function AddStaffPage() {
  const router = useRouter();
  const [states, setStates] = useState<StateObj[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
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

  useEffect(() => {
    // Fetch states
    fetch('http://localhost:5000/api/users/states')
      .then(res => res.json())
      .then(data => setStates(data.States || []))
      .catch(err => console.error(err));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    const payload = {
      Firstname: firstname,
      Middlename: middlename,
      Surname: surname,
      Username: username,
      Password: password,
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
      UserTypeID: 2 // Staff role ID
    };

    try {
      const response = await fetch('http://localhost:5000/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();

      if (response.ok && data.Status === 2) {
        setSuccess('Staff Account Registered Successfully.');
        // Reset form
        setFirstname('');
        setMiddlename('');
        setSurname('');
        setUsername('');
        setPassword('');
        setMobile('');
        setEmail('');
        setAddress('');
        setDistrict('');
        setCity('');
        setStateId('');
        setPostcode('');
        setWorkingCity('');
        setOfficePhone('');
        setAadharNo('');
        setStatus('1');
        setTimeout(() => {
          router.push('/view_all_staff');
        }, 1500);
      } else {
        setError(data.Msg || 'Failed to create staff account.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection failure. Please check if your API server is running.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="absolute top-10 right-10 w-[400px] h-[400px] rounded-full bg-blue-500/5 blur-[100px] pointer-events-none" />

      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <UserPlus className="text-blue-500" size={32} />
            Add New Staff Account
          </h2>
          <p className="text-slate-400 text-sm mt-1">Register administrative staff with custom login credentials</p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3 animate-fadeIn">
            <ShieldAlert size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-3 animate-fadeIn">
            <CheckCircle2 size={18} className="shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-8 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-slate-400 text-xs font-semibold mb-2">First Name *</label>
              <input
                type="text"
                required
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                value={firstname}
                onChange={(e) => setFirstname(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-slate-400 text-xs font-semibold mb-2">Middle Name</label>
              <input
                type="text"
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                value={middlename}
                onChange={(e) => setMiddlename(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-slate-400 text-xs font-semibold mb-2">Surname *</label>
              <input
                type="text"
                required
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                value={surname}
                onChange={(e) => setSurname(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-slate-400 text-xs font-semibold mb-2">Username *</label>
              <input
                type="text"
                required
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-slate-400 text-xs font-semibold mb-2">Password *</label>
              <input
                type="password"
                required
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-slate-400 text-xs font-semibold mb-2">Mobile *</label>
              <input
                type="text"
                required
                maxLength={10}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-slate-400 text-xs font-semibold mb-2">Email *</label>
              <input
                type="email"
                required
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-slate-400 text-xs font-semibold mb-2">Office Phone</label>
              <input
                type="text"
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                value={officePhone}
                onChange={(e) => setOfficePhone(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-slate-400 text-xs font-semibold mb-2">Aadhar No</label>
              <input
                type="text"
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                value={aadharNo}
                onChange={(e) => setAadharNo(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-slate-400 text-xs font-semibold mb-2">City</label>
              <input
                type="text"
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-slate-400 text-xs font-semibold mb-2">Working City</label>
              <input
                type="text"
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                value={workingCity}
                onChange={(e) => setWorkingCity(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-slate-400 text-xs font-semibold mb-2">State</label>
              <select
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-slate-400 text-xs font-semibold mb-2">District</label>
              <input
                type="text"
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-slate-400 text-xs font-semibold mb-2">Pincode</label>
              <input
                type="text"
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                value={postcode}
                onChange={(e) => setPostcode(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-slate-400 text-xs font-semibold mb-2">Status</label>
              <select
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="1">Active</option>
                <option value="0">Inactive</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-400 text-xs font-semibold mb-2">Address</label>
            <textarea
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 h-24 resize-none"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-800">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-medium rounded-lg text-sm transition-all flex items-center gap-2 cursor-pointer shadow-md"
            >
              {submitting ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  <span>Registering...</span>
                </>
              ) : (
                <>
                  <UserPlus size={16} />
                  <span>Register Staff Member</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
