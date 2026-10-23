# COMPÁS NG — Blueprint Arquitectónico de Producción

> Nota de actualización — 13 de septiembre de 2026:
> este blueprint conserva decisiones y tensiones históricas. El MTE v1 ya está
> implementado y documentado; el acceso autenticado territorial queda en reserva;
> y la edición directa del Plan de Acción no depende de revisión formal
> intermedia. Para la foto viva, ver `docs/ESTADO-ACTUAL-COMPAS-NG.md`.

> Plano maestro de la arquitectura. No es un roadmap ni una lista de tareas.
> Es la respuesta a una única pregunta:
>
> **¿Qué arquitectura debe existir para que COMPÁS NG produzca de forma coherente
> un Perfil de Salud Local, un Plan Local de Salud y una Encuesta Municipal?**
>
> Fecha de emisión: 2026-06-28
> No implementa nada. Establece el plano sobre el que se implementará todo.

---

> **Reconciliación (2026-07-17):** por los Fundamentos del Perfil único
> (`CONTRACT-INDEX` §«Fundamentos del Perfil único»), **el «PRODUCTO 4 — NHS Health
> Profile» deja de ser un producto institucional independiente**. Donde este plano lo
> presente como producto/artefacto/compilador propio o en un *path* paralelo, queda
> **superado**: sería, a lo sumo, una representación derivada dentro del Perfil, sin
> compilador ni artefacto propio garantizado. El 2026-10-23 se retiró también esa
> representación: el Perfil tiene una sola salida. Asimismo, toda referencia a «7 capítulos» del PSL queda superada
> por la **lectura única y adaptativa** (`CONTRACT-MIT-PSL` §6.1.1 bis).

---

## Los tres productos canónicos

COMPÁS NG produce exactamente tres tipos de artefacto institucional:

| Producto | Descripción | Flujo de origen |
|---|---|---|
| **Perfil de Salud Local** | Síntesis analítica del estado de salud territorial. Documento de diagnóstico institucional validado. | Documento Fuente → EvidenceStore → MIT → PSL → Compilador |
| **Plan Local de Salud** | Documento de planificación institucional. Integra diagnóstico, priorizaciones, estrategia, acciones, agenda y seguimiento. | PSL aprobado → MTE → Plan de Acción → Agenda → Seguimiento → Compilador |
| **Encuesta Municipal** | Definición metodológica completa de un instrumento de medición municipal. Produce un Data Dictionary REDCap. | Biblioteca Metodológica → Constructor → REDCap Compiler |

Todo lo que existe o existirá en COMPÁS NG sirve a uno o más de estos tres productos.
Si un componente no puede vincularse a ninguno de los tres, no pertenece al sistema.

---

## Mapa completo del sistema

```
                        ╔══════════════════════════════╗
                        ║         MUNICIPIO            ║
                        ║    Expediente Territorial    ║
                        ╚══════════════════════════════╝
                                      │
          ┌───────────────────────────┼───────────────────────────┐
          │                           │                           │
          ▼                           ▼                           ▼
  ┌───────────────┐         ┌─────────────────┐       ┌─────────────────────┐
  │  Repositorio  │         │   Biblioteca    │       │   Repositorio       │
  │  Documental   │         │  Metodológica   │       │   Estratégico       │
  │  Municipal    │         │  Canónica       │       │   Territorial       │
  └───────┬───────┘         └────────┬────────┘       └──────────┬──────────┘
          │                          │                           │
          ▼                          ▼                           │
  ╔═══════════════╗        ┌─────────────────┐                  │
  ║ NIVEL 1       ║        │   Constructor   │                  │
  ║               ║        │  Metodológico   │                  │
  ║ EvidenceStore ║        └────────┬────────┘                  │
  ║ IntegrityGuard║                 │                           │
  ╚═══════╤═══════╝                 ▼                           │
          │                ┌─────────────────┐                  │
          │                │ REDCap Compiler │                  │
          │                └────────┬────────┘                  │
          ▼                         │                           │
  ╔═══════════════╗                 ▼                           │
  ║ NIVEL 2       ║        ┌─────────────────┐                  │
  ║               ║        │    Encuesta     │                  │
  ║ MIT           ║        │    Municipal    │                  │
  ║ Reconciliación║        │  (Data Dict.)   │                  │
  ║               ║        └─────────────────┘                  │
  ║ PSL           ║              PRODUCTO 3                      │
  ╚═══════╤═══════╝                                             │
          │                                                      │
          ▼                                                      │
  ╔═══════════════╗                                             │
  ║ NIVEL 3       ║◄────────────────────────────────────────────┘
  ║               ║
  ║ Priorización  ║
  ║ MTE           ║
  ║ Plan Acción   ║
  ║ Agenda        ║
  ║ Seguimiento   ║
  ╚═══════╤═══════╝
          │
          ▼
  ╔═══════════════════════════════════════════╗
  ║             COMPILADORES                 ║
  ║                                          ║
  ║  LocalHealthProfileCompiler              ║
  ║  NHSHealthProfileCompiler                ║
  ║  LocalHealthPlanCompiler                 ║
  ╚═══════════════════════════════════════════╝
          │
          ▼
  ╔═══════════════════════════════════════════╗
  ║         PRODUCTOS DOCUMENTALES           ║
  ║                                          ║
  ║  Perfil de Salud Local     (PRODUCTO 3)  ║
  ║  NHS Health Profile        (PRODUCTO 4) ║
  ║  Plan Local de Salud       (PRODUCTO 2)  ║
  ║  Resumen Ejecutivo         (futuro)      ║
  ╚═══════════════════════════════════════════╝
```

---

## I. Objetos de dominio

### I.1 Objetos de nivel 1 (evidencia)

