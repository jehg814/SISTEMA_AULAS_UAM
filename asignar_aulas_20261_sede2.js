/**
 * Script de asignación de aulas para periodo 20261, Sede 2
 * Modo: Ajuste Operativo (con inscritos reales)
 * Criterio especial: HLI1** y EPS1** → aulas CAS-*
 */

const BASE = 'http://localhost:3000';

async function fetchJSON(url) {
    const res = await fetch(url);
    return res.json();
}

async function postJSON(url, body) {
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    return res.json();
}

// Parse horario field to extract occupied blocks
// Formats: "5-8:A2-6", "5-8", "1-2:V1-1,3-4:V1-2", "4:V1-4"
function parseHorario(horarioStr) {
    if (!horarioStr) return [];
    const slots = [];
    // Split by comma or semicolon
    const parts = horarioStr.split(/[,;]/);
    for (const part of parts) {
        const trimmed = part.trim();
        if (!trimmed) continue;
        // Format: bloques:aula or just bloques
        const colonIdx = trimmed.indexOf(':');
        let bloquesPart, aula;
        if (colonIdx !== -1) {
            bloquesPart = trimmed.substring(0, colonIdx);
            aula = trimmed.substring(colonIdx + 1);
        } else {
            bloquesPart = trimmed;
            aula = null;
        }
        // Parse bloques: "5-8" or "4"
        const dashIdx = bloquesPart.indexOf('-');
        let inicio, fin;
        if (dashIdx !== -1) {
            inicio = parseInt(bloquesPart.substring(0, dashIdx));
            fin = parseInt(bloquesPart.substring(dashIdx + 1));
        } else {
            inicio = parseInt(bloquesPart);
            fin = inicio;
        }
        if (!isNaN(inicio) && !isNaN(fin)) {
            slots.push({ inicio, fin, aula });
        }
    }
    return slots;
}

// Check if two block ranges overlap
function blocksOverlap(a1, a2, b1, b2) {
    return a1 <= b2 && b1 <= a2;
}

// Check if subject starts with HLI1 or EPS1
function isHLI1orEPS1(codAsignatura) {
    return codAsignatura.startsWith('HLI1') || codAsignatura.startsWith('EPS1');
}

