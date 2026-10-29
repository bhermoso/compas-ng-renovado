/**
 * tests/psl-estado-documental.test.tsx
 *
 * Semántica de estados del documento en la pantalla del Perfil de Salud
 * Local: el usuario debe distinguir sin ambigüedad entre
 *   (1) borrador técnico generado,
 *   (2) Perfil validado técnicamente (pendiente de compilación institucional),
 *   (3) artefacto PSL-C compilado/congelado (el documento institucional).
 *
 * Regla protegida: «documento institucional completo» solo puede aparecer
 * asociado al artefacto PSL-C compilado, nunca al borrador ni al validado.
 */

import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { renderToStaticMarkup } from "react-dom/server";
import { loadWorkspaceFromLocalStorage } from "../src/infrastructure/persistence/local-storage";
import { createMunicipalityRuntime } from './helpers/legacyProfileRuntime';
import { compileLocalHealthProfile } from "../src/application/health-profile-compiler";
import { LocalHealthProfileView } from "../src/ui/components/LocalHealthProfileView";
import type { LocalHealthProfileArtifact } from "../src/domain/health-profile-artifact";
import type { LocalHealthProfile } from "../src/domain/health-profile";
import type { MunicipalityWorkspace } from "../src/domain/workspace";

const store = new Map<string, string>();
(globalThis as { localStorage?: unknown }).localStorage = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => {
    store.set(k, v);
  },
  removeItem: (k: string) => {
    store.delete(k);
  },
  clear: () => store.clear(),
  key: (i: number) => [...store.keys()][i] ?? null,
  get length() {
    return store.size;
  },
};

const EXPORT_PATH = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../fixtures/workspaces/granada-zaidin-synthetic-test.json"
);

let ws: MunicipalityWorkspace;
let generado: LocalHealthProfile;
let validado: LocalHealthProfile;
let artifact: LocalHealthProfileArtifact;

function render(
  psl: LocalHealthProfile,
  compiledProfiles?: LocalHealthProfileArtifact[]
): string {
  return renderToStaticMarkup(
    <LocalHealthProfileView
      psl={psl}
      previewPSL={psl}
      isValidatedPreview={true}
      pslIsStale={false}
      municipalityName={ws.municipality.identity.name}
      compiledProfiles={compiledProfiles}
      onValidate={() => {}}
      onInvalidate={() => {}}
      onCompile={() => {}}
      onEditConclusion={() => {}}
      onEditCierreInterpretativo={() => {}}
      onDocumentarDeliberacion={() => {}}
    />
  );
}

beforeAll(() => {
  store.set(
    "compas-ng:workspace:granada-zaidin",
    readFileSync(EXPORT_PATH, "utf8")
  );
  const loaded = loadWorkspaceFromLocalStorage("granada-zaidin");
  if (loaded === null) throw new Error("El export vigente no rehidrata");
  ws = loaded;
  generado = createMunicipalityRuntime({ workspace: ws }).psl;
  validado = {
    ...generado,
    status: "validated",
    validatedAt: "2026-07-08T12:00:00.000Z",
    validatedBy: "Equipo técnico de salud pública",
  };
  const compilable: LocalHealthProfile = {
    ...validado,
    conclusiones: { ...validado.conclusiones, status: "authored" },
    cierreInterpretativo: { ...validado.cierreInterpretativo, status: "authored" },
    priorizacionStatus: "complete",
    priorizacion: {
      ...validado.priorizacion,
      consensoDocumentado: true,
      deliberacionNota: "El Grupo Motor deliberó y documentó el consenso.",
    },
  };
  const result = compileLocalHealthProfile({
    psl: compilable,
    municipalityName: ws.municipality.identity.name,
    municipalityProvince: ws.municipality.identity.province ?? "",
    existingArtifactCount: 0,
  });
  if (!result.ok) throw new Error("compilación del arnés falló");
  artifact = result.artifact;
}, 60000);

describe("estados documentales — borrador técnico", () => {
  it("el borrador generado no se presenta como documento institucional", () => {
    const html = render(generado);
    expect(html).toContain("Documento de trabajo");
    expect(html).not.toContain("documento institucional completo");
    expect(html).not.toContain("Validado técnicamente");
  });
});

describe("controles de validación técnica", () => {
  it("ofrece validar cuando el Perfil está generado", () => {
    expect(render(generado)).toContain("Validar técnicamente");
  });

  it("ofrece volver a validar cuando el Perfil está en revisión", () => {
    const revision: LocalHealthProfile = {
      ...validado,
      status: "review",
      validatedAt: undefined,
      validatedBy: undefined,
    };
    const html = render(revision);
    expect(html).toContain("En revisión técnica");
    expect(html).toContain("Validar técnicamente");
    expect(html).not.toContain("Retirar validación técnica");
  });

  it("ofrece retirar la validación cuando el Perfil está validado", () => {
    const html = render(validado);
    expect(html).toContain("Retirar validación técnica");
  });
});

