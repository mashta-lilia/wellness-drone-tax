import { useState, useEffect, useCallback } from 'react';
import { getOrders } from '../api/orders';
import type { Order } from '../types/order';

/**
 * Кастомний хук для управління станом списку замовлень.
 * Автоматично завантажує дані при монтуванні компонента та надає
 * метод для ручного оновлення (fetch).
 *
 * @returns {Object} Об'єкт, що містить:
 * - `orders`: Масив замовлень, отриманих з сервера.
 * - `loading`: Прапорець, що вказує на активний процес завантаження.
 * - `error`: Текст помилки, якщо запит завершився невдачею (інакше null).
 * - `refreshOrders`: Функція для примусового повторного завантаження даних.
 */
export const useOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Виконує запит до API для отримання замовлень.
   * Оновлює локальні стани завантаження, даних та помилок.
   */
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getOrders();
      setOrders(data);
    } catch (err: unknown) {
      const error = err as Error; 
      setError(error.message || 'Не вдалося завантажити дані');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return { orders, loading, error, refreshOrders: fetchOrders };
};