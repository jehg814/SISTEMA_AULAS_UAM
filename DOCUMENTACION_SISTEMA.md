# Sistema de Asignacion de Aulas UAM - Guia Completa

## Descripcion General

El Sistema de Asignacion de Aulas de la Universidad Arturo Michelena (UAM) es una aplicacion web para visualizar, gestionar y planificar la asignacion de aulas en cada periodo academico. Funciona con una base de datos MariaDB y un servidor Node.js con Express.

**Contexto importante:** Cuando se crea un nuevo periodo academico, la oferta se genera como una **copia exacta del periodo anterior** a nivel de base de datos. Esto significa que las secciones, horarios y aulas ya vienen copiadas. Los directores de cada escuela luego editan la oferta del periodo nuevo: modifican horarios, eliminan secciones y crean nuevas. El trabajo de asignacion de aulas consiste en **resolver los conflictos** que surgen de esos cambios y **asignar aulas a las secciones nuevas o modificadas**.

### Modos de Trabajo

La aplicacion tiene dos modos de trabajo explícitos, seleccionables mediante radio buttons en la interfaz:

- **Ajuste Operativo** (por defecto): Para trabajar con datos reales de inscripcion. Se usa cuando los estudiantes ya estan inscritos en el periodo actual. Filtra secciones por inscritos > 0 y usa la cantidad real de inscritos para estimar capacidad. No requiere periodo de referencia.
- **Planificacion**: Para preparar la asignacion de aulas antes de que los estudiantes se inscriban. Requiere un periodo de referencia obligatorio. Usa los inscritos del periodo de referencia como proyeccion. Clasifica secciones como NUEVA, EXISTENTE o SIN DEMANDA. Habilita las pestanas de Planificacion y Comparar Periodos.

**Diferencias clave entre los modos:**

| Aspecto | Ajuste Operativo | Planificacion |
|---------|-----------------|---------------|
| Periodo de referencia | No requerido | Obligatorio |
| Fuente de capacidad | Inscritos reales | Proyeccion del periodo anterior |
| Filtro de secciones sin aula | Inscritos > 0 | Cupo > 0 |
| Clasificacion de secciones | No aplica | NUEVA / EXISTENTE / SIN DEMANDA |
| Pestanas adicionales | No | Planificacion + Comparar Periodos |
| Caso de uso | Resolver secciones puntuales sin aula, reasignaciones por desbalance | Asignacion masiva pre-inscripcion |

---

## Conceptos Basicos

### Periodos Academicos
Cada periodo tiene un codigo de 5 digitos (ej: `20261` = Primer Periodo 2026, `20253` = Tercer Periodo 2025). La oferta academica se organiza por periodo.

### Estructura de Horarios en la Base de Datos
Los horarios se almacenan en 7 campos (`Horario1` a `Horario7`), uno por cada dia de la semana (1=Lunes, 2=Martes, ..., 7=Domingo). El formato es:

```
bloqueInicio-bloqueFin:CodigoAula
```

Ejemplo: `5-8:A2-6` significa bloques 5 a 8 en el aula A2-6.

Si una seccion no tiene aula asignada, el horario solo tiene los bloques sin el codigo de aula: `5-8`

Si hay multiples bloques en un mismo dia, se separan con coma: `1-2:V1-1,3-4:V1-2`.

### Tabla de Bloques Horarios

| Bloques | Horario |
|---------|---------|
| 1-2 | 07:00 AM - 08:30 AM |
| 3-4 | 08:45 AM - 10:05 AM |
| 5-6 | 10:15 AM - 11:45 AM |
| 7-8 | 11:50 AM - 01:30 PM |
| 9-10 | 01:30 PM - 03:05 PM |
| 11-12 | 03:05 PM - 04:40 PM |
| 13-14 | 04:40 PM - 06:15 PM |
| 15-16 | 06:15 PM - 07:50 PM |
| 17-18 | 07:50 PM - 09:25 PM |

En la interfaz, los bloques se muestran convertidos a horas reales (ej: `5-8` se muestra como `10:15-1:30`).

### Sedes
La universidad tiene dos sedes:
- **1: San Diego** - Campus principal
- **2: Centro Historico de Valencia**

### Tipos de Aula
Las aulas se clasifican por tipo: SALON, LABORATORIO, COMPUTACION, SALA_DIBUJO, SALON_CAMILLAS, SALON_POSTGRADO, ESPECIAL, EXTERNO. Las aulas tipo EXTERNO se excluyen de las busquedas y asignaciones.

### Materias Equivalentes
Algunas materias comparten codigo (ej: EAC101 y ECP101 son equivalentes). Cuando dos secciones de materias equivalentes estan en la misma aula al mismo tiempo, **no se considera conflicto** porque en la practica son la misma clase compartida entre programas.

### Inscritos vs Cupo segun el Modo

