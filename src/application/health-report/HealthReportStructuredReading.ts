import type {
  HealthReportDocument,
  HealthReportFindingGeography,
  HealthReportInterpretationUse,
  HealthReportStructuredFinding,
  HealthReportStructuredReading,
  HealthReportStructuredSection,
  HealthReportStructuredTable,
  HealthReportTerritorialCorrespondence,
} from "../../domain/health-report";

interface SectionAnchor {
  title: string;
  start: RegExp;
  end?: RegExp;
}

interface TopicSpec {
  topic: string;
  heading: RegExp;
  population?: string;
  interpretationUse: HealthReportInterpretationUse[];
}

const STRUCTURED_SECTION_ANCHORS: SectionAnchor[] = [
  {
    title: "Enfermedades Crónicas",
    start: /4\.1\.1\.-\s*Enfermedades Cr[oó]nicas/i,
    end: /4\.1\.2\.-\s*Incidencia de C[aá]ncer/i,
  },
  {
    title: "Incidencia de Cáncer",
    start: /4\.1\.2\.-\s*Incidencia de C[aá]ncer/i,
    end: /4\.2\s+Atenci[oó]n a la salud a lo largo de la vida/i,
  },
  {
    title: "Cribados",
    start: /4\.2\.1-?\s*Diagn[oó]stico Precoz C[aá]ncer y Cribados/i,
    end: /4\.2\.2-?\s*Vacunaciones/i,
  },
  {
    title: "Estilos de Vida",
    start: /4\.2\.4-?\s*Estilos de Vida/i,
    end: /4\.3\s+An[aá]lisis de la mortalidad/i,
  },
  {
    title: "Mortalidad",
    start: /4\.3\s+An[aá]lisis de la mortalidad/i,
    end: /5\.\s*An[aá]lisis Encuesta Andaluza de Salud/i,
  },
];

const CHRONIC_TOPICS: TopicSpec[] = [
  {
    topic: "insuficiencia cardíaca",
    heading: /Insuficiencia Card[ií]aca/i,
    population: "personas mayores de 65 años",
    interpretationUse: ["chronicity", "ageing", "care-access"],
  },
  {
    topic: "hipertensión arterial",
    heading: /Hipertensi[oó]n Arterial/i,
    interpretationUse: ["chronicity", "care-access"],
  },
  {
    topic: "diabetes mellitus",
    heading: /Diabetes Mellitus/i,
    interpretationUse: ["chronicity", "health-behaviours"],
  },
  {
    topic: "EPOC",
    heading: /Enfermedad Pulmonar Obstructiva Cr[oó]nica|EPOC/i,
    population: "personas mayores de 40 años",
    interpretationUse: ["chronicity", "care-access"],
  },
  {
    topic: "demencias",
    heading: /Demencias/i,
    population: "personas mayores de 65 años",
    interpretationUse: ["chronicity", "ageing", "care-access"],
  },
  {
    topic: "atención al paciente pluripatológico",
    heading: /Atenci[oó]n al Paciente Pluripatol[oó]gico/i,
    population: "personas mayores de 65 años",
    interpretationUse: ["chronicity", "ageing", "care-access"],
  },
  {
    topic: "asma infantil",
    heading: /Asma Infantil/i,
    population: "personas menores de 14 años",
    interpretationUse: ["chronicity", "care-access"],
  },
];

function emptyReading(): HealthReportStructuredReading {
  return {
    present: false,
    charCount: 0,
    originalTextAvailable: false,
    sections: [],
    tables: [],
    findings: [],
    territorialCorrespondences: [],
    limitations: [],
    extractionNotes: [],
  };
}

function compact(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function normalize(value: string): string {
  return compact(
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
  );
}

function decodeHtml(value: string): string {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;/g, "'");
}

function htmlCellText(value: string): string {
  return compact(decodeHtml(value.replace(/<[^>]+>/g, " ")));
}

function slug(value: string): string {
  return normalize(value).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function clip(value: string, max = 420): string {
  const clean = compact(value);
  return clean.length <= max ? clean : `${clean.slice(0, max - 1).trim()}…`;
}

function firstNumber(value: string | undefined): number | undefined {
  if (value === undefined) return undefined;
  const match = value.replace(/\./g, "").replace(",", ".").match(/-?\d+(?:\.\d+)?/);
  return match === null ? undefined : Number(match[0]);
}

function firstPercent(value: string | undefined): number | undefined {
  if (value === undefined) return undefined;
  const match = value.replace(/\./g, "").replace(",", ".").match(/-?\d+(?:\.\d+)?\s*%/);
  return match === null ? undefined : Number(match[0].replace("%", "").trim());
}

function sectionHtml(report: HealthReportDocument): string {
  const parts = [
    report.body.originalHtml ?? "",
    ...report.sections.map((section) => section.bodyHtml ?? ""),
  ].filter((part) => part.length > 0);
  return parts.join("\n");
}

function findLineIndex(lines: string[], re: RegExp, from = 0): number {
  for (let i = from; i < lines.length; i++) {
    if (re.test(lines[i])) return i;
  }
  return -1;
}

function buildStructuredSections(report: HealthReportDocument): HealthReportStructuredSection[] {
  const rawLines = report.body.originalText.split(/\r?\n/);
  const trimmed = rawLines.map((line) => line.trim());
  const sections: HealthReportStructuredSection[] = [];

  for (const anchor of STRUCTURED_SECTION_ANCHORS) {
    const start = findLineIndex(trimmed, anchor.start);
    if (start === -1) continue;
    const end = anchor.end !== undefined
      ? findLineIndex(trimmed, anchor.end, start + 1)
      : -1;
    const bodyText = rawLines.slice(start, end === -1 ? rawLines.length : end).join("\n").trim();
    if (bodyText.length === 0) continue;
    sections.push({
      title: anchor.title,
      bodyText,
      source: {
        documentId: report.linkedDocumentId,
        startAnchor: anchor.start.source,
        endAnchor: anchor.end?.source,
      },
      reconstructionStatus: "from-text-anchors",
    });
  }

  if (sections.length > 0) return sections;

  return report.sections
    .filter((section) => compact(section.bodyText).length > compact(section.title).length + 40)
    .map((section) => ({
      title: section.title,
      bodyText: section.bodyText,
      source: { documentId: report.linkedDocumentId },
      reconstructionStatus: "from-parser" as const,
    }));
}

function parseHtmlTables(report: HealthReportDocument): string[][][] {
  const html = sectionHtml(report);
  if (html.length === 0) return [];
  return [...html.matchAll(/<table[\s\S]*?<\/table>/gi)]
    .map((tableMatch) =>
      [...tableMatch[0].matchAll(/<tr[\s\S]*?<\/tr>/gi)]
        .map((rowMatch) =>
          [...rowMatch[0].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)]
            .map((cellMatch) => htmlCellText(cellMatch[1]))
            .filter((cell) => cell.length > 0)
        )
        .filter((row) => row.length > 0)
    )
    .filter((rows) => rows.length > 0);
}

