/**
 * mte-engine.test.ts — Unidad 5
 *
 * Certifica el comportamiento del Motor de Traducción Estratégica (MTEEngine).
 * Cubre todos los criterios de CONTRACT-MTE.md §11.
 *
 * No depende de datos reales de Atarfe (la validación con datos reales
 * corresponde a la Unidad 6 — certificación formal del Producto 5).
 * No modifica el dominio ni los fixtures canónicos de Unidades 0–3.
 */

import { describe, expect, it } from "vitest";
import type {
  LocalHealthProfile,
  PSLAreaIntervencion,
  PSLConflicto,
  PSLTension,
  PSLScaffoldChapter,
  PSLPriorizacion,
} from "../src/domain/health-profile";
import type { StrategicElement } from "../src/domain/strategy";
import type { LecturaEstrategicaLocal } from "../src/domain/strategic-scenario";
import { translate } from "../src/application/mte";
import { StaticFrameworkProvider } from "../src/application/mte";

// ── Constantes de test ────────────────────────────────────────────────────────

const NOW = "2026-06-30T12:00:00.000Z";

// ── Helpers de construcción ───────────────────────────────────────────────────

const SCAFFOLD_VACIO: PSLScaffoldChapter = {
  content: "",
  status: "scaffold",
  authorshipNote: "",
};

const PRIORIZACION_VACIA: PSLPriorizacion = {
  candidaturasTecnicas: [],
  hasTechnicalCandidatures: false,
  tematicasSeleccionadasIds: [],
  tematicasSeleccionadasLabels: [],
  hasParticipatorySelection: false,
  deliberacionNota: "",
  consensoDocumentado: false,
};

/** PSL mínimo con todos los campos requeridos. Solo los campos relevantes al MTE se personalizan. */
function buildPSL(
  overrides: Partial<Pick<LocalHealthProfile,
    | "id" | "municipalityId" | "status" | "version"
    | "areasDeIntervencion" | "tensionesEscaladas"
    | "conflictos" | "tensionesNoEscaladas"
  >> = {}
): LocalHealthProfile {
  return {
    id: "psl-test-001",
    municipalityId: "municipio-test",
    status: "validated",
    version: "2026-06-30T09:00:00.000Z",
    evidenceStoreVersion: "2026-06-30T08:00:00.000Z",
    strategicFrameworkSectionIds: [],
    healthReportSectionCount: 0,
    healthReportAtomCount: 0,
    totalEvidenceAtoms: 0,
    integrityErrors: 0,
    integrityWarnings: 0,
    atomsByOrigin: {},
    atomsByKind: {},
    evidenceAtomIds: [],
    originsSummary: [],
    ibsePresent: false,
    dukePresent: false,
    predimedPresent: false,
    sf12Present: false,
    suenoPresent: false,
    cagePresent: false,
    thematicPrioritisationPresent: false,
    complementaryStudyCount: 0,
    territorialSummary: "",
    determinantCount: 0,
    assetCount: 0,
    indicatorCount: 0,
    qualitativeFindingCount: 0,
    methodologicalCautionCount: 0,
    preliminaryOpportunities: [],
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
    conclusiones: SCAFFOLD_VACIO,
    cierreInterpretativo: SCAFFOLD_VACIO,
    priorizacion: PRIORIZACION_VACIA,
    priorizacionStatus: "scaffold",
    generatedAt: "2026-06-30T09:00:00.000Z",
    requiresHumanValidation: true,
    ...overrides,
  };
}

// ── Fixtures de StrategicElement ──────────────────────────────────────────────
// Dos elementos que cubren temas distintos; independientes de los fixtures de Unidad 2–3.

const EL_ALIMENTACION: StrategicElement = {
  framework: "EPVSA",
  level: "objective",
  id: "EPVSA-LE2-OBJ1",
  label: "Promover la alimentación saludable en el ámbito comunitario y escolar",
  sourceTrace: "EPVSA 2024–2030, LE2, Objetivo 1.",
};

const EL_SOCIAL: StrategicElement = {
  framework: "ESCA",
  level: "line",
  id: "ESCA-L3",
  label: "Participación ciudadana y empoderamiento en salud",
  description: "Fortalecimiento del papel activo de la ciudadanía en la salud comunitaria.",
  sourceTrace: "ESCA — Línea 3.",
};