- **Inscritos (Uso):** Cantidad de estudiantes realmente inscritos en una seccion.
  - En **Ajuste Operativo**: es el dato principal para estimar capacidad. Si es 0, la seccion se ignora.
  - En **Planificacion**: es 0 porque nadie se ha inscrito aun; se usa la proyeccion del periodo de referencia.
- **Cupo:** Capacidad maxima de estudiantes que se espera. Si el cupo es > 0, la seccion esta activa y espera estudiantes.
- **Inscritos de referencia** (solo en Planificacion): El sistema toma los inscritos del periodo anterior como proyeccion para el periodo nuevo. Esto permite detectar conflictos y estimar capacidad necesaria.

---

## Modulos del Sistema

El sistema tiene 9 modulos accesibles desde las pestanas superiores:

---

### 1. Visualizacion de Horarios

**Proposito:** Ver el horario semanal completo de un aula especifica.

**Como usarlo:**
1. Seleccionar la sede
2. Opcionalmente filtrar por tipo de aula
3. Seleccionar el aula del desplegable
4. Hacer clic en "Ver Horario"

**Que muestra:** Una grilla semanal (Lunes a Viernes) con todos los bloques horarios (1-19). Cada celda muestra la materia y seccion asignada en ese bloque. Al hacer clic en una celda se ve informacion detallada de la seccion.

**Utilidad:** Permite verificar visualmente como queda el horario de un aula, confirmar que no hay solapamientos y ver los espacios vacios disponibles.

---

### 2. Buscador de Aulas

**Proposito:** Encontrar aulas disponibles que cumplan ciertos requisitos.

**Como usarlo:**
1. Seleccionar la sede
2. Elegir el dia de la semana
3. Indicar bloque inicial y bloque final
4. Opcionalmente indicar capacidad minima y tipo de aula
5. Hacer clic en buscar

**Que muestra:** Lista de aulas disponibles en ese horario con su codigo, capacidad, edificio y sede. Cada resultado tiene un enlace para ver el horario completo del aula.

**Utilidad:** Cuando una seccion necesita un aula nueva (por conflicto o porque es nueva), este buscador permite encontrar opciones disponibles que cumplan los requisitos de capacidad y horario.

---

### 3. Conflictos y Colisiones

**Proposito:** Detectar automaticamente problemas en la asignacion de aulas.

**Tipos de conflictos detectados:**

- **Conflictos de horario:** Dos secciones asignadas a la misma aula en el mismo dia y bloques solapados.
- **Conflictos de capacidad:** Una seccion tiene mas estudiantes (o inscritos proyectados) que la capacidad del aula asignada.

**Consideraciones especiales:**
- Se excluyen conflictos entre materias equivalentes (son la misma clase).
- En modo Planificacion, se usan los inscritos del periodo de referencia como proyeccion.
- Los conflictos donde una de las secciones tenia 0 inscritos en la referencia se marcan como **"probablemente no reales"**, ya que esas secciones podrian no abrirse en la practica.

**Por que surgen conflictos en un periodo nuevo:** Como la oferta nueva es una copia del periodo anterior, si un director cambio el horario de una seccion (ej: la paso de lunes a miercoles), el aula que tenia asignada del periodo anterior puede ahora chocar con otra seccion que ya estaba los miercoles en esa aula.

---

### 4. Secciones Sin Aula

**Proposito:** Identificar secciones que tienen horario pero no tienen aula asignada (total o parcialmente).

**Comportamiento segun el modo:**

- **Ajuste Operativo:** Muestra secciones con inscritos > 0 que no tienen aula. Usa los inscritos reales para estimar la capacidad necesaria. No clasifica en NUEVA/EXISTENTE/SIN DEMANDA.
- **Planificacion:** Muestra secciones con cupo > 0 que no tienen aula. Cruza con el periodo de referencia para clasificar:

| Estado | Significado | Prioridad |
|--------|-------------|-----------|
| **NUEVA** | No existia en el periodo de referencia. Es una seccion completamente nueva. | Alta - necesita aula obligatoriamente |
| **EXISTENTE** | Existia en la referencia y tenia inscritos. Necesita aula. | Alta - necesita aula obligatoriamente |
| **SIN DEMANDA** (falso positivo) | Existia en la referencia pero tenia 0 inscritos. Probablemente no se oferta realmente. | Baja - se muestra colapsado aparte |

**Que muestra para cada seccion:**
- Codigo y nombre de la asignatura
- Seccion, inscritos (reales o de referencia segun el modo), cupo
- Profesor asignado
- Los dias y bloques especificos que no tienen aula

---

### 5. Estadisticas de Uso

**Proposito:** Analizar el nivel de ocupacion de las aulas por dia y bloque horario.

**Como usarlo:**
1. Seleccionar sede y opcionalmente tipo de aula
2. Hacer clic en "Generar Estadisticas"

**Que muestra:** Una grilla de Lunes a Viernes mostrando por cada bloque horario:
- Cantidad de aulas disponibles
- Capacidad total disponible
- Porcentaje de ocupacion

