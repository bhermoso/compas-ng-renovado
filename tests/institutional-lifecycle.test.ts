import { describe, it, expect } from "vitest";
import {
  approvePSL,
  validateApprovePSL,
  invalidatePSL,
  validateInvalidatePSL,
  createFormalValidation,
  validateCreateFormalValidation,
} from "../src/application/institutional-lifecycle";
import { isFormalValidationStale } from "../src/domain/institutional-lifecycle";
import type { LocalHealthProfile } from "../src/domain/health-profile";

// ── Fixtures ──────────────────────────────────────────────────────────────────

function authoredChapter(content = "Texto del equipo técnico.") {
  return { content, status: "authored" as const, authorshipNote: "requiere autoría" };
}

function basePriorizacion(consenso = true) {
  return {
    candidaturasTecnicas: [{ id: "c1", title: "Salud mental", rationale: "alta prev", relatedEvidenceIds: [] }],
    hasTechnicalCandidatures: true,
    tematicasSeleccionadasIds: ["bienestar"],
    tematicasSeleccionadasLabels: ["Bienestar Emocional"],
    hasParticipatorySelection: true,
    deliberacionNota: consenso ? "Consenso alcanzado por el Grupo Motor." : "Pendiente",
    consensoDocumentado: consenso,
  };
}

function validatedPSL(overrides: Partial<LocalHealthProfile> = {}): LocalHealthProfile {
  return {
    id: "psl-atarfe-001",
    municipalityId: "atarfe",
    status: "validated",
    version: "2026-06-28T10:00:00.000Z",
    evidenceStoreVersion: "2026-06-28T09:00:00.000Z",
    strategicFrameworkSectionIds: ["normativo"],
    healthReportSectionCount: 5,
    healthReportAtomCount: 3,
    totalEvidenceAtoms: 21,
    integrityErrors: 0,
    integrityWarnings: 0,
    atomsByOrigin: {},
    atomsByKind: {},
    evidenceAtomIds: ["ev-1", "ev-2"],
    originsSummary: ["ibse"],
    ibsePresent: true,
    dukePresent: false,
    predimedPresent: false,
    thematicPrioritisationPresent: true,
    complementaryStudyCount: 1,
    territorialSummary: "Resumen territorial.",
    determinantCount: 3,
    assetCount: 2,
    indicatorCount: 5,
    qualitativeFindingCount: 1,
    methodologicalCautionCount: 0,
    preliminaryOpportunities: ["Salud mental"],
    longitudinalActive: false,
    longitudinalNote: "",
    longitudinalEvidenceCount: 0,
    marcosAplicados: [],
    tensionesEstructurales: [],
    conflictos: [],
    tensionesEscaladas: [],
    tensionesNoEscaladas: [],
    ruidoEstructural: [],
    areasDeIntervencion: [],
    conclusiones: authoredChapter("Conclusiones del equipo técnico."),
    cierreInterpretativo: authoredChapter("Cierre interpretativo del equipo técnico."),
    priorizacion: basePriorizacion(true),
    priorizacionStatus: "complete",
    generatedAt: "2026-06-28T09:30:00.000Z",
    validatedAt: "2026-06-28T10:00:00.000Z",
    validatedBy: "Técnica de salud pública",
    requiresHumanValidation: true,
    ...overrides,
  };
}

const BASE_APPROVE_INPUT = {
  psl: validatedPSL(),
  approvedBy: "Coordinadora RELAS — María García López",
  approvedByRole: "coordination" as const,
  approvingBody: "Grupo Motor del proceso RELAS — Municipio de Atarfe",
  externalReference: "Acta Grupo Motor 28/06/2026, punto 3",
};

// ── Tests: validateApprovePSL ─────────────────────────────────────────────────

