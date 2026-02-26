import { Box } from '@mui/material';
import { FileUploader } from '../components/forms/FileUploader';

const ImportPage = () => {
  return (
    <Box sx={{ p: 3 }}>
      <FileUploader />
    </Box>
  );
};

export default ImportPage;