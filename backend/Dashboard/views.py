from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Count, Sum
from django.utils import timezone
from datetime import timedelta

from Produccion.models import Produccion, DetalleProduccion
from Formulas.models import Formulas
from Usuarios.models import Usuario

class DashboardDataView(APIView):

    def get(self, request):
        today = timezone.now()
        last_7_days = today - timedelta(days=7)
        start_of_month = today.replace(day=1, hour=0, minute=0, second=0)

        # ==========================================
        # 1. CARDS SUPERIORES (KPIs)
        # ==========================================
        
        # Pendientes: Usamos 'estatus' (minúscula)
        pendientes = Produccion.objects.filter(estatus=0).count()
        
        # Completados: Usamos 'estatus' y 'fecha'
        completados = Produccion.objects.filter(
            estatus=1, 
            fecha__gte=start_of_month
        ).count()

        # Lógica: (Lotes Terminados / Total de Lotes) * 100
        
        total_ordenes = Produccion.objects.count()
        lotes_terminados = Produccion.objects.filter(estatus=1).count()
        
        if total_ordenes > 0:
            eficiencia = (lotes_terminados / total_ordenes) * 100
        else:
            eficiencia = 0
            
        # Lo guardamos en la variable que ya usábamos para no romper el JSON
        promedio_calidad = round(eficiencia, 1)


        # ==========================================
        # 2. GRÁFICO LINEAL (Producción 7 días)
        # ==========================================
        # Usamos 'pesform' (minúscula) y 'fecha'
        produccion_semanal = (
            Produccion.objects
            .filter(fecha__gte=last_7_days, estatus=1)
            .values('fecha__date')
            .annotate(total_kg=Sum('pesform'))
            .order_by('fecha__date')
        )

        line_chart_data = []
        for item in produccion_semanal:
            # item['fecha__date'] puede variar según la DB (Postgres/MySQL/SQLite)
            # Aseguramos que sea string
            fecha_str = item['fecha__date'].strftime('%d/%m') if hasattr(item['fecha__date'], 'strftime') else str(item['fecha__date'])
            
            line_chart_data.append({
                "dia": fecha_str,
                "kgs": round(item['total_kg'] or 0, 2)
            })


        # ==========================================
        # 3. GRÁFICO BARRAS (Top 5 Fórmulas)
        # ==========================================
        # Produccion.idform -> Formulas.nombre
        
        top_formulas_query = (
            Produccion.objects
            .filter(estatus=1)
            .values('idform__nombre') 
            .annotate(total_lotes=Count('folio'))
            .order_by('-total_lotes')[:5]
        )

        bar_chart_data = [
            {"nombre": item['idform__nombre'], "lotes": item['total_lotes']}
            for item in top_formulas_query
            if item['idform__nombre'] # Filtramos nulos
        ]


        # ==========================================
        # 4. GRÁFICO PASTEL (Top Operadores)
        # ==========================================
        # Produccion.idusu -> Usuario.nombre
        top_operadores_query = (
            Produccion.objects
            .filter(estatus=1)
            .values('idusu__nombre')
            .annotate(total=Count('folio'))
            .order_by('-total')[:5]
        )

        pie_chart_data = [
            {"name": item['idusu__nombre'] or "Desconocido", "value": item['total']}
            for item in top_operadores_query
        ]


        # ==========================================
        # RESPUESTA FINAL
        # ==========================================
        data = {
            "kpi": {
                "pendientes": pendientes,
                "completados": completados,
                "precision": promedio_calidad
            },
            "lineChart": line_chart_data,
            "barChart": bar_chart_data,
            "pieChart": pie_chart_data
        }

        return Response(data)