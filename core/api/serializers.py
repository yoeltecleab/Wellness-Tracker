from rest_framework.serializers import ModelSerializer

from core.models import Food, Store, WaterLog


class FoodSerializer(ModelSerializer):
    class Meta:
        model = Food
        fields = '__all__'


class StoreSerializer(ModelSerializer):
    class Meta:
        model = Store
        fields = '__all__'


class WaterLogSerializer(ModelSerializer):
    class Meta:
        model = WaterLog
        fields = '__all__'
