const { getConnection, sql } = require('../../db');
const fs = require('fs');
const path = require('path');

// Obtener todas las empresas
exports.getEmpresas = async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query('SELECT * FROM Empresa');
        res.json(result.recordset);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Obtener Empresa por RFC
exports.getEmpresaByRfc = async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('rfc', sql.VarChar, req.params.rfc)
            .query('SELECT * FROM Empresa WHERE rfc = @rfc');

        if (result.recordset.length === 0) return res.status(404).json({ message: 'Empresa no encontrada' });

        res.json(result.recordset[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Crear Empresa
exports.createEmpresa = async (req, res) => {
    const { rfc, nombre, calle, colonia, ciudad, estado, cp, contacto, correo, telefono } = req.body;
    // Si hay archivo, guardamos la ruta 'logos_empresa/archivo.ext', si no null
    const logotipo = req.file ? `logos_empresa/${req.file.filename}` : null;

    try {
        const pool = await getConnection();
        await pool.request()
            .input('rfc', sql.VarChar, rfc)
            .input('nombre', sql.VarChar, nombre)
            .input('calle', sql.VarChar, calle)
            .input('colonia', sql.VarChar, colonia)
            .input('ciudad', sql.VarChar, ciudad)
            .input('estado', sql.VarChar, estado)
            .input('cp', sql.VarChar, cp)
            .input('contacto', sql.VarChar, contacto)
            .input('correo', sql.VarChar, correo)
            .input('telefono', sql.VarChar, telefono)
            .input('logotipo', sql.VarChar, logotipo)
            .query(`INSERT INTO Empresa (rfc, nombre, calle, colonia, ciudad, estado, cp, contacto, correo, telefono, logotipo) 
                    VALUES (@rfc, @nombre, @calle, @colonia, @ciudad, @estado, @cp, @contacto, @correo, @telefono, @logotipo)`);

        res.status(201).json({ message: 'Empresa creada exitosamente', rfc });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Actualizar Empresa (PUT - Todo el recurso)
exports.updateEmpresa = async (req, res) => {
    const { rfc } = req.params;
    const { nombre, calle, colonia, ciudad, estado, cp, contacto, correo, telefono } = req.body;
    
    try {
        const pool = await getConnection();
        
        // Verificamos si mandaron nueva imagen para reemplazar
        let queryLogotipo = "";
        if (req.file) {
            queryLogotipo = ", logotipo = @logotipo";
        }

        const request = pool.request()
            .input('rfc', sql.VarChar, rfc)
            .input('nombre', sql.VarChar, nombre)
            .input('calle', sql.VarChar, calle)
            .input('colonia', sql.VarChar, colonia)
            .input('ciudad', sql.VarChar, ciudad)
            .input('estado', sql.VarChar, estado)
            .input('cp', sql.VarChar, cp)
            .input('contacto', sql.VarChar, contacto)
            .input('correo', sql.VarChar, correo)
            .input('telefono', sql.VarChar, telefono);

        if (req.file) {
            request.input('logotipo', sql.VarChar, `logos_empresa/${req.file.filename}`);
        }

        await request.query(`UPDATE Empresa SET 
            nombre=@nombre, calle=@calle, colonia=@colonia, ciudad=@ciudad, 
            estado=@estado, cp=@cp, contacto=@contacto, correo=@correo, telefono=@telefono 
            ${queryLogotipo} 
            WHERE rfc = @rfc`);

        res.json({ message: 'Empresa actualizada (PUT)' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Actualizar Parcial (PATCH)
exports.patchEmpresa = async (req, res) => {
    const { rfc } = req.params;
    const updates = req.body; // Campos que vienen en el body
    
    try {
        const pool = await getConnection();
        const request = pool.request().input('rfc', sql.VarChar, rfc);
        
        let setClauses = [];

        // Agregamos dinámicamente los campos que vienen en el body
        for (const key in updates) {
            if (Object.prototype.hasOwnProperty.call(updates, key)) {
                request.input(key, sql.VarChar, updates[key]); // Asumimos VarChar para simplificar, ajusta si hay int
                setClauses.push(`${key} = @${key}`);
            }
        }

        // Si viene imagen en PATCH
        if (req.file) {
            const logoPath = `logos_empresa/${req.file.filename}`;
            request.input('logotipo', sql.VarChar, logoPath);
            setClauses.push(`logotipo = @logotipo`);
        }

        if (setClauses.length === 0) {
            return res.status(400).json({ message: 'No se enviaron campos para actualizar' });
        }

        const query = `UPDATE Empresa SET ${setClauses.join(', ')} WHERE rfc = @rfc`;
        await request.query(query);

        res.json({ message: 'Empresa actualizada parcialmente (PATCH)' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Eliminar Empresa
exports.deleteEmpresa = async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('rfc', sql.VarChar, req.params.rfc)
            .query('DELETE FROM Empresa WHERE rfc = @rfc');
        
        if (result.rowsAffected[0] === 0) return res.status(404).json({ message: 'Empresa no encontrada' });

        res.json({ message: 'Empresa eliminada' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};