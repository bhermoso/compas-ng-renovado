import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  classifyPersistenceMessage,
  persistenceSummary,
  WorkspacePersistenceIndicator,
} from "../src/ui/components/WorkspacePersistenceIndicator";

const css = (path: string) => readFileSync(new URL("../src/" + path, import.meta.url), "utf8");
const targetStyles = [
  "ui/components/ExternalProfileDashboard.css",
  "ui/components/ProfileDataPages.css",
  "ui/components/ProfileEditorialLab.css",
  "ui/components/RelasAccess.css",
  "ui/components/BackupPanel.css",
];
const canonicalPalette = new Set([
  "#0074c8", "#00acd9", "#94d40b", "#ffb61b", "#ff6600", "#dc143c",
  "#f8fafc", "#f1f5f9", "#e2e8f0", "#1e293b", "#64748b",
  "#fff", "#ffffff",
]);

describe("Contrato visual institucional COMPÁS · regresiones", () => {
  it("ningún módulo revisado introduce hexadecimal ajeno a la paleta del contrato", () => {
    for (const file of targetStyles) {
      const colors = Array.from(css(file).matchAll(/#[0-9a-fA-F]{3,8}\b/g), match => match[0].toLowerCase());
      const other = [...new Set(colors)].filter(color => !canonicalPalette.has(color));
      expect(other, file).toEqual([]);
    }
  });

  it("mantiene la firma multicolor exclusivamente en la portada y cubierta documental", () => {
    const main = css("App.css");
    expect(main).toContain(".home-cover__wordmark");
    expect(main).toContain(".home-cover__stripe");
    expect(main).toContain(".home-product--1");

    for (const file of [
      "ui/components/ExternalProfileDashboard.css",
      "ui/components/ProfileEditorialLab.css",
      "ui/components/RelasAccess.css",
      "ui/components/BackupPanel.css",
    ]) {
      expect(css(file), file).not.toContain("linear-gradient(");
    }
    const data = css("ui/components/ProfileDataPages.css");
    expect((data.match(/linear-gradient\(/g) ?? [])).toHaveLength(1);
    expect(data).toContain(".pdp-band");
  });

  it("presenta estados del servidor sin cajas saturadas ni confirmaciones anticipadas", () => {
    const main = css("App.css");
    expect(main).toContain(".app-status-strip__signal[data-tone=\"error\"]");
    expect(main).toContain(".app-status-strip__details");
    expect(main).not.toContain("#fff7ed");

    expect(classifyPersistenceMessage("Conflicto de versiones: el guardado remoto está bloqueado.")).toBe("error");
    expect(classifyPersistenceMessage("No se pudo guardar el expediente en Firebase.")).toBe("error");
    expect(classifyPersistenceMessage("Guardando el perfil completo y sus archivos en Firebase…")).toBe("progress");
    expect(classifyPersistenceMessage("Perfil completo guardado y confirmado por Firebase.")).toBe("confirmed");
    expect(persistenceSummary("Perfil completo guardado y confirmado por Firebase.", "firebase"))
      .toBe("Firebase · copia confirmada");
  });

  it("conserva error visible, detalles técnicos y ruta de recuperación", () => {
    const html = renderToStaticMarkup(createElement(
      WorkspacePersistenceIndicator,
      {
        signedIn: true,
        localMessage: "Expediente guardado en este navegador.",
        remoteMessage: "No se pudo guardar el perfil en Firebase.",
        children: createElement("button", { type: "button" }, "Exportar copia"),
      },
    ));
    expect(html).toContain('role="alert"');
    expect(html).toContain('data-tone="error"');
    expect(html).toContain("No se pudo guardar el perfil en Firebase.");
    expect(html).toContain("Copias y detalles");
    expect(html).toContain("Exportar copia");
    expect(html).not.toContain("app-persistence-warning");
  });

  it("sin sesión remota no declara falsamente sincronización con Firebase", () => {
    const html = renderToStaticMarkup(createElement(
      WorkspacePersistenceIndicator,
      {
        signedIn: false,
        localMessage: "Guardado en navegador",
        remoteMessage: "Perfil completo guardado y confirmado por Firebase.",
        children: createElement("span", null, "Copias"),
      },
    ));
    expect(html).toContain("Sin sesión remota");
    expect(html).not.toContain("Firebase · copia confirmada");
  });

  it("los datos priorizan lectura institucional: sin KPI multicolor, chips activos ni bordes gruesos", () => {
    const data = css("ui/components/ProfileDataPages.css");
    expect(data).toContain(".pdp-domain-chart__measure>i>b.is-local{background:var(--pdp-blue)}");
    expect(data).toContain(".pdp-kpis>.pdp-kpi");
    expect(data).toContain('.external-profile .pdp-tabs button[aria-pressed="true"]');
    const lab = css("ui/components/ProfileEditorialLab.css");
    expect(lab).toContain("background:transparent");
    const admin = css("ui/components/RelasAccess.css");
    expect(admin).toContain(".admin-banner{");
  });
});
