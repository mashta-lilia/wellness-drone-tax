import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  Box, 
  Button, 
  Typography, 
  Paper, 
  CircularProgress, 
  Stack, 
  Alert, 
  AlertTitle, 
  List, 
  ListItem, 
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { importOrdersCSV } from '../../api/orders'; 
import { toast } from 'react-toastify';
import type { ImportCSVResponse } from '../../types/order';

// Гарна SVG-іконка завантаження, щоб не тягнути зайві бібліотеки
const UploadIcon = () => (
  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#1976d2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <polyline points="17 8 12 3 7 8"></polyline>
    <line x1="12" y1="3" x2="12" y2="15"></line>
  </svg>
);

export const FileUploader = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportCSVResponse | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      toast.error("Будь ласка, оберіть файл формату .csv");
      return;
    }

    setFile(selectedFile);
    setResult(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    maxFiles: 1
  });

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    try {
      const data = await importOrdersCSV(file);
      setResult(data);
      setModalOpen(true);
      setFile(null);
    } catch (error: any) {
      toast.error(error.message || 'Помилка під час імпорту');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setResult(null);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 4 }}>
      
      {/* КРАСИВА ЗОНА ЗАВАНТАЖЕННЯ */}
      <Paper 
        {...getRootProps()}
        elevation={0} 
        sx={{ 
          p: 6, 
          width: '100%', 
          maxWidth: 600, 
          textAlign: 'center',
          cursor: 'pointer',
          border: '2px dashed',
          borderColor: isDragActive ? 'primary.main' : 'grey.300',
          backgroundColor: isDragActive ? 'primary.50' : '#fafafa',
          borderRadius: 3,
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            borderColor: 'primary.main',
            backgroundColor: 'primary.50'
          }
        }}
      >
        <input {...getInputProps()} />
        
        <Box sx={{ mb: 2, transform: isDragActive ? 'scale(1.1)' : 'scale(1)', transition: 'transform 0.2s' }}>
          <UploadIcon />
        </Box>

        <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'text.primary', mb: 1 }}>
          {isDragActive ? "Відпустіть файл тут!" : "Перетягніть CSV файл сюди"}
        </Typography>
        
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Або натисніть у цій зоні, щоб обрати файл вручну
        </Typography>
        
        {file && (
          <Box sx={{ mt: 3, p: 2, bgcolor: 'white', borderRadius: 2, border: '1px solid', borderColor: 'grey.200' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
              📄 {file.name}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {(file.size / 1024).toFixed(1)} KB
            </Typography>
          </Box>
        )}
      </Paper>

      <Button
        variant="contained"
        size="large"
        onClick={handleUpload}
        disabled={!file || loading}
        sx={{ 
          mt: 4, 
          width: '100%', 
          maxWidth: 600, 
          py: 1.5, 
          fontWeight: 'bold',
          borderRadius: 2,
          textTransform: 'none',
          fontSize: '1.1rem'
        }}
      >
        {loading ? <CircularProgress size={26} color="inherit" /> : 'Почати імпорт даних'}
      </Button>

      {/* КРАСИВЕ МОДАЛЬНЕ ВІКНО ЗІ ЗВІТОМ */}
      <Dialog 
        open={modalOpen} 
        onClose={handleCloseModal}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 'bold', textAlign: 'center', fontSize: '1.5rem', pt: 3 }}>
          📊 Результати імпорту
        </DialogTitle>
        
        <DialogContent dividers sx={{ backgroundColor: '#fcfcfc', p: 3 }}>
          {result && (
            <Box>
              {/* Якщо все ідеально (без помилок) */}
              {result.error_count === 0 ? (
                <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
                  <AlertTitle sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Успішно!</AlertTitle>
                  Усі <strong>{result.success_count}</strong> рядків було завантажено та оброблено без жодної помилки.
                </Alert>
              ) : (
                /* Якщо є помилки */
                <>
                  <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                    <Box sx={{ flex: 1, p: 2, bgcolor: 'success.50', borderRadius: 2, textAlign: 'center', border: '1px solid', borderColor: 'success.200' }}>
                      <Typography variant="h5" color="success.main" fontWeight="bold">{result.success_count}</Typography>
                      <Typography variant="body2" color="success.main">Успішних</Typography>
                    </Box>
                    <Box sx={{ flex: 1, p: 2, bgcolor: 'error.50', borderRadius: 2, textAlign: 'center', border: '1px solid', borderColor: 'error.200' }}>
                      <Typography variant="h5" color="error.main" fontWeight="bold">{result.error_count}</Typography>
                      <Typography variant="body2" color="error.main">Помилок</Typography>
                    </Box>
                  </Stack>

                  <Alert severity="warning" sx={{ borderRadius: 2, mb: 2 }}>
                    <AlertTitle sx={{ fontWeight: 'bold' }}>Деталі помилок:</AlertTitle>
                    Ці рядки не потрапили до бази даних (найчастіше через те, що координати знаходяться за межами штату Нью-Йорк).
                  </Alert>

                  <Paper variant="outlined" sx={{ maxHeight: 250, overflowY: 'auto', borderRadius: 2 }}>
                    <List dense disablePadding>
                      {result.errors.map((err, index) => (
                        <ListItem key={index} divider={index < result.errors.length - 1} sx={{ py: 1.5 }}>
                          <ListItemText 
                            primary={`Рядок: ${err.row}`} 
                            secondary={err.reason}
                            primaryTypographyProps={{ fontWeight: 'bold', color: 'error.dark', mb: 0.5 }}
                            secondaryTypographyProps={{ variant: 'body2' }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Paper>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        
        <DialogActions sx={{ justifyContent: 'center', p: 3, backgroundColor: '#fcfcfc' }}>
          <Button 
            onClick={handleCloseModal} 
            variant="contained" 
            size="large"
            sx={{ px: 4, borderRadius: 2, textTransform: 'none', fontWeight: 'bold' }}
          >
            Зрозуміло, закрити
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};