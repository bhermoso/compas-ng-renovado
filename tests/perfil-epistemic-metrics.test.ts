/**
 * tests/perfil-epistemic-metrics.test.ts
 *
 * Métricas epistémicas del Perfil Local de Salud: proyección compacta y
 * estable del estado del conocimiento para contadores e indicadores de
 * proceso. No introduce semántica nueva: debe coincidir exactamente con
 * computePerfilEstadoGlobal / computeEstadoDelConocimiento.
 */

import { describe, it, expect } from "vitest";
import {
  createPerfilLocalDeSalud,
  addInterpretation,
  addHypothesis,
  addOpenQuestion,
  resolveHypothesisAsInterpretation,
  discardHypothesis,
  resolveOpenQuestion,
  updateSynthesis,
  computePerfilEpistemicMetrics,
  computePerfilEstadoGlobal,
  computeEstadoDelConocimiento,
} from "../src/application/health-profile";
import type { PerfilLocalDeSalud } from "../src/domain/health-profile";

function perfilTrabajado(): PerfilLocalDeSalud {
  let perfil = createPerfilLocalDeSalud("granada-centro");
  perfil = addInterpretation(perfil, {
    espacio: "determinantes",
    enunciado: "El envejecimiento condiciona las redes de cuidado del distrito.",
    certeza: "moderada",
    evidenciaIds: ["atom-1"],
    autorNombre: "Equipo técnico",
  });
  perfil = addHypothesis(perfil, {
    espacio: "situacion-salud",
    enunciado: "El malestar emocional se concentra en población cuidadora.",
    plausibilidad: "moderada",
    indicios: ["señales GHQ-12 y DUKE"],
    preguntasResolutoras: ["Explotación desagregada por rol de cuidado"],
    autorNombre: "Equipo técnico",
  });
  perfil = addHypothesis(perfil, {
    espacio: "activos",
    enunciado: "La red de activos de mayores cubre el eje de soledad no deseada.",
    plausibilidad: "especulativa",
    indicios: ["concentración de recursos de mayores"],
    preguntasResolutoras: ["Validación territorial del mapa de activos"],
    autorNombre: "Equipo técnico",
  });
  perfil = addHypothesis(perfil, {
    espacio: "desigualdades",
    enunciado: "Existe gradiente interno de renta entre secciones del distrito.",
    plausibilidad: "alta",
    indicios: ["estructura urbana heterogénea"],
    preguntasResolutoras: ["Sección censal INE"],
    autorNombre: "Equipo técnico",
  });
  // Resolver la primera hipótesis como interpretación
  const hipResuelta = perfil.hipotesis[0];
  perfil = resolveHypothesisAsInterpretation(perfil, hipResuelta.id, {
    espacio: "situacion-salud",
    enunciado: "El malestar emocional documentado se asocia al rol de cuidado.",
    certeza: "moderada",
    evidenciaIds: ["atom-2"],
    autorNombre: "Equipo técnico",
  });
  // Descartar la segunda
  const hipDescartada = perfil.hipotesis[1];
  perfil = discardHypothesis(
    perfil,
    hipDescartada.id,
    "El mapa de activos no permite sostenerla con la evidencia actual."
  );
  perfil = addOpenQuestion(perfil, {
    espacio: "desigualdades",
    formulacion: "No se conoce la distribución interna de renta y vivienda.",
    relevancia: "condiciona la lectura de desigualdades.",
    urgencia: "alta",
    viasResolucion: ["Sección censal INE"],
  });
  perfil = addOpenQuestion(perfil, {
    espacio: "contexto-territorial",
    formulacion: "Falta delimitación oficial actualizada del distrito.",
    relevancia: "afecta a la atribución de activos.",
    urgencia: "media",
    viasResolucion: ["Cartografía municipal"],
  });
  const pregunta = perfil.preguntasAbiertas[1];
  perfil = resolveOpenQuestion(
    perfil,
    pregunta.id,
    "Delimitación obtenida del callejero municipal vigente."
  );
  perfil = updateSynthesis(
    perfil,
    "El distrito combina malestar psicosocial con tejido comunitario denso."
  );
  return perfil;
}

describe("métricas epistémicas — perfil vacío", () => {
  it("devuelve ceros, sin síntesis y nivel 'vacio'", () => {
    const m = computePerfilEpistemicMetrics(createPerfilLocalDeSalud("x"));
    expect(m).toEqual({
      interpretaciones: 0,
      interpretacionesSuperadas: 0,
      hipotesisAbiertas: 0,
      hipotesisResueltas: 0,
      hipotesisDescartadas: 0,
      preguntasAbiertas: 0,
      preguntasResueltas: 0,
      tieneSintesis: false,
      nivelEstado: "vacio",
      coberturaMinimaCumplida: false,
    });
  });
});

describe("métricas epistémicas — perfil trabajado", () => {
  it("cuenta interpretaciones, hipótesis por estado, preguntas y síntesis", () => {
    const m = computePerfilEpistemicMetrics(perfilTrabajado());
    // 1 añadida + 1 resultante de resolver hipótesis
    expect(m.interpretaciones).toBe(2);
    expect(m.interpretacionesSuperadas).toBe(0);
    // 3 hipótesis: 1 resuelta, 1 descartada, 1 sigue activa
    expect(m.hipotesisAbiertas).toBe(1);
    expect(m.hipotesisResueltas).toBe(1);
    expect(m.hipotesisDescartadas).toBe(1);
    // 2 preguntas: 1 resuelta, 1 abierta
    expect(m.preguntasAbiertas).toBe(1);
    expect(m.preguntasResueltas).toBe(1);
    expect(m.tieneSintesis).toBe(true);
  });

  it("no introduce semántica propia: coincide con los cálculos base", () => {
    const perfil = perfilTrabajado();
    const m = computePerfilEpistemicMetrics(perfil);
    const base = computePerfilEstadoGlobal(perfil);
    const ekc = computeEstadoDelConocimiento(perfil);

    expect(m.interpretaciones).toBe(base.interpretacionesActivas);
    expect(m.interpretacionesSuperadas).toBe(base.interpretacionesSuperadas);
    expect(m.hipotesisAbiertas).toBe(base.hipotesisActivas);
    expect(m.hipotesisResueltas).toBe(base.hipotesisResueltas);
    expect(m.hipotesisDescartadas).toBe(base.hipotesisDescartadas);
    expect(m.preguntasAbiertas).toBe(base.preguntasAbiertas);
    expect(m.preguntasResueltas).toBe(base.preguntasResueltas);
    expect(m.tieneSintesis).toBe(base.tieneSintesis);
    expect(m.nivelEstado).toBe(ekc.nivelEstado);
    expect(m.coberturaMinimaCumplida).toBe(ekc.coberturaMinimaCumplida);
  });

  it("es pura: no modifica el perfil de entrada", () => {
    const perfil = perfilTrabajado();
    const antes = JSON.stringify(perfil);
    computePerfilEpistemicMetrics(perfil);
    expect(JSON.stringify(perfil)).toBe(antes);
  });
});
