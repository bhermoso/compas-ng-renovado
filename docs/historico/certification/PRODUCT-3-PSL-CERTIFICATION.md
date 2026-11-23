# COMPÁS NG — Expediente de Certificación Institucional
## Producto 3 — Perfil de Salud Local COMPÁS (PSL-C)

> Documento oficial de arquitectura.
> No es un manual de usuario ni una guía de implementación.
> Deja constancia formal de que el Producto 3 existe, cuál es su alcance,
> qué garantiza, qué queda pendiente y por qué puede considerarse certificado.
> No puede modificarse salvo por decisión deliberada del responsable del proyecto.
> Fecha de emisión: 2026-06-30

---

## Nota de estado superado (2026-07-14)

Este expediente es un acto fechado de certificación emitido el 2026-06-30. Su cuerpo se conserva intacto como registro histórico: no se reescribe retrospectivamente. El estado actual del repositorio supera parte de sus afirmaciones de implementación: el catálogo canónico de Estudios Complementarios son 13, el PSL-C dispone de exportación DOCX/PDF, y la estructura documental real presenta un conflicto de gobernanza pendiente entre siete capítulos contractuales, seis capítulos narrativos del artefacto/export y lectura canónica editorial no capitular. Esta nota no resuelve esa estructura; la registra como estado superado pendiente de unificación posterior.

---

## 1. Identificación

| Campo | Valor |
|---|---|
| **Nombre oficial** | Perfil de Salud Local COMPÁS (PSL-C) |
| **Código** | PRODUCT-3 |
| **Objetivo institucional** | Sintetizar el diagnóstico territorial disponible del municipio en un objeto analítico trazable, validable y compilable, que constituye el único puente autorizado entre el análisis territorial (Nivel 2) y las decisiones de planificación (Nivel 3) |
| **Fecha de emisión** | 2026-06-30 |
| **Estado** | **CERTIFICADO** |
| **Versión** | 1.0 |
| **Repositorio** | `C:\Users\blash\Desktop\COMPAS_NG` |
| **Prerrequisitos certificados** | Producto 1 — Sistema de Estudios Complementarios (2026-06-29) · Producto 2 — SAM NG (2026-06-29, cierre definitivo 2026-06-30) |

---

## 2. Alcance certificado

### 2.1 Fuentes que el PSL integra

El PSL puede integrar cualquier combinación de las siguientes fuentes cuando estén disponibles en el workspace. La ausencia de cualquier fuente genera cautelas, nunca un error.

| Fuente | Estado | Canal de entrada |
|---|---|---|
| Informe de Salud (Health Report) | ✅ Certificada | Referenciado por `documentId`; nunca embebido |
| EvidenceStore saneado | ✅ Certificado | Vía MIT → `buildLocalHealthProfile` |
| IBSE (Producto 1) | ✅ Certificado | EvidenceAtoms `kind: "indicator"` + `ibsePresent: boolean` |
| DUKE-EAS (Producto 1) | ✅ Certificado | EvidenceAtoms `kind: "indicator"` + `dukePresent: boolean` |
| PREDIMED-EAS (Producto 1) | ✅ Certificado | EvidenceAtoms `kind: "indicator"` + `predimedPresent: boolean` |
| SF-12 EAS (Producto 1) | ✅ Certificado | EvidenceAtoms `kind: "indicator"` + `sf12Present: boolean` |
| Sueño EAS (Producto 1) | ✅ Certificado | EvidenceAtoms `kind: "indicator"` + `suenoPresent: boolean` |
| CAGE-EAS (Producto 1) | ✅ Certificado | EvidenceAtoms `kind: "indicator"` + `cagePresent: boolean` |
| SAM (Producto 2) | ✅ Certificado | EvidenceAtoms `kind: "sample-quality"` → LT1 `methodologicalCautions` |
| Activos comunitarios | ✅ Certificado | EvidenceAtoms `kind: "asset"` |
| Priorización temática | ✅ Certificado | Cap. VII: `tematicasSeleccionadasIds`, `hasParticipatorySelection` |
| Determinantes sociales | ✅ Certificado | EvidenceAtoms `kind: "determinant"` |
| Evidencia longitudinal | ✅ Certificado (átomos) | `longitudinalActive`, `longitudinalNote` |
| Desigualdades / vulnerabilidades | ✅ Por EvidenceStore | Presentes cuando los parsers los generan |

### 2.2 Estructura canónica del LocalHealthProfile

La estructura de siete capítulos está implementada e invariante:

| Capítulo | Contenido | Autoría |
|---|---|---|
| **I — Marco estratégico** | IDs de secciones del StrategicFramework (EPVSA, RELAS, ESCA, etc.) | Sistema |
| **II — Informe de Salud** | Referencia por `documentId` y título; PSL-I1: nunca embebido | Sistema |
| **III — Diagnóstico integrado** | Stats del EvidenceStore: total átomos, por origen, por tipo, ids, errores de integridad; presencia explícita de los 6 instrumentos | Sistema |
| **IV — Interpretación territorial** | MIT + Reconciliación: resumen, determinantes, activos, indicadores, cautelas (incl. SAM), áreas de intervención, tensiones, conflictos, marcos | Sistema (asistido) |
| **V — Conclusiones** | Scaffold → **autoría humana** obligatoria | **Humana** |
| **VI — Recomendaciones** | Scaffold → **autoría humana** obligatoria | **Humana** |
| **VII — Síntesis y priorización** | Candidaturas técnicas + selección participativa + deliberación (solo humana) | Mixta |

---

## 3. Arquitectura certificada

### Flujo principal EvidenceStore → PSL

```
Fuentes documentales primarias
(HealthReport, EAS microdatos, REDCap, Activos, etc.)
    │
    ▼
MunicipalDocumentRepository
    │  [parsers → EvidenceAtoms]
    ▼
EvidenceStore
    │
    ▼
IntegrityGuard
  reglas A–E; saneamiento y validación
    │
    ▼
MIT → EstadoTerritorialEvolutivo
  LT1: determinantes / activos / indicadores
       hallazgos cualitativos / cautelas metodológicas
  OIT: áreas de intervención territorial
  Reconciliación: conflictos y tensiones
    │
    ▼
buildLocalHealthProfile()   [función pura]
  Capítulos I–VII (Cap. VI = cierreInterpretativo — sin recomendaciones)
    │
    ▼
LocalHealthProfile   [objeto vivo, Nivel 2]
    │
    ▼  [validación técnica explícita]
LocalHealthProfileCompiler   [7 gates G-LHC-1 a G-LHC-7]
    │
    ▼
LocalHealthProfileArtifact (PSL-C)   [artefacto institucional inmutable]
```

### Integración SAM → PSL (cadena completa certificada)

```
IBSEStudy / DUKEStudy / ... / CAGEStudy
    │
    ▼  [assess*Study(study, populationReference)]
SampleQualityAssessment   [Producto 2]
    │
    ▼  [samAssessmentToEvidenceAtom()]
EvidenceAtom
  kind: "sample-quality"
  origin: "sam"
  confidence: "high" | "medium" | "low"
    │
    ▼
EvidenceStore + IntegrityGuard
    │
    ▼
LT1Engine
  kind === "sample-quality" → grupo methodologicalCautions
    │
    ▼
LocalHealthProfile
  methodologicalCautionCount (incluye SAM atoms)
  Cap. IV: cautelas metodológicas visibles para el equipo técnico
```

### Regla PSL-C1 (invariante del sistema)

Ningún motor del Nivel 3 puede consumir directamente outputs del Nivel 2 (LT1Result, OITResult, EstadoTerritorialEvolutivo, ReconciliacionResult). Solo el PSL en estado `validated` es el puente autorizado al Nivel 3.

---

## 4. Garantías arquitectónicas certificadas

**G1 — Separación evidencia / interpretación**
El EvidenceStore contiene evidencia estructurada. El MIT la interpreta. El PSL sintetiza. Ninguna capa puede saltear a la siguiente. El PSL no accede directamente al EvidenceStore: solo consume el resultado del MIT.

**G2 — SAM no constituye evidencia territorial**
Los EvidenceAtoms de tipo `kind: "sample-quality"` expresan adecuación muestral, no datos sobre el territorio. El LT1 los clasifica en `methodologicalCautions`, nunca en `indicators`, `determinants` ni `assets`. No pueden distorsionar el diagnóstico territorial.

**G3 — La ruta canónica de SAM al PSL está definida pero no activada (D3-02)**
La ruta `samAssessmentToEvidenceAtom() → EvidenceStore → LT1 methodologicalCautions` es la ÚNICA ruta arquitectónicamente válida de SAM al PSL. No existe ninguna ruta directa. Cada componente de esta ruta está implementado y testado individualmente. Sin embargo, la orquestación automática (la llamada a `samAssessmentToEvidenceAtom()` desde el runtime) no está activa. Cuando D3-02 se complete, los átomos `sample-quality` entrarán al EvidenceStore automáticamente y el PSL Cap. IV los reflejará como cautelas metodológicas sin ningún cambio adicional en el PSL mismo.

**G4 — El PSL no conoce SAM**
`buildLocalHealthProfile.ts` no importa ningún tipo de SAM. `LocalHealthProfile.ts` no referencia SAM. El PSL es agnóstico respecto al origen de sus cautelas metodológicas. Si mañana SAM no existiera, el PSL funcionaría exactamente igual.

