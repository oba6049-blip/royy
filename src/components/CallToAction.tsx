import React from 'react';
import { motion } from 'motion/react';
import { Search, Mail, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';

interface CallToActionProps {
  onCheckResultClick: () => void;
  onContactClick: () => void;
}

export const CallToAction: React.FC<CallToActionProps> = ({
  onCheckResultClick,
  onContactClick,
}) => {
  return (
    <section className="py-20 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Large Gradient Card */}
        <div className="relative rounded-3xl bg-gradient-to-br from-[#1E3A8A] via-[#1e40af] to-[#0F172A] p-8 sm:p-12 lg:p-16 text-white shadow-2xl overflow-hidden border border-[#60A5FA]/30">
          
          {/* Decorative shapes */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#F59E0B]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#60A5FA]/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto text-center space-y-6">
            
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-[#F59E0B] text-xs font-bold uppercase tracking-wider backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Instant Examination Results Portal</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight font-['Plus_Jakarta_Sans'] leading-tight">
              Ready to Access Official <br />
              <span className="text-[#F59E0B]">Student Results?</span>
            </h2>

            <p className="text-base sm:text-lg text-blue-100 max-w-xl mx-auto leading-relaxed">
              Experience seamless, secure, and instant result lookups. No login required for students. Print high-resolution report slips in seconds.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <button
                onClick={onCheckResultClick}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#F59E0B] hover:bg-amber-500 text-slate-900 font-extrabold text-sm rounded-2xl shadow-xl transition-all active:scale-95 cursor-pointer"
              >
                <Search className="w-4 h-4 text-slate-900" />
                <span>Check Student Result</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onContactClick}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-bold text-sm rounded-2xl border border-white/20 transition-all active:scale-95 cursor-pointer"
              >
                <Mail className="w-4 h-4 text-[#60A5FA]" />
                <span>Contact School Administration</span>
              </button>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
