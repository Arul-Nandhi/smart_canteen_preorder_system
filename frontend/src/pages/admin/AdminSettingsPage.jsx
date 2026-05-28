import { useState } from 'react';
import { Save, Shield, Bell, Palette, LogOut } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function AdminSettingsPage() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [canteenName, setCanteenName] = useState('Smart Canteen');
  const [maxQueueSize, setMaxQueueSize] = useState(50);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    await new Promise(r => setTimeout(r, 600));
    setSaving(false);
    toast.success('Settings saved!');
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
    navigate('/login');
  };

  const CardSection = ({ icon: Icon, title, children }) => (
    <div className="admin-card" style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--teal-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--teal)' }}>
          <Icon size={18} />
        </div>
        <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-1)' }}>{title}</div>
      </div>
      {children}
    </div>
  );

  const ToggleRow = ({ label, desc, checked, onChange }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
      <div>
        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-1)' }}>{label}</div>
        {desc && <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: 2 }}>{desc}</div>}
      </div>
      <label style={{ position: 'relative', width: 44, height: 24, cursor: 'pointer', flexShrink: 0 }}>
        <input type="checkbox" checked={checked} onChange={onChange} style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }} />
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          borderRadius: 999, background: checked ? 'var(--teal)' : 'var(--border)',
          transition: 'background 0.2s',
        }} />
        <div style={{
          position: 'absolute', top: 3, left: checked ? 23 : 3,
          width: 18, height: 18, borderRadius: '50%', background: '#fff',
          transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
        }} />
      </label>
    </div>
  );

  return (
    <AdminLayout title="Settings" subtitle="Configure your admin portal preferences">
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <form onSubmit={handleSave}>

          {/* Admin Profile */}
          <CardSection icon={Shield} title="Admin Profile">
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, padding: '14px 16px', background: 'var(--surface-2)', borderRadius: 12 }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: 'linear-gradient(135deg, var(--teal), #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'AD'}
              </div>
              <div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-1)' }}>{user?.name || 'Admin'}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-3)', marginTop: 2 }}>{user?.email || ''}</div>
                <span className="admin-badge admin-badge-purple" style={{ marginTop: 6, display: 'inline-flex' }}>Administrator</span>
              </div>
            </div>
            <div className="admin-form-grid">
              <div className="admin-form-field">
                <label className="admin-form-label">Canteen Name</label>
                <input className="admin-input" value={canteenName} onChange={e => setCanteenName(e.target.value)} placeholder="Smart Canteen" />
              </div>
              <div className="admin-form-field">
                <label className="admin-form-label">Default Max Queue Size</label>
                <input className="admin-input" type="number" value={maxQueueSize} onChange={e => setMaxQueueSize(+e.target.value)} min={1} />
              </div>
            </div>
          </CardSection>

          {/* Appearance */}
          <CardSection icon={Palette} title="Appearance">
            <ToggleRow
              label="Dark Mode"
              desc="Toggle between dark and light theme"
              checked={theme === 'dark'}
              onChange={toggle}
            />
          </CardSection>

          {/* Notifications */}
          <CardSection icon={Bell} title="Notification Preferences">
            <ToggleRow
              label="Auto Refresh Dashboard"
              desc="Automatically refresh queue data every 8 seconds"
              checked={autoRefresh}
              onChange={e => setAutoRefresh(e.target.checked)}
            />
            <ToggleRow
              label="Overload Alerts"
              desc="Show alerts when a slot exceeds 90% capacity"
              checked={true}
              onChange={() => {}}
            />
          </CardSection>

          {/* Save button */}
          <button type="submit" className="admin-btn admin-btn-primary" style={{ width: '100%', height: 44 }} disabled={saving}>
            {saving ? (
              <><div style={{ width: 14, height: 14, border: '2px solid rgba(11,15,20,0.3)', borderTopColor: '#0B0F14', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Saving…</>
            ) : (
              <><Save size={15} /> Save Settings</>
            )}
          </button>
        </form>

        {/* Danger Zone */}
        <div className="admin-card" style={{ marginTop: 24, borderColor: 'rgba(239,68,68,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ef4444' }}>Danger Zone</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-1)' }}>Sign out of Admin Panel</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: 2 }}>You will be redirected to the login page</div>
            </div>
            <button onClick={handleLogout} className="admin-btn admin-btn-danger">
              <LogOut size={15} /> Sign Out
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
