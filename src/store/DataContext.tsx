import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from 'react';
import type {
  Activity,
  ActivityType,
  AppData,
  AppNotification,
  Project,
  ProjectInput,
  Settings,
  Task,
  TaskInput,
  TaskStatus,
} from '../types';
import { createEmptyData, createSampleData } from '../lib/sampleData';
import { loadData, saveData } from '../lib/storage';
import { STATUS_META } from '../lib/tasks';
import { uid } from '../lib/utils';

type Action =
  | { type: 'task/add'; task: Task }
  | { type: 'task/update'; id: string; patch: Partial<Task> }
  | { type: 'task/delete'; id: string }
  | { type: 'project/add'; project: Project }
  | { type: 'project/update'; id: string; patch: Partial<Project> }
  | { type: 'project/delete'; id: string; now: string }
  | { type: 'activity/log'; entry: Activity }
  | { type: 'notifications/add'; items: AppNotification[] }
  | { type: 'notifications/read'; id: string }
  | { type: 'notifications/readAll' }
  | { type: 'notifications/clear' }
  | { type: 'settings/update'; patch: Partial<Settings> }
  | { type: 'data/replace'; data: AppData };

function reducer(state: AppData, action: Action): AppData {
  switch (action.type) {
    case 'task/add':
      return { ...state, tasks: [action.task, ...state.tasks.filter((t) => t.id !== action.task.id)] };
    case 'task/update':
      return { ...state, tasks: state.tasks.map((t) => (t.id === action.id ? { ...t, ...action.patch } : t)) };
    case 'task/delete':
      return {
        ...state,
        tasks: state.tasks.filter((t) => t.id !== action.id),
        notifications: state.notifications.filter((n) => n.taskId !== action.id),
      };
    case 'project/add':
      return { ...state, projects: [...state.projects, action.project] };
    case 'project/update':
      return { ...state, projects: state.projects.map((p) => (p.id === action.id ? { ...p, ...action.patch } : p)) };
    case 'project/delete':
      return {
        ...state,
        projects: state.projects.filter((p) => p.id !== action.id),
        tasks: state.tasks.map((t) => (t.projectId === action.id ? { ...t, projectId: null, updatedAt: action.now } : t)),
      };
    case 'activity/log':
      return { ...state, activity: [action.entry, ...state.activity].slice(0, 100) };
    case 'notifications/add':
      return {
        ...state,
        notifications: [...action.items, ...state.notifications].slice(0, 50),
        notificationKeys: [...state.notificationKeys, ...action.items.map((n) => n.key)].slice(-500),
      };
    case 'notifications/read':
      return { ...state, notifications: state.notifications.map((n) => (n.id === action.id ? { ...n, read: true } : n)) };
    case 'notifications/readAll':
      return { ...state, notifications: state.notifications.map((n) => ({ ...n, read: true })) };
    case 'notifications/clear':
      return { ...state, notifications: [] };
    case 'settings/update':
      return { ...state, settings: { ...state.settings, ...action.patch } };
    case 'data/replace':
      return action.data;
  }
}

/** Keeps completedAt consistent with status whenever a task changes. */
function withStatusBookkeeping(task: Task, patch: Partial<Task>, now: string): Partial<Task> {
  const next: Partial<Task> = { ...patch, updatedAt: now };
  if (patch.status && patch.status !== task.status) {
    next.completedAt = patch.status === 'done' ? now : null;
  }
  return next;
}

export interface DataApi extends AppData {
  storageError: boolean;
  createTask: (input: TaskInput) => Task;
  updateTask: (id: string, patch: Partial<TaskInput>) => void;
  setStatus: (id: string, status: TaskStatus) => void;
  toggleComplete: (id: string) => void;
  deleteTask: (id: string) => Task | undefined;
  restoreTask: (task: Task) => void;
  duplicateTask: (id: string) => Task | undefined;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  addSubtask: (taskId: string, title: string) => void;
  removeSubtask: (taskId: string, subtaskId: string) => void;
  createProject: (input: ProjectInput) => Project;
  updateProject: (id: string, patch: Partial<ProjectInput>) => void;
  deleteProject: (id: string) => void;
  addNotifications: (items: Omit<AppNotification, 'id' | 'at' | 'read'>[]) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  clearNotifications: () => void;
  updateSettings: (patch: Partial<Settings>) => void;
  replaceData: (data: AppData) => void;
  resetToSampleData: () => void;
  clearAllData: () => void;
}

