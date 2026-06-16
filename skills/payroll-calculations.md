# PayRun Payroll Calculations Skill

## File focus

Primary file: `frontend/src/utils/payrollCalculations.ts`.

## What the file does

This module computes payroll values for each employee, including:

- earned salary based on days present and paid leaves
- overtime pay
- PF deductions and contributions
- ESI deductions and contributions
- Maharashtra professional tax (PT)
- gross salary, total deductions, and net salary

## Rules and constraints

- Do not silently change the meaning of an existing payroll field.
- Any logic change must be backed by corresponding test coverage.
- Maintain current statutory rules for PF, ESI, and Maharashtra PT.
- Preserve the existing rounding behavior in the output model.

## Testing requirements

- Add or update tests for PT slabs and Maharashtra rules.
- Verify PF and ESI thresholds and percentages.
- Cover low salary, high salary, and mixed deduction cases.
- Assert gross salary, PF, ESI, PT, and net salary consistency.

## How to extend

To add a new payroll allowance or deduction:

1. Document the input fields required in the payroll input model.
2. Update `calculateEmployeePayroll` to include the new item in gross/deduction logic.
3. Add or update tests verifying the new output field and the final net salary.
4. Keep the new field isolated and clearly named in `EmployeePayrollResult`.
