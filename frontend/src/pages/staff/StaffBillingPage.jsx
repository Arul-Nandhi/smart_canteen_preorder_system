import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, Search, Clock, CreditCard, Check, AlertTriangle, ShieldCheck } from 'lucide-react';
import StaffLayout from '../../components/StaffLayout';
import api from '../../services/api';
import toast from 'react-hot-toast';

/**
 * CASH / UPI DUMMY QR BILLING MODAL
 */
function BillingModal({ order, onConfirm, onClose }) {
  const total = parseFloat(order.total_amount || 0);
  const [paymentMethod, setPaymentMethod] = useState('cash'); // 'cash' or 'upi'
  const [receivedAmount, setReceivedAmount] = useState(total);
  const [notes, setNotes] = useState('');
  const [upiConfirmed, setUpiConfirmed] = useState(false);
  
  const change = parseFloat(receivedAmount || 0) - total;
  const isValid = paymentMethod === 'cash' 
    ? parseFloat(receivedAmount || 0) >= total 
    : upiConfirmed;

  const mockUpiId = "smartcanteen@okaxis";
  const upiUri = `upi://pay?pa=${mockUpiId}&pn=SmartCanteen&am=${total.toFixed(2)}&cu=INR&tn=Token_${order.token_number}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(upiUri)}`;

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16
    }}>
      <div onClick={e => e.stopPropagation()} className="admin-card" style={{ 
        width: '100%', maxWidth: 420, padding: 24, maxHeight: '90vh', overflowY: 'auto', borderRadius: 16 
      }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '0 0 16px', color: 'var(--text-1)' }}>
          Complete Counter Payment
        </h2>

        {/* Payment Method Selector */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          {['cash', 'upi'].map(method => (
            <button
              key={method}
              type="button"
              onClick={() => {
                setPaymentMethod(method);
                if (method === 'upi') setReceivedAmount(total);
              }}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 8,
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                border: '1px solid var(--border)',
                background: paymentMethod === method ? 'var(--teal-soft)' : 'var(--surface-3)',
                color: paymentMethod === method ? 'var(--teal)' : 'var(--text-2)',
                borderColor: paymentMethod === method ? 'var(--teal)' : 'var(--border)',
                transition: 'all 0.15s'
              }}
            >
              {method === 'cash' ? 'Cash Payment' : 'UPI / QR Scan'}
            </button>
          ))}
        </div>

        {/* Bill Summary */}
        <div style={{ background: 'var(--surface-2)', padding: 16, borderRadius: 12, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: '0.9rem' }}>
            <span style={{ color: 'var(--text-3)' }}>Order ID:</span>
            <span style={{ fontWeight: 700, color: 'var(--text-1)' }}>#{order.id}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: '0.9rem' }}>
            <span style={{ color: 'var(--text-3)' }}>Token Number:</span>
            <span style={{ fontWeight: 800, color: 'var(--teal)' }}>{order.token_number}</span>
          </div>
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem' }}>
            <span style={{ color: 'var(--text-2)' }}>Total Amount:</span>
            <span style={{ fontWeight: 900, color: 'var(--teal)' }}>₹{total.toFixed(2)}</span>
          </div>
        </div>

        {/* Payment Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
          {paymentMethod === 'cash' ? (
            <>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                  Amount Received
                </label>
                <input
                  type="number"
                  value={receivedAmount}
                  onChange={e => setReceivedAmount(e.target.value)}
                  className="admin-input"
                  style={{ fontSize: '1.1rem', fontWeight: 700 }}
                />
              </div>

              {/* Change calculation */}
              <div style={{
                background: change >= 0 ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                border: `1px solid ${change >= 0 ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                padding: 12, borderRadius: 10,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-2)' }}>Change:</span>
                <span style={{
                  fontSize: '1.2rem', fontWeight: 900,
                  color: change >= 0 ? '#22c55e' : '#ef4444'
                }}>
                  ₹{change.toFixed(2)}
                </span>
              </div>
            </>
          ) : (
            <div style={{ 
              padding: 16, 
              background: 'rgba(20,209,178,0.06)', 
              border: '1px solid rgba(20,209,178,0.2)', 
              borderRadius: 10, 
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 10
            }}>
                SCAN TO PAY USING ANY UPI APP
              
              <div style={{ 
                background: '#FFFFFF', 
                padding: 10, 
                borderRadius: 8, 
                display: 'inline-flex',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
              }}>
                <img 
                  src={qrCodeUrl} 
                  alt="UPI QR Code" 
                  style={{ width: 140, height: 140, display: 'block' }}
                />
              </div>

              <div style={{ fontSize: '0.82rem', color: 'var(--teal)', fontWeight: 700, marginTop: 4 }}>
                UPI ID: <code style={{ background: 'var(--surface-3)', padding: '2px 6px', borderRadius: 4, fontFamily: 'monospace' }}>{mockUpiId}</code>
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-1)', fontWeight: 800 }}>
                Amount: ₹{total.toFixed(2)}
              </div>
              
              {/* Checkbox for manual confirmation */}
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 8, 
                marginTop: 8, 
                padding: '8px 12px',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: 6,
                border: '1px solid rgba(255,255,255,0.05)',
                cursor: 'pointer',
                width: '100%',
                boxSizing: 'border-box',
                textAlign: 'left'
              }}>
                <input 
                  type="checkbox" 
                  checked={upiConfirmed} 
                  onChange={e => setUpiConfirmed(e.target.checked)}
                  style={{ width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--teal)' }}
                />
                <span style={{ fontSize: '0.78rem', color: 'var(--text-2)', fontWeight: 600 }}>
                  Confirm Payment Received (Manually OK)
                </span>
              </label>
            </div>
          )}

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
              Billing Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="admin-input"
              placeholder="Special notes for this payment..."
              style={{ height: 60, resize: 'none' }}
            />
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => onConfirm(paymentMethod === 'upi' ? total : receivedAmount, notes, paymentMethod)}
            disabled={!isValid}
            style={{
              flex: 1, padding: '12px 16px', borderRadius: 10, fontWeight: 800,
              border: 'none', cursor: isValid ? 'pointer' : 'not-allowed',
              background: isValid ? 'linear-gradient(135deg, #14D1B2, #0fa88e)' : 'var(--surface-3)',
              color: isValid ? '#0B1A18' : 'var(--text-3)',
              opacity: isValid ? 1 : 0.5, transition: 'all 0.2s'
            }}
          >
            {paymentMethod === 'upi' ? 'Manually Confirm Paid (OK)' : 'Confirm Cash Payment'}
          </button>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: '12px 16px', borderRadius: 10, fontWeight: 800,
              border: '1px solid var(--border)', cursor: 'pointer',
              background: 'transparent', color: 'var(--text-2)', transition: 'all 0.2s'
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * MAIN COUNTER BILLING PAGE
 */
export default function StaffBillingPage() {
  const [orders, setOrders] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [billingOrder, setBillingOrder] = useState(null);
  const [menuItems, setMenuItems] = useState([]);

  useEffect(() => {
    api.get('/menu/').then(r => setMenuItems(r.data)).catch(() => {});
  }, []);

  const getComboConstituentsText = (comboItemIds) => {
    if (!comboItemIds) return '';
    let ids = [];
    try {
      ids = typeof comboItemIds === 'string' ? JSON.parse(comboItemIds) : comboItemIds;
    } catch {
      return '';
    }
    if (!Array.isArray(ids)) return '';
    return ids.map(id => menuItems.find(i => i.id === id)?.item_name).filter(Boolean).join(' + ');
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/orders/');
      const all = Array.isArray(res.data) ? res.data : [];
      setAllOrders(all);
      // Filter orders that have pending cash payments in either ready or completed statuses
      const pendingBills = all.filter(o => 
        ['ready', 'completed'].includes(o.order_status) && 
        o.payment?.payment_method === 'cash' && 
        o.payment?.payment_status === 'pending'
      );
      setOrders(pendingBills);
    } catch {
      toast.error('Failed to load pending bills');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 7000);
    return () => clearInterval(interval);
  }, [load]);

  const handleBillingConfirm = async (orderId, receivedAmount, notes, paymentMethod) => {
    try {
      const payload = { 
        received_amount: parseFloat(receivedAmount), 
        notes,
        payment_method: paymentMethod 
      };
      await api.post(`/orders/${orderId}/bill/`, payload);
      toast.success('Counter payment confirmed successfully!');
      
      // Fetch receipt HTML and trigger print dialog
      try {
        const res = await api.get(`/orders/${orderId}/receipt/`);
        const html = res.data.html;
        const w = window.open('', '_blank');
        w.document.write(html);
        w.document.close();
        w.focus();
        w.print();
      } catch (err) {
        // Continue silently if printer fails
      }
      setBillingOrder(null);
      load();
    } catch (err) {
      toast.error('Failed to process billing transaction');
    }
  };

  const filtered = orders.filter(o => 
    o.token_number?.toUpperCase().includes(search.toUpperCase()) ||
    o.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
    o.id?.toString().includes(search)
  );

  return (
    <StaffLayout title="Counter Billing Desk" subtitle="Verify transactions, scan dummy UPI codes, and print official slips">
      <div className="dash-page" style={{ maxWidth: 1000, margin: '0 auto' }}>
        
        {/* HEADER TOOLBAR */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 12, flex: 1, maxWidth: 450, position: 'relative' }}>
            <input
              className="admin-input"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search pending bills by Token, Name, or ID..."
              style={{ height: 40, paddingLeft: 38 }}
            />
            <Search size={16} style={{ position: 'absolute', left: 14, top: 12, color: 'var(--text-3)' }} />
          </div>
          <button onClick={load} className="dash-btn dash-btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 6, height: 40 }}>
            <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh Desk
          </button>
        </div>

        {/* STATS OVERVIEW */}
        {(() => {
          const todayStr = new Date().toISOString().split('T')[0];
          // Revenue collected today: cash orders billed + online/UPI preorders paid at order time
          const collectedToday = allOrders.filter(o =>
            o.created_at?.startsWith(todayStr) &&
            o.order_status === 'completed' &&
            o.payment?.payment_status === 'success'
          ).reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);
          // Also count UPI preorders that are completed today regardless of collection method
          const upiOnlineToday = allOrders.filter(o =>
            o.created_at?.startsWith(todayStr) &&
            ['ready', 'completed'].includes(o.order_status) &&
            o.payment?.payment_method !== 'cash' &&
            o.payment?.payment_status === 'success'
          ).reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);
          return (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
              <div className="admin-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(234,179,8,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#eab308' }}>
                  <Clock size={22} />
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-3)', display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>Unpaid collections</span>
                  <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#eab308' }}>{orders.length} orders</span>
                </div>
              </div>
              <div className="admin-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(20,209,178,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--teal)' }}>
                  <CreditCard size={22} />
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-3)', display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>Revenue collected today</span>
                  <span style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--teal)' }}>
                    ₹{collectedToday.toFixed(2)}
                  </span>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-3)', display: 'block', marginTop: 2 }}>
                    incl. ₹{upiOnlineToday.toFixed(2)} UPI / online
                  </span>
                </div>
              </div>
            </div>
          );
        })()}

        {/* PENDING BILLS LIST */}
        <h2 className="dash-section-title">Unpaid Orders Awaiting Settlement ({filtered.length})</h2>
        {loading && orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ width: 36, height: 36, border: '3px solid var(--teal)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 12px' }} />
            <p style={{ color: 'var(--text-3)' }}>Syncing billing registry...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', border: '1.5px dashed var(--border)', borderRadius: 16, background: 'var(--surface-2)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck size={40} color="var(--teal)" style={{ marginBottom: 12 }} />
            <h3 style={{ margin: '0 0 6px 0', fontSize: '1.1rem', color: 'var(--text-2)' }}>All collections cleared!</h3>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-3)' }}>No unpaid or pending cash handovers in the queue.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: 20 }}>
            {filtered.map(order => {
              const totalAmt = parseFloat(order.total_amount || 0);
              return (
                <div key={order.id} className="dash-card" style={{ 
                  borderTop: `4px solid ${order.order_status === 'completed' ? 'var(--teal)' : '#eab308'}`,
                  padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 240
                }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: 900, color: 'var(--lime-bright)', fontSize: '1.6rem', fontFamily: 'monospace' }}>
                            {order.token_number}
                          </span>
                          <span className={`badge ${order.order_status === 'completed' ? 'badge-green' : 'badge-orange'}`} style={{ textTransform: 'capitalize', fontSize: '0.7rem' }}>
                            {order.order_status === 'completed' ? 'Delivered' : 'Ready'}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-3)', background: 'var(--surface-3)', padding: '2px 6px', borderRadius: 4, fontWeight: 700, display: 'inline-block', marginTop: 4 }}>
                          {order.order_type === 'preorder' ? 'Preorder' : 'Instant'}
                        </span>
                      </div>
                      <span style={{ fontWeight: 800, color: 'var(--teal)', fontSize: '1.25rem' }}>₹{totalAmt.toFixed(2)}</span>
                    </div>

                    <div style={{ fontSize: '0.8rem', color: 'var(--text-2)', marginBottom: 12 }}>
                      <span style={{ color: 'var(--text-3)', display: 'block', marginBottom: 2 }}>Customer</span>
                      <strong style={{ color: 'var(--text-1)' }}>{order.user_name || 'Unknown User'}</strong>
                    </div>

                    {/* Food Items snapshot */}
                    <div style={{ borderTop: '1px dashed var(--border)', paddingTop: 8, marginBottom: 16 }}>
                      {order.items?.map((item, idx) => (
                        <div key={idx} style={{ fontSize: '0.78rem', color: 'var(--text-2)', padding: '3px 0' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>{item.item_detail?.item_name || 'Canteen Item'}</span>
                            <span style={{ fontWeight: 700, color: 'var(--text-3)' }}>×{item.quantity}</span>
                          </div>
                          {item.item_detail?.category === 'combo' && item.item_detail?.combo_items && (
                            <div style={{ fontSize: '0.72rem', color: 'var(--teal)', fontWeight: 500, marginTop: 2, paddingLeft: 6 }}>
                              ↳ Includes: {getComboConstituentsText(item.item_detail.combo_items)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => setBillingOrder(order)}
                    style={{
                      width: '100%', height: 38, border: 'none', cursor: 'pointer', borderRadius: 8,
                      background: 'linear-gradient(135deg, #fb923c, #f97316)',
                      color: '#000', fontWeight: 800, fontSize: '0.82rem',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      boxShadow: '0 4px 12px rgba(249,115,22,0.2)'
                    }}
                  >
                    <CreditCard size={14} /> Settle bill & complete
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* BILLING MODAL CONTAINER */}
        {billingOrder && (
          <BillingModal
            order={billingOrder}
            onConfirm={(amt, notes, method) => {
              handleBillingConfirm(billingOrder.id, amt, notes, method);
            }}
            onClose={() => setBillingOrder(null)}
          />
        )}
      </div>
    </StaffLayout>
  );
}
