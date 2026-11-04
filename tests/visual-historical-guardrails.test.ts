import { readFileSync } from "node:fs";
import { describe, it, expect } from "vitest";

function css(file: string): string {
  return readFileSync(new URL("../src/" + file, import.meta.url), "utf8");
}
const marker = "SEGUNDA PASADA · COMPÁS INSTITUCIONAL";

describe("Contrato COMPÁS · segunda pasada de módulos históricos", () => {
  it("deja intacta la estructura reconocible de la portada y sus seis acentos", () => {
    const source = css("App.css");
    const original = source.slice(0, source.indexOf(marker));
    expect(original).toContain(".home-cover__stripe");
    expect(original).toContain(".home-cover__wordmark");
    expect(original).toContain(".home-products__list");
    expect(original).toContain(".home-product--6");
  });

  it("aplica la gramática editorial después de los estilos históricos", () => {
    const source = css("App.css");
    const last = source.lastIndexOf(marker);
    expect(last).toBeGreaterThan(50000);
    const lastRules = source.slice(last);
    for (const sel of [
      ".diag-status__list",
      ".diagnosis-matrix__card",
      ".diagnosis-control__metrics",
      ".tp-topic--selected",
      ".tp-ranking__row--top5",
      ".pcm-line-decision",
      ".plan-tabs__tab--active",
      ".exp-psl-chip--validated",
      ".study-report__quality-verdict--adecuada",
      ".ges-status-badge--draft",
      ".document-review-inbox__list button",
    ]) {
      expect(lastRules, sel).toContain(sel);
    }
    // No banners multicolor ni pastillas saturadas en la nueva capa.
    expect(lastRules).not.toContain("linear-gradient(");
    expect(lastRules).not.toContain("border-radius:999px");
    expect(lastRules).not.toContain("background:#eef6ff");
    expect(lastRules).not.toContain("background:#fff7e6");
    expect(lastRules).not.toContain("!important");
  });

  it("conserva distinción entre estados sin fondos coloreados", () => {
    const cssFile = css("App.css").split(marker)[1] ?? "";
    for (const key of ["--ready", "--partial", "--validated", "--draft", "--stale"]) {
      expect(cssFile, key).toContain(key);
    }
    expect(cssFile).toContain("border-left-color:var(--amarillo)");
    expect(cssFile).toContain("border-left-color:var(--verde)");
    expect(cssFile).toContain("border-bottom-color:var(--rojo)");
  });

  it("la agenda distingue prioridad sin recodificar cada columna con colores propios", () => {
    const s = css("ui/components/AgendaBoard.css");
    expect(s).toContain("COMPÁS · Agenda operativa");
    expect(s).toContain(".agenda-column--sanitario header,");
    expect(s).toContain(".agenda-column--laboral header {border-bottom:1px solid var(--borde)}");
    expect(s).toContain(".agenda-card--prio-alta {border-left:2px solid var(--rojo)");
    expect(s).toContain(".agenda-card--prio-media {border-left:2px solid var(--amarillo)");
    expect(s).toContain(".agenda-card--prio-baja {border-left:2px solid var(--borde)");
    expect(s).toContain(".agenda-card__title {font-size:14px");
  });

  it("participación, SAM y formularios usan filas y superficie neutra", () => {
    for (const [file, selector] of [
      ["ui/components/CitizenParticipationSummary.css", ".citizen-summary__ranking li"],
      ["ui/components/SamAssessmentPanel.css", ".sam-panel__figures div"],
      ["ui/components/SamObservedAssessment.css", ".sam-observed__range"],
      ["ui/components/SamTriPyramid.css", ".sam-tripyramid__layer[data-animated=\"true\"]{transition:none}"],
    ]) {
      const s = css(file);
      expect(s, file).toContain(selector);
      expect(s, file).toContain("var(--borde)");
    }
    // Las tramas para comparar dos poblaciones son contenido de datos.
    expect(css("ui/components/SamTriPyramid.css")).toContain("repeating-linear-gradient");
  });

  it("la vista aislada de coordinación respeta la paleta canónica", () => {
    const s = css("ui/components/CoordinatorPreview.css");
    const colors = [...new Set([...s.matchAll(/#[0-9a-fA-F]{3,8}\b/g)].map(m => m[0].toLowerCase()))];
    const allowed = new Set([
      "#0074c8", "#00acd9", "#94d40b", "#ffb61b", "#ff6600", "#dc143c",
      "#f8fafc", "#e2e8f0", "#1e293b", "#64748b", "#fff", "#ffffff",
    ]);
    expect(colors.filter(c => !allowed.has(c))).toEqual([]);
    expect((s.match(/linear-gradient\(/g) ?? [])).toHaveLength(1);
    expect(s).toContain(".coord-header::after");
    expect(s).toContain(".coord-layout nav button[aria-current]");
    expect(s).not.toContain("#fff0cd");
    expect(s).not.toContain("box-shadow:0 8px");
  });

  it("la navegación transversal ya no muestra una pastilla por fase", () => {
    const s = css("index.css");
    const navigationRule = s.slice(s.indexOf(".app-nav__tab .app-nav__phase"));
    expect(navigationRule).toContain("border-radius: 0");
    expect(navigationRule).not.toContain("border-radius: 999px");
  });
});
