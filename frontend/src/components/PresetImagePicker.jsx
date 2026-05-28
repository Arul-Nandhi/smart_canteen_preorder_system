import { useState } from 'react';
import { X, Search, Image as ImageIcon } from 'lucide-react';

const CATEGORY_LABELS = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  snacks: 'Snacks',
  beverages: 'Refreshing Drinks',
  desserts: 'Desserts',
  chinese: 'Chinese',
  parotta: 'Parotta',
  naan_roti: 'Naan & Roti',
  juices: 'Juices',
  chaat: 'Chaat',
  pizza: 'Pizza',
  burgers: 'Burgers',
  bites: 'Bites'
};

const FOLDER_MAP = {
  breakfast: 'breakfast',
  lunch: 'lunch',
  snacks: 'snacks',
  beverages: 'refreshing_drinks',
  desserts: 'dessert',
  chinese: 'chinese',
  parotta: 'parotta',
  naan_roti: 'naan&roti',
  bites: 'bites',
  juices: 'juices',
  chaat: 'chaat',
  pizza: 'pizza&burger',
  burgers: 'pizza&burger'
};

// Full list of images matching what's physically in public/assets/food/
const PRESETS = {
  breakfast: [
    'bread_omlet', 'idly', 'masala_dosa', 'onion_oothappam', 'plain_dosa',
    'poori', 'pongal', 'rawa_dosa', 'sambar_vada', 'semiya_upma', 'upma', 'vada'
  ],
  lunch: [
    'bisibelabath', 'chicken_biriyani', 'chicken_fried_rice', 'coconut_rice',
    'curd_rice', 'egg_biriyani', 'egg_fried_rice', 'full_meals', 'lemon_rice',
    'mini_meals', 'mushroom_fried_rice', 'mutton_biriyani', 'non_veg_meals',
    'paneer_fried_rice', 'sambar_rice', 'south_indian_meals', 'tamarind_rice',
    'tomato_rice', 'veg_fried_rice', 'veg_meals'
  ],
  snacks: [
    'cheese_sandwich', 'chicken_nuggets', 'chicken_puff', 'chicken_roll',
    'corn_cheese_balls', 'cutlet', 'egg_puff', 'egg_sandwich', 'french_fries',
    'fried_momos', 'grilled_sandwich', 'momos', 'paneer_roll', 'peri_peri_fries',
    'samosa', 'spring_roll', 'veg_nuggets', 'veg_puff', 'veg_roll', 'veg_sandwich'
  ],
  beverages: [
    '7up', 'campa_energy', 'cocola', 'mirinda', 'pepsi', 'sprite'
  ],
  desserts: [
    'black_forest_cake', 'brownie', 'brownie_icecream', 'carrot_halwa', 'cheese_cake',
    'chocolate_icecream', 'choco_lava_cake', 'donut', 'falooda', 'fruit_custard',
    'gajar_halwa', 'gulab_jamun', 'icecream', 'kesari', 'muffin', 'payasam',
    'rasamalai', 'rasgulla', 'semiya_payasam', 'vanilla_icecream'
  ],
  chinese: [
    'chilli_chicken', 'chilli_paneer', 'dragon_chicken', 'egg_noodles', 'fried_momos',
    'fried_rice', 'gobi_manchurian', 'hakka_noodles', 'hot_garlic_noodles', 'momos',
    'schezwan_fried_rice', 'schezwan_noodles', 'singapore_noodles', 'spring_roll',
    'triple_schezwan_rice', 'veg_manchurian', 'veg_noodles'
  ],
  parotta: [
    'aloo_parotta', 'bun_parotta', 'butter_parotta', 'cheese_parotta', 'chicken_kothu_parotta',
    'chilli_parotta', 'coin_parotta', 'egg_kothu_parotta', 'gobi_parotta', 'kerala_parotta',
    'kothu_parotta', 'mini_parotta', 'paneer_parotta', 'parotta_combo', 'pepper_parotta',
    'plain_parotta', 'salna_parotta', 'stuffed_parotta', 'veechu_parotta', 'veg_kothu_parotta'
  ],
  naan_roti: [
    'aloo_kulcha', 'butter_naan', 'butter_roti', 'chapati', 'cheese_naan',
    'garlic_naan', 'kulcha', 'laccha_paratha', 'malabar_roti', 'naan_combo',
    'paneer_kulcha', 'phulka', 'plain_naan', 'pudina_paratha', 'roomali_combo',
    'roti_meals', 'rumali_roti', 'stuffed_naan', 'tandoori_roti', 'wheat_roti'
  ],
  juices: [
    'apple_juice', 'avocado_juice', 'banana_juice', 'beetroot_juice', 'carrot_juice',
    'dragon_fruit_juice', 'grape_juice', 'kiwi_juice', 'lychee_juice', 'mango_juice',
    'mixed_fruit_juice', 'mosambi_juice', 'muskmelon_juice', 'orange_juice', 'papaya_milk',
    'pineapple_juice', 'pomegranate_juice', 'strawberry_juice', 'tender_coconut', 'watermelon_juice'
  ],
  pizza: [
    'bbq_chicken_pizza', 'classic_margherita_pizza', 'farmhouse_veggie_pizza',
    'four_cheese_pizza', 'meat_lovers_pizza', 'mediterranean_pizza', 'paneer_makhani_pizza',
    'paneer_supreme_pizza', 'pepperoni_feast_pizza', 'spicy_buffalo_pizza', 'tandoori_chicken_pizza'
  ],
  burgers: [
    'bacon_and_egg_burger', 'black_bean_burger', 'classic_cheeseburger', 'crispy_aloo_tikki_burger',
    'double_smash_beef_burger', 'falafel_burger', 'lamb_kofta_burger', 'mushroom_swiss_burger',
    'spicy_chicken_zinger_burger'
  ]
};

