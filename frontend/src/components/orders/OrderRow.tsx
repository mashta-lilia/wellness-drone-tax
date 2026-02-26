import React from 'react';
import type { Order } from '../../types/order';
import { formatCurrency, formatPercent } from '../../utils/formatters';

interface OrderRowProps {
  order: Order;
}

export const OrderRow: React.FC<OrderRowProps> = ({ order }) => {
  return (
    <tr className="hover:bg-gray-50 border-b">
      <td className="p-3 text-sm">{order.id?.substring(0, 8)}...</td>
      <td className="p-3 text-sm">{order.latitude.toFixed(4)}, {order.longitude.toFixed(4)}</td>
      <td className="p-3 text-sm font-medium">{formatCurrency(order.subtotal)}</td>
      <td className="p-3 text-sm text-blue-600">{formatPercent(order.composite_tax_rate || 0)}</td>
      <td className="p-3 text-sm font-bold text-green-700">{formatCurrency(order.total_amount || 0)}</td>
    </tr>
  );
};
