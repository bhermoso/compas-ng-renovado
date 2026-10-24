/**
 * tests/perfil-fuentes-enriquecimiento.test.tsx
 *
 * «Enriquecimiento de fuentes del Perfil» como VISTA DE IMPACTO:
 * no es un cargador ni un segundo selector documental — resume cómo las
 * fuentes ya incorporadas al Repositorio documental enriquecen la lectura
 * del Perfil y qué dimensiones diagnósticas siguen pendientes. La carga se
 * hace siempre desde el cargador documental habitual.
 */

import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";
import { loadWorkspaceFromLocalStorage } from "../src/infrastructure/persistence/local-storage";
import { PerfilFuentesPanel } from "../src/ui/components/health-profile/PerfilFuentesPanel";
import { PerfilLocalDeSaludPanel } from "../src/ui/components/health-profile/PerfilLocalDeSaludPanel";
import type { MunicipalityWorkspace } from "../src/domain/workspace";

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

let ws: MunicipalityWorkspace;
let html: string;

beforeAll(() => {
  store.set(
    "compas-ng:workspace:granada-zaidin",
    readFileSync(EXPORT_PATH, "utf8")
  );
  const loaded = loadWorkspaceFromLocalStorage("granada-zaidin");
  if (loaded === null) throw new Error("El export vigente no rehidrata");
  ws = loaded;
  html = renderToStaticMarkup(<PerfilFuentesPanel workspace={ws} />);
}, 60000);

describe("enriquecimiento de fuentes — vista de impacto, no cargador", () => {
  it("declara que no carga documentos y remite al cargador habitual", () => {
    expect(html).toContain("Este bloque no carga documentos.");
    expect(html).toContain(
      "Resume cómo las fuentes incorporadas al Repositorio documental " +
        "enriquecen la lectura del Perfil y qué dimensiones siguen pendientes."
    );
    expect(html).toContain("selector/cargador documental habitual");
    expect(html).toContain("Repositorio documental");
    expect(html).toContain('id="psl-enriquecimiento-fuentes"');
  });

  it("no duplica el selector: sin botones de carga ni promesas de automatización", () => {
    expect(html).not.toMatch(/<input|type="file"|Cargar archivo|Subir/i);
    expect(html).not.toMatch(
      /descarga autom[áa]tica|integraci[óo]n autom[áa]tica|sincronizaci[óo]n/i
    );
  });

  it("muestra dimensiones de impacto del Perfil con su cobertura real (56/92)", () => {
    for (const dimension of [
      "Situación de salud",
      "Determinantes sociales",
      "Desigualdades",
      "Activos y capacidades",
      "Experiencia vivida / cualitativo",
      "Incertidumbres",
      "Preguntas para el Grupo Motor",
      "Anexo técnico / contexto",
    ]) {
      expect(html).toContain(dimension);
    }
    // Cobertura derivada del expediente vigente, no inventada
    expect(html).toContain("13 estudios complementarios");
    expect(html).toContain("23 indicadores");
    expect(html).toContain("56 recursos de Localiza Salud");
    expect(html).toContain("documentos territoriales de contexto");
    expect(html).toContain("marcos estratégicos de referencia");
    expect(html).toContain("solo los validados cuentan como activos");
    expect(html).toContain("Sin evidencia directa"); // determinantes: pendiente
    expect(html).toContain("no están desagregados"); // desigualdades: pendiente
    expect(html).not.toMatch(
      /estudio\(s\)|indicador\(es\)|activo\(s\)|documento\(s\)|marco\(s\)|pregunta\(s\)/
    );
  });

  it("BADEA/IECA aparece como contexto incorporado real, con escala y cautela", () => {
    // Granada-Zaidín tiene contexto BADEA verificado (municipio matriz):
    // deja de ser «no incorporada», pero con la doctrina de escala visible.
    expect(html).not.toContain("no incorporada todavía");
    expect(html).toContain("primer contexto incorporado");
    expect(html).toContain("consulta 19824");
    expect(html).toContain("Granada (capital)");
    expect(html).toContain("INE 18087");
    expect(html).toContain("escala municipal");
    expect(html).toContain("no estimación distrital");
    // Las dimensiones específicas siguen honestamente pendientes
    expect(html).toContain(
      "Indicadores específicos de esta dimensión siguen pendientes de carga"
    );
    // Sin estados afirmativos falsos más allá del contexto real
    expect(html).not.toMatch(/BADEA[^<]*(analizad[oa]s?\b|disponible\b)/i);
  });

  it("no es gate de compilación ni contiene recomendaciones", () => {
    expect(html).toContain("no condiciona la compilación del PSL-C");
    expect(html).not.toMatch(
      /se recomienda|recomendamos|debe implantarse|programa de|objetivo estrat[ée]gico|plan de acci[óo]n del perfil/i
    );
  });
});

describe("enriquecimiento de fuentes — separación de planos", () => {
  it("las fuentes aparecen antes que el enriquecimiento interpretativo", () => {
    const ambos = renderToStaticMarkup(
      <>
        <PerfilFuentesPanel workspace={ws} />
        <PerfilLocalDeSaludPanel
          perfil={ws.perfilLocalDeSalud}
          municipalityId="granada-zaidin"
          municipalityName="Granada-Zaidín"
          onUpdatePerfil={() => {}}
        />
      </>
    );
    const fuentes = ambos.indexOf("Enriquecimiento de fuentes del Perfil");
    const interpretativo = ambos.indexOf(
      "Enriquecimiento interpretativo del Perfil"
    );
    expect(fuentes).toBeGreaterThan(-1);
    expect(interpretativo).toBeGreaterThan(fuentes);
    expect(ambos).toContain("incorporar nuevas fuentes territoriales");
  });

  it("App monta el panel de fuentes antes del interpretativo", () => {
    const app = readFileSync(
      resolve(dirname(fileURLToPath(import.meta.url)), "../src/App.tsx"),
      "utf8"
    );
    const fuentes = app.indexOf("<PerfilFuentesPanel");
    const interpretativo = app.indexOf("<PerfilLocalDeSaludPanel");
    expect(fuentes).toBeGreaterThan(-1);
    expect(interpretativo).toBeGreaterThan(fuentes);
  });
});
