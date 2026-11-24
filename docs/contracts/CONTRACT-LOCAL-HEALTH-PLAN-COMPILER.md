# CONTRACT-LOCAL-HEALTH-PLAN-COMPILER

> COMPÁS NG — Contrato del Compilador del Plan Local de Salud
> Sprint 2.3 — 2026-06-28
> Estado: VIGENTE
>
> Reconciliación de estado — 2026-09-23:
> `CONTRACT-MTE` es el contrato vigente del Motor de Traducción Estratégica.
> Toda mención a `EPVSATranslator` se entiende como fallback histórico o
> provisional que debe marcarse expresamente si se usa en un PLS compilado.
>
> Revisión — 2026-09-25: `LocalHealthPlanOutline` se reconoce como proyección
> previa, fuera del compilador terminal y sin gates de entrada.

---

## 1. Finalidad

El `LocalHealthPlanCompiler` transforma el conjunto de objetos validados de un ciclo completo de planificación en el **Plan Local de Salud** (`LocalHealthPlanDocument`): el documento institucional definitivo del municipio, inmutable, trazable y verificable.

Este compilador es el stage terminal del pipeline de COMPÁS NG. Una vez producido el `LocalHealthPlanDocument`, el sistema ha cumplido su función institucional en ese ciclo: facilitar la fundación trazable de un compromiso municipal explícito con la salud de su población.

**Responsabilidad de este contrato:** especificar exactamente cómo se produce el PLS, qué lo constituye y qué lo excluye.
**Responsabilidad de CONTRACT-LOCAL-HEALTH-PLAN-DOCUMENT:** especificar qué es el PLS como documento institucional y qué contiene.
Ambos contratos son complementarios y no se solapan.

---

## 2. Posición en el pipeline

```
Nivel 1 → Nivel 2 → PSL [validated] → PSL-C (LocalHealthProfileArtifact)
                         ↓
                    PSL [approved]  ←── Gate G-PLS-1
                         ↓
              Objetos del Nivel 3 validados formalmente
              (ActionPlanDraft, AgendaDraft, MonitoringDraft)
                         ↓
              LocalHealthPlanCompiler
                         ↓
              LocalHealthPlanDocument  ──  PLS [isCongealed: true]
```

El compilador es una función pura: no modifica ningún objeto del pipeline, no escribe en el workspace durante la ejecución, no lanza excepciones. Devuelve `CompilationResult` tipado.

### 2.1 Proyección previa: `LocalHealthPlanOutline`

Antes de alcanzar los gates de compilación, COMPÁS puede proyectar un esbozo
evolutivo del futuro Plan Local de Salud. Esta proyección:

- consume únicamente la información ya disponible en el expediente;
- puede mostrar Perfil, prioridades y arquitectura estratégica aunque todavía
  no existan actuaciones;
- declara de forma explícita las secciones pendientes;
- se recalcula cuando cambia el expediente;
- no invoca `LocalHealthPlanCompiler`;
- no produce `LocalHealthPlanDocument`, versión PLS/vN ni manifest de compilación;
- no equivale a validar el Plan de Acción ni a aprobar el PLS.

Por tanto, las actuaciones no son gate para **consultar el esbozo**. Sí forman
parte del gate G-PLS-5 para **compilar el documento institucional definitivo**.

---

## 3. Distinción fundamental con el LocalHealthProfileCompiler

| Dimensión | `LocalHealthProfileCompiler` | `LocalHealthPlanCompiler` |
|---|---|---|
| **Input canónico** | `LocalHealthProfile` validado | `LocalHealthProfile` aprobado + todos los objetos del Nivel 3 validados + `LocalHealthProfileArtifact` |
| **Output** | `LocalHealthProfileArtifact` (PSL-C) | `LocalHealthPlanDocument` (PLS) |
| **Gate de activación** | PSL en estado `"validated"` | PSL en estado `"approved"` |
| **Contenido humano mínimo** | Caps. V, VI y VII del PSL | Caps. V, VI y VII del PSL + responsables + plazos + recursos + necesidades no priorizadas + marco de evaluación |
| **Artefactos de entrada** | Ninguno | PSL-C (referenciado en el diagnóstico del PLS) |
| **Trazabilidad** | Hasta el EvidenceStore vía PSL | Hasta el EvidenceStore vía PSL y PSL-C |
| **Ciclo de vida** | Un PSL-C por PSL validado | Un PLS por ciclo de planificación aprobado |

