/**
 * CONTRACT-PROFILE-UPDATER — el actualizador crea una revisión nueva y no toca la vigente.
 * Los valores de la descarga son los publicados para Alfacar (18011) el 2026-11-18.
 */
import { describe, expect, it } from "vitest";
import { buildProfileUpdate, nextRevisionNumber, rebuildDataPages } from "../src/application/health-profile/profileUpdater";
import { parseProfileStructure } from "../src/application/health-profile/profileStructure";
import type { ExternalHealthProfile } from "../src/domain/health-profile/ExternalHealthProfile";
import type { TerritorialObservation, TerritorialStatisticsSnapshot } from "../src/domain/territorial-statistics/TerritorialStatistics";

const o = (indicatorId: string, level: TerritorialObservation["level"], territoryCode: string, territoryName: string, value: number | null, literal: string, sourceId: string, period = "2024"): TerritorialObservation =>
  ({ indicatorId, label: indicatorId, territoryCode, territoryName, level, period, value, literal, unit: "", sourceId });
const snapshot: TerritorialStatisticsSnapshot = {
  schema: "compas-territorial-statistics/v1", id: "s1", municipalityId: "alfacar", municipalityName: "Alfacar", ineCode: "18011",
  retrievedAt: "2026-11-18T07:59:00.000Z", catalogVersion: "2026-11-18", failures: [],
  sources: [
    { id: "ine-31025", provider: "INE", product: "Atlas de Distribución de Renta de los Hogares (INE)", table: "31025", title: "Indicadores de renta media y mediana", url: "u" },
    { id: "ine-53689", provider: "INE", product: "Atlas de Distribución de Renta de los Hogares (INE)", table: "53689", title: "Indicadores de renta media y mediana (ámbitos superiores)", url: "u" },
    { id: "ine-37698", provider: "INE", product: "Atlas de Distribución de Renta de los Hogares (INE)", table: "37698", title: "Índice de Gini y distribución de la renta P80/P20", url: "u" },
    { id: "badea-120971", provider: "IECA", product: "SIMA", table: "120971", title: "Tasa municipal de desempleo registrado", url: "u" },
  ],
  observations: [
    o("adrh-renta-neta-persona", "municipio", "18011", "Alfacar", 12924, "12.924", "ine-31025"),
    o("adrh-renta-neta-persona", "provincia", "18", "Granada", 13509, "13.509", "ine-53689"),
    o("adrh-renta-neta-persona", "andalucia", "01", "Andalucía", 13342, "13.342", "ine-53689"),
    o("adrh-renta-neta-persona", "seccion", "1801101001", "Alfacar sección 01001", 12907, "12.907", "ine-31025"),
    o("adrh-renta-neta-persona", "seccion", "1801101002", "Alfacar sección 01002", 11847, "11.847", "ine-31025"),
    o("adrh-gini", "municipio", "18011", "Alfacar", 28.3, "28,3", "ine-37698"),
    o("ieca-tasa-desempleo-registrado-mujeres", "municipio", "18011", "Alfacar", 19.3, "19,3%", "badea-120971", "2025"),
    o("ieca-tasa-desempleo-registrado-hombres", "municipio", "18011", "Alfacar", 12.4, "12,4%", "badea-120971", "2025"),
  ],
};
const text = [
  "PERFIL DE SALUD LOCAL", "Alfacar en datos", "Revisión 0.8.2 · 17/11/2026\nDocumento para revisión técnica", "Resumen. Texto del equipo.",
  "Quién vive aquí", "Texto de población del equipo.",
  "Panel de salud", "Resultados del Informe.", "Asma | 1.589,56 | 1.448,67",
  "Desigualdad", "Texto anterior de desigualdad.",
  "1. Punto de partida", "Punto de partida.",
  "2. Conclusiones", "C1. Una conclusión del equipo.",
  "7. Autoría y revisión", "Perfil elaborado por el equipo.",
  "Referencias", "1. Informe de salud.", "T31025. INE. Renta. Tabla 31025.",
  "Anexo C. Indicadores y comparaciones", "Desigualdad",
].join("\n\n");
const base: ExternalHealthProfile = {
  schema: "compas-external-profile/v1", id: "v082", municipalityId: "alfacar", title: "Perfil de Salud Local de Alfacar · revisión 0.8.2 · 17/11/2026",
  period: "Revisión 0.8.2 · 17/11/2026; demografía 2025", author: "", createdAt: "2026-11-17T10:00:00Z", status: "validated", validatedBy: "B", validatedAt: "2026-11-17T11:00:00Z",
  summary: "", text, findings: [], limitations: ["Limitación previa."], areas: [], attachmentIds: [],
  results: [{ id: "r1", title: "Renta neta media por persona", value: "12.924", unit: "euros", source: "INE", page: "", period: "2024", caution: "", topic: "Determinantes sociales", scale: "Municipio" }],
};
const library = { profiles: [base], attachments: [], activeId: "v082" };
const run = (kinds: Parameters<typeof buildProfileUpdate>[0]["kinds"]) =>
  buildProfileUpdate({ library, snapshots: [snapshot], kinds, author: "B", now: new Date("2026-11-18T10:00:00Z"), newId: () => "nueva" });

