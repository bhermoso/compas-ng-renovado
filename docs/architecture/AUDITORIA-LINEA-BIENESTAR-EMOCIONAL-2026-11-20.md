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


## Concordancia completa de la versión 0.2 con la propuesta 0.3-candidate

**No se declara que los 17 objetivos específicos de COMPÁS existan literalmente en PESMA-A o EPVSA.** PESMA-A clasifica objetivos estratégicos, objetivos de programas y sus indicadores; EPVSA diferencia indicadores de contexto e impacto. Es metodológicamente incorrecto renumerar cualquiera de esos elementos como un objetivo específico municipal idéntico.

La correspondencia verificable, con descripción, ruta de medición, fuente y disposición de cada unidad se conserva de forma ejecutable en `BemOfficialRevisionCandidate.ts`, **no importado por el catálogo operativo**.

| Código actual | Jerarquía oficial a la que contribuye | Indicador oficial vinculable | Dictamen |
|---|---|---|---|
| BEM-OE1.1 | PESMA OE01, bienestar emocional | PESMA OE01: IBSE 16+ | Misma familia instrumental; comparabilidad pendiente |
| BEM-OE1.2 | PESMA OE01 | Ninguno idéntico | Brechas municipales: análisis complementario |
| BEM-OE1.3 | PESMA OE01 | Ninguno idéntico | Ítem local de tranquilidad: análisis complementario |
| BEM-OE2.1 | EPVSA OE1.4 | Ninguno idéntico | Ítem de soledad percibida ≠ medición oficial de soledad no deseada |
| BEM-OE2.2 | EPVSA OE1.4 | EPVSA 1.4.5.a: apoyo social y afectivo | DUKE; revisar punto de corte y muestra |
| BEM-OE3.1 | PESMA OE01, P.01.02 | Nº de centros con GEA/GRUBEA | Cambiar el porcentaje genérico si se adopta indicador oficial |
| BEM-OE3.2 | PESMA OE01, P.01.02 | Ninguno idéntico | Colaboración familiar: posible actuación local |
| BEM-OE3.3 | EPVSA OE1.6 | EPVSA 1.6.3.a: pantallas 8–15 | Igualar preguntas, población y periodicidad |
| BEM-OE4.1 | EPVSA OE1.7 / P04 | No equivale al indicador 1.7.1 | Inventario temático Localiza: medida propia |
| BEM-OE4.2 | EPVSA OE1.7 | EPVSA 1.7.1.a: recomendaciones desde SSPA | Separar SSPA del conjunto de agentes locales |
| BEM-OE4.3 | EPVSA OE1.7 | Ninguno idéntico | Brecha de oferta: diagnóstico participativo |
| BEM-OE5.1 | PESMA OE02 | Ninguno idéntico | Formación de agentes: actuación |
| BEM-OE5.2 | PESMA OE05, línea comunitaria | Ninguno idéntico | GRAFA/GRUSE y coordinación: acuerdo sanitario |
| BEM-OE6.1 | PESMA OE04, P.04.01 | Ninguno idéntico al recuento local | Formación de agentes: actuación; preservar competencia asistencial |
| BEM-OE6.2 | PESMA OE04, P.04.01 | Ninguno idéntico | Difusión de recursos 024: actuación |
| BEM-OE7.1 | PESMA OE10, inclusión y estigma | Ninguno idéntico | Escala de actitudes: evaluación local |
| BEM-OE7.2 | PESMA OE10, participación social | Ninguno idéntico | Registro de participación: evaluación local |

### Verificación nueva contra los textos definitivos

- PESMA-A p. 129, tabla de líneas: OE01, OE02, OE04 y OE05, y p. 131, OE10. Es importante que **estigma y participación** correspondan a OE10 y **modelo comunitario/coordinación de AP** a OE05: la versión 0.2 no distinguía bien esas referencias.
- PESMA-A p. 138, P.01.02: nombre de programa y recuentos propios de GEA/GRUBEA. No sustituir por «cualquier programa» ni medirlo con porcentaje sin denominarlo distinto.
- PESMA-A p. 333, evaluación: **IBSE de Bericat en población mayor de 16 años** y KIDSCREEN en población de 8 a 16. **75,94 es el valor de referencia de Andalucía.**
- PESMA-A p. 169–170, P.04.01: objetivos específicos del programa de prevención del suicidio y sus indicadores sanitarios; el «número de agentes comunitarios formados» y la «difusión del 024» de COMPÁS son actividades municipales, no indicadores de impacto oficiales del PESMA.
- EPVSA 2024–2030, fichero oficial de indicadores: 1.4.3.a (SF-12 componente mental), 1.4.5.a (apoyo social), 1.6.3.a (pantallas 8–15), 1.7.1.a (recomendaciones SSPA); las versiones «.b» son formulaciones de impacto.

