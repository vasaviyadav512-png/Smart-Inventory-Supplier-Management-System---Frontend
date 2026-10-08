import { useState } from 'react';
import api, { errMsg, money } from '../api';
import { useAuth } from '../AuthContext.jsx';
import { Alert, Card, useLoad } from '../components/ui.jsx';

const empty = { name: '', email: '', phone: '', address: '' };

export default function Suppliers() {
  const { isAdmin } = useAuth();
  const { data, error, reload } = useLoad(async () => (await api.get('/suppliers')).data);
  const { data: products } = useLoad(async () => (await api.get('/products')).data);
  const [form, setForm] = useState(null);
  const [selected, setSelected] = useState(null);
  const [prices, setPrices] = useState([]);
  const [priceForm, setPriceForm] = useState({ productId: '', price: '' });
  const [msg, setMsg] = useState({ error: '', success: '' });

  const run = async (fn, ok) => {
    try { await fn(); setMsg({ error: '', success: ok }); await reload(); }
    catch (e) { setMsg({ error: errMsg(e), success: '' }); }
  };

  const openPrices = async (s) => {
    setSelected(s);
    setPrices((await api.get(`/suppliers/${s.id}/products`)).data);
  };

  const save = (e) => {
    e.preventDefault();
    run(async () => {
      if (form.id) await api.put(`/suppliers/${form.id}`, form); else await api.post('/suppliers', form);
      setForm(null);
    }, 'Supplier saved');
  };

  const addPrice = (e) => {
    e.preventDefault();
    run(async () => {
      await api.post(`/suppliers/${selected.id}/products`, { productId: Number(priceForm.productId), price: Number(priceForm.price) });
      setPriceForm({ productId: '', price: '' });
      await openPrices(selected);
    }, 'Price saved');
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <>
      <h2>Suppliers</h2>
      <Alert error={error || msg.error} success={msg.success} onClose={() => setMsg({ error: '', success: '' })} />
      {form && (
        <Card title={form.id ? 'Edit supplier' : 'New supplier'}>
          <form className="form-grid" onSubmit={save}>
            <label>Name<input value={form.name} onChange={set('name')} required /></label>
            <label>Email<input type="email" value={form.email || ''} onChange={set('email')} /></label>
            <label>Phone<input value={form.phone || ''} onChange={set('phone')} /></label>
            <label>Address<input value={form.address || ''} onChange={set('address')} /></label>
            <div className="form-actions">
              <button className="btn" type="submit">Save</button>
              <button className="btn btn-light" type="button" onClick={() => setForm(null)}>Cancel</button>
            </div>
          </form>
        </Card>
      )}
      <Card actions={isAdmin && <button className="btn" onClick={() => setForm({ ...empty })}>+ Add supplier</button>}>
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Address</th><th></th></tr></thead>
          <tbody>
            {(data || []).map((s) => (
              <tr key={s.id}>
                <td>{s.name}</td><td>{s.email}</td><td>{s.phone}</td><td>{s.address}</td>
                <td className="actions">
                  <button className="btn btn-sm btn-light" onClick={() => openPrices(s)}>Price list</button>
                  {isAdmin && <>
                    <button className="btn btn-sm btn-light" onClick={() => setForm(s)}>Edit</button>
                    <button className="btn btn-sm btn-danger" onClick={() => confirm(`Delete ${s.name}?`) && run(() => api.delete(`/suppliers/${s.id}`), 'Supplier deleted')}>Delete</button>
                  </>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {selected && (
        <Card title={`Price list – ${selected.name}`} actions={<button className="btn btn-sm btn-light" onClick={() => setSelected(null)}>Close</button>}>
          <table>
            <thead><tr><th>Product</th><th>Quoted price</th><th></th></tr></thead>
            <tbody>
              {prices.map((sp) => (
                <tr key={sp.id}>
                  <td>{sp.product.name}</td><td>{money(sp.price)}</td>
                  <td>{isAdmin && <button className="btn btn-sm btn-danger" onClick={() => run(async () => { await api.delete(`/suppliers/${selected.id}/products/${sp.product.id}`); await openPrices(selected); }, 'Removed')}>Remove</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {isAdmin && (
            <form className="inline-form" onSubmit={addPrice}>
              <select value={priceForm.productId} onChange={(e) => setPriceForm({ ...priceForm, productId: e.target.value })} required>
                <option value="">Select product…</option>
                {(products || []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <input type="number" step="0.01" min="0" placeholder="Price ₹" value={priceForm.price} onChange={(e) => setPriceForm({ ...priceForm, price: e.target.value })} required />
              <button className="btn" type="submit">Add / update price</button>
            </form>
          )}
        </Card>
      )}
    </>
  );
}
