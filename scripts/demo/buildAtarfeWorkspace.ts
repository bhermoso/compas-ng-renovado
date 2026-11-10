/**
 * scripts/demo/buildAtarfeWorkspace.ts
 *
 * Constructor REPRODUCIBLE y HONESTO del expediente canónico de Atarfe.
 *
 * Usa EXCLUSIVAMENTE los servicios reales de COMPÁS NG y fuentes genuinamente
 * municipales de Atarfe, según la clasificación de procedencia de fixtures/README.md:
 *
 *   - Informe de Salud de Atarfe (fixtures/health-reports/Informe_Salud_Atarfe.docx):
 *     base epidemiológica oficial (componente N). Se preserva como HealthReportDocument;
 *     NO genera EvidenceAtoms (D-HR-01 / Art. 7 bis §3).
 *   - IBSE Atarfe (fixtures/ibse-atarfe.csv, `municipal-demo`, REDCap Monitor IBSE
 *     Atarfe 2026, n=909): único estudio genuinamente municipal (componente +1).
 *     Muestra MIXTA (menores de 16 y personas de 16 o más), sin desglose etario.
 *
 * EXCLUIDO DELIBERADAMENTE (no es Atarfe / no es honesto atribuirlo a su población):
 *   - EAS provinciales de Granada (DUKE/PREDIMED/SF-12/Sueño/CAGE/IPAQ, `provincial-eas-granada`).
 *   - Fixtures `synthetic-validation` (AUDIT-C/GHQ-12/PHQ-9/PSQI/Fagerström/SBQ).
 *   - Priorización derivada de desarrollo (no procede de proceso REDCap participativo real).
 *
 * REPRODUCIBILIDAD (revisión 2026-07-16):
 *   Los servicios de dominio emiten `crypto.randomUUID()` y `new Date()` en cada
 *   llamada. Para que dos reconstrucciones con las MISMAS fuentes produzcan bytes
 *   idénticos (mismo SHA-256), este constructor canónico aplica un contexto
 *   determinista: sello temporal fijo (CANONICAL_TIMESTAMP) e identificadores
 *   estables para el documento sanitario, el HealthReportDocument y el IBSEStudy.
 *   La determinización se limita a este constructor (canonicalizeWorkspace); NO
 *   altera el comportamiento normal de la aplicación en tiempo de ejecución.
 *
 * No fabrica datos ni promociona fixtures sintéticas a producción.
 */

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { createCompleteMunicipalityWorkspace } from "../../src/application/workspace";
import { createHealthReportDocumentFromDocx } from "../../src/application/health-report";
import { parseIBSECSV, ibseStudyToEvidenceAtoms } from "../../src/application/ibse";
import { ageBandsForMunicipality } from "../../src/application/sam/ageBandsForMunicipality";
import {
  createIBSEStudy,
  IBSE_PARTICIPANT_SAMPLE_CAUTION,
} from "../../src/domain/ibse";
import {
  addMunicipalDocument,
  type AddMunicipalDocumentInput,
  type MunicipalDocument,
} from "../../src/domain/repository";
import { transformDocumentToEvidence } from "../../src/application/evidence-pipeline";
import {
  stableAssetKey,
  upsertEvidenceAtom,
  type EvidenceAtom,
} from "../../src/domain/evidence";
import type { HealthReportAuthor } from "../../src/domain/health-report";
import type { MunicipalityWorkspace } from "../../src/domain/workspace";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const fixturePath = (name: string): string => resolve(repoRoot, "fixtures", name);

function toArrayBuffer(path: string): ArrayBuffer {
  const buf = readFileSync(path);
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
}

export const ATARFE_ID = "atarfe";
export const ATARFE_INE = "18022";

// ── Contexto determinista del constructor canónico ───────────────────────────
// Sello temporal fijo y documentado. Reemplaza a `new Date()` en todos los campos
// createdAt/updatedAt/extractedAt del expediente para que la serialización sea
// byte a byte estable entre reconstrucciones. Fecha: construcción canónica 2026-07-16.
export const CANONICAL_TIMESTAMP = "2026-07-16T00:00:00.000Z";

