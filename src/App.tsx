import { Suspense, lazy, type ComponentType } from 'react';
import { MotionConfig } from 'framer-motion';
import { DataProvider } from './store/DataContext';
import { UIProvider, useUI } from './store/UIContext';
import { ToastProvider } from './components/ui/Toast';
import { ConfirmProvider } from './components/ui/ConfirmDialog';
import { AppLayout } from './components/layout/AppLayout';
import { TaskFormModal } from './components/tasks/TaskFormModal';
import { TaskDetailPanel } from './components/tasks/TaskDetailPanel';
import { ProjectFormModal } from './components/projects/ProjectFormModal';
import { CommandPalette } from './components/overlays/CommandPalette';
import { ShortcutsDialog } from './components/overlays/ShortcutsDialog';
import { useDeadlineNotifications, useKeyboardShortcuts } from './hooks/useGlobalEffects';
import { PageSkeleton } from './components/ui/Skeleton';

// Pages are split into separate chunks so the first load only fetches what is on screen
// (the charting library in particular is only downloaded when a chart page opens).
const named = <K extends string>(load: () => Promise<Record<K, ComponentType<any>>>, key: K) =>
  lazy(() => load().then((m) => ({ default: m[key] })));
const DashboardPage = named(() => import('./pages/DashboardPage'), 'DashboardPage');
const TasksPage = named(() => import('./pages/TasksPage'), 'TasksPage');
const BoardPage = named(() => import('./pages/BoardPage'), 'BoardPage');
const CalendarPage = named(() => import('./pages/CalendarPage'), 'CalendarPage');
const ProjectsPage = named(() => import('./pages/ProjectsPage'), 'ProjectsPage');
const ProjectDetailPage = named(() => import('./pages/ProjectDetailPage'), 'ProjectDetailPage');
const AnalyticsPage = named(() => import('./pages/AnalyticsPage'), 'AnalyticsPage');
const SettingsPage = named(() => import('./pages/SettingsPage'), 'SettingsPage');

function CurrentPage() {
  const { route } = useUI();
  switch (route.name) {
    case 'dashboard':
      return <DashboardPage />;
    case 'tasks':
      return <TasksPage />;
    case 'board':
      return <BoardPage />;
    case 'calendar':
      return <CalendarPage />;
    case 'projects':
      return <ProjectsPage />;
    case 'project':
      return <ProjectDetailPage id={route.id} />;
    case 'analytics':
      return <AnalyticsPage />;
    case 'settings':
      return <SettingsPage />;
  }
}

function Shell() {
  const { route } = useUI();
  useKeyboardShortcuts();
  useDeadlineNotifications();

  return (
    <>
      <AppLayout pageKey={route.name === 'project' ? `project-${route.id}` : route.name}>
        <Suspense fallback={<PageSkeleton />}>
          <CurrentPage />
        </Suspense>
      </AppLayout>
      <TaskDetailPanel />
      <TaskFormModal />
      <ProjectFormModal />
      <CommandPalette />
      <ShortcutsDialog />
    </>
  );
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <DataProvider>
        <ToastProvider>
          <ConfirmProvider>
            <UIProvider>
              <Shell />
            </UIProvider>
          </ConfirmProvider>
        </ToastProvider>
      </DataProvider>
    </MotionConfig>
  );
}
