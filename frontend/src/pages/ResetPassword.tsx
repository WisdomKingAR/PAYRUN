import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Box, Button, Paper, Stack, TextField, Typography } from '@mui/material';
import { supabase } from '../lib/supabaseClient';

export const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') setReady(true);
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const updatePassword = async () => {
    if (password.length < 8) {
      setMessage({ type: 'error', text: 'Use at least 8 characters.' });
      return;
    }

    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    setLoading(true);
    setMessage(null);
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ type: 'success', text: 'Password updated. Redirecting...' });
      window.setTimeout(() => navigate('/dashboard', { replace: true }), 800);
    }

    setLoading(false);
  };

  return (
    <Box sx={{ minHeight: 'calc(100vh - 120px)', display: 'grid', placeItems: 'center' }}>
      <Paper sx={{ p: { xs: 3, sm: 4 }, width: '100%', maxWidth: 460, border: '1px solid #DDE5EE', borderRadius: 2 }}>
        <Stack spacing={2.25}>
          <Typography variant="h5">Set a new password</Typography>
          {!ready && (
            <Alert severity="info">
              Open this page from your Supabase reset email. If the link expired, request a new one.
            </Alert>
          )}
          {message && <Alert severity={message.type}>{message.text}</Alert>}
          <TextField
            label="New Password"
            type="password"
            value={password}
            autoComplete="new-password"
            onChange={(event) => setPassword(event.target.value)}
          />
          <TextField
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            autoComplete="new-password"
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
          <Button variant="contained" disabled={loading || !ready} onClick={updatePassword}>
            {loading ? 'Saving...' : 'Set new password'}
          </Button>
          <Button variant="text" onClick={() => navigate('/forgot-password')}>
            Send new link
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
};