Fuente primaria PESMA-A: https://www.sspa.juntadeandalucia.es/servicioandaluzdesalud/sites/default/files/sincfiles/wsas-media-mediafile_sasdocumento/2026/pesmaa.pdf

Fuente primaria EPVSA: https://cdn.juntadeandalucia.es/sites/default/files/inline-files/2024/04/INDICADORES_EstrategiaVidaSaludable_02abril2024.pdf

### Arquitectura y activación

- `OfficialMentalHealthReferences.ts`: catálogo de fuentes y códigos oficiales contrastados.
- `BemOfficialRevisionCandidate.ts`: los 17 códigos anteriores, con propuestas de encaje, responsables de recogida, requisitos y tratamientos. Versión **0.3-candidate**.
- `ActionPlanCatalog.ts`: sigue utilizando **BEM 0.2** como versión operativa; no se han alterado sus textos, IDs ni indicadores.
- `tests/bem-official-references.test.ts`: comprueba cobertura completa, relaciones válidas y que la nueva candidata no esté activada.

**No declarar BEM 0.3 implementado/operativo.** Antes de activarlo hay que preservar explícitamente decisiones municipales, borradores y fichas; revisar qué programas de PESMA-A son competencia local y qué indicadores requieren acuerdos de suministro sanitario. La revisión técnica debe decidir si usa pocos objetivos estratégicos oficiales y sus indicadores, en lugar de forzar siete grupos y diecisiete objetivos por inercia.

### Herramientas de producción de información que requiere COMPÁS

| Herramienta | Medida y límites |
|---|---|
| IBSE municipal | Recogida y limpieza, edad 16+, cálculo explícito, SAM, población y comparabilidad |
| DUKE-UNC-11 | Datos de apoyo social, corte oficial, adultos 16+, EAS y limitaciones de muestra |
| SF-12 | Componente mental; usar solo cálculo compatible y metodología de EAS |
| Encuestas de 8–15 años | Preguntas sobre pantallas y periodo diario; evitar mezclar edades |
| Registro escolar | Centros únicos que imparten GEA/GRUBEA por año, con fuente de Educación |
| Registro de recomendación de activos | Emisor sanitario SSPA identificable separadamente de otros sectores; no confundir recomendación con inventario |
| Localiza Salud | Inventario vigente con recursos y actividades, estado de validación, control de coincidencias |
| Registro formativo y comunitario | Actuaciones locales y cobertura; no presentar como indicador de impacto PESMA |
| Datos sanitarios asistenciales | Solo mediante fuente institucional agregada y convenio; nunca reconstruir de fichas comunitarias |

La regla fundamental es conservar **la metodología y el denominador del indicador oficial** o declarar explícitamente una medida local distinta.

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


## Arquitectura propuesta 0.3: cinco ejes oficiales y tres referencias complementarias

**Contrato de revisión propuesto; no sustituye todavía los contratos ni el módulo 0.2 vigentes.** Especificación ejecutable en `src/domain/action-plan-catalog/BemOfficialArchitecture.ts`, pruebas en `tests/bem-official-references.test.ts`.

### Objetivos PESMA-A que vertebrarían la línea

| Código original | Objetivo oficial | Rol de la planificación local | Indicadores oficiales |
|---|---|---|---|
| PESMA-A OE01 | Aumentar el bienestar emocional de la población andaluza. | Promoción comunitaria, educación y medición | IBSE (>16 años), KIDSCREEN infantil (8–16), indicadores de P.01.02 |
| PESMA-A OE02 | Mejorar la detección y atención precoz de las personas con problemas de adicciones y/o salud mental. | Formación y orientación comunitaria, sin diagnóstico clínico | No se hereda automáticamente un indicador asistencial autonómico |
| PESMA-A OE04 | Disminuir las conductas suicidas y su impacto social. | Sensibilización y coordinación para prevención | Indicadores clínicos del PESMA requieren fuente sanitaria institucional |
| PESMA-A OE05 | Fomentar un modelo comunitario y mejorar la coordinación Salud Mental, Adicciones y Atención Primaria (proceso asistencial de ansiedad, depresión y somatizaciones). | Coordinación interinstitucional bajo acuerdos | No presentar las derivaciones a GRAFA/GRUSE como indicador PESMA sin acuerdo |
| PESMA-A OE10 | Mejorar la inclusión social de las personas con problemas de salud mental y/o adicciones en colaboración con el tejido asociativo, mediante la reducción del estigma y la discriminación y fomentando la participación social. | Colaboración con asociaciones, participación y reducción del estigma | No equiparar recuentos de actividades a indicadores oficiales de inclusión |

