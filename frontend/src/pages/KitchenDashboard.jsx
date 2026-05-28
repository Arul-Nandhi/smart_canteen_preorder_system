import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import api from '../services/api';
import toast from 'react-hot-toast';

const STATUS_FLOW = { confirmed: 'preparing', preparing: 'ready', ready: 'completed' };
const STATUS_LABEL = { confirmed:'Confirm → Preparing', preparing:'Mark → Ready', ready:'Mark → Completed' };
const BADGE = { confirmed:'badge-blue', preparing:'badge-purple', ready:'badge-green', completed:'badge-orange' };

export default function KitchenDashboard() {
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = () => {
    api.get('/queue/kitchen/').then(r => setOrders(r.data)).catch(()=>{}).finally(()=>setLoading(false));
  };

  useEffect(() => { fetchOrders(); const t = setInterval(fetchOrders, 20000); return ()=>clearInterval(t); }, []);

  const updateStatus = async (id, currentStatus) => {
    const next = STATUS_FLOW[currentStatus];
    if (!next) return;
    try {
      await api.patch(`/orders/${id}/`, { order_status: next });
      toast.success(`Order updated → ${next}`);
      fetchOrders();
    } catch { toast.error('Update failed'); }
  };

  return (
    <>
      <Navbar />
      <div className="page-wrapper">
        <div className="flex-between" style={{marginBottom:'1.5rem'}}>
          <h1 className="page-title" style={{margin:0}}>Kitchen Dashboard 👨‍🍳</h1>
          <div className="flex-gap">
            <span className="badge badge-blue">{orders.filter(o=>o.order_status==='confirmed').length} Confirmed</span>
            <span className="badge badge-purple">{orders.filter(o=>o.order_status==='preparing').length} Preparing</span>
            <span className="badge badge-green">{orders.filter(o=>o.order_status==='ready').length} Ready</span>
          </div>
        </div>

        {loading ? (
          <p style={{color:'var(--text-muted)',textAlign:'center',padding:'3rem'}}>Loading orders…</p>
        ) : orders.length === 0 ? (
          <div style={{textAlign:'center',padding:'4rem',color:'var(--text-muted)'}}>
            <p style={{fontSize:'3rem'}}>✅</p>
            <p style={{fontSize:'1.1rem',marginTop:'0.5rem'}}>All caught up! No active orders.</p>
          </div>
        ) : (
          <div className="grid-3">
            {orders.map(order => (
              <div key={order.id} className="card">
                <div className="card-body">
                  <div className="flex-between" style={{marginBottom:'0.75rem'}}>
                    <span style={{fontWeight:800,fontSize:'1.3rem',color:'var(--lime-main)'}}>{order.token_number}</span>
                    <span className={`badge ${BADGE[order.order_status]}`} style={{textTransform:'capitalize'}}>{order.order_status}</span>
                  </div>
                  <p style={{fontSize:'0.82rem',color:'var(--text-muted)',marginBottom:'0.75rem'}}>
                    {order.user_name} · {order.order_type} · ₹{order.total_amount}
                  </p>
                  <div style={{marginBottom:'1rem'}}>
                    {order.items?.map(i => (
                      <div key={i.id} style={{fontSize:'0.88rem',padding:'0.3rem 0',borderBottom:'1px solid rgba(174,234,0,0.1)'}}>
                        <span style={{fontWeight:600}}>{i.quantity}×</span> {i.item_detail?.item_name}
                        <span style={{float:'right',color:'var(--text-muted)',fontSize:'0.78rem'}}>{i.item_detail?.prep_time_mins}min</span>
                      </div>
                    ))}
                  </div>
                  <p style={{fontSize:'0.78rem',color:'var(--text-muted)',marginBottom:'0.75rem'}}>
                    {new Date(order.created_at).toLocaleTimeString()} · Est. {order.estimated_wait} mins
                  </p>
                  {STATUS_FLOW[order.order_status] && (
                    <button className="btn btn-primary" style={{width:'100%',justifyContent:'center'}}
                      onClick={() => updateStatus(order.id, order.order_status)}>
                      {STATUS_LABEL[order.order_status]}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
