from django.db import models

class Slot(models.Model):
    STATUS_CHOICES = [('open', 'Open'), ('full', 'Full'), ('closed', 'Closed')]
    slot_date      = models.DateField()
    start_time     = models.TimeField()
    end_time       = models.TimeField()
    max_orders     = models.PositiveIntegerField(default=30)
    current_orders = models.PositiveIntegerField(default=0)
    slot_status    = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')

    def is_full(self):
        return self.current_orders >= self.max_orders

    def available_capacity(self):
        return max(0, self.max_orders - self.current_orders)

    def reserve(self):
        if self.is_full():
            return False
        self.current_orders += 1
        if self.is_full():
            self.slot_status = 'full'
        self.save()
        return True

    def __str__(self):
        return f"{self.slot_date} {self.start_time}-{self.end_time} ({self.current_orders}/{self.max_orders})"

    class Meta:
        ordering = ['slot_date', 'start_time']
