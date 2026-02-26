import React from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, CircularProgress, 
  Container, Button, Stack, Chip 
} from '@mui/material';
import { Inventory2Outlined, AddCircleOutline, FileUploadOutlined } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useOrders } from '../hooks/useOrders'; // Пункт №4: Логіка в хуку
import { OrderRow } from '../components/orders/OrderRow'; // Пункт №4: Декомпозиція

export const OrdersListPage: React.FC = () => {
  const { orders, loading, error } = useOrders();
  const navigate = useNavigate();

  // Пункт №3: Loading UX
  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <CircularProgress size={60} thickness={4} />
        <Typography sx={{ mt: 2, color: 'text.secondary' }}>Отримуємо дані з сервера...</Typography>
      </Box>
    );
  }

  // Обробка помилок (Пункт №2: Українізація)
  if (error) {
    return (
      <Container sx={{ mt: 5 }}>
        <Paper sx={{ p: 4, textAlign: 'center', bgcolor: '#fff5f5', border: '1px solid #feb2b2' }}>
          <Typography color="error" variant="h6">⚠️ Помилка завантаження</Typography>
          <Typography color="text.secondary">{error}</Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#333' }}>
          Список замовлень
        </Typography>
        <Chip label={`Всього: ${orders.length}`} color="primary" sx={{ fontWeight: 'bold' }} />
      </Stack>
      
      {orders.length === 0 ? (
        // Пункт №3: Empty State (Інформативна заглушка з CTA)
        <Paper sx={{ p: 10, textAlign: 'center', borderRadius: 4, border: '2px dashed #e0e0e0', bgcolor: '#fafafa' }}>
          <Inventory2Outlined sx={{ fontSize: 80, color: '#bdbdbd', mb: 2 }} />
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 'medium' }}>Замовлень поки немає</Typography>
          <Typography color="text.secondary" sx={{ mb: 4 }}>База даних порожня. Додайте перші дані для розрахунку податків.</Typography>
          <Stack direction="row" spacing={2} justifyContent="center">
            <Button 
              variant="contained" startIcon={<AddCircleOutline />} 
              onClick={() => navigate('/create')}
            >
              Додати вручну
            </Button>
            <Button 
              variant="outlined" startIcon={<FileUploadOutlined />} 
              onClick={() => navigate('/import')}
            >
              Імпорт CSV
            </Button>
          </Stack>
        </Paper>
      ) : (
        // Основна таблиця (Пункт №4: Декомпозиція)
        <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: 3 }}>
          <Table sx={{ minWidth: 650 }}>
            <TableHead sx={{ bgcolor: '#f5f5f5' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Координати (Lat, Lng)</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Сума (Subtotal)</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Ставка податку</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Разом (Total)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.map((order) => (
                <OrderRow key={order.id} order={order} />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  );
};