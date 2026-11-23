import { describe, expect, it } from "vitest";
import { createSerialQueue } from "../src/infrastructure/relas/serialQueue";

describe("guardados remotos en serie", () => {
  it("cada tarea empieza cuando termina la anterior y ve la revisión que esta dejó", async () => {
    const enqueue = createSerialQueue();
    let revision = 0;
    const seen: number[] = [];
    const save = () => enqueue(async () => {
      const base = revision;
      seen.push(base);
      await new Promise(resolve => setTimeout(resolve, 5));
      if (revision !== base) throw new Error("revisión diferente");
      revision = base + 1;
    });
    await Promise.all([save(), save(), save()]);
    expect(seen).toEqual([0, 1, 2]);
    expect(revision).toBe(3);
  });

  it("un fallo no bloquea los guardados siguientes", async () => {
    const enqueue = createSerialQueue();
    const first = enqueue(async () => { throw new Error("falla"); });
    const second = enqueue(async () => "ok");
    await expect(first).rejects.toThrow("falla");
    await expect(second).resolves.toBe("ok");
  });
});
