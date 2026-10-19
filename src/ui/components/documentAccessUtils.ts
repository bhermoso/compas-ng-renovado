import zaidin from '../../../docs/source-material/health-reports/informe-salud-zaidin-abril-2023.pdf?url';
import epvsa from '../../../docs/source-material/strategic-frameworks/08_Lineas_EPVSA_02abril24.pdf?url';
import esca from '../../../docs/source-material/strategic-frameworks/Estrategia de Salud Comunitaria de Andalucia 2026-2030-ESCA.pdf?url';
import plizdFv from '../../../docs/source-material/territorial-documentation/PLIZD_FUENTE_VAQUEROS_2024.pdf?url';
import mayores from '../../../docs/source-material/strategic-frameworks/Plan de mayores 2020-23.pdf?url';

// Resolve the original paths too: existing municipal workspaces retain them.
export const bundledDocuments: Record<string, string> = {
  'docs/source-material/health-reports/informe-salud-zaidin-abril-2023.pdf': zaidin,
  'docs/source-material/strategic-frameworks/08_Lineas_EPVSA_02abril24.pdf': epvsa,
  'docs/source-material/strategic-frameworks/Estrategia de Salud Comunitaria de Andalucia 2026-2030-ESCA.pdf': esca,
  'docs/source-material/strategic-frameworks/Plan de mayores 2020-23.pdf': mayores,
  'docs/source-material/territorial-documentation/PLIZD_FUENTE_VAQUEROS_2024.pdf': plizdFv,
};

export function documentAccessUrl(sourceUrl?: string): string | undefined {
  const value = sourceUrl?.trim();
  if (!value) return undefined;
  if (Object.hasOwn(bundledDocuments, value)) return bundledDocuments[value];
  try {
    const url = new URL(value);
    if (url.protocol === 'https:' || url.protocol === 'http:') return url.href;
  } catch { /* Local references without a bundled file cannot be opened. */ }
  return undefined;
}

export function isPdfDocumentAccess(sourceUrl?: string): boolean {
  const value = sourceUrl?.trim();
  if (!value) return false;
  return /\.pdf(?:$|[?#])/i.test(value) || /\.pdf(?:$|[?#])/i.test(documentAccessUrl(value) ?? "");
}

export function documentDownloadFileName(sourceUrl: string | undefined, fallbackTitle: string): string {
  const sourceName = sourceUrl?.split(/[?#]/)[0].split("/").pop();
  const decoded = (() => {
    try {
      return sourceName ? decodeURIComponent(sourceName) : "";
    } catch {
      return sourceName ?? "";
    }
  })();
  if (decoded.trim()) return decoded;
  const safe = fallbackTitle.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._ -]+/g, " ").trim();
  return `${safe || "documento"}.pdf`;
}
