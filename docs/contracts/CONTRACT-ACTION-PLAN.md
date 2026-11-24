# COMPÁS NG — Contrato del Nivel 3: Priorización, Traducción Estratégica y Plan de Acción

> Documento normativo permanente.
> Define el comportamiento garantizado, los invariantes y los límites del
> bloque de decisión del Nivel 3 en COMPÁS NG: Priorización técnica,
> Motor de Traducción Estratégica, Plan de Acción, Agenda tipo y Seguimiento.
> No debe modificarse sin revisión explícita y deliberada.
> Última revisión: 2026-06-24
> Estado operativo: **LEGACY** desde PA-RELAS-01. Sus motores permanecen en
> código por compatibilidad, pero ya no constituyen la ruta visible del Plan de
> Acción. La cadena vigente se define en `CONTRACT-DELIBERATIVE-PRIORITISATION.md`.
>
> Doctrina vigente sobre actuaciones (2026-10-19, CONTRACT-LOCAL-HEALTH-PLAN-DOCUMENT
> §3.1 bis): el Plan de Acción comprende líneas estratégicas, objetivos e
> indicadores; las actuaciones y las agendas anuales son un instrumento separado
> (CONTRACT-AGENDA-ACTUATIONS). Lo que este contrato dice de `ActionPlanAction`
> describe el motor legado y no define qué contiene el Plan de Acción.

---

## 1. Propósito

Este contrato establece el comportamiento del **Nivel 3** de COMPÁS NG: el
conjunto de motores que transforman el Perfil de Salud Local (PSL) validado
en propuestas técnicas estructuradas que el equipo de salud pública puede
revisar, ajustar y validar antes de formalizarlas institucionalmente.

El Nivel 3 no toma decisiones. Genera borradores técnicos. Toda propuesta
del Nivel 3 requiere validación humana explícita antes de poder constituir
un compromiso institucional o una actuación municipal.

---

## 2. Alcance

Este contrato regula los siguientes objetos y motores:

| Motor / Objeto | Entrada | Salida |
|---|---|---|
| `PrioritizationEngine` | `LocalHealthProfile` | `PrioritizationResult` |
| `StrategicTranslationEngine` (`EPVSATranslator` en código actual) | `PrioritizationResult` | `StrategicTranslationResult` (`EPVSATranslationResult` en código actual) |
| `ActionPlanEngine` | `StrategicTranslationResult` + frameworks + `LocalHealthProfile` | `ActionPlanDraft` |
| `AgendaEngine` | `ActionPlanDraft` | `AgendaDraft` |
| `MonitoringEngine` | `AgendaDraft` | `MonitoringDraft` |

Los stages `evaluation` y `compiler` están declarados en `PipelineStage`
pero **no tienen implementación activa en el runtime**. No generan ningún
output en la ejecución actual y quedan fuera del alcance operativo de este
contrato (véase §14).

---

## 3. Posición en el pipeline

```
EvidenceStore (saneado por IntegrityGuard)
    └─▶ MIT → EstadoTerritorialEvolutivo
            └─▶ ReconciliacionInterpretativa
                    └─▶ PSL (LocalHealthProfile)  ←── único puente autorizado
                            │
                    ┌───────┴────────────────────────────────────┐
                    │               NIVEL 3                      │
                    ▼                                            │
            PrioritizationEngine                                 │
                    │                                            │
                    ▼                                            │
            StrategicTranslationEngine                           │
                    │                                            │
                    ▼                                            │
            ActionPlanEngine ◄── PSL (PSLReference) ────────────┘
                    │
                    ▼
            AgendaEngine
                    │
                    ▼
            MonitoringEngine
```

**Regla PSL-C1 (obligatoria en todo el Nivel 3):** ningún motor del Nivel 3
puede consumir directamente `LT1Result`, `OITResult`, `EstadoTerritorialEvolutivo`
ni `ReconciliacionResult`. La única fuente autorizada es el PSL.

