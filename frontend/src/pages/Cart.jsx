import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, UtensilsCrossed, AlertTriangle, Clock, CreditCard, Wallet, Smartphone } from 'lucide-react';
import Navbar from '../components/Navbar';
import { useCart } from '../context/CartContext';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function Cart() {
  const { cart, removeItem, updateQty, clearCart, total } = useCart();
  const [slots,      setSlots]      = useState([]);
  const [queue,      setQueue]      = useState(null);
  const [orderType,  setOrderType]  = useState('instant');
  const [slotId,     setSlotId]     = useState('');
  const [payMethod,  setPayMethod]  = useState('cash');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [loading,    setLoading]    = useState(false);
  const [activeTokens, setActiveTokens] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/slots/').then(r => setSlots(r.data)).catch(() => {});
    api.get('/queue/status/').then(r => setQueue(r.data)).catch(() => {});
    api.get('/orders/').then(r => {
      const active = r.data.filter(o => ['pending','confirmed','preparing','ready'].includes(o.order_status));
      setActiveTokens(active);
    }).catch(() => {});
  }, []);

  // Auto-suggest preorder if kitchen is busy
  useEffect(() => {
    if (queue?.overloaded && orderType === 'instant') {
      setOrderType('preorder');
      toast('Kitchen is very busy! We recommend preordering.', { icon: '⚠️' });
    }
  }, [queue]);

  const placeOrder = async () => {
    if (!cart.length) return toast.error('Your plate is empty');
    if (orderType === 'preorder' && !slotId) return toast.error('Please select a slot');
    setLoading(true);
    try {
      const payload = {
        order_type:     orderType,
        slot_id:        slotId || null,
        payment_method: payMethod,
        special_instructions: specialInstructions,
        items: cart.map(i => ({ item_id: i.id, quantity: i.qty })),
      };
      const res = await api.post('/orders/', payload);
      clearCart();
      toast.success(`Order placed! Token: ${res.data.token_number}`);
      navigate('/order-success', { state: { order: res.data } });
    } catch (err) {
      const data = err.response?.data;
      if (data?.next_slot_id) {
        setSlotId(data.next_slot_id);
        toast.error(`${data.error} Automatically selected next available slot.`);
      } else {
        toast.error(data?.error || 'Order failed');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!cart.length) return (
    <>
      <Navbar />
      <div className="page-wrapper" style={{ display:'flex', flexDirection:'column', gap:'1.5rem', minHeight:'70vh' }}>
        
        {/* Active Tokens Display (Even when cart is empty) */}
        {activeTokens.length > 0 && (
          <div className="card" style={{ borderLeft:'4px solid var(--lime-main)', animation:'fade-in 0.3s' }}>
            <div className="card-header flex-between">
              <span>🎟️ Your Active Orders</span>
              <button className="btn btn-outline btn-sm" onClick={() => navigate('/queue')}>Track Live</button>
            </div>
            <div className="card-body grid-2">
              {activeTokens.map(order => (
                <div key={order.id} 
                     onClick={() => navigate('/order-success', { state: { order, isViewingTicket: true } })}
                     style={{ background:'var(--surface-hover)', padding:'1rem', borderRadius:'8px', border:'1px solid rgba(174,234,0,0.1)', cursor:'pointer', transition:'transform 0.2s', ':hover':{ transform:'scale(1.02)' } }}>
                  <div className="flex-between">
                    <span style={{ fontWeight:800, color:'var(--lime-main)', fontSize:'1.2rem' }}>{order.token_number}</span>
                    <span className="badge badge-purple" style={{ textTransform:'capitalize' }}>{order.order_status}</span>
                  </div>
                  <p style={{ fontSize:'0.85rem', color:'var(--text-muted)', marginTop:'0.5rem' }}>
                    {order.order_type === 'preorder' && order.slot_detail ? `Preorder • Slot: ${order.slot_detail.start_time}` : `Instant • ~${order.estimated_wait} min wait`}
                  </p>
                  <p style={{ fontSize:'0.75rem', color:'var(--lime-bright)', marginTop:'0.5rem' }}>
                    Tap to view digital ticket 🎫
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex-center" style={{flexDirection:'column',gap:'1.5rem', flex:1}}>
          <div style={{
            width:100,height:100,borderRadius:'50%',
            background:'rgba(174,234,0,0.08)',
            border:'2px solid rgba(174,234,0,0.2)',
            display:'flex',alignItems:'center',justifyContent:'center'
          }}>
            <UtensilsCrossed size={48} style={{color:'rgba(174,234,0,0.4)'}}/>
          </div>
          <div style={{textAlign:'center'}}>
            <p style={{color:'var(--text-white)',fontSize:'1.25rem',fontWeight:700,marginBottom:'0.5rem'}}>Your Plate is Empty</p>
            <p style={{color:'var(--text-muted)',fontSize:'0.95rem'}}>Browse the menu and add items to your plate</p>
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/menu')}>Browse Menu</button>
        </div>
      </div>
    </>
  );

  return (
    <>
      <Navbar />
      <div className="page-wrapper">
        <div className="flex-between" style={{ marginBottom:'1.5rem' }}>
          <h1 className="page-title" style={{ margin:0 }}>Your Plate 🍽️</h1>
          {activeTokens.length > 0 && (
            <button className="btn btn-outline btn-sm" onClick={() => navigate('/queue')}>
              🎟️ You have {activeTokens.length} active order{activeTokens.length > 1 ? 's' : ''}
            </button>
          )}
        </div>
        <div className="grid-2-1" style={{ alignItems:'start' }}>
          <div style={{display:'flex',flexDirection:'column',gap:'0.75rem'}}>
            {cart.map(item => (
              <div key={item.id} className="card">
                <div className="card-body flex-between">
                  <div>
                    <p style={{fontWeight:700}}>{item.item_name}</p>
                    <p style={{color:'var(--text-muted)',fontSize:'0.85rem'}}>₹{item.price} each</p>
                  </div>
                  <div className="flex-gap">
                    <button className="btn btn-outline btn-sm" onClick={() => updateQty(item.id, item.qty-1)}>−</button>
                    <span style={{fontWeight:700,minWidth:24,textAlign:'center'}}>{item.qty}</span>
                    <button className="btn btn-primary btn-sm" onClick={() => updateQty(item.id, item.qty+1)}>+</button>
                    <span style={{fontWeight:700,color:'var(--lime-main)',minWidth:60,textAlign:'right'}}>₹{(item.price*item.qty).toFixed(2)}</span>
                    <button className="btn btn-danger btn-sm" onClick={() => removeItem(item.id)}><Trash2 size={13}/></button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{display:'flex',flexDirection:'column',gap:'1.25rem'}}>
            
            {/* Smart Suggestion Banner */}
            {queue && queue.overloaded && orderType === 'instant' && (
              <div style={{ background:'rgba(239,83,80,0.1)', border:'1px solid rgba(239,83,80,0.3)', borderRadius:'8px', padding:'1rem', display:'flex', gap:'0.75rem', alignItems:'flex-start' }}>
                <AlertTriangle size={20} color="#EF5350" style={{marginTop:2}}/>
                <div>
                  <p style={{fontWeight:700, color:'#EF5350', fontSize:'0.95rem'}}>High Wait Times Expected</p>
                  <p style={{fontSize:'0.82rem', color:'var(--text-muted)', marginTop:'0.25rem'}}>
                    The kitchen currently has {queue.active_orders} orders (~{queue.estimated_wait_mins} min wait). Consider switching to a <strong>Preorder Slot</strong>.
                  </p>
                </div>
              </div>
            )}

            <div className="card" style={{position:'sticky',top:80}}>
              <div className="card-header">Plate Summary</div>
              <div className="card-body" style={{display:'flex',flexDirection:'column',gap:'1.25rem'}}>
                
                {/* Order Type */}
                <div className="form-group" style={{marginBottom:0}}>
                  <label className="form-label" style={{display:'flex', justifyContent:'space-between'}}>
                    Order Type
                    {orderType === 'instant' ? <span className="badge badge-orange badge-xs">Live Queue</span> : <span className="badge badge-purple badge-xs">Reserved</span>}
                  </label>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.5rem' }}>
                    <button className={`btn btn-sm ${orderType === 'instant' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setOrderType('instant')} style={{justifyContent:'center'}}>
                      Instant
                    </button>
                    <button className={`btn btn-sm ${orderType === 'preorder' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setOrderType('preorder')} style={{justifyContent:'center'}}>
                      Preorder
                    </button>
                  </div>
                </div>

                {/* Slots */}
                {orderType === 'preorder' && (
                  <div className="form-group" style={{marginBottom:0, animation:'fade-in 0.3s'}}>
                    <label className="form-label">Pickup Slot <Clock size={12} style={{display:'inline', marginLeft:4}}/></label>
                    <select className="form-select" value={slotId} onChange={e => setSlotId(e.target.value)}>
                      <option value="">-- Select Available Slot --</option>
                      {slots.filter(s => s.slot_status === 'open').map(s => (
                        <option key={s.id} value={s.id}>
                          {s.start_time} – {s.end_time} ({s.available_capacity} left)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Special Instructions */}
                <div className="form-group" style={{marginBottom:0, animation:'fade-in 0.3s'}}>
                  <label className="form-label">Special Instructions (Optional)</label>
                  <textarea
                    className="form-input"
                    rows={2}
                    value={specialInstructions}
                    onChange={e => setSpecialInstructions(e.target.value)}
                    placeholder="e.g. Less spicy, no onions, extra sauce…"
                    style={{ resize:'none', fontSize:'0.88rem' }}
                  />
                </div>

                {/* Payment */}
                <div className="form-group" style={{marginBottom:0}}>
                  <label className="form-label">Payment Method</label>
                  <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
                    <label style={{ display:'flex', alignItems:'center', gap:'0.75rem', padding:'0.75rem', border:'1px solid rgba(174,234,0,0.2)', borderRadius:'8px', cursor:'pointer', background: payMethod==='cash' ? 'rgba(174,234,0,0.08)' : 'transparent' }}>
                      <input type="radio" name="pay" value="cash" checked={payMethod==='cash'} onChange={(e)=>setPayMethod(e.target.value)} style={{accentColor:'var(--lime-main)'}}/>
                      <Wallet size={16} color="var(--lime-main)"/> <span style={{fontSize:'0.9rem', fontWeight:600}}>Cash at Counter</span>
                    </label>
                    <label style={{ display:'flex', alignItems:'center', gap:'0.75rem', padding:'0.75rem', border:'1px solid rgba(174,234,0,0.2)', borderRadius:'8px', cursor:'pointer', background: payMethod==='upi' ? 'rgba(174,234,0,0.08)' : 'transparent' }}>
                      <input type="radio" name="pay" value="upi" checked={payMethod==='upi'} onChange={(e)=>setPayMethod(e.target.value)} style={{accentColor:'var(--lime-main)'}}/>
                      <Smartphone size={16} color="var(--lime-main)"/> <span style={{fontSize:'0.9rem', fontWeight:600}}>UPI (GPay / PhonePe)</span>
                    </label>
                    <label style={{ display:'flex', alignItems:'center', gap:'0.75rem', padding:'0.75rem', border:'1px solid rgba(174,234,0,0.2)', borderRadius:'8px', cursor:'pointer', background: payMethod==='card' ? 'rgba(174,234,0,0.08)' : 'transparent' }}>
                      <input type="radio" name="pay" value="card" checked={payMethod==='card'} onChange={(e)=>setPayMethod(e.target.value)} style={{accentColor:'var(--lime-main)'}}/>
                      <CreditCard size={16} color="var(--lime-main)"/> <span style={{fontSize:'0.9rem', fontWeight:600}}>Credit / Debit Card</span>
                    </label>
                  </div>
                </div>

                <div style={{borderTop:'2px dashed rgba(174,234,0,0.15)',paddingTop:'1rem', marginTop:'0.5rem'}}>
                  <div className="flex-between" style={{marginBottom:'0.5rem'}}>
                    <span style={{color:'var(--text-muted)'}}>Subtotal</span>
                    <span style={{fontWeight:700}}>₹{total.toFixed(2)}</span>
                  </div>
                  <div className="flex-between">
                    <span style={{color:'var(--text-muted)'}}>Items on Plate</span>
                    <span>{cart.reduce((s,i)=>s+i.qty,0)}</span>
                  </div>
                </div>

                <button className="btn btn-primary btn-lg" style={{justifyContent:'center', marginTop:'0.5rem'}} onClick={placeOrder} disabled={loading}>
                  {loading ? 'Placing Order…' : `Confirm Order · ₹${total.toFixed(2)}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
