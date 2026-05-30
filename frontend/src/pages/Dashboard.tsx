import { useEffect, useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
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
  Fab,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import type { Employee, PayrollRun } from '../types';
import { getEmployees, getPayrollHistory, updateBusiness, updateOnboardingStep } from '../lib/payrunApi';
import { currentMonthKey, formatMoney, formatMonth } from '../utils/format';
import { useWorkspace } from '../hooks/useWorkspace';

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

  const saveCompany = async () => {
    if (!business || companyName.trim().length < 2) return;
    setSaving(true);
    const updated = await updateBusiness(business.id, {
      name: companyName.trim(),
      state,
      onboarding_step: 2,
    });
    setBusiness(updated);
    setCompanyDialogOpen(false);
    setSaving(false);
  };

  useEffect(() => {
    if (!business || business.onboarding_step !== 2 || employees.length === 0) return;

    updateOnboardingStep(business.id, 3).then(() => {
      void refresh();
    });
  }, [business, employees.length, refresh]);

  if (loading) return <Typography>Loading workspace...</Typography>;
  if (error) {
    return (
      <Stack spacing={2}>
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => void refresh()}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
        <Alert severity="info">
          If this mentions RLS, missing columns, or relation not found, run the latest Supabase SQL in
          backend/setup.sql and refresh this page.
        </Alert>
      </Stack>
    );
  }
  if (!business) return <Alert severity="error">Workspace not found.</Alert>;

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4">Dashboard</Typography>
        <Typography color="text.secondary">{business.name}</Typography>
      </Box>

      {business.onboarding_step === 2 && (
        <Alert
          severity="info"
          action={
            <Button component={RouterLink} to="/employees/new" color="inherit" size="small">
              Add Employee
            </Button>
          }
        >
          Add your first employee to finish onboarding.
        </Alert>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
        <Card>
          <CardContent>
            <Typography variant="overline" color="text.secondary">
              Total Employees
            </Typography>
            <Typography variant="h4">{employees.length}</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="overline" color="text.secondary">
              Last Net Payroll
            </Typography>
            <Typography variant="h4" className="money">
              {formatMoney(latestNet)}
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="overline" color="text.secondary">
              Current Month
            </Typography>
            <Typography variant="h4">{formatMonth(month)}</Typography>
            <Chip
              label={currentRun ? 'Completed' : 'Ready'}
              color={currentRun ? 'success' : 'primary'}
              sx={{ mt: 1 }}
            />
          </CardContent>
        </Card>
      </Box>

      {employees.length === 0 ? (
        <Card>
          <CardContent>
            <Box sx={{ textAlign: 'center', py: 5 }}>
              <GroupAddIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6">No employees yet</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Add your first employee to start running payroll.
              </Typography>
              <Button component={RouterLink} to="/employees/new" variant="contained">
                Add First Employee
              </Button>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: { sm: 'center' } }}>
          <Fab
            component={RouterLink}
            to={currentRun ? `/payroll/history/${month}` : '/payroll/run'}
            variant="extended"
            color="primary"
          >
            <PlayCircleIcon />
            {currentRun ? `View ${formatMonth(month)} Payroll` : `Run Payroll - ${formatMonth(month)}`}
          </Fab>
          <Button component={RouterLink} to="/employees" variant="outlined">
            Manage Employees
          </Button>
        </Stack>
      )}

      <Dialog open={companyDialogOpen} maxWidth="sm" fullWidth>
        <DialogTitle>Set up your company</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Company Name" value={companyName} onChange={(event) => setCompanyName(event.target.value)} />
            <TextField select label="State" value={state} onChange={(event) => setState(event.target.value)}>
              <MenuItem value="Maharashtra">Maharashtra</MenuItem>
              <MenuItem value="Karnataka">Karnataka</MenuItem>
              <MenuItem value="Gujarat">Gujarat</MenuItem>
              <MenuItem value="Other">Other</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" disabled={saving || companyName.trim().length < 2} onClick={saveCompany}>
            Save & Continue
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
};
