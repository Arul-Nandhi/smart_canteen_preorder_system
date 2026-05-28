import { useState, useEffect, Fragment } from 'react';
import { RefreshCw, Search, Trash2, Lock, Unlock, ChevronDown, ChevronUp, Package, Users } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function AdminUsersPage() {
  const [users,      setUsers]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [expanded,   setExpanded]   = useState(null);
  const [userOrders, setUserOrders] = useState({});

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/auth/users/').catch(() => ({ data: [] }));
      setUsers(res.data.filter(u => u.role === 'student'));
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const departments = ['all', ...new Set(users.map(u => u.department).filter(Boolean))];

  const filtered = users.filter(u => {
    const matchSearch = !search ||
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.phone?.includes(search);
    const matchDept = deptFilter === 'all' || u.department === deptFilter;
    return matchSearch && matchDept;
  });

  const deleteUser = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    try {
      await api.delete(`/auth/users/${id}/`);
      setUsers(prev => prev.filter(u => u.id !== id));
      toast.success('User deleted');
    } catch { toast.error('Failed to delete user'); }
  };

  const toggleActive = async (user) => {
    try {
      const res = await api.patch(`/auth/users/${user.id}/`, { is_active: !user.is_active });
      setUsers(prev => prev.map(u => u.id === user.id ? res.data : u));
      toast.success(`User ${res.data.is_active ? 'activated' : 'blocked'}`);
    } catch { toast.error('Failed to update'); }
  };

  const loadOrders = async (userId) => {
    if (expanded === userId) { setExpanded(null); return; }
    setExpanded(userId);
    if (userOrders[userId]) return; // already loaded
    try {
      const res = await api.get(`/orders/?user=${userId}`).catch(() => api.get('/orders/'));
      const orders = Array.isArray(res.data) ? res.data.filter(o => o.user === userId || o.user?.id === userId) : [];
      setUserOrders(prev => ({ ...prev, [userId]: orders }));
    } catch {
      setUserOrders(prev => ({ ...prev, [userId]: [] }));
    }
  };

  const active = users.filter(u => u.is_active).length;

  return (
    <AdminLayout title="User Management" subtitle="Manage student and employee accounts">
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total Users',  value: users.length,                color: '#38bdf8' },
          { label: 'Active',       value: active,                      color: '#22c55e' },
          { label: 'Blocked',      value: users.length - active,       color: '#ef4444' },
          { label: 'Departments',  value: departments.length - 1,      color: '#a78bfa' },
        ].map((s, i) => (
          <div key={i} className="admin-card" style={{ padding: '16px 18px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: s.color, letterSpacing: '-1px' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="admin-input-wrap" style={{ width: 240 }}>
          <Search size={15} className="admin-input-icon" />
          <input className="admin-input" placeholder="Search by name, email, phone…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="admin-select" value={deptFilter} onChange={e => setDeptFilter(e.target.value)} style={{ width: 180 }}>
          {departments.map(d => <option key={d} value={d}>{d === 'all' ? 'All Departments' : d}</option>)}
        </select>
        <button onClick={load} className="admin-btn admin-btn-ghost admin-btn-sm" style={{ height: 38 }}><RefreshCw size={14} /></button>
      </div>

      {/* Table */}
      <div className="admin-table-wrap">
        <div className="admin-table-header">
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-1)' }}>
            Students / Employees ({filtered.length})
          </div>
        </div>

        {loading ? (
          <div className="admin-empty"><div style={{ width: 36, height: 36, border: '3px solid var(--teal)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto' }} /></div>
        ) : filtered.length === 0 ? (
          <div className="admin-empty">
            <Users size={32} color="var(--text-3)" style={{ marginBottom: 8, opacity: 0.5 }} />
            <p>No users found</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Student / Employee</th>
                  <th>Mobile</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <Fragment key={u.id}>
                    <tr key={u.id}>
                      <td><span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-3)' }}>#{u.id}</span></td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #38bdf8, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                            {u.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </div>
                          <div>
                            <div className="primary-text">{u.name}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-3)' }}>{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>{u.phone || '—'}</td>
                      <td>
                        {u.department
                          ? <span style={{ fontSize: '0.75rem', background: 'rgba(167,139,250,0.1)', color: '#a78bfa', borderRadius: 999, padding: '2px 8px', fontWeight: 600 }}>{u.department}</span>
                          : <span style={{ color: 'var(--text-3)', fontSize: '0.78rem' }}>—</span>
                        }
                      </td>
                      <td>
                        <span className={`admin-badge ${u.is_active ? 'admin-badge-green' : 'admin-badge-red'}`}>
                          {u.is_active ? '● Active' : '○ Blocked'}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 5 }}>
                          <button
                            onClick={() => loadOrders(u.id)}
                            className="admin-btn admin-btn-ghost admin-btn-sm"
                            title="Order History"
                            style={{ gap: 4 }}
                          >
                            <Package size={13} />
                            {expanded === u.id ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                          </button>
                          <button onClick={() => toggleActive(u)} className={`admin-btn admin-btn-sm ${u.is_active ? 'admin-btn-danger' : 'admin-btn-primary'}`} title={u.is_active ? 'Block' : 'Activate'}>
                            {u.is_active ? <Lock size={13} /> : <Unlock size={13} />}
                          </button>
                          <button onClick={() => deleteUser(u.id)} className="admin-btn admin-btn-danger admin-btn-sm"><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                    {/* Order History Expand Row */}
                    {expanded === u.id && (
                      <tr key={`orders-${u.id}`}>
                        <td colSpan={7} style={{ background: 'var(--surface-2)', padding: 0 }}>
                          <div style={{ padding: '12px 20px' }}>
                            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-2)', marginBottom: 10 }}>
                              Order History for {u.name}
                            </div>
                            {!userOrders[u.id] ? (
                              <div style={{ fontSize: '0.78rem', color: 'var(--text-3)' }}>Loading…</div>
                            ) : userOrders[u.id].length === 0 ? (
                              <div style={{ fontSize: '0.78rem', color: 'var(--text-3)' }}>No orders found for this user.</div>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 200, overflowY: 'auto' }}>
                                {userOrders[u.id].slice(0, 10).map(o => (
                                  <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: 'var(--surface)', borderRadius: 8, border: '1px solid var(--border)' }}>
                                    <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-3)' }}>#{o.id}</span>
                                    <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-1)' }}>₹{o.total_amount}</span>
                                    <span className={`admin-badge admin-badge-${o.order_status === 'completed' ? 'green' : o.order_status === 'cancelled' ? 'red' : 'teal'}`}>{o.order_status}</span>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-3)' }}>{new Date(o.created_at).toLocaleDateString()}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