---

## 4. Trazabilidad de la cadena completa

La trazabilidad de cada elemento del Nivel 3 puede rastrearse hasta su origen
de evidencia mediante la cadena siguiente:

```
MonitoringItem.agendaItemId
    └─▶ AgendaItemDraft.linkedActionId
            └─▶ ActionPlanAction.linkedObjectiveId
                    └─▶ ActionPlanObjective.linkedStrategicLine  (EPVSA)
                            └─▶ StrategicLineSuggestion.candidatePriorityId
                                    └─▶ CandidatePriority.sourceAreaId
                                            └─▶ PSLAreaIntervencion.id
                                                    └─▶ relatedEvidenceIds[]
                                                            └─▶ EvidenceAtom.id
                                                                    └─▶ provenance.documentId
                                                                            └─▶ MunicipalDocument
```

Esta cadena es **completa y verificable**. Ningún objeto del Nivel 3 puede
existir sin un origen trazable en el EvidenceStore a través del PSL.

---

## 5. Entradas del Nivel 3

### 5.1 PSL como puente obligatorio

El `LocalHealthProfile` es la única entrada autorizada para iniciar el Nivel 3.
El motor de Priorización consume `psl.areasDeIntervencion` directamente.
El motor de Plan de Acción recibe adicionalmente una `PSLReference` (snapshot
ligero del estado del PSL en el momento de generación del plan).

### 5.2 Marcos estratégicos

Los marcos interpretativos del registro (`StrategicFrameworkRegistry`) son
consultados por el motor de Plan de Acción para construir `FrameworkAlignment`.
Los marcos actuales registrados son: EPVSA, ESCA, MAYORES, BUENA_EDAD, RELAS.

**Regla MTE-1 — EPVSA no es el único marco estratégico.** La EPVSA es un marco central, pero no exclusivo. El Motor de Traducción Estratégica debe considerar de forma explícita otros marcos oficiales pertinentes, incluyendo al menos ESCA y el Plan Estratégico Integral para Personas Mayores de Andalucía 2020–2023 y sus documentos asociados, cuando el PSL contenga hallazgos relacionados con salud comunitaria, activos, participación, intersectorialidad, envejecimiento, fragilidad, autonomía, soledad no deseada o participación social.

**Regla MTE-2 — Registro de marcos estratégicos.** Los marcos estratégicos deben tratarse como un registro versionado y consultable (`StrategicFrameworkRegistry`), no como lógica rígida codificada en el motor. Cada marco debe poder declarar líneas, objetivos, indicadores, palabras clave, poblaciones diana, determinantes relacionados, vigencia, fuente documental y cautelas de uso.

**Regla MTE-3 — Traducción sin decisión automática.** El Motor de Traducción Estratégica propone alineaciones entre áreas del PSL y marcos oficiales. No selecciona prioridades, no aprueba líneas, no impone objetivos ni activa indicadores sin deliberación humana.



### StrategicFrameworkRegistry (contrato conceptual)

El `StrategicFrameworkRegistry` constituye el catálogo versionado de marcos
estratégicos utilizados por el Motor de Traducción Estratégica.

Cada marco registrado deberá poder declarar, como mínimo:

- identificador único;
- nombre oficial;
- versión y vigencia;
- documento(s) fuente;
- líneas estratégicas;
- objetivos;
- indicadores;
- poblaciones diana;
- determinantes relacionados;
- palabras clave o conceptos asociados;
- cautelas metodológicas.

El registro es una infraestructura de conocimiento y no implica que todos sus
elementos se apliquen automáticamente a cada Perfil de Salud Local.


Estos marcos son **guías de lectura institucional**, no motores computacionales.
Su inclusión en el plan es orientativa y requiere revisión técnica antes de
cualquier formalización.

---

## 6. Priorización técnica (`PrioritizationEngine`)

### 6.1 Propósito

