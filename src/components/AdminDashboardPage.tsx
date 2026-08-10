import React, { useState, useEffect } from 'react';
import { SchoolLogo } from './SchoolLogo';
import { ResultSlipModal } from './ResultSlipModal';
import { QRVerificationModal } from './QRVerificationModal';
import { ADMIN_MOCK_STUDENTS } from '../data/mockData';
import { api, DbStatus } from '../services/api';
import { StudentResult, SchoolHeaderInfo, DEFAULT_SCHOOL_HEADER } from '../types';
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
  Settings,
  Sparkles,
  Database,
  Server,
  RefreshCw,
  Cloud
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
  | 'enter-results'
  | 'edit-results'
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

  // Student State
  const [students, setStudents] = useState(ADMIN_MOCK_STUDENTS);
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('All');
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentResult | null>(null);
  const [isEditStudentOpen, setIsEditStudentOpen] = useState(false);

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
    className: 'JSS 1 Gold',
    gender: 'Male' as 'Male' | 'Female',
    house: 'Blue House',
    age: '15',
    passportUrl: '',
    parentContact: '+234 803 000 1234',
  });

  // Class State
  const [classList, setClassList] = useState([
    { id: '1', name: 'JSS 1 Gold', arm: 'Gold', teacher: 'Mrs. O. Adeleke', capacity: 35, enrolled: 32 },
    { id: '2', name: 'JSS 2 Diamond', arm: 'Diamond', teacher: 'Mr. K. Okafor', capacity: 35, enrolled: 30 },
    { id: '3', name: 'JSS 3 Silver', arm: 'Silver', teacher: 'Dr. C. Nwosu', capacity: 35, enrolled: 34 },
    { id: '4', name: 'SSS 1 Science', arm: 'Science A', teacher: 'Engr. T. Balogun', capacity: 30, enrolled: 28 },
    { id: '5', name: 'SSS 2 Arts', arm: 'Arts', teacher: 'Mrs. A. Ibrahim', capacity: 30, enrolled: 25 },
    { id: '6', name: 'SSS 3 Commercial', arm: 'Commercial', teacher: 'Mr. B. Danjuma', capacity: 30, enrolled: 29 },
  ]);
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
    { id: 't1', name: 'First Term (Fall)', status: 'Concluded', resumption: 'Sept 9, 2024' },
    { id: 't2', name: 'Second Term (Winter/Spring)', status: 'Concluded', resumption: 'Jan 8, 2025' },
    { id: 't3', name: 'Third Term (Summer)', status: 'Active Current Term', resumption: 'Apr 28, 2025' },
  ]);

  // Dynamic Class and Subject Options derived from master state
  const allClassNames = Array.from(
    new Set([
      ...classList.map(c => c.name),
      ...students.map(s => s.className).filter(Boolean),
    ])
  );

  const allSubjectNames = Array.from(
    new Set([
      ...subjectList.map(s => s.name),
    ])
  );

  // Enter / Edit Results State
  const [scoreClass, setScoreClass] = useState('JSS 1 Gold');
  const [scoreSubject, setScoreSubject] = useState('');
  const [scoreEntries, setScoreEntries] = useState<Array<{
    id: string;
    name: string;
    ca1: number;
    ca2: number;
    midterm: number;
    exam: number;
  }>>([]);

  // Auto-select first available subject if scoreSubject is unselected or invalid
  useEffect(() => {
    if (allSubjectNames.length > 0 && (!scoreSubject || !allSubjectNames.includes(scoreSubject))) {
      setScoreSubject(allSubjectNames[0]);
    }
  }, [allSubjectNames, scoreSubject]);

  // Auto-sync score entries sheet when class, subject, or student records update
  useEffect(() => {
    if (!scoreClass || !scoreSubject) return;

    const targetClassClean = scoreClass.trim().toLowerCase();
    const targetSubjectClean = scoreSubject.trim().toLowerCase();

    const matchingStudents = students.filter(s => {
      if (!s.className) return false;
      const sClass = s.className.trim().toLowerCase();
      return sClass === targetClassClean || sClass.includes(targetClassClean) || targetClassClean.includes(sClass);
    });

    const entries = matchingStudents.map(st => {
      const existingSub = (st.subjects || []).find(
        (sub: any) => sub.subject?.trim().toLowerCase() === targetSubjectClean
      );

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
  }, [scoreClass, scoreSubject, students]);

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

      const currentSubjects = [...(student.subjects || [])];
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

      const updatedStudentObj = {
        ...student,
        subjects: currentSubjects,
        overallTotal,
        overallAverage,
        averageScore: overallAverage,
        gpa,
      };

      updatedStudentsList[studentIdx] = updatedStudentObj;
      await api.updateStudent(student.studentId, updatedStudentObj);
      updatedCount++;
    }

    setStudents(updatedStudentsList);
    triggerToast(`Scores for ${updatedCount} student(s) in ${scoreClass} (${scoreSubject}) saved & published to portal!`);
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
      let exam = field === 'exam' ? val : (item.exam || 0);

      ca1 = Math.min(10, Math.max(0, ca1));
      ca2 = Math.min(10, Math.max(0, ca2));
      midterm = Math.min(20, Math.max(0, midterm));
      exam = Math.min(60, Math.max(0, exam));

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

      updated[idx] = {
        ...item,
        ca1,
        ca2,
        midterm,
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
      const exam = Math.min(60, Math.max(0, Number(sub.exam) || 0));
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
        total,
        grade,
        remark,
      };
    });

    const overallTotal = updatedSubjects.reduce((acc, s) => acc + s.total, 0);
    const overallAverage = updatedSubjects.length > 0 ? Number((overallTotal / updatedSubjects.length).toFixed(1)) : 0;
    const gpa = Number((overallAverage / 25).toFixed(2));

    const updatedStudentObj: StudentResult = {
      ...fetchedStudent,
      subjects: updatedSubjects,
      overallTotal,
      overallAverage,
      averageScore: overallAverage,
      gpa,
    };

    await api.updateStudent(fetchedStudent.studentId, updatedStudentObj);

    setStudents(prev => prev.map(s => s.studentId === fetchedStudent.studentId ? updatedStudentObj : s));
    setFetchedStudent(updatedStudentObj);

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
      remark: 'PENDING',
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

  // Branding Uploads Preview States
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [stampPreview, setStampPreview] = useState<string | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const [isUploadingBranding, setIsUploadingBranding] = useState<string | null>(null);

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
    const created = {
      id: String(Date.now()),
      year: newSession.year,
      startDate: newSession.startDate || 'September',
      endDate: newSession.endDate || 'July',
      status: newSession.status || 'Upcoming',
    };
    await api.addSession(created);
    setSessions([...sessions, created]);
    setIsAddSessionOpen(false);
    setNewSession({ year: '', startDate: '', endDate: '', status: 'Upcoming' });
    triggerToast(`Academic session "${created.year}" created!`);
  };

  const handleSetActiveSession = async (sess: any) => {
    const updatedSessions = sessions.map(s => ({
      ...s,
      status: s.id === sess.id ? 'Active Current Session' : (s.status.includes('Active') ? 'Concluded' : s.status),
    }));
    setSessions(updatedSessions);
    await api.updateSession(sess.id, { status: 'Active Current Session' });
    triggerToast(`Set ${sess.year} as the current active academic session.`);
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
    setIsAddTermOpen(false);
    setNewTerm({ name: '', resumption: '', status: 'Upcoming' });
    triggerToast(`Academic term "${created.name}" created!`);
  };

  const handleSetActiveTerm = async (t: any) => {
    const updatedTerms = terms.map(item => ({
      ...item,
      status: item.id === t.id ? 'Active Current Term' : (item.status.includes('Active') ? 'Concluded' : item.status),
    }));
    setTerms(updatedTerms);
    await api.updateTerm(t.id, { status: 'Active Current Term' });
    triggerToast(`Activated ${t.name} for current score logging.`);
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
    if (!newSubject.code || !newSubject.name) {
      triggerToast('Please provide subject code and subject name.');
      return;
    }
    const created = {
      code: newSubject.code.toUpperCase(),
      name: newSubject.name,
      category: newSubject.category,
      teacher: newSubject.teacher || 'Unassigned Instructor',
    };

    await api.addSubject(created);
    setSubjectList([...subjectList, created]);
    setIsAddSubjectOpen(false);
    setNewSubject({ code: '', name: '', category: 'General Core', teacher: '' });
    triggerToast(`Subject "${created.name}" (${created.code}) created and synced to MongoDB database!`);
  };

  const handleDeleteSubjectConfirm = async () => {
    if (!deleteSubjectCandidate) return;
    const target = deleteSubjectCandidate;
    setDeleteSubjectCandidate(null);
    await api.deleteSubject(target.code);
    setSubjectList(subjectList.filter(s => s.code !== target.code));
    triggerToast(`Subject "${target.name}" (${target.code}) permanently deleted from database.`);
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
            remark: 'PENDING',
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
        position: studentData.position || 1,
        totalInClass: studentData.totalInClass || 35,
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
      if (realStudents && realStudents.length > 0) {
        setStudents(realStudents);
      }

      const realClasses = await api.getClasses();
      if (realClasses && realClasses.length > 0) {
        setClassList(realClasses);
      }

      const realSubjects = await api.getSubjects();
      if (realSubjects && realSubjects.length > 0) {
        setSubjectList(realSubjects);
      }

      const branding = await api.getBranding();
      if (branding) {
        if (branding.logoUrl) setLogoPreview(branding.logoUrl);
        if (branding.stampUrl) setStampPreview(branding.stampUrl);
        if (branding.signatureUrl) setSignaturePreview(branding.signatureUrl);
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
        { id: 'enter-results', label: 'Enter Results', icon: FilePlus },
        { id: 'edit-results', label: 'Edit Results', icon: FileEdit },
        { id: 'delete-results', label: 'Delete Results', icon: Trash2 },
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
      className: allClassNames[0] || 'JSS 1 Gold',
      gender: 'Male',
      house: 'Blue House',
      age: '15',
      passportUrl: '',
      parentContact: '+234 803 000 1234'
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
          remark: 'PENDING'
        }))
      : [];

    const finalAge = newStudent.age 
      ? (newStudent.age.toLowerCase().includes('yr') ? newStudent.age : `${newStudent.age} Yrs`) 
      : '15 Yrs';

    const defaultAvatar = newStudent.gender === 'Female' 
      ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'
      : 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=250';

    const createdStudent = {
      studentId: cleanRegId,
      name: newStudent.name,
      fullName: newStudent.name,
      className: newStudent.className,
      term: 'Third Term (2024/2025)',
      session: '2024/2025',
      academicSession: '2024/2025 Academic Session',
      gpa: 3.8,
      averageScore: 86.5,
      overallAverage: 86.5,
      overallTotal: 267,
      position: '1st / 35',
      principalRemark: 'Exemplary academic effort and character.',
      teacherRemark: 'Outstanding performance across subjects.',
      status: 'Published' as const,
      gender: newStudent.gender as 'Male' | 'Female',
      house: newStudent.house || 'Blue House',
      age: finalAge,
      passportUrl: newStudent.passportUrl.trim() || defaultAvatar,
      dateOfBirth: '2008-01-01',
      attendance: { timesOpened: 120, timesPresent: 118, timesAbsent: 2 },
      behavioralTraits: { punctuality: 5, neatness: 5, leadership: 5, honesty: 5 },
      verificationHash: `RA-SEC-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      issueDate: 'August 09, 2026',
      subjects: defaultSubjects,
    };

    try {
      await api.createStudent(createdStudent);
      setStudents([createdStudent, ...students]);
      setScoreClass(createdStudent.className);
      setIsAddStudentOpen(false);
      setNewStudent({
        name: '',
        studentId: '',
        className: allClassNames[0] || 'JSS 1 Gold',
        gender: 'Male',
        house: 'Blue House',
        age: '15',
        passportUrl: '',
        parentContact: '+234 803 000 1234'
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

      const updatedObj = {
        ...editingStudent,
        name: editingStudent.fullName || (editingStudent as any).name,
        fullName: editingStudent.fullName || (editingStudent as any).name,
        age: finalAge,
        house: editingStudent.house || 'Blue House',
        passportUrl: editingStudent.passportUrl?.trim() || defaultAvatar,
      };

      await api.updateStudent(editingStudent.studentId, updatedObj);
      setStudents(prev => prev.map(s => s.studentId === editingStudent.studentId ? updatedObj : s));
      if (fetchedStudent && fetchedStudent.studentId === editingStudent.studentId) {
        setFetchedStudent(updatedObj);
      }
      setIsEditStudentOpen(false);
      setEditingStudent(null);
      triggerToast(`Successfully updated profile details for "${updatedObj.fullName}"!`);
    } catch (err: any) {
      triggerToast(err.message || 'Failed to update student profile.');
    }
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
                    Managing 2024/2025 Third Term Academic Records, Transcripts & Examination Portals.
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

                <div className="flex items-center gap-2 w-full sm:w-auto">
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
                        <th className="p-4">Term</th>
                        <th className="p-4">GPA</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {students
                        .filter(s =>
                          (selectedClassFilter === 'All' || s.className === selectedClassFilter) &&
                          (s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
                            s.studentId.toLowerCase().includes(studentSearch.toLowerCase()))
                        )
                        .map((st) => (
                          <tr key={st.studentId} className="hover:bg-blue-50/40 transition-colors">
                            <td className="p-4 font-mono text-[#1E3A8A] font-bold">{st.studentId}</td>
                            <td className="p-4 font-bold text-[#0F172A]">{st.name}</td>
                            <td className="p-4">{st.className}</td>
                            <td className="p-4 text-slate-500">{st.session}</td>
                            <td className="p-4 font-bold text-[#F59E0B]">{st.gpa.toFixed(2)}</td>
                            <td className="p-4">
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                {st.status}
                              </span>
                            </td>
                            <td className="p-4 text-right space-x-2">
                              <button
                                onClick={() => handleViewStudent(st)}
                                disabled={isLoadingStudentDetails}
                                className="px-2.5 py-1 text-xs font-bold text-[#1E3A8A] bg-blue-50 hover:bg-blue-100 rounded-lg cursor-pointer inline-flex items-center gap-1"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>View</span>
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
                        ))}
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
                      <th className="p-4">Subject Code</th>
                      <th className="p-4">Subject Title</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Lead Instructor</th>
                      <th className="p-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {subjectList.map((s) => (
                      <tr key={s.code} className="hover:bg-blue-50/30 transition-colors">
                        <td className="p-4 font-mono font-bold text-[#1E3A8A]">{s.code}</td>
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

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
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

                  <div className="flex items-end">
                    <button
                      onClick={() => triggerToast(`Loaded score entry sheet for ${scoreClass} - ${scoreSubject}`)}
                      className="w-full py-2.5 bg-[#1E3A8A] hover:bg-blue-800 text-white font-bold text-xs rounded-xl cursor-pointer"
                    >
                      Refresh Score Sheet ({scoreEntries.length} Student{scoreEntries.length === 1 ? '' : 's'})
                    </button>
                  </div>
                </div>
              </div>

              {/* Interactive Score Grid Table */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="p-4 bg-blue-50 border-b border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1E3A8A]">
                    Score Matrix: {scoreClass} • {scoreSubject} (Third Term 2024/2025)
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
                                    value={row.ca1}
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
                                    value={row.ca2}
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
                                    value={row.midterm}
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
                                    value={row.exam}
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

          {/* TAB 8: EDIT RESULTS */}
          {activeTab === 'edit-results' && (
            <div className="space-y-6">
              {/* Reg ID Search & Fetch Card */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h2 className="text-xl font-black text-[#0F172A] font-['Plus_Jakarta_Sans']">
                      Edit Existing Student Results
                    </h2>
                    <p className="text-xs text-slate-500">
                      Fetch student record by Registration ID to review and edit published subject scores.
                    </p>
                  </div>
                  {fetchedStudent && (
                    <button
                      type="button"
                      onClick={() => {
                        setFetchedStudent(null);
                        setFetchedStudentSubjects([]);
                        setRegIdSearchInput('');
                      }}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer self-start sm:self-auto flex items-center gap-1.5"
                    >
                      <X className="w-4 h-4 text-slate-500" />
                      <span>Clear Search</span>
                    </button>
                  )}
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleFetchStudentByRegId();
                  }}
                  className="flex flex-col sm:flex-row gap-2"
                >
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                    <input
                      type="text"
                      value={regIdSearchInput}
                      onChange={(e) => setRegIdSearchInput(e.target.value)}
                      placeholder="Enter Student Reg ID (e.g. 2025104) or Full Name..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-[#1E3A8A] hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-2 transition-all shrink-0"
                  >
                    <Search className="w-4 h-4 text-[#F59E0B]" />
                    <span>Fetch Student Record</span>
                  </button>
                </form>
              </div>

              {/* Fetched Student Results Editor */}
              {fetchedStudent ? (
                <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs space-y-6 p-6">
                  {/* Header Student Overview */}
                  <div className="bg-gradient-to-r from-[#1E3A8A] to-slate-900 p-5 rounded-2xl text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-14 rounded-xl border-2 border-[#F59E0B] overflow-hidden bg-white shrink-0 shadow-xs">
                        <img
                          src={fetchedStudent.passportUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'}
                          alt={fetchedStudent.fullName || (fetchedStudent as any).name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-black font-['Plus_Jakarta_Sans']">
                            {fetchedStudent.fullName || (fetchedStudent as any).name}
                          </h3>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#F59E0B] text-slate-900 font-mono">
                            {fetchedStudent.studentId}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300">
                          Class: <strong className="text-white">{fetchedStudent.className}</strong> • Gender: <strong className="text-white">{fetchedStudent.gender || 'N/A'}</strong> • House: <strong className="text-white">{fetchedStudent.house || 'N/A'}</strong> • Age: <strong className="text-white">{fetchedStudent.age || 'N/A'}</strong>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 flex-wrap">
                      <div className="bg-white/10 px-3.5 py-2 rounded-xl border border-white/10 text-center">
                        <span className="text-[10px] uppercase text-slate-300 font-bold block">Overall Avg %</span>
                        <span className="text-base font-black font-mono text-emerald-400">
                          {fetchedStudentSubjects.length > 0
                            ? (fetchedStudentSubjects.reduce((acc, s) => acc + (s.total || 0), 0) / fetchedStudentSubjects.length).toFixed(1)
                            : fetchedStudent.averageScore || 0}%
                        </span>
                      </div>

                      <div className="bg-white/10 px-3.5 py-2 rounded-xl border border-white/10 text-center">
                        <span className="text-[10px] uppercase text-slate-300 font-bold block">GPA (4.0)</span>
                        <span className="text-base font-black font-mono text-[#F59E0B]">
                          {fetchedStudentSubjects.length > 0
                            ? ((fetchedStudentSubjects.reduce((acc, s) => acc + (s.total || 0), 0) / fetchedStudentSubjects.length) / 25).toFixed(2)
                            : fetchedStudent.gpa || '0.00'}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setEditingStudent(fetchedStudent);
                          setIsEditStudentOpen(true);
                        }}
                        className="px-3.5 py-2.5 bg-[#F59E0B] hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1.5 shrink-0 shadow-xs"
                      >
                        <FileEdit className="w-4 h-4" />
                        <span>Edit Profile</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (!fetchedStudent) return;
                          const updatedSubjects = fetchedStudentSubjects.map(sub => {
                            const ca1 = Math.min(10, Math.max(0, Number(sub.ca1) || 0));
                            const ca2 = Math.min(10, Math.max(0, Number(sub.ca2) || 0));
                            const midterm = Math.min(20, Math.max(0, Number(sub.midterm) || 0));
                            const exam = Math.min(60, Math.max(0, Number(sub.exam) || 0));
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
                              ca1, ca2, midterm, caScore, examScore, total, grade, remark,
                            };
                          });

                          const overallTotal = updatedSubjects.reduce((acc, s) => acc + s.total, 0);
                          const overallAverage = updatedSubjects.length > 0 ? Number((overallTotal / updatedSubjects.length).toFixed(1)) : 0;
                          const gpa = Number((overallAverage / 25).toFixed(2));

                          setSelectedStudentResult({
                            ...fetchedStudent,
                            subjects: updatedSubjects,
                            overallTotal,
                            overallAverage,
                            averageScore: overallAverage,
                            gpa,
                          });
                          setIsViewResultOpen(true);
                        }}
                        className="px-3.5 py-2.5 bg-white/15 hover:bg-white/25 text-white font-bold text-xs rounded-xl cursor-pointer border border-white/20 flex items-center gap-1.5 shrink-0"
                      >
                        <Printer className="w-4 h-4 text-[#F59E0B]" />
                        <span className="hidden sm:inline">Preview Slip</span>
                      </button>
                    </div>
                  </div>

                  {/* Subject Scores Table */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                        <FileSpreadsheet className="w-4 h-4 text-[#1E3A8A]" />
                        <span>Editable Subject Score Matrix ({fetchedStudentSubjects.length} Subjects)</span>
                      </h4>
                      <span className="text-[11px] text-slate-500 font-mono">
                        CA1 (10) + CA2 (10) + Midterm (20) + Exam (60) = 100%
                      </span>
                    </div>

                    <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase text-[10px]">
                              <th className="p-3">Subject Name</th>
                              <th className="p-3">CA 1 (10)</th>
                              <th className="p-3">CA 2 (10)</th>
                              <th className="p-3">Midterm (20)</th>
                              <th className="p-3">Exam (60)</th>
                              <th className="p-3">Total (100)</th>
                              <th className="p-3">Grade</th>
                              <th className="p-3">Remark</th>
                              <th className="p-3 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                            {fetchedStudentSubjects.map((row, idx) => {
                              const total = Math.min(100, (row.ca1 || 0) + (row.ca2 || 0) + (row.midterm || 0) + (row.exam || 0));
                              const grade = total >= 80 ? 'A1' : total >= 70 ? 'B2' : total >= 65 ? 'B3' : total >= 60 ? 'C4' : total >= 50 ? 'C6' : total >= 40 ? 'E8' : 'F9';
                              return (
                                <tr key={row.id} className="hover:bg-slate-50/50">
                                  <td className="p-3 font-bold text-[#0F172A]">{row.subject}</td>
                                  <td className="p-3">
                                    <input
                                      type="number"
                                      min="0"
                                      max="10"
                                      value={row.ca1}
                                      onChange={(e) => updateFetchedSubjectScore(idx, 'ca1', Number(e.target.value) || 0)}
                                      className="w-16 p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-center font-bold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                                    />
                                  </td>
                                  <td className="p-3">
                                    <input
                                      type="number"
                                      min="0"
                                      max="10"
                                      value={row.ca2}
                                      onChange={(e) => updateFetchedSubjectScore(idx, 'ca2', Number(e.target.value) || 0)}
                                      className="w-16 p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-center font-bold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                                    />
                                  </td>
                                  <td className="p-3">
                                    <input
                                      type="number"
                                      min="0"
                                      max="20"
                                      value={row.midterm}
                                      onChange={(e) => updateFetchedSubjectScore(idx, 'midterm', Number(e.target.value) || 0)}
                                      className="w-16 p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-center font-bold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                                    />
                                  </td>
                                  <td className="p-3">
                                    <input
                                      type="number"
                                      min="0"
                                      max="60"
                                      value={row.exam}
                                      onChange={(e) => updateFetchedSubjectScore(idx, 'exam', Number(e.target.value) || 0)}
                                      className="w-16 p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-center font-bold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                                    />
                                  </td>
                                  <td className="p-3 font-bold font-mono text-[#1E3A8A] text-sm">{total}%</td>
                                  <td className="p-3">
                                    <span className={`px-2 py-0.5 rounded font-extrabold text-xs ${
                                      grade.startsWith('A') ? 'bg-emerald-100 text-emerald-800' :
                                      grade.startsWith('B') ? 'bg-blue-100 text-blue-800' :
                                      grade.startsWith('C') ? 'bg-amber-100 text-amber-800' :
                                      'bg-red-100 text-red-800'
                                    }`}>
                                      {grade}
                                    </span>
                                  </td>
                                  <td className="p-3 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                                    {row.remark}
                                  </td>
                                  <td className="p-3 text-right">
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveSubjectFromFetched(row.id)}
                                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-all cursor-pointer"
                                      title="Delete Subject"
                                    >
                                      <Trash2 className="w-4 h-4" />
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

                  {/* Add New Subject Control */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                    <label className="text-xs font-bold text-[#0F172A] block">
                      + Add Subject to {fetchedStudent.fullName || (fetchedStudent as any).name}'s Result Slip
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <select
                        value={newSubjectForFetched}
                        onChange={(e) => setNewSubjectForFetched(e.target.value)}
                        className="flex-1 bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-[#0F172A]"
                      >
                        <option value="">-- Select Subject to Add --</option>
                        {allSubjectNames
                          .filter(s => !fetchedStudentSubjects.some(f => f.subject.toLowerCase() === s.toLowerCase()))
                          .map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                      </select>
                      <button
                        type="button"
                        onClick={handleAddSubjectToFetched}
                        disabled={!newSubjectForFetched}
                        className="px-5 py-2.5 bg-[#1E3A8A] hover:bg-blue-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Plus className="w-4 h-4 text-[#F59E0B]" />
                        <span>Add Subject</span>
                      </button>
                    </div>
                  </div>

                  {/* Save and Action Bar */}
                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
                    <p className="text-xs text-slate-500 font-medium">
                      Modifications are saved to database and update student portal access in real-time.
                    </p>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => {
                          setFetchedStudent(null);
                          setFetchedStudentSubjects([]);
                          setRegIdSearchInput('');
                        }}
                        className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                      >
                        Cancel / Clear
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveFetchedStudent}
                        className="w-full sm:w-auto px-6 py-2.5 bg-[#1E3A8A] hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-2"
                      >
                        <Save className="w-4 h-4 text-[#F59E0B]" />
                        <span>Save & Publish Student Results</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-xs text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto text-[#1E3A8A]">
                    <Search className="w-8 h-8 text-[#1E3A8A]" />
                  </div>
                  <div className="space-y-1 max-w-md mx-auto">
                    <h3 className="text-base font-black text-[#0F172A] font-['Plus_Jakarta_Sans']">
                      Search Student Registration ID
                    </h3>
                    <p className="text-xs text-slate-500">
                      Enter an official registration ID (e.g. <strong className="text-[#1E3A8A]">2025104</strong>) above or click one of the quick selection badges to load, review, and edit that student's complete result slip.
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
                  <div className="md:col-span-8 border-2 border-dashed border-blue-200 hover:border-blue-400 bg-blue-50/30 rounded-3xl p-6 sm:p-8 text-center space-y-4 transition-all">
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
                  <div className="md:col-span-8 border-2 border-dashed border-amber-200 hover:border-amber-400 bg-amber-50/20 rounded-3xl p-6 sm:p-8 text-center space-y-4 transition-all">
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
                  <div className="md:col-span-8 border-2 border-dashed border-purple-200 hover:border-purple-400 bg-purple-50/20 rounded-3xl p-6 sm:p-8 text-center space-y-4 transition-all">
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
              </div>
            </div>
          )}

          {/* TAB 13: GENERATE REPORTS */}
          {activeTab === 'reports' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <h2 className="text-xl font-black text-[#0F172A] font-['Plus_Jakarta_Sans']">
                  Generate Class Broadsheet & Transcripts
                </h2>
                <p className="text-xs text-slate-500">
                  Export term performance reports, ranking tables, and PDF master slips.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                    <p className="text-xs font-bold text-[#0F172A]">Term Broadsheet (Excel / CSV)</p>
                    <p className="text-[10px] text-slate-500">Includes subject scores for all 35 students in JSS 1 Gold.</p>
                    <button
                      onClick={() => triggerToast('Downloading Broadsheet Excel file...')}
                      className="w-full py-2 bg-[#1E3A8A] text-white text-xs font-bold rounded-xl cursor-pointer"
                    >
                      Export Broadsheet
                    </button>
                  </div>

                  <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                    <p className="text-xs font-bold text-[#0F172A]">Class Merit Honor Roll (PDF)</p>
                    <p className="text-[10px] text-slate-500">Top 10 academic achievers for graduation bulletin.</p>
                    <button
                      onClick={() => triggerToast('Generating Honor Roll PDF...')}
                      className="w-full py-2 bg-emerald-700 text-white text-xs font-bold rounded-xl cursor-pointer"
                    >
                      Generate Honor Roll PDF
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 14: VIEW ANALYTICS */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <h2 className="text-xl font-black text-[#0F172A] font-['Plus_Jakarta_Sans']">
                  School Performance Analytics
                </h2>
                <p className="text-xs text-slate-500">
                  Term pass distribution and subject performance metrics.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl text-center">
                    <p className="text-xs font-bold text-[#1E3A8A]">Mathematics Pass Rate</p>
                    <p className="text-2xl font-black text-[#0F172A] mt-1">94.2%</p>
                  </div>
                  <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-center">
                    <p className="text-xs font-bold text-emerald-800">English Language Pass Rate</p>
                    <p className="text-2xl font-black text-[#0F172A] mt-1">98.1%</p>
                  </div>
                  <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl text-center">
                    <p className="text-xs font-bold text-amber-900">Sciences Average GPA</p>
                    <p className="text-2xl font-black text-[#0F172A] mt-1">3.72 / 4.0</p>
                  </div>
                </div>
              </div>
            </div>
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

              {/* Student Passport / Image URL */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Student Photo / Image URL</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/photo-... or enter photo URL"
                  value={newStudent.passportUrl}
                  onChange={(e) => setNewStudent({ ...newStudent, passportUrl: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                />
                
                {/* Live Image Preview & Presets */}
                <div className="mt-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
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

              {/* House */}
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

              {/* Student Photo / Image URL */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Student Photo / Image URL</label>
                <input
                  type="url"
                  placeholder="Enter image URL e.g. https://images.unsplash.com/..."
                  value={editingStudent.passportUrl || ''}
                  onChange={(e) => setEditingStudent({ ...editingStudent, passportUrl: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                />

                {/* Live Image Preview & Quick Presets */}
                <div className="mt-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
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
                          GPA: {st.gpa || st.overallAverage || 'N/A'}
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
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Subject Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. FUR 101 or ICT 101"
                  value={newSubject.code}
                  onChange={(e) => setNewSubject({ ...newSubject, code: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono font-bold text-[#1E3A8A]"
                />
              </div>

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
              Are you sure you want to remove <span className="font-bold text-[#1E3A8A]">{deleteSubjectCandidate.code} - {deleteSubjectCandidate.name}</span> from the database?
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
