
import { Box, CircularProgress, Typography, Container, Paper, Button } from '@mui/material';
import { Refresh } from '@mui/icons-material';

export const LoadingView = () => (
  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
    <CircularProgress size={60} thickness={4} />
    <Typography sx={{ mt: 2, color: 'text.secondary' }}>Отримуємо дані...</Typography>
  </Box>
);

export const ErrorView = ({ message, onRetry }: { message: string, onRetry: () => void }) => (
  <Container sx={{ mt: 5 }}>
    <Paper sx={{ p: 4, textAlign: 'center', bgcolor: '#fff5f5', border: '1px solid #feb2b2', borderRadius: 3 }}>
      <Typography color="error" variant="h6" sx={{ mb: 1 }}>⚠️ Помилка завантаження</Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>{message}</Typography>
      <Button variant="outlined" color="error" startIcon={<Refresh />} onClick={onRetry}>
        Спробувати ще раз
      </Button>
    </Paper>
  </Container>
);