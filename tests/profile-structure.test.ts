import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ProfileReader } from "../src/ui/components/ProfileReader";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseProfileStructure } from "../src/application/health-profile/profileStructure";

const fixture = (name: string) => readFileSync(resolve(__dirname, "fixtures/profile-text", name), "utf8");
const cases = [
  ["PDF v0.1 (tabla de recomendaciones)", "zagra-v0.1-pdf.txt"],
  ["PDF v0.2 (recomendaciones agrupadas)", "zagra-v0.2-pdf.txt"],
  ["DOCX v0.2", "zagra-v0.2-docx.txt"],
] as const;

describe("parseProfileStructure · Perfil de Zagra", () => {
  for (const [label, file] of cases) {
    describe(label, () => {
      const s = parseProfileStructure(fixture(file));
      it("reconoce los siete apartados, el resumen y los anexos", () => {
        const titles = s.sections.map((x) => x.title);
        for (const t of ["Resumen", "1. Punto de partida", "2. Conclusiones", "4. Lo que no sabemos", "5. Recomendaciones", "7. Autoría y validación", "Anexos", "H. Referencias"]) expect(titles).toContain(t);
        expect(s.summary.join(" ")).toContain("843 habitantes [1]");
      });
      it("reconoce las ocho conclusiones con su enunciado y a qué llevan", () => {
        expect(s.conclusions.map((c) => c.id)).toEqual(["C1", "C2", "C3", "C4", "C5", "C6", "C7", "C8"]);
        expect(s.conclusions[0].title).toMatch(/^Zagra pierde población por saldo natural y envejece/);
        expect(s.conclusions[0].leadsTo).toBe("R4 y R5");
        expect(s.conclusions.every((c) => c.body.length > 0)).toBe(true);
      });
      it("reconoce las diez recomendaciones con su tipo y su origen, sin confundir el verbo con el tipo", () => {
        const byId = Object.fromEntries(s.recommendations.map((r) => [r.id, r]));
        expect(Object.keys(byId).sort()).toEqual(["R1", "R10", "R2", "R3", "R4", "R5", "R6", "R7", "R8", "R9"]);
        expect(byId.R1).toMatchObject({ type: "Conocer", derivesFrom: "C2, C4" });
        expect(byId.R4).toMatchObject({ type: "Conocer", derivesFrom: "C1, C5" });
        expect(byId.R4.text).toContain("que viven solas");
        expect(byId.R5).toMatchObject({ type: "Contrastar", derivesFrom: "C1" });
        expect(byId.R5.text).toMatch(/^Contrastar con las cuidadoras/);
        expect(byId.R7).toMatchObject({ type: "Abordar", derivesFrom: "C3, C7" });
      });
      it("lista las referencias y destaca cifras literales del resumen", () => {
        expect(s.references.length).toBeGreaterThanOrEqual(8);
        expect(s.references[0]).toMatch(/^Instituto de Estadística y Cartografía de Andalucía/);
        expect(s.keyFigures.length).toBeGreaterThanOrEqual(5);
        expect(s.keyFigures.some((k) => k.value === "843")).toBe(true);
        for (const k of s.keyFigures) expect(fixture(file)).toContain(k.value);
      });
    });
  }
  it("un texto sin estructura RELAS queda como texto, sin inventar conclusiones", () => {
    const s = parseProfileStructure("Informe libre.\n\nUn párrafo sin apartados ni conclusiones.");
    expect(s.conclusions).toEqual([]);
    expect(s.recommendations).toEqual([]);
    expect(s.sections[0].paragraphs).toHaveLength(2);
  });
});

