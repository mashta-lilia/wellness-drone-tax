import React, { useState, useEffect } from 'react';
import { 
  Grid, Typography, Box, Collapse, IconButton, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  TablePagination, CircularProgress, TextField, InputAdornment,
  TableSortLabel 
} from '@mui/material';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PercentIcon from '@mui/icons-material/Percent';
import SearchIcon from '@mui/icons-material/Search';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import SummaryCard from '../components/SummaryCard';

type OrderDirection = 'asc' | 'desc';

const OrderRow = ({ order }: { order: any }) => {
  const [open, setOpen] = React.useState(false);

  // Безпечне отримання значень з breakdown
  const breakdown = order.breakdown || {};

  return (
    <React.Fragment>
      <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell>
          <IconButton size="small" onClick={() => setOpen(!open)}>
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        {/* Виправлено назви полів на latitude та longitude */}
        <TableCell>{`${order.latitude?.toFixed(4) || 0} / ${order.longitude?.toFixed(4) || 0}`}</TableCell>
        <TableCell align="right">${order.subtotal?.toFixed(2)}</TableCell>
        <TableCell align="right">{(order.composite_tax_rate * 100).toFixed(3)}%</TableCell>
        <TableCell align="right">${order.tax_amount?.toFixed(2)}</TableCell>
        <TableCell align="right" sx={{ fontWeight: 'bold' }}>${order.total_amount?.toFixed(2)}</TableCell>
      </TableRow>
      
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 2, backgroundColor: '#f9f9f9', p: 2, borderRadius: 2 }}>
              <Typography variant="subtitle2" gutterBottom component="div" sx={{ fontWeight: 'bold' }}>
                Деталізація податків (Breakdown)
              </Typography>
              
              {/* Перевірка наявності даних у breakdown */}
              {breakdown.info ? (
                <Typography variant="body2" color="textSecondary">{breakdown.info}</Typography>
              ) : (
                <Grid container spacing={2}>
                  <Grid size={{ xs: 3 }}>
                    <Typography variant="caption">State: {((breakdown.state_rate || 0) * 100).toFixed(2)}%</Typography>
                  </Grid>
                  <Grid size={{ xs: 3 }}>
                    <Typography variant="caption">County: {((breakdown.county_rate || 0) * 100).toFixed(2)}%</Typography>
                  </Grid>
                  <Grid size={{ xs: 3 }}>
                    <Typography variant="caption">City: {((breakdown.city_rate || 0) * 100).toFixed(2)}%</Typography>
                  </Grid>
                  <Grid size={{ xs: 3 }}>
                    <Typography variant="caption">Special: {((breakdown.special_rates || 0) * 100).toFixed(2)}%</Typography>
                  </Grid>
                </Grid>
              )}
              
              <Box sx={{ mt: 2 }}>
                {order.jurisdictions?.map((j: string) => (
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
  
  const [searchId, setSearchId] = useState('');
  const [filterDate, setFilterDate] = useState<Date | null>(null);
  const [order, setOrder] = useState<OrderDirection>('asc');
  const [orderBy, setOrderBy] = useState<string>('total_amount');

  // Статистику можна було б теж брати з API, але поки лишаємо як є
  const stats = {
    totalOrders: totalCount, 
    totalTax: orders.reduce((sum, o) => sum + (o.tax_amount || 0), 0),
    averageRate: orders.length > 0 
      ? (orders.reduce((sum, o) => sum + (o.composite_tax_rate || 0), 0) / orders.length * 100).toFixed(2) 
      : 0
  };

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleRequestSort = (property: string) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
    setPage(0);
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      // URL тепер завжди використовує порт 8000 та префікс /api/
      let url = `http://localhost:8000/api/orders/?page=${page + 1}&limit=${rowsPerPage}&sortBy=${orderBy}&sortOrder=${order}`;
      
      if (searchId) url += `&search=${searchId}`;
      if (filterDate) {
        const formattedDate = filterDate.toISOString().split('T')[0];
        url += `&date=${formattedDate}`;
      }

      const response = await fetch(url);
      const data = await response.json();
      
      // КЛЮЧОВЕ ВИПРАВЛЕННЯ: беремо дані з .items
      setOrders(data.items || []);
      setTotalCount(data.total || 0);
    } catch (error) {
      console.error("Помилка при завантаженні даних:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, rowsPerPage, searchId, order, orderBy, filterDate]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box sx={{ pb: 5 }}>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold', color: '#333', textAlign: 'center' }}>
        Головний список замовлень
      </Typography>

      <Grid container spacing={3} sx={{ mb: 5 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <SummaryCard title="Оброблено замовлень" value={stats.totalOrders.toString()} icon={<ShoppingCartIcon />} />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <SummaryCard title="Сума податків (на сторінці)" value={`$${stats.totalTax.toLocaleString()}`} icon={<AttachMoneyIcon />} color="success.main" />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <SummaryCard title="Сер. ставка (на сторінці)" value={`${stats.averageRate}%`} icon={<PercentIcon />} color="warning.main" />
        </Grid>
      </Grid>

      <Box sx={{ 
        mb: 3, p: 2, bgcolor: '#fff', borderRadius: 2, boxShadow: 1, 
        display: 'flex', gap: 2,
        '& .react-datepicker-wrapper': { width: '100%', maxWidth: '400px' } 
      }}>
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

        <DatePicker
          selected={filterDate}
          onChange={(date: Date | null) => { 
            setFilterDate(date);
            setPage(0);
          }}
          placeholderText="Фільтр за датою..."
          isClearable
          dateFormat="yyyy-MM-dd"
          customInput={
            <TextField
              fullWidth
              size="small"
              variant="outlined"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <CalendarMonthIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
          }
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