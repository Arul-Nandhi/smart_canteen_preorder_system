import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'smartserve_backend.settings')
django.setup()

from authentication.models import User

# Update passwords for the demo accounts
admin = User.objects.filter(email='admin@smartserve.com').first()
if admin:
    admin.set_password('Admin@123')
    admin.save()
    print("Admin password updated to Admin@123")

staff = User.objects.filter(email='staff@smartserve.com').first()
if staff:
    staff.set_password('Staff@123')
    staff.save()
    print("Staff password updated to Staff@123")

student = User.objects.filter(email='student@smartserve.com').first()
if student:
    student.set_password('Student@123')
    student.save()
    print("Student password updated to Student@123")
