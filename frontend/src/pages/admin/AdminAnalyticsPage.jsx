import { useEffect, useState, useCallback, useMemo } from 'react';
import { RefreshCw, TrendingUp, ShoppingBag, DollarSign, Users, Calendar, Award, Clock, ChevronLeft, ChevronRight, BarChart2 } from 'lucide-react';
import {
  BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend, AreaChart, Area,
} from 'recharts';
import AdminLayout from '../../components/AdminLayout';
import api from '../../services/api';
import toast from 'react-hot-toast';

const COLORS = ['#14D1B2', '#60A5FA', '#FB923C', '#C084FC', '#F87171', '#34D399', '#FBBF24'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', fontSize: '0.8rem' }}>
      <p style={{ color: 'var(--text-3)', marginBottom: 4 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, fontWeight: 700 }}>{p.name}: {typeof p.value === 'number' && p.name?.includes('₹') ? `₹${p.value.toFixed(2)}` : p.value}</p>
      ))}
    </div>
  );
};

function fmt(date) {
  return date.toISOString().split('T')[0];
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  // Date range for revenue history (default: last 14 days)
  const [rangeEnd, setRangeEnd] = useState(() => fmt(new Date()));
  const [rangeDays, setRangeDays] = useState(14);
  // Drill-down date
  const [selectedDate, setSelectedDate] = useState(() => fmt(new Date()));
  const [view, setView] = useState('overview'); // 'overview' | 'daily'

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [aRes, oRes] = await Promise.all([
        api.get('/analytics/'),
        api.get('/orders/all/').catch(() => api.get('/orders/')),
      ]);
      setAnalytics(aRes.data);
      setOrders(Array.isArray(oRes.data) ? oRes.data : []);
    } catch {
      toast.error('Failed to load analytics');
      setAnalytics({ daily_orders: [], top_items: [], summary: {} });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const summary = analytics?.summary || {};
  const popular = (analytics?.top_items || []).map(i => ({ name: i.item__item_name || 'Item', value: i.total_qty || 0 }));

  // ── Revenue history: build per-day buckets ──────────────────────────────
  const revenueHistory = useMemo(() => {
    const endDate = new Date(rangeEnd);
    const days = [];
    for (let i = rangeDays - 1; i >= 0; i--) {
      const d = addDays(endDate, -i);
      const dStr = fmt(d);
      const dayOrders = orders.filter(o => o.created_at?.startsWith(dStr) && o.order_status !== 'cancelled');
      const completed = dayOrders.filter(o => o.order_status === 'completed');
      const cashRevenue = completed.filter(o => o.payment?.payment_method === 'cash' && o.payment?.payment_status === 'success')
        .reduce((s, o) => s + parseFloat(o.total_amount || 0), 0);
      const onlineRevenue = completed.filter(o => o.payment?.payment_method !== 'cash' && o.payment?.payment_status === 'success')
        .reduce((s, o) => s + parseFloat(o.total_amount || 0), 0);
      const totalRevenue = cashRevenue + onlineRevenue;
      days.push({
        date: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
        fullDate: dStr,
        '₹ Total': parseFloat(totalRevenue.toFixed(2)),
        '₹ Cash': parseFloat(cashRevenue.toFixed(2)),
        '₹ Online/UPI': parseFloat(onlineRevenue.toFixed(2)),
        orders: dayOrders.length,
        completed: completed.length,
      });
    }
    return days;
  }, [orders, rangeEnd, rangeDays]);

  // ── Drill-down for selected date ─────────────────────────────────────────
  const drillDown = useMemo(() => {
    const dayOrders = orders.filter(o => o.created_at?.startsWith(selectedDate));
    const completed = dayOrders.filter(o => o.order_status === 'completed');
    const cancelled = dayOrders.filter(o => o.order_status === 'cancelled');
    const cashRevenue = completed.filter(o => o.payment?.payment_method === 'cash' && o.payment?.payment_status === 'success')
      .reduce((s, o) => s + parseFloat(o.total_amount || 0), 0);
    const onlineRevenue = completed.filter(o => o.payment?.payment_method !== 'cash' && o.payment?.payment_status === 'success')
      .reduce((s, o) => s + parseFloat(o.total_amount || 0), 0);
    const preorders = dayOrders.filter(o => o.order_type === 'preorder').length;
    const instant = dayOrders.filter(o => o.order_type === 'instant').length;
    // Top items that day
    const itemMap = {};
    dayOrders.forEach(o => o.items?.forEach(it => {
      const name = it.item_detail?.item_name || 'Item';
      itemMap[name] = (itemMap[name] || 0) + it.quantity;
    }));
    const topItems = Object.entries(itemMap).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, value]) => ({ name, value }));
    return { dayOrders, completed, cancelled, cashRevenue, onlineRevenue, preorders, instant, topItems };
  }, [orders, selectedDate]);

  // ── Totals ───────────────────────────────────────────────────────────────
  const now = new Date();
  const todayStr = fmt(now);
  const weekAgo = fmt(addDays(now, -7));
  const monthAgo = fmt(addDays(now, -30));

  const revenueToday = orders
    .filter(o => o.created_at?.startsWith(todayStr) && o.order_status === 'completed' && o.payment?.payment_status === 'success')
    .reduce((s, o) => s + parseFloat(o.total_amount || 0), 0);
  const revenueWeek = orders
    .filter(o => o.created_at?.slice(0, 10) >= weekAgo && o.order_status === 'completed' && o.payment?.payment_status === 'success')
    .reduce((s, o) => s + parseFloat(o.total_amount || 0), 0);
  const revenueMonth = orders
    .filter(o => o.created_at?.slice(0, 10) >= monthAgo && o.order_status === 'completed' && o.payment?.payment_status === 'success')
    .reduce((s, o) => s + parseFloat(o.total_amount || 0), 0);

  const preorderCount = orders.filter(o => o.order_type === 'preorder').length;
  const instantCount = orders.filter(o => o.order_type === 'instant').length;
  const orderTypePie = [
    { name: 'Preorder', value: preorderCount },
    { name: 'Instant', value: instantCount },
  ].filter(d => d.value > 0);

  const chartStyle = {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 16,
    padding: 22,
  };

  return (
    <AdminLayout title="Analytics" subtitle="Revenue, sales performance, and daily history">

      {/* ── Top Actions ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        {/* View Switcher */}
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { id: 'overview', label: '📊 Overview' },
            { id: 'daily', label: '📅 Daily History' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setView(tab.id)}
              style={{
                padding: '7px 16px', borderRadius: 8, fontSize: '0.82rem', fontWeight: 700,
                cursor: 'pointer', border: 'none',
                background: view === tab.id ? 'var(--teal-soft)' : 'var(--surface-2)',
                color: view === tab.id ? 'var(--teal)' : 'var(--text-2)',
                borderLeft: view === tab.id ? '3px solid var(--teal)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <button onClick={load} className="admin-btn admin-btn-ghost admin-btn-sm" style={{ gap: 6 }}>
          <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
        </button>
      </div>

      {/* ── Revenue KPI Row (always visible) ── */}
      <div className="analytics-revenue-grid" style={{ marginBottom: 20 }}>
        {[
          { icon: DollarSign, label: 'Revenue today', value: `₹${revenueToday.toFixed(0)}`, color: '#14D1B2', sub: 'Completed & paid orders' },
          { icon: Calendar, label: 'Revenue this week', value: `₹${revenueWeek.toFixed(0)}`, color: '#60A5FA', sub: 'Last 7 days' },
          { icon: TrendingUp, label: 'Revenue this month', value: `₹${revenueMonth.toFixed(0)}`, color: '#AEEA00', sub: 'Last 30 days' },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="analytics-chart-card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 46, height: 46, borderRadius: 14, background: `${s.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, flexShrink: 0 }}>
                <Icon size={22} />
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{s.label}</div>
                <div style={{ fontSize: '1.7rem', fontWeight: 800, color: s.color, letterSpacing: '-1px', lineHeight: 1.1, marginTop: 3 }}>{s.value}</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-3)', marginTop: 3 }}>{s.sub}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ══════════════════════════════════════════════════════ */}
      {/* ─── OVERVIEW TAB ─────────────────────────────────── */}
      {/* ══════════════════════════════════════════════════════ */}
      {view === 'overview' && (
        <>
          {/* Secondary KPI */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14, marginBottom: 24 }}>
            {[
              { icon: ShoppingBag, label: 'Total orders', value: orders.length, color: '#14D1B2' },
              { icon: TrendingUp, label: 'Completed', value: orders.filter(o => o.order_status === 'completed').length, color: '#22c55e' },
              { icon: Users, label: 'Active students', value: summary.active_students || 0, color: '#C084FC' },
              { icon: Clock, label: 'Avg wait (min)', value: Math.round(summary.avg_wait || 0), color: '#fb923c' },
            ].map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} className="admin-card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px' }}>
                  <div style={{ width: 38, height: 38, borderRadius: 11, background: `${s.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, flexShrink: 0 }}>
                    <Icon size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{s.label}</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: s.color, letterSpacing: '-0.5px' }}>{s.value}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Revenue History mini chart */}
          <div style={chartStyle} className="mb-5" style={{ ...chartStyle, marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, flexWrap: 'wrap', gap: 8 }}>
              <div>
                <div className="analytics-chart-title">Revenue history</div>
                <div className="analytics-chart-sub">Daily collected revenue (cash + online/UPI)</div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {[7, 14, 30].map(d => (
                  <button key={d} onClick={() => setRangeDays(d)} style={{
                    padding: '4px 10px', borderRadius: 6, fontSize: '0.72rem', fontWeight: 700,
                    border: 'none', cursor: 'pointer',
                    background: rangeDays === d ? 'var(--teal)' : 'var(--surface-3)',
                    color: rangeDays === d ? '#0B0F14' : 'var(--text-2)',
                  }}>{d}d</button>
                ))}
              </div>
            </div>
            {revenueHistory.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={revenueHistory} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
                  <defs>
                    <linearGradient id="cashGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#14D1B2" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#14D1B2" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="upiGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#60A5FA" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#60A5FA" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: 'var(--text-3)', fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: 'var(--text-3)', fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="₹ Cash" stroke="#14D1B2" strokeWidth={2} fill="url(#cashGrad)" dot={false} />
                  <Area type="monotone" dataKey="₹ Online/UPI" stroke="#60A5FA" strokeWidth={2} fill="url(#upiGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="admin-empty" style={{ padding: '40px 20px' }}><p>No revenue data available yet</p></div>
            )}
          </div>

          {/* Charts Row: Top Items + Order Type */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 20 }}>
            {/* Most Sold Items */}
            <div style={chartStyle}>
              <div className="analytics-chart-title"><Award size={15} style={{ color: 'var(--teal)', verticalAlign: 'middle', marginRight: 6 }} />Top selling items</div>
              <div className="analytics-chart-sub">Ranked by total quantity sold (all time)</div>
              {popular.length > 0 ? (
                <div style={{ marginTop: 8 }}>
                  {popular.slice(0, 6).map((item, i) => (
                    <div key={i} className="top-item-row">
                      <div className={`top-item-rank ${i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : ''}`}>{i + 1}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.83rem', fontWeight: 700, color: 'var(--text-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
                        <div style={{ height: 4, background: 'var(--surface-3)', borderRadius: 99, marginTop: 5, overflow: 'hidden' }}>
                          <div style={{ width: `${(item.value / (popular[0]?.value || 1)) * 100}%`, height: '100%', background: COLORS[i % COLORS.length], borderRadius: 99 }} />
                        </div>
                      </div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 800, color: COLORS[i % COLORS.length], flexShrink: 0 }}>{item.value}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="admin-empty" style={{ padding: '40px 20px' }}><p>No item sales data</p></div>
              )}
            </div>

            {/* Order Type Split */}
            <div style={chartStyle}>
              <div className="analytics-chart-title">Order type split</div>
              <div className="analytics-chart-sub">Preorder vs instant pickup ratio</div>
              {orderTypePie.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={orderTypePie} dataKey="value" nameKey="name" outerRadius={75} innerRadius={38} paddingAngle={4}>
                      {orderTypePie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '0.75rem', color: 'var(--text-2)' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="admin-empty" style={{ padding: '40px 20px' }}><p>No order type data</p></div>
              )}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 8 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#14D1B2' }}>{preorderCount}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-3)', fontWeight: 600 }}>Preorders</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#60A5FA' }}>{instantCount}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-3)', fontWeight: 600 }}>Instant</div>
                </div>
              </div>
            </div>

            {/* Queue Activity Summary */}
            <div style={chartStyle}>
              <div className="analytics-chart-title">Queue activity summary</div>
              <div className="analytics-chart-sub">Order processing performance stats</div>
              {[
                { label: 'Avg wait time', value: `${Math.round(summary.avg_wait || 0)} min`, color: '#fb923c' },
                { label: 'Completion rate', value: orders.length > 0 ? `${Math.round((orders.filter(o => o.order_status === 'completed').length / orders.length) * 100)}%` : '0%', color: '#22c55e' },
                { label: 'Cancellation rate', value: orders.length > 0 ? `${Math.round((orders.filter(o => o.order_status === 'cancelled').length / orders.length) * 100)}%` : '0%', color: '#ef4444' },
                { label: 'Pending now', value: orders.filter(o => o.order_status === 'pending').length, color: '#38bdf8' },
              ].map((row, i, arr) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-2)' }}>{row.label}</span>
                  <span style={{ fontSize: '1rem', fontWeight: 800, color: row.color }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* ─── DAILY HISTORY TAB ────────────────────────────── */}
      {/* ══════════════════════════════════════════════════════ */}
      {view === 'daily' && (
        <>
          {/* Range selector */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 6 }}>
              {[7, 14, 30].map(d => (
                <button key={d} onClick={() => setRangeDays(d)} style={{
                  padding: '6px 14px', borderRadius: 8, fontSize: '0.78rem', fontWeight: 700,
                  border: 'none', cursor: 'pointer',
                  background: rangeDays === d ? 'var(--teal)' : 'var(--surface-2)',
                  color: rangeDays === d ? '#0B0F14' : 'var(--text-2)',
                  transition: 'all 0.15s',
                }}>Last {d} days</button>
              ))}
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-3)', fontWeight: 600 }}>End date:</span>
              <input
                type="date"
                value={rangeEnd}
                onChange={e => setRangeEnd(e.target.value)}
                className="admin-input"
                style={{ height: 34, fontSize: '0.8rem', padding: '0 10px', width: 150 }}
              />
            </div>
          </div>

          {/* Revenue History Bar Chart */}
          <div style={{ ...chartStyle, marginBottom: 20 }}>
            <div className="analytics-chart-title">Daily revenue breakdown</div>
            <div className="analytics-chart-sub">Cash vs online/UPI collections per day — click a bar to drill down</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={revenueHistory} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}
                onClick={e => { if (e?.activePayload?.[0]) { setSelectedDate(e.activePayload[0].payload.fullDate); } }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: 'var(--text-3)', fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: 'var(--text-3)', fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '0.73rem', color: 'var(--text-2)', marginTop: 8 }} />
                <Bar dataKey="₹ Cash" stackId="a" fill="#14D1B2" radius={[0, 0, 0, 0]} />
                <Bar dataKey="₹ Online/UPI" stackId="a" fill="#60A5FA" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Orders count history */}
          <div style={{ ...chartStyle, marginBottom: 20 }}>
            <div className="analytics-chart-title">Daily order volume</div>
            <div className="analytics-chart-sub">Number of orders placed vs completed each day</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={revenueHistory} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: 'var(--text-3)', fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: 'var(--text-3)', fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '0.73rem', color: 'var(--text-2)' }} />
                <Bar dataKey="orders" fill="#FB923C" radius={[5, 5, 0, 0]} name="Orders placed" />
                <Bar dataKey="completed" fill="#22c55e" radius={[5, 5, 0, 0]} name="Completed" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Daily Table */}
          <div style={{ ...chartStyle, marginBottom: 20 }}>
            <div className="analytics-chart-title">Day-by-day revenue table</div>
            <div className="analytics-chart-sub">Click a row to view that day's detailed breakdown</div>
            <div style={{ marginTop: 12, overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Date', 'Orders', 'Completed', 'Cash revenue', 'Online/UPI revenue', 'Total revenue'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: h === 'Date' ? 'left' : 'right', color: 'var(--text-3)', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.3px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...revenueHistory].reverse().map((row, i) => {
                    const isSelected = row.fullDate === selectedDate;
                    const isToday = row.fullDate === todayStr;
                    return (
                      <tr
                        key={i}
                        onClick={() => setSelectedDate(row.fullDate)}
                        style={{
                          borderBottom: '1px solid var(--border)',
                          cursor: 'pointer',
                          background: isSelected ? 'rgba(20,209,178,0.06)' : 'transparent',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = isSelected ? 'rgba(20,209,178,0.1)' : 'var(--surface-2)'}
                        onMouseLeave={e => e.currentTarget.style.background = isSelected ? 'rgba(20,209,178,0.06)' : 'transparent'}
                      >
                        <td style={{ padding: '10px 12px', fontWeight: 700, color: isSelected ? 'var(--teal)' : 'var(--text-1)' }}>
                          {row.date} {isToday && <span style={{ fontSize: '0.65rem', background: 'rgba(20,209,178,0.15)', color: 'var(--teal)', padding: '1px 5px', borderRadius: 4, marginLeft: 4 }}>Today</span>}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--text-2)' }}>{row.orders}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', color: '#22c55e', fontWeight: 700 }}>{row.completed}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', color: '#14D1B2', fontWeight: 700 }}>₹{row['₹ Cash'].toFixed(2)}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', color: '#60A5FA', fontWeight: 700 }}>₹{row['₹ Online/UPI'].toFixed(2)}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', color: '#AEEA00', fontWeight: 800 }}>₹{row['₹ Total'].toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: '2px solid var(--border)', background: 'var(--surface-2)' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 800, color: 'var(--text-1)', fontSize: '0.8rem' }}>Total ({rangeDays}d)</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 800, color: 'var(--text-1)' }}>{revenueHistory.reduce((s, r) => s + r.orders, 0)}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 800, color: '#22c55e' }}>{revenueHistory.reduce((s, r) => s + r.completed, 0)}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 800, color: '#14D1B2' }}>₹{revenueHistory.reduce((s, r) => s + r['₹ Cash'], 0).toFixed(2)}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 800, color: '#60A5FA' }}>₹{revenueHistory.reduce((s, r) => s + r['₹ Online/UPI'], 0).toFixed(2)}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 800, color: '#AEEA00' }}>₹{revenueHistory.reduce((s, r) => s + r['₹ Total'], 0).toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Drill-down for selected date */}
          <div style={{ ...chartStyle, borderLeft: '3px solid var(--teal)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div className="analytics-chart-title">
                  📅 Detailed breakdown —{' '}
                  <span style={{ color: 'var(--teal)' }}>
                    {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                </div>
                <div className="analytics-chart-sub">Click any row in the table above to change the date</div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => setSelectedDate(fmt(addDays(new Date(selectedDate), -1)))} style={{ padding: '5px 10px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text-2)', cursor: 'pointer', fontSize: '0.8rem' }}>
                  <ChevronLeft size={14} />
                </button>
                <button onClick={() => setSelectedDate(fmt(new Date()))} style={{ padding: '5px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--teal)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}>Today</button>
                <button onClick={() => setSelectedDate(fmt(addDays(new Date(selectedDate), 1)))} disabled={selectedDate >= todayStr} style={{ padding: '5px 10px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--surface-2)', color: selectedDate >= todayStr ? 'var(--text-3)' : 'var(--text-2)', cursor: selectedDate >= todayStr ? 'not-allowed' : 'pointer', fontSize: '0.8rem' }}>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>

            {/* KPI mini row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginBottom: 20 }}>
              {[
                { label: 'Total orders', value: drillDown.dayOrders.length, color: '#14D1B2' },
                { label: 'Completed', value: drillDown.completed.length, color: '#22c55e' },
                { label: 'Cancelled', value: drillDown.cancelled.length, color: '#ef4444' },
                { label: 'Cash revenue', value: `₹${drillDown.cashRevenue.toFixed(0)}`, color: '#14D1B2' },
                { label: 'Online/UPI revenue', value: `₹${drillDown.onlineRevenue.toFixed(0)}`, color: '#60A5FA' },
                { label: 'Total revenue', value: `₹${(drillDown.cashRevenue + drillDown.onlineRevenue).toFixed(0)}`, color: '#AEEA00' },
                { label: 'Preorders', value: drillDown.preorders, color: '#C084FC' },
                { label: 'Instant orders', value: drillDown.instant, color: '#FB923C' },
              ].map((s, i) => (
                <div key={i} style={{ background: 'var(--surface-2)', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Top items that day */}
            {drillDown.topItems.length > 0 && (
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 10 }}>Top items ordered</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {drillDown.topItems.map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 22, height: 22, borderRadius: 6, background: `${COLORS[i % COLORS.length]}20`, color: COLORS[i % COLORS.length], fontSize: '0.72rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-1)' }}>{item.name}</div>
                        <div style={{ height: 4, background: 'var(--surface-3)', borderRadius: 99, marginTop: 4 }}>
                          <div style={{ width: `${(item.value / (drillDown.topItems[0]?.value || 1)) * 100}%`, height: '100%', background: COLORS[i % COLORS.length], borderRadius: 99 }} />
                        </div>
                      </div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 800, color: COLORS[i % COLORS.length], flexShrink: 0 }}>×{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {drillDown.dayOrders.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-3)' }}>
                <p style={{ fontSize: '1.5rem', marginBottom: 8 }}>📭</p>
                <p style={{ fontSize: '0.85rem' }}>No orders recorded on this date</p>
              </div>
            )}
          </div>
        </>
      )}
    </AdminLayout>
  );
}