describe("actualizador de perfiles", () => {
  it("numera la revisión siguiente", () => {
    expect(nextRevisionNumber("Perfil · revisión 0.8.2 · 17/11/2026")).toEqual({ from: "0.8.2", to: "0.9.0" });
    expect(nextRevisionNumber("Perfil sin número")).toEqual({});
  });

  it("crea una revisión nueva en revisión y deja intacta la vigente", () => {
    const r = run(["paginas-datos", "indicadores", "rotulos"]);
    expect(r.blocked).toBeUndefined();
    expect(r.profile).toMatchObject({ id: "nueva", revisionOf: "v082", status: "review", title: "Perfil de Salud Local de Alfacar · revisión 0.9.0 · 18/11/2026" });
    expect(r.profile!.validatedBy).toBeUndefined();
    expect(base.text).toBe(text);
    expect(r.profile!.limitations.at(-1)).toMatch(/con la estadística territorial descargada el 2026-11-18\. Esta revisión no tiene archivos originales adjuntos\./);
  });

  it("ordena las seis páginas, compila las de datos y conserva el texto del equipo y los anexos", () => {
    const t = run(["paginas-datos", "rotulos"]).profile!.text;
    const heads = ["Alfacar en datos", "Contexto y población", "Ejes de desigualdad", "Condiciones de vida", "Servicios", "Salud y bienestar", "1. Punto de partida"];
    const at = heads.map(h => t.split("\n\n").indexOf(h));
    expect(at.every((x, i) => x >= 0 && (i === 0 || x > at[i - 1]))).toBe(true);
    expect(t).toContain("Revisión 0.9.0 · 18/11/2026");
    expect(t).toContain("Texto de población del equipo.");
    expect(t).toContain("Resultados del Informe.");
    expect(t).not.toContain("Texto anterior de desigualdad.");
    expect(t).toContain("En 2024, la renta neta media por persona es de 12.924 euros, frente a 13.509 en la provincia y 13.342 en Andalucía [T31025, T53689].");
    expect(t).toContain("La tasa de desempleo registrado es del 19,3 % en las mujeres y del 12,4 % en los hombres [B120971].");
    expect(t).toContain("Por sección. Entre las 2 secciones censales, la renta por persona va de 11.847 euros (01002) a 12.907 (01001).");
    // El anexo conserva su rótulo «Desigualdad» y las referencias no se duplican.
    expect(t.trim().endsWith("Anexo C. Indicadores y comparaciones\n\nDesigualdad")).toBe(true);
    expect(t.split("\n\n").filter(p => p.startsWith("T31025.")).length).toBe(1);
    expect(t).toContain("B120971. IECA. Tasa municipal de desempleo registrado. Año 2025. Consulta 120971 del BADEA.");
    expect(t).toMatch(/Revisión 0\.9\.0, 18\/11\/2026, generada con el Actualizador de perfiles/);
    const s = parseProfileStructure(t);
    expect(s.dataPages?.livingConditions.length).toBeGreaterThan(0);
    expect(s.dataPages?.services.length).toBeGreaterThan(0);
    expect(s.conclusions.map(c => c.id)).toEqual(["C1"]);
  });

  it("excluye del texto y la tabla un comparador de otro año", () => {
    const revised = { ...snapshot, observations: snapshot.observations.map(o => o.level === "provincia" ? { ...o, period: "2023" } : o) };
    const r = buildProfileUpdate({
      library, snapshots: [revised], kinds: ["paginas-datos"], author: "B",
      now: new Date("2026-11-18T15:00:00Z"), newId: () => "corr",
    });
    expect(r.profile!.text).toContain("En 2024, la renta neta media por persona es de 12.924 euros, frente a 13.342 en Andalucía");
    expect(r.profile!.text).not.toContain("13.509");
  });

  it("la segunda actualización sustituye lo compilado y no lo duplica", () => {
    const once = rebuildDataPages(text, snapshot, true, true).text;
    const twice = rebuildDataPages(once, snapshot, true, true).text;
    expect(twice).toBe(once);
  });

  it("solo rótulos: renombra en su sitio y reasigna los temas anteriores", () => {
    const r = run(["rotulos"]);
    const t = r.profile!.text;
    expect(t).toContain("Contexto y población\n\nTexto de población del equipo.\n\nSalud y bienestar");
    expect(t).toContain("Ejes de desigualdad\n\nTexto anterior de desigualdad.");
    expect(r.profile!.results[0].topic).toBe("Condiciones de vida");
  });

  it("bloquea sin Perfil vigente o sin descarga", () => {
    expect(buildProfileUpdate({ library: { profiles: [], attachments: [] }, kinds: ["rotulos"], author: "", now: new Date(), newId: () => "x" }).blocked).toMatch(/Perfil vigente/);
    expect(buildProfileUpdate({ library, snapshots: [], kinds: ["paginas-datos"], author: "", now: new Date(), newId: () => "x" }).blocked).toMatch(/descarga/);
  });
});

