import React, { useState } from 'react';
import { TextField, Button, Stack, Box, Alert } from '@mui/material';
import { Save } from '@mui/icons-material';

interface OrderFormProps {
  onSubmit: (data: { latitude: number; longitude: number; subtotal: number }) => Promise<void>;
  loading: boolean;
}

export const OrderForm: React.FC<OrderFormProps> = ({ onSubmit, loading }) => {
  const [formData, setFormData] = useState({ latitude: '', longitude: '', subtotal: '' });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Валідація: перетворюємо рядки в числа
    const lat = parseFloat(formData.latitude);
    const lng = parseFloat(formData.longitude);
    const amount = parseFloat(formData.subtotal);

    if (isNaN(lat) || isNaN(lng) || isNaN(amount)) {
      setError('Будь ласка, введіть коректні числові значення');
      return;
    }

    await onSubmit({ latitude: lat, longitude: lng, subtotal: amount });
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Stack spacing={3}>
        {error && <Alert severity="warning">{error}</Alert>}
        
        <TextField
          label="Широта (Latitude)"
          variant="outlined"
          fullWidth
          required
          value={formData.latitude}
          onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
          placeholder="Наприклад: 50.4501"
        />

        <TextField
          label="Довгота (Longitude)"
          variant="outlined"
          fullWidth
          required
          value={formData.longitude}
          onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
          placeholder="Наприклад: 30.5234"
        />

        <TextField
          label="Сума (Subtotal $)"
          variant="outlined"
          fullWidth
          required
          value={formData.subtotal}
          onChange={(e) => setFormData({ ...formData, subtotal: e.target.value })}
          placeholder="Наприклад: 125.50"
        />

        <Button 
          type="submit" 
          variant="contained" 
          size="large" 
          startIcon={<Save />}
          disabled={loading}
        >
          {loading ? 'Збереження...' : 'Створити замовлення'}
        </Button>
      </Stack>
    </Box>
  );
};