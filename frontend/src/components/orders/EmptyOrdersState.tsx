import React from 'react';
import { Paper, Typography, Stack, Button } from '@mui/material';
import { Inventory2Outlined, AddCircleOutline, FileUploadOutlined } from '@mui/icons-material';

interface EmptyOrdersStateProps {
  onAddManual: () => void;
  onImportCSV: () => void;
}

export const EmptyOrdersState: React.FC<EmptyOrdersStateProps> = ({ onAddManual, onImportCSV }) => (
  <Paper sx={{ p: 10, textAlign: 'center', borderRadius: 4, border: '2px dashed #e0e0e0', bgcolor: '#fafafa' }}>
    <Inventory2Outlined sx={{ fontSize: 80, color: '#bdbdbd', mb: 2 }} />
    <Typography variant="h5" gutterBottom sx={{ fontWeight: 'medium' }}>Замовлень поки немає</Typography>
    <Typography color="text.secondary" sx={{ mb: 4 }}>База даних порожня. Додайте перші дані для розрахунку податків.</Typography>
    <Stack direction="row" spacing={2} justifyContent="center">
      <Button variant="contained" startIcon={<AddCircleOutline />} onClick={onAddManual}>
        Додати вручну
      </Button>
      <Button variant="outlined" startIcon={<FileUploadOutlined />} onClick={onImportCSV}>
        Імпорт CSV
      </Button>
    </Stack>
  </Paper>
);