# ForgeWorks — Contexto y Especificación del Proyecto

> **Documento maestro de especificación funcional:** [docs/functional_spec_core_mvc.md](docs/functional_spec_core_mvc.md)

Este repositorio contiene **ForgeWorks**, una plataforma multi-taller de encargos con estado para productos hechos a medida (carpintería, crochet, arreglos florales, cerámica, etc.).

---

## 1. Principios Arquitectónicos Fundamentales

1. **El proceso es un dato, no código:** El taller modela su proceso (decisiones, recursos, costos, reglas, grafo) sin desplegar nada. El motor es completamente agnóstico al rubro.
2. **El servidor decide, el cliente solo refleja:** Toda la lógica de transición, alcanzabilidad, cotización y validación vive en el backend.
3. **Aislamiento multi-taller estricto (RF-02):** Todo dato pertenece a un `workshop_id` y toda consulta se filtra por él.
4. **Acoplamiento por estado compartido (RF-30):** Si un recurso cambia o caduca, las instancias activas se reencaminan en caliente y se notifica al cliente en tiempo real vía **SSE**.
5. **Grafo no monótono y alcanzabilidad (RF-24):** Si el cliente retrocede o un recurso cambia, el motor recalcula la alcanzabilidad e invalida pasos completados que ya no correspondan.
6. **Inmutabilidad y trazabilidad append-only (RF-21, RF-25):** Las versiones publicadas se congelan en un snapshot JSONB con hash SHA. El historial de eventos de cada encargo solo se agrega, nunca se edita.
7. **Dinero entero (RNF-02):** Todo valor monetario se maneja en `Int64` de centavos.
8. **Concurrencia segura (RF-29):** La reserva firme se realiza con transacción `SELECT ... FOR UPDATE` ordenado por ID de recurso para evitar deadlocks.

---

## 2. Componentes Clave del Core

### Motor de Dominio (Lenguaje de Condiciones y Expresiones)
- **Árbol recursivo tipado:** Una `Condición` contiene `Expresión`es; una `Expresión` puede contener una `Condición` mediante `si(Condición, Expresión, Expresión)`.
- **Niveles 1 a 5 de anidación** (profundidad máxima 10, hasta 200 nodos).
- **Prefijos de referencia:**
  - `d.`: Respuestas a decisiones del cliente.
  - `v.`: Variables derivadas (ordenadas topológicamente, sin ciclos).
  - `r.`: Recursos e inventario compartido (`disponible`, `libre`).
  - `c.`: Parámetros de cotización.
- **Traza explicativa:** Cada evaluación guarda qué nodo se ejecutó, qué valores se compararon y por qué se tomó cada rama.

### Grafo de Flujo
- **Nodos:** `Inicio`, `Paso` (con decisiones), `Bifurcación` (evaluación de condiciones), `Cotización`, `Producción`, `Fin`.
- **Aristas:** Evaluadas por prioridad con arista `por_defecto`.

### Stack Tecnológico
- **Backend (`forgeworks_api/`):** Crystal con Lucky Framework 1.5, Avram ORM, PostgreSQL y JSONB.
- **Frontend (`forgeworks-web/`):** Angular 20+, Signals, Standalone Components, lazy routes y Tailwind/CSS sobrio (W1–W17).
- **Tiempo Real:** Server-Sent Events (SSE).
- **Autenticación:** JWT con roles (`cliente`, `vendedor`).

---

## 3. Estructura de Documentación y Referencia

- **Especificación Completa:** Consulta siempre [docs/functional_spec_core_mvc.md](docs/functional_spec_core_mvc.md) para revisar requisitos funcionales (RF-01 al RF-34), requisitos no funcionales (RNF-01 al RNF-07), diagrama de clases, modelo entidad-relación y wireframes (W1 a W17).

---

## 4. Identidad Visual y Paleta Oficial de Colores (Frontend)

La paleta institucional de ForgeWorks proviene de la identidad artesanal oficial y rige todo el desarrollo de UI/UX en SCSS/CSS:

| Variable SCSS | Tono Institucional | HEX | RGB | CMYK | Rol Semántico en la Aplicación |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `$color-rust` | Óxido / Terracota Artesanal | `#A14827` | `161, 72, 39` | `26, 80, 97, 19` | Color de acento (`$accent-color`), botones secundarios, badges, highlights de forja y fuego. |
| `$color-cream` | Crema Arena Cálida | `#FFF3CA` | `255, 243, 202` | `0, 3, 24, 0` | Fondos cálidos (`$surface-cream`), fondos de tarjetas, contrastes orgánicos suaves. |
| `$color-moss` | Verde Enebro / Musgo | `#384D3D` | `56, 77, 61` | `73, 48, 72, 43` | Tono complementario (`$secondary-color`), etiquetas de recursos, badges de lotes naturales. |
| `$color-forest` | Verde Forja / Bosque Profundo | `#1F4032` | `31, 64, 50` | `81, 49, 74, 54` | Color primario institucional (`$primary-color`), logo oficial, botones principales, bordes de foco. |
| `$color-charcoal` | Negro Carbón / Tinta | `#231F20` | `35, 31, 32` | `70, 67, 64, 74` | Texto principal (`$text-primary`), bordes oscuros, sombras profundas y máxima legibilidad. |

---

## 5. Tipografía Oficial (Frontend)

- **Títulos y Encabezados (`h1`, `h2`, `h3`, `$font-title`):** `Alfa Slab One`, cursive, serif (display slab pesado de fuerte carácter artesanal y de forja).
- **Cuerpo, Formularios y UI (`$font-body`):** `Roboto`, sans-serif (alta legibilidad técnica y sobria en todas las escalas).

---

## 6. Estándar de Controles UI: Dropdowns y Selects (Frontend)

- **No usar selects nativos (`<select>`)** para dropdowns de la aplicación.
- **Implementación VanillaJS / Custom Component:** Todo dropdown debe ser estilizado con una interfaz personalizada moderna y consistente (Vanilla JS / Angular Custom Dropdown con ControlValueAccessor o Signal inputs/outputs).
- **Estilo y Paleta:**
  - Botón selector y contenedor desplegable con bordes redondeados (`$radius-input`), borde sutil (`#e2e8f0`), tipografía `$font-body` sobria y chevron animado.
  - Opciones de lista con hover cálido, estado seleccionado resaltado con verde institucional (`$color-forest` / `#1F4032`) o terracota (`$color-rust` / `#A14827`) según contexto.
  - Cierre automático al hacer clic fuera (*click outside*), soporte de teclado (Escape, Enter, flechas) y compatibilidad con formularios reactivos y Signals.
  - Animación suave de apertura y cierre (*fade in / scale*).
- **Consistencia obligatoria:** Cualquier dropdown nuevo o refactorizado en ForgeWorks debe seguir estrictamente este componente y estándar.