| Objeto | Estado | Descripción |
|---|---|---|
| `MunicipalDocument` | ✅ Implementado | Documento en el repositorio. Kind, tags, metadatos de procedencia. |
| `MunicipalDocumentRepository` | ✅ Implementado | Colección de documentos de un municipio. 11 tipos canónicos. Canonicidad por kind y tag. |
| `EvidenceAtom` | ✅ Implementado | Unidad mínima de evidencia estructurada. Kind, confidence, provenance, requiresHumanValidation. |
| `EvidenceStore` | ✅ Implementado | Colección de átomos activos de un municipio. Versionada por updatedAt. |
| `IntegrityGuardResult` | ✅ Implementado | Output del saneamiento: store limpio + errores + advertencias. 5 reglas A-E. |
| `MunicipalSnapshot` | ✅ Implementado | Vista agregada del estado documental. Sin contenido de documentos. |
| `MunicipalInventory` | ✅ Implementado | Inventario diagnóstico derivado del snapshot. |
| `MunicipalityWorkspace` | ✅ Implementado | Objeto canónico del expediente territorial. Contiene repositorio, estudios, evidencia, PSL validado. |

### I.2 Objetos de nivel 2 (interpretación)

| Objeto | Estado | Descripción |
|---|---|---|
| `EstadoTerritorialEvolutivo` | ✅ Implementado | Output del MIT. Incluye LT1, OIT, dimensión longitudinal, tensiones, marcos, orígenes. `requiresHumanValidation: true`. |
| `LT1Result` | ✅ Implementado | Clasificación de átomos por tipo semántico. No es un objeto de pipeline independiente: es `dimensionDiagnostica` del ETE. |
| `OITResult` | ✅ Implementado | Áreas de intervención territorial. Heurísticas, no compromisos. |
| `ReconciliacionResult` | ✅ Implementado | Conflictos interpretativos con clasificación escalada/no-escalada/ruido. Resolución siempre "no-resuelta". |
| `LocalHealthProfile` (PSL) | ✅ Implementado | Objeto canónico del Nivel 2. 7 capítulos. 6 estados del ciclo de vida. Único puente autorizado al Nivel 3. |

**Estados del PSL y transiciones:**

```
generated ──[validar]──► validated ──[aprobar]──► approved
    ▲                        │
    └───[invalidar]──────────┘
    
generated/validated ──► superseded   (sustituido por PSL posterior)
generated/validated ──► archived     (proceso cerrado)
```

Estado `review` (en revisión técnica activa): definido en el tipo, transición no implementada en UI.
Estado `approved`: tipo definido. Handler de transición (`handleApprovePSL`) **no existe** en la UI. Es prerequisito del LocalHealthPlanCompiler.

### I.3 Objetos de nivel 3 (decisión)

| Objeto | Estado | Descripción |
|---|---|---|
| `ThematicPrioritisation` | ✅ Implementado | 10 temáticas canónicas. documentId obligatorio. EvidenceAtoms de participación. |
| `PrioritizationResult` | ✅ Implementado | Candidaturas de priorización derivadas del PSL. |
| `EPVSATranslationResult` | ✅ Implementado (provisional) | Mapeo a líneas EPVSA (LE1–LE4). Solo EPVSA. No es el MTE canónico. |
| `ActionPlanDraft` | ✅ Implementado (borrador) | Objetivos y actuaciones técnicas. `requiresHumanValidation: true`. |
| `AgendaDraft` | ✅ Implementado (borrador) | Items anuales trimestralizados ligados al plan. `requiresHumanValidation: true`. |
| `MonitoringDraft` | ✅ Implementado (borrador) | Seguimiento de items de la agenda por estado. `requiresHumanValidation: true`. |
| `StrategicTranslationResult` | 🔵 No implementado | Output del MTE canónico (que reemplazará EPVSATranslator). Requiere Repositorio Estratégico. |

### I.4 Objetos metodológicos

| Objeto | Estado | Descripción |
|---|---|---|
| `MethodologicalModule` | ✅ Implementado | Definición canónica de un instrumento: identity, source, items, dimensions, algorithm, interpretation, limitations, adapters. |
| `QuestionnaireDefinition` | ✅ Implementado (tipo) | Composición de módulos metodológicos + bloques de clasificación. Output target (redcap, json, documentation). |
| `QuestionnaireProject` | ✅ Implementado (tipo) | Wrapper de QuestionnaireDefinition con metadatos de proyecto. |
| `QuestionnaireArtifact` | ✅ Implementado (tipo) | Artefacto generado: CSV de Data Dictionary REDCap. |
| `ClassificationBlockDefinition` | ✅ Implementado (tipo, sin contenido) | Bloques sociodemográficos. Todos en estado `planned`. |
| `RedcapDictionaryDefinition` | ✅ Implementado | Definición estructurada del Data Dictionary REDCap. |
| `RedcapFieldDefinition` | ✅ Implementado | Campo individual del diccionario REDCap. |

### I.5 Objetos estratégicos

| Objeto | Estado | Descripción |
|---|---|---|
| `StrategicElement` | ✅ Implementado | Elemento de un marco estratégico: id, label, description, indicators, sourceTrace. |
| `StrategicFramework` | ✅ Implementado | Marco estratégico del PSL Capítulo I: secciones normativo/estratégico/metodológico/salutogénico/fuentes. |
| `StrategicResource` | 🔵 No implementado | Recurso gestionable del Repositorio Estratégico (CONTRACT-STRATEGIC-REPOSITORY). Diseño conceptual. |
| `StrategicRepository` | 🔵 No implementado | Colección gestionable de recursos estratégicos. Reemplaza la función editable del Registry. |
| `StrategicDerivationTrace` | 🔵 No implementado | Trazabilidad del MTE: de qué evidencia y recurso estratégico proviene cada elemento del Plan. |

### I.6 Objetos de productos documentales

| Objeto | Estado | Descripción |
|---|---|---|
| `LocalHealthProfileArtifact` | 🔵 No implementado | Artefacto compilado del Perfil de Salud Local. Estructura, secciones, formato. |
| `NHSHealthProfileArtifact` | 🔵 No implementado | Representación editorial tipo NHS. Alta densidad, tipografía estructural, indicadores comparativos. |
| `LocalHealthPlanDocument` | ❌ Sin contrato ni implementación | Documento institucional del Plan Local de Salud. Ver §VI.3 y Hueco H-1. |
| `ExecutiveSummaryArtifact` | ❌ Sin definición | Resumen ejecutivo del proceso de planificación. No existe ni como tipo ni como contrato. |

