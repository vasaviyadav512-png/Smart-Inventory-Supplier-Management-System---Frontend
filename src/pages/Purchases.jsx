import { useState } from 'react';
import api, { errMsg, money } from '../api';
import { Alert, Card, useLoad } from '../components/ui.jsx';

export default function Purchases() {
  const { data, error, reload } = useLoad(async () => (await api.get('/purchases')).data);
  const { data: suppliers } = useLoad(async () => (await api.get('/suppliers')).data);
  const { data: products } = useLoad(async () => (await api.get('/products')).data);
  const [form, setForm] = useState({ supplierId: '', productId: '', quantity: 10, unitPrice: '' });
  const [msg, setMsg] = useState({ error: '', success: '' });

  const run = async (fn, ok) => {
    try { await fn(); setMsg({ error: '', success: ok }); await reload(); }
    catch (e) { setMsg({ error: errMsg(e), success: '' }); }
  };

  const create = (e) => {
    e.preventDefault();
    run(() => api.post('/purchases', {
      supplierId: Number(form.supplierId), productId: Number(form.productId), quantity: Number(form.quantity),
      unitPrice: form.unitPrice === '' ? null : Number(form.unitPrice),
    }), 'Purchase order created');
  };

  const receive = (p) => {
    const r = prompt('Quality rating of the delivered goods (1-5)', '4');
    if (r === null) return;
    const n = Number(r);
    if (!Number.isInteger(n) || n < 1 || n > 5) return setMsg({ error: 'Rating must be 1-5', success: '' });
    run(() => api.put(`/purchases/${p.id}/receive`, { qualityRating: n }), 'Goods received – stock updated');
  };

  const f = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <>
      <h2>Purchases</h2>
      <Alert error={error || msg.error} success={msg.success} onClose={() => setMsg({ error: '', success: '' })} />
      <Card title="New purchase order">
        <form className="inline-form" onSubmit={create}>
          <select value={form.supplierId} onChange={f('supplierId')} required>
            <option value="">Supplier…</option>
            {(suppliers || []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select value={form.productId} onChange={f('productId')} required>
            <option value="">Product…</option>
            {(products || []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <input type="number" min="1" value={form.quantity} onChange={f('quantity')} required />
          <input type="number" step="0.01" min="0" placeholder="Unit price (blank = quoted)" value={form.unitPrice} onChange={f('unitPrice')} />
          <button className="btn" type="submit">Create order</button>
        </form>
      </Card>
      <Card title="Purchase history">
        <table>
          <thead><tr><th>#</th><th>Supplier</th><th>Product</th><th>Qty</th><th>Unit price</th><th>Ordered</th><th>Expected</th><th>Delivered</th><th>Quality</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {(data || []).map((p) => (
              <tr key={p.id}>
                <td>{p.id}</td><td>{p.supplier.name}</td><td>{p.product.name}</td><td>{p.quantity}</td>
                <td>{money(p.unitPrice)}</td><td>{p.orderDate}</td><td>{p.expectedDate}</td>
                <td>{p.deliveredDate ?? '—'}</td><td>{p.qualityRating ?? '—'}</td>
                <td><span className={`badge ${p.status === 'RECEIVED' ? 'badge-green' : 'badge-amber'}`}>{p.status}</span></td>
                <td>{p.status === 'ORDERED' && <button className="btn btn-sm" onClick={() => receive(p)}>Receive</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
