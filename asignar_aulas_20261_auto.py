#!/usr/bin/env python3
"""
Script de asignación automática de aulas para período 20261
Sede: San Diego (1)
Referencia: 20251
"""

import json
import re
import csv
from collections import defaultdict

# ========== LOAD DATA ==========
sin_aula_data = json.load(open('/tmp/sin_aula.json'))
sin_aula = sin_aula_data['secciones']
oferta_nueva = json.load(open('/tmp/oferta_nueva.json'))
oferta_ref = json.load(open('/tmp/oferta_ref.json'))
aulas = json.load(open('/tmp/aulas.json'))
equivalencias = json.load(open('/tmp/equivalencias.json'))

# Materias fuera de aula (clínicas, pasantías, etc.)
MATERIAS_FUERA = {'MPC904','SLC801','SLF1002','SLF601','SLF612','SLF702','SLF706','SLF805','SLH801','EPS814','SLF811'}

# Aulas especiales a evitar
AULAS_ESPECIALES = {'CCUUAM', 'ESTUDTV', 'S.ENSAYO', 'CAMARA H', 'CANCHA', 'S.ESPEJO', 'CIFCS', 'SALON AZUL'}

# ========== HELPER: PARSE HORARIO ==========
def parse_horario(horario_str):
    """
    Parse schedule string into list of (bloque_inicio, bloque_fin, aula_or_None).
    Formats:
      - "5-8:A2-6" -> [(5, 8, 'A2-6')]
      - "5-8" -> [(5, 8, None)]  (no aula)
      - "4:V1-4" -> [(4, 4, 'V1-4')]  (single block)
      - "1-2:V1-1,3-4:V1-2" -> [(1,2,'V1-1'), (3,4,'V1-2')]
      - semicolons also separate slots
    """
    if not horario_str or str(horario_str).strip() == '' or horario_str == 'None':
        return []

    horario_str = str(horario_str).strip()
    # Normalize separators: semicolons to commas
    horario_str = horario_str.replace(';', ',')

    results = []
    # Split by comma, but be careful: aula codes contain hyphens (e.g., A2-6)
    # Format is: bloques:aula or just bloques
    # Multiple slots: slot1,slot2

    # Strategy: split by comma, then for each part determine if it's bloques:aula or just bloques
    parts = horario_str.split(',')

    for part in parts:
        part = part.strip()
        if not part:
            continue

        if ':' in part:
            # Has aula assignment
            colon_idx = part.index(':')
            bloques_str = part[:colon_idx]
            aula = part[colon_idx+1:]
        else:
            bloques_str = part
            aula = None

        # Parse bloques
        if '-' in bloques_str:
            # Could be "5-8" (range) - but we need to be careful
            # bloques_str should be like "5-8" or "10-12"
            dash_idx = bloques_str.index('-')
            try:
                inicio = int(bloques_str[:dash_idx])
                fin = int(bloques_str[dash_idx+1:])
                results.append((inicio, fin, aula))
            except ValueError:
                # Malformed, skip
                pass
        else:
            # Single block like "4"
            try:
                bloque = int(bloques_str)
                results.append((bloque, bloque, aula))
            except ValueError:
                pass

    return results


def bloques_overlap(a_start, a_end, b_start, b_end):
    """Check if two block ranges overlap."""
    return a_start <= b_end and b_start <= a_end


# ========== STEP 1: BUILD OCCUPANCY MAP ==========
print("=" * 60)
print("PASO 1: Construyendo mapa de ocupación desde oferta 20261")
print("=" * 60)

# occupancy_map: (aula, dia) -> [(bloque_inicio, bloque_fin)]
occupancy_map = defaultdict(list)

for sec in oferta_nueva:
    for dia in range(1, 8):
        horario = sec.get(f'Horario{dia}', '')
        parsed = parse_horario(horario)
        for inicio, fin, aula in parsed:
            if aula:
                occupancy_map[(aula, dia)].append((inicio, fin))

