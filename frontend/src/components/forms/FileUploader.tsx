import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Box, Button, Typography, Paper, CircularProgress, Stack, Chip, Divider, Alert, AlertTitle, List, ListItem, ListItemText } from '@mui/material';
import { importOrdersCSV } from '../../api/orders';
import { toast } from 'react-toastify';
import type { ImportCSVResponse } from '../../types/order';

/**
 * Компонент для завантаження CSV-файлів із замовленнями.
 * Підтримує drag-and-drop, клієнтську валідацію формату та розміру файлу,
 * а також відображає детальну статистику та список помилок після імпорту.
 */
export const FileUploader = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportCSVResponse | null>(null);

  /**
   * Обробник події додавання файлу в dropzone.
   * Виконує первинну перевірку розширення та розміру файлу (до 5 МБ).
   */
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      toast.error("Помилка: можна завантажувати лише .csv файли");
      return;
    }

    const MAX_SIZE_MB = 5;
    if (selectedFile.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`Помилка: файл занадто великий (максимум ${MAX_SIZE_MB} МБ)`);
      return;
    }

    setFile(selectedFile);
    setResult(null); 
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    multiple: false,
    disabled: loading
  });

  /**
   * Відправляє обраний файл на сервер.
   * Оновлює стан компонента залежно від успішності операції та кількості помилок у CSV.
   */
  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setResult(null);

    try {
      const data = await importOrdersCSV(file);
      setResult(data);
      
      if (data.error_count === 0) {
        toast.success(`Успішно! Імпортовано ${data.success_count} замовлень.`);
      } else if (data.success_count > 0) {
        toast.warning(`Завантажено частково: ${data.success_count} успішно, ${data.error_count} помилок.`);
      } else {
        toast.error("У файлі не знайдено коректних даних.");
      }
      
      setFile(null);
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Помилка при імпорті файлу");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', pb: 5 }}>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold', color: '#333', textAlign: 'center' }}>
        Імпорт замовлень
      </Typography>

      <Paper 
        {...getRootProps()} 
        sx={{ 
          p: 6, textAlign: 'center', cursor: loading ? 'not-allowed' : 'pointer', 
          border: '2px dashed #1976d2', 
          bgcolor: isDragActive ? '#f0f7ff' : '#fff', borderRadius: 3, boxShadow: 2, 
          width: '100%', maxWidth: 450, opacity: loading ? 0.6 : 1,
          transition: 'all 0.2s ease-in-out',
          '&:hover': { borderColor: !loading ? '#115293' : '#1976d2' }
        }}
      >
        <input {...getInputProps()} />
        <Typography variant="h6" sx={{ color: file ? '#1976d2' : '#666', fontWeight: 'medium' }}>
          {file ? file.name : "Перетягніть CSV сюди"}
        </Typography>
        {!file && <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>або клікніть для вибору</Typography>}
        
        {file && (
          <Typography variant="caption" display="block" sx={{ mt: 2, color: 'success.main', fontWeight: 'bold' }}>
            Готово до завантаження ({(file.size / 1024).toFixed(1)} KB)
          </Typography>
        )}
      </Paper>

      <Button 
        variant="contained" onClick={handleUpload} 
        disabled={!file || loading}
        sx={{ mt: 3, width: '100%', maxWidth: 450, py: 1.5, fontWeight: 'bold' }}
      >
        {loading ? <CircularProgress size={24} color="inherit" /> : "Завантажити дані"}
      </Button>

      {result && (
        <Box sx={{ mt: 5, width: '100%', maxWidth: 600 }}>
          <Divider sx={{ mb: 3 }} />
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', textAlign: 'center' }}>Звіт системи:</Typography>
          
          <Stack direction="row" spacing={2} justifyContent="center" sx={{ mb: 3 }}>
            <Chip label={`Всього: ${result.total_processed}`} variant="outlined" />
            <Chip label={`Оброблено: ${result.success_count}`} color="success" />
            <Chip label={`Помилки: ${result.error_count}`} color={result.error_count > 0 ? "error" : "default"} />
          </Stack>

          {result.errors.length > 0 && (
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              <AlertTitle>Помилки в рядках файлу:</AlertTitle>
              <Box sx={{ maxHeight: 150, overflowY: 'auto' }}>
                <List dense>
                  {result.errors.map((err, index) => (
                    <ListItem key={index} disableGutters>
                      <ListItemText 
                        primary={`Рядок ${err.row}: ${err.reason}`} 
                        primaryTypographyProps={{ variant: 'caption', fontWeight: 'bold' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            </Alert>
          )}
        </Box>
      )}
    </Box>
  );
};