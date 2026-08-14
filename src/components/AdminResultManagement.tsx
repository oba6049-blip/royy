import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  PlusCircle,
  Eye,
  FileEdit,
  Globe,
  Lock,
  Printer,
  Trash2,
  User,
  GraduationCap,
  Calendar,
  Award,
  FileSpreadsheet,
  Plus,
  Save,
  X,
  Sparkles,
  ChevronRight,
  RefreshCw,
  Sliders,
  Check,
  Building2,
  HelpCircle,
  TrendingUp,
  ShieldCheck,
  BookOpen,
  ArrowUpRight
} from 'lucide-react';
import {
  StudentResult,
  StudentTermRecord,
  SubjectGrade,
  SchoolHeaderInfo,
  DEFAULT_SCHOOL_HEADER
} from '../types';
import { api } from '../services/api';
import { StudentPromotionModal } from './StudentPromotionModal';

// Helper for avatar fallback
const getAvatarFallback = (name: string) => {
  const initials = (name || 'ST')
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="240" viewBox="0 0 200 240">
    <rect width="100%" height="100%" fill="#e2e8f0"/>
    <circle cx="100" cy="85" r="45" fill="#475569"/>
    <path d="M 30 220 C 30 155, 170 155, 170 220 Z" fill="#475569"/>
    <text x="100" y="95" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="#ffffff" text-anchor="middle">${initials}</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

// Clean normalization helpers for session, term, and class matching
const cleanSession = (s: string) => {
  const str = (s || '').toLowerCase();
  const match = str.match(/20\d\d\s*\/\s*20\d\d/);
  return match ? match[0].replace(/\s+/g, '') : str.replace(/academic|session|\s/g, '');
};

const cleanTerm = (t: string) => {
  const l = (t || '').toLowerCase();
  if (l.includes('first') || l.includes('1st') || l.includes('1')) return '1';
  if (l.includes('second') || l.includes('2nd') || l.includes('2')) return '2';
  if (l.includes('third') || l.includes('3rd') || l.includes('3')) return '3';
  return l.replace(/\s/g, '');
};

const cleanClass = (c: string) => (c || '').toLowerCase().replace(/\s/g, '');

// Standard grading calculation
const calculateGradeRemark = (total: number): { grade: string; remark: string } => {
  if (total >= 80) return { grade: 'A1', remark: 'EXCELLENT' };
  if (total >= 70) return { grade: 'B2', remark: 'VERY GOOD' };
  if (total >= 65) return { grade: 'B3', remark: 'GOOD' };
  if (total >= 60) return { grade: 'C4', remark: 'CREDIT' };
  if (total >= 55) return { grade: 'C5', remark: 'CREDIT' };
  if (total >= 50) return { grade: 'C6', remark: 'CREDIT' };
  if (total >= 45) return { grade: 'D7', remark: 'PASS' };
  if (total >= 40) return { grade: 'E8', remark: 'PASS' };
  return { grade: 'F9', remark: 'FAIL' };
};

interface AdminResultManagementProps {
  students: StudentResult[];
  sessions: Array<{ id: string; year: string; status?: string }>;
  terms: Array<{ id: string; name: string; status?: string }>;
  classList: Array<{ id: string; name: string }>;
  subjectList: Array<{ id: string; name: string; code?: string }>;
  schoolHeader?: SchoolHeaderInfo;
  branding?: any;
  onUpdateStudent: (student: StudentResult) => void;
  onViewResultSlip: (student: StudentResult, termRecord?: StudentTermRecord) => void;
  onEditStudentProfile?: (student: StudentResult) => void;
  onTriggerToast: (msg: string) => void;
  initialSelectedStudentId?: string | null;
}

export const AdminResultManagement: React.FC<AdminResultManagementProps> = ({
  students,
  sessions,
  terms,
  classList,
  subjectList,
  schoolHeader = DEFAULT_SCHOOL_HEADER,
  branding,
  onUpdateStudent,
  onViewResultSlip,
  onEditStudentProfile,
  onTriggerToast,
  initialSelectedStudentId,
}) => {
  // Search & Student Selection State
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentResult | null>(null);
  const searchDropdownRef = useRef<HTMLDivElement>(null);

  // Promotion Modal State
  const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);

  // Add Academic Stage Modal State
  const [isAddStageModalOpen, setIsAddStageModalOpen] = useState(false);
  const [newStageClass, setNewStageClass] = useState('');
  const [newStageSession, setNewStageSession] = useState('');

  // Active Score Entry Workspace State (when editing or creating a result)
  const [editingTarget, setEditingTarget] = useState<{
    isOpen: boolean;
    student: StudentResult;
    className: string;
    session: string;
    term: string;
    existingRecord?: StudentTermRecord;
  } | null>(null);

  const [activeSubjects, setActiveSubjects] = useState<Array<{
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

  const [newSubjectSelection, setNewSubjectSelection] = useState('');
  const [teacherRemark, setTeacherRemark] = useState('');
  const [principalRemark, setPrincipalRemark] = useState('');
  const [isSavingScore, setIsSavingScore] = useState(false);

  // Delete Confirmation Modal State
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<{
    student: StudentResult;
    className: string;
    session: string;
    term: string;
    status?: 'Published' | 'Draft' | 'Not Created';
    deleteAllInStage?: boolean;
  } | null>(null);

  // Sync selectedStudent safely with students array
  useEffect(() => {
    if (initialSelectedStudentId) {
      const match = students.find(s => s.studentId === initialSelectedStudentId);
      if (match) {
        setSelectedStudent(match);
        setSearchQuery(match.studentId);
      }
    } else if (students.length > 0) {
      setSelectedStudent(prev => {
        if (!prev) return students[0];
        const match = students.find(s => s.studentId === prev.studentId);
        return match || students[0];
      });
    }
  }, [initialSelectedStudentId, students]);

  // Click outside search dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter matching students for interactive dropdown
  const filteredStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return students.slice(0, 10);

    return students.filter(s => {
      const sId = (s.studentId || '').toLowerCase();
      const sName = (s.fullName || (s as any).name || '').toLowerCase();
      const sClass = (s.className || '').toLowerCase();
      return sId.includes(q) || sName.includes(q) || sClass.includes(q);
    });
  }, [students, searchQuery]);

  // Select a student from search
  const handleSelectStudent = (student: StudentResult) => {
    setSelectedStudent(student);
    setSearchQuery(student.studentId);
    setIsDropdownOpen(false);
    setEditingTarget(null);
    onTriggerToast(`Loaded records for ${student.fullName || (student as any).name} (${student.studentId})`);
  };

  // Helper to calculate Nigerian Secondary class weight for proper sequential sorting
  const getClassOrderWeight = (cls: string): number => {
    const c = (cls || '').toLowerCase();
    if (c.includes('jss 1') || c.includes('js 1') || c.includes('jss1') || c.includes('year 7') || c.includes('grade 7')) return 10;
    if (c.includes('jss 2') || c.includes('js 2') || c.includes('jss2') || c.includes('year 8') || c.includes('grade 8')) return 20;
    if (c.includes('jss 3') || c.includes('js 3') || c.includes('jss3') || c.includes('year 9') || c.includes('grade 9')) return 30;
    if (c.includes('sss 1') || c.includes('ss 1') || c.includes('sss1') || c.includes('year 10') || c.includes('grade 10')) return 40;
    if (c.includes('sss 2') || c.includes('ss 2') || c.includes('sss2') || c.includes('year 11') || c.includes('grade 11')) return 50;
    if (c.includes('sss 3') || c.includes('ss 3') || c.includes('sss3') || c.includes('year 12') || c.includes('grade 12')) return 60;
    return 100;
  };

  // Build the complete academic journey table rows for the selected student
  const academicJourneyRows = useMemo(() => {
    if (!selectedStudent) return [];

    // 1. Identify distinct Academic Stages (Class + Session pairs) that this student has reached
    interface AcademicStage {
      className: string;
      session: string;
    }
    const stages: AcademicStage[] = [];

    const addStageIfNew = (cls: string, sess: string) => {
      const trimmedCls = (cls || '').trim();
      const trimmedSess = (sess || '').trim();
      if (!trimmedCls && !trimmedSess) return;

      const finalCls = trimmedCls || selectedStudent.className || 'JSS 1';
      const finalSess = trimmedSess || selectedStudent.academicSession || '2024/2025 Academic Session';

      const normCls = cleanClass(finalCls);
      const normSess = cleanSession(finalSess);
      const stageKey = `${normCls}__${normSess}`;

      if (selectedStudent.deletedStages && selectedStudent.deletedStages.includes(stageKey)) {
        return;
      }

      if (!stages.some(s => cleanClass(s.className) === normCls && cleanSession(s.session) === normSess)) {
        stages.push({ className: finalCls, session: finalSess });
      }
    };

    // Determine current active class and session based on Admin's Active Session
    const activeAdminSessionObj = sessions.find(s => s.status?.includes('Active')) || sessions.find(s => s.year === '2024/2025') || sessions[0];
    const activeAdminSessionYear = activeAdminSessionObj
      ? (activeAdminSessionObj.year.includes('Academic') ? activeAdminSessionObj.year : `${activeAdminSessionObj.year} Academic Session`)
      : '2024/2025 Academic Session';

    const currentClass = selectedStudent.className || 'JSS 1';
    const currentSession = selectedStudent.academicSession || activeAdminSessionYear;

    // 1a. Add past stages found in historical term records
    if (selectedStudent.termRecords && Array.isArray(selectedStudent.termRecords)) {
      selectedStudent.termRecords.forEach(r => {
        if (r.className || r.academicSession) {
          addStageIfNew(r.className || currentClass, r.academicSession || currentSession);
        }
      });
    }

    // 1b. Always ensure student's current active class is present
    addStageIfNew(currentClass, currentSession);

    // 2. Sort stages logically (by Class level ascending, then by session year)
    stages.sort((a, b) => {
      const weightA = getClassOrderWeight(a.className);
      const weightB = getClassOrderWeight(b.className);
      if (weightA !== weightB) return weightA - weightB;
      return cleanSession(a.session).localeCompare(cleanSession(b.session));
    });

    // 3. For each stage, generate EXACTLY 3 sequential terms (First Term, Second Term, Third Term)
    const standardTerms = ['First Term', 'Second Term', 'Third Term'];
    
    const rows: Array<{
      index: number;
      className: string;
      session: string;
      term: string;
      compositeKey: string;
      status: 'Published' | 'Draft' | 'Not Created';
      dateUpdated: string;
      record?: StudentTermRecord;
      subjectsCount: number;
      overallAverage: number;
      gpa: number;
    }> = [];

    let rowIdx = 1;

    stages.forEach(stage => {
      standardTerms.forEach(trm => {
        const cKey = `${cleanClass(stage.className)}__${cleanSession(stage.session)}__${cleanTerm(trm)}`;

        // Check if this term was deleted/excluded by admin
        if (selectedStudent.deletedTerms && selectedStudent.deletedTerms.includes(cKey)) {
          return;
        }

        // Check if there is a matching record in student's termRecords
        let matchingRecord: StudentTermRecord | undefined;
        if (selectedStudent.termRecords && Array.isArray(selectedStudent.termRecords)) {
          matchingRecord = selectedStudent.termRecords.find(r =>
            cleanSession(r.academicSession) === cleanSession(stage.session) &&
            cleanTerm(r.term) === cleanTerm(trm) &&
            cleanClass(r.className || selectedStudent.className) === cleanClass(stage.className)
          );
        }

        // Also check root student if this is the active session, class, & term and has subjects
        if (!matchingRecord &&
            cleanSession(selectedStudent.academicSession) === cleanSession(stage.session) &&
            cleanTerm(selectedStudent.term) === cleanTerm(trm) &&
            cleanClass(selectedStudent.className) === cleanClass(stage.className) &&
            selectedStudent.subjects && selectedStudent.subjects.length > 0) {
          const isRootPub = selectedStudent.isPublished !== false &&
            selectedStudent.status !== 'Draft' &&
            selectedStudent.status !== 'Unpublished';

          matchingRecord = {
            academicSession: selectedStudent.academicSession,
            term: selectedStudent.term,
            className: selectedStudent.className,
            subjects: selectedStudent.subjects,
            overallTotal: selectedStudent.overallTotal || 0,
            overallAverage: selectedStudent.overallAverage || selectedStudent.averageScore || 0,
            gpa: selectedStudent.gpa || 0,
            status: isRootPub ? 'Published' : 'Draft',
            isPublished: isRootPub,
            issueDate: selectedStudent.issueDate || new Date().toISOString(),
            updatedAt: selectedStudent.issueDate || new Date().toISOString(),
          };
        }

        if (matchingRecord && matchingRecord.subjects && matchingRecord.subjects.length > 0) {
          const isPub = (matchingRecord.isPublished === true || matchingRecord.status === 'Published' || matchingRecord.status === 'PROMOTED' || matchingRecord.status === 'PROMOTED ON TRIAL') &&
            matchingRecord.status !== 'Draft' && matchingRecord.status !== 'Unpublished' && matchingRecord.isPublished !== false;

          let dateStr = '—';
          if (matchingRecord.updatedAt || matchingRecord.issueDate) {
            try {
              dateStr = new Date(matchingRecord.updatedAt || matchingRecord.issueDate || '').toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
              });
            } catch {
              dateStr = matchingRecord.updatedAt || matchingRecord.issueDate || '—';
            }
          }

          rows.push({
            index: rowIdx++,
            className: stage.className,
            session: stage.session,
            term: trm,
            compositeKey: cKey,
            status: isPub ? 'Published' : 'Draft',
            dateUpdated: dateStr,
            record: matchingRecord,
            subjectsCount: matchingRecord.subjects.length,
            overallAverage: matchingRecord.overallAverage || 0,
            gpa: matchingRecord.gpa || 0,
          });
        } else {
          rows.push({
            index: rowIdx++,
            className: stage.className,
            session: stage.session,
            term: trm,
            compositeKey: cKey,
            status: 'Not Created',
            dateUpdated: '—',
            record: undefined,
            subjectsCount: 0,
            overallAverage: 0,
            gpa: 0,
          });
        }
      });
    });

    return rows;
  }, [selectedStudent, sessions]);

  // KPI Summary calculations for selected student
  const summaryMetrics = useMemo(() => {
    if (!selectedStudent) {
      return { totalPublishedTerms: 0, cumulativeAverage: 0, cumulativeGPA: 0 };
    }

    const publishedRecords = academicJourneyRows.filter(r => r.status === 'Published' && r.record && r.subjectsCount > 0);
    const totalPublishedTerms = publishedRecords.length;

    if (totalPublishedTerms === 0) {
      return {
        totalPublishedTerms: 0,
        cumulativeAverage: selectedStudent.overallAverage || selectedStudent.averageScore || 0,
        cumulativeGPA: selectedStudent.gpa || 0
      };
    }

    const avgSum = publishedRecords.reduce((acc, r) => acc + (r.overallAverage || 0), 0);
    const cumulativeAverage = Number((avgSum / totalPublishedTerms).toFixed(1));
    const cumulativeGPA = Number((cumulativeAverage / 25).toFixed(2));

    return { totalPublishedTerms, cumulativeAverage, cumulativeGPA };
  }, [selectedStudent, academicJourneyRows]);

  // Open Score Entry Form (Create or Edit)
  const handleOpenScoreEntry = (
    className: string,
    session: string,
    term: string,
    existingRecord?: StudentTermRecord
  ) => {
    if (!selectedStudent) return;

    const defaultSubjectNames = subjectList.length > 0
      ? subjectList.map(s => s.name)
      : ['Mathematics', 'English Language', 'Basic Science', 'Social Studies', 'Civic Education', 'Agricultural Science', 'Computer Studies', 'Business Studies'];

    let initialSubjectRows: Array<{
      id: string;
      subject: string;
      ca1: number;
      ca2: number;
      midterm: number;
      exam: number;
      total: number;
      grade: string;
      remark: string;
    }> = [];

    if (existingRecord && existingRecord.subjects && existingRecord.subjects.length > 0) {
      initialSubjectRows = existingRecord.subjects.map(s => {
        let ca1 = s.ca1 !== undefined ? Number(s.ca1) : 0;
        let ca2 = s.ca2 !== undefined ? Number(s.ca2) : 0;
        let midterm = s.midterm !== undefined ? Number(s.midterm) : 0;
        let exam = s.examScore !== undefined ? Number(s.examScore) : (s.exam !== undefined ? Number(s.exam) : 0);

        if (s.caScore !== undefined && ca1 === 0 && ca2 === 0 && midterm === 0) {
          const totalCa = Number(s.caScore) || 0;
          midterm = Math.min(20, Math.floor(totalCa * 0.5));
          ca1 = Math.min(10, Math.floor((totalCa - midterm) / 2));
          ca2 = Math.min(10, totalCa - midterm - ca1);
        }

        const total = Math.min(100, ca1 + ca2 + midterm + exam);
        const { grade, remark } = calculateGradeRemark(total);

        return {
          id: s.id || String(Date.now() + Math.random()),
          subject: s.subject || 'Subject',
          ca1,
          ca2,
          midterm,
          exam,
          total,
          grade: s.grade && s.grade !== 'PENDING' ? s.grade : grade,
          remark: s.remark && s.remark !== 'PENDING' ? s.remark : remark,
        };
      });
    } else {
      initialSubjectRows = defaultSubjectNames.map((name, i) => ({
        id: `new_sub_${Date.now()}_${i}`,
        subject: name,
        ca1: 0,
        ca2: 0,
        midterm: 0,
        exam: 0,
        total: 0,
        grade: 'F9',
        remark: 'FAIL',
      }));
    }

    setActiveSubjects(initialSubjectRows);
    setTeacherRemark(selectedStudent.classTeacherRemark || 'Good performance, keep pushing for excellence.');
    setPrincipalRemark(selectedStudent.principalRemark || 'Satisfactory academic progress.');
    setEditingTarget({
      isOpen: true,
      student: selectedStudent,
      className,
      session,
      term,
      existingRecord,
    });
  };

  // Update a single subject score field
  const handleUpdateSubjectField = (
    index: number,
    field: 'ca1' | 'ca2' | 'midterm' | 'exam',
    value: number
  ) => {
    setActiveSubjects(prev => {
      const updated = [...prev];
      const item = { ...updated[index] };

      let ca1 = field === 'ca1' ? value : item.ca1;
      let ca2 = field === 'ca2' ? value : item.ca2;
      let midterm = field === 'midterm' ? value : item.midterm;
      let exam = field === 'exam' ? value : item.exam;

      ca1 = Math.min(10, Math.max(0, Number(ca1) || 0));
      ca2 = Math.min(10, Math.max(0, Number(ca2) || 0));
      midterm = Math.min(20, Math.max(0, Number(midterm) || 0));
      exam = Math.min(60, Math.max(0, Number(exam) || 0));

      const total = Math.min(100, ca1 + ca2 + midterm + exam);
      const { grade, remark } = calculateGradeRemark(total);

      updated[index] = {
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

  // Add subject to active score entry
  const handleAddSubjectToActive = () => {
    if (!newSubjectSelection.trim()) return;
    const subName = newSubjectSelection.trim();

    if (activeSubjects.some(s => s.subject.toLowerCase() === subName.toLowerCase())) {
      onTriggerToast(`Subject "${subName}" is already listed.`);
      return;
    }

    setActiveSubjects(prev => [
      ...prev,
      {
        id: `sub_added_${Date.now()}`,
        subject: subName,
        ca1: 0,
        ca2: 0,
        midterm: 0,
        exam: 0,
        total: 0,
        grade: 'F9',
        remark: 'FAIL',
      }
    ]);
    setNewSubjectSelection('');
    onTriggerToast(`Added "${subName}" to score sheet.`);
  };

  // Remove subject from active score entry
  const handleRemoveSubjectFromActive = (id: string) => {
    setActiveSubjects(prev => prev.filter(s => s.id !== id));
  };

  // Save subject scores (Publish or Save as Draft)
  const handleSaveScores = async (isPublish: boolean) => {
    if (!editingTarget || !selectedStudent) return;
    setIsSavingScore(true);

    try {
      const finalSubjects: SubjectGrade[] = activeSubjects.map(s => ({
        id: s.id,
        subject: s.subject,
        ca1: s.ca1,
        ca2: s.ca2,
        midterm: s.midterm,
        caScore: s.ca1 + s.ca2 + s.midterm,
        examScore: s.exam,
        exam: s.exam,
        total: s.total,
        grade: s.grade as any,
        remark: s.remark as any,
      }));

      const overallTotal = finalSubjects.reduce((acc, s) => acc + s.total, 0);
      const overallAverage = finalSubjects.length > 0 ? Number((overallTotal / finalSubjects.length).toFixed(1)) : 0;
      const gpa = Number((overallAverage / 25).toFixed(2));

      // Build updated StudentTermRecord
      const newTermRecord: StudentTermRecord = {
        academicSession: editingTarget.session,
        term: editingTarget.term,
        className: editingTarget.className,
        subjects: finalSubjects,
        overallTotal,
        overallAverage,
        gpa,
        status: isPublish ? 'Published' : 'Draft',
        isPublished: isPublish,
        updatedAt: new Date().toISOString(),
        issueDate: editingTarget.existingRecord?.issueDate || new Date().toISOString(),
      };

      // Upsert into student termRecords (matching session, term, class)
      const existingRecords = selectedStudent.termRecords || [];
      const filtered = existingRecords.filter(r => {
        const matchSess = cleanSession(r.academicSession) === cleanSession(editingTarget.session);
        const matchTerm = cleanTerm(r.term) === cleanTerm(editingTarget.term);
        const matchClass = !r.className || !editingTarget.className || cleanClass(r.className) === cleanClass(editingTarget.className);
        return !(matchSess && matchTerm && matchClass);
      });

      const updatedTermRecords = [...filtered, newTermRecord];

      // Check if this record is for the student's active current session & term
      const isCurrentTerm = (
        cleanSession(selectedStudent.academicSession) === cleanSession(editingTarget.session) &&
        cleanTerm(selectedStudent.term) === cleanTerm(editingTarget.term)
      );

      // Un-delete this term/stage key if it was previously deleted
      const cKey = `${cleanClass(editingTarget.className)}__${cleanSession(editingTarget.session)}__${cleanTerm(editingTarget.term)}`;
      const stageKey = `${cleanClass(editingTarget.className)}__${cleanSession(editingTarget.session)}`;
      const updatedDeletedTerms = (selectedStudent.deletedTerms || []).filter(k => k !== cKey);
      const updatedDeletedStages = (selectedStudent.deletedStages || []).filter(k => k !== stageKey);

      const updatedStudent: StudentResult = {
        ...selectedStudent,
        termRecords: updatedTermRecords,
        deletedTerms: updatedDeletedTerms,
        deletedStages: updatedDeletedStages,
        ...(isCurrentTerm ? {
          subjects: finalSubjects,
          overallTotal,
          overallAverage,
          averageScore: overallAverage,
          gpa,
          status: isPublish ? 'Published' : 'Draft',
          isPublished: isPublish,
          classTeacherRemark: teacherRemark || selectedStudent.classTeacherRemark,
          principalRemark: principalRemark || selectedStudent.principalRemark,
        } : {})
      };

      // Persist to database
      await api.updateStudent(selectedStudent.studentId, updatedStudent);

      // Update state in parent and local
      onUpdateStudent(updatedStudent);
      setSelectedStudent(updatedStudent);
      setEditingTarget(null);

      onTriggerToast(
        isPublish
          ? `Result for ${editingTarget.className} (${editingTarget.term} - ${editingTarget.session}) saved & published to Student Portal!`
          : `Result saved as Draft for ${editingTarget.className} (${editingTarget.term}).`
      );
    } catch (err) {
      console.error('Error saving student result:', err);
      onTriggerToast('Error saving student result. Please try again.');
    } finally {
      setIsSavingScore(false);
    }
  };

  // Toggle Publish / Unpublish directly from history table
  const handleTogglePublish = async (row: typeof academicJourneyRows[0]) => {
    if (!selectedStudent) return;

    const currentPub = row.status === 'Published';
    const nextPub = !currentPub;

    const baseRecord: StudentTermRecord = row.record || {
      academicSession: row.session,
      term: row.term,
      className: row.className,
      subjects: selectedStudent.subjects || [],
      overallTotal: selectedStudent.overallTotal || 0,
      overallAverage: selectedStudent.overallAverage || 0,
      gpa: selectedStudent.gpa || 0,
      status: 'Published',
      isPublished: true,
    };

    const updatedRecord: StudentTermRecord = {
      ...baseRecord,
      isPublished: nextPub,
      status: nextPub ? 'Published' : 'Draft',
      updatedAt: new Date().toISOString(),
    };

    const existingRecords = selectedStudent.termRecords || [];
    const filteredRecords = existingRecords.filter(r => {
      const matchSess = cleanSession(r.academicSession) === cleanSession(row.session);
      const matchTerm = cleanTerm(r.term) === cleanTerm(row.term);
      const matchClass = cleanClass(r.className || selectedStudent.className) === cleanClass(row.className);
      return !(matchSess && matchTerm && matchClass);
    });

    const updatedTermRecords = [...filteredRecords, updatedRecord];

    const isCurrentTerm = (
      cleanSession(selectedStudent.academicSession) === cleanSession(row.session) &&
      cleanTerm(selectedStudent.term) === cleanTerm(row.term)
    );

    const updatedStudent: StudentResult = {
      ...selectedStudent,
      termRecords: updatedTermRecords,
      ...(isCurrentTerm ? {
        isPublished: nextPub,
        status: nextPub ? 'Published' : 'Draft',
      } : {})
    };

    await api.updateStudent(selectedStudent.studentId, updatedStudent);
    onUpdateStudent(updatedStudent);
    setSelectedStudent(updatedStudent);

    onTriggerToast(
      nextPub
        ? `Result published! Students can now view ${row.className} (${row.term}) on the portal.`
        : `Result set to Draft/Unpublished for ${row.className} (${row.term}).`
      );
  };

  // Add new academic class level stage
  const handleConfirmAddStage = async () => {
    if (!selectedStudent || !newStageClass) {
      onTriggerToast('Please select a class to add.');
      return;
    }
    const activeAdminSessionObj = sessions.find(s => s.status?.includes('Active')) || sessions.find(s => s.year === '2024/2025') || sessions[0];
    const activeAdminSessionYear = activeAdminSessionObj
      ? (activeAdminSessionObj.year.includes('Academic') ? activeAdminSessionObj.year : `${activeAdminSessionObj.year} Academic Session`)
      : '2024/2025 Academic Session';
    const sess = newStageSession || selectedStudent.academicSession || activeAdminSessionYear;
    
    // Check if stage already exists
    const stageExists = academicJourneyRows.some(
      r => cleanClass(r.className) === cleanClass(newStageClass) && cleanSession(r.session) === cleanSession(sess)
    );
    if (stageExists) {
      onTriggerToast(`Academic class ${newStageClass} (${sess}) already exists in student's journey.`);
      setIsAddStageModalOpen(false);
      return;
    }

    // Create an initial placeholder record for First Term of this new stage
    const newRecord: StudentTermRecord = {
      academicSession: sess,
      term: 'First Term',
      className: newStageClass,
      subjects: [],
      overallTotal: 0,
      overallAverage: 0,
      gpa: 0,
      status: 'Draft',
      isPublished: false,
      updatedAt: new Date().toISOString(),
    };

    const normNewCls = cleanClass(newStageClass);
    const normNewSess = cleanSession(sess);
    const stageKey = `${normNewCls}__${normNewSess}`;
    const updatedDeletedStages = (selectedStudent.deletedStages || []).filter(k => k !== stageKey);
    const updatedDeletedTerms = (selectedStudent.deletedTerms || []).filter(k => !k.startsWith(`${normNewCls}__${normNewSess}__`));

    const updatedRecords = [...(selectedStudent.termRecords || []), newRecord];
    const updatedStudent: StudentResult = {
      ...selectedStudent,
      termRecords: updatedRecords,
      deletedStages: updatedDeletedStages,
      deletedTerms: updatedDeletedTerms,
    };

    await api.updateStudent(selectedStudent.studentId, updatedStudent);
    onUpdateStudent(updatedStudent);
    setSelectedStudent(updatedStudent);
    setIsAddStageModalOpen(false);
    onTriggerToast(`Added ${newStageClass} (${sess}) to ${selectedStudent.fullName || (selectedStudent as any).name}'s academic journey.`);
  };

  // Delete a specific terminal record or stage
  const handleConfirmDelete = async () => {
    if (!deleteConfirmTarget || !selectedStudent) return;
    const { className, session, term, deleteAllInStage } = deleteConfirmTarget;

    const normCls = cleanClass(className);
    const normSess = cleanSession(session);
    const normTrm = cleanTerm(term);
    const cKey = `${normCls}__${normSess}__${normTrm}`;
    const stageKey = `${normCls}__${normSess}`;

    const existingRecords = selectedStudent.termRecords || [];
    const filteredRecords = existingRecords.filter(r => {
      const matchSess = cleanSession(r.academicSession) === normSess;
      const matchClass = cleanClass(r.className || selectedStudent.className) === normCls;
      if (deleteAllInStage) {
        return !(matchSess && matchClass);
      }
      const matchTerm = cleanTerm(r.term) === normTrm;
      return !(matchSess && matchTerm && matchClass);
    });

    const isCurrentTerm = (
      cleanSession(selectedStudent.academicSession) === normSess &&
      (deleteAllInStage || cleanTerm(selectedStudent.term) === normTrm) &&
      cleanClass(selectedStudent.className) === normCls
    );

    // Track deleted terms/stages so the deleted row is completely removed from the table view
    const currentDeletedTerms = new Set(selectedStudent.deletedTerms || []);
    if (deleteAllInStage) {
      ['First Term', 'Second Term', 'Third Term'].forEach(t => {
        currentDeletedTerms.add(`${normCls}__${normSess}__${cleanTerm(t)}`);
      });
    } else {
      currentDeletedTerms.add(cKey);
    }

    const currentDeletedStages = new Set(selectedStudent.deletedStages || []);
    if (deleteAllInStage) {
      currentDeletedStages.add(stageKey);
    }

    const updatedStudent: StudentResult = {
      ...selectedStudent,
      termRecords: filteredRecords,
      deletedTerms: Array.from(currentDeletedTerms),
      deletedStages: Array.from(currentDeletedStages),
      ...(isCurrentTerm ? {
        subjects: [],
        overallTotal: 0,
        overallAverage: 0,
        averageScore: 0,
        gpa: 0,
        status: 'Draft',
        isPublished: false,
      } : {})
    };

    await api.updateStudent(selectedStudent.studentId, updatedStudent);
    onUpdateStudent(updatedStudent);
    setSelectedStudent(updatedStudent);
    setDeleteConfirmTarget(null);

    onTriggerToast(`Deleted ${term ? `${term} (${className})` : className} from student record.`);
  };

  // Computed live totals for the score entry form
  const entryTotals = useMemo(() => {
    const total = activeSubjects.reduce((acc, s) => acc + s.total, 0);
    const avg = activeSubjects.length > 0 ? Number((total / activeSubjects.length).toFixed(1)) : 0;
    const gpa = Number((avg / 25).toFixed(2));
    return { total, avg, gpa, count: activeSubjects.length };
  }, [activeSubjects]);

  return (
    <div className="space-y-6" id="admin-result-management-module">
      
      {/* ========================================================================= */}
      {/* STEP 1 • SEARCH STUDENT SECTION & WORKSPACE HEADER */}
      {/* ========================================================================= */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1E3A8A] flex items-center justify-center font-bold shadow-2xs">
              <FileSpreadsheet className="w-6 h-6 text-[#1E3A8A]" />
            </div>
            <div>
              <h2 className="text-xl font-black text-[#0F172A] font-['Plus_Jakarta_Sans'] flex items-center gap-2">
                <span>Result Management Workspace</span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-100 text-[#1E3A8A]">
                  Official Records
                </span>
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Search and fetch any student to manage scores, publish results, promote classes, or print historical result slips.
              </p>
            </div>
          </div>

          {selectedStudent && (
            <div className="flex items-center gap-2 self-start sm:self-auto">
              {/* PROMOTE BUTTON IN HEADER */}
              <button
                type="button"
                onClick={() => setIsPromoteModalOpen(true)}
                className="px-4 py-2 bg-gradient-to-r from-[#1E3A8A] to-[#1e40af] hover:from-blue-800 hover:to-blue-900 text-white text-xs font-bold rounded-xl cursor-pointer transition-all flex items-center gap-2 shadow-md hover:shadow-lg hover:-translate-y-0.5"
              >
                <GraduationCap className="w-4 h-4 text-[#F59E0B]" />
                <span>Promote Student</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedStudent(null);
                  setSearchQuery('');
                  setEditingTarget(null);
                }}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer transition-all flex items-center gap-1.5 shadow-2xs"
              >
                <X className="w-3.5 h-3.5 text-slate-500" />
                <span>Switch Student</span>
              </button>
            </div>
          )}
        </div>

        {/* Real-time Search Bar with Interactive Dropdown */}
        <div className="relative" ref={searchDropdownRef}>
          <label className="text-[11px] font-black uppercase tracking-wider text-slate-600 block mb-1.5">
            Search Student by Reg ID or Name:
          </label>
          <div className="relative flex items-center">
            <Search className="absolute left-4 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Type Student Admission ID (e.g. 2025104) or Full Name..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsDropdownOpen(true);
              }}
              onFocus={() => setIsDropdownOpen(true)}
              className="w-full pl-11 pr-24 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:bg-white transition-all shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setIsDropdownOpen(true);
                }}
                className="absolute right-3 px-2 py-1 text-[11px] font-bold text-slate-400 hover:text-slate-600 bg-slate-200/60 rounded-lg cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Interactive Real-Time Autocomplete Dropdown */}
          {isDropdownOpen && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 max-h-72 overflow-y-auto divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500 font-medium">
                  No registered students found matching <strong className="text-slate-800">"{searchQuery}"</strong>
                </div>
              ) : (
                filteredStudents.map(st => {
                  const isSelected = selectedStudent?.studentId === st.studentId;
                  return (
                    <button
                      key={st.studentId}
                      type="button"
                      onClick={() => handleSelectStudent(st)}
                      className={`w-full p-3 text-left flex items-center justify-between hover:bg-blue-50/70 transition-colors cursor-pointer ${
                        isSelected ? 'bg-blue-50/90' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                          <img
                            src={st.passportUrl || getAvatarFallback(st.fullName || (st as any).name)}
                            alt={st.fullName || (st as any).name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = getAvatarFallback(st.fullName || (st as any).name);
                            }}
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-[#0F172A]">
                              {st.fullName || (st as any).name}
                            </span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-black bg-[#F59E0B]/20 text-amber-900 border border-amber-300/40">
                              {st.studentId}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 font-medium">
                            {st.className} • {st.academicSession || '2025/2026'} ({st.term || 'First Term'})
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isSelected && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            Active
                          </span>
                        )}
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Quick Selection Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-[11px] pt-1">
          <span className="text-slate-400 font-bold uppercase tracking-wider shrink-0 text-[10px]">
            Quick Select:
          </span>
          {students.slice(0, 8).map(st => {
            const isSel = selectedStudent?.studentId === st.studentId;
            return (
              <button
                key={st.studentId}
                type="button"
                onClick={() => handleSelectStudent(st)}
                className={`px-3 py-1.5 rounded-xl border font-mono font-bold transition-all cursor-pointer shrink-0 text-xs flex items-center gap-1.5 ${
                  isSel
                    ? 'bg-[#1E3A8A] text-white border-[#1E3A8A] shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <span>{st.fullName || (st as any).name}</span>
                <span className={`px-1.5 py-0.2 rounded text-[10px] ${isSel ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                  {st.studentId}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* STUDENT INFORMATION CARD */}
      {/* ========================================================================= */}
      {selectedStudent ? (
        <div className="bg-gradient-to-br from-[#1E3A8A] via-[#1E3A8A] to-[#172554] p-6 sm:p-7 rounded-3xl text-white shadow-xl border border-blue-700/60 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4 sm:gap-5">
              {/* Passport Photograph Container */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-white/40 bg-blue-950/60 shrink-0 shadow-lg relative">
                <img
                  src={selectedStudent.passportUrl || getAvatarFallback(selectedStudent.fullName || (selectedStudent as any).name)}
                  alt={selectedStudent.fullName || (selectedStudent as any).name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = getAvatarFallback(selectedStudent.fullName || (selectedStudent as any).name);
                  }}
                />
              </div>

              {/* Name & Academic Details */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h3 className="text-xl sm:text-2xl font-black font-['Plus_Jakarta_Sans'] tracking-tight text-white capitalize">
                    {selectedStudent.fullName || (selectedStudent as any).name}
                  </h3>
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-black bg-[#F59E0B] text-slate-950 shadow-xs">
                    {selectedStudent.studentId}
                  </span>
                  {selectedStudent.status && selectedStudent.status !== 'Draft' && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/25 text-emerald-200 border border-emerald-400/40">
                      {selectedStudent.status}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-blue-100">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="text-blue-200">Current Class:</span>
                    <strong className="text-white font-bold bg-white/15 px-2 py-0.5 rounded-md">{selectedStudent.className}</strong>
                  </span>
                  <span className="text-blue-300">•</span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="text-blue-200">Session:</span>
                    <strong className="text-white font-bold">{selectedStudent.academicSession || '2024/2025 Academic Session'}</strong>
                  </span>
                  <span className="text-blue-300">•</span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="text-blue-200">Gender:</span>
                    <strong className="text-white font-bold">{selectedStudent.gender || 'Male'}</strong>
                  </span>
                  {selectedStudent.house && (
                    <>
                      <span className="text-blue-300">•</span>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="text-blue-200">House:</span>
                        <strong className="text-white font-bold">{selectedStudent.house}</strong>
                      </span>
                    </>
                  )}
                  {selectedStudent.dateOfBirth && (
                    <>
                      <span className="text-blue-300">•</span>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="text-blue-200">DOB:</span>
                        <strong className="text-white font-bold">{selectedStudent.dateOfBirth}</strong>
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* KPI Summary Indicators & Actions */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Published Terms Count */}
              <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/20 text-center min-w-[110px] shadow-xs">
                <span className="text-[10px] uppercase text-blue-100 font-bold block tracking-wider">
                  Published Terms
                </span>
                <div className="flex items-center justify-center gap-1.5 mt-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span className="text-xl font-black font-mono text-white">
                    {summaryMetrics.totalPublishedTerms}
                  </span>
                </div>
              </div>

              {/* Cumulative Grade Mean */}
              <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/20 text-center min-w-[130px] shadow-xs">
                <span className="text-[10px] uppercase text-blue-100 font-bold block tracking-wider">
                  Cumulative Mean
                </span>
                <div className="flex items-center justify-center gap-1.5 mt-1">
                  <Award className="w-4 h-4 text-[#F59E0B]" />
                  <span className="text-xl font-black font-mono text-[#F59E0B]">
                    {summaryMetrics.cumulativeAverage > 0 ? `${summaryMetrics.cumulativeAverage}%` : '—'}
                  </span>
                </div>
              </div>

              {/* PROMOTE STUDENT ACTION BUTTON */}
              <button
                type="button"
                onClick={() => setIsPromoteModalOpen(true)}
                className="px-4 py-3 bg-[#F59E0B] hover:bg-amber-400 text-slate-950 font-black text-xs rounded-2xl cursor-pointer flex items-center gap-2 shadow-md hover:shadow-lg transition-all self-stretch md:self-auto justify-center"
              >
                <GraduationCap className="w-4 h-4 text-slate-950" />
                <span>Promote Student</span>
              </button>

              {/* Edit Student Profile */}
              {onEditStudentProfile && (
                <button
                  type="button"
                  onClick={() => onEditStudentProfile(selectedStudent)}
                  className="px-3.5 py-3 bg-white/15 hover:bg-white/25 text-white font-bold text-xs rounded-2xl cursor-pointer flex items-center gap-2 border border-white/30 transition-all self-stretch md:self-auto justify-center shadow-xs hover:border-white/50"
                >
                  <FileEdit className="w-4 h-4 text-white" />
                  <span>Edit Profile</span>
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-3 shadow-xs">
          <User className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-black text-slate-800 font-['Plus_Jakarta_Sans']">
            No Student Selected
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Please search for a student using their Admission Number or Name above, or click one of the quick select pills to load their academic journey.
          </p>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SCORE ENTRY WORKSPACE / DRAWER (WHEN CREATING OR EDITING A RESULT) */}
      {/* ========================================================================= */}
      {editingTarget && editingTarget.isOpen && selectedStudent && (
        <div className="bg-white p-6 sm:p-7 rounded-3xl border-2 border-[#1E3A8A] shadow-xl space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                <FileEdit className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-[#0F172A] font-['Plus_Jakarta_Sans']">
                  Score Entry Sheet: {editingTarget.className} • {editingTarget.session}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Academic Term: <strong className="text-[#1E3A8A]">{editingTarget.term}</strong> • Student: <strong>{selectedStudent.fullName || (selectedStudent as any).name}</strong> ({selectedStudent.studentId})
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setEditingTarget(null)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer transition-all flex items-center gap-1.5"
              >
                <X className="w-4 h-4" />
                <span>Close Sheet</span>
              </button>
            </div>
          </div>

          {/* Quick Score Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center">
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-500 block">Total Subjects</span>
              <span className="text-base font-black font-mono text-[#0F172A]">{entryTotals.count}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-500 block">Cumulative Score</span>
              <span className="text-base font-black font-mono text-[#1E3A8A]">{entryTotals.total} / {entryTotals.count * 100}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-500 block">Average Score</span>
              <span className="text-base font-black font-mono text-emerald-700">{entryTotals.avg}%</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-500 block">Calculated GPA</span>
              <span className="text-base font-black font-mono text-amber-700">{entryTotals.gpa}</span>
            </div>
          </div>

          {/* Editable Subject Score Matrix */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h4 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-[#1E3A8A]" />
                <span>Subject Score Breakdown Matrix</span>
              </h4>
              <span className="text-[11px] text-slate-500 font-mono">
                CA 1 (10) + CA 2 (10) + Midterm (20) + Exam (60) = 100%
              </span>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[700px]">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-black border-b border-slate-200 uppercase text-[10px] tracking-wider">
                      <th className="p-3">Subject Name</th>
                      <th className="p-3 text-center">CA 1 (10)</th>
                      <th className="p-3 text-center">CA 2 (10)</th>
                      <th className="p-3 text-center">Midterm (20)</th>
                      <th className="p-3 text-center">Exam (60)</th>
                      <th className="p-3 text-center">Total (100)</th>
                      <th className="p-3 text-center">Grade</th>
                      <th className="p-3 text-center">Remark</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700 bg-white">
                    {activeSubjects.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="p-6 text-center text-xs text-slate-500">
                          No subjects added to this terminal record yet. Use the control below to add subjects.
                        </td>
                      </tr>
                    ) : (
                      activeSubjects.map((row, idx) => (
                        <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="p-3 font-bold text-[#0F172A]">
                            <div className="flex items-center gap-2">
                              <BookOpen className="w-3.5 h-3.5 text-[#1E3A8A]" />
                              <span>{row.subject}</span>
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <input
                              type="number"
                              min="0"
                              max="10"
                              value={row.ca1}
                              onChange={(e) => handleUpdateSubjectField(idx, 'ca1', Number(e.target.value) || 0)}
                              className="w-16 p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-center font-bold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                            />
                          </td>
                          <td className="p-3 text-center">
                            <input
                              type="number"
                              min="0"
                              max="10"
                              value={row.ca2}
                              onChange={(e) => handleUpdateSubjectField(idx, 'ca2', Number(e.target.value) || 0)}
                              className="w-16 p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-center font-bold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                            />
                          </td>
                          <td className="p-3 text-center">
                            <input
                              type="number"
                              min="0"
                              max="20"
                              value={row.midterm}
                              onChange={(e) => handleUpdateSubjectField(idx, 'midterm', Number(e.target.value) || 0)}
                              className="w-16 p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-center font-bold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                            />
                          </td>
                          <td className="p-3 text-center">
                            <input
                              type="number"
                              min="0"
                              max="60"
                              value={row.exam}
                              onChange={(e) => handleUpdateSubjectField(idx, 'exam', Number(e.target.value) || 0)}
                              className="w-16 p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-center font-bold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                            />
                          </td>
                          <td className="p-3 text-center font-bold font-mono text-[#1E3A8A] text-sm">
                            {row.total}%
                          </td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-0.5 rounded font-extrabold text-xs inline-block ${
                              row.grade === 'F9' || row.grade?.startsWith('F') ? 'bg-red-100 text-red-800' :
                              row.grade?.startsWith('A') ? 'bg-emerald-100 text-emerald-800' :
                              row.grade?.startsWith('B') ? 'bg-blue-100 text-blue-800' :
                              row.grade?.startsWith('C') ? 'bg-amber-100 text-amber-800' :
                              'bg-slate-100 text-slate-800'
                            }`}>
                              {row.grade}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase tracking-wider inline-block ${
                              row.remark === 'FAIL' || row.total < 40 ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}>
                              {row.remark}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveSubjectFromActive(row.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-all cursor-pointer"
                              title="Delete Subject"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Add Subject to Result Slip */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
            <label className="text-xs font-bold text-[#0F172A] block">
              + Add Subject to this Result Slip
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={newSubjectSelection}
                onChange={(e) => setNewSubjectSelection(e.target.value)}
                className="flex-1 bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-[#0F172A]"
              >
                <option value="">-- Select Subject from System Catalog --</option>
                {subjectList
                  .filter(s => !activeSubjects.some(a => a.subject.toLowerCase() === s.name.toLowerCase()))
                  .map(s => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
              </select>
              <button
                type="button"
                onClick={handleAddSubjectToActive}
                disabled={!newSubjectSelection}
                className="px-5 py-2.5 bg-[#1E3A8A] hover:bg-blue-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4 text-[#F59E0B]" />
                <span>Add Subject</span>
              </button>
            </div>
          </div>

          {/* Remarks Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                Class Teacher Remark
              </label>
              <textarea
                rows={2}
                value={teacherRemark}
                onChange={(e) => setTeacherRemark(e.target.value)}
                placeholder="e.g. Excellent conduct and exceptional academic performance."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                Principal Remark
              </label>
              <textarea
                rows={2}
                value={principalRemark}
                onChange={(e) => setPrincipalRemark(e.target.value)}
                placeholder="e.g. An outstanding result. Keep up the high standard."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
              />
            </div>
          </div>

          {/* Actions & Save Controls */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => {
                const tempSubs = activeSubjects.map(s => ({
                  id: s.id,
                  subject: s.subject,
                  caScore: s.ca1 + s.ca2 + s.midterm,
                  examScore: s.exam,
                  total: s.total,
                  grade: s.grade as any,
                  remark: s.remark as any,
                }));
                const tempResult: StudentResult = {
                  ...selectedStudent,
                  className: editingTarget.className,
                  academicSession: editingTarget.session,
                  term: editingTarget.term,
                  subjects: tempSubs,
                  overallTotal: entryTotals.total,
                  overallAverage: entryTotals.avg,
                  averageScore: entryTotals.avg,
                  gpa: entryTotals.gpa,
                  classTeacherRemark: teacherRemark,
                  principalRemark: principalRemark,
                };
                onViewResultSlip(tempResult);
              }}
              className="w-full sm:w-auto px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300/80 font-bold text-xs rounded-xl cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <Printer className="w-4 h-4 text-amber-700" />
              <span>Preview Result Slip</span>
            </button>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setEditingTarget(null)}
                className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isSavingScore}
                onClick={() => handleSaveScores(false)}
                className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Save className="w-4 h-4 text-amber-400" />
                <span>Save as Draft</span>
              </button>

              <button
                type="button"
                disabled={isSavingScore}
                onClick={() => handleSaveScores(true)}
                className="w-full sm:w-auto px-6 py-2.5 bg-[#1E3A8A] hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 text-[#F59E0B]" />
                <span>Save & Publish to Portal</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 2 • ACADEMIC RECORD HISTORY TABLE */}
      {/* ========================================================================= */}
      {selectedStudent && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden space-y-4">
          <div className="bg-gradient-to-r from-[#1E3A8A] to-[#172554] text-white px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-blue-900/40">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/10 text-[#F59E0B] flex items-center justify-center font-bold border border-white/15">
                <GraduationCap className="w-5 h-5 text-[#F59E0B]" />
              </div>
              <div>
                <h3 className="text-sm font-black font-['Plus_Jakarta_Sans'] uppercase tracking-wider text-white">
                  Academic Journey & Terminal Records
                </h3>
                <p className="text-xs text-blue-100">
                  Sequential 3-term records for <strong className="text-white">{selectedStudent.fullName || (selectedStudent as any).name}</strong> (First, Second, and Third Term for each enrolled class level)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => {
                  const activeAdminSessionObj = sessions.find(s => s.status?.includes('Active')) || sessions.find(s => s.year === '2024/2025') || sessions[0];
                  const activeAdminSessionYear = activeAdminSessionObj
                    ? (activeAdminSessionObj.year.includes('Academic') ? activeAdminSessionObj.year : `${activeAdminSessionObj.year} Academic Session`)
                    : '2024/2025 Academic Session';
                  setNewStageClass(classList[0]?.name || 'JSS 2');
                  setNewStageSession(selectedStudent.academicSession || activeAdminSessionYear);
                  setIsAddStageModalOpen(true);
                }}
                className="px-3.5 py-1.5 bg-white/15 hover:bg-white/25 text-white font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1.5 border border-white/20 transition-all shadow-xs"
                title="Add a new class level (e.g. JSS 2, SSS 1) to this student's journey"
              >
                <PlusCircle className="w-3.5 h-3.5 text-blue-300" />
                <span>+ Add Class Level</span>
              </button>

              <button
                type="button"
                onClick={() => setIsPromoteModalOpen(true)}
                className="px-3.5 py-1.5 bg-[#F59E0B] hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1.5 shadow-xs transition-all"
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Promote Student</span>
              </button>
              <span className="text-[11px] font-mono font-bold bg-white/10 px-3 py-1.5 rounded-xl text-slate-200">
                {academicJourneyRows.length} Term Records
              </span>
            </div>
          </div>

          {/* Academic History Table */}
          <div className="p-4 sm:p-6 pt-2">
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[750px] text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                      <th className="py-3 px-4 text-center w-12">#</th>
                      <th className="py-3 px-4">Class</th>
                      <th className="py-3 px-4">Academic Session</th>
                      <th className="py-3 px-4">Academic Term</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-center">Date Updated</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {academicJourneyRows.map((row) => {
                      const isPub = row.status === 'Published';
                      const isDraft = row.status === 'Draft';
                      const isNotCreated = row.status === 'Not Created';

                      return (
                        <tr
                          key={row.compositeKey}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            isPub ? 'bg-emerald-50/15' : isDraft ? 'bg-amber-50/15' : ''
                          }`}
                        >
                          {/* Row Index */}
                          <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-400 text-[11px]">
                            {row.index}
                          </td>

                          {/* Class */}
                          <td className="py-3.5 px-4 font-bold text-[#0F172A]">
                            <div className="flex items-center gap-2">
                              <GraduationCap className="w-4 h-4 text-[#1E3A8A]" />
                              <span>{row.className}</span>
                            </div>
                          </td>

                          {/* Academic Session */}
                          <td className="py-3.5 px-4 font-medium text-slate-700">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              <span>{row.session}</span>
                            </div>
                          </td>

                          {/* Academic Term */}
                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-[#1E3A8A]" />
                              <span>{row.term}</span>
                            </div>
                          </td>

                          {/* Status Badge */}
                          <td className="py-3.5 px-4 text-center">
                            {isPub ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Published</span>
                              </span>
                            ) : isDraft ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs">
                                <Clock className="w-3 h-3 text-amber-600" />
                                <span>Draft</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                                <AlertCircle className="w-3 h-3 text-slate-400" />
                                <span>Not Created</span>
                              </span>
                            )}
                          </td>

                          {/* Date Updated */}
                          <td className="py-3.5 px-4 text-center font-mono text-slate-500 text-[11px]">
                            {row.dateUpdated}
                          </td>

                          {/* Action Column */}
                          <td className="py-3.5 px-4 text-right">
                            {isNotCreated ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleOpenScoreEntry(row.className, row.session, row.term, undefined)}
                                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#1E3A8A] hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-all"
                                >
                                  <PlusCircle className="w-3.5 h-3.5 text-[#F59E0B]" />
                                  <span>Create Result</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeleteConfirmTarget({
                                    student: selectedStudent,
                                    className: row.className,
                                    session: row.session,
                                    term: row.term,
                                    status: 'Not Created',
                                  })}
                                  className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-all cursor-pointer border border-transparent hover:border-red-200"
                                  title="Delete / Remove this Term or Class Stage"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-end gap-1.5">
                                {/* Quick Publish Button for Draft */}
                                {isDraft && (
                                  <button
                                    type="button"
                                    onClick={() => handleTogglePublish(row)}
                                    className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg cursor-pointer transition-all shadow-xs flex items-center gap-1"
                                    title="Publish this draft result to Student Portal"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Publish</span>
                                  </button>
                                )}

                                {/* View Result Slip */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (row.record) {
                                      const viewObj: StudentResult = {
                                        ...selectedStudent,
                                        className: row.className,
                                        academicSession: row.session,
                                        term: row.term,
                                        subjects: row.record.subjects || [],
                                        overallTotal: row.record.overallTotal || 0,
                                        overallAverage: row.record.overallAverage || 0,
                                        averageScore: row.record.overallAverage || 0,
                                        gpa: row.record.gpa || 0,
                                        status: row.record.status || 'Published',
                                        isPublished: row.record.isPublished !== false,
                                      };
                                      onViewResultSlip(viewObj, row.record);
                                    }
                                  }}
                                  className="p-1.5 bg-blue-50 hover:bg-blue-100 text-[#1E3A8A] rounded-lg cursor-pointer transition-all border border-blue-200 shadow-2xs"
                                  title="View Official Result Slip"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>

                                {/* Edit Result */}
                                <button
                                  type="button"
                                  onClick={() => handleOpenScoreEntry(row.className, row.session, row.term, row.record)}
                                  className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg cursor-pointer transition-all border border-amber-200 shadow-2xs"
                                  title="Edit Subject Scores for this Term"
                                >
                                  <FileEdit className="w-3.5 h-3.5" />
                                </button>

                                {/* Publish / Unpublish Toggle */}
                                <button
                                  type="button"
                                  onClick={() => handleTogglePublish(row)}
                                  className={`p-1.5 rounded-lg cursor-pointer transition-all border shadow-2xs ${
                                    isPub
                                      ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                                  }`}
                                  title={isPub ? 'Published (Click to Unpublish / Hide from Portal)' : 'Draft (Click to Publish to Portal)'}
                                >
                                  {isPub ? <Globe className="w-3.5 h-3.5 text-emerald-600" /> : <Lock className="w-3.5 h-3.5 text-slate-500" />}
                                </button>

                                {/* Print Result Slip */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (row.record) {
                                      const printObj: StudentResult = {
                                        ...selectedStudent,
                                        className: row.className,
                                        academicSession: row.session,
                                        term: row.term,
                                        subjects: row.record.subjects || [],
                                        overallTotal: row.record.overallTotal || 0,
                                        overallAverage: row.record.overallAverage || 0,
                                        averageScore: row.record.overallAverage || 0,
                                        gpa: row.record.gpa || 0,
                                        status: row.record.status || 'Published',
                                        isPublished: row.record.isPublished !== false,
                                      };
                                      onViewResultSlip(printObj, row.record);
                                    }
                                  }}
                                  className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg cursor-pointer transition-all border border-slate-200 shadow-2xs"
                                  title="Print Result Slip"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                </button>

                                {/* Delete Result Record */}
                                <button
                                  type="button"
                                  onClick={() => setDeleteConfirmTarget({
                                    student: selectedStudent,
                                    className: row.className,
                                    session: row.session,
                                    term: row.term,
                                    status: row.status,
                                  })}
                                  className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-all cursor-pointer border border-transparent hover:border-red-200"
                                  title="Delete Result Record"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STUDENT PROMOTION MODAL */}
      {/* ========================================================================= */}
      {isPromoteModalOpen && selectedStudent && (
        <StudentPromotionModal
          isOpen={isPromoteModalOpen}
          onClose={() => setIsPromoteModalOpen(false)}
          student={selectedStudent}
          classList={classList}
          sessions={sessions}
          terms={terms}
          onPromotionComplete={(updatedStudent, msg) => {
            onUpdateStudent(updatedStudent);
            setSelectedStudent(updatedStudent);
            onTriggerToast(msg);
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* ADD ACADEMIC STAGE / CLASS MODAL */}
      {/* ========================================================================= */}
      {isAddStageModalOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full border border-slate-200 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#1E3A8A] flex items-center justify-center font-bold">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#0F172A] font-['Plus_Jakarta_Sans']">
                    Add Academic Class Level
                  </h3>
                  <p className="text-xs text-slate-500">
                    Add next class (e.g. JSS 2, SSS 1) to student's journey
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddStageModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 bg-blue-50/60 rounded-2xl border border-blue-100 text-xs space-y-1 text-slate-700">
              <p><strong>Student:</strong> {selectedStudent.fullName || (selectedStudent as any).name} ({selectedStudent.studentId})</p>
              <p><strong>Current Active Class:</strong> {selectedStudent.className}</p>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-600 block mb-1.5">
                  Select Class Level to Add:
                </label>
                <select
                  value={newStageClass}
                  onChange={(e) => setNewStageClass(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                >
                  {classList.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                  {classList.length === 0 && (
                    <>
                      <option value="JSS 1">JSS 1</option>
                      <option value="JSS 2">JSS 2</option>
                      <option value="JSS 3">JSS 3</option>
                      <option value="SSS 1">SSS 1</option>
                      <option value="SSS 2">SSS 2</option>
                      <option value="SSS 3">SSS 3</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-600 block mb-1.5">
                  Academic Session:
                </label>
                <select
                  value={newStageSession}
                  onChange={(e) => setNewStageSession(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                >
                  {sessions.map(s => {
                    const fullSess = s.year.includes('Academic') ? s.year : `${s.year} Academic Session`;
                    return (
                      <option key={s.id} value={fullSess}>{fullSess}</option>
                    );
                  })}
                  {sessions.length === 0 && (
                    <>
                      <option value="2024/2025 Academic Session">2024/2025 Academic Session</option>
                      <option value="2025/2026 Academic Session">2025/2026 Academic Session</option>
                      <option value="2026/2027 Academic Session">2026/2027 Academic Session</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 italic">
              Once added, First, Second, and Third Term for this class will appear in the student's academic record table ready for score entry.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAddStageModalOpen(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAddStage}
                className="px-5 py-2.5 bg-[#1E3A8A] hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4 text-[#F59E0B]" />
                <span>Add Class Stage</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DELETE CONFIRMATION DIALOG */}
      {/* ========================================================================= */}
      {deleteConfirmTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-2xl bg-red-50 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-[#0F172A] font-['Plus_Jakarta_Sans']">
                  {deleteConfirmTarget.status === 'Not Created' ? 'Remove Term Slot / Stage?' : 'Delete Result Record?'}
                </h3>
                <p className="text-xs text-slate-500">
                  {deleteConfirmTarget.status === 'Not Created'
                    ? 'This will clear any records or stage definitions for this term from the student\'s academic journey.'
                    : 'This will remove the result slip permanently from student portal access.'}
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
              <p><strong>Student:</strong> {deleteConfirmTarget.student.fullName || (deleteConfirmTarget.student as any).name} ({deleteConfirmTarget.student.studentId})</p>
              <p><strong>Class Level:</strong> {deleteConfirmTarget.className}</p>
              <p><strong>Academic Session:</strong> {deleteConfirmTarget.session}</p>
              <p><strong>Academic Term:</strong> {deleteConfirmTarget.term}</p>
              {deleteConfirmTarget.status && (
                <p>
                  <strong>Current Status:</strong>{' '}
                  <span className={
                    deleteConfirmTarget.status === 'Published'
                      ? 'text-emerald-600 font-bold'
                      : deleteConfirmTarget.status === 'Draft'
                      ? 'text-amber-600 font-bold'
                      : 'text-slate-500 font-bold'
                  }>
                    {deleteConfirmTarget.status}
                  </span>
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmTarget(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Yes, Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