total_slots = sum(len(v) for v in occupancy_map.values())
print(f"  Slots ocupados registrados: {total_slots}")
print(f"  Aulas con ocupación: {len(set(k[0] for k in occupancy_map.keys()))}")


# ========== STEP 2: BUILD AULA LOOKUP ==========
print("\n" + "=" * 60)
print("PASO 2: Construyendo inventario de aulas disponibles")
print("=" * 60)

# Filter out EXTERNO, ESPECIAL, and special named aulas
aulas_disponibles = {}
for a in aulas:
    cod = a['CodAula']
    tipo = a.get('Tipo', '')
    if tipo == 'EXTERNO':
        continue
    if tipo == 'ESPECIAL':
        continue
    if cod in AULAS_ESPECIALES:
        continue
    aulas_disponibles[cod] = {
        'capacidad': a['Capacidad'],
        'tipo': tipo,
        'edificio': a.get('CodEdificio', ''),
        'nombre': a.get('NombreAula', '')
    }

print(f"  Aulas disponibles (excl. EXTERNO/ESPECIAL): {len(aulas_disponibles)}")
# Count by type
by_type = defaultdict(int)
for a in aulas_disponibles.values():
    by_type[a['tipo']] += 1
for t, c in sorted(by_type.items()):
    print(f"    {t}: {c}")


# ========== STEP 3: CLASSIFY SECTIONS ==========
print("\n" + "=" * 60)
print("PASO 3: Clasificando secciones sin aula")
print("=" * 60)

# Reference lookup
ref_lookup = {}
for s in oferta_ref:
    key = (s['CodAsignatura'], s['Secc'])
    ref_lookup[key] = s.get('Inscritos', 0)

# Filter out materias fuera de aula and clinicas/pasantias by name
def is_excluded(sec):
    if sec['CodAsignatura'] in MATERIAS_FUERA:
        return True
    nombre = sec.get('NombreAsignatura', '').lower()
    if 'clínica' in nombre or 'clinica' in nombre or 'pasantía' in nombre or 'pasantia' in nombre:
        return True
    return False

secciones_excluidas = []
secciones_a_procesar = []

for s in sin_aula:
    if is_excluded(s):
        secciones_excluidas.append(s)
    else:
        secciones_a_procesar.append(s)

# Classify
nuevas = []
existentes = []
sin_demanda = []

for s in secciones_a_procesar:
    key = (s['CodAsignatura'], s['Seccion'])
    if key not in ref_lookup:
        s['_tipo'] = 'NUEVA'
        s['_capacidad_estimada'] = s['Cupo'] if s['Cupo'] > 0 else 25  # default
        nuevas.append(s)
    elif ref_lookup[key] > 0:
        s['_tipo'] = 'EXISTENTE'
        s['_capacidad_estimada'] = ref_lookup[key]
        existentes.append(s)
    else:
        s['_tipo'] = 'SIN_DEMANDA'
        sin_demanda.append(s)

print(f"  Total secciones sin aula: {len(sin_aula)}")
print(f"  Excluidas (clínicas/pasantías): {len(secciones_excluidas)}")
print(f"  EXISTENTE (prioridad alta): {len(existentes)}")
print(f"  NUEVA (prioridad alta): {len(nuevas)}")
print(f"  SIN DEMANDA (ignorar): {len(sin_demanda)}")
print(f"  => Total a asignar: {len(existentes) + len(nuevas)}")


# ========== STEP 4: DETERMINE ROOM TYPE PER SUBJECT ==========
print("\n" + "=" * 60)
print("PASO 4: Determinando tipo de aula por asignatura")
print("=" * 60)

# Build subject -> room type mapping from both periods
subject_room_types = defaultdict(set)

for sec in oferta_nueva + oferta_ref:
    cod_asig = sec['CodAsignatura']
    for dia in range(1, 8):
        horario = sec.get(f'Horario{dia}', '')
        parsed = parse_horario(horario)
        for inicio, fin, aula in parsed:
            if aula and aula in aulas_disponibles:
                subject_room_types[cod_asig].add(aulas_disponibles[aula]['tipo'])

