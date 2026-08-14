import React from 'react';
import { motion } from 'motion/react';
import {
  UploadCloud,
  CheckCircle2,
  Bell,
  Search,
  FileCheck2,
  Sparkles,
  ArrowRight
} from 'lucide-react';

const WORKFLOW_STEPS = [
  {
    step: '01',
    title: 'Administrator Uploads Results',
    description: 'Teachers and exam officers upload verified grade spreadsheets into the encrypted admin portal.',
    iconName: 'UploadCloud'
  },
  {
    step: '02',
    title: 'Automated Cryptographic Hash',
    description: 'System automatically verifies grade weightings, computes GPAs, and generates unique QR security hashes.',
    iconName: 'CheckCircle2'
  },
  {
    step: '03',
    title: 'Portal Release Notification',
    description: 'Official results are published instantly. Parents and students receive notification alerts.',
    iconName: 'Bell'
  },
  {
    step: '04',
    title: 'Enter Student ID & Term',
    description: 'Users enter their official registration number and select session/term parameters.',
    iconName: 'Search'
  },
  {
    step: '05',
    title: 'View & Print Authentic Slip',
    description: 'Instantly view, download, or print official academic result slips with digital seals.',
    iconName: 'FileCheck2'
  }
];

export const WorkflowSection: React.FC = () => {
  const iconMap: Record<string, React.ReactNode> = {
    UploadCloud: <UploadCloud className="w-6 h-6 text-[#1E3A8A]" />,
    CheckCircle2: <CheckCircle2 className="w-6 h-6 text-[#22C55E]" />,
    Bell: <Bell className="w-6 h-6 text-[#F59E0B]" />,
    Search: <Search className="w-6 h-6 text-[#60A5FA]" />,
    FileCheck2: <FileCheck2 className="w-6 h-6 text-purple-600" />
  };

  return (
    <section id="how-it-works" className="py-20 lg:py-28 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#1E3A8A] text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span>End-To-End Workflow</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#0F172A] tracking-tight font-['Plus_Jakarta_Sans']">
            How The Portal Works <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-[#1E3A8A] via-[#1e40af] to-[#60A5FA] bg-clip-text text-transparent">
              In 5 Simple Steps
            </span>
          </h2>

          <p className="text-base sm:text-lg text-[#64748B]">
            From grade submission by examination officers to instant report generation on student smartphones.
          </p>
        </div>

        {/* Workflow Timeline Steps */}
        <div className="relative">
          {/* Connector Line (Desktop) */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-[#1E3A8A] via-[#60A5FA] to-[#22C55E] -translate-y-1/2 z-0 opacity-20" />

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 relative z-10">
            {WORKFLOW_STEPS.map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -6 }}
                className="bg-slate-50/80 rounded-3xl p-6 border border-slate-200/80 hover:border-[#1E3A8A]/30 hover:bg-white transition-all shadow-sm hover:shadow-xl flex flex-col justify-between group"
              >
                <div>
                  {/* Step Badge & Icon */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-black font-mono text-[#1E3A8A]/30 group-hover:text-[#1E3A8A] transition-colors">
                      {item.step}
                    </span>

                    <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-xs group-hover:bg-blue-50 transition-colors">
                      {iconMap[item.iconName]}
                    </div>
                  </div>

                  <h3 className="text-base font-extrabold text-[#0F172A] font-['Plus_Jakarta_Sans'] mb-2">
                    {item.title}
                  </h3>

                  <p className="text-xs text-[#64748B] leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="mt-6 pt-3 border-t border-slate-200/60 flex items-center gap-1.5 text-[11px] font-bold text-[#1E3A8A]">
                  <span>Step {index + 1} Process</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#F59E0B]" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};
