import { StudentResult, FAQItem, Testimonial, Feature, StatItem, AdminStudentSummary } from '../types';

export const MOCK_STUDENTS: Record<string, StudentResult> = {
  '2025101': {
    studentId: '2025101',
    fullName: 'Adeyemi Faridah',
    passportUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400',
    gender: 'Female',
    age: '17 Yrs',
    house: 'Emerald House',
    className: 'Senior Secondary School 3 (SSS 3 - Science)',
    academicSession: '2024/2025 Academic Session',
    term: '3rd Term (Final Session)',
    dateOfBirth: '2007-08-19',
    attendance: {
      timesOpened: 120,
      timesPresent: 120,
      timesAbsent: 0
    },
    behavioralTraits: {
      punctuality: 5,
      neatness: 5,
      leadership: 5,
      honesty: 5
    },
    subjects: [
      { id: 'sub-1', subject: 'Mathematics', caScore: 40, examScore: 58, total: 98, grade: 'A1', remark: 'EXCELLENT' },
      { id: 'sub-2', subject: 'English Language', caScore: 38, examScore: 56, total: 94, grade: 'A1', remark: 'EXCELLENT' },
      { id: 'sub-3', subject: 'Physics', caScore: 39, examScore: 57, total: 96, grade: 'A1', remark: 'EXCELLENT' },
      { id: 'sub-4', subject: 'Chemistry', caScore: 38, examScore: 55, total: 93, grade: 'A1', remark: 'EXCELLENT' },
      { id: 'sub-5', subject: 'Biology', caScore: 37, examScore: 56, total: 93, grade: 'A1', remark: 'EXCELLENT' },
      { id: 'sub-6', subject: 'Further Mathematics', caScore: 38, examScore: 57, total: 95, grade: 'A1', remark: 'EXCELLENT' },
      { id: 'sub-7', subject: 'Agricultural Science', caScore: 37, examScore: 56, total: 93, grade: 'A1', remark: 'EXCELLENT' },
      { id: 'sub-8', subject: 'Civic Education', caScore: 39, examScore: 56, total: 95, grade: 'A1', remark: 'EXCELLENT' },
      { id: 'sub-9', subject: 'Computer Studies', caScore: 40, examScore: 57, total: 97, grade: 'A1', remark: 'EXCELLENT' }
    ],
    overallTotal: 854,
    overallAverage: 94.9,
    gpa: 4.00,
    position: 1,
    totalInClass: 42,
    status: 'GRADUATED',
    classTeacherRemark: 'Faridah is an extraordinarily gifted scholar who has earned top valedictorian position with near flawless academic performance.',
    principalRemark: 'Valedictorian candidate. Highest academic distinction honor achieved.',
    verificationHash: 'RA-SEC-99F1A280C1E4',
    issueDate: 'August 05, 2025'
  },

  '2025104': {
    studentId: '2025104',
    fullName: 'Fariat (David Okon)',
    passportUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=400',
    gender: 'Male',
    age: '17 Yrs',
    house: 'Ruby House',
    className: 'Senior Secondary School 3 (SSS 3 - Science)',
    academicSession: '2024/2025 Academic Session',
    term: '3rd Term (Final Session)',
    dateOfBirth: '2007-04-14',
    attendance: {
      timesOpened: 120,
      timesPresent: 118,
      timesAbsent: 2
    },
    behavioralTraits: {
      punctuality: 5,
      neatness: 5,
      leadership: 5,
      honesty: 5
    },
    subjects: [
      { id: 'sub-1', subject: 'Mathematics', caScore: 40, examScore: 55, total: 95, grade: 'A1', remark: 'EXCELLENT' },
      { id: 'sub-2', subject: 'English Language', caScore: 37, examScore: 53, total: 90, grade: 'A1', remark: 'EXCELLENT' },
      { id: 'sub-3', subject: 'Physics', caScore: 38, examScore: 52, total: 90, grade: 'A1', remark: 'EXCELLENT' },
      { id: 'sub-4', subject: 'Chemistry', caScore: 36, examScore: 50, total: 86, grade: 'A1', remark: 'EXCELLENT' },
      { id: 'sub-5', subject: 'Biology', caScore: 34, examScore: 51, total: 85, grade: 'A1', remark: 'EXCELLENT' },
      { id: 'sub-6', subject: 'Further Mathematics', caScore: 36, examScore: 52, total: 88, grade: 'A1', remark: 'EXCELLENT' },
      { id: 'sub-7', subject: 'Agricultural Science', caScore: 36, examScore: 51, total: 87, grade: 'A1', remark: 'EXCELLENT' },
      { id: 'sub-8', subject: 'Civic Education', caScore: 38, examScore: 53, total: 91, grade: 'A1', remark: 'EXCELLENT' },
      { id: 'sub-9', subject: 'Computer Studies', caScore: 40, examScore: 53, total: 93, grade: 'A1', remark: 'EXCELLENT' }
    ],
    overallTotal: 805,
    overallAverage: 89.4,
    gpa: 3.92,
    position: 1,
    totalInClass: 42,
    status: 'GRADUATED',
    classTeacherRemark: 'David has consistently demonstrated exceptional intellectual curiosity and academic discipline throughout the session. A brilliant role model for his peers.',
    principalRemark: 'An outstanding academic record. Highly recommended for university admission with distinction honors.',
    verificationHash: 'RA-SEC-89A4B290C7D1',
    issueDate: 'August 05, 2025'
  }
};

