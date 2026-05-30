CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS businesses (
  id               UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  name             TEXT        NOT NULL,
  state            TEXT        NOT NULL DEFAULT 'Maharashtra',
  logo_url         TEXT,
  owner_id         UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  onboarding_step  INTEGER     NOT NULL DEFAULT 1 CHECK (onboarding_step BETWEEN 1 AND 3),
  whatsapp_api_key TEXT, 
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS employees (
  id                UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id       UUID        REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  name              TEXT        NOT NULL CHECK (char_length(name) BETWEEN 2 AND 100),
  email             TEXT,
  phone_number      TEXT,
  role              TEXT        NOT NULL,
  joining_date      DATE        NOT NULL,
  pan               TEXT, 
  aadhaar_number    TEXT,
  bank_account_no  TEXT,
  ifsc_code         TEXT,
  onboarding_status TEXT        DEFAULT 'pending' CHECK (onboarding_status IN ('pending', 'completed')),
  magic_link_token  UUID        DEFAULT gen_random_uuid() UNIQUE,
  basic_salary      NUMERIC     NOT NULL CHECK (basic_salary > 0),
  hra               NUMERIC     NOT NULL DEFAULT 0,
  special_allowance NUMERIC     NOT NULL DEFAULT 0,
  gross_salary      NUMERIC     GENERATED ALWAYS AS (basic_salary + hra + special_allowance) STORED,
  other_allowances  JSONB       NOT NULL DEFAULT '{}',
  pf_applicable     BOOLEAN     NOT NULL DEFAULT FALSE,
  esi_applicable    BOOLEAN     NOT NULL DEFAULT TRUE,
  gender            TEXT        NOT NULL DEFAULT 'male' CHECK (gender IN ('male', 'female', 'other')),
  is_active         BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS gross_salary NUMERIC
  GENERATED ALWAYS AS (basic_salary + hra + special_allowance) STORED;

CREATE TABLE IF NOT EXISTS audit_logs (
  id               UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id      UUID        REFERENCES businesses(id) ON DELETE CASCADE,
  admin_id         UUID        REFERENCES auth.users(id),
  target_type      TEXT        NOT NULL,
  target_id        UUID        NOT NULL,
  action           TEXT        NOT NULL,
  old_data         JSONB,
  new_data         JSONB,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payroll_runs (
  id                       UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id              UUID        REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  month                    TEXT        NOT NULL,
  month_display            TEXT        NOT NULL,
  status                   TEXT        NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'completed')),
  pf_export_generated      BOOLEAN     DEFAULT FALSE,
  pt_export_generated      BOOLEAN     DEFAULT FALSE,
  whatsapp_sent_count      INTEGER     DEFAULT 0,
  total_gross              NUMERIC     NOT NULL DEFAULT 0,
  total_net                NUMERIC     NOT NULL DEFAULT 0,
  total_pf_employee        NUMERIC     NOT NULL DEFAULT 0,
  total_pf_employer        NUMERIC     NOT NULL DEFAULT 0,
  total_esi_employee       NUMERIC     NOT NULL DEFAULT 0,
  total_esi_employer       NUMERIC     NOT NULL DEFAULT 0,
  total_professional_tax   NUMERIC     NOT NULL DEFAULT 0,
  employee_count           INTEGER     NOT NULL DEFAULT 0,
  draft_data               JSONB,
  run_at                   TIMESTAMPTZ,
  created_at               TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_id, month)
);

CREATE TABLE IF NOT EXISTS employee_payroll (
  id                UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  payroll_run_id    UUID        REFERENCES payroll_runs(id) ON DELETE CASCADE,
  employee_id       UUID        REFERENCES employees(id),
  employee_name     TEXT        NOT NULL,
  role              TEXT,
  days_present      NUMERIC     DEFAULT 0,
  paid_leaves       NUMERIC     DEFAULT 0,
  unpaid_leaves     NUMERIC     DEFAULT 0,
  overtime_hours    NUMERIC     DEFAULT 0,
  bonus             NUMERIC     DEFAULT 0,
  base_salary_earned NUMERIC    DEFAULT 0,
  overtime_pay       NUMERIC    DEFAULT 0,
  gross_salary       NUMERIC    DEFAULT 0,
  pf_employee        NUMERIC    DEFAULT 0,
  pf_employer        NUMERIC    DEFAULT 0,
  esi_employee       NUMERIC    DEFAULT 0,
  esi_employer       NUMERIC    DEFAULT 0,
  professional_tax   NUMERIC    DEFAULT 0,
  total_deductions   NUMERIC    DEFAULT 0,
  net_salary         NUMERIC    DEFAULT 0,
  created_at         TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_payroll ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own business" ON businesses FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "Owners can manage their employees" ON employees FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));
CREATE POLICY "Magic Link: Employees can view own pending record" ON employees FOR SELECT USING (magic_link_token IS NOT NULL AND onboarding_status = 'pending');
CREATE POLICY "Magic Link: Employees can update own pending record" ON employees FOR UPDATE USING (magic_link_token IS NOT NULL AND onboarding_status = 'pending') WITH CHECK (magic_link_token IS NOT NULL AND onboarding_status = 'pending');
CREATE POLICY "Owners can view their business audit logs" ON audit_logs FOR SELECT USING (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));
CREATE POLICY "Owners can manage their payroll runs" ON payroll_runs FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()));
CREATE POLICY "Owners can view their employee payroll records" ON employee_payroll FOR SELECT USING (payroll_run_id IN (SELECT id FROM payroll_runs WHERE business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())));
CREATE POLICY "Owners can manage their employee payroll records" ON employee_payroll FOR ALL USING (payroll_run_id IN (SELECT id FROM payroll_runs WHERE business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid()))) WITH CHECK (payroll_run_id IN (SELECT id FROM payroll_runs WHERE business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())));

CREATE OR REPLACE FUNCTION update_timestamp() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER set_updated_at_businesses BEFORE UPDATE ON businesses FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER set_updated_at_employees BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_timestamp();
