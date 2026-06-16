import { describe, expect, it } from "vitest";
import {
  calculateEmployeePayroll,
  calculateProfessionalTax,
  calculatePFEmployee,
  calculateESIEmployee,
} from "./payrollCalculations";

const baseEmployee = {
  id: "emp-1",
  business_id: "biz-1",
  name: "Test Employee",
  email: null,
  phone_number: null,
  role: "Developer",
  joining_date: "2020-01-01",
  pan: null,
  aadhaar_number: null,
  bank_account_no: null,
  ifsc_code: null,
  onboarding_status: "completed" as const,
  magic_link_token: null,
  basic_salary: 15000,
  hra: 3000,
  special_allowance: 2000,
  other_allowances: {},
  gross_salary: 20000,
  pf_applicable: true,
  esi_applicable: true,
  gender: "male" as const,
  is_active: true,
  created_at: "2020-01-01",
  updated_at: "2020-01-01",
};

const standardInputs = {
  daysPresent: 26,
  paidLeaves: 0,
  unpaidLeaves: 0,
  overtimeHours: 0,
  bonus: 0,
};

describe("payrollCalculations", () => {
  it("calculates a standard salary run with PF, ESI, and Maharashtra PT", () => {
    const result = calculateEmployeePayroll(
      baseEmployee,
      standardInputs,
      "Maharashtra",
      "2026-05",
    );

    expect(result.gross_salary).toBe(20000);
    expect(result.pf_employee).toBe(1800);
    expect(result.esi_employee).toBe(150);
    expect(result.professional_tax).toBe(200);
    expect(result.total_deductions).toBe(2150);
    expect(result.net_salary).toBe(17850);
  });

  it("applies the PT floor and february surcharge correctly", () => {
    expect(
      calculateProfessionalTax(10000, "Maharashtra", "2026-03", "male"),
    ).toBe(175);
    expect(
      calculateProfessionalTax(11000, "Maharashtra", "2026-02", "male"),
    ).toBe(300);
    expect(
      calculateProfessionalTax(25000, "Maharashtra", "2026-05", "female"),
    ).toBe(0);
  });

  it("handles low salary with no PF or ESI deductions when not applicable", () => {
    const lowSalaryEmployee = {
      ...baseEmployee,
      basic_salary: 6000,
      gross_salary: 6000,
      pf_applicable: false,
      esi_applicable: false,
    };
    const result = calculateEmployeePayroll(
      lowSalaryEmployee,
      standardInputs,
      "Maharashtra",
      "2026-05",
    );

    expect(result.gross_salary).toBe(6000);
    expect(result.pf_employee).toBe(0);
    expect(result.esi_employee).toBe(0);
    expect(result.professional_tax).toBe(0);
    expect(result.net_salary).toBe(6000);
  });

  it("skips ESI for gross salary above the threshold", () => {
    const highGrossEmployee = { ...baseEmployee, gross_salary: 22000 };
    const result = calculateEmployeePayroll(
      highGrossEmployee,
      standardInputs,
      "Maharashtra",
      "2026-05",
    );

    expect(result.gross_salary).toBe(22000);
    expect(result.esi_employee).toBe(0);
    expect(result.professional_tax).toBe(200);
  });

  it("calculates PF and ESI helper functions consistently", () => {
    expect(calculatePFEmployee(15000, true)).toBe(1800);
    expect(calculateESIEmployee(21000, true)).toBe(157.5);
    expect(calculateESIEmployee(21001, true)).toBe(0);
  });
});
