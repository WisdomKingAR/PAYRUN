import { useEffect, useMemo, useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import HistoryIcon from '@mui/icons-material/History';
import PaymentsIcon from '@mui/icons-material/Payments';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';
import type { PayrollRun } from '../types';
import { getPayrollHistory } from '../lib/payrunApi';
import { formatMoney } from '../utils/format';
import { useWorkspace } from '../hooks/useWorkspace';
import { EmptyState } from '../components/EmptyState';
import { PageHeader } from '../components/PageHeader';
import { StatCard } from '../components/StatCard';

export const PayrollHistory = () => {
  const { month } = useParams();
  const { business, loading, error } = useWorkspace();
  const [history, setHistory] = useState<PayrollRun[]>([]);

  useEffect(() => {
    if (!business) return;
    getPayrollHistory(business.id).then(setHistory);
  }, [business]);

  const selectedRun = useMemo(() => history.find((run) => run.month === month), [history, month]);

  if (loading) return <Typography>Loading history...</Typography>;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!business) return <Alert severity="error">Workspace not found.</Alert>;

  if (month) {
    if (!selectedRun) return <Alert severity="info">Payroll run not found.</Alert>;

    return (
      <Stack spacing={3}>
        <PageHeader
          eyebrow="Confirmed run"
          title={selectedRun.month_display}
          subtitle="Payroll totals and employee-level payout details for this closed month."
          actions={
            <Button component={RouterLink} to="/payroll/history" variant="outlined" startIcon={<ArrowBackIcon />}>
            Back to History
          </Button>
          }
        />

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 2 }}>
          <StatCard label="Total gross" value={<Box component="span" className="money">{formatMoney(selectedRun.total_gross)}</Box>} icon={<RequestQuoteIcon />} />
          <StatCard label="Total net" value={<Box component="span" className="money">{formatMoney(selectedRun.total_net)}</Box>} icon={<PaymentsIcon />} tone="green" />
          <StatCard label="Employees" value={selectedRun.employee_count} helper="Included in this run" icon={<ReceiptLongIcon />} tone="slate" />
          <StatCard label="Professional tax" value={<Box component="span" className="money">{formatMoney(selectedRun.total_professional_tax)}</Box>} icon={<HistoryIcon />} tone="amber" />
        </Box>

        <TableContainer component={Card}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Employee</TableCell>
                <TableCell>Gross</TableCell>
                <TableCell>Deductions</TableCell>
                <TableCell align="right">Net Pay</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(selectedRun.employee_payroll ?? []).map((row) => (
                <TableRow key={`${selectedRun.id}-${row.employee_id}`}>
                  <TableCell>
                    <Typography variant="subtitle2">{row.employee_name}</Typography>
                    <Typography variant="caption" color="text.secondary">{row.role}</Typography>
                  </TableCell>
                  <TableCell className="money">{formatMoney(row.gross_salary)}</TableCell>
                  <TableCell className="money">{formatMoney(row.total_deductions)}</TableCell>
                  <TableCell align="right" className="money">{formatMoney(row.net_salary)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Stack>
    );
  }

  return (
    <Stack spacing={3}>
      <PageHeader title="Payroll history" subtitle="Review completed payroll runs, totals, and employee-level payout records." />

      {history.length === 0 ? (
        <EmptyState
          icon={<HistoryIcon fontSize="large" />}
          title="No payroll history yet"
          description="Confirmed payroll runs will appear here with totals, deductions, and employee payouts."
        />
      ) : (
        <Stack spacing={1.5}>
          {history.map((run) => (
            <Card key={run.id}>
              <CardContent>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={2}
                  sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between' }}
                >
                  <Stack>
                    <Typography variant="subtitle1">{run.month_display}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {run.employee_count} employees
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                    <Typography className="money" sx={{ fontWeight: 700 }}>{formatMoney(run.total_net)}</Typography>
                    <Chip label="Completed" color="success" />
                    <Button component={RouterLink} to={`/payroll/history/${run.month}`} variant="outlined">
                      View
                    </Button>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </Stack>
  );
};
