import React from 'react';
import { Typography, Box } from '@mui/material';
// Підключаємо твою форму
import { ManualOrderForm } from '../components/forms/ManualOrderForm';

const CreateOrderPage = () => {
  return (
    <Box sx={{ p: 3 }}>
      
      
      {/* Твоє Issue 6 */}
      <ManualOrderForm />
    </Box>
  );
};

export default CreateOrderPage;