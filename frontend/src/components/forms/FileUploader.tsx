import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Box, Button, Typography, Paper, CircularProgress, Stack, Chip, Divider, Alert, AlertTitle, List, ListItem, ListItemText } from '@mui/material';
import axios from 'axios';
import { toast } from 'react-toastify';
import type { ImportCSVResponse } from '../../types/order';

export const FileUploader = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportCSVResponse | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    
    if (!selectedFile) return;

    // 1. Перевірка формату
    if (!selectedFile.name.endsWith('.csv')) {
      toast.error("Помилка: можна завантажувати лише .csv файли");
      return;
    }

    // 2. Перевірка розміру файлу (максимум 5 МБ)
    const MAX_SIZE_MB = 5;
    const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
    if (selectedFile.size > MAX_SIZE_BYTES) {
      toast.error(`Помилка: файл занадто великий (максимум ${MAX_SIZE_MB} МБ)`);
      return;
    }

    setFile(selectedFile);
    setResult(null); 
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    multiple: false
  });

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const { data } = await axios.post<ImportCSVResponse>('http://localhost:8000/api/orders/import', formData);
      setResult(data);
      
      if (data.error_count === 0) {
        toast.success(`Успішно! Імпортовано ${data.success_count} замовлень.`);
      } else if (data.success_count > 0) {
        toast.warning(`Завантажено частково: ${data.success_count} успішно, ${data.error_count} з помилками.`);
      } else {
        toast.error("Не вдалося завантажити жодного замовлення з файлу.");
      }
      
      setFile(null);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Помилка сервера при імпорті");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', pb: 5 }}>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold', color: '#333', textAlign: 'center' }}>
        Завантаження замовлень (CSV)
      </Typography>

      <Paper 
        {...getRootProps()} 
        sx={{ 
          p: 6, textAlign: 'center', cursor: 'pointer', border: '2px dashed #1976d2', 
          bgcolor: isDragActive ? '#f0f7ff' : '#fff', borderRadius: 3, boxShadow: 2, 
          width: '100%', maxWidth: 450, transition: 'all 0.2s ease-in-out',
          '&:hover': { borderColor: '#115293', bgcolor: '#fafafa' }
        }}
      >
        <input {...getInputProps()} />
        <Typography variant="h6" sx={{ color: file ? '#1976d2' : '#666', fontWeight: 'medium' }}>
          {file ? file.name : "Перетягніть CSV сюди"}
        </Typography>
        <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>або клікніть для вибору файлу</Typography>
        {file && (
          <Typography variant="caption" display="block" sx={{ mt: 2, color: 'success.main', fontWeight: 'bold' }}>
            Розмір: {(file.size / 1024).toFixed(2)} KB
          </Typography>
        )}
      </Paper>

      <Button 
        variant="contained" onClick={handleUpload} disabled={!file || loading}
        sx={{ mt: 3, width: '100%', maxWidth: 450, py: 1.5, fontWeight: 'bold', textTransform: 'none', borderRadius: 2, boxShadow: 2 }}
      >
        {loading ? <CircularProgress size={24} color="inherit" /> : "Завантажити в систему"}
      </Button>

      {/* --- БЛОК РЕЗУЛЬТАТІВ ІМПОРТУ --- */}
      {result && (
        <Box sx={{ mt: 5, width: '100%', maxWidth: 600 }}>
          <Divider sx={{ mb: 3 }} />
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', textAlign: 'center' }}>Звіт про імпорт:</Typography>
          
          <Stack direction="row" spacing={2} justifyContent="center" sx={{ mb: 3 }}>
            <Chip label={`Всього: ${result.total_processed}`} color="primary" variant="outlined" />
            <Chip label={`Успішно: ${result.success_count}`} color="success" />
            <Chip label={`Помилок: ${result.error_count}`} color={result.error_count > 0 ? "error" : "default"} />
          </Stack>

          {result.errors.length > 0 && (
            <Alert severity="warning" sx={{ borderRadius: 2 }}>
              <AlertTitle>Наступні рядки не були завантажені:</AlertTitle>
              <Box sx={{ maxHeight: 200, overflowY: 'auto', mt: 1 }}>
                <List dense disablePadding>
                  {result.errors.map((err, index) => (
                    <ListItem key={index} sx={{ px: 0, py: 0 }}>
                      <ListItemText 
                        primary={`Рядок ${err.row}: ${err.reason}`}
                        primaryTypographyProps={{ variant: 'body2', color: 'error.main' }}
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