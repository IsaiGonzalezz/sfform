from rest_framework import generics
from .models import Estaciones
from .serializers import EstacionSerializer

# Handles GET (all) and POST (create) requests
class EstacionListCreateView(generics.ListCreateAPIView):
    queryset = Estaciones.objects.all()
    serializer_class = EstacionSerializer

# Handles GET (one), PUT/PATCH (update), and DELETE requests
class EstacionDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Estaciones.objects.all()
    serializer_class = EstacionSerializer
    lookup_field = 'idest' # Use 'idest' to find a specific station in the URL