import { useEffect, useMemo, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import type { Employee, PayrollInputs } from '../types';
import { confirmPayrollRun, getEmployees, getPayrollRun, savePayrollDraft } from '../lib/payrunApi';
import { calculateEmployeePayroll, calculateMaxDaysForEmployee, summarizePayroll } from '../utils/payrollCalculations';
import { currentMonthKey, formatMoney, formatMonth } from '../utils/format';
import { useWorkspace } from '../hooks/useWorkspace';
import { getErrorMessage } from '../utils/errors';

const defaultInputsFor = (employee: Employee, month: string): PayrollInputs => {
  const maxDays = calculateMaxDaysForEmployee(new Date(employee.joining_date), month);
  return {
    daysPresent: maxDays,
    paidLeaves: 0,
    unpaidLeaves: 0,
    overtimeHours: 0,
    bonus: 0,
  };
};

export const PayrollRun = () => {
  const navigate = useNavigate();
  const { business, loading, error } = useWorkspace();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [inputs, setInputs] = useState<Record<string, PayrollInputs>>({});
  const [message, setMessage] = useState<{ type: 'success' | 'info' | 'warning' | 'error'; text: string } | null>(null);
  const [draftRestored, setDraftRestored] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const month = currentMonthKey();

  useEffect(() => {
    if (!business) return;

    Promise.all([getEmployees(business.id), getPayrollRun(business.id, month)])
      .then(([employeeRows, run]) => {
        setEmployees(employeeRows);

        const nextInputs = Object.fromEntries(
          employeeRows.map((employee) => [employee.id, run?.draft_data?.[employee.id] ?? defaultInputsFor(employee, month)]),
        );

        setInputs(nextInputs);
        setDraftRestored(Boolean(run?.draft_data));

        if (run?.status === 'completed') {
          setMessage({
            type: 'info',
            text: `${formatMonth(month)} payroll is already completed. Open history to view or amend it.`,
          });
        }
      })
      .catch((caught) => {
        setMessage({ type: 'error', text: getErrorMessage(caught, 'Could not load payroll draft.') });
      });
  }, [business, month]);

  const results = useMemo(() => {
    if (!business) return [];
    return employees.map((employee) =>
      calculateEmployeePayroll(employee, inputs[employee.id] ?? defaultInputsFor(employee, month), business.state, month),
    );
  }, [business, employees, inputs, month]);

  const summary = useMemo(() => summarizePayroll(results), [results]);

  const hasInvalidRows = employees.some((employee) => {
    const employeeInputs = inputs[employee.id] ?? defaultInputsFor(employee, month);
    const maxDays = calculateMaxDaysForEmployee(new Date(employee.joining_date), month);
    return employeeInputs.daysPresent + employeeInputs.paidLeaves > maxDays;
  });

  useEffect(() => {
    if (!business || employees.length === 0 || hasInvalidRows) return;

    const timeout = window.setTimeout(() => {
      savePayrollDraft(business.id, month, inputs).catch((caught) => {
        setMessage({ type: 'error', text: getErrorMessage(caught, 'Could not auto-save draft.') });
      });
    }, 800);

    return () => window.clearTimeout(timeout);
  }, [business, employees.length, hasInvalidRows, inputs, month]);

  const saveDraft = async () => {
    if (!business || employees.length === 0 || hasInvalidRows) return;

    setSavingDraft(true);
    try {
      await savePayrollDraft(business.id, month, inputs);
      setDraftRestored(true);
      setMessage({ type: 'success', text: 'Draft saved.' });
    } catch (caught) {
      setMessage({ type: 'error', text: getErrorMessage(caught, 'Could not save draft.') });
    } finally {
      setSavingDraft(false);
    }
  };

  const updateInput = (employee: Employee, key: keyof PayrollInputs, value: number) => {
    const maxDays = calculateMaxDaysForEmployee(new Date(employee.joining_date), month);
    const current = inputs[employee.id] ?? defaultInputsFor(employee, month);
    const next = { ...current, [key]: value };
    next.unpaidLeaves = Math.max(0, maxDays - next.daysPresent - next.paidLeaves);
    setInputs((state) => ({ ...state, [employee.id]: next }));

    if (key === 'bonus' || key === 'overtimeHours') {
      const preview = calculateEmployeePayroll(employee, next, business?.state ?? 'Maharashtra', month);
      if (employee.esi_applicable && preview.gross_salary > 21000) {
        setMessage({ type: 'warning', text: `ESI removed for ${employee.name}, gross exceeded Rs. 21,000.` });
      }
    }
  };

  const confirmRun = async () => {
    if (!business || hasInvalidRows) return;
    setSaving(true);

    try {
      await confirmPayrollRun(business.id, month, summary, results, inputs);
      navigate(`/payroll/history/${month}`);
    } catch (caught) {
      setMessage({ type: 'error', text: getErrorMessage(caught, 'Could not confirm payroll.') });
    } finally {
      setSaving(false);
      setConfirmOpen(false);
    }
  };

  if (loading) return <Typography>Loading payroll...</Typography>;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!business) return <Alert severity="error">Workspace not found.</Alert>;

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4">Run Payroll - {formatMonth(month)}</Typography>
        <Typography color="text.secondary">Bulk input table with live statutory deductions.</Typography>
      </Box>

      {business.state !== 'Maharashtra' && (
        <Alert severity="info">
          Professional Tax is currently supported for Maharashtra only. PT will show Rs. 0 for other states.
        </Alert>
      )}
      {draftRestored && <Alert severity="info">Draft restored from your last session.</Alert>}
      {employees.length === 0 && (
        <Alert
          severity="info"
          action={
            <Button component={RouterLink} to="/employees/new" color="inherit" size="small">
              Add Employee
            </Button>
          }
        >
          Add at least one employee before running payroll.
        </Alert>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 2 }}>
        <Card>
          <CardContent>
            <Typography variant="overline">Total Gross</Typography>
            <Typography variant="h5" className="money">{formatMoney(summary.total_gross)}</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="overline">Total Net</Typography>
            <Typography variant="h5" className="money" color="primary">{formatMoney(summary.total_net)}</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="overline">PF Liability</Typography>
            <Typography variant="h5" className="money">{formatMoney(summary.total_pf_employee + summary.total_pf_employer)}</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="overline">ESI Liability</Typography>
            <Typography variant="h5" className="money">{formatMoney(summary.total_esi_employee + summary.total_esi_employer)}</Typography>
          </CardContent>
        </Card>
      </Box>

      <TableContainer component={Card}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Employee</TableCell>
              <TableCell>Base Salary</TableCell>
              <TableCell>Days Present</TableCell>
              <TableCell>Paid Leaves</TableCell>
              <TableCell>Overtime Hrs</TableCell>
              <TableCell>Bonus</TableCell>
              <TableCell align="right">Est. Net Pay</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {employees.map((employee, index) => {
              const rowInputs = inputs[employee.id] ?? defaultInputsFor(employee, month);
              const maxDays = calculateMaxDaysForEmployee(new Date(employee.joining_date), month);
              const invalidDays = rowInputs.daysPresent + rowInputs.paidLeaves > maxDays;
              const result = results[index];

              return (
                <TableRow key={employee.id} hover>
                  <TableCell>
                    <Stack>
                      <Typography variant="subtitle2">{employee.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{employee.role}</Typography>
                      <Typography variant="caption" color="text.secondary">Max {maxDays} days this month</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell className="money">{formatMoney(employee.gross_salary)}</TableCell>
                  <TableCell>
                    <TextField
                      type="number"
                      value={rowInputs.daysPresent}
                      error={invalidDays}
                      slotProps={{ htmlInput: { min: 0, max: maxDays } }}
                      onChange={(event) => updateInput(employee, 'daysPresent', Number(event.target.value))}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      type="number"
                      value={rowInputs.paidLeaves}
                      error={invalidDays}
                      helperText={invalidDays ? `Max ${maxDays}` : undefined}
                      slotProps={{ htmlInput: { min: 0, max: maxDays } }}
                      onChange={(event) => updateInput(employee, 'paidLeaves', Number(event.target.value))}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      type="number"
                      value={rowInputs.overtimeHours}
                      slotProps={{ htmlInput: { min: 0, max: 200 } }}
                      onChange={(event) => updateInput(employee, 'overtimeHours', Number(event.target.value))}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      type="number"
                      value={rowInputs.bonus}
                      slotProps={{ htmlInput: { min: 0 } }}
                      onChange={(event) => updateInput(employee, 'bonus', Number(event.target.value))}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Typography className="money" color="primary" sx={{ fontWeight: 700 }}>
                      {formatMoney(result?.net_salary ?? 0)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      PT {formatMoney(result?.professional_tax ?? 0)}
                    </Typography>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
        <Button variant="contained" disabled={employees.length === 0 || hasInvalidRows} onClick={() => setConfirmOpen(true)}>
          Confirm & Run Payroll
        </Button>
        <Button variant="outlined" disabled={employees.length === 0 || hasInvalidRows || savingDraft} onClick={saveDraft}>
          {savingDraft ? 'Saving...' : 'Save Draft'}
        </Button>
      </Stack>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Confirm Payroll Run</DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <Typography>
              You are about to run payroll for {formatMonth(month)} for {summary.employee_count} employees.
            </Typography>
            <Typography className="money" sx={{ fontWeight: 700, color: 'primary.main' }}>
              Total net payable: {formatMoney(summary.total_net)}
            </Typography>
            {saving && <LinearProgress />}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Go Back</Button>
          <Button variant="contained" disabled={saving} onClick={confirmRun}>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={Boolean(message)} autoHideDuration={7000} onClose={() => setMessage(null)}>
        <Alert severity={message?.type ?? 'info'} onClose={() => setMessage(null)}>{message?.text}</Alert>
      </Snackbar>
    </Stack>
  );
};
