import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { comparatorsOf, geographicComparators, groupRecommendations, groupResultsByTopic, headlineResults, sectionMetrics, splitDataPageResults } from "../src/application/health-profile/profileDashboard";
import { isProfileResult } from "../src/application/health-profile/externalProfiles";
import { parseProfileStructure } from "../src/application/health-profile/profileStructure";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ProfileResultsDashboard } from "../src/ui/components/ProfileResultsDashboard";
import type { ExternalHealthProfile, ProfileResult } from "../src/domain/health-profile/ExternalHealthProfile";

const r = (o: Partial<ProfileResult> & { id: string; title: string; value: string }): ProfileResult => ({ unit: "", source: "Fuente [1]", page: "", period: "2025", caution: "", ...o });
const results: ProfileResult[] = [
  r({ id: "a", title: "Habitantes", value: "843", topic: "Población", chartValue: 843 }),
  r({ id: "b", title: "Diabetes", value: "10,36", unit: "%", topic: "Salud", chartValue: 10.36, comparison: { label: "Distrito", value: 7.01 }, temporalContext: "historical", period: "2015" }),
  r({ id: "c", title: "Hipertensión", value: "27,56", unit: "%", topic: "Salud", chartValue: 27.56, comparison: { label: "Distrito", value: 12.32 }, temporalContext: "historical", period: "2015" }),
  r({ id: "d", title: "Bienestar emocional", value: "84,8", unit: "% de papeletas", topic: "Voz de la comunidad", chartValue: 84.8, denominator: "158 papeletas completas" }),
];
const profile: ExternalHealthProfile = {
  schema: "compas-external-profile/v1", id: "p", municipalityId: "zagra", title: "Perfil", period: "v0.2", author: "", createdAt: "2026-11-01T00:00:00Z",
  status: "review", summary: "Primer párrafo.\n\nSegundo párrafo.", text: "", results, findings: ["C1. Zagra envejece.", "C2. Malestar emocional."],
  limitations: ["Local y no local."], attachmentIds: [],
  areas: [
    { id: "R1", title: "R1. Pedir el Informe de Salud.", rationale: "Conocer · Deriva de C2, C4" },
    { id: "R7", title: "R7. Trabajar la actividad física.", rationale: "Abordar · Deriva de C3, C7" },
    { id: "R5", title: "R5. Contrastar con las cuidadoras.", rationale: "Contrastar · Deriva de C1" },
    { id: "X", title: "Área sin tipo", rationale: "Propuesta del equipo" },
  ],
};

describe("profileDashboard", () => {
  it("agrupa por tema conservando el orden y con escala común por unidad", () => {
    const topics = groupResultsByTopic(results);
    expect(topics.map(t => t.topic)).toEqual(["Población", "Salud", "Voz de la comunidad"]);
    expect(topics[1].scaleByUnit["%"]).toBe(27.56);
  });
  it("destaca solo cifras vigentes con valor numérico", () => {
    expect(headlineResults(results).map(x => x.id)).toEqual(["a", "d"]);
  });
  it("agrupa recomendaciones por tipo declarado y deja el resto en «Otras»", () => {
    const groups = groupRecommendations(profile.areas);
    expect(groups.map(g => g.type)).toEqual(["Conocer", "Contrastar", "Abordar", "Otras"]);
    expect(groups[0].items[0]).toMatchObject({ id: "R1", derivesFrom: "C2, C4" });
    expect(groups[3].items[0].derivesFrom).toBe("Propuesta del equipo");
  });
});

