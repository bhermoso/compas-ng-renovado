/** CONTRACT-PROFILE-UPDATER §6–§7: conclusiones vinculadas y paquetes de texto. */
import { describe, expect, it } from "vitest";
import { applyTextPackage, dependentRecommendations, evaluateConditions, parseTextPackage, refreshBindings } from "../src/application/health-profile/profileTextOperations";
import { buildProfileUpdate } from "../src/application/health-profile/profileUpdater";
import type { ExternalHealthProfile } from "../src/domain/health-profile/ExternalHealthProfile";
import type { TerritorialStatisticsSnapshot } from "../src/domain/territorial-statistics/TerritorialStatistics";

const text = [
  "2. Conclusiones", "Una lectura de conjunto", "La renta es más baja, pero menos concentrada.",
  "C1. Primera conclusión.",
  "C14. La renta está menos concentrada. En 2024 el índice de Gini es 28,3, frente a 32,0 en la provincia. La razón P80/P20 es 2,4 y 28,30 no cambia.",
  "5. Recomendaciones", "R1. Bienestar", "Conocer. Algo.", "Fundamento: C1.", "R7. Equidad", "Abordar. Algo.", "Fundamento: C1, C14.",
  "7. Autoría y revisión", "Perfil elaborado.", "Referencias", "1. Informe.", "T31025. INE. Renta.", "Anexo A. Fuentes",
].join("\n\n");
const snap = (gini: number, prov: number, year = "2025"): TerritorialStatisticsSnapshot => ({
  schema: "compas-territorial-statistics/v1", id: "s", municipalityId: "alfacar", municipalityName: "Alfacar", ineCode: "18011",
  retrievedAt: "2027-11-18T08:00:00.000Z", catalogVersion: "2026-11-18", failures: [], sources: [{ id: "ine-37698", provider: "INE", product: "ADRH", table: "37698", title: "Gini", url: "u" }],
  observations: [
    { indicatorId: "adrh-gini", label: "Gini", territoryCode: "18011", territoryName: "Alfacar", level: "municipio", period: year, value: gini, literal: String(gini).replace(".", ","), unit: "índice", sourceId: "ine-37698" },
    { indicatorId: "adrh-gini", label: "Gini", territoryCode: "18", territoryName: "Granada", level: "provincia", period: year, value: prov, literal: String(prov).replace(".", ","), unit: "índice", sourceId: "ine-37698" },
  ],
});
const bindings = [
  { target: "C14", ref: { indicatorId: "adrh-gini", level: "municipio" as const }, field: "value" as const, literal: "28,3" },
  { target: "C14", ref: { indicatorId: "adrh-gini", level: "municipio" as const }, field: "period" as const, literal: "2024" },
];
const conditions = [{ target: "C14", statement: "el Gini municipal es inferior al provincial", left: { indicatorId: "adrh-gini", level: "municipio" as const }, op: "<" as const, right: { indicatorId: "adrh-gini", level: "provincia" as const } }];

