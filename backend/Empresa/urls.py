from django.urls import path
from .views import EmpresaListCreateView, EmpresaDetailView

urlpatterns = [
    path('empresa/', EmpresaListCreateView.as_view(), name='empresa-list-create'),
    path('empresa/<str:rfc>/', EmpresaDetailView.as_view(), name='empresa-detail'),
]