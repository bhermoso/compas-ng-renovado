import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const brandingDir = resolve(__dirname, "../public/branding");

const expectedFiles = [
  "junta-andalucia-consejeria.jpg",
  "relas.jpeg",
  "centro-comprometido-violencia-genero.gif",
  "distrito-sanitario.webp",
  "rasselh.jpg",
];

describe("public/branding assets", () => {
  it.each(expectedFiles)("%s existe en public/branding", (file) => {
    expect(existsSync(resolve(brandingDir, file))).toBe(true);
  });
});
