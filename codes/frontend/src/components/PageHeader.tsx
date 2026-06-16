import type { ReactNode } from 'react';
import { Box, Chip, Stack, Typography } from '@mui/material';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  actions?: ReactNode;
  meta?: ReactNode;
}

export const PageHeader = ({ title, subtitle, eyebrow, actions, meta }: PageHeaderProps) => (
  <Stack
    direction={{ xs: 'column', md: 'row' }}
    spacing={2}
    sx={{ alignItems: { md: 'flex-end' }, justifyContent: 'space-between' }}
  >
    <Box sx={{ minWidth: 0 }}>
      {eyebrow && <Chip label={eyebrow} color="primary" variant="outlined" size="small" sx={{ mb: 1.25 }} />}
      <Typography variant="h4">{title}</Typography>
      {subtitle && (
        <Typography color="text.secondary" sx={{ mt: 0.75, maxWidth: 720 }}>
          {subtitle}
        </Typography>
      )}
      {meta && <Box sx={{ mt: 1.5 }}>{meta}</Box>}
    </Box>
    {actions && (
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ alignItems: { sm: 'center' }, flexShrink: 0 }}>
        {actions}
      </Stack>
    )}
  </Stack>
);
