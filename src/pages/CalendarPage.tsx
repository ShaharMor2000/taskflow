import { useMemo, useState, type DragEvent } from 'react';
import { AnimatePresence } from 'framer-motion';
import { CalendarPlus, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import type { Task } from '../types';
import { useData } from '../store/DataContext';
import { useUI } from '../store/UIContext';
import {
  addDays,
  addMonths,
  formatTime,
  isSameDay,
  monthGrid,
  toISODate,
  weekDays,
  weekdayLabels,
} from '../lib/date';
import { PRIORITY_META, filterTasks, isOverdue, sortTasks } from '../lib/tasks';
import { cn } from '../lib/utils';
import { PageHeader } from '../components/layout/PageHeader';
import { TaskToolbar, ViewSwitcher } from '../components/tasks/TaskToolbar';
import { TaskRow } from '../components/tasks/TaskRow';
import { Segmented } from '../components/ui/Controls';
import { EmptyState } from '../components/ui/EmptyState';
import { useToast } from '../components/ui/Toast';

const DRAG_TYPE = 'application/x-taskflow-task';

export function CalendarPage() {
  const { tasks, projects, settings, updateTask } = useData();
  const { now, filters, openTaskForm } = useUI();
  const toast = useToast();
  const [mode, setMode] = useState<'month' | 'week'>('month');
  const [cursor, setCursor] = useState(() => new Date());
  const [selected, setSelected] = useState(() => new Date());
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const weekStartsOn = settings.weekStartsOn;

  const byDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    const visible = sortTasks(filterTasks(tasks, filters, now, projects), { key: 'dueDate', reversed: false });
    for (const t of visible) {
      if (!t.dueDate) continue;
      const list = map.get(t.dueDate) ?? [];
      list.push(t);
      map.set(t.dueDate, list);
    }
    return map;
  }, [tasks, filters, now, projects]);

  const days = mode === 'month' ? monthGrid(cursor, weekStartsOn) : weekDays(cursor, weekStartsOn);
  const title =
    mode === 'month'
      ? cursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
      : `${days[0].toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${days[6].toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })}`;

  const step = (dir: -1 | 1) => setCursor((c) => (mode === 'month' ? addMonths(c, dir) : addDays(c, 7 * dir)));
  const goToday = () => {
    setCursor(new Date());
    setSelected(new Date());
  };

  const dropOn = (e: DragEvent, day: Date) => {
    e.preventDefault();
    setDropTarget(null);
    const task = tasks.find((t) => t.id === e.dataTransfer.getData(DRAG_TYPE));
    const iso = toISODate(day);
    if (!task || task.dueDate === iso) return;
    updateTask(task.id, { dueDate: iso });
    toast({ title: 'Task rescheduled', description: `${task.title} → ${day.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}` });
  };

  const selectedTasks = byDate.get(toISODate(selected)) ?? [];
  const unscheduled = tasks.filter((t) => !t.dueDate && t.status !== 'done').length;

  return (
    <>
      <PageHeader
        title="Calendar"
        description={`Plan your work by due date${unscheduled ? ` · ${unscheduled} open tasks have no due date` : ''}`}
        actions={
          <>
            <ViewSwitcher />
            <button className="btn-primary" onClick={() => openTaskForm({ defaults: { dueDate: toISODate(selected) } })}>
              <Plus className="h-4 w-4" /> New task
            </button>
          </>
        }
      />
      <div className="mb-5">
        <TaskToolbar showSort={false} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <section className="card overflow-hidden">
          <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-4 py-3 dark:border-white/[0.06]">
            <h2 className="min-w-0 flex-1 text-base font-semibold tracking-tight text-slate-900 dark:text-white">{title}</h2>
            <div className="flex items-center gap-1">
              <button className="btn-icon h-8 w-8" aria-label={`Previous ${mode}`} onClick={() => step(-1)}>
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button className="btn-secondary btn-sm" onClick={goToday}>
                Today
              </button>
              <button className="btn-icon h-8 w-8" aria-label={`Next ${mode}`} onClick={() => step(1)}>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <Segmented
              size="sm"
              label="Calendar range"
              value={mode}
              onChange={setMode}
              options={[
                { value: 'month', label: 'Month' },
                { value: 'week', label: 'Week' },
              ]}
            />
          </div>

          <div className={cn('grid grid-cols-7 border-b border-slate-100 dark:border-white/[0.06]', mode === 'week' && 'hidden sm:grid')}>
            {weekdayLabels(weekStartsOn).map((d) => (
              <div key={d} className="py-2 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {d}
              </div>
            ))}
          </div>

          <div className={cn('grid', mode === 'month' ? 'grid-cols-7' : 'grid-cols-1 sm:grid-cols-7')}>
            {days.map((day) => {
              const iso = toISODate(day);
              const list = byDate.get(iso) ?? [];
              const inMonth = mode === 'week' || day.getMonth() === cursor.getMonth();
              const isToday = isSameDay(day, now);
              const isSelected = isSameDay(day, selected);
              const limit = mode === 'month' ? 3 : Infinity;
              return (
                <div
                  key={iso}
                  role="button"
                  tabIndex={0}
                  aria-label={`${day.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}, ${list.length} tasks`}
                  aria-pressed={isSelected}
                  onClick={() => setSelected(day)}
                  onDoubleClick={() => openTaskForm({ defaults: { dueDate: iso } })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelected(day);
                    }
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (dropTarget !== iso) setDropTarget(iso);
                  }}
                  onDragLeave={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget as Node)) setDropTarget(null);
                  }}
                  onDrop={(e) => dropOn(e, day)}
                  className={cn(
                    'group relative cursor-pointer border-b border-r border-slate-100 p-1.5 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-violet-500/50 dark:border-white/[0.05] sm:p-2',
                    mode === 'month' ? 'min-h-[64px] sm:min-h-[112px]' : 'min-h-[72px] sm:min-h-[420px]',
                    !inMonth && 'bg-slate-50/60 dark:bg-white/[0.01]',
                    isSelected && 'bg-violet-50/60 dark:bg-violet-500/[0.06]',
                    dropTarget === iso && 'bg-violet-100/70 ring-2 ring-inset ring-violet-400 dark:bg-violet-500/15',
                    'hover:bg-slate-50 dark:hover:bg-white/[0.03]',
                  )}
                >
                  <div className="mb-1 flex items-center justify-between">
                    <span
                      className={cn(
                        'grid h-6 min-w-[24px] place-items-center rounded-full px-1 text-xs font-semibold',
                        isToday ? 'bg-violet-600 text-white' : inMonth ? 'text-slate-700 dark:text-slate-200' : 'text-slate-300 dark:text-slate-600',
                      )}
                    >
                      {mode === 'week' ? (
                        <span className="sm:hidden">{day.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })}</span>
                      ) : null}
                      <span className={cn(mode === 'week' && 'hidden sm:inline')}>{day.getDate()}</span>
                    </span>
                    <button
                      className="hidden rounded-md p-0.5 text-slate-400 opacity-0 transition hover:bg-slate-200/70 hover:text-slate-700 group-hover:opacity-100 sm:block dark:hover:bg-white/10"
                      aria-label={`Add task on ${iso}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        openTaskForm({ defaults: { dueDate: iso } });
                      }}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Mobile month view: compact dots */}
                  {mode === 'month' && list.length > 0 && (
                    <div className="flex flex-wrap gap-0.5 sm:hidden">
                      {list.slice(0, 4).map((t) => (
                        <span key={t.id} className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: PRIORITY_META[t.priority].color, opacity: t.status === 'done' ? 0.35 : 1 }} />
                      ))}
                    </div>
                  )}

                  <div className={cn('space-y-1', mode === 'month' && 'hidden sm:block')}>
                    {list.slice(0, limit).map((t) => (
                      <CalendarPill key={t.id} task={t} overdue={isOverdue(t, now)} />
                    ))}
                    {list.length > limit && (
                      <span className="block px-1.5 text-[11px] font-medium text-violet-600 dark:text-violet-300">+{list.length - limit} more</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <aside className="card self-start p-5">
          <div className="mb-3 flex items-start justify-between gap-2">
            <div>
              <h2 className="section-title">{selected.toLocaleDateString(undefined, { weekday: 'long' })}</h2>
              <p className="text-xs text-slate-500">{selected.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</p>
            </div>
            <button className="btn-secondary btn-sm" onClick={() => openTaskForm({ defaults: { dueDate: toISODate(selected) } })}>
              <Plus className="h-3.5 w-3.5" /> Add
            </button>
          </div>
          {selectedTasks.length === 0 ? (
            <EmptyState compact icon={CalendarPlus} title="Nothing scheduled" description="Double-click a day or use Add to schedule a task." />
          ) : (
            <div className="-mx-3 divide-y divide-slate-100 dark:divide-white/[0.05]">
              <AnimatePresence initial={false}>
                {selectedTasks.map((t) => (
                  <TaskRow key={t.id} task={t} project={projects.find((p) => p.id === t.projectId)} compact />
                ))}
              </AnimatePresence>
            </div>
          )}
          <p className="mt-4 text-[11px] leading-relaxed text-slate-400">Tip: drag a task onto another day to reschedule it.</p>
        </aside>
      </div>
    </>
  );
}

function CalendarPill({ task, overdue }: { task: Task; overdue: boolean }) {
  const { openTaskDetail } = useUI();
  const color = PRIORITY_META[task.priority].color;
  const done = task.status === 'done';
  return (
    <button
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData(DRAG_TYPE, task.id);
        e.dataTransfer.effectAllowed = 'move';
      }}
      onClick={(e) => {
        e.stopPropagation();
        openTaskDetail(task.id);
      }}
      onDoubleClick={(e) => e.stopPropagation()}
      title={task.title}
      className={cn(
        'flex w-full cursor-grab items-center gap-1.5 truncate rounded-md border-l-[3px] px-1.5 py-1 text-left text-[11.5px] font-medium transition hover:brightness-95 active:cursor-grabbing',
        done ? 'text-slate-400 line-through' : overdue ? 'text-rose-700 dark:text-rose-300' : 'text-slate-700 dark:text-slate-200',
      )}
      style={{ borderLeftColor: color, backgroundColor: `${color}${done ? '0d' : '17'}` }}
    >
      {task.dueTime && <span className="shrink-0 text-[10.5px] opacity-70">{formatTime(task.dueTime)}</span>}
      <span className="truncate">{task.title}</span>
    </button>
  );
}

