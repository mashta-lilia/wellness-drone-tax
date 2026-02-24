import React from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FileUploader } from './components/forms/FileUploader';
// 1. Додаємо імпорт нової форми тут
import { ManualOrderForm } from './components/forms/ManualOrderForm'; 
import { Container, Typography, Box, Divider } from '@mui/material';

function App() {
  return (
    <Container maxWidth="sm">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Панель управління замовленнями
        </Typography>
        
        {/* Issue 5: Завантаження CSV */}
        <FileUploader />

        {/* Додамо розділювач, щоб візуально відокремити завдання */}
        <Divider sx={{ my: 4 }} />

        {/* 2. Issue 6: Ручне створення замовлення */}
        <Typography variant="h5" gutterBottom align="center">
          Ручне введення
        </Typography>
        <ManualOrderForm />

        <ToastContainer position="bottom-right" autoClose={5000} />
      </Box>
    </Container>
  );
}

export default App;