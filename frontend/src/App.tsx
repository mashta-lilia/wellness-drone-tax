import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './components/MainLayout';
import OrdersListPage from './pages/OrdersListPage';
import ImportPage from './pages/ImportPage';
import CreateOrderPage from './pages/CreateOrderPage'; // Твоя нова назва

function App() {
  return (
    <Router>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<OrdersListPage />} />
          <Route path="/import" element={<ImportPage />} />
          <Route path="/create" element={<CreateOrderPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;