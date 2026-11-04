import { createContext, useContext } from "react";
import type { StoredDocumentOriginal } from "../../application/document-files/documentOriginals";

export interface DocumentOriginalManagement {
  originals: readonly StoredDocumentOriginal[];
  /** Only resolves after the shared expediente has been saved in Firebase. */
  storeOriginal: (documentId: string, file: File) => Promise<void>;
}

export const DocumentOriginalManagementContext = createContext<DocumentOriginalManagement | null>(null);

export function useDocumentOriginalManagement(): DocumentOriginalManagement | null {
  return useContext(DocumentOriginalManagementContext);
}
