# ForgeWorks: Functional Spec del Core MVC

Documento de análisis funcional de la propuesta de Core MVC aprobada con el docente. Cubre la descripción general del proyecto, la explicación y el alcance del core, y los diagramas de análisis.

## 1. Introducción

**Propósito.** Definir qué es ForgeWorks, qué parte se construye como core y cómo se comporta, para que sirva de referencia de desarrollo y de evaluación.

**Convenciones.** RF = requisito funcional. RNF = requisito no funcional. CU = caso de uso. **Vendedor** es el usuario administrador de un taller. **Cliente** es quien hace el encargo. El dinero se maneja siempre en centavos enteros.

**Contenido.** Descripción del proyecto (sección 2), explicación del core (3), alcance (4) y diagramas (5): ER global, clases global, casos de uso global, actividades del core y wireframes del core.

## 2. Descripción del proyecto

### 2.1 Problema

Quien vende productos hechos a medida (un carpintero, una tejedora, una florista) cotiza y toma encargos por mensajes sueltos. Cada pedido obliga a preguntar, a calcular a mano materiales, horas y plazo, y a recordar qué materiales quedan. El cliente no entiende por qué cambia el precio, y el taller descubre qué decisiones le complican el trabajo cuando ya aceptó el pedido.

### 2.2 Propuesta

ForgeWorks es una **plataforma multi-taller de encargos con estado para cualquier producto a medida**. Cada taller define su propio proceso como datos: qué decide el cliente, qué recursos se consumen, cuánto cuesta y tarda, y qué combinaciones cambian el camino. El cliente recorre un camino que depende de sus decisiones y del estado del taller, y el precio, el plazo y la ruta de producción son consecuencia de ese camino.

El sistema no sabe qué es una mesa, un suéter o un ramo. Solo conoce **decisiones, recursos, costos, reglas y condiciones**. El rubro es contenido que carga el taller, no código.

### 2.3 Actores

| Actor | Descripción |
| --- | --- |
| Cliente | Elige un producto de un taller, recorre su flujo, responde la cotización y sigue la producción. |
| Vendedor | Administra el taller: recursos, productos, reglas, grafo, publicación, instancias y avance de producción. |
| Sistema | Procesos automáticos: detección de caducidad, reencaminamiento de flujos, envío de eventos en vivo. |
| Administrador de plataforma | Gestiona talleres. Fuera del alcance del core. |

### 2.4 Módulos del proyecto completo

| Módulo | Qué hace | En el core |
| --- | --- | --- |
| M1 Cuentas y talleres | Registro, inicio de sesión, roles, aislamiento por taller | Sí (básico) |
| M2 Recursos e inventario | Consumibles, perecederos con lotes, capacidad, sustitutos | Sí |
| M3 Catálogo de productos | Ficha del producto y estados borrador/publicado | Sí (básico) |
| M4 Configurador | Decisiones, variables, consumos, costos, reglas y grafo | Sí |
| M5 Motor de flujo y evaluador | Calcula el siguiente paso con el contexto completo | Sí |
| M6 Cotización | Piso, objetivo, rango, aceptar, rechazar o ajustar | Sí |
| M7 Producción y seguimiento | Etapas y eventos de avance visibles al cliente | Sí (básico) |
| M8 Probador y publicación | Simulación, validación y versionado | Sí |
| M9 Trazabilidad | Por qué un cliente vio cierto camino y precio | Sí (traza por transición) |
| M10 Plantillas de rubro | Productos prearmados para copiar | No |
| M11 Calibración y asistente de costos | Horas reales vs estimadas, tarifa real | No |
| M12 Pagos y facturación | Cobro y comprobantes | No |
| M13 Notificaciones externas | Correo, mensajería | No (solo eventos en vivo dentro de la app) |

### 2.5 Rubros objetivo

Cualquier producto a medida cuya elaboración dependa de decisiones del cliente y de recursos limitados: carpintería, crochet, arreglos florales, cerámica y similares. Para validar la generalidad, el core se demuestra con dos rubros de naturaleza distinta.

