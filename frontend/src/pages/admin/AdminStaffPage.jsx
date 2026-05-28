import { useState, useEffect } from 'react';
import { RefreshCw, Plus, Trash2, X, Clock, Users } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import api from '../../services/api';
import toast from 'react-hot-toast';

const STAFF_ROLES = ['counter', 'head', 'helper'];
const defaultForm = {
  name: '', email: '', phone: '', password: '',
  role: 'staff', staff_role: 'counter',
  shift_start: '08:00', shift_end: '16:00',
};

export default function AdminStaffPage() {
  const [users,    setUsers]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form,     setForm]     = useState(defaultForm);
  const [editing,  setEditing]  = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/auth/users/').catch(() => ({ data: [] }));
      setUsers(res.data.filter(u => u.role === 'staff'));
    } catch { toast.error('Failed to load staff'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        const payload = { ...form };
        if (!payload.password) delete payload.password;
        await api.patch(`/auth/users/${editing.id}/`, payload);
        toast.success('Staff updated!');
      } else {
        await api.post('/auth/users/', form);
        toast.success('Staff member created!');
      }
      setForm(defaultForm); setShowForm(false); setEditing(null); load();
    } catch (err) {
      toast.error(err.response?.data?.email?.[0] || 'Failed to save staff');
    }
  };

  const deleteStaff = async (id) => {
    if (!window.confirm('Delete this staff member?')) return;
    try {
      await api.delete(`/auth/users/${id}/`);
      setUsers(prev => prev.filter(u => u.id !== id));
      toast.success('Staff deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const togglePresent = async (user) => {
    try {
      const res = await api.patch(`/auth/users/${user.id}/`, { is_present: !user.is_present });
      setUsers(prev => prev.map(u => u.id === user.id ? res.data : u));
      toast.success(`${user.name} marked ${res.data.is_present ? 'present' : 'absent'}`);
    } catch { toast.error('Failed to update'); }
  };

  const toggleActiveStatus = async (user) => {
    try {
      const res = await api.patch(`/auth/users/${user.id}/`, { is_active: !user.is_active });
      setUsers(prev => prev.map(u => u.id === user.id ? res.data : u));
      toast.success(`${user.name} is now ${res.data.is_active ? 'Active' : 'Inactive'}`);
    } catch { toast.error('Failed to update status'); }
  };

  const startEdit = (user) => {
    setEditing(user);
    setForm({
      name: user.name, email: user.email, phone: user.phone || '',
      password: '', role: 'staff',
      staff_role: user.staff_role || 'counter',
      shift_start: user.shift_start || '08:00',
      shift_end: user.shift_end || '16:00',
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const roleLabel = { head: 'Head Chef', counter: 'Counter Staff', helper: 'Helper' };

  const present  = users.filter(u => u.is_present).length;
  const active   = users.filter(u => u.is_active !== false).length;

  return (
    <AdminLayout title="Staff Management" subtitle="Manage kitchen staff, roles, shifts, and attendance">

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total Staff',   value: users.length,             color: '#38bdf8' },
          { label: 'Present Today', value: present,                  color: '#22c55e' },
          { label: 'Absent',        value: users.length - present,   color: '#ef4444' },
          { label: 'Active',        value: active,                   color: '#a78bfa' },
        ].map((s, i) => (
          <div key={i} className="admin-card" style={{ padding: '16px 18px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: s.color, letterSpacing: '-1px' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Add / Edit Form */}
      {showForm && (
        <div className="admin-form-panel" style={{ marginBottom: 24 }}>
          <div className="admin-form-panel-header">
            <span className="admin-form-panel-title">
              {editing ? 'Edit Staff Member' : 'Register New Staff Member'}
            </span>
            <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => { setShowForm(false); setEditing(null); }}>
              <X size={14} /> Cancel
            </button>
          </div>
          <div className="admin-form-body">
            <form onSubmit={handleSubmit}>
              <div className="admin-form-grid">
                <div className="admin-form-field">
                  <label className="admin-form-label">Full Name *</label>
                  <input className="admin-input" placeholder="Full Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="admin-form-field">
                  <label className="admin-form-label">Email *</label>
                  <input className="admin-input" type="email" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
                </div>
                <div className="admin-form-field">
                  <label className="admin-form-label">Phone</label>
                  <input className="admin-input" type="tel" placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div className="admin-form-field">
                  <label className="admin-form-label">{editing ? 'New Password (leave blank to keep)' : 'Password *'}</label>
                  <input className="admin-input" type="password" placeholder="Min 6 characters" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required={!editing} />
                </div>
                {/* Role Assignment */}
                <div className="admin-form-field">
                  <label className="admin-form-label">Staff Role</label>
                  <select className="admin-select" value={form.staff_role} onChange={e => setForm({ ...form, staff_role: e.target.value })}>
                    <option value="counter">Counter Staff</option>
                    <option value="head">Head Chef</option>
                    <option value="helper">Helper</option>
                  </select>
                </div>
                {/* Shift Timing */}
                <div className="admin-form-field">
                  <label className="admin-form-label">Shift Start</label>
                  <input className="admin-input" type="time" value={form.shift_start} onChange={e => setForm({ ...form, shift_start: e.target.value })} style={{ colorScheme: 'dark' }} />
                </div>
                <div className="admin-form-field">
                  <label className="admin-form-label">Shift End</label>
                  <input className="admin-input" type="time" value={form.shift_end} onChange={e => setForm({ ...form, shift_end: e.target.value })} style={{ colorScheme: 'dark' }} />
                </div>
              </div>
              <div className="admin-form-actions">
                <button type="submit" className="admin-btn admin-btn-primary">{editing ? 'Update Staff' : 'Create Staff'}</button>
                <button type="button" className="admin-btn admin-btn-secondary" onClick={() => { setShowForm(false); setEditing(null); }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="admin-table-wrap">
        <div className="admin-table-header">
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-1)' }}>Kitchen Staff ({users.length})</div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={load} className="admin-btn admin-btn-ghost admin-btn-sm" style={{ height: 38 }}><RefreshCw size={14} /></button>
            <button onClick={() => { setShowForm(s => !s); setEditing(null); setForm(defaultForm); }} className="admin-btn admin-btn-primary">
              <Plus size={15} /> Add Staff
            </button>
          </div>
        </div>

        {loading ? (
          <div className="admin-empty"><div style={{ width: 36, height: 36, border: '3px solid var(--teal)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto' }} /></div>
        ) : users.length === 0 ? (
          <div className="admin-empty">
            <Users size={32} color="var(--text-3)" style={{ marginBottom: 8, opacity: 0.5 }} />
            <p>No staff members yet</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Staff Member</th>
                  <th>Role</th>
                  <th>Shift</th>
                  <th>Attendance</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 9, background: 'linear-gradient(135deg, var(--teal), #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                          {u.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                        <div>
                          <div className="primary-text">{u.name}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-3)' }}>{u.email}</div>
                          {u.phone && <div style={{ fontSize: '0.7rem', color: 'var(--text-3)' }}>{u.phone}</div>}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`staff-role-badge ${u.staff_role || 'counter'}`}>
                        {roleLabel[u.staff_role] || 'Counter Staff'}
                      </span>
                    </td>
                    <td>
                      {u.shift_start && u.shift_end ? (
                        <span className="staff-shift-badge">
                          <Clock size={11} style={{ display: 'inline', marginRight: 3 }} />
                          {u.shift_start?.slice(0,5)} – {u.shift_end?.slice(0,5)}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-3)', fontSize: '0.78rem' }}>Not set</span>
                      )}
                    </td>
                    <td>
                      <span className={`admin-badge ${u.is_present ? 'admin-badge-green' : 'admin-badge-red'}`}>
                        {u.is_present ? '● Present' : '○ Absent'}
                      </span>
                    </td>
                    <td>
                      <span className={`admin-badge ${u.is_active !== false ? 'admin-badge-teal' : 'admin-badge-yellow'}`}>
                        {u.is_active !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                        <button onClick={() => startEdit(u)} className="admin-btn admin-btn-secondary admin-btn-sm">Edit</button>
                        <button onClick={() => togglePresent(u)} className="admin-btn admin-btn-ghost admin-btn-sm">
                          {u.is_present ? 'Absent' : 'Present'}
                        </button>
                        <button onClick={() => toggleActiveStatus(u)} className="admin-btn admin-btn-ghost admin-btn-sm">
                          {u.is_active !== false ? 'Deactivate' : 'Activate'}
                        </button>
                        <button onClick={() => deleteStaff(u.id)} className="admin-btn admin-btn-danger admin-btn-sm"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
