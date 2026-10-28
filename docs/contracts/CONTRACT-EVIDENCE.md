# COMPÁS NG — Contrato de Evidencia

> Enmienda vigente SAM-3.0.0 — 2026-10-28 (ADR-SAM-001). Prevalece sobre las reglas históricas de clasificación que figuran más abajo. Cochran + FPC solo proporciona una referencia descriptiva condicionada a selección aleatoria simple. Se retiran los niveles derivados del 60 % y 100 %: las evaluaciones nuevas devuelven sampleQuality = "not-evaluable", canClassifyQuality = false y los átomos SAM nuevos confidence = "not-evaluable". Tamaño, composición y confianza son dimensiones independientes.
> coverageGlobal conserva por compatibilidad el cociente n/n teórico × 100; no es cobertura poblacional. populationRatioPercent es n/N × 100; solo se publica populationCoveragePercent cuando constan participantes únicos residentes y coincidencia de universo y periodo (participationBasis); nunca se deduce de un cociente grande. Sin verificación: «No evaluable» y motivo. No hay nuevos umbrales de calidad ni de cobertura elevada.
> describeSAM comparte la explicación entre interfaz, evidencias y perfiles nuevos. Conserva las diferencias demográficas y las celdas vacías sin convertir semejanza en representatividad. Una participación muy elevada constituye una fortaleza, sin eliminar sesgos. Los perfiles ya guardados y las evidencias históricas permanecen intactos; las nuevas notas identifican el SAM histórico. planSAMEvidenceMigration prepara una migración explícita con copia íntegra del original para archivo y sustitución revisada; no persiste nada.

> Documento normativo permanente.
> Define el comportamiento garantizado, los invariantes y los límites de
> `EvidenceAtom`, `EvidenceStore`, `EvidenceStoreIntegrityGuard` y las
> pipelines de generación de evidencia en COMPÁS NG.
> No debe modificarse sin revisión explícita y deliberada.
> Última revisión: 2026-06-24

---

## 1. Propósito

La **evidencia estructurada** es la representación analítica del contenido
de los documentos del repositorio. Ocupa el **Nivel 1 tardío** del sistema:
se genera a partir de documentos registrados, cruza la frontera de explotación
documental y queda disponible como base de los motores analíticos del Nivel 2.

Un `EvidenceAtom` no es un documento. No es una decisión. Es una unidad mínima
de información analítica extraída de un documento, con trazabilidad completa
hasta su fuente.

El `EvidenceStore` es la colección de átomos activos de un municipio. Es el
único objeto que los motores analíticos del Nivel 2 consumen directamente.

---

## 2. Estructura de `EvidenceAtom`

Cada átomo tiene los siguientes campos canónicos:

### Identidad

| Campo | Tipo | Obligatorio | Descripción |
|---|---|:---:|---|
| `id` | `string` | Sí | Identificador único del átomo. Debe ser estable entre regeneraciones del mismo contenido fuente |
| `municipalityId` | `string` | Sí | Municipio al que pertenece el átomo. No puede cambiar tras la creación |
| `kind` | `EvidenceAtomKind` | Sí | Tipo semántico del átomo |
| `title` | `string` | Sí | Título legible. Clave del algoritmo de deduplicación |
| `content` | `string` | Sí | Contenido textual del átomo. Máx. 2 000 caracteres en pipelines actuales |
| `confidence` | `EvidenceConfidence` | Sí | Nivel de confianza metodológica |
| `provenance` | `EvidenceAtomProvenance` | Sí | Procedencia completa y trazable |
| `methodology` | `EvidenceMethodology` | Sí | Descripción metodológica, limitaciones y flag de validación |
| `tags` | `string[]` | Sí | Etiquetas de clasificación secundaria |
| `createdAt` | `string` | Sí | ISO 8601. Inmutable tras la creación |
| `updatedAt` | `string` | Sí | ISO 8601. Se actualiza si el átomo es reemplazado por upsert |

### Tipos de átomo (`EvidenceAtomKind`)

