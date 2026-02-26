import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Імпорти від Даші (перевір шлях до MainLayout, він може бути в корне src)
import MainLayout from './layouts/MainLayout';
import {OrdersListPage} from './pages/OrdersListPage';
import ImportPage from './pages/ImportPage';
import CreateOrderPage from './pages/CreateOrderPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route element={<MainLayout />}>
          {/* Головна сторінка зі списком */}
          <Route path="/" element={<OrdersListPage />} />
          
          {/* Твої сторінки */}
          <Route path="/import" element={<ImportPage />} />
          <Route path="/create" element={<CreateOrderPage />} />
        </Route>
      </Routes>

      {/* Глобальні сповіщення для всього застосунку */}
      <ToastContainer position="bottom-right" autoClose={5000} />
    </Router>
  );
}

export default App;