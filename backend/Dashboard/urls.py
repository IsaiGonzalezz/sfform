from django.urls import path
from .views import DashboardDataView

urlpatterns = [
    path('dashboard_data/', DashboardDataView.as_view(),name='dashboard-data'),    
]