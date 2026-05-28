from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status as drf_status
from orders.models import Order
from orders.serializers import OrderSerializer
from django.utils import timezone
from .models import QueueState

OVERLOAD_THRESHOLD = 10  # active orders before overload warning

def get_or_create_queue_state():
    qs, created = QueueState.objects.get_or_create(id=1, defaults={'rush_level': 'medium'})
    return qs

class QueueStatusView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        # Only instant orders congest the live queue
        active = Order.objects.filter(order_status__in=['confirmed', 'preparing'], order_type='instant')
        position = active.count()
        
        # Base penalty: 3 mins per active order in front of you
        queue_penalty = position * 3
        # Average item prep time: ~5 mins
        estimated = queue_penalty + 5 

        # If wait time is > 20 mins, kitchen is considered overloaded
        overloaded = estimated > 20

        return Response({
            'active_orders': position,
            'estimated_wait_mins': estimated if position > 0 else 0,
            'overloaded': overloaded,
            'rush_level': get_or_create_queue_state().rush_level,
            'message': (
                f"⚠ High congestion. Est. wait: {estimated} mins."
                if overloaded else
                f"Queue moving smoothly. Est. wait: {estimated if position > 0 else 0} mins."
            )
        })

class TokenStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, token):
        try:
            order = Order.objects.get(token_number=token)
        except Order.DoesNotExist:
            return Response({'error': 'Token not found'}, status=404)

        # Position in queue (orders placed before this one still active)
        position = Order.objects.filter(
            order_status__in=['confirmed', 'preparing'],
            created_at__lt=order.created_at
        ).count() + 1

        return Response({
            'token': token,
            'order_status': order.order_status,
            'queue_position': position,
            'estimated_wait_mins': position * 8,
            'order': OrderSerializer(order).data
        })

class KitchenQueueView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role not in ['staff', 'admin']:
            return Response({'error': 'Forbidden'}, status=403)
        orders = Order.objects.filter(order_status__in=['confirmed', 'preparing']).order_by('created_at')
        return Response(OrderSerializer(orders, many=True).data)


class RushLevelUpdateView(APIView):
    """Staff can update the rush level to reflect queue conditions"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.role not in ['staff', 'admin']:
            return Response({'error': 'Only staff can update rush level'}, status=403)
        
        rush_level = request.data.get('rush_level')
        if rush_level not in ['low', 'medium', 'heavy']:
            return Response({'error': 'Invalid rush level'}, status=drf_status.HTTP_400_BAD_REQUEST)
        
        # Persist queue state
        qs = get_or_create_queue_state()
        qs.rush_level = rush_level
        qs.save()
        
        return Response({
            'success': True,
            'rush_level': rush_level,
            'message': f'Queue status updated to {rush_level} rush'
        }, status=drf_status.HTTP_200_OK)

