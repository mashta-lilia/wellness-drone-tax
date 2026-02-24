import { Order } from '../types/order'; // Використовуємо вже створений інтерфейс

export const createManualOrder = async (data: { latitude: number; longitude: number; subtotal: number }): Promise<Order> => {
  const response = await axios.post<Order>('http://localhost:8000/orders', data); //
  return response.data;
};