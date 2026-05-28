from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from orders.models import Payment
from .models import AnalyticsDaily


@receiver(post_save, sender=Payment)
def payment_post_save(sender, instance, created, **kwargs):
    # Only count successful payments
    try:
        if instance.payment_status != 'success':
            return
        # Determine date
        dt = (instance.paid_at or timezone.now()).date()
        ad, _ = AnalyticsDaily.objects.get_or_create(date=dt)
        amt = instance.order.total_amount if instance.order else 0
        if instance.payment_method == 'cash':
            ad.revenue_cash = (ad.revenue_cash or 0) + amt
        else:
            ad.revenue_online = (ad.revenue_online or 0) + amt
        ad.save()
    except Exception:
        # Avoid crashing on signal
        return
