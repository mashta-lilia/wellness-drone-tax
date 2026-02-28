import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

/**
 * Базовий екземпляр Axios для запитів до бекенду.
 */
const instance = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

/**
 * Перехоплювач запитів (Request Interceptor).
 * Автоматично додає JWT токен до заголовків кожного запиту, якщо користувач авторизований.
 */
instance.interceptors.request.use((config) => {
  const token = localStorage.getItem('jwt_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});


/**
 * Перехоплювач відповідей (Response Interceptor).
 * Відслідковує помилки авторизації. Якщо отримуємо 401 (токен недійсний/прострочений),
 * очищає дані сесії та перенаправляє на сторінку логіну.
 */
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('user_name'); // Чистим всё
      
      // Чтобы не редиректить бесконечно, если мы уже на логине
      if (!window.location.pathname.includes('/login')) {
        toast.error('Сесія завершилася. Будь ласка, увійдіть знову.');
        setTimeout(() => {
          window.location.href = '/login';
        }, 1000); // Даем пользователю увидеть ошибку
      }
    }
    return Promise.reject(error);
  }
);

export default instance;