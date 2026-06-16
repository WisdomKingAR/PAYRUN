import type { User } from "@supabase/supabase-js";
import { supabase } from "./supabaseClient";
import type {
  Business,
  Employee,
  EmployeeInput,
  EmployeePayrollResult,
  PayrollInputs,
  PayrollRun,
  PayrollRunSummary,
} from "../types";
import { formatMonth, toNumber } from "../utils/format";

type RawRow = Record<string, unknown>;

const asRecord = (value: unknown): RawRow =>
  value && typeof value === "object" ? (value as RawRow) : {};

const normalizeBusiness = (row: RawRow): Business => ({
  id: String(row.id),
  name: String(row.name ?? ""),
  state: String(row.state ?? "Maharashtra"),
  logo_url: row.logo_url ? String(row.logo_url) : null,
  owner_id: String(row.owner_id),
  onboarding_step: toNumber(row.onboarding_step, 1) as 1 | 2 | 3,
  whatsapp_api_key: row.whatsapp_api_key ? String(row.whatsapp_api_key) : null,
  created_at: String(row.created_at ?? ""),
  updated_at: String(row.updated_at ?? ""),
});

const normalizeEmployee = (row: RawRow): Employee => {
  const basic = toNumber(row.basic_salary);
  const hra = toNumber(row.hra);
  const special = toNumber(row.special_allowance);
  const otherAllowances = asRecord(row.other_allowances);
  const normalizedOther = Object.fromEntries(
    Object.entries(otherAllowances).map(([key, value]) => [
      key,
      toNumber(value),
    ]),
  );

  return {
    id: String(row.id),
    business_id: String(row.business_id),
    name: String(row.name ?? ""),
    email: row.email ? String(row.email) : null,
    phone_number: row.phone_number ? String(row.phone_number) : null,
    role: String(row.role ?? ""),
    joining_date: String(row.joining_date ?? ""),
    pan: row.pan ? String(row.pan) : null,
    aadhaar_number: row.aadhaar_number ? String(row.aadhaar_number) : null,
    bank_account_no: row.bank_account_no ? String(row.bank_account_no) : null,
    ifsc_code: row.ifsc_code ? String(row.ifsc_code) : null,
    onboarding_status:
      row.onboarding_status === "completed" ? "completed" : "pending",
    magic_link_token: row.magic_link_token
      ? String(row.magic_link_token)
      : null,
    basic_salary: basic,
    hra,
    special_allowance: special,
    other_allowances: normalizedOther,
    gross_salary: toNumber(row.gross_salary, basic + hra + special),
    pf_applicable: Boolean(row.pf_applicable),
    esi_applicable: row.esi_applicable === false ? false : true,
    gender:
      row.gender === "female" || row.gender === "other" ? row.gender : "male",
    is_active: row.is_active === false ? false : true,
    created_at: String(row.created_at ?? ""),
    updated_at: String(row.updated_at ?? ""),
  };
};

const normalizePayrollResult = (row: RawRow): EmployeePayrollResult => ({
  employee_id: String(row.employee_id),
  employee_name: String(row.employee_name ?? ""),
  role: String(row.role ?? ""),
  days_present: toNumber(row.days_present),
  paid_leaves: toNumber(row.paid_leaves),
  unpaid_leaves: toNumber(row.unpaid_leaves),
  overtime_hours: toNumber(row.overtime_hours),
  bonus: toNumber(row.bonus),
  base_salary_earned: toNumber(row.base_salary_earned),
  overtime_pay: toNumber(row.overtime_pay),
  gross_salary: toNumber(row.gross_salary),
  pf_employee: toNumber(row.pf_employee),
  pf_employer: toNumber(row.pf_employer),
  esi_employee: toNumber(row.esi_employee),
  esi_employer: toNumber(row.esi_employer),
  professional_tax: toNumber(row.professional_tax),
  total_deductions: toNumber(row.total_deductions),
  net_salary: toNumber(row.net_salary),
});

const normalizePayrollRun = (row: RawRow): PayrollRun => {
  const payrollRows = Array.isArray(row.employee_payroll)
    ? row.employee_payroll.map((item) => normalizePayrollResult(asRecord(item)))
    : undefined;
  const draftData = asRecord(row.draft_data);

  return {
    id: String(row.id),
    business_id: String(row.business_id),
    month: String(row.month ?? ""),
    month_display: String(row.month_display ?? ""),
    status: row.status === "completed" ? "completed" : "draft",
    pf_export_generated: Boolean(row.pf_export_generated),
    pt_export_generated: Boolean(row.pt_export_generated),
    whatsapp_sent_count: toNumber(row.whatsapp_sent_count),
    total_gross: toNumber(row.total_gross),
    total_net: toNumber(row.total_net),
    total_pf_employee: toNumber(row.total_pf_employee),
    total_pf_employer: toNumber(row.total_pf_employer),
    total_esi_employee: toNumber(row.total_esi_employee),
    total_esi_employer: toNumber(row.total_esi_employer),
    total_professional_tax: toNumber(row.total_professional_tax),
    employee_count: toNumber(row.employee_count),
    draft_data: row.draft_data
      ? (draftData as Record<string, PayrollInputs>)
      : null,
    run_at: row.run_at ? String(row.run_at) : null,
    created_at: String(row.created_at ?? ""),
    employee_payroll: payrollRows,
  };
};

