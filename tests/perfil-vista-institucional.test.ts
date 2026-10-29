/**
 * tests/perfil-vista-institucional.test.ts
 *
 * Composición VISIBLE de la pantalla «Perfil de Salud Local».
 *
 * La estructura principal del documento institucional son los seis capítulos
 * narrativos por determinantes. La carcasa heredada (Marco estratégico /
 * Informe de Salud / Diagnóstico / Interpretación / Priorización) no puede
 * reaparecer como arquitectura principal, y los objetos internos de «área de
 * intervención» se expresan en lenguaje diagnóstico de contraste.
 *
 * Se testea sobre el modelo puro de la vista (institutionalProfileModel) y
 * sobre el Perfil generado desde el export vigente 56/92.
 */

import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildInstitutionalProfileViewModel,
  INSTITUTIONAL_NAV,
  CONTRAST_TOPICS_LABEL,
  PENDING_CONTRAST_LABEL,
  type InstitutionalProfileViewModel,
} from "../src/application/health-profile";
import { loadWorkspaceFromLocalStorage } from "../src/infrastructure/persistence/local-storage";
import { createMunicipalityRuntime } from './helpers/legacyProfileRuntime';
import type { LocalHealthProfile } from "../src/domain/health-profile";

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

let psl: LocalHealthProfile;
let model: InstitutionalProfileViewModel;

beforeAll(() => {
  store.set(
    "compas-ng:workspace:granada-zaidin",
    readFileSync(EXPORT_PATH, "utf8")
  );
  const ws = loadWorkspaceFromLocalStorage("granada-zaidin");
  if (ws === null) throw new Error("El export vigente no rehidrata");
  psl = createMunicipalityRuntime({ workspace: ws }).psl;
  model = buildInstitutionalProfileViewModel(psl);
}, 60000);

describe("vista institucional — índice del documento", () => {
  it("el índice refleja los seis capítulos narrativos", () => {
    const labels = INSTITUTIONAL_NAV.map((n) => n.label).join(" | ");
    expect(labels).toContain("I · Alcance y fuentes");
    expect(labels).toContain("II · Contexto territorial");
    expect(labels).toContain("III · Situación de salud");
    expect(labels).toContain("IV · Determinantes");
    expect(labels).toContain("V · Activos e incertidumbres");
    expect(labels).toContain("VI · Conclusiones técnicas");
  });

  it("la carcasa heredada no aparece en el índice", () => {
    const labels = INSTITUTIONAL_NAV.map((n) => n.label).join(" | ");
    expect(labels).not.toContain("Marco estratégico");
    expect(labels).not.toContain("Priorización");
    expect(labels).not.toContain("Interpretación");
    expect(labels).not.toContain("Cierre interpretativo");
    expect(labels).not.toContain("VII");
  });
});

describe("vista institucional — documento principal sobre el export vigente 56/92", () => {
  it("el modelo produce los seis capítulos narrativos en orden", () => {
    expect(model.chapters.length).toBe(6);
    const titulos = model.chapters.map((c) => `${c.numeral}. ${c.title}`);
    expect(titulos).toEqual([
      "I. Alcance, fuentes y escala de la evidencia",
      "II. Contexto territorial y sociodemográfico",
      "III. Situación de salud y desigualdades",
      "IV. Determinantes sociales, comunitarios y ambientales",
      "V. Activos, capacidades territoriales e incertidumbres",
      "VI. Conclusiones técnicas para la priorización",
    ]);
  });

  it("el documento es borrador asistido hasta autoría humana y cita la fuente primaria", () => {
    expect(model.isDraft).toBe(true);
    expect(model.primarySource.present).toBe(true);
    expect(model.primarySource.title).toBe("Informe de salud de El Zaidín");
  });

  it("los capítulos no contienen recomendaciones ni lenguaje de Plan de Acción", () => {
    const texto = model.chapters.map((c) => c.content).join("\n");
    expect(texto).not.toMatch(
      /se recomienda|recomendamos|debe implantarse|proponemos|línea estratégica|programa de actuación/i
    );
    expect(texto).toContain("no formula recomendaciones");
  });

  it("los marcos estratégicos quedan fuera del documento narrativo", () => {
    const texto = model.chapters.map((c) => c.content).join("\n");
    expect(texto).not.toContain("EPVSA");
    expect(texto).not.toContain("ESCA");
    expect(texto).not.toContain("Personas Mayores en Andalucía");
  });
});

describe("vista institucional — lenguaje diagnóstico para los objetos internos", () => {
  it("las áreas internas se expresan como cuestiones de contraste, sin «intervención»", () => {
    expect(CONTRAST_TOPICS_LABEL).toContain("contraste");
    expect(CONTRAST_TOPICS_LABEL.toLowerCase()).not.toContain("intervención");
    expect(PENDING_CONTRAST_LABEL.toLowerCase()).not.toContain("intervención");
  });

  it("el modelo mapea las áreas internas del PSL a cuestiones de contraste", () => {
    const total = model.contrastTopics.length + model.pendingContrasts.length;
    expect(total).toBe(psl.areasDeIntervencion.length);
    for (const topic of model.contrastTopics) {
      expect(topic.title.length).toBeGreaterThan(0);
    }
  });

  it("las temáticas ciudadanas se trasladan sin convertirse en prioridades del Perfil", () => {
    expect(model.citizenTopics).toEqual(psl.priorizacion.tematicasSeleccionadasLabels);
  });
});

describe("vista institucional — autoría humana conserva la estructura", () => {
  it("un documento con autoría humana que respeta los encabezados se sigue componiendo por capítulos", () => {
    const authored: LocalHealthProfile = {
      ...psl,
      conclusiones: {
        ...psl.conclusiones,
        status: "authored",
        content: psl.conclusiones.content.replace(
          "La lectura se realiza a escala de distrito",
          "El equipo técnico confirma que la lectura se realiza a escala de distrito"
        ),
      },
    };
    const authoredModel = buildInstitutionalProfileViewModel(authored);
    expect(authoredModel.isDraft).toBe(false);
    expect(authoredModel.chapters.length).toBe(6);
  });

  it("si la autoría humana rompe la estructura, el documento cae al texto íntegro sin perderse", () => {
    const libre: LocalHealthProfile = {
      ...psl,
      conclusiones: {
        ...psl.conclusiones,
        status: "authored",
        content: "Texto libre del equipo técnico sin estructura de capítulos.",
      },
    };
    const libreModel = buildInstitutionalProfileViewModel(libre);
    expect(libreModel.chapters.length).toBe(0);
    expect(libreModel.fallbackContent).toContain("Texto libre del equipo técnico");
  });
});
