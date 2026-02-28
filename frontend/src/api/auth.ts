import axios from 'axios';
import api from './axiosInstance'; // Перевір, щоб назва файлу була саме axiosInstance.ts

// Використовуй "import type" для типів через налаштування verbatimModuleSyntax
import type { LoginPayload, LoginResponse } from '../types/order'; 

export const loginUser = async (data: LoginPayload): Promise<LoginResponse> => {
  try {
    const formData = new URLSearchParams();
    
    formData.append('username', data.email); 
    formData.append('password', data.password);

    const response = await api.post<LoginResponse>('/admins/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    
    return response.data;
  } catch (err: unknown) {
    if (axios.isAxiosError(err) && err.response?.status === 401) {
      throw new Error('Невірний логін або пароль');
    }
    throw new Error('Помилка при вході');
  }
};