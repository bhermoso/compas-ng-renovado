import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ProfileUpdaterPanel } from "../src/ui/components/ProfileUpdaterPanel";

describe("Actualizador de perfiles: panel", () => {
  it("muestra el cargador del paquete de texto sin necesidad de marcar antes la casilla", () => {
    const html = renderToStaticMarkup(<ProfileUpdaterPanel municipalities={[{ id: "zagra", name: "Zagra" }]} currentId="zagra" onRun={async () => []} />);
    expect(html).toContain("Paquete de texto (compas-profile-text-package/v1)");
    expect(html).toContain('type="file"');
  });
});