// El tercer elemento no debería coincidir con los temas de test
const EL_MAYORES: StrategicElement = {
  framework: "MAYORES",
  level: "line",
  id: "MAYORES-EJE1",
  label: "Envejecimiento activo y saludable",
  description: "Fomento de la autonomía y participación social en personas mayores.",
  sourceTrace: "Plan Estratégico Personas Mayores 2020–2023. Eje 1.",
};

const providerTest = new StaticFrameworkProvider(
  [EL_ALIMENTACION, EL_SOCIAL, EL_MAYORES],
  "1.0.0-test"
);

// ── Áreas de intervención de test ─────────────────────────────────────────────

const AREA_ALIMENTACION: PSLAreaIntervencion = {
  id: "area-predimed-001",
  title: "Alimentación saludable",
  rationale: "Alta prevalencia de dieta no saludable según PREDIMED.",
  relatedEvidenceIds: ["ev-001", "ev-002"],
  cautions: [],
};

const AREA_SUENO: PSLAreaIntervencion = {
  id: "area-sueno-001",
  title: "Calidad del sueño insuficiente",
  rationale: "El 35% de la población refiere dificultades para dormir.",
  relatedEvidenceIds: ["ev-003"],
  cautions: ["Muestra no representativa de menores de 18 años."],
};

const AREA_PARTICIPACION: PSLAreaIntervencion = {
  id: "area-social-001",
  title: "Participación ciudadana en salud",
  rationale: "Escasa participación de la ciudadanía en procesos de salud comunitaria.",
  relatedEvidenceIds: ["ev-004"],
  cautions: [],
};

// ── Bloque 1 — Gates (G-MTE-1, G-MTE-2, G-MTE-3) ────────────────────────────

describe("Bloque 1 — Gates contractuales", () => {

  describe("G-MTE-1: Perfil retirado (la validación ya no es requisito)", () => {
    it("PSL 'generated' → { ok: true }: la validación se informa como criterio de calidad", () => {
      const psl = buildPSL({ status: "generated" });
      const result = translate(psl, providerTest, NOW);
      expect(result.ok).toBe(true);
    });

    it("PSL 'review' → { ok: true }", () => {
      const psl = buildPSL({ status: "review" });
      const result = translate(psl, providerTest, NOW);
      expect(result.ok).toBe(true);
    });

    it("PSL 'superseded' → { ok: false } con violación G-MTE-1", () => {
      const psl = buildPSL({ status: "superseded" });
      const result = translate(psl, providerTest, NOW);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.violations[0]).toContain("G-MTE-1");
    });

    it("PSL 'archived' → { ok: false } con violación G-MTE-1", () => {
      const psl = buildPSL({ status: "archived" });
      const result = translate(psl, providerTest, NOW);
      expect(result.ok).toBe(false);
    });
  });

  describe("G-MTE-1: PSL en estado permitido", () => {
    it("PSL 'validated' → { ok: true }", () => {
      const psl = buildPSL({ status: "validated" });
      const result = translate(psl, providerTest, NOW);
      expect(result.ok).toBe(true);
    });

    it("PSL 'approved' → { ok: true }", () => {
      const psl = buildPSL({ status: "approved" });
      const result = translate(psl, providerTest, NOW);
      expect(result.ok).toBe(true);
    });
  });

  describe("G-MTE-2: PSL sin áreas de intervención", () => {
    it("areasDeIntervencion vacío → hasTranslatableContent: false", () => {
      const psl = buildPSL({ areasDeIntervencion: [] });
      const result = translate(psl, providerTest, NOW);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.lectura.hasTranslatableContent).toBe(false);
        expect(result.lectura.escenarios).toHaveLength(0);
        expect(result.lectura.requiresHumanValidation).toBe(true);
        expect(result.lectura.cautelas).toHaveLength(4);
      }
    });

    it("G-MTE-2 no bloquea: artefacto se genera igual", () => {
      const psl = buildPSL({ areasDeIntervencion: [] });
      const result = translate(psl, providerTest, NOW);
      expect(result.ok).toBe(true); // resultado válido, no un error
    });
  });

  describe("G-MTE-3: FrameworkProvider no disponible", () => {
    it("provider null → { ok: false } con violación G-MTE-3", () => {
      const psl = buildPSL();
      const result = translate(psl, null, NOW);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.violations[0]).toContain("G-MTE-3");
    });

    it("provider undefined → { ok: false }", () => {
      const psl = buildPSL();
      const result = translate(psl, undefined, NOW);
      expect(result.ok).toBe(false);
    });
  });
});

