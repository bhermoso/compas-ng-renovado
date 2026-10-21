# CONTRACT-PSL-COMPÁS

> Contrato canónico del Producto 3 — Perfil de Salud Local COMPÁS (PSL-C).
> Versión 1.0 — Producto 3 — 2026-06-30

---

## Estado

**Núcleo implementado. Integración con Productos 1 y 2 parcialmente pendiente.**

El `LocalHealthProfile` (objeto analítico vivo) y el `LocalHealthProfileCompiler` (compilador) están implementados y certificados en Sprint 2.1. Este contrato formaliza el Producto 3 como producto institucional en el catálogo de COMPÁS NG, incorpora la relación con los Productos 1 y 2 certificados y establece las fronteras arquitectónicas pendientes.

**Implementado:**
- `src/domain/health-profile/LocalHealthProfile.ts` — tipo canónico del objeto vivo
- `src/application/health-profile/buildLocalHealthProfile.ts` — función pura; cobertura dimensional adaptativa (sin recuento obligatorio de capítulos)
- `src/application/health-profile-compiler/LocalHealthProfileCompiler.ts` — compilador certificado
- `src/domain/health-profile-artifact/LocalHealthProfileArtifact.ts` — artefacto PSL-C

**Pendiente de integración:**
- Cautelas SAM (Producto 2) como campo explícito del PSL
- Integración formal de `SampleQualityAssessment` en el pipeline PSL

*(Los flags `sf12Present`, `suenoPresent`, `cagePresent` — D3-01 — están resueltos. Los 13 instrumentos vigentes tienen flag de presencia en `LocalHealthProfile`.)*

---

## 1. Naturaleza del Producto 3

El **Perfil de Salud Local COMPÁS (PSL-C)** es el producto analítico territorial que sintetiza el diagnóstico disponible del municipio. Es la primera representación oficial del estado de salud del territorio que puede entregarse al Distrito Sanitario, a la Junta de Andalucía y a la ciudadanía.

El PSL-C **no es un plan**. No prescribe actuaciones. No selecciona prioridades institucionales. No asigna líneas estratégicas. No produce compromisos de planificación. No decide.

El PSL-C **no sustituye al equipo técnico**. Los capítulos de conclusiones (V) y cierre interpretativo (VI) son scaffold orientativo hasta que el equipo técnico los redacte y autorice explícitamente. **El PSL concluye, pero no recomienda**: las recomendaciones pertenecen al Motor de Traducción Estratégica y al Plan de Acción.

El PSL-C es la condición necesaria para activar el Nivel 3 del ciclo de planificación. Ningún motor del Nivel 3 puede consumir directamente los outputs del MIT; todos deben pasar por el PSL (regla PSL-C1).

---

## 2. Fuentes que el PSL puede consumir

La ausencia de cualquier fuente no invalida el PSL. Cada fuente ausente genera una cautela metodológica explícita.

### 2.1 Fuentes primarias institucionales

| Fuente | Estado | Cómo entra al PSL |
|---|---|---|
| Informe de Salud / Health Report | ✅ Implementada | Referenciado por `documentId`; nunca embebido |
| EvidenceStore saneado | ✅ Implementado | Vía MIT → `buildLocalHealthProfile` |

### 2.2 Estudios Complementarios — Producto 1 (13 instrumentos)

Los trece instrumentos del Producto 1 contribuyen al PSL a través del EvidenceStore. Sus átomos de evidencia son procesados por el MIT y se reflejan en los Capítulos III y IV del PSL.

Los seis instrumentos originales (`ibsePresent`, `dukePresent`, `predimedPresent`, `sf12Present`, `suenoPresent`, `cagePresent`) tienen flag **obligatorio** en `LocalHealthProfile`. Los siete instrumentos adicionales (`auditcPresent`, `ipaqPresent`, `ghq12Present`, `phq9Present`, `psqiPresent`, `fagerstromPresent`, `sbqPresent`) tienen flag **opcional** (`boolean | undefined`). `complementaryStudyCount` recoge el total de instrumentos presentes.

