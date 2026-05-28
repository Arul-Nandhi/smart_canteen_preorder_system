import shutil
import os

beverages_dir = r"frontend/public/assets/food/beverages"
if os.path.exists(beverages_dir):
    shutil.rmtree(beverages_dir)
    print("Deleted old beverages directory successfully!")
else:
    print("Old beverages directory not found.")
