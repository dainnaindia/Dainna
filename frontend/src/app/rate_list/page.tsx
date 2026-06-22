"use client";

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Landmark, Search, Loader2, FileSpreadsheet, Printer } from 'lucide-react';

interface Rate {
  chargeId: number;
  stateName: string;
  city: string;
  projectName: string;
  rate: number;
}

export default function StaffRateListPage() {
  const [rates, setRates] = useState<Rate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchRates = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('http://localhost:5000/api/projects/rate-list');
      const data = await response.json();
      if (response.ok) {
        setRates(data.Rates || []);
      } else {
        setError(data.Msg || 'Failed to retrieve rates list.');
      }
    } catch (err) {
      console.error(err);
      setError('Cannot connect to API server. Ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
  }, []);

  const filteredRates = rates.filter(r => {
    const full = `${r.projectName} ${r.city} ${r.stateName}`.toLowerCase();
    return full.includes(searchTerm.toLowerCase());
  });

  const exportCSV = () => {
    const headers = ["#", "State", "City", "Project Name", "Rate per SqMt"];
    const rows = filteredRates.map((r, idx) => [
      idx + 1,
      r.stateName || '',
      r.city || '',
      r.projectName || '',
      r.rate || 0
    ]);

    const csvContent = [headers.join(","), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8' });
    const encodedUri = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `staff_rates_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(encodedUri);
  };

  return (
    <DashboardLayout role="admin">
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          aside, header, button, .no-print, input {
            display: none !important;
          }
          main, .flex-1, .space-y-6 {
            padding: 0 !important;
            margin: 0 !important;
            background-color: transparent !important;
          }
        }
      `}} />

      <div className="absolute top-10 right-10 w-[400px] h-[400px] rounded-full bg-blue-500/5 blur-[100px] pointer-events-none" />

      <div className="space-y-6 animate-fadeIn">
        <div className="flex justify-between items-center no-print">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <Landmark className="text-blue-500" size={32} />
              Advocate Rate List
            </h2>
            <p className="text-slate-400 text-sm mt-1">Lookup dynamic price structures of advocates configured in your working city limits</p>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm no-print">
            {error}
          </div>
        )}

        {/* Filter bar */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl shadow-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input
              type="text"
              placeholder="Search by project name, city, state..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={exportCSV}
              className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-lg transition-all cursor-pointer"
              title="CSV / Excel"
            >
              <FileSpreadsheet size={16} />
            </button>
            <button 
              onClick={() => window.print()}
              className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-lg transition-all cursor-pointer"
              title="Print"
            >
              <Printer size={16} />
            </button>
          </div>
        </div>

        {/* Rates Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
                <Loader2 className="animate-spin text-blue-500" size={32} />
                <span>Loading advocate rates...</span>
              </div>
            ) : filteredRates.length === 0 ? (
              <div className="py-20 text-center text-slate-500 text-sm">
                No rates are configured for your city limits.
              </div>
            ) : (
              <table className="w-full border-collapse text-left text-sm text-slate-300">
                <thead className="bg-slate-950 text-slate-400 text-xs uppercase font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-4 px-6 text-center w-12">#</th>
                    <th className="py-4 px-6">State</th>
                    <th className="py-4 px-6">City</th>
                    <th className="py-4 px-6">Project Name</th>
                    <th className="py-4 px-6 text-right w-44">Rate per SqMt (Advocate)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredRates.map((r, idx) => (
                    <tr key={r.chargeId} className="hover:bg-slate-950/40 transition-colors">
                      <td className="py-4 px-6 text-center font-medium text-slate-500">{idx + 1}</td>
                      <td className="py-4 px-6 text-slate-350">{r.stateName}</td>
                      <td className="py-4 px-6 text-slate-350 font-semibold">{r.city}</td>
                      <td className="py-4 px-6 text-white font-bold">{r.projectName}</td>
                      <td className="py-4 px-6 text-right font-mono text-emerald-450 font-semibold text-base">₹{r.rate.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
