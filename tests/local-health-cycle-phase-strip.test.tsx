import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { LocalHealthCyclePhaseStrip } from "../src/ui/components/LocalHealthCyclePhaseStrip";

describe("LocalHealthCyclePhaseStrip", () => {
  it("renderiza exactamente 5 fases", () => {
    const html = renderToStaticMarkup(<LocalHealthCyclePhaseStrip />);
    const matches = html.match(/class="lhcps__phase"/g);
    expect(matches).toHaveLength(5);
  });

  it("contiene los títulos canónicos en orden", () => {
    const html = renderToStaticMarkup(<LocalHealthCyclePhaseStrip />);
    const titles = ["Analizar", "Priorizar", "Planificar", "Ejecutar", "Evaluar"];
    let lastPos = -1;
    for (const title of titles) {
      const pos = html.indexOf(title);
      expect(pos).toBeGreaterThan(lastPos);
      lastPos = pos;
    }
  });

  it("numera las fases del 1 al 5", () => {
    const html = renderToStaticMarkup(<LocalHealthCyclePhaseStrip />);
    for (let n = 1; n <= 5; n++) {
      expect(html).toContain(`class="lhcps__num">${n}<`);
    }
  });

  it("usa tokens CSS de fase (var(--...)) y no valores hex directos en el inline style", () => {
    const html = renderToStaticMarkup(<LocalHealthCyclePhaseStrip />);
    const styleMatches = [...html.matchAll(/style="([^"]+)"/g)].map(
      (m) => m[1]
    );
    for (const style of styleMatches) {
      expect(style).not.toMatch(/#[0-9a-fA-F]{3,6}/);
    }
  });

  it("no reutiliza tipos ni clases del LocalHealthPlanningCycle (lhpc)", () => {
    const html = renderToStaticMarkup(<LocalHealthCyclePhaseStrip />);
    expect(html).not.toContain("lhpc");
  });

  it("el bloque CSS añadido a App.css no contiene valores hex fuera de tokens", () => {
    const css = readFileSync(
      resolve(__dirname, "../src/App.css"),
      "utf-8"
    );
    const p5bStart = css.indexOf("/* ===== P5B:");
    expect(p5bStart).toBeGreaterThan(-1);
    const p5bBlock = css.slice(p5bStart);
    const hexMatches = p5bBlock.match(/#[0-9a-fA-F]{3,6}\b/g);
    expect(hexMatches).toBeNull();
  });
});
