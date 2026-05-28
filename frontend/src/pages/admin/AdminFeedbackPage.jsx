import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Star, MessageSquare, CheckCircle, Clock, AlertCircle, Save } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function AdminFeedbackPage() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, open, in_review, resolved
  const [activeFeedback, setActiveFeedback] = useState(null);
  const [responseNotes, setResponseNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/feedback/');
      setFeedbacks(res.data);
    } catch {
      toast.error('Failed to load feedback data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const updateStatus = async (id, status, notes = '') => {
    setSaving(true);
    try {
      const res = await api.patch(`/feedback/${id}/`, { status, response_notes: notes });
      setFeedbacks(prev => prev.map(f => f.id === id ? res.data : f));
      if (activeFeedback?.id === id) {
        setActiveFeedback(res.data);
      }
      toast.success(`Feedback marked as ${status}`);
    } catch {
      toast.error('Failed to update feedback status');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveResponse = async (e) => {
    e.preventDefault();
    if (!activeFeedback) return;
    updateStatus(activeFeedback.id, activeFeedback.status, responseNotes);
  };

  // Stats
  const totalCount = feedbacks.length;
  const avgRating = totalCount > 0
    ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / totalCount).toFixed(1)
    : '0.0';
  const openCount = feedbacks.filter(f => f.status === 'open').length;
  const inReviewCount = feedbacks.filter(f => f.status === 'in_review').length;
  const resolvedCount = feedbacks.filter(f => f.status === 'resolved').length;

  const filteredFeedbacks = feedbacks.filter(f => {
    if (filter === 'all') return true;
    return f.status === filter;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'open':
        return <span className="feedback-badge open"><AlertCircle size={12} /> Open</span>;
      case 'in_review':
        return <span className="feedback-badge review"><Clock size={12} /> In Review</span>;
      case 'resolved':
        return <span className="feedback-badge resolved"><CheckCircle size={12} /> Resolved</span>;
      default:
        return null;
    }
  };

  return (
    <AdminLayout title="Customer Feedback" subtitle="Monitor ratings, suggestions, and customer complaints">
      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Feedback Received', value: totalCount, color: '#38bdf8', icon: MessageSquare },
          { label: 'Average Rating', value: `${avgRating} ★`, color: '#f59e0b', icon: Star },
          { label: 'Open Complaints', value: openCount, color: '#ef4444', icon: AlertCircle },
          { label: 'Resolved Cases', value: resolvedCount, color: '#22c55e', icon: CheckCircle },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="admin-card" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: `${stat.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: stat.color }}>
                <Icon size={20} />
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{stat.label}</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-1)', marginTop: 2 }}>{stat.value}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Layout Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
        
        {/* Left Side: Feedback List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="admin-card" style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
              <div className="admin-section-title">Feedback & Complaints</div>
              <button onClick={load} className="admin-btn admin-btn-ghost admin-btn-sm" style={{ padding: 6 }}>
                <RefreshCw size={14} className={loading ? 'spin' : ''} />
              </button>
            </div>

            {/* Filter buttons */}
            <div className="feedback-filters" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
              {[
                { key: 'all', label: `All (${totalCount})` },
                { key: 'open', label: `Open (${openCount})` },
                { key: 'in_review', label: `In Review (${inReviewCount})` },
                { key: 'resolved', label: `Resolved (${resolvedCount})` },
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`admin-btn admin-btn-sm ${filter === f.key ? 'admin-btn-primary' : 'admin-btn-ghost'}`}
                  style={{ fontSize: '0.75rem', height: 32, padding: '0 12px' }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Feedback Scrollable List */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{ width: 28, height: 28, border: '3px solid var(--teal)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 12px' }} />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>Loading feedback…</span>
              </div>
            ) : filteredFeedbacks.length === 0 ? (
              <div className="admin-empty" style={{ padding: '40px 20px' }}>
                <div style={{ fontSize: '2rem', marginBottom: 8 }}>💬</div>
                <p style={{ fontSize: '0.83rem', color: 'var(--text-3)' }}>No feedback items match this filter.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 500, overflowY: 'auto', paddingRight: 4 }}>
                {filteredFeedbacks.map(f => (
                  <div
                    key={f.id}
                    onClick={() => {
                      setActiveFeedback(f);
                      setResponseNotes(f.response_notes || '');
                    }}
                    className={`feedback-card-item ${activeFeedback?.id === f.id ? 'active' : ''}`}
                    style={{
                      padding: 14,
                      background: 'var(--surface-2)',
                      border: '1.5px solid var(--border)',
                      borderRadius: 12,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-1)' }}>{f.user_name || 'Anonymous'}</span>
                      {getStatusBadge(f.status)}
                    </div>
                    
                    {/* Star Rating display */}
                    <div style={{ display: 'flex', gap: 2, marginBottom: 8 }}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star
                          key={star}
                          size={12}
                          fill={star <= f.rating ? '#f59e0b' : 'none'}
                          color={star <= f.rating ? '#f59e0b' : 'var(--text-3)'}
                        />
                      ))}
                    </div>

                    <p style={{ fontSize: '0.8rem', color: 'var(--text-2)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {f.message}
                    </p>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-3)', marginTop: 8, display: 'flex', justifyContent: 'space-between' }}>
                      <span>Submitted on: {new Date(f.created_at).toLocaleDateString()}</span>
                      {f.response_notes && <span style={{ color: 'var(--teal)' }}>✓ Responded</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Detailed View + Response Action Panel */}
        <div>
          {activeFeedback ? (
            <div className="admin-card" style={{ padding: '20px 24px', position: 'sticky', top: 88 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-1)' }}>Feedback Detail</h3>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginTop: 4 }}>
                    From: <span style={{ fontWeight: 700, color: 'var(--text-2)' }}>{activeFeedback.user_name || 'Anonymous'}</span>
                  </div>
                </div>
                {getStatusBadge(activeFeedback.status)}
              </div>

              {/* Message Details */}
              <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, marginBottom: 20 }}>
                <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star
                      key={star}
                      size={14}
                      fill={star <= activeFeedback.rating ? '#f59e0b' : 'none'}
                      color={star <= activeFeedback.rating ? '#f59e0b' : 'var(--text-3)'}
                    />
                  ))}
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-2)', marginLeft: 6 }}>{activeFeedback.rating} / 5</span>
                </div>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-1)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                  {activeFeedback.message}
                </p>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-3)', marginTop: 12 }}>
                  Submitted on {new Date(activeFeedback.created_at).toLocaleString()}
                </div>
              </div>

              {/* Action Response Form */}
              <form onSubmit={handleSaveResponse}>
                <div style={{ marginBottom: 16 }}>
                  <label className="admin-form-label" style={{ marginBottom: 8 }}>Action Status</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {['open', 'in_review', 'resolved'].map(st => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => updateStatus(activeFeedback.id, st, responseNotes)}
                        disabled={saving}
                        className={`admin-btn admin-btn-sm ${activeFeedback.status === st ? 'admin-btn-primary' : 'admin-btn-ghost'}`}
                        style={{ flex: 1, textTransform: 'capitalize', fontSize: '0.78rem' }}
                      >
                        {st.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label className="admin-form-label" style={{ marginBottom: 8 }}>Internal Notes / Response</label>
                  <textarea
                    value={responseNotes}
                    onChange={e => setResponseNotes(e.target.value)}
                    placeholder="Enter action notes, staff responses, or resolution details here…"
                    className="admin-input"
                    style={{ height: 110, resize: 'vertical', paddingTop: 12, paddingBottom: 12, fontSize: '0.85rem' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    type="submit"
                    disabled={saving}
                    className="admin-btn admin-btn-primary"
                    style={{ flex: 1, gap: 6 }}
                  >
                    <Save size={16} /> {saving ? 'Saving…' : 'Save Notes'}
                  </button>
                  {activeFeedback.status !== 'resolved' && (
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => updateStatus(activeFeedback.id, 'resolved', responseNotes)}
                      className="admin-btn admin-btn-ghost"
                      style={{ border: '1px solid #22c55e', color: '#22c55e', background: 'rgba(34,197,94,0.06)' }}
                    >
                      Resolve Case
                    </button>
                  )}
                </div>
              </form>
            </div>
          ) : (
            <div className="admin-card" style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--text-3)', borderStyle: 'dashed' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🔍</div>
              <h4 style={{ color: 'var(--text-2)', fontWeight: 700, marginBottom: 4 }}>No Feedback Selected</h4>
              <p style={{ fontSize: '0.78rem' }}>Select any feedback from the left column to view full details and perform actions.</p>
            </div>
          )}
        </div>

      </div>
    </AdminLayout>
  );
}