export async function logAudit(
  businessId: string,
  adminId: string,
  targetType: string,
  targetId: string,
  action: string,
  oldData?: unknown,
  newData?: unknown,
) {
  await supabase.from("audit_logs").insert({
    business_id: businessId,
    admin_id: adminId,
    target_type: targetType,
    target_id: targetId,
    action,
    old_data: oldData,
    new_data: newData,
  });
}

const attachEmployeePayrollRows = async (runs: PayrollRun[]) => {
  const runIds = runs.map((run) => run.id);
  if (runIds.length === 0) return runs;
  const { data, error } = await supabase
    .from("employee_payroll")
    .select("*")
    .in("payroll_run_id", runIds)
    .order("created_at", { ascending: true });
  if (error) throw error;
  const rowsByRun = new Map<string, EmployeePayrollResult[]>();
  (data ?? []).forEach((row) => {
    const record = asRecord(row);
    const runId = String(record.payroll_run_id ?? "");
    const rows = rowsByRun.get(runId) ?? [];
    rows.push(normalizePayrollResult(record));
    rowsByRun.set(runId, rows);
  });
  return runs.map((run) => ({
    ...run,
    employee_payroll: rowsByRun.get(run.id) ?? run.employee_payroll ?? [],
  }));
};

export async function createBusiness(name: string, userId: string) {
  const { data, error } = await supabase
    .from("businesses")
    .insert({
      name,
      owner_id: userId,
      state: "Maharashtra",
      onboarding_step: 1,
    })
    .select()
    .single();
  if (error) throw error;
  const business = normalizeBusiness(asRecord(data));
  await logAudit(
    business.id,
    userId,
    "business",
    business.id,
    "create",
    null,
    business,
  );
  return business;
}

export async function getBusiness(userId: string) {
  const { data, error } = await supabase
    .from("businesses")
    .select("*")
    .eq("owner_id", userId)
    .order("created_at", { ascending: true })
    .limit(1);
  if (error) throw error;
  return data?.[0] ? normalizeBusiness(asRecord(data[0])) : null;
}

export async function ensureBusiness(user: User) {
  const existing = await getBusiness(user.id);
  if (existing) return existing;
  const businessName =
    typeof user.user_metadata.business_name === "string" &&
    user.user_metadata.business_name.trim()
      ? user.user_metadata.business_name.trim()
      : "My Business";
  return createBusiness(businessName, user.id);
}

export async function updateBusiness(
  businessId: string,
  updates: Partial<
    Pick<
      Business,
      "name" | "state" | "logo_url" | "onboarding_step" | "whatsapp_api_key"
    >
  >,
) {
  const { data: oldData } = await supabase
    .from("businesses")
    .select("*")
    .eq("id", businessId)
    .single();
  const { data, error } = await supabase
    .from("businesses")
    .update(updates)
    .eq("id", businessId)
    .select()
    .single();
  if (error) throw error;
  const business = normalizeBusiness(asRecord(data));
  const user = (await supabase.auth.getUser()).data.user;
  if (user)
    await logAudit(
      businessId,
      user.id,
      "business",
      businessId,
      "update",
      oldData,
      business,
    );
  return business;
}

export async function updateOnboardingStep(
  businessId: string,
  step: 1 | 2 | 3,
) {
  return updateBusiness(businessId, { onboarding_step: step });
}

export async function getEmployees(
  businessId: string,
  options: { includeInactive?: boolean } = {},
) {
  let query = supabase
    .from("employees")
    .select("*")
    .eq("business_id", businessId);
  if (!options.includeInactive) query = query.eq("is_active", true);
  const { data, error } = await query.order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => normalizeEmployee(asRecord(row)));
}

export async function getEmployee(employeeId: string) {
  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .eq("id", employeeId)
    .single();
  if (error) throw error;
  return normalizeEmployee(asRecord(data));
}

export async function addEmployee(businessId: string, employee: EmployeeInput) {
  const { data, error } = await supabase
    .from("employees")
    .insert({
      ...employee,
      business_id: businessId,
      onboarding_status: employee.onboarding_status ?? "completed",
    })
    .select()
    .single();
  if (error) throw error;
  const newEmployee = normalizeEmployee(asRecord(data));
  const user = (await supabase.auth.getUser()).data.user;
  if (user)
    await logAudit(
      businessId,
      user.id,
      "employee",
      newEmployee.id,
      "create",
      null,
      newEmployee,
    );
  return newEmployee;
}