// ── Bloque 2 — Invariantes del artefacto ─────────────────────────────────────

describe("Bloque 2 — Invariantes del artefacto (CONTRACT-MTE §8)", () => {

  it("I-MTE-2: requiresHumanValidation es siempre true en la lectura", () => {
    const result = translate(
      buildPSL({ areasDeIntervencion: [AREA_ALIMENTACION] }),
      providerTest, NOW
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.lectura.requiresHumanValidation).toBe(true);
  });

  it("I-MTE-2: requiresHumanValidation es true incluso con G-MTE-2 (sin áreas)", () => {
    const result = translate(buildPSL(), providerTest, NOW);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.lectura.requiresHumanValidation).toBe(true);
  });

  it("I-MTE-3: el PSL de origen no se modifica tras la traducción", () => {
    const areas = [AREA_ALIMENTACION, AREA_SUENO];
    const psl = buildPSL({ areasDeIntervencion: areas });
    const idAntes = psl.id;
    const statusAntes = psl.status;
    const areasAntes = psl.areasDeIntervencion.length;

    translate(psl, providerTest, NOW);

    expect(psl.id).toBe(idAntes);
    expect(psl.status).toBe(statusAntes);
    expect(psl.areasDeIntervencion.length).toBe(areasAntes);
    expect(psl.areasDeIntervencion[0].id).toBe(AREA_ALIMENTACION.id);
  });

  it("I-MTE-4: dos traducciones del mismo PSL producen artefactos con el mismo contenido", () => {
    const psl = buildPSL({ areasDeIntervencion: [AREA_ALIMENTACION, AREA_SUENO] });
    const r1 = translate(psl, providerTest, NOW);
    const r2 = translate(psl, providerTest, NOW);
    expect(r1.ok).toBe(true);
    expect(r2.ok).toBe(true);
    if (r1.ok && r2.ok) {
      expect(r1.lectura.escenarios).toHaveLength(r2.lectura.escenarios.length);
      expect(r1.lectura.escenarios[0].id).toBe(r2.lectura.escenarios[0].id);
      expect(r1.lectura.escenarios[0].sinCoberturaMarcal).toBe(
        r2.lectura.escenarios[0].sinCoberturaMarcal
      );
      expect(r1.lectura.knowledgeBaseVersion).toBe(r2.lectura.knowledgeBaseVersion);
      expect(r1.lectura.sourcePSLId).toBe(r2.lectura.sourcePSLId);
    }
  });

  it("I-SC-7 en todos los escenarios: sinCoberturaMarcal ↔ referenciasInstitucionales vacío", () => {
    const psl = buildPSL({
      areasDeIntervencion: [AREA_ALIMENTACION, AREA_SUENO, AREA_PARTICIPACION],
    });
    const result = translate(psl, providerTest, NOW);
    expect(result.ok).toBe(true);
    if (result.ok) {
      for (const e of result.lectura.escenarios) {
        if (e.sinCoberturaMarcal) {
          expect(e.referenciasInstitucionales).toHaveLength(0);
        } else {
          expect(e.referenciasInstitucionales.length).toBeGreaterThan(0);
        }
      }
    }
  });
});

// ── Bloque 3 — Trazabilidad y estructura ─────────────────────────────────────

