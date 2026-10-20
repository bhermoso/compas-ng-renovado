/**
 * mte-atarfe-validation.test.ts — Unidad 6
 *
 * Validación institucional del Motor de Traducción Estratégica (Producto 5)
 * con datos canónicos del municipio piloto Atarfe (Granada).
 *
 * Siete bloques de verificación conforme a CONTRACT-MTE.md §11.
 * No amplía el algoritmo. No modifica el dominio.
 * Constituye la base de evidencia del expediente PRODUCT-5-MTE-CERTIFICATION.md.
 *
 * Limitación conocida de la validación:
 * El PSL de Atarfe utilizado corresponde al fixture canónico de la suite
 * de tests (basePSL equivalente). El PSL producido por el pipeline
 * completo desde datos REDCap reales queda pendiente de orquestación UI
 * (D3-03: handler validated → approved). Esto no es un defecto del MTE.
 */

import { describe, expect, it, beforeAll } from "vitest";
import type {
  LocalHealthProfile,
  PSLScaffoldChapter,
  PSLPriorizacion,
} from "../src/domain/health-profile";
import type { LecturaEstrategicaLocal } from "../src/domain/strategic-scenario";
import { translate } from "../src/application/mte";
import { StaticFrameworkProvider } from "../src/application/mte";
import { getAllStrategicElements } from "../src/domain/strategy";

// ── Infraestructura de conocimiento estratégico ───────────────────────────────

const providerAtarfe = new StaticFrameworkProvider(
  getAllStrategicElements(),
  "1.0.0"
);

// ── PSL canónico de Atarfe ────────────────────────────────────────────────────
// Replica fielmente el fixture institucional del municipio piloto.
// Dos áreas de intervención (diagnóstico real 2025).

function authoredChapter(content: string): PSLScaffoldChapter {
  return { content, status: "authored", authorshipNote: "Requiere autoría humana." };
}

function priorizacionAtarfe(): PSLPriorizacion {
  return {
    candidaturasTecnicas: [
      { id: "cand-1", title: "Salud mental", rationale: "Alta prevalencia", relatedEvidenceIds: ["ev-1"] },
    ],
    hasTechnicalCandidatures: true,
    tematicasSeleccionadasIds: ["bienestar-emocional"],
    tematicasSeleccionadasLabels: ["Bienestar Emocional"],
    hasParticipatorySelection: true,
    deliberacionNota: "El Grupo Motor deliberó y alcanzó consenso.",
    consensoDocumentado: true,
  };
}

