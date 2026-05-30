export type Gender = 'male' | 'female' | 'other';
export type PayrollStatus = 'draft' | 'completed';

export interface Business {
  id: string;
  name: string;
  state: string;
  logo_url: string | null;
  owner_id: string;
  onboarding_step: 1 | 2 | 3;
  whatsapp_api_key: string | null;
  created_at: string;
  updated_at: string;
}

export interface Employee {
  id: string;
  business_id: string;
  name: string;
  email: string | null;
  phone_number: string | null;
  role: string;
  joining_date: string;
  pan: string | null;
  aadhaar_number: string | null;
  bank_account_no: string | null;
  ifsc_code: string | null;
  onboarding_status: 'pending' | 'completed';
  magic_link_token: string | null;
  basic_salary: number;
  hra: number;
  special_allowance: number;
  other_allowances: Record<string, number>;
  gross_salary: number;
  pf_applicable: boolean;
  esi_applicable: boolean;
  gender: Gender;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmployeeInput {
  name: string;
  email?: string | null;
  phone_number?: string | null;
  role: string;
  joining_date: string;
  pan?: string | null;
  aadhaar_number?: string | null;
  bank_account_no?: string | null;
  ifsc_code?: string | null;
  basic_salary: number;
  hra: number;
  special_allowance: number;
  other_allowances?: Record<string, number>;
  pf_applicable: boolean;
  esi_applicable: boolean;
  gender: Gender;
  onboarding_status?: 'pending' | 'completed';
  is_active?: boolean;
}

export interface PayrollInputs {
  daysPresent: number;
  paidLeaves: number;
  unpaidLeaves: number;
  overtimeHours: number;
  bonus: number;
}

export interface EmployeePayrollResult {
  employee_id: string;
  employee_name: string;
  role: string;
  days_present: number;
  paid_leaves: number;
  unpaid_leaves: number;
  overtime_hours: number;
  bonus: number;
  base_salary_earned: number;
  overtime_pay: number;
  gross_salary: number;
  pf_employee: number;
  pf_employer: number;
  esi_employee: number;
  esi_employer: number;
  professional_tax: number;
  total_deductions: number;
  net_salary: number;
}

export interface PayrollRunSummary {
  total_gross: number;
  total_net: number;
  total_pf_employee: number;
  total_pf_employer: number;
  total_esi_employee: number;
  total_esi_employer: number;
  total_professional_tax: number;
  employee_count: number;
}

export interface PayrollRun extends PayrollRunSummary {
  id: string;
  business_id: string;
  month: string;
  month_display: string;
  status: PayrollStatus;
  pf_export_generated: boolean;
  pt_export_generated: boolean;
  whatsapp_sent_count: number;
  draft_data: Record<string, PayrollInputs> | null;
  run_at: string | null;
  created_at: string;
  employee_payroll?: EmployeePayrollResult[];
}
