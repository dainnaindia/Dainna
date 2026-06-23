"use client";
import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  Banknote, FileSpreadsheet, FolderKanban, CheckSquare, 
  Loader2, BadgeAlert, AlertCircle, Mail, CheckCircle2
} from 'lucide-react';
import Link from 'next/link';

interface AgentStats {
  TotalSuccessTransaction: number;
  TotalAgentFailedTransactions: number;
  TotalTodaysCompleted: number;
  TotalCurrentMonthCompleted: number;
  TotalAgentProjectWithCity: number;
  TotalAgentCompletedDraft: number;
  TotalPreparedDrafts?: number;
}

export default function AgentDashboardPage() {
  const [stats, setStats] = useState<AgentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Email verification states
  const [emailVerified, setEmailVerified] = useState<number | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState('');
  const [emailStatusSuccess, setEmailStatusSuccess] = useState(false);

  useEffect(() => {
    // Fetch stats
    fetch('http://localhost:5000/api/stats/agent', { credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch stats');
        return res.json();
      })
      .then((data) => {
        setStats(data);
      })
      .catch((err) => {
        console.error(err);
        setError('Connection to server failed. Verify backend is running.');
        // Fallback mockup numbers for dev UI testing
        setStats({
          TotalSuccessTransaction: 8,
          TotalAgentFailedTransactions: 1,
          TotalTodaysCompleted: 5,
          TotalCurrentMonthCompleted: 45,
          TotalAgentProjectWithCity: 18,
          TotalAgentCompletedDraft: 120,
          TotalPreparedDrafts: 15
        });
      })
      .finally(() => {
        setLoading(false);
      });

    // Fetch user profile to check email verification status
    fetch('http://localhost:5000/api/users/profile', { credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch profile');
        return res.json();
      })
      .then((data) => {
        if (data.User) {
          setEmailVerified(data.User.emailVerified);
        }
      })
      .catch((err) => {
        console.error('Error fetching profile:', err);
      });
  }, []);

  const handleSendVerificationEmail = async () => {
    setSendingEmail(true);
    setEmailStatus('');
    try {
      const response = await fetch('http://localhost:5000/api/auth/send-verification-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      const data = await response.json();
      if (response.ok && data.Status === 100) {
        setEmailStatusSuccess(true);
        setEmailStatus('Send Mail Successfully.');
      } else {
        setEmailStatusSuccess(false);
        setEmailStatus(data.Msg || 'Send Mail Not Successfully.');
      }
    } catch (err) {
      console.error(err);
      setEmailStatusSuccess(false);
      setEmailStatus('Send Mail Not Successfully due to network issue.');
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <DashboardLayout role="agent">
      <div className="absolute top-10 right-10 w-[400px] h-[400px] rounded-full bg-blue-500/5 blur-[100px] pointer-events-none" />

      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white font-sans">Agent Operations Console</h2>
            <p className="text-slate-400 text-sm mt-1">Dainna Modern User Operations Panel</p>
          </div>

          {/* Email Verification Box in top-right area */}
          {emailVerified === 0 && (
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl shadow-lg flex flex-col gap-2 shrink-0 max-w-sm">
              <div className="text-red-400 text-xs font-semibold flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>Your Email Verification is Pending. Please Verify Your Email.</span>
              </div>
              <button
                onClick={handleSendVerificationEmail}
                disabled={sendingEmail}
                className="w-full h-8 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 text-white font-bold tracking-wider rounded text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                {sendingEmail ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Mail size={13} />
                )}
                <span>Send Email</span>
              </button>
            </div>
          )}
        </div>

        {emailStatus && (
          <div className={`p-4 rounded-xl border text-sm flex items-center gap-3 animate-fade-in ${
            emailStatusSuccess 
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
              : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}>
            {emailStatusSuccess ? (
              <CheckCircle2 size={18} className="shrink-0" />
            ) : (
              <AlertCircle size={18} className="shrink-0" />
            )}
            <span>{emailStatus}</span>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3 animate-fade-in">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="h-[40vh] flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="animate-spin text-blue-500" size={32} />
            <span>Loading agent metrics...</span>
          </div>
        ) : stats ? (
           <div className="space-y-6">
             {/* Row 1 */}
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
               {/* Card 1 */}
               <Link href="/view_all_invoice" className="bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl p-6 border border-slate-800 shadow-lg gradient-card-hover relative overflow-hidden block cursor-pointer hover:-translate-y-1 transition-all">
                 <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full translate-x-8 -translate-y-8 pointer-events-none" />
                 <span className="text-xs uppercase tracking-wider font-semibold text-white/80 block mb-2 font-sans">Today Success Transaction</span>
                 <span className="text-3xl font-extrabold text-white">{stats.TotalSuccessTransaction}</span>
               </Link>

               {/* Card 2 */}
               <Link href="/agent_failed_transaction" className="bg-gradient-to-br from-red-600 to-rose-600 rounded-xl p-6 border border-slate-800 shadow-lg gradient-card-hover relative overflow-hidden block cursor-pointer hover:-translate-y-1 transition-all">
                 <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full translate-x-8 -translate-y-8 pointer-events-none" />
                 <span className="text-xs uppercase tracking-wider font-semibold text-white/80 block mb-2 font-sans">Total Failed Transactions</span>
                 <span className="text-3xl font-extrabold text-white">{stats.TotalAgentFailedTransactions}</span>
               </Link>

               {/* Card 3 */}
               <Link href="/view_all_agent_completed_draft" className="bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl p-6 border border-slate-800 shadow-lg gradient-card-hover relative overflow-hidden block cursor-pointer hover:-translate-y-1 transition-all">
                 <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full translate-x-8 -translate-y-8 pointer-events-none" />
                 <span className="text-xs uppercase tracking-wider font-semibold text-white/80 block mb-2 font-sans">Today's Completed Draft</span>
                 <span className="text-3xl font-extrabold text-white">{stats.TotalTodaysCompleted}</span>
               </Link>

               {/* Card 4 */}
               <Link href="/view_all_agent_completed_draft" className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl p-6 border border-slate-800 shadow-lg gradient-card-hover relative overflow-hidden block cursor-pointer hover:-translate-y-1 transition-all">
                 <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full translate-x-8 -translate-y-8 pointer-events-none" />
                 <span className="text-xs uppercase tracking-wider font-semibold text-white/80 block mb-2 font-sans">Current Month Completed</span>
                 <span className="text-3xl font-extrabold text-white">{stats.TotalCurrentMonthCompleted}</span>
               </Link>
             </div>

             {/* Row 2 */}
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
               {/* Card 5 */}
               <Link href="/agent_rate_list" className="bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl p-6 border border-slate-800 shadow-lg gradient-card-hover relative overflow-hidden block cursor-pointer hover:-translate-y-1 transition-all">
                 <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full translate-x-8 -translate-y-8 pointer-events-none" />
                 <span className="text-xs uppercase tracking-wider font-semibold text-white/80 block mb-2 font-sans">Total Project With City</span>
                 <span className="text-3xl font-extrabold text-white">{stats.TotalAgentProjectWithCity}</span>
               </Link>

               {/* Card 6 */}
               <Link href="/view_all_agent_completed_draft" className="bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl p-6 border border-slate-800 shadow-lg gradient-card-hover relative overflow-hidden block cursor-pointer hover:-translate-y-1 transition-all">
                 <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full translate-x-8 -translate-y-8 pointer-events-none" />
                 <span className="text-xs uppercase tracking-wider font-semibold text-white/80 block mb-2 font-sans">Total Completed Draft</span>
                 <span className="text-3xl font-extrabold text-white">{stats.TotalAgentCompletedDraft}</span>
               </Link>
             </div>
           </div>
        ) : (
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl text-center text-slate-500">
            No statistics metrics available.
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
