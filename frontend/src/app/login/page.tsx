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

  // Forgot Password modal states
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotUsername, setForgotUsername] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMobile, setForgotMobile] = useState('');
  const [forgotStep, setForgotStep] = useState(1); // 1 = enter username, 2 = select method, 3 = enter OTP, 4 = complete success
  const [forgotMethod, setForgotMethod] = useState<'email' | 'sms' | null>(null);
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');

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
                <button type="button" onClick={() => setShowForgotModal(true)} className="hover:text-red-300 transition-colors">Forgot Password?</button>
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

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full overflow-hidden shadow-2xl relative">
            <div className="bg-red-600/10 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h4 className="font-bold text-white font-sans text-xs tracking-wide">PASSWORD RECOVERY</h4>
              <button
                type="button"
                onClick={() => {
                  setShowForgotModal(false);
                  setForgotStep(1);
                  setForgotUsername('');
                  setForgotOtp('');
                  setForgotError('');
                  setForgotSuccess('');
                }}
                className="text-slate-400 hover:text-white transition-colors text-sm font-bold focus:outline-none"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              {forgotError && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{forgotError}</span>
                </div>
              )}

              {forgotSuccess && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{forgotSuccess}</span>
                </div>
              )}

              {forgotStep === 1 && (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setForgotLoading(true);
                    setForgotError('');
                    try {
                      const response = await fetch('http://localhost:5000/api/auth/forgot-password', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ username: forgotUsername })
                      });
                      const data = await response.json();
                      if (response.ok) {
                        setForgotEmail(data.email);
                        setForgotMobile(data.mobile);
                        
                        if (!data.email) {
                          // No registered email. Go to Step 2 (SMS option).
                          setForgotStep(2);
                          setForgotError('No registered email found. Please use SMS verification.');
                        } else {
                          // Try sending Email OTP immediately
                          try {
                            const sendOtpResponse = await fetch('http://localhost:5000/api/auth/send-otp', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ username: forgotUsername, method: 'email' })
                            });
                            const sendOtpData = await sendOtpResponse.json();
                            if (sendOtpResponse.ok) {
                              setForgotMethod('email');
                              setForgotStep(3); // Advance to OTP verification
                            } else {
                              setForgotStep(2);
                              setForgotError(sendOtpData.Msg || 'Email OTP delivery failed. Try SMS.');
                            }
                          } catch (sendOtpErr) {
                            setForgotStep(2);
                            setForgotError('Email service failed. Try SMS.');
                          }
                        }
                      } else {
                        setForgotError(data.Msg || 'Failed to verify username.');
                      }
                    } catch (err) {
                      setForgotError('Connection to server failed.');
                    } finally {
                      setForgotLoading(false);
                    }
                  }}
                  className="space-y-4"
                >
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Please enter your registered Username to begin password recovery.
                  </p>
                  <div>
                    <input
                      type="text"
                      placeholder="Enter Username"
                      className="w-full px-3 py-2.5 bg-slate-950/80 border border-slate-800 rounded-lg text-slate-105 placeholder-slate-650 focus:outline-none focus:border-red-500 text-xs"
                      value={forgotUsername}
                      onChange={(e) => setForgotUsername(e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      {forgotLoading ? 'Verifying...' : 'Next'}
                    </button>
                  </div>
                </form>
              )}

              {forgotStep === 2 && (
                <div className="space-y-4">
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Email OTP delivery is unavailable. Click below to receive the 6-digit verification OTP via SMS.
                  </p>
                  <div className="grid grid-cols-1 gap-3">
                    <button
                      type="button"
                      disabled={forgotLoading}
                      onClick={async () => {
                        setForgotLoading(true);
                        setForgotError('');
                        try {
                          const response = await fetch('http://localhost:5000/api/auth/send-otp', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ username: forgotUsername, method: 'sms' })
                          });
                          const data = await response.json();
                          if (response.ok) {
                            setForgotMethod('sms');
                            setForgotStep(3);
                          } else {
                            setForgotError(data.Msg || 'Failed to send OTP.');
                          }
                        } catch (err) {
                          setForgotError('Connection to server failed.');
                        } finally {
                          setForgotLoading(false);
                        }
                      }}
                      className="w-full text-left p-3.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-lg hover:border-slate-700 transition-all flex flex-col gap-1.5 group cursor-pointer"
                    >
                      <span className="text-xs font-bold text-white group-hover:text-red-400 transition-colors">Receive OTP via Registered SMS</span>
                      <span className="text-[10px] text-slate-500">{forgotMobile || 'N/A'}</span>
                    </button>
                  </div>
                  <div className="flex justify-start pt-2">
                    <button
                      type="button"
                      onClick={() => setForgotStep(1)}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      Back
                    </button>
                  </div>
                </div>
              )}

              {forgotStep === 3 && (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setForgotLoading(true);
                    setForgotError('');
                    try {
                      const response = await fetch('http://localhost:5000/api/auth/verify-otp', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ username: forgotUsername, otp: forgotOtp })
                      });
                      const data = await response.json();
                      if (response.ok) {
                        setForgotSuccess(data.Msg || 'OTP verified successfully! A password reset link has been sent to your registered contact channel.');
                        setForgotStep(4);
                      } else {
                        setForgotError(data.Msg || 'Failed to verify OTP.');
                      }
                    } catch (err) {
                      setForgotError('Connection to server failed.');
                    } finally {
                      setForgotLoading(false);
                    }
                  }}
                  className="space-y-4"
                >
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Enter the 6-digit OTP sent to your registered {forgotMethod === 'email' ? `Email (${forgotEmail})` : `Mobile (${forgotMobile})`}.
                  </p>
                  <div>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="Enter 6-digit OTP"
                      className="w-full px-3 py-2.5 bg-slate-950/80 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-red-500 text-center tracking-widest font-bold text-base focus:ring-1 focus:ring-red-500/30"
                      value={forgotOtp}
                      onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ''))}
                      required
                    />
                  </div>

                  {forgotMethod === 'email' && forgotMobile && (
                    <div className="text-center pt-1">
                      <button
                        type="button"
                        disabled={forgotLoading}
                        onClick={async () => {
                          setForgotLoading(true);
                          setForgotError('');
                          setForgotSuccess('');
                          try {
                            const response = await fetch('http://localhost:5000/api/auth/send-otp', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ username: forgotUsername, method: 'sms' })
                            });
                            const data = await response.json();
                            if (response.ok) {
                              setForgotMethod('sms');
                              setForgotSuccess('OTP has been sent to SMS successfully.');
                            } else {
                              setForgotError(data.Msg || 'Failed to send OTP.');
                            }
                          } catch (err) {
                            setForgotError('Connection to server failed.');
                          } finally {
                            setForgotLoading(false);
                          }
                        }}
                        className="text-[10px] text-red-500 hover:text-red-400 hover:underline transition-colors focus:outline-none cursor-pointer"
                      >
                        Didn't receive the OTP? Send OTP via SMS to {forgotMobile}
                      </button>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-2">
                    <button
                      type="button"
                      onClick={() => setForgotStep(1)}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-705 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      {forgotLoading ? 'Verifying...' : 'Verify OTP'}
                    </button>
                  </div>
                </form>
              )}

              {forgotStep === 4 && (
                <div className="space-y-4 text-center">
                  <p className="text-slate-350 text-xs leading-relaxed">
                    A secure password reset link has been successfully sent to your registered contact channel (Email with SMS fallback).
                  </p>
                  <p className="text-[10px] text-red-400">
                    Note: The reset link will remain valid for exactly 15 minutes.
                  </p>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotModal(false);
                        setForgotStep(1);
                        setForgotUsername('');
                        setForgotOtp('');
                        setForgotError('');
                        setForgotSuccess('');
                      }}
                      className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
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
