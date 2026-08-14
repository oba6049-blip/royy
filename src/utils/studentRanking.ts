import { StudentResult } from '../types';

export interface DynamicRankResult {
  position: number;
  totalInClass: number;
  ordinalPosition: string;
  calculatedAverage: number;
}

/**
 * Robust helper to determine if a student is enrolled in a specific class or stream.
 */
export function isStudentInClass(
  studentClassName?: string | null,
  classTarget?: string | { name: string; arm?: string } | null
): boolean {
  if (!studentClassName || !classTarget) return false;

  const targetName = typeof classTarget === 'string' ? classTarget : (classTarget.name || '');
  const targetArm = typeof classTarget === 'string' ? '' : (classTarget.arm || '');

  const rawStudent = String(studentClassName).trim();
  const rawTarget = String(targetName).trim();

  // 1. Direct match (case-insensitive)
  if (rawStudent.toLowerCase() === rawTarget.toLowerCase()) {
    return true;
  }

  // 2. Direct match with combined name + arm (e.g. "JSS 1" + "Gold" -> "JSS 1 Gold")
  if (targetArm) {
    const combined = `${rawTarget} ${targetArm}`.trim();
    if (rawStudent.toLowerCase() === combined.toLowerCase()) {
      return true;
    }
  }

  // 3. Normalized string match
  const normalize = (str: string) =>
    str
      .toLowerCase()
      .replace(/senior secondary school\s*/g, 'sss ')
      .replace(/junior secondary school\s*/g, 'jss ')
      .replace(/[^a-z0-9]/g, '');

  const normStudent = normalize(rawStudent);
  const normTarget = normalize(rawTarget);
  const normCombined = targetArm ? normalize(`${rawTarget}${targetArm}`) : '';

  if (normStudent === normTarget || (normCombined && normStudent === normCombined)) {
    return true;
  }

  // 4. Check level prefix separation: e.g. "jss1" vs "jss2", "sss1" vs "sss2"
  const extractLevel = (norm: string) => {
    const match = norm.match(/(jss|sss)[123]/);
    return match ? match[0] : null;
  };

  const studentLevel = extractLevel(normStudent);
  const targetLevel = extractLevel(normTarget) || (normCombined ? extractLevel(normCombined) : null);

  // If different academic levels (e.g. JSS 1 vs JSS 2), they CANNOT match!
  if (studentLevel && targetLevel && studentLevel !== targetLevel) {
    return false;
  }

  // 5. If same level, ensure arm/stream match
  const extractArm = (norm: string, level: string | null) => {
    if (!level) return '';
    return norm.replace(level, '');
  };

  const studentArm = extractArm(normStudent, studentLevel);
  const targetArmNorm = targetArm ? normalize(targetArm) : extractArm(normTarget, targetLevel);

  if (studentLevel && targetLevel && studentLevel === targetLevel) {
    if (studentArm && targetArmNorm) {
      return studentArm === targetArmNorm;
    }
    if (!studentArm && !targetArmNorm) {
      return true;
    }
  }

  return false;
}

/**
 * Helper to determine if two class names represent the exact same class/stream
 */
export const isSameClass = (classA: string, classB: string): boolean => {
  return isStudentInClass(classA, classB);
};

/**
 * Calculates a student's class position dynamically relative to all students in the same class.
 * Ensures that the student with the highest average score gets 1st position (e.g., Adeyemi Faridah),
 * and other students get their exact position relative to all peers in the class.
 */
