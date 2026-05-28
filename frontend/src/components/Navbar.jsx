import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Utensils, UtensilsCrossed, LogOut, LayoutDashboard, ChefHat,
  Moon, Sun, User, Bell, Menu as MenuIcon, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function Navbar() {
  const { user, logout }   = useAuth();
  const { count }          = useCart();
  const { theme, toggle }  = useTheme();
  const navigate           = useNavigate();
  const location           = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const shownNotifs = useRef(new Set());

  useEffect(() => {
    let mounted = true;
    const loadNotifs = async () => {
      if (!user) return;
      try {
        const res = await api.get('/notifications/');
        if (!mounted) return;
        const notifs = res.data || [];
        for (const n of notifs) {
          if (n.notification_status === 'unread' && !shownNotifs.current.has(n.id)) {
            toast(`🔔 ${n.message}`);
            shownNotifs.current.add(n.id);
            // Mark read on server
            try { await api.patch(`/notifications/${n.id}/read/`); } catch(e) { /* ignore */ }
          }
        }
      } catch (err) {
        // silent
      }
    };
    loadNotifs();
    const t = setInterval(loadNotifs, 8000);
    return () => { mounted = false; clearInterval(t); };
  }, [user]);

  const isActive = (path) => location.pathname === path;
  const link = (path) => isActive(path) ? 'nav-link active' : 'nav-link';

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMobileOpen(false);
  };

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Logo */}
        <Link to="/" className="nav-logo">
          <div style={{
            width: 32, height: 32, background: '#14D1B2',
            borderRadius: 8, display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: '#0B0F14', flexShrink: 0
          }}>
            <UtensilsCrossed size={16} />
          </div>
          Smart<span>Serve</span>
        </Link>

        {/* Desktop Nav */}
        <div className="nav-links">
          {user ? (
            <>
              {user.role === 'student' && (
                <>
                  <Link to="/menu"      className={link('/menu')}>Menu</Link>
                  <Link to="/offers"    className={link('/offers')}>Offers</Link>
                  <Link to="/orders"    className={link('/orders')}>Orders</Link>
                  <Link to="/queue"     className={link('/queue')}>Queue</Link>
                  <Link to="/dashboard" className={link('/dashboard')}>Dashboard</Link>
                  <Link to="/cart" className={link('/cart')} style={{ position: 'relative' }}>
                    <Utensils size={15} />
                    Plate
                    {count > 0 && <span className="nav-badge">{count}</span>}
                  </Link>
                </>
              )}
              {user.role === 'staff' && (
                <>
                  <Link to="/staff"   className={link('/staff')}>
                    <ChefHat size={15} /> Kitchen
                  </Link>
                  <Link to="/kitchen" className={link('/kitchen')}>Live Orders</Link>
                </>
              )}
              {user.role === 'admin' && (
                <Link to="/admin" className={link('/admin')}>
                  <LayoutDashboard size={15} /> Admin
                </Link>
              )}
            </>
          ) : (
            <>
              <Link to="/login"    className="nav-link">Login</Link>
              <Link to="/register" className="nav-link">Register</Link>
            </>
          )}
        </div>

        {/* Right Actions */}
        <div className="nav-actions">
          {/* Theme toggle */}
          <button
            className="theme-toggle"
            onClick={toggle}
            aria-label="Toggle theme"
            title={theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
          >
            {theme === 'dark'
              ? <Sun size={16} />
              : <Moon size={16} />
            }
          </button>

          {user ? (
            <>
              {/* User chip */}
              <Link to="/profile" className="nav-user-chip" style={{ textDecoration: 'none' }}>
                <div className="nav-user-avatar">{initials}</div>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-1)' }}>
                  {user.name?.split(' ')[0]}
                </span>
              </Link>

              <button
                className="nav-mobile-toggle"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Toggle menu"
              >
                {mobileOpen ? <X size={18} /> : <MenuIcon size={18} />}
              </button>
            </>
          ) : (
            <Link to="/register" className="btn btn-primary btn-sm">
              Get Started
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileOpen && user && (
        <div className="mobile-menu">
          {/* User Profile & Theme Settings inside Mobile Menu Drawer */}
          <div className="mobile-profile-section">
            <Link to="/profile" className="nav-user-chip" onClick={() => setMobileOpen(false)} style={{ textDecoration: 'none', width: 'fit-content' }}>
              <div className="nav-user-avatar">{initials}</div>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-1)' }}>
                {user.name}
              </span>
            </Link>
            <button
              className="theme-toggle"
              onClick={toggle}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
          </div>

          {/* Links Section */}
          <div className="mobile-links-section">
            {user.role === 'student' && (
              <>
                <Link to="/menu"      className={link('/menu')} onClick={() => setMobileOpen(false)}>Menu</Link>
                <Link to="/offers"    className={link('/offers')} onClick={() => setMobileOpen(false)}>Offers</Link>
                <Link to="/orders"    className={link('/orders')} onClick={() => setMobileOpen(false)}>Orders</Link>
                <Link to="/queue"     className={link('/queue')} onClick={() => setMobileOpen(false)}>Queue</Link>
                <Link to="/dashboard" className={link('/dashboard')} onClick={() => setMobileOpen(false)}>Dashboard</Link>
                <Link to="/cart"      className={link('/cart')} onClick={() => setMobileOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 6, position: 'relative' }}>
                  <Utensils size={15} />
                  Plate
                  {count > 0 && <span className="nav-badge" style={{ marginLeft: 8 }}>{count}</span>}
                </Link>
              </>
            )}
            {user.role === 'staff' && (
              <>
                <Link to="/staff"   className={link('/staff')} onClick={() => setMobileOpen(false)}>
                  <ChefHat size={15} /> Kitchen
                </Link>
                <Link to="/kitchen" className={link('/kitchen')} onClick={() => setMobileOpen(false)}>Live Orders</Link>
              </>
            )}
            {user.role === 'admin' && (
              <Link to="/admin" className={link('/admin')} onClick={() => setMobileOpen(false)}>
                <LayoutDashboard size={15} /> Admin
              </Link>
            )}
          </div>

          {/* Logout Section at the Bottom */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', marginTop: '4px' }}>
            <button
              className="btn btn-danger btn-sm"
              onClick={handleLogout}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <LogOut size={15} /> Sign Out
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
