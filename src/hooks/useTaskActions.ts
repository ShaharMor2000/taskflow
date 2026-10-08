import { useCallback } from 'react';
import type { Project, Task } from '../types';
import { useData } from '../store/DataContext';
import { useUI } from '../store/UIContext';
import { useToast } from '../components/ui/Toast';
import { useConfirm } from '../components/ui/ConfirmDialog';

/** User-facing task/project actions that combine data changes with confirmation and feedback. */
export function useTaskActions() {
  const data = useData();
  const ui = useUI();
  const toast = useToast();
  const confirm = useConfirm();

  const toggleComplete = useCallback(
    (task: Task) => {
      data.toggleComplete(task.id);
      if (task.status !== 'done') {
        toast({
          title: 'Task completed',
          description: task.title,
          action: { label: 'Undo', onClick: () => data.setStatus(task.id, task.status) },
        });
      }
    },
    [data, toast],
  );

  const requestDelete = useCallback(
    async (task: Task) => {
      const ok = await confirm({
        title: 'Delete this task?',
        message: `“${task.title}” and its ${task.subtasks.length} subtask(s) will be removed.`,
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

  const requestDeleteProject = useCallback(
    async (project: Project) => {
      const count = data.tasks.filter((t) => t.projectId === project.id).length;
      const ok = await confirm({
        title: `Delete “${project.name}”?`,
        message:
          count > 0
            ? `The project will be removed. Its ${count} task(s) will be kept and moved to “No project”.`
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

  return { toggleComplete, requestDelete, duplicate, requestDeleteProject };
}
