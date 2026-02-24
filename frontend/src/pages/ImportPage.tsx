import React from 'react';
import { Typography, Box } from '@mui/material';

const ImportPage = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Завантаження CSV (Import)
      </Typography>
      <Typography variant="body1">
        Тут буде функціонал для вибору та завантаження файлів.
      </Typography>
    </Box>
  );
};

export default ImportPage;