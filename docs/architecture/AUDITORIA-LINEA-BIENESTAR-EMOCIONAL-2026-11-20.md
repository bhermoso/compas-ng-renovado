# Auditoría normativa — Bienestar emocional y salud mental (20-11-2026)

**Estado:** auditoría de solo lectura y referencias oficiales incorporadas al código; **no** sustituye ni valida el módulo BEM 0.2.  
**Fuente canónica de la situación actual:** `src/domain/action-plan-catalog/ActionPlanCatalog.ts`, módulo `bem-2027-2030`, versión `0.2`.  
**Referencia normativa estructurada:** `src/domain/action-plan-catalog/OfficialMentalHealthReferences.ts`.  
**Prueba de trazabilidad:** `tests/bem-official-references.test.ts`.

## Objetivo de la revisión

El Plan Local de Salud debe seleccionar preferentemente **objetivos y nombres de indicadores oficiales sin adaptación textual**, y distinguir la contribución local del alcance autonómico de esos objetivos. COMPÁS debe mantener la misma definición, población, instrumento y fórmula si pretende afirmar comparabilidad. Una medida municipal distinta debe tener un código y nombre propio y no presentarse como indicador oficial.

## Fuentes oficiales verificadas

1. **PESMA-A 2026–2029**, documento definitivo, no el borrador 2025:  
   https://www.sspa.juntadeandalucia.es/servicioandaluzdesalud/sites/default/files/sincfiles/wsas-media-mediafile_sasdocumento/2026/pesmaa.pdf  
   - p. 129: OE01 (bienestar emocional), OE02 (detección precoz), OE03 (salud física), OE04 (conductas suicidas), OE05 (modelo comunitario).
   - p. 138: programa P.01.02 (formación en centros educativos, GEA y GRUBEA) con indicadores de **número de centros**, no el porcentaje genérico actual de COMPÁS.
   - p. 333: OE1 utiliza KIDSCREEN para 8–16 años e IBSE (Bericat) para **mayores de 16**, fuente Encuesta Andaluza de Salud 2023, referencia andaluza **75,94**; mujeres **73,98**; hombres **78,01**.
2. **EPVSA 2024–2030**, líneas/objetivos/indicadores:  
   https://www.juntadeandalucia.es/sites/default/files/inline-files/2024/03/08_Lineas_EPVSA_02abril24.pdf  
   Indicadores: https://www.juntadeandalucia.es/sites/default/files/inline-files/2024/04/INDICADORES_EstrategiaVidaSaludable_02abril2024.pdf  
   - OE1.4 (bienestar y calidad de vida), SF-12 para componente mental de calidad de vida adulta, Duke-UNC-11 para apoyo afectivo.
   - OE1.6 (pantallas) y OE1.7 (recomendaciones de activos desde el SSPA).
3. **Estrategia de Salud Mental del SNS 2022–2026**, marco complementario, pendiente de comparación exhaustiva de sus objetivos de nivel inferior:  
   https://www.sanidad.gob.es/areas/calidadAsistencial/estrategias/saludMental/

## Resultados de auditoría del código existente

