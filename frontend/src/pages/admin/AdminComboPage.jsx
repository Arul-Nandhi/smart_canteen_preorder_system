import { useState, useEffect } from 'react';
import { RefreshCw, Plus, X, Search, Check, Zap, Tag, Clock } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import api from '../../services/api';
import toast from 'react-hot-toast';
import PresetImagePicker from '../../components/PresetImagePicker';

/* ── Static combos from the student Offers page (read-only reference) ── */
const OFFERS_COMBOS = [
  {
    id: 'f1', name: 'Masala Dosa Combo', tag: 'Veg', tagColor: '#0f8a65',
    original: 70, offer: 55, image: '/assets/food/breakfast/masala_dosa.jpg',
    items: ['Masala Dosa', 'Filter Coffee'],
  },
  {
    id: 'f2', name: 'Egg Biriyani Combo', tag: 'Egg', tagColor: '#d97706',
    original: 160, offer: 129, image: '/assets/food/lunch/egg_biriyani.jpg',
    items: ['Egg Biriyani', 'Lassi'],
  },
  {
    id: 'f3', name: 'Chicken Burger Fiesta', tag: 'Non-Veg', tagColor: '#e43b4f',
    original: 149, offer: 119, image: '/assets/food/pizza&burger/spicy_chicken_zinger_burger.jpg',
    items: ['Spicy Chicken Zinger Burger', 'French Fries', 'Pepsi'],
  },
  {
    id: 'pbc1', name: 'Margherita Pizza & Sprite', tag: 'Veg', tagColor: '#0f8a65',
    original: 129, offer: 99, image: '/assets/food/pizza&burger/classic_margherita_pizza.jpg',
    items: ['Classic Margherita Pizza', 'Sprite'],
  },
  {
    id: 'pbc2', name: 'Cheeseburger & Pepsi', tag: 'Non-Veg', tagColor: '#e43b4f',
    original: 119, offer: 95, image: '/assets/food/pizza&burger/classic_cheeseburger.jpg',
    items: ['Classic Cheeseburger', 'Pepsi'],
  },
  {
    id: 'pbc3', name: 'Zinger Burger & Coke', tag: 'Non-Veg', tagColor: '#e43b4f',
    original: 119, offer: 95, image: '/assets/food/pizza&burger/spicy_chicken_zinger_burger.jpg',
    items: ['Spicy Chicken Zinger Burger', 'Coca-Cola'],
  },
  {
    id: 'pbc4', name: 'Veggie Pizza & Mirinda', tag: 'Veg', tagColor: '#0f8a65',
    original: 149, offer: 119, image: '/assets/food/pizza&burger/farmhouse_veggie_pizza.jpg',
    items: ['Farmhouse Veggie Pizza', 'Mirinda'],
  },
];

const CATEGORY_OFFERS = [
  { name: 'Sambar Idli', tag: 'Veg', tagColor: '#0f8a65', original: 35, offer: 25, image: '/assets/food/breakfast/sambar_idli.jpg' },
  { name: 'Veg Meals',   tag: 'Veg', tagColor: '#0f8a65', original: 75, offer: 59, image: '/assets/food/lunch/veg_meals.jpg' },
  { name: 'Fruit Custard',tag:'Veg', tagColor: '#0f8a65', original: 40, offer: 29, image: '/assets/food/dessert/fruit_custard.jpg' },
  { name: 'Egg Sandwich', tag: 'Egg', tagColor: '#d97706', original: 40, offer: 29, image: '/assets/food/snacks/egg_sandwich.jpg' },
  { name: 'Egg Fried Rice',tag:'Egg',tagColor: '#d97706', original: 75, offer: 59, image: '/assets/food/lunch/egg_fried_rice.jpg' },
  { name: 'Chicken Roll', tag: 'Non-Veg', tagColor: '#e43b4f', original: 40, offer: 29, image: '/assets/food/snacks/chicken_roll.jpg' },
  { name: 'Mutton Biriyani', tag: 'Non-Veg', tagColor: '#e43b4f', original: 120, offer: 99, image: '/assets/food/lunch/mutton_biriyani.jpg' },
];

const defaultForm = {
  combo_name: '', price: '', description: '', imageFile: null, selected_items: []
};

const defaultOfferForm = { name: '', original: '', offer: '', tag: 'veg', image: '', desc: '' };

