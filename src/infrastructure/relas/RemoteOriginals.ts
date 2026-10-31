import { getDocFromServer, doc } from "firebase/firestore";
import { getBytes, getStorage, ref } from "firebase/storage";
import type { FirebaseApp } from "firebase/app";
import type { RelasClient } from "./RelasClient";
import { storagePathForOriginal, type OriginalRecord } from "../../domain/repository/OriginalRecord";

/** Only read/verify: uploads remain disabled until bucket and rules are emulator-validated. */
export async function readVerifiedRemoteOriginal(
  client: RelasClient,
  app: FirebaseApp,
  bucket: string,
  municipalityId: string,
  sha256: string
): Promise<{ record: OriginalRecord; bytes: Uint8Array }> {
  if (!client.auth.currentUser) throw new Error("Es necesario iniciar sesión.");
  if (!bucket || !/^gs:\/\/[a-z0-9][a-z0-9.\-]*$/.test(bucket)) throw new Error("Bucket Firebase no configurado o inválido.");
  const path = storagePathForOriginal(municipalityId, sha256);
  const snapshot = await getDocFromServer(doc(client.db, "relas_scopes", municipalityId, "originals", sha256));
  if (!snapshot.exists()) throw new Error("Original no registrado en Firestore.");
  const record = snapshot.data() as OriginalRecord;
  if (record.schema !== "compas-original/v1" || record.municipalityId !== municipalityId ||
      record.sha256 !== sha256 || record.storagePath !== path ||
      !Number.isSafeInteger(record.byteLength) || record.byteLength <= 0 || record.byteLength > 41943040) {
    throw new Error("Metadatos del original inconsistentes.");
  }
  const blob = await getBytes(ref(getStorage(app, bucket), path), 41943040);
  if (blob.byteLength !== record.byteLength) throw new Error("Tamaño de original inconsistente.");
  const digest = await crypto.subtle.digest("SHA-256", blob);
  const actual = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, "0")).join("");
  if (actual !== record.sha256) throw new Error("Verificación SHA-256 fallida.");
  return { record, bytes: new Uint8Array(blob) };
}
