import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import {
  assetEntriesOfDocument,
  localizaSaludResourceLines,
} from "../src/application/evidence-pipeline";
import { parseWorkspaceJSON } from "../src/infrastructure/persistence/local-storage";

const HEADER = "Nombre\tDescripción\tSexo\tGrupo\tTema\tProvincia\tLocalidad";

describe("listado de Localiza Salud", () => {
  it("excluye el rótulo y la fila de cabeceras de un listado tabular", () => {
    const text = ["Listado de recursos", HEADER, "ASOCIACIÓN A\tDescripción a", "Taller B\tDescripción b"].join("\n");
    expect(localizaSaludResourceLines(text)).toEqual(["ASOCIACIÓN A\tDescripción a", "Taller B\tDescripción b"]);
  });

  it("conserva todas las líneas si el texto no es tabular", () => {
    const text = "Recurso uno\nRecurso dos";
    expect(localizaSaludResourceLines(text)).toEqual(["Recurso uno", "Recurso dos"]);
  });

  it("el recuento de un documento de Localiza Salud cuenta recursos, no líneas", () => {
    const text = ["Listado de recursos", HEADER, "A\tx", "B\ty"].join("\n");
    expect(assetEntriesOfDocument({ kind: "localiza-salud", sourceText: text })).toHaveLength(2);
  });

  it("los activos comunitarios siguen contando líneas", () => {
    expect(assetEntriesOfDocument({ kind: "community-asset", sourceText: "a\nb\n\nc" })).toHaveLength(3);
  });

  it("el recuento de las semillas no cambia", () => {
    const expected: Record<string, number> = { alfacar: 7, atarfe: 5, "granada-zaidin": 56 };
    for (const [id, n] of Object.entries(expected)) {
      const ws = parseWorkspaceJSON(readFileSync(`public/seeds/compas-ng-workspace-${id}.json`, "utf8"))!;
      const docs = ws.repository.documents.filter((d) => d.kind === "localiza-salud");
      expect(docs.flatMap(assetEntriesOfDocument)).toHaveLength(n);
    }
  });
});
