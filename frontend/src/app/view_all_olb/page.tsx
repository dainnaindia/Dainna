"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import TableToolbar, { TableFooter } from '@/components/TableToolbar';
import { Pencil, FilePlus, Trash2, Loader2, AlertCircle } from 'lucide-react';

interface Property {
  olbId: number;
  type: number;
  district: string;
  ownerFirstName: string;
  ownerLastName: string;
  ownerMobileNo: string;
  purchaserFirstName: string;
  purchaserLastName: string;
  purchaserMobileNo: string;
  purchaserEmail: string;
}

const COLUMNS = [
  { key: 'district', label: 'District' },
  { key: 'ownerName', label: 'Owner Name' },
  { key: 'ownerMobileNo', label: 'Owner Mobile' },
  { key: 'purchaserName', label: 'Purchaser Name' },
  { key: 'purchaserEmail', label: 'Purchaser Email' }
];

export default function ViewAllOlbPage() {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [typeFilter, setTypeFilter] = useState('0'); // 0=ALL, 1=Open Land, 2=Open Building
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // DataTables state variables
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleColumns, setVisibleColumns] = useState<string[]>(COLUMNS.map(c => c.key));
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchProperties = async (type = '0') => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`http://localhost:5000/api/properties/list?type=${type}`);
      const data = await response.json();
      if (response.ok) {
        setProperties(data.Properties || []);
      } else {
        setError(data.Msg || 'Failed to retrieve property listings.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection to server failed. Verify backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties(typeFilter);
    setCurrentPage(1);
  }, [typeFilter]);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to remove this property entry?')) return;
    
    try {
      const response = await fetch(`http://localhost:5000/api/properties/${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (response.ok && data.Status === 6) {
        setProperties(properties.filter(p => p.olbId !== id));
      } else {
        alert(data.Msg || 'Could not delete entry.');
      }
    } catch (err) {
      console.error(err);
      alert('Delete request failed.');
    }
  };

  const filteredProperties = properties.filter(p => {
    const ownerFull = `${p.ownerFirstName} ${p.ownerLastName}`.toLowerCase();
    const purchaserFull = `${p.purchaserFirstName} ${p.purchaserLastName}`.toLowerCase();
    const fullSearch = `${p.district} ${ownerFull} ${p.ownerMobileNo} ${purchaserFull} ${p.purchaserEmail}`.toLowerCase();
    return fullSearch.includes(searchTerm.toLowerCase());
  });

  const displayedProperties = pageSize === -1
    ? filteredProperties
    : filteredProperties.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const copyTable = () => {
    const text = filteredProperties.map((p, idx) => 
      `${idx + 1}\t${p.district}\t${p.ownerFirstName} ${p.ownerLastName}\t${p.ownerMobileNo}\t${p.purchaserFirstName} ${p.purchaserLastName}\t${p.purchaserEmail}`
    ).join('\n');
    navigator.clipboard.writeText(text);
    alert('Table copied to clipboard!');
  };

  const exportCSV = () => {
    const headers = ["#", "District", "Owner Name", "Owner Mobile", "Purchaser Name", "Purchaser Email"];
    const rows = filteredProperties.map((p, idx) => [
      idx + 1,
      p.district || '',
      `${p.ownerFirstName || ''} ${p.ownerLastName || ''}`.trim(),
      p.ownerMobileNo || '',
      `${p.purchaserFirstName || ''} ${p.purchaserLastName || ''}`.trim(),
      p.purchaserEmail || ''
    ]);

    let csvContent = [headers.join(","), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");
      
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8' });
    const encodedUri = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `properties_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <DashboardLayout role="agent">
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          aside, header, button, .no-print, select, input, .select-none {
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
            <h2 className="text-3xl font-extrabold tracking-tight text-white">Open Land & Buildings</h2>
            <p className="text-slate-400 text-sm mt-1">View and administer registered properties</p>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3 no-print">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Filter Toolbar (Legacy style category filter combined with modern search) */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl shadow-md no-print flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="w-full sm:w-64">
            <label className="block text-slate-400 text-xs font-semibold mb-1" htmlFor="type-filter">Filter Type:</label>
            <select
              id="type-filter"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
            >
              <option value="0">ALL</option>
              <option value="1">Open Land</option>
              <option value="2">Open Building</option>
            </select>
          </div>
        </div>

        <TableToolbar
          totalEntries={properties.length}
          filteredEntriesCount={filteredProperties.length}
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

        {/* Table list */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
                <Loader2 className="animate-spin text-blue-500" size={28} />
                <span>Loading property listings...</span>
              </div>
            ) : filteredProperties.length === 0 ? (
              <div className="py-20 text-center text-slate-500 text-sm">
                No land or building records found.
              </div>
            ) : (
              <table className="w-full border-collapse text-left text-sm text-slate-300">
                <thead className="bg-slate-950 text-slate-400 text-xs uppercase font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-4 px-6 text-center w-12">#</th>
                    {visibleColumns.includes('district') && <th className="py-4 px-6">District</th>}
                    {visibleColumns.includes('ownerName') && <th className="py-4 px-6">Owner Name</th>}
                    {visibleColumns.includes('ownerMobileNo') && <th className="py-4 px-6">Owner Mobile</th>}
                    {visibleColumns.includes('purchaserName') && <th className="py-4 px-6">Purchaser Name</th>}
                    {visibleColumns.includes('purchaserEmail') && <th className="py-4 px-6">Purchaser Email</th>}
                    <th className="py-4 px-6 text-center w-36 no-print">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {displayedProperties.map((property, idx) => (
                    <tr key={property.olbId} className="hover:bg-slate-950/40 transition-colors">
                      <td className="py-4 px-6 text-center font-medium text-slate-500">
                        {pageSize === -1 ? idx + 1 : (currentPage - 1) * pageSize + idx + 1}
                      </td>
                      {visibleColumns.includes('district') && <td className="py-4 px-6 font-semibold text-white">{property.district}</td>}
                      {visibleColumns.includes('ownerName') && <td className="py-4 px-6">{property.ownerFirstName} {property.ownerLastName}</td>}
                      {visibleColumns.includes('ownerMobileNo') && <td className="py-4 px-6 text-slate-400">{property.ownerMobileNo}</td>}
                      {visibleColumns.includes('purchaserName') && <td className="py-4 px-6">{property.purchaserFirstName} {property.purchaserLastName}</td>}
                      {visibleColumns.includes('purchaserEmail') && <td className="py-4 px-6 text-slate-400">{property.purchaserEmail}</td>}
                      <td className="py-4 px-6 no-print">
                        <div className="flex items-center justify-center gap-3">
                          <button
                            onClick={() => router.push(property.type === 1 ? `/update_ol?oid=${property.olbId}` : `/update_ob?oid=${property.olbId}`)}
                            title="Edit Record"
                            className="p-1.5 rounded bg-green-500/10 text-green-400 hover:bg-green-500 hover:text-white transition-all cursor-pointer"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => router.push(`/add_agreement_draft?oid=${property.olbId}`)}
                            title="Prepare Agreement Draft"
                            className="p-1.5 rounded bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white transition-all cursor-pointer"
                          >
                            <FilePlus size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(property.olbId)}
                            title="Delete Record"
                            className="p-1.5 rounded bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all cursor-pointer"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <TableFooter
            filteredEntriesCount={filteredProperties.length}
            totalEntries={properties.length}
            currentPage={currentPage}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
