import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, Clock, User, Package, Play, Check, ShoppingBag, XCircle, Lock } from 'lucide-react';
import StaffLayout from '../../components/StaffLayout';
import api from '../../services/api';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = ['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'];

const STATUS_STYLE = {
  pending:   { badge: 'yellow', border: '#eab308', soft: 'rgba(234, 179, 8, 0.05)' },
  confirmed: { badge: 'blue',   border: '#38bdf8', soft: 'rgba(56, 189, 248, 0.05)' },
  preparing: { badge: 'purple', border: '#a78bfa', soft: 'rgba(167, 139, 250, 0.05)' },
  ready:     { badge: 'green',  border: '#22c55e', soft: 'rgba(34, 197, 94, 0.05)' },
  completed: { badge: 'teal',   border: 'var(--teal)', soft: 'rgba(20, 209, 178, 0.05)' },
  cancelled: { badge: 'red',    border: '#ef4444', soft: 'rgba(239, 68, 68, 0.05)' },
};



export default function StaffOrdersPage() {
  const [orders, setOrders]   = useState([]);
  const [filter, setFilter]   = useState('all');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/orders/all/').catch(() => api.get('/queue/kitchen/'));
      // Sort by creation date descending to keep fresh ones accessible, but confirmed/preparing prioritized
      const sorted = res.data.sort((a, b) => {
        const priority = { pending: 4, confirmed: 3, preparing: 2, ready: 1, completed: 5, cancelled: 6 };
        return (priority[a.order_status] || 99) - (priority[b.order_status] || 99);
      });
      setOrders(sorted);
    } catch {
      toast.error('Failed to load active kitchen queue');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
  }, [load]);

  const updateStatus = async (orderId, newStatus) => {
    try {
      await api.patch(`/orders/${orderId}/`, { order_status: newStatus });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, order_status: newStatus } : o));
      toast.success(`Order status updated to ${newStatus.toUpperCase()}`);
      load();
    } catch {
      toast.error('Failed to update order status');
    }
  };



  const filtered = filter === 'all' ? orders : orders.filter(o => o.order_status === filter);

  return (
    <StaffLayout title="Kitchen Desk" subtitle="Live preparation queue monitor and item checkouts">
      <div className="dash-page">

        {/* Header */}
        <div className="dash-welcome" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-1)', margin: '0 0 6px 0' }}>Kitchen Order Desk</h1>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <span className="dash-badge teal" style={{ fontSize: '0.72rem', padding: '3px 8px' }}>
                {orders.filter(o => ['confirmed', 'preparing', 'ready'].includes(o.order_status)).length} Active Queued
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>Auto-refreshes every 8s</span>
            </div>
          </div>
          <button onClick={load} className="dash-btn dash-btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <RefreshCw size={14} className={loading ? 'spin' : ''} /> Sync Board
          </button>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 28 }}>
          {['all', ...STATUS_OPTIONS].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`dash-btn ${filter === s ? 'dash-btn-primary' : 'dash-btn-ghost'}`}
              style={{ height: 34, fontSize: '0.78rem', padding: '0 14px', textTransform: 'capitalize', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              {s}
              <span style={{ 
                background: filter === s ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)', 
                color: filter === s ? 'var(--text-1)' : 'var(--text-3)',
                padding: '1px 6px', 
                borderRadius: 999, 
                fontSize: '0.7rem', 
                fontWeight: 700 
              }}>
                {s === 'all' ? orders.length : orders.filter(o => o.order_status === s).length}
              </span>
            </button>
          ))}
        </div>

        {/* Orders Grid */}
        {loading ? (
          <div className="dash-empty" style={{ display: 'flex', flexDirection: 'column', padding: 60, alignItems: 'center' }}>
            <div style={{ width: 36, height: 36, border: '3px solid var(--teal)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="dash-empty" style={{ padding: '80px 20px', textAlign: 'center', border: '1.5px dashed var(--border)', borderRadius: 16 }}>

            <h3 style={{ margin: '0 0 6px 0', fontSize: '1rem', color: 'var(--text-2)' }}>No orders in this station</h3>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-3)' }}>When orders arrive, they will list here instantly.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
            {filtered.map(order => {
              const s = STATUS_STYLE[order.order_status] || { badge: 'blue', border: '#38bdf8', soft: 'rgba(56, 189, 248, 0.05)' };
              const totalAmt = parseFloat(order.total_amount || 0);
              const isCashPending = order.payment?.payment_method === 'cash' && order.payment?.payment_status === 'pending';
              const isLockedByBilling = order.order_status === 'ready' && isCashPending;

              // Define Quick Action State Flow
              let quickAction = null;
              if (order.order_status === 'pending') {
                quickAction = {
                  label: 'Accept & Confirm',
                  icon: <Check size={14} />,
                  color: '#38bdf8',
                  action: () => updateStatus(order.id, 'confirmed')
                };
              } else if (order.order_status === 'confirmed') {
                quickAction = {
                  label: 'Start Preparing',
                  icon: <Play size={14} />,
                  color: '#fb923c',
                  action: () => updateStatus(order.id, 'preparing')
                };
              } else if (order.order_status === 'preparing') {
                quickAction = {
                  label: 'Mark Ready for Pickup',
                  icon: <Check size={14} />,
                  color: '#22c55e',
                  action: () => updateStatus(order.id, 'ready')
                };
              } else if (order.order_status === 'ready') {
                const isCashPending = order.payment?.payment_method === 'cash' && order.payment?.payment_status === 'pending';
                if (isCashPending) {
                  quickAction = null;
                } else {
                  quickAction = {
                    label: 'Mark Collected',
                    icon: <ShoppingBag size={14} />,
                    color: 'var(--teal)',
                    action: () => updateStatus(order.id, 'completed')
                  };
                }
              }

              return (
                <div 
                  key={order.id} 
                  className="dash-card" 
                  style={{ 
                    borderTop: `4px solid ${s.border}`, 
                    background: s.soft, 
                    position: 'relative', 
                    padding: 20,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: 250
                  }}
                >
                  {/* Card Header */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: 900, color: 'var(--lime-main)', fontSize: '1.75rem', fontFamily: 'monospace', letterSpacing: '-0.5px' }}>
                            #{order.token_number}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-3)', background: 'var(--surface-3)', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>
                            {order.order_type.toUpperCase()}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, color: 'var(--text-2)', fontSize: '0.8rem', fontWeight: 600 }}>
                          <User size={13} style={{ color: 'var(--text-3)' }} />
                          <span>{order.user?.name || `User #${order.user}`}</span>
                        </div>
                        {['pending', 'confirmed', 'preparing'].includes(order.order_status) && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--teal)', fontWeight: 700, marginTop: 4 }}>
                            ⏱ Est. Ready: {(() => {
                              const d = new Date(order.created_at);
                              d.setMinutes(d.getMinutes() + (order.estimated_wait || 0));
                              return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                            })()}
                          </div>
                        )}
                      </div>
                      <span className={`dash-badge ${s.badge}`} style={{ textTransform: 'uppercase', fontSize: '0.65rem', fontWeight: 800, padding: '3px 8px' }}>
                        {order.order_status}
                      </span>
                    </div>

                    {/* Order Items */}
                    <div style={{ borderTop: '1px dashed var(--border)', borderBottom: '1px dashed var(--border)', padding: '10px 0', marginBottom: 16 }}>
                      {order.items?.map((item, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.83rem', padding: '3px 0' }}>
                          <span style={{ color: 'var(--text-1)', fontWeight: 600 }}>{item.item_detail?.item_name || 'Canteen Special'}</span>
                          <span style={{ color: 'var(--text-3)', fontWeight: 700 }}>×{item.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions Area */}
                  <div>
                    {/* Timestamp & Price */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-3)', marginBottom: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={12} />
                        <span>{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <span style={{ fontWeight: 800, color: 'var(--lime-bright)', fontSize: '0.9rem' }}>₹{totalAmt.toFixed(2)}</span>
                    </div>

                    {/* Quick Button vs Regular Override Dropdown */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {quickAction ? (
                        <button
                          onClick={quickAction.action}
                          className="dash-btn"
                          style={{
                            width: '100%',
                            height: 38,
                            background: quickAction.color,
                            color: '#000',
                            fontWeight: 800,
                            fontSize: '0.82rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                            borderRadius: 'var(--r-sm)',
                            border: 'none',
                            cursor: 'pointer',
                            boxShadow: `0 4px 10px ${quickAction.color}25`,
                            transition: 'transform 0.1s'
                          }}
                        >
                          {quickAction.icon}
                          {quickAction.label}
                        </button>
                      ) : null}

                      {/* Manual override or static finalized indicator */}
                      {isLockedByBilling ? (
                        <div style={{
                          textAlign: 'center',
                          padding: '8px 12px',
                          background: 'rgba(249,115,22,0.06)',
                          border: '1px solid rgba(249,115,22,0.2)',
                          borderRadius: '8px',
                          fontSize: '0.8rem',
                          color: '#f97316',
                          fontWeight: 800,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          width: '100%'
                        }}>
                          <Lock size={12} /> AWAITING COUNTER BILLING
                        </div>
                      ) : order.order_status !== 'completed' && order.order_status !== 'cancelled' ? (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <select
                            value={order.order_status}
                            onChange={e => updateStatus(order.id, e.target.value)}
                            style={{
                              flex: 1,
                              height: 32,
                              borderRadius: 'var(--r-sm)',
                              background: 'var(--surface-3)',
                              border: '1px solid var(--border)',
                              color: 'var(--text-2)',
                              fontSize: '0.75rem',
                              padding: '0 8px',
                              cursor: 'pointer',
                              outline: 'none',
                            }}
                          >
                            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>

                          <button
                            onClick={() => updateStatus(order.id, 'cancelled')}
                            className="dash-btn dash-btn-ghost"
                            style={{ 
                              height: 32, 
                              width: 32, 
                              padding: 0, 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center', 
                              borderColor: 'rgba(239, 68, 68, 0.2)',
                              color: '#ef4444' 
                            }}
                            title="Cancel Order"
                          >
                            <XCircle size={14} />
                          </button>
                        </div>
                      ) : (
                        <div style={{
                          textAlign: 'center',
                          padding: '8px 12px',
                          background: 'rgba(255,255,255,0.02)',
                          border: '1px solid rgba(255,255,255,0.05)',
                          borderRadius: '8px',
                          fontSize: '0.8rem',
                          color: order.order_status === 'completed' ? 'var(--teal)' : '#ef4444',
                          fontWeight: 800,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          width: '100%'
                        }}>
                          <Lock size={12} /> ORDER {order.order_status.toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>



    </StaffLayout>
  );
}
