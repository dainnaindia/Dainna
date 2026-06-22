"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import TableToolbar, { TableFooter } from '@/components/TableToolbar';
import { Plus, Printer, Trash2, CornerUpRight, Loader2, AlertCircle, Clock } from 'lucide-react';

interface OlbItem {
  olb_item_id: number;
  survey_no_new: string | null;
  survey_no_old: string | null;
}

interface Invoice {
  invoice_id: number;
  payment_status: number;
  inv_no?: string | null;
}

interface Draft {
  olbId: number;
  type: number;
  customizeReadymade: number | null;
  district: string;
  ownerFirstName: string;
  ownerLastName: string;
  purchaserFirstName: string;
  purchaserLastName: string;
  purchaserMobileNo: string;
  language: string;
  preparedDate: string;
  area: number | null;
  citySurveyOffice: string | null;
  ward: string | null;
  sheetNo: string | null;
  taluka: string | null;
  village: string | null;
  citySurveyNo: string | null;
  sectorNo: string | null;
  sectorPlotNo: string | null;
  state_master: {
    state_name: string;
  } | null;
  olb_item_master?: OlbItem[];
  invoice_master?: Invoice[];
  buildingName?: string | null;
  flatShopNo?: string | null;
  floorNo?: string | null;
  areaSqMt?: string | null;
  agreementDraft?: string | null;
  plotArea?: string | null;
}

const COLUMNS = [
  { key: 'preparedDate', label: 'Date' },
  { key: 'preparedTime', label: 'Time' },
  { key: 'category', label: 'Category' },
  { key: 'customerName', label: 'Customer Name' },
  { key: 'customerNo', label: 'Customer No' },
  { key: 'propertyDetails', label: 'Property Details' },
  { key: 'ownerName', label: 'Owner Name' },
  { key: 'propertyAddress', label: 'Property Address' }
];