// Identificadores estables (reemplazan a `crypto.randomUUID()` sólo en este expediente).
export const HEALTH_REPORT_DOCUMENT_ID = "doc-health-report-atarfe"; // documento del repositorio
export const HEALTH_REPORT_ID = "health-report-atarfe"; // HealthReportDocument
export const IBSE_STUDY_ID = "ibse-study-atarfe"; // IBSEStudy
export const IBSE_DOCUMENT_ID = "doc-ibse-atarfe"; // documento del repositorio (ya estable)

// SHA-256 documentado de las dos fuentes de entrada. Las pruebas verifican que las
// fixtures en disco coinciden: si cambian, el expediente deja de ser reproducible
// contra estas fuentes y la validación falla de forma ruidosa.
export const ATARFE_INPUT_SHA256 = {
  healthReportDocx:
    "597fcacf0342eeb8970ef61b3a9b1d58cfe9eeb1c6703af7639e843a6c5b8e2c",
  ibseCsv: "3f23693fb62f80bbfd12c55a6da054110deb2d48dca9eaa5599b0a75c36f25be",
} as const;

const HEALTH_REPORT_DOCX = fixturePath("health-reports/Informe_Salud_Atarfe.docx");
const IBSE_CSV = fixturePath("ibse-atarfe.csv");
export const HEALTH_REPORT_DOCX_PATH = HEALTH_REPORT_DOCX;
export const IBSE_CSV_PATH = IBSE_CSV;

const HEALTH_REPORT_TITLE =
  "Informe de la situación de salud en el municipio de Atarfe";
const HEALTH_REPORT_PERIOD = "21 de noviembre de 2025";

// Autoría del Informe de Salud (Art. 16). Firmantes presentes en el documento:
// «Carlos del Moral Campaña. Epidemiólogo Distrito Granada-Metropolitano» y
// «María José Molina Rueda. Epidemióloga Distrito Granada-Metropolitano»,
// Unidad de Prevención, Promoción y Vigilancia de la Salud.
const HEALTH_REPORT_AUTHORS: HealthReportAuthor[] = [
  {
    name: "Carlos del Moral Campaña",
    role: "Epidemiólogo",
    organisation:
      "Unidad de Prevención, Promoción y Vigilancia de la Salud — Distrito Granada-Metropolitano",
    signatureOrder: 1,
  },
  {
    name: "María José Molina Rueda",
    role: "Epidemióloga",
    organisation:
      "Unidad de Prevención, Promoción y Vigilancia de la Salud — Distrito Granada-Metropolitano",
    signatureOrder: 2,
  },
];

// Discriminador de la muestra IBSE de Atarfe. El CSV `ibse-atarfe.csv` es una
// muestra MIXTA (menores de 16 y personas de 16 o más) y NO trae desglose etario:
// el export no permite recuentos válidos por estrato. Por eso el estudio se marca
// "mixed" y NO se afirma "población escolar".
export const ATARFE_IBSE_SAMPLE_SCOPE = "mixed" as const;

// Cautelas de muestra que viajan en el estudio y en cada átomo IBSE.
export const ATARFE_IBSE_MIXED_SAMPLE_SENTENCE =
  "Muestra municipal mixta, de 13 a 88 años, recogida entre el 6 de marzo y el 26 de abril de 2026 " +
  "con cuestionario en papel y por QR, en institutos y otros espacios del municipio; no probabilística. " +
  "El export trae sexo y edad de cada registro: 810 de los 811 válidos tienen edad asignable " +
  "(uno registra 1993 y se declara fuera de banda).";
export const ATARFE_IBSE_SAMPLE_CAUTIONS: readonly string[] = [
  ATARFE_IBSE_MIXED_SAMPLE_SENTENCE,
  IBSE_PARTICIPANT_SAMPLE_CAUTION,
];

