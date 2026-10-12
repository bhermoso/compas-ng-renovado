/**
 * eas2023References
 *
 * Referencias de población de la Encuesta Andaluza de Salud 2023 (EAS 2023).
 *
 * Procedencia: calculado por el autor desde microdatos EAS 2023 ponderados
 * para Granada-provincia (PROV=18) y Andalucía. El script de recomputación
 * queda en src/application/eas-references/reproducible/ (pendiente de
 * microdatos, que no forman parte del repositorio).
 *
 * Reglas de uso obligatorias:
 *   - Ningún valor se presenta como dato del municipio.
 *   - Solo se usan como contexto de población general de Granada/Andalucía.
 *   - IBSE no figura aquí: no existe referencia Granada/Andalucía equivalente
 *     en la EAS 2023 — ausencia del dato EAS, no deuda de NG.
 *   - Los marcados coveredByFixture=true ya cuentan con fixture autonómico en
 *     andalusiaReferenceContract.ts; el fixture prevalece para los indicadores
 *     de estudio que lo tienen.
 *
 * Fuente de los valores (rango leído sin base64):
 *   historico/index.html:11106–11320 — COMPAS_REFERENCIAS_EAS_REALES_2023
 */

export const EAS2023_PROVENANCE =
  "calculado por el autor desde microdatos EAS 2023; script reproducible pendiente";

export const EAS2023_REFERENCE_LABEL =
  EAS2023_PROVENANCE +
  " — referencia contextual no local (Granada provincia / Andalucía)";

export const EAS2023_CAUTION =
  "Referencia de población general (Granada provincia como proxy y Andalucía). " +
  "No equivale al dato del municipio ni a una estimación territorial específica. " +
  "Usar exclusivamente como contexto de la EAS 2023, con fuente declarada.";

export interface EAS2023ReferenceEntry {
  /** Clave del histórico COMPÁS (ej. «P7», «P23»). */
  easKey: string;
  /** Código de variable en el codebook EAS 2023. */
  easVariable: string;
  /** Descripción breve del indicador. */
  topic: string;
  /** Unidad de medida. */
  unit: string;
  /** Referencia Andalucía, calculada desde microdatos EAS 2023. */
  refAndalucia: number;
  /** Referencia Granada-provincia, calculada desde microdatos EAS 2023. */
  refGranada: number;
  /** Procedencia del cálculo. */
  provenance: string;
  /** Cautela para el consumidor. */
  caution: string;
  /**
   * true si esta variable ya está cubierta por un fixture autonómico en
   * andalusiaReferenceContract.ts. Se incluye para completitud del catálogo;
   * el fixture prevalece para los indicadores de estudio que lo tienen.
   */
  coveredByFixture?: boolean;
}

