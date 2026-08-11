import React, { useState } from 'react';
import { SchoolLogo } from './SchoolLogo';
import { api } from '../services/api';
import {
  ShieldCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  UserCheck,
  Building2
} from 'lucide-react';

interface AdminLoginPageProps {
  onBackToHome: () => void;
  onLoginSuccess: (admin: { name: string; email: string; role: string }) => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({
  onBackToHome,
  onLoginSuccess,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Please enter a valid administrator email address.');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);

    try {
      const adminData = await api.loginAdmin(cleanEmail, password);
      setIsLoading(false);

      if (adminData) {
        onLoginSuccess(adminData);
      } else {
        setErrorMessage('Access Denied: Invalid email or administrator password.');
      }
    } catch {
      setIsLoading(false);
      setErrorMessage('Access Denied: Invalid administrator credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-['Plus_Jakarta_Sans',sans-serif] flex flex-col justify-between relative overflow-hidden selection:bg-blue-100 selection:text-[#1E3A8A]">
      {/* Background Decorative Ambient Lighting */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-amber-100/30 rounded-full blur-[160px] pointer-events-none" />

      {/* Top Header Bar */}
      <header className="w-full px-6 py-4 border-b border-slate-200 bg-white/80 backdrop-blur-md flex items-center justify-between z-20 shadow-xs">
        <div className="flex items-center gap-4">
          <button
            onClick={onBackToHome}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-[#F59E0B]" />
            <span>Back to Main Website</span>
          </button>
          
          <div className="hidden sm:block h-5 w-px bg-slate-200" />
          
          <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-600">
            <Building2 className="w-4 h-4 text-[#1E3A8A]" />
            <span>Royal Academy Portal Services</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            256-Bit SSL Gateway
          </span>
        </div>
      </header>

      {/* Main Login Card Page Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 z-10 my-8">
        <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xl shadow-slate-200/60 space-y-6 relative overflow-hidden">
          
          {/* Top Accent Line */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#1E3A8A] via-blue-600 to-[#F59E0B]" />

          {/* Brand & Badge Header */}
          <div className="text-center space-y-3 pt-2">
            <div className="inline-block mx-auto">
              <SchoolLogo size="lg" lightMode={true} />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-[#1E3A8A] text-[11px] font-extrabold uppercase tracking-wider border border-blue-100">
              <ShieldCheck className="w-3.5 h-3.5 text-[#F59E0B]" />
              <span>Administrative Access Gateway</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 font-['Plus_Jakarta_Sans']">
              Sign In to Admin Portal
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-xs mx-auto">
              Enter your authorized staff email and credentials to access student transcripts & examination records.
            </p>
          </div>

          {/* Error Message Alert */}
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl flex items-center gap-2 text-xs font-medium">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Staff Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="fariat@gmail.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#1E3A8A] focus:ring-2 focus:ring-[#1E3A8A]/10 shadow-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Account Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-xs font-mono font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#1E3A8A] focus:ring-2 focus:ring-[#1E3A8A]/10 shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs font-medium">
              <label className="flex items-center gap-2 cursor-pointer text-slate-600 hover:text-slate-800">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 text-[#1E3A8A] focus:ring-[#1E3A8A]"
                />
                <span>Remember session</span>
              </label>
              <button
                type="button"
                onClick={() => setErrorMessage('Please contact Royal Academy IT Help Desk at support@royalacademy.edu.ng to reset password.')}
                className="text-[#1E3A8A] hover:underline font-bold"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-[#1E3A8A] hover:bg-blue-900 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-900/15 border border-blue-900/20 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Authenticating Staff Credentials...</span>
                </div>
              ) : (
                <>
                  <UserCheck className="w-4 h-4 text-[#F59E0B]" />
                  <span>Authenticate & Open Admin Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer note inside card */}
          <div className="pt-2 border-t border-slate-200 text-center">
            <p className="text-[10px] text-slate-500 font-mono flex items-center justify-center gap-1.5">
              <Lock className="w-3 h-3 text-emerald-600" />
              Official Royal Academy Security Protocol • IP Logged
            </p>
          </div>

        </div>
      </main>

      {/* Page Bottom Footer */}
      <footer className="w-full px-6 py-4 border-t border-slate-200 bg-white/50 text-center text-xs text-slate-500 z-20">
        <p>© 2025 Royal Academy Examination & Results System. All rights reserved.</p>
      </footer>
    </div>
  );
};
