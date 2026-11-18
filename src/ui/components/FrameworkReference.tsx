import { documentAccessUrl, documentDownloadFileName, isPdfDocumentAccess } from './documentAccessUtils';
const frameworks = {
 epvsa: ['EPVSA', 'docs/source-material/strategic-frameworks/08_Lineas_EPVSA_02abril24.pdf'],
 esca: ['ESCA', 'docs/source-material/strategic-frameworks/Estrategia de Salud Comunitaria de Andalucia 2026-2030-ESCA.pdf'],
 esa: ['ESA 2030', 'docs/source-material/strategic-frameworks/Estrategia de Salud de Andalucia 2030-ESA.pdf'],
 mayores: ['Plan Estratégico Integral para Personas Mayores en Andalucía 2020–2023', 'docs/source-material/strategic-frameworks/Plan de mayores 2020-23.pdf'],
} as const;
export function FrameworkReference({ name }: { name: keyof typeof frameworks }) {
 const [label, path] = frameworks[name];
 const url = documentAccessUrl(path);
 if (!url) return <>{label}</>;
 return isPdfDocumentAccess(path)
  ? <a href={url} download={documentDownloadFileName(path, label)} aria-label={`${label} (descargar PDF)`}>{label}</a>
  : <a href={url} target="_blank" rel="noopener noreferrer" aria-label={`${label} (nueva pestaña)`}>{label}</a>;
}