// ── Activos para la salud — Localiza Salud (componente +1, Regla N+1) ─────────
// Cinco recursos comunitarios publicados en el portal Localiza Salud del
// Ministerio de Sanidad para el municipio de Atarfe. Se ingieren por la ruta
// documental `localiza-salud` (un EvidenceAtom `asset` por línea, origen
// "localiza-salud"), IDÉNTICA a la de Granada-Zaidín: NO amplía EvidenceAtom ni
// ningún contrato compartido y NO crea un modelo paralelo.
//
// FIDELIDAD (Opción B autorizada): el texto fuente TSV conserva verbatim en
// `MunicipalDocument.sourceText` las columnas sustantivas de la ficha —
//   Nombre | Descripción | Sexo | Grupo | Temas | Provincia | Localidad |
//   IdLocaliza | UrlDetalle
// — separadas por " | ". Las dos últimas (IdLocaliza, UrlDetalle) son el
// enriquecimiento autorizado que preserva el identificador externo y la URL de
// detalle de cada recurso. Los temas múltiples viajan unidos por ", " dentro de
// su columna: el contrato EvidenceAtom no admite arrays y no se extiende para
// forzar uno. Las erratas de origen ("útliles", "MUNUMENTOS") se preservan sin
// corrección silenciosa. El título del átomo es la primera columna (Nombre).
export const LOCALIZA_DOCUMENT_ID = "doc-localiza-atarfe"; // documento del repositorio (estable)
export const LOCALIZA_ASSET_COUNT = 20; // 61419 y 61585 comparten título: posible duplicado sin confirmar
// Marca versionada de migración incremental. El seed canónico la lleva estampada,
// de modo que una hidratación limpia o un reemplazo completo quedan marcados como
// aplicados y no vuelven a proponer la migración. Debe coincidir con la entrada de
// INCREMENTAL_SEED_MIGRATIONS en src/appWorkspaceHydration.ts (verificado en tests).
export const LOCALIZA_MIGRATION_MARKER = "atarfe-localiza-v1";
// Marca de la actualización del 2026-11-09 (IBSE recalculado por ítems + 17 fichas Localiza).
export const ATARFE_UPDATE_MARKER = "atarfe-documentacion-canonica-v4";
export const LOCALIZA_SALUD_ATARFE_URL_BASE =
  "https://localizasalud.sanidad.gob.es/maparecursos/main/ResourcesSearchDetail.action?id=";
