import api, { money } from '../api';
import { Alert, Card, Stat, useLoad } from '../components/ui.jsx';

export default function Dashboard() {
  const { data: d, error, loading } = useLoad(async () => (await api.get('/analytics/dashboard')).data);
  if (loading) return <p>Loading…</p>;
  if (!d) return <Alert error={error} />;
  const maxDaily = Math.max(1, ...d.dailySales.map((x) => x.units));
  const maxTop = Math.max(1, ...d.topProducts.map((x) => x.units));

  return (
    <>
      <h2>Dashboard</h2>
      <div className="stats">
        <Stat label="Products" value={d.totalProducts} />
        <Stat label="Suppliers" value={d.totalSuppliers} />
        <Stat label="Low-stock items" value={d.lowStockCount} tone={d.lowStockCount ? 'warn' : ''} />
        <Stat label="Out of stock" value={d.outOfStockCount} tone={d.outOfStockCount ? 'danger' : ''} />
        <Stat label="Stock value" value={money(d.stockValue)} />
        <Stat label="Revenue (30d)" value={money(d.revenueLast30Days)} />
        <Stat label="Units sold (30d)" value={d.unitsSoldLast30Days} />
        <Stat label="Pending purchases" value={d.pendingPurchases} />
      </div>

      <div className="grid2">
        <Card title="⚠️ Low-stock alerts">
          {d.lowStockItems.length === 0 ? <p className="muted">All products are above their reorder level.</p> : (
            <table>
              <thead><tr><th>Product</th><th>Stock</th><th>Reorder level</th></tr></thead>
              <tbody>
                {d.lowStockItems.map((p) => (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td><span className={`badge ${p.stockQuantity === 0 ? 'badge-red' : 'badge-amber'}`}>{p.stockQuantity}</span></td>
                    <td>{p.reorderLevel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card title="🏆 Top sellers (30 days)">
          {d.topProducts.map((t) => (
            <div className="bar-row" key={t.name}>
              <span className="bar-label">{t.name}</span>
              <div className="bar"><div style={{ width: `${(t.units / maxTop) * 100}%` }} /></div>
              <span className="bar-val">{t.units}</span>
            </div>
          ))}
        </Card>
      </div>

      <Card title="Units sold per day (last 14 days)">
        <div className="columns">
          {d.dailySales.map((x) => (
            <div className="col" key={x.date} title={`${x.date}: ${x.units}`}>
              <div className="col-bar" style={{ height: `${(x.units / maxDaily) * 100}%` }} />
              <span>{x.date.slice(8)}</span>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}
