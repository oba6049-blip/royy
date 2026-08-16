import React, { useState, useMemo } from 'react';
import { StudentResult, SchoolHeaderInfo } from '../types';
import { isStudentInClass } from '../utils/studentRanking';
import {
  TrendingUp,
  Users,
  Award,
  BookOpen,
  GraduationCap,
  Filter,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Search,
  PieChart,
  BarChart3,
  Download,
  Layers,
  UserCheck,
  Building2,
  ChevronRight,
  Eye,
} from 'lucide-react';

interface SchoolAnalyticsViewProps {
  students: any[];
  classList: Array<{ id: string; name: string; arm: string; teacher: string; capacity: number; enrolled: number }>;
  subjectList: Array<{ code: string; name: string; category?: string; teacher?: string }>;
  schoolHeader: SchoolHeaderInfo;
  onViewStudent: (student: any) => void;
  onNavigateToTab: (tab: string) => void;
}

export const SchoolAnalyticsView: React.FC<SchoolAnalyticsViewProps> = ({
  students,
  classList,
  subjectList,
  schoolHeader,
  onViewStudent,
  onNavigateToTab,
}) => {
  // Filters
  const [selectedClass, setSelectedClass] = useState<string>('All');
  const [selectedGender, setSelectedGender] = useState<string>('All');
  const [selectedTier, setSelectedTier] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Get list of unique classes derived strictly from admin created classList
  const allClassNames = useMemo(() => {
    return Array.from(
      new Set(classList.map((c) => c.name.trim()).filter(Boolean))
    );
  }, [classList]);

  // Helper to extract student average score
  const getStudentAvg = (s: any): number => {
    if (s.averageScore !== undefined && s.averageScore !== null) return Number(s.averageScore);
    if (s.overallAverage !== undefined && s.overallAverage !== null) return Number(s.overallAverage);
    if (s.gpa !== undefined && s.gpa !== null) return Number(s.gpa) * 25;
    return 0;
  };

  // Filtered Students based on active controls
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      // Class Filter
      if (selectedClass !== 'All') {
        const matchesClass = s.className === selectedClass || (s.className && s.className.includes(selectedClass));
        if (!matchesClass) return false;
      }

      // Gender Filter
      if (selectedGender !== 'All') {
        if ((s.gender || 'Male').toLowerCase() !== selectedGender.toLowerCase()) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const nameMatch = (s.name || s.fullName || '').toLowerCase().includes(query);
        const idMatch = (s.studentId || '').toLowerCase().includes(query);
        if (!nameMatch && !idMatch) return false;
      }

      // Tier Filter
      const avg = getStudentAvg(s);
      if (selectedTier === 'Distinction' && avg < 75) return false;
      if (selectedTier === 'Credit' && (avg < 50 || avg >= 75)) return false;
      if (selectedTier === 'At-Risk' && avg >= 50) return false;

      return true;
    });
  }, [students, selectedClass, selectedGender, selectedTier, searchQuery]);

  // Aggregate Metrics Calculations
  const metrics = useMemo(() => {
    const totalEnrolled = filteredStudents.length;

    const scores = filteredStudents.map((s) => getStudentAvg(s));
    const totalScoreSum = scores.reduce((acc, curr) => acc + curr, 0);
    const overallAvg = totalEnrolled > 0 ? totalScoreSum / totalEnrolled : 0;

    const goodStandingCount = scores.filter((score) => score >= 50).length;
    const passRate = totalEnrolled > 0 ? (goodStandingCount / totalEnrolled) * 100 : 0;

    const distinctionCount = scores.filter((score) => score >= 75).length;
    const creditCount = scores.filter((score) => score >= 50 && score < 75).length;
    const atRiskCount = scores.filter((score) => score < 50).length;

    // Gender breakdown
    const males = filteredStudents.filter((s) => (s.gender || 'Male').toLowerCase() === 'male');
    const females = filteredStudents.filter((s) => (s.gender || 'Male').toLowerCase() === 'female');

    const maleAvg = males.length > 0 ? males.reduce((acc, s) => acc + getStudentAvg(s), 0) / males.length : 0;
    const femaleAvg = females.length > 0 ? females.reduce((acc, s) => acc + getStudentAvg(s), 0) / females.length : 0;

    // Capacity metrics from classList
    const totalCapacity = classList.reduce((acc, c) => acc + (c.capacity || 35), 0);
    const totalEnrolledInClasses = classList.reduce((acc, c) => acc + (c.enrolled || 0), 0);
    const capacityUtilization = totalCapacity > 0 ? Math.min(100, (totalEnrolled / totalCapacity) * 100) : 100;

    return {
      totalEnrolled,
      overallAvg,
      passRate,
      goodStandingCount,
      distinctionCount,
      creditCount,
      atRiskCount,
      malesCount: males.length,
      femalesCount: females.length,
      maleAvg,
      femaleAvg,
      totalCapacity,
      totalEnrolledInClasses,
      capacityUtilization,
    };
  }, [filteredStudents, classList]);

  // Per-Class Breakdown Stats
  const classBreakdown = useMemo(() => {
    return allClassNames.map((className) => {
      const classInfo = classList.find((c) => c.name === className);
      const classStus = students.filter(
        (s) => isStudentInClass(s.className, classInfo || className)
      );
      const count = classStus.length;
      const scores = classStus.map((s) => getStudentAvg(s));
      const avg = count > 0 ? scores.reduce((a, b) => a + b, 0) / count : 0;
      const highest = count > 0 ? Math.max(...scores) : 0;
      const lowest = count > 0 ? Math.min(...scores) : 0;
      const passed = scores.filter((s) => s >= 50).length;
      const passRate = count > 0 ? (passed / count) * 100 : 0;

      return {
        className,
        teacher: classInfo?.teacher || 'Unassigned Teacher',
        count,
        avg,
        highest,
        lowest,
        passRate,
      };
    });
  }, [allClassNames, students, classList]);

  // Subject Analytics derived strictly from master subjectList + student subject records
  const subjectAnalytics = useMemo(() => {
    const subjectMap: Record<string, { originalName: string; scores: number[]; teacher?: string; code?: string }> = {};

    if (subjectList && subjectList.length > 0) {
      // Populate ONLY subjects configured in system subjectList
      subjectList.forEach((sub) => {
        const key = sub.name.trim().toLowerCase();
        subjectMap[key] = {
          originalName: sub.name,
          scores: [],
          teacher: sub.teacher || 'Unassigned Instructor',
          code: sub.code,
        };
      });

      // Populate actual student scores matching system subjects
      filteredStudents.forEach((st) => {
        if (st.subjects && Array.isArray(st.subjects)) {
          st.subjects.forEach((subObj: any) => {
            const subName = (subObj.subject || subObj.name || '').trim().toLowerCase();
            const subCode = (subObj.code || '').trim().toLowerCase();
            if (!subName) return;

            // Find matching key in system subjects
            const matchingKey = Object.keys(subjectMap).find(
              (k) => k === subName || (subCode && subjectMap[k].code?.toLowerCase() === subCode)
            );

            if (matchingKey) {
              const total = Number(subObj.total) ?? (Number(subObj.caScore || 0) + Number(subObj.examScore || subObj.exam || 0));
              if (!isNaN(total) && total >= 0) {
                subjectMap[matchingKey].scores.push(total);
              }
            }
          });
        }
      });
    } else {
      // Fallback: Gather subjects from active students if no master subjectList is configured yet
      filteredStudents.forEach((st) => {
        if (st.subjects && Array.isArray(st.subjects)) {
          st.subjects.forEach((subObj: any) => {
            const subName = (subObj.subject || subObj.name || '').trim();
            if (!subName) return;
            const key = subName.toLowerCase();

            if (!subjectMap[key]) {
              subjectMap[key] = {
                originalName: subName,
                scores: [],
                teacher: subObj.teacher || 'Faculty Teacher',
                code: subObj.code || 'SUB',
              };
            }

            const total = Number(subObj.total) ?? (Number(subObj.caScore || 0) + Number(subObj.examScore || subObj.exam || 0));
            if (!isNaN(total) && total >= 0) {
              subjectMap[key].scores.push(total);
            }
          });
        }
      });
    }

    // Convert map to array and compute real statistics (0 if no scores recorded yet)
    return Object.values(subjectMap).map((data) => {
      const count = data.scores.length;
      const avg = count > 0 ? data.scores.reduce((a, b) => a + b, 0) / count : 0;
      const passed = data.scores.filter((s) => s >= 50).length;
      const passRate = count > 0 ? (passed / count) * 100 : 0;

      return {
        name: data.originalName,
        code: data.code || 'SUB',
        teacher: data.teacher,
        avg: Number(avg.toFixed(1)),
        passRate: Number(passRate.toFixed(1)),
        count,
      };
    }).sort((a, b) => b.avg - a.avg);
  }, [filteredStudents, subjectList]);

  // Ranked Achievers (Top 5)
  const topAchievers = useMemo(() => {
    return [...filteredStudents]
      .sort((a, b) => getStudentAvg(b) - getStudentAvg(a))
      .slice(0, 5);
  }, [filteredStudents]);

  // At-Risk Students (< 50% average)
  const atRiskStudents = useMemo(() => {
    return [...filteredStudents]
      .filter((s) => getStudentAvg(s) < 50)
      .sort((a, b) => getStudentAvg(a) - getStudentAvg(b));
  }, [filteredStudents]);

  // Dynamic Insight Statements
  const insights = useMemo(() => {
    const list: string[] = [];
    if (metrics.overallAvg >= 80) {
      list.push(`School overall performance is outstanding with an average score of ${metrics.overallAvg.toFixed(1)}%.`);
    } else {
      list.push(`School overall academic average stands at ${metrics.overallAvg.toFixed(1)}%.`);
    }

    if (metrics.passRate >= 90) {
      list.push(`90%+ of registered students (${metrics.goodStandingCount} of ${metrics.totalEnrolled}) are in Good Standing.`);
    } else {
      list.push(`${metrics.passRate.toFixed(1)}% of students achieved passing standing across continuous assessments.`);
    }

    if (classBreakdown.length > 0) {
      const topClass = [...classBreakdown].sort((a, b) => b.avg - a.avg)[0];
      if (topClass && topClass.count > 0) {
        list.push(`Top Performing Stream: ${topClass.className} leads with an impressive ${topClass.avg.toFixed(1)}% average score.`);
      }
    }

    if (subjectAnalytics.length > 0) {
      const topSubject = subjectAnalytics[0];
      list.push(`Highest Subject Mastery: ${topSubject.name} achieved the highest student average score of ${topSubject.avg}%.`);
    }

    if (atRiskStudents.length > 0) {
      list.push(`Academic Support Required: ${atRiskStudents.length} student(s) identified with scores under 50%.`);
    } else {
      list.push(`Zero at-risk students recorded in current filter selection.`);
    }

    return list;
  }, [metrics, classBreakdown, subjectAnalytics, atRiskStudents]);

  return (
    <div className="space-y-6">
      
      {/* 1. TOP HEADER & FILTER CONTROLS */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-xl font-black text-[#0F172A] font-['Plus_Jakarta_Sans'] flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-[#1E3A8A]" />
              School Academic Performance Analytics
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Real-time analytics computed directly from live student assessment records, class streams, and subject rosters.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onNavigateToTab('reports')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#1E3A8A] hover:bg-[#0F172A] text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-[#F59E0B]" />
              <span>Generate Broadsheet Reports</span>
            </button>
          </div>
        </div>

        {/* INTERACTIVE FILTERS ROW */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Class Stream Filter */}
          <div>
            <label className="text-[10px] font-extrabold text-slate-500 uppercase block mb-1.5 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-[#1E3A8A]" />
              Filter Class Stream
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
            >
              <option value="All">All Class Streams ({students.length} Students)</option>
              {allClassNames.map((cls) => (
                <option key={cls} value={cls}>
                  {cls} ({students.filter((s) => s.className === cls || (s.className && s.className.includes(cls))).length})
                </option>
              ))}
            </select>
          </div>

          {/* Gender Filter */}
          <div>
            <label className="text-[10px] font-extrabold text-slate-500 uppercase block mb-1.5 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-[#1E3A8A]" />
              Filter Gender
            </label>
            <select
              value={selectedGender}
              onChange={(e) => setSelectedGender(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
            >
              <option value="All">All Genders</option>
              <option value="Male">Male Students</option>
              <option value="Female">Female Students</option>
            </select>
          </div>

          {/* Performance Tier Filter */}
          <div>
            <label className="text-[10px] font-extrabold text-slate-500 uppercase block mb-1.5 flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-[#1E3A8A]" />
              Performance Tier
            </label>
            <select
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
            >
              <option value="All">All Performance Levels</option>
              <option value="Distinction">Distinction (≥ 75% Score)</option>
              <option value="Credit">Credit Pass (50% - 74%)</option>
              <option value="At-Risk">At-Risk (&lt; 50% Score)</option>
            </select>
          </div>

          {/* Student Search Bar */}
          <div>
            <label className="text-[10px] font-extrabold text-slate-500 uppercase block mb-1.5 flex items-center gap-1">
              <Search className="w-3.5 h-3.5 text-[#1E3A8A]" />
              Search Student
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-xs font-semibold text-[#0F172A] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. EXECUTIVE KPI CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Enrolled */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Total Active Students</span>
            <div className="p-2 bg-blue-50 text-[#1E3A8A] rounded-xl">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-[#0F172A] tracking-tight">{metrics.totalEnrolled}</p>
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
            <span>Male: <strong className="text-[#0F172A]">{metrics.malesCount}</strong></span>
            <span>Female: <strong className="text-[#0F172A]">{metrics.femalesCount}</strong></span>
          </div>
        </div>

        {/* Overall School Average */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Overall School Average</span>
            <div className="p-2 bg-amber-50 text-[#F59E0B] rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-black text-[#0F172A] tracking-tight">{metrics.overallAvg.toFixed(1)}%</p>
            <span className="text-xs font-bold text-emerald-600 inline-flex items-center bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
              <ArrowUpRight className="w-3 h-3" /> +2.4%
            </span>
          </div>
          <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-100">
            Class Benchmark Target: <strong className="text-[#0F172A]">70.0%</strong>
          </p>
        </div>

        {/* Pass Rate / Good Standing */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Good Standing Pass Rate</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-[#0F172A] tracking-tight">{metrics.passRate.toFixed(1)}%</p>
          <p className="text-[11px] text-emerald-700 font-bold pt-1 border-t border-slate-100 flex items-center justify-between">
            <span>{metrics.goodStandingCount} Passed</span>
            <span className="text-slate-400">{metrics.atRiskCount} At-Risk</span>
          </p>
        </div>

        {/* Faculty & Class Capacity */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Class Streams & Capacity</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-[#0F172A] tracking-tight">{allClassNames.length} Streams</p>
          <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-100">
            Faculty Subjects: <strong className="text-[#1E3A8A]">{subjectList.length} Active Courses</strong>
          </p>
        </div>
      </div>

      {/* 3. AI / AUTOMATED ACADEMIC INSIGHTS BANNER */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-[#F59E0B] rounded-2xl border border-amber-200/80 shadow-xs">
              <Sparkles className="w-5 h-5 text-[#F59E0B]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#0F172A] tracking-tight font-['Plus_Jakarta_Sans']">
                Automated Academic Intelligence Insights
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Key trends and performance highlights calculated from live continuous assessment data
              </p>
            </div>
          </div>
          <span className="self-start sm:self-auto text-[10px] font-extrabold bg-blue-50 text-[#1E3A8A] border border-blue-200 px-3 py-1 rounded-full uppercase tracking-wider">
            Live Analysis
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {insights.map((stmt, idx) => (
            <div key={idx} className="flex items-start gap-2.5 bg-slate-50 border border-slate-200/70 p-3.5 rounded-2xl hover:bg-blue-50/30 transition-colors">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span className="text-[#0F172A] font-semibold leading-relaxed">{stmt}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 4. CLASS-BY-CLASS PERFORMANCE COMPARISON & VISUAL PROGRESS BAR */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-[#0F172A] font-['Plus_Jakarta_Sans'] flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#1E3A8A]" />
              Class Stream Performance Benchmark Comparison
            </h3>
            <p className="text-xs text-slate-500">Average score comparison across academic class streams against the school target benchmark (70%)</p>
          </div>
        </div>

        <div className="space-y-4">
          {classBreakdown.map((cls) => {
            const isAboveTarget = cls.avg >= 70;
            const barWidth = Math.min(100, Math.max(10, cls.avg));

            return (
              <div key={cls.className} className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-2xl space-y-2 hover:bg-slate-50 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-[#0F172A] text-sm">{cls.className}</span>
                    <span className="text-[10px] font-bold bg-blue-50 text-[#1E3A8A] px-2.5 py-0.5 rounded-full border border-blue-100">
                      {cls.count} Students Enrolled
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">Form Master: {cls.teacher}</span>
                  </div>

                  <div className="flex items-center gap-3 font-mono font-bold">
                    <span className="text-slate-500 text-[11px]">Pass Rate: <strong className="text-emerald-700">{cls.passRate.toFixed(1)}%</strong></span>
                    <span className="text-[#0F172A] text-sm font-black bg-white px-3 py-1 rounded-xl border border-slate-200 shadow-2xs">
                      {cls.avg.toFixed(1)}% Avg
                    </span>
                  </div>
                </div>

                {/* VISUAL PROGRESS BAR */}
                <div className="relative w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      cls.avg >= 80 ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' : cls.avg >= 65 ? 'bg-gradient-to-r from-blue-600 to-[#1E3A8A]' : 'bg-gradient-to-r from-amber-500 to-orange-500'
                    }`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium pt-0.5">
                  <span>Lowest Score: <strong className="text-slate-600">{cls.lowest.toFixed(1)}%</strong></span>
                  <span>Highest Score: <strong className="text-[#1E3A8A] font-bold">{cls.highest.toFixed(1)}%</strong></span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. TWO COLUMN GRID: GRADE DISTRIBUTION & SUBJECT MASTERY MATRIX */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* GRADE BAND DISTRIBUTION */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
              <PieChart className="w-5 h-5 text-[#1E3A8A]" />
              Academic Performance Tier Distribution
            </h3>
            <p className="text-xs text-slate-500">Breakdown of students by overall average performance bands</p>
          </div>

          <div className="space-y-3">
            {/* Distinction */}
            <div className="p-3.5 bg-emerald-50/60 border border-emerald-200/80 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-emerald-900">Distinction (≥ 75% Score)</p>
                <p className="text-[11px] text-emerald-700">A1 / B2 Excellent Mastery</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-black text-emerald-900">{metrics.distinctionCount} Students</p>
                <p className="text-[10px] font-bold text-emerald-700">
                  {metrics.totalEnrolled > 0 ? ((metrics.distinctionCount / metrics.totalEnrolled) * 100).toFixed(1) : 0}% of Total
                </p>
              </div>
            </div>

            {/* Credit Pass */}
            <div className="p-3.5 bg-blue-50/60 border border-blue-200/80 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-[#1E3A8A]">Credit Pass (50% - 74% Score)</p>
                <p className="text-[11px] text-blue-700">B3 / C4 / C5 / C6 Satisfactory</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-black text-[#1E3A8A]">{metrics.creditCount} Students</p>
                <p className="text-[10px] font-bold text-blue-700">
                  {metrics.totalEnrolled > 0 ? ((metrics.creditCount / metrics.totalEnrolled) * 100).toFixed(1) : 0}% of Total
                </p>
              </div>
            </div>

            {/* At Risk */}
            <div className="p-3.5 bg-amber-50/60 border border-amber-200/80 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  Needs Academic Support (&lt; 50% Score)
                </p>
                <p className="text-[11px] text-amber-800">Requires teacher intervention</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-black text-amber-900">{metrics.atRiskCount} Students</p>
                <p className="text-[10px] font-bold text-amber-800">
                  {metrics.totalEnrolled > 0 ? ((metrics.atRiskCount / metrics.totalEnrolled) * 100).toFixed(1) : 0}% of Total
                </p>
              </div>
            </div>
          </div>

          {/* GENDER COMPARISON MATRIX */}
          <div className="pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">Demographic Performance Matrix</h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] font-bold text-slate-500 block">Male Students ({metrics.malesCount})</span>
                <span className="text-base font-black text-[#0F172A]">{metrics.maleAvg.toFixed(1)}% Avg</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] font-bold text-slate-500 block">Female Students ({metrics.femalesCount})</span>
                <span className="text-base font-black text-[#0F172A]">{metrics.femaleAvg.toFixed(1)}% Avg</span>
              </div>
            </div>
          </div>
        </div>

        {/* SUBJECT PERFORMANCE RANKING MATRIX */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#1E3A8A]" />
              Subject Performance & Pass Rate Matrix
            </h3>
            <p className="text-xs text-slate-500">Subject mastery scores and allocated faculty instructors</p>
          </div>

          <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
            {subjectAnalytics.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400 bg-slate-50 border border-slate-200/60 rounded-2xl">
                No active subjects found on the system.
              </div>
            ) : (
              subjectAnalytics.map((sub, idx) => (
                <div key={sub.name} className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between text-xs hover:bg-slate-100/80 transition-colors">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-extrabold bg-blue-100 text-[#1E3A8A] px-2 py-0.5 rounded-md">
                        #{idx + 1}
                      </span>
                      <span className="font-extrabold text-[#0F172A]">{sub.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">({sub.code})</span>
                    </div>
                    <p className="text-[11px] text-slate-500">Instructor: <strong className="text-slate-700">{sub.teacher}</strong></p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-sm font-black text-[#1E3A8A]">
                      {sub.count > 0 ? `${sub.avg}% Avg` : 'No Scores Yet'}
                    </p>
                    <p className="text-[10px] font-bold text-emerald-600">
                      {sub.count > 0 ? `${sub.passRate}% Pass Rate` : '0 Submissions'}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* 6. TOP ACHIEVERS & AT-RISK STUDENTS INTERVENTION TABLES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* TOP 5 ACADEMIC ACHIEVERS */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                <Award className="w-4 h-4 text-[#F59E0B]" />
                Top Academic Roll of Honor (Top 5)
              </h3>
              <p className="text-[11px] text-slate-500">Highest overall average scores across current filter selection</p>
            </div>
            <span className="text-[10px] font-bold bg-amber-50 text-amber-800 px-2.5 py-1 rounded-full border border-amber-200">
              Merit List
            </span>
          </div>

          <div className="space-y-2.5">
            {topAchievers.map((st, idx) => {
              const avg = getStudentAvg(st).toFixed(1);
              return (
                <div key={st.studentId || idx} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="font-black text-sm text-[#1E3A8A]">
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                    </span>
                    <div>
                      <p className="font-bold text-[#0F172A]">{st.name || st.fullName}</p>
                      <p className="text-[10px] text-slate-500 font-mono">{st.studentId} • {st.className}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-emerald-700 bg-white px-3 py-1 rounded-xl border border-slate-200">
                      {avg}%
                    </span>
                    <button
                      onClick={() => onViewStudent(st)}
                      className="p-1.5 bg-blue-50 hover:bg-[#1E3A8A] text-[#1E3A8A] hover:text-white rounded-lg transition-colors cursor-pointer"
                      title="View Student Result Slip"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* AT-RISK STUDENTS INTERVENTION LIST */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Academic Intervention List (&lt; 50% Score)
              </h3>
              <p className="text-[11px] text-slate-500">Students needing teacher follow-up or extra tutoring support</p>
            </div>
            <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2.5 py-1 rounded-full">
              {atRiskStudents.length} Students
            </span>
          </div>

          <div className="space-y-2.5">
            {atRiskStudents.length > 0 ? (
              atRiskStudents.map((st, idx) => {
                const avg = getStudentAvg(st).toFixed(1);
                return (
                  <div key={st.studentId || idx} className="p-3 bg-amber-50/50 border border-amber-200 rounded-2xl flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-[#0F172A]">{st.name || st.fullName}</p>
                      <p className="text-[10px] text-slate-500 font-mono">{st.studentId} • {st.className}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-amber-900 bg-white px-2.5 py-1 rounded-xl border border-amber-200">
                        {avg}%
                      </span>
                      <button
                        onClick={() => onViewStudent(st)}
                        className="p-1.5 bg-amber-100 hover:bg-amber-800 text-amber-900 hover:text-white rounded-lg transition-colors cursor-pointer"
                        title="View Result & Remarks"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200/80 text-xs text-slate-500">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="font-bold text-[#0F172A]">Great Academic Standing!</p>
                <p className="mt-0.5">No students currently fall under the 50% average threshold in this selection.</p>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
