import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Tag, ShoppingBag, Clock, Flame, Leaf, Egg, Drumstick } from 'lucide-react';
import Navbar from '../components/Navbar';
import FoodDetailModal from '../components/FoodDetailModal';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';

/* ── Flash Sale countdown hook ── */
function useCountdown(targetMs) {
  const [left, setLeft] = useState(targetMs - Date.now());
  useEffect(() => {
    const t = setInterval(() => setLeft(targetMs - Date.now()), 1000);
    return () => clearInterval(t);
  }, [targetMs]);
  const total = Math.max(0, left);
  const h = Math.floor(total / 3600000);
  const m = Math.floor((total % 3600000) / 60000);
  const s = Math.floor((total % 60000) / 1000);
  return { h, m, s, expired: total === 0 };
}

/* ── Static deal data mapping 100% to seeded database menu items ── */
const FLASH_SALES = [
  {
    id: 'f1', name: 'Masala Dosa Combo',
    desc: 'Crispy Masala Dosa + Coconut Chutney + Filter Coffee',
    original: 70, offer: 55, tag: 'veg', image: '/assets/food/breakfast/masala_dosa.jpg',
    items: [
      { id: 1338, item_name: 'Masala Dosa',   category: 'breakfast', price: 40, is_veg: true },
      { id: 1291, item_name: 'Filter Coffee', category: 'breakfast', price: 15, is_veg: true },
    ],
  },
  {
    id: 'f2', name: 'Egg Biriyani Combo',
    desc: 'Egg Biriyani + Raita + Refreshing Lassi',
    original: 160, offer: 129, tag: 'egg', image: '/assets/food/lunch/egg_biriyani.jpg',
    items: [
      { id: 1434, item_name: 'Egg Biriyani', category: 'lunch',   price: 99, is_veg: false, food_type: 'egg' },
      { id: 1295, item_name: 'Lassi',        category: 'juices',  price: 30, is_veg: true },
    ],
  },
  {
    id: 'f3', name: 'Chicken Burger Fiesta',
    desc: 'Spicy Chicken Zinger Burger + Crispy French Fries + Pepsi',
    original: 149, offer: 119, tag: 'nonveg', image: '/assets/food/pizza&burger/spicy_chicken_zinger_burger.jpg',
    items: [
      { id: 1507, item_name: 'Spicy Chicken Zinger Burger', category: 'burgers',    price: 69, is_veg: false, food_type: 'non_veg' },
      { id: 1517, item_name: 'French Fries',                category: 'evening_snacks', price: 25, is_veg: true },
      { id: 1301, item_name: 'Pepsi',                       category: 'beverages',  price: 25, is_veg: true },
    ],
  },
];

/* ── New Pizza & Burger soft drink combos section ── */
const PIZZA_BURGER_COMBOS = [
  {
    id: 'pbc1', name: 'Margherita Pizza & Sprite Combo',
    desc: 'Classic Margherita Pizza + Ice-cold Sprite',
    original: 129, offer: 99, tag: 'veg', image: '/assets/food/pizza&burger/classic_margherita_pizza.jpg',
    items: [
      { id: 1493, item_name: 'Classic Margherita Pizza', category: 'pizza',     price: 79, is_veg: true },
      { id: 1304, item_name: 'Sprite',                   category: 'beverages', price: 20, is_veg: true },
    ],
  },
  {
    id: 'pbc2', name: 'Cheeseburger & Pepsi Combo',
    desc: 'Classic Cheeseburger + Chilled Pepsi',
    original: 119, offer: 95, tag: 'nonveg', image: '/assets/food/pizza&burger/classic_cheeseburger.jpg',
    items: [
      { id: 1492, item_name: 'Classic Cheeseburger', category: 'burgers',   price: 75, is_veg: false, food_type: 'non_veg' },
      { id: 1301, item_name: 'Pepsi',                category: 'beverages', price: 20, is_veg: true },
    ],
  },
  {
    id: 'pbc3', name: 'Zinger Burger & Coke Combo',
    desc: 'Spicy Chicken Zinger Burger + Ice-cold Coca-Cola',
    original: 119, offer: 95, tag: 'nonveg', image: '/assets/food/pizza&burger/spicy_chicken_zinger_burger.jpg',
    items: [
      { id: 1507, item_name: 'Spicy Chicken Zinger Burger', category: 'burgers',   price: 75, is_veg: false, food_type: 'non_veg' },
      { id: 1289, item_name: 'Coke',                        category: 'beverages', price: 20, is_veg: true },
    ],
  },
  {
    id: 'pbc4', name: 'Veggie Pizza & Mirinda Combo',
    desc: 'Farmhouse Veggie Pizza + Vibrant Mirinda Soda',
    original: 149, offer: 119, tag: 'veg', image: '/assets/food/pizza&burger/farmhouse_veggie_pizza.jpg',
    items: [
      { id: 1497, item_name: 'Farmhouse Veggie Pizza', category: 'pizza',     price: 99, is_veg: true },
      { id: 1299, item_name: 'Mirinda',                category: 'beverages', price: 20, is_veg: true },
    ],
  },
];