describe("estados documentales — validado sin compilar", () => {
  it("«validado» significa validación técnica, con la fase institucional pendiente", () => {
    const html = render(validado);
    expect(html).toContain("Validado técnicamente");
    expect(html).toContain("pendiente de compilación institucional");
    expect(html).toContain(
      "el documento institucional (PSL-C) se crea al compilar"
    );
    expect(html).not.toContain("documento institucional completo");
  });

  it("los espacios de trabajo quedan marcados como fuera del documento institucional", () => {
    const html = render(validado);
    const marcas = html.match(/no forma parte del documento\s+institucional/g) ?? [];
    expect(marcas.length).toBeGreaterThanOrEqual(2);
  });
});

describe("ruta operativa — checklist de compilación PSL-C", () => {
  it("con Perfil validado sin PSL-C aparece la caja con los requisitos pendientes", () => {
    const html = render(validado);
    expect(html).toContain("Crear documento institucional PSL-C");
    expect(html).toContain("Autoría del documento del Perfil");
    expect(html).toContain("Autoría del cierre interpretativo");
    expect(html).toContain("Consenso del Grupo Motor");
    expect(html).toContain("pendiente de compilar");
    expect(html).toContain("Ir a redactar y asumir autoría");
    expect(html).toContain("Ir a documentar deliberación y consenso");
    // Explica exactamente qué falta y no ofrece compilar todavía
    expect(html).toContain("La compilación aún no está disponible: falta");
    expect(html).toContain("asumir la autoría del documento del Perfil");
    expect(html).not.toContain("documento institucional completo");
  });

  it("el checklist no aparece en el borrador sin validar", () => {
    expect(render(generado)).not.toContain("Crear documento institucional PSL-C");
  });

  it("ofrece fuentes e interpretación como opcionales, nunca como requisito", () => {
    const html = render(validado);
    expect(html).toContain("Opcional:");
    expect(html).toContain("incorporar nuevas fuentes territoriales");
    expect(html).toContain('href="#psl-enriquecimiento-fuentes"');
    expect(html).toContain("enriquecer la lectura técnica del Perfil");
    expect(html).toContain('href="#psl-espacio-interpretativo"');
    expect(html).toContain("No es un requisito para compilar");
    // Ninguno aparece entre los requisitos del checklist
    expect(html).not.toContain("falta enriquecer la lectura técnica");
    expect(html).not.toContain("falta incorporar nuevas fuentes");
  });

  it("con requisitos cumplidos ofrece la acción de compilar", () => {
    const listo: LocalHealthProfile = {
      ...validado,
      conclusiones: { ...validado.conclusiones, status: "authored" },
      cierreInterpretativo: {
        ...validado.cierreInterpretativo,
        status: "authored",
      },
      priorizacionStatus: "complete",
      priorizacion: {
        ...validado.priorizacion,
        consensoDocumentado: true,
        deliberacionNota: "El Grupo Motor deliberó y documentó el consenso.",
      },
    };
    const html = render(listo);
    expect(html).toContain("Compilar Perfil de Salud Local");
    expect(html).toContain("asumida");
    expect(html).toContain("documentado");
    expect(html).not.toContain("La compilación aún no está disponible");
  });

  it("con Perfil aprobado pero sin PSL-C conserva la acción de compilar", () => {
    const aprobado: LocalHealthProfile = {
      ...validado,
      status: "approved",
      approvedAt: "2026-09-27T09:00:00.000Z",
      approvedBy: "Grupo Motor del proceso RELAS",
      conclusiones: { ...validado.conclusiones, status: "authored" },
      cierreInterpretativo: {
        ...validado.cierreInterpretativo,
        status: "authored",
      },
      priorizacionStatus: "complete",
      priorizacion: {
        ...validado.priorizacion,
        consensoDocumentado: true,
        deliberacionNota: "El Grupo Motor deliberó y documentó el consenso.",
      },
    };
    const html = render(aprobado);
    expect(html).toContain("Aprobado");
    expect(html).toContain("Crear documento institucional PSL-C");
    expect(html).toContain("Compilar Perfil de Salud Local");
    expect(html).not.toContain("La compilación aún no está disponible");
  });

  it("con PSL-C compilado la caja enlaza al documento y a la descarga DOCX", () => {
    const html = render(validado, [artifact]);
    expect(html).toContain("Documento institucional compilado");
    expect(html).toContain(
      "Ver documento institucional completo y descargar DOCX"
    );
    expect(html).toContain('href="#psl-compilados"');
    expect(html).toContain("Descargar DOCX");
  });
});

