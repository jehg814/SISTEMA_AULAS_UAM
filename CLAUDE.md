# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Classroom assignment system for Universidad Arturo Michelena (UAM). Node.js/Express backend with MariaDB, single-file vanilla JS frontend. All user-facing content is in Spanish.

## Commands

```bash
npm run dev          # Start dev server with nodemon (port 3000)
npm start            # Start production server
node test_db_connection.js   # Test database connectivity
```

No test suite exists. No build step — the frontend is a single HTML file served statically.

## Architecture

- **`server.js`** — Express API server (~1400 lines). MariaDB connection pool, REST endpoints, Claude AI integration for smart classroom search. Loads 4 data files at startup.
- **`sistema_asignacion_aulas.html`** — Entire frontend SPA (~5000 lines). 9 tab modules: visualization, search, conflicts, unassigned sections, statistics, AI search, change management, planning, period comparison.
- **`DOCUMENTACION_SISTEMA.md`** — Comprehensive guide for humans and AI agents on how to use the system and perform classroom assignments. **Read this file before doing any classroom assignment work.**
- **`TIPOS_AULA_ASIGNATURAS.txt`** — Maps subject codes to room types and specific historical aulas. Loaded at server startup. Primary source for room type determination.
- **`MATERIAS_FUERADE_AULA.txt`** — Subjects excluded from classroom assignment (external facilities). Only source of truth for exclusions.
- **`MATERIASEQUIVALENTES.txt`** — Pairs of equivalent subjects that share classrooms without conflict.

### Key Data Concepts

- **Schedule format** in DB: `Horario1`-`Horario7` fields (1=Monday...7=Sunday), value format: `bloqueInicio-bloqueFin:CodigoAula` (e.g., `5-8:A2-6`). Multiple slots per day comma-separated: `1-2:V1-1,3-4:V1-2`. No aula assigned: `5-8` (no colon). Watch for irregular formats: single block (`4:V1-4`), semicolons instead of commas.
- **Blocks 1-18** map to 07:00-21:25 in ~45-90min increments.
- **Sedes**: 1=San Diego (main), 2=Centro Histórico de Valencia.
- **Room types**: SALON, LABORATORIO, COMPUTACION, SALA_DIBUJO, SALON_CAMILLAS (max cap 16), SALON_POSTGRADO, ESPECIAL, EXTERNO (excluded from assignments).
- **Subject equivalences**: Pairs of subjects that share classrooms intentionally (e.g., EAC101↔ECP101). Not considered conflicts.
- **Room type mapping file**: `TIPOS_AULA_ASIGNATURAS.txt` maps each subject to its required room type and specific historical aulas. Format: `CodAsignatura:TIPO:aula1,aula2` (pure) or `CodAsignatura:MIXTO:TIPO:aula1,aula2` (theory in SALON, practicals in TIPO). Subjects not in the file default to SALON.
- **Exclusion file**: `MATERIAS_FUERADE_AULA.txt` lists subjects that do NOT need classrooms. This is the **only** source of truth for exclusions — never assume based on subject name.

### Work Modes

The system has two explicit work modes, selectable via radio buttons in the UI:

- **Ajuste Operativo** (default): Post-enrollment. Uses real inscritos from the current period. No reference period needed. Filters sections by inscritos > 0.
- **Planificación**: Pre-enrollment. Requires a reference period. Uses reference inscritos as projections. Classifies sections as NUEVA/EXISTENTE/SIN DEMANDA. Enables Planning and Period Comparison tabs.

Key data distinction:
- **Inscritos (Uso)**: actual enrolled students. 0 in new periods (use Planificación mode).
- **Cupo**: maximum capacity set by directors. Used as proxy in Planificación mode.
- **Reference inscritos**: copied from previous period as enrollment projection (Planificación only).

### Classroom Assignment via API (for AI agents)

The full procedure is documented in `DOCUMENTACION_SISTEMA.md` under "Guia para un Agente de IA > Opcion B". Critical points:

1. **Determine the mode first**: If inscritos are 0, use Planificación with a reference period. If inscritos exist, use Ajuste Operativo.
2. **Estimate capacity**: In Planificación: reference inscritos for EXISTENTE, cupo for NUEVA. In Ajuste Operativo: real inscritos.
3. **Determine room type**: First check `TIPOS_AULA_ASIGNATURAS.txt` (loaded in memory, served via `/api/tipo-aula-historico/lote`). For MIXTO subjects, check what other sections use for the same day. If not in the file, the API falls back to BD (last 3 periods, requires ≥20% of assignments to recommend a special type). **Never fallback to a different room type** — prefer assigning the correct type with insufficient capacity over the wrong type. For LABORATORIO/COMPUTACION, prioritize the specific aulas listed in the mapping file.
4. **Sections can have multiple days** — assign an aula for each day independently.
5. **Assign sequentially with an occupancy map** — the API only knows DB state, not your in-progress proposals. Build a local `(aula, dia) → [(bloqueInicio, bloqueFin)]` map from the existing oferta, update it after each assignment, and check availability against it. Otherwise you will assign the same aula to multiple sections.
6. **Verify zero collisions** at the end: between proposals, and between proposals and existing assignments.
7. **Exclude**: subjects listed in `MATERIAS_FUERADE_AULA.txt`, SALON AZUL, aulas tipo EXTERNO/ESPECIAL. Do NOT assume exclusions based on subject name — only this file determines if a subject needs an aula.
8. **Priority order**: EXISTENTE before NUEVA, higher capacity needs first.
9. **Room sizing**: Select the smallest available room whose capacity is >= inscritos × 1.10 (10% margin for late enrollments). If no room meets the 10% margin, fall back to the smallest room that covers exact inscritos.

### API Endpoints

All accept `?sede=1|2`. Key ones:
- `GET /api/oferta/:periodo` — all sections with schedules
- `GET /api/aulas` — classroom inventory (CodAula, Capacidad, Tipo)
- `GET /api/secciones-sin-aula/:periodo?modo=planificacion` — sections needing aulas (cupo>0 filter)
- `POST /api/aulas/disponibles` — search available rooms (body: dia, bloque_inicio, bloque_fin, capacidad_minima, tipo, sede, periodo)
- `GET /api/conflictos/:periodo` — schedule conflicts
- `GET /api/equivalencias` — subject equivalence pairs

### Environment

Requires `.env` with: DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, PORT, ANTHROPIC_API_KEY. See `.env.example`.
