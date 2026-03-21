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

// Mapeo de asignaturas a tipo de aula y aulas específicas (desde TIPOS_AULA_ASIGNATURAS.txt)
// Map<CodAsignatura, { tipo: string, mixto: boolean, aulas: string[] }>
let tiposAulaAsignaturas = new Map();

// Materias que no requieren aula (clínicas, pasantías, etc.)
let materiasFueraDeAula = new Set();

function cargarTiposAulaAsignaturas() {
    try {
        const filePath = path.join(__dirname, 'TIPOS_AULA_ASIGNATURAS.txt');
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n').filter(line => line.trim() && !line.trim().startsWith('#'));
        tiposAulaAsignaturas.clear();

        lines.forEach(line => {
            const parts = line.trim().split(':');
            if (parts.length < 2) return;

            const cod = parts[0];
            let tipo, mixto, aulas;

            if (parts[1] === 'MIXTO') {
                mixto = true;
                tipo = parts[2];
                aulas = parts[3] ? parts[3].split(',') : [];
            } else {
                mixto = false;
                tipo = parts[1];
                aulas = parts[2] ? parts[2].split(',') : [];
            }

            tiposAulaAsignaturas.set(cod, { tipo, mixto, aulas });
        });

        console.log(`✓ Cargadas ${tiposAulaAsignaturas.size} asignaturas con tipo de aula mapeado`);
    } catch (error) {
        console.error('Error cargando TIPOS_AULA_ASIGNATURAS.txt:', error.message);
    }
}

function cargarMateriasFueraDeAula() {
    try {
        const filePath = path.join(__dirname, 'MATERIAS_FUERADE_AULA.txt');
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n').filter(line => line.trim());
        materiasFueraDeAula.clear();
        lines.forEach(line => {
            materiasFueraDeAula.add(line.trim());
        });
        console.log(`✓ Cargadas ${materiasFueraDeAula.size} materias fuera de aula`);
    } catch (error) {
        console.error('Error cargando MATERIAS_FUERADE_AULA.txt:', error.message);
    }
}

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
    return tiposAula.get(codAula) || 'SALON'; // Default: SALON
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

// Cargar equivalencias, materias fuera de aula y tipos de aula al iniciar (después de crear el pool)
cargarMateriasEquivalentes();
cargarMateriasFueraDeAula();
cargarTiposAulaAsignaturas();
cargarTiposAula(); // Ahora es async, se ejecuta en background

// Ruta principal - sirve la aplicación HTML (sin cache para desarrollo)
app.get('/', (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.sendFile(path.join(__dirname, 'sistema_asignacion_aulas.html'));
});

// API Endpoints

// Obtener periodos disponibles
app.get('/api/periodos', async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const rows = await conn.query(
            `SELECT DISTINCT CodPeriodo FROM Oferta WHERE CodPeriodo REGEXP '^[0-9]{5}$' ORDER BY CodPeriodo DESC LIMIT 10`
        );
        res.json(rows.map(r => r.CodPeriodo));
    } catch (error) {
        console.error('Error al obtener periodos:', error);
        res.status(500).json({ error: 'Error al obtener periodos' });
    } finally {
        if (conn) conn.release();
    }
});

