import { describe, expect, it } from "vitest";
import {
  declaredTemporalScope,
  requiresTemporalReview,
  type DocumentTemporalMetadata,
} from "../src/domain/repository/documentTemporalMetadata";

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
