const mariadb = require('mariadb');

const pool = mariadb.createPool({
    host: '104.131.162.236',
    port: 3434,
    user: 'consulta_uam',
    password: 'aRluAv9F8UNC66Gu72Qw',
    database: 'cestudio_uam',
    connectionLimit: 5
});

async function checkProfesores() {
    let conn;
    try {
        conn = await pool.getConnection();

        console.log('--- Estructura de tabla Profesores ---');
        const structure = await conn.query("DESCRIBE Profesores");
        console.log('Columnas:');
        structure.forEach(col => console.log(' -', col.Field, '(' + col.Type + ')'));

        console.log('\n--- Ejemplo de datos ---');
        const sample = await conn.query("SELECT * FROM Profesores LIMIT 3");
        console.log(JSON.stringify(sample, null, 2));

    } catch (err) {
        console.error('Error:', err);
    } finally {
        if (conn) conn.release();
        await pool.end();
        process.exit();
    }
}

checkProfesores();