describe("validateApprovePSL", () => {
  it("PSL validated + datos completos → 0 violaciones", () => {
    expect(validateApprovePSL(BASE_APPROVE_INPUT)).toHaveLength(0);
  });

  it("PSL-APPROVE-01: PSL en estado 'generated' → violación", () => {
    const v = validateApprovePSL({ ...BASE_APPROVE_INPUT, psl: validatedPSL({ status: "generated" }) });
    expect(v.some((x) => x.code === "PSL-APPROVE-01")).toBe(true);
  });

  it("PSL-APPROVE-01: PSL en estado 'approved' → violación (ya aprobado)", () => {
    const v = validateApprovePSL({ ...BASE_APPROVE_INPUT, psl: validatedPSL({ status: "approved" }) });
    expect(v.some((x) => x.code === "PSL-APPROVE-01")).toBe(true);
  });

  it("PSL-APPROVE-02: rol 'technical-staff' no autorizado → violación", () => {
    const v = validateApprovePSL({ ...BASE_APPROVE_INPUT, approvedByRole: "technical-staff" });
    expect(v.some((x) => x.code === "PSL-APPROVE-02")).toBe(true);
  });

  it("PSL-APPROVE-02: rol 'system' no autorizado → violación", () => {
    const v = validateApprovePSL({ ...BASE_APPROVE_INPUT, approvedByRole: "system" });
    expect(v.some((x) => x.code === "PSL-APPROVE-02")).toBe(true);
  });

  it("PSL-APPROVE-02: rol 'group-motor' autorizado → no violación", () => {
    const v = validateApprovePSL({ ...BASE_APPROVE_INPUT, approvedByRole: "group-motor" });
    expect(v.some((x) => x.code === "PSL-APPROVE-02")).toBe(false);
  });

  it("PSL-APPROVE-03: approvedBy vacío → violación", () => {
    const v = validateApprovePSL({ ...BASE_APPROVE_INPUT, approvedBy: "   " });
    expect(v.some((x) => x.code === "PSL-APPROVE-03")).toBe(true);
  });

  it("PSL-APPROVE-04: approvingBody vacío → violación", () => {
    const v = validateApprovePSL({ ...BASE_APPROVE_INPUT, approvingBody: "" });
    expect(v.some((x) => x.code === "PSL-APPROVE-04")).toBe(true);
  });

  it("PSL-APPROVE-05: priorizacionStatus 'partial' → violación", () => {
    const v = validateApprovePSL({
      ...BASE_APPROVE_INPUT,
      psl: validatedPSL({ priorizacionStatus: "partial" }),
    });
    expect(v.some((x) => x.code === "PSL-APPROVE-05")).toBe(true);
  });

  it("PSL-APPROVE-06: consensoDocumentado false → violación", () => {
    const v = validateApprovePSL({
      ...BASE_APPROVE_INPUT,
      psl: validatedPSL({ priorizacion: basePriorizacion(false) }),
    });
    expect(v.some((x) => x.code === "PSL-APPROVE-06")).toBe(true);
  });

  it("múltiples violaciones → todas reportadas", () => {
    const v = validateApprovePSL({
      ...BASE_APPROVE_INPUT,
      psl: validatedPSL({ status: "generated", priorizacionStatus: "scaffold" }),
      approvedByRole: "technical-staff",
      approvedBy: "",
    });
    expect(v.length).toBeGreaterThanOrEqual(3);
  });
});

// ── Tests: approvePSL ─────────────────────────────────────────────────────────

