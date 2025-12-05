from django.urls import path
from .views import DashboardDataView

urlpatterns = [
    path('resumen/', DashboardDataView.as_view(), name='dashboard-resumen'),    
]