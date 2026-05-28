from django.contrib import admin
from .models import Order, OrderItem, Payment
from .models import Billing

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display  = ['id', 'token_number', 'user', 'order_type', 'order_status', 'total_amount', 'created_at']
    list_filter   = ['order_status', 'order_type']
    inlines       = [OrderItemInline]

admin.site.register(Payment)
admin.site.register(Billing)
