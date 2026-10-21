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

  it("solo cuenta lo validado por una persona, con nombre y fecha", () => {
    for (const e of INFORME_TOPIC_CORRESPONDENCE) {
      if (e.status === "validada") expect(e.validatedBy).toEqual({ person: "Blas Ramón Hermoso Rico", date: "2026-10-21" });
      else expect(e.validatedBy).toBeNull();
    }
    expect(validatedInformeCorrespondence().map((e) => e.informeDimension)).toEqual([
      "salud mental y malestar emocional",
      "consumos de tabaco y alcohol",
      "alimentación, sobrepeso y obesidad",
      "actividad física y sedentarismo",
    ]);
  });

  it("señala los temas de la papeleta que el Informe no trata", () => {
    expect(papeletaTopicsWithoutInformeDimension()).toEqual([
      "pantallas-redes",
      "sueno-descanso",
      "sexualidad-salud",
      "violencia-genero",
      "medioambiente",
      "accidentes",
    ]);
  });
});
