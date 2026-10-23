# CONTRACT-NAVIGATION

> Contrato canónico de navegación e identidad semántica de la interfaz de COMPÁS NG.
> Versión 1.0 — 2026-06-30
> Estado: VIGENTE

---

## 1. Justificación de este contrato

Los documentos existentes cubren:

| Documento | Qué cubre | Qué no cubre |
|---|---|---|
| `VISUAL-CONTRACT` | Identidad visual (colores, tipografía, gradiente, composición) | Vocabulario visible al usuario, semántica de espacios de trabajo |
| `INSTITUTIONAL-PRODUCTS-ARCHITECTURE` | Catálogo de productos institucionales y sus compiladores | Qué términos son visibles en la UI y cuáles deben permanecer internos |
| `ARCHITECTURE-CONSTITUTION` Art. 5 | Separación evidencia / interpretación / propuesta | Reglas de nomenclatura de la interfaz |
| `OPERATING-CONSTITUTION` Bloque F | "Un único nombre para cada concepto" | Qué nombres corresponden a qué espacios de trabajo |

Existe un hueco contractual: **ningún documento define las reglas semánticas que gobiernan la interfaz** — qué conceptos son visibles, qué vocabulario se usa para nombrarlos, qué representa cada espacio de trabajo y cómo se representa el ciclo institucional.

Este contrato cubre ese hueco. No duplica ni contradice los documentos anteriores: los complementa en la capa de identidad semántica.

---

## 2. Ámbito y jerarquía

Este contrato governa:

- el vocabulario visible al usuario en cualquier superficie de la interfaz;
- la semántica de los espacios de trabajo (qué representa cada uno);
- los principios de la Home (expediente municipal);
- los principios del componente de ciclo institucional;
- la representación de los productos institucionales en la interfaz.

Este contrato **no** governa:

- paleta de color, tipografía, gradiente, composición → `VISUAL-CONTRACT`;
- definición técnica de los productos institucionales → `INSTITUTIONAL-PRODUCTS-ARCHITECTURE`;
- contratos de compilación y generación de artefactos → contratos específicos por producto;
- estructura de persistencia → `CONTRACT-PERSISTENCE`.

**Jerarquía:** en caso de contradicción, prevalece `ARCHITECTURE-CONSTITUTION`, luego `FOUNDATIONS`, luego `OPERATING-CONSTITUTION`, luego este contrato, luego los contratos específicos de producto.

---

## 3. Principio fundamental

**La interfaz de COMPÁS NG representa el proceso institucional de Acción Local en Salud.**

No representa la arquitectura del software, los motores analíticos, los pipelines de datos ni los objetos de implementación. Un usuario del sistema — técnico de salud pública, coordinador de RELAS, responsable municipal — debe poder operar COMPÁS NG sin necesidad de conocer ningún concepto técnico de su implementación.

Este principio es invariante. No puede ceder ante consideraciones de conveniencia técnica o de correspondencia directa con la nomenclatura de implementación.

---

## 4. Vocabulario visible e invisible

### 4.1 Objetos y términos visibles en la interfaz

| Nombre visible | Concepto que representa | Producto asociado |
|---|---|---|
| **Diagnóstico territorial** | Recogida, organización y calidad de la evidencia disponible sobre el municipio | Base de Productos 1–3 |
| **Perfil de Salud Local** | Síntesis interpretativa del diagnóstico; objeto analítico validado | Producto 3 |
| **Perfil de Salud Local COMPÁS (PSL-C)** | Documento institucional compilado e inmutable del diagnóstico | Producto 3 |
| **Priorización** | Proceso técnico y participativo de selección de áreas de actuación | Base de Productos 5–6 |
| **Plan de Acción** | Borrador técnico de actuaciones derivado del PSL y de la priorización | Producto 6 |
| **Plan Local de Salud** | Documento institucional definitivo del compromiso municipal | Producto 7 |
| **Informe de Salud** | Fuente diagnóstica primaria del municipio | Capa documental |
| **Estudios complementarios** | Los trece instrumentos vigentes (7 EAS/IBSE: IBSE, DUKE-EAS, PREDIMED-EAS, SF-12 EAS, Sueño EAS, CAGE-EAS, IPAQ-EAS; 6 REDCap: AUDIT-C, GHQ-12, PHQ-9, PSQI, Fagerström, SBQ) | Producto 1 |
| **Activos comunitarios** | Recursos y fortalezas del territorio identificados | Capa documental |
| **Priorización ciudadana** | Proceso de participación comunitaria en la selección de temáticas | Capa participativa |
| **Cautelas metodológicas** | Advertencias sobre calidad, alcance y limitaciones del análisis | Transversal |
| **Expediente municipal** | Estado consolidado del proceso de planificación del municipio | Transversal |

