import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { EstudiosComplementariosPanel } from "../src/ui/components/EstudiosComplementariosPanel";
import seed from "../public/seeds/compas-ng-workspace-atarfe.json";
import type { IBSEStudy } from "../src/domain/ibse";
import type { MunicipalDocumentRepository } from "../src/domain/repository";

describe("IBSE Atarfe: acceso directo a resultados y SAM", () => {
  it("muestra el panel de resultados y la tripirámide al desplegar Estudios sin otro clic", () => {
    const html = renderToStaticMarkup(
      <EstudiosComplementariosPanel municipalityName="Atarfe" ibseStudy={seed.ibseStudy as IBSEStudy} repository={seed.repository as MunicipalDocumentRepository} />
    );
    expect(html).toContain("Tripirámide muestral");
    expect(html).toContain("Resultados en Atarfe");
    expect(html).toContain("811 válidos");
    expect(html).toContain("Ocultar resultados");
  });

  it("avisa cuando existe el registro IBSE pero se han perdido los resultados en el expediente activo", () => {
    const html = renderToStaticMarkup(
      <EstudiosComplementariosPanel municipalityName="Atarfe" repository={seed.repository as MunicipalDocumentRepository} />
    );
    expect(html).toContain("los resultados del estudio no están cargados");
    expect(html).not.toContain("Tripirámide muestral");
  });
});