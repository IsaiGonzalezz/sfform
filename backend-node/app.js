const express = require('express');
const cors = require('cors');
require('dotenv').config(); // Cargar variables de entorno
const path = require('path')

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


//9. Ruta para inventario:
app.use('/api/inventario', require('./src/routes/inventario.routes'));

//RUTA PARA TOKEN Y LOGIN
app.use('/api/token', require('./src/routes/auth.routes'));

// ==========================================
//  B. SERVIR EL FRONTEND (LA FUSIÓN)
//  (Esto va DESPUÉS de todas las rutas /api)
// ==========================================

//<-- DESCOMENTA LINEA 58 Y {62-64}
// 1. Decirle a Express que la carpeta 'dist' tiene los archivos estáticos (CSS, JS, Imágenes del build)
//app.use(express.static(path.join(__dirname, 'dist')));

// 2. El Comodín (*): Cualquier ruta que NO sea /api ni un archivo estático, 
//    se la mandamos al index.html para que React se encargue.
//app.get(/.*/, (req, res) => {
//    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
//});



// --- ARRANCAR SERVIDOR ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});