"use client";

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Lock, AlertCircle, CheckCircle2, Loader, ShieldAlert } from 'lucide-react';
import Header from '@/components/Header';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!token) {
      setError('Invalid or missing verification token. Please verify the link in your email/SMS.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword })
      });

      const data = await response.json();

      if (response.ok && data.Status === 100) {
        setSuccess(data.Msg || 'Password has been successfully reset! Redirecting to login...');
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else {
        setError(data.Msg || 'Failed to reset password. The link may have expired.');
      }
    } catch (err) {
      setError('Server connection error. Please make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 max-w-md w-full mx-auto mt-10 space-y-4 shadow-xl text-center select-none">
        <div className="flex justify-center text-red-500 mb-2">
          <ShieldAlert size={44} />
        </div>
        <h3 className="font-extrabold text-white text-lg tracking-wide">INVALID RESET LINK</h3>
        <p className="text-slate-400 text-xs leading-relaxed">
          The password reset token is missing or invalid. Please check your email or SMS for the correct link.
        </p>
        <div className="pt-2">
          <Link
            href="/login"
            className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg text-xs tracking-wider transition-colors inline-block"
          >
            RETURN TO LOGIN
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 max-w-md w-full mx-auto mt-10 space-y-6 shadow-xl relative overflow-hidden select-none">
      {/* Visual top bar glow */}
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-red-600 to-rose-600" />

      <div className="text-center space-y-2">
        <h3 className="font-extrabold text-white text-lg tracking-wider">RESET YOUR PASSWORD</h3>
        <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">Dainna Secure Portal</p>
      </div>

      {error && (
        <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2.5">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2.5">
          <CheckCircle2 size={16} className="shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">New Password</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
              <Lock size={14} />
            </span>
            <input
              type="password"
              placeholder="Enter at least 6 characters"
              className="w-full pl-9 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 focus:border-red-500 rounded-lg text-slate-100 placeholder-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-red-500/30 transition-all"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Confirm Password</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
              <Lock size={14} />
            </span>
            <input
              type="password"
              placeholder="Re-enter password to confirm"
              className="w-full pl-9 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 focus:border-red-500 rounded-lg text-slate-100 placeholder-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-red-500/30 transition-all"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>
        </div>

        <div className="pt-2 flex flex-col gap-3">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 disabled:opacity-50 text-white text-xs font-bold tracking-wider rounded-lg shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader size={14} className="animate-spin" />
                <span>SAVING CHANGES...</span>
              </>
            ) : (
              <span>RESET PASSWORD</span>
            )}
          </button>

          <Link
            href="/login"
            className="w-full text-center py-2.5 border border-slate-800 hover:border-slate-700 hover:bg-slate-850 rounded-lg text-[10px] font-bold text-slate-400 hover:text-white transition-all tracking-wider"
          >
            CANCEL & LOGIN
          </Link>
        </div>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col justify-between selection:bg-red-500/30 selection:text-white relative">
      {/* Background Ambient Glows */}
      <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-red-600/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-purple-600/5 blur-[120px] pointer-events-none" />

      {/* Header */}
      <Header activePage="login" />

      {/* Form wrapper with Suspense boundary */}
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-950">
        <Suspense fallback={
          <div className="flex items-center justify-center py-20">
            <Loader className="animate-spin text-red-500" size={32} />
          </div>
        }>
          <ResetPasswordForm />
        </Suspense>
      </div>

      {/* Copyright Bar */}
      <section className="bg-slate-950 py-6 text-slate-600 border-t border-slate-900/20 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <p>Copyright 2021 <span className="text-white font-semibold">DAINNA</span>. All Rights Reserved.</p>
        </div>
      </section>
    </div>
  );
}
