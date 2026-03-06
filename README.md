# Sistema de Asignación de Aulas - UAM

Sistema inteligente de gestión y asignación de aulas para la Universidad Arturo Michelena (UAM). Automatiza la administración de espacios académicos, detecta conflictos de horarios y proporciona análisis de utilización de aulas.

## 🚀 Características

- **Visualización de Horarios:** Ver horarios completos de todas las aulas por período académico
- **Detección de Conflictos:** Identificar automáticamente conflictos de horarios (dos clases en la misma aula al mismo tiempo)
- **Búsqueda de Aulas Disponibles:** Encontrar aulas disponibles para un día/hora específico
- **Secciones Sin Aula:** Reporte de secciones con estudiantes inscritos que no tienen aula asignada
- **Estadísticas de Uso:** Análisis de tasas de ocupación de aulas
- **Gestión de Equivalencias:** Manejo de materias equivalentes para evitar falsos positivos en conflictos
- **Multi-Campus:** Soporte para múltiples sedes (San Diego, Centro Histórico de Valencia)

## 📋 Requisitos Previos

- Node.js (versión 14 o superior)
- NPM o Yarn
- Acceso a base de datos MariaDB/MySQL con los datos académicos

## 🔧 Instalación

1. **Clonar el repositorio:**
   ```bash
   git clone <url-del-repositorio>
   cd SISTEMA_AULAS_UAM
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno:**

   Copia el archivo `.env.example` a `.env`:
   ```bash
   cp .env.example .env
   ```

   Edita el archivo `.env` con tus credenciales de base de datos:
   ```env
   DB_HOST=your_database_host
   DB_PORT=3306
   DB_USER=your_database_user
   DB_PASSWORD=your_database_password
   DB_NAME=your_database_name
   PORT=3000
   ```

4. **Configurar archivos de datos:**

   Asegúrate de tener el archivo `MATERIASEQUIVALENTES.txt` en la raíz del proyecto con las equivalencias de materias en formato:
   ```
   CODIGO1:CODIGO2
   ```

## 🚀 Uso

### Modo Desarrollo
```bash
npm run dev
```

### Modo Producción
```bash
npm start
```

El servidor estará disponible en `http://localhost:3000`

## 📊 API Endpoints

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/oferta/:periodo` | GET | Obtener ofertas de cursos del período |
| `/api/aulas` | GET | Listar todas las aulas |
| `/api/conflictos/:periodo` | GET | Detectar conflictos de horario |
| `/api/secciones-sin-aula/:periodo` | GET | Secciones sin aula asignada |
| `/api/estadisticas/:periodo` | GET | Estadísticas de ocupación |
| `/api/aulas/disponibles` | POST | Buscar aulas disponibles |
| `/api/equivalencias` | GET | Listar equivalencias de materias |
| `/api/recargar-equivalencias` | POST | Recargar equivalencias |
| `/api/tipos-aula` | GET | Obtener tipos de aula únicos |
| `/api/recargar-tipos-aula` | POST | Recargar tipos de aula desde BD |

### Parámetros Comunes

- `?sede=1` - Filtrar por sede (1: San Diego, 2: Centro Valencia)

## 🗄️ Estructura de la Base de Datos

El sistema requiere las siguientes tablas en la base de datos:

- `Oferta` - Secciones ofrecidas por período
- `Aulas` - Información de aulas (debe incluir campo `TipoAula`)
- `Asignaturas` - Catálogo de materias
- `Profesores` - Información de profesores
- `OfertaProfesor` - Relación oferta-profesor
- `Sedes` - Campus de la universidad
- `Horas` - Bloques horarios

## 🛠️ Tecnologías Utilizadas

- **Backend:** Node.js, Express.js
- **Base de Datos:** MariaDB
- **Frontend:** HTML5, CSS3, JavaScript (Vanilla)
- **Otros:** dotenv (variables de entorno)

## 📁 Estructura del Proyecto

```
SISTEMA_AULAS_UAM/
├── server.js                          # Servidor principal
├── sistema_asignacion_aulas.html      # Interfaz web
├── MATERIASEQUIVALENTES.txt           # Equivalencias de materias
├── package.json                       # Dependencias
├── .env                               # Variables de entorno (no en Git)
├── .env.example                       # Plantilla de variables
├── .gitignore                         # Archivos ignorados por Git
└── README.md                          # Este archivo
```

## 🔒 Seguridad

- **NUNCA** subas el archivo `.env` a GitHub
- Las credenciales de la base de datos están protegidas en variables de entorno
- El archivo `.gitignore` está configurado para excluir archivos sensibles

## 📝 Notas

- El sistema detecta conflictos considerando materias equivalentes para evitar falsos positivos
- Los tipos de aula se leen directamente del campo `TipoAula` en la tabla `Aulas`
- Se excluyen automáticamente las aulas de tipo "EXTERNO"
- El formato de horarios es: `BLOQUES:AULA` (ej: `5-6:V1-1`)

## 🤝 Contribución

Para contribuir al proyecto:

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📄 Licencia

[Especifica la licencia del proyecto]

## 👥 Autores

Universidad Arturo Michelena (UAM)

## 📧 Contacto

[Información de contacto]
