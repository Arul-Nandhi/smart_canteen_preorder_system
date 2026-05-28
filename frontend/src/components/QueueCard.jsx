import { AlertTriangle } from 'lucide-react';

export default function QueueCard({ slot, maxCapacity = 50 }) {
  const percentage = ((slot.current_count || 0) / maxCapacity) * 100;
  const status = percentage > 90 ? 'overloaded' : percentage > 70 ? 'moderate' : 'normal';
  const statusColor = status === 'overloaded' ? '#ef4444' : status === 'moderate' ? '#eab308' : '#22c55e';
  const badgeClass = status === 'overloaded' ? 'red' : status === 'moderate' ? 'yellow' : 'green';
  
  const statusLabel = {
    overloaded: 'Overloaded',
    moderate: 'Moderate',
    normal: 'Normal'
  };

  return (
    <div className="dash-card">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-1)' }}>{slot.start_time} - {slot.end_time}</h4>
          <p className="text-xs" style={{ color: 'var(--text-3)', marginTop: '2px' }}>{slot.slot_date}</p>
        </div>
        <span className={`dash-badge ${badgeClass}`}>
          {statusLabel[status]}
        </span>
      </div>

      <div className="flex flex-col gap-4">
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm" style={{ color: 'var(--text-2)' }}>Orders</span>
            <span style={{ fontWeight: 700, color: 'var(--text-1)' }}>{slot.current_count}/{maxCapacity}</span>
          </div>
          <div style={{ width: '100%', height: '8px', background: 'var(--surface-2)', borderRadius: 'var(--r-full)', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                transition: 'width var(--t-med)',
                background: statusColor,
                width: `${Math.min(percentage, 100)}%`
              }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--sp-2)', textAlign: 'center' }}>
          <div style={{ padding: '8px', background: 'var(--surface-2)', borderRadius: 'var(--r-sm)' }}>
            <p className="text-xs" style={{ color: 'var(--text-3)', marginBottom: '2px' }}>Pending</p>
            <p style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fb923c' }}>{slot.pending_count || 0}</p>
          </div>
          <div style={{ padding: '8px', background: 'var(--surface-2)', borderRadius: 'var(--r-sm)' }}>
            <p className="text-xs" style={{ color: 'var(--text-3)', marginBottom: '2px' }}>Preparing</p>
            <p style={{ fontSize: '1.05rem', fontWeight: 800, color: '#a78bfa' }}>{slot.preparing_count || 0}</p>
          </div>
          <div style={{ padding: '8px', background: 'var(--surface-2)', borderRadius: 'var(--r-sm)' }}>
            <p className="text-xs" style={{ color: 'var(--text-3)', marginBottom: '2px' }}>Ready</p>
            <p style={{ fontSize: '1.05rem', fontWeight: 800, color: '#22c55e' }}>{slot.ready_count || 0}</p>
          </div>
        </div>

        {status === 'overloaded' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: 'rgba(239,68,68,0.1)', borderRadius: 'var(--r-sm)' }}>
            <AlertTriangle size={16} style={{ color: '#ef4444', flexShrink: 0 }} />
            <span className="text-xs" style={{ color: '#ef4444', fontWeight: 500 }}>Slot is overloaded. Consider limiting new orders.</span>
          </div>
        )}
      </div>
    </div>
  );
}

