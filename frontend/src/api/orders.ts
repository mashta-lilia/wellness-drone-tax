import api from './axiosInstance';
import axios from 'axios'; // Додали імпорт axios для безпечної перевірки помилок
import type { Order, ImportCSVResponse } from '../types/order';

/**
 * Створює нове замовлення вручну.
 * * @param data - Об'єкт з даними замовлення (широта, довгота та сума).
 * @returns Створене замовлення з бази даних.
 * @throws {Error} Якщо передані невалідна інформація або сталася помилка з'єднання.
 */
export const createManualOrder = async (data: { latitude: number; longitude: number; subtotal: number }): Promise<Order> => {
  try {
    const response = await api.post<Order>('/orders/', data);
    return response.data;
  } catch (error: unknown) {
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

/**
 * Імпортує масив замовлень на сервер за допомогою CSV файлу.
 * * @param file - Файл у форматі CSV.
 * @returns Статистика або результати імпорту замовлень.
 * @throws {Error} Якщо файл невалідний або сталася помилка завантаження.
 */
export const importOrdersCSV = async (file: File): Promise<ImportCSVResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await api.post<ImportCSVResponse>('/orders/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.data?.detail) {
      throw new Error(String(error.response.data.detail));
    }
    throw new Error('Помилка завантаження файлу. Перевірте з\'єднання з сервером.');
  }
};

/**
 * Очищає базу даних від усіх поточних замовлень.
 * * @throws {Error} Якщо сервер повертає помилку під час видалення.
 */
export const clearAllOrders = async (): Promise<void> => {
  try {
    await api.delete('/orders/clear');
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.data?.detail) {
      throw new Error(String(error.response.data.detail));
    }
    throw new Error('Помилка з\'єднання з сервером під час очищення бази.');
  }
};

/**
 * Отримує список усіх існуючих замовлень.
 * * @returns Масив об'єктів замовлень.
 */
export const getOrders = async (): Promise<Order[]> => {
  const response = await api.get('/orders/');
  return response.data.items; 
};