---

## 4. Entradas

### 4.1 Entradas obligatorias

```typescript
interface CompileLocalHealthPlanInput {
  // Gate G-PLS-1: PSL aprobado institucionalmente
  psl: LocalHealthProfile;                     // status === "approved"

  // Gate G-PLS-2: PSL-C coherente con el PSL aprobado
  pslcArtifact: LocalHealthProfileArtifact;    // sourcePSLId === psl.id

  // Gate G-PLS-3: deliberación documentada
  // Verificado en: psl.priorizacion.consensoDocumentado === true

  // Gate G-PLS-4: capítulos V y VI en authored
  // Verificado en: psl.conclusiones.status === "authored" && psl.recomendaciones.status === "authored"

  // Gate G-PLS-5: Plan de Acción formalmente validado
  actionPlan: ValidatedActionPlan;             // requiresHumanValidation: false tras validación formal

  // Gate G-PLS-6: Agenda formalmente validada
  agenda: ValidatedAgenda;

  // Gate G-PLS-7: necesidades no priorizadas documentadas
  unaddressedNeeds: UnaddressedNeed[];         // puede ser [] si no hay ninguna, con justificación "ninguna"

  // Gate G-PLS-8: aprobación institucional
  institutionalApproval: InstitutionalApproval;

  // Gate G-PLS-9: PSL no obsoleto
  // Verificado en: pslIsStale === false antes de llamar al compilador

  // Gate G-PLS-10: marco de evaluación
  evaluationFramework: PLSEvaluationFramework;

  // Metadatos de compilación
  municipalityName: string;
  municipalityProvince: string;
  planningPeriod: PlanningPeriod;
  compiledBy?: string;
  existingPlanCount: number;    // Para el versioning: PLS/v{N+1}
}
```

### 4.2 Entradas condicionales

| Entrada | Cuándo es necesaria |
|---|---|
| `MonitoringDraft` | Siempre, pero puede estar en estado inicial mínimo |
| `LecturaEstrategicaLocal` | Cuando exista articulación institucional canónica producida por `CONTRACT-MTE`; cualquier fallback EPVSA anterior debe marcarse como provisional |
| Datos de referencia territorial | Si se incluyen en los Anexos Metodológicos |

### 4.3 Lo que el compilador NO consume

El compilador **no** accede a:
- `EvidenceStore` directamente
- `MunicipalDocumentRepository` directamente
- Ningún motor del Nivel 2 (MIT, LT1, OIT, Reconciliación)
- Fuentes de datos externas no registradas en los inputs

---

## 5. Gates de compilación

Definidos en CONTRACT-LOCAL-HEALTH-PLAN-DOCUMENT §5. Se reproducen aquí para referencia del implementador.

| Gate | Código | Condición técnica |
|---|---|---|
| PSL aprobado | G-PLS-1 | `psl.status === "approved"` |
| PSL-C coherente | G-PLS-2 | `pslcArtifact.sourcePSLId === psl.id` |
| Deliberación documentada | G-PLS-3 | `psl.priorizacion.consensoDocumentado === true && psl.priorizacionStatus === "complete"` |
| Caps. V y VI authored | G-PLS-4 | `psl.conclusiones.status === "authored" && psl.recomendaciones.status === "authored"` |
| Plan de Acción validado | G-PLS-5 | `actionPlan` presente y con mecanismo de validación formal |
| Agenda validada | G-PLS-6 | `agenda` presente y con responsables y períodos reales |
| Necesidades no priorizadas | G-PLS-7 | `unaddressedNeeds` presente (array vacío con nota aceptado) |
| Aprobación institucional | G-PLS-8 | `institutionalApproval.approvedAt`, `.approvedBy`, `.approvingBody` presentes |
| PSL no obsoleto | G-PLS-9 | `pslIsStale === false` en el runtime antes de invocar el compilador |
| Marco de evaluación | G-PLS-10 | `evaluationFramework.evaluationQuestions.length > 0` y `evaluationFramework.evaluationResponsible` |

---

## 6. Salidas

### 6.1 En caso de éxito

```typescript
interface CompilationResult {
  ok: true;
  artifact: LocalHealthPlanDocument;
}
```

### 6.2 En caso de fallo de precondiciones

