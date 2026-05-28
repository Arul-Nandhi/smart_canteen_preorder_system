import { useState } from 'react';
import StaffLayout from '../../components/StaffLayout';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  User, Mail, Phone, Edit2, Check, X, Shield,
  MapPin, Clock, Bell, Moon, Sun, Lock, Eye, EyeOff,
  ChevronRight, Activity, LogOut
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/* ─── Small reusable toggle ─────────────────────────────────── */
function Toggle({ checked, onChange }) {
  return (
    <label className="toggle">
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span className="toggle-slider" />
    </label>
  );
}

/* ─── Field row (view mode) ─────────────────────────────────── */
function InfoRow({ icon: Icon, label, value }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      background: 'var(--surface-3)', padding: '10px 14px',
      borderRadius: 10, minWidth: 0,
    }}>
      <Icon size={16} color="var(--teal)" style={{ flexShrink: 0 }} />
      <div style={{ minWidth: 0 }}>
        <span style={{ fontSize: '0.65rem', color: 'var(--text-3)', display: 'block', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.4px' }}>
          {label}
        </span>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-1)', fontWeight: 700, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {value || <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>Not set</span>}
        </span>
      </div>
    </div>
  );
}

/* ─── Labelled input ─────────────────────────────────────────── */
function Field({ label, children }) {
  return (
    <div>
      <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 5 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════ */
export default function StaffSettingsPage() {
  const { user, updateUser, logout } = useAuth();
  const { isDark, toggle: toggleTheme } = useTheme();
  const navigate = useNavigate();

  /* ── Profile edit ─────────────────────────────── */
  const [editMode, setEditMode]   = useState(false);
  const [nameVal, setNameVal]     = useState(user?.name || '');
  const [phoneVal, setPhoneVal]   = useState(user?.phone || '');
  const [deptVal, setDeptVal]     = useState(user?.department || '');
  const [shiftStart, setShiftStart] = useState(user?.shift_start || '');
  const [shiftEnd, setShiftEnd]     = useState(user?.shift_end || '');
  const [saving, setSaving]       = useState(false);

  /* ── Password change ──────────────────────────── */
  const [pwSection, setPwSection]   = useState(false);
  const [currentPw, setCurrentPw]   = useState('');
  const [newPw, setNewPw]           = useState('');
  const [confirmPw, setConfirmPw]   = useState('');
  const [showCur, setShowCur]       = useState(false);
  const [showNew, setShowNew]       = useState(false);
  const [savingPw, setSavingPw]     = useState(false);

  /* ── Operational toggles ──────────────────────── */
  const [sound, setSound]           = useState(true);
  const [autoAdvance, setAutoAdvance] = useState(false);
  const [notifOrders, setNotifOrders] = useState(true);
  const [notifReady,  setNotifReady]  = useState(true);

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  const STAFF_ROLE_LABELS = {
    head_chef: 'Head Chef',
    counter:   'Counter Staff',
    helper:    'Helper',
  };

  /* ── Save profile ─────────────────────────────── */
  const saveProfile = async () => {
    if (!nameVal.trim() || nameVal.trim().length < 2) {
      toast.error('Name must be at least 2 characters');
      return;
    }
    if (phoneVal && !/^\d{7,15}$/.test(phoneVal.trim())) {
      toast.error('Enter a valid phone number (7–15 digits)');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name:        nameVal.trim(),
        phone:       phoneVal.trim(),
        department:  deptVal.trim(),
        shift_start: shiftStart || null,
        shift_end:   shiftEnd   || null,
      };
      const res = await api.patch('/auth/profile/', payload);
      updateUser(res.data);
      toast.success('Profile updated successfully!');
      setEditMode(false);
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setNameVal(user?.name || '');
    setPhoneVal(user?.phone || '');
    setDeptVal(user?.department || '');
    setShiftStart(user?.shift_start || '');
    setShiftEnd(user?.shift_end || '');
    setEditMode(false);
  };

  /* ── Save password ────────────────────────────── */
  const savePassword = async () => {
    if (!currentPw || !newPw || !confirmPw) {
      toast.error('Please fill in all password fields');
      return;
    }
    if (newPw.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    if (newPw !== confirmPw) {
      toast.error('New passwords do not match');
      return;
    }
    setSavingPw(true);
    try {
      await api.patch('/auth/profile/', { current_password: currentPw, new_password: newPw });
      toast.success('Password changed successfully!');
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
      setPwSection(false);
    } catch (err) {
      const msg = err?.response?.data?.current_password?.[0] || err?.response?.data?.detail || 'Failed to change password';
      toast.error(msg);
    } finally {
      setSavingPw(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.success('Signed out');
  };

  /* ─────────────────────────────────────────────────────────── */
  return (
    <StaffLayout title="Settings" subtitle="Manage your profile, shift details, and operational preferences">
      <div style={{ maxWidth: 820, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 28 }}>

        {/* ══ PROFILE CARD ══════════════════════════════════════ */}
        <section>
          <h2 className="dash-section-title" style={{ marginBottom: 14 }}>My Profile</h2>

          <div className="admin-card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24, flexWrap: 'wrap' }}>

              {/* Avatar */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{
                  width: 86, height: 86, borderRadius: 20,
                  background: 'linear-gradient(135deg, var(--teal), #7c3aed)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.9rem', fontWeight: 800, color: '#fff',
                  boxShadow: '0 8px 24px rgba(20,209,178,0.25)',
                }}>
                  {initials}
                </div>
                {/* Edit toggle button on avatar */}
                <button
                  onClick={() => editMode ? cancelEdit() : setEditMode(true)}
                  title={editMode ? 'Cancel edit' : 'Edit profile'}
                  style={{
                    position: 'absolute', bottom: -6, right: -6,
                    width: 30, height: 30, borderRadius: '50%',
                    background: editMode ? '#ef4444' : 'var(--teal)',
                    border: '3px solid var(--surface)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    transition: 'background 0.2s, transform 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.12)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  {editMode ? <X size={13} color="#fff" /> : <Edit2 size={13} color="#0B0F14" />}
                </button>
              </div>

              {/* Info / Edit form */}
              <div style={{ flex: 1, minWidth: 240 }}>

                {editMode ? (
                  /* ── Edit Form ── */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <Field label="Full name">
                      <input
                        className="admin-input"
                        value={nameVal}
                        onChange={e => setNameVal(e.target.value)}
                        placeholder="Your full name"
                        autoFocus
                        style={{ height: 38, fontSize: '0.9rem' }}
                        onKeyDown={e => { if (e.key === 'Enter') saveProfile(); if (e.key === 'Escape') cancelEdit(); }}
                      />
                    </Field>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <Field label="Contact number">
                        <input
                          className="admin-input"
                          value={phoneVal}
                          onChange={e => setPhoneVal(e.target.value)}
                          placeholder="e.g. 9876543210"
                          style={{ height: 38, fontSize: '0.9rem' }}
                          type="tel"
                        />
                      </Field>
                      <Field label="Department / counter">
                        <input
                          className="admin-input"
                          value={deptVal}
                          onChange={e => setDeptVal(e.target.value)}
                          placeholder="e.g. Main Counter"
                          style={{ height: 38, fontSize: '0.9rem' }}
                        />
                      </Field>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <Field label="Shift start time">
                        <input
                          className="admin-input"
                          type="time"
                          value={shiftStart}
                          onChange={e => setShiftStart(e.target.value)}
                          style={{ height: 38, fontSize: '0.9rem' }}
                        />
                      </Field>
                      <Field label="Shift end time">
                        <input
                          className="admin-input"
                          type="time"
                          value={shiftEnd}
                          onChange={e => setShiftEnd(e.target.value)}
                          style={{ height: 38, fontSize: '0.9rem' }}
                        />
                      </Field>
                    </div>

                    <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
                      <button
                        onClick={saveProfile}
                        disabled={saving}
                        className="admin-btn admin-btn-primary admin-btn-sm"
                        style={{ gap: 5, paddingLeft: 14, paddingRight: 14 }}
                      >
                        {saving ? <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} /> : <Check size={14} />}
                        Save changes
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="admin-btn admin-btn-ghost admin-btn-sm"
                        style={{ paddingLeft: 14, paddingRight: 14 }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>

                ) : (
                  /* ── View Mode ── */
                  <>
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
                        <h2 style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--text-1)', margin: 0, letterSpacing: '-0.3px' }}>
                          {user?.name || 'Staff Member'}
                        </h2>
                        {user?.staff_role && (
                          <span className="badge badge-teal" style={{ fontSize: '0.68rem', padding: '3px 9px', textTransform: 'none' }}>
                            {STAFF_ROLE_LABELS[user.staff_role] || user.staff_role}
                          </span>
                        )}
                      </div>
                      <p style={{ margin: 0, color: 'var(--text-3)', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Mail size={13} /> {user?.email}
                      </p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10 }}>
                      <InfoRow icon={Phone}  label="Contact"    value={user?.phone} />
                      <InfoRow icon={MapPin} label="Department" value={user?.department} />
                      <InfoRow icon={Clock}  label="Shift start" value={user?.shift_start
                        ? new Date(`1970-01-01T${user.shift_start}`).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                        : null} />
                      <InfoRow icon={Clock}  label="Shift end" value={user?.shift_end
                        ? new Date(`1970-01-01T${user.shift_end}`).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                        : null} />
                    </div>

                    <button
                      onClick={() => setEditMode(true)}
                      style={{
                        marginTop: 16, display: 'inline-flex', alignItems: 'center', gap: 6,
                        fontSize: '0.78rem', fontWeight: 700, color: 'var(--teal)',
                        background: 'rgba(20,209,178,0.08)', border: '1px solid rgba(20,209,178,0.2)',
                        borderRadius: 8, padding: '6px 14px', cursor: 'pointer',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(20,209,178,0.16)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(20,209,178,0.08)'}
                    >
                      <Edit2 size={13} /> Edit profile
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ══ PASSWORD CHANGE ═══════════════════════════════════ */}
        <section>
          <h2 className="dash-section-title" style={{ marginBottom: 14 }}>Change Password</h2>
          <div className="admin-card" style={{ padding: 24 }}>
            {!pwSection ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <p style={{ margin: '0 0 4px', fontWeight: 700, color: 'var(--text-1)', fontSize: '0.9rem' }}>Password</p>
                  <p style={{ margin: 0, color: 'var(--text-3)', fontSize: '0.8rem' }}>Keep your account secure with a strong password</p>
                </div>
                <button
                  onClick={() => setPwSection(true)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '7px 14px', borderRadius: 8, fontSize: '0.8rem', fontWeight: 700,
                    background: 'var(--surface-3)', color: 'var(--text-2)',
                    border: '1px solid var(--border)', cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                >
                  <Lock size={13} /> Change password
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 400 }}>
                {[
                  { label: 'Current password', val: currentPw, set: setCurrentPw, show: showCur, toggle: () => setShowCur(v => !v) },
                  { label: 'New password',     val: newPw,     set: setNewPw,     show: showNew, toggle: () => setShowNew(v => !v) },
                  { label: 'Confirm new password', val: confirmPw, set: setConfirmPw, show: showNew, toggle: null },
                ].map(({ label, val, set, show, toggle }) => (
                  <Field key={label} label={label}>
                    <div style={{ position: 'relative' }}>
                      <input
                        className="admin-input"
                        type={show ? 'text' : 'password'}
                        value={val}
                        onChange={e => set(e.target.value)}
                        placeholder="••••••••"
                        style={{ height: 38, paddingRight: toggle ? 38 : 12, fontSize: '0.9rem' }}
                      />
                      {toggle && (
                        <button
                          type="button"
                          onClick={toggle}
                          style={{ position: 'absolute', right: 10, top: 10, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 0 }}
                        >
                          {show ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      )}
                    </div>
                  </Field>
                ))}
                {newPw && confirmPw && newPw !== confirmPw && (
                  <p style={{ fontSize: '0.75rem', color: '#ef4444', margin: 0 }}>Passwords do not match</p>
                )}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={savePassword}
                    disabled={savingPw}
                    className="admin-btn admin-btn-primary admin-btn-sm"
                    style={{ gap: 5 }}
                  >
                    {savingPw ? '...' : <><Check size={14} /> Update password</>}
                  </button>
                  <button
                    onClick={() => { setPwSection(false); setCurrentPw(''); setNewPw(''); setConfirmPw(''); }}
                    className="admin-btn admin-btn-ghost admin-btn-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ══ OPERATIONS & APPEARANCE ═══════════════════════════ */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>

          {/* Operational preferences */}
          <section>
            <h2 className="dash-section-title" style={{ marginBottom: 14 }}>Operational preferences</h2>
            <div className="admin-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 0 }}>
              {[
                {
                  icon: Bell,
                  title: 'Order alert sounds',
                  desc: 'Play an audio chime for new incoming orders on the kitchen desk',
                  val: sound,
                  set: setSound,
                },
                {
                  icon: Activity,
                  title: 'Auto-advance status',
                  desc: 'Auto-move orders from preparing → ready after an estimated countdown',
                  val: autoAdvance,
                  set: setAutoAdvance,
                },
                {
                  icon: Bell,
                  title: 'New order notifications',
                  desc: 'Push notification badge for every new order placed',
                  val: notifOrders,
                  set: setNotifOrders,
                },
                {
                  icon: Bell,
                  title: 'Ready-for-pickup alerts',
                  desc: 'Alert when a preorder is ready and awaiting student',
                  val: notifReady,
                  set: setNotifReady,
                },
              ].map((item, i, arr) => {
                const Icon = item.icon;
                return (
                  <div
                    key={i}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      paddingTop: i === 0 ? 0 : 16, paddingBottom: i < arr.length - 1 ? 16 : 0,
                      borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
                      gap: 16,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flex: 1 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(20,209,178,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                        <Icon size={15} color="var(--teal)" />
                      </div>
                      <div>
                        <p style={{ margin: '0 0 2px', fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-1)' }}>{item.title}</p>
                        <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--text-3)', lineHeight: 1.4 }}>{item.desc}</p>
                      </div>
                    </div>
                    <Toggle checked={item.val} onChange={e => item.set(e.target.checked)} />
                  </div>
                );
              })}
            </div>
          </section>

          {/* Appearance */}
          <section>
            <h2 className="dash-section-title" style={{ marginBottom: 14 }}>Appearance</h2>
            <div className="admin-card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <p style={{ margin: '0 0 2px', fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-1)' }}>
                    {isDark ? 'Dark mode' : 'Light mode'}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--text-3)' }}>
                    Switch interface theme
                  </p>
                </div>
                <Toggle checked={isDark} onChange={toggleTheme} />
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                {[
                  { label: 'Dark', bg: '#0B0F14', surface: '#121923', active: isDark },
                  { label: 'Light', bg: '#F8FAFB', surface: '#FFFFFF', active: !isDark },
                ].map(t => (
                  <button
                    key={t.label}
                    onClick={() => isDark !== (t.label === 'Dark') ? toggleTheme() : undefined}
                    style={{
                      flex: 1, padding: '12px', borderRadius: 10, cursor: 'pointer',
                      background: t.bg,
                      border: `2px solid ${t.active ? '#14D1B2' : 'rgba(255,255,255,0.08)'}`,
                      transition: 'border-color 0.2s',
                    }}
                  >
                    <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
                      {[0.4, 0.6, 0.3].map((w, i) => (
                        <div key={i} style={{ height: 5, borderRadius: 3, flex: w, background: t.surface }} />
                      ))}
                    </div>
                    <div style={{ height: 22, borderRadius: 5, background: t.surface }} />
                    <div style={{ fontSize: '0.7rem', color: t.active ? '#14D1B2' : '#666', marginTop: 7, fontWeight: 600, textAlign: 'center' }}>
                      {t.active ? '✓ ' : ''}{t.label}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Account meta info */}
            <div className="admin-card" style={{ padding: '14px 20px', marginTop: 16 }}>
              {[
                { label: 'Role', value: user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : '—' },
                { label: 'Staff type', value: STAFF_ROLE_LABELS[user?.staff_role] || 'General staff' },
                { label: 'Employee ID', value: `#${user?.id || '—'}` },
                { label: 'Account email', value: user?.email },
              ].map((r, i, arr) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '9px 0',
                  borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
                }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-3)', fontWeight: 600 }}>{r.label}</span>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-1)', fontWeight: 700, maxWidth: '60%', textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.value}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* ══ SIGN OUT / DANGER ZONE ════════════════════════════ */}
        <section>
          <div className="admin-card" style={{ padding: '18px 24px', borderLeft: '3px solid #ef4444' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <p style={{ margin: '0 0 3px', fontWeight: 700, color: '#ef4444', fontSize: '0.9rem' }}>Sign out</p>
                <p style={{ margin: 0, color: 'var(--text-3)', fontSize: '0.78rem' }}>
                  You will be returned to the login page
                </p>
              </div>
              <button
                onClick={handleLogout}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 16px', borderRadius: 8, fontSize: '0.82rem', fontWeight: 700,
                  background: 'rgba(239,68,68,0.1)', color: '#ef4444',
                  border: '1px solid rgba(239,68,68,0.25)', cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.18)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
              >
                <LogOut size={14} /> Sign out
              </button>
            </div>
          </div>
        </section>

      </div>
    </StaffLayout>
  );
}
