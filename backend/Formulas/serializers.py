from rest_framework import serializers
from .models import Formulas, Ingredientes

class FormulaSerializer(serializers.ModelSerializer):
    
    iding = serializers.SlugRelatedField(
        queryset = Ingredientes.objects.all(),
        slug_field = 'iding'
    )
    nombre_ingrediente = serializers.CharField(source='iding.nombre', read_only=True)

    class Meta:
        model = Formulas
        fields = ['idform', 'folio', 'nombre', 'iding', 'cantidad', 'tolerancia']
        read_only_fields = ['idform', 'nombre_ingrediente']