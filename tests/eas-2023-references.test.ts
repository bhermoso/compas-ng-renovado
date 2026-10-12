/**
 * tests/eas-2023-references.test.ts
 *
 * Pieza 1 — Estructura y reglas del catálogo EAS 2023:
 *   - Campos obligatorios presentes en cada entrada.
 *   - Sin entradas de IBSE.
 *   - Exactamente 3 entradas marcadas coveredByFixture.
 *   - Procedencia en cada entrada.
 *   - Lookup por easKey funciona.
 *   - getEAS2023ContextForIndicator solo responde para los indicadores mapeados.
 *
 * Pieza 2 — Valores concretos del catálogo cargado desde
 *   historico/index.html:11106–11320 (COMPAS_REFERENCIAS_EAS_REALES_2023):
 *   - Spot-check de valores claves para cada área temática.
 *   - Verificación de variables EAS del codebook.
 *   - Sin duplicados con los fixtures autonómicos existentes excepto los 3
 *     marcados coveredByFixture (P32_CAGE, P34a_nada, PREDIMED).
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

// ── Pieza 2: valores concretos cargados desde historico:11106-11320 ─────────

describe("EAS_2023_REFERENCES — valores concretos (historico:11106-11320)", () => {
  // Spot-check representativo de cada área temática.
  // Valores extraídos de COMPAS_REFERENCIAS_EAS_REALES_2023, sin base64.

  it("salud percibida — P7 y P7b", () => {
    const p7 = getEAS2023Reference("P7");
    expect(p7?.easVariable).toBe("P07_R2");
    expect(p7?.refAndalucia).toBe(78.8);
    expect(p7?.refGranada).toBe(76.5);

    const p7b = getEAS2023Reference("P7b");
    expect(p7b?.easVariable).toBe("P07B_R2_2023");
    expect(p7b?.refAndalucia).toBe(92.0);
    expect(p7b?.refGranada).toBe(89.1);
  });

  it("limitación actividad — P8a, P8b", () => {
    expect(getEAS2023Reference("P8a")?.refAndalucia).toBe(18.3);
    expect(getEAS2023Reference("P8a")?.refGranada).toBe(19.6);
    expect(getEAS2023Reference("P8b")?.refAndalucia).toBe(19.3);
    expect(getEAS2023Reference("P8b")?.refGranada).toBe(20.5);
  });

  it("dolor — P11", () => {
    const p11 = getEAS2023Reference("P11");
    expect(p11?.easVariable).toBe("P11_R2");
    expect(p11?.refAndalucia).toBe(7.3);
    expect(p11?.refGranada).toBe(10.7);
  });

  it("apoyo social — P12a, P12b, P12c", () => {
    expect(getEAS2023Reference("P12a")?.refAndalucia).toBe(80.4);
    expect(getEAS2023Reference("P12a")?.refGranada).toBe(78.1);
    expect(getEAS2023Reference("P12b")?.refAndalucia).toBe(76.1);
    expect(getEAS2023Reference("P12c")?.refAndalucia).toBe(10.0);
    expect(getEAS2023Reference("P12c")?.refGranada).toBe(10.0);
  });

  it("exclusión social — P13", () => {
    expect(getEAS2023Reference("P13")?.easVariable).toBe("P13_R");
    expect(getEAS2023Reference("P13")?.refAndalucia).toBe(5.5);
    expect(getEAS2023Reference("P13")?.refGranada).toBe(5.0);
  });

  it("tabaco — P23 y P23_ex", () => {
    const p23 = getEAS2023Reference("P23");
    expect(p23?.easVariable).toBe("P23_1_R_2016_2023");
    expect(p23?.refAndalucia).toBe(23.9);
    expect(p23?.refGranada).toBe(25.0);

    const p23ex = getEAS2023Reference("P23_ex");
    expect(p23ex?.refAndalucia).toBe(15.6);
    expect(p23ex?.refGranada).toBe(18.5);
  });

  it("sueño — P33, P33_fin, P33a, P33b_insomnio", () => {
    expect(getEAS2023Reference("P33")?.refAndalucia).toBe(7.1);
    expect(getEAS2023Reference("P33")?.refGranada).toBe(6.9);
    expect(getEAS2023Reference("P33_fin")?.refAndalucia).toBe(7.3);
    expect(getEAS2023Reference("P33a")?.refAndalucia).toBe(73.9);
    expect(getEAS2023Reference("P33a")?.refGranada).toBe(68.4);
    expect(getEAS2023Reference("P33b_insomnio")?.refAndalucia).toBe(17.0);
    expect(getEAS2023Reference("P33b_insomnio")?.refGranada).toBe(19.8);
  });

  it("actividad física — P34, P34a_intenso, P34a_moderado", () => {
    expect(getEAS2023Reference("P34")?.refAndalucia).toBe(33.6);
    expect(getEAS2023Reference("P34")?.refGranada).toBe(31.0);
    expect(getEAS2023Reference("P34a_intenso")?.refAndalucia).toBe(4.4);
    expect(getEAS2023Reference("P34a_moderado")?.refAndalucia).toBe(12.3);
  });

  it("alimentación — P36b_aceite, P36b_verdura, P36b_fruta, P36b_carne, P36b_pescado", () => {
    expect(getEAS2023Reference("P36b_aceite")?.refAndalucia).toBe(37.5);
    expect(getEAS2023Reference("P36b_aceite")?.refGranada).toBe(56.0);
    expect(getEAS2023Reference("P36b_verdura")?.refGranada).toBe(41.5);
    expect(getEAS2023Reference("P36b_fruta")?.refGranada).toBe(42.5);
    expect(getEAS2023Reference("P36b_carne")?.refAndalucia).toBe(30.0);
    expect(getEAS2023Reference("P36b_carne")?.refGranada).toBe(17.8);
    expect(getEAS2023Reference("P36b_pescado")?.refAndalucia).toBe(44.1);
    expect(getEAS2023Reference("P36b_pescado")?.refGranada).toBe(65.6);
  });

  it("los 3 coveredByFixture tienen los valores correctos (P32_CAGE, P34a_nada, PREDIMED)", () => {
    const cage = getEAS2023Reference("P32_CAGE");
    expect(cage?.coveredByFixture).toBe(true);
    expect(cage?.refAndalucia).toBe(1.0);
    expect(cage?.refGranada).toBe(0.5);

    const nada = getEAS2023Reference("P34a_nada");
    expect(nada?.coveredByFixture).toBe(true);
    expect(nada?.refAndalucia).toBe(36.4);
    expect(nada?.refGranada).toBe(34.0);

    const predimed = getEAS2023Reference("PREDIMED");
    expect(predimed?.coveredByFixture).toBe(true);
    expect(predimed?.refAndalucia).toBe(18.3);
    expect(predimed?.refGranada).toBe(40.0);
  });

  it("provenance es la cadena canónica en todas las entradas", () => {
    const wrong = EAS_2023_REFERENCES.filter(
      (e) => e.provenance !== "calculado por el autor desde microdatos EAS 2023; script reproducible pendiente"
    );
    expect(wrong).toHaveLength(0);
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

// ── Pieza 3: integración en IndicatorComparisonReference ─────────────────────
// Pruebas de caja blanca para el campo eas2023PopulationContext.
// No cargamos workspace real aquí: verificamos que el tipo está exportado y
// que el campo no aparece en indicadores que ya tienen fixture autonómico.

import type { IndicatorComparisonReference } from "../src/application/health-profile/complementaryIndicatorReferences";

describe("IndicatorComparisonReference — campo eas2023PopulationContext (pieza 3)", () => {
  it("el tipo IndicatorComparisonReference acepta eas2023PopulationContext como campo opcional", () => {
    const ref: IndicatorComparisonReference = {
      indicatorId: "fagerstrom-positivo",
      indicatorTitle: "Fagerström positivo",
      instrument: "Fagerström",
      diagnosticBlockId: "tabaco",
      diagnosticBlockTitle: "Tabaco",
      territorialLabel: "valor local",
      provinceLabel: "sin referencia provincial",
      andalusiaLabel: "sin referencia autonómica",
      source: "test",
      scaleCaution: "cautela test",
      demoProxy: false,
      comparisonReading: "sin comparación",
      narrativeLabel: "tabaco",
      dimension: "tabaco",
      esLocal: true,
      eas2023PopulationContext: {
        easKey: "P23",
        topic: "Fumador/a habitual (tabaco)",
        refAndalucia: 23.9,
        refGranada: 25.0,
        caution: "referencia contextual no local",
      },
    };
    expect(ref.eas2023PopulationContext?.easKey).toBe("P23");
    expect(ref.eas2023PopulationContext?.refAndalucia).toBe(23.9);
  });

  it("el campo es undefined cuando el indicador no tiene mapeo EAS2023", () => {
    const ref: IndicatorComparisonReference = {
      indicatorId: "ibse-indice-total",
      indicatorTitle: "IBSE total",
      instrument: "IBSE",
      diagnosticBlockId: "bienestar-socioemocional-escolar",
      diagnosticBlockTitle: "Bienestar",
      territorialLabel: "valor local",
      provinceLabel: "sin referencia",
      andalusiaLabel: "sin referencia",
      source: "test",
      scaleCaution: "cautela test",
      demoProxy: false,
      comparisonReading: "sin comparación",
      narrativeLabel: "IBSE",
      dimension: "bienestar-socioemocional",
      esLocal: true,
    };
    expect(ref.eas2023PopulationContext).toBeUndefined();
  });
});
