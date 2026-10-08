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
import { DashboardPage } from './pages/DashboardPage';
import { TasksPage } from './pages/TasksPage';
import { BoardPage } from './pages/BoardPage';
import { CalendarPage } from './pages/CalendarPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { ProjectDetailPage } from './pages/ProjectDetailPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';

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
        <CurrentPage />
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
