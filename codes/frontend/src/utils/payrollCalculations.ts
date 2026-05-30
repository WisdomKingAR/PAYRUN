import type { Employee, EmployeePayrollResult, PayrollInputs } from '../types';

const WORKING_DAYS_PER_MONTH = 26;

export function calculateMaxDaysForEmployee(joiningDate: Date, month: string): number {
  const [year, monthNum] = month.split('-').map(Number);
  const firstOfMonth = new Date(year, monthNum - 1, 1);

  if (joiningDate <= firstOfMonth) return WORKING_DAYS_PER_MONTH;

  const daysInMonth = new Date(year, monthNum, 0).getDate();
  const daysAvailable = daysInMonth - joiningDate.getDate() + 1;
  return Math.min(WORKING_DAYS_PER_MONTH, Math.ceil((daysAvailable / daysInMonth) * WORKING_DAYS_PER_MONTH));
}

export function calculateEarnedSalary(grossSalary: number, daysPresent: number, paidLeaves: number): number {
  return (grossSalary / WORKING_DAYS_PER_MONTH) * (daysPresent + paidLeaves);
}

export function calculateOvertimePay(basicSalary: number, overtimeHours: number): number {
  return (basicSalary / WORKING_DAYS_PER_MONTH / 8) * 2 * overtimeHours;
}

export function calculatePFEmployee(basicSalary: number, pfApplicable: boolean): number {
  if (!pfApplicable) return 0;
  return Math.min(basicSalary * 0.12, 1800);
}

export function calculatePFEmployer(basicSalary: number, pfApplicable: boolean): number {
  if (!pfApplicable) return 0;
  return Math.min(basicSalary * 0.13, 1950);
}

export function calculateESIEmployee(grossSalary: number, esiApplicable: boolean): number {
  if (!esiApplicable || grossSalary > 21000) return 0;
  return grossSalary * 0.0075;
}

export function calculateESIEmployer(grossSalary: number, esiApplicable: boolean): number {
  if (!esiApplicable || grossSalary > 21000) return 0;
  return grossSalary * 0.0325;
}

export function calculateProfessionalTax(
  grossSalary: number,
  state: string,
  month: string,
  gender: 'male' | 'female' | 'other' = 'male',
): number {
  if (state !== 'Maharashtra') return 0;

  if (gender === 'female' && grossSalary <= 25000) return 0;
  if (grossSalary <= 7500) return 0;

  const isFebruary = month.endsWith('-02');
  if (grossSalary <= 10000) return 175;

  return isFebruary ? 300 : 200;
}

export function calculateEmployeePayroll(
  employee: Employee,
  inputs: PayrollInputs,
  state: string,
  month: string,
): EmployeePayrollResult {
  const { daysPresent, paidLeaves, unpaidLeaves, overtimeHours, bonus } = inputs;

  const earnedSalary = calculateEarnedSalary(employee.gross_salary, daysPresent, paidLeaves);
  const overtimePay = calculateOvertimePay(employee.basic_salary, overtimeHours);
  const grossThisMonth = earnedSalary + overtimePay + bonus;
  const esiApplicableThisMonth = employee.esi_applicable && grossThisMonth <= 21000;

  const pfEmployee = calculatePFEmployee(employee.basic_salary, employee.pf_applicable);
  const pfEmployer = calculatePFEmployer(employee.basic_salary, employee.pf_applicable);
  const esiEmployee = calculateESIEmployee(grossThisMonth, esiApplicableThisMonth);
  const esiEmployer = calculateESIEmployer(grossThisMonth, esiApplicableThisMonth);
  const pt = calculateProfessionalTax(grossThisMonth, state, month, employee.gender);

  const totalDeductions = pfEmployee + esiEmployee + pt;
  const netSalary = grossThisMonth - totalDeductions;

  return {
    employee_id: employee.id,
    employee_name: employee.name,
    role: employee.role,
    days_present: daysPresent,
    paid_leaves: paidLeaves,
    unpaid_leaves: unpaidLeaves,
    overtime_hours: overtimeHours,
    bonus,
    base_salary_earned: Math.round(earnedSalary),
    overtime_pay: Math.round(overtimePay),
    gross_salary: Math.round(grossThisMonth),
    pf_employee: Math.round(pfEmployee),
    pf_employer: Math.round(pfEmployer),
    esi_employee: Math.round(esiEmployee),
    esi_employer: Math.round(esiEmployer),
    professional_tax: pt,
    total_deductions: Math.round(totalDeductions),
    net_salary: Math.round(netSalary),
  };
}

export function summarizePayroll(results: EmployeePayrollResult[]) {
  return results.reduce(
    (summary, result) => ({
      total_gross: summary.total_gross + result.gross_salary,
      total_net: summary.total_net + result.net_salary,
      total_pf_employee: summary.total_pf_employee + result.pf_employee,
      total_pf_employer: summary.total_pf_employer + result.pf_employer,
      total_esi_employee: summary.total_esi_employee + result.esi_employee,
      total_esi_employer: summary.total_esi_employer + result.esi_employer,
      total_professional_tax: summary.total_professional_tax + result.professional_tax,
      employee_count: summary.employee_count + 1,
    }),
    {
      total_gross: 0,
      total_net: 0,
      total_pf_employee: 0,
      total_pf_employer: 0,
      total_esi_employee: 0,
      total_esi_employer: 0,
      total_professional_tax: 0,
      employee_count: 0,
    },
  );
}