export const EAS_2023_REFERENCES: EAS2023ReferenceEntry[] = [
  // ── Salud percibida ──────────────────────────────────────────────────────
  {
    easKey: "P7",
    easVariable: "P07_R2",
    topic: "Salud percibida buena o muy buena",
    unit: "%",
    refAndalucia: 78.8,
    refGranada: 76.5,
    provenance: EAS2023_PROVENANCE,
    caution: EAS2023_CAUTION,
  },
  {
    easKey: "P7b",
    easVariable: "P07B_R2_2023",
    topic: "Valoración positiva de la salud",
    unit: "%",
    refAndalucia: 92.0,
    refGranada: 89.1,
    provenance: EAS2023_PROVENANCE,
    caution: EAS2023_CAUTION,
  },
  // ── Limitación y restricción de actividad ───────────────────────────────
  {
    easKey: "P8a",
    easVariable: "P08_1_R",
    topic: "Limitación grave en actividad habitual",
    unit: "%",
    refAndalucia: 18.3,
    refGranada: 19.6,
    provenance: EAS2023_PROVENANCE,
    caution: EAS2023_CAUTION,
  },
  {
    easKey: "P8b",
    easVariable: "P08_2_R",
    topic: "Limitación moderada en actividad habitual",
    unit: "%",
    refAndalucia: 19.3,
    refGranada: 20.5,
    provenance: EAS2023_PROVENANCE,
    caution: EAS2023_CAUTION,
  },
  {
    easKey: "P9a",
    easVariable: "P0901",
    topic: "Restricción de actividad en las últimas 2 semanas",
    unit: "%",
    refAndalucia: 15.5,
    refGranada: 20.7,
    provenance: EAS2023_PROVENANCE,
    caution: EAS2023_CAUTION,
  },
  {
    easKey: "P9b",
    easVariable: "P0902",
    topic: "Días en casa por motivos de salud (últimas 2 semanas)",
    unit: "%",
    refAndalucia: 14.2,
    refGranada: 19.5,
    provenance: EAS2023_PROVENANCE,
    caution: EAS2023_CAUTION,
  },
  // ── Dependencia funcional ────────────────────────────────────────────────
  {
    easKey: "P10a",
    easVariable: "P1001",
    topic: "Necesita ayuda de otra persona para actividades cotidianas",
    unit: "%",
    refAndalucia: 9.2,
    refGranada: 10.7,
    provenance: EAS2023_PROVENANCE,
    caution: EAS2023_CAUTION,
  },
  {
    easKey: "P10b",
    easVariable: "P1002",
    topic: "Necesita ayuda no cubierta",
    unit: "%",
    refAndalucia: 8.4,
    refGranada: 10.2,
    provenance: EAS2023_PROVENANCE,
    caution: EAS2023_CAUTION,
  },
  // ── Dolor y malestar ────────────────────────────────────────────────────
  {
    easKey: "P11",
    easVariable: "P11_R2",
    topic: "Dolor o malestar importante",
    unit: "%",
    refAndalucia: 7.3,
    refGranada: 10.7,
    provenance: EAS2023_PROVENANCE,
    caution: EAS2023_CAUTION,
  },
  // ── Apoyo social ────────────────────────────────────────────────────────
  {
    easKey: "P12a",
    easVariable: "P1201",
    topic: "Tiene personas a quienes acudir en busca de ayuda",
    unit: "%",
    refAndalucia: 80.4,
    refGranada: 78.1,
    provenance: EAS2023_PROVENANCE,
    caution: EAS2023_CAUTION,
  },
  {
    easKey: "P12b",
    easVariable: "P1202",
    topic: "Tiene personas que le hacen sentir querido/a",
    unit: "%",
    refAndalucia: 76.1,
    refGranada: 73.4,
    provenance: EAS2023_PROVENANCE,
    caution: EAS2023_CAUTION,
  },
  {
    easKey: "P12c",
    easVariable: "P1203",
    topic: "Soledad (sin nadie de confianza)",
    unit: "%",
    refAndalucia: 10.0,
    refGranada: 10.0,
    provenance: EAS2023_PROVENANCE,
    caution: EAS2023_CAUTION,
  },
  // ── Exclusión social ────────────────────────────────────────────────────
  {
    easKey: "P13",
    easVariable: "P13_R",
    topic: "Riesgo de exclusión social",
    unit: "%",
    refAndalucia: 5.5,
    refGranada: 5.0,
    provenance: EAS2023_PROVENANCE,
    caution: EAS2023_CAUTION,
  },
  // ── Tabaco ──────────────────────────────────────────────────────────────
  {
    easKey: "P23",
    easVariable: "P23_1_R_2016_2023",
    topic: "Fumador/a habitual (tabaco)",
    unit: "%",
    refAndalucia: 23.9,
    refGranada: 25.0,
    provenance: EAS2023_PROVENANCE,
    caution: EAS2023_CAUTION,
  },
  {
    easKey: "P23_ex",
    easVariable: "P23 (valor 3)",
    topic: "Ex-fumador/a",
    unit: "%",
    refAndalucia: 15.6,
    refGranada: 18.5,
    provenance: EAS2023_PROVENANCE,
    caution: EAS2023_CAUTION,
  },
  // ── Cannabis ────────────────────────────────────────────────────────────
  {
    easKey: "P25d",
    easVariable: "P25D_R2_2023",
    topic: "Consumo de cannabis",
    unit: "%",
    refAndalucia: 2.6,
    refGranada: 2.6,
    provenance: EAS2023_PROVENANCE,
    caution: EAS2023_CAUTION,
  },
  // ── Infección respiratoria ──────────────────────────────────────────────
  {
    easKey: "P29",
    easVariable: "P29_R2_2023",
    topic: "Infección respiratoria en las últimas 2 semanas",
    unit: "%",
    refAndalucia: 9.6,
    refGranada: 10.2,
    provenance: EAS2023_PROVENANCE,
    caution: EAS2023_CAUTION,
  },
  // ── Alcohol ─ cubierto por fixture (cage-riesgo); incluido para completitud
  {
    easKey: "P32_CAGE",
    easVariable: "CAGE_R",
    topic: "Riesgo de alcoholismo (CAGE)",
    unit: "%",
    refAndalucia: 1.0,
    refGranada: 0.5,
    provenance: EAS2023_PROVENANCE,
    caution: EAS2023_CAUTION,
    coveredByFixture: true,
  },
  // ── Sueño ───────────────────────────────────────────────────────────────
  {
    easKey: "P33",
    easVariable: "P33_1_2023",
    topic: "Horas de sueño insuficientes entre semana",
    unit: "%",
    refAndalucia: 7.1,
    refGranada: 6.9,
    provenance: EAS2023_PROVENANCE,
    caution: EAS2023_CAUTION,
  },
  {
    easKey: "P33_fin",
    easVariable: "P33_2_2023",
    topic: "Horas de sueño insuficientes en fin de semana",
    unit: "%",
    refAndalucia: 7.3,
    refGranada: 7.2,
    provenance: EAS2023_PROVENANCE,
    caution: EAS2023_CAUTION,
  },
  {
    easKey: "P33a",
    easVariable: "P33_1_R",
    topic: "Duerme suficientes horas habitualmente",
    unit: "%",
    refAndalucia: 73.9,
    refGranada: 68.4,
    provenance: EAS2023_PROVENANCE,
    caution: EAS2023_CAUTION,
  },
  {
    easKey: "P33b_insomnio",
    easVariable: "ProblemasDormirP33b",
    topic: "Problemas para dormir",
    unit: "%",
    refAndalucia: 17.0,
    refGranada: 19.8,
    provenance: EAS2023_PROVENANCE,
    caution: EAS2023_CAUTION,
  },
  // ── Actividad física ────────────────────────────────────────────────────
  {
    easKey: "P34",
    easVariable: "P34_R",
    topic: "Actividad física suficiente",
    unit: "%",
    refAndalucia: 33.6,
    refGranada: 31.0,
    provenance: EAS2023_PROVENANCE,
    caution: EAS2023_CAUTION,
  },
  {
    easKey: "P34a_intenso",
    easVariable: "P34B04_R",
    topic: "Actividad física intensa regular",
    unit: "%",
    refAndalucia: 4.4,
    refGranada: 5.0,
    provenance: EAS2023_PROVENANCE,
    caution: EAS2023_CAUTION,
  },
  {
    easKey: "P34a_moderado",
    easVariable: "P34B03_R",
    topic: "Actividad física moderada regular",
    unit: "%",
    refAndalucia: 12.3,
    refGranada: 12.7,
    provenance: EAS2023_PROVENANCE,
    caution: EAS2023_CAUTION,
  },
  // Inactividad — cubierta por fixture (ipaq-inactividad); incluida para completitud
  {
    easKey: "P34a_nada",
    easVariable: "P34A_R",
    topic: "Inactividad en tiempo libre",
    unit: "%",
    refAndalucia: 36.4,
    refGranada: 34.0,
    provenance: EAS2023_PROVENANCE,
    caution: EAS2023_CAUTION,
    coveredByFixture: true,
  },
  // ── Alimentación ────────────────────────────────────────────────────────
  {
    easKey: "P36b1",
    easVariable: "P36BPD01_2023",
    topic: "Consumo diario de fruta y verdura",
    unit: "%",
    refAndalucia: 94.2,
    refGranada: 97.6,
    provenance: EAS2023_PROVENANCE,
    caution: EAS2023_CAUTION,
  },
  {
    easKey: "P36b_aceite",
    easVariable: "P36BPD02_2023",
    topic: "Uso habitual de aceite de oliva virgen",
    unit: "%",
    refAndalucia: 37.5,
    refGranada: 56.0,
    provenance: EAS2023_PROVENANCE,
    caution: EAS2023_CAUTION,
  },
  {
    easKey: "P36b_verdura",
    easVariable: "P36BPD03_2023",
    topic: "Verdura o ensalada ≥2 veces al día",
    unit: "%",
    refAndalucia: 24.2,
    refGranada: 41.5,
    provenance: EAS2023_PROVENANCE,
    caution: EAS2023_CAUTION,
  },
  {
    easKey: "P36b_fruta",
    easVariable: "P36BPD04_2023",
    topic: "Fruta ≥3 veces al día",
    unit: "%",
    refAndalucia: 21.9,
    refGranada: 42.5,
    provenance: EAS2023_PROVENANCE,
    caution: EAS2023_CAUTION,
  },
  {
    easKey: "P36b_carne",
    easVariable: "P36BPD05_2023",
    topic: "Carne ≥1 vez al día",
    unit: "%",
    refAndalucia: 30.0,
    refGranada: 17.8,
    provenance: EAS2023_PROVENANCE,
    caution: EAS2023_CAUTION,
  },
  {
    easKey: "P36b_azucar",
    easVariable: "P36BPD07_2023",
    topic: "Azúcar o dulces ≥1 vez al día",
    unit: "%",
    refAndalucia: 26.1,
    refGranada: 16.1,
    provenance: EAS2023_PROVENANCE,
    caution: EAS2023_CAUTION,
  },
  {
    easKey: "P36b_legumbres",
    easVariable: "P36BPD09_2023",
    topic: "Legumbres ≥3 veces por semana",
    unit: "%",
    refAndalucia: 27.6,
    refGranada: 37.7,
    provenance: EAS2023_PROVENANCE,
    caution: EAS2023_CAUTION,
  },
  {
    easKey: "P36b_pescado",
    easVariable: "P36BPD10_2023",
    topic: "Pescado ≥3 veces por semana",
    unit: "%",
    refAndalucia: 44.1,
    refGranada: 65.6,
    provenance: EAS2023_PROVENANCE,
    caution: EAS2023_CAUTION,
  },
  // Alta adherencia dieta mediterránea — cubierta por fixture (predimed-adherencia)
  {
    easKey: "PREDIMED",
    easVariable: "Predimed_R3",
    topic: "Alta adherencia a dieta mediterránea (PREDIMED)",
    unit: "%",
    refAndalucia: 18.3,
    refGranada: 40.0,
    provenance: EAS2023_PROVENANCE,
    caution: EAS2023_CAUTION,
    coveredByFixture: true,
  },
];

