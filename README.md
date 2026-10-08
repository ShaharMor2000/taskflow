# TaskFlow

A premium task & project management web app built with React, TypeScript, Vite, Tailwind CSS, Framer Motion and Recharts. All data is stored locally in your browser (LocalStorage).

## Run locally

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build into dist/
npm run preview    # serve the production build
```

## Highlights

- **Dashboard** — today's priorities, completed today vs. daily goal, overdue (with "move all to today"), upcoming deadlines, this-week chart, 14-day productivity trend, project progress, recent activity and inline quick add.
- **Tasks** — priorities, due date & time, projects, categories, tags, subtasks, notes (autosaved), and **recurring tasks** (daily, weekdays, weekly, monthly, yearly, every N units). Completing a recurring task schedules the next occurrence.
- **Bulk actions** — select tasks in the list or a project to complete, change status/priority/project/due date, or delete them together, with undo.
- **Views** — list (grouped by due date), Kanban board with drag and drop, month/week calendar with drag-to-reschedule.
- **Projects, analytics, command palette (Ctrl K), notifications, light/dark/system theme, JSON export/import.**
- Pages are code-split and show skeletons while loading; data saved by older versions is migrated automatically.

## Project structure

```
src/
  types/            Data models (Task, Project, Activity, Settings…)
  lib/              Pure business logic — dates, filtering/sorting, statistics, storage, sample data
  store/            DataContext (persistent data + actions) and UIContext (routing, overlays, filters)
  hooks/            Keyboard shortcuts, deadline notifications, layers (modals/focus), task actions
  components/
    ui/             Design-system primitives (Modal, Drawer, Toast, Confirm, Checkbox, Progress…)
    layout/         Sidebar, Topbar, AppLayout, PageHeader
    tasks/          TaskRow, TaskFormModal, TaskDetailPanel, TaskToolbar
    projects/       ProjectCard, ProjectFormModal
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
| `G` then `D/T/B/C/P/A/S` | Go to Dashboard / Tasks / Board / Calendar / Projects / Analytics / Settings |
| `Ctrl` `Enter` | Save the task form |
| `?` | Show all shortcuts |
