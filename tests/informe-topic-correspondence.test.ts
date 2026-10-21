import { describe, expect, it } from "vitest";
import {
  INFORME_TOPIC_CORRESPONDENCE,
  informeDimensionsMissingFromTable,
  papeletaTopicsWithoutInformeDimension,
  validatedInformeCorrespondence,
} from "../src/application/localiza-assets";
import { TAXONOMIA_SANITARIA } from "../src/application/health-profile/healthReportSanitaryReading";
import { THEMATIC_TOPICS } from "../src/domain/thematic-prioritisation";

describe("correspondencia Informe ↔ papeleta", () => {
  it("recoge todas las dimensiones que detecta la lectura, sin repetir ninguna", () => {
    expect(informeDimensionsMissingFromTable()).toEqual([]);
    const dims = INFORME_TOPIC_CORRESPONDENCE.map((e) => e.informeDimension);
    expect(new Set(dims).size).toBe(dims.length);
    expect(dims).toHaveLength(TAXONOMIA_SANITARIA.length);
  });

  it("solo apunta a temas existentes de la papeleta", () => {
    const ids = new Set(THEMATIC_TOPICS.map((t) => t.id));
    for (const e of INFORME_TOPIC_CORRESPONDENCE) for (const id of e.topicIds) expect(ids.has(id)).toBe(true);
  });

  it("nace sin validar: hasta que una persona la valide, ningún tema cuenta como tratado por el Informe", () => {
    for (const e of INFORME_TOPIC_CORRESPONDENCE) {
      expect(e.status).toBe("propuesta");
      expect(e.validatedBy).toBeNull();
    }
    expect(validatedInformeCorrespondence()).toHaveLength(0);
    expect(papeletaTopicsWithoutInformeDimension()).toHaveLength(THEMATIC_TOPICS.length);
  });
});
