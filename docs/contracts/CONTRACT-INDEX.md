# CONTRACT-INDEX — Índice maestro de contratos arquitectónicos

> COMPÁS NG — Referencia de arquitectura contractual
> Última actualización: 2026-09-23 — reconciliación de contratos tras PR #70–#74

Este documento es la puerta de entrada a la arquitectura contractual de COMPÁS NG.
No duplica contenido de los contratos. Cada entrada contiene: propósito, alcance, estado y relaciones.

---

## Cómo usar este índice

Los contratos se ordenan por **nivel arquitectónico**, de infraestructura base a motores superiores.

**Estados posibles:**
- `VIGENTE` — Implementado y en producción. Modificar solo con revisión explícita.
- `CONCEPTUAL` — Diseñado pero sin implementación activa. Define el qué, no el cómo.
- `FUTURO` — Investiga o reserva una línea para sprints posteriores.
- `LEGACY` — Conservado como registro histórico o compatibilidad, pero no como ruta canónica visible.
- `ARCHIVADO` — Supersedido por otro contrato vigente. No usar como base de implementación nueva.

---

## Nivel 1 — Repositorio y persistencia

### CONTRACT-REPOSITORY
**Estado:** VIGENTE — revisado 2026-07-07

Contrato del Repositorio Documental Municipal (`MunicipalDocumentRepository`). Define los 12 tipos de documento (`DocumentKind`, incluido `strategic-framework` añadido en Sprint 3), el ciclo de vida de un documento y la regla de trazabilidad. Incluye reglas de visibilidad en el selector documental: `community-asset` es tipo interno/legado (no visible); `localiza-salud` es la vía visible única para activos; `eas-variable` y `cmi-indicator` no están expuestos sin parser real; `other` no se expone como opción cómoda. `health-report` admite DOCX y PDF; `canGenerateEvidence = false`; no genera EvidenceAtom (D-HR-01).

**Productores:** UI (carga de documentos por el equipo técnico).
**Consumidores:** EvidenceStore, MIT.
**Relacionado con:** CONTRACT-EVIDENCE, CONTRACT-PERSISTENCE.

---

### CONTRACT-PERSISTENCE
**Estado:** VIGENTE

Contrato de persistencia y rehidratación del workspace municipal en localStorage. Define el esquema de serialización (versión 1.0.0), las reglas de migración inline y las garantías de consistencia al recargar.

**Productores:** `LocalStorageWorkspacePersistence`.
**Consumidores:** UI (rehidratación al arrancar).
**Relacionado con:** CONTRACT-REPOSITORY.

---

## Nivel 1 tardío — Evidencia estructurada

### CONTRACT-EVIDENCE
**Estado:** VIGENTE — revisado 2026-07-07

Contrato de `EvidenceAtom`, `EvidenceStore` y `EvidenceStoreIntegrityGuard`. Define los tipos de átomo (`EvidenceAtomKind`), los niveles de confianza, la clave estable de deduplicación, y las 5 reglas de integridad (A–E) que el Guard aplica antes de exponer el store al MIT. Incluye la tabla actualizada de `EvidenceOrigin` con `territorial-documentation`, `qualitative-material` y `strategic-framework`. `health-report` se mantiene como origen reconocido en el tipo pero **no genera EvidenceAtom en el flujo activo del producto** (D-HR-01 resuelta; §5.1 actualizado).

**Productores:** Parsers de estudios complementarios, cargadores del selector documental.
**Consumidores:** MIT, PSL.
**Relacionado con:** CONTRACT-COMPLEMENTARY-STUDIES, CONTRACT-EVIDENCE-QUALITY, CONTRACT-MIT-PSL.

---

### CONTRACT-COMPLEMENTARY-STUDIES
**Estado:** VIGENTE — revisado 2026-07-13

Contrato de los estudios complementarios como pipeline. Define el flujo canónico (CSV → Parser → Study → EvidenceAtoms → EvidenceStore), los 13 instrumentos vigentes (7 EAS + 6 REDCap municipales), los invariantes de aislamiento municipal y la regla de no almacenamiento de registros individuales. H-01 cerrado: todos los instrumentos tienen `MethodologicalModule` en el registry.

**Productores:** Parsers CSV (IBSE, DUKE-EAS, PREDIMED-EAS, SF-12 EAS, Sueño EAS, CAGE-EAS, IPAQ-EAS, AUDIT-C, GHQ-12, PHQ-9, PSQI, Fagerström, SBQ).
**Consumidores:** EvidenceStore, CONTRACT-SCALE-PANELS (gramática visual).
**Relacionado con:** CONTRACT-SCALE-PANELS, CONTRACT-EVIDENCE.

---

### CONTRACT-SCALE-PANELS
**Estado:** VIGENTE

Gramática editorial de los paneles de estudios complementarios. Distingue tres categorías: bloques obligatorios en UI (metadatos, barras, referencias, recordatorio), bloques condicionales (interpretación asistida, cautelas) y bloques de referencia de sistema (identidad, integraciones). Define también para qué instrumentos aplica la interpretación asistida (solo IBSE entre los actuales).

**Productores:** Paneles React (IBSEPanel, DUKEPanel, PREDIMEDPanel, SF12Panel, SuenoPanel, CAGEPanel, IPAQPanel, AUDITCPanel, GHQ12Panel, PHQ9Panel, PSQIPanel, FagerstromPanel, SBQPanel).
**Consumidores:** Equipo técnico (UI).
**Relacionado con:** CONTRACT-COMPLEMENTARY-STUDIES, CONTRACT-EVIDENCE-QUALITY.

---

