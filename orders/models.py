import uuid
from django.db import models
from authentication.models import User
from menu.models import MenuItem
from slots.models import Slot

ORDER_STATUS = [
    ('pending', 'Pending'), ('confirmed', 'Confirmed'),
    ('preparing', 'Preparing'), ('ready', 'Ready'), ('completed', 'Completed'),
    ('cancelled', 'Cancelled'),
]
ORDER_TYPE = [('preorder', 'Preorder'), ('instant', 'Instant')]

class Order(models.Model):
    user           = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders')
    slot           = models.ForeignKey(Slot, on_delete=models.SET_NULL, null=True, blank=True)
    order_type     = models.CharField(max_length=20, choices=ORDER_TYPE)
    total_amount   = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    order_status   = models.CharField(max_length=30, choices=ORDER_STATUS, default='pending')
    token_number   = models.CharField(max_length=20, unique=True, blank=True)
    estimated_wait = models.PositiveIntegerField(default=0)
    special_instructions = models.TextField(blank=True, default='')
    created_at     = models.DateTimeField(auto_now_add=True)
    updated_at     = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.token_number:
            import re
            prefix = "P" if self.order_type == "preorder" else "I"
            # Find max sequential token suffix in recent orders of the same type
            last_orders = Order.objects.filter(order_type=self.order_type, token_number__startswith=prefix).order_by('-id')[:30]
            
            max_num = 0
            for o in last_orders:
                match = re.search(r'\d+', o.token_number)
                if match:
                    try:
                        num = int(match.group())
                        if num > max_num:
                            max_num = num
                    except ValueError:
                        pass
            
            next_num = max_num + 1
            while True:
                candidate = f"{prefix}{next_num:03d}"
                if not Order.objects.filter(token_number=candidate).exists():
                    self.token_number = candidate
                    break
                next_num += 1
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Order #{self.id} | {self.token_number} | {self.order_status}"

    class Meta:
        ordering = ['-created_at']


class OrderItem(models.Model):
    order    = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    item     = models.ForeignKey(MenuItem, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    subtotal = models.DecimalField(max_digits=8, decimal_places=2, default=0)

    def save(self, *args, **kwargs):
        self.subtotal = self.item.price * self.quantity
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.quantity}x {self.item.item_name}"


class Payment(models.Model):
    METHODS = [('cash', 'Cash'), ('upi', 'UPI'), ('card', 'Card')]
    PAY_STATUS = [('pending', 'Pending'), ('success', 'Success'), ('failed', 'Failed')]

    order          = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='payment')
    payment_method = models.CharField(max_length=30, choices=METHODS, default='cash')
    payment_status = models.CharField(max_length=20, choices=PAY_STATUS, default='pending')
    transaction_id = models.CharField(max_length=100, blank=True)
    paid_at        = models.DateTimeField(null=True, blank=True)
    # Cash billing details
    received_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    change_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    handled_by = models.ForeignKey('authentication.User', null=True, blank=True, on_delete=models.SET_NULL, related_name='handled_payments')
    notes = models.TextField(blank=True, default='')

    def __str__(self):
        return f"Payment for Order #{self.order.id} — {self.payment_status}"


class Feedback(models.Model):
    STATUS_CHOICES = [('open', 'Open'), ('in_review', 'In Review'), ('resolved', 'Resolved')]
    user           = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='feedbacks')
    rating         = models.PositiveIntegerField(default=5)
    message        = models.TextField()
    status         = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    response_notes = models.TextField(blank=True, default='')
    created_at     = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Feedback #{self.id} | Rating: {self.rating} | {self.status}"


class Billing(models.Model):
    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='billing')
    receipt_number = models.CharField(max_length=60, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    items_snapshot = models.TextField(blank=True)  # simple JSON/text snapshot
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    payment_method = models.CharField(max_length=20, default='cash')
    received_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    change_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    handled_by = models.ForeignKey('authentication.User', null=True, blank=True, on_delete=models.SET_NULL, related_name='billings')
    notes = models.TextField(blank=True, default='')

    def __str__(self):
        return f"Billing #{self.receipt_number} | Order {self.order.token_number}"

