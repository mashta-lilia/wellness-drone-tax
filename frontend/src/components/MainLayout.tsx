import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Box, Drawer, List, ListItem, ListItemButton, ListItemText, Typography } from '@mui/material';

const drawerWidth = 240;

const MainLayout = () => {
  const location = useLocation();

  // Пункти меню згідно з завданням
  const menuItems = [
    { text: 'Головний список', path: '/' },
    { text: 'Завантаження CSV', path: '/import' },
    { text: 'Ручне створення', path: '/create' },
  ];

  return (
    <Box sx={{ display: 'flex' }}>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
            Drone Tax App
          </Typography>
        </Box>
        <List>
          {menuItems.map((item) => (
            <ListItem key={item.path} disablePadding>
              <ListItemButton 
                component={Link} 
                to={item.path}
                selected={location.pathname === item.path} // Активне посилання підсвічується
              >
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
        {/* Сюди підставляються сторінки */}
        <Outlet />
      </Box>
    </Box>
  );
};

export default MainLayout;