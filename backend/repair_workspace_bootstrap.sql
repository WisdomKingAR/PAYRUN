CREATE EXTENSION IF NOT EXISTS "pgcrypto";

ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS whatsapp_api_key TEXT;

ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS onboarding_step INTEGER NOT NULL DEFAULT 1 CHECK (onboarding_step BETWEEN 1 AND 3);

ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS phone_number TEXT,
  ADD COLUMN IF NOT EXISTS pan TEXT,
  ADD COLUMN IF NOT EXISTS aadhaar_number TEXT,
  ADD COLUMN IF NOT EXISTS bank_account_no TEXT,
  ADD COLUMN IF NOT EXISTS ifsc_code TEXT,
  ADD COLUMN IF NOT EXISTS onboarding_status TEXT DEFAULT 'pending' CHECK (onboarding_status IN ('pending', 'completed')),
  ADD COLUMN IF NOT EXISTS magic_link_token UUID DEFAULT gen_random_uuid() UNIQUE,
  ADD COLUMN IF NOT EXISTS other_allowances JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS gender TEXT NOT NULL DEFAULT 'male' CHECK (gender IN ('male', 'female', 'other'));

ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_payroll ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can only access their own business" ON businesses;
DROP POLICY IF EXISTS "Owner manages own business" ON businesses;
CREATE POLICY "Owner manages own business"
ON businesses FOR ALL
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Owners can manage their employees" ON employees;
DROP POLICY IF EXISTS "Owner manages employees of own business" ON employees;
CREATE POLICY "Owner manages employees of own business"
ON employees FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = employees.business_id
    AND businesses.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = employees.business_id
    AND businesses.owner_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Owners can manage their payroll runs" ON payroll_runs;
DROP POLICY IF EXISTS "Owner manages own payroll runs" ON payroll_runs;
CREATE POLICY "Owner manages own payroll runs"
ON payroll_runs FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = payroll_runs.business_id
    AND businesses.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = payroll_runs.business_id
    AND businesses.owner_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Owners can view their employee payroll records" ON employee_payroll;
DROP POLICY IF EXISTS "Owners can manage their employee payroll records" ON employee_payroll;
DROP POLICY IF EXISTS "Owner manages employee payroll of own business" ON employee_payroll;
CREATE POLICY "Owner manages employee payroll of own business"
ON employee_payroll FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM payroll_runs pr
    JOIN businesses b ON b.id = pr.business_id
    WHERE pr.id = employee_payroll.payroll_run_id
    AND b.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM payroll_runs pr
    JOIN businesses b ON b.id = pr.business_id
    WHERE pr.id = employee_payroll.payroll_run_id
    AND b.owner_id = auth.uid()
  )
);
