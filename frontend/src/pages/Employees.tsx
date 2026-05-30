import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import type { Employee } from '../types';
import { getEmployees } from '../lib/payrunApi';
import { formatMoney } from '../utils/format';
import { useWorkspace } from '../hooks/useWorkspace';

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
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h4">Employees</Typography>
          <Typography color="text.secondary">Manage salary details, benefits, and payroll inputs.</Typography>
        </Box>
        <Button component={RouterLink} to="/employees/new" variant="contained">
          Add Employee
        </Button>
      </Stack>

      {employees.length === 0 ? (
        <Card>
          <CardContent>
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <GroupAddIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6">No employees yet</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Add your first employee to start running payroll.
              </Typography>
              <Button component={RouterLink} to="/employees/new" variant="contained">
                Add First Employee
              </Button>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={1.5}>
          {employees.map((employee) => (
            <Card key={employee.id}>
              <CardContent sx={{ pb: 1 }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'space-between' }}>
                  <Stack>
                    <Typography variant="subtitle1">{employee.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {employee.role}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Joined {new Date(employee.joining_date).toLocaleDateString('en-IN')}
                    </Typography>
                  </Stack>
                  <Stack spacing={1} sx={{ alignItems: { xs: 'flex-start', sm: 'flex-end' } }}>
                    <Typography className="money" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
                      {formatMoney(employee.gross_salary)} / mo
                    </Typography>
                    <Stack direction="row" spacing={0.5}>
                      {employee.pf_applicable && <Chip label="PF" size="small" sx={{ bgcolor: '#E3F2FD', color: '#0D47A1' }} />}
                      {employee.esi_applicable && <Chip label="ESI" size="small" sx={{ bgcolor: '#E3F2FD', color: '#0D47A1' }} />}
                      <Chip label={employee.gender} size="small" />
                    </Stack>
                  </Stack>
                </Stack>
              </CardContent>
              <CardActions sx={{ pt: 0, px: 2 }}>
                <IconButton component={RouterLink} to={`/employees/${employee.id}/edit`} color="primary" aria-label="Edit employee">
                  <EditIcon fontSize="small" />
                </IconButton>
              </CardActions>
            </Card>
          ))}
        </Stack>
      )}
    </Stack>
  );
};