### 4.2 Objetos y términos que nunca aparecen en la interfaz de usuario

Los siguientes conceptos son internos del sistema y están prohibidos en cualquier etiqueta, título, aviso, botón o texto visible al usuario:

| Término prohibido en UI | Nombre institucional equivalente si es necesario |
|---|---|
| `EvidenceStore` / `evidenceStore` | "Base de evidencias" o "Diagnóstico territorial" |
| `EvidenceAtom` | "Evidencia estructurada" o "Unidad de evidencia" |
| `MIT` / Motor de Interpretación Territorial | "Análisis territorial" (como actividad), nunca como nombre visible |
| `LT1` / `OIT` / `MIR` / `Reconciliación` | Resultados: "Lectura territorial", "Áreas de intervención", "Tensiones" |
| `EvidenceStoreIntegrityGuard` | "Advertencias del sistema" o silenciar si no relevante para el usuario |
| `MunicipalDocumentRepository` | "Repositorio documental" solo si necesario; preferir "Diagnóstico" |
| `LocalHealthProfile` (nombre técnico) | "Perfil de Salud Local" |
| `LocalHealthProfileArtifact` | "Perfil de Salud Local COMPÁS" o "PSL-C" |
| `Compiler` / `Builder` / `Pipeline` | Nunca visible |
| `SAM` / `SampleQualityAssessment` | "Calidad muestral" o "Cautela metodológica" (solo el resultado) |
| `ActionPlanDraft` | "Borrador del Plan de Acción" o "Plan de Acción" |
| `AgendaDraft` | "Agenda de actuaciones" |
| `EPVSAPanel` | El nombre EPVSA puede aparecer si se identifica como marco estratégico |
| `requiresHumanValidation` | "Pendiente de revisión técnica" o badge "Propuesta asistida" |
| `scaffold` | "Borrador orientativo" o badge "Propuesta asistida · Pendiente de revisión" |
| `pslIsStale` | "La evidencia ha cambiado desde la última validación" |

**Regla general:** si un nombre termina en `Engine`, `Store`, `Guard`, `Compiler`, `Builder`, `Draft`, `Runtime`, `Atom`, `Result` o proviene de un tipo TypeScript, no es visible al usuario.

---

## 5. Semántica de los espacios de trabajo

Un **espacio de trabajo** es la vista que organiza un conjunto de funciones institucionales relacionadas. Su nombre define qué actividad del proceso institucional representa, no qué módulo técnico contiene.

### 5.1 Principios de los espacios de trabajo

- Cada espacio tiene un nombre institucional que describe la actividad que el técnico realiza, no la arquitectura del software subyacente.
- Un espacio de trabajo puede contener múltiples paneles técnicos sin que sus nombres internos sean visibles al usuario.
- El orden de los espacios refleja el ciclo institucional, no el orden de implementación.
- El acceso a espacios de estadios posteriores puede bloquearse hasta que los requisitos anteriores se cumplan, con mensaje explicativo en lenguaje institucional.

### 5.2 Espacios de trabajo canónicos

| Espacio | Qué representa | Estadio del proceso | Bloqueable |
|---|---|---|---|
| **Inicio** | El expediente municipal: estado consolidado del proceso | Transversal | No |
| **Diagnóstico territorial** | Carga, organización y diagnóstico de la evidencia disponible (documentos, estudios, activos) | Etapa 1 — Diagnóstico | No |
| **Perfil de Salud Local** | Lectura interpretativa validada; compilación del PSL-C | Etapa 2 — Perfil | No (borrador siempre accesible) |
| **Priorización** | Selección técnica y participativa de áreas de intervención | Etapa 3 — Planificación (inicio) | Recomendado PSL validado |
| **Plan de Acción** | Borrador técnico del plan; agenda; seguimiento | Etapa 3 — Planificación (desarrollo) | Requiere PSL validado |
| **Plan Local de Salud** | Redacción formal; compilación institucional | Etapas 3–4 — Planificación y Decisión | Requiere proceso completo |

