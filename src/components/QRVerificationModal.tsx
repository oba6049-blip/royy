import React from 'react';
import { MOCK_STUDENTS } from '../data/mockData';
import { ShieldCheck, CheckCircle2, QrCode, X, Copy, ExternalLink, Sparkles } from 'lucide-react';

interface QRVerificationModalProps {
  studentId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const QRVerificationModal: React.FC<QRVerificationModalProps> = ({
  studentId,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const student = studentId ? MOCK_STUDENTS[studentId] || MOCK_STUDENTS['RA/2025/1042'] : MOCK_STUDENTS['RA/2025/1042'];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 text-slate-900 relative">
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Status Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-inner">
            <ShieldCheck className="w-10 h-10" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-extrabold uppercase tracking-wider border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>AUTHENTIC REPORT VERIFIED</span>
          </div>

          <h3 className="text-lg font-black text-[#0F172A] font-['Plus_Jakarta_Sans']">
            Cryptographic QR Verification
          </h3>
          <p className="text-xs text-slate-500">
            This result slip was authenticated against Royal Academy official database.
          </p>
        </div>

        {/* QR Visual */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col items-center gap-2">
          {/* Simulated High-Res QR code */}
          <div className="p-3 bg-white rounded-2xl border border-slate-300 shadow-xs relative">
            <QrCode className="w-32 h-32 text-[#1E3A8A]" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 rounded-lg bg-[#1E3A8A] text-[#F59E0B] font-extrabold text-[10px] flex items-center justify-center shadow-md">
                RA
              </div>
            </div>
          </div>
          <span className="text-[10px] font-mono text-slate-500 font-bold">{student.verificationHash}</span>
        </div>

        {/* Verified Details List */}
        <div className="space-y-2 text-xs bg-slate-50 p-3.5 rounded-2xl border border-slate-200 font-medium">
          <div className="flex justify-between border-b border-slate-200/80 pb-1.5">
            <span className="text-slate-400 font-bold uppercase text-[10px]">Student Name</span>
            <span className="font-extrabold text-[#0F172A]">{student.fullName}</span>
          </div>
          <div className="flex justify-between border-b border-slate-200/80 pb-1.5">
            <span className="text-slate-400 font-bold uppercase text-[10px]">Reg Number</span>
            <span className="font-mono font-bold text-[#1E3A8A]">{student.studentId}</span>
          </div>
          <div className="flex justify-between border-b border-slate-200/80 pb-1.5">
            <span className="text-slate-400 font-bold uppercase text-[10px]">Academic Session</span>
            <span className="font-bold text-slate-800">{student.academicSession}</span>
          </div>
          <div className="flex justify-between border-b border-slate-200/80 pb-1.5">
            <span className="text-slate-400 font-bold uppercase text-[10px]">Position / Total</span>
            <span className="font-bold text-slate-800">{student.position} of {student.totalInClass}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400 font-bold uppercase text-[10px]">GPA / Average</span>
            <span className="font-black text-emerald-600">{student.gpa.toFixed(2)} ({student.overallAverage.toFixed(1)}%)</span>
          </div>
        </div>

        {/* Footer Button */}
        <button
          onClick={onClose}
          className="w-full py-3 bg-[#1E3A8A] hover:bg-[#1e40af] text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
        >
          Close Verification Window
        </button>

      </div>
    </div>
  );
};
