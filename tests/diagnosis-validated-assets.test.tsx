import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { buildDiagnosisControlSummary } from "../src/application/diagnosis/diagnosisControlSummary";
import { DiagnosisControlRoom } from "../src/ui/components/DiagnosisControlRoom";
import type { MunicipalDocumentRepository } from "../src/domain/repository";

const empty = { municipalityId: "alfacar", documents: [], updatedAt: "2026-11-10T00:00:00.000Z" } as unknown as MunicipalDocumentRepository;
const base = { repository: empty, evidenceCount: 0, healthReportLoaded: false, studiesLoaded: Array(13).fill(false), studyEvidenceCount: 0 };

describe("Recursos y activos validados en la sala de control", () => {
  it("con declaración de validación distingue activos validados de recursos registrados", () => {
    const s = buildDiagnosisControlSummary({ ...base, assetCount: 11, validatedAssetCount: 7 });
    expect(s.metrics.assets).toBe(11);
    expect(s.metrics.validatedAssets).toBe(7);
    const mod = s.modules.find((m) => m.id === "assets")!;
    expect(mod.value).toBe("7 de 11");
    expect(mod.state).toBe("partial");
    expect(mod.detail).toBe("11 recursos registrados; 7 validados como activos.");
    const html = renderToStaticMarkup(<DiagnosisControlRoom municipalityName="Alfacar" summary={s} kindLabels={{}} />);
    expect(html).toContain("Activos validados");
    expect(html).toContain("7 de 11");
  });

  it("sin declaración no presenta los recursos como activos validados", () => {
    const s = buildDiagnosisControlSummary({ ...base, assetCount: 20 });
    expect(s.metrics.validatedAssets).toBeUndefined();
    const html = renderToStaticMarkup(<DiagnosisControlRoom municipalityName="Atarfe" summary={s} kindLabels={{}} />);
    expect(html).toContain("Recursos de activos");
    expect(html).not.toContain("Activos validados");
  });
});

import { renameMunicipalDocument } from "../src/domain/repository";
import { ActivosSaludPanel } from "../src/ui/components/ActivosSaludPanel";

describe("Fuente de activos: título y recuento", () => {
  const doc = { id: "d1", kind: "localiza-salud", title: "Activos validados · 2 fichas", status: "draft", sourceText: "Uno\nDos", tags: [] } as never;
  const repo = { municipalityId: "alfacar", documents: [doc], updatedAt: "2026-11-10T00:00:00.000Z" } as unknown as MunicipalDocumentRepository;

  it("renombra sin tocar el contenido y rechaza títulos vacíos", () => {
    const r = renameMunicipalDocument(repo, "d1", "  Localiza Salud · 2 recursos  ");
    expect(r.documents[0].title).toBe("Localiza Salud · 2 recursos");
    expect((r.documents[0] as { sourceText?: string }).sourceText).toBe("Uno\nDos");
    expect(renameMunicipalDocument(repo, "d1", "   ")).toBe(repo);
  });

  it("ofrece cambiar el título cuando hay manejador", () => {
    const html = renderToStaticMarkup(<ActivosSaludPanel repository={repo} onRenameDocument={() => {}} />);
    expect(html).toContain("Cambiar título");
  });
});