describe("ProfileResultsDashboard", () => {
  const html = renderToStaticMarkup(<ProfileResultsDashboard profile={profile} municipalityName="Zagra" />);
  it("muestra cifras, lectura, conclusiones, datos y recomendaciones", () => {
    expect(html).toContain("Zagra en cifras");
    expect(html).toContain("Segundo párrafo.");
    expect(html).toContain("Zagra envejece.");
    expect(html).toContain("Resultados del perfil");
    expect(html).toContain("Qué propone hacer a continuación");
    expect(html).toContain("Pedir el Informe de Salud.");
    expect(html).toContain("Deriva de C2, C4");
  });
  it("presenta los datos epidemiológicos sin cautelas añadidas", () => {
    expect(html).toContain("10,36 %");
    expect(html).not.toContain("no describe por sí solo");
    expect(html).not.toContain("Antecedente histórico");
  });
  it("abrevia «% de papeletas» y mantiene la base", () => {
    expect(html).toContain("84,8 %");
    expect(html).toContain("Base: 158 papeletas completas");
  });
});
describe("ProfileResultsDashboard · páginas de datos (Art. 17 ter)", () => {
  const text = readFileSync(resolve(__dirname, "fixtures/profile-text/loja-v0.3-package.txt"), "utf8");
  const geo = (g: number, a: number) => ({ comparison: { label: "Provincia de Granada", value: g }, comparisons: [{ label: "Provincia de Granada", value: g }, { label: "Andalucía", value: a }] });
  const lojaResults: ProfileResult[] = [
    r({ id: "h", title: "Habitantes", value: "20.923", topic: "Quién vive aquí", chartValue: 20923, comparison: { label: "Loja, 2010 [2]", value: 21688 } }),
    r({ id: "s1", title: "Renta neta por persona", value: "7.107", unit: "€", topic: "Desigualdad", chartValue: 7107, scale: "Sección censal 03002 (Alfaguara)", comparisons: [{ label: "Loja", value: 11741 }, { label: "Provincia de Granada", value: 13509 }] }),
    r({ id: "s2", title: "Renta neta por persona", value: "13.774", unit: "€", topic: "Desigualdad", chartValue: 13774, scale: "Sección censal 05002", comparisons: [{ label: "Loja", value: 11741 }, { label: "Provincia de Granada", value: 13509 }] }),
    r({ id: "d", title: "Dislipemia", value: "3.081,79", unit: "por 10.000", topic: "Morbilidad", chartValue: 3081.79, ...geo(2718.19, 2569.94) }),
    r({ id: "m", title: "Participación en el cribado de mama", value: "73,47", unit: "%", topic: "Protección de la salud", chartValue: 73.47, ...geo(84.3, 70.93) }),
  ];
  const loja: ExternalHealthProfile = { ...profile, municipalityId: "loja", results: lojaResults, text, summary: "", findings: [], areas: [] };
  const structure = parseProfileStructure(text);
  const html = renderToStaticMarkup(<ProfileResultsDashboard profile={loja} municipalityName="Loja" structure={structure} pdfUrl="blob:perfil" pdfName="Perfil.pdf" />);
  it("reparte los resultados por página y reconoce los ámbitos de comparación", () => {
    const split = splitDataPageResults(lojaResults);
    expect(split.whoLivesHere.map((x) => x.id)).toEqual(["h"]);
    expect(split.inequality.map((x) => x.id)).toEqual(["s1", "s2"]);
    expect(split.healthPanel.map((x) => x.id)).toEqual(["d", "m"]);
    expect(geographicComparators(lojaResults, "Loja")).toEqual(["Provincia de Granada", "Andalucía"]);
    expect(comparatorsOf(lojaResults[0])).toEqual([{ label: "Loja, 2010 [2]", value: 21688 }]);
    const metrics = sectionMetrics(split.inequality);
    expect(metrics).toHaveLength(1);
    expect(metrics[0].rows.map((x) => x.section)).toEqual(["03002 (Alfaguara)", "05002"]);
    expect(metrics[0].references.map((x) => x.label)).toEqual(["Loja", "Provincia de Granada"]);
  });
  it("abre con las cuatro páginas en orden y después la lectura de conjunto", () => {
    const order = ["Perfil de Salud Local</p>", "<h2>Quién vive aquí</h2>", "<h2>Panel de salud</h2>", "<h2>Desigualdad</h2>", "Qué concluye el perfil", "Lo que concluye el perfil"].map((t) => html.indexOf(t));
    expect(order.every((i) => i >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });
  it("compara con varios ámbitos en columnas, sin juicio de color", () => {
    expect(html).toContain("Desigualdades");
    expect(html).toMatch(/<th scope="col" class="pdp-num">Provincia de Granada<\/th><th scope="col" class="pdp-num">Andalucía<\/th>/);
    expect(html).toContain("2.718,19");
    expect(html).toContain("2.569,94");
    expect(html).toContain("Loja, 2010 [2]: 21.688");
    expect(html).not.toMatch(/(better|worse|similar|mejor-que|peor-que)/);
    expect(html).not.toContain("Resultados del perfil");
  });
  it("explora las secciones censales y ofrece las dos descargas", () => {
    expect(html).toContain("03002 (Alfaguara)");
    expect(html).toContain("Guardar páginas en PDF");
    expect(html).toContain('href="blob:perfil" download="Perfil.pdf"');
  });
  it("acepta en el paquete varios comparadores y rechaza los mal formados", () => {
    expect(isProfileResult(lojaResults[3])).toBe(true);
    expect(isProfileResult({ ...lojaResults[3], comparisons: [{ label: "Andalucía", value: "1" }] })).toBe(false);
  });
  it("conserva la vista anterior para perfiles sin páginas de datos", () => {
    const plain = renderToStaticMarkup(<ProfileResultsDashboard profile={profile} municipalityName="Zagra" />);
    expect(plain).toContain("Resultados del perfil");
    expect(plain).not.toContain("pdp-page");
  });
});