export default function AdminComboPage() {
  const [items,    setItems]    = useState([]);
  const [combos,   setCombos]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form,     setForm]     = useState(defaultForm);
  const [search,   setSearch]   = useState('');
  const [editing,  setEditing]  = useState(null);

  // Live offers editable state
  const [liveOffers, setLiveOffers] = useState(() => {
    const saved = localStorage.getItem('liveOffers');
    return saved ? JSON.parse(saved) : OFFERS_COMBOS;
  });
  const [catOffers, setCatOffers] = useState(() => {
    const saved = localStorage.getItem('catOffers');
    return saved ? JSON.parse(saved) : CATEGORY_OFFERS;
  });
  const [editingOffer,   setEditingOffer]   = useState(null);  // { type:'combo'|'cat', index }
  const [offerForm,      setOfferForm]      = useState(defaultOfferForm);
  const [showOfferPresetPicker, setShowOfferPresetPicker] = useState(false);

  const load = async () => {
    try {
      const [menuRes] = await Promise.all([api.get('/menu/')]);
      const all = menuRes.data;
      setItems(all.filter(i => i.category !== 'combo'));
      setCombos(all.filter(i => i.category === 'combo'));
    } catch { toast.error('Failed to load menu'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const toggleItem = (item) => {
    setForm(prev => {
      const exists = prev.selected_items.find(s => s.id === item.id);
      return {
        ...prev,
        selected_items: exists
          ? prev.selected_items.filter(s => s.id !== item.id)
          : [...prev.selected_items, item],
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.selected_items.length < 2) {
      toast.error('Select at least 2 items for a combo');
      return;
    }
    try {
      const data = new FormData();
      data.append('item_name', form.combo_name);
      data.append('category', 'combo');
      data.append('price', form.price);
      data.append('description', form.description || `Combo: ${form.selected_items.map(i => i.item_name).join(' + ')}`);
      data.append('food_type', 'veg');
      data.append('combo_items', JSON.stringify(form.selected_items.map(i => i.id)));
      if (form.imageFile) data.append('image', form.imageFile);
      const opts = { headers: { 'Content-Type': 'multipart/form-data' } };
      if (editing) {
        await api.put(`/menu/${editing.id}/`, data, opts);
        toast.success('Combo updated!');
      } else {
        await api.post('/menu/', data, opts);
        toast.success('Combo created!');
      }
      setForm(defaultForm); setShowForm(false); setEditing(null); load();
    } catch { toast.error('Failed to save combo'); }
  };

  const deleteCombo = async (id) => {
    if (!window.confirm('Delete this combo?')) return;
    try {
      await api.delete(`/menu/${id}/`);
      setCombos(prev => prev.filter(c => c.id !== id));
      toast.success('Combo deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const getConstituentItems = (comboItemIds) => {
    if (!comboItemIds) return [];
    let ids = [];
    try {
      ids = typeof comboItemIds === 'string' ? JSON.parse(comboItemIds) : comboItemIds;
    } catch {
      return [];
    }
    if (!Array.isArray(ids)) return [];
    return ids.map(id => items.find(i => i.id === id)).filter(Boolean);
  };

  const startEdit = (combo) => {
    setEditing(combo);
    const constituents = getConstituentItems(combo.combo_items);
    setForm({
      combo_name: combo.item_name,
      price: combo.price,
      description: combo.description || '',
      imageFile: null,
      selected_items: constituents
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveOffer = () => {
    if (!offerForm.name) {
      toast.error('Deal Name is required');
      return;
    }
    const tagColors = { veg: '#0f8a65', egg: '#d97706', nonveg: '#e43b4f' };
    const tagLabels = { veg: 'Veg', egg: 'Egg', nonveg: 'Non-Veg' };
    
    if (editingOffer.type === 'combo') {
      const updated = liveOffers.map(deal => {
        if (deal.id === editingOffer.id) {
          return {
            ...deal,
            name: offerForm.name,
            desc: offerForm.desc,
            original: parseFloat(offerForm.original || 0),
            offer: parseFloat(offerForm.offer || 0),
            tag: offerForm.tag,
            tagColor: tagColors[offerForm.tag] || '#0f8a65',
            image: offerForm.image,
            items: offerForm.selected_items
          };
        }
        return deal;
      });
      setLiveOffers(updated);
      localStorage.setItem('liveOffers', JSON.stringify(updated));
      toast.success('Offer combo updated!');
    } else if (editingOffer.type === 'cat') {
      const updated = catOffers.map((deal, idx) => {
        if (idx === editingOffer.index) {
          return {
            ...deal,
            name: offerForm.name,
            original: parseFloat(offerForm.original || 0),
            offer: parseFloat(offerForm.offer || 0),
            tag: tagLabels[offerForm.tag] || 'Veg',
            tagColor: tagColors[offerForm.tag] || '#0f8a65',
            image: offerForm.image
          };
        }
        return deal;
      });
      setCatOffers(updated);
      localStorage.setItem('catOffers', JSON.stringify(updated));
      toast.success('Category deal updated!');
    }
    setEditingOffer(null);
  };

  const resetOffersToDefault = () => {
    if (!window.confirm('Reset all live student offers to seeded defaults?')) return;
    localStorage.removeItem('liveOffers');
    localStorage.removeItem('catOffers');
    setLiveOffers(OFFERS_COMBOS);
    setCatOffers(CATEGORY_OFFERS);
    toast.success('Live student offers reset to defaults!');
  };

  const filteredItems = items.filter(i =>
    !search || i.item_name.toLowerCase().includes(search.toLowerCase())
  );

  const comboDiscount = (items) => {
    const natural = items.reduce((s, i) => s + parseFloat(i.price || 0), 0);
    const comboPrice = parseFloat(form.price || 0);
    return natural > 0 && comboPrice < natural ? Math.round(((natural - comboPrice) / natural) * 100) : 0;
  };

  return (
    <AdminLayout title="Combo Meals" subtitle="Create and manage food combo packages">

      {/* Top Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: '0.83rem', color: 'var(--text-3)' }}>
            {combos.length} combo{combos.length !== 1 ? 's' : ''} configured · Select 2+ items to build a combo
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={load} className="admin-btn admin-btn-ghost admin-btn-sm"><RefreshCw size={14} /></button>
          <button
            onClick={() => { setShowForm(s => !s); setEditing(null); setForm(defaultForm); }}
            className="admin-btn admin-btn-primary"
          >
            <Plus size={15} /> {showForm ? 'Cancel' : 'New Combo'}
          </button>
        </div>
      </div>

      {/* Create / Edit Form */}
      {showForm && (
        <div className="admin-form-panel" style={{ marginBottom: 24 }}>
          <div className="admin-form-panel-header">
            <span className="admin-form-panel-title">
              {editing ? '✏️ Edit Combo' : '🍱 Create New Combo Meal'}
            </span>
            <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => { setShowForm(false); setEditing(null); }}>
              <X size={14} /> Cancel
            </button>
          </div>
          <div className="admin-form-body">
            <form onSubmit={handleSubmit}>
              {/* Basic Fields */}
              <div className="admin-form-grid" style={{ marginBottom: 20 }}>
                <div className="admin-form-field">
                  <label className="admin-form-label">Combo Name *</label>
                  <input className="admin-input" placeholder="e.g. Student Special" value={form.combo_name}
                    onChange={e => setForm({ ...form, combo_name: e.target.value })} required />
                </div>
                <div className="admin-form-field">
                  <label className="admin-form-label">Combo Price (₹) *</label>
                  <input className="admin-input" type="number" placeholder="0" value={form.price}
                    onChange={e => setForm({ ...form, price: e.target.value })} required />
                  {comboDiscount(form.selected_items) > 0 && (
                    <span style={{ fontSize: '0.72rem', color: '#22c55e', fontWeight: 700, marginTop: 4 }}>
                      🎉 {comboDiscount(form.selected_items)}% savings vs individual prices
                    </span>
                  )}
                </div>
                <div className="admin-form-field">
                  <label className="admin-form-label">Combo Image</label>
                  <input className="admin-input" type="file" accept="image/*"
                    onChange={e => setForm({ ...form, imageFile: e.target.files?.[0] || null })}
                    style={{ paddingTop: 8 }} />
                </div>
                <div className="admin-form-field" style={{ gridColumn: '1 / -1' }}>
                  <label className="admin-form-label">Description</label>
                  <textarea className="admin-input" style={{ height: 64, resize: 'vertical', paddingTop: 10 }}
                    placeholder="Optional description…" value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })} />
                </div>
              </div>

              {/* Item Selector */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <label className="admin-form-label">Select Items ({form.selected_items.length} selected)</label>
                  <div className="admin-input-wrap" style={{ width: 200 }}>
                    <Search size={14} className="admin-input-icon" />
                    <input className="admin-input" placeholder="Search items…" value={search}
                      onChange={e => setSearch(e.target.value)} style={{ height: 34 }} />
                  </div>
                </div>

                {/* Selected chips */}
                {form.selected_items.length > 0 && (
                  <div className="combo-selected-chips" style={{ marginBottom: 10 }}>
                    {form.selected_items.map(item => (
                      <div key={item.id} className="combo-chip">
                        {item.item_name} · ₹{item.price}
                        <span className="combo-chip-remove" onClick={() => toggleItem(item)}>×</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="combo-item-picker">
                  {filteredItems.map(item => {
                    const selected = form.selected_items.find(s => s.id === item.id);
                    return (
                      <div
                        key={item.id}
                        className={`combo-pick-card ${selected ? 'selected' : ''}`}
                        onClick={() => toggleItem(item)}
                      >
                        <div className="combo-pick-check">
                          {selected && <Check size={12} />}
                        </div>
                        <div>
                          <div className="combo-pick-name">{item.item_name}</div>
                          <div className="combo-pick-price">₹{item.price}</div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-3)', marginTop: 2 }}>{item.category}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="admin-form-actions">
                <button type="submit" className="admin-btn admin-btn-primary">{editing ? 'Update Combo' : 'Save Combo'}</button>
                <button type="button" className="admin-btn admin-btn-secondary" onClick={() => { setShowForm(false); setEditing(null); }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Combo Cards Grid */}
      <div className="admin-section-header" style={{ marginBottom: 16 }}>
        <div className="admin-section-title">Existing Combos ({combos.length})</div>
      </div>

      {loading ? (
        <div className="admin-empty"><div style={{ width: 36, height: 36, border: '3px solid var(--teal)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto' }} /></div>
      ) : combos.length === 0 ? (
        <div className="admin-empty">
          <div className="admin-empty-icon">🍱</div>
          <p>No combo meals yet — create your first combo above</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {combos.map(combo => (
            <div key={combo.id} className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
              {combo.image ? (
                <div style={{ height: 140, overflow: 'hidden', background: 'var(--surface-2)' }}>
                  <img src={combo.image} alt={combo.item_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ) : (
                <div style={{ height: 100, background: 'linear-gradient(135deg, rgba(20,209,178,0.1), rgba(167,139,250,0.1))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem' }}>
                  🍱
                </div>
              )}
              <div style={{ padding: '14px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-1)' }}>{combo.item_name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginTop: 2 }}>Combo Meal</div>
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--teal)' }}>₹{combo.price}</div>
                </div>
                {combo.description && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginBottom: 12, lineHeight: 1.5 }}>
                    {combo.description}
                  </p>
                )}
                
                {/* List constituent items */}
                {(() => {
                  const constituents = getConstituentItems(combo.combo_items);
                  if (constituents.length === 0) return null;
                  return (
                    <div style={{ margin: '12px 0', borderTop: '1px dashed var(--border)', paddingTop: 10 }}>
                      <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.3px' }}>Includes Items:</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {constituents.map(c => (
                          <span key={c.id} style={{ fontSize: '0.68rem', background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-2)', padding: '2px 8px', borderRadius: 6 }}>
                            {c.item_name}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button onClick={() => startEdit(combo)} className="admin-btn admin-btn-secondary admin-btn-sm" style={{ flex: 1 }}>Edit</button>
                  <button onClick={() => deleteCombo(combo.id)} className="admin-btn admin-btn-danger admin-btn-sm">✕</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Offers Page Preview ── */}
      <div style={{ marginTop: 40 }}>
        {/* Section header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(228,59,79,0.12)', border: '1px solid rgba(228,59,79,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={17} color="#e43b4f" />
          </div>
          <div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-1)' }}>Student Offers Page Preview</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: 1 }}>Manage custom promotions &amp; deals directly on the Student Offers page.</div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
            <button
              onClick={resetOffersToDefault}
              className="admin-btn admin-btn-ghost admin-btn-sm"
              style={{ fontSize: '0.75rem', padding: '4px 10px', color: 'var(--text-3)' }}
            >
              Reset to Defaults
            </button>
            <span style={{ fontSize: '0.7rem', background: 'rgba(20,209,178,0.1)', color: 'var(--teal)', border: '1px solid rgba(20,209,178,0.25)', padding: '3px 10px', borderRadius: 999, fontWeight: 700 }}>
              LIVE
            </span>
          </div>
        </div>

        {/* Flash / Pizza-Burger combos */}
        <div style={{ marginBottom: 10, fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-3)', letterSpacing: '0.5px' }}>
          ⚡ Flash Sales &amp; Pizza-Burger Combos
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 14, marginBottom: 28 }}>
          {liveOffers.map(deal => {
            const pct = Math.round(((deal.original - deal.offer) / deal.original) * 100);
            return (
              <div key={deal.id} className="admin-card" style={{ padding: 0, overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column' }}>
                {/* Discount ribbon */}
                <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 2, background: 'linear-gradient(135deg,#e43b4f,#ff6b6b)', color: '#fff', fontSize: '0.65rem', fontWeight: 900, padding: '2px 8px', borderRadius: 999 }}>
                  {pct}% OFF
                </div>
                <div style={{ height: 130, overflow: 'hidden', background: '#000', position: 'relative' }}>
                  <img src={deal.image} alt={deal.name} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.92 }} />
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 40, background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)' }} />
                  <span style={{ position: 'absolute', bottom: 7, right: 8, fontSize: '0.62rem', fontWeight: 700, color: deal.tagColor || '#0f8a65', background: 'rgba(0,0,0,0.75)', padding: '1px 7px', borderRadius: 999 }}>
                    {deal.tag}
                  </span>
                </div>
                <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-1)', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {deal.name}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                    {deal.items && deal.items.map((item, idx) => (
                      <span key={idx} style={{ fontSize: '0.62rem', background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-3)', padding: '1px 7px', borderRadius: 5 }}>
                        {typeof item === 'string' ? item : (item.item_name || item.name)}
                      </span>
                    ))}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 8 }}>
                    <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--teal)' }}>₹{deal.offer}</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-3)', textDecoration: 'line-through' }}>₹{deal.original}</span>
                  </div>
                  <button
                    onClick={() => {
                      setEditingOffer({ type: 'combo', id: deal.id });
                      setOfferForm({
                        name: deal.name,
                        desc: deal.desc || '',
                        original: deal.original,
                        offer: deal.offer,
                        tag: deal.tag ? deal.tag.toLowerCase().replace('-', '') : 'veg',
                        image: deal.image || '',
                        selected_items: Array.isArray(deal.items)
                          ? deal.items.map(item => {
                              if (typeof item === 'string') {
                                return items.find(i => i.item_name.toLowerCase() === item.toLowerCase()) || { id: Math.random(), item_name: item, price: 0 };
                              }
                              return item;
                            })
                          : []
                      });
                    }}
                    className="admin-btn admin-btn-secondary admin-btn-sm"
                    style={{ width: '100%', marginTop: 'auto' }}
                  >
                    Edit Offer
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Category offers */}
        <div style={{ marginBottom: 10, fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-3)', letterSpacing: '0.5px' }}>
          <Tag size={12} style={{ display: 'inline', marginRight: 5 }} />
          Category Deals (Veg / Egg / Non-Veg)
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
          {catOffers.map((deal, idx) => {
            const pct = Math.round(((deal.original - deal.offer) / deal.original) * 100);
            return (
              <div key={idx} className="admin-card" style={{ padding: '10px 12px', display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ width: 62, height: 62, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: '#000' }}>
                  <img src={deal.image} alt={deal.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{deal.name}</span>
                    <span style={{ fontSize: '0.6rem', fontWeight: 700, color: deal.tagColor, background: `${deal.tagColor}18`, border: `1px solid ${deal.tagColor}35`, padding: '1px 6px', borderRadius: 999, flexShrink: 0 }}>{deal.tag}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--teal)' }}>₹{deal.offer}</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-3)', textDecoration: 'line-through' }}>₹{deal.original}</span>
                    <span style={{ fontSize: '0.62rem', fontWeight: 800, background: 'linear-gradient(135deg,#e43b4f,#ff6b6b)', color: '#fff', padding: '1px 6px', borderRadius: 999 }}>{pct}% OFF</span>
                  </div>
                  <button
                    onClick={() => {
                      setEditingOffer({ type: 'cat', index: idx });
                      setOfferForm({
                        name: deal.name,
                        desc: deal.desc || '',
                        original: deal.original,
                        offer: deal.offer,
                        tag: deal.tag ? deal.tag.toLowerCase().replace('-', '') : 'veg',
                        image: deal.image || '',
                        selected_items: []
                      });
                    }}
                    className="admin-btn admin-btn-secondary admin-btn-sm"
                    style={{ fontSize: '0.68rem', padding: '2px 8px', marginTop: 4, height: 22 }}
                  >
                    Edit
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Edit Student Offer Modal */}
      {editingOffer && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1100, padding: 20
        }}>
          <div className="admin-card" style={{ width: '100%', maxWidth: 540, maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-1)' }}>
                ✏️ Edit Student Offer Deal
              </span>
              <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => setEditingOffer(null)}>
                <X size={18} />
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label className="admin-form-label">Deal Name *</label>
                  <input className="admin-input" value={offerForm.name} onChange={e => setOfferForm({ ...offerForm, name: e.target.value })} required />
                </div>
                {editingOffer.type === 'combo' && (
                  <div>
                    <label className="admin-form-label">Description / Subtitle</label>
                    <input className="admin-input" value={offerForm.desc} onChange={e => setOfferForm({ ...offerForm, desc: e.target.value })} />
                  </div>
                )}
                {editingOffer.type === 'cat' && (
                  <div>
                    <label className="admin-form-label">Description</label>
                    <input className="admin-input" value={offerForm.desc} onChange={e => setOfferForm({ ...offerForm, desc: e.target.value })} />
                  </div>
                )}
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <label className="admin-form-label">Original Price (₹) *</label>
                    <input className="admin-input" type="number" value={offerForm.original} onChange={e => setOfferForm({ ...offerForm, original: e.target.value })} required />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="admin-form-label">Offer Price (₹) *</label>
                    <input className="admin-input" type="number" value={offerForm.offer} onChange={e => setOfferForm({ ...offerForm, offer: e.target.value })} required />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <label className="admin-form-label">Tag / Diet Type</label>
                    <select className="admin-select" value={offerForm.tag} onChange={e => setOfferForm({ ...offerForm, tag: e.target.value })}>
                      <option value="veg">Veg</option>
                      <option value="egg">Egg</option>
                      <option value="nonveg">Non-Veg</option>
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="admin-form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Image Path</span>
                      <button type="button" onClick={() => setShowOfferPresetPicker(true)} style={{ background: 'none', border: 'none', color: 'var(--teal)', fontSize: '0.72rem', cursor: 'pointer', fontWeight: 800, padding: 0 }}>
                        Preset
                      </button>
                    </label>
                    <input className="admin-input" value={offerForm.image} onChange={e => setOfferForm({ ...offerForm, image: e.target.value })} />
                  </div>
                </div>
                {editingOffer.type === 'combo' && (
                  <div>
                    <label className="admin-form-label">Constituent Items (Select from Canteen Menu)</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                      {offerForm.selected_items.map(item => (
                        <span key={item.id} style={{ fontSize: '0.72rem', background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-2)', padding: '2px 8px', borderRadius: 6, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          {item.item_name}
                          <span style={{ cursor: 'pointer', color: 'var(--red)', fontWeight: 800 }} onClick={() => {
                            setOfferForm(f => ({ ...f, selected_items: f.selected_items.filter(s => s.id !== item.id) }));
                          }}>×</span>
                        </span>
                      ))}
                    </div>
                    <div style={{ maxHeight: 180, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 8, padding: 10 }}>
                      {items.map(item => {
                        const selected = offerForm.selected_items.some(s => s.id === item.id);
                        return (
                          <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 4px', borderBottom: '1px solid var(--border)', fontSize: '0.75rem', cursor: 'pointer' }}
                            onClick={() => {
                              setOfferForm(f => {
                                const exists = f.selected_items.some(s => s.id === item.id);
                                return {
                                  ...f,
                                  selected_items: exists
                                    ? f.selected_items.filter(s => s.id !== item.id)
                                    : [...f.selected_items, item]
                                };
                              });
                            }}>
                            <span style={{ color: selected ? 'var(--teal)' : 'var(--text-1)', fontWeight: selected ? 800 : 500 }}>
                              {item.item_name} (₹{item.price})
                            </span>
                            <span style={{ color: 'var(--text-3)' }}>{selected ? '✓ Selected' : '+ Add'}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 10, background: 'var(--surface-2)' }}>
              <button className="admin-btn admin-btn-secondary" onClick={() => setEditingOffer(null)}>Cancel</button>
              <button className="admin-btn admin-btn-primary" onClick={handleSaveOffer}>Save Offer</button>
            </div>
          </div>
        </div>
      )}

      {/* Preset Picker for Offer */}
      {showOfferPresetPicker && (
        <PresetImagePicker
          currentCategory={offerForm.tag === 'nonveg' ? 'lunch' : offerForm.tag}
          onSelect={(path) => {
            setOfferForm(f => ({ ...f, image: path }));
            setShowOfferPresetPicker(false);
            toast.success('Offer image updated!');
          }}
          onClose={() => setShowOfferPresetPicker(false)}
        />
      )}

    </AdminLayout>
  );
}
