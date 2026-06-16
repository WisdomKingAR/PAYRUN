import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import PaymentsIcon from "@mui/icons-material/Payments";
import PersonIcon from "@mui/icons-material/Person";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import type { EmployeeInput, Gender } from "../types";
import {
  addEmployee,
  getEmployee,
  getEmployees,
  updateEmployee,
  updateOnboardingStep,
} from "../lib/payrunApi";
import { formatMoney } from "../utils/format";
import { useWorkspace } from "../hooks/useWorkspace";
import { PageHeader } from "../components/PageHeader";
import { StatCard } from "../components/StatCard";

const today = new Date().toISOString().slice(0, 10);
const emptyForm: EmployeeInput = {
  name: "",
  email: "",
  phone_number: "",
  role: "",
  joining_date: today,
  pan: "",
  aadhaar_number: "",
  bank_account_no: "",
  ifsc_code: "",
  basic_salary: 0,
  hra: 0,
  special_allowance: 0,
  other_allowances: {},
  pf_applicable: false,
  esi_applicable: true,
  gender: "male",
  onboarding_status: "completed",
  is_active: true,
};

export const EmployeeForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { business, loading, error } = useWorkspace();
  const [form, setForm] = useState<EmployeeInput>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [magicLink, setMagicLink] = useState<string | null>(null);

  const grossSalary = useMemo(
    () => form.basic_salary + form.hra + form.special_allowance,
    [form.basic_salary, form.hra, form.special_allowance],
  );

  useEffect(() => {
    if (!id) return;
    getEmployee(id).then((employee) => {
      setForm({
        name: employee.name,
        email: employee.email,
        phone_number: employee.phone_number,
        role: employee.role,
        joining_date: employee.joining_date,
        pan: employee.pan,
        aadhaar_number: employee.aadhaar_number,
        bank_account_no: employee.bank_account_no,
        ifsc_code: employee.ifsc_code,
        basic_salary: employee.basic_salary,
        hra: employee.hra,
        special_allowance: employee.special_allowance,
        other_allowances: employee.other_allowances,
        pf_applicable: employee.pf_applicable,
        esi_applicable: employee.esi_applicable,
        gender: employee.gender,
        onboarding_status: employee.onboarding_status,
        is_active: employee.is_active,
      });
    });
  }, [id]);

  const updateField = <Key extends keyof EmployeeInput>(
    key: Key,
    value: EmployeeInput[Key],
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const updateBasicSalary = (value: number) => {
    const hra = Math.round(value * 0.5);
    const nextGross = value + hra + form.special_allowance;
    setForm((current) => ({
      ...current,
      basic_salary: value,
      hra,
      esi_applicable: nextGross <= 21000,
    }));
  };

  const updateSpecialAllowance = (value: number) => {
    const nextGross = form.basic_salary + form.hra + value;
    setForm((current) => ({
      ...current,
      special_allowance: value,
      esi_applicable: nextGross <= 21000,
    }));
  };

  const saveEmployee = async (useMagicLink: boolean = false) => {
    if (!business) return;
    if (!form.name.trim() || !form.role.trim() || form.basic_salary <= 0) {
      setFormError("Name, role, and base salary are required.");
      return;
    }
    setSaving(true);
    setFormError(null);
    const payload: EmployeeInput = {
      ...form,
      name: form.name.trim(),
      role: form.role.trim(),
      onboarding_status: useMagicLink ? "pending" : "completed",
    };
    try {
      if (id) {
        await updateEmployee(id, payload);
        navigate("/employees");
      } else {
        const existing = await getEmployees(business.id);
        const newEmp = await addEmployee(business.id, payload);
        if (existing.length === 0) await updateOnboardingStep(business.id, 3);
        if (useMagicLink && newEmp.magic_link_token) {
          setMagicLink(
            `${window.location.origin}/onboard/${newEmp.magic_link_token}`,
          );
        } else {
          navigate("/employees");
        }
      }
    } catch (caught) {
      setFormError(
        caught instanceof Error ? caught.message : "Could not save employee.",
      );
    } finally {
      setSaving(false);
    }
  };

  const copyMagicLink = () => {
    if (magicLink) {
      navigator.clipboard.writeText(magicLink);
      alert("Copied to clipboard.");
    }
  };

  if (loading) return <Typography>Loading employee form...</Typography>;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!business) return <Alert severity="error">Workspace not found.</Alert>;

  return (
    <Stack spacing={3}>
      <PageHeader
        title={isEdit ? "Edit employee" : "Add employee"}
        subtitle="Set salary components and compliance toggles."
        actions={
          <Button variant="outlined" onClick={() => navigate("/employees")}>
            Cancel
          </Button>
        }
      />
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
          gap: 2,
        }}
      >
        <StatCard
          label="Gross estimate"
          value={
            <Box component="span" className="money">
              {formatMoney(grossSalary)}
            </Box>
          }
          helper="Basic + HRA + allowance"
          icon={<PaymentsIcon />}
        />
        <StatCard
          label="HRA"
          value={
            <Box component="span" className="money">
              {formatMoney(form.hra)}
            </Box>
          }
          helper="Auto-set to 50 percent"
          icon={<AccountBalanceIcon />}
          tone="slate"
        />
        <StatCard
          label="ESI status"
          value={form.esi_applicable ? "Applicable" : "Not applicable"}
          helper="Based on gross salary"
          icon={<InfoOutlinedIcon />}
          tone={form.esi_applicable ? "green" : "amber"}
        />
      </Box>
      <Card>
        <CardContent sx={{ p: 3 }}>
          <Stack spacing={2.5}>
            {formError && <Alert severity="error">{formError}</Alert>}
            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
              <PersonIcon color="primary" />
              <Typography variant="h6">Employee profile</Typography>
            </Stack>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                gap: 2,
              }}
            >
              <TextField
                label="Full Name"
                required
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
              />
              <TextField
                label="Role"
                required
                value={form.role}
                onChange={(event) => updateField("role", event.target.value)}
              />
              <TextField
                label="Joining Date"
                type="date"
                required
                value={form.joining_date}
                slotProps={{ inputLabel: { shrink: true } }}
                onChange={(event) =>
                  updateField("joining_date", event.target.value)
                }
              />
              <TextField
                label="Phone Number"
                placeholder="+91 98765 43210"
                value={form.phone_number ?? ""}
                onChange={(event) =>
                  updateField("phone_number", event.target.value)
                }
              />
              <TextField
                label="Base Salary"
                type="number"
                required
                value={form.basic_salary || ""}
                slotProps={{ htmlInput: { min: 0, className: "money" } }}
                onChange={(event) =>
                  updateBasicSalary(Number(event.target.value))
                }
              />
              <TextField
                label="Special Allowance"
                type="number"
                value={form.special_allowance || ""}
                slotProps={{ htmlInput: { min: 0, className: "money" } }}
                onChange={(event) =>
                  updateSpecialAllowance(Number(event.target.value))
                }
              />
              <FormControl fullWidth size="small">
                <InputLabel>Gender</InputLabel>
                <Select
                  label="Gender"
                  value={form.gender}
                  onChange={(event) =>
                    updateField("gender", event.target.value as Gender)
                  }
                >
                  <MenuItem value="male">Male</MenuItem>
                  <MenuItem value="female">Female</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Typography variant="subtitle2" color="text.secondary">
              Compliance and bank details (Optional if using Magic Link)
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "repeat(4, 1fr)" },
                gap: 2,
              }}
            >
              <TextField
                label="PAN"
                value={form.pan ?? ""}
                onChange={(event) => updateField("pan", event.target.value)}
              />
              <TextField
                label="Aadhaar"
                value={form.aadhaar_number ?? ""}
                onChange={(event) =>
                  updateField("aadhaar_number", event.target.value)
                }
              />
              <TextField
                label="Bank Account"
                value={form.bank_account_no ?? ""}
                onChange={(event) =>
                  updateField("bank_account_no", event.target.value)
                }
              />
              <TextField
                label="IFSC"
                value={form.ifsc_code ?? ""}
                onChange={(event) =>
                  updateField("ifsc_code", event.target.value)
                }
              />
            </Box>
            <Stack direction="row" spacing={2}>
              <FormControlLabel
                control={
                  <Switch
                    checked={form.pf_applicable}
                    onChange={(event) =>
                      updateField("pf_applicable", event.target.checked)
                    }
                  />
                }
                label="PF Applicable"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={form.esi_applicable}
                    onChange={(event) =>
                      updateField("esi_applicable", event.target.checked)
                    }
                  />
                }
                label="ESI Applicable"
              />
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <Button
                variant="contained"
                disabled={saving}
                onClick={() => saveEmployee(false)}
              >
                {saving ? "Saving..." : "Save & Complete"}
              </Button>
              {!isEdit && (
                <Button
                  variant="outlined"
                  disabled={saving}
                  onClick={() => saveEmployee(true)}
                >
                  Send Magic Link
                </Button>
              )}
            </Stack>
          </Stack>
        </CardContent>
      </Card>
      <Dialog open={Boolean(magicLink)} onClose={() => navigate("/employees")}>
        <DialogTitle>Magic Link Created</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Send this link to the employee. They can fill their own KYC and bank
            details.
          </Typography>
          <TextField
            fullWidth
            value={magicLink}
            slotProps={{ htmlInput: { readOnly: true } }}
          />
        </DialogContent>
        <DialogActions>
          <Button startIcon={<ContentCopyIcon />} onClick={copyMagicLink}>
            Copy Link
          </Button>
          <Button onClick={() => navigate("/employees")}>Done</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
};
