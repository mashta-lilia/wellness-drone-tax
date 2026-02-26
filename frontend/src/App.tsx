import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import MainLayout from './layouts/MainLayout';
import { OrdersListPage } from './pages/OrdersListPage';
import ImportPage from './pages/ImportPage';
import CreateOrderPage from './pages/CreateOrderPage';
import {LoginPage} from './pages/LoginPage';

// Простий PrivateRoute для v6
const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = localStorage.getItem('jwt_token');
  return token ? <>{children}</> : <Navigate to="/login" replace />;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* 1. Сторінка логіну без MainLayout */}
        <Route path="/login" element={<LoginPage />} />

        {/* 2. Всі інші сторінки з лейаутом */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<PrivateRoute><OrdersListPage /></PrivateRoute>} />
          <Route path="/import" element={<PrivateRoute><ImportPage /></PrivateRoute>} />
          <Route path="/create" element={<PrivateRoute><CreateOrderPage /></PrivateRoute>} />
        </Route>

        {/* 3. Будь-який невідомий шлях → редірект на / */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <ToastContainer position="bottom-right" autoClose={5000} />
    </Router>
  );
}

export default App;