from rest_framework import serializers
from .models import MenuItem

class MenuItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = MenuItem
        fields = '__all__'

    def to_internal_value(self, data):
        image_str = None
        if 'image' in data and isinstance(data['image'], str):
            if data['image'].startswith('assets/') or data['image'].startswith('/assets/'):
                image_str = data['image']
                # Make mutable copy if it's a QueryDict
                if hasattr(data, '_mutable'):
                    data._mutable = True
                data.pop('image', None)
        
        ret = super().to_internal_value(data)
        if image_str:
            ret['image_str'] = image_str
        return ret

    def create(self, validated_data):
        image_str = validated_data.pop('image_str', None)
        instance = super().create(validated_data)
        if image_str:
            instance.image = image_str
            instance.save()
        return instance

    def update(self, instance, validated_data):
        image_str = validated_data.pop('image_str', None)
        if 'image' in validated_data and validated_data['image'] == '':
            instance.image = None
        
        instance = super().update(instance, validated_data)
        if image_str:
            instance.image = image_str
            instance.save()
        return instance