Transforma las áreas de intervención territorial del PSL en candidaturas a
priorización. Una candidatura es una propuesta del sistema para que el equipo
técnico considere, valide o descarte.

### 6.2 Reglas de generación

- Una candidata por área de intervención territorial (`PSLAreaIntervencion`).
- El título de la candidata es el título del área.
- El `sourceAreaId` preserva el enlace con el área del PSL de origen.
- El `rationale` indica que la candidata deriva de un área de intervención
  territorial del PSL y debe revisarse técnicamente.
- Los `cautions` se heredan de `area.cautions`.
- Los `relatedEvidenceIds` se heredan de `area.relatedEvidenceIds`.

### 6.3 Criterios de revisión expuestos al equipo

El motor proporciona cuatro criterios orientativos para que el equipo los
aplique al revisar las candidaturas:

1. Magnitud o relevancia territorial sugerida por la evidencia.
2. Posibilidad de intervención desde el ámbito local.
3. Existencia de activos comunitarios o capacidades institucionales relacionadas.
4. Necesidad de validación técnica, política y comunitaria antes de decidir.

Estos criterios no ponderan automáticamente las candidatas ni las ordenan
por importancia. Son orientaciones para la deliberación humana.

### 6.4 Lo que la Priorización no hace

- No ordena las candidatas por prioridad.
- No descarta ninguna candidata automáticamente.
- No traduce las candidatas a líneas estratégicas EPVSA.
- No constituye la priorización formal del municipio.
- No sustituye el proceso participativo con la ciudadanía.

---

## 7. Motor de Traducción Estratégica (`StrategicTranslationEngine`; `EPVSATranslator` en código actual)

### 7.1 Propósito

Sugiere, de forma prudente, una línea estratégica de la EPVSA 2024–2030 para
cada candidata de priorización. El resultado es una sugerencia de encaje, no
una asignación definitiva.

### 7.2 Líneas estratégicas disponibles

| Código | Nombre |
|---|---|
| `LE1` | Acción local en salud y comunidad |
| `LE2` | Entornos y estilos de vida saludables |
| `LE3` | Equidad, determinantes sociales y vulnerabilidades |
| `LE4` | Gobernanza, evaluación y conocimiento para la salud |
| `pending-review` | Pendiente de revisión técnica (fallback) |

### 7.3 Mecanismo de inferencia: heurística de palabras clave

La inferencia opera sobre una concatenación del `title` y el `rationale` de
cada candidata, normalizada a minúsculas. Las palabras clave de cada línea son:

| Línea | Palabras clave activadoras (extracto) |
|---|---|
| LE1 | activo, comunitario, participación, ciudadanía, red |
| LE2 | alimenta, actividad física, bienestar emocional, salud mental, consumo, entorno, estilo de vida, hábito |
| LE3 | determinante, desigualdad, vulnerabilidad, renta, empleo, vivienda |
| LE4 | indicador, evaluación, seguimiento, cautela, metodológica |

Si ninguna palabra clave activa una línea, la candidata recibe `pending-review`.

**Esta heurística es textual, no semántica.** Una candidata puede recibir una
línea incorrecta si su texto no contiene las palabras clave pertinentes. La
asignación final debe revisarse técnicamente e institucionalmente por el equipo.

### 7.4 Cautelas del motor EPVSA

El motor produce cuatro cautelas generales invariables:

1. La traducción EPVSA es orientativa y no sustituye deliberación técnica,
   institucional ni comunitaria.
2. Una misma prioridad puede relacionarse con más de una línea estratégica.
3. No debe usarse esta traducción como selección automática de líneas EPVSA.
4. La asignación final debe revisar políticas autonómicas, competencias locales,
   activos disponibles y factibilidad.

### 7.5 Lo que la traducción EPVSA no hace

- No valida que la candidata sea coherente con la línea asignada.
- No comprueba si el municipio tiene competencia sobre la línea asignada.
- No establece que la línea asignada sea la única relevante.
- No sustituye el conocimiento institucional del equipo técnico.

