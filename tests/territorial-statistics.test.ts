/**
 * CONTRACT-TERRITORIAL-STATISTICS — descarga, normalización y paquete para la revisión.
 * Las respuestas simuladas reproducen la forma y los valores publicados por el INE
 * y el IECA para Alfacar (18011), consultados el 2026-11-17. Las celdas de la malla
 * son valores de prueba para comprobar la suma y el secreto; no son datos publicados.
 */
import { describe, expect, it } from "vitest";
import {
  INE_TABLES, TERRITORIAL_INDICATORS, appendSnapshot, findAndalusianIneCodes, ineSuffix, mergeTerritorialResults, sectionCodeOf, isTerritorialStatisticsSnapshot, literalEs,
  parseBadea, profileCoverage, provenanceCsv, repairText, retrieveTerritorialStatistics, revisionResults, sectionCsv,
} from "../src/application/territorial-statistics";

const md = (variable: string, nombre: string, codigo: string, id = 1) => ({ Id: id, T3_Variable: variable, Nombre: nombre, Codigo: codigo });
const serie = (cod: string, nombre: string, terr: ReturnType<typeof md>, anyo: number, valor: number | null, secreto = false) =>
  ({ COD: cod, Nombre: nombre + " ", T3_Unidad: "", MetaData: [md("Países", "Total", "000"), terr, md("Tipo de dato", "Dato base", "")], Data: [{ Anyo: anyo, Valor: valor, Secreto: secreto }] });

const ALFACAR = md("Municipios", "Alfacar", "18011", 4172);
const SECC1 = md("Secciones", "Alfacar sección 01001", "1801101001", 338925);
const AGRON = md("Municipios", "Agrón", "18003", 4100);

