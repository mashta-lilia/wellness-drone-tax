import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// 1. Глобальні стилі (важливо імпортувати ПЕРЕД компонентами)
import './index.css'; 

// 2. Головний компонент додатку
import App from './App'; 

// 3. Рендеринг у DOM
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Не вдалося знайти кореневий елемент #root');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);