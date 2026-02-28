import React from 'react';
import { Card, CardContent, Typography, Box, Stack } from '@mui/material';

/**
 * Властивості для компонента SummaryCard.
 */
interface SummaryCardProps {
  /** Заголовок картки, який описує метрику (наприклад, "Загальна сума" або "Кількість замовлень"). */
  title: string;
  /** Значення метрики для відображення (може бути як текстом, так і числом). */
  value: string | number;
  /** Компонент іконки, який буде відображатися зліва від тексту. */
  icon: React.ReactNode;
  /** Колір іконки. Передається як значення палітри MUI (за замовчуванням 'primary.main'). */
  color?: string;
}

/**
 * Компонент картки для відображення зведеної інформації (статистики або метрик).
 * Складається з іконки на напівпрозорому фоні, підпису та основного великого значення.
 * * @param props - Властивості компонента (title, value, icon, color).
 * @returns Відрендерена картка з показником.
 */
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