from django.db import models
from authentication.models import User
from orders.models import Order

class QueueLog(models.Model):
    order          = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='queue_logs')
    queue_position = models.PositiveIntegerField(default=0)
    estimated_wait = models.PositiveIntegerField(default=0)
    logged_at      = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Queue #{self.queue_position} | Order {self.order.token_number}"

    class Meta:
        ordering = ['-logged_at']


class QueueState(models.Model):
    RUSH_CHOICES = [('low', 'Low'), ('medium', 'Medium'), ('heavy', 'Heavy')]
    rush_level = models.CharField(max_length=10, choices=RUSH_CHOICES, default='medium')
    last_updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"QueueState({self.rush_level}) @ {self.last_updated}"

    class Meta:
        verbose_name = 'Queue State'
        verbose_name_plural = 'Queue States'
