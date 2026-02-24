import React from 'react';
import { Typography, Box } from '@mui/material';
// Підключаємо твій компонент (перевір шлях, якщо папка src/components)
import { FileUploader } from '../components/forms/FileUploader';

const ImportPage = () => {
  return (
    <Box sx={{ p: 3 }}>
      
      
      {/* Твоє Issue 5 */}
      <FileUploader />
    </Box>
  );
};

export default ImportPage;