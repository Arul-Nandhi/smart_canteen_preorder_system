import { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw, TrendingUp, Activity, Users, Package, Clock,
  ArrowUpRight, ChefHat, AlertTriangle, Zap, CheckCircle2,
  XCircle, Timer, UserCheck, BarChart2
} from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

// ── KPI Card ────────────────────────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, accent, soft, sub, trend, util }) {
  return (
    <div
      className="admin-kpi-card"
      style={{ '--stat-accent': accent, '--stat-soft': soft }}
    >
      <div className="admin-kpi-top">
        <div className="admin-kpi-icon"><Icon size={18} /></div>
        {trend != null && (
          <div className="admin-kpi-trend-up">
            <ArrowUpRight size={12} /> +{trend}%
          </div>
        )}
      </div>
      <div className="admin-kpi-label">{label}</div>
      <div className="admin-kpi-value">{value}</div>
      {sub && <div className="admin-kpi-sub">{sub}</div>}
      {util != null && (
        <div className="admin-util-bar">
          <div
            className="admin-util-fill"
            style={{
              width: `${util}%`,
              background: util > 80 ? '#ef4444' : util > 55 ? '#eab308' : accent,
            }}
          />
        </div>
      )}
    </div>
  );
}

// ── Rush Indicator ──────────────────────────────────────────────────────────
const RUSH_CONFIG = {
  low:    { label: 'Low Rush',    sub: 'Canteen is running smoothly' },
  medium: { label: 'Medium Rush', sub: 'Moderate crowd — slight wait expected' },
  heavy:  { label: 'Heavy Rush',  sub: 'High crowd — Instant Pickup Recommended!' },
};