### CONTRACT-EVIDENCE-QUALITY
**Estado:** VIGENTE

Define las cuatro dimensiones de calidad de la evidencia: documental, muestral, metodológica e inferencial. Establece cómo se mapean a `confidence: "high" | "medium" | "low"` en EvidenceAtom y justifica mantener `kind: "sample-quality"` sin evolucionar a `EvidenceQualityAssessment` en Sprint 1.

**Productores:** Parsers de estudios (calculan confianza), CONTRACT-DYNAMIC-TRIPYRAMID (calidad muestral futura).
**Consumidores:** MIT (priorización por confianza), PSL (validación de capítulos).
**Relacionado con:** CONTRACT-EVIDENCE, CONTRACT-DYNAMIC-TRIPYRAMID.

---

### CONTRACT-AGENDA-ACTUATIONS
**Estado:** CONCEPTUAL — creado 2026-10-19

Registro de actuaciones por cuatro entornos (sanitario, comunitario, educativo, laboral) con ficha completa por bloques, alta manual y volcado desde el Plan de Acción. El bloque de resultado vive en el expediente y alimenta agenda y seguimiento y evaluación sin duplicarse. El sistema no genera actuaciones, trimestres ni prioridades.

**Productores:** equipo técnico (alta manual); volcado desde las actuaciones del Plan de Acción vigente.
**Consumidores:** vista Agenda, vista Evaluación.
**Relacionado con:** CONTRACT-ACTION-PLAN-CATALOG, CONTRACT-INSTITUTIONAL-LIFECYCLE, CONTRACT-DYNAMIC-TRIPYRAMID.

---

### CONTRACT-SOURCE-CAPABILITY-MATRIX
**Estado:** VIGENTE — creado 2026-09-24

Matriz contractual de capacidades de fuente. Define qué tipos de información puede soportar, cargar e incorporar COMPÁS NG; qué ruta de entrada tienen; si son fuentes fijas o variables; si generan `EvidenceAtom`; qué papel desempeñan en la salida interpretativa COMPÁS y qué pueden aportar a la salida comparativa breve tipo OHID/Fingertips. Incluye la ruta para fuentes nuevas como ERACIS, estrategias autonómicas, planes estratégicos temáticos, estudios complementarios, activos, priorizaciones ciudadanas, documentación territorial, material cualitativo y evidencia longitudinal.

**Productores:** Repositorio Documental, parsers de estudios, cargadores de documentos, importadores GES/REDCap.
**Consumidores:** Perfil de Salud Local, salida comparativa breve, compiladores documentales, equipo técnico.
**Relacionado con:** CONTRACT-REPOSITORY, CONTRACT-EVIDENCE, CONTRACT-COMPLEMENTARY-STUDIES, CONTRACT-LOCAL-HEALTH-PROFILE-METHODOLOGY, CONTRACT-NHS-HEALTH-PROFILE.

---

## Nivel 1 tardío — Lectura clínico-asistencial UGC

> **Nota de estado (2026-07-13):** Las capas N1b y N3 (interpretación integrada) están implementadas
> en producción pero sin contrato independiente en el índice. Se documentan aquí como productores/consumidores
> dentro de los contratos vigentes. No requieren contratos nuevos en esta fase.

**N1b — Lectura clínico-asistencial por UGC** (`src/application/ugc-clinical-assistance/`):
productor `buildUGCClinicalAssistanceReading(workspace)` — extrae 384 señales de los informes Vigía
(fuentes `territorial-documentation` con `sourceText`). NO crea EvidenceAtoms. Consume: `MunicipalityWorkspace`.
Es producido por `buildDiagnosticAnswers` → `answers.ugcAssistanceQuestions` y consumido por `integratedInterpretation`
únicamente como preguntas de contraste (gate «solo preguntas»).

**N3 — Interpretación integrada** (`src/application/health-profile/integratedInterpretation.ts`):
productor `buildIntegratedInterpretation(answers)` — genera `IntegratedInterpretation` con unidades por tema
cruzando señales N1a + N2 + determinantes + desigualdades + capacidades + conocimiento humano.
Consumido por `buildProfileIntegratedEditorialView` como fuente principal de `territorialReadings` (N4).

---

## Nivel 2 — Interpretación territorial

### CONTRACT-INTERPRETATION
**Estado:** VIGENTE

Contrato de qué significa "interpretar" dentro de COMPÁS NG. Define los límites epistemológicos del sistema: qué constituye una interpretación válida, qué nunca lo constituye, y la distinción entre interpretación asistida y decisión territorial.

**Productores:** No tiene productor de código directo (es un contrato normativo).
**Consumidores:** MIT, PSL, equipo técnico como referencia.
**Relacionado con:** CONTRACT-MIT-PSL.

---

### CONTRACT-MIT-PSL
**Estado:** VIGENTE

Contrato del Motor de Interpretación Territorial (MIT) y del Perfil de Salud Local (PSL). Define LT1, OIT, Reconciliación Interpretativa, la lectura **única y adaptativa** del PSL (cobertura conceptual sin recuento obligatorio de capítulos, §6.1.1 bis), los 6 estados del PSL y la regla PSL-C1 (el Nivel 3 solo consume PSL, nunca EvidenceStore directamente).

**Productores:** `TerritorialInterpretationEngine`, `buildLocalHealthProfile`.
**Consumidores:** Priorización temática, Motor de Traducción Estratégica, Plan de Acción.
**Relacionado con:** CONTRACT-EVIDENCE, CONTRACT-MTE, CONTRACT-DELIBERATIVE-PRIORITISATION, CONTRACT-ACTION-PLAN-CATALOG.

