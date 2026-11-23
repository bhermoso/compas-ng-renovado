/**
 * Generador del expediente de ensayo neutro («Municipio de ensayo»).
 *
 * No representa a ningún municipio real:
 *  - Los 13 estudios complementarios conservan sus agregados de ensayo: los de la Encuesta Andaluza de Salud son agregados
 *    provinciales públicos de Granada («proxy piloto») y los demás proceden de
 *    las fixtures municipales sintéticas de `fixtures/*.csv`. No se atribuyen a
 *    ningún municipio.
 *  - El Informe de Salud es un texto de ensayo escrito para las pruebas; sus
 *    cifras no proceden de ninguna fuente.
 *  - Los activos de Localiza son de ensayo y se incorporan con el mismo servicio
 *    de carga que usa la aplicación.
 *
 * Uso (al cambiar el texto de ensayo o los activos):
 *   npx vitest run --config vitest.rebuild.config.ts scripts/demo/build-municipio-ensayo.gen.ts
 * Los estudios se toman del propio expediente de ensayo.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { it } from "vitest";
import { parseHealthReportSections } from "../../src/application/health-report/HealthReportSectionParser";
import { ingestManualDocument } from "../../src/application/document-ingestion/ManualDocumentIngestionService";
import type { MunicipalityWorkspace } from "../../src/domain/workspace";

const ROOT = resolve(__dirname, "../..");
const TARGET = resolve(ROOT, "fixtures/workspaces/municipio-ensayo-synthetic-test.json");
const ID = "municipio-ensayo";
const NAME = "Municipio de ensayo";
const NOW = "2026-11-21T00:00:00.000Z";

export const INFORME_DE_ENSAYO = [
  "INFORME DE LA SITUACIÓN DE SALUD DEL MUNICIPIO DE ENSAYO",
  "",
  "Documento de ensayo para pruebas automáticas. No describe ningún territorio real.",
  "",
  "1. INTRODUCCIÓN",
  "",
  "Este informe de ensayo reproduce la estructura habitual de un Informe de Salud municipal para comprobar la lectura, la compilación y la trazabilidad del Perfil de Salud Local en COMPÁS.",
  "",
  "2. METODOLOGÍA",
  "",
  "Se describen fuentes de ensayo con la misma organización que un informe real: padrón, indicadores de morbilidad y mortalidad, Encuesta Andaluza de Salud y activos para la salud.",
  "",
  "3. ANÁLISIS SOCIODEMOGRÁFICO Y ECONÓMICO",
  "",
  "Población de ensayo: 20.000 habitantes. Población de 65 años o más: 18,0 %. Índice de envejecimiento de ensayo: 120. Tasa de paro registrada de ensayo: 15,0 %.",
  "",
  "4. ANÁLISIS EPIDEMIOLÓGICO",
  "",
  "Mortalidad: las enfermedades del sistema circulatorio y los tumores son las primeras causas en el conjunto de datos de ensayo.",
  "",
  "Morbilidad: la hipertensión arterial, la diabetes y los trastornos de ansiedad son los problemas de salud más registrados en atención primaria en los datos de ensayo.",
  "",
  "Cáncer: el cribado de cáncer de mama alcanza una cobertura de ensayo del 70,0 %.",
  "",
  "Vacunación: la cobertura de vacunación antigripal en mayores de 65 años es del 60,0 % en los datos de ensayo.",
  "",
  "5. ANÁLISIS DE LA ENCUESTA ANDALUZA DE SALUD. PROBLEMAS DE SALUD Y FACTORES DE RIESGO",
  "",
  "Sedentarismo de ensayo: 30,0 %. Consumo de tabaco de ensayo: 22,0 %. Apoyo social bajo de ensayo: 10,0 %.",
  "",
  "6. RECURSOS Y ACTIVOS EN SALUD",
  "",
  "El municipio de ensayo cuenta con un centro de salud, un centro de participación activa, asociaciones vecinales y espacios deportivos.",
  "",
  "7. DISCUSIÓN",
  "",
  "Los datos de ensayo sitúan el envejecimiento, la salud mental y los hábitos de vida como ámbitos de interés para la deliberación.",
  "",
  "8. CONCLUSIONES",
  "",
  "Conclusión de ensayo 1: el envejecimiento de la población requiere atención a la autonomía y la soledad no deseada.",
  "Conclusión de ensayo 2: el bienestar emocional y la salud mental muestran necesidades en la población adulta.",
  "Conclusión de ensayo 3: el sedentarismo y el tabaco son factores de riesgo prioritarios.",
].join("\n");

/** Activos de ensayo en el formato de Localiza Salud (8 columnas) y con su vocabulario de temáticas y poblaciones. */
export const LOCALIZA_DE_ENSAYO = [
  "Centro de participación activa de ensayo\tEspacio de ensayo para personas mayores con talleres de memoria, actividad física suave y voluntariado.\tCualquiera\tMayores de 64 años\tEnvejecimiento activo, Actividad física, Participación y acción comunitaria, Bienestar emocional\tMunicipio de ensayo\tMunicipio de ensayo\t+ info",
  "Asociación vecinal de ensayo\tAsociación de ensayo que organiza actividades de convivencia y difunde información de salud en el barrio.\tCualquiera\tPoblación general\tParticipación y acción comunitaria, Cultura y ocio, Bienestar emocional\tMunicipio de ensayo\tMunicipio de ensayo\t+ info",
  "Grupo de ayuda mutua de ensayo\tGrupo de ensayo de apoyo emocional entre iguales, con sesiones semanales.\tCualquiera\tAdultos (30-64 años), Jóvenes (18-29 años)\tBienestar emocional, Prevención del suicidio\tMunicipio de ensayo\tMunicipio de ensayo\t+ info",
  "Polideportivo municipal de ensayo\tInstalación deportiva de ensayo con programas de actividad física para todas las edades.\tCualquiera\tPoblación general, Mayores de 64 años\tActividad física, Envejecimiento activo\tMunicipio de ensayo\tMunicipio de ensayo\t+ info",
  "Escuela de pacientes de ensayo\tPrograma formativo de ensayo para personas con enfermedades crónicas y personas cuidadoras.\tCualquiera\tAdultos (30-64 años), Mayores de 64 años\tEnfermedades crónicas, Escuela de salud/formación, Personas cuidadoras\tMunicipio de ensayo\tMunicipio de ensayo\t+ info",
  "Huerto comunitario de ensayo\tHuerto de ensayo gestionado por vecinas y vecinos, con talleres de alimentación.\tCualquiera\tPoblación general\tAlimentación saludable, Naturaleza, Participación y acción comunitaria\tMunicipio de ensayo\tMunicipio de ensayo\t+ info",
  "Asociación de mujeres de ensayo\tAsociación de ensayo que trabaja la igualdad y la salud de las mujeres.\tMujeres\tAdultos (30-64 años)\tGénero/identidad, Salud sexual y reproductiva, Bienestar emocional\tMunicipio de ensayo\tMunicipio de ensayo\t+ info",
  "Centro joven de ensayo\tEspacio de ensayo para jóvenes con actividades de ocio saludable y prevención.\tCualquiera\tAdolescentes (12-17 años), Jóvenes (18-29 años)\tCultura y ocio, Bienestar emocional, Escuela de salud/formación\tMunicipio de ensayo\tMunicipio de ensayo\t+ info",
  "Programa de acompañamiento de ensayo\tVoluntariado de ensayo que acompaña a personas mayores que viven solas.\tCualquiera\tMayores de 64 años\tEnvejecimiento activo, Bienestar emocional, Personas en riesgo de exclusión\tMunicipio de ensayo\tMunicipio de ensayo\t+ info",
  "Biblioteca municipal de ensayo\tBiblioteca de ensayo con clubes de lectura y talleres intergeneracionales.\tCualquiera\tPoblación general, Infancia: 6-11 años\tCultura y ocio, Otros\tMunicipio de ensayo\tMunicipio de ensayo\t+ info",
].join("\n");

