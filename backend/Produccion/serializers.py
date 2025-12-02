from rest_framework import serializers
from django.db import transaction # Importante para atomicidad
from .models import Produccion, DetalleProduccion
from Formulas.models import Formulas
from Usuarios.models import Usuario
from Ingredientes.models import Ingredientes

# --- Serializer de Detalle  ---
class DetalleProduccionSerializer(serializers.ModelSerializer):
    
    iding = serializers.PrimaryKeyRelatedField(
        queryset=Ingredientes.objects.all(),
    )
    nombre_ingrediente = serializers.CharField(source='iding.nombre', read_only=True)
    
    class Meta:
        model = DetalleProduccion
        fields = [
            'iddetalleproduccion',
            # 'folioproduccion',  <-- Lo quitamos o lo dejamos read_only, se gestiona arriba
            'iding', 
            'nombre_ingrediente',
            'pesing',
            'pmax',
            'pmin',
            'pesado'
        ]
        read_only_fields = ['iddetalleproduccion']

# --- Serializer de Producción (Padre) ---
class ProduccionSerializer(serializers.ModelSerializer):
    
    # 1. Relaciones FK existentes
    idform = serializers.PrimaryKeyRelatedField(queryset=Formulas.objects.all())
    idusu = serializers.PrimaryKeyRelatedField(queryset=Usuario.objects.all())
    
    # 2. Campos de lectura (nombres)
    nombre_formula = serializers.CharField(source='idform.nombre', read_only=True)
    nombre_usuario = serializers.CharField(source='idusu.nombre', read_only=True)

    # 3. 
    # related_name en el modelo DetalleProduccion debe ser 'detalles' o usamos source
    # 'many=True' indica que es una lista.
    detalles = DetalleProduccionSerializer(many=True)

    class Meta:
        model = Produccion
        fields = [
            'folio', 
            'op', 
            'idform', 'nombre_formula',
            'lote', 
            'pesform', 
            'estatus', 
            'fecha', 
            'idusu', 'nombre_usuario',
            'detalles' # <--- Agregamos el campo anidado al fields
        ]
        read_only_fields = ['folio']

    # 4. CREATE para manejar la anidación
    def create(self, validated_data):
        # Extraemos la lista de detalles del JSON entrante
        detalles_data = validated_data.pop('detalles')
        
        # Usamos transaction.atomic para asegurar que si falla un ingrediente, 
        # no se cree la cabecera huérfana.
        with transaction.atomic():
            # A. Creamos la Producción (Cabecera)
            produccion = Produccion.objects.create(**validated_data)
            
            # B. Iteramos sobre los detalles y los creamos vinculándolos a la producción recién creada
            for detalle_data in detalles_data:
                DetalleProduccion.objects.create(folioproduccion=produccion, **detalle_data)
                
        return produccion