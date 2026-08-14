import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { StudentResult } from '../types';
import { api } from '../services/api';
import { calculateDynamicStudentPosition } from '../utils/studentRanking';
import { filterStudentSubjectsByAdmin } from '../utils/subjectUtils';
import {
  Search,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Printer,
  Sparkles,
  ArrowRight,
  ChevronDown,
  UserCheck,
  ShieldCheck,
  Award,
  RefreshCw,
  Eye
} from 'lucide-react';

interface ResultSearchDemoProps {
  onOpenResultSlip: (result: StudentResult) => void;
  onVerifyQR: (studentId: string) => void;
}

export const ResultSearchDemo: React.FC<ResultSearchDemoProps> = ({
  onOpenResultSlip,
  onVerifyQR,
}) => {
  const [studentIdInput, setStudentIdInput] = useState('');
  const [sessionsList, setSessionsList] = useState<string[]>([]);
  const [termsList, setTermsList] = useState<string[]>([]);
  const [classesList, setClassesList] = useState<string[]>([]);

  const [selectedSession, setSelectedSession] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [activeResult, setActiveResult] = useState<StudentResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [allStudentsList, setAllStudentsList] = useState<any[]>([]);
  const [adminSubjects, setAdminSubjects] = useState<any[]>([]);

  useEffect(() => {
    let isMounted = true;
    api.getStudents().then((res) => {
      if (isMounted && res && Array.isArray(res)) {
        setAllStudentsList(res);
        if (res.length > 0) {
          setActiveResult(res[0]);
          setStudentIdInput(res[0].studentId || '');
        }
      }
    }).catch(() => {});

    api.getSubjects().then((subs) => {
      if (isMounted && Array.isArray(subs)) {
        setAdminSubjects(subs);
      }
    }).catch(() => {});

    api.getSessions().then((sess) => {
      if (isMounted && Array.isArray(sess)) {
        const normSess = (s: string) => (s || '').toLowerCase().replace(/academic|session|\s/g, '');
        const seen = new Set<string>();
        const names: string[] = [];
        sess.forEach(s => {
          const yr = s.year || s.name;
          if (!yr) return;
          const key = normSess(yr);
          if (!seen.has(key)) {
            seen.add(key);
            names.push(yr.includes('Academic Session') ? yr : `${yr} Academic Session`);
          }
        });
        setSessionsList(names);
        if (names.length > 0) setSelectedSession(names[0]);
      }
    }).catch(() => {});

    api.getTerms().then((tms) => {
      if (isMounted && Array.isArray(tms)) {
        const getTermId = (t: string) => {
          const l = (t || '').toLowerCase();
          if (l.includes('first') || l.includes('1st') || l.includes('1')) return '1';
          if (l.includes('second') || l.includes('2nd') || l.includes('2')) return '2';
          if (l.includes('third') || l.includes('3rd') || l.includes('3')) return '3';
          return l.replace(/\s/g, '');
        };
        const seen = new Set<string>();
        const names: string[] = [];
        tms.forEach(t => {
          if (!t.name) return;
          const key = getTermId(t.name);
          if (!seen.has(key)) {
            seen.add(key);
            names.push(t.name.replace(/\s*\([^)]*\)/g, '').trim());
          }
        });
        setTermsList(names);
        if (names.length > 0) setSelectedTerm(names[0]);
      }
    }).catch(() => {});

    api.getClasses().then((cls) => {
      if (isMounted && Array.isArray(cls)) {
        const names = cls.map(c => c.name).filter(Boolean);
        setClassesList(names);
        if (names.length > 0) setSelectedClass(names[0]);
      }
    }).catch(() => {});

    return () => { isMounted = false; };
  }, []);

  const displayResult = React.useMemo(() => {
    if (!activeResult) return null;

    const reqSession = selectedSession || activeResult.academicSession || (activeResult as any).session;
    const reqTerm = selectedTerm || activeResult.term;
    const reqClass = selectedClass && selectedClass !== 'All' ? selectedClass : null;

    const isClassMatch = (rClass?: string, reqC?: string) => {
      if (!reqC || !rClass) return true;
      const c1 = rClass.toLowerCase().trim();
      const c2 = reqC.toLowerCase().trim();
      return c1 === c2 || c1.includes(c2) || c2.includes(c1);
    };

    if (activeResult.termRecords && Array.isArray(activeResult.termRecords)) {
      let matched = activeResult.termRecords.find((r: any) =>
        r.academicSession && reqSession &&
        r.academicSession.toLowerCase().trim().includes(reqSession.toLowerCase().trim().replace(' academic session', '')) &&
        r.term && reqTerm &&
        r.term.toLowerCase().trim() === reqTerm.toLowerCase().trim() &&
        (!reqClass || isClassMatch(r.className, reqClass))
      );

      // Fallback: if class match failed, match session and term regardless of class name to preserve historical access
      if (!matched && reqSession && reqTerm) {
        matched = activeResult.termRecords.find((r: any) =>
          r.academicSession && reqSession &&
          r.academicSession.toLowerCase().trim().includes(reqSession.toLowerCase().trim().replace(' academic session', '')) &&
          r.term && reqTerm &&
          r.term.toLowerCase().trim() === reqTerm.toLowerCase().trim()
        );
      }

      if (matched) {
        const isPub = matched.isPublished !== false && matched.status !== 'Unpublished';
        const validSubs = (matched.subjects || []).filter((s: any) => {
          const ca = Number(s.caScore ?? s.ca1 ?? s.ca ?? 0) + Number(s.ca2 ?? 0) + Number(s.midterm ?? 0);
          const exam = Number(s.examScore ?? s.exam ?? 0);
          const total = Number(s.total ?? (ca + exam));
          return total > 0;
        });

        if (isPub && validSubs.length > 0) {
          return {
            ...activeResult,
            academicSession: matched.academicSession || reqSession,
            term: matched.term || reqTerm,
            className: matched.className || activeResult.className,
            subjects: matched.subjects || [],
            overallTotal: matched.overallTotal ?? 0,
            overallAverage: matched.overallAverage ?? 0,
            gpa: matched.gpa ?? 0,
            isPublished: true,
            status: 'Published'
          };
        } else {
          return {
            ...activeResult,
            academicSession: reqSession,
            term: reqTerm,
            className: matched.className || activeResult.className,
            subjects: [],
            overallTotal: 0,
            overallAverage: 0,
            gpa: 0,
            isPublished: false,
            status: 'Unpublished'
          };
        }
      }
    }

    const sameSession = !reqSession || (activeResult.academicSession || (activeResult as any).session || '').toLowerCase().includes(reqSession.toLowerCase().replace(' academic session', ''));
    const sameTerm = !reqTerm || (activeResult.term || '').toLowerCase().trim() === reqTerm.toLowerCase().trim();
    const isPub = activeResult.isPublished !== false && activeResult.status !== 'Unpublished';
    const validSubs = (activeResult.subjects || []).filter((s: any) => {
      const ca = Number(s.caScore ?? s.ca1 ?? s.ca ?? 0) + Number(s.ca2 ?? 0) + Number(s.midterm ?? 0);
      const exam = Number(s.examScore ?? s.exam ?? 0);
      const total = Number(s.total ?? (ca + exam));
      return total > 0;
    });

    if (sameSession && sameTerm && isPub && validSubs.length > 0) {
      return activeResult;
    }

    return {
      ...activeResult,
      academicSession: reqSession,
      term: reqTerm,
      className: reqClass,
      subjects: [],
      overallTotal: 0,
      overallAverage: 0,
      gpa: 0,
      isPublished: false,
      status: 'Unpublished'
    };
  }, [activeResult, selectedSession, selectedTerm, selectedClass]);

  const cardResult = displayResult || activeResult;
  const activeResultRank = calculateDynamicStudentPosition(cardResult, allStudentsList);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    const cleaned = studentIdInput.trim();
    try {
      const apiResult = await api.getStudentById(cleaned);
      setIsLoading(false);

      if (apiResult) {
        setActiveResult(apiResult);
      } else {
        setErrorMsg(`No record found for Registration Number "${studentIdInput}".`);
      }
    } catch {
      setIsLoading(false);
      setErrorMsg(`No record found for Registration Number "${studentIdInput}".`);
    }
  };

  const handleSampleSelect = async (id: string) => {
    setStudentIdInput(id);
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const apiResult = await api.getStudentById(id);
      setIsLoading(false);
      setActiveResult(apiResult || null);
    } catch {
      setIsLoading(false);
      setActiveResult(null);
    }
  };

  return (
    <section id="result-search" className="py-20 lg:py-28 bg-white relative overflow-hidden">
      {/* Decorative ambient background */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-[#1E3A8A]/5 rounded-full blur-3xl -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#F59E0B]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#1E3A8A] text-xs font-bold uppercase tracking-wider">
            <Search className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span>Student Examination Search Gateway</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#0F172A] tracking-tight font-['Plus_Jakarta_Sans']">
            Check Student Result <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-[#1E3A8A] via-[#1e40af] to-[#60A5FA] bg-clip-text text-transparent">
              In Real-Time
            </span>
          </h2>

          <p className="text-base sm:text-lg text-[#64748B]">
            Experience our ultra-fast SaaS result verification engine. Select search parameters or click any sample student ID below.
          </p>
        </div>

        {/* Main Interactive SaaS Panel */}
        <div className="glass-panel rounded-3xl shadow-2xl border border-slate-200/90 p-6 sm:p-8 lg:p-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            
            {/* Left Form Column */}
            <div className="lg:col-span-5 space-y-6">
              
              <div className="border-b border-slate-200 pb-4">
                <h3 className="text-lg font-black text-[#0F172A] font-['Plus_Jakarta_Sans'] flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#1E3A8A]" />
                  <span>Student Result Lookup</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">No login or password required for result checking.</p>
              </div>

              {/* Quick Sample Selector Chips */}
              <div>
                <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Live Student Registration IDs
                </span>
                <div className="flex flex-wrap gap-2">
                  {allStudentsList.length > 0 ? (
                    allStudentsList.map((s) => (
                      <button
                        key={s.studentId}
                        type="button"
                        onClick={() => handleSampleSelect(s.studentId)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                          studentIdInput === s.studentId
                            ? 'bg-[#1E3A8A] text-white shadow-md'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                        }`}
                      >
                        {s.studentId}
                      </button>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 italic">No student records in database yet. Add students via Admin Portal.</span>
                  )}
                </div>
              </div>

              <form onSubmit={handleSearch} className="space-y-4">
                {/* Student ID Input */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      7-Digit Registration ID (Primary Key) *
                    </label>
                    <span className="text-[10px] font-mono font-bold text-[#1E3A8A] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                      7 Digits Required
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      maxLength={7}
                      value={studentIdInput}
                      onChange={(e) => setStudentIdInput(e.target.value.replace(/\D/g, ''))}
                      placeholder="e.g. 2025104"
                      required
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-sm font-mono font-bold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:bg-white transition-all shadow-xs"
                    />
                    {studentIdInput && (
                      <button
                        type="button"
                        onClick={() => setStudentIdInput('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-600 bg-slate-200 px-2 py-0.5 rounded-lg"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                {/* Term Dropdown */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Examination Term
                  </label>
                  <div className="relative">
                    <select
                      value={selectedTerm}
                      onChange={(e) => setSelectedTerm(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] appearance-none pr-10"
                    >
                      {termsList.length > 0 ? (
                        termsList.map((term) => (
                          <option key={term} value={term}>{term}</option>
                        ))
                      ) : (
                        <option value="Third Term">Third Term (Current Term)</option>
                      )}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Class Dropdown */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Student Class
                  </label>
                  <div className="relative">
                    <select
                      value={selectedClass}
                      onChange={(e) => setSelectedClass(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] appearance-none pr-10"
                    >
                      {classesList.length > 0 ? (
                        classesList.map((cls) => (
                          <option key={cls} value={cls}>{cls}</option>
                        ))
                      ) : (
                        <option value="All Classes">All Classes</option>
                      )}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 px-6 bg-[#1E3A8A] hover:bg-[#1e40af] text-white font-bold text-sm rounded-2xl shadow-lg royal-glow transition-all duration-200 active:scale-98 flex items-center justify-center gap-2 border border-[#60A5FA]/30 cursor-pointer disabled:opacity-75"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-[#F59E0B]" />
                      <span>Fetching Verification Records...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 text-[#F59E0B]" />
                      <span>Check Result</span>
                    </>
                  )}
                </button>
              </form>

              {/* Error Alert */}
              {errorMsg && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                  <p>{errorMsg}</p>
                </div>
              )}
            </div>

            {/* Right Column: Live Mockup Result Preview */}
            <div className="lg:col-span-7 bg-slate-50/80 rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-inner">
              
              {activeResult ? (
                <div className="space-y-5">
                  
                  {/* Top Status Header */}
                  <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                    <div className="flex items-center gap-2.5">
                      <span className="p-1.5 rounded-xl bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      </span>
                      <div>
                        <h4 className="text-sm font-extrabold text-[#0F172A] font-['Plus_Jakarta_Sans']">
                          Official Result Slip Loaded
                        </h4>
                        <p className="text-[11px] text-slate-500 font-mono">
                          Cryptographic Hash: {activeResult.verificationHash}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => onOpenResultSlip(activeResult)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1E3A8A] hover:bg-[#1e40af] text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#F59E0B]" />
                      <span>View Full Slip</span>
                    </button>
                  </div>

                  {/* Student Card Summary Header */}
                  <div className="grid grid-cols-12 gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs items-center">
                    <div className="col-span-3 sm:col-span-2">
                      <img
                        src={activeResult?.passportUrl || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=400'}
                        alt={activeResult?.fullName || 'Student'}
                        className="w-full aspect-3/4 object-cover rounded-xl border border-slate-300 shadow-xs"
                      />
                    </div>

                    <div className="col-span-9 sm:col-span-10 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Student Name</span>
                        <span className="text-[10px] font-mono text-[#1E3A8A] font-extrabold">{activeResult.studentId}</span>
                      </div>
                      <h3 className="text-base font-black text-[#0F172A] font-['Plus_Jakarta_Sans']">
                        {activeResult.fullName}
                      </h3>
                      <p className="text-xs font-semibold text-slate-600">{activeResult.className}</p>

                      <div className="flex flex-wrap items-center gap-3 pt-2 text-xs font-medium">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[10px]">
                          Position: {activeResultRank.ordinalPosition} / {activeResultRank.totalInClass}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                          Average: {(cardResult?.overallAverage || 0).toFixed(1)}%
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-blue-50 text-[#1E3A8A] font-bold text-[10px]">
                          GPA: {(cardResult?.gpa || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Subject Grades Preview Grid */}
                  <div>
                    <h5 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">
                      Academic Subject Performance
                    </h5>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {(() => {
                        const rawSubs = Array.isArray(cardResult?.subjects) ? cardResult.subjects : [];
                        const validSubs = rawSubs.filter((sub: any) => {
                          if (!sub || typeof sub !== 'object') return false;
                          const name = (sub.subject || sub.name || '').trim();
                          if (!name) return false;
                          const ca = Number(sub.caScore ?? sub.ca ?? 0);
                          const exam = Number(sub.examScore ?? sub.exam ?? 0);
                          const total = Number(sub.total ?? 0);
                          const grade = (sub.grade || '').trim().toUpperCase();
                          const remark = (sub.remark || '').trim().toUpperCase();
                          return ca > 0 || exam > 0 || total > 0 || (grade !== '' && grade !== 'PENDING' && grade !== 'UNRECORDED') || (remark !== '' && remark !== 'PENDING' && remark !== 'UNRECORDED');
                        });
                        if (validSubs.length === 0 || cardResult?.isPublished === false || cardResult?.status === 'Unpublished') {
                          return (
                            <div className="col-span-2 bg-amber-50 p-4 rounded-xl border border-amber-200 text-center font-bold text-xs text-amber-950">
                              No result has been published for the selected Academic Session and Academic Term.
                            </div>
                          );
                        }
                        return validSubs.slice(0, 6).map((sub: any, idx: number) => (
                          <div key={sub.id || idx} className="bg-white p-2.5 rounded-xl border border-slate-200/80 flex items-center justify-between">
                            <div>
                              <span className="text-xs font-bold text-slate-900 block">{sub.subject}</span>
                              <span className="text-[10px] text-slate-500 font-mono">
                                CA: {sub.caScore ?? 0} | Exam: {sub.examScore ?? 0}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-mono font-bold text-[#1E3A8A] block">{sub.total ?? 0}/100</span>
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${
                                sub.grade === 'F9' || sub.grade?.startsWith('F')
                                  ? 'text-red-700 bg-red-100 border-red-300 font-extrabold'
                                  : sub.grade?.startsWith('A')
                                  ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                                  : 'text-blue-700 bg-blue-50 border-blue-100'
                              }`}>
                                {sub.grade || '—'}
                              </span>
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>

                  {/* Remarks & Endorsement Preview */}
                  <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 text-xs space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">Class Teacher's Remark</span>
                        <p className="text-slate-700 italic font-medium mt-0.5">"{cardResult?.classTeacherRemark || activeResult.classTeacherRemark}"</p>
                      </div>
                      
                      <div className="text-right shrink-0">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">Status</span>
                        {(() => {
                          if (cardResult?.isPublished === false || cardResult?.status === 'Unpublished' || !cardResult?.subjects?.length) {
                            return (
                              <span className="inline-block px-2 py-0.5 rounded-md font-bold text-[10px] bg-amber-100 text-amber-900 border border-amber-300">
                                Unpublished / Pending Release
                              </span>
                            );
                          }
                          const avg = cardResult?.overallAverage ?? cardResult?.averageScore ?? 0;
                          const isPass = avg >= 50;
                          const statusLabel = isPass ? (cardResult?.status || 'Good Standing (GS)') : 'Not In Good Standing (NGS)';
                          return (
                            <span className={`inline-block px-2 py-0.5 rounded-md font-bold text-[10px] ${isPass ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800 font-extrabold'}`}>
                              {statusLabel}
                            </span>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Action bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <button
                      onClick={() => onOpenResultSlip(activeResult)}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1E3A8A] hover:bg-[#1e40af] text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
                    >
                      <Printer className="w-4 h-4 text-[#F59E0B]" />
                      <span>Print Official Report Slip</span>
                    </button>

                    <button
                      onClick={() => onVerifyQR(activeResult.studentId)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition-all cursor-pointer"
                    >
                      <QrCode className="w-4 h-4 text-[#1E3A8A]" />
                      <span>Verify QR</span>
                    </button>
                  </div>

                </div>
              ) : (
                <div className="py-20 text-center space-y-3">
                  <Search className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-sm font-semibold text-slate-500">Enter a Student Reg ID to view examination results.</p>
                </div>
              )}

            </div>

          </div>
        </div>

      </div>
    </section>
  );
};
