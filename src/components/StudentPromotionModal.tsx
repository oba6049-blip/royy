import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Calendar,
  Clock,
  User,
  ShieldCheck,
  AlertTriangle,
  Award,
  X,
  RefreshCw,
  BookOpen
} from 'lucide-react';
import { StudentResult, StudentTermRecord } from '../types';
import { api } from '../services/api';

interface StudentPromotionModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentResult | null;
  classList: Array<{ id: string; name: string }>;
  sessions: Array<{ id: string; year: string }>;
  terms: Array<{ id: string; name: string }>;
  onPromotionComplete: (updatedStudent: StudentResult, message: string) => void;
}

// Compute the recommended next class based on Nigerian secondary school progression
const getRecommendedNextClass = (
  currentClass: string,
  classList: Array<{ id: string; name: string }>
): string => {
  const cUpper = (currentClass || '').toUpperCase();

  let nextPrefix = '';
  if (cUpper.includes('JSS 1') || cUpper.includes('JSS1')) nextPrefix = 'JSS 2';
  else if (cUpper.includes('JSS 2') || cUpper.includes('JSS2')) nextPrefix = 'JSS 3';
  else if (cUpper.includes('JSS 3') || cUpper.includes('JSS3')) nextPrefix = 'SSS 1';
  else if (cUpper.includes('SSS 1') || cUpper.includes('SS 1') || cUpper.includes('SSS1')) nextPrefix = 'SSS 2';
  else if (cUpper.includes('SSS 2') || cUpper.includes('SS 2') || cUpper.includes('SSS2')) nextPrefix = 'SSS 3';
  else if (cUpper.includes('SSS 3') || cUpper.includes('SS 3') || cUpper.includes('SSS3')) return 'Graduated';

  if (!nextPrefix) return classList[0]?.name || currentClass;

  // Try to preserve the arm (e.g. Gold, Diamond, Science, Arts) if matching class exists
  const parts = currentClass.split(' ');
  const arm = parts.length > 2 ? parts.slice(2).join(' ') : (parts.length === 2 ? parts[1] : '');

  const exactMatch = classList.find(c =>
    c.name.toUpperCase().startsWith(nextPrefix) && (arm ? c.name.toUpperCase().includes(arm.toUpperCase()) : true)
  );

  if (exactMatch) return exactMatch.name;

  const anyPrefixMatch = classList.find(c => c.name.toUpperCase().startsWith(nextPrefix));
  if (anyPrefixMatch) return anyPrefixMatch.name;

  return nextPrefix;
};

// Compute recommended next session (e.g. 2024/2025 -> 2025/2026)
const getRecommendedNextSession = (
  currentSession: string,
  sessions: Array<{ id: string; year: string }>
): string => {
  const match = (currentSession || '').match(/(\d{4})\s*\/\s*(\d{4})/);
  if (match) {
    const y1 = parseInt(match[1], 10) + 1;
    const y2 = parseInt(match[2], 10) + 1;
    const nextStr = `${y1}/${y2} Academic Session`;
    const found = sessions.find(s => s.year.includes(`${y1}/${y2}`));
    return found ? (found.year.includes('Academic Session') ? found.year : `${found.year} Academic Session`) : nextStr;
  }
  return sessions[0]?.year || currentSession || '2025/2026 Academic Session';
};

