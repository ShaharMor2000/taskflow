import { ArrowDownUp, CalendarRange, Columns3, List, Search, X } from 'lucide-react';
import { useData } from '../../store/DataContext';
import { useUI } from '../../store/UIContext';
import { PRIORITIES, PRIORITY_META, SORT_OPTIONS, getCategories, hasActiveFilters } from '../../lib/tasks';
import { cn } from '../../lib/utils';
import { Segmented, Select } from '../ui/Controls';
import type { TaskFilters } from '../../types';

interface ToolbarProps {
  showStatus?: boolean;
  showSort?: boolean;
}

export function TaskToolbar({ showStatus = true, showSort = true }: ToolbarProps) {
  const { tasks, projects } = useData();
  const { filters, setFilters, resetFilters, sort, setSort } = useUI();
  const categories = getCategories(tasks);
  const active = hasActiveFilters(showStatus ? filters : { ...filters, status: 'all' });

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
      <div className="relative lg:w-72">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={filters.search}
          onChange={(e) => setFilters({ search: e.target.value })}
          placeholder="Search tasks, tags, projects…"
          aria-label="Search tasks"
          className="input h-9 pl-9 pr-8 text-[13px] [&::-webkit-search-cancel-button]:hidden"
        />
        {filters.search && (
          <button
            aria-label="Clear search"
            onClick={() => setFilters({ search: '' })}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-700"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="-mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-1 scrollbar-none lg:pb-0">
        {showStatus && (
          <Select
            aria-label="Filter by status"
            value={filters.status}
            onChange={(e) => setFilters({ status: e.target.value as TaskFilters['status'] })}
            className="w-[140px] shrink-0"
          >
            <option value="all">All statuses</option>
            <option value="open">Open</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Completed</option>
            <option value="overdue">Overdue</option>
          </Select>
        )}
        <Select
          aria-label="Filter by priority"
          value={filters.priority}
          onChange={(e) => setFilters({ priority: e.target.value as TaskFilters['priority'] })}
          className="w-[136px] shrink-0"
        >
          <option value="all">All priorities</option>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {PRIORITY_META[p].label}
            </option>
          ))}
        </Select>
        <Select
          aria-label="Filter by category"
          value={filters.category}
          onChange={(e) => setFilters({ category: e.target.value })}
          className="w-[148px] shrink-0"
        >
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
        <Select
          aria-label="Filter by project"
          value={filters.projectId}
          onChange={(e) => setFilters({ projectId: e.target.value })}
          className="w-[148px] shrink-0"
        >
          <option value="all">All projects</option>
          <option value="none">No project</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>

        {showSort && (
          <>
            <span className="mx-1 hidden h-5 w-px shrink-0 bg-slate-200 sm:block dark:bg-white/10" />
            <Select
              aria-label="Sort tasks by"
              value={sort.key}
              onChange={(e) => setSort({ ...sort, key: e.target.value as typeof sort.key })}
              className="w-[140px] shrink-0"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.key} value={o.key}>
                  Sort: {o.label}
                </option>
              ))}
            </Select>
            <button
              onClick={() => setSort({ ...sort, reversed: !sort.reversed })}
              className={cn('btn-icon shrink-0 border border-slate-200 dark:border-white/10', sort.reversed && 'bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300')}
              aria-pressed={sort.reversed}
              aria-label="Reverse sort order"
              title="Reverse order"
            >
              <ArrowDownUp className="h-4 w-4" />
            </button>
          </>
        )}

        {active && (
          <button onClick={resetFilters} className="btn-ghost btn-sm shrink-0 text-violet-600 dark:text-violet-300">
            <X className="h-3.5 w-3.5" /> Clear filters
          </button>
        )}
      </div>
    </div>
  );
}

export function ViewSwitcher() {
  const { route, navigate } = useUI();
  const current = route.name === 'board' ? 'board' : route.name === 'calendar' ? 'calendar' : 'tasks';
  return (
    <Segmented
      label="Task view"
      value={current}
      onChange={(v) => navigate({ name: v })}
      options={[
        { value: 'tasks', label: <><List className="h-4 w-4" /> <span className="hidden sm:inline">List</span></>, title: 'List view' },
        { value: 'board', label: <><Columns3 className="h-4 w-4" /> <span className="hidden sm:inline">Board</span></>, title: 'Board view' },
        { value: 'calendar', label: <><CalendarRange className="h-4 w-4" /> <span className="hidden sm:inline">Calendar</span></>, title: 'Calendar view' },
      ]}
    />
  );
}
