import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, LayoutDashboard, Package, Activity, Clock, UtensilsCrossed, Image, Users, User, BarChart3, Bell, Settings, LogOut, CreditCard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const adminMenu = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
    { label: 'Orders', icon: Package, path: '/admin/orders' },
    { label: 'Queue Monitoring', icon: Activity, path: '/admin/queue' },
    { label: 'Slot Management', icon: Clock, path: '/admin/slots' },
    { label: 'Menu Management', icon: UtensilsCrossed, path: '/admin/menu' },
    { label: 'Food Images', icon: Image, path: '/admin/images' },
    { label: 'Staff Management', icon: Users, path: '/admin/staff' },
    { label: 'Users', icon: User, path: '/admin/users' },
    { label: 'Analytics', icon: BarChart3, path: '/admin/analytics' },
    { label: 'Notifications', icon: Bell, path: '/admin/notifications' },
    { label: 'Settings', icon: Settings, path: '/admin/settings' },
  ];

  const staffMenu = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/staff' },
    { label: 'Order Operations', icon: Package, path: '/staff/operations' },
    { label: 'Counter Billing', icon: CreditCard, path: '/staff/billing' },
    { label: 'Kitchen Desk', icon: UtensilsCrossed, path: '/staff/orders' },
    { label: 'Preparation Queue', icon: Activity, path: '/staff/queue' },
    { label: 'Menu Management', icon: UtensilsCrossed, path: '/staff/menu' },
    { label: 'Slot Management', icon: Clock, path: '/staff/slots' },
    { label: 'Queue Status', icon: Clock, path: '/staff/status' },
    { label: 'Notifications', icon: Bell, path: '/staff/notifications' },
    { label: 'Settings', icon: Settings, path: '/staff/settings' },
  ];

  const menu = user?.role === 'admin' ? adminMenu : staffMenu;
  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
  };

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed md:hidden top-4 left-4 z-50 p-2 rounded-lg hover:bg-opacity-90 transition"
        style={{ background: 'var(--teal)', color: '#0b0f14', border: 'none' }}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen bg-surface border-r border-border transition-all duration-300 z-40 ${
          isOpen ? 'w-64' : 'w-20'
        } hidden md:flex flex-col`}
        style={{ position: 'sticky' }}
      >
        {/* Logo/Brand */}
        <div className="h-20 flex items-center justify-center border-b border-border">
          {isOpen ? (
            <div className="text-center">
              <div className="text-2xl font-bold text-teal">SmartServe</div>
              <div className="text-xs text-text-3">{user?.role?.toUpperCase()}</div>
            </div>
          ) : (
            <UtensilsCrossed size={24} className="text-teal" />
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
          {menu.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`staff-sidebar-link ${active ? 'active' : ''}`}
                title={!isOpen ? item.label : ''}
              >
                <Icon size={20} className="flex-shrink-0" />
                {isOpen && <span className="text-sm">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="border-t border-border p-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all duration-200"
            title={!isOpen ? 'Logout' : ''}
          >
            <LogOut size={20} className="flex-shrink-0" />
            {isOpen && <span className="text-sm">Logout</span>}
          </button>
        </div>

        {/* Collapse Toggle */}
        {isOpen && (
          <div className="border-t border-border p-4">
            <button
              onClick={() => setIsOpen(false)}
              className="w-full text-center text-xs text-text-3 hover:text-text-2 transition"
            >
              Collapse
            </button>
          </div>
        )}
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