describe("capa 2: cifras enlazadas y condiciones", () => {
  it("refresca la cifra y el año sin tocar números más largos", () => {
    const r = refreshBindings(text, bindings, snap(27.9, 31.5));
    expect(r.text).toContain("En 2025 el índice de Gini es 27,9, frente a 32,0");
    expect(r.text).toContain("28,30 no cambia");
    expect(r.bindings.map(b => b.literal)).toEqual(["27,9", "2025"]);
    expect(r.flags).toEqual([]);
  });
  it("marca la conclusión y sus recomendaciones si la condición deja de cumplirse", () => {
    const flags = evaluateConditions(conditions, snap(33.1, 31.5));
    expect(flags).toMatchObject([{ target: "C14", reason: "Ya no se cumple que el Gini municipal es inferior al provincial (33.1 frente a 31.5).", check: { kind: "condition" } }]);
    expect(dependentRecommendations(text, ["C14"])).toMatchObject([{ target: "R7", reason: "Se apoya en C14, marcada para revisar.", check: { kind: "recommendation" } }]);
  });
  it("marca la cifra si el texto ya no la contiene", () => {
    const changedText = text.replace("28,3", "veintiocho");
    const r = refreshBindings(changedText, bindings.slice(0, 1), snap(28.3, 31.5));
    expect(r.text).toBe(changedText);
    expect(r.flags[0].reason).toMatch(/No se encuentra «28,3» en C14/);
  });
  it("resuelve cada literal sobre el texto anterior aunque otra sustitución escriba el mismo número", () => {
    const s = snap(32, 30);
    s.observations[0].literal = "32,0";
    s.observations[1].literal = "30,0";
    const provincial = { ...bindings[0], ref: { ...bindings[0].ref, level: "provincia" as const, territoryCode: "18" }, literal: "32,0" };
    const r = refreshBindings(text, [bindings[0], provincial], s);
    expect(r.text).toContain("el índice de Gini es 32,0, frente a 30,0 en la provincia");
    expect(r.bindings.map(b => b.literal)).toEqual(["32,0", "30,0"]);
    expect(r.flags).toEqual([]);
  });
  it("exige una aparición inequívoca dentro de la lectura de conjunto", () => {
    const lecture = text.replace("La renta es más baja, pero menos concentrada.", "Primera cifra, 28,3.\n\nSegunda cifra, 28,3.");
    const binding = { ...bindings[0], target: "LECTURA" };
    const ambiguous = refreshBindings(lecture, [binding], snap(27.9, 31.5));
    expect(ambiguous.text).toBe(lecture);
    expect(ambiguous.flags[0].reason).toMatch(/inequívoca/);
    const resolved = refreshBindings(lecture, [{ ...binding, occurrence: 2 }], snap(27.9, 31.5));
    expect(resolved.text).toContain("Primera cifra, 28,3.\n\nSegunda cifra, 27,9.");
    expect(resolved.text).toContain("En 2024 el índice de Gini es 28,3");
    expect(resolved.flags).toEqual([]);
  });
  it("un valor bajo secreto estadístico conserva su última cifra y su año juntos", () => {
    const s = snap(28.3, 31.5);
    s.observations[0] = { ...s.observations[0], literal: "Secreto estadístico", value: null, secret: true };
    const r = refreshBindings(text, bindings, s);
    expect(r.text).toBe(text);
    expect(r.bindings).toEqual(bindings);
    expect(r.flags.map(f => f.check?.kind)).toEqual(["binding", "binding"]);
  });
});

