"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  Cloud, LogOut, Gauge, Home, Banknote, List, PlusCircle,
  MessageSquare, HelpCircle, Bell, ChevronsLeft, ChevronsRight,
  ChevronDown, User, Settings, Loader2, Check, Landmark, FileText,
  Send, CheckCircle2, XCircle, Trash2, Receipt, FileCheck, Tag,
  Layers, History, BarChart3, UserCheck, Users, Sliders, Sun, Moon
} from 'lucide-react';

interface SidebarSubLink {
  label: string;
  href?: string;
  subLinks?: SidebarSubLink[];
}

interface SidebarCategory {
  label: string;
  icon: React.ReactNode;
  href?: string; // For direct links
  subLinks?: SidebarSubLink[];
}

// Complete Admin categories list matching legacy PHP admin_menu.php literally
const adminCategories: SidebarCategory[] = [
  { label: 'Dashboard', href: '/dashboard', icon: <Gauge size={16} /> },
  { 
    label: 'Agent', 
    icon: <Users size={16} />, 
    subLinks: [
      { label: 'Registered Agent', href: '/reg_agent' },
      { 
        label: 'Registered Property',
        subLinks: [
          { label: 'Registered Land', href: '/reg_land' },
          { label: 'Registered Building', href: '/reg_building' }
        ]
      }
    ]
  },
  { 
    label: 'Transactions', 
    icon: <Banknote size={16} />, 
    subLinks: [
      { label: 'Daily Transaction', href: '/daily_transaction' },
      { label: 'Success Transaction', href: '/success_transaction' },
      { label: 'Failed Transaction', href: '/failed_transaction' },
      { label: 'Removed Transaction', href: '/removed_transaction' },
      { label: 'Transaction History', href: '/trans_history_agent' },
      { label: 'Handling Charge', href: '/handling_charge_report_agent' },
      { label: 'Similar Property', href: '/similar_property' }
    ]
  },
  { 
    label: 'Advocate', 
    icon: <UserCheck size={16} />, 
    subLinks: [
      { label: 'Registered Advocate', href: '/reg_advocate' }
    ]
  },
  { 
    label: 'Transactions ', // Small space to distinguish label visually in DOM
    icon: <Banknote size={16} />, 
    subLinks: [
      { label: 'Send To Advocate', href: '/send_to_adv_draft' },
      { label: 'Success Transaction', href: '/success_transaction_adv' },
      { label: 'Failed Transaction', href: '/failed_transaction_adv' },
      { label: 'Transaction History', href: '/trans_history_adv' }
    ]
  },
  { 
    label: 'Drafts', 
    icon: <FileText size={16} />, 
    subLinks: [
      { label: 'All Drafts', href: '/view_all_drafts' },
      { label: 'Completed Drafts', href: '/view_all_completed_drafts' }
    ]
  },
  { 
    label: 'Admin Process', 
    icon: <Sliders size={16} />, 
    subLinks: [
      { label: 'Project', href: '/project' },
      { label: 'Registration Link', href: '/reg_link' },
      { label: 'Handling Charges', href: '/handling_charges' },
      { label: 'State', href: '/state' },
      { label: 'Search Drafts', href: '/search_drafts' }
    ]
  },
  { 
    label: 'Staff', 
    icon: <PlusCircle size={16} />, 
    subLinks: [
      { label: 'Add New Staff', href: '/add_staff' },
      { label: 'View All Staff', href: '/view_all_staff' }
    ]
  },
  { label: 'Message', href: '/message', icon: <MessageSquare size={16} /> },
  { 
    label: 'Reports', 
    icon: <FileSpreadsheetIcon size={16} />, 
    subLinks: [
      { label: 'Project Wise Summary', href: '/project_wise_summary' },
      { label: 'Agent Wise Summary', href: '/agent_wise_summary' },
      { label: 'Area Wise Work Report', href: '/area_wise_work_report' },
      { label: 'Agent Wise Work Report', href: '/admin_agent_work_report' },
      { label: 'Adv Wise Work Report', href: '/admin_adv_work_report' },
      { label: 'Payment Statement', href: '/payment_statement' }
    ]
  }
];

const agentCategories: SidebarCategory[] = [
  { label: 'Dashboard', href: '/agent_dashboard', icon: <Gauge size={16} /> },
  { 
    label: 'Open Land/Building', 
    icon: <Home size={16} />, 
    subLinks: [
      { label: 'Add Open Land', href: '/add_ol' },
      { label: 'Add Open Building', href: '/add_ob' },
      { label: 'View Land/Buildings', href: '/view_all_olb' }
    ]
  },
  { label: 'Prepared Draft', href: '/view_all_prepared_draft', icon: <FileText size={16} /> },
  { label: 'Sent Draft', href: '/view_all_sent_draft', icon: <Send size={16} /> },
  { label: 'Success Transaction', href: '/view_all_invoice', icon: <CheckCircle2 size={16} /> },
  { label: 'Failed Transaction', href: '/agent_failed_transaction', icon: <XCircle size={16} /> },
  { label: 'Removed Transaction', href: '/agent_removed_transaction', icon: <Trash2 size={16} /> },
  { label: 'Invoice', href: '/view_all_invoice2', icon: <Receipt size={16} /> },
  { label: 'Completed Draft', href: '/view_all_agent_completed_draft', icon: <FileCheck size={16} /> },
  { label: 'Rate List', href: '/agent_rate_list', icon: <Tag size={16} /> },
  { label: 'Similar Property', href: '/agent_similar_property', icon: <Layers size={16} /> },
  { label: 'Transaction History', href: '/agent_trans_history', icon: <History size={16} /> },
  { label: 'Work Report', href: '/agent_work_report', icon: <BarChart3 size={16} /> },
  { label: 'Message', href: '/agent_message', icon: <MessageSquare size={16} /> }
];