| Instrumento | Tag canónico | Flag en LocalHealthProfile |
|---|---|---|
| IBSE | `ibse` | `ibsePresent: boolean` |
| DUKE-EAS | `duke-eas` | `dukePresent: boolean` |
| PREDIMED-EAS | `predimed-eas` | `predimedPresent: boolean` |
| SF-12 EAS | `sf12-eas` | `sf12Present: boolean` |
| Sueño EAS | `sueno-eas` | `suenoPresent: boolean` |
| CAGE-EAS | `cage-eas` | `cagePresent: boolean` |
| IPAQ-EAS | `ipaq-eas` | `ipaqPresent?: boolean` |
| AUDIT-C | `auditc` | `auditcPresent?: boolean` |
| GHQ-12 | `ghq12` | `ghq12Present?: boolean` |
| PHQ-9 | `phq9` | `phq9Present?: boolean` |
| PSQI | `psqi` | `psqiPresent?: boolean` |
| Fagerström | `fagerstrom` | `fagerstromPresent?: boolean` |
| SBQ | `sbq` | `sbqPresent?: boolean` |

### 2.3 Sistema de Ajuste Muestral — Producto 2 (SAM NG)

El motor SAM produce `SampleQualityAssessment` para cada instrumento, evaluando la calidad muestral mediante Cochran + FPC respecto a la población de referencia.

**Rol en el PSL:**
- Las cautelas metodológicas de SAM son información sobre la calidad de la evidencia, no evidencia territorial en sí mismas.
- No entran al EvidenceStore como `EvidenceAtom kind: "sample-quality"` todavía.
- Se incorporan al PSL como **cautelas adicionales en el Capítulo III** (Diagnóstico integrado) y en el **Capítulo IV** (cautelas metodológicas del territorialSummary).

**Vía de integración futura (dos opciones disponibles):**

| Opción | Mecanismo | Estado |
|---|---|---|
| A (recomendada) | SAM → `EvidenceAtom kind: "sample-quality"` → EvidenceStore → MIT → PSL | Pendiente: generación de EvidenceAtoms desde SAM |
| B (directa) | SAM assessments como input adicional a `buildLocalHealthProfile` | Requiere ampliar `BuildLocalHealthProfileInput` |

Hasta que se implemente alguna de las dos opciones, el PSL puede ser construido sin los resultados SAM. La ausencia de cautelas SAM no bloquea la generación del PSL.

### 2.4 Otras fuentes actuales

| Fuente | Estado | Contribución al PSL |
|---|---|---|
| Activos Comunitarios | ✅ Implementada | EvidenceAtoms `kind: "asset"` vía EvidenceStore |
| Priorización Temática | ✅ Implementada | Cap. VII: `tematicasSeleccionadasIds`, `hasParticipatorySelection` |
| Evidencia longitudinal | ✅ Implementada (átomos) | `longitudinalActive`, `longitudinalNote`, `longitudinalEvidenceCount` |
| Entrada manual | ✅ Disponible | EvidenceAtoms `origin: "manual-entry"` vía EvidenceStore |

### 2.5 Fuentes futuras (no implementadas)

| Fuente | Estado | Bloquea PSL |
|---|---|---|
| Indicadores territoriales (CMI) | ⏳ Pendiente | No |
| Datos REDCap de cuestionario municipal generado | ⏳ Pendiente | No |
| StrategicRepository | ⏳ Pendiente | No (entraría en Cap. I) |
| EAS municipales (no provinciales) | ⏳ Pendiente | No |

---

## 3. Separación arquitectónica

El PSL ocupa la posición de síntesis entre el Nivel 1 (evidencia) y el Nivel 3 (decisión). Esta posición es estricta e invariante.

```
Nivel 0 — Fuentes documentales
  HealthReport, HealthReport PDF, EAS microdatos, REDCap, Activos, etc.
      │
      ▼
Nivel 1 — Evidencia estructurada
  EvidenceStore (EvidenceAtoms por origen, tipo y municipio)
  IntegrityGuard (saneamiento y validación)
      │
      ▼
Nivel 1.5 — Evaluación metodológica transversal
  SAM (SampleQualityAssessment — calidad muestral de cada instrumento)
      │ [pendiente de integración como fuente del PSL]
      │
      ▼
Nivel 2 — Interpretación territorial
  MIT (EstadoTerritorialEvolutivo)
  Reconciliación (ConflictoInterpretativo, TensionAnalizada)
      │
      ▼
Nivel 2 — Perfil de Salud Local (PSL) ← PRODUCTO 3
  LocalHealthProfile (objeto vivo; cobertura dimensional adaptativa)
  LocalHealthProfileArtifact (PSL-C, artefacto compilado inmutable)
      │
      ▼ [PSL-C1: único puente autorizado al Nivel 3]
Nivel 3 — Decisión y planificación
  Priorización temática
  Motor de Traducción Estratégica (MTE) ← Producto 5
  Plan de Acción ← Producto 6
  Plan Local de Salud compilado ← Producto 7
```

