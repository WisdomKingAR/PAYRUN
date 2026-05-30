import { createTheme } from '@mui/material/styles';

export const payrunTheme = createTheme({
  palette: {
    primary: {
      main: '#1565C0',
      light: '#5E92F3',
      dark: '#003C8F',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#546E7A',
      light: '#819CA9',
      dark: '#29434E',
      contrastText: '#FFFFFF',
    },
    success: {
      main: '#2E7D32',
      light: '#60AD5E',
      dark: '#005005',
      contrastText: '#FFFFFF',
    },
    error: {
      main: '#D32F2F',
      light: '#FF6659',
      dark: '#9A0007',
      contrastText: '#FFFFFF',
    },
    warning: { main: '#F57F17', contrastText: '#FFFFFF' },
    background: { default: '#F5F7FA', paper: '#FFFFFF' },
    text: { primary: '#1A1C1E', secondary: '#43474E', disabled: '#74777F' },
    divider: '#ECEFF1',
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontSize: '2rem', fontWeight: 700, letterSpacing: 0 },
    h5: { fontSize: '1.5rem', fontWeight: 600, letterSpacing: 0 },
    h6: { fontSize: '1.25rem', fontWeight: 600 },
    subtitle1: { fontSize: '1rem', fontWeight: 500 },
    subtitle2: { fontSize: '0.875rem', fontWeight: 600 },
    body1: { fontSize: '1rem', fontWeight: 400 },
    body2: { fontSize: '0.875rem', fontWeight: 400 },
    caption: { fontSize: '0.75rem', fontWeight: 400 },
    overline: { fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.1em' },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0px 1px 3px rgba(0,0,0,0.12), 0px 1px 2px rgba(0,0,0,0.24)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 100,
          textTransform: 'none',
          fontWeight: 500,
          paddingLeft: 24,
          paddingRight: 24,
        },
        contained: {
          boxShadow: 'none',
          '&:hover': { boxShadow: '0px 1px 3px rgba(0,0,0,0.24)' },
        },
      },
    },
    MuiFab: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          textTransform: 'none',
          fontWeight: 500,
          boxShadow: '0px 10px 20px rgba(0,0,0,0.19), 0px 6px 6px rgba(0,0,0,0.23)',
        },
        extended: {
          height: 56,
          gap: 10,
          paddingLeft: 24,
          paddingRight: 24,
          fontSize: '0.9375rem',
        },
      },
    },
    MuiTextField: {
      defaultProps: { variant: 'outlined', fullWidth: true, size: 'small' },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: '#1565C0',
              borderWidth: 2,
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 8, fontWeight: 500, fontSize: '0.75rem', height: 28 },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            background: '#F5F7FA',
            color: '#43474E',
            fontWeight: 600,
            fontSize: '0.7rem',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            borderBottom: '2px solid #ECEFF1',
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: { '&:hover': { background: '#F5F7FA' } },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { borderBottom: '1px solid #ECEFF1', padding: '12px 16px' },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: 28, padding: 8 },
      },
    },
    MuiSnackbar: {
      defaultProps: { anchorOrigin: { vertical: 'bottom', horizontal: 'center' } },
    },
    MuiAppBar: {
      defaultProps: { elevation: 0, position: 'sticky' },
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF',
          color: '#1A1C1E',
          boxShadow: '0px 1px 3px rgba(0,0,0,0.12)',
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        switchBase: {
          '&.Mui-checked': {
            color: '#1565C0',
            '& + .MuiSwitch-track': { backgroundColor: '#1565C0', opacity: 0.7 },
          },
        },
      },
    },
  },
});

export const theme = payrunTheme;
