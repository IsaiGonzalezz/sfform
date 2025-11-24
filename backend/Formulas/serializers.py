from rest_framework import serializers
from django.db import transaction
from .models import Formulas, Detalle_Formula
from Ingredientes.models import Ingredientes 

# Maneja la *lectura* (GET) y *escritura* (POST) de cada ingrediente.
class DetalleFormulaSerializer(serializers.ModelSerializer):
    iding = serializers.PrimaryKeyRelatedField(
        queryset=Ingredientes.objects.all(),
    )
    # Campo extra para MOSTRAR el nombre del ingrediente en un GET
    nombre_ingrediente = serializers.CharField(source='iding.nombre', read_only=True)

    class Meta:
        model = Detalle_Formula
        # 'idform' no va aquí, porque se lo daremos desde el serializador padre.
        fields = ['iddetalle', 'iding', 'nombre_ingrediente', 'cantidad', 'tolerancia']
        read_only_fields = ['iddetalle']

# --- Serializador Maestro (Fórmula) ---
class FormulaSerializer(serializers.ModelSerializer):
    
    # --- Para CREAR (POST) ---
    ingredientes = DetalleFormulaSerializer(many=True, write_only=True)

    # --- Para LEER (GET) ---
    detalles = DetalleFormulaSerializer(many=True, source='detalle_formula_set', read_only=True)

    class Meta:
        model = Formulas
        # 'detalles' es para GET, 'ingredientes' es para POST
        fields = ['idform', 'nombre', 'detalles', 'ingredientes']

    @transaction.atomic #Si algo falla, revierte toda la creación.
    def create(self, validated_data):
        """
        Sobrescribe el método create para manejar la creación anidada.
        """
        
        # 1. Saca los datos de los ingredientes del JSON validado
        ingredientes_data = validated_data.pop('ingredientes')
        
        # 2. Crea la Fórmula (el "maestro") con los datos restantes
        # (ej. idform, nombre)
        formula = Formulas.objects.create(**validated_data)
        
        # 3. Itera sobre la lista de ingredientes y créalos uno por uno
        for ingrediente_data in ingredientes_data:
            # Asigna la fórmula que acabamos de crear a cada detalle
            Detalle_Formula.objects.create(idform=formula, **ingrediente_data)
            
        return formula