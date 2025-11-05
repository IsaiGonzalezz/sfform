from rest_framework import serializers
from .models import Estaciones 

class EstacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Estaciones
        fields = ['idest', 'nombre', 'obs'] # Fields from your Estaciones model