function tableReference(rows: string[][], index: number): string {
  const header = rows[0]?.join(" / ") ?? `Tabla ${index}`;
  return `Tabla ${index}: ${clip(header, 180)}`;
}

function recognizedTopic(rows: string[][]): string | undefined {
  const header = normalize(rows[0]?.join(" ") ?? "");
  if (header.includes("poblacion invitada participar")) return "cribado colorrectal: participación";
  if (header.includes("adenomas") && header.includes("cancer invasivo")) return "cribado colorrectal: diagnósticos";
  if (header.includes("tasa captacion") && header.includes("tasa deteccion")) return "cribado cáncer de mama";
  if (header.includes("mujeres estudiadas") && header.includes("poblacion diana")) return "cribado cáncer de cérvix";
  if (header.includes("hombres estudiados") && header.includes("total hombres")) return "proceso cáncer de próstata/HBP";
  if (header.includes("tipo cancer") && header.includes("tasas brutas")) return "incidencia de cáncer: tasas brutas";
  if (header.includes("tipo cancer") && header.includes("tasas estandarizadas")) return "incidencia de cáncer: tasas estandarizadas";
  if (header.includes("enfermedades de declaracion obligatoria")) return "enfermedades de declaración obligatoria";
  // Incremento 4 — tablas de las cinco prioridades.
  if (header.includes("municipios") && header.includes("tasa envejecimiento")) return "demografía: tasa de envejecimiento por municipio";
  if (header.includes("municipios") && header.includes("indice dependencia")) return "demografía: índice de dependencia por municipio";
  if (header.includes("municipios") && header.includes("edad media")) return "demografía: edad media por municipio";
  if (header.includes("indicador") && header.includes("granada") && header.length < 40) return "desigualdad material: indicadores municipales";
  if (header.includes("tipo de brote") || header.includes("alerta sanitaria")) return "brotes y alertas sanitarias";
  if (header.includes("centro salud referencia") && header.includes("distrito censal")) return "correspondencia territorial: centro de salud–distrito–barriada";
  return undefined;
}

function buildStructuredTables(report: HealthReportDocument): HealthReportStructuredTable[] {
  return parseHtmlTables(report).map((rows, idx) => ({
    index: idx + 1,
    tableReference: tableReference(rows, idx + 1),
    rows,
    source: { documentId: report.linkedDocumentId },
    recognizedTopic: recognizedTopic(rows),
  }));
}

function geographyFromLabel(label: string): HealthReportFindingGeography {
  const n = normalize(label);
  if (/^d\.?\s*zaidin|distrito zaidin|zaidin vergeles/.test(n)) {
    return { level: "district", label, isProxyForTargetTerritory: false };
  }
  if (/u\.?\s*a\.?\s*zaidin|ua zaidin|zaidin centro|zaidin sur/.test(n)) {
    return { level: "health-care-unit", label, isProxyForTargetTerritory: true };
  }
  if (/distrito sanitario granada metropolitano|distrito granada metropolitano|ds granada/.test(n)) {
    return { level: "health-district", label, isProxyForTargetTerritory: true };
  }
  if (/andalucia/.test(n)) {
    return { level: "autonomous-community", label, isProxyForTargetTerritory: true };
  }
  if (/provincia/.test(n)) {
    return { level: "province", label, isProxyForTargetTerritory: true };
  }
  if (/granada/.test(n)) {
    return { level: "municipality", label, isProxyForTargetTerritory: true };
  }
  return { level: "unknown", label, isProxyForTargetTerritory: true };
}

function periodFromText(value: string): string | undefined {
  const range = value.match(/\b(20\d{2})\s*[-/]\s*(20\d{2})\b/);
  if (range !== null) return `${range[1]}-${range[2]}`;
  const year = value.match(/\b(20\d{2})\b/);
  return year?.[1];
}

function populationFromReference(value: string): string | undefined {
  if (/mayores de 65/i.test(value)) return "personas mayores de 65 años";
  if (/mayores de 40/i.test(value)) return "personas mayores de 40 años";
  if (/menores de 14/i.test(value)) return "personas menores de 14 años";
  if (/50-70|50 y 70/i.test(value)) return "hombres de 50 a 70 años";
  if (/50-69|50 y 69/i.test(value)) return "mujeres de 50 a 69 años";
  if (/25-64|25 y 64|25 y 65/i.test(value)) return "mujeres de 25 a 64/65 años";
  return undefined;
}

