from rest_framework import generics
from .models import Produccion
from .serializers import ProduccionSerializer

class ProduccionListCreateView(generics.ListCreateAPIView):
    """
    Vista para listar todos los registros de Producción (GET) o 
    crear un nuevo registro (POST).
    """
    # Consulta base para obtener todos los registros de Produccion.
    # No necesitamos prefetch_related aquí ya que las relaciones FK son simples
    # (Usuario y Fórmula).
    queryset = Produccion.objects.all() 
    serializer_class = ProduccionSerializer

class ProduccionDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Vista para ver (GET), actualizar (PUT/PATCH) o eliminar (DELETE)
    un registro de producción específico.
    """
    queryset = Produccion.objects.all()
    serializer_class = ProduccionSerializer
    lookup_field = 'folio'