// Obtener tipo de aula histórico de una asignatura
// Busca en todos los períodos qué tipo de aulas ha usado la asignatura
app.get('/api/tipo-aula-historico/:codAsignatura', async (req, res) => {
    let conn;
    try {
        const { codAsignatura } = req.params;

        // 1. Buscar primero en el archivo de mapeo
        const mapeo = tiposAulaAsignaturas.get(codAsignatura);
        if (mapeo) {
            return res.json({
                codAsignatura,
                tipoRecomendado: mapeo.tipo,
                mixto: mapeo.mixto,
                aulasRecomendadas: mapeo.aulas,
                fuente: 'archivo',
                mensaje: `Tipo recomendado: ${mapeo.tipo}${mapeo.mixto ? ' (MIXTO - algunos slots en SALON)' : ''}`
            });
        }

        // 2. Fallback: buscar en BD (últimos 3 periodos)
        conn = await pool.getConnection();
        const { sede } = req.query;

        // Obtener los últimos 3 periodos disponibles
        const periodosRows = await conn.query(
            `SELECT DISTINCT CodPeriodo FROM Oferta WHERE CodPeriodo REGEXP '^[0-9]{5}$' ORDER BY CodPeriodo DESC LIMIT 3`
        );
        const ultimosPeriodos = periodosRows.map(r => r.CodPeriodo);

        if (ultimosPeriodos.length === 0) {
            return res.json({ codAsignatura, tipoRecomendado: null, mixto: false, aulasRecomendadas: [], fuente: 'bd', mensaje: 'Sin periodos disponibles' });
        }

        let query = `
            SELECT DISTINCT o.CodPeriodo, o.Horario1, o.Horario2, o.Horario3,
                   o.Horario4, o.Horario5, o.Horario6, o.Horario7
            FROM Oferta o
            WHERE o.CodAsignatura = ?
            AND o.CodPeriodo IN (${ultimosPeriodos.map(() => '?').join(',')})
        `;
        const params = [codAsignatura, ...ultimosPeriodos];

        if (sede) {
            query += ' AND o.CodSede = ?';
            params.push(sede);
        }

        query += ' ORDER BY o.CodPeriodo DESC';

        const rows = await conn.query(query, params);

        const aulasUsadas = new Set();
        const regex = /\d+-?\d*:([A-Za-z0-9._-]+)/g;

        rows.forEach(row => {
            for (let dia = 1; dia <= 7; dia++) {
                const horario = row[`Horario${dia}`];
                if (!horario) continue;
                let match;
                while ((match = regex.exec(horario)) !== null) {
                    aulasUsadas.add(match[1].trim());
                }
                regex.lastIndex = 0;
            }
        });

        if (aulasUsadas.size === 0) {
            const equivalentes = materiasEquivalentes.get(codAsignatura);
            const equivList = equivalentes ? [...equivalentes] : [];

            for (const equivCode of equivList) {
                let eqQuery = `
                    SELECT o.Horario1, o.Horario2, o.Horario3,
                           o.Horario4, o.Horario5, o.Horario6, o.Horario7
                    FROM Oferta o WHERE o.CodAsignatura = ?
                    AND o.CodPeriodo IN (${ultimosPeriodos.map(() => '?').join(',')})
                `;
                const eqParams = [equivCode, ...ultimosPeriodos];
                if (sede) {
                    eqQuery += ' AND o.CodSede = ?';
                    eqParams.push(sede);
                }
                const eqRows = await conn.query(eqQuery, eqParams);
                eqRows.forEach(row => {
                    for (let dia = 1; dia <= 7; dia++) {
                        const horario = row[`Horario${dia}`];
                        if (!horario) continue;
                        let match;
                        while ((match = regex.exec(horario)) !== null) {
                            aulasUsadas.add(match[1].trim());
                        }
                        regex.lastIndex = 0;
                    }
                });
            }
        }

        const tiposEncontrados = new Map();
        for (const codAula of aulasUsadas) {
            const tipo = getTipoAula(codAula);
            if (tipo && tipo !== 'EXTERNO' && tipo !== 'ESPECIAL') {
                tiposEncontrados.set(tipo, (tiposEncontrados.get(tipo) || 0) + 1);
            }
        }

        let tipoRecomendado = null;
        const totalAsignaciones = [...tiposEncontrados.values()].reduce((a, b) => a + b, 0);
        const tiposEspecializados = [...tiposEncontrados.entries()]
            .filter(([tipo]) => tipo !== 'SALON')
            .sort((a, b) => b[1] - a[1]);

        if (tiposEspecializados.length > 0 && tiposEspecializados[0][1] / totalAsignaciones >= 0.2) {
            // Solo recomendar tipo especial si representa al menos 30% de las asignaciones
            tipoRecomendado = tiposEspecializados[0][0];
        } else if (tiposEncontrados.has('SALON')) {
            tipoRecomendado = 'SALON';
        } else if (tiposEspecializados.length > 0) {
            tipoRecomendado = tiposEspecializados[0][0];
        }

        res.json({
            codAsignatura,
            tipoRecomendado,
            mixto: tiposEspecializados.length > 0 && tiposEncontrados.has('SALON'),
            aulasRecomendadas: [],
            fuente: 'bd',
            mensaje: tipoRecomendado
                ? `Tipo recomendado: ${tipoRecomendado} (fallback desde BD)`
                : 'Sin historial de aulas para esta asignatura'
        });

    } catch (error) {
        console.error('Error al obtener tipo de aula histórico:', error);
        res.status(500).json({ error: 'Error al obtener tipo de aula histórico' });
    } finally {
        if (conn) conn.release();
    }
});

