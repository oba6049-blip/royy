import React, { useState } from 'react';
import { StudentResult } from '../types';
import {
  Printer,
  Download,
  QrCode,
  CheckCircle2,
  X,
  Share2,
  Award,
  ShieldCheck,
  Building,
  Calendar,
  User,
  Check,
  Sparkles
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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 no-print">
      <div className="relative bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[92vh] flex flex-col">
        
        {/* Top Control Bar (Hidden when printing) */}
        <div className="bg-[#1E3A8A] text-white px-6 py-4 flex items-center justify-between shrink-0 no-print border-b border-[#60A5FA]/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/10 border border-white/20">
              <ShieldCheck className="w-5 h-5 text-[#F59E0B]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Official Student Result Slip</h3>
              <p className="text-xs text-blue-200 font-mono">Reg ID: {result.studentId}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-[#F59E0B] hover:bg-amber-500 text-slate-900 rounded-xl transition-all shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Slip</span>
            </button>

            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
              <span>{copied ? 'Copied Link!' : 'Share'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-xl text-white/80 hover:text-white transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Printable Result Slip Body */}
        <div className="p-6 sm:p-10 overflow-y-auto space-y-6 print-area bg-white">
          
          {/* Header Banner with Crest */}
          <div className="border-b-2 border-[#1E3A8A] pb-6 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Crest Logo */}
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1E3A8A] to-[#0F172A] p-2 flex items-center justify-center text-white shadow-md border-2 border-[#F59E0B] shrink-0">
                <ShieldCheck className="w-10 h-10 text-[#F59E0B]" />
              </div>

              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-[#1E3A8A] tracking-tight font-['Plus_Jakarta_Sans'] uppercase">
                  ROYAL ACADEMY
                </h1>
                <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">
                  Excellence, Discipline & Character
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  100 Royal Academy Drive, Victoria Island, Lagos State, Nigeria • Contact: +234 800 769 2522
                </p>
              </div>
            </div>

            <div className="text-center sm:text-right bg-slate-50 p-3 rounded-2xl border border-slate-200 shrink-0">
              <span className="inline-block px-3 py-1 rounded-full bg-[#1E3A8A] text-white text-[10px] font-extrabold uppercase tracking-wider mb-1">
                {result.term}
              </span>
              <p className="text-xs font-bold text-slate-800">{result.academicSession}</p>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">Issued: {result.issueDate}</p>
            </div>
          </div>

          {/* Student Profile Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-slate-50/70 rounded-2xl p-4 sm:p-5 border border-slate-200">
            {/* Passport Photo */}
            <div className="md:col-span-3 flex flex-col items-center justify-center">
              <div className="relative w-32 h-40 rounded-2xl overflow-hidden border-2 border-[#1E3A8A] shadow-md bg-slate-200">
                <img
                  src={result.passportUrl}
                  alt={result.fullName}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 inset-x-0 bg-[#1E3A8A]/90 text-white text-[9px] font-bold text-center py-0.5 uppercase tracking-wider">
                  VERIFIED STUDENT
                </div>
              </div>
            </div>

            {/* Student Info Details */}
            <div className="md:col-span-9 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3 text-xs">
              <div>
                <span className="block text-[10px] font-bold uppercase text-slate-400">Full Name</span>
                <span className="font-extrabold text-slate-900 text-sm block">{result.fullName}</span>
              </div>

              <div>
                <span className="block text-[10px] font-bold uppercase text-slate-400">Reg No.</span>
                <span className="font-mono font-bold text-[#1E3A8A] text-sm block">{result.studentId}</span>
              </div>

              <div>
                <span className="block text-[10px] font-bold uppercase text-slate-400">Class</span>
                <span className="font-bold text-slate-800 text-xs block">{result.className}</span>
              </div>

              <div>
                <span className="block text-[10px] font-bold uppercase text-slate-400">Position in Class</span>
                <span className="font-bold text-slate-900 text-xs block">
                  {result.position} <span className="text-slate-400 font-normal">out of {result.totalInClass}</span>
                </span>
              </div>

              <div>
                <span className="block text-[10px] font-bold uppercase text-slate-400">Term Average</span>
                <span className="font-black text-emerald-600 text-sm block">{result.overallAverage.toFixed(1)}%</span>
              </div>

              <div>
                <span className="block text-[10px] font-bold uppercase text-slate-400">GPA (4.0 Scale)</span>
                <span className="font-black text-[#1E3A8A] text-sm block">{result.gpa.toFixed(2)}</span>
              </div>

              <div>
                <span className="block text-[10px] font-bold uppercase text-slate-400">Academic Status</span>
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] uppercase mt-0.5">
                  {result.status}
                </span>
              </div>

              <div>
                <span className="block text-[10px] font-bold uppercase text-slate-400">Attendance</span>
                <span className="font-bold text-slate-800 text-xs block">
                  {result.attendance.timesPresent} / {result.attendance.timesOpened} Days
                </span>
              </div>

              <div>
                <span className="block text-[10px] font-bold uppercase text-slate-400">Verification Hash</span>
                <span className="font-mono text-[10px] text-slate-600 truncate block">{result.verificationHash}</span>
              </div>
            </div>
          </div>

          {/* Academic Subject Grades Table */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2 flex items-center justify-between">
              <span>ACADEMIC PERFORMANCE SCORECARD</span>
              <span>TOTAL SUBJECTS: {result.subjects.length}</span>
            </h3>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#1E3A8A] text-white font-bold text-[11px] uppercase">
                    <th className="p-3 border-b border-[#1E3A8A]">#</th>
                    <th className="p-3 border-b border-[#1E3A8A]">Subject Name</th>
                    <th className="p-3 border-b border-[#1E3A8A] text-center">C.A. (40)</th>
                    <th className="p-3 border-b border-[#1E3A8A] text-center">Exam (60)</th>
                    <th className="p-3 border-b border-[#1E3A8A] text-center">Total (100)</th>
                    <th className="p-3 border-b border-[#1E3A8A] text-center">Grade</th>
                    <th className="p-3 border-b border-[#1E3A8A]">Remark</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white font-medium">
                  {result.subjects.map((sub, idx) => (
                    <tr key={sub.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                      <td className="p-3 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                      <td className="p-3 font-bold text-slate-900">{sub.subject}</td>
                      <td className="p-3 text-center text-slate-600 font-mono">{sub.caScore}</td>
                      <td className="p-3 text-center text-slate-600 font-mono">{sub.examScore}</td>
                      <td className="p-3 text-center font-bold text-[#1E3A8A] font-mono text-sm">{sub.total}</td>
                      <td className="p-3 text-center">
                        <span className="inline-block px-2 py-0.5 rounded-lg bg-blue-50 text-[#1E3A8A] font-black font-mono border border-blue-200 text-xs">
                          {sub.grade}
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-slate-700 text-[11px]">{sub.remark}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Grade Legend Scale */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-[10px] text-slate-600 flex flex-wrap items-center justify-between gap-2">
            <span className="font-bold text-slate-800 uppercase">Grade Scale:</span>
            <span>A1 (75-100% Excellent)</span>
            <span>B2 (70-74% Very Good)</span>
            <span>B3 (65-69% Good)</span>
            <span>C4-C6 (50-64% Credit)</span>
            <span>D7-E8 (40-49% Pass)</span>
            <span>F9 (0-39% Fail)</span>
          </div>

          {/* Remarks & Signatures Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200 space-y-2">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Class Teacher's Remark</span>
              <p className="text-xs font-semibold text-slate-800 italic leading-relaxed">
                "{result.classTeacherRemark}"
              </p>
              <div className="pt-3 flex items-center justify-between border-t border-slate-200 text-[11px]">
                <span className="font-bold text-slate-700">Mr. Arthur Vance, M.Ed</span>
                <span className="text-slate-400">Class Master</span>
              </div>
            </div>

            <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200 space-y-2">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Principal's Remark & Endorsement</span>
              <p className="text-xs font-semibold text-slate-800 italic leading-relaxed">
                "{result.principalRemark}"
              </p>
              
              {/* Signature & Seal */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                <div>
                  <div className="font-serif italic font-bold text-lg text-[#1E3A8A] tracking-wider">
                    Dr. H. E. Montgomery
                  </div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Principal & Registrar</span>
                </div>

                {/* Gold Seal Stamp */}
                <div className="w-14 h-14 rounded-full border-2 border-[#F59E0B] bg-gradient-to-tr from-amber-100 via-amber-50 to-white p-1 flex flex-col items-center justify-center text-center shadow-sm shrink-0 gold-glow">
                  <div className="w-full h-full rounded-full border border-dashed border-[#F59E0B] flex flex-col items-center justify-center">
                    <span className="text-[8px] font-black text-amber-800 uppercase leading-none">ROYAL</span>
                    <Sparkles className="w-3 h-3 text-[#F59E0B] my-0.5" />
                    <span className="text-[7px] font-bold text-amber-700 leading-none">SEAL</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* QR Code Security Stamp Footer */}
          <div className="border-t border-slate-200 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-3">
              <button
                onClick={onVerifyQR}
                className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-[#1E3A8A] transition-colors flex items-center gap-2 font-bold cursor-pointer no-print"
              >
                <QrCode className="w-6 h-6 text-[#1E3A8A]" />
                <span>Scan / Verify Authenticity</span>
              </button>

              <div className="print-area">
                <p className="font-bold text-slate-800">Tamper-Evident Verification Code</p>
                <p className="font-mono text-[10px] text-slate-500">{result.verificationHash}</p>
              </div>
            </div>

            <p className="text-[10px] text-center sm:text-right text-slate-400">
              Generated by Royal Academy Official Portal • All Rights Reserved © {new Date().getFullYear()}
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};
