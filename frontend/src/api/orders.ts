import axios from 'axios'; // ДОДАЙ ЦЕЙ РЯДОК, щоб прибрати червоне під axios
import type { Order } from '../types/order'; 

export const createManualOrder = async (data: { latitude: number; longitude: number; subtotal: number }): Promise<Order> => {
  const response = await axios.post<Order>('http://localhost:8000/api/orders/', data);
  return response.data;
};