---

## II. Repositorios

| Repositorio | Estado | Propósito | Naturaleza |
|---|---|---|---|
| **MunicipalDocumentRepository** | ✅ Implementado | Almacena documentos oficiales del municipio | Mutable por el equipo técnico. Persistido en localStorage. |
| **EvidenceStore** | ✅ Implementado | Colección de átomos derivados de los documentos | Derivado. Se recalcula. Solo el saneado alimenta los motores. |
| **Biblioteca Metodológica** (`MethodologicalRegistry`) | ⚠️ Parcial | Fuente única de verdad de instrumentos metodológicos | Estática en código. 3/6 instrumentos completos. |
| **StrategicFrameworkRegistry** | ✅ Implementado (solo lectura) | Catálogo de referencia de marcos estratégicos | Inmutable en código. 5 marcos: EPVSA, ESCA, RELAS, BUENA_EDAD, MAYORES. |
| **StrategicRepository** | 🔵 No implementado | Repositorio gestionable de recursos estratégicos por el equipo | Mutable. Editable y ampliable. Reemplaza la función editable del Registry. |

### Tensión arquitectónica: Registry vs Repository

El `StrategicFrameworkRegistry` es un catálogo de referencia inmutable embebido en código.
El `StrategicRepository` (CONTRACT-STRATEGIC-REPOSITORY) será un objeto gestionable por el equipo técnico.

**Decisión pendiente:** ¿Coexisten o el Repository reemplaza al Registry como fuente de consulta del MIT?

Opción A: el Registry permanece como bootstrap inmutable; el Repository lo amplía con recursos específicos del territorio.
Opción B: el Registry se convierte en la inicialización del Repository; el Repository es la única fuente desde Sprint 2.

Esta decisión afecta al diseño del MTE y debe tomarse antes de implementar el Repository.

---

## III. Motores

### III.1 Motores del Nivel 2

| Motor | Estado | Entrada | Salida |
|---|---|---|---|
| **IntegrityGuard** | ✅ Implementado | `EvidenceStore` | `IntegrityGuardResult` (store saneado + errores + warnings) |
| **LT1Engine** | ✅ Implementado | `EvidenceStore` saneado | `LT1Result` (clasificación por tipo semántico) |
| **OITEngine** | ✅ Implementado | `LT1Result` | `OITResult` (áreas de intervención heurísticas) |
| **ReconciliacionEngine** | ✅ Implementado | `EstadoTerritorialEvolutivo` + historial | `ReconciliacionResult` (conflictos clasificados) |
| **buildLocalHealthProfile** | ✅ Implementado (función pura) | EvidenceStore + MIT + Reconciliación + Workspace | `LocalHealthProfile` en estado `generated` |

LT1, OIT y Reconciliación son sub-rutinas del MIT, no stages independientes del pipeline.
El MIT produce el `EstadoTerritorialEvolutivo` que los encapsula.

### III.2 Motores del Nivel 3

| Motor | Estado | Entrada | Salida | Observación |
|---|---|---|---|---|
| **PrioritizationEngine** | ✅ Implementado | `LocalHealthProfile` (PSL) | `PrioritizationResult` | Solo consume PSL (PSL-C1) |
| **EPVSATranslator** | ✅ Implementado (provisional) | `PrioritizationResult` | `EPVSATranslationResult` | Solo mapea EPVSA (LE1-LE4). No es el MTE canónico. |
| **ActionPlanEngine** | ✅ Implementado (borrador) | `EPVSATranslationResult` + frameworks + PSL | `ActionPlanDraft` | Borrador técnico; requiere validación humana |
| **AgendaEngine** | ✅ Implementado (borrador) | `ActionPlanDraft` | `AgendaDraft` | Trimestrización orientativa |
| **MonitoringEngine** | ✅ Implementado (borrador) | `AgendaDraft` | `MonitoringDraft` | Estado `pending-validation` para todos los items |
| **Motor de Traducción Estratégica (MTE)** | 🔵 No implementado | PSL `validated` + Priorizaciones + StrategicRepository | `StrategicTranslationResult` | Reemplazará EPVSATranslator. Requiere Repository. |
| **SAM Engine** | ✅ Motor implementado (Producto 2) | `PopulationReference` + `nObserved` | `SampleQualityAssessment` | Motor puro + integración 6 instrumentos. Tripirámide visual y EvidenceAtoms pendientes. |

### III.3 Limitación actual del EPVSATranslator

El EPVSATranslator infiere la línea EPVSA mediante análisis de palabras clave en título y rationale.
Solo maneja EPVSA (LE1–LE4). No consume el StrategicRepository.

El MTE canónico deberá:
- Consumir el StrategicRepository (todos los marcos: ESCA, RELAS, EBE, PSMA, PEM, EPVSA).
- Producir `StrategicDerivationTrace` con trazabilidad completa.
- Cumplir las 6 restricciones de no-sustitución de CONTRACT-STRATEGIC-TRANSLATION.

---

## IV. Compiladores

### IV.1 Familia de compiladores

Los compiladores son motores de exportación documental. No analizan evidencia ni producen interpretaciones.
Transforman objetos ya validados en artefactos exportables.

#### LocalHealthProfileCompiler

| Campo | Valor |
|---|---|
| **Propósito** | Compilar el PSL como documento institucional autónomo de diagnóstico territorial |
| **Entrada** | `LocalHealthProfile` en estado `validated` |
| **Salida** | `LocalHealthProfileArtifact` (estructura documental: caps. I–VII + metadatos) |
| **Gate** | PSL en estado `validated` |
| **Contrato** | Pendiente de crear: `CONTRACT-LOCAL-HEALTH-PROFILE-COMPILER` |
| **Sprint** | Sprint 2 |

