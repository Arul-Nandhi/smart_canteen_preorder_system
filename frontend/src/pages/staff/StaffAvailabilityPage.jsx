import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import api from '../../services/api';

export default function StaffAvailabilityPage() {
  const [items, setItems] = useState([]);
  useEffect(() => { api.get('/menu/').then(r=>setItems(r.data)).catch(()=>setItems([])); }, []);
  const toggle = (item) => api.put(`/menu/${item.id}/`, { ...item, availability: !item.availability }).then(()=>setItems(prev=>prev.map(p=>p.id===item.id?{...p,availability:!p.availability}:p)));
  return <DashboardLayout><div className="dash-page"><h2 className="dash-section-title">Food Availability</h2><div className="dash-food-grid mt-8">{items.map(item=><div className="dash-card" key={item.id}><p className="text-text-1 font-semibold mb-2">{item.item_name}</p><p className="text-text-3 mb-2">Stock: {item.stock_count ?? 'N/A'}</p><p className={`dash-badge ${item.availability?'green':'red'} mb-3`}>{item.availability?'Available':'Unavailable'}</p><button onClick={()=>toggle(item)} className="dash-btn dash-btn-ghost w-full">{item.availability?'Mark Unavailable':'Mark Available'}</button></div>)}</div></div></DashboardLayout>;
}