### 2.6 Principios y tecnologías

- El proceso es un dato, no código. El taller lo edita sin desplegar nada.
- El servidor decide y el cliente solo refleja.
- Todo dato lleva su taller y toda consulta se filtra por él.
- El historial de cada encargo solo se agrega, nunca se edita. Las versiones publicadas son inmutables.
- **Backend:** Lucky (Crystal) con PostgreSQL y JSONB. **Frontend:** Angular con signals y rutas perezosas. **Tiempo real:** SSE. **Autenticación:** JWT con rol.

## 3. Explicación específica del core propuesto

### 3.1 Qué es el core

El core es el **motor de encargos con estado y su configurador**: la pareja que permite al taller describir un producto (decisiones, recursos, costos, reglas, grafo) y al cliente recorrerlo, de modo que el siguiente paso, el precio y el plazo se **calculen** con todo el contexto del cliente y el estado compartido del taller. Su pieza central es un **evaluador recursivo de condiciones anidadas**; los nodos del grafo solo representan lo que ese evaluador activa.

### 3.2 Por qué es un flujo personalizado

1. **El camino depende del historial.** El siguiente paso es función de todo el contexto acumulado, no solo del nodo actual.
2. **El proceso es un dato.** Pasos, condiciones y fórmulas viven en la versión publicada del producto.
3. **El estado compartido acopla flujos.** Si otro cliente agota un recurso o una flor caduca, tu camino cambia en vivo.
4. **El camino no es monótono.** Si cambia una respuesta previa o un recurso, el motor recalcula y puede invalidar pasos ya completados.
5. **El motor es agnóstico al rubro.** Un rubro nuevo es un producto nuevo configurado, no código nuevo.

**Prueba práctica:** si se quita el evaluador, quedan pantallas de formulario independientes.

### 3.3 Comparaciones dentro de comparaciones

Las condiciones son un árbol tipado. Una **Condición** es una comparación, un grupo `y`/`o` o una negación `no`. Una **Expresión** es un literal, una referencia, aritmética, una función o `si(Condición, Expresión, Expresión)`. Como una Condición contiene Expresiones y una Expresión puede contener una Condición, la anidación es recursiva.

| Nivel | Qué contiene | Ejemplo (carpintería) |
| --- | --- | --- |
| 1 | Comparación simple | `d.largo_m > 2` |
| 2 | Grupo de comparaciones | `y(d.largo_m > 2, d.acabado = manual)` |
| 3 | Grupo dentro de grupo | `y(d.largo_m > 2, o(r.roble.disponible < consumo(roble), y(d.acabado = manual, r.horas_taller.libre < v.horas_total)))` |
| 4 | Condición dentro de un operando | `v.horas_total > si(d.acabado = manual, 20, 12)` |
| 5 | Combinación de los anteriores | `y(a, o(b, y(c, no(v.plazo_dias > si(contiene(d.ocasion.etiquetas, sobrio), v.holgura_dias, v.holgura_dias + 3)))))` |

Límites: profundidad 10 y 200 nodos por expresión. Las referencias son `d.` (decisión), `v.` (variable derivada), `r.` (recurso) y `c.` (cotización).

### 3.4 Funcionamiento de punta a punta

**Fase A: el taller configura un producto**

1. Declara sus recursos (consumible, perecedero, capacidad, sustitutos).
2. Crea el producto y su versión borrador.
3. Define las decisiones, con tipos y etiquetas.
4. Define variables derivadas y consumos por recurso.
5. Define el modelo de costos y las etapas de producción.
6. Escribe reglas con condiciones anidadas y acciones.
7. Dibuja el grafo con ayuda del sistema.
8. Prueba con clientes simulados y cambios de recursos.
9. Valida y publica una versión inmutable.

**Fase B: el cliente recorre el producto.** En cada `POST /flows/:id/advance`, dentro de una transacción: se valida la respuesta, se guarda en el contexto, se recalculan variables, se evalúan todas las reglas, se recalcula la alcanzabilidad del grafo (posible invalidación de pasos previos), se elige el siguiente nodo por prioridad de aristas y se registra el evento con su traza.

