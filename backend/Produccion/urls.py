from django.urls import path
from .views import ProduccionListCreateView, ProduccionDetailView

urlpatterns = [
    path('produccion/', ProduccionListCreateView.as_view(), name='produccion-list-create'),
    path('produccion/<int:folio>/', ProduccionDetailView.as_view(), name='produccion-detail'),
]