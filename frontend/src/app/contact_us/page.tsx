"use client";

import React, { useState } from 'react';
import { Phone, MapPin, Mail, Clock, ArrowUp, Send, CheckCircle } from 'lucide-react';
import Header from '@/components/Header';

export default function ContactUsPage() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    setSubmitted(false);

    try {
      const response = await fetch('http://localhost:5000/api/contacts/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, phone, email, message })
      });

      const data = await response.json();
      if (response.ok && data.Status === 100) {
        setSubmitted(true);
        setName('');
        setPhone('');
        setEmail('');
        setMessage('');
        setTimeout(() => {
          setSubmitted(false);
        }, 5000);
      } else {
        setErrorMsg(data.Msg || data.Error || 'Failed to send message.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Could not connect to the server. Please try again later.');
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
      <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-red-600/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-purple-600/5 blur-[120px] pointer-events-none" />

      {/* Header */}
      <Header activePage="contact" />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-20 z-10 flex-1 flex flex-col justify-center">
        <div className="bottom40 mb-12 text-center md:text-left">
          <h1 className="text-4xl font-extrabold text-white tracking-wide uppercase">
            Contact <span className="text-red-500">Us</span>
          </h1>
          <div className="w-16 h-1 bg-red-600 mt-4 mx-auto md:mx-0 rounded-full" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          {/* Left Column: Get In Touch Info */}
          <div className="lg:col-span-5 space-y-8">
            <div className="space-y-4">
              <h2 className="text-2xl font-extrabold text-white tracking-wide uppercase">
                Get In <span className="text-red-500">Touch</span>
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                Have questions or need assistance with your land or building agreement drafts? Reach out to us through any of the channels below or send us a direct message.
              </p>
            </div>

            <div className="space-y-6">
              {/* Phone */}
              <div className="flex items-center gap-4 bg-slate-900/30 border border-slate-900 p-5 rounded-xl hover:border-red-500/25 transition-all">
                <div className="w-10 h-10 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
                  <Phone size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-[10px] text-slate-500 uppercase tracking-widest">Phone Number</h4>
                  <p className="font-bold text-white text-sm mt-0.5">+91 8788258385</p>
                </div>
              </div>

              {/* Address */}
              <div className="flex items-center gap-4 bg-slate-900/30 border border-slate-900 p-5 rounded-xl hover:border-red-500/25 transition-all">
                <div className="w-10 h-10 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
                  <MapPin size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-[10px] text-slate-500 uppercase tracking-widest">Jai Ganesh Samraj</h4>
                  <p className="font-bold text-white text-xs mt-0.5 leading-snug">opp. to SDH Hospital, spine road, moshi Pune</p>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-center gap-4 bg-slate-900/30 border border-slate-900 p-5 rounded-xl hover:border-red-500/25 transition-all">
                <div className="w-10 h-10 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
                  <Mail size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-[10px] text-slate-500 uppercase tracking-widest">Email Address</h4>
                  <p className="font-bold text-white text-sm mt-0.5">dainna@gmail.com</p>
                </div>
              </div>

              {/* Opening Hours */}
              <div className="flex items-center gap-4 bg-slate-900/30 border border-slate-900 p-5 rounded-xl hover:border-red-500/25 transition-all">
                <div className="w-10 h-10 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
                  <Clock size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-[10px] text-slate-500 uppercase tracking-widest">Office Hours</h4>
                  <p className="font-bold text-white text-xs mt-0.5 leading-snug">MON-SAT: 10:00 AM - 07:00 PM (SUN Closed)</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Send Message Form */}
          <div className="lg:col-span-7 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-8 shadow-2xl backdrop-blur-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full translate-x-8 -translate-y-8" />

            <h3 className="font-extrabold text-white text-lg mb-6 uppercase tracking-wide">
              Send us <span className="text-red-500">a message</span>
            </h3>

            {submitted && (
              <div className="mb-6 p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-xs flex items-center gap-2.5 animate-fadeIn">
                <CheckCircle size={16} className="shrink-0" />
                <span>Thank you! Your message has been sent successfully. We will get back to you shortly.</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name field */}
              <div>
                <input
                  type="text"
                  className="w-full px-4 py-3.5 bg-slate-950/60 border border-slate-800 hover:border-slate-700 focus:border-red-500 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500/15 transition-all text-xs"
                  placeholder="Your Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              {/* Phone field */}
              <div>
                <input
                  type="text"
                  className="w-full px-4 py-3.5 bg-slate-950/60 border border-slate-800 hover:border-slate-700 focus:border-red-500 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500/15 transition-all text-xs"
                  placeholder="Your Phone Number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>

              {/* Email field */}
              <div>
                <input
                  type="email"
                  className="w-full px-4 py-3.5 bg-slate-950/60 border border-slate-800 hover:border-slate-700 focus:border-red-500 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500/15 transition-all text-xs"
                  placeholder="Your Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {/* Message field */}
              <div>
                <textarea
                  rows={5}
                  className="w-full px-4 py-3.5 bg-slate-950/60 border border-slate-800 hover:border-slate-700 focus:border-red-500 rounded-lg text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500/15 transition-all text-xs resize-none"
                  placeholder="Write your message here..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-8 py-3.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold tracking-wider rounded-lg text-xs shadow-lg shadow-red-950/20 transition-all active:scale-98 flex items-center gap-2 cursor-pointer"
                >
                  <span>SEND MESSAGE</span>
                  <Send size={12} />
                </button>
              </div>
            </form>
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
