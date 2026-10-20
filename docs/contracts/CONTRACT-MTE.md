# CONTRACT-MTE

> Contrato canónico del Motor de Traducción Estratégica de COMPÁS NG.
> Producto 5.
> Versión 1.0 — 2026-06-30
> Estado: VIGENTE — implementación certificada
>
> Supersede: CONTRACT-STRATEGIC-TRANSLATION v1.0 (archivado 2026-06-30)

---

## 1. Propósito

Este contrato establece el comportamiento garantizado, los invariantes y los
límites del Motor de Traducción Estratégica (MTE) de COMPÁS NG.

El MTE es el Producto 5 del ciclo de planificación local de salud. Opera en
el Nivel 3 de la arquitectura, sobre el `LocalHealthProfile` validado como
única fuente de información territorial.

---

## 2. Misión institucional

El Motor de Traducción Estratégica **identifica y hace explícitas** las
coherencias estratégicas latentes en la intersección del diagnóstico territorial
certificado y el conocimiento estratégico institucional disponible.

El MTE no genera conocimiento. Hace visible el conocimiento que ya existe en
el diagnóstico territorial y en los marcos institucionales, expresándolo como
entidades discretas, trazables e inmutables del dominio: los `EscenarioEstratégico`.

El MTE no interpreta el diagnóstico: lo organiza en clave estratégica.
No valora: relaciona. No decide: representa.

La acción canónica del MTE es **explicitar**: tomar lo que el diagnóstico
y el conocimiento estratégico contienen de forma latente y convertirlo en
representaciones estructuradas para los productos de planificación.

---

## 3. Posición en la arquitectura

```
LocalHealthProfile (validated | approved)   ←── única fuente territorial
    │
    │  [solo lectura]
    ▼
Motor de Traducción Estratégica (MTE)
    │
    │  ←── FrameworkProvider (conocimiento estratégico institucional)
    │       [solo lectura]
    ▼
LecturaEstrategicaLocal
    │
    ├── EscenarioEstratégico[]  (entidades del dominio; ver CONTRACT-STRATEGIC-SCENARIO)
    ├── VacíoInstitucional[]
    ├── cautelas[]
    ├── metodología
    └── requiresHumanValidation: true
```

**Regla PSL-C1** (heredada de CONTRACT-ACTION-PLAN): el MTE opera en el Nivel 3.
Su única fuente de información territorial es el `LocalHealthProfile`. No puede
consumir directamente `LT1Result`, `OITResult`, `EstadoTerritorialEvolutivo`,
`EvidenceStore`, estudios complementarios, SAM ni workspace.

---

## 4. Entradas

### 4.1 Entrada principal — `LocalHealthProfile`

```
LocalHealthProfile
  └─ status: "validated" | "approved"          ← requerido (G-MTE-1)
  └─ areasDeIntervencion: PSLAreaIntervencion[] ← fuente primaria de escenarios
  └─ tensionesEscaladas: PSLTension[]          ← fuente de tensiones tipo "evidencia"
  └─ tensionesNoEscaladas: PSLTension[]        ← contexto de tensiones
  └─ conflictos: PSLConflicto[]                ← fuente de tensiones tipo "evidencia"
  └─ priorizacion.tematicasSeleccionadasIds    ← informa solidez contextual
  └─ id, version, municipalityId              ← trazabilidad del artefacto
```

El MTE consume los Capítulos III, IV y VII del PSL. No accede a los Capítulos
V, VI (conclusiones, cierre interpretativo) ni a ningún output del MIT anterior
al PSL.

### 4.2 Infraestructura de conocimiento — `FrameworkProvider`

El `FrameworkProvider` es la abstracción que provee el conocimiento estratégico
institucional al MTE. Es de solo lectura. El MTE no depende de ninguna
implementación concreta.

**Implementaciones previstas:**

| Implementación | Uso | Descripción |
|---|---|---|
| `StaticFrameworkProvider` | Tests y fixtures | Provee elementos estratégicos desde datos estáticos. No depende del registry en producción. |
| `RegistryFrameworkProvider` | Producción | Delega en el `StrategicFrameworkRegistry` existente (`src/domain/strategy/StrategicFrameworkRegistry.ts`). |

