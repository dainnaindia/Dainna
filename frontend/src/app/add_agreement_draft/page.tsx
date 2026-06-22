"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  FileText, Loader2, AlertCircle, CheckCircle2, ChevronRight, FileCheck,
  Undo, Redo, Scissors, Copy, Bold, Italic, Underline, Strikethrough, 
  Subscript, Superscript, Type, List, ListOrdered, AlignLeft, 
  AlignCenter, AlignRight, AlignJustify, Table, Palette, Highlighter
} from 'lucide-react';

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
  citySurveyOffice?: string | null;
  ward?: string | null;
  citySurveyNo?: string | null;
  sheetNo?: string | null;
  taluka?: string | null;
  village?: string | null;
  sectorNo?: string | null;
  sectorPlotNo?: string | null;
  areaSqMt?: string | null;
}

function AddAgreementDraftContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const oid = searchParams.get('oid');

  const [loading, setLoading] = useState(false);
  const [fetchingProperty, setFetchingProperty] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [property, setProperty] = useState<PropertyDetails | null>(null);
  const [agentProfile, setAgentProfile] = useState<any>(null);
  const [generatedInvoiceId, setGeneratedInvoiceId] = useState('');

  useEffect(() => {
    fetch('http://localhost:5000/api/users/profile', { credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch user profile');
        return res.json();
      })
      .then((data) => {
        setAgentProfile(data.User);
      })
      .catch((err) => {
        console.error('Error fetching profile:', err);
      });
  }, []);

  // Draft Parameters
  const [step, setStep] = useState(1); // 1 = Selection, 2 = Editor
  const [language, setLanguage] = useState('english');
  const [draftType, setDraftType] = useState('2'); // 1 = Customize, 2 = Readymade

  // Editor Content
  const [draftContent, setDraftContent] = useState('');
  const [initialContent, setInitialContent] = useState('');

  const editorRef = React.useRef<HTMLDivElement>(null);
  const savedRangeRef = React.useRef<Range | null>(null);

  useEffect(() => {
    const handleSelectionChange = () => {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        if (editorRef.current && editorRef.current.contains(range.commonAncestorContainer)) {
          savedRangeRef.current = range;
        }
      }
    };
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, []);

  const restoreSelection = () => {
    if (savedRangeRef.current) {
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(savedRangeRef.current);
      }
    }
  };

  const [showTablePop, setShowTablePop] = useState(false);
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);
  const [showColorPop, setShowColorPop] = useState(false);
  const [showBgColorPop, setShowBgColorPop] = useState(false);
  const [showCharPop, setShowCharPop] = useState(false);

  const colors = [
    '#000000', '#434343', '#666666', '#999999', '#cccccc', '#efefef', '#ffffff',
    '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#9900ff'
  ];

  const specialChars = ['₹', '&', '§', '©', '®', '™', '°', '±', 'µ', '¶', '½', '¼', '¾', 'α', 'β', 'γ', 'Δ', 'π', 'Ω'];

  // Preloaded Templates
  const templates: Record<string, string> = {
    english: "The Allottee hereby agrees to purchase from the Promoter and the Promoter hereby agrees to sell to the Allottee Apartment/Plot admeasuring .... Square Meters of area, with exclusive right to use and occupy the property located in district .... for the consideration of Rs. ..../- which the price is exclusive of stamp duty, registration fees, GST and other taxes. The sale is on the basis of agreed terms. The Allottee consents to the same.",
    marathi: "वाटपदार याद्वारे प्रवर्तकाकडून खरेदी करण्यास सहमती दर्शवतो आणि प्रवर्तक याद्वारे वाटपदारास जिल्हा .... मधील क्षेत्रफळ .... चौ.मी. असलेले अपार्टमेंट/प्लॉट विकण्यास सहमती देतो. मोबदला रक्कम रु. ..../- असून यामध्ये मुद्रांक शुल्क, नोंदणी फी आणि इतर शासकीय करांचा समावेश नाही. दोन्ही पक्षकार या अटींना सहमती दर्शवत आहेत.",
    gujarati: "અલોટી આથી પ્રમોટર પાસેથી ખરીદવા માટે સંમત થાય છે અને પ્રમોટર આથી અલોટીને જીલ્લા .... માં આવેલ ક્ષેત્રફળ .... ચોરસ મીટર વાળું એપાર્ટમેન્ટ/પ્લોટ વેચવા માટે સંમત થાય છે. જેની કિંમત રૂ. ..../- નક્કી કરવામાં આવી છે, જેમાં સ્ટેમ્પ ડ્યુટી, રજીસ્ટ્રેશન ફી અને અન્ય સરકારી વેરાઓ શામેલ નથી. બંને પક્ષો આ શરતો માટે સંમત છે.",
    hindi: "आवंटी एतद्द्वारा प्रमोटर से खरीदने के लिए सहमत है और प्रमोटर आवंटी को जिला .... में स्थित क्षेत्रफल .... वर्ग मीटर का अपार्टमेंट/प्लॉट बेचने के लिए सहमत है। इसका कुल मूल्य रु. ..../- निर्धारित किया गया है, जिसमें स्टांप शुल्क, पंजीकरण शुल्क और अन्य कर शामिल नहीं हैं। दोनों पक्ष इन शर्तों से सहमत हैं।"
  };

  useEffect(() => {
    if (!oid) {
      setError('Missing property reference (oid parameter).');
      setFetchingProperty(false);
      return;
    }

    // Fetch property details to display preview metadata
    fetch(`http://localhost:5000/api/properties/detail/${oid}`, { credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to retrieve property details');
        return res.json();
      })
      .then((data) => {
        setProperty(data.Property);
        setGeneratedInvoiceId(data.GeneratedInvoiceID || '');
        setFetchingProperty(false);
      })
      .catch((err) => {
        console.error(err);
        setError('Failed to fetch referenced property info.');
        setFetchingProperty(false);
      });
  }, [oid]);

  const handleNextStep = () => {
    let content = '';
    if (draftType === '2') {
      content = templates[language] || templates.english;
    }
    setDraftContent(content);
    setInitialContent(content);
    setStep(2);
  };

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
    const invoiceIdPart = generatedInvoiceId ? ` (ID : ${generatedInvoiceId})` : '';
    return `${districtPart} ${areaText} ${plotAreaPart}${invoiceIdPart}`.trim();
  };

  const formatOwnerDetailsLabel = (p: PropertyDetails) => {
    const name = [p.ownerFirstName, p.ownerMiddleName, p.ownerLastName].filter(Boolean).join(' ');
    return `${name} ${p.ownerMobileNo || ''}`.trim();
  };

  const formatAgentDetailsLabel = () => {
    if (!agentProfile) return 'Agent Name : Loading... Agent Address : Loading... Contact No : Loading...';
    const name = [agentProfile.firstname, agentProfile.middlename, agentProfile.surname].filter(Boolean).join(' ');
    const address = agentProfile.address || '';
    const mobile = agentProfile.mobile || '';
    return `Agent Name : ${name} Agent Address : ${address} Contact No : ${mobile}`;
  };

  const exec = (cmd: string, val: string = '') => {
    restoreSelection();
    document.execCommand(cmd, false, val);
    if (editorRef.current) {
      setDraftContent(editorRef.current.innerHTML);
    }
    editorRef.current?.focus();
  };

  const applyFontSize = (size: string) => {
    restoreSelection();
    const sel = window.getSelection();
    if (sel && !sel.isCollapsed) {
      document.execCommand('fontSize', false, '7');
      if (editorRef.current) {
        const fonts = editorRef.current.getElementsByTagName('font');
        for (let i = 0; i < fonts.length; i++) {
          const font = fonts[i];
          if (font.getAttribute('size') === '7') {
            font.removeAttribute('size');
            font.style.fontSize = size;
          }
        }
        setDraftContent(editorRef.current.innerHTML);
      }
    } else {
      document.execCommand('insertHTML', false, `<span style="font-size: ${size};">&#8203;</span>`);
      if (editorRef.current) {
        setDraftContent(editorRef.current.innerHTML);
      }
    }
    editorRef.current?.focus();
  };

  const applyFontName = (fontName: string) => {
    restoreSelection();
    const sel = window.getSelection();
    if (sel && !sel.isCollapsed) {
      document.execCommand('fontName', false, fontName);
      if (editorRef.current) {
        setDraftContent(editorRef.current.innerHTML);
      }
    } else {
      document.execCommand('insertHTML', false, `<span style="font-family: ${fontName};">&#8203;</span>`);
      if (editorRef.current) {
        setDraftContent(editorRef.current.innerHTML);
      }
    }
    editorRef.current?.focus();
  };

  const insertTable = (r: number, c: number) => {
    restoreSelection();
    let tableHtml = '<table style="width:100%; border-collapse:collapse; margin:10px 0; border:1px solid #ccc;"><tbody>';
    for (let i = 0; i < r; i++) {
      tableHtml += '<tr>';
      for (let j = 0; j < c; j++) {
        tableHtml += '<td style="border:1px solid #ccc; padding:8px; min-width:40px; text-align:left; height:24px;">&nbsp;</td>';
      }
      tableHtml += '</tr>';
    }
    tableHtml += '</tbody></table><p>&nbsp;</p>';
    exec('insertHTML', tableHtml);
    setShowTablePop(false);
  };

  const insertChar = (char: string) => {
    restoreSelection();
    exec('insertHTML', char);
    setShowCharPop(false);
  };

  const handleSaveDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!property) return;
    const formattedPropertyDetails = formatPropertyDetailsLabel(property);

    const payload = {
      OLBID: oid,
      CustomizeReadymade: draftType,
      Language: language,
      AgreementDraft: draftContent,
      PropertyDetail: formattedPropertyDetails
    };

    try {
      const response = await fetch('http://localhost:5000/api/drafts/prepare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.Status === 2) {
        setSuccess('Prepared draft successfully saved! Redirecting to prepared list...');
        setTimeout(() => {
          router.push('/view_all_prepared_draft');
        }, 1500);
      } else {
        setError(data.Msg || 'Failed to save agreement draft.');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to save draft. Make sure the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout role="agent">
      <div className="absolute top-10 right-10 w-[400px] h-[400px] rounded-full bg-blue-500/5 blur-[100px] pointer-events-none" />

      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white">Prepare Agreement Draft</h2>
          <p className="text-slate-400 text-sm mt-1">Write or customize legal contract drafts for Advocate validation</p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-3">
            <CheckCircle2 size={18} className="shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {fetchingProperty ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400 bg-slate-900 border border-slate-800 rounded-xl">
            <Loader2 className="animate-spin text-blue-500" size={28} />
            <span>Retrieving property record metadata...</span>
          </div>
        ) : property ? (
          <div className="space-y-6">
            {step === 1 ? (
              /* Step 1 Selection Pane */
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                    <FileText size={24} />
                  </div>
                  <h3 className="font-bold text-lg text-white">Draft Setup Settings</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-slate-300 text-sm font-semibold mb-2" htmlFor="lang">Draft Language</label>
                    <select
                      id="lang"
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none"
                    >
                      <option value="english">English</option>
                      <option value="marathi">Marathi</option>
                      <option value="gujarati">Gujarati</option>
                      <option value="hindi">Hindi</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 text-sm font-semibold mb-2">Draft Mode</label>
                    <div className="flex gap-4 pt-1">
                      <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                        <input
                          type="radio"
                          name="draftType"
                          value="1"
                          checked={draftType === '1'}
                          onChange={() => setDraftType('1')}
                          className="accent-blue-500"
                        />
                        <span>Customize Draft (Blank)</span>
                      </label>
                      <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                        <input
                          type="radio"
                          name="draftType"
                          value="2"
                          checked={draftType === '2'}
                          onChange={() => setDraftType('2')}
                          className="accent-blue-500"
                        />
                        <span>Readymade Draft Template</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-800">
                  <button
                    onClick={handleNextStep}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg text-sm transition-all flex items-center gap-2 cursor-pointer shadow-md"
                  >
                    <span>Configure Editor</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            ) : (
              /* Step 2 Content Editor */
              <div className="space-y-6">
                <form onSubmit={handleSaveDraft} className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
                  {/* Cards Legacy Styled Header */}
                  <div className="bg-blue-600 px-6 py-4 rounded-t-xl -mx-6 -mt-6 border-b border-blue-700">
                    <h3 className="font-bold text-lg text-white font-sans">Add New Prepared Draft</h3>
                  </div>

                  <div className="space-y-2 pt-2">
                    <span className="block text-slate-300 text-sm font-semibold">
                      Agreement Draft ({draftType === '2' ? 'This is Readymade Draft.' : 'This is Customize Draft.'})
                    </span>

                    {/* Rich Text Editor Frame */}
                    <div className="border border-slate-700 rounded-lg overflow-hidden flex flex-col">
                      {/* Editor Toolbar */}
                      <div className="bg-slate-100 border-b border-slate-300 p-2 flex flex-wrap gap-1 items-center select-none text-slate-700 font-sans">
                        {/* 1. History */}
                        <div className="flex items-center gap-0.5 border-r border-slate-300 pr-1 mr-1">
                          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('undo')} title="Undo" className="p-1 hover:bg-slate-200 rounded text-slate-700 cursor-pointer">
                            <Undo size={14} />
                          </button>
                          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('redo')} title="Redo" className="p-1 hover:bg-slate-200 rounded text-slate-700 cursor-pointer">
                            <Redo size={14} />
                          </button>
                        </div>

                        {/* 2. Clipboard */}
                        <div className="flex items-center gap-0.5 border-r border-slate-300 pr-1 mr-1">
                          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('cut')} title="Cut" className="p-1 hover:bg-slate-200 rounded text-slate-700 cursor-pointer">
                            <span className="text-xs font-semibold px-0.5">Cut</span>
                          </button>
                          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('copy')} title="Copy" className="p-1 hover:bg-slate-200 rounded text-slate-700 cursor-pointer">
                            <span className="text-xs font-semibold px-0.5">Copy</span>
                          </button>
                        </div>

                        {/* 3. Text Formatting */}
                        <div className="flex items-center gap-0.5 border-r border-slate-300 pr-1 mr-1">
                          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('bold')} title="Bold" className="p-1 hover:bg-slate-200 rounded font-bold text-slate-700 cursor-pointer">
                            <Bold size={14} />
                          </button>
                          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('italic')} title="Italic" className="p-1 hover:bg-slate-200 rounded italic text-slate-700 cursor-pointer">
                            <Italic size={14} />
                          </button>
                          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('underline')} title="Underline" className="p-1 hover:bg-slate-200 rounded underline text-slate-700 cursor-pointer">
                            <Underline size={14} />
                          </button>
                          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('strikeThrough')} title="Strikethrough" className="p-1 hover:bg-slate-200 rounded line-through text-slate-700 cursor-pointer">
                            <Strikethrough size={14} />
                          </button>
                          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('subscript')} title="Subscript" className="p-1 hover:bg-slate-200 rounded text-slate-700 cursor-pointer">
                            <Subscript size={14} />
                          </button>
                          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('superscript')} title="Superscript" className="p-1 hover:bg-slate-200 rounded text-slate-700 cursor-pointer">
                            <Superscript size={14} />
                          </button>
                          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('removeFormat')} title="Remove Formatting" className="p-1 hover:bg-slate-200 rounded text-slate-700 cursor-pointer">
                            <Type size={14} />
                          </button>
                        </div>

                        {/* 4. Font & Size selection */}
                        <div className="flex items-center gap-1 border-r border-slate-300 pr-1 mr-1">
                          <select 
                            onChange={(e) => applyFontName(e.target.value)} 
                            title="Font Family" 
                            className="bg-white border border-slate-300 rounded px-1.5 py-0.5 text-xs text-slate-800 focus:outline-none"
                            defaultValue="Arial"
                          >
                            <option value="Arial">Arial</option>
                            <option value="Courier New">Courier</option>
                            <option value="Georgia">Georgia</option>
                            <option value="Tahoma">Tahoma</option>
                            <option value="Times New Roman">Times</option>
                            <option value="Verdana">Verdana</option>
                          </select>

                          <select 
                            onChange={(e) => applyFontSize(e.target.value)} 
                            title="Font Size" 
                            className="bg-white border border-slate-300 rounded px-1.5 py-0.5 text-xs text-slate-800 focus:outline-none"
                            defaultValue="14px"
                          >
                            <option value="12px">12px</option>
                            <option value="14px">14px</option>
                            <option value="16px">16px</option>
                            <option value="18px">18px</option>
                            <option value="20px">20px</option>
                            <option value="24px">24px</option>
                            <option value="28px">28px</option>
                            <option value="32px">32px</option>
                            <option value="36px">36px</option>
                          </select>
                        </div>

                        {/* 5. Lists */}
                        <div className="flex items-center gap-0.5 border-r border-slate-300 pr-1 mr-1">
                          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('insertUnorderedList')} title="Bulleted List" className="p-1 hover:bg-slate-200 rounded text-slate-700 cursor-pointer">
                            <List size={14} />
                          </button>
                          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('insertOrderedList')} title="Numbered List" className="p-1 hover:bg-slate-200 rounded text-slate-700 cursor-pointer">
                            <ListOrdered size={14} />
                          </button>
                        </div>

                        {/* 6. Alignment */}
                        <div className="flex items-center gap-0.5 border-r border-slate-300 pr-1 mr-1">
                          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('justifyLeft')} title="Align Left" className="p-1 hover:bg-slate-200 rounded text-slate-700 cursor-pointer">
                            <AlignLeft size={14} />
                          </button>
                          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('justifyCenter')} title="Align Center" className="p-1 hover:bg-slate-200 rounded text-slate-700 cursor-pointer">
                            <AlignCenter size={14} />
                          </button>
                          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('justifyRight')} title="Align Right" className="p-1 hover:bg-slate-200 rounded text-slate-700 cursor-pointer">
                            <AlignRight size={14} />
                          </button>
                          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('justifyFull')} title="Justify" className="p-1 hover:bg-slate-200 rounded text-slate-700 cursor-pointer">
                            <AlignJustify size={14} />
                          </button>
                        </div>

                        {/* 7. Insert Extras (Table, Special character, colors) */}
                        <div className="flex items-center gap-1 relative">
                          {/* Table */}
                          <div className="relative">
                            <button 
                              type="button" 
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => { setShowTablePop(!showTablePop); setShowCharPop(false); setShowColorPop(false); setShowBgColorPop(false); }} 
                              title="Insert Table" 
                              className={`p-1 rounded cursor-pointer ${showTablePop ? 'bg-slate-300 text-slate-900' : 'hover:bg-slate-200 text-slate-700'}`}
                            >
                              <Table size={14} />
                            </button>
                            {showTablePop && (
                              <div className="absolute z-20 top-7 left-0 bg-white border border-slate-300 shadow-xl rounded-lg p-3 text-slate-800 text-xs w-40 space-y-2">
                                <p className="font-bold border-b pb-1">Insert Table</p>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Rows</label>
                                    <input 
                                      type="number" 
                                      value={tableRows} 
                                      onChange={(e) => setTableRows(Math.max(1, parseInt(e.target.value) || 1))}
                                      className="w-full p-1 border rounded bg-slate-50 focus:outline-none" 
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Cols</label>
                                    <input 
                                      type="number" 
                                      value={tableCols} 
                                      onChange={(e) => setTableCols(Math.max(1, parseInt(e.target.value) || 1))}
                                      className="w-full p-1 border rounded bg-slate-50 focus:outline-none" 
                                    />
                                  </div>
                                </div>
                                <button 
                                  type="button" 
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={() => insertTable(tableRows, tableCols)}
                                  className="w-full py-1 bg-blue-600 text-white rounded font-semibold text-center mt-1 cursor-pointer hover:bg-blue-500"
                                >
                                  Insert
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Special Character */}
                          <div className="relative">
                            <button 
                              type="button" 
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => { setShowCharPop(!showCharPop); setShowTablePop(false); setShowColorPop(false); setShowBgColorPop(false); }} 
                              title="Special Character" 
                              className={`p-1 font-bold rounded cursor-pointer leading-none flex items-center justify-center text-xs w-6 h-6 ${showCharPop ? 'bg-slate-300 text-slate-900' : 'hover:bg-slate-200 text-slate-700'}`}
                            >
                              Ω
                            </button>
                            {showCharPop && (
                              <div className="absolute z-20 top-7 left-0 bg-white border border-slate-300 shadow-xl rounded-lg p-3 text-slate-800 text-xs w-48 space-y-2">
                                <p className="font-bold border-b pb-1">Special Characters</p>
                                <div className="grid grid-cols-5 gap-1 text-center">
                                  {specialChars.map(c => (
                                    <button 
                                      key={c} 
                                      type="button" 
                                      onMouseDown={(e) => e.preventDefault()}
                                      onClick={() => insertChar(c)}
                                      className="p-1 hover:bg-slate-200 rounded text-slate-950 font-bold border border-slate-100 cursor-pointer"
                                    >
                                      {c}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Text Color */}
                          <div className="relative">
                            <button 
                              type="button" 
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => { setShowColorPop(!showColorPop); setShowTablePop(false); setShowCharPop(false); setShowBgColorPop(false); }} 
                              title="Text Color" 
                              className={`p-1 rounded cursor-pointer ${showColorPop ? 'bg-slate-300 text-slate-900' : 'hover:bg-slate-200 text-slate-700'}`}
                            >
                              <Palette size={14} />
                            </button>
                            {showColorPop && (
                              <div className="absolute z-20 top-7 left-0 bg-white border border-slate-300 shadow-xl rounded-lg p-3 text-slate-800 text-xs w-40 space-y-2">
                                <p className="font-bold border-b pb-1">Text Color</p>
                                <div className="grid grid-cols-7 gap-1">
                                  {colors.map(col => (
                                    <button 
                                      key={col} 
                                      type="button" 
                                      onMouseDown={(e) => e.preventDefault()}
                                      onClick={() => { exec('foreColor', col); setShowColorPop(false); }}
                                      style={{ backgroundColor: col }}
                                      className="w-4 h-4 rounded border border-slate-300 hover:scale-110 transition-transform cursor-pointer"
                                      title={col}
                                    />
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Text Background Color */}
                          <div className="relative">
                            <button 
                              type="button" 
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => { setShowBgColorPop(!showBgColorPop); setShowTablePop(false); setShowCharPop(false); setShowColorPop(false); }} 
                              title="Background Highlight" 
                              className={`p-1 rounded cursor-pointer ${showBgColorPop ? 'bg-slate-300 text-slate-900' : 'hover:bg-slate-200 text-slate-700'}`}
                            >
                              <Highlighter size={14} />
                            </button>
                            {showBgColorPop && (
                              <div className="absolute z-20 top-7 left-0 bg-white border border-slate-300 shadow-xl rounded-lg p-3 text-slate-800 text-xs w-40 space-y-2">
                                <p className="font-bold border-b pb-1">Highlight Color</p>
                                <div className="grid grid-cols-7 gap-1">
                                  {colors.map(col => (
                                    <button 
                                      key={col} 
                                      type="button" 
                                      onMouseDown={(e) => e.preventDefault()}
                                      onClick={() => { exec('hiliteColor', col); setShowBgColorPop(false); }}
                                      style={{ backgroundColor: col }}
                                      className="w-4 h-4 rounded border border-slate-300 hover:scale-110 transition-transform cursor-pointer"
                                      title={col}
                                    />
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Content Editable Area */}
                      <div
                        ref={editorRef}
                        contentEditable
                        onInput={(e) => setDraftContent(e.currentTarget.innerHTML)}
                        dangerouslySetInnerHTML={{ __html: initialContent }}
                        className="w-full min-h-[400px] p-4 bg-white text-slate-900 placeholder-slate-400 text-sm focus:outline-none overflow-y-auto leading-relaxed text-left font-sans"
                        style={{ fontFamily: 'Arial, sans-serif' }}
                      />
                    </div>
                  </div>

                  {/* Metadata Details Preview */}
                  <div className="space-y-4 pt-4 border-t border-slate-800">
                    <h4 className="font-bold text-white text-base font-sans">Details</h4>
                    <div className="space-y-2 text-sm text-slate-300 font-sans leading-relaxed">
                      <p>
                        <strong>Property Details : </strong>
                        {formatPropertyDetailsLabel(property)}
                      </p>
                      <p>
                        <strong>Owner Detail : </strong>
                        {formatOwnerDetailsLabel(property)}
                      </p>
                      <p>
                        {formatAgentDetailsLabel()}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-6 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => router.push(property.type === 1 ? `/update_ol?oid=${property.olbId}` : `/update_ob?oid=${property.olbId}`)}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg text-sm transition-all cursor-pointer shadow-md"
                    >
                      Update Property Detail
                    </button>

                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-sm transition-all flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="animate-spin" size={16} />
                          <span>Saving Draft...</span>
                        </>
                      ) : (
                        <>
                          <span>✔ Submit</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {/* Back Button outside card container */}
                <div className="pt-2 flex justify-start no-print">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg text-sm transition-all shadow-md cursor-pointer"
                  >
                    Back
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="py-20 text-center text-slate-500 text-sm bg-slate-900 border border-slate-800 rounded-xl">
            Referenced property entry could not be found. Check query params.
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function AddAgreementDraftPage() {
  return (
    <Suspense fallback={
      <DashboardLayout role="agent">
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
          <Loader2 className="animate-spin text-blue-500" size={28} />
          <span>Loading draft editor...</span>
        </div>
      </DashboardLayout>
    }>
      <AddAgreementDraftContent />
    </Suspense>
  );
}
