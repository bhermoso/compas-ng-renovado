/**
 * Catálogo institucional transversal de COMPÁS. No forma parte de ningún
 * MunicipalityWorkspace ni produce EvidenceAtoms municipales.
 *
 * Estos cuatro PDF están incluidos en el build y se resuelven a través
 * de documentAccessUrl. Un registro no equivale a validar la vigencia de
 * un marco: fecha y ámbito deben revisarse antes de aplicarlo.
 */
export interface StrategicReference {
  id: string;
  title: string;
  scope: "andalucia";
  sourcePath: string;
  category: "estrategia" | "plan";
}

export const STRATEGIC_REFERENCES: readonly StrategicReference[] = [
  {
    id: "epvsa",
    title: "Líneas estratégicas EPVSA",
    scope: "andalucia",
    sourcePath: "docs/source-material/strategic-frameworks/08_Lineas_EPVSA_02abril24.pdf",
    category: "estrategia",
  },
  {
    id: "esca-2026-2030",
    title: "Estrategia de Salud Comunitaria de Andalucía 2026–2030",
    scope: "andalucia",
    sourcePath: "docs/source-material/strategic-frameworks/Estrategia de Salud Comunitaria de Andalucia 2026-2030-ESCA.pdf",
    category: "estrategia",
  },
  {
    id: "esa-2030",
    title: "Estrategia de Salud de Andalucía 2030",
    scope: "andalucia",
    sourcePath: "docs/source-material/strategic-frameworks/Estrategia de Salud de Andalucia 2030-ESA.pdf",
    category: "estrategia",
  },
  {
    id: "mayores-2020-2023",
    title: "Plan Estratégico Integral para Personas Mayores en Andalucía 2020–2023",
    scope: "andalucia",
    sourcePath: "docs/source-material/strategic-frameworks/Plan de mayores 2020-23.pdf",
    category: "plan",
  },
] as const;