export const LOCALIZA_SALUD_ATARFE_TEXT = [
  "Centro de Participación Activa de Atarfe | Los Centros de Participación Activa son recursos destinados a mejorar la calidad de vida de las personas mayores, favoreciendo su bienestar, la convivencia, la integración social y su participación en la comunidad. Además sirven de apoyo para la prestación de Servicios Sociales y Asistenciales a otros sectores de la población. Destacan sus talleres de envejecimiento activo, orientados a mantener la autonomía, prevenir la dependencia y el aislamiento, y promover hábitos saludables. Algunos de sus talleres son: Gimnasia de mantenimiento, taller de memoria, baile, castañuelas, manualidades, coro, cocina, informática...(cada centro poner los talleres que ofrece) | Cualquiera | Otros | Cultura y ocio, Alimentación saludable, Actividad física, Envejecimiento activo, Participación y acción comunitaria | Granada | Atarfe | 61419 | https://localizasalud.sanidad.gob.es/maparecursos/main/ResourcesSearchDetail.action?id=61419",
  "Piscina Cubierta Pública Atarfe (Granada) | Piscina pública cubierta del ayuntamiento de Atarfe, que cuenta tanto con actividades programadas para todas las edades como con la opción de nado libre a precios populares. | Cualquiera | Población general | Actividad física, Envejecimiento activo | Granada | Atarfe | 47602 | https://localizasalud.sanidad.gob.es/maparecursos/main/ResourcesSearchDetail.action?id=47602",
  "Punto Vuela Atarfe | Los Puntos Vuela son espacios digitales que ofrecen equipamiento, acceso y formación en competencias digitales y tecnologías emergentes a toda la ciudadanía. Con apoyo personalizado, facilitan el acceso a servicios electrónicos y herramientas digitales útliles para la vida diaria, educación, empleo, salud, finanzas o administración. | Cualquiera | Población general | Otros | Granada | Atarfe | 60152 | https://localizasalud.sanidad.gob.es/maparecursos/main/ResourcesSearchDetail.action?id=60152",
  "Taller de Coro del Centro de Participación Activa de Atarfe | Los Centros de Participación Activa son recursos destinados a mejorar la calidad de vida de las personas mayores, favoreciendo su bienestar, la convivencia, la integración social y su participación en la comunidad. Además sirven de apoyo para la prestación de Servicios Sociales y Asistenciales a otros sectores de la población. Destacan sus talleres de envejecimiento activo, orientados a mantener la autonomía, prevenir la dependencia y el aislamiento, y promover hábitos saludables. Algunos de sus talleres son: Gimnasia de mantenimiento, taller de memoria, baile, castañuelas, manualidades, coro, cocina, informática...(cada centro poner los talleres que ofrece) | Cualquiera | Otros | Bienestar emocional, Cultura y ocio, Alimentación saludable, Envejecimiento activo, Participación y acción comunitaria | Granada | Atarfe | 61425 | https://localizasalud.sanidad.gob.es/maparecursos/main/ResourcesSearchDetail.action?id=61425",
  "Taller de Senderismo del Centro de Participación Activa de Atarfe | EN ESTE TALLER SE RECOGE DOS PARTES UNA LA ACTIVIDAD FISICA Y LA OTRA LAS VISITAS QUE SE HACEN A LOS DIFERENTES MUNICIPIOS O MUNUMENTOS | Cualquiera | Otros | Actividad física | Granada | Atarfe | 61429 | https://localizasalud.sanidad.gob.es/maparecursos/main/ResourcesSearchDetail.action?id=61429",
  // Ampliación 2026-11-09: doce fichas más de la tabla de Localiza Salud aportada el 05/11/2026
  // (17 fichas en total). Textos verbatim de esa tabla; no se ha verificado en línea su vigencia.
  // «Centro de Participación Activa de Atarfe» figura con dos ID (61419 y 61585): se conservan
  // las dos fichas, cada una con su átomo, como posible duplicado pendiente de comprobar.
  "Asociación Artística y Cultural Ciudad Atarfe | Lugar en el que se imparten Enseñanzas elementales básicas de música, Práctica Instrumental y Práctica de Danza. | Cualquiera | Población general | Escuela de salud/formación, Bienestar emocional, Actividad física, Envejecimiento activo, Cultura y ocio | Granada | Atarfe | 61948 | https://localizasalud.sanidad.gob.es/maparecursos/main/ResourcesSearchDetail.action?id=61948",
  "Biblioteca Pública Municipal Marian Pineda de Atarfe | Biblioteca municipal de Atarfe que cuenta con el siguiente horario: Invierno: L-V de 10 A 14 horas . Tardes: martes y jueves de 16 a21 horas. SABADOS Cerrado . Verano: L-V de 9 A 14. | Cualquiera | Población general | Escuela de salud/formación, Participación y acción comunitaria, Cultura y ocio | Granada | Atarfe | 61912 | https://localizasalud.sanidad.gob.es/maparecursos/main/ResourcesSearchDetail.action?id=61912",
  "Centro Cívico Almudena Grandes de Atarfe | Espacio que cuenta con diferentes salas, donde se desarrollan actividades a través de instituciones como el Centro de Salud o Cruz Roja. También tiene sala de estudio y es punto de reunión para la población con la finalidad de incrementar la participación ciudadana en ciertos ámbitos. Su horario es de lunes a viernes de 9 - 14h y de 16 - 21h. Acceso adaptado para sillas de ruedas. | Cualquiera | Población general | Escuela de salud/formación, Bienestar emocional, Personas en riesgo de exclusión, Envejecimiento activo, Participación y acción comunitaria | Granada | Atarfe | 61919 | https://localizasalud.sanidad.gob.es/maparecursos/main/ResourcesSearchDetail.action?id=61919",
  "Centro de Participación Activa de Atarfe | Los Centros de Participación Activa son recursos destinados a mejorar la calidad de vida de las personas mayores, favoreciendo su bienestar, la convivencia, la integración social y su participación en la comunidad. Además sirven de apoyo para la prestación de Servicios Sociales y Asistenciales a otros sectores de la población. Destacan sus talleres de envejecimiento activo, orientados a mantener la autonomía, prevenir la dependencia y el aislamiento, y promover hábitos saludables. Algunos de sus talleres son: Gimnasia de mantenimiento, taller de memoria, senderismo, pintura... | Cualquiera | Mayores de 64 años | Bienestar emocional, Actividad física, Alimentación saludable, Envejecimiento activo, Participación y acción comunitaria | Granada | Atarfe | 61585 | https://localizasalud.sanidad.gob.es/maparecursos/main/ResourcesSearchDetail.action?id=61585",
  "Centro Público de Educación de Personas Adultas Mariana Pineda de Atarfe | El Centro de Educación para Personas Adultas ofrece Educación Básica, Educación Secundaria Obligatoria, Informática e Inglés Básico para Personas Adultas. | Cualquiera | Mayores de 64 años, Adultos (30-64 años) | Escuela de salud/formación, Bienestar emocional, Alimentación saludable, Envejecimiento activo, Participación y acción comunitaria | Granada | Atarfe | 61587 | https://localizasalud.sanidad.gob.es/maparecursos/main/ResourcesSearchDetail.action?id=61587",
  "Espacio Joven Atarfe | Espacio que ofrece los siguientes servicios: Información y asesoramiento juvenil, ocio y tiempo libre, formación y empleo, carné joven, participación (voluntariado) y ayudas y subvenciones. | Cualquiera | Adolescentes (12-17 años), Jóvenes (18-29 años) | Bienestar emocional, Participación y acción comunitaria, Cultura y ocio | Granada | Atarfe | 61945 | https://localizasalud.sanidad.gob.es/maparecursos/main/ResourcesSearchDetail.action?id=61945",
  "GIMNASIA MENTAL | Un taller de estimulación cognitiva para personas mayores mejora la memoria, la atención y el razonamiento. Ayuda a frenar el deterioro mental, fomenta la autonomía personal y reduce el aislamiento social a través de dinámicas grupales y ejercicios prácticos adaptados. | Cualquiera | Otros | Otros | Granada | Atarfe | 61427 | https://localizasalud.sanidad.gob.es/maparecursos/main/ResourcesSearchDetail.action?id=61427",
  "Grupo de Afrontamiento de la Ansiedad en Atención Primaria (GRAFA) | Grupo de afrontamiento de la ansiedad (GRAFA) en el Centro de Salud de Atarfe dirigidos a hombres y mujeres con la finalidad de mejorar la gestión emocional y aliviar los niveles de estrés. | Cualquiera | Mayores de 64 años, Jóvenes (18-29 años), Adultos (30-64 años) | Bienestar emocional | Granada | Atarfe | 47600 | https://localizasalud.sanidad.gob.es/maparecursos/main/ResourcesSearchDetail.action?id=47600",
  "Grupo Socioeducativo (GRUSE - Centro de Salud de Atarfe) | Los Grupos Socioeducativos de Atención Primaria de Salud (GRUSE) son grupos de ayuda para personas con malestar emocional que proporcionan recursos para resolver los problemas del día a día. Se trata de grupos de 8 a 15 personas (hombres o mujeres) que se reúnen en sesiones semanales, moderadas por el trabajador o la trabajadora social del Centro de Salud y en las que se abordan temas como la comunicación, la autoestima, la resolución de problemas, etc… | Cualquiera | Mayores de 64 años, Jóvenes (18-29 años), Adultos (30-64 años) | Bienestar emocional, Participación y acción comunitaria, Género/identidad | Granada | Atarfe | 61584 | https://localizasalud.sanidad.gob.es/maparecursos/main/ResourcesSearchDetail.action?id=61584",
  "Radio Ilíberis 101.5 FM de Atrafe | Emisora de radio municipal que ofrece música y programas informativos en salud y cuidados. | Cualquiera | Población general | Participación y acción comunitaria, Cultura y ocio | Granada | Atarfe | 61944 | https://localizasalud.sanidad.gob.es/maparecursos/main/ResourcesSearchDetail.action?id=61944",
  "Taller de sueño saludable | Talleres grupales que se imparten de manera periódica en el Centro de Salud de Atarfe, dirigidos a población general con interés en mejorar su higiene de sueño. | Cualquiera | Mayores de 64 años, Jóvenes (18-29 años), Adultos (30-64 años) | Bienestar emocional, Enfermedades crónicas, Participación y acción comunitaria | Granada | Atarfe | 63552 | https://localizasalud.sanidad.gob.es/maparecursos/main/ResourcesSearchDetail.action?id=63552",
  "Talleres Artísticos Ciudad de Atarfe | Talleres artísticos con inscripción a través de la Escuela de Música y Danza Ciudad de Atarfe (C/ Alfonso Bailón Verdejo nº4). Cuentan con clases de manualidades, a partir de los 12 años y con restauración a partir de los 18. El precio es de 30 euros al año por la matrícula y 30 euros al mes por tres horas semanales. | Cualquiera | Mayores de 64 años, Adolescentes (12-17 años), Jóvenes (18-29 años), Adultos (30-64 años) | Bienestar emocional, Envejecimiento activo, Cultura y ocio | Granada | Atarfe | 61922 | https://localizasalud.sanidad.gob.es/maparecursos/main/ResourcesSearchDetail.action?id=61922",
  // Ampliación 2026-11-09 (tabla de 20 registros aportada por el usuario): tres recursos sin
  // identificador ni URL de detalle en la tabla; las columnas IdLocaliza y UrlDetalle quedan vacías.
  "Centro Cultural Medina Elvira | El Centro Cultural Medina Elvira es un espacio destinado al desarrollo de actividades y espectáculos. | Cualquiera | Población general | Cultura y ocio, Participación y acción comunitaria | Granada | Atarfe |  | ",
  "Club de senderismo Castillejo | Club de Senderismo Castillejo de Atarfe. Entrenamiento en paraje de Sierra Elvira y los Tres Juanes. También rutas programadas por municipios de Granada. | Cualquiera | Población general | Actividad física, Envejecimiento activo, Participación y acción comunitaria | Granada | Atarfe |  | ",
  "Unidad de salud mental comunitaria de Atarfe | Atiende a pacientes ambulatorios con necesidad de seguimiento por parte de Salud Mental. Cuenta con psiquiatras, enfermero, psicólogo y trabajador social. Ubicado en el Centro de Salud Atarfe (entrada por Avda. de la Libertad, s/n). Pertenece al Hospital Universitario Virgen de las Nieves. | Cualquiera | Población general | Prevención del suicidio, Otras adicciones, Enfermedades crónicas, Escuela de salud/formación, Bienestar emocional | Granada | Atarfe |  | ",
].join("\n");

