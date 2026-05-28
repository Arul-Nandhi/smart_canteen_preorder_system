import { useState, useEffect } from 'react';
import { Search, Plus, Minus, SlidersHorizontal } from 'lucide-react';
import Navbar from '../components/Navbar';
import FoodDetailModal from '../components/FoodDetailModal';
import { useCart } from '../context/CartContext';
import { resolveImage } from '../services/imageResolver';
import api from '../services/api';
import toast from 'react-hot-toast';

const CATEGORIES = ['All','breakfast','lunch','evening_snacks','chaat','beverages','juices','desserts','bites','chinese','pizza','burgers','parotta','roti'];
const CATEGORY_DISPLAY = {
  All: 'All',
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  evening_snacks: 'Snacks',
  chaat: 'Chaat',
  beverages: 'Refreshing Drinks',
  juices: 'Juices',
  desserts: 'Desserts',
  bites: 'Bites',
  chinese: 'Chinese',
  pizza: 'Pizza',
  burgers: 'Burgers',
  parotta: 'Parotta',
  roti: 'Roti'
};

const isEggItem = (name) => /\begg\b|omelette|omellet|frittata/i.test(name);

const getDietType = (item) => {
  if (item.is_veg === false) {
    if (isEggItem(item.item_name)) return 'egg';
    return 'nonveg';
  }
  if (item.is_veg === true && isEggItem(item.item_name)) return 'egg';
  return 'veg';
};

const DietIcon = ({ item }) => {
  const type = getDietType(item);
  if (type === 'veg') return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ display:'inline', marginLeft:'0.4rem', verticalAlign:'middle' }} title="Vegetarian">
      <circle cx="8" cy="8" r="4" fill="#0f8a65"/>
    </svg>
  );
  if (type === 'egg') return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ display:'inline', marginLeft:'0.4rem', verticalAlign:'middle' }} title="Eggitarian">
      <circle cx="8" cy="8" r="4" fill="#d97706"/>
    </svg>
  );
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ display:'inline', marginLeft:'0.4rem', verticalAlign:'middle' }} title="Non-Vegetarian">
      <path d="M8 4L11.5 11H4.5L8 4Z" fill="#e43b4f"/>
    </svg>
  );
};

