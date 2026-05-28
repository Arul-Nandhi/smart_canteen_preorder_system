from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Sum, Avg
from django.utils import timezone
from datetime import timedelta
from orders.models import Order, OrderItem
from menu.models import MenuItem
from authentication.models import User

class AnalyticsDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'admin':
            return Response({'error': 'Forbidden'}, status=403)

        today = timezone.now().date()
        week_ago = today - timedelta(days=7)

        total_orders     = Order.objects.count()
        today_orders     = Order.objects.filter(created_at__date=today).count()
        active_orders    = Order.objects.filter(order_status__in=['pending', 'confirmed', 'preparing', 'ready']).count()
        pending_orders   = Order.objects.filter(order_status='pending').count()
        completed_orders = Order.objects.filter(order_status='completed').count()
        cancelled_orders = Order.objects.filter(order_status='cancelled').count()

        total_revenue    = Order.objects.filter(order_status__in=['ready', 'completed']).aggregate(Sum('total_amount'))['total_amount__sum'] or 0
        today_revenue    = Order.objects.filter(created_at__date=today, order_status__in=['ready', 'completed']).aggregate(Sum('total_amount'))['total_amount__sum'] or 0
        avg_wait         = Order.objects.aggregate(Avg('estimated_wait'))['estimated_wait__avg'] or 0
        total_students   = User.objects.filter(role='student').count()
        active_students  = User.objects.filter(role='student', is_active=True).count()
        total_staff      = User.objects.filter(role='staff').count()
        food_available   = MenuItem.objects.filter(availability=True).count()

        # Peak ordering times calculation (group by hour)
        from django.db.models.functions import ExtractHour
        peak_hour_query = (
            Order.objects
            .annotate(hour=ExtractHour('created_at'))
            .values('hour')
            .annotate(count=Count('id'))
            .order_by('-count')
            .first()
        )
        peak_time_orders = "No orders yet"
        if peak_hour_query:
            hour = peak_hour_query['hour']
            ampm = "AM" if hour < 12 else "PM"
            display_hour = hour % 12
            if display_hour == 0:
                display_hour = 12
            peak_time_orders = f"{display_hour} {ampm} - {display_hour + 1 if display_hour < 12 else 1} {ampm if display_hour < 11 else ('PM' if ampm == 'AM' else 'AM')}"

        # Queue Load Status
        active_instant = Order.objects.filter(order_status__in=['confirmed', 'preparing'], order_type='instant').count()
        if active_instant == 0:
            queue_load_status = "Smooth"
        elif active_instant < 5:
            queue_load_status = "Normal"
        elif active_instant < 10:
            queue_load_status = "Moderate"
        else:
            queue_load_status = "Overloaded"

        # Top 5 items
        top_items = (
            OrderItem.objects
            .values('item__item_name', 'item__category')
            .annotate(total_qty=Sum('quantity'))
            .order_by('-total_qty')[:5]
        )

        # Orders by status
        status_breakdown = (
            Order.objects.values('order_status')
            .annotate(count=Count('id'))
        )

        # Daily sales last 7 days
        daily_orders = []
        for i in range(6, -1, -1):
            day = today - timedelta(days=i)
            count = Order.objects.filter(created_at__date=day).count()
            sales = Order.objects.filter(created_at__date=day, order_status__in=['ready', 'completed']).aggregate(Sum('total_amount'))['total_amount__sum'] or 0
            daily_orders.append({
                'date': str(day), 
                'orders': count,
                'revenue': float(sales)
            })

        return Response({
            'summary': {
                'total_orders':  total_orders,
                'today_orders':  today_orders,
                'active_orders': active_orders,
                'pending_orders': pending_orders,
                'completed_orders': completed_orders,
                'cancelled_orders': cancelled_orders,
                'total_revenue': float(total_revenue),
                'today_revenue': float(today_revenue),
                'avg_wait_mins': round(float(avg_wait), 1),
                'total_students': total_students,
                'active_students': active_students,
                'total_staff': total_staff,
                'food_available': food_available,
                'peak_time_orders': peak_time_orders,
                'queue_load_status': queue_load_status,
            },
            'top_items':        list(top_items),
            'status_breakdown': list(status_breakdown),
            'daily_orders':     daily_orders,
        })
