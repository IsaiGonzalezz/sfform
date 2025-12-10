from rest_framework import serializers 
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.hashers import check_password
from Usuarios.models import Usuario

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    
    correo = serializers.CharField(max_length=50)
    password = serializers.CharField(max_length=256, write_only=True)

    # 2. MENSAJES DE ERROR PARA LA VALIDACIÓN
    default_error_messages = {
        'no_fields': 'Debe proporcionar correo y contraseña.', 
        'no_active_account': 'Credenciales inválidas.', 
        'account_disabled': 'Tu cuenta ha sido desactivada. Contacta a soporte.', # Nuevo mensaje
        'permission_denied': 'Acceso denegado. Se requieren permisos de Administrador.', # Nuevo mensaje
        'no_token': 'No se proporcionó token en la petición.',
    }
    
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
        contraseña_recibida = attrs.get('password') 
        
        if not correo or not contraseña_recibida:
            raise self.fail("no_fields")

        # Intentar obtener el usuario por el campo de login
        try:
            usuario = Usuario.objects.get(correo=correo)
        except Usuario.DoesNotExist:
            raise self.fail("no_active_account") 

        # Verificación de la contraseña hasheada
        if not check_password(contraseña_recibida, usuario.password):
            raise self.fail("no_active_account")
        
        # =================================================================
        # NUEVAS VALIDACIONES DE SEGURIDAD
        # =================================================================

        # 1. Validar si el usuario está ACTIVO (Soft Delete check)
        if not usuario.activo:
            raise self.fail("account_disabled")

        # 2. Validar si el usuario es ADMINISTRADOR
        # Convertimos a minúsculas por si en la BD dice "Administrador" o "ADMINISTRADOR"
        if str(usuario.rol).lower() != 'administrador':
            raise self.fail("permission_denied")

        # =================================================================
        
        # 4. Éxito: Generación de tokens
        refresh = self.get_token(usuario)
        
        data = {}
        data['refresh'] = str(refresh)
        data['access'] = str(refresh.access_token)
        
        # Opcional: Puedes devolver el rol aquí para que el frontend lo guarde
        data['rol'] = usuario.rol 
        
        return data