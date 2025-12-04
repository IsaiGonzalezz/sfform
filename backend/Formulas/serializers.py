from rest_framework import serializers
from django.db import transaction
from .models import Formulas, Detalle_Formula
from Ingredientes.models import Ingredientes 

# --- Serializador Detalle (Hijo) ---
class DetalleFormulaSerializer(serializers.ModelSerializer):
    iding = serializers.PrimaryKeyRelatedField(
        queryset=Ingredientes.objects.all(),
    )
    nombre_ingrediente = serializers.CharField(source='iding.nombre', read_only=True)

    class Meta:
        model = Detalle_Formula
        # Quitamos iddetalle de read_only_fields si quisiéramos usarlo para machear, 
        # pero usaremos 'iding' para la lógica de negocio (asumiendo que no repites ingredientes en una formula).
        fields = ['iddetalle', 'iding', 'nombre_ingrediente', 'cantidad', 'tolerancia']
        read_only_fields = ['iddetalle']


# --- Serializador Maestro (Fórmula) ---
class FormulaSerializer(serializers.ModelSerializer):
    
    # Campo para escritura (lo que recibe el JSON del front)
    ingredientes = DetalleFormulaSerializer(many=True, write_only=True)

    # Campo para lectura (lo que envía al front)
    detalles = DetalleFormulaSerializer(many=True, source='detalle_formula_set', read_only=True)

    class Meta:
        model = Formulas
        fields = ['idform', 'nombre', 'detalles', 'ingredientes']

    @transaction.atomic
    def create(self, validated_data):
        """
        Creación estándar (ya la tenías).
        """
        ingredientes_data = validated_data.pop('ingredientes')
        formula = Formulas.objects.create(**validated_data)
        
        for ingrediente_data in ingredientes_data:
            Detalle_Formula.objects.create(idform=formula, **ingrediente_data)
            
        return formula

    @transaction.atomic
    def update(self, instance, validated_data):
        """
        Actualización de listas anidadas.
        """
        # 1. Extraemos los ingredientes que vienen del Frontend (si vienen)
        ingredientes_data = validated_data.pop('ingredientes', None)

        # 2. Actualizamos los campos propios de la Fórmula (ej. Nombre)
        instance.nombre = validated_data.get('nombre', instance.nombre)
        instance.save()

        # Si no mandaron ingredientes, terminamos aquí.
        if ingredientes_data is None:
            return instance


        # A. Obtenemos los ingredientes que YA EXISTEN en la BD para esta fórmula.
        # Creamos un diccionario donde la CLAVE es el ID del ingrediente (iding).
        # Esto nos permite buscar rápido: "items_existentes['ING-01']"
        items_existentes = {item.iding_id: item for item in instance.detalle_formula_set.all()}
        
        # Lista para llevar control de qué ingredientes llegaron en esta petición
        ids_que_llegaron = []

        for item_data in ingredientes_data:
            # Obtenemos el objeto ingrediente y su ID
            ingrediente_obj = item_data['iding'] 
            ingrediente_id = ingrediente_obj.pk # El valor real (ej. "ING-01")
            
            ids_que_llegaron.append(ingrediente_id)

            # CASO 1: ACTUALIZAR (El ingrediente ya existía en la fórmula)
            if ingrediente_id in items_existentes:
                detalle_instance = items_existentes[ingrediente_id]
                # Actualizamos sus valores
                detalle_instance.cantidad = item_data.get('cantidad', detalle_instance.cantidad)
                detalle_instance.tolerancia = item_data.get('tolerancia', detalle_instance.tolerancia)
                detalle_instance.save()
            
            # CASO 2: CREAR (El ingrediente es nuevo en esta fórmula)
            else:
                Detalle_Formula.objects.create(idform=instance, **item_data)

        # CASO 3: BORRAR (Estaban en la BD pero no llegaron en el JSON)
        for viejo_id, viejo_obj in items_existentes.items():
            if viejo_id not in ids_que_llegaron:
                viejo_obj.delete()

        return instance