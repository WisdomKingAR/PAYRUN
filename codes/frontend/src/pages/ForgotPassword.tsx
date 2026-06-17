import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Link,
  Paper,
  Stack,
  TextField,
  Typography,
  LinearProgress,
} from "@mui/material";
import { supabase } from "../lib/supabaseClient";

const RESET_REQUEST_COOLDOWN_SECONDS = 60; // Cooldown between requests
const MAX_RESET_REQUESTS_PER_HOUR = 5; // Max attempts per email per hour
const LOCKOUT_DURATION_MINUTES = 15; // Lock account after max attempts

export const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Load attempt tracking from localStorage
  const getAttemptData = (attemptEmail: string) => {
    const key = `forgot_password_attempts_${btoa(attemptEmail)}`;
    const stored = localStorage.getItem(key);
    if (!stored) return { count: 0, firstAttemptTime: 0, lockedUntil: 0 };
    try {
      return JSON.parse(stored);
    } catch {
      return { count: 0, firstAttemptTime: 0, lockedUntil: 0 };
    }
  };

  const saveAttemptData = (
    attemptEmail: string,
    count: number,
    firstAttemptTime: number,
    lockedUntil: number,
  ) => {
    const key = `forgot_password_attempts_${btoa(attemptEmail)}`;
    localStorage.setItem(
      key,
      JSON.stringify({ count, firstAttemptTime, lockedUntil }),
    );
  };

  const sendResetLink = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setError("Please enter your email address.");
      return;
    }

    // Check cooldown
    if (cooldownSeconds > 0) {
      setError(
        `Please wait ${cooldownSeconds} seconds before requesting another link.`,
      );
      return;
    }

    // Check account lockout and attempt limits
    const attempts = getAttemptData(normalizedEmail);
    const now = Date.now();
    const hourAgo = now - 60 * 60 * 1000;

    // Reset counter if older than 1 hour
    let { count, firstAttemptTime, lockedUntil } = attempts;
    if (firstAttemptTime < hourAgo) {
      count = 0;
      firstAttemptTime = now;
      lockedUntil = 0;
    }

    // Check if currently locked out
    if (lockedUntil > now) {
      const remainingMinutes = Math.ceil((lockedUntil - now) / 60000);
      setError(
        `Too many reset requests. Please try again in ${remainingMinutes} minute${remainingMinutes > 1 ? "s" : ""}.`,
      );
      return;
    }

    // Check if exceeded max attempts
    if (count >= MAX_RESET_REQUESTS_PER_HOUR) {
      lockedUntil = now + LOCKOUT_DURATION_MINUTES * 60 * 1000;
      saveAttemptData(normalizedEmail, count, firstAttemptTime, lockedUntil);
      const remainingMinutes = LOCKOUT_DURATION_MINUTES;
      setError(
        `Too many reset requests. Account locked for ${remainingMinutes} minutes. Check your email or try again later.`,
      );
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      // Increment attempt counter
      count++;
      saveAttemptData(normalizedEmail, count, firstAttemptTime, lockedUntil);

      setSent(true);
      setEmail("");

      // Start cooldown timer
      setCooldownSeconds(RESET_REQUEST_COOLDOWN_SECONDS);
      const interval = setInterval(() => {
        setCooldownSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (caught) {
      const message =
        caught instanceof Error
          ? caught.message
          : "Could not send reset link. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading && email && cooldownSeconds === 0) {
      sendResetLink();
    }
  };

  return (
    <Box
      sx={{
        minHeight: "calc(100vh - 120px)",
        display: "grid",
        placeItems: "center",
      }}
    >
      <Paper
        sx={{
          p: { xs: 3, sm: 4 },
          width: "100%",
          maxWidth: 460,
          border: "1px solid #DDE5EE",
          borderRadius: 2,
        }}
      >
        <Stack spacing={2.25}>
          <Typography variant="h5">Reset your password</Typography>
          <Typography variant="body2" color="text.secondary">
            Enter your email and PayRun will send a reset link if the account
            exists.
          </Typography>
          {sent && (
            <Alert severity="success">
              Reset link sent! Check your inbox. You can request another link in{" "}
              {cooldownSeconds}s.
            </Alert>
          )}
          {error && <Alert severity="error">{error}</Alert>}
          {cooldownSeconds > 0 && (
            <Box>
              <Box
                sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
              >
                <Typography variant="caption" color="text.secondary">
                  Cooldown active
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {cooldownSeconds}s
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={(cooldownSeconds / RESET_REQUEST_COOLDOWN_SECONDS) * 100}
              />
            </Box>
          )}
          <TextField
            label="Email"
            type="email"
            value={email}
            autoComplete="email"
            disabled={loading || cooldownSeconds > 0}
            onChange={(event) => {
              setEmail(event.target.value);
              setError(null);
            }}
            onKeyPress={handleKeyPress}
          />
          <Button
            variant="contained"
            disabled={loading || !email.trim() || cooldownSeconds > 0}
            onClick={sendResetLink}
          >
            {loading
              ? "Sending..."
              : cooldownSeconds > 0
                ? `Wait ${cooldownSeconds}s`
                : "Send reset link"}
          </Button>
          <Link component={RouterLink} to="/login">
            Back to login
          </Link>
        </Stack>
      </Paper>
    </Box>
  );
};
