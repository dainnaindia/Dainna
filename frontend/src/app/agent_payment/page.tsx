"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import { 
  QrCode, 
  FileText, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Printer, 
  ShieldCheck, 
  Sparkles,
  ArrowRight,
  TrendingUp,
  Receipt,
  CreditCard
} from "lucide-react";

function AgentPaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const iid = searchParams.get("iid");

  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [simulating, setSimulating] = useState(false);
  const [gatewayTab, setGatewayTab] = useState<"free" | "charged">("free");
  const [showMockGateway, setShowMockGateway] = useState(false);
  const [mockGatewayType, setMockGatewayType] = useState<"card" | "netbanking" | "upi" | "wallet">("card");
  const [processingPayment, setProcessingPayment] = useState(false);

  // Invoices and UPI Details
  const [invoice, setInvoice] = useState<any>(null);
  const [upiDetails, setUpiDetails] = useState<any>(null);

  // Poll status interval ID
  const [pollingStatus, setPollingStatus] = useState<string>("waiting"); // "waiting" | "paid"

  const fetchInvoiceDetails = async () => {
    if (!iid) {
      setError("Missing invoice reference (iid parameter).");
      setFetching(false);
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/billing/invoices/${iid}`);
      const data = await res.json();
      if (res.ok && data.Status === 100) {
        setInvoice(data.Invoice);
        if (data.Invoice.paymentStatus === 1) {
          setPollingStatus("paid");
        }
      } else {
        setError(data.Msg || "Failed to retrieve invoice details.");
      }
    } catch (err) {
      console.error(err);
      setError("Connection to the server failed. Verify the backend is running.");
    }
  };

  const loadUpiGateway = async (selectedGateway: "free" | "charged" = "free") => {
    if (!iid) return;
    try {
      const res = await fetch(`http://localhost:5000/api/upi/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId: iid, gateway: selectedGateway }),
      });
      const data = await res.json();
      if (res.ok && data.Status === 100) {
        setUpiDetails(data);
      } else {
        console.error("Payment gateway error:", data.Msg);
      }
    } catch (err) {
      console.error("Failed to connect to payment gateway API:", err);
    } finally {
      setFetching(false);
    }
  };

  // 1. Initial Load: Fetch invoice details once
  useEffect(() => {
    fetchInvoiceDetails();
  }, [iid]);

  // 2. Load payment details whenever tab or invoice changes
  useEffect(() => {
    if (invoice) {
      loadUpiGateway(gatewayTab);
    }
  }, [gatewayTab, invoice?.invoiceId]);

  // 2. Poll Status Check Hook
  useEffect(() => {
    if (!iid || pollingStatus === "paid" || error) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/upi/check-status/${iid}`);
        const data = await res.json();
        if (res.ok && data.Status === 100) {
          if (data.PaymentStatus === 1) {
            setPollingStatus("paid");
            // Refresh main invoice details to fetch backend saved splits (adv_amount, utr)
            fetchInvoiceDetails();
            clearInterval(interval);
          }
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [iid, pollingStatus, error]);

  // 3. Developer Sandbox: Simulate payment success webhook
  const handleSimulatePayment = async () => {
    if (!iid) return;
    setSimulating(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("http://localhost:5000/api/upi/simulate-success", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId: iid }),
      });

      const data = await response.json();

      if (data.Status === 100) {
        setSuccess(`Mock checkout simulated! UTR recorded: ${data.Utr}`);
        setPollingStatus("paid");
        // Re-fetch database states
        await fetchInvoiceDetails();
      } else {
        setError(data.Msg || "Failed to trigger checkout simulation.");
      }
    } catch (err) {
      console.error(err);
      setError("Server connection failed during simulation.");
    } finally {
      setSimulating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (fetching) {
    return (
      <DashboardLayout role="agent">
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
          <Loader2 className="animate-spin text-blue-500" size={28} />
          <span>Connecting to UPI Gateway secure channel...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (error && !invoice) {
    return (
      <DashboardLayout role="agent">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => router.push("/view_all_prepared_draft")}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm transition-colors cursor-pointer"
          >
            Go to Prepared Drafts
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const invoiceAmount = invoice?.grandtotal || 0;
  const advocateCut = invoice?.rate && invoice?.size ? Math.round((Number(invoice.size) * invoice.rate) * 100) / 100 : 0;
  const adminCut = Math.round((invoiceAmount - advocateCut) * 100) / 100;
  const displayAmount = upiDetails?.Amount || invoiceAmount;

  return (
    <DashboardLayout role="agent">
      <div className="absolute top-10 right-10 w-[400px] h-[400px] rounded-full bg-blue-500/5 blur-[100px] pointer-events-none" />

      {/* SUCCESS RECEIPT STATE */}
      {pollingStatus === "paid" ? (
        <div className="max-w-3xl mx-auto space-y-6 print:mt-0 print:mx-0 print:w-full">
          {/* Header Banner - hidden on print */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-500 rounded-2xl shadow-xl p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 print:hidden">
            <div className="flex items-center gap-4 text-center md:text-left flex-col md:flex-row">
              <div className="bg-white/20 p-4 rounded-full">
                <ShieldCheck className="text-white animate-pulse" size={42} />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight">Payment Completed Successfully</h2>
                <p className="text-emerald-100 text-sm mt-1">Transaction verified via UPI Gateway. Split cuts deposited.</p>
              </div>
            </div>
            <div className="flex gap-3 shrink-0">
              <button
                onClick={handlePrint}
                className="px-4 py-2.5 bg-white text-emerald-800 font-bold rounded-lg text-xs transition-transform hover:scale-105 flex items-center gap-2 cursor-pointer shadow-md"
              >
                <Printer size={15} />
                <span>Print Receipt</span>
              </button>
              <button
                onClick={() => router.push("/view_all_sent_draft")}
                className="px-4 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-lg text-xs transition-transform hover:scale-105 flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <span>Sent Drafts</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>

          {/* PRINTABLE RECEIPT CARD */}
          <div id="receipt-card" className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8 relative overflow-hidden print:bg-white print:border-none print:shadow-none print:p-0 print:text-black">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full pointer-events-none print:hidden" />
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b border-slate-800 print:border-slate-300 gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Receipt className="text-emerald-400 print:text-emerald-600" size={24} />
                  <span className="font-extrabold text-xl text-white print:text-black uppercase tracking-wider">DAINNA TRANSACTION RECEIPT</span>
                </div>
                <p className="text-slate-400 print:text-slate-500 text-xs mt-1">Receipt for dynamic automated invoice</p>
              </div>
              <div className="text-left md:text-right">
                <span className="block text-[10px] text-slate-500 uppercase tracking-widest font-bold">Transaction Ref UTR</span>
                <span className="text-emerald-450 print:text-emerald-700 font-extrabold text-sm font-mono tracking-wider">{invoice?.transactionRefNo || "N/A"}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-8 border-b border-slate-850 print:border-slate-200">
              <div className="space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 print:text-slate-600">Property Details</h4>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between md:justify-start gap-4">
                    <span className="text-slate-500 w-24">Project:</span>
                    <span className="text-white print:text-black font-semibold">{invoice?.projectName}</span>
                  </div>
                  <div className="flex justify-between md:justify-start gap-4">
                    <span className="text-slate-500 w-24">City Survey:</span>
                    <span className="text-slate-300 print:text-slate-800">{invoice?.projectCity}</span>
                  </div>
                  <div className="flex justify-between md:justify-start gap-4">
                    <span className="text-slate-500 w-24">Property Size:</span>
                    <span className="text-slate-300 print:text-slate-800 font-semibold">{invoice?.size} Sq. Mt.</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 print:text-slate-600">Invoice Information</h4>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between md:justify-start gap-4">
                    <span className="text-slate-500 w-24">Invoice No:</span>
                    <span className="text-slate-300 print:text-slate-850 font-bold">{invoice?.invNo}</span>
                  </div>
                  <div className="flex justify-between md:justify-start gap-4">
                    <span className="text-slate-500 w-24">Payment Date:</span>
                    <span className="text-slate-300 print:text-slate-800">
                      {invoice?.invoiceDate ? new Date(invoice.invoiceDate).toLocaleString() : new Date().toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between md:justify-start gap-4">
                    <span className="text-slate-500 w-24">Advocate:</span>
                    <span className="text-white print:text-black font-semibold">{invoice?.advocateName}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Split Ledger details */}
            <div className="py-6 border-b border-slate-850 print:border-slate-200">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 print:text-slate-600 mb-4 flex items-center gap-1.5">
                <TrendingUp size={14} className="text-blue-400" />
                <span>Split Payout Allocation Ledger</span>
              </h4>
              <div className="bg-slate-950/50 print:bg-slate-100 border border-slate-850 print:border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <span className="text-slate-400 print:text-slate-700">Admin Cut (Handling Charges & Tax)</span>
                  </div>
                  <span className="text-white print:text-black font-mono font-bold">₹ {adminCut.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm border-t border-slate-900 print:border-slate-200 pt-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-slate-400 print:text-slate-700">Advocate Cut (Base Rate Share: {invoice?.size} sqm * ₹{invoice?.rate})</span>
                  </div>
                  <span className="text-emerald-400 print:text-emerald-700 font-mono font-bold">₹ {advocateCut.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Total Section */}
            <div className="flex justify-between items-center pt-6">
              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-extrabold block">Grand Total Paid</span>
                <span className="text-xs text-emerald-500 print:text-emerald-600 font-semibold block">Paid via UPI Gateway Checkout</span>
              </div>
              <span className="text-3xl font-extrabold text-white print:text-black font-sans">
                ₹ {invoiceAmount}
              </span>
            </div>

            {/* Print Footer */}
            <div className="hidden print:block text-center mt-12 text-[10px] text-slate-400">
              This receipt is automatically generated and confirmed via secure digital webhook callbacks. No signature required.
            </div>
          </div>
        </div>
      ) : (
        /* PAYMENT PROCESSOR SCAN QR STATE */
        <div className="max-w-5xl mx-auto space-y-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/15 flex items-center gap-1">
                <Sparkles size={11} />
                <span>Checkout Portal v2.1</span>
              </span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white font-sans mt-2">Dynamic Checkout Portal</h2>
            <p className="text-slate-400 text-sm mt-1">Complete your payment using any UPI application or our card/netbanking gateway. Verification is instant.</p>
          </div>

          {/* Gateway Selector Tabs */}
          <div className="flex border-b border-slate-800 gap-6 no-print">
            <button
              onClick={() => setGatewayTab("free")}
              className={`pb-3 text-sm font-bold transition-all relative border-b-2 hover:text-white ${
                gatewayTab === "free"
                  ? "text-blue-400 border-blue-500"
                  : "text-slate-400 border-transparent"
              }`}
            >
              Option A: Direct UPI QR (Free)
            </button>
            <button
              onClick={() => setGatewayTab("charged")}
              className={`pb-3 text-sm font-bold transition-all relative border-b-2 hover:text-white ${
                gatewayTab === "charged"
                  ? "text-blue-400 border-blue-500"
                  : "text-slate-400 border-transparent"
              }`}
            >
              Option B: Charged PG Gateway (Absorb Fees)
            </button>
          </div>

          {success && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-3 animate-fade-in">
              <CheckCircle2 size={18} className="shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3 animate-fade-in">
              <AlertCircle size={18} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Invoice Summary Details */}
            <div className="lg:col-span-6 space-y-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg p-6 relative overflow-hidden">
                <div className="flex items-center gap-2 mb-6 border-b border-slate-800 pb-3">
                  <FileText className="text-blue-400" size={18} />
                  <h3 className="font-bold text-sm text-white uppercase tracking-wider">Invoice Details</h3>
                </div>

                <div className="space-y-4 text-sm text-slate-350">
                  <div className="grid grid-cols-3 py-2 border-b border-slate-850">
                    <span className="text-slate-400 font-semibold col-span-1">Project Name</span>
                    <span className="text-white font-bold col-span-2">{invoice?.projectName}</span>
                  </div>
                  <div className="grid grid-cols-3 py-2 border-b border-slate-850">
                    <span className="text-slate-400 font-semibold col-span-1">Invoice No</span>
                    <span className="text-slate-200 col-span-2">{invoice?.invNo}</span>
                  </div>
                  <div className="grid grid-cols-3 py-2 border-b border-slate-850">
                    <span className="text-slate-400 font-semibold col-span-1">Property Size</span>
                    <span className="text-slate-300 col-span-2">{invoice?.size} Sq. Mt.</span>
                  </div>
                  <div className="grid grid-cols-3 py-2 border-b border-slate-850">
                    <span className="text-slate-400 font-semibold col-span-1">Total Amount</span>
                    <span className="text-blue-400 font-extrabold text-lg col-span-2">₹ {displayAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Developer Sandbox Options */}
              <div className="bg-slate-950/40 border border-slate-800 border-dashed rounded-xl p-6 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-300">Developer Testing Sandbox</h4>
                </div>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Since this application runs in local development mode, click the simulation button below to invoke a mock webhook transaction. This triggers auto-recording, status updates, and splits instantly.
                </p>
                <button
                  type="button"
                  onClick={handleSimulatePayment}
                  disabled={simulating}
                  className="w-full py-2.5 px-4 bg-amber-600/10 hover:bg-amber-600/25 border border-amber-500/20 text-amber-300 font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {simulating ? (
                    <>
                      <Loader2 className="animate-spin" size={14} />
                      <span>Simulating Checkout...</span>
                    </>
                  ) : (
                    <>
                      <span>Simulate Successful UPI webhook Payment</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Right: Payment QR & Form Submission */}
            <div className="lg:col-span-6 space-y-6">
              {gatewayTab === "free" ? (
                /* Scan Box (Option A) */
                <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg p-6 relative overflow-hidden flex flex-col items-center">
                  <div className="flex items-center gap-2 mb-6 w-full border-b border-slate-800 pb-3 justify-center">
                    <QrCode className="text-blue-400" size={18} />
                    <h3 className="font-bold text-sm text-white uppercase tracking-wider">Scan UPI QR Code</h3>
                  </div>

                  {upiDetails?.QrCodeUrl ? (
                    <div className="bg-white p-4 rounded-xl border border-slate-800/20 max-w-[280px]">
                      <img src={upiDetails.QrCodeUrl} alt="UPI Payment QR Code" className="w-[250px] h-[250px]" />
                    </div>
                  ) : (
                    <div className="w-[250px] h-[250px] bg-slate-950 border border-slate-850 rounded-xl flex items-center justify-center">
                      <Loader2 className="animate-spin text-blue-500" size={24} />
                    </div>
                  )}

                  <div className="mt-6 space-y-1.5 text-center">
                    <span className="block text-[10px] text-slate-500 uppercase tracking-widest font-bold">UPI VPA merchant Address</span>
                    <span className="text-white font-mono font-bold text-xs tracking-wider">
                      {upiDetails?.MerchantUpiId || "Loading VPA..."}
                    </span>
                  </div>

                  {/* Mobile intent button */}
                  {upiDetails?.UpiUri && (
                    <a
                      href={upiDetails.UpiUri}
                      className="mt-6 w-full md:hidden py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-colors text-center inline-block cursor-pointer shadow-md"
                    >
                      Open with UPI Mobile App
                    </a>
                  )}

                  <div className="mt-6 p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl text-center w-full flex items-center justify-center gap-2">
                    <Loader2 className="animate-spin text-blue-400 shrink-0" size={14} />
                    <span className="text-[11px] font-semibold text-blue-350">
                      Listening for UPI Gateway webhook response...
                    </span>
                  </div>
                </div>
              ) : (
                /* Charged Payment Gateway (Option B) */
                <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg p-6 relative overflow-hidden flex flex-col">
                  <div className="flex items-center gap-2 mb-6 w-full border-b border-slate-800 pb-3 justify-center">
                    <CreditCard className="text-blue-400" size={18} />
                    <h3 className="font-bold text-sm text-white uppercase tracking-wider">Charged Payment Gateway</h3>
                  </div>

                  <div className="space-y-4 text-sm text-slate-350">
                    <div className="flex justify-between py-2 border-b border-slate-850">
                      <span className="text-slate-400 font-semibold">Base Invoice Amount</span>
                      <span className="text-white font-bold">₹ {upiDetails?.BaseAmount?.toFixed(2) || "0.00"}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-850">
                      <span className="text-slate-400 font-semibold">Advocate Payout Flat Fee</span>
                      <span className="text-white font-bold">₹ {upiDetails?.PayoutFee?.toFixed(2) || "11.80"}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-slate-850">
                      <span className="text-slate-400 font-semibold">PG Processing Fee (2.36%)</span>
                      <span className="text-white font-bold">₹ {upiDetails?.PgFee?.toFixed(2) || "0.00"}</span>
                    </div>
                    <div className="flex justify-between py-3 border-b border-slate-800 items-center">
                      <span className="text-slate-400 font-bold text-base">Total Payable</span>
                      <span className="text-emerald-400 font-extrabold text-2xl font-sans">
                        ₹ {upiDetails?.Amount?.toFixed(2) || "0.00"}
                      </span>
                    </div>
                  </div>

                  <p className="text-slate-400 text-xs mt-4 leading-relaxed">
                    By proceeding, you agree to absorb all collection and automatic bank payout charges. Supported payment methods include Credit/Debit Cards, Netbanking, Wallets, and PG-routed UPI.
                  </p>

                  <button
                    type="button"
                    onClick={() => setShowMockGateway(true)}
                    className="mt-6 w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-extrabold rounded-xl text-sm transition-colors text-center inline-block cursor-pointer shadow-lg shadow-blue-500/20"
                  >
                    Proceed to Checkout
                  </button>

                  <div className="mt-4 p-4 bg-slate-950/50 border border-slate-850 rounded-xl text-center w-full flex items-center justify-center gap-2">
                    <ShieldCheck className="text-emerald-400 shrink-0" size={14} />
                    <span className="text-[10px] font-semibold text-slate-400">
                      Secured by PCI-DSS Compliant Gateway Integration
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mock Payment Gateway Modal */}
      {showMockGateway && upiDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 no-print select-none animate-fadeIn">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden relative">
            {/* Header */}
            <div className="p-6 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <CreditCard className="text-blue-500" size={20} />
                  <span>Secure Payment Portal</span>
                </h3>
                <p className="text-slate-400 text-xs mt-1">Invoice: {upiDetails.InvoiceNo}</p>
              </div>
              <button 
                onClick={() => setShowMockGateway(false)}
                className="text-slate-400 hover:text-white text-sm bg-slate-800 hover:bg-slate-750 px-3 py-1.5 rounded-lg font-semibold cursor-pointer transition-colors"
              >
                Cancel
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Amount Bar */}
              <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 flex justify-between items-center">
                <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Amount Payable</span>
                <span className="text-xl font-black text-emerald-400">₹ {upiDetails.Amount?.toFixed(2)}</span>
              </div>

              {/* Payment Methods */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  { id: "card", label: "Card" },
                  { id: "netbanking", label: "Netbanking" },
                  { id: "upi", label: "UPI" },
                  { id: "wallet", label: "Wallet" }
                ].map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setMockGatewayType(method.id as any)}
                    className={`py-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                      mockGatewayType === method.id
                        ? "bg-blue-600/10 border-blue-500 text-blue-400"
                        : "bg-slate-950/40 border-slate-800/80 text-slate-400 hover:text-white"
                    }`}
                  >
                    <span className="uppercase">{method.label}</span>
                  </button>
                ))}
              </div>

              {/* Form Input fields depending on method */}
              <div className="bg-slate-950/50 border border-slate-850 rounded-xl p-6 min-h-[160px] flex flex-col justify-center">
                {mockGatewayType === "card" && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-500 uppercase tracking-widest font-extrabold">Card Number</label>
                      <input 
                        type="text" 
                        placeholder="4111 2222 3333 4444" 
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 placeholder-slate-600 font-mono"
                        defaultValue="4111 2222 3333 4444"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-500 uppercase tracking-widest font-extrabold">Expiry Date</label>
                        <input 
                          type="text" 
                          placeholder="MM/YY" 
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 placeholder-slate-600 font-mono"
                          defaultValue="12/28"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-500 uppercase tracking-widest font-extrabold">CVV</label>
                        <input 
                          type="password" 
                          placeholder="***" 
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 placeholder-slate-600 font-mono"
                          defaultValue="123"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {mockGatewayType === "netbanking" && (
                  <div className="space-y-3">
                    <label className="text-[10px] text-slate-500 uppercase tracking-widest font-extrabold block">Select Bank</label>
                    <select className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500">
                      <option>SBI Netbanking</option>
                      <option>HDFC Bank</option>
                      <option>ICICI Bank</option>
                      <option>Axis Bank</option>
                    </select>
                  </div>
                )}

                {mockGatewayType === "upi" && (
                  <div className="space-y-3">
                    <label className="text-[10px] text-slate-500 uppercase tracking-widest font-extrabold block">Enter UPI ID</label>
                    <input 
                      type="text" 
                      placeholder="username@okaxis" 
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 placeholder-slate-600 font-mono"
                      defaultValue="agent@okaxis"
                    />
                  </div>
                )}

                {mockGatewayType === "wallet" && (
                  <div className="space-y-3">
                    <label className="text-[10px] text-slate-500 uppercase tracking-widest font-extrabold block">Select Wallet</label>
                    <select className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500">
                      <option>Paytm</option>
                      <option>PhonePe Wallet</option>
                      <option>Amazon Pay</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 border-t border-slate-800 bg-slate-900/40 flex justify-end gap-3">
              <button
                type="button"
                onClick={async () => {
                  setProcessingPayment(true);
                  // Call simulation success on the backend
                  try {
                    const res = await fetch("http://localhost:5000/api/upi/simulate-success", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ 
                        invoiceId: upiDetails.InvoiceId,
                        utr: `PG-REF-${Math.floor(100000000000 + Math.random() * 900000000000)}`
                      }),
                    });
                    const data = await res.json();
                    if (res.ok && data.Status === 100) {
                      setSuccess(`Payment Successful! Transaction Reference recorded.`);
                      setPollingStatus("paid");
                      await fetchInvoiceDetails();
                      setShowMockGateway(false);
                    } else {
                      setError(data.Msg || "Mock checkout transaction failed.");
                    }
                  } catch (e) {
                    setError("Communication failed with the simulation endpoint.");
                  } finally {
                    setProcessingPayment(false);
                  }
                }}
                disabled={processingPayment}
                className="py-3 px-6 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-2 shadow-lg shadow-emerald-600/15"
              >
                {processingPayment ? (
                  <>
                    <Loader2 className="animate-spin" size={14} />
                    <span>Processing Payment...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={14} />
                    <span>Confirm & Pay Now</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default function AgentPaymentPage() {
  return (
    <Suspense
      fallback={
        <DashboardLayout role="agent">
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="animate-spin text-blue-500" size={28} />
            <span>Loading secure payment tunnel...</span>
          </div>
        </DashboardLayout>
      }
    >
      <AgentPaymentContent />
    </Suspense>
  );
}
