import { useEffect, useState, useCallback } from 'react';
import { 
  RefreshCw, Clock, CheckCircle, AlertTriangle, Trash2, Eye, Zap, 
  ChefHat, Activity, TrendingUp, Users, Package, ArrowRight, XCircle 
} from 'lucide-react';
import StaffLayout from '../../components/StaffLayout';
import api from '../../services/api';
import toast from 'react-hot-toast';

/**
 * ────────────────────────────────────────────────────────────────────
 * STAFF OPERATIONS PANEL — Complete Order Management & Billing System
 * ────────────────────────────────────────────────────────────────────
 */

/* Status workflow: pending → confirmed → preparing → ready → completed */
const STATUS_COLORS = {
  pending: { bg: '#eab30811', color: '#eab308', label: 'Pending Acceptance', priority: 1 },
  confirmed: { bg: '#38bdf811', color: '#38bdf8', label: 'Accepted', priority: 2 },
  preparing: { bg: '#a78bfa11', color: '#a78bfa', label: 'Preparing', priority: 3 },
  ready: { bg: '#22c55e11', color: '#22c55e', label: 'Ready', priority: 4 },
  completed: { bg: '#1f2937', color: '#6b7280', label: 'Delivered', priority: 5 },
  cancelled: { bg: '#ef444411', color: '#ef4444', label: 'Cancelled', priority: 6 },
};

const RUSH_LEVELS = [
  { level: 'low', label: 'Low Rush', description: 'Smooth operations', color: '#22c55e', bgColor: 'rgba(34,197,94,0.1)' },
  { level: 'medium', label: 'Medium Rush', description: 'Moderate load', color: '#eab308', bgColor: 'rgba(234,179,8,0.1)' },
  { level: 'heavy', label: 'Heavy Rush', description: 'Peak traffic alert', color: '#ef4444', bgColor: 'rgba(239,68,68,0.1)' },
];

/**
 * ORDER WORKFLOW ACTIONS
 */
const getAvailableActions = (status) => {
  const workflows = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['preparing', 'cancelled'],
    preparing: ['ready', 'cancelled'],
    ready: ['completed', 'cancelled'],
    completed: [],
    cancelled: [],
  };
  return workflows[status] || [];
};

/**
 * CASH BILLING MODAL
 */
