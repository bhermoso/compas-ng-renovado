import { describe, it, expect } from "vitest";
import {
  buildInboxTemporalMetadata,
  parseDeclaredDate,
  planInboxImport,
} from "../src/application/document-ingestion/planInboxImport";
import { addMunicipalDocument, type MunicipalDocumentRepository } from "../src/domain/repository";

const empty = { municipalityId: "zagra", documents: [], updatedAt: "2026-10-31T00:00:00.000Z" } as unknown as MunicipalDocumentRepository;
const source = { system: "test", collectedAt: "2026-10-31T00:00:00.000Z" };
const withDoc = (repo: MunicipalDocumentRepository, id: string, kind: Parameters<typeof addMunicipalDocument>[1]["kind"], title: string, sourceFileName: string) =>
  addMunicipalDocument(repo, { id, kind, title, source, sourceFileName, tags: [] });

describe("planInboxImport", () => {
  it("un Informe sin Informe previo crea; con Informe vigente sustituye y lo nombra", () => {
    const create = planInboxImport({ kind: "health-report", format: "pdf", fileName: "informe.pdf", repository: empty });
    expect(create).toMatchObject({ route: "health-report", effect: "create", affected: [] });
    const repo = withDoc(empty, "hr1", "health-report", "Informe 2019", "informe-2019.pdf");
    const replace = planInboxImport({ kind: "health-report", format: "docx", fileName: "informe-2024.docx", repository: repo });
    expect(replace).toMatchObject({ route: "health-report", effect: "replace" });
    if ("blocked" in replace) throw new Error("bloqueado");
    expect(replace.affected.map(d => d.id)).toEqual(["hr1"]);
    expect(replace.consequence).toContain("se conserva archivado");
  });

  it("un marco equivalente (mismo archivo) se anuncia como sustitución con retirada de evidencias", () => {
    const repo = withDoc(empty, "sf1", "strategic-framework", "Otro título", "EPVSA.pdf");
    const plan = planInboxImport({ kind: "strategic-framework", format: "pdf", fileName: "EPVSA.pdf", repository: repo });
    if ("blocked" in plan) throw new Error("bloqueado");
    expect(plan.effect).toBe("replace");
    expect(plan.affected.map(d => d.id)).toEqual(["sf1"]);
    expect(plan.consequence).toContain("unidades de evidencia");
    // El cálculo no modifica el repositorio.
    expect(repo.documents).toHaveLength(1);
  });

  it("documentación territorial crea siempre y avisa de nombre de archivo repetido", () => {
    const repo = withDoc(empty, "td1", "territorial-documentation", "Acta", "acta.docx");
    const plan = planInboxImport({ kind: "territorial-documentation", format: "docx", fileName: "ACTA.docx", repository: repo });
    if ("blocked" in plan) throw new Error("bloqueado");
    expect(plan).toMatchObject({ route: "document-file", effect: "create", affected: [] });
    expect(plan.sameFileName.map(d => d.id)).toEqual(["td1"]);
  });

  it("bloquea tipos sin cargador conectado y formatos no admitidos", () => {
    expect(planInboxImport({ kind: "complementary-study", format: "csv", fileName: "a.csv", repository: empty })).toHaveProperty("blocked", true);
    expect(planInboxImport({ kind: "undetermined", format: "pdf", fileName: "a.pdf", repository: empty })).toHaveProperty("blocked", true);
    const doc = planInboxImport({ kind: "health-report", format: "doc", fileName: "a.doc", repository: empty });
    expect(doc).toHaveProperty("blocked", true);
    expect((doc as { reason: string }).reason).toContain(".docx");
    expect(planInboxImport({ kind: "qualitative-material", format: "zip", fileName: "a.zip", repository: empty })).toHaveProperty("blocked", true);
  });
});

describe("buildInboxTemporalMetadata", () => {
  const now = "2026-10-31T10:00:00.000Z";
  it("normaliza la precisión de la fecha declarada", () => {
    expect(parseDeclaredDate("2024")).toEqual({ value: "2024", precision: "year" });
    expect(parseDeclaredDate("2024-05")).toEqual({ value: "2024-05", precision: "month" });
    expect(parseDeclaredDate("2024-05-12")).toEqual({ value: "2024-05-12", precision: "day" });
    expect(parseDeclaredDate("12/05/2024")).toBeNull();
    expect(parseDeclaredDate("2024-13")).toBeNull();
  });
  it("sin datos no crea metadatos; fecha inválida produce error", () => {
    expect(buildInboxTemporalMetadata({ documentDate: "", observedPeriod: "", temporalScope: "undetermined", declaredBy: "a@b.es", now })).toEqual({});
    expect(buildInboxTemporalMetadata({ documentDate: "mayo", observedPeriod: "", temporalScope: "current", declaredBy: "a@b.es", now })).toHaveProperty("error");
  });
  it("declara el alcance solo con persona identificada", () => {
    const declared = buildInboxTemporalMetadata({ documentDate: "2016", observedPeriod: "2015–2016", temporalScope: "historical", declaredBy: "tecnica@sas.es", now });
    expect(declared).toEqual({ temporal: {
      documentDate: { value: "2016", precision: "year" },
      observedPeriod: { literal: "2015–2016" },
      ingestedAt: now,
      temporalScope: "historical",
      declaration: { declaredBy: "tecnica@sas.es", declaredAt: now, referenceDate: "2026-10-31", reason: "Declaración en la bandeja de revisión documental" },
    } });
    const anonymous = buildInboxTemporalMetadata({ documentDate: "2016", observedPeriod: "", temporalScope: "historical", declaredBy: "", now });
    expect(anonymous).toEqual({ temporal: { documentDate: { value: "2016", precision: "year" }, ingestedAt: now } });
  });
});

