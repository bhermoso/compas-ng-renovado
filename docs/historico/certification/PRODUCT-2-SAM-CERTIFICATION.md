# COMPÁS NG — Expediente de Certificación Institucional
## Producto 2 — Sistema de Ajuste Muestral (SAM NG)

> Documento oficial de arquitectura.
> No es un manual de usuario ni una guía de implementación.
> Deja constancia formal de que el Producto 2 existe, cuál es su alcance,
> qué garantiza, qué queda pendiente y por qué puede considerarse certificado.
> No puede modificarse salvo por decisión deliberada del responsable del proyecto.
> Fecha de emisión: 2026-06-29

---

## 1. Identificación

| Campo | Valor |
|---|---|
| **Nombre oficial** | Sistema de Ajuste Muestral (SAM NG) |
| **Código** | PRODUCT-2 |
| **Objetivo institucional** | Evaluar la adecuación del tamaño muestral de un instrumento de medición respecto a la población de referencia del municipio, produciendo un dictamen metodológico explícito que acompañe a la evidencia sin modificarla |
| **Fecha de emisión** | 2026-06-29 |
| **Estado** | **CERTIFICADO** |
| **Versión** | 1.0 |
| **Repositorio** | `C:\Users\blash\Desktop\COMPAS_NG` |
| **Prerrequisito certificado** | Producto 1 — Sistema de Estudios Complementarios (2026-06-29) |

---

## 2. Alcance certificado

### 2.1 Lo que comprende el Producto 2

#### Dominio SAM

Los siguientes tipos canónicos constituyen el contrato de datos del Producto 2:

| Tipo | Ubicación | Descripción |
|---|---|---|
| `PopulationReference` | `src/domain/sam/PopulationReference.ts` | Fuente Poblacional de Referencia: municipio, fuente INE/MTI-BDU, año, población total del grupo objetivo, etiqueta de edad |
| `SampleQualityAssessment` | `src/domain/sam/SampleQualityAssessment.ts` | Dictamen metodológico completo: nTheoretical, coverageGlobal, sampleQuality, rationale, cautelas, capacidades |
| `SampleQualityLevel` | `src/domain/sam/SampleQualityAssessment.ts` | Clasificación: `"high"` ∣ `"medium"` ∣ `"low"` |
| `CochranParams` | `src/domain/sam/SampleQualityAssessment.ts` | Parámetros de cálculo: confidence, marginOfError, expectedProportion |
| `DEFAULT_COCHRAN_PARAMS` | `src/domain/sam/SampleQualityAssessment.ts` | Z=1,96 (95 %), e=0,05, p=0,5 |
| `SampleCapabilities` | `src/domain/sam/SampleQualityAssessment.ts` | Capacidades computadas: canInferGlobalCoverage, canClassifyQuality |

#### Motor puro

| Componente | Ubicación | Descripción |
|---|---|---|
| `computeSampleQualityAssessment()` | `src/application/sam/computeSampleQualityAssessment.ts` | Función pura. Calcula n teórico (Cochran + FPC), cobertura, calidad, rationale y cautelas. Sin estado. Sin efectos secundarios. |

Algoritmo implementado:

```
n₀ = (Z² × p × (1−p)) / e²
      donde Z=1,96 (95%), p=0,5, e=0,05 → n₀ = 384,16

n = ⌈n₀ / (1 + (n₀−1) / N)⌉   [corrección de población finita — FPC]

coverageGlobal = (nObserved / n) × 100

sampleQuality:
  HIGH   si coverageGlobal ≥ 100 %
  MEDIUM si coverageGlobal ≥  60 %
  LOW    si coverageGlobal <  60 %
```

#### Capa de integración

| Función | Instrumento | Campo `nObserved` |
|---|---|---|
| `assessDUKEStudy()` | DUKE-EAS | `aggregates.nValidGlobal` |
| `assessPREDIMEDStudy()` | PREDIMED-EAS | `aggregates.nValid` |
| `assessSF12Study()` | SF-12 EAS | `aggregates.nValidPCS` (campo canónico primario) |
| `assessSuenoStudy()` | Sueño EAS | `aggregates.nValidP33R` (campo canónico primario) |
| `assessCAGEStudy()` | CAGE-EAS | `aggregates.nValidCAGER` (campo canónico primario) |
| `assessIBSEStudySAM()` | IBSE (gobernada por `sampleScope`) | `aggregates.nValid` (o `strataCounts.*.nValid` en muestra mixta con desglose) |

