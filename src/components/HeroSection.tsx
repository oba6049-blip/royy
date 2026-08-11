import React from 'react';
import { motion } from 'motion/react';
import { Search, ShieldCheck, Award, ArrowRight, CheckCircle2 } from 'lucide-react';
import { MOCK_STUDENTS } from '../data/mockData';

interface HeroSectionProps {
  onCheckResultClick: () => void;
  onLearnMoreClick: () => void;
  onQuickVerifyClick?: (studentId: string) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onCheckResultClick,
  onLearnMoreClick,
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
                <span>Verified QR Code</span>
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

            {/* Floating Card showcasing actual Faith Academy Report Slip */}
            <div 
              className="relative glass-panel rounded-3xl p-2 sm:p-3 shadow-2xl border border-white/80"
            >
              <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200/80 bg-white">
                <img
                  src="https://i.imgur.com/dCQ2GMv.png"
                  alt="Faith Academy Ikorodu Midterm Report Slip"
                  className="w-full h-auto object-contain"
                />
              </div>

              {/* Floating Badge Accent */}
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -top-3 -right-3 bg-gradient-to-r from-[#F59E0B] to-[#d97706] text-white px-3.5 py-1.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold border border-yellow-300/40 z-20"
              >
                <Award className="w-4 h-4 text-white" />
                <span>Faith Academy Student Report</span>
              </motion.div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};