El MTE recibe `FrameworkProvider` como parámetro de entrada. El origen del
conocimiento estratégico (registro estático, base documental, o cualquier
implementación futura) es transparente para el motor.

### 4.3 Entradas explícitamente excluidas

El MTE **no puede** recibir ni acceder a:

- `EvidenceStore`, `EvidenceAtom`, `SampleQualityAssessment`
- `LocalHealthProfileArtifact` (PSL-C), `NHSHealthProfileArtifact` (PSL-NHS)
- `MunicipalityWorkspace`, `MunicipalDocumentRepository`
- `IBSEStudy`, `DUKEStudy`, y demás estudios complementarios
- Outputs del MIT anteriores al PSL
- Cualquier output de Productos 1–4

---

## 5. Gates de compilación

| Gate | Condición | Tipo | Resultado si no se cumple |
|---|---|---|---|
| **G-MTE-1** | `psl.status` distinto de `superseded` y `archived` (la validación es criterio de calidad, no requisito: `CONTRACT-PROFILE-VALIDATION-QUALITY`) | Bloqueante | `{ ok: false, violations: [G-MTE-1] }` |
| **G-MTE-2** | `psl.areasDeIntervencion.length >= 1` | No bloqueante | Artefacto generado con `escenarios: []`; `hasTranslatableContent: false` |
| **G-MTE-3** | `frameworkProvider` disponible y operativo | Bloqueante | `{ ok: false, violations: [G-MTE-3] }` |

G-MTE-2 no bloquea porque un PSL sin áreas de intervención es válido: puede
no haber suficiente evidencia. El artefacto se genera declarando explícitamente
que no hay contenido traducible.

---

## 6. Salida — `LecturaEstrategicaLocal`

El MTE produce un único artefacto: la `LecturaEstrategicaLocal`.

### 6.1 Estructura conceptual

```
LecturaEstrategicaLocal
├── id
├── municipalityId
├── generatedAt
├── sourcePSLId
├── sourcePSLVersion
├── knowledgeBaseVersion
├── hasTranslatableContent: boolean
├── escenarios: EscenarioEstratégico[]
├── sinCobertura: VacíoInstitucional[]
├── cautelas: string[]
├── metodología: MetodologíaMTE
└── requiresHumanValidation: true
```

### 6.2 El `EscenarioEstratégico`

Los `EscenarioEstratégico` que componen la `LecturaEstrategicaLocal` son
entidades del dominio COMPÁS NG. Su definición completa, invariantes y
prohibiciones están en `CONTRACT-STRATEGIC-SCENARIO.md`.

### 6.3 `VacíoInstitucional`

Áreas del PSL para las que no fue posible construir ningún escenario (e.g.,
área sin texto procesable). Contiene: `areaId`, `areaTitle`, `nota`.

En la primera implementación (agrupación 1:1), `sinCobertura` queda vacío
porque toda área produce un escenario (con `sinCoberturaMarcal: true` si no
hay referencias institucionales). `sinCobertura` se poblará cuando el algoritmo
de agrupación excluya áreas del conjunto de escenarios.

### 6.4 Cautelas invariables

La `LecturaEstrategicaLocal` incluye siempre estas cuatro cautelas:

1. *"Las correspondencias identificadas son observaciones metodológicas sobre
   la relación entre el diagnóstico territorial y el conocimiento estratégico
   institucional disponible. No constituyen orientaciones definitivas ni
   asignaciones de marcos al Plan Local de Salud."*

2. *"Un escenario puede corresponder con elementos de más de un marco
   institucional. La selección de qué marcos incorporar al plan es una
   decisión del equipo técnico."*

3. *"La ausencia de cobertura institucional (sinCoberturaMarcal: true) no
   significa que el problema carezca de importancia o de posibilidad de
   actuación. Significa que el sistema no ha detectado correspondencia en
   el conocimiento estratégico disponible."*

4. *"Este artefacto no establece prioridades entre escenarios. La
   priorización es una decisión deliberativa que corresponde al equipo
   técnico y a la ciudadanía."*