describe("approvePSL — transición validated → approved", () => {
  it("transición válida → ok: true", () => {
    const result = approvePSL(BASE_APPROVE_INPUT);
    expect(result.ok).toBe(true);
  });

  it("el PSL aprobado tiene status 'approved'", () => {
    const result = approvePSL(BASE_APPROVE_INPUT);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.approvedPSL.status).toBe("approved");
  });

  it("el PSL origen no se modifica", () => {
    const psl = validatedPSL();
    const statusAntes = psl.status;
    approvePSL({ ...BASE_APPROVE_INPUT, psl });
    expect(psl.status).toBe(statusAntes);
  });

  it("el PSL aprobado tiene approvedAt definido", () => {
    const result = approvePSL(BASE_APPROVE_INPUT);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.approvedPSL.approvedAt).toBeTruthy();
  });

  it("el PSL aprobado preserva id y version del origen", () => {
    const psl = validatedPSL();
    const result = approvePSL({ ...BASE_APPROVE_INPUT, psl });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.approvedPSL.id).toBe(psl.id);
      expect(result.approvedPSL.version).toBe(psl.version);
    }
  });

  it("el approvalRecord tiene todos los campos de trazabilidad", () => {
    const psl = validatedPSL();
    const result = approvePSL({ ...BASE_APPROVE_INPUT, psl });
    expect(result.ok).toBe(true);
    if (result.ok) {
      const r = result.approvalRecord;
      expect(r.pslId).toBe(psl.id);
      expect(r.pslVersion).toBe(psl.version);
      expect(r.pslEvidenceStoreVersion).toBe(psl.evidenceStoreVersion);
      expect(r.approvedBy).toBe(BASE_APPROVE_INPUT.approvedBy);
      expect(r.approvedByRole).toBe(BASE_APPROVE_INPUT.approvedByRole);
      expect(r.approvingBody).toBe(BASE_APPROVE_INPUT.approvingBody);
      expect(r.externalReference).toBe(BASE_APPROVE_INPUT.externalReference);
    }
  });

  it("PSL no válido → ok: false, sin approvedPSL ni approvalRecord", () => {
    const result = approvePSL({ ...BASE_APPROVE_INPUT, psl: validatedPSL({ status: "generated" }) });
    expect(result.ok).toBe(false);
    expect("approvedPSL" in result).toBe(false);
    expect("approvalRecord" in result).toBe(false);
  });

  it("externalReference es opcional", () => {
    const inputSinRef = { ...BASE_APPROVE_INPUT };
    delete inputSinRef.externalReference;
    const result = approvePSL(inputSinRef);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.approvalRecord.externalReference).toBeUndefined();
  });
});

// ── Tests: invalidatePSL ──────────────────────────────────────────────────────

