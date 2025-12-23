const { getConnection, sql } = require('../../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

exports.login = async (req, res) => {
    const { correo, password } = req.body;

    if (!correo || !password) {
        return res.status(400).json({ detail: 'Debe proporcionar correo y contraseña.' });
    }

    try {
        const pool = await getConnection();
        
        // Buscamos por Correo (Ojo: en tu DB la columna se llama 'Correo' con C mayúscula, 
        // pero en el WHERE de SQL no importa tanto, aunque en el objeto de retorno SÍ).
        const result = await pool.request()
            .input('correo', sql.VarChar, correo)
            .query('SELECT * FROM Usuarios WHERE Correo = @correo');

        if (result.recordset.length === 0) {
            return res.status(401).json({ detail: 'Credenciales inválidas.' });
        }

        const usuario = result.recordset[0];

        // --- DEBUG TEMPORAL (Si vuelve a fallar, descomenta esto para ver qué trae la consola) ---
        // console.log("Usuario encontrado:", usuario);

        // 3. Verificar contraseña (campo 'password' es minúscula en tu tabla, así que usuario.password está bien)
        const validPassword = await bcrypt.compare(password, usuario.password);
        if (!validPassword) {
            return res.status(401).json({ detail: 'Credenciales inválidas.' });
        }

        // =================================================================
        // VALIDACIONES DE SEGURIDAD
        // =================================================================

        // 4. Validar activo (campo 'activo' es minúscula en tu tabla)
        if (!usuario.activo) {
            return res.status(403).json({ detail: 'Tu cuenta ha sido desactivada. Contacta a soporte.' });
        }

        // 5. Validar Rol (AQUÍ ESTABA EL ERROR)
        // En tu tabla es "Rol", no "rol".
        // Usamos trim() para quitar espacios en blanco invisibles que SQL a veces agrega.
        const rolUsuario = usuario.Rol || usuario.rol; // Probamos ambos por seguridad
        
        if (!rolUsuario || rolUsuario.trim().toLowerCase() !== 'administrador') {
            return res.status(403).json({ detail: 'Acceso denegado. Se requieren permisos de Administrador.' });
        }

        // =================================================================

        // 6. Generar Tokens
        // OJO: Aquí también ajustamos los nombres para que coincidan con tu tabla
        const payload = {
            user_id: usuario.id,      // id (minúscula)
            rfid: usuario.RFID,       // RFID (mayúsculas)
            rol: rolUsuario,          // Rol
            nombre: usuario.Nombre    // Nombre (Capitalizada)
        };

        const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '10m' });
        const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '1d' });

        res.json({
            access: accessToken,
            refresh: refreshToken,
            rol: rolUsuario
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

// ... (El resto de refreshToken se queda igual, solo asegúrate de importar jwt y secretos)
exports.refreshToken = (req, res) => {
    // ... código existente ...
    const { refresh } = req.body;
    if (!refresh) return res.status(400).json({ detail: 'No se proporcionó token.' });

    try {
        const decoded = jwt.verify(refresh, JWT_REFRESH_SECRET);
        const payload = {
            user_id: decoded.user_id,
            rfid: decoded.rfid,
            rol: decoded.rol,
            nombre: decoded.nombre
        };
        const newAccessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
        res.json({ access: newAccessToken });
    } catch (error) {
        return res.status(401).json({ detail: 'Token inválido.' });
    }
};