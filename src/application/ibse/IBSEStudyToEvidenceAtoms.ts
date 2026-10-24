/**
 * Conversión de IBSEStudy → EvidenceAtom (dos niveles diferenciados)
 *
 * IBSE_FACTORES — 5 átomos, kind: "indicator"
 *   Evidencia cuantitativa primaria. Fuente directa del instrumento IBSE.
 *   Un átomo por valor: índice total + 4 factores (Vínculo, Situación, Control, Persona).
 *   Son la base de cualquier análisis territorial que use datos IBSE.
 *   El MIT los utiliza como evidencia principal.
 *
 * IBSE_RESUMEN — 1 átomo, kind: "qualitative-observation"
 *   Síntesis automática derivada del procesamiento de IBSE_FACTORES.
 *   No es fuente primaria de conocimiento ni interpretación experta.
 *   Solo puede emplearse como observación contextual de apoyo.
 *   Nunca debe prevalecer sobre los datos cuantitativos cuando exista discrepancia.
 *   Toda heurística incorporada (umbrales de nivel, alertas de dispersión)
 *   es una regla del sistema, no una conclusión metodológica del instrumento IBSE.
 *
 * Contrato arquitectónico:
 *   IBSE_RESUMEN constituye una síntesis automática derivada del procesamiento
 *   de los resultados del estudio y requiere validación técnica humana antes de
 *   utilizarse como apoyo a la interpretación territorial o a la planificación.
 */

import { createEvidenceAtom, IBSE_DERIVED_TAG, type EvidenceAtom } from "../../domain/evidence";
import type { IBSEStudy } from "../../domain/ibse";
import { IBSE_PARTICIPANT_MEAN_LABEL } from "../../domain/ibse";

interface IBSEFactorDef {
  title: string;
  field: keyof Pick<
    IBSEStudy["aggregates"],
    "meanTotal" | "meanFactorVinculo" | "meanFactorSituacion" | "meanFactorControl" | "meanFactorPersona"
  >;
  description: string;
}

const IBSE_FACTOR_DEFS: IBSEFactorDef[] = [
  {
    title: "IBSE – Índice total de bienestar socioemocional",
    field: "meanTotal",
    description: "Índice total (media de los 8 ítems IBSE). Escala 0–100, mayor = mejor bienestar.",
  },
  {
    title: "IBSE – Factor Vínculo",
    field: "meanFactorVinculo",
    description: "Sentido de pertenencia y relaciones afectivas (ítems: deprimido, solo). Escala 0–100.",
  },
  {
    title: "IBSE – Factor Situación",
    field: "meanFactorSituacion",
    description: "Valoración de la situación vital actual (ítems: feliz, disfrutar). Escala 0–100.",
  },
  {
    title: "IBSE – Factor Control",
    field: "meanFactorControl",
    description: "Control percibido sobre la propia vida (ítems: energía, tranquilo). Escala 0–100.",
  },
  {
    title: "IBSE – Factor Persona",
    field: "meanFactorPersona",
    description: "Autopercepción e identidad personal (ítems: optimista, bienmismo). Escala 0–100.",
  },
];

export function ibseStudyToEvidenceAtoms(study: IBSEStudy): EvidenceAtom[] {
  if (study.aggregates.nValid === 0) return [];

  const { nValid, n } = study.aggregates;
  const confidence = nValid >= 30 ? "medium" : "low";

  // IBSE_FACTORES — 5 atoms, one per factor + total index (kind: "indicator")
  const factorAtoms = IBSE_FACTOR_DEFS.map((def) => {
    const value = study.aggregates[def.field];
    return createEvidenceAtom({
      id: `ibse:${study.municipalityId}:${def.field}`,
      municipalityId: study.municipalityId,
      kind: "indicator",
      title: def.title,
      content: `${def.description} ${IBSE_PARTICIPANT_MEAN_LABEL}: ${value} (n=${nValid} registros válidos de ${n} totales). Fuente: ${study.sourceFileName}.`,
      confidence,
      provenance: {
        origin: "ibse",
        sourceLabel: study.sourceFileName,
        extractedAt: study.createdAt,
      },
      methodology: {
        description:
          "Agregado municipal calculado desde exportación REDCap. Instrumento IBSE (Bericat, 2014) adaptado para planificación local de salud.",
        limitations: study.methodologicalCautions,
        requiresHumanValidation: true,
      },
      tags: ["ibse", "indicator", def.field],
    });
  });

  // IBSE_RESUMEN — 1 atom, interpretación estructural de los factores (kind: "qualitative-observation")
  const resumenAtom = buildIBSEResumen(study, confidence);

  const atoms = [...factorAtoms, resumenAtom];
  const adjustment = study.demographicAdjustment;
  if (!adjustment) return atoms;
  const trace = adjustment.status === "blocked"
    ? `Ajuste demográfico no calculado: ${adjustment.reasons.join(" ")}`
    : `Resultado ajustado separado, pendiente de validación humana. Fuente: ${adjustment.reference.source}; universo: ${adjustment.reference.ageGroupLabel}; método: ${adjustment.method}; SHA-256 del texto importado: ${adjustment.sampleFingerprint}. Los valores principales siguen siendo observados.`;
  return atoms.map((atom) => ({
    ...atom,
    methodology: {
      ...atom.methodology!,
      limitations: [...(atom.methodology?.limitations ?? []), trace],
    },
  }));
}

