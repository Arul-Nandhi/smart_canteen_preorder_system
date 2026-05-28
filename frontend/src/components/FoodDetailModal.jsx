import { useState, useEffect } from 'react';
import { X, Clock, ShoppingBag, Plus, Minus, Star, Flame, ChefHat } from 'lucide-react';
import api from '../services/api';
import { resolveImage } from '../services/imageResolver';

/* ─── FSSAI diet indicator ─── */
const isEgg = (name = '') => /\begg\b|omelette|omellet/i.test(name);
const getDietType = (item) => {
  const name = item?.item_name || item?.name || '';
  if (item?.food_type === 'egg' || (item?.is_veg === false && isEgg(name))) return 'egg';
  if (item?.food_type === 'non_veg' || item?.is_veg === false) return 'nonveg';
  if (item?.is_veg === true && isEgg(name)) return 'egg';
  return 'veg';
};
const DIET = {
  veg:    { color: '#0f8a65', label: 'Veg'     },
  egg:    { color: '#d97706', label: 'Egg'     },
  nonveg: { color: '#e43b4f', label: 'Non-Veg' },
};

function DietDot({ item, size = 18 }) {
  const type = getDietType(item);
  const d = DIET[type];
  return (
    <span title={d.label} style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: size, height: size, border: `2px solid ${d.color}`,
      borderRadius: 3, background: 'transparent', flexShrink: 0,
    }}>
      {type === 'nonveg'
        ? <span style={{ width: 0, height: 0, borderLeft: `${size*0.28}px solid transparent`, borderRight: `${size*0.28}px solid transparent`, borderBottom: `${size*0.44}px solid ${d.color}` }} />
        : <span style={{ width: size*0.44, height: size*0.44, borderRadius: '50%', background: d.color }} />
      }
    </span>
  );
}

function Stars({ rating = 4.8 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={12} style={{ color: i <= Math.round(rating) ? '#f59e0b' : 'var(--border)', fill: i <= Math.round(rating) ? '#f59e0b' : 'none' }} />
      ))}
      <span style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginLeft: 4 }}>{rating}/5</span>
    </div>
  );
}

