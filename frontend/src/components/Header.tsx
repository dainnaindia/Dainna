"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Sun, Moon, Menu, X } from 'lucide-react';

interface HeaderProps {
  activePage: 'home' | 'about' | 'login' | 'contact' | 'none';
}

export default function Header({ activePage }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Read current theme on mount
    const isLight = document.documentElement.classList.contains('light');
    setTheme(isLight ? 'light' : 'dark');

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleTheme = () => {
    if (theme === 'dark') {
      document.documentElement.classList.add('light');
      localStorage.setItem('theme', 'light');
      setTheme('light');
    } else {
      document.documentElement.classList.remove('light');
      localStorage.setItem('theme', 'dark');
      setTheme('dark');
    }
  };

  const getLinkClass = (page: 'home' | 'about' | 'login' | 'contact') => {
    const baseClass = "text-xs font-bold tracking-wider transition-colors relative block py-2 md:py-0";
    if (activePage === page) {
      return `${baseClass} text-red-500 hover:text-red-400 md:after:absolute md:after:bottom-[-6px] md:after:left-0 md:after:w-full md:after:h-0.5 md:after:bg-red-500`;
    }
    return `${baseClass} text-slate-400 hover:text-slate-100`;
  };

  return (
    <>
      <header className={`bg-slate-950/80 border-b border-slate-900/60 backdrop-blur-md fixed top-0 left-0 w-full z-50 transition-all duration-300 ${scrolled ? 'shadow-lg border-slate-900/90 py-1' : 'py-0'}`}>
        <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between transition-all duration-300 ${scrolled ? 'h-14' : 'h-20'}`}>
          <Link href="/" className="flex items-center gap-3 select-none">
            <Image 
              src="/logo.png" 
              alt="Dainna Logo" 
              width={48} 
              height={48} 
              className={`object-contain transition-all duration-300 hover:scale-105 ${scrolled ? 'h-9 w-auto' : 'h-12 w-auto'}`} 
            />
            <span className="font-extrabold text-xl tracking-wider text-slate-100">
              DAINNA<span className="text-red-500">.IN</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/" className={getLinkClass('home')}>HOME</Link>
            <Link href="/about_us" className={getLinkClass('about')}>ABOUT US</Link>
            <Link href="/login" className={getLinkClass('login')}>PORTAL LOGIN</Link>
            <Link href="/contact_us" className={getLinkClass('contact')}>CONTACT US</Link>
            <button
              onClick={toggleTheme}
              className="w-8 h-8 rounded-lg bg-slate-900/60 border border-slate-800 hover:border-slate-700/60 flex items-center justify-center text-slate-400 hover:text-slate-100 transition-all cursor-pointer shadow-sm select-none focus:outline-none"
              title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          </nav>

          {/* Mobile Right Bar */}
          <div className="flex items-center gap-3 md:hidden">
            <button
              onClick={toggleTheme}
              className="w-8 h-8 rounded-lg bg-slate-900/60 border border-slate-800 hover:border-slate-700/60 flex items-center justify-center text-slate-400 hover:text-slate-100 transition-all cursor-pointer shadow-sm select-none focus:outline-none"
              title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-8 h-8 rounded-lg bg-slate-900/60 border border-slate-800 hover:border-slate-700/60 flex items-center justify-center text-slate-400 hover:text-slate-100 transition-all cursor-pointer focus:outline-none"
              title="Toggle Menu"
            >
              {mobileMenuOpen ? <X size={15} /> : <Menu size={15} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <nav className="md:hidden bg-slate-950/95 border-b border-slate-900/80 backdrop-blur-lg py-4 px-6 flex flex-col gap-2 animate-fadeIn">
            <Link href="/" className={getLinkClass('home')} onClick={() => setMobileMenuOpen(false)}>HOME</Link>
            <Link href="/about_us" className={getLinkClass('about')} onClick={() => setMobileMenuOpen(false)}>ABOUT US</Link>
            <Link href="/login" className={getLinkClass('login')} onClick={() => setMobileMenuOpen(false)}>PORTAL LOGIN</Link>
            <Link href="/contact_us" className={getLinkClass('contact')} onClick={() => setMobileMenuOpen(false)}>CONTACT US</Link>
          </nav>
        )}
      </header>
      <div className={`w-full shrink-0 animate-none transition-all duration-300 ${scrolled ? 'h-14' : 'h-20'}`} />
    </>
  );
}
