import { getAllLogos } from "./logoRegistry";

export interface ManifestBranding {
  territorialType: "municipal" | "district" | "provincial";
  logos: string[];
}

export interface ValidationResult {
  valid: boolean;
  unknownIds: string[];
}

/** Valida que todos los IDs del bloque branding existen en el registro. */
export function validateManifestBranding(
  branding: ManifestBranding
): ValidationResult {
  const knownIds = new Set(getAllLogos().map((l) => l.id));
  const unknownIds = branding.logos.filter((id) => !knownIds.has(id));
  return { valid: unknownIds.length === 0, unknownIds };
}

/** Extrae el bloque branding de un manifest si existe; null si no hay. */
export function getBrandingFromManifest(
  manifest: Record<string, unknown>
): ManifestBranding | null {
  const b = manifest["branding"];
  if (!b || typeof b !== "object") return null;
  return b as ManifestBranding;
}
