import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  ShieldCheck,
  Shield,
  KeyRound,
  Lock,
  Mail,
  Phone,
  GraduationCap,
  BookOpen,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Copy,
  RefreshCw,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  UserCheck,
  Check,
  ExternalLink,
  ShieldAlert,
  UserX,
  FileSpreadsheet,
  Award,
  BarChart3,
  Megaphone
} from 'lucide-react';
import { api } from '../services/api';
import { AdminAccount, AdminModulePermission } from '../types';
import { ModulePermissionsSelector } from './ModulePermissionsSelector';
import {
  MODULE_PERMISSIONS_LIST,
  DEFAULT_ROLE_PERMISSIONS,
  resolveAdminPermissions,
  isUserSuperAdmin,
  ALL_ADMIN_MODULES
} from '../utils/adminPermissions';

interface AdminStaffManagementProps {
  currentAdmin: {
    name: string;
    email: string;
    role: string;
  };
  classList: Array<{ id: string; name: string }>;
  subjectList: Array<{ id: string; name: string }>;
  onTriggerToast: (message: string) => void;
}

export const AdminStaffManagement: React.FC<AdminStaffManagementProps> = ({
  currentAdmin,
  classList,
  subjectList,
  onTriggerToast,
}) => {
  const [admins, setAdmins] = useState<AdminAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Selected Admin for actions
  const [selectedAdmin, setSelectedAdmin] = useState<AdminAccount | null>(null);

  // Form states
  const [formData, setFormData] = useState<{
    name: string;
    email: string;
    role: string;
    assignedClass: string;
    assignedSubject: string;
    phone: string;
    password?: string;
    permissions: AdminModulePermission[];
  }>({
    name: '',
    email: '',
    role: 'Teacher / Exam Officer',
    assignedClass: 'All Classes',
    assignedSubject: 'All Subjects',
    phone: '',
    password: '',
    permissions: ['examination_scores', 'analytics_reports'],
  });
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Reset password state
  const [newTempPassword, setNewTempPassword] = useState('');
  const [showTempPassword, setShowTempPassword] = useState(false);

  // Created credentials modal / notification preview
  const [createdAdminCredentials, setCreatedAdminCredentials] = useState<{
    name: string;
    email: string;
    role: string;
    temporaryPassword: string;
    permissions?: AdminModulePermission[];
  } | null>(null);

  const isSuperAdmin = isUserSuperAdmin(currentAdmin);

  const loadAdmins = async () => {
    setIsLoading(true);
    try {
      const data = await api.getAdmins();
      if (Array.isArray(data)) {
        setAdmins(data);
      }
    } catch (err: any) {
      onTriggerToast(err.message || 'Failed to load staff list.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  const generateRandomPassword = () => {
    const prefixes = ['Royal', 'Academy', 'Staff', 'Teacher', 'Leader', 'Global'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const year = 2025 + Math.floor(Math.random() * 2);
    const randomDigits = Math.floor(100 + Math.random() * 900);
    const symbols = ['@', '#', '$', '!'];
    const symbol = symbols[Math.floor(Math.random() * symbols.length)];
    return `${prefix}${symbol}${year}${randomDigits}`;
  };

  const handleOpenAddModal = () => {
    const initialRole = 'Teacher / Exam Officer';
    setFormData({
      name: '',
      email: '',
      role: initialRole,
      assignedClass: classList[0]?.name || 'All Classes',
      assignedSubject: subjectList[0]?.name || 'All Subjects',
      phone: '',
      password: generateRandomPassword(),
      permissions: [...(DEFAULT_ROLE_PERMISSIONS[initialRole] || ['examination_scores', 'analytics_reports'])],
    });
    setShowPasswordInput(false);
    setIsAddModalOpen(true);
  };

  const handleRoleSelectChange = (newRole: string) => {
    const defaultPerms = DEFAULT_ROLE_PERMISSIONS[newRole] || ['examination_scores'];
    setFormData((prev) => ({
      ...prev,
      role: newRole,
      permissions: [...defaultPerms],
    }));
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      onTriggerToast('Please fill in all required fields (Name, Email, Password).');
      return;
    }

    if (formData.password.length < 6) {
      onTriggerToast('Initial password must be at least 6 characters.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await api.createAdmin({
        ...formData,
        permissions: formData.permissions,
        createdBy: `${currentAdmin.name} (${currentAdmin.role})`,
      });

      if (res.success && res.admin) {
        setAdmins((prev) => [res.admin, ...prev]);
        setIsAddModalOpen(false);
        setCreatedAdminCredentials({
          name: res.admin.name,
          email: res.admin.email,
          role: res.admin.role,
          temporaryPassword: formData.password,
          permissions: res.admin.permissions || formData.permissions,
        });
        onTriggerToast(`Staff account for "${res.admin.name}" created successfully!`);
      } else {
        onTriggerToast(res.error || 'Failed to create staff account.');
      }
    } catch (err: any) {
      onTriggerToast(err.message || 'Error occurred while saving account.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenEditModal = (admin: AdminAccount) => {
    setSelectedAdmin(admin);
    const existingPerms = resolveAdminPermissions(admin.role, admin.permissions);
    setFormData({
      name: admin.name,
      email: admin.email,
      role: admin.role,
      assignedClass: admin.assignedClass || 'All Classes',
      assignedSubject: admin.assignedSubject || 'All Subjects',
      phone: admin.phone || '',
      password: '',
      permissions: [...existingPerms],
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdmin) return;

    setIsSaving(true);
    try {
      const res = await api.updateAdmin(selectedAdmin.id || selectedAdmin.email, {
        name: formData.name,
        role: formData.role,
        permissions: formData.permissions,
        assignedClass: formData.assignedClass,
        assignedSubject: formData.assignedSubject,
        phone: formData.phone,
      });

      if (res.success && res.admin) {
        setAdmins((prev) =>
          prev.map((a) =>
            a.id === selectedAdmin.id || a.email === selectedAdmin.email
              ? { ...a, ...res.admin }
              : a
          )
        );
        setIsEditModalOpen(false);
        onTriggerToast(`Updated details & permissions for "${formData.name}"!`);
      } else {
        onTriggerToast('Failed to update staff account.');
      }
    } catch (err: any) {
      onTriggerToast(err.message || 'Update failed.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenResetModal = (admin: AdminAccount) => {
    setSelectedAdmin(admin);
    setNewTempPassword(generateRandomPassword());
    setShowTempPassword(false);
    setIsResetModalOpen(true);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdmin || !newTempPassword) return;

    setIsSaving(true);
    try {
      const res = await api.resetAdminPassword(
        selectedAdmin.id || selectedAdmin.email,
        newTempPassword
      );

      if (res.success) {
        setAdmins((prev) =>
          prev.map((a) =>
            a.id === selectedAdmin.id || a.email === selectedAdmin.email
              ? {
                  ...a,
                  mustChangePassword: true,
                  isFirstLogin: true,
                  temporaryPassword: newTempPassword,
                }
              : a
          )
        );
        setIsResetModalOpen(false);
        setCreatedAdminCredentials({
          name: selectedAdmin.name,
          email: selectedAdmin.email,
          role: selectedAdmin.role,
          temporaryPassword: newTempPassword,
        });
        onTriggerToast(
          `Password reset for "${selectedAdmin.name}". They will be forced to change it on next login.`
        );
      } else {
        onTriggerToast('Failed to reset password.');
      }
    } catch (err: any) {
      onTriggerToast(err.message || 'Error resetting password.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenDeleteModal = (admin: AdminAccount) => {
    setSelectedAdmin(admin);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteAdmin = async () => {
    if (!selectedAdmin) return;

    if (selectedAdmin.email.toLowerCase() === currentAdmin.email.toLowerCase()) {
      onTriggerToast('You cannot delete your own currently active logged-in administrator account.');
      setIsDeleteModalOpen(false);
      return;
    }

    setIsSaving(true);
    try {
      const success = await api.deleteAdmin(selectedAdmin.id || selectedAdmin.email);
      if (success) {
        setAdmins((prev) =>
          prev.filter((a) => a.id !== selectedAdmin.id && a.email !== selectedAdmin.email)
        );
        setIsDeleteModalOpen(false);
        onTriggerToast(`Staff account for "${selectedAdmin.name}" deleted.`);
      } else {
        onTriggerToast('Could not delete staff account.');
      }
    } catch (err: any) {
      onTriggerToast(err.message || 'Failed to delete staff account.');
    } finally {
      setIsSaving(false);
    }
  };

  const copyToClipboard = (text: string, id: string, label = 'Copied to clipboard!') => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    onTriggerToast(label);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const copyFormattedCredentials = (creds: {
    name: string;
    email: string;
    role: string;
    temporaryPassword?: string;
  }) => {
    const formatted = `🌟 FAITH ACADEMY STAFF PORTAL LOGIN CREDENTIALS
👤 Staff Name: ${creds.name}
💼 Role: ${creds.role}
📧 Login Email: ${creds.email}
🔑 Temporary Password: ${creds.temporaryPassword || 'Your current password'}
🔒 Security Notice: You will be prompted to create your own secure personal password upon your first login.
🌐 Portal Link: ${window.location.origin}`;

    copyToClipboard(formatted, 'creds-all', 'Formatted login credentials copied to clipboard!');
  };

  // Filtered List
  const filteredAdmins = admins.filter((a) => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      a.name.toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q) ||
      (a.role && a.role.toLowerCase().includes(q)) ||
      (a.assignedClass && a.assignedClass.toLowerCase().includes(q)) ||
      (a.assignedSubject && a.assignedSubject.toLowerCase().includes(q));

    const perms = resolveAdminPermissions(a.role, a.permissions);
    const isSuper = isUserSuperAdmin(a);

    let matchesRole = true;
    if (roleFilter === 'Super Admin') {
      matchesRole = isSuper;
    } else if (roleFilter === 'Teachers') {
      matchesRole = !isSuper;
    } else if (roleFilter === 'Pending Setup') {
      matchesRole = !!(a.mustChangePassword || a.isFirstLogin);
    } else if (roleFilter === 'perm_examination_scores') {
      matchesRole = isSuper || perms.includes('examination_scores');
    } else if (roleFilter === 'perm_academic_structure') {
      matchesRole = isSuper || perms.includes('academic_structure');
    } else if (roleFilter === 'perm_analytics_reports') {
      matchesRole = isSuper || perms.includes('analytics_reports');
    } else if (roleFilter === 'perm_school_branding') {
      matchesRole = isSuper || perms.includes('school_branding');
    } else if (roleFilter === 'perm_notices_announcements') {
      matchesRole = isSuper || perms.includes('notices_announcements');
    } else if (roleFilter === 'perm_staff_management') {
      matchesRole = isSuper || perms.includes('staff_management');
    }

    return matchesSearch && matchesRole;
  });

  const totalStaff = admins.length;
  const totalSuperAdmins = admins.filter((a) => isUserSuperAdmin(a)).length;
  const totalTeachers = admins.filter((a) => !isUserSuperAdmin(a)).length;
  const totalPendingFirstLogin = admins.filter(
    (a) => a.mustChangePassword || a.isFirstLogin
  ).length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-[#1E3A8A] text-xs font-bold mb-2 border border-blue-100">
            <ShieldCheck className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span>Staff Administration & Role Access Control</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#0F172A] font-['Plus_Jakarta_Sans']">
            Teachers & Staff Admin Accounts
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Super Admins can assign custom module permissions (Examination & Scores, Academic Structure, School Branding, Analytics, Announcements, Staff Accounts) and manage first-time login security.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={loadAdmins}
            disabled={isLoading}
            className="px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#1E3A8A]' : 'text-slate-500'}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {isSuperAdmin && (
            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2.5 bg-[#1E3A8A] hover:bg-[#1e40af] text-white font-bold text-xs rounded-xl shadow-md shadow-blue-900/20 flex items-center gap-2 cursor-pointer transition-all"
            >
              <UserPlus className="w-4 h-4 text-[#F59E0B]" />
              <span>Add Staff / Teacher Admin</span>
            </button>
          )}
        </div>
      </div>

      {/* Security Info Card */}
      <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0 border border-blue-100">
            <Lock className="w-5 h-5 text-[#1E3A8A]" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>Granular Role-Based Access Control & Mandatory Password Setup</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-mono font-bold border border-emerald-200">
                ENFORCED
              </span>
            </h4>
            <p className="text-xs text-slate-600 mt-0.5 max-w-2xl leading-relaxed">
              Every staff member only sees and accesses the specific dashboard modules you authorize. Plus, temporary passwords automatically trigger a mandatory password setup on first login.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono bg-slate-50 text-slate-700 px-3.5 py-2 rounded-xl border border-slate-200 shrink-0">
          <Shield className="w-4 h-4 text-[#1E3A8A]" />
          <span>Logged in as: <strong className="text-[#1E3A8A]">{currentAdmin.role}</strong></span>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>Total Staff Accounts</span>
            <Users className="w-4 h-4 text-[#1E3A8A]" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-[#0F172A] font-['Plus_Jakarta_Sans']">
            {totalStaff}
          </p>
          <p className="text-[10px] text-slate-400 font-mono">Registered Portal Admins</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>Super Administrators</span>
            <ShieldCheck className="w-4 h-4 text-[#F59E0B]" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-[#1E3A8A] font-['Plus_Jakarta_Sans']">
            {totalSuperAdmins}
          </p>
          <p className="text-[10px] text-slate-400 font-mono">Full System Privileges</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>Teachers & Officers</span>
            <GraduationCap className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-600 font-['Plus_Jakarta_Sans']">
            {totalTeachers}
          </p>
          <p className="text-[10px] text-slate-400 font-mono">Role-Restricted Scope</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>Pending First Login</span>
            <KeyRound className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-amber-600 font-['Plus_Jakarta_Sans']">
            {totalPendingFirstLogin}
          </p>
          <p className="text-[10px] text-amber-600/80 font-mono">Password Setup Required</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search staff by name, email, role, or assigned class..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-500 shrink-0">Filter:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
          >
            <option value="All">All Roles ({totalStaff})</option>
            <option value="Super Admin">Super Admins ({totalSuperAdmins})</option>
            <option value="Teachers">Teachers / Exam Officers ({totalTeachers})</option>
            <option value="perm_examination_scores">Module: Examination & Scores</option>
            <option value="perm_academic_structure">Module: Academic Structure</option>
            <option value="perm_analytics_reports">Module: Analytics & Reports</option>
            <option value="perm_school_branding">Module: School Branding</option>
            <option value="perm_notices_announcements">Module: Notices & Announcements</option>
            <option value="perm_staff_management">Module: Staff & Admin Accounts</option>
            <option value="Pending Setup">Pending Password Setup ({totalPendingFirstLogin})</option>
          </select>
        </div>
      </div>

      {/* Staff Accounts Table / List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-[#1E3A8A] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-bold text-slate-500">Loading staff database...</p>
          </div>
        ) : filteredAdmins.length === 0 ? (
          <div className="py-16 text-center space-y-3 px-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-800">No staff accounts found</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery
                ? `No staff members matched your search query "${searchQuery}".`
                : 'Get started by clicking "Add Staff / Teacher Admin" above.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4 sm:px-6">Staff Member</th>
                  <th className="py-3.5 px-4">Role & Class Scope</th>
                  <th className="py-3.5 px-4">Authorized Modules</th>
                  <th className="py-3.5 px-4">Security / Password Status</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium">
                {filteredAdmins.map((admin) => {
                  const isSuper = isUserSuperAdmin(admin);
                  const needsPasswordChange = admin.mustChangePassword || admin.isFirstLogin;
                  const perms = resolveAdminPermissions(admin.role, admin.permissions);
                  const initials = admin.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase();

                  return (
                    <tr
                      key={admin.id || admin.email}
                      className="hover:bg-blue-50/40 transition-colors"
                    >
                      {/* Staff Member */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 shadow-2xs ${
                              isSuper
                                ? 'bg-[#1E3A8A] text-[#F59E0B] border border-amber-300/40'
                                : 'bg-blue-100 text-[#1E3A8A] border border-blue-200'
                            }`}
                          >
                            {initials}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-black text-[#0F172A] text-sm">
                                {admin.name}
                              </span>
                              {isSuper && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                                  SUPER
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-500 mt-0.5 font-mono text-[11px]">
                              <Mail className="w-3 h-3 text-slate-400" />
                              <span>{admin.email}</span>
                              <button
                                type="button"
                                onClick={() =>
                                  copyToClipboard(admin.email, `email-${admin.email}`, 'Email copied!')
                                }
                                className="text-slate-400 hover:text-[#1E3A8A] p-0.5 cursor-pointer"
                                title="Copy Email"
                              >
                                {copiedId === `email-${admin.email}` ? (
                                  <Check className="w-3 h-3 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                            {admin.phone && (
                              <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                                <Phone className="w-2.5 h-2.5" />
                                <span>{admin.phone}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Role & Scope */}
                      <td className="py-4 px-4 space-y-1">
                        <div>
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold ${
                              isSuper
                                ? 'bg-blue-50 text-[#1E3A8A] border border-blue-200'
                                : admin.role?.includes('Teacher')
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-purple-50 text-purple-800 border border-purple-200'
                            }`}
                          >
                            <Shield className="w-3 h-3 shrink-0" />
                            <span>{admin.role}</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10.5px] text-slate-600 font-medium">
                          <GraduationCap className="w-3 h-3 text-[#1E3A8A] shrink-0" />
                          <span>Class: {admin.assignedClass || 'All Classes'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10.5px] text-slate-500 font-medium">
                          <BookOpen className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>Subject: {admin.assignedSubject || 'All Subjects'}</span>
                        </div>
                      </td>

                      {/* Authorized Modules */}
                      <td className="py-4 px-4">
                        {isSuper ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-300 text-[11px] font-extrabold shadow-2xs">
                              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                              <span>Full Access (All 6 Modules)</span>
                            </span>
                            <p className="text-[10px] text-slate-400 font-mono">
                              Unrestricted System Administration
                            </p>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {MODULE_PERMISSIONS_LIST.filter((m) => perms.includes(m.id)).map((m) => {
                              const Icon = m.icon;
                              return (
                                <span
                                  key={m.id}
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${m.badgeBg} ${m.badgeBorder} ${m.badgeText}`}
                                  title={m.description}
                                >
                                  <Icon className="w-2.5 h-2.5" />
                                  <span>{m.name}</span>
                                </span>
                              );
                            })}
                            {perms.length === 0 && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                                <span>Overview Only (0 Modules)</span>
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Password / First Login Status */}
                      <td className="py-4 px-4">
                        {needsPasswordChange ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 text-[11px] font-extrabold">
                              <KeyRound className="w-3 h-3 text-amber-600 shrink-0" />
                              <span>Pending First Login</span>
                            </span>
                            <p className="text-[10px] text-amber-700 font-medium">
                              Prompted to set password on login
                            </p>
                            {admin.temporaryPassword && isSuperAdmin && (
                              <div className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded text-[10px] font-mono text-slate-700 border border-slate-200">
                                <span>Temp: {admin.temporaryPassword}</span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    copyToClipboard(
                                      admin.temporaryPassword!,
                                      `pwd-${admin.email}`,
                                      'Temporary password copied!'
                                    )
                                  }
                                  className="text-slate-400 hover:text-slate-700 cursor-pointer"
                                  title="Copy Temporary Password"
                                >
                                  {copiedId === `pwd-${admin.email}` ? (
                                    <Check className="w-3 h-3 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-extrabold">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                              <span>Active • Password Set</span>
                            </span>
                            <p className="text-[10px] text-slate-400 font-mono">
                              Permanent password configured
                            </p>
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Copy Credentials Note */}
                          <button
                            type="button"
                            onClick={() => copyFormattedCredentials(admin)}
                            className="p-1.5 text-slate-500 hover:text-[#1E3A8A] hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Copy Full Login Instructions"
                          >
                            <Copy className="w-4 h-4" />
                          </button>

                          {isSuperAdmin && (
                            <>
                              {/* Reset Temporary Password */}
                              <button
                                type="button"
                                onClick={() => handleOpenResetModal(admin)}
                                className="px-2.5 py-1 text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                                title="Reset Temporary Password & Force First-Login Prompt"
                              >
                                <KeyRound className="w-3 h-3" />
                                <span className="hidden sm:inline">Reset Pass</span>
                              </button>

                              {/* Edit Admin */}
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(admin)}
                                className="p-1.5 text-slate-500 hover:text-[#1E3A8A] hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                title="Edit Role, Permissions & Scope"
                              >
                                <Edit className="w-4 h-4" />
                              </button>

                              {/* Delete Admin */}
                              {admin.email.toLowerCase() !== currentAdmin.email.toLowerCase() && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenDeleteModal(admin)}
                                  className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                  title="Delete Staff Account"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: ADD NEW STAFF / TEACHER ADMIN */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 text-slate-900 relative max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#1E3A8A] text-white flex items-center justify-center shadow-md shadow-blue-900/20">
                  <UserPlus className="w-5 h-5 text-[#F59E0B]" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-[#0F172A] font-['Plus_Jakarta_Sans']">
                    Add Staff / Teacher Admin
                  </h3>
                  <p className="text-xs text-slate-500">
                    Assign role module permissions and credentials with mandatory first-login password reset.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Full Staff Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Staff Full Name (e.g. Mr. John Doe)"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Staff Email Address (Login ID) *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g. staff.name@faithacademy.edu.ng"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Assigned System Role
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => handleRoleSelectChange(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                  >
                    <option value="Teacher / Exam Officer">Teacher / Exam Officer</option>
                    <option value="Class Teacher">Class Teacher</option>
                    <option value="Subject Teacher">Subject Teacher</option>
                    <option value="Academic Administrator">Academic Administrator</option>
                    <option value="System Super Administrator">System Super Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Phone Number (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="e.g. +234 803 000 1122"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Assigned Class Scope
                  </label>
                  <select
                    value={formData.assignedClass}
                    onChange={(e) => setFormData({ ...formData, assignedClass: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                  >
                    <option value="All Classes">All Classes</option>
                    {classList.map((c) => (
                      <option key={c.id || c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Assigned Subject Scope
                  </label>
                  <select
                    value={formData.assignedSubject}
                    onChange={(e) => setFormData({ ...formData, assignedSubject: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                  >
                    <option value="All Subjects">All Subjects</option>
                    {subjectList.map((s) => (
                      <option key={s.id || s.name} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Module Permissions Selector Component */}
              <div>
                <ModulePermissionsSelector
                  selectedPermissions={formData.permissions}
                  onChange={(newPerms) => setFormData({ ...formData, permissions: newPerms })}
                  selectedRole={formData.role}
                  onRoleChange={(newRole) => setFormData((prev) => ({ ...prev, role: newRole }))}
                  isSuperAdminAccount={formData.role.toLowerCase().includes('super')}
                />
              </div>

              {/* Initial Temporary Password */}
              <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-extrabold text-amber-900 uppercase tracking-wider">
                    Initial Temporary Password *
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, password: generateRandomPassword() })
                    }
                    className="text-[11px] text-[#1E3A8A] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3 text-[#F59E0B]" />
                    <span>Regenerate Random</span>
                  </button>
                </div>

                <div className="relative">
                  <Lock className="w-4 h-4 text-amber-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPasswordInput ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-10 pr-10 py-2.5 bg-white border border-amber-300 rounded-xl text-xs font-mono font-bold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordInput(!showPasswordInput)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  >
                    {showPasswordInput ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <div className="flex items-start gap-2 pt-1 text-[11px] text-amber-800">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>First-Time Password Reset Required:</strong> The teacher will be prompted to create their own personal password immediately when logging in for the first time.
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 bg-[#1E3A8A] hover:bg-[#1e40af] text-white font-bold text-xs rounded-xl shadow-md shadow-blue-900/20 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                >
                  {isSaving ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <UserPlus className="w-4 h-4 text-[#F59E0B]" />
                  )}
                  <span>Create Staff Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: SUCCESS CREDENTIALS POPUP */}
      {createdAdminCredentials && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 text-slate-900 relative">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center shadow-xs">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-xl font-black text-[#0F172A] font-['Plus_Jakarta_Sans']">
                Staff Account Created!
              </h3>
              <p className="text-xs text-slate-500">
                Share these temporary credentials with <strong>{createdAdminCredentials.name}</strong>.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5 font-mono text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-200/80">
                <span className="text-slate-500">Staff Name:</span>
                <strong className="text-slate-900">{createdAdminCredentials.name}</strong>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200/80">
                <span className="text-slate-500">Login Email:</span>
                <strong className="text-[#1E3A8A]">{createdAdminCredentials.email}</strong>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200/80">
                <span className="text-slate-500">Temporary Password:</span>
                <strong className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  {createdAdminCredentials.temporaryPassword}
                </strong>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200/80">
                <span className="text-slate-500">First Login Action:</span>
                <span className="text-emerald-700 font-bold">Forces New Password</span>
              </div>
              <div className="py-1">
                <span className="text-slate-500 block mb-1">Authorized Modules:</span>
                <div className="flex flex-wrap gap-1 font-sans">
                  {resolveAdminPermissions(createdAdminCredentials.role, createdAdminCredentials.permissions).map((p) => (
                    <span key={p} className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold">
                      {MODULE_PERMISSIONS_LIST.find((m) => m.id === p)?.name || p}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => copyFormattedCredentials(createdAdminCredentials)}
                className="w-full py-3 bg-[#1E3A8A] hover:bg-[#1e40af] text-white font-bold text-xs rounded-xl shadow-md shadow-blue-900/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Copy className="w-4 h-4 text-[#F59E0B]" />
                <span>Copy Full Credentials Message</span>
              </button>

              <button
                type="button"
                onClick={() => setCreatedAdminCredentials(null)}
                className="w-full py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              >
                Done / Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: RESET TEMPORARY PASSWORD */}
      {isResetModalOpen && selectedAdmin && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 text-slate-900 relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#0F172A] font-['Plus_Jakarta_Sans']">
                    Reset Temporary Password
                  </h3>
                  <p className="text-xs text-slate-500">For {selectedAdmin.name}</p>
                </div>
              </div>
              <button
                onClick={() => setIsResetModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    New Temporary Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setNewTempPassword(generateRandomPassword())}
                    className="text-[11px] text-[#1E3A8A] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3 text-[#F59E0B]" />
                    <span>Generate New</span>
                  </button>
                </div>

                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showTempPassword ? 'text' : 'password'}
                    required
                    value={newTempPassword}
                    onChange={(e) => setNewTempPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowTempPassword(!showTempPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  >
                    {showTempPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  After saving, the staff member will be <strong>forced to create their own new password</strong> when they next log in with this temporary password.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving || !newTempPassword}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                >
                  {isSaving ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <KeyRound className="w-4 h-4" />
                  )}
                  <span>Save & Enforce Reset</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: EDIT STAFF DETAILS & PERMISSIONS */}
      {isEditModalOpen && selectedAdmin && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 text-slate-900 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-[#0F172A] font-['Plus_Jakarta_Sans']">
                  Edit Staff Role & Module Permissions
                </h3>
                <p className="text-xs text-slate-500">
                  Update assigned privileges for {selectedAdmin.name} ({selectedAdmin.email})
                </p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateAdmin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Role Preset
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => handleRoleSelectChange(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                >
                  <option value="Teacher / Exam Officer">Teacher / Exam Officer</option>
                  <option value="Class Teacher">Class Teacher</option>
                  <option value="Subject Teacher">Subject Teacher</option>
                  <option value="Academic Administrator">Academic Administrator</option>
                  <option value="System Super Administrator">System Super Administrator</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Assigned Class
                  </label>
                  <select
                    value={formData.assignedClass}
                    onChange={(e) => setFormData({ ...formData, assignedClass: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                  >
                    <option value="All Classes">All Classes</option>
                    {classList.map((c) => (
                      <option key={c.id || c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Assigned Subject
                  </label>
                  <select
                    value={formData.assignedSubject}
                    onChange={(e) => setFormData({ ...formData, assignedSubject: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                  >
                    <option value="All Subjects">All Subjects</option>
                    {subjectList.map((s) => (
                      <option key={s.id || s.name} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="e.g. +234 803 000 1122"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                />
              </div>

              {/* Module Permissions Selector Component */}
              <div>
                <ModulePermissionsSelector
                  selectedPermissions={formData.permissions}
                  onChange={(newPerms) => setFormData({ ...formData, permissions: newPerms })}
                  selectedRole={formData.role}
                  onRoleChange={(newRole) => setFormData((prev) => ({ ...prev, role: newRole }))}
                  isSuperAdminAccount={formData.role.toLowerCase().includes('super')}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 bg-[#1E3A8A] hover:bg-[#1e40af] text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition-all"
                >
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: DELETE CONFIRMATION */}
      {isDeleteModalOpen && selectedAdmin && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 text-slate-900 relative">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 mx-auto flex items-center justify-center">
              <UserX className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-black text-[#0F172A] font-['Plus_Jakarta_Sans']">
                Delete Staff Account?
              </h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to remove <strong>{selectedAdmin.name}</strong> ({selectedAdmin.email})? They will immediately lose administrative and teacher portal access.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="w-1/2 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAdmin}
                disabled={isSaving}
                className="w-1/2 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
              >
                {isSaving ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
