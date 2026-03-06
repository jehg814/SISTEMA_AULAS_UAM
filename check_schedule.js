const mariadb = require('mariadb');

const pool = mariadb.createPool({
    host: '104.131.162.236',
    port: 3434,
    user: 'consulta_uam',
    password: 'aRluAv9F8UNC66Gu72Qw',
    database: 'cestudio_uam',
    connectionLimit: 5
});

async function checkSchedule() {
    let conn;
    try {
        conn = await pool.getConnection();

        console.log('=== Buscando DED7005 sección 1M en periodo 2025-3 ===\n');

        // Buscar la materia específica
        const query1 = await conn.query(`
            SELECT
                CodPeriodo, CodAsignatura, Secc, CodSede,
                Horario1, Horario2, Horario3, Horario4, Horario5, Horario6, Horario7,
                Cupo, Uso
            FROM Oferta
            WHERE CodAsignatura = 'DED7005'
            AND Secc = '1M'
            AND CodPeriodo LIKE '%2025%'
        `);

        console.log('Resultados encontrados:', query1.length);
        query1.forEach(row => {
            console.log('\nPeriodo:', row.CodPeriodo);
            console.log('Asignatura:', row.CodAsignatura, 'Sección:', row.Secc);
            console.log('Sede:', row.CodSede);
            console.log('Cupo:', row.Cupo, 'Uso:', row.Uso);
            console.log('Horarios:');
            console.log('  Lunes (Horario1):', row.Horario1);
            console.log('  Martes (Horario2):', row.Horario2);
            console.log('  Miércoles (Horario3):', row.Horario3);
            console.log('  Jueves (Horario4):', row.Horario4);
            console.log('  Viernes (Horario5):', row.Horario5);
            console.log('  Sábado (Horario6):', row.Horario6);
            console.log('  Domingo (Horario7):', row.Horario7);
        });

        console.log('\n=== Verificando todas las asignaturas en aula V1-1 los lunes ===\n');

        const query2 = await conn.query(`
            SELECT
                CodAsignatura, Secc, Horario1, Cupo, Uso
            FROM Oferta
            WHERE CodPeriodo LIKE '%2025%'
            AND CodSede = '1'
            AND Horario1 LIKE '%V1-1%'
        `);

        console.log('Total encontradas en V1-1 los Lunes:', query2.length);
        query2.forEach(row => {
            console.log(`${row.CodAsignatura}-${row.Secc}: ${row.Horario1} (${row.Uso}/${row.Cupo})`);
        });

        console.log('\n=== Formato de horarios - Ejemplos ===\n');
        const query3 = await conn.query(`
            SELECT DISTINCT Horario1
            FROM Oferta
            WHERE Horario1 IS NOT NULL
            AND CodPeriodo LIKE '%2025%'
            LIMIT 10
        `);

        query3.forEach(row => {
            console.log('Formato:', row.Horario1);
        });

    } catch (err) {
        console.error('Error:', err);
    } finally {
        if (conn) conn.release();
        await pool.end();
        process.exit();
    }
}

checkSchedule();
