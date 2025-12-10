# operadores/serializers.py
from rest_framework import serializers
from .models import Operadores, Estaciones # modelos 
from django.contrib.auth.hashers import make_password

class OperadorSerializer(serializers.ModelSerializer):
    # Para LEER: Muestra el idest de la estación asociada.
    # Usamos SlugRelatedField para mostrar el valor del campo 'idest' de Estaciones.
    idest = serializers.SlugRelatedField(
        queryset=Estaciones.objects.all(), # Necesario para validar al escribir
        slug_field='idest' # El campo de Estaciones que queremos mostrar/recibir
    )

    class Meta:
        model = Operadores
        # Incluimos todos los campos del modelo
        fields = ['rfid', 'nombre', 'contraseña', 'idest', 'activo']
        extra_kwargs = {
            'contraseña': {
                'write_only': True, # No devolver el hash
                'required': False   # Opcional al actualizar
            }
        }

    '''
    # Hashear contraseña al CREAR
    def create(self, validated_data):
        validated_data['contraseña'] = make_password(validated_data.get('contraseña'))
        return super().create(validated_data)

    # Hashear contraseña (si se envía) al ACTUALIZAR
    def update(self, instance, validated_data):
        if 'contraseña' in validated_data:
            validated_data['contraseña'] = make_password(validated_data.get('contraseña'))
        return super().update(instance, validated_data)
    '''