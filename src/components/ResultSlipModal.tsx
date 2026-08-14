import React, { useState, useRef } from 'react';
import { StudentResult, SchoolHeaderInfo, DEFAULT_SCHOOL_HEADER } from '../types';
import { api } from '../services/api';
import { filterStudentSubjectsByAdmin } from '../utils/subjectUtils';
import { calculateAgeFromDob, formatDateDisplay } from '../utils/studentDateUtils';
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
  branding?: { logoUrl?: string | null; stampUrl?: string | null; signatureUrl?: string | null; principalRemark?: string | null; positions?: any };
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
  const [selectedTermKey, setSelectedTermKey] = useState<string>('');
  const printRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (result) {
      setSelectedTermKey(`${result.academicSession || ''}__${result.term || ''}`);
    }
  }, [result]);

  const availableTermOptions = React.useMemo(() => {
    if (!result) return [];
    const list: Array<{ key: string; label: string; normKey: string }> = [];

    const normSess = (s: string) => (s || '').toLowerCase().replace(/academic|session|\s/g, '');
    const getTermId = (t: string) => {
      const l = (t || '').toLowerCase();
      if (l.includes('first') || l.includes('1st') || l.includes('1')) return '1';
      if (l.includes('second') || l.includes('2nd') || l.includes('2')) return '2';
      if (l.includes('third') || l.includes('3rd') || l.includes('3')) return '3';
      return l.replace(/\s/g, '');
    };
    const normTerm = (t: string) => getTermId(t);
    const normClass = (c: string) => (c || '').toLowerCase().replace(/\s/g, '');

    const addOpt = (sess: string, trm: string, cls: string) => {
      if (!sess || !trm) return;
      const nS = normSess(sess);
      const nT = normTerm(trm);
      const nC = normClass(cls || result.className || '');
      const nKey = `${nS}__${nT}__${nC}`;

      if (!list.some(o => o.normKey === nKey)) {
        list.push({
          key: `${sess}__${trm}`,
          normKey: nKey,
          label: `${cls || result.className || ''} — ${sess} (${trm})`,
        });
      }
    };

    if (result.termRecords && Array.isArray(result.termRecords)) {
      result.termRecords.forEach((r) => {
        addOpt(r.academicSession, r.term, r.className || result.className);
      });
    }

    addOpt(result.academicSession, result.term, result.className);

    return list;
  }, [result]);

  const activeResult = React.useMemo(() => {
    if (!result) return null;

    const hasValidScores = (subs: any[]) => {
      if (!subs || !Array.isArray(subs) || subs.length === 0) return false;
      return subs.some((s: any) => {
        const ca = Number(s.caScore ?? s.ca1 ?? s.ca ?? 0) + Number(s.ca2 ?? 0) + Number(s.midterm ?? 0);
        const exam = Number(s.examScore ?? s.exam ?? 0);
        const total = Number(s.total ?? (ca + exam));
        return total > 0;
      });
    };

    if (!selectedTermKey) {
      if (!hasValidScores(result.subjects)) {
        return {
          ...result,
          subjects: [],
          overallTotal: 0,
          overallAverage: 0,
          gpa: 0,
          position: 'N/A',
          totalInClass: 'N/A',
        };
      }
      return result;
    }

    const normSess = (s: string) => (s || '').toLowerCase().replace(/academic|session|\s/g, '');
    const getTermId = (t: string) => {
      const l = (t || '').toLowerCase();
      if (l.includes('first') || l.includes('1st') || l.includes('1')) return '1';
      if (l.includes('second') || l.includes('2nd') || l.includes('2')) return '2';
      if (l.includes('third') || l.includes('3rd') || l.includes('3')) return '3';
      return l.replace(/\s/g, '');
    };
    const normTerm = (t: string) => getTermId(t);

    const [selSess, selTerm] = selectedTermKey.split('__');
    const nS = normSess(selSess);
    const nT = normTerm(selTerm);

    const matchedRecord = result.termRecords?.find(
      (r) => normSess(r.academicSession) === nS && normTerm(r.term) === nT
    );

    if (matchedRecord) {
      const valid = matchedRecord.isPublished !== false && matchedRecord.status !== 'Unpublished' && hasValidScores(matchedRecord.subjects || []);
      return {
        ...result,
        academicSession: matchedRecord.academicSession,
        term: matchedRecord.term,
        className: matchedRecord.className || result.className,
        subjects: valid ? (matchedRecord.subjects || []) : [],
        overallTotal: valid ? (matchedRecord.overallTotal ?? 0) : 0,
        overallAverage: valid ? (matchedRecord.overallAverage ?? 0) : 0,
        gpa: valid ? (matchedRecord.gpa ?? 0) : 0,
        position: valid ? (matchedRecord.position ?? 'N/A') : 'N/A',
        totalInClass: valid ? (matchedRecord.totalInClass ?? 'N/A') : 'N/A',
        principalRemark: matchedRecord.principalRemark || result.principalRemark,
      };
    }

    const parts = selectedTermKey.split('__');
    const sess = parts[0] || result.academicSession;
    const trm = parts[1] || result.term;

    if (
      (result.academicSession || (result as any).session) === sess &&
      result.term === trm &&
      result.isPublished !== false &&
      result.status !== 'Unpublished' &&
      hasValidScores(result.subjects)
    ) {
      return result;
    }

    return {
      ...result,
      academicSession: sess,
      term: trm,
      subjects: [],
      overallTotal: 0,
      overallAverage: 0,
      gpa: 0,
      position: 'N/A',
      totalInClass: 'N/A',
    };
  }, [result, selectedTermKey]);

  const currentResult = activeResult || result;

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
    const defaultAvatar = createDefaultAvatarDataUrl(currentResult?.fullName || 'Student');

    if (!currentResult?.passportUrl) {
      setPassportBase64(defaultAvatar);
      return;
    }

    const src = currentResult.passportUrl;
    if (src.startsWith('data:')) {
      setPassportBase64(src);
      return;
    }

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
  }, [currentResult?.passportUrl, currentResult?.fullName, isOpen]);

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

  if (!isOpen || !currentResult) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    const url = `${window.location.origin}?studentId=${currentResult.studentId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Score evaluation helpers
  const getSubjectTotal = (sub: any) => {
    if (sub.total !== undefined && sub.total !== null) return Number(sub.total);
    const ca = sub.caScore !== undefined ? Number(sub.caScore) : ((Number(sub.ca1) || 0) + (Number(sub.ca2) || 0) + (Number(sub.midterm) || 0));
    const exam = Number(sub.examScore) || 0;
    return ca + exam;
  };

  const getSubjectGrade = (sub: any, total: number) => {
    if (sub.grade && sub.grade !== '' && sub.grade !== 'PENDING') return sub.grade;
    if (total >= 80) return 'A';
    if (total >= 70) return 'B1';
    if (total >= 60) return 'B2';
    if (total >= 55) return 'P1';
    if (total >= 50) return 'P2';
    return 'F9';
  };

  const getSubjectRemark = (sub: any, total: number) => {
    if (sub.remark && sub.remark !== '' && sub.remark !== 'PENDING') return sub.remark;
    if (total >= 80) return 'EXCELLENT';
    if (total >= 70) return 'VERY GOOD';
    if (total >= 60) return 'GOOD';
    if (total >= 50) return 'CREDIT';
    return 'FAIL';
  };

  const isSubjectPassed = (sub: any) => {
    const total = getSubjectTotal(sub);
    const grade = getSubjectGrade(sub, total);
    return total >= 50 && grade !== 'F9' && grade !== 'F';
  };

  // Calculate subjects passed / failed & totals dynamically
  const studentSubjects = filterStudentSubjectsByAdmin(currentResult?.subjects, adminSubjects);

  const subjectsPassed = studentSubjects.filter(s => isSubjectPassed(s)).length;
  const subjectsFailed = studentSubjects.filter(s => !isSubjectPassed(s)).length;
  const totalScoreCalculated = studentSubjects.reduce((acc, s) => acc + getSubjectTotal(s), 0);
  const averageScoreCalculated = studentSubjects.length > 0 
    ? (totalScoreCalculated / studentSubjects.length) 
    : (studentSubjects.length === 0 ? 0 : (currentResult?.overallAverage || 0));

  const getDynamicPrincipalRemark = (
    avgScore: number,
    gpa: number,
    passedCount: number,
    totalCount: number
  ): string => {
    if (totalCount === 0) {
      return 'NO EXAMINATION SCORES PUBLISHED FOR THIS ACADEMIC TERM.';
    }

    if (avgScore >= 80 || gpa >= 3.75) {
      return 'AN OUTSTANDING AND EXEMPLARY ACADEMIC PERFORMANCE! DEMONSTRATES EXCEPTIONAL INTELLECTUAL DISTINCTION, DISCIPLINE, AND HIGH CAPABILITY. KEEP UP THIS BRILLIANT TRAJECTORY.';
    } else if (avgScore >= 70 || gpa >= 3.00) {
      return 'A VERY GOOD ACADEMIC PERFORMANCE. SHOWS STRONG EFFORT, CONSISTENT APPLICATION, AND HIGH COMMITMENT TO LEARNING. STRIVE FOR TOP DISTINCTION NEXT TERM.';
    } else if (avgScore >= 60 || gpa >= 2.50) {
      return 'A GOOD AND CREDITABLE ACADEMIC PERFORMANCE. SATISFACTORY EFFORT DEMONSTRATED. WITH GREATER FOCUS AND REGULAR REVISION, EVEN HIGHER GRADES CAN BE ACHIEVED.';
    } else if (avgScore >= 50 || gpa >= 2.00) {
      return 'A SATISFACTORY PASSING PERFORMANCE. ACADEMIC STANDARD MET, BUT MORE DEDICATION, INTENSIVE STUDY, AND BETTER TIME MANAGEMENT ARE RECOMMENDED TO IMPROVE RESULTS.';
    } else if (avgScore >= 40 || gpa >= 1.50) {
      return 'FAIR ATTEMPT, BUT PERFORMANCE REQUIRES SIGNIFICANT IMPROVEMENT. SITTING UP, DILIGENT STUDY HABITS, AND CLOSE ACADEMIC SUPERVISION ARE STRONGLY ADVISED.';
    } else {
      return 'PERFORMANCE IS BELOW EXPECTED ACADEMIC STANDARDS. URGENT REMEDIAL INTERVENTION, STRICT STUDY DISCIPLINE, AND PROMPT PARENTAL MONITORING ARE REQUIRED.';
    }
  };

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
              <p className="text-xs text-blue-200 font-mono">Admission No (Reg ID): {currentResult.studentId}</p>
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

        {/* Term / Session Record Switcher */}
        {availableTermOptions.length > 0 && (
          <div className="bg-slate-100 border-b border-slate-200 px-6 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-2 no-print shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#1E3A8A]">Select Academic Session & Term Result:</span>
            </div>
            <select
              value={selectedTermKey || (availableTermOptions[0]?.key ?? '')}
              onChange={(e) => setSelectedTermKey(e.target.value)}
              className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
            >
              {availableTermOptions.map((opt) => (
                <option key={opt.key} value={opt.key}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}

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
                MIDTERM REPORT — {(currentResult.term || '').toUpperCase()} OF {(currentResult.academicSession || '').toUpperCase()}
              </h2>
            </div>

            {/* Top Right: Symmetrical empty spacer matching logo width */}
            <div className="w-[65px] h-[70px] shrink-0" />
          </div>

          {/* 2. STUDENT INFORMATION BOX (clean grid) */}
          <div className="border border-black p-2.5 bg-white font-sans mb-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2 text-[11px]">
              <div className="flex items-center gap-2">
                <span className="font-bold text-black">NAME:</span>
                <span className="font-bold text-black uppercase">{currentResult.fullName}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-black">CLASS:</span>
                <span className="font-bold text-black uppercase">{currentResult.className}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-black">ADM NO:</span>
                <span className="font-bold text-black uppercase font-mono">{currentResult.studentId}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-black">GENDER:</span>
                <span className="font-bold text-black uppercase">{currentResult.gender || 'MALE'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-black">DOB:</span>
                <span className="font-bold text-black uppercase">{formatDateDisplay(currentResult.dateOfBirth)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-black">AGE:</span>
                <span className="font-bold text-black uppercase">{currentResult.age || calculateAgeFromDob(currentResult.dateOfBirth)?.ageText || '—'}</span>
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
                  <th className="border border-black text-center align-middle" style={{ width: '80px', padding: '6px 4px', lineHeight: 'normal', verticalAlign: 'middle' }}>STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black font-normal">
                {studentSubjects.length > 0 ? (
                  studentSubjects.map((sub, idx) => {
                    const rawCa = sub.caScore !== undefined ? sub.caScore : ((sub.ca1 || 0) + (sub.ca2 || 0) + (sub.midterm || 0));
                    const totalScore = getSubjectTotal(sub);
                    const isGS = isSubjectPassed(sub);

                    return (
                      <tr key={sub.id || idx}>
                        <td className="border border-black text-center font-mono align-middle" style={{ padding: '6px 4px', lineHeight: 'normal', verticalAlign: 'middle' }}>{idx + 1}</td>
                        <td className="border border-black text-left uppercase align-middle" style={{ padding: '6px 8px', lineHeight: 'normal', verticalAlign: 'middle' }}>{sub.subject}</td>
                        <td className="border border-black text-center font-mono font-bold align-middle" style={{ padding: '6px 4px', lineHeight: 'normal', verticalAlign: 'middle' }}>{rawCa}</td>
                        <td className="border border-black text-center font-mono font-black align-middle" style={{ padding: '6px 4px', lineHeight: 'normal', verticalAlign: 'middle' }}>{totalScore}%</td>
                        <td className={`border border-black text-center font-extrabold align-middle ${!isGS ? 'text-red-600 font-extrabold' : 'text-emerald-800'}`} style={{ padding: '6px 4px', lineHeight: 'normal', verticalAlign: 'middle' }}>
                          {isGS ? 'GS' : 'NGS'}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="p-6 text-center font-bold text-amber-950 bg-amber-50 uppercase tracking-wide border border-black align-middle text-xs" style={{ padding: '16px 8px', lineHeight: 'normal', verticalAlign: 'middle' }}>
                      No result has been published for the selected Academic Session and Academic Term.
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
            <span className="italic text-black font-semibold uppercase">
              {getDynamicPrincipalRemark(
                averageScoreCalculated,
                currentResult?.gpa || 0,
                subjectsPassed,
                studentSubjects.length
              )}
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