Tambien muestra un resumen con el total de aulas, capacidad total, secciones activas.

---

### 6. Busqueda con IA

**Proposito:** Buscar aulas disponibles y obtener recomendaciones inteligentes usando inteligencia artificial (Claude).

**Como usarlo:**
1. Indicar sede, tipo de aula, capacidad minima
2. Escribir los dias y bloques necesarios (ej: "Lunes:1-4, Jueves:5-8")
3. Hacer clic en "Buscar con IA"
4. Revisar las recomendaciones del asistente
5. Continuar la conversacion para refinar la busqueda

**Que ofrece el asistente:**
- Lista aulas **realmente disponibles** (cruza contra la ocupacion actual) que cumplen los requisitos
- Si no hay aulas directamente disponibles, sugiere **reasignaciones especificas**: mover una seccion con pocos estudiantes de un aula grande a una mas pequena para liberar espacio
- Siempre indica codigos de aula concretos, capacidades y razonamiento
- Solo menciona aulas que existen en la base de datos (nunca inventa codigos)

**Contexto que recibe la IA:** El asistente recibe el inventario completo de aulas con su ocupacion detallada (que seccion ocupa cada aula, en que dia y bloques, con cuantos inscritos). Esto le permite razonar sobre disponibilidad real y proponer intercambios.

---

### 7. Gestion de Cambios

**Proposito:** Ver y administrar los cambios pendientes de asignacion de aulas.

**Que muestra:**
- Lista de todos los cambios realizados manualmente
- Para cada cambio: materia, seccion, dia, bloques, aula anterior, aula nueva
- Boton para eliminar cambios individuales

**Acciones disponibles:**
- **Guardar cambios localmente:** Almacena los cambios en el navegador para no perderlos si se cierra la pagina
- **Exportar para BD:** Genera los datos para aplicar en la base de datos

---

### 8. Planificacion (Solo en Modo Planificacion)

**Proposito:** Panel central para gestionar todo el proceso de planificacion de un nuevo periodo.

**Secciones que contiene:**

#### Detalle de Cambios
Tabla que muestra todas las reasignaciones realizadas, agrupadas por seccion:
- Codigo, asignatura, seccion
- **Antes de planificar:** Horario de la seccion tal como esta en la BD del periodo nuevo. Los dias que cambiaron aparecen resaltados en **rojo**, los que no cambiaron en gris.
- **Despues de planificar:** Como queda la seccion despues de las reasignaciones. Misma codificacion de colores.
- Boton **"Revertir"** para deshacer todos los cambios de esa seccion de una vez.

Los horarios se muestran con horas reales (ej: `Lu: 10:15-1:30:A2-4`) en vez de bloques.

#### Estadisticas
- Total de cambios en horarios
- Secciones afectadas
- Conflictos detectados (en rojo si hay, en verde si no)

#### Opciones de Exportacion
- **Exportar Checklist (TXT):** Genera un archivo de texto con casillas de verificacion para revisar cada cambio manualmente:
  ```
  [ ] 1. MAT101-01: Lunes -> cambiar de "1-2:V1-1" a "1-2:V1-5"
  [ ] 2. FIS201-02: Martes -> cambiar de "5-8:LAB1" a "5-8:LAB3"
  ```
- **Exportar JSON:** Descarga completa de toda la planificacion (datos originales, cambios, conflictos) para respaldo o compartir.
- **Exportar SQL:** Genera un archivo SQL listo para ejecutar en la base de datos:
  ```sql
  START TRANSACTION;
  UPDATE Oferta SET Horario1 = '1-2:V1-5'
  WHERE CodPeriodo = '20261'
    AND CodAsignatura = 'MAT101'
    AND Secc = '01'
    AND Horario1 = '1-2:V1-1';
  COMMIT;
  ```
  Cada UPDATE incluye verificacion del valor anterior (clausula AND) como medida de seguridad para no sobreescribir cambios hechos por otro usuario.

#### Guardar y Restaurar Sesion
- **Guardar Sesion:** Almacena el estado completo de la planificacion en el navegador. Si se cierra la pagina y se vuelve a abrir, el sistema pregunta si desea restaurar la sesion guardada.
- **Reiniciar Planificacion:** Descarta todos los cambios y vuelve al estado original cargado de la base de datos.

---

### 9. Comparar Periodos (Solo en Modo Planificacion)

**Proposito:** Comparar la oferta academica del periodo nuevo contra el periodo de referencia para identificar que cambio entre ambos.

**Presentacion:** Los resultados se agrupan en secciones colapsables por categoria, en este orden:

