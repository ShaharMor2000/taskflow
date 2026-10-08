import { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import {
  Activity as ActivityIcon,
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  CircleCheckBig,
  Clock3,
  FolderPlus,
  ListTodo,
  Pencil,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
  Zap,
} from 'lucide-react';
import type { ActivityType } from '../types';
import { useData } from '../store/DataContext';
import { useUI } from '../store/UIContext';
import { dailySeries, getOverview, projectStats } from '../lib/stats';
import { addDays, diffInDays, formatDueLabel, formatLongDate, greeting, parseISODate, relativeTime, toISODate } from '../lib/date';
import { PRIORITY_META, dueDateTime, isDueOn, isOverdue, sortTasks } from '../lib/tasks';
import { cn, percent } from '../lib/utils';
import { StatCard } from '../components/ui/StatCard';
import { ProgressBar, ProgressRing } from '../components/ui/Progress';
import { EmptyState } from '../components/ui/EmptyState';
import { CardHeader, ChartTooltip, Legend, axisProps, chartTheme } from '../components/ui/ChartKit';
import { TaskRow } from '../components/tasks/TaskRow';

const ACTIVITY_ICONS: Record<ActivityType, { icon: typeof Plus; className: string }> = {
  task_created: { icon: Plus, className: 'bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300' },
  task_updated: { icon: Pencil, className: 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300' },
  task_completed: { icon: CheckCircle2, className: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300' },
  task_reopened: { icon: RotateCcw, className: 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300' },
  task_moved: { icon: ArrowRight, className: 'bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300' },
  task_deleted: { icon: Trash2, className: 'bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300' },
  project_created: { icon: FolderPlus, className: 'bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300' },
  project_updated: { icon: Pencil, className: 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300' },
  project_deleted: { icon: Trash2, className: 'bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300' },
};

export function DashboardPage() {
  const { tasks, projects, activity, settings } = useData();
  const { now, isDark, navigate, openTaskForm, openTaskDetail, setFilters, resetFilters } = useUI();
  const theme = chartTheme(isDark);

  const overview = useMemo(() => getOverview(tasks, now, settings.dailyGoal), [tasks, now, settings.dailyGoal]);
  const week = useMemo(() => dailySeries(tasks, now, 7), [tasks, now]);
  const weekTotal = week.reduce((s, d) => s + d.completed, 0);

  const todays = useMemo(
    () =>
      sortTasks(
        tasks.filter((t) => isDueOn(t, now)),
        { key: 'dueDate', reversed: false },
      ).sort((a, b) => Number(a.status === 'done') - Number(b.status === 'done')),
    [tasks, now],
  );

  const upcoming = useMemo(() => {
    const horizon = addDays(now, 7);
    return sortTasks(
      tasks.filter((t) => {
        const due = dueDateTime(t);
        return t.status !== 'done' && due !== null && due > now && !isDueOn(t, now) && due <= horizon;
      }),
      { key: 'dueDate', reversed: false },
    ).slice(0, 5);
  }, [tasks, now]);

  const overdueList = useMemo(() => tasks.filter((t) => isOverdue(t, now)), [tasks, now]);

  const showTasksWith = (status: 'all' | 'done' | 'in_progress' | 'overdue') => {
    resetFilters();
    setFilters({ status });
    navigate({ name: 'tasks' });
  };

  return (
    <div className="space-y-6">
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-violet-600 to-indigo-600 p-6 text-white shadow-glow sm:p-8"
      >
        <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-24 right-40 h-56 w-56 rounded-full bg-fuchsia-400/20 blur-3xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-violet-100">{formatLongDate(now)}</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
              {greeting(now)}, {settings.userName}
            </h1>
            <p className="mt-2 max-w-lg text-sm text-violet-100">
              {overview.todayTotal === 0
                ? 'Nothing is due today. A great moment to plan ahead or tackle something new.'
                : `You have ${overview.todayTotal - overview.todayDone} of ${overview.todayTotal} tasks left for today${
                    overview.overdue ? ` and ${overview.overdue} overdue` : ''
                  }.`}
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => openTaskForm()} className="btn h-10 bg-white px-4 text-violet-700 shadow-sm hover:bg-violet-50">
              <Plus className="h-4 w-4" /> Quick add
            </button>
            <button onClick={() => navigate({ name: 'tasks' })} className="btn h-10 bg-white/15 px-4 text-white ring-1 ring-white/25 hover:bg-white/25">
              View tasks
            </button>
          </div>
        </div>
      </motion.section>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard index={0} label="Total tasks" value={overview.total} icon={ListTodo} tone="violet" hint={`${overview.todo} to do`} onClick={() => showTasksWith('all')} />
        <StatCard index={1} label="Completed" value={overview.completed} icon={CircleCheckBig} tone="emerald" hint={`${overview.completionRate}% completion rate`} onClick={() => showTasksWith('done')} />
        <StatCard index={2} label="In progress" value={overview.inProgress} icon={Clock3} tone="amber" hint="Actively being worked on" onClick={() => showTasksWith('in_progress')} />
        <StatCard
          index={3}
          label="Overdue"
          value={overview.overdue}
          icon={AlertTriangle}
          tone="rose"
          hint={overview.overdue ? 'Needs your attention' : 'Nothing overdue'}
          onClick={() => showTasksWith('overdue')}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <section className="card p-5 sm:p-6">
            <CardHeader
              title="Weekly completion"
              subtitle={`${weekTotal} tasks completed in the last 7 days`}
              action={<Legend items={[{ label: 'Completed', color: theme.primary }, { label: 'Created', color: theme.secondary }]} />}
            />
            <div className="h-60" role="img" aria-label={`Bar chart of tasks completed and created over the last 7 days. ${week.map((d) => `${d.label}: ${d.completed} completed`).join(', ')}`}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={week} barGap={2} barCategoryGap="28%">
                  <CartesianGrid vertical={false} stroke={theme.grid} />
                  <XAxis dataKey="label" {...axisProps(isDark)} />
                  <YAxis allowDecimals={false} width={28} {...axisProps(isDark)} />
                  <Tooltip cursor={{ fill: theme.cursor, radius: 8 }} content={<ChartTooltip labelKey="fullLabel" />} />
                  <Bar dataKey="completed" name="Completed" fill={theme.primary} radius={[4, 4, 0, 0]} maxBarSize={22} />
                  <Bar dataKey="created" name="Created" fill={theme.secondary} radius={[4, 4, 0, 0]} maxBarSize={22} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="card p-5 sm:p-6">
            <CardHeader
              title="Today's tasks"
              subtitle={overview.todayTotal ? `${overview.todayDone} of ${overview.todayTotal} done` : 'Tasks due today appear here'}
              action={
                <button className="btn-ghost btn-sm" onClick={() => openTaskForm({ defaults: { dueDate: toISODate(now) } })}>
                  <Plus className="h-4 w-4" /> Add
                </button>
              }
            />
            {todays.length === 0 ? (
              <EmptyState
                compact
                icon={Sparkles}
                title="Your day is clear"
                description="No tasks are due today. Add one or pull something forward from upcoming."
                action={
                  <button className="btn-primary btn-sm" onClick={() => openTaskForm({ defaults: { dueDate: toISODate(now) } })}>
                    <Plus className="h-4 w-4" /> Add task for today
                  </button>
                }
              />
            ) : (
              <div className="-mx-3 divide-y divide-slate-100 dark:divide-white/[0.05]">
                <AnimatePresence initial={false}>
                  {todays.map((t) => (
                    <TaskRow key={t.id} task={t} project={projects.find((p) => p.id === t.projectId)} />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section className="card p-5 sm:p-6">
            <CardHeader title="Daily productivity" subtitle="Share of today's tasks completed" />
            <div className="flex items-center gap-5">
              <ProgressRing value={overview.productivity} size={116} stroke={11} color={theme.primary} label="Daily productivity">
                <div>
                  <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{overview.productivity}%</div>
                  <div className="text-[11px] text-slate-500">today</div>
                </div>
              </ProgressRing>
              <div className="min-w-0 flex-1 space-y-3 text-sm">
                <div>
                  <div className="mb-1.5 flex justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">Daily goal</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {overview.completedToday}/{settings.dailyGoal}
                    </span>
                  </div>
                  <ProgressBar value={overview.goalProgress} color="#10b981" label="Daily goal" />
                </div>
                <div>
                  <div className="mb-1.5 flex justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">Overall completion</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{overview.completionRate}%</span>
                  </div>
                  <ProgressBar value={overview.completionRate} label="Overall completion" />
                </div>
              </div>
            </div>
          </section>

          <section className="card p-5 sm:p-6">
            <CardHeader
              title="Upcoming deadlines"
              subtitle="Next 7 days"
              action={
                <button className="btn-ghost btn-sm" onClick={() => navigate({ name: 'calendar' })}>
                  Calendar <ArrowRight className="h-3.5 w-3.5" />
                </button>
              }
            />
            {overdueList.length > 0 && (
              <button
                onClick={() => showTasksWith('overdue')}
                className="mb-3 flex w-full items-center gap-2 rounded-xl bg-rose-50 px-3 py-2 text-left text-[13px] font-medium text-rose-700 transition hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-500/15"
              >
                <AlertTriangle className="h-4 w-4" />
                {overdueList.length} overdue {overdueList.length === 1 ? 'task' : 'tasks'}
                <ArrowRight className="ml-auto h-3.5 w-3.5" />
              </button>
            )}
            {upcoming.length === 0 ? (
              <EmptyState compact icon={CalendarClock} title="No upcoming deadlines" description="Tasks due in the next week will show up here." />
            ) : (
              <ul className="space-y-1">
                {upcoming.map((t) => {
                  const project = projects.find((p) => p.id === t.projectId);
                  const days = diffInDays(parseISODate(t.dueDate!), now);
                  return (
                    <li key={t.id}>
                      <button
                        onClick={() => openTaskDetail(t.id)}
                        className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-slate-50 dark:hover:bg-white/[0.03]"
                      >
                        <span className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl bg-slate-50 ring-1 ring-slate-100 dark:bg-white/[0.04] dark:ring-white/[0.06]">
                          <span className="text-[10px] font-semibold uppercase text-slate-400">
                            {parseISODate(t.dueDate!).toLocaleDateString(undefined, { month: 'short' })}
                          </span>
                          <span className="text-sm font-bold leading-none text-slate-900 dark:text-white">{parseISODate(t.dueDate!).getDate()}</span>
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-slate-900 dark:text-slate-100">{t.title}</span>
                          <span className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: PRIORITY_META[t.priority].color }} />
                            {formatDueLabel(t.dueDate!, t.dueTime, now)}
                            {project && <span className="truncate">· {project.name}</span>}
                          </span>
                        </span>
                        <span className={cn('shrink-0 text-xs font-medium', days <= 1 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400')}>
                          {days === 1 ? '1 day' : `${days} days`}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {projects.length > 0 && (
            <section className="card p-5 sm:p-6">
              <CardHeader
                title="Project progress"
                action={
                  <button className="btn-ghost btn-sm" onClick={() => navigate({ name: 'projects' })}>
                    All <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                }
              />
              <ul className="space-y-4">
                {projects.slice(0, 4).map((p) => {
                  const s = projectStats(p.id, tasks, now);
                  return (
                    <li key={p.id}>
                      <button className="w-full text-left" onClick={() => navigate({ name: 'project', id: p.id })}>
                        <div className="mb-1.5 flex items-center justify-between gap-2 text-[13px]">
                          <span className="flex min-w-0 items-center gap-2 font-medium text-slate-800 dark:text-slate-200">
                            <span className="h-2.5 w-2.5 shrink-0 rounded-[4px]" style={{ backgroundColor: p.color }} />
                            <span className="truncate">{p.name}</span>
                          </span>
                          <span className="shrink-0 text-xs text-slate-500">
                            {s.completed}/{s.total} · <span className="font-semibold text-slate-900 dark:text-white">{s.progress}%</span>
                          </span>
                        </div>
                        <ProgressBar value={s.progress} color={p.color} label={`${p.name} progress`} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          <section className="card p-5 sm:p-6">
            <CardHeader title="Recent activity" />
            {activity.length === 0 ? (
              <EmptyState compact icon={ActivityIcon} title="No activity yet" description="Your changes will be tracked here." />
            ) : (
              <ol className="space-y-3">
                {activity.slice(0, 7).map((a) => {
                  const meta = ACTIVITY_ICONS[a.type] ?? ACTIVITY_ICONS.task_updated;
                  const clickable = a.taskId && tasks.some((t) => t.id === a.taskId);
                  return (
                    <li key={a.id} className="flex items-start gap-3">
                      <span className={cn('grid h-7 w-7 shrink-0 place-items-center rounded-lg', meta.className)}>
                        <meta.icon className="h-3.5 w-3.5" />
                      </span>
                      <div className="min-w-0 flex-1 pt-0.5">
                        {clickable ? (
                          <button onClick={() => openTaskDetail(a.taskId!)} className="block max-w-full truncate text-left text-[13px] text-slate-700 hover:text-violet-600 dark:text-slate-300 dark:hover:text-violet-300">
                            {a.message}
                          </button>
                        ) : (
                          <p className="truncate text-[13px] text-slate-700 dark:text-slate-300">{a.message}</p>
                        )}
                        <p className="text-[11px] text-slate-400">{relativeTime(a.at, now)}</p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>
        </div>
      </div>

      {overview.total > 0 && overview.completedToday >= settings.dailyGoal && (
        <p className="flex items-center justify-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
          <Zap className="h-4 w-4" /> Daily goal reached — {percent(overview.completedToday, settings.dailyGoal)}% of target.
        </p>
      )}
    </div>
  );
}
