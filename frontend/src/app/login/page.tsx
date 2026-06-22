"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Phone, MapPin, Mail, ArrowUp, AlertCircle, Loader, User, Lock } from 'lucide-react';
import Header from '@/components/Header';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleParam = searchParams.get('role') || 'agent'; // default to agent

  // State management
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [verificationMessage, setVerificationMessage] = useState('');
  const [verificationSuccess, setVerificationSuccess] = useState<boolean | null>(null);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    const verifyToken = searchParams.get('verify');
    if (verifyToken) {
      setVerifying(true);
      fetch(`http://localhost:5000/api/auth/verify-email?token=${verifyToken}`)
        .then(res => res.json())
        .then(data => {
          if (data.Status === 100) {
            setVerificationSuccess(true);
            setVerificationMessage('Email Verification Successfully. Please Login Using Your Username.');
          } else {
            setVerificationSuccess(false);
            setVerificationMessage('Email Verification Failed. Please Try Again Later.');
          }
        })
        .catch(err => {
          console.error(err);
          setVerificationSuccess(false);
          setVerificationMessage('Email Verification Failed due to server error.');
        })
        .finally(() => {
          setVerifying(false);
        });
    }
  }, [searchParams]);

  // Map role parameters to titles and values
  const getRoleConfig = () => {
    switch (roleParam.toLowerCase()) {
      case 'advocate':
      case 'adv':
        return { title: 'ADVOCATE LOGIN', typeId: 4, regPath: '/register_advocate' };
      case 'admin':
        return { title: 'ADMIN LOGIN', typeId: 1, regPath: '/register_agent' };
      case 'staff':
        return { title: 'OFFICE STAFF LOGIN', typeId: 2, regPath: '/register_agent' };
      case 'agent':
      default:
        return { title: 'AGENT LOGIN', typeId: 3, regPath: '/register_agent' };
    }
  };

  const roleConfig = getRoleConfig();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ UserName: userName, Password: password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.Msg || 'Login failed. Please check your credentials.');
        setLoading(false);
        return;
      }

      // Check role mapping validation
      const userTypeId = data.UserTypeID;
      if (userTypeId !== roleConfig.typeId) {
        setError(`Unauthorized. This login form is configured only for ${roleConfig.title}.`);
        setLoading(false);
        return;
      }

      // Redirect appropriately
      if (userTypeId === 1 || userTypeId === 2) {
        router.push('/dashboard');
      } else if (userTypeId === 3) {
        router.push('/agent_dashboard');
      } else if (userTypeId === 4) {
        router.push('/adv_dashboard');
      } else {
        setError('Unauthorized user role.');
      }
    } catch (err) {
      console.error(err);
      setError('Cannot connect to the authentication server. Ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* 2. Login Center Box - Modern Glassmorphism */}
      <section className="py-20 flex flex-col items-center justify-center min-h-[550px] z-10 relative">
        <h2 className="text-3xl font-extrabold text-white tracking-wide mb-8 uppercase text-center drop-shadow">
          {roleConfig.title}
        </h2>

        {/* Premium Glass Panel Form container */}
        <div className="w-full max-w-md bg-slate-900/40 border border-slate-800/80 rounded-2xl p-8 shadow-2xl text-white backdrop-blur-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full translate-x-8 -translate-y-8" />

          {/* Role Switcher Tabs */}
          <div className="flex p-1 bg-slate-950/80 border border-slate-800/50 rounded-xl mb-6 flex-wrap gap-1 sm:flex-nowrap">
            <button
              type="button"
              onClick={() => router.push('/login?role=agent')}
              className={`flex-1 py-2.5 text-[10px] sm:text-xs font-bold rounded-lg transition-all cursor-pointer ${
                roleParam.toLowerCase() === 'agent'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              AGENT
            </button>
            <button
              type="button"
              onClick={() => router.push('/login?role=advocate')}
              className={`flex-1 py-2.5 text-[10px] sm:text-xs font-bold rounded-lg transition-all cursor-pointer ${
                (roleParam.toLowerCase() === 'advocate' || roleParam.toLowerCase() === 'adv')
                  ? 'bg-red-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ADVOCATE
            </button>
            <button
              type="button"
              onClick={() => router.push('/login?role=staff')}
              className={`flex-1 py-2.5 text-[10px] sm:text-xs font-bold rounded-lg transition-all cursor-pointer ${
                roleParam.toLowerCase() === 'staff'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              STAFF
            </button>
            <button
              type="button"
              onClick={() => router.push('/login?role=admin')}
              className={`flex-1 py-2.5 text-[10px] sm:text-xs font-bold rounded-lg transition-all cursor-pointer ${
                roleParam.toLowerCase() === 'admin'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ADMIN
            </button>
          </div>

          {verifying && (
            <div className="mb-6 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs flex items-center gap-2">
              <Loader size={14} className="animate-spin shrink-0" />
              <span>Verifying email token...</span>
            </div>
          )}

          {verificationMessage && (
            <div className={`mb-6 p-4 rounded-lg text-xs flex items-start gap-2.5 ${
              verificationSuccess 
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
                : 'bg-red-500/10 border border-red-500/20 text-red-400'
            }`}>
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{verificationMessage}</span>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2.5">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            {/* Username / Email field */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                <User size={16} />
              </span>
              <input
                type="text"
                className="w-full pl-10 pr-4 py-3.5 bg-slate-950/60 border border-slate-800 hover:border-slate-700 focus:border-red-500 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500/15 transition-all text-xs"
                placeholder="Enter Username or Email"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                required
              />
            </div>

            {/* Password field */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                <Lock size={16} />
              </span>
              <input
                type="password"
                className="w-full pl-10 pr-4 py-3.5 bg-slate-950/60 border border-slate-800 hover:border-slate-700 focus:border-red-500 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500/15 transition-all text-xs"
                placeholder="Enter Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {/* Links Block */}
            <div className="flex items-center justify-between text-[11px] text-red-400 font-bold tracking-wider pt-2">
              {(roleParam.toLowerCase() === 'agent' || roleParam.toLowerCase() === 'advocate') ? (
                <Link href={roleConfig.regPath} className="hover:text-red-300 transition-colors">Register Here</Link>
              ) : (
                <div />
              )}
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => alert('Please contact administrator to reset password.')} className="hover:text-red-300 transition-colors">Forgot Password?</button>
                <button type="button" onClick={() => alert('Please contact administrator to find username.')} className="hover:text-red-300 transition-colors">Forgot Username?</button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-center pt-2">
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold tracking-wider rounded-lg text-xs shadow-lg shadow-red-950/20 transition-all active:scale-98 min-w-[120px] flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader size={14} className="animate-spin" />
                    <span>LOGGING IN...</span>
                  </>
                ) : (
                  <span>LOGIN</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col justify-between selection:bg-red-500/30 selection:text-white">
      {/* Background Ambient Glows */}
      <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-red-600/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-purple-600/5 blur-[120px] pointer-events-none" />

      {/* Header */}
      <Header activePage="login" />

      {/* Suspensed Form Wrapper */}
      <Suspense fallback={
        <div className="flex-1 flex items-center justify-center bg-slate-950 py-20">
          <Loader className="animate-spin text-red-500" size={36} />
        </div>
      }>
        <LoginForm />
      </Suspense>

      {/* 5. Copyright Bar */}
      <section className="bg-slate-950 py-6 text-slate-600 border-t border-slate-900/20 text-xs">
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
