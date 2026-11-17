import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { ProfileText } from "../src/ui/components/ProfileText";

// Tabla del documento de origen tal como llega en el texto del Perfil (Alfacar 0.8.2, panel de salud).
const paragraphs = [
  "Indicador | Alfacar | Provincia de Granada | Andalucía | Periodo",
  "Asma (casos por 10.000) | 1.589,56 | 1.448,67 | 1.187,09 | 2025",
  "Incidencia de cáncer, tasa estandarizada (por 100.000) | 680 | 906,00 | — | 2016–2020",
  "Infecciones por Chlamydia y gonococo notificadas (casos) | 40 | — | — | 2022–julio 2026",
];

describe("Tablas del documento: los valores se leen enteros", () => {
  const html = renderToStaticMarkup(<ProfileText paragraphs={paragraphs} />);
  it("marca cifras, rayas y periodos numéricos como valores que no se parten", () => {
    for (const v of ["1.589,56", "906,00", "—", "2016–2020"]) expect(html).toContain(`class="profile-text-table__value">${v}</td>`);
  });
  it("el rótulo y un periodo con palabras siguen siendo texto que puede pasar de línea", () => {
    expect(html).toContain("<td>Asma (casos por 10.000)</td>");
    expect(html).toMatch(/data-label="Periodo">2022–julio 2026<\/td>/);
  });
  it("cada valor lleva el nombre de su columna para la lectura en pantalla estrecha", () => {
    expect(html).toContain('data-label="Provincia de Granada" class="profile-text-table__value">1.448,67</td>');
  });
  it("la hoja de estilos no permite partir valores ni rótulos letra a letra", () => {
    const css = readFileSync("src/ui/components/ProfileText.css", "utf8");
    expect(css).toMatch(/td\.profile-text-table__value[^{]*\{[^}]*white-space:nowrap/);
    expect(css).toMatch(/container-type:inline-size/);
    expect(css).toMatch(/\.profile-text-table th,\.profile-text-table td:first-child\{overflow-wrap:break-word/);
    expect(css).toMatch(/@container \(max-width:600px\)\{[\s\S]*tr>td\[data-label\]::before\{content:attr\(data-label\)/);
  });
});
