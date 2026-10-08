import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { AlignLeft, CalendarDays, Copy, ListChecks, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import type { Project, Task } from '../../types';
import { formatDueLabel } from '../../lib/date';
import { PRIORITY_META, isOverdue, subtaskProgress } from '../../lib/tasks';
import { cn } from '../../lib/utils';
import { useUI } from '../../store/UIContext';
import { useTaskActions } from '../../hooks/useTaskActions';
import { Checkbox } from '../ui/Checkbox';
import { PriorityBadge, ProjectLabel, TagChip } from '../ui/Badges';
import { Menu } from '../ui/Menu';

interface TaskRowProps {
  task: Task;
  project?: Project;
  showProject?: boolean;
  /** Narrow containers: hide secondary metadata. */
  compact?: boolean;
}

export const TaskRow = forwardRef<HTMLDivElement, TaskRowProps>(function TaskRow({ task, project, showProject = true, compact = false }, ref) {
  const { now, openTaskDetail, openTaskForm } = useUI();
  const actions = useTaskActions();
  const done = task.status === 'done';
  const overdue = isOverdue(task, now);
  const subs = subtaskProgress(task);

  return (
    <motion.div
      ref={ref}
      layout="position"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -12, transition: { duration: 0.15 } }}
      transition={{ duration: 0.2 }}
      onClick={() => openTaskDetail(task.id)}
      className="group relative flex cursor-pointer items-start gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.03]"
    >
      <div className="pt-px">
        <Checkbox
          checked={done}
          onChange={() => actions.toggleComplete(task)}
          color={PRIORITY_META[task.priority].color}
          label={done ? `Mark “${task.title}” as not completed` : `Complete “${task.title}”`}
        />
      </div>

      <div className="min-w-0 flex-1">
        <button
          onClick={(e) => {
            e.stopPropagation();
            openTaskDetail(task.id);
          }}
          className={cn(
            'block max-w-full truncate text-left text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50',
            done ? 'text-slate-400 line-through decoration-slate-300 dark:text-slate-500 dark:decoration-slate-600' : 'text-slate-900 dark:text-slate-100',
          )}
        >
          {task.title}
        </button>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
          {task.dueDate && (
            <span className={cn('inline-flex items-center gap-1', overdue && 'font-medium text-rose-600 dark:text-rose-400')}>
              <CalendarDays className="h-3.5 w-3.5" />
              {formatDueLabel(task.dueDate, task.dueTime, now)}
            </span>
          )}
          {task.status === 'in_progress' && (
            <span className="inline-flex items-center gap-1 font-medium text-amber-600 dark:text-amber-400">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
              In progress
            </span>
          )}
          {subs.total > 0 && (
            <span className="inline-flex items-center gap-1">
              <ListChecks className="h-3.5 w-3.5" />
              {subs.done}/{subs.total}
            </span>
          )}
          {task.description && <AlignLeft className="h-3.5 w-3.5" aria-label="Has description" />}
          {showProject && !compact && project && <ProjectLabel project={project} className="max-w-[140px]" />}
          {!compact && task.category && <span className="text-slate-400 dark:text-slate-500">{task.category}</span>}
          {!compact && task.tags.slice(0, 2).map((tag) => (
            <TagChip key={tag} tag={tag} />
          ))}
          {!compact && task.tags.length > 2 && <span>+{task.tags.length - 2}</span>}
        </div>
      </div>

      {!compact && <PriorityBadge priority={task.priority} className="mt-px hidden sm:inline-flex" />}

      <div className="flex items-center gap-0.5 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:focus-within:opacity-100">
        <button
          className="btn-icon hidden h-7 w-7 sm:inline-flex"
          aria-label="Edit task"
          title="Edit"
          onClick={(e) => {
            e.stopPropagation();
            openTaskForm({ taskId: task.id });
          }}
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <Menu
          items={[
            { label: 'Edit', icon: Pencil, onSelect: () => openTaskForm({ taskId: task.id }) },
            { label: 'Duplicate', icon: Copy, onSelect: () => actions.duplicate(task) },
            { label: 'Delete', icon: Trash2, onSelect: () => void actions.requestDelete(task), danger: true },
          ]}
          trigger={(props) => (
            <button {...props} className="btn-icon h-7 w-7" aria-label="More actions" title="More">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          )}
        />
      </div>
    </motion.div>
  );
});
