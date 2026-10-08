import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';

export default function Layout() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const links = [
    ['/', 'Dashboard'],
    ['/products', 'Products'],
    ['/suppliers', 'Suppliers'],
    ['/purchases', 'Purchases'],
    ['/sales', 'Sales'],
    ['/insights', 'Smart Insights'],
    ...(isAdmin ? [['/users', 'Users']] : []),
  ];
  return (
    <div className="shell">
      <aside className="sidebar">
        <h1>📦 SmartInventory</h1>
        <nav>
          {links.map(([to, label]) => (
            <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => (isActive ? 'active' : '')}>
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="userbox">
          <div><strong>{user.fullName || user.username}</strong></div>
          <span className={`badge ${isAdmin ? 'badge-blue' : 'badge-gray'}`}>{user.role}</span>
          <button className="btn btn-light" onClick={() => { logout(); navigate('/login'); }}>Logout</button>
        </div>
      </aside>
      <main className="content"><Outlet /></main>
    </div>
  );
}