describe("invalidatePSL — transición validated → review", () => {
  it("retira la validación y conserva íntegramente el contenido técnico", () => {
    const psl = validatedPSL();
    const result = invalidatePSL({
      psl,
      invalidatedAt: "2026-06-29T08:00:00.000Z",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.reviewedPSL.status).toBe("review");
    expect(result.reviewedPSL.version).toBe("2026-06-29T08:00:00.000Z");
    expect(result.reviewedPSL.reviewStartedAt).toBe("2026-06-29T08:00:00.000Z");
    expect(result.reviewedPSL.validatedAt).toBeUndefined();
    expect(result.reviewedPSL.validatedBy).toBeUndefined();
    expect(result.reviewedPSL.conclusiones).toEqual(psl.conclusiones);
    expect(result.reviewedPSL.cierreInterpretativo).toEqual(psl.cierreInterpretativo);
    expect(result.reviewedPSL.priorizacion).toEqual(psl.priorizacion);
    expect(psl.status).toBe("validated");
  });

  it("rechaza retirar la validación de un Perfil aprobado", () => {
    const result = invalidatePSL({
      psl: validatedPSL({ status: "approved" }),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.violations.some((v) => v.code === "PSL-INVALIDATE-01")).toBe(true);
    }
  });

  it("la validación previa queda obsoleta al cambiar la versión", () => {
    const psl = validatedPSL();
    const record = {
      id: "fval-before-invalidation",
      target: "action-plan" as const,
      sourcePSLId: psl.id,
      sourcePSLVersion: psl.version,
      validatedAt: "2026-06-28T11:00:00.000Z",
      validatedBy: "Coordinadora RELAS",
      validatedByRole: "group-motor" as const,
    };
    const result = invalidatePSL({
      psl,
      invalidatedAt: "2026-06-29T08:00:00.000Z",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(isFormalValidationStale(record, result.reviewedPSL)).toBe(true);
    }
  });

  it("validateInvalidatePSL rechaza estados que no están validados", () => {
    expect(
      validateInvalidatePSL({ psl: validatedPSL({ status: "review" }) })
        .some((v) => v.code === "PSL-INVALIDATE-01")
    ).toBe(true);
  });
});

// ── Tests: createFormalValidation ─────────────────────────────────────────────

describe("validateCreateFormalValidation", () => {
  const BASE_FVAL = {
    target: "action-plan" as const,
    psl: validatedPSL(),
    validatedBy: "Coordinadora RELAS — María García López",
    validatedByRole: "group-motor" as const,
    externalReference: "Acta Grupo Motor 28/06/2026",
  };

  it("datos válidos → 0 violaciones", () => {
    expect(validateCreateFormalValidation(BASE_FVAL)).toHaveLength(0);
  });

  it("FVAL-01: PSL en estado 'generated' → SIN violación (la validación del Perfil es criterio de calidad)", () => {
    const v = validateCreateFormalValidation({
      ...BASE_FVAL,
      psl: validatedPSL({ status: "generated" }),
    });
    expect(v.some((x) => x.code === "FVAL-01")).toBe(false);
  });

  it("FVAL-01: PSL archivado → violación", () => {
    const v = validateCreateFormalValidation({
      ...BASE_FVAL,
      psl: validatedPSL({ status: "archived" }),
    });
    expect(v.some((x) => x.code === "FVAL-01")).toBe(true);
  });

  it("FVAL-01: PSL en estado 'approved' → SIN violación (puede validar borradores con PSL aprobado)", () => {
    const v = validateCreateFormalValidation({
      ...BASE_FVAL,
      psl: validatedPSL({ status: "approved", approvedAt: "2026-06-28T12:00:00.000Z", approvedBy: "coord" }),
    });
    expect(v.some((x) => x.code === "FVAL-01")).toBe(false);
  });

  it("FVAL-02: rol 'technical-staff' no autorizado → violación", () => {
    const v = validateCreateFormalValidation({ ...BASE_FVAL, validatedByRole: "technical-staff" });
    expect(v.some((x) => x.code === "FVAL-02")).toBe(true);
  });

  it("FVAL-02: rol 'coordination' autorizado → sin violación", () => {
    const v = validateCreateFormalValidation({ ...BASE_FVAL, validatedByRole: "coordination" });
    expect(v.some((x) => x.code === "FVAL-02")).toBe(false);
  });

  it("FVAL-03: validatedBy vacío → violación", () => {
    const v = validateCreateFormalValidation({ ...BASE_FVAL, validatedBy: "  " });
    expect(v.some((x) => x.code === "FVAL-03")).toBe(true);
  });
});

describe("createFormalValidation", () => {
  const BASE_FVAL = {
    target: "action-plan" as const,
    psl: validatedPSL(),
    validatedBy: "Coordinadora RELAS",
    validatedByRole: "group-motor" as const,
  };

  it("crea registro con sourcePSLId correcto", () => {
    const result = createFormalValidation(BASE_FVAL);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.record.sourcePSLId).toBe(BASE_FVAL.psl.id);
  });

  it("crea registro con sourcePSLVersion correcto", () => {
    const result = createFormalValidation(BASE_FVAL);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.record.sourcePSLVersion).toBe(BASE_FVAL.psl.version);
  });

  it("crea registro con id UUID único", () => {
    const r1 = createFormalValidation(BASE_FVAL);
    const r2 = createFormalValidation(BASE_FVAL);
    expect(r1.ok).toBe(true);
    expect(r2.ok).toBe(true);
    if (r1.ok && r2.ok) {
      expect(r1.record.id).not.toBe(r2.record.id);
    }
  });

  it("target 'agenda' produce registro correcto", () => {
    const result = createFormalValidation({ ...BASE_FVAL, target: "agenda" });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.record.target).toBe("agenda");
  });

  it("error → ok: false, sin record", () => {
    const result = createFormalValidation({ ...BASE_FVAL, validatedBy: "" });
    expect(result.ok).toBe(false);
    expect("record" in result).toBe(false);
  });
});

