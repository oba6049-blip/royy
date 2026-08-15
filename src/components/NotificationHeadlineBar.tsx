import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Sparkles, ChevronRight, ChevronLeft, X, ExternalLink, Megaphone, CheckCircle2, AlertCircle } from 'lucide-react';
import { SchoolNotification } from '../types';
import { api } from '../services/api';

interface NotificationHeadlineBarProps {
  onCheckResultClick: () => void;
  onStudentPortalClick: () => void;
}

export const NotificationHeadlineBar: React.FC<NotificationHeadlineBarProps> = ({
  onCheckResultClick,
  onStudentPortalClick,
}) => {
  const [notifications, setNotifications] = useState<SchoolNotification[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedNotifForDetail, setSelectedNotifForDetail] = useState<SchoolNotification | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  const fetchActiveNotifications = async () => {
    try {
      const data = await api.getNotifications();
      const active = (data || []).filter((n: SchoolNotification) => n.isActive !== false);
      setNotifications(active);
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    fetchActiveNotifications();

    const handleUpdate = () => {
      fetchActiveNotifications();
      setIsDismissed(false); // Resurface if admin created a fresh announcement
    };

    window.addEventListener('school_portal_notifications_updated', handleUpdate);
    return () => window.removeEventListener('school_portal_notifications_updated', handleUpdate);
  }, []);

  // Auto-rotate if multiple
  useEffect(() => {
    if (notifications.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % notifications.length);
    }, 6500);
    return () => clearInterval(interval);
  }, [notifications.length]);

  if (isDismissed || notifications.length === 0) {
    return null;
  }

  const currentNotif = notifications[currentIndex] || notifications[0];
  if (!currentNotif) return null;

  const handleActionClick = () => {
    if (currentNotif.targetAction === 'student_portal') {
      onStudentPortalClick();
    } else {
      onCheckResultClick();
    }
  };

  const isUrgent = currentNotif.urgency === 'urgent';
  const isHigh = currentNotif.urgency === 'high';

  return (
    <>
      <div
        className={`w-full relative z-40 transition-colors border-b ${
          isUrgent
            ? 'bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white border-red-500/50 shadow-md'
            : isHigh
            ? 'bg-gradient-to-r from-[#1E3A8A] via-[#1e40af] to-[#0F172A] text-white border-blue-400/20 shadow-md'
            : 'bg-gradient-to-r from-slate-900 via-[#1E3A8A] to-slate-900 text-white border-blue-500/20 shadow-xs'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
          <div className="flex items-center justify-between gap-3 sm:gap-6">
            
            {/* Left Beacon & Tag */}
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="flex items-center justify-center w-7 h-7 rounded-xl bg-amber-400/20 border border-amber-300/30 text-[#F59E0B] shadow-xs shrink-0">
                <Megaphone className="w-3.5 h-3.5 animate-bounce text-amber-300" />
              </div>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase bg-amber-400/20 text-amber-300 border border-amber-300/30">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-300 animate-pulse" />
                {currentNotif.tag || 'Official Notice'}
              </span>
            </div>

            {/* Middle Animated Gliding Headline Text (Goes and Comes Back) */}
            <div
              className="flex-1 min-w-0 relative overflow-hidden py-0.5 mask-gradient-x"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              {/* Fade edges */}
              <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-[#1E3A8A] to-transparent z-10 pointer-events-none opacity-80" />
              <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-[#0F172A] to-transparent z-10 pointer-events-none opacity-80" />

              <div className="overflow-hidden w-full">
                <motion.div
                  key={currentNotif.id || currentIndex}
                  animate={
                    isPaused
                      ? {}
                      : {
                          x: ['0%', '-45%', '0%'],
                        }
                  }
                  transition={{
                    duration: 14,
                    ease: 'easeInOut',
                    repeat: Infinity,
                    repeatType: 'reverse',
                  }}
                  className="flex items-center gap-3 whitespace-nowrap will-change-transform w-max cursor-pointer"
                >
                  <span className="inline-flex sm:hidden items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-amber-400/20 text-amber-300 border border-amber-300/30 shrink-0">
                    {currentNotif.tag || '2024/2025 Result Release'}
                  </span>

                  <p className="text-xs sm:text-sm font-bold tracking-tight text-white font-['Plus_Jakarta_Sans'] leading-tight inline-block">
                    {currentNotif.headline}
                  </p>

                  {currentNotif.message && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedNotifForDetail(currentNotif);
                        setIsDetailModalOpen(true);
                      }}
                      className="inline-flex items-center text-[11px] font-extrabold text-amber-300 hover:text-amber-200 underline underline-offset-2 px-1.5 py-0.5 rounded hover:bg-white/10 transition-colors cursor-pointer shrink-0"
                    >
                      Read details
                    </button>
                  )}
                </motion.div>
              </div>
            </div>

            {/* Right Controls & Action Button */}
            <div className="flex items-center gap-2 shrink-0">
              {notifications.length > 1 && (
                <div className="hidden lg:flex items-center gap-1 bg-black/20 rounded-lg p-0.5 border border-white/10 text-slate-300">
                  <button
                    type="button"
                    onClick={() => setCurrentIndex((prev) => (prev === 0 ? notifications.length - 1 : prev - 1))}
                    className="p-1 hover:text-white rounded hover:bg-white/10 cursor-pointer"
                    title="Previous announcement"
                  >
                    <ChevronLeft className="w-3 h-3" />
                  </button>
                  <span className="text-[10px] font-mono px-1">
                    {currentIndex + 1}/{notifications.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentIndex((prev) => (prev + 1) % notifications.length)}
                    className="p-1 hover:text-white rounded hover:bg-white/10 cursor-pointer"
                    title="Next announcement"
                  >
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              )}

              {currentNotif.targetAction !== 'none' && (
                <button
                  type="button"
                  onClick={handleActionClick}
                  className="inline-flex items-center gap-1.5 px-3 py-1 sm:px-3.5 sm:py-1.5 text-xs font-black text-slate-950 bg-[#F59E0B] hover:bg-amber-400 rounded-xl shadow-xs transition-all cursor-pointer active:scale-95 shrink-0"
                >
                  <span>{currentNotif.linkText || 'Check Result'}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Dismiss Button */}
              <button
                type="button"
                onClick={() => setIsDismissed(true)}
                className="p-1 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                title="Dismiss notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Detailed Modal popup if user clicks read details */}
      {isDetailModalOpen && selectedNotifForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full border border-slate-200 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-50 rounded-xl border border-amber-200 text-[#F59E0B]">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold text-amber-700 uppercase tracking-wider bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    {selectedNotifForDetail.tag || 'Official School Announcement'}
                  </span>
                  <h3 className="text-sm font-bold text-[#0F172A] mt-1 font-['Plus_Jakarta_Sans']">
                    {selectedNotifForDetail.academicSession ? `${selectedNotifForDetail.academicSession} Session` : 'Academic Notice'}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <h4 className="text-base font-black text-[#1E3A8A] leading-snug">
                {selectedNotifForDetail.headline}
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line bg-slate-50 p-3.5 rounded-2xl border border-slate-100 font-medium">
                {selectedNotifForDetail.message || 'No additional message provided.'}
              </p>
            </div>

            <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-100">
              <span className="text-[11px] text-slate-400 font-mono">
                Posted: {new Date(selectedNotifForDetail.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsDetailModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Close
                </button>
                {selectedNotifForDetail.targetAction !== 'none' && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsDetailModalOpen(false);
                      handleActionClick();
                    }}
                    className="px-4 py-2 text-xs font-bold text-slate-950 bg-[#F59E0B] hover:bg-amber-400 rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <span>{selectedNotifForDetail.linkText || 'Check Result'}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
