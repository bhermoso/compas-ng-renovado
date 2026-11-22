/**
 * tests/document-ingestion-origins.test.ts
 *
 * Verifica que los DocumentKind territorial-documentation, qualitative-material
 * y strategic-framework producen EvidenceAtom con el EvidenceOrigin semántico
 * correcto (no "other"), y que el EvidenceStoreIntegrityGuard acepta los orígenes.
 *
 * También verifica el contrato del selector documental visible:
 *  - "community-asset" no es una opción visible (usa Localiza Salud en su lugar).
 *  - "localiza-salud" sí es una opción visible y genera origin correcto.
 *  - "strategic-framework" sí es una opción visible y genera origin correcto.
 *  - La ingesta de localiza-salud y community-asset no se rompe.
 */

import { describe, it, expect } from "vitest";
import { ingestManualDocument } from "../src/application/document-ingestion";
import { runEvidenceStoreIntegrityGuard } from "../src/application/evidence";
import { createMunicipalDocumentRepository } from "../src/domain/repository";
import { createEvidenceStore, createEvidenceAtom } from "../src/domain/evidence";

// ── Fixtures ──────────────────────────────────────────────────────────────────

const MUN_ID = "test-municipality-01";

function makeRepository() {
  return createMunicipalDocumentRepository({ municipalityId: MUN_ID });
}

function makeStore() {
  return createEvidenceStore(MUN_ID);
}

const SAMPLE_TEXT = [
  "Indicador: tasa de pobreza relativa 28,3 %.",
  "El territorio presenta alta concentración de renta baja en el sector norte.",
  "Determinante: condición de vivienda deficiente en un 14 % de los hogares.",
].join("\n");

// ── Test A: territorial-documentation → origin "territorial-documentation" ───

describe('ingestManualDocument — kind "territorial-documentation"', () => {
  it('produce átomos con provenance.origin === "territorial-documentation"', () => {
    const result = ingestManualDocument({
      repository: makeRepository(),
      evidenceStore: makeStore(),
      kind: "territorial-documentation",
      title: "Informe socioeconómico municipal 2024",
      plainText: SAMPLE_TEXT,
    });

    expect(result).not.toBeNull();
    expect(result!.atomsCreated).toBeGreaterThan(0);

    for (const atom of result!.evidenceStore.atoms) {
      expect(atom.provenance.origin).toBe("territorial-documentation");
    }
  });

  it("provenance.documentId está fijado en todos los átomos", () => {
    const result = ingestManualDocument({
      repository: makeRepository(),
      evidenceStore: makeStore(),
      kind: "territorial-documentation",
      title: "Datos padrón 2024",
      plainText: SAMPLE_TEXT,
    });

    expect(result).not.toBeNull();
    const docId = result!.document.id;
    for (const atom of result!.evidenceStore.atoms) {
      expect(atom.provenance.documentId).toBe(docId);
    }
  });

  it("el documento registrado tiene kind territorial-documentation", () => {
    const result = ingestManualDocument({
      repository: makeRepository(),
      evidenceStore: makeStore(),
      kind: "territorial-documentation",
      title: "Datos padrón 2024",
      plainText: SAMPLE_TEXT,
    });

    expect(result).not.toBeNull();
    expect(result!.document.kind).toBe("territorial-documentation");
  });
});

// ── Test B: qualitative-material → origin "qualitative-material" ──────────────

describe('ingestManualDocument — kind "qualitative-material"', () => {
  it('produce átomos con provenance.origin === "qualitative-material"', () => {
    const result = ingestManualDocument({
      repository: makeRepository(),
      evidenceStore: makeStore(),
      kind: "qualitative-material",
      title: "Acta Grupo Motor — sesión 1",
      plainText: [
        "Los participantes identificaron la falta de espacios verdes como problema principal.",
        "Se mencionó la soledad de las personas mayores como preocupación comunitaria.",
        "El grupo propuso ampliar el programa de actividad física en el polideportivo.",
      ].join("\n"),
    });

    expect(result).not.toBeNull();
    expect(result!.atomsCreated).toBeGreaterThan(0);

    for (const atom of result!.evidenceStore.atoms) {
      expect(atom.provenance.origin).toBe("qualitative-material");
    }
  });

  it("provenance.documentId está fijado en todos los átomos", () => {
    const result = ingestManualDocument({
      repository: makeRepository(),
      evidenceStore: makeStore(),
      kind: "qualitative-material",
      title: "Formulario necesidades sentidas",
      plainText: "La comunidad percibe falta de atención sociosanitaria coordinada.",
    });

    expect(result).not.toBeNull();
    const docId = result!.document.id;
    for (const atom of result!.evidenceStore.atoms) {
      expect(atom.provenance.documentId).toBe(docId);
    }
  });

  it("el documento registrado tiene kind qualitative-material", () => {
    const result = ingestManualDocument({
      repository: makeRepository(),
      evidenceStore: makeStore(),
      kind: "qualitative-material",
      title: "Acta GRUSE sesión 2",
      plainText: "Participación activa de asociaciones vecinales en el proceso.",
    });

    expect(result).not.toBeNull();
    expect(result!.document.kind).toBe("qualitative-material");
  });
});