#### NHSHealthProfileCompiler

| Campo | Valor |
|---|---|
| **Propósito** | Generar representación editorial tipo NHS Health Profiles a partir del PSL |
| **Entrada** | `LocalHealthProfile` en estado `validated` + datos de referencia (Granada/Andalucía) |
| **Salida** | `NHSHealthProfileArtifact` (alta densidad, tipografía estructural, indicadores comparativos) |
| **Gate** | PSL `validated` + referencias poblacionales disponibles |
| **Restricción** | No introduce nueva interpretación. Es presentación, no análisis. |
| **Contrato** | Pendiente de crear: `CONTRACT-NHS-HEALTH-PROFILE-COMPILER` |
| **Sprint** | Sprint 2 |

#### LocalHealthPlanCompiler

| Campo | Valor |
|---|---|
| **Propósito** | Compilar el Plan Local de Salud como documento institucional definitivo |
| **Entradas** | PSL `approved` + PrioritizationResult + StrategicTranslationResult + ActionPlanDraft validado + AgendaDraft validado + MonitoringDraft validado |
| **Salida** | `LocalHealthPlanDocument` (artefacto institucional completo, exportable) |
| **Gate obligatorio** | PSL en estado `approved` + `CONTRACT-LOCAL-HEALTH-PLAN-DOCUMENT` aprobado |
| **Prerequisito contractual** | `CONTRACT-LOCAL-HEALTH-PLAN-DOCUMENT` debe existir antes de diseñar este compilador |
| **Sprint** | Sprint 2 (si CONTRACT-LOCAL-HEALTH-PLAN-DOCUMENT se aprueba en la primera mitad) |

#### REDCap Compiler

El REDCapCompiler opera sobre tres capas independientes. La separación es obligatoria:
ninguna capa puede contener decisiones de la otra.

| Capa | Contenido | Origen |
|---|---|---|
| **1 — Metodológica** | Módulos, dimensiones, algoritmos de scoring, lógica de salto (semántica) | Biblioteca Metodológica + Constructor |
| **2 — REDCap Estructural** | Data Dictionary, field types, variable names, choices, branching logic REDCap, calc formulas, @HIDDEN | Adaptadores `redcap` de cada módulo |
| **3 — Visual / Editorial** | HTML en `fieldLabel`, HTML en `sectionHeader`, campos `descriptive` institucionales, paleta COMPÁS inline | `COMPASRedcapTheme` / `RedcapVisualTemplate` |

**Dos niveles de salida:**

| Nivel | Capas | Descripción |
|---|---|---|
| **Nivel 1 — Funcional mínimo** | 1 + 2 | CSV sin HTML. Importable en cualquier REDCap. Auditable metodológicamente. |
| **Nivel 2 — Institucional COMPÁS** | 1 + 2 + 3 | CSV con portada, tarjetas de pregunta, encabezados de bloque y sección de resultados con identidad COMPÁS. |

Los dos niveles producen exactamente las mismas variables, la misma branching logic
y los mismos campos calculados. Solo difieren en los valores presentacionales.

**Objetos de la capa visual:**

| Objeto | Descripción |
|---|---|
| `COMPASRedcapTheme` | Tokens de color y tipografía COMPÁS válidos en HTML inline de REDCap |
| `RedcapVisualTemplate` | Plantillas HTML para: portada, encabezado de bloque, tarjeta de pregunta, nota metodológica, separador, tarjeta de resultado |

**La capa visual REDCap no sustituye el VISUAL-CONTRACT general de la aplicación.**
Es la adaptación de sus principios a las posibilidades y restricciones de REDCap
(solo CSS inline; solo fuentes del sistema; sin `<style>` externo).

| Campo | Valor |
|---|---|
| **Entradas** | `QuestionnaireProject` + `RedcapVisualTemplate` (opcional para Nivel 2) |
| **Salida Nivel 1** | `QuestionnaireArtifact` (CSV funcional mínimo) |
| **Salida Nivel 2** | `QuestionnaireArtifact` (CSV institucional COMPÁS) |
| **Estado actual** | `RedcapDictionaryBuilder` y `RedcapDictionaryCsvExporter` generan Nivel 1 básico. Sin plantilla visual. Sin UI. |
| **Gate Nivel 1** | Módulos con `redcapFormField` completo en registry |
| **Gate Nivel 2** | Nivel 1 + `CONTRACT-REDCAP-VISUAL-TEMPLATE` vigente |
| **Sprint** | Sprint 2 (Nivel 1 completo + UI + CONTRACT-REDCAP-VISUAL-TEMPLATE) |

### IV.2 Lo que los compiladores NO hacen

- No analizan evidencia.
- No interpretan datos.
- No sugieren prioridades.
- No modifican el PSL, el plan ni ningún objeto de los niveles 1–3.
- No sustituyen la validación humana de los objetos que compilan.

---

## V. Constructor Metodológico

El Constructor Metodológico es el sistema que permite componer científicamente una Encuesta Municipal.
No es un formulario. Es la definición metodológica completa de un instrumento de medición.

### V.1 Flujo canónico

```
Biblioteca Metodológica (MethodologicalRegistry)
    │   [define módulos: IBSE, DUKE, PREDIMED, SF-12, Sueño, CAGE, futuros]
    │
    ▼
Constructor Metodológico (QuestionnaireBuilder)
    │   [compone módulos + bloques de clasificación]
    │   [valida existencia de cada módulo en el registry]
    │   [preserva identidad metodológica de cada instrumento]
    │
    ▼
Encuesta Municipal (QuestionnaireDefinition)
    │   [definición metodológica completa: módulos + bloques + outputs]
    │   [no es un formulario; es la especificación del instrumento]
    │
    ▼
REDCap Compiler (GenerateRedcapDictionaryArtifact)
    │   [genera Data Dictionary CSV]
    │   [branching logic de los adaptadores de cada módulo]
    │   [calculated fields y metadata]
    │
    ▼
Data Dictionary REDCap (.csv)
    │
    [administración externa en REDCap — fuera del alcance de COMPÁS NG]
    │
    ▼
Exportación de resultados REDCap (.csv con microdatos)
    │
    ▼                                  ← HUECO H-2 (ver §VIII)
Parser del instrumento específico
    │
    ▼
EvidenceStore (nuevo ciclo de evidencia)
```

