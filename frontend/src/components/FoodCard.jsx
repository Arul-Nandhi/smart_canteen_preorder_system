import { Edit2, Trash2, Package } from 'lucide-react';

const CATEGORIES = {
  breakfast: '🌅',
  lunch: '🍽️',
  snacks: '🍪',
  beverages: '🥤',
  desserts: '🍰',
  chinese: '🥢',
  parotta: '🔥',
  naan_roti: '🫓',
  bites: '🍡',
};

export default function FoodCard({ food, onEdit, onDelete, onToggle }) {
  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 group">
      {/* Image Section */}
      <div className="relative h-48 bg-surface-2 overflow-hidden">
        {food.image ? (
          <img
            src={food.image}
            alt={food.item_name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package size={48} className="text-text-3" />
          </div>
        )}
        
        {/* Category Badge */}
        <div className="absolute top-2 left-2 px-2 py-1 rounded-lg bg-black/50 backdrop-blur text-white text-xs font-semibold">
          {CATEGORIES[food.category] || '🍽️'} {food.category?.toUpperCase()}
        </div>

        {/* Availability Badge */}
        <div className={`absolute top-2 right-2 px-3 py-1 rounded-full text-xs font-semibold ${
          food.availability
            ? 'bg-green-500/20 text-green-400'
            : 'bg-red-500/20 text-red-400'
        }`}>
          {food.availability ? '✓ Available' : '✗ Unavailable'}
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4">
        <div className="mb-3">
          <h3 className="text-lg font-bold text-text-1 mb-1">{food.item_name}</h3>
          <p className="text-sm text-text-3 line-clamp-2">{food.description}</p>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4 py-3 border-t border-b border-border">
          <div>
            <p className="text-xs text-text-3">Price</p>
            <p className="text-lg font-bold text-lime-main">₹{food.price}</p>
          </div>
          <div>
            <p className="text-xs text-text-3">Prep Time</p>
            <p className="text-lg font-bold text-text-1">{food.prep_time_mins}m</p>
          </div>
        </div>

        {/* Veg/Non-veg Indicator */}
        <div className="mb-4 flex items-center gap-2">
          <div className={`w-4 h-4 rounded border-2 ${
            food.is_veg
              ? 'bg-green-500/20 border-green-500'
              : 'bg-red-500/20 border-red-500'
          }`} />
          <span className="text-sm text-text-2">
            {food.is_veg ? '🌱 Vegetarian' : '🍗 Non-Vegetarian'}
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => onEdit?.(food)}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition"
            style={{ background: 'rgba(56,189,248,0.12)', color: '#38bdf8' }}
          >
            <Edit2 size={16} />
            Edit
          </button>
          <button
            onClick={() => onToggle?.(food)}
            className="flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition"
            style={{
              background: food.availability ? 'rgba(239,68,68,0.12)' : 'rgba(34,197,94,0.12)',
              color: food.availability ? '#ef4444' : '#22c55e'
            }}
          >
            {food.availability ? 'Hide' : 'Show'}
          </button>
          <button
            onClick={() => onDelete?.(food.id)}
            className="px-3 py-2 rounded-lg text-sm font-semibold transition"
            style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