El espacio "Análisis territorial" (actual pestaña ③) no es un espacio canónico sino una vista auxiliar del Diagnóstico. Su contenido (lectura territorial, áreas de intervención, reconciliación) pertenece semánticamente al espacio "Diagnóstico territorial" o al espacio "Perfil de Salud Local" según cómo se use. Este contrato no prescribe si debe fundirse con otro espacio o mantenerse como auxiliar interno; sí prescribe que si se mantiene, su contenido nunca debe exponer terminología de motores internos.

---

## 6. La Home — Expediente municipal

### 6.1 Qué representa la Home

La Home representa el **expediente institucional del municipio**: el estado consolidado del proceso de Acción Local en Salud en un momento concreto.

La Home no es:

- una pantalla de bienvenida;
- un panel de control de módulos técnicos;
- un dashboard de métricas del sistema;
- un índice de funcionalidades.

La Home es el equivalente visual del expediente administrativo del municipio en el proceso RELAS: qué fases han sido completadas, en qué fase se está y qué falta para avanzar.

### 6.2 Componentes obligatorios de la Home

| Componente | Qué muestra |
|---|---|
| **Identificación municipal** | Nombre del municipio, provincia, contexto institucional del plan |
| **Estado del proceso** | En qué fase se encuentra el municipio; qué ha sido validado |
| **Fuentes del diagnóstico** | Qué documentos y estudios están presentes (no cuántos átomos hay en el EvidenceStore) |
| **Siguiente acción institucional** | La acción concreta que el técnico debe realizar para avanzar, en lenguaje del proceso |

### 6.3 Lo que la Home no muestra

- Métricas de sistema (total de átomos, versiones técnicas, IDs internos).
- Estado técnico de objetos internos (estado del `MunicipalityRuntime`, estado del `IntegrityGuard`).
- Accesos directos a motores analíticos como funcionalidad principal.

---

## 7. El Ciclo Institucional

### 7.1 Propósito del componente de ciclo

El componente de ciclo (`LocalHealthPlanningCycle`) representa el **proceso institucional completo de Acción Local en Salud**, no el alcance actual de la implementación de COMPÁS NG.

### 7.2 Principios

**P-CIC-1 — Representar el proceso completo, no el software actual.**
El ciclo debe mostrar todas las fases del proceso institucional, incluyendo las que COMPÁS NG no implementa aún. Las fases fuera del alcance actual del software aparecen en estado `blocked` o `pending` con indicación explícita de que son etapas institucionales más allá del diagnóstico y la planificación.

**P-CIC-2 — Lenguaje institucional.**
Las fases del ciclo usan nombres del proceso institucional (Diagnóstico, Perfil, Priorización, Plan, Aprobación política, Implantación, Evaluación, Comunicación). Nunca nombres de objetos de software (PSL, LHPC, ActionPlanDraft).

**P-CIC-3 — Inferencia honesta.**
Solo se infiere el estado de una fase cuando el sistema tiene información verificable para ello. Un estado no puede presentarse como "completado" si el sistema no puede verificar la condición de completitud. Las fases sin señal verificable (adhesión a RELAS, comunicación) se muestran como `pending` con nota explicativa, o se omiten del ciclo visible si no aportan valor diagnóstico al técnico.

**P-CIC-4 — El ciclo no es la navegación.**
El componente de ciclo informa sobre el estado del proceso institucional. No es el mecanismo primario de navegación entre espacios de trabajo. Puede incluir atajos de navegación hacia los espacios correspondientes, pero su función primaria es diagnóstica.

**P-CIC-5 — Siempre visible.**
El componente de ciclo es permanente en todas las vistas. Representa el expediente, no la vista actual.

### 7.3 Fases institucionales que el ciclo debe representar

El ciclo canónico de Acción Local en Salud (marco RELAS / metodología COMPÁS NG) incluye:

| Fase | Correspondencia COMPÁS NG | Estado típico actual |
|---|---|---|
| Diagnóstico territorial | Espacios 1–2: fuentes + análisis | Funcional |
| Perfil de Salud Local | Espacio 3: PSL | Funcional |
| Priorización | Espacio 4 | Funcional |
| Plan de Acción | Espacio 5 | Funcional (borrador) |
| Plan Local de Salud | Espacio 6 | Parcial (D3-03 pendiente) |
| Aprobación política | Fuera del software actual | `blocked` |
| Implantación | Fuera del software actual | `blocked` |
| Evaluación | Fuera del software actual | `blocked` |
| Comunicación | Fuera del software actual | `blocked` |

