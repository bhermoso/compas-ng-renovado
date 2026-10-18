import { describe, it, expect } from "vitest";
import { extractNumberedOpenAnswers } from "../src/application/evidence-pipeline";
import { transformDocumentToEvidence } from "../src/application/evidence-pipeline";
import { createEvidenceStore } from "../src/domain/evidence";
import type { MunicipalDocument } from "../src/domain/repository";

const TEXT = `[Página 1]
CUESTIONARIO DE IDENTIFICACIÓN
DATOS DE LA MUESTRA

[Página 2]
3.1 Si consideras que se identifican otros problemas, descríbelos.
1. No
2. Aunque no se refleje, la pandemia ha acentuado la soledad
de las personas mayores y su aislamiento
3. Falta trabajo para los jóvenes
4. no
5. Baja autoestima
[Página 3]
Teniendo en cuenta lo anterior, ¿Cómo se podría mejorar la salud?
1. Menos lista de espera
2. Más programas de prevención
3. Charlas en los colegios
4. Comiendo mejor
5. Más ejercicio
6. Menos vehículos`;

const doc = (kind: MunicipalDocument["kind"]): MunicipalDocument => ({
  id: "d1",
  municipalityId: "fv",
  kind,
  title: "Informe de factores",
  status: "uploaded",
  source: {},
  canGenerateEvidence: true,
  tags: [kind],
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
});

describe("respuestas abiertas numeradas", () => {
  it("agrupa por pregunta y une las líneas de continuación en una sola respuesta", () => {
    const r = extractNumberedOpenAnswers(TEXT)!;
    expect(r.groups).toHaveLength(2);
    expect(r.groups.map((g) => g.answers.length)).toEqual([5, 6]);
    expect(r.totalAnswers).toBe(11);
    expect(r.groups[0].answers[1].text).toBe(
      "Aunque no se refleje, la pandemia ha acentuado la soledad de las personas mayores y su aislamiento"
    );
    expect(r.groups[0].answers[0].page).toBe(2);
    expect(r.groups[1].answers[0].page).toBe(3);
    expect(r.groups[1].question).toContain("¿Cómo se podría mejorar");
  });

  it("no reconoce series cortas ni listas sin pregunta previa", () => {
    expect(extractNumberedOpenAnswers("1. a\n2. b\n3. c\n4. d\n5. e")).toBeNull();
    expect(extractNumberedOpenAnswers("¿Pregunta?\n1. a\n2. b")).toBeNull();
  });

  it("genera una unidad por respuesta, sin clasificar por palabras clave, más la cautela de alcance", () => {
    const store = createEvidenceStore({ municipalityId: "fv" });
    const res = transformDocumentToEvidence({
      store,
      document: doc("territorial-documentation"),
      plainText: TEXT,
      structure: "open-answers",
    });
    const answers = res.atomsCreated.filter((a) => a.kind === "participation");
    expect(answers).toHaveLength(11);
    expect(res.atomsCreated.filter((a) => a.kind === "determinant")).toHaveLength(0);
    const cautions = res.atomsCreated.filter((a) => a.kind === "methodological-caution");
    expect(cautions).toHaveLength(1);
    expect(cautions[0].content).toContain("11 respuestas abiertas en 2 preguntas");
    expect(answers[1].provenance.page).toBe(2);
    expect(answers[1].provenance.field).toContain("3.1");
    expect(answers.every((a) => a.methodology.requiresHumanValidation)).toBe(true);
  });

  it("si se declara la estructura y el texto no la tiene, no atomiza por líneas", () => {
    const store = createEvidenceStore({ municipalityId: "fv" });
    const res = transformDocumentToEvidence({
      store,
      document: doc("territorial-documentation"),
      plainText: "Texto corrido sin respuestas numeradas.\nOtra línea.",
      structure: "open-answers",
    });
    expect(res.atomsCreated).toHaveLength(0);
  });

  it("sin declarar estructura el comportamiento anterior no cambia", () => {
    const store = createEvidenceStore({ municipalityId: "fv" });
    const res = transformDocumentToEvidence({
      store,
      document: doc("territorial-documentation"),
      plainText: "Línea uno\nLínea dos",
    });
    expect(res.atomsCreated).toHaveLength(2);
  });
});
