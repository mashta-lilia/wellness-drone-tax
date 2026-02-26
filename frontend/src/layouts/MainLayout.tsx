import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'; // Додали useNavigate

import { 
  Box, Drawer, List, ListItem, ListItemButton, ListItemText, 
  Typography, AppBar, Toolbar, Stack, IconButton, Tooltip 
} from '@mui/material';
import ToysIcon from '@mui/icons-material/Toys';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout'; // Іконка виходу

const drawerWidth = 240;

const MainLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // 1. Отримуємо ім'я користувача з пам'яті браузера
  const userName = localStorage.getItem('user_name') || 'Admin User';

  // 2. Функція для виходу з системи
  const handleLogout = () => {
    localStorage.removeItem('jwt_token'); // Видаляємо токен
    localStorage.removeItem('user_name'); // Видаляємо ім'я
    navigate('/login'); // Повертаємося на сторінку входу
  };

  const menuItems = [
    { text: 'Головний список', path: '/' },
    { text: 'Завантаження CSV', path: '/import' },
    { text: 'Ручне створення', path: '/create' },
  ];

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar 
        position="fixed" 
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, backgroundColor: '#fff', color: '#000' }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <ToysIcon sx={{ color: '#1a237e', fontSize: 32, transform: 'rotate(45deg)' }} />
            <Typography variant="h6" noWrap sx={{ fontWeight: 'bold', color: '#333', letterSpacing: '0.5px' }}>
              Wellness Drone Tax
            </Typography>
          </Stack>
          
          <Stack direction="row" spacing={2} alignItems="center">
            {/* ТУТ ТЕПЕР ЖИВЕ ТВОЄ ІМ'Я */}
            <Typography variant="body1" sx={{ color: '#555', fontWeight: 500 }}>
              {userName}
            </Typography>
            
            <AccountCircleIcon sx={{ color: '#1976d2', fontSize: 35 }} />

            {/* Додамо кнопку виходу для повноцінного UX */}
            <Tooltip title="Вийти">
              <IconButton onClick={handleLogout} size="small" sx={{ color: '#d32f2f' }}>
                <LogoutIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto', mt: 1 }}>
          <List>
            {menuItems.map((item) => (
              <ListItem key={item.path} disablePadding>
                <ListItemButton 
                  component={Link} 
                  to={item.path}
                  selected={location.pathname === item.path}
                >
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3, backgroundColor: '#f9f9f9', minHeight: '100vh' }}>
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
};

export default MainLayout;