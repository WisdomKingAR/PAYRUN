# PayRun Supabase Skill

## High-level schema summary

Key backend tables include:

- `businesses` — workspace and state details for a company
- `employees` — employee records tied to a business
- `payroll_runs` — monthly payroll summary records with status and export flags
- `employee_payroll` — payroll line items for employees within a payroll run
- `audit_logs` — write-only event logging for business and employee changes

Employees are scoped to a business, and payroll runs are scoped to the same business.

## Auth and workspace model

- Supabase Auth handles user sign-in and sign-up.
- Business workspaces are linked to the authenticated user via `owner_id`.
- RLS policies enforce workspace isolation by restricting access to rows based on business ownership.

## Rules for database work

- Do not modify schema or RLS policies unless explicitly requested.
- Prefer existing API wrappers in `frontend/src/lib/payrunApi.ts` for Supabase access.
- Keep frontend Supabase calls limited to safe read or write operations that follow existing patterns.
- Avoid introducing broad anonymous or service-role access in client code.

## Environment variables & URLs

- The frontend reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from environment.
- These values are used only to initialize the Supabase client in `frontend/src/lib/supabaseClient.ts`.
- Do not expose or log Supabase secrets in the UI.
