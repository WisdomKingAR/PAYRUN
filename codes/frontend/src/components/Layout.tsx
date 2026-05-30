import type { ReactNode } from 'react';
import { Box, AppBar, Toolbar, Typography, Container } from '@mui/material';

export const Layout = ({ children }: { children: ReactNode }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
    <AppBar position="static" elevation={0} sx={{ borderBottom: '1px solid #eee', bgcolor: 'white', color: 'black' }}>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 700 }}>
          PayRun
        </Typography>
      </Toolbar>
    </AppBar>
    <Container component="main" sx={{ flexGrow: 1, py: 4 }}>
      {children}
    </Container>
  </Box>
);
