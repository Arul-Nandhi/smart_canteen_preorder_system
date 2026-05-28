import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, Package, Clock, CheckCircle, AlertTriangle, ArrowRight, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import StaffLayout from '../components/StaffLayout';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function StaffDashboard() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [queueStatus, setQueueStatus] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [ordersRes, queueRes] = await Promise.all([
        api.get('/orders/').catch(() => ({ data: [] })),
        api.get('/queue/status/').catch(() => ({ data: null })),
      ]);
      setOrders(ordersRes.data);
      setQueueStatus(queueRes.data);
    } catch {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t1 = setInterval(load, 8000);
    const t2 = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => { clearInterval(t1); clearInterval(t2); };
  }, [load]);

  const active    = orders.filter(o => ['confirmed', 'preparing', 'ready'].includes(o.order_status)).length;
  const preparing = orders.filter(o => o.order_status === 'preparing').length;
  const ready     = orders.filter(o => o.order_status === 'ready').length;
  const pending   = orders.filter(o => o.order_status === 'pending').length;
  const undelivered = orders.filter(o => ['pending', 'confirmed', 'preparing', 'ready'].includes(o.order_status)).length;

  const traffic = queueStatus?.overloaded
    ? 'red'
    : active > 5
    ? 'yellow'
    : 'green';

  const trafficLabel = traffic === 'red' ? 'Overloaded' : traffic === 'yellow' ? 'Moderate' : 'Smooth';

  if (loading) {
    return (
      <StaffLayout title="Dashboard" subtitle="Overview of live kitchen activity">
        <div className="dash-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 48, height: 48, border: '4px solid var(--teal)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 16px' }} />
            <p style={{ color: 'var(--text-3)' }}>Loading dashboard...</p>
          </div>
        </div>
      </StaffLayout>
    );
  }

  return (
    <StaffLayout title="Dashboard" subtitle="Overview of live kitchen activity">
      <div className="dash-page">
        {/* Welcome Header */}
        <div className="dash-welcome">
          <div>
            <h1>Welcome, {user?.name?.split(' ')[0] || 'Staff'}!</h1>
            <div className="dash-welcome-meta">
              <span>{currentTime.toLocaleTimeString()}</span>
              <span>{currentTime.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
            </div>
          </div>
          <button
            onClick={load}
            className="dash-btn dash-btn-ghost"
            title="Refresh dashboard"
          >
            <RefreshCw size={18} /> Refresh
          </button>
        </div>

        {/* SHIFT ATTENDANCE TRACKER */}
        <div style={{
          background: user?.is_present ? 'rgba(34,197,94,0.06)' : 'rgba(234,179,8,0.06)',
          border: `1px solid ${user?.is_present ? 'rgba(34,197,94,0.25)' : 'rgba(234,179,8,0.25)'}`,
          padding: '16px 20px',
          borderRadius: 12,
          marginBottom: 20,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 10, height: 10, borderRadius: '50%',
              background: user?.is_present ? '#22c55e' : '#eab308',
              boxShadow: `0 0 10px ${user?.is_present ? '#22c55e' : '#eab308'}`
            }} />
            <div>
              <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 800, color: user?.is_present ? '#22c55e' : '#eab308', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Shift Status: {user?.is_present ? 'Present & Checked In' : 'Checked Out'}
              </p>
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-3)' }}>
                {user?.is_present ? 'Your active shift attendance is marked present today. Canteen operations are online.' : 'Your shift is currently inactive. Click to check in and register attendance today.'}
              </p>
            </div>
          </div>

          <button
            onClick={async () => {
              try {
                const nextState = !user?.is_present;
                await api.patch('/auth/profile/', { is_present: nextState });
                updateUser({ ...user, is_present: nextState });
                toast.success(nextState ? 'Successfully Checked In for Shift!' : 'Successfully Checked Out from Shift!');
                load();
              } catch {
                toast.error('Failed to update shift attendance status');
              }
            }}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              fontSize: '0.82rem',
              fontWeight: 800,
              cursor: 'pointer',
              border: 'none',
              background: user?.is_present ? 'rgba(239,68,68,0.15)' : 'linear-gradient(135deg, #14D1B2, #0fa88e)',
              color: user?.is_present ? '#ef4444' : '#0B1A18',
              transition: 'all 0.2s',
              boxShadow: user?.is_present ? 'none' : '0 4px 12px rgba(20,209,178,0.2)'
            }}
          >
            {user?.is_present ? 'Check Out Shift' : 'Check In Shift'}
          </button>
        </div>

        {/* Live Queue Status Banner */}
        <div className="dash-panel" style={{ marginBottom: 'var(--sp-8)', background: 'var(--surface-2)', borderColor: traffic === 'red' ? 'rgba(239,68,68,0.4)' : traffic === 'yellow' ? 'rgba(234,179,8,0.3)' : 'rgba(34,197,94,0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--sp-4)' }}>
            <div>
              <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Live Kitchen Status</p>
              <div className={`dash-traffic ${traffic}`}>
                <span className={`dash-traffic-dot ${traffic}`} />
                {trafficLabel}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 'var(--sp-4)', flexWrap: 'wrap' }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginBottom: 2 }}>Pending Acceptance</p>
                <p style={{ fontSize: '1.4rem', fontWeight: 800, color: '#eab308' }}>{pending}</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginBottom: 2 }}>Preparing</p>
                <p style={{ fontSize: '1.4rem', fontWeight: 800, color: '#38bdf8' }}>{preparing}</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginBottom: 2 }}>Ready</p>
                <p style={{ fontSize: '1.4rem', fontWeight: 800, color: '#22c55e' }}>{ready}</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginBottom: 2 }}>Est. Wait</p>
                <p style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--teal)' }}>{queueStatus?.estimated_wait_mins ?? 0}m</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <h2 className="dash-section-title">Today's Overview</h2>
        <div className="dash-stat-grid-4" style={{ marginBottom: 'var(--sp-8)' }}>
          <div className="dash-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', marginBottom: 'var(--sp-3)' }}>
              <div style={{ width: 40, height: 40, borderRadius: 'var(--r-sm)', background: 'rgba(14,165,233,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>
                <Package size={20} />
              </div>
              <p className="dash-stat-label" style={{ marginBottom: 0 }}>Active Prep Queue</p>
            </div>
            <p className="dash-stat-value" style={{ color: '#38bdf8' }}>{preparing + ready}</p>
          </div>
          <div className="dash-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', marginBottom: 'var(--sp-3)' }}>
              <div style={{ width: 40, height: 40, borderRadius: 'var(--r-sm)', background: 'rgba(234,179,8,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#eab308' }}>
                <Clock size={20} />
              </div>
              <p className="dash-stat-label" style={{ marginBottom: 0 }}>Pending Delivery</p>
            </div>
            <p className="dash-stat-value" style={{ color: '#eab308' }}>{undelivered}</p>
          </div>
          <div className="dash-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', marginBottom: 'var(--sp-3)' }}>
              <div style={{ width: 40, height: 40, borderRadius: 'var(--r-sm)', background: 'rgba(34,197,94,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#22c55e' }}>
                <CheckCircle size={20} />
              </div>
              <p className="dash-stat-label" style={{ marginBottom: 0 }}>Ready to Pick</p>
            </div>
            <p className="dash-stat-value" style={{ color: '#22c55e' }}>{ready}</p>
          </div>
          <div className="dash-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', marginBottom: 'var(--sp-3)' }}>
              <div style={{ width: 40, height: 40, borderRadius: 'var(--r-sm)', background: queueStatus?.overloaded ? 'rgba(239,68,68,0.12)' : 'rgba(20,209,178,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: queueStatus?.overloaded ? '#ef4444' : 'var(--teal)' }}>
                <AlertTriangle size={20} />
              </div>
              <p className="dash-stat-label" style={{ marginBottom: 0 }}>Kitchen Load</p>
            </div>
            <div className={`dash-traffic ${traffic}`} style={{ fontSize: '1.3rem' }}>
              <span className={`dash-traffic-dot ${traffic}`} />
              {trafficLabel}
            </div>
          </div>
        </div>

        {/* STAFF OPERATIONS MODULES */}
        <h2 className="dash-section-title">Operations Modules</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--sp-5)', marginBottom: 'var(--sp-8)' }}>
          {[
            {
              title: 'Order Management',
              description: 'Accept, prepare, and complete orders. Manage payments.',
              icon: <Package size={28} color="#38bdf8" />,
              color: '#38bdf8',
              onClick: () => navigate('/staff/operations'),
              badge: `${active} Active`
            },
            {
              title: 'Queue Monitor',
              description: 'Real-time queue status and rush level updates.',
              icon: <Activity size={28} color="#eab308" />,
              color: '#eab308',
              onClick: () => navigate('/staff/queue'),
              badge: trafficLabel
            },
            {
              title: 'Slot Manager',
              description: 'Track pickup slots and capacity utilization.',
              icon: <Clock size={28} color="#a78bfa" />,
              color: '#a78bfa',
              onClick: () => navigate('/staff/slots'),
              badge: `${orders.filter(o => o.order_type === 'preorder').length} Preorders`
            },
          ].map((module, idx) => (
            <button
              key={idx}
              onClick={module.onClick}
              style={{
                padding: 'var(--sp-5)',
                borderRadius: 'var(--r-lg)',
                border: '1px solid var(--border)',
                background: 'var(--surface-2)',
                cursor: 'pointer',
                transition: 'all 0.3s',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'var(--surface-3)';
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.2)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'var(--surface-2)';
                e.currentTarget.style.transform = '';
                e.currentTarget.style.boxShadow = '';
              }}
            >
              <div>
                <div style={{ marginBottom: 'var(--sp-3)' }}>
                  {module.icon}
                </div>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-1)', margin: '0 0 var(--sp-2)' }}>
                  {module.title}
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-3)', margin: 0, lineHeight: 1.4 }}>
                  {module.description}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'var(--sp-3)' }}>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  background: `${module.color}20`,
                  color: module.color,
                  padding: '4px 10px',
                  borderRadius: 4,
                  textTransform: 'uppercase'
                }}>
                  {module.badge}
                </span>
                <ArrowRight size={16} style={{ color: 'var(--teal)' }} />
              </div>
            </button>
          ))}
        </div>

        {/* Recent Orders in Queue */}
        <h2 className="dash-section-title">Active Kitchen Queue</h2>
        {orders.filter(o => ['pending', 'confirmed', 'preparing', 'ready'].includes(o.order_status)).length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--sp-4)' }}>
            {orders
              .filter(o => ['pending', 'confirmed', 'preparing', 'ready'].includes(o.order_status))
              .slice(0, 8)
              .map(order => {
                const statusColor = {
                  pending: '#eab308', confirmed: '#38bdf8', preparing: '#a78bfa', ready: '#22c55e'
                }[order.order_status] || 'var(--text-2)';
                return (
                  <div key={order.id} className="dash-card" style={{ borderLeft: `3px solid ${statusColor}` }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--sp-3)' }}>
                      <div>
                        <p style={{ fontWeight: 700, color: 'var(--text-1)', fontSize: '0.95rem' }}>Order #{order.id}</p>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginTop: 2 }}>{order.user?.name || 'Customer'}</p>
                      </div>
                      <span className={`dash-badge ${order.order_status === 'ready' ? 'green' : order.order_status === 'preparing' ? 'purple' : order.order_status === 'pending' ? 'yellow' : 'blue'}`}>
                        {order.order_status}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-3)' }}>
                      <span>{order.items?.length || 0} item(s)</span>
                      <span style={{ fontWeight: 700, color: 'var(--teal)' }}>₹{order.total_amount}</span>
                    </div>
                  </div>
                );
              })}
          </div>
        ) : (
          <div className="dash-empty">
            <CheckCircle size={40} color="var(--teal)" style={{ marginBottom: 12 }} />
            <p>No active orders. Kitchen is clear!</p>
          </div>
        )}
      </div>
    </StaffLayout>
  );
}
