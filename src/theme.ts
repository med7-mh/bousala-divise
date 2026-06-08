import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    primary: {
      main: '#059669', // Emerald 600
      light: '#34d399', // Emerald 400
      dark: '#047857', // Emerald 700
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#0f172a', // Slate 900
      light: '#334155', // Slate 700
      dark: '#020617', // Slate 950
      contrastText: '#ffffff',
    },
    background: {
      default: '#f8fafc', // Very light slate
      paper: '#ffffff',
    },
    success: {
      main: '#10b981', // Emerald 500
    },
  },
  typography: {
    fontFamily: '"Tajawal", sans-serif',
    h4: {
      fontWeight: 800,
    },
    h5: {
      fontWeight: 800,
    },
    h6: {
      fontWeight: 700,
    },
    subtitle1: {
      fontWeight: 500,
    },
    subtitle2: {
      fontWeight: 500,
    },
    button: {
      fontWeight: 700,
      letterSpacing: '0.5px',
      fontSize: '0.95rem',
    },
  },
  shape: {
    borderRadius: 4,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          padding: '10px 24px',
          boxShadow: 'none',
          borderRadius: 12,
          '&:hover': {
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
          },
        },
        contained: {
          '&.MuiButton-containedPrimary': {
            background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
            boxShadow: '0 4px 14px 0 rgba(5, 150, 105, 0.39)',
            '&:hover': {
              background: 'linear-gradient(135deg, #047857 0%, #059669 100%)',
              boxShadow: '0 6px 20px rgba(5, 150, 105, 0.23)',
            }
          }
        }
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 20px -2px rgb(0 0 0 / 0.03)',
          border: '1px solid #f1f5f9',
          borderRadius: '16px',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        elevation1: {
          boxShadow: '0 4px 20px -2px rgb(0 0 0 / 0.03)',
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
      },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 14,
            backgroundColor: '#ffffff',
            transition: 'all 0.2s',
            '&:hover fieldset': {
              borderColor: '#94a3b8',
            },
            '&.Mui-focused fieldset': {
              borderWidth: '2px',
            },
          },
        },
      },
    },
  },
});
