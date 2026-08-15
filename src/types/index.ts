export interface SubjectGrade {
  id: string;
  subject: string;
  caScore: number; // e.g. 30/30 or 40/40
  examScore: number; // e.g. 70/70 or 60/60
  ca1?: number;
  ca2?: number;
  midterm?: number;
  exam?: number;
  total: number; // e.g. 100
  grade: 'A1' | 'B2' | 'B3' | 'C4' | 'C5' | 'C6' | 'D7' | 'E8' | 'F9' | string;
  remark: 'EXCELLENT' | 'VERY GOOD' | 'GOOD' | 'CREDIT' | 'PASS' | 'FAIR' | 'POOR' | 'FAIL' | string;
  creditHours?: number;
}

export interface StudentTermRecord {
  academicSession: string; // e.g. 2024/2025 Academic Session
  term: string; // e.g. First Term
  className: string; // e.g. JSS 1 Gold
  subjects: SubjectGrade[];
  overallTotal: number;
  overallAverage: number;
  gpa: number;
  position?: number | string;
  totalInClass?: number;
  status?: string;
  isPublished?: boolean;
  issueDate?: string;
  updatedAt?: string;
}

export interface StudentResult {
  studentId: string; // e.g. 2025104
  fullName: string;
  passportUrl: string;
  gender: 'Male' | 'Female';
  className: string; // e.g. SSS 3 Science A
  academicSession: string; // e.g. 2025/2026 Academic Session
  term: string; // e.g. First Term
  dateOfBirth: string;
  age?: string;
  house?: string;
  attendance: {
    timesOpened: number;
    timesPresent: number;
    timesAbsent: number;
  };
  behavioralTraits: {
    punctuality: number; // out of 5
    neatness: number;
    leadership: number;
    honesty: number;
  };
  subjects: SubjectGrade[];
  overallTotal: number;
  overallAverage: number;
  gpa: number; // 4.0 scale e.g. 3.88
  position: number | string;
  totalInClass: number;
  status: 'PROMOTED' | 'PROMOTED ON TRIAL' | 'GRADUATED' | 'REPEAT' | string;
  classTeacherRemark: string;
  principalRemark: string;
  verificationHash: string;
  issueDate: string;
  termRecords?: StudentTermRecord[];
  deletedTerms?: string[];
  deletedStages?: string[];
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: 'General' | 'Security' | 'Results' | 'Parents' | 'Technical';
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  avatar: string;
  quote: string;
  rating: number;
  tag: 'Parent' | 'Student' | 'Teacher' | 'Alumni';
}

export interface Feature {
  id: string;
  iconName: string;
  title: string;
  description: string;
  badge?: string;
  highlight?: boolean;
}

export interface StatItem {
  id: string;
  value: string;
  numberValue: number;
  suffix: string;
  label: string;
  description: string;
}

export interface AdminStudentSummary {
  studentId: string;
  name: string;
  className: string;
  gpa: number;
  status: 'Published' | 'Pending Review' | 'Draft' | 'Flagged';
  lastUpdated: string;
  averageScore: number;
}

export interface BrandingTransform {
  x: number;
  y: number;
  scale: number;
  rotate: number;
}

export interface BrandingInfo {
  logoUrl?: string | null;
  stampUrl?: string | null;
  signatureUrl?: string | null;
  positions?: {
    logo?: BrandingTransform;
    stamp?: BrandingTransform;
    signature?: BrandingTransform;
  };
}

export interface SchoolHeaderInfo {
  schoolName: string;
  reportTitle: string;
  addressSubtitle: string;
}

export interface SchoolNotification {
  id: string;
  headline: string;
  message?: string;
  tag?: string;
  category?: 'results' | 'general' | 'admission' | 'urgent';
  urgency?: 'normal' | 'high' | 'urgent';
  academicSession?: string;
  term?: string;
  linkText?: string;
  targetAction?: 'check_result' | 'student_portal' | 'none';
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export type AdminModulePermission =
  | 'academic_structure'
  | 'examination_scores'
  | 'school_branding'
  | 'analytics_reports'
  | 'notices_announcements'
  | 'staff_management';

export interface AdminAccount {
  id: string;
  email: string;
  name: string;
  role: 'System Super Administrator' | 'Teacher / Exam Officer' | 'Class Teacher' | 'Academic Administrator' | 'Subject Teacher' | string;
  assignedClass?: string;
  assignedSubject?: string;
  phone?: string;
  permissions?: AdminModulePermission[];
  mustChangePassword?: boolean;
  isFirstLogin?: boolean;
  temporaryPassword?: string;
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
}

export const DEFAULT_SCHOOL_HEADER: SchoolHeaderInfo = {
  schoolName: 'ROYAL ACADEMY',
  reportTitle: 'Student Mid-Term Report',
  addressSubtitle: 'Victoria Island, Lagos, Nigeria • Official Academic Record',
};