const advocateCategories: SidebarCategory[] = [
  { label: 'Dashboard', href: '/adv_dashboard', icon: <Gauge size={16} /> },
  { label: 'Daily Transaction', href: '/adv_daily_transaction', icon: <Banknote size={16} /> },
  { label: 'Success Transaction', href: '/adv_success_transaction', icon: <CheckCircle2 size={16} /> },
  { label: 'Failed Transaction', href: '/adv_failed_transaction', icon: <XCircle size={16} /> },
  { label: 'Completed Drafts', href: '/adv_completed_drafts', icon: <FileCheck size={16} /> },
  { label: 'Bank Detail', href: '/adv_bank_detail', icon: <Landmark size={16} /> },
  { label: 'Transaction History', href: '/adv_trans_history', icon: <History size={16} /> },
  { label: 'Agent Work Report', href: '/adv_agent_work_report', icon: <BarChart3 size={16} /> },
  { label: 'Message', href: '/adv_message', icon: <MessageSquare size={16} /> }
];

const staffCategories: SidebarCategory[] = [
  { label: 'Dashboard', href: '/dashboard', icon: <Gauge size={16} /> },
  { label: 'Daily Transaction', href: '/daily_transaction', icon: <Banknote size={16} /> },
  { 
    label: 'Advocate', 
    icon: <UserCheck size={16} />, 
    subLinks: [
      { label: 'Registered Advocate', href: '/reg_advocate' },
      { label: 'Bank Detail Of Project', href: '/staff_bank_detail' },
      { label: 'Rate List', href: '/rate_list' }
    ]
  },
  { 
    label: 'Agent', 
    icon: <Users size={16} />, 
    subLinks: [
      { label: 'Registered Agent', href: '/reg_agent' },
      { 
        label: 'Registered Property',
        subLinks: [
          { label: 'Registered Land', href: '/reg_land' },
          { label: 'Registered Building', href: '/reg_building' }
        ]
      }
    ]
  },
  { 
    label: 'Drafts', 
    icon: <FileText size={16} />, 
    subLinks: [
      { label: 'All Drafts', href: '/view_all_drafts' },
      { label: 'Send To Advocate', href: '/send_to_adv_draft' },
      { label: 'Completed Drafts', href: '/view_all_completed_drafts' }
    ]
  }
];

