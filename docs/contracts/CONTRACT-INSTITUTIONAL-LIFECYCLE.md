# CONTRACT-INSTITUTIONAL-LIFECYCLE

> COMPÁS NG — Contrato del modelo institucional de estados, validaciones y aprobaciones
> Sprint 2.4 — 2026-06-28 | Recertificado 2026-06-29
> Estado: VIGENTE

---

## 1. Finalidad

Este contrato define el modelo canónico de ciclos de vida institucional de los objetos de COMPÁS NG.

Responde a tres preguntas:
1. ¿Qué estados puede tener un objeto institucional y qué significa cada uno?
2. ¿Quién puede ejecutar cada transición y qué evidencia requiere?
3. ¿Qué significa "formalmente validado" y "aprobado institucionalmente"?

El modelo es reutilizable por todos los productos institucionales presentes y futuros.

---

## 2. Taxonomía de objetos por ciclo de vida

COMPÁS NG distingue tres tipos de objetos según su ciclo de vida:

| Tipo | Mutabilidad | Ejemplo | Ciclo de vida |
|---|---|---|---|
| **Objeto efímero** | Se regenera en cada render | `ActionPlanDraft`, `AgendaDraft`, `MonitoringDraft` | No tiene estados propios; recibe validación formal como registro externo |
| **Objeto vivo con estados** | Persiste; evoluciona por transiciones explícitas | `LocalHealthProfile` | 6 estados (§3) |
| **Artefacto institucional** | Inmutable tras compilación | `LocalHealthProfileArtifact`, `LocalHealthPlanDocument` | `isCongealed: true`; sin transiciones |

---

## 3. Ciclo de vida del LocalHealthProfile (PSL)

El PSL es el único objeto vivo con ciclo de vida de estados complejo.

### 3.1 Estados

| Estado | Significado | Activado por |
|---|---|---|
| `generated` | Borrador generado automáticamente. Requiere revisión técnica. | Sistema |
| `review` | En revisión técnica activa; conserva el contenido cuando se retira una validación. | Técnico de salud pública |
| `validated` | Validado técnicamente por el equipo. Habilita el PSL-C y el Nivel 3. | Técnico de salud pública / coordinación |
| `approved` | Aprobado institucionalmente por el Grupo Motor o equivalente. Prerequisito del PLS. | Grupo Motor / coordinación |
| `superseded` | Sustituido por un PSL posterior del mismo municipio. | Sistema (al validar un nuevo PSL) |
| `archived` | Retirado por cierre, obsolescencia o decisión técnica. | Técnico / coordinación |

### 3.2 Transiciones permitidas

```
generated ──── [técnico/coord.] ────→ validated
    │                                    │
    │                               [técnico/coord.]
    │                                    ↓
    │                                 review  (retirada de validación)
    │
[técnico/coord.]                    validated ──── [GrupoMotor/coord.] ──→ approved
    ↓                                   │
archived                           [técnico/coord.]
                                        ↓
                                     archived
```

### 3.3 Irreversibilidad

| Transición | Reversible |
|---|---|
| `generated/review → validated` | Sí (mediante retirada de validación → vuelve a `review` sin perder contenido) |
| `validated → approved` | No reversible directamente; si la evidencia cambia, se puede abrir un nuevo ciclo |
| `→ archived` | No. Los archivados permanecen en historial. |
| `→ superseded` | No. |

### 3.4 Lo que NO cambia con el estado `approved`

El estado `approved` del PSL indica aprobación institucional del proceso de planificación. No implica:
- Aprobación del PLS compilado (eso es `InstitutionalApproval` en `LocalHealthPlanDocument`).
- Aprobación por la corporación municipal (eso corresponde al PLS).
- Congelación del PSL (el PSL sigue siendo un objeto vivo; su estado solo indica el nivel de aprobación alcanzado).

---

## 4. Validación formal de objetos efímeros del Nivel 3

Los borradores del Nivel 3 (`ActionPlanDraft`, `AgendaDraft`, `MonitoringDraft`) son funciones puras que devuelven objetos regenerados en cada render. No tienen estados propios.

La validación formal es un `FormalValidationRecord` almacenado en `workspace.formalValidations[]`.

### 4.1 ¿Qué significa "formalmente validado"?

Un borrador del Nivel 3 está formalmente validado cuando el Grupo Motor lo ha revisado, deliberado y adoptado explícitamente como base para la planificación formal del municipio.