// Correspondencia identificador externo → título (para trazabilidad de pruebas).
export const LOCALIZA_ATARFE_EXTERNAL_IDS: readonly string[] = [
  "61419",
  "47602",
  "60152",
  "61425",
  "61429",
  "61948",
  "61912",
  "61919",
  "61585",
  "61587",
  "61945",
  "61427",
  "47600",
  "61584",
  "61944",
  "63552",
  "61922",
];

export interface AtarfeBuildResult {
  workspace: MunicipalityWorkspace;
  counts: {
    documents: number;
    studies: number;
    studyAtoms: number;
    localizaAssets: number;
    totalAtoms: number;
    healthReportAtoms: number;
  };
}

/** Registra un estudio: enlaza cada átomo a su documento y hace upsert trazable. */
function registerStudy(
  current: MunicipalityWorkspace,
  studyPatch: Partial<MunicipalityWorkspace>,
  document: AddMunicipalDocumentInput,
  atoms: EvidenceAtom[]
): MunicipalityWorkspace {
  let evidenceStore = current.evidenceStore;
  for (const atom of atoms) {
    const linked: EvidenceAtom = {
      ...atom,
      provenance: { ...atom.provenance, documentId: document.id },
    };
    evidenceStore = upsertEvidenceAtom(
      evidenceStore,
      linked,
      stableAssetKey(linked.municipalityId, linked.provenance.origin, linked.title)
    );
  }
  return {
    ...current,
    ...studyPatch,
    repository: addMunicipalDocument(current.repository, document),
    evidenceStore,
  };
}