- BEM 0.2: **7 objetivos generales, 17 específicos y 17 indicadores**. Los 7 generales tienen procedencia `adaptado`, no `literal`.
- El indicador BEM-I1.1 usa IBSE (instrumento oficial PESMA-A), pero el **procedimiento de observación municipal y el referente andaluz no son comparables por defecto**. La declaración antigua `propio` reflejaba la operacionalización municipal, no que el instrumento no existiera en el plan oficial. Esta ambigüedad se resuelve en el **registro de correspondencias independiente**, sin atribuir identidad metodológica falsa.
- BEM-I3.1 no coincide con el indicador oficial de P.01.02: COMPÁS mide **% de centros con cualquier programa**, PESMA-A **número de centros GEA y GRUBEA**.
- BEM-I4.2 no coincide con EPVSA 1.7.1: COMPÁS incluye servicios sociales y educativos; la EPVSA mide recomendaciones desde el **SSPA**. No renombrar una ampliación como indicador oficial.
- BEM-I4.1 (activos validados temáticos) es distinto del indicador EPVSA 1.7.1 (recomendaciones) y no se sustituye uno por otro.
- BEM-I1.2 (brechas IBSE), BEM-I1.3 (ítem tranquilidad), BEM-I2.1 (ítem soledad), BEM-I5.1 y BEM-I5.2 (circuitos locales) son desarrollos municipales; no presentarlos como indicadores idénticos de la estrategia.
- No reconstruir un IBSE municipal de `75,94` por ser esa la referencia **autonómica**. Verificar que cualquier resultado municipal procede exclusivamente de microdatos locales y de la normalización correcta, con grupos de edad y SAM.
- Las medidas de población infantil y adulta no son intercambiables; especialmente, el IBSE del monitor de Atarfe incluye estrato de menores y requiere desglose/restricción antes de vincularse con PESMA-A OE01.

## Método de construcción de BEM 0.3

1. **Biblioteca canónica de objetivos**: transcripciones oficiales por código, fuente, página y versión. No se identifica una «adaptación» como literal.
2. **Relaciones de aplicación local**: un objetivo oficial puede vincularse a una actuación municipal, sin perder código ni texto institucional y sin presuponer que el municipio asume la competencia asistencial.
3. **Indicadores oficiales antes que locales**: utilizar fórmulas y poblaciones originales cuando haya datos y permisos; si no, estado `sin línea base municipal`, metodología de captación y limitaciones.
4. **Indicadores municipales complementarios**: se almacenan como medidas distintas, con procedencia y propósitos propios.
5. **Revisión funcional**: ninguna migración silenciosa de BEM 0.2; la eventual 0.3 debe versionarse y preservar borradores, fichas de indicadores, decisiones y validaciones 0.2.
6. **Validación técnica**: colaboración entre equipo local, salud pública y agentes responsables de fuentes. La redacción oficial no debe confundirse con promesa de resultado o competencia local.

## Tabla de prioridades de normalización

| Código BEM existente | Referente verificable | Qué conservar o cambiar |
|---|---|---|
| BEM-I1.1 | PESMA OE01 / IBSE | Conservar medida local por ahora; asociar referencia y auditar comparabilidad |
| BEM-I2.2 | EPVSA OE1.4 / 1.4.5 | Mantener DUKE, comprobar versión/instrumento y muestra |
| BEM-I3.1 | PESMA P.01.02 / GEA-GRUBEA | Proponer indicador oficial de número de centros, no porcentaje genérico |
| BEM-I3.3 | EPVSA OE1.6 / 1.6.3 | Revisión de edad 8–15 y método EAS |
| BEM-I4.2 | EPVSA OE1.7 / 1.7.1 | Separar recuento SSPA del de otros servicios |
| BEM-I4.1 | EPVSA programa P04, activos | Mantener como medida temática local, cotejar indicador general P04 |
| BEM-I6.1/I6.2 | PESMA OE04 / programa P.04.01 | Cotejar indicadores oficiales de capacitación/difusión antes de reemplazar |
| BEM-I7.1/I7.2 | PESMA línea 5 y SNS línea 8 | Continuar auditoría de objetivos e indicadores textuales |

**Resultado entregado ahora:** referencia normativa estructurada, correspondencia completa con los 17 indicadores legados, pruebas de identidad y documentación. El catálogo operativo sigue en 0.2, deliberadamente: **no se han alterado planes municipales**.

**Pendiente para activar 0.3:** completar contraste literal objetivo específico–indicador (PESMA-A y EPVSA); decidir qué objetivos regionales son asumibles como contribución de un Plan Local; migración explícita con historia conservada; pruebas E2E de versiones y revisión humana.