const CATEGORIES = [
  {
    id: 'veg', label: 'Veg Offers',
    color: '#0f8a65', bg: 'rgba(15,138,101,0.08)', border: 'rgba(15,138,101,0.25)',
    icon: Leaf,
    deals: [
      { id: 1347, name: 'Sambar Idli', desc: 'Delicious steamed idli steeped in spicy sambar', original: 35, offer: 25, image: '/assets/food/breakfast/sambar_idli.jpg' },
      { id: 1448, name: 'Veg Meals', desc: 'Traditional South Indian full lunch thali', original: 75, offer: 59, image: '/assets/food/lunch/veg_meals.jpg' },
      { id: 1398, name: 'Fruit Custard', desc: 'Chilled creamy custard topped with fresh fruits', original: 40, offer: 29, image: '/assets/food/dessert/fruit_custard.jpg' },
    ],
  },
  {
    id: 'egg', label: 'Egg Offers',
    color: '#d97706', bg: 'rgba(217,119,6,0.08)', border: 'rgba(217,119,6,0.25)',
    icon: Egg,
    deals: [
      { id: 1516, name: 'Egg Sandwich', desc: 'Golden-fried egg seasoned inside soft breads', original: 40, offer: 29, image: '/assets/food/snacks/egg_sandwich.jpg' },
      { id: 1435, name: 'Egg Fried Rice', desc: 'Wok-tossed delicious egg fried rice', original: 75, offer: 59, image: '/assets/food/lunch/egg_fried_rice.jpg' },
    ],
  },
  {
    id: 'nonveg', label: 'Non-Veg Offers',
    color: '#e43b4f', bg: 'rgba(228,59,79,0.08)', border: 'rgba(228,59,79,0.25)',
    icon: Drumstick,
    deals: [
      { id: 1512, name: 'Chicken Roll', desc: 'Juicy spiced chicken roll wrapped in thin bread', original: 40, offer: 29, image: '/assets/food/snacks/chicken_roll.jpg' },
      { id: 1440, name: 'Mutton Biriyani', desc: 'Premium slow-cooked dum mutton biriyani thali', original: 120, offer: 99, image: '/assets/food/lunch/mutton_biriyani.jpg' },
    ],
  },
];

const JUICE_COMBOS = [
  { id: 1410, name: 'Avocado Juice', desc: 'Rich and creamy fresh avocado shake', price: 29, original: 40, image: '/assets/food/juices/avocado_juice.jpg' },
  { id: 1419, name: 'Mixed Fruit Juice', desc: 'Vibrant punch of seasonal tropical fresh fruits', price: 29, original: 40, image: '/assets/food/juices/mixed_fruit_juice.jpg' },
  { id: 1418, name: 'Mango Juice', desc: 'Sweet, thick Alphonso mango nectar', price: 29, original: 40, image: '/assets/food/juices/mango_juice.jpg' },
  { id: 1416, name: 'Kiwi Juice', desc: 'Tart and refreshing zesty kiwi crush', price: 29, original: 40, image: '/assets/food/juices/kiwi_juice.jpg' },
];

const tagColor = { veg: '#0f8a65', egg: '#d97706', nonveg: '#e43b4f' };
const tagLabel = { veg: 'Veg', egg: 'Egg', nonveg: 'Non-Veg' };

