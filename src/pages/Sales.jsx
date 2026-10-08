import { useState } from 'react';
import api, { errMsg, money } from '../api';
import { Alert, Card, useLoad } from '../components/ui.jsx';

export default function Sales() {
  const { data, error, reload } = useLoad(async () => (await api.get('/sales')).data);
  const { data: products, reload: reloadProducts } = useLoad(async () => (await api.get('/products')).data);
  const [form, setForm] = useState({ productId: '', quantity: 1 });
  const [msg, setMsg] = useState({ error: '', success: '' });
  const selected = (products || []).find((p) => String(p.id) === String(form.productId));

  const submit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/sales', { productId: Number(form.productId), quantity: Number(form.quantity) });
      setMsg({ error: '', success: 'Sale recorded' });
      setForm({ productId: '', quantity: 1 });
      reload(); reloadProducts();
    } catch (err) { setMsg({ error: errMsg(err), success: '' }); }
  };

  return (
    <>
      <h2>Sales</h2>
      <Alert error={error || msg.error} success={msg.success} onClose={() => setMsg({ error: '', success: '' })} />
      <Card title="Record a sale">
        <form className="inline-form" onSubmit={submit}>
          <select value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })} required>
            <option value="">Product…</option>
            {(products || []).map((p) => <option key={p.id} value={p.id}>{p.name} (stock {p.stockQuantity})</option>)}
          </select>
          <input type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required />
          {selected && <span className="muted">Total: {money(selected.unitPrice * form.quantity)}</span>}
          <button className="btn" type="submit">Record sale</button>
        </form>
      </Card>
      <Card title="Recent sales">
        <table>
          <thead><tr><th>Date</th><th>Product</th><th>Qty</th><th>Unit price</th><th>Total</th><th>Sold by</th></tr></thead>
          <tbody>
            {(data || []).slice(0, 100).map((s) => (
              <tr key={s.id}>
                <td>{s.saleDate}</td><td>{s.product.name}</td><td>{s.quantity}</td>
                <td>{money(s.unitPrice)}</td><td>{money(s.unitPrice * s.quantity)}</td><td>{s.soldBy}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {data?.length > 100 && <p className="muted small">Showing latest 100 of {data.length} sales.</p>}
      </Card>
    </>
  );
}