**Fase C: el estado del taller cambia.** Al cambiar un recurso (edición del vendedor, reserva o caducidad), el motor busca las instancias que dependen de él, repite el cálculo y, si el camino cambia, registra `reencaminado` y avisa al cliente por SSE. Al aceptar la cotización se hace una **reserva firme** con bloqueo de filas.

### 3.5 Arquitectura MVC del core

| Capa | Responsabilidad | Componentes |
| --- | --- | --- |
| Modelo | Entidades, structs tipados de condiciones, lógica pura de dominio (evaluador, costos, plazo) | Modelos Lucky, `Condicion`, `Expresion`, `Evaluador`, servicios de costos y recursos |
| Controlador | Recibir peticiones, autorizar por rol y taller, orquestar transacciones, emitir eventos | Acciones Lucky (CRUD admin, `advance`, publicar, probador), canal SSE |
| Vista | Mostrar lo que el servidor decide, sin lógica de flujo | Angular: renderizador de paso, constructor de condiciones, lienzo, probador, visor de instancias |

### 3.6 El mismo core en tres rubros

|  | Carpintería | Crochet | Arreglos florales |
| --- | --- | --- | --- |
| Decisión que bifurca | Medida estándar o especial | Talla o medidas del cuerpo | Ocasión |
| Recurso compartido | Roble (consumible) | Lana por lote y horas de la tejedora (capacidad) | Flores (perecedero) |
| Condición anidada típica | Largo especial y (roble escaso o agenda llena) | Medidas propias o color agotado, y sin horas libres | Ocasión sobria y (sin existencias o flor que caduca antes de la entrega) |
| Reencaminamiento | Material alternativo | Color cercano o espera | Flor sustituta de la misma gama |

## 4. Alcance del core

### 4.1 Objetivo

Entregar un producto funcional en el que dos talleres de rubros distintos configuran un producto, dos clientes recorren caminos distintos, y un cambio de recurso reencamina el flujo en vivo, con trazabilidad completa de cada decisión del motor.

### 4.2 Requisitos funcionales incluidos

| ID | Requisito | Prioridad |
| --- | --- | --- |
| RF-01 | Registro e inicio de sesión con JWT y roles cliente y vendedor | Alta |
| RF-02 | Aislamiento por taller en todas las consultas | Alta |
| RF-03 | CRUD de recursos consumibles | Alta |
| RF-04 | Recursos perecederos con lotes y caducidad | Alta |
| RF-05 | Recurso de capacidad (horas por semana) | Media |
| RF-06 | Sustitutos con factor de conversión | Media |
| RF-07 | Crear producto y versión borrador | Alta |
| RF-08 | Decisiones de tipo opciones, número con unidad, texto y fecha, con etiquetas | Alta |
| RF-09 | Variables derivadas con orden topológico y detección de ciclos | Alta |
| RF-10 | Consumo por recurso mediante expresiones | Alta |
| RF-11 | Modelo de costos configurable y cálculo de piso, objetivo y rango | Alta |
| RF-12 | Etapas de producción y cálculo de plazo por proyección de ruta | Alta |
| RF-13 | Constructor de reglas con condiciones anidadas hasta nivel 5 | Alta |
| RF-14 | Acciones: bloquear opción, exigir decisión, ajustar precio, agregar tiempo, aviso, forzar ruta | Alta |
| RF-15 | Lienzo del grafo con nodos, aristas, prioridad y arista por defecto | Alta |
| RF-16 | Asistencias del lienzo: sin usar, sin salida, dependencias en vivo | Media |
| RF-17 | Probador paso a paso con traza por nivel de anidación | Alta |
| RF-18 | Probador con cambio de recurso en caliente | Alta |
| RF-19 | Barrido automático de combinaciones | Baja |
| RF-20 | Validación con errores y advertencias | Alta |
| RF-21 | Publicación versionada e inmutable (snapshot con hash) | Alta |
| RF-22 | Evaluador recursivo con traza | Alta |
| RF-23 | `POST /flows/:id/advance` transaccional | Alta |
| RF-24 | Alcanzabilidad e invalidación de pasos completados | Alta |
| RF-25 | Historial de eventos append-only | Alta |
| RF-26 | Renderizador de paso genérico en Angular | Alta |
| RF-27 | Cotización con desglose configurable | Alta |
| RF-28 | Aceptar, rechazar o pedir ajuste, con ramas por motivo | Alta |
| RF-29 | Reserva firme con `SELECT ... FOR UPDATE` ordenado por id | Alta |
| RF-30 | Reencaminamiento en vivo de instancias por cambio de recurso | Alta |
| RF-31 | Job de caducidad de lotes | Media |
| RF-32 | Eventos SSE al cliente | Alta |
| RF-33 | Eventos de avance de producción visibles al cliente | Media |
| RF-34 | Visor de instancias con traza para el vendedor | Media |

