// UAM Database Integration Module for Classroom Assignment System
// This module handles all database queries and data processing

class UAMDatabaseIntegration {
    constructor() {
        this.config = {
            database: 'cestudio_uam',
            tables: {
                oferta: 'Oferta',
                aulas: 'Aulas',
                asignaturas: 'Asignaturas',
                profesores: 'Profesores',
                ofertaProfesor: 'OfertaProfesor',
                sedes: 'Sedes',
                horas: 'Horas'
            }
        };
        
        this.cache = {
            oferta: null,
            aulas: null,
            conflicts: [],
            suggestions: []
        };
    }

    // Main query to get the complete offer with classroom assignments
    async getOfertaCompleta(periodo, sede = null) {
        let query = `
            SELECT 
                o.CodAsignatura,
                a.Nombre as NombreAsignatura,
                o.Secc,
                o.CodSede,
                s.Nombre as NombreSede,
                o.Cupo,
                o.Uso as Inscritos,
                o.Horario1,
                o.Horario2,
                o.Horario3,
                o.Horario4,
                o.Horario5,
                o.Horario6,
                o.Horario7,
                CONCAT(IFNULL(pr.Nombre1, ''), ' ', IFNULL(pr.Apellido1, '')) as Profesor,
                au.CodAula,
                au.NombreAula,
                au.Capacidad as CapacidadAula,
                au.CodEdificio
            FROM Oferta o
            LEFT JOIN Asignaturas a ON a.CodAsignatura = o.CodAsignatura
            LEFT JOIN Sedes s ON s.CodSede = o.CodSede
            LEFT JOIN OfertaProfesor op ON op.CodPeriodo = o.CodPeriodo 
                AND op.CodAsignatura = o.CodAsignatura 
                AND op.Secc = o.Secc
            LEFT JOIN Profesores pr ON pr.CodProfesor = op.CodProfesor
            LEFT JOIN Aulas au ON au.CodAula = SUBSTRING_INDEX(SUBSTRING_INDEX(o.Horario1, ':', -1), '-', 1)
            WHERE o.CodPeriodo = ?
        `;
        
        const params = [periodo];
        
        if (sede) {
            query += ' AND o.CodSede = ?';
            params.push(sede);
        }
        
        query += ' ORDER BY o.CodAsignatura, o.Secc';
        
        return { query, params };
    }

    // Parse the schedule format from database
    parseScheduleFormat(horario1, horario2, horario3, horario4, horario5, horario6, horario7) {
        const schedule = [];
        const horarios = [horario1, horario2, horario3, horario4, horario5, horario6, horario7];
        
        horarios.forEach(horario => {
            if (horario && horario.trim() !== '') {
                // Format: "bloques:aula" e.g., "2-4:V1-4"
                const parts = horario.split(':');
                if (parts.length === 2) {
                    const [bloques, aula] = parts;
                    const [bloqueInicio, bloqueFin] = bloques.split('-').map(Number);
                    
                    // Determine the day based on the position or parse from the aula code
                    const dayCode = this.extractDayFromAula(aula);
                    
                    schedule.push({
                        bloques: bloques,
                        bloqueInicio: bloqueInicio,
                        bloqueFin: bloqueFin,
                        aula: aula,
                        dia: dayCode,
                        raw: horario
                    });
                }
            }
        });
        
        return schedule;
    }

    // Extract day information from aula code (if encoded)
    extractDayFromAula(aulaCode) {
        // This might need adjustment based on actual data format
        // For now, assuming day is encoded in the aula somehow
        // or needs to be determined from context
        
        // Map of possible day indicators
        const dayMap = {
            'L': 'Lunes',
            'M': 'Martes',
            'W': 'Miércoles',
            'J': 'Jueves',
            'V': 'Viernes',
            'S': 'Sábado'
        };
        
        // Try to extract day from aula code
        for (let dayCode in dayMap) {
            if (aulaCode.includes(dayCode)) {
                return dayCode;
            }
        }
        
        return null;
    }

