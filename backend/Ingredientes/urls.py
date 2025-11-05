from django.urls import path
from .views import IngredienteListCreateView, IngredienteDetailView

urlpatterns = [
    path('ingredientes/', IngredienteListCreateView.as_view(), name='ingrediente-list-create'),
    path('ingredientes/<str:iding>/', IngredienteDetailView.as_view(), name='ingrediente-detail'),
]