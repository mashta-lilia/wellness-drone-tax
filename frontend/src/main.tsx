/**
 * Головна точка входу (Entry Point) React-додатку.
 * Відповідає за ініціалізацію глобальних стилів, підключення кореневого компонента App
 * та його безпечний рендеринг у DOM-дерево браузера.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import './index.css'; 
import App from './App'; 

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Не вдалося знайти кореневий елемент #root. Перевірте файл index.html.');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);