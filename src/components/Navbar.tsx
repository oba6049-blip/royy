import React, { useState, useEffect } from 'react';
import { SchoolLogo } from './SchoolLogo';
import { Search, Shield, Menu, X, ArrowRight, UserCheck, Sparkles } from 'lucide-react';

interface NavbarProps {
  onCheckResultClick: () => void;
  onStudentPortalClick: () => void;
  onAdminPortalClick: () => void;
  activeSection?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  onCheckResultClick,
  onStudentPortalClick,
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
    { name: 'Student Login', href: '#student-login' },
    { name: 'Admin Portal', href: '#admin-portal' },
    { name: 'How It Works', href: '#how-it-works' },
    { name: 'FAQ', href: '#faq' },
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
                onClick={(e) => {
                  if (link.name === 'Admin Portal') {
                    e.preventDefault();
                    onAdminPortalClick();
                  } else if (link.name === 'Student Login') {
                    e.preventDefault();
                    onStudentPortalClick();
                  }
                }}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-[#1E3A8A] hover:bg-white rounded-full transition-all duration-200"
              >
                {link.name}
              </a>
            ))}
          </nav>

          {/* Action Buttons */}
          <div className="hidden sm:flex items-center gap-2.5">
            {/* Student Login Portal */}
            <button
              onClick={onStudentPortalClick}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all border border-slate-700 cursor-pointer active:scale-95"
            >
              <UserCheck className="w-3.5 h-3.5 text-[#F59E0B]" />
              <span>Student Login</span>
            </button>

            {/* Admin Portal */}
            <button
              onClick={onAdminPortalClick}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all border border-slate-200/80 cursor-pointer active:scale-95"
            >
              <Shield className="w-3.5 h-3.5 text-[#1E3A8A]" />
              <span>Admin</span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 lg:hidden">
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
                onClick={(e) => {
                  setMobileMenuOpen(false);
                  if (link.name === 'Admin Portal') {
                    e.preventDefault();
                    onAdminPortalClick();
                  } else if (link.name === 'Student Login') {
                    e.preventDefault();
                    onStudentPortalClick();
                  }
                }}
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
                onStudentPortalClick();
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-slate-900 rounded-xl shadow-sm"
            >
              <UserCheck className="w-4 h-4 text-[#F59E0B]" />
              Student Portal Sign In
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
