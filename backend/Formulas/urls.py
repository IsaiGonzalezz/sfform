from django.urls import path
from .views import FormulaListCreateView, FormulaDetailView

urlpatterns = [
    # URL para listar todas las fórmulas o crear una nueva
    # (POST a /api/formulas/)
    path('formulas/', FormulaListCreateView.as_view(), name='formula-list-create'),

    # URL para ver, actualizar o borrar una fórmula por su 'idform'
    # (GET, PUT, DELETE a /api/formulas/FRM-001/)
    path('formulas/<str:idform>/', FormulaDetailView.as_view(), name='formula-detail'),
]