La decisión exacta sobre cuántas fases mostrar, en qué orden y con qué granularidad corresponde a la implementación. Este contrato establece el principio: el ciclo representa el proceso completo, no solo lo que el software hace hoy.

---

## 8. Representación de los Productos institucionales

> Reconciliado con los Fundamentos del Perfil único (`CONTRACT-INDEX`
> §«Fundamentos del Perfil único», 2026-07-17). El único producto institucional
> del Perfil es el **Perfil de Salud Local**. **No existe, en el estado objetivo,
> una pestaña ni un producto independiente «Perfil de Salud tipo NHS».** Esa
> ruta/pestaña ha sido retirada del código: **migración técnica ejecutada**
> (GOV-P4-01 · PR-E) y el resto de la representación derivada se retiró el 2026-10-23; no era vocabulario canónico. El PSL-C es la **compilación institucional del mismo
> Perfil**, no otro Perfil. Ninguna regla de este contrato mantiene un «Producto 4»
> separado.

### 8.1 Principio de separación producto / espacio

Un **producto institucional** (PSL-C, PLS) y el **espacio de trabajo** donde se
produce son objetos distintos.

- El espacio "Perfil de Salud Local" es el lugar donde el técnico trabaja con el diagnóstico.
- El "Perfil de Salud Local COMPÁS (PSL-C)" es el artefacto compilado que se entrega a las instituciones; es una **compilación del mismo Perfil**, no un producto-perfil distinto.

La interfaz debe mantener esta distinción visible. No deben confundirse. La estructura
del Perfil es **adaptativa**: no fija seis ni siete capítulos obligatorios (ver
`CONTRACT-MIT-PSL` §6.1.1 bis).

### 8.2 Denominaciones canónicas de los productos en la interfaz

| Producto | Nombre visible en interfaz | Nombre técnico (no visible) |
|---|---|---|
| Producto 3 | Perfil de Salud Local COMPÁS (PSL-C) | `LocalHealthProfileArtifact` |
| Producto 7 | Plan Local de Salud | `LocalHealthPlanDocument` |

> El antiguo «Producto 4 — Perfil de Salud tipo NHS» **ya no es denominación
> canónica** y se retira de esta tabla. La ruta/artefacto NHS han sido retirados del
> código: migración técnica ejecutada. El Perfil tiene una sola salida
> (`CONTRACT-LOCAL-HEALTH-PROFILE-METHODOLOGY`, Art. 17 ter).

### 8.3 Estados del PSL en la interfaz

| Estado técnico | Texto visible al usuario |
|---|---|
| `generated` | "Borrador generado · Pendiente de revisión técnica" |
| `review` | "En revisión técnica" |
| `validated` | "Validado técnicamente" |
| `validated` + `pslIsStale` | "Validado · La evidencia ha cambiado desde la última validación" |
| `approved` | "Aprobado institucionalmente" |
| `superseded` | "Sustituido por versión posterior" |
| `archived` | "Archivado" |

---

## 9. Compatibilidad con documentos existentes

### Con la Constitución Arquitectónica

Este contrato aplica el Art. 5 (separación evidencia/interpretación/propuesta) al plano de la interfaz: la nomenclatura visible distingue entre lo que el sistema ha detectado (diagnóstico), lo que el sistema interpreta (lectura territorial) y lo que el equipo técnico decide (priorización, plan). Ninguna de estas tres capas puede presentarse como las otras dos en la interfaz.

### Con FOUNDATIONS

- §2 (municipio como unidad canónica): la Home y todos los espacios tienen siempre el municipio como contexto. No existe vista sin municipio.
- §7 (arquitectura en capas): las denominaciones técnicas de las capas (`domain/`, `application/`, `infrastructure/`, `ui/`) no aparecen en la interfaz.

### Con OPERATING-CONSTITUTION

- Bloque F: "Un único nombre para cada concepto. Sin duplicidades entre contratos, documentación y UI." Este contrato establece los nombres canónicos de la capa de UI, resolviendo el Bloque F en el plano de navegación.

### Con INSTITUTIONAL-PRODUCTS-ARCHITECTURE

