import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Mail, Lock, Eye, EyeOff, AlertCircle, Check, ArrowRight, UtensilsCrossed } from 'lucide-react';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const [form, setForm]       = useState({ email: '', password: '' });
  const [rememberMe, setRememberMe] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const [errors, setErrors]   = useState({});
  const [touched, setTouched] = useState({});
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [shake, setShake]     = useState(false);
  const { login }  = useAuth();
  const navigate   = useNavigate();

  // Load remembered email
  useEffect(() => {
    const saved = localStorage.getItem('remembered_email');
    if (saved) {
      setForm(f => ({ ...f, email: saved }));
      setRememberMe(true);
    }
  }, []);

  /* Live validation */
  useEffect(() => {
    const e = {};
    if (touched.email) {
      if (!form.email)                    e.email    = 'Email is required';
      else if (!EMAIL_RE.test(form.email)) e.email   = 'Enter a valid email address';
    }
    if (touched.password) {
      if (!form.password)                 e.password = 'Password is required';
      else if (form.password.length < 6)  e.password = 'At least 6 characters';
    }
    setErrors(e);
  }, [form, touched]);

  const blur  = (f) => setTouched(t => ({ ...t, [f]: true }));
  const valid = !errors.email && !errors.password && form.email && form.password;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ email: true, password: true });

    const e2 = {};
    if (!form.email)                    e2.email    = 'Email is required';
    else if (!EMAIL_RE.test(form.email)) e2.email   = 'Enter a valid email address';
    if (!form.password)                 e2.password = 'Password is required';
    else if (form.password.length < 6)  e2.password = 'At least 6 characters';
    if (Object.keys(e2).length) { setErrors(e2); shake_it(); return; }

    setLoading(true);
    try {
      const res = await api.post('/auth/login/', form);
      if (rememberMe) {
        localStorage.setItem('remembered_email', form.email);
      } else {
        localStorage.removeItem('remembered_email');
      }
      login(res.data);
      toast.success(`Welcome back, ${res.data.user.name}!`);
      const role = res.data.user.role;
      navigate(role === 'admin' ? '/admin' : role === 'staff' ? '/staff' : '/dashboard');
    } catch (err) {
      const s = err.response?.status;
      if (s === 401 || s === 400) {
        setErrors({ password: 'Incorrect email or password' });
        setTouched({ email: true, password: true });
      } else {
        toast.error('Something went wrong. Please try again.');
      }
      shake_it();
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotEmail) {
      toast.error('Please enter your email address');
      return;
    }
    setSendingReset(true);
    try {
      const res = await api.post('/auth/forgot-password/', { email: forgotEmail });
      toast.success(res.data.message || 'Password reset link sent!');
      setForgotModalOpen(false);
      setForgotEmail('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send reset link');
    } finally {
      setSendingReset(false);
    }
  };

  const shake_it = () => { setShake(true); setTimeout(() => setShake(false), 500); };

  const fieldClass = (f) => {
    if (touched[f] && errors[f])             return 'form-field field-error';
    if (touched[f] && !errors[f] && form[f]) return 'form-field field-ok';
    return 'form-field';
  };

  return (
    <div className="auth-page">
      <div className="auth-orb auth-orb-1" />
      <div className="auth-orb auth-orb-2" />

      <div className={`auth-card${shake ? ' auth-shake' : ''}`}>
        {/* Brand */}
        <div className="auth-brand">
          <div className="auth-brand-icon">
            <UtensilsCrossed size={20} />
          </div>
          <div className="auth-brand-name">Smart<span>Serve</span></div>
        </div>

        <h1 className="auth-heading">Welcome back</h1>
        <p className="auth-sub">Sign in to your SmartServe account</p>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {/* Email */}
          <div className={fieldClass('email')}>
            <label className="form-label">
              Email address <span className="req-star">*</span>
            </label>
            <div className="input-wrap">
              <span className="input-icon-left" style={{ top: 28 }}>
                <Mail size={16} />
              </span>
              <input
                className="form-input with-left"
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                onBlur={() => blur('email')}
                placeholder="you@example.com"
                autoComplete="email"
              />
              {touched.email && !errors.email && form.email && (
                <span className="input-icon-right" style={{ top: 28, pointerEvents: 'none', color: '#22c55e' }}>
                  <Check size={16} />
                </span>
              )}
            </div>
            {touched.email && errors.email && (
              <div className="field-msg err">
                <AlertCircle size={13} /> {errors.email}
              </div>
            )}
          </div>

          {/* Password */}
          <div className={fieldClass('password')}>
            <label className="form-label">
              Password <span className="req-star">*</span>
            </label>
            <div className="input-wrap">
              <span className="input-icon-left" style={{ top: 28 }}>
                <Lock size={16} />
              </span>
              <input
                className="form-input with-left with-right"
                type={showPw ? 'text' : 'password'}
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                onBlur={() => blur('password')}
                placeholder="••••••••"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="input-icon-right"
                style={{ top: 28, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)' }}
                onClick={() => setShowPw(v => !v)}
                aria-label={showPw ? 'Hide' : 'Show'}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {touched.password && errors.password && (
              <div className="field-msg err">
                <AlertCircle size={13} /> {errors.password}
              </div>
            )}
          </div>

          {/* Remember me & Forgot password row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0.75rem 0' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-2)' }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                style={{ accentColor: 'var(--lime-main)', width: 15, height: 15 }}
              />
              Remember me
            </label>
            <span 
              className="forgot-link" 
              style={{ cursor: 'pointer', fontSize: '0.85rem', color: 'var(--lime-main)', textDecoration: 'underline' }}
              onClick={() => setForgotModalOpen(true)}
            >
              Forgot password?
            </span>
          </div>

          <button
            id="login-submit-btn"
            className="auth-submit"
            disabled={loading}
            type="submit"
          >
            {loading
              ? <><span className="btn-spinner" style={{ borderTopColor: '#0B0F14' }} /> Signing in…</>
              : <>Sign In <ArrowRight size={16} /></>
            }
          </button>
        </form>


        <p className="auth-switch">
          Don't have an account? <Link to="/register">Create one for free</Link>
        </p>
      </div>

      {forgotModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
             onClick={e => e.target === e.currentTarget && setForgotModalOpen(false)}>
          <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', padding: '2rem', width: '100%', maxWidth: 400, border: '1px solid rgba(174, 234, 0, 0.2)', boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--lime-main)', margin: 0 }}>Reset Password</h2>
              <button onClick={() => setForgotModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-2)', marginBottom: '1.5rem' }}>
              Enter your registered email address below, and we will send you instructions to reset your password.
            </p>
            <form onSubmit={handleForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-field" style={{ marginBottom: 0 }}>
                <label className="form-label">Email Address</label>
                <input
                  className="form-input"
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={e => setForgotEmail(e.target.value)}
                  placeholder="you@example.com"
                  style={{ background: 'var(--bg-card)' }}
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }} disabled={sendingReset}>
                {sendingReset ? 'Sending Link...' : 'Send Reset Link'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
