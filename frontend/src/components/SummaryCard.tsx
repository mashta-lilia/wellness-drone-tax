import React from 'react';
import { Card, CardContent, Typography, Box, Stack } from '@mui/material';

// Описуємо типи пропсів
interface SummaryCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color?: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ title, value, icon, color = 'primary.main' }) => {
  return (
    <Card sx={{ minWidth: 200, boxShadow: 2, borderRadius: 2 }}>
      <CardContent>
        <Stack direction="row" spacing={2} alignItems="center">
          <Box sx={{ 
            p: 1.5, 
            borderRadius: 2, 
            backgroundColor: 'rgba(25, 118, 210, 0.1)', 
            color: color,
            display: 'flex' 
          }}>
            {icon}
          </Box>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              {title}
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
              {value}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default SummaryCard;