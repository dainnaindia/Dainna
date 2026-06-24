"use client";

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  User, Shield, Landmark, Loader2, Save, CheckCircle2, ShieldAlert, KeyRound, Eye, EyeOff
} from 'lucide-react';

interface UserProfile {
  userId: number;
  userTypeId: number;
  userCodeFull: string;
  firstname: string;
  middlename: string;
  surname: string;
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
  ratePerSqmt: number | null;
  securePin: string;
  bankName: string;
  bankBranch: string;
  bankIfscCode: string;
  bankAcHolder: string;
  bankAcNo: string;
}

interface StateObj {
  state_id: number;
  state_name: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [project, setProject] = useState<any | null>(null);
  const [states, setStates] = useState<StateObj[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'personal' | 'security' | 'bank'>('personal');

  // Input states
  const [firstname, setFirstname] = useState('');
  const [middlename, setMiddlename] = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [address, setAddress] = useState('');
  const [district, setDistrict] = useState('');
  const [city, setCity] = useState('');
  const [stateId, setStateId] = useState('');
  const [postcode, setPostcode] = useState('');
  const [officePhone, setOfficePhone] = useState('');
  const [aadharNo, setAadharNo] = useState('');

  // Password & Security
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securePin, setSecurePin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPin, setShowPin] = useState(false);

  // Bank details & Rate (Advocate only)
  const [bankName, setBankName] = useState('');
  const [bankBranch, setBankBranch] = useState('');
  const [bankIfscCode, setBankIfscCode] = useState('');
  const [bankAcHolder, setBankAcHolder] = useState('');
  const [bankAcNo, setBankAcNo] = useState('');
  const [confirmBankAcNo, setConfirmBankAcNo] = useState('');
  const [ratePerSqmt, setRatePerSqmt] = useState('');

  // PIN challenge states (for viewing bank details)
  const [pinChallenge, setPinChallenge] = useState('');
  const [pinVerified, setPinVerified] = useState(false);
  const [pinError, setPinError] = useState('');
  const [pinSubmitting, setPinSubmitting] = useState(false);

