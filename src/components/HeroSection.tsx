import React from 'react';
import { motion } from 'motion/react';
import { Search, ShieldCheck, Award, ArrowRight, CheckCircle2, Sparkles, QrCode, FileCheck } from 'lucide-react';
import { MOCK_STUDENTS } from '../data/mockData';

interface HeroSectionProps {
  onCheckResultClick: () => void;
  onLearnMoreClick: () => void;
  onQuickVerifyClick: (studentId: string) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onCheckResultClick,
  onLearnMoreClick,
  onQuickVerifyClick,
}) => {
  const sampleStudent = MOCK_STUDENTS['2025104'] || Object.values(MOCK_STUDENTS)[0];

  if (!sampleStudent) return null;

  return (
    <section id="home" className="relative pt-28 pb-16 lg:pt-36 lg:pb-24 overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-50">
      {/* Background Decorative Shapes & Subtle Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 pointer-events-none overflow-hidden">
        <div className="absolute -top-24 left-1/4 w-96 h-96 bg-[#60A5FA]/15 rounded-full blur-3xl" />
        <div className="absolute top-12 right-10 w-80 h-80 bg-[#F59E0B]/10 rounded-full blur-3xl" />
        <div className="absolute top-40 left-10 w-72 h-72 bg-[#1E3A8A]/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Heading & Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-6 flex flex-col items-start text-left space-y-6"
          >
            {/* Top Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-[#1E3A8A] text-xs font-bold shadow-xs">
              <span className="flex h-2 w-2 rounded-full bg-[#F59E0B] animate-ping" />
              <span className="text-[#F59E0B] font-extrabold">●</span>
              <span>Official Result Portal 2024/2025 Academic Session</span>
            </div>

            {/* Main Title */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#0F172A] tracking-tight leading-[1.1] font-['Plus_Jakarta_Sans']">
              Student Result <br />
              <span className="bg-gradient-to-r from-[#1E3A8A] via-[#1e40af] to-[#60A5FA] bg-clip-text text-transparent">
                Portal
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-base sm:text-lg text-[#64748B] leading-relaxed max-w-xl">
              Access your examination results quickly, securely, and conveniently from anywhere. No login required. Simply enter your student details to instantly view your official academic results.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto pt-2">
              <button
                onClick={onCheckResultClick}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-bold text-white bg-[#1E3A8A] hover:bg-[#1e40af] rounded-2xl shadow-lg royal-glow transition-all duration-200 active:scale-95 border border-[#60A5FA]/30 group cursor-pointer"
              >
                <Search className="w-4 h-4 text-[#F59E0B] group-hover:scale-110 transition-transform" />
                <span>Check Result Now</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={onLearnMoreClick}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 rounded-2xl shadow-sm border border-slate-200 transition-all duration-200 active:scale-95 cursor-pointer"
              >
                <span>Learn How It Works</span>
              </button>
            </div>

            {/* Quick Feature Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-200/80 w-full text-xs text-slate-600 font-medium">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
                <span>No Password Needed</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#1E3A8A]" />
                <span>Cryptographic QR</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-[#F59E0B]" />
                <span>Official PDF Slip</span>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Floating Interactive Result Preview Mockup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="lg:col-span-6 relative"
          >
            {/* Outer Glow backdrop */}
            <div className="absolute inset-0 bg-gradient-to-tr from-[#1E3A8A]/10 via-[#60A5FA]/20 to-[#F59E0B]/10 rounded-3xl blur-2xl transform rotate-1 scale-105" />

            {/* Interactive Floating Card */}
            <div className="relative glass-panel rounded-3xl p-5 sm:p-6 shadow-2xl border border-white/80 transition-all duration-300 hover:shadow-3xl">
              
              {/* Card Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-200/80">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#1E3A8A] flex items-center justify-center text-white font-bold text-xs shadow-md border border-[#F59E0B]/40">
                    RA
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-[#0F172A] tracking-tight">ROYAL ACADEMY</h3>
                    <p className="text-[11px] text-slate-500 font-medium">Official Examination Slip</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    VERIFIED
                  </span>
                </div>
              </div>

              {/* Student Passport & Profile Details */}
              <div className="grid grid-cols-12 gap-4 py-4 items-center">
                <div className="col-span-4 sm:col-span-3">
                  <div className="relative rounded-2xl overflow-hidden border-2 border-[#1E3A8A]/20 shadow-sm aspect-3/4 bg-slate-100">
                    <img
                      src={sampleStudent?.passportUrl || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=400'}
                      alt={sampleStudent?.fullName || 'Student Passport'}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-1 right-1 bg-[#1E3A8A] text-[#F59E0B] p-1 rounded-lg text-[9px] font-black">
                      PASSPORT
                    </div>
                  </div>
                </div>

                <div className="col-span-8 sm:col-span-9 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Student Name</span>
                    <span className="text-[11px] font-mono text-[#1E3A8A] font-bold">{sampleStudent.studentId}</span>
                  </div>
                  <h4 className="text-base sm:text-lg font-black text-[#0F172A] font-['Plus_Jakarta_Sans']">
                    {sampleStudent.fullName}
                  </h4>

                  <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                    <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                      <span className="block text-[10px] text-slate-400 font-medium">Class</span>
                      <span className="font-bold text-slate-800 text-[11px] truncate block">SSS 3 Science</span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                      <span className="block text-[10px] text-slate-400 font-medium">Session</span>
                      <span className="font-bold text-slate-800 text-[11px] truncate block">2024/2025</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Subject Mini Summary Table */}
              <div className="mt-2 bg-slate-50/80 rounded-2xl p-3 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 px-1 border-b border-slate-200 pb-1.5">
                  <span>Subject</span>
                  <span>Score</span>
                  <span>Grade</span>
                </div>

                <div className="space-y-1.5 text-xs font-medium">
                  {sampleStudent.subjects.slice(0, 3).map((sub) => (
                    <div key={sub.id} className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-xl border border-slate-100 shadow-xs">
                      <span className="font-semibold text-slate-800">{sub.subject}</span>
                      <span className="font-mono text-slate-600">{sub.total}/100</span>
                      <span className="px-2 py-0.5 rounded-lg bg-blue-50 text-[#1E3A8A] font-bold text-[11px] border border-blue-100">
                        {sub.grade}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Metrics Bar */}
              <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Overall GPA</span>
                  <span className="text-xl font-black text-[#1E3A8A] font-['Plus_Jakarta_Sans']">
                    3.92 <span className="text-xs text-slate-400 font-normal">/ 4.0</span>
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Average</span>
                  <span className="text-xl font-black text-emerald-600 font-['Plus_Jakarta_Sans']">
                    89.4%
                  </span>
                </div>

                <button
                  onClick={() => onQuickVerifyClick(sampleStudent.studentId)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1E3A8A]/10 hover:bg-[#1E3A8A]/20 text-[#1E3A8A] rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  <QrCode className="w-3.5 h-3.5 text-[#F59E0B]" />
                  <span>Verify QR</span>
                </button>
              </div>

              {/* Floating Badge Accent */}
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -top-4 -right-4 bg-gradient-to-r from-[#F59E0B] to-[#d97706] text-white px-3.5 py-2 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold border border-yellow-300/40"
              >
                <Award className="w-4 h-4 text-white" />
                <span>1st Position in Class</span>
              </motion.div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};
