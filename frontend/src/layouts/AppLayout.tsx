import type { ReactNode } from 'react';
import {
  AppBar,
  Box,
  BottomNavigation,
  BottomNavigationAction,
  Button,
  Container,
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useMediaQuery,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import HistoryIcon from '@mui/icons-material/History';
import LogoutIcon from '@mui/icons-material/Logout';
import PeopleIcon from '@mui/icons-material/People';
import SettingsIcon from '@mui/icons-material/Settings';
import { useTheme } from '@mui/material/styles';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

const drawerWidth = 240;

const navItems = [
  { label: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  { label: 'Employees', icon: <PeopleIcon />, path: '/employees' },
  { label: 'History', icon: <HistoryIcon />, path: '/payroll/history' },
  { label: 'Settings', icon: <SettingsIcon />, path: '/settings' },
];

export const AppLayout = ({ children }: { children: ReactNode }) => {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuthStore();

  const activePath = navItems.find((item) => location.pathname.startsWith(item.path))?.path ?? '/dashboard';

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  const navigation = (
    <List sx={{ px: 1.5, py: 2 }}>
      {navItems.map((item) => {
        const selected = activePath === item.path;
        return (
          <ListItemButton
            key={item.path}
            selected={selected}
            onClick={() => navigate(item.path)}
            sx={{
              borderRadius: 100,
              mb: 0.5,
              '&.Mui-selected': {
                bgcolor: '#E3F2FD',
                color: 'primary.main',
              },
            }}
          >
            <ListItemIcon sx={{ color: selected ? 'primary.main' : 'text.secondary', minWidth: 40 }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        );
      })}
    </List>
  );

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: { xs: 8, md: 0 } }}>
      <AppBar sx={{ zIndex: (appTheme) => appTheme.zIndex.drawer + 1 }}>
        <Toolbar>
          <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 800, flexGrow: 1 }}>
            PayRun
          </Typography>
          {user && (
            <Button startIcon={<LogoutIcon />} onClick={handleSignOut}>
              Logout
            </Button>
          )}
        </Toolbar>
      </AppBar>

      {isDesktop && user && (
        <Drawer
          variant="permanent"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
              borderRight: '1px solid #ECEFF1',
              pt: 8,
            },
          }}
        >
          {navigation}
          <Divider sx={{ mt: 'auto' }} />
        </Drawer>
      )}

      <Box component="main" sx={{ ml: { md: user ? `${drawerWidth}px` : 0 }, pt: 10 }}>
        <Container maxWidth="lg" sx={{ pb: 6 }}>
          {children}
        </Container>
      </Box>

      {!isDesktop && user && (
        <BottomNavigation
          showLabels
          value={activePath}
          onChange={(_, value: string) => navigate(value)}
          sx={{
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: 0,
            borderTop: '1px solid #ECEFF1',
            zIndex: theme.zIndex.appBar,
          }}
        >
          {navItems.map((item) => (
            <BottomNavigationAction key={item.path} label={item.label} value={item.path} icon={item.icon} />
          ))}
        </BottomNavigation>
      )}
    </Box>
  );
};
