/**
 * territorialGrammar
 *
 * Fuente ÚNICA de la gramática territorial de la lectura del Perfil. Centraliza
 * `territorialScopeNoun` (antes en buildLocalHealthProfile) y deriva de él un
 * léxico componible, de modo que las expresiones generadas se adapten a la
 * identidad territorial real (municipio vs distrito inframunicipal) sin
 * sustituciones globales ni un segundo sistema paralelo.
 *
 * Resolución de la escala (Lote D):
 *   1. `territorialType` explícito manda ("distrito" | "municipio").
 *   2. Si falta pero hay un código INE municipal → "municipio".
 *   3. Si nada permite resolverlo → "ámbito territorial".
 *
 * Para `distrito`, los primitivos reproducen EXACTAMENTE el texto inframunicipal
 * previo (barrios, distrital…).
 */

export type TerritorialScope = "municipio" | "distrito" | "ambito";

export interface TerritorialIdentityLike {
  territorialType?: string;
  ineCode?: string;
}

export interface TerritorialLexicon {
  scope: TerritorialScope;
  /** "municipio" | "distrito" | "ámbito territorial". */
  scopeNoun: string;
  /** "dentro del municipio" | "dentro del distrito" | "dentro del ámbito". */
  dentroDelAmbito: string;
  /** Locus de vida cotidiana: "del municipio" | "del barrio" | "del ámbito". */
  vidaCotidianaLocus: string;
  /** Ausencia de desagregación, forma breve: "sin desagregación interna" |
   *  "sin desagregación distrital". */
  sinDesagregacionInterna: string;
  /** Ausencia de desagregación, forma con ejes: "por sexo, edad, renta o zona" |
   *  "por barrios, sexo, edad ni condición socioeconómica". */
  ejesDesagregacionAusente: string;
  /** Adjetivo de la escala fina local: "distrital" | "interna". Compone las
   *  cautelas del razonamiento: "no estimación {adj}", "no prevalencia {adj}",
   *  "no (como) medición {adj}", "sin desagregación {adj}". */
  escalaFinaAdj: string;
  /** Genitivo del ámbito, forma administrativa: "del distrito" | "del municipio" |
   *  "del ámbito" (a diferencia de `vidaCotidianaLocus`, que para un distrito es
   *  "del barrio"). */
  delScope: string;
  /** true solo para distritos inframunicipales con lectura por Unidad Asistencial
   *  (p. ej. un distrito urbano): habilita la mención legítima "Unidad Asistencial". */
  usaUnidadAsistencial: boolean;
}

export function resolveTerritorialScope(
  identity: TerritorialIdentityLike | undefined
): TerritorialScope {
  const t = (identity?.territorialType ?? "").trim().toLowerCase();
  if (t === "distrito" || t === "district") return "distrito";
  if (t === "municipio" || t === "municipality") return "municipio";
  if ((identity?.ineCode ?? "").trim().length > 0) return "municipio";
  return "ambito";
}

/**
 * Sustantivo del ámbito territorial. Firma ampliada (Lote D): recibe la identidad
 * completa para poder resolver "municipio" a partir del código INE cuando no hay
 * `territorialType` explícito.
 */
export function territorialScopeNoun(
  identity: TerritorialIdentityLike | undefined
): string {
  switch (resolveTerritorialScope(identity)) {
    case "municipio":
      return "municipio";
    case "distrito":
      return "distrito";
    default:
      return "ámbito territorial";
  }
}

export function territorialLexicon(
  identity: TerritorialIdentityLike | undefined
): TerritorialLexicon {
  const scope = resolveTerritorialScope(identity);
  const scopeNoun = territorialScopeNoun(identity);

  if (scope === "distrito") {
    // Reproduce el texto inframunicipal previo, sin cambios.
    return {
      scope,
      scopeNoun,
      dentroDelAmbito: "dentro del distrito",
      vidaCotidianaLocus: "del barrio",
      sinDesagregacionInterna: "sin desagregación distrital",
      ejesDesagregacionAusente:
        "por barrios, sexo, edad ni condición socioeconómica",
      escalaFinaAdj: "distrital",
      delScope: "del distrito",
      usaUnidadAsistencial: true,
    };
  }

  // municipio y ámbito: desagregación interna genérica, sin barrios ni distrito.
  return {
    scope,
    scopeNoun,
    dentroDelAmbito: scope === "municipio" ? "dentro del municipio" : "dentro del ámbito",
    vidaCotidianaLocus: scope === "municipio" ? "del municipio" : "del ámbito",
    sinDesagregacionInterna: "sin desagregación interna",
    ejesDesagregacionAusente: "por sexo, edad, renta o zona",
    escalaFinaAdj: "interna",
    delScope: scope === "municipio" ? "del municipio" : "del ámbito",
    usaUnidadAsistencial: false,
  };
}