function comparativeValue(statement: string): string {
  const matches: string[] = [];
  if (/superior|mayor prevalencia|m[aá]s alta/i.test(statement)) matches.push("superior/mayor");
  if (/inferior|m[aá]s baja/i.test(statement)) matches.push("inferior/menor");
  if (/similar/i.test(statement)) matches.push("similar");
  if (/destaca|destacando/i.test(statement)) matches.push("destaca");
  return matches.length > 0 ? [...new Set(matches)].join("; ") : "comparación cualitativa del Informe";
}

function addFinding(
  findings: HealthReportStructuredFinding[],
  finding: Omit<HealthReportStructuredFinding, "id">
): void {
  findings.push({
    ...finding,
    id: `health-report-${findings.length + 1}-${slug(finding.topic)}-${slug(finding.geography.label)}`,
  });
}

function tableByTopic(
  tables: HealthReportStructuredTable[],
  topic: string
): HealthReportStructuredTable | undefined {
  return tables.find((table) => table.recognizedTopic === topic);
}

function addScreeningFindings(
  report: HealthReportDocument,
  findings: HealthReportStructuredFinding[],
  tables: HealthReportStructuredTable[],
): void {
  const colorectal = tableByTopic(tables, "cribado colorrectal: participación");
  if (colorectal !== undefined) {
    for (const row of colorectal.rows.slice(1)) {
      const geography = row[0];
      const invited = firstNumber(row[1]);
      const accepted = firstNumber(row[2]);
      const acceptance = firstPercent(row[2]);
      const validTests = firstNumber(row[3]);
      const positives = firstNumber(row[4]);
      const positivity = firstPercent(row[5]);
      if (acceptance !== undefined) {
        addFinding(findings, {
          kind: "screening",
          topic: "cribado colorrectal: participación",
          statement: `${geography}: participa el ${acceptance}% de la población invitada al cribado colorrectal.`,
          value: acceptance,
          unit: "% aceptación",
          numerator: accepted,
          denominator: invited,
          population: "población invitada al cribado colorrectal",
          geography: geographyFromLabel(geography),
          source: {
            documentId: report.linkedDocumentId,
            sectionTitle: "Cribados",
            tableReference: colorectal.tableReference,
            textExcerpt: row.join(" | "),
          },
          limitations: [],
          interpretationStatus: "documented-fact",
          interpretationUse: ["prevention", "care-access"],
        });
      }
      if (positivity !== undefined) {
        addFinding(findings, {
          kind: "screening",
          topic: "cribado colorrectal: positividad",
          statement: `${geography}: positividad del ${positivity}% en test de sangre oculta en heces.`,
          value: positivity,
          unit: "% positividad",
          numerator: positives,
          denominator: validTests,
          population: "test de sangre en heces válidos",
          geography: geographyFromLabel(geography),
          source: {
            documentId: report.linkedDocumentId,
            sectionTitle: "Cribados",
            tableReference: colorectal.tableReference,
            textExcerpt: row.join(" | "),
          },
          limitations: [],
          interpretationStatus: "documented-fact",
          interpretationUse: ["prevention", "care-access"],
        });
      }
    }
  }

  const colorectalDiagnosis = tableByTopic(tables, "cribado colorrectal: diagnósticos");
  if (colorectalDiagnosis !== undefined) {
    for (const row of colorectalDiagnosis.rows.slice(1)) {
      const geography = row[0];
      const percent = firstPercent(row[row.length - 1]);
      if (percent === undefined) continue;
      addFinding(findings, {
        kind: "screening",
        topic: "cribado colorrectal: diagnósticos",
        statement: `${geography}: diagnósticos en el ${percent}% de pruebas válidas con hallazgo.`,
        value: percent,
        unit: "% diagnósticos",
        geography: geographyFromLabel(geography),
        source: {
          documentId: report.linkedDocumentId,
          sectionTitle: "Cribados",
          tableReference: colorectalDiagnosis.tableReference,
          textExcerpt: row.join(" | "),
        },
        limitations: [],
        interpretationStatus: "documented-fact",
        interpretationUse: ["prevention", "care-access"],
      });
    }
  }

  const breast = tableByTopic(tables, "cribado cáncer de mama");
  if (breast !== undefined) {
    for (const row of breast.rows.slice(1)) {
      const geography = row[0];
      const capture = firstPercent(row[1]);
      const tumors = firstNumber(row[2]);
      const detection = firstNumber(row[3]);
      if (capture === undefined) continue;
      addFinding(findings, {
        kind: "screening",
        topic: "cribado de cáncer de mama",
        statement: `${geography}: tasa de captación del ${capture}% y detección ${row[3] ?? "no disponible"}‰.`,
        value: capture,
        unit: "% captación",
        numerator: tumors,
        population: "mujeres de 50 a 69 años",
        geography: geographyFromLabel(geography),
        period: "2022",
        source: {
          documentId: report.linkedDocumentId,
          sectionTitle: "Cribados",
          tableReference: breast.tableReference,
          textExcerpt: row.join(" | "),
        },
        limitations: detection === undefined ? ["La tasa de detección no pudo convertirse a número."] : [],
        interpretationStatus: "documented-fact",
        interpretationUse: ["prevention", "care-access"],
      });
    }
  }

  const cervix = tableByTopic(tables, "cribado cáncer de cérvix");
  if (cervix !== undefined) {
    for (const row of cervix.rows.slice(1)) {
      const geography = row[0];
      const studied = firstNumber(row[1]);
      const target = firstNumber(row[2]);
      const percent = firstPercent(row[3]);
      if (percent === undefined) continue;
      addFinding(findings, {
        kind: "screening",
        topic: "cribado de cáncer de cérvix",
        statement: `${geography}: ${percent}% de mujeres estudiadas sobre población diana.`,
        value: percent,
        unit: "% mujeres estudiadas",
        numerator: studied,
        denominator: target,
        population: "mujeres de 25 a 64 años",
        geography: geographyFromLabel(geography),
        source: {
          documentId: report.linkedDocumentId,
          sectionTitle: "Cribados",
          tableReference: cervix.tableReference,
          textExcerpt: row.join(" | "),
        },
        limitations: [],
        interpretationStatus: "documented-fact",
        interpretationUse: ["prevention", "care-access"],
      });
    }
  }

  const prostate = tableByTopic(tables, "proceso cáncer de próstata/HBP");
  if (prostate !== undefined) {
    for (const row of prostate.rows.slice(1)) {
      const geography = row[0];
      const studied = firstNumber(row[1]);
      const target = firstNumber(row[2]);
      const percent = firstPercent(row[3]);
      if (percent === undefined) continue;
      addFinding(findings, {
        kind: "screening",
        topic: "proceso cáncer de próstata/HBP",
        statement: `${geography}: ${percent}% de hombres estudiados sobre población diana.`,
        value: percent,
        unit: "% hombres estudiados",
        numerator: studied,
        denominator: target,
        population: "hombres de 50 a 70 años",
        geography: geographyFromLabel(geography),
        source: {
          documentId: report.linkedDocumentId,
          sectionTitle: "Cribados",
          tableReference: prostate.tableReference,
          textExcerpt: row.join(" | "),
        },
        limitations: ["El Informe describe este proceso asistencial; no lo presenta como cribado poblacional universal."],
        interpretationStatus: "documented-fact",
        interpretationUse: ["prevention", "care-access"],
      });
    }
  }
}