Todas las funciones siguen el mismo patrón:

```
Estudio (dominio existente, sin modificar)
    │
    ▼
assessStudy(study, populationReference)
    │   [extrae nObserved del campo canónico]
    │   [no modifica el estudio ni sus agregados]
    │
    ▼
computeSampleQualityAssessment()
    │   [motor genérico y único]
    │
    ▼
SampleQualityAssessment
```

#### Fixtures poblacionales

| Fixture | Fuente | Grupo | N | Uso |
|---|---|---|---|---|
| `fixtures/population/atarfe-population-2022.ts` | Padrón Municipal de Habitantes — INE, 1 enero 2022 | ≥16 años | 15.472 | Estudios EAS adultos + IBSE de 16 o más |
| `fixtures/population/atarfe-under16-population-2025.ts` | MTI-BDU — Poblaciones por Edad, 31 dic. 2025 | 6–15 años | 2.323 | Referencia de menores para IBSE `under-16` (Cochran 330) |
| `fixtures/population/atarfe-school-population-2025.ts` | MTI-BDU — Poblaciones por Edad, 31 dic. 2025 | 6–17 años | 2.847 | Universo escolar documental (NO usado como referencia SAM) |

Los tres fixtures contienen datos reales verificados mediante automatización COM sobre los archivos Excel fuente del repositorio.

#### Integración IBSE — evaluación gobernada por el discriminador de muestra

Corrección metodológica (revisión 2026-07-16): la evaluación SAM del IBSE depende
del universo etario REAL de la muestra (`IBSEStudy.sampleScope`), no de una doble
evaluación que reutilizaba el mismo `nValid` total contra dos poblaciones (el
antiguo par `assessIBSEStudy16Plus` / `assessIBSEStudyFull`, retirado). `assessIBSEStudySAM(study, refs)` devuelve un `IBSESAMResult`:

| `sampleScope` | Referencia usada | `instrumentId` | Resultado |
|---|---|---|---|
| `"16-plus"` | Adultos ≥16 (EAS) | `"ibse-16plus"` | Un dictamen (solo 16+) |
| `"under-16"` | Menores (universo escolar) | `"ibse-under16"` | Un dictamen (solo menores) |
| `"mixed"` **con** `strataCounts` válidos | Ambas, cada estrato con SU `nValid` | ambos | Dos dictámenes por estrato |
| `"mixed"` **sin** desglose | — | — | **No evaluable por estrato** |
| `"unknown"` (legacy) | — | — | **No evaluable por estrato** |

Regla invariable: **nunca** se reutiliza el `nValid` total para evaluar
simultáneamente a menores y a 16+. Una muestra de 16 o más comparte el **universo
poblacional de referencia** con la EAS (adultos ≥16), no sus datos ni su muestra.

**Caso Atarfe (INE 18022):** el CSV `ibse-atarfe.csv` es una muestra **mixta** sin
desglose etario; por tanto SAM se muestra como **no evaluable por estrato con este
export**. La ausencia de SAM etario no invalida el estudio: el IBSE sigue siendo un
+1 municipal válido para la regla N+1.

**La diferencia pertenece al contexto de evaluación, no al instrumento.** El instrumento IBSE es uno; las preguntas sobre representatividad son dos porque los universos de referencia son distintos: la población adulta municipal y la población escolar municipal.

### 2.2 Lo que NO forma parte del Producto 2

| Elemento | Razón de exclusión |
|---|---|
| Visualización Tripirámide Dinámica | Representación visual futura; motor disponible |
| Persistencia en `MunicipalityWorkspace` | Los resultados SAM se calculan on-demand; persistencia futura si se requiere |
| Generación de `EvidenceAtom kind="sample-quality"` | Reservado en dominio (`EvidenceOrigin: "sam"`); no instanciado todavía |
| Integración con MIT | El MIT no consume `SampleQualityAssessment`; consume `EvidenceStore` |
| Integración con PSL | El PSL no consume `SampleQualityAssessment` directamente |
| Integración con Plan de Acción | SAM es diagnóstico metodológico, no planificación |
| MAL (Capa de Evaluación Metodológica) | Arquitectura futura; no requerida para Producto 2 |
| Estratificación por subgrupos de edad/sexo | Futura |
| Ponderación de subpoblaciones | Futura |
| Desplazamiento de estimaciones | Futuro |
| Comparación longitudinal | Futura |
| Fixtures poblacionales para municipios distintos de Atarfe | Por municipio, según disponibilidad de datos |

