import { useState } from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { Alert, Box, Button, Link, Paper, Stack, TextField, Typography } from '@mui/material';
import { supabase } from '../lib/supabaseClient';
import { createBusiness } from '../lib/payrunApi';
import { getErrorMessage } from '../utils/errors';

type AuthMode = 'login' | 'signup';

export const Auth = ({ mode }: { mode: AuthMode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [verificationEmail, setVerificationEmail] = useState('');

  const isSignup = mode === 'signup';
  const redirectTo = typeof location.state === 'object' && location.state ? String(location.state.from ?? '/dashboard') : '/dashboard';
  const canResendVerification =
    isSignup && verificationEmail.length > 0 && email.trim().toLowerCase() === verificationEmail.toLowerCase();

  const handleSubmit = async () => {
    const normalizedEmail = email.trim();
    const normalizedBusinessName = businessName.trim();

    if (!normalizedEmail || !password || (isSignup && normalizedBusinessName.length < 2)) {
      setMessage({
        type: 'error',
        text: isSignup ? 'Enter business name, email, and password.' : 'Enter your email and password.',
      });
      return;
    }

    setLoading(true);
    setMessage(null);

    if (isSignup) {
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: { business_name: normalizedBusinessName },
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        setMessage({ type: 'error', text: error.message });
      } else if (data.session && data.user) {
        try {
          await createBusiness(normalizedBusinessName, data.user.id);
          navigate('/dashboard', { replace: true });
        } catch (caught) {
          setMessage({ type: 'error', text: getErrorMessage(caught, 'Account created, but workspace setup failed.') });
        }
      } else {
        setVerificationEmail(normalizedEmail);
        setMessage({
          type: 'success',
          text: 'Account created. Check your email to verify it before logging in.',
        });
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error) {
        setMessage({ type: 'error', text: error.message });
      } else {
        navigate(redirectTo, { replace: true });
      }
    }

    setLoading(false);
  };

  const resendVerification = async () => {
    const normalizedEmail = email.trim();

    if (!canResendVerification || !normalizedEmail) {
      setMessage({ type: 'error', text: 'Create an account first, then resend the verification email.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: normalizedEmail,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    });

    setMessage(
      error
        ? { type: 'error', text: error.message }
        : { type: 'success', text: 'Verification email sent. Check your inbox.' },
    );
    setLoading(false);
  };

  return (
    <Box sx={{ minHeight: 'calc(100vh - 120px)', display: 'grid', placeItems: 'center' }}>
      <Paper sx={{ p: { xs: 3, sm: 4 }, width: '100%', maxWidth: 460, border: '1px solid #DDE5EE', borderRadius: 2 }}>
        <Stack spacing={2.25}>
          <Box>
            <Typography variant="h4" sx={{ color: 'primary.main', fontWeight: 800 }}>
              {isSignup ? 'Create workspace' : 'Welcome back'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {isSignup ? 'Create your payroll workspace.' : 'Log in to your payroll workspace.'}
            </Typography>
          </Box>

          {message && <Alert severity={message.type}>{message.text}</Alert>}

          {isSignup && (
            <TextField
              label="Business Name"
              value={businessName}
              autoComplete="organization"
              onChange={(event) => setBusinessName(event.target.value)}
            />
          )}
          <TextField
            label="Email"
            type="email"
            value={email}
            autoComplete="email"
            onChange={(event) => setEmail(event.target.value)}
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            autoComplete={isSignup ? 'new-password' : 'current-password'}
            helperText={isSignup ? 'Use at least 8 characters.' : undefined}
            onChange={(event) => setPassword(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') void handleSubmit();
            }}
          />

          <Button variant="contained" size="large" disabled={loading} onClick={handleSubmit}>
            {loading ? 'Please wait...' : isSignup ? 'Create account' : 'Log in'}
          </Button>

          {isSignup ? (
            <Stack spacing={1} sx={{ alignItems: 'center' }}>
              {canResendVerification && (
                <Button variant="text" disabled={loading} onClick={resendVerification}>
                  Resend verification email
                </Button>
              )}
              <Typography variant="body2" color="text.secondary">
                Already have an account?{' '}
                <Link component={RouterLink} to="/login">
                  Log in
                </Link>
              </Typography>
            </Stack>
          ) : (
            <Stack spacing={1} sx={{ alignItems: 'center' }}>
              <Link component={RouterLink} to="/forgot-password">
                Forgot password?
              </Link>
              <Typography variant="body2" color="text.secondary">
                New to PayRun?{' '}
                <Link component={RouterLink} to="/signup">
                  Create account
                </Link>
              </Typography>
            </Stack>
          )}
        </Stack>
      </Paper>
    </Box>
  );
};