```typescript
interface CompilationResult {
  ok: false;
  violations: CompilationViolation[];
}
```

### 6.3 `CompilationViolation`

Idéntico al tipo definido en `LocalHealthProfileCompiler`:

```typescript
interface CompilationViolation {
  gate: string;      // Código del gate: "G-PLS-1" … "G-PLS-10"
  message: string;   // Descripción legible
}
```

---

## 7. CompilationManifest

Cada `LocalHealthPlanDocument` embarca un `CompilationManifest` (tipo definido en `src/domain/compilation/CompilationManifest.ts`).

El manifest del PLS incluye:

```typescript
{
  compilerId: "LocalHealthPlanCompiler",
  compilerVersion: "1.0.0",
  contractVersion: "CONTRACT-LOCAL-HEALTH-PLAN-COMPILER@2026-06-28",
  municipalityId: psl.municipalityId,
  artifactType: "PLS",
  sourceHashes: {
    psl: computePSLHash(psl),
    pslc: pslcArtifact.sourceHash,
    // actionPlan, agenda: sus hashes cuando se implementen
  },
  artifactHash: /* hash del LocalHealthPlanDocument resultante */,
  reproducibilityId: /* hash determinista de todos los sourceHashes */,
  generatedAt: /* ISO timestamp */,
  generatedBy: compiledBy,
  pipelineVersion: "0.0.0",
  gateResults: /* todos los gates G-PLS-1 a G-PLS-10 que pasaron */,
  warnings: /* advertencias no bloqueantes */,
  referencedArtifactIds: [pslcArtifact.id],
  referencedContracts: [
    "CONTRACT-LOCAL-HEALTH-PLAN-DOCUMENT",
    "CONTRACT-LOCAL-HEALTH-PLAN-COMPILER",
    "CONTRACT-MIT-PSL",
    "CONTRACT-LOCAL-HEALTH-PROFILE-COMPILER",
    "CONTRACT-DELIBERATIVE-PRIORITISATION",
    "CONTRACT-ACTION-PLAN-CATALOG",
    "CONTRACT-MTE",
  ],
}
```

---

## 8. Integración del PSL-C (Opción A del CONTRACT-LOCAL-HEALTH-PLAN-DOCUMENT)

El PLS integra el PSL-C **por referencia**, no por duplicación de contenido:

```typescript
diagnosticoTerritorial: {
  pslCArtifactId: pslcArtifact.id,
  pslCVersion: pslcArtifact.artifactVersion,
  pslCSourceHash: pslcArtifact.sourceHash,
  pslCCompiledAt: pslcArtifact.compiledAt,
}
```

El compilador verifica que `pslcArtifact.sourcePSLId === psl.id` (gate G-PLS-2). Si el PSL-C referenciado no corresponde al PSL aprobado, la compilación falla.

---

## 9. Integración del ActionPlanDraft, AgendaDraft y MonitoringDraft

Los borradores técnicos del Nivel 3 se integran en el PLS como capítulos VII, VIII y IX. En el momento de compilación deben estar en estado "formalmente validado" (gates G-PLS-5 y G-PLS-6).

El compilador **no modifica** los borradores: los captura como instantáneas. Los cambios posteriores al borrador no afectan al PLS compilado.

La distinción es metodológicamente crítica:
- `ActionPlanDraft` = borrador técnico (mutable, del Nivel 3)
- Cap. VII del PLS (`PLSSectionPlanAccion`) = compromiso institucional (inmutable, del documento compilado)

---

## 10. Articulación institucional provisional vs canónica

La articulación institucional canónica del PLS deriva de la `LecturaEstrategicaLocal` producida por `CONTRACT-MTE`. Si una implementación transitoria utiliza `EPVSATranslationResult` o cualquier salida anterior al MTE vigente, el cap. VI del PLS (`PLSSectionArticulacionInstitucional`) debe marcarse explícitamente como provisional:

```typescript
articulacionInstitucional: {
  isProvisional: true,
  provisionNote: "Articulación provisional basada en EPVSATranslator. Pendiente de revisión con el MTE canónico.",
  alignments: /* desde EPVSATranslationResult */
}
```

Cuando el PLS consume `LecturaEstrategicaLocal`, el campo `isProvisional` pasa a `false` y `provisionNote` desaparece. La ausencia de integración del MTE en el compilador no autoriza volver a tratar EPVSA como ruta canónica.