/* ── Shared DiscountBadge ── */
function DiscountBadge({ original, offer }) {
  const pct = Math.round(((original - offer) / original) * 100);
  return (
    <span style={{
      background: 'linear-gradient(135deg, #e43b4f, #ff6b6b)',
      color: '#fff', fontSize: '0.68rem', fontWeight: 800,
      padding: '2px 8px', borderRadius: 999, letterSpacing: '0.04em',
    }}>
      {pct}% OFF
    </span>
  );
}

/* ── Flash sale card ── */
function FlashCard({ deal, endMs, onAdd, onCardClick }) {
  const { h, m, s, expired } = useCountdown(endMs);
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    deal.items.forEach(item => onAdd(item));
    setAdded(true);
    toast.success(`Combo added to Plate!`);
    setTimeout(() => setAdded(false), 2200);
  };

  return (
    <div style={{
      background: 'var(--surface)',
      border: `2px solid ${tagColor[deal.tag]}40`,
      borderRadius: 'var(--r-lg)',
      padding: '1.25rem',
      display: 'flex', flexDirection: 'column', gap: '0.85rem',
      position: 'relative', overflow: 'hidden',
      boxShadow: `0 4px 20px ${tagColor[deal.tag]}18`,
      transition: 'transform 0.22s, box-shadow 0.22s',
      cursor: 'pointer'
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 10px 30px ${tagColor[deal.tag]}28`; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = `0 4px 20px ${tagColor[deal.tag]}18`; }}
      onClick={() => onCardClick(deal)}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${tagColor[deal.tag]}, transparent)` }} />

      <div style={{ position: 'relative', width: '100%', height: '160px', borderRadius: 'var(--r-md)', overflow: 'hidden' }}>
        <img src={deal.image} alt={deal.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <DiscountBadge original={deal.original} offer={deal.offer} />
          <span style={{ fontSize: '0.7rem', color: tagColor[deal.tag], background: '#000000dd', backdropFilter: 'blur(4px)', padding: '2px 8px', borderRadius: 999, fontWeight: 700 }}>
            {tagLabel[deal.tag]}
          </span>
        </div>
      </div>

      <div>
        <p style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-1)', margin: 0 }}>{deal.name}</p>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>{deal.desc}</p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--teal)' }}>₹{deal.offer}</span>
        <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>₹{deal.original}</span>
      </div>

      {!expired ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          <Clock size={12} />
          Ends in&nbsp;
          <span style={{ fontWeight: 700, color: '#e43b4f', fontVariantNumeric: 'tabular-nums' }}>
            {String(h).padStart(2, '0')}:{String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
          </span>
        </div>
      ) : (
        <p style={{ fontSize: '0.8rem', color: '#e43b4f', margin: 0 }}>Deal expired</p>
      )}

      <button
        onClick={(e) => { e.stopPropagation(); handleAdd(); }}
        disabled={expired}
        className={`btn btn-sm ${added ? 'btn-primary' : 'btn-outline'}`}
        style={{ width: '100%', justifyContent: 'center', transition: 'all 0.2s', ...(expired && { opacity: 0.45, cursor: 'not-allowed' }) }}
      >
        <ShoppingBag size={14} />
        {added ? 'Added to Plate' : 'Add Combo to Plate'}
      </button>
    </div>
  );
}

