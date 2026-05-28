import { useState, useEffect } from 'react';
import { RefreshCw, Plus, Search, X, Utensils } from 'lucide-react';
import StaffLayout from '../../components/StaffLayout';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { resolveImage } from '../../services/imageResolver';


const CATEGORIES = ['breakfast', 'lunch', 'snacks', 'beverages', 'desserts', 'chinese', 'parotta', 'naan_roti', 'bites'];

const defaultForm = { item_name: '', category: 'breakfast', price: '', prep_time_mins: 5, description: '', food_type: 'veg', imageFile: null };

export default function StaffMenuPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(defaultForm);

  const load = async () => {
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

  const filtered = items.filter(i => {
    const matchCat = category === 'all' || i.category === category;
    const matchSearch = !search || i.item_name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = new FormData();
      Object.keys(form).forEach(k => { if (k !== 'imageFile') data.append(k, form[k]); });
      if (form.imageFile) data.append('image', form.imageFile);
      const opts = { headers: { 'Content-Type': 'multipart/form-data' } };
      if (editing) {
        await api.put(`/menu/${editing.id}/`, data, opts);
        toast.success('Food item updated!');
      } else {
        await api.post('/menu/', data, opts);
        toast.success('Food item added successfully!');
      }
      setForm(defaultForm); setShowForm(false); setEditing(null); load();
    } catch { toast.error('Failed to save food item'); }
  };

  const deleteItem = async (id) => {
    if (!window.confirm('Are you sure you want to delete this food item?')) return;
    try {
      await api.delete(`/menu/${id}/`);
      setItems(prev => prev.filter(i => i.id !== id));
      toast.success('Food item deleted');
    } catch { toast.error('Failed to delete item'); }
  };

  const toggleAvail = async (item) => {
    try {
      const res = await api.put(`/menu/${item.id}/`, { ...item, availability: !item.availability });
      setItems(prev => prev.map(i => i.id === item.id ? res.data : i));
      toast.success(res.data.availability ? 'Food item is now visible' : 'Food item is now hidden');
    } catch { toast.error('Failed to update availability'); }
  };

  const startEdit = (food) => {
    setEditing(food);
    setForm({ item_name: food.item_name, category: food.category, price: food.price, prep_time_mins: food.prep_time_mins, description: food.description || '', food_type: food.food_type || 'veg', imageFile: null });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <StaffLayout title="Food Menu" subtitle="Add or modify delicacies, categories, and stock availability">
      <div className="dash-page" style={{ padding: 24 }}>
        
        {/* Header */}
        <div className="dash-welcome" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-1)', margin: '0 0 6px 0' }}>Kitchen Menu Panel</h1>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-3)' }}>
              Add new delicacies, modify prices, or toggle active item availability
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={load} className="dash-btn dash-btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <RefreshCw size={14} className={loading ? 'spin' : ''} /> Sync
            </button>
            <button onClick={() => { setShowForm(s => !s); setEditing(null); setForm(defaultForm); }} className="dash-btn dash-btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Plus size={15} /> Add Food Item
            </button>
          </div>
        </div>

        {/* Filter & Search actions */}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 28, justifyContent: 'space-between', alignItems: 'center' }}>
          {/* Categories bar */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className={`dash-btn ${category === 'all' ? 'dash-btn-primary' : 'dash-btn-ghost'}`} onClick={() => setCategory('all')} style={{ height: 34, fontSize: '0.78rem', padding: '0 14px' }}>
              All ({items.length})
            </button>
            {CATEGORIES.map(c => (
              <button key={c} className={`dash-btn ${category === c ? 'dash-btn-primary' : 'dash-btn-ghost'}`} onClick={() => setCategory(c)} style={{ height: 34, fontSize: '0.78rem', padding: '0 14px', textTransform: 'capitalize' }}>
                {c.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="admin-input-wrap" style={{ maxWidth: 280, margin: 0 }}>
            <Search size={14} className="admin-input-icon" />
            <input className="admin-input" placeholder="Search delicacies…" value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 34, height: 36 }} />
          </div>
        </div>

        {/* Add / Edit Form Panel */}
        {showForm && (
          <div className="admin-form-panel" style={{ marginBottom: 28 }}>
            <div className="admin-form-panel-header">
              <span className="admin-form-panel-title">{editing ? 'Edit Food Item' : 'Add New Food Item'}</span>
              <button className="dash-btn dash-btn-ghost" onClick={() => { setShowForm(false); setEditing(null); }} style={{ height: 28, padding: '0 10px', fontSize: '0.75rem' }}>
                <X size={12} /> Cancel
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
                    <select className="admin-select" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={{ background: 'var(--surface-3)', border: '1px solid var(--border)', color: 'var(--text-1)' }}>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
                    </select>
                  </div>
                  <div className="admin-form-field">
                    <label className="admin-form-label">Price (₹) *</label>
                    <input className="admin-input" type="number" placeholder="0" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} required />
                  </div>
                  <div className="admin-form-field">
                    <label className="admin-form-label">Estimated Cook Time (mins)</label>
                    <input className="admin-input" type="number" value={form.prep_time_mins} onChange={e => setForm({ ...form, prep_time_mins: +e.target.value })} min={1} />
                  </div>
                  <div className="admin-form-field">
                    <label className="admin-form-label">Food Type</label>
                    <select className="admin-select" value={form.food_type} onChange={e => setForm({ ...form, food_type: e.target.value })} style={{ background: 'var(--surface-3)', border: '1px solid var(--border)', color: 'var(--text-1)' }}>
                      <option value="veg">Veg (Vegetarian)</option>
                      <option value="egg">Egg (Contains Egg)</option>
                      <option value="non_veg">Non-Veg (Non-Vegetarian)</option>
                    </select>
                  </div>
                  <div className="admin-form-field">
                    <label className="admin-form-label">Food Photo</label>
                    <input className="admin-input" type="file" accept="image/*" onChange={e => setForm({ ...form, imageFile: e.target.files?.[0] || null })} style={{ paddingTop: 8 }} />
                  </div>
                  <div className="admin-form-field" style={{ gridColumn: '1 / -1' }}>
                    <label className="admin-form-label">Description / Ingredients</label>
                    <textarea className="admin-input" style={{ height: 72, resize: 'vertical', paddingTop: 10 }} placeholder="Write details about the dish…" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                  </div>
                </div>
                <div className="admin-form-actions" style={{ marginTop: 20 }}>
                  <button type="submit" className="dash-btn dash-btn-primary" style={{ padding: '8px 20px', fontWeight: 800 }}>{editing ? 'Update Dish' : 'Publish Dish'}</button>
                  <button type="button" className="dash-btn dash-btn-ghost" onClick={() => { setShowForm(false); setEditing(null); }} style={{ padding: '8px 16px' }}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Menu Items Cards Grid */}
        {loading ? (
          <div className="admin-empty" style={{ padding: 60 }}><div style={{ width: 36, height: 36, border: '3px solid var(--teal)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto' }} /></div>
        ) : filtered.length === 0 ? (
          <div className="admin-empty" style={{ padding: '80px 20px', border: '1.5px dashed var(--border)', borderRadius: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <Utensils size={40} color="var(--text-3)" style={{ marginBottom: 12, opacity: 0.5 }} />
            <h3>No menu items found</h3>
            <p>Add your first food item using the button above.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
            {filtered.map(item => (
              <div key={item.id} className="dash-card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ height: 150, overflow: 'hidden', background: 'var(--surface-2)' }}>
                  <img
                    src={resolveImage(item)}
                    alt={item.item_name}
                    onError={e => {
                      e.target.onerror = null;
                      e.target.src = '/assets/food/lunch/veg_meals.jpg';
                    }}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
                
                <div style={{ padding: 18, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-1)', margin: 0 }}>{item.item_name}</h3>
                      <span style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--lime-main)' }}>₹{item.price}</span>
                    </div>

                    <p style={{ margin: '0 0 12px 0', fontSize: '0.78rem', color: 'var(--text-3)', lineClamp: 2, overflow: 'hidden' }}>
                      {item.description || 'No description provided.'}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
                      <span className={`dash-badge ${item.food_type === 'veg' ? 'green' : item.food_type === 'egg' ? 'yellow' : 'red'}`} style={{ fontSize: '0.68rem', fontWeight: 700 }}>
                        {item.food_type === 'veg' ? 'Veg' : item.food_type === 'egg' ? 'Egg' : 'Non-Veg'}
                      </span>
                      <span className="dash-badge blue" style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'capitalize' }}>
                        {item.prep_time_mins} mins
                      </span>
                      <span className={`dash-badge ${item.availability ? 'teal' : 'yellow'}`} style={{ fontSize: '0.68rem', fontWeight: 700 }}>
                        {item.availability ? 'Available' : 'Unavailable'}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => startEdit(item)} className="dash-btn dash-btn-ghost" style={{ flex: 1, fontSize: '0.78rem', height: 32, padding: 0 }}>Edit</button>
                    <button onClick={() => toggleAvail(item)} className="dash-btn" style={{ flex: 1, fontSize: '0.78rem', height: 32, padding: 0, background: item.availability ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.08)', color: item.availability ? '#ef4444' : '#22c55e', border: 'none' }}>
                      {item.availability ? 'Hide Dish' : 'Show Dish'}
                    </button>
                    <button onClick={() => deleteItem(item.id)} className="dash-btn" style={{ height: 32, width: 32, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none' }}>✕</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </StaffLayout>
  );
}
