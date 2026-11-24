import { describe, it, expect } from "vitest";
import {
  compareDocumentsByDateDesc, dateFromTitle, documentDate, formatDocumentDate, parseDeclaredDate, withDocumentDate,
} from "../src/application/document-files/documentDate";

const doc = (title: string, declared?: string) => ({
  title,
  ...(declared ? { temporal: { documentDate: { value: declared, precision: (declared.length === 4 ? "year" : declared.length === 7 ? "month" : "day") as "year" | "month" | "day" } } } : {}),
});

describe("fecha de los documentos del archivo", () => {
  it("lee fechas completas y años del título", () => {
    expect(dateFromTitle("Taller RELAS de Zagra 2017 03 30", 2026)).toEqual({ value: "2017-03-30", precision: "day" });
    expect(dateFromTitle("01 Análisis de salud de Loja (Distrito, 14 12 2010)", 2026)).toEqual({ value: "2010-12-14", precision: "day" });
    expect(dateFromTitle("Informe de salud de Loja 2019: indicadores 2010, 2015, 2017 y 2018", 2026)).toEqual({ value: "2019", precision: "year" });
    expect(dateFromTitle("10 Incidencia de cáncer en Loja 2007 2016", 2026)).toEqual({ value: "2016", precision: "year" });
    expect(dateFromTitle("Plan Local de Salud 2027–2030", 2026)).toBeUndefined();
    expect(dateFromTitle("Activos Localiza Salud Atarfe", 2026)).toBeUndefined();
  });

  it("la fecha declarada prevalece sobre la del título", () => {
    expect(documentDate(doc("Informe de salud 2019", "2021-03"))).toEqual({ value: "2021-03", precision: "month", source: "declared" });
    expect(documentDate(doc("Informe de salud 2019"))).toEqual({ value: "2019", precision: "year", source: "title" });
  });

  it("valida la fecha declarada", () => {
    expect(parseDeclaredDate("2019-5")).toEqual({ value: "2019-05", precision: "month" });
    expect(parseDeclaredDate("2025-02-30")).toBeUndefined();
    expect(parseDeclaredDate("mayo")).toBeUndefined();
  });

  it("ordena del más reciente al más antiguo, con los documentos sin fecha al final", () => {
    const list = [doc("Sin año"), doc("Diagnóstico 2010"), doc("Informe", "2025-11-21"), doc("Consulta 2019"), doc("Informe 2025")];
    expect([...list].sort(compareDocumentsByDateDesc).map(d => d.title)).toEqual(["Informe", "Informe 2025", "Consulta 2019", "Diagnóstico 2010", "Sin año"]);
  });

  it("muestra la fecha con su precisión", () => {
    expect(formatDocumentDate({ value: "2019", precision: "year" })).toBe("2019");
    expect(formatDocumentDate({ value: "2026-05", precision: "month" })).toBe("may 2026");
    expect(formatDocumentDate({ value: "2025-11-21", precision: "day" })).toBe("21 nov 2025");
  });

  it("declarar o retirar la fecha conserva el resto de la temporalidad", () => {
    const temporal = { ingestedAt: "2026-11-01T00:00:00.000Z" };
    expect(withDocumentDate(temporal, { value: "2019", precision: "year" })).toEqual({ ...temporal, documentDate: { value: "2019", precision: "year" } });
    expect(withDocumentDate({ ...temporal, documentDate: { value: "2019", precision: "year" } }, undefined)).toEqual(temporal);
    expect(withDocumentDate(undefined, undefined)).toBeUndefined();
  });
});
