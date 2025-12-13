const { getConnection, sql } = require('../../db');

// --- HELPER PARA AGRUPAR RESULTADOS ---
// Convierte el resultado plano del JOIN en un JSON anidado
const agruparFormulas = (recordset) => {
    const formulasMap = new Map();

    recordset.forEach(row => {
        if (!formulasMap.has(row.idform)) {
            formulasMap.set(row.idform, {
                idform: row.idform,
                nombre: row.nombre,
                // ANTES DECÍA: ingredientes: []
                // AHORA LO CAMBIAMOS A:
                detalles: [] 
            });
        }
        
        if (row.iddetalle) {
            // ANTES: formulasMap.get(row.idform).ingredientes.push
            // AHORA:
            formulasMap.get(row.idform).detalles.push({
                iddetalle: row.iddetalle,
                cantidad: row.cantidad,
                tolerancia: row.tolerancia,
                iding: row.iding, 
                nombre_ingrediente: row.nombre_ingrediente
            });
        }
    });

    return Array.from(formulasMap.values());
};

// GET: Obtener todas las fórmulas con sus detalles
exports.getFormulas = async (req, res) => {
    try {
        const pool = await getConnection();
        // JOIN entre Formulas, Detalle y Ingredientes
        // Usamos ALIAS para forzar minúsculas
        const result = await pool.request().query(`
            SELECT 
                f.idform AS idform,
                f.nombre AS nombre,
                d.iddetalle AS iddetalle,
                d.cantidad AS cantidad,
                d.tolerancia AS tolerancia,
                d.iding AS iding,
                i.nombre AS nombre_ingrediente
            FROM Formulas f
            LEFT JOIN Detalle_Formula d ON f.idform = d.idform
            LEFT JOIN Ingredientes i ON d.iding = i.iding
        `);

        const response = agruparFormulas(result.recordset);
        res.json(response);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// GET: Obtener una fórmula por ID
exports.getFormulaById = async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('idform', sql.VarChar, req.params.id)
            .query(`
                SELECT 
                    f.idform AS idform,
                    f.nombre AS nombre,
                    d.iddetalle AS iddetalle,
                    d.cantidad AS cantidad,
                    d.tolerancia AS tolerancia,
                    d.iding AS iding,
                    i.nombre AS nombre_ingrediente
                FROM Formulas f
                LEFT JOIN Detalle_Formula d ON f.idform = d.idform
                LEFT JOIN Ingredientes i ON d.iding = i.iding
                WHERE f.idform = @idform
            `);

        const response = agruparFormulas(result.recordset);

        if (response.length === 0) return res.status(404).json({ message: 'Fórmula no encontrada' });

        res.json(response[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// POST: Crear Fórmula + Detalles (TRANSACCIÓN)
exports.createFormula = async (req, res) => {
    const { idform, nombre, ingredientes } = req.body; 
    // 'ingredientes' es un array: [{ iding: 'ING01', cantidad: 10, tolerancia: 1 }, ...]

    const pool = await getConnection();
    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin(); // INICIO TRANSACCIÓN

        // 1. Insertar Encabezado (Formula)
        await transaction.request()
            .input('idform', sql.VarChar, idform)
            .input('nombre', sql.VarChar, nombre)
            .query('INSERT INTO Formulas (idform, nombre) VALUES (@idform, @nombre)');

        // 2. Insertar Detalles (Loop)
        if (ingredientes && ingredientes.length > 0) {
            for (const item of ingredientes) {
                // El frontend puede mandar el objeto completo de ingrediente o solo el ID.
                // Asumimos que manda { iding: '...', cantidad: ..., tolerancia: ... }
                // O si manda { iding: { iding: '...' } } ajustamos. 
                // Basado en tu serializer Django, parece que recibes un objeto anidado o ID.
                // Aquí asumiremos que 'item.iding' es el ID string (ej: 'ING-001')
                
                // Validación rápida de que iding existe
                const idIngrediente = typeof item.iding === 'object' ? item.iding.iding : item.iding;

                await transaction.request()
                    .input('idform', sql.VarChar, idform)
                    .input('iding', sql.VarChar, idIngrediente)
                    .input('cantidad', sql.Float, item.cantidad)
                    .input('tolerancia', sql.Int, item.tolerancia)
                    .query(`INSERT INTO Detalle_Formula (idform, iding, cantidad, tolerancia) 
                            VALUES (@idform, @iding, @cantidad, @tolerancia)`);
            }
        }

        await transaction.commit(); // SI TODO SALIÓ BIEN, GUARDAMOS
        res.status(201).json({ message: 'Fórmula creada exitosamente', idform });

    } catch (error) {
        await transaction.rollback(); // SI ALGO FALLÓ, DESHACEMOS TODO
        
        if (error.number === 2627) {
            return res.status(409).json({ error: 'Ya existe una fórmula con ese ID.' });
        }
        res.status(500).json({ error: error.message });
    }
};

// PUT: Actualizar Fórmula (TRANSACCIÓN - Estrategia: Borrar Detalles y Reinsertar)
exports.updateFormula = async (req, res) => {
    const { id } = req.params;
    const { nombre, ingredientes } = req.body;

    const pool = await getConnection();
    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();

        // 1. Actualizar Nombre de la Fórmula
        const resultForm = await transaction.request()
            .input('id', sql.VarChar, id)
            .input('nombre', sql.VarChar, nombre)
            .query('UPDATE Formulas SET nombre = @nombre WHERE idform = @id');

        if (resultForm.rowsAffected[0] === 0) {
            await transaction.rollback();
            return res.status(404).json({ message: 'Fórmula no encontrada' });
        }

        // 2. Manejo de Detalles (Si vienen ingredientes en el JSON)
        if (ingredientes) {
            // A) Borrar todos los detalles existentes de esta fórmula
            await transaction.request()
                .input('idform', sql.VarChar, id)
                .query('DELETE FROM Detalle_Formula WHERE idform = @idform');

            // B) Insertar los nuevos (que ahora son la verdad absoluta)
            for (const item of ingredientes) {
                const idIngrediente = typeof item.iding === 'object' ? item.iding.iding : item.iding;

                await transaction.request()
                    .input('idform', sql.VarChar, id)
                    .input('iding', sql.VarChar, idIngrediente)
                    .input('cantidad', sql.Float, item.cantidad)
                    .input('tolerancia', sql.Int, item.tolerancia)
                    .query(`INSERT INTO Detalle_Formula (idform, iding, cantidad, tolerancia) 
                            VALUES (@idform, @iding, @cantidad, @tolerancia)`);
            }
        }

        await transaction.commit();
        res.json({ message: 'Fórmula actualizada correctamente' });

    } catch (error) {
        await transaction.rollback();
        res.status(500).json({ error: error.message });
    }
};

// DELETE: Eliminar Fórmula
exports.deleteFormula = async (req, res) => {
    // Al tener ON DELETE CASCADE en tu modelo Django (y supongo que en SQL), 
    // borrar el padre borra los hijos automáticamente.
    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('id', sql.VarChar, req.params.id)
            .query('DELETE FROM Formulas WHERE idform = @id');

        if (result.rowsAffected[0] === 0) return res.status(404).json({ message: 'Fórmula no encontrada' });

        res.json({ message: 'Fórmula eliminada' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// PATCH: Actualización parcial
// En Maestro-Detalle, PATCH suele usarse solo para el nombre, 
// o si mandas ingredientes, reemplazas la lista completa igual que en PUT.
exports.patchFormula = async (req, res) => {
    const { id } = req.params;
    const { nombre, ingredientes } = req.body; // 'updates'

    const pool = await getConnection();
    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();

        // 1. Si viene Nombre, actualizamos
        if (nombre) {
            await transaction.request()
                .input('id', sql.VarChar, id)
                .input('nombre', sql.VarChar, nombre)
                .query('UPDATE Formulas SET nombre = @nombre WHERE idform = @id');
        }

        // 2. Si vienen ingredientes, aplicamos la misma lógica "Nuclear" (Reemplazo total de lista)
        // Esto es estándar en APIs REST simples: si mandas la lista, es porque esa es la nueva lista.
        if (ingredientes) {
            await transaction.request()
                .input('idform', sql.VarChar, id)
                .query('DELETE FROM Detalle_Formula WHERE idform = @idform');

            for (const item of ingredientes) {
                const idIngrediente = typeof item.iding === 'object' ? item.iding.iding : item.iding;
                await transaction.request()
                    .input('idform', sql.VarChar, id)
                    .input('iding', sql.VarChar, idIngrediente)
                    .input('cantidad', sql.Float, item.cantidad)
                    .input('tolerancia', sql.Int, item.tolerancia)
                    .query(`INSERT INTO Detalle_Formula (idform, iding, cantidad, tolerancia) 
                            VALUES (@idform, @iding, @cantidad, @tolerancia)`);
            }
        }

        await transaction.commit();
        res.json({ message: 'Fórmula actualizada parcialmente (PATCH)' });

    } catch (error) {
        await transaction.rollback();
        res.status(500).json({ error: error.message });
    }
};