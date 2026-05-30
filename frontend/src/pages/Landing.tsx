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
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import BarChartIcon from '@mui/icons-material/BarChart';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';

const features = [
  { title: 'Maharashtra PT rules', detail: 'Female exemption and month-level PT logic are built into payroll calculations.' },
  { title: 'Benefit toggles', detail: 'PF and ESI can be switched per employee without touching spreadsheets.' },
  { title: 'Audit-ready records', detail: 'Confirmed payroll is stored with employee-level history and Excel export.' },
];

export const Landing = () => (
  <Box sx={{ py: { xs: 4, md: 7 } }}>
    <Stack spacing={4.5}>
      <Box sx={{ maxWidth: 820 }}>
        <Chip label="Built for Indian teams under 10 people" color="primary" variant="outlined" sx={{ mb: 2 }} />
        <Typography variant="h4" sx={{ fontSize: { xs: 36, md: 56 }, lineHeight: 1.02, mb: 2 }}>
          PayRun
        </Typography>
        <Typography
          variant="h5"
          sx={{
            maxWidth: { xs: 330, sm: 740 },
            mb: 2,
            color: 'text.primary',
            fontWeight: 650,
            fontSize: { xs: 20, sm: 22, md: 26 },
            lineHeight: 1.2,
            overflowWrap: 'break-word',
          }}
        >
          Payroll records, statutory calculations, and clean exports without spreadsheet drift.
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ maxWidth: { xs: 330, sm: 660 }, mb: 3, overflowWrap: 'break-word' }}
        >
          Manage employees, draft payroll, confirm monthly runs, and export records in a workflow built for small Indian teams.
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <Button component={RouterLink} to="/signup" variant="contained" size="large" endIcon={<ArrowForwardIcon />}>
            Get Started Free
          </Button>
          <Button component={RouterLink} to="/login" variant="outlined" size="large">
            Log In
          </Button>
        </Stack>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
        {features.map((feature, index) => (
          <Card key={feature.title}>
            <CardContent sx={{ p: 3 }}>
              {index === 0 && <ShieldOutlinedIcon color="primary" sx={{ mb: 1 }} />}
              {index === 1 && <BarChartIcon color="primary" sx={{ mb: 1 }} />}
              {index === 2 && <CheckCircleIcon color="success" sx={{ mb: 1 }} />}
              <Typography variant="subtitle1">{feature.title}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                {feature.detail}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Stack>
  </Box>
);
