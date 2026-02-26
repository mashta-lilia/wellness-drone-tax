import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // Беремо з .env
  headers: {
    'Content-Type': 'application/json',
  },
});

// Додаємо інтерцептор для токена (який ми скоро зробимо)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;