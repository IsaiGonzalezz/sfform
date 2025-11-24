from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import MyTokenObtainPairView

urlpatterns = [
    # Endpoint para el Login. Devuelve {access: '...', refresh: '...'}
    path('token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    
    # Endpoint para refrescar el token de acceso cuando expire
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]