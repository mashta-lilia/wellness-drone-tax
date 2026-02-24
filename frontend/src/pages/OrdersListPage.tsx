import React from 'react';
import { 
  Grid, Typography, Box, Collapse, IconButton, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper 
} from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PercentIcon from '@mui/icons-material/Percent';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import SummaryCard from '../components/SummaryCard';

// OrderRow залишається тут, він уже на своєму місці
const OrderRow = ({ order }: { order: any }) => {
  const [open, setOpen] = React.useState(false);

  return (
    <React.Fragment>
      <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell>
          <IconButton size="small" onClick={() => setOpen(!open)}>
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell>{`${order.lat.toFixed(4)} / ${order.lon.toFixed(4)}`}</TableCell>
        <TableCell align="right">${order.subtotal.toFixed(2)}</TableCell>
        <TableCell align="right">{(order.composite_tax_rate * 100).toFixed(3)}%</TableCell>
        <TableCell align="right">${order.tax_amount.toFixed(2)}</TableCell>
        <TableCell align="right" sx={{ fontWeight: 'bold' }}>${order.total_amount.toFixed(2)}</TableCell>
      </TableRow>
      
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 2, backgroundColor: '#f9f9f9', p: 2, borderRadius: 2 }}>
              <Typography variant="subtitle2" gutterBottom component="div" sx={{ fontWeight: 'bold' }}>
                Деталізація податків (Breakdown)
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 3 }}>
                  <Typography variant="caption">State: {(order.breakdown.state_rate * 100).toFixed(2)}%</Typography>
                </Grid>
                <Grid size={{ xs: 3 }}>
                  <Typography variant="caption">County: {(order.breakdown.county_rate * 100).toFixed(2)}%</Typography>
                </Grid>
                <Grid size={{ xs: 3 }}>
                  <Typography variant="caption">City: {(order.breakdown.city_rate * 100).toFixed(2)}%</Typography>
                </Grid>
                <Grid size={{ xs: 3 }}>
                  <Typography variant="caption">Special: {(order.breakdown.special_rates * 100).toFixed(2)}%</Typography>
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 2 }}>
                {order.jurisdictions.map((j: string) => (
                  <Chip key={j} label={j} size="small" color="primary" variant="outlined" sx={{ mr: 1 }} />
                ))}
              </Box>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
};

const OrdersListPage = () => {
  const stats = {
    totalOrders: 154,
    totalTax: 12540.5,
    averageRate: 18.5
  };

  const orders = [
    {
      id: '1',
      lat: 40.7128,
      lon: -74.0060,
      subtotal: 100.00,
      composite_tax_rate: 0.08875,
      tax_amount: 8.88,
      total_amount: 108.88,
      breakdown: {
        state_rate: 0.04,
        county_rate: 0.02,
        city_rate: 0.02875,
        special_rates: 0.00
      },
      jurisdictions: ['New York', 'NY County']
    },
    {
      id: '2',
      lat: 34.0522,
      lon: -118.2437,
      subtotal: 200.00,
      composite_tax_rate: 0.095,
      tax_amount: 19.00,
      total_amount: 219.00,
      breakdown: {
        state_rate: 0.06,
        county_rate: 0.0025,
        city_rate: 0.0325,
        special_rates: 0.00
      },
      jurisdictions: ['California', 'Los Angeles']
    }
  ];

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>
        Головний список замовлень
      </Typography>

      <Grid container spacing={3} sx={{ mb: 5 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <SummaryCard 
            title="Оброблено замовлень" 
            value={stats.totalOrders.toString()} 
            icon={<ShoppingCartIcon />} 
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <SummaryCard 
            title="Загальна сума податків" 
            value={`$${stats.totalTax.toLocaleString()}`} 
            icon={<AttachMoneyIcon />} 
            color="success.main"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <SummaryCard 
            title="Середня ставка" 
            value={`${stats.averageRate}%`} 
            icon={<PercentIcon />} 
            color="warning.main"
          />
        </Grid>
      </Grid>

      {/* РЕАЛЬНА ТАБЛИЦЯ ЗАМІСТЬ ПУНКТИРУ */}
      <TableContainer component={Paper} sx={{ boxShadow: 3, borderRadius: 2 }}>
        <Table>
          <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
            <TableRow>
              <TableCell />
              <TableCell sx={{ fontWeight: 'bold' }}>Координати (lat/lon)</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>Subtotal</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>Комб. ставка</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>Сума податку</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>Загальна сума</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.map((order) => (
              <OrderRow key={order.id} order={order} />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default OrdersListPage;