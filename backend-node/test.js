// test-db.js
const { getConnection } = require('./db');

async function probarConexion() {
    console.log('Intentando conectar a SQL Server...');

    try {
        // 1. Intentamos obtener la conexión
        const pool = await getConnection();
        console.log('Conexión exitosa al pool de datos');

        // 2. Hacemos una consulta de prueba (traer la versión de SQL Server)
        const result = await pool.request().query('SELECT @@VERSION as version');
        
        console.log('Resultado de la prueba:');
        console.log('---------------------------------------------------');
        console.log(result.recordset[0].version); // Imprime la versión
        console.log('---------------------------------------------------');

        // 3. Cerramos la conexión (solo porque es un script de prueba)
        pool.close();
        console.log('Conexión cerrada.');

    } catch (error) {
        console.error('Error FATAL de conexión:');
        console.error(error);
    }
}

// Ejecutamos la función
probarConexion();