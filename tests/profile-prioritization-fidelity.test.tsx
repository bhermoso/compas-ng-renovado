import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { PrioritizationPanel } from "../src/ui/components/PrioritizationPanel";
import { selectExternalProfile } from "../src/application/health-profile/selectExternalProfile";
import { generatePrioritization } from "../src/application/prioritization";
import type { MunicipalityWorkspace } from "../src/domain/workspace";

const source = {
  id: "revision-loja-6",
  title: "Perfil de Salud Local de Loja · revisión 0.6.2",
  status: "review" as const,
  limitations: ["Cautela general del documento", "Nota de revisión 0.6.2"],
};
const recommendation = { id: "R1", title: "R1. Cuidados comunitarios", rationale: "Conocer · Deriva de C1" };
const psl = {
  status: "review" as const,
  areasDeIntervencion: [{ ...recommendation, relatedEvidenceIds: [], cautions: [] }],
};
const prioritization = generatePrioritization(psl as never);
const render = (extra = {}) => renderToStaticMarkup(
  <PrioritizationPanel prioritization={prioritization} pslStatus="review" pslIsStale={false} externalSource={source} {...extra}/>
);

describe("Puente Perfil externo → priorización", () => {
  it("conserva el identificador de la recomendación y la revisión del Perfil", () => {
    const html = render();
    expect(html).toContain("R1. Cuidados comunitarios");
    expect(html).toContain("revision-loja-6");
    expect(html).toContain("En revisión técnica");
    expect(html).toContain("pendiente de deliberación");
  });
  it("advierte del estado review y no atribuye una decisión al Grupo Motor", () => {
    const html = render();
    expect(html).toContain("no consta validado técnicamente");
    expect(html).toContain("no como áreas priorizadas");
    expect(html).toContain("Pendiente de deliberación");
  });
  it("no transforma ausencia de vínculos estructurados en cero evidencias", () => {
    const html = render();
    expect(html).not.toContain("Evidencias relacionadas: 0");
    expect(html).toContain("no estructurados en esta proyección");
    expect(html).toContain("no significa ausencia de evidencias");
  });
  it("separa las limitaciones generales y evita repetirlas en cada propuesta", () => {
    const html = render();
    expect(html.match(/Cautela general del documento/g)?.length).toBe(1);
    expect(html.match(/Nota de revisión 0.6.2/g)?.length).toBe(1);
    expect(html).toContain("Limitaciones generales de la versión del Perfil");
  });
  it("una revisión validated no genera advertencia de falta de validación", () => {
    const html = renderToStaticMarkup(<PrioritizationPanel prioritization={prioritization} pslStatus="validated" pslIsStale={false} externalSource={{ ...source, status: "validated" }}/>);
    expect(html).toContain("Validado técnicamente");
    expect(html).not.toContain("no consta validado técnicamente");
  });
  it("la proyección de compatibilidad no replica las limitaciones como cautelas por área", () => {
    const workspace = {
      municipality: { identity: { id: "loja" } },
      createdAt: "2026-11-01",
      externalProfileLibrary: {
        activeId: source.id,
        profiles: [{
          ...source, municipalityId: "loja", areas: [recommendation],
          choices: [{ target: recommendation.id, decision: "chosen", by: "Técnico", at: "2026-11-18T10:00:00Z" }],
          summary: "", results: [], findings: [], text: "", author: "", createdAt: "2026-11-18",
          evidenceVersion: "e1",
        }],
      },
    } as unknown as MunicipalityWorkspace;
    const result = selectExternalProfile(workspace);
    expect(result.areasDeIntervencion[0].cautions).toEqual([]);
    expect(result.areasDeIntervencion[0].relatedEvidenceIds).toEqual([]);
    expect(result.limitacionesDiagnosticas).toEqual(source.limitations);
  });
});
