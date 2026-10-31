import { describe, expect, it } from "vitest";
import {
  declaredTemporalScope,
  requiresTemporalReview,
  type DocumentTemporalMetadata,
} from "../src/domain/repository/documentTemporalMetadata";
import { addMunicipalDocument, createMunicipalDocumentRepository, setMunicipalDocumentTemporalMetadata } from "../src/domain/repository";

describe("temporalidad documental declarada", () => {
  it("no infiere ciclo actual de un documento fechado en 2026", () => {
    const data: DocumentTemporalMetadata = {
      documentDate: { value: "2026", precision: "year" },
      temporalScope: "current",
      suggestions: [{ field: "temporalScope", value: "current", source: "filename", confidence: 0.9 }],
    };
    expect(declaredTemporalScope(data)).toBe("undetermined");
    expect(requiresTemporalReview(data)).toBe(true);
  });

  it("admite una norma antigua vigente sin confundir vigencia con alcance temporal", () => {
    const data: DocumentTemporalMetadata = {
      documentDate: { value: "2024", precision: "year" },
      validity: "valid",
      temporalScope: "current",
      declaration: { declaredBy: "equipo", declaredAt: "2026-10-31T10:00:00Z", referenceDate: "2026-10-31" },
    };
    expect(declaredTemporalScope(data)).toBe("current");
    expect(requiresTemporalReview(data)).toBe(false);
  });

  it("distingue exportación y período observado", () => {
    const data: DocumentTemporalMetadata = {
      documentDate: { value: "2026-10", precision: "month" },
      observedPeriod: {
        from: { value: "2026-05", precision: "month" },
        to: { value: "2026-05", precision: "month" },
      },
      temporalScope: "historical",
      declaration: { declaredBy: "equipo", declaredAt: "2026-10-31T10:00:00Z", referenceDate: "2026-10-31" },
    };
    expect(data.documentDate?.value).not.toBe(data.observedPeriod?.from?.value);
    expect(declaredTemporalScope(data)).toBe("historical");
  });

  it("mantiene como indeterminado el alcance no clasificado", () => {
    expect(declaredTemporalScope(undefined)).toBe("undetermined");
    expect(requiresTemporalReview({ suggestions: [] })).toBe(true);
  });
});

describe("integración retrocompatible con repositorio municipal", () => {
  it("mantiene un documento legado sin metadatos temporales", () => {
    const base = createMunicipalDocumentRepository({ municipalityId: "zagra" });
    const repo = addMunicipalDocument(base, { id: "doc-1", kind: "health-report", title: "Informe legado", cycle: { status: "historical", referenceYear: 2017 } });
    expect(repo.documents[0].temporal).toBeUndefined();
    expect(repo.documents[0].cycle).toEqual({ status: "historical", referenceYear: 2017 });
    expect(requiresTemporalReview(repo.documents[0].temporal)).toBe(true);
  });

  it("añade la temporalidad sin alterar el ciclo legado ni otras fuentes", () => {
    const base = createMunicipalDocumentRepository({ municipalityId: "zagra" });
    const repo = addMunicipalDocument(addMunicipalDocument(base, {
      id: "doc-1", kind: "health-report", title: "Informe", cycle: { status: "historical", referenceYear: 2017 },
    }), { id: "doc-2", kind: "other", title: "Otro" });
    const updated = setMunicipalDocumentTemporalMetadata(repo, "doc-1", {
      observedPeriod: { literal: "2015-2016" },
      temporalScope: "historical",
      declaration: { declaredBy: "tecnico", declaredAt: "2026-10-31T09:00:00Z", referenceDate: "2026-10-31" },
    });
    expect(updated.documents[0].cycle).toEqual(repo.documents[0].cycle);
    expect(updated.documents[1]).toBe(repo.documents[1]);
    expect(declaredTemporalScope(updated.documents[0].temporal)).toBe("historical");
    const cleared = setMunicipalDocumentTemporalMetadata(updated, "doc-1", undefined);
    expect(cleared.documents[0].temporal).toBeUndefined();
    expect(cleared.documents[0].cycle).toEqual(repo.documents[0].cycle);
    expect(setMunicipalDocumentTemporalMetadata(repo, "missing", undefined)).toBe(repo);
  });
});