const RESPONSES: Record<string, unknown> = {
  "VALORES_VARIABLE/115": [{ Id: 16473, Codigo: "00" }, { Id: 19, Codigo: "18" }],
  "VALORES_VARIABLE/70": [{ Id: 8997, Codigo: "01" }, { Id: 9015, Codigo: "18" }],
  "VALORES_VARIABLE/349": [{ Id: 16473, Codigo: "00" }],
  "DATOS_TABLA/31025?nult=1&tip=AM": [
    serie("ADRH98651", "Alfacar. Dato base. Renta neta media por persona.", ALFACAR, 2024, 12924),
    serie("X1", "Alfacar. Dato base. Renta neta media por hogar.", ALFACAR, 2024, 34163),
    serie("X2", "Alfacar. Dato base. Mediana de la renta por unidad de consumo.", ALFACAR, 2024, 17150),
    serie("X3", "Agrón. Dato base. Renta neta media por persona.", AGRON, 2024, 1),
  ],
  "DATOS_TABLA/53689?nult=1&tip=AM&tv=115:19": [
    serie("P1", "Granada. Dato base. Renta neta media por persona.", md("Provincias", "Granada", "18", 19), 2024, 13509),
  ],
  "DATOS_TABLA/53689?nult=1&tip=AM&tv=70:8997": [
    serie("A1", "Andalucía. Dato base. Renta neta media por persona.", md("Comunidades y Ciudades Autónomas", "Andalucía", "01", 8997), 2024, 13342),
  ],
  "DATOS_TABLA/53689?nult=1&tip=AM&tv=349:16473": [],
  "DATOS_TABLA/66721?nult=1&tip=AM": [
    serie("C1", "Alfacar. 15 y más años. Total. Total. Total. Dato base.", ALFACAR, 2024, 4982),
    serie("C2", "Alfacar. 15 y más años. Educación superior. Total. Total. Dato base.", ALFACAR, 2024, 1528),
    serie("C3", "Alfacar sección 01001. 15 y más años. Total. Total. Dato base. Total.", SECC1, 2024, null, true),
    serie("C4", "Alfacar sección 01001. 15 y más años. Educación superior. Total. Total. Dato base.", SECC1, 2024, 300),
  ],
  "consulta/120971": {
    metainfo: { id: 120971, title: "Tasa municipal de desempleo registrado", activity: "Sistema de Información Multiterritorial de Andalucía (SIMA)", notes: "(-) Secreto estad&iacute;stico" },
    measures: [{ des: "Tasa de desempleo registrado" }],
    data: [
      [{ cod: ["P2_C01"], des: "Andalucía" }, { cod: ["2"], des: "Zona de densidad intermedia" }, { cod: ["P1_00"], des: "Ambos sexos" }, { cod: ["2025"], des: "2025" }, { val: "15.70077473", format: "15,7%" }],
      [{ cod: ["P2_C01"], des: "Andalucía" }, { cod: ["1"], des: "Ciudades" }, { cod: ["P1_00"], des: "Ambos sexos" }, { cod: ["2025"], des: "2025" }, { val: "18.657579809999998", format: "18,7%" }],
      [{ cod: ["18011"], des: "Alfacar" }, { cod: ["2"], des: "Zona de densidad intermedia" }, { cod: ["01"], des: "Hombres" }, { cod: ["2025"], des: "2025" }, { val: "12.4", format: "12,4%" }],
      [{ cod: ["18011"], des: "Alfacar" }, { cod: ["2"], des: "Zona de densidad intermedia" }, { cod: ["06"], des: "Mujeres" }, { cod: ["2025"], des: "2025" }, { val: "19.3", format: "19,3%" }],
      [{ cod: ["18011"], des: "Alfacar" }, { cod: ["2"], des: "Zona de densidad intermedia" }, { cod: ["P1_00"], des: "Ambos sexos" }, { cod: ["2025"], des: "2025" }, { val: "15.8", format: "15,8%" }],
    ],
  },
  "consulta/119350": {
    metainfo: { id: 119350, title: "Indicadores estadísticos de relación con la actividad económica por secciones censales" },
    measures: [{ des: "Tasa de actividad registrada (%)" }, { des: "Tasa de empleo registrado (%)" }, { des: "Tasa de desempleo registrado (%)" }, { des: "Tasa de desempleo registrado de larga duración (%)" }, { des: "Porcentaje de parados registrados de larga duración (%)" }],
    data: [
      [{ cod: ["1801101001"], des: "Sección 001 del distrito 01 de Alfacar" }, { cod: ["2024"], des: "2024" }, { val: "67.1", format: "67,1" }, { val: "54.5", format: "54,5" }, { val: "18.8", format: "18,8" }, { val: "8.3", format: "8,3" }, { val: "45.1", format: "45,1" }],
      [{ cod: ["1801101002"], des: "Sección 002 del distrito 01 de Alfacar" }, { cod: ["2024"], des: "2024" }, { val: "69.6", format: "69,6" }, { val: "57.0", format: "57,0" }, { val: "18.2", format: "18,2" }, { val: "7.5", format: "7,5" }, { val: "43.3", format: "43,3" }],
      [{ cod: ["0400101001"], des: "Sección 001 del distrito 01 de Abla" }, { cod: ["2024"], des: "2024" }, { val: "69.9", format: "69,9" }, { val: "55.2", format: "55,2" }, { val: "21.0", format: "21,0" }, { val: "8.4", format: "8,4" }, { val: "42.6", format: "42,6" }],
    ],
  },
  grid: { type: "FeatureCollection", features: [
    { type: "Feature", properties: { cmun: "18011", pob_tot: 100, edad65_: 20, afil_ss: 40, penc: 25, demp: -1 }, geometry: null },
    { type: "Feature", properties: { cmun: "18011", pob_tot: 50, edad65_: -1, afil_ss: 10, penc: 5, demp: 7 }, geometry: null },
  ] },
};

function fakeFetch(calls: string[]) {
  return async (url: string) => {
    calls.push(url);
    if (url.includes("geoserver-ieca")) return RESPONSES.grid;
    const key = Object.keys(RESPONSES).find(k => url.endsWith(k));
    if (!key) throw new Error(`Sin respuesta simulada para ${url}`);
    return RESPONSES[key];
  };
}

