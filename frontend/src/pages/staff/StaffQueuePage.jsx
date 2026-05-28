import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import OrderCard from '../../components/OrderCard';
import api from '../../services/api';

const FLOW = ['pending','preparing','ready','completed'];

export default function StaffQueuePage() {
  const [orders, setOrders] = useState([]);
  useEffect(() => { api.get('/orders/all/').then(r=>setOrders(r.data)).catch(()=>setOrders([])); }, []);

  return <DashboardLayout><div className="dash-page"><h2 className="dash-section-title">Preparation Queue</h2><div className="dash-workflow mt-8">{FLOW.map((s)=> <div className="dash-workflow-col" key={s}><div className="dash-workflow-col-header"><span>{s.toUpperCase()}</span><span className="dash-badge blue">{orders.filter(o=>o.order_status===s).length}</span></div><div className="dash-workflow-col-body">{orders.filter(o=>o.order_status===s).map(o=><OrderCard key={o.id} order={o} showActions={false} />)}</div></div>)}</div></div></DashboardLayout>;
}