---

## Metodología del Perfil de Salud Local

### CONTRACT-LOCAL-HEALTH-PROFILE-METHODOLOGY
**Estado:** VIGENTE

Contrato metodológico canónico del Perfil de Salud Local (PSL). Define qué debe ser metodológicamente un Perfil, qué puede afirmar y qué no puede afirmar, cómo se construye su evidencia y qué condiciones debe cumplir para ser aceptable como documento institucional. Establece los 19 artículos normativos del Perfil: naturaleza, finalidad, separación de etapas, singularidad territorial, explicación territorial, razonamiento multidisciplinar, familias de evidencia admisibles, siete tipos de afirmación, activos con rango equivalente a déficits, participación como evidencia, desigualdades, comparación territorial y temporal, incertidumbre situada, convergencia y divergencia de evidencias, compatibilidad con la ESCA (Art. 15: ESCA como marco SSPA, separación de responsabilidades, no tratar ESCA como instrumento de evaluación, no convertir líneas ESCA en objetivos municipales), no automatización de decisiones, autoría y responsabilidad técnica, flexibilidad metodológica, y criterios de aceptación del Perfil. Incluye 6 invariantes (I-LHPM-1 a I-LHPM-6) y 6 hipótesis metodológicas abiertas (H-LHPM-1 a H-LHPM-6).

**Productores:** No tiene productor de código directo. Es un contrato normativo que condiciona todos los contratos y motores relacionados con el Perfil.
**Consumidores:** CONTRACT-MIT-PSL, CONTRACT-PSL-COMPAS, CONTRACT-LOCAL-HEALTH-PROFILE-COMPILER, CONTRACT-NHS-HEALTH-PROFILE.
**Relacionado con:** CONTRACT-INTERPRETATION, CONTRACT-STRATEGIC-REPOSITORY, METHODOLOGICAL-FOUNDATIONS-LOCAL-HEALTH-PLANNING.

---

## Producto 3 — Perfil de Salud Local COMPÁS (PSL-C)

### CONTRACT-PSL-COMPAS
**Estado:** VIGENTE

Contrato canónico del Producto 3. Define el PSL-C como producto analítico territorial en el catálogo de COMPÁS NG: naturaleza, fuentes consumibles (incluyendo Productos 1 y 2), separación arquitectónica estricta, cobertura conceptual **adaptativa** (sin recuento obligatorio de capítulos), relación con SAM y Estudios Complementarios, y deuda registrada (D3-01 a D3-04).

**Productores:** `buildLocalHealthProfile` + `LocalHealthProfileCompiler`.
**Consumidores:** Equipo técnico (diagnóstico), Nivel 3 (vía PSL-C1), compiladores superiores.
**Relacionado con:** CONTRACT-MIT-PSL, CONTRACT-LOCAL-HEALTH-PROFILE-COMPILER, CONTRACT-COMPLEMENTARY-STUDIES, CONTRACT-DYNAMIC-TRIPYRAMID.

---

## PSL-NHS — representación derivada (antiguo «Producto 4»)

### CONTRACT-NHS-HEALTH-PROFILE
**Estado:** SUPERADO EN SU ESTATUTO DE PRODUCTO AUTÓNOMO (ver §0 del propio contrato y Fundamentos del Perfil único, 2026-07-17)

Por los Fundamentos del Perfil único, el PSL-NHS **deja de ser un «Producto 4» institucional independiente**: no es producto autónomo ni segunda fuente de verdad. Pasa a ser una **representación derivada dentro del Perfil de Salud Local, sin veredictos comparativos**: la capacidad de posición (`computePosition`) queda **descartada** (evaluación resuelta), no pendiente. El contrato conserva su cuerpo histórico como registro de diseño, subordinado a su §0. La retirada del código/ruta/artefacto NHS queda **ejecutada** (GOV-P4-01 · PR-E); la divergencia de catálogo (6 vs 13) se disuelve con el compilador retirado.

La línea vigente distingue dos salidas del mismo Perfil canónico: la salida interpretativa COMPÁS y una salida comparativa breve tipo OHID/Fingertips. La segunda se inspira en los Local Authority Health Profiles actuales de OHID/DHSC Fingertips como matriz pública de indicadores, referencias, periodos y cautelas; no restaura `NHSHealthProfileCompiler`, no crea `NHSHealthProfileArtifact` y no puede introducir conclusiones, prioridades ni datos ajenos al Perfil validado.

**Productores:** `projectNHSDerived` (`src/application/health-profile/nhsDerivedProjection.ts`) como proyector puro del documento canónico, y `NHSHealthProfileView` como renderer integrado dentro del espacio «Perfil de Salud Local». No existe compilador ni artefacto NHS autónomo.
**Consumidores:** Corporación municipal, ciudadanía, comunicación institucional.
**Relacionado con:** CONTRACT-PSL-COMPAS, CONTRACT-LOCAL-HEALTH-PROFILE-COMPILER, CONTRACT-COMPLEMENTARY-STUDIES, CONTRACT-DYNAMIC-TRIPYRAMID, CONTRACT-NAVIGATION, VISUAL-CONTRACT.

---

## Nivel 2 tardío — Compiladores de diagnóstico

### CONTRACT-LOCAL-HEALTH-PROFILE-COMPILER
**Estado:** VIGENTE

Contrato del compilador del Perfil de Salud Local COMPÁS (PSL-C). Define la distinción entre `LocalHealthProfile` (objeto vivo) y `LocalHealthProfileArtifact` (documento institucional exportable e inmutable). Establece los 7 gates de compilación (G-LHC-1 a G-LHC-7), la estructura de secciones del PSL-C, los invariantes de trazabilidad (`sourcePSLId`, `sourceHash`, `evidenceAtomIds`), las reglas de congelación y el modelo de persistencia acumulativa en `workspace.compiledProfiles`.

