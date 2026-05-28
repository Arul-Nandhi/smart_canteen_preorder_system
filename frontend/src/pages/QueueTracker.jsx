import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import Navbar from '../components/Navbar';
import api from '../services/api';

export default function QueueTracker() {
  const navigate = useNavigate();
  const [queue,   setQueue]   = useState(null);
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetch = useCallback(async () => {
    try {
      const [q, o] = await Promise.all([
        api.get('/queue/status/'),
        api.get('/orders/'),
      ]);
      setQueue(q.data);
      setOrders(o.data.filter(x => ['pending','confirmed','preparing','ready'].includes(x.order_status)));
      setLastUpdated(new Date().toLocaleTimeString());
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetch();
    const t = setInterval(fetch, 15000);
    return () => clearInterval(t);
  }, [fetch]);

  const myActive = orders.filter(o => ['pending','confirmed','preparing'].includes(o.order_status));
  const readyOrders = orders.filter(o => o.order_status === 'ready');

  return (
    <>
      <Navbar />
      <div className="page-wrapper">
        <div className="flex-between" style={{ marginBottom:'1.5rem', flexWrap:'wrap', gap:'1rem' }}>
          <h1 className="page-title" style={{ margin:0 }}>Live Queue</h1>
          <div className="flex-gap">
            {lastUpdated && <span style={{ fontSize:'0.78rem', color:'var(--text-muted)' }}>Updated {lastUpdated}</span>}
            <button className="btn btn-outline btn-sm" onClick={fetch}><RefreshCw size={14}/></button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign:'center', padding:'4rem', color:'var(--text-muted)' }}>
            <div className="spin-loader"/>
            <p style={{ marginTop:'1rem' }}>Loading queue…</p>
          </div>
        ) : (
          <>
            {/* Queue Banner */}
            {queue && (
              <div className={`queue-banner ${queue.overloaded ? 'overloaded' : ''}`}>
                <div>
                  <p style={{ fontSize:'1rem', fontWeight:700 }}>
                    {queue.overloaded ? 'Kitchen is Busy' : 'Kitchen Normal'}
                  </p>
                  <p style={{ fontSize:'0.85rem', opacity:0.8, marginTop:'0.3rem' }}>
                    {queue.active_orders} orders in queue
                  </p>
                  <p style={{ fontSize:'0.82rem', opacity:0.7, marginTop:'0.15rem' }}>
                    Auto-refreshes every 15 seconds
                  </p>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div className="queue-token">~{queue.estimated_wait_mins}</div>
                  <p style={{ fontSize:'0.78rem', opacity:0.7 }}>min estimated wait</p>
                </div>
              </div>
            )}

            {/* Ready for pickup */}
            {readyOrders.length > 0 && (
              <div style={{ marginBottom:'1.5rem' }}>
                <h2 style={{ fontSize:'1.05rem', fontWeight:700, color:'#AEEA00', marginBottom:'0.75rem' }}>
                  Ready for Pickup!
                </h2>
                <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
                  {readyOrders.map(o => (
                    <div key={o.id} onClick={() => navigate('/order-success', { state: { order: o, isViewingTicket: true } })} className="ready-queue-card">
                      <div>
                        <span style={{ fontWeight:800, fontSize:'1.3rem', color:'var(--lime-main)' }}>{o.token_number}</span>
                        <p style={{ fontSize:'0.82rem', color:'var(--text-muted)', marginTop:'0.2rem' }}>₹{o.total_amount}</p>
                        <p style={{ fontSize:'0.75rem', color:'var(--lime-bright)', marginTop:'0.2rem' }}>Tap for ticket</p>
                      </div>
                      <span className="badge badge-green" style={{ fontSize:'0.9rem', padding:'0.4rem 1rem' }}>
                        READY!
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* My Active Orders */}
            {myActive.length > 0 ? (
              <div>
                <h2 style={{ fontSize:'1.05rem', fontWeight:700, color:'var(--text-muted)', marginBottom:'0.75rem' }}>
                  Your Active Orders
                </h2>
                <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
                  {myActive.map((o, idx) => (
                    <div key={o.id} className="card" onClick={() => navigate('/order-success', { state: { order: o, isViewingTicket: true } })} style={{ padding:'1.25rem', borderLeft:`3px solid ${o.order_status==='pending'?'#FFB74D':o.order_status==='confirmed'?'#42A5F5':'#CE93D8'}`, cursor:'pointer', transition:'transform 0.2s', ':hover':{ transform:'scale(1.01)' } }}>
                      <div className="flex-between">
                        <div>
                          <div className="flex-gap">
                            <span style={{ fontWeight:800, fontSize:'1.2rem', color:'var(--lime-main)' }}>{o.token_number}</span>
                            <span className={`badge ${o.order_status==='pending'?'badge-orange':o.order_status==='confirmed'?'badge-blue':'badge-purple'}`} style={{ textTransform:'capitalize' }}>
                              {o.order_status}
                            </span>
                          </div>
                          <p style={{ fontSize:'0.82rem', color:'var(--text-muted)', marginTop:'0.3rem' }}>
                            ₹{o.total_amount} · {o.order_type}
                          </p>
                        </div>
                        <div style={{ textAlign:'right' }}>
                          <div style={{ fontSize:'1.6rem', fontWeight:800, color:'var(--lime-main)' }}>
                            #{idx + 1}
                          </div>
                          <p style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>in queue</p>
                        </div>
                      </div>

                      {/* Mini progress */}
                      <div style={{ marginTop:'1rem', display:'flex', gap:'0.5rem', alignItems:'center' }}>
                        {['pending','confirmed','preparing','ready'].map((stage, si) => {
                          const stages = ['pending','confirmed','preparing','ready'];
                          const cur = stages.indexOf(o.order_status);
                          const done = si <= cur;
                          return (
                            <div key={stage} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:'0.3rem' }}>
                              <div style={{ height:4, width:'100%', borderRadius:999, background: done ? 'var(--lime-bright)' : 'rgba(174,234,0,0.15)', transition:'background 0.4s' }}/>
                              <span style={{ fontSize:'0.6rem', color: done ? 'var(--lime-main)' : 'var(--text-muted)', textTransform:'capitalize' }}>
                                {stage}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {o.estimated_wait > 0 && (
                        <div className="flex-between" style={{ marginTop:'0.75rem' }}>
                          <p style={{ fontSize:'0.78rem', color:'var(--text-muted)' }}>
                            ⏱ ~{o.estimated_wait} min estimated
                          </p>
                          <p style={{ fontSize:'0.75rem', color:'var(--lime-bright)' }}>
                            Tap to view ticket
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : readyOrders.length === 0 && (
              <div style={{ textAlign:'center', padding:'4rem', color:'var(--text-muted)' }}>
                <p style={{ fontSize:'1.1rem', marginTop:'0.75rem' }}>No active orders in queue.</p>
                <p style={{ fontSize:'0.88rem', marginTop:'0.5rem' }}>Place an order to see your queue position.</p>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
