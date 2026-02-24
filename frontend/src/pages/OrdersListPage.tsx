import React from 'react';
import { Grid, Typography, Box } from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PercentIcon from '@mui/icons-material/Percent';
import SummaryCard from '../components/SummaryCard';

const OrdersListPage = () => {
  // Тимчасові дані (Mock data), поки немає реального бекенду
  const stats = {
    totalOrders: 154,
    totalTax: 12540.50,
    averageRate: 18.5
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>
        Головний список замовлень
      </Typography>

      {/* Сітка віджетів */}
      <Grid container spacing={3} sx={{ mb: 5 }}>
        <Grid item xs={12} sm={4}>
          <SummaryCard 
            title="Оброблено замовлень" 
            value={stats.totalOrders} 
            icon={<ShoppingCartIcon />} 
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <SummaryCard 
            title="Загальна сума податків" 
            value={`$${stats.totalTax.toLocaleString()}`} // Форматування суми
            icon={<AttachMoneyIcon />} 
            color="success.main"
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <SummaryCard 
            title="Середня ставка" 
            value={`${stats.averageRate}%`} // Форматування відсотків
            icon={<PercentIcon />} 
            color="warning.main"
          />
        </Grid>
      </Grid>

      {/* Тут пізніше буде таблиця */}
      <Box sx={{ p: 5, border: '1px dashed grey', textAlign: 'center', borderRadius: 2 }}>
        <Typography color="text.secondary">Місце для майбутньої таблиці замовлень</Typography>
      </Box>
    </Box>
  );
};

export default OrdersListPage;