### 4.3 Fuera del alcance

Pagos y facturación, entrega y logística, chat, plantillas de rubro, calibración y asistente de costos, calendario de feriados, migración de instancias a versiones nuevas, notificaciones por correo, aplicación móvil nativa, varios idiomas y administración de la plataforma.

### 4.4 Requisitos no funcionales

| ID | Requisito |
| --- | --- |
| RNF-01 | Seguridad: JWT, autorización por rol y por taller en cada acción |
| RNF-02 | Integridad: transacciones en avance y reserva; dinero en `Int64` de centavos |
| RNF-03 | Rendimiento: `advance` por debajo de 300 ms (p95) con grafos de hasta 30 nodos |
| RNF-04 | Trazabilidad: toda transición guarda la traza de condiciones evaluadas |
| RNF-05 | Mantenibilidad: tipos con `case` exhaustivo y pruebas unitarias del evaluador (niveles 1 a 5) |
| RNF-06 | Usabilidad: interfaz responsive con tema claro y oscuro y contraste legible |
| RNF-07 | Disponibilidad en vivo: reconexión automática de SSE |

### 4.5 Supuestos y restricciones

- Un solo producto demostrable por taller, con unos 8 nodos y 2 rutas de producción.
- Sin calendario de feriados; la capacidad se reparte por orden de aceptación.
- Las instancias en curso nunca cambian de versión.
- Las variables no pueden referenciar `c.precio` (evita dependencia circular).

### 4.6 Criterios de aceptación (demostración)

1. Un nivel 3 de condiciones se construye en el constructor y se muestra con su texto en lenguaje natural.
2. Una variable de nivel 4 se evalúa correctamente en el probador.
3. Dos clientes del mismo producto ven pasos, bloqueos, precio y plazo distintos, con su traza.
4. Cambiar un recurso reencamina al cliente afectado y no al otro, en vivo.
5. Cambiar una respuesta previa invalida un paso ya completado.
6. Publicar es imposible si hay errores de validación; las instancias en curso conservan su versión.

## 5. Diagramas

### 5.1 Diagrama Entidad Relación (global)

Modelo de datos de todo el proyecto. Mientras el producto está en borrador sus definiciones viven en tablas normalizadas; al publicar se congela un snapshot JSONB dentro de `ProductVersion`.

