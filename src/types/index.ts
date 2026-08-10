export interface SubjectGrade {
  id: string;
  subject: string;
  caScore: number; // e.g. 30/30 or 40/40
  examScore: number; // e.g. 70/70 or 60/60
  total: number; // e.g. 100
  grade: 'A1' | 'B2' | 'B3' | 'C4' | 'C5' | 'C6' | 'D7' | 'E8' | 'F9';
  remark: 'EXCELLENT' | 'VERY GOOD' | 'GOOD' | 'CREDIT' | 'PASS' | 'FAIR' | 'POOR' | 'FAIL';
  creditHours?: number;
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
  position: number;
  totalInClass: number;
  status: 'PROMOTED' | 'PROMOTED ON TRIAL' | 'GRADUATED' | 'REPEAT';
  classTeacherRemark: string;
  principalRemark: string;
  verificationHash: string;
  issueDate: string;
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
