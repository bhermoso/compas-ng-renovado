/**
 * Exportación del Perfil completo a PDF mediante el diálogo de impresión del navegador.
 *
 * El documento se escribe en un marco fuera de la vista. Dos condiciones hacen que
 * la impresión llegue a producir el PDF:
 * - el marco tiene el ancho de una página A4, para que el contenido se maquete con
 *   un ancho real y no con 0 píxeles;
 * - el marco se retira cuando el navegador avisa de que ha terminado de imprimir
 *   (`afterprint`), no a plazo fijo: en Chrome la vista previa es asíncrona y, si
 *   el marco desaparece antes, la vista previa se cierra sin generar el archivo.
 */
export const PRINT_FRAME_FALLBACK_MS = 10 * 60 * 1000;

export function printCompleteProfile(node: HTMLElement | null, title: string, doc: Document = document): HTMLIFrameElement | undefined {
  if (!node) return undefined;
  const frame = doc.createElement('iframe');
  frame.title = 'Exportación del Perfil de Salud Local';
  frame.setAttribute('aria-hidden', 'true');
  frame.style.cssText = 'position:fixed;left:-10000px;top:0;width:210mm;height:297mm;border:0;';
  doc.body.appendChild(frame);
  const frameDoc = frame.contentDocument;
  if (!frameDoc) { frame.remove(); return undefined; }
  const styles = Array.from(doc.querySelectorAll('style,link[rel="stylesheet"]')).map(el => el.outerHTML).join('');
  const safeTitle = title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  frameDoc.open();
  frameDoc.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${safeTitle}</title>${styles}
 <style>@page{size:A4;margin:12mm} body{background:white!important;margin:0!important}
 .epd-trace__item,.epd-findings li,.epd-recos__group{break-inside:avoid}
 .epd{max-width:none!important} .pdp-page{break-after:auto!important;page-break-after:auto!important}
 .pdp-print-body .pdp-page{break-after:auto!important} .pdp-noprint{display:none!important}
 </style></head><body class="pdp-print-body"><main class="external-profile"><div class="ep-main ep-main--profile">${node.outerHTML}</div></main></body></html>`);
  frameDoc.close();
  const win = frame.contentWindow;
  let removed = false;
  const remove = () => { if (removed) return; removed = true; frame.remove(); };
  win?.addEventListener('afterprint', remove, { once: true });
  const timer = setTimeout(remove, PRINT_FRAME_FALLBACK_MS);
  win?.addEventListener('afterprint', () => clearTimeout(timer), { once: true });
  let printed = false;
  const go = () => { if (printed || removed) return; printed = true; win?.focus(); win?.print(); };
  if (frameDoc.readyState === 'complete') setTimeout(go, 400);
  else frame.addEventListener('load', () => setTimeout(go, 400), { once: true });
  return frame;
}