/**
 * Contexto canónico determinista. Reemplaza TODO timestamp generado (municipio,
 * repositorio, documentos, EvidenceStore, átomos, Informe e IBSE) por
 * CANONICAL_TIMESTAMP, y fija los identificadores no deterministas del Informe y
 * del IBSEStudy. No modifica el contenido: sólo neutraliza las fuentes de
 * variación byte a byte. Confinado a este constructor canónico.
 */
function canonicalizeWorkspace(ws: MunicipalityWorkspace): MunicipalityWorkspace {
  const T = CANONICAL_TIMESTAMP;

  const documents: MunicipalDocument[] = ws.repository.documents.map((d) => ({
    ...d,
    source: d.source.collectedAt !== undefined
      ? { ...d.source, collectedAt: T }
      : d.source,
    createdAt: T,
    updatedAt: T,
  }));

  const atoms: EvidenceAtom[] = ws.evidenceStore.atoms.map((a) => ({
    ...a,
    provenance: { ...a.provenance, extractedAt: T },
    createdAt: T,
    updatedAt: T,
  }));

  return {
    ...ws,
    municipality: {
      ...ws.municipality,
      metadata: { ...ws.municipality.metadata, createdAt: T, updatedAt: T },
    },
    repository: { ...ws.repository, documents, createdAt: T, updatedAt: T },
    evidenceStore: { ...ws.evidenceStore, atoms, createdAt: T, updatedAt: T },
    healthReport: ws.healthReport
      ? {
          ...ws.healthReport,
          id: HEALTH_REPORT_ID,
          linkedDocumentId: HEALTH_REPORT_DOCUMENT_ID,
          createdAt: T,
          updatedAt: T,
        }
      : ws.healthReport,
    ibseStudy: ws.ibseStudy
      ? { ...ws.ibseStudy, id: IBSE_STUDY_ID, createdAt: T, updatedAt: T }
      : ws.ibseStudy,
    createdAt: T,
    updatedAt: T,
  };
}

