// Servidor Node.js para el Sistema de Asignación de Aulas UAM
// Este servidor conecta la interfaz web con la base de datos MariaDB

require('dotenv').config();

const express = require('express');
const mariadb = require('mariadb');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
const PORT = process.env.PORT || 3000;

// Inicializar cliente de Anthropic
const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

// Cargar materias equivalentes al inicio
let materiasEquivalentes = new Map();

// Almacenar tipos de aula desde la base de datos
let tiposAula = new Map(); // Map<CodAula, Tipo>

function cargarMateriasEquivalentes() {
    try {
        const filePath = path.join(__dirname, 'MATERIASEQUIVALENTES.txt');
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n').filter(line => line.trim());

        // Crear un mapa bidireccional de equivalencias
        materiasEquivalentes.clear();

        lines.forEach(line => {
            const [mat1, mat2] = line.trim().split(':');
            if (mat1 && mat2) {
                // Agregar en ambas direcciones
                if (!materiasEquivalentes.has(mat1)) {
                    materiasEquivalentes.set(mat1, new Set());
                }
                if (!materiasEquivalentes.has(mat2)) {
                    materiasEquivalentes.set(mat2, new Set());
                }
                materiasEquivalentes.get(mat1).add(mat2);
                materiasEquivalentes.get(mat2).add(mat1);
            }
        });

        console.log(`✓ Cargadas ${lines.length} equivalencias de materias`);
    } catch (error) {
        console.error('Error cargando MATERIASEQUIVALENTES.txt:', error.message);
    }
}

// Función para verificar si dos materias son equivalentes
function sonMateriasEquivalentes(materia1, materia2) {
    if (materia1 === materia2) return true;
    const equivalentes = materiasEquivalentes.get(materia1);
    return equivalentes ? equivalentes.has(materia2) : false;
}

// Función para cargar tipos de aula desde la base de datos
async function cargarTiposAula() {
    let conn;
    try {
        conn = await pool.getConnection();

        const query = `
            SELECT CodAula, TipoAula
            FROM Aulas
            WHERE TipoAula IS NOT NULL
        `;

        const rows = await conn.query(query);

        tiposAula.clear();

        rows.forEach(row => {
            if (row.CodAula && row.TipoAula) {
                tiposAula.set(row.CodAula.toString().trim(), row.TipoAula.toString().trim());
            }
        });

        console.log(`✓ Tipos de aula cargados desde BD: ${tiposAula.size} aulas`);

        // Log de tipos encontrados
        const tiposUnicos = new Set(tiposAula.values());
        console.log(`  Tipos únicos: ${Array.from(tiposUnicos).join(', ')}`);

    } catch (error) {
        console.error('Error al cargar tipos de aula desde BD:', error.message);
    } finally {
        if (conn) conn.release();
    }
}

// Función para obtener el tipo de un aula
function getTipoAula(codAula) {
    return tiposAula.get(codAula) || 'Salon'; // Default: Salon
}

// Función para verificar si un aula es externa (debe ser excluida)
function esAulaExterna(codAula) {
    const tipo = tiposAula.get(codAula);
    return tipo === 'EXTERNO' || tipo === 'Externo' || tipo === 'externo';
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Configuración de la base de datos desde variables de entorno
const pool = mariadb.createPool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionLimit: 5
});

// Cargar equivalencias y tipos de aula al iniciar (después de crear el pool)
cargarMateriasEquivalentes();
cargarTiposAula(); // Ahora es async, se ejecuta en background

// Ruta principal - sirve la aplicación HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'sistema_asignacion_aulas.html'));
});

// API Endpoints

// Obtener oferta completa
app.get('/api/oferta/:periodo', async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const { periodo } = req.params;
        const { sede } = req.query;
        
        let query = `
            SELECT
                o.CodAsignatura,
                a.Nombre as NombreAsignatura,
                o.Secc,
                o.CodSede,
                s.Nombre as NombreSede,
                o.Cupo,
                o.Uso as Inscritos,
                o.Horario1, o.Horario2, o.Horario3,
                o.Horario4, o.Horario5, o.Horario6, o.Horario7,
                CONCAT(IFNULL(pr.Nombres, ''), ' ', IFNULL(pr.Apellidos, '')) as Profesor
            FROM Oferta o
            LEFT JOIN Asignaturas a ON a.CodAsignatura = o.CodAsignatura
            LEFT JOIN Sedes s ON s.CodSede = o.CodSede
            LEFT JOIN OfertaProfesor op ON op.CodPeriodo = o.CodPeriodo
                AND op.CodAsignatura = o.CodAsignatura
                AND op.Secc = o.Secc
            LEFT JOIN Profesores pr ON pr.CodProfesor = op.CodProfesor
            WHERE o.CodPeriodo = ?
        `;
        
        const params = [periodo];
        
        if (sede) {
            query += ' AND o.CodSede = ?';
            params.push(sede);
        }
        
        query += ' ORDER BY o.CodAsignatura, o.Secc';
        
        const rows = await conn.query(query, params);
        res.json(rows);
        
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al obtener datos de oferta' });
    } finally {
        if (conn) conn.release();
    }
});

