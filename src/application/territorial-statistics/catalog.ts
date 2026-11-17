/**
 * Catálogo de indicadores territoriales de determinantes sociales y desigualdad
 * (CONTRACT-TERRITORIAL-STATISTICS §4; desarrolla el dominio «determinantes
 * sociales» y el eje de desigualdad del Art. 17 quater del contrato metodológico).
 *
 * Cada ficha fija qué serie de qué tabla o consulta se descarga, a qué escalas y
 * con qué comparadores. Los identificadores de tabla y las denominaciones de serie
 * se comprobaron contra las API públicas del INE (wstempus) y del IECA (BADEA) el
 * 2026-11-17. Una ficha nueva o modificada exige nueva versión del catálogo.
 */
import type { TerritorialLevel, TerritorialProvider } from "../../domain/territorial-statistics/TerritorialStatistics";

export const TERRITORIAL_CATALOG_VERSION = "2026-11-17";

export const ANDALUSIAN_PROVINCES = ["04", "11", "14", "18", "21", "23", "29", "41"] as const;
export type AndalusianProvince = (typeof ANDALUSIAN_PROVINCES)[number];

export type IneTableKey =
  | "adrh-renta"
  | "adrh-fuentes"
  | "adrh-umbrales"
  | "adrh-gini"
  | "adrh-demograficos"
  | "censo-nacionalidad"
  | "censo-nacimiento"
  | "censo-estudios"
  | "censo-actividad";

export interface IneTableSpec {
  key: IneTableKey;
  product: string;
  title: string;
  /** Tabla por provincia: municipios, distritos y secciones censales de la provincia. */
  byProvince: Record<AndalusianProvince, number>;
  /** Tabla nacional con ámbitos superiores, si publica comparadores. */
  comparatorTable?: number;
  /** Ámbitos superiores que publica la tabla de comparación. */
  comparatorLevels: TerritorialLevel[];
  /** La tabla por provincia incluye el valor de la propia provincia. */
  provinceInTable: boolean;
}

const ADRH = "Atlas de Distribución de Renta de los Hogares (INE)";
const CENSO = "Censo anual de población (INE)";

export const INE_TABLES: Record<IneTableKey, IneTableSpec> = {
  "adrh-renta": {
    key: "adrh-renta", product: ADRH, title: "Indicadores de renta media y mediana",
    byProvince: { "04": 30842, "11": 30944, "14": 30980, "18": 31025, "21": 31043, "23": 31061, "29": 31106, "41": 31205 },
    comparatorTable: 53689, comparatorLevels: ["provincia", "andalucia", "espana"], provinceInTable: false,
  },
  "adrh-fuentes": {
    key: "adrh-fuentes", product: ADRH, title: "Distribución por fuente de ingresos",
    byProvince: { "04": 30843, "11": 30945, "14": 30981, "18": 31026, "21": 31044, "23": 31062, "29": 31107, "41": 31206 },
    comparatorTable: 53687, comparatorLevels: ["provincia", "andalucia", "espana"], provinceInTable: false,
  },
  "adrh-umbrales": {
    key: "adrh-umbrales", product: ADRH, title: "Porcentaje de población con ingresos por unidad de consumo por debajo o por encima de determinados umbrales relativos, por sexo",
    byProvince: { "04": 30847, "11": 30949, "14": 30985, "18": 31030, "21": 31048, "23": 31066, "29": 31111, "41": 31210 },
    comparatorTable: 53694, comparatorLevels: ["provincia", "andalucia", "espana"], provinceInTable: false,
  },
  "adrh-gini": {
    key: "adrh-gini", product: ADRH, title: "Índice de Gini y distribución de la renta P80/P20",
    byProvince: { "04": 37680, "11": 37689, "14": 37693, "18": 37698, "21": 37700, "23": 37702, "29": 37706, "41": 37716 },
    comparatorTable: 53688, comparatorLevels: ["provincia", "andalucia", "espana"], provinceInTable: false,
  },
  "adrh-demograficos": {
    key: "adrh-demograficos", product: ADRH, title: "Indicadores demográficos",
    byProvince: { "04": 30850, "11": 30952, "14": 30988, "18": 31033, "21": 31051, "23": 31069, "29": 31114, "41": 31213 },
    comparatorTable: 53776, comparatorLevels: ["provincia", "andalucia", "espana"], provinceInTable: false,
  },
  "censo-nacionalidad": {
    key: "censo-nacionalidad", product: CENSO, title: "Población por sexo, edad y nacionalidad",
    byProvince: { "04": 69106, "11": 69142, "14": 69158, "18": 69178, "21": 69186, "23": 69194, "29": 69214, "41": 69258 },
    comparatorLevels: ["provincia"], provinceInTable: true,
  },
  "censo-nacimiento": {
    key: "censo-nacimiento", product: CENSO, title: "Población por sexo, edad y lugar de nacimiento",
    byProvince: { "04": 69107, "11": 69143, "14": 69159, "18": 69179, "21": 69187, "23": 69195, "29": 69215, "41": 69259 },
    comparatorLevels: ["provincia"], provinceInTable: true,
  },
  "censo-estudios": {
    key: "censo-estudios", product: CENSO, title: "Población de 15 y más años por nivel de formación alcanzado",
    byProvince: { "04": 66637, "11": 66685, "14": 66701, "18": 66721, "21": 66729, "23": 66737, "29": 66757, "41": 66801 },
    comparatorLevels: ["provincia"], provinceInTable: true,
  },
  "censo-actividad": {
    key: "censo-actividad", product: CENSO, title: "Población de 16 y más años por relación con la actividad",
    byProvince: { "04": 66639, "11": 66687, "14": 66703, "18": 66723, "21": 66731, "23": 66739, "29": 66759, "41": 66803 },
    comparatorLevels: ["provincia"], provinceInTable: true,
  },
};

