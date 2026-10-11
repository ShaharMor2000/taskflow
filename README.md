# TaskFlow

A premium task & project management web app built with React, TypeScript, Vite, Tailwind CSS, Framer Motion and Recharts. All data is stored locally in your browser (LocalStorage).

## Run locally

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # unit tests (Vitest)
npm run build      # type-check + production build into dist/
npm run preview    # serve the production build
```

## Highlights

- **Dashboard** — today's priorities, completed today vs. daily goal, overdue (with "move all to today"), upcoming deadlines, this-week chart, 14-day productivity trend, project progress, recent activity and inline quick add.
- **Tasks** — priorities, due date & time, projects, categories, tags, subtasks, notes (autosaved), and **recurring tasks** (daily, weekdays, weekly, monthly, yearly, every N units, optional end date). Monthly tasks keep their day of month (Jan 31 → Feb 28 → Mar 31).
- **Board** — pointer-based drag and drop for mouse, pen and touch (press and hold), reordering within columns, auto-scroll, Escape to cancel, and keyboard moves (Alt + arrows).
- **Calendar** — month view and a week time grid; drag tasks between days, onto an hour, or from the unscheduled tray. Arrow keys move between days.
- **Search & filters** — `#tag` search, filters for status, priority, due window, project, category and tag, removable filter chips, highlighted matches; filters and sort are remembered.
- **Bulk actions** — select tasks in the list or a project to complete, change status/priority/project/due date, or delete them together, with undo.
- **Analytics** — 7/30/90-day ranges with period comparison, on-time rate, current and longest streak, created-vs-completed chart, completion heatmap, weekday and time-of-day charts.
- **Also** — command palette (Ctrl K), notifications, collapsible sidebar, light/dark/system theme, JSON export/import.
- Pages and charts are code-split with skeleton loading states. Saved data is migrated automatically, and data from older versions is backed up first under `taskflow:backup:before-v2`.

## Project structure

```
src/
  types/            Data models (Task, Project, Activity, Settings…)
  lib/              Pure business logic — dates, recurrence, filtering/sorting, statistics, storage/migration (with *.test.ts)
  store/            DataContext and UIContext, each split into state and stable action contexts
  hooks/            Keyboard shortcuts, board drag and drop, list navigation, deadline notifications, layers
  components/
    ui/             Design-system primitives (Modal, Drawer, Toast, Confirm, Checkbox, Progress, Skeleton…)
    layout/         Sidebar, Topbar, AppLayout, PageHeader
    tasks/          TaskRow, TaskFormModal, TaskDetailPanel, TaskToolbar, BulkActionBar
    projects/       ProjectCard, ProjectFormModal
    charts/         Lazily loaded dashboard charts
    overlays/       CommandPalette, NotificationsMenu, ShortcutsDialog
  pages/            Dashboard, Tasks (list), Board, Calendar, Projects, Project detail, Analytics, Settings
```

## Keyboard shortcuts

| Keys | Action |
| --- | --- |
| `N` | New task |
| `Shift` `P` | New project |
| `Ctrl` `K` or `/` | Search & command palette |
| `Shift` `D` | Toggle dark mode |
| `[` | Collapse or expand the sidebar |
| `G` then `D/T/B/C/P/A/S` | Go to Dashboard / Tasks / Board / Calendar / Projects / Analytics / Settings |
| `J` / `K` | Next / previous task in a list |
| `X` / `E` | Select / edit the focused task |
| `Alt` + arrows | Move the focused board card |
| `Ctrl` `Enter` | Save the task form |
| `?` | Show all shortcuts |
