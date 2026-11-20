import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { DiagnosisControlRoom } from "../src/ui/components/DiagnosisControlRoom";
import { buildDiagnosisControlSummary } from "../src/application/diagnosis/diagnosisControlSummary";
import { EstudiosComplementariosPanel } from "../src/ui/components/EstudiosComplementariosPanel";
import seed from "../public/seeds/compas-ng-workspace-atarfe.json";
import type { IBSEStudy } from "../src/domain/ibse";
import type { MunicipalDocumentRepository } from "../src/domain/repository";

describe("Diagnóstico territorial consolidado", () => {
  it("conserva los módulos en auditoría y muestra navegación principal de cuatro áreas", () => {
    const summary = buildDiagnosisControlSummary({
      repository: seed.repository as MunicipalDocumentRepository,
      evidenceCount: 0,
      healthReportLoaded: true,
      studiesLoaded: [true, ...Array(12).fill(false)],
      studyEvidenceCount: 0,
      assetCount: 0,
    });
    const html = renderToStaticMarkup(
      <DiagnosisControlRoom municipalityName="Atarfe" summary={summary} onOpenModule={() => {}} />
    );
    expect(html).toContain("Explorar el diagnóstico");
    expect(html).toContain("Estudios e indicadores");
    expect(html).toContain("Fuentes documentales");
    expect(html).toContain("Activos para la salud");
    expect(html).toContain("Evidencias y diagnóstico");
    expect(html).toContain("Estado detallado de módulos y fuentes");
    expect(html).toContain("<details");
  });

  it("no emite comparaciones automáticas del IBSE mixto con Granada/Andalucía", () => {
    const html = renderToStaticMarkup(
      <EstudiosComplementariosPanel
        municipalityName="Atarfe"
        ibseStudy={seed.ibseStudy as IBSEStudy}
        repository={seed.repository as MunicipalDocumentRepository}
      />
    );
    expect(html).toContain("Referencias territoriales");
    expect(html).toContain("75,94/100");
    expect(html).toContain("pendiente de reproducir");
    expect(html).toContain("Tripirámide muestral");
    expect(html).not.toContain("El resultado municipal de índice ibse es menos favorable");
    expect(html).not.toContain("Comparación territorial");
  });
});