/** Retira la identidad del expediente anterior; las cifras de los estudios no cambian. */
function replaceIdentity<T>(value: T, fromId: string): T {
  const text = JSON.stringify(value)
    .split(fromId).join(ID);
  return JSON.parse(text) as T;
}

it("genera el expediente de ensayo neutro", () => {
  const source = JSON.parse(readFileSync(TARGET, "utf8")) as MunicipalityWorkspace & Record<string, unknown>;
  const fromId = source.municipality.identity.id;
  const studyDocs = source.repository.documents.filter((d) => /proxy piloto/.test(d.title));
  // Al regenerar desde el propio expediente de ensayo, los documentos de ensayo se vuelven a crear.
  const studyDocIds = new Set(studyDocs.map((d) => d.id));
  const studyAtoms = source.evidenceStore.atoms.filter((a) => studyDocIds.has(a.provenance?.documentId ?? ""));
  if (studyDocs.length !== 13) throw new Error(`Se esperaban 13 estudios y hay ${studyDocs.length}`);

  const healthDocId = "ensayo-informe-salud";
  const repository = replaceIdentity({
    ...source.repository,
    documents: [
      {
        id: healthDocId,
        municipalityId: ID,
        kind: "health-report",
        title: "Informe de Salud del Municipio de ensayo",
        status: "validated",
        source: { system: "Documento de ensayo", organization: "COMPÁS (ensayo)" },
        sourceFileName: "informe-salud-municipio-ensayo.txt",
        sourceText: INFORME_DE_ENSAYO,
        tags: ["health-report", "ensayo"],
        createdAt: NOW,
        updatedAt: NOW,
      },
      ...studyDocs,
    ],
  }, fromId);
  const evidenceStore = replaceIdentity({ ...source.evidenceStore, atoms: studyAtoms }, fromId);

  const withAssets = ingestManualDocument({
    repository,
    evidenceStore,
    kind: "localiza-salud",
    title: "Localiza Salud — Municipio de ensayo",
    plainText: LOCALIZA_DE_ENSAYO,
    documentId: "ensayo-localiza",
    sourceSystem: "Localiza Salud (ensayo)",
  });
  if (!withAssets) throw new Error("No se pudieron incorporar los activos de ensayo");

  const sections = parseHealthReportSections({ text: INFORME_DE_ENSAYO });
  const healthReport = {
    id: "ensayo-informe-salud-lectura",
    municipalityId: ID,
    linkedDocumentId: healthDocId,
    sourceFileName: "informe-salud-municipio-ensayo.txt",
    title: "Informe de Salud del Municipio de ensayo",
    authors: [],
    body: { originalText: INFORME_DE_ENSAYO, format: "plain", charCount: INFORME_DE_ENSAYO.length, isAuthoritative: true },
    sections,
    createdAt: NOW,
    updatedAt: NOW,
  };

  const studies = Object.fromEntries(
    Object.entries(source).filter(([key, value]) => key.endsWith("Study") && value).map(([key, value]) => [key, replaceIdentity(value, fromId)]),
  );

  const workspace = {
    schemaVersion: source.schemaVersion,
    municipality: {
      ...source.municipality,
      identity: { id: ID, name: NAME, province: "Granada", autonomousCommunity: "Andalucía", territorialType: "municipio" },
    },
    repository: withAssets.repository,
    evidenceStore: withAssets.evidenceStore,
    healthReport,
    ...studies,
    createdAt: NOW,
    updatedAt: NOW,
  };
  const text = JSON.stringify(workspace, null, 2);
  const leaks = [...text.matchAll(/.{0,60}(zaid|ugc).{0,40}/gi)].map((m) => m[0]);
  if (leaks.length) throw new Error(`El expediente de ensayo conserva referencias a un territorio real:\n${leaks.slice(0, 12).join("\n")}`);
  writeFileSync(TARGET, text + "\n", "utf8");
});
