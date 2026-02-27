import axios from 'axios';
import api from './axiosInstance';
import type { LoginPayload, LoginResponse } from '../types/order'; 

/**
 * Виконує запит на авторизацію користувача.
 * * @param data - Об'єкт з даними для входу (наприклад, логін та пароль).
 * @returns Дані успішної авторизації (наприклад, токен та інформація про користувача).
 * @throws {Error} Якщо передані невірні облікові дані (401) або сталася інша помилка.
 */
export const loginUser = async (data: LoginPayload): Promise<LoginResponse> => {
  try {
    const response = await api.post<LoginResponse>('/auth/login', data);
    return response.data;
  } catch (err: unknown) {
    // Обробка помилки невірних облікових даних
    if (axios.isAxiosError(err) && err.response?.status === 401) {
      throw new Error('Невірний логін або пароль');
    }
    
    // Загальна помилка для всіх інших випадків (проблеми з мережею, 500 тощо)
    throw new Error('Помилка при вході');
  }
};