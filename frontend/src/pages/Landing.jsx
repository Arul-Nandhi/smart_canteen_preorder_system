import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import {
  Clock, Zap, BarChart3, QrCode, Bell, Smartphone,
  ArrowRight, Check, ChefHat, GraduationCap, Shield
} from 'lucide-react';

const ROLE_HOME = { admin: '/admin', staff: '/staff', student: '/dashboard' };

const features = [
  { icon: Clock,      title: 'Pre-Order Slots',       desc: 'Book your pickup slot before the rush. Guaranteed ready-on-time meals.' },
  { icon: Zap,        title: 'Real-Time Queue',        desc: 'Live token tracking. See your position update in real-time.' },
  { icon: BarChart3,  title: 'Smart Load Balancing',   desc: 'AI detects kitchen congestion and auto-distributes orders evenly.' },
  { icon: QrCode,     title: 'QR Token System',        desc: 'Scan to collect. Digital tokens replace paper slips entirely.' },
  { icon: Bell,       title: 'Instant Notifications',  desc: 'Push alerts when food is ready. Never wait in the dark again.' },
  { icon: Smartphone, title: 'Mobile-First Design',    desc: 'Order from any device, anywhere on campus, in seconds.' },
];

const steps = [
  { num: '01', title: 'Create Account',   desc: 'Sign up as a student or staff member in under 60 seconds.' },
  { num: '02', title: 'Browse & Order',   desc: 'View today\'s menu, select your meal, and choose a pickup slot.' },
  { num: '03', title: 'Track Live',       desc: 'Watch your order move through the kitchen in real-time.' },
  { num: '04', title: 'Scan & Collect',   desc: 'Show your QR token at the counter and collect your meal instantly.' },
];

