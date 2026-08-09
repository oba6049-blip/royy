import React, { useState, useEffect } from 'react';
import { SchoolLogo } from './SchoolLogo';
import { Search, Shield, Menu, X, ArrowRight, UserCheck, Sparkles } from 'lucide-react';

interface NavbarProps {
  onCheckResultClick: () => void;
  onAdminPortalClick: () => void;
  activeSection?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  onCheckResultClick,
  onAdminPortalClick,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', href: '#home' },
    { name: 'Features', href: '#features' },
    { name: 'Result Search', href: '#result-search' },
    { name: 'Admin Portal', href: '#admin-portal' },
    { name: 'How It Works', href: '#how-it-works' },
    { name: 'FAQ', href: '#faq' },
    { name: 'Contact', href: '#contact' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'glass-nav shadow-sm py-3'
          : 'bg-white/80 backdrop-blur-md py-4 border-b border-slate-100'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <a href="#home" className="focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] rounded-lg p-1">
            <SchoolLogo size="md" />
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2 bg-slate-50/80 px-4 py-1.5 rounded-full border border-slate-200/80 shadow-inner">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-[#1E3A8A] hover:bg-white rounded-full transition-all duration-200"
              >
                {link.name}
              </a>
            ))}
          </nav>

          {/* Action Buttons */}
          <div className="hidden sm:flex items-center gap-3">
            {/* Secondary CTA: Admin Portal */}
            <button
              onClick={onAdminPortalClick}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all border border-slate-200/80 active:scale-95"
            >
              <Shield className="w-3.5 h-3.5 text-[#1E3A8A]" />
              <span>Admin Portal</span>
            </button>

            {/* Primary CTA: Check Result */}
            <button
              onClick={onCheckResultClick}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-[#1E3A8A] hover:bg-[#1e40af] rounded-xl shadow-md royal-glow hover:shadow-lg transition-all active:scale-95 border border-[#60A5FA]/30"
            >
              <Search className="w-3.5 h-3.5 text-[#F59E0B]" />
              <span>Check Result</span>
              <ArrowRight className="w-3.5 h-3.5 opacity-80" />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={onCheckResultClick}
              className="sm:hidden px-3 py-1.5 text-xs font-bold text-white bg-[#1E3A8A] rounded-lg shadow-sm"
            >
              Result
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 pt-3 pb-6 space-y-3 shadow-xl">
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-2.5 text-sm font-semibold text-slate-700 hover:text-[#1E3A8A] hover:bg-slate-50 rounded-lg transition-colors"
              >
                {link.name}
              </a>
            ))}
          </div>
          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onCheckResultClick();
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-[#1E3A8A] rounded-xl shadow-sm"
            >
              <Search className="w-4 h-4 text-[#F59E0B]" />
              Check Student Result
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onAdminPortalClick();
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 rounded-xl"
            >
              <Shield className="w-4 h-4 text-[#1E3A8A]" />
              Admin Portal Login
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
