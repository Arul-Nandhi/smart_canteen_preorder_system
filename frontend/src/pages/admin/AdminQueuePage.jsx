import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Play, CheckCircle, Clock, Volume2, Maximize, Minimize, Users, AlertTriangle } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import api from '../../services/api';
import toast from 'react-hot-toast';

const RUSH_CONFIG = {
  low:    { label: 'Low Rush',    color: '#22c55e', bg: 'rgba(34,197,94,0.1)',  emoji: '🟢' },
  medium: { label: 'Medium Rush', color: '#eab308', bg: 'rgba(234,179,8,0.1)', emoji: '🟡' },
  heavy:  { label: 'Heavy Rush',  color: '#ef4444', bg: 'rgba(239,68,68,0.1)', emoji: '🔴' },
};

export default function AdminQueuePage() {
  const [orders,        setOrders]       = useState([]);
  const [loading,       setLoading]      = useState(true);
  const [lastUpdate,    setLastUpdate]   = useState(new Date());
  const [isFullscreen,  setFullscreen]   = useState(false);
  const [soundEnabled,  setSoundEnabled] = useState(true);
  const [prevReadyCount, setPrevReady]   = useState(0);

  // Rush level + crowd — synced via localStorage (shared with dashboard)
  const [rushLevel,  setRushLevel]  = useState(() => localStorage.getItem('canteen_rush_level') || 'low');
  const [crowdCount, setCrowdCount] = useState(() => Number(localStorage.getItem('canteen_crowd_count') || 0));
  const [crowdInput, setCrowdInput] = useState('');

  const updateRush = (level) => {
    setRushLevel(level);
    localStorage.setItem('canteen_rush_level', level);
    toast.success(`Rush level set to ${RUSH_CONFIG[level].label}`);
  };
  const updateCrowd = () => {
    const val = parseInt(crowdInput, 10);
    if (isNaN(val) || val < 0) { toast.error('Enter a valid number'); return; }
    setCrowdCount(val);
    localStorage.setItem('canteen_crowd_count', String(val));
    setCrowdInput('');
    toast.success(`Queue count updated: ${val} people`);
  };

  const load = useCallback(async () => {
    try {
      const res = await api.get('/orders/all/').catch(() => api.get('/orders/'));
      const active = res.data.filter(o => ['confirmed','preparing','ready'].includes(o.order_status));
      setOrders(active);
      setLastUpdate(new Date());

      const nowReady = active.filter(o => o.order_status === 'ready').length;
      if (soundEnabled && nowReady > prevReadyCount && prevReadyCount > 0) {
        playBeeps();
        toast.success('🔔 New order ready for pickup!');
      }
      setPrevReady(nowReady);
    } catch { toast.error('Failed to update live queue'); }
    finally { setLoading(false); }
  }, [soundEnabled, prevReadyCount]);

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [load]);

  const playBeeps = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      [[0, 587, 0.2], [0.25, 880, 0.4]].forEach(([delay, freq, dur]) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
        gain.gain.setValueAtTime(0, ctx.currentTime + delay);
        gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + delay + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + dur);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + dur);
      });
    } catch {}
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setFullscreen(true);
    } else {
      document.exitFullscreen();
      setFullscreen(false);
    }
  };

  const preparing = orders.filter(o => ['confirmed','preparing'].includes(o.order_status));
  const ready     = orders.filter(o => o.order_status === 'ready');
  const rush      = RUSH_CONFIG[rushLevel] || RUSH_CONFIG.low;

  const updateOrderStatus = async (id, status) => {
    try {
      await api.patch(`/orders/${id}/`, { order_status: status });
      setOrders(prev => {
        const updated = prev.map(o => o.id === id ? { ...o, order_status: status } : o);
        return updated.filter(o => ['confirmed','preparing','ready'].includes(o.order_status));
      });
      toast.success(`Token status → ${status}`);
    } catch { toast.error('Failed to update status'); }
  };

  return (
    <AdminLayout title="Live Queue Monitor" subtitle="Real-time token board and queue management">

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="admin-live-dot">Auto-updating live</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>Last sync: {lastUpdate.toLocaleTimeString()}</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setSoundEnabled(s => !s)} className={`admin-btn ${soundEnabled ? 'admin-btn-primary' : 'admin-btn-secondary'} admin-btn-sm`}>
            <Volume2 size={13} /> {soundEnabled ? 'Chime ON' : 'Muted'}
          </button>
          <button onClick={toggleFullscreen} className="admin-btn admin-btn-secondary admin-btn-sm">
            {isFullscreen ? <Minimize size={13} /> : <Maximize size={13} />}
          </button>
          <button onClick={load} className="admin-btn admin-btn-ghost admin-btn-sm" disabled={loading}>
            <RefreshCw size={13} className={loading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {/* Rush Level + Crowd Update Panel */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 20 }}>

        {/* Rush Controls */}
        <div className="admin-card">
          <div className="admin-section-title" style={{ marginBottom: 14 }}>🚦 Rush Level Control</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            {['low','medium','heavy'].map(r => {
              const cfg = RUSH_CONFIG[r];
              return (
                <button
                  key={r}
                  className={`rush-btn ${r} ${rushLevel === r ? 'active' : ''}`}
                  onClick={() => updateRush(r)}
                  style={{ flex: 1 }}
                >
                  {cfg.emoji} {cfg.label}
                </button>
              );
            })}
          </div>
          <div style={{
            padding: '10px 14px', borderRadius: 10,
            background: rush.bg, color: rush.color,
            fontSize: '0.82rem', fontWeight: 700,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span>{rush.emoji}</span>
            <span>Current Status: {rush.label}</span>
          </div>
        </div>

        {/* Crowd Count */}
        <div className="admin-card">
          <div className="admin-section-title" style={{ marginBottom: 14 }}>👥 Manual Queue Count</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <input
              className="admin-input"
              type="number"
              placeholder="Enter crowd count…"
              value={crowdInput}
              onChange={e => setCrowdInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && updateCrowd()}
              style={{ flex: 1 }}
            />
            <button onClick={updateCrowd} className="admin-btn admin-btn-primary admin-btn-sm">Update</button>
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--teal)' }}>
            {crowdCount} <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-3)' }}>people in queue</span>
          </div>
        </div>

        {/* Stats */}
        <div className="admin-card" style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          {[
            { label: 'Preparing', value: preparing.length, color: '#fb923c' },
            { label: 'Ready',     value: ready.length,     color: '#22c55e' },
            { label: 'Total',     value: orders.length,    color: '#38bdf8' },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: s.color, letterSpacing: '-1px' }}>{s.value}</div>
              <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Token Board — Preparing | Ready */}
      <div className="token-board-grid">

        {/* Preparing Panel */}
        <div className="token-panel" style={{ borderColor: 'rgba(251,146,60,0.2)' }}>
          <div className="token-panel-header" style={{ borderBottomColor: 'rgba(251,146,60,0.15)', background: 'rgba(251,146,60,0.02)' }}>
            <div className="token-panel-title" style={{ color: '#fb923c' }}>
              <Clock size={18} /> Now Preparing
            </div>
            <span className="admin-badge" style={{ background: 'rgba(251,146,60,0.1)', color: '#fb923c', fontWeight: 700 }}>
              {preparing.length}
            </span>
          </div>
          <div className="token-panel-body">
            {preparing.length === 0 ? (
              <div style={{ gridColumn: '1/-1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', padding: 30 }}>
                <span style={{ fontSize: '2.5rem', marginBottom: 8 }}>🍳</span>
                <p style={{ fontSize: '0.85rem' }}>No orders in prep</p>
              </div>
            ) : preparing.map(order => (
              <div key={order.id} className="token-card preparing">
                <div className="token-number preparing">{order.token_number}</div>
                <div className="token-type">{order.order_type}</div>
                <div className="token-status-label preparing">PREPARING</div>
                <div style={{ marginTop: 8, display: 'flex', gap: 4, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button onClick={() => updateOrderStatus(order.id, 'ready')} className="admin-btn admin-btn-primary admin-btn-sm" style={{ fontSize: '0.65rem', padding: '3px 8px', height: 'auto' }}>
                    ✅ Ready
                  </button>
                  <button onClick={() => updateOrderStatus(order.id, 'cancelled')} className="admin-btn admin-btn-danger admin-btn-sm" style={{ fontSize: '0.65rem', padding: '3px 8px', height: 'auto' }}>
                    Delay
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ready Panel */}
        <div className="token-panel" style={{ borderColor: 'rgba(34,197,94,0.2)' }}>
          <div className="token-panel-header" style={{ borderBottomColor: 'rgba(34,197,94,0.15)', background: 'rgba(34,197,94,0.02)' }}>
            <div className="token-panel-title" style={{ color: '#22c55e' }}>
              <CheckCircle size={18} /> Ready for Pickup
            </div>
            <span className="admin-badge" style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', fontWeight: 700 }}>
              {ready.length}
            </span>
          </div>
          <div className="token-panel-body">
            {ready.length === 0 ? (
              <div style={{ gridColumn: '1/-1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', padding: 30 }}>
                <span style={{ fontSize: '2.5rem', marginBottom: 8 }}>🔔</span>
                <p style={{ fontSize: '0.85rem' }}>Waiting for orders to be ready</p>
              </div>
            ) : ready.map(order => (
              <div key={order.id} className="token-card ready">
                <div className="token-number ready">{order.token_number}</div>
                <div className="token-type">{order.order_type}</div>
                <div className="token-status-label ready">READY!</div>
                <div style={{ marginTop: 8 }}>
                  <button onClick={() => updateOrderStatus(order.id, 'completed')} className="admin-btn admin-btn-primary admin-btn-sm" style={{ fontSize: '0.65rem', padding: '3px 8px', height: 'auto', width: '100%' }}>
                    ✔ Collected
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
