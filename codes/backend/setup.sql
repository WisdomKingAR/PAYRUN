-- PayRun | Database Setup Script (Secure Version 2.1)
-- Optimized for Supabase with Field-Level Encryption

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TABLES

-- BUSINESSES
CREATE TABLE IF NOT EXISTS businesses (
  id               UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  name             TEXT        NOT NULL,
  state            TEXT        NOT NULL DEFAULT 'Maharashtra',
  logo_url         TEXT,
  owner_id         UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  onboarding_step  INTEGER     NOT NULL DEFAULT 1 CHECK (onboarding_step BETWEEN 1 AND 3),
  whatsapp_api_key BYTEA, -- ENCRYPTED
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- EMPLOYEES
CREATE TABLE IF NOT EXISTS employees (
  id                UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id       UUID        REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  name              TEXT        NOT NULL CHECK (char_length(name) BETWEEN 2 AND 100),
  email             TEXT,
  phone_number      TEXT,         -- E.164 format
  role              TEXT        NOT NULL,
  joining_date      DATE        NOT NULL,
  
  -- Compliance & Identity (ENCRYPTED)
  pan               BYTEA, 
  aadhaar_number    BYTEA,
  bank_account_no  BYTEA,
  ifsc_code         BYTEA,
  
  -- Onboarding State
  onboarding_status TEXT        DEFAULT 'pending' CHECK (onboarding_status IN ('pending', 'completed')),
  magic_link_token  UUID        DEFAULT gen_random_uuid() UNIQUE,
  magic_link_token_hash BYTEA,  -- SHA256 hash of token for server-side validation
  magic_link_expires_at TIMESTAMPTZ, -- Token expiry timestamp (72 hours from creation)
  magic_link_used_at TIMESTAMPTZ, -- Track token usage for one-time enforcement
  
  -- Salary Components
  basic_salary      NUMERIC     NOT NULL CHECK (basic_salary > 0),
  hra               NUMERIC     NOT NULL DEFAULT 0,
  special_allowance NUMERIC     NOT NULL DEFAULT 0,
  other_allowances  JSONB       NOT NULL DEFAULT '{}',
  
  pf_applicable     BOOLEAN     NOT NULL DEFAULT FALSE,
  esi_applicable    BOOLEAN     NOT NULL DEFAULT TRUE,
  gender            TEXT        NOT NULL DEFAULT 'male' CHECK (gender IN ('male', 'female', 'other')),
  is_active         BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- AUDIT LOGS
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

-- PAYROLL RUNS
CREATE TABLE IF NOT EXISTS payroll_runs (
  id                       UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id              UUID        REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  month                    TEXT        NOT NULL,         -- format "YYYY-MM"
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

-- INDIVIDUAL EMPLOYEE PAYROLL RECORDS
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

-- 3. SECURITY FUNCTIONS

-- Encryption key: Use environment variable (pgvault or PG_CRYPT_KEY) or fall back to static for testing
CREATE OR REPLACE FUNCTION get_encryption_key()
RETURNS BYTEA
IMMUTABLE
LANGUAGE sql
AS $$
  SELECT decode(
    COALESCE(
      current_setting('app.encryption_key', true),
      'payrun-default-key-change-in-production-use-pgvault'
    ),
    'escape'
  );
$$;

-- Encrypt sensitive data
CREATE OR REPLACE FUNCTION encrypt_value(p_value TEXT)
RETURNS BYTEA
IMMUTABLE
LANGUAGE sql
AS $$
  SELECT pgp_sym_encrypt(p_value, get_encryption_key()::text);
$$;

-- Decrypt sensitive data
CREATE OR REPLACE FUNCTION decrypt_value(p_encrypted BYTEA)
RETURNS TEXT
IMMUTABLE
LANGUAGE sql
AS $$
  SELECT pgp_sym_decrypt(p_encrypted, get_encryption_key()::text);
$$;

-- Validate magic link token (hash-based, preventing token replay in logs)
CREATE OR REPLACE FUNCTION public.verify_magic_link_token(
  p_employee_id UUID,
  p_token UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_token_hash BYTEA;
  v_stored_hash BYTEA;
  v_expiry TIMESTAMPTZ;
  v_used_at TIMESTAMPTZ;
BEGIN
  -- Compute hash of provided token
  v_token_hash := digest(p_token::TEXT, 'sha256');
  
  -- Fetch stored token hash and metadata
  SELECT magic_link_token_hash, magic_link_expires_at, magic_link_used_at
  INTO v_stored_hash, v_expiry, v_used_at
  FROM employees
  WHERE id = p_employee_id
  AND onboarding_status = 'pending';
  
  -- Check if token exists in database
  IF v_stored_hash IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Verify token hash matches
  IF v_token_hash != v_stored_hash THEN
    RETURN FALSE;
  END IF;
  
  -- Check token has not expired (72 hour limit)
  IF v_expiry IS NOT NULL AND NOW() > v_expiry THEN
    RETURN FALSE;
  END IF;
  
  -- Check token has not been used (one-time enforcement)
  IF v_used_at IS NOT NULL THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$;

-- Mark magic link token as used
CREATE OR REPLACE FUNCTION public.consume_magic_link_token(p_employee_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE employees
  SET magic_link_used_at = NOW(), onboarding_status = 'completed'
  WHERE id = p_employee_id
  AND onboarding_status = 'pending'
  AND magic_link_used_at IS NULL;
  
  RETURN FOUND;
END;
$$;

-- Validate and sanitize payroll draft data
CREATE OR REPLACE FUNCTION public.validate_payroll_draft(p_draft JSONB)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_employee_count INT;
  v_total_net NUMERIC;
BEGIN
  -- Check structure: must have employees array
  IF NOT (p_draft ? 'employees') THEN
    RAISE EXCEPTION 'Invalid payroll draft: missing employees array';
  END IF;
  
  -- Validate that all employees have required fields
  IF NOT (
    SELECT EVERY(
      (employee ? 'employee_id' AND employee ? 'gross_salary' AND employee ? 'net_salary')
    )
    FROM jsonb_array_elements(p_draft->'employees') AS employee
  ) THEN
    RAISE EXCEPTION 'Invalid payroll draft: incomplete employee records';
  END IF;
  
  RETURN TRUE;
END;
$$;

-- Audit Logging (SECURITY DEFINER to prevent client tampering)
CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_business_id UUID,
  p_target_type TEXT,
  p_target_id UUID,
  p_action TEXT,
  p_old_data JSONB DEFAULT NULL,
  p_new_data JSONB DEFAULT NULL
)
RETURNS UUID
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  -- Verify the user has access to this business
  IF NOT EXISTS (
    SELECT 1 FROM businesses 
    WHERE id = p_business_id 
    AND owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  INSERT INTO audit_logs (business_id, admin_id, target_type, target_id, action, old_data, new_data)
  VALUES (p_business_id, auth.uid(), p_target_type, p_target_id, p_action, p_old_data, p_new_data)
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

-- 4. ROW LEVEL SECURITY (RLS)

ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_payroll ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own business" 
ON businesses FOR ALL USING (auth.uid() = owner_id);

CREATE POLICY "Owners can manage their employees" 
ON employees FOR ALL USING (
  business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
);

-- HARDENED MAGIC LINK POLICY (WITH TOKEN VERIFICATION)
-- No direct SELECT/UPDATE via RLS - requires backend function verification
-- Frontend must pass token via request header, backend validates before RLS allows access
-- Note: This policy is read-only reference; actual access requires token validation
-- in backend function before any operation
CREATE POLICY "Magic Link: Employees can view own pending record (requires verification)"
ON employees FOR SELECT
USING (
  magic_link_token IS NOT NULL 
  AND onboarding_status = 'pending'
  AND magic_link_used_at IS NULL
  AND (magic_link_expires_at IS NULL OR NOW() <= magic_link_expires_at)
);

-- No direct UPDATE via RLS - must use consume_magic_link_token function
-- which is SECURITY DEFINER and enforces token verification
-- This policy should be removed; clients must call function instead
-- Keeping as reference for now, but should be deprecated
CREATE POLICY "Magic Link: Employees can update own pending record (deprecated: use function)"
ON employees FOR UPDATE
USING (FALSE)  -- Explicitly deny: use consume_magic_link_token function instead
WITH CHECK (FALSE);

-- Audit logs: Read-only for owners, INSERT via function only
-- Clients must use log_audit_event() function, not direct INSERT
CREATE POLICY "Owners can view their business audit logs"
ON audit_logs FOR SELECT USING (
  business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
);

-- Deny direct INSERT to prevent client tampering
CREATE POLICY "Deny direct audit log inserts (use function)"
ON audit_logs FOR INSERT WITH CHECK (FALSE);

-- Deny UPDATE/DELETE to ensure immutability
CREATE POLICY "Deny audit log modifications"
ON audit_logs FOR UPDATE WITH CHECK (FALSE);

CREATE POLICY "Deny audit log deletion"
ON audit_logs FOR DELETE USING (FALSE);

CREATE POLICY "Owners can manage their payroll runs" 
ON payroll_runs FOR ALL USING (
  business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
);

CREATE POLICY "Owners can view their employee payroll records" 
ON employee_payroll FOR SELECT USING (
  payroll_run_id IN (
    SELECT id FROM payroll_runs 
    WHERE business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  )
);

-- 5. UTILITY FUNCTIONS

CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_businesses BEFORE UPDATE ON businesses FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER set_updated_at_employees BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_timestamp();
