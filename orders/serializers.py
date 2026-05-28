from rest_framework import serializers
from .models import Order, OrderItem, Payment, Feedback

from menu.serializers import MenuItemSerializer

class OrderItemSerializer(serializers.ModelSerializer):
    item_detail = MenuItemSerializer(source='item', read_only=True)

    class Meta:
        model = OrderItem
        fields = ['id', 'item', 'item_detail', 'quantity', 'subtotal']

class PaymentSerializer(serializers.ModelSerializer):
    handled_by_name = serializers.CharField(source='handled_by.name', read_only=True)

    class Meta:
        model = Payment
        fields = [
            'id', 'payment_method', 'payment_status', 'transaction_id', 'paid_at',
            'received_amount', 'change_amount', 'handled_by', 'handled_by_name', 'notes'
        ]

from slots.serializers import SlotSerializer

class OrderSerializer(serializers.ModelSerializer):
    items   = OrderItemSerializer(many=True, read_only=True)
    payment = PaymentSerializer(read_only=True)
    user_name = serializers.CharField(source='user.name', read_only=True)
    slot_detail = SlotSerializer(source='slot', read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'user', 'user_name', 'slot', 'slot_detail', 'order_type',
            'total_amount', 'order_status', 'token_number',
            'estimated_wait', 'special_instructions', 'created_at', 'items', 'payment'
        ]
        read_only_fields = ['token_number', 'total_amount', 'estimated_wait']

class PlaceOrderSerializer(serializers.Serializer):
    order_type     = serializers.ChoiceField(choices=['preorder', 'instant'])
    slot_id        = serializers.IntegerField(required=False, allow_null=True)
    payment_method = serializers.ChoiceField(choices=['cash', 'upi', 'card'], default='cash')
    special_instructions = serializers.CharField(required=False, allow_blank=True, default='')
    items = serializers.ListField(
        child=serializers.DictField()
    )


class FeedbackSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.name', read_only=True)

    class Meta:
        model = Feedback
        fields = ['id', 'user', 'user_name', 'rating', 'message', 'status', 'response_notes', 'created_at']