**Productores:** `LocalHealthProfileCompiler` (`src/application/health-profile-compiler/`).
**Consumidores:** Equipo técnico (exportación del diagnóstico), `LocalHealthPlanCompiler` (futuro: el PSL-C es el capítulo diagnóstico del PLS).
**Tipos:** `src/domain/health-profile-artifact/LocalHealthProfileArtifact.ts`.
**Tests:** `tests/local-health-profile-compiler.test.ts` (43 tests).
**Relacionado con:** CONTRACT-MIT-PSL, CONTRACT-LOCAL-HEALTH-PLAN-DOCUMENT, CONTRACT-LOCAL-HEALTH-PLAN-COMPILER.

---

## Nivel de compilación — Documentos institucionales exportables

### CONTRACT-LOCAL-HEALTH-PLAN-DOCUMENT
**Estado:** VIGENTE

Contrato del Plan Local de Salud (PLS) como documento institucional definitivo. Define naturaleza, estructura, entradas, gates, contenido humano obligatorio, congelación y versionado. Complementado por CONTRACT-LOCAL-HEALTH-PLAN-COMPILER, que define cómo se produce el PLS. Define la naturaleza del PLS (compromiso explícito y verificable), la distinción entre PLS, PSL-C, ActionPlanDraft, AgendaDraft y MonitoringDraft, la estructura canónica de 15 secciones (RE + I a XII + AN), los 10 gates de compilación (G-PLS-1 a G-PLS-10), el contenido humano obligatorio (validación política, responsables, plazos, recursos, necesidades no priorizadas), las reglas de congelación y versionado, y los 9 invariantes (I-PLS-1 a I-PLS-9).

**Productores:** `LocalHealthPlanCompiler` (tipos de dominio en Sprint 2.3; implementación del compilador pendiente).
**Consumidores:** Equipo técnico, corporación municipal, Distrito Sanitario, Junta de Andalucía.
**Relacionado con:** CONTRACT-MIT-PSL, CONTRACT-LOCAL-HEALTH-PROFILE-COMPILER, CONTRACT-DELIBERATIVE-PRIORITISATION, CONTRACT-ACTION-PLAN-CATALOG, CONTRACT-MTE, CONTRACT-COMPILER (reserva histórica), CONTRACT-LOCAL-HEALTH-PLAN-COMPILER.

---

### CONTRACT-LOCAL-HEALTH-PLAN-COMPILER
**Estado:** VIGENTE

Contrato del `LocalHealthPlanCompiler`. Define cómo se produce el `LocalHealthPlanDocument`: 10 gates de compilación (G-PLS-1 a G-PLS-10), la integración del PSL-C por referencia (Opción A), la distinción entre ActionPlanDraft y el capítulo VII del PLS compilado, el `CompilationManifest` embarcado, las reglas de articulación institucional provisional vs canónica, el versionado y la persistencia. También define la arquitectura de exportación Compilador → Renderer → Exporter (separación de responsabilidades).

**Productores:** `LocalHealthPlanCompiler` (pendiente de implementar; tipos de dominio en Sprint 2.3).
**Consumidores:** Equipo técnico, UI (exportación futura DOCX/PDF/HTML).
**Tipos:** `src/domain/health-plan/LocalHealthPlanDocument.ts`, `src/domain/compilation/CompilationManifest.ts`.
**Relacionado con:** CONTRACT-LOCAL-HEALTH-PLAN-DOCUMENT, CONTRACT-MIT-PSL, CONTRACT-LOCAL-HEALTH-PROFILE-COMPILER, CONTRACT-DELIBERATIVE-PRIORITISATION, CONTRACT-ACTION-PLAN-CATALOG, CONTRACT-MTE, CONTRACT-COMPILER (reserva histórica), CONTRACT-INSTITUTIONAL-LIFECYCLE.
**Prerequisitos satisfechos (Sprint 2):** actor model `approved` implementado (CONTRACT-INSTITUTIONAL-LIFECYCLE); validación formal del Nivel 3 implementada (`FormalValidationRecord`, `createFormalValidation.ts`).
**Prerequisitos pendientes:** implementación completa del `LocalHealthPlanCompiler`. El soporte de dominio, captura UI y transporte documental para G-PLS-7 y G-PLS-10 existe desde 2026-09-24 (`PlanPreparationPanel` → `PlanPreparationDraft` → `PlanDocument`). Ver §16 de este contrato.

---

## Modelo de ciclo de vida institucional

### CONTRACT-INSTITUTIONAL-LIFECYCLE
**Estado:** VIGENTE

Contrato del modelo canónico de ciclos de vida institucional de los objetos de COMPÁS NG. Define los tres tipos de objeto por ciclo de vida (efímero, vivo con estados, artefacto institucional), el ciclo completo del PSL (6 estados, transiciones, irreversibilidad), la validación formal de objetos efímeros del Nivel 3 (`FormalValidationRecord`), la aprobación institucional del PSL (`PSLApprovalRecord`) y el actor model completo (5 roles con tabla de permisos por transición).