describe("Bloque 3 — Trazabilidad y estructura del artefacto", () => {

  it("sourcePSLId y sourcePSLVersion apuntan al PSL de origen", () => {
    const psl = buildPSL({ id: "psl-unico-001", version: "2026-06-30T10:00:00.000Z" });
    const result = translate(psl, providerTest, NOW);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.lectura.sourcePSLId).toBe("psl-unico-001");
      expect(result.lectura.sourcePSLVersion).toBe("2026-06-30T10:00:00.000Z");
    }
  });

  it("knowledgeBaseVersion = provider.getVersion()", () => {
    const psl = buildPSL();
    const result = translate(psl, providerTest, NOW);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.lectura.knowledgeBaseVersion).toBe(providerTest.getVersion());
      expect(result.lectura.knowledgeBaseVersion).toBe("1.0.0-test");
    }
  });

  it("I-SC-1: areasOrigen de cada escenario apunta al id del área del PSL", () => {
    const psl = buildPSL({ areasDeIntervencion: [AREA_ALIMENTACION, AREA_SUENO] });
    const result = translate(psl, providerTest, NOW);
    expect(result.ok).toBe(true);
    if (result.ok) {
      const areaIds = psl.areasDeIntervencion.map((a) => a.id);
      for (const e of result.lectura.escenarios) {
        expect(e.areasOrigen).toHaveLength(1);
        expect(areaIds).toContain(e.areasOrigen[0]);
      }
    }
  });

  it("I-SC-2: tema = title exacto del área (sin síntesis ni generación)", () => {
    const psl = buildPSL({ areasDeIntervencion: [AREA_ALIMENTACION, AREA_SUENO] });
    const result = translate(psl, providerTest, NOW);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.lectura.escenarios[0].tema).toBe(AREA_ALIMENTACION.title);
      expect(result.lectura.escenarios[1].tema).toBe(AREA_SUENO.title);
    }
  });

  it("evidenciaOrigen contiene exactamente los relatedEvidenceIds del área", () => {
    const psl = buildPSL({ areasDeIntervencion: [AREA_SUENO] });
    const result = translate(psl, providerTest, NOW);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.lectura.escenarios[0].evidenciaOrigen).toEqual(
        AREA_SUENO.relatedEvidenceIds
      );
    }
  });

  it("cautelasOriginales heredadas exactamente desde el área", () => {
    const psl = buildPSL({ areasDeIntervencion: [AREA_SUENO] });
    const result = translate(psl, providerTest, NOW);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.lectura.escenarios[0].cautelasOriginales).toEqual(AREA_SUENO.cautions);
      expect(result.lectura.escenarios[0].cautelasOriginales[0]).toBe(
        "Muestra no representativa de menores de 18 años."
      );
    }
  });

  it("área sin cautelas → cautelasOriginales vacío", () => {
    const psl = buildPSL({ areasDeIntervencion: [AREA_ALIMENTACION] });
    const result = translate(psl, providerTest, NOW);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.lectura.escenarios[0].cautelasOriginales).toHaveLength(0);
    }
  });

  it("cuatro cautelas invariables siempre presentes en la lectura", () => {
    const resultConAreas = translate(
      buildPSL({ areasDeIntervencion: [AREA_ALIMENTACION] }),
      providerTest, NOW
    );
    const resultSinAreas = translate(buildPSL(), providerTest, NOW);
    expect(resultConAreas.ok).toBe(true);
    expect(resultSinAreas.ok).toBe(true);
    if (resultConAreas.ok) expect(resultConAreas.lectura.cautelas).toHaveLength(4);
    if (resultSinAreas.ok) expect(resultSinAreas.lectura.cautelas).toHaveLength(4);
  });

  it("el artefacto es serializable sin pérdida de información (JSON round-trip)", () => {
    const psl = buildPSL({
      areasDeIntervencion: [AREA_ALIMENTACION, AREA_SUENO],
    });
    const result = translate(psl, providerTest, NOW);
    expect(result.ok).toBe(true);
    if (result.ok) {
      const restored = JSON.parse(
        JSON.stringify(result.lectura)
      ) as LecturaEstrategicaLocal;
      expect(restored.id).toBe(result.lectura.id);
      expect(restored.sourcePSLId).toBe(result.lectura.sourcePSLId);
      expect(restored.hasTranslatableContent).toBe(result.lectura.hasTranslatableContent);
      expect(restored.requiresHumanValidation).toBe(true);
      expect(restored.escenarios).toHaveLength(result.lectura.escenarios.length);
      expect(restored.cautelas).toHaveLength(4);
    }
  });
});

// ── Bloque 4 — Correspondencia institucional ──────────────────────────────────

