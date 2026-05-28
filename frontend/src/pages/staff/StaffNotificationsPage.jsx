import { useEffect, useState } from 'react';
import StaffLayout from '../../components/StaffLayout';
import api from '../../services/api';
import { Bell } from 'lucide-react';

export default function StaffNotificationsPage() {
  const [notifs, setNotifs] = useState([]);

  useEffect(() => {
    api.get('/notifications/')
      .then(r => setNotifs(r.data))
      .catch(() => setNotifs([]));
  }, []);

  return (
    <StaffLayout title="Notifications" subtitle="Live canteen alerts and announcements">
      <div className="dash-page">
        <h2 className="dash-section-title">Staff Alerts &amp; Announcements</h2>
        <div style={{ marginTop: 24 }}>
          {notifs.map(n => (
            <div key={n.id} className="dash-card" style={{ marginBottom: 12, padding: 16, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8 }}>
              <p style={{ margin: '0 0 8px 0', color: 'var(--text-1)', fontSize: '0.9rem' }}>{n.message}</p>
              <p style={{ margin: 0, color: 'var(--text-3)', fontSize: '0.72rem' }}>{new Date(n.created_at).toLocaleString('en-IN')}</p>
            </div>
          ))}
          {notifs.length === 0 && (
            <div className="dash-empty">
              <Bell size={40} color="var(--text-3)" style={{ marginBottom: 10, opacity: 0.4 }} />
              <p>No new notifications at this time.</p>
            </div>
          )}
        </div>
      </div>
    </StaffLayout>
  );
}
