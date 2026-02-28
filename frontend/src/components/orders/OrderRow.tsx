import React, { useState, useEffect } from 'react';
import { 
  TableRow, TableCell, IconButton, Collapse, Box, Typography, 
  Stack, Paper, Divider, Chip, Tooltip, CircularProgress, Alert
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import AirIcon from '@mui/icons-material/Air';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import type { Order } from '../../types/order';

export interface OrderRowProps {
  order: Order;
}

interface WeatherData {
  temperature: number;
  windSpeed: number;
  precipitation: number;
  isSafe: boolean;
  reason?: string;
}

export const OrderRow: React.FC<OrderRowProps> = ({ order }) => {
  const [open, setOpen] = useState(false);
  const breakdown = order.breakdown || { state_rate: 0, county_rate: 0, city_rate: 0, special_rates: 0 };

  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  // Форматуємо дату для красивого відображення
  const formattedDate = order.timestamp 
    ? new Date(order.timestamp).toLocaleString('uk-UA', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

  useEffect(() => {
    if (open && !weather && !weatherLoading) {
      const fetchWeather = async () => {
        setWeatherLoading(true);
        try {
          const url = `https://api.open-meteo.com/v1/forecast?latitude=${order.latitude}&longitude=${order.longitude}&current=temperature_2m,precipitation,wind_speed_10m&wind_speed_unit=ms&timezone=America%2FNew_York`;
          
          const response = await fetch(url);
          const data = await response.json();

          if (data.current) {
            const temp = data.current.temperature_2m;
            const wind = data.current.wind_speed_10m;
            const precip = data.current.precipitation;

            let isSafe = true;
            let reason = '';

            if (wind > 10) {
              isSafe = false;
              reason = 'Занадто сильний вітер (>10 м/с)';
            } else if (precip > 2) {
              isSafe = false;
              reason = 'Сильні опади (>2 мм)';
            } else if (temp < -15) {
              isSafe = false;
              reason = 'Критично низька температура (<-15°C)';
            }

            setWeather({
              temperature: temp,
              windSpeed: wind,
              precipitation: precip,
              isSafe,
              reason
            });
          }
        } catch (error) {
          console.error("Failed to fetch weather:", error);
        } finally {
          setWeatherLoading(false);
        }
      };

      fetchWeather();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, order.latitude, order.longitude, weather]);

  return (
    <React.Fragment>
      <TableRow sx={{ '& > *': { borderBottom: 'unset' }, bgcolor: open ? '#f4f6f8' : 'inherit', transition: 'background-color 0.3s' }}>
        <TableCell>
          <IconButton size="small" onClick={() => setOpen(!open)}>
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
          {order.id?.split('-')[0]}...
        </TableCell>
        {/* НОВА КОЛОНКА З ДАТОЮ */}
        <TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
          {formattedDate}
        </TableCell>
        <TableCell>{`${order.latitude.toFixed(4)} / ${order.longitude.toFixed(4)}`}</TableCell>
        <TableCell align="right">${order.subtotal.toFixed(2)}</TableCell>
        <TableCell align="right">
          <Chip 
            label={`${((order.composite_tax_rate || 0) * 100).toFixed(3)}%`} 
            size="small" 
            color="primary" 
            variant="outlined" 
            sx={{ fontWeight: 'bold' }}
          />
        </TableCell>
        <TableCell align="right">${order.tax_amount?.toFixed(2)}</TableCell>
        <TableCell align="right" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
          ${order.total_amount?.toFixed(2)}
        </TableCell>
      </TableRow>
      
      <TableRow>
        {/* colSpan змінено з 7 на 8 через нову колонку */}
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={8}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ m: 2, display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
              
              {/* ОРИГІНАЛЬНИЙ БЛОК: Деталізація податків */}
              <Box sx={{ p: 3, flex: 2, backgroundColor: '#fff', borderRadius: 2, border: '1px solid #e0e0e0', boxShadow: 'inset 0 0 10px rgba(0,0,0,0.02)' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2, color: '#333' }}>
                  Деталізація податків (Breakdown)
                </Typography>
                
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
                  <Paper elevation={0} sx={{ p: 2, flex: 1, bgcolor: '#f8f9fa', border: '1px solid #e9ecef', textAlign: 'center', borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary" display="block">Штат Нью-Йорк</Typography>
                    <Typography variant="body1" fontWeight="bold" color="#2e7d32">
                      {(breakdown.state_rate * 100).toFixed(3)}%
                    </Typography>
                  </Paper>
                  
                  <Paper elevation={0} sx={{ p: 2, flex: 1, bgcolor: '#f8f9fa', border: '1px solid #e9ecef', textAlign: 'center', borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary" display="block">Округ (County)</Typography>
                    <Typography variant="body1" fontWeight="bold" color="#1565c0">
                      {(breakdown.county_rate * 100).toFixed(3)}%
                    </Typography>
                  </Paper>
                  
                  {breakdown.city_rate > 0 && (
                    <Paper elevation={0} sx={{ p: 2, flex: 1, bgcolor: '#f3e5f5', border: '1px solid #e1bee7', textAlign: 'center', borderRadius: 2 }}>
                      <Typography variant="caption" color="text.secondary" display="block">Місто (City)</Typography>
                      <Typography variant="body1" fontWeight="bold" color="#6a1b9a">
                        {(breakdown.city_rate * 100).toFixed(3)}%
                      </Typography>
                    </Paper>
                  )}
                  
                  {breakdown.special_rates > 0 && (
                    <Paper elevation={0} sx={{ p: 2, flex: 1, bgcolor: '#fff3e0', border: '1px solid #ffe0b2', textAlign: 'center', borderRadius: 2 }}>
                      <Typography variant="caption" color="text.secondary" display="block">MCTD (Транспорт)</Typography>
                      <Typography variant="body1" fontWeight="bold" color="#e65100">
                        {(breakdown.special_rates * 100).toFixed(3)}%
                      </Typography>
                    </Paper>
                  )}
                </Stack>
                
                <Divider sx={{ mb: 2 }} />
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                    Застосовані юрисдикції:
                  </Typography>
                  {order.jurisdictions?.map((j) => (
                    <Chip key={j} label={j} size="small" sx={{ bgcolor: '#e3f2fd', color: '#1565c0', fontWeight: 'medium' }} />
                  ))}
                </Box>
              </Box>

              {/* БЛОК: Статус метеорологічної безпеки польоту */}
              <Box sx={{ p: 3, flex: 1, backgroundColor: '#fff', borderRadius: 2, border: '1px solid #e0e0e0', boxShadow: 'inset 0 0 10px rgba(0,0,0,0.02)', position: 'relative' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2, color: '#333', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span>Метеорологічна безпека (Real-time)</span>
                </Typography>

                {weatherLoading && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}><CircularProgress size={24} /></Box>
                )}

                {weather && (
                  <Box>
                    {weather.isSafe ? (
                      <Alert severity="success" icon={<CheckCircleOutlineIcon fontSize="inherit" />} sx={{ mb: 2, borderRadius: 2, fontWeight: 'medium' }}>
                        Безпечно для вильоту
                      </Alert>
                    ) : (
                      <Tooltip title={weather.reason} arrow>
                        <Alert severity="error" icon={<ReportProblemIcon fontSize="inherit" />} sx={{ mb: 2, borderRadius: 2, fontWeight: 'bold', cursor: 'help' }}>
                          Політ не рекомендується!
                        </Alert>
                      </Tooltip>
                    )}

                    <Stack spacing={1.5} sx={{ mt: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: '#f8f9fa', p: 1, px: 1.5, borderRadius: 1.5 }}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <ThermostatIcon color="action" fontSize="small" />
                          <Typography variant="body2" color="text.secondary">Температура</Typography>
                        </Stack>
                        <Typography variant="body2" fontWeight="bold">{weather.temperature}°C</Typography>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: '#f8f9fa', p: 1, px: 1.5, borderRadius: 1.5 }}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <AirIcon color="action" fontSize="small" />
                          <Typography variant="body2" color="text.secondary">Вітер (current)</Typography>
                        </Stack>
                        <Typography variant="body2" fontWeight="bold">{weather.windSpeed} м/с</Typography>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: '#f8f9fa', p: 1, px: 1.5, borderRadius: 1.5 }}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <WaterDropIcon color="action" fontSize="small" />
                          <Typography variant="body2" color="text.secondary">Опади</Typography>
                        </Stack>
                        <Typography variant="body2" fontWeight="bold">{weather.precipitation} мм</Typography>
                      </Box>
                    </Stack>
                  </Box>
                )}

                {!weather && !weatherLoading && (
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', textAlign: 'center', py: 2 }}>
                    Відкрийте, щоб завантажити погоду в точці доставки
                  </Typography>
                )}
              </Box>

            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
};