/** PSL validado de Atarfe con dos áreas de intervención y una tensión escalada. */
const PSL_ATARFE: LocalHealthProfile = {
  id: "psl-atarfe-001",
  municipalityId: "atarfe",
  status: "validated",
  version: "2026-06-28T10:00:00.000Z",
  evidenceStoreVersion: "2026-06-28T09:00:00.000Z",
  strategicFrameworkSectionIds: ["normativo", "estrategico", "metodologico"],
  healthReportDocumentId: "doc-informe-salud",
  healthReportTitle: "Informe de Salud de Atarfe 2025",
  healthReportSectionCount: 12,
  healthReportAtomCount: 8,
  totalEvidenceAtoms: 21,
  integrityErrors: 0,
  integrityWarnings: 2,
  atomsByOrigin: { ibse: 6, "health-report": 8, duke: 4, predimed: 3 },
  atomsByKind: { indicator: 10, determinant: 5, asset: 4, "methodological-caution": 2 },
  evidenceAtomIds: ["ev-1", "ev-2", "ev-3", "ev-4", "ev-5"],
  originsSummary: ["duke", "health-report", "ibse", "predimed"],
  ibsePresent: true,
  dukePresent: true,
  predimedPresent: true,
  sf12Present: false,
  suenoPresent: false,
  cagePresent: false,
  thematicPrioritisationPresent: true,
  complementaryStudyCount: 3,
  territorialSummary:
    "El territorio de Atarfe presenta un perfil de salud con fortalezas en cohesión social.",
  determinantCount: 5,
  assetCount: 4,
  indicatorCount: 10,
  qualitativeFindingCount: 2,
  methodologicalCautionCount: 2,
  preliminaryOpportunities: ["Salud mental", "Alimentación saludable"],
  longitudinalActive: false,
  longitudinalNote: "",
  longitudinalEvidenceCount: 0,
  marcosAplicados: [{ framework: "EPVSA", elementCount: 4 }],
  tensionesEstructurales: ["Brecha socioeconómica norte-sur"],
  conflictos: [],
  tensionesEscaladas: [
    {
      descripcion: "Tensión entre indicadores de bienestar emocional escolar (IBSE) y la ausencia de recursos de salud mental comunitaria accesibles en Atarfe.",
      clasificacion: "escalada",
      criteriosCumplidos: 3,
    },
  ],
  tensionesNoEscaladas: [],
  ruidoEstructural: [],
  areasDeIntervencion: [
    {
      id: "ait-1",
      title: "Salud mental comunitaria",
      rationale:
        "Alta prevalencia de malestar emocional en la población escolar y adulta. " +
        "El IBSE muestra puntuaciones medias-bajas en bienestar socioemocional. " +
        "DUKE evidencia apoyo social funcional moderado. " +
        "Área sin recursos comunitarios accesibles de salud mental.",
      relatedEvidenceIds: ["ev-1", "ev-3"],
      cautions: ["Datos IBSE limitados a población escolar; no extrapolables directamente a la población adulta."],
    },
    {
      id: "ait-2",
      title: "Alimentación saludable",
      rationale:
        "Adherencia media-alta a la dieta mediterránea (PREDIMED), pero con tendencia a dieta poco saludable en hábitos cotidianos declarados. " +
        "Área con mayor presión comunitaria en procesos de priorización participativa.",
      relatedEvidenceIds: ["ev-2", "ev-4", "ev-5"],
      cautions: [],
    },
  ],
  conclusiones: authoredChapter(
    "El municipio de Atarfe presenta una situación de salud compleja " +
    "con necesidades identificadas en salud mental y nutrición."
  ),
  cierreInterpretativo: authoredChapter(
    "El diagnóstico presenta limitaciones en la cobertura de datos cualitativos. " +
    "Las áreas identificadas requieren validación del equipo técnico."
  ),
  priorizacion: priorizacionAtarfe(),
  priorizacionStatus: "complete",
  generatedAt: "2026-06-28T09:30:00.000Z",
  validatedAt: "2026-06-28T10:00:00.000Z",
  validatedBy: "Técnica de salud pública — DAP Granada-Metro",
  requiresHumanValidation: true,
};

const NOW_TEST = "2026-06-30T12:00:00.000Z";

// ── Resultado de referencia (ejecutado una sola vez) ──────────────────────────

let lecturaAtarfe: LecturaEstrategicaLocal;

beforeAll(() => {
  const result = translate(PSL_ATARFE, providerAtarfe, NOW_TEST);
  if (!result.ok) throw new Error(`MTE falló inesperadamente: ${result.violations.join("; ")}`);
  lecturaAtarfe = result.lectura;
});

// ── Bloque 1 — Gates sobre datos reales ───────────────────────────────────────

