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
import HistoryIcon from '@mui/icons-material/History';
import type { PayrollRun } from '../types';
import { getPayrollHistory } from '../lib/payrunApi';
import { formatMoney } from '../utils/format';
import { useWorkspace } from '../hooks/useWorkspace';

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
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h4">{selectedRun.month_display}</Typography>
            <Typography color="text.secondary">Confirmed payroll breakdown.</Typography>
          </Box>
          <Button component={RouterLink} to="/payroll/history" variant="outlined">
            Back to History
          </Button>
        </Stack>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 2 }}>
          <Card>
            <CardContent>
              <Typography variant="overline">Total Gross</Typography>
              <Typography variant="h5" className="money">{formatMoney(selectedRun.total_gross)}</Typography>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Typography variant="overline">Total Net</Typography>
              <Typography variant="h5" className="money" color="primary">{formatMoney(selectedRun.total_net)}</Typography>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Typography variant="overline">Employees</Typography>
              <Typography variant="h5">{selectedRun.employee_count}</Typography>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Typography variant="overline">Professional Tax</Typography>
              <Typography variant="h5" className="money">{formatMoney(selectedRun.total_professional_tax)}</Typography>
            </CardContent>
          </Card>
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
      <Box>
        <Typography variant="h4">Payroll History</Typography>
        <Typography color="text.secondary">Completed payroll runs appear here.</Typography>
      </Box>

      {history.length === 0 ? (
        <Card>
          <CardContent>
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <HistoryIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6">No payroll history yet</Typography>
              <Typography variant="body2" color="text.secondary">
                Your completed runs will appear after the first payroll.
              </Typography>
            </Box>
          </CardContent>
        </Card>
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
