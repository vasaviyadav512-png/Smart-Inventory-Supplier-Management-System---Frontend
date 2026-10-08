import { useState } from 'react';
import api, { errMsg } from '../api';
import { Alert, Card, useLoad } from '../components/ui.jsx';

export default function Users() {
  const { data, error, reload } = useLoad(async () => (await api.get('/users')).data);
  const [form, setForm] = useState({ username: '', password: '', fullName: '', role: 'STAFF' });
  const [msg, setMsg] = useState({ error: '', success: '' });

  const run = async (fn, ok) => {
    try { await fn(); setMsg({ error: '', success: ok }); await reload(); }
    catch (e) { setMsg({ error: errMsg(e), success: '' }); }
  };
  const f = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <>
      <h2>Users</h2>
      <Alert error={error || msg.error} success={msg.success} onClose={() => setMsg({ error: '', success: '' })} />
      <Card title="Add user">
        <form className="inline-form" onSubmit={(e) => { e.preventDefault(); run(async () => { await api.post('/users', form); setForm({ username: '', password: '', fullName: '', role: 'STAFF' }); }, 'User created'); }}>
          <input placeholder="Username" value={form.username} onChange={f('username')} required />
          <input placeholder="Full name" value={form.fullName} onChange={f('fullName')} />
          <input type="password" placeholder="Password (min 6)" minLength={6} value={form.password} onChange={f('password')} required />
          <select value={form.role} onChange={f('role')}><option>STAFF</option><option>ADMIN</option></select>
          <button className="btn" type="submit">Create</button>
        </form>
      </Card>
      <Card title="All users">
        <table>
          <thead><tr><th>Username</th><th>Name</th><th>Role</th><th></th></tr></thead>
          <tbody>
            {(data || []).map((u) => (
              <tr key={u.id}>
                <td>{u.username}</td><td>{u.fullName}</td>
                <td><span className={`badge ${u.role === 'ADMIN' ? 'badge-blue' : 'badge-gray'}`}>{u.role}</span></td>
                <td><button className="btn btn-sm btn-danger" onClick={() => confirm(`Delete ${u.username}?`) && run(() => api.delete(`/users/${u.id}`), 'User deleted')}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
