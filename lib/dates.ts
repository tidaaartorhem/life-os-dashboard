import {
  addDays,
  endOfDay,
  endOfWeek,
  format,
  isSameDay,
  isToday,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";

export {
  addDays,
  endOfDay,
  format,
  isSameDay,
  isToday,
  startOfDay,
  startOfMonth,
  startOfWeek,
};

export function dayBounds(date: Date): { start: Date; end: Date } {
  return { start: startOfDay(date), end: endOfDay(date) };
}

export function weekRange(date: Date = new Date()): { start: Date; end: Date } {
  return {
    start: startOfWeek(date, { weekStartsOn: 1 }),
    end: endOfDay(startOfWeek(addDays(date, 6), { weekStartsOn: 1 })),
  };
}

export function lastNDays(n: number, end: Date = new Date()): Date[] {
  const days: Date[] = [];
  for (let i = n - 1; i >= 0; i--) days.push(startOfDay(addDays(end, -i)));
  return days;
}

/** 6 x 7 grid of dates for a month view (weeks start Monday). */
export function monthGrid(year: number, month: number): Date[][] {
  const gridStart = startOfWeek(startOfMonth(new Date(year, month)), {
    weekStartsOn: 1,
  });
  const weeks: Date[][] = [];
  let cursor = gridStart;
  for (let w = 0; w < 6; w++) {
    const week: Date[] = [];
    for (let d = 0; d < 7; d++) {
      week.push(cursor);
      cursor = addDays(cursor, 1);
    }
    weeks.push(week);
  }
  return weeks;
}

/** Start (Monday) and end of the week containing `date`, for week view columns. */
export function weekColumns(date: Date): Date[] {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export const fmtDate = (d: Date | string | number): string =>
  format(new Date(d), "MMM d, yyyy");
export const fmtDateShort = (d: Date | string | number): string =>
  format(new Date(d), "MMM d");
export const fmtTime = (d: Date | string | number): string =>
  format(new Date(d), "h:mm a");
export const fmtDayLabel = (d: Date | string | number): string =>
  format(new Date(d), "EEE, MMM d");
export const toISODate = (d: Date | string | number): string =>
  format(new Date(d), "yyyy-MM-dd");
export const fmtMonthYear = (d: Date | string | number): string =>
  format(new Date(d), "MMMM yyyy");

/** For <input type="date"> / <input type="datetime-local"> values. */
export const toDateInputValue = (d: Date | string | number): string =>
  format(new Date(d), "yyyy-MM-dd");
export const toDateTimeInputValue = (d: Date | string | number): string =>
  format(new Date(d), "yyyy-MM-dd'T'HH:mm");

export function isOverdue(dueDate: Date | string | number | null | undefined): boolean {
  if (!dueDate) return false;
  return new Date(dueDate) < startOfDay(new Date());
}

export function endOfWeekSunday(date: Date = new Date()): Date {
  return endOfWeek(date, { weekStartsOn: 1 });
}