import { prefillFromStructure } from "../src/application/health-profile/profileStructure";
describe("prefillFromStructure", () => {
  const empty = { title: "v01", period: "", author: "", summary: "", text: fixture("zagra-v0.1-pdf.txt"), results: [], findings: [], limitations: [], areas: [] };
  it("completa título, versión, resumen, conclusiones y recomendaciones de un documento sin paquete", () => {
    const { content, recognized } = prefillFromStructure(empty);
    expect(content.title).toBe("Perfil de Salud Local de Zagra");
    expect(content.period).toMatch(/^Versión 0\.1/);
    expect(content.summary).toContain("843 habitantes [1]");
    expect(content.findings).toHaveLength(8);
    expect(content.areas).toHaveLength(10);
    expect(content.areas[0]).toMatchObject({ id: "R1", rationale: "Conocer · Deriva de C2, C4" });
    expect(recognized).toEqual({ conclusions: 8, recommendations: 10, summary: true });
  });
  it("no sustituye lo que ya trae un paquete", () => {
    const { content, recognized } = prefillFromStructure({ ...empty, summary: "Del paquete", findings: ["C1. Del paquete"], areas: [{ id: "X", title: "X", rationale: "" }] });
    expect(content.summary).toBe("Del paquete");
    expect(content.findings).toEqual(["C1. Del paquete"]);
    expect(content.areas).toHaveLength(1);
    expect(recognized).toEqual({ conclusions: 0, recommendations: 0, summary: false });
  });
});
describe("parseProfileStructure · páginas de datos del Perfil de Loja (Art. 17 ter)", () => {
  const s = parseProfileStructure(fixture("loja-v0.3-package.txt"));
  it("reconoce las páginas de datos como apartados del índice", () => {
    const titles = s.sections.map((x) => x.title);
    expect(titles.slice(0, 4)).toEqual(["Loja en datos", "Quién vive aquí", "Panel de salud", "Desigualdad"]);
    expect(titles).not.toContain("Inicio");
  });
  it("lee los bloques de la portada y de la página de desigualdad", () => {
    expect(s.dataPages?.cover.map((b) => b.title)).toEqual(["Resumen", "Desigualdades", "Comunidad", "Salud"]);
    expect(s.dataPages?.whoLivesHere[0]).toMatch(/^Loja tiene 20\.923 habitantes/);
    expect(s.dataPages?.inequality.intro[0]).toMatch(/^La media de Loja esconde diferencias grandes/);
    expect(s.dataPages?.inequality.blocks.map((b) => b.title)).toEqual(["Por barrio", "Mujeres y hombres", "Edad", "Origen", "Lo que no se ve"]);
  });
  it("separa la lectura de conjunto de las conclusiones", () => {
    expect(s.overallReading).toHaveLength(3);
    expect(s.overallReading[0]).toMatch(/^Las nueve conclusiones describen/);
    expect(s.conclusions.map((c) => c.id)).toEqual(["C1", "C2", "C3", "C4", "C5", "C6", "C7", "C8", "C9"]);
    expect(s.recommendations).toHaveLength(11);
  });
  it("no inventa páginas de datos en un perfil que no las declara", () => {
    expect(parseProfileStructure(fixture("zagra-v0.2-docx.txt")).dataPages).toBeUndefined();
  });
});

describe("Índice navegable · continuaciones y capítulos previos", () => {
  const source = [
    "Portada y créditos",
    "Documento original y autoría identificada.",
    "01. ANTECEDENTES",
    "Información histórica que debe seguir accesible.",
    "02. DATOS TERRITORIALES",
    "Segundo capítulo que no puede ocultarse.",
    "06. PUNTO DE PARTIDA",
    "Descripción inicial del territorio.",
    "07. CONCLUSIONES",
    "Una lectura de conjunto",
    "La lectura reúne las conclusiones del territorio.",
    "C1. Primera conclusión sustantiva. Una observación propia de C1.",
    "07. CONCLUSIONES · CONTINUACIÓN",
    "C2. Segunda conclusión sustantiva. Una observación propia de C2.",
    "07. CONCLUSIONES · CONTINUACIÓN",
    "C3. Tercera conclusión sustantiva. Una observación propia de C3.",
    "08. COINCIDENCIAS Y DISCREPANCIAS",
    "Lectura cruzada de fuentes.",
    "09. ACTIVOS Y COMUNIDAD",
    "Capacidades del municipio.",
    "10. RECOMENDACIONES",
    "R1. Contrastar las conclusiones con la población.",
  ].join("\n\n");

  const structure = parseProfileStructure(source);

  it("reúne los cortes de página en el capítulo 07 y conserva sus tres conclusiones", () => {
    const titles = structure.sections.map((s) => s.title);
    expect(titles.filter((title) => /^07\. CONCLUSIONES/i.test(title))).toEqual(["07. CONCLUSIONES"]);
    expect(titles).toContain("01. ANTECEDENTES");
    expect(titles).toContain("02. DATOS TERRITORIALES");
    expect(structure.conclusions.map((c) => c.id)).toEqual(["C1", "C2", "C3"]);
    const chapter = structure.sections.find((s) => s.title === "07. CONCLUSIONES");
    expect(chapter?.paragraphs.join(" ")).toContain("Una observación propia de C1");
    expect(chapter?.paragraphs.join(" ")).toContain("Una observación propia de C2");
    expect(chapter?.paragraphs.join(" ")).toContain("Una observación propia de C3");
  });

  it("presenta un índice único, no oculta los capítulos 01–05 y no duplica conclusiones", () => {
    const html = renderToStaticMarkup(createElement(ProfileReader, { structure, title: "Perfil de prueba" }));
    const toc = html.match(/<nav class="epr-toc"[\s\S]*?<\/nav>/)?.[0] ?? "";
    expect(toc).toContain('href="#epr-sec-01-antecedentes"');
    expect(toc).toContain('href="#epr-sec-02-datos-territoriales"');
    expect(toc).toContain('href="#epr-preliminaries"');
    expect(toc.indexOf("01. ANTECEDENTES")).toBeLessThan(toc.indexOf("06. PUNTO DE PARTIDA"));
    expect((toc.match(/07\. CONCLUSIONES/g) ?? [])).toHaveLength(1);
    expect(toc).not.toMatch(/CONTINUACIÓN/i);
    for (const id of ["C1", "C2", "C3"]) {
      expect((html.match(new RegExp('id="epr-' + id + '"', "g")) ?? [])).toHaveLength(1);
    }
  });

  it("no fusiona una continuación sin el capítulo correspondiente", () => {
    const other = parseProfileStructure("06. PUNTO DE PARTIDA\n\nTexto.\n\n07. CONCLUSIONES · CONTINUACIÓN\n\nTexto conservado.");
    expect(other.sections.map((s) => s.title)).toContain("07. CONCLUSIONES · CONTINUACIÓN");
    expect(other.sections.find((s) => s.title.endsWith("CONTINUACIÓN"))?.paragraphs).toContain("Texto conservado.");
  });
});

