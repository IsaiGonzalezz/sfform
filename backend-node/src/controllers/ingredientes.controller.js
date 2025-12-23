const { getConnection, sql } = require('../../db');

// --- 1. GET: Solo traer los activos 
exports.getIngredientes = async (req, res) => {
    
    const { verTodos } = req.query;

    try {
        const pool = await getConnection();

        let query = `
        SELECT 
                iding,
                nombre,
                presentacion,
                observaciones,
                pesado,
                activo
            FROM Ingredientes
        `;


        if (verTodos !== 'true') {
            query += ' WHERE activo = 1';
        }
        
        
        const result = await pool.request().query(query);
        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Obtener por ID (iding)
exports.getIngredienteById = async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('iding', sql.VarChar, req.params.id)
            .query(`
                SELECT 
                    iding AS iding,
                    nombre AS nombre,
                    presentacion AS presentacion,
                    observaciones AS observaciones,
                    pesado AS pesado,
                    activo AS activo
                FROM Ingredientes
                WHERE iding = @iding
            `);

        if (result.recordset.length === 0) return res.status(404).json({ message: 'Ingrediente no encontrado' });

        res.json(result.recordset[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Crear Ingrediente
exports.createIngrediente = async (req, res) => {
    // OJO: Aquí recibimos 'iding' porque NO es autoincrementable
    const { iding, nombre, presentacion, observaciones, pesado, activo } = req.body;

    try {
        const pool = await getConnection();
        await pool.request()
            .input('iding', sql.VarChar, iding)
            .input('nombre', sql.VarChar, nombre)
            .input('presentacion', sql.Float, presentacion) // Float en Django = Float en SQL
            .input('observaciones', sql.VarChar, observaciones)
            .input('pesado', sql.Bit, pesado) // Boolean = Bit
            .input('activo', sql.Bit, activo)
            .query(`INSERT INTO Ingredientes (iding, nombre, presentacion, observaciones, pesado, activo) 
                    VALUES (@iding, @nombre, @presentacion, @observaciones, @pesado, @activo)`);

        res.status(201).json({ message: 'Ingrediente creado', iding });
    } catch (error) {
        // Error 2627 es violación de llave primaria (ID duplicado)
        if (error.number === 2627 || error.number === 2601) {
            return res.status(409).json({ error: 'Ya existe un ingrediente con ese ID.' });
        }
        res.status(500).json({ error: error.message });
    }
};

// Actualizar (PUT)
exports.updateIngrediente = async (req, res) => {
    const { id } = req.params; // Viene en la URL como /api/ingredientes/ING001
    const { nombre, presentacion, observaciones, pesado, activo } = req.body;

    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('iding', sql.VarChar, id)
            .input('nombre', sql.VarChar, nombre)
            .input('presentacion', sql.Float, presentacion)
            .input('observaciones', sql.VarChar, observaciones)
            .input('pesado', sql.Bit, pesado)
            .input('activo', sql.Bit, activo)
            .query(`UPDATE Ingredientes SET 
                    nombre=@nombre, presentacion=@presentacion, observaciones=@observaciones, 
                    pesado=@pesado, activo=@activo 
                    WHERE iding = @iding`);

        if (result.rowsAffected[0] === 0) return res.status(404).json({ message: 'Ingrediente no encontrado' });

        res.json({ message: 'Ingrediente actualizado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Eliminar
// --- 2. DELETE: Borrado Lógico (Soft Delete) ---
// En lugar de borrar la fila, solo ponemos activo = 0
exports.deleteIngrediente = async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('iding', sql.VarChar, req.params.id)
            // CAMBIO: UPDATE en vez de DELETE
            .query('UPDATE Ingredientes SET activo = 0 WHERE iding = @iding');

        if (result.rowsAffected[0] === 0) return res.status(404).json({ message: 'Ingrediente no encontrado' });

        res.json({ message: 'Ingrediente desactivado correctamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


//ActivarIngredientes;
exports.activarIngrediente = async (req, res) => {
    const { id } = req.params; // El RFID

    try {
        const pool = await getConnection();
        
        // "Revivimos" el operador poniendo activo = 1
        const result = await pool.request()
            .input('id', sql.VarChar, id)
            .query('UPDATE Ingredientes SET activo = 1 WHERE iding = @id');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ msg: 'Ingrediente no encontrado' });
        }

        res.json({ msg: 'Ingrediente restaurado exitosamente' });
    } catch (error) {
        res.status(500).send(error.message);
    }
};