**Productores:** `src/application/institutional-lifecycle/approvePSL.ts`, `createFormalValidation.ts`.
**Consumidores:** `handleApprovePSL` y `handleFormalValidation` en `src/App.tsx`; paneles `PSLApproveAction` y `FormalValidationForm`; `LocalHealthPlanCompiler` (futuro: gates G-PLS-1, G-PLS-5, G-PLS-6).
**Relacionado con:** CONTRACT-MIT-PSL (PSL y sus 6 estados), CONTRACT-LOCAL-HEALTH-PROFILE-COMPILER (gate G-LHC-1), CONTRACT-LOCAL-HEALTH-PLAN-COMPILER (gates G-PLS-1, G-PLS-5, G-PLS-6), CONTRACT-LOCAL-HEALTH-PLAN-DOCUMENT (aprobación institucional del PLS), CONTRACT-AGENDA-ACTUATIONS.

---

## Nivel 3 — Planificación y acción

### CONTRACT-DELIBERATIVE-PRIORITISATION
**Estado:** VIGENTE

Contrato de la cadena canónica vigente para producir borradores técnicos del Plan de Acción: `PSL validado → Lectura Estratégica Local → selección del Grupo Motor → borrador del Plan de Acción`. Distingue la generación automática —bloqueada hasta selección deliberativa explícita— de la edición territorial directa del catálogo, que guarda texto vigente en el expediente local sin revisión administrativa intermedia.

**Productores:** UI del espacio Plan de Acción; registros de selección deliberativa.
**Consumidores:** Catálogo del Plan de Acción, generación futura de borradores técnicos, compilación del PLS.
**Relacionado con:** CONTRACT-MTE, CONTRACT-ACTION-PLAN-CATALOG, CONTRACT-LOCAL-HEALTH-PLAN-DOCUMENT.

---

### CONTRACT-ACTION-PLAN-CATALOG
**Estado:** VIGENTE

Contrato del catálogo temático del Plan de Acción. Define módulos reutilizables, elegibilidad por selección deliberativa, revisión humana por elemento, trazabilidad y preparación editable previa. Desde la actualización de 2026-09-09, permite preparar y revisar la propuesta Zaidín en cuatro bloques sin trasladar aprobación formal entre versiones.

**Productores:** Catálogo de módulos de Plan de Acción, preparación territorial (`planPreparationDrafts`).
**Consumidores:** UI de preparación del Plan, fichas de indicadores y actuaciones, proyección del Plan de Acción resultante.
**Relacionado con:** CONTRACT-DELIBERATIVE-PRIORITISATION, CONTRACT-LOCAL-HEALTH-PLAN-DOCUMENT, CONTRACT-AGENDA-ACTUATIONS.

---

### CONTRACT-ACTION-PLAN
**Estado:** LEGACY — sustituido como ruta visible por CONTRACT-DELIBERATIVE-PRIORITISATION

Contrato histórico del bloque de Nivel 3: Priorización temática, EPVSATranslator, Plan de Acción, Agenda y Seguimiento. Sus invariantes siguen siendo útiles como compatibilidad y reserva doctrinal —ningún motor produce compromisos institucionales sin validación humana—, pero no define la ruta visible vigente del Plan de Acción.

**Productores:** Motores históricos de Nivel 3.
**Consumidores:** Compatibilidad, material de transición, CONTRACT-COMPILER como reserva histórica.
**Relacionado con:** CONTRACT-MIT-PSL, CONTRACT-COMPILER, CONTRACT-DELIBERATIVE-PRIORITISATION, CONTRACT-ACTION-PLAN-CATALOG.

---

### CONTRACT-COMPILER
**Estado:** VIGENTE (declarado, sin implementación activa)

Contrato del Compilador del Plan Local de Salud. Define los gates obligatorios (`G-C1`: PSL en estado `"approved"`) y la posición como último stage del pipeline. El compiler no implementado bloquea el estado `"approved"` del PSL.

**Productores:** Sin implementación activa.
**Consumidores:** Equipo técnico (exportación documental futura).
**Relacionado con:** CONTRACT-MIT-PSL, CONTRACT-ACTION-PLAN.

---

## Infraestructura metodológica

### CONTRACT-DYNAMIC-TRIPYRAMID
**Estado:** VIGENTE — revisado 2026-10-19 (v2.1: pirámide superpuesta y animada, sin semáforo)

Define el Sistema de Ajuste Muestral (SAM) como capacidad metodológica transversal: `PopulationReference`, `SampleQualityAssessment`, Cochran+FPC como algoritmo por defecto, clasificación high/medium/low. Motor puro implementado y certificado (Producto 2, 2026-06-29). `populationReferenceRegistry.ts` añadido (2026-07-13): IBSEPanel consume el motor SAM cuando existe referencia verificada para el municipio activo (actualmente Atarfe). Tripirámide visual, EvidenceAtoms desde SAM y estratificación pendientes.

**Productores:** `computeSampleQualityAssessment()` (motor puro); `assess*Study()` (capa de integración); `populationReferenceRegistry.ts` (lookup de referencias).
**Consumidores:** `IBSEPanel` (dictamen SAM cuando ref. disponible). EvidenceStore (futuro: átomos `kind: "sample-quality"`), `SamObservedAssessment` (Tripirámide superpuesta y animada, en IBSE y en el resumen de participación ciudadana).
**Relacionado con:** CONTRACT-EVIDENCE-QUALITY, CONTRACT-EVIDENCE, CONTRACT-COMPLEMENTARY-STUDIES, CONTRACT-AGENDA-ACTUATIONS.

---

### CONTRACT-STRATEGIC-REPOSITORY
**Estado:** CONCEPTUAL

Define el Repositorio Estratégico Territorial: recursos normativos supramunicipales con denominaciones canónicas fijadas (ESCA = Estrategia de Salud Comunitaria de Andalucía 2026–2030; RELAS = Red Local de Acción en Salud; RELAS-G, EBE, PSMA, PEM, EPVSA). Establece la diferencia respecto al MunicipalDocumentRepository. Sin implementación en Sprint 1.

