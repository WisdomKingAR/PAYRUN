import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  MenuItem,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { getEmployees, getPayrollHistory, updateBusiness } from '../lib/payrunApi';
import { supabase } from '../lib/supabaseClient';
import { useWorkspace } from '../hooks/useWorkspace';

export const Settings = () => {
  const { business, loading, error, refresh } = useWorkspace();
  const [tab, setTab] = useState(0);
  const [name, setName] = useState('');
  const [state, setState] = useState('Maharashtra');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  useEffect(() => {
    if (!business) return;
    setName(business.name);
    setState(business.state);
  }, [business]);

  const saveCompany = async () => {
    if (!business || name.trim().length < 2) return;

    try {
      await updateBusiness(business.id, { name: name.trim(), state });
      await refresh();
      setMessage({ type: 'success', text: 'Company profile updated.' });
    } catch (caught) {
      setMessage({ type: 'error', text: caught instanceof Error ? caught.message : 'Could not save company.' });
    }
  };

  const updatePassword = async () => {
    if (password.length < 8 || password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords must match and use at least 8 characters.' });
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password });
    setMessage(
      updateError
        ? { type: 'error', text: updateError.message }
        : { type: 'success', text: 'Password updated.' },
    );
    setPassword('');
    setConfirmPassword('');
  };

  const updateEmail = async () => {
    const normalizedEmail = newEmail.trim();
    if (!normalizedEmail) return;

    const { error: updateError } = await supabase.auth.updateUser({ email: normalizedEmail });
    setMessage(
      updateError
        ? { type: 'error', text: updateError.message }
        : { type: 'success', text: 'Verification sent to the new email.' },
    );
    setNewEmail('');
  };

  const exportData = async () => {
    if (!business) return;

    const [employees, payrollHistory] = await Promise.all([getEmployees(business.id), getPayrollHistory(business.id)]);
    const blob = new Blob([JSON.stringify({ business, employees, payroll_history: payrollHistory }, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `payrun-export-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <Typography>Loading settings...</Typography>;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!business) return <Alert severity="error">Workspace not found.</Alert>;

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4">Settings</Typography>
        <Typography color="text.secondary">Company profile, account access, and data export.</Typography>
      </Box>

      {message && <Alert severity={message.type}>{message.text}</Alert>}

      <Card>
        <CardContent>
          <Tabs value={tab} onChange={(_, value: number) => setTab(value)} sx={{ mb: 3 }}>
            <Tab label="Company Profile" />
            <Tab label="Account & Password" />
            <Tab label="Data & Privacy" />
          </Tabs>

          {tab === 0 && (
            <Stack spacing={2.5} sx={{ maxWidth: 560 }}>
              {state !== 'Maharashtra' && (
                <Alert severity="warning">Changing state affects Professional Tax calculations for future payroll runs.</Alert>
              )}
              <TextField label="Company Name" value={name} onChange={(event) => setName(event.target.value)} />
              <TextField select label="State" value={state} onChange={(event) => setState(event.target.value)}>
                <MenuItem value="Maharashtra">Maharashtra</MenuItem>
                <MenuItem value="Karnataka">Karnataka</MenuItem>
                <MenuItem value="Gujarat">Gujarat</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </TextField>
              <Button variant="contained" onClick={saveCompany}>
                Save Company
              </Button>
            </Stack>
          )}

          {tab === 1 && (
            <Stack spacing={2.5} sx={{ maxWidth: 560 }}>
              <TextField label="New Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
              <TextField
                label="Confirm Password"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />
              <Button variant="contained" onClick={updatePassword}>
                Update Password
              </Button>
              <TextField label="New Email" type="email" value={newEmail} onChange={(event) => setNewEmail(event.target.value)} />
              <Button variant="outlined" onClick={updateEmail}>
                Send Verification to New Email
              </Button>
            </Stack>
          )}

          {tab === 2 && (
            <Stack spacing={2.5} sx={{ maxWidth: 560 }}>
              <Alert severity="info">Export includes your business profile, employees, and payroll history.</Alert>
              <Button variant="outlined" onClick={exportData}>
                Export My Data
              </Button>
              <Button variant="contained" color="error" disabled>
                Delete Account
              </Button>
              <Typography variant="caption" color="text.secondary">
                Account deletion needs a secure server-side function before it is enabled.
              </Typography>
            </Stack>
          )}
        </CardContent>
      </Card>
    </Stack>
  );
};
