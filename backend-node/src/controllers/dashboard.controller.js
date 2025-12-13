const { getConnection, sql } = require('../../db');

exports.getDashboardData = async (req, res) => {
    try {
        const pool = await getConnection();
        
        // --- 1. Preparar Fechas ---
        const today = new Date();
        
        // Inicio de mes
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        
        // Hace 7 días
        const last7Days = new Date(today);
        last7Days.setDate(today.getDate() - 7);

        // --- 2. Ejecutar Consultas en Paralelo ---
        // Usamos Promise.all para velocidad. Si una falla, todo falla (puedes ajustar esto con try/catch individuales si prefieres)
        
        const [kpiResult, lineChartResult, barChartResult, pieChartResult] = await Promise.all([
            
            // Query 1: KPIs (Pendientes, Completados mes actual, Totales para eficiencia)
            pool.request()
                .input('startOfMonth', sql.DateTime, startOfMonth)
                .query(`
                    SELECT 
                        (SELECT COUNT(*) FROM Produccion WHERE estatus = 0) as pendientes,
                        (SELECT COUNT(*) FROM Produccion WHERE estatus = 1 AND fecha >= @startOfMonth) as completados,
                        (SELECT COUNT(*) FROM Produccion) as total_ordenes,
                        (SELECT COUNT(*) FROM Produccion WHERE estatus = 1) as lotes_terminados
                `),

            // Query 2: Gráfico Lineal (Producción últimos 7 días)
            pool.request()
                .input('last7Days', sql.DateTime, last7Days)
                .query(`
                    SELECT CAST(fecha AS DATE) as fecha_date, SUM(pesform) as total_kg 
                    FROM Produccion 
                    WHERE estatus = 1 AND fecha >= @last7Days
                    GROUP BY CAST(fecha AS DATE)
                    ORDER BY CAST(fecha AS DATE)
                `),

            // Query 3: Gráfico Barras (Top 5 Fórmulas)
            // Asumiendo JOIN entre Produccion.idform y Formulas.idform (o similar)
            pool.request()
                .query(`
                    SELECT TOP 5 f.nombre, COUNT(p.folio) as total_lotes
                    FROM Produccion p
                    JOIN Formulas f ON p.idform = f.idform
                    WHERE p.estatus = 1
                    GROUP BY f.nombre
                    ORDER BY total_lotes DESC
                `),

            // Query 4: Gráfico Pastel (Top Operadores)
            // Asumiendo JOIN entre Produccion.idusu y Usuario.idest (o la PK de usuario)
            pool.request()
                .query(`
                    SELECT TOP 5 u.nombre, COUNT(p.folio) as total
                    FROM Produccion p
                    JOIN Usuarios u ON p.idusu = u.id
                    WHERE p.estatus = 1
                    GROUP BY u.nombre
                    ORDER BY total DESC
                `)
        ]);

        // --- 3. Procesar Datos para el JSON ---

        // A) KPIs
        const kpiData = kpiResult.recordset[0];
        let eficiencia = 0;
        if (kpiData.total_ordenes > 0) {
            eficiencia = (kpiData.lotes_terminados / kpiData.total_ordenes) * 100;
        }

        // B) Line Chart (Formatear fecha dd/mm)
        const lineChartData = lineChartResult.recordset.map(item => {
            const d = new Date(item.fecha_date);
            // Formato dd/mm. Ojo: getMonth() es base 0
            const diaStr = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
            return {
                dia: diaStr,
                kgs: Math.round((item.total_kg || 0) * 100) / 100 // Round a 2 decimales
            };
        });

        // C) Bar Chart
        const barChartData = barChartResult.recordset.map(item => ({
            nombre: item.nombre,
            lotes: item.total_lotes
        }));

        // D) Pie Chart
        const pieChartData = pieChartResult.recordset.map(item => ({
            name: item.nombre || "Desconocido",
            value: item.total
        }));

        // --- 4. Respuesta Final ---
        const responseData = {
            kpi: {
                pendientes: kpiData.pendientes,
                completados: kpiData.completados,
                precision: parseFloat(eficiencia.toFixed(1)) // "precision" como pediste
            },
            lineChart: lineChartData,
            barChart: barChartData,
            pieChart: pieChartData
        };

        res.json(responseData);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};