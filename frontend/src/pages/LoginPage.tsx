import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Paper, Typography, TextField, Button, Stack, CircularProgress } from '@mui/material';
import { loginUser } from '../api/auth';
import { toast } from 'react-toastify';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
        const response = await loginUser({ email, password });
    
      localStorage.setItem('jwt_token', response.token); // зберігаємо JWT
      const displayName = response.user?.name || response.user?.email || 'Користувач';
    localStorage.setItem('user_name', displayName);
      navigate('/'); // редирект на головну після входу
      toast.success('Вхід виконано успішно!');
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || 'Невірний логін або пароль');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <Paper sx={{ p: 5, width: 400 }}>
        <Typography variant="h5" sx={{ mb: 3, textAlign: 'center', fontWeight: 'bold' }}>
          Вхід
        </Typography>
        <form onSubmit={handleSubmit}>
          <Stack spacing={3}>
            <TextField
              label="Email"
              type="email"
              fullWidth
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              label="Пароль"
              type="password"
              fullWidth
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Увійти'}
            </Button>
          </Stack>
        </form>
      </Paper>
    </Box>
  );
};