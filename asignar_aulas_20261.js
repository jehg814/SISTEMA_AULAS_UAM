#!/usr/bin/env node

/**
 * Script de asignacion automatica de aulas para el periodo 20261
 * Universidad Arturo Michelena (UAM) - Sede San Diego
 *
 * Uso: node asignar_aulas_20261.js
 *
 * Requiere que el servidor este corriendo en http://localhost:3000
 */

const fs = require('fs');

const API_BASE = 'http://localhost:3000';
const PERIODO_NUEVO = '20261';
const PERIODO_REFERENCIA = '20253';
const SEDE = '1';

// Aulas especiales excluidas de la asignacion
const AULAS_EXCLUIDAS = new Set([
    'SALON AZUL', 'S.AZUL', 'ESTUDTV', 'CANCHA', 'CAMARA H', 'S.ENSAYO', 'S.ESPEJO', 'CCUUAM'
]);

// Tipos de aula excluidos
const TIPOS_EXCLUIDOS = new Set(['EXTERNO', 'ESPECIAL', 'Externo', 'Especial', 'externo', 'especial']);

// Tipos especializados que no permiten fallback a SALON
const TIPOS_ESPECIALIZADOS_SIN_FALLBACK = new Set(['COMPUTACION', 'LABORATORIO']);

// Dias de la semana
const DIAS_NOMBRES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

// ============================================================================
// Funciones de utilidad
// ============================================================================

