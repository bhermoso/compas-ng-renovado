# EAS 2023 — Script reproducible (pendiente)

Los valores de `EAS_2023_REFERENCES` en `../eas2023References.ts` fueron calculados
por el autor desde los microdatos ponderados de la Encuesta Andaluza de Salud 2023
(EAS 2023) para Granada-provincia (PROV=18) y Andalucía.

## Entradas esperadas

- Microdatos ponderados EAS 2023 (**no incluidos en el repositorio**).
- Codebook EAS 2023 (la columna `easVariable` de cada entrada indica la variable).

## Estado

Pendiente de microdatos. Cuando estén disponibles, este directorio alojará el
script que reproduce los valores; un test contrastará el valor publicado con el
recalculado (mismo patrón que `andalusiaReferenceContract.ts` con sus fixtures).

## Referencias afectadas

35 variables. Las marcadas `coveredByFixture: true` (P32_CAGE, P34a_nada, PREDIMED)
ya disponen de un fixture autonómico en `EASComparativeReferences.ts`; se incluyen
aquí para completitud del catálogo EAS 2023 pero el fixture prevalece para los
indicadores de estudio que lo tienen.
