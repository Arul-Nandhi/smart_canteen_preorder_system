import os
import django
from datetime import date, timedelta, time

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'smartserve_backend.settings')
django.setup()

from slots.models import Slot

def seed_slots():
    today = date.today()
    tomorrow = today + timedelta(days=1)
    
    dates_to_seed = [today, tomorrow]
    
    # Standard Corporate / College Break Times
    standard_slots = [
        {"start": time(10, 30), "end": time(11, 00), "max_orders": 30},  # Morning Break
        {"start": time(12, 30), "end": time(13, 30), "max_orders": 80},  # Lunch Break
        {"start": time(15, 30), "end": time(16, 00), "max_orders": 40},  # Evening Tea Break
        {"start": time(18, 00), "end": time(19, 00), "max_orders": 50},  # Dinner Prep / Hostels
    ]

    slots_created = 0
    for slot_date in dates_to_seed:
        for slot in standard_slots:
            obj, created = Slot.objects.get_or_create(
                slot_date=slot_date,
                start_time=slot['start'],
                end_time=slot['end'],
                defaults={'max_orders': slot['max_orders']}
            )
            if created:
                slots_created += 1

    print(f"✅ Successfully seeded {slots_created} Preorder Slots for {today} and {tomorrow}.")

if __name__ == '__main__':
    seed_slots()
