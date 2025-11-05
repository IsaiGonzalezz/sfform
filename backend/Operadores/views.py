# operadores/views.py
from rest_framework import generics
from .models import Operadores
from .serializers import OperadorSerializer

# Vista para Listar (GET) y Crear (POST)
class OperadorListCreateView(generics.ListCreateAPIView):
    queryset = Operadores.objects.all()
    serializer_class = OperadorSerializer

# Vista para Detalle (GET uno), Actualizar (PUT/PATCH) y Borrar (DELETE)
class OperadorDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Operadores.objects.all()
    serializer_class = OperadorSerializer
    lookup_field = 'rfid' # Usamos rfid para identificar al operador