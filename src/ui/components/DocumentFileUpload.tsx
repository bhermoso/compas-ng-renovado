import { useState } from "react";

interface DocumentFileUploadProps {
  id: string;
  label: string;
  accept: string;
  isLoading: boolean;
  /** Resultado de la última carga, redactado por quien procesa el fichero. */
  message?: string | null;
  onFile?: (file: File) => void;
}

/**
 * Zona de carga de un fichero documental. El selector nativo se reinicia tras
 * cada selección, por lo que no sirve de indicador: la zona muestra el nombre
 * del fichero, el estado de procesamiento y el resultado en una región de
 * estado propia, junto al control.
 */
export function DocumentFileUpload({
  id,
  label,
  accept,
  isLoading,
  message,
  onFile,
}: DocumentFileUploadProps) {
  const [fileName, setFileName] = useState<string | null>(null);

  return (
    <div className="docx-upload__zone">
      <span className="docx-upload__label">{label}</span>
      <input
        id={id}
        type="file"
        accept={accept}
        disabled={isLoading}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file !== undefined && onFile !== undefined) {
            setFileName(file.name);
            onFile(file);
          }
          e.target.value = "";
        }}
        className="docx-upload__input docx-upload__input--hidden"
      />
      <label
        htmlFor={id}
        className={`docx-upload__button${isLoading ? " docx-upload__button--disabled" : ""}`}
      >
        {isLoading ? "Procesando…" : "Elegir archivo"}
      </label>
      <p className="docx-upload__status" role="status" aria-live="polite">
        {isLoading && fileName !== null
          ? `Procesando «${fileName}»…`
          : message !== undefined && message !== null
            ? message
            : fileName !== null
              ? `Último archivo seleccionado: «${fileName}».`
              : "Ningún archivo seleccionado. El archivo se registra en cuanto lo eliges."}
      </p>
    </div>
  );
}
