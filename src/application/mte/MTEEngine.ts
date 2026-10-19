import type { LocalHealthProfile, PSLAreaIntervencion } from "../../domain/health-profile";
import { profileCanFeedDownstream } from "../../domain/quality/ProfileValidationCriterion";
import type {
  EscenarioEstrategico,
  LecturaEstrategicaLocal,
  MetodologiaMTE,
  NivelEstrategico,
  ReferenciaInstitucional,
  TensionEstrategica,
} from "../../domain/strategic-scenario";
import type { StrategicElement } from "../../domain/strategy";
import type { FrameworkProvider } from "./FrameworkProvider";

// ── Resultado del motor ───────────────────────────────────────────────────────

export type MTEResult =
  | { ok: true; lectura: LecturaEstrategicaLocal }
  | { ok: false; violations: readonly string[] };

// ── Cautelas invariables (CONTRACT-MTE §6.4) ──────────────────────────────────

const CAUTELAS: readonly string[] = Object.freeze([
  "Las correspondencias identificadas son observaciones metodológicas sobre la relación entre el diagnóstico territorial y el conocimiento estratégico institucional disponible. No constituyen orientaciones definitivas ni asignaciones de marcos al Plan Local de Salud.",
  "Un escenario puede corresponder con elementos de más de un marco institucional. La selección de qué marcos incorporar al plan es una decisión del equipo técnico.",
  "La ausencia de cobertura institucional (sinCoberturaMarcal: true) no significa que el problema carezca de importancia o de posibilidad de actuación. Significa que el sistema no ha detectado correspondencia en el conocimiento estratégico disponible.",
  "Este artefacto no establece prioridades entre escenarios. La priorización es una decisión deliberativa que corresponde al equipo técnico y a la ciudadanía.",
]);

// ── Mapeo de nivel estructural (registry → dominio) ───────────────────────────

function toNivelEstrategico(level: StrategicElement["level"]): NivelEstrategico {
  switch (level) {
    case "line":      return "linea";
    case "objective": return "objetivo";
    case "program":   return "programa";
    case "action":    return "accion";
    case "indicator": return "objetivo"; // aproximación: indicador se trata como nivel objetivo
  }
}

// ── Correspondencia por palabras clave (MTE v1.0) ─────────────────────────────
// Mecanismo mínimo aprobado en CONTRACT-MTE. Sin heurísticas ni scoring.

const STOPWORDS_ES = new Set([
  "de", "del", "la", "el", "los", "las", "en", "y", "a", "con",
  "por", "para", "que", "se", "un", "una", "su", "al", "o",
  "como", "más", "sin", "entre", "sobre", "este", "esta", "nos",
  "sus", "les", "han", "hay", "son", "ser", "has",
]);

function extraerClaves(texto: string): Set<string> {
  return new Set(
    texto
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")   // elimina diacríticos
      .split(/\W+/)
      .filter((w) => w.length >= 4 && !STOPWORDS_ES.has(w))
  );
}