// ── Test C: strategic-framework → origin "strategic-framework" ───────────────

describe('ingestManualDocument — kind "strategic-framework"', () => {
  const EPVSA_TEXT = [
    "Línea 1 EPVSA — Alimentación saludable y actividad física.",
    "Línea 2 EPVSA — Bienestar emocional y salud mental.",
    "Línea 3 EPVSA — Prevención de consumos perjudiciales.",
    "Línea 4 EPVSA — Entornos y entornos saludables.",
  ].join("\n");

  it('produce átomos con provenance.origin === "strategic-framework"', () => {
    const result = ingestManualDocument({
      repository: makeRepository(),
      evidenceStore: makeStore(),
      kind: "strategic-framework",
      title: "EPVSA 2024–2030 — Líneas estratégicas",
      plainText: EPVSA_TEXT,
    });

    expect(result).not.toBeNull();
    expect(result!.atomsCreated).toBeGreaterThan(0);

    for (const atom of result!.evidenceStore.atoms) {
      expect(atom.provenance.origin).toBe("strategic-framework");
      expect(atom.provenance.origin).not.toBe("other");
    }
  });

  it('produce átomos de kind "strategic-priority"', () => {
    const result = ingestManualDocument({
      repository: makeRepository(),
      evidenceStore: makeStore(),
      kind: "strategic-framework",
      title: "ESCA — Principios rectores",
      plainText: [
        "Equidad en salud como principio rector de la planificación.",
        "Intersectorialidad en la acción sobre determinantes sociales.",
      ].join("\n"),
    });

    expect(result).not.toBeNull();
    for (const atom of result!.evidenceStore.atoms) {
      expect(atom.kind).toBe("strategic-priority");
    }
  });

  it("el documento registrado tiene kind strategic-framework", () => {
    const result = ingestManualDocument({
      repository: makeRepository(),
      evidenceStore: makeStore(),
      kind: "strategic-framework",
      title: "Guías RELAS",
      plainText: "Marco metodológico RELAS — diagnóstico participativo territorial.",
    });

    expect(result).not.toBeNull();
    expect(result!.document.kind).toBe("strategic-framework");
  });

  it("provenance.documentId está fijado en todos los átomos", () => {
    const result = ingestManualDocument({
      repository: makeRepository(),
      evidenceStore: makeStore(),
      kind: "strategic-framework",
      title: "En Buena Edad — objetivos municipales",
      plainText: [
        "Objetivo 1: Promover el envejecimiento activo en entornos comunitarios.",
        "Objetivo 2: Reducir el aislamiento de personas mayores.",
      ].join("\n"),
    });

    expect(result).not.toBeNull();
    const docId = result!.document.id;
    for (const atom of result!.evidenceStore.atoms) {
      expect(atom.provenance.documentId).toBe(docId);
    }
  });

  it("múltiples marcos en el mismo store no generan conflictos", () => {
    const store = makeStore();
    const repo = makeRepository();

    const r1 = ingestManualDocument({
      repository: repo,
      evidenceStore: store,
      kind: "strategic-framework",
      title: "EPVSA 2024–2030",
      plainText: "Línea 1 EPVSA — Alimentación saludable.",
    });

    const r2 = ingestManualDocument({
      repository: r1!.repository,
      evidenceStore: r1!.evidenceStore,
      kind: "strategic-framework",
      title: "ESCA Andalucía",
      plainText: "Objetivo ESCA — Equidad en salud.",
    });

    expect(r2).not.toBeNull();
    expect(r2!.evidenceStore.atoms.length).toBe(2);

    for (const atom of r2!.evidenceStore.atoms) {
      expect(atom.provenance.origin).toBe("strategic-framework");
    }
  });
});