---

## 3. Arquitectura certificada

SAM es una **capacidad metodológica transversal**, no un módulo de ningún instrumento específico. Evalúa la calidad muestral de cualquier fuente cuantitativa respecto a una Fuente Poblacional de Referencia.

```
                    ┌──────────────────────────────────┐
                    │     PopulationReference          │
                    │  (municipio, fuente, N, año)     │
                    └─────────────────┬────────────────┘
                                      │
                         ┌────────────┴────────────┐
                         │                         │
                    ┌────▼────┐             ┌─────▼──────┐
                    │ Estudio │             │  Fixture   │
                    │ (sin    │             │ poblacional│
                    │ cambios)│             │ verificado │
                    └────┬────┘             └────────────┘
                         │
                    ┌────▼────────────────┐
                    │  assess*Study()     │
                    │  (adaptador tipado) │
                    │  extrae nObserved   │
                    └────┬────────────────┘
                         │
                    ┌────▼────────────────────────────────────┐
                    │  computeSampleQualityAssessment()        │
                    │  Motor puro genérico                     │
                    │  Cochran → n₀ → FPC → n teórico         │
                    │  coverageGlobal → sampleQuality          │
                    │  rationale + cautelas metodológicas      │
                    └────┬────────────────────────────────────┘
                         │
                    ┌────▼──────────────────┐
                    │  SampleQualityAssessment │
                    │  (dictamen canónico)     │
                    │  requiresHumanValidation │
                    │  = true (siempre)        │
                    └──────────────────────────┘
```

---

## 4. Garantías certificadas

**G1 — Motor genérico y único**
`computeSampleQualityAssessment()` no tiene conocimiento de ningún instrumento específico. Recibe `nObserved` y `PopulationReference`; el tipo de estudio es indiferente. Las funciones `assess*Study()` son adaptadores, no extensiones del motor.

**G2 — Principio de no modificación**
SAM no modifica ningún resultado de ningún instrumento. Un estudio con muestra baja (`sampleQuality: "low"`) produce sus átomos de evidencia con sus valores reales. SAM añade contexto metodológico; no altera la evidencia. Los 553 tests pasan sin regresión.

**G3 — Inmutabilidad del objeto de entrada**
`computeSampleQualityAssessment()` y todas las funciones `assess*Study()` son funciones puras: no mutan el objeto de estudio recibido ni la `PopulationReference`. Verificado en tests de inmutabilidad.

**G4 — `requiresHumanValidation: true` siempre**
Este campo es un literal constante (`true`) en el tipo `SampleQualityAssessment`. Ninguna serialización puede omitirlo ni convertirlo a `false`. El dictamen SAM nunca puede presentarse como validado automáticamente.

**G5 — Corrección de población finita siempre activa**
La FPC se aplica en todos los cálculos, sin posibilidad de omitirla. Esto garantiza que municipios pequeños (N < 5.000) reciben estimaciones más ajustadas que la fórmula Cochran sin corrección.

**G6 — Cautelas metodológicas automáticas y calibradas**
Cada `SampleQualityAssessment` incluye cautelas específicas según el nivel de calidad (LOW/MEDIUM) y dos cautelas estándar para todos los niveles: referencia a la fuente poblacional y recordatorio de no-modificación. Verificado en tests de cautelas.

**G7 — Conversión canónica a EvidenceAtom**
`samAssessmentToEvidenceAtom()` convierte un `SampleQualityAssessment` en un `EvidenceAtom` con `kind: "sample-quality"` y `origin: "sam"`, completando el patrón arquitectónico del Producto 1. La conversión es una función pura que no muta el assessment de entrada. El motor SAM permanece sin conocimiento del EvidenceAtom; la conversión vive exclusivamente en la capa de aplicación.

