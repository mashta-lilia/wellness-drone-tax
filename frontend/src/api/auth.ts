import axios from 'axios';
import api from './axiosInstance'; // Перевір, щоб назва файлу була саме axiosInstance.ts

// Використовуй "import type" для типів через налаштування verbatimModuleSyntax
import type { LoginPayload, LoginResponse } from '../types/order'; 

export const loginUser = async (data: LoginPayload): Promise<LoginResponse> => {
  try {
    const response = await api.post<LoginResponse>('/auth/login', data);
    return response.data;
  } catch (err: unknown) {
    if (axios.isAxiosError(err) && err.response?.status === 401) {
      throw new Error('Невірний логін або пароль');
    }
    throw new Error('Помилка при вході');
  }
};