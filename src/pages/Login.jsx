import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import { errMsg } from '../api';
import { Alert } from '../components/ui.jsx';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  if (user) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault();
    try { await login(username, password); navigate('/'); }
    catch (err) { setError(errMsg(err)); }
  };

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={submit}>
        <h2>📦 Smart Inventory</h2>
        <p className="muted">Supplier management with demand prediction & automated reordering</p>
        <Alert error={error} onClose={() => setError('')} />
        <label>Username<input value={username} onChange={(e) => setUsername(e.target.value)} autoFocus required /></label>
        <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
        <button className="btn" type="submit">Sign in</button>
        <p className="muted small">Demo: admin / admin123 &nbsp;|&nbsp; staff / staff123</p>
      </form>
    </div>
  );
}