Criterio FVAL-01 (modificado 2026-10-19, `CONTRACT-PROFILE-VALIDATION-QUALITY`): la validación formal ya no exige un Perfil validado. Se rechaza solo cuando el Perfil está sustituido o archivado. El registro guarda el nivel del criterio «Perfil validado» en `profileValidationAtValidation` (opcional).

La validación formal NO implica:
- Que el borrador queda congelado (sigue siendo efímero).
- Que el contenido no pueda revisarse (la validación puede rehacerse).
- Que el Grupo Motor está de acuerdo con todos los detalles (la adopción puede incluir notas de modificación).

### 4.2 Estructura del FormalValidationRecord

```typescript
interface FormalValidationRecord {
  id: string;
  target: "action-plan" | "agenda" | "monitoring-framework";
  sourcePSLId: string;        // ID del PSL al que corresponde
  sourcePSLVersion: string;   // version del PSL en el momento de validar
  validatedAt: string;
  validatedBy: string;
  validatedByRole: InstitutionalActorRole;
  externalReference?: string; // acta o referencia al acuerdo del Grupo Motor
  validationNotes?: string;
}
```

### 4.3 Obsolescencia automática

Un `FormalValidationRecord` es obsoleto cuando el PSL activo tiene una `version` distinta a `record.sourcePSLVersion`. Esta comprobación se realiza con `isFormalValidationStale(record, currentPSL)`.

Cuándo queda obsoleta una validación:
- Cuando se retira la validación del PSL (`validated → review`); la versión cambia y el contenido técnico se conserva.
- Cuando el PSL incorpora nueva evidencia y cambia su `evidenceStoreVersion`.
- Cuando se valida un PSL completamente nuevo.

La validación obsoleta no desaparece del historial; solo indica que debe rehacerse.

---

## 5. Aprobación institucional del PSL (PSLApprovalRecord)

### 5.1 Distinción entre psl.approvedAt y PSLApprovalRecord

El campo `psl.approvedAt` y `psl.approvedBy` en `LocalHealthProfile` registran cuándo y quién aprobó. El `PSLApprovalRecord` almacenado en `workspace.pslApproval` registra los datos institucionales completos del acto de aprobación:

- `approvingBody`: el órgano aprobador ("Grupo Motor del proceso RELAS")
- `approvedByRole`: el rol institucional
- `externalReference`: referencia al acta o acuerdo externo
- `notes`: notas opcionales

Ambos son necesarios: el PSL lleva el estado mínimo (para que los gates funcionen); el workspace lleva el registro institucional completo.

### 5.2 Datos obligatorios para la aprobación

| Campo | Tipo | Obligatorio |
|---|---|---|
| `approvedBy` | Nombre + cargo del responsable | Sí |
| `approvedByRole` | `"coordination"` o `"group-motor"` | Sí |
| `approvingBody` | Descripción del órgano | Sí |
| `externalReference` | Referencia al acta | Recomendado |
| `notes` | Notas del proceso | Opcional |

---

## 6. Actor model

### 6.1 Roles

| Rol | Descripción | Puede en PSL | Puede en Nivel 3 |
|---|---|---|---|
| `system` | COMPÁS NG (transiciones automáticas) | Genera borradores | Genera borradores |
| `technical-staff` | Equipo técnico de salud pública | Valida / invalida | No valida formalmente |
| `coordination` | Coordinación del proceso (Distrito, RELAS) | Valida / aprueba | Valida formalmente |
| `group-motor` | Coordinación intersectorial | Aprueba el PSL | Valida formalmente |
| `municipal-council` | Corporación municipal | — | — |

**Nota sobre `municipal-council`:** La corporación municipal aprueba el PLS como documento institucional (`InstitutionalApproval` en `LocalHealthPlanDocument`), no el PSL como objeto vivo. Son actos distintos. La corporación municipal no opera directamente sobre los objetos de COMPÁS NG.

### 6.2 Tabla de permisos por transición

| Transición | Roles permitidos | Evidencia externa | Reversible |
|---|---|---|---|
| `generated → validated` | `technical-staff`, `coordination` | No | Sí |
| `validated → approved` | `coordination`, `group-motor` | Sí (acta) | No |
| `validated → review` (retirada de validación) | `technical-staff`, `coordination` | No | Sí, mediante una nueva validación |
| `→ archived` | `technical-staff`, `coordination` | No | No |
| Validación formal Nivel 3 | `coordination`, `group-motor` | Sí (acta) | Sí (si PSL cambia) |
| Aprobación institucional del PLS | `municipal-council` | Sí (acuerdo corporativo) | No |

---

## 7. Implementación