---

## 7. Restricciones del motor

El MTE **nunca**:

- genera texto narrativo autónomo sobre el estado de salud del municipio;
- interpreta el diagnóstico territorial: lo organiza en clave estratégica;
- establece prioridades entre escenarios;
- valora la importancia relativa de los problemas;
- propone actuaciones, objetivos ni plazos;
- accede a información que no sea el PSL y el `FrameworkProvider`;
- modifica el `LocalHealthProfile` de origen;
- produce `EscenarioEstratégico` que contengan interpretaciones, valoraciones
  o decisiones (Principio de Objetividad — `CONTRACT-STRATEGIC-SCENARIO §3`).

---

## 8. Invariantes

**I-MTE-1 — PSL-C1: única fuente territorial**
El MTE solo consume el `LocalHealthProfile`. No existen rutas directas al
Nivel 2 (MIT, OIT, EvidenceStore) desde el motor.

**I-MTE-2 — `requiresHumanValidation: true`**
La `LecturaEstrategicaLocal` siempre porta `requiresHumanValidation: true`.
Este campo no puede tomar ningún otro valor.

**I-MTE-3 — Inmutabilidad del PSL de origen**
El MTE nunca modifica el `LocalHealthProfile` que recibe. Tras su ejecución,
el PSL permanece idéntico al estado inicial.

**I-MTE-4 — Determinismo**
El mismo `LocalHealthProfile` (mismo `id`, mismo `version`) con el mismo
`knowledgeBaseVersion` produce siempre la misma `LecturaEstrategicaLocal`.
El MTE es determinista e idempotente.

**I-MTE-5 — Trazabilidad completa**
Cada `EscenarioEstratégico` del artefacto traza hasta `PSLAreaIntervencion`
del PSL (`areasOrigen`) y hasta los átomos de evidencia relacionados
(`evidenciaOrigen`). La cadena `LecturaEstrategicaLocal → PSL → EvidenceAtom`
es verificable en cualquier punto.

**I-MTE-6 — Principio de Objetividad heredado**
El MTE hereda el Principio de Objetividad de `CONTRACT-STRATEGIC-SCENARIO §3`.
Ningún paso del proceso de traducción puede introducir interpretaciones,
valoraciones ni decisiones en el artefacto resultante.

**I-MTE-7 — FrameworkProvider de solo lectura**
El MTE consulta el `FrameworkProvider` pero nunca lo modifica. El conocimiento
estratégico institucional es una infraestructura inmutable desde la perspectiva
del motor.

---

## 9. Comportamiento con datos parciales

| Situación | Comportamiento |
|---|---|
| PSL sin áreas de intervención | G-MTE-2: artefacto con `escenarios: []`, `hasTranslatableContent: false` |
| Área sin texto procesable | `VacíoInstitucional` en `sinCobertura` |
| Área con texto pero sin correspondencia institucional | `EscenarioEstratégico` con `sinCoberturaMarcal: true` |
| PSL sin tensiones | `tensiones: []` en todos los escenarios |
| PSL sin priorización participativa | No afecta la estructura; `hasParticipatoryInput: false` en identidad |

---

## 10. Limitaciones conocidas de la primera implementación

Estas limitaciones no bloquean la certificación del Producto 5. Quedan
documentadas como deuda de evolución futura.

| ID | Limitación | Impacto | Evolución prevista |
|---|---|---|---|
| MTE-L1 | Agrupación 1:1 (una área → un escenario) | Escenarios potencialmente fragmentados; sinergias entre áreas no representadas | Algoritmo de agrupación por coherencia compartida |
| MTE-L2 | `activosRelacionados: []` vacío | El escenario no identifica activos relevantes | Requiere acceso a tipos de átomos del EvidenceStore; decisión de diseño pendiente |
| MTE-L3 | Tensiones de tipo `"marco"` no activas | El artefacto no detecta divergencias entre marcos | Análisis de elementos del FrameworkProvider; activar en iteración posterior |
| MTE-L4 | Distribución no selectiva de tensiones del PSL | Tensiones del PSL se distribuyen a todos los escenarios sin discriminación | Vinculación de tensiones a áreas específicas del PSL |

