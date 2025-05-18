
import { format, startOfWeek, endOfWeek, eachDayOfInterval, parseISO, isSameDay, subDays, getDay } from 'date-fns';

export const DATE_FORMAT = 'yyyy-MM-dd';

export function getCurrentDateFormatted(): string {
  return format(new Date(), DATE_FORMAT);
}

export function getWeekRange(date: Date = new Date()): { start: Date; end: Date } {
  const start = startOfWeek(date, { weekStartsOn: 1 }); // Monday
  const end = endOfWeek(date, { weekStartsOn: 1 }); // Sunday
  return { start, end };
}

export function getDaysInWeek(date: Date = new Date()): Date[] {
  const { start, end } = getWeekRange(date);
  return eachDayOfInterval({ start, end });
}

export function getFormattedDaysInWeek(date: Date = new Date()): string[] {
    const { start, end } = getWeekRange(date);
    return eachDayOfInterval({ start, end }).map(day => format(day, DATE_FORMAT));
}


export function parseDate(dateString: string): Date {
  // Ensure correct parsing for YYYY-MM-DD by treating it as UTC to avoid timezone shifts
  // then get the local date parts.
  if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
     const [year, month, day] = dateString.split('-').map(Number);
     return new Date(year, month - 1, day);
  }
  return parseISO(dateString); // Fallback for other ISO formats
}


export function isSameDate(date1: Date | string, date2: Date | string): boolean {
  const d1 = typeof date1 === 'string' ? parseDate(date1) : date1;
  const d2 = typeof date2 === 'string' ? parseDate(date2) : date2;
  return isSameDay(d1, d2);
}

// Get the last N days including today, formatted as strings
export function getLastNDaysFormatted(n: number): string[] {
  const today = new Date();
  return Array.from({ length: n }, (_, i) => format(subDays(today, i), DATE_FORMAT)).reverse();
}


export function getDayName(date: Date | string, length: 'short' | 'long' = 'short'): string {
  const d = typeof date === 'string' ? parseDate(date) : date;
  if (length === 'short') {
    return format(d, 'E'); // Mon, Tue, etc.
  }
  return format(d, 'EEEE'); // Monday, Tuesday, etc.
}

// Ensure Monday is 0, Sunday is 6 for consistency with typical week starts
export function getDayOfWeek(date: Date): number {
    // date-fns getDay: Sunday is 0, Saturday is 6
    // We want Monday to be 0
    const day = getDay(date);
    return day === 0 ? 6 : day - 1;
}