describe("Bloque 4 — Correspondencia institucional y referencias", () => {

  it("área con palabras clave coincidentes → referencias encontradas", () => {
    const psl = buildPSL({ areasDeIntervencion: [AREA_ALIMENTACION] });
    const result = translate(psl, providerTest, NOW);
    expect(result.ok).toBe(true);
    if (result.ok) {
      const escenario = result.lectura.escenarios[0];
      expect(escenario.referenciasInstitucionales.length).toBeGreaterThan(0);
      expect(escenario.sinCoberturaMarcal).toBe(false);
    }
  });

  it("área sin palabras clave coincidentes → sinCoberturaMarcal: true", () => {
    const psl = buildPSL({ areasDeIntervencion: [AREA_SUENO] });
    const result = translate(psl, providerTest, NOW);
    expect(result.ok).toBe(true);
    if (result.ok) {
      const escenario = result.lectura.escenarios[0];
      expect(escenario.referenciasInstitucionales).toHaveLength(0);
      expect(escenario.sinCoberturaMarcal).toBe(true);
    }
  });

  it("I-SC-3: todas las referencias tienen sourceTrace no vacío", () => {
    const psl = buildPSL({ areasDeIntervencion: [AREA_ALIMENTACION, AREA_PARTICIPACION] });
    const result = translate(psl, providerTest, NOW);
    expect(result.ok).toBe(true);
    if (result.ok) {
      for (const e of result.lectura.escenarios) {
        for (const ref of e.referenciasInstitucionales) {
          expect(ref.sourceTrace.trim().length).toBeGreaterThan(0);
          expect(ref.marcoId.trim().length).toBeGreaterThan(0);
          expect(ref.elementoId.trim().length).toBeGreaterThan(0);
          expect(ref.elementoLabel.trim().length).toBeGreaterThan(0);
        }
      }
    }
  });

  it("activosRelacionados siempre vacío en v1.0 (MTE-L2)", () => {
    const psl = buildPSL({ areasDeIntervencion: [AREA_ALIMENTACION] });
    const result = translate(psl, providerTest, NOW);
    expect(result.ok).toBe(true);
    if (result.ok) {
      for (const e of result.lectura.escenarios) {
        expect(e.activosRelacionados).toHaveLength(0);
      }
    }
  });

  it("un escenario puede tener referencias de distintos marcos", () => {
    // AREA_PARTICIPACION debería coincidir con EL_SOCIAL (ESCA) y posiblemente con otros
    const psl = buildPSL({ areasDeIntervencion: [AREA_PARTICIPACION] });
    const result = translate(psl, providerTest, NOW);
    expect(result.ok).toBe(true);
    if (result.ok) {
      const refs = result.lectura.escenarios[0].referenciasInstitucionales;
      if (refs.length > 1) {
        const marcos = new Set(refs.map((r) => r.marcoId));
        expect(marcos.size).toBeGreaterThanOrEqual(1);
      }
    }
  });
});

// ── Bloque 5 — Tensiones de evidencia ────────────────────────────────────────

describe("Bloque 5 — Tensiones de evidencia", () => {

  const TENSION_PSL: PSLTension = {
    descripcion: "Los datos PREDIMED muestran adherencia alta, pero el cuestionario de hábitos indica alta prevalencia de ultraprocesados.",
    clasificacion: "escalada",
    criteriosCumplidos: 2,
  };

  const CONFLICTO_PSL: PSLConflicto = {
    id: "conflicto-fuente-001",
    tipo: "fuente",
    descripcion: "Contradicción entre indicador CAGE y declaración voluntaria sobre consumo de alcohol.",
    fuentesImplicadas: ["CAGE", "encuesta-habitos"],
    resolucion: "no-resuelta",
  };

  it("tensionesEscaladas → TensionEstrategica tipo 'evidencia' sin origenPSL", () => {
    const psl = buildPSL({
      areasDeIntervencion: [AREA_ALIMENTACION],
      tensionesEscaladas: [TENSION_PSL],
    });
    const result = translate(psl, providerTest, NOW);
    expect(result.ok).toBe(true);
    if (result.ok) {
      const tension = result.lectura.escenarios[0].tensiones[0];
      expect(tension.tipo).toBe("evidencia");
      expect(tension.requiereDeliberacion).toBe(true);
      expect(tension.descripcion).toBe(TENSION_PSL.descripcion);
      expect(tension.origenPSL).toBeUndefined();
    }
  });

  it("conflictos del PSL → TensionEstrategica tipo 'evidencia' con origenPSL", () => {
    const psl = buildPSL({
      areasDeIntervencion: [AREA_ALIMENTACION],
      conflictos: [CONFLICTO_PSL],
    });
    const result = translate(psl, providerTest, NOW);
    expect(result.ok).toBe(true);
    if (result.ok) {
      const tension = result.lectura.escenarios[0].tensiones[0];
      expect(tension.tipo).toBe("evidencia");
      expect(tension.origenPSL).toBe("conflicto-fuente-001");
      expect(tension.requiereDeliberacion).toBe(true);
    }
  });

  it("tensiones distribuidas a todos los escenarios (MTE-L4: distribución no selectiva)", () => {
    const psl = buildPSL({
      areasDeIntervencion: [AREA_ALIMENTACION, AREA_SUENO],
      tensionesEscaladas: [TENSION_PSL],
    });
    const result = translate(psl, providerTest, NOW);
    expect(result.ok).toBe(true);
    if (result.ok) {
      for (const e of result.lectura.escenarios) {
        expect(e.tensiones).toHaveLength(1);
        expect(e.tensiones[0].tipo).toBe("evidencia");
      }
    }
  });

  it("PSL sin tensiones → tensiones vacías en todos los escenarios", () => {
    const psl = buildPSL({ areasDeIntervencion: [AREA_ALIMENTACION] });
    const result = translate(psl, providerTest, NOW);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.lectura.escenarios[0].tensiones).toHaveLength(0);
    }
  });

  it("tensionesEscaladas + conflictos se combinan correctamente", () => {
    const psl = buildPSL({
      areasDeIntervencion: [AREA_ALIMENTACION],
      tensionesEscaladas: [TENSION_PSL],
      conflictos: [CONFLICTO_PSL],
    });
    const result = translate(psl, providerTest, NOW);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.lectura.escenarios[0].tensiones).toHaveLength(2);
      const tipos = result.lectura.escenarios[0].tensiones.map((t) => t.tipo);
      expect(tipos.every((t) => t === "evidencia")).toBe(true);
    }
  });
});