### V.2 Estado actual del Constructor

| Componente | Estado |
|---|---|
| `QuestionnaireDefinition` (tipo) | ✅ Implementado |
| `QuestionnaireProject` (tipo) | ✅ Implementado |
| `QuestionnaireBuilder` (validación + construcción) | ✅ Implementado |
| `GenerateRedcapDictionaryArtifact` (entry point) | ✅ Implementado |
| `RedcapDictionaryBuilder` | ✅ Implementado |
| `RedcapDictionaryCsvExporter` | ✅ Implementado |
| `ClassificationBlocks` (contenido) | ❌ Todos en `planned` — sin contenido |
| UI del Constructor | ❌ No existe |
| Integración end-to-end (Constructor → REDCap → Parser → EvidenceStore) | ❌ No existe |

### V.3 Prerequisito crítico del Constructor

El Constructor solo puede generar diccionarios REDCap para módulos que tengan `redcapFormField`
definido en su adaptador REDCap. Estado actual:

| Instrumento | redcapFormField en adaptador |
|---|---|
| IBSE | ✅ Completo |
| DUKE-EAS | ✅ Completo (módulo parcial pero registrado) |
| PREDIMED-EAS | ✅ Completo |
| SF-12 EAS | ❌ Sin módulo en registry |
| Sueño EAS | ❌ Sin módulo en registry |
| CAGE EAS | ❌ Sin módulo en registry |

La Biblioteca Metodológica completa (6/6) es prerequisito del Constructor funcional.

---

## VI. Productos documentales

### VI.1 Perfil de Salud Local (Producto 3)

**Naturaleza:** Documento institucional de diagnóstico territorial.

**Origen:** `LocalHealthProfile` (objeto analítico del Nivel 2) compilado por `LocalHealthProfileCompiler`.

**Distinción crítica:**
El PSL es el objeto analítico interno (Nivel 2). El Perfil de Salud Local compilado es el documento exportable.
Son dos objetos distintos: uno vive en el sistema; el otro se entrega a las instituciones.

**Estructura prevista (pendiente de contractualizar):**

El `LocalHealthProfile` tiene 7 capítulos. El Perfil compilado deberá determinar:
- ¿Qué capítulos se exportan íntegramente?
- ¿Qué capítulos se sintetizan?
- ¿Cuál es el formato de exportación (HTML, PDF, DOCX)?
- ¿Cuál es el nivel de detalle técnico vs institucional?

Estas preguntas no están respondidas. `CONTRACT-LOCAL-HEALTH-PROFILE-COMPILER` las debe responder.

### VI.2 NHS Health Profile (Producto 4)

**Naturaleza:** Producto institucional distinto del PSL-C (Producto 3). No es una versión corta ni un formato alternativo del mismo objeto: es un artefacto independiente derivado de la misma base de evidencia, con finalidad, audiencia y estructura propias. Diagnóstico comparativo sintético, sin texto narrativo de análisis.

**Modelo de referencia:** NHS Local Health Profiles (Public Health England).
Características: alta densidad informativa, tipografía como elemento estructural, indicadores comparativos, presentación editorial sobria.

**Inputs adicionales necesarios:** datos de referencia Granada/Andalucía (actualmente "sin referencia disponible" en los 6 paneles). Sin estos datos, el NHS Health Profile tendrá limitaciones comparativas significativas.

### VI.3 Plan Local de Salud (Producto 2)

**Naturaleza:** Documento institucional de planificación. No es el `ActionPlanDraft`. Es el documento definitivo que integra todo el proceso.

**Estado del contrato:** ❌ `CONTRACT-LOCAL-HEALTH-PLAN-DOCUMENT` no existe.

**Preguntas que debe responder el contrato:**
- ¿Qué secciones obligatorias tiene un Plan Local de Salud en el contexto RELAS?
- ¿Cómo se referencia el PSL aprobado dentro del Plan?
- ¿Cómo se presentan las priorizaciones y la deliberación?
- ¿Cómo se integra la traducción estratégica (EPVSA, ESCA, RELAS...)?
- ¿Cuál es la estructura del Plan de Acción dentro del Plan Local?
- ¿Cómo se incluyen la Agenda y el Seguimiento?
- ¿Cuál es el formato de salida (HTML, PDF, DOCX)?
- ¿Existe un Resumen Ejecutivo incorporado o es un producto separado?

Esta pregunta no puede responderse aquí. Requiere deliberación metodológica específica del equipo antes de diseñar el compilador.

### VI.4 Resumen Ejecutivo

**Estado:** ❌ Sin definición. Sin tipo. Sin contrato.

**Preguntas abiertas:**
- ¿Es una sección del Plan Local de Salud o un documento independiente?
- ¿Resume el PSL, el Plan, o ambos?
- ¿Tiene audiencia diferente (política vs técnica)?

No puede diseñarse hasta que `CONTRACT-LOCAL-HEALTH-PLAN-DOCUMENT` defina el Plan completo.

---

## VII. Flujos completos

### Flujo 1 — Producción del Perfil de Salud Local

