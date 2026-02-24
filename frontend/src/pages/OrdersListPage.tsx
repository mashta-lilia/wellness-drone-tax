import React, { useState, useEffect } from 'react';
import { 
  Grid, Typography, Box, Collapse, IconButton, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  TablePagination, CircularProgress, TextField, InputAdornment,
  TableSortLabel // Додано для клікабельних заголовків
} from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PercentIcon from '@mui/icons-material/Percent';
import SearchIcon from '@mui/icons-material/Search';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import SummaryCard from '../components/SummaryCard';

// Тип для напрямку сортування
type OrderDirection = 'asc' | 'desc';

// Компонент рядка таблиці
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
  const [orders, setOrders] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  
  // 1. Стан для фільтрів та сортування
  const [searchId, setSearchId] = useState('');
  const [order, setOrder] = useState<OrderDirection>('asc');
  const [orderBy, setOrderBy] = useState<string>('total_amount');

  const stats = {
    totalOrders: 154,
    totalTax: 12540.5,
    averageRate: 18.5
  };

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // 2. Обробник зміни сортування
  const handleRequestSort = (property: string) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
    setPage(0); // Скидаємо на першу сторінку при зміні сортування
  };

  // 3. Оновлена функція запиту з усіма параметрами
  const fetchOrders = async () => {
    setLoading(true);
    try {
      // Формуємо URL з пагінацією, пошуком та сортуванням
      let url = `http://localhost:5000/api/orders?page=${page + 1}&limit=${rowsPerPage}&sortBy=${orderBy}&sortOrder=${order}`;
      
      if (searchId) {
        url += `&search=${searchId}`;
      }

      const response = await fetch(url);
      const data = await response.json();
      
      setOrders(data.orders || []);
      setTotalCount(data.total || 0);
    } catch (error) {
      console.error("Помилка при завантаженні даних:", error);
    } finally {
      setLoading(false);
    }
  };

  // 4. Слідкуємо за всіма змінами стейту
  useEffect(() => {
    fetchOrders();
  }, [page, rowsPerPage, searchId, order, orderBy]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box sx={{ pb: 5 }}>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>
        Головний список замовлень
      </Typography>

      <Grid container spacing={3} sx={{ mb: 5 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <SummaryCard title="Оброблено замовлень" value={stats.totalOrders.toString()} icon={<ShoppingCartIcon />} />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <SummaryCard title="Загальна сума податків" value={`$${stats.totalTax.toLocaleString()}`} icon={<AttachMoneyIcon />} color="success.main" />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <SummaryCard title="Середня ставка" value={`${stats.averageRate}%`} icon={<PercentIcon />} color="warning.main" />
        </Grid>
      </Grid>

      {/* ПАНЕЛЬ ФІЛЬТРІВ */}
      <Box sx={{ mb: 3, p: 2, bgcolor: '#fff', borderRadius: 2, boxShadow: 1, display: 'flex', gap: 2 }}>
        <TextField
          fullWidth
          size="small"
          variant="outlined"
          placeholder="Пошук за ID замовлення..."
          value={searchId}
          onChange={(e) => {
            setSearchId(e.target.value);
            setPage(0);
          }}
          sx={{ maxWidth: 400 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <TableContainer component={Paper} sx={{ boxShadow: 3, borderRadius: 2, position: 'relative' }}>
        {loading && (
          <Box sx={{ 
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            zIndex: 2, bgcolor: 'rgba(255, 255, 255, 0.7)' 
          }}>
            <CircularProgress />
          </Box>
        )}

        <Table>
          <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
            <TableRow>
              <TableCell />
              <TableCell sx={{ fontWeight: 'bold' }}>Координати (lat/lon)</TableCell>
              
              {/* Клікабельні заголовки */}
              <TableCell align="right">
                <TableSortLabel
                  active={orderBy === 'subtotal'}
                  direction={orderBy === 'subtotal' ? order : 'asc'}
                  onClick={() => handleRequestSort('subtotal')}
                  sx={{ fontWeight: 'bold' }}
                >
                  Subtotal
                </TableSortLabel>
              </TableCell>

              <TableCell align="right">
                <TableSortLabel
                  active={orderBy === 'composite_tax_rate'}
                  direction={orderBy === 'composite_tax_rate' ? order : 'asc'}
                  onClick={() => handleRequestSort('composite_tax_rate')}
                  sx={{ fontWeight: 'bold' }}
                >
                  Комб. ставка
                </TableSortLabel>
              </TableCell>

              <TableCell align="right">
                <TableSortLabel
                  active={orderBy === 'tax_amount'}
                  direction={orderBy === 'tax_amount' ? order : 'asc'}
                  onClick={() => handleRequestSort('tax_amount')}
                  sx={{ fontWeight: 'bold' }}
                >
                  Сума податку
                </TableSortLabel>
              </TableCell>

              <TableCell align="right">
                <TableSortLabel
                  active={orderBy === 'total_amount'}
                  direction={orderBy === 'total_amount' ? order : 'asc'}
                  onClick={() => handleRequestSort('total_amount')}
                  sx={{ fontWeight: 'bold' }}
                >
                  Загальна сума
                </TableSortLabel>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.length > 0 ? (
              orders.map((order) => (
                <OrderRow key={order.id} order={order} />
              ))
            ) : (
              !loading && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    Замовлень не знайдено
                  </TableCell>
                </TableRow>
              )
            )}
          </TableBody>
        </Table>
        
        <TablePagination
          rowsPerPageOptions={[10, 20, 50]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Рядків на сторінці:"
        />
      </TableContainer>
    </Box>
  );
};

export default OrdersListPage;