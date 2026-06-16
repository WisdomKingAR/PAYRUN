import type { ReactNode } from 'react';
import { Box, Card, CardContent, Stack, Typography } from '@mui/material';

interface StatCardProps {
  label: string;
  value: ReactNode;
  helper?: ReactNode;
  icon?: ReactNode;
  tone?: 'blue' | 'green' | 'amber' | 'slate';
}

const toneStyles = {
  blue: { bg: '#EAF3FF', color: '#0F5EA8' },
  green: { bg: '#EAF7EF', color: '#1E6B3F' },
  amber: { bg: '#FFF5E1', color: '#8A5A00' },
  slate: { bg: '#EEF2F6', color: '#526172' },
};

export const StatCard = ({ label, value, helper, icon, tone = 'blue' }: StatCardProps) => {
  const style = toneStyles[tone];

  return (
    <Card>
      <CardContent sx={{ p: 2.5 }}>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="overline" color="text.secondary">
              {label}
            </Typography>
            <Typography variant="h5" sx={{ mt: 0.75 }}>
              {value}
            </Typography>
            {helper && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {helper}
              </Typography>
            )}
          </Box>
          {icon && (
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: 2,
                display: 'grid',
                placeItems: 'center',
                bgcolor: style.bg,
                color: style.color,
                flexShrink: 0,
              }}
            >
              {icon}
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};
