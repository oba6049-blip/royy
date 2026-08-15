import {
  FileSpreadsheet,
  GraduationCap,
  Award,
  BarChart3,
  Megaphone,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';
import { AdminModulePermission } from '../types';

export interface ModulePermissionConfig {
  id: AdminModulePermission;
  name: string;
  category: string;
  description: string;
  icon: LucideIcon;
  color: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  activeColor: string;
  tabIds: string[];
}

export const ALL_ADMIN_MODULES: AdminModulePermission[] = [
  'examination_scores',
  'academic_structure',
  'analytics_reports',
  'school_branding',
  'notices_announcements',
  'staff_management'
];

export const MODULE_PERMISSIONS_LIST: ModulePermissionConfig[] = [
  {
    id: 'examination_scores',
    name: 'Examination & Scores',
    category: 'Assessment & Grades',
    description: 'Record test/exam scores (CA1/CA2), manage student report slips, generate GPA/ranks, and publish records.',
    icon: FileSpreadsheet,
    color: 'emerald',
    badgeBg: 'bg-emerald-50',
    badgeBorder: 'border-emerald-200',
    badgeText: 'text-emerald-800',
    activeColor: 'bg-emerald-600',
    tabIds: ['manage-results', 'enter-results', 'edit-results', 'result-history', 'delete-results']
  },
  {
    id: 'academic_structure',
    name: 'Academic Structure',
    category: 'School Configuration',
    description: 'Manage student rosters, create & assign classes/arms, configure subjects list, academic sessions, and terms.',
    icon: GraduationCap,
    color: 'blue',
    badgeBg: 'bg-blue-50',
    badgeBorder: 'border-blue-200',
    badgeText: 'text-blue-800',
    activeColor: 'bg-blue-600',
    tabIds: ['students', 'classes', 'subjects', 'sessions', 'terms']
  },
  {
    id: 'analytics_reports',
    name: 'Analytics & Reports',
    category: 'Academic Insights',
    description: 'Generate master class broadsheets, view student rank distributions, pass/fail metrics, and grade analytics.',
    icon: BarChart3,
    color: 'amber',
    badgeBg: 'bg-amber-50',
    badgeBorder: 'border-amber-200',
    badgeText: 'text-amber-800',
    activeColor: 'bg-amber-600',
    tabIds: ['reports', 'analytics']
  },
  {
    id: 'school_branding',
    name: 'School Branding',
    category: 'Portal & Report Identity',
    description: 'Upload official school logo/crest, digital authentication stamp & seal, principal signature, and header text.',
    icon: Award,
    color: 'purple',
    badgeBg: 'bg-purple-50',
    badgeBorder: 'border-purple-200',
    badgeText: 'text-purple-800',
    activeColor: 'bg-purple-600',
    tabIds: ['upload-logo', 'upload-stamp', 'upload-signature']
  },
  {
    id: 'notices_announcements',
    name: 'Notices & Announcements',
    category: 'Portal Communication',
    description: 'Create & publish homepage scrolling news ticker alerts, emergency notices, and general portal announcements.',
    icon: Megaphone,
    color: 'rose',
    badgeBg: 'bg-rose-50',
    badgeBorder: 'border-rose-200',
    badgeText: 'text-rose-800',
    activeColor: 'bg-rose-600',
    tabIds: ['notifications']
  },
  {
    id: 'staff_management',
    name: 'Staff & Admin Accounts',
    category: 'Security & User Accounts',
    description: 'Provision teacher and administrative staff logins, reset temporary passwords, and delegate module permissions.',
    icon: ShieldCheck,
    color: 'indigo',
    badgeBg: 'bg-indigo-50',
    badgeBorder: 'border-indigo-200',
    badgeText: 'text-indigo-800',
    activeColor: 'bg-indigo-600',
    tabIds: ['staff-management']
  }
];

export const DEFAULT_ROLE_PERMISSIONS: Record<string, AdminModulePermission[]> = {
  'System Super Administrator': [
    'academic_structure',
    'examination_scores',
    'school_branding',
    'analytics_reports',
    'notices_announcements',
    'staff_management'
  ],
  'Teacher / Exam Officer': [
    'examination_scores',
    'analytics_reports'
  ],
  'Class Teacher': [
    'academic_structure',
    'examination_scores'
  ],
  'Subject Teacher': [
    'examination_scores'
  ],
  'Academic Administrator': [
    'academic_structure',
    'examination_scores',
    'analytics_reports',
    'notices_announcements'
  ]
};

export function isUserSuperAdmin(user?: { role?: string; email?: string } | null): boolean {
  if (!user) return false;
  const role = (user.role || '').toLowerCase();
  return role.includes('super') || role.includes('principal') || role.includes('proprietor');
}

export function resolveAdminPermissions(
  role?: string,
  customPermissions?: AdminModulePermission[]
): AdminModulePermission[] {
  if (Array.isArray(customPermissions) && customPermissions.length > 0) {
    return customPermissions;
  }
  if (role && (role.toLowerCase().includes('super') || role.toLowerCase().includes('principal'))) {
    return DEFAULT_ROLE_PERMISSIONS['System Super Administrator'];
  }
  return DEFAULT_ROLE_PERMISSIONS[role || ''] || ['examination_scores'];
}

export function hasModulePermission(
  user: { role?: string; email?: string; permissions?: AdminModulePermission[] } | null | undefined,
  module: AdminModulePermission
): boolean {
  if (!user) return false;
  if (isUserSuperAdmin(user)) return true;
  const perms = resolveAdminPermissions(user.role, user.permissions);
  return perms.includes(module);
}

export const TAB_TO_MODULE_MAP: Record<string, AdminModulePermission | null> = {
  'dashboard': null, // Open to all authenticated admins
  'login': null,     // Open to all authenticated admins
  'students': 'academic_structure',
  'classes': 'academic_structure',
  'subjects': 'academic_structure',
  'sessions': 'academic_structure',
  'terms': 'academic_structure',
  'manage-results': 'examination_scores',
  'enter-results': 'examination_scores',
  'edit-results': 'examination_scores',
  'result-history': 'examination_scores',
  'delete-results': 'examination_scores',
  'upload-logo': 'school_branding',
  'upload-stamp': 'school_branding',
  'upload-signature': 'school_branding',
  'reports': 'analytics_reports',
  'analytics': 'analytics_reports',
  'notifications': 'notices_announcements',
  'staff-management': 'staff_management'
};

export function isTabAuthorized(
  tabId: string,
  user: { role?: string; email?: string; permissions?: AdminModulePermission[] } | null | undefined
): boolean {
  if (!user) return false;
  if (isUserSuperAdmin(user)) return true;
  const requiredModule = TAB_TO_MODULE_MAP[tabId];
  if (!requiredModule) return true; // tabs with no specific module restriction like dashboard
  return hasModulePermission(user, requiredModule);
}