export async function updateEmployee(
  employeeId: string,
  updates: Partial<EmployeeInput>,
) {
  const { data: oldData } = await supabase
    .from("employees")
    .select("*")
    .eq("id", employeeId)
    .single();
  const { data, error } = await supabase
    .from("employees")
    .update(updates)
    .eq("id", employeeId)
    .select()
    .single();
  if (error) throw error;
  const updatedEmployee = normalizeEmployee(asRecord(data));
  const user = (await supabase.auth.getUser()).data.user;
  if (user)
    await logAudit(
      updatedEmployee.business_id,
      user.id,
      "employee",
      employeeId,
      "update",
      oldData,
      updatedEmployee,
    );
  return updatedEmployee;
}

export async function getPayrollRun(businessId: string, month: string) {
  const { data, error } = await supabase
    .from("payroll_runs")
    .select("*")
    .eq("business_id", businessId)
    .eq("month", month)
    .order("created_at", { ascending: false })
    .limit(1);
  if (error) throw error;
  if (!data?.[0]) return null;
  const [run] = await attachEmployeePayrollRows([
    normalizePayrollRun(asRecord(data[0])),
  ]);
  return run;
}

export async function savePayrollDraft(
  businessId: string,
  month: string,
  draftData: Record<string, PayrollInputs>,
) {
  const { data: existingRows, error: lookupError } = await supabase
    .from("payroll_runs")
    .select("id,status")
    .eq("business_id", businessId)
    .eq("month", month)
    .order("created_at", { ascending: false })
    .limit(1);
  if (lookupError) throw lookupError;
  const existing = existingRows?.[0];
  if (existing) {
    const { error } = await supabase
      .from("payroll_runs")
      .update({
        month_display: formatMonth(month),
        status: existing.status === "completed" ? "completed" : "draft",
        draft_data: draftData,
      })
      .eq("id", existing.id);
    if (error) throw error;
    return;
  }
  const { error } = await supabase
    .from("payroll_runs")
    .insert({
      business_id: businessId,
      month,
      month_display: formatMonth(month),
      status: "draft",
      draft_data: draftData,
    });
  if (error) throw error;
}

export async function confirmPayrollRun(
  businessId: string,
  month: string,
  summary: PayrollRunSummary,
  employeeResults: EmployeePayrollResult[],
  draftData: Record<string, PayrollInputs>,
) {
  const { data: existingRows, error: lookupError } = await supabase
    .from("payroll_runs")
    .select("id,status")
    .eq("business_id", businessId)
    .eq("month", month)
    .order("created_at", { ascending: false })
    .limit(1);
  if (lookupError) throw lookupError;
  const existing = existingRows?.[0];
  let payrollRunId: string;
  if (existing) {
    const { data: run, error: runError } = await supabase
      .from("payroll_runs")
      .update({
        month_display: formatMonth(month),
        status: "completed",
        ...summary,
        run_at: new Date().toISOString(),
        draft_data: draftData,
      })
      .eq("id", existing.id)
      .select()
      .single();
    if (runError) throw runError;
    payrollRunId = normalizePayrollRun(asRecord(run)).id;
  } else {
    const { data: run, error: runError } = await supabase
      .from("payroll_runs")
      .insert({
        business_id: businessId,
        month,
        month_display: formatMonth(month),
        status: "completed",
        ...summary,
        run_at: new Date().toISOString(),
        draft_data: draftData,
      })
      .select()
      .single();
    if (runError) throw runError;
    payrollRunId = normalizePayrollRun(asRecord(run)).id;
  }
  const { error: deleteError } = await supabase
    .from("employee_payroll")
    .delete()
    .eq("payroll_run_id", payrollRunId);
  if (deleteError) throw deleteError;
  const { error: employeeError } = await supabase
    .from("employee_payroll")
    .insert(
      employeeResults.map((result) => ({
        ...result,
        payroll_run_id: payrollRunId,
      })),
    );
  if (employeeError) throw employeeError;
  const user = (await supabase.auth.getUser()).data.user;
  if (user)
    await logAudit(
      businessId,
      user.id,
      "payroll",
      payrollRunId,
      "confirm",
      null,
      summary,
    );
  return getPayrollRun(businessId, month);
}

export async function getPayrollHistory(businessId: string) {
  const { data, error } = await supabase
    .from("payroll_runs")
    .select("*")
    .eq("business_id", businessId)
    .eq("status", "completed")
    .order("month", { ascending: false });
  if (error) throw error;
  return attachEmployeePayrollRows(
    (data ?? []).map((row) => normalizePayrollRun(asRecord(row))),
  );
}

export async function listEmployeesWithPayroll(businessId: string) {
  const [employees, payrollHistory] = await Promise.all([
    getEmployees(businessId),
    getPayrollHistory(businessId),
  ]);
  return { employees, payrollHistory };
}

export async function getPayrollForMonth(businessId: string, month: string) {
  return getPayrollRun(businessId, month);
}
