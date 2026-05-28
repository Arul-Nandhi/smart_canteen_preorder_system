import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, Clock, Users, TrendingUp } from 'lucide-react';
import StaffLayout from '../../components/StaffLayout';
import api from '../../services/api';
import toast from 'react-hot-toast';

/**
 * ──────────────────────────────────────────────────────────
 * SLOT MANAGEMENT — Track Pickup Slots & Capacity
 * ──────────────────────────────────────────────────────────
 */

export default function SlotManagement() {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  const load = useCallback(async () => {
    try {
      const res = await api.get('/slots/smart/');
      setSlots(res.data || []);
    } catch (err) {
      toast.error('Failed to load slots');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, 10000);
    const timeTimer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => { clearInterval(timer); clearInterval(timeTimer); };
  }, [load]);

  const toggleSlot = async (slot) => {
    if (!slot.id) {
      toast.error('This slot has no database record yet.');
      return;
    }
    try {
      const newStatus = slot.status === 'open' ? 'closed' : 'open';
      const res = await api.put(`/slots/${slot.id}/`, { slot_status: newStatus });
      setSlots(prev => prev.map(s => s.id === slot.id ? res.data : s));
      toast.success(`Slot ${slot.start_time} is now ${newStatus === 'open' ? 'Open' : 'Closed'}`);
    } catch (err) {
      toast.error('Failed to update slot status');
      console.error(err);
    }
  };

  // Get next 3 hours of slots (dynamic calculation)
  const getUpcomingSlots = () => {
    const now = currentTime;
    const threeHoursLater = new Date(now.getTime() + 3 * 60 * 60 * 1000);

    const fmtTime = (d) =>
      `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

    // Generate 10-minute slots for next 3 hours
    const generatedSlots = [];
    for (let i = 0; i < 18; i++) { // 18 slots × 10 min = 180 min = 3 hours
      const slotStart = new Date(now.getTime() + i * 10 * 60 * 1000);
      const slotEnd = new Date(slotStart.getTime() + 10 * 60 * 1000);

      if (slotEnd <= threeHoursLater) {
        const startStr = fmtTime(slotStart);
        const dateStr = slotStart.toLocaleDateString('sv-SE'); // Sweden localesv-SE gives YYYY-MM-DD
        const slotData = slots.find(s => 
          s.start_time?.slice(0, 5) === startStr &&
          s.slot_date === dateStr
        );

        generatedSlots.push({
          id: slotData?.id || null,
          start_time: startStr,
          end_time: fmtTime(slotEnd),
          capacity: slotData?.max_orders || 30,
          reserved: slotData?.current_orders || 0,
          status: slotData?.slot_status || 'open',
          slot_date: dateStr,
          dbSlot: slotData || null
        });
      }
    }

    return generatedSlots;
  };

  const upcomingSlots = getUpcomingSlots();

  // Calculate statistics
  const totalCapacity = upcomingSlots.reduce((sum, s) => sum + s.capacity, 0);
  const totalReserved = upcomingSlots.reduce((sum, s) => sum + s.reserved, 0);
  const totalAvailable = Math.max(0, totalCapacity - totalReserved);
  const avgLoad = totalCapacity > 0 ? Math.round((totalReserved / totalCapacity) * 100) : 0;

  return (
    <StaffLayout title="Slot Capacity" subtitle="Track and override preorder collection slot capacities">
      <div className="dash-page">

        {/* HEADER */}
        <div className="dash-welcome">
          <div>
            <h1>🎯 Pickup Slot Manager</h1>
            <div className="dash-welcome-meta">
              <span>⏱ {currentTime.toLocaleTimeString()}</span>
              <span>Next 3 Hours</span>
            </div>
          </div>
          <button onClick={load} className="dash-btn dash-btn-ghost">
            <RefreshCw size={18} /> Refresh
          </button>
        </div>

        {/* SLOT OVERVIEW STATS */}
        <h2 className="dash-section-title">📊 Slot Capacity Overview</h2>
        <div className="dash-stat-grid-4" style={{ marginBottom: 'var(--sp-8)' }}>
          {[
            { icon: Users, label: 'Total Capacity', value: totalCapacity, color: '#38bdf8' },
            { icon: Clock, label: 'Reserved', value: totalReserved, color: '#a78bfa' },
            { icon: TrendingUp, label: 'Available', value: totalAvailable, color: '#22c55e' },
            { icon: RefreshCw, label: 'Load %', value: `${avgLoad}%`, color: avgLoad > 80 ? '#ef4444' : avgLoad > 50 ? '#eab308' : 'var(--teal)' },
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

        {/* SLOTS GRID */}
        <h2 className="dash-section-title">⏰ Upcoming Slots (10-minute intervals)</h2>
        {loading ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <div style={{ width: 48, height: 48, border: '4px solid var(--teal)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 16px' }} />
            <p style={{ color: 'var(--text-3)' }}>Loading slots...</p>
          </div>
        ) : upcomingSlots.length === 0 ? (
          <div className="dash-empty">
            <p>No upcoming slots</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 'var(--sp-4)' }}>
            {upcomingSlots.map((slot, idx) => {
              const reservedPercent = (slot.reserved / slot.capacity) * 100;
              const status =
                slot.status === 'closed' ? 'closed' :
                reservedPercent >= 100 ? 'full' :
                reservedPercent >= 80 ? 'almost' :
                reservedPercent >= 50 ? 'moderate' : 'low';

              const statusColors = {
                closed: { bg: 'rgba(100,116,139,0.05)', color: '#64748b', label: 'Suspended (Closed)' },
                full: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444', label: 'Slot Full' },
                almost: { bg: 'rgba(249,115,22,0.1)', color: '#f97316', label: 'Almost Full' },
                moderate: { bg: 'rgba(234,179,8,0.1)', color: '#eab308', label: 'Moderate Load' },
                low: { bg: 'rgba(34,197,94,0.1)', color: '#22c55e', label: 'Available' },
              };

              const sc = statusColors[status];

              return (
                <div
                  key={`slot-${idx}`}
                  className="dash-card"
                  style={{
                    background: sc.bg,
                    borderLeft: `4px solid ${sc.color}`,
                    padding: 'var(--sp-4)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    {/* Time */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', marginBottom: 'var(--sp-3)' }}>
                      <Clock size={18} style={{ color: sc.color }} />
                      <div>
                        <p style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-1)', margin: 0 }}>
                          {slot.start_time} – {slot.end_time}
                        </p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', margin: 'var(--sp-1) 0 0' }}>
                          {sc.label}
                        </p>
                      </div>
                    </div>

                    {/* Capacity bar */}
                    <div style={{ marginBottom: 'var(--sp-4)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-2)', fontSize: '0.85rem' }}>
                        <span style={{ fontWeight: 700, color: 'var(--text-2)' }}>
                          {slot.reserved} / {slot.capacity}
                        </span>
                        <span style={{ color: 'var(--text-3)', fontSize: '0.75rem' }}>
                          {reservedPercent.toFixed(0)}%
                        </span>
                      </div>
                      <div style={{
                        width: '100%', height: 8, background: 'rgba(0,0,0,0.2)', borderRadius: 4, overflow: 'hidden'
                      }}>
                        <div style={{
                          height: '100%', width: `${Math.min(reservedPercent, 100)}%`,
                          background: `linear-gradient(90deg, ${sc.color}, ${sc.color}dd)`,
                          transition: 'width 0.3s ease'
                        }} />
                      </div>
                    </div>

                    {/* Details */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-3)', fontSize: '0.8rem', padding: 'var(--sp-2) var(--sp-3)', background: 'rgba(0,0,0,0.1)', borderRadius: 8, marginBottom: 'var(--sp-3)' }}>
                      <div>
                        <span style={{ color: 'var(--text-3)', display: 'block', fontSize: '0.7rem', marginBottom: 2 }}>Reserved</span>
                        <span style={{ fontWeight: 700, color: sc.color }}>{slot.reserved}</span>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-3)', display: 'block', fontSize: '0.7rem', marginBottom: 2 }}>Available</span>
                        <span style={{ fontWeight: 700, color: 'var(--teal)' }}>{Math.max(0, slot.capacity - slot.reserved)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Toggle button */}
                  {slot.id ? (
                    <button
                      onClick={() => toggleSlot(slot)}
                      className="dash-btn"
                      style={{
                        width: '100%',
                        height: 32,
                        fontSize: '0.75rem',
                        padding: 0,
                        background: slot.status === 'open' ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)',
                        color: slot.status === 'open' ? '#ef4444' : '#22c55e',
                        border: 'none',
                        cursor: 'pointer',
                        borderRadius: 8,
                        fontWeight: 700,
                        transition: 'all 0.2s'
                      }}
                    >
                      {slot.status === 'open' ? '⛔ Suspend' : '✅ Enable'}
                    </button>
                  ) : (
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-3)', textAlign: 'center', padding: '4px 0' }}>
                      Auto-generated · No orders yet
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* TIPS & INFORMATION */}
        <div style={{ marginTop: 'var(--sp-8)', padding: 'var(--sp-5)', background: 'rgba(20,209,178,0.08)', border: '1px solid rgba(20,209,178,0.2)', borderRadius: 'var(--r-lg)' }}>
          <p style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--teal)', margin: '0 0 var(--sp-2)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            💡 Staff Tips
          </p>
          <ul style={{ margin: 0, paddingLeft: 'var(--sp-4)', color: 'var(--text-2)', fontSize: '0.85rem', lineHeight: 1.6 }}>
            <li>Suspended slots ⛔ cannot accept new preorders.</li>
            <li>Each slot shows reserved vs total capacity.</li>
            <li>Slots are automatically generated for the next 3 hours.</li>
            <li>Slot capacity is fixed at 30 orders per 10-minute interval.</li>
            <li>Monitor capacity to help students choose optimal pickup times.</li>
          </ul>
        </div>

      </div>
    </StaffLayout>
  );
}