**Productores futuros:** Carga manual por el equipo técnico.
**Consumidores futuros:** Motor de Traducción Estratégica.
**Relacionado con:** CONTRACT-MTE, CONTRACT-STRATEGIC-TRANSLATION (archivado), CONTRACT-REPOSITORY.

---

### CONTRACT-MTE
**Estado:** VIGENTE — implementación certificada

Contrato canónico del Motor de Traducción Estratégica. Supersede `CONTRACT-STRATEGIC-TRANSLATION`. Define la `LecturaEstrategicaLocal` como artefacto producido desde un `LocalHealthProfile` validado o aprobado y un `FrameworkProvider`, con `EscenarioEstratégico[]`, vacíos institucionales, cautelas, trazabilidad completa y `requiresHumanValidation: true`.

**Productores:** Motor de Traducción Estratégica (`MTE`), `FrameworkProvider`.
**Consumidores:** Selección deliberativa, Producto 6/Plan de Acción, futuro compilador del PLS.
**Relacionado con:** CONTRACT-MIT-PSL, CONTRACT-STRATEGIC-SCENARIO, CONTRACT-DELIBERATIVE-PRIORITISATION, CONTRACT-ACTION-PLAN-CATALOG, CONTRACT-STRATEGIC-TRANSLATION (archivado).

---

### CONTRACT-STRATEGIC-TRANSLATION
**Estado:** ARCHIVADO — supersedido por CONTRACT-MTE (2026-06-30)

Diseño conceptual previo del Motor de Traducción Estratégica. Se conserva como registro histórico de restricciones de no sustitución y trazabilidad, pero no debe usarse como contrato de implementación nueva. La ruta vigente está en `CONTRACT-MTE`.

**Productores:** Ninguno nuevo.
**Consumidores:** Consulta histórica.
**Relacionado con:** CONTRACT-MTE, CONTRACT-STRATEGIC-REPOSITORY, CONTRACT-MIT-PSL.

---

### CONTRACT-GES-EAS-COMPATIBILITY
**Estado:** VIGENTE

Principio de Compatibilidad EAS del Gestor de Encuestas de Salud. Define el criterio metodológico
permanente que rige la definición de instrumentos en el catálogo de COMPÁS NG: cuando un instrumento
tiene equivalente en la EAS, su implementación debe ser compatible en preguntas, categorías, códigos,
recodificaciones y algoritmos. Establece tres invariantes arquitectónicos (I-EAS-1: independencia de
origen en parsers; I-EAS-2: transparencia en EvidenceStore; I-EAS-3: verificación contra codebook oficial),
las adaptaciones documentadas (`sexo` extendido a 4 categorías; `anio_nacimiento` vs `ED_01`), y la
especificación del Bloque de Identificación y Clasificación (6 variables: `fecha_encuesta`, `municipio_cod`,
`sexo`, `anio_nacimiento`, `nivel_educativo`, `situacion_laboral`).

**Productores:** GES — `buildRedcapDictionary`, `SociodemographicRedcapBlock`.  
**Consumidores:** Toda futura definición de instrumento del catálogo de COMPÁS NG.  
**Relacionado con:** CONTRACT-COMPLEMENTARY-STUDIES, CONTRACT-EVIDENCE, CONTRACT-DYNAMIC-TRIPYRAMID.

---

### CONTRACT-TERRITORIAL-STRUCTURAL-INFERENCE
**Estado:** FUTURO

Investiga la posibilidad de construir hipótesis estructurales sobre determinantes territoriales de salud. No autoriza implementación hasta Gate 1. Preserva la línea de investigación para fundamentar futuras capacidades interpretativas.

**Productores futuros:** Investigación metodológica pendiente.
**Consumidores futuros:** MIT (extensión futura).
**Relacionado con:** CONTRACT-INTERPRETATION, CONTRACT-MIT-PSL.

---

## Gobernanza editorial transversal

### CONTRACT-AUTHORIAL-STYLE
**Estado:** VIGENTE — versión 0.1 (2026-10-05)

Contrato transversal de estilo, razonamiento y edición. Convierte el script
maestro del autor en una secuencia de trabajo, una jerarquía, una matriz de
aplicación y ocho invariantes. Se aplica a la prosa generada y editada por
COMPÁS sin alterar datos, citas, redacciones finales aprobadas ni las fronteras
metodológicas de cada producto. La fuente literal versionada se conserva en
`docs/contracts/sources/AUTHORIAL-STYLE-SCRIPT-v0.1.md`.

**Productores:** Autor y equipo responsable de la edición.
**Consumidores:** Generadores narrativos, documentación, contratos, interfaz y asistentes de IA.
**Relacionado con:** PROFILE-WRITING-CONTRACT, CONTRACT-PMO, CONTRACT-NAVIGATION, CONTRACT-LOCAL-HEALTH-PROFILE-METHODOLOGY, CONTRACT-LOCAL-HEALTH-PLAN-DOCUMENT.

---

## Identidad semántica e interfaz

### CONTRACT-NAVIGATION
**Estado:** VIGENTE

Contrato de navegación e identidad semántica de la interfaz de COMPÁS NG. Cubre el hueco entre el VISUAL-CONTRACT (identidad visual) y INSTITUTIONAL-PRODUCTS-ARCHITECTURE (catálogo de productos): define qué vocabulario es visible para el usuario y cuál permanece interno, qué representa cada espacio de trabajo, qué es la Home, y los principios para representar el ciclo institucional. Governa toda la interfaz durante la evolución futura del sistema.