describe("capa 3: paquete de texto", () => {
  const entry = { municipalityId: "alfacar", baseTitle: "Perfil · revisión 0.9.0 · 18/11/2026", operations: [
    { op: "replace-section" as const, heading: "Una lectura de conjunto", paragraphs: ["Nueva lectura de conjunto."] },
    { op: "upsert-conclusion" as const, id: "C15", text: "C15. Nueva conclusión." },
    { op: "upsert-conclusion" as const, id: "C1", text: "C1. Primera conclusión revisada." },
    { op: "set-fundamento" as const, recommendation: "R1", conclusions: ["C1", "C15"] },
    { op: "add-references" as const, references: ["T31025. Duplicada.", "B120971. IECA. Desempleo."] },
    { op: "set-links" as const, bindings, conditions },
  ] };
  it("valida el formato", () => {
    expect(() => parseTextPackage({ schema: "otro" })).toThrow(/no es un paquete/);
    expect(() => parseTextPackage({ schema: "compas-profile-text-package/v1", entries: [{ municipalityId: "a", baseTitle: "b", operations: [{ op: "upsert-conclusion", id: "C2", text: "C3. mal" }] }] })).toThrow(/Operación no válida/);
  });
  it("aplica las operaciones en su sitio", () => {
    const r = applyTextPackage({ text }, entry);
    expect(r.problems).toEqual([]);
    const ps = r.text.split("\n\n");
    expect(ps.slice(1, 6)).toEqual(["Una lectura de conjunto", "Nueva lectura de conjunto.", "C1. Primera conclusión revisada.", ps[4], "C15. Nueva conclusión."]);
    expect(ps).toContain("Fundamento: C1, C15.");
    expect(ps.filter(p => p.startsWith("T31025."))).toHaveLength(1);
    expect(ps.indexOf("B120971. IECA. Desempleo.")).toBeLessThan(ps.indexOf("Anexo A. Fuentes"));
    expect(r.bindings).toHaveLength(2);
  });
  it("rechaza todo el paquete cuando R1 carece de fundamento, aunque R7 tenga uno", () => {
    const base = { text: text.replace("\n\nFundamento: C1.", ""), bindings, conditions };
    const r = applyTextPackage(base, { ...entry, operations: [
      { op: "upsert-conclusion", id: "C1", text: "C1. Una sustitución válida." },
      { op: "set-fundamento", recommendation: "R1", conclusions: ["C1", "C14"] },
    ] });
    expect(r).toEqual({ ...base, changes: [], problems: ["No se encuentra un fundamento único en R1."] });
  });
  it("rechaza una conclusión repetida como destino", () => {
    const base = { text: text.replace("C1. Primera conclusión.", "C1. Primera conclusión.\n\nC1. Otra conclusión.") };
    const r = applyTextPackage(base, { ...entry, operations: [{ op: "upsert-conclusion", id: "C1", text: "C1. Sustitución." }] });
    expect(r.text).toBe(base.text);
    expect(r.problems).toEqual(["La conclusión C1 aparece más de una vez."]);
  });
  it("el actualizador aplica el paquete, refresca cifras y marca lo que ya no se sostiene", () => {
    const base: ExternalHealthProfile = { schema: "compas-external-profile/v1", id: "v090", municipalityId: "alfacar", title: "Perfil · revisión 0.9.0 · 18/11/2026", period: "", author: "", createdAt: "2026-11-18T00:00:00Z", status: "validated", validatedBy: "B", validatedAt: "2026-11-18T01:00:00Z", summary: "", text, results: [], findings: [], limitations: [], areas: [], attachmentIds: [] };
    const library = { profiles: [base], attachments: [], activeId: "v090" };
    const pkg = parseTextPackage({ schema: "compas-profile-text-package/v1", createdAt: "2026-11-18", author: "B", note: "prueba", entries: [entry] });
    const r = buildProfileUpdate({ library, snapshots: [snap(33.1, 31.5)], kinds: ["paquete-texto", "cifras-conclusiones"], textPackage: pkg, author: "B", now: new Date("2027-11-18T10:00:00Z"), newId: () => "n" });
    expect(r.blocked).toBeUndefined();
    expect(r.profile!.text).toContain("el índice de Gini es 33,1");
    expect(r.profile!.reviewFlags!.map(f => f.target)).toEqual(["C14", "R7"]);
    expect(r.profile!.title).toBe("Perfil · revisión 0.10.0 · 18/11/2027");
    const chosen = { ...library, profiles: [{ ...base, choices: [{ target: "C1", decision: "chosen" as const, by: "B", at: "2026-11-18T01:00:00Z" }] }] };
    const fresh = buildProfileUpdate({ library: chosen, snapshots: [snap(33.1, 31.5)], kinds: ["paquete-texto", "cifras-conclusiones"], textPackage: pkg, author: "B", now: new Date("2027-11-18T10:00:00Z"), newId: () => "n" });
    // La revisión nueva se presenta como menú sin elegir (custodia §7.1).
    expect(fresh.profile!.choices).toBeUndefined();
    const other = buildProfileUpdate({ library: { ...library, profiles: [{ ...base, title: "Perfil · revisión 0.8.2 · 17/11/2026" }] }, kinds: ["paquete-texto"], textPackage: pkg, author: "B", now: new Date(), newId: () => "n" });
    expect(other.blocked).toMatch(/se redactó sobre/);
  });
  it("conserva las marcas sin comprobar y resuelve las que vuelven a cumplir su condición", () => {
    const legacy = { target: "C1", reason: "Verificar la fuente." };
    const base: ExternalHealthProfile = {
      schema: "compas-external-profile/v1", id: "v090", municipalityId: "alfacar", title: entry.baseTitle,
      period: "", author: "", createdAt: "2026-11-18T00:00:00Z", status: "validated",
      summary: "", text, results: [], findings: [], limitations: [], areas: [], attachmentIds: [],
      conditions, reviewFlags: [legacy],
    };
    const update = (profile: ExternalHealthProfile, snapshot: TerritorialStatisticsSnapshot) =>
      buildProfileUpdate({
        library: { profiles: [{ ...profile, status: "validated" }], attachments: [], activeId: profile.id },
        snapshots: [snapshot], kinds: ["cifras-conclusiones"], author: "B",
        now: new Date("2027-11-18T10:00:00Z"), newId: () => "siguiente",
      });
    const failed = update(base, snap(33.1, 31.5)).profile!;
    expect(failed.reviewFlags).toMatchObject([
      legacy, { target: "C14", check: { kind: "condition" } },
      { target: "R1", check: { kind: "recommendation" } }, { target: "R7", check: { kind: "recommendation" } },
    ]);
    expect(update(failed, snap(33.1, 31.5)).blocked).toBe("Los cambios elegidos no modifican este Perfil.");
    const resolved = update(failed, snap(27.9, 31.5)).profile!;
    expect(resolved.reviewFlags?.map(f => f.target)).toEqual(["C1", "R1", "R7"]);
    expect(resolved.reviewFlags!.find(f => f.target === "R7")?.reason).toBe("Se apoya en C1, marcada para revisar.");
  });
});
