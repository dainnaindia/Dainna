"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import TableToolbar, { TableFooter } from '@/components/TableToolbar';
import { FileCheck, Loader2, Search, Eye } from 'lucide-react';

interface Draft {
  olbId: number;
  type: number;
  ownerFirstName: string;
  ownerLastName: string;
  purchaserFirstName: string;
  purchaserLastName: string;
  preparedDate: string | null;
  sentDate: string | null;
  acceptDate: string | null;
  invoiceNo: string; // from mapping
  projectName: string;
  projectCity: string;
}

interface Project {
  projectId: number;
  projectName: string;
}

const COLUMNS = [
  { key: 'invoiceNo', label: 'Invoice No' },
  { key: 'date', label: 'Date' },
  { key: 'printingTime', label: 'Printing Time' },
  { key: 'projectName', label: 'Project Name' },
  { key: 'projectCity', label: 'Project City' },
  { key: 'purchaserName', label: 'Purchaser Name' },
  { key: 'preparedDate', label: 'Prepared Date' },
  { key: 'sentDate', label: 'Sent Date' },
  { key: 'acceptDate', label: 'Accept Date' },
  { key: 'status', label: 'Status' }
];

export default function ViewAllAgentCompletedDraftPage() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // DataTables toolbar and pagination states
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleColumns, setVisibleColumns] = useState<string[]>(COLUMNS.map(c => c.key));
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchSessionAndProjects = async () => {
    try {
      const profileRes = await fetch('http://localhost:5000/api/users/profile', { credentials: 'include' });
      const profileData = await profileRes.json();
      if (profileRes.ok && profileData.User) {
        const city = profileData.User.workingCity || '';
        const projectsRes = await fetch(`http://localhost:5000/api/projects?City=${city}`, { credentials: 'include' });
        const projectsData = await projectsRes.json();
        if (projectsRes.ok) {
          setProjects(projectsData.Projects || []);
        }
      }
    } catch (err) {
      console.error('Projects list fetch failed:', err);
    }
  };

  const fetchDrafts = async (projectId = '') => {
    setLoading(true);
    setError('');
    try {
      const url = `http://localhost:5000/api/drafts/list?status=4${projectId ? `&projectId=${projectId}` : ''}`;
      const response = await fetch(url, { credentials: 'include' });
      const data = await response.json();
      if (response.ok) {
        setDrafts(data.Drafts || []);
      } else {
        setError(data.Msg || 'Failed to retrieve completed drafts.');
      }
    } catch (err) {
      console.error(err);
      setError('Cannot connect to API server. Ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessionAndProjects();
  }, []);

  useEffect(() => {
    fetchDrafts(selectedProjectId);
    setCurrentPage(1);
  }, [selectedProjectId]);

  const filteredDrafts = drafts.filter(d => {
    const purchaserFull = `${d.purchaserFirstName} ${d.purchaserLastName}`.toLowerCase();
    const fullSearch = `${d.invoiceNo} ${d.projectName} ${d.projectCity} ${purchaserFull}`.toLowerCase();
    return fullSearch.includes(searchTerm.toLowerCase());
  });

  const displayedDrafts = pageSize === -1
    ? filteredDrafts
    : filteredDrafts.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const copyTable = () => {
    const text = filteredDrafts.map((d, idx) => {
      const acceptDate = d.acceptDate ? new Date(d.acceptDate).toLocaleDateString('en-IN') : 'N/A';
      const acceptTime = d.acceptDate ? new Date(d.acceptDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : 'N/A';
      const preparedDate = d.preparedDate ? new Date(d.preparedDate).toLocaleDateString('en-IN') : 'N/A';
      const sentDate = d.sentDate ? new Date(d.sentDate).toLocaleDateString('en-IN') : 'N/A';
      const purchaserName = `${d.purchaserFirstName} ${d.purchaserLastName}`;
      return `${idx + 1}\t${d.invoiceNo}\t${acceptDate}\t${acceptTime}\t${d.projectName}\t${d.projectCity}\t${purchaserName}\t${preparedDate}\t${sentDate}\t${acceptDate}\tComplete Draft`;
    }).join('\n');
    navigator.clipboard.writeText(text);
    alert('Table copied to clipboard!');
  };

  const exportCSV = () => {
    const headers = ["#", "Invoice No", "Date", "Printing Time", "Project Name", "Project City", "Purchaser Name", "Prepared Date", "Sent Date", "Accept Date", "Status"];
    const rows = filteredDrafts.map((d, idx) => {
      const acceptDate = d.acceptDate ? new Date(d.acceptDate).toLocaleDateString('en-IN') : 'N/A';
      const acceptTime = d.acceptDate ? new Date(d.acceptDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : 'N/A';
      const preparedDate = d.preparedDate ? new Date(d.preparedDate).toLocaleDateString('en-IN') : 'N/A';
      const sentDate = d.sentDate ? new Date(d.sentDate).toLocaleDateString('en-IN') : 'N/A';
      const purchaserName = `${d.purchaserFirstName} ${d.purchaserLastName}`;

      return [
        idx + 1,
        d.invoiceNo,
        acceptDate,
        acceptTime,
        d.projectName,
        d.projectCity,
        purchaserName,
        preparedDate,
        sentDate,
        acceptDate,
        "Complete Draft"
      ];
    });

    let csvContent = [headers.join(","), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");
      
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8' });
    const encodedUri = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `completed_drafts_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <DashboardLayout role="agent">
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          aside, header, button, .no-print, input, select {
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

      <div className="space-y-6">
        <div className="flex justify-between items-center no-print">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <FileCheck className="text-blue-500" size={32} />
              Completed Drafts
            </h2>
            <p className="text-slate-400 text-sm mt-1">Contracts fully audited, verified, and accepted by advocate panel</p>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm no-print">
            {error}
          </div>
        )}

        {/* Project Dropdown Filter (Legacy Style) */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl shadow-md no-print flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="w-full sm:w-64">
            <label className="block text-slate-400 text-xs font-semibold mb-1" htmlFor="project-filter">Project Name:</label>
            <select
              id="project-filter"
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
            >
              <option value="">-- SELECT --</option>
              {projects.map((p) => (
                <option key={p.projectId} value={p.projectId}>
                  {p.projectName}
                </option>
              ))}
            </select>
          </div>
        </div>

        <TableToolbar
          totalEntries={drafts.length}
          filteredEntriesCount={filteredDrafts.length}
          currentPage={currentPage}
          pageSize={pageSize}
          onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
          onPageChange={(page) => setCurrentPage(page)}
          searchValue={searchTerm}
          onSearchChange={(val) => { setSearchTerm(val); setCurrentPage(1); }}
          columns={COLUMNS}
          visibleColumns={visibleColumns}
          onVisibleColumnsChange={setVisibleColumns}
          onCopyData={copyTable}
          onExportExcel={exportCSV}
          onExportCSV={exportCSV}
        />

        {/* Completed Drafts Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
                <Loader2 className="animate-spin text-blue-500" size={28} />
                <span>Loading completed drafts...</span>
              </div>
            ) : filteredDrafts.length === 0 ? (
              <div className="py-20 text-center text-slate-500 text-sm">
                No completed drafts found.
              </div>
            ) : (
              <table className="w-full border-collapse text-left text-sm text-slate-300">
                <thead className="bg-slate-950 text-slate-400 text-xs uppercase font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-4 px-6 text-center w-12">#</th>
                    {visibleColumns.includes('invoiceNo') && <th className="py-4 px-6">Invoice No</th>}
                    {visibleColumns.includes('date') && <th className="py-4 px-6">Date</th>}
                    {visibleColumns.includes('printingTime') && <th className="py-4 px-6">Printing Time</th>}
                    {visibleColumns.includes('projectName') && <th className="py-4 px-6">Project Name</th>}
                    {visibleColumns.includes('projectCity') && <th className="py-4 px-6">Project City</th>}
                    {visibleColumns.includes('purchaserName') && <th className="py-4 px-6">Purchaser Name</th>}
                    {visibleColumns.includes('preparedDate') && <th className="py-4 px-6">Prepared Date</th>}
                    {visibleColumns.includes('sentDate') && <th className="py-4 px-6">Sent Date</th>}
                    {visibleColumns.includes('acceptDate') && <th className="py-4 px-6">Accept Date</th>}
                    {visibleColumns.includes('status') && <th className="py-4 px-6">Status</th>}
                    <th className="py-4 px-6 text-center w-16 no-print">#</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {displayedDrafts.map((d, idx) => {
                    const acceptDate = d.acceptDate ? new Date(d.acceptDate).toLocaleDateString('en-IN') : 'N/A';
                    const acceptTime = d.acceptDate ? new Date(d.acceptDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : 'N/A';
                    const preparedDate = d.preparedDate ? new Date(d.preparedDate).toLocaleDateString('en-IN') : 'N/A';
                    const sentDate = d.sentDate ? new Date(d.sentDate).toLocaleDateString('en-IN') : 'N/A';
                    const purchaserName = `${d.purchaserFirstName} ${d.purchaserLastName}`;

                    return (
                      <tr key={d.olbId} className="hover:bg-slate-950/40 transition-colors">
                        <td className="py-4 px-6 text-center font-medium text-slate-500">
                          {pageSize === -1 ? idx + 1 : (currentPage - 1) * pageSize + idx + 1}
                        </td>
                        {visibleColumns.includes('invoiceNo') && (
                          <td className="py-4 px-6 text-white font-mono text-xs font-semibold">
                            {d.invoiceNo || 'N/A'}
                          </td>
                        )}
                        {visibleColumns.includes('date') && (
                          <td className="py-4 px-6 font-mono text-xs text-slate-350">{acceptDate}</td>
                        )}
                        {visibleColumns.includes('printingTime') && (
                          <td className="py-4 px-6 font-mono text-xs text-slate-450">{acceptTime}</td>
                        )}
                        {visibleColumns.includes('projectName') && (
                          <td className="py-4 px-6 text-white font-medium">{d.projectName}</td>
                        )}
                        {visibleColumns.includes('projectCity') && (
                          <td className="py-4 px-6 text-slate-350">{d.projectCity}</td>
                        )}
                        {visibleColumns.includes('purchaserName') && (
                          <td className="py-4 px-6 text-slate-300">{purchaserName}</td>
                        )}
                        {visibleColumns.includes('preparedDate') && (
                          <td className="py-4 px-6 font-mono text-xs text-slate-450">{preparedDate}</td>
                        )}
                        {visibleColumns.includes('sentDate') && (
                          <td className="py-4 px-6 font-mono text-xs text-slate-450">{sentDate}</td>
                        )}
                        {visibleColumns.includes('acceptDate') && (
                          <td className="py-4 px-6 font-mono text-xs text-slate-450">{acceptDate}</td>
                        )}
                        {visibleColumns.includes('status') && (
                          <td className="py-4 px-6">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              Complete Draft
                            </span>
                          </td>
                        )}
                        <td className="py-4 px-6 text-center no-print">
                          <Link href={`/pay_agent?oid=${d.olbId}`} className="text-blue-450 hover:text-blue-300 transition-colors inline-block" title="View">
                            <Eye size={16} />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          <TableFooter
            filteredEntriesCount={filteredDrafts.length}
            totalEntries={drafts.length}
            currentPage={currentPage}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
