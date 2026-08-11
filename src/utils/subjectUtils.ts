/**
 * Shared utility to filter student subjects so that ONLY subjects created/registered
 * by the Admin (and with a valid score recorded for the student) are displayed.
 */
export function filterStudentSubjectsByAdmin(
  rawStudentSubjects: any[] | undefined | null,
  adminSubjectsList?: Array<{ name?: string; code?: string; subject?: string }> | null
): any[] {
  if (!Array.isArray(rawStudentSubjects)) return [];

  // Build normalized set of admin subject names if adminSubjectsList is non-empty
  const adminSubjectNames = new Set(
    (adminSubjectsList || [])
      .map(s => (s.name || (s as any).subject || '').trim().toLowerCase())
      .filter(Boolean)
  );

  return rawStudentSubjects.filter((sub: any) => {
    if (!sub || typeof sub !== 'object') return false;
    const subjectName = (sub.subject || sub.name || '').trim();
    if (!subjectName) return false;

    // Must be created/registered by the Admin if admin subjects list exists
    if (adminSubjectNames.size > 0) {
      if (!adminSubjectNames.has(subjectName.toLowerCase())) {
        return false;
      }
    }

    // Must have a registered score or valid grade/remark
    const ca = Number(sub.caScore ?? sub.ca ?? 0);
    const exam = Number(sub.examScore ?? sub.exam ?? 0);
    const total = Number(sub.total ?? 0);
    const grade = (sub.grade || '').trim().toUpperCase();
    const remark = (sub.remark || '').trim().toUpperCase();

    const hasRegisteredScore = ca > 0 || exam > 0 || total > 0;
    const hasValidGrade = grade !== '' && grade !== 'PENDING' && grade !== 'UNRECORDED' && grade !== '—' && grade !== '-';
    const hasValidRemark = remark !== '' && remark !== 'PENDING' && remark !== 'UNRECORDED';

    return hasRegisteredScore || (hasValidGrade && hasValidRemark);
  });
}
