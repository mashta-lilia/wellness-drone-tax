import React from 'react';
import type { Order } from '../../types/order';
import { formatCurrency, formatPercent, formatCoordinate } from '../../utils/formatters';

interface OrderRowProps {
  order: Order;
}

export const OrderRow: React.FC<OrderRowProps> = ({ order }) => {
  return (
    <tr className="hover:bg-gray-50 border-b transition-colors">
      <td className="p-3 text-sm text-gray-500 font-mono">
        {order.id ? `${order.id.substring(0, 8)}...` : '—'}
      </td>
      <td className="p-3 text-sm text-gray-600">
        {formatCoordinate(order.latitude)}, {formatCoordinate(order.longitude)}
      </td>
      <td className="p-3 text-sm font-medium text-gray-900">
        {formatCurrency(order.subtotal)}
      </td>
      <td className="p-3 text-sm text-blue-600 font-semibold">
        {formatPercent(order.composite_tax_rate || 0)}
      </td>
      <td className="p-3 text-sm font-bold text-green-700">
        {formatCurrency(order.total_amount || 0)}
      </td>
    </tr>
  );
};