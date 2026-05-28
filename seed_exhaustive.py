import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'smartserve_backend.settings')
django.setup()

from menu.models import MenuItem

def get_display_name_and_category(folder, filename):
    base = filename.rsplit('.', 1)[0]
    
    # Custom corrections for typos in filenames
    if base == "chocolate_milkshsake":
        base = "chocolate_milkshake"
    elif base == "chicken_lollipo":
        base = "chicken_lollipop"
    elif base == "mini_meels":
        base = "mini_meals"
    elif base == "papdi_chat":
        base = "papdi_chaat"
    elif base == "avacado_juice":
        base = "avocado_juice"
        
    words = base.split('_')
    
    # Title-case words nicely
    title_words = []
    for w in words:
        if w in ['and', 'with', 'or', 'for', 'a', 'an', 'the']:
            title_words.append(w)
        else:
            title_words.append(w.capitalize())
    display_name = " ".join(title_words)
    # Capitalize the first word always
    if display_name:
        display_name = display_name[0].upper() + display_name[1:]
        
    # Map to DB categories
    category_map = {
        'beverages': 'beverages',
        'bites': 'bites',
        'breakfast': 'breakfast',
        'chaat': 'chaat',
        'chinese': 'chinese',
        'dessert': 'desserts',
        'juices': 'juices',
        'lunch': 'lunch',
        'naan&roti': 'roti',
        'parotta': 'parotta',
        'snacks': 'evening_snacks',
        'refreshing_drinks': 'beverages',
    }
    
    if folder == 'pizza&burger':
        is_burger = any(k in base for k in ['burger', 'cheeseburger', 'tikki', 'beef', 'zinger', 'swiss', 'kofta'])
        if base == 'bacon_and_egg':
            is_burger = True
            
        if is_burger:
            category = 'burgers'
            if not display_name.lower().endswith('burger') and not display_name.lower().endswith('cheeseburger'):
                display_name += ' Burger'
        else:
            category = 'pizza'
            if not display_name.lower().endswith('pizza'):
                display_name += ' Pizza'
    else:
        category = category_map.get(folder, folder)
        
    return display_name, category

def check_is_veg(display_name):
    dn_lower = display_name.lower()
    non_veg_keywords = [
        'chicken', 'egg', 'mutton', 'beef', 'lamb', 'bacon', 
        'pepperoni', 'wings', 'strips', 'tenders', 'lollipop', 'zinger', 
        'non veg', 'non-veg', 'fish', 'prawn', 'shrimp', 'crab', 'buffalo'
    ]
    
    if 'non veg' in dn_lower or 'non-veg' in dn_lower:
        return False
    if 'veg' in dn_lower:
        return True
        
    for kw in non_veg_keywords:
        if kw in dn_lower:
            return False
            
    return True