// Obtener aulas
app.get('/api/aulas', async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const { sede } = req.query;

        let query = `
            SELECT
                a.CodAula,
                a.NombreAula,
                a.Capacidad,
                a.CodEdificio,
                a.CodSede,
                s.Nombre as NombreSede
            FROM Aulas a
            LEFT JOIN Sedes s ON s.CodSede = a.CodSede
            WHERE 1=1
        `;

        const params = [];

        if (sede) {
            query += ' AND a.CodSede = ?';
            params.push(sede);
        }

        query += ' ORDER BY a.CodSede, a.CodEdificio, a.CodAula';

        const rows = await conn.query(query, params);

        // Filter out EXTERNO classrooms and add Tipo field
        const filteredRows = rows
            .filter(aula => !esAulaExterna(aula.CodAula))
            .map(aula => ({
                ...aula,
                Tipo: getTipoAula(aula.CodAula)
            }));

        res.json(filteredRows);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al obtener aulas' });
    } finally {
        if (conn) conn.release();
    }
});

// Detectar conflictos
app.get('/api/conflictos/:periodo', async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const { periodo } = req.params;
        const { sede } = req.query;

        // Obtener todas las secciones del periodo con horarios asignados
        let query = `
            SELECT
                o.CodAsignatura,
                a.Nombre as NombreAsignatura,
                o.Secc,
                o.CodSede,
                o.Uso,
                o.Cupo,
                o.Horario1, o.Horario2, o.Horario3, o.Horario4,
                o.Horario5, o.Horario6, o.Horario7
            FROM Oferta o
            LEFT JOIN Asignaturas a ON a.CodAsignatura = o.CodAsignatura
            WHERE o.CodPeriodo = ?
                AND o.Uso > 0
        `;

        const params = [periodo];

        if (sede) {
            query += ' AND o.CodSede = ?';
            params.push(sede);
        }

        const secciones = await conn.query(query, params);

        // Función auxiliar para extraer aula y bloques de un horario
        function parseHorario(horario) {
            if (!horario) return [];
            const slots = [];
            const parts = horario.split(',');
            parts.forEach(part => {
                if (part.includes(':')) {
                    const [bloques, aula] = part.split(':');
                    if (aula) {
                        let start, end;
                        if (bloques.includes('-')) {
                            [start, end] = bloques.split('-').map(Number);
                        } else {
                            start = end = Number(bloques);
                        }
                        slots.push({ aula: aula.trim(), start, end });
                    }
                }
            });
            return slots;
        }

        // Función para verificar solapamiento de bloques
        function blocksOverlap(start1, end1, start2, end2) {
            return !(end1 < start2 || end2 < start1);
        }

        // Detectar conflictos
        const conflicts = [];
        const dias = ['Horario1', 'Horario2', 'Horario3', 'Horario4', 'Horario5', 'Horario6', 'Horario7'];
        const diasNombres = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

        for (let i = 0; i < secciones.length; i++) {
            for (let j = i + 1; j < secciones.length; j++) {
                const sec1 = secciones[i];
                const sec2 = secciones[j];

                // Verificar cada día de la semana
                dias.forEach((diaField, diaIndex) => {
                    const horario1 = sec1[diaField];
                    const horario2 = sec2[diaField];

                    if (!horario1 || !horario2) return;

                    const slots1 = parseHorario(horario1);
                    const slots2 = parseHorario(horario2);

                    // Verificar si hay conflicto en algún slot
                    slots1.forEach(slot1 => {
                        slots2.forEach(slot2 => {
                            // Conflicto: misma aula, bloques solapados, ambas con inscritos
                            // PERO NO si son materias equivalentes
                            if (slot1.aula === slot2.aula &&
                                blocksOverlap(slot1.start, slot1.end, slot2.start, slot2.end)) {

                                // Verificar si las materias son equivalentes
                                if (sonMateriasEquivalentes(sec1.CodAsignatura, sec2.CodAsignatura)) {
                                    // Son equivalentes, NO es un conflicto
                                    return;
                                }

                                conflicts.push({
                                    CodAsignatura1: sec1.CodAsignatura,
                                    Asignatura1: sec1.NombreAsignatura,
                                    Seccion1: sec1.Secc,
                                    Inscritos1: sec1.Uso,
                                    Cupo1: sec1.Cupo,
                                    CodAsignatura2: sec2.CodAsignatura,
                                    Asignatura2: sec2.NombreAsignatura,
                                    Seccion2: sec2.Secc,
                                    Inscritos2: sec2.Uso,
                                    Cupo2: sec2.Cupo,
                                    Aula: slot1.aula,
                                    Dia: diasNombres[diaIndex],
                                    Bloques1: `${slot1.start}-${slot1.end}`,
                                    Bloques2: `${slot2.start}-${slot2.end}`,
                                    Horario1: horario1,
                                    Horario2: horario2
                                });
                            }
                        });
                    });
                });
            }
        }

        res.json(conflicts);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al detectar conflictos' });
    } finally {
        if (conn) conn.release();
    }
});

