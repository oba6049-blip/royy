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
  Building2,
  ShieldAlert
} from 'lucide-react';

interface AdminLoginPageProps {
  onBackToHome: () => void;
  onLoginSuccess: (admin: { name: string; email: string; role: string; assignedClass?: string; assignedSubject?: string }) => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({
  onBackToHome,
  onLoginSuccess,
}) => {
  const [step, setStep] = useState<'login' | 'first_time_password'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // First-time password setup state
  const [pendingAdmin, setPendingAdmin] = useState<any>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

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
        // Check if user has first-time login flag or must change password
        if (adminData.mustChangePassword === true || adminData.isFirstLogin === true) {
          setPendingAdmin(adminData);
          setStep('first_time_password');
          setErrorMessage(null);
          return;
        }

        onLoginSuccess(adminData);
      } else {
        setErrorMessage('Access Denied: Invalid email or administrator password.');
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err.message || 'Access Denied: Invalid administrator credentials.');
    }
  };

  const handleFirstTimePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (newPassword.length < 6) {
      setErrorMessage('Your new password must be at least 6 characters long.');
      return;
    }

    if (newPassword === password) {
      setErrorMessage('Your new password must be different from the temporary password provided.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('New passwords do not match. Please re-enter.');
      return;
    }

    setIsLoading(true);

    try {
      const targetEmail = pendingAdmin?.email || email.trim().toLowerCase();
      const result = await api.changePasswordFirstLogin(targetEmail, password, newPassword);
      setIsLoading(false);

      if (result.success && result.admin) {
        setSuccessMessage('Password successfully updated! Redirecting to your dashboard...');
        setTimeout(() => {
          onLoginSuccess(result.admin);
        }, 1200);
      } else {
        setErrorMessage(result.error || 'Failed to update password. Please verify credentials.');
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err.message || 'An unexpected error occurred while updating your password.');
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
            <span>Faith Academy Portal Services</span>
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

          {/* STEP 1: REGULAR LOGIN FORM */}
          {step === 'login' && (
            <>
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
                      placeholder="e.g. grace.adeleke@royalacademy.edu.ng"
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
                    onClick={() => setErrorMessage('Please contact Faith Academy IT Help Desk at support@royalacademy.edu.ng to reset password.')}
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
                  Official Faith Academy Security Protocol • IP Logged
                </p>
              </div>
            </>
          )}

          {/* STEP 2: FIRST-TIME LOGIN PASSWORD CHANGE REQUIRED */}
          {step === 'first_time_password' && (
            <>
              {/* Header */}
              <div className="text-center space-y-3 pt-2">
                <div className="w-14 h-14 rounded-2xl bg-amber-500 text-white mx-auto flex items-center justify-center shadow-lg shadow-amber-500/20">
                  <KeyRound className="w-7 h-7 text-white" />
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-900 text-[11px] font-extrabold uppercase tracking-wider border border-amber-200">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                  <span>Mandatory Security Step • First Login</span>
                </div>

                <h2 className="text-2xl font-black text-slate-900 font-['Plus_Jakarta_Sans']">
                  Create Your Private Password
                </h2>

                <div className="bg-blue-50/90 border border-blue-200/80 rounded-2xl p-3.5 text-left flex items-start gap-3">
                  <UserCheck className="w-5 h-5 text-[#1E3A8A] shrink-0 mt-0.5" />
                  <div className="text-xs text-[#1E3A8A] space-y-0.5">
                    <span className="font-bold">Welcome, {pendingAdmin?.name || 'Staff Member'}!</span>
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      Your staff account was initialized with a temporary password. For data confidentiality and transcript security, please choose your personal permanent password before accessing the system.
                    </p>
                  </div>
                </div>
              </div>

              {/* Error Message Alert */}
              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl flex items-center gap-2 text-xs font-medium">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Success Message Alert */}
              {successMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl flex items-center gap-2 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* First Time Password Form */}
              <form onSubmit={handleFirstTimePasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                    New Permanent Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter at least 6 characters"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-xs font-mono font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#1E3A8A] focus:ring-2 focus:ring-[#1E3A8A]/10 shadow-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Must be at least 6 characters & different from temporary password.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter your new password"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-xs font-mono font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#1E3A8A] focus:ring-2 focus:ring-[#1E3A8A]/10 shadow-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('login');
                      setErrorMessage(null);
                      setNewPassword('');
                      setConfirmPassword('');
                    }}
                    className="w-1/3 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-900/15 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Updating Password...</span>
                      </div>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                        <span>Save & Access Dashboard</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              <div className="pt-2 border-t border-slate-200 text-center">
                <p className="text-[10px] text-slate-400 font-mono">
                  Once saved, use your new private password for all future logins.
                </p>
              </div>
            </>
          )}

        </div>
      </main>

      {/* Page Bottom Footer */}
      <footer className="w-full px-6 py-4 border-t border-slate-200 bg-white/50 text-center text-xs text-slate-500 z-20">
        <p>© 2025 Faith Academy Examination & Results System. All rights reserved.</p>
      </footer>
    </div>
  );
};