export default function ViewAllPreparedDraftPage() {
  const router = useRouter();
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [typeFilter, setTypeFilter] = useState('0'); // 0=ALL, 1=Open Land, 2=Open Building
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // DataTables toolbar and pagination states
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleColumns, setVisibleColumns] = useState<string[]>(COLUMNS.map(c => c.key));
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchDrafts = async (type = '0') => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`http://localhost:5000/api/drafts/list?status=1&type=${type}`, { credentials: 'include' });
      const data = await response.json();
      if (response.ok) {
        setDrafts(data.Drafts || []);
      } else {
        setError(data.Msg || 'Failed to retrieve prepared drafts.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection to server failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrafts(typeFilter);
    setCurrentPage(1);
  }, [typeFilter]);

  // Format Helper: Property Details (Area text formatting matching legacy PHP/Image 2)
  const formatPropertyDetails = (d: Draft) => {
    let areaText = '';
    if (d.area === 1) {
      areaText = `Urban/ City Survey Office : ${d.citySurveyOffice || ''}/ Ward : ${d.ward || ''}/ Survey No : ${d.citySurveyNo || ''}/ Sheet No : ${d.sheetNo || ''}`;
    } else if (d.area === 2) {
      areaText = `Rural/ Taluka : ${d.taluka || ''}/ Village : ${d.village || ''}/ Survey No : ${d.citySurveyNo || ''}`;
    } else if (d.area === 3) {
      areaText = `Sector Wise/ Taluka : ${d.taluka || ''}/ Village : ${d.village || ''}/ Sector No : ${d.sectorNo || ''}/ Sector Plot No : ${d.sectorPlotNo || ''}`;
    }
    
    if (d.type === 2) {
      const bldgParts = [
        d.buildingName ? `Bldg Name: ${d.buildingName}` : '',
        d.flatShopNo ? `Flat/Shop No: ${d.flatShopNo}` : '',
        d.floorNo ? `Floor: ${d.floorNo}` : '',
        d.areaSqMt ? `Area: ${d.areaSqMt} SqFt` : ''
      ].filter(Boolean);
      if (bldgParts.length > 0) {
        areaText += ` / ${bldgParts.join(', ')}`;
      }
    }

    const invoices = d.invoice_master || [];
    if (invoices.length > 0 && invoices[0].inv_no) {
      const cleanedInvNo = invoices[0].inv_no.replace(/\//g, '');
      areaText += ` (ID : ${cleanedInvNo})`;
    }

    return areaText;
  };

  // Format Helper: Property Address (State - District matching Image 2)
  const formatPropertyAddress = (d: Draft) => {
    const stateName = d.state_master?.state_name || '';
    const district = d.district || '';
    if (stateName && district) {
      return `${stateName} - ${district}`;
    }
    return stateName || district || '—';
  };

  const handlePrintDraft = (draft: Draft) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Prepared Draft - Agreement</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 40px;
              line-height: 1.6;
              color: #333;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #333;
              padding-bottom: 10px;
              margin-bottom: 30px;
            }
            .content {
              white-space: pre-wrap;
              font-size: 14px;
              text-align: justify;
            }
            .details {
              margin-top: 50px;
              border-top: 1px solid #ddd;
              padding-top: 15px;
              font-size: 12px;
              color: #666;
            }
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>AGREEMENT DRAFT</h2>
            <p>DAINNA Legal Portal</p>
          </div>
          <div class="content">
            ${draft.agreementDraft || 'No draft content available.'}
          </div>
          <div class="details">
            <p><strong>Property Details:</strong> ${formatPropertyDetails(draft)}</p>
            <p><strong>Owner Name:</strong> ${draft.ownerFirstName} ${draft.ownerLastName}</p>
            <p><strong>Purchaser Name:</strong> ${draft.purchaserFirstName} ${draft.purchaserLastName}</p>
          </div>
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDeleteDraft = async (id: number) => {
    if (!confirm('Are you sure you want to delete this prepared draft?')) return;
    try {
      const response = await fetch(`http://localhost:5000/api/properties/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await response.json();
      if (response.ok && data.Status === 6) {
        setDrafts(drafts.filter(d => d.olbId !== id));
      } else {
        alert(data.Msg || 'Failed to delete draft.');
      }
    } catch (err) {
      console.error(err);
      alert('Connection to server failed.');
    }
  };

  const filteredDrafts = drafts.filter(d => {
    const ownerFull = `${d.ownerFirstName} ${d.ownerLastName}`.toLowerCase();
    const purchaserFull = `${d.purchaserFirstName} ${d.purchaserLastName}`.toLowerCase();
    const address = formatPropertyAddress(d).toLowerCase();
    const details = formatPropertyDetails(d).toLowerCase();
    const categoryText = d.customizeReadymade === 1 ? 'customize' : 'readymade';
    
    const fullSearch = `${ownerFull} ${purchaserFull} ${d.purchaserMobileNo} ${address} ${details} ${categoryText} ${d.language}`.toLowerCase();
    return fullSearch.includes(searchTerm.toLowerCase());
  });

  const displayedDrafts = pageSize === -1
    ? filteredDrafts
    : filteredDrafts.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const copyTable = () => {
    const text = filteredDrafts.map((d, idx) => {
      const date = d.preparedDate ? new Date(d.preparedDate).toLocaleDateString('en-IN') : 'N/A';
      const time = d.preparedDate ? new Date(d.preparedDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : 'N/A';
      const category = d.customizeReadymade === 1 ? 'Customize' : 'Readymade';
      return `${idx + 1}\t${date}\t${time}\t${category}\t${d.purchaserFirstName} ${d.purchaserLastName}\t${d.purchaserMobileNo}\t${formatPropertyDetails(d)}\t${d.ownerFirstName} ${d.ownerLastName}\t${formatPropertyAddress(d)}`;
    }).join('\n');
    navigator.clipboard.writeText(text);
    alert('Table copied to clipboard!');
  };

  const exportCSV = () => {
    const headers = ["#", "Date", "Time", "Category", "Customer Name", "Customer No", "Property Details", "Owner Name", "Property Address"];
    const rows = filteredDrafts.map((d, idx) => {
      const date = d.preparedDate ? new Date(d.preparedDate).toLocaleDateString('en-IN') : 'N/A';
      const time = d.preparedDate ? new Date(d.preparedDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : 'N/A';
      const category = d.customizeReadymade === 1 ? 'Customize' : 'Readymade';
      return [
        idx + 1,
        date,
        time,
        category,
        `${d.purchaserFirstName || ''} ${d.purchaserLastName || ''}`.trim(),
        d.purchaserMobileNo || '',
        formatPropertyDetails(d),
        `${d.ownerFirstName || ''} ${d.ownerLastName || ''}`.trim(),
        formatPropertyAddress(d)
      ];
    });

    let csvContent = [headers.join(","), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");
      
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8' });
    const encodedUri = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `prepared_drafts_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <DashboardLayout role="agent">
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          aside, header, button, .no-print, input, select, .select-none {
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
            <h2 className="text-3xl font-extrabold tracking-tight text-white">Prepared Drafts</h2>
            <p className="text-slate-400 text-sm mt-1">Review prepared contract drafts and route them to advocate via invoice payment</p>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3 no-print">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Filter Toolbar (Legacy style category filter) */}
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

        {/* Table list */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
                <Loader2 className="animate-spin text-blue-500" size={28} />
                <span>Loading drafts...</span>
              </div>
            ) : filteredDrafts.length === 0 ? (
              <div className="py-20 text-center text-slate-500 text-sm">
                No prepared drafts found.
              </div>
            ) : (
              <table className="w-full border-collapse text-left text-sm text-slate-350">
                <thead className="bg-slate-950 text-slate-400 text-xs uppercase font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-4 px-6 text-center w-12">#</th>
                    {visibleColumns.includes('preparedDate') && <th className="py-4 px-6">Date</th>}
                    {visibleColumns.includes('preparedTime') && <th className="py-4 px-6">Time</th>}
                    {visibleColumns.includes('category') && <th className="py-4 px-6">Category</th>}
                    {visibleColumns.includes('customerName') && <th className="py-4 px-6">Customer Name</th>}
                    {visibleColumns.includes('customerNo') && <th className="py-4 px-6">Customer No</th>}
                    {visibleColumns.includes('propertyDetails') && <th className="py-4 px-6">Property Details</th>}
                    {visibleColumns.includes('ownerName') && <th className="py-4 px-6">Owner Name</th>}
                    {visibleColumns.includes('propertyAddress') && <th className="py-4 px-6">Property Address</th>}
                    <th className="py-4 px-6 text-center w-36 no-print">#</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {displayedDrafts.map((draft, idx) => {
                    const invoices = draft.invoice_master || [];
                    const hasInvoice = invoices.length > 0;
                    const invoice = hasInvoice ? invoices[0] : null;

                    return (
                      <tr key={draft.olbId} className="hover:bg-slate-950/40 transition-colors">
                        <td className="py-4 px-6 text-center font-medium text-slate-500">
                          {pageSize === -1 ? idx + 1 : (currentPage - 1) * pageSize + idx + 1}
                        </td>
                        {visibleColumns.includes('preparedDate') && (
                          <td className="py-4 px-6 text-white font-mono text-xs">
                            {draft.preparedDate ? new Date(draft.preparedDate).toLocaleDateString('en-IN') : 'N/A'}
                          </td>
                        )}
                        {visibleColumns.includes('preparedTime') && (
                          <td className="py-4 px-6 text-slate-400 font-mono text-xs">
                            {draft.preparedDate ? new Date(draft.preparedDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : 'N/A'}
                          </td>
                        )}
                        {visibleColumns.includes('category') && (
                          <td className="py-4 px-6">
                            <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              draft.customizeReadymade === 1 
                                ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' 
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}>
                              {draft.customizeReadymade === 1 ? 'Customize' : 'Readymade'}
                            </span>
                          </td>
                        )}
                        {visibleColumns.includes('customerName') && (
                          <td className="py-4 px-6 text-white">
                            {`${draft.purchaserFirstName} ${draft.purchaserLastName}`}
                          </td>
                        )}
                        {visibleColumns.includes('customerNo') && (
                          <td className="py-4 px-6 text-slate-400 font-mono text-xs">
                            {draft.purchaserMobileNo || '—'}
                          </td>
                        )}
                        {visibleColumns.includes('propertyDetails') && (
                          <td className="py-4 px-6 text-slate-400 text-xs" dangerouslySetInnerHTML={{ __html: formatPropertyDetails(draft).replace(/no/g, 'No').replace(/ - /g, ' - ') }} />
                        )}
                        {visibleColumns.includes('ownerName') && (
                          <td className="py-4 px-6 text-slate-300 text-xs font-medium">
                            {`${draft.ownerFirstName} ${draft.ownerLastName}`}
                          </td>
                        )}
                        {visibleColumns.includes('propertyAddress') && (
                          <td className="py-4 px-6 text-slate-400 text-xs" dangerouslySetInnerHTML={{ __html: formatPropertyAddress(draft) }} />
                        )}
                        <td className="py-4 px-6 no-print">
                          <div className="flex items-center justify-center gap-2">
                            {/* 1. Print Draft */}
                            <button
                              onClick={() => router.push(`/view_draft_detail?oid=${draft.olbId}`)}
                              title="Print Draft"
                              className="p-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors cursor-pointer"
                            >
                              <Printer size={14} />
                            </button>

                            {/* 2. Add/Edit Draft */}
                            <button
                              onClick={() => router.push(`/add_agreement_draft?oid=${draft.olbId}`)}
                              title="Add/Edit Draft"
                              className="p-1 rounded bg-green-500/10 text-green-400 hover:bg-green-500 hover:text-white transition-colors cursor-pointer"
                            >
                              <Plus size={14} />
                            </button>

                            {/* 3. Delete/Remove */}
                            <button
                              onClick={() => handleDeleteDraft(draft.olbId)}
                              title="Delete Record"
                              className="p-1 rounded bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-colors cursor-pointer"
                            >
                              <Trash2 size={14} />
                            </button>

                            {/* 4. Send/Add Invoice or Pay */}
                            {!hasInvoice ? (
                              <button
                                onClick={() => router.push(`/add_invoice?oid=${draft.olbId}`)}
                                title="Add Invoice"
                                className="p-1 rounded bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white transition-colors cursor-pointer"
                              >
                                <CornerUpRight size={14} />
                              </button>
                            ) : invoice && invoice.payment_status !== 1 && invoice.payment_status !== 4 ? (
                              <button
                                onClick={() => router.push(`/agent_payment?iid=${invoice.invoice_id}`)}
                                title="Pay Invoice"
                                className="p-1 rounded bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white transition-colors cursor-pointer"
                              >
                                <CornerUpRight size={14} />
                              </button>
                            ) : invoice && invoice.payment_status === 4 ? (
                              <button
                                disabled
                                title="Waiting Approval"
                                className="p-1 rounded bg-amber-500/10 text-amber-400 opacity-60 cursor-not-allowed"
                              >
                                <Clock size={14} />
                              </button>
                            ) : (
                              <button
                                disabled
                                title="Routed to Advocate"
                                className="p-1 rounded bg-slate-800 text-slate-500 opacity-50 cursor-not-allowed"
                              >
                                <CornerUpRight size={14} />
                              </button>
                            )}
                          </div>
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