---

## 11. Versionado del artefacto

- `planVersion: "PLS/v1"` para el primer plan compilado de un municipio.
- `planVersion: "PLS/v2"` para el segundo ciclo, etc.
- El número de versión se calcula como `existingPlanCount + 1`.
- Un PLS `superseded` sigue en el historial.

---

## 12. Persistencia

Los `LocalHealthPlanDocument` se persisten en `workspace.compiledPlans?: LocalHealthPlanDocument[]`.

Reglas (idénticas a `compiledProfiles` para PSL-C):
- Acumulativos: se añaden, nunca se reemplazan.
- Inmutables: el documento compilado no puede modificarse.
- Sin límite de cantidad (historial completo).
- La búsqueda del más reciente por `manifest.generatedAt`.

**Cuota de localStorage:** el `LocalHealthPlanDocument` completo puede exceder los límites de localStorage. La estrategia de mitigación (que debe definir la UI, no este contrato) es una de:
- Exportar directamente (descarga en navegador) sin persistir en localStorage.
- Persistir solo metadatos e identificadores, no el contenido completo.
- Comprimir el JSON antes de persisitir.

La decisión entre estas estrategias queda para la implementación de la UI.

---

## 13. Exportación futura

El compilador produce un `LocalHealthPlanDocument` (estructura de datos). La exportación a DOCX, PDF o HTML es responsabilidad de una capa de renderizado separada (`Renderer`), no del compilador.

Arquitectura de la cadena de exportación (§VIII del diseño del subsistema):

```
LocalHealthPlanDocument
    ↓ [Compilador produce; Workspace persiste]
PLSRenderer (futuro)
    ↓ [Transforma estructura a presentación]
PLSExporter (futuro)
    ↓ [Descarga en navegador]
DOCX | PDF | HTML
```

El compilador no conoce el formato de salida. El renderer no conoce la lógica de dominio. El exporter no conoce la semántica institucional.

---

## 14. Invariantes

**I-PLSC-1 — El compilador no modifica ningún objeto del pipeline**
La ejecución es una operación de solo lectura sobre los inputs. No escribe en el workspace, no modifica el PSL, no altera los borradores del Nivel 3.

**I-PLSC-2 — El PLS requiere PSL aprobado, no solo validado**
El estado `"validated"` habilita el PSL-C y el Nivel 3. El estado `"approved"` —condición institucional superior— es el gate del compilador del PLS (G-PLS-1).

**I-PLSC-3 — El compilador no es el MTE**
El compilador no produce articulaciones estratégicas. Integra el resultado del MTE (`LecturaEstrategicaLocal`) o, en una transición explícitamente marcada, un fallback EPVSA provisional. La propuesta de alineación estratégica precede a la compilación.

**I-PLSC-4 — El PLS incluye necesidades no priorizadas**
Si el campo `unaddressedNeeds` está vacío, debe contener un ítem con `justification: "Todas las necesidades identificadas en el diagnóstico han sido incluidas en el Plan de Acción."` La ausencia del campo bloquea la compilación (G-PLS-7).

**I-PLSC-5 — El marco de evaluación es obligatorio en el PLS**
Sin preguntas de evaluación, momentos de medición y responsable de evaluación, el plan no puede evaluarse. Un plan no evaluable no es un plan (METHODOLOGICAL-FOUNDATIONS §I.1).

**I-PLSC-6 — Las actuaciones SSPA-garantizadas se presentan como referencias**
El compilador marca explícitamente `institutionalOrigin: "sspa-esca"` en las actuaciones ya garantizadas por el Plan Operativo ESCA. No pueden presentarse como compromisos municipales nuevos.

**I-PLSC-7 — isCongealed: true es literal invariante**
El campo `isCongealed` del `LocalHealthPlanDocument` es un TypeScript literal type `true`. No puede ser `false`.

**I-PLSC-8 — No lanza excepciones**
El compilador devuelve `CompilationResult` tipado. Nunca lanza. Los errores esperables (gates fallidos) son parte del protocolo normal de respuesta.

---

## 15. Relaciones

