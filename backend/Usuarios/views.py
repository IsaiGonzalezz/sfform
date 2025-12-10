from rest_framework import generics, status
from rest_framework.response import Response
from django.db import connection
from .models import Usuario
from .serializers import UsuarioSerializer

# Create your views here.

# creación y listado de todos los usuarios
class UsuarioListCreateView(generics.ListCreateAPIView):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer


# Esta se encargará de LEER (uno), ACTUALIZAR y BORRAR
class UsuarioDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer
    lookup_field = 'id'

    def delete(self, request, *args, **kwargs):
        id_value = self.kwargs[self.lookup_field]
        
        try:
            # 1. Verificamos que el usuario exista (Lectura)
            instance = self.get_queryset().get(id=id_value)
            
            # 2. Ejecución de la Eliminación (SQL Directo)
            # usamos SQL puro para forzar la eliminación por RFID (VARCHAR).
            with connection.cursor() as cursor:
                # Usamos una consulta parametrizada para seguridad
                cursor.execute(
                    "DELETE FROM Usuarios WHERE ID = %s", [id_value]
                )
            
            # Nota: Si tu dialecto SQL usa '?' o '@' en lugar de '%s', ajusta aquí.
            
            return Response(status=status.HTTP_204_NO_CONTENT)
            
        except Usuario.DoesNotExist:
            return Response({'detail': 'Usuario no encontrado.'}, status=status.HTTP_404_NOT_FOUND)
        
        except Exception as e:
            # Capturamos cualquier error de BD y lo mostramos
            return Response({'detail': f'Error fatal de BD al eliminar: {e}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)