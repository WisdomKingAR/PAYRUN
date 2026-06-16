import { createTheme } from '@mui/material/styles';

export const payrunTheme = createTheme({
  palette: {
    primary: {
      main: '#0F5EA8',
      light: '#D9EAFB',
      dark: '#083E73',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#526172',
      light: '#D8DEE7',
      dark: '#2D3744',
      contrastText: '#FFFFFF',
    },
    success: {
      main: '#1E6B3F',
      light: '#DDF4E7',
      dark: '#114528',
      contrastText: '#FFFFFF',
    },
    error: {
      main: '#C62828',
      light: '#FDE4E4',
      dark: '#8E1515',
      contrastText: '#FFFFFF',
    },
    warning: { main: '#B7791F', light: '#FFF5E1', contrastText: '#FFFFFF' },
    info: { main: '#0B6B8F', light: '#E5F7FC', contrastText: '#FFFFFF' },
    background: { default: '#EEF3F8', paper: '#FFFFFF' },
    text: { primary: '#13202E', secondary: '#526172', disabled: '#8A97A6' },
    divider: '#DDE5EE',
  },
  typography: {
    fontFamily: 'Inter, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    h4: { fontSize: '1.85rem', fontWeight: 750, letterSpacing: 0, lineHeight: 1.18 },
    h5: { fontSize: '1.35rem', fontWeight: 700, letterSpacing: 0, lineHeight: 1.2 },
    h6: { fontSize: '1.08rem', fontWeight: 700 },
    subtitle1: { fontSize: '1rem', fontWeight: 500 },
    subtitle2: { fontSize: '0.875rem', fontWeight: 600 },
    body1: { fontSize: '1rem', fontWeight: 400 },
    body2: { fontSize: '0.875rem', fontWeight: 400 },
    caption: { fontSize: '0.75rem', fontWeight: 400 },
    overline: { fontSize: '0.68rem', fontWeight: 750, letterSpacing: '0.08em' },
  },
  shape: { borderRadius: 8 },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          border: '1px solid #DDE5EE',
          boxShadow: '0 10px 26px rgba(15, 34, 54, 0.06)',
          backgroundImage: 'none',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 700,
          paddingLeft: 18,
          paddingRight: 18,
        },
        contained: {
          boxShadow: 'none',
          '&:hover': { boxShadow: '0 8px 18px rgba(15, 94, 168, 0.18)' },
        },
        outlined: {
          borderColor: '#B9C7D6',
        },
      },
    },
    MuiFab: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 700,
          boxShadow: '0 14px 30px rgba(15, 94, 168, 0.22)',
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
            backgroundColor: '#FFFFFF',
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: '#0F5EA8',
              borderWidth: 2,
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 6, fontWeight: 700, fontSize: '0.72rem', height: 26 },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            background: '#F6F9FC',
            color: '#526172',
            fontWeight: 800,
            fontSize: '0.7rem',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            borderBottom: '1px solid #DDE5EE',
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: { '&:hover': { background: '#F8FBFD' } },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { borderBottom: '1px solid #E6EDF4', padding: '11px 14px' },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: 10, padding: 8 },
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
          color: '#13202E',
          borderBottom: '1px solid #DDE5EE',
          boxShadow: '0 6px 18px rgba(15, 34, 54, 0.05)',
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        switchBase: {
          '&.Mui-checked': {
            color: '#0F5EA8',
            '& + .MuiSwitch-track': { backgroundColor: '#0F5EA8', opacity: 0.7 },
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          height: 3,
          borderRadius: 4,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 750,
        },
      },
    },
  },
});

export const theme = payrunTheme;