| Categoria | Color | Significado | Abierto por defecto |
|-----------|-------|-------------|---------------------|
| **Nuevas** | Verde | Secciones que existen en el periodo actual pero no en la referencia. Son materias/secciones completamente nuevas. | Si |
| **Modificadas** | Amarillo | Secciones que existen en ambos periodos con cupo > 0, pero cambiaron horario y/o cupo. | Si |
| **Eliminadas** | Rojo | Secciones que existian en la referencia pero ya no existen en el periodo actual. Fueron removidas de la oferta. | No |
| **Cerradas por cupo** | Violeta | Secciones que existen en ambos periodos pero tienen cupo 0 en el actual. La seccion fue cerrada. | No |
| **Sin cambios** | Azul | Secciones identicas en ambos periodos (mismo horario y cupo). No requieren atencion. | No |

**Que muestra cada tabla:**
- Codigo, nombre de la asignatura, seccion
- **Cupo:** Si cambio, muestra `cupo anterior -> cupo nuevo`
- **Columna Referencia:** Horario completo del periodo anterior (cada dia con horas y aula) + cantidad de inscritos que tuvo
- **Columna Actual:** Horario completo del periodo nuevo (cada dia con horas y aula)

**Tarjetas de resumen clickeables:** En la parte superior hay tarjetas con el conteo de cada categoria. Al hacer clic en una tarjeta, se filtra para mostrar solo esa categoria.

---

## Flujo de Trabajo: Modo Planificacion (Pre-inscripcion)

Guia paso a paso para preparar la asignacion de aulas de un periodo nuevo, antes de que los estudiantes se inscriban. Puede ser seguida por una persona o por un agente de IA.

### Contexto Previo

La oferta del periodo nuevo (ej: 20261) ya existe en la base de datos como copia del periodo de referencia (ej: 20253). Los directores de escuela ya editaron la oferta: modificaron horarios, cambiaron cupos, eliminaron secciones y crearon nuevas. Las aulas vienen copiadas del periodo anterior, por lo que:

- Las **secciones sin cambios** (~90%) ya tienen su aula correcta. No necesitan atencion.
- Las **secciones modificadas** (cambiaron dia/hora) conservan el aula del periodo anterior, que podria ahora chocar con otra seccion → generan **conflictos**.
- Las **secciones nuevas** no tienen aula asignada → aparecen en **secciones sin aula**.
- Las **secciones cerradas/eliminadas** liberan aulas que pueden reutilizarse.

### Paso 1: Seleccionar modo y cargar datos

1. En la barra superior, seleccionar el modo **"Planificacion"**. Esto muestra el selector de periodo de referencia.
2. Seleccionar el **Periodo Academico** nuevo (ej: 20261)
3. Seleccionar el **Periodo de Referencia** (el periodo anterior, ej: 20253). Es obligatorio en este modo.
4. Seleccionar la **Sede** (ej: San Diego)
5. Hacer clic en **"Cargar Datos"**

El sistema carga ambos periodos, cruza los inscritos del periodo de referencia como proyeccion para el nuevo, activa el modo planificacion y muestra las pestanas adicionales.

### Paso 2: Revisar la comparacion entre periodos

Ir a la pestana **"Comparar Periodos"** para entender el panorama general:

1. Ver las **secciones nuevas** (abiertas por defecto): cuantas son, en que horarios estan, que capacidad necesitan. Estas necesitaran aula.
2. Ver las **secciones modificadas** (abiertas por defecto): que cambio en cada una. Si cambiaron de dia o bloques, su aula actual podria generar conflicto.
3. Revisar las **cerradas** y **eliminadas**: estas liberan aulas que pueden ser opciones para las nuevas.
4. Las **sin cambios** se pueden ignorar (estan colapsadas por defecto).

### Paso 3: Resolver conflictos

Ir a la pestana **"Conflictos y Colisiones"** para ver los problemas detectados.

**Para cada conflicto de horario (dos secciones en la misma aula al mismo tiempo):**

1. Identificar cual de las dos secciones conviene mover. Criterios:
   - Mover la seccion con **menos inscritos** (mas facil encontrar aula pequena)
   - Mover la seccion que **cambio de horario** (la otra ya estaba ahi correctamente)
   - Preferir mover a un aula del **mismo edificio** si es posible
2. Usar el **Buscador de Aulas** (pestana 2) para encontrar un aula disponible:
   - Indicar el dia, bloques, sede y capacidad minima de la seccion a mover
   - El buscador lista las aulas libres en ese horario
3. Si no hay opciones directas, usar la **Busqueda con IA** (pestana 6) para obtener sugerencias de reasignacion (ej: mover una seccion pequena de un aula grande a una pequena para liberar la grande)
4. En la pestana de conflictos, hacer clic en **"Reasignar"** en la seccion a mover
5. En el modal de reasignacion:
   - Ver la informacion de la seccion (inscritos, cupo, profesor)
   - Para cada dia con horario, seleccionar la nueva aula del desplegable
   - Las opciones en **verde** tienen capacidad suficiente, las de **rojo** no
6. Hacer clic en **"Aplicar Cambios"**

El sistema re-detecta conflictos automaticamente despues de cada cambio. Repetir hasta que el modulo de conflictos muestre 0.

