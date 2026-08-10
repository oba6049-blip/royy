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
      } else if (cleanEmail === 'fariat@gmail.com' && password === 'fariat123') {
        onLoginSuccess({ name: 'Fariat Admin', email: 'fariat@gmail.com', role: 'System Super Administrator' });
      } else {
        setErrorMessage('Access Denied: Invalid email or password. Only authorized admin (fariat@gmail.com) can log in.');
      }
    } catch {
      setIsLoading(false);
      if (cleanEmail === 'fariat@gmail.com' && password === 'fariat123') {
        onLoginSuccess({ name: 'Fariat Admin', email: 'fariat@gmail.com', role: 'System Super Administrator' });
      } else {
        setErrorMessage('Access Denied: Invalid admin credentials.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-['Inter',sans-serif] flex flex-col justify-between relative overflow-hidden selection:bg-[#60A5FA]/30 selection:text-white">
      {/* Background Decorative Ambient Lighting */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#1E3A8A]/30 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#F59E0B]/10 rounded-full blur-[160px] pointer-events-none" />

      {/* Top Header Bar */}
      <header className="w-full px-6 py-5 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md flex items-center justify-between z-20">
        <div className="flex items-center gap-4">
          <button
            onClick={onBackToHome}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-[#F59E0B]" />
            <span>Back to Main Website</span>
          </button>
          
          <div className="hidden sm:block h-5 w-px bg-slate-800" />
          
          <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-400">
            <Building2 className="w-4 h-4 text-blue-400" />
            <span>Royal Academy Portal Services</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 text-emerald-400 text-[11px] font-bold border border-emerald-800/60 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            256-Bit SSL Gateway
          </span>
        </div>
      </header>

      {/* Main Login Card Page Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 z-10 my-8">
        <div className="max-w-md w-full bg-slate-900/90 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl shadow-blue-950/40 space-y-6 relative">
          
          {/* Brand & Badge Header */}
          <div className="text-center space-y-3">
            <div className="inline-block mx-auto">
              <SchoolLogo size="lg" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1E3A8A]/40 text-[#60A5FA] text-[11px] font-extrabold uppercase tracking-wider border border-[#1E3A8A]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#F59E0B]" />
              <span>Administrative Access Gateway</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white font-['Plus_Jakarta_Sans']">
              Sign In to Admin Portal
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xs mx-auto">
              Enter your authorized staff email and credentials to access student transcripts & examination records.
            </p>
          </div>

          {/* Error Message Alert */}
          {errorMessage && (
            <div className="p-3 bg-red-950/80 border border-red-800 text-red-300 rounded-xl flex items-center gap-2 text-xs font-medium">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                Staff Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="fariat@gmail.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs font-semibold text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                Account Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-xs font-mono font-bold text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white p-1 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs font-medium">
              <label className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-slate-300">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-[#1E3A8A] focus:ring-blue-500"
                />
                <span>Remember session</span>
              </label>
              <button
                type="button"
                onClick={() => setErrorMessage('Please contact Royal Academy IT Help Desk at support@royalacademy.edu.ng to reset password.')}
                className="text-[#60A5FA] hover:underline font-bold"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-[#1E3A8A] hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-900/30 border border-blue-400/30 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
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
          <div className="pt-2 border-t border-slate-800/80 text-center">
            <p className="text-[10px] text-slate-500 font-mono flex items-center justify-center gap-1.5">
              <Lock className="w-3 h-3 text-emerald-400" />
              Official Royal Academy Security Protocol • IP Logged
            </p>
          </div>

        </div>
      </main>

      {/* Page Bottom Footer */}
      <footer className="w-full px-6 py-4 border-t border-slate-800/80 bg-slate-950/70 text-center text-xs text-slate-500 z-20">
        <p>© 2025 Royal Academy Examination & Results System. All rights reserved.</p>
      </footer>
    </div>
  );
};