const pick = (...ids: string[]) => TERRITORIAL_INDICATORS.filter(i => ids.includes(i.id));

async function snapshotAlfacar(calls: string[] = []) {
  return retrieveTerritorialStatistics({
    municipalityId: "alfacar", municipalityName: "Alfacar", ineCode: "18011", fetchJson: fakeFetch(calls),
    indicators: pick("adrh-renta-neta-persona", "adrh-renta-neta-hogar", "censo-estudios-superiores", "ieca-tasa-desempleo-registrado", "ieca-tasa-desempleo-registrado-mujeres", "ieca-seccion-tasa-desempleo"),
    now: () => new Date("2026-11-17T10:00:00Z"), newId: () => "snap-1",
  });
}

describe("catálogo", () => {
  it("cada indicador tiene ficha completa y fuente andaluza resoluble", () => {
    const ids = new Set<string>();
    for (const f of TERRITORIAL_INDICATORS) {
      expect(ids.has(f.id)).toBe(false); ids.add(f.id);
      expect(f.definition.length).toBeGreaterThan(10);
      expect(f.scales.length).toBeGreaterThan(0);
      expect(f.publishesIntervals).toBe(false);
      expect(() => new RegExp(f.profileMatch, "i")).not.toThrow();
      if (f.source.kind !== "badea") expect(Object.keys(INE_TABLES[f.source.table].byProvince)).toHaveLength(8);
      if (f.source.kind === "ine-ratio") expect(f.cautions.join(" ")).toMatch(/calculado por COMPÁS/);
    }
  });
});

describe("lectura de fuentes", () => {
  it("quita el territorio del nombre de la serie y conserva los decimales", () => {
    expect(ineSuffix("Alfacar sección 01001. Dato base. Renta neta media por persona. ")).toBe("Dato base. Renta neta media por persona.");
    expect(literalEs(28.3)).toBe("28,3");
    expect(literalEs(12924)).toBe("12.924");
    expect(literalEs(4982)).toBe("4982");
    expect(literalEs(-0.5)).toBe("-0,5");
  });
  it("repara textos con doble codificación", () => {
    expect(repairText("\u00c3\u008dndice de dependencia j\u00c3\u00b3venes")).toBe("Índice de dependencia jóvenes");
    expect(repairText("Índice")).toBe("Índice");
  });
  it("BADEA: reconoce municipio, secciones, provincia y Andalucía por su código", () => {
    const p = parseBadea(RESPONSES["consulta/119350"], "18011", "18");
    expect(p.rows.map(r => r.territoryCode)).toEqual(["1801101001", "1801101002"]);
    expect(p.rows[0].values[2]).toEqual({ value: 18.8, literal: "18,8", secret: false });
  });
});

