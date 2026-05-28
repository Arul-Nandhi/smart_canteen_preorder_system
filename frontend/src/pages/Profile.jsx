import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  User, Mail, Phone, Bell, Moon, Sun, ShieldCheck,
  LogOut, History, Edit2, Check, X, Utensils,
  ChevronRight, Star
} from 'lucide-react';

export default function Profile() {
  const { user, logout, updateUser } = useAuth();
  const { theme, toggle, isDark }    = useTheme();
  const navigate                     = useNavigate();

  const [editName, setEditName]   = useState(false);
  const [nameVal, setNameVal]     = useState(user?.name || '');
  const [saving, setSaving]       = useState(false);

  const [notifs, setNotifs] = useState({
    orderUpdates: true,
    queueAlerts:  true,
    promotions:   false,
    weeklyDigest: true,
  });
  const [prefs, setPrefs] = useState({
    veg: false, egg: false, nonVeg: true,
  });

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  const saveName = async () => {
    if (!nameVal.trim() || nameVal.trim().length < 2) {
      toast.error('Name must be at least 2 characters');
      return;
    }
    setSaving(true);
    try {
      await api.patch('/auth/profile/', { name: nameVal.trim() });
      updateUser({ name: nameVal.trim() });
      toast.success('Name updated!');
      setEditName(false);
    } catch {
      toast.error('Could not update name. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.success('Signed out successfully');
  };

  const Toggle = ({ checked, onChange }) => (
    <label className="toggle">
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span className="toggle-slider" />
    </label>
  );

  return (
    <>
      <Navbar />
      <div className="page-wrap" style={{ maxWidth: 840 }}>

        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Profile & Settings</h1>
            <p className="page-subtitle">Manage your account, preferences, and notifications</p>
          </div>
          <button className="btn btn-danger btn-sm" onClick={handleLogout}>
            <LogOut size={15} /> Sign Out
          </button>
        </div>

        {/* Profile Card */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24, flexWrap: 'wrap' }}>
            {/* Avatar */}
            <div style={{ position: 'relative' }}>
              <div className="avatar avatar-xl">{initials}</div>
              <div style={{
                position: 'absolute', bottom: -4, right: -4,
                width: 28, height: 28, borderRadius: '50%',
                background: 'var(--teal)', border: '3px solid var(--surface)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
              }}>
                <Edit2 size={12} color="#0B0F14" />
              </div>
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 200 }}>
              {editName ? (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                  <input
                    className="form-input"
                    style={{ height: 40, maxWidth: 260, fontSize: '1rem', fontWeight: 700 }}
                    value={nameVal}
                    onChange={e => setNameVal(e.target.value)}
                    autoFocus
                    onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditName(false); }}
                  />
                  <button className="btn btn-primary btn-sm" onClick={saveName} disabled={saving}>
                    {saving ? '…' : <Check size={14} />}
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => { setEditName(false); setNameVal(user?.name || ''); }}>
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.3px' }}>
                    {user?.name}
                  </h2>
                  <button className="btn btn-ghost btn-sm" style={{ padding: '4px 8px' }} onClick={() => setEditName(true)}>
                    <Edit2 size={14} />
                  </button>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.875rem', color: 'var(--text-2)' }}>
                  <Mail size={14} /> {user?.email}
                </div>
                {user?.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.875rem', color: 'var(--text-2)' }}>
                    <Phone size={14} /> {user?.phone}
                  </div>
                )}
                <span className={`nav-role-badge role-${user?.role}`} style={{ fontSize: '0.75rem', padding: '3px 10px' }}>
                  {user?.role}
                </span>
              </div>
            </div>

          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

          {/* Appearance */}
          <div className="card">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-1)', marginBottom: 20 }}>
              Appearance
            </h3>
            <div className="toggle-wrap">
              <div className="toggle-info">
                <h4>{isDark ? 'Dark Mode' : 'Light Mode'}</h4>
                <p>Switch between light and dark interface</p>
              </div>
              <Toggle checked={isDark} onChange={toggle} />
            </div>
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-3)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Preview
              </div>
              <div style={{
                display: 'flex', gap: 12,
              }}>
                {[
                  { label: 'Dark', bg: '#0B0F14', surface: '#121923', active: isDark },
                  { label: 'Light', bg: '#F8FAFB', surface: '#FFFFFF', active: !isDark },
                ].map(t => (
                  <button
                    key={t.label}
                    onClick={isDark !== (t.label === 'Dark') ? toggle : undefined}
                    style={{
                      flex: 1, padding: '12px', borderRadius: 10, cursor: 'pointer',
                      background: t.bg, border: `2px solid ${t.active ? '#14D1B2' : 'transparent'}`,
                      transition: 'border-color 0.2s',
                    }}
                  >
                    <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
                      {[0.4, 0.6, 0.3].map((w, i) => (
                        <div key={i} style={{ height: 6, borderRadius: 3, flex: w, background: t.surface }} />
                      ))}
                    </div>
                    <div style={{ height: 24, borderRadius: 6, background: t.surface }} />
                    <div style={{ fontSize: '0.72rem', color: t.active ? '#14D1B2' : '#666', marginTop: 8, fontWeight: 600, textAlign: 'center' }}>
                      {t.active ? '✓ ' : ''}{t.label}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="card">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-1)', marginBottom: 20 }}>
              Notifications
            </h3>
            {[
              { key: 'orderUpdates', title: 'Order Updates',  desc: 'When your order status changes' },
              { key: 'queueAlerts',  title: 'Queue Alerts',   desc: 'Your position in real-time' },
              { key: 'promotions',   title: 'Promotions',     desc: 'Special offers and discounts' },
              { key: 'weeklyDigest', title: 'Weekly Digest',  desc: 'Summary of your activity' },
            ].map(n => (
              <div className="toggle-wrap" key={n.key}>
                <div className="toggle-info">
                  <h4>{n.title}</h4>
                  <p>{n.desc}</p>
                </div>
                <Toggle
                  checked={notifs[n.key]}
                  onChange={() => setNotifs(p => ({ ...p, [n.key]: !p[n.key] }))}
                />
              </div>
            ))}
          </div>

          {/* Meal Preferences */}
          <div className="card">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-1)', marginBottom: 4 }}>
              Meal Preferences
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-2)', marginBottom: 20 }}>
              Customize what you see on the menu
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 12 }}>
              {[
                { key: 'veg',        label: '🥦 Vegetarian' },
                { key: 'egg',        label: '🥚 Eggitarian' },
                { key: 'nonVeg',     label: '🍗 Non-Veg' },
              ].map(p => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setPrefs(prev => ({ ...prev, [p.key]: !prev[p.key] }))}
                  style={{
                    padding: '12px 16px',
                    borderRadius: 10,
                    border: `1.5px solid ${prefs[p.key] ? 'var(--teal)' : 'var(--border)'}`,
                    background: prefs[p.key] ? 'var(--teal-soft)' : 'var(--surface-2)',
                    color: prefs[p.key] ? 'var(--teal)' : 'var(--text-2)',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    fontFamily: 'var(--font-main)',
                    textAlign: 'center',
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="card">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-1)', marginBottom: 20 }}>
              Quick Links
            </h3>
            {[
              { icon: History,      label: 'Order History',     path: '/orders' },
              { icon: Utensils,     label: 'Browse Menu',       path: '/menu' },
              { icon: ShieldCheck,  label: 'Queue Status',      path: '/queue' },
              { icon: Star,         label: 'My Dashboard',      path: '/dashboard' },
            ].map(l => (
              <button
                key={l.label}
                className="btn btn-ghost"
                onClick={() => navigate(l.path)}
                style={{
                  width: '100%', justifyContent: 'space-between',
                  padding: '12px 4px', borderBottom: '1px solid var(--border)',
                  borderRadius: 0, height: 'auto',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-1)' }}>
                  <l.icon size={16} style={{ color: 'var(--teal)' }} />
                  <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{l.label}</span>
                </div>
                <ChevronRight size={16} style={{ color: 'var(--text-3)' }} />
              </button>
            ))}
          </div>
        </div>

        {/* Danger Zone */}
        <div className="card" style={{ marginTop: 20, borderColor: 'rgba(239,68,68,0.2)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#ef4444', marginBottom: 8 }}>
            Danger Zone
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-2)', marginBottom: 16 }}>
            These actions are permanent and cannot be undone.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button className="btn btn-danger btn-sm" onClick={handleLogout}>
              <LogOut size={14} /> Sign Out
            </button>
            <button
              className="btn btn-sm"
              style={{ border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', background: 'transparent' }}
              onClick={() => toast.error('Account deletion requires contacting support.')}
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
