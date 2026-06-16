import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Alert, Box, Button, Link, Paper, Stack, TextField, Typography } from '@mui/material';
import { supabase } from '../lib/supabaseClient';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const sendResetLink = async () => {
    const normalizedEmail = email.trim();
    if (!normalizedEmail) return;

    setLoading(true);
    await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSent(true);
    setLoading(false);
  };

  return (
    <Box sx={{ minHeight: 'calc(100vh - 120px)', display: 'grid', placeItems: 'center' }}>
      <Paper sx={{ p: { xs: 3, sm: 4 }, width: '100%', maxWidth: 460, border: '1px solid #DDE5EE', borderRadius: 2 }}>
        <Stack spacing={2.25}>
          <Typography variant="h5">Reset your password</Typography>
          <Typography variant="body2" color="text.secondary">
            Enter your email and PayRun will send a reset link if the account exists.
          </Typography>
          {sent && <Alert severity="success">Reset link sent. Check your inbox.</Alert>}
          <TextField
            label="Email"
            type="email"
            value={email}
            autoComplete="email"
            onChange={(event) => setEmail(event.target.value)}
          />
          <Button variant="contained" disabled={loading || !email.trim()} onClick={sendResetLink}>
            {loading ? 'Sending...' : 'Send reset link'}
          </Button>
          <Link component={RouterLink} to="/login">
            Back to login
          </Link>
        </Stack>
      </Paper>
    </Box>
  );
};