describe("Apertura sin número en el Perfil completo", () => {
  const alfacarLike = [
    "LOCAL HEALTH PROFILE / PERFIL LOCAL DE SALUD",
    "Alfacar · datos 2024–2026",
    "5.840 habitantes · 17,0 % de población de 65 años o más.",
    "La salud en resumen: población, prevención y activos.",
    "02. CUADRO DE INDICADORES",
    "Indicadores del municipio.",
    "03. POBLACIÓN Y ENFERMEDAD REGISTRADA",
    "Datos sanitarios originales.",
    "06. PUNTO DE PARTIDA",
    "Fuentes y escala.",
  ].join("\n\n");

  it("hace navegable la síntesis anterior al 02, sin inventar un epígrafe en el texto", () => {
    const structure = parseProfileStructure(alfacarLike);
    expect(structure.sections.some((s) => /^01\\./.test(s.title))).toBe(false);
    const html = renderToStaticMarkup(createElement(ProfileReader, { structure, title: "Alfacar" }));
    const toc = html.match(/<nav class="epr-toc"[\\s\\S]*?<\\/nav>/)?.[0] ?? "";
    expect(toc).toContain('href="#epr-sec-apertura-editorial"');
    expect(toc).toContain("01. Apertura y síntesis");
    expect(toc.indexOf("01. Apertura y síntesis")).toBeLessThan(toc.indexOf("02. CUADRO DE INDICADORES"));
    expect(html).toContain("Rótulo de navegación añadido por COMPÁS");
    expect((html.match(/La salud en resumen: población, prevención y activos/g) ?? [])).toHaveLength(1);
    expect((html.match(/5.840 habitantes/g) ?? [])).toHaveLength(1);
    expect(html).not.toContain('id="epr-preliminaries"');
  });

  it("no añade un segundo 01 cuando el documento lo contiene realmente", () => {
    const source = "01. RESUMEN\\n\\nTexto de apertura.\\n\\n02. CUADRO DE INDICADORES\\n\\nDatos.";
    const s = parseProfileStructure(source);
    const html = renderToStaticMarkup(createElement(ProfileReader, { structure: s, title: "Perfil" }));
    expect(html).toContain('href="#epr-sec-01-resumen"');
    expect(html).not.toContain('href="#epr-sec-apertura-editorial"');
  });

  it("no fabrica un 01 cuando no hay texto inicial que organizar", () => {
    const s = parseProfileStructure("02. CUADRO DE INDICADORES\\n\\nDatos.");
    const html = renderToStaticMarkup(createElement(ProfileReader, { structure: s, title: "Perfil" }));
    expect(html).not.toContain('href="#epr-sec-apertura-editorial"');
  });
});
