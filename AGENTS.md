# PayRun Agent Guide

## Project Overview

PayRun is a small-team payroll MVP for Indian businesses, with a focus on Maharashtra statutory rules. It helps employers manage employee records, run monthly payroll, calculate PF, ESI, and professional tax, and store payroll history in Supabase.

## Architecture Overview

- Frontend: React + TypeScript + Vite + MUI, with React Router and Zustand for state.
- Backend: Supabase handles the database, auth, and row-level security policies; there is no separate Node/Express server in the main app.
- Routing, global layout, and state are managed in `frontend/src/App.tsx`, `frontend/src/layouts/AppLayout.tsx`, and `frontend/src/store/useAuthStore.ts` / `frontend/src/hooks/useWorkspace.ts`.

## Key Paths and Modules

- `frontend/src/App.tsx` — main application router and auth session handling.
- `frontend/src/layouts/AppLayout.tsx` — app shell, navigation, responsive drawer/bottom nav, and main content container.
- `frontend/src/pages/` — user-facing screen components such as `Dashboard`, `Employees`, `PayrollRun`, `PayrollHistory`, `Settings`, `Auth`, and new `Assistant` page.
- `frontend/src/utils/payrollCalculations.ts` — core payroll math for gross salary, earned salary, PF, ESI, and Maharashtra professional tax.
- `frontend/src/lib/` — Supabase client, API wrapper functions, and assistant helper logic.

## Coding Conventions

- Components are written as React function components with hooks.
- MUI is used throughout for layout, typography, form controls, cards, dialogs, and responsive design.
- TypeScript types are explicit and avoid `any` in application code.
- Page components are typically placed under `frontend/src/pages/`, with shared UI patterns extracted into `frontend/src/components/` and hooks under `frontend/src/hooks/`.

## Non-negotiable Rules

- Keep edits surgical. Modify only files relevant to the feature or bug being addressed.
- Do not modify Supabase SQL schemas or RLS policies unless explicitly instructed.
- Do not grant broad `anon` or `service_role` access in source code.
- Do not hard-code secrets or API keys. Use environment variables for configuration.
- For payroll logic, always maintain or increase test coverage when changing behavior.
- Prefer existing components and APIs before introducing new patterns.
