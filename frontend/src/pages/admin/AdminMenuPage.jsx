import { useState, useEffect } from 'react';
import { RefreshCw, Plus, Search, X } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import PresetImagePicker from '../../components/PresetImagePicker';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { resolveImage } from '../../services/imageResolver';

const CATEGORIES = ['breakfast', 'lunch', 'snacks', 'beverages', 'desserts', 'chinese', 'parotta', 'naan_roti', 'bites'];

const CATEGORY_LABELS = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  snacks: 'Snacks',
  beverages: 'Refreshing Drinks',
  desserts: 'Desserts',
  chinese: 'Chinese',
  parotta: 'Parotta',
  naan_roti: 'Naan & Roti',
  bites: 'Bites'
};

const defaultForm = { item_name: '', category: 'breakfast', price: '', prep_time_mins: 5, description: '', food_type: 'veg', imageFile: null, presetPath: '' };

export default function AdminMenuPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showPresetPicker, setShowPresetPicker] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(defaultForm);

  const load = async () => {
    try {
      const res = await api.get('/menu/');
      setItems(res.data);
    } catch {
      toast.error('Failed to load menu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = items.filter(i => {
    const matchCat = category === 'all' || i.category === category;
    const matchSearch = !search || i.item_name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = new FormData();
      Object.keys(form).forEach(k => {
        if (k !== 'imageFile' && k !== 'presetPath') data.append(k, form[k]);
      });
      if (form.imageFile) {
        data.append('image', form.imageFile);
      } else if (form.presetPath) {
        data.append('image', form.presetPath);
      }
      const opts = { headers: { 'Content-Type': 'multipart/form-data' } };
      if (editing) {
        await api.put(`/menu/${editing.id}/`, data, opts);
        toast.success('Item updated!');
      } else {
        await api.post('/menu/', data, opts);
        toast.success('Item added!');
      }
      setForm(defaultForm); setShowForm(false); setEditing(null); load();
    } catch { toast.error('Failed to save item'); }
  };

  const deleteItem = async (id) => {
    if (!window.confirm('Delete this item?')) return;
    try {
      await api.delete(`/menu/${id}/`);
      setItems(prev => prev.filter(i => i.id !== id));
      toast.success('Item deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const toggleAvail = async (item) => {
    try {
      const res = await api.put(`/menu/${item.id}/`, { ...item, availability: !item.availability });
      setItems(prev => prev.map(i => i.id === item.id ? res.data : i));
      toast.success(res.data.availability ? 'Item enabled' : 'Item disabled');
    } catch { toast.error('Failed to update'); }
  };

  const startEdit = (food) => {
    setEditing(food);
    setForm({
      item_name: food.item_name,
      category: food.category,
      price: food.price,
      prep_time_mins: food.prep_time_mins,
      description: food.description || '',
      food_type: food.food_type || 'veg',
      imageFile: null,
      presetPath: food.image?.startsWith('/assets/') ? food.image : ''
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <AdminLayout title="Menu Management" subtitle="Add, edit, and manage food items">
      
      {/* Preset Image Picker Modal */}
      {showPresetPicker && (
        <PresetImagePicker
          currentCategory={form.category}
          onSelect={(path) => {
            setForm(f => ({ ...f, presetPath: path, imageFile: null }));
            setShowPresetPicker(false);
            toast.success('Preset image selected!');
          }}
          onClose={() => setShowPresetPicker(false)}
        />
      )}

      {/* Top actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        {/* Category tabs */}
        <div className="admin-filter-bar" style={{ marginBottom: 0, flex: 1 }}>
          <button className={`admin-chip ${category === 'all' ? 'active' : ''}`} onClick={() => setCategory('all')}>All ({items.length})</button>
          {CATEGORIES.map(c => (
            <button key={c} className={`admin-chip ${category === c ? 'active' : ''}`} onClick={() => setCategory(c)}>
              {CATEGORY_LABELS[c] || c.replace('_', ' ')} ({items.filter(i => i.category === c).length})
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={load} className="admin-btn admin-btn-ghost admin-btn-sm"><RefreshCw size={14} /></button>
          <button onClick={() => { setShowForm(s => !s); setEditing(null); setForm(defaultForm); }} className="admin-btn admin-btn-primary">
            <Plus size={15} /> Add Item
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="admin-input-wrap" style={{ maxWidth: 320, marginBottom: 20 }}>
        <Search size={15} className="admin-input-icon" />
        <input className="admin-input" placeholder="Search items…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Add / Edit Form */}
      {showForm && (
        <div className="admin-form-panel">
          <div className="admin-form-panel-header">
            <span className="admin-form-panel-title">{editing ? '✏️ Edit Item' : '➕ New Food Item'}</span>
            <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => { setShowForm(false); setEditing(null); }}>
              <X size={14} /> Cancel
            </button>
          </div>
          <div className="admin-form-body">
            <form onSubmit={handleSubmit}>
              <div className="admin-form-grid">
                <div className="admin-form-field">
                  <label className="admin-form-label">Item Name *</label>
                  <input className="admin-input" placeholder="e.g. Masala Dosa" value={form.item_name} onChange={e => setForm({ ...form, item_name: e.target.value })} required />
                </div>
                <div className="admin-form-field">
                  <label className="admin-form-label">Category</label>
                  <select className="admin-select" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c] || c.replace('_', ' ')}</option>)}
                  </select>
                </div>
                <div className="admin-form-field">
                  <label className="admin-form-label">Price (₹) *</label>
                  <input className="admin-input" type="number" placeholder="0" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} required />
                </div>
                <div className="admin-form-field">
                  <label className="admin-form-label">Prep Time (mins)</label>
                  <input className="admin-input" type="number" value={form.prep_time_mins} onChange={e => setForm({ ...form, prep_time_mins: +e.target.value })} />
                </div>
                <div className="admin-form-field">
                  <label className="admin-form-label">Food Type</label>
                  <select className="admin-select" value={form.food_type} onChange={e => setForm({ ...form, food_type: e.target.value })}>
                    <option value="veg">🌿 Veg (Vegetarian)</option>
                    <option value="egg">🥚 Egg (Contains Egg)</option>
                    <option value="non_veg">🍖 Non-Veg (Non-Vegetarian)</option>
                  </select>
                </div>
                <div className="admin-form-field">
                  <label className="admin-form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Image</span>
                    <button
                      type="button"
                      onClick={() => setShowPresetPicker(true)}
                      style={{ background: 'none', border: 'none', color: 'var(--teal)', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 800, padding: 0 }}
                    >
                      ✨ Select Preset
                    </button>
                  </label>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <input className="admin-input" type="file" accept="image/*" onChange={e => setForm({ ...form, imageFile: e.target.files?.[0] || null, presetPath: '' })} style={{ paddingTop: 8, flex: 1 }} />
                    {form.presetPath && (
                      <span style={{ fontSize: '0.72rem', color: 'var(--teal)', fontWeight: 800, whiteSpace: 'nowrap' }}>✓ Preset Selected</span>
                    )}
                  </div>
                </div>
                <div className="admin-form-field" style={{ gridColumn: '1 / -1' }}>
                  <label className="admin-form-label">Description</label>
                  <textarea className="admin-input" style={{ height: 72, resize: 'vertical', paddingTop: 10 }} placeholder="Optional description…" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                </div>
              </div>
              <div className="admin-form-actions">
                <button type="submit" className="admin-btn admin-btn-primary">{editing ? 'Update Item' : 'Add Item'}</button>
                <button type="button" className="admin-btn admin-btn-secondary" onClick={() => { setShowForm(false); setEditing(null); }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Items Grid */}
      {loading ? (
        <div className="admin-empty"><div style={{ width: 36, height: 36, border: '3px solid var(--teal)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto' }} /></div>
      ) : filtered.length === 0 ? (
        <div className="admin-empty"><div className="admin-empty-icon">🍽️</div><p>No items found</p></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {filtered.map(item => (
            <div key={item.id} className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ height: 140, overflow: 'hidden', background: 'var(--surface-2)', position: 'relative' }}>
                <img
                  src={resolveImage(item)}
                  alt={item.item_name}
                  onError={e => { e.target.onerror = null; e.target.src = '/assets/food/lunch/veg_meals.jpg'; }}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }}
                  onMouseEnter={e => e.target.style.transform='scale(1.06)'}
                  onMouseLeave={e => e.target.style.transform='scale(1)'}
                />
              </div>
              <div style={{ padding: '14px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-1)' }}>{item.item_name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginTop: 2 }}>
                      {CATEGORY_LABELS[item.category] || item.category.replace('_', ' ')} · {item.prep_time_mins}min
                    </div>
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--teal)' }}>₹{item.price}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                  <span className={`admin-badge ${item.food_type === 'veg' ? 'admin-badge-green' : item.food_type === 'egg' ? 'admin-badge-yellow' : 'admin-badge-red'}`}>
                    {item.food_type === 'veg' ? '🌿 Veg' : item.food_type === 'egg' ? '🥚 Egg' : '🍖 Non-Veg'}
                  </span>
                  <span className={`admin-badge ${item.availability ? 'admin-badge-teal' : 'admin-badge-yellow'}`}>{item.availability ? 'Available' : 'Unavailable'}</span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => startEdit(item)} className="admin-btn admin-btn-secondary admin-btn-sm" style={{ flex: 1 }}>Edit</button>
                  <button onClick={() => toggleAvail(item)} className="admin-btn admin-btn-ghost admin-btn-sm" style={{ flex: 1 }}>{item.availability ? 'Disable' : 'Enable'}</button>
                  <button onClick={() => deleteItem(item.id)} className="admin-btn admin-btn-danger admin-btn-sm">✕</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}

