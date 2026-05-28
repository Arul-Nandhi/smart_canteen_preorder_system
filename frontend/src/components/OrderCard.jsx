import { Clock, Users } from 'lucide-react';

const STATUS_BADGE = {
  pending: 'yellow',
  confirmed: 'blue',
  preparing: 'purple',
  ready: 'green',
  completed: 'teal',
  cancelled: 'red'
};

const STATUS_LABEL = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready: 'Ready',
  completed: 'Completed',
  cancelled: 'Cancelled'
};

export default function OrderCard({ order, onAction, showActions = true }) {
  const badgeClass = STATUS_BADGE[order.order_status] || 'blue';
  
  return (
    <div className="dash-card">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-1)' }}>Order #{order.id}</h4>
          <p className="text-xs" style={{ color: 'var(--text-3)', marginTop: '2px' }}>{order.user?.name || 'Unknown'}</p>
        </div>
        <span className={`dash-badge ${badgeClass}`}>
          {STATUS_LABEL[order.order_status] || 'Unknown'}
        </span>
      </div>

      <div className="flex flex-col gap-2 mb-4 pb-4 border-b border-border">
        {order.items?.map((item, i) => (
          <div key={i} className="flex justify-between text-sm">
            <span style={{ color: 'var(--text-2)' }}>{item.item?.item_name || 'Item'}</span>
            <span style={{ color: 'var(--text-3)' }}>x{item.quantity}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }} className="text-xs">
        <div className="flex items-center gap-2" style={{ color: 'var(--text-3)' }}>
          <Clock size={16} />
          <span>{order.slot?.slot_time || 'N/A'}</span>
        </div>
        <div className="flex items-center gap-2" style={{ color: 'var(--text-3)' }}>
          <Users size={16} />
          <span>{order.slot?.slot_date || 'N/A'}</span>
        </div>
      </div>

      {order.special_instructions && (
        <div className="mb-4 p-3 bg-surface-2 rounded-lg">
          <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-3)' }}>Special Instructions</p>
          <p className="text-sm" style={{ color: 'var(--text-2)' }}>{order.special_instructions}</p>
        </div>
      )}

      {showActions && (
        <div className="flex gap-2">
          <button
            onClick={() => onAction?.('view', order.id)}
            className="flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition"
            style={{ background: 'var(--teal-soft)', color: 'var(--teal)' }}
          >
            View Details
          </button>
          <button
            onClick={() => onAction?.('update', order.id)}
            className="flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition"
            style={{ background: 'rgba(56,189,248,0.12)', color: '#38bdf8' }}
          >
            Update Status
          </button>
        </div>
      )}
    </div>
  );
}

