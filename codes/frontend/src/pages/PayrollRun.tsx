import { useEffect, useMemo, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  LinearProgress,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import DescriptionIcon from '@mui/icons-material/Description';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import PercentIcon from '@mui/icons-material/Percent';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import SaveIcon from '@mui/icons-material/Save';
import type { Employee, EmployeePayrollResult, PayrollInputs } from '../types';
import { confirmPayrollRun, getEmployees, getPayrollRun, savePayrollDraft } from '../lib/payrunApi';
import { calculateEmployeePayroll, calculateMaxDaysForEmployee, summarizePayroll } from '../utils/payrollCalculations';
import { currentMonthKey, formatMoney, formatMonth } from '../utils/format';
import { useWorkspace } from '../hooks/useWorkspace';
import { getErrorMessage } from '../utils/errors';
import { EmptyState } from '../components/EmptyState';
import { PageHeader } from '../components/PageHeader';
import { StatCard } from '../components/StatCard';

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

interface PayrollNumberFieldProps {
  label: string;
  value: number;
  error?: boolean;
  helperText?: string;
  max?: number;
  min?: number;
  readOnly?: boolean;
  onChange: (value: number) => void;
}

const PayrollNumberField = ({ label, value, error, helperText, min = 0, max, readOnly = false, onChange }: PayrollNumberFieldProps) => (
  <TextField
    label={label}
    type="number"
    value={value}
    error={error}
    helperText={helperText}
    slotProps={{ input: { readOnly }, htmlInput: { min, max } }}
    onChange={(event) => onChange(Number(event.target.value))}
    sx={{
      minWidth: 118,
      '& input': {
        textAlign: 'right',
        fontVariantNumeric: 'tabular-nums',
      },
    }}
  />
);

interface PayrollEmployeeCardProps {
  employee: Employee;
  inputs: PayrollInputs;
  result: EmployeePayrollResult;
  maxDays: number;
  invalidDays: boolean;
  onInputChange: (key: keyof PayrollInputs, value: number) => void;
}

const PayrollEmployeeCard = ({
  employee,
  inputs,
  result,
  maxDays,
  invalidDays,
  onInputChange,
}: PayrollEmployeeCardProps) => {
  const initials = employee.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return (
    <Card>
      <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
        <Stack spacing={2.25}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            sx={{ alignItems: { md: 'center' }, justifyContent: 'space-between' }}
          >
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', minWidth: 0 }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2,
                  display: 'grid',
                  placeItems: 'center',
                  bgcolor: '#EAF3FF',
                  color: 'primary.main',
                  fontWeight: 800,
                  flexShrink: 0,
                }}
              >
                {initials || 'PR'}
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 750 }}>
                  {employee.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {employee.role}
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
              <Chip size="small" label={`Max ${maxDays} days`} variant="outlined" />
              <Chip size="small" label={employee.pf_applicable ? 'PF on' : 'PF off'} color={employee.pf_applicable ? 'primary' : 'default'} variant="outlined" />
              <Chip size="small" label={employee.esi_applicable ? 'ESI on' : 'ESI off'} color={employee.esi_applicable ? 'success' : 'default'} variant="outlined" />
            </Stack>
          </Stack>

          <Divider />

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) 300px' },
              gap: 2.5,
              alignItems: 'stretch',
            }}
          >
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(5, minmax(0, 1fr))' },
                gap: 1.5,
              }}
            >
              <PayrollNumberField
                label="Days present"
                value={inputs.daysPresent}
                max={maxDays}
                error={invalidDays}
                helperText={invalidDays ? `Max ${maxDays}` : undefined}
                onChange={(value) => onInputChange('daysPresent', value)}
              />
              <PayrollNumberField
                label="Paid leaves"
                value={inputs.paidLeaves}
                max={maxDays}
                error={invalidDays}
                helperText={invalidDays ? `Max ${maxDays}` : undefined}
                onChange={(value) => onInputChange('paidLeaves', value)}
              />
              <PayrollNumberField
                label="Unpaid leaves"
                value={inputs.unpaidLeaves}
                readOnly
                helperText="Auto-set"
                onChange={(value) => onInputChange('unpaidLeaves', value)}
              />
              <PayrollNumberField
                label="Overtime hrs"
                value={inputs.overtimeHours}
                max={200}
                onChange={(value) => onInputChange('overtimeHours', value)}
              />
              <PayrollNumberField label="Bonus" value={inputs.bonus} onChange={(value) => onInputChange('bonus', value)} />
            </Box>

            <Box
              sx={{
                border: '1px solid #DDE5EE',
                borderRadius: 2,
                bgcolor: '#F8FBFD',
                p: 1.75,
              }}
            >
              <Stack spacing={1.25}>
                <Stack direction="row" sx={{ justifyContent: 'space-between', gap: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Gross
                  </Typography>
                  <Typography className="money" sx={{ fontWeight: 700 }}>
                    {formatMoney(result.gross_salary)}
                  </Typography>
                </Stack>
                <Stack direction="row" sx={{ justifyContent: 'space-between', gap: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Deductions
                  </Typography>
                  <Typography className="money" sx={{ fontWeight: 700 }}>
                    {formatMoney(result.total_deductions)}
                  </Typography>
                </Stack>
                <Divider />
                <Stack direction="row" sx={{ justifyContent: 'space-between', gap: 2, alignItems: 'baseline' }}>
                  <Typography variant="subtitle2">Net pay</Typography>
                  <Typography variant="h6" className="money" color="primary">
                    {formatMoney(result.net_salary)}
                  </Typography>
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  PT {formatMoney(result.professional_tax)}. PF employee {formatMoney(result.pf_employee)}. ESI employee{' '}
                  {formatMoney(result.esi_employee)}.
                </Typography>
              </Stack>
            </Box>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
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
  const [isAmendingCompletedRun, setIsAmendingCompletedRun] = useState(false);
  const month = currentMonthKey();

  useEffect(() => {
    if (!business) return;

    Promise.all([getEmployees(business.id), getPayrollRun(business.id, month)])
      .then(([employeeRows, run]) => {
        setEmployees(employeeRows);
        setIsAmendingCompletedRun(run?.status === 'completed');

        const nextInputs = Object.fromEntries(
          employeeRows.map((employee) => [employee.id, run?.draft_data?.[employee.id] ?? defaultInputsFor(employee, month)]),
        );

        setInputs(nextInputs);
        setDraftRestored(Boolean(run?.draft_data));

        if (run?.status === 'completed') {
          setMessage({
            type: 'info',
            text: `${formatMonth(month)} payroll is already completed. Changes here will amend the saved payroll for this month.`,
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
  const totalPfLiability = summary.total_pf_employee + summary.total_pf_employer;
  const totalEsiLiability = summary.total_esi_employee + summary.total_esi_employer;
  const totalStatutory = totalPfLiability + totalEsiLiability + summary.total_professional_tax;

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

  const actionButtons = (
    <>
      <Button variant="outlined" disabled={employees.length === 0 || hasInvalidRows || savingDraft} onClick={saveDraft} startIcon={<SaveIcon />}>
        {savingDraft ? 'Saving...' : 'Save draft'}
      </Button>
      <Button variant="contained" disabled={employees.length === 0 || hasInvalidRows || saving} onClick={() => setConfirmOpen(true)} startIcon={<DoneAllIcon />}>
        {isAmendingCompletedRun ? 'Update payroll' : 'Confirm run'}
      </Button>
    </>
  );

  if (loading) return <Typography>Loading payroll...</Typography>;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!business) return <Alert severity="error">Workspace not found.</Alert>;

  return (
    <Stack spacing={3}>
      <PageHeader
        eyebrow={isAmendingCompletedRun ? 'Amending completed run' : draftRestored ? 'Draft restored' : 'Current month'}
        title={`${isAmendingCompletedRun ? 'Amend' : 'Run'} payroll for ${formatMonth(month)}`}
        subtitle={
          isAmendingCompletedRun
            ? 'Update attendance, overtime, or bonus values and replace the saved payout rows for this month.'
            : 'Review attendance inputs, statutory deductions, and net pay before confirming payroll.'
        }
        meta={
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
            <Chip size="small" icon={<EventAvailableIcon />} label={formatMonth(month)} />
            <Chip size="small" label={`${employees.length} active employees`} variant="outlined" />
            <Chip size="small" label={hasInvalidRows ? 'Needs review' : 'Auto-save ready'} color={hasInvalidRows ? 'warning' : 'success'} variant="outlined" />
          </Stack>
        }
        actions={actionButtons}
      />

      {business.state !== 'Maharashtra' && (
        <Alert severity="info">
          Professional Tax is currently supported for Maharashtra only. PT will show Rs. 0 for other states.
        </Alert>
      )}
      {isAmendingCompletedRun && (
        <Alert severity="warning">
          Confirming again will replace the saved {formatMonth(month)} payroll totals and employee payout rows.
        </Alert>
      )}
      {draftRestored && <Alert severity="info">Draft restored from your last session.</Alert>}

      {employees.length === 0 ? (
        <EmptyState
          icon={<PersonAddIcon fontSize="large" />}
          title="No employees ready for payroll"
          description="Add at least one active employee before starting this month's payroll run."
          action={
            <Button component={RouterLink} to="/employees/new" variant="contained" startIcon={<PersonAddIcon />}>
              Add Employee
            </Button>
          }
        />
      ) : (
        <>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 2 }}>
            <StatCard
              label="Total gross"
              value={<Box component="span" className="money">{formatMoney(summary.total_gross)}</Box>}
              helper={`${summary.employee_count} employees included`}
              icon={<DescriptionIcon />}
            />
            <StatCard
              label="Total net"
              value={<Box component="span" className="money">{formatMoney(summary.total_net)}</Box>}
              helper="Amount payable to employees"
              icon={<AccountBalanceWalletIcon />}
              tone="green"
            />
            <StatCard
              label="PF and ESI"
              value={<Box component="span" className="money">{formatMoney(totalPfLiability + totalEsiLiability)}</Box>}
              helper={`PF ${formatMoney(totalPfLiability)}. ESI ${formatMoney(totalEsiLiability)}.`}
              icon={<PercentIcon />}
              tone="slate"
            />
            <StatCard
              label="Statutory total"
              value={<Box component="span" className="money">{formatMoney(totalStatutory)}</Box>}
              helper={`PT ${formatMoney(summary.total_professional_tax)}`}
              icon={<PercentIcon />}
              tone="amber"
            />
          </Box>

          <Stack spacing={1.5}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1.5}
              sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between' }}
            >
              <Box>
                <Typography variant="h6">Employee inputs</Typography>
                <Typography variant="body2" color="text.secondary">
                  Unpaid leaves are calculated automatically from max payable days.
                </Typography>
              </Box>
              {hasInvalidRows && <Chip color="warning" label="Attendance exceeds month limit" />}
            </Stack>

            {employees.map((employee, index) => {
              const rowInputs = inputs[employee.id] ?? defaultInputsFor(employee, month);
              const maxDays = calculateMaxDaysForEmployee(new Date(employee.joining_date), month);
              const invalidDays = rowInputs.daysPresent + rowInputs.paidLeaves > maxDays;

              return (
                <PayrollEmployeeCard
                  key={employee.id}
                  employee={employee}
                  inputs={rowInputs}
                  result={results[index]}
                  maxDays={maxDays}
                  invalidDays={invalidDays}
                  onInputChange={(key, value) => updateInput(employee, key, value)}
                />
              );
            })}
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ justifyContent: 'flex-end' }}>
            {actionButtons}
          </Stack>
        </>
      )}

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{isAmendingCompletedRun ? 'Update Payroll Run' : 'Confirm Payroll Run'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <Typography>
              {isAmendingCompletedRun ? 'You are about to update' : 'You are about to run'} payroll for {formatMonth(month)} for{' '}
              {summary.employee_count} employees.
            </Typography>
            <Box sx={{ border: '1px solid #DDE5EE', borderRadius: 2, p: 2, bgcolor: '#F8FBFD' }}>
              <Stack spacing={1}>
                <Stack direction="row" sx={{ justifyContent: 'space-between', gap: 2 }}>
                  <Typography color="text.secondary">Total gross</Typography>
                  <Typography className="money" sx={{ fontWeight: 700 }}>
                    {formatMoney(summary.total_gross)}
                  </Typography>
                </Stack>
                <Stack direction="row" sx={{ justifyContent: 'space-between', gap: 2 }}>
                  <Typography color="text.secondary">Statutory deductions</Typography>
                  <Typography className="money" sx={{ fontWeight: 700 }}>
                    {formatMoney(totalStatutory)}
                  </Typography>
                </Stack>
                <Divider />
                <Stack direction="row" sx={{ justifyContent: 'space-between', gap: 2, alignItems: 'baseline' }}>
                  <Typography variant="subtitle2">Total net payable</Typography>
                  <Typography variant="h6" className="money" color="primary">
                    {formatMoney(summary.total_net)}
                  </Typography>
                </Stack>
              </Stack>
            </Box>
            {saving && <LinearProgress />}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Go Back</Button>
          <Button variant="contained" disabled={saving} onClick={confirmRun}>
            {isAmendingCompletedRun ? 'Update payroll' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={Boolean(message)} autoHideDuration={7000} onClose={() => setMessage(null)}>
        <Alert severity={message?.type ?? 'info'} onClose={() => setMessage(null)}>
          {message?.text}
        </Alert>
      </Snackbar>
    </Stack>
  );
};