// Detectar secciones sin aula asignada
app.get('/api/secciones-sin-aula/:periodo', async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const { periodo } = req.params;
        const { sede } = req.query;

        // Obtener todas las secciones con estudiantes inscritos
        let query = `
            SELECT
                o.CodAsignatura,
                a.Nombre as NombreAsignatura,
                o.Secc,
                o.CodSede,
                s.Nombre as NombreSede,
                o.Uso as Inscritos,
                o.Cupo,
                o.Horario1, o.Horario2, o.Horario3, o.Horario4,
                o.Horario5, o.Horario6, o.Horario7,
                CONCAT(IFNULL(pr.Nombres, ''), ' ', IFNULL(pr.Apellidos, '')) as Profesor
            FROM Oferta o
            LEFT JOIN Asignaturas a ON a.CodAsignatura = o.CodAsignatura
            LEFT JOIN Sedes s ON s.CodSede = o.CodSede
            LEFT JOIN OfertaProfesor op ON op.CodPeriodo = o.CodPeriodo
                AND op.CodAsignatura = o.CodAsignatura
                AND op.Secc = o.Secc
            LEFT JOIN Profesores pr ON pr.CodProfesor = op.CodProfesor
            WHERE o.CodPeriodo = ?
                AND o.Uso > 0
        `;

        const params = [periodo];

        if (sede) {
            query += ' AND o.CodSede = ?';
            params.push(sede);
        }

        query += ' ORDER BY o.CodAsignatura, o.Secc';

        const secciones = await conn.query(query, params);

        // Función auxiliar para verificar si un horario tiene aula asignada
        function tieneAulaAsignada(horario) {
            if (!horario || horario.trim() === '') return false;
            // Un horario sin aula sería algo como "5-6" o "5-6:"
            // Un horario con aula es "5-6:V1-1"
            return horario.includes(':') && horario.split(':')[1] && horario.split(':')[1].trim() !== '';
        }

        // Mapeo de días
        const diasNombres = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
        const horarioFields = ['Horario1', 'Horario2', 'Horario3', 'Horario4', 'Horario5', 'Horario6', 'Horario7'];

        // Analizar cada sección
        const seccionesSinAula = [];

        secciones.forEach(seccion => {
            const bloquesSinAula = [];

            horarioFields.forEach((field, index) => {
                const horario = seccion[field];

                // Si tiene horario definido pero no tiene aula asignada
                if (horario && horario.trim() !== '' && !tieneAulaAsignada(horario)) {
                    // Extraer bloques del horario
                    const bloques = horario.split(',').map(slot => {
                        if (slot.includes(':')) {
                            return slot.split(':')[0].trim();
                        }
                        return slot.trim();
                    }).filter(b => b !== '');

                    bloquesSinAula.push({
                        Dia: diasNombres[index],
                        DiaNumero: index + 1,
                        Bloques: bloques.join(', '),
                        HorarioOriginal: horario
                    });
                }
            });

            // Si esta sección tiene al menos un bloque sin aula, agregarla al reporte
            if (bloquesSinAula.length > 0) {
                seccionesSinAula.push({
                    CodAsignatura: seccion.CodAsignatura,
                    NombreAsignatura: seccion.NombreAsignatura,
                    Seccion: seccion.Secc,
                    Inscritos: seccion.Inscritos,
                    Cupo: seccion.Cupo,
                    Profesor: seccion.Profesor,
                    CodSede: seccion.CodSede,
                    NombreSede: seccion.NombreSede,
                    BloquesSinAula: bloquesSinAula,
                    TotalBloquesSinAula: bloquesSinAula.length
                });
            }
        });

        res.json({
            total: seccionesSinAula.length,
            secciones: seccionesSinAula
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al detectar secciones sin aula' });
    } finally {
        if (conn) conn.release();
    }
});

