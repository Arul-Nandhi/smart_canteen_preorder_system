import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, UtensilsCrossed, Users, Clock,
  BarChart3, Bell, LogOut, Sun, Moon, Menu, X,
  Settings, Activity, ChefHat, Layers, MessageSquare, CreditCard
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';

const NAV_GROUPS = [
  {
    label: 'Operations',
    items: [
      { label: 'Dashboard',         icon: LayoutDashboard, path: '/staff' },
      { label: 'Order Operations',  icon: Package,         path: '/staff/operations' },
      { label: 'Kitchen Desk',      icon: ChefHat,         path: '/staff/orders' },
      { label: 'Counter Billing',   icon: CreditCard,      path: '/staff/billing' },
    ],
  },
  {
    label: 'Management',
    items: [
      { label: 'Food Menu',         icon: UtensilsCrossed, path: '/staff/menu' },
      { label: 'Combo Meals',       icon: Layers,          path: '/staff/combo' },
      { label: 'Slot Capacity',     icon: Clock,           path: '/staff/slots' },
    ],
  },
  {
    label: 'System',
    items: [
      { label: 'Notifications',     icon: Bell,            path: '/staff/notifications' },
      { label: 'Settings',          icon: Settings,        path: '/staff/settings' },
    ],
  },
];

export default function StaffLayout({ children, title, subtitle }) {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on route change (mobile)
  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  const isActive = (path) =>
    path === '/staff' ? location.pathname === '/staff' : location.pathname.startsWith(path);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'ST';

  // Determine current page title from nav
  const currentNav = NAV_GROUPS.flatMap(g => g.items).find(i => isActive(i.path));
  const pageLabel = title || currentNav?.label || 'Staff';

  return (
    <div className="admin-shell">

      {/* ── Sidebar Overlay (mobile) ── */}
      <div
        className={`admin-sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* ── Sidebar ── */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>

        {/* Brand */}
        <div className="admin-sidebar-brand">
          <span className="admin-sidebar-name">Smart<span>Serve</span></span>
          <span className="admin-sidebar-badge" style={{ background: 'rgba(20,209,178,0.15)', color: 'var(--teal)' }}>Staff</span>
        </div>

        {/* Navigation */}
        <nav className="admin-sidebar-nav">
          {NAV_GROUPS.map(group => (
            <div className="admin-nav-group" key={group.label}>
              <div className="admin-nav-group-label">{group.label}</div>
              {group.items.map(item => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`admin-sidebar-link ${active ? 'active' : ''}`}
                  >
                    <Icon size={17} className="sidebar-icon" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer user block */}
        <div className="admin-sidebar-footer">
          <div className="admin-sidebar-user">
            <div className="admin-sidebar-avatar" style={{ background: 'linear-gradient(135deg, var(--teal), #059669)' }}>{initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="admin-sidebar-username">{user?.name || 'Staff'}</div>
              <div className="admin-sidebar-role">Staff Member</div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign out"
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-3)', padding: 4, borderRadius: 6,
                display: 'flex', alignItems: 'center',
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div className="admin-content-area">

        {/* Top Header */}
        <header className="admin-top-header">
          {/* Mobile hamburger */}
          <button
            className="admin-sidebar-toggle"
            onClick={() => setSidebarOpen(v => !v)}
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          <div className="admin-top-header-left">
            <span className="admin-breadcrumb-parent">SmartServe</span>
            <span className="admin-breadcrumb-sep">/</span>
            <span className="admin-breadcrumb">{pageLabel}</span>

          </div>

          <div className="admin-top-header-right">
            {/* Theme toggle */}
            <button
              onClick={toggle}
              className="admin-icon-btn"
              title="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            {/* Notifications */}
            <Link to="/staff/notifications" className="admin-icon-btn admin-notif-btn" title="Notifications">
              <Bell size={17} />
              <span className="admin-notif-dot" />
            </Link>

            {/* Profile chip */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'var(--surface-2)', border: '1px solid var(--border)',
              borderRadius: 999, padding: '4px 12px 4px 4px',
            }}>
              <div className="admin-sidebar-avatar" style={{ width: 28, height: 28, fontSize: '0.65rem', background: 'linear-gradient(135deg, var(--teal), #059669)' }}>
                {initials}
              </div>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-1)' }}>
                {user?.name?.split(' ')[0] || 'Staff'}
              </span>
            </div>
          </div>
        </header>

        {/* Page Body */}
        <main className="admin-page-body">
          {children}
        </main>
      </div>
    </div>
  );
}
