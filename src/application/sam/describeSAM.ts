import type { SampleQualityAssessment } from "../../domain/sam";

const pct = (n: number) => n.toLocaleString("es-ES", { maximumFractionDigits: 1 });
const sex = { male: "hombres", female: "mujeres" } as const;

/** Shared by SAM, evidence and the health profile. No quality thresholds. */
export function describeSAM(a: SampleQualityAssessment): string {
  const ratio = a.populationRatioPercent ?? a.nObserved / a.populationReference.populationTotal * 100;
  const coverage = a.populationCoveragePercent !== undefined
    ? `Han participado ${a.nObserved} de ${a.populationReference.populationTotal} personas de la población objetivo (${pct(a.populationCoveragePercent)} %).`
    : `Cobertura poblacional: No evaluable; falta verificar participantes únicos y coincidencia del universo y periodo. El cociente entre registros y población de referencia es ${pct(ratio)} %; no acredita cobertura censal.`;
  const c = a.composition;
  let composition = "Composición por sexo y edad: No evaluable; faltan recuentos comparables de la muestra y del padrón.";
  if (c && c.observedTotal > 0 && c.populationTotal > 0) {
    const ranked = [...c.cells].filter(x => x.diffPp !== null).sort((x, y) => y.diffPp! - x.diffPp!);
    const extremes = [ranked.find(x => x.diffPp! > 1e-10), [...ranked].reverse().find(x => x.diffPp! < -1e-10)].filter(x => x !== undefined);
    const empty = c.cells.filter(x => x.populationCount > 0 && x.observedCount === 0);
    composition = `Se comparan ${c.observedTotal} registros con edad y sexo asignables. Mujeres: ${pct(c.sex.female.pctAchieved)} % en la muestra y ${pct(c.sex.female.pctPopulation)} % en el padrón. ` +
      (extremes.length
        ? extremes.map(x => `Mayor ${x.diffPp! > 0 ? "sobrerrepresentación" : "infrarrepresentación"}: ${sex[x.sex]} de ${x.ageBand} años (${pct(x.pctAchieved)} % de la muestra frente a ${pct(x.pctPopulation)} % del padrón). `).join("")
        : "La composición coincide por sexo y bandas de edad. ") +
      (empty.length ? `Hay ${empty.length} celdas con población sin participantes: ${empty.slice(0, 3).map(x => `${sex[x.sex]} de ${x.ageBand}`).join(", ")}${empty.length > 3 ? ", entre otras (véase el detalle demográfico)" : ""}. ` : "Todas las celdas con población tienen respuestas. ") +
      (c.observedTotal !== a.nObserved ? "La comparación demográfica no abarca todos los registros. " : "") +
      "Estas diferencias describen la composición y no demuestran representatividad estadística; los grupos ausentes no quedan descritos por las respuestas de otros grupos.";
  }
  return `${coverage} ${composition} Una participación muy elevada constituye una fortaleza, aunque no elimina por sí sola posibles sesgos de selección o participación. Confianza metodológica: No evaluable sin información verificada del diseño.`;
}
