import { Menu as MenuIcon, Moon, Plus, Search, Sun } from 'lucide-react';
import { useData } from '../../store/DataContext';
import { useUI } from '../../store/UIContext';
import { NotificationsMenu } from '../overlays/NotificationsMenu';
import { Logo } from './Sidebar';

export function Topbar() {
  const { updateSettings } = useData();
  const { isDark, setPaletteOpen, setMobileNavOpen, openTaskForm, route } = useUI();

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-[#f6f6fa]/80 backdrop-blur-xl dark:border-white/[0.06] dark:bg-ink-950/80">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-2 px-4 sm:gap-3 sm:px-6 lg:px-8">
        <button className="btn-icon -ml-2 lg:hidden" aria-label="Open navigation" onClick={() => setMobileNavOpen(true)}>
          <MenuIcon className="h-5 w-5" />
        </button>
        <div className="lg:hidden">
          <Logo />
        </div>

        <button
          onClick={() => setPaletteOpen(true)}
          className="ml-auto hidden h-9 w-full max-w-sm items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3 text-[13px] text-slate-400 shadow-sm transition hover:border-slate-300 hover:text-slate-500 md:flex lg:ml-0 dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-white/20"
        >
          <Search className="h-4 w-4" />
          Search tasks, projects, commands…
          <span className="ml-auto flex gap-1">
            <kbd className="kbd">Ctrl</kbd>
            <kbd className="kbd">K</kbd>
          </span>
        </button>

        <div className="ml-auto flex items-center gap-1 md:ml-auto">
          <button className="btn-icon md:hidden" aria-label="Search" onClick={() => setPaletteOpen(true)}>
            <Search className="h-[18px] w-[18px]" />
          </button>
          <button
            className="btn-icon"
            onClick={() => updateSettings({ theme: isDark ? 'light' : 'dark' })}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDark ? 'Light mode' : 'Dark mode'}
          >
            {isDark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
          </button>
          <NotificationsMenu />
          <button
            className="btn-primary ml-1 hidden sm:inline-flex"
            onClick={() => openTaskForm(route.name === 'project' ? { defaults: { projectId: route.id } } : undefined)}
          >
            <Plus className="h-4 w-4" />
            New task
          </button>
        </div>
      </div>
    </header>
  );
}
