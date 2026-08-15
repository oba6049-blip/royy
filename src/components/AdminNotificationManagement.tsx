import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Bell,
  Megaphone,
  Plus,
  Trash2,
  Edit,
  CheckCircle2,
  AlertCircle,
  Eye,
  RefreshCw,
  Sparkles,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Flame,
  Calendar,
  Layers,
  Clock,
  X
} from 'lucide-react';
import { SchoolNotification } from '../types';
import { api } from '../services/api';

interface AdminNotificationManagementProps {
  systemSessions?: any[];
  systemTerms?: any[];
  onTriggerToast: (msg: string) => void;
}

export const AdminNotificationManagement: React.FC<AdminNotificationManagementProps> = ({
  systemSessions = [],
  systemTerms = [],
  onTriggerToast,
}) => {
  const [notifications, setNotifications] = useState<SchoolNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingNotifId, setEditingNotifId] = useState<string | null>(null);
  const [deleteConfirmNotif, setDeleteConfirmNotif] = useState<SchoolNotification | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);

  // Form State
  const [headline, setHeadline] = useState('');
  const [message, setMessage] = useState('');
  const [tag, setTag] = useState('2024/2025 Result Release');
  const [category, setCategory] = useState<'results' | 'general' | 'admission' | 'urgent'>('results');
  const [urgency, setUrgency] = useState<'normal' | 'high' | 'urgent'>('high');
  const [academicSession, setAcademicSession] = useState('2024/2025');
  const [term, setTerm] = useState('Third Term');
  const [linkText, setLinkText] = useState('Check Result Now');
  const [targetAction, setTargetAction] = useState<'check_result' | 'student_portal' | 'none'>('check_result');
  const [isActive, setIsActive] = useState(true);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const data = await api.getNotifications();
      setNotifications(data || []);
    } catch {
      onTriggerToast('Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    const handleSync = () => fetchNotifications();
    window.addEventListener('school_portal_notifications_updated', handleSync);
    return () => window.removeEventListener('school_portal_notifications_updated', handleSync);
  }, []);

  const resetForm = () => {
    setHeadline('');
    setMessage('');
    setTag('2024/2025 Result Release');
    setCategory('results');
    setUrgency('high');
    setAcademicSession('2024/2025');
    setTerm('Third Term');
    setLinkText('Check Result Now');
    setTargetAction('check_result');
    setIsActive(true);
    setEditingNotifId(null);
    setIsFormOpen(false);
  };

  const applyTemplate = (type: '2024_results' | 'midterm' | 'resumption' | 'graduating') => {
    setIsFormOpen(true);
    setEditingNotifId(null);

    if (type === '2024_results') {
      setHeadline('Official Notice: Results for the 2024/2025 Academic Session are now available for checking!');
      setMessage('All students, parents, and guardians can now check, verify, and download official continuous assessment & examination report slips using their 7-digit Registration ID.');
      setTag('2024/2025 Result Release');
      setCategory('results');
      setUrgency('high');
      setAcademicSession('2024/2025');
      setTerm('Third Term');
      setLinkText('Check Result Now');
      setTargetAction('check_result');
      setIsActive(true);
    } else if (type === 'midterm') {
      setHeadline('First Term Continuous Assessment & Mid-Term Scores Published');
      setMessage('Mid-term CA test grades for all junior and senior secondary school classes have been compiled and verified by subject teachers.');
      setTag('Mid-Term CA Scores');
      setCategory('results');
      setUrgency('normal');
      setAcademicSession('2024/2025');
      setTerm('First Term');
      setLinkText('Check Score Slip');
      setTargetAction('check_result');
      setIsActive(true);
    } else if (type === 'resumption') {
      setHeadline('Resumption & Academic Clearance Notice for 2024/2025 Term');
      setMessage('Students are advised to complete their registration clearance and print their official result slips before school resumption.');
      setTag('Resumption Notice');
      setCategory('general');
      setUrgency('normal');
      setAcademicSession('2024/2025');
      setTerm('First Term');
      setLinkText('Student Login');
      setTargetAction('student_portal');
      setIsActive(true);
    } else if (type === 'graduating') {
      setHeadline('Graduating Class Broadsheets & Transcripts Verification Open');
      setMessage('SSS 3 students can now access their full cryptographic verified transcripts and cumulative broadsheet calculations.');
      setTag('Graduation Notice');
      setCategory('urgent');
      setUrgency('urgent');
      setAcademicSession('2024/2025');
      setTerm('Third Term');
      setLinkText('Verify Result');
      setTargetAction('check_result');
      setIsActive(true);
    }
  };

  const handleEditClick = (notif: SchoolNotification) => {
    setEditingNotifId(notif.id);
    setHeadline(notif.headline || '');
    setMessage(notif.message || '');
    setTag(notif.tag || 'Notice');
    setCategory(notif.category || 'results');
    setUrgency(notif.urgency || 'normal');
    setAcademicSession(notif.academicSession || '2024/2025');
    setTerm(notif.term || 'Third Term');
    setLinkText(notif.linkText || 'Check Result Now');
    setTargetAction(notif.targetAction || 'check_result');
    setIsActive(notif.isActive !== false);
    setIsFormOpen(true);
    window.scrollTo({ top: 100, behavior: 'smooth' });
  };

  const handleSaveNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!headline.trim()) {
      alert('Please enter a notification headline.');
      return;
    }

    setIsSaving(true);
    try {
      const payload: Partial<SchoolNotification> = {
        headline: headline.trim(),
        message: message.trim(),
        tag: tag.trim() || 'Notice',
        category,
        urgency,
        academicSession,
        term,
        linkText: linkText.trim() || 'Check Result',
        targetAction,
        isActive,
      };

      if (editingNotifId) {
        const res = await api.updateNotification(editingNotifId, payload);
        if (res.success) {
          onTriggerToast('Notification successfully updated & published to landing page!');
          resetForm();
          fetchNotifications();
        } else {
          onTriggerToast('Failed to update notification');
        }
      } else {
        const res = await api.createNotification(payload);
        if (res.success) {
          onTriggerToast('New announcement headline published to public landing page!');
          resetForm();
          fetchNotifications();
        } else {
          onTriggerToast('Failed to create notification');
        }
      }
    } catch {
      onTriggerToast('An error occurred while saving notification');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (notif: SchoolNotification) => {
    const nextActive = !notif.isActive;
    try {
      const res = await api.updateNotification(notif.id, { isActive: nextActive });
      if (res.success) {
        onTriggerToast(nextActive ? 'Notification is now LIVE on landing page' : 'Notification hidden from landing page');
        fetchNotifications();
      }
    } catch {
      onTriggerToast('Failed to update status');
    }
  };

  const handleOpenDeleteModal = (notif: SchoolNotification) => {
    setDeleteConfirmNotif(notif);
  };

  const handleExecuteDelete = async () => {
    if (!deleteConfirmNotif) return;
    setIsDeleting(true);
    try {
      const ok = await api.deleteNotification(deleteConfirmNotif.id);
      if (ok) {
        onTriggerToast('Notification successfully deleted from database and landing page!');
        if (editingNotifId === deleteConfirmNotif.id) {
          resetForm();
        }
        setDeleteConfirmNotif(null);
        await fetchNotifications();
      } else {
        onTriggerToast('Failed to delete notification');
      }
    } catch {
      onTriggerToast('An error occurred while deleting notification');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExecuteDeleteAll = async () => {
    setIsDeleting(true);
    try {
      for (const n of notifications) {
        await api.deleteNotification(n.id);
      }
      onTriggerToast('All announcements deleted successfully!');
      setIsDeleteAllModalOpen(false);
      resetForm();
      await fetchNotifications();
    } catch {
      onTriggerToast('Failed to delete all announcements');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-[#F59E0B] flex items-center justify-center font-bold shadow-xs shrink-0">
            <Megaphone className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-[#0F172A] font-['Plus_Jakarta_Sans']">
                Portal Notifications & Announcements
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-blue-50 text-[#1E3A8A] border border-blue-200">
                Live Public Ticker
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Post instant notification headlines on the landing page (e.g. 2024/2025 Academic Term Results Availability, CA score releases & resumption alerts).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (isFormOpen) {
                resetForm();
              } else {
                setIsFormOpen(true);
                setEditingNotifId(null);
              }
            }}
            className="px-4 py-2.5 bg-[#1E3A8A] hover:bg-blue-900 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
          >
            {isFormOpen ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4 text-amber-400" />}
            <span>{isFormOpen ? 'Close Editor' : 'Post New Announcement'}</span>
          </button>
        </div>
      </div>

      {/* Quick 1-Click Preset Templates */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <Sparkles className="w-4 h-4 text-[#F59E0B]" />
          <span>Quick 1-Click Announcement Templates:</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          <button
            type="button"
            onClick={() => applyTemplate('2024_results')}
            className="p-3 text-left rounded-2xl bg-amber-50/70 hover:bg-amber-100/80 border border-amber-200 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase text-amber-800 bg-amber-200/60 px-2 py-0.5 rounded">
                2024/2025 Results
              </span>
              <Plus className="w-3.5 h-3.5 text-amber-700 group-hover:scale-125 transition-transform" />
            </div>
            <p className="text-xs font-bold text-[#0F172A] mt-2 leading-snug">
              2024/2025 Term Results Available
            </p>
            <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">
              Alert students and parents that 2024/2025 session results are ready for checking.
            </p>
          </button>

          <button
            type="button"
            onClick={() => applyTemplate('midterm')}
            className="p-3 text-left rounded-2xl bg-blue-50/70 hover:bg-blue-100/80 border border-blue-200 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase text-blue-800 bg-blue-200/60 px-2 py-0.5 rounded">
                Mid-Term CA
              </span>
              <Plus className="w-3.5 h-3.5 text-blue-700 group-hover:scale-125 transition-transform" />
            </div>
            <p className="text-xs font-bold text-[#0F172A] mt-2 leading-snug">
              Continuous Assessment Published
            </p>
            <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">
              Notify classes that continuous assessment test scores are updated.
            </p>
          </button>

          <button
            type="button"
            onClick={() => applyTemplate('resumption')}
            className="p-3 text-left rounded-2xl bg-emerald-50/70 hover:bg-emerald-100/80 border border-emerald-200 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase text-emerald-800 bg-emerald-200/60 px-2 py-0.5 rounded">
                Resumption
              </span>
              <Plus className="w-3.5 h-3.5 text-emerald-700 group-hover:scale-125 transition-transform" />
            </div>
            <p className="text-xs font-bold text-[#0F172A] mt-2 leading-snug">
              Academic Resumption & Clearance
            </p>
            <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">
              Direct students to sign in to their portal and print placement records.
            </p>
          </button>

          <button
            type="button"
            onClick={() => applyTemplate('graduating')}
            className="p-3 text-left rounded-2xl bg-rose-50/70 hover:bg-rose-100/80 border border-rose-200 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase text-rose-800 bg-rose-200/60 px-2 py-0.5 rounded">
                Graduating Class
              </span>
              <Plus className="w-3.5 h-3.5 text-rose-700 group-hover:scale-125 transition-transform" />
            </div>
            <p className="text-xs font-bold text-[#0F172A] mt-2 leading-snug">
              Broadsheet & Transcripts Open
            </p>
            <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">
              Enable instant QR verification & transcript printing for seniors.
            </p>
          </button>
        </div>
      </div>

      {/* Editor Form Modal / Card */}
      {isFormOpen && (
        <div className="bg-white p-6 sm:p-7 rounded-3xl border-2 border-[#1E3A8A]/30 shadow-md space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-50 text-[#1E3A8A] rounded-xl border border-blue-200">
                {editingNotifId ? <Edit className="w-5 h-5" /> : <Megaphone className="w-5 h-5 text-[#F59E0B]" />}
              </div>
              <div>
                <h3 className="text-base font-black text-[#0F172A] font-['Plus_Jakarta_Sans']">
                  {editingNotifId ? 'Edit Announcement Headline' : 'Compose & Post New Announcement Headline'}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  This headline appears immediately across the top of the public landing page.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={resetForm}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSaveNotification} className="space-y-5">
            {/* Headline Input */}
            <div>
              <label className="block text-xs font-black uppercase text-slate-700 mb-1.5 flex items-center justify-between">
                <span>Notification Headline *</span>
                <span className="text-[10px] text-slate-400 font-normal">Shown prominently on landing page banner</span>
              </label>
              <input
                type="text"
                required
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="e.g. Official Notice: Results for the 2024/2025 Academic Session are now available for checking!"
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-2xl text-xs sm:text-sm font-bold text-[#0F172A] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] transition-all shadow-xs"
              />
            </div>

            {/* Detailed Message / Sub-copy */}
            <div>
              <label className="block text-xs font-black uppercase text-slate-700 mb-1.5 flex items-center justify-between">
                <span>Detailed Announcement Body (Optional)</span>
                <span className="text-[10px] text-slate-400 font-normal">Shown when users click "Read details"</span>
              </label>
              <textarea
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="e.g. All students, parents, and guardians can now check, verify, and download official continuous assessment & examination report slips using their 7-digit Registration ID."
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-2xl text-xs font-medium text-[#0F172A] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] transition-all shadow-xs"
              />
            </div>

            {/* Grid of Attributes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Tag / Badge Text */}
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                  Tag / Badge Label
                </label>
                <input
                  type="text"
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  placeholder="e.g. 2024/2025 Result Release"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-[#0F172A] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                />
              </div>

              {/* Urgency / Banner Theme */}
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                  Urgency / Theme
                </label>
                <select
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-[#0F172A] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                >
                  <option value="high">High Priority (Navy & Royal Blue Banner)</option>
                  <option value="urgent">Urgent / Breaking (Rose & Crimson Banner)</option>
                  <option value="normal">Standard (Dark Slate & Gold Banner)</option>
                </select>
              </div>

              {/* Academic Session */}
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                  Academic Session
                </label>
                <input
                  type="text"
                  value={academicSession}
                  onChange={(e) => setAcademicSession(e.target.value)}
                  placeholder="e.g. 2024/2025"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-[#0F172A] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                />
              </div>

              {/* Term */}
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                  Academic Term
                </label>
                <select
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-[#0F172A] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                >
                  <option value="First Term">First Term</option>
                  <option value="Second Term">Second Term</option>
                  <option value="Third Term">Third Term</option>
                  <option value="Full Session">Full Session / Annual</option>
                </select>
              </div>

              {/* CTA Action Target */}
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                  Button Action
                </label>
                <select
                  value={targetAction}
                  onChange={(e) => setTargetAction(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-[#0F172A] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                >
                  <option value="check_result">Scroll to Check Result (Public Search)</option>
                  <option value="student_portal">Open Student Login Portal</option>
                  <option value="none">No Action Button</option>
                </select>
              </div>

              {/* Button Text */}
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                  Button Text Label
                </label>
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="e.g. Check Result Now"
                  disabled={targetAction === 'none'}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-[#0F172A] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] disabled:opacity-40"
                />
              </div>

              {/* Active / Inactive Status */}
              <div className="sm:col-span-2 flex items-center gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <input
                  type="checkbox"
                  id="notif-is-active"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-[#1E3A8A] rounded focus:ring-[#1E3A8A] cursor-pointer"
                />
                <label htmlFor="notif-is-active" className="text-xs font-bold text-[#0F172A] cursor-pointer">
                  <span>Publish Immediately (Active on Landing Page)</span>
                  <span className="block text-[10px] text-slate-500 font-normal">
                    When checked, this headline appears live in the public top ticker.
                  </span>
                </label>
              </div>

            </div>

            {/* LIVE PREVIEW BANNER */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-[#1E3A8A]" />
                <span>Live Landing Page Banner Preview:</span>
              </span>

              <div
                className={`p-3 rounded-2xl text-white shadow-xs border flex items-center justify-between gap-3 overflow-hidden ${
                  urgency === 'urgent'
                    ? 'bg-gradient-to-r from-red-600 via-rose-600 to-red-700 border-red-500/50'
                    : urgency === 'high'
                    ? 'bg-gradient-to-r from-[#1E3A8A] via-[#1e40af] to-[#0F172A] border-blue-400/20'
                    : 'bg-gradient-to-r from-slate-900 via-[#1E3A8A] to-slate-900 border-blue-500/20'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1 overflow-hidden relative">
                  <div className="w-6 h-6 rounded-lg bg-amber-400/20 flex items-center justify-center text-amber-300 shrink-0 z-10">
                    <Megaphone className="w-3.5 h-3.5" />
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-amber-400/20 text-amber-300 border border-amber-300/30 shrink-0 z-10">
                    {tag || 'Notice'}
                  </span>
                  <div className="overflow-hidden flex-1">
                    <motion.div
                      animate={{
                        x: ['0%', '-35%', '0%'],
                      }}
                      transition={{
                        duration: 12,
                        ease: 'easeInOut',
                        repeat: Infinity,
                        repeatType: 'reverse',
                      }}
                      className="whitespace-nowrap w-max flex items-center gap-2"
                    >
                      <p className="text-xs font-bold inline-block">
                        {headline || 'Your announcement headline will appear here and glide back and forth...'}
                      </p>
                      <span className="text-[10px] text-amber-300 underline font-bold">
                        Read details
                      </span>
                    </motion.div>
                  </div>
                </div>

                {targetAction !== 'none' && (
                  <div className="self-end sm:self-auto shrink-0 z-10">
                    <span className="px-3 py-1 text-[11px] font-black text-slate-950 bg-[#F59E0B] rounded-xl flex items-center gap-1">
                      <span>{linkText || 'Check Result'}</span>
                      <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div>
                {editingNotifId && (
                  <button
                    type="button"
                    onClick={() => {
                      const current = notifications.find((n) => n.id === editingNotifId);
                      if (current) {
                        handleOpenDeleteModal(current);
                      } else {
                        handleOpenDeleteModal({
                          id: editingNotifId,
                          headline: headline || 'Untitled Announcement',
                          message,
                          tag,
                          category,
                          urgency,
                          linkText,
                          targetAction,
                          isActive,
                          createdAt: new Date().toISOString(),
                          updatedAt: new Date().toISOString(),
                        });
                      }
                    }}
                    className="px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <Trash2 className="w-4 h-4 text-rose-600" />
                    <span>Delete This Announcement</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-[#1E3A8A] hover:bg-blue-900 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  )}
                  <span>{editingNotifId ? 'Save & Update Headline' : 'Publish Announcement'}</span>
                </button>
              </div>
            </div>

          </form>
        </div>
      )}

      {/* Existing Notifications List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-[#0F172A] font-['Plus_Jakarta_Sans']">
              Active & Saved Announcements
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
              {notifications.length} Total
            </span>
          </div>

          <div className="flex items-center gap-2">
            {notifications.length > 1 && (
              <button
                type="button"
                onClick={() => setIsDeleteAllModalOpen(true)}
                className="px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Delete all announcements"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete All</span>
              </button>
            )}

            <button
              type="button"
              onClick={fetchNotifications}
              className="p-2 text-slate-500 hover:text-[#1E3A8A] hover:bg-blue-50 border border-slate-200 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold"
              title="Refresh list"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-[#1E3A8A]" />
            <p className="text-xs font-medium">Loading notifications from database...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <Megaphone className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-sm font-bold text-slate-700">No announcements created yet</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Use the templates above or click "Post New Announcement" to display an alert on the public landing page.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map((notif) => {
              const isLive = notif.isActive !== false;
              return (
                <div
                  key={notif.id}
                  className={`p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-colors ${
                    isLive ? 'bg-white hover:bg-slate-50/50' : 'bg-slate-50/60 opacity-75'
                  }`}
                >
                  {/* Left content */}
                  <div className="space-y-2 min-w-0 max-w-3xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                          isLive
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {isLive ? '● Live on Landing Page' : '○ Inactive / Hidden'}
                      </span>

                      {notif.tag && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          {notif.tag}
                        </span>
                      )}

                      {notif.academicSession && (
                        <span className="text-[11px] text-slate-500 font-medium">
                          {notif.academicSession} {notif.term ? `• ${notif.term}` : ''}
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm sm:text-base font-black text-[#0F172A] leading-snug">
                      {notif.headline}
                    </h4>

                    {notif.message && (
                      <p className="text-xs text-slate-600 font-medium line-clamp-2 leading-relaxed">
                        {notif.message}
                      </p>
                    )}

                    <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono pt-1">
                      <span>Posted: {new Date(notif.createdAt).toLocaleDateString()}</span>
                      {notif.targetAction !== 'none' && (
                        <span>Action: {notif.linkText || 'Check Result'}</span>
                      )}
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0 self-end lg:self-center">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(notif)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                        isLive
                          ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                      }`}
                      title={isLive ? 'Hide from landing page' : 'Publish to landing page'}
                    >
                      {isLive ? 'Deactivate / Hide' : 'Activate / Publish'}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleEditClick(notif)}
                      className="px-3 py-1.5 text-slate-700 hover:text-[#1E3A8A] hover:bg-blue-50 border border-slate-200 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                      title="Edit announcement"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenDeleteModal(notif)}
                      className="px-3 py-1.5 text-rose-700 hover:bg-rose-100 bg-rose-50 border border-rose-200 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold active:scale-95"
                      title="Delete announcement permanently"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Single Notification Confirmation Modal */}
      {deleteConfirmNotif && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-[#0F172A] font-['Plus_Jakarta_Sans']">
                  Delete Announcement?
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  This action will permanently delete this notification from the database and remove it from the public landing page.
                </p>
              </div>
            </div>

            {/* Notification Preview Box */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-amber-100 text-amber-800">
                  {deleteConfirmNotif.tag || 'Notice'}
                </span>
                {deleteConfirmNotif.academicSession && (
                  <span className="text-[10px] text-slate-500 font-medium">
                    {deleteConfirmNotif.academicSession}
                  </span>
                )}
              </div>
              <p className="text-xs font-bold text-slate-900 leading-snug">
                "{deleteConfirmNotif.headline}"
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteConfirmNotif(null)}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleExecuteDelete}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
              >
                {isDeleting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                <span>{isDeleting ? 'Deleting...' : 'Yes, Delete Notification'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete All Notifications Confirmation Modal */}
      {isDeleteAllModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-rose-200 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 border border-rose-300 flex items-center justify-center text-rose-700 shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-rose-950 font-['Plus_Jakarta_Sans']">
                  Delete All Announcements?
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Are you sure you want to delete all <strong>{notifications.length}</strong> announcements? This will clear the announcement list completely.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setIsDeleteAllModalOpen(false)}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleExecuteDeleteAll}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
              >
                {isDeleting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                <span>{isDeleting ? 'Deleting All...' : 'Delete All Announcements'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
