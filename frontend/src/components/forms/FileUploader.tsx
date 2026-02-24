import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Box, Button, Typography, Paper, CircularProgress } from '@mui/material';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ImportCSVResponse } from '../../types/order';

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
    <Box>
      <Paper 
        {...getRootProps()} 
        sx={{ 
          p: 4, textAlign: 'center', cursor: 'pointer', 
          border: '2px dashed #1976d2', bgcolor: isDragActive ? '#e3f2fd' : '#fafafa' 
        }}
      >
        <input {...getInputProps()} />
        <Typography>
          {file ? `Файл обрано: ${file.name}` : "Перетягніть CSV сюди або клікніть для вибору"}
        </Typography>
        {file && (
            <Typography variant="caption" display="block">
                Розмір: {(file.size / 1024).toFixed(2)} KB
            </Typography>
        )}
      </Paper>

      <Button 
        fullWidth variant="contained" 
        onClick={handleUpload} 
        disabled={!file || loading} // Блокування кнопки
        sx={{ mt: 2 }}
      >
        {loading ? <CircularProgress size={24} color="inherit" /> : "Завантажити CSV"}
      </Button>
    </Box>
  );
};