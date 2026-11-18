/**
 * Páginas de datos compiladas desde una descarga de estadística territorial
 * (contrato metodológico, Art. 4 quater y 17 ter; CONTRACT-PROFILE-UPDATER).
 *
 * Producen texto del Perfil en el formato de párrafos que lee el parser: tablas
 * con «|» y frases descriptivas con su fuente entre corchetes. Describen y
 * comparan; no concluyen. Cada frase se construye solo con valores publicados:
 * si falta un valor, la frase se omite, no se completa.
 */
import type { TerritorialObservation, TerritorialStatisticsSnapshot } from "../../domain/territorial-statistics/TerritorialStatistics";

export interface CompiledPages {
  contexto: string[];
  ejes: string[];
  condiciones: string[];
  servicios: string[];
  /** Referencias citadas («T31025. INE. …»), una por fuente. */
  references: string[];
}

/** Rótulo con el que empieza el bloque compilado de «Contexto y población», para reemplazarlo en la siguiente actualización. */
export const COMPILED_CONTEXT_MARK = "Datos de la estadística territorial.";

const LEVELS = ["provincia", "andalucia", "espana"] as const;

export function compileDataPages(s: TerritorialStatisticsSnapshot): CompiledPages {
  const M = s.municipalityName;
  const obs = (id: string, level: TerritorialObservation["level"] = "municipio") =>
    s.observations.find(o => o.indicatorId === id && o.level === level && o.value !== null);
  const sections = [...new Set(s.observations.filter(o => o.level === "seccion").map(o => o.territoryCode))].sort();
  const sec = (id: string, code: string) => s.observations.find(o => o.indicatorId === id && o.territoryCode === code);
  const provName = obs("adrh-renta-neta-persona", "provincia")?.territoryName ?? s.observations.find(o => o.level === "provincia")?.territoryName ?? "";
  const lit = (o: TerritorialObservation) => o.literal.replace(/\s*%$/, "");
  const num = (o: TerritorialObservation) => lit(o);

  // ── Citas ─────────────────────────────────────────────────────────────────
  const tagOf = (o: TerritorialObservation) => {
    const src = s.sources.find(x => x.id === o.sourceId);
    if (!src || src.id.startsWith("ieca-grid")) return undefined;
    return `${src.provider === "INE" ? "T" : "B"}${src.table}`;
  };
  const cited = new Set<string>();
  const cite = (...os: Array<TerritorialObservation | undefined>) => {
    const tags = [...new Set(os.flatMap(o => (o ? [tagOf(o)] : [])).filter((t): t is string => !!t))];
    tags.forEach(t => cited.add(t));
    return tags.length ? ` [${tags.join(", ")}]` : "";
  };
  const allOf = (ids: string[]) => ids.flatMap(id => s.observations.filter(o => o.indicatorId === id));

  // ── Tablas ────────────────────────────────────────────────────────────────
  const comparisonTable = (title: string, rows: Array<[string, string]>) => {
    const present = rows.filter(([id]) => obs(id));
    if (!present.length) return [];
    const levels = LEVELS.filter(l => present.some(([id]) => obs(id, l)));
    const label = (l: (typeof LEVELS)[number]) => (l === "provincia" ? `Provincia de ${provName}` : l === "andalucia" ? "Andalucía" : "España");
    const years = [...new Set(present.map(([id]) => obs(id)!.period))].join("–");
    const head = [`${title} · ${years}`, M, ...levels.map(label)].join(" | ");
    const body = present.map(([id, name]) => [name, num(obs(id)!), ...levels.map(l => { const c = obs(id, l); return c ? num(c) : "—"; })].join(" | "));
    return [head, ...body];
  };
  const sectionTable = (cols: Array<[string, string]>) => {
    const present = cols.filter(([id]) => sections.some(code => sec(id, code)));
    if (sections.length < 2 || !present.length) return [];
    const head = ["Sección", ...present.map(([, name]) => name)].join(" | ");
    const body = sections.map(code => [code.slice(5), ...present.map(([id]) => { const o = sec(id, code); return o ? (o.value === null ? (o.secret ? "secreto" : "—") : num(o)) : "—"; })].join(" | "));
    return [head, ...body];
  };
  const range = (id: string) => {
    const xs = sections.map(code => sec(id, code)).filter((o): o is TerritorialObservation => !!o && o.value !== null);
    if (xs.length < 2) return undefined;
    const sorted = [...xs].sort((a, b) => a.value! - b.value!);
    return { min: sorted[0], max: sorted[sorted.length - 1] };
  };
  const cmp = (id: string, joiner = "frente a") => {
    const parts = LEVELS.flatMap(l => {
      const c = obs(id, l);
      return c ? [`${num(c)} ${l === "provincia" ? "en la provincia" : l === "andalucia" ? "en Andalucía" : "en España"}`] : [];
    });
    if (!parts.length) return "";
    const list = parts.length > 1 ? `${parts.slice(0, -1).join(", ")} y ${parts[parts.length - 1]}` : parts[0];
    return `, ${joiner} ${list}`;
  };
  const sourcesNote = (ids: string[]) => {
    const tags = [...new Set(allOf(ids).map(tagOf).filter((t): t is string => !!t))];
    const ine = tags.filter(t => t.startsWith("T")).map(t => t.slice(1));
    const ieca = tags.filter(t => t.startsWith("B")).map(t => t.slice(1));
    const parts = [ine.length ? `INE, tablas ${ine.join(", ")}` : "", ieca.length ? `IECA, consultas ${ieca.join(", ")}` : ""].filter(Boolean);
    tags.forEach(t => cited.add(t));
    return parts.length ? `Fuentes: ${parts.join("; ")}. Descarga de COMPÁS del ${s.retrievedAt.slice(8, 10)}/${s.retrievedAt.slice(5, 7)}/${s.retrievedAt.slice(0, 4)}. Valores tal como los publica cada fuente.` : "";
  };

  // ── Contexto y población ──────────────────────────────────────────────────
  const contexto: string[] = [];
  {
    const sentences: string[] = [];
    const urb = s.observations.find(o => o.indicatorId === "ieca-grado-urbanizacion" && o.level === "municipio");
    if (urb) sentences.push(`El IECA clasifica ${M} como ${urb.literal.toLowerCase()} según la tipología europea de celdas de población${cite(urb)}.`);
    const edad = obs("adrh-edad-media"), hogar = obs("adrh-tamano-hogar");
    if (edad) sentences.push(`La edad media es de ${num(edad)} años en ${edad.period}${cmp("adrh-edad-media")}${cite(edad, obs("adrh-edad-media", "andalucia"))}.`);
    if (hogar) sentences.push(`Los hogares tienen de media ${num(hogar)} personas${cmp("adrh-tamano-hogar")}${cite(hogar)}.`);
    if (sentences.length) contexto.push(`${COMPILED_CONTEXT_MARK} ${sentences.join(" ")}`);
    const t = comparisonTable("Población y hogares", [
      ["adrh-pob-menor-18", "Menores de 18 años · %"], ["adrh-pob-65", "65 o más años · %"], ["adrh-edad-media", "Edad media · años"],
      ["adrh-tamano-hogar", "Tamaño medio del hogar · personas"], ["censo-extranjera", "Nacionalidad extranjera · %"], ["censo-nacida-extranjero", "Nacida en el extranjero · %"],
    ]);
    if (t.length) contexto.push(...t, sourcesNote(["adrh-pob-menor-18", "adrh-pob-65", "adrh-edad-media", "adrh-tamano-hogar", "censo-extranjera", "censo-nacida-extranjero"]));
  }

  // ── Ejes de desigualdad ───────────────────────────────────────────────────
  const ejes: string[] = [`Los ejes de desigualdad son las posiciones sociales que ordenan el acceso a los recursos: renta, nivel educativo, ocupación, sexo, edad y origen. Esta página reúne los que la estadística oficial publica para ${M}; la desigualdad por sexo en el empleo y las pensiones figura en «Condiciones de vida».`];
  const rentaIds: Array<[string, string]> = [
    ["adrh-renta-neta-persona", "Renta neta media por persona · €"], ["adrh-renta-neta-hogar", "Renta neta media por hogar · €"],
    ["adrh-renta-mediana-uc", "Mediana de la renta por unidad de consumo · €"], ["adrh-bajo-60-mediana", "Población bajo el 60 % de la mediana · %"],
    ["adrh-bajo-60-mediana-mujeres", "Mujeres bajo el 60 % de la mediana · %"], ["adrh-bajo-60-mediana-hombres", "Hombres bajo el 60 % de la mediana · %"],
    ["adrh-gini", "Índice de Gini"], ["adrh-p80-p20", "Distribución de la renta P80/P20"],
  ];
  ejes.push(...comparisonTable("Renta y su distribución", rentaIds));
  if (obs("adrh-renta-neta-persona")) ejes.push(`${sourcesNote(rentaIds.map(([id]) => id))} La mediana se publica redondeada; una coincidencia entre ámbitos no implica igualdad exacta.`.trim());
  {
    const r = obs("adrh-renta-neta-persona"), irpf = obs("ieca-renta-disponible-media");
    const parts: string[] = [];
    if (r) parts.push(`En ${r.period}, la renta neta media por persona es de ${num(r)} euros${cmp("adrh-renta-neta-persona")}${cite(r, obs("adrh-renta-neta-persona", "andalucia"))}.`);
    if (irpf) parts.push(`La renta disponible media por declaración del IRPF es de ${num(irpf)} euros${cmp("ieca-renta-disponible-media")}; es una medida por declaración tributaria y no se compara con la del Atlas${cite(irpf)}.`);
    if (parts.length) ejes.push(`Nivel. ${parts.join(" ")}`);
  }
  {
    const g = obs("adrh-gini"), p = obs("adrh-p80-p20"), u = obs("adrh-bajo-60-mediana"), um = obs("adrh-bajo-60-mediana-mujeres"), uh = obs("adrh-bajo-60-mediana-hombres");
    const parts: string[] = [];
    if (g) parts.push(`El índice de Gini es ${num(g)}${cmp("adrh-gini")}${p ? `; la razón P80/P20, ${num(p)}${cmp("adrh-p80-p20")}` : ""}${cite(g, obs("adrh-gini", "andalucia"))}.`);
    if (u) parts.push(`El ${num(u)} % de la población tiene ingresos por unidad de consumo inferiores al 60 % de la mediana${um && uh ? `: el ${num(um)} % de las mujeres y el ${num(uh)} % de los hombres` : ""}${cite(u)}.`);
    if (parts.length) ejes.push(`Distribución. ${parts.join(" ")}`);
  }
  {
    const sup = obs("censo-estudios-superiores"), pri = obs("censo-estudios-primaria"), ocu = obs("censo-ocupados");
    const parts: string[] = [];
    if (sup && pri) parts.push(`La educación superior alcanza al ${num(sup)} % de la población de 15 o más años y la primaria o inferior, al ${num(pri)} %${obs("censo-estudios-superiores", "provincia") && obs("censo-estudios-primaria", "provincia") ? `, frente al ${num(obs("censo-estudios-superiores", "provincia")!)} % y el ${num(obs("censo-estudios-primaria", "provincia")!)} % de la provincia` : ""}${cite(sup)}.`);
    if (ocu) parts.push(`El ${num(ocu)} % de la población de 16 o más años está ocupada${obs("censo-ocupados", "provincia") ? `, frente al ${num(obs("censo-ocupados", "provincia")!)} % de la provincia` : ""}${cite(ocu)}.`);
    if (parts.length) ejes.push(`Educación y ocupación. ${parts.join(" ")} Son porcentajes calculados por COMPÁS a partir de los recuentos del Censo anual.`);
  }
  if (sections.length >= 2) {
    const rr = range("adrh-renta-neta-persona"), gg = range("adrh-gini"), uu = range("adrh-bajo-60-mediana");
    const parts: string[] = [];
    if (rr) parts.push(`la renta por persona va de ${num(rr.min)} euros (${rr.min.territoryCode.slice(5)}) a ${num(rr.max)} (${rr.max.territoryCode.slice(5)})`);
    if (uu) parts.push(`la población bajo el 60 % de la mediana, del ${num(uu.min)} % (${uu.min.territoryCode.slice(5)}) al ${num(uu.max)} % (${uu.max.territoryCode.slice(5)})`);
    if (gg) parts.push(`el índice de Gini, de ${num(gg.min)} (${gg.min.territoryCode.slice(5)}) a ${num(gg.max)} (${gg.max.territoryCode.slice(5)})`);
    if (parts.length) ejes.push(`Por sección. Entre las ${sections.length} secciones censales, ${parts.join("; ")}.`);
    const t = sectionTable([["adrh-renta-neta-persona", "Renta por persona (€)"], ["adrh-bajo-60-mediana", "Bajo el 60 % de la mediana (%)"], ["adrh-gini", "Índice de Gini"], ["censo-estudios-superiores", "Educación superior (%)"], ["censo-estudios-primaria", "Primaria o inferior (%)"]]);
    if (t.length) ejes.push(...t, "Fuentes: Atlas de Renta y Censo anual, INE. Estudios sobre la población de 15 o más años. Las características de una sección no se atribuyen a cada una de las personas que residen en ella.");
  } else if (sections.length === 1) {
    ejes.push(`Por sección. ${M} tiene una sola sección censal: la estadística no permite analizar diferencias internas de renta ni de estudios.`);
  }

  // ── Condiciones de vida ───────────────────────────────────────────────────
  const condiciones: string[] = ["Las condiciones de vida son los determinantes intermedios: el empleo, los ingresos y la protección social, la convivencia en el hogar y la vivienda. En ellas se expresan los ejes de desigualdad de la página anterior."];
  {
    const t = comparisonTable("Empleo", [
      ["ieca-tasa-desempleo-registrado", "Tasa de desempleo registrado · %"], ["ieca-tasa-desempleo-registrado-mujeres", "Mujeres · %"],
      ["ieca-tasa-desempleo-registrado-hombres", "Hombres · %"], ["ieca-paro-larga-duracion", "Paro registrado de más de un año · % del paro"],
    ]);
    if (t.length) {
      const urb = s.observations.find(o => o.indicatorId === "ieca-grado-urbanizacion" && o.level === "municipio");
      condiciones.push(...t, `${sourcesNote(["ieca-tasa-desempleo-registrado", "ieca-paro-larga-duracion"])} La tasa cuenta personas registradas como desempleadas por cada cien de 16 a 64 años. Los valores de la provincia y de Andalucía corresponden a sus municipios ${urb ? `de la categoría «${urb.literal.toLowerCase()}», la misma que ${M}` : "de la misma categoría de urbanización"}.`);
    }
    const p = obs("ieca-paro-registrado"), pm = obs("ieca-paro-registrado-mujeres"), ph = obs("ieca-paro-registrado-hombres");
    const tm = obs("ieca-tasa-desempleo-registrado-mujeres"), th = obs("ieca-tasa-desempleo-registrado-hombres"), af = obs("ieca-afiliaciones-residencia");
    const parts: string[] = [];
    if (p) parts.push(`En ${p.period} constan ${num(p)} personas en paro registrado en media anual${pm && ph ? `: ${num(pm)} mujeres y ${num(ph)} hombres` : ""}${cite(p)}.`);
    if (tm && th) parts.push(`La tasa de desempleo registrado es del ${num(tm)} % en las mujeres y del ${num(th)} % en los hombres${cite(tm)}.`);
    if (af) parts.push(`Hay ${num(af)} afiliaciones a la Seguridad Social de personas residentes${cite(af)}.`);
    if (parts.length) condiciones.push(parts.join(" "));
  }
  {
    const ids: Array<[string, string]> = [
      ["adrh-fuente-salario", "Peso del salario en la renta · %"], ["adrh-fuente-pensiones", "Peso de las pensiones en la renta · %"],
      ["adrh-fuente-desempleo", "Peso de las prestaciones por desempleo · %"], ["adrh-fuente-otras-prestaciones", "Peso de otras prestaciones · %"],
      ["ieca-pension-media", "Pensión contributiva media · €/mes"], ["ieca-pension-media-mujeres", "Mujeres · €/mes"], ["ieca-pension-media-hombres", "Hombres · €/mes"],
    ];
    const t = comparisonTable("Ingresos y protección social", ids);
    if (t.length) condiciones.push(...t, sourcesNote(ids.map(([id]) => id)));
    const pm = obs("ieca-pension-media"), pw = obs("ieca-pension-media-mujeres"), pmn = obs("ieca-pension-media-hombres"), np = obs("ieca-pensionistas-contributivos");
    if (pm) condiciones.push(`${np ? `Las ${num(np)} personas pensionistas contributivas cobran` : "La pensión contributiva media es"} de media ${num(pm)} euros al mes${pw && pmn ? `: ${num(pw)} las mujeres y ${num(pmn)} los hombres` : ""}${cite(pm)}.`);
  }
  {
    const u = obs("adrh-hogares-unipersonales"), so = range("ieca-seccion-indice-soledad");
    const parts: string[] = [];
    if (u) parts.push(`El ${num(u)} % de los hogares es unipersonal${cmp("adrh-hogares-unipersonales")}${cite(u)}.`);
    if (so) parts.push(`El IECA publica por sección un índice de soledad: personas de 65 o más años que viven solas por cada cien de esa edad. En ${M} va de ${num(so.min)} (${so.min.territoryCode.slice(5)}) a ${num(so.max)} (${so.max.territoryCode.slice(5)}). Mide convivencia, no soledad no deseada${cite(so.min)}.`);
    else {
      const one = sections.length === 1 ? sec("ieca-seccion-indice-soledad", sections[0]) : undefined;
      if (one && one.value !== null) parts.push(`El índice de soledad del IECA, personas de 65 o más años que viven solas por cada cien de esa edad, es ${num(one)} en la única sección del municipio. Mide convivencia, no soledad no deseada${cite(one)}.`);
    }
    if (parts.length) condiciones.push(`Hogares y convivencia. ${parts.join(" ")}`);
  }
  {
    const v = obs("ieca-viviendas-no-principales"), a = range("ieca-seccion-alquiler-colectiva");
    const parts: string[] = [];
    if (v) parts.push(`El Censo de ${v.period} registra ${num(v)} viviendas familiares que no son residencia habitual${cite(v)}.`);
    if (a) parts.push(`El alquiler medio de vivienda colectiva va de ${num(a.min)} a ${num(a.max)} euros al mes en las secciones con datos publicados en ${a.min.period}${cite(a.min)}.`);
    if (parts.length) condiciones.push(`Vivienda. ${parts.join(" ")}`);
  }
  {
    const t = sectionTable([
      ["ieca-seccion-tasa-desempleo", "Desempleo registrado (%)"], ["ieca-seccion-desempleo-larga", "Desempleo de larga duración (%)"],
      ["adrh-fuente-pensiones", "Peso de las pensiones en la renta (%)"], ["ieca-seccion-pension-mediana", "Mediana de la pensión contributiva (€/mes)"],
      ["ieca-seccion-indice-soledad", "Índice de soledad (%)"], ["ieca-seccion-alquiler-colectiva", "Alquiler de vivienda colectiva (€/mes)"],
    ]);
    if (t.length) condiciones.push(...t, sourcesNote(["ieca-seccion-tasa-desempleo", "ieca-seccion-pension-mediana", "ieca-seccion-indice-soledad", "ieca-seccion-alquiler-colectiva", "adrh-fuente-pensiones"]));
  }

  // ── Servicios ─────────────────────────────────────────────────────────────
  const servicios: string[] = [];
  {
    const ap = obs("ieca-centros-atencion-primaria"), ss = obs("ieca-centros-servicios-sociales");
    const parts: string[] = [];
    if (ap) parts.push(`En ${ap.period} constan en ${M} ${num(ap)} ${ap.value === 1 ? "centro" : "centros"} de atención primaria${cite(ap)}.`);
    else parts.push(`El IECA no publica centros de atención primaria situados en ${M}.`);
    if (ss) parts.push(`En ${ss.period}, ${num(ss)} ${ss.value === 1 ? "centro" : "centros"} de servicios sociales${cite(ss)}.`);
    else parts.push(`No constan centros de servicios sociales situados en el municipio en la estadística del IECA.`);
    parts.push("El recuento indica qué recursos hay en el municipio; no mide su capacidad, sus horarios ni la población atendida.");
    servicios.push(parts.join(" "));
  }

  // ── Referencias ───────────────────────────────────────────────────────────
  const date = `${s.retrievedAt.slice(8, 10)}/${s.retrievedAt.slice(5, 7)}/${s.retrievedAt.slice(0, 4)}`;
  const references = [...cited].sort().flatMap(tag => {
    const src = s.sources.find(x => `${x.provider === "INE" ? "T" : "B"}${x.table}` === tag);
    if (!src) return [];
    const period = [...new Set(s.observations.filter(o => o.sourceId === src.id).map(o => o.period))].join(", ");
    return src.provider === "INE"
      ? [`${tag}. INE. ${src.title}. ${src.product.replace(/ \(INE\)$/, "")}. Año ${period}. Tabla ${src.table}. Consulta ${date}. https://www.ine.es/jaxiT3/Tabla.htm?t=${src.table}`]
      : [`${tag}. IECA. ${src.title}. Año ${period}. Consulta ${src.table} del BADEA. Consulta ${date}.`];
  });

  const clean = (xs: string[]) => xs.filter(x => x && x.trim());
  return { contexto: clean(contexto), ejes: clean(ejes), condiciones: clean(condiciones), servicios: clean(servicios), references };
}
