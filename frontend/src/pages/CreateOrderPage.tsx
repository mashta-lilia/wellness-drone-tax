import { Box } from '@mui/material';
import { ManualOrderForm } from '../components/forms/ManualOrderForm';

/**
 * Сторінка створення нового замовлення вручну.
 * Виступає як контейнер (Page-level component) для форми ManualOrderForm,
 * забезпечуючи їй базові відступи (padding) у межах головного Layout.
 */
const CreateOrderPage = () => {
  return (
    <Box sx={{ p: 3 }}>
      <ManualOrderForm />
    </Box>
  );
};

export default CreateOrderPage;