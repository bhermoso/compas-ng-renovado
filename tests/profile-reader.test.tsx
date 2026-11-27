import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { profileAttachmentEdition } from "../src/application/health-profile/profileCustodyAudit";
import { parseProfileStructure } from "../src/application/health-profile/profileStructure";
import { ProfileReader } from "../src/ui/components/ProfileReader";

const title = "Perfil de Salud Local de Loja · revisión 0.7.0 · 24/11/2026";
const structure = parseProfileStructure([
  "Portada y créditos",
  "Identificación de la autoría.",
  "Loja en datos",
  "Resumen. Datos municipales.",
  "1. Punto de partida",
  "El diagnóstico municipal parte de sus fuentes locales.",
  "2. Conclusiones",
  "Una lectura de conjunto",
  "Las fuentes sitúan el contexto de la prevención.",
  "C1. La prevención merece atención en el municipio.",
  "Lleva a R1 y R2.",
  "5. Recomendaciones del Perfil",
  "R1. Abordar. Valorar la prevención con los servicios.",
  "Fundamento: C1.",
  "R2. Conocer. Medir la actividad física en el municipio.",
  "Fundamento: C1.",
  "Anexos",
  "E. Tabla de trazabilidad de las conclusiones",
  "Fuente del anexo. Informe municipal de 2026.",
  "Referencias",
  "Ficha de la fuente municipal.",
].join("\n\n"));

describe("Lectura y exportación del Perfil", () => {
  it.each([false, true])("conserva el anexo y el orden documental (impresión: %s)", printable => {
    const html = renderToStaticMarkup(
      <ProfileReader structure={structure} title={title} statusLabel="En revisión técnica" discarded={new Set(["R2"])} printable={printable} />,
    );
    expect(html.match(/id="epr-C1"/g)).toHaveLength(1);
    expect(html).toContain("Fuente del anexo. Informe municipal de 2026.");
    expect(html.indexOf('id="epr-R1"')).toBeLessThan(html.indexOf('id="epr-R2"'));
    expect(html).toContain('href="#epr-R1"');
    expect(html).toContain('href="#epr-C1"');
    expect(html).toContain("Descartada por el equipo técnico");
    expect(html).toContain("Identificación de la autoría.");
    if (printable) {
      expect(html).toContain('id="epr-preliminaries" open=""');
      expect(html).toContain("En revisión técnica");
      expect(html).not.toContain("Buscar en el perfil");
    }
  });

  it("identifica la edición declarada en el nombre del PDF", () => {
    expect(profileAttachmentEdition("Loja_PSL_v0_5_1_2026-11-17.pdf")).toEqual({
      version: "0.5.1", date: "17/11/2026",
    });
    expect(profileAttachmentEdition("Perfil.pdf")).toEqual({ version: undefined, date: undefined });
  });
});
