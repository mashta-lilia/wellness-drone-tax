import api from './axios'; 
import axios from 'axios'; // Додали імпорт axios для безпечної перевірки помилок
import type { Order, ImportCSVResponse } from '../types/order';

// 1. Ручне створення замовлення
export const createManualOrder = async (data: { latitude: number; longitude: number; subtotal: number }): Promise<Order> => {
  try {
    const response = await api.post<Order>('/orders/', data);
    return response.data;
  } catch (error: unknown) { // Замінили any на unknown
    if (axios.isAxiosError(error) && error.response?.data?.detail) {
      const detail = error.response.data.detail;
      if (Array.isArray(detail)) {
        throw new Error('Перевірте правильність введених даних. Координати та сума мають бути числами.');
      }
      throw new Error(String(detail));
    }
    throw new Error('Помилка з\'єднання з сервером. Перевірте підключення.');
  }
};

// 2. Імпорт CSV
export const importOrdersCSV = async (file: File): Promise<ImportCSVResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await api.post<ImportCSVResponse>('/orders/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (error: unknown) { // Замінили any на unknown
    if (axios.isAxiosError(error) && error.response?.data?.detail) {
      throw new Error(String(error.response.data.detail));
    }
    throw new Error('Помилка завантаження файлу. Перевірте з\'єднання з сервером.');
  }
};

// 3. Очищення бази даних
export const clearAllOrders = async (): Promise<void> => {
  try {
    await api.delete('/orders/clear');
  } catch (error: unknown) { // Замінили any на unknown
    if (axios.isAxiosError(error) && error.response?.data?.detail) {
      throw new Error(String(error.response.data.detail));
    }
    throw new Error('Помилка з\'єднання з сервером під час очищення бази.');
  }
};

export const getOrders = async (): Promise<Order[]> => {
  const response = await api.get('/orders/');
  return response.data.items;
};