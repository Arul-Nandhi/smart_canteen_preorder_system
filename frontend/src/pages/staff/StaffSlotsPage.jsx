import { useState, useEffect } from 'react';
import { RefreshCw, Plus, X, Trash2, Calendar, HelpCircle, AlertCircle } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import api from '../../services/api';
import toast from 'react-hot-toast';

const defaultForm = { slot_date: new Date().toISOString().split('T')[0], start_time: '', end_time: '', max_orders: 50 };

export default function StaffSlotsPage() {
  const [slots, setSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(defaultForm);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/slots/?date=${selectedDate}`);
      setSlots(res.data);
    } catch {
      toast.error('Failed to load active slots');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [selectedDate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/slots/', form);
      toast.success('Custom preorder window added!');
      setForm({ ...defaultForm, slot_date: selectedDate });
      setShowForm(false);
      load();
    } catch {
      toast.error('Failed to add custom window');
    }
  };

  const deleteSlot = async (id) => {
    if (!window.confirm('Delete this preorder slot window?')) return;
    try {
      await api.delete(`/slots/${id}/`);
      setSlots(prev => prev.filter(s => s.id !== id));
      toast.success('Slot window deleted');
    } catch {
      toast.error('Failed to delete slot');
    }
  };

  const toggleSlot = async (slot) => {
    try {
      const res = await api.put(`/slots/${slot.id}/`, { ...slot, slot_status: slot.slot_status === 'open' ? 'closed' : 'open' });
      setSlots(prev => prev.map(s => s.id === slot.id ? res.data : s));
      toast.success(`Slot is now ${res.data.slot_status === 'open' ? 'Open' : 'Closed'}`);
    } catch {
      toast.error('Failed to update slot status');
    }
  };

  const active = slots.filter(s => s.slot_status === 'open').length;

  return (
    <DashboardLayout>
      <div className="dash-page" style={{ padding: 24 }}>

        {/* Header */}
        <div className="dash-welcome" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-1)', margin: '0 0 6px 0' }}>Preorder Slot Manager</h1>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-3)' }}>
              Configure peak break time schedules, adjust hourly student capacity caps, and open/close windows
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={load} className="dash-btn dash-btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <RefreshCw size={14} className={loading ? 'spin' : ''} /> Sync
            </button>
            <button onClick={() => setShowForm(s => !s)} className="dash-btn dash-btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Plus size={15} /> Add Custom Window
            </button>
          </div>
        </div>

        {/* Info Box */}
        <div className="dash-card" style={{ display: 'flex', gap: 16, borderLeft: '4px solid var(--teal)', background: 'rgba(20, 209, 178, 0.02)', padding: '16px 20px', marginBottom: 24 }}>
          <HelpCircle size={20} style={{ color: 'var(--teal)', flexShrink: 0, marginTop: 2 }} />
          <div>
            <h4 style={{ margin: '0 0 4px', fontSize: '0.83rem', fontWeight: 700, color: 'var(--text-1)' }}>Dynamically Auto-Generated Breaks</h4>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-3)', lineHeight: 1.4 }}>
              Morning break (10:30), Lunch (12:30), Tea break (15:30), and Dinner (18:00) are automatically mapped every day. 
              As staff, you can close specific hours if the kitchen is overloaded or override capacity thresholds here.
            </p>
          </div>
        </div>

        {/* Date Filter Panel */}
        <div className="dash-card" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, padding: '16px 20px' }}>
          <Calendar size={16} style={{ color: 'var(--text-3)' }} />
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-2)' }}>Select Date:</span>
          <input 
            type="date" 
            className="admin-input" 
            value={selectedDate} 
            onChange={e => setSelectedDate(e.target.value)}
            style={{ width: 160, padding: '6px 12px', colorScheme: 'dark', margin: 0, background: 'var(--surface-3)', border: '1px solid var(--border)', color: 'var(--text-1)' }}
          />
        </div>

        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14, marginBottom: 24 }}>
          {[
            { label: 'Active Slots Today', value: slots.length, color: '#38bdf8' },
            { label: 'Accepting Preorders', value: active, color: '#22c55e' },
            { label: 'Closed / Full Slots', value: slots.length - active, color: '#ef4444' },
          ].map((s, i) => (
            <div key={i} className="dash-card" style={{ padding: '16px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>{s.label}</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: s.color, letterSpacing: '-1px' }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Form panel */}
        {showForm && (
          <div className="admin-form-panel" style={{ marginBottom: 28 }}>
            <div className="admin-form-panel-header">
              <span className="admin-form-panel-title">Add Custom Pickup Window</span>
              <button className="dash-btn dash-btn-ghost" onClick={() => setShowForm(false)} style={{ height: 28, padding: '0 10px', fontSize: '0.75rem' }}><X size={12} /> Cancel</button>
            </div>
            <div className="admin-form-body">
              <form onSubmit={handleSubmit}>
                <div className="admin-form-grid">
                  <div className="admin-form-field">
                    <label className="admin-form-label">Date</label>
                    <input className="admin-input" type="date" value={form.slot_date} onChange={e => setForm({ ...form, slot_date: e.target.value })} required style={{ colorScheme: 'dark' }} />
                  </div>
                  <div className="admin-form-field">
                    <label className="admin-form-label">Start Time</label>
                    <input className="admin-input" type="time" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} required style={{ colorScheme: 'dark' }} />
                  </div>
                  <div className="admin-form-field">
                    <label className="admin-form-label">End Time</label>
                    <input className="admin-input" type="time" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} required style={{ colorScheme: 'dark' }} />
                  </div>
                  <div className="admin-form-field">
                    <label className="admin-form-label">Max Order Cap</label>
                    <input className="admin-input" type="number" value={form.max_orders} onChange={e => setForm({ ...form, max_orders: +e.target.value })} min={1} required />
                  </div>
                </div>
                <div className="admin-form-actions" style={{ marginTop: 20 }}>
                  <button type="submit" className="dash-btn dash-btn-primary" style={{ padding: '8px 20px', fontWeight: 800 }}>Create Window</button>
                  <button type="button" className="dash-btn dash-btn-ghost" onClick={() => setShowForm(false)} style={{ padding: '8px 16px' }}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Slot capacity cards grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
          {slots.length === 0 ? (
            <div className="admin-empty" style={{ gridColumn: '1 / -1', padding: '80px 20px', border: '1.5px dashed var(--border)', borderRadius: 16 }}>
              <AlertCircle size={28} style={{ color: 'var(--text-3)', marginBottom: 8 }} />
              <p>No slot windows configured for this date.</p>
            </div>
          ) : (
            slots.map(slot => {
              const pct = Math.min(100, Math.round(((slot.current_orders || 0) / slot.max_orders) * 100));
              const barColor = pct > 90 ? '#ef4444' : pct > 60 ? '#eab308' : '#22c55e';
              const isOpen = slot.slot_status === 'open';

              return (
                <div key={slot.id} className="dash-card" style={{ padding: 20, position: 'relative', overflow: 'hidden', opacity: isOpen ? 1 : 0.75 }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: isOpen ? 'var(--teal)' : 'var(--border)' }} />
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                    <div>
                      <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-1)', margin: 0 }}>
                        {slot.start_time?.slice(0, 5)} – {slot.end_time?.slice(0, 5)}
                      </h3>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-3)', display: 'block', marginTop: 4 }}>Date: {slot.slot_date}</span>
                    </div>
                    <span className={`dash-badge ${isOpen ? 'teal' : 'yellow'}`} style={{ fontSize: '0.68rem', fontWeight: 700 }}>
                      {isOpen ? 'Active' : 'Suspended'}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.72rem', color: 'var(--text-3)' }}>
                      <span>Preorder load</span>
                      <span style={{ color: barColor, fontWeight: 700 }}>{slot.current_orders || 0} / {slot.max_orders}</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 999, background: 'var(--surface-2)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: 999 }} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => toggleSlot(slot)} className="dash-btn" style={{ flex: 1, height: 32, fontSize: '0.75rem', padding: 0, background: isOpen ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.08)', color: isOpen ? '#ef4444' : '#22c55e', border: 'none' }}>
                      {isOpen ? 'Close Slot' : 'Open Slot'}
                    </button>
                    <button onClick={() => deleteSlot(slot.id)} className="dash-btn" style={{ height: 32, width: 32, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none' }}>✕</button>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </DashboardLayout>
  );
}