// Endpoint para recargar materias equivalentes
app.post('/api/recargar-equivalencias', (req, res) => {
    try {
        cargarMateriasEquivalentes();
        const totalEquivalencias = Array.from(materiasEquivalentes.keys()).length;
        res.json({
            success: true,
            mensaje: `Equivalencias recargadas exitosamente. Total de materias con equivalencias: ${totalEquivalencias}`
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Error al recargar equivalencias: ' + error.message
        });
    }
});

// Endpoint para obtener lista de equivalencias
app.get('/api/equivalencias', (req, res) => {
    try {
        const equivalencias = [];
        const procesadas = new Set();

        materiasEquivalentes.forEach((equivalentes, materia) => {
            equivalentes.forEach(equiv => {
                const par = [materia, equiv].sort().join(':');
                if (!procesadas.has(par)) {
                    procesadas.add(par);
                    equivalencias.push({ materia1: materia, materia2: equiv });
                }
            });
        });

        res.json({
            total: equivalencias.length,
            equivalencias: equivalencias
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener equivalencias' });
    }
});

// Estadísticas de uso
app.get('/api/estadisticas/:periodo', async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const { periodo } = req.params;
        const { sede } = req.query;
        
        let query = `
            SELECT 
                COUNT(DISTINCT o.CodAsignatura, o.Secc) as TotalSecciones,
                SUM(o.Uso) as TotalInscritos,
                SUM(o.Cupo) as TotalCupos,
                AVG(o.Uso / NULLIF(o.Cupo, 0) * 100) as PromedioOcupacion,
                MAX(o.Uso / NULLIF(o.Cupo, 0) * 100) as MaximaOcupacion,
                MIN(o.Uso / NULLIF(o.Cupo, 0) * 100) as MinimaOcupacion
            FROM Oferta o
            WHERE o.CodPeriodo = ?
        `;
        
        const params = [periodo];
        
        if (sede) {
            query += ' AND o.CodSede = ?';
            params.push(sede);
        }
        
        const stats = await conn.query(query, params);
        res.json(stats[0]);
        
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al obtener estadísticas' });
    } finally {
        if (conn) conn.release();
    }
});

// Buscar aulas disponibles
app.post('/api/aulas/disponibles', async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const { periodo, sede, dia, bloqueInicio, bloqueFin, capacidadMinima, tipoAula } = req.body;

        // Mapeo de día (1=Lunes, 2=Martes, etc.)
        const horarioField = `Horario${dia}`;

        // Obtener todas las aulas de la sede (con filtro de capacidad opcional)
        let aulasQuery = `
            SELECT DISTINCT
                a.CodAula,
                a.NombreAula,
                a.Capacidad,
                a.CodEdificio
            FROM Aulas a
            WHERE a.CodSede = ?
        `;

        const aulasParams = [sede];

        // Agregar filtro de capacidad mínima si se proporciona
        if (capacidadMinima && capacidadMinima > 0) {
            aulasQuery += ` AND a.Capacidad >= ?`;
            aulasParams.push(capacidadMinima);
        }

        aulasQuery += ` ORDER BY a.CodAula`;

        // Obtener las aulas ocupadas en ese día y horario
        let ocupadasQuery = `
            SELECT DISTINCT
                ${horarioField} as Horario,
                SUBSTRING_INDEX(${horarioField}, ':', -1) as AulaOcupada
            FROM Oferta
            WHERE CodPeriodo = ?
                AND CodSede = ?
                AND ${horarioField} IS NOT NULL
        `;

        const todasAulas = await conn.query(aulasQuery, aulasParams);
        const aulasConHorarios = await conn.query(ocupadasQuery, [periodo, sede]);

        // Función para verificar si dos rangos de bloques se solapan
        function blocksOverlap(range1Start, range1End, range2Start, range2End) {
            return !(range1End < range2Start || range2End < range1Start);
        }

        // Extraer aulas ocupadas que se solapan con el rango solicitado
        const ocupadasSet = new Set();

        aulasConHorarios.forEach(row => {
            const horario = row.Horario;
            if (!horario) return;

            // El formato puede ser "5-6:V1-1" o "5-6:V1-1,7-8:V1-2"
            const slots = horario.split(',');
            slots.forEach(slot => {
                if (slot.includes(':')) {
                    const [bloques, aula] = slot.split(':');

                    // Extraer rango de bloques
                    let startBlock, endBlock;
                    if (bloques.includes('-')) {
                        [startBlock, endBlock] = bloques.split('-').map(Number);
                    } else {
                        startBlock = endBlock = Number(bloques);
                    }

                    // Verificar si se solapa con el rango solicitado
                    if (blocksOverlap(startBlock, endBlock, bloqueInicio, bloqueFin)) {
                        ocupadasSet.add(aula.trim());
                    }
                }
            });
        });

        // Filtrar aulas disponibles, excluir externas y filtrar por tipo
        const aulasDisponibles = todasAulas
            .filter(a => !ocupadasSet.has(a.CodAula))
            .filter(a => !esAulaExterna(a.CodAula)) // Excluir aulas EXTERNO
            .filter(a => {
                // Filtrar por tipo si se especifica
                if (!tipoAula) return true;
                return getTipoAula(a.CodAula) === tipoAula;
            })
            .map(a => ({
                ...a,
                Tipo: getTipoAula(a.CodAula) // Agregar tipo a la respuesta
            }));

        res.json(aulasDisponibles);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al buscar aulas disponibles' });
    } finally {
        if (conn) conn.release();
    }
});

