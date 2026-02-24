import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Box, Button, TextField, Typography, Paper, Skeleton, Stack, Divider } from '@mui/material';
import { createManualOrder } from '../../api/orders';
import { Order } from '../../types/order';
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
    <Box sx={{ mt: 4 }}>
      {!result ? (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Нове замовлення</Typography>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Stack spacing={2}>
              {/* Поля з валідацією */}
              <TextField 
                label="Широта (Latitude)" 
                {...register("latitude", { required: "Обов'язкове поле", pattern: /^-?\d+(\.\d+)?$/ })}
                error={!!errors.latitude} helperText={errors.latitude?.message}
              />
              <TextField 
                label="Довгота (Longitude)" 
                {...register("longitude", { required: "Обов'язкове pole", pattern: /^-?\d+(\.\d+)?$/ })}
                error={!!errors.longitude} helperText={errors.longitude?.message}
              />
              <TextField 
                label="Сума (Subtotal)" type="number"
                {...register("subtotal", { required: true, min: { value: 0.01, message: "Має бути > 0" } })}
                error={!!errors.subtotal} helperText={errors.subtotal?.message}
              />
              <Button type="submit" variant="contained" disabled={loading}>
                {loading ? "Розрахунок..." : "Розрахувати податок"}
              </Button>
            </Stack>
          </form>
        </Paper>
      ) : (
        /* Блок результатів */
        <Paper sx={{ p: 3, bgcolor: '#f0f7ff' }}>
          <Typography variant="h6" color="primary">Результат розрахунку</Typography>
          <Divider sx={{ my: 1 }} />
          <Typography>Ставка: {(result.composite_tax_rate * 100).toFixed(2)}%</Typography>
          <Typography>Сума податку: ${result.tax_amount.toFixed(2)}</Typography>
          <Typography variant="h6">Разом: ${result.total_amount.toFixed(2)}</Typography>
          <Button onClick={handleReset} sx={{ mt: 2 }}>Створити ще одне</Button>
        </Paper>
      )}

      {/* Skeleton Loaders */}
      {loading && (
        <Box sx={{ mt: 2 }}>
          <Skeleton variant="text" width="60%" height={30} />
          <Skeleton variant="rectangular" width="100%" height={100} sx={{ mt: 1 }} />
        </Box>
      )}
    </Box>
  );
};