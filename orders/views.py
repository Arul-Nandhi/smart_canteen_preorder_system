from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.utils import timezone
from .models import Order, OrderItem, Payment, Feedback
from .serializers import OrderSerializer, PlaceOrderSerializer, FeedbackSerializer
from slots.models import Slot
from menu.models import MenuItem
from notifications.models import Notification
from rest_framework import generics
from decimal import Decimal
import time
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.template.loader import render_to_string
from django.http import JsonResponse


class OrderListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role == 'student':
            orders = Order.objects.filter(user=request.user)
        else:
            orders = Order.objects.all()
        return Response(OrderSerializer(orders, many=True).data)

    def post(self, request):
        serializer = PlaceOrderSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        data = serializer.validated_data
        slot = None

        # Handle preorder slot
        if data['order_type'] == 'preorder':
            slot_id = data.get('slot_id')
            if not slot_id:
                return Response({'error': 'slot_id required for preorder'}, status=400)
            try:
                slot = Slot.objects.get(pk=slot_id)
            except Slot.DoesNotExist:
                return Response({'error': 'Slot not found'}, status=404)
            if slot.is_full():
                # Suggest next available slot
                next_slot = Slot.objects.filter(
                    slot_date=slot.slot_date,
                    start_time__gt=slot.start_time,
                    slot_status='open'
                ).first()
                msg = 'Slot is full.'
                if next_slot:
                    msg += f' Next available: {next_slot.start_time}-{next_slot.end_time}'
                return Response({'error': msg, 'next_slot_id': next_slot.id if next_slot else None}, status=400)

        # Calculate total & item prep wait
        total = 0
        my_prep_time = 0
        item_data = []
        for entry in data['items']:
            try:
                menu_item = MenuItem.objects.get(pk=entry['item_id'])
                qty = int(entry.get('quantity', 1))
                total += menu_item.price * qty
                # Base prep time for this specific order's items
                my_prep_time += menu_item.prep_time_mins * qty
                item_data.append((menu_item, qty))
            except MenuItem.DoesNotExist:
                return Response({'error': f"Item {entry['item_id']} not found"}, status=404)

        # Smart Overload Engine: Calculate existing queue load
        active_instant_orders = Order.objects.filter(order_status__in=['pending', 'confirmed', 'preparing'], order_type='instant')
        existing_queue_wait = sum(o.estimated_wait for o in active_instant_orders) // max(1, active_instant_orders.count()) if active_instant_orders.exists() else 0

        # Preorders don't wait in the instant queue, their wait is fixed to their prep time
        if data['order_type'] == 'preorder':
            final_wait = my_prep_time
        else:
            # Instant orders wait for the queue + their own prep time
            # We assume a kitchen with multiple chefs, so we don't strictly sum ALL wait times. 
            # We add a fraction of the queue size.
            queue_penalty = active_instant_orders.count() * 3  # 3 mins per order ahead of you
            final_wait = my_prep_time + queue_penalty

        # Create order
        order = Order.objects.create(
            user=request.user,
            slot=slot,
            order_type=data['order_type'],
            total_amount=total,
            estimated_wait=final_wait,
            order_status='confirmed',
            special_instructions=data.get('special_instructions', ''),
        )

        for menu_item, qty in item_data:
            OrderItem.objects.create(order=order, item=menu_item, quantity=qty)

        pay_status = 'success' if data['payment_method'] != 'cash' else 'pending'
        paid_time = timezone.now() if data['payment_method'] != 'cash' else None
        Payment.objects.create(order=order, payment_method=data['payment_method'], payment_status=pay_status, paid_at=paid_time)

        if slot:
            slot.reserve()

        Notification.objects.create(
            user=request.user,
            message=f"Order confirmed! Token: {order.token_number}. Est. wait: {order.estimated_wait} mins."
        )

        return Response(OrderSerializer(order).data, status=201)


class OrderDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            order = Order.objects.get(pk=pk)
        except Order.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)
        if request.user.role == 'student' and order.user != request.user:
            return Response({'error': 'Forbidden'}, status=403)
        return Response(OrderSerializer(order).data)

    def patch(self, request, pk):
        if request.user.role not in ['staff', 'admin']:
            return Response({'error': 'Forbidden'}, status=403)
        try:
            order = Order.objects.get(pk=pk)
        except Order.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)
        new_status = request.data.get('order_status')
        if new_status:
            order.order_status = new_status
            order.save()
            if new_status == 'ready':
                Notification.objects.create(
                    user=order.user,
                    message=f"Your food is ready! Show Token: {order.token_number} at the counter."
                )
            # Broadcast order update to staff via websocket
            try:
                channel_layer = get_channel_layer()
                async_to_sync(channel_layer.group_send)('staff', {'type': 'order_update', 'data': OrderSerializer(order).data})
            except Exception:
                pass
        return Response(OrderSerializer(order).data)


class OrderBillingView(APIView):
    """Process cash billing from staff and persist payment details"""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        if request.user.role not in ['staff', 'admin']:
            return Response({'error': 'Forbidden'}, status=403)
        try:
            order = Order.objects.get(pk=pk)
        except Order.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)

        payment = getattr(order, 'payment', None)
        if not payment:
            return Response({'error': 'No payment record for this order'}, status=400)

        method = request.data.get('payment_method')
        if method in ['cash', 'upi', 'card']:
            payment.payment_method = method

        received = request.data.get('received_amount')
        notes = request.data.get('notes', '')
        
        if payment.payment_method in ['upi', 'card']:
            received = order.total_amount

        try:
            received_dec = Decimal(str(received))
        except Exception:
            return Response({'error': 'Invalid received amount'}, status=400)

        change = received_dec - order.total_amount

        payment.received_amount = received_dec
        payment.change_amount = change
        payment.payment_status = 'success'
        payment.paid_at = timezone.now()
        payment.transaction_id = f'{payment.payment_method}-{order.id}-{int(time.time())}'
        payment.handled_by = request.user
        payment.notes = notes
        payment.save()

        order.order_status = 'completed'
        order.save()

        Notification.objects.create(
            user=order.user,
            message=f"Payment received for Order {order.token_number}. Thank you!"
        )

        # Create billing record (receipt)
        try:
            import json as _json
            items_snapshot = _json.dumps([{ 'name': it.item.item_name, 'qty': it.quantity, 'price': float(it.item.price) } for it in order.items.all()])
            receipt = f"RCPT-{order.id}-{int(time.time())}"
            from .models import Billing
            Billing.objects.update_or_create(order=order, defaults={
                'receipt_number': receipt,
                'items_snapshot': items_snapshot,
                'total_amount': order.total_amount,
                'payment_method': payment.payment_method,
                'received_amount': payment.received_amount,
                'change_amount': payment.change_amount,
                'handled_by': request.user,
                'notes': payment.notes,
            })
        except Exception:
            pass

        # Notify staff via websocket group
        try:
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)('staff', {'type': 'order_update', 'data': OrderSerializer(order).data})
            async_to_sync(channel_layer.group_send)('staff', {'type': 'notification', 'data': {'message': f'Payment received for {order.token_number}'}})
        except Exception:
            pass

        return Response(OrderSerializer(order).data)


class OrderReceiptView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            order = Order.objects.get(pk=pk)
        except Order.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)

        # Ensure billing exists
        billing = getattr(order, 'billing', None)
        if not billing:
            return Response({'error': 'Receipt not found'}, status=404)

        # Render receipt HTML
        html = render_to_string('orders/receipt.html', {
            'order': order,
            'billing': billing,
        })
        return JsonResponse({'html': html})


class AllOrdersView(APIView):
    """Return every order – used by admin dashboard, analytics, staff queue."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        orders = Order.objects.all().order_by('-created_at')
        return Response(OrderSerializer(orders, many=True).data)


class FeedbackListView(generics.ListCreateAPIView):
    queryset = Feedback.objects.all().order_by('-created_at')
    serializer_class = FeedbackSerializer

    def get_permissions(self):
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def get_queryset(self):
        user = self.request.user
        if user.role == 'student':
            return Feedback.objects.filter(user=user).order_by('-created_at')
        return Feedback.objects.all().order_by('-created_at')


class FeedbackDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Feedback.objects.all()
    serializer_class = FeedbackSerializer
    permission_classes = [IsAuthenticated]

    def patch(self, request, *args, **kwargs):
        # Allow partial update, e.g. for status and response_notes
        return self.partial_update(request, *args, **kwargs)