- **Upstream (inputs):** CONTRACT-MIT-PSL (PSL aprobado) y CONTRACT-LOCAL-HEALTH-PROFILE-COMPILER (PSL-C), ambos históricos desde el 2026-11-23 (doctrina vigente del Perfil: CONTRACT-LOCAL-HEALTH-PROFILE-METHODOLOGY); CONTRACT-MTE (Lectura Estratégica Local), CONTRACT-DELIBERATIVE-PRIORITISATION y CONTRACT-ACTION-PLAN-CATALOG (Plan de Acción vigente), CONTRACT-INSTITUTIONAL-LIFECYCLE (actor model de `approved` y validaciones formales).
- **Upstream (contrato estructural):** CONTRACT-LOCAL-HEALTH-PLAN-DOCUMENT (qué contiene el PLS).
- **Paralelo:** CONTRACT-LOCAL-HEALTH-PROFILE-COMPILER (histórico; patrón de compilación análogo para el PSL-C).
- **Downstream:** Exportación DOCX/PDF/HTML (futura capa Renderer + Exporter).
- **Relacionado:** CONTRACT-COMPILER (reserva arquitectónica histórica; este contrato es su especificación operativa para el PLS).

---

## 16. Prerequisitos antes de implementar

Los siguientes elementos deben estar resueltos antes de escribir el código del `LocalHealthPlanCompiler`:

| Prerequisito | Estado | Contrato |
|---|---|---|
| Tipos de dominio `LocalHealthPlanDocument`, `CompilationManifest` | ✅ Completado (Sprint 2.3) | Este contrato |
| Actor model del estado `"approved"` del PSL | ✅ Completado (Sprint 2) | CONTRACT-INSTITUTIONAL-LIFECYCLE |
| Handler `handleApprovePSL` en UI | ✅ Completado (Sprint 2) | CONTRACT-INSTITUTIONAL-LIFECYCLE §7 |
| Mecanismo de validación formal del `ActionPlanDraft` (G-PLS-5) | ✅ Completado (Sprint 2) | CONTRACT-INSTITUTIONAL-LIFECYCLE §4 |
| Mecanismo de validación formal del `AgendaDraft` (G-PLS-6) | ✅ Completado (Sprint 2) | CONTRACT-INSTITUTIONAL-LIFECYCLE §4 |
| `UnaddressedNeed[]` en `ActionPlanDraft` (G-PLS-7) | ✅ Soporte de dominio, captura UI y transporte documental completados (2026-09-24); consumo por `LocalHealthPlanCompiler` pendiente | `PlanPreparationDraft.unaddressedNeeds`, `PlanPreparationPanel`, `PlanDocument.unaddressedNeeds` |
| `PLSEvaluationFramework` (marco de evaluación, G-PLS-10) | ✅ Tipo canónico, captura UI y transporte documental completados (2026-09-24); consumo por `LocalHealthPlanCompiler` pendiente | `PLSEvaluationFramework`, `PlanPreparationDraft.evaluationFramework`, `PlanPreparationPanel`, `PlanDocument.evaluationFramework` |

---

## 17. Exclusiones

Este contrato NO regula:
- El formato de exportación DOCX/PDF/HTML (responsabilidad futura del Renderer).
- La aprobación institucional (acto humano externo; el sistema la registra, no la produce).
- La implementación del MTE canónico (`CONTRACT-MTE`), ya gobernada fuera de este contrato.
- El StrategicRepository (CONTRACT-STRATEGIC-REPOSITORY).
- La evaluación de impacto post-ejecución (stage `evaluation`, sin implementación activa).


## 18. Compilación inicial para revisión (2026-09-28)

La acción «Generar borrador del Plan Local de Salud» produce un documento de
trabajo independiente del compilador terminal y del esbozo vivo. Incluye el
modelo completo del PSL-C vigente (lectura y anexo técnico), prioridades del
Perfil sellado y último Plan de Acción validado del mismo municipio.
Requiere Perfil validado o aprobado, no obsoleto, y un PSL-C canónico coherente
con su versión y contenido. No reconstruye documentos desde borradores vivos.

Las actuaciones, agenda, recursos, evaluación incompleta y aprobación se
declaran pendientes sin bloquear esta compilación inicial. No satisface ni
elude los gates del documento institucional definitivo. Se identifica como
BORRADOR y conserva fechas e identidades de las versiones utilizadas.
El modelo generado se mantiene en memoria para consulta y descarga Word/PDF;
no se acumulan copias completas en localStorage. Al cambiar las fuentes
validadas, se exige generar de nuevo antes de descargar.