| Componente | Archivo | Estado |
|---|---|---|
| Roles y permisos | `src/domain/institutional-lifecycle/InstitutionalActor.ts` | ✅ Implementado |
| Registro de aprobación del PSL | `src/domain/institutional-lifecycle/PSLApprovalRecord.ts` | ✅ Implementado |
| Registro de validación formal | `src/domain/institutional-lifecycle/FormalValidationRecord.ts` | ✅ Implementado |
| Transición `validated → approved` | `src/application/institutional-lifecycle/approvePSL.ts` | ✅ Implementado |
| Transición `validated → review` | `src/application/institutional-lifecycle/invalidatePSL.ts` | ✅ Implementado |
| Creación de FormalValidationRecord | `src/application/institutional-lifecycle/createFormalValidation.ts` | ✅ Implementado |
| Actualización del workspace | `src/domain/workspace/MunicipalityWorkspace.ts` | ✅ Implementado (`pslApproval`, `formalValidations`) |
| Tests | `tests/institutional-lifecycle.test.ts` (40 tests) | ✅ Implementado |
| Handler `handleApprovePSL` en UI | `src/App.tsx` | ✅ Implementado (Sprint 2) |
| Handler `handleFormalValidation` en UI | `src/App.tsx` | ✅ Implementado (Sprint 2) |
| Panel UI de aprobación del PSL (`PSLApproveAction`) | `src/ui/components/LocalHealthProfileView.tsx` | ✅ Implementado (Sprint 2) |
| Formulario de validación formal (`FormalValidationForm`) | `src/ui/components/FormalValidationForm.tsx` | ✅ Implementado (Sprint 2) |

---

## 8. Invariantes

**I-LC-1 — El sistema solo genera borradores, nunca los aprueba**
Ninguna transición a `"approved"` puede ser ejecutada con `approvedByRole: "system"`.

**I-LC-2 — Los borradores del Nivel 3 no tienen estados propios**
`ActionPlanDraft`, `AgendaDraft` y `MonitoringDraft` tienen `requiresHumanValidation: true` pero no tienen campo `status`. Su nivel de madurez se captura en `FormalValidationRecord`, no en el objeto.

**I-LC-3 — La validación formal del Nivel 3 es relativa al PSL**
Un `FormalValidationRecord` con `sourcePSLVersion !== currentPSL.version` es obsoleto. La validación formal debe rehacerse si el PSL cambia.

**I-LC-4 — Los artefactos compilados no tienen transiciones**
`LocalHealthProfileArtifact` y `LocalHealthPlanDocument` son inmutables (`isCongealed: true`). No pueden cambiar de estado. Si el municipio necesita un nuevo documento, se compila un nuevo artefacto con nueva versión.

**I-LC-5 — La aprobación del PLS es un acto humano externo**
El compilador puede producir el `LocalHealthPlanDocument`. La aprobación por la corporación municipal es un acto institucional externo al sistema, registrado como `InstitutionalApproval`. COMPÁS NG no puede aprobar el documento que produce.

---

## 9. Relaciones

- **CONTRACT-MIT-PSL** — define el PSL y sus 6 estados. Este contrato define quién puede moverlos y con qué evidencia.
- **CONTRACT-LOCAL-HEALTH-PROFILE-COMPILER** — el gate G-LHC-1 requiere `psl.status === "validated"`.
- **CONTRACT-LOCAL-HEALTH-PLAN-COMPILER** — el gate G-PLS-1 requiere `psl.status === "approved"`. Los gates G-PLS-5 y G-PLS-6 requieren `FormalValidationRecord` para el plan y la agenda.
- **CONTRACT-LOCAL-HEALTH-PLAN-DOCUMENT** — define la aprobación institucional del PLS (`InstitutionalApproval`), que es distinta de la aprobación del PSL.

---

## 10. Integración completada en Sprint 2

Todos los elementos de UI identificados como pendientes han sido integrados:

- ✅ Handler `handleApprovePSL` — `src/App.tsx` (línea ~461)
- ✅ Handler `handleFormalValidation` para ActionPlan y Agenda — `src/App.tsx` (línea ~480)
- ✅ Panel UI de aprobación del PSL (`PSLApproveAction`) — `src/ui/components/LocalHealthProfileView.tsx`
- ✅ Visualización del estado de validaciones formales (`FormalValidationForm`) — `src/ui/components/ActionPlanPanel.tsx` y `AgendaPanel.tsx`

Pendiente de sprint posterior: consumo de aprobación y validaciones formales por `LocalHealthPlanCompiler` (ver H-04 y H-05 en `ARCHITECTURAL-GAP-REGISTER.md`).
