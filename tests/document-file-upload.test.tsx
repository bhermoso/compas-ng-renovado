import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { DocumentFileUpload } from "../src/ui/components/DocumentFileUpload";

const render = (props: { isLoading: boolean; message?: string | null }) =>
  renderToStaticMarkup(
    createElement(DocumentFileUpload, { id: "x", label: "Subir", accept: ".pdf", ...props })
  );

describe("DocumentFileUpload", () => {
  it("indica que no hay archivo y que se registra al elegirlo", () => {
    const html = render({ isLoading: false });
    expect(html).toContain('role="status"');
    expect(html).toContain("Ningún archivo seleccionado");
    expect(html).toContain("Elegir archivo");
  });

  it("muestra el resultado de la carga junto al control", () => {
    expect(render({ isLoading: false, message: "Carga completada: «Informe»." })).toContain(
      "Carga completada: «Informe»."
    );
  });

  it("desactiva el selector y rotula el botón mientras procesa", () => {
    const html = render({ isLoading: true });
    expect(html).toContain("disabled");
    expect(html).toContain("Procesando…");
  });
});
