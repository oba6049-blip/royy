import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Lock, Database, QrCode, FileText, Server, CheckCircle2, Sparkles } from 'lucide-react';

export const SecuritySection: React.FC = () => {
  const securityFeatures = [
    {
      icon: Lock,
      title: 'Encrypted SHA-256 Records',
      description: 'Every grade card is assigned a unique cryptographic signature at the moment of publishing.'
    },
    {
      icon: ShieldCheck,
      title: 'Official Seal & Signatures',
      description: 'Every printed slip features an official registrar stamp and verified principal signature.'
    },
    {
      icon: Database,
      title: 'Tamper-Proof Cloud Storage',
      description: 'Multi-layer role-based access ensures unapproved grade modifications are strictly prevented.'
    },
    {
      icon: FileText,
      title: 'Accurate Automated Grading',
      description: 'Eliminates human calculation errors by computing term totals, GPAs, and class positions automatically.'
    },
    {
      icon: Server,
      title: 'Reliable Cloud Backup',
      description: 'Continuous real-time database snapshots preserve academic records across all sessions and terms.'
    },
    {
      icon: ShieldCheck,
      title: 'Role-Based Audit Trail',
      description: 'Complete logging of administrator uploads, grade changes, and result lookup accesses.'
    }
  ];

  return (
    <section className="py-20 lg:py-28 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column Text */}
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Enterprise Grade Security</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#0F172A] tracking-tight font-['Plus_Jakarta_Sans']">
              Bank-Grade Security <br />
              <span className="bg-gradient-to-r from-[#1E3A8A] via-[#1e40af] to-[#22C55E] bg-clip-text text-transparent">
                For Academic Records
              </span>
            </h2>

            <p className="text-base sm:text-lg text-[#64748B] leading-relaxed">
              Academic integrity is paramount. Faith Academy Result Portal enforces rigorous cryptographic verification to eliminate result counterfeiting, unauthorized grade changes, and data loss.
            </p>

            <div className="space-y-3 pt-2 text-xs font-semibold text-slate-700">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
                <span>Cryptographic verification stamp on all printouts</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
                <span>Zero-trust access control for admin publishing</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
                <span>99.99% infrastructure uptime guaranteed</span>
              </div>
            </div>
          </div>

          {/* Right Column Feature Cards */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {securityFeatures.map((feat, idx) => {
              const IconComponent = feat.icon;
              return (
                <motion.div
                  key={feat.title}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: idx * 0.08 }}
                  className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 hover:border-[#1E3A8A]/30 hover:bg-white transition-all shadow-xs hover:shadow-md space-y-2 group"
                >
                  <div className="p-3 w-fit rounded-xl bg-white border border-slate-200 group-hover:bg-blue-50 transition-colors">
                    <IconComponent className="w-5 h-5 text-[#1E3A8A]" />
                  </div>

                  <h3 className="text-sm font-extrabold text-[#0F172A] font-['Plus_Jakarta_Sans']">
                    {feat.title}
                  </h3>

                  <p className="text-xs text-[#64748B] leading-relaxed">
                    {feat.description}
                  </p>
                </motion.div>
              );
            })}
          </div>

        </div>

      </div>
    </section>
  );
};
