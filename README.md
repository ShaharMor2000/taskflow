# TaskFlow

A premium task & project management web app built with React, TypeScript, Vite, Tailwind CSS, Framer Motion and Recharts. All data is stored locally in your browser (LocalStorage).

## Run locally

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build into dist/
npm run preview    # serve the production build
```

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