    // Get all available classrooms
    async getAulas(sede = null) {
        let query = `
            SELECT 
                a.CodAula,
                a.NombreAula,
                a.Capacidad,
                a.CodEdificio,
                a.CodSede,
                s.Nombre as NombreSede,
                a.DireccionAula
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
        
        return { query, params };
    }

    // Find available classrooms for a specific time slot
    async findAvailableAulas(periodo, sede, dia, bloqueInicio, bloqueFin) {
        // First get all classrooms
        const aulasQuery = await this.getAulas(sede);
        
        // Then get occupied classrooms for the time slot
        let occupiedQuery = `
            SELECT DISTINCT 
                SUBSTRING_INDEX(SUBSTRING_INDEX(horario, ':', -1), '-', 1) as CodAula
            FROM (
                SELECT Horario1 as horario FROM Oferta WHERE CodPeriodo = ? AND CodSede = ?
                UNION ALL
                SELECT Horario2 FROM Oferta WHERE CodPeriodo = ? AND CodSede = ?
                UNION ALL
                SELECT Horario3 FROM Oferta WHERE CodPeriodo = ? AND CodSede = ?
                UNION ALL
                SELECT Horario4 FROM Oferta WHERE CodPeriodo = ? AND CodSede = ?
                UNION ALL
                SELECT Horario5 FROM Oferta WHERE CodPeriodo = ? AND CodSede = ?
                UNION ALL
                SELECT Horario6 FROM Oferta WHERE CodPeriodo = ? AND CodSede = ?
                UNION ALL
                SELECT Horario7 FROM Oferta WHERE CodPeriodo = ? AND CodSede = ?
            ) as horarios
            WHERE horario IS NOT NULL
              AND horario LIKE CONCAT(?, '-', ?, ':%')
        `;
        
        const occupiedParams = [
            periodo, sede, periodo, sede, periodo, sede, periodo, sede,
            periodo, sede, periodo, sede, periodo, sede,
            bloqueInicio, bloqueFin
        ];
        
        return {
            aulasQuery,
            occupiedQuery,
            occupiedParams
        };
    }

    // Detect scheduling conflicts
    async detectConflicts(periodo, sede = null) {
        // Query to find sections with the same classroom and overlapping times
        let conflictQuery = `
            SELECT 
                o1.CodAsignatura as CodAsignatura1,
                a1.Nombre as Asignatura1,
                o1.Secc as Seccion1,
                o1.Horario1 as Horario1_1,
                o2.CodAsignatura as CodAsignatura2,
                a2.Nombre as Asignatura2,
                o2.Secc as Seccion2,
                o2.Horario1 as Horario2_1,
                SUBSTRING_INDEX(SUBSTRING_INDEX(o1.Horario1, ':', -1), '-', 1) as Aula
            FROM Oferta o1
            INNER JOIN Oferta o2 ON o1.CodPeriodo = o2.CodPeriodo
                AND o1.CodAsignatura < o2.CodAsignatura
                AND SUBSTRING_INDEX(SUBSTRING_INDEX(o1.Horario1, ':', -1), '-', 1) = 
                    SUBSTRING_INDEX(SUBSTRING_INDEX(o2.Horario1, ':', -1), '-', 1)
            LEFT JOIN Asignaturas a1 ON a1.CodAsignatura = o1.CodAsignatura
            LEFT JOIN Asignaturas a2 ON a2.CodAsignatura = o2.CodAsignatura
            WHERE o1.CodPeriodo = ?
        `;
        
        const params = [periodo];
        
        if (sede) {
            conflictQuery += ' AND o1.CodSede = ? AND o2.CodSede = ?';
            params.push(sede, sede);
        }
        
        return { query: conflictQuery, params };
    }

    // Get classroom usage statistics
    async getUsageStatistics(periodo, sede = null) {
        let statsQuery = `
            SELECT 
                COUNT(DISTINCT o.CodAsignatura, o.Secc) as TotalSecciones,
                COUNT(DISTINCT SUBSTRING_INDEX(SUBSTRING_INDEX(o.Horario1, ':', -1), '-', 1)) as AulasUsadas,
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
            statsQuery += ' AND o.CodSede = ?';
            params.push(sede);
        }
        
