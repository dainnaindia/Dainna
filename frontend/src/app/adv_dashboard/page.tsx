"use client";

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Landmark, FileCheck, CheckCircle2, ShieldAlert, Award, Loader2, Users } from 'lucide-react';
import Link from 'next/link';

interface Stats {
  TotalAdvTodayTransactions: number;
  TotalAdvSuccessTransactions: number;
  TotalAdvFailedTransactions: number;
  TotalTodaysCompleted: number;
  TotalAgentWithCity: number;
  TotalCurrentMonthCompleted: number;
  TotalAdvCompletedTransactions: number;
}

export default function AdvocateDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:5000/api/stats/advocate')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch stats');
        return res.json();
      })
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        // Fallback mockup numbers for dev UI testing
        setStats({
          TotalAdvTodayTransactions: 4,
          TotalAdvSuccessTransactions: 3,
          TotalAdvFailedTransactions: 0,
          TotalTodaysCompleted: 3,
          TotalAgentWithCity: 12,
          TotalCurrentMonthCompleted: 48,
          TotalAdvCompletedTransactions: 154
        });
        setLoading(false);
      });
  }, []);

  return (
    <DashboardLayout role="advocate">
      <div className="absolute top-10 right-10 w-[400px] h-[400px] rounded-full bg-blue-500/5 blur-[100px] pointer-events-none" />

      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white font-sans">Dashboard</h2>
          <p className="text-slate-400 text-sm mt-1">Audit verification summaries and pending property document queues</p>
        </div>

        {loading ? (
          <div className="h-[40vh] flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="animate-spin text-blue-500" size={32} />
            <span>Loading advocate metrics...</span>
          </div>
        ) : stats ? (
          <div className="space-y-6">
            {/* Row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Card 1 */}
              <Link href="/adv_daily_transaction" className="bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl p-6 border border-slate-800 shadow-lg gradient-card-hover relative overflow-hidden block cursor-pointer hover:-translate-y-1 transition-all">
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full translate-x-8 -translate-y-8 pointer-events-none" />
                <span className="text-xs uppercase tracking-wider font-semibold text-white/80 block mb-2 font-sans">Received Transactions</span>
                <span className="text-3xl font-extrabold text-white">{stats.TotalAdvTodayTransactions}</span>
              </Link>

              {/* Card 2 */}
              <Link href="/adv_success_transaction" className="bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl p-6 border border-slate-800 shadow-lg gradient-card-hover relative overflow-hidden block cursor-pointer hover:-translate-y-1 transition-all">
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full translate-x-8 -translate-y-8 pointer-events-none" />
                <span className="text-xs uppercase tracking-wider font-semibold text-white/80 block mb-2 font-sans">Success Transaction</span>
                <span className="text-3xl font-extrabold text-white">{stats.TotalAdvSuccessTransactions}</span>
              </Link>

              {/* Card 3 */}
              <Link href="/adv_failed_transaction" className="bg-gradient-to-br from-red-600 to-rose-600 rounded-xl p-6 border border-slate-800 shadow-lg gradient-card-hover relative overflow-hidden block cursor-pointer hover:-translate-y-1 transition-all">
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full translate-x-8 -translate-y-8 pointer-events-none" />
                <span className="text-xs uppercase tracking-wider font-semibold text-white/80 block mb-2 font-sans">Total Failed Transactions</span>
                <span className="text-3xl font-extrabold text-white">{stats.TotalAdvFailedTransactions}</span>
              </Link>

              {/* Card 4 */}
              <Link href="/adv_completed_drafts" className="bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl p-6 border border-slate-800 shadow-lg gradient-card-hover relative overflow-hidden block cursor-pointer hover:-translate-y-1 transition-all">
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full translate-x-8 -translate-y-8 pointer-events-none" />
                <span className="text-xs uppercase tracking-wider font-semibold text-white/80 block mb-2 font-sans">Today's Completed</span>
                <span className="text-3xl font-extrabold text-white">{stats.TotalTodaysCompleted}</span>
              </Link>
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Spacer */}
              <div className="hidden lg:block" />

              {/* Card 5 */}
              <div className="bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl p-6 border border-slate-800 shadow-lg relative overflow-hidden block">
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full translate-x-8 -translate-y-8 pointer-events-none" />
                <span className="text-xs uppercase tracking-wider font-semibold text-white/80 block mb-2 font-sans">Total Agent With City</span>
                <span className="text-3xl font-extrabold text-white">{stats.TotalAgentWithCity}</span>
              </div>

              {/* Card 6 */}
              <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl p-6 border border-slate-800 shadow-lg relative overflow-hidden block">
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full translate-x-8 -translate-y-8 pointer-events-none" />
                <span className="text-xs uppercase tracking-wider font-semibold text-white/80 block mb-2 font-sans">Current Month Completed</span>
                <span className="text-3xl font-extrabold text-white">{stats.TotalCurrentMonthCompleted}</span>
              </div>

              {/* Card 7 */}
              <Link href="/adv_completed_drafts" className="bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl p-6 border border-slate-800 shadow-lg gradient-card-hover relative overflow-hidden block cursor-pointer hover:-translate-y-1 transition-all">
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full translate-x-8 -translate-y-8 pointer-events-none" />
                <span className="text-xs uppercase tracking-wider font-semibold text-white/80 block mb-2 font-sans">Total Completed Draft</span>
                <span className="text-3xl font-extrabold text-white">{stats.TotalAdvCompletedTransactions}</span>
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
