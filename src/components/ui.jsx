import { useEffect, useState } from 'react';
import { errMsg } from '../api';

/** Small banner for success / error messages. */
export function Alert({ error, success, onClose }) {
  if (!error && !success) return null;
  return (
    <div className={`alert ${error ? 'alert-error' : 'alert-ok'}`} onClick={onClose}>
      {error || success}
    </div>
  );
}

/** Loads data from an async function and exposes reload + error state. */
export function useLoad(fn, deps = []) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const reload = async () => {
    setLoading(true);
    try { setData(await fn()); setError(''); }
    catch (e) { setError(errMsg(e)); }
    finally { setLoading(false); }
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { reload(); }, deps);
  return { data, error, loading, reload };
}

export function Card({ title, children, actions }) {
  return (
    <section className="card">
      {(title || actions) && (
        <div className="card-head"><h3>{title}</h3><div>{actions}</div></div>
      )}
      {children}
    </section>
  );
}

export function Stat({ label, value, tone }) {
  return (
    <div className={`stat ${tone || ''}`}>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}
