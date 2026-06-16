# PayRun Frontend Skill

## Routing and navigation

The app router is defined in `frontend/src/App.tsx` using React Router. The main routes include:

- `/dashboard` — main dashboard after login
- `/employees` — employee list
- `/employees/new` — add a new employee
- `/employees/:id/edit` — edit employee details
- `/payroll/run` — start or amend payroll for the current month
- `/payroll/history` — view completed payroll runs
- `/payroll/history/:month` — view a specific payroll run
- `/settings` — user and workspace settings
- `/login`, `/signup` — authentication flow
- `/assistant` — PayRun helper assistant page

Protected pages are wrapped by the `ProtectedRoute` component, which redirects unauthenticated users to `/login`.

## Layout patterns

- `AppLayout` wraps the app content and renders the top AppBar plus either a desktop drawer or mobile bottom navigation.
- Navigation is driven from `frontend/src/layouts/AppLayout.tsx` and includes links for dashboard, employees, payroll history, settings, and assistant.
- Protected pages are nested inside `AppLayout` and only rendered when authentication is confirmed.

## UI conventions

- Use MUI components like `Stack`, `Box`, `Button`, `Typography`, `Paper`, `TextField`, and `Alert`.
- Use theming via the existing MUI theme and spacing system.
- Prefer existing shared components under `frontend/src/components/` over creating new layout widgets.
- Keep components small, focused, and typed with strict TypeScript definitions.

## Guidelines for new UI work

- Keep new components small and composable.
- Use meaningful prop names and explicit TypeScript interfaces.
- Align spacing, typography, and colors to the existing MUI theme.
- Reuse page header and card patterns from `frontend/src/components/PageHeader.tsx` and `frontend/src/components/StatCard.tsx` when possible.
