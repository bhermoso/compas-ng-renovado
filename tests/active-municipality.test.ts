import { beforeEach, describe, expect, it } from "vitest";
import {
  ACTIVE_MUNICIPALITY_STORAGE_KEY,
  mergeMunicipalityCatalog,
  readActiveMunicipalityId,
  sanitizeCustomMunicipalities,
  saveActiveMunicipalityId,
} from "../src/appWorkspaceHydration";

const store = new Map<string, string>();

(globalThis as { localStorage?: unknown }).localStorage = {
  getItem: (key: string) => store.get(key) ?? null,
  setItem: (key: string, value: string) => {
    store.set(key, value);
  },
  removeItem: (key: string) => {
    store.delete(key);
  },
  clear: () => {
    store.clear();
  },
  key: (index: number) => [...store.keys()][index] ?? null,
  get length() {
    return store.size;
  },
};

const municipalities = [
  { id: "atarfe" },
  { id: "granada-centro" },
];

beforeEach(() => {
  store.clear();
});

describe("ámbito activo del expediente", () => {
  it("restaura el último ámbito elegido y no vuelve siempre a Atarfe", () => {
    expect(readActiveMunicipalityId(municipalities, "granada-centro")).toBe(
      "granada-centro"
    );

    expect(saveActiveMunicipalityId("granada-centro")).toBe(true);
    expect(store.get(ACTIVE_MUNICIPALITY_STORAGE_KEY)).toBe("granada-centro");
    expect(readActiveMunicipalityId(municipalities, "atarfe")).toBe(
      "granada-centro"
    );

    store.set(ACTIVE_MUNICIPALITY_STORAGE_KEY, "ambito-inexistente");
    expect(readActiveMunicipalityId(municipalities, "granada-centro")).toBe(
      "granada-centro"
    );
  });

  it("ordena el catálogo, elimina duplicados y no duplica municipios base como Fuente Vaqueros", () => {
    const base = [
      { id: "fuente-vaqueros", name: "Fuente Vaqueros", province: "Granada" },
      { id: "atarfe", name: "Atarfe", province: "Granada" },
    ];
    const custom = [
      { id: "fuente-vaqueros", name: "Fuente Vaqueros duplicado", province: "Granada" },
      { id: "loja", name: "Loja", province: "Granada" },
      { id: "loja", name: "Loja repetida", province: "Granada" },
    ];

    expect(sanitizeCustomMunicipalities(custom, ["fuente-vaqueros"])).toEqual([
      { id: "loja", name: "Loja", province: "Granada" },
    ]);
    expect(mergeMunicipalityCatalog(base, custom).map((municipality) => municipality.id)).toEqual([
      "atarfe",
      "fuente-vaqueros",
      "loja",
    ]);
  });
});
