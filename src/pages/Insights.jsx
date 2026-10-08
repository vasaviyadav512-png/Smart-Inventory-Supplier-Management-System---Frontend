import { useState } from 'react';
import api, { errMsg, money } from '../api';
import { Alert, Card, useLoad } from '../components/ui.jsx';

const tabs = ['Reorder suggestions', 'Demand forecast', 'Supplier scores', 'Price comparison'];
const urgencyClass = { CRITICAL: 'badge-red', HIGH: 'badge-amber', MEDIUM: 'badge-blue' };
const trendIcon = { UP: '📈 Rising', DOWN: '📉 Falling', STABLE: '➡️ Stable' };

export default function Insights() {
  const [tab, setTab] = useState(0);
  return (
    <>
      <h2>Smart Insights</h2>
      <div className="tabs">
        {tabs.map((t, i) => <button key={t} className={i === tab ? 'active' : ''} onClick={() => setTab(i)}>{t}</button>)}
      </div>
      {tab === 0 && <Reorder />}
      {tab === 1 && <Demand />}
      {tab === 2 && <Scores />}
      {tab === 3 && <Compare />}
    </>
  );
}

function Reorder() {
  const { data, error, reload } = useLoad(async () => (await api.get('/analytics/reorder-suggestions')).data);
  const [msg, setMsg] = useState({ error: '', success: '' });

  const order = async (s) => {
    try {
      await api.post('/purchases', { supplierId: s.supplierId, productId: s.productId, quantity: s.suggestedQuantity, unitPrice: null });
      setMsg({ error: '', success: `Purchase order created for ${s.suggestedQuantity} × ${s.productName} from ${s.supplierName}` });
      reload();
    } catch (e) { setMsg({ error: errMsg(e), success: '' }); }
  };

  return (
    <Card title="What to reorder, when, and from whom">
      <Alert error={error || msg.error} success={msg.success} onClose={() => setMsg({ error: '', success: '' })} />
      {data && data.length === 0 && <p className="muted">Nothing needs reordering right now 🎉</p>}
      {data && data.length > 0 && (
        <table>
          <thead><tr><th>Urgency</th><th>Product</th><th>Stock</th><th>Demand/day</th><th>Days left</th><th>Order qty</th><th>Reorder by</th><th>Best supplier</th><th>Est. cost</th><th></th></tr></thead>
          <tbody>
            {data.map((s) => (
              <tr key={s.productId} title={s.reason}>
                <td><span className={`badge ${urgencyClass[s.urgency]}`}>{s.urgency}</span></td>
                <td>{s.productName}</td><td>{s.currentStock}</td><td>{s.avgDailyDemand}</td>
                <td>{s.daysUntilStockout ?? '—'}</td><td><strong>{s.suggestedQuantity}</strong></td><td>{s.reorderBy}</td>
                <td>{s.supplierName ? <>{s.supplierName}<br /><span className="muted small">{money(s.supplierPrice)} · score {s.supplierScore}</span></> : <span className="muted">No supplier quotes</span>}</td>
                <td>{s.estimatedCost ? money(s.estimatedCost) : '—'}</td>
                <td>{s.supplierId && <button className="btn btn-sm" onClick={() => order(s)}>Create PO</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p className="muted small">Reorder point = demand × lead time + safety stock. Quantity covers the next 30 days of forecast demand. Hover a row for the reason.</p>
    </Card>
  );
}

function Demand() {
  const [days, setDays] = useState(30);
  const { data, error } = useLoad(async () => (await api.get(`/analytics/demand?days=${days}`)).data, [days]);
  return (
    <Card title="Demand forecast (weighted moving average of last 4 weeks)"
      actions={<select value={days} onChange={(e) => setDays(Number(e.target.value))}>
        {[7, 14, 30, 60, 90].map((d) => <option key={d} value={d}>Next {d} days</option>)}</select>}>
      <Alert error={error} />
      {data && (
        <table>
          <thead><tr><th>Product</th><th>Last 4 weeks (units/week)</th><th>Avg/day</th><th>Trend</th><th>Forecast ({days}d)</th><th>Stock</th><th>Gap</th></tr></thead>
          <tbody>
            {data.map((f) => {
              const max = Math.max(1, ...f.weeklySales);
              const gap = f.forecastQuantity - f.currentStock;
              return (
                <tr key={f.productId}>
                  <td>{f.productName}</td>
                  <td><div className="spark">{f.weeklySales.map((w, i) => (
                    <div key={i} title={`${w} units`} style={{ height: `${(w / max) * 100}%` }} />))}</div>
                    <span className="muted small">{f.weeklySales.join(' · ')}</span></td>
                  <td>{f.avgDailyDemand}</td><td>{trendIcon[f.trend]}</td>
                  <td><strong>{f.forecastQuantity}</strong></td><td>{f.currentStock}</td>
                  <td>{gap > 0 ? <span className="badge badge-red">short {gap}</span> : <span className="badge badge-green">covered</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </Card>
  );
}

function Scores() {
  const { data, error } = useLoad(async () => (await api.get('/analytics/supplier-scores')).data);
  const gradeClass = { Excellent: 'badge-green', Good: 'badge-blue', Average: 'badge-amber', Poor: 'badge-red' };
  return (
    <Card title="Supplier performance (40% delivery · 30% quality · 30% price)">
      <Alert error={error} />
      {data && (
        <table>
          <thead><tr><th>#</th><th>Supplier</th><th>Orders received</th><th>On-time</th><th>Avg quality (1-5)</th><th>Price score</th><th>Overall</th><th>Grade</th></tr></thead>
          <tbody>
            {data.map((s, i) => (
              <tr key={s.supplierId}>
                <td>{i + 1}</td><td>{s.supplierName}</td><td>{s.deliveredOrders}</td>
                <td>{s.onTimeRate}%</td><td>{s.avgQuality}</td><td>{s.priceCompetitiveness}%</td>
                <td><div className="bar"><div style={{ width: `${s.overallScore}%` }} /></div> <strong>{s.overallScore}</strong></td>
                <td><span className={`badge ${gradeClass[s.grade] || 'badge-gray'}`}>{s.grade}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}

function Compare() {
  const { data: products } = useLoad(async () => (await api.get('/products')).data);
  const [pid, setPid] = useState('');
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');

  const choose = async (id) => {
    setPid(id);
    if (!id) return setRows(null);
    try { setRows((await api.get(`/analytics/price-comparison/${id}`)).data); setError(''); }
    catch (e) { setError(errMsg(e)); }
  };

  return (
    <Card title="Compare supplier prices for a product"
      actions={<select value={pid} onChange={(e) => choose(e.target.value)}>
        <option value="">Select product…</option>
        {(products || []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>}>
      <Alert error={error} />
      {rows && rows.length === 0 && <p className="muted">No supplier has quoted this product yet.</p>}
      {rows && rows.length > 0 && (
        <table>
          <thead><tr><th>Supplier</th><th>Quoted price</th><th>Supplier score</th><th></th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.supplierId}>
                <td>{r.supplierName}</td><td>{money(r.price)}</td><td>{r.supplierScore}</td>
                <td>{r.cheapest && <span className="badge badge-green">Cheapest</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}
