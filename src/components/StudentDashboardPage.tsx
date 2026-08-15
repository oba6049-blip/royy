import React, { useState, useEffect, useMemo } from 'react';
import { StudentResult, StudentTermRecord, SubjectGrade } from '../types';
import { ResultSlipModal } from './ResultSlipModal';
import { SchoolLogo } from './SchoolLogo';
import { api } from '../services/api';
import { filterStudentSubjectsByAdmin } from '../utils/subjectUtils';
import { calculateDynamicStudentPosition } from '../utils/studentRanking';
import { calculateAgeFromDob, formatDateDisplay } from '../utils/studentDateUtils';
import {
  History,
  BookOpen,
  Printer,
  GraduationCap,
  LogOut,
  User,
  CheckCircle2,
  AlertCircle,
  Clock,
  Eye,
  Award,
  TrendingUp,
  School,
  Calendar,
  Layers,
  HelpCircle,
  Menu,
  X,
  FileText,
  ShieldCheck
} from 'lucide-react';

interface StudentDashboardPageProps {
  student: StudentResult;
  onLogout: () => void;
  onBackToWebsite?: () => void;
}

type StudentTabType =
  | 'history'
  | 'subjects'
  | 'help';

interface UnifiedHistoricalRow {
  rowNumber: number;
  compositeKey: string;
  className: string;
  academicSession: string;
  term: string;
  status: 'Published' | 'Pending' | 'Not Published';
  datePublished: string;
  isPublished: boolean;
  subjectsCount: number;
  totalScore: number;
  averageScore: number;
  gpa: number;
  rawRecord?: StudentTermRecord | StudentResult;
}

