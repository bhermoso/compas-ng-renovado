export type LogoKind = "institutional" | "territorial" | "program" | "compas";
export type LogoAuthorization = "PENDIENTE" | "CONFIRMADA";

export interface LogoEntry {
  id: string;
  label: string;
  owner: string;
  kind: LogoKind;
  file: string;
  source: string;
  usageScope: string[];
  authorization: LogoAuthorization;
}

// Orden: gobierno (institutional) → territorio → programas
export const LOGO_REGISTRY: LogoEntry[] = [
  {
    id: "consejeria",
    label: "Consejería de Sanidad, Presidencia y Emergencias",
    owner: "Junta de Andalucía",
    kind: "institutional",
    file: "junta-andalucia-consejeria.jpg",
    source: "LOGO_CONSEJERIA_B64_893c8626be.jpg",
    usageScope: ["report-header", "portada"],
    authorization: "PENDIENTE",
  },
  {
    id: "distrito-sanitario",
    label: "Distrito de Atención Primaria Granada-Metropolitano",
    owner: "Servicio Andaluz de Salud",
    kind: "territorial",
    file: "distrito-sanitario.webp",
    source: "LOGO_DISTRITO_B64_05a80171aa.webp",
    usageScope: ["report-header", "portada"],
    authorization: "PENDIENTE",
  },
  {
    id: "relas",
    label: "RELAS — Red de Acción Local en Salud",
    owner: "Junta de Andalucía / Servicio Andaluz de Salud",
    kind: "program",
    file: "relas.jpeg",
    source: "LOGO_RELAS_B64_1db3b20da3.jpg",
    usageScope: ["portada", "header"],
    authorization: "PENDIENTE",
  },
  {
    id: "violencia-genero",
    label: "Centros Comprometidos contra la Violencia de Género",
    owner: "Junta de Andalucía",
    kind: "program",
    file: "centro-comprometido-violencia-genero.gif",
    source: "LOGO_VIOLENCIA_B64_c6e2eb1685.gif",
    usageScope: ["header"],
    authorization: "PENDIENTE",
  },
  {
    id: "rasselh",
    label: "RASSELH (por confirmar)",
    owner: "por confirmar",
    kind: "program",
    file: "rasselh.jpg",
    source: "LOGO_RASSELH_B64_376e15d364.jpg",
    usageScope: ["header", "portada"],
    authorization: "PENDIENTE",
  },
];

/** Solo los logos con autorización confirmada (publicables). */
export function getPublishableLogos(): LogoEntry[] {
  return LOGO_REGISTRY.filter((l) => l.authorization === "CONFIRMADA");
}

/** Todos los logos, para uso interno y administración. */
export function getAllLogos(): LogoEntry[] {
  return LOGO_REGISTRY;
}
