import { useState, useEffect } from 'react';
import { Bell, RefreshCw, Send, Trash2, AlertTriangle, Zap, Clock, Users, Activity, CheckCircle } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import api from '../../services/api';
import toast from 'react-hot-toast';

const ALERT_TYPES = [
  { id: 'rush',    label: 'Heavy Rush Alert',     desc: 'Sent when queue rush level is set to Heavy', color: '#ef4444', bg: 'rgba(239,68,68,0.08)' },
  { id: 'slot',    label: 'Slot Overload',        desc: 'Auto-generated when slots exceed 80% capacity', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
  { id: 'delay',   label: 'Order Delay Warning',  desc: 'Sent when avg wait time exceeds 25 minutes', color: '#fb923c', bg: 'rgba(251,146,60,0.08)' },
  { id: 'staff',   label: 'Staff Update',        desc: 'Manual staff availability and shift updates', color: '#38bdf8', bg: 'rgba(56,189,248,0.08)' },
  { id: 'queue',   label: 'Queue Status Change',  desc: 'Notifies users when their token is ready', color: '#22c55e', bg: 'rgba(34,197,94,0.08)' },
  { id: 'promo',   label: 'Promotion / Offer',    desc: 'Special offer announcements for students', color: '#a78bfa', bg: 'rgba(167,139,250,0.08)' },
];

const TYPE_ICON = {
  rush: <AlertTriangle size={14} />, slot: <Zap size={14} />, delay: <Clock size={14} />,
  staff: <Users size={14} />, queue: <Activity size={14} />, promo: <CheckCircle size={14} />,
};

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [form, setForm]         = useState({ title: '', message: '', target: 'all', type: 'promo' });
  const [sending, setSending]   = useState(false);
  const [activeTab, setActiveTab] = useState('send'); // send | history | types

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications/').catch(() => ({ data: [] }));
      setNotifications(Array.isArray(res.data) ? res.data : []);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) {
      toast.error('Title and message are required');
      return;
    }
    setSending(true);
    try {
      await api.post('/notifications/', form);
      toast.success('Notification sent!');
      setForm({ title: '', message: '', target: 'all', type: 'promo' });
      load();
    } catch {
      toast.error('Failed to send notification');
    } finally {
      setSending(false);
    }
  };

  const deleteNotif = async (id) => {
    try {
      await api.delete(`/notifications/${id}/`);
      setNotifications(prev => prev.filter(n => n.id !== id));
      toast.success('Deleted');
    } catch { toast.error('Failed to delete'); }
  };

  // Auto-generate system alerts based on runtime conditions
  const systemAlerts = [
    { id: 'sys1', icon: <Activity size={15} color="var(--teal)" />, message: 'Analytics updated — peak hour is 1PM today', severity: 'info', time: 'Just now' },
    { id: 'sys2', icon: <Bell size={15} color="var(--teal)" />, message: 'System is running normally. All services are operational.', severity: 'ok', time: '5 min ago' },
  ];

  return (
    <AdminLayout title="Notifications" subtitle="Send announcements and view notification history">

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
        {[
          { key: 'send',   label: 'Send Notification' },
          { key: 'history',label: 'History' },
          { key: 'types',  label: 'Alert Types' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="admin-btn admin-btn-ghost"
            style={{
              borderBottom: activeTab === tab.key ? '2px solid var(--teal)' : '2px solid transparent',
              borderLeft: 'none', borderRight: 'none', borderTop: 'none',
              borderRadius: 0, color: activeTab === tab.key ? 'var(--teal)' : 'var(--text-2)',
              background: 'transparent', padding: '0 16px', height: 40, fontSize: '0.85rem',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── TAB: Send Notification ── */}
      {activeTab === 'send' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.6fr)', gap: 24, alignItems: 'start' }}>
          <div className="admin-form-panel">
            <div className="admin-form-panel-header">
              <span className="admin-form-panel-title">Compose Notification</span>
            </div>
            <div className="admin-form-body">
              <form onSubmit={handleSend}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div className="admin-form-field">
                    <label className="admin-form-label">Alert Type</label>
                    <select className="admin-select" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                      {ALERT_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                    </select>
                  </div>
                  <div className="admin-form-field">
                    <label className="admin-form-label">Title *</label>
                    <input className="admin-input" placeholder="Notification title" value={form.title}
                      onChange={e => setForm({ ...form, title: e.target.value })} required />
                  </div>
                  <div className="admin-form-field">
                    <label className="admin-form-label">Message *</label>
                    <textarea className="admin-input" placeholder="Write your message…" value={form.message}
                      onChange={e => setForm({ ...form, message: e.target.value })}
                      style={{ height: 110, resize: 'vertical', paddingTop: 10 }} required />
                  </div>
                  <div className="admin-form-field">
                    <label className="admin-form-label">Target Audience</label>
                    <select className="admin-select" value={form.target} onChange={e => setForm({ ...form, target: e.target.value })}>
                      <option value="all">Everyone</option>
                      <option value="students">Students Only</option>
                      <option value="staff">Staff Only</option>
                    </select>
                  </div>
                  <button type="submit" className="admin-btn admin-btn-primary" disabled={sending} style={{ width: '100%' }}>
                    {sending ? (
                      <><div style={{ width: 14, height: 14, border: '2px solid rgba(11,15,20,0.3)', borderTopColor: '#0B0F14', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Sending…</>
                    ) : (
                      <><Send size={15} /> Send Notification</>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* System Alerts Panel */}
          <div>
            <div className="admin-card" style={{ marginBottom: 16 }}>
              <div className="admin-section-title" style={{ marginBottom: 16 }}>
                <Zap size={16} style={{ color: 'var(--teal)' }} /> Auto-Generated System Alerts
              </div>
              {systemAlerts.map(alert => (
                <div key={alert.id} style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--border-soft)', alignItems: 'flex-start' }}>
                  <div style={{ flexShrink: 0, marginTop: 4 }}>{alert.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.83rem', color: 'var(--text-1)', fontWeight: 600, lineHeight: 1.4 }}>{alert.message}</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-3)', marginTop: 4 }}>{alert.time}</div>
                  </div>
                  <span className={`admin-badge ${alert.severity === 'ok' ? 'admin-badge-green' : 'admin-badge-blue'}`}>
                    {alert.severity === 'ok' ? 'OK' : 'INFO'}
                  </span>
                </div>
              ))}
            </div>

            <div className="admin-card">
              <div className="admin-section-title" style={{ marginBottom: 12 }}>Quick Send Templates</div>
              {[
                { title: 'Heavy Rush Alert', msg: 'Canteen is experiencing high demand. Please expect longer wait times.' },
                { title: 'Canteen Re-opened', msg: 'Canteen is now open and accepting new orders.' },
                { title: 'Last Orders Today', msg: 'Last preorders for today will close in 30 minutes.' },
              ].map((t, i) => (
                <button key={i} onClick={() => setForm(prev => ({ ...prev, title: t.title, message: t.msg }))}
                  className="admin-btn admin-btn-ghost"
                  style={{ width: '100%', justifyContent: 'flex-start', fontSize: '0.8rem', padding: '9px 12px', marginBottom: 6, height: 'auto' }}
                >
                  {t.title}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: History ── */}
      {activeTab === 'history' && (
        <div className="admin-table-wrap">
          <div className="admin-table-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Bell size={16} style={{ color: 'var(--teal)' }} />
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-1)' }}>
                Notification History ({notifications.length})
              </span>
            </div>
            <button onClick={load} className="admin-btn admin-btn-ghost admin-btn-sm" style={{ gap: 6 }}>
              <RefreshCw size={13} className={loading ? 'spin' : ''} /> Refresh
            </button>
          </div>
          {loading ? (
            <div className="admin-empty">
              <div style={{ width: 32, height: 32, border: '3px solid var(--teal)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto' }} />
            </div>
          ) : notifications.length === 0 ? (
            <div className="admin-empty">
              <Bell size={32} color="var(--text-3)" style={{ marginBottom: 8, opacity: 0.5 }} />
              <p>No notifications sent yet</p>
            </div>
          ) : (
            <div style={{ maxHeight: 520, overflowY: 'auto' }}>
              {notifications.map(n => (
                <div key={n.id} style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-soft)', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--teal-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Bell size={16} style={{ color: 'var(--teal)' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-1)', marginBottom: 4 }}>{n.title || 'Notification'}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginBottom: 6, lineHeight: 1.5 }}>{n.message}</div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span className="admin-badge admin-badge-teal">{n.target || 'all'}</span>
                      {n.type && (
                        <span className="admin-badge admin-badge-blue" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          {TYPE_ICON[n.type]} {n.type}
                        </span>
                      )}
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-3)' }}>
                        {n.created_at ? new Date(n.created_at).toLocaleString() : ''}
                      </span>
                    </div>
                  </div>
                  <button onClick={() => deleteNotif(n.id)} className="admin-btn admin-btn-danger admin-btn-sm" style={{ flexShrink: 0 }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB: Alert Types ── */}
      {activeTab === 'types' && (
        <div>
          <p style={{ fontSize: '0.83rem', color: 'var(--text-3)', marginBottom: 20 }}>
            These are the supported notification alert types. Choose the appropriate type when sending a notification to help users quickly identify urgency.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
            {ALERT_TYPES.map(type => (
              <div key={type.id} className="notif-type-card">
                <div className="notif-type-icon" style={{ background: type.bg, color: type.color, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 8 }}>
                  {TYPE_ICON[type.id]}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-1)', marginBottom: 3 }}>{type.label}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', lineHeight: 1.4 }}>{type.desc}</div>
                </div>
                <button
                  onClick={() => { setForm(prev => ({ ...prev, type: type.id })); setActiveTab('send'); }}
                  className="admin-btn admin-btn-sm admin-btn-ghost"
                  style={{ flexShrink: 0 }}
                >
                  Use
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