| Entidad | Atributos clave | Relaciones |
| --- | --- | --- |
| Workshop | id, nombre | 1:N con User, Resource, Product, Instance |
| User | id, workshop_id (solo vendedor), email, password_hash, rol | N:1 con Workshop; 1:N con Instance (como cliente) |
| Resource | id, workshop_id, nombre_interno, tipo, unidad, costo_centavos, etiquetas | 1:N con ResourceLot; N:M consigo mismo vía ResourceSubstitute |
| ResourceLot | id, resource_id, cantidad, ingresa_en, caduca_en | N:1 con Resource |
| ResourceSubstitute | resource_id, sustituto_id, factor | Tabla puente de Resource |
| Product | id, workshop_id, nombre, estado, version_publicada_id | 1:N con ProductVersion |
| ProductVersion | id, product_id, numero, estado, snapshot, hash | 1:N con Decision, Variable, ConsumptionRule, ProductionStage, Rule, GraphNode, GraphEdge, TestCase, Instance; 1:1 con CostModel |
| Decision | id, version_id, nombre_interno, pregunta, tipo, config, obligatoria | 1:N con DecisionOption |
| DecisionOption | id, decision_id, nombre, etiquetas, orden | N:1 con Decision |
| Variable | id, version_id, nombre_interno, tipo, expresion, dependencias | N:1 con ProductVersion |
| ConsumptionRule | id, version_id, resource_id, cantidad_expr, condicion | N:1 con ProductVersion y Resource |
| CostModel | id, version_id, componentes, margen_min_bp, margen_obj_bp, prima_oficio, banda_bp, redondeo, desglose | 1:1 con ProductVersion |
| ProductionStage | id, version_id, nombre, horas_expr, capacity_resource_id, espera_expr | N:1 con ProductVersion; N:1 con Resource |
| Rule | id, version_id, nombre, prioridad, condicion | 1:N con RuleAction |
| RuleAction | id, rule_id, tipo, parametros | N:1 con Rule |
| GraphNode | id, version_id, tipo, titulo, decisiones, stage_id, posicion | 1:N con GraphEdge como origen y como destino |
| GraphEdge | id, version_id, origen_id, destino_id, condicion, prioridad, por_defecto | N:1 con GraphNode (dos veces) |
| Instance | id, workshop_id, version_id, cliente_id, nodo_actual_id, contexto, estado | 1:N con InstanceEvent, Reservation, Quote; N:M con Resource vía InstanceResourceDep |
| InstanceEvent | id, instance_id, tipo, nodo_origen, nodo_destino, traza, creado_en | N:1 con Instance (solo se agrega) |
| InstanceResourceDep | instance_id, resource_id | Tabla puente |
| Reservation | id, instance_id, resource_id, lot_id, cantidad, estado | N:1 con Instance y Resource |
| Quote | id, instance_id, costo_total, piso, objetivo, rango_bajo, rango_alto, precio, desglose, respuesta, motivo | N:1 con Instance |
| TestCase | id, version_id, nombre, entradas, estado_recursos | N:1 con ProductVersion |

La versión del producto (resaltada) enlaza su contenido con cada instancia; el taller es dueño de cuentas, recursos y productos.

### 5.2 Diagrama de clases (global)

Se organiza en tres paquetes. Las condiciones y expresiones son jerarquías con herencia y composición recursiva: `Si` contiene una `Condicion` y `Comparacion` contiene `Expresion`.

| Paquete | Clases | Responsabilidad y métodos clave |
| --- | --- | --- |
| Dominio | Workshop, User, Resource (Consumible, Perecedero, Capacidad), ResourceLot, Product, ProductVersion, Decision, DecisionOption, Variable, Rule, RuleAction, GraphNode (Inicio, Paso, Bifurcacion, Cotizacion, Produccion, Fin), GraphEdge, Instance, InstanceEvent, Quote, Reservation | Entidades con sus atributos. `Resource` define `disponible()`; `Perecedero` suma lotes vigentes; `Capacidad` calcula `libre()` |
| Lenguaje | Condicion (Comparacion, Grupo, Negacion), Expresion (Literal, Ref, Aritmetica, Llamada, Si), Contexto, Traza, Evaluador | `Evaluador.evaluar(condicion, contexto, traza)` y `evaluar_expresion(...)`, mutuamente recursivos. `Contexto` resuelve referencias `d`, `v`, `r`, `c` |
| Servicios | MotorFlujo, ServicioReglas, ServicioCostos, ServicioPlazo, ServicioRecursos, Reencaminador, ValidadorPublicacion, Publicador, Probador | `MotorFlujo.advance(instancia, respuestas)`; `ServicioCostos.cotizar(contexto)`; `Reencaminador.recalcular(recurso)`; `ServicioRecursos.reservar(instancia)`; `Probador.simular(version, entradas, estado)` |

Las flechas de acento muestran la recursión mutua: Comparacion contiene Expresion y Si contiene Condicion.

### 5.3 Diagrama de casos de uso (global)

