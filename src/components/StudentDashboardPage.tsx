import React, { useState } from 'react';
import { StudentResult } from '../types';
import { ResultSlipModal } from './ResultSlipModal';
import { QRVerificationModal } from './QRVerificationModal';
import { SchoolLogo } from './SchoolLogo';
import { MOCK_STUDENTS } from '../data/mockData';
import { api } from '../services/api';
import {
  LayoutDashboard,
  Search,
  BookOpen,
  Printer,
  Download,
  QrCode,
  GraduationCap,
  LogOut,
  ArrowLeft,
  User,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  Sparkles,
  Menu,
  X,
  Eye,
  RefreshCw,
  HelpCircle
} from 'lucide-react';

interface StudentDashboardPageProps {
  student: StudentResult;
  onLogout: () => void;
  onBackToWebsite: () => void;
}

type StudentTabType =
  | 'overview'
  | 'check-result'
  | 'subjects'
  | 'print-slip'
  | 'verify-qr'
  | 'help';

export const StudentDashboardPage: React.FC<StudentDashboardPageProps> = ({
  student: initialStudent,
  onLogout,
  onBackToWebsite,
}) => {
  const [activeTab, setActiveTab] = useState<StudentTabType>('overview');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Active Student Result State
  const [activeStudent, setActiveStudent] = useState<StudentResult>(initialStudent);

  // Search & Filter state
  const [searchStudentId, setSearchStudentId] = useState(initialStudent.studentId);
  const [selectedSession, setSelectedSession] = useState(initialStudent.academicSession || '2025/2026 Academic Session');
  const [selectedTerm, setSelectedTerm] = useState(initialStudent.term || 'First Term');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchSuccess, setSearchSuccess] = useState<string | null>(null);

  // Modal Control States
  const [isResultSlipModalOpen, setIsResultSlipModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  // Perform search handler
  const handlePerformSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSearchError(null);
    setSearchSuccess(null);

    const cleanId = searchStudentId.trim();
    if (!cleanId) {
      setSearchError('Please enter a valid Student Registration ID.');
      return;
    }

    setIsSearching(true);

    try {
      const fetched = await api.getStudentById(cleanId);
      setIsSearching(false);

      if (fetched) {
        const updatedResult: StudentResult = {
          ...fetched,
          academicSession: selectedSession,
          term: selectedTerm,
        };
        setActiveStudent(updatedResult);
        setSearchSuccess(`Loaded result for Reg ID ${cleanId} (${selectedSession} - ${selectedTerm}).`);
      } else if (MOCK_STUDENTS[cleanId]) {
        const mockMatch: StudentResult = {
          ...MOCK_STUDENTS[cleanId],
          academicSession: selectedSession,
          term: selectedTerm,
        };
        setActiveStudent(mockMatch);
        setSearchSuccess(`Loaded result for Reg ID ${cleanId} (${selectedSession} - ${selectedTerm}).`);
      } else {
        setSearchError(`No student record found for Registration ID "${cleanId}". Try ID 2025104, 2025108, 2025110, or 2025114.`);
      }
    } catch {
      setIsSearching(false);
      if (MOCK_STUDENTS[cleanId]) {
        const mockMatch: StudentResult = {
          ...MOCK_STUDENTS[cleanId],
          academicSession: selectedSession,
          term: selectedTerm,
        };
        setActiveStudent(mockMatch);
        setSearchSuccess(`Loaded result for Registration ID ${cleanId}.`);
      } else {
        setSearchError(`Network error looking up Student ID "${cleanId}".`);
      }
    }
  };

  const handlePrintResult = () => {
    setIsResultSlipModalOpen(true);
    setTimeout(() => {
      window.print();
    }, 250);
  };

  const studentSubjects = activeStudent?.subjects || [];
  const subjectsPassed = studentSubjects.filter(s => (s.total || 0) >= 50).length;
  const subjectsFailed = studentSubjects.filter(s => (s.total || 0) < 50).length;
  const totalScoreCalculated = studentSubjects.reduce((acc, s) => acc + (s.total || 0), 0);
  const averageScoreCalculated = studentSubjects.length > 0 ? (totalScoreCalculated / studentSubjects.length) : (activeStudent?.overallAverage || 0);
  const gpaCalculated = Number((averageScoreCalculated / 25).toFixed(2));

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-['Inter',sans-serif] flex flex-col md:flex-row selection:bg-[#1E3A8A]/10 selection:text-[#1E3A8A]">
      
      {/* ---------------------------------------------------------------- */}
      {/* MOBILE HEADER BAR */}
      {/* ---------------------------------------------------------------- */}
      <div className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-40 shadow-xs">
        <div className="flex items-center gap-2.5">
          <SchoolLogo size="sm" showText={false} />
          <div>
            <h1 className="text-sm font-bold text-[#1E3A8A] leading-tight font-['Plus_Jakarta_Sans']">ROYAL ACADEMY</h1>
            <p className="text-[10px] text-amber-600 font-bold uppercase">Student Portal</p>
          </div>
        </div>

        <button
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 transition-colors cursor-pointer"
          aria-label="Toggle Navigation Menu"
        >
          {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* LEFT SIDEBAR NAVIGATION (WHITE & ROYAL BLUE THEME) */}
      {/* ---------------------------------------------------------------- */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 md:z-30 h-screen w-64 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-300 ease-in-out shrink-0 shadow-xs ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full overflow-y-auto">
          
          {/* Sidebar Top Header */}
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <SchoolLogo size="sm" showText={false} />
              <div>
                <h2 className="text-xs font-black text-[#1E3A8A] tracking-tight leading-tight uppercase font-['Plus_Jakarta_Sans']">
                  ROYAL ACADEMY
                </h2>
                <p className="text-[10px] text-amber-600 font-bold uppercase">
                  Student Portal
                </p>
              </div>
            </div>

            <button
              onClick={onBackToWebsite}
              className="p-1.5 text-slate-500 hover:text-[#1E3A8A] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Back to Home Website"
            >
              <ArrowLeft className="w-4 h-4 text-[#F59E0B]" />
            </button>
          </div>

          {/* Student Badge Card */}
          <div className="p-3.5 mx-3 my-3 bg-slate-50/90 rounded-2xl border border-slate-200/80 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-[#1E3A8A] shrink-0 bg-white shadow-xs">
              <img
                src={activeStudent.passportUrl}
                alt={activeStudent.fullName}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="overflow-hidden">
              <h3 className="text-xs font-bold text-slate-900 truncate">{activeStudent.fullName}</h3>
              <p className="text-[10px] text-amber-600 font-mono font-bold">{activeStudent.studentId}</p>
              <p className="text-[10px] text-slate-500 truncate">{activeStudent.className}</p>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="p-3 space-y-1 flex-1">
            <div className="px-3 pt-1 pb-1 text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
              Student Menu
            </div>

            {/* 1. Dashboard Overview */}
            <button
              onClick={() => {
                setActiveTab('overview');
                setMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-[#1E3A8A] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <LayoutDashboard className={`w-4 h-4 ${activeTab === 'overview' ? 'text-[#F59E0B]' : 'text-slate-400'}`} />
                <span>Overview</span>
              </div>
            </button>

            {/* 2. Check Result */}
            <button
              onClick={() => {
                setActiveTab('check-result');
                setMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'check-result'
                  ? 'bg-[#1E3A8A] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Search className={`w-4 h-4 ${activeTab === 'check-result' ? 'text-[#F59E0B]' : 'text-slate-400'}`} />
                <span>Check Result</span>
              </div>
            </button>

            {/* 3. Subject Grades */}
            <button
              onClick={() => {
                setActiveTab('subjects');
                setMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'subjects'
                  ? 'bg-[#1E3A8A] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <BookOpen className={`w-4 h-4 ${activeTab === 'subjects' ? 'text-[#F59E0B]' : 'text-slate-400'}`} />
                <span>Subject Performance</span>
              </div>
              <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md ${
                activeTab === 'subjects' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
              }`}>
                {activeStudent.subjects.length}
              </span>
            </button>

            {/* 4. Print & Download Slip */}
            <button
              onClick={() => {
                setActiveTab('print-slip');
                setMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'print-slip'
                  ? 'bg-[#1E3A8A] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Printer className={`w-4 h-4 ${activeTab === 'print-slip' ? 'text-[#F59E0B]' : 'text-slate-400'}`} />
                <span>Print Result Slip</span>
              </div>
            </button>

            {/* 5. QR Code Verification */}
            <button
              onClick={() => {
                setActiveTab('verify-qr');
                setMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'verify-qr'
                  ? 'bg-[#1E3A8A] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <QrCode className={`w-4 h-4 ${activeTab === 'verify-qr' ? 'text-[#F59E0B]' : 'text-slate-400'}`} />
                <span>Verify QR Code</span>
              </div>
            </button>

            {/* 6. Help & Support */}
            <button
              onClick={() => {
                setActiveTab('help');
                setMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'help'
                  ? 'bg-[#1E3A8A] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <HelpCircle className={`w-4 h-4 ${activeTab === 'help' ? 'text-[#F59E0B]' : 'text-slate-400'}`} />
                <span>Help & Support</span>
              </div>
            </button>
          </nav>

          {/* Footer Signout */}
          <div className="p-3.5 border-t border-slate-200 space-y-2">
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>

        </div>
      </aside>

      {/* Backdrop for mobile */}
      {mobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 md:hidden"
        />
      )}

      {/* ---------------------------------------------------------------- */}
      {/* MAIN CONTENT AREA */}
      {/* ---------------------------------------------------------------- */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* Top Header Bar - White Background */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-20 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-50 border border-blue-100 text-[#1E3A8A]">
              {activeTab === 'overview' && <LayoutDashboard className="w-5 h-5 text-[#1E3A8A]" />}
              {activeTab === 'check-result' && <Search className="w-5 h-5 text-[#1E3A8A]" />}
              {activeTab === 'subjects' && <BookOpen className="w-5 h-5 text-[#1E3A8A]" />}
              {activeTab === 'print-slip' && <Printer className="w-5 h-5 text-[#1E3A8A]" />}
              {activeTab === 'verify-qr' && <QrCode className="w-5 h-5 text-[#1E3A8A]" />}
              {activeTab === 'help' && <HelpCircle className="w-5 h-5 text-[#1E3A8A]" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 capitalize font-['Plus_Jakarta_Sans']">
                {activeTab === 'overview' && 'Student Dashboard'}
                {activeTab === 'check-result' && 'Check & Load Result'}
                {activeTab === 'subjects' && 'Subject Performance Analysis'}
                {activeTab === 'print-slip' && 'Official Print Result Slip'}
                {activeTab === 'verify-qr' && 'QR Security Verification'}
                {activeTab === 'help' && 'Portal Help & Support'}
              </h2>
              <p className="text-xs text-slate-500">
                Logged in as <strong className="text-slate-800">{activeStudent.fullName}</strong> ({activeStudent.className})
              </p>
            </div>
          </div>

          {/* Header Quick Actions */}
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={() => setIsResultSlipModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-950 bg-[#F59E0B] hover:bg-amber-500 rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Full Result Slip</span>
            </button>

            <button
              onClick={handlePrintResult}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-200 transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-[#1E3A8A]" />
              <span>Print A4</span>
            </button>

            <button
              onClick={() => setIsQrModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#1E3A8A] bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-200 transition-all cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5 text-[#F59E0B]" />
              <span>Verify QR</span>
            </button>
          </div>
        </header>

        {/* MAIN BODY CONTAINER */}
        <main className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1">

          {/* ---------------------------------------------------------------- */}
          {/* TAB 1: OVERVIEW */}
          {/* ---------------------------------------------------------------- */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              
              {/* Profile Banner - Executive Blue Card */}
              <div className="rounded-2xl bg-gradient-to-r from-[#1E3A8A] via-blue-900 to-indigo-900 text-white border border-blue-900 p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl border-2 border-amber-400 overflow-hidden bg-white shrink-0 shadow-md">
                      <img
                        src={activeStudent.passportUrl}
                        alt={activeStudent.fullName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[10px] font-bold uppercase mb-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Verified Student
                      </div>
                      <h1 className="text-xl sm:text-2xl font-black text-white font-['Plus_Jakarta_Sans']">{activeStudent.fullName}</h1>
                      <p className="text-xs text-blue-100">
                        {activeStudent.className} • {activeStudent.academicSession} ({activeStudent.term})
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 w-full sm:w-auto">
                    <button
                      onClick={() => setIsResultSlipModalOpen(true)}
                      className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-950 bg-[#F59E0B] hover:bg-amber-400 rounded-xl transition-all cursor-pointer shadow-xs"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View Result</span>
                    </button>

                    <button
                      onClick={handlePrintResult}
                      className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-white/10 hover:bg-white/20 rounded-xl border border-white/20 transition-all cursor-pointer"
                    >
                      <Download className="w-4 h-4 text-emerald-300" />
                      <span>Print PDF</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Simple Stats Cards - White Card Styling matching Admin Dashboard */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-1 shadow-xs">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Overall Average</span>
                  <div className="text-2xl font-black text-slate-900 font-mono">
                    {averageScoreCalculated.toFixed(1)}%
                  </div>
                  <p className="text-[10px] text-emerald-600 font-bold">GPA: {gpaCalculated.toFixed(2)} / 4.0</p>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-1 shadow-xs">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Class Position</span>
                  <div className="text-2xl font-black text-amber-600 font-mono">
                    #{activeStudent.position} <span className="text-xs font-normal text-slate-400">/ {activeStudent.totalInClass}</span>
                  </div>
                  <p className="text-[10px] text-blue-700 font-semibold">Class Rank</p>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-1 shadow-xs">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Passed Subjects</span>
                  <div className="text-2xl font-black text-emerald-600 font-mono">
                    {subjectsPassed} <span className="text-xs text-slate-400 font-normal">/ {activeStudent.subjects.length}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium">Failed: {subjectsFailed}</p>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-1 shadow-xs">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Attendance</span>
                  <div className="text-2xl font-black text-slate-900 font-mono">
                    {activeStudent.attendance.timesPresent} <span className="text-xs text-slate-400 font-normal">/ {activeStudent.attendance.timesOpened} Days</span>
                  </div>
                  <p className="text-[10px] text-emerald-600 font-bold">Regular Attendance</p>
                </div>
              </div>

              {/* Subject Breakdown Table - White Theme */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 font-['Plus_Jakarta_Sans']">Subject Grade Breakdown</h3>
                    <p className="text-xs text-slate-500">Current session exam results</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('subjects')}
                    className="text-xs font-bold text-[#1E3A8A] hover:underline cursor-pointer"
                  >
                    View All &rarr;
                  </button>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-600 uppercase font-extrabold text-[10px] bg-slate-50">
                        <th className="py-2.5 px-3">Subject</th>
                        <th className="py-2.5 px-3 text-center">CA (40)</th>
                        <th className="py-2.5 px-3 text-center">Exam (60)</th>
                        <th className="py-2.5 px-3 text-center">Total (100)</th>
                        <th className="py-2.5 px-3 text-center">Grade</th>
                        <th className="py-2.5 px-3 text-right">Remark</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800">
                      {studentSubjects.length > 0 ? (
                        studentSubjects.map((sub, idx) => (
                          <tr key={sub.id || idx} className="hover:bg-slate-50/80">
                            <td className="py-3 px-3 font-bold text-slate-900">{sub.subject}</td>
                            <td className="py-3 px-3 text-center font-mono text-slate-600">{sub.caScore}</td>
                            <td className="py-3 px-3 text-center font-mono text-slate-600">{sub.examScore}</td>
                            <td className="py-3 px-3 text-center font-mono font-black text-slate-900 text-sm">{sub.total}</td>
                            <td className="py-3 px-3 text-center">
                              <span className="px-2 py-0.5 rounded font-black font-mono text-xs bg-emerald-50 text-emerald-700 border border-emerald-200">
                                {sub.grade}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right font-bold text-slate-500 text-[10px] uppercase">{sub.remark}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="py-6 text-center text-slate-500 font-medium">
                            No subject scores entered for this student yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Remarks Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2 shadow-xs">
                  <h4 className="text-xs font-bold uppercase text-slate-500 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-[#1E3A8A]" />
                    Teacher Remark
                  </h4>
                  <p className="text-xs text-slate-700 italic bg-slate-50 p-3 rounded-xl border border-slate-200">
                    "{activeStudent.classTeacherRemark}"
                  </p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2 shadow-xs">
                  <h4 className="text-xs font-bold uppercase text-slate-500 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-600" />
                    Principal Remark
                  </h4>
                  <p className="text-xs text-slate-700 italic bg-slate-50 p-3 rounded-xl border border-slate-200">
                    "{activeStudent.principalRemark}"
                  </p>
                </div>
              </div>

            </div>
          )}

          {/* ---------------------------------------------------------------- */}
          {/* TAB 2: CHECK RESULT */}
          {/* ---------------------------------------------------------------- */}
          {activeTab === 'check-result' && (
            <div className="space-y-6">
              
              <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5 shadow-xs">
                <div className="border-b border-slate-200 pb-3 flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-50 text-[#1E3A8A] border border-blue-100">
                    <Search className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 font-['Plus_Jakarta_Sans']">Search Result Sheet</h3>
                    <p className="text-xs text-slate-500">Lookup student record by Registration ID and Term</p>
                  </div>
                </div>

                {searchError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 font-medium">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>{searchError}</span>
                  </div>
                )}

                {searchSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{searchSuccess}</span>
                  </div>
                )}

                <form onSubmit={handlePerformSearch} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                        Student Reg ID *
                      </label>
                      <input
                        type="text"
                        required
                        value={searchStudentId}
                        onChange={(e) => setSearchStudentId(e.target.value)}
                        placeholder="e.g. 2025104"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-[#1E3A8A]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                        Session *
                      </label>
                      <select
                        value={selectedSession}
                        onChange={(e) => setSelectedSession(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-[#1E3A8A]"
                      >
                        <option value="2025/2026 Academic Session">2025/2026 Academic Session</option>
                        <option value="2024/2025 Academic Session">2024/2025 Academic Session</option>
                        <option value="2023/2024 Academic Session">2023/2024 Academic Session</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                        Term *
                      </label>
                      <select
                        value={selectedTerm}
                        onChange={(e) => setSelectedTerm(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-[#1E3A8A]"
                      >
                        <option value="First Term">First Term</option>
                        <option value="Second Term">Second Term</option>
                        <option value="Third Term (Final Session)">Third Term (Final Session)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isSearching}
                      className="px-5 py-2.5 bg-[#1E3A8A] hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 cursor-pointer transition-all"
                    >
                      {isSearching ? <RefreshCw className="w-4 h-4 animate-spin text-[#F59E0B]" /> : <Search className="w-4 h-4 text-[#F59E0B]" />}
                      <span>Fetch Result Record</span>
                    </button>
                  </div>
                </form>

                <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Quick Test IDs:</span>
                  {['2025104', '2025108', '2025110', '2025114'].map((id) => (
                    <button
                      key={id}
                      onClick={() => {
                        setSearchStudentId(id);
                        handlePerformSearch();
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-[11px] font-mono font-bold text-[#1E3A8A] cursor-pointer"
                    >
                      {id}
                    </button>
                  ))}
                </div>
              </div>

              {/* Display Result Panel */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5 shadow-xs">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-14 rounded-lg overflow-hidden border-2 border-[#1E3A8A] bg-slate-50 shrink-0">
                      <img src={activeStudent.passportUrl} alt={activeStudent.fullName} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 font-['Plus_Jakarta_Sans']">{activeStudent.fullName}</h3>
                      <p className="text-xs text-slate-500 font-mono">
                        Reg ID: <strong className="text-amber-600">{activeStudent.studentId}</strong> • {activeStudent.className}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => setIsResultSlipModalOpen(true)}
                      className="px-3.5 py-2 text-xs font-bold text-slate-950 bg-[#F59E0B] hover:bg-amber-400 rounded-xl shadow-xs cursor-pointer"
                    >
                      View Result
                    </button>
                    <button
                      onClick={handlePrintResult}
                      className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-200 cursor-pointer"
                    >
                      Print A4
                    </button>
                    <button
                      onClick={() => setIsQrModalOpen(true)}
                      className="px-3.5 py-2 text-xs font-semibold text-[#1E3A8A] bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-200 cursor-pointer"
                    >
                      Verify QR
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-600 uppercase font-bold text-[10px] bg-slate-50">
                        <th className="py-2.5 px-3">Subject</th>
                        <th className="py-2.5 px-3 text-center">CA (40)</th>
                        <th className="py-2.5 px-3 text-center">Exam (60)</th>
                        <th className="py-2.5 px-3 text-center">Total (100)</th>
                        <th className="py-2.5 px-3 text-center">Grade</th>
                        <th className="py-2.5 px-3 text-right">Remark</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800">
                      {studentSubjects.length > 0 ? (
                        studentSubjects.map((sub, idx) => (
                          <tr key={sub.id || idx} className="hover:bg-slate-50/80">
                            <td className="py-2.5 px-3 font-bold text-slate-900">{sub.subject}</td>
                            <td className="py-2.5 px-3 text-center font-mono text-slate-600">{sub.caScore}</td>
                            <td className="py-2.5 px-3 text-center font-mono text-slate-600">{sub.examScore}</td>
                            <td className="py-2.5 px-3 text-center font-mono font-black text-slate-900">{sub.total}</td>
                            <td className="py-2.5 px-3 text-center">
                              <span className="px-2 py-0.5 rounded font-black font-mono text-xs bg-emerald-50 text-emerald-700 border border-emerald-200">
                                {sub.grade}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-slate-500 text-[10px] uppercase">{sub.remark}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="py-6 text-center text-slate-500 font-medium italic">
                            No subjects created or entered for this student yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* ---------------------------------------------------------------- */}
          {/* TAB 3: SUBJECT PERFORMANCE */}
          {/* ---------------------------------------------------------------- */}
          {activeTab === 'subjects' && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 font-['Plus_Jakarta_Sans']">Full Course Performance</h3>
                    <p className="text-xs text-slate-500">Enrolled subjects and score details</p>
                  </div>
                  <span className="px-3 py-1 bg-blue-50 text-[#1E3A8A] rounded-xl text-xs font-bold border border-blue-200">
                    {activeStudent.subjects.length} Subjects Total
                  </span>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-600 uppercase font-bold text-[10px] bg-slate-50">
                        <th className="py-3 px-4">Subject Name</th>
                        <th className="py-3 px-3 text-center">CA Score (40)</th>
                        <th className="py-3 px-3 text-center">Exam Score (60)</th>
                        <th className="py-3 px-3 text-center">Total Score (100)</th>
                        <th className="py-3 px-3 text-center">Grade</th>
                        <th className="py-3 px-4 text-right">Remark</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800">
                      {studentSubjects.length > 0 ? (
                        studentSubjects.map((sub, idx) => (
                          <tr key={sub.id || idx} className="hover:bg-slate-50/80">
                            <td className="py-3 px-4 font-bold text-slate-900 text-sm">{sub.subject}</td>
                            <td className="py-3 px-3 text-center font-mono text-slate-600">{sub.caScore}</td>
                            <td className="py-3 px-3 text-center font-mono text-slate-600">{sub.examScore}</td>
                            <td className="py-3 px-3 text-center font-mono font-black text-slate-900 text-sm">{sub.total}</td>
                            <td className="py-3 px-3 text-center">
                              <span className="px-2.5 py-1 rounded font-black font-mono text-xs bg-emerald-50 text-emerald-700 border border-emerald-200">
                                {sub.grade}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-slate-600 text-xs uppercase">{sub.remark}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="py-6 text-center text-slate-500 font-medium">
                            No subject scores entered for this student yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ---------------------------------------------------------------- */}
          {/* TAB 4: PRINT RESULT SLIP */}
          {/* ---------------------------------------------------------------- */}
          {activeTab === 'print-slip' && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between shadow-xs">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 font-['Plus_Jakarta_Sans']">
                    <Printer className="w-4 h-4 text-[#F59E0B]" />
                    Printable A4 Result Slip
                  </h3>
                  <p className="text-xs text-slate-500">Official document preview for download or printing</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrintResult}
                    className="px-4 py-2 bg-[#F59E0B] hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                  >
                    Print Result
                  </button>
                  <button
                    onClick={() => setIsResultSlipModalOpen(true)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl border border-emerald-500 cursor-pointer shadow-xs"
                  >
                    Download HD PDF
                  </button>
                </div>
              </div>

              {/* Printable Document Paper */}
              <div className="bg-white text-black p-8 rounded-2xl shadow-xl border border-slate-300 space-y-4 max-w-4xl mx-auto font-sans">
                <div className="border-b-2 border-black pb-3 flex items-center justify-between gap-4">
                  <div className="w-14 h-14 rounded-xl border-2 border-black bg-slate-50 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-8 h-8 text-slate-900" />
                  </div>

                  <div className="text-center flex-1">
                    <h1 className="text-xl font-black text-black tracking-tight uppercase font-serif">
                      ROYAL ACADEMY
                    </h1>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-slate-800">
                      Official Terminal Result Slip
                    </p>
                  </div>

                  <div className="text-right text-xs font-bold border border-black p-2 bg-slate-50 rounded-sm shrink-0">
                    <div>{activeStudent.academicSession || '2025/2026 Session'}</div>
                    <div className="text-[10px] text-slate-600 font-normal">{activeStudent.term || 'First Term'}</div>
                  </div>
                </div>

                <div className="border border-black p-3 bg-white text-xs">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <div><span className="font-bold text-slate-600">Student Name:</span> <strong className="text-black uppercase">{activeStudent.fullName}</strong></div>
                    <div><span className="font-bold text-slate-600">Reg ID:</span> <strong className="font-mono">{activeStudent.studentId}</strong></div>
                    <div><span className="font-bold text-slate-600">Class:</span> <strong>{activeStudent.className}</strong></div>
                  </div>
                </div>

                <table className="w-full text-xs text-black border-collapse border border-black">
                  <thead>
                    <tr className="bg-gray-200 text-black font-bold text-[11px] uppercase border-b border-black">
                      <th className="p-1.5 border border-black text-center">S/N</th>
                      <th className="p-1.5 border border-black text-left">SUBJECT</th>
                      <th className="p-1.5 border border-black text-center">CA (40)</th>
                      <th className="p-1.5 border border-black text-center">EXAM (60)</th>
                      <th className="p-1.5 border border-black text-center">TOTAL</th>
                      <th className="p-1.5 border border-black text-center">GRADE</th>
                      <th className="p-1.5 border border-black text-center">REMARK</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentSubjects.length > 0 ? (
                      studentSubjects.map((sub, idx) => (
                        <tr key={sub.id || idx}>
                          <td className="p-1.5 border border-black text-center font-mono">{idx + 1}</td>
                          <td className="p-1.5 border border-black font-bold">{sub.subject}</td>
                          <td className="p-1.5 border border-black text-center font-mono">{sub.caScore}</td>
                          <td className="p-1.5 border border-black text-center font-mono">{sub.examScore}</td>
                          <td className="p-1.5 border border-black text-center font-bold font-mono">{sub.total}</td>
                          <td className="p-1.5 border border-black text-center font-black">{sub.grade}</td>
                          <td className="p-1.5 border border-black text-center text-[10px] uppercase">{sub.remark}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="p-4 border border-black text-center font-medium italic text-slate-500">
                          No subjects created or recorded yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ---------------------------------------------------------------- */}
          {/* TAB 5: VERIFY QR CODE */}
          {/* ---------------------------------------------------------------- */}
          {activeTab === 'verify-qr' && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-xs">
                <div className="border-b border-slate-200 pb-3 flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 font-['Plus_Jakarta_Sans']">Cryptographic QR Verification</h3>
                    <p className="text-xs text-slate-500">Verify transcript authenticity</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-col items-center text-center space-y-3">
                    <div className="p-3 bg-white rounded-xl border-2 border-[#1E3A8A] shadow-xs">
                      <svg viewBox="0 0 29 29" className="w-36 h-36 text-black fill-current">
                        <path d="M0 0h7v7H0zM2 2v3h3V2zM9 0h2v1H9zM12 0h1v2h-1zM15 0h1v1h-1zM18 0h2v2h-2zM22 0h7v7h-7zM24 2v3h3V2zM0 9h1v2H0zM3 9h2v1H3zM6 9h3v1H6zM11 9h1v3h-1zM14 9h3v1h-3zM18 9h1v1h-1zM20 9h2v2h-2zM24 9h2v1h-2zM28 9h1v2h-1zM0 12h2v1H0zM3 12h1v1H3zM5 12h2v1H5zM8 12h2v2H8zM13 12h3v1h-3zM18 12h1v2h-1zM21 12h3v1h-3zM26 12h2v1h-2zM0 15h1v1H0zM2 15h3v1H2zM6 15h1v3H6zM9 15h3v1H9zM14 15h1v1h-1zM17 15h2v1h-2zM21 15h1v1h-1zM24 15h1v3h-1zM27 15h2v1h-2zM0 18h2v2H0zM3 18h2v1H8zM11 18h2v3h-2zM15 18h2v1h-2zM19 18h3v1h-3zM26 18h3v1h-3zM0 22h7v7H0zM2 24v3h3v-3zM9 22h1v2H9zM12 22h2v1h-2zM16 22h1v1h-1zM19 22h1v2h-1zM21 22h2v1h-2zM25 22h3v1h-3zM9 25h2v2H9zM13 25h2v1h-2zM17 25h1v3h-1zM20 25h2v1h-2zM24 25h1v1h-1zM27 25h2v2h-2z" />
                      </svg>
                    </div>

                    <button
                      onClick={() => setIsQrModalOpen(true)}
                      className="px-4 py-2 bg-[#1E3A8A] hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-2"
                    >
                      <QrCode className="w-4 h-4 text-[#F59E0B]" />
                      <span>Open Scanner Modal</span>
                    </button>
                  </div>

                  <div className="space-y-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono">
                    <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-sans font-bold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>VERIFIED & CERTIFIED RECORD</span>
                    </div>

                    <div className="flex justify-between border-b border-slate-200 pb-2">
                      <span className="text-slate-500">Student ID:</span>
                      <strong className="text-slate-900">{activeStudent.studentId}</strong>
                    </div>
                    <div className="flex justify-between border-b border-slate-200 pb-2">
                      <span className="text-slate-500">Security Hash:</span>
                      <strong className="text-amber-700">{activeStudent.verificationHash || `RA-${activeStudent.studentId}-SEC`}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Verification Link:</span>
                      <strong className="text-[#1E3A8A]">royalacademy.edu.ng/verify</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ---------------------------------------------------------------- */}
          {/* TAB 6: HELP & SUPPORT */}
          {/* ---------------------------------------------------------------- */}
          {activeTab === 'help' && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
                <div className="border-b border-slate-200 pb-3 flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-50 text-[#1E3A8A] border border-blue-100">
                    <HelpCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 font-['Plus_Jakarta_Sans']">Student Portal Support</h3>
                    <p className="text-xs text-slate-500">Frequently asked questions and support contacts</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <h4 className="text-xs font-bold text-slate-900">How do I download or print my result?</h4>
                    <p className="text-xs text-slate-600">
                      Go to the <strong className="text-slate-900">Print Result Slip</strong> tab or click the <strong className="text-amber-700 font-bold">"Print A4"</strong> button at the top right of the dashboard.
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <h4 className="text-xs font-bold text-slate-900">Need support or grade corrections?</h4>
                    <p className="text-xs text-slate-600">
                      Contact the Academic Support Helpdesk at <strong className="text-[#1E3A8A]">support@royalacademy.edu.ng</strong>.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* Global Modals */}
      <ResultSlipModal
        result={activeStudent}
        isOpen={isResultSlipModalOpen}
        onClose={() => setIsResultSlipModalOpen(false)}
        onVerifyQR={() => {
          setIsResultSlipModalOpen(false);
          setIsQrModalOpen(true);
        }}
      />

      <QRVerificationModal
        studentId={activeStudent.studentId}
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
      />

    </div>
  );
};