| `kind` | Semántica |
|---|---|
| `indicator` | Indicador cuantitativo (tasa, porcentaje, prevalencia, media) |
| `determinant` | Determinante social de la salud |
| `asset` | Activo comunitario identificado en el territorio |
| `participation` | Hallazgo del proceso participativo |
| `qualitative-observation` | Observación cualitativa o narrativa |
| `territorial-context` | Contexto territorial estructural |
| `sample-quality` | Calidad o representatividad de la muestra |
| `longitudinal-snapshot` | Dato de evolución temporal |
| `strategic-priority` | Prioridad procedente del proceso ciudadano |
| `methodological-caution` | Cautela metodológica que condiciona la interpretación |
| `other` | Tipo no clasificable en los anteriores |

### Niveles de confianza (`EvidenceConfidence`)

| `confidence` | Criterio de uso |
|---|---|
| `low` | Evidencia metodológicamente débil: muestra insuficiente (IBSE con menos de 30 registros válidos), fuente no verificada o limitaciones conocidas graves |
| `medium` | Valor por defecto. Evidencia procesable con las cautelas metodológicas habituales |
| `high` | Ninguna pipeline activa genera átomos con este nivel actualmente |

La confianza no es una garantía del sistema sobre la verdad del contenido; es
una señal metodológica para el equipo técnico. No debe usarse para ordenar
prioridades automáticamente.

### Procedencia (`EvidenceAtomProvenance`)

| Campo | Tipo | Obligatorio | Descripción |
|---|---|:---:|---|
| `origin` | `EvidenceOrigin` | Sí | Tipo de fuente. Debe ser un valor reconocido |
| `documentId` | `string` (opcional) | Recomendado | ID del documento del repositorio que originó el átomo |
| `sourceLabel` | `string` (opcional) | — | Título legible del documento fuente |
| `field` | `string` (opcional) | — | Campo específico dentro del documento |
| `page` | `number` (opcional) | — | Página del documento fuente |
| `extractedAt` | `string` | Sí | ISO 8601 del momento de extracción |

**Todo átomo generado a partir de un documento del repositorio debe incluir
`documentId`.** La omisión de este campo impide la purga segura al eliminar
el documento y activa la rama de fallback por `origin`, que es menos precisa.

### Orígenes reconocidos (`EvidenceOrigin`)

| `origin` | Fuente documental correspondiente | Estado en el flujo activo |
|---|---|---|
| `health-report` | Informe de Salud | **Origen reservado — no genera EvidenceAtom en el flujo activo del producto** (D-HR-01 resuelto; véase §5.1) |
| `complementary-study` | Estudio complementario genérico | Activo |
| `eas` | Variable EAS (Encuesta Andaluza de Salud) | Origen reconocido; parser pendiente |
| `cmi` | Indicador CMI (Cuadro de Mando Integral) | Origen reconocido; parser pendiente |
| `ibse` | Estudio IBSE (Índice de Bienestar Socioemocional) | Activo |
| `sam` | Sistema de Activos Municipales | Origen reservado; sin implementación activa |
| `redcap` | Exportación REDCap genérica | Activo |
| `localiza-salud` | Catálogo Localiza Salud | Activo — vía visible única para activos comunitarios |
| `community-assets` | Activos Comunitarios del repositorio (tipo interno/legado) | Activo (legacy); no expuesto como categoría visible en el selector |
| `citizen-participation` | Proceso de Priorización Temática ciudadana | Activo |
| `longi` | Evidencia longitudinal | Activo |
| `manual-entry` | Entrada manual | Origen reconocido |
| `legacy-compas` | Migración desde la versión anterior de COMPÁS | Compatibilidad |
| `territorial-documentation` | Documentación territorial de contexto | Activo |
| `qualitative-material` | Material cualitativo y participativo | Activo |
| `strategic-framework` | Marco estratégico y normativo (EPVSA, ESCA, RELAS, etc.) | Activo; genera `kind: "strategic-priority"` |
| `other` | Origen no clasificable | Fallback interno; no debe usarse en categorías visibles |

Un átomo con un `origin` que no figure en esta lista es rechazado por el
IntegrityGuard (Regla A). No se pueden crear orígenes ad hoc sin actualizar
el tipo `EvidenceOrigin` y este contrato.

### Metodología (`EvidenceMethodology`)

| Campo | Tipo | Descripción |
|---|---|---|
| `description` | `string` | Descripción del proceso de extracción |
| `limitations` | `string[]` | Limitaciones conocidas del átomo o su fuente |
| `requiresHumanValidation` | `boolean` | Siempre `true` en todos los átomos generados por el sistema |

