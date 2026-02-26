import { Box } from '@mui/material';
import { ManualOrderForm } from '../components/forms/ManualOrderForm';

const CreateOrderPage = () => {
  return (
    <Box sx={{ p: 3 }}>
      <ManualOrderForm />
    </Box>
  );
};

export default CreateOrderPage;