describe("planInboxImport · estudios complementarios en CSV", () => {
  const connected = ["ibse", "ghq12", "cage-eas"];
  const match = (moduleId: string, label: string, matched: number, expected: number) =>
    ({ moduleId, label, matched, expected, confidence: matched === expected ? "strong" as const : "partial" as const, adapter: "redcap" as const });

  it("entrega el CSV al cargador del instrumento reconocido, sea cual sea el tipo elegido", () => {
    for (const kind of ["complementary-study", "redcap-export"] as const) {
      const plan = planInboxImport({ kind, format: "csv", fileName: "ibse.csv", repository: empty, methodologicalMatches: [match("ibse", "IBSE", 6, 6)], connectedInstruments: connected });
      if ("blocked" in plan) throw new Error(plan.reason);
      expect(plan).toMatchObject({ route: "study-csv", kind: "complementary-study", effect: "create", instrument: { moduleId: "ibse", confidence: "strong" } });
      expect(plan.notes?.join(" ")).toContain("sin ajuste demográfico");
    }
  });

  it("anuncia la sustitución del estudio ya cargado del mismo instrumento", () => {
    const repo = addMunicipalDocument(empty, { id: "g1", kind: "redcap-export", title: "GHQ-12 - previo.csv", source, sourceFileName: "previo.csv", tags: ["complementary-study", "ghq12"] });
    const plan = planInboxImport({ kind: "complementary-study", format: "csv", fileName: "nuevo.csv", repository: repo, methodologicalMatches: [match("ghq12", "GHQ-12", 12, 13)], connectedInstruments: connected });
    if ("blocked" in plan) throw new Error(plan.reason);
    expect(plan.effect).toBe("replace");
    expect(plan.affected.map(d => d.id)).toEqual(["g1"]);
    expect(plan.consequence).toContain("retira el documento anterior");
    expect(plan.notes?.join(" ")).toContain("Coincidencia parcial de columnas (12/13)");
  });

  it("no atribuye el CSV sin coincidencia, con instrumento no conectado o con empate", () => {
    const base = { kind: "complementary-study" as const, format: "csv" as const, fileName: "x.csv", repository: empty, connectedInstruments: connected };
    expect(planInboxImport({ ...base, methodologicalMatches: [] })).toMatchObject({ blocked: true });
    expect((planInboxImport({ ...base, methodologicalMatches: [] }) as { reason: string }).reason).toContain("No se atribuye");
    expect(planInboxImport({ ...base, methodologicalMatches: [match("psqi", "PSQI", 7, 8)] })).toMatchObject({ blocked: true });
    const tie = planInboxImport({ ...base, methodologicalMatches: [match("ibse", "IBSE", 2, 2), match("cage-eas", "CAGE", 2, 2)] });
    expect(tie).toMatchObject({ blocked: true });
    expect((tie as { reason: string }).reason).toContain("por igual");
  });

  it("un estudio en PDF o DOCX no entra por la bandeja", () => {
    expect(planInboxImport({ kind: "complementary-study", format: "pdf", fileName: "e.pdf", repository: empty })).toMatchObject({ blocked: true });
  });
});

describe("planInboxImport · Informe registrado sin ficha documental", () => {
  it("lo trata como sustitución y lo explica", () => {
    const plan = planInboxImport({ kind: "health-report", format: "pdf", fileName: "informe-zagra.pdf", repository: empty, registeredHealthReport: { title: "Informe de Salud de Zagra", sourceFileName: "zagra.pdf" } });
    if ("blocked" in plan) throw new Error(plan.reason);
    expect(plan.effect).toBe("replace");
    expect(plan.affected).toEqual([]);
    expect(plan.notes?.join(" ")).toContain("su ficha no consta en el repositorio documental");
    expect(plan.consequence).toContain("se conserva archivado");
  });
});
