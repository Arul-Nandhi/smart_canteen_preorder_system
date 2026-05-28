import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, PackageOpen, RotateCcw } from 'lucide-react';
import Navbar from '../components/Navbar';
import { useCart } from '../context/CartContext';
import api from '../services/api';
import toast from 'react-hot-toast';

const STATUS_BADGE = {
  pending:   'badge-orange', confirmed: 'badge-blue', preparing: 'badge-purple',
  ready:     'badge-green',  completed: 'badge-green', cancelled: 'badge-red',
};

export default function OrderHistory() {
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState('');
  const navigate = useNavigate();
  const { addItem, clearCart } = useCart();

  const fetchOrders = () => {
    setLoading(true);
    api.get('/orders/').then(r => setOrders(r.data)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrders(); }, []);

  const handleReorder = (order) => {
    if (!order.items || order.items.length === 0) return;
    clearCart();
    order.items.forEach(i => {
      // Create a mock item structure that matches what addItem expects
      addItem({
        id: i.item_detail?.id || i.item_id,
        item_name: i.item_detail?.item_name || 'Item',
        price: i.item_detail?.price || 0,
        qty: i.quantity
      });
    });
    toast.success('Items added to plate!');
    navigate('/cart');
  };

  const todayStr = new Date().toLocaleDateString('sv-SE');
  const activeOrders = orders.filter(o => ['pending','confirmed','preparing','ready'].includes(o.order_status));
  const pastOrders = orders.filter(o => {
    const isPast = ['completed','cancelled'].includes(o.order_status);
    if (!isPast) return false;
    const orderDate = o.created_at?.slice(0, 10);
    if (filterDate) {
      return orderDate === filterDate;
    }
    return orderDate === todayStr;
  });

  const renderOrderCard = (order, isActive) => (
    <div key={order.id} className="card" style={{ borderLeft: isActive ? '3px solid var(--lime-main)' : 'none' }}>
      <div className="card-body">
        <div className="flex-between" style={{flexWrap:'wrap',gap:'0.75rem', marginBottom:'0.5rem'}}>
          <div className="flex-gap">
            <span style={{fontWeight:900,fontSize:'1.15rem',color: isActive ? 'var(--lime-bright)' : 'var(--text-white)'}}>{order.token_number}</span>
            <span className={`badge ${STATUS_BADGE[order.order_status] || 'badge-blue'}`} style={{textTransform:'capitalize'}}>
              {order.order_status}
            </span>
            <span className="badge badge-outline" style={{textTransform:'capitalize', borderColor:'rgba(255,255,255,0.1)'}}>{order.order_type}</span>
          </div>
          <span style={{fontWeight:800,fontSize:'1.2rem',color:'var(--lime-main)'}}>₹{order.total_amount}</span>
        </div>
        
        <p style={{color:'var(--text-muted)',fontSize:'0.82rem', marginBottom:'0.75rem'}}>
          {new Date(order.created_at).toLocaleString()} {isActive && `· Est. ${order.estimated_wait} mins`}
        </p>

        {order.items?.length > 0 && (
          <div style={{paddingTop:'0.75rem',borderTop:'1px dashed rgba(174,234,0,0.15)', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <div style={{ display:'flex', flexWrap:'wrap', gap:'0.5rem' }}>
              {order.items.map(i => (
                <span key={i.id} style={{fontSize:'0.85rem',color:'var(--text-muted)', background:'rgba(255,255,255,0.05)', padding:'0.2rem 0.5rem', borderRadius:'4px'}}>
                  <strong style={{color:'var(--text-white)'}}>{i.quantity}×</strong> {i.item_detail?.item_name || 'Item'}
                </span>
              ))}
            </div>
            {!isActive && (
              <button className="btn btn-sm btn-outline" onClick={() => handleReorder(order)} title="Order Again">
                <RotateCcw size={14}/> Reorder
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      <Navbar />
      <div className="page-wrapper">
        <div className="flex-between" style={{ marginBottom:'1.5rem', flexWrap:'wrap', gap:'1rem' }}>
          <h1 className="page-title" style={{ margin:0 }}>Order History 📜</h1>
          <button className="btn btn-outline btn-sm" onClick={fetchOrders}><RefreshCw size={14}/> Refresh</button>
        </div>

        {loading ? (
          <div style={{textAlign:'center',padding:'4rem'}}>
            <div className="spin-loader" />
            <p style={{color:'var(--text-muted)',marginTop:'1rem'}}>Loading your history…</p>
          </div>
        ) : orders.length === 0 ? (
          <div style={{textAlign:'center',padding:'5rem', color:'var(--text-muted)'}}>
            <PackageOpen size={48} style={{margin:'0 auto', opacity:0.3, marginBottom:'1rem'}}/>
            <p style={{fontSize:'1.2rem', fontWeight:600, color:'var(--text-white)'}}>No orders yet</p>
            <p style={{fontSize:'0.9rem', marginTop:'0.5rem'}}>Your past and active orders will appear here.</p>
            <button className="btn btn-primary" style={{marginTop:'1.5rem'}} onClick={() => navigate('/menu')}>Start Ordering</button>
          </div>
        ) : (
          <div style={{display:'flex',flexDirection:'column',gap:'2.5rem'}}>
            
            {/* DATE FILTER SEARCH BAR */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.75rem', 
              background: 'rgba(255,255,255,0.03)', 
              padding: '10px 16px', 
              borderRadius: '12px', 
              border: '1px solid rgba(255,255,255,0.06)',
              flexWrap: 'wrap'
            }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>🔍 Filter Older History by Date:</span>
              <input 
                type="date" 
                value={filterDate} 
                onChange={e => setFilterDate(e.target.value)}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: 'var(--text-white)',
                  padding: '0.4rem 0.75rem',
                  fontSize: '0.85rem',
                  outline: 'none',
                  colorScheme: 'dark'
                }}
              />
              {filterDate && (
                <button 
                  onClick={() => setFilterDate('')}
                  style={{
                    background: 'rgba(239,68,68,0.15)',
                    color: '#ef4444',
                    border: 'none',
                    padding: '0.4rem 1rem',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  Show Today's Orders
                </button>
              )}
            </div>

            {activeOrders.length > 0 && (
              <div>
                <h2 style={{ fontSize:'1.1rem', fontWeight:700, color:'var(--lime-main)', marginBottom:'1rem' }}>
                  🔴 Active Orders ({activeOrders.length})
                </h2>
                <div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
                  {activeOrders.map(o => renderOrderCard(o, true))}
                </div>
              </div>
            )}

            <div>
              <h2 style={{ fontSize:'1.1rem', fontWeight:700, color:'var(--text-muted)', marginBottom:'1rem' }}>
                🕰️ {filterDate ? `Past Orders on ${filterDate}` : "Today's Past Orders"}
              </h2>
              {pastOrders.length > 0 ? (
                <div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
                  {pastOrders.map(o => renderOrderCard(o, false))}
                </div>
              ) : (
                <div style={{ padding: '24px 12px', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 12, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  {filterDate ? `No completed or cancelled orders found on ${filterDate}.` : "No completed or cancelled orders today yet."}
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </>
  );
}
