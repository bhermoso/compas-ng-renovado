import fuenteVaquerosSeed from "./fuenteVaquerosSeed";
import lojaSeed from "./lojaSeed";
import type { MunicipalityWorkspace } from "../../domain/workspace";
import { parseWorkspaceJSON } from "../persistence/local-storage";
import { normalizeKnownMunicipalDocumentKinds } from "../../application/workspace/normalizeKnownMunicipalDocuments";

/**
 * municipalitySeeds
 *
 * Hidratacion inicial de expedientes municipales desde seeds canonicos
 * desplegables. Un seed es una copia REAL y rehidratable de un expediente
 * (mismo formato que el export/localStorage). No fabrica datos: registrar un
 * municipio aqui exige un fichero de expediente real desplegado en `public/seeds/`.
 */

export interface MunicipalitySeed {
  municipalityId: string;
  /** Nombre institucional esperado: verifica la identidad del expediente. */
  expectedName: string;
  /** Ruta del seed RELATIVA a `import.meta.env.BASE_URL` (sin barra inicial). */
  path: string;
}

/**
 * Registro generico de seeds canonicos. SOLO se registran municipios con un export
 * real vigente y rehidratable.
 *
 * Estado (2026-10-09): expedientes canonicos cargables = Granada-Zaidin,
 * Atarfe, Alfacar, Fuente Vaqueros y Loja. Churriana de la Vega y Zagra NO
 * tienen export real: se abren vacios hasta que exista uno. No se inventa
 * contenido; las fixtures sinteticas o provinciales NO se promueven a datos de
 * produccion.
 */
export const MUNICIPALITY_SEEDS: Readonly<Record<string, MunicipalitySeed>> = {
  "granada-zaidin": {
    municipalityId: "granada-zaidin",
    expectedName: "Granada-Zaidín",
    path: "seeds/compas-ng-workspace-granada-zaidin.json",
  },
  atarfe: {
    municipalityId: "atarfe",
    expectedName: "Atarfe",
    path: "seeds/compas-ng-workspace-atarfe.json",
  },
  alfacar: {
    municipalityId: "alfacar",
    expectedName: "Alfacar",
    path: "seeds/compas-ng-workspace-alfacar.json",
  },
  "fuente-vaqueros": {
    municipalityId: "fuente-vaqueros",
    expectedName: "Fuente Vaqueros",
    path: "seeds/compas-ng-workspace-fuente-vaqueros.json",
  },
  loja: {
    municipalityId: "loja",
    expectedName: "Loja",
    path: "seeds/compas-ng-workspace-loja.json",
  },
};

export function hasMunicipalitySeed(municipalityId: string): boolean {
  return Object.prototype.hasOwnProperty.call(MUNICIPALITY_SEEDS, municipalityId);
}

/**
 * URL absoluta del seed bajo el `base` de despliegue. En GitHub Pages
 * `import.meta.env.BASE_URL` es `/COMPAS_NG/`; en dev/test es `/`. Vite garantiza
 * que BASE_URL termina en `/`, de modo que no se duplica la barra.
 */
export function municipalitySeedUrl(
  seed: MunicipalitySeed,
  baseUrl: string
): string {
  return `${baseUrl}${seed.path}`;
}

export interface LoadMunicipalitySeedOptions {
  /** Base de despliegue; normalmente `import.meta.env.BASE_URL`. */
  baseUrl: string;
  /** Inyectable para tests. Por defecto, el `fetch` global. */
  fetchImpl?: typeof fetch;
}

/**
 * Carga y valida el seed canonico de un municipio. Devuelve `null` de forma segura
 * ante CUALQUIER fallo: sin seed registrado, error de red, HTTP no-ok, JSON
 * invalido, esquema o colecciones basicas incorrectas, o identidad municipal que
 * no concuerda con la solicitada. Nunca lanza. No toca `localStorage`: la decision
 * de si sobreescribir un expediente local es del llamador.
 */
export async function loadMunicipalitySeed(
  municipalityId: string,
  options: LoadMunicipalitySeedOptions
): Promise<MunicipalityWorkspace | null> {
  const seed = MUNICIPALITY_SEEDS[municipalityId];
  if (seed === undefined) return null;
  const doFetch = options.fetchImpl ?? fetch;
  try {
    // Fuente Vaqueros y Loja viajan con la aplicacion: algunos navegadores
    // integrados bloquean la descarga separada de JSON. Se validan con el mismo
    // parser y se crea una copia nueva en cada carga para no compartir objetos
    // mutables.
    let raw: string;
    if (municipalityId === "fuente-vaqueros") {
      raw = JSON.stringify(fuenteVaquerosSeed);
    } else if (municipalityId === "loja") {
      raw = JSON.stringify(lojaSeed);
    } else {
      const response = await doFetch(municipalitySeedUrl(seed, options.baseUrl));
      if (!response.ok) return null;
      raw = await response.text();
    }
    const workspace = parseWorkspaceJSON(raw);
    if (workspace === null) return null;
    // Identidad municipal: el seed debe corresponder EXACTAMENTE al municipio pedido.
    const identity = workspace.municipality.identity;
    if (identity.id !== seed.municipalityId) return null;
    if (identity.name !== seed.expectedName) return null;
    // Sólo al hidratar el seed de Loja: normalización explícita de un tipo
    // documental mal rotulado. No alcanza expedientes existentes en Firebase.
    return municipalityId === "loja"
      ? normalizeKnownMunicipalDocumentKinds(workspace).workspace
      : workspace;
  } catch {
    return null;
  }
}
