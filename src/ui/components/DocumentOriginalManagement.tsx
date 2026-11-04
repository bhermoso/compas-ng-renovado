import { createContext, useContext } from "react";
import type { StoredDocumentOriginal } from "../../application/document-files/documentOriginals";

export interface DocumentOriginalManagement {
  /** Only operations on the currently authenticated municipality are authorised. */
  municipalityId: string;
  originals: readonly StoredDocumentOriginal[];
  /** Only resolves after the shared expediente has been saved in Firebase. */
  storeOriginal: (documentId: string, file: File) => Promise<void>;
  createRevision: (documentId: string, file: File) => Promise<void>;
  archiveDocument: (documentId: string) => Promise<void>;
  deleteDocument: (documentId: string) => Promise<boolean>;
}

export const DocumentOriginalManagementContext = createContext<DocumentOriginalManagement | null>(null);

export function useDocumentOriginalManagement(): DocumentOriginalManagement | null {
  return useContext(DocumentOriginalManagementContext);
}