| ID | Caso de uso | Actor | Relaciones |
| --- | --- | --- | --- |
| CU-01 | Registrarse e iniciar sesión | Cliente, Vendedor |  |
| CU-02 | Explorar productos del taller | Cliente |  |
| CU-03 | Iniciar encargo | Cliente |  |
| CU-04 | Responder paso | Cliente | include CU-05 |
| CU-05 | Evaluar condiciones | Sistema |  |
| CU-06 | Ver opciones bloqueadas y su motivo | Cliente | extend CU-04 |
| CU-07 | Cambiar una respuesta anterior | Cliente | extend CU-04 |
| CU-08 | Ver cotización | Cliente |  |
| CU-09 | Responder cotización (aceptar, rechazar, ajustar) | Cliente | include CU-10 al aceptar |
| CU-10 | Reservar recursos | Sistema |  |
| CU-11 | Recibir reencaminamiento en vivo | Cliente |  |
| CU-12 | Ver seguimiento de producción | Cliente |  |
| CU-13 | Gestionar recursos y lotes | Vendedor |  |
| CU-14 | Gestionar sustitutos | Vendedor | extend CU-13 |
| CU-15 | Crear producto | Vendedor |  |
| CU-16 | Definir decisiones | Vendedor |  |
| CU-17 | Definir variables y consumos | Vendedor |  |
| CU-18 | Definir costos y etapas | Vendedor |  |
| CU-19 | Definir reglas | Vendedor | include CU-20 |
| CU-20 | Construir condición anidada | Vendedor |  |
| CU-21 | Dibujar grafo | Vendedor | include CU-20 |
| CU-22 | Probar producto | Vendedor |  |
| CU-23 | Cambiar recurso en caliente | Vendedor | extend CU-22 |
| CU-24 | Ejecutar barrido | Vendedor | extend CU-22 |
| CU-25 | Publicar versión | Vendedor | include CU-26 |
| CU-26 | Validar producto | Sistema |  |
| CU-27 | Consultar instancias y traza | Vendedor |  |
| CU-28 | Registrar avance de producción | Vendedor |  |
| CU-29 | Actualizar stock | Vendedor | dispara CU-31 |
| CU-30 | Detectar caducidad de lotes | Sistema | dispara CU-31 |
| CU-31 | Reencaminar instancias afectadas | Sistema | include CU-05 |

CU-05, el evaluador de condiciones, es el caso que casi todos los demás incluyen.

### 5.4 Diagramas de actividades (core)

#### Actividad 1: configurar y publicar un producto (calles: Vendedor, Sistema)
1. Vendedor declara recursos. Crea producto. Sistema crea versión borrador.
2. Vendedor define decisiones, variables, consumos, costos y etapas. Sistema valida tipos y ciclos en cada guardado.
3. Vendedor escribe reglas y dibuja el grafo. Sistema muestra advertencias en vivo.
4. Vendedor prueba un caso. Si el resultado no es el esperado, vuelve al paso 2 o 3.
5. Vendedor pulsa Publicar. Sistema ejecuta validaciones. Si hay errores, los muestra y vuelve al paso 2 o 3. Si no, congela el snapshot, crea la versión N+1 y marca el producto como publicado.

#### Actividad 2: avance del cliente (calles: Cliente, Motor, Base de datos)
1. Cliente responde un paso y envía. Motor bloquea la instancia y valida la respuesta. Si es inválida o la opción está bloqueada, devuelve el error y el cliente corrige.
2. Motor guarda la respuesta, recalcula variables y evalúa todas las reglas.
3. Motor recalcula alcanzabilidad. Si un paso previo quedó inválido, lo marca y devuelve al cliente a ese paso.
4. Motor evalúa las aristas del nodo actual por prioridad y encadena bifurcaciones hasta un paso, cotización o fin.
5. Si el siguiente nodo es cotización, calcula piso, objetivo y rango. El cliente decide: aceptar (reserva firme; si falla, reencamina a la alternativa), rechazar (rama por motivo) o ajustar (vuelve a configuración).
6. Motor guarda el evento con la traza y responde con el paso renderizable.