export const StudentPromotionModal: React.FC<StudentPromotionModalProps> = ({
  isOpen,
  onClose,
  student,
  classList,
  sessions,
  terms,
  onPromotionComplete,
}) => {
  const [targetClass, setTargetClass] = useState('');
  const [targetSession, setTargetSession] = useState('');
  const [targetTerm, setTargetTerm] = useState('First Term');
  const [verdict, setVerdict] = useState<'PROMOTED' | 'PROMOTED ON TRIAL' | 'REPEAT' | 'GRADUATED'>('PROMOTED');
  const [promotionRemarks, setPromotionRemarks] = useState('');
  const [archiveCurrentResult, setArchiveCurrentResult] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize recommendation whenever modal opens or student changes
  useEffect(() => {
    if (student && isOpen) {
      const recClass = getRecommendedNextClass(student.className, classList);
      const recSession = getRecommendedNextSession(student.academicSession || '', sessions);

      setTargetClass(recClass === 'Graduated' ? student.className : recClass);
      setTargetSession(recSession);
      setTargetTerm('First Term');

      if (recClass === 'Graduated') {
        setVerdict('GRADUATED');
        setPromotionRemarks(`Congratulations! Completed secondary school education in ${student.className}.`);
      } else {
        const avg = student.overallAverage || student.averageScore || 0;
        if (avg >= 50) {
          setVerdict('PROMOTED');
          setPromotionRemarks(`Commendable academic standing with an average of ${avg}%. Promoted to ${recClass}.`);
        } else {
          setVerdict('PROMOTED ON TRIAL');
          setPromotionRemarks(`Promoted on trial to ${recClass}. Advised to demonstrate greater commitment in core subjects.`);
        }
      }
    }
  }, [student, isOpen, classList, sessions]);

  if (!isOpen || !student) return null;

  const currentAverage = student.overallAverage || student.averageScore || 0;
  const currentGPA = student.gpa || Number((currentAverage / 25).toFixed(2));

  const handleConfirmPromotion = async () => {
    if (!student) return;
    setIsSubmitting(true);

    try {
      // 1. Prepare current term record for historical archiving
      let updatedTermRecords: StudentTermRecord[] = [...(student.termRecords || [])];

      if (archiveCurrentResult && student.subjects && student.subjects.length > 0) {
        const currentSession = student.academicSession || '2024/2025 Academic Session';
        const currentTerm = student.term || 'First Term';
        const currentClass = student.className || classList[0]?.name || '';

        // Check if current term already exists in history
        const existingIdx = updatedTermRecords.findIndex(r =>
          (r.academicSession || '').toLowerCase().replace(/\s/g, '') === currentSession.toLowerCase().replace(/\s/g, '') &&
          (r.term || '').toLowerCase().replace(/\s/g, '') === currentTerm.toLowerCase().replace(/\s/g, '') &&
          (r.className || '').toLowerCase().replace(/\s/g, '') === currentClass.toLowerCase().replace(/\s/g, '')
        );

        const currentSnapshot: StudentTermRecord = {
          academicSession: currentSession,
          term: currentTerm,
          className: currentClass,
          subjects: student.subjects,
          overallTotal: student.overallTotal || 0,
          overallAverage: student.overallAverage || student.averageScore || 0,
          gpa: student.gpa || 0,
          status: 'Published',
          isPublished: true,
          issueDate: student.issueDate || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        if (existingIdx >= 0) {
          updatedTermRecords[existingIdx] = currentSnapshot;
        } else {
          updatedTermRecords.push(currentSnapshot);
        }
      }

      // 2. Prepare new student profile state
      const finalClassName = verdict === 'REPEAT' ? student.className : (verdict === 'GRADUATED' ? `${student.className} (Graduated)` : targetClass);
      
      const updatedStudent: StudentResult = {
        ...student,
        className: finalClassName,
        academicSession: targetSession,
        term: targetTerm,
        status: verdict,
        isPublished: true,
        principalRemark: promotionRemarks || `Student ${verdict.toLowerCase().replace('_', ' ')} for ${targetSession}.`,
        classTeacherRemark: `Enrolled in ${finalClassName} for ${targetSession} (${targetTerm}).`,
        termRecords: updatedTermRecords,
        // Reset active terminal subjects for the newly promoted class so admin can enter fresh scores
        subjects: [],
        overallTotal: 0,
        overallAverage: 0,
        averageScore: 0,
        gpa: 0,
      };

      // 3. Persist to API / Database
      await api.updateStudent(student.studentId, updatedStudent);

      // 4. Notify parent
      const msg = verdict === 'GRADUATED'
        ? `Student ${student.fullName || (student as any).name} has been graduated successfully!`
        : `Student ${student.fullName || (student as any).name} promoted to ${finalClassName} (${targetSession})!`;

      onPromotionComplete(updatedStudent, msg);
      onClose();
    } catch (err) {
      console.error('Promotion error:', err);
      alert('Failed to promote student. Please check network connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#1E3A8A] via-[#1e40af] to-slate-900 text-white p-6 relative shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer transition-all"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#F59E0B]/20 border-2 border-[#F59E0B] flex items-center justify-center text-[#F59E0B] shrink-0 shadow-xs">
              <GraduationCap className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#F59E0B] text-slate-950">
                  Academic Promotion
                </span>
                <span className="text-xs font-mono text-blue-200">
                  ID: {student.studentId}
                </span>
              </div>
              <h2 className="text-xl font-black font-['Plus_Jakarta_Sans'] mt-0.5">
                Promote Student to Next Class
              </h2>
              <p className="text-xs text-blue-200 mt-0.5">
                {student.fullName || (student as any).name} • Current: <strong>{student.className}</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          
          {/* Current Academic Standing Card */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between gap-3 text-xs">
            <div className="space-y-0.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                Current Standing
              </span>
              <p className="font-bold text-[#0F172A]">
                {student.className} • {student.academicSession || '2024/2025'} ({student.term || 'First Term'})
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-center shadow-2xs">
                <span className="text-[9px] uppercase font-bold text-slate-400 block">Avg Score</span>
                <span className="font-black text-[#1E3A8A] font-mono">{currentAverage}%</span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-center shadow-2xs">
                <span className="text-[9px] uppercase font-bold text-slate-400 block">GPA</span>
                <span className="font-black text-amber-600 font-mono">{currentGPA}</span>
              </div>
            </div>
          </div>

          {/* Promotion Verdict / Decision */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#0F172A] block uppercase tracking-wider text-[10px]">
              Promotion Decision / Verdict:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'PROMOTED', label: 'Promoted', desc: 'Advance to next class', color: 'border-emerald-500 bg-emerald-50 text-emerald-900' },
                { id: 'PROMOTED ON TRIAL', label: 'Promoted on Trial', desc: 'Conditional pass', color: 'border-amber-500 bg-amber-50 text-amber-900' },
                { id: 'REPEAT', label: 'Repeat Class', desc: 'Retain in current class', color: 'border-red-500 bg-red-50 text-red-900' },
                { id: 'GRADUATED', label: 'Graduated', desc: 'Completed secondary', color: 'border-purple-500 bg-purple-50 text-purple-900' },
              ].map((opt) => {
                const isSelected = verdict === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setVerdict(opt.id as any);
                      if (opt.id === 'REPEAT') {
                        setTargetClass(student.className);
                        setPromotionRemarks(`Retained in ${student.className} for ${targetSession}.`);
                      } else if (opt.id === 'GRADUATED') {
                        setPromotionRemarks(`Completed secondary school education in ${student.className}.`);
                      } else {
                        const recClass = getRecommendedNextClass(student.className, classList);
                        setTargetClass(recClass);
                        setPromotionRemarks(`Promoted to ${recClass} for ${targetSession}.`);
                      }
                    }}
                    className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                      isSelected
                        ? `${opt.color} ring-2 ring-offset-1 ring-[#1E3A8A] font-bold shadow-xs`
                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black">{opt.label}</span>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-[#1E3A8A]" />}
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">{opt.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Target Class & Target Session Selection */}
          {verdict !== 'GRADUATED' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">
                  Target Enrolled Class
                </label>
                <select
                  value={targetClass}
                  onChange={(e) => setTargetClass(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                >
                  {classList.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                  {!classList.some(c => c.name === targetClass) && targetClass && (
                    <option value={targetClass}>{targetClass}</option>
                  )}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">
                  Target Academic Session
                </label>
                <select
                  value={targetSession}
                  onChange={(e) => setTargetSession(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                >
                  {sessions.map(s => {
                    const fullSess = s.year.includes('Academic Session') ? s.year : `${s.year} Academic Session`;
                    return (
                      <option key={s.id} value={fullSess}>{fullSess}</option>
                    );
                  })}
                  {!sessions.some(s => s.year.includes(targetSession.replace(' Academic Session', ''))) && targetSession && (
                    <option value={targetSession}>{targetSession}</option>
                  )}
                </select>
              </div>
            </div>
          )}

          {/* Promotion Remarks */}
          <div>
            <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">
              Official Promotion Remark / Decision Note
            </label>
            <textarea
              rows={2}
              value={promotionRemarks}
              onChange={(e) => setPromotionRemarks(e.target.value)}
              placeholder="e.g. Promoted to JSS 2 Gold following successful completion of JSS 1 academic requirements."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
            />
          </div>

          {/* History Archival Notice */}
          <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-3.5 flex items-start gap-2.5 text-xs text-slate-700">
            <ShieldCheck className="w-4 h-4 text-[#1E3A8A] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-[#1E3A8A]">
                <input
                  type="checkbox"
                  checked={archiveCurrentResult}
                  onChange={(e) => setArchiveCurrentResult(e.target.checked)}
                  className="rounded text-[#1E3A8A] focus:ring-[#1E3A8A] w-3.5 h-3.5 cursor-pointer"
                />
                <span>Archive {student.className} results to permanent academic journey</span>
              </label>
              <p className="text-[11px] text-slate-500">
                All historical subject scores, CA marks, exams, and GPAs for past classes remain viewable and printable anytime in the Result History.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer transition-all"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleConfirmPromotion}
            className="px-6 py-2.5 bg-[#1E3A8A] hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-2 transition-all disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-[#F59E0B]" />
                <span>Applying Promotion...</span>
              </>
            ) : (
              <>
                <GraduationCap className="w-4 h-4 text-[#F59E0B]" />
                <span>Confirm & Promote Student</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