export default function Landing() {
  const { user } = useAuth();
  const navigate  = useNavigate();

  useEffect(() => {
    if (user) navigate(ROLE_HOME[user.role] || '/dashboard', { replace: true });
  }, [user, navigate]);

  if (user) return null;

  return (
    <>
      <Navbar />

      {/* ── Hero ── */}
      <section className="hero-section">
        <div className="hero-bg">
          <div className="hero-orb-1" />
          <div className="hero-orb-2" />
          <div className="hero-orb-3" />
        </div>

        <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 800, margin: '0 auto' }}>
          <div className="hero-badge">
            <span className="hero-badge-dot" />
            Now live across campus canteens
          </div>

          <h1 className="hero-h1">
            Smart Ordering.<br />
            <span className="teal">Better Dining.</span>
          </h1>

          <p className="hero-sub">
            Pre-order your meals, skip the queue, and enjoy a smarter canteen experience.
            Built for students, staff, and canteen managers.
          </p>

          <div className="hero-cta">
            <Link to="/register" className="btn btn-primary btn-xl">
              Get Started Free <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="btn btn-outline btn-xl">
              Sign In
            </Link>
          </div>

          {/* Stats */}
          <div className="stats-strip">
            {[
              { num: '2,400', suf: '+', label: 'Daily Orders' },
              { num: '98',    suf: '%', label: 'On-Time Rate' },
              { num: '12',    suf: 'x', label: 'Faster Pickup' },
              { num: '0',     suf: ' queues', label: 'Paper Tokens' },
            ].map(s => (
              <div className="stat-item" key={s.label}>
                <div className="stat-num">{s.num}<span>{s.suf}</span></div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Dashboard Preview */}
        <div className="hero-preview" style={{ marginLeft: 'auto', marginRight: 'auto' }}>
          <div className="preview-bar">
            <div className="preview-dot" style={{ background: '#ef4444' }} />
            <div className="preview-dot" style={{ background: '#eab308' }} />
            <div className="preview-dot" style={{ background: '#22c55e' }} />
            <span style={{ marginLeft: 12, fontSize: '0.78rem', color: 'var(--text-3)', fontWeight: 500 }}>
              SmartServe Dashboard — Student View
            </span>
          </div>
          <div className="preview-body">
            <div className="preview-card">
              <div className="preview-card-label">Today's Orders</div>
              <div className="preview-card-val teal">3</div>
              <div className="preview-card-sub">2 completed · 1 ready</div>
            </div>
            <div className="preview-card">
              <div className="preview-card-label">Queue Position</div>
              <div className="preview-card-val">#4</div>
              <div className="preview-card-sub">~8 min remaining</div>
            </div>
            <div className="preview-card">
              <div className="preview-card-label">Wallet Balance</div>
              <div className="preview-card-val">₹240</div>
              <div className="preview-card-sub">Last topped up Mon</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="section" style={{ maxWidth: 1180, margin: '0 auto', padding: '100px 32px' }}>
        <div className="section-label">
          <Zap size={12} /> Features
        </div>
        <h2 className="section-h2">
          Everything your canteen<br /><span>needs to run smarter</span>
        </h2>
        <p className="section-desc">
          Built for high-density canteen environments where every minute counts.
          From pre-ordering to live tracking — we handle it all.
        </p>
        <div className="features-grid">
          {features.map(({ icon: Icon, title, desc }) => (
            <div className="feature-card" key={title}>
              <div className="feature-icon-wrap">
                <Icon size={22} />
              </div>
              <h3>{title}</h3>
              <p>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ── */}
      <div style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <section className="section" style={{ maxWidth: 1180, margin: '0 auto', padding: '100px 32px' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <div className="section-label" style={{ justifyContent: 'center' }}>
              <Clock size={12} /> How It Works
            </div>
            <h2 className="section-h2">
              From order to plate in<br /><span>four simple steps</span>
            </h2>
          </div>
          <div className="steps-grid">
            {steps.map(s => (
              <div className="step-card" key={s.num}>
                <div className="step-num">{s.num}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ── Roles ── */}
      <section className="section" style={{ maxWidth: 1180, margin: '0 auto', padding: '100px 32px' }}>
        <div className="section-label">
          <Shield size={12} /> Roles
        </div>
        <h2 className="section-h2">
          One platform,<br /><span>three tailored experiences</span>
        </h2>
        <div className="roles-grid">
          {[
            {
              Icon: GraduationCap,
              role: 'Student',
              tagStyle: { background: 'var(--teal-soft)', color: 'var(--teal)' },
              desc: 'Order from anywhere on campus with a few taps. Track your meal live.',
              items: ['Browse daily menu', 'Pre-order by slot', 'Live queue tracking', 'QR token collection', 'Order history & wallet'],
            },
            {
              Icon: ChefHat,
              role: 'Kitchen Staff',
              tagStyle: { background: 'rgba(14,165,233,0.12)', color: '#38bdf8' },
              desc: 'Manage the kitchen workflow efficiently with smart order dashboards.',
              items: ['View live order queue', 'Update item availability', 'Mark orders as ready', 'Manage kitchen capacity', 'Slot management'],
            },
            {
              Icon: Shield,
              role: 'Admin',
              tagStyle: { background: 'rgba(167,139,250,0.12)', color: '#a78bfa' },
              desc: 'Full control over users, menu, slots, analytics, and system settings.',
              items: ['User management', 'Menu & pricing control', 'Analytics dashboard', 'Slot configuration', 'Announcements & reports'],
            },
          ].map(({ Icon, role, tagStyle, desc, items }) => (
            <div className="role-feature-card" key={role}>
              <div className="role-tag" style={tagStyle}>
                <Icon size={14} /> {role}
              </div>
              <h3>{role}</h3>
              <p style={{ color: 'var(--text-2)', fontSize: '0.875rem', marginBottom: 16 }}>{desc}</p>
              <ul className="role-feature-list">
                {items.map(i => <li key={i}>{i}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <div style={{ padding: '0 32px 80px', maxWidth: 1180, margin: '0 auto' }}>
        <div className="cta-section">
          <div className="section-label" style={{ justifyContent: 'center', marginBottom: 24 }}>
            <Zap size={12} /> Get Started Today
          </div>
          <h2>Ready to ditch the queue?</h2>
          <p>Join your canteen today — free for all students and staff.</p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register" className="btn btn-primary btn-xl">
              Create Free Account <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="btn btn-outline btn-xl">
              Sign In
            </Link>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-top">
            <div className="footer-brand">
              <div className="nav-logo" style={{ marginBottom: 12 }}>
                <div style={{
                  width: 32, height: 32, background: '#14D1B2',
                  borderRadius: 8, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', color: '#0B0F14'
                }}>
                  <GraduationCap size={16} />
                </div>
                Smart<span style={{ color: 'var(--teal)' }}>Serve</span>
              </div>
              <p>
                A smart canteen pre-order and queue management system
                built for modern educational institutions.
              </p>
            </div>
            <div className="footer-col">
              <h4>Product</h4>
              <ul>
                <li><a href="#">Features</a></li>
                <li><a href="#">How it works</a></li>
                <li><a href="#">Pricing</a></li>
                <li><a href="#">Changelog</a></li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>Roles</h4>
              <ul>
                <li><a href="#">Students</a></li>
                <li><a href="#">Kitchen Staff</a></li>
                <li><a href="#">Administrators</a></li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>Support</h4>
              <ul>
                <li><a href="#">Documentation</a></li>
                <li><a href="#">Privacy Policy</a></li>
                <li><a href="#">Terms of Service</a></li>
                <li><a href="#">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© 2025 SmartServe. Smart Canteen Pre-Order & Queue Optimization System.</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
              All systems operational
            </span>
          </div>
        </div>
      </footer>
    </>
  );
}
