from django.db import models


class AnalyticsDaily(models.Model):
    date = models.DateField(unique=True)
    revenue_cash = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    revenue_online = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    class Meta:
        ordering = ['-date']

    def __str__(self):
        return f"Analytics {self.date} | cash: {self.revenue_cash} | online: {self.revenue_online}"
from django.db import models

# Create your models here.
