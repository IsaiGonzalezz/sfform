from rest_framework import serializers
from .models import Produccion 
from .models import DetalleProduccion
from Formulas.models import Formulas
from Usuarios.models import Usuario
from Ingredientes.models import Ingredientes

class ProduccionSerializer(serializers.ModelSerializer):
    
    # Campo para manejar la relación con Fórmulas (escritura)
    # Permite al usuario enviar el 'idform' (la PK) para crear el registro.
    idform = serializers.PrimaryKeyRelatedField(
        queryset=Formulas.objects.all(),
        # read_only=False por defecto, lo que permite la escritura
    )
    
    # Campo para manejar la relación con Usuarios (escritura)
    # Permite al usuario enviar el 'rfid' (la PK del usuario, ya que idusu la referencia)
    idusu = serializers.PrimaryKeyRelatedField(
        queryset=Usuario.objects.all(),
        # read_only=False por defecto, lo que permite la escritura
    )

    # --- Campos de Solo Lectura para mostrar nombres en GET ---
    # Muestra el nombre de la fórmula al leer (GET)
    nombre_formula = serializers.CharField(source='idform.nombre', read_only=True)
    
    # Muestra el nombre del usuario al leer (GET)
    nombre_usuario = serializers.CharField(source='idusu.nombre', read_only=True)


    class Meta:
        model = Produccion
        fields = [
            'folio', 
            'op', 
            'idform', 'nombre_formula', # idform para escritura, nombre_formula para lectura
            'lote', 
            'pesform', 
            'pesing', 
            'pmax', 
            'pmin', 
            'pesado', 
            'estatus', 
            'fecha', 
            'idusu', 'nombre_usuario' # idusu para escritura, nombre_usuario para lectura
        ]
        # 'folio' se genera automáticamente (AutoField), por lo que es de solo lectura.
        read_only_fields = ['folio']


class DetalleProduccionSerializer(serializers.ModelSerializer):
    
    # Campo para escritura: FolioProduccion (apunta a la PK 'folio' de Produccion, que es int)
    folioproduccion = serializers.PrimaryKeyRelatedField(
        queryset=Produccion.objects.all(),
    )
    
    # Campo para escritura: IdIng (apunta a la PK 'IdIng' de Ingredientes, que asumimos es string/varchar)
    iding = serializers.PrimaryKeyRelatedField(
        queryset=Ingredientes.objects.all(),
    )
    
    # Campo de solo lectura para mostrar el nombre del Ingrediente
    nombre_ingrediente = serializers.CharField(source='iding.nombre', read_only=True)
    
    class Meta:
        model = DetalleProduccion
        fields = [
            'iddetalleproduccion',
            'folioproduccion', 
            'iding', 'nombre_ingrediente',
            'pesing',
            'pmax',
            'pmin',
            'pesado'
        ]
        read_only_fields = ['iddetalleproduccion']