# Also check equivalences
equiv_map = {}
equiv_list = equivalencias.get('equivalencias', equivalencias) if isinstance(equivalencias, dict) else equivalencias
for eq in equiv_list:
    m1 = eq.get('materia1', eq.get('CodAsignatura1', ''))
    m2 = eq.get('materia2', eq.get('CodAsignatura2', ''))
    if m1 and m2:
        equiv_map[m1] = m2
        equiv_map[m2] = m1

def get_room_type(cod_asig):
    """Get the required room type for a subject."""
    # Direct lookup
    if cod_asig in subject_room_types:
        types = subject_room_types[cod_asig]
        # If there's only one type, use it
        if len(types) == 1:
            return list(types)[0]
        # If multiple types, prefer non-SALON (labs are more specific)
        non_salon = [t for t in types if t != 'SALON']
        if non_salon:
            return non_salon[0]
        return 'SALON'

    # Check equivalent subject
    if cod_asig in equiv_map:
        equiv = equiv_map[cod_asig]
        if equiv in subject_room_types:
            types = subject_room_types[equiv]
            if len(types) == 1:
                return list(types)[0]
            non_salon = [t for t in types if t != 'SALON']
            if non_salon:
                return non_salon[0]
            return 'SALON'

    # Default
    return 'SALON'

# Show type determination for sections to assign
tipo_counts = defaultdict(int)
to_assign = existentes + nuevas
for s in to_assign:
    rt = get_room_type(s['CodAsignatura'])
    s['_room_type'] = rt
    tipo_counts[rt] += 1

for t, c in sorted(tipo_counts.items()):
    print(f"  {t}: {c} secciones")


# ========== STEP 5: SORT AND ASSIGN ==========
print("\n" + "=" * 60)
print("PASO 5: Asignando aulas secuencialmente")
print("=" * 60)

# Sort: EXISTENTE first, then NUEVA; within each, by capacity desc
existentes_sorted = sorted(existentes, key=lambda x: x['_capacidad_estimada'], reverse=True)
nuevas_sorted = sorted(nuevas, key=lambda x: x['_capacidad_estimada'], reverse=True)
ordered_sections = existentes_sorted + nuevas_sorted

# Build list of aulas by type, sorted by capacity ascending (for best-fit)
aulas_by_type = defaultdict(list)
for cod, info in aulas_disponibles.items():
    aulas_by_type[info['tipo']].append((cod, info['capacidad'], info.get('edificio', '')))

for tipo in aulas_by_type:
    aulas_by_type[tipo].sort(key=lambda x: x[1])  # sort by capacity asc

def is_available(aula, dia, bloque_inicio, bloque_fin):
    """Check if an aula is available at the given time in the occupancy map."""
    existing = occupancy_map.get((aula, dia), [])
    for ex_inicio, ex_fin in existing:
        if bloques_overlap(bloque_inicio, bloque_fin, ex_inicio, ex_fin):
            return False
    return True

def find_best_aula(room_type, capacidad_min, dia, bloque_inicio, bloque_fin, preferred_edificio=None):
    """Find the best available aula matching criteria."""
    candidates = aulas_by_type.get(room_type, [])

    best = None
    best_preferred = None  # same building

    for cod, cap, edificio in candidates:
        if cap < capacidad_min:
            continue
        if not is_available(cod, dia, bloque_inicio, bloque_fin):
            continue

        if best is None:
            best = (cod, cap, edificio)

        if preferred_edificio and edificio == preferred_edificio and best_preferred is None:
            best_preferred = (cod, cap, edificio)

    # Prefer same building if available
    if best_preferred:
        return best_preferred
    return best

# Track assignments
assignments = []  # list of (section_info, dia, bloque_inicio, bloque_fin, aula, capacidad)
failed = []

assigned_count = 0
failed_count = 0

