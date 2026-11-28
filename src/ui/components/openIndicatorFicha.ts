/**
 * Abre la ficha del indicador (y los desplegables que la contienen) y la muestra.
 * La ficha vive en «Líneas e indicadores», que puede no estar pintada todavía:
 * se reintenta durante unos fotogramas mientras la sección se monta.
 */
export function openIndicatorFicha(indicatorCode: string, attempts = 30) {
  const target = document.getElementById(`ficha-${indicatorCode}`);
  if (!target) {
    if (attempts > 0) window.requestAnimationFrame(() => openIndicatorFicha(indicatorCode, attempts - 1));
    return;
  }
  for (let node: HTMLElement | null = target; node; node = node.parentElement) {
    if (node instanceof HTMLDetailsElement) node.open = true;
  }
  target.scrollIntoView({ behavior: "smooth", block: "start" });
}