Se preservan **sus códigos OE01/OE02/OE04/OE05/OE10**, en lugar de crear cinco títulos COMPÁS y declararlos oficiales. **PESMA-A OE03** (salud física de personas con problemas de salud mental) se conserva como referencia transversal o de colaboración sanitaria, pero no se activa como obligación clínica municipal. Lo mismo ocurre con líneas asistenciales especializadas del Plan. La selección no supone adopción automática de las ocho referencias por un municipio.

### Referencias de la EPVSA que acompañarían a los ejes PESMA-A

| Código original | Objetivo oficial | Indicadores y fuente |
|---|---|---|
| EPVSA OE1.4 | Incrementar la percepción de calidad de vida y de bienestar emocional | 1.4.3.a, componente mental SF-12; 1.4.5.a, bajo apoyo social y afectivo; Encuesta Andaluza de Salud |
| EPVSA OE1.6 | Disminuir el tiempo dedicado al uso de aparatos electrónicos, en detrimento del tiempo dedicado a familiares y amistades | 1.6.3.a, menores de 8–15 años, por EAS; transversal, no objetivo específico de salud mental |
| EPVSA OE1.7 | Incrementar las recomendaciones a la ciudadanía sobre activos comunitarios que facilitan una vida saludable | 1.7.1.a, recomendaciones desde el SSPA; no es número de fichas Localiza |

### Jerarquía y competencias

1. **Objetivo oficial:** texto/código invariable enlazado a fuente, página y versión.
2. **Programa oficial:** por ejemplo P.01.02, P.04.01, P.05.02, P.10.01; conservar código y nivel de cada objetivo programático.
3. **Contribución del Plan Local:** acuerdo de colaboración, actuación municipal, agente responsable y plazo. Es una actuación territorial, **no** otro objetivo oficial renombrado.
4. **Indicador oficial:** fuente primaria, unidad, población, método, línea base y grado de disponibilidad. La misma herramienta (IBSE, Duke) no basta para afirmar comparabilidad.
5. **Indicador local complementario:** registro separado, con denominación propia y sin equivalencia falsa.
6. **Validación y vigencia:** decisiones humanas separadas, no heredadas automáticamente de BEM 0.2.

El plan contiene otra línea de **Prevención y abordaje de las adicciones**. Los programas compartidos del PESMA-A se referencian desde ambas líneas con **una sola identidad programática oficial**; no deben duplicarse los indicadores nacionales/autonómicos bajo nuevos códigos.

### Condiciones pendientes para activar 0.3

- Selección deliberativa de ejes pertinentes y responsables territoriales; no asumir los cinco en todos los municipios.
- Contraste oficial de texto específico e indicadores de programas seleccionados.
- Especificación de fuente, periodicidad, disponibilidad y comparabilidad para cada indicador.
- Migración explícita, reversible y auditada de los borradores/fichas 0.2; ninguna validación transferida silenciosamente.
- Ensayo E2E con municipio no productivo y verificación de lectura tras guardar en Firebase.
- Aprobación humana de la estructura y sus competencias.

**Estado:** la arquitectura candidata y las pruebas están versionadas, pero **no se ha modificado el módulo operativo ni desplegado la nueva clasificación**.

### Fuentes contrastadas con las páginas originales

- PESMA-A versión aprobada, objetivos OE01–OE05, página impresa 129; OE10, página 131; programas P.01.02, páginas 137–138; indicadores OE01, página 333. [PDF oficial](https://www.juntadeandalucia.es/sites/default/files/inline-files/2026/05/PESMAA.pdf).
- EPVSA, cuadro de indicadores páginas 2–3, códigos OE1.4, OE1.6, OE1.7 y 1.4.3.a/1.4.5.a/1.6.3.a/1.7.1.a. [PDF oficial](https://cdn.juntadeandalucia.es/sites/default/files/inline-files/2024/04/INDICADORES_EstrategiaVidaSaludable_02abril2024.pdf).
