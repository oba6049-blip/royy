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
          `No student record found for 7-digit Registration ID "${cleanRegId}". Please verify your details.`
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
    <div className="min-h-screen bg-slate-50 text-slate-800 font-['Plus_Jakarta_Sans',sans-serif] flex flex-col justify-between relative overflow-hidden selection:bg-blue-100 selection:text-[#1E3A8A]">
      
      {/* Subtle Background Decorative Lights */}
      <div className="absolute top-0 left-1/3 w-[600px] h-[600px] bg-blue-100/40 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/3 w-[500px] h-[500px] bg-amber-100/30 rounded-full blur-[150px] pointer-events-none" />

      {/* Top Header Bar */}
      <header className="w-full px-6 py-4 border-b border-slate-200 bg-white/80 backdrop-blur-md flex items-center justify-between z-20 shadow-xs">
        <div className="flex items-center gap-4">
          <button
            onClick={onBackToHome}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-all cursor-pointer active:scale-95"
          >
            <ArrowLeft className="w-4 h-4 text-[#F59E0B]" />
            <span>Back to Main Website</span>
          </button>

          <div className="hidden sm:block h-5 w-px bg-slate-200" />

          <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-600">
            <GraduationCap className="w-4 h-4 text-[#1E3A8A]" />
            <span>Student Academic Result Portal</span>
          </div>
        </div>
      </header>

      {/* Main Login Body */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 z-10 my-6">
        <div className="w-full max-w-md">
          
          {/* White Card Container */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/60 relative overflow-hidden">
            
            {/* Top Accent Line */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#1E3A8A] via-blue-600 to-[#F59E0B]" />

            {/* School Logo & Title */}
            <div className="text-center space-y-3 mb-8">
              <div className="inline-flex p-3 rounded-2xl bg-slate-50 border border-slate-200 shadow-xs">
                <SchoolLogo size="md" lightMode={true} />
              </div>

              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-[#1E3A8A] text-[11px] font-extrabold uppercase tracking-wider mb-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#F59E0B]" />
                  Official Student Portal Login
                </span>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  Student Portal Sign In
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  Enter your Surname and 7-digit Registration Number to access your terminal result slip.
                </p>
              </div>
            </div>

            {/* Error Notification Banner */}
            {errorMessage && (
              <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-3 animate-fadeIn">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">Authentication Failed</p>
                  <p className="text-red-700/90 leading-relaxed">{errorMessage}</p>
                </div>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLoginSubmit} className="space-y-5">
              
              {/* Surname Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Student Surname (Last Name) *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4 text-[#1E3A8A]" />
                  </div>
                  <input
                    type="text"
                    required
                    value={surname}
                    onChange={(e) => setSurname(e.target.value)}
                    placeholder="e.g. Okon or Martinez"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#1E3A8A] focus:ring-2 focus:ring-[#1E3A8A]/10 transition-all shadow-xs"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Enter your family surname as registered on your admission documents.
                </p>
              </div>

              {/* Registration ID Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Registration ID *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Hash className="w-4 h-4 text-[#F59E0B]" />
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={7}
                    value={regId}
                    onChange={(e) => setRegId(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 2025104"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-mono font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#1E3A8A] focus:ring-2 focus:ring-[#1E3A8A]/10 transition-all shadow-xs tracking-widest"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-6 rounded-2xl bg-[#1E3A8A] hover:bg-blue-900 text-white font-bold text-sm shadow-md shadow-blue-900/15 border border-blue-900/20 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98 disabled:opacity-50"
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

          </div>

          {/* Bottom Security Note */}
          <div className="text-center mt-6 text-slate-500 text-xs flex items-center justify-center gap-2">
            <Lock className="w-3.5 h-3.5 text-[#1E3A8A]" />
            <span>256-bit Encrypted Student Authentication System</span>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-4 text-center text-slate-500 text-xs border-t border-slate-200 bg-white/50 z-10">
        <p>&copy; {new Date().getFullYear()} Royal Academy Official Portal. All Rights Reserved.</p>
      </footer>

    </div>
  );
};
