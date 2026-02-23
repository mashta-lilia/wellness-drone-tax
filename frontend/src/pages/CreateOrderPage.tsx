import React from 'react';
import { Typography, Box } from '@mui/material';

const CreateOrderPage = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Нове замовлення (Create)
      </Typography>
      <Typography variant="body1">
        Тут буде форма для ручного введення даних замовлення.
      </Typography>
    </Box>
  );
};

export default CreateOrderPage;