```
Documentos fuente (health-report, community-asset, redcap-export, complementary-study...)
    │
    ▼
MunicipalDocumentRepository.addDocument()
    │   [canonicidad por kind o tag; sustitución purga átomos previos]
    │
    ▼
[Parser específico por tipo de documento]
    │   [Informe de Salud → HealthReportToEvidencePipeline]
    │   [IBSE → IBSECSVParser → ibseStudyToEvidenceAtoms]
    │   [DUKE → DUKECSVParser → dukeStudyToEvidenceAtoms]
    │   [SF-12 → SF12CSVParser → sf12StudyToEvidenceAtoms]
    │   [... etc.]
    │
    ▼
EvidenceStore.upsertEvidenceAtom()
    │   [deduplicación por stableAssetKey]
    │   [municipalityId siempre correcto (T-5)]
    │
    ▼
IntegrityGuard.sanitize()
    │   [reglas A-E; elimina huérfanos, duplicados, inconsistencias]
    │
    ▼
MIT → EstadoTerritorialEvolutivo
    │   [LT1: clasificación por tipo semántico]
    │   [OIT: áreas de intervención heurísticas]
    │   [dimensión longitudinal, tensiones, marcos aplicados]
    │
    ▼
ReconciliacionEngine → ReconciliacionResult
    │   [filtro de relevancia; criterios de escalado]
    │   [clasifica tensiones: escalada / no-escalada / ruido]
    │
    ▼
buildLocalHealthProfile() → LocalHealthProfile [status: "generated"]
    │   [función pura; no persiste; no llama a localStorage]
    │   [7 capítulos; caps V y VI en scaffold]
    │
    ▼
[Revisión técnica del equipo]
    │   [edita caps V (Conclusiones) y VI (Recomendaciones)]
    │   [documenta deliberación en cap VII]
    │
    ▼
handleValidatePSL() → LocalHealthProfile [status: "validated"]
    │   [persiste en workspace.validatedPSL]
    │   [captura evidenceStoreVersion para detección de staleness]
    │
    ▼
LocalHealthProfileCompiler [SPRINT 2]
    │
    ▼
LocalHealthProfileArtifact  ← PRODUCTO 3
NHSHealthProfileArtifact    ← PRODUCTO 4 (path paralelo desde el mismo PSL validated)
```

### Flujo 2 — Producción del Plan Local de Salud

```
LocalHealthProfile [status: "validated"]
    │
    │   [prerequisito: cap VII con deliberación documentada]
    │   [prerequisito: priorizacionStatus === "complete"]
    │
    ▼
handleApprovePSL() → LocalHealthProfile [status: "approved"]  [SPRINT 2]
    │
    ▼
PrioritizationEngine → PrioritizationResult
    │   [candidaturas técnicas desde PSL.areasDeIntervencion]
    │   [PSL-C1: solo consume PSL, nunca LT1/OIT directamente]
    │
    ▼
Motor de Traducción Estratégica (MTE) [SPRINT 2]
    │   ← StrategicRepository [SPRINT 2]
    │   [PSL validado + Priorizaciones + Repositorio Estratégico]
    │   [produce StrategicDerivationTrace]
    │
    ▼
StrategicTranslationResult [SPRINT 2]
    │
    ▼
ActionPlanEngine → ActionPlanDraft
    │   [borrador técnico; requiresHumanValidation: true]
    │
    ▼
[Revisión y validación técnica del Plan de Acción]
    │
    ▼
AgendaEngine → AgendaDraft
    │   [trimestrización orientativa]
    │
    ▼
MonitoringEngine → MonitoringDraft
    │   [seguimiento inicial; todos pending-validation]
    │
    ▼
LocalHealthPlanCompiler [SPRINT 2 — requiere CONTRACT-LOCAL-HEALTH-PLAN-DOCUMENT]
    │
    ▼
LocalHealthPlanDocument  ← PRODUCTO 2
```

### Flujo 3 — Producción de la Encuesta Municipal

```
Biblioteca Metodológica (MethodologicalRegistry)
    │   [IBSE_MODULE, DUKE_EAS_MODULE, PREDIMED_EAS_MODULE — implementados]
    │   [SF12_MODULE, SUENO_EAS_MODULE, CAGE_EAS_MODULE — PENDIENTES SPRINT 2]
    │
    ▼
Constructor Metodológico (QuestionnaireBuilder) [UI: SPRINT 2]
    │   [selección de módulos metodológicos]
    │   [selección de bloques de clasificación — PENDIENTES SPRINT 2]
    │   [validación de existencia en registry]
    │   [preservación de identidad metodológica de cada módulo]
    │
    ▼
QuestionnaireDefinition (Encuesta Municipal)
    │   [definición metodológica completa]
    │   [no es un formulario REDCap]
    │
    ▼
REDCap Compiler (GenerateRedcapDictionaryArtifact)
    │   [itera items de cada módulo; extrae redcapFormField]
    │   [genera branching logic, calculated fields, metadata]
    │
    ▼
Data Dictionary REDCap (.csv)  ← PRODUCTO 3
    │
    [Administración en REDCap — fuera del sistema]
    │
    ▼
Exportación de resultados REDCap
    │
    ▼ ← HUECO H-2: GeneratedSurveyParser no definido
Parser del cuestionario generado
    │
    ▼
EvidenceStore  [retroalimenta Flujo 1]
```

---

## VIII. Contratos

### VIII.1 Contratos vigentes

| Contrato | Estado | Sprint de origen |
|---|---|---|
| CONTRACT-REPOSITORY | VIGENTE | Sprint 0 |
| CONTRACT-PERSISTENCE | VIGENTE | Sprint 0 |
| CONTRACT-EVIDENCE | VIGENTE | Sprint 0 |
| CONTRACT-COMPLEMENTARY-STUDIES | VIGENTE (con §9a) | Sprint 0 |
| CONTRACT-SCALE-PANELS v1.1 | VIGENTE | Sprint 1 |
| CONTRACT-EVIDENCE-QUALITY | VIGENTE | Sprint 1 |
| CONTRACT-INTERPRETATION | VIGENTE | Sprint 0 |
| CONTRACT-MIT-PSL | VIGENTE | Sprint 0 |
| CONTRACT-ACTION-PLAN | VIGENTE | Sprint 0 |
| CONTRACT-COMPILER | VIGENTE (reserva arquitectónica) | Sprint 0 |
| CONTRACT-INDEX | VIGENTE | Sprint 1 |

### VIII.2 Contratos conceptuales (diseñados, sin implementación)

