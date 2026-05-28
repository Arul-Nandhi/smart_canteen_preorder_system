import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Utensils, Clock, Bell, ChevronRight, UtensilsCrossed } from 'lucide-react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

const STAGES = ['pending', 'confirmed', 'preparing', 'ready'];
const STAGE_LABELS = { pending:'Order Placed', confirmed:'Accepted', preparing:'Preparing', ready:'Ready for Pickup!' };

function OrderTracker({ order }) {
  const cur = STAGES.indexOf(order.order_status);
  return (
    <div style={{ background:'var(--surface-light)', borderRadius:'var(--radius-md)', padding:'1.25rem', border:'1px solid rgba(var(--lime-rgb),0.12)' }}>
      <div className="flex-between" style={{ marginBottom:'1rem' }}>
        <div>
          <span style={{ fontWeight:800, color:'var(--lime-main)', fontSize:'1.1rem' }}>{order.token_number}</span>
          <span style={{ color:'var(--text-muted)', fontSize:'0.82rem', marginLeft:'0.75rem' }}>₹{order.total_amount}</span>
        </div>
        <span className={`badge ${order.order_status === 'ready' ? 'badge-green' : order.order_status === 'cancelled' ? 'badge-red' : 'badge-blue'}`} style={{ textTransform:'capitalize' }}>
          {order.order_status}
        </span>
      </div>

      {order.order_status === 'cancelled' ? (
        <p style={{ color:'#EF5350', textAlign:'center', padding:'0.5rem', fontWeight: 600 }}>Order Cancelled</p>
      ) : (
        <>
          {/* Progress Bar */}
          <div style={{ display:'flex', alignItems:'center', gap:0, marginBottom:'0.75rem', position:'relative' }}>
            {STAGES.map((stage, idx) => {
              const done = idx <= cur;
              const active = idx === cur;
              return (
                <div key={stage} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', position:'relative' }}>
                  {idx < 3 && (
                    <div style={{ position:'absolute', top:14, left:'50%', width:'100%', height:2, zIndex:0,
                      background: idx < cur ? 'rgba(var(--lime-rgb),0.65)' : 'rgba(var(--lime-rgb),0.12)', transition:'background 0.4s' }}/>
                  )}
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: '#000000',
                    border: `2px solid ${done ? 'var(--lime-bright)' : 'rgba(var(--lime-rgb),0.2)'}`,
                    transition: 'all 0.4s', fontSize: '0.75rem',
                    color: done ? 'var(--lime-bright)' : 'var(--text-muted)',
                    fontWeight: 700
                  }}>
                    {done ? '✓' : idx + 1}
                  </div>
                  <p style={{ fontSize:'0.65rem', color: done ? 'var(--lime-main)' : 'var(--text-muted)', marginTop:'0.35rem', textAlign:'center', whiteSpace:'nowrap', fontWeight: active ? 700 : 400 }}>
                    {STAGE_LABELS[stage].split(' ')[0]}
                  </p>
                </div>
              );
            })}
          </div>

          <p style={{ textAlign:'center', fontSize:'0.85rem', color:'var(--lime-main)', fontWeight:600, marginTop:'0.5rem' }}>
            {STAGE_LABELS[order.order_status]}
          </p>
          {order.estimated_wait > 0 && order.order_status !== 'completed' && order.order_status !== 'ready' && (
            <p style={{ textAlign:'center', fontSize:'0.78rem', color:'var(--text-muted)', marginTop:'0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
              <Clock size={12} /> ~{order.estimated_wait} min estimated
            </p>
          )}
        </>
      )}
    </div>
  );
}

