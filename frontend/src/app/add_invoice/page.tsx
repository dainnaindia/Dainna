"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import { FileText, Calculator, HelpCircle, Loader2, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";

function AddInvoiceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const oid = searchParams.get("oid");
  const urlPid = searchParams.get("pid");

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Working City & Projects
  const [workingCity, setWorkingCity] = useState("");
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");

  // Property Details
  const [agreementDraft, setAgreementDraft] = useState("");
  const [propertyDetail, setPropertyDetail] = useState("");

  // Billing Params (from selected project detail)
  const [advocateId, setAdvocateId] = useState<number | null>(null);
  const [stateId, setStateId] = useState<number | null>(null);
  const [rate, setRate] = useState<number>(0);
  const [handlingChargesRate, setHandlingChargesRate] = useState<number>(0);

  // Client-side measured size states
  const areaRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<number>(0);
  const [sizeWidth, setSizeWidth] = useState<number>(0);
  const [sizeHeight, setSizeHeight] = useState<number>(0);

  // Computed Financials
  const [finalRate, setFinalRate] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);
  const [cgstAmount, setCgstAmount] = useState<number>(0);
  const [sgstAmount, setSgstAmount] = useState<number>(0);
  const [grandTotal, setGrandTotal] = useState<number>(0);

  // 1. Initial Load: Fetch Property Info & User Profile
  useEffect(() => {
    if (!oid) {
      setError("Missing property reference (oid parameter).");
      setFetching(false);
      return;
    }

    const loadData = async () => {
      try {
        // Fetch property details
        const propRes = await fetch(`http://localhost:5000/api/properties/detail/${oid}`);
        const propData = await propRes.json();
        if (!propRes.ok) throw new Error(propData.Msg || "Failed to load property details");
        setAgreementDraft(propData.Property?.agreementDraft || "");
        setPropertyDetail(propData.Property?.propertyDetail || "");

        // Fetch user profile to get working city
        const profRes = await fetch("http://localhost:5000/api/users/profile");
        const profData = await profRes.json();
        if (!profRes.ok) throw new Error(profData.Error || "Failed to load user profile");
        const city = profData.User?.workingCity || "";
        setWorkingCity(city);

        // Fetch projects
        const projRes = await fetch("http://localhost:5000/api/projects");
        const projData = await projRes.json();
        if (!projRes.ok) throw new Error(projData.Error || "Failed to load projects");

        // Filter projects: same city & has advocate
        const filtered = (projData.Projects || []).filter(
          (p: any) => p.city?.toLowerCase() === city.toLowerCase() && p.advocateId !== null
        );
        setProjects(filtered);

        // Preselect project if matching urlPid
        if (urlPid) {
          const match = filtered.find((p: any) => String(p.projectId) === String(urlPid));
          if (match) {
            setSelectedProjectId(String(urlPid));
          }
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to fetch required data.");
      } finally {
        setFetching(false);
      }
    };

    loadData();
  }, [oid, urlPid]);

  // 2. Measure DOM client size of the draft container
  useEffect(() => {
    if (areaRef.current && agreementDraft) {
      // Small timeout to ensure DOM finishes rendering
      const timer = setTimeout(() => {
        if (!areaRef.current) return;
        const widthpi = areaRef.current.clientWidth;
        const lengthpi = areaRef.current.clientHeight;
        const widthm = Math.round(parseFloat(String(widthpi)) * 0.0264583333);
        const lengthm = Math.round(parseFloat(String(lengthpi)) * 0.0264583333);
        setSizeWidth(widthm);
        setSizeHeight(lengthm);
        setSize(widthm * lengthm);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [agreementDraft, propertyDetail, fetching, selectedProjectId]);

  // 3. Fetch project details when a project is selected
  useEffect(() => {
    if (!selectedProjectId) {
      setAdvocateId(null);
      setStateId(null);
      setRate(0);
      setHandlingChargesRate(0);
      return;
    }

    const fetchProjectDetails = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/billing/project-details/${selectedProjectId}`);
        const data = await res.json();
        if (res.ok) {
          setAdvocateId(data.AdvocateID);
          setStateId(data.StateID);
          setRate(data.RatePerSQMT || 0);
          setHandlingChargesRate(data.ChargesinPerc || 0);
        } else {
          setError("Failed to retrieve project billing configurations.");
        }
      } catch (err) {
        console.error(err);
        setError("Error connecting to fetch project configurations.");
      }
    };

    fetchProjectDetails();
  }, [selectedProjectId]);

  // 4. Compute Billing Calculations client-side whenever size/rates change
  useEffect(() => {
    if (!size || !rate) {
      setFinalRate(0);
      setTotal(0);
      setCgstAmount(0);
      setSgstAmount(0);
      setGrandTotal(0);
      return;
    }

    // Formula exact replication from legacy:
    // FinalRate = Rate + (Rate * HandlingChargesRate / 100)
    const finalRateVal = Math.round((rate + (rate * handlingChargesRate / 100)) * 100) / 100;
    setFinalRate(finalRateVal);

    // Total = Size * FinalRate
    const totalVal = Math.round((size * finalRateVal) * 100) / 100;
    setTotal(totalVal);

    // CGST/SGST amounts (2.5% each)
    const cgstVal = Math.round((totalVal * 0.025) * 100) / 100;
    const sgstVal = Math.round((totalVal * 0.025) * 100) / 100;
    setCgstAmount(cgstVal);
    setSgstAmount(sgstVal);

    // Grandtotal = Total + CGST + SGST
    const grandVal = Math.round((totalVal + cgstVal + sgstVal) * 100) / 100;
    setGrandTotal(grandVal);
  }, [size, rate, handlingChargesRate]);

  // 5. Submit invoice
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) {
      setError("Please select a project to proceed.");
      return;
    }
    if (advocateId === null) {
      setError("Selected project does not have an active advocate assigned.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    const payload = {
      OLBID: oid,
      AdvocateID: advocateId,
      ProjectID: selectedProjectId,
      StateID: stateId,
      Size: size,
      SizeWidth: sizeWidth,
      SizeHeight: sizeHeight,
      Rate: rate,
      HandlingChargesRate: handlingChargesRate,
    };

    try {
      const response = await fetch("http://localhost:5000/api/billing/invoices/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.Status === 2) {
        setSuccess("Invoice generated successfully! Routing to payment gateway...");
        setTimeout(() => {
          router.push(`/agent_payment?iid=${data.InvoiceID}`);
        }, 1500);
      } else {
        setError(data.Msg || "Failed to submit new invoice.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to dispatch request to the server.");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <DashboardLayout role="agent">
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
          <Loader2 className="animate-spin text-blue-500" size={28} />
          <span>Retrieving draft details and projects...</span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="agent">
      <div className="absolute top-10 right-10 w-[400px] h-[400px] rounded-full bg-blue-500/5 blur-[100px] pointer-events-none" />

      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white">Generate Invoice</h2>
          <p className="text-slate-400 text-sm mt-1">
            Choose project billing parameters and compute agreement contract fees
          </p>
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

        {/* Project Selection Bar */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl shadow-md">
          <div className="flex flex-col items-start gap-4">
            <div>
              <span className="text-slate-400 text-xs uppercase tracking-wider font-semibold block mb-1">
                City: {workingCity || "N/A"}
              </span>
              <h4 className="text-white font-bold text-base">Select Project Target</h4>
            </div>
            <div className="w-full flex flex-wrap gap-2 mt-1">
              {projects.length === 0 ? (
                <span className="text-red-400 text-sm italic">
                  No active projects with advocates in {workingCity || "your city"}.
                </span>
              ) : (
                projects.map((proj) => (
                  <button
                    key={proj.projectId}
                    type="button"
                    onClick={() => setSelectedProjectId(String(proj.projectId))}
                    className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer shadow ${
                      selectedProjectId === String(proj.projectId)
                        ? "bg-blue-600 text-white font-bold"
                        : "bg-slate-800 text-slate-350 hover:bg-slate-700/50 hover:text-white"
                    }`}
                  >
                    {proj.projectName}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {selectedProjectId && (
          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Box: Draft Visual Container */}
            <div className="lg:col-span-8 space-y-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg p-5 overflow-hidden">
                <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-3">
                  <FileText className="text-blue-400" size={18} />
                  <h3 className="font-bold text-sm text-white uppercase tracking-wider">Draft Template Visualization</h3>
                </div>
                <div className="overflow-x-auto">
                  <div
                    ref={areaRef}
                    id="area"
                    style={{ width: "8.3in" }}
                    className="p-8 bg-slate-950/60 border border-slate-850 rounded-lg text-slate-300 font-serif leading-relaxed text-xs shadow-inner min-h-[300px]"
                  >
                    <h5 className="text-center font-bold text-white mb-6 border-b border-slate-800 pb-2">
                      Draft Details
                    </h5>
                    <div
                      dangerouslySetInnerHTML={{
                        __html: agreementDraft + "<br/>" + propertyDetail,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Box: Billing Calculations Form */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg p-6 relative overflow-hidden">
                <div className="flex items-center gap-2 mb-6 border-b border-slate-800 pb-3">
                  <Calculator className="text-blue-400" size={18} />
                  <h3 className="font-bold text-sm text-white uppercase tracking-wider">Billing Calculator</h3>
                </div>

                <div className="space-y-4 text-sm text-slate-300">
                  {/* Size Display */}
                  <div className="flex justify-between items-center py-2 border-b border-slate-850">
                    <span className="text-slate-400">
                      Size in sq.cm
                      <span className="block text-[10px] text-slate-500 italic mt-0.5">
                        ({sizeWidth} &times; {sizeHeight})
                      </span>
                    </span>
                    <span className="font-bold text-white text-base">{size}</span>
                  </div>

                  {/* Rate */}
                  <div className="flex justify-between items-center py-2 border-b border-slate-850">
                    <span className="text-slate-400">Base Advocate Rate</span>
                    <span className="font-semibold text-slate-200">&#8377; {rate}</span>
                  </div>

                  {/* Handling Charges */}
                  <div className="flex justify-between items-center py-2 border-b border-slate-850">
                    <span className="text-slate-400">Handling Charges Rate</span>
                    <span className="font-semibold text-slate-200">{handlingChargesRate}%</span>
                  </div>

                  {/* Final Rate */}
                  <div className="flex justify-between items-center py-2 border-b border-slate-850">
                    <span className="text-slate-400">Final Calculated Rate</span>
                    <span className="font-semibold text-slate-200">&#8377; {finalRate}</span>
                  </div>

                  {/* Total */}
                  <div className="flex justify-between items-center py-2 border-b border-slate-850">
                    <span className="text-slate-400 font-medium">Sub-Total Amount</span>
                    <span className="font-semibold text-slate-200">&#8377; {total}</span>
                  </div>

                  {/* CGST */}
                  <div className="flex justify-between items-center py-2 border-b border-slate-850">
                    <span className="text-slate-400">CGST (2.5%)</span>
                    <span className="font-semibold text-slate-200">&#8377; {cgstAmount}</span>
                  </div>

                  {/* SGST */}
                  <div className="flex justify-between items-center py-2 border-b border-slate-850">
                    <span className="text-slate-400">SGST (2.5%)</span>
                    <span className="font-semibold text-slate-200">&#8377; {sgstAmount}</span>
                  </div>

                  {/* Grandtotal */}
                  <div className="flex justify-between items-center py-3 border-b border-slate-800 bg-slate-950/40 px-3 rounded-lg mt-2">
                    <span className="text-white font-bold">Grand Total</span>
                    <span className="font-extrabold text-blue-400 text-lg">&#8377; {grandTotal}</span>
                  </div>
                </div>

                <div className="mt-8 space-y-3">
                  <button
                    type="submit"
                    disabled={loading || !size}
                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin" size={16} />
                        <span>Generating Invoice...</span>
                      </>
                    ) : (
                      <>
                        <span>Submit Invoice</span>
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => router.push("/view_all_prepared_draft")}
                    className="w-full py-2 bg-slate-800/40 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    Back
                  </button>
                </div>
              </div>
            </div>
          </form>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function AddInvoicePage() {
  return (
    <Suspense
      fallback={
        <DashboardLayout role="agent">
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="animate-spin text-blue-500" size={28} />
            <span>Loading invoice setup forms...</span>
          </div>
        </DashboardLayout>
      }
    >
      <AddInvoiceContent />
    </Suspense>
  );
}