function elementoCorresponde(el: StrategicElement, claves: Set<string>): boolean {
  const texto = `${el.label} ${el.description ?? ""}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

  for (const clave of claves) {
    if (texto.includes(clave)) return true;
  }
  return false;
}

function buscarReferencias(
  area: PSLAreaIntervencion,
  elementos: readonly StrategicElement[]
): ReferenciaInstitucional[] {
  const claves = extraerClaves(`${area.title} ${area.rationale}`);
  return elementos
    .filter((el) => elementoCorresponde(el, claves))
    .map((el) => ({
      marcoId: el.framework,
      elementoId: el.id,
      elementoLabel: el.label,
      nivel: toNivelEstrategico(el.level),
      sourceTrace: el.sourceTrace,
    }));
}

// ── Tensiones de evidencia (CONTRACT-MTE §10, MTE-L4) ────────────────────────
// v1.0: distribución no selectiva a todos los escenarios.
// tensionesEscaladas + conflictos → tipo "evidencia".

function buildTensiones(psl: LocalHealthProfile): TensionEstrategica[] {
  const tensiones: TensionEstrategica[] = [];

  for (const t of psl.tensionesEscaladas) {
    tensiones.push({
      tipo: "evidencia",
      descripcion: t.descripcion,
      requiereDeliberacion: true,
    });
  }

  for (const c of psl.conflictos) {
    tensiones.push({
      tipo: "evidencia",
      descripcion: c.descripcion,
      origenPSL: c.id,
      requiereDeliberacion: true,
    });
  }

  return tensiones;
}

// ── Metodología ───────────────────────────────────────────────────────────────

function buildMetodologia(
  version: string,
  elementos: readonly StrategicElement[]
): MetodologiaMTE {
  const instrumentos = [...new Set(elementos.map((e) => e.framework as string))];
  return {
    instrumentosConsultados: instrumentos,
    criterioDeAgrupacion:
      "1:1 — una área de intervención del PSL por escenario (primera implementación)",
    mecanismoDeCorrespondencia:
      "Correspondencia por palabras clave entre el texto del área y los elementos del conocimiento estratégico institucional",
    versionConocimientoEstrategico: version,
  };
}

// ── Motor principal ───────────────────────────────────────────────────────────

/**
 * Traduce un LocalHealthProfile validado en una LecturaEstrategicaLocal.
 *
 * @param psl              PSL en estado "validated" o "approved" (G-MTE-1).
 * @param frameworkProvider Acceso de solo lectura al conocimiento estratégico (G-MTE-3).
 * @param now              Timestamp ISO para generatedAt; inyectable para determinismo en tests.
 */
export function translate(
  psl: LocalHealthProfile,
  frameworkProvider: FrameworkProvider | null | undefined,
  now = new Date().toISOString()
): MTEResult {

  // G-MTE-3: proveedor disponible
  if (frameworkProvider == null) {
    return { ok: false, violations: ["G-MTE-3: FrameworkProvider no disponible"] };
  }

  // G-MTE-1: el PSL debe ser el Perfil vigente. La validación técnica ya no es
  // requisito: se informa como criterio de calidad («Perfil validado»,
  // CONTRACT-PROFILE-VALIDATION-QUALITY). Solo un Perfil retirado no se traduce.
  if (!profileCanFeedDownstream(psl.status)) {
    return {
      ok: false,
      violations: [
        `G-MTE-1: PSL en estado "${psl.status}"; un Perfil sustituido o archivado no es el Perfil vigente`,
      ],
    };
  }

  const elementos = frameworkProvider.getElements();
  const version = frameworkProvider.getVersion();
  const metodologia = buildMetodologia(version, elementos);

  // G-MTE-2: sin áreas de intervención procesables
  if (psl.areasDeIntervencion.length === 0) {
    return {
      ok: true,
      lectura: {
        id: `mte-${psl.id}`,
        municipalityId: psl.municipalityId,
        generatedAt: now,
        sourcePSLId: psl.id,
        sourcePSLVersion: psl.version,
        knowledgeBaseVersion: version,
        hasTranslatableContent: false,
        escenarios: [],
        sinCobertura: [],
        cautelas: [...CAUTELAS],
        metodologia,
        requiresHumanValidation: true,
      },
    };
  }

  // Construcción de escenarios — agrupación 1:1 (MTE-L1)
  const tensiones = buildTensiones(psl);
  const escenarios: EscenarioEstrategico[] = [];

  for (const area of psl.areasDeIntervencion) {
    const referencias = buscarReferencias(area, elementos);
    escenarios.push({
      id: `escenario-${psl.id}-${area.id}`,
      tema: area.title,                            // I-SC-2: derivado, nunca generado
      areasOrigen: [area.id],                      // I-SC-1: trazabilidad obligatoria
      evidenciaOrigen: [...area.relatedEvidenceIds],
      cautelasOriginales: [...area.cautions],
      activosRelacionados: [],                      // MTE-L2: vacío en v1.0
      referenciasInstitucionales: referencias,
      tensiones,                                    // MTE-L4: distribución no selectiva
      sinCoberturaMarcal: referencias.length === 0, // I-SC-7
    });
  }

  return {
    ok: true,
    lectura: {
      id: `mte-${psl.id}`,
      municipalityId: psl.municipalityId,
      generatedAt: now,
      sourcePSLId: psl.id,
      sourcePSLVersion: psl.version,
      knowledgeBaseVersion: version,
      hasTranslatableContent: true,
      escenarios,
      sinCobertura: [],   // v1.0: toda área produce un escenario; sinCobertura siempre vacío
      cautelas: [...CAUTELAS],
      metodologia,
      requiresHumanValidation: true,
    },
  };
}
