import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'smartserve_backend.settings')
django.setup()

from menu.models import MenuItem
from seed_exhaustive import get_display_name_and_category

def update_db_images():
    base_dir = r"frontend/public/assets/food"
    if not os.path.exists(base_dir):
        print(f"Error: {base_dir} directory not found.")
        return
        
    folders = [f for f in os.listdir(base_dir) if os.path.isdir(os.path.join(base_dir, f))]
    updated = 0
    not_found = 0
    
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
                    
            image_path = f"/assets/food/{folder}/{file}"
            
            # Find matching MenuItem in the database
            items = MenuItem.objects.filter(item_name__iexact=display_name, category=category)
            if items.exists():
                for item in items:
                    item.image = image_path
                    item.save()
                    updated += 1
            else:
                # Try just by name
                items_by_name = MenuItem.objects.filter(item_name__iexact=display_name)
                if items_by_name.exists():
                    for item in items_by_name:
                        item.image = image_path
                        item.save()
                        updated += 1
                else:
                    not_found += 1
                    
    print(f"[OK] Successfully updated {updated} menu items with local asset image paths.")
    if not_found > 0:
        print(f"[INFO] {not_found} asset files did not match any database menu items.")

if __name__ == '__main__':
    update_db_images()
