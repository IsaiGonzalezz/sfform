# operadores/urls.py
from django.urls import path
from .views import OperadorListCreateView, OperadorDetailView

urlpatterns = [
    # api creacion de registro
    path('operadores/', OperadorListCreateView.as_view(), name='operador-list-create'),
    # api para editar, eliminar
    path('operadores/<str:rfid>/', OperadorDetailView.as_view(), name='operador-detail'),
]