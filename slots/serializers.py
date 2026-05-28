from rest_framework import serializers
from .models import Slot

class SlotSerializer(serializers.ModelSerializer):
    available_capacity = serializers.SerializerMethodField()

    class Meta:
        model = Slot
        fields = '__all__'

    def get_available_capacity(self, obj):
        return obj.available_capacity()
