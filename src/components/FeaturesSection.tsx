import React from 'react';
import { motion } from 'motion/react';
import {
  Zap,
  UserCheck,
  ShieldCheck,
  Printer,
  Cpu,
  LayoutDashboard,
  Smartphone,
  History,
  Sparkles
} from 'lucide-react';

const FEATURES_DATA = [
  {
    id: '1',
    iconName: 'Zap',
    title: 'Instant Result Checking',
    description: 'Access complete academic scorecards in seconds from any smartphone, tablet, or desktop.',
    badge: 'Real-Time',
    highlight: true
  },
  {
    id: '2',
    iconName: 'UserCheck',
    title: 'No Student Login Required',
    description: 'Zero complex passwords or forgotten credentials. Simple Reg ID validation gets you in instantly.',
    badge: 'Seamless'
  },
  {
    id: '3',
    iconName: 'ShieldCheck',
    title: 'Official Stamp & Verification',
    description: 'Every printed report card features official school stamp, registrar signatures, and verification seal.',
    badge: 'Verified',
    highlight: true
  },
  {
    id: '4',
    iconName: 'Printer',
    title: 'Professional Printable Format',
    description: 'Generate high-resolution, official Royal Academy report slips complete with signatures and school stamp.',
    badge: 'Official'
  },
  {
    id: '5',
    iconName: 'Cpu',
    title: 'Fast Automated Processing',
    description: 'Enterprise grade infrastructure capable of serving thousands of simultaneous requests during release days.',
    badge: 'Scalable'
  },
  {
    id: '6',
    iconName: 'LayoutDashboard',
    title: 'Admin Result Management',
    description: 'Comprehensive portal for school administrators to upload bulk CSV results, edit grades, and publish instantly.',
    badge: 'Enterprise'
  },
  {
    id: '7',
    iconName: 'Smartphone',
    title: 'Responsive & Accessible',
    description: 'Engineered desktop-down and mobile-up for flawless performance on all modern screens.',
    badge: 'Mobile First'
  },
  {
    id: '8',
    iconName: 'History',
    title: 'Academic History Archive',
    description: 'Seamlessly query past academic sessions, terms, and historical performance trends over time.',
    badge: 'Archive'
  }
];

export const FeaturesSection: React.FC = () => {
  const iconMap: Record<string, React.ReactNode> = {
    Zap: <Zap className="w-6 h-6 text-[#F59E0B]" />,
    UserCheck: <UserCheck className="w-6 h-6 text-[#60A5FA]" />,
    ShieldCheck: <ShieldCheck className="w-6 h-6 text-[#22C55E]" />,
    Printer: <Printer className="w-6 h-6 text-[#1E3A8A]" />,
    Cpu: <Cpu className="w-6 h-6 text-purple-600" />,
    LayoutDashboard: <LayoutDashboard className="w-6 h-6 text-indigo-600" />,
    Smartphone: <Smartphone className="w-6 h-6 text-sky-500" />,
    History: <History className="w-6 h-6 text-amber-600" />
  };

  return (
    <section id="features" className="py-20 lg:py-28 bg-slate-50/50 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#1E3A8A] text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span>Platform Capabilities</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#0F172A] tracking-tight font-['Plus_Jakarta_Sans']">
            Why Choose Royal Academy <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-[#1E3A8A] via-[#1e40af] to-[#60A5FA] bg-clip-text text-transparent">
              Result Portal?
            </span>
          </h2>

          <p className="text-base sm:text-lg text-[#64748B] leading-relaxed">
            Engineered with enterprise-grade architecture to deliver instant, secure, and effortless examination result verification for students, parents, and faculty.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES_DATA.map((feature, index) => (
            <motion.div
              key={feature.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
              whileHover={{ y: -6 }}
              className={`relative bg-white rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border ${
                feature.highlight
                  ? 'border-[#1E3A8A]/30 ring-1 ring-[#1E3A8A]/10'
                  : 'border-slate-200/80 hover:border-slate-300'
              } flex flex-col justify-between group overflow-hidden`}
            >
              {/* Subtle top ambient glow */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-tr-3xl" />

              <div>
                {/* Header row with Icon & Badge */}
                <div className="flex items-center justify-between mb-5">
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 group-hover:bg-[#1E3A8A]/10 group-hover:border-[#1E3A8A]/20 transition-colors">
                    {iconMap[feature.iconName]}
                  </div>

                  {feature.badge && (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 uppercase tracking-wider">
                      {feature.badge}
                    </span>
                  )}
                </div>

                {/* Title & Description */}
                <h3 className="text-lg font-extrabold text-[#0F172A] mb-2 font-['Plus_Jakarta_Sans'] group-hover:text-[#1E3A8A] transition-colors">
                  {feature.title}
                </h3>

                <p className="text-xs text-[#64748B] leading-relaxed">
                  {feature.description}
                </p>
              </div>

              {/* Bottom decorative border line */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-[#1E3A8A] opacity-0 group-hover:opacity-100 transition-opacity">
                <span>Explore Feature</span>
                <span>→</span>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};
