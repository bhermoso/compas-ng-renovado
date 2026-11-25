import { describe, expect, it } from "vitest";
import { externalProfileIsStale } from "../src/application/runtime/MunicipalityRuntime";

describe("vigencia de la evidencia del Perfil externo", () => {
  const store = "2026-11-24T10:08:38.388Z";

  it("no avisa si la evidencia es la misma con la que se incorporó", () => {
    expect(externalProfileIsStale({ evidenceVersion: store, status: "review" }, store)).toBe(false);
  });

  it("avisa si la evidencia cambió y el Perfil sigue en revisión", () => {
    expect(externalProfileIsStale({ evidenceVersion: "2026-11-10T06:20:22.198Z", status: "review" }, store)).toBe(true);
  });

  it("no avisa si el Perfil se validó después del último cambio de evidencia", () => {
    expect(externalProfileIsStale({ evidenceVersion: "2026-11-10T06:20:22.198Z", status: "validated", validatedAt: "2026-11-24T18:43:20.787Z" }, store)).toBe(false);
  });

  it("avisa si la evidencia cambió después de la validación", () => {
    expect(externalProfileIsStale({ evidenceVersion: "2026-11-10T06:20:22.198Z", status: "validated", validatedAt: "2026-11-20T09:00:00.000Z" }, store)).toBe(true);
  });

  it("sin versión de evidencia registrada no hay aviso", () => {
    expect(externalProfileIsStale({ status: "validated" }, store)).toBe(false);
  });
});
