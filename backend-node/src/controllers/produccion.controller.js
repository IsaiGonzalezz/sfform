const { getConnection, sql } = require('../../db');

// --- HELPER PARA AGRUPAR RESULTADOS (Igual que en Fórmulas) ---
const agruparProduccion = (recordset) => {
    const produccionMap = new Map();

    recordset.forEach(row => {
        // Si el folio no está en el mapa, lo agregamos (Cabecera)
        if (!produccionMap.has(row.folio)) {
            produccionMap.set(row.folio, {
                folio: row.folio,
                op: row.op,
                idform: row.idform,
                nombre_formula: row.nombre_formula, // Traído del JOIN
                lote: row.lote,
                pesform: row.pesform,
                estatus: row.estatus,
                fecha: row.fecha,
                idusu: row.idusu,
                nombre_usuario: row.nombre_usuario, // Traído del JOIN
                detalles: [] // Array para los hijos
            });
        }
        
        // Si la fila tiene datos de detalle, lo agregamos al array
        if (row.iddetalleproduccion) {
            produccionMap.get(row.folio).detalles.push({
                iddetalleproduccion: row.iddetalleproduccion,
                iding: row.iding,
                nombre_ingrediente: row.nombre_ingrediente, // Traído del JOIN
                pesing: row.pesing,
                pmax: row.pmax,
                pmin: row.pmin,
                pesado: row.pesado // bit/boolean
            });
        }
    });

    return Array.from(produccionMap.values());
};

