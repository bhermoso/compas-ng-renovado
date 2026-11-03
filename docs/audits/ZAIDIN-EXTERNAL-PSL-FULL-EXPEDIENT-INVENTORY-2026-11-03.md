# Granada-Zaidín — Auditoría de inventario previa a Perfil externo

> 3 de noviembre de 2026. **Estado: revisión del export público vigente; no equivale a leer/verificar los originales binarios ni el expediente privado de Firebase.**
> Modelos de composición: **Loja v0.3** (cuatro páginas de entrada, argumento conciso, referencias) y **Zagra v0.2** (lectura de conjunto, siete apartados, anexos y trazabilidad). Regla metodológica superior: contrato v2.3.0, artículos 16 quater y 17 bis/ter.
> Expediente auditado: `municipalities/granada-zaidin/exports/compas-ng-workspace-granada-zaidin.json`. Su README declara 7 documentos, 56 activos y **0 resultados de estudios complementarios**. No utilizar fixtures sintéticos históricos.

## Inventario exhaustivo de los 7 registros documentales

| # | Título | Tipo | Disponibilidad dentro del export |
|---|---|---|---|
| 1 | Informe Salud Granada Abril2023 estilo Atarfe | health-report | Solo referencia de archivo en export |
| 2 | Informe Zaidin Centro Este | territorial-documentation | Texto accesible en export |
| 3 | Informe Zaidin Sur | territorial-documentation | Texto accesible en export |
| 4 | EPVSA — Estrategia de Promoción de la Vida Saludable en Andalucía 2024–2030 | strategic-framework | Solo referencia de archivo en export |
| 5 | ESCA — Estrategia de Salud Comunitaria de Andalucía 2026-2030 | strategic-framework | Solo referencia de archivo en export |
| 6 | Plan Estratégico Integral para Personas Mayores en Andalucía 2020-2023 | strategic-framework | Solo referencia de archivo en export |
| 7 | Localiza Salud Granada-Zaidín | localiza-salud | Texto accesible en export |

El informe principal del export aún tiene la referencia histórica al DOCX reformateado; la corrección posterior documentada en `docs/ZAIDIN-INFORME-ORIGINAL-Y-PERFIL.md` establece como original principal el **PDF de abril de 2023 de 130 páginas** con SHA-256 `c42dea2e4431f79f1accc19f95f9048b6d77273ae973d5424df5c6321fad06c1`. **No debe confundirse esa migración con un nuevo diagnóstico ni con la lectura visual completa del PDF**.

## Dos informes UGC: resultado de lectura del texto conservado

Se han inspeccionado íntegramente los campos `sourceText` de **Zaidín Centro-Este** (13.044 caracteres) y **Zaidín Sur** (13.036 caracteres).

Ambos contienen el mismo esquema de **192 rótulos de indicadores** (103 atención durante toda la vida; 75 atención a crónicos; 8 información municipal; 5 información de usuarios BDU; 1 mortalidad) y afirman que seleccionan indicadores desviados una desviación típica durante al menos dos años, además de otros por su interés. **El texto conservado no contiene cifras porcentuales para estos indicadores**: son listados de indicadores «A mejorar», no series numéricas reconstruibles. Las diferencias numéricas entre UGC empleadas en el borrador proceden del Informe de Salud, no de estas listas.

**Consecuencia:** no describir estos listados como dos estudios adicionales con prevalencias diferenciadas; sí como documentación del enfoque de vigilancia que requiere originales y fechas para cualquier interpretación cuantitativa.

## Lectura de 56 recursos Localiza Salud: inventario y selección de pertinencia

A continuación se enumeran los **56 registros** del `sourceText` vigente. **«Referencia explícita a Zaidín» no significa activo validado ni acceso comprobado.** Las etiquetas de triage son de lectura del título y deben verificarse contra descripción, dirección, ámbito de prestación y voz comunitaria; no son conclusiones epidemiológicas.