#### Actividad 3: reencaminamiento por cambio de recurso (calles: Vendedor o Job, Motor, Cliente)
1. Un cambio de recurso ocurre: el vendedor edita stock, un cliente reserva o el job detecta una caducidad.
2. Motor busca instancias activas con dependencia a ese recurso.
3. Por cada una, recalcula variables, reglas y camino en la misma transacción.
4. Si el camino no cambió, no hace nada. Si cambió, guarda el evento `reencaminado` con su causa.
5. Cliente recibe el evento por SSE y su pantalla pasa al paso alternativo con el precio recalculado.

### 5.5 Wireframes (core)

**Estilo global:** Interfaces para ForgeWorks en español para talleres artesanales. Estilo sobrio, cálido y preciso, esquinas de 8 px, bordes finos. Modo claro: fondo `#F6F3EC`, tarjetas `#FFFFFF` con borde `#DDD8CC`, texto `#121826`, secundario `#5B6273`, acento `#0B7A6F`, error `#C2334D`. Modo oscuro: fondo `#0E131F`, tarjetas `#161D2D` con borde `#263149`, texto `#ECE8DF`, secundario `#9AA1B2`, acento `#2DD4BF`, error `#FF6B81`.

#### Pantallas del cliente (móvil)
- **W1. Inicio de sesión y registro:** Tarjeta centrada, pestañas «Iniciar sesión» / «Crear cuenta», selector «Soy cliente / Soy un taller», selector claro/oscuro.
- **W2. Catálogo del taller:** Cuadrícula de productos con foto, descripción, «Desde $» y plazo, botón «Hacer encargo».
- **W3. Paso de configuración:** Indicador de progreso («Paso 2 de 4: Medidas»), campo numérico con unidad, selector en tarjetas, fecha de entrega, resumen flotante con precio y plazo estimados, «¿Por qué este precio?».
- **W4. Opciones bloqueadas:** Opciones no disponibles en gris con candado y motivo visible debajo («No disponible: se agotó el stock»).
- **W5. Aviso de reencaminamiento en vivo:** Hoja inferior «Tu encargo cambió», comparación Antes/Ahora y lista de alternativas compatibles.
- **W6. Cotización:** Precio objetivo, rango, plazo y desglose desplegable por categorías; acciones «Aceptar cotización», «Pedir ajuste» y «Rechazar» (con hoja de motivo).
- **W7. Seguimiento de producción:** Línea de tiempo vertical con etapas de la ruta, fotos de avance y «Ver el camino de mi encargo».

#### Pantallas del vendedor (escritorio)
- **W8. Recursos del taller:** Tabla con consumibles, perecederos y capacidad; panel derecho con lotes y caducidad o sustitutos.
- **W9. Mis productos:** Tarjetas con estado (borrador/publicado), versión y acciones «Editar», «Probar», «Ver versiones».
- **W10. Decisiones del producto:** Formulario de preguntas, tipo, configuración, etiquetas y vista previa móvil reactiva.
- **W11. Variables y consumos:** Editor de expresiones por bloques con «si... entonces... si no...» y tabla de consumos con detector de dependencias circulares.
- **W12. Costos y tiempos:** Configuración de componentes de costo, márgenes bp, tarifas, etapas de producción y vista previa del cálculo.
- **W13. Constructor de reglas:** Cajas anidadas por nivel de sangría (Y/O/NO), operadores, acciones y traducción a lenguaje natural.
- **W14. Lienzo del grafo:** Nodos (Paso, Bifurcación, Cotización, Producción, Fin), aristas con condiciones y prioridad, arista por defecto, detección de errores en vivo.
- **W15. Probador:** Simulación interactiva con formulario de cliente, sliders de recursos en caliente, ruta y árbol de traza desplegable.
- **W16. Validación y publicación:** Chequeo estricto de errores y advertencias antes de congelar snapshot inmutable con hash.
- **W17. Instancias y traza:** Panel de seguimiento de encargos con línea de tiempo y detalle explicativo de «Por qué».