describe("narrativa obsoleta — aviso de regeneración", () => {
  it("un PSL validado con generador anterior muestra el aviso; uno actual, no", () => {
    // El PSL validado del arnés procede del generador actual → sin aviso
    expect(render(validado)).not.toContain("Narrativa anterior");
    // Un PSL validado antes de la versión narrativa (campo ausente) → aviso
    const antiguo: LocalHealthProfile = {
      ...validado,
      narrativeGeneratorVersion: undefined,
    };
    const html = render(antiguo);
    expect(html).toContain("Narrativa anterior");
    expect(html).toContain("conserva la narrativa anterior");
    expect(html).toContain("revierte a borrador");
    expect(html).toContain("compilar un nuevo PSL-C");
    // No se invalida ni se sobrescribe nada automáticamente
    expect(html).toContain("pedirá confirmación antes de");
  });
});

describe("ruta operativa — navegación por anclas", () => {
  it("la caja de ruta tiene ancla estable y los enlaces apuntan a anclas existentes", () => {
    const html = render(validado);
    expect(html).toContain('id="psl-ruta-compilacion"');
    // Cada enlace pendiente de la ruta apunta a una sección que existe
    for (const ancla of [
      "psl-autoria-documento",
      "psl-autoria-cierre",
      "psl-deliberacion",
    ]) {
      expect(html).toContain(`href="#${ancla}"`);
      expect(html).toContain(`id="${ancla}"`);
    }
  });

  it("las secciones destino incluyen «Volver a la ruta operativa»", () => {
    const html = render(validado);
    const retornos = html.match(/Volver a la ruta operativa/g) ?? [];
    // Autoría del documento, cierre, deliberación y compilación
    expect(retornos.length).toBeGreaterThanOrEqual(3);
    expect(html).toContain('href="#psl-ruta-compilacion"');
  });

  it("el retorno a la ruta no aparece en el borrador (la ruta no existe)", () => {
    expect(render(generado)).not.toContain("Volver a la ruta operativa");
  });
});

describe("salidas institucionales — bloqueadas antes de compilar, activas después", () => {
  it("con Perfil validado sin PSL-C las salidas aparecen bloqueadas, no activas", () => {
    const html = render(validado);
    expect(html).toContain("Salidas institucionales");
    expect(html).toContain(
      "Estas salidas se activan cuando se crea el artefacto institucional congelado PSL-C"
    );
    // Las cuatro salidas, en estado pendiente/bloqueado
    expect(html).toContain("pendiente de compilar el PSL-C");
    expect(html).toContain("Export DOCX (Word)");
    expect(html).toContain("Export PDF");
    expect(html).toContain("disponible tras compilar");
    expect(html).toContain("Impresión navegador");
    // Sin acciones activas: ni descargas ni acceso al documento
    expect(html).not.toContain("Descargar DOCX");
    expect(html).not.toContain("Descargar PDF");
    expect(html).not.toContain("Ver documento institucional completo");
  });

  it("con PSL-C compilado las salidas están activas y enlazan al artefacto", () => {
    const html = render(validado, [artifact]);
    expect(html).toContain("Salidas institucionales");
    expect(html).toContain("Ver documento institucional completo");
    expect(html).toContain('href="#psl-compilados"');
    // Descargas activas en las salidas Y en la tarjeta del artefacto
    const docx = html.match(/Descargar DOCX \(/g) ?? [];
    const pdf = html.match(/Descargar PDF \(/g) ?? [];
    expect(docx.length).toBeGreaterThanOrEqual(2);
    expect(pdf.length).toBeGreaterThanOrEqual(2);
    // La impresión se explica desde el visor
    expect(html).toContain("Ctrl+P");
    expect(html).not.toContain("pendiente de compilar el PSL-C");
  });
});

describe("estados documentales — PSL-C compilado", () => {
  it("«documento institucional completo» solo aparece con el artefacto congelado", () => {
    const html = render(validado, [artifact]);
    expect(html).toContain("Ver documento institucional completo");
    expect(html).toContain("Compilado como documento institucional");
    expect(html).toContain("Documento congelado");
  });

  it("la descarga DOCX solo existe cuando hay artefacto PSL-C compilado", () => {
    expect(render(generado)).not.toContain("Descargar DOCX");
    expect(render(validado)).not.toContain("Descargar DOCX");
    expect(render(validado, [artifact])).toContain("Descargar DOCX");
  });

  it("la descarga PDF solo existe cuando hay artefacto PSL-C compilado, junto al DOCX", () => {
    expect(render(generado)).not.toContain("Descargar PDF");
    expect(render(validado)).not.toContain("Descargar PDF");
    const html = render(validado, [artifact]);
    expect(html).toContain("Descargar PDF");
    expect(html).toContain("Descargar DOCX");
  });

  it("la frontera con el Plan de Acción permanece intacta en la narrativa", () => {
    const html = render(validado, [artifact]);
    expect(html).toContain("no formula recomendaciones");
    expect(html).not.toMatch(/se recomienda|recomendamos|debe implantarse/i);
  });
});