**Productores:** Equipo responsable de la interfaz (governa la UI, no un componente de código).
**Consumidores:** Todo el código React (`src/App.tsx`, `src/ui/components/`), cualquier nueva vista o componente.
**Relacionado con:** `VISUAL-CONTRACT`, `INSTITUTIONAL-PRODUCTS-ARCHITECTURE`, `FOUNDATIONS §2`, `OPERATING-CONSTITUTION` Bloque F, `CONTRACT-PSL-COMPAS`, `CONTRACT-NHS-HEALTH-PROFILE`, `CONTRACT-LOCAL-HEALTH-PLAN-DOCUMENT`.

---

## Gobernanza de sesiones de trabajo

### CONTRACT-PMO
**Estado:** VIGENTE

Contrato del Prompt Maestro Operativo (PMO). Define la naturaleza, finalidad, contenido
mínimo obligatorio, política de modelos (5 niveles de capacidad: BAJO, MEDIO, ALTO, MAX,
PENSAMIENTO), protocolo de invocación mediante la palabra `PMO`, invariantes, riesgos que
evita y antipatrones. Convierte la inicialización de cualquier sesión de trabajo con un
asistente de IA en un acto trazable, reproducible y coherente con el sistema de gobierno
del proyecto. Instrumento agnóstico de proveedor y de modelo.

**Productores:** El responsable del proyecto (redacta los PMOs concretos que siguen este contrato).
**Consumidores:** Cualquier asistente de IA que trabaje sobre COMPÁS NG; el responsable del proyecto.
**Relacionado con:** `OPERATING-CONSTITUTION.md §7`, `CONTRACT-INTERPRETATION.md §5`, `ARCHITECTURAL-GAP-REGISTER.md`.

---

## Mapa de dependencias

```
CONTRACT-REPOSITORY
    ↓
CONTRACT-PERSISTENCE
CONTRACT-EVIDENCE
    ↓
CONTRACT-COMPLEMENTARY-STUDIES → CONTRACT-SCALE-PANELS
                                 CONTRACT-EVIDENCE-QUALITY
    ↓
CONTRACT-INTERPRETATION
CONTRACT-LOCAL-HEALTH-PROFILE-METHODOLOGY  ← contrato normativo transversal
CONTRACT-MIT-PSL
    ↓
CONTRACT-LOCAL-HEALTH-PROFILE-COMPILER → LocalHealthProfileArtifact (PSL-C)
    ↓
CONTRACT-MTE → CONTRACT-DELIBERATIVE-PRIORITISATION
    ↓                         ↓
CONTRACT-STRATEGIC-REPOSITORY CONTRACT-ACTION-PLAN-CATALOG
                              ↓
                 CONTRACT-ACTION-PLAN (legacy/reserva)
    ↓
CONTRACT-LOCAL-HEALTH-PLAN-DOCUMENT
    ↓
CONTRACT-LOCAL-HEALTH-PLAN-COMPILER
    ↓
LocalHealthPlanDocument (PLS)
```

---

## Reglas de mantenimiento

1. Cualquier nuevo contrato debe registrarse aquí antes de que otro contrato lo referencie.
2. Un contrato no puede pasar de `CONCEPTUAL` a `VIGENTE` sin una revisión arquitectónica explícita.
3. Los contratos `VIGENTE` no se modifican sin revisión deliberada y registro de la versión.
4. Las referencias cruzadas entre contratos deben ser simétricas: si A referencia B, B debe mencionar A en "Relacionado con".
5. Los productores y consumidores deben actualizarse cuando cambie la implementación.

---

## Fundamentos del Perfil único (Intervención 2026-07-17)

Esta sección fija los fundamentos doctrinales del **Perfil de Salud Local** como
producto institucional único de COMPÁS NG. Prevalece sobre cualquier redacción
anterior de los contratos que contradiga estas decisiones. La *implementación* de
la convergencia se aborda en incrementos posteriores; aquí solo cambia el estatuto
contractual.

1. **Producto único.** El único producto institucional del Perfil es el **Perfil
   de Salud Local**. El «Perfil de Salud tipo NHS» deja de definirse como producto
   autónomo y como segunda fuente de verdad. La **representación derivada** sobrevive
   como reexpresión **sin veredictos**; la capacidad de posición (`computePosition`)
   queda **descartada** (ver `CONTRACT-NHS-HEALTH-PROFILE` §0). La retirada de
   código, rutas, artefactos y tests NHS queda **ejecutada** (GOV-P4-01 · PR-E):
   la representación derivada vive dentro del único espacio «Perfil de Salud Local».

2. **Arquitectura adaptativa (sin recuento obligatorio de capítulos).** Existe una
   **única lectura institucional canónica**. Su extensión y su número de secciones
   **dependen de la riqueza y la solidez del expediente**: una sección puede
   abrirse, comprimirse o no aparecer. Una **mera presencia textual no obliga** a
   generar un bloque completo. **No puede coexistir una «lectura larga» alternativa**
   —ni abierta ni plegada— que compita con la lectura canónica. El **espacio técnico**
   puede existir *después* del documento, claramente separado de la lectura
   institucional. Queda **derogada toda rigidez numérica** de «seis» o «siete»
   capítulos (resuelve GOV-PSL-01 por eliminación de la rigidez, no por alineación
   con la implementación actual).