/* ── Beverage/Juice/Drink card ── */
function DrinkCard({ item, onCardClick }) {
  const [added, setAdded] = useState(false);
  const { addItem } = useCart();
  const pct = Math.round(((item.original - item.price) / item.original) * 100);

  const handleAdd = () => {
    addItem({ id: item.id, item_name: item.name, price: item.price, is_veg: true });
    setAdded(true);
    toast.success(`${item.name} added!`);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div style={{
      background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: 'var(--r-md)',
      padding: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem',
      transition: 'transform 0.18s, box-shadow 0.18s', cursor: 'pointer'
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(20,209,178,0.12)'; e.currentTarget.style.borderColor = 'rgba(20,209,178,0.35)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; e.currentTarget.style.borderColor = 'var(--border)'; }}
      onClick={() => onCardClick(item)}
    >
      <div style={{ position: 'relative', width: '100%', height: '140px', borderRadius: 'var(--r-sm)', overflow: 'hidden', background: '#00000030' }}>
        <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
      </div>
      <p style={{ margin: 0, fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-1)' }}>{item.name}</p>
      <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', minHeight: '2.4rem', lineHeight: '1.2' }}>{item.desc}</p>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <span style={{ fontWeight: 700, color: 'var(--teal)', fontSize: '1rem' }}>₹{item.price}</span>
        <span style={{ textDecoration: 'line-through', fontSize: '0.8rem', color: 'var(--text-muted)' }}>₹{item.original}</span>
        <span style={{ background: 'linear-gradient(135deg,#14D1B2,#0fa88e)', color: '#0B0F14', fontSize: '0.65rem', fontWeight: 800, padding: '2px 7px', borderRadius: 999 }}>{pct}% OFF</span>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); handleAdd(); }}
        className={`btn btn-sm ${added ? 'btn-primary' : 'btn-outline'}`}
        style={{ width: '100%', justifyContent: 'center', marginTop: '0.25rem', transition: 'all 0.2s' }}
      >
        {added ? 'Added' : 'Add to Plate'}
      </button>
    </div>
  );
}

