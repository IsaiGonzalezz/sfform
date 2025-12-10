# en usuarios/serializers.py
from rest_framework import serializers
from .models import Usuario
from django.contrib.auth.hashers import make_password

class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        # Especificamos todos los campos que tu modelo tiene
        fields = ['id','rfid', 'nombre', 'correo', 'password', 'rol', 'activo']
        
        # Hacemos la contraseña opcional al leer y no requerida al escribir
        extra_kwargs = {
            'password': {
                'write_only': True, # No enviar el hash de vuelta en la respuesta
                'required': False   # No es obligatorio enviarla en cada petición
            }
        }

    # Esta función (create) ya la tenías. Hashea la contraseña al CREAR un usuario.
    def create(self, validated_data):
        # Hacemos el hash de la contraseña antes de guardar
        validated_data['password'] = make_password(validated_data.get('password'))
        return super().create(validated_data)


    # Esta (update) hashea la contraseña solo si se envió una nueva al ACTUALIZAR.
    def update(self, instance, validated_data):
        # Verificamos si la 'contraseña' viene en los datos a actualizar
        if 'password' in validated_data:
            # Si sí, hasheamos la nueva contraseña
            validated_data['password'] = make_password(validated_data.get('password'))
        
        # 'instance' es el usuario que se está actualizando
        # 'validated_data' son los nuevos datos
        # super().update() se encarga de guardar los cambios en la base de datos
        return super().update(instance, validated_data)