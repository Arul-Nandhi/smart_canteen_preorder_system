import { Edit2, Trash2, AlertTriangle, Lock } from 'lucide-react';

export default function SlotCard({ slot, maxCapacity = 50, onEdit, onDelete, onToggle }) {
  const percentage = ((slot.orders_count || 0) / slot.max_orders) * 100;
  const status = percentage > 90 ? 'overloaded' : percentage > 70 ? 'moderate' : 'available';
  const statusColor = status === 'overloaded' ? 'red' : status === 'moderate' ? 'yellow' : 'green';

  const statusLabel = {
    overloaded: 'Overloaded',
    moderate: 'Moderate',
    available: 'Available'
  };

  const hexColor = statusColor === 'red' ? '#ef4444' : statusColor === 'yellow' ? '#eab308' : '#22c55e';
  const badgeClass = statusColor === 'red' ? 'red' : statusColor === 'yellow' ? 'yellow' : 'green';

  return (
    <div className="dash-card">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-1)' }}>
            {slot.start_time} - {slot.end_time}
          </h4>
          <p className="text-xs" style={{ color: 'var(--text-3)', marginTop: '2px' }}>{slot.slot_date}</p>
        </div>
        <span className={`dash-badge ${badgeClass}`}>
          {statusLabel[status]}
        </span>
      </div>

      {/* Capacity Progress */}
      <div className="mb-4 pb-4 border-b border-border">
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm" style={{ color: 'var(--text-2)' }}>Capacity</span>
            <span style={{ fontWeight: 700, color: 'var(--text-1)' }}>
              {slot.orders_count || 0}/{slot.max_orders}
            </span>
          </div>
          <div style={{ width: '100%', height: '8px', background: 'var(--surface-2)', borderRadius: 'var(--r-full)', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                transition: 'width var(--t-med)',
                background: hexColor,
                width: `${Math.min(percentage, 100)}%`
              }}
            />
          </div>
        </div>
      </div>

      {/* Slot Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4 text-center">
        <div style={{ padding: '8px', background: 'var(--surface-2)', borderRadius: 'var(--r-sm)' }}>
          <p className="text-xs" style={{ color: 'var(--text-3)', marginBottom: '2px' }}>Total</p>
          <p style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--teal)' }}>{slot.max_orders}</p>
        </div>
        <div style={{ padding: '8px', background: 'var(--surface-2)', borderRadius: 'var(--r-sm)' }}>
          <p className="text-xs" style={{ color: 'var(--text-3)', marginBottom: '2px' }}>Current</p>
          <p style={{ fontSize: '1.05rem', fontWeight: 800, color: '#38bdf8' }}>{slot.orders_count || 0}</p>
        </div>
        <div style={{ padding: '8px', background: 'var(--surface-2)', borderRadius: 'var(--r-sm)' }}>
          <p className="text-xs" style={{ color: 'var(--text-3)', marginBottom: '2px' }}>Available</p>
          <p style={{ fontSize: '1.05rem', fontWeight: 800, color: '#22c55e' }}>{(slot.max_orders - (slot.orders_count || 0))}</p>
        </div>
      </div>

      {/* Alerts */}
      {status === 'overloaded' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: 'rgba(239,68,68,0.1)', borderRadius: 'var(--r-sm)', marginBottom: '16px' }}>
          <AlertTriangle size={16} style={{ color: '#ef4444', flexShrink: 0 }} />
          <span className="text-xs" style={{ color: '#ef4444', fontWeight: 500 }}>This slot is overloaded</span>
        </div>
      )}

      {!slot.is_active && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: 'rgba(234,179,8,0.1)', borderRadius: 'var(--r-sm)', marginBottom: '16px' }}>
          <Lock size={16} style={{ color: '#eab308', flexShrink: 0 }} />
          <span className="text-xs" style={{ color: '#eab308', fontWeight: 500 }}>Slot is disabled</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => onEdit?.(slot)}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition"
          style={{ background: 'rgba(56,189,248,0.12)', color: '#38bdf8' }}
        >
          <Edit2 size={16} />
          Edit
        </button>
        <button
          onClick={() => onToggle?.(slot)}
          className="flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition"
          style={{
            background: slot.is_active ? 'rgba(239,68,68,0.12)' : 'rgba(34,197,94,0.12)',
            color: slot.is_active ? '#ef4444' : '#22c55e'
          }}
        >
          {slot.is_active ? 'Disable' : 'Enable'}
        </button>
        <button
          onClick={() => onDelete?.(slot.id)}
          className="px-3 py-2 rounded-lg text-sm font-semibold transition"
          style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