function lineBlock(section: HealthReportStructuredSection | undefined): string[] {
  return section?.bodyText.split(/\r?\n/).map((line) => compact(line)).filter(Boolean) ?? [];
}

function extractTopicStatement(
  lines: string[],
  heading: RegExp
): { statement: string; tableReference?: string } | undefined {
  const start = findLineIndex(lines, heading);
  if (start === -1) return undefined;
  const parts: string[] = [];
  let tableReference: string | undefined;
  for (let i = start; i < Math.min(lines.length, start + 7); i++) {
    const line = lines[i];
    if (/^Fuente:/i.test(line)) {
      const table = line.match(/Tabla:\s*(.+)$/i);
      tableReference = table !== null ? `Tabla: ${compact(table[1])}` : line;
      break;
    }
    parts.push(line.replace(/^-\s*/, ""));
  }
  const statement = compact(parts.join(" "));
  return statement.length > 0 ? { statement, tableReference } : undefined;
}

function addChronicFindings(
  report: HealthReportDocument,
  findings: HealthReportStructuredFinding[],
  sections: HealthReportStructuredSection[]
): void {
  const chronicSection = sections.find((section) => section.title === "Enfermedades Crónicas");
  const lines = lineBlock(chronicSection);
  for (const spec of CHRONIC_TOPICS) {
    const extracted = extractTopicStatement(lines, spec.heading);
    if (extracted === undefined) continue;
    addFinding(findings, {
      kind: "clinical-indicator",
      topic: spec.topic,
      statement: extracted.statement,
      value: comparativeValue(extracted.statement),
      unit: "comparación cualitativa del Informe",
      population: spec.population ?? populationFromReference(extracted.tableReference ?? extracted.statement),
      geography: geographyFromLabel("UA Zaidín Centro y UA Zaidín Sur"),
      period: periodFromText(extracted.statement + " " + (extracted.tableReference ?? "")),
      source: {
        documentId: report.linkedDocumentId,
        sectionTitle: chronicSection?.title,
        tableReference: extracted.tableReference,
        textExcerpt: clip(extracted.statement),
      },
      limitations: [
        "El texto persistido conserva la interpretación explícita del Informe, pero no la fila numérica de la tabla o gráfico original para este indicador.",
      ],
      interpretationStatus: "document-authored-interpretation",
      interpretationUse: spec.interpretationUse,
    });
  }
}