// Obtener tipo de aula histórico en lote (múltiples asignaturas)
app.post('/api/tipo-aula-historico/lote', async (req, res) => {
    let conn;
    try {
        const { asignaturas, sede } = req.body;

        if (!asignaturas || !Array.isArray(asignaturas) || asignaturas.length === 0) {
            return res.status(400).json({ error: 'Se requiere un array de códigos de asignaturas' });
        }

        const resultados = {};
        const sinMapeo = []; // Asignaturas que no están en el archivo

        // 1. Buscar en el archivo de mapeo primero
        for (const codAsig of asignaturas) {
            const mapeo = tiposAulaAsignaturas.get(codAsig);
            if (mapeo) {
                resultados[codAsig] = {
                    tipoRecomendado: mapeo.tipo,
                    mixto: mapeo.mixto,
                    aulasRecomendadas: mapeo.aulas,
                    fuente: 'archivo',
                    sinHistorial: false
                };
            } else {
                sinMapeo.push(codAsig);
            }
        }

        // 2. Fallback a BD para las que no están en el archivo (últimos 3 periodos)
        if (sinMapeo.length > 0) {
            conn = await pool.getConnection();
            const regex = /\d+-?\d*:([A-Za-z0-9._-]+)/g;

            // Obtener los últimos 3 periodos disponibles
            const periodosRows = await conn.query(
                `SELECT DISTINCT CodPeriodo FROM Oferta WHERE CodPeriodo REGEXP '^[0-9]{5}$' ORDER BY CodPeriodo DESC LIMIT 3`
            );
            const ultimosPeriodos = periodosRows.map(r => r.CodPeriodo);

            for (const codAsig of sinMapeo) {
                let query = `
                    SELECT o.Horario1, o.Horario2, o.Horario3,
                           o.Horario4, o.Horario5, o.Horario6, o.Horario7
                    FROM Oferta o WHERE o.CodAsignatura = ?
                    AND o.CodPeriodo IN (${ultimosPeriodos.map(() => '?').join(',')})
                `;
                const params = [codAsig, ...ultimosPeriodos];
                if (sede) {
                    query += ' AND o.CodSede = ?';
                    params.push(sede);
                }

                const rows = await conn.query(query, params);
                const aulasUsadas = new Set();

                rows.forEach(row => {
                    for (let dia = 1; dia <= 7; dia++) {
                        const horario = row[`Horario${dia}`];
                        if (!horario) continue;
                        let match;
                        while ((match = regex.exec(horario)) !== null) {
                            aulasUsadas.add(match[1].trim());
                        }
                        regex.lastIndex = 0;
                    }
                });

                if (aulasUsadas.size === 0) {
                    const equivalentes = materiasEquivalentes.get(codAsig);
                    const equivList = equivalentes ? [...equivalentes] : [];
                    for (const equivCode of equivList) {
                        let eqQuery = `SELECT o.Horario1, o.Horario2, o.Horario3, o.Horario4, o.Horario5, o.Horario6, o.Horario7 FROM Oferta o WHERE o.CodAsignatura = ? AND o.CodPeriodo IN (${ultimosPeriodos.map(() => '?').join(',')})`;
                        const eqParams = [equivCode, ...ultimosPeriodos];
                        if (sede) { eqQuery += ' AND o.CodSede = ?'; eqParams.push(sede); }
                        const eqRows = await conn.query(eqQuery, eqParams);
                        eqRows.forEach(row => {
                            for (let dia = 1; dia <= 7; dia++) {
                                const horario = row[`Horario${dia}`];
                                if (!horario) continue;
                                let match;
                                while ((match = regex.exec(horario)) !== null) {
                                    aulasUsadas.add(match[1].trim());
                                }
                                regex.lastIndex = 0;
                            }
                        });
                    }
                }

                const tipos = new Map();
                for (const codAula of aulasUsadas) {
                    const tipo = getTipoAula(codAula);
                    if (tipo && tipo !== 'EXTERNO' && tipo !== 'ESPECIAL') {
                        tipos.set(tipo, (tipos.get(tipo) || 0) + 1);
                    }
                }

                let tipoRecomendado = null;
                const totalAsig = [...tipos.values()].reduce((a, b) => a + b, 0);
                const tiposEsp = [...tipos.entries()].filter(([t]) => t !== 'SALON').sort((a, b) => b[1] - a[1]);
                if (tiposEsp.length > 0 && tiposEsp[0][1] / totalAsig >= 0.2) {
                    tipoRecomendado = tiposEsp[0][0];
                } else if (tipos.has('SALON')) {
                    tipoRecomendado = 'SALON';
                } else if (tiposEsp.length > 0) {
                    tipoRecomendado = tiposEsp[0][0];
                }

                resultados[codAsig] = {
                    tipoRecomendado,
                    mixto: false,
                    aulasRecomendadas: [],
                    fuente: 'bd',
                    sinHistorial: tipoRecomendado === null
                };
            }
        }

        const sinHistorial = Object.entries(resultados).filter(([_, v]) => v.sinHistorial).map(([k]) => k);

        res.json({
            resultados,
            totalConsultadas: asignaturas.length,
            totalConHistorial: asignaturas.length - sinHistorial.length,
            sinHistorial
        });

    } catch (error) {
        console.error('Error en consulta de tipos en lote:', error);
        res.status(500).json({ error: 'Error al consultar tipos de aula en lote' });
    } finally {
        if (conn) conn.release();
    }
});

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
                GROUP_CONCAT(DISTINCT CONCAT(IFNULL(pr.Nombres, ''), ' ', IFNULL(pr.Apellidos, '')) SEPARATOR ', ') as Profesor
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

        query += ' GROUP BY o.CodAsignatura, o.Secc, o.CodSede, s.Nombre, o.Cupo, o.Uso, o.Horario1, o.Horario2, o.Horario3, o.Horario4, o.Horario5, o.Horario6, o.Horario7, a.Nombre';
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
            const parts = horario.split(/[,;]/);
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
        const { sede, modo } = req.query;

        // En modo planificacion, filtrar por cupo > 0 (no hay inscritos aun)
        // En modo normal, filtrar por inscritos > 0
        const filtro = modo === 'planificacion' ? 'o.Cupo > 0' : 'o.Uso > 0';

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
                AND ${filtro}
        `;

        const params = [periodo];

        if (sede) {
            query += ' AND o.CodSede = ?';
            params.push(sede);
        }

        query += ' ORDER BY o.CodAsignatura, o.Secc';

        const secciones = await conn.query(query, params);

        // Función auxiliar para extraer slots sin aula de un horario
        // Maneja formatos como: "5-6" (sin aula), "5-6:V1-1" (con aula),
        // "7-9;10-11:MICRO2" (mixto: 7-9 sin aula, 10-11 con aula)
        function extraerSlotsSinAula(horario) {
            if (!horario || horario.trim() === '') return [];
            const slots = horario.split(/[,;]/);
            const sinAula = [];
            for (const slot of slots) {
                const trimmed = slot.trim();
                if (!trimmed) continue;
                if (trimmed.includes(':')) {
                    // Tiene ':', verificar que realmente hay un código de aula después
                    const parts = trimmed.split(':');
                    if (!parts[1] || parts[1].trim() === '') {
                        sinAula.push(parts[0].trim());
                    }
                    // Si tiene aula (ej: "10-11:MICRO2"), no lo incluimos
                } else {
                    // No tiene ':', es un bloque sin aula
                    sinAula.push(trimmed);
                }
            }
            return sinAula;
        }

        // Mapeo de días
        const diasNombres = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
        const horarioFields = ['Horario1', 'Horario2', 'Horario3', 'Horario4', 'Horario5', 'Horario6', 'Horario7'];

        // Analizar cada sección (excluir materias que no requieren aula)
        const seccionesSinAula = [];

        secciones.filter(s => !materiasFueraDeAula.has(s.CodAsignatura)).forEach(seccion => {
            const bloquesSinAula = [];

            horarioFields.forEach((field, index) => {
                const horario = seccion[field];
                if (!horario || horario.trim() === '') return;

                const slotsSinAula = extraerSlotsSinAula(horario);
                if (slotsSinAula.length > 0) {
                    bloquesSinAula.push({
                        Dia: diasNombres[index],
                        DiaNumero: index + 1,
                        Bloques: slotsSinAula.join(', '),
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

// Endpoint para obtener materias fuera de aula
app.get('/api/materias-fuera-de-aula', (req, res) => {
    res.json(Array.from(materiasFueraDeAula));
});

// Endpoint para recargar materias fuera de aula
app.post('/api/recargar-materias-fuera-de-aula', (req, res) => {
    try {
        cargarMateriasFueraDeAula();
        res.json({
            success: true,
            mensaje: `Materias fuera de aula recargadas. Total: ${materiasFueraDeAula.size}`
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Error al recargar materias fuera de aula: ' + error.message
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

            // El formato puede ser "5-6:V1-1" o "5-6:V1-1,7-8:V1-2" (punto y coma tambien valido)
            const slots = horario.split(/[,;]/);
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

        // Convertir a array y ordenar, asegurando que "SALON" esté primero
        const tiposArray = Array.from(tiposUnicos).sort((a, b) => {
            if (a === 'SALON') return -1;
            if (b === 'SALON') return 1;
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
                    const assignments = horario.split(/[,;]/);
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

            const slots = horario.split(/[,;]/);
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
    let conn;
    try {
        const { periodo, sede, mensajeUsuario, conversacion, parametros } = req.body;

        if (!mensajeUsuario) {
            return res.status(400).json({ error: 'Se requiere un mensaje del usuario' });
        }

        conn = await pool.getConnection();

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

        // Construir el prompt del sistema
        const systemPrompt = `Eres un asistente especializado en búsqueda de aulas para la Universidad Arturo Michelena (UAM).