def get_pricing_and_prep_time(category, name):
    name_lower = name.lower()
    
    # Defaults
    price = 45.00
    prep_time = 10
    
    if category in ['beverages', 'juices']:
        prep_time = 5
        if 'tea' in name_lower or 'coffee' in name_lower:
            price = 20.00
        elif any(k in name_lower for k in ['shake', 'lassi', 'milkshake', 'mojito', 'juice', 'coconut']):
            price = 40.00
        else:
            price = 30.00
            
    elif category in ['breakfast', 'chaat']:
        prep_time = 8 if category == 'chaat' else 10
        if any(k in name_lower for k in ['combo', 'mysore', 'masala']):
            price = 50.00
        elif any(k in name_lower for k in ['idli', 'vada', 'pongal', 'upma', 'dosa', 'appam', 'puri', 'pav']):
            price = 35.00
        else:
            price = 30.00
            
    elif category == 'lunch':
        prep_time = 12
        if 'biriyani' in name_lower or 'biryani' in name_lower:
            price = 120.00 if any(k in name_lower for k in ['chicken', 'mutton', 'egg']) else 80.00
        elif 'meals' in name_lower or 'meels' in name_lower:
            price = 90.00 if 'non' in name_lower else 75.00
        elif any(k in name_lower for k in ['fried rice', 'pulao', 'noodles']):
            price = 75.00
        else:
            price = 60.00
            
    elif category in ['roti', 'parotta']:
        prep_time = 10
        if any(k in name_lower for k in ['combo', 'meals', 'kothu']):
            price = 80.00 if any(k in name_lower for k in ['chicken', 'egg']) else 60.00
        elif any(k in name_lower for k in ['naan', 'roti', 'parotta', 'kulcha', 'chapati', 'phulka']):
            price = 35.00 if any(k in name_lower for k in ['cheese', 'garlic', 'stuffed', 'paneer', 'aloo', 'gobi']) else 25.00
        else:
            price = 30.00
            
    elif category == 'pizza':
        prep_time = 12
        if 'margherita' in name_lower:
            price = 99.00
        elif any(k in name_lower for k in ['chicken', 'meat', 'pepperoni', 'bbq']):
            price = 149.00
        else:
            price = 119.00
            
    elif category == 'burgers':
        prep_time = 10
        if any(k in name_lower for k in ['cheese', 'zinger', 'beef', 'chicken', 'lamb', 'smash']):
            price = 89.00
        elif any(k in name_lower for k in ['aloo', 'veg', 'falafel', 'bean']):
            price = 59.00
        else:
            price = 69.00
            
    elif category == 'chinese':
        prep_time = 12
        if any(k in name_lower for k in ['lollipop', 'manchurian', 'chilli']):
            price = 80.00
        elif any(k in name_lower for k in ['noodles', 'rice']):
            price = 70.00
        else:
            price = 65.00
            
    elif category == 'desserts':
        prep_time = 6
        if any(k in name_lower for k in ['cake', 'brownie', 'lava', 'falooda']):
            price = 60.00
        elif any(k in name_lower for k in ['halwa', 'jamun', 'rasmalai', 'payasam']):
            price = 35.00
        else:
            price = 40.00
            
    elif category == 'bites':
        prep_time = 8
        if any(k in name_lower for k in ['wings', 'chicken', 'strips', 'tenders', 'popcorn']):
            price = 90.00
        elif any(k in name_lower for k in ['fries', 'wedges', 'onion', 'bread', 'nachos']):
            price = 45.00
        else:
            price = 50.00
            
    elif category == 'evening_snacks':
        prep_time = 8
        if any(k in name_lower for k in ['roll', 'sandwich', 'puff', 'nuggets', 'momos']):
            price = 40.00
        else:
            price = 30.00
            
    return price, prep_time

def seed_menu_items():
    print("Clearing existing menu items...")
    MenuItem.objects.all().delete()
    
    base_dir = r"frontend/public/assets/food"
    if not os.path.exists(base_dir):
        print(f"Error: {base_dir} directory not found.")
        return
        
    created = 0
    folders = [f for f in os.listdir(base_dir) if os.path.isdir(os.path.join(base_dir, f))]
    
    for folder in folders:
        folder_path = os.path.join(base_dir, folder)
        files = [f for f in os.listdir(folder_path) if f.endswith('.jpg') or f.endswith('.png')]
        
        for file in files:
            display_name, category = get_display_name_and_category(folder, file)
            
            if category == 'beverages':
                safe_name = file.rsplit('.', 1)[0].lower()
                if safe_name in ['coke', 'cocola', 'coca_cola']:
                    display_name = 'Cocola'
                elif safe_name in ['seven_up', '7up']:
                    display_name = '7Up'
                elif safe_name == 'mirinda':
                    display_name = 'Mirinda'
                elif safe_name == 'pepsi':
                    display_name = 'Pepsi'
                elif safe_name == 'sprite':
                    display_name = 'Sprite'
                elif safe_name == 'campa_energy':
                    display_name = 'Campa Energy'
                else:
                    continue  # Only keep the six specified soft drinks
                    
            is_veg = check_is_veg(display_name)
            price, prep_time = get_pricing_and_prep_time(category, display_name)
            description = f"Delicious {display_name} prepared fresh in our canteen."
            
            MenuItem.objects.create(
                item_name=display_name,
                category=category,
                price=price,
                is_veg=is_veg,
                description=description,
                prep_time_mins=prep_time,
                availability=True,
                image=f"/assets/food/{folder}/{file}"
            )
            created += 1
            
    print(f"[OK] Successfully seeded {created} menu items from assets.")
    seed_combos()

