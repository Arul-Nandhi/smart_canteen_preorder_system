from django.db import models
from authentication.models import User

class Notification(models.Model):
    STATUS = [('unread', 'Unread'), ('read', 'Read')]
    user    = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    message = models.TextField()
    notification_status = models.CharField(max_length=20, choices=STATUS, default='unread')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Notif → {self.user.name}: {self.message[:40]}"

    class Meta:
        ordering = ['-created_at']
