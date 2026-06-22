"use client";

import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  Send, Search, Users, AlertCircle, Loader2, User, HelpCircle, Mail, MessageSquareText 
} from 'lucide-react';

interface Contact {
  userId: number;
  name: string;
  userTypeId: number;
  pendingCount: number;
}

interface Message {
  chatId: number;
  fromId: number;
  toId: number;
  message: string;
  sendtime: string;
  supportType: number | null;
  type: number;
}

export default function AdminMessagesPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Bulk Message states
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkRole, setBulkRole] = useState<'3' | '4'>('3'); // 3=Agent, 4=Advocate
  const [bulkSystemEmail, setBulkSystemEmail] = useState('1'); // 1=System, 2=Email
  const [bulkText, setBulkText] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchContacts = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/chat/contacts');
      const data = await response.json();
      if (response.ok) {
        setContacts(data.Contacts || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingContacts(false);
    }
  };

  const fetchMessages = async (contactId: number) => {
    setLoadingMessages(true);
    try {
      const response = await fetch(`http://localhost:5000/api/chat/messages/${contactId}`);
      const data = await response.json();
      if (response.ok) {
        setMessages(data.Messages || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMessages(false);
      scrollToBottom();
    }
  };

  useEffect(() => {
    fetchContacts();
    const interval = setInterval(fetchContacts, 10000); // Poll contacts list every 10s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedContact) {
      fetchMessages(selectedContact.userId);
      const interval = setInterval(() => {
        fetchMessages(selectedContact.userId);
      }, 5000); // Poll active chat messages every 5s
      return () => clearInterval(interval);
    }
  }, [selectedContact]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSelectContact = (c: Contact) => {
    setSelectedContact(c);
    // Optimistically clear pending count locally
    setContacts(contacts.map(item => item.userId === c.userId ? { ...item, pendingCount: 0 } : item));
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContact || !inputMessage.trim()) return;

    const msgText = inputMessage;
    setInputMessage('');

    try {
      const response = await fetch('http://localhost:5000/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ToID: selectedContact.userId,
          Message: msgText
        })
      });
      const data = await response.json();
      if (response.ok && data.Status === 2) {
        // Fetch fresh history
        fetchMessages(selectedContact.userId);
      } else {
        alert('Failed to send message.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error sending message.');
    }
  };

  const handleSendBulk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkText.trim()) return;

    try {
      const response = await fetch('http://localhost:5000/api/chat/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          SystemEmailSMS: bulkSystemEmail,
          ToIDs: [0], // Broadcast to role
          Message: bulkText
        })
      });
      if (response.ok) {
        setBulkModalOpen(false);
        setBulkText('');
        alert('Broadcast sent successfully.');
        fetchContacts();
      } else {
        alert('Failed to broadcast message.');
      }
    } catch (err) {
      console.error(err);
      alert('Error broadcasting.');
    }
  };

  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout role="admin">
      <div className="absolute top-10 right-10 w-[400px] h-[400px] rounded-full bg-blue-500/5 blur-[100px] pointer-events-none" />

      <div className="space-y-6 h-[calc(100vh-120px)] flex flex-col">
        <div className="flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <MessageSquareText className="text-blue-500" size={32} />
              Support Messages
            </h2>
            <p className="text-slate-400 text-sm mt-1">Communicate directly with registered Agents & Advocates or send bulk alerts</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => { setBulkRole('3'); setBulkModalOpen(true); }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg text-sm transition-all cursor-pointer"
            >
              Bulk to Agent
            </button>
            <button
              onClick={() => { setBulkRole('4'); setBulkModalOpen(true); }}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-lg text-sm transition-all cursor-pointer"
            >
              Bulk to Advocate
            </button>
          </div>
        </div>

        {/* Chat Pane */}
        <div className="flex-1 min-h-0 bg-slate-900 border border-slate-800 rounded-xl shadow-lg flex overflow-hidden">
          {/* Sidebar contacts list */}
          <div className="w-80 border-r border-slate-800 flex flex-col shrink-0">
            <div className="p-4 border-b border-slate-800">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                <input
                  type="text"
                  placeholder="Search contacts..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:border-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-800/30">
              {loadingContacts ? (
                <div className="p-8 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
                  <Loader2 className="animate-spin text-blue-500" size={14} />
                  <span>Loading contacts...</span>
                </div>
              ) : filteredContacts.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  No active contacts found.
                </div>
              ) : (
                filteredContacts.map(c => {
                  const isSel = selectedContact?.userId === c.userId;
                  return (
                    <div
                      key={c.userId}
                      onClick={() => handleSelectContact(c)}
                      className={`p-4 flex items-center justify-between cursor-pointer transition-colors ${
                        isSel ? 'bg-blue-500/10' : 'hover:bg-slate-950/20'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          c.userTypeId === 3 ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'
                        }`}>
                          {c.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-semibold text-white text-sm">{c.name}</h4>
                          <span className="text-[10px] text-slate-500 uppercase">{c.userTypeId === 3 ? 'Agent' : 'Advocate'}</span>
                        </div>
                      </div>
                      
                      {c.pendingCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-red-500 text-white font-bold text-[10px] animate-pulse">
                          {c.pendingCount}
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Active Chat box */}
          <div className="flex-1 flex flex-col min-w-0">
            {selectedContact ? (
              <>
                {/* Header */}
                <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-extrabold text-base">
                      {selectedContact.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm">{selectedContact.name}</h3>
                      <span className="text-[10px] text-slate-500 uppercase">{selectedContact.userTypeId === 3 ? 'Agent' : 'Advocate'}</span>
                    </div>
                  </div>
                </div>

                {/* Messages pane */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-950/20">
                  {loadingMessages ? (
                    <div className="h-full flex items-center justify-center text-slate-500 text-xs gap-2">
                      <Loader2 className="animate-spin text-blue-500" size={16} />
                      <span>Loading conversation history...</span>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs gap-2">
                      <MessageSquareText size={28} className="text-slate-600" />
                      <span>No messages in this chat. Write something below to get started.</span>
                    </div>
                  ) : (
                    messages.map((m) => {
                      const isAdmin = m.fromId === 1;
                      const hasHelp = m.type === 1 && m.supportType;
                      
                      let helpCategory = '';
                      if (hasHelp) {
                        if (m.supportType === 1) helpCategory = 'LOGIN RELATED';
                        if (m.supportType === 2) helpCategory = 'OPERATING RELATED';
                        if (m.supportType === 3) helpCategory = 'PAYMENT SENT';
                        if (m.supportType === 4) helpCategory = 'FAILED TRANSACTION';
                        if (m.supportType === 5) helpCategory = 'OTHER HELP';
                      }

                      return (
                        <div key={m.chatId} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-md rounded-xl p-3.5 shadow-md text-sm leading-relaxed ${
                            isAdmin 
                              ? 'bg-blue-600 text-white rounded-tr-none' 
                              : 'bg-slate-800 text-slate-100 rounded-tl-none border border-slate-750'
                          }`}>
                            {hasHelp && (
                              <div className="mb-2 px-2 py-1 bg-red-500/20 border border-red-500/30 text-red-400 text-[10px] font-bold uppercase rounded-md">
                                Category: {helpCategory}
                              </div>
                            )}
                            <p>{m.message}</p>
                            <span className={`block text-[10px] mt-1.5 text-right ${isAdmin ? 'text-blue-200' : 'text-slate-500'}`}>
                              {new Date(m.sendtime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Footer Input */}
                <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-800 bg-slate-900/50 flex gap-3 shrink-0">
                  <input
                    type="text"
                    placeholder="Write your message here..."
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-blue-500"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                  />
                  <button
                    type="submit"
                    className="p-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all flex items-center justify-center cursor-pointer shadow-md"
                  >
                    <Send size={18} />
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-3">
                <Users size={48} className="text-slate-700" />
                <span>Select a contact from the sidebar list to view conversation threads</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bulk Message Modal */}
      {bulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">Broadcast Msg to {bulkRole === '3' ? 'Agents' : 'Advocates'}</h3>
              <button onClick={() => setBulkModalOpen(false)} className="text-slate-400 hover:text-white text-lg">&times;</button>
            </div>
            
            <form onSubmit={handleSendBulk} className="p-6 space-y-4">
              <div>
                <label className="block text-slate-400 text-xs font-semibold mb-2">Broadcast Method</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-slate-350 text-sm">
                    <input
                      type="radio"
                      name="method"
                      value="1"
                      checked={bulkSystemEmail === '1'}
                      onChange={(e) => setBulkSystemEmail(e.target.value)}
                      className="accent-blue-500"
                    />
                    <span>System Chat</span>
                  </label>
                  <label className="flex items-center gap-2 text-slate-350 text-sm">
                    <input
                      type="radio"
                      name="method"
                      value="2"
                      checked={bulkSystemEmail === '2'}
                      onChange={(e) => setBulkSystemEmail(e.target.value)}
                      className="accent-blue-500"
                    />
                    <span>Email Broadcast</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-semibold mb-1">Message Content *</label>
                <textarea
                  required
                  placeholder="Type broadcast alert content..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none"
                  rows={4}
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setBulkModalOpen(false)}
                  className="px-4 py-2 bg-slate-850 hover:bg-slate-800 text-slate-300 font-medium rounded-lg text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg text-sm"
                >
                  Send Broadcast
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