describe("Bloque 1 — Gates con datos reales de Atarfe", () => {

  it("PSL de Atarfe en estado 'validated' → { ok: true }", () => {
    const result = translate(PSL_ATARFE, providerAtarfe, NOW_TEST);
    expect(result.ok).toBe(true);
  });

  it("G-MTE-1: PSL no validado (generado) → { ok: true } (criterio de calidad, no requisito)", () => {
    const pslNoValidado = { ...PSL_ATARFE, status: "generated" as const };
    const result = translate(pslNoValidado, providerAtarfe, NOW_TEST);
    expect(result.ok).toBe(true);
  });

  it("G-MTE-1: PSL archivado → { ok: false }", () => {
    const result = translate({ ...PSL_ATARFE, status: "archived" as const }, providerAtarfe, NOW_TEST);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.violations[0]).toContain("G-MTE-1");
  });

  it("G-MTE-2: PSL de Atarfe con áreas vacías → hasTranslatableContent: false", () => {
    const pslSinAreas = { ...PSL_ATARFE, areasDeIntervencion: [] };
    const result = translate(pslSinAreas, providerAtarfe, NOW_TEST);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.lectura.hasTranslatableContent).toBe(false);
      expect(result.lectura.escenarios).toHaveLength(0);
    }
  });

  it("G-MTE-3: provider null sobre datos reales → { ok: false }", () => {
    const result = translate(PSL_ATARFE, null, NOW_TEST);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.violations[0]).toContain("G-MTE-3");
  });

  it("proveedor con el registro completo tiene elementos suficientes para operar", () => {
    expect(providerAtarfe.getElements().length).toBeGreaterThan(10);
    expect(providerAtarfe.getVersion()).toBe("1.0.0");
  });
});

// ── Bloque 2 — Escenarios: relación 1:1 ──────────────────────────────────────

describe("Bloque 2 — Escenarios: relación 1:1 con las áreas del PSL", () => {

  it("número de escenarios = número de áreas de intervención del PSL", () => {
    expect(lecturaAtarfe.escenarios).toHaveLength(PSL_ATARFE.areasDeIntervencion.length);
    expect(lecturaAtarfe.escenarios).toHaveLength(2);
  });

  it("no aparecen escenarios adicionales sin área de origen en el PSL", () => {
    const areaIds = new Set(PSL_ATARFE.areasDeIntervencion.map((a) => a.id));
    for (const e of lecturaAtarfe.escenarios) {
      expect(e.areasOrigen).toHaveLength(1);
      expect(areaIds.has(e.areasOrigen[0])).toBe(true);
    }
  });

  it("todos los ids de área están representados como areasOrigen en algún escenario", () => {
    const idsEnEscenarios = new Set(lecturaAtarfe.escenarios.flatMap((e) => e.areasOrigen));
    for (const area of PSL_ATARFE.areasDeIntervencion) {
      expect(idsEnEscenarios.has(area.id)).toBe(true);
    }
  });

  it("escenario 1 corresponde a 'Salud mental comunitaria'", () => {
    const e = lecturaAtarfe.escenarios[0];
    expect(e.areasOrigen[0]).toBe("ait-1");
    expect(e.tema).toBe("Salud mental comunitaria");
  });

  it("escenario 2 corresponde a 'Alimentación saludable'", () => {
    const e = lecturaAtarfe.escenarios[1];
    expect(e.areasOrigen[0]).toBe("ait-2");
    expect(e.tema).toBe("Alimentación saludable");
  });

  it("hasTranslatableContent: true porque el PSL tiene áreas", () => {
    expect(lecturaAtarfe.hasTranslatableContent).toBe(true);
  });
});

// ── Bloque 3 — Referencias institucionales ────────────────────────────────────

