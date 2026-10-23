import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DOCS = resolve(ROOT, "docs");

const read = (rel: string) => readFileSync(resolve(DOCS, rel), "utf8");
const flatten = (s: string) => s.replace(/\s+/g, " ");

const matrixRaw = read("contracts/CONTRACT-SOURCE-CAPABILITY-MATRIX.md");
const matrix = flatten(matrixRaw);

describe("CONTRACT-SOURCE-CAPABILITY-MATRIX", () => {
  it("está indexado como contrato vigente", () => {
    const index = flatten(read("contracts/CONTRACT-INDEX.md"));
    expect(index).toContain("CONTRACT-SOURCE-CAPABILITY-MATRIX");
    expect(index).toContain("Matriz contractual de capacidades de fuente");
    expect(index).toContain("ERACIS");
  });

  it("cubre todos los DocumentKind reconocidos por el repositorio", () => {
    const kinds = [
      "health-report",
      "complementary-study",
      "eas-variable",
      "cmi-indicator",
      "community-asset",
      "localiza-salud",
      "strategic-framework",
      "redcap-export",
      "territorial-documentation",
      "qualitative-material",
      "longitudinal-evidence",
      "other",
    ];

    for (const kind of kinds) {
      expect(matrixRaw).toContain(kind);
    }
  });

  it("cubre los EvidenceOrigin reconocidos o reservados", () => {
    const origins = [
      "health-report",
      "complementary-study",
      "eas",
      "cmi",
      "ibse",
      "sam",
      "redcap",
      "localiza-salud",
      "community-assets",
      "citizen-participation",
      "longi",
      "manual-entry",
      "legacy-compas",
      "territorial-documentation",
      "qualitative-material",
      "strategic-framework",
      "other",
    ];

    for (const origin of origins) {
      expect(matrixRaw).toContain(origin);
    }
  });

  it("define la ruta de entrada para fuentes variables futuras o externas", () => {
    expect(matrix).toContain("ERACIS");
    expect(matrix).toContain("estrategia autonómica");
    expect(matrix).toContain("plan estratégico temático");
    expect(matrix).toContain("priorización ciudadana");
    expect(matrix).toContain("material cualitativo");
    expect(matrix).toContain("evidencia longitudinal");
    expect(matrix).toContain("ruta más específica disponible");
  });

  it("fija Localiza Salud como fuente principal de activos", () => {
    expect(matrix).toContain("SCM-I8");
    expect(matrix).toContain("Localiza Salud como fuente principal de activos");
    expect(matrix).toContain("Fuente principal/preferente de activos");
    expect(matrix).toContain("se tratan como indicio contextual o capacidad potencial");
    expect(matrix).toContain("complementarios, contextuales o pendientes de reconciliación");
    expect(matrix).toContain("No sustituyen Localiza Salud ni reabren `community-asset` como vía visible");
  });

  it("no define una salida comparativa breve", () => {
    const cuerpo = matrix.split("## Registro de revisiones")[0];
    expect(cuerpo).not.toContain("salida comparativa breve");
    expect(cuerpo).not.toContain("OHID/Fingertips");
  });

  it("queda conectado al contrato rector del Perfil", () => {
    const methodology = flatten(
      read("contracts/CONTRACT-LOCAL-HEALTH-PROFILE-METHODOLOGY.md")
    );
    expect(methodology).toContain("CONTRACT-SOURCE-CAPABILITY-MATRIX");
    expect(methodology).toContain("estatuto operativo de cada fuente admisible");
    expect(methodology).toContain("efecto sobre el Perfil");
    expect(methodology).toContain("Localiza Salud");
    expect(methodology).toContain("fuente principal/preferente para el mapa de activos del Perfil");
    expect(methodology).toContain("pendientes de reconciliación");
  });
});