export const SESSIONS_LIST = [
  '2024/2025 Academic Session',
  '2023/2024 Academic Session',
  '2022/2023 Academic Session'
];

export const TERMS_LIST = [
  '3rd Term (Final Session)',
  '2nd Term (Mid-Session)',
  '1st Term (First Session)'
];

export const CLASSES_LIST = [
  'Senior Secondary School 3 (SSS 3 - Science)',
  'Senior Secondary School 2 (SSS 2 - Arts)',
  'Senior Secondary School 1 (SSS 1 - Commercial)',
  'Junior Secondary School 3 (JSS 3 - B)',
  'Junior Secondary School 2 (JSS 2 - A)',
  'Junior Secondary School 1 (JSS 1 - C)'
];

export const STATS_DATA: StatItem[] = [
  {
    id: '1',
    value: '99.8%',
    numberValue: 99.8,
    suffix: '%',
    label: 'Result Processing Speed',
    description: 'Instant lookup within <0.2 seconds across all devices.'
  },
  {
    id: '2',
    value: '12,500+',
    numberValue: 12500,
    suffix: '+',
    label: 'Verified Students',
    description: 'Active students and alumni accessing digital transcripts.'
  },
  {
    id: '3',
    value: '100%',
    numberValue: 100,
    suffix: '%',
    label: 'Tamper-Proof Security',
    description: 'Verified digital transcripts & official school seals.'
  },
  {
    id: '4',
    value: '24/7',
    numberValue: 24,
    suffix: '/7',
    label: 'Global Online Access',
    description: 'Zero downtime result retrieval for parents and guardians.'
  }
];

export const FEATURES_DATA: Feature[] = [
  {
    id: '1',
    iconName: 'Zap',
    title: 'Instant Result Checking',
    description: 'Access complete academic scorecards in seconds from any smartphone, tablet, or desktop.',
    badge: 'Real-Time',
    highlight: true
  },
  {
    id: '2',
    iconName: 'UserCheck',
    title: 'No Student Login Required',
    description: 'Zero complex passwords or forgotten credentials. Simple Reg ID validation gets you in instantly.',
    badge: 'Seamless'
  },
  {
    id: '3',
    iconName: 'ShieldCheck',
    title: 'Official Stamp & Verification',
    description: 'Every printed report card features official school stamp, registrar signatures, and verification seal.',
    badge: 'Verified',
    highlight: true
  },
  {
    id: '4',
    iconName: 'Printer',
    title: 'Professional Printable Format',
    description: 'Generate high-resolution, official Royal Academy report slips complete with signatures and school stamp.',
    badge: 'Official'
  },
  {
    id: '5',
    iconName: 'Cpu',
    title: 'Fast Automated Processing',
    description: 'Enterprise grade infrastructure capable of serving thousands of simultaneous requests during release days.',
    badge: 'Scalable'
  },
  {
    id: '6',
    iconName: 'LayoutDashboard',
    title: 'Admin Result Management',
    description: 'Comprehensive portal for school administrators to upload bulk CSV results, edit grades, and publish instantly.',
    badge: 'Enterprise'
  },
  {
    id: '7',
    iconName: 'Smartphone',
    title: 'Responsive & Accessible',
    description: 'Engineered desktop-down and mobile-up for flawless performance on all modern screens.',
    badge: 'Mobile First'
  },
  {
    id: '8',
    iconName: 'History',
    title: 'Academic History Archive',
    description: 'Seamlessly query past academic sessions, terms, and historical performance trends over time.',
    badge: 'Archive'
  }
];

