import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css'; // Важливо: підключаємо глобальні стилі

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);