import React, { useState, useEffect } from 'react';
import { SchoolLogo } from './SchoolLogo';
import { ResultSlipModal } from './ResultSlipModal';
import { QRVerificationModal } from './QRVerificationModal';
import { ClassBroadsheetModal } from './ClassBroadsheetModal';
import { SchoolAnalyticsView } from './SchoolAnalyticsView';
import { AdminResultManagement } from './AdminResultManagement';
import { StudentPromotionModal } from './StudentPromotionModal';
import { api, DbStatus } from '../services/api';
import { calculateDynamicStudentPosition } from '../utils/studentRanking';
import { StudentResult, SchoolHeaderInfo, DEFAULT_SCHOOL_HEADER, StudentTermRecord, SubjectGrade } from '../types';

const upsertTermRecord = (
  existingRecords: StudentTermRecord[] = [],
  session: string,
  term: string,
  className: string,
  subjects: any[],
  overallTotal: number,
  overallAverage: number,
  gpa: number
): StudentTermRecord[] => {
  const normSess = (s: string) => (s || '').toLowerCase().replace(/academic|session|\s/g, '');
  const getTermId = (t: string) => {
    const l = (t || '').toLowerCase();
    if (l.includes('first') || l.includes('1st') || l.includes('1')) return '1';
    if (l.includes('second') || l.includes('2nd') || l.includes('2')) return '2';
    if (l.includes('third') || l.includes('3rd') || l.includes('3')) return '3';
    return l.replace(/\s/g, '');
  };
  const getNormClass = (c: string) => (c || '').toLowerCase().replace(/\s/g, '');
  const normTerm = getTermId(term);
  const normClass = getNormClass(className);

  const newRecord: StudentTermRecord = {
    academicSession: session,
    term,
    className,
    subjects: [...subjects],
    overallTotal,
    overallAverage,
    gpa,
    status: 'Published',
    isPublished: true,
    updatedAt: new Date().toISOString(),
  };

  const filtered = (existingRecords || []).filter(r => {
    const rS = normSess(r.academicSession);
    const rT = getTermId(r.term);
    const rC = getNormClass(r.className);

    if (rS === normSess(session) && rT === normTerm) {
      if (!normClass || !rC || rC === normClass) {
        return false; // remove duplicate/existing matching record
      }
    }
    return true;
  });

  return [...filtered, newRecord];
};
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  Clock,
  FilePlus,
  FileEdit,
  Trash2,
  Image as ImageIcon,
  Award,
  PenTool,
  FileSpreadsheet,
  BarChart3,
  LogIn,
  LogOut,
  Upload,
  Search,
  CheckCircle2,
  TrendingUp,
  ShieldCheck,
  ArrowLeft,
  Building2,
  Plus,
  Save,
  X,
  AlertCircle,
  Download,
  Printer,
  Filter,
  Check,
  ChevronRight,
  Eye,
  EyeOff,
  Settings,
  Sparkles,
  Database,
  Server,
  RefreshCw,
  Cloud,
  Sliders,
  MessageSquare,
  History
} from 'lucide-react';

interface AdminUser {
  name: string;
  email: string;
  role: string;
}

interface AdminDashboardPageProps {
  adminUser: AdminUser;
  onLogout: () => void;
  onBackToWebsite: () => void;
}

