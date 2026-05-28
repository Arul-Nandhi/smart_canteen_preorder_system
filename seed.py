#!/usr/bin/env python
"""
Run this once to create an admin superuser and seed sample menu items + slots.
Usage: python seed.py
"""
import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'smartserve_backend.settings')
django.setup()

from authentication.models import User
from menu.models import MenuItem
from slots.models import Slot
from datetime import date, time

# ── Admin user ──────────────────────────────────────────
if not User.objects.filter(email='admin@gmail.com').exists():
    User.objects.create_superuser(
        email='admin@gmail.com',
        name='Admin',
        password='Admin@123'
    )
    print('[OK] Admin created: admin@gmail.com / Admin@123')

# ── Sample staff user ────────────────────────────────────
if not User.objects.filter(email='staff@gmail.com').exists():
    User.objects.create_user(
        email='staff@gmail.com',
        name='Staff',
        password='Staff@123',
        role='staff'
      )
    print('[OK] Staff created: staff@gmail.com / Staff@123')

# ── Sample student ───────────────────────────────────────
if not User.objects.filter(email='student@gmail.com').exists():
    User.objects.create_user(
        email='student@gmail.com',
        name='Student',
        password='Student@123',
        role='student'
    )
    print('[OK] Student created: student@gmail.com / Student@123')

# ── Menu items ───────────────────────────────────────────
from seed_exhaustive import seed_menu_items
seed_menu_items()

# ── Today's slots ────────────────────────────────────────
today = date.today()
slots_data = [
    (time(12, 0),  time(12, 10)),
    (time(12, 10), time(12, 20)),
    (time(12, 20), time(12, 30)),
    (time(12, 30), time(12, 40)),
    (time(12, 40), time(12, 50)),
    (time(12, 50), time(13, 0)),
    (time(13, 0),  time(13, 10)),
    (time(13, 10), time(13, 20)),
]

slot_created = 0
for start, end in slots_data:
    _, c = Slot.objects.get_or_create(
        slot_date=today, start_time=start, end_time=end,
        defaults=dict(max_orders=30)
    )
    if c: slot_created += 1
print(f'[OK] Slots: {slot_created} created for today ({today})')
print('\nSmartServe seed complete!')
print('   Backend:  http://127.0.0.1:8000')
print('   Admin UI: http://127.0.0.1:8000/admin')
print('   Frontend: http://localhost:5173')