export function calculateDynamicStudentPosition(
  currentStudent: StudentResult | null | undefined,
  customAllStudentsList?: any[]
): DynamicRankResult {
  if (!currentStudent) {
    return {
      position: 1,
      totalInClass: 35,
      ordinalPosition: '1st',
      calculatedAverage: 0,
    };
  }

  // 1. Calculate current student's actual average score
  const rawSubjects = Array.isArray(currentStudent.subjects) ? currentStudent.subjects : [];
  const studentSubjects = rawSubjects.filter((sub: any) => {
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

  let calculatedAverage = 0;

  if (studentSubjects.length > 0) {
    const totalScore = studentSubjects.reduce((acc, s) => acc + (Number(s.total) || 0), 0);
    calculatedAverage = Number((totalScore / studentSubjects.length).toFixed(1));
  } else {
    calculatedAverage = 0;
  }

  // 2. Build a full list of all available students in the school
  const poolOfStudentsMap = new Map<string, any>();

  if (customAllStudentsList && Array.isArray(customAllStudentsList) && customAllStudentsList.length > 0) {
    customAllStudentsList.forEach(s => {
      if (s && s.studentId) {
        poolOfStudentsMap.set(s.studentId.toUpperCase(), { ...s });
      }
    });
  }

  // Ensure current student is present with updated calculated average
  const currentKey = currentStudent.studentId ? currentStudent.studentId.toUpperCase() : 'CURRENT';
  const existingCurrent = poolOfStudentsMap.get(currentKey) || {};
  poolOfStudentsMap.set(currentKey, {
    ...existingCurrent,
    ...currentStudent,
    studentId: currentStudent.studentId,
    className: currentStudent.className,
    overallAverage: calculatedAverage,
    averageScore: calculatedAverage,
    subjects: studentSubjects,
  });

  const allPool = Array.from(poolOfStudentsMap.values());

  // 3. Filter pool for students in the same class / stream
  const currentClassRaw = (currentStudent.className || '').trim();
  const classPeers = allPool.filter(st => {
    if (!st) return false;
    const stClassRaw = (st.className || st.class || '').trim();
    return isSameClass(currentClassRaw, stClassRaw);
  });

  // 4. Calculate computed average score for each peer using ONLY valid scored subjects
  const classPeersWithScores = classPeers.map(st => {
    if (st.studentId && st.studentId.toUpperCase() === currentKey) {
      return {
        studentId: st.studentId,
        name: st.fullName || st.name,
        averageScore: calculatedAverage,
      };
    }

    let avg = 0;
    const rawSubs = Array.isArray(st.subjects) ? st.subjects : [];
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

    if (validSubs.length > 0) {
      const tot = validSubs.reduce((acc: number, sub: any) => acc + (Number(sub.total) || 0), 0);
      avg = Number((tot / validSubs.length).toFixed(1));
    } else {
      avg = Number(st.overallAverage || st.averageScore || 0);
    }

    return {
      studentId: st.studentId,
      name: st.fullName || st.name,
      averageScore: avg,
    };
  });

  // 5. Sort class peers by average score descending (highest score = 1st rank)
  classPeersWithScores.sort((a, b) => b.averageScore - a.averageScore);

  // 6. Find rank index of current student
  const rankIdx = classPeersWithScores.findIndex(
    s => s.studentId && s.studentId.toUpperCase() === currentKey
  );

  if (studentSubjects.length === 0 || calculatedAverage === 0) {
    return {
      position: 0,
      totalInClass: Math.max(customAllStudentsList?.length || 0, currentStudent.totalInClass || 35),
      ordinalPosition: 'N/A',
      calculatedAverage: 0,
    };
  }

  const numPos = typeof currentStudent.position === 'number' 
    ? currentStudent.position 
    : (parseInt(String(currentStudent.position || 1), 10) || 1);
  const derivedPosition: number = rankIdx !== -1 ? rankIdx + 1 : numPos;
  const totalInClass = Math.max(classPeersWithScores.length, currentStudent.totalInClass || 35);

  const formatOrdinal = (num: number) => {
    const j = num % 10;
    const k = num % 100;
    if (j === 1 && k !== 11) return `${num}st`;
    if (j === 2 && k !== 12) return `${num}nd`;
    if (j === 3 && k !== 13) return `${num}rd`;
    return `${num}th`;
  };

  return {
    position: derivedPosition,
    totalInClass,
    ordinalPosition: formatOrdinal(derivedPosition),
    calculatedAverage,
  };
}
