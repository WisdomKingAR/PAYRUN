import type { ReactNode } from 'react';
import {
  AppBar,
  Avatar,
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

  const handleBrandClick = async () => {
    if (user) {
      await signOut();
    }

    navigate('/', { replace: true });
  };

  const navigation = (
    <List sx={{ px: 1.25, py: 2 }}>
      {navItems.map((item) => {
        const selected = activePath === item.path;
        return (
          <ListItemButton
            key={item.path}
            selected={selected}
            onClick={() => navigate(item.path)}
            sx={{
              borderRadius: 2,
              mb: 0.75,
              minHeight: 44,
              border: '1px solid transparent',
              '&.Mui-selected': {
                bgcolor: '#EAF3FF',
                color: 'primary.main',
                borderColor: '#D1E5FA',
                '&:hover': { bgcolor: '#EAF3FF' },
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
        <Toolbar sx={{ minHeight: { xs: 58, md: 64 }, px: { xs: 2, md: 3 } }}>
          <Box
            aria-label="Go to PayRun landing page"
            component="button"
            type="button"
            onClick={() => void handleBrandClick()}
            sx={{
              border: 0,
              bgcolor: 'transparent',
              cursor: 'pointer',
              fontFamily: 'inherit',
              p: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 1.25,
              flexGrow: 1,
              textAlign: 'left',
            }}
          >
            <Avatar sx={{ width: 34, height: 34, bgcolor: 'primary.main', fontSize: 16, fontWeight: 800 }}>
              PR
            </Avatar>
            <Box>
              <Typography variant="subtitle1" sx={{ color: 'text.primary', fontWeight: 850, lineHeight: 1 }}>
                PayRun
              </Typography>
              {user && (
                <Typography variant="caption" color="text.secondary">
                  Payroll workspace
                </Typography>
              )}
            </Box>
          </Box>
          {user && (
            <Button startIcon={<LogoutIcon />} onClick={handleSignOut} variant="text" sx={{ color: 'text.secondary' }}>
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
              borderRight: '1px solid #DDE5EE',
              bgcolor: '#FFFFFF',
              pt: 8.5,
            },
          }}
        >
          {navigation}
          <Divider sx={{ mt: 'auto' }} />
        </Drawer>
      )}

      <Box component="main" sx={{ ml: { md: user ? `${drawerWidth}px` : 0 }, pt: { xs: 4, md: 4 } }}>
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
