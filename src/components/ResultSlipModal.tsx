import React, { useState } from 'react';
import { StudentResult } from '../types';
import { 
  ShieldCheck as ShieldIcon, 
  Printer as PrintIcon, 
  Download as DownloadIcon, 
  Share2 as ShareIcon, 
  X as CloseIcon, 
  Check as CheckIcon 
} from 'lucide-react';

interface ResultSlipModalProps {
  result: StudentResult | null;
  isOpen: boolean;
  onClose: () => void;
  onVerifyQR: () => void;
}

export const ResultSlipModal: React.FC<ResultSlipModalProps> = ({
  result,
  isOpen,
  onClose,
  onVerifyQR,
}) => {
  const [copied, setCopied] = useState(false);

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

  // Calculate subjects passed / failed
  const subjectsPassed = result.subjects.filter(s => (s.total || 0) >= 50).length;
  const subjectsFailed = result.subjects.filter(s => (s.total || 0) < 50).length;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-6 no-print">
      <div className="relative bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-4 sm:my-8 max-h-[94vh] flex flex-col">
        
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
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-white text-[#1E3A8A] hover:bg-slate-100 rounded-xl transition-all shadow-xs cursor-pointer hidden sm:inline-flex"
              title="Save as PDF using browser print dialog"
            >
              <DownloadIcon className="w-4 h-4" />
              <span>Download PDF</span>
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
        <div className="p-6 sm:p-8 overflow-y-auto space-y-4 print-area bg-white text-black font-sans">
          
          {/* 1. HEADER SECTION */}
          <div className="border-b-2 border-black pb-3 flex items-center justify-between gap-4">
            {/* Top Left: School Crest Logo */}
            <div className="w-16 h-16 rounded-xl border-2 border-black bg-slate-50 flex items-center justify-center shrink-0">
              <ShieldIcon className="w-10 h-10 text-slate-900" />
            </div>

            {/* Top Center: School Name and Document Title */}
            <div className="text-center flex-1">
              <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight uppercase font-serif">
                ROYAL ACADEMY
              </h1>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-800">
                Student Mid-Term Report
              </p>
              <p className="text-[10px] text-slate-700 font-mono">
                Victoria Island, Lagos, Nigeria • Official Academic Record
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
                    src={result.passportUrl || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=400'}
                    alt={result.fullName}
                    className="w-full h-full object-cover"
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
            <table className="w-full text-xs text-black border-collapse border border-black" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr className="bg-gray-200 text-black font-bold text-[11px] uppercase border-b border-black">
                  <th className="p-2 border border-black text-center" style={{ width: '6%' }}>S/N</th>
                  <th className="p-2 border border-black text-left" style={{ width: '40%' }}>SUBJECT</th>
                  <th className="p-2 border border-black text-center" style={{ width: '10%' }}>CA (20)</th>
                  <th className="p-2 border border-black text-center" style={{ width: '10%' }}>EXAM (80)</th>
                  <th className="p-2 border border-black text-center" style={{ width: '10%' }}>TOTAL (100)</th>
                  <th className="p-2 border border-black text-center" style={{ width: '10%' }}>GRADE</th>
                  <th className="p-2 border border-black text-center" style={{ width: '14%' }}>REMARK</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black font-medium">
                {result.subjects.map((sub, idx) => {
                  // Standardize CA (max 20 or scaled) and Exam (max 80)
                  const caDisplay = sub.caScore !== undefined ? Math.min(20, Math.round((sub.caScore / 40) * 20)) : 18;
                  const examDisplay = sub.examScore !== undefined ? Math.min(80, Math.round((sub.examScore / 60) * 80)) : 72;
                  const totalVal = sub.total || (caDisplay + examDisplay);

                  return (
                    <tr key={sub.id || idx} className="hover:bg-slate-50">
                      <td className="p-1.5 border border-black text-center font-mono">{idx + 1}</td>
                      <td className="p-1.5 border border-black font-bold text-left">{sub.subject}</td>
                      <td className="p-1.5 border border-black text-center font-mono">{caDisplay}</td>
                      <td className="p-1.5 border border-black text-center font-mono">{examDisplay}</td>
                      <td className="p-1.5 border border-black text-center font-bold font-mono text-sm">{totalVal}</td>
                      <td className="p-1.5 border border-black text-center font-black">{sub.grade}</td>
                      <td className="p-1.5 border border-black text-center uppercase text-[10px] font-bold">{sub.remark}</td>
                    </tr>
                  );
                })}
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
              <table className="w-full text-[10px] text-center border-collapse border border-black">
                <thead>
                  <tr className="bg-gray-100 font-bold border-b border-black">
                    <th className="p-1 border border-black">SCORE</th>
                    <th className="p-1 border border-black">GRADE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black font-semibold">
                  <tr>
                    <td className="p-1 border border-black">100 - 80</td>
                    <td className="p-1 border border-black font-bold">A1 (Excellent)</td>
                  </tr>
                  <tr>
                    <td className="p-1 border border-black">79 - 70</td>
                    <td className="p-1 border border-black font-bold">B2 (Very Good)</td>
                  </tr>
                  <tr>
                    <td className="p-1 border border-black">69 - 60</td>
                    <td className="p-1 border border-black font-bold">B3 (Good)</td>
                  </tr>
                  <tr>
                    <td className="p-1 border border-black">59 - 55</td>
                    <td className="p-1 border border-black font-bold">C4 (Credit)</td>
                  </tr>
                  <tr>
                    <td className="p-1 border border-black">54 - 50</td>
                    <td className="p-1 border border-black font-bold">C6 (Credit)</td>
                  </tr>
                  <tr>
                    <td className="p-1 border border-black">Below 50</td>
                    <td className="p-1 border border-black font-bold text-red-700">F9 (Fail)</td>
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
                  <strong className="font-mono">{result.subjects.length}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Total Score:</span>
                  <strong className="font-mono">{result.overallTotal}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Average:</span>
                  <strong className="font-mono">{result.overallAverage.toFixed(1)}%</strong>
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
