# empresa/serializers.py
from rest_framework import serializers
from .models import Empresa

class EmpresaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Empresa
        # Asegúrate que 'logotipo' esté aquí
        fields = [
            'rfc', 'nombre', 'calle', 'colonia', 'ciudad', 'estado',
            'cp', 'contacto', 'correo', 'telefono', 'logotipo'
        ]
        # Opcional: Si quieres que el logo no sea obligatorio al actualizar
        extra_kwargs = {
            'logotipo': {'required': False, 'allow_null': True}
        }