from rest_framework import generics
from .models import Ingredientes
from .serializers import IngredienteSerializer

class IngredienteListCreateView(generics.ListCreateAPIView):
    queryset = Ingredientes.objects.all()
    serializer_class = IngredienteSerializer

class IngredienteDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Ingredientes.objects.all()
    serializer_class = IngredienteSerializer
    lookup_field = 'iding'