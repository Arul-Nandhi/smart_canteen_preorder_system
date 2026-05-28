import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, TrendingUp, Users, AlertTriangle } from 'lucide-react';
import StaffLayout from '../../components/StaffLayout';
import api from '../../services/api';
import toast from 'react-hot-toast';

/**
 * ──────────────────────────────────────────────────────────
 * LIVE QUEUE MANAGEMENT — Real-time Queue Status Updates
 * ──────────────────────────────────────────────────────────
 */

const RUSH_LEVELS = [
  { level: 'low', label: '🟢 Low Rush', description: 'Smooth operations', color: '#22c55e', bgColor: 'rgba(34,197,94,0.1)' },
  { level: 'medium', label: '🟡 Medium Rush', description: 'Moderate load', color: '#eab308', bgColor: 'rgba(234,179,8,0.1)' },
  { level: 'heavy', label: '🔴 Heavy Rush', description: 'Peak traffic alert', color: '#ef4444', bgColor: 'rgba(239,68,68,0.1)' },
];

export default function QueueManagement() {
  const [queueStatus, setQueueStatus] = useState(null);
  const [rushLevel, setRushLevel] = useState('medium');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [currentOrders, setCurrentOrders] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [lastUpdated, setLastUpdated] = useState(new Date().toLocaleTimeString());

  const load = useCallback(async () => {
    try {
      const [queueRes, ordersRes] = await Promise.all([
        api.get('/queue/status/').catch(() => ({ data: null })),
        api.get('/orders/').catch(() => ({ data: [] }))
      ]);
      setQueueStatus(queueRes.data);
      setCurrentOrders(ordersRes.data);
      if (queueRes.data?.rush_level) {
        setRushLevel(queueRes.data.rush_level);
      }
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      toast.error('Failed to load queue data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, 8000);
    const timeTimer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => { clearInterval(timer); clearInterval(timeTimer); };
  }, [load]);

  const handleUpdateRush = async (level) => {
    setUpdating(true);
    try {
      // Update rush level (this would need a backend endpoint)
      await api.post('/queue/update-rush/', { rush_level: level });
      setRushLevel(level);
      toast.success(`Queue updated to ${RUSH_LEVELS.find(r => r.level === level).label}`);
      load();
    } catch (err) {
      toast.error('Failed to update queue status');
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  // Count orders by status
  const activeOrders = currentOrders.filter(o => ['pending', 'confirmed', 'preparing', 'ready'].includes(o.order_status));
  const currentRushLevel = RUSH_LEVELS.find(r => r.level === rushLevel) || RUSH_LEVELS[1];
  const avgWaitTime = activeOrders.length > 0
    ? Math.ceil(activeOrders.reduce((sum, o) => sum + (o.estimated_wait || 0), 0) / activeOrders.length)
    : 0;

  return (
    <StaffLayout title="Preparation Queue" subtitle="Monitor and manage queue loads and rush levels">
      <div className="dash-page">

        {/* HEADER */}
        <div className="dash-welcome">
          <div>
            <h1>📊 Live Queue Management</h1>
            <div className="dash-welcome-meta">
              <span>⏱ {currentTime.toLocaleTimeString()}</span>
              <span>Active: {activeOrders.length} orders</span>
            </div>
          </div>
          <button onClick={load} className="dash-btn dash-btn-ghost">
            <RefreshCw size={18} /> Refresh
          </button>
        </div>

        {/* CURRENT RUSH LEVEL INDICATOR */}
        <h2 className="dash-section-title">🔴 Current Queue Status</h2>
        <div
          style={{
            background: currentRushLevel.bgColor,
            border: `2px solid ${currentRushLevel.color}`,
            padding: 'var(--sp-6)',
            borderRadius: 'var(--r-lg)',
            marginBottom: 'var(--sp-8)',
            textAlign: 'center'
          }}
        >
          <div style={{ fontSize: '2.5rem', marginBottom: 'var(--sp-3)' }}>
            {currentRushLevel.level === 'low' ? '✅' :
             currentRushLevel.level === 'medium' ? '⚠️' : '🚨'}
          </div>
          <p style={{ fontSize: '1.6rem', fontWeight: 900, color: currentRushLevel.color, margin: 0 }}>
            {currentRushLevel.label}
          </p>
          <p style={{ color: 'var(--text-3)', fontSize: '0.9rem', margin: 'var(--sp-2) 0 0' }}>
            {currentRushLevel.description}
          </p>
        </div>

        {/* QUICK STATS */}
        <h2 className="dash-section-title">📈 Queue Metrics</h2>
        <div className="dash-stat-grid-4" style={{ marginBottom: 'var(--sp-8)' }}>
          {[
            { icon: Users, label: 'Active Orders', value: activeOrders.length, color: '#38bdf8' },
            { icon: TrendingUp, label: 'Avg Wait Time', value: `${avgWaitTime}m`, color: '#a78bfa' },
            { icon: AlertTriangle, label: 'Peak Orders', value: Math.max(...currentOrders.map(o => o.total_amount || 0), 0).toFixed(0), color: '#ef4444' },
            { icon: RefreshCw, label: 'Last Updated', value: lastUpdated, color: 'var(--teal)' },
          ].map(s => (
            <div key={s.label} className="dash-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', marginBottom: 'var(--sp-3)' }}>
                <div style={{ width: 40, height: 40, borderRadius: 'var(--r-sm)', background: `${s.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}>
                  <s.icon size={20} />
                </div>
                <p className="dash-stat-label" style={{ marginBottom: 0 }}>{s.label}</p>
              </div>
              <p className="dash-stat-value" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* RUSH LEVEL SELECTOR */}
        <h2 className="dash-section-title">🎛️ Update Queue Status</h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 'var(--sp-4)',
          marginBottom: 'var(--sp-8)'
        }}>
          {RUSH_LEVELS.map(level => (
            <button
              key={level.level}
              onClick={() => handleUpdateRush(level.level)}
              disabled={updating}
              style={{
                padding: 'var(--sp-5)',
                borderRadius: 'var(--r-lg)',
                border: rushLevel === level.level ? `2px solid ${level.color}` : '1px solid var(--border)',
                background: rushLevel === level.level ? level.bgColor : 'var(--surface-2)',
                cursor: updating ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                opacity: updating ? 0.5 : 1,
                textAlign: 'center'
              }}
              onMouseEnter={e => {
                if (!updating) {
                  e.currentTarget.style.background = level.bgColor;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = `0 4px 16px ${level.color}33`;
                }
              }}
              onMouseLeave={e => {
                if (!updating) {
                  e.currentTarget.style.background = rushLevel === level.level ? level.bgColor : 'var(--surface-2)';
                  e.currentTarget.style.transform = '';
                  e.currentTarget.style.boxShadow = '';
                }
              }}
            >
              <div style={{ fontSize: '1.8rem', marginBottom: 'var(--sp-3)' }}>
                {level.level === 'low' ? '🟢' : level.level === 'medium' ? '🟡' : '🔴'}
              </div>
              <div style={{ fontWeight: 800, color: level.color, fontSize: '1rem', marginBottom: 'var(--sp-2)' }}>
                {level.label}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>
                {level.description}
              </div>
            </button>
          ))}
        </div>

        {/* CURRENT ORDERS IN QUEUE */}
        <h2 className="dash-section-title">🎫 Orders in Queue ({activeOrders.length})</h2>
        {loading ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <div style={{ width: 48, height: 48, border: '4px solid var(--teal)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 16px' }} />
            <p style={{ color: 'var(--text-3)' }}>Loading queue data...</p>
          </div>
        ) : activeOrders.length === 0 ? (
          <div className="dash-empty">
            <p style={{ fontSize: '2rem' }}>✅</p>
            <p>Queue is empty!</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--sp-4)' }}>
            {activeOrders
              .sort((a, b) => {
                const statusOrder = { pending: 1, confirmed: 2, preparing: 3, ready: 4 };
                return (statusOrder[a.order_status] || 5) - (statusOrder[b.order_status] || 5);
              })
              .map((order, idx) => {
                const statusColors = {
                  pending: { bg: 'rgba(234,179,8,0.1)', color: '#eab308' },
                  confirmed: { bg: 'rgba(56,189,248,0.1)', color: '#38bdf8' },
                  preparing: { bg: 'rgba(167,139,250,0.1)', color: '#a78bfa' },
                  ready: { bg: 'rgba(34,197,94,0.1)', color: '#22c55e' },
                };
                const sc = statusColors[order.order_status] || statusColors.pending;

                return (
                  <div key={order.id} className="dash-card" style={{ borderLeft: `4px solid ${sc.color}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--sp-3)' }}>
                      <div>
                        <p style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-1)', margin: 0 }}>
                          #{idx + 1} • {order.token_number}
                        </p>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-3)', margin: 'var(--sp-1) 0 0' }}>
                          {order.user?.name || 'Customer'}
                        </p>
                      </div>
                      <div
                        style={{
                          background: sc.bg,
                          color: sc.color,
                          padding: '4px 10px',
                          borderRadius: 6,
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          textTransform: 'uppercase'
                        }}
                      >
                        {order.order_status}
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-3)', fontSize: '0.85rem', marginBottom: 'var(--sp-3)' }}>
                      <div>
                        <span style={{ color: 'var(--text-3)', display: 'block', fontSize: '0.75rem', marginBottom: 2 }}>Items</span>
                        <span style={{ fontWeight: 700, color: 'var(--text-1)' }}>{order.items?.length || 0}</span>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-3)', display: 'block', fontSize: '0.75rem', marginBottom: 2 }}>Wait Time</span>
                        <span style={{ fontWeight: 700, color: 'var(--teal)' }}>{order.estimated_wait}m</span>
                      </div>
                    </div>

                    {/* Items brief */}
                    {order.items && order.items.length > 0 && (
                      <div style={{ background: 'var(--surface-2)', padding: 'var(--sp-2) var(--sp-3)', borderRadius: 8, fontSize: '0.75rem', color: 'var(--text-2)' }}>
                        {order.items.slice(0, 2).map((i, idx) => (
                          <div key={idx}>{i.quantity}x {i.item_detail?.item_name}</div>
                        ))}
                        {order.items.length > 2 && <div>+{order.items.length - 2} more</div>}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        )}

      </div>
    </StaffLayout>
  );
}
