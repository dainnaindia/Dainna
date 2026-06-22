"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { FileSpreadsheet, ArrowRight, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

function UpdateOpenLandContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const oid = searchParams.get('oid');

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Form Fields
  const [area, setArea] = useState('1'); // 1=Urban, 2=Rural, 3=Sector Wise
  const [stateName, setStateName] = useState('Gujarat');
  const [stateId, setStateId] = useState('12');
  const [district, setDistrict] = useState('');
  const [plotArea, setPlotArea] = useState('');

  // Conditional Fields
  const [citySurveyOffice, setCitySurveyOffice] = useState('');
  const [ward, setWard] = useState('');
  const [citySurveyNo, setCitySurveyNo] = useState('');
  const [sheetNo, setSheetNo] = useState('');
  const [taluka, setTaluka] = useState('');
  const [village, setVillage] = useState('');
  const [sectorNo, setSectorNo] = useState('');
  const [sectorPlotNo, setSectorPlotNo] = useState('');

  // Owner Details
  const [ownerFirstName, setOwnerFirstName] = useState('');
  const [ownerMiddleName, setOwnerMiddleName] = useState('');
  const [ownerLastName, setOwnerLastName] = useState('');
  const [ownerMobile, setOwnerMobile] = useState('');

  // Purchaser Details
  const [purchaserFirstName, setPurchaserFirstName] = useState('');
  const [purchaserMiddleName, setPurchaserMiddleName] = useState('');
  const [purchaserLastName, setPurchaserLastName] = useState('');
  const [purchaserMobile, setPurchaserMobile] = useState('');
  const [purchaserEmail, setPurchaserEmail] = useState('');

  useEffect(() => {
    if (!oid) {
      setError('Missing property reference (oid parameter).');
      setFetching(false);
      return;
    }

    // Fetch existing details
    fetch(`http://localhost:5000/api/properties/detail/${oid}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to retrieve property details');
        return res.json();
      })
      .then((data) => {
        const prop = data.Property;
        if (prop) {
          setArea(String(prop.area || '1'));
          setStateId(String(prop.stateId || '12'));
          setDistrict(prop.district || '');
          setPlotArea(prop.plotArea || '');
          setCitySurveyOffice(prop.citySurveyOffice || '');
          setWard(prop.ward || '');
          setCitySurveyNo(prop.citySurveyNo || '');
          setSheetNo(prop.sheetNo || '');
          setTaluka(prop.taluka || '');
          setVillage(prop.village || '');
          setSectorNo(prop.sectorNo || '');
          setSectorPlotNo(prop.sectorPlotNo || '');
          setOwnerFirstName(prop.ownerFirstName || '');
          setOwnerMiddleName(prop.ownerMiddleName || '');
          setOwnerLastName(prop.ownerLastName || '');
          setOwnerMobile(prop.ownerMobileNo || '');
          setPurchaserFirstName(prop.purchaserFirstName || '');
          setPurchaserMiddleName(prop.purchaserMiddleName || '');
          setPurchaserLastName(prop.purchaserLastName || '');
          setPurchaserMobile(prop.purchaserMobileNo || '');
          setPurchaserEmail(prop.purchaserEmail || '');
        }
        setFetching(false);
      })
      .catch((err) => {
        console.error(err);
        setError('Failed to fetch referenced property info.');
        setFetching(false);
      });
  }, [oid]);

  const handlePlotAreaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputVal = e.target.value;
    const digits = inputVal.replace(/\D/g, '').slice(0, 6);
    let formatted = '';
    if (digits.length > 0) {
      formatted += digits.substring(0, 2);
    }
    if (digits.length > 2) {
      formatted += '-' + digits.substring(2, 4);
    }
    if (digits.length > 4) {
      formatted += '-' + digits.substring(4, 6);
    }
    setPlotArea(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!/^\d{2}-\d{2}-\d{2}$/.test(plotArea)) {
      setError('Plot Area must be in XX-XX-XX format (e.g., 99-99-99)');
      setLoading(false);
      return;
    }

    const payload = {
      Area: area,
      StateID: stateId,
      District: district,
      PlotArea: plotArea,
      CitySurveyOffice: area === '1' ? citySurveyOffice : '',
      Ward: area === '1' ? ward : '',
      CitySurveyNo: area !== '3' ? citySurveyNo : '',
      SheetNo: area === '1' ? sheetNo : '',
      Taluka: area !== '1' ? taluka : '',
      Village: area !== '1' ? village : '',
      SectorNo: area === '3' ? sectorNo : '',
      SectorPlotNo: area !== '1' ? sectorPlotNo : '',
      OwnerFirstName: ownerFirstName,
      OwnerMiddleName: ownerMiddleName,
      OwnerLastName: ownerLastName,
      OwnerMobile: ownerMobile,
      PurchaserFirstName: purchaserFirstName,
      PurchaserMiddleName: purchaserMiddleName,
      PurchaserLastName: purchaserLastName,
      PurchaserMobile: purchaserMobile,
      PurchaserEmail: purchaserEmail
    };

    try {
      const response = await fetch(`http://localhost:5000/api/properties/update-ol/${oid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.Status === 4) {
        setSuccess('Open Land record updated successfully! Redirecting...');
        setTimeout(() => {
          router.push('/view_all_olb');
        }, 1500);
      } else {
        setError(data.Msg || 'Failed to update Open Land record.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection to the server failed. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <DashboardLayout role="agent">
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
          <Loader2 className="animate-spin text-blue-500" size={28} />
          <span>Retrieving open land details...</span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="agent">
      <div className="absolute top-10 right-10 w-[400px] h-[400px] rounded-full bg-blue-500/5 blur-[100px] pointer-events-none" />

      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white">Update Open Land</h2>
          <p className="text-slate-400 text-sm mt-1">Dainna Agent Operations Console</p>
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

        <form onSubmit={handleSubmit} className="space-y-6 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl relative overflow-hidden">
          <div className="flex items-center gap-3 mb-6 border-b border-slate-800 pb-4">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
              <FileSpreadsheet size={24} />
            </div>
            <h3 className="font-bold text-lg text-white">Open Land Details</h3>
          </div>

          {/* Area Selection Radios */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-1">
              <label className="block text-slate-300 text-sm font-semibold mb-2">Area Type</label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                  <input
                    type="radio"
                    name="area"
                    value="1"
                    checked={area === '1'}
                    onChange={() => setArea('1')}
                    className="accent-blue-500"
                  />
                  <span>Urban</span>
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                  <input
                    type="radio"
                    name="area"
                    value="2"
                    checked={area === '2'}
                    onChange={() => setArea('2')}
                    className="accent-blue-500"
                  />
                  <span>Rural</span>
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                  <input
                    type="radio"
                    name="area"
                    value="3"
                    checked={area === '3'}
                    onChange={() => setArea('3')}
                    className="accent-blue-500"
                  />
                  <span>Sector Wise</span>
                </label>
              </div>
            </div>

            {/* General Property Info */}
            <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-300 text-xs font-semibold mb-1">State</label>
                <input
                  type="text"
                  value={stateName}
                  readOnly
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-400 text-sm"
                />
              </div>
              <div>
                <label className="block text-slate-300 text-xs font-semibold mb-1">District</label>
                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="Enter District"
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-700 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 text-xs font-semibold mb-1">Plot Area (Acre-Guntha-SqYards)</label>
                <input
                  type="text"
                  value={plotArea}
                  onChange={handlePlotAreaChange}
                  placeholder="XX-XX-XX"
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-700 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Conditional Layouts based on Area Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-slate-950/40 p-4 border border-slate-800/60 rounded-lg">
            {area === '1' && (
              <>
                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-1">City Survey Office</label>
                  <input
                    type="text"
                    value={citySurveyOffice}
                    onChange={(e) => setCitySurveyOffice(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-1">Ward</label>
                  <input
                    type="text"
                    value={ward}
                    onChange={(e) => setWard(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-1">City Survey No</label>
                  <input
                    type="text"
                    value={citySurveyNo}
                    onChange={(e) => setCitySurveyNo(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-1">Sheet No</label>
                  <input
                    type="text"
                    value={sheetNo}
                    onChange={(e) => setSheetNo(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm"
                  />
                </div>
              </>
            )}

            {area === '2' && (
              <>
                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-1">Taluka</label>
                  <input
                    type="text"
                    value={taluka}
                    onChange={(e) => setTaluka(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-1">Village</label>
                  <input
                    type="text"
                    value={village}
                    onChange={(e) => setVillage(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-1">Survey No</label>
                  <input
                    type="text"
                    value={citySurveyNo}
                    onChange={(e) => setCitySurveyNo(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-1">Plot No</label>
                  <input
                    type="text"
                    value={sectorPlotNo}
                    onChange={(e) => setSectorPlotNo(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm"
                  />
                </div>
              </>
            )}

            {area === '3' && (
              <>
                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-1">Taluka</label>
                  <input
                    type="text"
                    value={taluka}
                    onChange={(e) => setTaluka(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-1">Village</label>
                  <input
                    type="text"
                    value={village}
                    onChange={(e) => setVillage(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-1">Sector No</label>
                  <input
                    type="text"
                    value={sectorNo}
                    onChange={(e) => setSectorNo(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-1">Plot No</label>
                  <input
                    type="text"
                    value={sectorPlotNo}
                    onChange={(e) => setSectorPlotNo(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm"
                  />
                </div>
              </>
            )}
          </div>

          <div className="border-t border-slate-800 pt-6">
            <h4 className="text-white font-semibold mb-4 text-sm tracking-wide">Owner Details</h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-slate-400 text-xs font-medium mb-1">First Name</label>
                <input
                  type="text"
                  value={ownerFirstName}
                  onChange={(e) => setOwnerFirstName(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-xs font-medium mb-1">Middle Name</label>
                <input
                  type="text"
                  value={ownerMiddleName}
                  onChange={(e) => setOwnerMiddleName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-xs font-medium mb-1">Last Name</label>
                <input
                  type="text"
                  value={ownerLastName}
                  onChange={(e) => setOwnerLastName(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-xs font-medium mb-1">Mobile No</label>
                <input
                  type="text"
                  value={ownerMobile}
                  onChange={(e) => setOwnerMobile(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-6">
            <h4 className="text-white font-semibold mb-4 text-sm tracking-wide">Purchaser Details</h4>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
              <div>
                <label className="block text-slate-400 text-xs font-medium mb-1">First Name</label>
                <input
                  type="text"
                  value={purchaserFirstName}
                  onChange={(e) => setPurchaserFirstName(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-xs font-medium mb-1">Middle Name</label>
                <input
                  type="text"
                  value={purchaserMiddleName}
                  onChange={(e) => setPurchaserMiddleName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-xs font-medium mb-1">Last Name</label>
                <input
                  type="text"
                  value={purchaserLastName}
                  onChange={(e) => setPurchaserLastName(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-xs font-medium mb-1">Mobile No</label>
                <input
                  type="text"
                  value={purchaserMobile}
                  onChange={(e) => setPurchaserMobile(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-xs font-medium mb-1">Email ID</label>
                <input
                  type="email"
                  value={purchaserEmail}
                  onChange={(e) => setPurchaserEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => router.push('/view_all_olb')}
              className="px-4 py-2 bg-slate-850 hover:bg-slate-800 text-slate-300 text-sm font-medium rounded-lg"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold rounded-lg text-sm transition-all flex items-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <span>Save Changes</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}

export default function UpdateOpenLandPage() {
  return (
    <Suspense fallback={
      <DashboardLayout role="agent">
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
          <Loader2 className="animate-spin text-blue-500" size={28} />
          <span>Loading open land update editor...</span>
        </div>
      </DashboardLayout>
    }>
      <UpdateOpenLandContent />
    </Suspense>
  );
}
