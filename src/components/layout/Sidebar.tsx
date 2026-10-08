import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  CalendarDays,
  Columns3,
  FolderKanban,
  LayoutDashboard,
  ListTodo,
  Plus,
  Search,
  Settings as SettingsIcon,
  type LucideIcon,
} from 'lucide-react';
import { useData } from '../../store/DataContext';
import { useUI, type Route } from '../../store/UIContext';
import { cn } from '../../lib/utils';
import { isSameDay } from '../../lib/date';
import { ProgressBar } from '../ui/Progress';

interface NavItem {
  name: Exclude<Route['name'], 'project'>;
  label: string;
  icon: LucideIcon;
  shortcut: string;
}

export const NAV_ITEMS: NavItem[] = [
  { name: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, shortcut: 'G D' },
  { name: 'tasks', label: 'My Tasks', icon: ListTodo, shortcut: 'G T' },
  { name: 'board', label: 'Board', icon: Columns3, shortcut: 'G B' },
  { name: 'calendar', label: 'Calendar', icon: CalendarDays, shortcut: 'G C' },
  { name: 'projects', label: 'Projects', icon: FolderKanban, shortcut: 'G P' },
  { name: 'analytics', label: 'Analytics', icon: BarChart3, shortcut: 'G A' },
];

export function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="grid h-8 w-8 place-items-center rounded-[10px] bg-violet-600 shadow-sm shadow-violet-600/30">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="white" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
      </div>
      <span className="text-[17px] font-bold tracking-tight text-slate-900 dark:text-white">TaskFlow</span>
    </div>
  );
}

export function SidebarContent({ variant = 'desktop' }: { variant?: 'desktop' | 'mobile' }) {
  const { tasks, projects, settings } = useData();
  const { route, navigate, now, openTaskForm, openProjectForm, setPaletteOpen } = useUI();
  const { openCount, openByProject, completedToday } = useMemo(() => {
    const byProject = new Map<string, number>();
    let open = 0;
    let doneToday = 0;
    for (const t of tasks) {
      if (t.status !== 'done') {
        open++;
        if (t.projectId) byProject.set(t.projectId, (byProject.get(t.projectId) ?? 0) + 1);
      } else if (t.completedAt && isSameDay(new Date(t.completedAt), now)) {
        doneToday++;
      }
    }
    return { openCount: open, openByProject: byProject, completedToday: doneToday };
  }, [tasks, now]);
  const goalProgress = Math.min(100, (completedToday / Math.max(1, settings.dailyGoal)) * 100);
  const initials = settings.userName
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const isActive = (name: string) => route.name === name || (name === 'projects' && route.name === 'project');

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center px-5">
        <button onClick={() => navigate({ name: 'dashboard' })} aria-label="TaskFlow home" className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50">
          <Logo />
        </button>
      </div>

      <div className="px-3 pb-2">
        <button onClick={() => openTaskForm()} className="btn-primary h-9 w-full justify-start">
          <Plus className="h-4 w-4" />
          New task
          <kbd className="ml-auto rounded-md bg-white/20 px-1.5 text-[11px] font-semibold">N</kbd>
        </button>
        <button
          onClick={() => setPaletteOpen(true)}
          className="mt-1.5 flex h-9 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/[0.04] dark:hover:text-slate-100"
        >
          <Search className="h-[18px] w-[18px]" />
          Search
          <span className="ml-auto flex gap-0.5">
            <kbd className="kbd">Ctrl</kbd>
            <kbd className="kbd">K</kbd>
          </span>
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-2" aria-label="Main navigation">
        <ul className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.name);
            return (
              <li key={item.name}>
                <button
                  onClick={() => navigate({ name: item.name })}
                  aria-current={active ? 'page' : undefined}
                  title={`${item.label} (${item.shortcut})`}
                  className={cn(
                    'relative flex h-9 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50',
                    active ? 'text-violet-700 dark:text-white' : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/[0.04] dark:hover:text-slate-100',
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId={`nav-active-${variant}`}
                      className="absolute inset-0 rounded-xl bg-violet-50 ring-1 ring-violet-100 dark:bg-violet-500/15 dark:ring-violet-400/20"
                      transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                    />
                  )}
                  <item.icon className="relative h-[18px] w-[18px]" />
                  <span className="relative">{item.label}</span>
                  {item.name === 'tasks' && openCount > 0 && (
                    <span className="relative ml-auto rounded-md bg-slate-100 px-1.5 text-[11px] font-semibold text-slate-600 dark:bg-white/10 dark:text-slate-300">
                      {openCount}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        <div className="mt-6">
          <div className="mb-1 flex items-center justify-between px-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Projects</span>
            <button onClick={() => openProjectForm()} className="btn-icon h-6 w-6 rounded-md" aria-label="Create project" title="New project">
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
          {projects.length === 0 ? (
            <button onClick={() => openProjectForm()} className="w-full rounded-xl px-3 py-2 text-left text-[13px] text-slate-400 hover:bg-slate-100/80 dark:hover:bg-white/[0.04]">
              Create your first project
            </button>
          ) : (
            <ul className="space-y-0.5">
              {projects.map((p) => {
                const active = route.name === 'project' && route.id === p.id;
                const open = openByProject.get(p.id) ?? 0;
                return (
                  <li key={p.id}>
                    <button
                      onClick={() => navigate({ name: 'project', id: p.id })}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'flex h-8 w-full items-center gap-3 rounded-xl px-3 text-[13px] font-medium transition-colors',
                        active
                          ? 'bg-slate-100 text-slate-900 dark:bg-white/[0.07] dark:text-white'
                          : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/[0.04] dark:hover:text-slate-100',
                      )}
                    >
                      <span className="h-2.5 w-2.5 shrink-0 rounded-[4px]" style={{ backgroundColor: p.color }} />
                      <span className="truncate">{p.name}</span>
                      {open > 0 && <span className="ml-auto text-[11px] text-slate-400">{open}</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </nav>

      <div className="space-y-3 border-t border-slate-200/70 p-3 dark:border-white/[0.06]">
        <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200/70 dark:bg-white/[0.03] dark:ring-white/[0.06]">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="font-medium text-slate-700 dark:text-slate-200">Daily goal</span>
            <span className="font-semibold text-violet-700 dark:text-violet-300">
              {completedToday}/{settings.dailyGoal}
            </span>
          </div>
          <ProgressBar value={goalProgress} label="Daily goal progress" />
        </div>
        <button
          onClick={() => navigate({ name: 'settings' })}
          aria-current={route.name === 'settings' ? 'page' : undefined}
          className={cn(
            'flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-slate-100/80 dark:hover:bg-white/[0.04]',
            route.name === 'settings' && 'bg-slate-100 dark:bg-white/[0.06]',
          )}
        >
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-violet-100 text-xs font-bold text-violet-700 dark:bg-violet-500/20 dark:text-violet-200">
            {initials || '?'}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-semibold text-slate-900 dark:text-slate-100">{settings.userName}</span>
            <span className="block text-[11px] text-slate-500">Personal workspace</span>
          </span>
          <SettingsIcon className="h-4 w-4 text-slate-400" />
        </button>
      </div>
    </div>
  );
}
