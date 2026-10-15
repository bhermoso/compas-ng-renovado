import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { InstitutionalLogoBand } from "../src/ui/components/InstitutionalLogoBand";
import { LOGO_REGISTRY } from "../src/domain/branding/logoRegistry";

const ALL_IDS = LOGO_REGISTRY.map((e) => e.id);
const CONFIRMADA_IDS = LOGO_REGISTRY.filter(
  (e) => e.authorization === "CONFIRMADA"
).map((e) => e.id);
const PENDIENTE_IDS = LOGO_REGISTRY.filter(
  (e) => e.authorization === "PENDIENTE"
).map((e) => e.id);

describe("InstitutionalLogoBand", () => {
  it("renderiza todos los logos de la lista — confirmados como img, pendientes como etiqueta", () => {
    const html = renderToStaticMarkup(<InstitutionalLogoBand ids={ALL_IDS} />);
    for (const entry of LOGO_REGISTRY) {
      if (entry.authorization === "CONFIRMADA") {
        expect(html).toContain(entry.file);
      } else {
        // logo pendiente: etiqueta de texto con el nombre
        expect(html).toContain(entry.label);
        expect(html).not.toContain(entry.file);
      }
    }
  });

  it("logos PENDIENTE se muestran como .ilogo-band__label (texto), no como img", () => {
    const html = renderToStaticMarkup(<InstitutionalLogoBand ids={ALL_IDS} />);
    for (const id of PENDIENTE_IDS) {
      const entry = LOGO_REGISTRY.find((e) => e.id === id)!;
      expect(html).not.toContain(entry.file);
      expect(html).toContain("ilogo-band__label");
      expect(html).toContain(entry.label);
    }
  });

  it("logos CONFIRMADA se muestran como img", () => {
    if (CONFIRMADA_IDS.length === 0) {
      // ninguno confirmado: no hay etiquetas img, solo ilogo-band__label
      const html = renderToStaticMarkup(<InstitutionalLogoBand ids={ALL_IDS} />);
      expect(html).not.toContain("<img");
    } else {
      const html = renderToStaticMarkup(<InstitutionalLogoBand ids={ALL_IDS} />);
      for (const id of CONFIRMADA_IDS) {
        const entry = LOGO_REGISTRY.find((e) => e.id === id)!;
        expect(html).toContain(entry.file);
      }
    }
  });

  it("respeta el orden gobierno→territorio→programas de la lista recibida", () => {
    const html = renderToStaticMarkup(<InstitutionalLogoBand ids={ALL_IDS} />);
    const positions = ALL_IDS.map((id) => {
      const entry = LOGO_REGISTRY.find((e) => e.id === id)!;
      // buscar por label (presente siempre) en lugar de file (solo CONFIRMADA)
      return html.indexOf(entry.label);
    });
    for (let i = 1; i < positions.length; i++) {
      expect(positions[i]).toBeGreaterThan(positions[i - 1]);
    }
  });

  it("cada imagen CONFIRMADA tiene alt descriptivo no vacío", () => {
    const html = renderToStaticMarkup(<InstitutionalLogoBand ids={ALL_IDS} />);
    const alts = [...html.matchAll(/alt="([^"]+)"/g)].map((m) => m[1]);
    // si no hay confirmados no hay alts; la condición es que los que existen sean válidos
    for (const alt of alts) {
      expect(alt.trim().length).toBeGreaterThan(0);
    }
  });

  it("devuelve null con lista vacía", () => {
    const html = renderToStaticMarkup(<InstitutionalLogoBand ids={[]} />);
    expect(html).toBe("");
  });
});
