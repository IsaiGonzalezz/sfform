const { getConnection, sql } = require('../../db');
const bcrypt = require('bcryptjs');

// Obtener todos los usuarios (SIN devolver la contraseña)
exports.getUsuarios = async (req, res) => {
    try {
        const pool = await getConnection();
        // Seleccionamos campos específicos para no filtrar el hash del password
        const result = await pool.request().query('SELECT id, rfid, nombre, correo, rol, activo FROM Usuarios');
        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Obtener un usuario por ID
exports.getUsuarioById = async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('SELECT id, rfid, nombre, correo, rol, activo FROM Usuarios WHERE id = @id');

        if (result.recordset.length === 0) return res.status(404).json({ message: 'Usuario no encontrado' });

        res.json(result.recordset[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Crear Usuario (Encriptando password)
exports.createUsuario = async (req, res) => {
    const { rfid, nombre, correo, password, rol, activo } = req.body;

    try {
        // 1. Encriptar contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const pool = await getConnection();
        await pool.request()
            .input('rfid', sql.VarChar, rfid)
            .input('nombre', sql.VarChar, nombre)
            .input('correo', sql.VarChar, correo)
            .input('password', sql.VarChar, hashedPassword) // Guardamos la encriptada
            .input('rol', sql.VarChar, rol)
            .input('activo', sql.Bit, activo) // Boolean en SQL Server suele ser Bit
            .query(`INSERT INTO Usuarios (rfid, nombre, correo, password, rol, activo) 
                    VALUES (@rfid, @nombre, @correo, @password, @rol, @activo)`);

        res.status(201).json({ message: 'Usuario creado exitosamente' });
    } catch (error) {
        // Manejo básico de duplicados (rfid o correo unique)
        if (error.number === 2627 || error.number === 2601) {
            return res.status(409).json({ error: 'El RFID o Correo ya existen.' });
        }
        res.status(500).json({ error: error.message });
    }
};

// Actualizar Usuario (PUT - Reemplazo completo)
exports.updateUsuario = async (req, res) => {
    const { id } = req.params;
    const { rfid, nombre, correo, password, rol, activo } = req.body;

    try {
        const pool = await getConnection();
        
        // Si mandan password, hay que encriptarlo. Si no, habría que ver como manejarlo.
        // Asumimos que en PUT se manda todo.
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const result = await pool.request()
            .input('id', sql.Int, id)
            .input('rfid', sql.VarChar, rfid)
            .input('nombre', sql.VarChar, nombre)
            .input('correo', sql.VarChar, correo)
            .input('password', sql.VarChar, hashedPassword)
            .input('rol', sql.VarChar, rol)
            .input('activo', sql.Bit, activo)
            .query(`UPDATE Usuarios SET 
                    rfid=@rfid, nombre=@nombre, correo=@correo, password=@password, rol=@rol, activo=@activo 
                    WHERE id = @id`);

        if (result.rowsAffected[0] === 0) return res.status(404).json({ message: 'Usuario no encontrado' });

        res.json({ message: 'Usuario actualizado (PUT)' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Actualizar Parcial (PATCH)
exports.patchUsuario = async (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    try {
        const pool = await getConnection();
        const request = pool.request().input('id', sql.Int, id);
        
        let setClauses = [];

        for (const key in updates) {
            if (Object.prototype.hasOwnProperty.call(updates, key)) {
                let value = updates[key];

                // CASO ESPECIAL: Si están actualizando el password, hay que encriptarlo
                if (key === 'password') {
                    const salt = await bcrypt.genSalt(10);
                    value = await bcrypt.hash(value, salt);
                }

                // Ajuste de tipos si es necesario (ej. activo es bit)
                let type = sql.VarChar;
                if (key === 'activo') type = sql.Bit;
                
                request.input(key, type, value);
                setClauses.push(`${key} = @${key}`);
            }
        }

        if (setClauses.length === 0) {
            return res.status(400).json({ message: 'No se enviaron campos para actualizar' });
        }

        const query = `UPDATE Usuarios SET ${setClauses.join(', ')} WHERE id = @id`;
        await request.query(query);

        res.json({ message: 'Usuario actualizado parcialmente (PATCH)' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Eliminar Usuario
exports.deleteUsuario = async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('DELETE FROM Usuarios WHERE id = @id');

        if (result.rowsAffected[0] === 0) return res.status(404).json({ message: 'Usuario no encontrado' });

        res.json({ message: 'Usuario eliminado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};