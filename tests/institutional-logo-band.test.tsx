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
  it("con showPending=true renderiza todos los logos de la lista", () => {
    const html = renderToStaticMarkup(
      <InstitutionalLogoBand ids={ALL_IDS} showPending={true} />
    );
    for (const entry of LOGO_REGISTRY) {
      expect(html).toContain(entry.file);
    }
  });

  it("por defecto oculta los logos PENDIENTE", () => {
    const html = renderToStaticMarkup(
      <InstitutionalLogoBand ids={ALL_IDS} />
    );
    for (const id of PENDIENTE_IDS) {
      const entry = LOGO_REGISTRY.find((e) => e.id === id)!;
      expect(html).not.toContain(entry.file);
    }
  });

  it("por defecto muestra solo los logos CONFIRMADA", () => {
    if (CONFIRMADA_IDS.length === 0) {
      expect(
        renderToStaticMarkup(<InstitutionalLogoBand ids={ALL_IDS} />)
      ).toBe("");
    } else {
      const html = renderToStaticMarkup(
        <InstitutionalLogoBand ids={ALL_IDS} />
      );
      for (const id of CONFIRMADA_IDS) {
        const entry = LOGO_REGISTRY.find((e) => e.id === id)!;
        expect(html).toContain(entry.file);
      }
    }
  });

  it("respeta el orden gobierno→territorio→programas de la lista recibida", () => {
    const html = renderToStaticMarkup(
      <InstitutionalLogoBand ids={ALL_IDS} showPending={true} />
    );
    const positions = ALL_IDS.map((id) => {
      const entry = LOGO_REGISTRY.find((e) => e.id === id)!;
      return html.indexOf(entry.file);
    });
    for (let i = 1; i < positions.length; i++) {
      expect(positions[i]).toBeGreaterThan(positions[i - 1]);
    }
  });

  it("cada imagen tiene alt descriptivo no vacío", () => {
    const html = renderToStaticMarkup(
      <InstitutionalLogoBand ids={ALL_IDS} showPending={true} />
    );
    const alts = [...html.matchAll(/alt="([^"]+)"/g)].map((m) => m[1]);
    expect(alts.length).toBeGreaterThan(0);
    for (const alt of alts) {
      expect(alt.trim().length).toBeGreaterThan(0);
    }
  });

  it("devuelve null cuando no hay logos publicables y showPending=false", () => {
    const html = renderToStaticMarkup(
      <InstitutionalLogoBand ids={PENDIENTE_IDS} showPending={false} />
    );
    expect(html).toBe("");
  });
});