---

## 8. Plan de Acción (`ActionPlanEngine`)

### 8.1 Propósito

Transforma el resultado de la traducción EPVSA en un borrador inicial de
Plan de Acción con objetivos, actuaciones e indicadores preliminares, todos
trazables al PSL de origen mediante `PSLReference`.

### 8.2 `PSLReference`: trazabilidad al PSL de origen

`PSLReference` es un snapshot ligero del estado del PSL en el momento de
generación del plan. Contiene:

| Campo | Descripción |
|---|---|
| `pslId` | ID del PSL que originó el plan |
| `status` | Estado del PSL en el momento de generación |
| `generatedAt` | Fecha de generación del PSL |
| `validatedAt` | Fecha de validación técnica, si existe |
| `validatedBy` | Perfil técnico que validó, si existe |
| `isStale` | `true` si la evidencia cambió tras la validación |

`PSLReference` responde a: ¿Con qué PSL se generó este plan? ¿Estaba
validado? ¿Quién lo validó? ¿Sigue vigente?

### 8.3 Estructura del Plan de Acción

**Objetivos (`ActionPlanObjective`)**

Un objetivo por sugerencia EPVSA. Campos:
- `id`: identificador único.
- `title`: "Objetivo N: abordar {candidateTitle}".
- `linkedStrategicLine`: etiqueta de la línea EPVSA asignada.
- `rationale`: justificación preliminar del objetivo.
- `frameworkAlignments`: encajes con marcos estratégicos (véase §8.4).

**Actuaciones (`ActionPlanAction`)**

Una actuación por objetivo. Campos:
- `id`: identificador único.
- `title`: descripción de la actuación propuesta.
- `description`: instrucción de diseño local de la actuación.
- `linkedObjectiveId`: ID del objetivo al que pertenece.
- `relatedEvidenceIds`: IDs de evidencias relacionadas (heredados de la candidata).
- `cautions`: cautelas metodológicas (heredadas de la sugerencia EPVSA).
- `frameworkAlignments`: encajes con marcos estratégicos.

**Indicadores preliminares (`ActionPlanIndicator`)**

Tres indicadores por actuación, de tipo distinto:
- `process`: actividades, sesiones, productos generados.
- `output`: población, colectivos o recursos alcanzados.
- `outcome`: cambios esperados observables sin causalidad automática.

Cada indicador lleva `linkedActionId` para mantener la trazabilidad hacia la
actuación que lo generó.

### 8.4 `FrameworkAlignment`: encaje con marcos estratégicos

Los `frameworkAlignments` de objetivos y actuaciones documentan posibles
encajes con los marcos registrados en `StrategicFrameworkRegistry`.

**Encaje directo** (`alignmentType: "direct"`): la línea EPVSA asignada tiene
un elemento registrado en el registro (p. ej., `EPVSA-LE2`). Se vincula
directamente con ese elemento.

**Encaje temático** (`alignmentType: "thematic"`): para marcos distintos
de EPVSA (ESCA, MAYORES, BUENA_EDAD, RELAS), se busca por palabras clave
de la línea EPVSA en los textos de los elementos de los otros marcos. Solo
se evalúan niveles `"line"`, `"program"` y `"objective"`.

Cada `FrameworkAlignment` incluye:
- `frameworkId`, `elementId`, `elementLabel`, `level`.
- `alignmentType`: `"direct"` o `"thematic"`.
- `relevanceNote`: descripción del tipo de encaje.
- `sourceTrace`: procedencia del elemento en el marco.
- `indicators`: indicadores del marco asociados al elemento.

Los encajes temáticos son **orientativos**. Requieren revisión técnica antes
de incorporarlos al plan formal. La `relevanceNote` de los encajes temáticos
lo indica explícitamente.

### 8.5 Cautelas fijas del Plan de Acción

El motor incorpora invariablemente las siguientes cautelas:

