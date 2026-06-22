"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Phone, MapPin, Mail, ArrowUp, Send, CheckCircle, AlertCircle, Loader, User, Lock, FileText } from 'lucide-react';
import Header from '@/components/Header';

export default function RegisterAgentPage() {
  const router = useRouter();

  // Form states
  const [firstname, setFirstname] = useState('');
  const [middlename, setMiddlename] = useState('');
  const [surname, setSurname] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [officePhone, setOfficePhone] = useState('');
  const [firmname, setFirmname] = useState('');
  const [address, setAddress] = useState('');
  const [district, setDistrict] = useState('');
  const [city, setCity] = useState('');
  const [stateId, setStateId] = useState('');
  const [pincode, setPincode] = useState('');
  const [workingCity, setWorkingCity] = useState('');
  const [aadharNo, setAadharNo] = useState('');
  const [sqId, setSqId] = useState('');
  const [securityAns, setSecurityAns] = useState('');
  const [termsAccept, setTermsAccept] = useState(false);

  // UI States
  const [states, setStates] = useState<{ state_id: number; state_name: string }[]>([]);
  const [questions, setQuestions] = useState<{ sq_id: number; label: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [assignedCode, setAssignedCode] = useState('');

  // Fetch dropdowns on mount
  useEffect(() => {
    async function loadData() {
      try {
        const statesRes = await fetch('http://localhost:5000/api/users/states');
        const statesData = await statesRes.json();
        if (statesRes.ok) {
          setStates(statesData.States || []);
        }

        const sqRes = await fetch('http://localhost:5000/api/users/security-questions');
        const sqData = await sqRes.json();
        if (sqRes.ok) {
          setQuestions(sqData.Questions || []);
        }
      } catch (err) {
        console.error('Error fetching registration dropdowns:', err);
      }
    }
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termsAccept) {
      setErrorMsg('You must agree to the Terms and Conditions.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    setSubmitted(false);

    const payload = {
      Firstname: firstname,
      Middlename: middlename,
      Surname: surname,
      Mobile: mobile,
      Email: email,
      Username: username.trim(),
      Password: password.trim(),
      OfficePhone: officePhone,
      Firmname: firmname,
      Address: address,
      District: district,
      City: city,
      StateID: stateId ? parseInt(stateId) : null,
      Pincode: pincode,
      WorkingCity: workingCity,
      AadharNo: aadharNo,
      SqId: sqId ? parseInt(sqId) : null,
      SecurityAns: securityAns,
      TermsAccept: termsAccept ? 1 : 0,
      UserTypeID: 3 // Agent role
    };

    try {
      const response = await fetch('http://localhost:5000/api/users/public/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (response.ok && data.Status === 4) {
        setSubmitted(true);
        setAssignedCode(data.UserCodeFull || '');
        // Clear form
        setFirstname('');
        setMiddlename('');
        setSurname('');
        setMobile('');
        setEmail('');
        setUsername('');
        setPassword('');
        setOfficePhone('');
        setFirmname('');
        setAddress('');
        setDistrict('');
        setCity('');
        setStateId('');
        setPincode('');
        setWorkingCity('');
        setAadharNo('');
        setSqId('');
        setSecurityAns('');
        setTermsAccept(false);

        // Redirect to login after a brief delay
        setTimeout(() => {
          router.push('/login?role=agent');
        }, 5000);
      } else {
        setErrorMsg(data.Msg || 'Registration failed. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Connection to registration server failed. Please ensure the backend is active.');
    } finally {
      setSubmitting(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans relative overflow-hidden flex flex-col justify-between selection:bg-red-500/30 selection:text-white">
      {/* Background Ambient Glows */}
      <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-red-600/10 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-purple-600/5 blur-[130px] pointer-events-none" />

      {/* Header */}
      <Header activePage="none" />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 z-10 flex-1 flex flex-col justify-center">
        <div className="bottom40 mb-10 text-center">
          <h1 className="text-3xl font-extrabold text-white tracking-wide uppercase">
            Agent <span className="text-red-500">Registration</span>
          </h1>
          <div className="w-16 h-1 bg-red-600 mt-4 mx-auto rounded-full" />
        </div>

        {/* Center Panel Container */}
        <div className="w-full bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 md:p-10 shadow-2xl backdrop-blur-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full translate-x-12 -translate-y-12 pointer-events-none" />

          {submitted && (
            <div className="mb-8 p-5 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm flex items-start gap-3.5 animate-fadeIn">
              <CheckCircle size={20} className="shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-base mb-1">Registration Successful!</h4>
                <p className="text-xs text-slate-400">
                  Your agent account has been registered with code <strong className="text-green-300 font-mono text-sm">{assignedCode}</strong>. 
                  Redirecting you to the login screen...
                </p>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="mb-8 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2.5 animate-fadeIn">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* ROW 1: Code, First Name, Middle Name, Surname */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Code *</label>
                <input
                  type="text"
                  readOnly
                  value="AUTO-ASSIGNED"
                  className="w-full px-4 py-3 bg-slate-950/80 border border-slate-800 text-slate-500 font-mono text-xs rounded-lg select-none outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">First Name *</label>
                <input
                  type="text"
                  required
                  placeholder="First Name"
                  value={firstname}
                  onChange={(e) => setFirstname(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800 hover:border-slate-700 focus:border-red-500 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500/15 transition-all text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Middle Name</label>
                <input
                  type="text"
                  placeholder="Middle Name"
                  value={middlename}
                  onChange={(e) => setMiddlename(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800 hover:border-slate-700 focus:border-red-500 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500/15 transition-all text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Surname *</label>
                <input
                  type="text"
                  required
                  placeholder="Surname"
                  value={surname}
                  onChange={(e) => setSurname(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800 hover:border-slate-700 focus:border-red-500 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500/15 transition-all text-xs"
                />
              </div>
            </div>

            {/* ROW 2: Mobile, Email, Username, Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Mobile *</label>
                <input
                  type="text"
                  required
                  placeholder="10-digit number"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800 hover:border-slate-700 focus:border-red-500 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500/15 transition-all text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Email *</label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800 hover:border-slate-700 focus:border-red-500 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500/15 transition-all text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Username *</label>
                <input
                  type="text"
                  required
                  placeholder="Choose Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800 hover:border-slate-700 focus:border-red-500 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500/15 transition-all text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Password *</label>
                <input
                  type="password"
                  required
                  placeholder="Choose Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800 hover:border-slate-700 focus:border-red-500 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500/15 transition-all text-xs"
                />
              </div>
            </div>

            {/* ROW 3: Office Phone, Firm Name, Address, District */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Office Phone</label>
                <input
                  type="text"
                  placeholder="Office Phone"
                  value={officePhone}
                  onChange={(e) => setOfficePhone(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800 hover:border-slate-700 focus:border-red-500 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500/15 transition-all text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Firm Name</label>
                <input
                  type="text"
                  placeholder="Firm Name"
                  value={firmname}
                  onChange={(e) => setFirmname(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800 hover:border-slate-700 focus:border-red-500 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500/15 transition-all text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Address</label>
                <input
                  type="text"
                  placeholder="Office/Residential Address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800 hover:border-slate-700 focus:border-red-500 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500/15 transition-all text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">District</label>
                <input
                  type="text"
                  placeholder="District"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800 hover:border-slate-700 focus:border-red-500 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500/15 transition-all text-xs"
                />
              </div>
            </div>

            {/* ROW 4: City, State, Pincode, Working City */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">City</label>
                <input
                  type="text"
                  placeholder="City"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800 hover:border-slate-700 focus:border-red-500 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500/15 transition-all text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">State</label>
                <select
                  value={stateId}
                  onChange={(e) => setStateId(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-red-500 rounded-lg text-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500/15 transition-all text-xs"
                >
                  <option value="">-- SELECT --</option>
                  {states.map(s => (
                    <option key={s.state_id} value={s.state_id}>{s.state_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Pincode</label>
                <input
                  type="text"
                  placeholder="Pincode"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800 hover:border-slate-700 focus:border-red-500 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500/15 transition-all text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Working City *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pune, moshi"
                  value={workingCity}
                  onChange={(e) => setWorkingCity(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800 hover:border-slate-700 focus:border-red-500 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500/15 transition-all text-xs"
                />
              </div>
            </div>

            {/* ROW 5: Aadhar No, Security Question, Security Ans */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Aadhar No</label>
                <input
                  type="text"
                  placeholder="12-digit UIDAI number"
                  value={aadharNo}
                  onChange={(e) => setAadharNo(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800 hover:border-slate-700 focus:border-red-500 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500/15 transition-all text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Security Question</label>
                <select
                  value={sqId}
                  onChange={(e) => setSqId(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-red-500 rounded-lg text-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500/15 transition-all text-xs"
                >
                  <option value="">-- SELECT --</option>
                  {questions.map(q => (
                    <option key={q.sq_id} value={q.sq_id}>{q.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Security Ans</label>
                <input
                  type="text"
                  placeholder="Your Answer"
                  value={securityAns}
                  onChange={(e) => setSecurityAns(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800 hover:border-slate-700 focus:border-red-500 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500/15 transition-all text-xs"
                />
              </div>
            </div>

            {/* Terms acceptance checkbox */}
            <div className="pt-4 border-t border-slate-800 flex flex-col gap-2">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={termsAccept} 
                  onChange={(e) => setTermsAccept(e.target.checked)} 
                  className="w-4 h-4 rounded text-red-500 bg-slate-950 border-slate-800 focus:ring-0 focus:ring-offset-0 focus:outline-none cursor-pointer"
                />
                <span className="text-xs text-slate-400">
                  I have read and agree to the <a href="#" className="text-red-400 hover:underline">Terms and Conditions</a>.
                </span>
              </label>
              <span className="text-[10px] text-red-500 font-bold uppercase tracking-wider">(all * marked fields are mandatory)</span>
            </div>

            {/* Submit button */}
            <div className="flex justify-center pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="px-12 py-3.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 text-white font-bold tracking-wider rounded-lg text-xs shadow-lg shadow-red-950/20 transition-all active:scale-98 flex items-center gap-2 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader size={14} className="animate-spin" />
                    <span>REGISTERING...</span>
                  </>
                ) : (
                  <>
                    <span>REGISTER</span>
                    <Send size={12} />
                  </>
                )}
              </button>
            </div>

          </form>
        </div>
      </main>

      {/* Copyright Bar */}
      <section className="bg-slate-950 py-6 text-slate-600 border-t border-slate-900/20 text-xs z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <p>Copyright 2021 <span className="text-white font-semibold">DAINNA</span>. All Rights Reserved.</p>
          <button 
            onClick={scrollToTop}
            className="w-10 h-10 rounded-full bg-slate-900 hover:bg-red-600 text-slate-500 hover:text-white flex items-center justify-center transition-colors border border-slate-900/80 shadow"
          >
            <ArrowUp size={16} />
          </button>
        </div>
      </section>
    </div>
  );
}
