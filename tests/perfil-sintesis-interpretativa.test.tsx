import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";
import {
  buildDiagnosticAnswers,
  buildProfileIntegratedEditorialView,
  checkProfileWritingContract,
} from "../src/application/health-profile";
import type {
  DiagnosticAnswers,
  ProfileIntegratedEditorialView,
} from "../src/application/health-profile";
import { loadWorkspaceFromLocalStorage } from "../src/infrastructure/persistence/local-storage";
import { ProfileIntegratedEditorialPreview } from "../src/ui/components/ProfileIntegratedEditorialPreview";

const store = new Map<string, string>();
(globalThis as { localStorage?: unknown }).localStorage = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => {
    store.set(k, v);
  },
  removeItem: (k: string) => {
    store.delete(k);
  },
  clear: () => store.clear(),
  key: (i: number) => [...store.keys()][i] ?? null,
  get length() {
    return store.size;
  },
};

const EXPORT_PATH = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../fixtures/workspaces/granada-zaidin-synthetic-test.json"
);

const FORBIDDEN_EDITORIAL_RE =
  /se recomienda|recomendamos|debe implantarse|programa de|objetivo estrat[ée]gico|actuaciones previstas|plan de acci[óo]n|resulta relevante|se pone de manifiesto|desde una perspectiva integral/i;

let view: ProfileIntegratedEditorialView;
let answers: DiagnosticAnswers;

beforeAll(() => {
  store.set(
    "compas-ng:workspace:granada-zaidin",
    readFileSync(EXPORT_PATH, "utf8")
  );
  const ws = loadWorkspaceFromLocalStorage("granada-zaidin");
  if (ws === null) throw new Error("El export vigente no rehidrata");
  answers = buildDiagnosticAnswers({
    workspace: ws,
    determinantTitles: [],
    assets: ws.evidenceStore.atoms
      .filter((a) => a.kind === "asset")
      .map((a) => ({ title: a.title, content: a.content })),
  });
  view = buildProfileIntegratedEditorialView(answers, {
    territory: ws.municipality.identity.name,
    status: "Documento de trabajo",
    informeTitulo: "Informe de salud de El Zaidín",
    generatedDate: "1 de enero de 2027",
  });
});

describe("síntesis interpretativa del Perfil", () => {
  it("convierte los hilos integrados en una tesis trazable, no en recuento de términos", () => {
    const synthesis = view.diagnosticSynthesis;
    expect(synthesis.title).toBe("Síntesis interpretativa del Perfil");
    expect(synthesis.thesis).toContain("no se limita a contar menciones");
    expect(JSON.stringify(synthesis)).not.toMatch(
      /hilo\(s\)|señal\(es\)|pregunta\(s\)|plausible\(s\)/
    );
    expect(synthesis.traceability.unitIds).toEqual(
      view.interpretation.units.map((unit) => unit.id)
    );
    expect(synthesis.traceability.localSignalIds.length).toBeGreaterThan(0);
    expect(synthesis.contrastQuestions.length).toBeGreaterThan(0);
    expect(checkProfileWritingContract(JSON.stringify(synthesis))).toEqual([]);
    expect(JSON.stringify(synthesis)).not.toMatch(FORBIDDEN_EDITORIAL_RE);
  });

  it("se renderiza entre la lectura territorial y el soporte tabular", () => {
    const html = renderToStaticMarkup(
      <ProfileIntegratedEditorialPreview view={view} />
    );
    expect(html).toContain("Síntesis interpretativa del Perfil");
    expect(html).toContain("no se limita a contar menciones");
    expect(html.indexOf("Lectura integrada del territorio")).toBeLessThan(
      html.indexOf("Síntesis interpretativa del Perfil")
    );
    expect(html.indexOf("Síntesis interpretativa del Perfil")).toBeLessThan(
      html.indexOf("Indicadores trazadores: valores y referencias")
    );
  });

  it("declara activos Localiza Salud y no atribuye estudios cuando no existen", () => {
    const assetsBlock = view.sourceBlocks.find((block) => block.id === "activos");
    expect(assetsBlock?.whatItAdds).toContain(
      "de Localiza Salud, inventariados como capacidades potenciales"
    );
    expect(assetsBlock?.whatItAdds).toContain("56 recursos de Localiza Salud");
    expect(assetsBlock?.whatItAdds).not.toContain("recurso(s)");
    expect(view.sourceBlocks.map((block) => block.whatItDoesNotAllow)).toEqual([
      "No mide por sí solo prevalencia local ni distribución interna de desigualdad",
      "No sustituyen la lectura municipal ni convierten una muestra o proxy en verdad territorial completa",
      "No acreditan cobertura, uso efectivo ni acceso real sin contraste comunitario",
    ]);
    expect(JSON.stringify(view.territorialReadings)).not.toContain(
      "hipótesis El territorio"
    );
    expect(JSON.stringify(view.territorialReadings)).not.toContain(
      "indicador[es]"
    );

    const withoutStudies = buildProfileIntegratedEditorialView(
      {
        ...answers,
        estudios: {
          ...answers.estudios,
          totalStudies: 0,
          totalIndicators: 0,
          diagnosticBlocks: [],
          unclassifiedIndicators: [],
          crossCuttingCautions: [],
          contrastQuestions: [],
        },
        referencias: {
          ...answers.referencias,
          references: [],
          coverage: {
            total: 0,
            conValorTerritorial: 0,
            conReferenciaProvincial: 0,
            conReferenciaAndalucia: 0,
            pendientesDeReferencia: 0,
          },
        },
      },
      {
        territory: "Granada-Zaidín",
        status: "Documento de trabajo",
        informeTitulo: "Informe de salud de El Zaidín",
        generatedDate: "1 de enero de 2027",
      }
    );
    const studiesBlock = withoutStudies.sourceBlocks.find(
      (block) => block.id === "estudios"
    );
    expect(studiesBlock?.whatItAdds).toContain(
      "sin estudios complementarios incorporados"
    );
    expect(withoutStudies.interpretation.nonExhaustiveNotice).toContain(
      "sin estudios complementarios incorporados"
    );
    expect(
      withoutStudies.territorialReadings.every(
        (block) => block.source !== "Informe de salud + estudios complementarios"
      )
    ).toBe(true);
  });
});
