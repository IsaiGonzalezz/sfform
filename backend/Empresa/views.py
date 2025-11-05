# empresa/views.py
from rest_framework import generics
from rest_framework.parsers import MultiPartParser, FormParser # <-- Importa los parsers
from .models import Empresa
from .serializers import EmpresaSerializer

class EmpresaListCreateView(generics.ListCreateAPIView):
    queryset = Empresa.objects.all()
    serializer_class = EmpresaSerializer
    # Añade explícitamente los parsers para manejar archivos
    parser_classes = [MultiPartParser, FormParser]

class EmpresaDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Empresa.objects.all()
    serializer_class = EmpresaSerializer
    lookup_field = 'rfc'
    # Añade explícitamente los parsers también aquí
    parser_classes = [MultiPartParser, FormParser]