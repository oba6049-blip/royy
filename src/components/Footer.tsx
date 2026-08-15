import React from 'react';
import { SchoolLogo } from './SchoolLogo';
import {
  Mail,
  Phone,
  MapPin,
  Shield,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';

interface FooterProps {
  onCheckResultClick: () => void;
  onAdminPortalClick: () => void;
  onContactClick: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onCheckResultClick,
  onAdminPortalClick,
  onContactClick,
}) => {
  return (
    <footer className="bg-[#0F172A] text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800">
          
          {/* Brand & Mission */}
          <div className="lg:col-span-2 space-y-4">
            <SchoolLogo size="lg" lightMode={false} />

            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              Faith Academy Student Result Portal is a high-security examination management system providing instant, verified result slips for students, parents, and academic authorities.
            </p>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>All Portal Systems Operational (99.99% Uptime)</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Portal Navigation</h4>
            <ul className="space-y-2 text-xs font-medium text-slate-400">
              <li>
                <a href="#home" className="hover:text-white transition-colors">Home Portal</a>
              </li>
              <li>
                <button onClick={onCheckResultClick} className="hover:text-white transition-colors text-left cursor-pointer">
                  Check Student Result
                </button>
              </li>
              <li>
                <button onClick={onAdminPortalClick} className="hover:text-white transition-colors text-left cursor-pointer">
                  Admin Control Portal
                </button>
              </li>
              <li>
                <a href="#features" className="hover:text-white transition-colors">Portal Features</a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
              </li>
              <li>
                <a href="#faq" className="hover:text-white transition-colors">FAQs</a>
              </li>
            </ul>
          </div>

          {/* Support & Legal */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Support & Legal</h4>
            <ul className="space-y-2 text-xs font-medium text-slate-400">
              <li>
                <button onClick={onContactClick} className="hover:text-white transition-colors text-left cursor-pointer">
                  Student Support Desk
                </button>
              </li>
              <li>
                <a href="#faq" className="hover:text-white transition-colors">Result Verification FAQ</a>
              </li>
              <li>
                <span className="text-slate-500 cursor-not-allowed">Privacy Policy</span>
              </li>
              <li>
                <span className="text-slate-500 cursor-not-allowed">Terms of Academic Service</span>
              </li>
              <li>
                <span className="text-slate-500 cursor-not-allowed">Security Compliance</span>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Faith Academy Contact</h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#F59E0B] shrink-0 mt-0.5" />
                <span>Faith Academy Campus, Victoria Island, Lagos State</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#60A5FA] shrink-0" />
                <span>+234 800 769 2522</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>results@royalacademy.edu.ng</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Copyright Row */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Faith Academy. All Rights Reserved. Powered by Faith Academy IT Directorate.</p>
        </div>

      </div>
    </footer>
  );
};