export default function PresetImagePicker({ currentCategory, onSelect, onClose }) {
  const [selectedCat, setSelectedCat] = useState(FOLDER_MAP[currentCategory] ? currentCategory : 'breakfast');
  const [search, setSearch] = useState('');

  const getImagePath = (cat, name) => {
    const folder = FOLDER_MAP[cat] || cat;
    const ext = cat === 'beverages' ? 'png' : 'jpg';
    return `/assets/food/${folder}/${name}.${ext}`;
  };

  const categories = Object.keys(PRESETS);
  const items = PRESETS[selectedCat] || [];
  const filtered = items.filter(name =>
    name.toLowerCase().replace(/_/g, ' ').includes(search.toLowerCase())
  );

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: 1100, padding: 20
    }}>
      <div className="admin-card" style={{
        width: '100%', maxWidth: 740, maxHeight: '85vh',
        display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden'
      }}>
        
        {/* Header */}
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid var(--border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-1)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <ImageIcon size={18} className="text-teal" style={{ color: 'var(--teal)' }} />
            Select Preset Canteen Image
          </span>
          <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={onClose} style={{ padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        {/* Category Pills & Search */}
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Pills */}
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
            {categories.map(cat => (
              <button
                key={cat}
                type="button"
                className={`admin-chip ${selectedCat === cat ? 'active' : ''}`}
                onClick={() => { setSelectedCat(cat); setSearch(''); }}
                style={{ flexShrink: 0, fontSize: '0.72rem', padding: '4px 10px' }}
              >
                {CATEGORY_LABELS[cat] || cat}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="admin-input-wrap">
            <Search size={14} className="admin-input-icon" />
            <input
              className="admin-input"
              placeholder="Search preset food name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: '2.2rem' }}
            />
          </div>
        </div>

        {/* Images Grid */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-3)' }}>
              No images match "{search}" in this category
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
              gap: 12
            }}>
              {filtered.map(name => {
                const path = getImagePath(selectedCat, name);
                const display = name.replace(/_/g, ' ');
                return (
                  <div
                    key={name}
                    onClick={() => onSelect(path)}
                    style={{
                      borderRadius: 10, overflow: 'hidden', background: 'var(--surface-2)',
                      border: '1px solid var(--border)', cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.borderColor = 'var(--teal)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.borderColor = 'var(--border)';
                    }}
                  >
                    {/* Img preview */}
                    <div style={{ height: 90, background: '#000', overflow: 'hidden' }}>
                      <img
                        src={path}
                        alt={display}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                    {/* Label */}
                    <div style={{
                      padding: 8, fontSize: '0.72rem', fontWeight: 600,
                      color: 'var(--text-2)', textTransform: 'capitalize',
                      textAlign: 'center', whiteSpace: 'nowrap',
                      overflow: 'hidden', textOverflow: 'ellipsis'
                    }}>
                      {display}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', background: 'var(--surface-2)' }}>
          <button type="button" className="admin-btn admin-btn-secondary" onClick={onClose}>
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
}
