import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, AlertTriangle, Clock, Zap, Users, ChevronRight, X } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import api from '../../services/api';
import toast from 'react-hot-toast';

const SLOT_DURATION_MIN  = 10;   // 10 minutes per slot
const SLOT_MAX_ORDERS    = 30;   // 30 orders per slot
const WINDOW_HOURS       = 3;    // show next 3 hours

// Generate dynamic slots from now → +3 hours, 10-min intervals
function generateDynamicSlots(existingSlots = []) {
  const now = new Date();
  const slots = [];
  const start = new Date(now);
  // round to nearest 10-min boundary
  start.setSeconds(0, 0);
  start.setMinutes(Math.ceil(start.getMinutes() / 10) * 10);

  for (let i = 0; i < (WINDOW_HOURS * 60) / SLOT_DURATION_MIN; i++) {
    const slotStart = new Date(start.getTime() + i * SLOT_DURATION_MIN * 60000);
    const slotEnd   = new Date(slotStart.getTime() + SLOT_DURATION_MIN * 60000);

    const fmt = (d) =>
      `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

    const startStr = fmt(slotStart);
    const endStr   = fmt(slotEnd);

    // Match with existing DB slot if available
    const existing = existingSlots.find(
      s => s.start_time?.slice(0, 5) === startStr &&
           s.slot_date === new Date().toISOString().split('T')[0]
    );

    const isCurrent =
      now.getHours() === slotStart.getHours() &&
      now.getMinutes() >= slotStart.getMinutes() &&
      now.getMinutes() < slotEnd.getMinutes();

    slots.push({
      key: startStr,
      startStr,
      endStr,
      slotStart,
      isCurrent,
      dbSlot: existing || null,
      current_orders: existing?.current_orders ?? 0,
      max_orders: SLOT_MAX_ORDERS,
      slot_status: existing?.slot_status ?? 'open',
      id: existing?.id ?? null,
    });
  }
  return slots;
}

function pct(slot) {
  return Math.min(100, Math.round((slot.current_orders / slot.max_orders) * 100));
}
function barColor(p) {
  return p > 80 ? 'red' : p > 50 ? 'yellow' : 'green';
}
function slotClass(slot) {
  if (slot.slot_status === 'closed') return 'closed';
  const p = pct(slot);
  if (p >= 100) return 'overload';
  if (p >= 80)  return 'full';
  return 'available';
}
function slotBadgeClass(slot) {
  if (slot.slot_status === 'closed') return 'closed';
  const p = pct(slot);
  if (p >= 100) return 'full';
  if (slot.isCurrent) return 'current';
  return 'open';
}
function slotBadgeLabel(slot) {
  if (slot.slot_status === 'closed') return '⛔ Closed';
  const p = pct(slot);
  if (p >= 100) return '🔴 Full';
  if (slot.isCurrent) return '⚡ Now';
  return '✅ Open';
}

// Wait time predictor
function predictWait(orders, menuItems, staffPresent) {
  const active = orders.filter(o => ['confirmed','preparing'].includes(o.order_status));
  if (active.length === 0 || staffPresent === 0) return 0;
  const avgPrep = menuItems.length > 0
    ? menuItems.reduce((s, m) => s + (m.prep_time_mins || 5), 0) / menuItems.length
    : 5;
  return Math.ceil((active.length * avgPrep) / staffPresent);
}

export default function AdminSlotsPage() {
  const [dbSlots,     setDbSlots]     = useState([]);
  const [dynamicSlots, setDynSlots]   = useState([]);
  const [orders,      setOrders]      = useState([]);
  const [menuItems,   setMenu]        = useState([]);
  const [staffList,   setStaff]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [now,         setNow]         = useState(new Date());

  // Tick clock every 30s to regenerate slots
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const [s, o, m, st] = await Promise.all([
        api.get('/slots/smart/'),
        api.get('/orders/all/').catch(() => api.get('/orders/')),

        api.get('/menu/'),
        api.get('/auth/users/').catch(() => ({ data: [] })),
      ]);
      setDbSlots(s.data);
      setOrders(o.data);
      setMenu(m.data);
      setStaff(st.data.filter(u => u.role === 'staff' && u.is_present));
    } catch {
      toast.error('Failed to load slot data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setDynSlots(generateDynamicSlots(dbSlots)); }, [dbSlots, now]);

  const toggleSlot = async (slot) => {
    if (!slot.id) {
      toast('This slot has no DB record yet — capacity tracking requires a seeded slot.');
      return;
    }
    try {
      const newStatus = slot.slot_status === 'open' ? 'closed' : 'open';
      const res = await api.put(`/slots/${slot.id}/`, { ...slot.dbSlot, slot_status: newStatus });
      setDbSlots(prev => prev.map(s => s.id === slot.id ? res.data : s));
      toast.success(`Slot ${slot.startStr} is now ${newStatus === 'open' ? 'Open' : 'Closed'}`);
    } catch { toast.error('Failed to update slot'); }
  };

  // Overload detection
  const overloadedCount = dynamicSlots.filter(s => pct(s) >= 80 && s.slot_status === 'open').length;
  const isHeavyLoad     = overloadedCount >= 3;
  const presentStaff    = staffList.length;
  const waitMins        = predictWait(orders, menuItems, presentStaff || 1);

  // Stats
  const openCount   = dynamicSlots.filter(s => s.slot_status === 'open').length;
  const closedCount = dynamicSlots.filter(s => s.slot_status === 'closed').length;
  const totalOrders = dynamicSlots.reduce((a, s) => a + s.current_orders, 0);
  const totalCap    = dynamicSlots.reduce((a, s) => a + s.max_orders, 0);

  return (
    <AdminLayout title="Smart Slot Management" subtitle="Dynamic 3-hour preorder windows · 10 min intervals">

      {/* Heavy Overload Warning */}
      {isHeavyLoad && (
        <div className="slot-overload-banner">
          <AlertTriangle size={22} style={{ color: '#ef4444', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#ef4444' }}>
              ⚡ Heavy Rush — Instant Pickup Recommended
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginTop: 2 }}>
              {overloadedCount} slots are above 80% capacity. Kitchen is under heavy load.
            </div>
          </div>
        </div>
      )}

      {/* Wait Time Prediction */}
      <div className="wait-predict-card">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 20 }}>
          {[
            { icon: Clock,  label: 'Est. Wait Time',   value: `${waitMins} min`,        color: waitMins > 20 ? '#ef4444' : '#22c55e' },
            { icon: Users,  label: 'Staff On Duty',    value: `${presentStaff} present`, color: '#38bdf8' },
            { icon: Zap,    label: 'Active Orders',     value: orders.filter(o => ['confirmed','preparing'].includes(o.order_status)).length, color: '#a78bfa' },
            { icon: ChevronRight, label: 'Slot Capacity Used', value: `${totalOrders} / ${totalCap}`, color: '#14D1B2' },
          ].map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: `${s.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, flexShrink: 0 }}>
                <s.icon size={17} />
              </div>
              <div>
                <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{s.label}</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: s.color }}>{s.value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Slot Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Slots (3hr)', value: dynamicSlots.length, color: '#38bdf8' },
          { label: 'Open',              value: openCount,            color: '#22c55e' },
          { label: 'Closed',            value: closedCount,          color: '#ef4444' },
          { label: 'Overloaded (>80%)', value: overloadedCount,     color: '#f59e0b' },
        ].map((s, i) => (
          <div key={i} className="admin-card" style={{ padding: '14px 18px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: '1.7rem', fontWeight: 800, color: s.color, letterSpacing: '-1px' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div className="admin-section-title">Preorder Pickup Windows</div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: 4 }}>
            Showing next 3 hours from current time · Each slot: {SLOT_DURATION_MIN} min · {SLOT_MAX_ORDERS} orders max
          </p>
        </div>
        <button onClick={load} className="admin-btn admin-btn-ghost admin-btn-sm">
          <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
        </button>
      </div>

      {/* Dynamic Slot Grid */}
      {loading ? (
        <div className="admin-empty">
          <div style={{ width: 36, height: 36, border: '3px solid var(--teal)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto' }} />
        </div>
      ) : (
        <div className="slot-grid">
          {dynamicSlots.map(slot => {
            const p = pct(slot);
            const bc = barColor(p);
            return (
              <div key={slot.key} className={`slot-card ${slotClass(slot)}`}>
                {slot.isCurrent && (
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'var(--teal)', borderRadius: '12px 12px 0 0' }} />
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, paddingTop: slot.isCurrent ? 4 : 0 }}>
                  <div>
                    <div className="slot-time">
                      {slot.startStr} – {slot.endStr}
                    </div>
                    <div className="slot-capacity">{SLOT_DURATION_MIN} min · max {slot.max_orders}</div>
                  </div>
                  <span className={`slot-badge ${slotBadgeClass(slot)}`}>
                    {slotBadgeLabel(slot)}
                  </span>
                </div>

                {/* Capacity bar */}
                <div className="slot-bar-wrap">
                  <div
                    className={`slot-bar-fill ${bc}`}
                    style={{ width: `${p}%` }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span className="slot-pct" style={{ color: bc === 'red' ? '#ef4444' : bc === 'yellow' ? '#eab308' : '#22c55e' }}>
                    {p}% full
                  </span>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-3)' }}>
                    {slot.current_orders}/{slot.max_orders}
                  </span>
                </div>

                {/* Toggle */}
                {slot.id && (
                  <button
                    onClick={() => toggleSlot(slot)}
                    className={`admin-btn admin-btn-sm ${slot.slot_status === 'open' ? 'admin-btn-secondary' : 'admin-btn-primary'}`}
                    style={{ width: '100%', fontSize: '0.75rem' }}
                  >
                    {slot.slot_status === 'open' ? '⛔ Suspend' : '✅ Enable'}
                  </button>
                )}
                {!slot.id && (
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-3)', textAlign: 'center', padding: '4px 0' }}>
                    Auto-generated · No orders yet
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginTop: 20, flexWrap: 'wrap' }}>
        {[
          { color: '#22c55e', label: 'Available (< 50%)' },
          { color: '#eab308', label: 'Filling (50–80%)' },
          { color: '#ef4444', label: 'Overloaded (> 80%)' },
          { color: 'var(--teal)', label: 'Current Slot' },
        ].map((l, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', color: 'var(--text-3)' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: l.color }} />
            {l.label}
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
