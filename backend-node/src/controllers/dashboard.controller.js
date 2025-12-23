const { getConnection, sql } = require('../../db');

exports.getDashboardData = async (req, res) => {
    try {
        const pool = await getConnection();
        
        // --- 1. Obtener parámetros de filtro del Frontend (si existen) ---
        // Se esperan en formato YYYY-MM-DD. Si no llegan, se usan los defaults.
        const { startDate, endDate } = req.query;

        // --- 2. Preparar Fechas Default ---
        const today = new Date();
        
        // Default: Inicio de mes actual (Para KPIs y Bar/Pie si no hay filtro)
        let startOfPeriod = new Date(today.getFullYear(), today.getMonth(), 1);
        
        // Default: Hace 7 días (Para Line Chart si no hay filtro)
        let startOfLineChart = new Date(today);
        startOfLineChart.setDate(today.getDate() - 7);

        // Fin del periodo (Hoy por defecto)
        let endOfPeriod = new Date(today);
        // Ajustar al final del día para incluir registros de hoy
        endOfPeriod.setHours(23, 59, 59, 999);

        // --- 3. Lógica de Override con Filtros ---
        // Si el usuario manda fechas, las usamos para los gráficos históricos
        if (startDate) {
            startOfPeriod = new Date(startDate);
            startOfLineChart = new Date(startDate); // El gráfico lineal obedece al filtro
        }
        
        if (endDate) {
            endOfPeriod = new Date(endDate);
            endOfPeriod.setHours(23, 59, 59, 999);
        }

        // --- 4. Ejecutar Consultas en Paralelo ---
        const [kpiResult, lineChartResult, barChartResult, pieChartResult] = await Promise.all([
            
            // Query 1: KPIs (Generalmente fijos al mes actual o acumulados, pero pueden reaccionar al filtro si deseas)
            // Aquí mantengo la lógica de "Mes Actual" para 'completados' para comparar rendimiento mensual,
            // pero 'pendientes' y 'total' son fotos del estado actual.
            pool.request()
                .input('startOfMonth', sql.DateTime, new Date(today.getFullYear(), today.getMonth(), 1)) 
                .query(`
                    SELECT 
                        (SELECT COUNT(*) FROM Produccion WHERE estatus = 1) as pendientes,
                        (SELECT COUNT(*) FROM Produccion WHERE estatus = 0 AND fecha >= @startOfMonth) as completados,
                        (SELECT COUNT(*) FROM Produccion) as total_ordenes,
                        (SELECT COUNT(*) FROM Produccion WHERE estatus = 0) as lotes_terminados
                `),

            // Query 2: Gráfico Lineal (Producción por día)
            // Usa las fechas dinámicas (Filtro o últimos 7 días)
            pool.request()
                .input('startDate', sql.DateTime, startOfLineChart)
                .input('endDate', sql.DateTime, endOfPeriod)
                .query(`
                    SELECT CAST(fecha AS DATE) as fecha_date, SUM(pesform) as total_kg 
                    FROM Produccion 
                    WHERE estatus = 0 
                      AND fecha >= @startDate 
                      AND fecha <= @endDate
                    GROUP BY CAST(fecha AS DATE)
                    ORDER BY CAST(fecha AS DATE)
                `),

            // Query 3: Gráfico Barras (Top 5 Fórmulas más producidas)
            // Usa el rango de fechas definido
            pool.request()
                .input('startDate', sql.DateTime, startOfPeriod)
                .input('endDate', sql.DateTime, endOfPeriod)
                .query(`
                    SELECT TOP 5 f.nombre, COUNT(p.folio) as total_lotes
                    FROM Produccion p
                    JOIN Formulas f ON p.idform = f.idform
                    WHERE p.estatus = 0 
                      AND p.fecha >= @startDate 
                      AND p.fecha <= @endDate
                    GROUP BY f.nombre
                    ORDER BY total_lotes DESC
                `),

            // Query 4: Gráfico Pastel (Eficiencia por Operador REAL)
            // Se filtra por estatus=0 (Terminados) y que IdOperador no sea nulo.
            pool.request()
                .input('startDate', sql.DateTime, startOfPeriod)
                .input('endDate', sql.DateTime, endOfPeriod)
                .query(`
                    SELECT TOP 5 op.nombre, COUNT(p.folio) as total
                    FROM Produccion p
                    INNER JOIN Operadores op ON p.IdOperador = op.RFID
                    WHERE p.estatus = 0 
                      AND p.fecha >= @startDate 
                      AND p.fecha <= @endDate
                    GROUP BY op.nombre
                    ORDER BY total DESC
                `)
        ]);

        // --- 5. Procesar Datos para el JSON ---

        // A) KPIs
        const kpiData = kpiResult.recordset[0];
        let eficiencia = 0;
        // Calculamos eficiencia: Lotes terminados vs Total de Ordenes históricas
        if (kpiData.total_ordenes > 0) {
            eficiencia = (kpiData.lotes_terminados / kpiData.total_ordenes) * 100;
        }

        // B) Line Chart (Formatear fecha dd/mm)
        const lineChartData = lineChartResult.recordset.map(item => {
            const d = new Date(item.fecha_date);
            // Ajuste de zona horaria simple para visualización
            const userTimezoneOffset = d.getTimezoneOffset() * 60000;
            const adjustedDate = new Date(d.getTime() + userTimezoneOffset);
            
            const diaStr = `${adjustedDate.getDate().toString().padStart(2, '0')}/${(adjustedDate.getMonth() + 1).toString().padStart(2, '0')}`;
            return {
                dia: diaStr,
                kgs: Math.round((item.total_kg || 0) * 100) / 100
            };
        });

        // C) Bar Chart
        const barChartData = barChartResult.recordset.map(item => ({
            nombre: item.nombre,
            lotes: item.total_lotes
        }));

        // D) Pie Chart (Operadores)
        // Nota: 'item.nombre' aquí viene directamente de IdOperador (ej. "OEGI3")
        const pieChartData = pieChartResult.recordset.map(item => ({
            name: item.nombre || "Sin Asignar", 
            value: item.total
        }));

        // --- 6. Respuesta Final ---
        const responseData = {
            kpi: {
                pendientes: kpiData.pendientes,
                completados: kpiData.completados, // Mes actual
                precision: parseFloat(eficiencia.toFixed(1))
            },
            lineChart: lineChartData,
            barChart: barChartData,
            pieChart: pieChartData,
            // Devolvemos las fechas usadas para que el front sepa qué rango se aplicó
            meta: {
                startDate: startOfPeriod,
                endDate: endOfPeriod
            }
        };

        res.json(responseData);

    } catch (error) {
        console.error("Error en Dashboard Data:", error);
        res.status(500).json({ error: error.message });
    }
};