IMPORTANTE: Los datos proporcionados ya han sido verificados y son precisos.

CONTEXTO ACTUAL:
- Periodo: ${periodo}
- Sede: ${sede === '1' ? 'San Diego' : 'Centro Histórico de Valencia'}

HORARIOS: Los bloques van de 1 a 18. Bloques 1-2: 07:00-08:30, 3-4: 08:45-10:05, 5-6: 10:15-11:45, 7-8: 11:50-13:30, 9-10: 13:30-15:05, 11-12: 15:05-16:40, 13-14: 16:40-18:15, 15-16: 18:15-19:50, 17-18: 19:50-21:25. Días: 1=Lunes, 2=Martes, 3=Miércoles, 4=Jueves, 5=Viernes, 6=Sábado.

TU TRABAJO:
1. Cuando el usuario pida buscar un aula, debes cruzar los requisitos (día, bloques, capacidad, tipo) contra la OCUPACIÓN DETALLADA para determinar qué aulas están realmente LIBRES en ese horario específico. Un aula solo está disponible si NO tiene ninguna sección asignada en bloques que se solapen con los solicitados.
2. Presenta SOLO las aulas que estén DISPONIBLES (libres) en el horario solicitado y cumplan los requisitos.
3. Si NO hay aulas disponibles que cumplan los requisitos, propón reasignaciones ESPECÍFICAS:

   **IMPORTANTE para reasignaciones:**
   - Busca secciones con pocos inscritos ocupando aulas grandes en el horario solicitado
   - Identifica aulas más pequeñas que estén LIBRES en ese mismo horario donde mover esas secciones
   - Para CADA reasignación, DEBES especificar:
     * El aula origen (donde está la sección actualmente)
     * El aula destino ESPECÍFICA (debe estar LIBRE en el mismo día y bloques de la sección a mover)
     * Por qué tiene sentido (ej: "La sección tiene 8 inscritos en un aula de 55, se puede mover al aula X cap 25 que está libre ese día en esos bloques")
   - NUNCA digas "mover a un aula más pequeña" sin especificar CUÁL aula
   - VERIFICA que el aula destino esté LIBRE en el horario de la sección a mover Y tenga capacidad suficiente para sus inscritos