1. Este plan es un borrador técnico inicial y no sustituye aprobación
   institucional.
2. Las acciones deben revisarse con responsables municipales, ciudadanía y
   profesionales.
3. Los indicadores son preliminares y deben concretarse con fuentes, línea
   base, periodicidad y responsables.
4. No se genera agenda anual hasta que las acciones hayan sido validadas.
5. Los encajes estratégicos con múltiples marcos son orientativos y requieren
   revisión técnica e institucional (solo si hay frameworks registrados).

### 8.6 Lo que el Plan de Acción no hace

- No formaliza compromisos ejecutivos.
- No asigna responsables concretos ni calendarios reales.
- No aprueba el Plan Local de Salud del municipio.
- No valida que las actuaciones sean factibles con los recursos disponibles.
- No vincula el plan a partidas presupuestarias.

---

## 9. Agenda tipo (`AgendaEngine`)

### 9.1 Propósito

Transforma el Plan de Acción en un borrador de agenda anual con distribución
trimestral orientativa. Es el primer paso para convertir actuaciones validadas
en compromisos calendarizados.

### 9.2 Estructura

**`AgendaDraft`**
- `title`: "Borrador inicial de agenda anual".
- `annualItems`: uno por actuación del Plan de Acción.
- `cautions`: cuatro cautelas fijas (véase §9.4).
- `requiresHumanValidation: true`.

**`AgendaItemDraft`**
- `id`: identificador único.
- `title`: "Programar {action.title}".
- `linkedActionId`: ID de la actuación que origina el ítem.
- `suggestedQuarter`: distribución trimestral por posición (`Q1`–`Q4`, rotatoria).
- `responsibleProfile`: "Responsable municipal de salud / equipo técnico local".
- `description`: instrucción de concreción del ítem.
- `cautions`: heredadas de la actuación de origen.
- `requiresHumanValidation: true`.

### 9.3 Distribución trimestral

La distribución trimestral se asigna de forma rotatoria según la posición de
la actuación en el plan (posición 1 → Q1, 2 → Q2, 3 → Q3, 4 → Q4, 5 → Q1, …).
No refleja análisis de viabilidad ni ciclos municipales reales. Debe ajustarse
con el equipo antes de cualquier uso operativo.

### 9.4 Cautelas fijas de la Agenda

1. La agenda es una propuesta inicial y no implica compromiso ejecutivo.
2. Cada actuación debe asignar responsables reales, calendario, recursos y
   condiciones de ejecución.
3. No se activa seguimiento ni evaluación hasta que la agenda esté validada.
4. La distribución trimestral es orientativa y debe ajustarse a ciclos
   municipales y disponibilidad comunitaria.

### 9.5 Lo que la Agenda no hace

- No genera un calendario oficial del municipio.
- No asigna recursos económicos ni humanos concretos.
- No activa el seguimiento automáticamente.
- No constituye un compromiso ejecutivo del equipo.

---

## 10. Seguimiento (`MonitoringEngine`)

### 10.1 Propósito

Transforma la Agenda en un borrador inicial de seguimiento. Registra cada
ítem de agenda como una unidad de seguimiento con estado inicial
`"pending-validation"`, los campos requeridos para comenzar la ejecución
real y notas de separación entre planificación y ejecución.

### 10.2 Estructura

**`MonitoringDraft`**
- `title`: "Seguimiento inicial de actuaciones".
- `trackedItems`: uno por ítem de la Agenda.
- `cautions`: tres cautelas fijas (véase §10.4).
- `requiresHumanValidation: true`.

**`MonitoringItem`**
- `id`: identificador único.
- `agendaItemId`: ID del ítem de agenda que origina el seguimiento.
- `title`: título del ítem de agenda.
- `status`: siempre `"pending-validation"` en el borrador inicial.
- `requiredFields`: lista de campos que el equipo debe completar antes de
  registrar actividad real:
  - Fecha de inicio
  - Responsable definitivo
  - Estado de ejecución
  - Observaciones
  - Indicadores asociados