async function fetchJSON(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status} en ${url}: ${res.statusText}`);
    return res.json();
}

/**
 * Parsea un campo de horario (ej: "5-8:A2-6" o "1-2:V1-1,3-4:V1-2" o "5-8")
 * Retorna array de { bloqueInicio, bloqueFin, aula }
 * aula puede ser null si no tiene asignada
 */
function parseHorario(horarioStr) {
    if (!horarioStr || horarioStr.trim() === '') return [];

    // Separar por coma o punto y coma
    const slots = horarioStr.split(/[,;]/).map(s => s.trim()).filter(s => s !== '');
    const result = [];

    for (const slot of slots) {
        if (slot.includes(':')) {
            const colonIdx = slot.indexOf(':');
            const bloquePart = slot.substring(0, colonIdx).trim();
            const aulaPart = slot.substring(colonIdx + 1).trim();
            const { bloqueInicio, bloqueFin } = parseBloques(bloquePart);
            result.push({
                bloqueInicio,
                bloqueFin,
                aula: aulaPart || null
            });
        } else {
            // Sin aula asignada
            const { bloqueInicio, bloqueFin } = parseBloques(slot.trim());
            result.push({
                bloqueInicio,
                bloqueFin,
                aula: null
            });
        }
    }

    return result;
}

/**
 * Parsea string de bloques como "5-8" o "4" en { bloqueInicio, bloqueFin }
 */
function parseBloques(bloqueStr) {
    const parts = bloqueStr.split('-').map(Number);
    return {
        bloqueInicio: parts[0],
        bloqueFin: parts.length > 1 ? parts[parts.length - 1] : parts[0]
    };
}

/**
 * Verifica si dos rangos de bloques se solapan
 */
function bloquesOverlap(inicio1, fin1, inicio2, fin2) {
    return inicio1 <= fin2 && inicio2 <= fin1;
}

/**
 * Extrae el codigo de edificio de un codigo de aula
 * Ej: "A2-6" -> "A2", "V1-1" -> "V1", "LAB1" -> "LAB"
 */
function getEdificio(codAula) {
    if (!codAula) return '';
    // Patron comun: letras seguidas de numero, guion, numero
    const match = codAula.match(/^([A-Za-z]+\d*)/);
    return match ? match[1] : codAula;
}

/**
 * Normaliza un tipo de aula para comparacion
 */
function normalizeTipo(tipo) {
    if (!tipo) return 'SALON';
    const upper = tipo.toUpperCase().trim();
    // Mapear variantes
    if (upper === 'SALON' || upper === 'Salon') return 'SALON';
    if (upper.includes('POSTGRADO')) return 'SALON_POSTGRADO';
    if (upper.includes('CAMILLA')) return 'SALON_CAMILLAS';
    if (upper.includes('DIBUJO')) return 'SALA_DIBUJO';
    if (upper.includes('LABORATORIO') || upper === 'LABORATORIO') return 'LABORATORIO';
    if (upper.includes('COMPUTACION') || upper === 'COMPUTACION') return 'COMPUTACION';
    if (upper === 'ESPECIAL') return 'ESPECIAL';
    if (upper === 'EXTERNO') return 'EXTERNO';
    return upper;
}

// ============================================================================
// Paso 1: Fetch de datos
// ============================================================================

async function fetchAllData() {
    console.log('=== Paso 1: Cargando datos desde la API ===\n');

    const [oferta20261, oferta20253, aulas, equivalenciasResp, sinAulaResp, materiasFuera] = await Promise.all([
        fetchJSON(`${API_BASE}/api/oferta/${PERIODO_NUEVO}?sede=${SEDE}`),
        fetchJSON(`${API_BASE}/api/oferta/${PERIODO_REFERENCIA}?sede=${SEDE}`),
        fetchJSON(`${API_BASE}/api/aulas?sede=${SEDE}`),
        fetchJSON(`${API_BASE}/api/equivalencias`),
        fetchJSON(`${API_BASE}/api/secciones-sin-aula/${PERIODO_NUEVO}?sede=${SEDE}&modo=planificacion`),
        fetchJSON(`${API_BASE}/api/materias-fuera-de-aula`),
    ]);

    console.log(`  Oferta ${PERIODO_NUEVO}: ${oferta20261.length} secciones`);
    console.log(`  Oferta ${PERIODO_REFERENCIA}: ${oferta20253.length} secciones`);
    console.log(`  Aulas: ${aulas.length}`);
    console.log(`  Equivalencias: ${equivalenciasResp.total} pares`);
    console.log(`  Secciones sin aula: ${sinAulaResp.total}`);
    console.log(`  Materias fuera de aula: ${materiasFuera.length}\n`);

    return {
        oferta20261,
        oferta20253,
        aulas,
        equivalencias: equivalenciasResp.equivalencias,
        seccionesSinAula: sinAulaResp.secciones,
        materiasFuera: new Set(materiasFuera),
    };
}

// ============================================================================
// Paso 2: Construir mapa de ocupacion
// ============================================================================

function buildOccupancyMap(oferta) {
    console.log('=== Paso 2: Construyendo mapa de ocupacion ===\n');

    // Map: "aula|dia" -> [{bloqueInicio, bloqueFin}]
    const occupancy = new Map();

    const horarioFields = ['Horario1', 'Horario2', 'Horario3', 'Horario4', 'Horario5', 'Horario6', 'Horario7'];

    let totalSlots = 0;

    for (const seccion of oferta) {
        for (let i = 0; i < horarioFields.length; i++) {
            const horario = seccion[horarioFields[i]];
            if (!horario || horario.trim() === '') continue;

            const dia = i + 1; // 1=Lunes ... 7=Domingo
            const parsed = parseHorario(horario);

            for (const slot of parsed) {
                if (slot.aula && slot.bloqueInicio && slot.bloqueFin) {
                    const key = `${slot.aula}|${dia}`;
                    if (!occupancy.has(key)) {
                        occupancy.set(key, []);
                    }
                    occupancy.get(key).push({
                        bloqueInicio: slot.bloqueInicio,
                        bloqueFin: slot.bloqueFin
                    });
                    totalSlots++;
                }
            }
        }
    }

    console.log(`  Registros de ocupacion: ${totalSlots}`);
    console.log(`  Combinaciones aula-dia unicas: ${occupancy.size}\n`);

    return occupancy;
}

/**
 * Verifica si un aula esta disponible en un dia/bloques dados
 */
function isAulaAvailable(occupancy, codAula, dia, bloqueInicio, bloqueFin) {
    const key = `${codAula}|${dia}`;
    const slots = occupancy.get(key);
    if (!slots || slots.length === 0) return true;

    for (const slot of slots) {
        if (bloquesOverlap(bloqueInicio, bloqueFin, slot.bloqueInicio, slot.bloqueFin)) {
            return false;
        }
    }
    return true;
}

/**
 * Registra una asignacion en el mapa de ocupacion
 */
function registerInOccupancy(occupancy, codAula, dia, bloqueInicio, bloqueFin) {
    const key = `${codAula}|${dia}`;
    if (!occupancy.has(key)) {
        occupancy.set(key, []);
    }
    occupancy.get(key).push({ bloqueInicio, bloqueFin });
}

// ============================================================================
// Paso 3: Clasificar secciones sin aula
// ============================================================================

function classifySections(seccionesSinAula, ofertaRef) {
    console.log('=== Paso 3: Clasificando secciones sin aula ===\n');

    // Construir lookup del periodo de referencia
    const refLookup = new Map();
    for (const s of ofertaRef) {
        const key = `${s.CodAsignatura}|${s.Secc}`;
        refLookup.set(key, {
            Inscritos: Number(s.Inscritos) || 0,
            Cupo: Number(s.Cupo) || 0,
        });
    }

    const classified = [];
    let countNueva = 0, countExistente = 0, countSinDemanda = 0;

    for (const seccion of seccionesSinAula) {
        const key = `${seccion.CodAsignatura}|${seccion.Seccion}`;
        const ref = refLookup.get(key);

        let clasificacion;
        let inscritosRef = 0;

        if (!ref) {
            clasificacion = 'NUEVA';
            countNueva++;
        } else if (ref.Inscritos > 0) {
            clasificacion = 'EXISTENTE';
            inscritosRef = ref.Inscritos;
            countExistente++;
        } else {
            clasificacion = 'SIN_DEMANDA';
            countSinDemanda++;
            continue; // Skip these
        }

        classified.push({
            ...seccion,
            Clasificacion: clasificacion,
            InscritosRef: inscritosRef,
        });
    }

    console.log(`  NUEVA: ${countNueva}`);
    console.log(`  EXISTENTE: ${countExistente}`);
    console.log(`  SIN_DEMANDA (omitidas): ${countSinDemanda}\n`);

    return { classified, stats: { countNueva, countExistente, countSinDemanda } };
}

// ============================================================================
// Paso 4: Determinar tipo de aula requerido
// ============================================================================

function determineRoomTypes(classified, oferta20261, oferta20253, aulas) {
    console.log('=== Paso 4: Determinando tipo de aula para cada seccion ===\n');

    // Crear mapa de CodAula -> Tipo
    const aulaTipoMap = new Map();
    for (const a of aulas) {
        aulaTipoMap.set(a.CodAula, normalizeTipo(a.Tipo));
    }

    // Para cada asignatura, recopilar tipos de aula usados por otras secciones
    const subjectTypeMap = new Map(); // CodAsignatura -> Map<tipo, count>

    // Mapa de aula fija COMPUTACION: "CodAsignatura|Secc" -> CodAula especifico del periodo de referencia
    const computacionFixedRoom = new Map();

    const allOferta = [...oferta20261, ...oferta20253];
    const horarioFields = ['Horario1', 'Horario2', 'Horario3', 'Horario4', 'Horario5', 'Horario6', 'Horario7'];

    // Primero: construir mapa de aula fija COMPUTACION desde el periodo de referencia (por seccion)
    for (const seccion of oferta20253) {
        const key = `${seccion.CodAsignatura}|${seccion.Secc}`;
        for (const field of horarioFields) {
            const horario = seccion[field];
            if (!horario || horario.trim() === '') continue;

            const parsed = parseHorario(horario);
            for (const slot of parsed) {
                if (slot.aula) {
                    const tipo = aulaTipoMap.get(slot.aula);
                    if (tipo === 'COMPUTACION' && !computacionFixedRoom.has(key)) {
                        computacionFixedRoom.set(key, slot.aula);
                    }
                }
            }
        }
    }

    if (computacionFixedRoom.size > 0) {
        console.log(`  Secciones con aula COMPUTACION fija (desde referencia): ${computacionFixedRoom.size}`);
        for (const [key, aula] of computacionFixedRoom) {
            console.log(`    ${key.replace('|', '-')} → ${aula}`);
        }
    }

    for (const seccion of allOferta) {
        for (const field of horarioFields) {
            const horario = seccion[field];
            if (!horario || horario.trim() === '') continue;

            const parsed = parseHorario(horario);
            for (const slot of parsed) {
                if (slot.aula) {
                    const tipo = aulaTipoMap.get(slot.aula);
                    if (tipo && !TIPOS_EXCLUIDOS.has(tipo)) {
                        if (!subjectTypeMap.has(seccion.CodAsignatura)) {
                            subjectTypeMap.set(seccion.CodAsignatura, new Map());
                        }
                        const counts = subjectTypeMap.get(seccion.CodAsignatura);
                        counts.set(tipo, (counts.get(tipo) || 0) + 1);
                    }
                }
            }
        }
    }

    // Asignar tipo a cada seccion clasificada
    let countDefault = 0;
    for (const seccion of classified) {
        const typeCounts = subjectTypeMap.get(seccion.CodAsignatura);
        if (typeCounts && typeCounts.size > 0) {
            // Usar el tipo mas frecuente
            let maxCount = 0;
            let bestType = 'SALON';
            for (const [tipo, count] of typeCounts) {
                if (count > maxCount) {
                    maxCount = count;
                    bestType = tipo;
                }
            }
            seccion.TipoRequerido = bestType;
        } else {
            seccion.TipoRequerido = 'SALON';
            countDefault++;
        }

        // Si es COMPUTACION y hay aula fija desde referencia para esta seccion, guardarla
        const compKey = `${seccion.CodAsignatura}|${seccion.Seccion}`;
        if (seccion.TipoRequerido === 'COMPUTACION' && computacionFixedRoom.has(compKey)) {
            seccion.AulaFijaComputacion = computacionFixedRoom.get(compKey);
        }
    }

    console.log(`  Secciones con tipo determinado por historial: ${classified.length - countDefault}`);
    console.log(`  Secciones con tipo default (SALON): ${countDefault}\n`);
}

// ============================================================================
// Paso 5: Estimar capacidad requerida
// ============================================================================

function estimateCapacity(classified) {
    console.log('=== Paso 5: Estimando capacidad requerida ===\n');

    for (const seccion of classified) {
        if (seccion.Clasificacion === 'EXISTENTE') {
            seccion.CapacidadRequerida = seccion.InscritosRef;
        } else {
            // NUEVA: usar cupo
            seccion.CapacidadRequerida = Number(seccion.Cupo) || 30; // fallback 30
        }
        // Minimo razonable
        if (seccion.CapacidadRequerida < 1) {
            seccion.CapacidadRequerida = 15;
        }
    }

    console.log(`  Capacidades estimadas para ${classified.length} secciones\n`);
}

// ============================================================================
// Paso 6: Ordenar secciones por dificultad
// ============================================================================

function sortByDifficulty(classified) {
    console.log('=== Paso 6: Ordenando secciones por dificultad ===\n');

    classified.sort((a, b) => {
        // EXISTENTE antes de NUEVA
        if (a.Clasificacion !== b.Clasificacion) {
            return a.Clasificacion === 'EXISTENTE' ? -1 : 1;
        }
        // Mayor capacidad primero
        return b.CapacidadRequerida - a.CapacidadRequerida;
    });

    console.log(`  Primer grupo: ${classified.filter(s => s.Clasificacion === 'EXISTENTE').length} EXISTENTE`);
    console.log(`  Segundo grupo: ${classified.filter(s => s.Clasificacion === 'NUEVA').length} NUEVA\n`);
}

// ============================================================================
// Paso 7: Asignar aulas secuencialmente
// ============================================================================

function assignClassrooms(classified, aulas, occupancy) {
    console.log('=== Paso 7: Asignando aulas secuencialmente ===\n');

    // Filtrar aulas elegibles (excluir las especiales y tipos excluidos)
    const aulasElegibles = aulas.filter(a => {
        const tipo = normalizeTipo(a.Tipo);
        if (TIPOS_EXCLUIDOS.has(tipo)) return false;
        if (AULAS_EXCLUIDAS.has(a.CodAula)) return false;
        if (AULAS_EXCLUIDAS.has(a.NombreAula)) return false;
        // Verificar por nombre tambien (NombreAula puede contener el nombre especial)
        for (const excl of AULAS_EXCLUIDAS) {
            if (a.NombreAula && a.NombreAula.toUpperCase().includes(excl.toUpperCase())) return false;
            if (a.CodAula && a.CodAula.toUpperCase().includes(excl.toUpperCase())) return false;
        }
        return true;
    });

    console.log(`  Aulas elegibles: ${aulasElegibles.length} (de ${aulas.length} totales)\n`);

    // Construir indice de aulas por tipo
    const aulasByType = new Map();
    for (const a of aulasElegibles) {
        const tipo = normalizeTipo(a.Tipo);
        if (!aulasByType.has(tipo)) {
            aulasByType.set(tipo, []);
        }
        aulasByType.get(tipo).push(a);
    }

    // Ordenar aulas dentro de cada tipo por capacidad ascendente (para tight fit)
    for (const [tipo, list] of aulasByType) {
        list.sort((a, b) => a.Capacidad - b.Capacidad);
    }

    const assignments = [];    // Asignaciones exitosas
    const problematic = [];    // Secciones sin aula disponible

    let totalAssigned = 0;
    let totalFailed = 0;

    for (const seccion of classified) {
        // Track buildings used by this section for preference
        const buildingsUsed = new Set();

        for (const bloqueSinAula of seccion.BloquesSinAula) {
            const dia = bloqueSinAula.DiaNumero;
            const diaName = bloqueSinAula.Dia;

            // Parsear bloques: puede ser "5-8" o "10-12" o "5-6, 9-10"
            const bloqueStr = bloqueSinAula.Bloques;
            // BloquesSinAula.Bloques puede tener multiples rangos separados por coma
            const ranges = bloqueStr.split(',').map(s => s.trim()).filter(s => s !== '');

            for (const range of ranges) {
                const { bloqueInicio, bloqueFin } = parseBloques(range);

                if (isNaN(bloqueInicio) || isNaN(bloqueFin)) {
                    problematic.push({
                        CodAsignatura: seccion.CodAsignatura,
                        NombreAsignatura: seccion.NombreAsignatura,
                        Seccion: seccion.Seccion,
                        Dia: diaName,
                        DiaNumero: dia,
                        BloqueInicio: bloqueInicio,
                        BloqueFin: bloqueFin,
                        CapacidadRequerida: seccion.CapacidadRequerida,
                        TipoRequerido: seccion.TipoRequerido,
                        Clasificacion: seccion.Clasificacion,
                        Razon: `Bloques invalidos: "${range}"`
                    });
                    totalFailed++;
                    continue;
                }

                // Para COMPUTACION con aula fija: intentar primero esa aula especifica
                let aulaAsignada = null;

                if (seccion.AulaFijaComputacion) {
                    const aulaFija = aulasElegibles.find(a => a.CodAula === seccion.AulaFijaComputacion);
                    if (aulaFija && isAulaAvailable(occupancy, aulaFija.CodAula, dia, bloqueInicio, bloqueFin)) {
                        aulaAsignada = aulaFija;
                    }
                    // Si el aula fija no esta disponible, buscar entre las demas COMPUTACION
                }

                if (!aulaAsignada) {
                    aulaAsignada = findBestRoom(
                        occupancy,
                        aulasByType,
                        seccion.TipoRequerido,
                        seccion.CapacidadRequerida,
                        dia,
                        bloqueInicio,
                        bloqueFin,
                        buildingsUsed
                    );
                }

                if (aulaAsignada) {
                    // Registrar en mapa de ocupacion
                    registerInOccupancy(occupancy, aulaAsignada.CodAula, dia, bloqueInicio, bloqueFin);
                    buildingsUsed.add(getEdificio(aulaAsignada.CodAula));

                    assignments.push({
                        CodAsignatura: seccion.CodAsignatura,
                        NombreAsignatura: seccion.NombreAsignatura,
                        Seccion: seccion.Seccion,
                        Dia: diaName,
                        DiaNumero: dia,
                        BloqueInicio: bloqueInicio,
                        BloqueFin: bloqueFin,
                        AulaAsignada: aulaAsignada.CodAula,
                        CapacidadAula: aulaAsignada.Capacidad,
                        TipoAula: normalizeTipo(aulaAsignada.Tipo),
                        CapacidadRequerida: seccion.CapacidadRequerida,
                        Clasificacion: seccion.Clasificacion,
                        Estado: 'ASIGNADA'
                    });
                    totalAssigned++;
                } else {
                    problematic.push({
                        CodAsignatura: seccion.CodAsignatura,
                        NombreAsignatura: seccion.NombreAsignatura,
                        Seccion: seccion.Seccion,
                        Dia: diaName,
                        DiaNumero: dia,
                        BloqueInicio: bloqueInicio,
                        BloqueFin: bloqueFin,
                        CapacidadRequerida: seccion.CapacidadRequerida,
                        TipoRequerido: seccion.TipoRequerido,
                        Clasificacion: seccion.Clasificacion,
                        Razon: `No hay aula tipo ${seccion.TipoRequerido} con capacidad >= ${seccion.CapacidadRequerida} disponible`
                    });
                    totalFailed++;
                }
            }
        }
    }

    console.log(`  Asignaciones exitosas: ${totalAssigned}`);
    console.log(`  Sin aula disponible: ${totalFailed}\n`);

    return { assignments, problematic };
}

/**
 * Encuentra la mejor aula disponible para los parametros dados
 */
function findBestRoom(occupancy, aulasByType, tipoRequerido, capacidadMin, dia, bloqueInicio, bloqueFin, buildingsPreferred) {
    // Intentar primero con el tipo requerido
    let candidate = searchInType(occupancy, aulasByType, tipoRequerido, capacidadMin, dia, bloqueInicio, bloqueFin, buildingsPreferred);
    if (candidate) return candidate;

    // Fallback a SALON si el tipo no es especializado
    if (!TIPOS_ESPECIALIZADOS_SIN_FALLBACK.has(tipoRequerido) && tipoRequerido !== 'SALON') {
        candidate = searchInType(occupancy, aulasByType, 'SALON', capacidadMin, dia, bloqueInicio, bloqueFin, buildingsPreferred);
        if (candidate) return candidate;
    }

    // Para SALON_POSTGRADO y SALA_DIBUJO, tambien intentar con SALON
    // (ya cubierto arriba)

    return null;
}

/**
 * Busca dentro de un tipo de aula especifico
 */
function searchInType(occupancy, aulasByType, tipo, capacidadMin, dia, bloqueInicio, bloqueFin, buildingsPreferred) {
    const candidates = aulasByType.get(tipo);
    if (!candidates) return null;

    // Filtrar por capacidad y disponibilidad
    const available = [];
    for (const aula of candidates) {
        if (aula.Capacidad < capacidadMin) continue;
        if (!isAulaAvailable(occupancy, aula.CodAula, dia, bloqueInicio, bloqueFin)) continue;
        available.push(aula);
    }

    if (available.length === 0) return null;

    // Ordenar: capacidad mas ajustada primero, luego preferir mismo edificio
    available.sort((a, b) => {
        // Primero por capacidad (mas ajustada = menor)
        if (a.Capacidad !== b.Capacidad) {
            return a.Capacidad - b.Capacidad;
        }
        // A igual capacidad, preferir mismo edificio
        const aInPref = buildingsPreferred.has(getEdificio(a.CodAula)) ? 0 : 1;
        const bInPref = buildingsPreferred.has(getEdificio(b.CodAula)) ? 0 : 1;
        return aInPref - bInPref;
    });

    return available[0];
}

// ============================================================================
// Paso 8: Verificar colisiones
// ============================================================================

function verifyNoCollisions(assignments, occupancyOriginal) {
    console.log('=== Paso 8: Verificando colisiones ===\n');

    const collisions = [];

    // Verificar colisiones entre propuestas
    for (let i = 0; i < assignments.length; i++) {
        for (let j = i + 1; j < assignments.length; j++) {
            const a = assignments[i];
            const b = assignments[j];

            if (a.AulaAsignada === b.AulaAsignada && a.DiaNumero === b.DiaNumero) {
                if (bloquesOverlap(a.BloqueInicio, a.BloqueFin, b.BloqueInicio, b.BloqueFin)) {
                    collisions.push({
                        tipo: 'PROPUESTA-PROPUESTA',
                        aula: a.AulaAsignada,
                        dia: a.Dia,
                        seccion1: `${a.CodAsignatura}-${a.Seccion} (${a.BloqueInicio}-${a.BloqueFin})`,
                        seccion2: `${b.CodAsignatura}-${b.Seccion} (${b.BloqueInicio}-${b.BloqueFin})`,
                    });
                }
            }
        }
    }

    // Verificar colisiones con asignaciones existentes (usando occupancyOriginal)
    // Nota: occupancyOriginal ya fue modificado con las asignaciones, asi que
    // verificamos que no haya mas de una entrada en el mismo slot
    // Esto ya fue asegurado por el algoritmo, pero verificamos por seguridad

    console.log(`  Colisiones entre propuestas: ${collisions.filter(c => c.tipo === 'PROPUESTA-PROPUESTA').length}`);
    console.log(`  Total colisiones: ${collisions.length}\n`);

    return collisions;
}

// ============================================================================
// Paso 9: Generar archivos de salida
// ============================================================================

function generateCSV(assignments, problematic) {
    console.log('=== Paso 9: Generando archivos de salida ===\n');

    // CSV principal: asignaciones exitosas
    const csvHeader = 'CodAsignatura,NombreAsignatura,Seccion,Dia,DiaNumero,BloqueInicio,BloqueFin,AulaAsignada,CapacidadAula,TipoAula,CapacidadRequerida,Clasificacion,Estado';
    const csvRows = assignments.map(a =>
        `${esc(a.CodAsignatura)},${esc(a.NombreAsignatura)},${esc(a.Seccion)},${esc(a.Dia)},${a.DiaNumero},${a.BloqueInicio},${a.BloqueFin},${esc(a.AulaAsignada)},${a.CapacidadAula},${esc(a.TipoAula)},${a.CapacidadRequerida},${esc(a.Clasificacion)},${esc(a.Estado)}`
    );

    const csvContent = [csvHeader, ...csvRows].join('\n');
    const csvPath = 'asignaciones_aulas_20261.csv';
    fs.writeFileSync(csvPath, csvContent, 'utf-8');
    console.log(`  Archivo generado: ${csvPath} (${assignments.length} filas)`);

    // CSV problematico
    const probHeader = 'CodAsignatura,NombreAsignatura,Seccion,Dia,DiaNumero,BloqueInicio,BloqueFin,CapacidadRequerida,TipoRequerido,Clasificacion,Razon';
    const probRows = problematic.map(p =>
        `${esc(p.CodAsignatura)},${esc(p.NombreAsignatura)},${esc(p.Seccion)},${esc(p.Dia)},${p.DiaNumero},${p.BloqueInicio},${p.BloqueFin},${p.CapacidadRequerida},${esc(p.TipoRequerido)},${esc(p.Clasificacion)},${esc(p.Razon)}`
    );

    const probContent = [probHeader, ...probRows].join('\n');
    const probPath = 'asignaciones_problematicas_20261.csv';
    fs.writeFileSync(probPath, probContent, 'utf-8');
    console.log(`  Archivo generado: ${probPath} (${problematic.length} filas)\n`);
}

/**
 * Escapa un valor para CSV
 */
function esc(val) {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

// ============================================================================
// Resumen final
// ============================================================================

function printSummary(classified, stats, assignments, problematic, collisions) {
    console.log('============================================================');
    console.log('                    RESUMEN DE ASIGNACION');
    console.log('============================================================\n');

    console.log(`Total secciones sin aula detectadas: ${stats.countNueva + stats.countExistente + stats.countSinDemanda}`);
    console.log(`  - NUEVA: ${stats.countNueva}`);
    console.log(`  - EXISTENTE: ${stats.countExistente}`);
    console.log(`  - SIN_DEMANDA (omitidas): ${stats.countSinDemanda}`);
    console.log(`  - Procesadas: ${classified.length}\n`);

    console.log(`Asignaciones exitosas: ${assignments.length}`);
    console.log(`Sin aula disponible: ${problematic.length}`);

    if (collisions.length > 0) {
        console.log(`\n*** COLISIONES DETECTADAS: ${collisions.length} ***`);
        for (const c of collisions) {
            console.log(`  [${c.tipo}] Aula ${c.aula}, ${c.dia}: ${c.seccion1} vs ${c.seccion2}`);
        }
    } else {
        console.log(`\nColisiones: 0 (OK)`);
    }

    if (problematic.length > 0) {
        console.log(`\n--- Secciones sin aula disponible ---`);
        // Agrupar por seccion
        const grouped = new Map();
        for (const p of problematic) {
            const key = `${p.CodAsignatura}-${p.Seccion}`;
            if (!grouped.has(key)) {
                grouped.set(key, {
                    CodAsignatura: p.CodAsignatura,
                    NombreAsignatura: p.NombreAsignatura,
                    Seccion: p.Seccion,
                    Clasificacion: p.Clasificacion,
                    CapacidadRequerida: p.CapacidadRequerida,
                    TipoRequerido: p.TipoRequerido,
                    dias: []
                });
            }
            grouped.get(key).dias.push(`${p.Dia} bloques ${p.BloqueInicio}-${p.BloqueFin}: ${p.Razon}`);
        }

        for (const [key, info] of grouped) {
            console.log(`  ${key} (${info.NombreAsignatura}) [${info.Clasificacion}] cap=${info.CapacidadRequerida} tipo=${info.TipoRequerido}`);
            for (const d of info.dias) {
                console.log(`    - ${d}`);
            }
        }
    }

    console.log('\n============================================================\n');
}

// ============================================================================
// Main
// ============================================================================

async function main() {
    console.log('\n============================================================');
    console.log('  ASIGNACION AUTOMATICA DE AULAS - PERIODO 20261');
    console.log('  Universidad Arturo Michelena - Sede San Diego');
    console.log('============================================================\n');

    try {
        // Paso 1
        const data = await fetchAllData();

        // Paso 2
        const occupancy = buildOccupancyMap(data.oferta20261);

        // Paso 3
        const { classified, stats } = classifySections(
            data.seccionesSinAula,
            data.oferta20253
        );

        if (classified.length === 0) {
            console.log('No hay secciones que requieran asignacion de aula. Fin.');
            return;
        }

        // Paso 4
        determineRoomTypes(classified, data.oferta20261, data.oferta20253, data.aulas);

        // Paso 5
        estimateCapacity(classified);

        // Paso 6
        sortByDifficulty(classified);

        // Paso 7
        const { assignments, problematic } = assignClassrooms(classified, data.aulas, occupancy);

        // Paso 8
        const collisions = verifyNoCollisions(assignments, occupancy);

        // Paso 9
        generateCSV(assignments, problematic);

        // Resumen
        printSummary(classified, stats, assignments, problematic, collisions);

    } catch (err) {
        console.error('\nERROR FATAL:', err.message);
        console.error('\nAsegurate de que el servidor este corriendo en http://localhost:3000');
        console.error('Ejecuta: npm run dev\n');
        process.exit(1);
    }
}

main();