for sec in ordered_sections:
    sec_id = f"{sec['CodAsignatura']}-{sec['Seccion']}"
    room_type = sec['_room_type']
    cap_needed = sec['_capacidad_estimada']

    # Find what building this section already uses (for preference)
    preferred_edificio = None

    all_days_ok = True
    day_assignments = []

    for bloque_info in sec['BloquesSinAula']:
        dia_num = bloque_info['DiaNumero']
        bloques_str = bloque_info['Bloques']

        # Parse bloques - may contain multiple ranges like "8-11, 12-13"
        bloque_ranges = []
        for part in bloques_str.split(','):
            part = part.strip()
            if '-' in part:
                dash_parts = part.split('-')
                bloque_ranges.append((int(dash_parts[0]), int(dash_parts[1])))
            else:
                bloque_ranges.append((int(part), int(part)))

        # Use overall range for assignment (need same aula for all ranges in this day)
        bi = min(r[0] for r in bloque_ranges)
        bf = max(r[1] for r in bloque_ranges)

        result = find_best_aula(room_type, cap_needed, dia_num, bi, bf, preferred_edificio)

        if result is None:
            # Try SALON as fallback if type was specific
            if room_type != 'SALON':
                result = find_best_aula('SALON', cap_needed, dia_num, bi, bf, preferred_edificio)

            # Try SALON_POSTGRADO as another fallback
            if result is None and room_type == 'SALON':
                result = find_best_aula('SALON_POSTGRADO', cap_needed, dia_num, bi, bf, preferred_edificio)

        if result:
            aula_cod, aula_cap, aula_edif = result
            day_assignments.append((bloque_info, dia_num, bi, bf, aula_cod, aula_cap))
            if preferred_edificio is None and aula_edif:
                preferred_edificio = aula_edif
        else:
            all_days_ok = False
            failed.append({
                'seccion': sec_id,
                'tipo': sec['_tipo'],
                'room_type': room_type,
                'capacidad': cap_needed,
                'dia': bloque_info['Dia'],
                'bloques': bloques_str,
                'razon': f'No hay {room_type} con cap>={cap_needed} disponible'
            })

    # Register all day assignments in the occupancy map
    for bloque_info, dia_num, bi, bf, aula_cod, aula_cap in day_assignments:
        occupancy_map[(aula_cod, dia_num)].append((bi, bf))
        assignments.append({
            'CodAsignatura': sec['CodAsignatura'],
            'NombreAsignatura': sec['NombreAsignatura'],
            'Seccion': sec['Seccion'],
            'Tipo': sec['_tipo'],
            'CapacidadEstimada': sec['_capacidad_estimada'],
            'RoomType': sec['_room_type'],
            'Dia': bloque_info['Dia'],
            'DiaNumero': dia_num,
            'BloqueInicio': bi,
            'BloqueFin': bf,
            'HorarioOriginal': bloque_info['HorarioOriginal'],
            'AulaAsignada': aula_cod,
            'CapacidadAula': aula_cap
        })
        assigned_count += 1

print(f"  Asignaciones exitosas: {assigned_count}")
print(f"  Fallos: {len(failed)}")

if failed:
    print(f"\n  --- FALLOS ---")
    for f in failed:
        print(f"  {f['seccion']} | {f['tipo']} | {f['dia']} bl {f['bloques']} | necesita {f['room_type']} cap>={f['capacidad']} | {f['razon']}")


# ========== STEP 6: VERIFY NO COLLISIONS ==========
print("\n" + "=" * 60)
print("PASO 6: Verificando colisiones")
print("=" * 60)

# Check for collisions among assignments themselves
collision_count = 0
for i in range(len(assignments)):
    for j in range(i+1, len(assignments)):
        a = assignments[i]
        b = assignments[j]
        if a['AulaAsignada'] == b['AulaAsignada'] and a['DiaNumero'] == b['DiaNumero']:
            if bloques_overlap(a['BloqueInicio'], a['BloqueFin'], b['BloqueInicio'], b['BloqueFin']):
                print(f"  COLISION: {a['CodAsignatura']}-{a['Seccion']} vs {b['CodAsignatura']}-{b['Seccion']}")
                print(f"    Aula: {a['AulaAsignada']} Dia: {a['Dia']} Bloques: {a['BloqueInicio']}-{a['BloqueFin']} vs {b['BloqueInicio']}-{b['BloqueFin']}")
                collision_count += 1

