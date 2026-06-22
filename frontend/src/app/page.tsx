"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Phone, MapPin, Mail, ChevronRight, ArrowUp, Shield, Activity, Users, FileText } from 'lucide-react';
import Header from '@/components/Header';

export default function LandingPage() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans relative overflow-hidden flex flex-col justify-between selection:bg-red-500/30 selection:text-white">
      {/* Premium Background Ambient Glows */}
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-red-600/10 blur-[130px] pointer-events-none" />
      <div className="absolute top-[30%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-600/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[10%] w-[600px] h-[600px] rounded-full bg-purple-600/10 blur-[140px] pointer-events-none" />

      {/* 1. Header / Navbar - Fixed Glassmorphism */}
      <Header activePage="home" />

      {/* 2. Hero Section - Sleek Grid */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-16 lg:py-24 z-10 grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
        {/* Left Column: Heading, Info, CTAs */}
        <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold tracking-wide">
            <Shield size={12} />
            <span>Next-Generation Legal Operations Portal</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-100 leading-[1.1]">
            We Complete <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-500 via-rose-400 to-purple-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.1)]">
              Your Dreams
            </span>
          </h1>

          <p className="text-slate-400 text-base sm:text-lg max-w-xl mx-auto lg:mx-0 leading-relaxed">
            Streamline your property agreements, legal drafts, and documentation workflow. Connect agents, advocates, and clients in one secure, automated platform designed for speed and precision.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
            <Link 
              href="/register_agent" 
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold tracking-wider rounded-lg text-xs shadow-lg shadow-red-950/20 transition-all text-center flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <span>REGISTER AS AN AGENT</span>
              <ChevronRight size={14} />
            </Link>
            <Link 
              href="/login" 
              className="w-full sm:w-auto px-8 py-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 hover:text-white font-bold tracking-wider rounded-lg text-xs transition-all text-center cursor-pointer active:scale-98"
            >
              PORTAL LOGIN
            </Link>
          </div>
        </div>

        {/* Right Column: Floating Premium Glass Overlapping Image Stack */}
        <div className="lg:col-span-5 w-full flex justify-center relative">
          <div className="relative w-[340px] h-[340px] sm:w-[380px] sm:h-[380px]">
            {/* Background glowing frame */}
            <div className="absolute inset-0 bg-gradient-to-tr from-red-500/20 to-purple-500/20 rounded-2xl blur-xl" />

            {/* Overlapping Image 1 (Skyscrapers) */}
            <div className="absolute top-0 right-0 w-[60%] h-[60%] rounded-xl overflow-hidden shadow-2xl border border-slate-800 transition-all hover:scale-105 z-20">
              <Image 
                src="/dainna_grid1.png" 
                alt="Skyscrapers" 
                fill 
                className="object-cover" 
              />
            </div>

            {/* Overlapping Image 2 (Lounge Room) */}
            <div className="absolute bottom-4 left-0 w-[55%] h-[55%] rounded-xl overflow-hidden shadow-2xl border border-slate-800 transition-all hover:scale-105 z-20">
              <Image 
                src="/dainna_grid2.png" 
                alt="Property Lounge" 
                fill 
                className="object-cover" 
              />
            </div>

            {/* Overlapping Image 3 (Residential House) */}
            <div className="absolute top-1/3 left-1/3 w-[50%] h-[50%] rounded-xl overflow-hidden shadow-2xl border border-slate-800/80 transition-all hover:scale-105 z-10 opacity-90">
              <Image 
                src="/dainna_grid3.png" 
                alt="Modern House" 
                fill 
                className="object-cover" 
              />
            </div>
          </div>
        </div>
      </main>

      {/* 3. Welcome / Info Copy Section */}
      <section id="about" className="py-20 bg-slate-950/40 border-t border-slate-900/60 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Text details & Quote block */}
            <div className="lg:col-span-7 space-y-6">
              <h2 className="text-3xl font-extrabold text-slate-100 tracking-wide uppercase">
                Welcome to <span className="text-red-500">Dainna</span>
              </h2>
              
              <div className="bg-slate-900/40 border-l-4 border-red-500 p-5 rounded-r-lg italic text-slate-300 text-sm leading-relaxed">
                "Our mission is to simplify legal documentation, reducing processing times from days to minutes while ensuring full compliance and absolute security."
              </div>

              <div className="space-y-4 text-xs sm:text-sm text-slate-400 leading-relaxed">
                <p>
                  Dainna is a comprehensive legal operations and agreement drafting platform. We empower real estate agents, legal advocates, and corporate partners to collaborate seamlessly. Our intuitive tools allow you to draft, review, and finalize agreements with unmatched efficiency.
                </p>
                <p>
                  By integrating smart validation workflows and digital verification, we eliminate traditional bottlenecks. Whether you are an agent generating drafts on the go, or an advocate reviewing files from your dedicated console, Dainna provides the speed, reliability, and security you need.
                </p>
              </div>

              <Link 
                href="/about_us"
                className="inline-block px-6 py-3.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold tracking-wider rounded-lg text-xs transition-all shadow-md active:scale-98 select-none text-center"
              >
                READ MORE
              </Link>
            </div>

            {/* Portal Stats / Capabilities Panel */}
            <div className="lg:col-span-5 bg-slate-900/30 border border-slate-900/80 rounded-2xl p-8 shadow-2xl backdrop-blur-md relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full translate-x-8 -translate-y-8" />
              
              <h3 className="font-bold text-slate-100 text-base mb-6 flex items-center gap-2">
                <Activity size={18} className="text-red-500" />
                Portal Capabilities
              </h3>

              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="p-2.5 rounded-lg bg-red-500/10 text-red-400 shrink-0 h-fit">
                    <FileText size={18} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-100 text-xs">Automated Land & Building Drafting</h4>
                    <p className="text-slate-400 text-[11px] mt-1">Generate custom or ready-made drafts dynamically matching coordinates, survey details, and local codes.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-400 shrink-0 h-fit">
                    <Shield size={18} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-100 text-xs">Advocate Verification Workflow</h4>
                    <p className="text-slate-400 text-[11px] mt-1">Directly route drafts to legal advocates for instant review, comment revisions, and validation.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400 shrink-0 h-fit">
                    <Users size={18} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-100 text-xs">Multi-Role User Control</h4>
                    <p className="text-slate-400 text-[11px] mt-1">Custom consoles optimized specifically for Admins, Office Staff, Agents, and Advocates.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Glowing Info Cards Section (Modernized Contacts Bar) */}
      <section className="py-12 bg-slate-950/20 border-t border-slate-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Phone */}
          <div className="bg-slate-900/20 hover:bg-slate-900/40 border border-slate-900 hover:border-red-500/30 p-6 rounded-xl transition-all duration-300 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
              <Phone size={20} />
            </div>
            <div>
              <h4 className="font-bold text-[10px] text-slate-500 uppercase tracking-widest">Phone Number</h4>
              <p className="font-bold text-slate-100 text-sm mt-0.5">+91 8788258385</p>
            </div>
          </div>

          {/* Card 2: Address */}
          <div className="bg-slate-900/20 hover:bg-slate-900/40 border border-slate-900 hover:border-red-500/30 p-6 rounded-xl transition-all duration-300 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
              <MapPin size={20} />
            </div>
            <div>
              <h4 className="font-bold text-[10px] text-slate-500 uppercase tracking-widest">Jai Ganesh Samraj</h4>
              <p className="font-bold text-slate-100 text-xs mt-0.5 leading-snug">opp. to SDH Hospital, spine road, moshi Pune</p>
            </div>
          </div>

          {/* Card 3: Email */}
          <div className="bg-slate-900/20 hover:bg-slate-900/40 border border-slate-900 hover:border-red-500/30 p-6 rounded-xl transition-all duration-300 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
              <Mail size={20} />
            </div>
            <div>
              <h4 className="font-bold text-[10px] text-slate-500 uppercase tracking-widest">Email Address</h4>
              <p className="font-bold text-slate-100 text-sm mt-0.5">dainna@gmail.com</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Footer (Dark Grey / Black background) */}
      <footer id="contact" className="bg-slate-950 border-t border-slate-900/80 text-slate-400 py-16 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Col 1: Logo & Socials */}
          <div className="space-y-6 text-xs lg:text-sm">
            <Link href="/" className="flex items-center gap-3 select-none w-fit">
              <Image 
                src="/logo.png" 
                alt="Dainna Logo" 
                width={40} 
                height={40} 
                className="object-contain h-10 w-auto opacity-90 transition-transform duration-300 hover:scale-105" 
              />
              <span className="font-extrabold text-lg tracking-wider text-slate-100">
                DAINNA<span className="text-red-500">.IN</span>
              </span>
            </Link>
            <p className="leading-relaxed text-slate-400">
              Jai Ganesh Samraj<br />
              opp. to SDH Hospital, spine road, moshi Pune
            </p>
            <div className="space-y-1 text-slate-500">
              <p>Phone: +91 8788258385</p>
              <p>Email: dainna@gmail.com</p>
              <p>Web: www.yourdomain.com</p>
            </div>
            {/* Social icons styled as subtle circles */}
            <div className="flex items-center gap-3 pt-2">
              <a href="#" className="w-8 h-8 rounded-full bg-slate-900 hover:bg-red-600/80 text-slate-300 hover:text-white flex items-center justify-center transition-all">
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M9 8H7v3h2v9h4v-9h3.6l.4-3H13V6c0-.5.5-1 1-1h3V1H13c-3 0-5 2-5 5v2z" /></svg>
              </a>
              <a href="#" className="w-8 h-8 rounded-full bg-slate-900 hover:bg-red-600/80 text-slate-300 hover:text-white flex items-center justify-center transition-all">
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" /></svg>
              </a>
              <a href="#" className="w-8 h-8 rounded-full bg-slate-900 hover:bg-red-600/80 text-slate-300 hover:text-white flex items-center justify-center transition-all">
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>
              </a>
              <a href="#" className="w-8 h-8 rounded-full bg-slate-900 hover:bg-red-600/80 text-slate-300 hover:text-white flex items-center justify-center transition-all">
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M23.498 6.163a3.003 3.003 0 00-2.11-2.11C19.518 3.545 12 3.545 12 3.545s-7.518 0-9.388.508a3.003 3.003 0 00-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 002.11 2.11c1.87.508 9.388.508 9.388.508s7.518 0 9.388-.508a3.003 3.003 0 002.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
              </a>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div className="space-y-6">
            <h3 className="font-bold text-sm tracking-widest text-slate-100 uppercase relative pb-2 border-b border-slate-900">
              QUICK LINKS
            </h3>
            <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs lg:text-sm">
              <Link href="/" className="hover:text-red-500 transition-colors flex items-center gap-1.5">› Home</Link>
              <Link href="/about_us" className="hover:text-red-500 transition-colors flex items-center gap-1.5">› About Us</Link>
              <Link href="/login?role=advocate" className="hover:text-red-500 transition-colors flex items-center gap-1.5">› Advocate Login</Link>
              <Link href="/login?role=agent" className="hover:text-red-500 transition-colors flex items-center gap-1.5">› Agent Login</Link>
              <Link href="/login?role=staff" className="hover:text-red-500 transition-colors flex items-center gap-1.5">› Staff Login</Link>
              <Link href="/login?role=admin" className="hover:text-red-500 transition-colors flex items-center gap-1.5">› Admin Login</Link>
              <Link href="/contact_us" className="hover:text-red-500 transition-colors flex items-center gap-1.5">› Contact Us</Link>
            </div>
          </div>

          {/* Col 3: Opening Hours */}
          <div className="space-y-6">
            <h3 className="font-bold text-sm tracking-widest text-slate-100 uppercase relative pb-2 border-b border-slate-900">
              OPENING HOURS
            </h3>
            <div className="space-y-3 text-xs lg:text-sm leading-relaxed">
              <div className="flex justify-between py-1 border-b border-slate-900/40">
                <span>MON-SAT :</span>
                <span className="text-slate-100 font-semibold">10.00 am - 07.00 pm</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-900/40">
                <span>SUN :</span>
                <span className="text-red-500 font-semibold">Closed</span>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* 6. Copyright Bar */}
      <section className="bg-slate-950 py-6 text-slate-600 border-t border-slate-900/20 text-xs z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <p>Copyright 2021 <span className="text-slate-100 font-semibold">DAINNA</span>. All Rights Reserved.</p>
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
