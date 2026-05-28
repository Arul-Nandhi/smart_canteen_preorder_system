import { useState, useEffect } from 'react';
import { RefreshCw, Search, Package } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import api from '../../services/api';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = ['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'];

const STATUS_BADGE = {
  pending:   'admin-badge-yellow',
  confirmed: 'admin-badge-blue',
  preparing: 'admin-badge-purple',
  ready:     'admin-badge-teal',
  completed: 'admin-badge-green',
  cancelled: 'admin-badge-red',
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/orders/all/').catch(() => api.get('/orders/'));
      setOrders(res.data);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadOrders(); }, []);

  const filtered = orders.filter(o => {
    const matchStatus = filter === 'all' || o.order_status === filter;
    const matchSearch = search === '' ||
      String(o.id).includes(search) ||
      (o.user?.name || '').toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/orders/${id}/`, { order_status: status });
      setOrders(prev => prev.map(o => o.id === id ? { ...o, order_status: status } : o));
      toast.success(`Order #${id} → ${status}`);
    } catch {
      toast.error('Failed to update order');
    }
  };

  return (
    <AdminLayout title="Order Management" subtitle="View and manage all customer orders">
      {/* Filter chips */}
      <div className="admin-filter-bar">
        {['all', ...STATUS_OPTIONS].map(s => (
          <button
            key={s}
            className={`admin-chip ${filter === s ? 'active' : ''}`}
            onClick={() => setFilter(s)}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
            {s !== 'all' && (
              <span style={{ marginLeft: 4, opacity: 0.7 }}>
                ({orders.filter(o => o.order_status === s).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="admin-table-wrap">
        <div className="admin-table-header">
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-1)' }}>
            {filtered.length} orders
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="admin-input-wrap" style={{ width: 220 }}>
              <Search size={15} className="admin-input-icon" />
              <input
                className="admin-input"
                placeholder="Search order or name…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <button onClick={loadOrders} className="admin-btn admin-btn-ghost" style={{ gap: 6, height: 38 }}>
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="admin-empty">
            <div style={{ width: 36, height: 36, border: '3px solid var(--teal)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 12px' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="admin-empty">
            <Package size={32} color="var(--text-3)" style={{ marginBottom: 8, opacity: 0.5 }} />
            <p>No orders found</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Time</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(o => (
                  <tr key={o.id}>
                    <td><span className="primary-text">#{o.id}</span></td>
                    <td>{o.user?.name || 'Unknown'}</td>
                    <td>
                      <span className={`admin-badge ${o.order_type === 'instant' ? 'admin-badge-blue' : 'admin-badge-purple'}`}>
                        {o.order_type || 'instant'}
                      </span>
                    </td>
                    <td><span className="primary-text">₹{o.total_amount}</span></td>
                    <td>
                      <span className={`admin-badge ${STATUS_BADGE[o.order_status] || 'admin-badge-teal'}`}>
                        {o.order_status}
                      </span>
                    </td>
                    <td>{new Date(o.created_at).toLocaleTimeString()}</td>
                    <td>
                      <select
                        value={o.order_status}
                        onChange={e => updateStatus(o.id, e.target.value)}
                        className="admin-select"
                        style={{ width: 130 }}
                      >
                        {STATUS_OPTIONS.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