if collision_count == 0:
    print("  ✓ No hay colisiones entre las asignaciones propuestas")
else:
    print(f"  ✗ {collision_count} colisiones detectadas!")


# ========== STEP 7: GENERATE OUTPUT ==========
print("\n" + "=" * 60)
print("PASO 7: Generando archivo de salida")
print("=" * 60)

# Write CSV
csv_path = '/Users/javierhiga/CursorProjects/SISTEMA_AULAS_UAM/asignaciones_propuestas_20261.csv'
with open(csv_path, 'w', newline='', encoding='utf-8') as f:
    writer = csv.writer(f)
    writer.writerow(['CodAsignatura', 'NombreAsignatura', 'Seccion', 'Clasificacion', 'CapacidadEstimada',
                      'TipoAulaRequerido', 'Dia', 'DiaNumero', 'BloqueInicio', 'BloqueFin',
                      'HorarioOriginal', 'AulaAsignada', 'CapacidadAula'])
    for a in sorted(assignments, key=lambda x: (x['Tipo'], x['CodAsignatura'], x['Seccion'], x['DiaNumero'])):
        writer.writerow([a['CodAsignatura'], a['NombreAsignatura'], a['Seccion'], a['Tipo'],
                         a['CapacidadEstimada'], a['RoomType'], a['Dia'], a['DiaNumero'],
                         a['BloqueInicio'], a['BloqueFin'], a['HorarioOriginal'],
                         a['AulaAsignada'], a['CapacidadAula']])

print(f"  CSV: {csv_path}")

# Write summary
print("\n" + "=" * 60)
print("RESUMEN")
print("=" * 60)
print(f"  Secciones sin aula (total bruto): {len(sin_aula)}")
print(f"  Excluidas (clínicas/pasantías): {len(secciones_excluidas)}")
print(f"  SIN DEMANDA (ignoradas): {len(sin_demanda)}")
print(f"  A asignar (EXISTENTE + NUEVA): {len(existentes) + len(nuevas)}")
print(f"  Asignaciones realizadas: {assigned_count}")
print(f"  Fallos: {len(failed)}")
print(f"  Colisiones: {collision_count}")

# Write failed to a file too
if failed:
    fail_path = '/Users/javierhiga/CursorProjects/SISTEMA_AULAS_UAM/asignaciones_fallidas_20261.json'
    with open(fail_path, 'w', encoding='utf-8') as f:
        json.dump(failed, f, indent=2, ensure_ascii=False)
    print(f"\n  Detalles de fallos: {fail_path}")

# Write sin_demanda for reference
sd_path = '/Users/javierhiga/CursorProjects/SISTEMA_AULAS_UAM/secciones_sin_demanda_20261.json'
with open(sd_path, 'w', encoding='utf-8') as f:
    sd_output = []
    for s in sin_demanda:
        sd_output.append({
            'CodAsignatura': s['CodAsignatura'],
            'NombreAsignatura': s['NombreAsignatura'],
            'Seccion': s['Seccion'],
            'Cupo': s['Cupo']
        })
    json.dump(sd_output, f, indent=2, ensure_ascii=False)
print(f"  Secciones sin demanda: {sd_path}")

# Save assignments as JSON for further processing
assign_json_path = '/Users/javierhiga/CursorProjects/SISTEMA_AULAS_UAM/asignaciones_propuestas_20261.json'
with open(assign_json_path, 'w', encoding='utf-8') as f:
    json.dump(assignments, f, indent=2, ensure_ascii=False)
print(f"  Asignaciones JSON: {assign_json_path}")