| Contrato | Estado | Activa en |
|---|---|---|
| CONTRACT-DYNAMIC-TRIPYRAMID | VIGENTE | Producto 2 — Motor implementado 2026-06-29 |
| CONTRACT-STRATEGIC-REPOSITORY | CONCEPTUAL | Sprint 2 |
| CONTRACT-STRATEGIC-TRANSLATION | CONCEPTUAL | Sprint 2 |
| CONTRACT-TERRITORIAL-STRUCTURAL-INFERENCE | FUTURO | Sprint 3+ |

### VIII.3 Contratos pendientes de crear (sin ellos no se puede implementar)

| Contrato | Bloqueado por su ausencia | Sprint objetivo |
|---|---|---|
| **CONTRACT-LOCAL-HEALTH-PLAN-DOCUMENT** | `LocalHealthPlanCompiler` | Sprint 2 — primera mitad |
| **CONTRACT-LOCAL-HEALTH-PROFILE-COMPILER** | `LocalHealthProfileCompiler` | Sprint 2 |
| **CONTRACT-NHS-HEALTH-PROFILE-COMPILER** | `NHSHealthProfileCompiler` | Sprint 2 |
| **CONTRACT-MUNICIPAL-SURVEY** | Define qué hace válida una Encuesta Municipal | Sprint 2 |
| **CONTRACT-STRATEGIC-RESOURCE** | Data contract del recurso individual del Repository | Sprint 2 |
| **CONTRACT-REDCAP-VISUAL-TEMPLATE** | `REDCapCompiler` Nivel 2 (institucional COMPÁS); sin él solo se genera Nivel 1 funcional mínimo | Sprint 2 |

`CONTRACT-REDCAP-VISUAL-TEMPLATE` es un contrato **independiente** del contrato estructural
del compilador. Define la capa visual (Capa 3) del REDCapCompiler: plantillas HTML para portada,
encabezados de bloque, tarjetas de pregunta, notas metodológicas, separadores y tarjetas de
resultado. No contiene decisiones metodológicas. Puede evolucionar sin afectar a variables,
branching logic ni scoring. Ver `INSTITUTIONAL-PRODUCTS-ARCHITECTURE.md §6.6 y §7/P-6`.

---

## IX. Huecos descubiertos

Los siguientes huecos arquitectónicos han emergido al intentar cerrar el plano completo.
Son más valiosos que cualquier implementación prematura: un hueco conocido es una deuda gestionable;
un hueco desconocido es un riesgo activo.

### H-1 — El Plan Local de Salud no tiene contenido metodológicamente definido

El `LocalHealthPlanCompiler` no puede diseñarse sin saber qué debe compilar.
La estructura del Plan Local de Salud en el contexto RELAS/ESCA no está fijada.

**Impacto:** Bloquea el diseño de LocalHealthPlanCompiler.
**Acción necesaria:** Deliberación metodológica del equipo → CONTRACT-LOCAL-HEALTH-PLAN-DOCUMENT.

### H-2 — El circuito Survey→EvidenceStore no está cerrado

El Constructor produce un Data Dictionary REDCap. REDCap administra el cuestionario.
Cuando los resultados vuelven como exportación CSV, no existe un parser específico para
el cuestionario generado. El circuito metodológico completo (definir → capturar → analizar)
no está cerrado en la arquitectura.

**Impacto:** La Encuesta Municipal no alimenta el EvidenceStore sin un parser generado o genérico.
**Acción necesaria:** Diseñar el mecanismo de "parser del cuestionario generado". Puede ser:
  - Un parser genérico que lee la QuestionnaireDefinition como esquema.
  - Un parser específico generado por el Constructor como artefacto adicional.

Esta decisión tiene implicaciones significativas para la arquitectura del Constructor.

### H-3 — StrategicFrameworkRegistry y StrategicRepository son arquitectónicamente ambiguos

El Registry es inmutable, en código. El Repository será gestionable. ¿Qué ocurre con
los elementos del Registry cuando el Repository se implemente? ¿El Registry es el estado
inicial del Repository, o ambos coexisten con roles distintos?

**Impacto:** El MTE debe consumir una sola fuente. Si consume el Registry hoy y el Repository mañana,
hay un punto de ruptura en la arquitectura.
**Acción necesaria:** CONTRACT-STRATEGIC-REPOSITORY debe resolver explícitamente la relación
Registry ↔ Repository antes de implementar el MTE.

### H-4 — El MTE canónico no tiene algoritmo para marcos no-EPVSA

El EPVSATranslator maneja exclusivamente EPVSA (LE1–LE4) mediante inferencia por palabras clave.
El MTE canónico debe manejar ESCA, RELAS, EBE, PSMA, PEM además de EPVSA.
El algoritmo de alineación de priorizaciones con marcos distintos al EPVSA no está definido.

**Impacto:** El MTE real es un componente metodológicamente más complejo que el EPVSATranslator actual.
**Acción necesaria:** CONTRACT-STRATEGIC-TRANSLATION debe especificar el algoritmo o las heurísticas
para cada marco antes de implementar el MTE.

### H-5 — PSMA ausente del StrategicFrameworkRegistry

El CONTRACT-STRATEGIC-REPOSITORY lista PSMA (Plan de Salud Mental de Andalucía) como recurso canónico.
El StrategicFrameworkRegistry no incluye PSMA. PEM ≈ MAYORES pero no son idénticos.

**Impacto:** Menor mientras el Registry sea solo referencia. Relevante cuando el MTE opere sobre él.
**Acción necesaria:** Completar el Registry con PSMA antes de que el MTE lo consuma.

### H-6 — El actor model del PSL `approved` no está definido

¿Quién puede marcar un PSL como aprobado? El contrato dice "aprobado institucionalmente"
y que requiere cap VII completo. Pero no define:
- ¿Es el mismo actor que valida (`validatedBy`)?
- ¿Hay un actor institucional distinto del técnico?
- ¿Requiere alguna firma, acta o registro externo al sistema?

**Impacto:** El handler `handleApprovePSL` no puede diseñarse sin resolver este punto.
**Acción necesaria:** CONTRACT-MIT-PSL debe especificar el actor model del estado `approved`.

