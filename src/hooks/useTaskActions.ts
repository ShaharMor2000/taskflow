import { useCallback } from 'react';
import type { Project, Task, TaskInput } from '../types';
import { useData } from '../store/DataContext';
import { useUI } from '../store/UIContext';
import { useToast } from '../components/ui/Toast';
import { useConfirm } from '../components/ui/ConfirmDialog';
import { formatDueLabel } from '../lib/date';
import { pluralize } from '../lib/utils';

/** User-facing task/project actions that combine data changes with confirmation and feedback. */
export function useTaskActions() {
  const data = useData();
  const ui = useUI();
  const toast = useToast();
  const confirm = useConfirm();

  const toggleComplete = useCallback(
    (task: Task) => {
      const next = data.toggleComplete(task.id);
      if (task.status === 'done') return;
      toast({
        title: 'Task completed',
        description: next?.dueDate ? `Next occurrence: ${formatDueLabel(next.dueDate, next.dueTime)}` : task.title,
        action: {
          label: 'Undo',
          onClick: () => {
            if (next) data.discardTask(next.id);
            data.updateTask(task.id, { status: task.status, recurrence: task.recurrence });
          },
        },
      });
    },
    [data, toast],
  );

  const requestDelete = useCallback(
    async (task: Task) => {
      const ok = await confirm({
        title: 'Delete this task?',
        message: `“${task.title}”${task.subtasks.length ? ` and its ${pluralize(task.subtasks.length, 'subtask')}` : ''} will be removed.`,
        confirmLabel: 'Delete task',
      });
      if (!ok) return false;
      const removed = data.deleteTask(task.id);
      if (ui.detailTaskId === task.id) ui.closeTaskDetail();
      if (removed) {
        toast({
          title: 'Task deleted',
          description: removed.title,
          tone: 'info',
          action: { label: 'Undo', onClick: () => data.restoreTask(removed) },
        });
      }
      return true;
    },
    [confirm, data, toast, ui],
  );

  const duplicate = useCallback(
    (task: Task) => {
      const copy = data.duplicateTask(task.id);
      if (copy) {
        toast({ title: 'Task duplicated', description: copy.title });
        ui.openTaskDetail(copy.id);
      }
    },
    [data, toast, ui],
  );

  /** Applies the same change to every selected task, with a single undo. */
  const bulkUpdate = useCallback(
    (ids: string[], patch: Partial<TaskInput>, label: string) => {
      const before = data.tasks.filter((t) => ids.includes(t.id));
      const spawned = data.bulkUpdate(ids, patch);
      toast({
        title: `${pluralize(before.length, 'task')} ${label}`,
        description: spawned.length ? `${pluralize(spawned.length, 'recurring task')} rescheduled` : undefined,
        action: {
          label: 'Undo',
          onClick: () => {
            spawned.forEach((t) => data.discardTask(t.id));
            before.forEach((t) =>
              data.updateTask(t.id, {
                status: t.status,
                priority: t.priority,
                projectId: t.projectId,
                dueDate: t.dueDate,
                dueTime: t.dueTime,
                recurrence: t.recurrence,
              }),
            );
          },
        },
      });
    },
    [data, toast],
  );

  const bulkDelete = useCallback(
    async (ids: string[]) => {
      const ok = await confirm({
        title: `Delete ${pluralize(ids.length, 'task')}?`,
        message: 'The selected tasks and their subtasks will be removed. You can undo this right after.',
        confirmLabel: 'Delete tasks',
      });
      if (!ok) return false;
      const removed = data.bulkDelete(ids);
      ui.clearSelection();
      toast({
        title: `${pluralize(removed.length, 'task')} deleted`,
        tone: 'info',
        action: { label: 'Undo', onClick: () => data.restoreTasks(removed) },
      });
      return true;
    },
    [confirm, data, toast, ui],
  );

  const requestDeleteProject = useCallback(
    async (project: Project) => {
      const count = data.tasks.filter((t) => t.projectId === project.id).length;
      const ok = await confirm({
        title: `Delete “${project.name}”?`,
        message:
          count > 0
            ? `The project will be removed. Its ${pluralize(count, 'task')} will be kept and moved to “No project”.`
            : 'This project has no tasks. It will be removed permanently.',
        confirmLabel: 'Delete project',
      });
      if (!ok) return false;
      data.deleteProject(project.id);
      toast({ title: 'Project deleted', description: project.name, tone: 'info' });
      return true;
    },
    [confirm, data, toast],
  );

  return { toggleComplete, requestDelete, duplicate, bulkUpdate, bulkDelete, requestDeleteProject };
}
