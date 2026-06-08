import { ReactNode, useState } from 'react';
import { 
  AppBar, Box, CssBaseline, Drawer, IconButton, 
  List, ListItem, ListItemButton, ListItemIcon, ListItemText, 
  Toolbar, Typography, Button, Divider, BottomNavigation, BottomNavigationAction,
  useTheme, useMediaQuery, Menu, MenuItem, Avatar
} from '@mui/material';
import { 
  Dashboard as DashboardIcon, 
  SwapHoriz as SwapIcon, 
  AccountBalanceWallet as WalletIcon,
  Logout as LogoutIcon,
  ListAlt as ListIcon,
  Settings as SettingsIcon,
  Person as PersonIcon,
  GetApp as DownloadIcon
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';

const drawerWidth = 260;

interface LayoutProps {
  window?: () => Window;
  children: ReactNode;
}

export default function Layout({ window, children }: LayoutProps) {
  const { signOut, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleMenuClose();
    await signOut();
  };

  const menuItems = [
    { text: 'الرئيسية', icon: <DashboardIcon />, path: '/' },
    { text: 'تبديل عملة', icon: <SwapIcon />, path: '/transactions' },
    { text: 'الخزنة', icon: <WalletIcon />, path: '/vault' },
    { text: 'السجل', icon: <ListIcon />, path: '/history' },
    { text: 'الإعدادات', icon: <SettingsIcon />, path: '/currencies' },
  ];

  const drawer = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Toolbar sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 3 }}>
        <Box 
          component="img" 
          src="/src/assets/images/bousala_logo_1780879823251.png" 
          alt="Bousala Logo" 
          sx={{ width: 48, height: 48, mr: 1.5, borderRadius: 3, boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}
        />
        <Typography variant="h5" noWrap component="div" sx={{ fontWeight: 800, color: 'primary.main', letterSpacing: '-0.5px' }}>
          بوصلة
        </Typography>
      </Toolbar>
      <Divider sx={{ mx: 3, opacity: 0.5 }} />
      <List sx={{ flexGrow: 1, pt: 3, px: 2 }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton 
              selected={location.pathname === item.path}
              onClick={() => navigate(item.path)}
              sx={{
                mb: 1.5,
                borderRadius: 3,
                py: 1.2,
                '&.Mui-selected': {
                  bgcolor: 'rgba(5, 150, 105, 0.08)',
                  color: 'primary.main',
                  '&:hover': {
                    bgcolor: 'rgba(5, 150, 105, 0.12)',
                  }
                },
                '&:hover': {
                  bgcolor: 'rgba(0, 0, 0, 0.02)',
                }
              }}
            >
              <ListItemIcon sx={{ minWidth: 44, color: location.pathname === item.path ? 'primary.main' : 'text.secondary' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text} 
                primaryTypographyProps={{ 
                  fontWeight: location.pathname === item.path ? 700 : 500,
                  fontSize: '1.05rem'
                }} 
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Box sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, p: 2, bgcolor: 'rgba(15, 23, 42, 0.02)', borderRadius: 3 }}>
          <Avatar sx={{ width: 40, height: 40, mr: 2, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
            {profile?.full_name?.charAt(0) || <PersonIcon />}
          </Avatar>
          <Box>
            <Typography variant="body2" color="text.secondary">مرحباً بك،</Typography>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, display: 'block' }} noWrap>
              {profile?.full_name || 'موظف للصرافة'}
            </Typography>
          </Box>
        </Box>
        <Button 
          fullWidth 
          variant="outlined" 
          color="error"
          sx={{ borderRadius: 3, py: 1.2 }}
          startIcon={<LogoutIcon />}
          onClick={signOut}
        >
          تسجيل الخروج
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', dir: 'rtl', bgcolor: 'background.default', minHeight: '100vh' }}>
      <CssBaseline />
      
      {/* Top AppBar for Mobile */}
      {isMobile && (
        <AppBar
          position="fixed"
          elevation={0}
          sx={{
            bgcolor: 'background.paper',
            borderBottom: '1px solid',
            borderColor: 'divider',
            color: 'text.primary',
            backdropFilter: 'blur(8px)',
            backgroundColor: 'rgba(255, 255, 255, 0.9)'
          }}
        >
          <Toolbar>
            <Box 
              component="img" 
              src="/src/assets/images/bousala_logo_1780879823251.png" 
              alt="Logo" 
              sx={{ width: 32, height: 32, mr: 1.5, borderRadius: 2 }}
            />
            <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontWeight: 800, color: 'primary.main' }}>
              {menuItems.find(i => i.path === location.pathname)?.text || 'بوصلة'}
            </Typography>
            
            <IconButton onClick={handleMenuOpen} edge="end">
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '0.9rem' }}>
                {profile?.full_name?.charAt(0) || <PersonIcon fontSize="small"/>}
              </Avatar>
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <MenuItem disabled sx={{ opacity: '1 !important' }}>
                <Typography variant="body2" color="text.secondary">
                  {profile?.full_name || 'موظف'}
                </Typography>
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                <ListItemIcon sx={{ color: 'error.main' }}><LogoutIcon fontSize="small" /></ListItemIcon>
                تسجيل الخروج
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>
      )}

      {/* Desktop Drawer */}
      {!isMobile && (
        <Box
          component="nav"
          sx={{ width: drawerWidth, flexShrink: 0 }}
        >
          <Drawer
            variant="permanent"
            anchor="right"
            sx={{
              '& .MuiDrawer-paper': { 
                boxSizing: 'border-box', 
                width: drawerWidth,
                borderLeft: '1px solid #f1f5f9',
                boxShadow: '-4px 0 20px rgba(0,0,0,0.01)'
              },
            }}
            open
          >
            {drawer}
          </Drawer>
        </Box>
      )}

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{ 
          flexGrow: 1, 
          p: { xs: 2, sm: 4 }, 
          width: { xs: '100%', sm: `calc(100% - ${drawerWidth}px)` },
          pb: { xs: 10, sm: 4 }, // Extra padding on mobile for BottomNav
          maxWidth: '1200px',
          mx: 'auto'
        }}
      >
        {isMobile && <Toolbar />} {/* Spacing for Mobile AppBar */}
        {children}
      </Box>

      {/* Bottom Navigation for Mobile */}
      {isMobile && (
        <Box 
          sx={{ 
            position: 'fixed', 
            bottom: 0, 
            left: 0, 
            right: 0, 
            borderTop: '1px solid #e2e8f0', 
            bgcolor: 'background.paper',
            zIndex: 1100,
            pb: 'env(safe-area-inset-bottom)' // specifically for iOS
          }}
        >
          <BottomNavigation
            showLabels
            value={location.pathname}
            onChange={(_, newValue) => {
              navigate(newValue);
            }}
            sx={{ height: 70 }}
          >
            {menuItems.map((item) => (
              <BottomNavigationAction 
                key={item.text}
                label={item.text} 
                value={item.path} 
                icon={item.icon} 
                sx={{
                  color: 'text.secondary',
                  '&.Mui-selected': {
                    color: 'primary.main',
                  },
                  '& .MuiBottomNavigationAction-label': {
                    fontFamily: 'Tajawal',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    mt: 0.5
                  },
                  '&.Mui-selected .MuiBottomNavigationAction-label': {
                    fontSize: '0.8rem',
                    fontWeight: 700
                  }
                }}
              />
            ))}
          </BottomNavigation>
        </Box>
      )}
    </Box>
  );
}
