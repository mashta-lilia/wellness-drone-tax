import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Box, Button, TextField, Typography, Paper, Skeleton, Stack, Divider } from '@mui/material';
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
    setResult(null); // Очищуємо старий результат перед новим запитом
    
    try {
      const order = await createManualOrder({
        latitude: parseFloat(data.latitude),
        longitude: parseFloat(data.longitude),
        subtotal: parseFloat(data.subtotal)
      });
      setResult(order);
    } catch (err) {
      toast.error("Помилка розрахунку податку");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    reset();
    setResult(null); // Приховуємо результати для нового введення
  };

return (
  <Box 
    sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', // Центрує заголовок і форму по горизонталі
      justifyContent: 'center', 
      minHeight: '70vh', // Розміщує форму в зоні комфорту для очей
      pb: 5 
    }}
  >
    {/* ГОЛОВНИЙ ЗАГОЛОВОК СТОРІНКИ */}
    <Typography 
      variant="h4" 
      sx={{ 
        mb: 4, 
        fontWeight: 'bold', 
        color: '#333',
        textAlign: 'center' 
      }}
    >
      Ручне створення замовлення
    </Typography>

    {!result ? (
      <Paper 
        sx={{ 
          p: 4, 
          bgcolor: '#fff', 
          borderRadius: 3, 
          boxShadow: 2, 
          width: '100%',
          maxWidth: 450, // Обмежуємо ширину для кращого вигляду по центру
        }}
      >
        <Typography variant="h6" sx={{ mb: 3, fontWeight: 'medium', textAlign: 'center', color: 'text.secondary' }}>
          Нове замовлення
        </Typography>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack spacing={3}>
            <TextField 
              label="Широта (Latitude)" 
              size="small"
              fullWidth
              {...register("latitude", { required: "Обов'язкове поле" })}
              error={!!errors.latitude}
              helperText={errors.latitude?.message}
            />
            <TextField 
              label="Довгота (Longitude)" 
              size="small"
              fullWidth
              {...register("longitude", { required: "Обов'язкове поле" })}
              error={!!errors.longitude}
              helperText={errors.longitude?.message}
            />
            <TextField 
              label="Сума (Subtotal)" 
              type="number"
              size="small"
              fullWidth
              {...register("subtotal", { required: true, min: 0.01 })}
              error={!!errors.subtotal}
              helperText={errors.subtotal?.message}
            />
            <Button 
              type="submit" 
              variant="contained" 
              disabled={loading}
              sx={{ 
                py: 1.2, 
                fontWeight: 'bold', 
                textTransform: 'none',
                bgcolor: '#1976d2' // Синій колір MUI
              }}
            >
              {loading ? "Розрахунок..." : "Розрахувати податок"}
            </Button>
          </Stack>
        </form>
      </Paper>
    ) : (
      /* Блок результатів розрахунку */
      <Paper sx={{ p: 4, borderRadius: 3, boxShadow: 3, width: '100%', maxWidth: 450, borderTop: '4px solid #1976d2' }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', textAlign: 'center' }}>
          Звіт замовлення
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Stack spacing={2} sx={{ textAlign: 'center' }}>
          <Typography>Ставка: <b>{((result?.composite_tax_rate || 0) * 100).toFixed(2)}%</b></Typography>
          <Typography>Сума податку: <b>${(result?.tax_amount || 0).toFixed(2)}</b></Typography>
          <Typography variant="h4" sx={{ mt: 1, color: '#1976d2', fontWeight: 'bold' }}>
            ${(result?.total_amount || 0).toFixed(2)}
          </Typography>
        </Stack>
        <Button fullWidth variant="outlined" onClick={handleReset} sx={{ mt: 4, textTransform: 'none' }}>
          Створити нове замовлення
        </Button>
      </Paper>
    )}
  </Box>
);}