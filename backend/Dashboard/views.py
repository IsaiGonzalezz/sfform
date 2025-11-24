from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated # Asegura el 401
from rest_framework import status

class DashboardDataView(APIView):
    # Esto le dice a DRF: "Si no hay un token válido, devuelve 401"
    permission_classes = [IsAuthenticated] 

    def get(self, request):
        # Datos estáticos MÍNIMOS que tu frontend espera para renderizar
        data = {
            "stat_cards": {
                "pendientes": 0, "proceso": 0, "completados": 0, "calidad_prom": "0%"
            },
            "line_data": [],
            "pie_data": [],
            "bar_data": [],
        }
        
        # Devuelve 200 OK si el token es válido
        return Response(data, status=status.HTTP_200_OK)