const DataContext = createContext<DataApi | null>(null);

function initialState(): AppData {
  return loadData() ?? createSampleData();
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const stateRef = useRef(state);
  stateRef.current = state;
  const [storageError, setStorageError] = useState(false);

  useEffect(() => {
    setStorageError(!saveData(state));
  }, [state]);

  // Keep multiple open tabs in sync.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== 'taskflow:data:v1' || !e.newValue) return;
      const next = loadData();
      if (next) dispatch({ type: 'data/replace', data: next });
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const log = useCallback((type: ActivityType, message: string, refs: Pick<Activity, 'taskId' | 'projectId'> = {}) => {
    dispatch({ type: 'activity/log', entry: { id: uid('a_'), type, message, at: new Date().toISOString(), ...refs } });
  }, []);

  const findTask = (id: string) => stateRef.current.tasks.find((t) => t.id === id);

  const createTask = useCallback(
    (input: TaskInput): Task => {
      const now = new Date().toISOString();
      const task: Task = { ...input, id: uid('t_'), createdAt: now, updatedAt: now, completedAt: input.status === 'done' ? now : null };
      dispatch({ type: 'task/add', task });
      log('task_created', `Created “${task.title}”`, { taskId: task.id });
      return task;
    },
    [log],
  );

  const updateTask = useCallback(
    (id: string, patch: Partial<TaskInput>) => {
      const task = findTask(id);
      if (!task) return;
      const now = new Date().toISOString();
      dispatch({ type: 'task/update', id, patch: withStatusBookkeeping(task, patch, now) });
      const title = patch.title ?? task.title;
      if (patch.status && patch.status !== task.status) {
        if (patch.status === 'done') log('task_completed', `Completed “${title}”`, { taskId: id });
        else if (task.status === 'done') log('task_reopened', `Reopened “${title}”`, { taskId: id });
        else log('task_moved', `Moved “${title}” to ${STATUS_META[patch.status].label}`, { taskId: id });
      } else {
        log('task_updated', `Updated “${title}”`, { taskId: id });
      }
    },
    [log],
  );

  const setStatus = useCallback((id: string, status: TaskStatus) => updateTask(id, { status }), [updateTask]);

  const toggleComplete = useCallback(
    (id: string) => {
      const task = findTask(id);
      if (task) updateTask(id, { status: task.status === 'done' ? 'todo' : 'done' });
    },
    [updateTask],
  );

  const deleteTask = useCallback(
    (id: string) => {
      const task = findTask(id);
      if (!task) return undefined;
      dispatch({ type: 'task/delete', id });
      log('task_deleted', `Deleted “${task.title}”`);
      return task;
    },
    [log],
  );

  const restoreTask = useCallback(
    (task: Task) => {
      const projectExists = stateRef.current.projects.some((p) => p.id === task.projectId);
      dispatch({ type: 'task/add', task: { ...task, projectId: projectExists ? task.projectId : null } });
      log('task_created', `Restored “${task.title}”`, { taskId: task.id });
    },
    [log],
  );

  const duplicateTask = useCallback(
    (id: string) => {
      const task = findTask(id);
      if (!task) return undefined;
      const { id: _id, createdAt: _c, updatedAt: _u, completedAt: _d, ...input } = task;
      return createTask({
        ...input,
        title: `${task.title} (copy)`.slice(0, 200),
        status: task.status === 'done' ? 'todo' : task.status,
        subtasks: task.subtasks.map((s) => ({ ...s, id: uid('s_') })),
      });
    },
    [createTask],
  );

  // Subtask edits are frequent and small, so they don't flood the activity feed.
  const patchSubtasks = useCallback((taskId: string, fn: (subs: Task['subtasks']) => Task['subtasks']) => {
    const task = findTask(taskId);
    if (task) dispatch({ type: 'task/update', id: taskId, patch: { subtasks: fn(task.subtasks), updatedAt: new Date().toISOString() } });
  }, []);

  const toggleSubtask = useCallback(
    (taskId: string, subtaskId: string) =>
      patchSubtasks(taskId, (subs) => subs.map((s) => (s.id === subtaskId ? { ...s, done: !s.done } : s))),
    [patchSubtasks],
  );
  const addSubtask = useCallback(
    (taskId: string, title: string) => {
      const clean = title.trim().slice(0, 200);
      if (clean) patchSubtasks(taskId, (subs) => [...subs, { id: uid('s_'), title: clean, done: false }]);
    },
    [patchSubtasks],
  );
  const removeSubtask = useCallback(
    (taskId: string, subtaskId: string) => patchSubtasks(taskId, (subs) => subs.filter((s) => s.id !== subtaskId)),
    [patchSubtasks],
  );

  const createProject = useCallback(
    (input: ProjectInput): Project => {
      const project: Project = { ...input, id: uid('p_'), createdAt: new Date().toISOString() };
      dispatch({ type: 'project/add', project });
      log('project_created', `Created project “${project.name}”`, { projectId: project.id });
      return project;
    },
    [log],
  );

  const updateProject = useCallback(
    (id: string, patch: Partial<ProjectInput>) => {
      const project = stateRef.current.projects.find((p) => p.id === id);
      if (!project) return;
      dispatch({ type: 'project/update', id, patch });
      log('project_updated', `Updated project “${patch.name ?? project.name}”`, { projectId: id });
    },
    [log],
  );

  const deleteProject = useCallback(
    (id: string) => {
      const project = stateRef.current.projects.find((p) => p.id === id);
      if (!project) return;
      dispatch({ type: 'project/delete', id, now: new Date().toISOString() });
      log('project_deleted', `Deleted project “${project.name}”`);
    },
    [log],
  );

  const addNotifications = useCallback((items: Omit<AppNotification, 'id' | 'at' | 'read'>[]) => {
    const known = new Set(stateRef.current.notificationKeys);
    const fresh = items
      .filter((n) => !known.has(n.key))
      .map((n) => ({ ...n, id: uid('n_'), at: new Date().toISOString(), read: false }));
    if (fresh.length) dispatch({ type: 'notifications/add', items: fresh });
  }, []);

  const value = useMemo<DataApi>(
    () => ({
      ...state,
      storageError,
      createTask,
      updateTask,
      setStatus,
      toggleComplete,
      deleteTask,
      restoreTask,
      duplicateTask,
      toggleSubtask,
      addSubtask,
      removeSubtask,
      createProject,
      updateProject,
      deleteProject,
      addNotifications,
      markNotificationRead: (id) => dispatch({ type: 'notifications/read', id }),
      markAllNotificationsRead: () => dispatch({ type: 'notifications/readAll' }),
      clearNotifications: () => dispatch({ type: 'notifications/clear' }),
      updateSettings: (patch) => dispatch({ type: 'settings/update', patch }),
      replaceData: (data) => dispatch({ type: 'data/replace', data }),
      resetToSampleData: () =>
        dispatch({ type: 'data/replace', data: { ...createSampleData(), settings: stateRef.current.settings } }),
      clearAllData: () => dispatch({ type: 'data/replace', data: createEmptyData(stateRef.current.settings) }),
    }),
    [state, storageError, createTask, updateTask, setStatus, toggleComplete, deleteTask, restoreTask, duplicateTask, toggleSubtask, addSubtask, removeSubtask, createProject, updateProject, deleteProject, addNotifications],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataApi {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used inside <DataProvider>');
  return ctx;
}
