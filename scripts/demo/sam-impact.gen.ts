import { it, vi, expect } from "vitest";
import { readFileSync, writeFileSync } from "node:fs";
import { basename } from "node:path";
import { createMunicipalityRuntime } from "../../src/application/runtime";
import type { MunicipalityWorkspace } from "../../src/domain/workspace";

// Reproduce at each revision; compare JSON fields, excluding no semantic data.
it("captures deterministic runtime outputs for the SAM before/after audit", () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-28T12:00:00.000Z"));
  vi.spyOn(crypto, "randomUUID").mockReturnValue("00000000-0000-4000-8000-000000000000");
  const output: Record<string, unknown> = {};
  for (const name of ["atarfe", "granada-zaidin"]) {
    const w = JSON.parse(readFileSync(`public/seeds/compas-ng-workspace-${name}.json`, "utf8")) as MunicipalityWorkspace;
    const before = structuredClone(w);
    const runtime = createMunicipalityRuntime({ workspace: w });
    output[name] = runtime;
    expect(w).toEqual(before);
  }
  writeFileSync(process.env.SAM_IMPACT_OUTPUT ?? `../sam-impact-${basename(process.cwd())}.json`, JSON.stringify(output, null, 2));
  vi.restoreAllMocks();
  vi.useRealTimers();
});