**G8 — Semántica correcta de la clasificación**
La clasificación `sampleQuality: "high" | "medium" | "low"` expresa la **adecuación del tamaño muestral observado respecto al tamaño muestral teórico** calculado mediante Cochran+FPC para una población de referencia determinada. No expresa calidad científica global del instrumento ni validez del estudio. Esta distinción está documentada en el `sampleQualityRationale` de cada dictamen.

---

## 5. Evidencias objetivas de certificación

### Build

```
TypeScript strict (tsconfig.app.json --noEmit): 0 errores, 0 advertencias
Vite build: ✓ 449 módulos transformados — sin errores — sin errores TypeScript
```

### Tests

```
573/573 tests pasan en 16 ficheros de test
```

Tests que verifican directamente el Producto 2:

| Fichero de test | Tests | Qué verifica |
|---|---|---|
| `tests/sam.test.ts` | 33 | Motor puro: Cochran raw, FPC para Atarfe (N=15.472) y N=500 sintético, clasificación HIGH/MEDIUM/LOW, fronteras exactas (100 %/60 %), inmutabilidad, cautelas, invariantes del objeto resultado |
| `tests/sam-integration.test.ts` | 39 | Integración con DUKE, PREDIMED, SF-12, Sueño, CAGE; IBSE dual (16+ y full); campos `nObserved` canónicos; ausencia de EvidenceAtom en studies; no mutación de estudios; instanciación idéntica del motor |
| `tests/sam-to-evidence-atom.test.ts` | 20 | Conversión `samAssessmentToEvidenceAtom`: kind, origin, id estable, mapeo confidence, content = sampleQualityRationale, cautelas en limitations, trazabilidad, no mutación del assessment |

Tests directamente relacionados con Producto 2: **92 de 573** (16,1 %).

### Ausencia de regresiones

La implementación del Producto 2 añadió 72 tests nuevos sobre los 481 preexistentes.
Los 481 tests anteriores continúan pasando sin ninguna modificación.

Ningún archivo de `src/` preexistente fue modificado durante la implementación del Producto 2 (parsers, algoritmos, agregados, EvidenceStore, MIT, PSL, Plan de Acción, App.tsx).

### Fixtures verificados

| Fixture | Fuente | N declarado | Verificación |
|---|---|---|---|
| `atarfe-population-2022.ts` | INE Padrón Municipal 1 enero 2022 | 15.472 (≥16) | Suma verificada por grupos de edad (16–100+) vía COM Excel |
| `atarfe-school-population-2025.ts` | MTI-BDU 31 dic. 2025 | 2.847 (6–17) | Suma verificada por edad individual (6–17) vía COM Excel |

---

## 6. Estado de implementación por capacidad

| Capacidad | Estado | Ubicación |
|---|---|---|
| `PopulationReference` | ✅ Implementada | `src/domain/sam/` |
| `SampleQualityAssessment` | ✅ Implementada | `src/domain/sam/` |
| `CochranParams` + defaults | ✅ Implementada | `src/domain/sam/` |
| `computeSampleQualityAssessment()` | ✅ Implementada y certificada | `src/application/sam/` |
| Cochran con FPC | ✅ Implementado | Motor |
| Clasificación high/medium/low | ✅ Implementada | Motor |
| Cautelas metodológicas calibradas | ✅ Implementadas | Motor |
| `assessDUKEStudy()` | ✅ Implementada e integrada | `src/application/sam/assessStudies.ts` |
| `assessPREDIMEDStudy()` | ✅ Implementada e integrada | `src/application/sam/assessStudies.ts` |
| `assessSF12Study()` | ✅ Implementada e integrada | `src/application/sam/assessStudies.ts` |
| `assessSuenoStudy()` | ✅ Implementada e integrada | `src/application/sam/assessStudies.ts` |
| `assessCAGEStudy()` | ✅ Implementada e integrada | `src/application/sam/assessStudies.ts` |
| `assessIBSEStudySAM()` (gobernada por `sampleScope`) | ✅ Implementada e integrada | `src/application/sam/assessStudies.ts` |
| Fixture adulto Atarfe (INE 2022) | ✅ Disponible | `fixtures/population/` |
| Fixture menores <16 Atarfe (MTI-BDU 2025, 6–15, N=2.323) | ✅ Disponible | `fixtures/population/` |
| `populationReferenceRegistry.ts` | ✅ Implementado | `src/application/sam/populationReferenceRegistry.ts` |
| Consumo desde IBSEPanel (cuando ref. disponible) | ✅ Parcialmente integrado | `src/ui/components/IBSEPanel.tsx` |
| Tripirámide visual (UI) | ⏳ Pendiente | — |
| Persistencia en workspace | ⏳ Pendiente | — |
| `samAssessmentToEvidenceAtom()` | ✅ Implementada | `src/application/sam/SAMAssessmentToEvidenceAtom.ts` |
| Estratificación | ⏳ Pendiente | — |
| Ponderación | ⏳ Pendiente | — |
| Desplazamiento | ⏳ Pendiente | — |
| Comparación longitudinal | ⏳ Pendiente | — |