export async function buildAtarfeWorkspace(): Promise<AtarfeBuildResult> {
  let ws = createCompleteMunicipalityWorkspace({
    id: ATARFE_ID,
    name: "Atarfe",
    province: "Granada",
    ineCode: ATARFE_INE,
    createdBy: "COMPÁS NG",
  });

  // ── 1. Informe de Salud — fuente diagnóstica primaria (N, D-HR-01) ─────────
  // Se preserva como HealthReportDocument con su autoría; NO genera EvidenceAtoms.
  const healthReport = await createHealthReportDocumentFromDocx({
    arrayBuffer: toArrayBuffer(HEALTH_REPORT_DOCX),
    municipalityId: ATARFE_ID,
    linkedDocumentId: HEALTH_REPORT_DOCUMENT_ID,
    sourceFileName: "Informe_Salud_Atarfe.docx",
    title: HEALTH_REPORT_TITLE,
    reportingPeriod: HEALTH_REPORT_PERIOD,
    authors: HEALTH_REPORT_AUTHORS,
  });
  ws = {
    ...ws,
    repository: addMunicipalDocument(ws.repository, {
      id: HEALTH_REPORT_DOCUMENT_ID,
      kind: "health-report",
      title: HEALTH_REPORT_TITLE,
      source: {
        system: "Carga directa de fuente documental primaria",
        collectedAt: CANONICAL_TIMESTAMP,
      },
      sourceFileName: "Informe_Salud_Atarfe.docx",
      tags: ["health-report", "primary-source"],
      territorialScale: "municipio",
      contentMode: "full-text-non-atomized",
    }),
    healthReport,
  };

  // ── 2. IBSE municipal — único estudio genuinamente de Atarfe (+1) ──────────
  // fixtures/ibse-atarfe.csv: `municipal-demo`, REDCap Monitor IBSE Atarfe 2026.
  // Muestra MIXTA (menores de 16 y 16 o más) sin desglose etario en el export:
  // se marca `sampleScope: "mixed"` y se anteponen las cautelas de muestra a las
  // del parser, de modo que viajen con el estudio y con cada átomo (limitations).
  const ibseParsed = parseIBSECSV(readFileSync(IBSE_CSV, "utf-8"), {
    ageBands: ageBandsForMunicipality(ATARFE_ID),
  });
  const ibseStudy = createIBSEStudy({
    municipalityId: ATARFE_ID,
    sourceFileName: "ibse-atarfe.csv",
    aggregates: ibseParsed.aggregates,
    sampleScope: ATARFE_IBSE_SAMPLE_SCOPE,
    // Sin `strataCounts`: un registro válido tiene una edad imposible (1993), de modo
    // que los estratos <16 y 16+ no cuadran con nValid. La distribución edad×sexo sí
    // se conserva (`ageSexObserved`) para que SAM describa la composición.
    ageSexObserved: ibseParsed.ageSexObserved && {
      cells: ibseParsed.ageSexObserved.cells,
      assignedCount: ibseParsed.ageSexObserved.assignedCount,
      unassignableCount: ibseParsed.ageSexObserved.unassignableCount,
    },
    methodologicalCautions: [
      ...ATARFE_IBSE_SAMPLE_CAUTIONS,
      ...ibseParsed.methodologicalCautions,
    ],
  });
  const ibseAtoms = ibseStudyToEvidenceAtoms(ibseStudy);
  ws = registerStudy(
    ws,
    { ibseStudy },
    {
      id: IBSE_DOCUMENT_ID,
      kind: "redcap-export",
      title: "IBSE — Monitor IBSE Atarfe 2026 (REDCap municipal, muestra mixta)",
      sourceFileName: "ibse-atarfe.csv",
      source: {
        system:
          "REDCap · Monitor IBSE Atarfe 2026 (datos primarios municipales; muestra mixta <16 y 16+)",
      },
      tags: ["redcap-export", "ibse"],
      territorialScale: "municipio",
      contentMode: "atomized",
    },
    ibseAtoms
  );

  // ── 3. Activos para la salud — Localiza Salud (+1) ─────────────────────────
  // Documento `localiza-salud` con ID estable y sourceText verbatim; la ingesta
  // se hace con `transformDocumentToEvidence` directamente (no con el servicio de
  // ingesta manual, que emite `crypto.randomUUID()` y rompería la reproducción).
  // La determinización de timestamps la aplica `canonicalizeWorkspace` más abajo;
  // los IDs de documento y de átomos ya son estables por construcción.
  {
    const repository = addMunicipalDocument(ws.repository, {
      id: LOCALIZA_DOCUMENT_ID,
      kind: "localiza-salud",
      title:
        "Localiza Salud — activos para la salud del municipio de Atarfe (Ministerio de Sanidad)",
      source: {
        organization: "Ministerio de Sanidad",
        system: "Localiza Salud — mapa de recursos comunitarios y activos para la salud",
        url: "https://localizasalud.sanidad.gob.es/maparecursos/main/",
        collectedAt: CANONICAL_TIMESTAMP,
      },
      sourceText: LOCALIZA_SALUD_ATARFE_TEXT,
      tags: ["localiza-salud", "community-asset", "asset"],
      territorialScale: "municipio",
      contentMode: "atomized",
    });
    const localizaDocument = repository.documents.find(
      (d) => d.id === LOCALIZA_DOCUMENT_ID
    );
    if (localizaDocument === undefined) {
      throw new Error("No se pudo registrar el documento Localiza Salud de Atarfe.");
    }
    const localizaResult = transformDocumentToEvidence({
      store: ws.evidenceStore,
      document: localizaDocument,
      plainText: LOCALIZA_SALUD_ATARFE_TEXT,
    });
    ws = {
      ...ws,
      repository,
      evidenceStore: localizaResult.store,
    };
  }

  // ── 4. Determinización canónica (sello temporal + IDs estables) ────────────
  ws = canonicalizeWorkspace(ws);

  // El seed canónico ya contiene Localiza Salud: se marca la migración incremental
  // como aplicada, de modo que una hidratación limpia o un reemplazo completo del
  // seed queden marcados y no vuelvan a proponer la migración (App.tsx).
  ws = { ...ws, appliedSeedMigrations: [LOCALIZA_MIGRATION_MARKER, ATARFE_UPDATE_MARKER] };

  const healthReportAtoms = ws.evidenceStore.atoms.filter(
    (a) => a.provenance.origin === "health-report"
  ).length;
  const localizaAssets = ws.evidenceStore.atoms.filter(
    (a) => a.provenance.origin === "localiza-salud"
  ).length;

  return {
    workspace: ws,
    counts: {
      documents: ws.repository.documents.length,
      studies: 1,
      studyAtoms: ibseAtoms.length,
      localizaAssets,
      totalAtoms: ws.evidenceStore.atoms.length,
      healthReportAtoms,
    },
  };
}