---

## 11. Criterios de certificación

Para que el Producto 5 pueda considerarse certificado, deben cumplirse
**todas** las condiciones siguientes:

| Criterio | Verificable mediante |
|---|---|
| TypeScript `--noEmit` sin errores | Build |
| Todos los tests anteriores pasan sin regresión | Suite completa |
| G-MTE-1: PSL `superseded` o `archived` → `{ ok: false }` | Test unitario |
| G-MTE-1: PSL `generated` o `validated` → `{ ok: true }` | Test unitario |
| G-MTE-1: PSL `approved` → `{ ok: true }` | Test unitario |
| G-MTE-2: sin áreas → `hasTranslatableContent: false` | Test unitario |
| `requiresHumanValidation: true` en artefacto | Test tipado |
| PSL de origen no modificado tras compilación | Test de inmutabilidad |
| Dos compilaciones del mismo PSL producen artefactos equivalentes | Test de determinismo |
| `sinCoberturaMarcal: true` ↔ `referenciasInstitucionales.length === 0` | Test de consistencia |
| Trazabilidad: `areasOrigen` apunta a IDs válidos del PSL | Test de trazabilidad |
| `cautelasOriginales` heredadas correctamente desde las áreas | Test de herencia |
| Cuatro cautelas invariables siempre presentes | Test de cautelas |
| Artefacto serializable sin pérdida | Test JSON round-trip |
| Auditoría con datos reales de Atarfe | Test de integración |
| Ningún `EscenarioEstratégico` contiene texto generado autónomamente | Test de objetividad |

---

## 12. Relación con el Producto 6

La `LecturaEstrategicaLocal` es la entrada del Producto 6 (Plan de Acción).

El Producto 6 solo itera sobre los `EscenarioEstratégico` que hayan sido
seleccionados expresamente por el Grupo Motor mediante una
`DeliberativePrioritySelection` vigente. El MTE no selecciona prioridades.
La correspondencia conceptual es:

```
EscenarioEstratégico         →  ActionPlanObjectiveCluster
  referenciasInstitucionales →  FrameworkAlignment
  tensiones                  →  cautelas del objetivo
  sinCoberturaMarcal         →  objetivo marcado sin alineación disponible
```

El Producto 6 recibe los escenarios seleccionados como unidades ya coherentes. No hace
clustering; no busca frameworks; no detecta tensiones. El MTE realizó ese
trabajo. La compuerta deliberativa documenta por separado las candidaturas
técnicas, la priorización ciudadana disponible y la decisión motivada del
Grupo Motor. Solo después, el Producto 6 convierte las bases seleccionadas en objetivos y actuaciones,
con revisión humana obligatoria.

Cuando el Producto 6 se diseñe, su contrato debe referenciar
`CONTRACT-STRATEGIC-SCENARIO.md` como la definición de su unidad de entrada.

---

## 13. Referencia cruzada

| Documento | Relación |
|---|---|
| `CONTRACT-STRATEGIC-SCENARIO.md` | Define `EscenarioEstratégico`, la entidad de dominio que el MTE produce |
| `CONTRACT-MIT-PSL.md` | Define el `LocalHealthProfile` y la regla PSL-C1 |
| `CONTRACT-ACTION-PLAN.md` | Define el consumidor primario y las reglas MTE-1, MTE-2, MTE-3 (vigentes) |
| `CONTRACT-INTERPRETATION.md` | Define las capas de conocimiento; la `LecturaEstrategicaLocal` opera entre capa 4 y capa 5 |
| `CONTRACT-STRATEGIC-TRANSLATION.md` | Archivado — diseño conceptual previo supersedido por este contrato |
| `src/domain/strategic-scenario/` | Ubicación de los tipos de dominio |
| `src/domain/strategy/StrategicFrameworkRegistry.ts` | Implementación de producción del conocimiento estratégico |

---

*El diagnóstico ya contiene las coherencias estratégicas.
El MTE las hace explícitas.*
