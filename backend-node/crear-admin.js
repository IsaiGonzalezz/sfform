
//ARCHIVO PARA CREAR USUARIO ADMINISTRADOR//

require('dotenv').config();
const sql = require('mssql');
const bcrypt = require('bcryptjs');
const readline = require('readline');

// Configuración de la consola para leer lo que escribes
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Función auxiliar para hacer preguntas y esperar respuesta (Promesa)
const preguntar = (texto) => {
    return new Promise((resolve) => {
        rl.question(texto + ' ', (respuesta) => {
            resolve(respuesta);
        });
    });
};

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    options: {
        encrypt: true,
        trustServerCertificate: true
    }
};

async function crearAdminInteractivo() {
    console.clear();
    console.log("==========================================");
    console.log("   CREACIÓN DE USUARIO ADMINISTRADOR   ");
    console.log("==========================================\n");

    try {
        // 1. Pedimos los datos por terminal
        const nombre = await preguntar("1. Ingresa el Nombre completo: ");
        const correo = await preguntar("2. Ingresa el Correo electrónico: ");
        const passPlano = await preguntar("3. Ingresa la Contraseña: ");
        let rfid = await preguntar("4. Ingresa el RFID: ");

        // Validación simple de RFID
        if (!rfid) rfid = "ADMIN_KEY_" + Math.floor(Math.random() * 1000);

        console.log("\n Procesando datos y conectando a la Nube...");

        // 2. Conectamos a la BD
        const pool = await sql.connect(config);

        // 3. Encriptamos la contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(passPlano, salt);

        // 4. Insertamos en la BD
        const query = `
            INSERT INTO Usuarios (Nombre, Correo, password, Rol, RFID, activo)
            VALUES (@nombre, @correo, @pass, 'administrador', @rfid, 1)
        `;

        await pool.request()
            .input('nombre', sql.VarChar, nombre)
            .input('correo', sql.VarChar, correo)
            .input('pass', sql.VarChar, hashedPassword)
            .input('rfid', sql.VarChar, rfid)
            .query(query);

        console.log("\n ========================================");
        console.log("  ¡USUARIO CREADO EXITOSAMENTE!");
        console.log(" ========================================");
        console.log(` Usuario: ${nombre}`);
        console.log(` Login:   ${correo}`);
        console.log(` Pass:    ${passPlano} (Guardada encriptada)`);

    } catch (error) {
        if (error.number === 2627) {
            console.log("\n ERROR: Ya existe un usuario con ese Correo o RFID.");
        } else {
            console.error("\n ERROR DE CONEXIÓN O SQL:", error);
        }
    } finally {
        // Cerramos la conexión y la consola
        if (sql) sql.close();
        rl.close();
    }
}

crearAdminInteractivo();