/* ── Category section ── */
function CategorySection({ cat, onCardClick }) {
  const [added, setAdded] = useState({});
  const { addItem } = useCart();

  const handleAdd = (deal) => {
    addItem({ id: deal.id, item_name: deal.name, price: deal.offer, is_veg: cat.id === 'veg' });
    setAdded(p => ({ ...p, [deal.id]: true }));
    toast.success(`${deal.name} added to Plate!`);
    setTimeout(() => setAdded(p => ({ ...p, [deal.id]: false })), 2000);
  };

  const Icon = cat.icon;
  return (
    <section>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1rem' }}>
        <div style={{ width: 34, height: 34, background: cat.bg, border: `1.5px solid ${cat.border}`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={17} color={cat.color} />
        </div>
        <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-1)' }}>{cat.label}</h2>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
        {cat.deals.map(deal => (
          <div key={deal.id} style={{
            background: 'var(--surface)', border: `1.5px solid ${cat.border}`,
            borderRadius: 'var(--r-md)', padding: '1.1rem',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem',
            transition: 'transform 0.18s, box-shadow 0.18s', cursor: 'pointer'
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 6px 20px ${cat.color}18`; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
            onClick={() => onCardClick(deal)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flex: 1 }}>
              <img src={deal.image} alt={deal.name} style={{ width: '70px', height: '70px', objectFit: 'cover', borderRadius: 'var(--r-sm)', flexShrink: 0 }} />
              <div>
                <p style={{ margin: 0, fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-1)' }}>{deal.name}</p>
                <p style={{ margin: '0.2rem 0 0.4rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>{deal.desc}</p>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, color: cat.color, fontSize: '0.95rem' }}>₹{deal.offer}</span>
                  <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)', fontSize: '0.8rem' }}>₹{deal.original}</span>
                  <DiscountBadge original={deal.original} offer={deal.offer} />
                </div>
              </div>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); handleAdd(deal); }}
              className={`btn btn-sm ${added[deal.id] ? 'btn-primary' : 'btn-outline'}`}
              style={{ flexShrink: 0, transition: 'all 0.2s' }}
            >
              {added[deal.id] ? '✓' : '+'}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── Main Offers page ── */
export default function Offers() {
  const navigate = useNavigate();
  const { addItem, cart, updateQty } = useCart();
  const [flashEnd] = useState(() => Date.now() + 6 * 3600 * 1000);
  const [selectedCombo, setSelectedCombo] = useState(null);

  const [flashSales, setFlashSales] = useState(() => {
    const saved = localStorage.getItem('liveOffers');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.filter(item => item.id && item.id.startsWith('f'));
    }
    return FLASH_SALES;
  });

  const [pizzaBurgerCombos, setPizzaBurgerCombos] = useState(() => {
    const saved = localStorage.getItem('liveOffers');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.filter(item => item.id && item.id.startsWith('pbc'));
    }
    return PIZZA_BURGER_COMBOS;
  });

  const [categories, setCategories] = useState(() => {
    const saved = localStorage.getItem('catOffers');
    if (saved) {
      const parsed = JSON.parse(saved);
      return CATEGORIES.map(cat => {
        const matchedDeals = parsed.filter(deal => {
          const tagLower = deal.tag ? deal.tag.toLowerCase() : '';
          return tagLower === cat.id || tagLower.replace('-', '') === cat.id;
        });
        return {
          ...cat,
          deals: matchedDeals.map((deal, idx) => ({
            id: deal.id || `${cat.id}-deal-${idx}`,
            name: deal.name,
            desc: deal.desc || deal.description || '',
            original: deal.original,
            offer: deal.offer,
            image: deal.image,
            items: deal.items || [{ item_name: deal.name, price: deal.offer, category: cat.id, is_veg: cat.id === 'veg' }]
          }))
        };
      });
    }
    return CATEGORIES;
  });

  const getQty = (id) => cart.find(i => i.id === id)?.qty || 0;

  return (
    <>
      <Navbar />

      {/* Detail / Zoom Modal */}
      {selectedCombo && (
        <FoodDetailModal
          food={selectedCombo}
          qty={getQty(selectedCombo.id)}
          onAdd={(item) => {
            if (item.items) {
              item.items.forEach(it => addItem(it));
            } else {
              addItem(item);
            }
            toast.success(`Combo added to Plate!`);
          }}
          onUpdateQty={updateQty}
          onClose={() => setSelectedCombo(null)}
        />
      )}

      <div className="page-wrapper">

        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '0.4rem' }}>
            <Flame size={22} color="#e43b4f" />
            <h1 className="page-title" style={{ margin: 0 }}>Today's Offers</h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: 0 }}>
            Exclusive deals and combos — updated daily. Grab them before they expire!
          </p>
        </div>

        {/* Flash Sales */}
        <section style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, background: 'rgba(228,59,79,0.12)', borderRadius: 9 }}>
              <Zap size={16} color="#e43b4f" />
            </div>
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-1)' }}>Flash Sales</h2>
            <span style={{ marginLeft: 'auto', fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Clock size={12} /> Limited time only
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {flashSales.map(deal => (
              <FlashCard key={deal.id} deal={deal} endMs={flashEnd} onAdd={item => addItem(item)} onCardClick={setSelectedCombo} />
            ))}
          </div>
        </section>

        <div style={{ borderTop: '1px solid var(--border)', margin: '0 0 2.5rem' }} />

        {/* Pizza & Burger soft drink combos section */}
        <section style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, background: 'rgba(20,209,178,0.12)', borderRadius: 9 }}>
              <Zap size={16} color="var(--teal)" />
            </div>
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-1)' }}>Pizza, Burger &amp; Soft Drink Combo Offers</h2>
            <span style={{ marginLeft: 'auto', fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Clock size={12} /> Fresh soft drinks served only in combos
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {pizzaBurgerCombos.map(deal => (
              <FlashCard key={deal.id} deal={deal} endMs={flashEnd} onAdd={item => addItem(item)} onCardClick={setSelectedCombo} />
            ))}
          </div>
        </section>

        <div style={{ borderTop: '1px solid var(--border)', margin: '0 0 2.5rem' }} />

        {/* Juice Combos */}
        <section style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem' }}>
            <div style={{ width: 32, height: 32, background: 'rgba(20,209,178,0.1)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Tag size={16} color="var(--teal)" />
            </div>
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-1)' }}>Juice &amp; Beverage Combos</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
            {JUICE_COMBOS.map(item => <DrinkCard key={item.id} item={item} onCardClick={setSelectedCombo} />)}
          </div>
        </section>

        <div style={{ borderTop: '1px solid var(--border)', margin: '0 0 2.5rem' }} />

        {/* Category Offers */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {categories.map(cat => <CategorySection key={cat.id} cat={cat} onCardClick={setSelectedCombo} />)}
        </div>

        {/* CTA */}
        <div style={{ marginTop: '3rem', textAlign: 'center', padding: '2rem', background: 'var(--surface)', borderRadius: 'var(--r-xl)', border: '1px solid var(--border)' }}>
          <p style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-1)', margin: '0 0 0.5rem' }}>Ready to order?</p>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>Browse the full menu to discover more fresh items.</p>
          <button className="btn btn-primary" onClick={() => navigate('/menu')}>
            <ShoppingBag size={16} /> Browse Full Menu
          </button>
        </div>

      </div>
    </>
  );
}