| # | Recurso tal como consta | Triage territorial preliminar |
|---|---|---|
| 1 | ASOCIACIÓN ALFA (ALMANJÁYAR EN FAMILIA) | Referencia a otro sector; revisar acceso |
| 2 | Asociación Baila Swing Fin de Granada | Ámbito general/supradistrital; verificar acceso |
| 3 | Asociación de vecinos Barrio Cerrillo de Maracena (Granada) | Referencia a otro sector; revisar acceso |
| 4 | Asociación de vecinos de La Chana | Referencia a otro sector; revisar acceso |
| 5 | ASOCIACIÓN GRANADINA DE DIABETES (AGRADI). | Localización y cobertura por verificar |
| 6 | BEBECUENTOS (Hospital Universitario Clínico San Cecilio-Granada) | Ámbito general/supradistrital; verificar acceso |
| 7 | Caminatas saludables CS.Almanjáyar y CS.Cartuja | Referencia a otro sector; revisar acceso |
| 8 | CASA GRANADA APOYO POSITIVO | Ámbito general/supradistrital; verificar acceso |
| 9 | Centro de Participación Activa Buenos Aires | Localización y cobertura por verificar |
| 10 | Centro de Participación Activa Plaza de los Campos | Referencia a otro sector; revisar acceso |
| 11 | Centro de Participación Activa San Ildefonso | Referencia a otro sector; revisar acceso |
| 12 | Centro de Participación Activa Zaidín | Referencia explícita a Zaidín |
| 13 | Centro Juvenil de Orientación para la Salud (CEJOS-UGR) | Localización y cobertura por verificar |
| 14 | Fundación Albihar | Ámbito general/supradistrital; verificar acceso |
| 15 | FUNDACIÓN CRUZ BLANCA | Ámbito general/supradistrital; verificar acceso |
| 16 | Fundación Theodora | Ámbito general/supradistrital; verificar acceso |
| 17 | GRUPO AFRONTAMIENTO DE ANSIEDAD CENTRO DE SALUD ALBAYDA | Referencia a otro sector; revisar acceso |
| 18 | Grupo de Afrontamiento de Ansiedad (GRAFA- Centro de Salud Almanjáyar) | Referencia a otro sector; revisar acceso |
| 19 | Grupo de afrontamiento de la ansiedad (GRAFA- Centro de Salud de Gran Capitán)ontamiento a la ansiedad) | Referencia a otro sector; revisar acceso |
| 20 | Grupo de Afrontamiento de la Ansiedad Zaidin Sur(GRAFA) | Referencia explícita a Zaidín |
| 21 | Grupos de Afrontamiento de la Ansiedad en Atención Primaria (GRAFA- Centro de Salud de Cartuja) | Referencia a otro sector; revisar acceso |
| 22 | Grupos de Afrontamiento de la Ansiedad (GRAFA-Centro de Salud La Chana) | Referencia a otro sector; revisar acceso |
| 23 | Grupo Socieducativo (GRUSE- Centro de Salud Bola de Oro) | Referencia a otro sector; revisar acceso |
| 24 | Grupo socioeducativo (GRUSE- Centro de Salud Almanjáyar) | Referencia a otro sector; revisar acceso |
| 25 | Grupo Socioeducativo (GRUSE-Centro de Salud Chana) | Referencia a otro sector; revisar acceso |
| 26 | Grupo Socioeducativo (GRUSE- Centro de Salud Doctores Dr. Salvador Caballero) | Referencia a otro sector; revisar acceso |
| 27 | Grupo Socioeducativo (GRUSE- Centro de salud Góngora) | Referencia a otro sector; revisar acceso |
| 28 | Grupo Socioeducativo (GRUSE- Centro de salud Zaidín Sur) | Referencia explícita a Zaidín |
| 29 | GRUPOS SOCIOEDUCATIVOS DE ATENCIÓN (GRUSE CS ZAIDIN/CENTRO) | Referencia explícita a Zaidín |
| 30 | Iniciacion al yoga y mindfullnes en Centro de Salud de Gran Capitán | Referencia a otro sector; revisar acceso |
| 31 | Inserta Andalucía Granada (Área de Mujer y Diversidad) | Ámbito general/supradistrital; verificar acceso |
| 32 | MAQUINAS DE EJERCICIOS BIOSALUDABLES | Localización y cobertura por verificar |
| 33 | Marcha Saludable | Localización y cobertura por verificar |
| 34 | Parque Antonio Jiménez Blanco (Realejo, Granada) | Referencia a otro sector; revisar acceso |
| 35 | Parque biosaludable Las Alquerías (Chana/Ronda) | Referencia a otro sector; revisar acceso |
| 36 | Parques de la Avenida Federico García Lorca Granada (cerca de Centro de Salud Albayda) | Referencia a otro sector; revisar acceso |
| 37 | PISCINA CUBIERTA ALMINARES DEL GENIL | Localización y cobertura por verificar |
| 38 | PISCINA MUNICIPAL ALMANJAYAR | Referencia a otro sector; revisar acceso |
| 39 | Proyecto "Leer conmigo" para personas ingresados en la Unidad de Cirugía (Hospital Universitario Clínico San Cecilio-Granada) | Posible duplicado (entradas 39–40) |
| 40 | Proyecto Leer Contigo (Hospital Universitario Clínico San Cecilio-Granada) | Posible duplicado (entradas 39–40) |
| 41 | Punto Vuela Almanjayar | Referencia a otro sector; revisar acceso |
| 42 | Punto Vuela Zaidín | Referencia explícita a Zaidín |
| 43 | QUIOSCO DE LA MÚSICA | Localización y cobertura por verificar |
| 44 | Sesiones de Yoga y Mindfulness (Hospital Universitario Clínico San Cecilio-Granada) | Ámbito general/supradistrital; verificar acceso |
| 45 | Taller Alimenta tu bienestar del Centro de Participación Activa Buenos Aires | Localización y cobertura por verificar |
| 46 | Taller de Afrontamiento de la Ansiedad (GRAFA) | Localización y cobertura por verificar |
| 47 | Taller de bienestar emocional para profesionales (Hospital Universitario San Cecilio-Granada) | Ámbito general/supradistrital; verificar acceso |
| 48 | TALLER DE CUIDADOS DEL PIE DIABÉTICO /Centro de Salud Góngora) | Referencia a otro sector; revisar acceso |
| 49 | Taller de Memoria del Cenro de Participación Activa Buenos Aires | Localización y cobertura por verificar |
| 50 | Taller de Teatro del Centro de Participación Activa Buenos Aires | Localización y cobertura por verificar |
| 51 | Taller de Yoga del Centro de Participación Activa Buenos Aires | Localización y cobertura por verificar |
| 52 | Talleres de Hábitos Saludables del Centro de Salud Góngora | Referencia a otro sector; revisar acceso |
| 53 | Talleres de mejora del desarrollo motor del Centro de Participación Activa Buenos Aires | Localización y cobertura por verificar |
| 54 | Talleres deportivos y sociales para mayores de 60 años | Localización y cobertura por verificar |
| 55 | Talleres para personas cuidadoras (Hospital Universitario Clínico San Cecilio-Granada) | Ámbito general/supradistrital; verificar acceso |
| 56 | Taller vivir en positivo del Centro de Participación Activa Buenos Aires | Localización y cobertura por verificar |