describe("campos del paquete derivados del texto (CONTRACT-PROFILE-UPDATER §8)", () => {
  it("vacía los campos si un paquete suprime la última conclusión, recomendación y lectura", () => {
    const original: ExternalHealthProfile = {
      ...base,
      text: [
        "2. Conclusiones", "Una lectura de conjunto", "El resumen.", "C1. La única conclusión.",
        "5. Recomendaciones", "R1. Cuidados", "Abordar. Valorar apoyos.", "Fundamento: C1.",
        "7. Autoría y revisión", "Perfil elaborado por el equipo.",
      ].join("\n\n"),
      summary: "El resumen.",
      findings: ["C1. La única conclusión."],
      areas: [{ id: "R1", title: "R1. Cuidados. Valorar apoyos.", rationale: "Abordar · Deriva de C1" }],
    };
    const r = buildProfileUpdate({
      library: { ...library, profiles: [original] }, kinds: ["paquete-texto"], author: "B",
      now: new Date("2026-11-18T15:00:00Z"), newId: () => "corr",
      textPackage: {
        schema: "compas-profile-text-package/v1", createdAt: "2026-11-18", author: "B", note: "",
        entries: [{ municipalityId: "alfacar", baseTitle: original.title, operations: [
          { op: "replace-section", heading: "2. Conclusiones", paragraphs: [] },
          { op: "replace-section", heading: "5. Recomendaciones", paragraphs: [] },
        ] }],
      },
    });
    expect(r.blocked).toBeUndefined();
    expect(r.profile).toMatchObject({ summary: "", findings: [], areas: [] });
    expect(original.findings).toEqual(["C1. La única conclusión."]);
  });

  it("conserva las marcas y campos aportados de un Perfil antiguo al corregir rótulos", () => {
    const original: ExternalHealthProfile = {
      ...base, text: "Quién vive aquí\n\nTexto del equipo.",
      summary: "Resumen aportado.", findings: ["Conclusión aportada."],
      areas: [{ id: "r1", title: "Recomendación aportada.", rationale: "Revisión técnica." }],
      reviewFlags: [{ target: "C1", reason: "Verificar la fuente." }],
    };
    const r = buildProfileUpdate({
      library: { ...library, profiles: [original] }, kinds: ["rotulos"], author: "B",
      now: new Date("2026-11-18T15:00:00Z"), newId: () => "corr",
    });
    expect(r.blocked).toBeUndefined();
    expect(r.profile!.text).toContain("Contexto y población");
    expect(r.profile).toMatchObject({
      summary: original.summary, findings: original.findings, areas: original.areas, reviewFlags: original.reviewFlags,
    });
  });

  const body = [
    "2. Conclusiones", "Una lectura de conjunto", "Primera lectura.", "Segunda lectura.",
    "C1. Conclusión uno.", "C2. Conclusión dos.",
    "5. Recomendaciones", "R1. Cuidados", "Abordar. Valorar apoyos.", "Fundamento: C1, C2.",
    "7. Autoría y revisión", "Perfil elaborado por el equipo.", "Referencias", "1. Informe.",
  ].join("\n\n");
  const stale: ExternalHealthProfile = { ...base, id: "v040", title: "Perfil de Salud Local de Zagra · revisión 0.4.0 · 18/11/2026", period: "Revisión 0.4.0 · 18/11/2026",
    text: body, summary: "Lectura anterior que ya no está en el texto.", findings: ["C1. Conclusión uno."],
    areas: [{ id: "R1", title: "R1. Cuidados. Valorar apoyos.", rationale: "Abordar · Deriva de C1" }] };
  const fix = () => buildProfileUpdate({ library: { profiles: [stale], attachments: [], activeId: "v040" }, kinds: ["campos-derivados"], author: "B", now: new Date("2026-11-18T15:00:00Z"), newId: () => "corr" });

  it("una corrección sin cambio de texto sube solo el número de corrección", () => {
    expect(nextRevisionNumber("Perfil · revisión 0.9.0 · 18/11/2026", true)).toEqual({ from: "0.9.0", to: "0.9.1" });
    const r = fix();
    expect(r.blocked).toBeUndefined();
    expect(r.profile!.title).toBe("Perfil de Salud Local de Zagra · revisión 0.4.1 · 18/11/2026");
    expect(r.profile!.text).toContain("Revisión 0.4.1, 18/11/2026");
  });

  it("rehace resumen, conclusiones y recomendaciones desde el texto", () => {
    const p = fix().profile!;
    expect(p.summary).toBe("Primera lectura.\n\nSegunda lectura.");
    expect(p.findings).toEqual(["C1. Conclusión uno.", "C2. Conclusión dos."]);
    expect(p.areas).toEqual([{ id: "R1", title: "R1. Cuidados. Valorar apoyos.", rationale: "Abordar · Deriva de C1, C2" }]);
    expect(stale.findings).toEqual(["C1. Conclusión uno."]);
  });

  it("conserva el título breve de las recomendaciones si el Perfil lo usaba", () => {
    const short = { ...stale, areas: [{ id: "R1", title: "R1. Valorar apoyos.", rationale: "Abordar · Deriva de C1" }] };
    const r = buildProfileUpdate({ library: { profiles: [short], attachments: [], activeId: "v040" }, kinds: ["campos-derivados"], author: "B", now: new Date("2026-11-18T15:00:00Z"), newId: () => "corr" });
    expect(r.profile!.areas[0].title).toBe("R1. Valorar apoyos.");
  });

  it("no crea revisión si los campos ya siguen al texto", () => {
    const p = fix().profile!;
    const r = buildProfileUpdate({ library: { profiles: [p], attachments: [], activeId: p.id }, kinds: ["campos-derivados"], author: "B", now: new Date("2026-11-18T16:00:00Z"), newId: () => "otra" });
    expect(r.blocked).toBe("Los cambios elegidos no modifican este Perfil.");
  });
});