/** Búsqueda directa por clave del histórico. */
export function getEAS2023Reference(
  easKey: string
): EAS2023ReferenceEntry | undefined {
  return EAS_2023_REFERENCES.find((e) => e.easKey === easKey);
}

/**
 * Referencia de población EAS 2023 para un indicador NG donde la variable EAS
 * aporta contexto epidemiológico de población general.
 *
 * Solo se expone para indicadores sin referencia provincial metodológicamente
 * equivalente (provincial="ninguna" en INDICATOR_SPECS), de modo que la
 * prevalencia EAS 2023 es el mejor contexto disponible. Los instrumentos que
 * ya tienen fixture autonómico (DUKE, PREDIMED, SF-12, Sueño, CAGE, IPAQ) no
 * se duplican aquí.
 *
 * Nota: los instrumentos son distintos a las preguntas EAS; la referencia se
 * etiqueta como «contexto poblacional EAS 2023», nunca como referencia
 * metodológicamente equivalente al instrumento.
 */
export function getEAS2023ContextForIndicator(
  indicatorId: string
): EAS2023ReferenceEntry | undefined {
  switch (indicatorId) {
    case "fagerstrom-positivo":
      // Fagerström mide dependencia a nicotina; P23 mide prevalencia de
      // fumadores habituales en población general — instrumento distinto,
      // tema común (tabaco).
      return getEAS2023Reference("P23");
    case "psqi-positivo":
      // PSQI mide calidad subjetiva del sueño; P33b_insomnio mide problemas
      // para dormir en población general — instrumento distinto, tema común.
      return getEAS2023Reference("P33b_insomnio");
    case "auditc-positivo":
      // AUDIT-C cribado de uso de riesgo de alcohol; P32_CAGE mide riesgo
      // de alcoholismo en población general — instrumento distinto, tema común.
      return getEAS2023Reference("P32_CAGE");
    default:
      return undefined;
  }
}