export type IndicatorDomain = "determinantes-sociales" | "desigualdad" | "poblacion";

export interface IneSeriesSource { kind: "ine"; table: IneTableKey; series: string }
export interface IneRatioSource { kind: "ine-ratio"; table: IneTableKey; numerator: string; denominator: string }
export interface BadeaSource {
  kind: "badea";
  consulta: number;
  /** Posición de la medida en `measures` de la consulta. */
  measure: number;
  /** Filtro por posición de dimensión (1 = primera tras el territorio) y código completo unido por «.». */
  filters: Record<number, string>;
  /** Dimensiones que, en los comparadores, toman el código de la fila municipal (p. ej. grado de urbanización). */
  matchDimensions?: number[];
}

export interface IndicatorFicha {
  id: string;
  domain: IndicatorDomain;
  title: string;
  definition: string;
  unit: string;
  provider: TerritorialProvider;
  periodicity: string;
  scales: TerritorialLevel[];
  comparators: TerritorialLevel[];
  /** Ninguna de estas fuentes publica intervalos ni significación: sin colores (Art. 17 quater, 3). */
  publishesIntervals: false;
  cautions: string[];
  source: IneSeriesSource | IneRatioSource | BadeaSource;
  /** Expresión para reconocer el indicador entre los resultados de un Perfil vigente. */
  profileMatch: string;
}

const CAUTION_RENTA = "Eje de renta, no índice de privación múltiple (Art. 17 quater, 4).";
const CAUTION_SECCION = "El dato de sección es agregado; no se atribuye a calles, viviendas ni personas.";
const CAUTION_REGISTRO = "Registro administrativo: cuenta personas registradas, no la situación declarada en encuesta.";
const CAUTION_CENSO_AND = "La tabla municipal del censo no publica el valor de Andalucía; el comparador se omite.";
const CAUTION_DERIVADO = "Porcentaje calculado por COMPÁS a partir de dos recuentos publicados por la fuente; se conservan ambos.";

