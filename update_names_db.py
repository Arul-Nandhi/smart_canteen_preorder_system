import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'smartserve_backend.settings')
django.setup()

from authentication.models import User

# Update student name
student = User.objects.filter(email__in=['student@gmail.com', 'student@smartserve.com']).first()
if student:
    student.name = 'Student'
    student.save()
    print("Student name updated to 'Student'")

# Update staff name
staff = User.objects.filter(email__in=['staff@gmail.com', 'staff@smartserve.com']).first()
if staff:
    staff.name = 'Staff'
    staff.save()
    print("Staff name updated to 'Staff'")

# Update admin name
admin = User.objects.filter(email__in=['admin@gmail.com', 'admin@smartserve.com']).first()
if admin:
    admin.name = 'Admin'
    admin.save()
    print("Admin name updated to 'Admin'")
