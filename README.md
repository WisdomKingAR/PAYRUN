# PayRun

PayRun is a React, TypeScript, MUI, and Supabase payroll MVP for small Indian teams. It focuses on employee records, payroll drafts, salary calculations, Maharashtra Professional Tax handling, and audit-ready payroll history.

## Structure

- `frontend` contains the Vite React frontend.
- `backend` contains Supabase SQL setup and repair scripts.

## Local Setup

```powershell
cd frontend
npm install
npm run dev
```

Create a frontend environment file from `frontend/.env.example` and set:

```text
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_public_key
```

## Supabase

Run the SQL scripts in `backend` inside the Supabase SQL Editor before testing the app with real auth and payroll data.
