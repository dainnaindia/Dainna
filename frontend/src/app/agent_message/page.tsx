"use client";

import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Send, MessageCircleCode, Loader2, HelpCircle } from 'lucide-react';

interface Message {
  chatId: number;
  fromId: number;
  toId: number;
  message: string;
  sendtime: string;
  supportType: number | null;
  type: number;
}

export default function AgentMessagePage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputMessage, setInputMessage] = useState('');
  const [supportType, setSupportType] = useState('0'); // 0=No Category, 1=Login, 2=Operating, 3=Payment, 4=Failed Trans, 5=Other
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/chat/messages/1'); // Fetch chat with Admin (1)
      const data = await response.json();
      if (response.ok) {
        setMessages(data.Messages || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 6000); // Poll messages every 6 seconds
    return () => clearInterval(interval);
  }, []);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const msgText = inputMessage;
    const cat = parseInt(supportType);
    setInputMessage('');
    setSupportType('0'); // Reset category

    try {
      const response = await fetch('http://localhost:5000/api/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ToID: 1,
          Message: msgText,
          SupportType: cat > 0 ? cat : undefined
        })
      });
      if (response.ok) {
        fetchMessages();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <DashboardLayout role="agent">
      <div className="absolute top-10 right-10 w-[400px] h-[400px] rounded-full bg-blue-500/5 blur-[100px] pointer-events-none" />

      <div className="space-y-6 h-[calc(100vh-120px)] flex flex-col">
        <div className="flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <MessageCircleCode className="text-blue-500" size={32} />
              Help Support Desk
            </h2>
            <p className="text-slate-400 text-sm mt-1">Submit technical tickets, payment inquiries, or chat with the administrators</p>
          </div>
        </div>

        {/* Chat Workspace */}
        <div className="flex-1 min-h-0 bg-slate-900 border border-slate-800 rounded-xl shadow-lg flex flex-col overflow-hidden">
          {/* Messages Grid */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-950/20">
            {loading ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-sm gap-2">
                <Loader2 className="animate-spin text-blue-500" size={18} />
                <span>Syncing message logs...</span>
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs gap-3">
                <HelpCircle size={36} className="text-slate-650" />
                <span>No message threads active. Send your support query to the administrator below.</span>
              </div>
            ) : (
              messages.map((m) => {
                const isAgent = m.fromId !== 1;
                const hasHelp = m.type === 1 && m.supportType;
                
                let helpCategory = '';
                if (hasHelp) {
                  if (m.supportType === 1) helpCategory = 'LOGIN RELATED HELP';
                  if (m.supportType === 2) helpCategory = 'OPERATING RELATED HELP';
                  if (m.supportType === 3) helpCategory = 'PAYMENT SENT HELP';
                  if (m.supportType === 4) helpCategory = 'FAILED TRANSACTION HELP';
                  if (m.supportType === 5) helpCategory = 'OTHER HELP';
                }

                return (
                  <div key={m.chatId} className={`flex ${isAgent ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-md rounded-xl p-3.5 shadow-md text-sm leading-relaxed ${
                      isAgent 
                        ? 'bg-blue-600 text-white rounded-tr-none' 
                        : 'bg-slate-800 text-slate-100 rounded-tl-none border border-slate-750'
                    }`}>
                      {hasHelp && (
                        <div className="mb-2 px-2 py-0.5 bg-red-500/20 border border-red-500/30 text-red-400 text-[9px] font-extrabold uppercase rounded-md tracking-wider">
                          Ticket: {helpCategory}
                        </div>
                      )}
                      <p>{m.message}</p>
                      <span className={`block text-[10px] mt-1.5 text-right ${isAgent ? 'text-blue-200' : 'text-slate-500'}`}>
                        {new Date(m.sendtime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Form inputs */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-800 bg-slate-900/50 space-y-3 shrink-0">
            <div className="flex gap-4">
              <div className="w-56 shrink-0">
                <select
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-350 text-xs focus:outline-none focus:border-blue-500"
                  value={supportType}
                  onChange={(e) => setSupportType(e.target.value)}
                >
                  <option value="0">General Inquiry</option>
                  <option value="1">Login Help</option>
                  <option value="2">Operating Instructions</option>
                  <option value="3">Payment Sent Help</option>
                  <option value="4">Failed transaction Help</option>
                  <option value="5">Other Help</option>
                </select>
              </div>

              <div className="flex-1 flex gap-3">
                <input
                  type="text"
                  placeholder="Write message description to the support desk..."
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  required
                />
                <button
                  type="submit"
                  className="p-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all flex items-center justify-center cursor-pointer shadow-md"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
