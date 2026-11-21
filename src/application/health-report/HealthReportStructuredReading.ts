import type {
  HealthReportDocument,
  HealthReportFindingGeography,
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

function lineBlock(section: HealthReportStructuredSection | undefined): string[] {
  return section?.bodyText.split(/\r?\n/).map((line) => compact(line)).filter(Boolean) ?? [];
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
    "Las tablas y secciones específicas de cada informe requieren una lectura compatible con su fuente.",
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