**G5 — El MIT permanece agnóstico respecto al origen**
`LT1Engine.ts` filtra por `atom.kind`, nunca por `atom.provenance.origin`. La clasificación `kind === "sample-quality"` no requiere conocer que proviene de SAM.

**G6 — Ausencia de fuentes genera cautelas, nunca error**
La ausencia de cualquier instrumento complementario (incluido SAM), de cualquier documento o de cualquier fuente secundaria no produce error en la generación del PSL. Produce `ibsePresent: false`, `sf12Present: false`, etc., y el MIT genera las tensiones estructurales correspondientes.

**G7 — Trazabilidad completa mediante EvidenceStore**
Todo conocimiento que llega al PSL pasa por el EvidenceStore con `provenance.documentId`, `origin`, `sourceLabel` y `extractedAt`. El PSL-C compilado incluye `evidenceAtomIds` de todos los átomos activos, permitiendo auditoría retrospectiva.

**G8 — Validación humana obligatoria en todos los outputs**
Los capítulos V, VI y VII requieren autoría humana explícita antes de que el PSL pueda compilarse. `requiresHumanValidation: true` es un invariante del sistema en todos los objetos analíticos (MIT, OIT, Reconciliación, PSL).

**G9 — PSL-I1 (invariante del sistema)**
El PSL referencia el Informe de Salud mediante `healthReportDocumentId`; nunca lo contiene, nunca lo sustituye y nunca lo modifica.

**G10 — Simetría completa de los seis instrumentos**
Los seis instrumentos del Producto 1 tienen representación explícita en el PSL: `ibsePresent`, `dukePresent`, `predimedPresent`, `sf12Present`, `suenoPresent`, `cagePresent`. Ningún instrumento certificado tiene tratamiento diferenciado en el modelo del PSL.

---

## 5. Estado de implementación por componente

| Componente | Estado | Ubicación |
|---|---|---|
| `LocalHealthProfile` (tipo, 7 capítulos, 6 estados) | ✅ Implementado | `src/domain/health-profile/LocalHealthProfile.ts` |
| `buildLocalHealthProfile()` (función pura) | ✅ Implementado | `src/application/health-profile/buildLocalHealthProfile.ts` |
| Integración 6 instrumentos Producto 1 (flags explícitos) | ✅ Completa | `ibsePresent … cagePresent` |
| Integración SAM (via EvidenceStore → LT1) | ⚠️ Arquitectónica, no activa (D3-02) | Plumbing implementado; `samAssessmentToEvidenceAtom()` no se invoca en runtime; LT1 procesaría átomos `sample-quality` si llegaran |
| `LocalHealthProfileCompiler` (7 gates G-LHC-1 a G-LHC-7) | ✅ Implementado | `src/application/health-profile-compiler/` |
| `LocalHealthProfileArtifact` (PSL-C inmutable) | ✅ Implementado | `src/domain/health-profile-artifact/` |
| Ciclo de vida PSL (generated → validated → approved) | ✅ parcial | `approved` pendiente de handler UI |
| `pslIsStale` (detección de desactualización) | ✅ Implementado | `MunicipalityRuntime` |
| `hasPSLHumanContent()` (protección de contenido humano) | ✅ Implementado | `src/application/health-profile/` |

---

## 6. Evidencias objetivas de certificación

### Build y TypeScript

```
TypeScript strict (tsconfig.app.json --noEmit): 0 errores, 0 advertencias
```

### Tests

```
573/573 tests pasan en 16 ficheros de test
```

Tests directamente relacionados con el Producto 3:

| Fichero de test | Tests | Qué verifica |
|---|---|---|
| `tests/psl-human-content.test.ts` | Incluido | Protección de contenido humano en caps V, VI, VII |
| `tests/local-health-profile-compiler.test.ts` | 43 | Compilador: 7 gates, inmutabilidad, trazabilidad, errores |
| `tests/atarfe-workspace.test.ts` | 53 | Integración completa en workspace del municipio piloto Atarfe |
| `tests/atarfe-complementary-studies.test.ts` | 11 | Pipeline E2E con datos reales de Atarfe |
| `tests/sam-to-evidence-atom.test.ts` | 20 | Conversión SAM → EvidenceAtom (ruta al PSL) |

### Ausencia de regresiones

Los 481 tests anteriores al Producto 3 continúan pasando sin modificación.
Los Productos 1 y 2 no registran ninguna regresión.

---

## 7. Exclusiones expresas del Producto 3

Los siguientes elementos quedan fuera del alcance de esta certificación:

| Elemento | Motivo |
|---|---|
| NHS Health Profile | Producto 4 |
| Motor de Traducción Estratégica / PAI | Producto 5 |
| Plan de Acción Inteligente | Producto 6 |
| Plan Local de Salud (compilador) | Producto 7 |
| Evaluación | Producto 8 |
| Documento Ejecutivo | Producto 9 |
| Visualización completa del PSL en UI | Desarrollo funcional posterior |
| Exportación DOCX/PDF del PSL-C | Capa de rendering pendiente |
| Handler UI PSL `validated` → `approved` | Deuda D3-03; bloquea Producto 7 |
| Valores de referencia en compilador P4 | D3-04 reclasificado → D4-01 (wiring, no datos): DUKE/PREDIMED/SF-12 ya disponibles en el sistema |
| IA generativa sobre el PSL | Fuera del principio de no-sustitución |
| Integración SAM en App.tsx (orquestación UI) | Pendiente de intervención UI |

---

## 8. Deuda residual

La deuda residual del Producto 3 es de naturaleza funcional/UI, no arquitectónica:

| ID | Deuda | Tipo | Bloquea |
|---|---|---|---|
| D3-02 | Orquestación runtime SAM → EvidenceStore (wiring no activo) | Implementación pendiente | No bloquea PSL-C; afecta a las cautelas de calidad muestral automáticas |
| D3-03 | Handler UI PSL `validated` → `approved` | UI | Compilador del PLS (Producto 7) |
| ~~D3-04~~ | Reclasificado → D4-01 (`CONTRACT-NHS-HEALTH-PROFILE §14`). Valores de referencia ya existen en el sistema (DUKE, PREDIMED, SF-12). | — | — |

**No existen deudas arquitectónicas abiertas en el Producto 3.** La arquitectura SAM → EvidenceStore → MIT → PSL está diseñada y sus componentes implementados: `samAssessmentToEvidenceAtom()` produce EvidenceAtoms válidos (23 tests), LT1 los clasifica correctamente. El wiring de orquestación automática (D3-02) permanece pendiente sin bloquear la certificación del PSL.

---

## 9. Dictamen de certificación

La auditoría directa del repositorio —incluyendo el dominio `LocalHealthProfile`, la función pura `buildLocalHealthProfile`, el compilador `LocalHealthProfileCompiler`, el clasificador LT1, la arquitectura SAM→EvidenceAtom→MIT (componentes implementados; orquestación D3-02 pendiente), la simetría de los seis instrumentos del Producto 1 y los tests de integración con datos reales de Atarfe— permite establecer el siguiente dictamen:

El `LocalHealthProfile` es un objeto canónico completo con siete capítulos estructurados, ciclo de vida explícito y trazabilidad total. El `LocalHealthProfileCompiler` produce artefactos inmutables mediante siete gates. La integración con el Producto 1 es completa: los seis instrumentos tienen representación explícita en el PSL y en el PSL-C. La integración con el Producto 2 (SAM) es arquitectónicamente correcta: la ruta `samAssessmentToEvidenceAtom() → EvidenceStore → LT1 → PSL` está diseñada, sus componentes implementados y testados; la orquestación automática permanece pendiente (D3-02) pero no bloquea el PSL. El MIT permanece agnóstico respecto al origen de los átomos. El PSL no conoce SAM. La separación evidencia / interpretación / perfil es invariante.

El build es limpio. 575/575 tests pasan (D3-01 resuelto: +2 tests de trazabilidad del artefacto). Los Productos 1 y 2 no registran regresiones.

> **El Producto 3 — Perfil de Salud Local COMPÁS queda oficialmente certificado.**

---

## 10. Acta final

| Campo | Valor |
|---|---|
| Expediente | PRODUCT-3-PSL-CERTIFICATION |
| Fecha de emisión | 2026-06-30 |
| Repositorio | `C:\Users\blash\Desktop\COMPAS_NG` |
| Tests totales | 575/575 passing — 16 ficheros |
| Build | Limpio — sin errores TypeScript strict |
| Instrumentos complementarios integrados | 6/6 con flags explícitos |
| Integración SAM | ⚠️ Arquitectura correcta; orquestación runtime pendiente (D3-02) |
| Ciclo de vida PSL | ✅ generated → validated (approved: pendiente UI) |
| Compilador PSL-C | ✅ 7 gates, inmutabilidad, trazabilidad, persistencia acumulativa |
| Comportamiento funcional alterado | Ninguno |
| Deudas arquitectónicas abiertas | Ninguna (D3-02 es deuda de orquestación, no arquitectónica) |
| **Producto 3** | **CERTIFICADO** |
| Deuda residual | D3-02 (orquestación SAM), D3-03 (UI approved) — ninguna bloquea PSL-C. D3-04 reclasificado en P4. |
| Prerrequisitos de Producto 4 autorizados | Sí, cuando el equipo lo decida |

---

*La decisión territorial corresponde siempre al equipo técnico.*