export default function StudentDashboard() {
  const { user }              = useAuth();
  const [orders,  setOrders]  = useState([]);
  const [queue,   setQueue]   = useState(null);
  const [notifs,  setNotifs]  = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(() => {
    Promise.all([
      api.get('/orders/'),
      api.get('/queue/status/'),
      api.get('/notifications/'),
    ]).then(([o, q, n]) => {
      setOrders(o.data);
      setQueue(q.data);
      setNotifs(n.data.filter(x => x.notification_status === 'unread').slice(0, 6));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchData();
    const t = setInterval(fetchData, 15000);
    return () => clearInterval(t);
  }, [fetchData]);

  const isToday = (dateStr) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const today = new Date();
    return d.getDate() === today.getDate() &&
           d.getMonth() === today.getMonth() &&
           d.getFullYear() === today.getFullYear();
  };

  const activeOrders = orders.filter(o => {
    const isStatusActive = ['pending','confirmed','preparing','ready'].includes(o.order_status);
    if (!isStatusActive) return false;
    const dateToCheck = o.slot_detail?.slot_date || o.created_at;
    return isToday(dateToCheck);
  });
  const recentDone   = orders.filter(o => o.order_status === 'completed').slice(0, 3);

  return (
    <>
      <Navbar />
      <div className="page-wrapper">
        {/* Greeting */}
        <div style={{ marginBottom:'1.75rem' }}>
          <h1 className="page-title" style={{ margin:0 }}>
            Hello, {user?.name?.split(' ')[0]}
          </h1>
          <p style={{ color:'var(--text-muted)', marginTop:'0.3rem' }}>Welcome to SmartServe Canteen</p>
        </div>

        {/* Stats Row */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:'1rem', marginBottom:'2rem' }}>
          <div className="stat-card" style={{ flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
            <span className="stat-card-val" style={{ color: 'var(--text-1)' }}>{orders.length}</span>
            <span className="stat-card-label" style={{ color: 'var(--text-2)' }}>Total Orders</span>
          </div>
          <div className="stat-card" style={{ background:'linear-gradient(135deg,#0D47A1,#1565C0)', flexDirection: 'column', gap: '4px', alignItems: 'flex-start', border: 'none' }}>
            <span className="stat-card-val" style={{ color:'#FFFFFF', fontWeight: 800 }}>{activeOrders.length}</span>
            <span className="stat-card-label" style={{ color: '#E0F2FE', opacity: 0.95, fontWeight: 700 }}>Active Orders</span>
          </div>
          <div className="stat-card" style={{ background:'linear-gradient(135deg,#4A148C,#7B1FA2)', flexDirection: 'column', gap: '4px', alignItems: 'flex-start', border: 'none' }}>
            <span className="stat-card-val" style={{ color:'#FFFFFF', fontWeight: 800 }}>{queue?.active_orders ?? '–'}</span>
            <span className="stat-card-label" style={{ color: '#F3E8FF', opacity: 0.95, fontWeight: 700 }}>Queue Depth</span>
          </div>
          <div className="stat-card" style={{ background: queue?.overloaded ? 'linear-gradient(135deg,#b71c1c,#c62828)' : 'linear-gradient(135deg,#1B5E20,#2E7D32)', flexDirection: 'column', gap: '4px', alignItems: 'flex-start', border: 'none' }}>
            <span className="stat-card-val" style={{ color: '#FFFFFF', fontWeight: 800 }}>
              {queue?.estimated_wait_mins ?? '–'}<small style={{ fontSize:'1rem', color: '#FFFFFF', opacity: 0.9 }}> min</small>
            </span>
            <span className="stat-card-label" style={{ color: queue?.overloaded ? '#FEE2E2' : '#DCFCE7', opacity: 0.95, fontWeight: 700 }}>{queue?.overloaded ? 'Busy Now' : 'Est. Wait'}</span>
          </div>
        </div>

        {/* Live Trackers */}
        {activeOrders.length > 0 && (
          <div style={{ marginBottom:'2rem' }}>
            <div className="flex-between" style={{ marginBottom:'1rem' }}>
              <h2 style={{ fontSize:'1.1rem', fontWeight:700, color:'var(--lime-main)' }}>Live Order Tracking</h2>
              <span style={{ fontSize:'0.8rem', color:'var(--text-muted)' }}>Auto-refreshes every 15s</span>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
              {activeOrders.map(o => <OrderTracker key={o.id} order={o}/>)}
            </div>
          </div>
        )}

        {/* Bottom Grid */}
        <div className="grid-2">
          {/* Recent Orders */}
          <div className="card">
            <div className="card-header" style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span>Recent Orders</span>
              <Link to="/orders" style={{ fontSize:'0.78rem', color:'var(--lime-main)' }}>View All →</Link>
            </div>
            <div style={{ padding:0 }}>
              {orders.length === 0 ? (
                <div style={{ padding:'1.5rem', textAlign:'center', color:'var(--text-muted)' }}>
                  <p>No orders yet.</p>
                  <Link to="/menu" className="btn btn-primary btn-sm" style={{ marginTop:'0.75rem', display:'inline-flex' }}>
                    Browse Menu
                  </Link>
                </div>
              ) : orders.slice(0, 5).map(o => (
                <div key={o.id} style={{ padding:'0.85rem 1.25rem', borderBottom:'1px solid rgba(var(--lime-rgb),0.08)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div>
                    <p style={{ fontWeight:700, fontSize:'0.9rem', color:'var(--lime-main)' }}>{o.token_number}</p>
                    <p style={{ fontSize:'0.75rem', color:'var(--text-muted)', textTransform:'capitalize' }}>{o.order_type} · ₹{o.total_amount}</p>
                  </div>
                  <span className={`badge ${o.order_status==='completed'?'badge-green':o.order_status==='cancelled'?'badge-red':o.order_status==='ready'?'badge-green':'badge-blue'}`} style={{ textTransform:'capitalize' }}>
                    {o.order_status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Notifications */}
          <div className="card">
            <div className="card-header">Notifications {notifs.length > 0 && <span className="nav-badge" style={{ marginLeft:'0.5rem' }}>{notifs.length}</span>}</div>
            <div style={{ padding:0 }}>
              {notifs.length === 0 ? (
                <p style={{ padding:'1.25rem', color:'var(--text-muted)' }}>No new notifications.</p>
              ) : notifs.map(n => (
                <div key={n.id} style={{ padding:'0.85rem 1.25rem', borderBottom:'1px solid rgba(var(--lime-rgb),0.08)' }}>
                  <p style={{ fontSize:'0.88rem' }}>{n.message}</p>
                  <p style={{ fontSize:'0.72rem', color:'var(--text-muted)', marginTop:'0.2rem' }}>{new Date(n.created_at).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ marginTop:'2rem', display:'flex', gap:'1rem', flexWrap:'wrap' }}>
          <Link to="/menu"   className="btn btn-primary"><UtensilsCrossed size={15}/> Browse Menu</Link>
          <Link to="/cart"   className="btn btn-outline"><Utensils size={15}/> My Plate</Link>
          <Link to="/queue"  className="btn btn-outline"><Clock size={15}/> Live Queue</Link>
          <Link to="/orders" className="btn btn-outline">All Orders <ChevronRight size={14}/></Link>
        </div>
      </div>
    </>
  );
}
