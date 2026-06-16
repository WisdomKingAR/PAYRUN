import { useEffect, useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Alert, Box, Button, Card, CardContent, Chip, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField, Typography } from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import GroupsIcon from '@mui/icons-material/Groups';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import type { Employee, PayrollRun } from '../types';
import { getEmployees, getPayrollHistory, updateBusiness, updateOnboardingStep } from '../lib/payrunApi';
import { currentMonthKey, formatMoney, formatMonth } from '../utils/format';
import { useWorkspace } from '../hooks/useWorkspace';
import { EmptyState } from '../components/EmptyState';
import { PageHeader } from '../components/PageHeader';
import { StatCard } from '../components/StatCard';

export const Dashboard = () => {
  const { business, loading, error, refresh, setBusiness } = useWorkspace();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [history, setHistory] = useState<PayrollRun[]>([]);
  const [companyDialogOpen, setCompanyDialogOpen] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [state, setState] = useState('Maharashtra');
  const [saving, setSaving] = useState(false);
  const month = currentMonthKey();

  useEffect(() => {
    if (!business) return;
    setCompanyName(business.name);
    setState(business.state);
    setCompanyDialogOpen(business.onboarding_step === 1);
    Promise.all([getEmployees(business.id), getPayrollHistory(business.id)]).then(([employeeRows, historyRows]) => {
      setEmployees(employeeRows);
      setHistory(historyRows);
    });
  }, [business]);

  const currentRun = useMemo(() => history.find((run) => run.month === month), [history, month]);
  const latestNet = history[0]?.total_net ?? 0;
  const needsPayrollAmendment = Boolean(currentRun && currentRun.employee_count !== employees.length);
  const primaryPayrollPath = currentRun && !needsPayrollAmendment ? `/payroll/history/${month}` : '/payroll/run';
  const primaryPayrollLabel = currentRun ? (needsPayrollAmendment ? 'Amend payroll' : 'View payroll') : 'Run payroll';

  const saveCompany = async () => {
    if (!business || companyName.trim().length < 2) return;
    setSaving(true);
    const updated = await updateBusiness(business.id, { name: companyName.trim(), state, onboarding_step: 2 });
    setBusiness(updated);
    setCompanyDialogOpen(false);
    setSaving(false);
  };

  useEffect(() => {
    if (!business || business.onboarding_step !== 2 || employees.length === 0) return;
    updateOnboardingStep(business.id, 3).then(() => { refresh(); });
  }, [business, employees.length, refresh]);

  if (loading) return <Typography>Loading workspace...</Typography>;
  if (error) {
    return (
      <Stack spacing={2}>
        <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => refresh()}>Retry</Button>}>{error}</Alert>
        <Alert severity="info">If this mentions RLS or missing columns, run the latest Supabase SQL in backend/setup.sql and refresh this page.</Alert>
      </Stack>
    );
  }
  if (!business) return <Alert severity="error">Workspace not found.</Alert>;

  return (
    <Stack spacing={3}>
      <PageHeader eyebrow={business.state} title={`${business.name} dashboard`} subtitle="A quick payroll control room for this month, your team, and recent payroll activity." actions={<><Button component={RouterLink} to="/employees/new" variant="outlined" startIcon={<GroupAddIcon />}>Add employee</Button><Button component={RouterLink} to={primaryPayrollPath} variant="contained" startIcon={<PlayCircleIcon />}>{primaryPayrollLabel}</Button></>} />
      {business.onboarding_step === 2 && (<Alert severity="info" action={<Button component={RouterLink} to="/employees/new" color="inherit" size="small">Add Employee</Button>}>Add your first employee to finish onboarding.</Alert>)}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
        <StatCard label="Team size" value={employees.length} helper="Active payroll records" icon={<GroupsIcon />} />
        <StatCard label="Last net payroll" value={<Box component="span" className="money">{formatMoney(latestNet)}</Box>} helper={history[0] ? history[0].month_display : 'No confirmed run yet'} icon={<AccountBalanceWalletIcon />} tone="green" />
        <StatCard label="Current month" value={formatMonth(month)} helper={<Chip label={needsPayrollAmendment ? 'Needs amendment' : currentRun ? 'Completed' : 'Ready to run'} color={needsPayrollAmendment ? 'warning' : currentRun ? 'success' : 'primary'} size="small" />} icon={<CalendarMonthIcon />} tone={currentRun && !needsPayrollAmendment ? 'green' : 'amber'} />
      </Box>
      {employees.length === 0 ? (
        <EmptyState icon={<GroupAddIcon fontSize="large" />} title="No employees yet" description="Add your first employee to unlock payroll runs, history, and exportable reports." action={<Button component={RouterLink} to="/employees/new" variant="contained" startIcon={<GroupAddIcon />}>Add First Employee</Button>} />
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.35fr 1fr' }, gap: 2 }}>
          <Card><CardContent sx={{ p: 3 }}><Stack spacing={2}><Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}><TaskAltIcon color="primary" /><Box><Typography variant="h6">Next payroll action</Typography><Typography variant="body2" color="text.secondary">{currentRun ? `${formatMonth(month)} is complete.` : `${formatMonth(month)} is ready for inputs.`}{needsPayrollAmendment && ' Your active employee list changed after confirmation.'}</Typography></Box></Stack><Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25}><Button component={RouterLink} to={primaryPayrollPath} variant="contained" endIcon={<ArrowForwardIcon />}>{currentRun ? needsPayrollAmendment ? `Amend ${formatMonth(month)} payroll` : `View ${formatMonth(month)} payroll` : `Run ${formatMonth(month)} payroll`}</Button><Button component={RouterLink} to="/employees" variant="outlined">Manage employees</Button></Stack></Stack></CardContent></Card>
          <Card><CardContent sx={{ p: 3 }}><Stack spacing={1.25}><Typography variant="h6">Recent activity</Typography>{history.slice(0, 3).map((run) => (<Stack key={run.id} direction="row" sx={{ justifyContent: 'space-between', gap: 2 }}><Typography variant="body2">{run.month_display}</Typography><Typography variant="body2" className="money" sx={{ fontWeight: 700 }}>{formatMoney(run.total_net)}</Typography></Stack>))}{history.length === 0 && (<Typography variant="body2" color="text.secondary">Confirm your first payroll to see activity here.</Typography>)}</Stack></CardContent></Card>
        </Box>
      )}
      <Dialog open={companyDialogOpen} maxWidth="sm" fullWidth><DialogTitle>Set up your company</DialogTitle><DialogContent><Stack spacing={2} sx={{ mt: 1 }}><TextField label="Company Name" value={companyName} onChange={(event) => setCompanyName(event.target.value)} /><TextField select label="State" value={state} onChange={(event) => setState(event.target.value)}><MenuItem value="Maharashtra">Maharashtra</MenuItem><MenuItem value="Karnataka">Karnataka</MenuItem><MenuItem value="Gujarat">Gujarat</MenuItem><MenuItem value="Other">Other</MenuItem></TextField></Stack></DialogContent><DialogActions><Button variant="contained" disabled={saving || companyName.trim().length < 2} onClick={saveCompany}>Save & Continue</Button></DialogActions></Dialog>
    </Stack>
  );
};
