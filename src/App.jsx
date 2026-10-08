import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Products from './pages/Products.jsx';
import Suppliers from './pages/Suppliers.jsx';
import Purchases from './pages/Purchases.jsx';
import Sales from './pages/Sales.jsx';
import Insights from './pages/Insights.jsx';
import Users from './pages/Users.jsx';

function Protected({ children, adminOnly }) {
  const { user, isAdmin } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<Protected><Layout /></Protected>}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/products" element={<Products />} />
        <Route path="/suppliers" element={<Suppliers />} />
        <Route path="/purchases" element={<Purchases />} />
        <Route path="/sales" element={<Sales />} />
        <Route path="/insights" element={<Insights />} />
        <Route path="/users" element={<Protected adminOnly><Users /></Protected>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
