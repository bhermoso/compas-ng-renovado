import { GRANADA_MUNICIPALITIES, type CatalogMunicipality } from "../../domain/territory/granadaMunicipalities";

export type SpaceType = "municipio" | "mancomunidad" | "distrito-municipal";
export interface SpaceLike { readonly id: string; readonly name: string; readonly type: SpaceType }

export const SPACE_TYPE_LABEL: Record<SpaceType, string> = {
  municipio: "Municipio",
  mancomunidad: "Mancomunidad",
  "distrito-municipal": "Distrito municipal",
};
export const SPACE_GROUP_LABEL: Record<SpaceType, string> = {
  municipio: "Municipios",
  mancomunidad: "Mancomunidades",
  "distrito-municipal": "Distritos municipales",
};

const ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,79}$/;

export function normalize(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function slugify(text: string): string {
  return normalize(text).replace(/ /g, "-").slice(0, 80).replace(/-+$/g, "");
}

/** «Zubia, La» → «La Zubia». */
export function municipalityDisplayName(ineName: string): string {
  const m = /^(.+), (El|La|Los|Las)$/.exec(ineName.trim());
  return m ? `${m[2]} ${m[1]}` : ineName.trim();
}

export function findMunicipality(ineCode: string): CatalogMunicipality | undefined {
  return GRANADA_MUNICIPALITIES.find((m) => m.ineCode === ineCode);
}

export type SpaceInput =
  | { kind: "municipio"; ineCode: string }
  | { kind: "distrito-municipal"; ineCode: string; districtName: string }
  | { kind: "mancomunidad"; name: string };

/** Construye el espacio a partir de las elecciones. El identificador nunca se escribe a mano. */
export function buildSpace(input: SpaceInput): SpaceLike | undefined {
  let space: SpaceLike | undefined;
  if (input.kind === "mancomunidad") {
    const name = input.name.trim().replace(/\s+/g, " ");
    if (name) space = { id: slugify(name), name, type: "mancomunidad" };
  } else {
    const municipality = findMunicipality(input.ineCode);
    if (!municipality) return undefined;
    const base = municipalityDisplayName(municipality.ineName);
    if (input.kind === "municipio") {
      space = { id: slugify(base), name: base, type: "municipio" };
    } else {
      const district = input.districtName.trim().replace(/\s+/g, " ");
      if (district) {
        const name = `${base} · ${district}`;
        space = { id: slugify(name), name, type: "distrito-municipal" };
      }
    }
  }
  return space && ID_PATTERN.test(space.id) ? space : undefined;
}

function isTaken(spaces: readonly SpaceLike[], candidate: SpaceLike): boolean {
  const n = normalize(candidate.name);
  return spaces.some((s) => s.id === candidate.id || (s.type === candidate.type && normalize(s.name) === n));
}

export function spaceAlreadyExists(spaces: readonly SpaceLike[], candidate: SpaceLike): boolean {
  return isTaken(spaces, candidate);
}

/** Municipios del catálogo que aún no tienen espacio. Se recalcula con cada alta. */
export function availableMunicipalities(spaces: readonly SpaceLike[]): CatalogMunicipality[] {
  return GRANADA_MUNICIPALITIES
    .filter((m) => {
      const candidate = buildSpace({ kind: "municipio", ineCode: m.ineCode });
      return candidate ? !isTaken(spaces, candidate) : false;
    })
    .slice()
    .sort((a, b) => municipalityDisplayName(a.ineName).localeCompare(municipalityDisplayName(b.ineName), "es"));
}

/** Todos los municipios del catálogo, para elegir el municipio de un distrito. */
export function allMunicipalities(): CatalogMunicipality[] {
  return GRANADA_MUNICIPALITIES.slice().sort((a, b) =>
    municipalityDisplayName(a.ineName).localeCompare(municipalityDisplayName(b.ineName), "es"));
}

/** Distritos ya creados de un municipio (se deducen del nombre «Municipio · Distrito»). */
export function districtsOf(spaces: readonly SpaceLike[], ineCode: string): SpaceLike[] {
  const municipality = findMunicipality(ineCode);
  if (!municipality) return [];
  const prefix = `${municipalityDisplayName(municipality.ineName)} · `;
  return spaces.filter((s) => s.type === "distrito-municipal" && s.name.startsWith(prefix));
}

export interface SpaceGroup { type: SpaceType; label: string; spaces: SpaceLike[] }

/** Agrupa los espacios por tipo para los desplegables; se recalcula con cada alta. */
export function groupSpaces<T extends SpaceLike>(spaces: readonly T[]): { type: SpaceType; label: string; spaces: T[] }[] {
  return (["mancomunidad", "municipio", "distrito-municipal"] as SpaceType[])
    .map((type) => ({
      type,
      label: SPACE_GROUP_LABEL[type],
      spaces: spaces.filter((s) => s.type === type).slice().sort((a, b) => a.name.localeCompare(b.name, "es")),
    }))
    .filter((g) => g.spaces.length > 0);
}
