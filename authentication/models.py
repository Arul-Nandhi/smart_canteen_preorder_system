from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models

class UserManager(BaseUserManager):
    def create_user(self, email, name, password=None, role='student', phone=''):
        if not email:
            raise ValueError('Email required')
        user = self.model(email=self.normalize_email(email), name=name, role=role, phone=phone)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, name, password):
        user = self.create_user(email, name, password, role='admin')
        user.is_staff = True
        user.is_superuser = True
        user.save(using=self._db)
        return user

class User(AbstractBaseUser, PermissionsMixin):
    ROLES = [('student', 'Student'), ('staff', 'Staff'), ('admin', 'Admin')]
    STAFF_ROLES = [('head_chef', 'Head Chef'), ('counter', 'Counter Staff'), ('helper', 'Helper')]

    name     = models.CharField(max_length=100)
    email    = models.EmailField(unique=True)
    role     = models.CharField(max_length=20, choices=ROLES, default='student')
    phone    = models.CharField(max_length=15, blank=True)
    
    # Operations/Management enhancements
    department = models.CharField(max_length=100, blank=True, null=True)
    staff_role = models.CharField(max_length=30, choices=STAFF_ROLES, blank=True, null=True)
    shift_start = models.TimeField(null=True, blank=True)
    shift_end = models.TimeField(null=True, blank=True)
    is_active_status = models.BooleanField(default=True)

    is_active = models.BooleanField(default=True)
    is_staff  = models.BooleanField(default=False)
    is_present = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    objects = UserManager()
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name']

    def __str__(self):
        return f"{self.name} ({self.role})"

