const { getConnection, sql } = require('../../db');

// --- 1. OBTENER TODAS (GET) ---
// Equivalente a: EstacionListCreateView (GET)
const getEstaciones = async (req, res) => {

    const {verTodos} = req.query

    try {
        const pool = await getConnection();
        
        let query = `
            SELECT * FROM Estaciones
        `;

        if(verTodos !== 'true'){
            query += `WHERE activo = 1`;
        }

        const result = await pool.request().query(query);
        res.json(result.recordset);
    } catch (error) {
        res.status(500).send(error.message);
    }
};

// --- 2. OBTENER UNA POR ID (GET :id) ---
// Equivalente a: EstacionDetailView (GET)
const getEstacionById = async (req, res) => {
    const { id } = req.params; // idest
    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('id', sql.VarChar, id)
            .query("SELECT * FROM Estaciones WHERE idest = @id AND activo = 1");

        if (result.recordset.length === 0) {
            return res.status(404).json({ msg: 'Estación no encontrada' });
        }

        res.json(result.recordset[0]);
    } catch (error) {
        res.status(500).send(error.message);
    }
};

// --- 3. CREAR ESTACIÓN (POST) ---
// Equivalente a: EstacionListCreateView (POST)
const createEstacion = async (req, res) => {
    // Nota: 'activo' no se pide, se pone en 1 por defecto
    const { idest, nombre, obs } = req.body;

    if (!idest || !nombre) {
        return res.status(400).json({ msg: 'Faltan campos requeridos (ID o Nombre)' });
    }

    try {
        const pool = await getConnection();

        await pool.request()
            .input('idest', sql.VarChar, idest) // Tu PK manual
            .input('nombre', sql.VarChar, nombre)
            .input('obs', sql.VarChar, obs || null) // Puede ser nulo
            .input('activo', sql.Bit, 1) // Activo por defecto
            .query('INSERT INTO Estaciones (idest, nombre, obs, activo) VALUES (@idest, @nombre, @obs, @activo)');

        res.json({ msg: 'Estación creada exitosamente', idest, nombre });
    } catch (error) {
        // Manejo de error si el ID ya existe (Violación de PK)
        if (error.number === 2627) {
            return res.status(409).json({ msg: 'Ya existe una estación con ese ID' });
        }
        res.status(500).send(error.message);
    }
};

// --- 4. ACTUALIZAR ESTACIÓN (PUT) ---
// Equivalente a: EstacionDetailView (PUT/PATCH)
const updateEstacion = async (req, res) => {
    const { id } = req.params; // El idest viene en la URL
    const { nombre, obs } = req.body;

    try {
        const pool = await getConnection();
        await pool.request()
            .input('id', sql.VarChar, id)
            .input('nombre', sql.VarChar, nombre)
            .input('obs', sql.VarChar, obs || null)
            .query('UPDATE Estaciones SET nombre = @nombre, obs = @obs WHERE idest = @id');

        res.json({ msg: 'Estación actualizada correctamente' });
    } catch (error) {
        res.status(500).send(error.message);
    }
};

// --- 5. BORRADO LÓGICO (DELETE/PATCH) ---
// Equivalente a: EstacionDetailView (DELETE) pero con lógica Soft Delete
const deleteEstacion = async (req, res) => {
    const { id } = req.params;

    try {
        const pool = await getConnection();
        
        // En lugar de DELETE FROM, hacemos UPDATE activo = 0
        await pool.request()
            .input('id', sql.VarChar, id)
            .query('UPDATE Estaciones SET activo = 0 WHERE idest = @id');

        res.json({ msg: 'Estación desactivada (borrada lógicamente)' });
    } catch (error) {
        res.status(500).send(error.message);
    }
};


//ActivarEstaciones;
const activarEstacion = async (req, res) => {
    const { id } = req.params;

    try {
        const pool = await getConnection();
        
        const result = await pool.request()
            .input('id', sql.VarChar, id)
            .query('UPDATE Estaciones SET activo = 1 WHERE idest = @id');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ msg: 'Estacion no encontrado' });
        }

        res.json({ msg: 'Estacion restaurado exitosamente' });
    } catch (error) {
        res.status(500).send(error.message);
    }
};

module.exports = {
    getEstaciones,
    getEstacionById,
    createEstacion,
    updateEstacion,
    deleteEstacion,
    activarEstacion,
};