// ── IBSE_RESUMEN — Síntesis automática derivada ───────────────────────────
// Nivel secundario. No es fuente primaria de evidencia.
// El MIT usa IBSE_FACTORES como evidencia principal; IBSE_RESUMEN es apoyo contextual.

// [Regla del sistema] Umbrales de nivel — heurísticos, no normativos ni clínicos.
function clasificarNivelIBSE(valor: number): string {
  if (valor >= 75) return "alto (≥75/100)";
  if (valor >= 60) return "medio (60–74)";
  if (valor >= 50) return "medio-bajo (50–59)";
  return "bajo (<50)";
}

function buildIBSEResumen(study: IBSEStudy, confidence: "low" | "medium"): EvidenceAtom {
  const agg = study.aggregates;

  const factores = [
    { nombre: "Vínculo",   valor: agg.meanFactorVinculo   },
    { nombre: "Situación", valor: agg.meanFactorSituacion },
    { nombre: "Control",   valor: agg.meanFactorControl   },
    { nombre: "Persona",   valor: agg.meanFactorPersona   },
  ];

  const min = factores.reduce((a, b) => (a.valor < b.valor ? a : b));
  const max = factores.reduce((a, b) => (a.valor > b.valor ? a : b));
  const rango = Math.round((max.valor - min.valor) * 10) / 10;

  const asimetriaLabel =
    rango > 20 ? `alta (${rango} puntos)` :
    rango > 10 ? `moderada (${rango} puntos)` :
                 `baja (${rango} puntos)`;

  const partes: string[] = [
    // Header: mark as auto-generated derivative, not primary evidence
    "Síntesis automática derivada de IBSE_FACTORES. No es fuente primaria de evidencia cuantitativa.",
    // Factual description of quantitative results
    `Índice IBSE total: ${agg.meanTotal}/100 — ${clasificarNivelIBSE(agg.meanTotal)}.`,
    `Factor con menor puntuación: ${min.nombre} (${min.valor}/100) — dimensión con menor bienestar relativo en la muestra.`,
    `Factor con mayor puntuación: ${max.nombre} (${max.valor}/100) — dimensión con mayor bienestar relativo.`,
    `Dispersión interfactorial: ${asimetriaLabel}.`,
  ];

  // [Regla del sistema] Heuristic alert — not a methodological conclusion of IBSE
  if (rango > 20) {
    partes.push(
      "[Regla del sistema] Dispersión interfactorial alta (>" + "20 puntos): los factores presentan perfiles diferenciados. " +
      "El índice total puede no representar adecuadamente la diversidad de dimensiones. " +
      "Se recomienda revisar cada factor de forma independiente."
    );
  }

  partes.push(
    `Muestra: ${agg.nValid} registro(s) válido(s) de ${agg.n} totales.`,
    // Architectural contract note (verbatim from spec)
    "[Contrato arquitectónico] IBSE_RESUMEN constituye una síntesis automática derivada del " +
    "procesamiento de los resultados del estudio y requiere validación técnica humana antes de " +
    "utilizarse como apoyo a la interpretación territorial o a la planificación."
  );

  return createEvidenceAtom({
    id: `ibse:${study.municipalityId}:resumen-interpretativo`,
    municipalityId: study.municipalityId,
    kind: "qualitative-observation",
    title: "IBSE – Resumen interpretativo estructural (derivado)",
    content: partes.join(" "),
    confidence,
    provenance: {
      origin: "ibse",
      sourceLabel: study.sourceFileName,
      extractedAt: study.createdAt,
    },
    methodology: {
      description:
        "Síntesis automática derivada del procesamiento de los resultados de IBSE_FACTORES. " +
        "Identifica el factor de menor puntuación, el de mayor puntuación y la dispersión interfactorial. " +
        "IBSE_RESUMEN no es una fuente primaria de conocimiento ni una interpretación experta. " +
        "No debe prevalecer sobre los datos cuantitativos (IBSE_FACTORES) cuando exista discrepancia. " +
        "IBSE_RESUMEN constituye una síntesis automática derivada del procesamiento de los resultados " +
        "del estudio y requiere validación técnica humana antes de utilizarse como apoyo a la " +
        "interpretación territorial o a la planificación.",
      limitations: [
        "[Regla del sistema] Los umbrales de clasificación (alto/medio/bajo) son heurísticos definidos por el sistema, no por el instrumento IBSE ni por criterios normativos o clínicos.",
        "[Regla del sistema] La alerta por dispersión interfactorial alta (>20 puntos) es una regla automática del sistema, no una conclusión metodológica del instrumento IBSE (Bericat, 2014).",
        "La interpretación es comparativa dentro de la muestra municipal, sin referencias poblacionales externas.",
        "IBSE_RESUMEN debe emplearse solo como observación contextual de apoyo; IBSE_FACTORES constituye la fuente primaria de evidencia cuantitativa.",
        ...study.methodologicalCautions,
      ],
      requiresHumanValidation: true,
    },
    // `IBSE_DERIVED_TAG` marca esta pieza como SÍNTESIS AUTOMÁTICA DERIVADA:
    // se conserva como resumen técnico trazable, pero LT1 no la cuenta como
    // hallazgo cualitativo ni participativo (ver domain/evidence/derivedSynthesis).
    tags: ["ibse", "qualitative-observation", "ibse-resumen", IBSE_DERIVED_TAG],
  });
}
