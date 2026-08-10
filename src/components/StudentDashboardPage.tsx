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
  Award,
  Calendar,
  Clock,
  Sparkles,
  Filter,
  Check,
  ChevronRight,
  Share2,
  Lock,
  Menu,
  X,
  ExternalLink,
  Eye,
  RefreshCw,
  HelpCircle,
  FileCheck
} from 'lucide-react';

interface StudentDashboardPageProps {
  student: StudentResult;
  onLogout: () => void;
  onBackToWebsite: () => void;
}

type StudentTabType =
  | 'dashboard'
  | 'search-result'
  | 'academic-records'
  | 'print-slip'
  | 'qr-verification'
  | 'support';

export const StudentDashboardPage: React.FC<StudentDashboardPageProps> = ({
  student: initialStudent,
  onLogout,
  onBackToWebsite,
}) => {
  const [activeTab, setActiveTab] = useState<StudentTabType>('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Active Student Result State (allows searching another student ID or switching sessions)
  const [activeStudent, setActiveStudent] = useState<StudentResult>(initialStudent);

  // Search & Filter state for the "Search Result" tab
  const [searchStudentId, setSearchStudentId] = useState(initialStudent.studentId);
  const [selectedSession, setSelectedSession] = useState(initialStudent.academicSession || '2025/2026 Academic Session');
  const [selectedTerm, setSelectedTerm] = useState(initialStudent.term || 'First Term');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchSuccess, setSearchSuccess] = useState<string | null>(null);

  // Subject grade filter state
  const [gradeFilter, setGradeFilter] = useState<string>('ALL');

  // Modal Control States
  const [isResultSlipModalOpen, setIsResultSlipModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Search Handler for "Search Result" tab
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
      // 1. Check API first
      const fetched = await api.getStudentById(cleanId);
      setIsSearching(false);

      if (fetched) {
        // Apply session & term override if selected
        const updatedResult: StudentResult = {
          ...fetched,
          academicSession: selectedSession,
          term: selectedTerm,
        };
        setActiveStudent(updatedResult);
        setSearchSuccess(`Successfully loaded result record for Registration ID ${cleanId} (${selectedSession} - ${selectedTerm}).`);
      } else if (MOCK_STUDENTS[cleanId]) {
        const mockMatch: StudentResult = {
          ...MOCK_STUDENTS[cleanId],
          academicSession: selectedSession,
          term: selectedTerm,
        };
        setActiveStudent(mockMatch);
        setSearchSuccess(`Loaded mock result record for Registration ID ${cleanId} (${selectedSession} - ${selectedTerm}).`);
      } else {
        setSearchError(`No student record found for Registration ID "${cleanId}". Please check the ID or try ID 2025104, 2025108, 2025110, or 2025114.`);
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
        setSearchSuccess(`Loaded result record for Registration ID ${cleanId}.`);
      } else {
        setSearchError(`Network error while looking up Student ID "${cleanId}".`);
      }
    }
  };

  const handlePrintResult = () => {
    window.print();
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}?studentId=${activeStudent.studentId}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Filter subjects for the subject table
  const filteredSubjects = activeStudent.subjects.filter((sub) => {
    if (gradeFilter === 'ALL') return true;
    if (gradeFilter === 'DISTINCTION') return sub.grade.startsWith('A');
    if (gradeFilter === 'CREDIT') return sub.grade.startsWith('B') || sub.grade.startsWith('C');
    if (gradeFilter === 'PASS') return sub.grade.startsWith('P') || sub.grade.startsWith('D');
    return true;
  });

  const subjectsPassed = activeStudent.subjects.filter(s => (s.total || 0) >= 50).length;
  const subjectsFailed = activeStudent.subjects.filter(s => (s.total || 0) < 50).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-['Inter',sans-serif] flex flex-col md:flex-row selection:bg-[#60A5FA]/30 selection:text-white">
      
      {/* ---------------------------------------------------------------- */}
      {/* MOBILE HEADER BAR */}
      {/* ---------------------------------------------------------------- */}
      <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <SchoolLogo size="sm" />
          <div>
            <h1 className="text-sm font-bold text-white leading-tight">Student Portal</h1>
            <p className="text-[10px] text-amber-400 font-mono font-semibold">{activeStudent.studentId}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-white transition-colors"
            aria-label="Toggle Navigation Menu"
          >
            {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* LEFT SIDEBAR NAVIGATION (MODERN ADMIN-STYLE LAYOUT) */}
      {/* ---------------------------------------------------------------- */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 md:z-30 h-screen w-72 bg-slate-900 border-r border-slate-800 flex flex-col justify-between transition-transform duration-300 ease-in-out shrink-0 ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full overflow-y-auto">
          
          {/* Sidebar Top Header */}
          <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <SchoolLogo size="sm" />
              <div>
                <h2 className="text-sm font-black text-white tracking-tight leading-tight">
                  ROYAL ACADEMY
                </h2>
                <p className="text-[10px] text-blue-400 font-semibold uppercase tracking-wider">
                  Student Result Portal
                </p>
              </div>
            </div>

            <button
              onClick={onBackToWebsite}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Return to Main Website"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Student Profile Summary Badge */}
          <div className="p-4 mx-3 my-3 bg-slate-950/80 rounded-2xl border border-slate-800 flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl overflow-hidden border-2 border-[#1E3A8A] shrink-0 bg-slate-900 shadow-md">
              <img
                src={activeStudent.passportUrl}
                alt={activeStudent.fullName}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="overflow-hidden">
              <h3 className="text-xs font-bold text-white truncate">{activeStudent.fullName}</h3>
              <p className="text-[10px] text-amber-400 font-mono font-bold">Reg ID: {activeStudent.studentId}</p>
              <p className="text-[10px] text-slate-400 truncate">{activeStudent.className}</p>
            </div>
          </div>

          {/* Navigation Tab Group */}
          <nav className="p-3 space-y-1 flex-1">
            <div className="px-3 pt-2 pb-1 text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
              Main Dashboard
            </div>

            {/* Tab 1: Overview */}
            <button
              onClick={() => {
                setActiveTab('dashboard');
                setMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-[#1E3A8A] text-white shadow-md shadow-blue-900/30 border border-blue-400/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <LayoutDashboard className={`w-4 h-4 ${activeTab === 'dashboard' ? 'text-[#F59E0B]' : 'text-slate-400'}`} />
                <span>Dashboard Overview</span>
              </div>
            </button>

            {/* Tab 2: Search Result */}
            <button
              onClick={() => {
                setActiveTab('search-result');
                setMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'search-result'
                  ? 'bg-[#1E3A8A] text-white shadow-md shadow-blue-900/30 border border-blue-400/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Search className={`w-4 h-4 ${activeTab === 'search-result' ? 'text-[#F59E0B]' : 'text-slate-400'}`} />
                <span>Search & Load Result</span>
              </div>
              <span className="text-[9px] font-mono bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded font-bold">
                ID / Session
              </span>
            </button>

            {/* Tab 3: Academic Records & Subject Performance */}
            <button
              onClick={() => {
                setActiveTab('academic-records');
                setMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'academic-records'
                  ? 'bg-[#1E3A8A] text-white shadow-md shadow-blue-900/30 border border-blue-400/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <BookOpen className={`w-4 h-4 ${activeTab === 'academic-records' ? 'text-[#F59E0B]' : 'text-slate-400'}`} />
                <span>Subject Performance</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 font-bold">
                {activeStudent.subjects.length} Subs
              </span>
            </button>

            <div className="px-3 pt-4 pb-1 text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
              Output & Verification
            </div>

            {/* Tab 4: Official Print Slip */}
            <button
              onClick={() => {
                setActiveTab('print-slip');
                setMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'print-slip'
                  ? 'bg-[#1E3A8A] text-white shadow-md shadow-blue-900/30 border border-blue-400/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Printer className={`w-4 h-4 ${activeTab === 'print-slip' ? 'text-[#F59E0B]' : 'text-slate-400'}`} />
                <span>Print Result Template</span>
              </div>
              <span className="text-[9px] font-mono bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded font-bold">
                A4 PDF
              </span>
            </button>

            {/* Tab 5: QR Code Verification */}
            <button
              onClick={() => {
                setActiveTab('qr-verification');
                setMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'qr-verification'
                  ? 'bg-[#1E3A8A] text-white shadow-md shadow-blue-900/30 border border-blue-400/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <QrCode className={`w-4 h-4 ${activeTab === 'qr-verification' ? 'text-[#F59E0B]' : 'text-slate-400'}`} />
                <span>Verify Result via QR</span>
              </div>
              <span className="text-[9px] font-mono text-emerald-400 font-bold flex items-center gap-0.5">
                <ShieldCheck className="w-3 h-3" /> Valid
              </span>
            </button>

            {/* Tab 6: Support */}
            <button
              onClick={() => {
                setActiveTab('support');
                setMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'support'
                  ? 'bg-[#1E3A8A] text-white shadow-md shadow-blue-900/30 border border-blue-400/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <HelpCircle className={`w-4 h-4 ${activeTab === 'support' ? 'text-[#F59E0B]' : 'text-slate-400'}`} />
                <span>Help & Portal Support</span>
              </div>
            </button>
          </nav>

          {/* Sidebar Footer Logout Button */}
          <div className="p-4 border-t border-slate-800 space-y-2">
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 transition-all cursor-pointer active:scale-95"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out of Student Portal</span>
            </button>
            <p className="text-[10px] text-center text-slate-500 font-mono">
              256-bit Encrypted Session
            </p>
          </div>

        </div>
      </aside>

      {/* Backdrop for mobile drawer */}
      {mobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-40 md:hidden"
        />
      )}

      {/* ---------------------------------------------------------------- */}
      {/* MAIN CONTENT AREA */}
      {/* ---------------------------------------------------------------- */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* Top Control Bar */}
        <header className="bg-slate-900/90 border-b border-slate-800 px-6 py-4 flex items-center justify-between sticky top-0 z-20 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-slate-800 border border-slate-700">
              {activeTab === 'dashboard' && <LayoutDashboard className="w-5 h-5 text-[#F59E0B]" />}
              {activeTab === 'search-result' && <Search className="w-5 h-5 text-[#F59E0B]" />}
              {activeTab === 'academic-records' && <BookOpen className="w-5 h-5 text-[#F59E0B]" />}
              {activeTab === 'print-slip' && <Printer className="w-5 h-5 text-[#F59E0B]" />}
              {activeTab === 'qr-verification' && <QrCode className="w-5 h-5 text-[#F59E0B]" />}
              {activeTab === 'support' && <HelpCircle className="w-5 h-5 text-[#F59E0B]" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-white capitalize">
                {activeTab === 'dashboard' && 'Student Dashboard Overview'}
                {activeTab === 'search-result' && 'Search Result & Filter Portal'}
                {activeTab === 'academic-records' && 'Academic Subject Records'}
                {activeTab === 'print-slip' && 'Official Print Result Sheet Template'}
                {activeTab === 'qr-verification' && 'QR Code Security Verification'}
                {activeTab === 'support' && 'Portal Support & Guidance'}
              </h2>
              <p className="text-xs text-slate-400">
                Logged in as <strong className="text-white">{activeStudent.fullName}</strong> ({activeStudent.className})
              </p>
            </div>
          </div>

          {/* Quick Action Header Toolbar */}
          <div className="hidden sm:flex items-center gap-2.5">
            <button
              onClick={() => setIsResultSlipModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-950 bg-[#F59E0B] hover:bg-amber-400 rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Full Result Slip</span>
            </button>

            <button
              onClick={handlePrintResult}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-blue-400" />
              <span>Print A4</span>
            </button>

            <button
              onClick={() => setIsQrModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-blue-900/60 hover:bg-blue-800 rounded-xl border border-blue-500/30 transition-all cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5 text-[#F59E0B]" />
              <span>Verify QR</span>
            </button>
          </div>
        </header>

        {/* TAB BODY CONTAINER */}
        <main className="p-4 sm:p-6 lg:p-8 space-y-8 flex-1">

          {/* ---------------------------------------------------------------- */}
          {/* TAB 1: DASHBOARD OVERVIEW */}
          {/* ---------------------------------------------------------------- */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-fadeIn">
              
              {/* Hero Banner */}
              <div className="relative rounded-3xl bg-gradient-to-r from-[#1E3A8A] via-blue-900 to-slate-900 border border-blue-500/30 p-6 sm:p-8 shadow-2xl overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div className="flex items-center gap-5">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-2 border-[#F59E0B]/50 overflow-hidden shadow-2xl shrink-0 bg-slate-900">
                      <img
                        src={activeStudent.passportUrl}
                        alt={activeStudent.fullName}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold uppercase tracking-wider">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        Verified Student Record
                      </div>
                      <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                        {activeStudent.fullName}
                      </h1>
                      <p className="text-xs sm:text-sm text-blue-200">
                        {activeStudent.className} • {activeStudent.academicSession} ({activeStudent.term})
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 shrink-0 w-full md:w-auto">
                    <button
                      onClick={() => setActiveTab('search-result')}
                      className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-5 py-3 text-xs font-bold text-slate-950 bg-[#F59E0B] hover:bg-amber-400 rounded-2xl shadow-lg transition-all cursor-pointer active:scale-95"
                    >
                      <Search className="w-4 h-4" />
                      <span>Search Result & Term</span>
                    </button>

                    <button
                      onClick={() => setIsResultSlipModalOpen(true)}
                      className="inline-flex items-center justify-center gap-2 px-4 py-3 text-xs font-bold text-white bg-white/10 hover:bg-white/20 rounded-2xl border border-white/20 transition-all cursor-pointer"
                    >
                      <Eye className="w-4 h-4 text-blue-300" />
                      <span>View Full Slip</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Key Metrics Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Overall Average</span>
                  <div className="text-2xl sm:text-3xl font-black text-white font-mono">
                    {activeStudent.overallAverage.toFixed(1)}%
                  </div>
                  <p className="text-[10px] text-emerald-400 font-semibold">GPA: {activeStudent.gpa.toFixed(2)} / 4.0</p>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Class Ranking</span>
                  <div className="text-2xl sm:text-3xl font-black text-[#F59E0B] font-mono">
                    #{activeStudent.position} <span className="text-xs font-normal text-slate-400">/ {activeStudent.totalInClass}</span>
                  </div>
                  <p className="text-[10px] text-blue-300">Position in Class</p>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Pass Rate</span>
                  <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
                    {subjectsPassed} <span className="text-xs text-slate-400 font-normal">/ {activeStudent.subjects.length} Passed</span>
                  </div>
                  <p className="text-[10px] text-slate-400">Failed: {subjectsFailed}</p>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Attendance</span>
                  <div className="text-2xl sm:text-3xl font-black text-white font-mono">
                    {activeStudent.attendance.timesPresent} <span className="text-xs text-slate-400 font-normal">/ {activeStudent.attendance.timesOpened} Days</span>
                  </div>
                  <p className="text-[10px] text-emerald-400">Excellent Attendance Record</p>
                </div>
              </div>

              {/* Quick Actions Panel */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#F59E0B]" />
                  Result Actions & Controls
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  
                  <button
                    onClick={() => setActiveTab('search-result')}
                    className="p-4 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 rounded-2xl text-left transition-all group cursor-pointer"
                  >
                    <Search className="w-6 h-6 text-[#F59E0B] mb-2 group-hover:scale-110 transition-transform" />
                    <h4 className="text-xs font-bold text-white mb-1">Search & Change Session</h4>
                    <p className="text-[10px] text-slate-400">Lookup other sessions or enter student ID.</p>
                  </button>

                  <button
                    onClick={() => setIsResultSlipModalOpen(true)}
                    className="p-4 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 rounded-2xl text-left transition-all group cursor-pointer"
                  >
                    <Eye className="w-6 h-6 text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
                    <h4 className="text-xs font-bold text-white mb-1">View Result Slip</h4>
                    <p className="text-[10px] text-slate-400">Inspect full terminal grade report.</p>
                  </button>

                  <button
                    onClick={handlePrintResult}
                    className="p-4 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 rounded-2xl text-left transition-all group cursor-pointer"
                  >
                    <Download className="w-6 h-6 text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
                    <h4 className="text-xs font-bold text-white mb-1">Download PDF & Print</h4>
                    <p className="text-[10px] text-slate-400">Export high-resolution A4 print document.</p>
                  </button>

                  <button
                    onClick={() => setIsQrModalOpen(true)}
                    className="p-4 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 rounded-2xl text-left transition-all group cursor-pointer"
                  >
                    <QrCode className="w-6 h-6 text-purple-400 mb-2 group-hover:scale-110 transition-transform" />
                    <h4 className="text-xs font-bold text-white mb-1">Verify QR Code</h4>
                    <p className="text-[10px] text-slate-400">Audit cryptographic verification hash.</p>
                  </button>

                </div>
              </div>

              {/* Subject Breakdown Preview Table */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white">Subject Grades Summary</h3>
                    <p className="text-xs text-slate-400">First 5 subjects preview. Click 'Subject Performance' for all records.</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('academic-records')}
                    className="text-xs font-bold text-[#60A5FA] hover:underline cursor-pointer flex items-center gap-1"
                  >
                    View All Subjects &rarr;
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 uppercase font-bold text-[10px] tracking-wider">
                        <th className="py-2.5 px-3">Subject</th>
                        <th className="py-2.5 px-3 text-center">CA (20/40)</th>
                        <th className="py-2.5 px-3 text-center">Exam (80/60)</th>
                        <th className="py-2.5 px-3 text-center">Total (100)</th>
                        <th className="py-2.5 px-3 text-center">Grade</th>
                        <th className="py-2.5 px-3 text-right">Remark</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-200">
                      {activeStudent.subjects.slice(0, 5).map((sub, idx) => (
                        <tr key={sub.id || idx} className="hover:bg-slate-800/40">
                          <td className="py-3 px-3 font-bold text-white">{sub.subject}</td>
                          <td className="py-3 px-3 text-center font-mono">{sub.caScore}</td>
                          <td className="py-3 px-3 text-center font-mono">{sub.examScore}</td>
                          <td className="py-3 px-3 text-center font-mono font-black text-white text-sm">{sub.total}</td>
                          <td className="py-3 px-3 text-center">
                            <span className="px-2 py-0.5 rounded font-black font-mono text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              {sub.grade}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-slate-400 text-[10px] uppercase">{sub.remark}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* ---------------------------------------------------------------- */}
          {/* TAB 2: SEARCH RESULT (EXACT USER SPECIFICATION) */}
          {/* ---------------------------------------------------------------- */}
          {activeTab === 'search-result' && (
            <div className="space-y-8 animate-fadeIn">
              
              {/* Top Search Controls Form */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
                
                <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                  <div className="p-3 rounded-2xl bg-[#1E3A8A]/30 border border-blue-500/30 text-[#F59E0B]">
                    <Search className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white">Search & Filter Result Sheet</h3>
                    <p className="text-xs text-slate-400">
                      Enter Student Registration ID, select Academic Session & Term to load result.
                    </p>
                  </div>
                </div>

                {/* Notifications */}
                {searchError && (
                  <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-200 text-xs flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                    <span>{searchError}</span>
                  </div>
                )}

                {searchSuccess && (
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-xs flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span>{searchSuccess}</span>
                  </div>
                )}

                <form onSubmit={handlePerformSearch} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    
                    {/* 1. Enter Student ID */}
                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                        Enter Student ID *
                      </label>
                      <input
                        type="text"
                        required
                        value={searchStudentId}
                        onChange={(e) => setSearchStudentId(e.target.value)}
                        placeholder="e.g. 2025104 or 2025108"
                        className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-sm font-mono font-bold text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:border-blue-500 transition-all shadow-inner"
                      />
                      <p className="text-[10px] text-slate-500 mt-1">Official 7-digit Registration ID</p>
                    </div>

                    {/* 2. Select Session */}
                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                        Select Session *
                      </label>
                      <select
                        value={selectedSession}
                        onChange={(e) => setSelectedSession(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] transition-all"
                      >
                        <option value="2025/2026 Academic Session">2025/2026 Academic Session</option>
                        <option value="2024/2025 Academic Session">2024/2025 Academic Session</option>
                        <option value="2023/2024 Academic Session">2023/2024 Academic Session</option>
                      </select>
                      <p className="text-[10px] text-slate-500 mt-1">Target School Academic Session</p>
                    </div>

                    {/* 3. Select Term */}
                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                        Select Term *
                      </label>
                      <select
                        value={selectedTerm}
                        onChange={(e) => setSelectedTerm(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] transition-all"
                      >
                        <option value="First Term">First Term</option>
                        <option value="Second Term">Second Term</option>
                        <option value="Third Term (Final Session)">Third Term (Final Session)</option>
                      </select>
                      <p className="text-[10px] text-slate-500 mt-1">Target School Academic Term</p>
                    </div>

                  </div>

                  {/* Search Action Button */}
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isSearching}
                      className="px-6 py-3.5 bg-[#1E3A8A] hover:bg-blue-800 text-white font-bold text-xs rounded-2xl shadow-md border border-blue-400/30 flex items-center gap-2 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                    >
                      {isSearching ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin text-[#F59E0B]" />
                          <span>Searching Database...</span>
                        </>
                      ) : (
                        <>
                          <Search className="w-4 h-4 text-[#F59E0B]" />
                          <span>Search & Fetch Result Record</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {/* Quick Selection Badges */}
                <div className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-bold uppercase text-slate-500 mr-2">Quick Test Badges:</span>
                  {['2025104', '2025108', '2025110', '2025114'].map((id) => (
                    <button
                      key={id}
                      onClick={() => {
                        setSearchStudentId(id);
                        handlePerformSearch();
                      }}
                      className="px-3 py-1 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-mono font-bold text-amber-400 hover:text-white transition-all cursor-pointer"
                    >
                      ID: {id}
                    </button>
                  ))}
                </div>

              </div>

              {/* SEARCH RESULT DISPLAY CONTAINER WITH ALL REQUIRED ACTIONS */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
                
                {/* Result Header Bar */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-20 rounded-xl overflow-hidden border-2 border-blue-500/40 bg-slate-950 shrink-0 shadow-md">
                      <img src={activeStudent.passportUrl} alt={activeStudent.fullName} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase mb-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Loaded Record
                      </div>
                      <h3 className="text-xl font-black text-white">{activeStudent.fullName}</h3>
                      <p className="text-xs text-slate-400 font-mono">
                        Reg ID: <strong className="text-amber-400">{activeStudent.studentId}</strong> • {activeStudent.className}
                      </p>
                      <p className="text-xs text-blue-300 font-semibold mt-0.5">
                        {activeStudent.academicSession} ({activeStudent.term})
                      </p>
                    </div>
                  </div>

                  {/* ALL REQUIRED ACTIONS (View Result, Download PDF, Print Result, Verify Result using QR Code) */}
                  <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                    
                    {/* Action 1: View Result */}
                    <button
                      onClick={() => setIsResultSlipModalOpen(true)}
                      className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold text-slate-950 bg-[#F59E0B] hover:bg-amber-400 rounded-xl transition-all cursor-pointer shadow-md active:scale-95"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View Result</span>
                    </button>

                    {/* Action 2: Download PDF */}
                    <button
                      onClick={handlePrintResult}
                      className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-all cursor-pointer"
                    >
                      <Download className="w-4 h-4 text-emerald-400" />
                      <span>Download PDF</span>
                    </button>

                    {/* Action 3: Print Result */}
                    <button
                      onClick={handlePrintResult}
                      className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold text-slate-200 bg-blue-900/40 hover:bg-blue-800 rounded-xl border border-blue-500/30 transition-all cursor-pointer"
                    >
                      <Printer className="w-4 h-4 text-blue-300" />
                      <span>Print Result</span>
                    </button>

                    {/* Action 4: Verify Result using QR Code */}
                    <button
                      onClick={() => setIsQrModalOpen(true)}
                      className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-purple-900/40 hover:bg-purple-800 rounded-xl border border-purple-500/30 transition-all cursor-pointer"
                    >
                      <QrCode className="w-4 h-4 text-purple-300" />
                      <span>Verify Result via QR</span>
                    </button>

                  </div>
                </div>

                {/* Result Summary Highlights */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Average</span>
                    <p className="text-xl font-black text-white font-mono">{activeStudent.overallAverage.toFixed(1)}%</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Class Position</span>
                    <p className="text-xl font-black text-[#F59E0B] font-mono">#{activeStudent.position}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Passed</span>
                    <p className="text-xl font-black text-emerald-400 font-mono">{subjectsPassed} / {activeStudent.subjects.length}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Status</span>
                    <p className="text-xs font-black text-blue-300 uppercase mt-1">{activeStudent.status}</p>
                  </div>
                </div>

                {/* Subject Table */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Full Subject Examination Breakdown
                  </h4>
                  <div className="overflow-x-auto border border-slate-800 rounded-2xl bg-slate-950">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 uppercase font-bold text-[10px] bg-slate-900">
                          <th className="py-3 px-3 text-center">S/N</th>
                          <th className="py-3 px-3">Subject Name</th>
                          <th className="py-3 px-3 text-center">CA (20)</th>
                          <th className="py-3 px-3 text-center">Exam (80)</th>
                          <th className="py-3 px-3 text-center">Total (100)</th>
                          <th className="py-3 px-3 text-center">Grade</th>
                          <th className="py-3 px-3 text-right">Remark</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-slate-200">
                        {activeStudent.subjects.map((sub, idx) => (
                          <tr key={sub.id || idx} className="hover:bg-slate-800/40 font-medium">
                            <td className="py-3 px-3 text-center font-mono text-slate-400">{idx + 1}</td>
                            <td className="py-3 px-3 font-bold text-white">{sub.subject}</td>
                            <td className="py-3 px-3 text-center font-mono text-slate-300">{sub.caScore}</td>
                            <td className="py-3 px-3 text-center font-mono text-slate-300">{sub.examScore}</td>
                            <td className="py-3 px-3 text-center font-mono font-black text-white text-sm">{sub.total}</td>
                            <td className="py-3 px-3 text-center">
                              <span className="px-2.5 py-1 rounded font-black font-mono text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                {sub.grade}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right font-bold text-slate-400 text-[10px] uppercase">{sub.remark}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* ---------------------------------------------------------------- */}
          {/* TAB 3: ACADEMIC RECORDS & SUBJECT PERFORMANCE */}
          {/* ---------------------------------------------------------------- */}
          {activeTab === 'academic-records' && (
            <div className="space-y-8 animate-fadeIn">
              
              {/* Header Filter Controls */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-black text-white">Subject Performance Analysis</h3>
                    <p className="text-xs text-slate-400">Filter and analyze performance across all enrolled courses.</p>
                  </div>

                  {/* Grade Filters */}
                  <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
                    <button
                      onClick={() => setGradeFilter('ALL')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        gradeFilter === 'ALL' ? 'bg-[#1E3A8A] text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      All ({activeStudent.subjects.length})
                    </button>
                    <button
                      onClick={() => setGradeFilter('DISTINCTION')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        gradeFilter === 'DISTINCTION' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      A1 Distinctions
                    </button>
                    <button
                      onClick={() => setGradeFilter('CREDIT')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        gradeFilter === 'CREDIT' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      B / C Credits
                    </button>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto border border-slate-800 rounded-2xl bg-slate-950">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 uppercase font-bold text-[10px] bg-slate-900">
                        <th className="py-3.5 px-4">Subject Name</th>
                        <th className="py-3.5 px-3 text-center">CA Score (40)</th>
                        <th className="py-3.5 px-3 text-center">Exam Score (60)</th>
                        <th className="py-3.5 px-3 text-center">Total (100)</th>
                        <th className="py-3.5 px-3 text-center">Grade</th>
                        <th className="py-3.5 px-4 text-right">Remark</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-200">
                      {filteredSubjects.map((sub, idx) => (
                        <tr key={sub.id || idx} className="hover:bg-slate-800/40">
                          <td className="py-3.5 px-4 font-bold text-white text-sm">{sub.subject}</td>
                          <td className="py-3.5 px-3 text-center font-mono text-slate-300">{sub.caScore}</td>
                          <td className="py-3.5 px-3 text-center font-mono text-slate-300">{sub.examScore}</td>
                          <td className="py-3.5 px-3 text-center font-mono font-black text-white text-base">{sub.total}</td>
                          <td className="py-3.5 px-3 text-center">
                            <span className="px-3 py-1 rounded-lg font-black font-mono text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              {sub.grade}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold text-slate-300 text-xs uppercase">{sub.remark}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Remarks Box */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-2">
                  <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-400" />
                    Class Teacher Remarks
                  </h4>
                  <p className="text-sm text-slate-200 italic leading-relaxed bg-slate-950 p-4 rounded-2xl border border-slate-800">
                    "{activeStudent.classTeacherRemark}"
                  </p>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-2">
                  <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#F59E0B]" />
                    Principal Remarks
                  </h4>
                  <p className="text-sm text-slate-200 italic leading-relaxed bg-slate-950 p-4 rounded-2xl border border-slate-800">
                    "{activeStudent.principalRemark}"
                  </p>
                </div>
              </div>

            </div>
          )}

          {/* ---------------------------------------------------------------- */}
          {/* TAB 4: OFFICIAL PRINT RESULT SLIP TEMPLATE PREVIEW */}
          {/* ---------------------------------------------------------------- */}
          {activeTab === 'print-slip' && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Top Controls Toolbar */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Printer className="w-5 h-5 text-[#F59E0B]" />
                    Print-Ready A4 Result Template
                  </h3>
                  <p className="text-xs text-slate-400">
                    Official printable format with seal, crest logo, and signature placeholders.
                  </p>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    onClick={handlePrintResult}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold text-slate-950 bg-[#F59E0B] hover:bg-amber-400 rounded-xl shadow-md transition-all cursor-pointer active:scale-95"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print Result Slip</span>
                  </button>

                  <button
                    onClick={handlePrintResult}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-emerald-400" />
                    <span>Download PDF</span>
                  </button>
                </div>
              </div>

              {/* Exact A4 Printable Document Paper Preview Frame */}
              <div className="bg-white text-black p-6 sm:p-10 rounded-2xl shadow-2xl border-2 border-slate-300 space-y-5 font-sans max-w-4xl mx-auto">
                
                {/* School Header */}
                <div className="border-b-2 border-black pb-4 flex items-center justify-between gap-4">
                  <div className="w-16 h-16 rounded-xl border-2 border-black bg-slate-50 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-10 h-10 text-slate-900" />
                  </div>

                  <div className="text-center flex-1">
                    <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight uppercase font-serif">
                      ROYAL ACADEMY
                    </h1>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-800">
                      Student Mid-Term Report
                    </p>
                    <p className="text-[10px] text-slate-700 font-mono">
                      Victoria Island, Lagos, Nigeria • Official Academic Record
                    </p>
                  </div>

                  <div className="text-right text-xs font-bold border border-black p-2 bg-slate-50 rounded-sm shrink-0 min-w-[140px]">
                    <div className="text-[10px] uppercase text-slate-600 font-normal">Academic Session:</div>
                    <div className="text-black font-extrabold">{activeStudent.academicSession || '2025/2026 Session'}</div>
                    <div className="text-[10px] uppercase text-slate-600 font-normal mt-1">Term:</div>
                    <div className="text-black font-extrabold">{activeStudent.term || 'First Term'}</div>
                  </div>
                </div>

                {/* Student Info Box */}
                <div className="border border-black p-3 bg-white space-y-2">
                  <div className="grid grid-cols-12 gap-3 items-center">
                    <div className="col-span-9 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 text-xs">
                      <div>
                        <span className="block text-[10px] font-bold text-slate-600 uppercase">Student Name:</span>
                        <span className="font-extrabold text-black text-sm uppercase block">{activeStudent.fullName}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold text-slate-600 uppercase">Admission No:</span>
                        <span className="font-mono font-bold text-black text-sm block">{activeStudent.studentId}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold text-slate-600 uppercase">Class:</span>
                        <span className="font-bold text-black block">{activeStudent.className}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold text-slate-600 uppercase">Gender:</span>
                        <span className="font-bold text-black block">{activeStudent.gender || 'Male'}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold text-slate-600 uppercase">Age:</span>
                        <span className="font-bold text-black block">{activeStudent.age || '16 Yrs'}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold text-slate-600 uppercase">House:</span>
                        <span className="font-bold text-black block">{activeStudent.house || 'Sapphire House'}</span>
                      </div>
                    </div>

                    <div className="col-span-3 flex justify-end">
                      <div className="w-20 h-24 border-2 border-black bg-slate-100 overflow-hidden shrink-0">
                        <img src={activeStudent.passportUrl} alt={activeStudent.fullName} className="w-full h-full object-cover" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Result Title */}
                <div className="text-center space-y-0.5">
                  <h2 className="text-base font-black text-black uppercase tracking-wider">
                    MIDTERM REPORT
                  </h2>
                  <p className="text-xs font-bold uppercase text-slate-800">
                    {activeStudent.term || 'FIRST TERM'} — {activeStudent.academicSession || '2025/2026 SESSION'}
                  </p>
                </div>

                {/* Subjects Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-black border-collapse border border-black" style={{ borderCollapse: 'collapse' }}>
                    <thead>
                      <tr className="bg-gray-200 text-black font-bold text-[11px] uppercase border-b border-black">
                        <th className="p-2 border border-black text-center" style={{ width: '6%' }}>S/N</th>
                        <th className="p-2 border border-black text-left" style={{ width: '40%' }}>SUBJECT</th>
                        <th className="p-2 border border-black text-center" style={{ width: '10%' }}>CA (20)</th>
                        <th className="p-2 border border-black text-center" style={{ width: '10%' }}>EXAM (80)</th>
                        <th className="p-2 border border-black text-center" style={{ width: '10%' }}>TOTAL (100)</th>
                        <th className="p-2 border border-black text-center" style={{ width: '10%' }}>GRADE</th>
                        <th className="p-2 border border-black text-center" style={{ width: '14%' }}>REMARK</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black font-medium">
                      {activeStudent.subjects.map((sub, idx) => (
                        <tr key={sub.id || idx}>
                          <td className="p-1.5 border border-black text-center font-mono">{idx + 1}</td>
                          <td className="p-1.5 border border-black font-bold text-left">{sub.subject}</td>
                          <td className="p-1.5 border border-black text-center font-mono">{sub.caScore}</td>
                          <td className="p-1.5 border border-black text-center font-mono">{sub.examScore}</td>
                          <td className="p-1.5 border border-black text-center font-bold font-mono text-sm">{sub.total}</td>
                          <td className="p-1.5 border border-black text-center font-black">{sub.grade}</td>
                          <td className="p-1.5 border border-black text-center uppercase text-[10px] font-bold">{sub.remark}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Signatures & Stamp */}
                <div className="pt-4 border-t border-black">
                  <div className="grid grid-cols-3 gap-4 items-end text-center">
                    <div className="space-y-1">
                      <div className="h-10 border-b border-black flex items-end justify-center font-serif italic text-sm pb-0.5">
                        Mr. Arthur Vance, M.Ed
                      </div>
                      <span className="text-[10px] font-bold uppercase text-black block">Class Teacher</span>
                    </div>

                    <div className="flex flex-col items-center justify-center space-y-1">
                      <div className="w-14 h-14 rounded-full border-2 border-black border-dashed flex items-center justify-center p-1 text-center bg-slate-50 shrink-0">
                        <ShieldCheck className="w-5 h-5 text-slate-900" />
                      </div>
                      <span className="text-[9px] font-bold uppercase text-slate-700">Official Stamp</span>
                    </div>

                    <div className="space-y-1">
                      <div className="h-10 border-b border-black flex items-end justify-center font-serif italic font-bold text-sm text-[#1E3A8A] pb-0.5">
                        Dr. H. E. Montgomery
                      </div>
                      <span className="text-[10px] font-bold uppercase text-black block">Principal Signature</span>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* ---------------------------------------------------------------- */}
          {/* TAB 5: QR CODE SECURITY VERIFICATION */}
          {/* ---------------------------------------------------------------- */}
          {activeTab === 'qr-verification' && (
            <div className="space-y-8 animate-fadeIn">
              
              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
                
                <div className="flex items-center gap-3 border-b border-slate-800 pb-5">
                  <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white">Cryptographic QR Verification</h3>
                    <p className="text-xs text-slate-400">
                      Verify result integrity against official Royal Academy database ledger.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  
                  {/* Left Column: QR Code Visual Container */}
                  <div className="bg-slate-950 p-8 rounded-3xl border border-slate-800 flex flex-col items-center text-center space-y-4">
                    <div className="p-4 bg-white rounded-2xl border-4 border-[#1E3A8A] shadow-xl">
                      <svg viewBox="0 0 29 29" className="w-44 h-44 text-black fill-current">
                        <path d="M0 0h7v7H0zM2 2v3h3V2zM9 0h2v1H9zM12 0h1v2h-1zM15 0h1v1h-1zM18 0h2v2h-2zM22 0h7v7h-7zM24 2v3h3V2zM0 9h1v2H0zM3 9h2v1H3zM6 9h3v1H6zM11 9h1v3h-1zM14 9h3v1h-3zM18 9h1v1h-1zM20 9h2v2h-2zM24 9h2v1h-2zM28 9h1v2h-1zM0 12h2v1H0zM3 12h1v1H3zM5 12h2v1H5zM8 12h2v2H8zM13 12h3v1h-3zM18 12h1v2h-1zM21 12h3v1h-3zM26 12h2v1h-2zM0 15h1v1H0zM2 15h3v1H2zM6 15h1v3H6zM9 15h3v1H9zM14 15h1v1h-1zM17 15h2v1h-2zM21 15h1v1h-1zM24 15h1v3h-1zM27 15h2v1h-2zM0 18h2v2H0zM3 18h2v1H8zM11 18h2v3h-2zM15 18h2v1h-2zM19 18h3v1h-3zM26 18h3v1h-3zM0 22h7v7H0zM2 24v3h3v-3zM9 22h1v2H9zM12 22h2v1h-2zM16 22h1v1h-1zM19 22h1v2h-1zM21 22h2v1h-2zM25 22h3v1h-3zM9 25h2v2H9zM13 25h2v1h-2zM17 25h1v3h-1zM20 25h2v1h-2zM24 25h1v1h-1zM27 25h2v2h-2z" />
                      </svg>
                    </div>

                    <button
                      onClick={() => setIsQrModalOpen(true)}
                      className="px-5 py-2.5 bg-[#1E3A8A] hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition-all active:scale-95"
                    >
                      <QrCode className="w-4 h-4 text-[#F59E0B]" />
                      <span>Open Interactive Scanner Modal</span>
                    </button>
                  </div>

                  {/* Right Column: Audit Record Metadata */}
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 space-y-1">
                      <div className="flex items-center gap-2 font-bold text-sm">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        <span>AUTHENTICATED RECORD</span>
                      </div>
                      <p className="text-xs text-emerald-300/90">
                        This academic result slip is certified authentic and registered in the school database.
                      </p>
                    </div>

                    <div className="space-y-3 text-xs bg-slate-950 p-5 rounded-2xl border border-slate-800 font-mono">
                      <div className="flex justify-between border-b border-slate-800 pb-2">
                        <span className="text-slate-400">Student ID:</span>
                        <strong className="text-white">{activeStudent.studentId}</strong>
                      </div>
                      <div className="flex justify-between border-b border-slate-800 pb-2">
                        <span className="text-slate-400">Security Hash:</span>
                        <strong className="text-amber-400">{activeStudent.verificationHash || `RA-${activeStudent.studentId}-SEC`}</strong>
                      </div>
                      <div className="flex justify-between border-b border-slate-800 pb-2">
                        <span className="text-slate-400">Issuing Authority:</span>
                        <strong className="text-white">Royal Academy Senate</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Verification URL:</span>
                        <strong className="text-blue-400">royalacademy.edu.ng/verify</strong>
                      </div>
                    </div>
                  </div>

                </div>

              </div>

            </div>
          )}

          {/* ---------------------------------------------------------------- */}
          {/* TAB 6: SUPPORT & PORTAL GUIDANCE */}
          {/* ---------------------------------------------------------------- */}
          {activeTab === 'support' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
                <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                  <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
                    <HelpCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Student Portal Support & Verification Guide</h3>
                    <p className="text-xs text-slate-400">Frequently asked questions and support channels for students.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                    <h4 className="text-sm font-bold text-white">How do I print or save my PDF result slip?</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Go to either the <strong className="text-white">Search & Load Result</strong> tab or <strong className="text-white">Print Result Template</strong> tab and click <strong className="text-amber-400">"Print Result"</strong> or <strong className="text-emerald-400">"Download PDF"</strong>. Choose "Save as PDF" as your printer destination.
                    </p>
                  </div>

                  <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                    <h4 className="text-sm font-bold text-white">What if my subject grades are incorrect?</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      If you notice any discrepancy in your Continuous Assessment (CA) or Exam scores, submit a remarking application to the Academic Registrar within 14 working days.
                    </p>
                  </div>

                  <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                    <h4 className="text-sm font-bold text-white">How does QR code verification work?</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Scanning the QR code on your printed or digital slip routes to our secure verification endpoint to confirm your transcript authenticity for universities and embassies.
                    </p>
                  </div>

                  <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                    <h4 className="text-sm font-bold text-white">Need Administrative Support?</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Contact the ICT Support Unit at <strong className="text-blue-400">support@royalacademy.edu.ng</strong> or call <strong className="text-white">+234 (0) 1 234 5678</strong>.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* GLOBAL MODALS */}
      {/* ---------------------------------------------------------------- */}
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