const ine = (table: IneTableKey, series: string): IneSeriesSource => ({ kind: "ine", table, series });
const ratio = (table: IneTableKey, numerator: string, denominator: string): IneRatioSource => ({ kind: "ine-ratio", table, numerator, denominator });
const ADRH_SCALES: TerritorialLevel[] = ["municipio", "distrito-censal", "seccion"];
const ADRH_CMP: TerritorialLevel[] = ["provincia", "andalucia", "espana"];
const CENSO_SCALES: TerritorialLevel[] = ["municipio", "distrito-censal", "seccion"];

export const TERRITORIAL_INDICATORS: IndicatorFicha[] = [
  // ── Renta (ADRH) ──────────────────────────────────────────────────────────
  { id: "adrh-renta-neta-persona", domain: "desigualdad", title: "Renta neta media por persona",
    definition: "Renta neta total de los hogares dividida por el número de personas residentes.",
    unit: "euros", provider: "INE", periodicity: "Anual (año de ingresos t, publicado en t+2)", scales: ADRH_SCALES, comparators: ADRH_CMP,
    publishesIntervals: false, cautions: [CAUTION_RENTA, CAUTION_SECCION],
    source: ine("adrh-renta", "Dato base. Renta neta media por persona."), profileMatch: "renta neta media por persona" },
  { id: "adrh-renta-neta-hogar", domain: "desigualdad", title: "Renta neta media por hogar",
    definition: "Renta neta total de los hogares dividida por el número de hogares.",
    unit: "euros", provider: "INE", periodicity: "Anual", scales: ADRH_SCALES, comparators: ADRH_CMP,
    publishesIntervals: false, cautions: [CAUTION_RENTA, CAUTION_SECCION],
    source: ine("adrh-renta", "Dato base. Renta neta media por hogar."), profileMatch: "renta neta media por hogar" },
  { id: "adrh-renta-mediana-uc", domain: "desigualdad", title: "Mediana de la renta por unidad de consumo",
    definition: "Mediana de la renta neta por unidad de consumo (escala OCDE modificada). La fuente la publica redondeada.",
    unit: "euros", provider: "INE", periodicity: "Anual", scales: ADRH_SCALES, comparators: ADRH_CMP,
    publishesIntervals: false, cautions: [CAUTION_RENTA, "La mediana se publica redondeada: coincidencias entre ámbitos no implican igualdad exacta."],
    source: ine("adrh-renta", "Dato base. Mediana de la renta por unidad de consumo."), profileMatch: "mediana de la renta" },
  { id: "adrh-bajo-60-mediana", domain: "desigualdad", title: "Población con ingresos por unidad de consumo por debajo del 60 % de la mediana",
    definition: "Porcentaje de población cuyos ingresos por unidad de consumo no alcanzan el 60 % de la mediana de referencia de la fuente.",
    unit: "%", provider: "INE", periodicity: "Anual", scales: ADRH_SCALES, comparators: ADRH_CMP,
    publishesIntervals: false, cautions: [CAUTION_RENTA, "La mediana de referencia es la que fija la fuente, no la del municipio."],
    source: ine("adrh-umbrales", "Total. Población con ingresos por unidad de consumo por debajo 60% de la mediana. Dato base."), profileMatch: "60 ?% de la mediana|riesgo de pobreza" },
  { id: "adrh-bajo-60-mediana-mujeres", domain: "desigualdad", title: "Mujeres con ingresos por unidad de consumo por debajo del 60 % de la mediana",
    definition: "Porcentaje de mujeres cuyos ingresos por unidad de consumo no alcanzan el 60 % de la mediana de referencia.",
    unit: "%", provider: "INE", periodicity: "Anual", scales: ADRH_SCALES, comparators: ADRH_CMP,
    publishesIntervals: false, cautions: [CAUTION_RENTA],
    source: ine("adrh-umbrales", "Mujeres. Población con ingresos por unidad de consumo por debajo 60% de la mediana. Dato base."), profileMatch: "mujeres.*60 ?%" },
  { id: "adrh-bajo-60-mediana-hombres", domain: "desigualdad", title: "Hombres con ingresos por unidad de consumo por debajo del 60 % de la mediana",
    definition: "Porcentaje de hombres cuyos ingresos por unidad de consumo no alcanzan el 60 % de la mediana de referencia.",
    unit: "%", provider: "INE", periodicity: "Anual", scales: ADRH_SCALES, comparators: ADRH_CMP,
    publishesIntervals: false, cautions: [CAUTION_RENTA],
    source: ine("adrh-umbrales", "Hombres. Población con ingresos por unidad de consumo por debajo 60% de la mediana. Dato base."), profileMatch: "hombres.*60 ?%" },
  { id: "adrh-gini", domain: "desigualdad", title: "Índice de Gini",
    definition: "Concentración de la renta por unidad de consumo entre la población (0 = igualdad; 100 = máxima concentración).",
    unit: "índice", provider: "INE", periodicity: "Anual", scales: ADRH_SCALES, comparators: ADRH_CMP,
    publishesIntervals: false, cautions: [CAUTION_RENTA],
    source: ine("adrh-gini", "Dato base. Índice de Gini."), profileMatch: "gini" },
  { id: "adrh-p80-p20", domain: "desigualdad", title: "Distribución de la renta P80/P20",
    definition: "Cociente entre los percentiles 80 y 20 de la renta por unidad de consumo.",
    unit: "ratio", provider: "INE", periodicity: "Anual", scales: ADRH_SCALES, comparators: ADRH_CMP,
    publishesIntervals: false, cautions: [CAUTION_RENTA],
    source: ine("adrh-gini", "Dato base. Distribución de la renta P80/P20."), profileMatch: "p80" },
  { id: "adrh-fuente-salario", domain: "determinantes-sociales", title: "Peso del salario en la renta",
    definition: "Porcentaje de la renta bruta procedente de salarios.",
    unit: "%", provider: "INE", periodicity: "Anual", scales: ADRH_SCALES, comparators: ADRH_CMP,
    publishesIntervals: false, cautions: [CAUTION_SECCION],
    source: ine("adrh-fuentes", "Porcentaje. Fuente de ingreso: salario."), profileMatch: "fuente de ingreso.*salario|ingresos.*salari" },
  { id: "adrh-fuente-pensiones", domain: "determinantes-sociales", title: "Peso de las pensiones en la renta",
    definition: "Porcentaje de la renta bruta procedente de pensiones.",
    unit: "%", provider: "INE", periodicity: "Anual", scales: ADRH_SCALES, comparators: ADRH_CMP,
    publishesIntervals: false, cautions: [CAUTION_SECCION],
    source: ine("adrh-fuentes", "Porcentaje. Fuente de ingreso: pensiones."), profileMatch: "fuente de ingreso.*pensiones" },
  { id: "adrh-fuente-desempleo", domain: "determinantes-sociales", title: "Peso de las prestaciones por desempleo en la renta",
    definition: "Porcentaje de la renta bruta procedente de prestaciones por desempleo.",
    unit: "%", provider: "INE", periodicity: "Anual", scales: ADRH_SCALES, comparators: ADRH_CMP,
    publishesIntervals: false, cautions: [CAUTION_SECCION],
    source: ine("adrh-fuentes", "Porcentaje. Fuente de ingreso: prestaciones por desempleo."), profileMatch: "prestaciones por desempleo" },
  { id: "adrh-fuente-otras-prestaciones", domain: "determinantes-sociales", title: "Peso de otras prestaciones en la renta",
    definition: "Porcentaje de la renta bruta procedente de otras prestaciones sociales.",
    unit: "%", provider: "INE", periodicity: "Anual", scales: ADRH_SCALES, comparators: ADRH_CMP,
    publishesIntervals: false, cautions: [CAUTION_SECCION],
    source: ine("adrh-fuentes", "Porcentaje. Fuente de ingreso: otras prestaciones."), profileMatch: "otras prestaciones" },
  // ── Estructura demográfica y hogares (ADRH) ───────────────────────────────
  { id: "adrh-poblacion", domain: "poblacion", title: "Población (ADRH)",
    definition: "Población de referencia del Atlas para el año de la renta.",
    unit: "personas", provider: "INE", periodicity: "Anual", scales: ADRH_SCALES, comparators: ADRH_CMP,
    publishesIntervals: false, cautions: ["Población de referencia del Atlas; puede diferir del Padrón y del Censo del mismo año."],
    source: ine("adrh-demograficos", "Población. Dato base."), profileMatch: "^población( total)?$" },
  { id: "adrh-edad-media", domain: "poblacion", title: "Edad media de la población",
    definition: "Edad media de la población residente.", unit: "años", provider: "INE", periodicity: "Anual",
    scales: ADRH_SCALES, comparators: ADRH_CMP, publishesIntervals: false, cautions: [],
    source: ine("adrh-demograficos", "Edad media de la población. Dato base."), profileMatch: "edad media" },
  { id: "adrh-pob-65", domain: "poblacion", title: "Población de 65 y más años",
    definition: "Porcentaje de población de 65 y más años.", unit: "%", provider: "INE", periodicity: "Anual",
    scales: ADRH_SCALES, comparators: ADRH_CMP, publishesIntervals: false, cautions: [],
    source: ine("adrh-demograficos", "Porcentaje de población de 65 y más años. Dato base."), profileMatch: "65 (y|o) más" },
  { id: "adrh-pob-menor-18", domain: "poblacion", title: "Población menor de 18 años",
    definition: "Porcentaje de población menor de 18 años.", unit: "%", provider: "INE", periodicity: "Anual",
    scales: ADRH_SCALES, comparators: ADRH_CMP, publishesIntervals: false, cautions: [],
    source: ine("adrh-demograficos", "Porcentaje de población menor de 18 años. Dato base."), profileMatch: "menor(es)? de 18" },
  { id: "adrh-hogares-unipersonales", domain: "determinantes-sociales", title: "Hogares unipersonales",
    definition: "Porcentaje de hogares formados por una sola persona.", unit: "%", provider: "INE", periodicity: "Anual",
    scales: ADRH_SCALES, comparators: ADRH_CMP, publishesIntervals: false, cautions: [],
    source: ine("adrh-demograficos", "Porcentaje de hogares unipersonales. Dato base."), profileMatch: "unipersonal" },
  { id: "adrh-tamano-hogar", domain: "determinantes-sociales", title: "Tamaño medio del hogar",
    definition: "Número medio de personas por hogar.", unit: "personas", provider: "INE", periodicity: "Anual",
    scales: ADRH_SCALES, comparators: ADRH_CMP, publishesIntervals: false, cautions: [],
    source: ine("adrh-demograficos", "Tamaño medio del hogar. Dato base."), profileMatch: "tamaño medio del hogar" },
  // ── Censo anual: origen, estudios y actividad ─────────────────────────────
  { id: "censo-extranjera", domain: "poblacion", title: "Población de nacionalidad extranjera",
    definition: "Porcentaje de residentes con nacionalidad extranjera sobre la población total.",
    unit: "%", provider: "INE", periodicity: "Anual (1 de enero)", scales: CENSO_SCALES, comparators: ["provincia"],
    publishesIntervals: false, cautions: [CAUTION_DERIVADO, CAUTION_CENSO_AND],
    source: ratio("censo-nacionalidad", "Total. Todas las edades. Extranjera. Dato base.", "Total. Total. Todas las edades. Dato base."), profileMatch: "nacionalidad extranjera|población extranjera" },
  { id: "censo-nacida-extranjero", domain: "poblacion", title: "Población nacida en el extranjero",
    definition: "Porcentaje de residentes nacidos fuera de España sobre la población total.",
    unit: "%", provider: "INE", periodicity: "Anual (1 de enero)", scales: CENSO_SCALES, comparators: ["provincia"],
    publishesIntervals: false, cautions: [CAUTION_DERIVADO, CAUTION_CENSO_AND],
    source: ratio("censo-nacimiento", "Total. Todas las edades. Extranjero. Dato base.", "Total. Total. Todas las edades. Dato base."), profileMatch: "nacida en el extranjero|nacidos? en el extranjero" },
  { id: "censo-estudios-superiores", domain: "determinantes-sociales", title: "Población de 15 y más años con educación superior",
    definition: "Porcentaje de la población de 15 y más años cuyo nivel de formación alcanzado es la educación superior.",
    unit: "%", provider: "INE", periodicity: "Anual", scales: CENSO_SCALES, comparators: ["provincia"],
    publishesIntervals: false, cautions: [CAUTION_DERIVADO, CAUTION_CENSO_AND],
    source: ratio("censo-estudios", "15 y más años. Educación superior. Total. Total. Dato base.", "15 y más años. Total. Total. Total. Dato base."), profileMatch: "estudios superiores|educación superior" },
  { id: "censo-estudios-primaria", domain: "determinantes-sociales", title: "Población de 15 y más años con educación primaria o inferior",
    definition: "Porcentaje de la población de 15 y más años cuyo nivel de formación alcanzado es la educación primaria o inferior.",
    unit: "%", provider: "INE", periodicity: "Anual", scales: CENSO_SCALES, comparators: ["provincia"],
    publishesIntervals: false, cautions: [CAUTION_DERIVADO, CAUTION_CENSO_AND],
    source: ratio("censo-estudios", "15 y más años. Educación primaria e inferior. Total. Total. Dato base.", "15 y más años. Total. Total. Total. Dato base."), profileMatch: "primaria (e|o) inferior|sin estudios" },
  { id: "censo-parados", domain: "determinantes-sociales", title: "Población de 16 y más años en paro",
    definition: "Porcentaje de personas paradas sobre la población de 16 y más años (no es la tasa de paro sobre población activa).",
    unit: "%", provider: "INE", periodicity: "Anual", scales: CENSO_SCALES, comparators: ["provincia"],
    publishesIntervals: false, cautions: [CAUTION_DERIVADO, CAUTION_CENSO_AND, "Denominador: población de 16 y más años, no población activa."],
    source: ratio("censo-actividad", "16 y más años. Parado/a. Total. Total. Dato base.", "16 y más años. Total. Total. Total. Dato base."), profileMatch: "parad[oa]s? (de|sobre) (la )?población de 16" },
  { id: "censo-ocupados", domain: "determinantes-sociales", title: "Población de 16 y más años ocupada",
    definition: "Porcentaje de personas ocupadas sobre la población de 16 y más años.",
    unit: "%", provider: "INE", periodicity: "Anual", scales: CENSO_SCALES, comparators: ["provincia"],
    publishesIntervals: false, cautions: [CAUTION_DERIVADO, CAUTION_CENSO_AND],
    source: ratio("censo-actividad", "16 y más años. Ocupado/a. Total. Total. Dato base.", "16 y más años. Total. Total. Total. Dato base."), profileMatch: "ocupad[oa]s" },
  // ── IECA · BADEA: empleo, pensiones, renta fiscal y hogares ───────────────
  { id: "ieca-tasa-desempleo-registrado", domain: "determinantes-sociales", title: "Tasa municipal de desempleo registrado",
    definition: "Personas registradas como desempleadas por cada cien personas de 16 a 64 años, según el cálculo del IECA.",
    unit: "%", provider: "IECA", periodicity: "Anual", scales: ["municipio"], comparators: ["provincia", "andalucia"],
    publishesIntervals: false, cautions: [CAUTION_REGISTRO, "Los comparadores provincial y andaluz se publican por grado de urbanización: se usa el del propio municipio."],
    source: { kind: "badea", consulta: 120971, measure: 0, filters: { 2: "P1_00" }, matchDimensions: [1] }, profileMatch: "desempleo registrado|tasa (municipal )?de (paro|desempleo)" },
  { id: "ieca-tasa-desempleo-registrado-mujeres", domain: "determinantes-sociales", title: "Tasa municipal de desempleo registrado (mujeres)",
    definition: "Mujeres registradas como desempleadas por cada cien mujeres de 16 a 64 años.",
    unit: "%", provider: "IECA", periodicity: "Anual", scales: ["municipio"], comparators: ["provincia", "andalucia"],
    publishesIntervals: false, cautions: [CAUTION_REGISTRO],
    source: { kind: "badea", consulta: 120971, measure: 0, filters: { 2: "06" }, matchDimensions: [1] }, profileMatch: "desempleo.*mujeres|mujeres.*desempleo" },
  { id: "ieca-tasa-desempleo-registrado-hombres", domain: "determinantes-sociales", title: "Tasa municipal de desempleo registrado (hombres)",
    definition: "Hombres registrados como desempleados por cada cien hombres de 16 a 64 años.",
    unit: "%", provider: "IECA", periodicity: "Anual", scales: ["municipio"], comparators: ["provincia", "andalucia"],
    publishesIntervals: false, cautions: [CAUTION_REGISTRO],
    source: { kind: "badea", consulta: 120971, measure: 0, filters: { 2: "01" }, matchDimensions: [1] }, profileMatch: "desempleo.*hombres|hombres.*desempleo" },
  { id: "ieca-paro-registrado", domain: "determinantes-sociales", title: "Paro registrado",
    definition: "Demandantes de empleo parados registrados (media anual).",
    unit: "personas", provider: "IECA", periodicity: "Anual", scales: ["municipio"], comparators: ["provincia", "andalucia"],
    publishesIntervals: false, cautions: [CAUTION_REGISTRO],
    source: { kind: "badea", consulta: 37015, measure: 0, filters: { 1: "00" } }, profileMatch: "paro registrado" },
  { id: "ieca-afiliaciones-residencia", domain: "determinantes-sociales", title: "Afiliaciones a la Seguridad Social por lugar de residencia",
    definition: "Afiliaciones de personas residentes en el municipio, todos los regímenes.",
    unit: "afiliaciones", provider: "IECA", periodicity: "Anual", scales: ["municipio"], comparators: [],
    publishesIntervals: false, cautions: ["Cuenta afiliaciones, no personas: una persona puede tener más de una."],
    source: { kind: "badea", consulta: 49483, measure: 0, filters: { 1: "00", 2: "00" } }, profileMatch: "afiliaci" },
  { id: "ieca-pensionistas-contributivos", domain: "determinantes-sociales", title: "Pensionistas de pensiones contributivas",
    definition: "Número de personas pensionistas de la Seguridad Social con pensión contributiva.",
    unit: "personas", provider: "IECA", periodicity: "Anual", scales: ["municipio"], comparators: ["provincia", "andalucia"],
    publishesIntervals: false, cautions: [],
    source: { kind: "badea", consulta: 46121, measure: 0, filters: { 1: "00", 2: "00" } }, profileMatch: "pensionistas" },
  { id: "ieca-pension-media", domain: "determinantes-sociales", title: "Pensión contributiva media",
    definition: "Importe medio mensual de la pensión contributiva.",
    unit: "euros/mes", provider: "IECA", periodicity: "Anual", scales: ["municipio"], comparators: ["provincia", "andalucia"],
    publishesIntervals: false, cautions: [],
    source: { kind: "badea", consulta: 46121, measure: 1, filters: { 1: "00", 2: "00" } }, profileMatch: "pensión media" },
  { id: "ieca-renta-disponible-media", domain: "desigualdad", title: "Renta disponible media por declaración (IRPF)",
    definition: "Renta disponible media de las declaraciones de IRPF, según la AEAT, en municipios de más de 1.000 habitantes.",
    unit: "euros", provider: "IECA", periodicity: "Anual", scales: ["municipio"], comparators: ["provincia", "andalucia"],
    publishesIntervals: false, cautions: ["Unidad: declaración tributaria, no hogar ni persona. No es comparable con el Atlas de Renta."],
    source: { kind: "badea", consulta: 105037, measure: 3, filters: {} }, profileMatch: "renta disponible" },
  { id: "ieca-grado-urbanizacion", domain: "poblacion", title: "Grado de urbanización",
    definition: "Clasificación del municipio según la tipología de celdas de población (metodología europea DEGURBA).",
    unit: "categoría", provider: "IECA", periodicity: "Anual", scales: ["municipio"], comparators: [],
    publishesIntervals: false, cautions: ["Clasificación, no medida de salud ni de privación."],
    source: { kind: "badea", consulta: 19824, measure: 0, filters: {} }, profileMatch: "grado de urbanizaci" },
  // ── IECA · BADEA por sección censal ───────────────────────────────────────
  { id: "ieca-seccion-tasa-desempleo", domain: "desigualdad", title: "Tasa de desempleo registrado por sección",
    definition: "Personas registradas como desempleadas por cada cien personas de 16 a 64 años, por sección censal.",
    unit: "%", provider: "IECA", periodicity: "Anual", scales: ["seccion"], comparators: [],
    publishesIntervals: false, cautions: [CAUTION_REGISTRO, CAUTION_SECCION],
    source: { kind: "badea", consulta: 119350, measure: 2, filters: {} }, profileMatch: "desempleo.*secci" },
  { id: "ieca-seccion-desempleo-larga", domain: "desigualdad", title: "Tasa de desempleo registrado de larga duración por sección",
    definition: "Personas registradas como desempleadas durante más de un año por cada cien personas de 16 a 64 años, por sección censal.",
    unit: "%", provider: "IECA", periodicity: "Anual", scales: ["seccion"], comparators: [],
    publishesIntervals: false, cautions: [CAUTION_REGISTRO, CAUTION_SECCION],
    source: { kind: "badea", consulta: 119350, measure: 3, filters: {} }, profileMatch: "larga duración" },
  { id: "ieca-seccion-indice-soledad", domain: "determinantes-sociales", title: "Índice de soledad por sección",
    definition: "Indicador del IECA sobre personas mayores que viven solas, por sección censal (definición en las notas de la fuente).",
    unit: "%", provider: "IECA", periodicity: "Anual", scales: ["seccion"], comparators: [],
    publishesIntervals: false, cautions: [CAUTION_SECCION],
    source: { kind: "badea", consulta: 119351, measure: 1, filters: {} }, profileMatch: "soledad" },
  { id: "ieca-seccion-pension-mediana", domain: "desigualdad", title: "Mediana del importe bruto de las pensiones contributivas por sección",
    definition: "Mediana del importe bruto mensual de las pensiones contributivas, por sección censal.",
    unit: "euros", provider: "IECA", periodicity: "Anual", scales: ["seccion"], comparators: [],
    publishesIntervals: false, cautions: [CAUTION_SECCION],
    source: { kind: "badea", consulta: 119349, measure: 3, filters: {} }, profileMatch: "mediana.*pensi" },
];

/** Capa de la malla de 250 m del IECA y campos que se suman como contexto. */
export const IECA_GRID = {
  endpoint: "https://www.juntadeandalucia.es/institutodeestadisticaycartografia/geoserver-ieca/grid/wfs",
  typeName: "grid:gridp_250",
  year: "2024",
  title: "Distribución espacial de la población en Andalucía (malla de 250 m)",
  totals: [
    { field: "pob_tot", label: "Población" },
    { field: "edad65_", label: "Población de 65 y más años" },
    { field: "afil_ss", label: "Afiliaciones a la Seguridad Social" },
    { field: "penc", label: "Pensiones contributivas" },
    { field: "demp", label: "Demandantes de empleo" },
  ],
} as const;

export const INE_BASE = "https://servicios.ine.es/wstempus/js/ES/";
export const BADEA_BASE = "https://www.juntadeandalucia.es/institutodeestadisticaycartografia/intranet/admin/rest/v1.0/";

export function provinceOf(ineCode: string): AndalusianProvince | undefined {
  const p = ineCode.slice(0, 2);
  return (ANDALUSIAN_PROVINCES as readonly string[]).includes(p) ? (p as AndalusianProvince) : undefined;
}