3. **Salida canónica (equivalencia semántica, no de apariencia).** Pantalla,
   impresión, DOCX y PDF deben **derivar del mismo modelo semántico canónico** y
   conservar: secciones, orden, contenido, estatuto epistemológico, fuentes,
   escalas, cautelas y preguntas. Cada formato puede tener su propio renderer y
   composición visual adecuados a su medio; **no se exige identidad de píxeles, CSS
   ni paginación**. La implementación de esta convergencia queda pendiente para un
   incremento posterior.

4. **Clases de conocimiento (sin umbral numérico de menciones).** El sistema
   distingue, al menos: *dato estructurado*, *señal local exploratoria*,
   *referencia o proxy contextual*, *presencia textual en una fuente*, *conocimiento
   cualitativo o comunitario real*, *síntesis automática derivada*, *incertidumbre*
   e *hipótesis plausible*. La **frecuencia de una expresión puede orientar la
   búsqueda, pero no eleva por sí sola una presencia textual a evidencia
   territorial**. No se introduce un umbral numérico de menciones como criterio de
   solidez (ver `CONTRACT-MIT-PSL` §6.1.2).

## Deudas de gobernanza vigentes

Estas entradas registran decisiones o divergencias vivas que afectan a la gobernanza del Perfil y no deben resolverse por inferencia libre en auditorías futuras.

| ID | Deuda | Evidencia | Estado |
|---|---|---|---|
| GOV-PSL-01 | Estructura documental del Perfil: **rigidez numérica derogada** por los Fundamentos del Perfil único (2026-07-17). La lectura canónica es única y adaptativa; su extensión depende del expediente. Queda pendiente la *implementación* de la arquitectura adaptativa en código. | `CONTRACT-MIT-PSL` §6, `CONTRACT-PSL-COMPAS` §4, `narrativeChapters.ts`, `ProfileIntegratedEditorialPreview` | Doctrina resuelta; implementación pendiente |
| GOV-PSL-02 | Vista editorial integrada implementada como lectura canónica sin contrato propio de producto. | `LocalHealthProfileView.tsx`, `tests/perfil-vista-editorial-integrada.test.tsx` | Pendiente de contrato/unificación |
| GOV-PSL-03 | `PerfilFuentesPanel` y `PerfilLocalDeSaludPanel` se renderizan tras el Perfil, fuera de la lectura canónica y fuera del espacio técnico del Perfil. | `src/App.tsx:2978-2979` | Pendiente de decisión funcional |
| GOV-P4-01 | El PSL-NHS deja de ser producto autónomo/segunda fuente de verdad (Fundamentos del Perfil único, 2026-07-17): pasa a **representación derivada sin veredictos comparativos** dentro del Perfil. La capacidad de posición (`computePosition`) queda **descartada** (evaluación resuelta). La migración de código/ruta/artefacto queda **ejecutada** (PR-E); la divergencia de catálogo (6 vs 13) se disuelve con el compilador retirado. | `CONTRACT-NHS-HEALTH-PROFILE` §0, representación derivada en `view==="psl"` | Doctrina resuelta; migración ejecutada |
| GOV-SALIDA-01 | Pantalla e impresión derivan de `editorialView`; DOCX/PDF/visor reconstruyen desde `provenance + conclusiones.content` (dos composiciones). Los Fundamentos (2026-07-17) obligan a equivalencia **semántica** entre salidas; la unificación de código queda pendiente. | `pslcCanonicalDocument.ts`, `pslcDocumentModel.ts`, `pslcDocx.ts`, `pslcPdf.ts` | Doctrina fijada; implementación pendiente |
| GOV-VIS-01 | Identidad visual sin autoridad operacional única: `VISUAL-CONTRACT` existe como doctrina, pero `src/App.css` concentra 10.255 líneas, 1.795 colores hexadecimales, 132 colores únicos y dos escalas de grises conviviendo (`#64748b` y familia; `#526070` y familia). | `docs/visual/VISUAL-CONTRACT.md`, `src/App.css` | Deuda de gobernanza visual |
---

## Expedientes de certificación

| Expediente | Fecha | Estado |
|---|---|---|
| `docs/certification/CERTIFICATION-SPRINT-0-1.md` | 2026-06-28 | Sprints 0–1: pipeline E2E, 309 tests |
| `docs/certification/PRODUCT-1-CERTIFICATION.md` | 2026-06-29 | Producto 1 — Sistema de Estudios Complementarios: 6 instrumentos, 481 tests |
| `docs/certification/PRODUCT-2-SAM-CERTIFICATION.md` | 2026-06-30 | Producto 2 — SAM NG: motor + integración + samAssessmentToEvidenceAtom, 573 tests |
| `docs/certification/PRODUCT-3-PSL-CERTIFICATION.md` | 2026-06-30 | Producto 3 — PSL-C: certificación histórica fechada; estado posterior superado en catálogo de 13 estudios, DOCX/PDF y estructura documental pendiente de unificación |
| `docs/certification/PRODUCT-4-NHS-HEALTH-PROFILE-CERTIFICATION.md` | 2026-06-30 | Producto 4 — PSL-NHS: certificación histórica fechada; UI/Home/Nav implementadas después, export D4-04 pendiente |

El plano arquitectónico completo que responde a la pregunta
"¿qué debe existir para producir un Perfil de Salud Local, un Plan Local de Salud y una
Encuesta Municipal?" está en `docs/architecture/BLUEPRINT-PRODUCTION.md`.
Ese blueprint conserva decisiones y tensiones históricas; para determinar si una
deuda sigue viva, prevalecen este índice, los contratos específicos vigentes y
`docs/ESTADO-ACTUAL-COMPAS-NG.md`.

---

*Este índice es el punto de entrada obligatorio antes de crear o modificar cualquier contrato en COMPÁS NG.*
