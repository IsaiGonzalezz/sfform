# tu_app/serializers.py

from rest_framework import serializers 
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.hashers import check_password
from Usuarios.models import Usuario

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    # 1. CAMPOS DE ENTRADA (Input que viene del frontend/DRF web)
    # Definimos el campo de login como 'correo' y la contraseña como 'password'.
    correo = serializers.CharField(max_length=50)
    password = serializers.CharField(max_length=256, write_only=True)

    # 2. MENSAJES DE ERROR PARA LA VALIDACIÓN
    default_error_messages = {
        # El 400 ya no debería salir por error de campos, sino por la lógica de validación
        'no_fields': 'Debe proporcionar correo y contraseña.', 
        'no_active_account': 'Credenciales inválidas.', 
        'no_token': 'No se proporcionó token en la petición.',
    }
    
    # 3. ELIMINAMOS COMPLETAMENTE EL MÉTODO __init__

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # claims al token JWT
        token['user_id'] = user.id
        token['rfid'] = user.rfid
        token['rol'] = user.rol
        token['nombre'] = user.nombre
        return token

    def validate(self, attrs):
        # Capturamos los datos de entrada
        correo = attrs.get('correo')
        contraseña_recibida = attrs.get('password') # <-- Usa el campo de entrada 'password'
        
        if not correo or not contraseña_recibida:
            raise self.fail("no_fields")

        # Intentar obtener el usuario por el campo de login
        try:
            usuario = Usuario.objects.get(correo=correo)
        except Usuario.DoesNotExist:
            raise self.fail("no_active_account") 

        # Verificación de la contraseña hasheada
        # Usa el campo de la BD (usuario.password) contra la contraseña recibida
        if not check_password(contraseña_recibida, usuario.password):
            raise self.fail("no_active_account")
        
        # 4. Éxito: Generación de tokens
        refresh = self.get_token(usuario)
        
        data = {}
        data['refresh'] = str(refresh)
        data['access'] = str(refresh.access_token)
        
        return data