import { Box } from '@mui/material';
import { FileUploader } from '../components/forms/FileUploader';

/**
 * Сторінка для масового імпорту замовлень.
 * Виступає контейнером (Page-level component) для компонента FileUploader,
 * забезпечуючи йому правильне розташування та відступи на сторінці.
 */
const ImportPage = () => {
  return (
    <Box sx={{ p: 3 }}>
      <FileUploader />
    </Box>
  );
};

export default ImportPage;