import React from 'react';
import { Typography, Box } from '@mui/material';
// Підключаємо твій компонент (перевір шлях, якщо папка src/components)
import { FileUploader } from '../components/forms/FileUploader';

const ImportPage = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom align="center">
        Масовий імпорт замовлень
      </Typography>
      
      {/* Твоє Issue 5 */}
      <FileUploader />
    </Box>
  );
};

export default ImportPage;