**Invariante E-M1:** Todo átomo generado por el sistema tiene
`requiresHumanValidation: true`. El sistema nunca genera átomos que se
presenten como validados automáticamente.

---

## 3. `EvidenceStore`

El `EvidenceStore` es la colección de átomos activos de un municipio.

```
EvidenceStore {
  municipalityId: string      — municipio propietario
  atoms:          EvidenceAtom[]  — átomos activos, sin duplicados semánticos
  createdAt:      string      — ISO 8601
  updatedAt:      string      — ISO 8601; se actualiza en cada modificación
}
```

### Operaciones del store

**`addEvidenceAtom(store, atom)`** — Añade un átomo sin comprobar duplicados.
Adecuada para fuentes donde cada extracción produce un átomo nuevo con
significado propio (secciones de informe de salud, líneas de estudios
complementarios).

**`upsertEvidenceAtom(store, atom, key)`** — Añade el átomo si no existe un
átomo con la misma `stableAssetKey`; si existe, actualiza `content` y
`provenance` del existente, preservando `id` y `createdAt`. Adecuada para
fuentes donde el mismo activo puede reimportarse (activos comunitarios,
Localiza Salud).

**`stableAssetKey(municipalityId, origin, title)`** — Genera la clave de
deduplicación semántica: concatenación de `origin`, `municipalityId` y el
título normalizado (minúsculas, sin diacríticos, espacios colapsados). Es la
base del algoritmo de deduplicación del IntegrityGuard (Regla E) y de
`upsertEvidenceAtom`.

Las funciones de consulta (`getEvidenceAtomsByKind`, `getEvidenceAtomsByOrigin`,
`getEvidenceAtomsByConfidence`, `getEvidenceAtomsRequiringValidation`,
`searchEvidenceAtomsByTag`) son solo filtros de lectura. No modifican el store.

---

## 4. `EvidenceStoreIntegrityGuard`

El IntegrityGuard valida y sanea el `EvidenceStore` antes de que entre en el
pipeline analítico. Opera sobre una copia del store; no muta el original.

Debe ejecutarse siempre antes de pasar el store al Motor de Interpretación
Territorial (MIT). El runtime lo aplica automáticamente (`MunicipalityRuntime`).

### Reglas de integridad

**Regla A — Origen reconocido**
Todo átomo cuyo `provenance.origin` no figure en la lista de orígenes
reconocidos es rechazado y excluido del store saneado. Se registra un error.

**Regla B — Restricción de `kind` por origen gobernado**
Los orígenes gobernados tienen restricciones estrictas sobre qué `kind`
pueden producir:

| Origen gobernado | `kind` permitidos |
|---|---|
| `ibse` | `indicator`, `qualitative-observation` |
| `health-report` | `indicator`, `qualitative-observation`, `methodological-caution`, `territorial-context` |
| `citizen-participation` | `strategic-priority` |

Un átomo de origen gobernado con un `kind` fuera de los permitidos es
rechazado. Se registra un error.

Los orígenes no gobernados (todos los demás) no tienen restricción de `kind`:
cualquier `kind` válido es aceptado.

**Regla C — Integridad estructural**
Un átomo sin `id`, sin `provenance.origin` o sin `kind` es rechazado.
Se registra un error.

**Regla D — Completitud IBSE**
Si el store contiene átomos IBSE con `kind: "indicator"`, deben ser
exactamente 5 (índice total + 4 factores: Vínculo, Situación, Control,
Persona). Un número distinto genera un aviso (no un error). El átomo
`ibse-resumen` (`kind: "qualitative-observation"`) no cuenta para este
umbral: es un derivado, no un factor primario.

**Regla E — Deduplicación semántica**
Si dos átomos tienen la misma `stableAssetKey`, se conserva el primero y se
descarta el segundo. Se registra un aviso.

### Resultado del IntegrityGuard (`IntegrityGuardResult`)

```
{
  valid:          boolean         — true si no hubo errores (puede haber avisos)
  sanitizedStore: EvidenceStore   — store saneado listo para el MIT
  errors:         string[]        — átomos rechazados con su causa
  warnings:       string[]        — situaciones anómalas no bloqueantes
  stats: {
    totalAtoms:   number
    byOrigin:     Record<string, number>
    byKind:       Record<string, number>
  }
}
```

El `sanitizedStore` es el único objeto que el MIT tiene autorizado a consumir.
El store original no se modifica.

