import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Alert,
  Button,
  Chip,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import type { Employee } from '../types';
import { getEmployees } from '../lib/payrunApi';
import { formatMoney } from '../utils/format';
import { useWorkspace } from '../hooks/useWorkspace';
import { EmptyState } from '../components/EmptyState';
import { PageHeader } from '../components/PageHeader';

export const Employees = () => {
  const { business, loading, error } = useWorkspace();
  const [employees, setEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    if (!business) return;
    getEmployees(business.id).then(setEmployees);
  }, [business]);

  if (loading) return <Typography>Loading employees...</Typography>;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!business) return <Alert severity="error">Workspace not found.</Alert>;

  return (
    <Stack spacing={3}>
      <PageHeader
        title="Employees"
        subtitle="Manage salary structure, benefits, and identity details used across payroll runs."
        meta={<Chip label={`${employees.length} active records`} color="primary" variant="outlined" />}
        actions={
          <Button component={RouterLink} to="/employees/new" variant="contained" startIcon={<AddIcon />}>
            Add employee
          </Button>
        }
      />

      {employees.length === 0 ? (
        <EmptyState
          icon={<GroupAddIcon fontSize="large" />}
          title="No employees yet"
          description="Add employee records once, then reuse them every month for payroll inputs and history."
          action={
            <Button component={RouterLink} to="/employees/new" variant="contained" startIcon={<AddIcon />}>
                Add First Employee
              </Button>
          }
        />
      ) : (
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Employee</TableCell>
                <TableCell>Joined</TableCell>
                <TableCell>Benefits</TableCell>
                <TableCell align="right">Monthly Gross</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {employees.map((employee) => (
                <TableRow key={employee.id} hover>
                  <TableCell>
                    <Stack>
                      <Typography variant="subtitle2">{employee.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {employee.role}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>{new Date(employee.joining_date).toLocaleDateString('en-IN')}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                      {employee.pf_applicable && <Chip label="PF" size="small" color="primary" variant="outlined" />}
                      {employee.esi_applicable && <Chip label="ESI" size="small" color="primary" variant="outlined" />}
                      <Chip label={employee.gender} size="small" variant="outlined" />
                    </Stack>
                  </TableCell>
                  <TableCell align="right" className="money">
                    {formatMoney(employee.gross_salary)}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton component={RouterLink} to={`/employees/${employee.id}/edit`} color="primary" aria-label="Edit employee">
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Stack>
  );
};