4. Responde SOLO lo que se te preguntó
5. Sé conciso, preciso y profesional

FORMATO DE RESPUESTA:
- Usa encabezados claros (##)
- Agrupa opciones por edificio
- Marca con ✅ las opciones disponibles
- Para reasignaciones usa este formato:
  **Mover:** [Sección] de [AulaOrigen] → [AulaDestino]
  **Razón:** [Explicación con números específicos]

REGLA CRÍTICA: SOLO puedes mencionar aulas cuyos códigos aparezcan explícitamente en los datos proporcionados en esta conversación. NUNCA inventes, supongas ni generes códigos de aula por tu cuenta. Si no tienes datos suficientes para responder, dilo claramente.

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
            // Sin parámetros de búsqueda: incluir inventario + ocupación completa
            const [aulasBase, seccionesBase] = await Promise.all([
                conn.query(`
                    SELECT CodAula, NombreAula, Capacidad, CodEdificio, TipoAula
                    FROM Aulas
                    WHERE CodSede = ? AND TipoAula != 'EXTERNO'
                    ORDER BY CodAula
                `, [sede]),
                conn.query(`
                    SELECT o.CodAsignatura, a.Nombre as NombreAsignatura, o.Secc,
                           o.Uso as Inscritos, o.Cupo,
                           o.Horario1, o.Horario2, o.Horario3, o.Horario4,
                           o.Horario5, o.Horario6, o.Horario7
                    FROM Oferta o
                    LEFT JOIN Asignaturas a ON o.CodAsignatura = a.CodAsignatura
                    WHERE o.CodPeriodo = ? AND o.CodSede = ?
                `, [periodo, sede])
            ]);

            // Construir mapa de ocupación por aula
            const ocupacion = new Map();
            seccionesBase.forEach(sec => {
                for (let dia = 1; dia <= 7; dia++) {
                    const horario = sec[`Horario${dia}`];
                    if (!horario || !horario.trim()) continue;
                    horario.split(/[,;]/).forEach(slot => {
                        const match = slot.trim().match(/^(\d+-?\d*):(.+)$/);
                        if (match) {
                            const aula = match[2].trim();
                            if (!ocupacion.has(aula)) ocupacion.set(aula, []);
                            ocupacion.get(aula).push({
                                dia: diasNombres[dia],
                                bloques: match[1],
                                seccion: `${sec.CodAsignatura}-${sec.Secc}`,
                                nombre: sec.NombreAsignatura,
                                inscritos: sec.Inscritos,
                                cupo: sec.Cupo
                            });
                        }
                    });
                }
            });

            let contextoBase = `INVENTARIO DE AULAS (${aulasBase.length} aulas):\n`;
            aulasBase.forEach(a => {
                const ocup = ocupacion.get(a.CodAula);
                const estado = ocup ? `OCUPADA ${ocup.length} bloques` : 'LIBRE (sin uso)';
                contextoBase += `- ${a.CodAula}: ${a.NombreAula}, Cap: ${a.Capacidad}, Tipo: ${a.TipoAula}, Edif: ${a.CodEdificio} [${estado}]\n`;
            });

            contextoBase += `\nOCUPACIÓN DETALLADA POR AULA:\n`;
            ocupacion.forEach((slots, aula) => {
                contextoBase += `\n${aula}:\n`;
                slots.forEach(s => {
                    contextoBase += `  ${s.dia} bl ${s.bloques}: ${s.seccion} "${s.nombre}" (${s.inscritos} inscritos, cupo ${s.cupo})\n`;
                });
            });

            contextoBase += `\nCONSULTA DEL USUARIO: ${mensajeUsuario}`;

            messages.push({
                role: 'user',
                content: contextoBase
            });
        }

        conn.release();
        conn = null;

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
        if (conn) conn.release();
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
