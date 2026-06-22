"use client";

import React, { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Layers, ShieldCheck, Lock, Edit, AlertCircle, CheckCircle2, Loader2, ArrowLeft, X } from 'lucide-react';

interface ProjectDetail {
  projectName: string;
  city: string;
  state_master?: {
    state_name: string;
  };
}

interface AdvocateUser {
  userId: number;
  firstname: string;
  middlename: string;
  surname: string;
  email: string;
  mobile: string;
  address: string;
  bankName: string;
  bankBranch: string;
  bankIfscCode: string;
  bankAcHolder: string;
  bankAcNo: string;
  securePin: string;
  ratePerSqmt: number;
}

export default function AdvocateBankDetailPage() {
  const [pinVerified, setPinVerified] = useState(false);
  const [securePin, setSecurePin] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Loaded details
  const [user, setUser] = useState<AdvocateUser | null>(null);
  const [project, setProject] = useState<ProjectDetail | null>(null);

  // Form inputs
  const [ratePerSqmt, setRatePerSqmt] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankBranch, setBankBranch] = useState('');
  const [bankIfscCode, setBankIfscCode] = useState('');
  const [bankAcHolder, setBankAcHolder] = useState('');
  const [bankAcNo, setBankAcNo] = useState('');
  const [confirmBankAcNo, setConfirmBankAcNo] = useState('');
  const [updating, setUpdating] = useState(false);

  // Forgot PIN modal states
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitting, setForgotSubmitting] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');

  const handleVerifyPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifying(true);
    setError('');

    try {
      const res = await fetch('http://localhost:5000/api/users/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ SecurePin: securePin })
      });
      const data = await res.json();

      if (res.ok && data.Status === 1) {
        // Fetch profile
        const profRes = await fetch('http://localhost:5000/api/users/profile');
        const profData = await profRes.json();
        if (profRes.ok && profData.Status === 100) {
          const adv = profData.User;
          setUser(adv);
          setProject(profData.Project);

          // Pre-populate form fields
          setRatePerSqmt(adv.ratePerSqmt ? adv.ratePerSqmt.toString() : '0');
          setBankName(adv.bankName || '');
          setBankBranch(adv.bankBranch || '');
          setBankIfscCode(adv.bankIfscCode || '');
          setBankAcHolder(adv.bankAcHolder || '');
          setBankAcNo(''); // Password input, empty by default
          setConfirmBankAcNo(''); // Text input, empty by default

          setPinVerified(true);
        } else {
          setError('Failed to retrieve advocate profile information.');
        }
      } else {
        setError(data.Msg || 'Invalid Secure PIN code.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection to backend API failed.');
    } finally {
      setVerifying(false);
    }
  };

  const handleForgotPinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotSubmitting(true);
    setForgotError('');
    setForgotSuccess('');

    try {
      const res = await fetch('http://localhost:5000/api/users/forgot-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ EmailID: forgotEmail })
      });
      const data = await res.json();

      if (res.ok && data.Status === 2) {
        setForgotSuccess(data.Msg || 'Check Your Email For Secure Pin.');
      } else {
        setForgotError(data.Msg || 'Please Enter Registered Email ID.');
      }
    } catch (err) {
      console.error(err);
      setForgotError('Connection to backend API failed.');
    } finally {
      setForgotSubmitting(false);
    }
  };

  const handleUpdateDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    setError('');
    setSuccess('');

    if (bankAcNo !== confirmBankAcNo) {
      alert("Bank Ac No and Confirm Bank Ac No is Different. Please Enter Same Ac No.");
      setUpdating(false);
      return;
    }

    if (bankIfscCode && bankIfscCode.length !== 11) {
      setError('IFSC Code must be exactly 11 alphanumeric characters.');
      setUpdating(false);
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Firstname: user?.firstname,
          Middlename: user?.middlename,
          Surname: user?.surname,
          Email: user?.email,
          Mobile: user?.mobile,
          Address: user?.address,
          SecurePin: securePin,
          RatePerSqmt: parseFloat(ratePerSqmt) || 0,
          BankName: bankName,
          BankBranch: bankBranch,
          BankIfscCode: bankIfscCode,
          BankAcHolder: bankAcHolder,
          BankAcNo: bankAcNo
        })
      });

      const data = await res.json();
      if (res.ok && data.Status === 100) {
        setSuccess('Bank detail profiles and payout configurations saved.');
        // Update user state
        if (user) {
          setUser({
            ...user,
            ratePerSqmt: parseFloat(ratePerSqmt) || 0,
            bankName,
            bankBranch,
            bankIfscCode,
            bankAcHolder,
            bankAcNo
          });
        }
        // Clear confirm fields
        setBankAcNo('');
        setConfirmBankAcNo('');
      } else {
        setError(data.Msg || 'Failed to update bank details.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection to backend API failed.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <DashboardLayout role="advocate">
      <div className="absolute top-10 right-10 w-[400px] h-[400px] rounded-full bg-blue-500/5 blur-[100px] pointer-events-none" />
      
      <div className="space-y-6 max-w-5xl mx-auto">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <ShieldCheck className="text-emerald-500" size={32} />
            Bank Detail
          </h2>
          <p className="text-slate-400 text-sm mt-1 font-sans">Manage advocate payout rates, associated projects, and banking configurations.</p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-3">
            <CheckCircle2 size={18} className="shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {!pinVerified ? (
          /* Verification Form */
          <div className="max-w-md mx-auto p-8 bg-slate-900 border border-slate-800 rounded-xl shadow-xl space-y-6">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center mx-auto mb-3">
                <Lock size={22} />
              </div>
              <h3 className="text-lg font-bold text-white font-sans">Enter Security PIN</h3>
              <p className="text-slate-500 text-xs mt-1 font-sans">Enter your secure verification PIN code to configure billing and account structures.</p>
            </div>

            <form onSubmit={handleVerifyPin} className="space-y-4">
              <div>
                <label className="block text-slate-450 text-xs font-semibold mb-2">Enter Pin</label>
                <input
                  type="password"
                  required
                  placeholder="••••"
                  className="w-full h-10 px-3 bg-slate-950 border border-slate-800 rounded-lg text-white text-center text-lg tracking-widest focus:outline-none focus:border-blue-500 transition-colors"
                  value={securePin}
                  onChange={(e) => setSecurePin(e.target.value)}
                />
              </div>

              <div className="text-left">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors font-bold underline cursor-pointer bg-transparent border-0 focus:outline-none"
                >
                  Forgot Pin
                </button>
              </div>

              <button
                type="submit"
                disabled={verifying}
                className="w-full h-10 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
              >
                {verifying ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <span>Submit</span>
                )}
              </button>
            </form>
          </div>
        ) : (
          /* Two Column Layout */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            
            {/* Left Column: Tabular read-only summary of current settings */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg p-6 space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-800 mb-2">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                  <Layers size={18} />
                </div>
                <h3 className="font-semibold text-lg text-white">Current Settings</h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-350">
                  <tbody>
                    <tr className="border-b border-slate-800/40">
                      <th className="py-3 font-semibold text-slate-400 w-1/3">Project Name</th>
                      <td className="py-3 text-slate-200">{project?.projectName || 'N/A'}</td>
                    </tr>
                    <tr className="border-b border-slate-800/40">
                      <th className="py-3 font-semibold text-slate-400">State</th>
                      <td className="py-3 text-slate-200">{project?.state_master?.state_name || 'N/A'}</td>
                    </tr>
                    <tr className="border-b border-slate-800/40">
                      <th className="py-3 font-semibold text-slate-400">City</th>
                      <td className="py-3 text-slate-200">{project?.city || 'N/A'}</td>
                    </tr>
                    <tr className="h-6">
                      <td colSpan={2}></td>
                    </tr>
                    <tr className="border-b border-slate-800/40">
                      <th className="py-3 font-semibold text-slate-400">Rate Per SQMT</th>
                      <td className="py-3 text-emerald-400 font-semibold">{user?.ratePerSqmt ? `₹${parseFloat(user.ratePerSqmt.toString()).toFixed(2)}` : '0.00'}</td>
                    </tr>
                    <tr className="border-b border-slate-800/40">
                      <th className="py-3 font-semibold text-slate-400">Bank Name</th>
                      <td className="py-3 text-slate-200">{user?.bankName || 'N/A'}</td>
                    </tr>
                    <tr className="border-b border-slate-800/40">
                      <th className="py-3 font-semibold text-slate-400">Bank Branch</th>
                      <td className="py-3 text-slate-200">{user?.bankBranch || 'N/A'}</td>
                    </tr>
                    <tr className="border-b border-slate-800/40">
                      <th className="py-3 font-semibold text-slate-400">Bank IFSC Code</th>
                      <td className="py-3 text-slate-200">{user?.bankIfscCode || 'N/A'}</td>
                    </tr>
                    <tr className="border-b border-slate-800/40">
                      <th className="py-3 font-semibold text-slate-400">Bank Ac Holder</th>
                      <td className="py-3 text-slate-200">{user?.bankAcHolder || 'N/A'}</td>
                    </tr>
                    <tr className="border-b border-slate-800/40">
                      <th className="py-3 font-semibold text-slate-400">Bank Ac No</th>
                      <td className="py-3 text-slate-200 font-mono tracking-wider">{user?.bankAcNo || 'N/A'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="pt-4">
                <button
                  onClick={() => {
                    setPinVerified(false);
                    setSecurePin('');
                  }}
                  className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-350 transition-colors font-medium cursor-pointer focus:outline-none"
                >
                  <ArrowLeft size={12} />
                  <span>Re-verify PIN Lock</span>
                </button>
              </div>
            </div>

            {/* Right Column: Update Form Widget */}
            <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl shadow-lg">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-800 mb-6">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                  <Edit size={18} />
                </div>
                <h3 className="font-semibold text-lg text-white">Update Bank Detail</h3>
              </div>

              <form onSubmit={handleUpdateDetails} className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-slate-400 text-xs font-semibold mb-1">Rate Per SQMT *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="Enter rate per sqmt"
                      className="w-full h-10 px-3 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                      value={ratePerSqmt}
                      onChange={(e) => setRatePerSqmt(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 text-xs font-semibold mb-1">Bank Name</label>
                    <input
                      type="text"
                      placeholder="Enter Bank Name"
                      className="w-full h-10 px-3 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 text-xs font-semibold mb-1">Bank Branch</label>
                    <input
                      type="text"
                      placeholder="Enter Bank Branch"
                      className="w-full h-10 px-3 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                      value={bankBranch}
                      onChange={(e) => setBankBranch(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 text-xs font-semibold mb-1">Bank IFSC Code</label>
                    <input
                      type="text"
                      maxLength={11}
                      minLength={11}
                      placeholder="Enter 11-char IFSC Code"
                      className="w-full h-10 px-3 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 transition-colors uppercase"
                      value={bankIfscCode}
                      onChange={(e) => setBankIfscCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 text-xs font-semibold mb-1">Bank Ac Holder</label>
                    <input
                      type="text"
                      placeholder="Enter Account Holder Name"
                      className="w-full h-10 px-3 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                      value={bankAcHolder}
                      onChange={(e) => setBankAcHolder(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 text-xs font-semibold mb-1">Bank Ac No *</label>
                    <input
                      type="password"
                      required
                      placeholder="Enter Account Number"
                      className="w-full h-10 px-3 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                      value={bankAcNo}
                      onChange={(e) => setBankAcNo(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 text-xs font-semibold mb-1">Confirm Bank Ac No *</label>
                    <input
                      type="text"
                      required
                      placeholder="Confirm Account Number"
                      className="w-full h-10 px-3 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                      value={confirmBankAcNo}
                      onChange={(e) => setConfirmBankAcNo(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-800 mt-6">
                  <button
                    type="submit"
                    disabled={updating}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-sm transition-all flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                  >
                    {updating ? (
                      <>
                        <Loader2 className="animate-spin" size={16} />
                        <span>Updating...</span>
                      </>
                    ) : (
                      <span>Update</span>
                    )}
                  </button>
                </div>
              </form>
            </div>

          </div>
        )}

        {/* Forgot PIN Modal */}
        {showForgotModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-fadeIn">
              <div className="flex items-center justify-between p-4 border-b border-slate-800">
                <h4 className="text-lg font-bold text-white font-sans">Forgot Pin</h4>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotModal(false);
                    setForgotError('');
                    setForgotSuccess('');
                    setForgotEmail('');
                  }}
                  className="text-slate-450 hover:text-white transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleForgotPinSubmit} className="p-6 space-y-4">
                {forgotError && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{forgotError}</span>
                  </div>
                )}

                {forgotSuccess && (
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                    <CheckCircle2 size={14} className="shrink-0" />
                    <span>{forgotSuccess}</span>
                  </div>
                )}

                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-1">Email ID *</label>
                  <input
                    type="email"
                    required
                    placeholder="Enter Registered Email ID"
                    className="w-full h-10 px-3 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotModal(false);
                      setForgotError('');
                      setForgotSuccess('');
                      setForgotEmail('');
                    }}
                    className="px-4 py-2 bg-slate-850 hover:bg-slate-800 text-slate-300 font-semibold rounded-lg text-xs transition-all cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={forgotSubmitting}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-xs transition-all flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                  >
                    {forgotSubmitting ? (
                      <>
                        <Loader2 className="animate-spin" size={12} />
                        <span>Please Wait...</span>
                      </>
                    ) : (
                      <span>Submit</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
