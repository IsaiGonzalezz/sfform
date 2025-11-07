from rest_framework import generics
from .models import Formulas
from .serializers import FormulaSerializer
# NOTA: La lógica de creación anidada ya está en tu 'FormulaSerializer',
# así que estas vistas pueden ser muy simples.

class FormulaListCreateView(generics.ListCreateAPIView):
    """
    Vista para listar todas las fórmulas (GET) o crear una nueva (POST).
    El Serializer se encarga de la lógica de anidación.
    """
    queryset = Formulas.objects.all().prefetch_related('detalle_formula_set__iding')
    serializer_class = FormulaSerializer

class FormulaDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Vista para ver (GET), actualizar (PUT/PATCH) o eliminar (DELETE)
    una fórmula específica usando su 'idform'.
    """
    queryset = Formulas.objects.all().prefetch_related('detalle_formula_set__iding')
    serializer_class = FormulaSerializer
    lookup_field = 'idform' # ¡Importante! Le dice a Django que use 'idform'