function BillingModal({ order, onConfirm, onClose }) {
  const total = parseFloat(order.total_amount || 0);
  const [paymentMethod, setPaymentMethod] = useState('cash'); // 'cash' or 'upi'
  const [receivedAmount, setReceivedAmount] = useState(total);
  const [notes, setNotes] = useState('');
  const [upiConfirmed, setUpiConfirmed] = useState(false);
  
  const change = parseFloat(receivedAmount || 0) - total;
  const isValid = paymentMethod === 'cash' 
    ? parseFloat(receivedAmount || 0) >= total 
    : upiConfirmed;

  const mockUpiId = "smartcanteen@okaxis";
  const upiUri = `upi://pay?pa=${mockUpiId}&pn=SmartCanteen&am=${total.toFixed(2)}&cu=INR&tn=Token_${order.token_number}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(upiUri)}`;

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16
    }}>
      <div onClick={e => e.stopPropagation()} className="admin-card" style={{ width: '100%', maxWidth: 420, padding: 24, maxHeight: '90vh', overflowY: 'auto', borderRadius: 12 }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '0 0 16px', color: 'var(--text-1)' }}>
          Complete Counter Payment
        </h2>

        {/* Payment Method Selector */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          {['cash', 'upi'].map(method => (
            <button
              key={method}
              type="button"
              onClick={() => {
                setPaymentMethod(method);
                if (method === 'upi') setReceivedAmount(total);
              }}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 8,
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                border: '1px solid var(--border)',
                background: paymentMethod === method ? 'var(--teal-soft)' : 'var(--surface-3)',
                color: paymentMethod === method ? 'var(--teal)' : 'var(--text-2)',
                borderColor: paymentMethod === method ? 'var(--teal)' : 'var(--border)',
                transition: 'all 0.15s'
              }}
            >
              {method === 'cash' ? 'Cash Payment' : 'UPI / QR Scan'}
            </button>
          ))}
        </div>

        {/* Bill Summary */}
        <div style={{ background: 'var(--surface-2)', padding: 16, borderRadius: 12, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: '0.9rem' }}>
            <span style={{ color: 'var(--text-3)' }}>Order ID:</span>
            <span style={{ fontWeight: 700, color: 'var(--text-1)' }}>#{order.id}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: '0.9rem' }}>
            <span style={{ color: 'var(--text-3)' }}>Items Count:</span>
            <span style={{ fontWeight: 700, color: 'var(--text-1)' }}>{order.items?.length || 0}</span>
          </div>
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem' }}>
            <span style={{ color: 'var(--text-2)' }}>Total Amount:</span>
            <span style={{ fontWeight: 900, color: 'var(--teal)' }}>₹{total.toFixed(2)}</span>
          </div>
        </div>

        {/* Payment Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
          {paymentMethod === 'cash' ? (
            <>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                  Amount Received
                </label>
                <input
                  type="number"
                  value={receivedAmount}
                  onChange={e => setReceivedAmount(e.target.value)}
                  className="admin-input"
                  style={{ fontSize: '1.1rem', fontWeight: 700 }}
                />
              </div>

              {/* Change calculation */}
              <div style={{
                background: change >= 0 ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                border: `1px solid ${change >= 0 ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                padding: 12, borderRadius: 10,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-2)' }}>Change:</span>
                <span style={{
                  fontSize: '1.2rem', fontWeight: 900,
                  color: change >= 0 ? '#22c55e' : '#ef4444'
                }}>
                  ₹{change.toFixed(2)}
                </span>
              </div>
            </>
          ) : (
            <div style={{ 
              padding: 16, 
              background: 'rgba(20,209,178,0.06)', 
              border: '1px solid rgba(20,209,178,0.2)', 
              borderRadius: 10, 
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 10
            }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-3)', fontWeight: 600 }}>
                SCAN TO PAY USING ANY UPI APP
              </span>
              
              <div style={{ 
                background: '#FFFFFF', 
                padding: 10, 
                borderRadius: 8, 
                display: 'inline-flex',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
              }}>
                <img 
                  src={qrCodeUrl} 
                  alt="UPI QR Code" 
                  style={{ width: 140, height: 140, display: 'block' }}
                />
              </div>

              <div style={{ fontSize: '0.82rem', color: 'var(--teal)', fontWeight: 700, marginTop: 4 }}>
                UPI ID: <code style={{ background: 'var(--surface-3)', padding: '2px 6px', borderRadius: 4, fontFamily: 'monospace' }}>{mockUpiId}</code>
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-1)', fontWeight: 800 }}>
                Amount: ₹{total.toFixed(2)}
              </div>
              
              {/* Checkbox for manual confirmation */}
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 8, 
                marginTop: 8, 
                padding: '8px 12px',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: 6,
                border: '1px solid rgba(255,255,255,0.05)',
                cursor: 'pointer',
                width: '100%',
                boxSizing: 'border-box',
                textAlign: 'left'
              }}>
                <input 
                  type="checkbox" 
                  checked={upiConfirmed} 
                  onChange={e => setUpiConfirmed(e.target.checked)}
                  style={{ width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--teal)' }}
                />
                <span style={{ fontSize: '0.78rem', color: 'var(--text-2)', fontWeight: 600 }}>
                  Confirm Payment Received (Manually OK)
                </span>
              </label>
            </div>
          )}

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
              Billing Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="admin-input"
              placeholder="Special notes for this payment..."
              style={{ height: 60, resize: 'none' }}
            />
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => onConfirm(paymentMethod === 'upi' ? total : receivedAmount, notes, paymentMethod)}
            disabled={!isValid}
            style={{
              flex: 1, padding: '12px 16px', borderRadius: 10, fontWeight: 800,
              border: 'none', cursor: isValid ? 'pointer' : 'not-allowed',
              background: isValid ? 'linear-gradient(135deg, #14D1B2, #0fa88e)' : 'var(--surface-3)',
              color: isValid ? '#0B1A18' : 'var(--text-3)',
              opacity: isValid ? 1 : 0.5, transition: 'all 0.2s'
            }}
          >
            {paymentMethod === 'upi' ? 'Manually Confirm Paid (OK)' : 'Confirm Cash Payment'}
          </button>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: '12px 16px', borderRadius: 10, fontWeight: 800,
              border: '1px solid var(--border)', cursor: 'pointer',
              background: 'transparent', color: 'var(--text-2)', transition: 'all 0.2s'
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * ORDER STATUS ACTION BUTTONS
 */
function OrderActions({ order, onStatusChange, onDelete, onBilling, loading }) {
  const actions = getAvailableActions(order.order_status);
  const canDoBilling = ['ready', 'completed'].includes(order.order_status) && order.payment?.payment_method === 'cash' && order.payment?.payment_status === 'pending';

  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end', alignItems: 'center' }}>
      {/* Status transition buttons */}
      {actions.map(nextStatus => (
        <button
          key={nextStatus}
          onClick={() => onStatusChange(order.id, nextStatus)}
          disabled={loading}
          style={{
            padding: '6px 10px', fontSize: '0.72rem', fontWeight: 700,
            borderRadius: 8, border: 'none', cursor: 'pointer',
            background: nextStatus === 'cancelled' 
              ? 'rgba(239,68,68,0.15)' 
              : 'rgba(20,209,178,0.15)',
            color: nextStatus === 'cancelled' ? '#ef4444' : 'var(--teal)',
            transition: 'all 0.2s', opacity: loading ? 0.5 : 1
          }}
        >
          {nextStatus === 'confirmed' && 'Accept'}
          {nextStatus === 'preparing' && 'Prep'}
          {nextStatus === 'ready' && 'Ready'}
          {nextStatus === 'completed' && 'Deliver'}
          {nextStatus === 'cancelled' && 'Cancel'}
        </button>
      ))}

      {/* Billing button for cash payments */}
      {canDoBilling && (
        <button
          onClick={() => onBilling(order)}
          style={{
            padding: '6px 10px', fontSize: '0.72rem', fontWeight: 700,
            borderRadius: 8, border: 'none', cursor: 'pointer',
            background: 'rgba(249,115,22,0.15)', color: '#f97316',
            transition: 'all 0.2s'
          }}
          title="Complete cash payment"
        >
          Bill &amp; Complete
        </button>
      )}

      {/* Delete for cancelled/completed */}
      {['completed', 'cancelled'].includes(order.order_status) && (
        <button
          onClick={() => onDelete(order.id)}
          style={{
            padding: '6px 10px', fontSize: '0.72rem', fontWeight: 700,
            borderRadius: 8, border: 'none', cursor: 'pointer',
            background: 'rgba(239,68,68,0.15)', color: '#ef4444',
            transition: 'all 0.2s'
          }}
          title="Archive order"
        >
          Archive
        </button>
      )}
    </div>
  );
}

/**
 * MAIN STAFF OPERATIONS COMPONENT
 */
export default function StaffOperations() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'workflow' | 'metrics' | 'history'
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [search, setSearch] = useState('');
  const [billingOrder, setBillingOrder] = useState(null);
  const [menuItems, setMenuItems] = useState([]);

  useEffect(() => {
    api.get('/menu/').then(r => setMenuItems(r.data)).catch(() => {});
  }, []);

  const getComboConstituentsText = (comboItemIds) => {
    if (!comboItemIds) return '';
    let ids = [];
    try {
      ids = typeof comboItemIds === 'string' ? JSON.parse(comboItemIds) : comboItemIds;
    } catch {
      return '';
    }
    if (!Array.isArray(ids)) return '';
    return ids.map(id => menuItems.find(i => i.id === id)?.item_name).filter(Boolean).join(' + ');
  };

  // Live rush level & stats
  const [rushLevel, setRushLevel] = useState('medium');
  const [rushUpdating, setRushUpdating] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date().toLocaleTimeString());

  const load = useCallback(async () => {
    try {
      const [ordersRes, queueRes] = await Promise.all([
        api.get('/orders/'),
        api.get('/queue/status/').catch(() => ({ data: null }))
      ]);
      setOrders(ordersRes.data);
      if (queueRes?.data?.rush_level) {
        setRushLevel(queueRes.data.rush_level);
      }
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      toast.error('Failed to load operations data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh every 6 seconds
  useEffect(() => {
    load();
    const timer = setInterval(load, 6000);
    // WebSocket connection for real-time updates
    let ws;
    try {
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const apiHost = apiBase.replace(/^https?:\/\//, '');
      const wsProtocol = apiBase.startsWith('https') ? 'wss' : 'ws';
      ws = new WebSocket(`${wsProtocol}://${apiHost}/ws/staff/`);
      ws.onmessage = e => {
        try {
          const m = JSON.parse(e.data);
          if (m.type === 'order_update' || m.type === 'notification') {
            load(); // refresh orders on any update
          }
        } catch (err) { /* ignore */ }
      };
    } catch (err) { /* ignore websocket init errors */ }
    return () => { clearInterval(timer); };
  }, [load]);

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdating(orderId);
    try {
      await api.patch(`/orders/${orderId}/`, { order_status: newStatus });
      toast.success(`Order updated to ${STATUS_COLORS[newStatus].label}`);
      load();
    } catch (err) {
      toast.error('Failed to update order status');
      console.error(err);
    } finally {
      setUpdating(null);
    }
  };

  const handleUpdateRush = async (level) => {
    setRushUpdating(true);
    try {
      await api.post('/queue/update-rush/', { rush_level: level });
      setRushLevel(level);
      toast.success(`Queue updated to ${RUSH_LEVELS.find(r => r.level === level).label}`);
      load();
    } catch (err) {
      toast.error('Failed to update rush status');
    } finally {
      setRushUpdating(false);
    }
  };

  const handleDelete = async (orderId) => {
    if (!window.confirm('Archive this order?')) return;
    setUpdating(orderId);
    try {
      await api.delete(`/orders/${orderId}/`);
      toast.success('Order archived successfully');
      load();
    } catch (err) {
      toast.error('Failed to archive order');
    } finally {
      setUpdating(null);
    }
  };

  const handleBillingConfirm = async (orderId, receivedAmount, notes, paymentMethod) => {
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;

      // Submit billing details to backend
      const payload = { 
        received_amount: parseFloat(receivedAmount), 
        notes,
        payment_method: paymentMethod 
      };
      await api.post(`/orders/${orderId}/bill/`, payload);
      toast.success('Payment confirmed & Order completed successfully!');
      
      // Fetch receipt HTML and trigger print dialog
      try {
        const res = await api.get(`/orders/${orderId}/receipt/`);
        const html = res.data.html;
        const w = window.open('', '_blank');
        w.document.write(html);
        w.document.close();
        w.focus();
        w.print();
      } catch (err) {
        // Continue silently if receipt printer fails
      }
      setBillingOrder(null);
      load();
    } catch (err) {
      toast.error('Failed to process billing transaction');
    }
  };

  const todayStr = new Date().toLocaleDateString('sv-SE');

  // Filter orders
  const filtered = orders.filter(o => {
    // If we are in 'list' view, exclude completed/cancelled by default unless explicitly chosen
    if (viewMode === 'list' && filterStatus === 'all' && ['completed', 'cancelled'].includes(o.order_status)) {
      if (o.order_status === 'completed' && o.payment?.payment_status === 'pending') {
        return true;
      }
      return false;
    }
    // If we are in 'history' view, only show completed orders for today
    if (viewMode === 'history') {
      return o.order_status === 'completed' && o.created_at?.slice(0, 10) === todayStr;
    }
    
    const matchStatus = filterStatus === 'all' || o.order_status === filterStatus;
    const matchType = filterType === 'all' || o.order_type === filterType;
    const matchSearch = !search || 
      o.token_number?.includes(search.toUpperCase()) ||
      o.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
      o.id?.toString().includes(search);
    return matchStatus && matchType && matchSearch;
  });

  // Sort by status priority (pending first)
  const sorted = [...filtered].sort((a, b) => {
    const priorityA = STATUS_COLORS[a.order_status]?.priority ?? 99;
    const priorityB = STATUS_COLORS[b.order_status]?.priority ?? 99;
    return priorityA - priorityB;
  });

  // Calculate stats
  const stats = {
    pending: orders.filter(o => o.order_status === 'pending').length,
    confirmed: orders.filter(o => o.order_status === 'confirmed').length,
    preparing: orders.filter(o => o.order_status === 'preparing').length,
    ready: orders.filter(o => o.order_status === 'ready').length,
    completed: orders.filter(o => o.order_status === 'completed').length,
  };

  const activeOrders = orders.filter(o => ['pending', 'confirmed', 'preparing', 'ready'].includes(o.order_status) || (o.order_status === 'completed' && o.payment?.payment_status === 'pending'));
  const avgWaitTime = activeOrders.length > 0
    ? Math.ceil(activeOrders.reduce((sum, o) => sum + (o.estimated_wait || 0), 0) / activeOrders.length)
    : 0;

  return (
    <StaffLayout title="Order Operations" subtitle="Handle customer preorder collections and instant counter operations">
      <div className="dash-page">

        {/* HEADER */}
        <div className="dash-welcome" style={{ marginBottom: 20 }}>
          <div>
            <h1>Staff Operations Center</h1>
            <div className="dash-welcome-meta">
              <span>Last Sync: {lastUpdated}</span>
              <span>{new Date().toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
            </div>
          </div>
          <button onClick={load} className="dash-btn dash-btn-ghost" title="Refresh">
            <RefreshCw size={18} /> Refresh
          </button>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: 10, borderBottom: '1px solid var(--border)', paddingBottom: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          {[
            { id: 'list', label: 'Active Orders', count: orders.filter(o => ['pending', 'confirmed', 'preparing', 'ready'].includes(o.order_status) || (o.order_status === 'completed' && o.payment?.payment_status === 'pending')).length },
            { id: 'workflow', label: 'Prep Workflow Board', count: null },
            { id: 'metrics', label: 'Live Metrics & Rush', count: null },
            { id: 'history', label: "Today's History", count: orders.filter(o => o.order_status === 'completed' && o.created_at?.slice(0, 10) === todayStr).length },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setViewMode(tab.id)}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                border: 'none',
                background: viewMode === tab.id ? 'var(--teal-soft)' : 'transparent',
                color: viewMode === tab.id ? 'var(--teal)' : 'var(--text-2)',
                borderLeft: viewMode === tab.id ? '3px solid var(--teal)' : 'none',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              {tab.label}
              {tab.count !== null && (
                <span style={{ fontSize: '0.72rem', background: viewMode === tab.id ? 'var(--teal)' : 'var(--surface-3)', color: viewMode === tab.id ? '#0B0F14' : 'var(--text-2)', padding: '2px 6px', borderRadius: 4 }}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── VIEW MODE: ACTIVE ORDERS ── */}
        {viewMode === 'list' && (
          <>
            {/* QUICK STATS */}
            <h2 className="dash-section-title">Order Status Overview</h2>
            <div className="dash-stat-grid-4" style={{ marginBottom: 'var(--sp-8)' }}>
              {[
                { icon: Clock, label: 'Pending', value: stats.pending, color: '#eab308' },
                { icon: Zap, label: 'Accepted', value: stats.confirmed, color: '#38bdf8' },
                { icon: ChefHat, label: 'Preparing', value: stats.preparing, color: '#a78bfa' },
                { icon: CheckCircle, label: 'Ready', value: stats.ready, color: '#22c55e' },
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

            {/* FILTERS */}
            <div style={{ display: 'flex', gap: 'var(--sp-4)', flexWrap: 'wrap', marginBottom: 'var(--sp-8)', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Search by Token, Name, or Order ID..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="admin-input"
                style={{ maxWidth: 300, height: 36 }}
              />
              <div style={{ display: 'flex', gap: 'var(--sp-3)', flexWrap: 'wrap' }}>
                <div>
                  <label style={{ fontSize: '0.72rem', color: 'var(--text-3)', fontWeight: 700, display: 'block', marginBottom: 4 }}>Status</label>
                  <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="admin-select" style={{ height: 36 }}>
                    <option value="all">All Status</option>
                    {Object.entries(STATUS_COLORS).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.72rem', color: 'var(--text-3)', fontWeight: 700, display: 'block', marginBottom: 4 }}>Type</label>
                  <select value={filterType} onChange={e => setFilterType(e.target.value)} className="admin-select" style={{ height: 36 }}>
                    <option value="all">All Types</option>
                    <option value="preorder">Preorder</option>
                    <option value="instant">Instant</option>
                  </select>
                </div>
              </div>
            </div>

            {/* ORDERS LIST */}
            <h2 className="dash-section-title">Active Orders ({sorted.length})</h2>
            {loading ? (
              <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                <div style={{ width: 48, height: 48, border: '4px solid var(--teal)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 16px' }} />
                <p style={{ color: 'var(--text-3)' }}>Loading orders...</p>
              </div>
            ) : sorted.length === 0 ? (
              <div className="dash-empty" style={{ padding: '60px 20px' }}>
                <CheckCircle size={40} color="var(--teal)" style={{ marginBottom: 12 }} />
                <p style={{ fontSize: '1.1rem', fontWeight: 700 }}>No orders found</p>
                <p style={{ color: 'var(--text-3)', fontSize: '0.9rem', marginTop: 8 }}>All done! No matching orders at the moment.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--sp-4)' }}>
                {sorted.map(order => {
                  const statusInfo = STATUS_COLORS[order.order_status] || STATUS_COLORS.pending;
                  const isPreorder = order.order_type === 'preorder';
                  const totalAmt = parseFloat(order.total_amount || 0);
                  
                  return (
                    <div
                      key={order.id}
                      className="dash-card"
                      style={{
                        borderLeft: `4px solid ${statusInfo.color}`,
                        paddingRight: 0,
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column'
                      }}
                    >
                      {/* Header */}
                      <div style={{ padding: 'var(--sp-4)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--sp-3)' }}>
                          <div>
                            <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', margin: 0, letterSpacing: '0.5px' }}>
                              {isPreorder ? 'Preorder' : 'Instant'}
                            </p>
                            <p style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-1)', margin: '4px 0 0' }}>
                              Token: {order.token_number}
                            </p>
                            {['pending', 'confirmed', 'preparing'].includes(order.order_status) && (
                              <div style={{ fontSize: '0.75rem', color: 'var(--teal)', fontWeight: 700, marginTop: 4 }}>
                                Est. Ready: {(() => {
                                  const d = new Date(order.created_at);
                                  d.setMinutes(d.getMinutes() + (order.estimated_wait || 0));
                                  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                })()}
                              </div>
                            )}
                          </div>
                          <div
                            style={{
                              background: statusInfo.bg,
                              color: statusInfo.color,
                              padding: '4px 10px',
                              borderRadius: 6,
                              fontSize: '0.7rem',
                              fontWeight: 800,
                              textTransform: 'uppercase'
                            }}
                          >
                            {statusInfo.label}
                          </div>
                        </div>

                        {/* Customer & Details */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-3)', marginBottom: 'var(--sp-3)', fontSize: '0.85rem' }}>
                          <div>
                            <span style={{ color: 'var(--text-3)', display: 'block', marginBottom: 2 }}>Customer</span>
                            <span style={{ fontWeight: 700, color: 'var(--text-1)' }}>{order.user?.name || 'Unknown'}</span>
                          </div>
                          <div>
                            <span style={{ color: 'var(--text-3)', display: 'block', marginBottom: 2 }}>Amount</span>
                            <span style={{ fontWeight: 700, color: 'var(--teal)' }}>₹{totalAmt.toFixed(2)}</span>
                          </div>
                          <div>
                            <span style={{ color: 'var(--text-3)', display: 'block', marginBottom: 2 }}>Items</span>
                            <span style={{ fontWeight: 700, color: 'var(--text-1)' }}>{order.items?.length || 0} item(s)</span>
                          </div>
                          <div>
                            <span style={{ color: 'var(--text-3)', display: 'block', marginBottom: 2 }}>Est. Wait</span>
                            <span style={{ fontWeight: 700, color: 'var(--teal)' }}>{order.estimated_wait}m</span>
                          </div>
                        </div>

                        {/* Items list */}
                        {order.items && order.items.length > 0 && (
                          <div style={{ background: 'var(--surface-2)', padding: 'var(--sp-3)', borderRadius: 8, marginBottom: 'var(--sp-3)' }}>
                            <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-3)', margin: '0 0 6px', textTransform: 'uppercase' }}>Items</p>
                            {order.items.map((item, i) => (
                              <div key={i} style={{ fontSize: '0.8rem', color: 'var(--text-2)', margin: '4px 0' }}>
                                <div>
                                  {item.quantity}x {item.item_detail?.item_name || 'Unknown Item'} @ ₹{item.item_detail?.price}
                                </div>
                                {item.item_detail?.category === 'combo' && item.item_detail?.combo_items && (
                                  <div style={{ fontSize: '0.72rem', color: 'var(--teal)', fontWeight: 500, marginTop: 2, paddingLeft: 6 }}>
                                    ↳ Includes: {getComboConstituentsText(item.item_detail.combo_items)}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Payment info */}
                        {order.payment && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 'var(--sp-3)', padding: 'var(--sp-2) var(--sp-3)', background: 'var(--surface-2)', borderRadius: 8, fontSize: '0.85rem' }}>
                            <span style={{ fontWeight: 700, color: 'var(--text-2)' }}>
                              {order.payment.payment_method.toUpperCase()}
                            </span>
                            <span
                              style={{
                                padding: '2px 8px',
                                borderRadius: 4,
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                background: order.payment.payment_status === 'success' ? 'rgba(34,197,94,0.15)' : 'rgba(234,179,8,0.15)',
                                color: order.payment.payment_status === 'success' ? '#22c55e' : '#eab308'
                              }}
                            >
                              {order.payment.payment_status === 'success' ? 'Paid' : 'Pending'}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div style={{ padding: 'var(--sp-4)', paddingTop: 'var(--sp-3)', borderTop: '1px solid var(--border)', marginTop: 'auto' }}>
                        <OrderActions
                          order={order}
                          onStatusChange={handleStatusChange}
                          onDelete={handleDelete}
                          onBilling={o => setBillingOrder(o)}
                          loading={updating === order.id}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ── VIEW MODE: PREP WORKFLOW BOARD ── */}
        {viewMode === 'workflow' && (
          <div className="dash-workflow" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginTop: 16 }}>
            {['pending', 'confirmed', 'preparing', 'ready'].map(status => {
              const colOrders = orders.filter(o => o.order_status === status);
              const colInfo = STATUS_COLORS[status];
              return (
                <div key={status} style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, minHeight: 450, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 10, borderBottom: `2px solid ${colInfo.color}` }}>
                    <span style={{ fontWeight: 800, color: 'var(--text-1)', fontSize: '0.9rem', textTransform: 'uppercase' }}>
                      {colInfo.label}
                    </span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, background: colInfo.color + '20', color: colInfo.color, padding: '2px 8px', borderRadius: 999 }}>
                      {colOrders.length}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto', flex: 1, maxHeight: '60vh' }}>
                    {colOrders.map(order => (
                      <div key={order.id} className="dash-card" style={{ padding: 12, borderLeft: `3px solid ${colInfo.color}`, background: 'var(--surface-3)', borderRadius: 8, margin: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                          <span style={{ fontWeight: 800, color: 'var(--text-1)', fontSize: '0.85rem' }}>
                            Token: {order.token_number}
                          </span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-3)' }}>
                            {order.order_type === 'preorder' ? 'Preorder' : 'Instant'}
                          </span>
                        </div>
                        <p style={{ margin: '0 0 6px 0', fontSize: '0.8rem', color: 'var(--text-2)', fontWeight: 600 }}>
                          {order.user?.name || 'Customer'}
                        </p>
                        <p style={{ margin: '0 0 8px 0', fontSize: '0.75rem', color: 'var(--text-3)' }}>
                          {order.items?.length || 0} item(s) · ₹{parseFloat(order.total_amount || 0).toFixed(2)}
                        </p>

                        {/* Direct workflow actions right in columns */}
                        <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: 8 }}>
                          <OrderActions
                            order={order}
                            onStatusChange={handleStatusChange}
                            onDelete={handleDelete}
                            onBilling={o => setBillingOrder(o)}
                            loading={updating === order.id}
                          />
                        </div>
                      </div>
                    ))}
                    {colOrders.length === 0 && (
                      <div style={{ textAlign: 'center', color: 'var(--text-3)', fontSize: '0.8rem', padding: '40px 0' }}>
                        No orders in this stage
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── VIEW MODE: LIVE METRICS & RUSH ── */}
        {viewMode === 'metrics' && (
          <div>
            {/* Live Queue Status Banner */}
            <h2 className="dash-section-title">Live Kitchen Rush Status</h2>
            {(() => {
              const currentRushLevel = RUSH_LEVELS.find(r => r.level === rushLevel) || RUSH_LEVELS[1];
              return (
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
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--sp-3)' }}>
                    <span style={{ display: 'inline-block', width: 14, height: 14, borderRadius: '50%', background: currentRushLevel.color, boxShadow: `0 0 10px ${currentRushLevel.color}` }} />
                  </div>
                  <p style={{ fontSize: '1.6rem', fontWeight: 900, color: currentRushLevel.color, margin: 0 }}>
                    {currentRushLevel.label}
                  </p>
                  <p style={{ color: 'var(--text-3)', fontSize: '0.9rem', margin: 'var(--sp-2) 0 0' }}>
                    {currentRushLevel.description}
                  </p>
                </div>
              );
            })()}

            {/* Quick Stats Grid */}
            <h2 className="dash-section-title">Queue Performance Metrics</h2>
            <div className="dash-stat-grid-4" style={{ marginBottom: 'var(--sp-8)' }}>
              {[
                { icon: Users, label: 'Active Orders', value: activeOrders.length, color: '#38bdf8' },
                { icon: TrendingUp, label: 'Avg Wait Time', value: `${avgWaitTime}m`, color: '#a78bfa' },
                { icon: AlertTriangle, label: 'Peak Order Amount', value: `₹${Math.max(...orders.map(o => parseFloat(o.total_amount || 0)), 0).toFixed(0)}`, color: '#ef4444' },
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

            {/* Rush Level Selector */}
            <h2 className="dash-section-title">Update Rush Level Status</h2>
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
                  disabled={rushUpdating}
                  style={{
                    padding: 'var(--sp-5)',
                    borderRadius: 'var(--r-lg)',
                    border: rushLevel === level.level ? `2px solid ${level.color}` : '1px solid var(--border)',
                    background: rushLevel === level.level ? level.bgColor : 'var(--surface-2)',
                    cursor: rushUpdating ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    opacity: rushUpdating ? 0.5 : 1,
                    textAlign: 'center'
                  }}
                  onMouseEnter={e => {
                    if (!rushUpdating) {
                      e.currentTarget.style.background = level.bgColor;
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = `0 4px 16px ${level.color}33`;
                    }
                  }}
                  onMouseLeave={e => {
                    if (!rushUpdating) {
                      e.currentTarget.style.background = rushLevel === level.level ? level.bgColor : 'var(--surface-2)';
                      e.currentTarget.style.transform = '';
                      e.currentTarget.style.boxShadow = '';
                    }
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--sp-3)' }}>
                    <span style={{ display: 'inline-block', width: 14, height: 14, borderRadius: '50%', background: level.color, boxShadow: `0 0 10px ${level.color}` }} />
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
            
            {/* Operational tip */}
            <div style={{ padding: 'var(--sp-5)', background: 'rgba(20,209,178,0.08)', border: '1px solid rgba(20,209,178,0.2)', borderRadius: 'var(--r-lg)' }}>
              <p style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--teal)', margin: '0 0 var(--sp-2)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Operational Tip
              </p>
              <p style={{ margin: 0, color: 'var(--text-2)', fontSize: '0.85rem', lineHeight: 1.6 }}>
                Rush level controls the estimated wait times shown on the student application dashboard. Keep this updated to ensure students are well-informed of peak load queues.
              </p>
            </div>
          </div>
        )}

        {/* ── VIEW MODE: TODAY'S ORDER HISTORY ── */}
        {viewMode === 'history' && (
          <>
            <h2 className="dash-section-title">Today's Completed Orders</h2>
            {loading ? (
              <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                <div style={{ width: 48, height: 48, border: '4px solid var(--teal)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 16px' }} />
                <p style={{ color: 'var(--text-3)' }}>Loading history...</p>
              </div>
            ) : sorted.length === 0 ? (
              <div className="dash-empty" style={{ padding: '60px 20px' }}>
                <CheckCircle size={40} color="var(--teal)" style={{ marginBottom: 12 }} />
                <p style={{ fontSize: '1.1rem', fontWeight: 700 }}>No completed orders today yet</p>
                <p style={{ color: 'var(--text-3)', fontSize: '0.9rem', marginTop: 8 }}>Orders marked completed today will appear here as daily history logs.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--sp-4)' }}>
                {sorted.map(order => {
                  const statusInfo = STATUS_COLORS.completed;
                  const isPreorder = order.order_type === 'preorder';
                  const totalAmt = parseFloat(order.total_amount || 0);

                  return (
                    <div
                      key={order.id}
                      className="dash-card"
                      style={{
                        borderLeft: `4px solid ${statusInfo.color}`,
                        paddingRight: 0,
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column'
                      }}
                    >
                      <div style={{ padding: 'var(--sp-4)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--sp-3)' }}>
                          <div>
                            <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', margin: 0, letterSpacing: '0.5px' }}>
                              {isPreorder ? 'Preorder' : 'Instant'}
                            </p>
                            <p style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-1)', margin: '4px 0 0' }}>
                              Token: {order.token_number}
                            </p>
                          </div>
                          <div
                            style={{
                              background: '#1f2937',
                              color: '#6b7280',
                              padding: '4px 10px',
                              borderRadius: 6,
                              fontSize: '0.7rem',
                              fontWeight: 800,
                              textTransform: 'uppercase'
                            }}
                          >
                            Delivered
                          </div>
                        </div>

                        {/* Customer & Details */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-3)', marginBottom: 'var(--sp-3)', fontSize: '0.85rem' }}>
                          <div>
                            <span style={{ color: 'var(--text-3)', display: 'block', marginBottom: 2 }}>Customer</span>
                            <span style={{ fontWeight: 700, color: 'var(--text-1)' }}>{order.user?.name || 'Unknown'}</span>
                          </div>
                          <div>
                            <span style={{ color: 'var(--text-3)', display: 'block', marginBottom: 2 }}>Amount Paid</span>
                            <span style={{ fontWeight: 700, color: 'var(--teal)' }}>₹{totalAmt.toFixed(2)}</span>
                          </div>
                          <div>
                            <span style={{ color: 'var(--text-3)', display: 'block', marginBottom: 2 }}>Items</span>
                            <span style={{ fontWeight: 700, color: 'var(--text-1)' }}>{order.items?.length || 0} item(s)</span>
                          </div>
                          <div>
                            <span style={{ color: 'var(--text-3)', display: 'block', marginBottom: 2 }}>Completed At</span>
                            <span style={{ fontWeight: 700, color: 'var(--text-2)' }}>
                              {order.updated_at ? new Date(order.updated_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                            </span>
                          </div>
                        </div>

                        {/* Items list */}
                        {order.items && order.items.length > 0 && (
                          <div style={{ background: 'var(--surface-2)', padding: 'var(--sp-3)', borderRadius: 8 }}>
                            {order.items.map((item, i) => (
                              <div key={i} style={{ fontSize: '0.8rem', color: 'var(--text-2)', margin: '4px 0' }}>
                                <div>
                                  {item.quantity}x {item.item_detail?.item_name || 'Unknown Item'}
                                </div>
                                {item.item_detail?.category === 'combo' && item.item_detail?.combo_items && (
                                  <div style={{ fontSize: '0.72rem', color: 'var(--teal)', fontWeight: 500, marginTop: 2, paddingLeft: 6 }}>
                                    ↳ Includes: {getComboConstituentsText(item.item_detail.combo_items)}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

      </div>

      {/* BILLING MODAL */}
      {billingOrder && (
        <BillingModal
          order={billingOrder}
          onConfirm={(amt, notes) => {
            handleBillingConfirm(billingOrder.id, amt, notes);
          }}
          onClose={() => setBillingOrder(null)}
        />
      )}

    </StaffLayout>
  );
}