/* ─── Constituent item mini-card with asset image ─── */
function ComboItemCard({ c }) {
  const [imgSrc, setImgSrc] = useState(resolveImage(c));
  const dtype = getDietType(c);
  const dColor = DIET[dtype].color;

  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)',
      borderRadius: 12, overflow: 'hidden', transition: 'transform 0.2s, box-shadow 0.2s',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 8px 20px rgba(0,0,0,0.3)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow=''; }}
    >
      <div style={{ height: 82, position: 'relative', overflow: 'hidden', background: '#111' }}>
        <img
          src={imgSrc}
          alt={c.item_name || c.name}
          onError={() => setImgSrc(`/assets/food/lunch/veg_meals.jpg`)}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        {/* FSSAI dot on image */}
        <div style={{
          position: 'absolute', bottom: 5, right: 5,
          width: 14, height: 14, border: `1.5px solid ${dColor}`,
          borderRadius: 2, background: 'rgba(0,0,0,0.75)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {dtype === 'nonveg'
            ? <span style={{ width: 0, height: 0, borderLeft: '3px solid transparent', borderRight: '3px solid transparent', borderBottom: `5px solid ${dColor}` }} />
            : <span style={{ width: 6, height: 6, borderRadius: '50%', background: dColor }} />
          }
        </div>
      </div>
      <div style={{ padding: '7px 8px' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {c.item_name || c.name}
        </div>
        <div style={{ fontSize: '0.62rem', color: 'var(--teal)', fontWeight: 700, marginTop: 2 }}>₹{c.price}</div>
      </div>
    </div>
  );
}

/* ─── Main Modal ─── */
export default function FoodDetailModal({ food, qty, onAdd, onUpdateQty, onClose }) {
  const [constituents, setConstituents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [imgZoomed, setImgZoomed] = useState(false);
  const [mainSrc, setMainSrc] = useState(resolveImage(food));

  const isCombo = food.category === 'combo' || food.items || food.combo_items;
  const dietType = getDietType(food);
  const dInfo = DIET[dietType];

  const price = food.offer || food.price;
  const original = food.original;
  const savings = original ? original - price : 0;
  const savingsPct = original ? Math.round((savings / original) * 100) : 0;

  /* load combo constituents */
  useEffect(() => {
    if (!isCombo) return;
    if (food.items) { setConstituents(food.items); return; }
    const load = async () => {
      setLoading(true);
      try {
        let ids = [];
        if (typeof food.combo_items === 'string') ids = JSON.parse(food.combo_items);
        else if (Array.isArray(food.combo_items)) ids = food.combo_items;
        if (ids.length > 0) {
          const res = await api.get('/menu/');
          setConstituents(ids.map(id => res.data.find(i => i.id === id)).filter(Boolean));
        }
      } catch { /* silent */ }
      finally { setLoading(false); }
    };
    load();
  }, [food, isCombo]);

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0,
      background: 'rgba(4,6,10,0.88)', backdropFilter: 'blur(14px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1200, padding: 16,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: isCombo ? 860 : 520,
        maxHeight: '92vh', borderRadius: 20,
        background: 'linear-gradient(145deg, rgba(18,22,30,0.98), rgba(12,16,22,0.98))',
        border: '1px solid rgba(255,255,255,0.10)',
        boxShadow: '0 30px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)',
        overflow: 'hidden', display: 'flex', flexDirection: 'column',
        animation: 'scaleUp 0.28s cubic-bezier(0.16,1,0.3,1) forwards',
      }}>
        {/* Close button */}
        <button onClick={onClose} style={{
          position: 'absolute', top: 14, right: 14, zIndex: 20,
          width: 34, height: 34, borderRadius: '50%',
          background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
          border: '1px solid rgba(255,255,255,0.15)', color: '#fff',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background 0.2s',
        }}
          onMouseEnter={e => e.currentTarget.style.background='rgba(228,59,79,0.7)'}
          onMouseLeave={e => e.currentTarget.style.background='rgba(0,0,0,0.55)'}
        >
          <X size={16} />
        </button>

        <div style={{
          flex: 1, overflowY: 'auto', display: 'grid',
          gridTemplateColumns: isCombo ? 'minmax(0,1fr) minmax(0,1fr)' : '1fr',
        }}>

          {/* ── LEFT: Hero Image ── */}
          <div style={{ position: 'relative', minHeight: 320, background: '#070a0f', overflow: 'hidden' }}>
            <img
              src={mainSrc}
              alt={food.item_name || food.name}
              onError={() => setMainSrc('/assets/food/lunch/veg_meals.jpg')}
              onClick={() => setImgZoomed(z => !z)}
              style={{
                width: '100%', height: '100%', minHeight: 320, objectFit: 'cover',
                cursor: imgZoomed ? 'zoom-out' : 'zoom-in',
                transform: imgZoomed ? 'scale(1.35)' : 'scale(1)',
                transition: 'transform 0.45s cubic-bezier(0.25,0.46,0.45,0.94)',
              }}
            />
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to top, rgba(5,7,12,0.95) 0%, rgba(5,7,12,0.3) 50%, transparent 100%)',
              pointerEvents: 'none',
            }} />
            {savingsPct > 0 && (
              <div style={{
                position: 'absolute', top: 14, left: 14,
                background: 'linear-gradient(135deg,#e43b4f,#ff6b6b)',
                color: '#fff', fontSize: '0.72rem', fontWeight: 900,
                padding: '4px 10px', borderRadius: 999,
                boxShadow: '0 4px 12px rgba(228,59,79,0.5)',
              }}>{savingsPct}% OFF</div>
            )}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px 20px 18px' }}>
              {/* FSSAI diet row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <DietDot item={food} size={20} />
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: dInfo.color, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                  {dInfo.label}
                </span>
                {isCombo && (
                  <span style={{
                    marginLeft: 4, fontSize: '0.68rem', fontWeight: 700,
                    background: 'rgba(20,209,178,0.2)', color: 'var(--teal)',
                    border: '1px solid rgba(20,209,178,0.35)', padding: '2px 8px', borderRadius: 999,
                  }}>🍱 Combo</span>
                )}
              </div>
              <h2 style={{ margin: 0, fontSize: '1.55rem', fontWeight: 900, color: '#fff', lineHeight: 1.2, textShadow: '0 2px 12px rgba(0,0,0,0.6)', letterSpacing: '-0.3px' }}>
                {food.item_name || food.name}
              </h2>
              <div style={{ marginTop: 8 }}><Stars /></div>
            </div>
          </div>

          {/* ── RIGHT: Details ── */}
          <div style={{ padding: '24px 22px', display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto' }}>

            {/* Price */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
              padding: '14px 16px', background: 'rgba(20,209,178,0.06)',
              border: '1px solid rgba(20,209,178,0.15)', borderRadius: 12,
            }}>
              <span style={{ fontSize: '1.9rem', fontWeight: 900, color: 'var(--teal)', letterSpacing: '-1px' }}>₹{price}</span>
              {original && (
                <>
                  <span style={{ fontSize: '1.05rem', color: 'var(--text-3)', textDecoration: 'line-through' }}>₹{original}</span>
                  <span style={{ fontSize: '0.7rem', fontWeight: 800, background: 'linear-gradient(135deg,#e43b4f,#ff6b6b)', color: '#fff', padding: '3px 10px', borderRadius: 999 }}>Save ₹{savings}</span>
                </>
              )}
            </div>

            {/* Meta */}
            <div style={{ display: 'flex', gap: 10 }}>
              {[
                { icon: <Clock size={15} style={{ color: 'var(--teal)' }} />, label: 'Prep Time', value: `${food.prep_time_mins || 5} min` },
                { icon: <ChefHat size={15} style={{ color: '#a78bfa' }} />, label: 'Kitchen', value: 'SmartServe ✓' },
              ].map(m => (
                <div key={m.label} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10 }}>
                  {m.icon}
                  <div>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{m.label}</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-1)' }}>{m.value}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Diet callout */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
              background: `${dInfo.color}12`, border: `1px solid ${dInfo.color}35`, borderRadius: 10,
            }}>
              <DietDot item={food} size={22} />
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: dInfo.color, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{dInfo.label}</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-3)', marginTop: 1 }}>
                  {dietType === 'veg' ? 'Pure vegetarian — no meat, no egg' :
                   dietType === 'egg' ? 'Contains egg — suitable for eggitarians' :
                   'Contains meat — non-vegetarian dish'}
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>About this dish</div>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-2)', lineHeight: 1.65, margin: 0 }}>
                {food.description || food.desc || 'A premium mouth-watering selection prepared fresh in our smart kitchen with certified local ingredients.'}
              </p>
            </div>

            {/* Combo items */}
            {isCombo && (
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <Flame size={14} style={{ color: '#f59e0b' }} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Combo Includes ({loading ? '…' : constituents.length} items)
                  </span>
                </div>
                {loading ? (
                  <div style={{ padding: '12px 0', fontSize: '0.8rem', color: 'var(--text-3)' }}>Loading items…</div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 8 }}>
                    {constituents.map(c => <ComboItemCard key={c.id || c.item_name || c.name} c={c} />)}
                  </div>
                )}
              </div>
            )}

            {/* Action */}
            <div style={{ marginTop: 'auto', paddingTop: 6 }}>
              {qty === 0 ? (
                <button onClick={() => onAdd(food)} style={{
                  width: '100%', height: 48, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: 10, borderRadius: 12, cursor: 'pointer',
                  border: 'none', fontWeight: 800, fontSize: '0.95rem',
                  background: 'linear-gradient(135deg, #14D1B2, #0fa88e)',
                  color: '#0B1A18', boxShadow: '0 4px 20px rgba(20,209,178,0.35)',
                  transition: 'transform 0.18s, box-shadow 0.18s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 8px 28px rgba(20,209,178,0.5)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='0 4px 20px rgba(20,209,178,0.35)'; }}
                >
                  <ShoppingBag size={18} /> Add to Plate
                </button>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: 800, color: 'var(--teal)', background: 'rgba(20,209,178,0.08)', border: '1px solid rgba(20,209,178,0.25)', borderRadius: 8, padding: '6px 0' }}>
                    ✓ Added to your Plate
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => onUpdateQty(food.id, qty - 1)} style={{
                      flex: 1, height: 42, borderRadius: 10, cursor: 'pointer',
                      border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.06)',
                      color: 'var(--text-1)', fontWeight: 700, fontSize: '0.9rem',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      transition: 'background 0.15s',
                    }}
                      onMouseEnter={e => e.currentTarget.style.background='rgba(228,59,79,0.15)'}
                      onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.06)'}
                    >
                      <Minus size={14} /> Less
                    </button>
                    <div style={{
                      width: 52, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      borderRadius: 10, background: 'rgba(20,209,178,0.15)', border: '1px solid rgba(20,209,178,0.3)',
                      fontSize: '1.2rem', fontWeight: 900, color: 'var(--teal)',
                    }}>{qty}</div>
                    <button onClick={() => onUpdateQty(food.id, qty + 1)} style={{
                      flex: 1, height: 42, borderRadius: 10, cursor: 'pointer',
                      border: 'none', background: 'linear-gradient(135deg,#14D1B2,#0fa88e)',
                      color: '#0B1A18', fontWeight: 700, fontSize: '0.9rem',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    }}>
                      <Plus size={14} /> More
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