describe("Bloque 3 — Referencias institucionales exclusivamente del FrameworkProvider", () => {

  it("las referencias de 'Salud mental comunitaria' proceden del proveedor", () => {
    const elementIds = new Set(providerAtarfe.getElements().map((e) => e.id));
    const e = lecturaAtarfe.escenarios[0];
    for (const ref of e.referenciasInstitucionales) {
      expect(elementIds.has(ref.elementoId)).toBe(true);
    }
  });

  it("las referencias de 'Alimentación saludable' proceden del proveedor", () => {
    const elementIds = new Set(providerAtarfe.getElements().map((e) => e.id));
    const e = lecturaAtarfe.escenarios[1];
    for (const ref of e.referenciasInstitucionales) {
      expect(elementIds.has(ref.elementoId)).toBe(true);
    }
  });

  it("'Salud mental comunitaria' tiene cobertura institucional detectada", () => {
    // El área usa palabras clave como "salud", "mental", "emocional" que aparecen en elementos EPVSA/ESCA
    const e = lecturaAtarfe.escenarios[0];
    expect(e.referenciasInstitucionales.length).toBeGreaterThan(0);
    expect(e.sinCoberturaMarcal).toBe(false);
  });

  it("'Alimentación saludable' tiene cobertura institucional detectada", () => {
    // El área usa "alimentación" que aparece en EPVSA-LE2 y EPVSA-LE2-OBJ1
    const e = lecturaAtarfe.escenarios[1];
    expect(e.referenciasInstitucionales.length).toBeGreaterThan(0);
    expect(e.sinCoberturaMarcal).toBe(false);
  });

  it("todas las referencias tienen sourceTrace no vacío (I-SC-3)", () => {
    for (const e of lecturaAtarfe.escenarios) {
      for (const ref of e.referenciasInstitucionales) {
        expect(ref.sourceTrace.trim().length).toBeGreaterThan(0);
        expect(ref.marcoId.trim().length).toBeGreaterThan(0);
        expect(ref.elementoId.trim().length).toBeGreaterThan(0);
        expect(ref.elementoLabel.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("I-SC-7: sinCoberturaMarcal ↔ referencias vacías en todos los escenarios", () => {
    for (const e of lecturaAtarfe.escenarios) {
      if (e.sinCoberturaMarcal) {
        expect(e.referenciasInstitucionales).toHaveLength(0);
      } else {
        expect(e.referenciasInstitucionales.length).toBeGreaterThan(0);
      }
    }
  });
});

// ── Bloque 4 — Trazabilidad ───────────────────────────────────────────────────

describe("Bloque 4 — Trazabilidad contractual", () => {

  it("sourcePSLId apunta al id del PSL de Atarfe", () => {
    expect(lecturaAtarfe.sourcePSLId).toBe("psl-atarfe-001");
  });

  it("sourcePSLVersion apunta a la versión del PSL de Atarfe", () => {
    expect(lecturaAtarfe.sourcePSLVersion).toBe("2026-06-28T10:00:00.000Z");
  });

  it("municipalityId = 'atarfe'", () => {
    expect(lecturaAtarfe.municipalityId).toBe("atarfe");
  });

  it("knowledgeBaseVersion = provider.getVersion()", () => {
    expect(lecturaAtarfe.knowledgeBaseVersion).toBe("1.0.0");
  });

  it("I-SC-1: cada escenario tiene areasOrigen con al menos un id", () => {
    for (const e of lecturaAtarfe.escenarios) {
      expect(e.areasOrigen.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("I-SC-2: tema = title exacto del área sin ninguna modificación", () => {
    expect(lecturaAtarfe.escenarios[0].tema).toBe("Salud mental comunitaria");
    expect(lecturaAtarfe.escenarios[1].tema).toBe("Alimentación saludable");
  });

  it("evidenciaOrigen refleja exactamente los relatedEvidenceIds del área", () => {
    expect(lecturaAtarfe.escenarios[0].evidenciaOrigen).toEqual(["ev-1", "ev-3"]);
    expect(lecturaAtarfe.escenarios[1].evidenciaOrigen).toEqual(["ev-2", "ev-4", "ev-5"]);
  });

  it("cautelasOriginales heredadas desde el área de origen", () => {
    expect(lecturaAtarfe.escenarios[0].cautelasOriginales).toHaveLength(1);
    expect(lecturaAtarfe.escenarios[0].cautelasOriginales[0]).toContain("escolar");
    expect(lecturaAtarfe.escenarios[1].cautelasOriginales).toHaveLength(0);
  });

  it("tensión escalada del PSL distribuida a ambos escenarios (MTE-L4)", () => {
    expect(lecturaAtarfe.escenarios[0].tensiones).toHaveLength(1);
    expect(lecturaAtarfe.escenarios[1].tensiones).toHaveLength(1);
    expect(lecturaAtarfe.escenarios[0].tensiones[0].tipo).toBe("evidencia");
  });

  it("cuatro cautelas invariables en el artefacto", () => {
    expect(lecturaAtarfe.cautelas).toHaveLength(4);
    for (const c of lecturaAtarfe.cautelas) {
      expect(c.trim().length).toBeGreaterThan(0);
    }
  });
});

// ── Bloque 5 — Inmutabilidad ──────────────────────────────────────────────────

describe("Bloque 5 — Inmutabilidad de las entradas", () => {

  it("I-MTE-3: el PSL de Atarfe no se modifica tras la traducción", () => {
    const idAntes = PSL_ATARFE.id;
    const statusAntes = PSL_ATARFE.status;
    const areasAntes = PSL_ATARFE.areasDeIntervencion.length;
    const versionAntes = PSL_ATARFE.version;

    translate(PSL_ATARFE, providerAtarfe, NOW_TEST);

    expect(PSL_ATARFE.id).toBe(idAntes);
    expect(PSL_ATARFE.status).toBe(statusAntes);
    expect(PSL_ATARFE.areasDeIntervencion.length).toBe(areasAntes);
    expect(PSL_ATARFE.version).toBe(versionAntes);
  });

  it("I-MTE-7: el FrameworkProvider no es modificado por el motor", () => {
    const elementosAntes = providerAtarfe.getElements().length;
    const versionAntes = providerAtarfe.getVersion();

    translate(PSL_ATARFE, providerAtarfe, NOW_TEST);

    expect(providerAtarfe.getElements().length).toBe(elementosAntes);
    expect(providerAtarfe.getVersion()).toBe(versionAntes);
  });

  it("los StrategicElement del proveedor no son modificados por el motor", () => {
    const primerElemento = providerAtarfe.getElements()[0];
    const idAntes = primerElemento.id;
    const labelAntes = primerElemento.label;
    const sourceTraceAntes = primerElemento.sourceTrace;

    translate(PSL_ATARFE, providerAtarfe, NOW_TEST);

    expect(providerAtarfe.getElements()[0].id).toBe(idAntes);
    expect(providerAtarfe.getElements()[0].label).toBe(labelAntes);
    expect(providerAtarfe.getElements()[0].sourceTrace).toBe(sourceTraceAntes);
  });

  it("requiresHumanValidation: true invariante en el artefacto (I-MTE-2)", () => {
    expect(lecturaAtarfe.requiresHumanValidation).toBe(true);
  });
});

// ── Bloque 6 — Determinismo ───────────────────────────────────────────────────

describe("Bloque 6 — Determinismo del motor", () => {

  it("tres traducciones consecutivas producen artefactos estructuralmente idénticos", () => {
    const r1 = translate(PSL_ATARFE, providerAtarfe, NOW_TEST);
    const r2 = translate(PSL_ATARFE, providerAtarfe, NOW_TEST);
    const r3 = translate(PSL_ATARFE, providerAtarfe, NOW_TEST);
    expect(r1.ok && r2.ok && r3.ok).toBe(true);
    if (r1.ok && r2.ok && r3.ok) {
      expect(r1.lectura.escenarios.length).toBe(r2.lectura.escenarios.length);
      expect(r2.lectura.escenarios.length).toBe(r3.lectura.escenarios.length);
      expect(r1.lectura.escenarios[0].id).toBe(r2.lectura.escenarios[0].id);
      expect(r2.lectura.escenarios[0].id).toBe(r3.lectura.escenarios[0].id);
      expect(r1.lectura.escenarios[0].referenciasInstitucionales.length).toBe(
        r2.lectura.escenarios[0].referenciasInstitucionales.length
      );
      expect(r2.lectura.escenarios[0].referenciasInstitucionales.length).toBe(
        r3.lectura.escenarios[0].referenciasInstitucionales.length
      );
    }
  });

  it("el mismo PSL con distinto timestamp produce idéntico contenido estratégico", () => {
    const r1 = translate(PSL_ATARFE, providerAtarfe, "2026-06-30T08:00:00.000Z");
    const r2 = translate(PSL_ATARFE, providerAtarfe, "2026-06-30T18:00:00.000Z");
    expect(r1.ok && r2.ok).toBe(true);
    if (r1.ok && r2.ok) {
      // Los contenidos estratégicos son idénticos; solo generatedAt difiere
      expect(r1.lectura.escenarios.length).toBe(r2.lectura.escenarios.length);
      expect(r1.lectura.sourcePSLId).toBe(r2.lectura.sourcePSLId);
      expect(r1.lectura.knowledgeBaseVersion).toBe(r2.lectura.knowledgeBaseVersion);
      expect(r1.lectura.cautelas).toHaveLength(r2.lectura.cautelas.length);
      // Solo generatedAt difiere (es metadata temporal del instante de ejecución)
      expect(r1.lectura.generatedAt).not.toBe(r2.lectura.generatedAt);
    }
  });

  it("el artefacto es serializable sin pérdida (JSON round-trip completo)", () => {
    const serializado = JSON.stringify(lecturaAtarfe);
    const restaurado = JSON.parse(serializado) as LecturaEstrategicaLocal;
    expect(restaurado.id).toBe(lecturaAtarfe.id);
    expect(restaurado.sourcePSLId).toBe(lecturaAtarfe.sourcePSLId);
    expect(restaurado.municipalityId).toBe("atarfe");
    expect(restaurado.requiresHumanValidation).toBe(true);
    expect(restaurado.escenarios).toHaveLength(lecturaAtarfe.escenarios.length);
    expect(restaurado.escenarios[0].tema).toBe("Salud mental comunitaria");
    expect(restaurado.escenarios[1].tema).toBe("Alimentación saludable");
    expect(restaurado.cautelas).toHaveLength(4);
  });
});

// ── Bloque 7 — Limitaciones v1.0 certificadas ────────────────────────────────

describe("Bloque 7 — Limitaciones v1.0 (declaradas en CONTRACT-MTE §10)", () => {

  it("MTE-L1: agrupación 1:1 (cada escenario tiene exactamente un área de origen)", () => {
    for (const e of lecturaAtarfe.escenarios) {
      expect(e.areasOrigen).toHaveLength(1); // 1:1, nunca múltiples áreas por escenario
    }
  });

  it("MTE-L2: activosRelacionados vacío en todos los escenarios (v1.0)", () => {
    for (const e of lecturaAtarfe.escenarios) {
      expect(e.activosRelacionados).toHaveLength(0);
    }
  });

  it("MTE-L3: no existen tensiones de tipo 'marco' (no implementado en v1.0)", () => {
    for (const e of lecturaAtarfe.escenarios) {
      const tensionesMarco = e.tensiones.filter((t) => t.tipo === "marco");
      expect(tensionesMarco).toHaveLength(0);
    }
  });

  it("MTE-L4: distribución no selectiva: mismas tensiones en todos los escenarios", () => {
    const tensiones0 = lecturaAtarfe.escenarios[0].tensiones.map((t) => t.descripcion);
    const tensiones1 = lecturaAtarfe.escenarios[1].tensiones.map((t) => t.descripcion);
    expect(tensiones0).toEqual(tensiones1);
  });

  it("sinCobertura siempre vacío en v1.0 (toda área genera un escenario)", () => {
    expect(lecturaAtarfe.sinCobertura).toHaveLength(0);
  });

  it("Principio de Objetividad: ningún escenario contiene campos de planificación prohibidos", () => {
    for (const e of lecturaAtarfe.escenarios) {
      const cast = e as Record<string, unknown>;
      expect(cast["actuaciones"]).toBeUndefined();
      expect(cast["objetivos"]).toBeUndefined();
      expect(cast["responsables"]).toBeUndefined();
      expect(cast["plazos"]).toBeUndefined();
      expect(cast["recomendaciones"]).toBeUndefined();
      expect(cast["prioridad"]).toBeUndefined();
    }
  });
});
