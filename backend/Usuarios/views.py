from rest_framework import generics
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
    lookup_field = 'rfid' # Le decimos a Django que use 'rfid' para buscar, no el 'id'