import React, { useState, useEffect } from 'react';
import { StudentResult } from '../types';
import { ResultSlipModal } from './ResultSlipModal';
import { SchoolLogo } from './SchoolLogo';
import { MOCK_STUDENTS } from '../data/mockData';
import { api } from '../services/api';
import { filterStudentSubjectsByAdmin } from '../utils/subjectUtils';
import { calculateDynamicStudentPosition } from '../utils/studentRanking';
import {
  LayoutDashboard,
  Search,
  BookOpen,
  Printer,
  Download,
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
  const [allStudentsList, setAllStudentsList] = useState<any[]>([]);
  const [brandingState, setBrandingState] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;
    api.getStudents().then(res => {
      if (isMounted && res && Array.isArray(res) && res.length > 0) {
        setAllStudentsList(res);
      }
    }).catch(() => {});
    api.getBranding().then(b => {
      if (isMounted && b) {
        setBrandingState(b);
      }
    }).catch(() => {});
    return () => { isMounted = false; };
  }, []);

  // Helper for grade badge colors (F9 is prominently colored red)
  const getGradeColorClass = (grade: string) => {
    if (!grade) return 'bg-slate-100 text-slate-700 border-slate-200';
    if (grade === 'F9' || grade.startsWith('F')) {
      return 'bg-red-100 text-red-700 border-red-300 font-extrabold';
    }
    if (grade.startsWith('A')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (grade.startsWith('B')) {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    }
    if (grade.startsWith('C')) {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }
    if (grade.startsWith('D') || grade.startsWith('E')) {
      return 'bg-orange-50 text-orange-700 border-orange-200';
    }
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  // Search & Filter state
  const [searchStudentId, setSearchStudentId] = useState(initialStudent.studentId);
  const [selectedSession, setSelectedSession] = useState(initialStudent.academicSession || '2025/2026 Academic Session');
  const [selectedTerm, setSelectedTerm] = useState(initialStudent.term || 'First Term');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchSuccess, setSearchSuccess] = useState<string | null>(null);

  // Modal Control States
  const [isResultSlipModalOpen, setIsResultSlipModalOpen] = useState(false);
  const [adminSubjects, setAdminSubjects] = useState<any[]>([]);

  useEffect(() => {
    api.getSubjects().then((subs) => {
      if (Array.isArray(subs)) {
        setAdminSubjects(subs);
      }
    }).catch(() => {});
  }, []);

  // Perform search / term-filter handler (locked strictly to logged-in student)
  const handlePerformSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSearchError(null);
    setSearchSuccess(null);

    const cleanId = initialStudent.studentId;
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
        setSearchSuccess(`Updated view for ${selectedSession} - ${selectedTerm}.`);
      } else {
        const mockMatch: StudentResult = {
          ...initialStudent,
          academicSession: selectedSession,
          term: selectedTerm,
        };
        setActiveStudent(mockMatch);
        setSearchSuccess(`Updated view for ${selectedSession} - ${selectedTerm}.`);
      }
    } catch {
      setIsSearching(false);
      const mockMatch: StudentResult = {
        ...initialStudent,
        academicSession: selectedSession,
        term: selectedTerm,
      };
      setActiveStudent(mockMatch);
      setSearchSuccess(`Updated view for ${selectedSession} - ${selectedTerm}.`);
    }
  };

  const handlePrintResult = () => {
    setIsResultSlipModalOpen(true);
    setTimeout(() => {
      window.print();
    }, 250);
  };

  const studentSubjects = filterStudentSubjectsByAdmin(activeStudent?.subjects, adminSubjects);

  const subjectsPassed = studentSubjects.filter(s => (s.total || 0) >= 40 && s.grade !== 'F9').length;
  const subjectsFailed = studentSubjects.filter(s => (s.total || 0) < 40 || s.grade === 'F9').length;
  const totalScoreCalculated = studentSubjects.reduce((acc, s) => acc + (s.total || 0), 0);
  
  const averageScoreCalculated = studentSubjects.length > 0 
    ? Number((totalScoreCalculated / studentSubjects.length).toFixed(1)) 
    : (studentSubjects.length === 0 ? 0 : (activeStudent?.overallAverage || (activeStudent as any)?.averageScore || 0));

  const gpaCalculated = (studentSubjects.length > 0 && activeStudent?.gpa && activeStudent.gpa > 0) 
    ? activeStudent.gpa 
    : (averageScoreCalculated > 0 ? Number((averageScoreCalculated / 25).toFixed(2)) : 0);

  const dynamicRank = calculateDynamicStudentPosition(activeStudent, allStudentsList);
  const positionVal = dynamicRank.ordinalPosition;
  const totalInClassVal = dynamicRank.totalInClass;

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

            {/* 2. Filter Session & Term */}
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
                <span>Filter Session & Term</span>
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
                {studentSubjects.length}
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

            {/* 5. Help & Support */}
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
              {activeTab === 'subjects' && <BookOpen className="w-[#1E3A8A] w-5 h-5 text-[#1E3A8A]" />}
              {activeTab === 'print-slip' && <Printer className="w-5 h-5 text-[#1E3A8A]" />}
              {activeTab === 'help' && <HelpCircle className="w-5 h-5 text-[#1E3A8A]" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 capitalize font-['Plus_Jakarta_Sans']">
                {activeTab === 'overview' && 'Student Dashboard'}
                {activeTab === 'check-result' && 'Session & Term Filter'}
                {activeTab === 'subjects' && 'Subject Performance Analysis'}
                {activeTab === 'print-slip' && 'Official Print Result Slip'}
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                    {positionVal} <span className="text-xs font-normal text-slate-400">/ {totalInClassVal}</span>
                  </div>
                  <p className="text-[10px] text-blue-700 font-semibold">Class Rank</p>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-1 shadow-xs">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Passed Subjects</span>
                  <div className="text-2xl font-black text-emerald-600 font-mono">
                    {subjectsPassed} <span className="text-xs text-slate-400 font-normal">/ {studentSubjects.length}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium">Failed: {subjectsFailed}</p>
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
                              <span className={`px-2 py-0.5 rounded font-black font-mono text-xs ${getGradeColorClass(sub.grade)}`}>
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
                    "{brandingState?.principalRemark !== undefined && brandingState?.principalRemark !== null
                      ? (brandingState.principalRemark.trim() || 'N/A (No principal comment set)')
                      : (activeStudent.principalRemark?.trim() || 'N/A (No principal comment set)')}"
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
                    <h3 className="text-base font-bold text-slate-900 font-['Plus_Jakarta_Sans']">Academic Term & Session Selector</h3>
                    <p className="text-xs text-slate-500">Filter your personal report card records by session and term</p>
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
                        Student Reg ID (Locked)
                      </label>
                      <div className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-700 flex items-center justify-between">
                        <span>{initialStudent.studentId}</span>
                        <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-md font-sans font-semibold">🔒 Locked</span>
                      </div>
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
                      <span>Apply Term Filter</span>
                    </button>
                  </div>
                </form>
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
                              <span className={`px-2 py-0.5 rounded font-black font-mono text-xs ${getGradeColorClass(sub.grade)}`}>
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
                    {studentSubjects.length} Subjects Total
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
                              <span className={`px-2.5 py-1 rounded font-black font-mono text-xs ${getGradeColorClass(sub.grade)}`}>
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
              <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 font-['Plus_Jakarta_Sans']">
                    <Printer className="w-5 h-5 text-[#F59E0B]" />
                    Official A4 Student Result Slip
                  </h3>
                  <p className="text-xs text-slate-600">
                    Official terminal academic report for <strong className="text-slate-900">{activeStudent.fullName}</strong> ({activeStudent.studentId}).
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setIsResultSlipModalOpen(true)}
                    className="px-5 py-2.5 bg-[#1E3A8A] hover:bg-blue-900 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4 text-[#F59E0B]" />
                    <span>View Official Result Slip</span>
                  </button>
                  <button
                    onClick={handlePrintResult}
                    className="px-4 py-2.5 bg-[#F59E0B] hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print Slip</span>
                  </button>
                </div>
              </div>

              {/* Action Banner Card */}
              <div className="bg-linear-to-r from-[#1E3A8A] to-blue-900 text-white rounded-2xl p-6 shadow-md border border-blue-800 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-white/10 rounded-xl border border-white/20">
                    <ShieldCheck className="w-6 h-6 text-[#F59E0B]" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold">Official Document Generation Ready</h4>
                    <p className="text-xs text-blue-200">
                      Generate and print your official computer-generated result slip with verified digital authentication, grading scale breakdown, and principal stamp.
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex flex-wrap gap-3">
                  <button
                    onClick={() => setIsResultSlipModalOpen(true)}
                    className="px-5 py-2.5 bg-[#F59E0B] hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-xs cursor-pointer inline-flex items-center gap-2 transition-all"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Open Official Printable Result Slip</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ---------------------------------------------------------------- */}
          {/* TAB 5: HELP & SUPPORT */}
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
        onVerifyQR={() => {}}
      />

    </div>
  );
};