def seed_combos():
    print("Seeding combo menu items...")
    combos_data = [
        {
            'name': 'Masala Dosa Combo',
            'price': 55.00,
            'is_veg': True,
            'description': 'Crispy Masala Dosa + Coconut Chutney + Apple Juice',
            'image': '/assets/food/breakfast/masala_dosa.jpg',
            'constituents': ['Masala Dosa', 'Apple Juice']
        },
        {
            'name': 'Egg Biriyani Combo',
            'price': 129.00,
            'is_veg': False,
            'description': 'Egg Biriyani + Raita + Refreshing Mango Juice',
            'image': '/assets/food/lunch/egg_biriyani.jpg',
            'constituents': ['Egg Biriyani', 'Mango Juice']
        },
        {
            'name': 'Chicken Burger Fiesta',
            'price': 119.00,
            'is_veg': False,
            'description': 'Spicy Chicken Zinger Burger + Crispy French Fries + Pepsi',
            'image': '/assets/food/pizza&burger/spicy_chicken_zinger_burger.jpg',
            'constituents': ['Spicy Chicken Zinger Burger', 'French Fries', 'Pepsi']
        },
        {
            'name': 'Margherita Pizza & Sprite Combo',
            'price': 99.00,
            'is_veg': True,
            'description': 'Classic Margherita Pizza + Ice-cold Sprite',
            'image': '/assets/food/pizza&burger/classic_margherita_pizza.jpg',
            'constituents': ['Classic Margherita Pizza', 'Sprite']
        },
        {
            'name': 'Cheeseburger & Pepsi Combo',
            'price': 95.00,
            'is_veg': False,
            'description': 'Classic Cheeseburger + Chilled Pepsi',
            'image': '/assets/food/pizza&burger/classic_cheeseburger.jpg',
            'constituents': ['Classic Cheeseburger', 'Pepsi']
        },
        {
            'name': 'Zinger Burger & Coke Combo',
            'price': 95.00,
            'is_veg': False,
            'description': 'Spicy Chicken Zinger Burger + Ice-cold Coca-Cola',
            'image': '/assets/food/pizza&burger/spicy_chicken_zinger_burger.jpg',
            'constituents': ['Spicy Chicken Zinger Burger', 'Cocola']
        },
        {
            'name': 'Veggie Pizza & Mirinda Combo',
            'price': 119.00,
            'is_veg': True,
            'description': 'Farmhouse Veggie Pizza + Vibrant Mirinda Soda',
            'image': '/assets/food/pizza&burger/farmhouse_veggie_pizza.jpg',
            'constituents': ['Farmhouse Veggie Pizza', 'Mirinda']
        }
    ]

    for combo in combos_data:
        # Get constituent ids
        ids = []
        for name in combo['constituents']:
            item = MenuItem.objects.filter(item_name=name).first()
            if item:
                ids.append(item.id)
            else:
                print(f"Warning: constituent '{name}' not found for combo '{combo['name']}'")

        if ids:
            MenuItem.objects.get_or_create(
                item_name=combo['name'],
                category='combo',
                defaults={
                    'price': combo['price'],
                    'is_veg': combo['is_veg'],
                    'description': combo['description'],
                    'prep_time_mins': 12,
                    'availability': True,
                    'image': combo['image'],
                    'combo_items': ids
                }
            )
            print(f"   Created combo: {combo['name']} with {len(ids)} items.")

if __name__ == '__main__':
    seed_menu_items()
