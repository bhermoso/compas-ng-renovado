/**
 * tests/eas-2023-references.test.ts
 *
 * Estructura y reglas del catálogo EAS 2023:
 *   - Campos obligatorios presentes en cada entrada.
 *   - Sin entradas de IBSE.
 *   - Exactamente 3 entradas marcadas coveredByFixture.
 *   - Procedencia en cada entrada.
 *   - Lookup por easKey funciona.
 *   - getEAS2023ContextForIndicator solo responde para los indicadores mapeados.
 */

import { describe, it, expect } from "vitest";
import {
  EAS_2023_REFERENCES,
  EAS2023_PROVENANCE,
  getEAS2023Reference,
  getEAS2023ContextForIndicator,
} from "../src/application/eas-references";

describe("EAS_2023_REFERENCES — estructura", () => {
  it("contiene exactamente 35 entradas", () => {
    expect(EAS_2023_REFERENCES).toHaveLength(35);
  });

  it("todos los campos obligatorios están presentes en cada entrada", () => {
    for (const entry of EAS_2023_REFERENCES) {
      expect(entry.easKey, `easKey en ${entry.easKey}`).toBeTruthy();
      expect(entry.easVariable, `easVariable en ${entry.easKey}`).toBeTruthy();
      expect(entry.topic, `topic en ${entry.easKey}`).toBeTruthy();
      expect(entry.unit, `unit en ${entry.easKey}`).toBeTruthy();
      expect(
        typeof entry.refAndalucia,
        `refAndalucia en ${entry.easKey}`
      ).toBe("number");
      expect(
        typeof entry.refGranada,
        `refGranada en ${entry.easKey}`
      ).toBe("number");
      expect(entry.provenance, `provenance en ${entry.easKey}`).toBe(
        EAS2023_PROVENANCE
      );
      expect(entry.caution, `caution en ${entry.easKey}`).toBeTruthy();
    }
  });

  it("ninguna entrada hace referencia al IBSE", () => {
    const ibse = EAS_2023_REFERENCES.filter(
      (e) =>
        e.easKey.toLowerCase().includes("ibse") ||
        e.topic.toLowerCase().includes("ibse") ||
        e.easVariable.toLowerCase().includes("ibse")
    );
    expect(ibse).toHaveLength(0);
  });

  it("exactamente 3 entradas están marcadas coveredByFixture=true", () => {
    const covered = EAS_2023_REFERENCES.filter((e) => e.coveredByFixture === true);
    expect(covered).toHaveLength(3);
    const keys = covered.map((e) => e.easKey).sort();
    expect(keys).toEqual(["P32_CAGE", "P34a_nada", "PREDIMED"]);
  });

  it("las claves easKey son únicas", () => {
    const keys = EAS_2023_REFERENCES.map((e) => e.easKey);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("todos los refAndalucia y refGranada son números finitos positivos", () => {
    for (const entry of EAS_2023_REFERENCES) {
      expect(Number.isFinite(entry.refAndalucia), entry.easKey).toBe(true);
      expect(Number.isFinite(entry.refGranada), entry.easKey).toBe(true);
      expect(entry.refAndalucia, entry.easKey).toBeGreaterThan(0);
      expect(entry.refGranada, entry.easKey).toBeGreaterThan(0);
    }
  });
});

describe("getEAS2023Reference — lookup por easKey", () => {
  it("devuelve la entrada correcta para una clave conocida", () => {
    const p7 = getEAS2023Reference("P7");
    expect(p7).toBeDefined();
    expect(p7!.easVariable).toBe("P07_R2");
    expect(p7!.refAndalucia).toBe(78.8);
    expect(p7!.refGranada).toBe(76.5);
  });

  it("devuelve undefined para una clave inexistente", () => {
    expect(getEAS2023Reference("IBSE")).toBeUndefined();
    expect(getEAS2023Reference("NOEXISTE")).toBeUndefined();
  });

  it("P23 — tabaco habitual — tiene los valores correctos", () => {
    const p23 = getEAS2023Reference("P23");
    expect(p23?.refAndalucia).toBe(23.9);
    expect(p23?.refGranada).toBe(25.0);
    expect(p23?.easVariable).toBe("P23_1_R_2016_2023");
  });

  it("P33b_insomnio — problemas para dormir — tiene los valores correctos", () => {
    const p33b = getEAS2023Reference("P33b_insomnio");
    expect(p33b?.refAndalucia).toBe(17.0);
    expect(p33b?.refGranada).toBe(19.8);
  });
});

describe("getEAS2023ContextForIndicator — mapeo a indicadores NG", () => {
  it("fagerstrom-positivo → P23 (tabaco habitual)", () => {
    const ctx = getEAS2023ContextForIndicator("fagerstrom-positivo");
    expect(ctx).toBeDefined();
    expect(ctx!.easKey).toBe("P23");
    expect(ctx!.coveredByFixture).toBeUndefined();
  });

  it("psqi-positivo → P33b_insomnio (problemas para dormir)", () => {
    const ctx = getEAS2023ContextForIndicator("psqi-positivo");
    expect(ctx).toBeDefined();
    expect(ctx!.easKey).toBe("P33b_insomnio");
  });

  it("auditc-positivo → P32_CAGE (riesgo alcoholismo)", () => {
    const ctx = getEAS2023ContextForIndicator("auditc-positivo");
    expect(ctx).toBeDefined();
    expect(ctx!.easKey).toBe("P32_CAGE");
  });

  it("indicadores con fixture propio no reciben contexto EAS2023", () => {
    // Estos ya tienen referencia autonómica vía fixture; no se duplica.
    expect(getEAS2023ContextForIndicator("cage-riesgo")).toBeUndefined();
    expect(getEAS2023ContextForIndicator("ipaq-inactividad")).toBeUndefined();
    expect(getEAS2023ContextForIndicator("predimed-adherencia")).toBeUndefined();
    expect(getEAS2023ContextForIndicator("sueno-insuficiente")).toBeUndefined();
  });

  it("indicadores sin mapeo devuelven undefined", () => {
    expect(getEAS2023ContextForIndicator("ibse-indice-total")).toBeUndefined();
    expect(getEAS2023ContextForIndicator("duke-apoyo-global")).toBeUndefined();
    expect(getEAS2023ContextForIndicator("ghq12-positivo")).toBeUndefined();
    expect(getEAS2023ContextForIndicator("phq9-positivo")).toBeUndefined();
  });
});
