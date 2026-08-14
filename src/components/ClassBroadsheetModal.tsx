import React, { useState, useEffect } from 'react';
import { StudentResult, SchoolHeaderInfo } from '../types';
import { Printer, Download, X, Award, Users, BookOpen, GraduationCap, CheckCircle } from 'lucide-react';
import { api } from '../services/api';

interface ClassBroadsheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  classNameSelected: string;
  classTeacherName: string;
  sessionSelected?: string;
  termSelected?: string;
  students: any[];
  subjectList: Array<{ code: string; name: string; category?: string; teacher?: string }>;
  schoolHeader: SchoolHeaderInfo;
  branding?: {
    logoUrl?: string | null;
    stampUrl?: string | null;
    signatureUrl?: string | null;
    positions?: {
      logo?: { x: number; y: number; scale: number; rotate: number };
      stamp?: { x: number; y: number; scale: number; rotate: number };
      signature?: { x: number; y: number; scale: number; rotate: number };
    };
  };
}

export const ClassBroadsheetModal: React.FC<ClassBroadsheetModalProps> = ({
  isOpen,
  onClose,
  classNameSelected,
  classTeacherName,
  sessionSelected,
  termSelected,
  students,
  subjectList,
  schoolHeader,
  branding,
}) => {
  const [brandingState, setBrandingState] = useState<{
    logoUrl?: string | null;
    stampUrl?: string | null;
    signatureUrl?: string | null;
    positions?: {
      logo?: { x: number; y: number; scale: number; rotate: number };
      stamp?: { x: number; y: number; scale: number; rotate: number };
      signature?: { x: number; y: number; scale: number; rotate: number };
    };
  } | null>(branding || null);

  useEffect(() => {
    if (isOpen) {
      if (branding) {
        setBrandingState(branding);
      } else {
        api.getBranding().then((b) => {
          if (b) setBrandingState(b);
        });
      }
    }
  }, [isOpen, branding]);

  if (!isOpen) return null;

  // Filter and map students by selected class, session, and term strictly from database records
  const mappedStudents = students.map(s => {
    let rec: any = null;
    if (sessionSelected && termSelected && s.termRecords && Array.isArray(s.termRecords)) {
      rec = s.termRecords.find(
        (r: any) => (r.academicSession === sessionSelected || r.academicSession?.includes(sessionSelected.split(' ')[0])) &&
             (r.term === termSelected || r.term?.includes(termSelected)) &&
             (classNameSelected === 'All' || !r.className || r.className === classNameSelected || r.className.includes(classNameSelected) || classNameSelected.includes(r.className))
      );
    }

    if (rec) {
      const isPub = rec.isPublished !== false && rec.status !== 'Unpublished';
      let actualAvg = 0;
      let actualTot = 0;
      if (Array.isArray(rec.subjects) && rec.subjects.length > 0) {
        const scores = rec.subjects.map((sub: any) => Number(sub.score || sub.total || 0));
        actualTot = scores.reduce((a: number, b: number) => a + b, 0);
        actualAvg = Number((actualTot / scores.length).toFixed(1));
      } else if (rec.overallAverage !== undefined && rec.overallAverage !== null) {
        actualAvg = Number(rec.overallAverage);
        actualTot = Number(rec.overallTotal || 0);
      } else if (rec.averageScore !== undefined && rec.averageScore !== null) {
        actualAvg = Number(rec.averageScore);
      } else if (rec.gpa !== undefined && rec.gpa !== null) {
        actualAvg = Number((rec.gpa * 25).toFixed(1));
      }

      return {
        ...s,
        className: rec.className || s.className,
        subjects: isPub ? (rec.subjects || []) : [],
        overallTotal: isPub ? actualTot : 0,
        overallAverage: isPub ? actualAvg : 0,
        averageScore: isPub ? actualAvg : 0,
        gpa: isPub ? (rec.gpa ?? (actualAvg > 0 ? Number((actualAvg / 25).toFixed(2)) : 0)) : 0,
        hasScoreRecord: isPub && actualAvg > 0,
      };
    }

    const matchesTopLevel = (!sessionSelected || s.academicSession === sessionSelected || s.session === sessionSelected) &&
                            (!termSelected || s.term === termSelected) &&
                            (classNameSelected === 'All' || s.className === classNameSelected || s.className?.includes(classNameSelected));

    if (matchesTopLevel) {
      const isPub = s.isPublished !== false && s.status !== 'Unpublished';
      let actualAvg = 0;
      let actualTot = 0;
      if (Array.isArray(s.subjects) && s.subjects.length > 0) {
        const scores = s.subjects.map((sub: any) => Number(sub.score || sub.total || 0));
        actualTot = scores.reduce((a: number, b: number) => a + b, 0);
        actualAvg = Number((actualTot / scores.length).toFixed(1));
      } else if (s.overallAverage !== undefined && s.overallAverage !== null) {
        actualAvg = Number(s.overallAverage);
        actualTot = Number(s.overallTotal || 0);
      } else if (s.averageScore !== undefined && s.averageScore !== null) {
        actualAvg = Number(s.averageScore);
      } else if (s.gpa !== undefined && s.gpa !== null) {
        actualAvg = Number((s.gpa * 25).toFixed(1));
      }

      return {
        ...s,
        subjects: isPub ? (s.subjects || []) : [],
        overallTotal: isPub ? actualTot : 0,
        overallAverage: isPub ? actualAvg : 0,
        averageScore: isPub ? actualAvg : 0,
        gpa: isPub ? (s.gpa ?? (actualAvg > 0 ? Number((actualAvg / 25).toFixed(2)) : 0)) : 0,
        hasScoreRecord: isPub && actualAvg > 0,
      };
    }

    return {
      ...s,
      subjects: [],
      overallTotal: 0,
      overallAverage: 0,
      averageScore: 0,
      gpa: 0,
      hasScoreRecord: false,
    };
  });

  const classStudents = mappedStudents.filter(s => {
    return classNameSelected === 'All' || s.className === classNameSelected || s.className?.includes(classNameSelected);
  });

  // Sort by score/average descending to derive rank (scored students first)
  const rankedStudents = [...classStudents].sort((a, b) => {
    const scoreA = Number(a.averageScore || a.overallAverage || 0);
    const scoreB = Number(b.averageScore || b.overallAverage || 0);
    return scoreB - scoreA;
  });

  // Unique subject teachers count and list
  const assignedTeachers = Array.from(
    new Set(subjectList.map(s => s.teacher).filter(Boolean))
  );

  // Class statistics calculated strictly from database
  const totalStudents = rankedStudents.length;
  const scoredStudents = rankedStudents.filter(s => Number(s.averageScore || s.overallAverage || 0) > 0);
  const classAverageScore = scoredStudents.length > 0 
    ? (scoredStudents.reduce((acc, curr) => acc + Number(curr.averageScore || curr.overallAverage || 0), 0) / scoredStudents.length).toFixed(1)
    : '0.0';
  const gsCount = scoredStudents.filter(s => Number(s.averageScore || s.overallAverage || 0) >= 50).length;
  const passRate = scoredStudents.length > 0 ? ((gsCount / scoredStudents.length) * 100).toFixed(1) : '0.0';

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = ['Rank,Student ID,Full Name,Class,Gender,Average Score (%),Standing,Class Teacher'];
    const rows = rankedStudents.map((st, idx) => {
      const avgNum = Number(st.averageScore || st.overallAverage || 0);
      const avgText = avgNum > 0 ? `${avgNum.toFixed(1)}%` : '0.0%';
      const isGS = avgNum >= 50;
      return `"${idx + 1}","${st.studentId || ''}","${st.fullName || (st as any).name || ''}","${st.className || classNameSelected}","${st.gender || 'N/A'}","${avgText}","${avgNum > 0 ? (isGS ? 'GS (Good Standing)' : 'NGS') : 'Pending'}","${classTeacherName || 'Unassigned'}"`;
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join('\n'), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Class_Broadsheet_${classNameSelected.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto result-slip-modal-wrapper">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full flex flex-col max-h-[92vh] overflow-hidden border border-slate-200 result-slip-modal-content">
        
        {/* TOP CONTROL BAR (Hidden when printing) */}
        <div className="bg-[#1E3A8A] text-white px-6 py-3.5 flex items-center justify-between shrink-0 no-print border-b border-blue-400/20">
          <div className="flex items-center gap-2.5">
            <GraduationCap className="w-5 h-5 text-[#F59E0B]" />
            <div>
              <h3 className="text-sm font-bold leading-none">Class Broadsheet & Score List</h3>
              <p className="text-[11px] text-blue-200 mt-0.5">
                Official class roster & student score report for {classNameSelected}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-[#F59E0B] hover:bg-yellow-500 text-slate-950 rounded-xl transition-all shadow-md cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Broadsheet</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-blue-200 hover:text-white rounded-lg transition-colors cursor-pointer ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE BROADSHEET BODY */}
        <div className="p-6 sm:p-8 overflow-y-auto print-area bg-white text-black font-sans box-border" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
          
          {/* 1. OFFICIAL SCHOOL HEADER */}
          <div className="border-b-2 border-black pb-4 mb-4">
            <div className="flex items-center justify-between gap-4">
              <div className="w-20 h-20 flex-shrink-0 flex items-center justify-center">
                {brandingState?.logoUrl ? (
                  <img src={brandingState.logoUrl} alt="School Logo" className="max-w-full max-h-full object-contain" />
                ) : (
                  <div className="w-16 h-16 bg-[#1E3A8A] text-white rounded-xl flex items-center justify-center font-black text-2xl">
                    FA
                  </div>
                )}
              </div>

              <div className="text-center flex-1">
                <h1 className="text-[20px] font-black text-black uppercase tracking-wider leading-tight">
                  {schoolHeader.schoolName || 'FAITH ACADEMY'}
                </h1>
                <p className="text-[11px] font-semibold text-black uppercase tracking-wide mt-0.5">
                  {schoolHeader.addressLine1 || 'FAITH TABERNACLE, KM 10, IDI ROAN ROAD, CANAANLAND'}
                </p>
                <h2 className="text-[13px] font-bold text-black uppercase tracking-wider mt-2 bg-slate-100 py-1 border border-black">
                  OFFICIAL CLASS BROADSHEET & MASTER STUDENT SCORE LIST
                </h2>
                <p className="text-[10px] font-bold text-black uppercase tracking-widest mt-1">
                  {(sessionSelected || '2024/2025 ACADEMIC SESSION').toUpperCase()} — {(termSelected || '1ST TERM (MIDTERM REPORT)').toUpperCase()}
                </p>
              </div>

              <div className="w-20 h-20 flex-shrink-0 flex items-center justify-center border border-black p-1 bg-slate-50 text-center">
                <div className="text-[8px] font-bold uppercase text-black">
                  <p className="font-extrabold text-[9px] border-b border-black pb-0.5">OFFICIAL RECORD</p>
                  <p className="mt-1 font-mono">BROADSHEET</p>
                  <p className="mt-0.5 text-[7px] text-slate-700">FAITH ACADEMY</p>
                </div>
              </div>
            </div>
          </div>

          {/* 2. CLASS METADATA & SUMMARY BANNERS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 text-[11px] border border-black p-3 bg-slate-50/50">
            <div>
              <span className="font-bold text-slate-600 block uppercase text-[9px]">Class Stream:</span>
              <span className="font-black text-black text-[13px]">{classNameSelected}</span>
            </div>
            <div>
              <span className="font-bold text-slate-600 block uppercase text-[9px]">Form Master / Class Teacher:</span>
              <span className="font-bold text-black text-[12px]">{classTeacherName || 'Form Master'}</span>
            </div>
            <div>
              <span className="font-bold text-slate-600 block uppercase text-[9px]">Total Enrolled Students:</span>
              <span className="font-black text-black text-[12px]">{totalStudents} Students</span>
            </div>
            <div>
              <span className="font-bold text-slate-600 block uppercase text-[9px]">Class Score Average:</span>
              <span className="font-black text-black text-[12px]">{classAverageScore}% ({passRate}% Pass Rate)</span>
            </div>
          </div>

          {/* 3. ASSIGNED SUBJECT TEACHERS ROSTER */}
          <div className="mb-4 border border-black p-2.5 bg-white text-[10px]">
            <div className="flex items-center justify-between border-b border-black pb-1 mb-1.5">
              <span className="font-bold text-black uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-black" />
                Assigned Subject Teachers for {classNameSelected} ({subjectList.length} Core Curriculum Subjects)
              </span>
              <span className="font-bold text-black uppercase text-[9px]">
                {assignedTeachers.length} Subject Instructors
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {subjectList.length > 0 ? (
                subjectList.map((sub, i) => (
                  <div key={sub.code || i} className="flex items-center gap-1.5 text-[10px]">
                    <span className="font-bold text-black">{sub.name}:</span>
                    <span className="font-medium text-slate-800">{sub.teacher || 'Unassigned Instructor'}</span>
                  </div>
                ))
              ) : (
                <div className="col-span-3 text-slate-500 italic">No subject teachers explicitly mapped. Standard core faculty assigned.</div>
              )}
            </div>
          </div>

          {/* 4. MASTER STUDENT SCORES & RANKING TABLE */}
          <div className="mb-6">
            <table className="w-full text-[11px] text-black border-collapse border border-black font-sans" style={{ borderCollapse: 'collapse', tableLayout: 'fixed' }}>
              <thead>
                <tr className="bg-[#e5e5e5] text-black font-bold border-b border-black text-center">
                  <th className="border border-black text-center align-middle" style={{ width: '45px', padding: '6px 4px', lineHeight: 'normal', verticalAlign: 'middle' }}>RANK</th>
                  <th className="border border-black text-center align-middle" style={{ width: '85px', padding: '6px 4px', lineHeight: 'normal', verticalAlign: 'middle' }}>REG ID</th>
                  <th className="border border-black text-left align-middle" style={{ padding: '6px 8px', lineHeight: 'normal', verticalAlign: 'middle' }}>STUDENT FULL NAME</th>
                  <th className="border border-black text-center align-middle" style={{ width: '70px', padding: '6px 4px', lineHeight: 'normal', verticalAlign: 'middle' }}>GENDER</th>
                  <th className="border border-black text-center align-middle" style={{ width: '100px', padding: '6px 4px', lineHeight: 'normal', verticalAlign: 'middle' }}>CLASS STREAM</th>
                  <th className="border border-black text-center align-middle" style={{ width: '90px', padding: '6px 4px', lineHeight: 'normal', verticalAlign: 'middle' }}>AVG SCORE (%)</th>
                  <th className="border border-black text-center align-middle" style={{ width: '75px', padding: '6px 4px', lineHeight: 'normal', verticalAlign: 'middle' }}>STANDING</th>
                  <th className="border border-black text-left align-middle" style={{ width: '150px', padding: '6px 8px', lineHeight: 'normal', verticalAlign: 'middle' }}>ACADEMIC REMARK</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black font-normal">
                {rankedStudents.length > 0 ? (
                  rankedStudents.map((st, idx) => {
                    const avgVal = Number(st.averageScore || st.overallAverage || 0);
                    const hasScore = avgVal > 0;
                    const isGS = avgVal >= 50;

                    let remark = 'Pending Assessment';
                    if (hasScore) {
                      if (avgVal >= 85) remark = 'Distinction / Excellent';
                      else if (avgVal >= 70) remark = 'Very Good Performance';
                      else if (avgVal >= 50) remark = 'Credit Pass';
                      else remark = 'Needs Academic Support';
                    }

                    return (
                      <tr key={st.studentId || idx}>
                        <td className="border border-black text-center font-bold font-mono align-middle" style={{ padding: '6px 4px', lineHeight: 'normal', verticalAlign: 'middle' }}>
                          {hasScore ? (idx === 0 ? '1st' : idx === 1 ? '2nd' : idx === 2 ? '3rd' : `${idx + 1}th`) : '—'}
                        </td>
                        <td className="border border-black text-center font-mono font-bold align-middle" style={{ padding: '6px 4px', lineHeight: 'normal', verticalAlign: 'middle' }}>
                          {st.studentId || '—'}
                        </td>
                        <td className="border border-black text-left uppercase font-bold align-middle" style={{ padding: '6px 8px', lineHeight: 'normal', verticalAlign: 'middle' }}>
                          {st.fullName || (st as any).name || 'Unnamed Student'}
                        </td>
                        <td className="border border-black text-center uppercase align-middle" style={{ padding: '6px 4px', lineHeight: 'normal', verticalAlign: 'middle' }}>
                          {st.gender || 'N/A'}
                        </td>
                        <td className="border border-black text-center font-bold uppercase align-middle" style={{ padding: '6px 4px', lineHeight: 'normal', verticalAlign: 'middle' }}>
                          {st.className || classNameSelected}
                        </td>
                        <td className="border border-black text-center font-mono font-bold align-middle" style={{ padding: '6px 4px', lineHeight: 'normal', verticalAlign: 'middle' }}>
                          {hasScore ? `${avgVal.toFixed(1)}%` : '0.0%'}
                        </td>
                        <td className="border border-black text-center font-bold align-middle" style={{ padding: '6px 4px', lineHeight: 'normal', verticalAlign: 'middle' }}>
                          {hasScore ? (
                            isGS ? (
                              <span className="text-black font-extrabold">GS</span>
                            ) : (
                              <span className="text-black font-bold">NGS</span>
                            )
                          ) : (
                            <span className="text-slate-500 font-normal">Pending</span>
                          )}
                        </td>
                        <td className="border border-black text-left text-[10px] align-middle" style={{ padding: '6px 8px', lineHeight: 'normal', verticalAlign: 'middle' }}>
                          {remark}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="p-4 text-center font-bold text-slate-500 uppercase tracking-wider border border-black align-middle" style={{ padding: '12px 8px', lineHeight: 'normal', verticalAlign: 'middle' }}>
                      No registered students found in database for class stream: {classNameSelected}.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* 5. FORM TEACHER REMARKS & AUTHENTICATION BLOCK */}
          <div className="grid grid-cols-2 gap-4 border border-black p-3 bg-white text-[11px] mb-4">
            <div>
              <span className="font-bold text-black uppercase block text-[10px] border-b border-black pb-0.5 mb-2">
                Form Master / Class Teacher Endorsement
              </span>
              <p className="text-[10px] italic text-slate-800">
                "Class performance for {classNameSelected} reflects commendable effort across core subjects. All student scores have been verified against continuous assessment records."
              </p>
              <div className="mt-4 pt-2 border-t border-dashed border-black flex justify-between items-center text-[10px]">
                <span className="font-bold text-black">Form Master: {classTeacherName || 'Form Master'}</span>
                <span className="font-bold italic text-black">Signed & Approved</span>
              </div>
            </div>

            <div className="flex flex-col justify-between relative min-h-[140px]">
              <span className="font-bold text-black uppercase block text-[10px] border-b border-black pb-0.5 mb-1 text-center">
                Principal & Examination Board Authorization
              </span>
              
              <div className="relative flex-1 my-1 flex items-center justify-center min-h-[90px] overflow-visible">
                {/* Official Rubber Stamp */}
                <div
                  className="absolute z-10 pointer-events-none"
                  style={{
                    transform: brandingState?.positions?.stamp
                      ? `translate(${brandingState.positions.stamp.x}px, ${brandingState.positions.stamp.y}px) scale(${brandingState.positions.stamp.scale || 1}) rotate(${brandingState.positions.stamp.rotate || -8}deg)`
                      : 'translate(-10px, 0px) scale(1) rotate(-8deg)',
                  }}
                >
                  {brandingState?.stampUrl ? (
                    <img src={brandingState.stampUrl} alt="Official Stamp" className="w-28 h-28 object-contain" />
                  ) : (
                    <div className="w-28 h-28 border-2 border-dashed border-black rounded-full flex flex-col items-center justify-center p-2 text-center bg-transparent">
                      <span className="text-[9px] font-extrabold uppercase leading-none text-black">FAITH ACADEMY</span>
                      <span className="text-[7px] font-bold uppercase leading-none mt-1 text-black">OFFICIAL STAMP</span>
                    </div>
                  )}
                </div>

                {/* Principal Signature */}
                <div
                  className="relative z-20 flex flex-col items-center justify-center pointer-events-none"
                  style={{
                    transform: brandingState?.positions?.signature
                      ? `translate(${brandingState.positions.signature.x}px, ${brandingState.positions.signature.y}px) scale(${brandingState.positions.signature.scale || 1}) rotate(${brandingState.positions.signature.rotate || 0}deg)`
                      : 'translate(0px, 0px) scale(1) rotate(0deg)',
                  }}
                >
                  {brandingState?.signatureUrl ? (
                    <img src={brandingState.signatureUrl} alt="Principal Signature" className="h-16 max-w-[200px] object-contain" />
                  ) : (
                    <span className="font-bold text-base font-serif italic tracking-wider text-black">Principal Signature</span>
                  )}
                </div>
              </div>

              <div className="border-t border-black pt-1 flex items-center justify-between text-[9px] font-bold text-black uppercase">
                <span>Faith Academy Examination Board</span>
                <span>Officially Stamped & Signed</span>
              </div>
            </div>
          </div>

          {/* 6. WATERMARK / FOOTER NOTICE */}
          <div className="text-center pt-1">
            <p className="text-[9px] font-bold uppercase tracking-wider text-black">
              *** FAITH ACADEMY OFFICIAL COMPUTER GENERATED CLASS BROADSHEET & SCORE REPORT ***
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};
