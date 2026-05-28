import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, QrCode, Clock, Navigation, Download } from 'lucide-react';
import Navbar from '../components/Navbar';
import html2canvas from 'html2canvas';

export default function OrderSuccess() {
  const { state }  = useLocation();
  const navigate   = useNavigate();
  const order      = state?.order;
  const isViewing  = state?.isViewingTicket;

  const formatSlotTime = (timeStr) => {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':');
    const hr = parseInt(h);
    const ampm = hr >= 12 ? 'PM' : 'AM';
    const formattedHr = hr % 12 || 12;
    return `${formattedHr}:${m} ${ampm}`;
  };

  const getEstReadyTime = () => {
    if (!order) return '';
    if (order.order_type === 'preorder') {
      if (order.slot_detail) {
        return formatSlotTime(order.slot_detail.start_time);
      }
      return 'Reserved Slot Time';
    } else {
      const baseTime = new Date(order.created_at || Date.now());
      const waitMins = parseInt(order.estimated_wait) || 10;
      const readyTime = new Date(baseTime.getTime() + waitMins * 60 * 1000);
      return readyTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };

  const downloadTicket = () => {
    const node = document.getElementById('digital-ticket');
    if (!node) return;
    html2canvas(node, { backgroundColor: '#13111C' }).then(canvas => {
      const link = document.createElement('a');
      link.download = `SmartServe_Ticket_${order.token_number}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    });
  };

  return (
    <>
      <Navbar />
      <div className="page-wrapper flex-center" style={{flexDirection:'column',gap:'1.5rem',minHeight:'80vh',textAlign:'center'}}>
        {!isViewing && (
          <>
            <div style={{ animation: 'pulse 2s infinite', marginBottom: '-1rem' }}>
              <CheckCircle size={64} color="var(--lime-bright)" strokeWidth={1.5}/>
            </div>
            <div>
              <h1 style={{fontSize:'2.2rem',fontWeight:800,color:'var(--lime-main)', letterSpacing: '-0.5px'}}>Order Confirmed!</h1>
              <p style={{color:'var(--text-muted)',marginTop:'0.5rem'}}>Your food is being prepared. Present this digital ticket at the counter.</p>
            </div>
          </>
        )}
        
        {isViewing && (
          <h1 style={{fontSize:'2rem',fontWeight:800,color:'var(--text-white)'}}>Your Digital Ticket 🎟️</h1>
        )}

        {order && (
          <div id="digital-ticket" style={{
            background: 'var(--surface)', 
            border: '1px solid rgba(174,234,0,0.3)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '360px',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(174,234,0,0.1)'
          }}>
            {/* Top half - Token */}
            <div style={{ padding: '2rem 1.5rem', borderBottom: '2px dashed rgba(174,234,0,0.2)' }}>
              <p style={{fontSize:'0.85rem',color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:2}}>Digital Token</p>
              <div style={{fontSize:'3.5rem',fontWeight:900,color:'var(--text-white)',letterSpacing:4, margin:'0.5rem 0'}}>
                {order.token_number}
              </div>
              <div className="flex-center" style={{ gap: '0.5rem' }}>
                <span className="badge badge-green" style={{textTransform:'capitalize', padding: '0.3rem 0.75rem', fontSize: '0.85rem'}}>
                  {order.order_type}
                </span>
                {order.order_type === 'preorder' ? (
                  <span className="badge badge-purple" style={{ padding: '0.3rem 0.75rem', fontSize: '0.85rem'}}>
                    <Clock size={12} style={{marginRight: 4, display:'inline'}}/> Slot Reserved
                  </span>
                ) : (
                  <span className="badge badge-blue" style={{ padding: '0.3rem 0.75rem', fontSize: '0.85rem'}}>
                    <Clock size={12} style={{marginRight: 4, display:'inline'}}/> ~{order.estimated_wait} mins
                  </span>
                )}
              </div>

              <div style={{
                marginTop: '1.25rem', 
                background: 'rgba(174,234,0,0.05)', 
                borderRadius: '8px', 
                padding: '0.75rem',
                border: '1px solid rgba(174,234,0,0.15)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.25rem'
              }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }} className="flex-center">
                  <Clock size={12} style={{ marginRight: 4 }} color="var(--lime-bright)"/>
                  {order.order_type === 'preorder' ? 'Estimated Slot Pickup' : 'Estimated Ready Time'}
                </div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--lime-main)' }}>
                  {getEstReadyTime()}
                </div>
                {order.order_type === 'preorder' && order.slot_detail && (
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Slot Window: {formatSlotTime(order.slot_detail.start_time)} - {formatSlotTime(order.slot_detail.end_time)}
                  </div>
                )}
                {order.order_type === 'instant' && (
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Est. Prep duration: {order.estimated_wait || 15} mins
                  </div>
                )}
              </div>
            </div>

            {/* Bottom half - QR / Summary */}
            <div style={{ padding: '1.5rem', background: 'rgba(174,234,0,0.03)' }}>
              <div className="flex-between" style={{ marginBottom: '1rem', textAlign:'left' }}>
                <div>
                  <p style={{color:'var(--text-muted)', fontSize:'0.8rem'}}>Amount Paid</p>
                  <p style={{fontWeight:800,fontSize:'1.2rem'}}>₹{order.total_amount}</p>
                </div>
                <div>
                  <p style={{color:'var(--text-muted)', fontSize:'0.8rem'}}>Items</p>
                  <p style={{fontWeight:800,fontSize:'1.2rem'}}>{order.items?.length || 0}</p>
                </div>
              </div>
              
              <div style={{
                background: '#fff', padding: '1rem', borderRadius: '8px',
                display:'flex', alignItems:'center', justifyContent:'center', gap:'1rem', color:'#000'
              }}>
                <QrCode size={48} color="#000" />
                <div style={{ textAlign:'left' }}>
                  <p style={{ fontWeight: 800, fontSize: '0.9rem', lineHeight:1.1 }}>SCAN AT<br/>COUNTER</p>
                  <p style={{ fontSize: '0.65rem', opacity:0.6 }}>SmartServe Verification</p>
                </div>
              </div>
            </div>
            
            {/* Cutout circles for ticket effect */}
            <div style={{ position:'absolute', top:'53%', left:-12, width:24, height:24, background:'var(--charcoal)', borderRadius:'50%' }} />
            <div style={{ position:'absolute', top:'53%', right:-12, width:24, height:24, background:'var(--charcoal)', borderRadius:'50%' }} />
          </div>
        )}

        <div className="flex-gap" style={{ marginTop: '0.5rem', flexWrap:'wrap', justifyContent:'center' }}>
          <button className="btn btn-outline btn-lg" onClick={() => navigate('/queue')}>
            <Navigation size={16}/> Track Live
          </button>
          <button className="btn btn-primary btn-lg" onClick={downloadTicket}>
            <Download size={16}/> Download Ticket
          </button>
        </div>
      </div>
    </>
  );
}
