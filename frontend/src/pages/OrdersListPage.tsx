import React, { useState, useEffect } from 'react';
import { 
  Grid, Typography, Box,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  TablePagination, CircularProgress, TextField, InputAdornment,
  TableSortLabel, Button, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions 
} from '@mui/material';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PercentIcon from '@mui/icons-material/Percent';
import SearchIcon from '@mui/icons-material/Search';

import DownloadIcon from '@mui/icons-material/Download';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import axios from 'axios';
import { toast } from 'react-toastify';
import SummaryCard from '../components/SummaryCard';
import type { Order } from '../types/order';
import { clearAllOrders } from '../api/orders';
import { OrderRow } from '../components/orders/OrderRow';

type OrderDirection = 'asc' | 'desc';


/**
 * Головна сторінка зі списком замовлень.
 * Містить таблицю з пагінацією, сортуванням, фільтрацією за ID та датою.
 * Надає функціонал для експорту даних у CSV та повного очищення бази.
 */
export const OrdersListPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalTaxDb, setTotalTaxDb] = useState(0);
  const [avgRateDb, setAvgRateDb] = useState(0);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [openClearDialog, setOpenClearDialog] = useState(false);
  
  const [searchId, setSearchId] = useState('');
  const [filterDate, setFilterDate] = useState<Date | null>(null);
  const [order, setOrder] = useState<OrderDirection>('desc');
  const [orderBy, setOrderBy] = useState<string>('timestamp');

  const stats = {
    totalOrders: totalCount, 
    totalTax: totalTaxDb,
    averageRate: (avgRateDb * 100).toFixed(2)
  };

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  /**
   * Обробник зміни напрямку або колонки сортування.
   * @param property - Назва поля, за яким відбувається сортування.
   */
  const handleRequestSort = (property: string) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
    setPage(0);
  };

  /**
   * Завантажує список замовлень з сервера, враховуючи поточну сторінку,
   * ліміт, сортування та активні фільтри.
   */
  const fetchOrders = async () => {
    setLoading(true);
    try {
      let url = `http://localhost:8000/api/orders/?page=${page + 1}&limit=${rowsPerPage}&sortBy=${orderBy}&sortOrder=${order}`;
      if (searchId) url += `&search=${searchId}`;
      if (filterDate) url += `&date=${filterDate.toISOString().split('T')[0]}`;

      const response = await axios.get(url);
      setOrders(response.data.items || []);
      setTotalCount(response.data.total || 0);
      setTotalTaxDb(response.data.total_tax || 0);
      setAvgRateDb(response.data.avg_rate || 0);
    } catch (error) {
      console.error("Помилка при завантаженні даних:", error);
      toast.error("Не вдалося завантажити замовлення");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Виконує запит на повне очищення бази даних.
   * Після успішного видалення скидає всі фільтри та оновлює таблицю.
   */
  const confirmClearDatabase = async () => {
    setOpenClearDialog(false);
    setLoading(true);
    
    try {
      await clearAllOrders();
      toast.success("Базу даних успішно очищено!");
      setPage(0);
      setSearchId('');
      setFilterDate(null);
      fetchOrders(); 
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(err.message || "Помилка при очищенні бази");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Генерує та завантажує CSV-файл із поточним списком замовлень
   * (враховуючи застосовані фільтри, але ігноруючи пагінацію).
   */
  const handleExportCSV = async () => {
    setExporting(true);
    try {
      let url = `http://localhost:8000/api/orders/?page=1&limit=10000&sortBy=${orderBy}&sortOrder=${order}`;
      if (searchId) url += `&search=${searchId}`;
      if (filterDate) url += `&date=${filterDate.toISOString().split('T')[0]}`;

      const response = await axios.get(url);
      const dataToExport: Order[] = response.data.items || [];

      if (dataToExport.length === 0) {
        toast.warning("Немає даних для експорту");
        return;
      }

      const headers = [
        'ID Замовлення', 'Широта (Lat)', 'Довгота (Lon)', 'Сума (Subtotal)', 
        'Композитна ставка', 'Сума податку', 'Всього до сплати', 
        'Ставка Штату', 'Ставка Округу', 'Спец. Ставка (MCTD)', 'Юрисдикції'
      ];
      const csvRows = [headers.join(',')];

      dataToExport.forEach(o => {
        const bd = o.breakdown || { state_rate: 0, county_rate: 0, city_rate: 0, special_rates: 0 };
        const row = [
          o.id,
          o.latitude,
          o.longitude,
          o.subtotal.toFixed(2),
          (o.composite_tax_rate || 0).toFixed(5),
          (o.tax_amount || 0).toFixed(2),
          (o.total_amount || 0).toFixed(2),
          bd.state_rate,
          bd.county_rate,
          bd.special_rates,
          `"${(o.jurisdictions || []).join(', ')}"`
        ];
        csvRows.push(row.join(','));
      });

      const csvString = "\uFEFF" + csvRows.join('\n');
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `tax_orders_report_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("Звіт успішно завантажено!");
    } catch (error) {
      console.error("Помилка експорту:", error);
      toast.error("Помилка при формуванні звіту");
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage, searchId, order, orderBy, filterDate]);

  const handleChangePage = (_event: unknown, newPage: number) => { setPage(newPage); };
  
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box sx={{ pb: 5 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#333' }}>
          Головний список замовлень
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="outlined" 
            color="error" 
            startIcon={<DeleteSweepIcon />}
            onClick={() => setOpenClearDialog(true)}
            disabled={loading || orders.length === 0}
            sx={{ textTransform: 'none', fontWeight: 'bold' }}
          >
            Очистити базу
          </Button>

          <Button 
            variant="contained" 
            color="primary" 
            startIcon={exporting ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />}
            onClick={handleExportCSV}
            disabled={exporting || orders.length === 0}
            sx={{ textTransform: 'none', fontWeight: 'bold', px: 3, boxShadow: 2 }}
          >
            {exporting ? "Генерація..." : "Завантажити звіт"}
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3} sx={{ mb: 5 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <SummaryCard title="Всього замовлень (БД)" value={stats.totalOrders.toString()} icon={<ShoppingCartIcon />} />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <SummaryCard title="Сума податків (БД)" value={`$${stats.totalTax.toFixed(2)}`} icon={<AttachMoneyIcon />} color="success.main" />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <SummaryCard title="Сер. ставка (БД)" value={`${stats.averageRate}%`} icon={<PercentIcon />} color="warning.main" />
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
            const sanitizedValue = e.target.value.trim().substring(0, 36);
            setSearchId(sanitizedValue);
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
              <TableCell width={50} />
              <TableCell sx={{ fontWeight: 'bold' }}>ID Замовлення</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Координати</TableCell>
              
              <TableCell align="right">
                <TableSortLabel
                  active={orderBy === 'subtotal'}
                  direction={orderBy === 'subtotal' ? order : 'asc'}
                  onClick={() => handleRequestSort('subtotal')}
                  sx={{ fontWeight: 'bold' }}
                >
                  Сума (Subtotal)
                </TableSortLabel>
              </TableCell>

              <TableCell align="right">
                <TableSortLabel
                  active={orderBy === 'composite_tax_rate'}
                  direction={orderBy === 'composite_tax_rate' ? order : 'asc'}
                  onClick={() => handleRequestSort('composite_tax_rate')}
                  sx={{ fontWeight: 'bold' }}
                >
                  Ставка
                </TableSortLabel>
              </TableCell>

              <TableCell align="right">
                <TableSortLabel
                  active={orderBy === 'tax_amount'}
                  direction={orderBy === 'tax_amount' ? order : 'asc'}
                  onClick={() => handleRequestSort('tax_amount')}
                  sx={{ fontWeight: 'bold' }}
                >
                  Податок
                </TableSortLabel>
              </TableCell>

              <TableCell align="right">
                <TableSortLabel
                  active={orderBy === 'total_amount'}
                  direction={orderBy === 'total_amount' ? order : 'asc'}
                  onClick={() => handleRequestSort('total_amount')}
                  sx={{ fontWeight: 'bold' }}
                >
                  Всього до сплати
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
                  <TableCell colSpan={7} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                    Замовлень не знайдено. Спробуйте змінити фільтри або додати нові замовлення.
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

      <Dialog
        open={openClearDialog}
        onClose={() => setOpenClearDialog(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title" sx={{ fontWeight: 'bold', color: '#d32f2f' }}>
          {"Очистити базу даних?"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Ви впевнені, що хочете видалити ВСІ замовлення з системи? Цю дію <b>неможливо скасувати</b>, і всі дані (включно зі статистикою та розрахунками податків) будуть втрачені назавжди.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenClearDialog(false)} color="inherit" sx={{ fontWeight: 'bold' }}>
            Скасувати
          </Button>
          <Button onClick={confirmClearDatabase} color="error" variant="contained" autoFocus sx={{ fontWeight: 'bold' }}>
            Видалити все
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};