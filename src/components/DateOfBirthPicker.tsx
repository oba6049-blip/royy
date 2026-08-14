import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Check, X, Sparkles } from 'lucide-react';
import { calculateAgeFromDob, formatDateForInput, formatDateDisplay } from '../utils/studentDateUtils';

interface DateOfBirthPickerProps {
  id?: string;
  value: string; // Accepts 'YYYY-MM-DD', 'DD/MM/YYYY', or standard ISO string
  onChange: (formattedDateIso: string, computedAgeText: string) => void;
  required?: boolean;
  disabled?: boolean;
  label?: string;
  placeholder?: string;
  className?: string;
  maxYear?: number;
  minYear?: number;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS_OF_WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export const DateOfBirthPicker: React.FC<DateOfBirthPickerProps> = ({
  id = 'student-dob-picker',
  value,
  onChange,
  required = false,
  disabled = false,
  label,
  placeholder = 'Select Date of Birth (e.g. 20 April 1995)',
  className = '',
  maxYear = new Date().getFullYear(),
  minYear = 1950,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Normalize initial value
  const normalizedValue = useMemo(() => formatDateForInput(value), [value]);

  // Internal view state for month & year navigation
  const initialDate = useMemo(() => {
    if (normalizedValue) {
      const [y, m, d] = normalizedValue.split('-').map(Number);
      return { year: y, month: m - 1, day: d };
    }
    // Default view year: 15 years ago or 2010
    const defaultYear = Math.max(minYear, new Date().getFullYear() - 14);
    return { year: defaultYear, month: 0, day: 1 };
  }, [normalizedValue, minYear]);

  const [viewYear, setViewYear] = useState<number>(initialDate.year);
  const [viewMonth, setViewMonth] = useState<number>(initialDate.month);

  // Synchronize view state when value changes from outside
  useEffect(() => {
    if (normalizedValue) {
      const [y, m] = normalizedValue.split('-').map(Number);
      setViewYear(y);
      setViewMonth(m - 1);
    }
  }, [normalizedValue]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Compute available years list from maxYear down to minYear
  const yearsList = useMemo(() => {
    const years: number[] = [];
    for (let y = maxYear; y >= minYear; y--) {
      years.push(y);
    }
    return years;
  }, [maxYear, minYear]);

  // Compute days in the current viewMonth & viewYear
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();
    const totalDaysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate();

    const days: Array<{
      dayNumber: number;
      isCurrentMonth: boolean;
      year: number;
      month: number;
      dateString: string;
    }> = [];

    // Previous month filler days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const prevDay = prevMonthDays - i;
      const prevMonth = viewMonth === 0 ? 11 : viewMonth - 1;
      const prevYear = viewMonth === 0 ? viewYear - 1 : viewYear;
      const mStr = String(prevMonth + 1).padStart(2, '0');
      const dStr = String(prevDay).padStart(2, '0');
      days.push({
        dayNumber: prevDay,
        isCurrentMonth: false,
        year: prevYear,
        month: prevMonth,
        dateString: `${prevYear}-${mStr}-${dStr}`,
      });
    }

    // Current month days
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const mStr = String(viewMonth + 1).padStart(2, '0');
      const dStr = String(d).padStart(2, '0');
      days.push({
        dayNumber: d,
        isCurrentMonth: true,
        year: viewYear,
        month: viewMonth,
        dateString: `${viewYear}-${mStr}-${dStr}`,
      });
    }

    // Next month filler days to complete grid (up to 42 cells)
    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      const nextMonth = viewMonth === 11 ? 0 : viewMonth + 1;
      const nextYear = viewMonth === 11 ? viewYear + 1 : viewYear;
      const mStr = String(nextMonth + 1).padStart(2, '0');
      const dStr = String(d).padStart(2, '0');
      days.push({
        dayNumber: d,
        isCurrentMonth: false,
        year: nextYear,
        month: nextMonth,
        dateString: `${nextYear}-${mStr}-${dStr}`,
      });
    }