// Endpoint para obtener tipos de aula únicos
app.get('/api/tipos-aula', (req, res) => {
    try {
        const tiposUnicos = new Set();

        tiposAula.forEach(tipo => {
            // Excluir "EXTERNO"
            if (tipo !== 'EXTERNO' && tipo !== 'Externo' && tipo !== 'externo') {
                tiposUnicos.add(tipo);
            }
        });

        // Convertir a array y ordenar, asegurando que "Salon" esté primero
        const tiposArray = Array.from(tiposUnicos).sort((a, b) => {
            if (a === 'Salon') return -1;
            if (b === 'Salon') return 1;
            return a.localeCompare(b);
        });

        res.json({ tipos: tiposArray });
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener tipos de aula' });
    }
});

// Endpoint para recargar tipos de aula desde la base de datos
app.post('/api/recargar-tipos-aula', async (req, res) => {
    try {
        await cargarTiposAula();
        const totalTipos = tiposAula.size;
        const tiposUnicos = new Set(tiposAula.values());
        res.json({
            success: true,
            mensaje: `Tipos de aula recargados exitosamente desde la BD. Total de aulas: ${totalTipos}`,
            tiposUnicos: Array.from(tiposUnicos)
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Error al recargar tipos de aula: ' + error.message
        });
    }
});

// ==================== ENDPOINTS DE IA ====================

// Endpoint para obtener contexto completo para la IA
app.get('/api/ai/context/:periodo', async (req, res) => {
    let conn;
    try {
        const periodo = req.params.periodo;
        const sede = req.query.sede || '1';

        conn = await pool.getConnection();

        // Obtener todas las secciones con sus aulas asignadas
        const seccionesQuery = `
            SELECT
                o.CodAsignatura,
                a.Nombre as NombreAsignatura,
                o.Secc,
                o.Uso as Inscritos,
                o.Cupo,
                o.Horario1, o.Horario2, o.Horario3, o.Horario4, o.Horario5, o.Horario6, o.Horario7,
                o.CodSede
            FROM Oferta o
            LEFT JOIN Asignaturas a ON o.CodAsignatura = a.CodAsignatura
            WHERE o.CodPeriodo = ?
            AND o.CodSede = ?
            ORDER BY o.CodAsignatura, o.Secc
        `;

        // Obtener todas las aulas con su información
        const aulasQuery = `
            SELECT
                CodAula,
                NombreAula,
                Capacidad,
                CodEdificio,
                TipoAula,
                CodSede
            FROM Aulas
            WHERE CodSede = ?
            AND TipoAula != 'EXTERNO'
            ORDER BY CodAula
        `;

        const [secciones, aulas] = await Promise.all([
            conn.query(seccionesQuery, [periodo, sede]),
            conn.query(aulasQuery, [sede])
        ]);

        // Procesar horarios para crear un mapa de ocupación
        const ocupacionAulas = new Map();

        secciones.forEach(seccion => {
            const horarios = [
                seccion.Horario1, seccion.Horario2, seccion.Horario3,
                seccion.Horario4, seccion.Horario5, seccion.Horario6, seccion.Horario7
            ];

            horarios.forEach((horario, diaIndex) => {
                if (horario && horario.trim()) {
                    const assignments = horario.split(',');
                    assignments.forEach(assignment => {
                        const match = assignment.match(/(\d+-?\d*):([A-Z0-9-]+)/);
                        if (match) {
                            const bloques = match[1];
                            const aula = match[2];

                            if (!ocupacionAulas.has(aula)) {
                                ocupacionAulas.set(aula, []);
                            }

                            ocupacionAulas.get(aula).push({
                                dia: diaIndex + 1,
                                bloques: bloques,
                                seccion: `${seccion.CodAsignatura}-${seccion.Secc}`,
                                nombre: seccion.NombreAsignatura,
                                inscritos: seccion.Inscritos,
                                cupo: seccion.Cupo
                            });
                        }
                    });
                }
            });
        });

        // Convertir Map a objeto para JSON
        const ocupacionObj = {};
        ocupacionAulas.forEach((value, key) => {
            ocupacionObj[key] = value;
        });

        res.json({
            periodo,
            sede,
            secciones: secciones,
            aulas: aulas,
            ocupacion: ocupacionObj,
            totalSecciones: secciones.length,
            totalAulas: aulas.length
        });

    } catch (error) {
        console.error('Error obteniendo contexto:', error);
        res.status(500).json({ error: 'Error al obtener contexto para IA' });
    } finally {
        if (conn) conn.release();
    }
});

