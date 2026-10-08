import type { Priority, Project, Task } from '../types';
import { addDays, formatShortDate, isSameDay, startOfDay, startOfWeek, toISODate } from './date';
import { PRIORITIES, PRIORITY_META, STATUSES, STATUS_META, isDueOn, isOverdue } from './tasks';
import { percent } from './utils';

const completedOn = (t: Task, day: Date) => t.completedAt !== null && isSameDay(new Date(t.completedAt), day);
const createdOn = (t: Task, day: Date) => isSameDay(new Date(t.createdAt), day);

export interface Overview {
  total: number;
  completed: number;
  inProgress: number;
  todo: number;
  overdue: number;
  completionRate: number;
  /** Tasks relevant to today: due today, or completed today. */
  todayTotal: number;
  todayDone: number;
  /** Share of today's tasks that are done. */
  productivity: number;
  completedToday: number;
  /** Progress toward the user's daily completion goal. */
  goalProgress: number;
}

export function getOverview(tasks: Task[], now: Date, dailyGoal: number): Overview {
  const completed = tasks.filter((t) => t.status === 'done').length;
  const todays = tasks.filter((t) => isDueOn(t, now) || completedOn(t, now));
  const todayDone = todays.filter((t) => t.status === 'done').length;
  const completedToday = tasks.filter((t) => completedOn(t, now)).length;
  return {
    total: tasks.length,
    completed,
    inProgress: tasks.filter((t) => t.status === 'in_progress').length,
    todo: tasks.filter((t) => t.status === 'todo').length,
    overdue: tasks.filter((t) => isOverdue(t, now)).length,
    completionRate: percent(completed, tasks.length),
    todayTotal: todays.length,
    todayDone,
    productivity: percent(todayDone, todays.length),
    completedToday,
    goalProgress: Math.min(100, percent(completedToday, Math.max(1, dailyGoal))),
  };
}

export interface DayPoint {
  date: string;
  label: string;
  fullLabel: string;
  completed: number;
  created: number;
}

export function dailySeries(tasks: Task[], now: Date, days: number): DayPoint[] {
  const start = addDays(startOfDay(now), -(days - 1));
  return Array.from({ length: days }, (_, i) => {
    const day = addDays(start, i);
    return {
      date: toISODate(day),
      label: days <= 7 ? day.toLocaleDateString(undefined, { weekday: 'short' }) : formatShortDate(day, now),
      fullLabel: day.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' }),
      completed: tasks.filter((t) => completedOn(t, day)).length,
      created: tasks.filter((t) => createdOn(t, day)).length,
    };
  });
}

export interface WeekPoint {
  label: string;
  completed: number;
  created: number;
  rate: number;
}

export function weeklySeries(tasks: Task[], now: Date, weeks: number, weekStartsOn: 0 | 1): WeekPoint[] {
  const thisWeek = startOfWeek(now, weekStartsOn);
  return Array.from({ length: weeks }, (_, i) => {
    const start = addDays(thisWeek, -7 * (weeks - 1 - i));
    const end = addDays(start, 7);
    const inRange = (iso: string | null) => iso !== null && new Date(iso) >= start && new Date(iso) < end;
    const completed = tasks.filter((t) => inRange(t.completedAt)).length;
    const created = tasks.filter((t) => inRange(t.createdAt)).length;
    return {
      label: i === weeks - 1 ? 'This week' : formatShortDate(start, now),
      completed,
      created,
      rate: Math.min(100, percent(completed, Math.max(created, completed))),
    };
  });
}

export function weekComparison(tasks: Task[], now: Date, weekStartsOn: 0 | 1) {
  const [lastWeek, thisWeek] = weeklySeries(tasks, now, 2, weekStartsOn);
  const change =
    lastWeek.completed === 0
      ? thisWeek.completed > 0
        ? 100
        : 0
      : Math.round(((thisWeek.completed - lastWeek.completed) / lastWeek.completed) * 100);
  return { thisWeek: thisWeek.completed, lastWeek: lastWeek.completed, change };
}

export interface PrioritySlice {
  priority: Priority;
  label: string;
  color: string;
  total: number;
  open: number;
  completed: number;
}

export function tasksByPriority(tasks: Task[]): PrioritySlice[] {
  return PRIORITIES.map((p) => {
    const list = tasks.filter((t) => t.priority === p);
    const completed = list.filter((t) => t.status === 'done').length;
    return {
      priority: p,
      label: PRIORITY_META[p].label,
      color: PRIORITY_META[p].color,
      total: list.length,
      completed,
      open: list.length - completed,
    };
  });
}

export function tasksByStatus(tasks: Task[]) {
  return STATUSES.map((s) => ({
    status: s,
    label: STATUS_META[s].label,
    color: STATUS_META[s].color,
    value: tasks.filter((t) => t.status === s).length,
  }));
}

export interface ProjectStats {
  total: number;
  completed: number;
  inProgress: number;
  todo: number;
  overdue: number;
  progress: number;
}

export function projectStats(projectId: string | null, tasks: Task[], now: Date): ProjectStats {
  const list = tasks.filter((t) => t.projectId === projectId);
  const completed = list.filter((t) => t.status === 'done').length;
  return {
    total: list.length,
    completed,
    inProgress: list.filter((t) => t.status === 'in_progress').length,
    todo: list.filter((t) => t.status === 'todo').length,
    overdue: list.filter((t) => isOverdue(t, now)).length,
    progress: percent(completed, list.length),
  };
}

export function tasksByProject(tasks: Task[], projects: Project[], now: Date) {
  const rows = projects.map((p) => ({ id: p.id, name: p.name, color: p.color, ...projectStats(p.id, tasks, now) }));
  const unassigned = projectStats(null, tasks, now);
  if (unassigned.total > 0) rows.push({ id: 'none', name: 'No project', color: '#94a3b8', ...unassigned });
  return rows;
}

/** Consecutive days with at least one completion, ending today (or yesterday if nothing is done yet today). */
export function completionStreak(tasks: Task[], now: Date): number {
  const days = new Set(tasks.filter((t) => t.completedAt).map((t) => toISODate(new Date(t.completedAt!))));
  let cursor = startOfDay(now);
  if (!days.has(toISODate(cursor))) cursor = addDays(cursor, -1);
  let streak = 0;
  while (days.has(toISODate(cursor))) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export function averageCompletionHours(tasks: Task[]): number | null {
  const durations = tasks
    .filter((t) => t.completedAt)
    .map((t) => new Date(t.completedAt!).getTime() - new Date(t.createdAt).getTime())
    .filter((ms) => ms >= 0);
  if (durations.length === 0) return null;
  return durations.reduce((a, b) => a + b, 0) / durations.length / 3_600_000;
}

export function completionsByWeekday(tasks: Task[], weekStartsOn: 0 | 1) {
  const counts = Array(7).fill(0) as number[];
  tasks.forEach((t) => {
    if (t.completedAt) counts[new Date(t.completedAt).getDay()]++;
  });
  const sunday = new Date(2023, 0, 1);
  return Array.from({ length: 7 }, (_, i) => {
    const dow = (i + weekStartsOn) % 7;
    return { label: addDays(sunday, dow).toLocaleDateString(undefined, { weekday: 'short' }), completed: counts[dow] };
  });
}

export function formatDuration(hours: number): string {
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))}m`;
  if (hours < 48) return `${Math.round(hours)}h`;
  return `${(hours / 24).toFixed(1)}d`;
}