function addCancerFindings(
  report: HealthReportDocument,
  findings: HealthReportStructuredFinding[],
  tables: HealthReportStructuredTable[],
  declaredLimitations: string[]
): void {
  const bruto = tableByTopic(tables, "incidencia de cáncer: tasas brutas");
  if (bruto !== undefined) {
    for (const row of bruto.rows.slice(1)) {
      const topic = row[0];
      // Incremento 4 (P5): se estructuran también las filas de cáncer antes
      // omitidas, siempre que tengan tipo identificable y tasa bruta clara.
      if (topic === undefined || /^\s*$/.test(topic) || /TIPO C[ÁA]NCER/i.test(topic)) continue;
      const rate = firstNumber(row[row.length - 1]);
      if (rate === undefined) continue;
      addFinding(findings, {
        kind: "clinical-indicator",
        topic: `incidencia de cáncer: ${topic}`,
        statement: `Granada municipio: tasa bruta media anual ${row[row.length - 1]} por 100.000 habitantes.`,
        value: rate,
        unit: "tasa bruta por 100.000 habitantes",
        geography: geographyFromLabel("Granada municipio"),
        period: "2013-2017",
        source: {
          documentId: report.linkedDocumentId,
          sectionTitle: "Incidencia de Cáncer",
          tableReference: bruto.tableReference,
          textExcerpt: row.join(" | "),
        },
        limitations: declaredLimitations,
        interpretationStatus: "documented-fact",
        interpretationUse: ["sanitary-thread", "inequalities", "future-human-hypothesis"],
      });
    }
  }

  const estandar = tableByTopic(tables, "incidencia de cáncer: tasas estandarizadas");
  const total = estandar?.rows.find((row) => /Total todos/i.test(row[0] ?? ""));
  if (estandar !== undefined && total !== undefined) {
    const granada = firstNumber(total[1]);
    const provincia = firstNumber(total[2]);
    if (granada !== undefined && provincia !== undefined) {
      addFinding(findings, {
        kind: "territorial-comparison",
        topic: "incidencia de cáncer: comparación Granada-Provincia",
        statement: `La tasa estandarizada total de cáncer en Granada municipio (${total[1]}) supera la referencia provincial (${total[2]}).`,
        value: `${total[1]} vs ${total[2]}`,
        unit: "tasa estandarizada por 100.000 habitantes",
        geography: geographyFromLabel("Granada municipio"),
        period: "2013-2017",
        source: {
          documentId: report.linkedDocumentId,
          sectionTitle: "Incidencia de Cáncer",
          tableReference: estandar.tableReference,
          textExcerpt: total.join(" | "),
        },
        limitations: declaredLimitations,
        interpretationStatus: "documented-fact",
        interpretationUse: ["sanitary-thread", "inequalities", "future-human-hypothesis"],
      });
    }
  }
}

function addInterventionValue(
  report: HealthReportDocument,
  findings: HealthReportStructuredFinding[],
  params: {
    topic: string;
    statement: string;
    geographyLabel: string;
    value: number;
    population?: string;
  }
): void {
  addFinding(findings, {
    kind: "health-behaviour-intervention",
    topic: params.topic,
    statement: `${params.geographyLabel}: ${params.value}% (${params.topic}).`,
    value: params.value,
    unit: "% intervención registrada",
    population: params.population,
    geography: geographyFromLabel(params.geographyLabel),
    period: periodFromText(params.statement),
    source: {
      documentId: report.linkedDocumentId,
      sectionTitle: "Estilos de Vida",
      textExcerpt: clip(params.statement),
    },
    limitations: [
      "Actividad o respuesta sanitaria documentada; no equivale a activo comunitario ni a recomendación del Perfil.",
    ],
    interpretationStatus: "documented-fact",
    interpretationUse: ["health-behaviours", "prevention", "care-access"],
  });
}

function addLifestyleInterventionFindings(
  report: HealthReportDocument,
  findings: HealthReportStructuredFinding[],
  sections: HealthReportStructuredSection[]
): void {
  const section = sections.find((s) => s.title === "Estilos de Vida");
  const text = compact(section?.bodyText ?? "");
  const patterns: Array<{
    topic: string;
    population?: string;
    re: RegExp;
  }> = [
    {
      topic: "intervención avanzada en obesidad infantil",
      population: "menores de 6 a 14 años",
      re: /IAOI[\s\S]{0,500}?UA Zaid[ií]n Centro el resultado fue del\s*([\d,]+)%[\s\S]{0,100}?UA Zaid[ií]n Sur del\s*([\d,]+)%[\s\S]{0,140}?Distrito Sanitario Granada Metropolitano fue del\s*([\d,]+)%/i,
    },
    {
      topic: "consejo dietético individual en adultos",
      population: "personas adultas",
      re: /Consejo Diet[eé]tico Individual en adultos[\s\S]{0,500}?UA Zaid[ií]n Centro el resultado fue del\s*([\d,]+)%[\s\S]{0,100}?UA Zaid[ií]n Sur del\s*([\d,]+)%[\s\S]{0,140}?Distrito Sanitario Granada Metropolitano fue del\s*([\d,]+)%/i,
    },
    {
      topic: "intervención avanzada individual para dejar el tabaco",
      population: "personas fumadoras adultas",
      re: /Intervenci[oó]n Avanzada Individual para dejar el tabaco[\s\S]{0,700}?UA Zaid[ií]n Centro el resultado fue del\s*([\d,]+)%[\s\S]{0,100}?UA Zaid[ií]n Sur del\s*([\d,]+)%[\s\S]{0,140}?Distrito Sanitario Granada Metropolitano fue del\s*([\d,]+)%/i,
    },
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern.re);
    if (match === null) continue;
    const statement = clip(match[0], 700);
    const values = [firstNumber(match[1]), firstNumber(match[2]), firstNumber(match[3])];
    const geographies = [
      "UA Zaidín Centro",
      "UA Zaidín Sur",
      "Distrito Sanitario Granada Metropolitano",
    ];
    for (let i = 0; i < geographies.length; i++) {
      const value = values[i];
      if (value === undefined) continue;
      addInterventionValue(report, findings, {
        topic: pattern.topic,
        statement,
        geographyLabel: geographies[i],
        value,
        population: pattern.population,
      });
    }
  }
}