Hay numerosos registros de la ciudad de Granada fuera del Zaidín (Almanjáyar, Chana, Cartuja, etc.), servicios supradistritales y una pareja posiblemente duplicada (`Proyecto Leer Contigo` / `Leer conmigo`). **No puede afirmarse que los 56 sean recursos situados en el Zaidín**. Su utilidad funcional puede superar los límites del distrito, pero requiere declararlo. Asimismo, los listados son registros no una medición de acceso, cobertura o efecto.

## Base de evidencia y decisiones abiertas

1. **Informe de Salud original:** PDF 130 páginas, identificado por SHA-256. Está conservada en repositorio una extracción histórica de texto de ~111.178 caracteres; esta auditoría aún **no certifica** página a página las figuras, tablas, comparadores y citas. Está pendiente revisar el binario original de forma visual, con referencia de folio.
2. **Informes UGC:** lectura del texto completo realizada; no aportan valores cuantitativos verificables dentro del export. Es necesaria identificación de los originales para cotejo de fechas y series.
3. **Activos Localiza Salud:** 56 fichas inventariadas, ubicación y accesibilidad clasificadas provisionalmente; duplicados y ámbito funcional pendientes de contraste.
4. **Marcos estratégicos:** EPVSA 2024–2030, ESCA 2026–2030 y Plan de Mayores 2020–2023 figuran **como referencias sin cuerpo en el export**. No se les atribuyen indicaciones específicas sin consultar los documentos íntegros.
5. **Estudios complementarios:** 0 observaciones reales en el export vigente. Está prohibido reciclar los antiguos 36 átomos de instrumentos sintéticos.
6. **Prioridades ciudadanas:** no se ha acreditado en los siete registros una priorización del Zaidín con fecha, instrumento y muestra. No inventar voz comunitaria ni equiparar el listado de activos a una consulta.
7. **Escala y tiempos:** distinguir Zaidín distrital, unidades asistenciales Zaidín Centro-Este y Sur, ciudad de Granada y escalas mayores. Mortalidad municipal no se atribuye al Zaidín.
8. **Autorialidad:** todo texto externo es **borrador técnico propuesto**, nunca validación humana o institucional automática.

## Resultado de conformidad

**No apto todavía para aprobar o importar como Perfil externo completo.** Sí existe evidencia suficiente para formular hipótesis y una estructura de perfil; no para certificar trazabilidad íntegra del original, materiales cualitativos ni validación de todos los recursos.

**Secuencia obligatoria:** originales íntegros y fichas verificadas → matriz por afirmación con página/tabla/escala/año → lectura integrada → conclusiones y recomendaciones humanas → original externo PDF/DOCX/JSON → importación como revisión nueva, sin sustituir perfiles previos.