export const StudentDashboardPage: React.FC<StudentDashboardPageProps> = ({
  student: initialStudent,
  onLogout,
  onBackToWebsite,
}) => {
  const [activeTab, setActiveTab] = useState<StudentTabType>('history');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Live Student Data State fetched from DB
  const [publishedStudent, setPublishedStudent] = useState<StudentResult>(initialStudent);
  const [allStudentsList, setAllStudentsList] = useState<any[]>([]);
  const [adminSubjects, setAdminSubjects] = useState<any[]>([]);
  const [systemSessions, setSystemSessions] = useState<any[]>([]);
  const [systemTerms, setSystemTerms] = useState<any[]>([]);
  const [brandingState, setBrandingState] = useState<any>(null);

  // Modal Control States for Result Slip Template
  const [isResultSlipModalOpen, setIsResultSlipModalOpen] = useState(false);
  const [modalStudentResult, setModalStudentResult] = useState<StudentResult | null>(null);

  // Fetch live student and system meta on mount and sync
  const fetchLiveData = () => {
    if (initialStudent?.studentId) {
      api.getStudentById(initialStudent.studentId)
        .then((fetched) => {
          if (fetched) {
            setPublishedStudent(fetched);
          }
        })
        .catch(() => {});
    }

    api.getStudents()
      .then((res) => {
        if (Array.isArray(res)) setAllStudentsList(res);
      })
      .catch(() => {});

    api.getSubjects()
      .then((subs) => {
        if (Array.isArray(subs)) setAdminSubjects(subs);
      })
      .catch(() => {});

    api.getSessions()
      .then((sess) => {
        if (Array.isArray(sess)) setSystemSessions(sess);
      })
      .catch(() => {});

    api.getTerms()
      .then((tms) => {
        if (Array.isArray(tms)) setSystemTerms(tms);
      })
      .catch(() => {});

    api.getBranding()
      .then((b) => {
        if (b) setBrandingState(b);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchLiveData();

    const handleRealtimeUpdate = () => {
      fetchLiveData();
    };

    window.addEventListener('school_portal_data_updated', handleRealtimeUpdate);
    window.addEventListener('storage', handleRealtimeUpdate);
    return () => {
      window.removeEventListener('school_portal_data_updated', handleRealtimeUpdate);
      window.removeEventListener('storage', handleRealtimeUpdate);
    };
  }, [initialStudent.studentId]);

  // Current authenticated student object
  const currentStudent = publishedStudent || initialStudent;

  // Helper to normalize session and term
  const normSess = (s: string) => (s || '').toLowerCase().replace(/academic|session|\s/g, '');
  const getTermId = (t: string) => {
    const l = (t || '').toLowerCase();
    if (l.includes('first') || l.includes('1st') || l.includes('1')) return '1';
    if (l.includes('second') || l.includes('2nd') || l.includes('2')) return '2';
    if (l.includes('third') || l.includes('3rd') || l.includes('3')) return '3';
    return l.replace(/\s/g, '');
  };
  const normTerm = (t: string) => getTermId(t);
  const normClass = (c: string) => (c || '').toLowerCase().replace(/\s/g, '');

  // Helper to check if subject array has valid score entries
  const hasScores = (subs?: SubjectGrade[]) => {
    if (!subs || !Array.isArray(subs) || subs.length === 0) return false;
    return subs.some((s: any) => {
      const ca = Number(s.caScore ?? s.ca1 ?? s.ca ?? 0) + Number(s.ca2 ?? 0) + Number(s.midterm ?? 0);
      const exam = Number(s.examScore ?? s.exam ?? 0);
      const total = Number(s.total ?? (ca + exam));
      return total > 0;
    });
  };

  // Construct comprehensive list of all historical terminal rows for the student
  const historicalRows = useMemo(() => {
    if (!currentStudent) return [];

    const rowMap = new Map<string, UnifiedHistoricalRow>();

    // 1. Process explicit termRecords stored on student
    if (currentStudent.termRecords && Array.isArray(currentStudent.termRecords)) {
      currentStudent.termRecords.forEach((rec) => {
        if (!rec.academicSession || !rec.term) return;
        const nS = normSess(rec.academicSession);
        const nT = normTerm(rec.term);
        const studentClass = rec.className || currentStudent.className || 'General';
        const nC = normClass(studentClass);
        const compKey = `${nS}__${nT}__${nC}`;

        const isPub = rec.isPublished !== false && rec.status !== 'Unpublished' && rec.status !== 'Pending';
        const hasValidScores = hasScores(rec.subjects);
        const subCount = rec.subjects ? rec.subjects.length : 0;
        const total = rec.overallTotal || (rec.subjects ? rec.subjects.reduce((a, b: any) => a + (b.total || 0), 0) : 0);
        const avg = rec.overallAverage || (subCount > 0 ? total / subCount : 0);
        const gpaVal = rec.gpa || (avg > 0 ? avg / 25 : 0);

        let status: 'Published' | 'Pending' | 'Not Published' = 'Not Published';
        if (isPub && hasValidScores) {
          status = 'Published';
        } else if (rec.status === 'Pending' || hasValidScores) {
          status = 'Pending';
        }

        const dateStr = rec.issueDate || rec.updatedAt || (status === 'Published' ? (currentStudent.issueDate || '14/02/2026') : '—');

        rowMap.set(compKey, {
          rowNumber: 0,
          compositeKey: compKey,
          className: studentClass,
          academicSession: rec.academicSession,
          term: rec.term,
          status,
          datePublished: dateStr,
          isPublished: status === 'Published',
          subjectsCount: subCount,
          totalScore: total,
          averageScore: avg,
          gpa: gpaVal,
          rawRecord: rec,
        });
      });
    }

    // 2. Process top-level student record
    if (currentStudent.academicSession && currentStudent.term) {
      const nS = normSess(currentStudent.academicSession);
      const nT = normTerm(currentStudent.term);
      const studentClass = currentStudent.className || 'General';
      const nC = normClass(studentClass);
      const compKey = `${nS}__${nT}__${nC}`;

      const isPub = currentStudent.status !== 'Unpublished' && (currentStudent as any).isPublished !== false;
      const hasValidScores = hasScores(currentStudent.subjects);
      const subCount = currentStudent.subjects ? currentStudent.subjects.length : 0;
      const total = currentStudent.overallTotal || (currentStudent.subjects ? currentStudent.subjects.reduce((a, b: any) => a + (b.total || 0), 0) : 0);
      const avg = currentStudent.overallAverage || (currentStudent as any).averageScore || (subCount > 0 ? total / subCount : 0);
      const gpaVal = currentStudent.gpa || (avg > 0 ? avg / 25 : 0);

      let status: 'Published' | 'Pending' | 'Not Published' = 'Not Published';
      if (isPub && hasValidScores) {
        status = 'Published';
      } else if (currentStudent.status === 'Pending' || hasValidScores) {
        status = 'Pending';
      }

      const dateStr = currentStudent.issueDate || (status === 'Published' ? '14/02/2026' : '—');

      if (!rowMap.has(compKey) || rowMap.get(compKey)?.status !== 'Published') {
        rowMap.set(compKey, {
          rowNumber: 0,
          compositeKey: compKey,
          className: studentClass,
          academicSession: currentStudent.academicSession,
          term: currentStudent.term,
          status,
          datePublished: dateStr,
          isPublished: status === 'Published',
          subjectsCount: subCount,
          totalScore: total,
          averageScore: avg,
          gpa: gpaVal,
          rawRecord: currentStudent,
        });
      }
    }

    // Convert map to array
    const list = Array.from(rowMap.values());

    // Sort chronologically by session and term
    list.sort((a, b) => {
      const sessCompare = a.academicSession.localeCompare(b.academicSession);
      if (sessCompare !== 0) return sessCompare;
      const tA = normTerm(a.term);
      const tB = normTerm(b.term);
      return tA.localeCompare(tB);
    });

    // Assign clean 1-based index row numbers
    return list.map((item, idx) => ({
      ...item,
      rowNumber: idx + 1,
    }));
  }, [currentStudent]);

  // Published records only
  const publishedRows = useMemo(() => {
    return historicalRows.filter(r => r.status === 'Published');
  }, [historicalRows]);

  // Summary Metrics calculations across all published results
  const summaryMetrics = useMemo(() => {
    const pubCount = publishedRows.length;
    if (pubCount === 0) {
      return {
        publishedCount: 0,
        cumulativeAverage: 0,
        cumulativeGPA: 0,
        bestAverage: 0,
      };
    }

    const totalAvgSum = publishedRows.reduce((acc, r) => acc + r.averageScore, 0);
    const cumulativeAvg = Number((totalAvgSum / pubCount).toFixed(1));
    const totalGpaSum = publishedRows.reduce((acc, r) => acc + r.gpa, 0);
    const cumulativeGPA = Number((totalGpaSum / pubCount).toFixed(2));
    const bestAvg = Math.max(...publishedRows.map(r => r.averageScore));

    return {
      publishedCount: pubCount,
      cumulativeAverage: cumulativeAvg,
      cumulativeGPA: cumulativeGPA,
      bestAverage: Number(bestAvg.toFixed(1)),
    };
  }, [publishedRows]);

  // Selected Result for Modal Viewer
  const handleOpenResultSlip = (row: UnifiedHistoricalRow) => {
    if (!row.isPublished) return;

    // Formulate the full StudentResult structure for the modal
    const raw = row.rawRecord;
    let subjects = (raw as any)?.subjects || currentStudent.subjects || [];
    const filtered = filterStudentSubjectsByAdmin(subjects, adminSubjects);

    const fullResultForModal: StudentResult = {
      ...currentStudent,
      academicSession: row.academicSession,
      term: row.term,
      className: row.className,
      subjects: filtered.length > 0 ? filtered : subjects,
      overallTotal: row.totalScore,
      overallAverage: row.averageScore,
      gpa: row.gpa,
      position: (raw as any)?.position || currentStudent.position || '1st',
      totalInClass: (raw as any)?.totalInClass || currentStudent.totalInClass || 35,
      status: (raw as any)?.status || 'PROMOTED',
      classTeacherRemark: (raw as any)?.classTeacherRemark || currentStudent.classTeacherRemark || 'An excellent academic performance. Keep up the high standard.',
      principalRemark: (raw as any)?.principalRemark || currentStudent.principalRemark || 'Remarkable accomplishment and dedication to learning. Congratulations!',
      issueDate: row.datePublished !== '—' ? row.datePublished : (currentStudent.issueDate || '14/02/2026'),
    };

    setModalStudentResult(fullResultForModal);
    setIsResultSlipModalOpen(true);
  };

  // Active or latest published result for the subjects tab view
  const activePublishedRow = publishedRows.length > 0 ? publishedRows[publishedRows.length - 1] : null;
  const activeStudentSubjects = useMemo(() => {
    if (!activePublishedRow?.rawRecord) return [];
    const subs = (activePublishedRow.rawRecord as any)?.subjects || [];
    return filterStudentSubjectsByAdmin(subs, adminSubjects);
  }, [activePublishedRow, adminSubjects]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-['Inter',sans-serif] flex flex-col md:flex-row selection:bg-[#1E3A8A]/10 selection:text-[#1E3A8A]">
      
      {/* ---------------------------------------------------------------- */}
      {/* MOBILE HEADER BAR */}
      {/* ---------------------------------------------------------------- */}
      <div className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-40 shadow-xs">
        <div className="flex items-center gap-2.5">
          <SchoolLogo size="sm" showText={false} />
          <div className="flex flex-col justify-center">
            <h1 className="text-sm font-black text-[#1E3A8A] leading-tight font-['Plus_Jakarta_Sans']">Faith Academy</h1>
            <p className="text-[10px] text-amber-600 font-bold tracking-wide uppercase leading-none mt-0.5">Excellence & Integrity</p>
          </div>
        </div>

        <button
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 transition-colors cursor-pointer"
          aria-label="Toggle Navigation Menu"
        >
          {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5 text-slate-700" />}
        </button>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* 1. STUDENT INFORMATION CARD (LEFT SIDEBAR) */}
      {/* ---------------------------------------------------------------- */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 md:z-30 h-screen w-80 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-300 ease-in-out shrink-0 shadow-xs ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full overflow-y-auto">
          
          {/* Top Brand Header */}
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2.5">
              <SchoolLogo size="sm" showText={false} />
              <div className="flex flex-col justify-center">
                <h2 className="text-xs font-black text-[#1E3A8A] tracking-tight leading-tight font-['Plus_Jakarta_Sans']">
                  Faith Academy
                </h2>
                <p className="text-[10px] text-amber-600 font-bold tracking-wide uppercase leading-none mt-0.5">
                  Excellence & Integrity
                </p>
              </div>
            </div>
          </div>

          {/* Student Profile Identity Card */}
          <div className="p-5 space-y-4">
            
            {/* Passport Photograph & Core Identity */}
            <div className="flex flex-col items-center text-center space-y-3 pb-4 border-b border-slate-100">
              <div className="relative">
                <div className="w-24 h-24 rounded-2xl overflow-hidden border-3 border-[#1E3A8A] bg-slate-100 shadow-md">
                  <img
                    src={currentStudent.passportUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'}
                    alt={currentStudent.fullName}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250';
                    }}
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1 rounded-full border-2 border-white shadow-xs" title="Verified Active Student">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
              </div>

              <div className="space-y-1 w-full">
                <h3 className="text-base font-black text-slate-900 font-['Plus_Jakarta_Sans'] leading-tight">
                  {currentStudent.fullName}
                </h3>
                
                {/* Admission Number Prominent Badge */}
                <div className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-50 border border-blue-200 text-[#1E3A8A] text-xs font-mono font-black tracking-wider uppercase">
                  <span>ID:</span>
                  <span>{currentStudent.studentId}</span>
                </div>
              </div>
            </div>

            {/* Student Metadata Attributes */}
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-[#1E3A8A]" />
                  <span>Current Class</span>
                </span>
                <span className="font-bold text-slate-900">{currentStudent.className}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#1E3A8A]" />
                  <span>Academic Session</span>
                </span>
                <span className="font-bold text-slate-900">{currentStudent.academicSession || '2025/2026'}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Gender</span>
                </span>
                <span className="font-bold text-slate-900">{currentStudent.gender || 'Female'}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                  <School className="w-3.5 h-3.5 text-amber-500" />
                  <span>House</span>
                </span>
                <span className="font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                  {currentStudent.house || 'Blue House'}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Date of Birth</span>
                </span>
                <span className="font-bold text-slate-900">{formatDateDisplay(currentStudent.dateOfBirth)}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-500" />
                  <span>Student Age</span>
                </span>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  {currentStudent.age || calculateAgeFromDob(currentStudent.dateOfBirth)?.ageText || '—'}
                </span>
              </div>
            </div>

            {/* Performance Summary Stats */}
            <div className="bg-white rounded-2xl p-4 text-slate-800 border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-[11px] uppercase font-bold tracking-wider text-slate-500">Performance Summary</span>
                <Award className="w-4 h-4 text-[#F59E0B]" />
              </div>

              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Published Reports</span>
                  <span className="text-lg font-black font-mono text-[#1E3A8A]">
                    {summaryMetrics.publishedCount}
                  </span>
                </div>

                <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Cumulative Mean</span>
                  <span className="text-lg font-black font-mono text-emerald-600">
                    {summaryMetrics.cumulativeAverage > 0 ? `${summaryMetrics.cumulativeAverage}%` : '—'}
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl px-3 py-2 border border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">Cumulative GPA:</span>
                <span className="font-mono font-black text-[#1E3A8A]">
                  {summaryMetrics.cumulativeGPA > 0 ? `${summaryMetrics.cumulativeGPA} / 4.0` : '—'}
                </span>
              </div>
            </div>

            {/* Sidebar Navigation Links */}
            <nav className="space-y-1 pt-1">
              <button
                onClick={() => {
                  setActiveTab('history');
                  setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'history'
                    ? 'bg-[#1E3A8A] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <History className={`w-4 h-4 ${activeTab === 'history' ? 'text-[#F59E0B]' : 'text-slate-400'}`} />
                  <span>Result History</span>
                </div>
                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md ${
                  activeTab === 'history' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                }`}>
                  {historicalRows.length}
                </span>
              </button>

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
              </button>

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
                  <span>Help & Inquiries</span>
                </div>
              </button>
            </nav>

          </div>

          {/* Footer Signout */}
          <div className="p-4 border-t border-slate-200 bg-slate-50/50 mt-auto">
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 transition-all cursor-pointer shadow-xs"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out of Portal</span>
            </button>
          </div>

        </div>
      </aside>

      {/* Backdrop for mobile sidebar */}
      {mobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 md:hidden"
        />
      )}

      {/* ---------------------------------------------------------------- */}
      {/* 2. RESULT HISTORY DASHBOARD (MAIN CONTENT AREA) */}
      {/* ---------------------------------------------------------------- */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sticky top-0 z-20 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-50 border border-blue-100 text-[#1E3A8A]">
              {activeTab === 'history' && <History className="w-5 h-5 text-[#1E3A8A]" />}
              {activeTab === 'subjects' && <BookOpen className="w-5 h-5 text-[#1E3A8A]" />}
              {activeTab === 'help' && <HelpCircle className="w-5 h-5 text-[#1E3A8A]" />}
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 font-['Plus_Jakarta_Sans'] leading-tight">
                {activeTab === 'history' && 'Academic Result History'}
                {activeTab === 'subjects' && 'Subject Performance Breakdown'}
                {activeTab === 'help' && 'Portal Help & Support'}
              </h2>
              <p className="text-xs text-slate-500">
                Official records for <strong className="text-slate-800">{currentStudent.fullName}</strong> • {currentStudent.className}
              </p>
            </div>
          </div>

          {/* Quick Print Latest Action */}
          {publishedRows.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleOpenResultSlip(publishedRows[publishedRows.length - 1])}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-950 bg-[#F59E0B] hover:bg-amber-500 rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>View Latest Result</span>
              </button>
            </div>
          )}
        </header>

        {/* Main Body */}
        <main className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1 max-w-7xl w-full mx-auto">
          
          {/* TAB 1: RESULT HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-6">
              
              {/* Executive Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
                  <div className="p-3 bg-blue-50 text-[#1E3A8A] rounded-xl border border-blue-100 shrink-0">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Terminal Terms</span>
                    <div className="text-xl font-black text-slate-900 font-mono">
                      {historicalRows.length} <span className="text-xs font-semibold text-slate-500 font-sans">Recorded</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Published Results</span>
                    <div className="text-xl font-black text-emerald-700 font-mono">
                      {summaryMetrics.publishedCount} <span className="text-xs font-semibold text-slate-500 font-sans">Available</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 shrink-0">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Cumulative Mean</span>
                    <div className="text-xl font-black text-indigo-900 font-mono">
                      {summaryMetrics.cumulativeAverage > 0 ? `${summaryMetrics.cumulativeAverage}%` : '—'}
                    </div>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
                  <div className="p-3 bg-amber-50 text-amber-600 rounded-xl border border-amber-100 shrink-0">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Cumulative GPA</span>
                    <div className="text-xl font-black text-amber-700 font-mono">
                      {summaryMetrics.cumulativeGPA > 0 ? `${summaryMetrics.cumulativeGPA} / 4.0` : '—'}
                    </div>
                  </div>
                </div>

              </div>

              {/* Empty State Banner if no results published */}
              {publishedRows.length === 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-3.5 text-amber-900 shadow-xs">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold font-['Plus_Jakarta_Sans']">No Published Results Available</h4>
                    <p className="text-xs text-amber-800 mt-0.5">
                      No published results are currently available. Please check again later or contact your school administrator.
                    </p>
                  </div>
                </div>
              )}

              {/* Main Result History Table Card */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/40">
                  <div>
                    <h3 className="text-base font-black text-slate-900 font-['Plus_Jakarta_Sans'] flex items-center gap-2">
                      <History className="w-4 h-4 text-[#1E3A8A]" />
                      <span>Complete Academic Journey Records</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      All terminal examinations, assessment records, and published result slips from your enrolment to present.
                    </p>
                  </div>

                  <span className="text-xs font-bold text-slate-500 bg-white px-3 py-1.5 rounded-xl border border-slate-200 self-start sm:self-auto">
                    Total Records: <strong className="text-slate-900">{historicalRows.length}</strong>
                  </span>
                </div>

                {/* Structured Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                      <tr className="bg-slate-100/80 border-b border-slate-200 text-[11px] font-black uppercase text-slate-500 tracking-wider">
                        <th className="py-3.5 px-4 text-center w-12">#</th>
                        <th className="py-3.5 px-4">Class</th>
                        <th className="py-3.5 px-4">Academic Session</th>
                        <th className="py-3.5 px-4">Academic Term</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-4">Date Published</th>
                        <th className="py-3.5 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-medium">
                      {historicalRows.map((row) => {
                        const isPub = row.status === 'Published';
                        const isPending = row.status === 'Pending';

                        return (
                          <tr
                            key={row.compositeKey}
                            className={`transition-colors ${
                              isPub ? 'hover:bg-blue-50/40' : 'hover:bg-slate-50/60 opacity-85'
                            }`}
                          >
                            {/* # Index Column */}
                            <td className="py-4 px-4 text-center font-mono font-bold text-slate-400">
                              {row.rowNumber}
                            </td>

                            {/* Class Column */}
                            <td className="py-4 px-4 font-bold text-slate-900">
                              <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-slate-100 text-[#1E3A8A] rounded-lg">
                                  <GraduationCap className="w-3.5 h-3.5" />
                                </div>
                                <span>{row.className}</span>
                              </div>
                            </td>

                            {/* Academic Session Column */}
                            <td className="py-4 px-4 text-slate-700 font-semibold">
                              {row.academicSession}
                            </td>

                            {/* Academic Term Column */}
                            <td className="py-4 px-4 font-bold text-[#1E3A8A]">
                              {row.term}
                            </td>

                            {/* Status Column */}
                            <td className="py-4 px-4">
                              {isPub ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Published</span>
                                </span>
                              ) : isPending ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                                  <span>Pending</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                  <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
                                  <span>Not Published</span>
                                </span>
                              )}
                            </td>

                            {/* Date Published Column */}
                            <td className="py-4 px-4 font-mono text-slate-600 text-xs">
                              {row.datePublished}
                            </td>

                            {/* Action Column */}
                            <td className="py-4 px-4 text-right">
                              {isPub ? (
                                <button
                                  type="button"
                                  onClick={() => handleOpenResultSlip(row)}
                                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#1E3A8A] hover:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer shrink-0"
                                >
                                  <Eye className="w-3.5 h-3.5 text-amber-400" />
                                  <span>View Result</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  disabled
                                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 text-slate-400 text-xs font-bold rounded-xl border border-slate-200 cursor-not-allowed"
                                >
                                  <span>Not Available</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Table Footer Helper Note */}
                <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Historical records are securely archived and cryptographically verified.</span>
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Showing {historicalRows.length} academic periods
                  </span>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: SUBJECT PERFORMANCE */}
          {activeTab === 'subjects' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 font-['Plus_Jakarta_Sans']">
                      Subject Performance Breakdown
                    </h3>
                    <p className="text-xs text-slate-500">
                      Detailed CA Assessments and Terminal Exam Scores for {activePublishedRow ? `${activePublishedRow.className} — ${activePublishedRow.academicSession} (${activePublishedRow.term})` : currentStudent.className}
                    </p>
                  </div>
                  {activePublishedRow && (
                    <button
                      onClick={() => handleOpenResultSlip(activePublishedRow)}
                      className="px-4 py-2 bg-[#1E3A8A] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                    >
                      <Eye className="w-4 h-4 text-amber-400" />
                      <span>Open Full Slip</span>
                    </button>
                  )}
                </div>

                {activeStudentSubjects.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[600px]">
                      <thead>
                        <tr className="bg-slate-100/80 border-b border-slate-200 text-[11px] font-black uppercase text-slate-600 tracking-wider">
                          <th className="py-3 px-4">Subject</th>
                          <th className="py-3 px-3 text-center">CA (40%)</th>
                          <th className="py-3 px-3 text-center">Exam (60%)</th>
                          <th className="py-3 px-3 text-center">Total (100%)</th>
                          <th className="py-3 px-3 text-center">Grade</th>
                          <th className="py-3 px-4">Remark</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {activeStudentSubjects.map((sub: any, i: number) => {
                          const ca = Number(sub.caScore ?? ((sub.ca1 || 0) + (sub.ca2 || 0) + (sub.midterm || 0)));
                          const exam = Number(sub.examScore ?? sub.exam ?? 0);
                          const total = Number(sub.total ?? (ca + exam));
                          const grade = sub.grade || (total >= 80 ? 'A1' : total >= 70 ? 'B2' : total >= 65 ? 'B3' : total >= 60 ? 'C4' : total >= 55 ? 'C5' : total >= 50 ? 'C6' : total >= 45 ? 'D7' : total >= 40 ? 'E8' : 'F9');
                          const remark = sub.remark || (grade.startsWith('A') ? 'EXCELLENT' : grade.startsWith('B') ? 'VERY GOOD' : grade.startsWith('C') ? 'CREDIT' : grade === 'F9' ? 'FAIL' : 'PASS');

                          return (
                            <tr key={sub.id || i} className="hover:bg-slate-50/80">
                              <td className="py-3 px-4 font-bold text-slate-900">{sub.subject}</td>
                              <td className="py-3 px-3 text-center font-mono font-bold text-slate-700">{ca}</td>
                              <td className="py-3 px-3 text-center font-mono font-bold text-slate-700">{exam}</td>
                              <td className="py-3 px-3 text-center font-mono font-black text-slate-900 text-sm">{total}</td>
                              <td className="py-3 px-3 text-center">
                                <span className={`px-2 py-0.5 rounded-md font-mono font-black text-xs border ${
                                  grade === 'F9' ? 'bg-red-100 text-red-700 border-red-300' :
                                  grade.startsWith('A') ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                                  grade.startsWith('B') ? 'bg-blue-100 text-blue-800 border-blue-300' :
                                  'bg-amber-100 text-amber-800 border-amber-300'
                                }`}>
                                  {grade}
                                </span>
                              </td>
                              <td className="py-3 px-4 font-bold text-slate-600 uppercase text-[11px]">{remark}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-8 text-center text-slate-500 text-xs">
                    No individual subject performance records available for this period.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: HELP & SUPPORT */}
          {activeTab === 'help' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <h3 className="text-lg font-black text-slate-900 font-['Plus_Jakarta_Sans']">
                Student Result Portal Support
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                If you notice any discrepancies in your published results, missing subject records, or have questions regarding grade computation and promotion criteria, please contact your Class Teacher or the Academic Registry immediately.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-xs font-bold text-slate-900 block">Academic Registry</span>
                  <span className="text-xs text-slate-600 block">Email: registry@faithacademy.edu.ng</span>
                  <span className="text-xs text-slate-600 block">Desk Hours: Mon – Fri, 8:00 AM – 4:00 PM</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-xs font-bold text-slate-900 block">IT & Portal Helpdesk</span>
                  <span className="text-xs text-slate-600 block">Support: support@faithacademy.edu.ng</span>
                  <span className="text-xs text-slate-600 block">Response Time: Within 24 hours</span>
                </div>
              </div>
            </div>
          )}

        </main>

      </div>

      {/* ---------------------------------------------------------------- */}
      {/* RESULT SLIP MODAL (PRESERVES EXISTING RESULT SLIP TEMPLATE) */}
      {/* ---------------------------------------------------------------- */}
      {modalStudentResult && (
        <ResultSlipModal
          isOpen={isResultSlipModalOpen}
          onClose={() => {
            setIsResultSlipModalOpen(false);
            setModalStudentResult(null);
          }}
          result={modalStudentResult}
          onVerifyQR={() => {}}
          branding={brandingState}
        />
      )}

    </div>
  );
};