export const WORKFLOW_STEPS = [
  {
    step: '01',
    title: 'Administrator Uploads Results',
    description: 'Teachers and exam officers upload verified grade spreadsheets into the encrypted admin portal.',
    iconName: 'UploadCloud'
  },
  {
    step: '02',
    title: 'Automated Cryptographic Hash',
    description: 'System automatically verifies grade weightings, computes GPAs, and generates unique QR security hashes.',
    iconName: 'CheckCircle2'
  },
  {
    step: '03',
    title: 'Portal Release Notification',
    description: 'Official results are published instantly. Parents and students receive notification alerts.',
    iconName: 'Bell'
  },
  {
    step: '04',
    title: 'Enter Student ID & Term',
    description: 'Users enter their official registration number and select session/term parameters.',
    iconName: 'Search'
  },
  {
    step: '05',
    title: 'View & Print Authentic Slip',
    description: 'Instantly view, download, or print official academic result slips with digital seals.',
    iconName: 'FileCheck2'
  }
];

export const TESTIMONIALS_DATA: Testimonial[] = [
  {
    id: '1',
    name: 'Dr. Elizabeth Sterling',
    role: 'Parent of Senior High Graduate',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200',
    quote: 'Checking my son’s final examination results was ridiculously fast and smooth. The printed report slip looked as official as university transcripts!',
    rating: 5,
    tag: 'Parent'
  },
  {
    id: '2',
    name: 'Michael Chen',
    role: 'Vice Principal (Academics)',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=200',
    quote: 'The admin dashboard cut our result processing time from weeks down to under two hours. The automated QR verification eliminated result tampering completely.',
    rating: 5,
    tag: 'Teacher'
  },
  {
    id: '3',
    name: 'Samantha Vance',
    role: 'Head Girl & SSS 3 Honor Student',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200',
    quote: 'I love that I can check my grades on my smartphone the second they are released without logging into complicated accounts or facing crashed servers.',
    rating: 5,
    tag: 'Student'
  }
];

export const FAQ_DATA: FAQItem[] = [
  {
    id: 'faq-1',
    question: 'How do students check their examination results?',
    answer: 'Students simply navigate to the Result Checking demo section on this portal, input their unique 7-digit Registration Number (e.g., 2025104), select their session, term, and class, and click "Check Result". Your result slip will load instantly.',
    category: 'Results'
  },
  {
    id: 'faq-2',
    question: 'Do students or parents need a user account or password?',
    answer: 'No password is required! The portal is designed for maximum convenience while maintaining security. By validating unique 7-digit Student Registration IDs and session details, results are fetched securely without password friction.',
    category: 'General'
  },
  {
    id: 'faq-3',
    question: 'Can result slips be printed or downloaded as PDF?',
    answer: 'Yes! Every result slip includes a dedicated "Print Result Slip" and "Download PDF" button. It renders in a high-resolution, print-ready format with school crest, official signatures, and QR verification stamp.',
    category: 'Results'
  },
  {
    id: 'faq-4',
    question: 'How secure is the result verification system?',
    answer: 'Extremely secure. Every generated report includes a unique cryptographic SHA-256 hash and a dynamic QR code. Anyone scanning the QR code can immediately verify the result against Royal Academy’s master database to confirm authenticity.',
    category: 'Security'
  },
  {
    id: 'faq-5',
    question: 'Can we access results from previous academic sessions?',
    answer: 'Yes, the portal archives all academic records. Simply select the past Academic Session (e.g., 2023/2024) and Term from the search parameters.',
    category: 'Results'
  },
  {
    id: 'faq-6',
    question: 'Who uploads and manages the student results?',
    answer: 'Authorized school administrators and exam officers manage results through the secure Admin Portal. Results undergo double verification before being published to the public portal.',
    category: 'Technical'
  }
];

export const ADMIN_MOCK_STUDENTS: AdminStudentSummary[] = [
  { studentId: '2025101', name: 'Adeyemi Faridah', className: 'SSS 3 Science A', gpa: 4.00, status: 'Published', lastUpdated: 'Today, 08:00 AM', averageScore: 94.9 },
  { studentId: '2025104', name: 'Fariat (David Okon)', className: 'SSS 3 Science A', gpa: 3.92, status: 'Published', lastUpdated: 'Today, 08:30 AM', averageScore: 89.4 }
];
