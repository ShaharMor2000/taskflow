import type { Recurrence, RecurrenceFrequency } from '../types';
import { addDays, parseISODate, startOfDay, toISODate } from './date';

export const RECURRENCE_OPTIONS: { value: RecurrenceFrequency; label: string; unit: string }[] = [
  { value: 'daily', label: 'Daily', unit: 'day' },
  { value: 'weekdays', label: 'Every weekday', unit: 'weekday' },
  { value: 'weekly', label: 'Weekly', unit: 'week' },
  { value: 'monthly', label: 'Monthly', unit: 'month' },
  { value: 'yearly', label: 'Yearly', unit: 'year' },
];

export const MAX_INTERVAL = 99;

export function isValidRecurrence(value: unknown): value is Recurrence {
  if (typeof value !== 'object' || value === null) return false;
  const r = value as Record<string, unknown>;
  return (
    RECURRENCE_OPTIONS.some((o) => o.value === r.frequency) &&
    Number.isInteger(r.interval) &&
    (r.interval as number) >= 1 &&
    (r.interval as number) <= MAX_INTERVAL
  );
}

export function describeRecurrence(rule: Recurrence): string {
  if (rule.frequency === 'weekdays') return 'Every weekday';
  const unit = RECURRENCE_OPTIONS.find((o) => o.value === rule.frequency)!.unit;
  if (rule.interval === 1) return rule.frequency === 'daily' ? 'Every day' : `Every ${unit}`;
  return `Every ${rule.interval} ${unit}s`;
}

/** Adds months while clamping the day, so Jan 31 + 1 month → Feb 28/29. */
function addMonthsClamped(d: Date, months: number): Date {
  const target = new Date(d.getFullYear(), d.getMonth() + months, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(d.getDate(), lastDay));
  return target;
}

function step(d: Date, rule: Recurrence): Date {
  switch (rule.frequency) {
    case 'daily':
      return addDays(d, rule.interval);
    case 'weekdays': {
      let next = addDays(d, 1);
      while (next.getDay() === 0 || next.getDay() === 6) next = addDays(next, 1);
      return next;
    }
    case 'weekly':
      return addDays(d, 7 * rule.interval);
    case 'monthly':
      return addMonthsClamped(d, rule.interval);
    case 'yearly':
      return addMonthsClamped(d, 12 * rule.interval);
  }
}

/**
 * The due date of the next occurrence. Steps forward from the current due date
 * (or today if none) until the result is after `today`, so completing a task
 * that is weeks overdue does not create a backlog of already-overdue copies.
 */
export function nextOccurrence(dueDate: string | null, rule: Recurrence, today = new Date()): string {
  const floor = startOfDay(today);
  let d = dueDate ? parseISODate(dueDate) : floor;
  for (let i = 0; i < 1000; i++) {
    d = step(d, rule);
    if (d > floor) break;
  }
  return toISODate(d);
}
