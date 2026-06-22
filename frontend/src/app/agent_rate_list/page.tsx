"use client";

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Landmark, Search, Loader2 } from 'lucide-react';

interface Rate {
  chargeId: number;
  stateName: string;
  city: string;
  projectName: string;
  rate: number;
}

export default function AgentRateListPage() {
  const [rates, setRates] = useState<Rate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchRates = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('http://localhost:5000/api/billing/rates');
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

  return (
    <DashboardLayout role="agent">
      <div className="absolute top-10 right-10 w-[400px] h-[400px] rounded-full bg-blue-500/5 blur-[100px] pointer-events-none" />

      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <Landmark className="text-blue-500" size={32} />
            Project Rate Card
          </h2>
          <p className="text-slate-400 text-sm mt-1">Lookup dynamic prices and handling fees configure by administrators for your city limits</p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Filter bar */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl shadow-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input
              type="text"
              placeholder="Search by project name or city..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Rates Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
                <Loader2 className="animate-spin text-blue-500" size={32} />
                <span>Loading pricing sheet...</span>
              </div>
            ) : filteredRates.length === 0 ? (
              <div className="py-20 text-center text-slate-500 text-sm">
                No rates are configured for your city.
              </div>
            ) : (
              <table className="w-full border-collapse text-left text-sm text-slate-300">
                <thead className="bg-slate-950 text-slate-400 text-xs uppercase font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-4 px-6 text-center w-12">#</th>
                    <th className="py-4 px-6">State</th>
                    <th className="py-4 px-6">City</th>
                    <th className="py-4 px-6">Project Name</th>
                    <th className="py-4 px-6 text-right">Drafting Rate / SqMt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredRates.map((rate, idx) => (
                    <tr key={rate.chargeId} className="hover:bg-slate-950/40 transition-colors">
                      <td className="py-4 px-6 text-center font-medium text-slate-500">{idx + 1}</td>
                      <td className="py-4 px-6 font-semibold text-white">{rate.stateName}</td>
                      <td className="py-4 px-6">{rate.city}</td>
                      <td className="py-4 px-6 text-slate-400">{rate.projectName}</td>
                      <td className="py-4 px-6 text-right text-blue-400 font-bold text-lg">₹{rate.rate.toFixed(2)}</td>
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