---

## 5. Pipelines de generación de evidencia

Cada pipeline genera átomos a partir de un tipo de fuente específico. Las
pipelines no se mezclan entre sí y no comparten lógica de extracción.

### 5.1 Pipeline del Informe de Salud (`HealthReportToEvidencePipeline`)

> **D-HR-01 RESUELTA — 2026-07-07**
>
> `HealthReportToEvidencePipeline` **no forma parte del flujo activo del producto**.
> La función `healthReportToEvidenceAtoms` existe en el código como utilidad aislada
> pero no se llama desde `handleLoadHealthReport` ni desde ningún camino institucional
> de carga del Informe de Salud (ni DOCX ni PDF).
>
> El Informe de Salud se carga, conserva y referencia como fuente primaria documental
> (`HealthReportDocument`) sin conversión a `EvidenceAtom`.
> El `EvidenceStore` no recibe átomos con `origin: "health-report"` en el ciclo activo.
> Los átomos de `health-report` que pudieran existir en workspaces anteriores
> se purgan al recargar el Informe de Salud.

**Estatuto actual del Informe de Salud:**

- **DOCX**: cargado mediante `mammoth`; se crea un `HealthReportDocument` con cuerpo HTML y secciones para visualización. No genera `EvidenceAtom`.
- **PDF**: preservado como fuente primaria sin extracción de texto, sin secciones diagnósticas. No genera `EvidenceAtom`.
- `canGenerateEvidence = false` para `kind: "health-report"` en el repositorio (bloquea también la pipeline genérica).
- El PSL referencia el `HealthReportDocument` por su ID y título como fuente primaria, no como evidencia atomizada.

**Descripción histórica de la pipeline (referencia):**

La función `healthReportToEvidenceAtoms` aún existe en `HealthReportToEvidencePipeline.ts`
y puede llamarse manualmente con fines de test o análisis. Su lógica interna:

- Una sección → un átomo; `title-page` y `autores` excluidas.
- `kind` por clave de sección: `mortalidad`/`morbilidad`/`cancer`/`edo-its`/`vacunacion-cribados`/`demografia` → `indicator`; `metodologia` → `methodological-caution`; `introduccion` → `territorial-context`; resto → `qualitative-observation`.
- Truncado a 2 000 caracteres. Confianza `"medium"`. ID determinista `health-report:{linkedDocumentId}:{sectionKey}:{sortOrder}`.

Esta descripción queda como referencia histórica. No describe el flujo activo del producto.

### 5.2 Pipeline IBSE (`IBSEStudyToEvidenceAtoms`)

**Origen:** `"ibse"` · **Activación:** explícita (importación CSV REDCap IBSE)

Produce exactamente 6 átomos si `nValid > 0`; 0 átomos si `nValid === 0`.

**IBSE_FACTORES — 5 átomos, `kind: "indicator"`**

Un átomo por valor del instrumento: índice total, factor Vínculo, factor
Situación, factor Control, factor Persona. Estos son la evidencia cuantitativa
primaria del instrumento. El MIT los utiliza como indicadores directos.

- `id` determinista: `ibse:{municipalityId}:{fieldName}`.
- Confianza: `"medium"` si `nValid ≥ 30`, `"low"` si `nValid < 30`.

**IBSE_RESUMEN — 1 átomo, `kind: "qualitative-observation"`**

Síntesis automática derivada de IBSE_FACTORES. Identifica el factor de menor
puntuación, el de mayor puntuación y la dispersión interfactorial.

**IBSE_RESUMEN no es evidencia primaria.** Es un derivado del sistema. No debe
prevalecer sobre los datos cuantitativos (IBSE_FACTORES) cuando exista
discrepancia. Los umbrales de clasificación (alto/medio/bajo) y la alerta por
dispersión alta (>2 puntos) son heurísticos del sistema, no conclusiones
metodológicas del instrumento IBSE (Bericat, 2014).

- `id` determinista: `ibse:{municipalityId}:resumen-interpretativo`.
- Tags: `["ibse", "qualitative-observation", "ibse-resumen", "ibse-derived"]`.

El IntegrityGuard (Regla B) acepta ambos `kind` para el origen `ibse`.
El IntegrityGuard (Regla D) solo verifica los 5 átomos de `kind: "indicator"`.

