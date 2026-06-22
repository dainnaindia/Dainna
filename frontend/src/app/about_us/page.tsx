"use client";

import React from 'react';
import Image from 'next/image';
import { ArrowUp } from 'lucide-react';
import Header from '@/components/Header';

export default function AboutUsPage() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans relative overflow-hidden flex flex-col justify-between selection:bg-red-500/30 selection:text-white">
      {/* Background Glows */}
      <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-red-600/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-purple-600/5 blur-[120px] pointer-events-none" />

      {/* Header */}
      <Header activePage="about" />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-20 z-10 flex-1 flex flex-col justify-center">
        <div className="bottom40 mb-12 text-center md:text-left">
          <h1 className="text-4xl font-extrabold text-white tracking-wide uppercase">
            About <span className="text-red-500">Us</span>
          </h1>
          <div className="w-16 h-1 bg-red-600 mt-4 mx-auto md:mx-0 rounded-full" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          {/* Company Overview Details */}
          <div className="lg:col-span-7 space-y-6">
            <h2 className="text-2xl font-extrabold text-white tracking-wide uppercase">
              Company <span className="text-red-500">Overview</span>
            </h2>
            
            <div className="space-y-6 text-sm text-slate-400 leading-relaxed">
              <p className="font-semibold text-slate-200 italic border-l-4 border-red-500 pl-4">
                Dainna is committed to delivering state-of-the-art document automation solutions that empower businesses and legal professionals globally.
              </p>
              <p>
                Founded on the principles of speed, compliance, and user-centric design, our platform bridges the gap between real estate agents, legal authorities, and office administrators. We provide a single source of truth for all drafting and legal operations, ensuring error-free transactions.
              </p>
              <p>
                Through years of refinement, we have optimized our tools to support dynamic styling, instant coordination matching, and multi-layered security. Every template and workflow is designed to maximize output quality and protect sensitive agreement details. Our team is constantly pushing the boundaries of legal tech to bring you the best-in-class legal documentation ecosystem.
              </p>
            </div>
          </div>

          {/* Overlapping Property Grid Images */}
          <div className="lg:col-span-5 w-full flex justify-center relative">
            <div className="relative w-[300px] h-[300px]">
              <div className="absolute inset-0 bg-gradient-to-tr from-red-500/10 to-purple-500/10 rounded-2xl blur-xl" />
              <div className="absolute top-0 left-0 w-[70%] h-[70%] rounded-xl overflow-hidden shadow-2xl border border-slate-800 transition-all hover:scale-105 z-20">
                <Image 
                  src="/dainna_grid1.png" 
                  alt="Company Property" 
                  fill 
                  className="object-cover" 
                />
              </div>
              <div className="absolute bottom-0 right-0 w-[70%] h-[70%] rounded-xl overflow-hidden shadow-2xl border border-slate-800 transition-all hover:scale-105 z-20">
                <Image 
                  src="/dainna_grid2.png" 
                  alt="Company Office" 
                  fill 
                  className="object-cover" 
                />
              </div>
            </div>
          </div>
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