### 3.1 Qué el PSL sintetiza e interpreta

- Organiza la evidencia disponible en una **lectura institucional canónica única y
  adaptativa** cuya extensión y número de secciones dependen de la riqueza y solidez
  del expediente (Fundamentos del Perfil único, `CONTRACT-INDEX` 2026-07-17). **No
  hay recuento obligatorio de capítulos.**
- Proporciona un resumen territorial asistido (MIT).
- Identifica áreas de intervención candidatas (no las aprueba).
- Referencia cautelas metodológicas (SAM, MIT, IntegrityGuard).
- Contiene conclusiones diagnósticas y cierre interpretativo de autoría humana.

### 3.2 Qué el PSL NO hace

- No traduce automáticamente evidencia a objetivos estratégicos.
- No genera compromisos de actuación.
- No asigna responsables, plazos ni presupuesto.
- No abre el Motor de Traducción Estratégica (MTE).
- No modifica el EvidenceStore.
- No contiene el texto del Informe de Salud.
- No prioriza institucionalmente (el cap. VII recoge candidaturas técnicas, no decisiones).

---

## 4. Cobertura conceptual del LocalHealthProfile (no recuento obligatorio)

> **Rigidez numérica derogada** por los Fundamentos del Perfil único
> (`CONTRACT-INDEX`, 2026-07-17). La tabla siguiente describe las **dimensiones de
> conocimiento** que la lectura canónica cubre *cuando el expediente lo sostiene*;
> **no fija un número obligatorio** de capítulos ni una estructura «congelada». La
> lectura es única y adaptativa: una dimensión sin evidencia suficiente se comprime o
> no aparece. El objeto de dominio `LocalHealthProfile` puede conservar estos campos
> como andamiaje interno; su *proyección editorial* es adaptativa.

| Dimensión (cobertura) | Contenido | Autoría |
|---|---|---|
| **I — Marco estratégico** | IDs de secciones del StrategicFramework (EPVSA, RELAS, ESCA, etc.) | Sistema |
| **II — Informe de Salud** | Referencia por `documentId` y título; nunca el texto | Sistema |
| **III — Diagnóstico integrado** | Stats del EvidenceStore: total átomos, por origen, por tipo, ids, errores | Sistema |
| **IV — Interpretación territorial** | MIT + Reconciliación: resumen, determinantes, activos, indicadores, áreas intervención, tensiones, conflictos, marcos | Sistema (asistido) |
| **V — Conclusiones** | Scaffold → **Autoría humana** obligatoria antes de validar | **Humana** |
| **VI — Cierre interpretativo** | Alcance, limitaciones y síntesis metodológica del diagnóstico. Scaffold → **Autoría humana** obligatoria antes de validar. Sin prescripción de acciones. | **Humana** |
| **VII — Síntesis y priorización** | Candidaturas técnicas + selección participativa + deliberación (solo humana) | Mixta |

### 4.1 Campos de diagnóstico integrado (Cap. III) — estado actual vs. objetivo