// Función auxiliar para buscar aulas disponibles en múltiples días con bloques específicos
async function buscarAulasDisponiblesMultiplesDiasBloques(conn, periodo, sede, diasBloques, capacidadMinima, tipoAula) {
    const resultados = [];

    for (const diaBloques of diasBloques) {
        const dia = diaBloques.dia;
        const bloqueInicio = diaBloques.bloqueInicio;
        const bloqueFin = diaBloques.bloqueFin;
        const horarioField = `Horario${dia}`;

        // Obtener todas las aulas de la sede
        let aulasQuery = `
            SELECT DISTINCT
                a.CodAula,
                a.NombreAula,
                a.Capacidad,
                a.CodEdificio,
                a.TipoAula
            FROM Aulas a
            WHERE a.CodSede = ?
                AND a.TipoAula != 'EXTERNO'
        `;

        const aulasParams = [sede];

        if (capacidadMinima && capacidadMinima > 0) {
            aulasQuery += ` AND a.Capacidad >= ?`;
            aulasParams.push(capacidadMinima);
        }

        if (tipoAula) {
            aulasQuery += ` AND a.TipoAula = ?`;
            aulasParams.push(tipoAula);
        }

        aulasQuery += ` ORDER BY a.CodAula`;

        // Obtener aulas ocupadas en ese día
        let ocupadasQuery = `
            SELECT DISTINCT
                o.CodAsignatura,
                a.Nombre as NombreAsignatura,
                o.Secc,
                o.Uso as Inscritos,
                o.Cupo,
                ${horarioField} as Horario
            FROM Oferta o
            LEFT JOIN Asignaturas a ON o.CodAsignatura = a.CodAsignatura
            WHERE o.CodPeriodo = ?
                AND o.CodSede = ?
                AND ${horarioField} IS NOT NULL
        `;

        const todasAulas = await conn.query(aulasQuery, aulasParams);
        const seccionesOcupadas = await conn.query(ocupadasQuery, [periodo, sede]);

        // Función para verificar solapamiento
        function blocksOverlap(range1Start, range1End, range2Start, range2End) {
            return !(range1End < range2Start || range2End < range1Start);
        }

        // Mapear aulas ocupadas con sus secciones
        const aulasOcupadasMap = new Map();

        seccionesOcupadas.forEach(row => {
            const horario = row.Horario;
            if (!horario) return;

            const slots = horario.split(',');
            slots.forEach(slot => {
                if (slot.includes(':')) {
                    const [bloques, aula] = slot.split(':');

                    let startBlock, endBlock;
                    if (bloques.includes('-')) {
                        [startBlock, endBlock] = bloques.split('-').map(Number);
                    } else {
                        startBlock = endBlock = Number(bloques);
                    }

                    if (blocksOverlap(startBlock, endBlock, bloqueInicio, bloqueFin)) {
                        if (!aulasOcupadasMap.has(aula.trim())) {
                            aulasOcupadasMap.set(aula.trim(), []);
                        }
                        aulasOcupadasMap.get(aula.trim()).push({
                            codigo: row.CodAsignatura,
                            nombre: row.NombreAsignatura,
                            seccion: row.Secc,
                            inscritos: row.Inscritos,
                            cupo: row.Cupo,
                            bloques: bloques
                        });
                    }
                }
            });
        });

        // Separar disponibles y ocupadas
        const disponibles = todasAulas.filter(a => !aulasOcupadasMap.has(a.CodAula));
        const ocupadas = todasAulas
            .filter(a => aulasOcupadasMap.has(a.CodAula))
            .map(a => ({
                ...a,
                secciones: aulasOcupadasMap.get(a.CodAula)
            }));

        // También obtener TODAS las aulas disponibles (sin filtro de capacidad)
        // para poder sugerir reasignaciones a aulas más pequeñas
        const todasAulasSinFiltro = await conn.query(`
            SELECT DISTINCT
                a.CodAula,
                a.NombreAula,
                a.Capacidad,
                a.CodEdificio,
                a.TipoAula
            FROM Aulas a
            WHERE a.CodSede = ?
                AND a.TipoAula != 'EXTERNO'
            ORDER BY a.CodAula
        `, [sede]);

        const todasDisponiblesSinFiltro = todasAulasSinFiltro.filter(a => !aulasOcupadasMap.has(a.CodAula));

        resultados.push({
            dia: dia,
            disponibles: disponibles,  // Aulas que cumplen el filtro del usuario
            todasDisponibles: todasDisponiblesSinFiltro,  // TODAS las aulas disponibles (para reasignaciones)
            ocupadas: ocupadas
        });
    }

    return resultados;
}

