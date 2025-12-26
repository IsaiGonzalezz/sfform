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
                
                // Datos de la fórmula y lote
                lote: row.lote, 
                estatus: row.estatus, 
                id_form: row.id_form,
                nombre_formula: row.nombre_formula,
                
                // Usuarios involucrados
                nombre_usuario: row.nombre_usuario, // Quien registró (Admin/Supervisor)
                nombre_operador: row.nombre_operador, // Quien la trabaja (Operador RFID)

                // Valores numéricos del inventario
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

// GET: Obtener Inventario (Ajustado a tu Schema REAL + Operador)
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

        // --- QUERY CORREGIDA CON OPERADOR ---
        let sqlQuery = `
            SELECT 
                -- Tabla INVENTARIO
                i.Folio AS folio_inventario,
                i.LForm AS lote,        
                i.PReal AS p_real,      
                i.PObj AS p_obj,
                i.PDif AS p_dif,
                i.Fecha AS fecha,
                
                -- Tabla PRODUCCION
                p.Folio AS folio_produccion,
                p.OP AS op,
                p.Estatus AS estatus,
                
                -- Tabla FORMULAS
                f.IdForm AS id_form,
                f.Nombre AS nombre_formula,
                
                -- Tabla USUARIOS (Quien registró la orden administrativa)
                u.Nombre AS nombre_usuario,

                -- Tabla OPERADORES (Quien trabaja la orden en planta)
                -- Hacemos JOIN con la tabla de Operadores usando el RFID
                op.Nombre AS nombre_operador,

                -- Detalle de Ingredientes
                dp.IdIng AS iding,
                ing.Nombre AS nombre_ingrediente,
                dp.PesIng AS pesing,
                dp.Pesado AS pesado

            FROM Inventario i
            -- Joins principales
            LEFT JOIN Produccion p ON i.FolioProduccion = p.Folio
            LEFT JOIN Formulas f ON i.IdForm = f.IdForm
            LEFT JOIN Usuarios u ON i.IdUsu = u.id
            
            -- NUEVO JOIN: Obtener nombre del operador
            -- Relacionamos p.IdOperador (que tiene el RFID) con Operadores.RFID
            LEFT JOIN Operadores op ON p.IdOperador = op.RFID
            
            -- Join para ingredientes
            LEFT JOIN Detalle_Produccion dp ON p.Folio = dp.FolioProduccion
            LEFT JOIN Ingredientes ing ON dp.IdIng = ing.IdIng
            
            WHERE i.Fecha >= @fechaInicio AND i.Fecha <= @fechaFin
        `;

        // Filtro por Estatus
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