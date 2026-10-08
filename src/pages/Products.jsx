import { useState } from 'react';
import api, { errMsg, money } from '../api';
import { useAuth } from '../AuthContext.jsx';
import { Alert, Card, useLoad } from '../components/ui.jsx';

const empty = { name: '', sku: '', category: '', unitPrice: '', stockQuantity: 0, reorderLevel: 10, leadTimeDays: 7 };

export default function Products() {
  const { isAdmin } = useAuth();
  const { data, error, reload } = useLoad(async () => (await api.get('/products')).data);
  const [form, setForm] = useState(null);
  const [msg, setMsg] = useState({ error: '', success: '' });
  const [q, setQ] = useState('');

  const run = async (fn, ok) => {
    try { await fn(); setMsg({ error: '', success: ok }); await reload(); }
    catch (e) { setMsg({ error: errMsg(e), success: '' }); }
  };

  const save = (e) => {
    e.preventDefault();
    const body = { ...form, unitPrice: Number(form.unitPrice), stockQuantity: Number(form.stockQuantity),
      reorderLevel: Number(form.reorderLevel), leadTimeDays: Number(form.leadTimeDays) };
    run(async () => {
      if (form.id) await api.put(`/products/${form.id}`, body); else await api.post('/products', body);
      setForm(null);
    }, 'Product saved');
  };

  const updateStock = (p) => {
    const v = prompt(`New stock count for "${p.name}"`, p.stockQuantity);
    if (v === null || v === '' || isNaN(v) || Number(v) < 0) return;
    run(() => api.put(`/products/${p.id}/stock`, { quantity: Number(v) }), 'Stock updated');
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const rows = (data || []).filter((p) => (p.name + p.sku + (p.category || '')).toLowerCase().includes(q.toLowerCase()));

  return (
    <>
      <h2>Products</h2>
      <Alert error={error || msg.error} success={msg.success} onClose={() => setMsg({ error: '', success: '' })} />
      {form && (
        <Card title={form.id ? 'Edit product' : 'New product'}>
          <form className="form-grid" onSubmit={save}>
            <label>Name<input value={form.name} onChange={set('name')} required /></label>
            <label>SKU<input value={form.sku} onChange={set('sku')} required /></label>
            <label>Category<input value={form.category || ''} onChange={set('category')} /></label>
            <label>Selling price (₹)<input type="number" step="0.01" min="0" value={form.unitPrice} onChange={set('unitPrice')} required /></label>
            <label>Stock<input type="number" min="0" value={form.stockQuantity} onChange={set('stockQuantity')} /></label>
            <label>Low-stock threshold<input type="number" min="0" value={form.reorderLevel} onChange={set('reorderLevel')} /></label>
            <label>Lead time (days)<input type="number" min="1" value={form.leadTimeDays} onChange={set('leadTimeDays')} /></label>
            <div className="form-actions">
              <button className="btn" type="submit">Save</button>
              <button className="btn btn-light" type="button" onClick={() => setForm(null)}>Cancel</button>
            </div>
          </form>
        </Card>
      )}
      <Card actions={<>
        <input className="search" placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} />
        {isAdmin && <button className="btn" onClick={() => setForm({ ...empty })}>+ Add product</button>}
      </>}>
        <table>
          <thead><tr><th>SKU</th><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Threshold</th><th>Lead</th><th></th></tr></thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id}>
                <td>{p.sku}</td><td>{p.name}</td><td>{p.category}</td><td>{money(p.unitPrice)}</td>
                <td><span className={`badge ${p.stockQuantity === 0 ? 'badge-red' : p.stockQuantity <= p.reorderLevel ? 'badge-amber' : 'badge-green'}`}>{p.stockQuantity}</span></td>
                <td>{p.reorderLevel}</td><td>{p.leadTimeDays}d</td>
                <td className="actions">
                  <button className="btn btn-sm btn-light" onClick={() => updateStock(p)}>Update stock</button>
                  {isAdmin && <>
                    <button className="btn btn-sm btn-light" onClick={() => setForm(p)}>Edit</button>
                    <button className="btn btn-sm btn-danger" onClick={() => confirm(`Delete ${p.name}?`) && run(() => api.delete(`/products/${p.id}`), 'Product deleted')}>Delete</button>
                  </>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