// ── Tests: isFormalValidationStale ────────────────────────────────────────────

describe("isFormalValidationStale", () => {
  const psl = validatedPSL();

  function makeRecord(pslId = psl.id, pslVersion = psl.version) {
    return {
      id: "fval-1",
      target: "action-plan" as const,
      sourcePSLId: pslId,
      sourcePSLVersion: pslVersion,
      validatedAt: "2026-06-28T11:00:00.000Z",
      validatedBy: "Coordinadora RELAS",
      validatedByRole: "group-motor" as const,
    };
  }

  it("mismo PSL → NO obsoleta", () => {
    const record = makeRecord(psl.id, psl.version);
    expect(isFormalValidationStale(record, psl)).toBe(false);
  });

  it("PSL distinto → obsoleta", () => {
    const record = makeRecord("otro-psl-id", psl.version);
    expect(isFormalValidationStale(record, psl)).toBe(true);
  });

  it("misma PSL id pero versión diferente → obsoleta", () => {
    const record = makeRecord(psl.id, "2026-06-27T09:00:00.000Z");
    expect(isFormalValidationStale(record, psl)).toBe(true);
  });

  it("PSL con nueva version → valida previa queda obsoleta", () => {
    const recordViejo = makeRecord(psl.id, "2026-06-27T09:00:00.000Z");
    const pslActual = { id: psl.id, version: "2026-06-28T10:00:00.000Z" };
    expect(isFormalValidationStale(recordViejo, pslActual)).toBe(true);
  });
});

// ── Tests: modelo de estados ──────────────────────────────────────────────────

describe("modelo canónico de estados", () => {
  it("PSL validated puede aprobarse", () => {
    const result = approvePSL(BASE_APPROVE_INPUT);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.approvedPSL.status).toBe("approved");
  });

  it("PSL generated NO puede aprobarse directamente", () => {
    const result = approvePSL({
      ...BASE_APPROVE_INPUT,
      psl: validatedPSL({ status: "generated" }),
    });
    expect(result.ok).toBe(false);
  });

  it("PSL approved NO puede aprobarse de nuevo (se requiere nuevo ciclo)", () => {
    const pslAprobado = validatedPSL({ status: "approved", approvedAt: "2026-06-28T11:00:00.000Z", approvedBy: "x" });
    const result = approvePSL({ ...BASE_APPROVE_INPUT, psl: pslAprobado });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.violations.some((v) => v.code === "PSL-APPROVE-01")).toBe(true);
  });

  it("system actor NO puede aprobar el PSL", () => {
    const result = approvePSL({ ...BASE_APPROVE_INPUT, approvedByRole: "system" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.violations.some((v) => v.code === "PSL-APPROVE-02")).toBe(true);
  });

  it("municipal-council NO puede realizar validaciones formales del Nivel 3", () => {
    const result = createFormalValidation({
      target: "action-plan",
      psl: validatedPSL(),
      validatedBy: "Alcalde de Atarfe",
      validatedByRole: "municipal-council",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.violations.some((v) => v.code === "FVAL-02")).toBe(true);
  });

  it("flujo completo: validated → approved → formal validation agenda", () => {
    // 1. Aprobación del PSL
    const approveResult = approvePSL(BASE_APPROVE_INPUT);
    expect(approveResult.ok).toBe(true);
    if (!approveResult.ok) return;

    // 2. Validación formal de la agenda sobre el PSL aprobado
    const fvalResult = createFormalValidation({
      target: "agenda",
      psl: approveResult.approvedPSL,
      validatedBy: "Coordinadora RELAS",
      validatedByRole: "group-motor",
      externalReference: "Acta Grupo Motor — sesión de agenda",
    });
    expect(fvalResult.ok).toBe(true);
    if (!fvalResult.ok) return;

    // 3. La validación NO es obsoleta con el PSL aprobado
    expect(isFormalValidationStale(fvalResult.record, approveResult.approvedPSL)).toBe(false);
  });
});