---

## 7. Decisiones arquitectónicas certificadas

### SAM como capacidad transversal

SAM no está acoplado a ningún instrumento específico. El motor `computeSampleQualityAssessment()` es genérico: recibe `nObserved` y `PopulationReference` y desconoce si el estudio es IBSE, DUKE u otro. Esta separación garantiza que SAM puede ampliarse a nuevos instrumentos sin modificar el motor.

### `PopulationReference` como concepto general

`PopulationReference` no es un objeto específico de Atarfe ni de ningún municipio. Es un tipo de dominio genérico que admite cualquier fuente oficial (INE, MTI-BDU, IECA). Los fixtures de Atarfe son instancias del tipo, no parte de él.

### Cochran + FPC como estrategia por defecto

Los parámetros por defecto (Z=1,96; e=0,05; p=0,5) producen estimaciones conservadoras (máxima varianza). Son configurables mediante `CochranParams` pero los valores por defecto responden a la práctica estándar en epidemiología de salud pública.

La FPC es obligatoria. Municipios con N < 2.000 ven reducido su `nTheoretical` significativamente respecto a la fórmula Cochran sin corrección.

### Los estudios no cambian

Los parsers, agregados, semántica y `EvidenceAtom` de los seis instrumentos complementarios permanecen intactos. La capa `assess*Study()` es un adaptador de solo lectura: extrae `nObserved` del campo canónico correspondiente y delega en el motor. No tiene acceso de escritura al estudio.

### Patrón de conversión a EvidenceAtom (completado 2026-06-30)

`samAssessmentToEvidenceAtom()` convierte un `SampleQualityAssessment` en un `EvidenceAtom kind: "sample-quality"` siguiendo el mismo patrón arquitectónico de todos los instrumentos del Producto 1 (`XStudyToEvidenceAtoms`). La función vive en `src/application/sam/` y no modifica el motor. El motor permanece sin conocimiento de `EvidenceAtom`; la conversión es responsabilidad de la capa de aplicación.

### IBSE — dos preguntas, un instrumento

La evaluación SAM del IBSE la gobierna el discriminador de muestra (`sampleScope`): `assessIBSEStudySAM()` evalúa una muestra `16-plus` solo contra la referencia adulta/EAS, una `under-16` solo contra la referencia de menores, y una `mixed` solo produce dictámenes por estrato cuando el export aporta `strataCounts` válidos —cada estrato con su propio `nValid`, nunca el total—. Una muestra mixta sin desglose, o `unknown`, no es evaluable por estrato.

---

## 8. Riesgos controlados

### Semántica de la clasificación

La clasificación `sampleQuality: "high" | "medium" | "low"` expresa la adecuación del tamaño muestral observado frente al tamaño muestral teórico calculado mediante Cochran+FPC para una `PopulationReference` determinada.

**No debe interpretarse como:**
- calidad científica global del instrumento;
- validez del diseño del estudio;
- fiabilidad de los datos individuales;
- ausencia de sesgo de selección o de cobertura.

El `sampleQualityRationale` de cada `SampleQualityAssessment` declara explícitamente esta distinción en lenguaje institucional. Las cautelas metodológicas lo refuerzan.

### nObserved provincial vs municipal en estudios EAS

Los estudios EAS (DUKE, PREDIMED, SF-12, Sueño, CAGE) disponibles en el repositorio son datos de la provincia de Granada, no del municipio de Atarfe. El motor SAM utiliza el `nObserved` provincial directamente y lo compara con el tamaño teórico calculado sobre la población municipal de Atarfe. Esto produce coberturas muy elevadas (670–812 %) porque el n provincial (2.513–3.047) supera ampliamente el teórico municipal (~375).

