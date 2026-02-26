import React from 'react';
import { Container, Stack, Typography, Chip } from '@mui/material'; // Для MUI елементів
import { useNavigate } from 'react-router-dom';
import { useOrders } from '../hooks/useOrders'; // Твій кастомний хук
import { LoadingView, ErrorView } from '../components/common/StatusViews';
import { EmptyOrdersState } from '../components/orders/EmptyOrdersState';
import { OrdersTable } from '../components/orders/OrdersTable';

export const OrdersListPage: React.FC = () => {
  // Дістаємо дані та функцію оновлення з хука
  const { orders = [], loading, error, refreshOrders } = useOrders();
  const navigate = useNavigate();

  // Використовуємо винесені компоненти станів
  if (loading) return <LoadingView />;
  if (error) return <ErrorView message={error} onRetry={refreshOrders} />;

  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      {/* Заголовок та лічильник */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#333' }}>
          Список замовлень
        </Typography>
        <Chip 
          label={`Всього: ${orders.length}`} 
          color="primary" 
          sx={{ fontWeight: 'bold' }} 
        />
      </Stack>
      
      {/* Логіка відображення: або заглушка, або таблиця */}
      {orders.length === 0 ? (
        <EmptyOrdersState 
          onAddManual={() => navigate('/create')} 
          onImportCSV={() => navigate('/import')} 
        />
      ) : (
        <OrdersTable orders={orders} />
      )}
    </Container>
  );
};