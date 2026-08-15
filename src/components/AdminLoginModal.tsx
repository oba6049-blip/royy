import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ShieldCheck, X, CheckCircle2, ArrowRight, AlertCircle, KeyRound, Sparkles, UserCheck, ShieldAlert } from 'lucide-react';
import { api } from '../services/api';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (admin: { name: string; email: string; role: string; assignedClass?: string; assignedSubject?: string }) => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
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

  if (!isOpen) return null;

  const handleClose = () => {
    setStep('login');
    setErrorMessage(null);
    setSuccessMessage(null);
    setNewPassword('');
    setConfirmPassword('');
    onClose();
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
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
        // If user must change password on first login
        if (adminData.mustChangePassword || adminData.isFirstLogin) {
          setPendingAdmin(adminData);
          setStep('first_time_password');
          setErrorMessage(null);
          return;
        }

        // Direct login success
        onLoginSuccess(adminData);
        handleClose();
      } else {
        setErrorMessage('Access Denied: Invalid email or administrator password.');
      }
    } catch {
      setIsLoading(false);
      setErrorMessage('Access Denied: Invalid administrator credentials.');
    }
  };

  const handleFirstTimePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

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
      const result = await api.changePasswordFirstLogin(
        pendingAdmin?.email || email.trim().toLowerCase(),
        password,
        newPassword
      );
      setIsLoading(false);

      if (result.success && result.admin) {
        setSuccessMessage('Password successfully updated! Redirecting to dashboard...');
        setTimeout(() => {
          onLoginSuccess(result.admin);
          handleClose();
        }, 1200);
      } else {
        setErrorMessage(result.error || 'Failed to update password. Please check your credentials.');
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err.message || 'An error occurred while updating your password.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 text-slate-900 relative">
        
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* STEP 1: REGULAR LOGIN */}
        {step === 'login' && (
          <>
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-[#1E3A8A] text-white mx-auto flex items-center justify-center shadow-lg shadow-blue-900/20">
                <ShieldCheck className="w-8 h-8 text-[#F59E0B]" />
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-blue-50 text-[#1E3A8A] text-[10px] font-extrabold uppercase tracking-wider border border-blue-200">
                <KeyRound className="w-3.5 h-3.5 text-[#F59E0B]" />
                <span>Faith Academy Staff Portal</span>
              </div>

              <h3 className="text-2xl font-black text-[#0F172A] font-['Plus_Jakarta_Sans']">
                Staff & Admin Login
              </h3>
              <p className="text-xs text-slate-500">
                Sign in with your administrative or teacher email and password to access the portal.
              </p>
            </div>

            {/* Error Alert */}
            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700 font-medium">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Admin / Teacher Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. yourname@faithacademy.edu.ng"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
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
                <label className="flex items-center gap-2 cursor-pointer text-slate-600">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-300 text-[#1E3A8A] focus:ring-[#1E3A8A]"
                  />
                  <span>Keep me signed in</span>
                </label>
                <span className="text-[11px] text-slate-400">
                  First-time? Use temporary password
                </span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-[#1E3A8A] hover:bg-[#1e40af] text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Authenticating Credentials...</span>
                  </div>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-[#F59E0B]" />
                    <span>Authenticate & Access Dashboard</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </button>
            </form>

            <div className="pt-2 border-t border-slate-100 text-center">
              <p className="text-[10px] text-slate-400 flex items-center justify-center gap-1 font-mono">
                <Lock className="w-3 h-3 text-emerald-500" />
                256-Bit Cryptographic SSL Secured Admin Gateway
              </p>
            </div>
          </>
        )}

        {/* STEP 2: FIRST-TIME LOGIN PASSWORD SETUP PROMPT */}
        {step === 'first_time_password' && (
          <>
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-amber-500 text-white mx-auto flex items-center justify-center shadow-lg shadow-amber-500/20 animate-bounce-subtle">
                <KeyRound className="w-7 h-7 text-white" />
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-50 text-amber-900 text-[10px] font-extrabold uppercase tracking-wider border border-amber-200">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                <span>Security Requirement • First Login</span>
              </div>

              <h3 className="text-2xl font-black text-[#0F172A] font-['Plus_Jakarta_Sans']">
                Create Your New Password
              </h3>
              
              <div className="bg-blue-50/80 border border-blue-100 rounded-2xl p-3 text-left flex items-start gap-2.5">
                <UserCheck className="w-4 h-4 text-[#1E3A8A] shrink-0 mt-0.5" />
                <div className="text-[11px] text-[#1E3A8A]">
                  <span className="font-bold">Welcome, {pendingAdmin?.name || 'Staff Member'}!</span>
                  <p className="text-slate-600 mt-0.5">
                    Your administrator created this account with a temporary password. For security, please set your private permanent password now.
                  </p>
                </div>
              </div>
            </div>

            {/* Error Alert */}
            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700 font-medium">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Success Alert */}
            {successMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Password Change Form */}
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
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
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
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
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

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="flex items-center gap-1.5 text-[11px]">
                  <div className={`w-2 h-2 rounded-full ${newPassword.length >= 6 ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  <span className={newPassword.length >= 6 ? 'text-emerald-700 font-semibold' : 'text-slate-500'}>
                    Minimum 6 characters ({newPassword.length}/6)
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px]">
                  <div className={`w-2 h-2 rounded-full ${newPassword && confirmPassword && newPassword === confirmPassword ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  <span className={newPassword && confirmPassword && newPassword === confirmPassword ? 'text-emerald-700 font-semibold' : 'text-slate-500'}>
                    Passwords match
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep('login')}
                  className="w-1/3 py-3 border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || newPassword.length < 6 || newPassword !== confirmPassword}
                  className="w-2/3 py-3 bg-[#1E3A8A] hover:bg-[#1e40af] text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Saving Password...</span>
                    </div>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-[#F59E0B]" />
                      <span>Set Password & Enter</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </>
        )}

      </div>
    </div>
  );
};

