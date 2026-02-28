import React from 'react';
import { Paper, Typography, Stack, Button } from '@mui/material';
import { Inventory2Outlined, AddCircleOutline, FileUploadOutlined } from '@mui/icons-material';

/**
 * Властивості для компонента EmptyOrdersState.
 */
interface EmptyOrdersStateProps {
  /** Функція, яка викликається при натисканні на кнопку "Додати вручну". */
  onAddManual: () => void;
  /** Функція, яка викликається при натисканні на кнопку "Імпорт CSV". */
  onImportCSV: () => void;
}

/**
 * Компонент для відображення порожнього стану списку замовлень.
 * Показує іконку, повідомлення про відсутність даних та пропонує дві дії:
 * створити замовлення вручну або імпортувати з CSV-файлу.
 * * @param props - Властивості компонента (містить onAddManual та onImportCSV).
 * @returns Відрендерений компонент порожнього стану.
 */
export const EmptyOrdersState: React.FC<EmptyOrdersStateProps> = ({ onAddManual, onImportCSV }) => (
  <Paper sx={{ p: 10, textAlign: 'center', borderRadius: 4, border: '2px dashed #e0e0e0', bgcolor: '#fafafa' }}>
    <Inventory2Outlined sx={{ fontSize: 80, color: '#bdbdbd', mb: 2 }} />
    <Typography variant="h5" gutterBottom sx={{ fontWeight: 'medium' }}>
      Замовлень не знайдено
    </Typography>
    <Typography color="text.secondary" sx={{ mb: 4 }}>
      Ваша база даних порожня. Спробуйте імпортувати CSV файл або створити замовлення вручну.
    </Typography>
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