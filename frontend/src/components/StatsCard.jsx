import { TrendingUp, TrendingDown } from 'lucide-react';

const COLORS = {
  'lime-main':  { text: 'var(--teal)', bg: 'var(--teal-soft)' },
  'blue-500':   { text: '#38bdf8', bg: 'rgba(14,165,233,0.12)' },
  'orange-500': { text: '#fb923c', bg: 'rgba(249,115,22,0.12)' },
  'green-500':  { text: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
  'purple-500': { text: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
};

export default function StatsCard({ icon: Icon, label, value, trend, color = 'lime-main', onClick }) {
  const c = COLORS[color] || COLORS['lime-main'];
  
  return (
    <div
      onClick={onClick}
      className="dash-card flex flex-col justify-between"
      style={{ cursor: onClick ? 'pointer' : 'default', height: '100%' }}
    >
      <div className="flex items-start justify-between mb-4">
        <div style={{ padding: '12px', borderRadius: 'var(--r-sm)', background: c.bg, display: 'flex', color: c.text }}>
          <Icon size={24} />
        </div>
        {trend && (
          <div className="flex items-center gap-1 text-sm font-semibold" style={{ color: trend > 0 ? '#22c55e' : '#ef4444' }}>
            {trend > 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div>
        <h3 className="dash-stat-label" style={{ marginBottom: '4px' }}>{label}</h3>
        <p className="dash-stat-value">{value}</p>
      </div>
    </div>
  );
}

