/**
 * Loja: documentación territorial no atomizada.
 *
 * Protege el caso que motivó el cambio: el expediente de Loja tiene documentos
 * históricos y participativos con texto, aunque el EvidenceStore aún no tenga
 * átomos. El perfil debe leerlos como fuente diagnóstica, no declararlos vacío.
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { MunicipalityWorkspace } from "../src/domain/workspace";
import { createMunicipalityRuntime } from './helpers/legacyProfileRuntime';
import { buildDiagnosticAnswers } from "../src/application/health-profile/diagnosticAnswers";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const LOJA_SEED_PATH = resolve(ROOT, "public/seeds/compas-ng-workspace-loja.json");

function loadLojaWorkspace(): MunicipalityWorkspace {
  return JSON.parse(readFileSync(LOJA_SEED_PATH, "utf8")) as MunicipalityWorkspace;
}

describe("Loja — determinantes y desigualdades desde documentación territorial", () => {
  it("lee documentos no atomizados como señales territoriales, no como vacío", () => {
    const workspace = loadLojaWorkspace();
    const answers = buildDiagnosticAnswers({
      workspace,
      determinantTitles: [],
      assets: [],
      indicatorTitles: [],
    });

    expect(workspace.evidenceStore.atoms).toHaveLength(0);
    expect(answers.desigualdadTerritorial.available).toBe(true);
    expect(answers.desigualdadTerritorial.sourceCount).toBeGreaterThanOrEqual(4);
    expect(answers.desigualdadTerritorial.sourceTitles).toContain(
      "Perfil de Salud Local de Loja — documento completo"
    );
    expect(answers.desigualdadTerritorial.eracisContexto?.listedByJunta).toBe(true);
    expect(answers.desigualdadTerritorial.eracisContexto?.sourcePageUrl).toBe(
      "https://www.juntadeandalucia.es/boja/2026/68/8"
    );
    expect(answers.desigualdadTerritorial.eracisContexto?.disadvantagedZones).toEqual([
      "Alcazaba y Alfaguara",
    ]);
    expect(answers.desigualdadTerritorial.themes.join(" ")).toMatch(
      /vulnerabilidad|empleo|vivienda|participación/
    );
    expect(
      answers.determinantes.some(
        (d) =>
          d.kind === "documentado" &&
          /vulnerabilidad|empleo|vivienda|participación/i.test(d.enunciado)
      )
    ).toBe(true);
    expect(
      answers.determinantes.some(
        (d) =>
          d.kind === "no-evaluable" &&
          d.enunciado === "condiciones materiales de vivienda, renta y empleo del ámbito"
      )
    ).toBe(false);
    expect(
      answers.determinantes.some(
        (d) =>
          d.kind === "documentado" &&
          d.enunciado.includes("ERACIS/PLIZD") &&
          d.base.includes("Alcazaba y Alfaguara")
      )
    ).toBe(true);
  });

  it("genera narrativa sustantiva aunque Loja aún no tenga EvidenceAtoms", () => {
    const workspace = loadLojaWorkspace();
    const runtime = createMunicipalityRuntime({ workspace });
    const texto = runtime.psl.conclusiones.content;

    expect(texto).not.toContain("El Perfil aún no dispone de información territorial suficiente");
    expect(texto).toContain("El repositorio no contiene todavía átomos específicos");
    expect(texto).toContain("La desigualdad no queda reducida aquí a la falta de tablas desagregadas");
    expect(texto).toContain("Loja figura además en fuente oficial de la Junta de Andalucía");
    expect(texto).toContain("Alcazaba y Alfaguara");
    expect(texto).toContain("Determinantes documentados por las fuentes del expediente");
    expect(texto).toContain("no un indicio de equidad");
  });
});