**Conflictos "probablemente no reales":** Son conflictos donde una de las secciones tenia 0 inscritos en la referencia. Probablemente esa seccion no se abrira, pero conviene revisarlos por si acaso.

### Paso 4: Asignar aulas a secciones sin aula

Ir a la pestana **"Secciones Sin Aula"** y hacer clic en **"Buscar Secciones Sin Aula"**.

El sistema muestra las secciones clasificadas:

1. **Tabla principal** — secciones que realmente necesitan aula:
   - **NUEVA:** Secciones que no existian en el periodo anterior. Prioridad alta.
   - **EXISTENTE:** Secciones que existian y tenian inscritos, pero perdieron su aula (ej: por cambio de horario). Prioridad alta.

2. **Falsos positivos** (colapsados abajo) — secciones marcadas **SIN DEMANDA**:
   - Existian en la referencia pero tenian 0 inscritos. Probablemente no se ofertan realmente aunque tengan cupo. Se pueden ignorar a menos que se sepa que si se van a abrir.

**Para cada seccion que necesita aula:**

1. Anotar el dia, bloques y capacidad necesaria:
   - **Secciones EXISTENTE:** usar los inscritos del periodo de referencia como estimacion
   - **Secciones NUEVA:** usar el cupo de la seccion (no hay historial de inscritos)
2. Determinar el **tipo de aula** necesario consultando otras secciones de la misma asignatura (ver criterios en la Guia para Agentes de IA)
3. Ir al **Buscador de Aulas** e ingresar esos parametros
4. Seleccionar un aula adecuada de los resultados
5. Volver a la seccion y usar **"Reasignar"** para asignar el aula

**Tip:** Si el Buscador no encuentra opciones, usar la **Busqueda con IA** que puede sugerir intercambios inteligentes.

**Nota:** Las secciones de tipo clinica y pasantia se excluyen de la asignacion — usan instalaciones externas.

### Paso 5: Verificar el resultado

Antes de exportar, verificar que todo esta correcto:

1. **Conflictos y Colisiones** → debe mostrar **0 conflictos** (o solo "probablemente no reales")
2. **Secciones Sin Aula** → debe estar vacia (o solo falsos positivos)
3. **Planificacion** → revisar el **detalle de cambios**:
   - Cada fila muestra la seccion con su horario "antes" y "despues"
   - Los dias modificados aparecen en rojo, los no modificados en gris
   - Verificar que los cambios tienen sentido
4. Opcionalmente usar **Visualizacion de Horarios** para verificar aulas especificas

### Paso 6: Exportar los cambios

Desde la pestana **"Planificacion"**:

- **Exportar SQL:** Genera un archivo `.sql` con todos los UPDATE necesarios dentro de una transaccion. Cada sentencia verifica el valor anterior para seguridad. Este archivo se ejecuta en la base de datos para aplicar los cambios.
- **Exportar Checklist:** Genera un archivo `.txt` con casillas `[ ]` para verificar manualmente cada cambio antes o despues de aplicar.
- **Exportar JSON:** Respaldo completo de toda la planificacion por si se necesita auditar o restaurar.

### Paso 7: Guardar sesion (opcional)

Si la planificacion no se completa en una sola sesion:
- Hacer clic en **"Guardar Sesion"** para almacenar todo el progreso en el navegador
- Al volver a abrir el sistema, preguntara si desea restaurar la sesion guardada
- **"Reiniciar Planificacion"** descarta todos los cambios y vuelve al estado original de la BD

---

## Flujo de Trabajo: Modo Ajuste Operativo (Post-inscripcion)

Guia para resolver asignaciones de aulas cuando los estudiantes ya estan inscritos en el periodo actual.

### Cuando usarlo

- El periodo ya tiene estudiantes inscritos (Inscritos > 0 en las secciones activas)
- Se necesita asignar aula a secciones que no la tienen
- Se necesita reasignar aulas por desbalance (ej: 10 estudiantes en un aula de 70)
- Se necesita resolver conflictos puntuales

### Paso 1: Cargar datos

1. Verificar que el modo **"Ajuste Operativo"** esta seleccionado (es el modo por defecto)
2. Seleccionar el **Periodo Academico** (el periodo con inscritos)
3. Seleccionar la **Sede**
4. Hacer clic en **"Cargar Datos"**

No se requiere periodo de referencia. El sistema trabaja con los datos reales del periodo.

### Paso 2: Identificar secciones sin aula

Ir a la pestana **"Secciones Sin Aula"** y hacer clic en **"Buscar Secciones Sin Aula"**.

El sistema muestra las secciones que tienen inscritos > 0 pero no tienen aula asignada. No se aplica clasificacion NUEVA/EXISTENTE/SIN DEMANDA — simplemente se listan todas las secciones que tienen estudiantes y necesitan aula.

### Paso 3: Asignar o reasignar aulas

Para cada seccion sin aula:

