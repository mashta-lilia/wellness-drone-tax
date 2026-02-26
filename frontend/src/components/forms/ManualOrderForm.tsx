import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Box, Button, TextField, Typography, Paper, Stack, Divider } from '@mui/material';
import { createManualOrder } from '../../api/orders';
import type { Order } from '../../types/order';
import { toast } from 'react-toastify';

export const ManualOrderForm = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Order | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { latitude: '', longitude: '', subtotal: '' }
  });

  const onSubmit = async (data: any) => {
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
    } catch (err: any) {
      // ТУТ ВАЖЛИВО: беремо повідомлення з нашого api (яке вже українською),
      // або виводимо дефолтне українське повідомлення
      toast.error(err.message || "Сталася помилка при створенні замовлення");
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
        Ручне створення замовлення
      </Typography>

      {!result ? (
        <Paper sx={{ p: 4, bgcolor: '#fff', borderRadius: 3, boxShadow: 2, width: '100%', maxWidth: 450 }}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 'medium', textAlign: 'center', color: 'text.secondary' }}>Нове замовлення</Typography>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Stack spacing={3}>
              <TextField 
                label="Широта (Latitude)" size="small" fullWidth
                {...register("latitude", { 
                  required: "Обов'язкове поле",
                  pattern: {
                    value: /^-?\d+(\.\d+)?$/,
                    message: "Введіть коректні координати (наприклад: 40.7128)"
                  }
                })}
                error={!!errors.latitude} helperText={errors.latitude?.message?.toString()}
              />
              <TextField 
                label="Довгота (Longitude)" size="small" fullWidth
                {...register("longitude", { 
                  required: "Обов'язкове поле",
                  pattern: {
                    value: /^-?\d+(\.\d+)?$/,
                    message: "Введіть коректні координати (наприклад: -74.0060)"
                  }
                })}
                error={!!errors.longitude} helperText={errors.longitude?.message?.toString()}
              />
              <TextField 
                label="Сума (Subtotal)" size="small" fullWidth
                {...register("subtotal", { 
                  required: "Обов'язкове поле",
                  pattern: {
                    value: /^\d+(\.\d{1,2})?$/,
                    message: "Введіть суму у форматі числа (наприклад: 150 або 150.50)"
                  },
                  min: { value: 0.01, message: "Сума має бути більшою за нуль" }
                })}
                error={!!errors.subtotal} helperText={errors.subtotal?.message?.toString()}
              />
              <Button 
                type="submit" variant="contained" disabled={loading}
                sx={{ py: 1.2, fontWeight: 'bold', textTransform: 'none', bgcolor: '#1976d2' }}
              >
                {loading ? "Розрахунок..." : "Розрахувати податок"}
              </Button>
            </Stack>
          </form>
        </Paper>
      ) : (
        <Paper sx={{ p: 4, borderRadius: 3, boxShadow: 3, width: '100%', maxWidth: 450, borderTop: '4px solid #1976d2' }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', textAlign: 'center' }}>Звіт замовлення</Typography>
          <Divider sx={{ mb: 2 }} />
          
          <Stack spacing={1.5} sx={{ textAlign: 'center', mb: 2 }}>
            <Typography>Загальна ставка: <b>{((result?.composite_tax_rate || 0) * 100).toFixed(3)}%</b></Typography>
            
            {/* Деталізація податку */}
            {result.breakdown && (
              <Box sx={{ bgcolor: '#f5f5f5', p: 1.5, borderRadius: 2, display: 'inline-block', textAlign: 'left', mx: 'auto' }}>
                <Typography variant="body2" color="text.secondary">Нью-Йорк (Штат): {(result.breakdown.state_rate * 100).toFixed(3)}%</Typography>
                <Typography variant="body2" color="text.secondary">Округ: {(result.breakdown.county_rate * 100).toFixed(3)}%</Typography>
                {result.breakdown.special_rates > 0 && (
                  <Typography variant="body2" color="text.secondary">MCTD (Транспорт): {(result.breakdown.special_rates * 100).toFixed(3)}%</Typography>
                )}
              </Box>
            )}

            <Typography sx={{ mt: 1 }}>Сума податку: <b>${(result?.tax_amount || 0).toFixed(2)}</b></Typography>
            
            {result.jurisdictions && result.jurisdictions.length > 0 && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                Застосовані юрисдикції: {result.jurisdictions.join(', ')}
              </Typography>
            )}
            
            <Typography variant="h4" sx={{ mt: 2, color: '#1976d2', fontWeight: 'bold' }}>
              ${(result?.total_amount || 0).toFixed(2)}
            </Typography>
          </Stack>
          
          <Button fullWidth variant="outlined" onClick={handleReset} sx={{ mt: 2, textTransform: 'none' }}>
            Створити нове замовлення
          </Button>
        </Paper>
      )}
    </Box>
  );
};