import { useState, useEffect, useCallback } from 'react';
import { getOrders } from '../api/orders';
import type { Order } from '../types/order';

export const useOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getOrders();

      if (Array.isArray(data)) {
        setOrders(data);
      } else {
        console.error('API повернуло не масив:', data);
        setOrders([]);
      }

    } catch (err: unknown) {

      // 🔐 Безпечне звуження типу
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Не вдалося завантажити дані');
      }

      setOrders([]);

    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return { orders, loading, error, refreshOrders: fetchOrders };
};