1. Usar el **Buscador de Aulas** para encontrar opciones disponibles con la capacidad necesaria (basada en inscritos reales)
2. Si no hay opciones directas, usar la **Busqueda con IA** para obtener sugerencias de reasignacion
3. Asignar el aula mediante el boton **"Reasignar"**

### Paso 4: Verificar

- **Conflictos y Colisiones** → debe mostrar 0 conflictos
- **Secciones Sin Aula** → debe estar vacia

---

## Guia para un Agente de IA

Si eres un agente de IA realizando la asignacion de aulas, primero debes determinar en que modo trabajar:

- **Si el periodo aun no tiene inscritos** (todos en 0): usar **modo Planificacion** con un periodo de referencia
- **Si el periodo ya tiene inscritos reales**: usar **modo Ajuste Operativo** sin referencia

### Opcion A: Via interfaz web (Playwright u otro automatizador)

**En modo Planificacion:**
1. Seleccionar modo "Planificacion"
2. Seleccionar periodo nuevo + periodo de referencia + sede → "Cargar Datos"
3. Ir a "Comparar Periodos" para ver cuantas secciones son nuevas, modificadas, etc.
4. Ir a "Conflictos y Colisiones" → para cada conflicto, decidir que seccion mover y buscar aula alternativa
5. Ir a "Secciones Sin Aula" → buscar y asignar aulas a las secciones NUEVA y EXISTENTE. Ignorar las SIN DEMANDA.
6. Verificar: Conflictos = 0, Secciones sin aula = 0 (o solo falsos positivos)
7. Desde "Planificacion" → Exportar SQL

**En modo Ajuste Operativo:**
1. Verificar que el modo "Ajuste Operativo" esta seleccionado
2. Seleccionar periodo + sede → "Cargar Datos"
3. Ir a "Secciones Sin Aula" → asignar aulas a secciones con inscritos reales
4. Verificar: Conflictos = 0, Secciones sin aula = 0

### Opcion B: Via API directa (recomendado para agentes de IA)

Es mas eficiente y confiable trabajar directamente con los endpoints del servidor.

**En modo Planificacion**, el flujo es:

1. **Cargar datos de ambos periodos:**
   - `GET /api/oferta/:periodoNuevo?sede=1` → oferta del periodo a planificar
   - `GET /api/oferta/:periodoReferencia?sede=1` → oferta del periodo anterior (para cruzar inscritos)
   - `GET /api/aulas?sede=1` → lista de aulas con capacidad y tipo
   - `GET /api/equivalencias` → pares de materias equivalentes
   - `GET /api/conflictos/:periodoNuevo?sede=1` → conflictos detectados
   - `GET /api/secciones-sin-aula/:periodoNuevo?sede=1&modo=planificacion` → secciones sin aula (filtra cupo > 0)

2. **Clasificar secciones sin aula** cruzando con la referencia:
   - Construir un lookup `(CodAsignatura, Secc) → Inscritos` del periodo de referencia
   - Para cada seccion sin aula:
     - Si no existe en la referencia → **NUEVA**
     - Si existe con inscritos > 0 → **EXISTENTE**
     - Si existe con inscritos = 0 → **SIN DEMANDA** (ignorar)

3. **Estimar capacidad necesaria** para buscar aulas:
   - **Secciones EXISTENTE:** usar los inscritos del periodo de referencia
   - **Secciones NUEVA:** usar el cupo de la seccion (es la unica referencia disponible)

**En modo Ajuste Operativo**, el flujo es:

1. **Cargar datos del periodo actual:**
   - `GET /api/oferta/:periodo?sede=1` → oferta del periodo
   - `GET /api/aulas?sede=1` → lista de aulas
   - `GET /api/secciones-sin-aula/:periodo?sede=1` → secciones sin aula (filtra inscritos > 0)

2. **No se clasifican** las secciones. Todas las que aparecen necesitan aula.

3. **Estimar capacidad:** usar los inscritos reales de cada seccion.

**Pasos comunes a ambos modos (asignacion de aulas):**

4. **Importante: una seccion puede tener clases en multiples dias.** El endpoint de secciones sin aula devuelve un array `BloquesSinAula` con una entrada por cada dia que necesita aula. Se debe buscar y asignar un aula para **cada dia** de la seccion, no solo el primero. Cada dia puede tener bloques horarios diferentes y puede requerir un aula diferente segun la disponibilidad.