- `notes`: dos notas invariables sobre separación planificación/ejecución.
- `requiresHumanValidation: true`.

### 10.3 Estados posibles de un ítem de seguimiento

| Estado | Significado |
|---|---|
| `pending-validation` | Estado inicial. No hay ejecución registrada |
| `planned` | Planificado con responsables y calendario asignados |
| `in-progress` | En ejecución activa |
| `completed` | Completado y cerrado |

Los estados distintos de `pending-validation` requieren intervención humana
explícita. El sistema no avanza el estado de un ítem automáticamente.

### 10.4 Cautelas fijas del Seguimiento

1. El seguimiento no implica evaluación de resultados.
2. Debe existir una agenda validada antes de registrar actividad.
3. Los cambios de estado requieren intervención humana.

### 10.5 Lo que el Seguimiento no es

- No es un sistema de gestión de proyectos.
- No evalúa el impacto de las actuaciones sobre los indicadores de salud.
- No registra automáticamente ejecución real.
- No constituye evidencia de resultados de salud.
- No sustituye la evaluación técnica y epidemiológica del proceso.

---

## 11. Comportamiento del Nivel 3 con pipeline vacío

Cuando el `EvidenceStore` está vacío (ningún documento ha generado átomos),
el Nivel 3 produce igualmente sus objetos de salida. Todos los motores ejecutan
con la misma lógica que con evidencia real.

Esta situación se señala en la interfaz mediante avisos específicos:

> «Este borrador de Plan de Acción ha sido generado sobre un pipeline sin
> evidencia. Los objetivos y actuaciones mostrados no representan
> intervenciones reales.»

Los objetos producidos sobre pipeline vacío **no representan actuaciones,
prioridades ni compromisos reales**. No deben utilizarse como base de
planificación hasta que el repositorio contenga evidencia verificable.

El pipeline detecta esta situación mediante el campo `isEmpty` y lo
comunica explícitamente en la interfaz de cada panel del Nivel 3.

---

## 12. Validación humana en el Nivel 3

Todos los objetos del Nivel 3 llevan `requiresHumanValidation: true` como
campo tipado. Esta propiedad es un invariante: el sistema no produce ningún
objeto del Nivel 3 que se presente como automáticamente válido.

Las acciones de validación humana que se esperan antes de formalizar el
Nivel 3 son:

| Objeto | Acción humana requerida |
|---|---|
| `PrioritizationResult` | El equipo revisa, descarta y ordena candidatas |
| `StrategicTranslationResult` | El equipo verifica el encaje con los marcos estratégicos y ajusta líneas, objetivos e indicadores |
| `ActionPlanDraft` | El equipo revisa objetivos, actuaciones e indicadores; asigna responsables y recursos |
| `AgendaDraft` | El equipo asigna calendarios reales, responsables concretos y condiciones de ejecución |
| `MonitoringDraft` | El equipo rellena los campos requeridos y avanza el estado de cada ítem |

---

## 13. Invariantes

**I-N3-1 — PSL-C1: el Nivel 3 solo consume el PSL**

Ningún motor del Nivel 3 recibe directamente `LT1Result`, `OITResult`,
`EstadoTerritorialEvolutivo` ni `ReconciliacionResult`. La única fuente
autorizada del Nivel 2 para el Nivel 3 es el `LocalHealthProfile`. Si un
motor nuevo necesita información del Nivel 2, debe acceder a ella a través
del PSL o proponer que el PSL incorpore el campo necesario.

**I-N3-2 — `requiresHumanValidation: true` en todos los outputs**

Ningún motor del Nivel 3 produce objetos sin este campo fijado a `true`.
Es un invariante tipado: el sistema no puede generar propuestas que se
presenten como automáticamente validadas.

**I-N3-3 — Los indicadores son preliminares, no compromisos**