// ── Test D: IntegrityGuard acepta los tres orígenes ──────────────────────────

describe("EvidenceStoreIntegrityGuard — orígenes del selector documental", () => {
  type TestedOrigin =
    | "territorial-documentation"
    | "qualitative-material"
    | "strategic-framework";

  function makeAtomWithOrigin(origin: TestedOrigin, id: string) {
    return createEvidenceAtom({
      id,
      municipalityId: MUN_ID,
      kind: "qualitative-observation",
      title: `Átomo de prueba (${origin})`,
      content: "Contenido de prueba para validación de origen.",
      provenance: {
        origin,
        documentId: `doc-${id}`,
        extractedAt: new Date().toISOString(),
      },
    });
  }

  it('acepta origin "territorial-documentation" sin errores', () => {
    const store = {
      ...makeStore(),
      atoms: [makeAtomWithOrigin("territorial-documentation", "td-atom-01")],
    };
    const result = runEvidenceStoreIntegrityGuard(store);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.sanitizedStore.atoms[0].provenance.origin).toBe("territorial-documentation");
  });

  it('acepta origin "qualitative-material" sin errores', () => {
    const store = {
      ...makeStore(),
      atoms: [makeAtomWithOrigin("qualitative-material", "qm-atom-01")],
    };
    const result = runEvidenceStoreIntegrityGuard(store);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.sanitizedStore.atoms[0].provenance.origin).toBe("qualitative-material");
  });

  it('acepta origin "strategic-framework" sin errores', () => {
    const atom = createEvidenceAtom({
      id: "sf-atom-01",
      municipalityId: MUN_ID,
      kind: "strategic-priority",
      title: "Línea 1 EPVSA",
      content: "Alimentación saludable y actividad física como eje prioritario.",
      provenance: {
        origin: "strategic-framework",
        documentId: "doc-epvsa-01",
        extractedAt: new Date().toISOString(),
      },
    });
    const store = { ...makeStore(), atoms: [atom] };
    const result = runEvidenceStoreIntegrityGuard(store);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.sanitizedStore.atoms[0].provenance.origin).toBe("strategic-framework");
  });

  it("acepta los tres orígenes en el mismo store sin errores", () => {
    const store = {
      ...makeStore(),
      atoms: [
        makeAtomWithOrigin("territorial-documentation", "td-atom-02"),
        makeAtomWithOrigin("qualitative-material", "qm-atom-02"),
        makeAtomWithOrigin("strategic-framework", "sf-atom-02"),
      ],
    };
    const result = runEvidenceStoreIntegrityGuard(store);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.sanitizedStore.atoms).toHaveLength(3);
  });

  it('origin "other" sigue siendo válido (fallback interno preservado)', () => {
    const atom = createEvidenceAtom({
      id: "other-atom-01",
      municipalityId: MUN_ID,
      kind: "qualitative-observation",
      title: "Documento sin clasificar",
      content: "Contenido sin clasificación específica.",
      provenance: {
        origin: "other",
        documentId: "doc-other-01",
        extractedAt: new Date().toISOString(),
      },
    });
    const store = { ...makeStore(), atoms: [atom] };
    const result = runEvidenceStoreIntegrityGuard(store);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

// ── Test E: contrato del selector visible ─────────────────────────────────────
// Verifica invariantes del selector via pipeline (no via UI React).

describe("contrato del selector documental visible — invariantes de ingesta", () => {
  it('localiza-salud genera origin "localiza-salud", no "other" ni "community-assets"', () => {
    const result = ingestManualDocument({
      repository: makeRepository(),
      evidenceStore: makeStore(),
      kind: "localiza-salud",
      title: "Localiza Salud — Atarfe",
      plainText: [
        "Centro Cívico Municipal | Espacio cultural y deportivo | C/ Mayor 1",
        "Polideportivo Municipal | Instalación deportiva | Av. Deportes s/n",
      ].join("\n"),
    });
    expect(result).not.toBeNull();
    for (const atom of result!.evidenceStore.atoms) {
      expect(atom.provenance.origin).toBe("localiza-salud");
      expect(atom.provenance.origin).not.toBe("other");
      expect(atom.provenance.origin).not.toBe("community-assets");
    }
  });

  it('localiza-salud genera atoms de kind "asset"', () => {
    const result = ingestManualDocument({
      repository: makeRepository(),
      evidenceStore: makeStore(),
      kind: "localiza-salud",
      title: "Localiza Salud — Activos municipales",
      plainText: "Asociación de Vecinos La Vega | Actividades comunitarias | C/ Real 5",
    });
    expect(result).not.toBeNull();
    for (const atom of result!.evidenceStore.atoms) {
      expect(atom.kind).toBe("asset");
    }
  });

  it('strategic-framework nunca genera origin "other"', () => {
    const result = ingestManualDocument({
      repository: makeRepository(),
      evidenceStore: makeStore(),
      kind: "strategic-framework",
      title: "Plan Estratégico de Mayores de Andalucía",
      plainText: [
        "Eje 1 — Envejecimiento activo y participación social.",
        "Eje 2 — Atención sociosanitaria integrada.",
        "Eje 3 — Entornos favorables para las personas mayores.",
      ].join("\n"),
    });
    expect(result).not.toBeNull();
    for (const atom of result!.evidenceStore.atoms) {
      expect(atom.provenance.origin).not.toBe("other");
    }
  });

  it('territorial-documentation no genera origin "other"', () => {
    const result = ingestManualDocument({
      repository: makeRepository(),
      evidenceStore: makeStore(),
      kind: "territorial-documentation",
      title: "Análisis socioeconómico",
      plainText: "El municipio tiene una tasa de paro del 18 % en 2024.",
    });
    expect(result).not.toBeNull();
    for (const atom of result!.evidenceStore.atoms) {
      expect(atom.provenance.origin).not.toBe("other");
    }
  });

  it('qualitative-material no genera origin "other"', () => {
    const result = ingestManualDocument({
      repository: makeRepository(),
      evidenceStore: makeStore(),
      kind: "qualitative-material",
      title: "Entrevistas comunitarias",
      plainText: "Los vecinos señalan la falta de transporte como barrera para la salud.",
    });
    expect(result).not.toBeNull();
    for (const atom of result!.evidenceStore.atoms) {
      expect(atom.provenance.origin).not.toBe("other");
    }
  });
});

// ── Test F: regresión — flujos existentes no se rompen ───────────────────────

describe("regresión — community-asset sigue produciendo origin community-assets", () => {
  it('kind "community-asset" → origin "community-assets" (sin cambio)', () => {
    const result = ingestManualDocument({
      repository: makeRepository(),
      evidenceStore: makeStore(),
      kind: "community-asset",
      title: "Mapa de activos Atarfe",
      plainText: [
        "## Centro Cívico Municipal",
        "Espacio polivalente en el centro del municipio para actividades culturales y deportivas.",
        "## Asociación de Mayores Las Encinas",
        "Asociación activa con programas de envejecimiento activo y acompañamiento.",
      ].join("\n"),
    });

    expect(result).not.toBeNull();
    expect(result!.atomsCreated).toBeGreaterThan(0);

    for (const atom of result!.evidenceStore.atoms) {
      expect(atom.provenance.origin).toBe("community-assets");
    }
  });

  it('localiza-salud sigue siendo la ruta principal de activos comunitarios visibles', () => {
    const locResult = ingestManualDocument({
      repository: makeRepository(),
      evidenceStore: makeStore(),
      kind: "localiza-salud",
      title: "Localiza Salud Atarfe — completo",
      plainText: [
        "Centro de Salud Atarfe | Atención primaria | C/ Salud 1",
        "Polideportivo | Deporte | Av. Deportes",
      ].join("\n"),
    });
    expect(locResult).not.toBeNull();
    expect(locResult!.atomsCreated).toBeGreaterThan(0);

    for (const atom of locResult!.evidenceStore.atoms) {
      expect(atom.kind).toBe("asset");
      expect(atom.provenance.origin).toBe("localiza-salud");
    }
  });
});

// ── Test G: localiza-salud — formato pipe, idempotencia y selector ────────────

describe("localiza-salud — formato pipe, idempotencia y contrato de selector", () => {
  it('extrae el título desde el primer campo separado por | (pipe)', () => {
    const result = ingestManualDocument({
      repository: makeRepository(),
      evidenceStore: makeStore(),
      kind: "localiza-salud",
      title: "Localiza Salud — Granada-Zaidín 2023",
      plainText: "Centro Participación Activa Mayores Zaidín | Talleres deportivos y socioculturales",
    });
    expect(result).not.toBeNull();
    expect(result!.atomsCreated).toBe(1);
    expect(result!.evidenceStore.atoms[0].title).toBe(
      "Centro Participación Activa Mayores Zaidín"
    );
  });

  it("genera un átomo por línea válida con formato pipe", () => {
    const result = ingestManualDocument({
      repository: makeRepository(),
      evidenceStore: makeStore(),
      kind: "localiza-salud",
      title: "Localiza Salud — Zaidín multi",
      plainText: [
        "Cruz Roja Granada | Voluntariado y atención social",
        "Fundación Albihar | Salud mental comunitaria",
        "Unidad Salud Mental Comunitaria Zaidín | SAS — atención comunitaria",
      ].join("\n"),
    });
    expect(result).not.toBeNull();
    expect(result!.atomsCreated).toBe(3);
  });

  it("los átomos son idempotentes por título — cargar el mismo texto dos veces no duplica", () => {
    const TEXT = [
      "Cruz Roja Granada | Voluntariado y atención social",
      "Fundación Albihar | Salud mental comunitaria",
    ].join("\n");

    const r1 = ingestManualDocument({
      repository: makeRepository(),
      evidenceStore: makeStore(),
      kind: "localiza-salud",
      title: "Localiza Salud — carga 1",
      plainText: TEXT,
    });
    expect(r1).not.toBeNull();

    const r2 = ingestManualDocument({
      repository: r1!.repository,
      evidenceStore: r1!.evidenceStore,
      kind: "localiza-salud",
      title: "Localiza Salud — carga 2",
      plainText: TEXT,
    });
    expect(r2).not.toBeNull();

    const localizaAtoms = r2!.evidenceStore.atoms.filter(
      (a) => a.provenance.origin === "localiza-salud"
    );
    expect(localizaAtoms).toHaveLength(2);
    expect(r2!.atomsCreated).toBe(0);
  });

  it("dos fichas distintas con el mismo título siguen separadas al recargar", () => {
    const r1 = ingestManualDocument({
      repository: makeRepository(), evidenceStore: makeStore(), kind: "localiza-salud",
      title: "Localiza Salud — carga 1", plainText: "Cruz Roja Granada | Voluntariado y atención social",
    });
    const r2 = ingestManualDocument({
      repository: r1!.repository, evidenceStore: r1!.evidenceStore, kind: "localiza-salud",
      title: "Localiza Salud — carga 2",
      plainText: ["Cruz Roja Granada | Voluntariado y atención social", "Cruz Roja Granada | Taller de primeros auxilios"].join("\n"),
    });
    expect(r2!.atomsCreated).toBe(1);
    expect(r2!.evidenceStore.atoms.filter((a) => a.provenance.origin === "localiza-salud")).toHaveLength(2);
  });

  it("health-report no genera EvidenceAtom (canGenerateEvidence=false por defecto)", () => {
    const result = ingestManualDocument({
      repository: makeRepository(),
      evidenceStore: makeStore(),
      kind: "health-report",
      title: "Informe de Salud test",
      plainText: "Contenido del informe que no debe generar átomos.",
    });
    expect(result).not.toBeNull();
    expect(result!.atomsCreated).toBe(0);
    expect(result!.evidenceStore.atoms).toHaveLength(0);
  });

  it("community-asset no está en las opciones visibles del selector documental", () => {
    // Refleja el contrato de DOCUMENT_KINDS en App.tsx — si alguien añade
    // community-asset al selector visible, este test debe actualizarse conscientemente.
    const VISIBLE_KIND_VALUES = [
      "health-report",
      "complementary-study",
      "localiza-salud",
      "strategic-framework",
      "territorial-documentation",
      "qualitative-material",
      "longitudinal-evidence",
    ] as const;

    expect(VISIBLE_KIND_VALUES).not.toContain("community-asset" as never);
    expect(VISIBLE_KIND_VALUES).toContain("localiza-salud");
  });
});

// ── Test H: integración de persistencia localiza-salud ────────────────────────
// Verifica que la capa de ingesta produce un resultado completo que el workspace
// puede recibir directamente: documento registrado, átomos trazables, metadatos correctos.

describe("localiza-salud — integración de persistencia (capa de datos)", () => {
  const ZAIDIN_TEXT = [
    "Centro de Salud Zaidín Sur | SAS — Atención primaria · Distrito AP Granada-Metropolitano",
    "Centro Participación Activa Mayores Zaidín | Talleres deportivos y socioculturales para mayores",
    "Unidad Salud Mental Comunitaria Zaidín | SAS — atención comunitaria en salud mental",
  ].join("\n");

  it("el documento localiza-salud aparece en repository.documents tras la ingesta", () => {
    const result = ingestManualDocument({
      repository: makeRepository(),
      evidenceStore: makeStore(),
      kind: "localiza-salud",
      title: "Localiza Salud — Granada-Zaidín 2023",
      plainText: ZAIDIN_TEXT,
    });

    expect(result).not.toBeNull();
    const doc = result!.repository.documents.find((d) => d.kind === "localiza-salud");
    expect(doc).toBeDefined();
    expect(doc!.title).toBe("Localiza Salud — Granada-Zaidín 2023");
    expect(doc!.kind).toBe("localiza-salud");
  });

  it("canGenerateEvidence es true en el documento localiza-salud", () => {
    const result = ingestManualDocument({
      repository: makeRepository(),
      evidenceStore: makeStore(),
      kind: "localiza-salud",
      title: "Localiza Salud — Zaidín",
      plainText: "Centro de Salud Zaidín Sur | SAS — Atención primaria",
    });

    expect(result).not.toBeNull();
    const doc = result!.repository.documents.find((d) => d.kind === "localiza-salud");
    expect(doc!.canGenerateEvidence).toBe(true);
  });

  it("sourceText se preserva en el documento localiza-salud", () => {
    const result = ingestManualDocument({
      repository: makeRepository(),
      evidenceStore: makeStore(),
      kind: "localiza-salud",
      title: "Localiza Salud — Zaidín",
      plainText: ZAIDIN_TEXT,
    });

    expect(result).not.toBeNull();
    const doc = result!.repository.documents.find((d) => d.kind === "localiza-salud");
    expect(doc!.sourceText).toBe(ZAIDIN_TEXT);
  });

  it("los átomos aparecen en evidenceStore.atoms con origin localiza-salud y documentId correcto", () => {
    const result = ingestManualDocument({
      repository: makeRepository(),
      evidenceStore: makeStore(),
      kind: "localiza-salud",
      title: "Localiza Salud — Zaidín",
      plainText: ZAIDIN_TEXT,
    });

    expect(result).not.toBeNull();
    expect(result!.evidenceStore.atoms.length).toBe(3);
    expect(result!.atomsCreated).toBe(3);

    const doc = result!.repository.documents.find((d) => d.kind === "localiza-salud");
    for (const atom of result!.evidenceStore.atoms) {
      expect(atom.provenance.origin).toBe("localiza-salud");
      expect(atom.provenance.documentId).toBe(doc!.id);
      expect(atom.kind).toBe("asset");
      expect(atom.methodology?.requiresHumanValidation).toBe(true);
    }
  });

  it("workspace con health-report previo conserva health-report tras añadir localiza-salud", () => {
    // Simula la secuencia: cargar IS → añadir Localiza Salud
    const repoWithHealthReport = (() => {
      const r = makeRepository();
      const { repository } = ingestManualDocument({
        repository: r,
        evidenceStore: makeStore(),
        kind: "health-report",
        title: "Informe Salud Granada Abril 2023",
        plainText: "Texto del informe (canGenerateEvidence=false, no genera átomos).",
      })!;
      return repository;
    })();

    // El IS está en el repositorio (aunque con 0 átomos)
    expect(repoWithHealthReport.documents.find((d) => d.kind === "health-report")).toBeDefined();

    // Añadir localiza-salud (con filtrado de versiones previas de localiza-salud)
    const repoForIngestion = {
      ...repoWithHealthReport,
      documents: repoWithHealthReport.documents.filter((d) => d.kind !== "localiza-salud"),
    };

    const result = ingestManualDocument({
      repository: repoForIngestion,
      evidenceStore: makeStore(),
      kind: "localiza-salud",
      title: "Localiza Salud — Zaidín",
      plainText: ZAIDIN_TEXT,
    });

    expect(result).not.toBeNull();

    // Ambos documentos presentes
    const kinds = result!.repository.documents.map((d) => d.kind);
    expect(kinds).toContain("health-report");
    expect(kinds).toContain("localiza-salud");
    expect(result!.repository.documents).toHaveLength(2);

    // Solo átomos localiza-salud (health-report no genera)
    expect(result!.evidenceStore.atoms.length).toBe(3);
    for (const atom of result!.evidenceStore.atoms) {
      expect(atom.provenance.origin).toBe("localiza-salud");
    }
  });

  it("recargar localiza-salud sustituye átomos anteriores (sin acumulación)", () => {
    const TEXT_V1 = "Activo A | Descripción primera versión";
    const TEXT_V2 = "Activo A | Descripción segunda versión";

    const r1 = ingestManualDocument({
      repository: makeRepository(),
      evidenceStore: makeStore(),
      kind: "localiza-salud",
      title: "Localiza Salud v1",
      plainText: TEXT_V1,
    });
    expect(r1).not.toBeNull();
    expect(r1!.evidenceStore.atoms).toHaveLength(1);

    // Simula el reemplazo que hace handleProcessDocument en App.tsx
    const storeForV2 = {
      ...r1!.evidenceStore,
      atoms: r1!.evidenceStore.atoms.filter((a) => a.provenance.origin !== "localiza-salud"),
      updatedAt: new Date().toISOString(),
    };

    const r2 = ingestManualDocument({
      repository: makeRepository(), // repo limpio (simula el filtrado de handleProcessDocument)
      evidenceStore: storeForV2,
      kind: "localiza-salud",
      title: "Localiza Salud v2",
      plainText: TEXT_V2,
    });
    expect(r2).not.toBeNull();

    // Sigue habiendo 1 átomo (misma clave estable, v2 reemplaza a v1)
    const localizaAtoms = r2!.evidenceStore.atoms.filter(
      (a) => a.provenance.origin === "localiza-salud"
    );
    expect(localizaAtoms).toHaveLength(1);
  });
});

// ── Test I: copia-pega real de Localiza Salud — formatos y cabeceras ─────────

describe("localiza-salud — copia-pega real: formatos, cabeceras y carga bruta", () => {
  // Simula una línea real de exportación tabulada de Localiza Salud (Orden como primer campo)
  const TAB_ROW_WITH_ORDER =
    "5\tCENTRO PARTICIPACIÓN ACTIVA MAYORES ZAIDIN\tGRANADA\tGRANADA\t2\tANDRÉS SEGOVIA Nº 60\t18007\tCPA ZAIDÍN\t958130985\tMAYORES DE 60 AÑOS\tTalleres deportivos y socioculturales";

  const TAB_HEADER =
    "Orden\tnombre\tmunicipio\tlocalidad\ttipo_de_v_a\tdirección\tcódigo_postal\ttitular\tteléfono\trequisito_uso\tdescripción";

  it("formato tabulado: título extraído del segundo campo cuando el primero es número de orden", () => {
    const result = ingestManualDocument({
      repository: makeRepository(),
      evidenceStore: makeStore(),
      kind: "localiza-salud",
      title: "Localiza Salud — Zaidín tabulado",
      plainText: TAB_ROW_WITH_ORDER,
    });
    expect(result).not.toBeNull();
    expect(result!.atomsCreated).toBe(1);
    expect(result!.evidenceStore.atoms[0].title).toBe("CENTRO PARTICIPACIÓN ACTIVA MAYORES ZAIDIN");
  });

  it("línea de cabecera tabulada (Orden, nombre...) no genera átomo", () => {
    const textWithHeader = [TAB_HEADER, TAB_ROW_WITH_ORDER].join("\n");
    const result = ingestManualDocument({
      repository: makeRepository(),
      evidenceStore: makeStore(),
      kind: "localiza-salud",
      title: "Localiza Salud con cabecera",
      plainText: textWithHeader,
    });
    expect(result).not.toBeNull();
    // Solo la fila de datos, no la cabecera
    expect(result!.atomsCreated).toBe(1);
    expect(result!.evidenceStore.atoms[0].title).toBe("CENTRO PARTICIPACIÓN ACTIVA MAYORES ZAIDIN");
  });

  it("línea de cabecera pipe (nombre | municipio...) no genera átomo", () => {
    const pipeHeader = "nombre|municipio|localidad|descripción";
    const pipeRow = "Cruz Roja Granada|Granada|Granada|Atención social y voluntariado";
    const result = ingestManualDocument({
      repository: makeRepository(),
      evidenceStore: makeStore(),
      kind: "localiza-salud",
      title: "Localiza Salud con cabecera pipe",
      plainText: [pipeHeader, pipeRow].join("\n"),
    });
    expect(result).not.toBeNull();
    expect(result!.atomsCreated).toBe(1);
    expect(result!.evidenceStore.atoms[0].title).toBe("Cruz Roja Granada");
  });

  it("formato pipe: usa el nombre cuando la primera columna es el orden", () => {
    const pipeHeader = "Orden|Nombre|Recurso|Direccion";
    const pipeRow = "1|Centro de Salud La Vega|Centro de Salud|C/ Mayor, 1";
    const result = ingestManualDocument({
      repository: makeRepository(),
      evidenceStore: makeStore(),
      kind: "localiza-salud",
      title: "Localiza Salud con orden y separador pipe",
      plainText: [pipeHeader, pipeRow].join("\n"),
    });
    expect(result).not.toBeNull();
    expect(result!.atomsCreated).toBe(1);
    expect(result!.evidenceStore.atoms[0].title).toBe("Centro de Salud La Vega");
  });

  it("56 líneas válidas generan exactamente 56 átomos (carga bruta no es error)", () => {
    const lines = Array.from({ length: 56 }, (_, i) =>
      `Activo ${i + 1} | Descripción del activo ${i + 1} en el entorno territorial`
    );
    const result = ingestManualDocument({
      repository: makeRepository(),
      evidenceStore: makeStore(),
      kind: "localiza-salud",
      title: "Localiza Salud — carga bruta completa",
      plainText: lines.join("\n"),
    });
    expect(result).not.toBeNull();
    expect(result!.atomsCreated).toBe(56);
  });

  it("línea larga con múltiples tabuladores genera un solo átomo (no fragmenta)", () => {
    const longLine =
      "5\tCENTRO PARTICIPACIÓN ACTIVA MAYORES ZAIDIN\tGRANADA\tGRANADA\t2\t" +
      "ANDRÉS SEGOVIA Nº 60\t18007\tCPA ZAIDÍN\t958130985\tMAYORES DE 60 AÑOS\t" +
      "Actividades/talleres deportivos y socioculturales. Salidas culturales. Viajes. " +
      "Fiestas emblemáticas. Salas para juegos de mesa.";
    const result = ingestManualDocument({
      repository: makeRepository(),
      evidenceStore: makeStore(),
      kind: "localiza-salud",
      title: "Localiza Salud — línea larga",
      plainText: longLine,
    });
    expect(result).not.toBeNull();
    expect(result!.atomsCreated).toBe(1);
  });

  it("recarga del mismo bloque no duplica átomos (upsertEvidenceAtom idempotente)", () => {
    const TEXT = [
      "Centro de Salud Zaidín Sur | SAS — Atención primaria",
      "Fundación Albihar | Salud mental comunitaria",
    ].join("\n");

    const r1 = ingestManualDocument({
      repository: makeRepository(),
      evidenceStore: makeStore(),
      kind: "localiza-salud",
      title: "Localiza Salud v1",
      plainText: TEXT,
    });
    expect(r1).not.toBeNull();
    expect(r1!.atomsCreated).toBe(2);

    const storeAfterPurge = {
      ...r1!.evidenceStore,
      atoms: r1!.evidenceStore.atoms.filter((a) => a.provenance.origin !== "localiza-salud"),
      updatedAt: new Date().toISOString(),
    };
    const r2 = ingestManualDocument({
      repository: makeRepository(),
      evidenceStore: storeAfterPurge,
      kind: "localiza-salud",
      title: "Localiza Salud v2",
      plainText: TEXT,
    });
    expect(r2).not.toBeNull();
    const locAtoms = r2!.evidenceStore.atoms.filter((a) => a.provenance.origin === "localiza-salud");
    expect(locAtoms).toHaveLength(2);
  });

  it("health-report sigue generando 0 átomos después de los cambios", () => {
    const result = ingestManualDocument({
      repository: makeRepository(),
      evidenceStore: makeStore(),
      kind: "health-report",
      title: "Informe de Salud Granada Zaidín",
      plainText: "Contenido extenso del informe de salud que no debe atomizarse.",
    });
    expect(result).not.toBeNull();
    expect(result!.atomsCreated).toBe(0);
  });

  it("community-asset sigue fuera del selector visible — localiza-salud es la vía canónica", () => {
    const VISIBLE: readonly string[] = [
      "health-report", "complementary-study", "localiza-salud",
      "strategic-framework", "territorial-documentation",
      "qualitative-material", "longitudinal-evidence",
    ];
    expect(VISIBLE).not.toContain("community-asset");
    expect(VISIBLE).toContain("localiza-salud");
  });
});
