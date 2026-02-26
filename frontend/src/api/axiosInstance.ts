import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const instance = axios.create({
  // Якщо в FastAPI немає глобального префікса /api, то пиши просто API_URL
  baseURL: API_URL, 
  headers: { 'Content-Type': 'application/json' },
});

// додаємо JWT до кожного запиту
instance.interceptors.request.use((config) => {
  const token = localStorage.getItem('jwt_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ловимо 401 (токен протух)
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('jwt_token');
      toast.error('Сесія завершилася. Будь ласка, увійдіть знову.');
      window.location.href = '/login'; // редирект на сторінку логіну
    }
    return Promise.reject(error);
  }
);

export default instance;