export default function DashboardLayout({ children, role }: { children: React.ReactNode; role: 'admin' | 'agent' | 'advocate' }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [expandedSubCategory, setExpandedSubCategory] = useState<string | null>(null);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  const fetchSession = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/auth/session', { credentials: 'include' });
      const data = await res.json();
      if (res.ok && data.Status === 100) {
        setCurrentUser(data.User);
      }
    } catch (err) {
      console.error('Session fetch failed', err);
    }
  };

  // Notifications and counts states
  const [counts, setCounts] = useState({
    agentNotifications: 0,
    advocateNotifications: 0,
    agentChats: 0,
    agentHelps: 0,
    advocateChats: 0,
    advocateHelps: 0,
    chats: 0,
    notifications: 0
  });

  const [notifModalOpen, setNotifModalOpen] = useState(false);
  const [notifModalType, setNotifModalType] = useState<'agent' | 'advocate' | 'user'>('user');
  const [notifList, setNotifList] = useState<any[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [selectedNotifIds, setSelectedNotifIds] = useState<number[]>([]);

  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const [supportType, setSupportType] = useState('1');
  const [helpMessage, setHelpMessage] = useState('');
  const [helpSubmitting, setHelpSubmitting] = useState(false);
  const [helpSuccess, setHelpSuccess] = useState('');
  const [helpError, setHelpError] = useState('');

  const fetchCounts = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/notifications/unread-counts', { credentials: 'include' });
      const data = await res.json();
      if (res.ok && data.Status === 100) {
        if (role === 'admin') {
          setCounts({
            agentNotifications: data.AgentNotificationsCount || 0,
            advocateNotifications: data.AdvocateNotificationsCount || 0,
            agentChats: data.AgentChatsCount || 0,
            agentHelps: data.AgentHelpsCount || 0,
            advocateChats: data.AdvocateChatsCount || 0,
            advocateHelps: data.AdvocateHelpsCount || 0,
            chats: 0,
            notifications: 0
          });
        } else {
          setCounts({
            agentNotifications: 0,
            advocateNotifications: 0,
            agentChats: 0,
            agentHelps: 0,
            advocateChats: 0,
            advocateHelps: 0,
            chats: data.ChatsCount || 0,
            notifications: data.NotificationsCount || 0
          });
        }
      }
    } catch (err) {
      console.error('Failed to fetch unread counts', err);
    }
  };

  const openNotificationsModal = async (type: 'agent' | 'advocate' | 'user') => {
    setNotifModalType(type);
    setNotifModalOpen(true);
    setNotifLoading(true);
    setSelectedNotifIds([]);
    try {
      const url = `http://localhost:5000/api/notifications${role === 'admin' ? `?type=${type}` : ''}`;
      const res = await fetch(url, { credentials: 'include' });
      const data = await res.json();
      if (res.ok && data.Status === 100) {
        setNotifList(data.Notifications || []);
      }
    } catch (err) {
      console.error('Failed to fetch notifications list', err);
    } finally {
      setNotifLoading(false);
    }
  };

  const handleMarkAsRead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedNotifIds.length === 0) return;

    try {
      const res = await fetch('http://localhost:5000/api/notifications/mark-read', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds: selectedNotifIds })
      });
      if (res.ok) {
        fetchCounts();
        setNotifModalOpen(false);
      }
    } catch (err) {
      console.error('Failed to mark notifications read', err);
    }
  };

  const handleToggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedNotifIds(notifList.map(n => n.notificationId));
    } else {
      setSelectedNotifIds([]);
    }
  };

  const handleToggleSelectOne = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedNotifIds([...selectedNotifIds, id]);
    } else {
      setSelectedNotifIds(selectedNotifIds.filter(x => x !== id));
    }
  };

  const handleSubmitHelp = async (e: React.FormEvent) => {
    e.preventDefault();
    setHelpSubmitting(true);
    setHelpSuccess('');
    setHelpError('');

    try {
      const res = await fetch('http://localhost:5000/api/notifications/send-help', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ SupportType: parseInt(supportType), Message: helpMessage })
      });
      const data = await res.json();
      if (res.ok && data.Status === 2) {
        setHelpSuccess('Support ticket created successfully! Auto-response logged.');
        setHelpMessage('');
        fetchCounts();
        setTimeout(() => {
          setHelpModalOpen(false);
          setHelpSuccess('');
        }, 2000);
      } else {
        setHelpError(data.Msg || 'Failed to submit support ticket.');
      }
    } catch (err) {
      console.error('Help submit error:', err);
      setHelpError('Failed to connect to server.');
    } finally {
      setHelpSubmitting(false);
    }
  };

  // Sync with localStorage on client load to preserve collapse choice safely
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved !== null) {
      setIsCollapsed(saved === 'true');
    } else {
      // Default to collapsed (closed) on mobile/tablet devices
      if (window.innerWidth < 768) {
        setIsCollapsed(true);
      }
    }

    // Read current theme on mount
    const isLight = document.documentElement.classList.contains('light');
    setTheme(isLight ? 'light' : 'dark');

    fetchCounts();
    fetchSession();
    const interval = setInterval(fetchCounts, 15000); // Poll every 15 seconds
    return () => clearInterval(interval);
  }, []);

  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('sidebar-collapsed', String(newState));
  };

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

  const currentCategories = role === 'admin'
    ? (currentUser?.userTypeId === 2 ? staffCategories : adminCategories)
    : role === 'agent' ? agentCategories : advocateCategories;
  const roleTitle = role === 'admin'
    ? (currentUser?.userTypeId === 2 ? 'Staff' : 'Admin')
    : role.charAt(0).toUpperCase() + role.slice(1);

  // Auto-expand active category based on current pathname
  useEffect(() => {
    for (const cat of currentCategories) {
      if (cat.subLinks) {
        for (const sub of cat.subLinks) {
          if (sub.href === pathname) {
            setExpandedCategory(cat.label);
            break;
          }
          if (sub.subLinks && sub.subLinks.some(nested => nested.href === pathname)) {
            setExpandedCategory(cat.label);
            setExpandedSubCategory(sub.label);
            break;
          }
        }
      }
    }
  }, [pathname, currentCategories]);

  const handleLogout = async () => {
    try {
      await fetch('http://localhost:5000/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (err) {
      console.error(err);
    }
    router.push('/login');
  };

  const handleCategoryClick = (cat: SidebarCategory) => {
    if (isCollapsed) {
      toggleCollapse();
      setExpandedCategory(cat.label);
      return;
    }
    if (expandedCategory === cat.label) {
      setExpandedCategory(null);
    } else {
      setExpandedCategory(cat.label);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      
      {/* 1. Modern Glassmorphic Top Header */}
      <header className="h-14 bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80 flex items-center justify-between relative z-20 shrink-0 select-none px-6 shadow-sm">
        
        {/* Brand/Logo Section */}
        <div className="h-full flex items-center shrink-0 w-auto sm:w-[140px] text-white">
          <Link href={role === 'admin' ? '/dashboard' : role === 'agent' ? '/agent_dashboard' : '/adv_dashboard'} className="flex items-center gap-2 font-bold text-sm tracking-wider whitespace-nowrap group">
            <img 
              src="/logo.png" 
              alt="Dainna Logo" 
              className="w-7 h-7 object-contain transition-all duration-300 group-hover:scale-105" 
            />
            <span className="hidden sm:inline bg-clip-text text-transparent bg-gradient-to-r from-slate-100 via-slate-200 to-slate-300 font-extrabold tracking-widest text-xs">
              DAINNA
            </span>
          </Link>
        </div>

        {/* Top Sidebar Collapse Toggle Button */}
        <button
          onClick={toggleCollapse}
          className="w-8 h-8 bg-slate-800/40 border border-slate-700/30 hover:border-slate-600/50 text-slate-400 hover:text-white rounded-lg flex items-center justify-center transition-all hover:bg-slate-800 mr-4 cursor-pointer focus:outline-none"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <ChevronsRight size={14} /> : <ChevronsLeft size={14} />}
        </button>

        {/* Left Shortcuts Block - Only shown for Admin */}
        {role === 'admin' && (
          <div className="hidden md:flex items-center gap-2 pl-4 border-l border-slate-800">
            <Link 
              href="/message" 
              className="w-8 h-8 bg-emerald-500/10 border border-emerald-500/20 hover:border-emerald-500/40 text-emerald-400 hover:text-emerald-300 rounded-lg flex items-center justify-center transition-all hover:shadow-[0_0_12px_rgba(16,185,129,0.2)] hover:-translate-y-0.5 relative" 
              title="Agent Chat Notifications"
            >
              <MessageSquare size={14} />
              {counts.agentChats > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 text-white text-[8px] font-bold flex items-center justify-center rounded-full border border-slate-950 shadow-[0_0_8px_rgba(16,185,129,0.4)] animate-pulse">
                  {counts.agentChats}
                </span>
              )}
            </Link>
            <button 
              onClick={() => openNotificationsModal('agent')}
              className="w-8 h-8 bg-slate-800/40 border border-slate-700/30 hover:border-slate-600/50 text-slate-400 hover:text-slate-200 rounded-lg flex items-center justify-center transition-all hover:-translate-y-0.5 relative cursor-pointer focus:outline-none" 
              title="Agent Notifications"
            >
              <Bell size={14} />
              {counts.agentNotifications > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-slate-500 text-white text-[8px] font-bold flex items-center justify-center rounded-full border border-slate-950 shadow-[0_0_8px_rgba(100,116,139,0.4)] animate-pulse">
                  {counts.agentNotifications}
                </span>
              )}
            </button>
          </div>
        )}

        {/* Spacing bridge */}
        <div className="flex-1" />

        {/* Right Shortcuts & Profile Block */}
        <div className="flex items-center gap-4 h-full">
          
          {role === 'admin' ? (
            /* Admin Right Actions */
            <div className="flex items-center gap-2 border-r border-slate-800 pr-4 h-8">
              <button 
                onClick={() => openNotificationsModal('advocate')}
                className="w-8 h-8 bg-purple-500/10 border border-purple-500/20 hover:border-purple-500/40 text-purple-400 hover:text-purple-300 rounded-lg flex items-center justify-center transition-all hover:shadow-[0_0_12px_rgba(168,85,247,0.2)] hover:-translate-y-0.5 relative cursor-pointer focus:outline-none" 
                title="Advocate Notifications"
              >
                <Bell size={14} />
                {counts.advocateNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-pink-500 text-white text-[8px] font-bold flex items-center justify-center rounded-full border border-slate-950 shadow-[0_0_8px_rgba(236,72,153,0.4)] animate-pulse">
                    {counts.advocateNotifications}
                  </span>
                )}
              </button>
              <Link 
                href="/message" 
                className="w-8 h-8 bg-emerald-500/10 border border-emerald-500/20 hover:border-emerald-500/40 text-emerald-400 hover:text-emerald-300 rounded-lg flex items-center justify-center transition-all hover:shadow-[0_0_12px_rgba(16,185,129,0.2)] hover:-translate-y-0.5 relative" 
                title="Advocate Chats"
              >
                <MessageSquare size={14} />
                {counts.advocateChats > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 text-white text-[8px] font-bold flex items-center justify-center rounded-full border border-slate-950 shadow-[0_0_8px_rgba(16,185,129,0.4)] animate-pulse">
                    {counts.advocateChats}
                  </span>
                )}
              </Link>
            </div>
          ) : (
            /* Agent/Advocate Right Actions */
            <div className="flex items-center gap-2 border-r border-slate-800 pr-4 h-8">
              <button 
                onClick={() => openNotificationsModal('user')}
                className="w-8 h-8 bg-slate-800/40 border border-slate-700/30 hover:border-slate-600/50 text-slate-400 hover:text-slate-200 rounded-lg flex items-center justify-center transition-all hover:-translate-y-0.5 relative cursor-pointer focus:outline-none" 
                title="Notifications"
              >
                <Bell size={14} />
                {counts.notifications > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 text-white text-[8px] font-bold flex items-center justify-center rounded-full border border-slate-950 shadow-[0_0_8px_rgba(59,130,246,0.4)] animate-pulse">
                    {counts.notifications}
                  </span>
                )}
              </button>
              <Link 
                href={role === 'agent' ? '/agent_message' : '/adv_message'} 
                className="w-8 h-8 bg-emerald-500/10 border border-emerald-500/20 hover:border-emerald-500/40 text-emerald-400 hover:text-emerald-300 rounded-lg flex items-center justify-center transition-all hover:shadow-[0_0_12px_rgba(16,185,129,0.2)] hover:-translate-y-0.5 relative" 
                title="Chats"
              >
                <MessageSquare size={14} />
                {counts.chats > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 text-white text-[8px] font-bold flex items-center justify-center rounded-full border border-slate-950 shadow-[0_0_8px_rgba(16,185,129,0.4)] animate-pulse">
                    {counts.chats}
                  </span>
                )}
              </Link>
              <button 
                onClick={() => {
                  setHelpModalOpen(true);
                  setHelpSuccess('');
                  setHelpError('');
                }}
                className="h-8 w-8 sm:w-auto sm:px-3 bg-red-500/10 border border-red-500/20 hover:border-red-500/40 text-red-400 hover:text-red-300 rounded-lg flex items-center justify-center transition-all hover:shadow-[0_0_12px_rgba(239,68,68,0.2)] hover:-translate-y-0.5 text-xs font-semibold cursor-pointer focus:outline-none" 
                title="Support Help"
              >
                <HelpCircle size={14} className="sm:mr-1 shrink-0" />
                <span className="hidden sm:inline">Help</span>
              </button>
            </div>
          )}

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="w-8 h-8 bg-slate-800/40 border border-slate-700/30 hover:border-slate-600/50 text-slate-400 hover:text-white rounded-lg flex items-center justify-center transition-all hover:bg-slate-800 cursor-pointer focus:outline-none select-none"
            title={theme === 'dark' ? "Switch to Light Theme" : "Switch to Dark Theme"}
          >
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          </button>

          {/* User Profile Block */}
          <div className="relative">
            <button 
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="bg-slate-800/30 hover:bg-slate-800/60 border border-slate-700/30 hover:border-slate-600/50 rounded-xl py-1.5 px-2.5 sm:px-3 flex items-center gap-2 transition-all text-xs font-semibold text-slate-200 focus:outline-none select-none cursor-pointer"
            >
              <div className="relative">
                <img 
                  src="/assets/avatars/user.jpg" 
                  onError={(e) => {
                    e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'/%3E%3Ccircle cx='12' cy='7' r='4'/%3E%3C/svg%3E";
                  }}
                  className="w-7 h-7 rounded-full border border-slate-600/40 object-cover shrink-0" 
                  alt="User" 
                />
                <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 border border-slate-900 rounded-full" />
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-[9px] text-slate-400 font-medium leading-none">Logged in as</span>
                <span className="font-semibold text-slate-200 leading-tight mt-0.5">{roleTitle}</span>
              </div>
              <ChevronDown size={12} className="hidden sm:block text-slate-400" />
            </button>

            {profileDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-40 bg-slate-900/95 backdrop-blur-xl border border-slate-800 shadow-2xl rounded-xl p-1.5 z-50 animate-fadeIn">
                <Link 
                  href="/profile" 
                  className="flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-lg transition-colors border-b border-slate-800/50 mb-1"
                >
                  <User size={13} className="text-slate-400" />
                  <span>Profile Settings</span>
                </Link>
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors text-left font-semibold cursor-pointer"
                >
                  <LogOut size={13} />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 2. Workspace Area Below Header */}
      <div className="flex-1 flex min-w-0 overflow-hidden relative">
        
        {/* Sidebar Backdrop overlay on mobile when sidebar is open (not collapsed) */}
        {!isCollapsed && (
          <div 
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-30 md:hidden cursor-pointer"
            onClick={() => setIsCollapsed(true)}
          />
        )}

        {/* Collapsible Left Sidebar (Accordion Submenus) */}
        <aside className={`
          bg-slate-900/95 backdrop-blur-md border-r border-slate-800/80 flex flex-col shrink-0 transition-all duration-300
          fixed inset-y-0 left-0 z-40 pt-14 md:pt-0 md:relative md:translate-x-0
          ${isCollapsed ? 'w-16 -translate-x-full md:translate-x-0' : 'w-[190px] translate-x-0'}
        `}>
          
          {/* Navigation Menu */}
          <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
            {/* Display User ID for Agent / Advocate at the top of sidebar */}
            {currentUser && (currentUser.userTypeId === 3 || currentUser.userTypeId === 4) && (
              <div 
                className={`px-3 py-2 mb-3 mx-1.5 bg-slate-950/50 border border-slate-800/80 rounded-xl text-center select-none transition-all ${
                  isCollapsed ? 'flex justify-center items-center w-10 mx-auto px-0 h-10' : ''
                }`}
                title={`ID : ${currentUser.userCodeFull || currentUser.userCode || currentUser.userId}`}
              >
                {isCollapsed ? (
                  <span className="text-[10px] font-mono font-extrabold text-blue-400">
                    ID
                  </span>
                ) : (
                  <>
                    <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500 block leading-none">Your ID</span>
                    <span className="text-xs font-mono font-bold text-blue-400 mt-1 block">
                      ID : {currentUser.userCodeFull || currentUser.userCode || currentUser.userId}
                    </span>
                  </>
                )}
              </div>
            )}

            {currentCategories.map((cat, catIdx) => {
              const isDirect = !!cat.href;
              const isExpanded = expandedCategory === cat.label;
              const uniqueKey = `${cat.label}-${catIdx}`;
              
              // Determine direct or sublink active status
              const hasActiveSublink = cat.subLinks?.some(sub => {
                if (sub.href === pathname) return true;
                if (sub.subLinks?.some(nested => nested.href === pathname)) return true;
                return false;
              });
              const isActiveDirect = isDirect && pathname === cat.href;
              
              return (
                <div key={uniqueKey} className="w-full">
                  {isDirect ? (
                    // Direct Link rendering
                    <Link 
                      href={cat.href || '#'}
                      className={`group relative flex items-center gap-2.5 mx-1.5 px-3 py-2 text-xs font-medium rounded-xl transition-all ${
                        isCollapsed ? 'justify-center mx-auto w-10 px-0' : ''
                      } ${
                        isActiveDirect 
                          ? 'bg-gradient-to-r from-blue-500/15 to-indigo-500/10 border border-blue-500/20 text-blue-400 font-semibold shadow-[0_0_12px_rgba(59,130,246,0.05)]' 
                          : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200 hover:translate-x-0.5'
                      }`}
                    >
                      <div className={`shrink-0 ${isCollapsed ? 'scale-110' : ''} transition-transform ${isActiveDirect ? 'text-blue-400' : 'text-slate-450 group-hover:text-slate-355'}`}>
                        {cat.icon}
                      </div>
                      {!isCollapsed && (
                        <span className="whitespace-nowrap transition-opacity duration-300">
                          {cat.label}
                        </span>
                      )}
                      
                      {/* Collapsed Tooltip */}
                      {isCollapsed && (
                        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-2.5 py-1.5 bg-slate-950 border border-slate-800 text-white text-[10px] font-semibold rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 pointer-events-none shadow-xl">
                          {cat.label}
                        </div>
                      )}
                    </Link>
                  ) : (
                    // Collapsible Category Header Button
                    <div className="relative group">
                      <button
                        onClick={() => handleCategoryClick(cat)}
                        className={`w-full flex items-center justify-between mx-1.5 px-3 py-2 text-xs font-medium rounded-xl transition-all focus:outline-none cursor-pointer ${
                          isCollapsed ? 'justify-center mx-auto w-10 px-0' : ''
                        } ${
                          hasActiveSublink 
                            ? 'bg-slate-850/40 border border-slate-805 text-blue-400 font-semibold shadow-[0_0_12px_rgba(59,130,246,0.03)]' 
                            : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200 hover:translate-x-0.5'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`shrink-0 ${isCollapsed ? 'scale-110' : ''} transition-transform ${hasActiveSublink ? 'text-blue-400' : 'text-slate-455 group-hover:text-slate-355'}`}>
                            {cat.icon}
                          </div>
                          {!isCollapsed && (
                            <span className="whitespace-nowrap transition-opacity duration-300">
                              {cat.label}
                            </span>
                          )}
                        </div>
                        {!isCollapsed && (
                          <ChevronDown 
                            size={12} 
                            className={`text-slate-500 transition-transform duration-200 ${isExpanded ? 'rotate-180 text-blue-400' : ''}`} 
                          />
                        )}
                      </button>

                      {/* Collapsed Sidebar Flyout Panel (Interactive hover bridge) */}
                      {isCollapsed && cat.subLinks && (
                        <div className="absolute left-full top-0 pl-3 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-200 z-50 pointer-events-auto">
                          <div className="py-2 w-48 bg-slate-950 border border-slate-800 rounded-lg shadow-2xl relative overflow-hidden">
                            <div className="px-3 py-1.5 text-[9px] font-bold text-slate-500 uppercase border-b border-slate-900 mb-1 tracking-wider">
                              {cat.label.trim()}
                            </div>
                            <div className="max-h-56 overflow-y-auto">
                              {cat.subLinks.map((sub, subIdx) => {
                                if (sub.subLinks) {
                                  return (
                                    <div key={`${sub.label}-${subIdx}`} className="mt-1.5 mb-1 border-t border-slate-900/45 pt-1">
                                      <div className="px-3 py-1 text-[8px] font-bold text-slate-650 uppercase tracking-wider">
                                        {sub.label}
                                      </div>
                                      {sub.subLinks.map((nested, nestedIdx) => {
                                        const isNestedActive = pathname === nested.href;
                                        return (
                                          <Link 
                                            key={`${nested.href}-${nestedIdx}`}
                                            href={nested.href || '#'} 
                                            className={`flex items-center pl-5 pr-3 py-1.5 text-[10px] transition-colors rounded-lg mx-1 ${
                                              isNestedActive ? 'text-blue-400 bg-blue-500/10 font-semibold shadow-inner' : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                                            }`}
                                          >
                                            <span className={`w-1 h-1 rounded-full mr-2 transition-all ${isNestedActive ? 'bg-blue-400 scale-125' : 'bg-slate-700'}`} />
                                            {nested.label}
                                          </Link>
                                        );
                                      })}
                                    </div>
                                  );
                                }

                                const isSubActive = pathname === sub.href;
                                return (
                                  <Link 
                                    key={`${sub.href}-${subIdx}`}
                                    href={sub.href || '#'} 
                                    className={`flex items-center px-3 py-1.5 text-[10px] transition-colors rounded-lg mx-1 ${
                                      isSubActive ? 'text-blue-400 bg-blue-500/10 font-semibold shadow-inner' : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                                    }`}
                                  >
                                    <span className={`w-1 h-1 rounded-full mr-2 transition-all ${isSubActive ? 'bg-blue-400 scale-125' : 'bg-slate-700'}`} />
                                    {sub.label}
                                  </Link>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Expanded Accordion Sublinks */}
                      {!isCollapsed && isExpanded && cat.subLinks && (
                        <div className="ml-5 pl-3 border-l border-slate-800/80 space-y-0.5 mt-1 animate-fadeIn">
                          {cat.subLinks.map((sub, subIdx) => {
                            if (sub.subLinks) {
                              const isSubSubExpanded = expandedSubCategory === sub.label;
                              const hasActiveSubSubLink = sub.subLinks.some(nested => nested.href === pathname);
                              return (
                                <div key={`${sub.label}-${subIdx}`} className="w-full">
                                  <button
                                    onClick={() => {
                                      setExpandedSubCategory(isSubSubExpanded ? null : sub.label);
                                    }}
                                    className={`w-full flex items-center justify-between py-1.5 pr-2 pl-2 text-[11px] font-medium focus:outline-none cursor-pointer rounded-lg hover:bg-slate-800/30 transition-all ${
                                      hasActiveSubSubLink ? 'text-blue-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
                                    }`}
                                  >
                                    <div className="flex items-center">
                                      <span className={`w-1.5 h-1.5 rounded-full mr-2.5 transition-all ${hasActiveSubSubLink ? 'bg-blue-400 scale-125' : 'bg-slate-700'}`} />
                                      <span className="whitespace-nowrap">{sub.label}</span>
                                    </div>
                                    <ChevronDown 
                                      size={10} 
                                      className={`text-slate-500 transition-transform duration-200 ${isSubSubExpanded ? 'rotate-180 text-blue-400' : ''}`} 
                                    />
                                  </button>
                                  {isSubSubExpanded && (
                                    <div className="ml-2 pl-3 border-l border-dotted border-slate-800/60 space-y-0.5 mt-0.5 animate-fadeIn">
                                      {sub.subLinks.map((nested, nestedIdx) => {
                                        const isNestedActive = pathname === nested.href;
                                        return (
                                          <Link
                                            key={`${nested.href}-${nestedIdx}`}
                                            href={nested.href || '#'}
                                            className={`flex items-center py-1 pl-2 text-[10px] rounded-md transition-all hover:translate-x-0.5 ${
                                              isNestedActive ? 'text-blue-400 bg-blue-500/5 font-semibold shadow-inner' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/20'
                                            }`}
                                          >
                                            <span className={`w-1 h-1 rounded-full mr-2 transition-all ${isNestedActive ? 'bg-blue-400 scale-125' : 'bg-slate-800'}`} />
                                            {nested.label}
                                          </Link>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            }

                            const isSubActive = pathname === sub.href;
                            return (
                              <Link
                                key={`${sub.href}-${subIdx}`}
                                href={sub.href || '#'}
                                className={`flex items-center py-1.5 pl-2 text-[11px] font-medium rounded-lg transition-all hover:translate-x-0.5 ${
                                  isSubActive ? 'text-blue-400 bg-blue-500/5 font-semibold shadow-inner' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                                }`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full mr-2.5 transition-all ${isSubActive ? 'bg-blue-400 scale-125' : 'bg-slate-700'}`} />
                                {sub.label}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

        </aside>

        {/* 3. Main Workspace Content Pane */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 relative h-full bg-slate-950 min-w-0">
          {children}
        </div>

      </div>

      {/* Notifications Modal */}
      {notifModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-fadeIn">
            <div className="p-6 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center shrink-0">
              <h3 className="text-xl font-bold text-white flex items-center gap-2.5">
                <Bell className="text-blue-500" size={22} />
                <span>
                  {notifModalType === 'agent' && 'Agent Notifications'}
                  {notifModalType === 'advocate' && 'Advocate Notifications'}
                  {notifModalType === 'user' && 'User Notifications'}
                </span>
              </h3>
              <button 
                onClick={() => setNotifModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors text-2xl font-semibold cursor-pointer focus:outline-none"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleMarkAsRead} className="flex-1 overflow-y-auto p-6 flex flex-col min-h-0">
              <div className="flex-1 border border-slate-800 rounded-lg overflow-x-auto min-h-0 bg-slate-950/30">
                {notifLoading ? (
                  <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
                    <Loader2 className="animate-spin text-blue-500" size={32} />
                    <span>Loading notifications...</span>
                  </div>
                ) : notifList.length === 0 ? (
                  <div className="py-20 text-center text-slate-500 text-sm">
                    No active notifications found.
                  </div>
                ) : (
                  <table className="w-full border-collapse text-left text-sm text-slate-350 min-w-[600px]">
                    <thead className="bg-slate-950 text-slate-450 text-xs uppercase font-semibold border-b border-slate-800 sticky top-0">
                      <tr>
                        <th className="py-3 px-4 text-center w-12">
                          <input 
                            type="checkbox" 
                            className="rounded border-slate-800 bg-slate-950 text-blue-600 focus:ring-blue-500"
                            checked={notifList.length > 0 && selectedNotifIds.length === notifList.length}
                            onChange={(e) => handleToggleSelectAll(e.target.checked)}
                          />
                        </th>
                        <th className="py-3 px-4 w-40">Sender</th>
                        <th className="py-3 px-4 w-48">Title</th>
                        <th className="py-3 px-4">Message</th>
                        <th className="py-3 px-4 w-40">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 bg-slate-900/10">
                      {notifList.map((notif) => {
                        const isSelected = selectedNotifIds.includes(notif.notificationId);
                        const isAlertColor = notif.title === 'Payment Failed';
                        return (
                          <tr 
                            key={notif.notificationId} 
                            className={`hover:bg-slate-950/20 transition-colors ${isAlertColor ? 'text-red-400' : ''}`}
                          >
                            <td className="py-3 px-4 text-center">
                              <input 
                                type="checkbox"
                                className="rounded border-slate-800 bg-slate-950 text-blue-600 focus:ring-blue-500"
                                checked={isSelected}
                                onChange={(e) => handleToggleSelectOne(notif.notificationId, e.target.checked)}
                              />
                            </td>
                            <td className="py-3 px-4 font-semibold text-slate-200">{notif.senderName}</td>
                            <td className="py-3 px-4 font-medium">{notif.title}</td>
                            <td className="py-3 px-4 text-slate-400 text-xs">{notif.message}</td>
                            <td className="py-3 px-4 text-slate-500 text-xs">
                              {notif.sendtime ? new Date(notif.sendtime).toLocaleString() : 'N/A'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-6 mt-4 border-t border-slate-800 shrink-0">
                <button
                  type="button"
                  onClick={() => setNotifModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-850 hover:bg-slate-800 text-slate-350 font-medium rounded-lg text-sm transition-all"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={selectedNotifIds.length === 0}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-sm transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  Mark Selected As Read
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Send Help Message Modal */}
      {helpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden animate-fadeIn">
            <div className="p-6 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white flex items-center gap-2.5">
                <HelpCircle className="text-red-500" size={22} />
                <span>Submit Support Ticket</span>
              </h3>
              <button 
                onClick={() => setHelpModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors text-2xl font-semibold cursor-pointer focus:outline-none"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleSubmitHelp} className="p-6 space-y-4">
              {helpSuccess && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
                  {helpSuccess}
                </div>
              )}
              {helpError && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                  {helpError}
                </div>
              )}

              <div>
                <label className="block text-slate-450 text-xs font-semibold mb-1.5">Support Help Category *</label>
                <select
                  required
                  className="w-full h-10 px-3 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                  value={supportType}
                  onChange={(e) => setSupportType(e.target.value)}
                >
                  <option value="1">LOGIN RELATED HELP</option>
                  <option value="2">OPERATING RELATED HELP</option>
                  <option value="3">PAYMENT SENT HELP</option>
                  <option value="4">FAIL TRANSACTION HELP</option>
                  <option value="5">OTHER HELP</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-450 text-xs font-semibold mb-1.5">Your Message *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe your query in detail..."
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 transition-colors placeholder:text-slate-650"
                  value={helpMessage}
                  onChange={(e) => setHelpMessage(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setHelpModalOpen(false)}
                  className="px-4 py-2 bg-slate-850 hover:bg-slate-800 text-slate-350 font-medium rounded-lg text-xs transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={helpSubmitting}
                  className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg text-xs transition-all shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {helpSubmitting ? 'Submitting...' : 'Send Message'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

// Simple placeholder fallback icon for reports
function FileSpreadsheetIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/>
      <path d="M14 2v4a2 2 0 0 0 2 2h4"/>
      <path d="M8 13h8"/>
      <path d="M8 17h8"/>
      <path d="M8 9h2"/>
    </svg>
  );
}
