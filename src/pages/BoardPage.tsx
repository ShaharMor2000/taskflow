import { forwardRef, useMemo, useState, type DragEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarDays, ChevronLeft, ChevronRight, ListChecks, Plus } from 'lucide-react';
import type { Project, Task, TaskStatus } from '../types';
import { useData } from '../store/DataContext';
import { useUI } from '../store/UIContext';
import { formatDueLabel } from '../lib/date';
import { STATUSES, STATUS_META, filterTasks, isOverdue, sortTasks, subtaskProgress } from '../lib/tasks';
import { cn, percent } from '../lib/utils';
import { PageHeader } from '../components/layout/PageHeader';
import { TaskToolbar, ViewSwitcher } from '../components/tasks/TaskToolbar';
import { PriorityBadge, ProjectLabel } from '../components/ui/Badges';
import { ProgressBar } from '../components/ui/Progress';
import { useToast } from '../components/ui/Toast';

const DRAG_TYPE = 'application/x-taskflow-task';

export function BoardPage() {
  const { tasks, projects, setStatus } = useData();
  const { filters, sort, now, openTaskForm } = useUI();
  const toast = useToast();
  const [dragId, setDragId] = useState<string | null>(null);
  const [overColumn, setOverColumn] = useState<TaskStatus | null>(null);

  // The board's columns are the status, so the status filter does not apply here.
  const visible = useMemo(
    () => sortTasks(filterTasks(tasks, { ...filters, status: 'all' }, now, projects), sort),
    [tasks, filters, sort, now, projects],
  );

  const move = (task: Task, status: TaskStatus) => {
    if (task.status === status) return;
    setStatus(task.id, status);
    toast({ title: `Moved to ${STATUS_META[status].label}`, description: task.title, tone: status === 'done' ? 'success' : 'info' });
  };

  const onDrop = (e: DragEvent, status: TaskStatus) => {
    e.preventDefault();
    const id = e.dataTransfer.getData(DRAG_TYPE) || dragId;
    const task = tasks.find((t) => t.id === id);
    if (task) move(task, status);
    setDragId(null);
    setOverColumn(null);
  };

  return (
    <>
      <PageHeader
        title="Board"
        description="Drag cards between columns to update their status."
        actions={
          <>
            <ViewSwitcher />
            <button className="btn-primary" onClick={() => openTaskForm()}>
              <Plus className="h-4 w-4" /> New task
            </button>
          </>
        }
      />
      <div className="mb-5">
        <TaskToolbar showStatus={false} />
      </div>

      <div className="-mx-4 grid snap-x snap-mandatory auto-cols-[86%] grid-flow-col gap-4 overflow-x-auto px-4 pb-4 sm:auto-cols-[360px] lg:mx-0 lg:grid-flow-row lg:grid-cols-3 lg:overflow-visible lg:px-0">
        {STATUSES.map((status, colIndex) => {
          const column = visible.filter((t) => t.status === status);
          const isOver = overColumn === status && dragId !== null;
          return (
            <section
              key={status}
              aria-label={`${STATUS_META[status].label} column`}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                if (overColumn !== status) setOverColumn(status);
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) setOverColumn(null);
              }}
              onDrop={(e) => onDrop(e, status)}
              className={cn(
                'flex min-h-[480px] snap-start flex-col rounded-2xl border p-3 transition-colors',
                isOver
                  ? 'border-violet-300 bg-violet-50/70 dark:border-violet-400/40 dark:bg-violet-500/[0.07]'
                  : 'border-slate-200/70 bg-slate-100/50 dark:border-white/[0.05] dark:bg-white/[0.02]',
              )}
            >
              <header className="mb-3 flex items-center gap-2 px-1">
                <span className={cn('h-2 w-2 rounded-full', STATUS_META[status].dot)} />
                <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{STATUS_META[status].label}</h2>
                <span className="rounded-md bg-white px-1.5 py-0.5 text-[11px] font-semibold text-slate-500 shadow-sm dark:bg-white/10 dark:text-slate-300">
                  {column.length}
                </span>
                <button
                  className="btn-icon ml-auto h-7 w-7"
                  aria-label={`Add task to ${STATUS_META[status].label}`}
                  onClick={() => openTaskForm({ defaults: { status } })}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </header>

              <div className="flex flex-1 flex-col gap-2.5">
                <AnimatePresence initial={false} mode="popLayout">
                  {column.map((task) => (
                    <BoardCard
                      key={task.id}
                      task={task}
                      dragging={dragId === task.id}
                      onDragStart={(e) => {
                        e.dataTransfer.setData(DRAG_TYPE, task.id);
                        e.dataTransfer.effectAllowed = 'move';
                        setDragId(task.id);
                      }}
                      onDragEnd={() => {
                        setDragId(null);
                        setOverColumn(null);
                      }}
                      onMove={(dir) => move(task, STATUSES[colIndex + dir])}
                      canLeft={colIndex > 0}
                      canRight={colIndex < STATUSES.length - 1}
                      project={projects.find((p) => p.id === task.projectId)}
                    />
                  ))}
                </AnimatePresence>
                {column.length === 0 && (
                  <div
                    className={cn(
                      'grid flex-1 place-items-center rounded-xl border-2 border-dashed px-4 py-10 text-center text-[13px] transition-colors',
                      isOver ? 'border-violet-300 text-violet-600 dark:border-violet-400/40' : 'border-slate-200 text-slate-400 dark:border-white/[0.07]',
                    )}
                  >
                    {isOver ? 'Drop here' : 'No tasks here yet'}
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}

interface BoardCardProps {
  task: Task;
  dragging: boolean;
  onDragStart: (e: DragEvent) => void;
  onDragEnd: () => void;
  onMove: (dir: -1 | 1) => void;
  canLeft: boolean;
  canRight: boolean;
  project?: Project;
}

const BoardCard = forwardRef<HTMLDivElement, BoardCardProps>(function BoardCard(
  { task, dragging, onDragStart, onDragEnd, onMove, canLeft, canRight, project },
  ref,
) {
  const { now, openTaskDetail } = useUI();
  const overdue = isOverdue(task, now);
  const subs = subtaskProgress(task);
  const done = task.status === 'done';

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: dragging ? 0.45 : 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.12 } }}
      transition={{ duration: 0.18 }}
    >
      <div
        draggable
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onClick={() => openTaskDetail(task.id)}
        onKeyDown={(e) => e.key === 'Enter' && openTaskDetail(task.id)}
        tabIndex={0}
        role="button"
        aria-label={`${task.title}. Press Enter to open.`}
        className="card group cursor-grab p-3.5 transition hover:-translate-y-0.5 hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 active:cursor-grabbing dark:hover:border-white/[0.12]"
      >
        <div className="mb-2 flex items-center justify-between gap-2">
          <PriorityBadge priority={task.priority} />
          <div className="flex items-center gap-0.5 opacity-100 transition-opacity lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100">
            {canLeft && (
              <button
                className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-slate-200"
                aria-label="Move to previous column"
                title="Move left"
                onClick={(e) => {
                  e.stopPropagation();
                  onMove(-1);
                }}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}
            {canRight && (
              <button
                className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-slate-200"
                aria-label="Move to next column"
                title="Move right"
                onClick={(e) => {
                  e.stopPropagation();
                  onMove(1);
                }}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        <h3 className={cn('text-sm font-semibold leading-snug', done ? 'text-slate-400 line-through dark:text-slate-500' : 'text-slate-900 dark:text-slate-100')}>
          {task.title}
        </h3>
        {task.description && <p className="mt-1 line-clamp-2 text-[12.5px] leading-relaxed text-slate-500 dark:text-slate-400">{task.description}</p>}
        {subs.total > 0 && (
          <div className="mt-3">
            <div className="mb-1 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <ListChecks className="h-3.5 w-3.5" /> Subtasks
              </span>
              <span>
                {subs.done}/{subs.total}
              </span>
            </div>
            <ProgressBar value={percent(subs.done, subs.total)} label="Subtask progress" className="h-1" />
          </div>
        )}
        <div className="mt-3 flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
          {project ? <ProjectLabel project={project} className="max-w-[60%]" /> : <span />}
          {task.dueDate && (
            <span className={cn('inline-flex shrink-0 items-center gap-1', overdue && 'font-medium text-rose-600 dark:text-rose-400')}>
              <CalendarDays className="h-3.5 w-3.5" />
              {formatDueLabel(task.dueDate, task.dueTime, now)}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
});
