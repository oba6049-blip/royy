import React from 'react';
import { motion } from 'motion/react';
import { STATS_DATA } from '../data/mockData';
import { Zap, Users, ShieldCheck, Clock } from 'lucide-react';

export const FloatingStats: React.FC = () => {
  const statIcons = [
    <Zap key="1" className="w-5 h-5 text-[#F59E0B]" />,
    <Users key="2" className="w-5 h-5 text-[#60A5FA]" />,
    <ShieldCheck key="3" className="w-5 h-5 text-[#22C55E]" />,
    <Clock key="4" className="w-5 h-5 text-[#1E3A8A]" />
  ];

  return (
    <section className="relative z-10 -mt-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS_DATA.map((stat, idx) => (
          <motion.div
            key={stat.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: idx * 0.1 }}
            whileHover={{ y: -4 }}
            className="glass-panel p-5 rounded-2xl shadow-lg border border-slate-200/80 hover:border-[#1E3A8A]/30 transition-all duration-300 flex items-start gap-4 group"
          >
            <div className="p-3 rounded-2xl bg-slate-100 group-hover:bg-[#1E3A8A]/10 transition-colors shrink-0">
              {statIcons[idx]}
            </div>

            <div>
              <div className="text-2xl sm:text-3xl font-black text-[#0F172A] font-['Plus_Jakarta_Sans'] tracking-tight group-hover:text-[#1E3A8A] transition-colors">
                {stat.value}
              </div>
              <div className="text-xs font-bold text-slate-800 mt-0.5">
                {stat.label}
              </div>
              <div className="text-[11px] text-slate-500 mt-1 leading-snug">
                {stat.description}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};