async function main() {
    console.log('=== Asignación de Aulas - Periodo 20261 - Sede 2 ===');
    console.log('Modo: Ajuste Operativo (inscritos reales)');
    console.log('Criterio especial: HLI1** y EPS1** → aulas CAS-*\n');

    // 1. Load data
    const [seccionesSinAula, aulas, ofertaData, equivalenciasData, materiasFueraRaw] = await Promise.all([
        fetchJSON(`${BASE}/api/secciones-sin-aula/20261?sede=2`),
        fetchJSON(`${BASE}/api/aulas?sede=2`),
        fetchJSON(`${BASE}/api/oferta/20261?sede=2`),
        fetchJSON(`${BASE}/api/equivalencias`),
        fetchJSON(`${BASE}/api/materias-fuera-de-aula`)
    ]);

    const secciones = seccionesSinAula.secciones;
    const equivalencias = equivalenciasData.equivalencias;
    const materiasFuera = new Set(materiasFueraRaw);

    console.log(`Secciones sin aula: ${secciones.length}`);
    console.log(`Aulas disponibles en sede 2: ${aulas.length}`);
    console.log(`Oferta existente: ${ofertaData.length} secciones\n`);

    // Filter out excluded subjects
    const seccionesFiltradas = secciones.filter(s => !materiasFuera.has(s.CodAsignatura));
    const excluidas = secciones.filter(s => materiasFuera.has(s.CodAsignatura));
    if (excluidas.length > 0) {
        console.log(`Secciones excluidas (materias fuera de aula): ${excluidas.length}`);
        excluidas.forEach(s => console.log(`  - ${s.CodAsignatura} ${s.NombreAsignatura} ${s.Seccion}`));
        console.log();
    }

    // 2. Build occupancy map from existing oferta: (aula, dia) => [{inicio, fin}]
    const occupancyMap = new Map(); // key: "aula|dia" => [{inicio, fin}]

    function getOccKey(aula, dia) {
        return `${aula}|${dia}`;
    }

    function addOccupancy(aula, dia, inicio, fin) {
        const key = getOccKey(aula, dia);
        if (!occupancyMap.has(key)) {
            occupancyMap.set(key, []);
        }
        occupancyMap.get(key).push({ inicio, fin });
    }

    function isAvailable(aula, dia, inicio, fin) {
        const key = getOccKey(aula, dia);
        const occupations = occupancyMap.get(key) || [];
        for (const occ of occupations) {
            if (blocksOverlap(inicio, fin, occ.inicio, occ.fin)) {
                return false;
            }
        }
        return true;
    }

    // Parse existing oferta to build occupancy map
    for (const seccion of ofertaData) {
        for (let dia = 1; dia <= 7; dia++) {
            const horario = seccion[`Horario${dia}`];
            if (!horario) continue;
            const slots = parseHorario(horario);
            for (const slot of slots) {
                if (slot.aula) {
                    addOccupancy(slot.aula, dia, slot.inicio, slot.fin);
                }
            }
        }
    }

    console.log(`Mapa de ocupación construido con ${occupancyMap.size} combinaciones aula-día\n`);

    // 3. Get room types for subjects
    const codigos = [...new Set(seccionesFiltradas.map(s => s.CodAsignatura))];
    const tiposAulaRaw = await postJSON(`${BASE}/api/tipo-aula-historico/lote`, {
        asignaturas: codigos,
        sede: 2
    });

    // Normalize response: API returns { resultados: { COD: { tipoRecomendado, mixto, ... } } }
    const tiposAula = {};
    const resultados = tiposAulaRaw.resultados || tiposAulaRaw;
    for (const [cod, info] of Object.entries(resultados)) {
        tiposAula[cod] = {
            tipo: info.tipoRecomendado || info.tipo || 'SALON',
            mixto: info.mixto || false,
            tipoPractico: info.mixto ? (info.tipoRecomendado || info.tipo) : null,
            aulasRecomendadas: info.aulasRecomendadas || [],
            fuente: info.fuente || 'default'
        };
    }

    console.log('Tipos de aula por asignatura:');
    for (const [cod, info] of Object.entries(tiposAula)) {
        if (info.tipo && info.tipo !== 'SALON') {
            console.log(`  ${cod}: ${info.tipo} (fuente: ${info.fuente}, aulas: ${info.aulasRecomendadas.join(',')})`);
        }
    }
    console.log();

    // 4. Separate CAS- aulas and non-CAS aulas
    const casAulas = aulas.filter(a => a.CodAula.startsWith('CAS-'));
    const nonCasAulas = aulas.filter(a => !a.CodAula.startsWith('CAS-'));

    console.log('Aulas CAS-:', casAulas.map(a => `${a.CodAula}(${a.Tipo},cap:${a.Capacidad})`).join(', '));
    console.log('Otras aulas:', nonCasAulas.map(a => `${a.CodAula}(${a.Tipo},cap:${a.Capacidad})`).join(', '));
    console.log();

    // 5. Sort sections: higher inscritos first (harder to place)
    seccionesFiltradas.sort((a, b) => b.Inscritos - a.Inscritos);

    // 6. Assign aulas
    const propuestas = [];
    const sinAsignar = [];

    for (const seccion of seccionesFiltradas) {
        const capacidadRequerida = seccion.Inscritos;
        const codAsig = seccion.CodAsignatura;
        const usarCAS = isHLI1orEPS1(codAsig);

        // Determine room type needed
        let tipoRequerido = 'SALON';
        if (tiposAula[codAsig]) {
            const info = tiposAula[codAsig];
            if (info.tipo === 'MIXTO') {
                // For MIXTO, theory days use SALON, practical days use the special type
                // We'll handle per-day below
                tipoRequerido = 'MIXTO';
            } else if (info.tipo) {
                tipoRequerido = info.tipo;
            }
        }

        for (const bloque of seccion.BloquesSinAula) {
            const dia = bloque.DiaNumero;
            const [bloqueInicio, bloqueFin] = bloque.Bloques.split('-').map(Number);

            // Determine effective tipo for this day (handle MIXTO)
            let tipoEfectivo = tipoRequerido;
            if (tipoRequerido === 'MIXTO' && tiposAula[codAsig]) {
                // Default to SALON for theory; check if practical
                tipoEfectivo = 'SALON';
                // If the MIXTO info has a special type, check if other sections of the same subject
                // use it on this day
                const mixtoInfo = tiposAula[codAsig];
                if (mixtoInfo.tipoPractico) {
                    // Check what other sections do on this day
                    // For simplicity, use SALON for all days (most common case)
                    // This is a safe default since SALON is theory
                    tipoEfectivo = 'SALON';
                }
            }

            // Select candidate aulas based on criteria
            let candidatas;
            if (usarCAS) {
                // HLI1** and EPS1** → must use CAS- aulas
                candidatas = casAulas.filter(a =>
                    a.Tipo === tipoEfectivo &&
                    a.Capacidad >= capacidadRequerida &&
                    isAvailable(a.CodAula, dia, bloqueInicio, bloqueFin)
                );
                // If no CAS aula with sufficient capacity, try any CAS aula of correct type
                if (candidatas.length === 0) {
                    candidatas = casAulas.filter(a =>
                        a.Tipo === tipoEfectivo &&
                        isAvailable(a.CodAula, dia, bloqueInicio, bloqueFin)
                    );
                }
                // If still none, try CAS SALON type regardless (since most CAS are SALON)
                if (candidatas.length === 0 && tipoEfectivo !== 'SALON') {
                    candidatas = casAulas.filter(a =>
                        a.Tipo === 'SALON' &&
                        isAvailable(a.CodAula, dia, bloqueInicio, bloqueFin)
                    );
                }
            } else {
                // Regular sections → use non-CAS aulas, correct type
                candidatas = nonCasAulas.filter(a =>
                    a.Tipo === tipoEfectivo &&
                    a.Capacidad >= capacidadRequerida &&
                    isAvailable(a.CodAula, dia, bloqueInicio, bloqueFin)
                );
                // If no sufficient capacity, try with smaller aulas of correct type
                if (candidatas.length === 0) {
                    candidatas = nonCasAulas.filter(a =>
                        a.Tipo === tipoEfectivo &&
                        isAvailable(a.CodAula, dia, bloqueInicio, bloqueFin)
                    );
                }
                // Never fallback to a different room type — prefer correct type with insufficient capacity
            }

            if (candidatas.length === 0) {
                sinAsignar.push({
                    CodAsignatura: codAsig,
                    NombreAsignatura: seccion.NombreAsignatura,
                    Seccion: seccion.Seccion,
                    Dia: bloque.Dia,
                    DiaNumero: dia,
                    Bloques: bloque.Bloques,
                    Inscritos: capacidadRequerida,
                    TipoRequerido: tipoEfectivo,
                    UsaCAS: usarCAS,
                    Razon: 'Sin aulas disponibles'
                });
                continue;
            }

            // Best-fit with <90% occupancy target
            const TARGET_MAX_OCC = 0.90;
            const minCapForTarget = Math.ceil(capacidadRequerida / TARGET_MAX_OCC);

            candidatas.sort((a, b) => {
                const aUnder90 = a.Capacidad >= minCapForTarget ? 1 : 0;
                const bUnder90 = b.Capacidad >= minCapForTarget ? 1 : 0;
                const aSufficient = a.Capacidad >= capacidadRequerida ? 1 : 0;
                const bSufficient = b.Capacidad >= capacidadRequerida ? 1 : 0;

                // 1. Prefer aulas that keep occupancy < 90%
                if (aUnder90 !== bUnder90) return bUnder90 - aUnder90;
                // 2. Among those, prefer smallest (best-fit with headroom)
                if (aUnder90 && bUnder90) return a.Capacidad - b.Capacidad;
                // 3. If none under 90%, prefer sufficient capacity
                if (aSufficient !== bSufficient) return bSufficient - aSufficient;
                // 4. Among sufficient but >=90%, prefer smallest
                if (aSufficient && bSufficient) return a.Capacidad - b.Capacidad;
                // 5. Among insufficient, prefer largest
                return b.Capacidad - a.Capacidad;
            });

            const aulaSeleccionada = candidatas[0];

            // Register assignment
            addOccupancy(aulaSeleccionada.CodAula, dia, bloqueInicio, bloqueFin);

            propuestas.push({
                CodAsignatura: codAsig,
                NombreAsignatura: seccion.NombreAsignatura,
                Seccion: seccion.Seccion,
                Dia: bloque.Dia,
                DiaNumero: dia,
                Bloques: bloque.Bloques,
                BloqueInicio: bloqueInicio,
                BloqueFin: bloqueFin,
                Inscritos: capacidadRequerida,
                AulaAsignada: aulaSeleccionada.CodAula,
                NombreAula: aulaSeleccionada.NombreAula,
                CapacidadAula: aulaSeleccionada.Capacidad,
                TipoAula: aulaSeleccionada.Tipo,
                TipoRequerido: tipoEfectivo,
                UsaCAS: usarCAS
            });
        }
    }

    // 7. Verify no collisions among proposals
    console.log('\n=== VERIFICACIÓN DE COLISIONES ===');
    let colisiones = 0;
    for (let i = 0; i < propuestas.length; i++) {
        for (let j = i + 1; j < propuestas.length; j++) {
            const a = propuestas[i];
            const b = propuestas[j];
            if (a.AulaAsignada === b.AulaAsignada && a.DiaNumero === b.DiaNumero) {
                if (blocksOverlap(a.BloqueInicio, a.BloqueFin, b.BloqueInicio, b.BloqueFin)) {
                    console.log(`  COLISIÓN: ${a.AulaAsignada} día ${a.Dia}: ${a.CodAsignatura}-${a.Seccion} (${a.Bloques}) vs ${b.CodAsignatura}-${b.Seccion} (${b.Bloques})`);
                    colisiones++;
                }
            }
        }
    }
    if (colisiones === 0) {
        console.log('  ✓ Sin colisiones entre propuestas');
    } else {
        console.log(`  ✗ ${colisiones} colisiones encontradas`);
    }

    // 8. Occupancy analysis
    console.log('\n=== ANÁLISIS DE OCUPACIÓN ===');
    const over90 = propuestas.filter(p => (p.Inscritos / p.CapacidadAula) >= 0.90);
    const under90 = propuestas.filter(p => (p.Inscritos / p.CapacidadAula) < 0.90);
    const avgOcc = propuestas.reduce((sum, p) => sum + (p.Inscritos / p.CapacidadAula), 0) / propuestas.length * 100;
    console.log(`  Promedio ocupación: ${avgOcc.toFixed(1)}%`);
    console.log(`  Asignaciones < 90%: ${under90.length} (${(under90.length/propuestas.length*100).toFixed(1)}%)`);
    console.log(`  Asignaciones >= 90%: ${over90.length} (${(over90.length/propuestas.length*100).toFixed(1)}%)`);
    if (over90.length > 0) {
        console.log('  Detalle >= 90%:');
        over90.sort((a, b) => (b.Inscritos/b.CapacidadAula) - (a.Inscritos/a.CapacidadAula));
        for (const p of over90) {
            const pct = ((p.Inscritos/p.CapacidadAula)*100).toFixed(1);
            console.log(`    ${pct}% | ${p.CodAsignatura} ${p.Seccion} | Insc:${p.Inscritos} → ${p.AulaAsignada}(cap:${p.CapacidadAula}) | ${p.Dia} ${p.Bloques} | Necesitaría cap>=${Math.ceil(p.Inscritos/0.9)}`);
        }
    }

    // 9. Output results
    console.log('\n=== PROPUESTAS DE ASIGNACIÓN ===');
    console.log(`Total propuestas: ${propuestas.length}`);
    console.log(`Sin asignar: ${sinAsignar.length}\n`);

    // Group by CAS vs non-CAS
    const propCAS = propuestas.filter(p => p.UsaCAS);
    const propNonCAS = propuestas.filter(p => !p.UsaCAS);

    console.log(`--- Asignaciones HLI1**/EPS1** → CAS- (${propCAS.length}) ---`);
    for (const p of propCAS) {
        console.log(`  ${p.CodAsignatura} ${p.Seccion} | ${p.Dia} bloques ${p.Bloques} | → ${p.AulaAsignada} (${p.NombreAula}, cap:${p.CapacidadAula}) | Inscritos: ${p.Inscritos}`);
    }

    console.log(`\n--- Asignaciones regulares (${propNonCAS.length}) ---`);
    for (const p of propNonCAS) {
        console.log(`  ${p.CodAsignatura} ${p.Seccion} | ${p.Dia} bloques ${p.Bloques} | → ${p.AulaAsignada} (${p.NombreAula}, cap:${p.CapacidadAula}) | Inscritos: ${p.Inscritos}`);
    }

    if (sinAsignar.length > 0) {
        console.log(`\n--- Sin asignar (${sinAsignar.length}) ---`);
        for (const s of sinAsignar) {
            console.log(`  ${s.CodAsignatura} ${s.Seccion} | ${s.Dia} bloques ${s.Bloques} | Inscritos: ${s.Inscritos} | Tipo: ${s.TipoRequerido} | CAS: ${s.UsaCAS} | Razón: ${s.Razon}`);
        }
    }

    // 9. Generate SQL
    console.log('\n=== SQL DE ASIGNACIÓN ===');

    // Group proposals by (CodAsignatura, Seccion) to build complete horario updates
    const seccionMap = new Map(); // key: "codAsig|seccion" => { current horarios, new assignments }

    // First, get current horarios from oferta for sections we're assigning
    for (const p of propuestas) {
        const key = `${p.CodAsignatura}|${p.Seccion}`;
        if (!seccionMap.has(key)) {
            // Find current oferta record
            const ofertaRecord = ofertaData.find(o =>
                o.CodAsignatura === p.CodAsignatura && o.Secc === p.Seccion
            );
            seccionMap.set(key, {
                codAsig: p.CodAsignatura,
                seccion: p.Seccion,
                horarios: {},
                assignments: []
            });
            // Copy existing horarios
            if (ofertaRecord) {
                for (let dia = 1; dia <= 7; dia++) {
                    const h = ofertaRecord[`Horario${dia}`];
                    if (h) {
                        seccionMap.get(key).horarios[dia] = h;
                    }
                }
            }
        }
        seccionMap.get(key).assignments.push(p);
    }

    // Build SQL updates
    const sqlStatements = [];
    for (const [key, data] of seccionMap) {
        const setClauses = [];

        for (const assignment of data.assignments) {
            const dia = assignment.DiaNumero;
            const currentHorario = data.horarios[dia] || '';

            // Parse current horario to update the specific block with aula
            let newHorario;
            if (currentHorario) {
                // Current horario might have multiple slots
                const slots = currentHorario.split(/[,;]/);
                const updatedSlots = slots.map(slot => {
                    const trimmed = slot.trim();
                    const colonIdx = trimmed.indexOf(':');
                    let bloquesPart = colonIdx !== -1 ? trimmed.substring(0, colonIdx) : trimmed;
                    // Check if this slot matches our assignment
                    if (bloquesPart === assignment.Bloques) {
                        return `${bloquesPart}:${assignment.AulaAsignada}`;
                    }
                    return trimmed;
                });
                newHorario = updatedSlots.join(',');
            } else {
                newHorario = `${assignment.Bloques}:${assignment.AulaAsignada}`;
            }

            setClauses.push(`Horario${dia} = '${newHorario}'`);
        }

        if (setClauses.length > 0) {
            const sql = `UPDATE oferta SET ${setClauses.join(', ')} WHERE CodAsignatura = '${data.codAsig}' AND Secc = '${data.seccion}' AND Periodo = '20261' AND CodSede = '2';`;
            sqlStatements.push(sql);
        }
    }

    console.log();
    for (const sql of sqlStatements) {
        console.log(sql);
    }

    // Save SQL to file
    const fs = require('fs');
    fs.writeFileSync('asignaciones_20261_sede2.sql', sqlStatements.join('\n'));
    console.log(`\n✓ SQL guardado en asignaciones_20261_sede2.sql`);

    // Save proposals as JSON
    fs.writeFileSync('asignaciones_propuestas_20261_s2.json', JSON.stringify({ propuestas, sinAsignar }, null, 2));
    console.log('✓ Propuestas guardadas en asignaciones_propuestas_20261_s2.json');

    // Save as CSV
    const csvLines = ['CodAsignatura,NombreAsignatura,Seccion,Dia,Bloques,AulaAsignada,NombreAula,CapacidadAula,TipoAula,Inscritos,UsaCAS'];
    for (const p of propuestas) {
        csvLines.push(`${p.CodAsignatura},"${p.NombreAsignatura}",${p.Seccion},${p.Dia},${p.Bloques},${p.AulaAsignada},"${p.NombreAula}",${p.CapacidadAula},${p.TipoAula},${p.Inscritos},${p.UsaCAS}`);
    }
    fs.writeFileSync('asignaciones_propuestas_20261_s2.csv', csvLines.join('\n'));
    console.log('✓ CSV guardado en asignaciones_propuestas_20261_s2.csv');
}

main().catch(console.error);
