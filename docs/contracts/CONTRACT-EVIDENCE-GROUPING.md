# COMPÁS NG — Contrato de agrupación de evidencia (marco propio de COMPÁS)

> Estado: CONCEPTUAL. Fecha: 2026-10-19.
> Define una vista de presentación. No añade familias de evidencia ni cambia la lectura canónica del Perfil.

## 1. Propósito

Ofrecer al equipo técnico un esquema de ocho dimensiones para ordenar evidencia heterogénea por su origen. Procede del histórico de COMPÁS (SFA) y se conserva solo como taxonomía. Es un marco propio de COMPÁS, no una fuente bibliográfica, y así se rotula siempre.

## 2. Relación con el contrato metodológico

`CONTRACT-LOCAL-HEALTH-PROFILE-METHODOLOGY` Art. 7 define las familias de evidencia admisibles del Perfil. Esas familias mandan. Esta agrupación es una vista derivada: no crea una clase de afirmación, no sustituye las familias y, si se retira, el Perfil no cambia (Art. 17 bis, modelo canónico único).

## 3. Invariantes

1. Sin pesos, umbrales ni puntuaciones. Ninguna dimensión tiene rango superior a otra.
2. Agrupar no concluye, no prioriza y no ordena por relevancia.
3. Una dimensión sin dato en NG se declara vacía. No se rellena ni se aproxima. Hoy: Tendencias del Cuadro de Mando Integral.
4. Un átomo cuyo tipo no corresponde a ninguna dimensión (p. ej. los activos comunitarios) se declara como «sin asignar». No se fuerza a una dimensión.
5. La clasificación es por tipo de átomo y no modifica el átomo.

## 4. Dimensiones

Epidemiología territorial · Tendencias del Cuadro de Mando Integral · Determinantes sociales · Inequidad · Evidencia cualitativa · Participación ciudadana · Factibilidad institucional · Convergencia estratégica. Inequidad y Factibilidad institucional no son tipos de átomo y hoy no agrupan ninguno.

## 5. Implementación

`src/domain/evidence-grouping/EvidenceGroupingTaxonomy.ts` y `src/application/health-profile/groupEvidenceByTaxonomy.ts`. Sin consumo en la vista del Perfil. Conectarlo exige revisión de este contrato.

## 6. Qué no se porta

Los pesos, los umbrales de normalización y los motores expertos del histórico. Eran propuestas provisionales sin validar.
