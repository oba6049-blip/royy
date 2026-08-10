import React, { useState } from 'react';
import { SchoolLogo } from './SchoolLogo';
import { api } from '../services/api';
import { MOCK_STUDENTS } from '../data/mockData';
import { StudentResult } from '../types';
import {
  GraduationCap,
  Search,
  User,
  Hash,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Award,
  BookOpen,
  Lock,
  HelpCircle
} from 'lucide-react';

interface StudentLoginPageProps {
  onBackToHome: () => void;
  onLoginSuccess: (student: StudentResult) => void;
  onOpenAdminPortal?: () => void;
}

export const StudentLoginPage: React.FC<StudentLoginPageProps> = ({
  onBackToHome,
  onLoginSuccess,
  onOpenAdminPortal,
}) => {
  const [surname, setSurname] = useState('');
  const [regId, setRegId] = useState('');
  const [session, setSession] = useState('2025/2026 Academic Session');
  const [term, setTerm] = useState('First Term');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Helper for quick demo filling
  const handleFillDemo = (demoSurname: string, demoId: string) => {
    setSurname(demoSurname);
    setRegId(demoId);
    setErrorMessage(null);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanSurname = surname.trim().toLowerCase();
    const cleanRegId = regId.trim();

    if (!cleanSurname) {
      setErrorMessage('Please enter student surname (last name).');
      return;
    }

    if (!cleanRegId || !/^\d{7}$/.test(cleanRegId)) {
      setErrorMessage('Please enter a valid 7-digit Registration ID (e.g. 2025104).');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Try fetching real student from backend API
      const apiStudent = await api.getStudentById(cleanRegId);
      
      let candidateStudent: StudentResult | null = apiStudent;

      // 2. Fallback to local MOCK_STUDENTS if API did not return or server is offline
      if (!candidateStudent && MOCK_STUDENTS[cleanRegId]) {
        candidateStudent = MOCK_STUDENTS[cleanRegId];
      }

      setIsLoading(false);

      if (candidateStudent) {
        // Validate surname matches student's full name (case-insensitive substring or last name match)
        const nameParts = candidateStudent.fullName.toLowerCase().split(/\s+/);
        const nameContainsSurname = candidateStudent.fullName.toLowerCase().includes(cleanSurname);

        if (nameContainsSurname) {
          onLoginSuccess(candidateStudent);
          return;
        } else {
          setErrorMessage(
            `Surname mismatch: The surname "${surname}" does not match the record for Registration ID "${cleanRegId}". Please verify your surname.`
          );
          return;
        }
      } else {
        setErrorMessage(
          `No student record found for 7-digit Registration ID "${cleanRegId}". Please verify your details or use one of the quick test badges below.`
        );
      }
    } catch {
      setIsLoading(false);
      // Fallback local check
      if (MOCK_STUDENTS[cleanRegId]) {
        const student = MOCK_STUDENTS[cleanRegId];
        if (student.fullName.toLowerCase().includes(cleanSurname)) {
          onLoginSuccess(student);
          return;
        }
      }
      setErrorMessage(`Unable to authenticate student ID "${cleanRegId}". Please verify your Registration ID and Surname.`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-['Inter',sans-serif] flex flex-col justify-between relative overflow-hidden selection:bg-[#60A5FA]/30 selection:text-white">
      
      {/* Background Decorative Ambient Glows */}
      <div className="absolute top-0 left-1/3 w-[600px] h-[600px] bg-[#1E3A8A]/25 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/3 w-[500px] h-[500px] bg-[#F59E0B]/10 rounded-full blur-[160px] pointer-events-none" />

      {/* Top Header Bar */}
      <header className="w-full px-6 py-5 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md flex items-center justify-between z-20">
        <div className="flex items-center gap-4">
          <button
            onClick={onBackToHome}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition-all cursor-pointer shadow-sm active:scale-95"
          >
            <ArrowLeft className="w-4 h-4 text-[#F59E0B]" />
            <span>Back to Main Website</span>
          </button>

          <div className="hidden sm:block h-5 w-px bg-slate-800" />

          <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-400">
            <GraduationCap className="w-4 h-4 text-blue-400" />
            <span>Student Academic Result Portal</span>
          </div>
        </div>

        {onOpenAdminPortal && (
          <button
            onClick={onOpenAdminPortal}
            className="text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer hidden sm:block"
          >
            Switch to Admin Portal Login &rarr;
          </button>
        )}
      </header>

      {/* Main Login Body */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 z-10 my-6">
        <div className="w-full max-w-md">
          
          {/* Card Container */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
            
            {/* Top Accent Line */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#1E3A8A] via-blue-500 to-[#F59E0B]" />

            {/* School Logo & Title */}
            <div className="text-center space-y-3 mb-8">
              <div className="inline-flex p-3 rounded-2xl bg-slate-950 border border-slate-800 shadow-inner">
                <SchoolLogo size="md" />
              </div>

              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[#60A5FA] text-[11px] font-bold uppercase tracking-wider mb-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#F59E0B]" />
                  Official Student Portal Login
                </span>
                <h1 className="text-2xl font-black text-white tracking-tight">
                  Student Portal Sign In
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Enter your Surname and 7-digit Registration Number to access your terminal result slip.
                </p>
              </div>
            </div>

            {/* Error Notification Banner */}
            {errorMessage && (
              <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-200 text-xs flex items-start gap-3 animate-fadeIn">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">Authentication Failed</p>
                  <p className="text-red-300/90 leading-relaxed">{errorMessage}</p>
                </div>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLoginSubmit} className="space-y-5">
              
              {/* Surname Input */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Student Surname (Last Name) *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <User className="w-4 h-4 text-blue-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={surname}
                    onChange={(e) => setSurname(e.target.value)}
                    placeholder="e.g. Okon or Martinez"
                    className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:border-blue-500 transition-all shadow-inner"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Enter your family surname as registered on your admission documents.
                </p>
              </div>

              {/* Registration ID Input */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    7-Digit Registration ID *
                  </label>
                  <span className="text-[10px] font-mono text-amber-400 font-bold bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/20">
                    7 Digits
                  </span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Hash className="w-4 h-4 text-[#F59E0B]" />
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={7}
                    value={regId}
                    onChange={(e) => setRegId(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 2025104"
                    className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-sm font-mono font-bold text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:border-blue-500 transition-all shadow-inner tracking-widest"
                  />
                </div>
              </div>

              {/* Session & Term Selection Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                    Academic Session
                  </label>
                  <select
                    value={session}
                    onChange={(e) => setSession(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-medium text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="2025/2026 Academic Session">2025/2026 Session</option>
                    <option value="2024/2025 Academic Session">2024/2025 Session</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                    Term
                  </label>
                  <select
                    value={term}
                    onChange={(e) => setTerm(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-medium text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="First Term">First Term</option>
                    <option value="Second Term">Second Term</option>
                    <option value="Third Term (Final)">Third Term</option>
                  </select>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-6 rounded-2xl bg-[#1E3A8A] hover:bg-blue-800 text-white font-bold text-sm shadow-lg shadow-blue-900/30 border border-blue-400/30 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Student Portal</span>
                    <ArrowRight className="w-4 h-4 text-[#F59E0B]" />
                  </>
                )}
              </button>

            </form>

            {/* Quick Demo Fill Credentials Section */}
            <div className="mt-8 pt-6 border-t border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#F59E0B]" />
                  Quick Test Student Credentials
                </span>
                <span className="text-[10px] text-slate-500">Click to autofill</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleFillDemo('Okon', '2025104')}
                  className="p-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 text-left transition-all cursor-pointer group"
                >
                  <p className="text-xs font-bold text-white group-hover:text-blue-300">David Okon</p>
                  <p className="text-[10px] font-mono text-slate-400">Reg ID: <strong className="text-amber-400">2025104</strong></p>
                </button>

                <button
                  type="button"
                  onClick={() => handleFillDemo('Martinez', '2025108')}
                  className="p-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 text-left transition-all cursor-pointer group"
                >
                  <p className="text-xs font-bold text-white group-hover:text-blue-300">Sophia Martinez</p>
                  <p className="text-[10px] font-mono text-slate-400">Reg ID: <strong className="text-amber-400">2025108</strong></p>
                </button>

                <button
                  type="button"
                  onClick={() => handleFillDemo('Vance', '2025110')}
                  className="p-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 text-left transition-all cursor-pointer group"
                >
                  <p className="text-xs font-bold text-white group-hover:text-blue-300">Marcus Vance</p>
                  <p className="text-[10px] font-mono text-slate-400">Reg ID: <strong className="text-amber-400">2025110</strong></p>
                </button>

                <button
                  type="button"
                  onClick={() => handleFillDemo('Washington', '2025114')}
                  className="p-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 text-left transition-all cursor-pointer group"
                >
                  <p className="text-xs font-bold text-white group-hover:text-blue-300">Amara Washington</p>
                  <p className="text-[10px] font-mono text-slate-400">Reg ID: <strong className="text-amber-400">2025114</strong></p>
                </button>
              </div>
            </div>

          </div>

          {/* Bottom Security Note */}
          <div className="text-center mt-6 text-slate-500 text-xs flex items-center justify-center gap-2">
            <Lock className="w-3.5 h-3.5 text-blue-400" />
            <span>256-bit Encrypted Student Authentication System</span>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-4 text-center text-slate-600 text-xs border-t border-slate-900 z-10">
        <p>&copy; {new Date().getFullYear()} Royal Academy Official Portal. All Rights Reserved.</p>
      </footer>

    </div>
  );
};