    return days;
  }, [viewYear, viewMonth]);

  // Selected date info & age
  const selectedAgeInfo = useMemo(() => {
    if (!normalizedValue) return null;
    return calculateAgeFromDob(normalizedValue);
  }, [normalizedValue]);

  // Handler when selecting a day
  const handleSelectDate = (dateIso: string) => {
    const ageResult = calculateAgeFromDob(dateIso);
    const ageText = ageResult ? ageResult.ageText : '';
    onChange(dateIso, ageText);
    setIsOpen(false);
  };

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      if (viewYear > minYear) {
        setViewYear(viewYear - 1);
        setViewMonth(11);
      }
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      if (viewYear < maxYear) {
        setViewYear(viewYear + 1);
        setViewMonth(0);
      }
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const handlePrevDecade = () => {
    setViewYear(Math.max(minYear, viewYear - 10));
  };

  const handleNextDecade = () => {
    setViewYear(Math.min(maxYear, viewYear + 10));
  };

  // Preset age buttons helper (e.g. 11, 13, 15, 17, 30 years ago)
  const handleSelectAgePreset = (targetYearsOld: number) => {
    const now = new Date();
    const targetYear = now.getFullYear() - targetYearsOld;
    const targetMonth = 3; // April (0-indexed = 3)
    const targetDay = 20; // 20th
    const mStr = String(targetMonth + 1).padStart(2, '0');
    const dStr = String(targetDay).padStart(2, '0');
    const dateIso = `${targetYear}-${mStr}-${dStr}`;
    setViewYear(targetYear);
    setViewMonth(targetMonth);
    handleSelectDate(dateIso);
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {label && (
        <label htmlFor={id} className="text-[10px] font-bold text-slate-500 uppercase block mb-1 flex items-center justify-between">
          <span>{label}</span>
          {selectedAgeInfo && (
            <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
              {selectedAgeInfo.ageText} ({selectedAgeInfo.years} yrs old)
            </span>
          )}
        </label>
      )}

      {/* Main input container with calendar trigger */}
      <div className="relative flex items-center">
        <input
          id={id}
          type="text"
          readOnly
          required={required}
          disabled={disabled}
          placeholder={placeholder}
          value={normalizedValue ? `${formatDateDisplay(normalizedValue)} (${normalizedValue})` : ''}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={`w-full bg-slate-50 border ${
            isOpen ? 'border-[#1E3A8A] ring-2 ring-[#1E3A8A]/20' : 'border-slate-200'
          } rounded-xl py-2.5 pl-3 pr-10 text-xs font-semibold text-[#0F172A] cursor-pointer hover:bg-slate-100/70 focus:outline-none transition-all placeholder:text-slate-400`}
        />

        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          title="Open interactive calendar picker"
          className="absolute right-2 p-1.5 text-slate-400 hover:text-[#1E3A8A] hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
        >
          <CalendarIcon className="w-4 h-4 text-[#1E3A8A]" />
        </button>
      </div>

      {/* Popover Calendar Modal / Dropdown */}
      {isOpen && (
        <div
          id={`${id}-calendar-popup`}
          className="absolute left-0 top-full mt-2 z-50 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 w-[340px] sm:w-[360px] animate-in fade-in zoom-in-95 duration-150 text-slate-900"
        >
          {/* Header Controls: Month & Year Selectors with Quick Jump */}
          <div className="space-y-3 pb-3 border-b border-slate-100">
            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handlePrevDecade}
                  title="Previous 10 Years"
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  title="Previous Month"
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>

              {/* Month Dropdown */}
              <div className="flex items-center gap-1.5 flex-1 justify-center">
                <select
                  value={viewMonth}
                  onChange={(e) => setViewMonth(Number(e.target.value))}
                  className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-[#0F172A] rounded-lg px-2 py-1 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#1E3A8A]"
                >
                  {MONTHS.map((monthName, idx) => (
                    <option key={monthName} value={idx}>
                      {monthName}
                    </option>
                  ))}
                </select>

                {/* Year Dropdown */}
                <select
                  value={viewYear}
                  onChange={(e) => setViewYear(Number(e.target.value))}
                  className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-black text-[#1E3A8A] rounded-lg px-2 py-1 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#1E3A8A] font-mono"
                >
                  {yearsList.map((yr) => (
                    <option key={yr} value={yr}>
                      {yr}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleNextMonth}
                  title="Next Month"
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNextDecade}
                  title="Next 10 Years"
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Presets for fast selection */}
            <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
              <span className="font-semibold flex items-center gap-1 text-slate-600">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>Quick Example:</span>
              </span>
              <div className="flex items-center gap-1 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    setViewYear(1995);
                    setViewMonth(3); // April
                    handleSelectDate('1995-04-20');
                  }}
                  className="px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-[#1E3A8A] font-bold rounded-md border border-blue-200 transition-colors cursor-pointer text-[10px]"
                >
                  20 Apr 1995
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectAgePreset(12)}
                  className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded transition-colors cursor-pointer text-[10px]"
                >
                  12 Yrs
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectAgePreset(15)}
                  className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded transition-colors cursor-pointer text-[10px]"
                >
                  15 Yrs
                </button>
              </div>
            </div>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 py-2 text-center text-[10px] font-bold text-slate-400 uppercase">
            {DAYS_OF_WEEK.map((dw) => (
              <div key={dw}>{dw}</div>
            ))}
          </div>

          {/* Day Grid */}
          <div className="grid grid-cols-7 gap-1 text-xs">
            {calendarDays.map((cd, index) => {
              const isSelected = normalizedValue === cd.dateString;
              const isToday =
                new Date().toISOString().split('T')[0] === cd.dateString;

              return (
                <button
                  key={`${cd.dateString}-${index}`}
                  type="button"
                  onClick={() => handleSelectDate(cd.dateString)}
                  className={`h-8 w-8 mx-auto flex items-center justify-center rounded-xl font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#1E3A8A] text-white shadow-md shadow-blue-900/20 scale-105 ring-2 ring-blue-300'
                      : cd.isCurrentMonth
                      ? 'text-slate-800 hover:bg-blue-50 hover:text-[#1E3A8A]'
                      : 'text-slate-300 hover:bg-slate-50 hover:text-slate-600'
                  } ${isToday && !isSelected ? 'border border-blue-400 font-black text-[#1E3A8A]' : ''}`}
                >
                  {cd.dayNumber}
                </button>
              );
            })}
          </div>

          {/* Selected Date Summary & Computed Age Footer */}
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <div className="space-y-0.5">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Selected Date & Age</p>
              {normalizedValue ? (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold text-[#0F172A]">{formatDateDisplay(normalizedValue)}</span>
                  {selectedAgeInfo && (
                    <span className="font-black text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded text-[10px]">
                      {selectedAgeInfo.ageText} ({selectedAgeInfo.fullAgeText})
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-slate-400 italic text-[11px]">No date chosen yet</span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {normalizedValue && (
                <button
                  type="button"
                  onClick={() => {
                    onChange('', '');
                  }}
                  className="px-2 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                >
                  Clear
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-3 py-1 text-xs font-bold text-white bg-[#1E3A8A] hover:bg-blue-900 rounded-xl transition-colors cursor-pointer shadow-xs flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Done</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
