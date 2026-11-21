# Registro de trabajo de COMPÁS renovado

Este registro deja constancia, por fecha, de lo que se ha comprobado en la
aplicación publicada, de lo que ha cambiado y de lo que queda pendiente. Lo
puede retomar cualquier sesión de trabajo, sea quien sea el asistente o la
persona que la conduzca. Las conversaciones no son fuente: cuando una entrada
recoge una afirmación hecha en una conversación, indica si se ha comprobado.

## Cómo se escribe una entrada

- La entrada más reciente va arriba.
- Cada entrada indica el commit que servía GitHub Pages al empezar
  (`version.json`) y el que sirve al terminar.
- Cada comprobación declara con qué datos se hizo: expediente del repositorio
  (`public/seeds`), expediente real en Firestore (`compas-98dd7`) o datos
  sintéticos. Una comprobación con expedientes del repositorio no acredita el
  comportamiento con perfiles, historiales y originales reales.
- Se separan hechos observados, inferencias, decisiones institucionales o del
  responsable e hipótesis. «No verificado» es una respuesta válida.
- Las credenciales no se escriben aquí. Se nombra la variable de entorno que
  las contiene, nunca su valor.

---

## 2026-11-21 · Instrumentos de medición que traen las estrategias

**Publicado al empezar:** `09b92603c21358a89a156772421d2eba8c2d0833` (#197).

### Hechos observados (cotejo de las fuentes)

- **PESMAA 2026–2029, capítulo de evaluación (págs. 332 y siguientes).** Por
  cada objetivo estratégico recoge indicador, fuente, valor de referencia,
  desagregación y meta. Para el OE1 «Aumentar el bienestar emocional de la
  población andaluza»:
  - indicador 1: «Índice Bienestar Emocional de la población Infantil
    (KIDSCREEN). Población de 8 a 16 años». Encuesta Andaluza de Salud 2023;
    referencia global 58,51 (niñas 57,54; niños 58,93);
  - indicador 2: «Índice de Bienestar Emocional (IBSE). Población > 16 años».
    Encuesta Andaluza de Salud 2023; referencia global 75,94 (mujeres 73,98;
    hombres 78,01).
- **EPVSA, ficha de indicadores (02/04/2024),** todos con la Encuesta Andaluza
  de Salud como fuente:
  - 1.4.1: Kidscreen;
  - 1.4.2 y 1.4.3: SF-12 (componentes físico y mental);
  - 1.4.4: felicidad, en escala de 0 a 10;
  - 1.4.5: DUKE (apoyo social y afectivo);
  - 1.6.3: pregunta de la EAS sobre uso de aparatos electrónicos.
- **COMPÁS ya explota como estudios complementarios** el IBSE, el SF-12 de la
  EAS y el Duke-UNC-11 de la EAS. KIDSCREEN no está implementado.
- **Procedencia de BEM-I1.1 corregida.** Figuraba como propia de COMPÁS, con
  la nota de que la EPVSA no usa el IBSE. Es cierto para la EPVSA, pero el
  PESMAA sí lo usa (OE1, indicador 2). Pasa a «adaptada», con la cita
  literal.
- **Adicciones.** Los indicadores del módulo ADI (competencias preventivas,
  percepción de riesgo, ocio, controles de venta a menores, detección y
  derivación) son de proceso o de evaluación pre-post de programas. En el
  capítulo de evaluación del PESMAA, los indicadores de adicciones se miden
  con sistemas de registro (SIPASDA, historia clínica, FAISEM), no con
  escalas. ESTUDES aparece en el análisis de situación, no en la evaluación.
  - No se ha encontrado en el PESMAA ni en la EPVSA un instrumento que mida
    los indicadores ADI tal como están redactados.
  - No se han revisado el contenido de la Estrategia de Salud Mental del SNS
    ni el de la Estrategia Nacional sobre Adicciones.

### Cambio

- **Catálogo de instrumentos:** nuevo tipo «Instrumento de la estrategia»,
  cuya evidencia cita literalmente la fuente. Para Bienestar emocional hay
  seis:

  | Instrumento | Objetivos |
  |---|---|
  | IBSE | BEM-OE1.1, 1.2, 1.3 y 2.1 |
  | KIDSCREEN | BEM-OE1.1 |
  | SF-12 (componente mental) | BEM-OE1.1 |
  | Felicidad de 0 a 10 | BEM-OE1.1 |
  | Duke-UNC-11 | BEM-OE2.2 |
  | Pregunta de la EAS sobre pantallas | BEM-OE3.3 |

  Cada uno declara sus límites. Por ejemplo, la comparabilidad del monitor
  municipal con la EAS, o que KIDSCREEN no está implementado en COMPÁS.
- **Adicciones** sigue declarando que no tiene instrumentos preparados.

### Decisión pendiente del responsable

- **Adicciones:** diseñar localmente los cuestionarios pre-post de sus
  indicadores, o reformular los indicadores para usar las fuentes del PESMAA
  (SIPASDA), ESTUDES o los estudios que ya tiene COMPÁS (AUDIT-C, CAGE,
  Fagerström). Inferencia: AUDIT-C, CAGE y Fagerström miden consumo, no
  competencias ni percepción de riesgo.

---

## 2026-11-21 · Dependencias entre líneas del Plan de Acción: instrumentos de recogida

**Publicado al empezar:** `92d9f1bb70508390f94fd28987a6d7693f756774` (#196).

### Hechos observados

- **El responsable detectó el problema** en «Gestionar actuaciones · BEM-I1.1»:
  se podían elegir los ejes de Envejecimiento.
- **Reproducido en el navegador** con Atarfe de `public/seeds`. En las fichas
  de BEM-I1.1 y de ADI-I1.1, «Instrumentos para preparar la recogida»
  ofrecía los ejes de Envejecimiento saludable (Edadismo, Soledad no deseada,
  Autonomía, Participación) y la nota «No se han registrado mediciones del
  Zaidín», con 0 instrumentos.
- **Causa.** `PlanningInstrumentCatalog` estaba escrito para Envejecimiento:
  - ejes fijos en el código;
  - objetivo deducido sustituyendo `ENV-I` por `ENV-OE`.
  - Todos los instrumentos de `PlanningInstruments.ts` pertenecen a objetivos
    `ENV-`.
- **El contenido de Bienestar emocional y salud mental es propio.** Su objetivo
  sobre soledad no deseada (BEM-OG2) procede de la EPVSA (indicador 1.4.5) y
  de la Estrategia de Salud Mental del SNS, no del módulo de Envejecimiento.
- **Las demás referencias a Envejecimiento** en el código del Plan
  (`ZAIDIN_AGING_PROPOSAL`, `HEALTHY_AGING_MODULE`) se aplican solo a su propio
  módulo, y a Granada-Zaidín y Zagra.
- **Las propuestas de actuación** (`ActionWorksheetProposal.ts`) solo existen
  para indicadores `ENV-` y no aparecen en otras líneas.

### Cambio

- **Cada línea muestra solo los instrumentos de sus propios objetivos.** Los
  ejes se obtienen de esos instrumentos y no de una lista fija.
- **Bienestar emocional y Adicciones** muestran ahora que la línea no tiene
  todavía instrumentos de recogida preparados en COMPÁS, y que el catálogo
  existente corresponde a Envejecimiento y no se les aplica.
- **Envejecimiento saludable** conserva su catálogo y sus ejes.
- Prueba: `tests/planning-instruments-by-line.test.tsx`.

### Pendiente

- Decidir los instrumentos de recogida de Bienestar emocional, por ejemplo
  el IBSE, que COMPÁS ya explota como estudio complementario, y los de
  Adicciones. Deben documentarse con versión, población, permisos,
  preguntas y puntuación.
- `tests/collection-preparation.smoke.mjs` y
  `tests/plan-preparation.smoke.mjs` fallan también en `master`: no llegan a
  la pestaña porque la entrada exige sesión. No están en la integración
  continua.

---

## 2026-11-21 · Perfil de Salud Local con el diseño de Inicio

**Publicado al empezar:** `35799144ae8ca68a6235beaee4706c7f3a03a088` (#195).
**Publicado al terminar:** el commit de fusión de esta PR. Hay que comprobar
`version.json` después de fusionar.

### Cambio

- **Portada.** Perfil usa la portada común con la fase «02 · Perfilar». A la
  derecha muestra la versión vigente (título, periodo, validada o en
  revisión) y el número de revisiones pendientes. Sin Perfil, recuerda que se
  elabora fuera de COMPÁS y que condiciona la priorización y el Plan de
  Acción.
- **Espacios del Perfil.** Son columnas de fase con línea de estado:
  - Perfil: indicadores, y si es la versión vigente o no;
  - Documento completo;
  - Gestión y versiones: número de versiones y estado;
  - Actualizador de perfiles;
  - Laboratorio experimental;
  - Comprobar PDF original.

  Sin Perfil, las columnas son «Incorporar un perfil», «Comprobar PDF
  original» y, si hay legado, «Perfiles anteriores de COMPÁS».
- **El espacio abierto** se despliega a todo el ancho bajo las columnas. Su
  contenido, sus funciones y la persistencia no cambian.
- **Especificidad CSS.** La regla general `.workspace-page.hp:not(.diagnosis-page)`
  de `HomePortada.css` prevalecía sobre las rejillas propias de Perfil y de Plan
  de Acción. Los selectores se han reforzado; en Plan de Acción el número de
  columnas vuelve a seguir el número de secciones.

### Comprobado con datos de prueba

- **Atarfe de `public/seeds`,** sin Perfil y con un Perfil sintético: dos
  versiones, v1 validada y vigente y v2 en revisión.
  - El Perfil sintético se inyectó solo en el navegador de prueba; no se
    escribió en Firebase.
  - A 1280×720 y 390×844 la entrada cabe en una pantalla y al replegar
    vuelve a una pantalla.
  - Espacios abiertos a 1280×720: Perfil 2,7 pantallas, Documento 1,4,
    Gestión y versiones 2,9, Actualizador 1,7 y Laboratorio 4,4.
- Integración continua: correcta.
- Suite completa: los mismos 15 fallos previos.
- Pruebas de humo: correctas.
- Las nueve pestañas siguen sin desplazamiento en su vista de entrada.

### Comprobado con expedientes reales

Nada.

### Pendiente

- El interior de Gestión y versiones y del Laboratorio conserva su estilo
  anterior y es largo: 2,9 y 4,4 pantallas.

---

## 2026-11-21 · Plataforma documental del expediente («Consultar documentación»)

**Publicado al empezar:** `abffd381c6902272b106c5943b783ed2d2521042` (#193).
**Publicado al terminar:** el commit de fusión de esta PR. Hay que comprobar
`version.json` después de fusionar.

### Hechos observados antes del cambio

- La ventana «Consultar documentación» era una lista plana con todas las
  fichas. Las copias municipales de marcos se mostraban como «Marco
  estratégico y normativo», mezcladas con los documentos del municipio.
- La ficha marcaba «Original pendiente» en documentos cuyo PDF se descargaba
  desde la misma ficha, por ejemplo el Informe de Salud de Granada-Zaidín.
  - Causa: solo contaba los originales guardados en el expediente
    (`documentOriginals`), no los PDF conservados en COMPÁS.

### Cambio

- **Ventana a pantalla casi completa,** con la cabecera de la portada:
  expediente, título y línea de seis colores. Muestra las cifras del
  expediente: fichas, fichas con archivo de origen y fichas archivadas.
- **Índice a la izquierda,** organizado por función municipal (01 Informes de
  Salud … 08 Otras fuentes).
  - Búsqueda por título, archivo, procedencia, tipo, etiquetas o fecha.
  - Cada ficha muestra su tipo, su fecha o periodo declarado (nunca la fecha
    de carga), la disponibilidad del archivo de origen, si hay texto
    conservado, su versión y si está archivada.
- **Ficha a la derecha:** el contenido de antes (procedencia, original,
  transcripción, trazabilidad, versiones y operaciones), con líneas en lugar de
  cajas.
  - Sin documento seleccionado, un resumen por funciones; cada función filtra
    el índice.
- **Marco estratégico común,** al pie del índice y separado de los documentos
  del municipio. Las copias municipales se agrupan en «07 · Copias municipales
  de marcos comunes».
- **Disponibilidad del archivo de origen,** con un criterio único:
  - original en el expediente;
  - PDF conservado en COMPÁS;
  - enlace a la fuente;
  - sin original.

  El texto conservado no cuenta como original.
- **Móvil:** índice y ficha a pantalla completa, con «← Índice documental»
  para volver.

### Comprobado con datos de prueba

- Atarfe y Granada-Zaidín de `public/seeds`, a 1280×720 y 390×844: índice,
  ficha, búsqueda y marco común, sin desbordamiento horizontal ni errores de
  página.
- Integración continua: correcta.
- Suite completa: los mismos 15 fallos previos.
- `tests/documentation-references.smoke.mjs` está desfasada (usa la ruta
  `/COMPAS_NG/`) y no está en la integración continua. No se ha adaptado.

### Comprobado con expedientes reales

Nada.

---

## 2026-11-21 · Marco estratégico común y PESMAA

**Publicado al empezar:** `c9ecb788289cd5e81382ac1620e3b512e289fa77` (#192).
**Publicado al terminar:** el commit de fusión de esta PR. Hay que comprobar
`version.json` después de fusionar.

### Hechos observados

- **Había dos listas de marcos que no coincidían.**
  - La biblioteca común de Diagnóstico (`STRATEGIC_REFERENCES`) tenía 4
    documentos: no incluía el PESMAA y titulaba la EPVSA «Líneas estratégicas
    EPVSA».
  - La «Documentación de apoyo» del Plan de Acción (`SUPPORT_DOCUMENTS`) tenía
    8, con denominación oficial, organismo y vigencia.
- **La biblioteca común no dependía del expediente,** pero estaba dentro de
  «Otras herramientas», que empieza plegado.
- **Lo que el responsable veía en unos expedientes y no en otros eran copias
  municipales.** En `public/seeds`, Granada-Zaidín guarda como documentos
  propios tres marcos (EPVSA, ESCA y Plan de mayores); Atarfe, Loja, Alfacar y
  Fuente Vaqueros no guardan ninguno. Por eso el gestor documental de
  Granada-Zaidín los muestra y el de los demás no.
  - En Firestore: no verificado.
- **El PESMAA se ha incorporado.**
  - Original: *I Plan Estratégico de Salud Mental y Adicciones de Andalucía
    2026–2029*, 334 páginas, descargado de la sede de la Junta de Andalucía
    (`juntadeandalucia.es/sites/default/files/inline-files/2026/05/PESMAA.pdf`).
  - SHA-256: `ca19fbf2466bdf4ced8630aae698adf2817321d4c68abd0b5b1280e7f477bd86`.
  - Contiene 6 líneas estratégicas. El OE01 «Aumentar el bienestar emocional
    de la población andaluza» coincide literalmente con la cita del módulo
    Bienestar emocional y salud mental del catálogo.

### Cambio

- **Fuente única.** La biblioteca común deriva ahora de la documentación de
  apoyo: las mismas 8 referencias en Diagnóstico y en el Plan de Acción, con su
  denominación oficial.
  - Orden: ESA 2030, ESCA, EPVSA (líneas, objetivos e indicadores; y la ficha
    de indicadores), PESMAA, Plan de mayores, Estrategia de Salud Mental del SNS
    y Estrategia Nacional sobre Adicciones.
  - Desaparece «Líneas estratégicas EPVSA»; se usa la denominación oficial de
    la estrategia.
- **PESMAA.** Se conserva en
  `docs/source-material/strategic-frameworks/PESMAA 2026-2029.pdf` y se incluye
  en la compilación.
- **Diagnóstico.**
  - «Marco estratégico común» es un acceso de primer nivel, igual en todos los
    expedientes. La entrada pasa a cinco columnas.
  - «Otras herramientas» conserva la revisión de las copias municipales de
    marcos.
- **Sin cambios en datos.** No se ha borrado ni movido ninguna copia municipal.
  Retirarlas exige una operación sobre Firestore con cotejo y copia
  recuperable.
- **Ajustes de móvil:**
  - la línea de estado de cada acceso de Diagnóstico se recorta a una línea;
  - por debajo de 420 px se oculta la etiqueta «Expediente cargado:», mientras
    el nombre del ámbito y «Cambiar ámbito» siguen visibles.

### Estadística territorial y Perfil externo

Hechos comprobados en el código (`TerritorialStatisticsPanel.tsx`,
`ExternalProfileDashboard.tsx`, `externalProfiles.ts`,
`MunicipalityRuntime.ts`). No se han observado con un expediente real.

1. «Preparar la nueva revisión del Perfil» (en Diagnóstico → Estadística)
   abre en Perfil un borrador que:
   - es una copia del Perfil vigente, con identificador nuevo;
   - declara `revisionOf` = vigente y `status: review`;
   - lleva los indicadores añadidos o actualizados;
   - añade a sus limitaciones una nota que dice que el PDF original no
     contiene esos datos.
2. El texto del Perfil, sus adjuntos originales y la versión vigente no
   cambian.
3. Al guardar, la revisión se añade a la biblioteca de versiones, pero
   `activeId` sigue apuntando a la vigente.
4. Priorización, Lectura Estratégica Local y Plan de Acción leen el Perfil
   vigente (`activeId`). Mientras nadie pulse «Establecer como vigente» en
   Gestión y versiones, la cadena aguas abajo no cambia.

Inferencia: la decisión de que la estadística condicione la priorización y el
Plan es explícita y humana, y queda registrada como cambio de versión vigente.

### Pendiente

- Decidir si se retiran las copias municipales de marcos en Granada-Zaidín, y
  en los expedientes reales que las tengan, con cotejo previo en Firestore.
- Comprobar en Firestore qué expedientes guardan copias de marcos.

---

## 2026-11-21 · Plan de Acción con el diseño de Inicio (#192)

**Publicado al empezar:** `70730b15760461d90d8df64e9bd769a681ce675b` (#191).
**Publicado al terminar:** el commit de fusión de #192. Hay que comprobar
`version.json` después de fusionar.

### Cambio

- **Portada.** Plan de Acción usa la portada común con la fase
  «04 · Planificar». Desaparecen el desplegable único «Secciones del Plan de
  Acción», la caja de título anterior y las pestañas internas.
- **Secciones.** Cada sección es una columna de fase plegable:
  - siempre: Líneas e indicadores y Plan resultante;
  - con Lectura Estratégica Local, además: Lectura estratégica,
    Participación y prioridades y Borrador de actuaciones.
  - Solo hay una abierta a la vez, que ocupa el ancho completo; su contenido
    se monta al abrirla.
- **Interior:**
  - la cabecera del catálogo sigue la jerarquía de la portada y sus
    explicaciones pasan a «Cómo funciona»;
  - desaparecen las cajas anidadas;
  - los controles de validación y descarga tienen el estilo de la aplicación;
  - el formulario G-PLS-7 se pliega y su estado sigue visible.
- **Plan resultante** muestra el nombre del ámbito y no su identificador.

### Comprobado con datos de prueba

Expedientes de `public/seeds`.

| Expediente | Tamaño | Al entrar | Líneas e indicadores abierta | Plan resultante abierto | Al plegar |
|---|---|---|---|---|---|
| Atarfe | 1280×720 | 1 pantalla | 1,5 pantallas | 1,6 pantallas | 1 pantalla |
| Granada-Zaidín | 1280×720 | 1 pantalla | 1,5 pantallas | 2,2 pantallas (antes 2,8) | 1 pantalla |
| Loja | 1280×720 | 1 pantalla | — | — | 1 pantalla |
| Atarfe, Loja y Granada-Zaidín | 390×844 | 1 pantalla | — | — | 1 pantalla |

- Ninguno de los tres expedientes activa la variante de cinco secciones: no
  hay Lectura Estratégica Local. Esa variante no se ha observado en pantalla.
- Integración continua: correcta.
- Suite completa: los mismos 15 fallos previos.
- `tests/plan-preparation.smoke.mjs`, que no está en la integración continua,
  ya fallaba en `master` antes del cambio porque no encuentra la pestaña.

### Comprobado con expedientes reales

Nada. No hay credenciales en la sesión.

### Pendiente

- Observar la variante de cinco secciones con un expediente que tenga Lectura
  Estratégica Local.
- «Otras herramientas» de Diagnóstico sigue con el estilo anterior.
- La denominación «Línea estratégica» de los módulos RELAS sigue pendiente de
  decisión (véase la entrada anterior).
- Revisar `tests/plan-preparation.smoke.mjs`.

---

## 2026-11-21 · Auditoría de la versión publicada y navegación de escritorio

**Publicado al empezar:** `0fe40edc75016cef9be67ef90116e79f4e175314` (#189).
**Publicado al terminar:** `240fcd2d7f841bd129e6d8250d35e718d4877f29` (#190),
construido a las 09:04:42 UTC.
El paquete `App-*.js` servido por Pages es idéntico byte a byte al construido
en local desde ese commit.

### Hechos observados

**Integración continua**

- El flujo *Plan document validation* estaba en rojo desde #185 (21-nov,
  00:53 UTC). Se fusionaron con él en rojo #185, #186, #187, #188 y #189.
  - La causa era `tests/fuente-vaqueros-hydration.smoke.mjs`, que esperaba un
    encabezado `<h2>` con el nombre del municipio. #185 retiró ese encabezado
    por diseño.
  - Con #190 la prueba localiza el municipio en la cabecera común. Abre el
    gestor documental y su catálogo, que están plegados por diseño, antes de
    comprobar el documento.
  - La condición verificada no cambia: 1 documento y 29 evidencias, también
    tras recargar con el JSON del seed bloqueado. El flujo vuelve a estar en
    verde.
- La suite completa (`npx vitest run`) tiene 15 fallos. Son los mismos 15 que
  ya fallaban en `dab5d78` (#184), antes del rediseño de interfaz. Ninguno
  figura en la lista que ejecuta la integración continua:
  - contratos de color sin valores literales: `agenda-visual-contract`,
    `citizen-participation-summary`, `local-health-cycle-phase-strip`,
    `sam-assess-sample`, `sam-tripyramid`;
  - `diagnosis-control-summary`;
  - `document-ingestion-origins`, idempotencia de Localiza;
  - `ibse-restoration-audit`;
  - `pa-relas-02-ui`;
  - `plan-preparation`, cuatro casos;
  - `profile-dashboard`, secciones censales;
  - `psl-c-impresion-regimen`, un solo bloque `@media print`.

**Vista inicial de las nueve pestañas**

- Se comprobó con los expedientes de Atarfe, Loja y Granada-Zaidín de
  `public/seeds`, a 1280×720 y a 390×844.
- Ninguna de las 54 vistas tiene desplazamiento vertical ni horizontal.
- Todas comparten la cabecera común: marco EPVSA, caja de logos y línea de seis
  colores.
- El desbordamiento horizontal de Inicio en móvil (671 px de ancho sobre
  390 px), observado en `373e1c2`, ya no se produce desde #189.

**Navegación de escritorio** (corregida en #190)

- A 1280, 1440, 1600 y 1920 px, la barra de pestañas tenía un ancho fijo de
  1124 px. Plan Local de Salud, 05 Implantación, 06 Evaluación y Gestor de
  Encuestas solo eran accesibles desplazando una barra horizontal de 3 px.
- Desde #190:
  - a partir de 961 px caben las nueve pestañas, y las etiquetas largas se
    parten en dos líneas por un punto fijo («Perfil de / Salud Local»);
  - entre 761 y 960 px se usa el selector «Ir a», como en móvil.
- Prueba estática: `tests/nav-desktop-fit.test.ts`.

**Paneles abiertos** (expediente de Atarfe del repositorio, 1280×720)

| Acceso | Alto de la página abierta | Observación |
|---|---|---|
| Diagnóstico · Ver estado y cronología | 1,5 pantallas | Métricas, línea temporal y filtros. |
| Diagnóstico · Gestor documental | 1,5 pantallas | Cabecera editorial y línea de color. El catálogo se abre aparte. |
| Diagnóstico · Estadística territorial | 1,4 pantallas | Cabecera editorial y línea de color. |
| Diagnóstico · Otras herramientas | 2,7 pantallas | 15 desplegables internos; tarjetas de estilo anterior. |
| Plan de Acción · Secciones | 2,2 pantallas | Dos cabeceras de estilo anterior en caja propia («Plan Local de Salud 2027–2030», «Plan de Acción · edición directa»); 122 desplegables internos. |

Al volver a plegar cualquiera de ellos, la vista regresa a una pantalla.

**Errata** (corregida en #190)

- La sección 1 del esbozo del Plan Local de Salud decía «ciclo de planificación
  local en salud delAtarfe». Ahora dice «de Atarfe».

**Líneas estratégicas de la EPVSA**

- La fuente oficial en el repositorio es
  `docs/source-material/strategic-frameworks/08_Lineas_EPVSA_02abril24.pdf`.
  Establece 4 líneas (LE 1 a LE 4) y 10 objetivos estratégicos
  (OE 1.1 a 1.7, OE 2.1, OE 3.1 y OE 4.1).
- `src/domain/agenda/historicEpvsaStructure.ts` reproduce literalmente líneas
  y objetivos. Solo lo usa el selector de actuaciones-tipo de Implantación.
- `src/domain/strategy/StrategicFrameworkRegistry.ts` y
  `src/application/epvsa/EPVSATranslator.ts` titulan las líneas con
  denominaciones que no figuran en la fuente: «LE1 · Acción local en salud y
  comunidad», «LE2 · Entornos y estilos de vida saludables», «LE3 · Equidad,
  determinantes sociales y vulnerabilidades» y «LE4 · Gobernanza, evaluación y
  conocimiento para la salud».
  - Esas denominaciones no aparecen en ninguna de las nueve pestañas.
  - Se recorrieron con todos los desplegables abiertos y el expediente de
    Granada-Zaidín. `EPVSAPanel` no está montado en la aplicación.
- Los nombres oficiales de las líneas tampoco aparecen en ninguna pestaña. La
  biblioteca estratégica de Diagnóstico ofrece el PDF como documento
  («Líneas estratégicas EPVSA»).
- El Plan de Acción rotula como «Línea estratégica» los tres módulos del
  catálogo RELAS: Envejecimiento saludable, Prevención y abordaje de las
  adicciones, y Bienestar emocional y salud mental.
  - La EPVSA solo figura como procedencia de algunos elementos
    (`ActionPlanCatalog.ts`):
    - Bienestar emocional: 13 de 41 elementos.
    - Envejecimiento saludable: 7 de 45.
    - Adicciones: 0 de 30.
  - Todas esas referencias remiten a objetivos de la LE 1 (OE 1.4, OE 1.6 y
    OE 1.7). Las LE 2, LE 3 y LE 4 no aparecen.

### Comprobado con datos de prueba

- Las cinco pruebas de humo de la integración continua, en local.
- La lista de la integración continua: 305 de 305.
- `npm run build`.
- Vistas iniciales y paneles abiertos con los expedientes del repositorio.
- Carga de un perfil sintético en formato Markdown en Perfil de Salud Local:
  se abre la revisión previa, pero guardar exige sesión de Firebase. No se
  guardó nada.
- Descarga de Estadística territorial para Atarfe (INE 18022) contra los
  servicios reales del INE y el IECA, en local y sin escribir en Firestore. La
  descarga avanzó hasta la consulta 21 de 24, pero no terminó en unos 5
  minutos.
  - No se pudieron observar las descargas guardadas, el detalle por bloques ni
    la preparación de una revisión del Perfil.
  - No queda establecido si se trata de lentitud del IECA o de un fallo del
    panel.

### Comprobado con expedientes reales

Nada. La aplicación publicada exige usuario y contraseña de Firebase, y la
sesión no disponía de credenciales.

### Afirmaciones previas no verificadas en esta sesión

Proceden del trabajo realizado el mismo día en otra conversación. Se conservan
como punto de partida, no como hecho comprobado.

- Que con #189 «pasaron 88 pruebas». La integración continua de esa rama falló
  tres veces antes de fusionarse (`8da3268`, `0366def`, `dfaa6e3`). No consta
  qué 88 pruebas se ejecutaron.
- Que las nueve vistas iniciales cabían sin desplazamiento con un expediente de
  prueba.
  - **Confirmado** en cuanto al desplazamiento vertical.
  - No advertía que cuatro pestañas quedaban ocultas en escritorio.
- Que Perfil permite abrir el documento y Gestión y versiones. Con los
  expedientes del repositorio, que no traen Perfil, solo se ofrecen «Incorporar
  un perfil» y «Comprobar PDF original».
- Que en Firestore los expedientes vigentes de Atarfe y Loja conservan dos
  descargas del 18-11-2026 cada uno (Atarfe: 408 y 498 observaciones; Loja: 582
  y 697), con sus fuentes.
- Que el informe de salud de Atarfe es una reconstrucción a partir del texto
  conservado y que su original no está acreditado. También queda por
  distinguir, en Loja, la referencia al documento de la comprobación efectiva
  de su original.

### Inferencias

- La cabecera «Marco estratégico · Estrategia de Promoción de una Vida
  Saludable en Andalucía» no tiene aún correspondencia en el Plan de Acción.
  Ningún módulo se presenta anclado a una línea EPVSA identificable por su
  nombre oficial.
- Fusionar con la integración continua en rojo dejó sin detectar durante cinco
  PRs que la prueba había dejado de comprobar la hidratación.

### Decisiones pendientes del responsable

- Denominación de los módulos del catálogo RELAS en el Plan de Acción, hoy
  «Línea estratégica». Para el responsable, «líneas estratégicas» son las de la
  EPVSA. La propuesta es «Módulo del catálogo RELAS».
- Si se incorpora al Plan de Acción una referencia plegable con las 4 líneas y
  los 10 objetivos oficiales de la EPVSA, indicando a cuáles se ancla cada
  módulo.
- Si se sustituyen las denominaciones no oficiales de
  `StrategicFrameworkRegistry.ts` y `EPVSATranslator.ts` por las de la fuente.
  No son visibles hoy, pero son la base de un traductor que podría volver a
  montarse.

### Hipótesis

- La descarga incompleta de Estadística territorial puede deberse a la
  latencia de las consultas del IECA (la 21 de 24 es una consulta BADEA) más
  que a la interfaz. Para confirmarlo, conviene repetir la descarga con un
  tiempo de espera mayor o consultar el registro de red del panel.

### Pendiente, por orden

1. **Auditoría con expedientes reales**, con la cuenta lectora descrita más
   abajo. Comparar Inicio, Diagnóstico y Perfil en escritorio y en móvil,
   cerrados y abiertos.
2. **Recorridos de punta a punta:**
   - Diagnóstico → Estadística → descargas guardadas → detalle → preparación de
     una revisión del Perfil.
   - Diagnóstico → Gestor documental → catálogo y búsqueda → ficha → original,
     procedencia y revisiones.
   - Perfil → documento completo → originales → versiones y validación.
   - Plan de Acción → líneas y objetivos → indicadores y procedencia.
3. **Lectura directa de Firestore** para verificar las afirmaciones previas:
   descargas guardadas, revisión activa de cada Perfil, originales y huellas
   SHA-256. Solo lectura.
4. **Plan de Acción y «Otras herramientas»** de Diagnóstico: llevarlos a la
   composición de Inicio, con una sola cabecera y bloques plegados por módulo.
5. **EPVSA**, según las decisiones pendientes.
6. **PRs abiertas por revisar:**
   - #169: procedencia y versiones del archivo. Su descripción pide no
     fusionarla sin verificar.
   - #161: cotejo bajo demanda contra Firebase.
7. **Menores:**
   - retirar `tmp-noop.txt`, que se declara a sí mismo residuo;
   - los 15 fallos previos de la suite completa;
   - actualizar las fechas de `README.md` y `ROADMAP.md`, que siguen en
     septiembre.

### Acceso y entorno

- El entorno de sesión en la nube «compas-ng-renovado» es personal y está
  asociado a este repositorio. Su red admite:
  - GitHub Pages: `bhermoso.github.io`;
  - Firebase: `firestore.googleapis.com`, `identitytoolkit.googleapis.com`,
    `securetoken.googleapis.com` y `oauth2.googleapis.com`;
  - INE: `servicios.ine.es` y `www.ine.es`;
  - IECA: `www.ieca.junta-andalucia.es` y `www.juntadeandalucia.es`.
- Credenciales previstas, que introduce el responsable en la configuración del
  entorno y no se registran aquí:
  - `COMPAS_AUDIT_EMAIL` y `COMPAS_AUDIT_PASSWORD`: cuenta de COMPÁS con rol
    `reader` en los ámbitos que se auditen.
  - `COMPAS_FIREBASE_SA_JSON`: cuenta de servicio del proyecto `compas-98dd7`
    con el rol *Cloud Datastore Viewer*, de solo lectura.
- Cualquier modificación de datos en Firestore exige antes:
  - identificar el problema y la revisión activa;
  - preparar el cotejo y una copia recuperable;
  - conservar la distinción entre documentos originales y reconstrucciones.