// GET: Obtener todas las producciones (Con nombres de usuario, fórmula e ingredientes)
exports.getProducciones = async (req, res) => {
    // 1. Recibimos el parámetro del Switch
    const { verTodos } = req.query;

    try {
        const pool = await getConnection();

        // 2. Definimos la consulta base (sin el WHERE ni el ORDER BY todavía)
        let query = `
            SELECT 
                p.folio AS folio,
                p.op AS op,
                p.IdForm AS idform,
                f.nombre AS nombre_formula,
                p.lote AS lote,
                p.pesform AS pesform,
                p.estatus AS estatus,
                p.fecha AS fecha,
                p.IdUsu AS idusu,
                u.Nombre AS nombre_usuario,
                
                dp.iddetalleproduccion AS iddetalleproduccion,
                dp.IdIng AS iding,
                i.nombre AS nombre_ingrediente,
                dp.pesing AS pesing,
                dp.pmax AS pmax,
                dp.pmin AS pmin,
                dp.pesado AS pesado

            FROM Produccion p
            LEFT JOIN Formulas f ON p.IdForm = f.idform
            LEFT JOIN Usuarios u ON p.IdUsu = u.id
            LEFT JOIN Detalle_Produccion dp ON p.folio = dp.FolioProduccion
            LEFT JOIN Ingredientes i ON dp.IdIng = i.iding
        `;

        // 3. LÓGICA DEL FILTRO:
        // Si NO me piden "verTodos", agrego el WHERE para ver solo estatus = 1
        if (verTodos !== 'true') {
            query += ' WHERE p.estatus = 1';
        }

        // 4. Cerramos con el ordenamiento
        query += ' ORDER BY p.fecha DESC';

        const result = await pool.request().query(query);

        const response = agruparProduccion(result.recordset);
        res.json(response);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// GET: Obtener una producción por Folio
exports.getProduccionByFolio = async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('folio', sql.Int, req.params.folio)
            .query(`
                SELECT 
                    p.folio AS folio,
                    p.op AS op,
                    p.IdForm AS idform,
                    f.nombre AS nombre_formula,
                    p.lote AS lote,
                    p.pesform AS pesform,
                    p.estatus AS estatus,
                    p.fecha AS fecha,
                    p.IdUsu AS idusu,
                    u.Nombre AS nombre_usuario,
                    
                    dp.iddetalleproduccion AS iddetalleproduccion,
                    dp.IdIng AS iding,
                    i.nombre AS nombre_ingrediente,
                    dp.pesing AS pesing,
                    dp.pmax AS pmax,
                    dp.pmin AS pmin,
                    dp.pesado AS pesado

                FROM Produccion p
                LEFT JOIN Formulas f ON p.IdForm = f.idform
                LEFT JOIN Usuarios u ON p.IdUsu = u.id
                LEFT JOIN Detalle_Produccion dp ON p.folio = dp.FolioProduccion
                LEFT JOIN Ingredientes i ON dp.IdIng = i.iding
                WHERE p.folio = @folio
            `);

        const response = agruparProduccion(result.recordset);

        if (response.length === 0) return res.status(404).json({ message: 'Producción no encontrada' });

        res.json(response[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// POST: Crear Producción + Detalles (TRANSACCIÓN)
exports.createProduccion = async (req, res) => {
    const { op, idform, lote, pesform, estatus, fecha, idusu, detalles } = req.body;
    // 'detalles' es el array de ingredientes con sus pesos

    const pool = await getConnection();
    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();

        // 1. Insertar Cabecera y obtener el ID generado (SCOPE_IDENTITY)
        const resultHeader = await transaction.request()
            .input('op', sql.VarChar, op)
            .input('idform', sql.VarChar, idform)
            .input('lote', sql.VarChar, lote)
            .input('pesform', sql.Float, pesform)
            .input('estatus', sql.Int, estatus || 0)
            .input('fecha', sql.DateTime, fecha) // Asegúrate que el front mande formato válido (ISO string)
            .input('idusu', sql.Int, idusu)
            .query(`
                INSERT INTO Produccion (op, IdForm, lote, pesform, estatus, fecha, IdUsu) 
                VALUES (@op, @idform, @lote, @pesform, @estatus, @fecha, @idusu);
                SELECT SCOPE_IDENTITY() AS folio;
            `);

        const nuevoFolio = resultHeader.recordset[0].folio;

        // 2. Insertar Detalles (si existen)
        if (detalles && detalles.length > 0) {
            for (const item of detalles) {
                // Manejo de objeto vs string en iding (por si el front manda {iding: 'x'} o 'x')
                const idIngrediente = typeof item.iding === 'object' ? item.iding.iding : item.iding;

                await transaction.request()
                    .input('folio', sql.Int, nuevoFolio)
                    .input('iding', sql.VarChar, idIngrediente)
                    .input('pesing', sql.Float, item.pesing)
                    .input('pmax', sql.Float, item.pmax)
                    .input('pmin', sql.Float, item.pmin)
                    .input('pesado', sql.Bit, item.pesado || 0)
                    .query(`
                        INSERT INTO Detalle_Produccion (FolioProduccion, IdIng, pesing, pmax, pmin, pesado) 
                        VALUES (@folio, @iding, @pesing, @pmax, @pmin, @pesado)
                    `);
            }
        }

        await transaction.commit();
        res.status(201).json({ message: 'Orden de Producción creada', folio: nuevoFolio });

    } catch (error) {
        await transaction.rollback();
        res.status(500).json({ error: error.message });
    }
};

// PUT: Actualizar Producción (Estrategia Nuclear: Borrar Detalles y Recrear)
exports.updateProduccion = async (req, res) => {
    const { folio } = req.params;
    const { op, idform, lote, pesform, estatus, fecha, idusu, detalles } = req.body;

    const pool = await getConnection();
    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();

        // 1. Actualizar Cabecera
        const resultHeader = await transaction.request()
            .input('folio', sql.Int, folio)
            .input('op', sql.VarChar, op)
            .input('idform', sql.VarChar, idform)
            .input('lote', sql.VarChar, lote)
            .input('pesform', sql.Float, pesform)
            .input('estatus', sql.Int, estatus)
            .input('fecha', sql.DateTime, fecha)
            .input('idusu', sql.Int, idusu)
            .query(`
                UPDATE Produccion SET 
                    op=@op, IdForm=@idform, lote=@lote, pesform=@pesform, 
                    estatus=@estatus, fecha=@fecha, IdUsu=@idusu
                WHERE folio = @folio
            `);

        if (resultHeader.rowsAffected[0] === 0) {
            await transaction.rollback();
            return res.status(404).json({ message: 'Producción no encontrada' });
        }

        // 2. Actualizar Detalles (Si se envía la lista 'detalles')
        if (detalles) {
            // A. Borrar anteriores
            await transaction.request()
                .input('folio', sql.Int, folio)
                .query('DELETE FROM Detalle_Produccion WHERE FolioProduccion = @folio');

            // B. Insertar nuevos
            for (const item of detalles) {
                const idIngrediente = typeof item.iding === 'object' ? item.iding.iding : item.iding;

                await transaction.request()
                    .input('folio', sql.Int, folio)
                    .input('iding', sql.VarChar, idIngrediente)
                    .input('pesing', sql.Float, item.pesing)
                    .input('pmax', sql.Float, item.pmax)
                    .input('pmin', sql.Float, item.pmin)
                    .input('pesado', sql.Bit, item.pesado || 0)
                    .query(`
                        INSERT INTO Detalle_Produccion (FolioProduccion, IdIng, pesing, pmax, pmin, pesado) 
                        VALUES (@folio, @iding, @pesing, @pmax, @pmin, @pesado)
                    `);
            }
        }

        await transaction.commit();
        res.json({ message: 'Producción actualizada correctamente' });

    } catch (error) {
        await transaction.rollback();
        res.status(500).json({ error: error.message });
    }
};

// PATCH: Actualización Parcial
exports.patchProduccion = async (req, res) => {
    const { folio } = req.params;
    const updates = req.body; // Puede traer solo { estatus: 1 }

    const pool = await getConnection();
    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();

        // 1. Actualizar campos de cabecera dinámicamente
        // Mapeo Frontend -> Backend (Si difieren, agrégalos aquí)
        const columnMap = {
            'idform': 'IdForm',
            'idusu': 'IdUsu'
        };

        let setClauses = [];
        const request = transaction.request().input('folio', sql.Int, folio);

        for (const key in updates) {
            if (key !== 'detalles' && Object.prototype.hasOwnProperty.call(updates, key)) {
                let value = updates[key];
                const dbColumn = columnMap[key] || key;
                
                // Asignar tipo de dato si es necesario (ej. Date)
                let type = sql.VarChar;
                if (key === 'estatus' || key === 'idusu') type = sql.Int;
                if (key === 'pesform') type = sql.Float;
                if (key === 'fecha') type = sql.DateTime;

                request.input(key, type, value);
                setClauses.push(`${dbColumn} = @${key}`);
            }
        }

        if (setClauses.length > 0) {
            const query = `UPDATE Produccion SET ${setClauses.join(', ')} WHERE folio = @folio`;
            await request.query(query);
        }

        // 2. Si vienen detalles, los reemplazamos (Lógica Nuclear)
        if (updates.detalles) {
            await transaction.request()
                .input('folio', sql.Int, folio)
                .query('DELETE FROM Detalle_Produccion WHERE FolioProduccion = @folio');

            for (const item of updates.detalles) {
                const idIngrediente = typeof item.iding === 'object' ? item.iding.iding : item.iding;
                await transaction.request()
                    .input('folio', sql.Int, folio)
                    .input('iding', sql.VarChar, idIngrediente)
                    .input('pesing', sql.Float, item.pesing)
                    .input('pmax', sql.Float, item.pmax)
                    .input('pmin', sql.Float, item.pmin)
                    .input('pesado', sql.Bit, item.pesado || 0)
                    .query(`
                        INSERT INTO Detalle_Produccion (FolioProduccion, IdIng, pesing, pmax, pmin, pesado) 
                        VALUES (@folio, @iding, @pesing, @pmax, @pmin, @pesado)
                    `);
            }
        }

        await transaction.commit();
        res.json({ message: 'Producción actualizada parcialmente (PATCH)' });

    } catch (error) {
        await transaction.rollback();
        res.status(500).json({ error: error.message });
    }
};



// DELETE: Eliminar por OP (Orden de Producción)
exports.deleteProduccion = async (req, res) => {
    // Ahora esperamos recibir 'op' en la URL, no 'folio'
    const { op } = req.params;

    const pool = await getConnection();
    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();

        // PASO 1: Eliminar los DETALLES asociados a esa OP
        // Usamos una SUBCONSULTA: "Borra de Detalle donde el FolioProduccion esté en la lista de Folios de esta OP"
        await transaction.request()
            .input('op', sql.VarChar, op)
            .query(`
                DELETE FROM Detalle_Produccion 
                WHERE FolioProduccion IN (
                    SELECT Folio FROM Produccion WHERE OP = @op
                )
            `);

        // PASO 2: Eliminar las CABECERAS (Producción) con esa OP
        const result = await transaction.request()
            .input('op', sql.VarChar, op)
            .query('DELETE FROM Produccion WHERE OP = @op');

        // Si no se borró ninguna fila en el paso 2, es que la OP no existía
        if (result.rowsAffected[0] === 0) {
            await transaction.rollback();
            return res.status(404).json({ message: 'No se encontraron registros con esa OP' });
        }

        await transaction.commit();
        res.json({ message: `Orden de Producción ${op} y sus detalles eliminados correctamente` });

    } catch (error) {
        await transaction.rollback();
        res.status(500).json({ error: error.message });
    }
};


// DESACTIVAR TODOS LOS FOLIOS DE UNA OP
exports.desactivarPorOP = async (req, res) => {
    const { op } = req.params; // Leemos la OP (ej: "OP-2023-01")

    try {
        const pool = await getConnection();
        
        // UPDATE masivo: Cambia estatus a 0 donde la OP coincida
        const result = await pool.request()
            .input('op', sql.VarChar, op)
            .query('UPDATE Produccion SET estatus = 0 WHERE OP = @op');

        // Opcional: Validar si encontró algo
        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ message: 'No se encontró esa OP' });
        }

        res.json({ message: `Se desactivaron ${result.rowsAffected[0]} registros asociados a la OP ${op}` });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};