5. **Determinar tipo de aula requerido** para cada seccion:
   - **Fuente principal:** Usar `POST /api/tipo-aula-historico/lote` con todas las asignaturas. Este endpoint consulta primero el archivo `TIPOS_AULA_ASIGNATURAS.txt` (mapeo estatico de asignaturas a tipos de aula y aulas especificas). Si la asignatura no esta en el archivo, hace fallback a la BD buscando en los **ultimos 3 periodos**, y solo recomienda un tipo especial si representa al menos el **20%** de las asignaciones historicas.
   - El endpoint devuelve `fuente: 'archivo'` o `fuente: 'bd'` para indicar de donde proviene la recomendacion, y `aulasRecomendadas` con las aulas especificas que la materia ha usado historicamente.
   - Para asignaturas **MIXTO** (algunos slots en SALON, otros en tipo especial), verificar que usan otras secciones de la misma asignatura para el mismo dia para determinar si el slot es teoria (SALON) o practica (tipo especial).
   - Para LABORATORIO y COMPUTACION, **priorizar las aulas listadas en `aulasRecomendadas`** ya que no todos los laboratorios son intercambiables (ej: LAB.ELE para electronica, CB1 para biologia).
   - Si ninguna fuente encuentra historial, usar SALON como default

6. **Asignar aulas de forma secuencial con control de ocupacion:**

   **CRITICO: No buscar aulas para todas las secciones en paralelo.** El endpoint `/api/aulas/disponibles` solo conoce las asignaciones existentes en la base de datos, no las que el agente esta proponiendo en la misma sesion. Si se buscan aulas para 40 secciones sin control, se terminara asignando la misma aula a multiples secciones en el mismo horario.

   El procedimiento correcto es:

   a. **Construir un mapa de ocupacion** a partir de la oferta existente del periodo:
      - Para cada seccion en la oferta, recorrer `Horario1` a `Horario7`
      - Parsear cada horario (formato `bloqueInicio-bloqueFin:CodigoAula`)
      - Registrar en el mapa: `(aula, dia) → lista de (bloqueInicio, bloqueFin)`
      - Manejar formatos irregulares: bloque unico (`4:V1-4`), separador `;` en vez de `,`, multiples bloques por dia (`1-2:A1-1,3-4:A1-2`)

   b. **Ordenar las secciones por dificultad** (las mas dificiles de colocar primero):
      - En Planificacion: primero EXISTENTE, luego NUEVA
      - En ambos modos: por capacidad necesaria descendente (las que necesitan aulas grandes son mas dificiles)

   c. **Para cada seccion, para cada dia que necesita aula:**
      - Obtener las aulas candidatas del tipo correcto con capacidad suficiente
      - Filtrar las que estan **disponibles en el mapa de ocupacion** (no solo en la BD)
      - Seleccionar la de capacidad mas ajustada (la mas pequena que sea suficiente)
      - **Registrar la asignacion en el mapa de ocupacion** antes de pasar a la siguiente seccion

   d. **Verificar colisiones al final:** Recorrer todas las asignaciones propuestas y confirmar que:
      - Ninguna aula se asigno a dos secciones diferentes en el mismo dia con bloques solapados
      - Ninguna asignacion propuesta colisiona con una asignacion existente en la oferta

   Opcionalmente se puede usar `POST /api/aulas/disponibles` como consulta inicial, pero el mapa de ocupacion local es el que tiene la verdad actualizada.

7. **Generar el resultado:** puede ser un CSV, SQL, o checklist con las asignaciones propuestas. Para secciones multi-dia, incluir una fila por cada dia con su aula asignada.

### Inventario de Aulas por Tipo (Sede San Diego)

| Tipo | Cantidad | Rango de capacidad |
|------|----------|--------------------|
| SALON | 108 | 25-70 |
| LABORATORIO | 16 | 15-50 |
| SALON_POSTGRADO | 12 | 20-45 |
| SALA_DIBUJO | 9 | 20-35 |
| SALON_CAMILLAS | 9 | 12-16 |
| ESPECIAL | 7 | variable |
| COMPUTACION | 6 | 30-42 |

**Nota sobre SALON_CAMILLAS:** Todos los salones de camillas tienen capacidad maxima de 16. Las secciones de fisioterapia que requieren camillas y tienen mas de 16 estudiantes son un caso problematico recurrente que requiere decision humana (dividir la seccion, rotar grupos, o usar un aula de otro tipo). **Nunca asignar un SALON regular a una seccion que requiere SALON_CAMILLAS** — es preferible asignar un SALON_CAMILLAS con capacidad insuficiente y marcar el caso como problematico.

### Criterios para elegir un aula

**Obligatorios:**
- Debe estar **disponible** en el dia y bloques requeridos (sin otra seccion asignada)
- La **capacidad** del aula debe ser >= inscritos (reales o proyectados) de la seccion

**Preferencias (en orden de prioridad):**
1. **Tipo de aula correcto.** El tipo depende de la asignatura: consultar otras secciones de la misma asignatura en el periodo actual o en el de referencia. Por ejemplo, si QUI201-01 esta en un laboratorio, QUI201-02 tambien necesita laboratorio. **Nunca hacer fallback a otro tipo de aula** — si no hay aulas del tipo correcto con capacidad suficiente, asignar una del tipo correcto con capacidad insuficiente y marcar como caso problematico.
2. **Capacidad ajustada.** Preferir el aula cuya capacidad sea la mas cercana (por encima) a los inscritos estimados. No poner 20 estudiantes en un aula de 70 si hay una de 25 disponible.
3. **Mismo edificio.** Si la seccion ya tiene clases otros dias en el edificio A, preferir un aula del edificio A.
4. **Evitar aulas especiales.** No usar SALON AZUL, ESTUDTV, CANCHA, CAMARA H ni aulas tipo ESPECIAL para clases regulares a menos que no haya alternativa.