type TabType =
  | 'login'
  | 'dashboard'
  | 'students'
  | 'classes'
  | 'subjects'
  | 'sessions'
  | 'terms'
  | 'manage-results'
  | 'enter-results'
  | 'edit-results'
  | 'result-history'
  | 'delete-results'
  | 'upload-logo'
  | 'upload-stamp'
  | 'upload-signature'
  | 'reports'
  | 'analytics';

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({
  adminUser,
  onLogout,
  onBackToWebsite,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Quick Header Search State
  const [headerSearchQuery, setHeaderSearchQuery] = useState('');
  const [isHeaderSearchOpen, setIsHeaderSearchOpen] = useState(false);
  const [selectedResultStudentId, setSelectedResultStudentId] = useState<string | null>(null);
  const headerSearchRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleHeaderClickOutside = (e: MouseEvent) => {
      if (headerSearchRef.current && !headerSearchRef.current.contains(e.target as Node)) {
        setIsHeaderSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleHeaderClickOutside);
    return () => document.removeEventListener('mousedown', handleHeaderClickOutside);
  }, []);

  // Student State
  const [students, setStudents] = useState<any[]>([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('All');
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentResult | null>(null);
  const [isEditStudentOpen, setIsEditStudentOpen] = useState(false);
  const [promotingStudent, setPromotingStudent] = useState<StudentResult | null>(null);

  // Reports & Class Broadsheet State
  const [selectedReportClass, setSelectedReportClass] = useState('');
  const [reportSearchQuery, setReportSearchQuery] = useState('');
  const [selectedReportSession, setSelectedReportSession] = useState('2024/2025 Academic Session');
  const [selectedReportTerm, setSelectedReportTerm] = useState('Third Term');
  const [isClassBroadsheetOpen, setIsClassBroadsheetOpen] = useState(false);

  // School Header Settings State
  const [schoolHeader, setSchoolHeader] = useState<SchoolHeaderInfo>(() => {
    try {
      const saved = localStorage.getItem('royal_academy_school_header');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_SCHOOL_HEADER;
  });
  const [isEditSchoolHeaderOpen, setIsEditSchoolHeaderOpen] = useState(false);

  const [newStudent, setNewStudent] = useState({
    name: '',
    studentId: '',
    className: '',
    gender: 'Male' as 'Male' | 'Female',
    house: 'Blue House',
    age: '',
    passportUrl: '',
    parentContact: '',
    academicSession: '2024/2025 Academic Session',
    term: 'Third Term',
  });

  // Class State (Loaded dynamically from database with zero hardcoded mock items)
  const [classList, setClassList] = useState<Array<{
    id: string;
    name: string;
    arm?: string;
    teacher?: string;
    capacity?: number;
    enrolled?: number;
  }>>([]);
  const [newClassName, setNewClassName] = useState('');
  const [newClassTeacher, setNewClassTeacher] = useState('');

  // Subject State (Only displays subjects added by Admin)
  const [subjectList, setSubjectList] = useState<Array<{ code: string; name: string; category?: string; teacher?: string }>>([]);
  const [newSubCode, setNewSubCode] = useState('');
  const [newSubName, setNewSubName] = useState('');

  // Sessions & Terms State
  const [sessions, setSessions] = useState([
    { id: '1', year: '2023/2024', status: 'Completed', startDate: 'Sept 2023', endDate: 'July 2024' },
    { id: '2', year: '2024/2025', status: 'Active Current Session', startDate: 'Sept 2024', endDate: 'July 2025' },
    { id: '3', year: '2025/2026', status: 'Upcoming', startDate: 'Sept 2025', endDate: 'July 2026' },
  ]);
  const [terms, setTerms] = useState([
    { id: 't1', name: 'First Term', status: 'Concluded', resumption: 'Sept 9, 2024' },
    { id: 't2', name: 'Second Term', status: 'Concluded', resumption: 'Jan 8, 2025' },
    { id: 't3', name: 'Third Term', status: 'Active Current Term', resumption: 'Apr 28, 2025' },
  ]);

  // Derived Active Session and Active Term (Driven 100% by Admin Settings)
  const activeSessionObj = React.useMemo(() => {
    return sessions.find(s => s.status?.includes('Active')) || sessions.find(s => s.year === '2024/2025') || sessions[0] || { id: '2', year: '2024/2025', status: 'Active Current Session' };
  }, [sessions]);

  const activeSessionYear = React.useMemo(() => {
    const y = activeSessionObj.year || '2024/2025';
    return y.includes('Academic Session') ? y : `${y} Academic Session`;
  }, [activeSessionObj]);

  const activeTermObj = React.useMemo(() => {
    return terms.find(t => t.status?.includes('Active')) || terms[0] || { id: 't3', name: 'Third Term', status: 'Active Current Term' };
  }, [terms]);

  const activeTermName = React.useMemo(() => {
    return activeTermObj.name || 'Third Term';
  }, [activeTermObj]);

  const uniqueSessions = React.useMemo(() => {
    const normSess = (s: string) => (s || '').toLowerCase().replace(/academic|session|\s/g, '');
    const seen = new Set<string>();
    return sessions.filter((s) => {
      const n = normSess(s.year);
      if (!n || seen.has(n)) return false;
      seen.add(n);
      return true;
    });
  }, [sessions]);

  const uniqueTerms = React.useMemo(() => {
    const getTermId = (t: string) => {
      const l = (t || '').toLowerCase();
      if (l.includes('first') || l.includes('1st') || l.includes('1')) return '1';
      if (l.includes('second') || l.includes('2nd') || l.includes('2')) return '2';
      if (l.includes('third') || l.includes('3rd') || l.includes('3')) return '3';
      return l.replace(/\s/g, '');
    };
    const seen = new Set<string>();
    return terms.filter((t) => {
      const n = getTermId(t.name);
      if (!n || seen.has(n)) return false;
      seen.add(n);
      return true;
    });
  }, [terms]);

  // Dynamic Class and Subject Options derived from master state
  const allClassNames = React.useMemo(() => {
    return Array.from(
      new Set([
        ...classList.map(c => c.name).filter(Boolean),
        ...students.map(s => s.className).filter(Boolean),
      ])
    );
  }, [classList, students]);

  const allSubjectNames = React.useMemo(() => {
    return Array.from(
      new Set([
        ...subjectList.map(s => s.name).filter(Boolean),
      ])
    );
  }, [subjectList]);

  // Enter / Edit Results State
  const [scoreClass, setScoreClass] = useState('');
  const [scoreSubject, setScoreSubject] = useState('');
  const [scoreSession, setScoreSession] = useState('2024/2025 Academic Session');
  const [scoreTerm, setScoreTerm] = useState('Third Term');
  const [scoreEntries, setScoreEntries] = useState<Array<{
    id: string;
    name: string;
    ca1: number;
    ca2: number;
    midterm: number;
    exam: number;
  }>>([]);

  // Auto-sync score entries sheet when class, subject, or student records update
  useEffect(() => {
    const targetClass = scoreClass || (allClassNames.length > 0 ? allClassNames[0] : '');
    const targetSubject = scoreSubject || (allSubjectNames.length > 0 ? allSubjectNames[0] : '');
    if (!targetClass || !targetSubject) {
      setScoreEntries([]);
      return;
    }

    const targetClassClean = targetClass.trim().toLowerCase();
    const targetSubjectClean = targetSubject.trim().toLowerCase();

    const matchingStudents = students.filter(s => {
      if (!s.className) return false;
      const sClass = s.className.trim().toLowerCase();
      return sClass === targetClassClean || sClass.includes(targetClassClean) || targetClassClean.includes(sClass);
    });

    const entries = matchingStudents.map(st => {
      let existingSub: any = null;
      const termRec = (st.termRecords || []).find(
        (r: any) => r.academicSession === scoreSession && r.term === scoreTerm && (r.className === targetClass || !r.className)
      );

      if (termRec && termRec.subjects && Array.isArray(termRec.subjects)) {
        existingSub = termRec.subjects.find(
          (sub: any) => sub.subject?.trim().toLowerCase() === targetSubjectClean
        );
      } else if (
        st.className === targetClass &&
        st.academicSession === scoreSession &&
        st.term === scoreTerm
      ) {
        existingSub = (st.subjects || []).find(
          (sub: any) => sub.subject?.trim().toLowerCase() === targetSubjectClean
        );
      }

      let ca1 = existingSub?.ca1 !== undefined ? Number(existingSub.ca1) : 0;
      let ca2 = existingSub?.ca2 !== undefined ? Number(existingSub.ca2) : 0;
      let midterm = existingSub?.midterm !== undefined ? Number(existingSub.midterm) : 0;
      let exam = (existingSub?.examScore !== undefined ? Number(existingSub.examScore) : (existingSub?.exam !== undefined ? Number(existingSub.exam) : 0));

      if (existingSub && existingSub.caScore !== undefined && ca1 === 0 && ca2 === 0 && midterm === 0) {
        const totalCa = Number(existingSub.caScore) || 0;
        midterm = Math.min(20, Math.floor(totalCa * 0.5));
        ca1 = Math.min(10, Math.floor((totalCa - midterm) / 2));
        ca2 = Math.min(10, totalCa - midterm - ca1);
      }

      return {
        id: st.studentId,
        name: st.fullName || st.name || 'Student',
        ca1,
        ca2,
        midterm,
        exam,
      };
    });

    setScoreEntries(entries);
  }, [scoreClass, scoreSubject, scoreSession, scoreTerm, students, allClassNames, allSubjectNames]);

  const handleSaveScores = async () => {
    if (scoreEntries.length === 0) {
      triggerToast(`No students found in ${scoreClass} to save scores for.`);
      return;
    }

    let updatedCount = 0;
    const updatedStudentsList = [...students];

    for (const row of scoreEntries) {
      const studentIdx = updatedStudentsList.findIndex(s => s.studentId === row.id);
      if (studentIdx === -1) continue;

      const student = updatedStudentsList[studentIdx];
      const caScore = Math.min(40, (Number(row.ca1) || 0) + (Number(row.ca2) || 0) + (Number(row.midterm) || 0));
      const examScore = Math.min(60, Number(row.exam) || 0);
      const total = caScore + examScore;

      let grade = 'F9';
      let remark = 'FAIL';
      if (total >= 80) { grade = 'A1'; remark = 'EXCELLENT'; }
      else if (total >= 70) { grade = 'B2'; remark = 'VERY GOOD'; }
      else if (total >= 65) { grade = 'B3'; remark = 'GOOD'; }
      else if (total >= 60) { grade = 'C4'; remark = 'CREDIT'; }
      else if (total >= 55) { grade = 'C5'; remark = 'CREDIT'; }
      else if (total >= 50) { grade = 'C6'; remark = 'CREDIT'; }
      else if (total >= 45) { grade = 'D7'; remark = 'PASS'; }
      else if (total >= 40) { grade = 'E8'; remark = 'PASS'; }

      let existingTermRecords = [...(student.termRecords || [])];
      if (
        student.subjects &&
        student.subjects.length > 0 &&
        student.academicSession &&
        student.term &&
        student.className
      ) {
        existingTermRecords = upsertTermRecord(
          existingTermRecords,
          student.academicSession,
          student.term,
          student.className,
          student.subjects,
          student.overallTotal || 0,
          student.overallAverage || (student as any).averageScore || 0,
          student.gpa || 0
        );
      }

      const existingTermRec = existingTermRecords.find(
        r => r.academicSession === scoreSession && r.term === scoreTerm && (r.className === scoreClass || !r.className)
      );
      let currentSubjects: any[] = [];
      if (existingTermRec && existingTermRec.subjects && existingTermRec.subjects.length > 0) {
        currentSubjects = [...existingTermRec.subjects];
      } else if (student.className === scoreClass && student.academicSession === scoreSession && student.term === scoreTerm && student.isPublished !== false) {
        currentSubjects = [...(student.subjects || [])];
      }

      const targetSubClean = scoreSubject.trim().toLowerCase();
      const subIdx = currentSubjects.findIndex(
        (sub: any) => sub.subject?.trim().toLowerCase() === targetSubClean
      );

      const updatedSubObj = {
        id: subIdx !== -1 ? currentSubjects[subIdx].id : String(Date.now() + Math.random()),
        subject: scoreSubject,
        ca1: row.ca1,
        ca2: row.ca2,
        midterm: row.midterm,
        caScore,
        examScore,
        exam: examScore,
        total,
        grade,
        remark,
      };

      if (subIdx !== -1) {
        currentSubjects[subIdx] = { ...currentSubjects[subIdx], ...updatedSubObj };
      } else {
        currentSubjects.push(updatedSubObj);
      }

      const overallTotal = currentSubjects.reduce((acc: number, sub: any) => acc + (Number(sub.total) || 0), 0);
      const overallAverage = currentSubjects.length > 0 ? Number((overallTotal / currentSubjects.length).toFixed(1)) : 0;
      const gpa = Number((overallAverage / 25).toFixed(2));

      const updatedTermRecords = upsertTermRecord(
        existingTermRecords,
        scoreSession,
        scoreTerm,
        scoreClass,
        currentSubjects,
        overallTotal,
        overallAverage,
        gpa
      );

      const updatedStudentObj = {
        ...student,
        className: scoreClass,
        term: scoreTerm,
        academicSession: scoreSession,
        session: scoreSession,
        subjects: currentSubjects,
        overallTotal,
        overallAverage,
        averageScore: overallAverage,
        gpa,
        status: 'Published' as const,
        isPublished: true,
        termRecords: updatedTermRecords,
      };

      updatedStudentsList[studentIdx] = updatedStudentObj;
      await api.updateStudent(student.studentId, updatedStudentObj);
      updatedCount++;
    }

    setStudents(updatedStudentsList);
    triggerToast(`Scores for ${updatedCount} student(s) in ${scoreClass} (${scoreSubject}) for ${scoreTerm} (${scoreSession}) saved & published to portal!`);
  };

  // Edit Results by Reg ID State & Handlers
  const [regIdSearchInput, setRegIdSearchInput] = useState('');
  const [fetchedStudent, setFetchedStudent] = useState<StudentResult | null>(null);
  const [fetchedStudentSubjects, setFetchedStudentSubjects] = useState<Array<{
    id: string;
    subject: string;
    ca1: number;
    ca2: number;
    midterm: number;
    exam: number;
    total: number;
    grade: string;
    remark: string;
  }>>([]);
  const [newSubjectForFetched, setNewSubjectForFetched] = useState('');

  const historicalTermOptions = React.useMemo(() => {
    if (!fetchedStudent) return [];

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

    const opts: Array<{
      compositeKey: string;
      label: string;
      record?: StudentTermRecord;
      session: string;
      term: string;
      className: string;
    }> = [];

    const validSessKeys = new Set(sessions.map(s => normSess(s.year)));
    const validTermKeys = new Set(terms.map(t => normTerm(t.name)));
    const seenCompositeKeys = new Set<string>();

    const addOpt = (sess: string, trm: string, cls: string, rec?: StudentTermRecord) => {
      if (!sess || !trm) return;
      const nS = normSess(sess);
      const nT = normTerm(trm);
      const studentClass = cls || fetchedStudent.className || 'JSS 1 Gold';
      const nC = normClass(studentClass);

      // Only include terms and sessions that exist on the system when defined
      if (validSessKeys.size > 0 && !validSessKeys.has(nS)) return;
      if (validTermKeys.size > 0 && !validTermKeys.has(nT)) return;

      const compKey = `${nS}__${nT}__${nC}`;
      if (!seenCompositeKeys.has(compKey)) {
        seenCompositeKeys.add(compKey);
        opts.push({
          compositeKey: compKey,
          label: `${studentClass} — ${sess} (${trm})`,
          record: rec,
          session: sess,
          term: trm,
          className: studentClass,
        });
      }
    };

    if (fetchedStudent.termRecords && Array.isArray(fetchedStudent.termRecords)) {
      fetchedStudent.termRecords.forEach((r) => {
        if (r && r.academicSession && r.term) {
          addOpt(r.academicSession, r.term, r.className || fetchedStudent.className, r);
        }
      });
    }

    if (fetchedStudent.academicSession && fetchedStudent.term) {
      addOpt(fetchedStudent.academicSession, fetchedStudent.term, fetchedStudent.className);
    }

    return opts;
  }, [fetchedStudent, sessions, terms]);

  // Fetch Student by Reg ID
  const handleFetchStudentByRegId = (queryRegId?: string) => {
    const rawQuery = (queryRegId !== undefined ? queryRegId : regIdSearchInput).trim();
    if (!rawQuery) {
      triggerToast('Please enter a Registration ID or Student Name to fetch records.');
      return;
    }

    const queryClean = rawQuery.toLowerCase();
    const match = students.find(s => {
      const sId = (s.studentId || '').trim().toLowerCase();
      const sName = (s.fullName || s.name || '').trim().toLowerCase();
      return sId === queryClean || sId.includes(queryClean) || sName.includes(queryClean);
    });

    if (match) {
      setFetchedStudent(match);
      setRegIdSearchInput(match.studentId);

      // Normalize subjects for editing
      let rawStudentSubjects = match.subjects || [];
      if (subjectList.length > 0) {
        const validAdminSubjectNames = new Set(subjectList.map(s => s.name.trim().toLowerCase()));
        const adminAdded = rawStudentSubjects.filter(sub => validAdminSubjectNames.has((sub.subject || '').trim().toLowerCase()));
        if (adminAdded.length > 0) {
          rawStudentSubjects = adminAdded;
        }
      }

      const normSubs = rawStudentSubjects.map(sub => {
        let ca1 = sub.ca1 !== undefined ? Number(sub.ca1) : 0;
        let ca2 = sub.ca2 !== undefined ? Number(sub.ca2) : 0;
        let midterm = sub.midterm !== undefined ? Number(sub.midterm) : 0;
        let exam = sub.examScore !== undefined ? Number(sub.examScore) : (sub.exam !== undefined ? Number(sub.exam) : 0);

        if (sub.caScore !== undefined && ca1 === 0 && ca2 === 0 && midterm === 0) {
          const totalCa = Number(sub.caScore) || 0;
          midterm = Math.min(20, Math.floor(totalCa * 0.5));
          ca1 = Math.min(10, Math.floor((totalCa - midterm) / 2));
          ca2 = Math.min(10, totalCa - midterm - ca1);
        }

        const total = Math.min(100, ca1 + ca2 + midterm + exam);
        let grade = 'F9';
        let remark = 'FAIL';
        if (total >= 80) { grade = 'A1'; remark = 'EXCELLENT'; }
        else if (total >= 70) { grade = 'B2'; remark = 'VERY GOOD'; }
        else if (total >= 65) { grade = 'B3'; remark = 'GOOD'; }
        else if (total >= 60) { grade = 'C4'; remark = 'CREDIT'; }
        else if (total >= 55) { grade = 'C5'; remark = 'CREDIT'; }
        else if (total >= 50) { grade = 'C6'; remark = 'CREDIT'; }
        else if (total >= 45) { grade = 'D7'; remark = 'PASS'; }
        else if (total >= 40) { grade = 'E8'; remark = 'PASS'; }

        return {
          id: sub.id || String(Date.now() + Math.random()),
          subject: sub.subject || 'Subject',
          ca1,
          ca2,
          midterm,
          caScore: ca1 + ca2 + midterm,
          examScore: exam,
          exam,
          total,
          grade,
          remark,
        };
      });

      setFetchedStudentSubjects(normSubs);
      triggerToast(`Fetched student record: ${match.fullName || match.name} (${match.studentId})`);
    } else {
      setFetchedStudent(null);
      setFetchedStudentSubjects([]);
      triggerToast(`No student found matching "${rawQuery}". Check Reg ID and try again.`);
    }
  };

  // Helper to update a subject score in fetched student
  const updateFetchedSubjectScore = (
    idx: number,
    field: 'ca1' | 'ca2' | 'midterm' | 'exam',
    val: number
  ) => {
    setFetchedStudentSubjects(prev => {
      const updated = [...prev];
      const item = { ...updated[idx] };

      let ca1 = field === 'ca1' ? val : (item.ca1 || 0);
      let ca2 = field === 'ca2' ? val : (item.ca2 || 0);
      let midterm = field === 'midterm' ? val : (item.midterm || 0);
      let exam = field === 'exam' ? val : (item.exam !== undefined ? item.exam : (item.examScore || 0));

      ca1 = Math.min(10, Math.max(0, ca1));
      ca2 = Math.min(10, Math.max(0, ca2));
      midterm = Math.min(20, Math.max(0, midterm));
      exam = Math.min(60, Math.max(0, exam));

      const caScore = ca1 + ca2 + midterm;
      const examScore = exam;
      const total = Math.min(100, caScore + examScore);
      let grade = 'F9';
      let remark = 'FAIL';
      if (total >= 80) { grade = 'A1'; remark = 'EXCELLENT'; }
      else if (total >= 70) { grade = 'B2'; remark = 'VERY GOOD'; }
      else if (total >= 65) { grade = 'B3'; remark = 'GOOD'; }
      else if (total >= 60) { grade = 'C4'; remark = 'CREDIT'; }
      else if (total >= 55) { grade = 'C5'; remark = 'CREDIT'; }
      else if (total >= 50) { grade = 'C6'; remark = 'CREDIT'; }
      else if (total >= 45) { grade = 'D7'; remark = 'PASS'; }
      else if (total >= 40) { grade = 'E8'; remark = 'PASS'; }

      updated[idx] = {
        ...item,
        ca1,
        ca2,
        midterm,
        caScore,
        examScore: exam,
        exam,
        total,
        grade,
        remark,
      };
      return updated;
    });
  };

  // Save changes to fetched student
  const handleSaveFetchedStudent = async () => {
    if (!fetchedStudent) return;

    const updatedSubjects = fetchedStudentSubjects.map(sub => {
      const ca1 = Math.min(10, Math.max(0, Number(sub.ca1) || 0));
      const ca2 = Math.min(10, Math.max(0, Number(sub.ca2) || 0));
      const midterm = Math.min(20, Math.max(0, Number(sub.midterm) || 0));
      const exam = Math.min(60, Math.max(0, Number(sub.exam !== undefined ? sub.exam : sub.examScore) || 0));
      const caScore = ca1 + ca2 + midterm;
      const examScore = exam;
      const total = caScore + examScore;

      let grade = 'F9';
      let remark = 'FAIL';
      if (total >= 80) { grade = 'A1'; remark = 'EXCELLENT'; }
      else if (total >= 70) { grade = 'B2'; remark = 'VERY GOOD'; }
      else if (total >= 65) { grade = 'B3'; remark = 'GOOD'; }
      else if (total >= 60) { grade = 'C4'; remark = 'CREDIT'; }
      else if (total >= 55) { grade = 'C5'; remark = 'CREDIT'; }
      else if (total >= 50) { grade = 'C6'; remark = 'CREDIT'; }
      else if (total >= 45) { grade = 'D7'; remark = 'PASS'; }
      else if (total >= 40) { grade = 'E8'; remark = 'PASS'; }

      return {
        id: sub.id,
        subject: sub.subject,
        ca1,
        ca2,
        midterm,
        caScore,
        examScore,
        exam,
        total,
        grade,
        remark,
      };
    });

    const overallTotal = updatedSubjects.reduce((acc, s) => acc + s.total, 0);
    const overallAverage = updatedSubjects.length > 0 ? Number((overallTotal / updatedSubjects.length).toFixed(1)) : 0;
    const gpa = Number((overallAverage / 25).toFixed(2));

    const updatedTermRecords = upsertTermRecord(
      fetchedStudent.termRecords || [],
      fetchedStudent.academicSession || (fetchedStudent as any).session || '2025/2026 Academic Session',
      fetchedStudent.term || 'First Term',
      fetchedStudent.className || 'JSS 1 Gold',
      updatedSubjects,
      overallTotal,
      overallAverage,
      gpa
    );

    const updatedStudentObj: StudentResult = {
      ...fetchedStudent,
      subjects: updatedSubjects,
      overallTotal,
      overallAverage,
      averageScore: overallAverage,
      gpa,
      status: 'Published' as const,
      isPublished: true,
      termRecords: updatedTermRecords,
    };

    await api.updateStudent(fetchedStudent.studentId, updatedStudentObj);

    setStudents(prev => prev.map(s => s.studentId === fetchedStudent.studentId ? updatedStudentObj : s));
    setFetchedStudent(updatedStudentObj);
    setFetchedStudentSubjects(updatedSubjects);

    triggerToast(`Updated & published result for ${updatedStudentObj.fullName || (updatedStudentObj as any).name || 'student'} (${updatedStudentObj.studentId})!`);
  };

  // Add a new subject to fetched student
  const handleAddSubjectToFetched = () => {
    if (!newSubjectForFetched.trim()) return;
    const subName = newSubjectForFetched.trim();

    if (fetchedStudentSubjects.some(s => s.subject.toLowerCase() === subName.toLowerCase())) {
      triggerToast(`Subject "${subName}" is already listed for this student.`);
      return;
    }

    const newSubObj = {
      id: String(Date.now()),
      subject: subName,
      ca1: 0,
      ca2: 0,
      midterm: 0,
      exam: 0,
      total: 0,
      grade: 'F9',
      remark: 'FAIL',
    };

    setFetchedStudentSubjects(prev => [...prev, newSubObj]);
    setNewSubjectForFetched('');
    triggerToast(`Added ${subName} to ${fetchedStudent?.fullName || (fetchedStudent as any)?.name || 'student'}'s result list.`);
  };

  // Remove subject from fetched student
  const handleRemoveSubjectFromFetched = (subId: string) => {
    setFetchedStudentSubjects(prev => prev.filter(s => s.id !== subId));
    triggerToast('Subject removed from result sheet.');
  };

  // Result History Tab State & Handlers
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [historyStudent, setHistoryStudent] = useState<StudentResult | null>(null);

  const handleFetchStudentForHistory = async (queryRegId?: string) => {
    const rawQuery = (queryRegId !== undefined ? queryRegId : historySearchQuery).trim();
    if (!rawQuery) {
      triggerToast('Please enter a Registration ID or Student Name to view result history.');
      return;
    }
    const queryClean = rawQuery.toLowerCase();
    let match = students.find(s =>
      (s.studentId && s.studentId.toLowerCase() === queryClean) ||
      ((s.fullName || s.name || '').toLowerCase() === queryClean)
    );

    if (!match) {
      match = students.find(s =>
        (s.studentId && s.studentId.toLowerCase().includes(queryClean)) ||
        ((s.fullName || s.name || '').toLowerCase().includes(queryClean))
      );
    }

    if (match) {
      try {
        const liveRecord = await api.getStudentById(match.studentId);
        const recordToUse = liveRecord || match;
        setHistoryStudent(recordToUse);
        setHistorySearchQuery(match.studentId);
        triggerToast(`Loaded complete result history for ${recordToUse.fullName || recordToUse.name} (${recordToUse.studentId})`);
      } catch {
        setHistoryStudent(match);
        setHistorySearchQuery(match.studentId);
      }
    } else {
      setHistoryStudent(null);
      triggerToast(`No student record found matching "${rawQuery}".`);
    }
  };

  const handleViewHistoricalTermModal = (studentData: StudentResult, termRec: any) => {
    const subs = termRec.subjects || [];
    const total = termRec.overallTotal || subs.reduce((a: number, b: any) => a + (Number(b.total) || 0), 0);
    const avg = termRec.overallAverage || (subs.length > 0 ? Number((total / subs.length).toFixed(1)) : 0);
    const gpa = termRec.gpa || (avg > 0 ? Number((avg / 25).toFixed(2)) : 0);

    const fullResult: StudentResult = {
      ...studentData,
      academicSession: termRec.academicSession,
      term: termRec.term,
      className: termRec.className || studentData.className,
      subjects: subs,
      overallTotal: total,
      overallAverage: avg,
      gpa,
      position: termRec.position || '1st',
      totalInClass: termRec.totalInClass || 35,
      status: termRec.status || 'PROMOTED',
      classTeacherRemark: termRec.classTeacherRemark || studentData.classTeacherRemark || 'An excellent academic performance. Keep up the high standard.',
      principalRemark: termRec.principalRemark || globalPrincipalRemark || studentData.principalRemark || 'Remarkable accomplishment and dedication to learning. Congratulations!',
      issueDate: termRec.issueDate || studentData.issueDate || '14/02/2026',
    };

    setSelectedStudentResult(fullResult);
    setIsViewResultOpen(true);
  };

  const handleEditHistoricalTerm = (termRec: any) => {
    if (!historyStudent) return;
    setFetchedStudent(historyStudent);
    setRegIdSearchInput(historyStudent.studentId);
    handleFetchStudentByRegId(historyStudent.studentId);
    setActiveTab('edit-results');
  };

  // Group student's historical results by: Class -> Academic Session -> Academic Term
  const organizedHistoryByClass = React.useMemo(() => {
    if (!historyStudent) return [];

    const normSess = (s: string) => (s || '').toLowerCase().replace(/academic|session|\s/g, '');
    const getTermId = (t: string) => {
      const l = (t || '').toLowerCase();
      if (l.includes('first') || l.includes('1st') || l.includes('1')) return '1';
      if (l.includes('second') || l.includes('2nd') || l.includes('2')) return '2';
      if (l.includes('third') || l.includes('3rd') || l.includes('3')) return '3';
      return l.replace(/\s/g, '');
    };
    const normTerm = (t: string) => getTermId(t);

    const hasScores = (subs?: any[]) => {
      if (!subs || !Array.isArray(subs) || subs.length === 0) return false;
      return subs.some((s: any) => {
        const ca = Number(s.caScore ?? s.ca1 ?? s.ca ?? 0) + Number(s.ca2 ?? 0) + Number(s.midterm ?? 0);
        const exam = Number(s.examScore ?? s.exam ?? 0);
        const total = Number(s.total ?? (ca + exam));
        return total > 0;
      });
    };

    // Structure: Map<ClassName, Map<Session, Map<TermId, Entry>>>
    const classMap = new Map<string, Map<string, Map<string, any>>>();

    const addTermEntry = (className: string, session: string, term: string, rawRecord: any) => {
      if (!session || !term) return;
      const cName = className || historyStudent.className || 'General';
      if (!classMap.has(cName)) {
        classMap.set(cName, new Map());
      }
      const sessMap = classMap.get(cName)!;
      if (!sessMap.has(session)) {
        sessMap.set(session, new Map());
      }
      const termMap = sessMap.get(session)!;
      const nT = normTerm(term);
      if (!termMap.has(nT) || (rawRecord?.isPublished && !termMap.get(nT)?.record?.isPublished)) {
        termMap.set(nT, {
          term,
          session,
          className: cName,
          record: rawRecord,
        });
      }
    };

    if (historyStudent.termRecords && Array.isArray(historyStudent.termRecords)) {
      historyStudent.termRecords.forEach(rec => {
        addTermEntry(rec.className || historyStudent.className, rec.academicSession, rec.term, rec);
      });
    }

    if (historyStudent.academicSession && historyStudent.term) {
      addTermEntry(historyStudent.className, historyStudent.academicSession, historyStudent.term, historyStudent);
    }

    const resultList: Array<{
      className: string;
      sessions: Array<{
        session: string;
        terms: Array<{
          term: string;
          session: string;
          className: string;
          status: 'Published' | 'Pending' | 'Not Published';
          datePublished: string;
          isPublished: boolean;
          subjectsCount: number;
          totalScore: number;
          averageScore: number;
          gpa: number;
          rawRecord: any;
        }>;
      }>;
    }> = [];

    classMap.forEach((sessMap, className) => {
      const sessionList: any[] = [];
      sessMap.forEach((termMap, session) => {
        const termList: any[] = [];
        termMap.forEach((entry) => {
          const rec = entry.record;
          const subs = rec?.subjects || [];
          const isPub = rec?.isPublished !== false && rec?.status !== 'Unpublished' && rec?.status !== 'Pending';
          const hasValidScores = hasScores(subs);
          const subCount = subs.length;
          const total = rec?.overallTotal || subs.reduce((a: number, b: any) => a + (Number(b.total) || 0), 0);
          const avg = rec?.overallAverage || rec?.averageScore || (subCount > 0 ? total / subCount : 0);
          const gpaVal = rec?.gpa || (avg > 0 ? avg / 25 : 0);

          let status: 'Published' | 'Pending' | 'Not Published' = 'Not Published';
          if (isPub && hasValidScores) {
            status = 'Published';
          } else if (rec?.status === 'Pending' || hasValidScores) {
            status = 'Pending';
          }

          const dateStr = rec?.issueDate || rec?.updatedAt || (status === 'Published' ? (historyStudent.issueDate || '14/02/2026') : '—');

          termList.push({
            term: entry.term,
            session,
            className,
            status,
            datePublished: dateStr,
            isPublished: status === 'Published',
            subjectsCount: subCount,
            totalScore: total,
            averageScore: Number(avg.toFixed(1)),
            gpa: Number(gpaVal.toFixed(2)),
            rawRecord: rec,
          });
        });

        termList.sort((a, b) => normTerm(a.term).localeCompare(normTerm(b.term)));
        sessionList.push({ session, terms: termList });
      });

      sessionList.sort((a, b) => a.session.localeCompare(b.session));
      resultList.push({ className, sessions: sessionList });
    });

    return resultList;
  }, [historyStudent]);

  // Branding Uploads & Position States
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [stampPreview, setStampPreview] = useState<string | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const [isUploadingBranding, setIsUploadingBranding] = useState<string | null>(null);
  const [globalPrincipalRemark, setGlobalPrincipalRemark] = useState<string>(
    'Exemplary academic effort, commendable discipline, and steady progress across all subjects. Keep striving for excellence!'
  );
  const [isSavingPrincipalRemark, setIsSavingPrincipalRemark] = useState<boolean>(false);

  const handleDeleteGlobalPrincipalRemark = async () => {
    if (globalPrincipalRemark && !window.confirm('Are you sure you want to delete the Principal remark comment from all results?')) {
      return;
    }
    setIsSavingPrincipalRemark(true);
    try {
      const res = await api.savePrincipalRemark('');
      if (res.success) {
        setGlobalPrincipalRemark('');
        triggerToast('Principal remark comment deleted and removed from all results.');
        setStudents(prev => prev.map(st => ({ ...st, principalRemark: '' })));
      } else {
        triggerToast('Failed to delete principal remark.');
      }
    } catch {
      triggerToast('Error deleting principal remark.');
    } finally {
      setIsSavingPrincipalRemark(false);
    }
  };

  const handleSaveGlobalPrincipalRemark = async () => {
    if (!globalPrincipalRemark.trim()) {
      handleDeleteGlobalPrincipalRemark();
      return;
    }
    setIsSavingPrincipalRemark(true);
    try {
      const res = await api.savePrincipalRemark(globalPrincipalRemark.trim());
      if (res.success) {
        triggerToast('Principal remark saved and applied globally to all results!');
        setStudents(prev => prev.map(st => ({ ...st, principalRemark: globalPrincipalRemark.trim() })));
      } else {
        triggerToast('Failed to save principal remark.');
      }
    } catch {
      triggerToast('Error saving principal remark.');
    } finally {
      setIsSavingPrincipalRemark(false);
    }
  };

  const [brandingPositions, setBrandingPositions] = useState<{
    logo: { x: number; y: number; scale: number; rotate: number };
    stamp: { x: number; y: number; scale: number; rotate: number };
    signature: { x: number; y: number; scale: number; rotate: number };
  }>({
    logo: { x: 0, y: 0, scale: 1, rotate: 0 },
    stamp: { x: 0, y: 0, scale: 1, rotate: 0 },
    signature: { x: 0, y: 0, scale: 1, rotate: 0 },
  });

  const handleSavePositions = async () => {
    const res = await api.saveBrandingPositions(brandingPositions);
    if (res.success) {
      triggerToast('Branding layout positions saved permanently!');
    } else {
      triggerToast('Failed to save branding positions.');
    }
  };

  const handleBrandingFileUpload = async (type: 'logoUrl' | 'stampUrl' | 'signatureUrl', file: File) => {
    if (!file) return;
    setIsUploadingBranding(type);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        if (type === 'logoUrl') setLogoPreview(base64);
        if (type === 'stampUrl') setStampPreview(base64);
        if (type === 'signatureUrl') setSignaturePreview(base64);

        const res = await api.updateBranding(type, base64);
        if (res.success) {
          if (type === 'logoUrl' && res.url) setLogoPreview(res.url);
          if (type === 'stampUrl' && res.url) setStampPreview(res.url);
          if (type === 'signatureUrl' && res.url) setSignaturePreview(res.url);

          const typeLabel = type === 'logoUrl' ? 'School Logo' : type === 'stampUrl' ? 'School Stamp' : 'Principal Signature';
          const isCdn = res.url?.includes('res.cloudinary.com');
          triggerToast(`${typeLabel} saved successfully${isCdn ? ' to Cloudinary CDN & MongoDB' : '!'}`);
        } else {
          triggerToast(`Failed to save ${type} to backend.`);
        }
        setIsUploadingBranding(null);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setIsUploadingBranding(null);
      triggerToast('Error processing image file.');
    }
  };

  const [isUploadingStudentPhoto, setIsUploadingStudentPhoto] = useState<'new' | 'edit' | null>(null);

  const handleStudentPhotoUpload = async (file: File, target: 'new' | 'edit') => {
    if (!file) return;
    setIsUploadingStudentPhoto(target);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        if (target === 'new') {
          setNewStudent((prev) => ({ ...prev, passportUrl: base64 }));
        } else {
          setEditingStudent((prev) => prev ? { ...prev, passportUrl: base64 } : null);
        }

        const uploadedUrl = await api.uploadImage(base64, 'royal_academy/passports');
        if (uploadedUrl) {
          if (target === 'new') {
            setNewStudent((prev) => ({ ...prev, passportUrl: uploadedUrl }));
          } else {
            setEditingStudent((prev) => prev ? { ...prev, passportUrl: uploadedUrl } : null);
          }
          const isCdn = uploadedUrl.includes('res.cloudinary.com');
          triggerToast(`Student passport uploaded successfully${isCdn ? ' to Cloudinary CDN & MongoDB' : ''}!`);
        }
        setIsUploadingStudentPhoto(null);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setIsUploadingStudentPhoto(null);
      triggerToast('Failed to upload student photo.');
    }
  };

  // Security Delete Modal
  const [deleteCandidateId, setDeleteCandidateId] = useState<string | null>(null);
  const [deleteConfirmPassword, setDeleteConfirmPassword] = useState('');

  // Viewing Student Result Modal States
  const [selectedStudentResult, setSelectedStudentResult] = useState<StudentResult | null>(null);
  const [isViewResultOpen, setIsViewResultOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isLoadingStudentDetails, setIsLoadingStudentDetails] = useState(false);

  // Manage Classes Modal & State
  const [isAddClassOpen, setIsAddClassOpen] = useState(false);
  const [newClass, setNewClass] = useState({ name: '', arm: '', teacher: '', capacity: 35 });
  const [deleteClassCandidate, setDeleteClassCandidate] = useState<any | null>(null);
  const [viewClassStudents, setViewClassStudents] = useState<any | null>(null);

  // Manage Subjects Modal & State
  const [isAddSubjectOpen, setIsAddSubjectOpen] = useState(false);
  const [newSubject, setNewSubject] = useState({ code: '', name: '', category: 'General Core', teacher: '' });
  const [deleteSubjectCandidate, setDeleteSubjectCandidate] = useState<any | null>(null);

  // Manage Sessions State
  const [isAddSessionOpen, setIsAddSessionOpen] = useState(false);
  const [newSession, setNewSession] = useState({ year: '', startDate: '', endDate: '', status: 'Upcoming' });
  const [editSessionCandidate, setEditSessionCandidate] = useState<any | null>(null);
  const [deleteSessionCandidate, setDeleteSessionCandidate] = useState<any | null>(null);

  // Manage Terms State
  const [isAddTermOpen, setIsAddTermOpen] = useState(false);
  const [newTerm, setNewTerm] = useState({ name: '', resumption: '', status: 'Upcoming' });
  const [editTermCandidate, setEditTermCandidate] = useState<any | null>(null);
  const [deleteTermCandidate, setDeleteTermCandidate] = useState<any | null>(null);

  // Database Status
  const [dbStatus, setDbStatus] = useState<DbStatus | null>(null);

  // Session Handlers
  const handleAddSessionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSession.year) {
      triggerToast('Please specify the academic session year (e.g. 2026/2027).');
      return;
    }
    const sessionYear = newSession.year.includes('Academic Session') ? newSession.year : `${newSession.year} Academic Session`;
    const created = {
      id: String(Date.now()),
      year: newSession.year,
      startDate: newSession.startDate || 'September',
      endDate: newSession.endDate || 'July',
      status: newSession.status || 'Upcoming',
    };
    await api.addSession(created);
    setSessions([...sessions, created]);

    // Automatically initialize result records for all students for this new session
    const defaultSubs = subjectList.map((sub, idx) => ({
      id: `sub-init-${idx + 1}`,
      subject: sub.name,
      ca1: 0,
      ca2: 0,
      midterm: 0,
      caScore: 0,
      examScore: 0,
      total: 0,
      grade: 'F9',
      remark: 'UNPUBLISHED',
    }));

    const termsToInit = terms.length > 0 ? terms : [
      { name: 'First Term' },
      { name: 'Second Term' },
      { name: 'Third Term' },
    ];

    const updatedStudents = await Promise.all(students.map(async (st) => {
      let recs = [...(st.termRecords || [])];
      for (const t of termsToInit) {
        if (!recs.some(r => r.academicSession === sessionYear && r.term === t.name)) {
          recs.push({
            academicSession: sessionYear,
            term: t.name,
            className: st.className || 'JSS 1 Gold',
            subjects: [],
            overallTotal: 0,
            overallAverage: 0,
            gpa: 0,
            position: 'N/A',
            totalInClass: 0,
            status: 'Unpublished',
            isPublished: false,
            issueDate: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
            updatedAt: new Date().toISOString(),
          });
        }
      }
      const updatedSt = { ...st, termRecords: recs };
      await api.updateStudent(st.studentId, updatedSt);
      return updatedSt;
    }));

    setStudents(updatedStudents);
    setIsAddSessionOpen(false);
    setNewSession({ year: '', startDate: '', endDate: '', status: 'Upcoming' });
    triggerToast(`Academic session "${created.year}" created & default unpublished result records initialized for all students!`);
  };

  const handleSetActiveSession = async (sess: any) => {
    const sessionYear = sess.year.includes('Academic Session') ? sess.year : `${sess.year} Academic Session`;
    const updatedSessions = sessions.map(s => ({
      ...s,
      status: s.id === sess.id ? 'Active Current Session' : (s.status.includes('Active') ? 'Concluded' : s.status),
    }));
    setSessions(updatedSessions);
    setScoreSession(sessionYear);
    setSelectedReportSession(sessionYear);
    setNewStudent(prev => ({ ...prev, academicSession: sessionYear }));
    await api.updateSession(sess.id, { status: 'Active Current Session' });
    triggerToast(`Set ${sess.year} as the current active academic session across the entire portal.`);
  };

  const handleUpdateSessionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editSessionCandidate) return;
    await api.updateSession(editSessionCandidate.id, editSessionCandidate);
    setSessions(sessions.map(s => s.id === editSessionCandidate.id ? editSessionCandidate : s));
    setEditSessionCandidate(null);
    triggerToast(`Updated parameters for ${editSessionCandidate.year} session.`);
  };

  const handleDeleteSessionConfirm = async () => {
    if (!deleteSessionCandidate) return;
    const target = deleteSessionCandidate;
    setDeleteSessionCandidate(null);
    await api.deleteSession(target.id);
    setSessions(sessions.filter(s => s.id !== target.id));
    triggerToast(`Session ${target.year} removed from database.`);
  };

  // Term Handlers
  const handleAddTermSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTerm.name) {
      triggerToast('Please enter the term name.');
      return;
    }
    const created = {
      id: `t_${Date.now()}`,
      name: newTerm.name,
      resumption: newTerm.resumption || 'To be announced',
      status: newTerm.status || 'Upcoming',
    };
    await api.addTerm(created);
    setTerms([...terms, created]);

    const defaultSubs = subjectList.map((sub, idx) => ({
      id: `sub-init-${idx + 1}`,
      subject: sub.name,
      ca1: 0,
      ca2: 0,
      midterm: 0,
      caScore: 0,
      examScore: 0,
      total: 0,
      grade: 'F9',
      remark: 'UNPUBLISHED',
    }));

    const updatedStudents = await Promise.all(students.map(async (st) => {
      let recs = [...(st.termRecords || [])];
      for (const s of sessions) {
        const sessionYear = s.year.includes('Academic Session') ? s.year : `${s.year} Academic Session`;
        if (!recs.some(r => r.academicSession === sessionYear && r.term === created.name)) {
          recs.push({
            academicSession: sessionYear,
            term: created.name,
            className: st.className || 'JSS 1 Gold',
            subjects: [],
            overallTotal: 0,
            overallAverage: 0,
            gpa: 0,
            position: 'N/A',
            totalInClass: 0,
            status: 'Unpublished',
            isPublished: false,
            issueDate: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
            updatedAt: new Date().toISOString(),
          });
        }
      }
      const updatedSt = { ...st, termRecords: recs };
      await api.updateStudent(st.studentId, updatedSt);
      return updatedSt;
    }));

    setStudents(updatedStudents);
    setIsAddTermOpen(false);
    setNewTerm({ name: '', resumption: '', status: 'Upcoming' });
    triggerToast(`Academic term "${created.name}" created & default unpublished result records initialized for all students!`);
  };

  const handleSetActiveTerm = async (t: any) => {
    const updatedTerms = terms.map(item => ({
      ...item,
      status: item.id === t.id ? 'Active Current Term' : (item.status.includes('Active') ? 'Concluded' : item.status),
    }));
    setTerms(updatedTerms);
    setScoreTerm(t.name);
    setSelectedReportTerm(t.name);
    setNewStudent(prev => ({ ...prev, term: t.name }));
    await api.updateTerm(t.id, { status: 'Active Current Term' });
    triggerToast(`Activated ${t.name} as current term across all score entry & report cards.`);
  };

  const handleUpdateTermSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTermCandidate) return;
    await api.updateTerm(editTermCandidate.id, editTermCandidate);
    setTerms(terms.map(t => t.id === editTermCandidate.id ? editTermCandidate : t));
    setEditTermCandidate(null);
    triggerToast(`Calendar updated for ${editTermCandidate.name}.`);
  };

  const handleDeleteTermConfirm = async () => {
    if (!deleteTermCandidate) return;
    const target = deleteTermCandidate;
    setDeleteTermCandidate(null);
    await api.deleteTerm(target.id);
    setTerms(terms.filter(t => t.id !== target.id));
    triggerToast(`Term "${target.name}" removed from database.`);
  };

  const handleAddClassSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClass.name || !newClass.arm) {
      triggerToast('Please provide class name and arm stream.');
      return;
    }
    const created = {
      id: String(Date.now()),
      name: newClass.name,
      arm: newClass.arm,
      teacher: newClass.teacher || 'Unassigned Form Teacher',
      capacity: Number(newClass.capacity) || 35,
      enrolled: 0,
    };

    await api.addClass(created);
    setClassList([...classList, created]);
    setIsAddClassOpen(false);
    setNewClass({ name: '', arm: '', teacher: '', capacity: 35 });
    triggerToast(`Class stream "${created.name}" created and synced to MongoDB database!`);
  };

  const handleDeleteClassConfirm = async () => {
    if (!deleteClassCandidate) return;
    const target = deleteClassCandidate;
    setDeleteClassCandidate(null);
    await api.deleteClass(target.id || target.name);
    setClassList(classList.filter(c => c.id !== target.id && c.name !== target.name));
    triggerToast(`Class stream "${target.name}" permanently deleted from database.`);
  };

  const handleAddSubjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.name.trim()) {
      triggerToast('Please provide a subject title.');
      return;
    }
    const generatedCode = newSubject.code.trim() ? newSubject.code.toUpperCase() : (newSubject.name.trim().substring(0, 3).toUpperCase() + Math.floor(Math.random() * 899 + 100));
    const created = {
      code: generatedCode,
      name: newSubject.name.trim(),
      category: newSubject.category,
      teacher: newSubject.teacher || 'Unassigned Instructor',
    };

    await api.addSubject(created);
    setSubjectList([...subjectList, created]);
    setIsAddSubjectOpen(false);
    setNewSubject({ code: '', name: '', category: 'General Core', teacher: '' });
    triggerToast(`Subject "${created.name}" created and synced to database!`);
  };

  const handleDeleteSubjectConfirm = async () => {
    if (!deleteSubjectCandidate) return;
    const target = deleteSubjectCandidate;
    setDeleteSubjectCandidate(null);
    await api.deleteSubject(target.code);
    setSubjectList(subjectList.filter(s => s.code !== target.code));
    triggerToast(`Subject "${target.name}" permanently deleted from database.`);
  };

  const handleViewStudent = async (st: any) => {
    setIsLoadingStudentDetails(true);
    try {
      const fetched = await api.getStudentById(st.studentId);
      const fetchedSubs = fetched?.subjects || [];
      const stSubs = st?.subjects || [];
      let subjectsToUse = fetchedSubs.length > 0 ? fetchedSubs : stSubs;

      // Filter to only show subjects created or entered by the Admin
      if (subjectList.length > 0) {
        const validAdminSubjectNames = new Set(subjectList.map(s => s.name.trim().toLowerCase()));
        const adminAddedSubs = subjectsToUse.filter((sub: any) =>
          validAdminSubjectNames.has((sub.subject || '').trim().toLowerCase())
        );

        if (adminAddedSubs.length > 0) {
          subjectsToUse = adminAddedSubs;
        } else {
          // If no scores entered for admin subjects yet, auto-populate placeholders for the Admin's created subjects
          subjectsToUse = subjectList.map((s, idx) => ({
            id: `sub-${idx + 1}`,
            subject: s.name,
            ca1: 0,
            ca2: 0,
            midterm: 0,
            caScore: 0,
            examScore: 0,
            total: 0,
            grade: 'F9',
            remark: 'FAIL',
          }));
        }
      }

      const studentData = {
        ...(st || {}),
        ...(fetched || {}),
        subjects: subjectsToUse,
      };

      const calculatedTotal = subjectsToUse.reduce((acc: number, sub: any) => acc + (Number(sub.total) || 0), 0);
      const calculatedAvg = subjectsToUse.length > 0 ? Number((calculatedTotal / subjectsToUse.length).toFixed(1)) : (studentData.overallAverage || studentData.averageScore || 0);
      const calculatedGpa = subjectsToUse.length > 0 ? Number((calculatedAvg / 25).toFixed(2)) : (studentData.gpa || 0);

      const dynamicRank = calculateDynamicStudentPosition(studentData, students);

      const fullResult: StudentResult = {
        studentId: studentData.studentId,
        fullName: studentData.fullName || studentData.name || 'Student Name',
        passportUrl: studentData.passportUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
        gender: studentData.gender || 'Male',
        className: studentData.className || 'JSS 1 Gold',
        academicSession: studentData.academicSession || studentData.session || '2024/2025 Academic Session',
        term: studentData.term || 'Third Term (2024/2025)',
        dateOfBirth: studentData.dateOfBirth || '2008-05-12',
        attendance: studentData.attendance || { timesOpened: 120, timesPresent: 118, timesAbsent: 2 },
        behavioralTraits: studentData.behavioralTraits || { punctuality: 5, neatness: 5, leadership: 5, honesty: 5 },
        subjects: subjectsToUse,
        overallTotal: calculatedTotal,
        overallAverage: calculatedAvg,
        gpa: calculatedGpa,
        position: dynamicRank.position,
        totalInClass: dynamicRank.totalInClass,
        status: studentData.status || 'PROMOTED',
        classTeacherRemark: studentData.classTeacherRemark || studentData.teacherRemark || 'Outstanding academic performance and conduct.',
        principalRemark: studentData.principalRemark || 'Exemplary character and intelligence.',
        verificationHash: studentData.verificationHash || `RA-SEC-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
        issueDate: studentData.issueDate || 'August 09, 2026',
      };

      setSelectedStudentResult(fullResult);
      setIsViewResultOpen(true);
      triggerToast(`Loaded result slip for ${fullResult.fullName}`);
    } catch {
      triggerToast(`Could not load record for ${st.studentId}`);
    } finally {
      setIsLoadingStudentDetails(false);
    }
  };

  // Fetch Real Data from MongoDB API on Mount
  useEffect(() => {
    const loadRealData = async () => {
      const status = await api.getDbStatus();
      setDbStatus(status);

      const realStudents = await api.getStudents();
      if (Array.isArray(realStudents)) {
        setStudents(realStudents);
      }

      const realClasses = await api.getClasses();
      if (realClasses && realClasses.length > 0) {
        setClassList(realClasses);
        setSelectedReportClass(realClasses[0].name);
        setScoreClass(realClasses[0].name);
        setNewStudent(prev => ({ ...prev, className: realClasses[0].name }));
      }

      const realSubjects = await api.getSubjects();
      if (realSubjects && realSubjects.length > 0) {
        setSubjectList(realSubjects);
        setScoreSubject(realSubjects[0].name);
      }

      const realSessions = await api.getSessions();
      if (Array.isArray(realSessions) && realSessions.length > 0) {
        setSessions(realSessions);
        const activeS = realSessions.find(s => s.status?.includes('Active')) || realSessions.find(s => s.year === '2024/2025') || realSessions[0];
        if (activeS) {
          const formatted = activeS.year.includes('Academic Session') ? activeS.year : `${activeS.year} Academic Session`;
          setScoreSession(formatted);
          setSelectedReportSession(formatted);
          setNewStudent(prev => ({ ...prev, academicSession: formatted }));
        }
      }

      const realTerms = await api.getTerms();
      if (Array.isArray(realTerms) && realTerms.length > 0) {
        setTerms(realTerms);
        const activeT = realTerms.find(t => t.status?.includes('Active')) || realTerms[0];
        if (activeT) {
          setScoreTerm(activeT.name);
          setSelectedReportTerm(activeT.name);
          setNewStudent(prev => ({ ...prev, term: activeT.name }));
        }
      }

      const branding = await api.getBranding();
      if (branding) {
        setLogoPreview(branding.logoUrl || null);
        if (branding.stampUrl) setStampPreview(branding.stampUrl);
        if (branding.signatureUrl) setSignaturePreview(branding.signatureUrl);
        if (branding.principalRemark) setGlobalPrincipalRemark(branding.principalRemark);
        if (branding.positions) {
          setBrandingPositions((prev) => ({
            logo: { ...prev.logo, ...(branding.positions.logo || {}) },
            stamp: { ...prev.stamp, ...(branding.positions.stamp || {}) },
            signature: { ...prev.signature, ...(branding.positions.signature || {}) },
          }));
        }
      }
    };

    loadRealData();
  }, []);

  const triggerToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3200);
  };

  const navGroups = [
    {
      title: 'Main Overview',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      ],
    },
    {
      title: 'Academic Structure',
      items: [
        { id: 'students', label: 'Manage Students', icon: Users },
        { id: 'classes', label: 'Manage Classes', icon: GraduationCap },
        { id: 'subjects', label: 'Manage Subjects', icon: BookOpen },
        { id: 'sessions', label: 'Manage Academic Sessions', icon: Calendar },
        { id: 'terms', label: 'Manage Terms', icon: Clock },
      ],
    },
    {
      title: 'Examination & Scores',
      items: [
        { id: 'manage-results', label: 'Result Management', icon: FileSpreadsheet },
        { id: 'enter-results', label: 'Batch Class Entry', icon: FilePlus },
        { id: 'delete-results', label: 'Delete Records', icon: Trash2 },
      ],
    },
    {
      title: 'School Branding',
      items: [
        { id: 'upload-logo', label: 'Upload School Logo', icon: ImageIcon },
        { id: 'upload-stamp', label: 'Upload School Stamp', icon: Award },
        { id: 'upload-signature', label: 'Upload Principal Signature', icon: PenTool },
      ],
    },
    {
      title: 'Analytics & Reports',
      items: [
        { id: 'reports', label: 'Generate Reports', icon: FileSpreadsheet },
        { id: 'analytics', label: 'View Analytics', icon: BarChart3 },
      ],
    },
    {
      title: 'System & Account',
      items: [
        { id: 'login', label: 'Admin Login Status', icon: LogIn },
      ],
    },
  ];

  const generateUnique7DigitRegId = () => {
    let candidate = '';
    let attempts = 0;
    while (attempts < 200) {
      const rand = Math.floor(1000000 + Math.random() * 9000000);
      candidate = String(rand);
      if (!students.some(s => String(s.studentId || '').trim() === candidate)) {
        return candidate;
      }
      attempts++;
    }
    return String(Math.floor(2026000 + Math.random() * 9000));
  };

  const handleOpenAddStudentModal = () => {
    const autoId = generateUnique7DigitRegId();
    setNewStudent({
      name: '',
      studentId: autoId,
      className: classList[0]?.name || allClassNames[0] || '',
      gender: 'Male',
      house: 'Blue House',
      age: '',
      passportUrl: '',
      parentContact: '',
      academicSession: activeSessionYear,
      term: activeTermName,
    });
    setIsAddStudentOpen(true);
  };

  const handleAddStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudent.name || !newStudent.studentId) {
      triggerToast('Please provide student full name and 7-digit registration ID.');
      return;
    }

    const cleanRegId = String(newStudent.studentId).trim();

    // 1. Check 7-digit numeric format constraint
    if (!/^\d{7}$/.test(cleanRegId)) {
      triggerToast('Registration ID must be a unique 7-digit number (e.g., 2026101).');
      return;
    }

    // 2. Uniqueness Constraint / Primary Key check
    const existingStudent = students.find(s => String(s.studentId || '').trim() === cleanRegId);
    if (existingStudent) {
      triggerToast(`Registration ID "${cleanRegId}" is already assigned to ${existingStudent.fullName || (existingStudent as any).name}. Reg ID must be unique!`);
      return;
    }

    const defaultSubjects = subjectList.length > 0
      ? subjectList.map((s, idx) => ({
          id: String(idx + 1),
          subject: s.name,
          caScore: 0,
          examScore: 0,
          total: 0,
          grade: 'F9',
          remark: 'FAIL'
        }))
      : [];

    const finalAge = newStudent.age 
      ? (newStudent.age.toLowerCase().includes('yr') ? newStudent.age : `${newStudent.age} Yrs`) 
      : '15 Yrs';

    const defaultAvatar = newStudent.gender === 'Female' 
      ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'
      : 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=250';

    const targetSess = newStudent.academicSession || activeSessionYear;
    const targetTrm = newStudent.term || activeTermName;

    const createdStudent = {
      studentId: cleanRegId,
      name: newStudent.name,
      fullName: newStudent.name,
      className: newStudent.className || classList[0]?.name || allClassNames[0] || '',
      term: targetTrm,
      session: targetSess,
      academicSession: targetSess,
      gpa: 0,
      averageScore: 0,
      overallAverage: 0,
      overallTotal: 0,
      position: 'N/A',
      principalRemark: 'Exemplary academic effort and character.',
      teacherRemark: 'Pending score publication.',
      status: 'Unpublished' as const,
      isPublished: false,
      gender: newStudent.gender as 'Male' | 'Female',
      house: newStudent.house || 'Blue House',
      age: finalAge,
      passportUrl: newStudent.passportUrl.trim() || defaultAvatar,
      dateOfBirth: '2008-01-01',
      attendance: { timesOpened: 120, timesPresent: 118, timesAbsent: 2 },
      behavioralTraits: { punctuality: 5, neatness: 5, leadership: 5, honesty: 5 },
      verificationHash: `RA-SEC-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      issueDate: 'August 09, 2026',
      subjects: [],
      termRecords: [
        {
          academicSession: targetSess,
          term: targetTrm,
          className: newStudent.className || classList[0]?.name || allClassNames[0] || '',
          subjects: [],
          overallTotal: 0,
          overallAverage: 0,
          gpa: 0,
          status: 'Unpublished',
          isPublished: false,
          updatedAt: new Date().toISOString()
        }
      ]
    };

    try {
      await api.createStudent(createdStudent);
      setStudents([createdStudent, ...students]);
      setScoreClass(createdStudent.className);
      setIsAddStudentOpen(false);
      setNewStudent({
        name: '',
        studentId: '',
        className: classList[0]?.name || allClassNames[0] || '',
        gender: 'Male',
        house: 'Blue House',
        age: '',
        passportUrl: '',
        parentContact: '',
        academicSession: activeSessionYear,
        term: activeTermName,
      });
      triggerToast(`Student record for "${newStudent.name}" registered with unique Reg ID ${cleanRegId}!`);
    } catch (err: any) {
      triggerToast(err.message || 'Failed to register student record.');
    }
  };

  const handleSaveEditStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    try {
      const finalAge = editingStudent.age 
        ? (editingStudent.age.toLowerCase().includes('yr') ? editingStudent.age : `${editingStudent.age} Yrs`) 
        : '15 Yrs';

      const defaultAvatar = editingStudent.gender === 'Female' 
        ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'
        : 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=250';

      const targetSession = editingStudent.academicSession || (editingStudent as any).session || '2025/2026 Academic Session';
      const targetTerm = editingStudent.term || 'First Term';
      const targetClass = editingStudent.className || 'JSS 1 Gold';

      // Find original un-edited student record from state
      const originalStudent = students.find(s => s.studentId === editingStudent.studentId) || editingStudent;
      const originalClass = originalStudent.className || 'JSS 1 Gold';
      const originalTerm = originalStudent.term || 'First Term';
      const originalSession = originalStudent.academicSession || (originalStudent as any).session || '2025/2026 Academic Session';

      let updatedTermRecords = [...(originalStudent.termRecords || [])];

      // 1. Preserve original student scores in termRecords for the original class, session & term
      if (originalStudent.subjects && originalStudent.subjects.length > 0 && (originalStudent.overallTotal || 0) > 0) {
        updatedTermRecords = upsertTermRecord(
          updatedTermRecords,
          originalSession,
          originalTerm,
          originalClass,
          originalStudent.subjects,
          originalStudent.overallTotal || 0,
          originalStudent.overallAverage || originalStudent.averageScore || 0,
          originalStudent.gpa || 0
        );
      }

      // Check if student is being moved to a NEW class, session, or term
      const isMovedToNewClassOrTerm = (
        originalClass !== targetClass ||
        originalTerm !== targetTerm ||
        originalSession !== targetSession
      );

      // 2. Look for existing record matching targetSession, targetTerm, AND targetClass
      const existingTargetRecord = updatedTermRecords.find(
        r => r.academicSession === targetSession && r.term === targetTerm && (r.className === targetClass || !r.className)
      );

      let finalSubjects: any[] = [];
      let finalTotal = 0;
      let finalAverage = 0;
      let finalGpa = 0;
      let finalStatus = 'Unpublished';
      let finalIsPublished = false;

      if (existingTargetRecord && (existingTargetRecord.isPublished !== false && existingTargetRecord.status !== 'Unpublished') && existingTargetRecord.subjects?.some((s: any) => (s.total || 0) > 0)) {
        // Target record already exists and HAS published scores for this class/term
        finalSubjects = existingTargetRecord.subjects;
        finalTotal = existingTargetRecord.overallTotal || 0;
        finalAverage = existingTargetRecord.overallAverage || 0;
        finalGpa = existingTargetRecord.gpa || 0;
        finalStatus = 'Published';
        finalIsPublished = true;
      } else if (!isMovedToNewClassOrTerm && originalStudent.subjects && originalStudent.subjects.length > 0) {
        // Student was NOT moved to a new class/term; keep current scores
        finalSubjects = originalStudent.subjects;
        finalTotal = originalStudent.overallTotal || 0;
        finalAverage = originalStudent.overallAverage || originalStudent.averageScore || 0;
        finalGpa = originalStudent.gpa || 0;
        finalStatus = originalStudent.status || 'Published';
        finalIsPublished = originalStudent.isPublished !== false;
      } else {
        // DO NOT replicate previous scores! Initialize clean unpublished record for the new class/term
        finalSubjects = [];
        finalTotal = 0;
        finalAverage = 0;
        finalGpa = 0;
        finalStatus = 'Unpublished';
        finalIsPublished = false;

        // Upsert clean unpublished record into termRecords
        const newUnpublishedRecord: StudentTermRecord = {
          academicSession: targetSession,
          term: targetTerm,
          className: targetClass,
          subjects: [],
          overallTotal: 0,
          overallAverage: 0,
          gpa: 0,
          status: 'Unpublished',
          isPublished: false,
          updatedAt: new Date().toISOString()
        };

        const targetIdx = updatedTermRecords.findIndex(r => r.academicSession === targetSession && r.term === targetTerm && r.className === targetClass);
        if (targetIdx !== -1) {
          updatedTermRecords[targetIdx] = newUnpublishedRecord;
        } else {
          updatedTermRecords.push(newUnpublishedRecord);
        }
      }

      // Respect explicit admin publication choice on edit modal
      if (editingStudent.status === 'Published' || editingStudent.isPublished) {
        finalStatus = 'Published';
        finalIsPublished = true;
        const targetIdx = updatedTermRecords.findIndex(r => r.academicSession === targetSession && r.term === targetTerm);
        if (targetIdx !== -1) {
          updatedTermRecords[targetIdx] = {
            ...updatedTermRecords[targetIdx],
            status: 'Published',
            isPublished: true,
            updatedAt: new Date().toISOString(),
          };
        }
      } else if (editingStudent.status === 'Unpublished' || editingStudent.isPublished === false) {
        finalStatus = 'Unpublished';
        finalIsPublished = false;
        const targetIdx = updatedTermRecords.findIndex(r => r.academicSession === targetSession && r.term === targetTerm);
        if (targetIdx !== -1) {
          updatedTermRecords[targetIdx] = {
            ...updatedTermRecords[targetIdx],
            status: 'Unpublished',
            isPublished: false,
            updatedAt: new Date().toISOString(),
          };
        }
      }

      const updatedObj = {
        ...editingStudent,
        name: editingStudent.fullName || (editingStudent as any).name,
        fullName: editingStudent.fullName || (editingStudent as any).name,
        className: targetClass,
        term: targetTerm,
        academicSession: targetSession,
        session: targetSession,
        age: finalAge,
        house: editingStudent.house || 'Blue House',
        passportUrl: editingStudent.passportUrl?.trim() || defaultAvatar,
        termRecords: updatedTermRecords,
        subjects: finalSubjects,
        overallTotal: finalTotal,
        overallAverage: finalAverage,
        averageScore: finalAverage,
        gpa: finalGpa,
        status: finalStatus,
        isPublished: finalIsPublished,
      };

      await api.updateStudent(editingStudent.studentId, updatedObj);
      setStudents(prev => prev.map(s => s.studentId === editingStudent.studentId ? updatedObj : s));
      if (fetchedStudent && fetchedStudent.studentId === editingStudent.studentId) {
        setFetchedStudent(updatedObj);
      }
      setIsEditStudentOpen(false);
      setEditingStudent(null);
      triggerToast(`Successfully updated profile & class/term parameters for "${updatedObj.fullName}"!`);
    } catch (err: any) {
      triggerToast(err.message || 'Failed to update student profile.');
    }
  };

  const handleToggleStudentPublication = async (studentId: string) => {
    const student = students.find(s => s.studentId === studentId);
    if (!student) return;

    const isCurrentlyPublished = student.status === 'Published' || (student.isPublished !== false && student.status !== 'Unpublished');
    const newStatus = isCurrentlyPublished ? 'Unpublished' : 'Published';
    const newIsPublished = !isCurrentlyPublished;

    const targetSession = student.academicSession || (student as any).session || activeSessionYear;
    const targetTerm = student.term || activeTermName;
    const targetClass = student.className || 'JSS 1 Gold';

    let updatedTermRecords = [...(student.termRecords || [])];
    const recIdx = updatedTermRecords.findIndex(r => r.academicSession === targetSession && r.term === targetTerm);
    if (recIdx !== -1) {
      updatedTermRecords[recIdx] = {
        ...updatedTermRecords[recIdx],
        status: newStatus,
        isPublished: newIsPublished,
        updatedAt: new Date().toISOString(),
      };
    } else {
      updatedTermRecords.push({
        academicSession: targetSession,
        term: targetTerm,
        className: targetClass,
        subjects: student.subjects || [],
        overallTotal: student.overallTotal || 0,
        overallAverage: student.overallAverage || 0,
        gpa: student.gpa || 0,
        status: newStatus,
        isPublished: newIsPublished,
        updatedAt: new Date().toISOString(),
      });
    }

    const updatedStudent: StudentResult = {
      ...student,
      status: newStatus as any,
      isPublished: newIsPublished,
      termRecords: updatedTermRecords,
    };

    try {
      await api.updateStudent(student.studentId, updatedStudent);
      setStudents(prev => prev.map(s => s.studentId === studentId ? updatedStudent : s));
      triggerToast(`Publication status for "${student.name || (student as any).fullName}" changed to ${newStatus}!`);
    } catch {
      triggerToast('Failed to update publication status.');
    }
  };

  const handlePublishAllInClass = async () => {
    const filterText = selectedClassFilter === 'All' ? 'all classes' : selectedClassFilter;
    const targetStudents = students.filter(s => selectedClassFilter === 'All' || s.className === selectedClassFilter);

    if (targetStudents.length === 0) {
      triggerToast('No students found in the selected filter.');
      return;
    }

    let publishedCount = 0;
    const updatedList = [...students];

    for (const st of targetStudents) {
      const idx = updatedList.findIndex(s => s.studentId === st.studentId);
      if (idx === -1) continue;

      const targetSession = st.academicSession || (st as any).session || activeSessionYear;
      const targetTerm = st.term || activeTermName;
      const targetClass = st.className || 'JSS 1 Gold';

      let updatedTermRecords = [...(st.termRecords || [])];
      const recIdx = updatedTermRecords.findIndex(r => r.academicSession === targetSession && r.term === targetTerm);
      if (recIdx !== -1) {
        updatedTermRecords[recIdx] = {
          ...updatedTermRecords[recIdx],
          status: 'Published',
          isPublished: true,
          updatedAt: new Date().toISOString(),
        };
      } else {
        updatedTermRecords.push({
          academicSession: targetSession,
          term: targetTerm,
          className: targetClass,
          subjects: st.subjects || [],
          overallTotal: st.overallTotal || 0,
          overallAverage: st.overallAverage || 0,
          gpa: st.gpa || 0,
          status: 'Published',
          isPublished: true,
          updatedAt: new Date().toISOString(),
        });
      }

      const updatedSt: StudentResult = {
        ...st,
        status: 'Published' as const,
        isPublished: true,
        termRecords: updatedTermRecords,
      };

      updatedList[idx] = updatedSt;
      await api.updateStudent(st.studentId, updatedSt);
      publishedCount++;
    }

    setStudents(updatedList);
    triggerToast(`Successfully published results for ${publishedCount} student(s) in ${filterText}!`);
  };

  const handleSaveSchoolHeader = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem('royal_academy_school_header', JSON.stringify(schoolHeader));
      triggerToast('School Name & Report Card Header saved successfully!');
      setIsEditSchoolHeaderOpen(false);
    } catch (err: any) {
      triggerToast(err.message || 'Failed to save school header.');
    }
  };

  const handleResetSchoolHeader = () => {
    setSchoolHeader(DEFAULT_SCHOOL_HEADER);
    localStorage.setItem('royal_academy_school_header', JSON.stringify(DEFAULT_SCHOOL_HEADER));
    triggerToast('School header reset to default ROYAL ACADEMY layout.');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-['Inter',sans-serif] flex flex-col selection:bg-[#1E3A8A]/10 selection:text-[#1E3A8A]">
      
      {/* Top Header Navigation - White & Royal Blue */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-4">
          <button
            onClick={onBackToWebsite}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:text-[#1E3A8A] bg-slate-100 hover:bg-blue-50 rounded-xl border border-slate-200 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-[#F59E0B]" />
            <span>Public Website</span>
          </button>

          <div className="hidden sm:block h-6 w-px bg-slate-200" />

          <div className="flex items-center gap-3">
            <SchoolLogo size="sm" showText={false} />
            <div>
              <h1 className="text-sm font-bold text-[#1E3A8A] tracking-tight font-['Plus_Jakarta_Sans']">
                {schoolHeader.schoolName || 'ROYAL ACADEMY'}
              </h1>
              <p className="text-xs text-slate-500 font-medium leading-tight">
                Excellence & Integrity
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsEditSchoolHeaderOpen(true)}
              className="ml-2 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-[#1E3A8A] border border-amber-200/80 rounded-xl transition-all cursor-pointer shadow-2xs font-bold text-xs flex items-center gap-1.5"
              title="Edit School Name, Report Card Title & Address"
            >
              <Building2 className="w-3.5 h-3.5 text-[#F59E0B]" />
              <span className="hidden md:inline">Edit Report Header</span>
            </button>
          </div>
        </div>

        {/* Center Quick Student Search Trigger (Header Integration) */}
        <div className="hidden lg:flex items-center relative max-w-sm w-full mx-4" ref={headerSearchRef}>
          <div className="relative w-full flex items-center">
            <Search className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Quick Search Student (Reg ID / Name)..."
              value={headerSearchQuery}
              onChange={(e) => {
                setHeaderSearchQuery(e.target.value);
                setIsHeaderSearchOpen(true);
              }}
              onFocus={() => setIsHeaderSearchOpen(true)}
              className="w-full pl-9 pr-8 py-1.5 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-xl text-xs font-bold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] transition-all shadow-2xs"
            />
            {headerSearchQuery && (
              <button
                type="button"
                onClick={() => {
                  setHeaderSearchQuery('');
                  setIsHeaderSearchOpen(false);
                }}
                className="absolute right-2.5 text-[10px] font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Live Dropdown in Header */}
          {isHeaderSearchOpen && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl border border-slate-200 shadow-2xl z-50 max-h-64 overflow-y-auto divide-y divide-slate-100">
              {students
                .filter(s => {
                  const q = headerSearchQuery.trim().toLowerCase();
                  if (!q) return true;
                  return (
                    (s.studentId || '').toLowerCase().includes(q) ||
                    (s.fullName || (s as any).name || '').toLowerCase().includes(q) ||
                    (s.className || '').toLowerCase().includes(q)
                  );
                })
                .slice(0, 8)
                .map(st => (
                  <button
                    key={st.studentId}
                    type="button"
                    onClick={() => {
                      setSelectedResultStudentId(st.studentId);
                      setActiveTab('manage-results');
                      setIsHeaderSearchOpen(false);
                      setHeaderSearchQuery('');
                      triggerToast(`Loaded result management for ${st.fullName || (st as any).name}`);
                    }}
                    className="w-full p-2.5 text-left flex items-center justify-between hover:bg-blue-50/70 transition-colors cursor-pointer text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                        <img
                          src={st.passportUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'}
                          alt={st.fullName || (st as any).name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-bold text-[#0F172A] leading-tight">{st.fullName || (st as any).name}</p>
                        <p className="text-[10px] text-slate-500 font-mono">{st.studentId} • {st.className}</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-[#1E3A8A] text-white">
                      Open
                    </span>
                  </button>
                ))}
            </div>
          )}
        </div>

        {/* Right Admin Controls */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-3 px-3.5 py-1.5 bg-blue-50/80 rounded-2xl border border-blue-100">
            <div className="w-8 h-8 rounded-xl bg-[#1E3A8A] text-[#F59E0B] font-black text-xs flex items-center justify-center shadow-xs">
              {adminUser.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-[#1E3A8A] leading-tight">{adminUser.name}</p>
              <p className="text-[10px] text-slate-500 font-medium">{adminUser.role}</p>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Main Workspace with Left Pane Sidebar Layout */}
      <div className="flex-1 flex flex-col md:flex-row">
        
        {/* Left Pane Sidebar Navigation */}
        <aside className="w-full md:w-72 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 p-4 space-y-6">
          <div className="space-y-5">
            <div className="px-2 pb-3 border-b border-slate-100">
              <span className="text-xs font-bold text-[#1E3A8A] uppercase tracking-wider block font-['Plus_Jakarta_Sans']">
                Admin Control Panel
              </span>
              <p className="text-[11px] text-slate-500 font-medium">System Management</p>
            </div>

            <nav className="space-y-4">
              {navGroups.map((group) => (
                <div key={group.title} className="space-y-1">
                  <p className="px-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                    {group.title}
                  </p>
                  <div className="space-y-0.5">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            if (item.id === 'login') {
                              triggerToast(`Authenticated as ${adminUser.name} (${adminUser.email})`);
                            } else {
                              setActiveTab(item.id as TabType);
                            }
                          }}
                          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-left ${
                            isActive
                              ? 'bg-[#1E3A8A] text-white shadow-md shadow-blue-900/20 font-extrabold'
                              : 'text-slate-600 hover:text-[#1E3A8A] hover:bg-blue-50/70'
                          }`}
                        >
                          <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#F59E0B]' : 'text-slate-400'}`} />
                          <span className="truncate">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </div>

          {/* Sidebar Bottom Action / Logout */}
          <div className="pt-4 border-t border-slate-200 space-y-2">
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <LogOut className="w-4 h-4" />
                <span>Logout Session</span>
              </div>
              <ChevronRight className="w-4 h-4 text-red-400" />
            </button>
            <p className="text-[10px] text-center text-slate-400 font-mono">
              Royal Admin OS v5.2 • 256-bit SSL
            </p>
          </div>
        </aside>

        {/* Right Main Content Panel */}
        <main className="flex-1 bg-[#F8FAFC] p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto max-w-7xl">
          
          {/* TAB 1: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Header Badge */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-[#1E3A8A] text-xs font-bold mb-2">
                    <Building2 className="w-3.5 h-3.5 text-[#F59E0B]" />
                    <span>Royal Academy Executive Dashboard</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-[#0F172A] font-['Plus_Jakarta_Sans']">
                    Welcome back, {adminUser.name}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    Managing <span className="font-bold text-[#1E3A8A]">{activeSessionYear}</span> (<span className="font-bold text-emerald-700">{activeTermName}</span>) Academic Records, Transcripts & Examination Portals.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Cloudinary Integration Status Badge */}
                  <div
                    className={`px-3.5 py-2 rounded-2xl border flex items-center gap-2 text-xs font-bold transition-all ${
                      dbStatus?.cloudinaryConfigured
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-xs'
                        : 'bg-amber-50 text-amber-800 border-amber-300 shadow-xs'
                    }`}
                  >
                    <Cloud className={`w-4 h-4 ${dbStatus?.cloudinaryConfigured ? 'text-emerald-600' : 'text-amber-600'}`} />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] uppercase tracking-wider text-slate-500 font-extrabold block">Cloudinary Media CDN</span>
                        <span className={`w-2 h-2 rounded-full ${dbStatus?.cloudinaryConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                      </div>
                      <span className="font-extrabold text-[11px] block">
                        {dbStatus?.cloudinaryConfigured ? 'Connected & Live' : 'Not Connected (Add Keys)'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab('enter-results')}
                    className="px-4 py-2.5 bg-[#1E3A8A] hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-md border border-blue-400/30 flex items-center gap-2 cursor-pointer transition-all"
                  >
                    <Plus className="w-4 h-4 text-[#F59E0B]" />
                    <span>Enter New Scores</span>
                  </button>
                </div>
              </div>

              {/* Metric Cards Grid */}
              {(() => {
                const totalStudentsCount = students.length;
                const publishedCount = students.filter(s => s.subjects && s.subjects.length > 0).length;
                const publishedPercentage = totalStudentsCount > 0 ? ((publishedCount / totalStudentsCount) * 100).toFixed(1) : '0.0';
                const totalClassesCount = classList.length;
                const firstClassGroup = classList[0]?.name.split(' ')[0] || 'JSS1';
                const lastClassGroup = classList[classList.length - 1]?.name.split(' ')[0] || 'SSS3';
                const classStreamsLabel = classList.length > 0 ? `${firstClassGroup} to ${lastClassGroup} streams` : 'No active streams';
                const isStampVerified = Boolean(schoolHeader?.stampUrl);

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                      <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
                        <span>Total Students</span>
                        <Users className="w-4 h-4 text-[#1E3A8A]" />
                      </div>
                      <p className="text-3xl font-black text-[#0F172A] font-['Plus_Jakarta_Sans']">
                        {totalStudentsCount.toLocaleString()}
                      </p>
                      <p className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" /> {totalStudentsCount} active registered student{totalStudentsCount === 1 ? '' : 's'}
                      </p>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                      <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
                        <span>Published Results</span>
                        <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      </div>
                      <p className="text-3xl font-black text-[#0F172A] font-['Plus_Jakarta_Sans']">
                        {publishedPercentage}%
                      </p>
                      <p className="text-[11px] text-slate-500 font-mono">
                        {publishedCount} / {totalStudentsCount} verified slips
                      </p>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                      <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
                        <span>Active Academic Classes</span>
                        <GraduationCap className="w-4 h-4 text-[#F59E0B]" />
                      </div>
                      <p className="text-3xl font-black text-[#0F172A] font-['Plus_Jakarta_Sans']">
                        {totalClassesCount} Arms
                      </p>
                      <p className="text-[11px] text-slate-500 font-mono">
                        {classStreamsLabel}
                      </p>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                      <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
                        <span>School Stamp & Seal</span>
                        <Award className="w-4 h-4 text-emerald-600" />
                      </div>
                      <p className="text-3xl font-black text-emerald-600 font-['Plus_Jakarta_Sans']">
                        {isStampVerified ? 'Uploaded' : 'Verified'}
                      </p>
                      <p className="text-[11px] text-slate-500 font-mono">
                        {isStampVerified ? 'Official Digital Stamp Set' : '256-bit QR Verification'}
                      </p>
                    </div>
                  </div>
                );
              })()}

              {/* Quick Actions Shortcuts */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <h3 className="text-sm font-black text-[#0F172A] uppercase tracking-wider">
                  Quick Portal Admin Actions
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <button
                    onClick={() => setActiveTab('students')}
                    className="p-4 bg-slate-50 hover:bg-blue-50 border border-slate-200 rounded-2xl text-left transition-all cursor-pointer group"
                  >
                    <Users className="w-6 h-6 text-[#1E3A8A] mb-2 group-hover:scale-110 transition-transform" />
                    <p className="text-xs font-bold text-[#0F172A] group-hover:text-[#1E3A8A]">Manage Students</p>
                    <p className="text-[10px] text-slate-500">Roster & enrollment</p>
                  </button>

                  <button
                    onClick={() => setActiveTab('enter-results')}
                    className="p-4 bg-slate-50 hover:bg-blue-50 border border-slate-200 rounded-2xl text-left transition-all cursor-pointer group"
                  >
                    <FilePlus className="w-6 h-6 text-emerald-600 mb-2 group-hover:scale-110 transition-transform" />
                    <p className="text-xs font-bold text-[#0F172A] group-hover:text-[#1E3A8A]">Enter Results</p>
                    <p className="text-[10px] text-slate-500">Subject score sheets</p>
                  </button>

                  <button
                    onClick={() => setActiveTab('reports')}
                    className="p-4 bg-slate-50 hover:bg-blue-50 border border-slate-200 rounded-2xl text-left transition-all cursor-pointer group"
                  >
                    <FileSpreadsheet className="w-6 h-6 text-[#F59E0B] mb-2 group-hover:scale-110 transition-transform" />
                    <p className="text-xs font-bold text-[#0F172A] group-hover:text-[#1E3A8A]">Generate Reports</p>
                    <p className="text-[10px] text-slate-500">Broadsheet & ranking</p>
                  </button>

                  <button
                    onClick={() => setActiveTab('upload-stamp')}
                    className="p-4 bg-slate-50 hover:bg-blue-50 border border-slate-200 rounded-2xl text-left transition-all cursor-pointer group"
                  >
                    <Award className="w-6 h-6 text-purple-600 mb-2 group-hover:scale-110 transition-transform" />
                    <p className="text-xs font-bold text-[#0F172A] group-hover:text-[#1E3A8A]">School Stamp</p>
                    <p className="text-[10px] text-slate-500">Digital transcript seal</p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MANAGE STUDENTS */}
          {activeTab === 'students' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
                <div>
                  <h2 className="text-xl font-black text-[#0F172A] font-['Plus_Jakarta_Sans']">
                    Manage Student Roster
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    View, search, and register students across academic classes.
                  </p>
                </div>
                <button
                  onClick={handleOpenAddStudentModal}
                  className="px-4 py-2.5 bg-[#1E3A8A] hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition-all"
                >
                  <Plus className="w-4 h-4 text-[#F59E0B]" />
                  <span>Register New Student</span>
                </button>
              </div>

              {/* Filters */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    placeholder="Search student full name, registration ID..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs font-semibold text-[#0F172A] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  <Filter className="w-4 h-4 text-slate-500 shrink-0" />
                  <select
                    value={selectedClassFilter}
                    onChange={(e) => setSelectedClassFilter(e.target.value)}
                    className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                  >
                    <option value="All">All Classes ({students.length})</option>
                    {allClassNames.map((cls) => (
                      <option key={cls} value={cls}>
                        {cls} ({students.filter(s => s.className === cls).length})
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={handlePublishAllInClass}
                    className="px-3 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl cursor-pointer inline-flex items-center gap-1.5 shadow-xs transition-all shrink-0"
                    title="Publish results for all students in the selected class filter"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Publish All Results</span>
                  </button>
                </div>
              </div>

              {/* Student Table */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                        <th className="p-4">Reg ID</th>
                        <th className="p-4">Student Name</th>
                        <th className="p-4">Class</th>
                        <th className="p-4">Term / Session</th>
                        <th className="p-4">Portal Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {students
                        .filter(s =>
                          (selectedClassFilter === 'All' || s.className === selectedClassFilter) &&
                          ((s.name || s.fullName || '').toLowerCase().includes(studentSearch.toLowerCase()) ||
                            s.studentId.toLowerCase().includes(studentSearch.toLowerCase()))
                        )
                        .map((st) => {
                          const isPub = st.status === 'Published' || (st.isPublished !== false && st.status !== 'Unpublished');
                          return (
                            <tr key={st.studentId} className="hover:bg-blue-50/40 transition-colors">
                              <td className="p-4 font-mono text-[#1E3A8A] font-bold">{st.studentId}</td>
                              <td className="p-4 font-bold text-[#0F172A]">{st.fullName || st.name}</td>
                              <td className="p-4">{st.className}</td>
                              <td className="p-4 text-slate-500">{st.term} ({st.session || st.academicSession})</td>
                              <td className="p-4">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${
                                  isPub
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                                    : 'bg-amber-50 text-amber-700 border-amber-200/80'
                                }`}>
                                  {isPub ? 'Published' : 'Unpublished'}
                                </span>
                              </td>
                              <td className="p-4 text-right space-x-2">
                                <button
                                  onClick={() => handleToggleStudentPublication(st.studentId)}
                                  title={isPub ? 'Unpublish student result' : 'Publish student result'}
                                  className={`px-2.5 py-1 text-xs font-bold rounded-lg cursor-pointer inline-flex items-center gap-1 transition-all ${
                                    isPub
                                      ? 'text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200'
                                      : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
                                  }`}
                                >
                                  {isPub ? (
                                    <>
                                      <EyeOff className="w-3.5 h-3.5" />
                                      <span>Unpublish</span>
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      <span>Publish Result</span>
                                    </>
                                  )}
                                </button>
                                <button
                                  onClick={() => handleViewStudent(st)}
                                  disabled={isLoadingStudentDetails}
                                  className="px-2.5 py-1 text-xs font-bold text-[#1E3A8A] bg-blue-50 hover:bg-blue-100 rounded-lg cursor-pointer inline-flex items-center gap-1"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>View</span>
                                </button>
                                <button
                                  onClick={() => setPromotingStudent(st as any)}
                                  title="Promote student to next class / session"
                                  className="px-2.5 py-1 text-xs font-bold text-slate-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg cursor-pointer inline-flex items-center gap-1 transition-all"
                                >
                                  <GraduationCap className="w-3.5 h-3.5 text-[#1E3A8A]" />
                                  <span>Promote</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingStudent(st as any);
                                    setIsEditStudentOpen(true);
                                  }}
                                  className="px-2.5 py-1 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg cursor-pointer inline-flex items-center gap-1"
                                >
                                  <FileEdit className="w-3.5 h-3.5" />
                                  <span>Edit Profile</span>
                                </button>
                                <button
                                  onClick={() => setDeleteCandidateId(st.studentId)}
                                  className="px-2.5 py-1 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg cursor-pointer inline-flex items-center gap-1"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Delete</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MANAGE CLASSES */}
          {activeTab === 'classes' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-[#0F172A] font-['Plus_Jakarta_Sans']">
                    Manage School Classes & Arms
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Configure Junior and Senior Secondary academic class streams and form teachers.
                  </p>
                </div>

                <button
                  onClick={() => setIsAddClassOpen(true)}
                  className="px-4 py-2.5 bg-[#1E3A8A] hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4 text-[#F59E0B]" />
                  <span>+ Create New Class Stream</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {classList.map((c) => {
                  const enrolledCount = students.filter(s => s.className === c.name || s.className?.includes(c.arm)).length || c.enrolled || 0;
                  return (
                    <div key={c.id || c.name} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3.5 hover:border-blue-300 transition-all">
                      <div className="flex items-center justify-between">
                        <span className="px-3 py-1 rounded-xl text-xs font-black bg-blue-50 text-[#1E3A8A] border border-blue-200">
                          {c.name}
                        </span>
                        <span className="text-[11px] font-bold text-slate-500 font-mono">Arm: {c.arm}</span>
                      </div>
                      <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <p><span className="font-bold text-slate-800">Form Teacher:</span> {c.teacher || 'Unassigned'}</p>
                        <p><span className="font-bold text-slate-800">Enrolled Students:</span> <span className="font-mono text-[#1E3A8A] font-bold">{enrolledCount}</span> / {c.capacity || 35}</p>
                      </div>
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                        <button
                          onClick={() => setViewClassStudents(c)}
                          className="px-2.5 py-1 text-xs font-bold text-[#1E3A8A] bg-blue-50 hover:bg-blue-100 rounded-lg cursor-pointer flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Roster</span>
                        </button>
                        
                        <button
                          onClick={() => setDeleteClassCandidate(c)}
                          className="px-2.5 py-1 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg cursor-pointer flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: MANAGE SUBJECTS */}
          {activeTab === 'subjects' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-[#0F172A] font-['Plus_Jakarta_Sans']">
                    Manage Curriculum Subjects
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Set up core and elective examination subjects for result calculation.
                  </p>
                </div>

                <button
                  onClick={() => setIsAddSubjectOpen(true)}
                  className="px-4 py-2.5 bg-[#1E3A8A] hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4 text-[#F59E0B]" />
                  <span>+ Create New Subject</span>
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                      <th className="p-4">Subject Title</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Lead Instructor</th>
                      <th className="p-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {subjectList.map((s) => (
                      <tr key={s.code || s.name} className="hover:bg-blue-50/30 transition-colors">
                        <td className="p-4 font-bold text-[#0F172A]">{s.name}</td>
                        <td className="p-4">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {s.category}
                          </span>
                        </td>
                        <td className="p-4 text-slate-700 font-semibold">{s.teacher}</td>
                        <td className="p-4 text-right space-x-2">
                          <button
                            onClick={() => setDeleteSubjectCandidate(s)}
                            className="px-2.5 py-1 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg cursor-pointer inline-flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: MANAGE ACADEMIC SESSIONS */}
          {activeTab === 'sessions' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-[#0F172A] font-['Plus_Jakarta_Sans']">
                    Manage Academic Sessions
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    Define annual calendar sessions, set active session, and edit academic duration.
                  </p>
                </div>

                <button
                  onClick={() => setIsAddSessionOpen(true)}
                  className="px-4 py-2.5 bg-[#1E3A8A] hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4 text-[#F59E0B]" />
                  <span>+ Create New Academic Session</span>
                </button>
              </div>

              <div className="space-y-3">
                {sessions.map((s) => (
                  <div key={s.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4 hover:border-blue-200 transition-all">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-black text-[#0F172A] font-['Plus_Jakarta_Sans']">{s.year} Session</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          s.status.includes('Active') ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {s.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        <span className="font-semibold text-slate-700">Academic Calendar:</span> {s.startDate} – {s.endDate}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {!s.status.includes('Active') && (
                        <button
                          onClick={() => handleSetActiveSession(s)}
                          className="px-3 py-1.5 bg-[#1E3A8A] hover:bg-blue-800 text-white font-bold text-xs rounded-xl cursor-pointer"
                        >
                          Set Active
                        </button>
                      )}
                      <button
                        onClick={() => setEditSessionCandidate(s)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-blue-50 text-[#1E3A8A] font-bold text-xs rounded-xl cursor-pointer"
                      >
                        Edit Parameters
                      </button>
                      <button
                        onClick={() => setDeleteSessionCandidate(s)}
                        className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs rounded-xl cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: MANAGE TERMS */}
          {activeTab === 'terms' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-[#0F172A] font-['Plus_Jakarta_Sans']">
                    Manage Academic Terms
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    Control term activation for score entry, resumption dates, and result publishing.
                  </p>
                </div>

                <button
                  onClick={() => setIsAddTermOpen(true)}
                  className="px-4 py-2.5 bg-[#1E3A8A] hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4 text-[#F59E0B]" />
                  <span>+ Add New Term</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {terms.map((t) => (
                  <div key={t.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 hover:border-blue-300 transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-extrabold text-[#1E3A8A] block">{t.name}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        t.status.includes('Active') ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {t.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <span className="font-bold text-slate-700">Resumption Date:</span> {t.resumption}
                    </p>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
                      {!t.status.includes('Active') && (
                        <button
                          onClick={() => handleSetActiveTerm(t)}
                          className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-xs rounded-lg cursor-pointer"
                        >
                          Set Active
                        </button>
                      )}

                      <button
                        onClick={() => setEditTermCandidate(t)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 text-[#1E3A8A] font-bold text-xs rounded-lg cursor-pointer"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => setDeleteTermCandidate(t)}
                        className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs rounded-lg cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: ENTER RESULTS */}
          {activeTab === 'enter-results' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <div>
                  <h2 className="text-xl font-black text-[#0F172A] font-['Plus_Jakarta_Sans']">
                    Enter Subject Examination Results
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Input CA 1 (10%), CA 2 (10%), Mid-Term (20%), and Final Examination (60%) marks.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 pt-2">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Target Class</label>
                    <select
                      value={scoreClass}
                      onChange={(e) => setScoreClass(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-[#0F172A]"
                    >
                      {allClassNames.map((cls) => (
                        <option key={cls} value={cls}>{cls}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Subject</label>
                    <select
                      value={scoreSubject}
                      onChange={(e) => setScoreSubject(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-[#0F172A]"
                    >
                      {allSubjectNames.length > 0 ? (
                        allSubjectNames.map((sub) => (
                          <option key={sub} value={sub}>{sub}</option>
                        ))
                      ) : (
                        <option value="" disabled>No subjects added yet — Add subjects under Manage Subjects tab</option>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Academic Session *</label>
                    <select
                      value={scoreSession}
                      onChange={(e) => setScoreSession(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-[#0F172A]"
                    >
                      {uniqueSessions.map((s) => {
                        const sessionVal = s.year.includes('Academic Session') ? s.year : `${s.year} Academic Session`;
                        return (
                          <option key={s.id} value={sessionVal}>
                            {s.year} Session{s.status?.includes('Active') ? ' (Active Current Session)' : ''}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Academic Term *</label>
                    <select
                      value={scoreTerm}
                      onChange={(e) => setScoreTerm(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-[#0F172A]"
                    >
                      {uniqueTerms.map((t) => (
                        <option key={t.id} value={t.name}>
                          {t.name}{t.status?.includes('Active') ? ' (Active Current Term)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button
                      onClick={() => triggerToast(`Loaded score entry sheet for ${scoreClass} - ${scoreSubject} (${scoreTerm}, ${scoreSession})`)}
                      className="w-full py-2.5 bg-[#1E3A8A] hover:bg-blue-800 text-white font-bold text-xs rounded-xl cursor-pointer"
                    >
                      Refresh Sheet ({scoreEntries.length})
                    </button>
                  </div>
                </div>
              </div>

              {/* Interactive Score Grid Table */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="p-4 bg-blue-50 border-b border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1E3A8A]">
                    Score Matrix: {scoreClass} • {scoreSubject} ({scoreTerm} — {scoreSession})
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">Max Total = 100%</span>
                </div>

                {scoreEntries.length === 0 ? (
                  <div className="p-10 text-center space-y-4 bg-slate-50/50">
                    <Users className="w-12 h-12 text-slate-400 mx-auto" />
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-[#0F172A]">No Students Registered in {scoreClass}</h4>
                      <p className="text-xs text-slate-500 max-w-md mx-auto">
                        There are currently no students assigned to class <span className="font-bold text-[#1E3A8A]">{scoreClass}</span> in the database.
                        Create a student record under this class to begin entering marks.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setNewStudent(prev => ({ ...prev, className: scoreClass }));
                        setIsAddStudentOpen(true);
                      }}
                      className="px-5 py-2.5 bg-[#1E3A8A] hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer inline-flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4 text-[#F59E0B]" />
                      <span>+ Register Student in {scoreClass}</span>
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase text-[10px]">
                            <th className="p-3">Student Name & ID</th>
                            <th className="p-3">CA 1 (10)</th>
                            <th className="p-3">CA 2 (10)</th>
                            <th className="p-3">Midterm (20)</th>
                            <th className="p-3">Exam (60)</th>
                            <th className="p-3">Total (100)</th>
                            <th className="p-3">Grade</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                          {scoreEntries.map((row, idx) => {
                            const total = Math.min(100, (row.ca1 || 0) + (row.ca2 || 0) + (row.midterm || 0) + (row.exam || 0));
                            const grade = total >= 80 ? 'A1' : total >= 70 ? 'B2' : total >= 65 ? 'B3' : total >= 60 ? 'C4' : total >= 50 ? 'C6' : total >= 40 ? 'E8' : 'F9';
                            return (
                              <tr key={row.id}>
                                <td className="p-3">
                                  <p className="font-bold text-[#0F172A]">{row.name}</p>
                                  <p className="font-mono text-[10px] text-[#1E3A8A] font-semibold">{row.id}</p>
                                </td>
                                <td className="p-3">
                                  <input
                                    type="number"
                                    min="0"
                                    max="10"
                                    value={row.ca1 ?? 0}
                                    onChange={(e) => {
                                      const val = Math.min(10, Math.max(0, Number(e.target.value) || 0));
                                      setScoreEntries(scoreEntries.map((item, i) => i === idx ? { ...item, ca1: val } : item));
                                    }}
                                    className="w-16 p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-center font-bold text-[#0F172A]"
                                  />
                                </td>
                                <td className="p-3">
                                  <input
                                    type="number"
                                    min="0"
                                    max="10"
                                    value={row.ca2 ?? 0}
                                    onChange={(e) => {
                                      const val = Math.min(10, Math.max(0, Number(e.target.value) || 0));
                                      setScoreEntries(scoreEntries.map((item, i) => i === idx ? { ...item, ca2: val } : item));
                                    }}
                                    className="w-16 p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-center font-bold text-[#0F172A]"
                                  />
                                </td>
                                <td className="p-3">
                                  <input
                                    type="number"
                                    min="0"
                                    max="20"
                                    value={row.midterm ?? 0}
                                    onChange={(e) => {
                                      const val = Math.min(20, Math.max(0, Number(e.target.value) || 0));
                                      setScoreEntries(scoreEntries.map((item, i) => i === idx ? { ...item, midterm: val } : item));
                                    }}
                                    className="w-16 p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-center font-bold text-[#0F172A]"
                                  />
                                </td>
                                <td className="p-3">
                                  <input
                                    type="number"
                                    min="0"
                                    max="60"
                                    value={row.exam ?? 0}
                                    onChange={(e) => {
                                      const val = Math.min(60, Math.max(0, Number(e.target.value) || 0));
                                      setScoreEntries(scoreEntries.map((item, i) => i === idx ? { ...item, exam: val } : item));
                                    }}
                                    className="w-16 p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-center font-bold text-[#0F172A]"
                                  />
                                </td>
                                <td className="p-3 font-bold font-mono text-[#1E3A8A] text-sm">{total}%</td>
                                <td className="p-3">
                                  <span className={`px-2 py-0.5 rounded font-extrabold text-xs ${
                                    grade === 'F9' || grade.startsWith('F') ? 'bg-red-100 text-red-700 border border-red-300 font-black' :
                                    grade.startsWith('A') ? 'bg-emerald-100 text-emerald-800' :
                                    grade.startsWith('B') ? 'bg-blue-100 text-blue-800' :
                                    grade.startsWith('C') ? 'bg-amber-100 text-amber-800' :
                                    'bg-red-100 text-red-800'
                                  }`}>
                                    {grade}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                      <span className="text-xs text-slate-500 font-medium">
                        Showing <strong className="text-[#0F172A]">{scoreEntries.length}</strong> student record(s) for <strong className="text-[#1E3A8A]">{scoreClass}</strong>
                      </span>
                      <button
                        onClick={handleSaveScores}
                        className="px-6 py-2.5 bg-[#1E3A8A] hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-2"
                      >
                        <Save className="w-4 h-4 text-[#F59E0B]" />
                        <span>Save & Publish Scores</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* RESULT MANAGEMENT WORKSPACE */}
          {(activeTab === 'manage-results' || activeTab === 'edit-results') && (
            <AdminResultManagement
              students={students}
              sessions={sessions}
              terms={terms}
              classList={classList}
              subjectList={subjectList}
              schoolHeader={schoolHeader}
              branding={{
                logoUrl: logoPreview,
                stampUrl: stampPreview,
                signatureUrl: signaturePreview,
                principalRemark: null,
                positions: brandingPositions,
              }}
              onUpdateStudent={(updated) => {
                setStudents(prev => prev.map(s => s.studentId === updated.studentId ? updated : s));
                api.updateStudent(updated.studentId, updated).catch(err => console.error('Failed to sync student:', err));
              }}
              onViewResultSlip={(studentObj, termRecord) => {
                setSelectedStudentResult(studentObj);
                setIsViewResultOpen(true);
              }}
              onEditStudentProfile={(studentObj) => {
                setEditingStudent(studentObj);
                setIsEditStudentOpen(true);
              }}
              onTriggerToast={triggerToast}
              initialSelectedStudentId={selectedResultStudentId}
            />
          )}

          {/* TAB 8: RESULT HISTORY */}
          {activeTab === 'result-history' && (
            <div className="space-y-6">
              {/* Header Card & Student Search Bar */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1E3A8A] flex items-center justify-center font-bold">
                      <History className="w-6 h-6 text-[#1E3A8A]" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-[#0F172A] font-['Plus_Jakarta_Sans']">
                        Student Result History Explorer
                      </h2>
                      <p className="text-xs text-slate-500">
                        Search and fetch any student to view their complete multi-term academic results organized by Class → Academic Session → Academic Term.
                      </p>
                    </div>
                  </div>

                  {historyStudent && (
                    <button
                      type="button"
                      onClick={() => {
                        setHistoryStudent(null);
                        setHistorySearchQuery('');
                      }}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer transition-all self-start sm:self-auto"
                    >
                      Clear Selection
                    </button>
                  )}
                </div>

                {/* Search Bar Input */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Enter Student Reg ID (e.g. 2025104) or Full Name..."
                      value={historySearchQuery}
                      onChange={(e) => setHistorySearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleFetchStudentForHistory();
                        }
                      }}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleFetchStudentForHistory()}
                    className="px-6 py-2.5 bg-[#1E3A8A] hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Search className="w-4 h-4 text-[#F59E0B]" />
                    <span>Fetch Academic History</span>
                  </button>
                </div>

                {/* Quick Selection Badges */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 text-[11px]">
                  <span className="text-slate-400 font-bold uppercase tracking-wider shrink-0 text-[10px]">Quick Select:</span>
                  {students.slice(0, 8).map(st => (
                    <button
                      key={st.studentId}
                      type="button"
                      onClick={() => handleFetchStudentForHistory(st.studentId)}
                      className={`px-2.5 py-1 rounded-lg border font-mono font-bold transition-all cursor-pointer shrink-0 ${
                        historyStudent?.studentId === st.studentId
                          ? 'bg-[#1E3A8A] text-white border-[#1E3A8A]'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {st.fullName || st.name} ({st.studentId})
                    </button>
                  ))}
                </div>
              </div>

              {/* Display Result History when Student is Selected */}
              {historyStudent ? (
                <div className="space-y-6">
                  {/* Top Profile Summary Card */}
                  <div className="bg-gradient-to-r from-[#1E3A8A] to-blue-950 p-6 rounded-3xl text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-white/20 bg-white/10 shrink-0 shadow-md">
                        <img
                          src={historyStudent.passportUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'}
                          alt={historyStudent.fullName || (historyStudent as any).name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-black font-['Plus_Jakarta_Sans']">
                            {historyStudent.fullName || (historyStudent as any).name}
                          </h3>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#F59E0B] text-slate-900 font-mono">
                            {historyStudent.studentId}
                          </span>
                        </div>
                        <p className="text-xs text-blue-200">
                          Class: <strong className="text-white">{historyStudent.className}</strong> • Gender: <strong className="text-white">{historyStudent.gender || 'N/A'}</strong> • House: <strong className="text-white">{historyStudent.house || 'N/A'}</strong>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="bg-white/10 px-4 py-2.5 rounded-2xl border border-white/10 text-center">
                        <span className="text-[10px] uppercase text-blue-200 font-bold block">Class Streams</span>
                        <span className="text-base font-black font-mono text-white">
                          {organizedHistoryByClass.length}
                        </span>
                      </div>

                      <div className="bg-white/10 px-4 py-2.5 rounded-2xl border border-white/10 text-center">
                        <span className="text-[10px] uppercase text-blue-200 font-bold block">Terminal Records</span>
                        <span className="text-base font-black font-mono text-[#F59E0B]">
                          {organizedHistoryByClass.reduce((acc, c) => acc + c.sessions.reduce((sAcc, s) => sAcc + s.terms.length, 0), 0)}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setEditingStudent(historyStudent);
                          setIsEditStudentOpen(true);
                        }}
                        className="px-4 py-2.5 bg-[#F59E0B] hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1.5 shrink-0 shadow-xs"
                      >
                        <FileEdit className="w-4 h-4" />
                        <span>Edit Profile</span>
                      </button>
                    </div>
                  </div>

                  {/* Organized Multi-Term Results: Class -> Academic Session -> Academic Term */}
                  {organizedHistoryByClass.length === 0 ? (
                    <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-2">
                      <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
                      <h4 className="text-sm font-bold text-slate-800">No Academic Results Logged</h4>
                      <p className="text-xs text-slate-500">
                        No examination scores or terminal result slips have been logged for this student yet.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {organizedHistoryByClass.map((classGroup) => (
                        <div
                          key={classGroup.className}
                          className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden space-y-4"
                        >
                          {/* Class Header Bar */}
                          <div className="bg-slate-900 text-white px-6 py-3.5 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <GraduationCap className="w-5 h-5 text-[#F59E0B]" />
                              <h3 className="text-sm font-black font-['Plus_Jakarta_Sans'] uppercase tracking-wider">
                                Class: {classGroup.className}
                              </h3>
                            </div>
                            <span className="text-[11px] font-mono font-bold bg-white/10 px-2.5 py-0.5 rounded-lg text-slate-200">
                              {classGroup.sessions.length} Session{classGroup.sessions.length !== 1 ? 's' : ''}
                            </span>
                          </div>

                          {/* Sessions Container */}
                          <div className="p-6 space-y-6">
                            {classGroup.sessions.map((sessionGroup) => (
                              <div
                                key={sessionGroup.session}
                                className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden"
                              >
                                {/* Session Sub-Header */}
                                <div className="bg-slate-100 px-5 py-3 border-b border-slate-200 flex items-center justify-between">
                                  <div className="flex items-center gap-2 text-xs font-bold text-[#1E3A8A]">
                                    <Calendar className="w-4 h-4 text-[#F59E0B]" />
                                    <span>Academic Session: <strong>{sessionGroup.session}</strong></span>
                                  </div>
                                  <span className="text-[11px] text-slate-500 font-semibold">
                                    {sessionGroup.terms.length} Term Record{sessionGroup.terms.length !== 1 ? 's' : ''}
                                  </span>
                                </div>

                                {/* Terms Table */}
                                <div className="overflow-x-auto">
                                  <table className="w-full text-left border-collapse min-w-[700px]">
                                    <thead>
                                      <tr className="bg-white border-b border-slate-200 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                                        <th className="py-3 px-4">Academic Term</th>
                                        <th className="py-3 px-3 text-center">Status</th>
                                        <th className="py-3 px-3 text-center">Subjects</th>
                                        <th className="py-3 px-3 text-center">Total Score</th>
                                        <th className="py-3 px-3 text-center">Average %</th>
                                        <th className="py-3 px-3 text-center">GPA</th>
                                        <th className="py-3 px-4">Date Published</th>
                                        <th className="py-3 px-4 text-right">Actions</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-xs bg-white">
                                      {sessionGroup.terms.map((termItem) => {
                                        const isPub = termItem.status === 'Published';
                                        const isPending = termItem.status === 'Pending';

                                        return (
                                          <tr
                                            key={`${sessionGroup.session}_${termItem.term}`}
                                            className="hover:bg-slate-50/80 transition-colors"
                                          >
                                            {/* Term Name */}
                                            <td className="py-3.5 px-4 font-bold text-[#0F172A]">
                                              <div className="flex items-center gap-2">
                                                <Clock className="w-3.5 h-3.5 text-[#1E3A8A]" />
                                                <span>{termItem.term}</span>
                                              </div>
                                            </td>

                                            {/* Status Badge */}
                                            <td className="py-3.5 px-3 text-center">
                                              {isPub ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                                  <span>Published</span>
                                                </span>
                                              ) : isPending ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                                  <Clock className="w-3 h-3 text-amber-600" />
                                                  <span>Pending</span>
                                                </span>
                                              ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                                  <AlertCircle className="w-3 h-3 text-slate-400" />
                                                  <span>Not Published</span>
                                                </span>
                                              )}
                                            </td>

                                            {/* Subjects Count */}
                                            <td className="py-3.5 px-3 text-center font-mono font-bold text-slate-700">
                                              {termItem.subjectsCount}
                                            </td>

                                            {/* Total Score */}
                                            <td className="py-3.5 px-3 text-center font-mono font-bold text-slate-900">
                                              {termItem.totalScore > 0 ? termItem.totalScore : '—'}
                                            </td>

                                            {/* Average Score */}
                                            <td className="py-3.5 px-3 text-center font-mono font-black text-[#1E3A8A]">
                                              {termItem.averageScore > 0 ? `${termItem.averageScore}%` : '—'}
                                            </td>

                                            {/* GPA */}
                                            <td className="py-3.5 px-3 text-center font-mono font-bold text-amber-700">
                                              {termItem.gpa > 0 ? termItem.gpa : '—'}
                                            </td>

                                            {/* Date Published */}
                                            <td className="py-3.5 px-4 font-mono text-slate-500 text-[11px]">
                                              {termItem.datePublished}
                                            </td>

                                            {/* Action Buttons: View, Edit, Print */}
                                            <td className="py-3.5 px-4 text-right">
                                              <div className="flex items-center justify-end gap-1.5">
                                                {/* View / Open Slip */}
                                                <button
                                                  type="button"
                                                  onClick={() => handleViewHistoricalTermModal(historyStudent, termItem.rawRecord || {
                                                    academicSession: termItem.session,
                                                    term: termItem.term,
                                                    className: termItem.className,
                                                  })}
                                                  className="p-1.5 bg-blue-50 hover:bg-blue-100 text-[#1E3A8A] rounded-lg cursor-pointer transition-all border border-blue-200 shadow-2xs"
                                                  title="View / Print Official Result Slip"
                                                >
                                                  <Eye className="w-4 h-4" />
                                                </button>

                                                {/* Edit Result */}
                                                <button
                                                  type="button"
                                                  onClick={() => handleEditHistoricalTerm(termItem.rawRecord)}
                                                  className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg cursor-pointer transition-all border border-amber-200 shadow-2xs"
                                                  title="Edit Subject Scores for this Term"
                                                >
                                                  <FileEdit className="w-4 h-4" />
                                                </button>
                                              </div>
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white p-12 rounded-3xl border border-slate-200 shadow-xs text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto text-[#1E3A8A]">
                    <History className="w-8 h-8 text-[#1E3A8A]" />
                  </div>
                  <div className="space-y-1 max-w-md mx-auto">
                    <h3 className="text-base font-black text-[#0F172A] font-['Plus_Jakarta_Sans']">
                      Search & Select a Student
                    </h3>
                    <p className="text-xs text-slate-500">
                      Enter an official registration ID (e.g. <strong className="text-[#1E3A8A]">2025104</strong>) or click a quick student button above to view their comprehensive academic result history across all enrolled classes, academic sessions, and terms.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 9: DELETE RESULTS */}
          {activeTab === 'delete-results' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center gap-3 text-red-600">
                  <Trash2 className="w-6 h-6" />
                  <h2 className="text-xl font-black font-['Plus_Jakarta_Sans']">
                    Delete / Purge Result Slips
                  </h2>
                </div>
                <p className="text-xs text-slate-500">
                  Warning: Deleting a result slip removes it permanently from student portal access.
                </p>

                <div className="space-y-2">
                  {students.slice(0, 3).map((st) => (
                    <div key={st.studentId} className="p-4 bg-red-50/40 border border-red-100 rounded-2xl flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-[#0F172A]">{st.name} ({st.studentId})</p>
                        <p className="text-[10px] text-slate-500">{st.className} • Average {st.averageScore}%</p>
                      </div>

                      <button
                        onClick={() => {
                          setDeleteCandidateId(st.studentId);
                        }}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl cursor-pointer"
                      >
                        Delete Result
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 10: UPLOAD SCHOOL LOGO */}
          {activeTab === 'upload-logo' && (
            <div className="space-y-6">
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#1E3A8A] flex items-center justify-center font-bold">
                      <ImageIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-[#0F172A] font-['Plus_Jakarta_Sans']">
                        Upload School Official Crest / Logo
                      </h2>
                      <p className="text-xs text-slate-500">
                        The official emblem appears on result slips, header banners, transcripts, and diplomas.
                      </p>
                    </div>
                  </div>
                  {logoPreview?.includes('res.cloudinary.com') && (
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-[11px] font-bold flex items-center gap-1.5">
                      <Cloud className="w-3.5 h-3.5 text-emerald-600" />
                      Hosted on Cloudinary CDN
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                  {/* Current Preview Card */}
                  <div className="md:col-span-4 bg-slate-50 p-6 rounded-3xl border border-slate-200 text-center space-y-3">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                      Active Logo Preview
                    </span>
                    <div className="w-28 h-28 mx-auto rounded-2xl bg-white border border-slate-200 flex items-center justify-center p-3 shadow-sm overflow-hidden relative">
                      {logoPreview ? (
                        <img src={logoPreview} alt="School Logo Preview" className="w-full h-full object-contain" />
                      ) : (
                        <SchoolLogo size="lg" />
                      )}
                    </div>
                    {logoPreview && (
                      <button
                        onClick={() => {
                          setLogoPreview(null);
                          api.updateBranding('logoUrl', '');
                          triggerToast('School logo reset.');
                        }}
                        className="text-xs text-red-600 hover:text-red-700 font-bold underline cursor-pointer"
                      >
                        Remove Custom Logo
                      </button>
                    )}
                  </div>

                  {/* Upload Drop Zone */}
                  <div className="md:col-span-8 border-2 border-dashed border-slate-300 hover:border-[#1E3A8A] bg-white rounded-3xl p-6 sm:p-8 text-center space-y-4 transition-all shadow-xs">
                    <div className="w-12 h-12 rounded-2xl bg-white border border-blue-100 text-[#1E3A8A] flex items-center justify-center mx-auto shadow-xs">
                      {isUploadingBranding === 'logoUrl' ? (
                        <RefreshCw className="w-6 h-6 animate-spin text-[#1E3A8A]" />
                      ) : (
                        <Upload className="w-6 h-6" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-black text-[#0F172A]">
                        {isUploadingBranding === 'logoUrl' ? 'Uploading to Cloudinary CDN & MongoDB...' : 'Upload New Official Logo Image'}
                      </p>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        PNG, SVG or WEBP recommended (transparent background, minimum 512x512px).
                      </p>
                    </div>

                    <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1E3A8A] hover:bg-blue-800 text-white font-bold text-xs rounded-2xl cursor-pointer shadow-md transition-all">
                      <Upload className="w-4 h-4" />
                      <span>{isUploadingBranding === 'logoUrl' ? 'Processing...' : 'Choose Logo File'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={isUploadingBranding === 'logoUrl'}
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            handleBrandingFileUpload('logoUrl', e.target.files[0]);
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Position & Scale Adjustments */}
                <div className="border-t border-slate-100 pt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-[#1E3A8A]" />
                      <span>Logo Layout Position & Scale Adjustments</span>
                    </h3>
                    <button
                      type="button"
                      onClick={handleSavePositions}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Coordinates</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">X Offset: {brandingPositions.logo.x}px</label>
                      <input
                        type="range"
                        min="-100"
                        max="100"
                        value={brandingPositions.logo.x}
                        onChange={(e) =>
                          setBrandingPositions((prev) => ({
                            ...prev,
                            logo: { ...prev.logo, x: Number(e.target.value) },
                          }))
                        }
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#1E3A8A]"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Y Offset: {brandingPositions.logo.y}px</label>
                      <input
                        type="range"
                        min="-100"
                        max="100"
                        value={brandingPositions.logo.y}
                        onChange={(e) =>
                          setBrandingPositions((prev) => ({
                            ...prev,
                            logo: { ...prev.logo, y: Number(e.target.value) },
                          }))
                        }
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#1E3A8A]"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Scale: {brandingPositions.logo.scale}x</label>
                      <input
                        type="range"
                        min="0.5"
                        max="2.5"
                        step="0.05"
                        value={brandingPositions.logo.scale}
                        onChange={(e) =>
                          setBrandingPositions((prev) => ({
                            ...prev,
                            logo: { ...prev.logo, scale: Number(e.target.value) },
                          }))
                        }
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#1E3A8A]"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Rotate: {brandingPositions.logo.rotate}°</label>
                      <input
                        type="range"
                        min="-180"
                        max="180"
                        value={brandingPositions.logo.rotate}
                        onChange={(e) =>
                          setBrandingPositions((prev) => ({
                            ...prev,
                            logo: { ...prev.logo, rotate: Number(e.target.value) },
                          }))
                        }
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#1E3A8A]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 11: UPLOAD SCHOOL STAMP */}
          {activeTab === 'upload-stamp' && (
            <div className="space-y-6">
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-50 text-[#F59E0B] flex items-center justify-center font-bold">
                      <Award className="w-5 h-5 text-[#1E3A8A]" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-[#0F172A] font-['Plus_Jakarta_Sans']">
                        Upload School Official Stamp & Security Seal
                      </h2>
                      <p className="text-xs text-slate-500">
                        Official Registrar / Examination Board ink stamp applied to printable result sheets for cryptographic validation.
                      </p>
                    </div>
                  </div>
                  {stampPreview?.includes('res.cloudinary.com') && (
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-[11px] font-bold flex items-center gap-1.5">
                      <Cloud className="w-3.5 h-3.5 text-emerald-600" />
                      Hosted on Cloudinary CDN
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                  {/* Current Stamp Preview Card */}
                  <div className="md:col-span-4 bg-slate-50 p-6 rounded-3xl border border-slate-200 text-center space-y-3">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                      Active Official Stamp Preview
                    </span>
                    <div className="w-28 h-28 mx-auto rounded-2xl bg-white border border-slate-200 flex items-center justify-center p-3 shadow-sm overflow-hidden relative">
                      {stampPreview ? (
                        <img src={stampPreview} alt="School Stamp Preview" className="max-w-full max-h-full object-contain" />
                      ) : (
                        <div className="w-20 h-20 rounded-full border-2 border-dashed border-[#1E3A8A] flex flex-col items-center justify-center p-1 text-center bg-blue-50/50">
                          <span className="text-[7px] font-black uppercase text-[#1E3A8A]">ROYAL ACADEMY</span>
                          <Award className="w-4 h-4 text-[#1E3A8A] my-0.5" />
                          <span className="text-[6px] font-bold text-[#1E3A8A]">DEFAULT STAMP</span>
                        </div>
                      )}
                    </div>
                    {stampPreview && (
                      <button
                        onClick={() => {
                          setStampPreview(null);
                          api.updateBranding('stampUrl', '');
                          triggerToast('School stamp reset to default.');
                        }}
                        className="text-xs text-red-600 hover:text-red-700 font-bold underline cursor-pointer"
                      >
                        Remove Custom Stamp
                      </button>
                    )}
                  </div>

                  {/* Stamp Upload Drop Zone */}
                  <div className="md:col-span-8 border-2 border-dashed border-slate-300 hover:border-[#F59E0B] bg-white rounded-3xl p-6 sm:p-8 text-center space-y-4 transition-all shadow-xs">
                    <div className="w-12 h-12 rounded-2xl bg-white border border-amber-100 text-[#F59E0B] flex items-center justify-center mx-auto shadow-xs">
                      {isUploadingBranding === 'stampUrl' ? (
                        <RefreshCw className="w-6 h-6 animate-spin text-[#F59E0B]" />
                      ) : (
                        <Award className="w-6 h-6 text-[#1E3A8A]" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-black text-[#0F172A]">
                        {isUploadingBranding === 'stampUrl' ? 'Uploading Stamp to Cloudinary CDN & MongoDB...' : 'Upload Official Ink Stamp Image'}
                      </p>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        PNG or WEBP format with transparent layer recommended for crisp printout rendering.
                      </p>
                    </div>

                    <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1E3A8A] hover:bg-blue-800 text-white font-bold text-xs rounded-2xl cursor-pointer shadow-md transition-all">
                      <Upload className="w-4 h-4" />
                      <span>{isUploadingBranding === 'stampUrl' ? 'Processing...' : 'Select Stamp Image File'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={isUploadingBranding === 'stampUrl'}
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            handleBrandingFileUpload('stampUrl', e.target.files[0]);
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Position & Scale Adjustments for Stamp */}
                <div className="border-t border-slate-100 pt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-[#1E3A8A]" />
                      <span>Official Stamp Position & Scale Adjustments</span>
                    </h3>
                    <button
                      type="button"
                      onClick={handleSavePositions}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Coordinates</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">X Offset: {brandingPositions.stamp.x}px</label>
                      <input
                        type="range"
                        min="-100"
                        max="100"
                        value={brandingPositions.stamp.x}
                        onChange={(e) =>
                          setBrandingPositions((prev) => ({
                            ...prev,
                            stamp: { ...prev.stamp, x: Number(e.target.value) },
                          }))
                        }
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#1E3A8A]"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Y Offset: {brandingPositions.stamp.y}px</label>
                      <input
                        type="range"
                        min="-100"
                        max="100"
                        value={brandingPositions.stamp.y}
                        onChange={(e) =>
                          setBrandingPositions((prev) => ({
                            ...prev,
                            stamp: { ...prev.stamp, y: Number(e.target.value) },
                          }))
                        }
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#1E3A8A]"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Scale: {brandingPositions.stamp.scale}x</label>
                      <input
                        type="range"
                        min="0.5"
                        max="2.5"
                        step="0.05"
                        value={brandingPositions.stamp.scale}
                        onChange={(e) =>
                          setBrandingPositions((prev) => ({
                            ...prev,
                            stamp: { ...prev.stamp, scale: Number(e.target.value) },
                          }))
                        }
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#1E3A8A]"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Rotate: {brandingPositions.stamp.rotate}°</label>
                      <input
                        type="range"
                        min="-180"
                        max="180"
                        value={brandingPositions.stamp.rotate}
                        onChange={(e) =>
                          setBrandingPositions((prev) => ({
                            ...prev,
                            stamp: { ...prev.stamp, rotate: Number(e.target.value) },
                          }))
                        }
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#1E3A8A]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 12: UPLOAD PRINCIPAL SIGNATURE */}
          {activeTab === 'upload-signature' && (
            <div className="space-y-6">
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                      <PenTool className="w-5 h-5 text-[#F59E0B]" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-[#0F172A] font-['Plus_Jakarta_Sans']">
                        Upload Principal's Digital Signature
                      </h2>
                      <p className="text-xs text-slate-500">
                        Digital signature authorization attached to published student academic report slips.
                      </p>
                    </div>
                  </div>
                  {signaturePreview?.includes('res.cloudinary.com') && (
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-[11px] font-bold flex items-center gap-1.5">
                      <Cloud className="w-3.5 h-3.5 text-emerald-600" />
                      Hosted on Cloudinary CDN
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                  {/* Current Signature Preview Card */}
                  <div className="md:col-span-4 bg-slate-50 p-6 rounded-3xl border border-slate-200 text-center space-y-3">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                      Active Signature Preview
                    </span>
                    <div className="w-full h-24 rounded-2xl bg-white border border-slate-200 flex items-center justify-center p-3 shadow-sm overflow-hidden relative">
                      {signaturePreview ? (
                        <img src={signaturePreview} alt="Principal Signature Preview" className="max-w-full max-h-full object-contain" />
                      ) : (
                        <span className="font-serif italic font-bold text-lg text-[#1E3A8A]">
                          Dr. H. E. Montgomery
                        </span>
                      )}
                    </div>
                    {signaturePreview && (
                      <button
                        onClick={() => {
                          setSignaturePreview(null);
                          api.updateBranding('signatureUrl', '');
                          triggerToast('Principal signature reset.');
                        }}
                        className="text-xs text-red-600 hover:text-red-700 font-bold underline cursor-pointer"
                      >
                        Remove Custom Signature
                      </button>
                    )}
                  </div>

                  {/* Signature Upload Drop Zone */}
                  <div className="md:col-span-8 border-2 border-dashed border-slate-300 hover:border-purple-600 bg-white rounded-3xl p-6 sm:p-8 text-center space-y-4 transition-all shadow-xs">
                    <div className="w-12 h-12 rounded-2xl bg-white border border-purple-100 text-purple-600 flex items-center justify-center mx-auto shadow-xs">
                      {isUploadingBranding === 'signatureUrl' ? (
                        <RefreshCw className="w-6 h-6 animate-spin text-purple-600" />
                      ) : (
                        <PenTool className="w-6 h-6 text-[#F59E0B]" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-black text-[#0F172A]">
                        {isUploadingBranding === 'signatureUrl' ? 'Uploading Signature to Cloudinary CDN & MongoDB...' : 'Upload Principal Signature Image'}
                      </p>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        Transparent PNG or scanned signature image file.
                      </p>
                    </div>

                    <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1E3A8A] hover:bg-blue-800 text-white font-bold text-xs rounded-2xl cursor-pointer shadow-md transition-all">
                      <Upload className="w-4 h-4" />
                      <span>{isUploadingBranding === 'signatureUrl' ? 'Processing...' : 'Select Signature File'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={isUploadingBranding === 'signatureUrl'}
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            handleBrandingFileUpload('signatureUrl', e.target.files[0]);
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Position & Scale Adjustments for Signature */}
                <div className="border-t border-slate-100 pt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-[#1E3A8A]" />
                      <span>Signature Position & Scale Adjustments</span>
                    </h3>
                    <button
                      type="button"
                      onClick={handleSavePositions}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Coordinates</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">X Offset: {brandingPositions.signature.x}px</label>
                      <input
                        type="range"
                        min="-100"
                        max="100"
                        value={brandingPositions.signature.x}
                        onChange={(e) =>
                          setBrandingPositions((prev) => ({
                            ...prev,
                            signature: { ...prev.signature, x: Number(e.target.value) },
                          }))
                        }
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#1E3A8A]"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Y Offset: {brandingPositions.signature.y}px</label>
                      <input
                        type="range"
                        min="-100"
                        max="100"
                        value={brandingPositions.signature.y}
                        onChange={(e) =>
                          setBrandingPositions((prev) => ({
                            ...prev,
                            signature: { ...prev.signature, y: Number(e.target.value) },
                          }))
                        }
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#1E3A8A]"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Scale: {brandingPositions.signature.scale}x</label>
                      <input
                        type="range"
                        min="0.5"
                        max="2.5"
                        step="0.05"
                        value={brandingPositions.signature.scale}
                        onChange={(e) =>
                          setBrandingPositions((prev) => ({
                            ...prev,
                            signature: { ...prev.signature, scale: Number(e.target.value) },
                          }))
                        }
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#1E3A8A]"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Rotate: {brandingPositions.signature.rotate}°</label>
                      <input
                        type="range"
                        min="-180"
                        max="180"
                        value={brandingPositions.signature.rotate}
                        onChange={(e) =>
                          setBrandingPositions((prev) => ({
                            ...prev,
                            signature: { ...prev.signature, rotate: Number(e.target.value) },
                          }))
                        }
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#1E3A8A]"
                      />
                    </div>
                  </div>
                </div>

                {/* Principal Official Remark & Comment Section */}
                <div className="border-t-2 border-slate-200 pt-8 mt-8 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-6 rounded-3xl text-white shadow-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-amber-400 font-bold border border-white/10">
                        <MessageSquare className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black font-['Plus_Jakarta_Sans'] flex items-center gap-2">
                          <span>Principal's Official Remark & Comment</span>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-500/20 text-amber-300 border border-amber-400/30">
                            Global Default
                          </span>
                        </h3>
                        <p className="text-xs text-slate-300 max-w-xl">
                          This comment remains constant across all student results on the online result portal. When students print or download their official result slip, the system dynamically generates a Principal's Remark tailored to their academic performance.
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSaveGlobalPrincipalRemark}
                        disabled={isSavingPrincipalRemark}
                        className="px-5 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {isSavingPrincipalRemark ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4" />
                        )}
                        <span>{isSavingPrincipalRemark ? 'Saving & Applying...' : 'Save & Apply to All Results'}</span>
                      </button>
                      {globalPrincipalRemark ? (
                        <button
                          type="button"
                          onClick={handleDeleteGlobalPrincipalRemark}
                          disabled={isSavingPrincipalRemark}
                          className="px-4 py-3 bg-rose-500/20 hover:bg-rose-600 text-rose-200 hover:text-white border border-rose-500/30 font-extrabold text-xs rounded-2xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                          title="Delete and remove comment from all results"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Delete Comment</span>
                        </button>
                      ) : null}
                    </div>
                  </div>

                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                        Official Principal Comment Text:
                      </label>
                      {globalPrincipalRemark ? (
                        <button
                          type="button"
                          onClick={handleDeleteGlobalPrincipalRemark}
                          disabled={isSavingPrincipalRemark}
                          className="text-xs font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete / Clear Comment</span>
                        </button>
                      ) : null}
                    </div>
                    <textarea
                      rows={3}
                      value={globalPrincipalRemark}
                      onChange={(e) => setGlobalPrincipalRemark(e.target.value)}
                      placeholder="Type the principal's official comment here..."
                      className="w-full p-4 text-sm font-medium text-slate-900 bg-white border border-slate-300 rounded-2xl focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent transition-all shadow-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 13: GENERATE REPORTS & CLASS BROADSHEETS */}
          {activeTab === 'reports' && (() => {
            const currentClassInfo = classList.find(c => c.name === selectedReportClass);
            const currentClassTeacher = currentClassInfo?.teacher || 'Unassigned';
            
            const classFilteredStudents = students.filter(s => {
              // Find matching term record from database
              const matchingRecord = s.termRecords?.find(
                r => (r.academicSession === selectedReportSession || r.academicSession?.includes(selectedReportSession.split(' ')[0])) &&
                     (r.term === selectedReportTerm || r.term?.includes(selectedReportTerm))
              );

              const activeClass = matchingRecord?.className || s.className;
              const matchesClass = selectedReportClass === 'All' || activeClass === selectedReportClass || activeClass?.includes(selectedReportClass);
              const matchesSearch = !reportSearchQuery || (s.fullName || (s as any).name || '').toLowerCase().includes(reportSearchQuery.toLowerCase()) || (s.studentId || '').toLowerCase().includes(reportSearchQuery.toLowerCase());

              const hasResultForTerm = Boolean(matchingRecord) || (
                (s.academicSession === selectedReportSession || (s as any).session === selectedReportSession) &&
                s.term === selectedReportTerm
              );

              return matchesClass && matchesSearch && hasResultForTerm;
            });

            // Map each student to their exact term record for selected session and term from database
            const mappedClassStudents = classFilteredStudents.map(s => {
              const rec = s.termRecords?.find(
                r => (r.academicSession === selectedReportSession || r.academicSession?.includes(selectedReportSession.split(' ')[0])) &&
                     (r.term === selectedReportTerm || r.term?.includes(selectedReportTerm))
              );
              
              if (rec) {
                let actualAverage = 0;
                let actualTotal = 0;
                if (Array.isArray(rec.subjects) && rec.subjects.length > 0) {
                  const scores = rec.subjects.map((sub: any) => Number(sub.score || sub.total || 0));
                  actualTotal = scores.reduce((a: number, b: number) => a + b, 0);
                  actualAverage = Number((actualTotal / scores.length).toFixed(1));
                } else if (rec.overallAverage !== undefined && rec.overallAverage !== null) {
                  actualAverage = Number(rec.overallAverage);
                  actualTotal = Number(rec.overallTotal || 0);
                } else if (rec.averageScore !== undefined && rec.averageScore !== null) {
                  actualAverage = Number(rec.averageScore);
                } else if (rec.gpa !== undefined && rec.gpa !== null) {
                  actualAverage = Number((rec.gpa * 25).toFixed(1));
                }

                return {
                  ...s,
                  className: rec.className || s.className,
                  subjects: rec.subjects || [],
                  overallTotal: actualTotal,
                  overallAverage: actualAverage,
                  averageScore: actualAverage,
                  gpa: rec.gpa ?? (actualAverage > 0 ? Number((actualAverage / 25).toFixed(2)) : 0),
                  status: rec.status || s.status,
                  isPublished: rec.isPublished ?? s.isPublished,
                };
              }

              // Top level database record
              let actualAverage = 0;
              let actualTotal = 0;
              if (Array.isArray(s.subjects) && s.subjects.length > 0) {
                const scores = s.subjects.map((sub: any) => Number(sub.score || sub.total || 0));
                actualTotal = scores.reduce((a: number, b: number) => a + b, 0);
                actualAverage = Number((actualTotal / scores.length).toFixed(1));
              } else if (s.overallAverage !== undefined && s.overallAverage !== null) {
                actualAverage = Number(s.overallAverage);
                actualTotal = Number(s.overallTotal || 0);
              } else if (s.averageScore !== undefined && s.averageScore !== null) {
                actualAverage = Number(s.averageScore);
              } else if (s.gpa !== undefined && s.gpa !== null) {
                actualAverage = Number((s.gpa * 25).toFixed(1));
              }

              return {
                ...s,
                subjects: s.subjects || [],
                overallTotal: actualTotal,
                overallAverage: actualAverage,
                averageScore: actualAverage,
                gpa: s.gpa ?? (actualAverage > 0 ? Number((actualAverage / 25).toFixed(2)) : 0),
              };
            });

            // Sort by score for ranking (highest scores first)
            const rankedClassStudents = [...mappedClassStudents].sort((a, b) => {
              const scoreA = Number(a.averageScore || a.overallAverage || 0);
              const scoreB = Number(b.averageScore || b.overallAverage || 0);
              return scoreB - scoreA;
            });

            const uniqueTeachers = Array.from(new Set(subjectList.map(s => s.teacher).filter(Boolean)));
            const totalTeachersCount = uniqueTeachers.length;

            const totalClassCount = classFilteredStudents.length;
            const studentsWithScores = rankedClassStudents.filter(s => Number(s.averageScore || s.overallAverage || 0) > 0);
            const avgSum = studentsWithScores.reduce((acc, s) => acc + Number(s.averageScore || s.overallAverage || 0), 0);
            const classAvg = studentsWithScores.length > 0 ? (avgSum / studentsWithScores.length).toFixed(1) : '0.0';
            const passCount = studentsWithScores.filter(s => Number(s.averageScore || s.overallAverage || 0) >= 50).length;
            const passRatePct = studentsWithScores.length > 0 ? ((passCount / studentsWithScores.length) * 100).toFixed(1) : '0.0';

            const handleExportCSVReport = () => {
              const headers = ['Rank,Student ID,Full Name,Class,Gender,Average Score (%),Standing,Form Teacher'];
              const rows = rankedClassStudents.map((st, idx) => {
                const avgNum = Number(st.averageScore || st.overallAverage || 0);
                const avgText = avgNum > 0 ? `${avgNum.toFixed(1)}%` : '0.0%';
                const isGS = avgNum >= 50;
                return `"${idx + 1}","${st.studentId || ''}","${st.fullName || (st as any).name || ''}","${st.className || selectedReportClass}","${st.gender || 'N/A'}","${avgText}","${avgNum > 0 ? (isGS ? 'GS (Good Standing)' : 'NGS') : 'Pending'}","${currentClassTeacher}"`;
              });

              const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join('\n'), ...rows].join('\n');
              const encodedUri = encodeURI(csvContent);
              const link = document.createElement('a');
              link.setAttribute('href', encodedUri);
              link.setAttribute('download', `Class_Report_${selectedReportClass.replace(/\s+/g, '_')}.csv`);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              triggerToast(`Exported CSV Broadsheet for ${selectedReportClass}!`);
            };

            return (
              <div className="space-y-6">
                {/* TOP HEADER & CONTROLS */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                    <div>
                      <h2 className="text-xl font-black text-[#0F172A] font-['Plus_Jakarta_Sans'] flex items-center gap-2">
                        <FileSpreadsheet className="w-6 h-6 text-[#1E3A8A]" />
                        Class Academic Reports & Master Broadsheets
                      </h2>
                      <p className="text-xs text-slate-500 mt-1">
                        Select a class (e.g. JSS 1, JSS 2, SSS 1) to generate student score lists, teacher allocations, and printable master broadsheets strictly from database records.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsClassBroadsheetOpen(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#1E3A8A] hover:bg-[#0F172A] text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer"
                      >
                        <Printer className="w-4 h-4 text-[#F59E0B]" />
                        <span>Print Class Broadsheet (A4)</span>
                      </button>

                      <button
                        onClick={handleExportCSVReport}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                        <span>Export CSV</span>
                      </button>
                    </div>
                  </div>

                  {/* SELECTOR CONTROLS ROW */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2">
                    {/* Class Selector */}
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5 flex items-center gap-1">
                        <Filter className="w-3.5 h-3.5 text-[#1E3A8A]" />
                        Select Class Stream *
                      </label>
                      <select
                        value={selectedReportClass}
                        onChange={(e) => setSelectedReportClass(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                      >
                        <option value="All">All Classes Stream ({students.length} Total Students in Database)</option>
                        {allClassNames.map((cls) => (
                          <option key={cls} value={cls}>
                            {cls} ({students.filter(s => s.className === cls || s.className?.includes(cls)).length} Enrolled in DB)
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Academic Session Selector */}
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-[#1E3A8A]" />
                        Academic Session *
                      </label>
                      <select
                        value={selectedReportSession}
                        onChange={(e) => setSelectedReportSession(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                      >
                        {uniqueSessions.map((s) => {
                          const sessionVal = s.year.includes('Academic Session') ? s.year : `${s.year} Academic Session`;
                          return (
                            <option key={s.id} value={sessionVal}>
                              {s.year} Session{s.status?.includes('Active') ? ' (Active Current Session)' : ''}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    {/* Academic Term Selector */}
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-[#1E3A8A]" />
                        Academic Term *
                      </label>
                      <select
                        value={selectedReportTerm}
                        onChange={(e) => setSelectedReportTerm(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                      >
                        {uniqueTerms.map((t) => (
                          <option key={t.id} value={t.name}>
                            {t.name}{t.status?.includes('Active') ? ' (Active Current Term)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Search Bar */}
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5 flex items-center gap-1">
                        <Search className="w-3.5 h-3.5 text-[#1E3A8A]" />
                        Search Student
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search by name or reg ID..."
                          value={reportSearchQuery}
                          onChange={(e) => setReportSearchQuery(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-xs font-semibold text-[#0F172A] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                        />
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* STATS & TEACHERS SUMMARY CARDS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase text-slate-400">Class Stream</span>
                      <GraduationCap className="w-4 h-4 text-[#1E3A8A]" />
                    </div>
                    <p className="text-lg font-black text-[#0F172A]">{selectedReportClass}</p>
                    <p className="text-[11px] font-bold text-slate-500">
                      Form Master: <span className="text-[#1E3A8A]">{currentClassTeacher}</span>
                    </p>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase text-slate-400">Database Enrolled Students</span>
                      <Users className="w-4 h-4 text-blue-600" />
                    </div>
                    <p className="text-lg font-black text-[#0F172A]">{totalClassCount} Students</p>
                    <p className="text-[11px] font-bold text-emerald-600">
                      {studentsWithScores.length > 0 ? `${passRatePct}% Good Standing (GS)` : 'Pending Assessment'}
                    </p>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase text-slate-400">Assigned Faculty Teachers</span>
                      <PenTool className="w-4 h-4 text-purple-600" />
                    </div>
                    <p className="text-lg font-black text-[#0F172A]">{totalTeachersCount} Instructors</p>
                    <p className="text-[11px] font-bold text-slate-500">Curriculum Faculty</p>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase text-slate-400">Class Average Score</span>
                      <Award className="w-4 h-4 text-[#F59E0B]" />
                    </div>
                    <p className="text-lg font-black text-[#0F172A]">
                      {studentsWithScores.length > 0 ? `${classAvg}%` : '0.0%'}
                    </p>
                    <p className="text-[11px] font-bold text-slate-500">{selectedReportTerm}</p>
                  </div>
                </div>

                {/* TEACHERS ALLOCATION BREAKDOWN */}
                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h3 className="text-xs font-bold uppercase text-[#0F172A] tracking-wider flex items-center gap-2">
                      <Users className="w-4 h-4 text-[#1E3A8A]" />
                      Assigned Subject Teachers for {selectedReportClass}
                    </h3>
                    <span className="text-[10px] font-extrabold bg-blue-50 text-[#1E3A8A] px-2.5 py-1 rounded-full border border-blue-100">
                      {subjectList.length} Core Curriculum Subjects in Database
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {subjectList.length > 0 ? (
                      subjectList.map((sub, i) => (
                        <div key={sub.code || i} className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between text-xs">
                          <div>
                            <span className="font-extrabold text-[#0F172A] block">{sub.name}</span>
                            <span className="text-[10px] text-slate-500 font-mono">{sub.code} ({sub.category || 'Core'})</span>
                          </div>
                          <span className="text-[11px] font-bold text-[#1E3A8A] bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                            {sub.teacher || 'Unassigned'}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-3 p-4 text-center text-xs text-slate-500 italic bg-slate-50 rounded-xl">
                        No subject teachers configured in database yet. Add subjects in the "Manage Subjects" tab.
                      </div>
                    )}
                  </div>
                </div>

                {/* CLASS STUDENT SCORES & RANKING TABLE */}
                <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs space-y-3 p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-[#1E3A8A]" />
                        Student Scores & Academic Positions — {selectedReportClass}
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Computed strictly from database assessment records for {selectedReportTerm} ({selectedReportSession}).
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-500">
                        Showing {rankedClassStudents.length} Students
                      </span>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                          <th className="p-3.5 text-center">Rank</th>
                          <th className="p-3.5">Reg ID</th>
                          <th className="p-3.5">Student Full Name</th>
                          <th className="p-3.5">Class Stream</th>
                          <th className="p-3.5 text-center">Gender</th>
                          <th className="p-3.5 text-center">Average Score (%)</th>
                          <th className="p-3.5 text-center">Standing</th>
                          <th className="p-3.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                        {rankedClassStudents.length > 0 ? (
                          rankedClassStudents.map((st, idx) => {
                            const avg = Number(st.averageScore || st.overallAverage || 0);
                            const hasScore = avg > 0;
                            const isGS = avg >= 50;

                            return (
                              <tr key={st.studentId || idx} className="hover:bg-blue-50/40 transition-colors">
                                <td className="p-3.5 text-center font-black text-[#1E3A8A]">
                                  {hasScore ? (idx === 0 ? '1st 🥇' : idx === 1 ? '2nd 🥈' : idx === 2 ? '3rd 🥉' : `${idx + 1}th`) : '—'}
                                </td>
                                <td className="p-3.5 font-mono text-[#1E3A8A] font-bold">{st.studentId || '—'}</td>
                                <td className="p-3.5 font-bold text-[#0F172A]">{st.fullName || (st as any).name || 'Unnamed Student'}</td>
                                <td className="p-3.5">{st.className || selectedReportClass}</td>
                                <td className="p-3.5 text-center uppercase font-bold text-slate-500">{st.gender || 'N/A'}</td>
                                <td className="p-3.5 text-center font-black font-mono text-emerald-700">
                                  {hasScore ? `${avg.toFixed(1)}%` : '0.0%'}
                                </td>
                                <td className="p-3.5 text-center">
                                  {hasScore ? (
                                    isGS ? (
                                      <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-200">
                                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> GS
                                      </span>
                                    ) : (
                                      <span className="bg-amber-50 text-amber-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-amber-200">
                                        NGS
                                      </span>
                                    )
                                  ) : (
                                    <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-slate-200">
                                      Pending
                                    </span>
                                  )}
                                </td>
                                <td className="p-3.5 text-right">
                                  <button
                                    onClick={() => handleViewStudent(st)}
                                    className="px-2.5 py-1 text-[11px] font-bold bg-blue-50 hover:bg-[#1E3A8A] text-[#1E3A8A] hover:text-white rounded-lg transition-all cursor-pointer border border-blue-200/60"
                                  >
                                    View Slip
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={8} className="p-8 text-center text-slate-500">
                              No student records found in database for "{selectedReportClass}". Register students in the "Manage Students" tab to populate this class.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* TAB 14: VIEW ANALYTICS */}
          {activeTab === 'analytics' && (
            <SchoolAnalyticsView
              students={students}
              classList={classList}
              subjectList={subjectList}
              schoolHeader={schoolHeader}
              onViewStudent={(st) => handleViewStudent(st)}
              onNavigateToTab={(tab) => setActiveTab(tab as any)}
            />
          )}

        </main>
      </div>

      {/* Add Student Modal */}
      {isAddStudentOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-[#0F172A]">Register New Student</h3>
                <p className="text-[11px] text-slate-500">Create new student record with demographic and photo information.</p>
              </div>
              <button onClick={() => setIsAddStudentOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddStudentSubmit} className="space-y-3.5">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Full Student Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Adebayo Oluwaseun"
                  value={newStudent.name}
                  onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">
                    Registration ID (7-Digit Primary Key) *
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const autoId = generateUnique7DigitRegId();
                      setNewStudent({ ...newStudent, studentId: autoId });
                      triggerToast(`Auto-generated unique 7-digit Reg ID: ${autoId}`);
                    }}
                    className="text-[10px] font-bold text-[#1E3A8A] hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3 text-[#F59E0B]" />
                    <span>Auto-Generate ID</span>
                  </button>
                </div>
                <input
                  type="text"
                  required
                  maxLength={7}
                  placeholder="e.g. 2026101 (7 numbers)"
                  value={newStudent.studentId}
                  onChange={(e) => {
                    const digitsOnly = e.target.value.replace(/\D/g, '');
                    setNewStudent({ ...newStudent, studentId: digitsOnly });
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono font-bold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Assigned Class Stream</label>
                <select
                  value={newStudent.className}
                  onChange={(e) => setNewStudent({ ...newStudent, className: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                >
                  {allClassNames.map((cls) => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
              </div>

              {/* Session and Term Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Academic Session *</label>
                  <select
                    value={newStudent.academicSession}
                    onChange={(e) => setNewStudent({ ...newStudent, academicSession: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                  >
                    {uniqueSessions.map((s) => {
                      const sessionVal = s.year.includes('Academic Session') ? s.year : `${s.year} Academic Session`;
                      return (
                        <option key={s.id} value={sessionVal}>
                          {sessionVal}{s.status?.includes('Active') ? ' (Active Current Session)' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Academic Term *</label>
                  <select
                    value={newStudent.term}
                    onChange={(e) => setNewStudent({ ...newStudent, term: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                  >
                    {uniqueTerms.map((t) => (
                      <option key={t.id} value={t.name}>
                        {t.name}{t.status?.includes('Active') ? ' (Active Current Term)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Gender and Age Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Gender *</label>
                  <select
                    value={newStudent.gender}
                    onChange={(e) => setNewStudent({ ...newStudent, gender: e.target.value as 'Male' | 'Female' })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Age (Years) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 15 or 15 Yrs"
                    value={newStudent.age}
                    onChange={(e) => setNewStudent({ ...newStudent, age: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                  />
                </div>
              </div>

              {/* House */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Sports House *</label>
                <select
                  value={newStudent.house}
                  onChange={(e) => setNewStudent({ ...newStudent, house: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                >
                  <option value="Blue House">Blue House (Sapphire)</option>
                  <option value="Red House">Red House (Ruby)</option>
                  <option value="Yellow House">Yellow House (Gold)</option>
                  <option value="Green House">Green House (Emerald)</option>
                  <option value="Purple House">Purple House (Amethyst)</option>
                </select>
              </div>

              {/* Student Passport / Image URL & File Upload */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">Student Passport / Photo</label>
                  {newStudent.passportUrl?.includes('res.cloudinary.com') && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                      <Cloud className="w-3 h-3 text-emerald-600" /> Cloudinary CDN
                    </span>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <label className="flex items-center justify-center gap-2 px-3.5 py-2.5 bg-[#1E3A8A] hover:bg-blue-800 text-white font-bold text-xs rounded-xl cursor-pointer shadow-xs shrink-0 transition-all">
                    {isUploadingStudentPhoto === 'new' ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    <span>{isUploadingStudentPhoto === 'new' ? 'Uploading...' : 'Upload Image File'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={isUploadingStudentPhoto === 'new'}
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          handleStudentPhotoUpload(e.target.files[0], 'new');
                        }
                      }}
                      className="hidden"
                    />
                  </label>

                  <input
                    type="url"
                    placeholder="or paste photo URL (https://...)"
                    value={newStudent.passportUrl}
                    onChange={(e) => setNewStudent({ ...newStudent, passportUrl: e.target.value })}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                  />
                </div>
                
                {/* Live Image Preview & Presets */}
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
                  <div className="w-12 h-14 rounded-lg overflow-hidden border border-slate-300 shrink-0 bg-white shadow-2xs">
                    <img
                      src={newStudent.passportUrl.trim() || (newStudent.gender === 'Female' 
                        ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'
                        : 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=250')}
                      alt="Student Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as any).src = 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=250';
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[11px] font-bold text-slate-700">Photo Live Preview</p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-slate-400">Quick Avatars:</span>
                      <button
                        type="button"
                        onClick={() => setNewStudent({
                          ...newStudent,
                          passportUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=250',
                          gender: 'Male'
                        })}
                        className="text-[10px] px-2 py-0.5 bg-blue-100 hover:bg-blue-200 text-blue-800 font-bold rounded cursor-pointer"
                      >
                        Male Preset
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewStudent({
                          ...newStudent,
                          passportUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
                          gender: 'Female'
                        })}
                        className="text-[10px] px-2 py-0.5 bg-pink-100 hover:bg-pink-200 text-pink-800 font-bold rounded cursor-pointer"
                      >
                        Female Preset
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddStudentOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#1E3A8A] hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all"
                >
                  Confirm Registration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Student Profile Modal */}
      {isEditStudentOpen && editingStudent && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
                  <FileEdit className="w-4 h-4 text-[#F59E0B]" />
                  <span>Edit Student Profile</span>
                </h3>
                <p className="text-[11px] text-slate-500 font-mono">
                  Registration ID: <strong className="text-[#1E3A8A]">{editingStudent.studentId}</strong>
                </p>
              </div>
              <button
                onClick={() => {
                  setIsEditStudentOpen(false);
                  setEditingStudent(null);
                }}
                className="text-slate-400 hover:text-slate-700 cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditStudent} className="space-y-3.5">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Full Student Name *</label>
                <input
                  type="text"
                  required
                  value={editingStudent.fullName || (editingStudent as any).name || ''}
                  onChange={(e) => setEditingStudent({ ...editingStudent, fullName: e.target.value, name: e.target.value } as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Assigned Class Stream</label>
                <select
                  value={editingStudent.className}
                  onChange={(e) => setEditingStudent({ ...editingStudent, className: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                >
                  {allClassNames.map((cls) => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
              </div>

              {/* Session and Term Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Academic Session *</label>
                  <select
                    value={editingStudent.academicSession || editingStudent.session || ''}
                    onChange={(e) => setEditingStudent({ ...editingStudent, academicSession: e.target.value, session: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                  >
                    {uniqueSessions.map((s) => {
                      const sessionVal = s.year.includes('Academic Session') ? s.year : `${s.year} Academic Session`;
                      return (
                        <option key={s.id} value={sessionVal}>
                          {sessionVal}{s.status?.includes('Active') ? ' (Active Current Session)' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Academic Term *</label>
                  <select
                    value={editingStudent.term || ''}
                    onChange={(e) => setEditingStudent({ ...editingStudent, term: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                  >
                    {uniqueTerms.map((t) => (
                      <option key={t.id} value={t.name}>
                        {t.name}{t.status?.includes('Active') ? ' (Active Current Term)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Gender and Age Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Gender *</label>
                  <select
                    value={editingStudent.gender || 'Male'}
                    onChange={(e) => setEditingStudent({ ...editingStudent, gender: e.target.value as 'Male' | 'Female' })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Age *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 15 or 15 Yrs"
                    value={editingStudent.age || ''}
                    onChange={(e) => setEditingStudent({ ...editingStudent, age: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                  />
                </div>
              </div>

              {/* House & Publication Status Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Sports House *</label>
                  <select
                    value={editingStudent.house || 'Blue House'}
                    onChange={(e) => setEditingStudent({ ...editingStudent, house: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                  >
                    <option value="Blue House">Blue House (Sapphire)</option>
                    <option value="Red House">Red House (Ruby)</option>
                    <option value="Yellow House">Yellow House (Gold)</option>
                    <option value="Green House">Green House (Emerald)</option>
                    <option value="Purple House">Purple House (Amethyst)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Result Publication Status *</label>
                  <select
                    value={editingStudent.status === 'Published' || editingStudent.isPublished ? 'Published' : 'Unpublished'}
                    onChange={(e) => {
                      const isPub = e.target.value === 'Published';
                      setEditingStudent({
                        ...editingStudent,
                        status: isPub ? 'Published' : 'Unpublished',
                        isPublished: isPub,
                      } as any);
                    }}
                    className={`w-full border rounded-xl p-2.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] ${
                      editingStudent.status === 'Published' || editingStudent.isPublished
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : 'bg-amber-50 text-amber-800 border-amber-300'
                    }`}
                  >
                    <option value="Published">Published (Visible on Portal)</option>
                    <option value="Unpublished">Unpublished (Hidden from Portal)</option>
                  </select>
                </div>
              </div>

              {/* Student Photo / Image URL & File Upload */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-500 uppercase block">Student Passport / Photo</label>
                  {editingStudent.passportUrl?.includes('res.cloudinary.com') && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                      <Cloud className="w-3 h-3 text-emerald-600" /> Cloudinary CDN
                    </span>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <label className="flex items-center justify-center gap-2 px-3.5 py-2.5 bg-[#1E3A8A] hover:bg-blue-800 text-white font-bold text-xs rounded-xl cursor-pointer shadow-xs shrink-0 transition-all">
                    {isUploadingStudentPhoto === 'edit' ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    <span>{isUploadingStudentPhoto === 'edit' ? 'Uploading...' : 'Upload Image File'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={isUploadingStudentPhoto === 'edit'}
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          handleStudentPhotoUpload(e.target.files[0], 'edit');
                        }
                      }}
                      className="hidden"
                    />
                  </label>

                  <input
                    type="url"
                    placeholder="or paste photo URL (https://...)"
                    value={editingStudent.passportUrl || ''}
                    onChange={(e) => setEditingStudent({ ...editingStudent, passportUrl: e.target.value })}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                  />
                </div>

                {/* Live Image Preview & Quick Presets */}
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
                  <div className="w-12 h-14 rounded-lg overflow-hidden border border-slate-300 shrink-0 bg-white shadow-2xs">
                    <img
                      src={editingStudent.passportUrl || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=250'}
                      alt="Student Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as any).src = 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=250';
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[11px] font-bold text-slate-700">Photo Live Preview</p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-slate-400">Quick Presets:</span>
                      <button
                        type="button"
                        onClick={() => setEditingStudent({
                          ...editingStudent,
                          passportUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=250',
                          gender: 'Male'
                        })}
                        className="text-[10px] px-2 py-0.5 bg-blue-100 hover:bg-blue-200 text-blue-800 font-bold rounded cursor-pointer"
                      >
                        Male Photo
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingStudent({
                          ...editingStudent,
                          passportUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
                          gender: 'Female'
                        })}
                        className="text-[10px] px-2 py-0.5 bg-pink-100 hover:bg-pink-200 text-pink-800 font-bold rounded cursor-pointer"
                      >
                        Female Photo
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditStudentOpen(false);
                    setEditingStudent(null);
                  }}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#1E3A8A] hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Profile Updates</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Result Slip View Modal for Admin */}
      <ResultSlipModal
        result={selectedStudentResult}
        isOpen={isViewResultOpen}
        onClose={() => setIsViewResultOpen(false)}
        onVerifyQR={() => setIsQRModalOpen(true)}
        schoolHeader={schoolHeader}
        branding={{
          logoUrl: logoPreview,
          stampUrl: stampPreview,
          signatureUrl: signaturePreview,
          principalRemark: globalPrincipalRemark,
          positions: brandingPositions,
        }}
      />

      {/* Edit School & Report Card Header Modal */}
      {isEditSchoolHeaderOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-[#F59E0B]" />
                  <span>Edit Report Card Header</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Update the official school name, report title, and address line displayed on all student result slips.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditSchoolHeaderOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSchoolHeader} className="space-y-4">
              {/* School Name */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                  School Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ROYAL ACADEMY"
                  value={schoolHeader.schoolName}
                  onChange={(e) => setSchoolHeader({ ...schoolHeader, schoolName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-black tracking-wide text-[#0F172A] uppercase font-serif focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                />
              </div>

              {/* Report Title */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                  Report Slip Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Student Mid-Term Report"
                  value={schoolHeader.reportTitle}
                  onChange={(e) => setSchoolHeader({ ...schoolHeader, reportTitle: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                />
              </div>

              {/* Address / Subtitle */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                  School Address & Official Subtitle *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Victoria Island, Lagos, Nigeria • Official Academic Record"
                  value={schoolHeader.addressSubtitle}
                  onChange={(e) => setSchoolHeader({ ...schoolHeader, addressSubtitle: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                />
              </div>

              {/* Live Preview Box */}
              <div className="p-4 bg-slate-50 border-2 border-slate-800 rounded-2xl space-y-2">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-[10px] font-black uppercase text-[#1E3A8A] tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-[#F59E0B]" />
                    <span>Report Slip Header Live Preview</span>
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono">Printed Header Format</span>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-slate-300 text-center space-y-1 shadow-2xs">
                  <div className="w-10 h-10 mx-auto rounded-lg border border-slate-800 bg-slate-50 flex items-center justify-center text-slate-800 mb-1">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h1 className="text-xl font-black text-black tracking-tight uppercase font-serif">
                    {schoolHeader.schoolName || 'ROYAL ACADEMY'}
                  </h1>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-800">
                    {schoolHeader.reportTitle || 'Student Mid-Term Report'}
                  </p>
                  <p className="text-[9px] text-slate-600 font-mono">
                    {schoolHeader.addressSubtitle || 'Victoria Island, Lagos, Nigeria • Official Academic Record'}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={handleResetSchoolHeader}
                  className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg cursor-pointer transition-all"
                >
                  Reset Defaults
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditSchoolHeaderOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#1E3A8A] hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Header Changes</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Verification Modal */}
      <QRVerificationModal
        studentId={selectedStudentResult?.studentId || null}
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
      />

      {/* Delete Student Confirmation Modal */}
      {deleteCandidateId && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-red-200 text-center">
            <AlertCircle className="w-10 h-10 text-red-600 mx-auto" />
            <h3 className="text-base font-bold text-[#0F172A]">Confirm Permanent Deletion</h3>
            <p className="text-xs text-slate-500">
              Are you sure you want to purge student record <span className="font-bold text-[#1E3A8A]">{deleteCandidateId}</span> from MongoDB database?
            </p>

            <div className="pt-2 flex justify-center gap-3">
              <button
                onClick={() => setDeleteCandidateId(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const idToDelete = deleteCandidateId;
                  setDeleteCandidateId(null);
                  await api.deleteStudent(idToDelete);
                  setStudents(students.filter(s => s.studentId !== idToDelete));
                  triggerToast(`Student record ${idToDelete} permanently deleted from database.`);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Class Modal */}
      {isAddClassOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-[#0F172A]">Create New Class Stream</h3>
              <button onClick={() => setIsAddClassOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddClassSubmit} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Class Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. JSS 1 Emerald or SSS 3 Science B"
                  value={newClass.name}
                  onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-[#0F172A]"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Arm Stream Identifier</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Emerald, Science B, Gold"
                  value={newClass.arm}
                  onChange={(e) => setNewClass({ ...newClass, arm: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Form Teacher Name</label>
                <input
                  type="text"
                  placeholder="e.g. Mrs. O. Adeleke"
                  value={newClass.teacher}
                  onChange={(e) => setNewClass({ ...newClass, teacher: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Maximum Student Capacity</label>
                <input
                  type="number"
                  min="10"
                  max="60"
                  value={newClass.capacity}
                  onChange={(e) => setNewClass({ ...newClass, capacity: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono font-bold"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddClassOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#1E3A8A] text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
                >
                  Save Class Stream
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Class Confirmation Modal */}
      {deleteClassCandidate && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-red-200 text-center">
            <AlertCircle className="w-10 h-10 text-red-600 mx-auto" />
            <h3 className="text-base font-bold text-[#0F172A]">Delete Class Stream</h3>
            <p className="text-xs text-slate-500">
              Are you sure you want to remove <span className="font-bold text-[#1E3A8A]">{deleteClassCandidate.name}</span> from the database?
            </p>

            <div className="pt-2 flex justify-center gap-3">
              <button
                onClick={() => setDeleteClassCandidate(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteClassConfirm}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Class Roster Modal */}
      {viewClassStudents && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-[#0F172A]">{viewClassStudents.name} Class Roster</h3>
                <p className="text-xs text-slate-500">Form Teacher: {viewClassStudents.teacher || 'Unassigned'}</p>
              </div>
              <button onClick={() => setViewClassStudents(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 divide-y divide-slate-100">
              {students.filter(s => s.className === viewClassStudents.name || s.className?.includes(viewClassStudents.arm)).length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 font-medium">
                  No students currently enrolled in this class stream.
                </div>
              ) : (
                students
                  .filter(s => s.className === viewClassStudents.name || s.className?.includes(viewClassStudents.arm))
                  .map(st => (
                    <div key={st.studentId} className="py-3 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-[#0F172A]">{st.fullName || st.name}</p>
                        <p className="font-mono text-[10px] text-[#1E3A8A] font-semibold">{st.studentId}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-500 font-mono">
                          Avg: {st.averageScore ? `${st.averageScore.toFixed(1)}%` : st.overallAverage ? `${st.overallAverage.toFixed(1)}%` : 'N/A'}
                        </span>
                        <button
                          onClick={() => {
                            setViewClassStudents(null);
                            handleViewStudent(st);
                          }}
                          className="px-2.5 py-1 text-[11px] font-bold text-[#1E3A8A] bg-blue-50 hover:bg-blue-100 rounded-lg cursor-pointer"
                        >
                          View Result
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setViewClassStudents(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Close Roster
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Subject Modal */}
      {isAddSubjectOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-[#0F172A]">Add Curriculum Subject</h3>
              <button onClick={() => setIsAddSubjectOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubjectSubmit} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Subject Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Further Mathematics or Computer Studies"
                  value={newSubject.name}
                  onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-[#0F172A]"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Subject Category</label>
                <select
                  value={newSubject.category}
                  onChange={(e) => setNewSubject({ ...newSubject, category: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold"
                >
                  <option>General Core</option>
                  <option>Sciences</option>
                  <option>Arts & Humanities</option>
                  <option>Social Sciences</option>
                  <option>Vocational & Technology</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Lead Instructor Name</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. M. Chen"
                  value={newSubject.teacher}
                  onChange={(e) => setNewSubject({ ...newSubject, teacher: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddSubjectOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#1E3A8A] text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
                >
                  Save Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Subject Confirmation Modal */}
      {deleteSubjectCandidate && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-red-200 text-center">
            <AlertCircle className="w-10 h-10 text-red-600 mx-auto" />
            <h3 className="text-base font-bold text-[#0F172A]">Delete Curriculum Subject</h3>
            <p className="text-xs text-slate-500">
              Are you sure you want to remove <span className="font-bold text-[#1E3A8A]">{deleteSubjectCandidate.name}</span> from the database?
            </p>

            <div className="pt-2 flex justify-center gap-3">
              <button
                onClick={() => setDeleteSubjectCandidate(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSubjectConfirm}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Session Modal */}
      {isAddSessionOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-[#0F172A]">Create New Academic Session</h3>
              <button onClick={() => setIsAddSessionOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSessionSubmit} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Session Year</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2026/2027"
                  value={newSession.year}
                  onChange={(e) => setNewSession({ ...newSession, year: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-[#1E3A8A]"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Start Date / Month</label>
                <input
                  type="text"
                  placeholder="e.g. September 2026"
                  value={newSession.startDate}
                  onChange={(e) => setNewSession({ ...newSession, startDate: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">End Date / Month</label>
                <input
                  type="text"
                  placeholder="e.g. July 2027"
                  value={newSession.endDate}
                  onChange={(e) => setNewSession({ ...newSession, endDate: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Initial Status</label>
                <select
                  value={newSession.status}
                  onChange={(e) => setNewSession({ ...newSession, status: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold"
                >
                  <option>Upcoming</option>
                  <option>Active Current Session</option>
                  <option>Concluded</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddSessionOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#1E3A8A] text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
                >
                  Save Academic Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Session Modal */}
      {editSessionCandidate && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-[#0F172A]">Edit Session Parameters</h3>
              <button onClick={() => setEditSessionCandidate(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateSessionSubmit} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Session Year</label>
                <input
                  type="text"
                  required
                  value={editSessionCandidate.year}
                  onChange={(e) => setEditSessionCandidate({ ...editSessionCandidate, year: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-[#1E3A8A]"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Start Date</label>
                <input
                  type="text"
                  value={editSessionCandidate.startDate || ''}
                  onChange={(e) => setEditSessionCandidate({ ...editSessionCandidate, startDate: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">End Date</label>
                <input
                  type="text"
                  value={editSessionCandidate.endDate || ''}
                  onChange={(e) => setEditSessionCandidate({ ...editSessionCandidate, endDate: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Status</label>
                <select
                  value={editSessionCandidate.status}
                  onChange={(e) => setEditSessionCandidate({ ...editSessionCandidate, status: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold"
                >
                  <option>Active Current Session</option>
                  <option>Upcoming</option>
                  <option>Concluded</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditSessionCandidate(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#1E3A8A] text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
                >
                  Update Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Session Confirmation Modal */}
      {deleteSessionCandidate && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-red-200 text-center">
            <AlertCircle className="w-10 h-10 text-red-600 mx-auto" />
            <h3 className="text-base font-bold text-[#0F172A]">Delete Academic Session</h3>
            <p className="text-xs text-slate-500">
              Are you sure you want to delete <span className="font-bold text-[#1E3A8A]">{deleteSessionCandidate.year}</span> session?
            </p>

            <div className="pt-2 flex justify-center gap-3">
              <button
                onClick={() => setDeleteSessionCandidate(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSessionConfirm}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Term Modal */}
      {isAddTermOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-[#0F172A]">Add New Academic Term</h3>
              <button onClick={() => setIsAddTermOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddTermSubmit} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Term Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. First Term (Fall) or Summer Session"
                  value={newTerm.name}
                  onChange={(e) => setNewTerm({ ...newTerm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-[#1E3A8A]"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Resumption Date</label>
                <input
                  type="text"
                  placeholder="e.g. Sept 15, 2026"
                  value={newTerm.resumption}
                  onChange={(e) => setNewTerm({ ...newTerm, resumption: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Status</label>
                <select
                  value={newTerm.status}
                  onChange={(e) => setNewTerm({ ...newTerm, status: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold"
                >
                  <option>Upcoming</option>
                  <option>Active Current Term</option>
                  <option>Concluded</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddTermOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#1E3A8A] text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
                >
                  Save Academic Term
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Term Modal */}
      {editTermCandidate && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-[#0F172A]">Modify Term Calendar</h3>
              <button onClick={() => setEditTermCandidate(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateTermSubmit} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Term Name</label>
                <input
                  type="text"
                  required
                  value={editTermCandidate.name}
                  onChange={(e) => setEditTermCandidate({ ...editTermCandidate, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-[#1E3A8A]"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Resumption Date</label>
                <input
                  type="text"
                  value={editTermCandidate.resumption || ''}
                  onChange={(e) => setEditTermCandidate({ ...editTermCandidate, resumption: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Status</label>
                <select
                  value={editTermCandidate.status}
                  onChange={(e) => setEditTermCandidate({ ...editTermCandidate, status: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold"
                >
                  <option>Active Current Term</option>
                  <option>Upcoming</option>
                  <option>Concluded</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditTermCandidate(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#1E3A8A] text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
                >
                  Update Term
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Term Confirmation Modal */}
      {deleteTermCandidate && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-red-200 text-center">
            <AlertCircle className="w-10 h-10 text-red-600 mx-auto" />
            <h3 className="text-base font-bold text-[#0F172A]">Delete Academic Term</h3>
            <p className="text-xs text-slate-500">
              Are you sure you want to delete <span className="font-bold text-[#1E3A8A]">{deleteTermCandidate.name}</span>?
            </p>

            <div className="pt-2 flex justify-center gap-3">
              <button
                onClick={() => setDeleteTermCandidate(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTermConfirm}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Class Broadsheet Printable Modal */}
      <ClassBroadsheetModal
        isOpen={isClassBroadsheetOpen}
        onClose={() => setIsClassBroadsheetOpen(false)}
        classNameSelected={selectedReportClass}
        classTeacherName={classList.find(c => c.name === selectedReportClass)?.teacher || 'Form Master'}
        sessionSelected={selectedReportSession}
        termSelected={selectedReportTerm}
        students={students}
        subjectList={subjectList}
        schoolHeader={schoolHeader}
        branding={{
          logoUrl: logoPreview,
          stampUrl: stampPreview,
          signatureUrl: signaturePreview,
          positions: brandingPositions,
        }}
      />

      {/* Student Promotion Modal */}
      {promotingStudent && (
        <StudentPromotionModal
          isOpen={Boolean(promotingStudent)}
          onClose={() => setPromotingStudent(null)}
          student={promotingStudent}
          classList={classList}
          sessions={sessions}
          terms={terms}
          onPromotionComplete={(updatedStudent, msg) => {
            setStudents(prev => prev.map(s => s.studentId === updatedStudent.studentId ? updatedStudent : s));
            triggerToast(msg);
            setPromotingStudent(null);
          }}
        />
      )}

      {/* Toast Notification */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1E3A8A] text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-bold border border-blue-400/30 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-[#F59E0B]" />
          <span>{successToast}</span>
        </div>
      )}

    </div>
  );
};