Esta decisión de diseño es deliberada y está documentada en `CONTRACT-DYNAMIC-TRIPYRAMID.md`. La cautela metodológica generada automáticamente menciona que la representatividad proviene de datos provinciales. La estrategia alternativa (fracción de peso poblacional provincial) queda como opción futura de estratificación.

---

## 9. Deuda residual

La deuda residual del Producto 2 es de naturaleza funcional, no metodológica:

| Elemento | Tipo | Bloquea |
|---|---|---|
| Tripirámide visual (UI) | Implementación pendiente | Ningún producto activo |
| Persistencia en workspace | Implementación pendiente | Ningún producto activo |
| `EvidenceAtom kind="sample-quality"` | Implementación pendiente | MIT/PSL si se quiere calidad muestral como evidencia |
| Fixtures para municipios distintos de Atarfe | Disponibilidad de datos | Uso de SAM en otros municipios |

**Integración parcial completada (2026-07-13):** `populationReferenceRegistry.ts` añadido al módulo SAM. IBSEPanel muestra el dictamen real del motor SAM cuando existe `PopulationReference` verificada para el municipio activo (actualmente solo Atarfe). Para otros municipios (incluido Granada-Zaidín), muestra dictamen heurístico simplificado con nota explícita de ausencia de referencia.

Ninguno de estos elementos condiciona el dictamen de certificación del Producto 2.

---

## 10. Dictamen de certificación

La auditoría directa del repositorio —incluyendo lectura de código fuente, tipos de dominio, motor de cálculo, capa de integración, fixtures poblacionales, tests, build y contratos— permite establecer el siguiente dictamen:

El motor `computeSampleQualityAssessment()` es correcto, puro e inmutable. Los tipos de dominio `PopulationReference` y `SampleQualityAssessment` son canónicos y completos. La capa de integración `assessStudies.ts` conecta correctamente los seis instrumentos del Producto 1 con el motor sin modificar ninguno de ellos. Los fixtures poblacionales están derivados de fuentes reales verificadas. La evaluación dual de IBSE es metodológicamente correcta y está implementada de forma independiente. La clasificación de calidad muestral es coherente con el contrato `CONTRACT-DYNAMIC-TRIPYRAMID.md` y sus semántica es explícita.

El build es limpio. 573/573 tests pasaban en la emisión original, de los cuales 92 verifican directamente el Producto 2. La suite actual (2215/2215) no registra ninguna regresión en el motor SAM.

> **El Producto 2 — SAM NG queda oficialmente certificado.**

---

## 11. Acta final

| Campo | Valor |
|---|---|
| Expediente | PRODUCT-2-SAM-CERTIFICATION |
| Fecha de emisión | 2026-06-29 |
| Repositorio | `C:\Users\blash\Desktop\COMPAS_NG` |
| Tests totales | 573/573 passing — 16 ficheros |
| Tests directamente relacionados con Producto 2 | 92/573 (16,1 %) |
| Build | Limpio — 449 módulos — sin errores TypeScript |
| Instrumentos integrados | 6/6 (DUKE-EAS, PREDIMED-EAS, SF-12 EAS, Sueño EAS, CAGE-EAS, IBSE) |
| Evaluaciones IBSE | 2 (16+ y muestra completa) |
| Fixtures poblacionales verificados | 2 (adulto INE 2022 + escolar MTI-BDU 2025) |
| Motor SAM | `computeSampleQualityAssessment()` — puro, genérico, certificado |
| Comportamiento funcional alterado | Ninguno |
| EvidenceAtom generados por SAM | 0 (diseño deliberado) |
| **Producto 2** | **CERTIFICADO** |
| Deuda residual | Funcional (UI Tripirámide, persistencia, EvidenceAtoms) — no condiciona certificación |
| Producto 3 autorizado | Sí, en el momento que el equipo lo decida |

---

*Este expediente ha sido producido mediante auditoría directa del repositorio:
lectura de código fuente, tipos de dominio, motor de cálculo, capa de integración,
fixtures poblacionales, tests, build y contratos.
Se basa en evidencia verificable, no en suposiciones.
Cualquier modificación posterior debe incluir justificación explícita.*
