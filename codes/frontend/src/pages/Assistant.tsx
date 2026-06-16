import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { PageHeader } from "../components/PageHeader";
import { useWorkspace } from "../hooks/useWorkspace";
import { askPayRunAssistant } from "../lib/assistantClient";
import { getErrorMessage } from "../utils/errors";

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

export const Assistant = () => {
  const {
    business,
    loading: workspaceLoading,
    error: workspaceError,
  } = useWorkspace();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      text: "Ask a payroll question about your employees, payroll run totals, or monthly deductions.",
    },
  ]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    if (!business) return;
    const trimmed = question.trim();
    if (!trimmed) return;

    setError(null);
    setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
    setQuestion("");
    setLoading(true);

    try {
      const reply = await askPayRunAssistant(trimmed, business.id);
      setMessages((prev) => [...prev, { role: "assistant", text: reply }]);
    } catch (caught) {
      setError(getErrorMessage(caught, "Unable to get an assistant response."));
    } finally {
      setLoading(false);
    }
  };

  if (workspaceLoading) {
    return <Typography>Loading assistant...</Typography>;
  }

  if (workspaceError) {
    return <Alert severity="error">{workspaceError}</Alert>;
  }

  if (!business) {
    return <Alert severity="error">Workspace not available.</Alert>;
  }

  return (
    <Stack spacing={3}>
      <PageHeader
        title="Ask PayRun"
        subtitle="Get quick natural-language answers about payroll totals, employees, and monthly deductions."
        eyebrow="Payroll assistant"
      />

      {error && <Alert severity="error">{error}</Alert>}

      <Paper
        sx={{
          p: 2,
          minHeight: 400,
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <Box sx={{ overflowY: "auto", flexGrow: 1, pr: 1 }}>
          {messages.map((message, index) => (
            <Paper
              key={`${message.role}-${index}`}
              elevation={0}
              sx={{
                p: 2,
                mb: 1.25,
                maxWidth: "85%",
                bgcolor:
                  message.role === "assistant" ? "grey.100" : "primary.main",
                color:
                  message.role === "assistant"
                    ? "text.primary"
                    : "primary.contrastText",
                alignSelf:
                  message.role === "assistant" ? "flex-start" : "flex-end",
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  textTransform: "uppercase",
                  fontWeight: 700,
                  mb: 0.5,
                  display: "block",
                }}
              >
                {message.role === "assistant" ? "Assistant" : "You"}
              </Typography>
              <Typography sx={{ whiteSpace: "pre-line" }}>
                {message.text}
              </Typography>
            </Paper>
          ))}
        </Box>

        <Divider />

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          sx={{ alignItems: "flex-end" }}
        >
          <TextField
            label="Ask a payroll question"
            placeholder="e.g. What was the total net payroll last month?"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            fullWidth
            multiline
            minRows={2}
            maxRows={4}
            disabled={loading}
          />
          <Button
            variant="contained"
            onClick={handleSend}
            disabled={loading || !question.trim()}
            sx={{ minWidth: 120 }}
          >
            {loading ? <CircularProgress color="inherit" size={20} /> : "Send"}
          </Button>
        </Stack>
      </Paper>
    </Stack>
  );
};
