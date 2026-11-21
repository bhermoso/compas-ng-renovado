import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { DiagnosisControlRoom } from "../src/ui/components/DiagnosisControlRoom";
import { buildDiagnosisControlSummary } from "../src/application/diagnosis/diagnosisControlSummary";
import { EstudiosComplementariosPanel } from "../src/ui/components/EstudiosComplementariosPanel";
import seed from "../public/seeds/compas-ng-workspace-atarfe.json";
import type { IBSEStudy } from "../src/domain/ibse";
import type { MunicipalDocumentRepository } from "../src/domain/repository";

describe("Diagnóstico territorial consolidado", () => {
  it("muestra una portada compacta y reserva el detalle para desplegar", () => {
    const summary = buildDiagnosisControlSummary({
      repository: seed.repository as MunicipalDocumentRepository,
      evidenceCount: 0,
      healthReportLoaded: true,
      studiesLoaded: [true, ...Array(12).fill(false)],
      studyEvidenceCount: 0,
      assetCount: 0,
    });
    const html = renderToStaticMarkup(
      <DiagnosisControlRoom municipalityName="Atarfe" province="Granada" ineCode="18022" summary={summary} />
    );
    expect(html).toContain("01 · Diagnosticar");
    expect(html).toContain("Atarfe");
    expect(html).toContain("Granada");
    expect(html).toContain("INE 18022");
    expect(html).toContain("Períodos: Sin período observado declarado");
    expect(html).toContain("documentos activos");
    expect(html).toContain("Ver estado y cronología");
    expect(html).toContain('class="diagnosis-home__details"');
    expect(html).not.toContain("<nav");
    expect(html).not.toContain("Explorar el diagnóstico");
    expect(html).not.toContain("diagnosis-area-navigation");
    expect(html).toContain("Estudios complementarios");
    expect(html).toContain("Activos para la salud");
    expect(html).toContain("Evidencias registradas");
    expect(html).toContain("Estado detallado de fuentes y módulos");
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
