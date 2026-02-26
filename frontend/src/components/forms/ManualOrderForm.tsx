import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Box, Button, TextField, Typography, Paper, Stack, Divider, CircularProgress } from '@mui/material';
import { createManualOrder } from '../../api/orders';
import type { Order } from '../../types/order'; // Пункт №2: Імпорт типів
import { formatCurrency, formatPercent } from '../../utils/formatters'; // Пункт №1: Форматтери
import { toast } from 'react-toastify';

// Типізація полів форми
interface OrderFormData {
  latitude: string;
  longitude: string;
  subtotal: string;
}

export const ManualOrderForm = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Order | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<OrderFormData>({
    defaultValues: { latitude: '', longitude: '', subtotal: '' }
  });

  const onSubmit = async (data: OrderFormData) => {
    setLoading(true);
    setResult(null); 
    
    try {
      const order = await createManualOrder({
        latitude: parseFloat(data.latitude),
        longitude: parseFloat(data.longitude),
        subtotal: parseFloat(data.subtotal)
      });
      setResult(order);
      toast.success("Податок успішно розраховано!");
    } catch (err: unknown) {
      // Пункт №2: Сувора обробка помилок без any
      const error = err as Error;
      toast.error(error.message || "Сталася помилка при створенні замовлення");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    reset();
    setResult(null); 
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', pb: 5 }}>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold', color: '#333', textAlign: 'center' }}>
        Розрахунок податку (Manual)
      </Typography>

      {!result ? (
        <Paper sx={{ p: 4, borderRadius: 3, boxShadow: 2, width: '100%', maxWidth: 450 }}>
          <Typography variant="h6" sx={{ mb: 3, textAlign: 'center', color: 'text.secondary' }}>Введіть дані замовлення</Typography>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Stack spacing={3}>
              <TextField 
                label="Широта (Latitude)" size="small" fullWidth
                {...register("latitude", { 
                  required: "Обов'язкове поле",
                  pattern: {
                    value: /^-?\d+(\.\d+)?$/, // Пункт №3: Валідація Regex
                    message: "Введіть число (наприклад: 40.7128)"
                  }
                })}
                error={!!errors.latitude} helperText={errors.latitude?.message}
              />
              <TextField 
                label="Довгота (Longitude)" size="small" fullWidth
                {...register("longitude", { 
                  required: "Обов'язкове поле",
                  pattern: {
                    value: /^-?\d+(\.\d+)?$/,
                    message: "Введіть число (наприклад: -74.0060)"
                  }
                })}
                error={!!errors.longitude} helperText={errors.longitude?.message}
              />
              <TextField 
                label="Сума (Subtotal)" size="small" fullWidth
                {...register("subtotal", { 
                  required: "Обов'язкове поле",
                  pattern: {
                    value: /^\d+(\.\d{1,2})?$/,
                    message: "Введіть коректну суму"
                  },
                  min: { value: 0.01, message: "Сума має бути більшою за 0" }
                })}
                error={!!errors.subtotal} helperText={errors.subtotal?.message}
              />
              <Button 
                type="submit" variant="contained" 
                disabled={loading} // Пункт №3: Блокування кнопки
                sx={{ py: 1.2, fontWeight: 'bold' }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : "Розрахувати"}
              </Button>
            </Stack>
          </form>
        </Paper>
      ) : (
        <Paper sx={{ p: 4, borderRadius: 3, boxShadow: 3, width: '100%', maxWidth: 450, borderTop: '4px solid #1976d2' }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', textAlign: 'center' }}>Результат розрахунку</Typography>
          <Divider sx={{ mb: 2 }} />
          
          <Stack spacing={2} sx={{ textAlign: 'center' }}>
            {/* Пункт №1: Використання форматтерів замість .toFixed() */}
            <Typography>Загальна ставка: <b>{formatPercent(result.composite_tax_rate || 0)}</b></Typography>
            
            {result.breakdown && (
              <Box sx={{ bgcolor: '#f9f9f9', p: 2, borderRadius: 2, textAlign: 'left' }}>
                <Typography variant="body2">Штат: {formatPercent(result.breakdown.state_rate)}</Typography>
                <Typography variant="body2">Округ: {formatPercent(result.breakdown.county_rate)}</Typography>
                {result.breakdown.special_rates > 0 && (
                  <Typography variant="body2">MCTD: {formatPercent(result.breakdown.special_rates)}</Typography>
                )}
              </Box>
            )}

            <Typography>Сума податку: <b>{formatCurrency(result.tax_amount || 0)}</b></Typography>
            
            <Typography variant="h4" sx={{ color: '#1976d2', fontWeight: 'bold', mt: 1 }}>
              {formatCurrency(result.total_amount || 0)}
            </Typography>
          </Stack>
          
          <Button fullWidth variant="outlined" onClick={handleReset} sx={{ mt: 3 }}>
            Новий розрахунок
          </Button>
        </Paper>
      )}
    </Box>
  );
};