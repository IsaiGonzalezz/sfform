from django.urls import path
from .views import UsuarioListCreateView, UsuarioDetailView

urlpatterns = [
    #ruta para obtener todos los usuarios y CREAR un nuevo usuario
    path('usuarios/', UsuarioListCreateView.as_view(), name='usuario-list-create'),

    # Esta ruta maneja GET/PUT/DELETE para un usuario específico por su RFID
    path('usuarios/<int:id>/', UsuarioDetailView.as_view(), name='usuario-detail'),
]