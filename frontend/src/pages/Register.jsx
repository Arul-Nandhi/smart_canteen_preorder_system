import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  User, Mail, Phone, Lock, Eye, EyeOff,
  AlertCircle, Check, ArrowRight, UtensilsCrossed,
  GraduationCap, ChefHat
} from 'lucide-react';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+]?[\d\s\-()]{7,15}$/;

function pwScore(pw) {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 6)           s++;
  if (pw.length >= 10)          s++;
  if (/[A-Z]/.test(pw))        s++;
  if (/[0-9]/.test(pw))        s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}
const STRENGTH_LABEL  = ['', 'Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
const STRENGTH_COLOR  = ['', '#ef4444', '#f97316', '#eab308', '#22c55e', '#14D1B2'];

export default function Register() {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', role: 'student', password: '', confirmPassword: '',
  });
  const [errors, setErrors]   = useState({});
  const [touched, setTouched] = useState({});
  const [showPw, setShowPw]   = useState(false);
  const [showCPw, setShowCPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shake, setShake]     = useState(false);
  const navigate = useNavigate();

  const score = pwScore(form.password);

  /* Live validation */
  useEffect(() => {
    const e = {};
    if (touched.name) {
      if (!form.name.trim())              e.name = 'Full name is required';
      else if (form.name.trim().length < 2) e.name = 'At least 2 characters';
    }
    if (touched.email) {
      if (!form.email)                    e.email = 'Email is required';
      else if (!EMAIL_RE.test(form.email)) e.email = 'Enter a valid email';
    }
    if (touched.phone && form.phone) {
      if (!PHONE_RE.test(form.phone))     e.phone = 'Enter a valid phone number';
    }
    if (touched.password) {
      if (!form.password)                 e.password = 'Password is required';
      else if (form.password.length < 6)  e.password = 'At least 6 characters';
    }
    if (touched.confirmPassword) {
      if (!form.confirmPassword)          e.confirmPassword = 'Please confirm your password';
      else if (form.confirmPassword !== form.password) e.confirmPassword = 'Passwords do not match';
    }
    setErrors(e);
  }, [form, touched]);

  const blur = (f) => setTouched(t => ({ ...t, [f]: true }));
  const set  = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.name.trim())               e.name = 'Full name is required';
    else if (form.name.trim().length < 2)     e.name = 'At least 2 characters';
    if (!form.email)                     e.email = 'Email is required';
    else if (!EMAIL_RE.test(form.email))      e.email = 'Enter a valid email';
    if (form.phone && !PHONE_RE.test(form.phone)) e.phone = 'Enter a valid phone number';
    if (!form.password)                  e.password = 'Password is required';
    else if (form.password.length < 6)        e.password = 'At least 6 characters';
    if (!form.confirmPassword)           e.confirmPassword = 'Please confirm your password';
    else if (form.confirmPassword !== form.password) e.confirmPassword = 'Passwords do not match';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ name: true, email: true, phone: true, password: true, confirmPassword: true });
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); shake_it(); return; }
    setLoading(true);
    try {
      const { confirmPassword, ...payload } = form;
      await api.post('/auth/register/', payload);
      toast.success('Account created! Please sign in.');
      navigate('/login');
    } catch (err) {
      const data = err.response?.data;
      if (data?.email)  setErrors(p => ({ ...p, email: data.email[0] }));
      else if (data?.phone) setErrors(p => ({ ...p, phone: data.phone[0] }));
      else toast.error(data?.detail || 'Registration failed. Please try again.');
      shake_it();
    } finally {
      setLoading(false);
    }
  };

  const shake_it = () => { setShake(true); setTimeout(() => setShake(false), 500); };

  const fc = (f) => {
    if (touched[f] && errors[f])             return 'form-field field-error';
    if (touched[f] && !errors[f] && form[f]) return 'form-field field-ok';
    return 'form-field';
  };

  return (
    <div className="auth-page" style={{ padding: '32px 24px' }}>
      <div className="auth-orb auth-orb-1" />
      <div className="auth-orb auth-orb-2" />

      <div className={`auth-card wide${shake ? ' auth-shake' : ''}`}>
        {/* Brand */}
        <div className="auth-brand">
          <div className="auth-brand-icon">
            <UtensilsCrossed size={20} />
          </div>
          <div className="auth-brand-name">Smart<span>Serve</span></div>
        </div>

        <h1 className="auth-heading">Create account</h1>
        <p className="auth-sub">Join SmartServe and skip the queue</p>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>

          {/* Full Name */}
          <div className={fc('name')}>
            <label className="form-label">Full name <span className="req-star">*</span></label>
            <div className="input-wrap">
              <span className="input-icon-left" style={{ top: 28 }}><User size={16} /></span>
              <input className="form-input with-left" value={form.name}
                onChange={set('name')} onBlur={() => blur('name')}
                placeholder="Your full name" autoComplete="name" />
              {touched.name && !errors.name && form.name && (
                <span className="input-icon-right" style={{ top: 28, pointerEvents: 'none', color: '#22c55e' }}>
                  <Check size={16} />
                </span>
              )}
            </div>
            {touched.name && errors.name && (
              <div className="field-msg err"><AlertCircle size={13} /> {errors.name}</div>
            )}
          </div>

          {/* Email */}
          <div className={fc('email')}>
            <label className="form-label">Email address <span className="req-star">*</span></label>
            <div className="input-wrap">
              <span className="input-icon-left" style={{ top: 28 }}><Mail size={16} /></span>
              <input className="form-input with-left" type="email" value={form.email}
                onChange={set('email')} onBlur={() => blur('email')}
                placeholder="you@example.com" autoComplete="email" />
              {touched.email && !errors.email && form.email && (
                <span className="input-icon-right" style={{ top: 28, pointerEvents: 'none', color: '#22c55e' }}>
                  <Check size={16} />
                </span>
              )}
            </div>
            {touched.email && errors.email && (
              <div className="field-msg err"><AlertCircle size={13} /> {errors.email}</div>
            )}
          </div>

          {/* Phone */}
          <div className={fc('phone')}>
            <label className="form-label">
              Phone <span className="opt-tag">optional</span>
            </label>
            <div className="input-wrap">
              <span className="input-icon-left" style={{ top: 28 }}><Phone size={16} /></span>
              <input className="form-input with-left" value={form.phone}
                onChange={set('phone')} onBlur={() => blur('phone')}
                placeholder="+91 9999999999" autoComplete="tel" />
            </div>
            {touched.phone && errors.phone && (
              <div className="field-msg err"><AlertCircle size={13} /> {errors.phone}</div>
            )}
          </div>



          {/* Password */}
          <div className={fc('password')}>
            <label className="form-label">Password <span className="req-star">*</span></label>
            <div className="input-wrap">
              <span className="input-icon-left" style={{ top: 28 }}><Lock size={16} /></span>
              <input className="form-input with-left with-right"
                type={showPw ? 'text' : 'password'} value={form.password}
                onChange={set('password')} onBlur={() => blur('password')}
                placeholder="Min 6 characters" autoComplete="new-password" />
              <button type="button"
                className="input-icon-right"
                style={{ top: 28, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)' }}
                onClick={() => setShowPw(v => !v)}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {/* Strength bar */}
            {form.password && (
              <div>
                <div className="pw-strength-bar">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className="pw-seg"
                      style={{ background: i <= score ? STRENGTH_COLOR[score] : 'var(--border)' }} />
                  ))}
                </div>
                <span className="pw-strength-label" style={{ color: STRENGTH_COLOR[score] }}>
                  {STRENGTH_LABEL[score]}
                </span>
              </div>
            )}
            {touched.password && errors.password && (
              <div className="field-msg err"><AlertCircle size={13} /> {errors.password}</div>
            )}
          </div>

          {/* Confirm Password */}
          <div className={fc('confirmPassword')}>
            <label className="form-label">Confirm password <span className="req-star">*</span></label>
            <div className="input-wrap">
              <span className="input-icon-left" style={{ top: 28 }}><Lock size={16} /></span>
              <input className="form-input with-left with-right"
                type={showCPw ? 'text' : 'password'} value={form.confirmPassword}
                onChange={set('confirmPassword')} onBlur={() => blur('confirmPassword')}
                placeholder="Re-enter password" autoComplete="new-password" />
              <button type="button"
                className="input-icon-right"
                style={{ top: 28, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)' }}
                onClick={() => setShowCPw(v => !v)}>
                {showCPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {touched.confirmPassword && errors.confirmPassword && (
              <div className="field-msg err"><AlertCircle size={13} /> {errors.confirmPassword}</div>
            )}
            {touched.confirmPassword && !errors.confirmPassword && form.confirmPassword && (
              <div className="field-msg ok"><Check size={13} /> Passwords match</div>
            )}
          </div>

          {/* Terms */}
          <p style={{ fontSize: '0.78rem', color: 'var(--text-3)', lineHeight: 1.6 }}>
            By registering you agree to our{' '}
            <span style={{ color: 'var(--teal)', cursor: 'pointer', fontWeight: 600 }}>Terms of Service</span>
            {' '}and{' '}
            <span style={{ color: 'var(--teal)', cursor: 'pointer', fontWeight: 600 }}>Privacy Policy</span>.
          </p>

          <button id="register-submit-btn" className="auth-submit" disabled={loading} type="submit">
            {loading
              ? <><span className="btn-spinner" style={{ borderTopColor: '#0B0F14' }} /> Creating account…</>
              : <>Create Account <ArrowRight size={16} /></>
            }
          </button>
        </form>


        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