describe("descarga de Alfacar", () => {
  it("normaliza valores, comparadores y procedencia sin alterar lo publicado", async () => {
    const calls: string[] = [];
    const s = await snapshotAlfacar(calls);
    expect(s.failures).toEqual([]);
    const renta = s.observations.filter(o => o.indicatorId === "adrh-renta-neta-persona");
    expect(renta.map(o => [o.level, o.literal])).toEqual([["municipio", "12.924"], ["provincia", "13.509"], ["andalucia", "13.342"]]);
    expect(renta[0]).toMatchObject({ period: "2024", sourceId: "ine-31025", seriesCode: "ADRH98651" });
    expect(s.observations.some(o => o.territoryCode === "18003")).toBe(false);
    // Las tablas se consultan una sola vez aunque varios indicadores las usen.
    expect(calls.filter(c => c.endsWith("DATOS_TABLA/31025?nult=1&tip=AM"))).toHaveLength(1);
    expect(isTerritorialStatisticsSnapshot(s, "alfacar")).toBe(true);
    expect(isTerritorialStatisticsSnapshot(s, "atarfe")).toBe(false);
  });

  it("declara el porcentaje derivado y respeta el secreto estadístico", async () => {
    const s = await snapshotAlfacar();
    const sup = s.observations.filter(o => o.indicatorId === "censo-estudios-superiores");
    const mun = sup.find(o => o.level === "municipio")!;
    expect(mun.value).toBe(30.7);
    expect(mun.literal).toBe("30,7");
    expect(mun.derived?.inputs.map(i => i.value)).toEqual([1528, 4982]);
    const secc = sup.find(o => o.level === "seccion")!;
    expect(secc).toMatchObject({ value: null, literal: "Secreto estadístico", secret: true });
  });

  it("BADEA: valor publicado literal y comparador del mismo grado de urbanización", async () => {
    const s = await snapshotAlfacar();
    const tasa = s.observations.filter(o => o.indicatorId === "ieca-tasa-desempleo-registrado");
    expect(tasa.map(o => [o.level, o.literal])).toEqual([["andalucia", "15,7%"], ["municipio", "15,8%"]]);
    expect(tasa[0].label).toMatch(/Zona de densidad intermedia/);
    expect(s.observations.find(o => o.indicatorId === "ieca-tasa-desempleo-registrado-mujeres" && o.level === "municipio")?.literal).toBe("19,3%");
    expect(s.observations.filter(o => o.indicatorId === "ieca-seccion-tasa-desempleo").map(o => o.literal)).toEqual(["18,8", "18,2"]);
  });

  it("malla: suma las celdas publicadas y cuenta las protegidas", async () => {
    const s = await snapshotAlfacar();
    expect(s.grid?.cellCount).toBe(2);
    expect(s.grid?.totals.find(t => t.field === "demp")).toEqual({ field: "demp", label: "Demandantes de empleo", sum: 7, secretCells: 1 });
  });

  it("un fallo de una fuente se registra y no detiene las demás", async () => {
    const s = await retrieveTerritorialStatistics({
      municipalityId: "alfacar", municipalityName: "Alfacar", ineCode: "18011", includeGrid: false,
      fetchJson: async url => { if (url.includes("consulta/")) throw new Error("Tiempo agotado"); return fakeFetch([])(url); },
      indicators: pick("adrh-renta-neta-persona", "ieca-paro-registrado"),
    });
    expect(s.failures).toEqual([{ scope: "IECA · consulta 37015", message: "Tiempo agotado" }]);
    expect(s.observations.some(o => o.indicatorId === "adrh-renta-neta-persona")).toBe(true);
  });

  it("IECA: si la dirección nueva falla, consulta la anterior y registra la que respondió", async () => {
    const calls: string[] = [];
    const s = await retrieveTerritorialStatistics({
      municipalityId: "alfacar", municipalityName: "Alfacar", ineCode: "18011", includeGrid: false,
      fetchJson: async url => { calls.push(url); if (url.startsWith("https://www.ieca.junta-andalucia.es/")) throw new Error("Failed to fetch"); return fakeFetch([])(url); },
      indicators: pick("ieca-tasa-desempleo-registrado"),
    });
    expect(calls).toEqual([
      "https://www.ieca.junta-andalucia.es/intranet/admin/rest/v1.0/consulta/120971",
      "https://www.juntadeandalucia.es/institutodeestadisticaycartografia/intranet/admin/rest/v1.0/consulta/120971",
    ]);
    expect(s.failures).toEqual([]);
    expect(s.sources[0].url).toMatch(/^https:\/\/www\.juntadeandalucia\.es\//);
  });

  it("rechaza códigos que no son municipios andaluces", async () => {
    await expect(retrieveTerritorialStatistics({ municipalityId: "x", municipalityName: "x", ineCode: "28079", fetchJson: async () => [] })).rejects.toThrow(/andaluza/);
    await expect(retrieveTerritorialStatistics({ municipalityId: "x", municipalityName: "x", ineCode: "180", fetchJson: async () => [] })).rejects.toThrow(/cinco cifras/);
  });
});

describe("paquete para la revisión", () => {
  it("resultados con la forma del paquete del Perfil y comparadores publicados", async () => {
    const s = await snapshotAlfacar();
    const r = revisionResults(s).find(x => x.id === "ts-adrh-renta-neta-persona")!;
    expect(r).toMatchObject({ value: "12.924", unit: "euros", period: "2024", scale: "Municipal", topic: "Ejes de desigualdad", chartValue: 12924 });
    expect(r.comparisons).toEqual([{ label: "Provincia de Granada", value: 13509 }, { label: "Andalucía", value: 13342 }]);
    expect(r.page).toMatch(/tabla 31025 · consultado 2026-11-17/);
    const der = revisionResults(s).find(x => x.id === "ts-censo-estudios-superiores")!;
    expect(der.caution).toMatch(/Valores publicados: .*1528; .*4982/);
  });

  it("cobertura: ausente, actualizable, al día y valor por revisar", async () => {
    const s = await snapshotAlfacar();
    const profile = { results: [
      { id: "1", title: "Renta neta media por persona", value: "12.924", unit: "€", source: "INE", page: "", period: "2024", caution: "" },
      { id: "2", title: "Renta neta media por hogar", value: "33.000", unit: "€", source: "INE", page: "", period: "2023", caution: "" },
      { id: "3", title: "Tasa municipal de desempleo registrado", value: "16,0", unit: "%", source: "IECA", page: "", period: "2025", caution: "" },
    ] };
    const c = Object.fromEntries(profileCoverage(s, profile).map(x => [x.indicatorId, x.status]));
    expect(c["adrh-renta-neta-persona"]).toBe("al-dia");
    expect(c["adrh-renta-neta-hogar"]).toBe("actualizable");
    expect(c["ieca-tasa-desempleo-registrado"]).toBe("revisar-valor");
    expect(c["censo-estudios-superiores"]).toBe("ausente");
    expect(c["adrh-gini"]).toBe("sin-dato");
  });

  it("cobertura en la misma escala que el Perfil: sección, periodo posterior y otra medida", async () => {
    const s = await snapshotAlfacar();
    const profile = { results: [
      { id: "1", title: "Educación superior", value: "6,0", unit: "%", source: "INE", page: "", period: "2024", caution: "", scale: "Sección censal 1801101001" },
      { id: "2", title: "Renta neta media por persona", value: "13.000", unit: "€", source: "INE", page: "", period: "2025", caution: "" },
      { id: "3", title: "Tasa municipal de desempleo registrado", value: "415", unit: "personas", source: "IECA", page: "", period: "2025", caution: "" },
    ] };
    const c = Object.fromEntries(profileCoverage(s, profile).map(x => [x.indicatorId, x]));
    // Sección 1801101001 en la descarga: secreto en el denominador, sin valor numérico.
    expect(c["censo-estudios-superiores"].downloaded?.territory).toBe("sección 1801101001");
    expect(c["adrh-renta-neta-persona"].status).toBe("otro-periodo");
    expect(c["ieca-tasa-desempleo-registrado"].status).toBe("otra-medida");
  });

  it("CSV de procedencia y de secciones con separador «;»", async () => {
    const s = await snapshotAlfacar();
    const prov = provenanceCsv(s);
    expect(prov.startsWith("\uFEFFindicador;")).toBe(true);
    expect(prov).toContain("adrh-renta-neta-persona;Dato base. Renta neta media por persona.;municipio;18011;Alfacar;2024;12.924;euros");
    const secc = sectionCsv(s).split("\r\n");
    expect(secc[0]).toMatch(/^\uFEFFsección censal;/);
    expect(secc.some(l => l.startsWith("1801101002;"))).toBe(true);
  });

  it("las descargas se acumulan y se conservan las seis más recientes", () => {
    const base = { schema: "compas-territorial-statistics/v1" as const, municipalityId: "a", municipalityName: "A", ineCode: "18011", catalogVersion: "x", sources: [], observations: [], failures: [] };
    let list = [] as ReturnType<typeof appendSnapshot>;
    for (let i = 1; i <= 8; i++) list = appendSnapshot(list, { ...base, id: `s${i}`, retrievedAt: `2026-11-${String(i).padStart(2, "0")}T00:00:00Z` });
    expect(list.map(s => s.id)).toEqual(["s3", "s4", "s5", "s6", "s7", "s8"]);
  });
});

describe("búsqueda del código INE por nombre", () => {
  const fetchJson = async (url: string) => {
    if (url.endsWith("GRUPOS_TABLA/31025")) return [{ Id: 1, Nombre: "Unidades territoriales" }];
    if (url.endsWith("VALORES_GRUPOSTABLA/31025/1")) return [
      { FK_Variable: 19, Codigo: "18011", Nombre: "Alfacar" },
      { FK_Variable: 19, Codigo: "18193", Nombre: "Zubia, La" },
      { FK_Variable: 847, Codigo: "1801101001", Nombre: "Alfacar sección 01001" },
    ];
    throw new Error(`No simulado: ${url}`);
  };
  it("encuentra el municipio en su provincia, sin tildes ni artículo pospuesto", async () => {
    expect(await findAndalusianIneCodes("ALFACAR", "Granada", fetchJson)).toEqual([{ code: "18011", name: "Alfacar" }]);
    expect(await findAndalusianIneCodes("La Zubia", "Granada", fetchJson)).toEqual([{ code: "18193", name: "Zubia, La" }]);
    expect(await findAndalusianIneCodes("Granada-Zaidín", "Granada", fetchJson)).toEqual([]);
  });
});

describe("revisión del Perfil con los datos descargados", () => {
  const base = { source: "INE", page: "", caution: "" };
  it("reconoce la sección por su código completo o por distrito y sección", () => {
    expect(sectionCodeOf({ title: "Renta neta media por persona, sección censal 01004", scale: "Sección censal" }, "18022")).toBe("1802201004");
    expect(sectionCodeOf({ title: "Renta", scale: "Sección censal 1801101001" }, "18011")).toBe("1801101001");
    expect(sectionCodeOf({ title: "Renta neta media por persona", scale: "Municipio" }, "18011")).toBeUndefined();
  });

  it("añade lo ausente, actualiza lo desactualizado conservando su vínculo y conserva lo demás", async () => {
    const s = await snapshotAlfacar();
    const vigentes = [
      { ...base, id: "r1", title: "Renta neta media por persona", value: "12.924", unit: "euros", period: "2024", scale: "Municipio" },
      { ...base, id: "r2", title: "Renta neta media por hogar", value: "33.000", unit: "euros", period: "2023", scale: "Municipio", supportsConclusions: ["C2"] },
      { ...base, id: "r3", title: "Glucemia", value: "1", unit: "%", period: "2024" },
    ];
    const { results, changes } = mergeTerritorialResults(s, vigentes);
    expect(results.find(r => r.id === "r1")).toBe(vigentes[0]);
    const r2 = results.find(r => r.id === "r2")!;
    expect(r2).toMatchObject({ period: "2024", supportsConclusions: ["C2"], topic: "Ejes de desigualdad" });
    expect(r2.caution).toMatch(/Sustituye en esta revisión el valor 33\.000 \(2023\)/);
    expect(results.find(r => r.id === "r3")).toBe(vigentes[2]);
    const tasa = results.find(r => r.id === "ts-ieca-tasa-desempleo-registrado")!;
    expect(tasa).toMatchObject({ value: "15,8", unit: "%", topic: "Condiciones de vida", scale: "Municipio" });
    expect(tasa.comparisons).toEqual([{ label: "Andalucía", value: 15.7 }]);
    // Indicadores por sección: van a la página de desigualdad con su código.
    const secc = results.filter(r => r.id.startsWith("ts-ieca-seccion-tasa-desempleo-"));
    expect(secc.map(r => [r.scale, r.value, r.topic])).toEqual([["Sección censal 1801101001", "18,8", "Ejes de desigualdad"], ["Sección censal 1801101002", "18,2", "Ejes de desigualdad"]]);
    expect(changes.filter(c => c.kind === "conservado").map(c => c.indicatorId)).toEqual(["adrh-renta-neta-persona"]);
    expect(changes.find(c => c.kind === "actualizado")?.previous).toMatchObject({ value: "33.000", reason: "actualizable" });
  });

  it("no duplica los resultados que ya vinieron de la estadística territorial", async () => {
    const s = await snapshotAlfacar();
    const first = mergeTerritorialResults(s, []).results;
    // Retitulados o retemados por el actualizador: se reconocen por su identificador.
    const renamed = first.map(r => ({ ...r, title: `${r.title} (revisado)`, topic: "Condiciones de vida" }));
    const second = mergeTerritorialResults(s, renamed).results;
    const ids = second.map(r => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(second.length).toBe(first.length);
  });

  it("al sustituir el dato de una sección conserva su rótulo y su página", async () => {
    const s = await snapshotAlfacar();
    const T = "Tasa de desempleo registrado por sección censal";
    const vigentes = [
      { ...base, id: "s1", title: T, value: "18,8", unit: "%", period: "2024", scale: "Sección censal 1801101001", topic: "Condiciones de vida" },
      { ...base, id: "s2", title: T, value: "18,25", unit: "%", period: "2024", scale: "Sección censal 1801101002", topic: "Condiciones de vida" },
    ];
    const { results } = mergeTerritorialResults(s, vigentes);
    expect(results.find(r => r.id === "s2")).toMatchObject({ value: "18,2", title: T, topic: "Condiciones de vida", scale: "Sección censal 1801101002" });
  });

  it("devuelve a su fila la sección que una revisión anterior sacó con el rótulo del catálogo", async () => {
    const s = await snapshotAlfacar();
    const T = "Tasa de desempleo registrado por sección censal";
    const vigentes = [
      { ...base, id: "s1", title: T, value: "18,8", unit: "%", period: "2024", scale: "Sección censal 1801101001", topic: "Condiciones de vida" },
      { ...base, id: "s2", title: "Tasa de desempleo registrado por sección", value: "18,2", unit: "%", period: "2024", scale: "Sección censal 1801101002", topic: "Ejes de desigualdad" },
      { ...base, id: "s3", title: T, value: "15,1", unit: "%", period: "2024", scale: "Sección censal 1801101003", topic: "Condiciones de vida" },
    ];
    const { results, changes } = mergeTerritorialResults(s, vigentes);
    expect(results.find(r => r.id === "s2")).toMatchObject({ title: T, topic: "Condiciones de vida", value: "18,2" });
    expect(changes.some(c => c.kind === "actualizado" && c.previous?.title === "Tasa de desempleo registrado por sección")).toBe(true);
    expect(results.filter(r => r.id.startsWith("s")).map(r => r.title)).toEqual([T, T, T]);
  });

  it("conserva las filas propias del Perfil que repiten una sección (mínimo y máximo)", async () => {
    const s = await snapshotAlfacar();
    const T = "Tasa de desempleo registrado por sección censal";
    const vigentes = [
      { ...base, id: "s1", title: T, value: "18,8", unit: "%", period: "2024", scale: "Sección censal 1801101001", topic: "Condiciones de vida" },
      { ...base, id: "s2", title: T, value: "18,2", unit: "%", period: "2024", scale: "Sección censal 1801101002", topic: "Condiciones de vida" },
      { ...base, id: "s3", title: T, value: "15,1", unit: "%", period: "2024", scale: "Sección censal 1801101003", topic: "Condiciones de vida" },
      { ...base, id: "max", title: "Tasa de desempleo registrado, sección 01001 (máximo)", value: "18,8", unit: "%", period: "2024", scale: "Sección censal 1801101001", topic: "Desigualdad" },
    ];
    const { results } = mergeTerritorialResults(s, vigentes);
    expect(results.find(r => r.id === "max")).toMatchObject({ title: "Tasa de desempleo registrado, sección 01001 (máximo)", topic: "Desigualdad" });
  });
});
