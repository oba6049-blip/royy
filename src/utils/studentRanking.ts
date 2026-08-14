import { StudentResult } from '../types';

export interface DynamicRankResult {
  position: number;
  totalInClass: number;
  ordinalPosition: string;
  calculatedAverage: number;
}

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

  // 3. Helper to determine if two class names represent the same class/stream
  const isSameClass = (classA: string, classB: string): boolean => {
    if (!classA || !classB) return true;

    const rawA = classA.trim().toLowerCase();
    const rawB = classB.trim().toLowerCase();

    if (rawA === rawB) return true;

    const normA = rawA
      .replace(/senior secondary school\s*/g, 'sss ')
      .replace(/junior secondary school\s*/g, 'jss ')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const normB = rawB
      .replace(/senior secondary school\s*/g, 'sss ')
      .replace(/junior secondary school\s*/g, 'jss ')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (normA === normB) return true;

    // 1. Grade level check
    const levels = ['sss 3', 'sss 2', 'sss 1', 'jss 3', 'jss 2', 'jss 1'];
    let levelA = '';
    let levelB = '';

    for (const lvl of levels) {
      if (normA.includes(lvl)) levelA = lvl;
      if (normB.includes(lvl)) levelB = lvl;
    }

    if (levelA && levelB && levelA !== levelB) {
      return false;
    }

    // 2. Track / Stream check
    const tracks = ['science', 'arts', 'commercial', 'vocational'];
    let trackA = '';
    let trackB = '';

    for (const trk of tracks) {
      if (normA.includes(trk)) trackA = trk;
      if (normB.includes(trk)) trackB = trk;
    }

    if (trackA && trackB && trackA !== trackB) {
      return false;
    }

    // 3. Arm / Letter check (Arm A vs Arm B)
    const isArmA_A = /\b(a|arm a|science a|arts a)\b/.test(normA);
    const isArmB_A = /\b(b|arm b|science b|arts b)\b/.test(normA);

    const isArmA_B = /\b(a|arm a|science a|arts a)\b/.test(normB);
    const isArmB_B = /\b(b|arm b|science b|arts b)\b/.test(normB);

    if ((isArmA_A && isArmB_B) || (isArmB_A && isArmA_B)) {
      return false;
    }

    if ((isArmB_A && !isArmB_B) || (isArmB_B && !isArmB_A)) {
      return false;
    }

    if (levelA && levelB && levelA === levelB) {
      if (!trackA || !trackB || trackA === trackB) {
        return true;
      }
    }

    return normA.includes(normB) || normB.includes(normA);
  };

  // 4. Filter pool for students in the same class / stream
  const currentClassRaw = (currentStudent.className || '').trim();
  const classPeers = allPool.filter(st => {
    if (!st) return false;
    const stClassRaw = (st.className || st.class || '').trim();
    return isSameClass(currentClassRaw, stClassRaw);
  });

  // 5. Calculate computed average score for each peer using ONLY valid scored subjects
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

  // 6. Sort class peers by average score descending (highest score = 1st rank)
  classPeersWithScores.sort((a, b) => b.averageScore - a.averageScore);

  // 7. Find rank index of current student
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
