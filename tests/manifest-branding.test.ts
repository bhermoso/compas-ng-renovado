import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  validateManifestBranding,
  getBrandingFromManifest,
  type ManifestBranding,
} from "../src/domain/branding/manifestBranding";

const atarfeManifest = JSON.parse(
  readFileSync(
    resolve(__dirname, "../municipalities/atarfe/manifest.json"),
    "utf-8"
  )
);

const zagraManifest = JSON.parse(
  readFileSync(
    resolve(__dirname, "../municipalities/zagra/manifest.json"),
    "utf-8"
  )
);

describe("manifest branding — Atarfe", () => {
  it("el manifest de Atarfe contiene el bloque branding", () => {
    expect(atarfeManifest.branding).toBeDefined();
  });

  it("territorialType es 'municipal'", () => {
    expect(atarfeManifest.branding.territorialType).toBe("municipal");
  });

  it("el bloque branding tiene 5 logos en orden gobierno→territorio→programas", () => {
    const { logos } = atarfeManifest.branding as ManifestBranding;
    expect(logos).toEqual([
      "consejeria",
      "distrito-sanitario",
      "relas",
      "violencia-genero",
      "rasselh",
    ]);
  });

  it("todos los IDs del branding existen en el registro", () => {
    const result = validateManifestBranding(atarfeManifest.branding);
    expect(result.valid).toBe(true);
    expect(result.unknownIds).toHaveLength(0);
  });

  it("un ID desconocido produce validación fallida", () => {
    const result = validateManifestBranding({
      territorialType: "municipal",
      logos: ["consejeria", "logo-inexistente"],
    });
    expect(result.valid).toBe(false);
    expect(result.unknownIds).toContain("logo-inexistente");
  });
});

describe("manifest branding — Zagra (sin bloque branding)", () => {
  it("el manifest de Zagra no tiene bloque branding", () => {
    expect(getBrandingFromManifest(zagraManifest)).toBeNull();
  });

  it("municipio sin branding no rompe getBrandingFromManifest", () => {
    expect(() => getBrandingFromManifest(zagraManifest)).not.toThrow();
  });
});
