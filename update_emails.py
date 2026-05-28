import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'smartserve_backend.settings')
django.setup()

from authentication.models import User

# Update emails
admin = User.objects.filter(email='admin@smartserve.com').first()
if admin:
    admin.email = 'admin@gmail.com'
    admin.save()
    print("Admin email updated to admin@gmail.com")
else:
    # Handle if already updated or doesn't exist
    admin_gmail = User.objects.filter(email='admin@gmail.com').first()
    if not admin_gmail:
        User.objects.create_superuser('admin@gmail.com', 'Admin', 'Admin@123')
        print("Created admin@gmail.com")

staff = User.objects.filter(email='staff@smartserve.com').first()
if staff:
    staff.email = 'staff@gmail.com'
    staff.save()
    print("Staff email updated to staff@gmail.com")
else:
    staff_gmail = User.objects.filter(email='staff@gmail.com').first()
    if not staff_gmail:
        User.objects.create_user('staff@gmail.com', 'Kitchen Staff', 'Staff@123', role='staff')
        print("Created staff@gmail.com")

student = User.objects.filter(email='student@smartserve.com').first()
if student:
    student.email = 'student@gmail.com'
    student.save()
    print("Student email updated to student@gmail.com")
else:
    student_gmail = User.objects.filter(email='student@gmail.com').first()
    if not student_gmail:
        User.objects.create_user('student@gmail.com', 'Test Student', 'Student@123', role='student')
        print("Created student@gmail.com")
