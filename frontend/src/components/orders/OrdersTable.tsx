import React from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import { OrderRow } from './OrderRow';
import type { Order } from '../../types/order';

interface OrdersTableProps {
  orders: Order[];
}

export const OrdersTable: React.FC<OrdersTableProps> = ({ orders }) => (
  <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
    <Table sx={{ minWidth: 650 }}>
      <TableHead sx={{ bgcolor: '#f8f9fa' }}>
        <TableRow>
          <TableCell sx={{ fontWeight: 'bold' }}>ID</TableCell>
          <TableCell sx={{ fontWeight: 'bold' }}>Координати</TableCell>
          <TableCell sx={{ fontWeight: 'bold' }}>Сума</TableCell>
          <TableCell sx={{ fontWeight: 'bold' }}>Ставка податку</TableCell>
          <TableCell sx={{ fontWeight: 'bold' }}>Разом</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {orders.map((order) => (
          <OrderRow key={order.id} order={order} />
        ))}
      </TableBody>
    </Table>
  </TableContainer>
);