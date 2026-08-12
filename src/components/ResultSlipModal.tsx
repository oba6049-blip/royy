import React, { useState, useRef } from 'react';
import { StudentResult, SchoolHeaderInfo, DEFAULT_SCHOOL_HEADER } from '../types';
import { MOCK_STUDENTS } from '../data/mockData';
import { api } from '../services/api';
import { filterStudentSubjectsByAdmin } from '../utils/subjectUtils';
import { 
  ShieldCheck as ShieldIcon, 
  Printer as PrintIcon, 
  Share2 as ShareIcon, 
  X as CloseIcon, 
  Check as CheckIcon
} from 'lucide-react';

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
  branding?: { logoUrl?: string | null; stampUrl?: string | null; signatureUrl?: string | null };
}

export const ResultSlipModal: React.FC<ResultSlipModalProps> = ({
  result,
  isOpen,
  onClose,
  onVerifyQR,
  schoolHeader,
  branding: initialBranding,
}) => {
  const [copied, setCopied] = useState(false);
  const [passportBase64, setPassportBase64] = useState<string>('');
  const [brandingState, setBrandingState] = useState<{ logoUrl?: string | null; stampUrl?: string | null; signatureUrl?: string | null; principalRemark?: string | null; positions?: any } | null>(initialBranding || null);
  const [adminSubjects, setAdminSubjects] = useState<any[]>([]);
  const printRef = useRef<HTMLDivElement>(null);

  // Load branding & admin subjects if not provided in props
  React.useEffect(() => {
    if (isOpen) {
      if (initialBranding) {
        setBrandingState(initialBranding);
      } else {
        api.getBranding().then((b) => {
          if (b) setBrandingState(b);
        });
      }
      api.getSubjects().then((subs) => {
        if (Array.isArray(subs)) {
          setAdminSubjects(subs);
        }
      }).catch(() => {});
    }
  }, [isOpen, initialBranding]);

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

  const handleShare = () => {
    const url = `${window.location.origin}?studentId=${result.studentId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Calculate subjects passed / failed & totals dynamically
  const studentSubjects = filterStudentSubjectsByAdmin(result?.subjects, adminSubjects);

  const subjectsPassed = studentSubjects.filter(s => (s.total || 0) >= 40 && s.grade !== 'F9').length;
  const subjectsFailed = studentSubjects.filter(s => (s.total || 0) < 40 || s.grade === 'F9').length;
  const totalScoreCalculated = studentSubjects.reduce((acc, s) => acc + (s.total || 0), 0);
  const averageScoreCalculated = studentSubjects.length > 0 
    ? (totalScoreCalculated / studentSubjects.length) 
    : (studentSubjects.length === 0 ? 0 : (result?.overallAverage || 0));

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

        {/* Printable Result Sheet Body (Faith Academy Exact Specification) */}
        <div ref={printRef} className="p-6 sm:p-8 overflow-y-auto print-area bg-white text-black font-sans box-border" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
          
          {/* 1. HEADER SECTION */}
          <div className="flex items-center justify-between gap-2 pb-2 mb-3 border-b-2 border-black">
            {/* Top Left: School Logo (65px x 70px) */}
            <div 
              className="w-[65px] h-[70px] border border-black bg-white flex items-center justify-center shrink-0 overflow-hidden relative"
              style={{
                transform: brandingState?.positions?.logo 
                  ? `translate(${brandingState.positions.logo.x}px, ${brandingState.positions.logo.y}px) scale(${brandingState.positions.logo.scale || 1}) rotate(${brandingState.positions.logo.rotate || 0}deg)`
                  : 'none'
              }}
            >
              {brandingState?.logoUrl ? (
                <img 
                  src={brandingState.logoUrl} 
                  alt="Faith Academy Logo" 
                  className="w-full h-full object-contain p-0.5" 
                />
              ) : (
                <div className="w-full h-full bg-[#1E3A8A] flex flex-col items-center justify-center p-1 text-white text-center">
                  <ShieldIcon className="w-8 h-8 text-[#F59E0B]" />
                  <span className="text-[6px] font-extrabold tracking-tighter uppercase mt-0.5 leading-none">FAITH ACADEMY</span>
                </div>
              )}
            </div>

            {/* Top Center: School Name and Subheader Title */}
            <div className="text-center flex-1">
              <h1 className="text-[18px] font-bold text-black uppercase tracking-wider font-sans leading-tight">
                {headerInfo.schoolName || 'FAITH ACADEMY'}
              </h1>
              <h2 className="text-[12px] font-bold text-black uppercase tracking-normal mt-1">
                MIDTERM REPORT — {result.term?.toUpperCase() || '3RD TERM'} OF {result.academicSession || '2024/2025 Academic Session'}
              </h2>
            </div>

            {/* Top Right: Symmetrical empty spacer matching logo width */}
            <div className="w-[65px] h-[70px] shrink-0" />
          </div>

          {/* 2. STUDENT INFORMATION BOX (2-column clean grid) */}
          <div className="border border-black p-2.5 bg-white font-sans mb-3">
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-[11px]">
              <div className="flex items-center gap-2">
                <span className="font-bold text-black">NAME:</span>
                <span className="font-bold text-black uppercase">{result.fullName}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-black">CLASS:</span>
                <span className="font-bold text-black uppercase">{result.className}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-black">ADM NO:</span>
                <span className="font-bold text-black uppercase font-mono">{result.studentId}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-black">GENDER:</span>
                <span className="font-bold text-black uppercase">{result.gender || 'MALE'}</span>
              </div>
            </div>
          </div>

          {/* 3. MAIN RESULT TABLE */}
          <div className="mb-3">
            <table className="w-full text-[11px] text-black border-collapse border border-black font-sans" style={{ borderCollapse: 'collapse', tableLayout: 'fixed' }}>
              <thead>
                <tr className="bg-[#e5e5e5] text-black font-bold border-b border-black text-center">
                  <th className="border border-black text-center align-middle" style={{ width: '35px', padding: '6px 4px', lineHeight: 'normal', verticalAlign: 'middle' }}>S/N</th>
                  <th className="border border-black text-left align-middle" style={{ padding: '6px 8px', lineHeight: 'normal', verticalAlign: 'middle' }}>SUBJECT</th>
                  <th className="border border-black text-center align-middle" style={{ width: '130px', padding: '6px 4px', lineHeight: 'normal', verticalAlign: 'middle' }}>1ST SUMMARY (20)</th>
                  <th className="border border-black text-center align-middle" style={{ width: '140px', padding: '6px 4px', lineHeight: 'normal', verticalAlign: 'middle' }}>1ST SUMMARY (100%)</th>
                  <th className="border border-black text-center align-middle" style={{ width: '90px', padding: '6px 4px', lineHeight: 'normal', verticalAlign: 'middle' }}>GS / NGS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black font-normal">
                {studentSubjects.length > 0 ? (
                  studentSubjects.map((sub, idx) => {
                    const rawCa = sub.caScore !== undefined ? sub.caScore : ((sub.ca1 || 0) + (sub.ca2 || 0) + (sub.midterm || 0));
                    const summary20 = Math.min(20, Math.round((rawCa / 40) * 20 || rawCa));
                    const summary100 = sub.total !== undefined ? sub.total : (rawCa + (sub.examScore || 0));
                    const isGS = summary20 >= 10;

                    return (
                      <tr key={sub.id || idx}>
                        <td className="border border-black text-center font-mono align-middle" style={{ padding: '6px 4px', lineHeight: 'normal', verticalAlign: 'middle' }}>{idx + 1}</td>
                        <td className="border border-black text-left uppercase align-middle" style={{ padding: '6px 8px', lineHeight: 'normal', verticalAlign: 'middle' }}>{sub.subject}</td>
                        <td className="border border-black text-center font-mono font-bold align-middle" style={{ padding: '6px 4px', lineHeight: 'normal', verticalAlign: 'middle' }}>{summary20}</td>
                        <td className="border border-black text-center font-mono font-bold align-middle" style={{ padding: '6px 4px', lineHeight: 'normal', verticalAlign: 'middle' }}>{summary100}%</td>
                        <td className={`border border-black text-center font-bold align-middle ${!isGS ? 'text-red-600 font-extrabold' : ''}`} style={{ padding: '6px 4px', lineHeight: 'normal', verticalAlign: 'middle' }}>
                          {isGS ? 'GS' : 'NGS'}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="p-4 text-center font-bold text-slate-500 uppercase tracking-wider border border-black align-middle" style={{ padding: '12px 8px', lineHeight: 'normal', verticalAlign: 'middle' }}>
                      No subjects entered for this student yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* 4. BOTTOM GRID LAYOUT (3 COLUMNS) */}
          <div className="grid grid-cols-3 gap-3 mb-3">
            
            {/* LEFT BOX: KEY & ANALYSIS */}
            <div className="space-y-2">
              {/* KEY BOX */}
              <div className="border border-black p-2 bg-white text-[10px]">
                <h4 className="font-bold text-[11px] uppercase border-b border-black pb-0.5 mb-1 text-black">
                  KEY
                </h4>
                <div className="space-y-0.5 font-bold text-black">
                  <p>GS = IN GOOD STANDING</p>
                  <p>NGS = NOT IN GOOD STANDING</p>
                </div>
              </div>

              {/* ANALYSIS BOX */}
              <div className="border border-black p-2 bg-white text-[10px]">
                <h4 className="font-bold text-[11px] uppercase border-b border-black pb-0.5 mb-1 text-black">
                  ANALYSIS
                </h4>
                <div className="space-y-1 font-semibold text-black">
                  <div className="flex justify-between items-center">
                    <span>Subjects in Good Standing:</span>
                    <span className="font-mono font-bold">{subjectsPassed}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Subjects Not in Good Standing:</span>
                    <span className="font-mono font-bold">{subjectsFailed}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* CENTER BOX: GRADING SCALE TABLE */}
            <div className="border border-black p-2 text-[10px] bg-white">
              <h4 className="font-bold text-[11px] uppercase border-b border-black pb-0.5 mb-1 text-black text-center">
                GRADING SCALE
              </h4>
              <table className="w-full text-[10px] text-center border-collapse border border-black" style={{ borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                <thead>
                  <tr className="bg-[#e5e5e5] font-bold border-b border-black">
                    <th className="border border-black" style={{ padding: '2px 4px' }}>Percentage</th>
                    <th className="border border-black" style={{ padding: '2px 4px' }}>Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black font-semibold text-black">
                  <tr>
                    <td className="border border-black" style={{ padding: '2px 4px' }}>100 – 80</td>
                    <td className="border border-black font-bold" style={{ padding: '2px 4px' }}>A</td>
                  </tr>
                  <tr>
                    <td className="border border-black" style={{ padding: '2px 4px' }}>79.99 – 70</td>
                    <td className="border border-black font-bold" style={{ padding: '2px 4px' }}>B1</td>
                  </tr>
                  <tr>
                    <td className="border border-black" style={{ padding: '2px 4px' }}>69.99 – 60</td>
                    <td className="border border-black font-bold" style={{ padding: '2px 4px' }}>B2</td>
                  </tr>
                  <tr>
                    <td className="border border-black" style={{ padding: '2px 4px' }}>59.99 – 55</td>
                    <td className="border border-black font-bold" style={{ padding: '2px 4px' }}>P1</td>
                  </tr>
                  <tr>
                    <td className="border border-black" style={{ padding: '2px 4px' }}>54.99 – 50</td>
                    <td className="border border-black font-bold" style={{ padding: '2px 4px' }}>P2</td>
                  </tr>
                  <tr>
                    <td className="border border-black" style={{ padding: '2px 4px' }}>49.99 – 0</td>
                    <td className="border border-black font-bold text-red-600" style={{ padding: '2px 4px' }}>F9</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* RIGHT BOX: AUTHENTICATION, STAMP & SIGNATURE */}
            <div className="border border-black p-2 bg-white text-[10px] flex flex-col justify-between relative min-h-[165px]">
              <h4 className="font-bold text-[11px] uppercase border-b border-black pb-0.5 text-black text-center">
                AUTHENTICATION
              </h4>

              {/* Stamp & Signature Canvas Overlay Area */}
              <div className="relative flex-1 my-1 flex items-center justify-center overflow-visible min-h-[100px]">
                {/* Official Rubber Stamp */}
                <div
                  className="absolute z-10 pointer-events-none"
                  style={{
                    transform: brandingState?.positions?.stamp
                      ? `translate(${brandingState.positions.stamp.x}px, ${brandingState.positions.stamp.y}px) scale(${brandingState.positions.stamp.scale || 1}) rotate(${brandingState.positions.stamp.rotate || -12}deg)`
                      : 'rotate(-12deg)',
                  }}
                >
                  {brandingState?.stampUrl ? (
                    <img src={brandingState.stampUrl} alt="Official Stamp" className="w-32 h-32 object-contain" />
                  ) : (
                    <div className="w-32 h-32 border-2 border-dashed border-black rounded-full flex flex-col items-center justify-center p-2 text-center bg-transparent">
                      <span className="text-[10px] font-extrabold uppercase leading-none text-black">FAITH ACADEMY</span>
                      <span className="text-[8px] font-bold uppercase leading-none mt-1 text-black">OFFICIAL STAMP</span>
                    </div>
                  )}
                </div>

                {/* Principal Signature */}
                <div
                  className="absolute z-20 pointer-events-none"
                  style={{
                    transform: brandingState?.positions?.signature
                      ? `translate(${brandingState.positions.signature.x}px, ${brandingState.positions.signature.y}px) scale(${brandingState.positions.signature.scale || 1}) rotate(${brandingState.positions.signature.rotate || 0}deg)`
                      : 'none',
                  }}
                >
                  {brandingState?.signatureUrl ? (
                    <img src={brandingState.signatureUrl} alt="Principal Signature" className="h-20 max-w-[220px] object-contain" />
                  ) : (
                    <span className="font-bold text-lg font-serif italic tracking-wider text-black">Principal Signature</span>
                  )}
                </div>
              </div>

              {/* Bottom bar */}
              <div className="border-t border-black pt-1 flex justify-between items-center text-[10px] font-bold text-black">
                <span>DATE: {result.issueDate || 'August 05, 2025'}</span>
                <span>PRINCIPAL</span>
              </div>
            </div>

          </div>

          {/* 5. REMARKS SECTION */}
          <div className="border border-black p-2 bg-white text-[11px] mb-3">
            <span className="font-bold text-black uppercase">PRINCIPAL'S REMARK: </span>
            <span className="italic text-black">
              {brandingState?.principalRemark !== undefined && brandingState?.principalRemark !== null
                ? (brandingState.principalRemark.trim() || 'N/A')
                : (result.principalRemark?.trim() || 'N/A')}
            </span>
          </div>

          {/* 6. WATERMARK / FOOTER NOTICE */}
          <div className="text-center pt-2">
            <p className="text-[9px] font-bold uppercase tracking-wider text-black">
              *** FAITH ACADEMY OFFICIAL COMPUTER GENERATED MIDTERM RESULT SLIP ***
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};