// Endpoint principal de búsqueda con IA
app.post('/api/ai/optimize', async (req, res) => {
    try {
        const { periodo, sede, mensajeUsuario, conversacion, parametros } = req.body;

        if (!mensajeUsuario) {
            return res.status(400).json({ error: 'Se requiere un mensaje del usuario' });
        }

        let conn = await pool.getConnection();

        let resultadosBusqueda = null;

        // Si se proporcionan parámetros, hacer búsqueda real de disponibilidad
        if (parametros && parametros.diasBloques && parametros.diasBloques.length > 0) {
            resultadosBusqueda = await buscarAulasDisponiblesMultiplesDiasBloques(
                conn,
                periodo,
                sede,
                parametros.diasBloques, // Array de {dia, bloqueInicio, bloqueFin}
                parametros.capacidadMinima,
                parametros.tipoAula
            );
        }

        conn.release();

        // Construir el prompt del sistema
        const systemPrompt = `Eres un asistente especializado en búsqueda de aulas para la Universidad Arturo Michelena (UAM).

IMPORTANTE: Los datos proporcionados ya han sido verificados y son precisos.

CONTEXTO ACTUAL:
- Periodo: ${periodo}
- Sede: ${sede === '1' ? 'San Diego' : 'Centro Histórico de Valencia'}

TU TRABAJO:
1. Presentar los resultados de búsqueda de forma clara y organizada
2. Si hay aulas disponibles que cumplen los requisitos, listarlas agrupadas por edificio
3. Si NO hay aulas disponibles que cumplan los requisitos, sugerir reasignaciones ESPECÍFICAS:

   **IMPORTANTE para reasignaciones:**
   - Identifica secciones con bajo número de inscritos ocupando aulas grandes
   - Para CADA reasignación sugerida, DEBES especificar:
     * El aula origen (donde está actualmente la sección)
     * El aula destino ESPECÍFICA (debe estar en la lista "TODAS LAS AULAS DISPONIBLES")
     * Por qué tiene sentido (ej: "La sección tiene 8 estudiantes y está en un aula de 55, se puede mover al aula X de 25 capacidad")
   - NUNCA digas "mover a un aula más pequeña" sin especificar CUÁL aula
   - VERIFICA que el aula destino tenga capacidad suficiente para los estudiantes inscritos

4. Responde SOLO lo que se te preguntó
5. Sé conciso, preciso y profesional

FORMATO DE RESPUESTA:
- Usa encabezados claros (##)
- Agrupa opciones por edificio
- Marca con ✅ las opciones disponibles
- Para reasignaciones usa este formato:
  **Mover:** [Sección] de [AulaOrigen] → [AulaDestino]
  **Razón:** [Explicación con números específicos]

RESPONDE EN ESPAÑOL de manera clara y directa.`;

        // Preparar mensajes de la conversación
        const messages = [];

        const diasNombres = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

        // Si hay conversación previa, incluirla y agregar el nuevo mensaje
        if (conversacion && Array.isArray(conversacion) && conversacion.length > 0) {
            messages.push(...conversacion);
            messages.push({
                role: 'user',
                content: mensajeUsuario
            });
        } else if (resultadosBusqueda) {
            // Si hay resultados de búsqueda, enviar datos estructurados
            let datosContext = `RESULTADOS DE BÚSQUEDA:\n\n`;
            datosContext += `CONSULTA DEL USUARIO: ${mensajeUsuario}\n\n`;

            resultadosBusqueda.forEach((resultado, idx) => {
                // Encontrar los bloques específicos para este día
                const diaBloqueInfo = parametros.diasBloques.find(db => db.dia === resultado.dia);
                const bloquesTexto = diaBloqueInfo ? ` (Bloques ${diaBloqueInfo.bloqueInicio}-${diaBloqueInfo.bloqueFin})` : '';

                datosContext += `=== ${diasNombres[resultado.dia]}${bloquesTexto} ===\n\n`;

                if (resultado.disponibles.length > 0) {
                    datosContext += `AULAS DISPONIBLES QUE CUMPLEN LOS REQUISITOS (${resultado.disponibles.length}):\n`;
                    resultado.disponibles.forEach(aula => {
                        datosContext += `- ${aula.CodAula}: ${aula.NombreAula}, Capacidad: ${aula.Capacidad}, Tipo: ${aula.TipoAula}, Edificio: ${aula.CodEdificio}\n`;
                    });
                    datosContext += '\n';
                } else {
                    datosContext += 'No hay aulas que cumplan los requisitos en este horario.\n\n';
                }

                // Incluir todas las aulas disponibles para reasignaciones
                if (resultado.todasDisponibles && resultado.todasDisponibles.length > 0) {
                    datosContext += `TODAS LAS AULAS DISPONIBLES EN ESTE HORARIO (${resultado.todasDisponibles.length} - para reasignaciones):\n`;
                    resultado.todasDisponibles.forEach(aula => {
                        datosContext += `- ${aula.CodAula}: Capacidad ${aula.Capacidad}, Tipo: ${aula.TipoAula}, Edificio: ${aula.CodEdificio}\n`;
                    });
                    datosContext += '\n';
                }

                if (resultado.ocupadas.length > 0) {
                    datosContext += `AULAS OCUPADAS (${resultado.ocupadas.length}):\n`;
                    resultado.ocupadas.slice(0, 15).forEach(aula => {
                        datosContext += `- ${aula.CodAula}: Capacidad ${aula.Capacidad}, Tipo: ${aula.TipoAula}, Edificio: ${aula.CodEdificio}\n`;
                        aula.secciones.forEach(sec => {
                            datosContext += `  * Ocupada por: ${sec.codigo} Sec.${sec.seccion} - "${sec.nombre || 'Sin nombre'}" (${sec.inscritos}/${sec.cupo} estudiantes, bloques ${sec.bloques})\n`;
                        });
                    });
                    if (resultado.ocupadas.length > 15) {
                        datosContext += `... y ${resultado.ocupadas.length - 15} aulas más ocupadas\n`;
                    }
                    datosContext += '\n';
                }
            });

            messages.push({
                role: 'user',
                content: datosContext
            });
        } else {
            // Sin parámetros de búsqueda, conversación general
            messages.push({
                role: 'user',
                content: mensajeUsuario
            });
        }

        // Llamar a Claude
        const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 8192,
            system: systemPrompt,
            messages: messages
        });

        const respuestaIA = response.content[0].text;

        res.json({
            success: true,
            respuesta: respuestaIA,
            conversacion: [
                ...messages,
                {
                    role: 'assistant',
                    content: respuestaIA
                }
            ]
        });

    } catch (error) {
        console.error('Error en búsqueda IA:', error);
        console.error('Stack trace:', error.stack);
        console.error('Error completo:', JSON.stringify(error, null, 2));
        res.status(500).json({
            error: 'Error al procesar con IA',
            detalles: error.message,
            tipo: error.name,
            status: error.status
        });
    }
});

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`
    ╔════════════════════════════════════════════════════════╗
    ║   Sistema de Asignación de Aulas UAM                  ║
    ║   Servidor iniciado exitosamente                      ║
    ╠════════════════════════════════════════════════════════╣
    ║   🌐 URL: http://localhost:${PORT}                         ║
    ║   📊 API: http://localhost:${PORT}/api                     ║
    ║                                                        ║
    ║   Presiona Ctrl+C para detener el servidor            ║
    ╚════════════════════════════════════════════════════════╝
    `);
});

// Manejo de errores
process.on('uncaughtException', (err) => {
    console.error('Error no capturado:', err);
});

process.on('unhandledRejection', (err) => {
    console.error('Promesa rechazada:', err);
});
