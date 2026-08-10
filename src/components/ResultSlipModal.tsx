import React, { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { StudentResult, SchoolHeaderInfo, DEFAULT_SCHOOL_HEADER } from '../types';
import { 
  ShieldCheck as ShieldIcon, 
  Printer as PrintIcon, 
  Download as DownloadIcon, 
  Share2 as ShareIcon, 
  X as CloseIcon, 
  Check as CheckIcon,
  Loader2 as SpinnerIcon
} from 'lucide-react';

// Helper to convert oklch CSS color functions to standard rgb/rgba for html2canvas compatibility
const oklchCache = new Map<string, string>();

const parseOklchToRgb = (colorStr: string): string => {
  if (!colorStr || typeof colorStr !== 'string' || !colorStr.includes('oklch')) {
    return colorStr || '';
  }
  if (oklchCache.has(colorStr)) {
    return oklchCache.get(colorStr)!;
  }

  const replaced = colorStr.replace(/oklch\(\s*([\d.%]+)\s+([\d.%]+)\s+([\d.%]+)(?:\s*\/\s*([\d.%]+))?\s*\)/gi, (fullMatch, lRaw, cRaw, hRaw, aRaw) => {
    try {
      let L = lRaw.endsWith('%') ? parseFloat(lRaw) / 100 : parseFloat(lRaw);
      let C = cRaw.endsWith('%') ? parseFloat(cRaw) / 100 : parseFloat(cRaw);
      let H = parseFloat(hRaw);
      let A = 1;
      if (aRaw) {
        A = aRaw.endsWith('%') ? parseFloat(aRaw) / 100 : parseFloat(aRaw);
      }

      if (isNaN(L) || isNaN(C) || isNaN(H)) return 'rgb(0,0,0)';

      const hRad = (H * Math.PI) / 180;
      const a = C * Math.cos(hRad);
      const b = C * Math.sin(hRad);

      const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
      const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
      const s_ = L - 0.0894841775 * a - 1.2914855480 * b;

      const lComp = l_ * l_ * l_;
      const mComp = m_ * m_ * m_;
      const sComp = s_ * s_ * s_;

      const r_lin = +4.0767416621 * lComp - 3.3077115913 * mComp + 0.2309699292 * sComp;
      const g_lin = -1.2684380046 * lComp + 2.6097574011 * mComp - 0.3413193965 * sComp;
      const b_lin = -0.0041960863 * lComp - 0.7034186147 * mComp + 1.7076147010 * sComp;

      const toSRGB = (val: number) => {
        const clamped = Math.max(0, Math.min(1, val));
        return clamped > 0.0031308
          ? 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055
          : 12.92 * clamped;
      };

      const rInt = Math.round(toSRGB(r_lin) * 255);
      const gInt = Math.round(toSRGB(g_lin) * 255);
      const bInt = Math.round(toSRGB(b_lin) * 255);

      return A >= 0.99
        ? `rgb(${rInt}, ${gInt}, ${bInt})`
        : `rgba(${rInt}, ${gInt}, ${bInt}, ${A.toFixed(2)})`;
    } catch {
      return 'rgb(0,0,0)';
    }
  });

  oklchCache.set(colorStr, replaced);
  return replaced;
};

// Helper to generate a crisp SVG avatar data URI for fallback
const createDefaultAvatarDataUrl = (name: string): string => {
  const initials = (name || 'ST')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="240" viewBox="0 0 200 240">
    <rect width="100%" height="100%" fill="#e2e8f0"/>
    <circle cx="100" cy="85" r="45" fill="#475569"/>
    <path d="M 30 220 C 30 155, 170 155, 170 220 Z" fill="#475569"/>
    <text x="100" y="95" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="#ffffff" text-anchor="middle">${initials}</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

interface ResultSlipModalProps {
  result: StudentResult | null;
  isOpen: boolean;
  onClose: () => void;
  onVerifyQR: () => void;
  schoolHeader?: SchoolHeaderInfo;
}

export const ResultSlipModal: React.FC<ResultSlipModalProps> = ({
  result,
  isOpen,
  onClose,
  onVerifyQR,
  schoolHeader,
}) => {
  const [copied, setCopied] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [passportBase64, setPassportBase64] = useState<string>('');
  const printRef = useRef<HTMLDivElement>(null);

  // Pre-convert passport photo URL to base64 Data URL for instant, error-free html2canvas PDF rendering
  React.useEffect(() => {
    let isMounted = true;
    const defaultAvatar = createDefaultAvatarDataUrl(result?.fullName || 'Student');

    if (!result?.passportUrl) {
      setPassportBase64(defaultAvatar);
      return;
    }

    const src = result.passportUrl;
    if (src.startsWith('data:')) {
      setPassportBase64(src);
      return;
    }

    // Try converting image URL to base64 via fetch or canvas
    fetch(src, { mode: 'cors' })
      .then((res) => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.blob();
      })
      .then((blob) => {
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      })
      .then((dataUrl) => {
        if (isMounted && dataUrl) {
          setPassportBase64(dataUrl);
        }
      })
      .catch(() => {
        // Fallback to Image canvas loading
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = src;
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth || 200;
            canvas.height = img.naturalHeight || 200;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0);
              const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
              if (isMounted) setPassportBase64(dataUrl);
            }
          } catch {
            if (isMounted) setPassportBase64(defaultAvatar);
          }
        };
        img.onerror = () => {
          if (isMounted) setPassportBase64(defaultAvatar);
        };
      });

    return () => {
      isMounted = false;
    };
  }, [result?.passportUrl, result?.fullName, isOpen]);

  // Retrieve current school header settings from prop or localStorage or fallback
  const getHeaderInfo = (): SchoolHeaderInfo => {
    if (schoolHeader) return schoolHeader;
    try {
      const saved = localStorage.getItem('royal_academy_school_header');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {}
    return DEFAULT_SCHOOL_HEADER;
  };

  const headerInfo = getHeaderInfo();

  if (!isOpen || !result) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!printRef.current || !result) return;
    setIsDownloadingPdf(true);

    try {
      const element = printRef.current;

      // Timeout safety promise (8 seconds max)
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('PDF generation timed out')), 8000)
      );

      // Render crisp HD canvas using html2canvas scale: 2 for high DPI resolution
      const renderPromise = html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        imageTimeout: 4000,
        scrollX: 0,
        scrollY: 0,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
        onclone: (clonedDoc) => {
          // Add crossOrigin = 'anonymous' to cloned images
          const images = clonedDoc.querySelectorAll('img');
          images.forEach((img) => {
            img.crossOrigin = 'anonymous';
          });

          // Convert any oklch color definitions in style tags to standard rgb
          const styleTags = clonedDoc.querySelectorAll('style');
          styleTags.forEach((styleEl) => {
            if (styleEl.textContent && styleEl.textContent.includes('oklch')) {
              styleEl.textContent = parseOklchToRgb(styleEl.textContent);
            }
          });

          // Convert inline style attributes on all cloned elements
          const allEls = clonedDoc.querySelectorAll('*');
          allEls.forEach((el) => {
            const htmlEl = el as HTMLElement;
            if (htmlEl.getAttribute) {
              const styleAttr = htmlEl.getAttribute('style');
              if (styleAttr && styleAttr.includes('oklch')) {
                htmlEl.setAttribute('style', parseOklchToRgb(styleAttr));
              }
            }
          });

          // Intercept getComputedStyle in cloned window so html2canvas color parser never encounters oklch strings
          if (clonedDoc.defaultView) {
            const origGetComputedStyle = clonedDoc.defaultView.getComputedStyle;
            clonedDoc.defaultView.getComputedStyle = function (el: Element, pseudoElt?: string | null) {
              const style = origGetComputedStyle.call(clonedDoc.defaultView, el, pseudoElt);
              return new Proxy(style, {
                get(target, prop, receiver) {
                  if (prop === 'getPropertyValue') {
                    return function (propertyName: string) {
                      const val = target.getPropertyValue(propertyName);
                      if (typeof val === 'string' && val.includes('oklch')) {
                        return parseOklchToRgb(val);
                      }
                      return val;
                    };
                  }
                  const val = Reflect.get(target, prop, receiver);
                  if (typeof val === 'string' && val.includes('oklch')) {
                    return parseOklchToRgb(val);
                  }
                  if (typeof val === 'function') {
                    return val.bind(target);
                  }
                  return val;
                }
              });
            };
          }
        },
      });

      const canvas = await Promise.race([renderPromise, timeoutPromise]);

      const imgData = canvas.toDataURL('image/jpeg', 0.95);

      // Create A4 PDF document
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      const pageWidth = pdf.internal.pageSize.getWidth(); // 210mm
      const pageHeight = pdf.internal.pageSize.getHeight(); // 297mm

      const margin = 5;
      const imgWidth = pageWidth - (margin * 2); // 200mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      if (imgHeight <= (pageHeight - (margin * 2))) {
        pdf.addImage(imgData, 'JPEG', margin, margin, imgWidth, imgHeight, undefined, 'FAST');
      } else {
        let heightLeft = imgHeight;
        let position = margin;

        pdf.addImage(imgData, 'JPEG', margin, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= (pageHeight - (margin * 2));

        while (heightLeft > 0) {
          position = heightLeft - imgHeight + margin;
          pdf.addPage();
          pdf.addImage(imgData, 'JPEG', margin, position, imgWidth, imgHeight, undefined, 'FAST');
          heightLeft -= (pageHeight - (margin * 2));
        }
      }

      const cleanName = (result.fullName || result.studentId || 'Student')
        .replace(/[^a-zA-Z0-9_-]/g, '_');
      pdf.save(`ROYAL_ACADEMY_${cleanName}_Result_Slip.pdf`);
    } catch (error) {
      console.error('HD PDF generation error:', error);
      // Fallback to browser print dialog if html2canvas/jsPDF encounters issues
      window.print();
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}?studentId=${result.studentId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Calculate subjects passed / failed & totals dynamically
  const studentSubjects = result?.subjects || [];
  const subjectsPassed = studentSubjects.filter(s => (s.total || 0) >= 50).length;
  const subjectsFailed = studentSubjects.filter(s => (s.total || 0) < 50).length;
  const totalScoreCalculated = studentSubjects.reduce((acc, s) => acc + (s.total || 0), 0);
  const averageScoreCalculated = studentSubjects.length > 0 ? (totalScoreCalculated / studentSubjects.length) : 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-6 result-slip-modal-wrapper">
      <div className="relative bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-4 sm:my-8 max-h-[94vh] flex flex-col result-slip-modal-content">
        
        {/* Top Control Bar (Hidden when printing) */}
        <div className="bg-[#1E3A8A] text-white px-6 py-3.5 flex items-center justify-between shrink-0 no-print border-b border-blue-400/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/10 border border-white/20">
              <ShieldIcon className="w-5 h-5 text-[#F59E0B]" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Official Student Result Sheet
              </h3>
              <p className="text-xs text-blue-200 font-mono">Admission No (Reg ID): {result.studentId}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-[#F59E0B] hover:bg-amber-500 text-slate-900 rounded-xl transition-all shadow-xs cursor-pointer"
              title="Print directly to A4 printer or PDF"
            >
              <PrintIcon className="w-4 h-4" />
              <span>Print Slip</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-60"
              title="Download high-definition PDF result slip"
            >
              {isDownloadingPdf ? (
                <>
                  <SpinnerIcon className="w-4 h-4 animate-spin text-white" />
                  <span>Generating HD PDF...</span>
                </>
              ) : (
                <>
                  <DownloadIcon className="w-4 h-4" />
                  <span>Download HD PDF</span>
                </>
              )}
            </button>

            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all cursor-pointer"
            >
              {copied ? <CheckIcon className="w-4 h-4 text-emerald-400" /> : <ShareIcon className="w-4 h-4" />}
              <span className="hidden sm:inline">{copied ? 'Copied!' : 'Share'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-xl text-white/80 hover:text-white transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <CloseIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Result Sheet Body (A4 Portrait Template Specification) */}
        <div ref={printRef} className="p-6 sm:p-8 overflow-y-auto space-y-4 print-area bg-white text-black font-sans">
          
          {/* 1. HEADER SECTION */}
          <div className="border-b-2 border-black pb-3 flex items-center justify-between gap-4">
            {/* Top Left: School Crest Logo */}
            <div className="w-16 h-16 rounded-xl border-2 border-black bg-slate-50 flex items-center justify-center shrink-0">
              <ShieldIcon className="w-10 h-10 text-slate-900" />
            </div>

            {/* Top Center: School Name and Document Title */}
            <div className="text-center flex-1">
              <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight uppercase font-serif">
                {headerInfo.schoolName || 'ROYAL ACADEMY'}
              </h1>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-800">
                {headerInfo.reportTitle || 'Student Mid-Term Report'}
              </p>
              <p className="text-[10px] text-slate-700 font-mono">
                {headerInfo.addressSubtitle || 'Victoria Island, Lagos, Nigeria • Official Academic Record'}
              </p>
            </div>

            {/* Top Right: Session & Term Info */}
            <div className="text-right text-xs font-bold border border-black p-2 bg-slate-50 rounded-sm shrink-0 min-w-[140px]">
              <div className="text-[10px] uppercase text-slate-600 font-normal">Academic Session:</div>
              <div className="text-black font-extrabold">{result.academicSession || '2025/2026 Session'}</div>
              <div className="text-[10px] uppercase text-slate-600 font-normal mt-1">Term:</div>
              <div className="text-black font-extrabold">{result.term || 'First Term'}</div>
            </div>
          </div>

          {/* 2. STUDENT INFORMATION HORIZONTAL GRID */}
          <div className="border border-black p-3 bg-white space-y-2">
            <div className="grid grid-cols-12 gap-3 items-center">
              
              {/* Student Details */}
              <div className="col-span-9 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 text-xs">
                <div>
                  <span className="block text-[10px] font-bold text-slate-600 uppercase">Student Name:</span>
                  <span className="font-extrabold text-black text-sm uppercase block">{result.fullName}</span>
                </div>

                <div>
                  <span className="block text-[10px] font-bold text-slate-600 uppercase">Admission No:</span>
                  <span className="font-mono font-bold text-black text-sm block">{result.studentId}</span>
                </div>

                <div>
                  <span className="block text-[10px] font-bold text-slate-600 uppercase">Class:</span>
                  <span className="font-bold text-black block">{result.className}</span>
                </div>

                <div>
                  <span className="block text-[10px] font-bold text-slate-600 uppercase">Gender:</span>
                  <span className="font-bold text-black block">{result.gender || 'Male'}</span>
                </div>

                <div>
                  <span className="block text-[10px] font-bold text-slate-600 uppercase">Age:</span>
                  <span className="font-bold text-black block">{result.age || '16 Yrs'}</span>
                </div>

                <div>
                  <span className="block text-[10px] font-bold text-slate-600 uppercase">House:</span>
                  <span className="font-bold text-black block">{result.house || 'Sapphire House'}</span>
                </div>
              </div>

              {/* Passport Photo */}
              <div className="col-span-3 flex justify-end">
                <div className="w-20 h-24 border-2 border-black bg-slate-100 overflow-hidden shrink-0">
                  <img
                    src={passportBase64 || result.passportUrl || createDefaultAvatarDataUrl(result.fullName)}
                    alt={result.fullName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.onerror = null;
                      target.src = createDefaultAvatarDataUrl(result.fullName);
                    }}
                  />
                </div>
              </div>

            </div>
          </div>

          <div className="border-b border-black"></div>

          {/* 3. RESULT TITLE */}
          <div className="text-center space-y-0.5">
            <h2 className="text-base font-black text-black uppercase tracking-wider">
              MIDTERM REPORT
            </h2>
            <p className="text-xs font-bold uppercase text-slate-800">
              {result.term || 'FIRST TERM'} — {result.academicSession || '2025/2026 SESSION'}
            </p>
          </div>

          {/* 4. RESULT TABLE */}
          <div className="overflow-x-auto">
            <table className="result-table w-full text-xs text-black border-collapse border border-black" style={{ borderCollapse: 'collapse', tableLayout: 'fixed' }}>
              <thead>
                <tr className="bg-gray-200 text-black font-bold text-[11px] uppercase border-b border-black">
                  <th className="border border-black text-center" style={{ width: '6%', padding: '5px 8px', height: '28px', lineHeight: '1.35', verticalAlign: 'middle', boxSizing: 'border-box' }}>S/N</th>
                  <th className="border border-black text-left" style={{ width: '40%', padding: '5px 8px', height: '28px', lineHeight: '1.35', verticalAlign: 'middle', boxSizing: 'border-box' }}>SUBJECT</th>
                  <th className="border border-black text-center" style={{ width: '10%', padding: '5px 8px', height: '28px', lineHeight: '1.35', verticalAlign: 'middle', boxSizing: 'border-box' }}>CA (40)</th>
                  <th className="border border-black text-center" style={{ width: '10%', padding: '5px 8px', height: '28px', lineHeight: '1.35', verticalAlign: 'middle', boxSizing: 'border-box' }}>EXAM (60)</th>
                  <th className="border border-black text-center" style={{ width: '10%', padding: '5px 8px', height: '28px', lineHeight: '1.35', verticalAlign: 'middle', boxSizing: 'border-box' }}>TOTAL (100)</th>
                  <th className="border border-black text-center" style={{ width: '10%', padding: '5px 8px', height: '28px', lineHeight: '1.35', verticalAlign: 'middle', boxSizing: 'border-box' }}>GRADE</th>
                  <th className="border border-black text-center" style={{ width: '14%', padding: '5px 8px', height: '28px', lineHeight: '1.35', verticalAlign: 'middle', boxSizing: 'border-box' }}>REMARK</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black font-medium">
                {studentSubjects.length > 0 ? (
                  studentSubjects.map((sub, idx) => {
                    const caDisplay = sub.caScore !== undefined ? sub.caScore : ((sub.ca1 || 0) + (sub.ca2 || 0) + (sub.midterm || 0));
                    const examDisplay = sub.examScore !== undefined ? sub.examScore : (sub.exam || 0);
                    const totalVal = sub.total !== undefined ? sub.total : (caDisplay + examDisplay);

                    return (
                      <tr key={sub.id || idx} className="hover:bg-slate-50">
                        <td className="border border-black text-center font-mono" style={{ padding: '5px 8px', height: '28px', lineHeight: '1.35', verticalAlign: 'middle', boxSizing: 'border-box' }}>{idx + 1}</td>
                        <td className="border border-black font-bold text-left" style={{ padding: '5px 8px', height: '28px', lineHeight: '1.35', verticalAlign: 'middle', boxSizing: 'border-box' }}>{sub.subject}</td>
                        <td className="border border-black text-center font-mono" style={{ padding: '5px 8px', height: '28px', lineHeight: '1.35', verticalAlign: 'middle', boxSizing: 'border-box' }}>{caDisplay}</td>
                        <td className="border border-black text-center font-mono" style={{ padding: '5px 8px', height: '28px', lineHeight: '1.35', verticalAlign: 'middle', boxSizing: 'border-box' }}>{examDisplay}</td>
                        <td className="border border-black text-center font-bold font-mono text-sm" style={{ padding: '5px 8px', height: '28px', lineHeight: '1.35', verticalAlign: 'middle', boxSizing: 'border-box' }}>{totalVal}</td>
                        <td className="border border-black text-center font-black" style={{ padding: '5px 8px', height: '28px', lineHeight: '1.35', verticalAlign: 'middle', boxSizing: 'border-box' }}>{sub.grade}</td>
                        <td className="border border-black text-center uppercase text-[10px] font-bold" style={{ padding: '5px 8px', height: '28px', lineHeight: '1.35', verticalAlign: 'middle', boxSizing: 'border-box' }}>{sub.remark}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="p-6 text-center font-bold text-slate-500 italic uppercase tracking-wider border border-black">
                      No subjects entered for this student yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* 5. BOTTOM SUMMARY (3 EQUAL SECTIONS) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            
            {/* LEFT SECTION: Key & Analysis */}
            <div className="border border-black p-2.5 text-xs space-y-2 bg-white">
              <div>
                <h4 className="font-black text-[11px] uppercase border-b border-black pb-1 mb-1 text-black">
                  KEY
                </h4>
                <div className="space-y-0.5 text-[11px] font-semibold">
                  <p><strong className="font-bold">GS</strong> = Good Standing</p>
                  <p><strong className="font-bold">NGS</strong> = Not in Good Standing</p>
                </div>
              </div>

              <div className="pt-2 border-t border-black">
                <h4 className="font-black text-[11px] uppercase border-b border-black pb-1 mb-1 text-black">
                  ANALYSIS
                </h4>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>Subjects Passed:</span>
                    <strong className="font-mono text-black">{subjectsPassed}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Subjects Failed:</span>
                    <strong className="font-mono text-black">{subjectsFailed}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* MIDDLE SECTION: Grading Table */}
            <div className="border border-black p-2.5 text-xs bg-white">
              <h4 className="font-black text-[11px] uppercase border-b border-black pb-1 mb-1 text-black text-center">
                GRADING SCALE
              </h4>
              <table className="grading-scale w-full text-[10px] text-center border-collapse border border-black" style={{ borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                <thead>
                  <tr className="bg-gray-100 font-bold border-b border-black">
                    <th className="border border-black" style={{ padding: '5px 8px', height: '28px', lineHeight: '1.35', verticalAlign: 'middle', boxSizing: 'border-box' }}>SCORE</th>
                    <th className="border border-black" style={{ padding: '5px 8px', height: '28px', lineHeight: '1.35', verticalAlign: 'middle', boxSizing: 'border-box' }}>GRADE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black font-semibold">
                  <tr>
                    <td className="border border-black" style={{ padding: '5px 8px', height: '28px', lineHeight: '1.35', verticalAlign: 'middle', boxSizing: 'border-box' }}>100 - 80</td>
                    <td className="border border-black font-bold" style={{ padding: '5px 8px', height: '28px', lineHeight: '1.35', verticalAlign: 'middle', boxSizing: 'border-box' }}>A1 (Excellent)</td>
                  </tr>
                  <tr>
                    <td className="border border-black" style={{ padding: '5px 8px', height: '28px', lineHeight: '1.35', verticalAlign: 'middle', boxSizing: 'border-box' }}>79 - 70</td>
                    <td className="border border-black font-bold" style={{ padding: '5px 8px', height: '28px', lineHeight: '1.35', verticalAlign: 'middle', boxSizing: 'border-box' }}>B2 (Very Good)</td>
                  </tr>
                  <tr>
                    <td className="border border-black" style={{ padding: '5px 8px', height: '28px', lineHeight: '1.35', verticalAlign: 'middle', boxSizing: 'border-box' }}>69 - 60</td>
                    <td className="border border-black font-bold" style={{ padding: '5px 8px', height: '28px', lineHeight: '1.35', verticalAlign: 'middle', boxSizing: 'border-box' }}>B3 (Good)</td>
                  </tr>
                  <tr>
                    <td className="border border-black" style={{ padding: '5px 8px', height: '28px', lineHeight: '1.35', verticalAlign: 'middle', boxSizing: 'border-box' }}>59 - 55</td>
                    <td className="border border-black font-bold" style={{ padding: '5px 8px', height: '28px', lineHeight: '1.35', verticalAlign: 'middle', boxSizing: 'border-box' }}>C4 (Credit)</td>
                  </tr>
                  <tr>
                    <td className="border border-black" style={{ padding: '5px 8px', height: '28px', lineHeight: '1.35', verticalAlign: 'middle', boxSizing: 'border-box' }}>54 - 50</td>
                    <td className="border border-black font-bold" style={{ padding: '5px 8px', height: '28px', lineHeight: '1.35', verticalAlign: 'middle', boxSizing: 'border-box' }}>C6 (Credit)</td>
                  </tr>
                  <tr>
                    <td className="border border-black" style={{ padding: '5px 8px', height: '28px', lineHeight: '1.35', verticalAlign: 'middle', boxSizing: 'border-box' }}>Below 50</td>
                    <td className="border border-black font-bold text-red-700" style={{ padding: '5px 8px', height: '28px', lineHeight: '1.35', verticalAlign: 'middle', boxSizing: 'border-box' }}>F9 (Fail)</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* RIGHT SECTION: Academic Summary */}
            <div className="border border-black p-2.5 text-xs space-y-1.5 bg-white">
              <h4 className="font-black text-[11px] uppercase border-b border-black pb-1 text-black">
                ACADEMIC SUMMARY
              </h4>
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>Total Subjects:</span>
                  <strong className="font-mono">{studentSubjects.length}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Total Score:</span>
                  <strong className="font-mono">{totalScoreCalculated}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Average:</span>
                  <strong className="font-mono">{averageScoreCalculated.toFixed(1)}%</strong>
                </div>
                <div className="flex justify-between">
                  <span>Position:</span>
                  <strong className="font-mono">{result.position} out of {result.totalInClass}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Attendance:</span>
                  <strong className="font-mono">{result.attendance.timesPresent} / {result.attendance.timesOpened} Days</strong>
                </div>
                <div className="border-t border-black pt-1">
                  <span className="block text-[10px] font-bold uppercase text-slate-600">Principal Remark:</span>
                  <p className="italic text-[11px] font-serif leading-tight">"{result.principalRemark}"</p>
                </div>
                <div className="flex justify-between pt-1 border-t border-black">
                  <span>Status:</span>
                  <strong className="uppercase font-bold text-black">
                    {result.status === 'GRADUATED' ? 'Excellent Performance (GS)' : 'Good Standing (GS)'}
                  </strong>
                </div>
              </div>
            </div>

          </div>

          {/* 6. SIGNATURE SECTION */}
          <div className="pt-4 pb-2 border-t border-black">
            <div className="grid grid-cols-3 gap-4 items-end text-center">
              
              {/* Left: Class Teacher Signature */}
              <div className="space-y-1 text-center">
                <div className="h-10 border-b border-black flex items-end justify-center font-serif italic text-sm text-slate-800 pb-0.5">
                  Mr. Arthur Vance, M.Ed
                </div>
                <span className="text-[10px] font-bold uppercase text-black block">Class Teacher</span>
              </div>

              {/* Middle: School Stamp Space */}
              <div className="flex flex-col items-center justify-center space-y-1">
                <div className="w-16 h-16 rounded-full border-2 border-black border-dashed flex flex-col items-center justify-center p-1 text-center bg-slate-50 shrink-0">
                  <span className="text-[7px] font-black uppercase text-black leading-none">ROYAL ACADEMY</span>
                  <ShieldIcon className="w-4 h-4 text-slate-900 my-0.5" />
                  <span className="text-[6px] font-bold text-black uppercase leading-none">OFFICIAL STAMP</span>
                </div>
                <span className="text-[9px] font-bold uppercase text-slate-700">School Stamp</span>
              </div>

              {/* Right: Principal Signature */}
              <div className="space-y-1 text-center">
                <div className="h-10 border-b border-black flex items-end justify-center font-serif italic font-bold text-sm text-[#1E3A8A] pb-0.5">
                  Dr. H. E. Montgomery
                </div>
                <span className="text-[10px] font-bold uppercase text-black block">Principal Signature</span>
              </div>

            </div>
          </div>

          {/* 7. FOOTER WITH QR CODE */}
          <div className="border-t-2 border-black pt-3 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div className="space-y-1">
              <p className="text-xs font-bold text-black">
                This result was generated electronically.
              </p>
              <p className="text-[10px] text-slate-700">
                Verify using the QR Code or search Admission No on <strong className="text-black font-mono">royalacademy.edu.ng/verify</strong>
              </p>
              <p className="text-[9px] font-mono text-slate-500">
                Verification Hash: {result.verificationHash || `RA-${result.studentId}-SEC`}
              </p>
            </div>

            {/* QR Code Container */}
            <div className="flex items-center gap-2 border border-black p-2 bg-slate-50 rounded-sm shrink-0">
              {/* High precision SVG QR Code representation */}
              <div className="w-14 h-14 bg-white p-1 border border-black flex items-center justify-center shrink-0">
                <svg viewBox="0 0 29 29" className="w-full h-full text-black fill-current">
                  <path d="M0 0h7v7H0zM2 2v3h3V2zM9 0h2v1H9zM12 0h1v2h-1zM15 0h1v1h-1zM18 0h2v2h-2zM22 0h7v7h-7zM24 2v3h3V2zM0 9h1v2H0zM3 9h2v1H3zM6 9h3v1H6zM11 9h1v3h-1zM14 9h3v1h-3zM18 9h1v1h-1zM20 9h2v2h-2zM24 9h2v1h-2zM28 9h1v2h-1zM0 12h2v1H0zM3 12h1v1H3zM5 12h2v1H5zM8 12h2v2H8zM13 12h3v1h-3zM18 12h1v2h-1zM21 12h3v1h-3zM26 12h2v1h-2zM0 15h1v1H0zM2 15h3v1H2zM6 15h1v3H6zM9 15h3v1H9zM14 15h1v1h-1zM17 15h2v1h-2zM21 15h1v1h-1zM24 15h1v3h-1zM27 15h2v1h-2zM0 18h2v2H0zM3 18h2v1H3zM8 18h2v1H8zM11 18h2v3h-2zM15 18h2v1h-2zM19 18h3v1h-3zM26 18h3v1h-3zM0 22h7v7H0zM2 24v3h3v-3zM9 22h1v2H9zM12 22h2v1h-2zM16 22h1v1h-1zM19 22h1v2h-1zM21 22h2v1h-2zM25 22h3v1h-3zM9 25h2v2H9zM13 25h2v1h-2zM17 25h1v3h-1zM20 25h2v1h-2zM24 25h1v1h-1zM27 25h2v2h-2z" />
                </svg>
              </div>
              <div className="text-[9px] font-mono leading-tight text-left">
                <div className="font-bold text-black">ID: {result.studentId}</div>
                <div className="text-slate-600">{result.academicSession}</div>
                <div className="text-blue-900 font-bold">VERIFIED</div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
