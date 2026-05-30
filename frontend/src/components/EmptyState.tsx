import type { ReactNode } from 'react';
import { Box, Card, CardContent, Stack, Typography } from '@mui/material';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

export const EmptyState = ({ icon, title, description, action }: EmptyStateProps) => (
  <Card>
    <CardContent sx={{ p: { xs: 3, sm: 5 } }}>
      <Stack spacing={2} sx={{ alignItems: 'center', textAlign: 'center' }}>
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: 2,
            display: 'grid',
            placeItems: 'center',
            bgcolor: '#EEF2F6',
            color: 'text.secondary',
          }}
        >
          {icon}
        </Box>
        <Box>
          <Typography variant="h6">{title}</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5, maxWidth: 480 }}>
            {description}
          </Typography>
        </Box>
        {action}
      </Stack>
    </CardContent>
  </Card>
);
