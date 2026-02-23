import React from 'react'; // Додай це!

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; // Імпорт стилів для гарних сповіщень
import { FileUploader } from './components/forms/FileUploader';
import { Container, Typography, Box } from '@mui/material';

function App() {
  return (
    <Container maxWidth="sm">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Імпорт замовлень 
        </Typography>
        
        {/* Твій основний компонент */}
        <FileUploader />

        {/* Глобальний контейнер для сповіщень */}
        <ToastContainer position="bottom-right" autoClose={5000} />
      </Box>
    </Container>
  );
}

export default App;