### H-7 — El Resumen Ejecutivo no tiene definición ni lugar

El Resumen Ejecutivo fue identificado como producto deseable. No existe como tipo, contrato
ni componente. No está claro si es parte del Plan Local de Salud o un documento independiente.

**Impacto:** No puede diseñarse hasta resolver H-1 (estructura del Plan).
**Acción necesaria:** CONTRACT-LOCAL-HEALTH-PLAN-DOCUMENT debe resolver si el Resumen Ejecutivo
es una sección del Plan o un artefacto separado.

### H-8 — El ciclo de evidencia longitudinal no está definido como flujo completo

`EstadoTerritorialEvolutivo` incluye dimensión longitudinal. El MonitoringDraft rastrea
items de la agenda. Pero no existe un mecanismo para que el seguimiento de un Plan ejecutado
retroalimente el EvidenceStore como evidencia longitudinal del siguiente ciclo.

**Impacto:** El sistema no cierra el ciclo RELAS (planificar → ejecutar → evaluar → planificar).
**Acción necesaria:** Diseñar el mecanismo de retroalimentación longitudinal antes del Sprint 3.

---

## X. Mapa de sprints

### Sprint 0 — CERTIFICADO

Nivel 1 completo. Pipeline E2E funcional. Gate 1 superado. 309/309 tests.

### Sprint 1 — CERTIFICADO CON CONDICIONES

Corrección IBSE. 6 contratos nuevos. Consolidación visual. Deuda §9a documentada.

### Sprint 2 — Prerequisitos y bloques objetivos

**Prerequisitos (deben completarse antes de iniciar otros bloques):**

1. Biblioteca Metodológica 6/6 (SF-12, Sueño, CAGE con MethodologicalModule)
2. OPERATING-CONSTITUTION §4 actualizado
3. CONTRACT-LOCAL-HEALTH-PLAN-DOCUMENT creado y aprobado
4. Gate 2 definido en OPERATING-CONSTITUTION

**Bloques de Sprint 2 (ordenados por dependencias):**

```
[P1] Biblioteca Metodológica 6/6
    │
    ├──► [B1] ClassificationBlocks (eas-sociodemographic, eas-household, ine-demography...)
    │        │
    │        └──► [B2] Constructor Metodológico (UI)
    │                  │
    │                  └──► [B3] REDCap Compiler (integración completa)
    │                            │
    │                            └──► [H2] Resolver circuito Survey→EvidenceStore
    │
    ├──► [B4] LocalHealthProfileCompiler
    │        (CONTRACT-LOCAL-HEALTH-PROFILE-COMPILER)
    │
    ├──► [B5] NHSHealthProfileCompiler
    │        (CONTRACT-NHS-HEALTH-PROFILE-COMPILER + referencias Granada/Andalucía)
    │
    └──► [B6] Portada institucional
    
[P3] CONTRACT-LOCAL-HEALTH-PLAN-DOCUMENT
    │
    └──► [B7] PSL transición `approved` (handleApprovePSL + actor model)
              │
              ├──► [B8] StrategicRepository
              │         (CONTRACT-STRATEGIC-REPOSITORY implementado)
              │         Resolver H-3 (Registry ↔ Repository)
              │
              └──► [B9] Motor de Traducción Estratégica (MTE)
                        (CONTRACT-STRATEGIC-TRANSLATION implementado)
                        Resolver H-4 (algoritmo para marcos no-EPVSA)
                        Requiere B8 completo
                        │
                        └──► [B10] LocalHealthPlanCompiler
                                   Requiere: B7 + B9 + CONTRACT-LOCAL-HEALTH-PLAN-DOCUMENT
```

**Independiente de los anteriores:**
- [B11] OPERATING-CONSTITUTION §4 actualizado
- [B12] Gate 2 definido en OPERATING-CONSTITUTION
- [B13] Catálogo temático ampliado (Activos, Entornos, Participación)

### Sprint 3 — Bloques identificados (sin diseño todavía)

- Agenda inteligente (depende del MTE completo)
- Seguimiento inteligente (depende de Agenda inteligente)
- Ciclo de evidencia longitudinal (Hueco H-8)
- Resumen Ejecutivo (depende de CONTRACT-LOCAL-HEALTH-PLAN-DOCUMENT)
- Tripirámide visual / visualización SAM (motor SAM implementado en Producto 2; Tripirámide UI pendiente)
- Cuadros de mando (sin definición; no diseñar antes de conocer los productos documentales)

### Investigación futura (no antes de Sprint 3)

- Inteligencia Territorial Explicable (CONTRACT-TERRITORIAL-STRUCTURAL-INFERENCE)
- Hipótesis estructurales sobre determinantes territoriales
- Inferencia causal asistida

---

## XI. Principios del blueprint

Este plano debe respetarse con los mismos principios que la Constitución Arquitectónica:

1. **Un componente, un propósito.** Los compiladores exportan; los motores transforman; los repositorios almacenan. No mezclar roles.

2. **Los huecos son prioritarios sobre los bloques.** Resolver H-1 antes de implementar LocalHealthPlanCompiler. Resolver H-2 antes de dar el Constructor por completo. Resolver H-3 antes de implementar el MTE.

3. **Ningún contrato de compilador antes de que su artefacto esté metodológicamente definido.** El LocalHealthPlanCompiler no puede diseñarse sin saber qué compila.

4. **El ciclo de evidencia longitudinal (H-8) debe diseñarse antes de que el Seguimiento inteligente exista.** Sin ello, el sistema no cierra el ciclo RELAS.

5. **La Biblioteca Metodológica es el prerequisito más urgente.** Todo lo demás del Sprint 2 depende parcial o totalmente de ella.

---

*Este blueprint es el plano maestro de COMPÁS NG. No implementa nada.
Todo prompt de implementación futuro debe poder ubicarse en este plano antes de ejecutarse.
Si un componente propuesto no aparece aquí, debe añadirse al plano antes de implementarse.*