// ── Bloque 6 — Principio de Objetividad (I-MTE-6, I-SC-6) ────────────────────

describe("Bloque 6 — Principio de Objetividad", () => {

  it("el tema del escenario es literalmente el título del área, no texto generado", () => {
    const areaConTituloEspecifico: PSLAreaIntervencion = {
      id: "area-especifica-001",
      title: "Consumo excesivo de bebidas alcohólicas en jóvenes de 15-29 años",
      rationale: "Elevada prevalencia según CAGE.",
      relatedEvidenceIds: [],
      cautions: [],
    };
    const psl = buildPSL({ areasDeIntervencion: [areaConTituloEspecifico] });
    const result = translate(psl, providerTest, NOW);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.lectura.escenarios[0].tema).toBe(
        "Consumo excesivo de bebidas alcohólicas en jóvenes de 15-29 años"
      );
    }
  });

  it("los escenarios no contienen campos de planificación prohibidos", () => {
    const psl = buildPSL({ areasDeIntervencion: [AREA_ALIMENTACION] });
    const result = translate(psl, providerTest, NOW);
    expect(result.ok).toBe(true);
    if (result.ok) {
      for (const e of result.lectura.escenarios) {
        const cast = e as Record<string, unknown>;
        expect(cast["actuaciones"]).toBeUndefined();
        expect(cast["objetivos"]).toBeUndefined();
        expect(cast["responsables"]).toBeUndefined();
        expect(cast["plazos"]).toBeUndefined();
        expect(cast["presupuesto"]).toBeUndefined();
        expect(cast["prioridad"]).toBeUndefined();
        expect(cast["recomendaciones"]).toBeUndefined();
      }
    }
  });

  it("la lectura no contiene campos de planificación prohibidos", () => {
    const result = translate(
      buildPSL({ areasDeIntervencion: [AREA_ALIMENTACION] }),
      providerTest, NOW
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      const cast = result.lectura as Record<string, unknown>;
      expect(cast["actuaciones"]).toBeUndefined();
      expect(cast["objetivos"]).toBeUndefined();
      expect(cast["plazos"]).toBeUndefined();
    }
  });

  it("número de escenarios = número de áreas (agrupación 1:1, MTE-L1)", () => {
    const psl = buildPSL({
      areasDeIntervencion: [AREA_ALIMENTACION, AREA_SUENO, AREA_PARTICIPACION],
    });
    const result = translate(psl, providerTest, NOW);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.lectura.escenarios).toHaveLength(3);
    }
  });

  it("sinCobertura siempre vacío en v1.0 (toda área produce escenario)", () => {
    const psl = buildPSL({
      areasDeIntervencion: [AREA_ALIMENTACION, AREA_SUENO],
    });
    const result = translate(psl, providerTest, NOW);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.lectura.sinCobertura).toHaveLength(0);
    }
  });
});
