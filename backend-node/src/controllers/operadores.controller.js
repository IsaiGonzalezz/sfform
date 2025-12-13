const { getConnection, sql } = require('../../db');
const bcrypt = require('bcryptjs');

// --- 1. OBTENER OPERADORES (GET) ---
const getOperadores = async (req, res) => {
    try {
        const pool = await getConnection();
        
        // Hacemos JOIN con Estaciones para traer el nombre de la estación, no solo el ID
        // Filtramos por activo = 1
        const result = await pool.request().query(`
            SELECT 
                o.rfid, 
                o.nombre, 
                o.idest, 
                o.activo,
                e.nombre as nombre_estacion
            FROM Operadores o
            LEFT JOIN Estaciones e ON o.idest = e.idest
            WHERE o.activo = 1
        `);
        
        res.json(result.recordset);
    } catch (error) {
        res.status(500).send(error.message);
    }
};

// --- 2. CREAR OPERADOR (POST) ---
const createOperador = async (req, res) => {
    // Nota: Recibimos 'contraseña' o 'password' del front, lo manejamos.
    const { rfid, nombre, contraseña, password, idest } = req.body;
    
    // Usamos la que venga (por si el frontend manda 'password' o 'contraseña')
    const passReal = contraseña || password;

    if (!rfid || !nombre || !passReal || !idest) {
        return res.status(400).json({ msg: 'Faltan campos requeridos (RFID, Nombre, Contraseña, Estación)' });
    }

    try {
        // 1. Encriptar contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(passReal, salt);

        const pool = await getConnection();

        // 2. Insertar en tabla Operadores
        // OJO: La columna en BD se llama 'contraseña'
        await pool.request()
            .input('rfid', sql.VarChar, rfid)
            .input('nombre', sql.VarChar, nombre)
            .input('contrasena', sql.VarChar, hashedPassword) // SQL Server suele preferir evitar ñ en variables, pero en la query sí usamos la columna
            .input('idest', sql.VarChar, idest)
            .input('activo', sql.Bit, 1) // Activo por defecto
            .query('INSERT INTO Operadores (rfid, nombre, contraseña, idest, activo) VALUES (@rfid, @nombre, @contrasena, @idest, @activo)');

        res.json({ msg: 'Operador creado exitosamente' });
    } catch (error) {
        // Error 2627 es "Violation of PRIMARY KEY constraint" (RFID duplicado)
        if (error.number === 2627) {
            return res.status(409).json({ msg: 'El RFID ya está registrado' });
        }
        console.error(error);
        res.status(500).send(error.message);
    }
};

// --- 3. ACTUALIZAR OPERADOR (PUT) ---
const updateOperador = async (req, res) => {
    const { id } = req.params; // Este es el RFID viejo (o el actual)
    const { nombre, idest, contraseña, password, activo } = req.body;
    
    const passReal = contraseña || password;

    try {
        const pool = await getConnection();
        const request = pool.request()
            .input('id', sql.VarChar, id)
            .input('nombre', sql.VarChar, nombre)
            .input('idest', sql.VarChar, idest);

        // Construimos la query dinámicamente
        let query = "UPDATE Operadores SET nombre = @nombre, idest = @idest";

        // Si mandan estatus (activo), lo actualizamos
        if (activo !== undefined) {
            request.input('activo', sql.Bit, activo);
            query += ", activo = @activo";
        }

        // Si mandan contraseña nueva, la encriptamos y actualizamos
        if (passReal && passReal.trim() !== '') {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(passReal, salt);
            request.input('contrasena', sql.VarChar, hashedPassword);
            query += ", contraseña = @contrasena";
        }

        query += " WHERE rfid = @id";

        await request.query(query);

        res.json({ msg: 'Operador actualizado correctamente' });
    } catch (error) {
        res.status(500).send(error.message);
    }
};

// --- 4. BORRADO LÓGICO (PATCH/DELETE) ---
const deleteOperador = async (req, res) => {
    const { id } = req.params; // El RFID

    try {
        const pool = await getConnection();
        
        // Soft Delete: activo = 0
        await pool.request()
            .input('id', sql.VarChar, id)
            .query('UPDATE Operadores SET activo = 0 WHERE rfid = @id');

        res.json({ msg: 'Operador desactivado correctamente' });
    } catch (error) {
        res.status(500).send(error.message);
    }
};

module.exports = {
    getOperadores,
    createOperador,
    updateOperador,
    deleteOperador
};