describe("panel del actualizador", () => {
  it("ofrece todos los cambios del contrato, también la corrección de campos derivados", async () => {
    const src = (await import("node:fs")).readFileSync("src/ui/components/ProfileUpdaterPanel.tsx", "utf8");
    expect(src).toContain("Object.keys(PROFILE_UPDATE_LABEL)");
    expect(src).toMatch(/DEFAULT_KINDS[^\n]*'campos-derivados'/);
  });
});

describe("notas de limitaciones y archivos adjuntos", () => {
  const att = { id: "a1", name: "Atarfe_PSL_v0_7_1_2026-11-17.pdf", size: 1, type: "application/pdf", uploadedAt: "", storagePath: "" } as never;
  const p: ExternalHealthProfile = { ...base, id: "v081", title: "Perfil de Salud Local de Atarfe · revisión 0.8.1 · 18/11/2026", text: "2. Conclusiones\n\nC1. Una.\n\nReferencias\n\n1. Informe.", findings: ["C1. Una."],
    attachmentIds: ["a1"], limitations: ["Revisión 0.8.1 generada por el Actualizador de perfiles el 18/11/2026 con la estadística territorial descargada el 2026-11-18. El PDF original adjunto corresponde a la revisión 0.8.0 y no contiene estos cambios."] };
  it("la corrección nombra los archivos adjuntos en lugar de un número de revisión", () => {
    const r = buildProfileUpdate({ library: { profiles: [p], attachments: [att], activeId: "v081" }, kinds: ["campos-derivados"], author: "B", now: new Date("2026-11-18T17:00:00Z"), newId: () => "c" });
    expect(r.blocked).toBeUndefined();
    expect(r.profile!.title).toContain("revisión 0.8.2");
    expect(r.profile!.limitations[0]).toContain("Los archivos originales adjuntos (Atarfe_PSL_v0_7_1_2026-11-17.pdf) no contienen estos cambios.");
    expect(r.profile!.limitations.join(" ")).not.toMatch(/corresponde a la revisión/);
    expect(r.profile!.limitations.at(-1)).toBe("Revisión 0.8.2 generada por el Actualizador de perfiles el 18/11/2026. Los archivos originales adjuntos (Atarfe_PSL_v0_7_1_2026-11-17.pdf) no contienen estos cambios.");
  });
});
