const express = require('express');
const cors = require('cors');
require('dotenv').config(); // Cargar variables de entorno

// Inicializar la aplicación Express
const app = express();

// --- MIDDLEWARES (Configuraciones obligatorias) ---
app.use(cors()); // Permite que React (frontend) se conecte sin errores
app.use(express.json()); // Permite que el servidor entienda los JSON que le envías

// --- RUTAS () ---

app.use('/logos_empresa', express.static('logos_empresa'));

// 1. Rutas de Estaciones 
app.use('/api/estaciones', require('./src/routes/estaciones.routes'));

// 2. Rutas de Usuarios
app.use('/api/usuarios', require('./src/routes/usuarios.routes'));

// 3. Rutas de Operadores
app.use('/api/operadores', require('./src/routes/operadores.routes'));

// 4. Rutas de Empresa:
app.use('/api/empresa', require('./src/routes/empresa.routes'));

// 5. Rutas de Dashboard
app.use('/api/resumen', require('./src/routes/dashboard.routes'));


//6. Ruta de ingredientes:
app.use('/api/ingredientes', require('./src/routes/ingredientes.routes'));


//7. Ruta para formulas:
app.use('/api/formulas', require('./src/routes/formulas.routes'));


//8. Ruta para produccion:
app.use('/api/produccion', require('./src/routes/produccion.routes'));


//RUTA PARA TOKEN Y LOGIN
app.use('/api/token', require('./src/routes/auth.routes'));

// --- RUTA DE PRUEBA  ---
app.get('/', (req, res) => {
    res.send('API Node.js funcionando correctamente');
});

// --- ARRANCAR SERVIDOR ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});