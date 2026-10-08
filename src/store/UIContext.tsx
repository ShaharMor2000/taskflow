import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { TaskFilters, TaskInput, TaskSort } from '../types';
import { DEFAULT_FILTERS } from '../lib/tasks';
import { useNow } from '../hooks/useNow';
import { useData } from './DataContext';

export type Route =
  | { name: 'dashboard' }
  | { name: 'tasks' }
  | { name: 'board' }
  | { name: 'calendar' }
  | { name: 'projects' }
  | { name: 'project'; id: string }
  | { name: 'analytics' }
  | { name: 'settings' };

const SIMPLE_ROUTES = ['dashboard', 'tasks', 'board', 'calendar', 'projects', 'analytics', 'settings'] as const;

function parseHash(hash: string): Route {
  const [name, id] = hash.replace(/^#\/?/, '').split('/');
  if (name === 'projects' && id) return { name: 'project', id: decodeURIComponent(id) };
  return (SIMPLE_ROUTES as readonly string[]).includes(name) ? ({ name } as Route) : { name: 'dashboard' };
}

export function routeToHash(route: Route): string {
  return route.name === 'project' ? `#/projects/${encodeURIComponent(route.id)}` : `#/${route.name}`;
}

type TaskFormState = { open: false } | { open: true; taskId?: string; defaults?: Partial<TaskInput> };
type ProjectFormState = { open: false } | { open: true; projectId?: string };

interface UIApi {
  route: Route;
  navigate: (route: Route) => void;
  now: Date;
  isDark: boolean;
  filters: TaskFilters;
  setFilters: (patch: Partial<TaskFilters>) => void;
  resetFilters: () => void;
  sort: TaskSort;
  setSort: (sort: TaskSort) => void;
  taskForm: TaskFormState;
  openTaskForm: (opts?: { taskId?: string; defaults?: Partial<TaskInput> }) => void;
  closeTaskForm: () => void;
  detailTaskId: string | null;
  openTaskDetail: (id: string) => void;
  closeTaskDetail: () => void;
  projectForm: ProjectFormState;
  openProjectForm: (projectId?: string) => void;
  closeProjectForm: () => void;
  paletteOpen: boolean;
  setPaletteOpen: (open: boolean) => void;
  shortcutsOpen: boolean;
  setShortcutsOpen: (open: boolean) => void;
  mobileNavOpen: boolean;
  setMobileNavOpen: (open: boolean) => void;
}

const UIContext = createContext<UIApi | null>(null);

function useSystemDark(): boolean {
  const [dark, setDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => setDark(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return dark;
}

export function UIProvider({ children }: { children: ReactNode }) {
  const { settings } = useData();
  const now = useNow();
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));
  const [filters, setFiltersState] = useState<TaskFilters>(DEFAULT_FILTERS);
  const [sort, setSort] = useState<TaskSort>({ key: 'dueDate', reversed: false });
  const [taskForm, setTaskForm] = useState<TaskFormState>({ open: false });
  const [detailTaskId, setDetailTaskId] = useState<string | null>(null);
  const [projectForm, setProjectForm] = useState<ProjectFormState>({ open: false });
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const systemDark = useSystemDark();
  const isDark = settings.theme === 'dark' || (settings.theme === 'system' && systemDark);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
  }, [isDark]);

  useEffect(() => {
    const onHash = () => {
      setRoute(parseHash(window.location.hash));
      setMobileNavOpen(false);
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const navigate = useCallback((next: Route) => {
    const hash = routeToHash(next);
    if (window.location.hash !== hash) window.location.hash = hash;
    setMobileNavOpen(false);
  }, []);

  const setFilters = useCallback((patch: Partial<TaskFilters>) => setFiltersState((f) => ({ ...f, ...patch })), []);

  const value = useMemo<UIApi>(
    () => ({
      route,
      navigate,
      now,
      isDark,
      filters,
      setFilters,
      resetFilters: () => setFiltersState(DEFAULT_FILTERS),
      sort,
      setSort,
      taskForm,
      openTaskForm: (opts = {}) => setTaskForm({ open: true, ...opts }),
      closeTaskForm: () => setTaskForm({ open: false }),
      detailTaskId,
      openTaskDetail: setDetailTaskId,
      closeTaskDetail: () => setDetailTaskId(null),
      projectForm,
      openProjectForm: (projectId) => setProjectForm({ open: true, projectId }),
      closeProjectForm: () => setProjectForm({ open: false }),
      paletteOpen,
      setPaletteOpen,
      shortcutsOpen,
      setShortcutsOpen,
      mobileNavOpen,
      setMobileNavOpen,
    }),
    [route, navigate, now, isDark, filters, setFilters, sort, taskForm, detailTaskId, projectForm, paletteOpen, shortcutsOpen, mobileNavOpen],
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI(): UIApi {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI must be used inside <UIProvider>');
  return ctx;
}