  const fetchProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('http://localhost:5000/api/users/profile');
      const data = await res.json();
      if (res.ok && data.Status === 100) {
        const u = data.User as UserProfile;
        setUser(u);
        setProject(data.Project);

        // Prepopulate fields
        setFirstname(u.firstname || '');
        setMiddlename(u.middlename || '');
        setSurname(u.surname || '');
        setEmail(u.email || '');
        setMobile(u.mobile || '');
        setAddress(u.address || '');
        setDistrict(u.district || '');
        setCity(u.city || '');
        setStateId(u.stateId ? String(u.stateId) : '');
        setPostcode(u.postcode || '');
        setOfficePhone(u.officePhone || '');
        setAadharNo(u.aadharNo || '');
        setSecurePin(u.securePin || '');

        setBankName(u.bankName || '');
        setBankBranch(u.bankBranch || '');
        setBankIfscCode(u.bankIfscCode || '');
        setBankAcHolder(u.bankAcHolder || '');
        setBankAcNo(u.bankAcNo || '');
        setConfirmBankAcNo(''); // Always ask user to type to confirm
        setRatePerSqmt(u.ratePerSqmt ? String(u.ratePerSqmt) : '');
      } else {
        setError(data.Error || 'Failed to fetch profile settings.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection to API server failed.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStates = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/users/states');
      const data = await res.json();
      if (res.ok) {
        setStates(data.States || []);
      }
    } catch (err) {
      console.error('Fetch states error:', err);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchStates();
  }, []);

  const handleVerifyPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError('');
    setPinSubmitting(true);
    try {
      const res = await fetch('http://localhost:5000/api/users/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ SecurePin: pinChallenge })
      });
      const data = await res.json();
      if (res.ok && data.Status === 1) {
        setPinVerified(true);
        setPinChallenge('');
      } else {
        setPinError(data.Msg || 'Invalid PIN entered. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setPinError('Failed to verify PIN. Please try again later.');
    } finally {
      setPinSubmitting(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (password && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (user?.userTypeId === 4 && pinVerified) {
      if (bankAcNo !== confirmBankAcNo) {
        setError('Bank Account Number and Confirmation Account Number do not match.');
        return;
      }
      const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
      if (bankIfscCode && !ifscRegex.test(bankIfscCode)) {
        setError('Please enter a valid IFSC code (e.g. SBIN0012345).');
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload: any = {
        Firstname: firstname,
        Middlename: middlename,
        Surname: surname,
        Email: email,
        Mobile: mobile,
        Address: address,
        District: district,
        City: city,
        StateID: stateId || null,
        Postcode: postcode,
        OfficePhone: officePhone,
        AadharNo: aadharNo,
        Password: password || undefined,
        SecurePin: securePin || undefined
      };

      if (user?.userTypeId === 4 && pinVerified) {
        payload.BankName = bankName;
        payload.BankBranch = bankBranch;
        payload.BankIfscCode = bankIfscCode;
        payload.BankAcHolder = bankAcHolder;
        payload.BankAcNo = bankAcNo;
        payload.RatePerSqmt = ratePerSqmt || null;
      }

      const res = await fetch('http://localhost:5000/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok && data.Status === 100) {
        setSuccessMsg('Profile settings updated successfully.');
        setPassword('');
        setConfirmPassword('');
        fetchProfile();
      } else {
        setError(data.Msg || 'Failed to update profile settings.');
      }
    } catch (err) {
      console.error(err);
      setError('Server connection error. Failed to save changes.');
    } finally {
      setSubmitting(false);
    }
  };

  const getRole = () => {
    if (!user) return 'agent';
    if (user.userTypeId === 3) return 'agent';
    if (user.userTypeId === 4) return 'advocate';
    return 'admin';
  };

  return (
    <DashboardLayout role={getRole()}>
      {/* Glow background */}
      <div className="absolute top-10 right-10 w-[400px] h-[400px] rounded-full bg-blue-500/5 blur-[100px] pointer-events-none" />

      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <User className="text-blue-500" size={32} />
            My Profile Settings
          </h2>
          <p className="text-slate-400 text-sm mt-1">Manage your account credentials, contact info, and bank settings</p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3 animate-fadeIn">
            <ShieldAlert size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-3 animate-fadeIn">
            <CheckCircle2 size={18} className="shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {loading ? (
          <div className="h-[50vh] flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="animate-spin text-blue-500" size={32} />
            <span>Retrieving profile info...</span>
          </div>
        ) : user ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            {/* Left Column: Summary Card */}
            <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-6">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-20 h-20 bg-blue-500/10 border border-blue-500/20 rounded-full flex items-center justify-center relative">
                  <User size={36} className="text-blue-400" />
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {`${user.firstname || ''} ${user.surname || ''}`}
                  </h3>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 bg-slate-800/40 px-2 py-0.5 rounded border border-slate-700/20">
                    {user.userTypeId === 3 ? 'Agent' : user.userTypeId === 4 ? 'Advocate' : 'Administrator'}
                  </span>
                </div>
              </div>

              <div className="border-t border-slate-800/60 pt-6 space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-450 font-medium">User Code:</span>
                  <span className="text-white font-semibold">{user.userCodeFull || 'N/A'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-450 font-medium">Username:</span>
                  <span className="text-white font-semibold">{user.username}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-450 font-medium">Mobile:</span>
                  <span className="text-white font-semibold">{user.mobile || 'N/A'}</span>
                </div>
                <div className="flex justify-between text-sm animate-none">
                  <span className="text-slate-450 font-medium">Email ID:</span>
                  <span className="text-white font-semibold truncate max-w-[150px]" title={user.email}>{user.email || 'N/A'}</span>
                </div>
                
                {user.userTypeId === 4 && project && (
                  <>
                    <div className="border-t border-slate-800/60 pt-4" />
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-450 font-medium">Project Name:</span>
                      <span className="text-white font-semibold">{project.projectName || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-450 font-medium">Project City:</span>
                      <span className="text-white font-semibold">{project.city || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-450 font-medium">SQMT Rate:</span>
                      <span className="text-emerald-400 font-semibold">₹{user.ratePerSqmt || '0.00'}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Right Column: Edit Forms / Tabs */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex gap-2 p-1.5 bg-slate-900 border border-slate-800/80 rounded-xl max-w-max select-none">
                <button
                  type="button"
                  onClick={() => setActiveTab('personal')}
                  className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all focus:outline-none cursor-pointer ${
                    activeTab === 'personal'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850/40'
                  }`}
                >
                  <User size={14} />
                  <span>Personal Details</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('security')}
                  className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all focus:outline-none cursor-pointer ${
                    activeTab === 'security'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850/40'
                  }`}
                >
                  <Shield size={14} />
                  <span>Security & PIN</span>
                </button>
                {user.userTypeId === 4 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('bank')}
                    className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all focus:outline-none cursor-pointer ${
                      activeTab === 'bank'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850/40'
                    }`}
                  >
                    <Landmark size={14} />
                    <span>Bank Account Details</span>
                  </button>
                )}
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  
                  {activeTab === 'personal' && (
                    <div className="space-y-4 animate-fadeIn">
                      <h4 className="text-sm font-bold text-white border-b border-slate-800 pb-2 mb-4">Contact Info & Profile Details</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-slate-400 text-xs font-semibold mb-1">First Name *</label>
                          <input
                            type="text"
                            required
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                            value={firstname}
                            onChange={(e) => setFirstname(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 text-xs font-semibold mb-1">Middle Name</label>
                          <input
                            type="text"
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                            value={middlename}
                            onChange={(e) => setMiddlename(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 text-xs font-semibold mb-1">Surname *</label>
                          <input
                            type="text"
                            required
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                            value={surname}
                            onChange={(e) => setSurname(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-slate-400 text-xs font-semibold mb-1">Email ID *</label>
                          <input
                            type="email"
                            required
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 text-xs font-semibold mb-1">Mobile No *</label>
                          <input
                            type="text"
                            required
                            maxLength={10}
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                            value={mobile}
                            onChange={(e) => setMobile(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-slate-400 text-xs font-semibold mb-1">City</label>
                          <input
                            type="text"
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 text-xs font-semibold mb-1">District *</label>
                          <input
                            type="text"
                            required
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                            value={district}
                            onChange={(e) => setDistrict(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 text-xs font-semibold mb-1">State</label>
                          <select
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
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
                          <label className="block text-slate-400 text-xs font-semibold mb-1">Postcode / Pincode *</label>
                          <input
                            type="text"
                            required
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                            value={postcode}
                            onChange={(e) => setPostcode(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 text-xs font-semibold mb-1">Office Phone</label>
                          <input
                            type="text"
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                            value={officePhone}
                            onChange={(e) => setOfficePhone(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 text-xs font-semibold mb-1">Aadhar No</label>
                          <input
                            type="text"
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                            value={aadharNo}
                            onChange={(e) => setAadharNo(e.target.value)}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-400 text-xs font-semibold mb-1">Address *</label>
                        <textarea
                          required
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 h-20 resize-none"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  {activeTab === 'security' && (
                    <div className="space-y-4 animate-fadeIn">
                      <h4 className="text-sm font-bold text-white border-b border-slate-800 pb-2 mb-4">Update Access Security Settings</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-slate-400 text-xs font-semibold mb-1">New Account Password</label>
                          <div className="relative">
                            <input
                              type={showPassword ? 'text' : 'password'}
                              placeholder="Leave blank to keep current"
                              className="w-full pl-3 pr-10 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 focus:outline-none cursor-pointer"
                            >
                              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="block text-slate-400 text-xs font-semibold mb-1">Confirm New Password</label>
                          <input
                            type="password"
                            placeholder="Confirm password"
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                          />
                        </div>
                      </div>

                      {user.userTypeId === 4 && (
                        <div className="pt-2 border-t border-slate-800/40 mt-6">
                          <div className="flex items-center gap-2 mb-2">
                            <KeyRound size={16} className="text-blue-500" />
                            <h5 className="text-xs font-bold text-white">Secure Access PIN</h5>
                          </div>
                          <p className="text-slate-500 text-xs mb-3">
                            The Secure PIN is required to unlock sensitive operations like viewing bank credentials and signing draft payout requests.
                          </p>
                          <div className="max-w-xs">
                            <label className="block text-slate-400 text-xs font-semibold mb-1">Change Security PIN</label>
                            <div className="relative">
                              <input
                                type={showPin ? 'text' : 'password'}
                                maxLength={6}
                                className="w-full pl-3 pr-10 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 tracking-wider"
                                value={securePin}
                                onChange={(e) => setSecurePin(e.target.value)}
                              />
                              <button
                                type="button"
                                onClick={() => setShowPin(!showPin)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 focus:outline-none cursor-pointer"
                              >
                                {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'bank' && user.userTypeId === 4 && (
                    <div className="space-y-4 animate-fadeIn">
                      <h4 className="text-sm font-bold text-white border-b border-slate-800 pb-2 mb-4">Billing Bank Details & Rates</h4>

                      {!pinVerified ? (
                        <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-8 flex flex-col items-center text-center space-y-4 max-w-md mx-auto">
                          <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center text-red-400">
                            <Shield size={24} />
                          </div>
                          <div>
                            <h5 className="text-sm font-bold text-white">Security Check Required</h5>
                            <p className="text-slate-500 text-xs mt-1">
                              Please enter your Secure PIN to view or change your registered bank details.
                            </p>
                          </div>

                          <div className="w-full">
                            <input
                              type="password"
                              placeholder="Enter 6-digit Secure PIN"
                              maxLength={6}
                              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 text-center tracking-widest font-bold"
                              value={pinChallenge}
                              onChange={(e) => setPinChallenge(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleVerifyPin(e);
                                }
                              }}
                            />
                            {pinError && (
                              <span className="block text-red-500 text-xs font-semibold mt-2 text-left">{pinError}</span>
                            )}
                          </div>

                          <button
                            type="button"
                            disabled={pinSubmitting}
                            onClick={handleVerifyPin}
                            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-semibold rounded-lg text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                          >
                            {pinSubmitting ? (
                              <>
                                <Loader2 className="animate-spin" size={14} />
                                <span>Verifying PIN...</span>
                              </>
                            ) : (
                              <span>Unlock Bank Form</span>
                            )}
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-4 animate-fadeIn">
                          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-lg flex items-center gap-2">
                            <CheckCircle2 size={14} />
                            <span>Security PIN verified successfully. Forms unlocked.</span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-slate-400 text-xs font-semibold mb-1">Advocate Rate Per SQMT (₹) *</label>
                              <input
                                type="number"
                                required
                                step="0.01"
                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                                value={ratePerSqmt}
                                onChange={(e) => setRatePerSqmt(e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="block text-slate-400 text-xs font-semibold mb-1">Bank Name *</label>
                              <input
                                type="text"
                                required
                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                                value={bankName}
                                onChange={(e) => setBankName(e.target.value)}
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-slate-400 text-xs font-semibold mb-1">Bank Branch *</label>
                              <input
                                type="text"
                                required
                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                                value={bankBranch}
                                onChange={(e) => setBankBranch(e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="block text-slate-400 text-xs font-semibold mb-1">Bank IFSC Code *</label>
                              <input
                                type="text"
                                required
                                maxLength={11}
                                placeholder="11 character code"
                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 uppercase"
                                value={bankIfscCode}
                                onChange={(e) => setBankIfscCode(e.target.value)}
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-slate-400 text-xs font-semibold mb-1">Account Holder Name *</label>
                            <input
                              type="text"
                              required
                              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                              value={bankAcHolder}
                              onChange={(e) => setBankAcHolder(e.target.value)}
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-slate-400 text-xs font-semibold mb-1">Bank Account Number *</label>
                              <input
                                type="password"
                                required
                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                                value={bankAcNo}
                                onChange={(e) => setBankAcNo(e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="block text-slate-400 text-xs font-semibold mb-1">Confirm Account Number *</label>
                              <input
                                type="text"
                                required
                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                                value={confirmBankAcNo}
                                onChange={(e) => setConfirmBankAcNo(e.target.value)}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Form Submission Controls (Hidden if viewing locked bank details) */}
                  {(activeTab !== 'bank' || !user.userTypeId || user.userTypeId !== 4 || pinVerified) && (
                    <div className="flex justify-end gap-3 pt-6 border-t border-slate-800/60 mt-8">
                      <button
                        type="submit"
                        disabled={submitting}
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-semibold rounded-lg text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md hover:scale-102"
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="animate-spin" size={14} />
                            <span>Updating profile...</span>
                          </>
                        ) : (
                          <>
                            <Save size={14} />
                            <span>Save Changes</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </form>
              </div>
            </div>

          </div>
        ) : (
          <div className="h-[50vh] flex items-center justify-center text-slate-500">
            No profile data retrieved.
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
