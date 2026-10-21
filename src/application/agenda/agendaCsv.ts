import type { IndicatorWorksheet } from "../../domain/action-plan-catalog/IndicatorWorksheet";
import {
  ACTUATION_STATUS_LABEL, AGENDA_SETTING_LABEL, type AgendaActuation,
} from "../../domain/agenda/AgendaActuation";
import { readActuation } from "./agendaActuations";

const HEADER = [
  "Nombre", "Entorno", "Año", "Trimestre", "Estado", "Prioridad", "Código", "Programa", "Línea", "Objetivo",
  "Indicador", "Responsable", "Población", "Fecha prevista", "Fecha real", "Descripción", "Recursos",
];

const cell = (value: string | number | undefined | null): string => {
  const text = value === undefined || value === null ? "" : String(value);
  // Neutraliza fórmulas al abrir el CSV en una hoja de cálculo.
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return /[;"\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

/** CSV de la agenda (separador «;», con BOM para Excel). Lo no registrado queda vacío, no se rellena. */
export function agendaToCsv(actuations: readonly AgendaActuation[], worksheets: readonly IndicatorWorksheet[]): string {
  const rows = actuations.map((a) => {
    const r = readActuation(a, worksheets);
    return [
      r.name,
      a.setting ? AGENDA_SETTING_LABEL[a.setting] : "Sin asignar",
      a.identification.year,
      a.identification.quarter,
      ACTUATION_STATUS_LABEL[a.tracking.status],
      a.tracking.priority,
      a.identification.code,
      a.identification.program,
      a.strategic.line,
      a.strategic.objective,
      a.strategic.mainIndicator,
      r.responsible,
      r.population,
      a.tracking.plannedDate,
      a.tracking.actualDate,
      r.description,
      a.tracking.resources,
    ].map(cell).join(";");
  });
  return "﻿" + [HEADER.join(";"), ...rows].join("\r\n") + "\r\n";
}