function RushIndicator({ level, crowdCount, onUpdate }) {
  const cfg = RUSH_CONFIG[level] || RUSH_CONFIG.low;
  const dotColor = level === 'heavy' ? '#ef4444' : level === 'medium' ? '#eab308' : '#22c55e';
  return (
    <div className={`rush-banner ${level}`}>
      <div className="rush-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ 
          display: 'inline-block', 
          width: 14, 
          height: 14, 
          borderRadius: '50%', 
          background: dotColor,
          boxShadow: `0 0 10px ${dotColor}`
        }} />
      </div>
      <div>
        <div className="rush-label">{cfg.label}</div>
        <div className="rush-sub">{cfg.sub}{crowdCount > 0 ? ` · ${crowdCount} people in queue` : ''}</div>
      </div>
      <div className="rush-controls">
        {['low', 'medium', 'heavy'].map(r => (
          <button
            key={r}
            className={`rush-btn ${r} ${level === r ? 'active' : ''}`}
            onClick={() => onUpdate(r)}
          >
            {r.charAt(0).toUpperCase() + r.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Main Dashboard ──────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [slots,     setSlots]     = useState([]);
  const [orders,    setOrders]    = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [rushLevel,   setRushLevel]   = useState('low');
  const [crowdCount,  setCrowdCount]  = useState(0);

  // Load rush state from localStorage (persists across reloads, synced by staff)
  useEffect(() => {
    const saved = localStorage.getItem('canteen_rush_level');
    const savedCount = localStorage.getItem('canteen_crowd_count');
    if (saved) setRushLevel(saved);
    if (savedCount) setCrowdCount(+savedCount);
  }, []);

  // Clock
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [a, s, o, staff] = await Promise.all([
        api.get('/analytics/'),
        api.get('/slots/'),
        api.get('/orders/all/').catch(() => api.get('/orders/')),
        api.get('/auth/users/').catch(() => ({ data: [] })),
      ]);
      setAnalytics(a.data);
      setSlots(s.data);
      setOrders(o.data);
      setStaffList(staff.data.filter(u => u.role === 'staff'));
    } catch {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRushUpdate = (level) => {
    setRushLevel(level);
    localStorage.setItem('canteen_rush_level', level);
    toast.success(`Rush level updated to ${level}`);
  };

  // Derived stats
  const summary = analytics?.summary || {};
  const today = new Date().toISOString().split('T')[0];

  const ordersToday   = orders.filter(o => o.created_at?.startsWith(today));
  const activePreorders = orders.filter(o => o.order_type === 'preorder' && ['confirmed','preparing'].includes(o.order_status)).length;
  const cancelledToday  = ordersToday.filter(o => o.order_status === 'cancelled').length;
  const pendingOrders   = orders.filter(o => o.order_status === 'pending').length;
  const presentStaff    = staffList.filter(s => s.is_present).length;
  const liveQueueCount  = orders.filter(o => ['confirmed','preparing'].includes(o.order_status)).length;

  // Slot utilization
  const activeSlots = slots.filter(s => s.slot_status === 'open');
  const totalCap    = activeSlots.reduce((acc, s) => acc + (s.max_orders || 0), 0);
  const usedCap     = activeSlots.reduce((acc, s) => acc + (s.current_orders || 0), 0);
  const utilPct     = totalCap > 0 ? Math.round((usedCap / totalCap) * 100) : 0;

  // Recent active orders for token board
  const activeOrders = orders
    .filter(o => ['confirmed','preparing','ready'].includes(o.order_status))
    .slice(0, 8);

  const statusColor = { confirmed: '#fb923c', preparing: '#a78bfa', ready: '#22c55e', delayed: '#ef4444' };

  if (loading) {
    return (
      <AdminLayout title="Dashboard">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 44, height: 44, border: '3px solid var(--teal)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 12px' }} />
            <p style={{ color: 'var(--text-3)', fontSize: '0.875rem' }}>Loading dashboard…</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* Welcome + Time */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.4px', marginBottom: 4 }}>
            Welcome back, {user?.name?.split(' ')[0] || 'Admin'}
          </h1>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-3)' }}>
            {currentTime.toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })}
            <span style={{ margin: '0 8px', opacity: 0.4 }}>•</span>
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>{currentTime.toLocaleTimeString()}</span>
          </p>
        </div>
        <button onClick={load} className="admin-btn admin-btn-ghost" style={{ gap: 6 }}>
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {/* ── Rush Indicator ── */}
      <RushIndicator
        level={rushLevel}
        crowdCount={crowdCount}
        onUpdate={handleRushUpdate}
      />

      {/* Heavy Rush Warning */}
      {rushLevel === 'heavy' && (
        <div className="slot-overload-banner" style={{ marginBottom: 24 }}>
          <AlertTriangle size={24} style={{ color: '#ef4444', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#ef4444' }}>
              Heavy Rush — Instant Pickup Recommended
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginTop: 2 }}>
              Kitchen is operating at high capacity. Preorder slots may be limited.
            </div>
          </div>
        </div>
      )}

      {/* ── 7 KPI Cards ── */}
      <div className="admin-kpi-grid">
        <KpiCard
          icon={Package}
          label="Total Orders Today"
          value={ordersToday.length}
          accent="#14D1B2"
          soft="rgba(20,209,178,0.1)"
          trend={5}
        />
        <KpiCard
          icon={Activity}
          label="Live Queue Count"
          value={liveQueueCount}
          accent="#fb923c"
          soft="rgba(251,146,60,0.1)"
          sub={rushLevel === 'heavy' ? '🔴 Heavy Rush' : rushLevel === 'medium' ? '🟡 Medium Rush' : '🟢 Low Rush'}
        />
        <KpiCard
          icon={Clock}
          label="Active Preorders"
          value={activePreorders}
          accent="#a78bfa"
          soft="rgba(167,139,250,0.1)"
        />
        <KpiCard
          icon={XCircle}
          label="Cancelled Orders"
          value={cancelledToday}
          accent="#ef4444"
          soft="rgba(239,68,68,0.1)"
          sub="Today"
        />
        <KpiCard
          icon={Timer}
          label="Pending Orders"
          value={pendingOrders}
          accent="#f59e0b"
          soft="rgba(245,158,11,0.1)"
        />
        <KpiCard
          icon={UserCheck}
          label="Staff Available"
          value={`${presentStaff} / ${staffList.length}`}
          accent="#22c55e"
          soft="rgba(34,197,94,0.1)"
          sub={presentStaff === 0 ? 'No staff present' : `${staffList.length - presentStaff} absent`}
        />
        <KpiCard
          icon={BarChart2}
          label="Slot Utilization"
          value={`${utilPct}%`}
          accent="#38bdf8"
          soft="rgba(56,189,248,0.1)"
          util={utilPct}
          sub={`${usedCap} / ${totalCap} orders`}
        />
      </div>

      {/* ── Bottom Row: Queue Overview + Live Token Board ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>

        {/* Queue Overview */}
        <div className="admin-card">
          <div className="admin-section-title" style={{ marginBottom: 20 }}>
            Queue Overview
            <span className="admin-live-dot" style={{ marginLeft: 10 }}>Live</span>
          </div>
          {[
            { label: 'Queue Load',       value: rushLevel.toUpperCase(), color: rushLevel === 'heavy' ? '#ef4444' : rushLevel === 'medium' ? '#eab308' : '#22c55e' },
            { label: 'In Preparation',   value: orders.filter(o => o.order_status === 'preparing').length,  color: '#a78bfa' },
            { label: 'Ready for Pickup', value: orders.filter(o => o.order_status === 'ready').length,     color: '#22c55e' },
            { label: 'Pending Approval', value: pendingOrders,                                             color: '#38bdf8' },
            { label: 'Completed Today',  value: ordersToday.filter(o => o.order_status === 'completed').length, color: '#14D1B2' },
          ].map((row, i, arr) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <span style={{ fontSize: '0.83rem', color: 'var(--text-2)' }}>{row.label}</span>
              <span style={{ fontSize: '1rem', fontWeight: 800, color: row.color }}>{row.value}</span>
            </div>
          ))}
        </div>

        {/* Live Token Board */}
        <div className="admin-card" style={{ gridColumn: activeOrders.length > 0 ? 'span 2' : 'auto' }}>
          <div className="admin-section-title" style={{ marginBottom: 20 }}>
            🎟️ Live Queue Tokens
          </div>
          {activeOrders.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
              {activeOrders.map(order => {
                const st = order.order_status;
                const color = statusColor[st] || '#14D1B2';
                return (
                  <div
                    key={order.id}
                    className={`token-card ${st}`}
                    style={{ padding: '16px 10px' }}
                  >
                    <div className={`token-number ${st}`}>{order.token_number}</div>
                    <div className="token-type">{order.order_type}</div>
                    <div className={`token-status-label ${st}`}>{st.toUpperCase()}</div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="admin-empty">
              <ChefHat size={32} color="var(--text-3)" style={{ marginBottom: 8, opacity: 0.5 }} />
              <p>Kitchen queue is empty</p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="admin-card">
          <div className="admin-section-title" style={{ marginBottom: 16 }}>Quick Actions</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'View All Orders',     path: '/admin/orders' },
              { label: 'Manage Food Menu',    path: '/admin/menu' },
              { label: 'Manage Slots',        path: '/admin/slots' },
              { label: 'Manage Staff',       path: '/admin/staff' },
              { label: 'View Analytics',      path: '/admin/analytics' },
              { label: 'View Feedback',       path: '/admin/feedback' },
            ].map((qa, i) => (
              <a
                key={i}
                href={qa.path}
                onClick={e => { e.preventDefault(); window.location.href = qa.path; }}
                className="admin-btn admin-btn-ghost"
                style={{ justifyContent: 'flex-start', fontSize: '0.83rem', padding: '9px 14px' }}
              >
                {qa.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
