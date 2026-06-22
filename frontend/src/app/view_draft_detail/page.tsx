"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { Printer, Loader2, AlertCircle } from 'lucide-react';

interface PropertyDetails {
  olbId: number;
  type: number;
  area: number;
  district: string;
  plotArea: string;
  buildingName: string;
  flatShopNo: string;
  floorNo: string;
  ownerFirstName: string;
  ownerMiddleName: string;
  ownerLastName: string;
  ownerMobileNo: string;
  purchaserFirstName?: string | null;
  purchaserMiddleName?: string | null;
  purchaserLastName?: string | null;
  purchaserMobileNo?: string | null;
  purchaserEmail?: string | null;
  citySurveyOffice?: string | null;
  ward?: string | null;
  citySurveyNo?: string | null;
  sheetNo?: string | null;
  taluka?: string | null;
  village?: string | null;
  sectorNo?: string | null;
  sectorPlotNo?: string | null;
  areaSqMt?: string | null;
  agreementDraft?: string | null;
  preparedDate?: string | null;
  sentDate?: string | null;
  acceptDate?: string | null;
  invoice_master?: Array<{
    inv_no?: string | null;
    invoice_id: number;
    size: number;
    rate: number;
    total: number;
    sgst_amount: number;
    cgst_amount: number;
    igst_amount: number;
    grandtotal: number;
    project_master?: {
      projectName: string;
      city: string;
      state_master?: {
        state_name: string;
      }
    } | null;
    user_master_invoice_master_advocate_idTouser_master?: {
      firstname: string;
      surname: string;
      address: string;
    } | null;
    user_master_invoice_master_addedbyTouser_master?: {
      firstname: string;
      middlename?: string;
      surname: string;
      firmname?: string;
      mobile: string;
      address: string;
    } | null;
  }>;
}

function ViewDraftDetailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const oid = searchParams.get('oid');
  const fromPage = searchParams.get('page') || 'PreparedDraft';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [property, setProperty] = useState<PropertyDetails | null>(null);

  useEffect(() => {
    if (!oid) {
      setError('Missing property reference (oid parameter).');
      setLoading(false);
      return;
    }

    fetch(`http://localhost:5000/api/properties/detail/${oid}`, { credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to retrieve property/draft details');
        return res.json();
      })
      .then((data) => {
        setProperty(data.Property);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError('Failed to fetch draft detail info.');
        setLoading(false);
      });
  }, [oid]);

  const handlePrint = () => {
    window.print();
  };

  const getBackRoute = () => {
    if (fromPage === 'AllDrafts') return '/view_all_drafts';
    return '/view_all_prepared_draft';
  };

  if (loading) {
    return (
      <DashboardLayout role="agent">
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
          <Loader2 className="animate-spin text-blue-500" size={28} />
          <span>Retrieving draft details...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !property) {
    return (
      <DashboardLayout role="agent">
        <div className="max-w-4xl mx-auto p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
          <div className="flex items-center gap-3 text-red-400">
            <AlertCircle size={24} />
            <h3 className="text-lg font-bold">Error Loading Details</h3>
          </div>
          <p className="text-slate-400 text-sm">{error || 'Draft record could not be found.'}</p>
          <button 
            onClick={() => router.push(getBackRoute())}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm transition-all"
          >
            Go Back
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const invoice = property.invoice_master && property.invoice_master.length > 0 ? property.invoice_master[0] : null;
  const agent = invoice?.user_master_invoice_master_addedbyTouser_master;
  const advocate = invoice?.user_master_invoice_master_advocate_idTouser_master;
  const project = invoice?.project_master;

  // Format Helper: Property Details
  const formatPropertyDetailsLabel = (p: PropertyDetails) => {
    const districtPart = p.district ? p.district.toUpperCase() : '';
    let areaText = '';
    if (p.area === 1) {
      areaText = `Urban/ City Survey Office : ${p.citySurveyOffice || ''}/ Ward : ${p.ward || ''}/ Survey No : ${p.citySurveyNo || ''}/ Sheet No : ${p.sheetNo || ''}`;
    } else if (p.area === 2) {
      areaText = `Rural/ Taluka : ${p.taluka || ''}/ Village : ${p.village || ''}/ Survey No : ${p.citySurveyNo || ''}`;
    } else if (p.area === 3) {
      areaText = `Sector Wise/ Taluka : ${p.taluka || ''}/ Village : ${p.village || ''}/ Sector No : ${p.sectorNo || ''}/ Sector Plot No : ${p.sectorPlotNo || ''}`;
    }
    
    if (p.type === 2) {
      const bldgParts = [
        p.buildingName ? `Bldg Name: ${p.buildingName}` : '',
        p.flatShopNo ? `Flat/Shop No: ${p.flatShopNo}` : '',
        p.floorNo ? `Floor: ${p.floorNo}` : '',
        p.areaSqMt ? `Area: ${p.areaSqMt} SqFt` : ''
      ].filter(Boolean);
      if (bldgParts.length > 0) {
        areaText += ` / ${bldgParts.join(', ')}`;
      }
    }
    const plotAreaPart = p.plotArea || p.areaSqMt || '';
    const invoiceIdPart = invoice?.inv_no ? ` (ID : ${invoice.inv_no.replace(/\//g, '')})` : '';
    return `${districtPart} : ${areaText} ${plotAreaPart}${invoiceIdPart}`.trim();
  };

  const agentName = agent ? `${agent.firstname || ''} ${agent.surname || ''}`.trim() : 'N/A';
  const agentContact = agent?.mobile || 'N/A';
  const agentFirm = agent?.firmname || '';
  const agentAddress = agent?.address || 'N/A';

  const customerName = `${property.purchaserFirstName || ''} ${property.purchaserLastName || ''}`.trim() || 'N/A';
  const customerContact = property.purchaserMobileNo || 'N/A';
  const customerEmail = property.purchaserEmail || 'N/A';

  const advocateName = advocate ? `${advocate.firstname || ''} ${advocate.surname || ''}`.trim() : 'N/A';
  const advocateAddress = advocate?.address || 'N/A';
  const projectName = project?.projectName || 'N/A';
  const projectCity = project?.city || 'N/A';

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-GB').replace(/\//g, '-');
  };

  const size = invoice ? Number(invoice.size) : 0;
  const rate = invoice ? Number(invoice.rate) : 0;
  const total = invoice ? Number(invoice.total) : 0;
  const sgst = invoice ? Number(invoice.sgst_amount) : 0;
  const cgst = invoice ? Number(invoice.cgst_amount) : 0;
  const igst = invoice ? Number(invoice.igst_amount) : 0;

  return (
    <DashboardLayout role="agent">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          aside, header, nav, button, .no-print {
            display: none !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
            background-color: white !important;
            color: black !important;
          }
          .print-card-outer {
            border: none !important;
            box-shadow: none !important;
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .print-header-bar {
            background-color: #2b6cb0 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .print-header-text {
            color: white !important;
          }
          .print-section-header {
            font-weight: bold !important;
            border-bottom: 1px solid #cbd5e0 !important;
            padding-bottom: 2px !important;
            color: black !important;
          }
          .print-text {
            color: black !important;
          }
        }
      `}} />

      <div className="max-w-7xl mx-auto space-y-4">
        {/* Page title */}
        <h2 className="text-xl font-semibold text-slate-300 no-print">Draft Detail</h2>

        {/* Outer Card with exact layout matching screenshot */}
        <div className="bg-white text-slate-800 rounded shadow-md border border-slate-200 overflow-hidden print-card-outer">
          
          {/* 1. Header Banner */}
          <div className="bg-[#2475c9] px-4 py-2 border-b border-blue-700 print-header-bar">
            <span className="font-semibold text-sm text-white print-header-text">Draft Detail</span>
          </div>

          {/* 2. Top Controls */}
          <div className="p-4 border-b border-slate-100 flex justify-start no-print">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-[#5cb85c] hover:bg-[#4cae4c] text-white text-xs font-bold rounded flex items-center gap-1 cursor-pointer transition-all shadow"
            >
              <Printer size={12} />
              <span>PRINT</span>
            </button>
          </div>

          {/* 3. Three Column Detail Box */}
          <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-6 text-xs border-b border-slate-100 print-text">
            {/* Agent Detail */}
            <div className="space-y-2">
              <h4 className="font-bold border-b pb-1 text-[#2475c9] uppercase tracking-wider print-section-header">Agent Detail</h4>
              <div className="grid grid-cols-3 gap-y-1.5">
                <span className="font-semibold text-slate-500">Name</span>
                <span className="col-span-2">: {agentName}</span>

                <span className="font-semibold text-slate-500">Contact No</span>
                <span className="col-span-2">: {agentContact}</span>

                <span className="font-semibold text-slate-500">Firm Name</span>
                <span className="col-span-2">: {agentFirm || 'N/A'}</span>

                <span className="font-semibold text-slate-500">Address</span>
                <span className="col-span-2">: {agentAddress}</span>
              </div>
            </div>

            {/* Customer Details */}
            <div className="space-y-2">
              <h4 className="font-bold border-b pb-1 text-[#2475c9] uppercase tracking-wider print-section-header">Customer Deatils</h4>
              <div className="grid grid-cols-3 gap-y-1.5">
                <span className="font-semibold text-slate-500">Name</span>
                <span className="col-span-2">: {customerName}</span>

                <span className="font-semibold text-slate-500">Contact No</span>
                <span className="col-span-2">: {customerContact}</span>

                <span className="font-semibold text-slate-500">Email</span>
                <span className="col-span-2">: {customerEmail}</span>
              </div>
            </div>

            {/* Dates */}
            <div className="space-y-2">
              <div className="h-5" /> {/* empty spacer to align with headers */}
              <div className="grid grid-cols-3 gap-y-1.5">
                <span className="font-semibold text-slate-500">Prepared Date</span>
                <span className="col-span-2">: {formatDate(property.preparedDate)}</span>

                <span className="font-semibold text-slate-500">Sent Date</span>
                <span className="col-span-2">: {formatDate(property.sentDate)}</span>

                <span className="font-semibold text-slate-500">Accept Date</span>
                <span className="col-span-2">: {formatDate(property.acceptDate) || '—'}</span>
              </div>
            </div>
          </div>

          {/* 4. The Draft Document Frame */}
          <div className="p-4 border-b border-slate-100 print-text">
            <h4 className="font-bold text-center text-sm text-slate-800 uppercase tracking-widest mb-4">Draft</h4>
            
            {/* The actual Rich Text Content container */}
            <div 
              className="p-6 bg-slate-50 border border-slate-200 rounded leading-relaxed text-slate-800 text-sm font-sans text-justify prose max-w-none print:p-0 print:border-none print:bg-white"
              dangerouslySetInnerHTML={{ __html: property.agreementDraft || 'No draft content available.' }}
            />

            {/* Sub-label for Property/Agent Details exactly matching Image 1 */}
            <div className="mt-4 border-t border-slate-100 pt-3 text-[11px] text-slate-500 space-y-1">
              <p>
                <strong>Property Details :</strong> {formatPropertyDetailsLabel(property)}
              </p>
              <p>
                <strong>Agent Name :</strong> {agentName} <strong>Address :</strong> {agentAddress} <strong>Contact No :</strong> {agentContact}
              </p>
            </div>
          </div>

          {/* 5. Bottom Two Columns: Advocate & Billing Details */}
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-8 text-xs print-text">
            {/* Advocate Details */}
            <div className="space-y-2">
              <h4 className="font-bold border-b pb-1 text-[#2475c9] uppercase tracking-wider print-section-header">Advocate Detail</h4>
              <div className="grid grid-cols-3 gap-y-1.5">
                <span className="font-semibold text-slate-500">Name</span>
                <span className="col-span-2">: {advocateName}</span>

                <span className="font-semibold text-slate-500">Address</span>
                <span className="col-span-2">: {advocateAddress}</span>

                <span className="font-semibold text-slate-500">Project Name</span>
                <span className="col-span-2">: {projectName}</span>

                <span className="font-semibold text-slate-500">Project City</span>
                <span className="col-span-2">: {projectCity}</span>
              </div>
            </div>

            {/* Billing Details */}
            <div className="space-y-2">
              <h4 className="font-bold border-b pb-1 text-[#2475c9] uppercase tracking-wider print-section-header">Billing Details</h4>
              <div className="grid grid-cols-3 gap-y-1.5">
                <span className="font-semibold text-slate-500">Size in sq.cm</span>
                <span className="col-span-2">: {size || '—'}</span>

                <span className="font-semibold text-slate-500">Rate</span>
                <span className="col-span-2">: {rate ? rate.toFixed(2) : '—'}</span>

                <span className="font-semibold text-slate-500">Total</span>
                <span className="col-span-2">: {total ? total.toFixed(2) : '—'}</span>

                <span className="font-semibold text-slate-500">SGST 2.50%</span>
                <span className="col-span-2">: {sgst ? sgst.toFixed(2) : '0.00'}</span>

                <span className="font-semibold text-slate-500">CGST 2.50%</span>
                <span className="col-span-2">: {cgst ? cgst.toFixed(2) : '0.00'}</span>

                <span className="font-semibold text-slate-500">IGST 0.00%</span>
                <span className="col-span-2">: {igst ? igst.toFixed(2) : '0.00'}</span>
              </div>
            </div>
          </div>

          {/* 6. Footer bar with back button */}
          <div className="bg-slate-50 px-4 py-3 border-t border-slate-100 flex justify-start no-print">
            <button
              onClick={() => router.push(getBackRoute())}
              className="px-4 py-1.5 bg-[#286090] hover:bg-[#204d74] text-white text-xs font-bold rounded cursor-pointer transition-all shadow"
            >
              Back
            </button>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}

export default function ViewDraftDetailPage() {
  return (
    <Suspense fallback={
      <DashboardLayout role="agent">
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
          <Loader2 className="animate-spin text-blue-500" size={28} />
          <span>Loading draft viewer...</span>
        </div>
      </DashboardLayout>
    }>
      <ViewDraftDetailContent />
    </Suspense>
  );
}
