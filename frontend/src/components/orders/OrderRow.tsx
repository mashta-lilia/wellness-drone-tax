import React, { useState } from 'react';
import { 
  TableRow, TableCell, IconButton, Collapse, Box, Typography, 
  Stack, Paper, Divider, Chip 
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import type { Order } from '../../types/order';

/**
 * Властивості компонента OrderRow.
 */
export interface OrderRowProps {
  order: Order;
}

/**
 * Компонент окремого рядка таблиці замовлень.
 * Підтримує розгортання (Collapse) для відображення деталізації податкових ставок (breakdown).
 */
export const OrderRow: React.FC<OrderRowProps> = ({ order }) => {
  const [open, setOpen] = useState(false);
  const breakdown = order.breakdown || { state_rate: 0, county_rate: 0, city_rate: 0, special_rates: 0 };

  return (
    <React.Fragment>
      <TableRow sx={{ '& > *': { borderBottom: 'unset' }, bgcolor: open ? '#f4f6f8' : 'inherit', transition: 'background-color 0.3s' }}>
        <TableCell>
          <IconButton size="small" onClick={() => setOpen(!open)}>
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
          {order.id?.split('-')[0]}...
        </TableCell>
        <TableCell>{`${order.latitude.toFixed(4)} / ${order.longitude.toFixed(4)}`}</TableCell>
        <TableCell align="right">${order.subtotal.toFixed(2)}</TableCell>
        <TableCell align="right">
          <Chip 
            label={`${((order.composite_tax_rate || 0) * 100).toFixed(3)}%`} 
            size="small" 
            color="primary" 
            variant="outlined" 
            sx={{ fontWeight: 'bold' }}
          />
        </TableCell>
        <TableCell align="right">${order.tax_amount?.toFixed(2)}</TableCell>
        <TableCell align="right" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
          ${order.total_amount?.toFixed(2)}
        </TableCell>
      </TableRow>
      
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ m: 2, p: 3, backgroundColor: '#fff', borderRadius: 2, border: '1px solid #e0e0e0', boxShadow: 'inset 0 0 10px rgba(0,0,0,0.02)' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2, color: '#333' }}>
                Деталізація податків (Breakdown)
              </Typography>
              
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
                {/* 1. Штат */}
                <Paper elevation={0} sx={{ p: 2, flex: 1, bgcolor: '#f8f9fa', border: '1px solid #e9ecef', textAlign: 'center', borderRadius: 2 }}>
                  <Typography variant="caption" color="text.secondary" display="block">Штат Нью-Йорк</Typography>
                  <Typography variant="body1" fontWeight="bold" color="#2e7d32">
                    {(breakdown.state_rate * 100).toFixed(3)}%
                  </Typography>
                </Paper>
                
                {/* 2. Округ */}
                <Paper elevation={0} sx={{ p: 2, flex: 1, bgcolor: '#f8f9fa', border: '1px solid #e9ecef', textAlign: 'center', borderRadius: 2 }}>
                  <Typography variant="caption" color="text.secondary" display="block">Округ (County)</Typography>
                  <Typography variant="body1" fontWeight="bold" color="#1565c0">
                    {(breakdown.county_rate * 100).toFixed(3)}%
                  </Typography>
                </Paper>

                {/* 3. Місто (НОВИЙ БЛОК - відображається тільки якщо є міський податок) */}
                {breakdown.city_rate > 0 && (
                  <Paper elevation={0} sx={{ p: 2, flex: 1, bgcolor: '#f3e5f5', border: '1px solid #e1bee7', textAlign: 'center', borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary" display="block">Місто (City)</Typography>
                    <Typography variant="body1" fontWeight="bold" color="#6a1b9a">
                      {(breakdown.city_rate * 100).toFixed(3)}%
                    </Typography>
                  </Paper>
                )}
                
                {/* 4. MCTD */}
                {breakdown.special_rates > 0 && (
                  <Paper elevation={0} sx={{ p: 2, flex: 1, bgcolor: '#fff3e0', border: '1px solid #ffe0b2', textAlign: 'center', borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary" display="block">MCTD (Транспорт)</Typography>
                    <Typography variant="body1" fontWeight="bold" color="#e65100">
                      {(breakdown.special_rates * 100).toFixed(3)}%
                    </Typography>
                  </Paper>
                )}
              </Stack>
              
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                  Застосовані юрисдикції:
                </Typography>
                {order.jurisdictions?.map((j) => (
                  <Chip key={j} label={j} size="small" sx={{ bgcolor: '#e3f2fd', color: '#1565c0', fontWeight: 'medium' }} />
                ))}
              </Box>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
};