import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, Activity, Clock, CheckCircle2, ShieldAlert } from 'lucide-react';
import StaffLayout from '../../components/StaffLayout';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function StaffStatusPage() {
  const [q, setQ] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get('/queue/status/');
      setQ(r.data);
      setLastUpdate(new Date());
    } catch {
      toast.error('Failed to load queue status');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, [load]);

  const traffic = q?.overloaded ? 'red' : (q?.active_orders ?? 0) > 6 ? 'yellow' : 'green';
  const trafficLabel = q?.overloaded ? 'Overloaded (Delays)' : (q?.active_orders ?? 0) > 6 ? 'Moderate Rush' : 'Smooth Flow';
  const trafficColor = traffic === 'red' ? '#ef4444' : traffic === 'yellow' ? '#eab308' : '#22c55e';

  return (
    <StaffLayout title="Queue Status" subtitle="Bottle-neck analysis and kitchen bandwidth monitor">
      <div className="dash-page">
        
        {/* Header */}
        <div className="dash-welcome" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-1)', margin: '0 0 6px 0' }}>Kitchen Capacity Status</h1>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-3)' }}>
              Real-time bottleneck analysis and active order load trackers
            </p>
          </div>
          <button onClick={load} className="dash-btn dash-btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 6 }} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'spin' : ''} /> Update Status
          </button>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
          {[
            { 
              label: 'Kitchen Traffic', 
              icon: <Activity size={18} style={{ color: trafficColor }} />,
              content: (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
                  <span style={{ height: 10, width: 10, borderRadius: '50%', background: trafficColor, display: 'inline-block', boxShadow: `0 0 8px ${trafficColor}` }} />
                  <span style={{ fontSize: '1.1rem', fontWeight: 800, color: trafficColor }}>{trafficLabel}</span>
                </div>
              )
            },
            { 
              label: 'Active Queue Orders', 
              icon: <Clock size={18} style={{ color: '#fb923c' }} />,
              value: q?.active_orders ?? 0, 
              color: '#fb923c',
              subtitle: 'Orders being cooked right now'
            },
            { 
              label: 'Overloaded Flag', 
              icon: <ShieldAlert size={18} style={{ color: q?.overloaded ? '#ef4444' : '#22c55e' }} />,
              value: q?.overloaded ? 'YES' : 'NO', 
              color: q?.overloaded ? '#ef4444' : '#22c55e',
              subtitle: 'Wait delay greater than 20 mins'
            },
            { 
              label: 'Est. Prep Time Buffer', 
              icon: <CheckCircle2 size={18} style={{ color: 'var(--teal)' }} />,
              value: `${q?.estimated_wait_mins ?? 0} Mins`, 
              color: 'var(--teal)',
              subtitle: 'Projected collection wait time'
            },
          ].map((item, i) => (
            <div key={i} className="dash-card" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderLeft: i === 0 ? `3px solid ${trafficColor}` : 'none' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{item.label}</span>
                  {item.icon}
                </div>
                {item.content || (
                  <div style={{ fontSize: '2rem', fontWeight: 900, color: item.color, letterSpacing: '-1px' }}>{item.value}</div>
                )}
              </div>
              {item.subtitle && (
                <div style={{ fontSize: '0.68rem', color: 'var(--text-3)', marginTop: 10 }}>{item.subtitle}</div>
              )}
            </div>
          ))}
        </div>

        {/* Detailed Insights */}
        <div className="dash-card" style={{ padding: 24 }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', fontWeight: 800, color: 'var(--text-1)' }}>Capacity Suggestions</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', gap: 12, padding: '12px 16px', background: 'var(--surface-3)', borderRadius: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 6, background: 'rgba(20,209,178,0.1)' }}>
                <ShieldAlert size={16} color="var(--teal)" />
              </div>
              <div>
                <h5 style={{ margin: '0 0 4px 0', fontSize: '0.83rem', fontWeight: 700, color: 'var(--text-2)' }}>Keep your display monitors open</h5>
                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-3)', lineHeight: 1.4 }}>
                  Ensure your Canteen Live Display Board is visible in the campus dining hall. When order tokens change to "READY", students will immediately get notified, preventing counter congestion.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, padding: '12px 16px', background: 'var(--surface-3)', borderRadius: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 6, background: 'rgba(20,209,178,0.1)' }}>
                <Clock size={16} color="var(--teal)" />
              </div>
              <div>
                <h5 style={{ margin: '0 0 4px 0', fontSize: '0.83rem', fontWeight: 700, color: 'var(--text-2)' }}>Average cooking speed</h5>
                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-3)', lineHeight: 1.4 }}>
                  Estimated preparation averages are calculated dynamically at roughly 8 minutes per slot order. Ensure you mark items complete as soon as they leave the stove to keep averages precise.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </StaffLayout>
  );
}