function addMortalityFindings(
  report: HealthReportDocument,
  findings: HealthReportStructuredFinding[],
  sections: HealthReportStructuredSection[],
  declaredLimitations: string[],
): void {
  const section = sections.find((s) => s.title === "Mortalidad");
  const lines = lineBlock(section);
  const general = lines.find((line) => /Tasa Bruta de Mortalidad/i.test(line));
  const sourceGeography = (text: string): HealthReportFindingGeography => {
    const municipality = text.match(/municipio de ([\p{L} '-]+?)(?=,|\.|\s+en\s+\d|\s+presenta|\s+registra|\s+fallecieron|$)/iu)?.[1];
    return municipality !== undefined
      ? { level: "municipality", label: municipality.trim(), isProxyForTargetTerritory: true }
      : { level: "unknown", label: "Ámbito no identificado en el fragmento", isProxyForTargetTerritory: true };
  };
  const cautions = [...declaredLimitations,
    "La tasa bruta no está ajustada por edad; no acredita por sí sola un exceso significativo de riesgo.",
    "Los recuentos pequeños requieren evaluar la incertidumbre antes de comparar territorios o periodos.",
  ];
  if (general !== undefined) {
    const deaths = firstNumber(general.match(/fallecieron[^0-9]*(\d[\d.]*)/i)?.[1]);
    const rate = firstNumber(general.match(/Tasa Bruta de Mortalidad de\s*([\d,]+)‰/i)?.[1]);
    const andalusia = firstNumber(general.match(/Andaluc[ií]a\s*([\d,]+)‰/i)?.[1]);
    if (rate !== undefined) {
      addFinding(findings, {
        kind: "mortality",
        topic: "mortalidad general",
        statement: general,
        value: rate,
        unit: "‰ tasa bruta de mortalidad",
        numerator: deaths,
        geography: sourceGeography(general),
        period: periodFromText(general),
        source: {
          documentId: report.linkedDocumentId,
          sectionTitle: section?.title,
          textExcerpt: clip(general),
        },
        limitations: cautions,
        interpretationStatus: "documented-fact",
        interpretationUse: ["sanitary-thread", "inequalities", "future-human-hypothesis"],
      });
    }
    if (andalusia !== undefined) {
      addFinding(findings, {
        kind: "territorial-comparison",
        topic: "mortalidad general: comparación Andalucía",
        statement: general,
        value: andalusia,
        unit: "‰ tasa bruta de mortalidad",
        geography: geographyFromLabel("Andalucía"),
        period: periodFromText(general),
        source: {
          documentId: report.linkedDocumentId,
          sectionTitle: section?.title,
          textExcerpt: clip(general),
        },
        limitations: cautions,
        interpretationStatus: "documented-fact",
        interpretationUse: ["sanitary-thread", "inequalities", "future-human-hypothesis"],
      });
    }
  }

  const causes = lines.find((line) => /principales causas de defunci[oó]n/i.test(line));
  if (causes !== undefined) {
    addFinding(findings, {
      kind: "mortality",
      topic: "mortalidad específica: principales causas",
      statement: causes,
      value: causes,
      unit: "descripción literal del Informe",
      geography: sourceGeography(causes),
      period: periodFromText(causes),
      source: {
        documentId: report.linkedDocumentId,
        sectionTitle: section?.title,
        textExcerpt: clip(causes),
      },
      limitations: cautions,
      interpretationStatus: "document-authored-interpretation",
      interpretationUse: ["sanitary-thread", "inequalities", "future-human-hypothesis"],
    });
  }
}

function extractDeclaredLimitations(text: string): string[] {
  const paragraphs = text.split(/\n+/).map(compact).filter(Boolean);
  const limitations = paragraphs.filter((paragraph) =>
    /no (hay|existen) estad[ií]sticas oficiales .*barrios? o Unidades Asistenciales/i.test(paragraph)
  );
  return [...new Set(limitations.map((limitation) => clip(limitation)))];
}

function addLimitationFindings(
  report: HealthReportDocument,
  findings: HealthReportStructuredFinding[],
  limitations: string[],
): void {
  for (const limitation of limitations) {
    addFinding(findings, {
      kind: "declared-limitation",
      topic: "limitación de escala declarada por el Informe",
      statement: limitation,
      geography: geographyFromLabel("Granada municipio"),
      source: {
        documentId: report.linkedDocumentId,
        textExcerpt: limitation,
      },
      limitations: [limitation],
      interpretationStatus: "document-authored-interpretation",
      interpretationUse: ["inequalities", "future-human-hypothesis"],
    });
  }
}

// ── Incremento 4 — Prioridad 1: envejecimiento y estructura demográfica ───────
// Datos por municipio (provincia de Granada): se extrae SOLO la fila de Granada
// como contexto/proxy del distrito, nunca como estimación distrital.

function granadaMunicipioRow(
  table: HealthReportStructuredTable | undefined
): string[] | undefined {
  // «Granada (capital)» es el municipio que contiene el distrito Zaidín; NO
  // confundir con «Provincia Granada» ni «DS Granada-Metrop.» (otras escalas).
  return table?.rows
    .slice(1)
    .find((r) => {
      const n = normalize(r[0] ?? "");
      return n.includes("granada") && n.includes("capital");
    });
}

function addDemographicFindings(
  report: HealthReportDocument,
  findings: HealthReportStructuredFinding[],
  tables: HealthReportStructuredTable[]
): void {
  const specs: Array<{ topic: string; parserTopic: string; unit: string }> = [
    {
      topic: "tasa de envejecimiento",
      parserTopic: "demografía: tasa de envejecimiento por municipio",
      unit: "% (tasa de envejecimiento)",
    },
    {
      topic: "índice de dependencia",
      parserTopic: "demografía: índice de dependencia por municipio",
      unit: "índice de dependencia",
    },
    {
      topic: "edad media de la población",
      parserTopic: "demografía: edad media por municipio",
      unit: "años (edad media)",
    },
  ];
  for (const spec of specs) {
    const table = tableByTopic(tables, spec.parserTopic);
    const row = granadaMunicipioRow(table);
    const value = firstNumber(row?.[1]);
    if (table === undefined || row === undefined || value === undefined) continue;
    addFinding(findings, {
      kind: "demographic-indicator",
      topic: `demografía: ${spec.topic}`,
      statement: `Granada municipio: ${row[1]} (${spec.topic}); dato municipal usado como contexto del distrito.`,
      value,
      unit: spec.unit,
      geography: geographyFromLabel("Granada municipio"),
      source: {
        documentId: report.linkedDocumentId,
        sectionTitle: "Contexto sociodemográfico",
        tableReference: table.tableReference,
        textExcerpt: row.join(" | "),
      },
      limitations: [
        "Dato de escala municipal (Granada), contexto/proxy del distrito: no es estimación distrital ni causa sanitaria demostrada.",
      ],
      interpretationStatus: "documented-fact",
      interpretationUse: ["demography"],
    });
  }
}

// ── Prioridad 2: desigualdad material y estructura sociodemográfica ────────────

function addMaterialInequalityFindings(
  report: HealthReportDocument,
  findings: HealthReportStructuredFinding[],
  tables: HealthReportStructuredTable[]
): void {
  const table = tableByTopic(tables, "desigualdad material: indicadores municipales");
  if (table === undefined) return;
  for (const row of table.rows.slice(1)) {
    const label = normalize(row[0] ?? "");
    const value = firstNumber(row[1]);
    if (value === undefined) continue;
    let topic: string | undefined;
    let unit = "recuento absoluto (personas)";
    if (label.includes("parado")) {
      topic = `desigualdad material: ${row[0]}`;
    } else if (label.includes("bienestar")) {
      topic = "desigualdad material: índice sintético de bienestar";
      unit = "índice sintético";
    }
    if (topic === undefined) continue;
    addFinding(findings, {
      kind: "material-inequality-indicator",
      topic,
      statement: `Granada municipio: ${row[1]} (${row[0]}); recuento/índice municipal, no tasa ni estimación distrital.`,
      value,
      unit,
      geography: geographyFromLabel("Granada municipio"),
      source: {
        documentId: report.linkedDocumentId,
        sectionTitle: "Contexto sociodemográfico",
        tableReference: table.tableReference,
        textExcerpt: row.join(" | "),
      },
      limitations: [
        "Recuento o índice de escala municipal (Granada): no es una tasa, ni una estimación del distrito, ni una desigualdad medida por barrios.",
      ],
      interpretationStatus: "documented-fact",
      interpretationUse: ["material-inequality"],
    });
  }
}

// ── Prioridad 4: EDO, alertas y brotes (recuentos absolutos, nunca tasas) ──────

function addEpidemiologicalEventFindings(
  report: HealthReportDocument,
  findings: HealthReportStructuredFinding[],
  tables: HealthReportStructuredTable[]
): void {
  const edo = tableByTopic(tables, "enfermedades de declaración obligatoria");
  if (edo !== undefined) {
    const header = edo.rows[0] ?? [];
    const colIdx = header.findIndex((c) =>
      /zaidin vergeles|d\.?\s*zaidin/.test(normalize(c))
    );
    if (colIdx > 0) {
      for (const row of edo.rows.slice(1)) {
        const disease = row[0];
        const count = firstNumber(row[colIdx]);
        if (disease === undefined || count === undefined || count <= 0) continue;
        addFinding(findings, {
          kind: "epidemiological-event",
          topic: `EDO: ${disease}`,
          statement: `Distrito Zaidín-Vergeles: ${count} caso(s) declarado(s) acumulados 2018-2022 (${disease}).`,
          value: count,
          unit: "casos declarados (recuento absoluto)",
          geography: geographyFromLabel("Distrito Zaidín Vergeles"),
          period: "2018-2022",
          source: {
            documentId: report.linkedDocumentId,
            sectionTitle: "Enfermedades de Declaración Obligatoria",
            tableReference: edo.tableReference,
            textExcerpt: row.join(" | "),
          },
          limitations: [
            "Recuento absoluto de casos EDO acumulados; sin denominador poblacional ni tasa: no comparable como frecuencia ni prevalencia.",
          ],
          interpretationStatus: "documented-fact",
          interpretationUse: ["surveillance"],
        });
      }
    }
  }

  const brotes = tableByTopic(tables, "brotes y alertas sanitarias");
  if (brotes !== undefined) {
    const header = brotes.rows[0] ?? [];
    const totalIdx = header.findIndex((c) => /total/.test(normalize(c)));
    for (const row of brotes.rows.slice(1)) {
      const tipo = row[0];
      const total = firstNumber(totalIdx > 0 ? row[totalIdx] : row[row.length - 1]);
      if (tipo === undefined || total === undefined || total <= 0) continue;
      addFinding(findings, {
        kind: "epidemiological-event",
        topic: `brote/alerta: ${tipo}`,
        statement: `${total} evento(s) registrado(s) 2018-2022 (${tipo}).`,
        value: total,
        unit: "eventos (recuento absoluto 2018-2022)",
        geography: geographyFromLabel("Distrito Zaidín Vergeles"),
        period: "2018-2022",
        source: {
          documentId: report.linkedDocumentId,
          sectionTitle: "Brotes y Alertas Sanitarias",
          tableReference: brotes.tableReference,
          textExcerpt: row.join(" | "),
        },
        limitations: [
          "Recuento absoluto de eventos; sin denominador ni tasa: describe presencia, no incidencia poblacional.",
        ],
        interpretationStatus: "documented-fact",
        interpretationUse: ["surveillance"],
      });
    }
  }
}

// ── Prioridad 3: correspondencia territorial explícita ────────────────────────

function buildTerritorialCorrespondences(
  report: HealthReportDocument,
  tables: HealthReportStructuredTable[]
): HealthReportTerritorialCorrespondence[] {
  const table = tableByTopic(
    tables,
    "correspondencia territorial: centro de salud–distrito–barriada"
  );
  if (table === undefined) return [];
  return table.rows
    .slice(1)
    .map((row) => ({
      centroSalud: (row[0] ?? "").trim() || undefined,
      censusDistrict: (row[1] ?? "").trim() || undefined,
      neighbourhoods: (row[2] ?? "")
        .split(/[,;]/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0),
      source: {
        documentId: report.linkedDocumentId,
        tableReference: table.tableReference,
        textExcerpt: clip(row.join(" | ")),
      },
    }))
    .filter((c) => c.centroSalud !== undefined || c.censusDistrict !== undefined);
}

// ── Estado de estructuración por tabla (detectar ≠ reconocer ≠ estructurar) ────

const NOT_STRUCTURED_REASONS: Array<{ match: RegExp; reason: string }> = [
  { match: /enseñanzas|centro autorizado|educacion/i, reason: "inventario de centros educativos: fuera del alcance de este incremento" },
  { match: /entidad|plena inclusion|aldeas infantiles/i, reason: "inventario de entidades/recursos: fuera del alcance de este incremento" },
  { match: /nucleos de poblacion/i, reason: "población por núcleos: escala no distrital, no priorizada" },
  { match: /composicion barriadas/i, reason: "estructura de barriadas: representada como correspondencia territorial, no como hallazgo" },
];

function assignTableStructuringStatus(
  tables: HealthReportStructuredTable[],
  findings: HealthReportStructuredFinding[]
): void {
  const refsConHallazgo = new Set(
    findings.map((f) => f.source.tableReference).filter((r): r is string => r !== undefined)
  );
  for (const table of tables) {
    if (table.recognizedTopic !== undefined && refsConHallazgo.has(table.tableReference)) {
      table.structuringStatus = "structured";
    } else if (table.recognizedTopic !== undefined) {
      table.structuringStatus = "recognized-not-structured";
      table.notStructuredReason =
        "tabla reconocida por tema pero sin hallazgos estructurados en este incremento";
    } else {
      table.structuringStatus = "detected-not-structured";
      const header = normalize(table.rows[0]?.join(" ") ?? "");
      table.notStructuredReason =
        NOT_STRUCTURED_REASONS.find((r) => r.match.test(header))?.reason ??
        "tabla detectada sin tema reconocido ni semántica estructurable fiable";
    }
  }
}

export function buildHealthReportStructuredReading(
  report: HealthReportDocument | undefined
): HealthReportStructuredReading {
  if (report === undefined || report.body.originalText.trim().length === 0) {
    return emptyReading();
  }

  const sections = buildStructuredSections(report);
  const tables = buildStructuredTables(report);
  const limitations = extractDeclaredLimitations(report.body.originalText);
  const findings: HealthReportStructuredFinding[] = [];

  // These extractors encode the Zaidin report's table layout and geography.
  // Do not apply that source-specific interpretation to another municipality.
  if (report.municipalityId === "granada-zaidin") {
    addChronicFindings(report, findings, sections);
    addCancerFindings(report, findings, tables, limitations);
    addScreeningFindings(report, findings, tables);
    addLifestyleInterventionFindings(report, findings, sections);
    addDemographicFindings(report, findings, tables);
    addMaterialInequalityFindings(report, findings, tables);
    addEpidemiologicalEventFindings(report, findings, tables);
    addLimitationFindings(report, findings, limitations);
  }
  addMortalityFindings(report, findings, sections, limitations);

  const territorialCorrespondences = buildTerritorialCorrespondences(report, tables);
  assignTableStructuringStatus(tables, findings);

  const detectedNotStructured = tables.filter(
    (t) => t.structuringStatus === "detected-not-structured"
  ).length;
  const recognizedNotStructured = tables.filter(
    (t) => t.structuringStatus === "recognized-not-structured"
  ).length;

  const extractionNotes = [
    "Lectura derivada: no modifica ni sustituye el Informe de Salud original.",
    "Las menciones textuales se mantienen separadas de los datos tabulares y de las interpretaciones explícitas del documento.",
    "Las tablas se extraen sólo cuando existen como HTML persistido; los gráficos no tabulares no se convierten en cifras.",
    `Extracción parcial y trazable: ${detectedNotStructured} tabla(s) detectada(s) sin estructurar y ${recognizedNotStructured} reconocida(s) sin hallazgos; su condición se registra, no se rellena con cifras.`,
    "La escala de cada hallazgo debe contrastarse con el ámbito del Perfil; un recuento absoluto no equivale a una tasa.",
    ...(report.municipalityId !== "granada-zaidin"
      ? ["Los extractores específicos del Informe de Zaidín no se aplican a este territorio; sus tablas y secciones requieren una lectura compatible con la fuente."]
      : []),
  ];
  if (tables.length === 0 && report.body.tableCount !== undefined && report.body.tableCount > 0) {
    extractionNotes.push("El documento declara tablas, pero no hay HTML tabular persistido para reconstruir filas.");
  }

  return {
    present: true,
    documentId: report.linkedDocumentId,
    charCount: report.body.charCount,
    originalTextAvailable: true,
    originalTableCount: report.body.tableCount,
    sections,
    tables,
    findings,
    territorialCorrespondences,
    limitations,
    extractionNotes,
  };
}