- §1 (productos institucionales): los nombres visibles en §4.1 de este contrato corresponden a los productos del catálogo de IPA.
- §639 ("Interfaz de la aplicación React (paneles, navegación, componentes) | VISUAL-CONTRACT"): este contrato complementa el VISUAL-CONTRACT en el plano semántico que el VISUAL-CONTRACT no cubre.

### Con VISUAL-CONTRACT

- Los principios visuales del VISUAL-CONTRACT (identidad cromática, tipografía, gradiente, composición) prevalecen sobre cualquier consideración estética de este contrato.
- Este contrato governa el vocabulario y la semántica; el VISUAL-CONTRACT governa el estilo y la identidad visual.
- No existe contradicción: operan en planos distintos.

### Con los contratos de producto certificados

- `CONTRACT-PSL-COMPAS`: los términos de este contrato en §4.1 y §8.2 son coherentes con el Producto 3 tal como está definido.
- `CONTRACT-LOCAL-HEALTH-PROFILE-COMPILER`: el PSL-C como "documento institucional" coincide con la denominación de §8.2.
- `CONTRACT-MIT-PSL`: la lectura del PSL es **única y adaptativa**; su cobertura conceptual (Conclusiones, Cierre interpretativo, Síntesis y Priorización, etc.) se muestra según la riqueza del expediente, **sin recuento obligatorio de capítulos** (§6.1.1 bis).
- `CONTRACT-LOCAL-HEALTH-PROFILE-METHODOLOGY` Art. 17 ter: el Perfil tiene una sola salida. No hay denominación canónica de un «Producto 4» separado.

---

## 10. Invariantes

**NAV-I1 — Primacía del proceso sobre la arquitectura:**
La interfaz refleja el proceso institucional. Cuando exista tensión entre lo que es conveniente técnicamente y lo que es coherente institucionalmente, prevalece la coherencia institucional.

**NAV-I2 — Opacidad interna:**
Los objetos de implementación (motores, compiladores, guards, stores) son internos y nunca aparecen en la interfaz. Su existencia puede deducirse por el funcionamiento del sistema, pero no por sus nombres técnicos.

**NAV-I3 — Honestidad sobre el estado:**
La interfaz solo informa de estados que el sistema puede verificar. No inventa completitudes, no simula progreso, no presenta como validado lo que no ha pasado por el proceso de validación.

**NAV-I4 — Municipio siempre presente:**
Toda vista tiene el municipio como contexto visible. No existe navegación sin contexto municipal.

**NAV-I5 — El ciclo representa el proceso completo:**
El componente de ciclo muestra todo el proceso institucional, incluyendo las fases que el software no implementa todavía. Las fases futuras existen en el ciclo como pendientes o bloqueadas, nunca como ausentes.

---

## 11. Lo que este contrato no define

Este contrato no define:

- El número exacto de pestañas ni su layout → implementación.
- Las clases CSS de los componentes de navegación → `VISUAL-CONTRACT` y `App.css`.
- El mecanismo técnico de `AppView` o `useState` → implementación.
- El contenido de cada panel dentro de cada espacio → contratos de producto específicos.
- La versión final del componente `LocalHealthPlanningCycle` → pendiente de implementación según §11 de `VISUAL-CONTRACT`.

---

## 12. Referencia cruzada

| Documento | Relación |
|---|---|
| `VISUAL-CONTRACT` | Gobernanza visual; prevalece en cuestiones de estilo |
| `INSTITUTIONAL-PRODUCTS-ARCHITECTURE` | Catálogo canónico de productos; sus nombres se aplican en §4.1 |
| `ARCHITECTURE-CONSTITUTION` Arts. 3, 5 | Base del principio de primacía del proceso |
| `FOUNDATIONS §2` | Municipio como unidad de trabajo |
| `OPERATING-CONSTITUTION` Bloque F | Terminología única sin duplicidades |
| `CONTRACT-PSL-COMPAS` | Producto 3 y sus términos canónicos |
| `CONTRACT-LOCAL-HEALTH-PROFILE-METHODOLOGY` Art. 17 ter | Una sola salida del Perfil; PSL-NHS retirado |
| `CONTRACT-LOCAL-HEALTH-PLAN-DOCUMENT` | Denominación canónica del Producto 7 |
| `docs/methodology/METHODOLOGICAL-FOUNDATIONS-LOCAL-HEALTH-PLANNING §I.3` | Las seis etapas canónicas del ciclo institucional |

---

*La interfaz de COMPÁS NG es la representación del proceso institucional, no del software que lo facilita.*
