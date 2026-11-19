import { describe, expect, it } from "vitest";
import { auditProfileCustody, findUnpublishedValueConflicts } from "../src/application/health-profile/profileCustodyAudit";
import type { ExternalHealthProfile, ExternalProfileLibrary } from "../src/domain/health-profile/ExternalHealthProfile";

const profile = {
  id: "current", municipalityId: "loja",
  title: "Perfil de Salud Local de Loja · revisión 0.6.2 · 18/11/2026",
  attachmentIds: ["json", "pdf"],
  limitations: [
    "Revisión 0.6.0 generada por el Actualizador de perfiles el 18/11/2026.",
    "Revisión 0.6.1 generada por el Actualizador de perfiles el 18/11/2026.",
    "Revisión 0.6.2 generada por el Actualizador de perfiles el 18/11/2026.",
  ],
} as ExternalHealthProfile;

const library = {
  activeId: "current",
  profiles: [profile],
  attachments: [
    { id: "json", name: "Loja_PSL_v0_5_1_2026-11-17.json" },
    { id: "pdf", name: "Loja_PSL_v0_5_1_2026-11-17.pdf" },
  ],
} as ExternalProfileLibrary;

describe("Auditoría documental del Perfil de Salud Local", () => {
  it("no confunde una revisión mencionada en notas con una revisión custodiada", () => {
    const r = auditProfileCustody(profile, library);
    expect(r.currentVersion).toBe("0.6.2");
    expect(r.declaredRevisions).toEqual(["0.6.0", "0.6.1"]);
    expect(r.missingRevisions).toEqual(["0.6.0", "0.6.1"]);
    expect(r.attachmentVersions).toEqual(["0.5.1"]);
    expect(r.distinctOriginal).toBe(true);
  });
  it("si existe un registro anterior, deja de marcarlo como ausente", () => {
    const prior = { ...profile, id: "older", title: "Perfil Loja · revisión 0.6.0" };
    const r = auditProfileCustody(profile, {...library, profiles: [prior,profile]});
    expect(r.missingRevisions).toEqual(["0.6.1"]);
  });
  it("no inventa versiones editoriales a partir de archivos sin numeración", () => {
    const r = auditProfileCustody({...profile, title:"Perfil de Loja",limitations:[]}, {...library, attachments:[{id:"pdf",name:"perfil.pdf"}],profiles:[]});
    expect(r.currentVersion).toBeUndefined();
    expect(r.distinctOriginal).toBe(false);
  });
  it("detecta la contradicción de Loja sin corregir la cifra", () => {
    const text = [
      "Sección | Renta por persona (€) | Bajo el 60 % de la mediana (%) | Gini",
      "03001 | 12.382 | 30,2 | 28,7",
      "03002 | 7.107 | 58,8 | 34,7",
      "03003 | 10.204 | 34,4 | 25,2",
      "La tabla de renta de la sección 03002 no publica un porcentaje exacto bajo umbral.",
    ].join("\n");
    expect(findUnpublishedValueConflicts(text)).toEqual([{section:"03002",displayed:"58,8"}]);
    expect(text).toContain("58,8");
  });
  it("detecta cuando el texto indica primero que no se publica el valor y después nombra la sección", () => {
    const text = [
      "Sección | Renta (€) | Bajo el 60 % | Gini",
      "03002 | 7.107 | 58,8 | 34,7",
      "La tabla territorial del INE no publica un porcentaje exacto bajo umbral para la sección 03002.",
    ].join("\n");
    expect(findUnpublishedValueConflicts(text)).toEqual([{section:"03002",displayed:"58,8"}]);
  });
  it("no acusa contradicción si la tabla declara el valor como no disponible", () => {
    const text = "Sección | Renta | Bajo el 60 %\n03002 | 7.107 | —\nLa tabla de renta de la sección 03002 no publica un porcentaje exacto.";
    expect(findUnpublishedValueConflicts(text)).toEqual([]);
  });
  it("no produce falsas alertas cuando no existe una declaración de secreto", () => {
    expect(findUnpublishedValueConflicts("Sección | Renta | Bajo el 60 %\n03002 | 7.107 | 58,8")).toEqual([]);
  });
});