        return { query: statsQuery, params };
    }

    // Get detailed usage by day and time block
    async getDetailedUsageByDayAndBlock(periodo, sede = null) {
        // This would require parsing the Horario fields to extract day and block information
        // For simplicity, we'll create a summary query
        
        let detailQuery = `
            SELECT 
                o.CodAsignatura,
                a.Nombre,
                o.Secc,
                o.Horario1,
                o.Horario2,
                o.Horario3,
                o.Horario4,
                o.Horario5,
                o.Horario6,
                o.Horario7,
                o.Uso,
                o.Cupo,
                (o.Uso / NULLIF(o.Cupo, 0) * 100) as PorcentajeOcupacion
            FROM Oferta o
            LEFT JOIN Asignaturas a ON a.CodAsignatura = o.CodAsignatura
            WHERE o.CodPeriodo = ?
        `;
        
        const params = [periodo];
        
        if (sede) {
            detailQuery += ' AND o.CodSede = ?';
            params.push(sede);
        }
        
        detailQuery += ' ORDER BY o.CodAsignatura, o.Secc';
        
        return { query: detailQuery, params };
    }

    // Find sections that could share classrooms
    async findShareableSections(periodo, sede = null) {
        // Query to find sections from the same program or related subjects
        // that could potentially share classrooms (e.g., labs, seminars)
        
        let shareableQuery = `
            SELECT 
                o1.CodAsignatura,
                a1.Nombre as NombreAsignatura1,
                o1.Secc as Seccion1,
                o1.Uso as Inscritos1,
                o1.Cupo as Cupo1,
                o2.CodAsignatura as CodAsignatura2,
                a2.Nombre as NombreAsignatura2,
                o2.Secc as Seccion2,
                o2.Uso as Inscritos2,
                o2.Cupo as Cupo2,
                (o1.Uso + o2.Uso) as TotalInscritos
            FROM Oferta o1
            INNER JOIN Oferta o2 ON o1.CodPeriodo = o2.CodPeriodo
                AND o1.CodAsignatura < o2.CodAsignatura
            LEFT JOIN Asignaturas a1 ON a1.CodAsignatura = o1.CodAsignatura
            LEFT JOIN Asignaturas a2 ON a2.CodAsignatura = o2.CodAsignatura
            WHERE o1.CodPeriodo = ?
                AND (o1.Uso + o2.Uso) <= LEAST(o1.Cupo, o2.Cupo)
        `;
        
        const params = [periodo];
        
        if (sede) {
            shareableQuery += ' AND o1.CodSede = ? AND o2.CodSede = ?';
            params.push(sede, sede);
        }
        
        shareableQuery += ' LIMIT 20';
        
        return { query: shareableQuery, params };
    }

    // Generate optimization suggestions using patterns
    async generateOptimizationSuggestions(periodo, sede = null) {
        const suggestions = [];
        
        // 1. Find under-utilized sections (< 50% capacity)
        let underutilizedQuery = `
            SELECT 
                o.CodAsignatura,
                a.Nombre,
                o.Secc,
                o.Uso,
                o.Cupo,
                (o.Uso / NULLIF(o.Cupo, 0) * 100) as PorcentajeUso,
                SUBSTRING_INDEX(SUBSTRING_INDEX(o.Horario1, ':', -1), '-', 1) as AulaActual,
                au.Capacidad as CapacidadAula
            FROM Oferta o
            LEFT JOIN Asignaturas a ON a.CodAsignatura = o.CodAsignatura
            LEFT JOIN Aulas au ON au.CodAula = SUBSTRING_INDEX(SUBSTRING_INDEX(o.Horario1, ':', -1), '-', 1)
            WHERE o.CodPeriodo = ?
                AND (o.Uso / NULLIF(o.Cupo, 0)) < 0.5
        `;
        
        // 2. Find sections that exceed classroom capacity
        let overcrowdedQuery = `
            SELECT 
                o.CodAsignatura,
                a.Nombre,
                o.Secc,
                o.Uso,
                SUBSTRING_INDEX(SUBSTRING_INDEX(o.Horario1, ':', -1), '-', 1) as AulaActual,
                au.Capacidad
            FROM Oferta o
            LEFT JOIN Asignaturas a ON a.CodAsignatura = o.CodAsignatura
            LEFT JOIN Aulas au ON au.CodAula = SUBSTRING_INDEX(SUBSTRING_INDEX(o.Horario1, ':', -1), '-', 1)
            WHERE o.CodPeriodo = ?
                AND o.Uso > au.Capacidad
        `;
        
        // 3. Find multiple sections of the same course with low enrollment
        let consolidationQuery = `
            SELECT 
                o.CodAsignatura,
                a.Nombre,
                COUNT(*) as NumSecciones,
                SUM(o.Uso) as TotalInscritos,
                SUM(o.Cupo) as TotalCupos,
                AVG(o.Uso / NULLIF(o.Cupo, 0) * 100) as PromedioUso
            FROM Oferta o
            LEFT JOIN Asignaturas a ON a.CodAsignatura = o.CodAsignatura
            WHERE o.CodPeriodo = ?
            GROUP BY o.CodAsignatura, a.Nombre
            HAVING NumSecciones > 1 
                AND PromedioUso < 60
        `;
        
        const params = [periodo];
        if (sede) {
            params.push(sede);
        }
        
        return {
            underutilizedQuery,
            overcrowdedQuery,
            consolidationQuery,
            params
        };
    }

    // Export assignment changes as SQL UPDATE statements
    generateUpdateSQL(changes) {
        let sql = `-- UAM Classroom Assignment Updates
-- Generated: ${new Date().toISOString()}
-- Period: ${changes.periodo}
-- Sede: ${changes.sede || 'All'}

START TRANSACTION;

`;
        
        changes.updates.forEach(update => {
            // Parse the change type and generate appropriate SQL
            if (update.type === 'reassign_classroom') {
                sql += `
-- Reassigning ${update.codAsignatura}-${update.seccion} to ${update.newAula}
UPDATE Oferta 
SET Horario1 = CONCAT(SUBSTRING_INDEX(Horario1, ':', 1), ':', '${update.newAula}')
WHERE CodPeriodo = '${update.periodo}'
  AND CodAsignatura = '${update.codAsignatura}'
  AND Secc = '${update.seccion}';
`;
            } else if (update.type === 'swap_classrooms') {
                sql += `
-- Swapping classrooms between ${update.section1} and ${update.section2}
UPDATE Oferta o1, Oferta o2
SET o1.Horario1 = o2.Horario1,
    o2.Horario1 = o1.Horario1
WHERE o1.CodPeriodo = '${update.periodo}'
  AND o1.CodAsignatura = '${update.codAsignatura1}'
  AND o1.Secc = '${update.seccion1}'
  AND o2.CodPeriodo = '${update.periodo}'
  AND o2.CodAsignatura = '${update.codAsignatura2}'
  AND o2.Secc = '${update.seccion2}';
`;
            } else if (update.type === 'clear_assignment') {
                sql += `
-- Clearing classroom assignment for ${update.codAsignatura}-${update.seccion}
UPDATE Oferta 
SET Horario1 = NULL,
    Horario2 = NULL,
    Horario3 = NULL,
    Horario4 = NULL,
    Horario5 = NULL,
    Horario6 = NULL,
    Horario7 = NULL
WHERE CodPeriodo = '${update.periodo}'
  AND CodAsignatura = '${update.codAsignatura}'
  AND Secc = '${update.seccion}';
`;
            }
        });
        
        sql += `
COMMIT;

-- End of updates
`;
        
        return sql;
    }

    // Helper function to format results for the UI
    formatResultsForUI(queryResults) {
        return queryResults.map(row => {
            // Parse the schedule fields
            const schedule = this.parseScheduleFormat(
                row.Horario1, row.Horario2, row.Horario3,
                row.Horario4, row.Horario5, row.Horario6, row.Horario7
            );
            
            return {
                codAsignatura: row.CodAsignatura,
                nombreAsignatura: row.NombreAsignatura || row.Nombre,
                seccion: row.Secc,
                sede: row.CodSede,
                nombreSede: row.NombreSede,
                cupo: row.Cupo,
                inscritos: row.Inscritos || row.Uso,
                profesor: row.Profesor,
                aula: row.CodAula,
                nombreAula: row.NombreAula,
                capacidadAula: row.CapacidadAula,
                edificio: row.CodEdificio,
                schedule: schedule,
                porcentajeOcupacion: ((row.Inscritos || row.Uso) / row.Cupo * 100).toFixed(1)
            };
        });
    }

    // AI-powered optimization function
    async runAIOptimization(data) {
        // This would integrate with an AI service
        // For now, we'll implement rule-based optimization
        
        const optimizationRules = {
            // Rule 1: Match classroom size to enrollment
            sizeMatching: (section, aula) => {
                const occupancyRate = section.inscritos / aula.capacidad;
                if (occupancyRate < 0.4) return { score: 30, reason: 'Aula muy grande para la sección' };
                if (occupancyRate > 0.9) return { score: 40, reason: 'Aula casi al límite de capacidad' };
                if (occupancyRate >= 0.6 && occupancyRate <= 0.85) return { score: 100, reason: 'Tamaño óptimo' };
                return { score: 70, reason: 'Tamaño aceptable' };
            },
            
            // Rule 2: Minimize room changes for same program
            programGrouping: (sections) => {
                // Group sections by program/department
                const grouped = {};
                sections.forEach(s => {
                    const dept = s.codAsignatura.substring(0, 3);
                    if (!grouped[dept]) grouped[dept] = [];
                    grouped[dept].push(s);
                });
                return grouped;
            },
            
            // Rule 3: Prioritize specialized rooms for specific courses
            specializedRooms: (section) => {
                const labCourses = ['FIS', 'QUI', 'BIO', 'INF'];
                const needsLab = labCourses.some(prefix => section.codAsignatura.startsWith(prefix));
                return { needsLab, priority: needsLab ? 'high' : 'normal' };
            },
            
            // Rule 4: Balance usage across time blocks
            timeBalance: (schedule) => {
                const blockUsage = {};
                schedule.forEach(slot => {
                    const key = `${slot.dia}-${slot.bloques}`;
                    blockUsage[key] = (blockUsage[key] || 0) + 1;
                });
                
                const values = Object.values(blockUsage);
                const avg = values.reduce((a, b) => a + b, 0) / values.length;
                const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
                
                return { balanced: variance < 2, score: 100 - (variance * 10) };
            }
        };
        
        return optimizationRules;
    }
}

// Export the module for use in the main application
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UAMDatabaseIntegration;
}