| Campo | Estado | Nota |
|---|---|---|
| `ibsePresent` | ✅ Implementado | Obligatorio |
| `dukePresent` | ✅ Implementado | Obligatorio |
| `predimedPresent` | ✅ Implementado | Obligatorio |
| `sf12Present` | ✅ Implementado | Obligatorio (D3-01 resuelto) |
| `suenoPresent` | ✅ Implementado | Obligatorio (D3-01 resuelto) |
| `cagePresent` | ✅ Implementado | Obligatorio (D3-01 resuelto) |
| `ipaqPresent` | ✅ Implementado | Opcional (`boolean \| undefined`) |
| `auditcPresent` | ✅ Implementado | Opcional (`boolean \| undefined`) |
| `ghq12Present` | ✅ Implementado | Opcional (`boolean \| undefined`) |
| `phq9Present` | ✅ Implementado | Opcional (`boolean \| undefined`) |
| `psqiPresent` | ✅ Implementado | Opcional (`boolean \| undefined`) |
| `fagerstromPresent` | ✅ Implementado | Opcional (`boolean \| undefined`) |
| `sbqPresent` | ✅ Implementado | Opcional (`boolean \| undefined`) |
| `samAssessments[]` | ❌ No existe | Pendiente (D3-02) |
| `complementaryStudyCount` | ✅ Implementado | Total de instrumentos presentes |

### 4.2 Secciones del LocalHealthProfileArtifact (PSL-C compilado)

Las secciones del artefacto compilado están definidas en `CONTRACT-LOCAL-HEALTH-PROFILE-COMPILER.md §6`. No se duplican aquí.

---

## 5. Relación con los Productos anteriores

### Producto 1 — Sistema de Estudios Complementarios

Los trece instrumentos aportan EvidenceAtoms al EvidenceStore. El MIT los procesa. El PSL los refleja en los Capítulos III y IV. Los seis instrumentos originales tienen flag `boolean` obligatorio; los siete adicionales tienen flag `boolean | undefined` opcional.

**La integración es completa** para la vía EvidenceStore → MIT → PSL.

Los parsers, algoritmos y agregados de los instrumentos NO son modificados por el PSL en ningún caso.

### Producto 2 — SAM NG

SAM produce evaluaciones de calidad muestral (`SampleQualityAssessment`) para cada instrumento. Su rol en el PSL es metodológico, no territorial:

- Informa sobre la adecuación del tamaño muestral, no sobre el territorio.
- Sus cautelas son contexto para interpretar la evidencia, no evidencia en sí.
- `requiresHumanValidation: true` (invariante de SAM) es coherente con el principio de no-sustitución del equipo técnico.

**La integración está pendiente**: el PSL actualmente no consume `SampleQualityAssessment`. El path de integración recomendado (opción A: via EvidenceAtoms de tipo `sample-quality`) requiere implementar la generación de EvidenceAtoms desde SAM (actualmente reservado en dominio como `EvidenceOrigin: "sam"`).

---

## 6. Exclusiones del Producto 3

Los siguientes elementos quedan explícitamente fuera de este producto:

| Elemento | Motivo de exclusión |
|---|---|
| Generación automática de texto narrativo (IA generativa) | Principio de no-sustitución del equipo técnico |
| NHS Health Profile | Producto 4 separado |
| Motor de Traducción Estratégica (MTE) | Producto 5 |
| Plan de Acción | Producto 6 |
| Plan Local de Salud compilado | Producto 7 |
| Evaluación del plan | Producto 8 |
| Scoring automático de prioridades | Viola PSL-C1 y principio deliberativo |
| EvidenceAtom `kind: "sample-quality"` (generación) | Pendiente Producto 2 ampliado |
| UI específica del PSL más allá de lo existente | Pendiente de diseño |
| Exportación DOCX/PDF del PSL-C | Capa de rendering pendiente |
| Circuito Survey→EvidenceStore (Hueco H-2) | Requisito del Constructor Metodológico |

---

## 7. Criterio de completitud del Producto 3

El Producto 3 se considera completo cuando:

| Criterio | Estado |
|---|---|
| `LocalHealthProfile` con cobertura dimensional adaptativa (sin recuento obligatorio) | ✅ |
| `buildLocalHealthProfile` función pura certificada | ✅ |
| `LocalHealthProfileCompiler` con 7 gates implementado | ✅ |
| Ciclo de vida PSL (generated → validated → approved) implementado | ✅ parcial (`approved` sin UI handler) |
| Los 13 instrumentos del Producto 1 representados en PSL | ✅ 6 obligatorios + 7 opcionales |
| SAM assessments accesibles desde el PSL como cautelas | ❌ Pendiente |
| PSL-C compilable y persistible acumulativamente | ✅ |

---

## 8. Deuda registrada

