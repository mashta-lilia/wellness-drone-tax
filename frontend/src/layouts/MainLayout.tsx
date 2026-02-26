import { Link, Outlet, useLocation } from 'react-router-dom';
import { 
  Box, Drawer, List, ListItem, ListItemButton, ListItemText, 
  Typography, AppBar, Toolbar, Stack 
} from '@mui/material';
import ToysIcon from '@mui/icons-material/Toys'; // Схоже на пропелери дрона
import AccountCircleIcon from '@mui/icons-material/AccountCircle'; // Іконка профілю

const drawerWidth = 240;

const MainLayout = () => {
  const location = useLocation();

  const menuItems = [
    { text: 'Головний список', path: '/' },
    { text: 'Завантаження CSV', path: '/import' },
    { text: 'Ручне створення', path: '/create' },
  ];

  return (
    <Box sx={{ display: 'flex' }}>
      {/* 1. ВЕРХНЯ ПАНЕЛЬ (HEADER) */}
      <AppBar 
        position="fixed" 
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, backgroundColor: '#fff', color: '#000' }}
      >
       <Toolbar sx={{ justifyContent: 'space-between' }}>
  {/* Ліва частина: Логотип та Назва */}
  <Stack direction="row" spacing={1.5} alignItems="center">
    <ToysIcon 
      sx={{ 
        color: '#1a237e', // Темно-синій, як на скріншоті
        fontSize: 32,
        transform: 'rotate(45deg)' // Повертаємо, щоб було схоже на X-дрон
      }} 
    />
    <Typography 
      variant="h6" 
      noWrap 
      component="div" 
      sx={{ fontWeight: 'bold', color: '#333', letterSpacing: '0.5px' }}
    >
      Wellness Drone Tax
    </Typography>
  </Stack>
  
  {/* Права частина: Профіль користувача */}
  <Stack direction="row" spacing={1.5} alignItems="center">
    <Typography 
      variant="body1" 
      sx={{ color: '#555', fontWeight: 500 }}
    >
      Admin User
    </Typography>
    <AccountCircleIcon sx={{ color: '#1976d2', fontSize: 35 }} />
  </Stack>
</Toolbar>
      </AppBar>

      {/* 2. БОКОВА ПАНЕЛЬ (SIDEBAR) */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
        }}
      >
        <Toolbar /> {/* Відступ, щоб меню не перекривалося хедером */}
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

      {/* 3. ОСНОВНИЙ КОНТЕНТ */}
      <Box component="main" sx={{ flexGrow: 1, p: 3, backgroundColor: '#f9f9f9', minHeight: '100vh' }}>
        <Toolbar /> {/* Відступ для основного контенту */}
        <Outlet />
      </Box>
    </Box>
  );
};

export default MainLayout;
