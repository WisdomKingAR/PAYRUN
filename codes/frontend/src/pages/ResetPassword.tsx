import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Box, Button, Paper, Stack, TextField, Typography, LinearProgress } from '@mui/material';
import { supabase } from '../lib/supabaseClient';

const PASSWORD_CHANGE_COOLDOWN_SECONDS = 5; // Cooldown between attempts
const MAX_PASSWORD_CHANGE_ATTEMPTS = 5; // Max attempts per session
const LOCKOUT_DURATION_MINUTES = 15; // Lock after max attempts

export const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [attemptCount, setAttemptCount] = useState(0);
  const [isLockedOut, setIsLockedOut] = useState(false);

  useEffect(() => {
    // Load attempt count from localStorage
    const stored = localStorage.getItem('password_reset_attempts');
    if (stored) {
      const { count, lockedUntil } = JSON.parse(stored);
      setAttemptCount(count);
      if (lockedUntil && lockedUntil > Date.now()) {
        setIsLockedOut(true);
        const remainingMs = lockedUntil - Date.now();
        const remainingSeconds = Math.ceil(remainingMs / 1000);
        setCooldownSeconds(remainingSeconds);
        const interval = setInterval(() => {
          setCooldownSeconds((prev) => {
            if (prev <= 1) {
              clearInterval(interval);
              setIsLockedOut(false);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    }

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
    // Check lockout status
    if (isLockedOut) {
      setMessage({
        type: 'error',
        text: `Too many attempts. Please try again in ${cooldownSeconds} seconds.`,
      });
      return;
    }

    // Validate password requirements
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

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setMessage({ type: 'error', text: error.message });

        // Increment failed attempt count
        const newCount = attemptCount + 1;
        if (newCount >= MAX_PASSWORD_CHANGE_ATTEMPTS) {
          const lockoutUntil = Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000;
          localStorage.setItem(
            'password_reset_attempts',
            JSON.stringify({ count: newCount, lockedUntil: lockoutUntil }),
          );
          setIsLockedOut(true);
          setCooldownSeconds(LOCKOUT_DURATION_MINUTES * 60);
          setMessage({
            type: 'error',
            text: `Too many failed attempts. Please try again in ${LOCKOUT_DURATION_MINUTES} minutes.`,
          });
        } else {
          localStorage.setItem(
            'password_reset_attempts',
            JSON.stringify({ count: newCount, lockedUntil: null }),
          );
          setAttemptCount(newCount);
        }
      } else {
        // Success: clear attempt counter and show success
        localStorage.removeItem('password_reset_attempts');
        setAttemptCount(0);
        setMessage({ type: 'success', text: 'Password updated. Redirecting...' });
        window.setTimeout(() => navigate('/dashboard', { replace: true }), 800);
      }
    } catch (caught) {
      const errorText =
        caught instanceof Error ? caught.message : 'An unexpected error occurred.';
      setMessage({ type: 'error', text: errorText });
    } finally {
      setLoading(false);

      // Start cooldown timer
      if (!isLockedOut) {
        setCooldownSeconds(PASSWORD_CHANGE_COOLDOWN_SECONDS);
        const interval = setInterval(() => {
          setCooldownSeconds((prev) => {
            if (prev <= 1) {
              clearInterval(interval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading && ready && !isLockedOut && cooldownSeconds === 0) {
      updatePassword();
    }
  };

  return (
    <Box sx={{ minHeight: 'calc(100vh - 120px)', display: 'grid', placeItems: 'center' }}>
      <Paper sx={{ p: { xs: 3, sm: 4 }, width: '100%', maxWidth: 460, border: '1px solid #DDE5EE', borderRadius: 2 }}>
        <Stack spacing={2.25}>
          <Typography variant="h5">Set a new password</Typography>
          {!ready && (
            <Alert severity="info">
              Open this page from your PayRun reset email. If the link expired, request a new one.
            </Alert>
          )}
          {message && <Alert severity={message.type}>{message.text}</Alert>}
          {cooldownSeconds > 0 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Cooldown active
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {cooldownSeconds}s
                </Typography>
              </Box>
              <LinearProgress variant="determinate" value={(cooldownSeconds / PASSWORD_CHANGE_COOLDOWN_SECONDS) * 100} />
            </Box>
          )}
          <TextField
            label="New Password"
            type="password"
            value={password}
            autoComplete="new-password"
            disabled={loading || isLockedOut}
            onChange={(event) => setPassword(event.target.value)}
            onKeyPress={handleKeyPress}
          />
          <TextField
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            autoComplete="new-password"
            disabled={loading || isLockedOut}
            onChange={(event) => setConfirmPassword(event.target.value)}
            onKeyPress={handleKeyPress}
          />
          <Button
            variant="contained"
            disabled={loading || !ready || isLockedOut || cooldownSeconds > 0}
            onClick={updatePassword}
          >
            {loading ? 'Saving...' : isLockedOut ? `Locked (${cooldownSeconds}s)` : cooldownSeconds > 0 ? `Wait ${cooldownSeconds}s` : 'Set new password'}
          </Button>
          <Button variant="text" onClick={() => navigate('/forgot-password')}>
            Request new link
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
};
