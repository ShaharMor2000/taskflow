import { useMemo, useState } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { BarChart3, Flame, Gauge, Timer, TrendingDown, TrendingUp, Trophy } from 'lucide-react';
import { useData } from '../store/DataContext';
import { useUI } from '../store/UIContext';
import {
  averageCompletionHours,
  completionStreak,
  completionsByWeekday,
  dailySeries,
  formatDuration,
  getOverview,
  tasksByPriority,
  tasksByProject,
  tasksByStatus,
  weekComparison,
  weeklySeries,
} from '../lib/stats';
import { cn, percent } from '../lib/utils';
import { PageHeader } from '../components/layout/PageHeader';
import { StatCard } from '../components/ui/StatCard';
import { Segmented } from '../components/ui/Controls';
import { ProgressBar } from '../components/ui/Progress';
import { EmptyState } from '../components/ui/EmptyState';
import { CardHeader, ChartTooltip, axisProps, chartTheme } from '../components/ui/ChartKit';

export function AnalyticsPage() {
  const { tasks, projects, settings } = useData();
  const { now, isDark, openTaskForm } = useUI();
  const theme = chartTheme(isDark);
  const [range, setRange] = useState<'14' | '30'>('14');

  const stats = useMemo(() => {
    const overview = getOverview(tasks, now, settings.dailyGoal);
    return {
      overview,
      week: weekComparison(tasks, now, settings.weekStartsOn),
      streak: completionStreak(tasks, now),
      avgHours: averageCompletionHours(tasks),
      weekly: weeklySeries(tasks, now, 8, settings.weekStartsOn),
      priority: tasksByPriority(tasks),
      byProject: tasksByProject(tasks, projects, now),
      status: tasksByStatus(tasks),
      weekday: completionsByWeekday(tasks, settings.weekStartsOn),
    };
  }, [tasks, projects, now, settings.dailyGoal, settings.weekStartsOn]);

  const daily = useMemo(() => dailySeries(tasks, now, Number(range)), [tasks, now, range]);
  const dailyTotal = daily.reduce((s, d) => s + d.completed, 0);
  const bestDay = stats.weekday.reduce((best, d) => (d.completed > best.completed ? d : best), stats.weekday[0]);

  if (tasks.length === 0) {
    return (
      <>
        <PageHeader title="Analytics" description="Insights calculated from your tasks." />
        <div className="card">
          <EmptyState
            icon={BarChart3}
            title="No data to analyze yet"
            description="Create and complete a few tasks — your productivity insights will appear here."
            action={
              <button className="btn-primary" onClick={() => openTaskForm()}>
                Create a task
              </button>
            }
          />
        </div>
      </>
    );
  }

  const { week } = stats;
  const trendUp = week.change >= 0;

  return (
    <>
      <PageHeader title="Analytics" description="Every number here is calculated live from your tasks." />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard
          index={0}
          label="Completed this week"
          value={week.thisWeek}
          icon={Trophy}
          tone="violet"
          hint={
            <span className={cn('inline-flex items-center gap-1 font-medium', trendUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400')}>
              {trendUp ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
              {trendUp ? '+' : ''}
              {week.change}% vs last week ({week.lastWeek})
            </span>
          }
        />
        <StatCard index={1} label="Completion rate" value={`${stats.overview.completionRate}%`} icon={Gauge} tone="emerald" hint={`${stats.overview.completed} of ${stats.overview.total} tasks`} />
        <StatCard
          index={2}
          label="Current streak"
          value={`${stats.streak} ${stats.streak === 1 ? 'day' : 'days'}`}
          icon={Flame}
          tone="amber"
          hint="Consecutive days with a completion"
        />
        <StatCard
          index={3}
          label="Avg. time to complete"
          value={stats.avgHours === null ? '—' : formatDuration(stats.avgHours)}
          icon={Timer}
          tone="sky"
          hint="From creation to completion"
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <section className="card p-5 sm:p-6 xl:col-span-2">
          <CardHeader
            title="Daily productivity"
            subtitle={`${dailyTotal} tasks completed in the last ${range} days`}
            action={
              <Segmented
                size="sm"
                label="Date range"
                value={range}
                onChange={setRange}
                options={[
                  { value: '14', label: '14 days' },
                  { value: '30', label: '30 days' },
                ]}
              />
            }
          />
          <div className="h-64" role="img" aria-label={`Area chart of tasks completed per day over the last ${range} days`}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={daily} margin={{ left: 0, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="dailyFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={theme.primary} stopOpacity={0.28} />
                    <stop offset="100%" stopColor={theme.primary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke={theme.grid} />
                <XAxis dataKey="label" {...axisProps(isDark)} interval="preserveStartEnd" minTickGap={24} />
                <YAxis allowDecimals={false} width={28} {...axisProps(isDark)} />
                <Tooltip cursor={{ stroke: theme.axis, strokeDasharray: '3 3' }} content={<ChartTooltip labelKey="fullLabel" />} />
                <Area
                  type="monotone"
                  dataKey="completed"
                  name="Completed"
                  stroke={theme.primary}
                  strokeWidth={2}
                  fill="url(#dailyFill)"
                  activeDot={{ r: 5, strokeWidth: 2, stroke: theme.surface }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="card p-5 sm:p-6">
          <CardHeader title="Tasks by priority" subtitle={`${stats.overview.total} tasks total`} />
          <div className="relative mx-auto h-44 w-44" role="img" aria-label={`Donut chart: ${stats.priority.map((p) => `${p.label} ${p.total}`).join(', ')}`}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.priority.filter((p) => p.total > 0)}
                  dataKey="total"
                  nameKey="label"
                  innerRadius="68%"
                  outerRadius="100%"
                  paddingAngle={2}
                  stroke={theme.surface}
                  strokeWidth={2}
                  cornerRadius={4}
                >
                  {stats.priority
                    .filter((p) => p.total > 0)
                    .map((p) => (
                      <Cell key={p.priority} fill={p.color} />
                    ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
              <div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.overview.total - stats.overview.completed}</div>
                <div className="text-[11px] text-slate-500">open</div>
              </div>
            </div>
          </div>
          <table className="mt-5 w-full text-[13px]">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-slate-400">
                <th className="pb-2 font-semibold">Priority</th>
                <th className="pb-2 text-right font-semibold">Open</th>
                <th className="pb-2 text-right font-semibold">Done</th>
                <th className="pb-2 text-right font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {stats.priority.map((p) => (
                <tr key={p.priority} className="border-t border-slate-100 dark:border-white/[0.05]">
                  <td className="py-2">
                    <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                      <span className="h-2.5 w-2.5 rounded-[3px]" style={{ backgroundColor: p.color }} />
                      {p.label}
                    </span>
                  </td>
                  <td className="py-2 text-right tabular-nums text-slate-600 dark:text-slate-400">{p.open}</td>
                  <td className="py-2 text-right tabular-nums text-slate-600 dark:text-slate-400">{p.completed}</td>
                  <td className="py-2 text-right font-semibold tabular-nums text-slate-900 dark:text-white">{p.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="card p-5 sm:p-6 xl:col-span-2">
          <CardHeader title="Weekly productivity" subtitle="Tasks completed per week, last 8 weeks" />
          <div className="h-60" role="img" aria-label={`Bar chart of tasks completed per week: ${stats.weekly.map((w) => `${w.label} ${w.completed}`).join(', ')}`}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.weekly} barCategoryGap="30%">
                <CartesianGrid vertical={false} stroke={theme.grid} />
                <XAxis dataKey="label" {...axisProps(isDark)} />
                <YAxis allowDecimals={false} width={28} {...axisProps(isDark)} />
                <Tooltip cursor={{ fill: theme.cursor, radius: 8 }} content={<ChartTooltip />} />
                <Bar dataKey="completed" name="Completed" radius={[4, 4, 0, 0]} maxBarSize={36}>
                  {stats.weekly.map((w, i) => (
                    <Cell key={w.label} fill={theme.primary} fillOpacity={i === stats.weekly.length - 1 ? 1 : 0.55} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="card p-5 sm:p-6">
          <CardHeader title="Status breakdown" subtitle="Where your tasks are right now" />
          <div className="flex h-3 w-full gap-0.5 overflow-hidden rounded-full" role="img" aria-label={stats.status.map((s) => `${s.label}: ${s.value}`).join(', ')}>
            {stats.status.map((s) =>
              s.value > 0 ? <div key={s.status} style={{ width: `${percent(s.value, stats.overview.total)}%`, backgroundColor: s.color }} /> : null,
            )}
          </div>
          <ul className="mt-5 space-y-3">
            {stats.status.map((s) => (
              <li key={s.status} className="flex items-center gap-3 text-[13px]">
                <span className="h-2.5 w-2.5 rounded-[3px]" style={{ backgroundColor: s.color }} />
                <span className="flex-1 text-slate-700 dark:text-slate-300">{s.label}</span>
                <span className="font-semibold tabular-nums text-slate-900 dark:text-white">{s.value}</span>
                <span className="w-10 text-right text-xs tabular-nums text-slate-400">{percent(s.value, stats.overview.total)}%</span>
              </li>
            ))}
          </ul>
          <div className="mt-6 border-t border-slate-100 pt-5 dark:border-white/[0.06]">
            <h3 className="mb-3 text-[13px] font-semibold text-slate-900 dark:text-white">Completions by weekday</h3>
            <div className="h-32" role="img" aria-label={`Completions by weekday. Most productive: ${bestDay?.label}`}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.weekday} barCategoryGap="25%">
                  <XAxis dataKey="label" {...axisProps(isDark)} tick={{ fill: theme.axis, fontSize: 11 }} />
                  <Tooltip cursor={{ fill: theme.cursor, radius: 6 }} content={<ChartTooltip />} />
                  <Bar dataKey="completed" name="Completed" radius={[4, 4, 0, 0]}>
                    {stats.weekday.map((d) => (
                      <Cell key={d.label} fill={theme.primary} fillOpacity={d === bestDay && d.completed > 0 ? 1 : 0.45} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            {bestDay && bestDay.completed > 0 && (
              <p className="mt-2 text-xs text-slate-500">
                Most productive day: <span className="font-semibold text-slate-800 dark:text-slate-200">{bestDay.label}</span>
              </p>
            )}
          </div>
        </section>

        <section className="card p-5 sm:p-6 xl:col-span-3">
          <CardHeader title="Tasks by project" subtitle="Completion rate per project" />
          {stats.byProject.length === 0 ? (
            <p className="text-sm text-slate-500">No projects yet.</p>
          ) : (
            <ul className="grid gap-x-10 gap-y-5 md:grid-cols-2">
              {stats.byProject.map((p) => (
                <li key={p.id}>
                  <div className="mb-2 flex items-center justify-between gap-3 text-[13px]">
                    <span className="flex min-w-0 items-center gap-2 font-medium text-slate-800 dark:text-slate-200">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-[4px]" style={{ backgroundColor: p.color }} />
                      <span className="truncate">{p.name}</span>
                    </span>
                    <span className="shrink-0 text-xs text-slate-500">
                      {p.completed}/{p.total} done
                      {p.overdue > 0 && <span className="ml-2 text-rose-600 dark:text-rose-400">{p.overdue} overdue</span>}
                      <span className="ml-2 font-semibold text-slate-900 dark:text-white">{p.progress}%</span>
                    </span>
                  </div>
                  <ProgressBar value={p.progress} color={p.color} label={`${p.name} completion`} className="h-2" />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
