# ForgeWorks — Administración MVC para el Core de Talleres Artesanales

![Lucky Framework](https://img.shields.io/badge/Backend-Lucky%20Framework%201.5-blue?style=for-the-badge&logo=crystal&logoColor=white)
![Crystal Language](https://img.shields.io/badge/Language-Crystal%201.20-black?style=for-the-badge&logo=crystal&logoColor=white)
![Angular](https://img.shields.io/badge/Frontend-Angular%2020%2B%20Signals-DD0031?style=for-the-badge&logo=angular&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%20JSONB-336791?style=for-the-badge&logo=postgresql&logoColor=white)
![JWT Authentication](https://img.shields.io/badge/Auth-JWT%20%2B%20Bcrypt-green?style=for-the-badge&logo=jsonwebtokens&logoColor=white)

Plataforma multi-taller de encargos con estado para productos hechos a medida (carpintería, maquetas arquitectónicas y 3D, arreglos florales, cerámica, etc.). 

Este módulo implementa la **Administración MVC que alimenta al Core de ForgeWorks**, permitiendo la gestión segura de talleres (`Workshop`), sus recursos e insumos (`Resource`) y el inventario físico con fechas de caducidad (`ResourceLot`), cumpliendo con los requisitos de **validación de datos sensibles en el servidor** y **relaciones entre tablas con dropdowns en cascada**.

---

## 📑 Tabla de Contenidos

1. [📹 Video Demostrativo y Guion](#-video-demostrativo-y-guion)
2. [🧠 Justificación: ¿Por qué esto alimenta al Core?](#-justificación-por-qué-esto-alimenta-al-core)
3. [🚨 Validación en Back-End de Datos Sensibles](#-validación-en-back-end-de-datos-sensibles)
4. [⛓️ Relación entre Tablas con Dropdown en Cascada](#️-relación-entre-tablas-con-dropdown-en-cascada)
5. [🔒 Aislamiento Multi-Taller Estricto (RF-02)](#-aislamiento-multi-taller-estricto-rf-02)
6. [🏛️ Arquitectura MVC del Tech Stack](#️-arquitectura-mvc-del-tech-stack)
7. [🛠️ Endpoints de la API](#️-endpoints-de-la-api)
8. [🚀 Puesta en Marcha (Instalación Local)](#-puesta-en-marcha-instalación-local)

---

## 📹 Video Demostrativo y Guion

> [!IMPORTANT]
> **Enlace al video explicativo (máx. 4 minutos):**
> 🔗 **[Ver Video en Loom / YouTube](https://www.loom.com/)** *(Reemplazar con el enlace de tu grabación)*

### Guion recomendado para la grabación:
* **0:00 - 0:45 | Introducción y Core de ForgeWorks:** 
  Explicar qué es ForgeWorks: el proceso es un dato, el motor es agnóstico al rubro y necesita insumos para calcular cotizaciones (`r.roble.disponible < consumo(roble)`).
* **0:45 - 1:30 | Sesión Activa y Aislamiento por Taller:** 
  Iniciar sesión y mostrar que el usuario queda amarrado a su taller (`workshop_id`) sin desplegables públicos inseguros.
* **1:30 - 2:30 | Demostración del Dropdown en Cascada:**
  Seleccionar el tipo de recurso (*Perecedero* vs. *Consumible*). Mostrar cómo el segundo selector se actualiza en tiempo real consumiendo la API de Lucky, asociando la clave foránea del lote sin escribir IDs a mano.
* **2:30 - 3:30 | 🚨 Prueba de Validación en Back-End:**
  - Intentar guardar un lote perecedero con fecha de caducidad vencida o menor a la fecha de ingreso.
  - Mostrar la pestaña *Network* de DevTools con el código de respuesta **`HTTP 422 Unprocessable Entity`** emitido por el servidor de Lucky.
  - Explicar el validador matemático de Cédula/RUC con Módulo 10 y Módulo 11 en Crystal (`src/utils/identification_validator.cr`).
* **3:30 - 4:00 | Arquitectura MVC y Conclusión:**
  Recorrido rápido por el código (Modelo Avram, Operaciones, Acciones y Componente Angular con Signals).

---

## 🧠 Justificación: ¿Por qué esto alimenta al Core?

El principio fundamental de ForgeWorks es: **«El proceso es un dato, no código»**.
1. **El Core no tiene insumos cableados en el código:** El evaluador recursivo de condiciones del backend solo procesa referencias (`r.`, `d.`, `v.`, `c.`).
2. **El estado compartido del taller acopla las decisiones (RF-30):** Cuando un cliente navega el configurador de un producto, el motor evalúa en vivo si hay suficiente stock de roble, resina o flores. Si el taller no alimenta sus recursos y lotes de inventario, el motor no puede cotizar ni reencaminar encargos en tiempo real.
3. **Conclusión:** Esta administración es la **fuente de datos vivos del taller** que nutre al motor de decisiones.

---

## 🚨 Validación en Back-End de Datos Sensibles

Para cumplir con la consigna de que los datos sensibles no dependan de validaciones perimetrales en JavaScript, se blindaron dos capas críticas en el servidor Crystal/Lucky:

### 1. Cédula y RUC Ecuatoriano (Módulo 10 y Módulo 11)
Archivo: [`src/utils/identification_validator.cr`](forgeworks_api/src/utils/identification_validator.cr) y mixin [`src/operations/mixins/identification_validations.cr`](forgeworks_api/src/operations/mixins/identification_validations.cr).
* **Cédula (10 dígitos):** Validación de código de provincia (01 a 24, o 30), tercer dígito menor a 6 y algoritmo oficial de **Módulo 10** con coeficientes `[2, 1, 2, 1, 2, 1, 2, 1, 2]`.
* **RUC Persona Natural (13 dígitos):** Los primeros 10 dígitos deben ser una cédula matemáticamente válida y los 3 dígitos finales (código de establecimiento) no pueden ser `000`.
* **RUC Sociedad Privada (13 dígitos):** Tercer dígito igual a 9 y algoritmo oficial de **Módulo 11** con coeficientes `[4, 3, 2, 7, 6, 5, 4, 3, 2]`.
* **RUC Entidad Pública (13 dígitos):** Tercer dígito igual a 6 y algoritmo oficial de **Módulo 11** con coeficientes `[3, 2, 7, 6, 5, 4, 3, 2]`.
* **Pruebas unitarias:** 6/6 tests aprobados en [`spec/utils/identification_validator_spec.cr`](forgeworks_api/spec/utils/identification_validator_spec.cr).

### 2. Caducidad de Insumos Perecederos (RF-04)
Archivo: [`src/operations/save_resource_lot.cr`](forgeworks_api/src/operations/save_resource_lot.cr).
* Si el recurso es de tipo `perecedero` (flores, resinas, alimentos), el backend rechaza la transacción con `HTTP 422` si:
  * `expires_at` es nulo o vacío.
  * `expires_at <= received_at` (la fecha de caducidad es menor o igual al ingreso).
  * `expires_at < Time.utc` (el lote que se intenta ingresar ya está vencido).

### 3. Dinero Entero en Centavos (RNF-02)
Archivo: [`src/operations/save_resource.cr`](forgeworks_api/src/operations/save_resource.cr).
* Los costos se almacenan como `Int64` de centavos enteros (`cost_cents > 0`) para evitar errores de redondeo de punto flotante en la cotización.

---

## ⛓️ Relación entre Tablas con Dropdown en Cascada

Para registrar un lote de inventario físico (`ResourceLot`), la interfaz no permite ingresar un ID foráneo manualmente. El flujo opera mediante **selectores dependientes en cascada**:

$$\text{Tipo de Insumo (Filtro)} \xrightarrow{\text{consulta API}} \text{Recursos del Taller Logueado} \xrightarrow{\text{asocia FK}} \text{Lote de Inventario}$$

```mermaid
sequenceDiagram
    autonumber
    actor V as Vendedor (Taller)
    participant UI as Angular (Inventory Component)
    participant API as Lucky Backend (Actions)
    participant DB as PostgreSQL

    V->>UI: Paso 1: Selecciona "Perecedero" en Dropdown 1
    UI->>API: GET /api/resources?resource_type=perecedero (Bearer JWT)
    API->>DB: SELECT * FROM resources WHERE workshop_id = current_workshop AND resource_type = 'perecedero'
    DB-->>API: Registros filtrados
    API-->>UI: Lista de recursos del taller
    UI->>UI: Popula Dropdown 2 y activa campo de caducidad obligatoria

    V->>UI: Paso 2: Selecciona "Rosas Rojas" en Dropdown 2
    V->>UI: Ingresa Lote "LOT-2026", Cantidad 50 y Fechas
    V->>UI: Clic en "Guardar Lote de Inventario"
    UI->>API: POST /api/resource_lots { resource_id: 10, lot_number: "...", expires_at: "..." }
    API->>API: SaveResourceLot valida caducidad y pertenencia al taller
    API->>DB: INSERT INTO resource_lots (...)
    API-->>UI: 201 Created { id: 101, ... }
    UI->>V: Confirmación con SweetAlert2 y refresco de tabla reactiva
```

---

## 🔒 Aislamiento Multi-Taller Estricto (RF-02)

Para garantizar la seguridad de los datos:
1. **Sesión Activa:** El token JWT emitido al iniciar sesión amarra al usuario a su `workshop_id`.
2. **Sin Dropdowns Públicos de Talleres:** Ningún usuario puede seleccionar qué taller consultar o modificar; la macro `current_workshop` en `ApiAction` filtra todas las consultas de recursos y lotes por el taller de la sesión.
3. **Roles en el Sistema:**
   - **`Admin`:** Dueño del taller. Configura insumos, costos y gestiona colaboradores.
   - **`Vendor`:** Gestor comercial de cara a cotizaciones y clientes.
   - **`Staff`:** Operario de taller que registra lotes de inventario y avances de producción.
   - **`Client`:** Comprador externo (`workshop_id = nil`).

---

## 🏛️ Arquitectura MVC del Tech Stack

| Capa MVC | Tecnología | Componentes Clave | Responsabilidad |
| :--- | :--- | :--- | :--- |
| **🧠 Modelo** | **Avram ORM & Operations (Crystal)** | • [`workshop.cr`](forgeworks_api/src/models/workshop.cr) \| [`save_workshop.cr`](forgeworks_api/src/operations/save_workshop.cr)<br>• [`resource.cr`](forgeworks_api/src/models/resource.cr) \| [`save_resource.cr`](forgeworks_api/src/operations/save_resource.cr)<br>• [`resource_lot.cr`](forgeworks_api/src/models/resource_lot.cr) \| [`save_resource_lot.cr`](forgeworks_api/src/operations/save_resource_lot.cr)<br>• [`identification_validator.cr`](forgeworks_api/src/utils/identification_validator.cr) | Define la estructura de datos en PostgreSQL, reglas de integridad referencial, algoritmos matemáticos y validaciones de datos sensibles. |
| **👁️ Vista** | **Angular SPA & Serializers** | • [`inventory.ts`](forgeworks-web/src/app/pages/inventory/inventory.ts) \| [`inventory.html`](forgeworks-web/src/app/pages/inventory/inventory.html)<br>• [`workshop_serializer.cr`](forgeworks_api/src/serializers/workshop_serializer.cr)<br>• [`resource_serializer.cr`](forgeworks_api/src/serializers/resource_serializer.cr)<br>• [`resource_lot_serializer.cr`](forgeworks_api/src/serializers/resource_lot_serializer.cr) | Renderiza la interfaz reactiva con Signals, gestiona la cascada visual y formatea las respuestas JSON de la API. |
| **🎮 Controlador** | **Lucky Actions (Crystal)** | • [`api_action.cr`](forgeworks_api/src/actions/api_action.cr)<br>• `Api::Workshops::*` ([`mine.cr`](forgeworks_api/src/actions/api/workshops/mine.cr), [`create.cr`](forgeworks_api/src/actions/api/workshops/create.cr))<br>• `Api::Resources::*` ([`index.cr`](forgeworks_api/src/actions/api/resources/index.cr), [`create.cr`](forgeworks_api/src/actions/api/resources/create.cr))<br>• `Api::ResourceLots::*` ([`index.cr`](forgeworks_api/src/actions/api/resource_lots/index.cr), [`create.cr`](forgeworks_api/src/actions/api/resource_lots/create.cr)) | Recibe peticiones HTTP, valida JWT, aplica aislamiento por taller y coordina operaciones y serializadores. |

---

## 🛠️ Endpoints de la API

### Talleres (`/api/workshops`)
* `GET /api/my_workshop` — Obtiene el taller de la sesión actual.
* `POST /api/workshops` — Registra un nuevo taller (**valida Cédula/RUC con Módulo 10**).
* `GET /api/workshops/:workshop_id` — Consulta detalle de un taller.
* `PUT /api/workshops/:workshop_id` — Actualiza datos del taller.

### Recursos (`/api/resources`)
* `GET /api/resources` — Lista recursos del taller (admite `?resource_type=` para el dropdown en cascada).
* `POST /api/resources` — Crea un insumo asociándolo automáticamente al taller activo.
* `GET /api/resources/:resource_id` — Consulta individual de recurso.
* `PUT /api/resources/:resource_id` — Modificación de recurso.
* `DELETE /api/resources/:resource_id` — Baja lógica del recurso (`is_active = false`).

### Lotes de Inventario (`/api/resource_lots`)
* `GET /api/resource_lots` — Lista lotes físicos (admite `?resource_id=`).
* `POST /api/resource_lots` — Registra un lote (**valida fecha de caducidad para perecederos**).
* `GET /api/resource_lots/:lot_id` — Detalle del lote.
* `PUT /api/resource_lots/:lot_id` — Actualización de lote.
* `DELETE /api/resource_lots/:lot_id` — Eliminación de lote.

---

## 🚀 Puesta en Marcha (Instalación Local)

### Prerrequisitos
* **Crystal:** `1.20+`
* **Node.js:** `v20+` y `npm`
* **PostgreSQL:** `14+` en puerto local `5432`

### 1. Backend (Lucky Framework)
```bash
cd forgeworks_api

# Instalar dependencias de Crystal
shards install

# Configurar variables de entorno si es necesario (.env)
# Correr migraciones de base de datos
crystal run tasks.cr -- db.migrate

# Iniciar servidor en http://localhost:3000
crystal run src/start_server.cr
```

### 2. Frontend (Angular 20+)
```bash
cd forgeworks-web

# Instalar paquetes
npm install

# Iniciar servidor de desarrollo en http://localhost:4200
npm start
```
Abrir el navegador en `http://localhost:4200`, iniciar sesión y navegar a `/inventory`.
