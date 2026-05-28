/**
 * Central image resolver for the Smart Canteen Portal.
 * Maps item names → correct local asset paths under /assets/food/
 */

const FOLDER_MAP = {
  roti: 'naan&roti',
  evening_snacks: 'snacks',
  desserts: 'dessert',
  pizza: 'pizza&burger',
  burgers: 'pizza&burger',
  beverages: 'refreshing_drinks',
};

/* Soft drinks that live in refreshing_drinks/ with .png extension */
const SOFT_DRINKS = new Set([
  'sprite', 'pepsi', 'mirinda', 'cocola', 'coca_cola', '7up',
  'seven_up', 'campa_energy', 'coke',
]);

/* Explicit name → path overrides for items whose safe-name doesn't match the file */
const EXPLICIT = {
  'filter coffee':        '/assets/food/juices/apple_juice.jpg',
  'filter_coffee':        '/assets/food/juices/apple_juice.jpg',
  'lassi':                '/assets/food/juices/mango_juice.jpg',
  'coke':                 '/assets/food/refreshing_drinks/cocola.png',
  'coca_cola':            '/assets/food/refreshing_drinks/cocola.png',
  'coca-cola':            '/assets/food/refreshing_drinks/cocola.png',
  'seven_up':             '/assets/food/refreshing_drinks/7up.png',
  '7_up':                 '/assets/food/refreshing_drinks/7up.png',
};

/**
 * Resolve a safe filename from an arbitrary display name.
 */
const safe = (name = '') =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

/**
 * Primary resolver: given a category + item name, return a URL.
 * Falls back gracefully through multiple strategies.
 */
export function getItemImage(category, name = '') {
  const s = safe(name);

  // Explicit override first
  if (EXPLICIT[name.toLowerCase()] || EXPLICIT[s]) {
    return EXPLICIT[name.toLowerCase()] || EXPLICIT[s];
  }

  // Soft drinks
  if (SOFT_DRINKS.has(s)) {
    const file = s === 'coke' || s === 'coca_cola' ? 'cocola'
               : s === 'seven_up' || s === '7_up'  ? '7up'
               : s;
    return `/assets/food/refreshing_drinks/${file}.png`;
  }

  const folder = FOLDER_MAP[category] || category || 'lunch';
  return `/assets/food/${folder}/${s}.jpg`;
}

/**
 * Resolve image for a menu item object — uses stored image if it's a real
 * upload path, otherwise falls back to local asset.
 */
export function resolveImage(item) {
  if (!item) return '';
  const name = item.item_name || item.name || '';
  const cat  = item.category || '';

  let imgUrl = item.image;
  if (imgUrl) {
    // If it's a media URL wrapping an asset path, strip the media prefix
    if (imgUrl.includes('/assets/')) {
      const idx = imgUrl.indexOf('/assets/');
      return imgUrl.substring(idx);
    }
    if (imgUrl.startsWith('/assets/')) {
      return imgUrl;
    }
    return imgUrl;
  }

  // Otherwise compute from name + category
  return getItemImage(cat, name);
}
