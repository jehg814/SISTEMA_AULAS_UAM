const mariadb = require('mariadb');

const pool = mariadb.createPool({
    host: '104.131.162.236',
    port: 3434,
    user: 'consulta_uam',
    password: 'aRluAv9F8UNC66Gu72Qw',
    database: 'cestudio_uam',
    connectionLimit: 5
});

async function checkHoras() {
    let conn;
    try {
        conn = await pool.getConnection();

        console.log('=== Estructura de tabla Horas ===\n');
        const structure = await conn.query("DESCRIBE Horas");
        structure.forEach(col => console.log(' -', col.Field, '(' + col.Type + ')'));

        console.log('\n=== Contenido de tabla Horas ===\n');
        const horas = await conn.query("SELECT * FROM Horas ORDER BY Hora");

        horas.forEach(row => {
            console.log(JSON.stringify(row, null, 2));
        });

        console.log('\n=== Total de bloques definidos:', horas.length);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        if (conn) conn.release();
        await pool.end();
        process.exit();
    }
}

checkHoras();