### 5.3 Pipeline de Priorización Temática (`ThematicPrioritisationToEvidenceAtoms`)

**Origen:** `"citizen-participation"` · **Activación:** explícita (importación CSV o selección manual)

- Un átomo por tema seleccionado en `ThematicPrioritisation.selectedTopicIds`.
- `kind: "strategic-priority"` para todos.
- `id` determinista: `citizen-participation:{municipalityId}:{topicId}`.
- Confianza: `"medium"`.
- El átomo refleja una señal de prioridad del proceso participativo; no sustituye
  la priorización técnica ni epidemiológica.

### 5.4 Pipeline genérico de documentos (`DocumentToEvidencePipeline`)

**Activación:** explícita (ingesta de texto desde el panel de repositorio)

El pipeline genérico se aplica a todos los documentos con `canGenerateEvidence !== false`
que no tienen pipeline específico.

- **`community-asset`**: segmenta el texto en bloques por activo (encabezados `##`).
  Un bloque → un átomo (`kind: "asset"`). Usa `upsertEvidenceAtom` con
  `stableAssetKey` para evitar duplicados en reimportaciones.

- **`localiza-salud`**: una línea → un átomo (`kind: "asset"`). Usa
  `upsertEvidenceAtom`.

- **Resto de tipos acumulables**: una línea no vacía → un átomo. El `kind` se
  asigna por heurística textual (palabras clave de indicador, determinante,
  activo, participación, cautela). El `prior` por tipo de documento actúa como
  fallback cuando no hay señal textual. Usa `addEvidenceAtom` (sin dedup).

La correspondencia entre `DocumentKind` y `EvidenceOrigin` en el pipeline
genérico es:

| `DocumentKind` | `EvidenceOrigin` resultante | `EvidenceAtomKind` resultante (prior) |
|---|---|---|
| `health-report` | — | — (no pasa por este pipeline; D-HR-01) |
| `complementary-study` | `"complementary-study"` | heurístico textual |
| `eas-variable` | `"eas"` | `"indicator"` |
| `cmi-indicator` | `"cmi"` | `"indicator"` |
| `community-asset` | `"community-assets"` | `"asset"` (segmentación por `##`) |
| `localiza-salud` | `"localiza-salud"` | `"asset"` (una línea = un activo) |
| `strategic-framework` | `"strategic-framework"` | `"strategic-priority"` |
| `territorial-documentation` | `"territorial-documentation"` | heurístico textual |
| `qualitative-material` | `"qualitative-material"` | heurístico textual |
| `redcap-export` | `"redcap"` | heurístico textual |
| `longitudinal-evidence` | `"longi"` | heurístico textual |
| resto | `"other"` | heurístico textual |

> `community-asset` es un tipo interno/legado; no aparece como categoría visible en
> el selector documental del producto. La vía visible única para activos comunitarios
> es `localiza-salud`.
>
> `eas-variable` y `cmi-indicator` no están expuestos en el selector visible del
> producto (no tienen parser/cargador real implementado).

---

## 6. Relación EvidenceStore → MIT → PSL

El `EvidenceStore` es la única fuente que alimenta el Motor de Interpretación
Territorial (MIT). El flujo es estrictamente unidireccional:

```
EvidenceStore
    → IntegrityGuard → sanitizedStore
        → MIT (createEstadoTerritorialEvolutivo)
            → EstadoTerritorialEvolutivo
                → ReconciliacionInterpretativa
                    → PSL (buildLocalHealthProfile)
```

**El MIT lee el `sanitizedStore`; no lo modifica.**

El MIT clasifica los átomos por `kind`:
- `determinant` → dimensión diagnóstica de determinantes.
- `asset` → dimensión de activos comunitarios.
- `indicator` → dimensión de indicadores.
- `qualitative-observation`, `participation` → hallazgos cualitativos.
- `methodological-caution` → cautelas que condicionan la interpretación.
- `longitudinal-snapshot` → dimensión longitudinal.

El PSL no embebe átomos de evidencia. Referencia sus identificadores en
`evidenceAtomIds: string[]` y conserva estadísticas agregadas
(`atomsByOrigin`, `atomsByKind`). Esta separación garantiza que el PSL pueda
persistirse sin duplicar el contenido del store.

---

## 7. Invariantes