Los `ActionPlanIndicator` generados por el motor son scaffolds de medición.
No tienen fuente de datos asignada, ni línea base, ni periodicidad, ni
responsable. Requieren concreción humana antes de poder usarse en evaluación.

**I-N3-4 — La heurística EPVSA no es determinista por semántica**

La línea EPVSA asignada a una candidata depende exclusivamente de las palabras
clave presentes en el texto de la candidata. No evalúa la coherencia técnica
de la asignación. Dos candidatas semánticamente equivalentes pueden recibir
líneas distintas si su redacción difiere.

**I-N3-5 — La Agenda no activa ejecución**

La existencia de un `AgendaDraft` no activa ningún proceso de ejecución real.
No genera notificaciones, no asigna tareas en sistemas externos y no modifica
el estado del municipio más allá del borrador en el workspace.

**I-N3-6 — El Seguimiento no es evaluación de impacto**

`MonitoringDraft` es un andamiaje de seguimiento. No mide resultados de salud,
no evalúa si las actuaciones han tenido efecto y no compara indicadores antes y
después de la intervención. La evaluación de impacto es una actividad posterior
y externa al sistema actual.

**I-N3-7 — `pslIsStale` se propaga al Plan de Acción**

Si el PSL que originó el plan ha quedado desactualizado por nueva evidencia,
`pslReference.isStale === true`. El motor de Plan de Acción lo propaga
explícitamente al objeto `ActionPlanDraft`. La interfaz lo señala con un
aviso visible. El plan se considera basado en información posiblemente
desactualizada hasta que el equipo regenere y revalide el PSL.

**I-N3-8 — Los encajes temáticos son orientativos y no causales**

Los `FrameworkAlignment` de tipo `"thematic"` detectan posibles relaciones
entre la línea EPVSA y elementos de otros marcos (ESCA, RELAS, etc.) mediante
búsqueda de palabras clave. Esta relación no implica que el municipio deba
alinearse con ese marco ni que el marco sea relevante para la actuación.

---

## 14. Stages declarados sin implementación activa

Los stages `evaluation` y `compiler` están declarados en el tipo
`PipelineStage` (`domain/pipeline/CompasPipeline.ts`) y en la tabla de
etiquetas del `PipelineTracePanel` con las descripciones "Evaluación" y
"Compilador" respectivamente. Sin embargo:

- **No hay motor ni función que los ejecute** en `MunicipalityRuntime`.
- **No generan ningún output** en el pipeline actual.
- **No aparecen en la traza de ejecución** del pipeline en tiempo de ejecución.

Estos stages están reservados para capacidades futuras:

- **`evaluation`**: evaluación de impacto de las actuaciones sobre indicadores
  de salud. Requiere un diseño específico de evaluación pre/post intervención.
- **`compiler`**: compilador del Plan Local de Salud como producto documental
  exportable (PDF, DOCX u otro formato institucional) a partir del PSL validado
  y el Plan de Acción. Está explícitamente fuera del alcance actual según el
  ROADMAP.

Ninguna funcionalidad del sistema actual depende de estos stages.

---

## 15. Riesgos conocidos

**R-N3-1 — Pipeline vacío produce outputs plausibles**

El Nivel 3 genera objetos con estructura completa aunque el EvidenceStore esté
vacío. Un equipo que no lea los avisos de pipeline vacío podría interpretar
esos objetos como propuestas reales. La interfaz mitiga este riesgo con avisos
explícitos en cada panel del Nivel 3.

**R-N3-2 — Heurística EPVSA puede asignar líneas incorrectas**

La inferencia de línea estratégica por palabras clave puede producir
asignaciones que no reflejen la semántica real de la candidata. El riesgo
aumenta en candidaturas con texto genérico o sin las palabras clave esperadas.
El fallback `pending-review` mitiga este riesgo señalando las candidatas
sin asignación clara.

**R-N3-3 — PSL desactualizado produce plan desactualizado**