**En caso de conflicto (dos secciones en la misma aula):**
- Mover la seccion con **menos inscritos** (mas facil encontrar aula pequena)
- Mover la seccion que **cambio de horario** respecto al periodo anterior (la otra ya estaba ahi correctamente)

### Criterios para identificar falsos positivos (solo en Planificacion)

- Seccion con cupo > 0 pero 0 inscritos en la referencia → probablemente no se oferta realmente
- Seccion con cupo > 0 pero existia en la referencia sin inscritos y sin aula → probablemente residual del sistema

### Secciones que se excluyen de la asignacion automatica

Estas secciones tienen aulas externas o especiales que no se gestionan en este sistema:
La lista completa se encuentra en `MATERIAS_FUERADE_AULA.txt` y se puede consultar via `GET /api/materias-fuera-de-aula`. Un agente de IA debe consultar este endpoint y excluir esas materias antes de buscar aulas.

**IMPORTANTE:** `MATERIAS_FUERADE_AULA.txt` es la **unica fuente de verdad** para determinar si una materia necesita aula o no. **No se debe asumir** que una materia no necesita aula basandose en su nombre (ej: "Pasantia", "Clinica"). Solo las materias listadas en ese archivo se excluyen.

Estas secciones aparecen como "sin aula" pero no necesitan asignacion en el sistema.

---

## API del Servidor

El servidor expone los siguientes endpoints:

| Endpoint | Metodo | Descripcion |
|----------|--------|-------------|
| `/api/periodos` | GET | Lista de periodos academicos disponibles |
| `/api/oferta/:periodo` | GET | Oferta completa de un periodo (secciones, horarios, aulas, profesores) |
| `/api/aulas` | GET | Lista de aulas con capacidad, edificio y tipo |
| `/api/tipos-aula` | GET | Tipos de aula unicos disponibles |
| `/api/conflictos/:periodo` | GET | Conflictos de horario detectados en un periodo |
| `/api/secciones-sin-aula/:periodo` | GET | Secciones sin aula asignada. Acepta `?modo=planificacion` para filtrar por cupo > 0 en vez de inscritos > 0 |
| `/api/aulas/disponibles` | POST | Buscar aulas disponibles segun criterios (dia, bloques, capacidad, tipo, sede) |
| `/api/estadisticas/:periodo` | GET | Estadisticas de ocupacion de un periodo |
| `/api/equivalencias` | GET | Pares de materias equivalentes |
| `/api/tipo-aula-historico/:codAsignatura` | GET | Tipo de aula recomendado. Consulta primero `TIPOS_AULA_ASIGNATURAS.txt`, fallback a BD (ultimos 3 periodos, umbral 20%). Devuelve `tipoRecomendado`, `mixto`, `aulasRecomendadas`, `fuente` ('archivo' o 'bd'). Acepta `?sede=` |
| `/api/tipo-aula-historico/lote` | POST | Version en lote: recibe `{asignaturas: [...], sede?}`. Misma logica que el individual. Devuelve `resultados` con tipo, mixto, aulas recomendadas y fuente por asignatura |
| `/api/materias-fuera-de-aula` | GET | Lista de materias que no requieren aula. Cargada desde `MATERIAS_FUERADE_AULA.txt` (unica fuente de verdad para exclusiones) |
| `/api/ai/context/:periodo` | GET | Contexto completo para el asistente de IA |
| `/api/ai/optimize` | POST | Conversacion con el asistente de IA para busqueda inteligente |

Todos los endpoints que reciben periodo aceptan un parametro de query `?sede=` para filtrar por sede.

---

## Notas Tecnicas

- Los cambios de planificacion son **no destructivos**: solo se modifican datos en memoria del navegador. Nada se escribe en la base de datos hasta que se ejecute el SQL exportado.
- La deteccion de conflictos se ejecuta localmente en el navegador usando los datos ya cargados.
- En modo Planificacion, los inscritos del periodo de referencia se copian a las secciones del periodo nuevo como proyeccion. Esto permite que la deteccion de conflictos funcione aunque el periodo nuevo no tenga inscritos reales.
- El asistente de IA usa Claude Sonnet 4 y recibe el inventario completo de aulas con su ocupacion detallada para dar recomendaciones precisas con codigos de aula concretos. Solo puede mencionar aulas que existen en la base de datos.
- La sesion de planificacion se puede guardar en el almacenamiento local del navegador y restaurar en una sesion posterior.
- El SQL exportado usa transacciones y clausulas de verificacion del valor anterior para evitar sobreescribir cambios concurrentes.
