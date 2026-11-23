import React from "react";
import { createRoot } from "react-dom/client";
import { initializeApp } from "firebase/app";
import { connectAuthEmulator, createUserWithEmailAndPassword, initializeAuth, inMemoryPersistence } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import { createCompleteMunicipalityWorkspace } from "../../src/application/workspace";
import { readRemoteWorkspace, saveRemoteWorkspace } from "../../src/infrastructure/relas/RemoteWorkspace";
import { addMunicipalDocument } from "../../src/domain/repository";
import { createEvidenceAtom } from "../../src/domain/evidence";
import { createIBSEStudy } from "../../src/domain/ibse";
import { createHealthReportDocumentFromPdf } from "../../src/application/health-report";
import { processPdfHealthReport } from "../../src/application/health-report/ProcessPdfHealthReport";
import { createDocumentRevision } from "../../src/application/document-files/documentRevisions";
import { decodeDocumentOriginal, encodeDocumentOriginal } from "../../src/application/document-files/documentOriginals";
import { ingestManualDocument } from "../../src/application/document-ingestion/ManualDocumentIngestionService";

const id = "ensayo-interfaz-documental";
const municipality = { id, name: "Expediente sintético", province: "Ensayo" };
const demoApp = initializeApp({ projectId: "demo-compas-relas", apiKey: "demo-api-key" });
const auth = initializeAuth(demoApp, { persistence: inMemoryPersistence });
const db = getFirestore(demoApp);
connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
connectFirestoreEmulator(db, "127.0.0.1", 8189);
const client = { auth, db };
Object.assign(globalThis, { compasDemoClient: client });

async function signUp(name: string) {
  return (await createUserWithEmailAndPassword(auth, name + "@example.test", "synthetic-password")).user.uid;
}

async function seed(pdf: number[]) {
  let state = createCompleteMunicipalityWorkspace(municipality);
  const oldBuffer = Uint8Array.from(pdf).buffer;
  const original = await encodeDocumentOriginal("informe-origen", new File([oldBuffer], "informe-origen.pdf"));
  state.repository = addMunicipalDocument(state.repository, {
    id: original.documentId, kind: "health-report", title: "Informe inicial de ensayo",
    tags: ["health-report"], sourceFileName: original.name, contentSha256: original.sha256,
  });
  state.documentOriginals = [original];
  state.healthReport = await processPdfHealthReport(createHealthReportDocumentFromPdf({
    arrayBuffer: oldBuffer, municipalityId: id, linkedDocumentId: original.documentId,
    sourceFileName: original.name, title: "Informe inicial de ensayo", authors: [],
  }), oldBuffer);
  state.repository = addMunicipalDocument(state.repository, {
    id: "ibse-activo", kind: "redcap-export", title: "IBSE activo de ensayo",
    tags: ["ibse"], sourceFileName: "respuestas-sinteticas.csv",
  });
  state.ibseStudy = createIBSEStudy({
    municipalityId: id, sourceFileName: "respuestas-sinteticas.csv",
    aggregates: { n: 10, nValid: 10, meanTotal: 57, meanFactorVinculo: 55, meanFactorSituacion: 57, meanFactorControl: 58, meanFactorPersona: 58 },
    methodologicalCautions: ["Datos sintéticos"],
  });
  state.studySourceDocumentIds = { ibseStudy: "ibse-activo" };
  state.evidenceStore.atoms.push(createEvidenceAtom({
    id: "media-ibse-sintetica", municipalityId: id, kind: "indicator", title: "Media IBSE",
    content: "Indicador sintético", provenance: { documentId: "ibse-activo", origin: "ibse", extractedAt: state.updatedAt },
  }));
  const anexo = await encodeDocumentOriginal("anexo-ibse", new File(["Anexo sintético"], "anexo.pdf"));
  state = createDocumentRevision(state, "ibse-activo", anexo);
  state.repository.documents.find(doc => doc.id === anexo.documentId)!.title = "Anexo IBSE de ensayo";
  for (const [documentId, title] of [["localiza-primera", "Localiza, primera carga"], ["localiza-segunda", "Localiza, segunda carga"]]) {
    const { repository, evidenceStore } = ingestManualDocument({
      ...state, documentId, title, kind: "localiza-salud", plainText: "Asociación de ensayo | Apoyo comunitario",
    })!;
    state = { ...state, repository, evidenceStore };
  }
  await saveRemoteWorkspace(client, state, undefined, null);
}

async function mount() {
  localStorage.setItem("compas-ng:custom-municipalities", JSON.stringify([municipality]));
  localStorage.setItem("compas-ng:active-municipality", id);
  history.replaceState(null, "", "?fase=repositorio");
  const { default: App } = await import("../../src/App");
  createRoot(document.getElementById("root")!).render(<App />);
}

async function read() {
  const state = await readRemoteWorkspace(client, id);
  if (!state) throw Error("No se recuperó el expediente sintético");
  return {
    documents: state.repository.documents.map(doc => [doc.id, doc.status, doc.revisionOf, doc.sourceFileName]),
    report: state.healthReport?.linkedDocumentId, reportText: state.healthReport?.body.originalText,
    previous: state.previousHealthReports?.map(item => item.linkedDocumentId),
    study: state.studySourceDocumentIds?.ibseStudy, studyN: state.ibseStudy?.aggregates.nValid,
    ibseAtoms: state.evidenceStore.atoms.filter(atom => atom.provenance.origin === "ibse").map(atom => atom.id),
    localiza: state.evidenceStore.atoms.filter(atom => atom.provenance.origin === "localiza-salud").map(atom => atom.provenance.documentId),
    originals: (state.documentOriginals ?? []).map(file => file.name),
    derived: await Promise.all((state.documentDerivedFiles ?? []).map(async original => ({ name: original.name, size: (await decodeDocumentOriginal(original)).size }))),
  };
}
Object.assign(globalThis, { compasInterfaceTest: { signUp, seed, mount, read } });
