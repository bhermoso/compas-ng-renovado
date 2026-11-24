# CONTRACT-STRATEGIC-TRANSLATION

> Contrato del Motor de Traducción Estratégica de COMPÁS NG.
> Versión 1.0 — Sprint 1 — 2026-06-27
> **Estado: ARCHIVADO — Supersedido por CONTRACT-MTE.md (2026-06-30)**

---

## Estado

**Diseño conceptual. No implementar en Sprint 1.**

Este contrato define el flujo, las responsabilidades y las restricciones del Motor de Traducción Estratégica. La implementación requiere que estén disponibles el PSL validado, las Priorizaciones y el Repositorio Estratégico Territorial.

---

## Propósito

El Motor de Traducción Estratégica (MTE) transforma el diagnóstico territorial validado en un borrador de Plan de Acción alineado con los marcos estratégicos del Repositorio Estratégico Territorial.

No produce planes definitivos. Produce borradores que requieren validación y ajuste por parte del equipo técnico.

---

## Flujo canónico

```
PSL validado
    ↓
Priorizaciones (temas seleccionados por el equipo técnico)
    ↓
Repositorio Estratégico Territorial
    ↓
Motor de Traducción Estratégica
    ↓
Borrador de Plan de Acción
    ↓
Revisión y validación técnica
    ↓
Plan de Acción aprobado
```

Ningún paso puede saltarse. El MTE no puede consumir un PSL sin validar.

---

## Contrato de entrada

```typescript
// Diseño conceptual — no implementar todavía

interface StrategicTranslationInput {
  psl: LocalHealthProfile;                       // PSL en estado "validated" o "approved"
  prioritization: PSLPriorizacion;               // temas priorizados por el equipo técnico
  strategicRepository: StrategicRepository;      // recursos disponibles para alineación
  municipalityContext: MunicipalContext;          // contexto del municipio
}
```

**Precondiciones obligatorias:**

1. `psl.status` debe ser `"validated"` o `"approved"`. El MTE rechaza PSLs en estado `"generated"` o `"review"`.
2. `prioritization` debe contener al menos un tema prioritario seleccionado.
3. `strategicRepository` debe contener al menos un recurso estratégico cargado.

---

## Contrato de salida

```typescript
// Diseño conceptual — no implementar todavía

interface StrategicTranslationOutput {
  municipalityId: MunicipalityId;
  generatedAt: string;
  pslVersion: string;

  alignments: StrategicAlignment[];           // correspondencias detectadas
  proposedActions: ProposedAction[];          // acciones candidatas
  unaddressedPriorities: string[];            // prioridades sin recursos estratégicos identificados

  derivationTrace: StrategicDerivationTrace; // trazabilidad completa
  requiresHumanValidation: true;
  validationWarnings: string[];
}

interface StrategicAlignment {
  priorityTopic: string;
  resourceId: string;                         // recurso del repositorio
  lineId?: string;
  objectiveId?: string;
  alignmentStrength: "direct" | "thematic";
  rationale: string;
}

interface ProposedAction {
  id: string;
  title: string;
  priorityTopic: string;
  alignedObjectiveId?: string;
  alignedActionId?: string;
  sourceRationale: string;
  targetPopulation?: string[];
  requiresHumanValidation: true;
}
```

---

## Responsabilidades del Motor

1. **Identificar** correspondencias entre los temas priorizados del PSL y los recursos del Repositorio Estratégico.
2. **Proponer** acciones candidatas derivadas de esas correspondencias.
3. **Señalar** las prioridades del PSL que no tienen correspondencia en el Repositorio.
4. **Trazar** de forma completa y auditable el origen de cada propuesta.
5. **Marcar** toda salida como `requiresHumanValidation: true`.

---

## Restricciones explícitas

El Motor de Traducción Estratégica **no puede**:

1. Generar un Plan de Acción definitivo sin validación técnica humana.
2. Ponderar automáticamente la importancia de los recursos estratégicos.
3. Descartar prioridades del PSL porque no tengan recursos identificados.
4. Inferir que una acción del Repositorio es obligatoria para el municipio.
5. Producir texto narrativo sin que el equipo técnico lo revise y apruebe.
6. Establecer plazos, responsables o presupuestos sin intervención humana.

**Invariante de no sustitución:**

> Ninguna salida del Motor de Traducción Estratégica puede presentarse como decisión territorial. Todo output es una propuesta que requiere validación, ajuste y aprobación por parte del equipo técnico municipal o autonómico responsable.

Este invariante debe estar presente en toda interfaz que muestre resultados del MTE.

---

## Trazabilidad

Cada propuesta del MTE incluye una cadena de trazabilidad completa:

```
Átomo de evidencia (EvidenceStore)
    ↑
Capítulo del PSL
    ↑
Tema priorizado (Priorizaciones)
    ↑
Correspondencia estratégica (Repositorio Estratégico)
    ↑
Acción propuesta (Output del MTE)
```

Toda propuesta sin trazabilidad completa es inválida.

---

## Diferencia respecto a las inferencias del MIT

| | MIT (Motor Interpretación Territorial) | MTE (Motor Traducción Estratégica) |
|---|---|---|
| Entrada | EvidenceStore | PSL validado + Repositorio Estratégico |
| Salida | LT1, OIT, PSL borrador | Borrador de Plan de Acción |
| Nivel | Diagnóstico | Planificación |
| Comparación | Interna (muestra municipal) | Externa (marcos normativos) |

---

## Referencia cruzada

- Repositorio Estratégico → CONTRACT-STRATEGIC-REPOSITORY.md
- PSL → CONTRACT-LOCAL-HEALTH-PROFILE-METHODOLOGY.md (antes CONTRACT-MIT-PSL.md, histórico)
- Plan de Acción → CONTRACT-ACTION-PLAN.md
- EvidenceStore → CONTRACT-EVIDENCE.md

---

*La decisión territorial corresponde siempre al equipo técnico.*