**I-E1 — Unicidad del municipio**
Todo átomo del store tiene el mismo `municipalityId` que el store que lo
contiene. El IntegrityGuard no rechaza átomos de otro municipio, pero la
capa de aplicación no los añade nunca a un store ajeno.

**I-E2 — Validación humana obligatoria**
`requiresHumanValidation` es `true` en todos los átomos generados por el
sistema. El sistema nunca produce evidencia que se presente como validada
automáticamente.

**I-E3 — Inmutabilidad de la procedencia**
`provenance.origin`, `provenance.documentId` y `provenance.extractedAt` son
inmutables tras la creación del átomo. El sistema no reescribe la procedencia
de un átomo existente. En `upsertEvidenceAtom`, la procedencia del átomo
entrante sustituye a la del existente, porque el upsert equivale a una
reimportación de la misma fuente.

**I-E4 — Trazabilidad a documento**
Todo átomo generado a partir de un documento del repositorio incluye
`provenance.documentId`. Los átomos sin `documentId` son tolerados para
compatibilidad con datos anteriores a la introducción del campo, pero
representan un estado degradado de trazabilidad.

**I-E5 — El MIT no modifica el store**
Ninguna operación del Motor de Interpretación Territorial, del Motor de
Reconciliación ni del constructor del PSL modifica el `EvidenceStore`.
Su función es leer y transformar, no escribir.

**I-E6 — Rechazos son explícitos**
El IntegrityGuard nunca descarta un átomo silenciosamente. Todo átomo
rechazado (Reglas A, B, C) produce un mensaje de error con el `id` del átomo
y el motivo del rechazo. Todo átomo descartado por duplicación (Regla E)
produce un aviso.

**I-E7 — IBSE_RESUMEN es siempre secundario**
El átomo `ibse-resumen` (`kind: "qualitative-observation"`, tag
`"ibse-derived"`) es un derivado del sistema. Cuando exista conflicto entre
su contenido y los datos de IBSE_FACTORES (`kind: "indicator"`), los datos
cuantitativos prevalecen siempre.

**I-E8 — El origen `sam` está reservado**
`"sam"` es un valor de `EvidenceOrigin` reconocido por el IntegrityGuard pero
no tiene pipeline activa. Ningún proceso del sistema genera actualmente átomos
con `origin: "sam"`. Su uso en un átomo real indica datos externos o de
migración que deben revisarse.

---

## 8. Exclusiones

Este contrato regula la estructura, generación, validación y flujo de la
evidencia estructurada. Los siguientes aspectos quedan fuera de su alcance:

- **Repositorio Documental Municipal**: ciclo de vida de los documentos, tipos
  canónicos, operaciones de sustitución y borrado. Véase
  `CONTRACT-REPOSITORY.md`.
- **MIT / EstadoTerritorialEvolutivo**: lógica interna del motor territorial,
  detección de tensiones estructurales, dimensión longitudinal.
- **Reconciliación Interpretativa**: criterios de escalado de tensiones a Áreas
  de Intervención Territorial.
- **PSL (Perfil de Salud Local)**: estructura, ciclo de vida, invariantes
  PSL-I1 (referencia al Informe de Salud) y PSL-C1 (mediación Nivel 2→3).
- **Priorización técnica, EPVSA, Plan de Acción, Agenda y Seguimiento**.
- **Persistencia y rehidratación**: serialización del workspace, normalización
  de documentos canónicos al cargar, política de migración de esquema.
- **Biblioteca Metodológica Canónica**: definición formal de instrumentos
  (IBSE, SF-12, DUKE, PREDIMED y otros).

---

## Historial de revisiones

| Fecha | Motivo |
|---|---|
| 2026-06-24 | Primera redacción. Documenta el estado del código a partir del commit `1e582f5`. Incluye la distinción IBSE_FACTORES / IBSE_RESUMEN, las reglas A–E del IntegrityGuard y la correspondencia DocumentKind → EvidenceOrigin del pipeline genérico. |
| 2026-07-07 | **Revisión D-HR-01.** §5.1 actualizado: `HealthReportToEvidencePipeline` queda fuera del flujo activo del producto; `health-report` no genera EvidenceAtom. Tabla de orígenes ampliada con `territorial-documentation`, `qualitative-material`, `strategic-framework`. Tabla DocumentKind→EvidenceOrigin actualizada con nuevos tipos y nota sobre visibilidad en el selector. |
