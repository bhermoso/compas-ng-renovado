/**
 * Lote A — verdad epistemológica del Perfil (F4, F5, F6).
 *
 * Corrige tres incoherencias de la lectura del Perfil de Atarfe, con guardias de
 * regresión sobre el caso canónico Granada-Zaidín (que NO debe cambiar):
 *
 *   F4 — El IBSE municipal de Atarfe (documento territorialScale "municipio") es
 *        muestra local del ámbito: esLocal, sin demoProxy ni referencia provincial
 *        fabricada. El IBSE provincial de Granada-Zaidín conserva su tratamiento proxy.
 *   F5 — El conflicto multiescala solo se activa con indicadores de procedencia
 *        distinta del IBSE; los 5 indicadores del propio IBSE de Atarfe no cuentan
 *        como una segunda escala poblacional.
 *   F6 — El conflicto temporal por volumen solo señala DESCENSOS significativos; el
 *        aumento aditivo 6→11 (incorporación de activos) no es un conflicto.
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parseWorkspaceJSON } from "../src/infrastructure/persistence/local-storage";
import { buildIndicatorComparisonReferences } from "../src/application/health-profile/complementaryIndicatorReferences";
import { createMunicipalityRuntime } from "../src/application/runtime";
import { runReconciliacionInterpretativa } from "../src/application/reconciliation";
import { buildEstadoResumen } from "../src/application/territorial-interpretation";
import type { MunicipalityWorkspace } from "../src/domain/workspace";

const _dir = dirname(fileURLToPath(import.meta.url));
function loadSeed(id: string): MunicipalityWorkspace {
  const path = id === "granada-zaidin"
    ? resolve(_dir, "../fixtures/workspaces/granada-zaidin-synthetic-test.json")
    : resolve(_dir, `../public/seeds/compas-ng-workspace-${id}.json`);
  const raw = readFileSync(
    path,
    "utf8"
  );
  const ws = parseWorkspaceJSON(raw);
  if (ws === null) throw new Error(`seed ${id} no parseable`);
  return ws;
}

const atarfe = loadSeed("atarfe");
const zaidin = loadSeed("granada-zaidin");

const CONFLICTO_ESCALA = "conflicto-escala-individual-poblacional";
const CONFLICTO_TEMPORAL = "conflicto-temporal-cambio-volumen";

describe("Lote A · F4 — escala real del IBSE cargado", () => {
  it("F4.1 Atarfe: los indicadores IBSE son muestra LOCAL, sin proxy ni referencia provincial fabricada", () => {
    const refs = buildIndicatorComparisonReferences({ workspace: atarfe }).references;
    const ibse = refs.filter((r) => r.instrument === "IBSE");
    expect(ibse.length).toBe(5);
    for (const r of ibse) {
      expect(r.esLocal, `${r.indicatorId} esLocal`).toBe(true);
      expect(r.demoProxy, `${r.indicatorId} demoProxy`).toBe(false);
      expect(r.provinceReference, `${r.indicatorId} provinceReference`).toBeUndefined();
    }
  });

  it("F4.2 REGRESIÓN Granada-Zaidín: el IBSE provincial conserva su tratamiento proxy", () => {
    const refs = buildIndicatorComparisonReferences({ workspace: zaidin }).references;
    const ibse = refs.filter((r) => r.instrument === "IBSE");
    expect(ibse.length).toBeGreaterThan(0);
    for (const r of ibse) {
      expect(r.esLocal, `${r.indicatorId} esLocal`).toBe(false);
      expect(r.demoProxy, `${r.indicatorId} demoProxy`).toBe(true);
      expect(typeof r.provinceReference, `${r.indicatorId} provinceReference`).toBe("number");
    }
  });

  it("F4.3 REGRESIÓN Granada-Zaidín: el nuevo criterio de escala no reclasifica ninguna fuente provincial", () => {
    // Invariante que garantiza la regresión: el cambio F4 solo marca local un
    // estudio cuyo DOCUMENTO declara territorialScale "municipio". Como ningún
    // documento de Granada-Zaidín lo declara, ninguna fuente provincial (IBSE ni
    // EAS) puede volverse local por este cambio.
    expect(
      zaidin.repository.documents.every((d) => d.territorialScale !== "municipio")
    ).toBe(true);
  });
});

describe("Lote A · F5 — conflicto multiescala solo con indicadores no-IBSE", () => {
  it("F5.1 Atarfe: no hay conflicto de escala (solo indicadores del propio IBSE)", () => {
    const runtime = createMunicipalityRuntime({ workspace: atarfe });
    const ids = runtime.reconciliacion.conflictos.map((c) => c.id);
    expect(ids).not.toContain(CONFLICTO_ESCALA);
    // Precondición del caso: todos los indicadores son de origen IBSE.
    const indicadores = runtime.mit.dimensionDiagnostica.indicators;
    expect(indicadores.length).toBe(5);
    expect(indicadores.every((a) => a.provenance.origin === "ibse")).toBe(true);
  });

  it("F5.2 REGRESIÓN Granada-Zaidín: conserva el conflicto de escala legítimo (IBSE + indicadores EAS)", () => {
    const runtime = createMunicipalityRuntime({ workspace: zaidin });
    const indicadoresNoIbse = runtime.mit.dimensionDiagnostica.indicators.filter(
      (a) => a.provenance.origin !== "ibse"
    );
    expect(indicadoresNoIbse.length).toBeGreaterThan(0); // hay indicadores poblacionales reales de otra fuente
    const ids = runtime.reconciliacion.conflictos.map((c) => c.id);
    expect(ids).toContain(CONFLICTO_ESCALA);
  });
});

describe("Lote A · F6 — conflicto temporal solo por descensos significativos", () => {
  it("F6.1 Atarfe: la incorporación aditiva 6→26 NO genera conflicto temporal", () => {
    const runtime = createMunicipalityRuntime({ workspace: atarfe });
    const mit = runtime.mit;
    // 26 átomos; el MIT reúne las dos fichas del Centro de Participación Activa (mismo título).
    expect(mit.totalEvidencias).toBe(25);
    // Estado anterior a la incorporación de activos: 6 evidencias (IBSE solo).
    const anterior = { ...buildEstadoResumen(mit), totalEvidencias: 6 };
    const result = runReconciliacionInterpretativa(mit, [anterior]);
    const ids = result.conflictos.map((c) => c.id);
    expect(ids).not.toContain(CONFLICTO_TEMPORAL);
  });

  it("F6.2 un DESCENSO significativo de evidencia SÍ genera conflicto temporal", () => {
    const runtime = createMunicipalityRuntime({ workspace: atarfe });
    const mit = runtime.mit; // 25 evidencias actuales
    // Estado anterior con 60 evidencias → descenso 60→25 (>50%): posible pérdida.
    const anterior = { ...buildEstadoResumen(mit), totalEvidencias: 60 };
    const result = runReconciliacionInterpretativa(mit, [anterior]);
    const temporal = result.conflictos.find((c) => c.id === CONFLICTO_TEMPORAL);
    expect(temporal).toBeDefined();
    expect(temporal!.descripcion).toContain("Descenso");
  });

  it("F6.3 un aumento por debajo o por encima del umbral nunca genera conflicto temporal", () => {
    const runtime = createMunicipalityRuntime({ workspace: atarfe });
    const mit = runtime.mit; // 11
    for (const previo of [1, 5, 6, 10, 11]) {
      const anterior = { ...buildEstadoResumen(mit), totalEvidencias: previo };
      const ids = runReconciliacionInterpretativa(mit, [anterior]).conflictos.map(
        (c) => c.id
      );
      expect(ids, `previo=${previo}`).not.toContain(CONFLICTO_TEMPORAL);
    }
  });
});