| ID | Deuda | Tipo | Bloquea |
|---|---|---|---|
| ~~D3-01~~ | ~~Flags explícitos de SF-12, Sueño y CAGE en `LocalHealthProfile`~~ | **RESUELTO 2026-06-30**: `sf12Present`, `suenoPresent`, `cagePresent` presentes en `LocalHealthProfile` y en `PSLCArtifactBaseDocumental`; compilador actualizado. | — |
| D3-02 | Integración de `SampleQualityAssessment` en PSL (opción A o B) | Implementación pendiente | Cautelas metodológicas de calidad muestral en PSL |
| D3-03 | Handler UI de transición PSL `validated` → `approved` | Implementación UI | Acceso al compilador del Producto 7 (PLS) |
| ~~D3-04~~ | ~~Datos de referencia Granada/Andalucía en paneles EAS~~ | **RECLASIFICADO 2026-06-30**: los valores de referencia ya existen en el sistema para DUKE (EAS Granada, 49,2), PREDIMED (EAS Granada, 7,6) y SF-12 (España, 50±10). La deuda no es de disponibilidad de datos sino de wiring al compilador → trasladada a D4-01 en `CONTRACT-NHS-HEALTH-PROFILE`. | D3-04 cerrado |
| ~~D3-05~~ | ~~Capítulo VI "Recomendaciones" contradice la regla "el PSL concluye, pero no recomienda"~~ | **RESUELTO 2026-06-30**: `recomendaciones` eliminado del modelo; Cap. VI reemplazado por `cierreInterpretativo`; gates G-LHC-3 y G-LHC-7 actualizados. Superado en parte por CONTRACT-LOCAL-HEALTH-PROFILE-METHODOLOGY v1.4/v1.5 (2026-10-21): el Perfil concluye y orienta, no decide; las orientaciones técnicas entran por el menú elegible (Art. 16 ter). El modelo y los gates no se han alineado todavía. | — |

---

## 9. Invariantes

**PSL-I1** (de CONTRACT-MIT-PSL): el PSL referencia el Informe de Salud; nunca lo contiene, nunca lo sustituye y nunca lo modifica.

**PSL-C1** (de CONTRACT-MIT-PSL): ningún motor del Nivel 3 puede consumir directamente outputs del Nivel 2 (LT1, OIT, MIT, Reconciliación). Solo el PSL es el puente autorizado.

**PSL-P3-1 — Ausencia de fuente no es error**: la ausencia de cualquier instrumento complementario, SAM assessment o fuente secundaria no produce error en la generación del PSL. Produce cautelas metodológicas explícitas y conteos a cero.

**PSL-P3-2 — SAM no modifica evidencia territorial**: los resultados de SAM son contexto sobre la calidad muestral de los estudios, no evidencia del territorio. No alteran los resultados de los instrumentos. No afectan el diagnóstico territorial directamente.

**PSL-P3-3 — Los capítulos V, VI y VII requieren autoría humana para su uso productivo**: el sistema genera scaffold. La compilación en PSL-C solo es posible cuando V (conclusiones) y VI (cierre interpretativo) tienen `status: "authored"` y VII tiene `consensoDocumentado: true`.

---

## 10. Referencia cruzada

| Documento | Rol |
|---|---|
| `CONTRACT-MIT-PSL.md` | Define el MIT, la Reconciliación y el PSL como objeto analítico interno. Prevalece para definiciones de pipeline. |
| `CONTRACT-LOCAL-HEALTH-PROFILE-COMPILER.md` | Define el compilador PSL → PSL-C, los 7 gates y la estructura del artefacto compilado. |
| `CONTRACT-COMPLEMENTARY-STUDIES.md` | Define los 13 instrumentos del Producto 1 como fuentes del EvidenceStore. |
| `CONTRACT-DYNAMIC-TRIPYRAMID.md` | Define SAM (Producto 2) y la vía de integración futura como cautelas del PSL. |
| `CONTRACT-EVIDENCE-QUALITY.md` | Define las cuatro dimensiones de calidad de evidencia y cómo se mapean a `confidence` en EvidenceAtoms. |
| `CONTRACT-EVIDENCE.md` | Define EvidenceAtom, EvidenceStore e IntegrityGuard. |

---

*La decisión territorial corresponde siempre al equipo técnico.*
