import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import MainLayout from './layouts/MainLayout';
import { OrdersListPage } from './pages/OrdersListPage';
import ImportPage from './pages/ImportPage';
import CreateOrderPage from './pages/CreateOrderPage';
import { LoginPage } from './pages/LoginPage';

/**
 * Внутрішній компонент-обгортка для захисту приватних маршрутів.
 * Перевіряє наявність токена авторизації у локальному сховищі. 
 * Якщо користувач не авторизований, автоматично перенаправляє його на сторінку входу.
 * * @param props - Властивості компонента, що містять дочірні елементи (children).
 * @returns Відрендерені дочірні компоненти або компонент Navigate для редиректу.
 */
const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = localStorage.getItem('jwt_token');
  return token ? <>{children}</> : <Navigate to="/login" replace />;
};

/**
 * Головний компонент додатку (Entry Point).
 * Налаштовує глобальний роутинг, розділяючи публічні маршрути (наприклад, логін) 
 * та приватні сторінки, які додатково обгорнуті в загальний макет (MainLayout).
 * Також ініціалізує глобальний контейнер для спливаючих сповіщень.
 */
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<MainLayout />}>
          <Route path="/" element={<PrivateRoute><OrdersListPage /></PrivateRoute>} />
          <Route path="/import" element={<PrivateRoute><ImportPage /></PrivateRoute>} />
          <Route path="/create" element={<PrivateRoute><CreateOrderPage /></PrivateRoute>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <ToastContainer position="bottom-right" autoClose={5000} />
    </Router>
  );
}

export default App;