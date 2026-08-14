/**
 * Utility functions for Student Date of Birth and Automated Age Calculation
 */

export interface CalculatedAgeResult {
  years: number;
  ageText: string; // e.g. "15 Yrs"
  fullAgeText: string; // e.g. "15 Years Old"
}

/**
 * Calculates exact student age in years from a given Date of Birth string or Date object.
 */
export function calculateAgeFromDob(dob: string | Date | undefined | null): CalculatedAgeResult | null {
  if (!dob) return null;

  let birthDate: Date;

  if (dob instanceof Date) {
    birthDate = dob;
  } else {
    const cleanStr = String(dob).trim();
    if (!cleanStr) return null;

    // Check if format is YYYY-MM-DD or YYYY/MM/DD
    const yyyymmddMatch = cleanStr.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
    if (yyyymmddMatch) {
      const year = parseInt(yyyymmddMatch[1], 10);
      const month = parseInt(yyyymmddMatch[2], 10) - 1;
      const day = parseInt(yyyymmddMatch[3], 10);
      birthDate = new Date(year, month, day);
    } else {
      // Check if format is DD/MM/YYYY or DD-MM-YYYY
      const ddmmyyyyMatch = cleanStr.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
      if (ddmmyyyyMatch) {
        const day = parseInt(ddmmyyyyMatch[1], 10);
        const month = parseInt(ddmmyyyyMatch[2], 10) - 1;
        const year = parseInt(ddmmyyyyMatch[3], 10);
        birthDate = new Date(year, month, day);
      } else {
        const parsed = new Date(cleanStr);
        if (!isNaN(parsed.getTime())) {
          birthDate = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
        } else {
          return null;
        }
      }
    }
  }

  if (isNaN(birthDate.getTime())) {
    return null;
  }

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  if (age < 0) {
    age = 0;
  }

  return {
    years: age,
    ageText: `${age} Yrs`,
    fullAgeText: `${age} ${age === 1 ? 'Year' : 'Years'} Old`,
  };
}

/**
 * Normalizes any date string into standard "YYYY-MM-DD" format for HTML5 <input type="date">
 */
export function formatDateForInput(dateString?: string | null): string {
  if (!dateString) return '';
  const str = String(dateString).trim();
  if (!str) return '';

  // Already in YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }

  // DD/MM/YYYY or DD-MM-YYYY
  const ddmmyyyy = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (ddmmyyyy) {
    const day = ddmmyyyy[1].padStart(2, '0');
    const month = ddmmyyyy[2].padStart(2, '0');
    const year = ddmmyyyy[3];
    return `${year}-${month}-${day}`;
  }

  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  return '';
}

/**
 * Formats a Date of Birth into clean human readable format e.g. "14 May 2011"
 */
export function formatDateDisplay(dateString?: string | null): string {
  if (!dateString) return '—';
  const str = String(dateString).trim();
  if (!str) return '—';

  const inputDate = formatDateForInput(str);
  if (inputDate) {
    const [y, m, d] = inputDate.split('-');
    const dateObj = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
    if (!isNaN(dateObj.getTime())) {
      return dateObj.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    }
  }

  return str;
}
