const { getConnection, sql } = require('../../db');

// --- HELPER PARA AGRUPAR ---
const agruparInventario = (recordset) => {
    const inventarioMap = new Map();

    recordset.forEach(row => {
        // CORRECCIÓN AQUÍ: Usamos 'folio_produccion' porque 'folio_inventario' ya no existe en la query
        if (!inventarioMap.has(row.folio_produccion)) {
            inventarioMap.set(row.folio_produccion, {
                // Usamos el folio de producción como ID único
                folio_inventario: row.folio_produccion, 
                folio_produccion: row.folio_produccion,
                op: row.op,
                lote: row.lote,
                estatus: row.estatus,
                
                id_form: row.id_form,
                nombre_formula: row.nombre_formula,
                nombre_usuario: row.nombre_usuario,

                p_obj: row.p_obj,
                p_real: row.p_real,
                p_dif: row.p_dif,
                fecha: row.fecha,

                ingredientes: [] 
            });
        }

        // Llenado de Ingredientes
        if (row.iding) {
            // CORRECCIÓN AQUÍ TAMBIÉN:
            inventarioMap.get(row.folio_produccion).ingredientes.push({
                iding: row.iding,
                nombre_ingrediente: row.nombre_ingrediente,
                pesing: row.pesing,
                pesado: row.pesado
            });
        }
    });

    return Array.from(inventarioMap.values());
};

// GET: Obtener Inventario FILTRADO (Server-Side)
exports.getInventario = async (req, res) => {
    try {
        const pool = await getConnection();
        
        const { desde, hasta, estatus } = req.query;

        // Lógica de Fechas por defecto (Ultimos 7 días)
        let fechaInicio = new Date();
        fechaInicio.setDate(fechaInicio.getDate() - 7); 
        
        let fechaFin = new Date(); 

        if (desde) fechaInicio = new Date(desde);
        
        if (hasta) {
            fechaFin = new Date(hasta);
            fechaFin.setHours(23, 59, 59, 999); 
        } else {
            fechaFin.setHours(23, 59, 59, 999);
        }

        const request = pool.request()
            .input('fechaInicio', sql.DateTime, fechaInicio)
            .input('fechaFin', sql.DateTime, fechaFin);

        let sqlQuery = `
            SELECT 
                p.Folio AS folio_produccion,
                p.OP AS op,
                p.Lote AS lote,
                p.Estatus AS estatus,
                p.Fecha AS fecha,
                p.PesForm AS p_obj,
                p.IdForm AS id_form,
                f.nombre AS nombre_formula,
                u.Nombre AS nombre_usuario,
                -- Subconsulta para sumar lo pesado
                (SELECT SUM(dp_sum.PesIng) FROM Detalle_Produccion dp_sum WHERE dp_sum.FolioProduccion = p.Folio) AS peso_real_acumulado,
                
                dp.IdIng AS iding,
                i.nombre AS nombre_ingrediente,
                dp.PesIng AS pesing,
                dp.Pesado AS pesado
            FROM Produccion p
            LEFT JOIN Formulas f ON p.IdForm = f.idform
            LEFT JOIN Usuarios u ON p.IdUsu = u.id
            LEFT JOIN Detalle_Produccion dp ON p.Folio = dp.FolioProduccion
            LEFT JOIN Ingredientes i ON dp.IdIng = i.iding
            
            WHERE p.Fecha >= @fechaInicio AND p.Fecha <= @fechaFin
        `;

        if (estatus !== undefined && estatus !== 'todos') {
            request.input('estatusVal', sql.Int, estatus);
            sqlQuery += ` AND p.Estatus = @estatusVal`;
        }

        sqlQuery += ` ORDER BY p.Fecha DESC`;

        const result = await request.query(sqlQuery);
        
        // Calculamos Diferencia en JS antes de agrupar o dentro del helper
        // Para simplificar, lo haremos mapeando el recordset antes o ajustando el helper.
        // Ajuste rápido: El helper lo recibe plano, calculamos ahí.
        
        // Pequeño ajuste al recordset para calcular p_dif y p_real si vienen nulos
        const dataCalculada = result.recordset.map(row => ({
            ...row,
            p_real: row.peso_real_acumulado || 0,
            p_dif: (row.peso_real_acumulado || 0) - (row.p_obj || 0)
        }));

        const response = agruparInventario(dataCalculada);
        
        res.json(response);

    } catch (error) {
        console.error("Error en getInventario:", error);
        res.status(500).json({ error: error.message });
    }
};