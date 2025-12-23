const { getConnection, sql } = require('../../db');

// --- HELPER PARA AGRUPAR ---
const agruparInventario = (recordset) => {
    const inventarioMap = new Map();

    recordset.forEach(row => {
        // Usamos el folio_inventario como clave única
        if (!inventarioMap.has(row.folio_inventario)) {
            inventarioMap.set(row.folio_inventario, {
                folio_inventario: row.folio_inventario,
                folio_produccion: row.folio_produccion,
                op: row.op,
                
                // CORRECCIÓN: Usamos LForm que es lo que viene en tu tabla Inventario
                lote: row.lote, 
                
                // CORRECCIÓN: Estatus viene de PRODUCCIÓN, Inventario no tiene.
                estatus: row.estatus, 
                
                id_form: row.id_form,
                nombre_formula: row.nombre_formula,
                nombre_usuario: row.nombre_usuario,

                // CORRECCIÓN: Mapeo exacto a tus columnas de Inventario
                p_obj: row.p_obj,   
                p_real: row.p_real, 
                p_dif: row.p_dif,   
                
                fecha: row.fecha, 

                ingredientes: [] 
            });
        }

        // Llenado de Ingredientes (Si existen en el detalle de producción)
        if (row.iding) {
            inventarioMap.get(row.folio_inventario).ingredientes.push({
                iding: row.iding,
                nombre_ingrediente: row.nombre_ingrediente,
                pesing: row.pesing,
                pesado: row.pesado
            });
        }
    });

    return Array.from(inventarioMap.values());
};

// GET: Obtener Inventario (Ajustado a tu Schema REAL)
exports.getInventario = async (req, res) => {
    try {
        const pool = await getConnection();
        
        const { desde, hasta, estatus } = req.query;

        // --- FILTROS DE FECHA ---
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

        // --- QUERY CORREGIDA BASADA EN TU SCRIPT ---
        let sqlQuery = `
            SELECT 
                -- Tabla INVENTARIO (Según tu CREATE TABLE)
                i.Folio AS folio_inventario,
                i.LForm AS lote,        
                i.PReal AS p_real,      
                i.PObj AS p_obj,
                i.PDif AS p_dif,
                i.Fecha AS fecha,
                
                -- Tabla PRODUCCION (Para obtener OP y Estatus)
                p.Folio AS folio_produccion,
                p.OP AS op,
                p.Estatus AS estatus,   -- El estatus está en Produccion, no en Inventario
                
                -- Tabla FORMULAS
                f.IdForm AS id_form,
                f.Nombre AS nombre_formula,
                
                -- Tabla USUARIOS
                u.Nombre AS nombre_usuario,

                -- Detalle de Ingredientes (Via Producción)
                dp.IdIng AS iding,
                ing.Nombre AS nombre_ingrediente,
                dp.PesIng AS pesing,
                dp.Pesado AS pesado

            FROM Inventario i
            -- Joins necesarios
            LEFT JOIN Produccion p ON i.FolioProduccion = p.Folio
            LEFT JOIN Formulas f ON i.IdForm = f.IdForm
            LEFT JOIN Usuarios u ON i.IdUsu = u.id
            
            -- Join para sacar ingredientes (opcional, visualización)
            LEFT JOIN Detalle_Produccion dp ON p.Folio = dp.FolioProduccion
            LEFT JOIN Ingredientes ing ON dp.IdIng = ing.IdIng
            
            WHERE i.Fecha >= @fechaInicio AND i.Fecha <= @fechaFin
        `;

        // Filtro por Estatus (OJO: Filtrará por el estatus de la PRODUCCIÓN, porque Inventario no tiene)
        if (estatus !== undefined && estatus !== 'todos') {
            request.input('estatusVal', sql.Int, estatus);
            sqlQuery += ` AND p.Estatus = @estatusVal`;
        }

        sqlQuery += ` ORDER BY i.Fecha DESC`;

        const result = await request.query(sqlQuery);
        
        const response = agruparInventario(result.recordset);
        
        res.json(response);

    } catch (error) {
        console.error("Error en getInventario:", error);
        res.status(500).json({ error: error.message });
    }
};