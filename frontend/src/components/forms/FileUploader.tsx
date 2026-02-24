import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Box, Button, Typography, Paper, CircularProgress } from '@mui/material';
import axios from 'axios';
import { toast } from 'react-toastify';
import type { ImportCSVResponse } from '../../types/order';

export const FileUploader = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  // Обробка вибору файлу
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    // Локальна валідація: тільки .csv
    if (selectedFile && selectedFile.name.endsWith('.csv')) {
      setFile(selectedFile);
    } else {
      toast.error("Помилка: можна завантажувати лише .csv файли");
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    multiple: false
  });

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);

    const formData = new FormData();
    formData.append('file', file); // Поле 'file' згідно з контрактом

    try {
      // Відправка на бекенд
      const { data } = await axios.post<ImportCSVResponse>('http://localhost:8000/orders/import', formData);
      
      toast.success(`Успішно! Імпортовано ${data.success_count} замовлень.`);
      setFile(null); // Очищення форми
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Помилка сервера при імпорті");
    } finally {
      setLoading(false);
    }
  };

  return (
  <Box 
    sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', // Центруємо все по горизонталі
      justifyContent: 'center', 
      minHeight: '70vh', 
      pb: 5 
    }}
  >
    {/* ГОЛОВНИЙ ЗАГОЛОВОК СТОРІНКИ */}
    <Typography 
      variant="h4" 
      sx={{ 
        mb: 4, 
        fontWeight: 'bold', 
        color: '#333',
        textAlign: 'center' 
      }}
    >
      Завантаження замовлень (CSV)
    </Typography>

    <Paper 
      {...getRootProps()} 
      sx={{ 
        p: 6, // Більше відступів для "повітря"
        textAlign: 'center', 
        cursor: 'pointer', 
        border: '2px dashed #1976d2', 
        bgcolor: isDragActive ? '#f0f7ff' : '#fff', 
        borderRadius: 3, 
        boxShadow: 2, // Тінь як у ручної форми
        width: '100%',
        maxWidth: 450, 
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          borderColor: '#115293',
          bgcolor: '#fafafa'
        }
      }}
    >
      <input {...getInputProps()} />
      <Typography variant="h6" sx={{ color: file ? '#1976d2' : '#666', fontWeight: 'medium' }}>
        {file ? file.name : "Перетягніть CSV сюди"}
      </Typography>
      
      <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
        або клікніть для вибору файлу
      </Typography>

      {file && (
        <Typography variant="caption" display="block" sx={{ mt: 2, color: 'success.main', fontWeight: 'bold' }}>
          Розмір: {(file.size / 1024).toFixed(2)} KB
        </Typography>
      )}
    </Paper>

    <Button 
      variant="contained" 
      onClick={handleUpload} 
      disabled={!file || loading}
      sx={{ 
        mt: 3, 
        width: '100%', 
        maxWidth: 450, 
        py: 1.5, 
        fontWeight: 'bold', 
        textTransform: 'none',
        borderRadius: 2,
        boxShadow: 2
      }}
    >
      {loading ? <CircularProgress size={24} color="inherit" /> : "Завантажити в систему"}
    </Button>
  </Box>
);}