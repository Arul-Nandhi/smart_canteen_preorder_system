import { useState, useEffect } from 'react';
import { RefreshCw, Upload, Trash2, Image } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function AdminImagesPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(null); // item id being uploaded
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/menu/');
      setItems(res.data);
    } catch {
      toast.error('Failed to load menu items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleUpload = async (item, file) => {
    if (!file) return;
    setUploading(item.id);
    try {
      const data = new FormData();
      data.append('image', file);
      // preserve existing fields
      data.append('item_name', item.item_name);
      data.append('category', item.category);
      data.append('price', item.price);
      data.append('prep_time_mins', item.prep_time_mins);
      data.append('is_veg', item.is_veg);
      data.append('availability', item.availability);
      await api.put(`/menu/${item.id}/`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success(`Image updated for ${item.item_name}`);
      load();
    } catch {
      toast.error('Failed to upload image');
    } finally {
      setUploading(null);
    }
  };

  const removeImage = async (item) => {
    if (!window.confirm(`Remove image for "${item.item_name}"?`)) return;
    try {
      const data = new FormData();
      data.append('item_name', item.item_name);
      data.append('category', item.category);
      data.append('price', item.price);
      data.append('prep_time_mins', item.prep_time_mins);
      data.append('is_veg', item.is_veg);
      data.append('availability', item.availability);
      data.append('image', '');
      await api.put(`/menu/${item.id}/`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Image removed');
      load();
    } catch {
      toast.error('Failed to remove image');
    }
  };

  const filtered = items.filter(i =>
    !search || i.item_name.toLowerCase().includes(search.toLowerCase())
  );

  const withImage    = items.filter(i => i.image).length;
  const withoutImage = items.length - withImage;

  return (
    <AdminLayout title="Food Images" subtitle="Upload and manage food item photos">
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total Items', value: items.length, color: '#38bdf8' },
          { label: 'Has Image',   value: withImage,    color: '#22c55e' },
          { label: 'No Image',    value: withoutImage,  color: '#fb923c' },
        ].map((s, i) => (
          <div key={i} className="admin-card" style={{ padding: '18px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: s.color, letterSpacing: '-1px' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
        <input
          className="admin-input"
          placeholder="Search items…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: 260 }}
        />
        <button onClick={load} className="admin-btn admin-btn-ghost admin-btn-sm"><RefreshCw size={14} /> Refresh</button>
        <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--text-3)' }}>
          {filtered.length} items shown
        </span>
      </div>

      {/* Image Grid */}
      {loading ? (
        <div className="admin-empty">
          <div style={{ width: 36, height: 36, border: '3px solid var(--teal)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="admin-empty"><div className="admin-empty-icon">🖼️</div><p>No items found</p></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
          {filtered.map(item => (
            <div key={item.id} className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
              {/* Image area */}
              <div style={{ height: 150, background: 'var(--surface-2)', position: 'relative', overflow: 'hidden' }}>
                {item.image ? (
                  <>
                    <img
                      src={item.image}
                      alt={item.item_name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div style={{
                      position: 'absolute', inset: 0, background: 'rgba(0,0,0,0)',
                      transition: 'background 0.2s',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                      className="img-overlay"
                    />
                  </>
                ) : (
                  <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', gap: 8 }}>
                    <Image size={32} style={{ opacity: 0.3 }} />
                    <span style={{ fontSize: '0.72rem' }}>No image</span>
                  </div>
                )}

                {/* Upload indicator overlay */}
                {uploading === item.id && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: 32, height: 32, border: '3px solid var(--teal)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                  </div>
                )}
              </div>

              {/* Info + actions */}
              <div style={{ padding: '14px 16px' }}>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-1)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.item_name}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginBottom: 12 }}>{item.category} · ₹{item.price}</div>

                <div style={{ display: 'flex', gap: 8 }}>
                  {/* Upload button */}
                  <label
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      height: 32, borderRadius: 10, background: 'var(--teal)', color: '#0B0F14',
                      fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer', transition: 'opacity 150ms',
                    }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                  >
                    <Upload size={13} />
                    {item.image ? 'Replace' : 'Upload'}
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={e => handleUpload(item, e.target.files?.[0])}
                    />
                  </label>

                  {/* Remove button (only if image exists) */}
                  {item.image && (
                    <button
                      onClick={() => removeImage(item)}
                      className="admin-btn admin-btn-danger admin-btn-sm"
                      title="Remove image"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
