import { Box, CircularProgress, Typography, Container, Paper, Button } from '@mui/material';
import { Refresh } from '@mui/icons-material';

/**
 * Компонент для відображення стану завантаження.
 * Показує індикатор прогресу (спінер) та текст очікування по центру екрана.
 */
export const LoadingView = () => (
  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
    <CircularProgress size={60} thickness={4} />
    <Typography sx={{ mt: 2, color: 'text.secondary' }}>Отримуємо дані...</Typography>
  </Box>
);

/**
 * Властивості для компонента ErrorView.
 */
interface ErrorViewProps {
  /** Текст повідомлення про помилку, який буде показано користувачеві. */
  message: string;
  /** Функція, яка викликається при натисканні на кнопку "Спробувати ще раз". */
  onRetry: () => void;
}

/**
 * Компонент для відображення стану помилки.
 * Показує стилізований блок з описом проблеми та кнопкою для повторної дії.
 * * @param props - Властивості компонента (містить message та onRetry).
 */
export const ErrorView = ({ message, onRetry }: ErrorViewProps) => (
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