Si el PSL validado queda obsoleto por nueva evidencia (`pslIsStale: true`) y el
equipo no lo regenera, el Plan de Acción se genera sobre un diagnóstico
posiblemente incompleto. El sistema lo señala pero no lo bloquea: la
responsabilidad de regenerar el PSL es del equipo técnico.

**R-N3-4 — Indicadores preliminares pueden interpretarse como definitivos**

Los tres indicadores por actuación (proceso, producto, resultado) tienen
nombres y notas de medición genéricos. Sin concreción humana, podrían
incluirse en informes institucionales como si fueran indicadores reales.
El campo `requiresHumanValidation: true` y las cautelas del plan mitigan
este riesgo.

**R-N3-5 — Encajes temáticos pueden sobreestimarse**

Un `FrameworkAlignment` de tipo `"thematic"` indica que existe una palabra
clave compartida, no que el encaje sea pertinente. Un equipo que no lea la
`relevanceNote` podría asumir que el encaje es directo y formal.

---

## 16. Criterios de evolución futura

Los siguientes criterios deben cumplirse antes de incorporar cualquier
extensión al Nivel 3:

**Para el stage `compiler`:**

1. Existe un contrato explícito que define qué constituye un Plan Local de
   Salud compilado (estructura, secciones, formato).
2. El PSL tiene estado `"approved"` como condición de entrada (no solo
   `"validated"`).
3. Existe al menos un formato de exportación documentado y validado con
   el equipo institucional.

**Para el stage `evaluation`:**

1. Existe un diseño metodológico de evaluación pre/post que define línea
   base, indicadores de impacto y periodicidad.
2. Los indicadores del Plan de Acción han sido concretados y tienen fuentes
   de datos asignadas.
3. La evaluación está diseñada para no modificar retroactivamente el
   diagnóstico territorial ni el PSL validado.

**Para cualquier motor nuevo del Nivel 3:**

1. Cumple PSL-C1: su única fuente del Nivel 2 es el PSL.
2. Todos sus outputs llevan `requiresHumanValidation: true`.
3. No genera decisiones institucionales automáticas.
4. Responde al Artículo 13 de ARCHITECTURE-CONSTITUTION.md: resuelve un
   problema real existente antes de implementarse.

---

## 17. Exclusiones

Este contrato regula exclusivamente el Nivel 3 de COMPÁS NG. Los siguientes
aspectos quedan fuera de su alcance:

- **EvidenceStore, IntegrityGuard, pipelines de evidencia**: véase
  `CONTRACT-EVIDENCE.md`.
- **Repositorio Documental Municipal**: véase `CONTRACT-REPOSITORY.md`.
- **MIT, Reconciliación y PSL**: véase `CONTRACT-MIT-PSL.md` (histórico; doctrina vigente del Perfil: `CONTRACT-LOCAL-HEALTH-PROFILE-METHODOLOGY`).
- **Estudios Complementarios y Biblioteca Metodológica**: véase
  `CONTRACT-COMPLEMENTARY-STUDIES.md`.
- **Persistencia y rehidratación del workspace**: véase
  `CONTRACT-PERSISTENCE.md`.
- **Gobernanza institucional**: constitución del Grupo Motor, aprobación
  institucional del Plan Local de Salud, compromisos presupuestarios.
- **Ejecución real de actuaciones**: los responsables municipales, los
  calendarios reales y la actividad sobre el terreno son externos al sistema.

---

## Historial de revisiones

| Fecha | Motivo |
|---|---|
| 2026-06-24 | Primera redacción. Documenta el estado del código a partir del commit `1e582f5`. Formaliza PSL-C1 en el Nivel 3, la cadena de trazabilidad completa, la heurística EPVSA, `PSLReference`, `FrameworkAlignment`, la distinción Agenda/ejecución y Seguimiento/evaluación, los riesgos conocidos y los criterios de evolución para los stages `evaluation` y `compiler`. |
