from django.urls import path
from .views import InventarioViewSet

# Si usas el prefijo 'inventario/', la ruta sería más clara
# Si insistes en 'formulas/', usa el que prefieras
urlpatterns = [
    # Mapeamos la acción 'list' (listar todos) del ViewSet al método GET
    path('inventario/', InventarioViewSet.as_view({'get': 'list'}), name='inventario-list'),
    
    # Mapeamos la acción 'retrieve' (obtener uno) del ViewSet al método GET
    # El <pk> (primary key, que es 'folio')
    path('inventario/<int:pk>/', InventarioViewSet.as_view({'get': 'retrieve'}), name='inventario-detail'),
]