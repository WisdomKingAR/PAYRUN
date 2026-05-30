# PayRun Deployment

PayRun uses a hosted Supabase project as the backend and a static Vite React frontend. There is no separate Node or Express server to deploy.

## 1. Supabase Backend

1. Create a Supabase project.
2. Open the Supabase SQL Editor.
3. Run `backend/setup.sql`.
4. If the project already has duplicate workspace/business rows from earlier testing, run `backend/repair_workspace_bootstrap.sql`.
5. Copy these values from Supabase Project Settings, API:
   - Project URL
   - anon public key

## 2. Supabase Auth URLs

In Supabase, open Authentication, URL Configuration.

Set the Site URL to the deployed frontend URL:

```text
https://your-payrun-domain.vercel.app
```

Add redirect URLs for local and production auth flows:

```text
http://localhost:5173
http://localhost:5173/reset-password
https://your-payrun-domain.vercel.app
https://your-payrun-domain.vercel.app/reset-password
```

In Authentication, Password Security, enable leaked password protection if your Supabase plan supports it. Supabase exposes this as a project Auth setting, not a SQL setting.

## 3. Vercel Frontend

1. Import `WisdomKingAR/PAYRUN` in Vercel.
2. Keep the project root as the repository root. The root `vercel.json` handles the frontend install, build, output directory, and SPA routing.
3. Add these Vercel environment variables:

```text
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_public_key
```

4. Deploy.

## 4. Post Deployment Check

After the deployment finishes:

1. Open the deployed URL.
2. Create a test account or sign in.
3. Confirm the dashboard loads without the workspace error.
4. Add an employee.
5. Open a payroll run.
6. Save a draft.
7. Confirm the payroll run.
8. Test forgot password and reset password.

## Troubleshooting

- If refresh on a nested route returns 404, confirm `vercel.json` is present in the repository root.
- If login works but the dashboard says the workspace could not load, run `backend/setup.sql` again and check Supabase Auth URL settings.
- If the error mentions multiple rows, run `backend/repair_workspace_bootstrap.sql`.
- If payroll confirmation says `new row violates row-level security policy for table "employee_payroll"`, run `backend/repair_workspace_bootstrap.sql` so Supabase gets the latest payroll row insert/update/delete policies.
- If Supabase's database linter warns about `update_timestamp` search path or `rls_auto_enable` execution privileges, run `backend/repair_workspace_bootstrap.sql`.
- If Vercel builds but the app cannot reach Supabase, recheck the two `VITE_SUPABASE_*` environment variables.