export default function Menu() {
  const [items,    setItems]    = useState([]);
  const [search,   setSearch]   = useState('');
  const [category, setCategory] = useState('All');
  const [dietFilter, setDietFilter] = useState('all');
  const [loading,  setLoading]  = useState(true);
  const [selectedFood, setSelectedFood] = useState(null);
  const { cart, addItem, updateQty } = useCart();

  useEffect(() => {
    const fetchMenu = async () => {
      setLoading(true);
      try {
        const params = {};
        if (category !== 'All') params.category = category;
        if (search) params.search = search;
        const res = await api.get('/menu/', { params });
        setItems(res.data);
      } catch { toast.error('Failed to load menu'); }
      finally { setLoading(false); }
    };
    const t = setTimeout(fetchMenu, 300);
    return () => clearTimeout(t);
  }, [search, category]);

  const getQty = (id) => cart.find(i => i.id === id)?.qty || 0;

  const displayed = dietFilter === 'veg'
    ? items.filter(i => getDietType(i) === 'veg')
    : dietFilter === 'egg'
    ? items.filter(i => getDietType(i) === 'egg')
    : dietFilter === 'nonveg'
    ? items.filter(i => getDietType(i) === 'nonveg' || getDietType(i) === 'egg')
    : items;

  const CATEGORY_PRIORITY = {
    breakfast: 1,
    lunch: 2,
    evening_snacks: 3,
    chaat: 4,
    pizza: 5,
    burgers: 6,
    parotta: 7,
    roti: 8,
    chinese: 9,
    bites: 10,
    desserts: 11,
    beverages: 12,
    juices: 13
  };

  const sortedItems = [...displayed].sort((a, b) => {
    const prioA = CATEGORY_PRIORITY[a.category] || 99;
    const prioB = CATEGORY_PRIORITY[b.category] || 99;
    if (prioA !== prioB) return prioA - prioB;
    return a.item_name.localeCompare(b.item_name);
  });

  return (
    <>
      <Navbar />
      
      {/* Zoom / Detail Modal */}
      {selectedFood && (
        <FoodDetailModal
          food={selectedFood}
          qty={getQty(selectedFood.id)}
          onAdd={(item) => {
            addItem(item);
            toast.success(`${item.item_name || item.name} added!`);
          }}
          onUpdateQty={updateQty}
          onClose={() => setSelectedFood(null)}
        />
      )}

      <div className="page-wrapper">
        {/* Header */}
        <div className="flex-between" style={{ marginBottom:'1.5rem', flexWrap:'wrap', gap:'1rem' }}>
          <h1 className="page-title" style={{ margin:0 }}>Browse Menu</h1>
          <div className="flex-gap">
            <div style={{ position:'relative' }}>
              <Search size={16} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }}/>
              <input className="form-input" style={{ paddingLeft:'2.2rem', width:220 }}
                placeholder="Search food…" value={search} onChange={e => setSearch(e.target.value)}/>
            </div>
            <button className="btn btn-sm"
              style={dietFilter === 'veg' 
                ? { background:'#0f8a65', color:'#fff', border:'1px solid #0f8a65' } 
                : { borderColor: 'rgba(15,138,101,0.5)', color: '#0f8a65', background: 'transparent', border: '1px solid' }
              }
              onClick={() => setDietFilter(p => p === 'veg' ? 'all' : 'veg')} title="Vegetarian">
              <span style={{ display:'inline-block', width:9, height:9, borderRadius:2, border: dietFilter === 'veg' ? '1.5px solid #fff' : '1.5px solid #0f8a65', background: dietFilter === 'veg' ? '#fff' : '#0f8a65', marginRight:4 }}/>
              Veg
            </button>
            <button className="btn btn-sm"
              style={dietFilter === 'egg' 
                ? { background:'#d97706', color:'#fff', border:'1px solid #d97706' } 
                : { borderColor: 'rgba(217,119,6,0.5)', color: '#d97706', background: 'transparent', border: '1px solid' }
              }
              onClick={() => setDietFilter(p => p === 'egg' ? 'all' : 'egg')} title="Eggitarian">
              <span style={{ display:'inline-block', width:9, height:9, borderRadius:2, border: dietFilter === 'egg' ? '1.5px solid #fff' : '1.5px solid #d97706', background: dietFilter === 'egg' ? '#fff' : '#d97706', marginRight:4 }}/>
              Egg
            </button>
            <button className="btn btn-sm"
              style={dietFilter === 'nonveg' 
                ? { background:'#e43b4f', color:'#fff', border:'1px solid #e43b4f' } 
                : { borderColor: 'rgba(228,59,79,0.5)', color: '#e43b4f', background: 'transparent', border: '1px solid' }
              }
              onClick={() => setDietFilter(p => p === 'nonveg' ? 'all' : 'nonveg')} title="Non-Vegetarian">
              <span style={{ display:'inline-block', width:9, height:9, borderRadius:2, border: dietFilter === 'nonveg' ? '1.5px solid #fff' : '1.5px solid #e43b4f', background: dietFilter === 'nonveg' ? '#fff' : '#e43b4f', marginRight:4 }}/>
              Non-Veg
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="category-container">
          {CATEGORIES.map(c => (
            <button key={c} className={`category-btn ${category === c ? 'active' : ''}`}
              onClick={() => setCategory(c)}>
              {CATEGORY_DISPLAY[c] || c}
            </button>
          ))}
        </div>

        {/* Count */}
        {!loading && (
          <p style={{ fontSize:'0.82rem', color:'var(--text-muted)', marginBottom:'1rem' }}>
            Showing {sortedItems.length} item{sortedItems.length !== 1 ? 's' : ''}
            {dietFilter === 'veg'    && <span style={{ color:'#0f8a65', marginLeft:'0.5rem' }}>· Vegetarian Only</span>}
            {dietFilter === 'egg'    && <span style={{ color:'#d97706', marginLeft:'0.5rem' }}>· Eggitarian Only</span>}
            {dietFilter === 'nonveg' && <span style={{ color:'#e43b4f', marginLeft:'0.5rem' }}>· Non-Veg Only</span>}
          </p>
        )}

        {/* Grid */}
        {loading ? (
          <div style={{ textAlign:'center', padding:'4rem', color:'var(--text-muted)' }}>
            <div className="spin-loader"/>
            <p style={{ marginTop:'1rem' }}>Loading menu…</p>
          </div>
        ) : sortedItems.length === 0 ? (
          <div style={{ textAlign:'center', padding:'4rem', color:'var(--text-muted)' }}>
            <p style={{ fontSize:'3rem' }}>🔍</p>
            <p style={{ marginTop:'0.5rem' }}>No items found. Try a different search.</p>
          </div>
        ) : (
          <div className="grid-3">
            {sortedItems.map(item => {
              const qty = getQty(item.id);
              return (
                <div 
                  key={item.id} 
                  className="card menu-card" 
                  style={{ position:'relative', cursor: 'pointer' }}
                  onClick={() => setSelectedFood(item)}
                >
                  {/* Image */}
                  <div style={{ position:'relative', overflow:'hidden' }}>
                    <img
                      src={resolveImage(item)}
                      alt={item.item_name}
                      onError={e => {
                        e.target.onerror = null;
                        e.target.src = '/assets/food/lunch/veg_meals.jpg';
                      }}
                      style={{ width:'100%', height:180, objectFit:'cover', transition:'transform 0.3s' }}
                    />
                    {!item.availability && (
                      <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.65)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <span style={{ background:'#c62828', color:'#fff', padding:'0.4rem 1rem', borderRadius:999, fontWeight:700, fontSize:'0.85rem' }}>
                          Out of Stock
                        </span>
                      </div>
                    )}
                    <div style={{ position:'absolute', top:8, left:8 }}>
                      <span className="badge badge-green" style={{ fontSize:'0.7rem' }}>
                        {CATEGORY_DISPLAY[item.category] || item.category}
                      </span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="menu-info">
                    <p className="menu-name">
                      {item.item_name}
                      <DietIcon item={item} />
                    </p>
                    <p style={{ fontSize:'0.85rem', color:'var(--text-muted)', margin:'0.2rem 0 0.75rem', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {item.description || `Estimated Prep: ${item.prep_time_mins} min`}
                    </p>
                    <div className="flex-between">
                      <span className="menu-price">₹{item.price}</span>
                      {item.availability && (
                        qty === 0 ? (
                          <button className="btn btn-primary btn-sm"
                            onClick={(e) => { e.stopPropagation(); addItem(item); toast.success(`${item.item_name} added!`); }}>
                            <Plus size={14}/> Add
                          </button>
                        ) : (
                          <div className="flex-gap" style={{ gap:'0.5rem' }}>
                            <button className="btn btn-outline btn-sm" onClick={(e) => { e.stopPropagation(); updateQty(item.id, qty - 1); }}><Minus size={13}/></button>
                            <span style={{ fontWeight:700, minWidth:20, textAlign:'center', color:'var(--lime-main)' }}>{qty}</span>
                            <button className="btn btn-primary btn-sm" onClick={(e) => { e.stopPropagation(); updateQty(item.id, qty + 1); }}><Plus size={13}/></button>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

