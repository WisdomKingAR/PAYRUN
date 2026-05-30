import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  Typography,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const features = [
  'Maharashtra PT rules with female exemption',
  'PF and ESI voluntary benefit toggles',
  'Payroll records ready for audit and exports',
];

export const Landing = () => (
  <Box sx={{ py: { xs: 4, md: 8 } }}>
    <Stack spacing={5}>
      <Box sx={{ maxWidth: 760 }}>
        <Chip label="Built for Indian teams under 10 people" sx={{ bgcolor: '#E3F2FD', color: '#0D47A1', mb: 2 }} />
        <Typography variant="h4" sx={{ fontSize: { xs: 34, md: 48 }, lineHeight: 1.08, mb: 2 }}>
          Run payroll, keep compliance records, and avoid spreadsheet drift.
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 620, mb: 3 }}>
          PayRun focuses on the annoying parts founders actually avoid, payroll inputs, compliance calculations,
          employee records, and audit-ready history.
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <Button component={RouterLink} to="/signup" variant="contained" size="large">
            Get Started Free
          </Button>
          <Button component={RouterLink} to="/login" variant="outlined" size="large">
            Log In
          </Button>
        </Stack>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
        {features.map((feature) => (
          <Card key={feature}>
            <CardContent sx={{ p: 3 }}>
              <CheckCircleIcon color="success" sx={{ mb: 1 }} />
              <Typography variant="subtitle1">{feature}</Typography>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Stack>
  </Box>
);
