from django.urls import path
from .views import EstacionListCreateView, EstacionDetailView

urlpatterns = [
    # URL for listing all stations or creating a new one
    # e.g., /api/estaciones/
    path('estaciones/', EstacionListCreateView.as_view(), name='estacion-list-create'),

    # URL for getting, updating, or deleting a specific station by its idest
    # e.g., /api/estaciones/EST001/
    path('estaciones/<str:idest>/', EstacionDetailView.as_view(), name='estacion-detail'),
]