import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// VISUAL-CONTRACT §2 (paleta) y §6 (elementos prohibidos) aplicados a la agenda.
const css = readFileSync("src/ui/components/AgendaBoard.css", "utf8");

describe("AgendaBoard.css cumple el contrato visual", () => {
  it("no usa colores literales: solo variables de la paleta", () => {
    expect(css.match(/#[0-9a-fA-F]{3,8}\b/g)).toBeNull();
    expect(css).not.toMatch(/color-mix\(/);
  });
  it("solo usa variables de la paleta COMPÁS (seis colores) y los neutros", () => {
    const used = new Set([...css.matchAll(/var\(--([a-z-]+)\)/g)].map((m) => m[1]));
    const allowed = new Set(["azul", "cyan", "verde", "amarillo", "naranja", "rojo", "azul-profundo", "blanco", "borde", "fondo-principal", "fondo-secundario", "texto-principal", "texto-secundario", "texto-terciario"]);
    expect([...used].filter((v) => !allowed.has(v))).toEqual([]);
  });
  it("no usa píldoras, gradientes, elevación ni sombras marcadas", () => {
    expect(css).not.toMatch(/border-radius:\s*999px/);
    expect(css).not.toMatch(/gradient|translate|backdrop-filter/);
    const shadows = [...css.matchAll(/box-shadow:\s*0\s+(\d+)px\s+(\d+)px/g)];
    for (const s of shadows) expect(Number(s[1])).toBeLessThanOrEqual(2);
  });
});
