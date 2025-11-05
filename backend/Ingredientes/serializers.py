from rest_framework import serializers
from .models import Ingredientes

class IngredienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ingredientes
        fields = ['iding', 'nombre', 'presentacion', 'observaciones', 'pesado']