// Test database connection
const mariadb = require('mariadb');

const pool = mariadb.createPool({
    host: '104.131.162.236',
    port: 3434,
    user: 'consulta_uam',
    password: 'aRluAv9F8UNC66Gu72Qw',
    database: 'cestudio_uam',
    connectionLimit: 5
});

async function testConnection() {
    let conn;
    try {
        console.log('Intentando conectar a la base de datos...');
        conn = await pool.getConnection();
        console.log('✓ Conexión exitosa!');

        // Test 1: Ver qué tablas existen
        console.log('\n--- Test 1: Listando tablas ---');
        const tables = await conn.query("SHOW TABLES");
        console.log('Tablas encontradas:', tables.length);
        tables.forEach(t => console.log(' -', Object.values(t)[0]));

        // Test 2: Verificar tabla Oferta
        console.log('\n--- Test 2: Estructura de tabla Oferta ---');
        const ofertaStructure = await conn.query("DESCRIBE Oferta");
        console.log('Columnas en Oferta:');
        ofertaStructure.forEach(col => console.log(' -', col.Field, '(' + col.Type + ')'));

        // Test 3: Contar registros en Oferta
        console.log('\n--- Test 3: Contando registros en Oferta ---');
        const ofertaCount = await conn.query("SELECT COUNT(*) as total FROM Oferta");
        console.log('Total de registros en Oferta:', ofertaCount[0].total);

        // Test 4: Ver algunos periodos disponibles
        console.log('\n--- Test 4: Periodos disponibles ---');
        const periodos = await conn.query("SELECT DISTINCT CodPeriodo FROM Oferta ORDER BY CodPeriodo DESC LIMIT 10");
        console.log('Periodos encontrados:');
        periodos.forEach(p => console.log(' -', p.CodPeriodo));

        // Test 5: Verificar tabla Aulas
        console.log('\n--- Test 5: Estructura de tabla Aulas ---');
        const aulasStructure = await conn.query("DESCRIBE Aulas");
        console.log('Columnas en Aulas:');
        aulasStructure.forEach(col => console.log(' -', col.Field, '(' + col.Type + ')'));

        // Test 6: Contar registros en Aulas
        console.log('\n--- Test 6: Contando registros en Aulas ---');
        const aulasCount = await conn.query("SELECT COUNT(*) as total FROM Aulas");
        console.log('Total de registros en Aulas:', aulasCount[0].total);

        // Test 7: Probar query de oferta
        console.log('\n--- Test 7: Probando query de Oferta ---');
        const testQuery = await conn.query(`
            SELECT
                o.CodAsignatura,
                a.Nombre as NombreAsignatura,
                o.Secc,
                o.CodSede
            FROM Oferta o
            LEFT JOIN Asignaturas a ON a.CodAsignatura = o.CodAsignatura
            LIMIT 5
        `);
        console.log('Primeros 5 registros:', testQuery);

    } catch (err) {
        console.error('\n❌ Error:', err.message);
        console.error('Código de error:', err.code);
        console.error('SQL State:', err.sqlState);
        console.error('\nStack completo:', err);
    } finally {
        if (conn) {
            conn.release();
            console.log('\nConexión cerrada.');
        }
        await pool.end();
        process.exit();
    }
}

testConnection();
