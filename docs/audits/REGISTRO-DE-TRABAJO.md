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

## 2026-11-24 (noche) · Priorización de Atarfe: bloqueo falso y aviso de evidencia

Pages servía `ec75204` al empezar; sirve el mismo hasta fusionar esta rama.

**Hechos observados** (expediente real de Atarfe en Firestore `compas-98dd7`,
leído en el navegador). La revisión 0.10.0 es vigente y está validada (Blas
Hermoso, 24/11/2026, 18:43 UTC), con C6, C7 y C11 descartadas y R1 a R8
elegidas. En Plan de Acción → «Participación y prioridades», la selección del
Grupo Motor recibe exactamente R1 a R8. En la pestaña Priorización,
«Candidaturas técnicas» mostraba «Base documental insuficiente»: el bloqueo
dependía del motor antiguo de interpretación (26 evidencias, pero su única
oportunidad era «ampliar la base»), no del Perfil vigente, contra I-LHPM-23.
El Perfil conservaba la versión de evidencia del 10/11, y la recarga de
Localiza Salud del 24/11 la cambió antes de validar, así que el panel habría
avisado de un Perfil desactualizado.

**Cambios.** El bloqueo solo se aplica cuando no hay Perfil externo vigente.
Un Perfil validado después del último cambio de evidencia no se considera
desactualizado (`externalProfileIsStale`), y al validar una revisión queda
ligada a la evidencia de ese momento. Suite: 2984 pruebas; lint sin avisos.

**Contexto institucional** (Aula de Salud Comunitaria, leída el 24/11). El Grupo
Motor se constituye en el taller de impulso, antes del Perfil; la sesión del
Grupo Motor prioriza y elige líneas, objetivos e indicadores en una misma
reunión. La de Atarfe es el 26/11/2026. COMPÁS no registra el taller de impulso
ni la constitución del Grupo Motor: pendiente para la hoja de ruta, a decidir
por el responsable.

---

## 2026-11-24 (tarde) · Elección explícita, archivo, trazabilidad Perfil–Plan y Actualizador

Master de partida: `0bccef5`.

- **#231 (fusionada).** Junto al Perfil vigente se muestran las propuestas pendientes de
  elegir. Solo las conclusiones y recomendaciones elegidas expresamente alimentan la
  planificación (`chosenProposals`); antes bastaba con no estar descartadas.
- **#232 (fusionada).** El Archivo permite eliminar una versión intermedia y reenlaza las
  sucesoras, abre la carga de Localiza Salud, gestiona revisiones del Perfil y retira
  copias derivadas. La estadística territorial deja de borrarse desde el Archivo
  (CONTRACT-TERRITORIAL-STATISTICS 1.3.1).
- **#233 (fusionada).** El Plan resultante vincula recomendación elegida, prioridad
  adoptada, objetivo, indicador y línea de base tomada de la revisión vigente.
- **Actualizador (rama `fix/actualizador-claridad`).** El error de lectura del paquete ya
  no queda oculto tras «Elige el archivo del paquete de texto»; el cargador se ve siempre
  y, al cargar un paquete, marca el texto y los campos derivados; se avisa si también
  están marcados cambios de datos; tras crear las revisiones se recuerda que no son las
  vigentes. Suite: 2979 pruebas, 2 omitidas. Lint sin avisos.
- **Hoja de ruta acordada el 24/11/2026.** Se avanza fase a fase; cada fase se cierra
  cuando el responsable certifica que está superada.
  1. Fusionar la PR del Actualizador (`fix/actualizador-claridad`).
  2. Elegir las propuestas y validar los cuatro Perfiles (acto del responsable técnico;
     COMPÁS no lo hace en su nombre).
  3. Limpieza en GitHub: cerrar la PR #222 (obsoleta) y borrar las ramas fusionadas.
  4. Cargador de Localiza Salud con CSV o XLSX, versiones y comparación de fichas, sin
     borrar el listado anterior.
  5. Retirar o aislar el generador antiguo de Perfiles de COMPÁS (`PSLCArtifactViewer`,
     respaldo de `compileInitialLocalHealthPlan`, `psl-c-export`), conservando la consulta
     de los Perfiles antiguos como documentos históricos.
  6. Implementar `CONTRACT-EVALUATION.md` (v1.0): indicadores con línea de base del Perfil,
     seguimiento y informe de evaluación.
  7. Erratas y deudas menores: «9290» en Atarfe, referencias sin citar de Loja, orden de
     referencias y anexos de Alfacar, borrado y movimiento de párrafos en el Actualizador,
     portada del PDF del Perfil, comparador del paro de larga duración en Zagra, registro de
     marcos sin PESMA-A, línea de Bienestar emocional 0.2 «en construcción», copias
     municipales de marcos en el archivo de Alfacar, paquetes de texto guardados con su
     revisión.
  8. Plataforma: agendas anuales e implantación; estudios complementarios lanzados desde
     las recomendaciones «Conocer»; ámbitos supramunicipales (mancomunidades y distritos
     municipales); roles y circuitos institucionales con auditoría; publicación del Perfil y
     del Plan validados; ayuda en contexto por fase.
- **Estado de los expedientes (hechos).** Vigentes: Zagra 0.6.0, Alfacar 0.10.0, Atarfe
  0.10.0, Loja 0.7.0. Ninguna validada; ninguna propuesta elegida, de modo que la
  planificación no recibe todavía conclusiones ni recomendaciones de ningún Perfil.

---

## 2026-11-24 · Revisiones de los cuatro Perfiles y archivo ordenado por fecha

Master: `1e32c20`.

- **Revisiones creadas con el Actualizador (hecho, confirmado por Firebase).**
  Zagra 0.5.0, Alfacar 0.10.0, Atarfe 0.9.0 y Loja 0.7.0, con paquetes de texto
  conformes a la v3.0.1. Todas en revisión y con el menú de elección sin
  resolver. Los paquetes se aplicaron desde el navegador; no están en el
  repositorio.
- **Pendiente en Zagra (decisión del responsable).** La 0.5.0 fecha en 2025 el
  23,5 % de 65 o más años de la lectura de conjunto, pero la cifra está enlazada
  al Atlas de renta de 2024 (`adrh-pob-65`, también 23,5). Hay preparada una
  revisión que restituye «en 2024»; no se ha creado.
- **Pendiente en Atarfe.** La cita [13] (validación de 17 recursos de Localiza,
  5/11/2026) no tiene documento en el expediente; la referencia lo dice así. El
  documento «Activos Localiza Salud Atarfe» (19/10/2026) tiene 16 filas y 15
  registros; el listado actual de Localiza tiene 20.
- **Archivo del expediente (rama `feat/archivo-por-fecha`).** Los documentos de
  cada sección se ordenan del más reciente al más antiguo y muestran su fecha:
  la declarada o, si no la hay, la que figura en el título, rotulada «según el
  título». Ningún documento de los cuatro expedientes tenía fecha declarada; el
  archivo permite declararla. Suite: 2975 pruebas, 2 omitidas. Lint sin avisos.

## 2026-11-24 · Lectura completa de los cuatro Perfiles vigentes

Master: `6aa5160`.

- **Encargo del responsable.** Paso 2 de la secuencia: leer completos y cotejar
  los Perfiles vigentes de Alfacar, Atarfe, Loja y Zagra.
- **Fuente.** Documento completo de cada revisión vigente en la web publicada,
  con la sesión del responsable (Firebase `compas-98dd7`). Sin cotejo con los
  PDF: las revisiones vigentes no tienen PDF propio.
- **Resultado.** `docs/audits/COTEJO-PERFILES-2026-11-24.md`: lo que cumplen, lo
  que falta frente a la v3.0.1 en los cuatro, lo propio de cada uno, tres
  decisiones del responsable y lo que debe resolver cada paquete de texto.
- **Correcciones de COMPÁS halladas en la lectura.**
  - El lector repetía el cuerpo de R1 como introducción del apartado de
    recomendaciones. Corregido en `ProfileReader`.
  - El Actualizador no reconocía «Anexos» ni «A. …» como fin del apartado 7 y
    dejaba su nota detrás de los anexos (Atarfe, Loja, Zagra). Corregido en
    `appendAuthorship`; las notas ya escritas se recolocan con el paquete.
- **Decisiones del responsable (24/11).** Zagra trabaja con el Informe de 2017
  hasta nueva orden; las notas del Actualizador salen del texto y pasan al
  historial de la revisión (`revisionLog`, contrato del Actualizador 1.3.0, con la
  nota antigua trasladada en la siguiente revisión); en Alfacar existe la
  priorización del Grupo Motor de 1/10/2026 y debe constar en el punto de partida.
  Detalle en el §6 del informe.
- **Verificación.** Lint: 0. Suite: 2967 pasan, 2 omitidas.

## 2026-11-24 · Menú de elección del equipo técnico

Master: `91006d2`.

- **Encargo del responsable.** Secuencia aceptada: (1) menú de elección,
  (2) lectura completa y cotejo de los cuatro Perfiles, (3) paquetes de texto
  conformes a la v3.0.1 aplicados con el Actualizador, (4) elección y validación.
  Esta entrada cubre el paso 1.
- **Hecho de partida.** El §7.4 del contrato de custodia impide validar una
  revisión con propuestas sin resolver, y el menú no existía: ningún Perfil podía
  validarse conforme a la doctrina.
- **Cambio.**
  - Modelo: `choices` en cada revisión (propuesta, decisión, cuenta, fecha y,
    en el descarte, motivo opcional). La biblioteca rechaza elecciones mal
    formadas o repetidas.
  - `profileChoices.ts`: propuestas de la revisión (C y R del texto; si el texto
    no las estructura, las identificadas del paquete), registro de decisiones,
    pendientes y descartadas.
  - Pestaña «Elección del equipo técnico», con recuento de resueltas. Las
    decisiones se preparan y se guardan juntas en Firebase; se cierran al validar
    o archivar.
  - La validación queda bloqueada mientras haya propuestas pendientes y lo dice.
  - Lo descartado se rotula, sin suprimir texto, en el Perfil, en la lectura del
    documento, en la impresión y en la exportación a Word.
  - Una revisión nueva (carga, edición o Actualizador) no hereda elecciones; un
    archivo cargado no puede traerlas.
  - La planificación (`selectExternalProfile`) no recibe las conclusiones ni las
    recomendaciones descartadas.
  - Contrato de custodia 1.1: §7.6 y nota de implementación; el menú sale de
    pendientes.
- **Decisión pendiente del responsable.** El §8.4 dice que la vigente alimenta
  los pasos posteriores «con sus propuestas elegidas». Hoy pasan las elegidas y
  las aún sin resolver; solo se excluyen las descartadas. Excluir también las
  pendientes dejaría sin candidaturas técnicas a los cuatro Perfiles vigentes
  mientras no se elija, en tensión con el §8.3 (criterio de calidad, no candado).
- **Verificación.** Lint: 0. Compilación correcta. Suite: 2965 pasan, 2
  omitidas (12 pruebas nuevas). Pantalla recorrida en Chrome sin interfaz con
  una página de prueba temporal y un Perfil ficticio: elegir, descartar con
  motivo, guardar, validación bloqueada con su aviso y rótulo en el Perfil.
  Sin expedientes reales ni Firebase.

## 2026-11-23 · Avisos de Localiza y del Actualizador; referencias a contratos retirados

Master: `58e7781` (tras la PR #225).

- **Encargo del responsable.** Corregir los hallazgos de la revisión de las PR
  del día y poner al día las referencias a contratos retirados.
- **Hechos observados y cambios.**
  - Al cargar un Localiza nuevo, el aviso solo contaba los listados no
    archivados, pero se eliminaban también los archivados que no son de ciclo
    histórico. El aviso usa ahora la misma regla que la eliminación
    (`currentPredecessors`). Prueba nueva en `tests/current-sources.test.ts`.
  - El Actualizador de perfiles no marcaba su guardado como operación en curso,
    así que el autoguardado podía lanzar detrás una copia anterior que Firebase
    rechaza con un aviso de error. Ahora la marca mientras aplica.
  - 28 citas de contratos del Perfil pasados a histórico en 17 contratos
    vigentes. Las que remiten a contenido integrado apuntan a su destino
    (`CONTRACT-PROFILE-PRODUCTION-AND-CUSTODY`, guía de escritura); las demás se
    marcan como históricas con remisión a `CONTRACT-LOCAL-HEALTH-PROFILE-METHODOLOGY`.
    Cuatro comentarios de código con rutas que ya no existían, corregidos.
- **Sin tocar.** El ejemplo de manifiesto de `CONTRACT-LOCAL-HEALTH-PLAN-COMPILER`
  §11 y su comentario en `CompilationManifest.ts` siguen nombrando los contratos
  antiguos: es la especificación de una salida, no una remisión.
- **Decisión pendiente del responsable.**
  - `CONTRACT-LOCAL-HEALTH-PLAN-COMPILER` y `CONTRACT-LOCAL-HEALTH-PLAN-DOCUMENT`
    exigen un PSL aprobado y un PSL-C (gates G-PLS-1 y G-PLS-2), objetos de la
    doctrina retirada. Marcar la cita no resuelve esa dependencia: hay que decidir
    de qué Perfil parte el Plan Local de Salud con la v3.0.0.
  - Retirada del generador interno del Perfil (unas 4.650 líneas en
    `src/application/health-profile/`). No se ha hecho. Hecho observado
    (24/11/2026, rastreo de importaciones símbolo a símbolo desde `index.html`):
    la aplicación sí lo alcanza, por tres caminos. (1) `ExternalProfileDashboard`
    muestra con `PSLCArtifactViewer` los «Perfiles anteriores de COMPÁS · legado
    conservado». (2) `compileInitialLocalHealthPlan` usa el Perfil generado si no
    hay Perfil externo, y toma las temáticas priorizadas del objeto PSL antiguo.
    (3) El modelo de documento y la exportación DOCX y PDF de `psl-c-export`
    sirven también al Perfil externo vigente. Retirarlo exige decidir antes qué
    pasa con el legado y de qué Perfil parte el Plan.
- **Alcance (v3.0.1, 24/11/2026).** Decisión del responsable: «el perfil se
  genera fuera, pero se actualiza dentro». El Alcance del contrato metodológico
  nombra el Actualizador de perfiles como única excepción regulada a la regla de
  que COMPÁS no reescribe el Perfil.
- **Verificación.** Lint: 0. Compilación correcta. Suite: 2953 pasan, 2 omitidas (una prueba nueva).

## 2026-11-23 · Retirada de archivos sin uso

Master: `c04625b`.

- **Encargo del responsable.** «borra lo innecesario».
- **Método.** Se recorren las importaciones desde las páginas de entrada
  (`index.html`, `verificar-perfiles.html`), las pruebas, los scripts y las
  configuraciones. Cada archivo de `src/` que no alcanza ninguna se busca por
  nombre en todo el repositorio antes de retirarlo.
- **Retirados (6).**
  - `src/config/samWeights.js`: coeficientes de ponderación sin procedencia
    acreditada y sin uso (ver `docs/methodology/IBSE-ATARFE-PONDERACION-2026-10-23.md`).
  - `src/domain/methodology/adapters/EASSavAdapter.ts` y
    `EASHouseholdDomainModel.ts`: andamiaje de septiembre que devolvía textos fijos.
  - `src/domain/agenda/index.ts` y `src/domain/statements/index.ts`: índices de
    reexportación que nadie importa; los módulos se importan directamente.
  - `tests/fixtures/external-profile.tsx`: página de comprobación que ninguna
    página carga.
- **Se conservan.** `src/contracts/workspace/` e
  `InMemoryWorkspacePersistence` tampoco se usan, pero los describe el §9 de
  `CONTRACT-PERSISTENCE.md`: retirarlos exige revisar ese contrato y queda como
  decisión del responsable. `src/types/mammoth.d.ts` declara tipos y lo usa el
  compilador.
- **Dependencias.** Todas las de `package.json` están en uso.
- **Ramas.** Las ramas fusionadas `archivo/expediente`, `docs/readme-lint` y
  `fix/lint-a-cero` no se han podido borrar desde la sesión (el proxy de GitHub
  rechaza la escritura de referencias); quedan para borrar a mano.
- **Verificación.** Lint: 0. Compilación correcta. Suite: 2952 pasan, 2 omitidas.

## 2026-11-23 · Lint sin errores ni avisos

Pages al empezar: no verificado (`version.json` no responde desde la sesión). Master: `f4c93a5`.

- **Encargo del responsable.** Dejar el lint a cero en una rama con su PR.
- **Hechos observados.** `npm run lint` daba 24 problemas (21 errores y 3 avisos);
  el README decía 23 y CLAUDE.md, 21.
- **Cambios sin efecto en el comportamiento.**
  - Importaciones y variables sin uso retiradas en cinco pruebas; `const` en el
    reparto de Hamilton de SAM; tipo explícito en lugar de `any` en la prueba del
    PLIZD de Fuente Vaqueros.
  - `eslint.config.js`: `no-unused-vars` admite argumentos con prefijo `_` y la
    desestructuración con resto, convenciones que el código ya usaba.
  - `classifyPersistenceMessage` y `persistenceSummary` pasan a
    `workspacePersistenceSignals.ts`; `ASSET_CRITERIA` deja de exportarse (no lo
    usaba ningún otro archivo).
  - El error del guardado del Perfil conserva la causa original (`cause`); el
    mensaje no cambia.
- **Desactivaciones justificadas (10).** Los avisos de hooks de React en `App.tsx`,
  `ExternalProfileDashboard.tsx` y `DocumentAccess.tsx` no se corrigen añadiendo
  dependencias: con `workspace` entero se releerían Firebase e IndexedDB en cada
  edición. Cada desactivación lleva su motivo en la línea anterior, como ya hacía
  `DocumentAccess.tsx`. `tests/fixtures/external-profile.tsx` es una página de
  comprobación manual que no exporta nada; ningún HTML del repositorio la carga
  (inferencia: está sin uso).
- **Verificación.** Lint: 0 problemas. Compilación correcta. Suite: 2952 pasan,
  2 omitidas. Datos: solo la suite; sin expedientes reales.
- **Pendiente.** La rama `docs/readme-lint` queda superada por esta PR.
  Reescribir esos efectos sin desactivaciones exige un cambio de diseño de la
  recuperación desde Firebase; no se ha hecho.

## 2026-11-23 · Archivo del expediente

Pages al empezar: `acf6cb9`.

- **Hechos observados en Firestore (`compas-98dd7`).** De 87 documentos en los siete
  expedientes, 6 tienen el original guardado. Localiza Salud se carga pegando el texto
  y nunca tiene archivo. Las descargas de estadística territorial se acumulaban sin
  poder borrarse (Alfacar 4, Loja 3, Atarfe 2, Zagra 2, Churriana, Fuente Vaqueros
  y Láchar 1).
- **Hechos observados en el código.** Las acciones sobre un documento (descargar,
  adjuntar, nueva versión, archivar, eliminar) estaban dentro de la ficha, en un
  apartado plegado; la carga, en «Otras herramientas del diagnóstico».
- **Relación con el Perfil (código).** El Perfil es un registro aparte con sus propios
  archivos y no enlaza con documentos del expediente. Eliminar o sustituir un
  documento con evidencias cambia la fecha de las evidencias y marca un Perfil
  validado como «Validación desactualizada»; su texto no cambia. Adjuntar un archivo
  a una ficha no toca las evidencias. El actualizador del Perfil usa solo la descarga
  estadística más reciente.
- **Decisión del responsable.** «prepárala»: una sola pantalla con todo lo cargado y
  copia única para la estadística territorial.
- **Cambios.** «Archivo del expediente» sustituye al «Gestor documental»: documentos
  por función, con Ver, Descargar, Abrir fuente, Adjuntar archivo, Nueva versión,
  Eliminar o Archivar en cada fila; descargas estadísticas con Descargar CSV y
  Eliminar; Perfiles con sus archivos. La carga universal se abre desde la propia
  pantalla. El aviso de eliminar y de nueva versión dice cuántas evidencias se
  retiran y si un Perfil validado quedará marcado. Adjuntar admite PDF, DOCX, CSV,
  hojas de cálculo, texto, JSON y ZIP. CONTRACT-TERRITORIAL-STATISTICS 1.3.0 (§9,
  I-TS-9). Portadas de sección: los logos pasan a una segunda fila antes de
  montarse sobre el título (comprobado en la web publicada con la regla inyectada:
  a 1000 × 1100 los logos invadían «Diagnóstico territorial»; con la regla, sin
  solape a 1000, 1536 y 1920 px de ancho, en Diagnóstico y Perfil).
- **Pendiente.** Adjuntar los archivos de los 81 documentos sin original (el
  responsable tiene la documentación). Límite: 40 MB por expediente, sumando los
  archivos del Perfil; Loja puede no caber entera.

## 2026-11-23 · Reforma de los contratos del Perfil y contrato de evaluación

Pages al empezar: `e410372`.

- **Decisiones del responsable (2026-11-23).** Reforma «tal cual»: cuatro
  documentos en lugar de doce, conclusiones en prosa con trazabilidad en el
  anexo y clasificación única por los tipos del Art. 8 y los grados del
  Art. 8 bis. El menú de conclusiones y recomendaciones lo ofrece COMPÁS sobre
  el Perfil cargado. Localiza Salud, fuente exclusiva. Evaluación: cinco
  estados, un dato de implantación por objetivo, impacto solo en la final,
  recomendaciones como menú.
- **Cambio.**
  - Contrato metodológico 3.0.0: alcance «lo redacte quien lo redacte»;
    papeles (quien redacta propone, el equipo técnico elige, COMPÁS conserva,
    muestra y comprueba); Art. 16 y 16 ter reescritos; fuera los artículos del
    generador (Art. 8 ter regla 3, disposición transitoria del 16 quater);
    regla nueva del Perfil vigente (I-LHPM-23) y clasificación única
    (I-LHPM-24); seis páginas en I-LHPM-10; H-LHPM-1 y H-LHPM-6 cerradas; ESA
    2030 y PESMAA en los marcos; sin «NG»; registro ordenado.
  - Nuevo `CONTRACT-PROFILE-PRODUCTION-AND-CUSTODY` 1.0, vigente: integra el
    contrato externo, la guía de entrega, EXTERNAL-PROFILE y el criterio
    «Perfil validado».
  - Nueva `docs/guides/GUIA-ESCRITURA-PERFIL.md`: §0 del contrato de escritura,
    sin los campos fijos del antiguo §0.4, y bibliografía del marco
    científico. Siete referencias se completaron sin cotejo con el original y
    así se declara.
  - Diez documentos a `docs/historico/contratos-perfil/`. Índice, matriz de
    fuentes (Localiza exclusiva, v1.3) y `CLAUDE.md` al día.
  - Nuevo `CONTRACT-EVALUATION` 1.0, doctrina vigente.
- **Comprobación estructural de los cuatro Perfiles vigentes** contra la
  v3.0.0, leída de Firestore: [PSL-V3-CONFORMIDAD-2026-11-23](PSL-V3-CONFORMIDAD-2026-11-23.md).
  Cumplen estructura, páginas, lectura de conjunto y frontera con las agendas;
  no declaran el grado de sustento de las recomendaciones «Abordar», no
  tienen tabla de trazabilidad y rotulan distinto tres apartados. No es una
  lectura completa.
- **Pendiente.** Implementar el menú de elección sobre el Perfil cargado y la
  evaluación; lectura completa y cotejo de los cuatro Perfiles.
- **Verificación.** Suite, ya con las PR #219 y #220: 2948 pasan, 2 omitidas.

## 2026-11-23 · Guardados en Firebase en serie (PR #219)

- **Hecho observado.** Al limpiar Atarfe, el guardado de la limpieza chocó con
  el autoguardado que sigue a la recuperación del expediente: los dos partían
  de la misma revisión.
- **Cambio.** Los guardados remotos van en cola (`serialQueue.ts`); cada uno
  lee la revisión que confirmó el anterior. Prueba nueva:
  `tests/serial-queue.test.ts`.

## 2026-11-23 · Retirada de los seeds públicos

Pages al empezar: `e410372`.

- **Decisión del responsable (2026-11-23):** retirar las semillas públicas.
  Motivo: los expedientes de Firebase contienen hoy textos completos, imágenes
  incrustadas y algún dato de contacto personal, y GitHub Pages los publicaría
  en abierto. Firebase queda como única fuente.
- **Cambio.**
  - `public/seeds/` pasa a `fixtures/seeds/` (fuera del despliegue), solo como
    fixtures de prueba. Se retiran las copias incluidas en el código de Loja y
    Fuente Vaqueros.
  - Se retira el mecanismo de hidratación y migración desde seeds
    (`src/infrastructure/seeds`, `pendingSeedId`, `pendingMigration` y las
    funciones de migración de `appWorkspaceHydration.ts`). La carga queda así:
    copia local del navegador o placeholder vacío, y después Firebase.
  - Se retira la «consulta de recuperación» del IBSE de Atarfe, que leía el seed.
  - Pruebas: se retiran las del mecanismo y la prueba de humo de hidratación de
    Fuente Vaqueros (también del flujo `plan-document.yml`); una prueba nueva
    cubre la carga local. Las pruebas de humo que leían seeds leen las fixtures.
- **Verificación.** Suite: 2947 pasan, 2 omitidas; build correcto, sin
  `seeds/` en `dist`; lint baja a 21 errores y 3 avisos.
- **Inferencia.** Un navegador sin copia local y sin sesión abre el expediente
  vacío; con sesión, lo recupera de Firebase. No verificado en el navegador.

## 2026-11-23 · Granada-Zaidín eliminado de Firebase; reglas desplegadas comprobadas

Pages: `5765e6a`.

- **Decisión del responsable (2026-11-23):** «Granada-Zaidín lo vamos a
  eliminar completamente».
- **Hecho.** En Firestore se han eliminado el expediente (manifiesto y
  fragmentos), el registro del ámbito `relas_scopes/granada-zaidin` con sus
  colecciones anidadas (`reviews`, `workspace_versions`), la pertenencia y la
  cuenta de acceso de coordinación asociadas solo a ese ámbito. Queda la
  lápida `compas_deleted_scopes/granada-zaidin`, que impide que un navegador
  con una copia local lo vuelva a subir. La copia previa del expediente está en
  `compas-copia-firebase-20261123` (panel de navegador de la aplicación de
  escritorio). Comprobado después: el ámbito responde 404 y no figura en
  `relas_scopes`.
- **Reglas de Firestore.** Las desplegadas (versión del 20/11/2026) coinciden
  línea a línea con `firebase/firestore.rules`.
- **Decisión del responsable (2026-11-23):** la plantilla del Plan de Acción
  «no es solo del Zaidín, aunque se creara originalmente para ella, hay que
  conservar como estructural, para todos los expedientes».
- **Cambio en el código.**
  - `ZAIDIN_AGING_PROPOSAL` pasa a `AGING_FOUR_BLOCKS_BASE`, «Plantilla
    estructural de envejecimiento saludable en cuatro bloques», redactada para
    «el territorio». La plantilla común y la de Zagra salen de ella con los
    mismos textos que antes (comprobado campo a campo); solo cambian sus
    rótulos de procedencia. Los catálogos de envejecimiento y adicciones se
    rotulan «Catálogo estructural de COMPÁS».
  - Se retiran el comportamiento exclusivo de la redacción final del Zaidín en
    la preparación del Plan, la lectura de unidades geográficas del Zaidín en
    los informes, el contexto BADEA del distrito y las menciones en
    comentarios, scripts, fixtures y pruebas.
  - Las copias del navegador ya no incluyen el expediente de Granada-Zaidín ni
    el borrador de la antigua demostración de coordinación; si llegan en una
    copia anterior, se ignoran.
  - Se conservan como guarda `RETIRED_MUNICIPALITY_IDS` y su prueba, y el texto
    literal del Perfil de Loja que menciona el Centro de Salud Zaidín-Sur.
  - El flujo `plan-document.yml` citaba una prueba inexistente
    (`zaidin-final-replacement.test.ts`); se quita de la lista.
- **Verificación.** Suite: 2978 pasan, 2 omitidas; build correcto; lint sin
  cambios. La prueba de humo de recuperación del navegador
  (`browser-recovery.smoke.mjs`) se ha ajustado y no se ha ejecutado aquí.

## 2026-11-23 · Limpieza de los expedientes de Firebase: una versión vigente por fuente

Pages al empezar y al terminar: `2b0fb2a`.

- **Autorización del responsable (2026-11-23):** «fusiona y limpia».
- **Copia previa.** Los ocho expedientes, tal como estaban en Firestore, se
  guardaron en el perfil del panel de navegador de la aplicación de escritorio
  (IndexedDB `compas-copia-firebase-20261123`, comprobada por longitud) y se
  descargaron como `compas-firebase-copia-20261123-antes-limpieza.json`. La
  descarga no se ha podido comprobar en disco.
- **Aplicado con «Dejar solo la última versión»**, en la aplicación publicada:
  - Atarfe: se eliminan el diccionario IBSE y la copia anterior de las
    respuestas 0–100, y los dos historiales de sustitución. Quedan un informe,
    un Localiza Salud y un IBSE (el original vinculado, 21 evidencias).
  - Alfacar: se elimina el informe del 5/10 y la copia anterior del informe.
    Quedan un informe, un Localiza Salud y una priorización.
  - Loja: se eliminan el Localiza Salud del 18/10 y la primera «Serie
    comparada entre ciclos»; las evidencias pasan de 61 a 33 al desaparecer las
    28 repetidas. Quedan un informe, un Localiza Salud y una serie.
- **Comprobación posterior en Firestore:** los tres expedientes superan la
  integridad y tienen una sola versión vigente de cada fuente; el informe
  vinculado existe en los tres.
- **No aplicado.** Granada-Zaidín está retirado de la aplicación
  (`RETIRED_MUNICIPALITY_IDS`) y no puede abrirse para limpiarlo; en Firestore
  conserva la conversión Word del informe junto al PDF vinculado y una copia
  «anterior». Pendiente de decisión: conservarlo como archivo o eliminarlo.
- **Fallo observado.** El primer intento en Atarfe acabó en «Firebase contiene
  una revisión diferente»: el autoguardado posterior a la recuperación del
  expediente estaba en curso cuando se lanzó el guardado de la limpieza, y el
  segundo guardado partía de la revisión anterior. No se perdió nada (Firebase
  conservaba el expediente íntegro). Se repitió tras recargar y esperar a que
  terminara el autoguardado. Pendiente: serializar los guardados remotos.

## 2026-11-23 · Lectura de Firestore y casos que la regla de fuente vigente no cubría

Pages al empezar: `312b627`.

- **Acceso.** Lectura de `relas_scopes/*/workspace/current` y de sus fragmentos
  desde el panel de navegador de la aplicación de escritorio, con la sesión de
  COMPÁS del responsable. La red de la sesión en la nube sigue sin llegar a
  Firestore. Solo lectura; los ocho expedientes superan la comprobación de
  integridad (número de fragmentos y longitud).
- **Hechos observados en Firestore (expediente real).**
  - Alfacar: dos «INFORME SALUD ALFACAR 2026». El de 5/10 tiene tipo `other`
    con la etiqueta `health-report` y la regla no lo reconocía como informe.
    Una copia «anterior» del informe remite a un documento que ya no existe.
  - Atarfe: tres exports IBSE; dos marcados `ibse-history` (el diccionario y
    una copia previa de las respuestas 0–100) y dos entradas de historial.
  - Granada-Zaidín: la «Conversión histórica del informe — Word estilo Atarfe»
    (tipo `other`, sin ciclo declarado) convive con el PDF original de abril
    de 2023, que es el informe vinculado.
  - Loja: dos «Series comparadas entre ciclos. Loja, 2003-2026», la segunda
    «versión corregida», cada una con 28 evidencias: la serie entra dos veces
    en el diagnóstico. Dos Localiza Salud (18/10 y 6/11) y 162 evidencias de
    activos archivadas.
  - Churriana, Fuente Vaqueros, Láchar y Zagra: una sola versión vigente de
    cada fuente; los documentos antiguos de Fuente Vaqueros y Zagra (PSL 2018)
    están declarados de ciclo histórico.
- **Cambio.** La fuente «Informe de salud» incluye los documentos con la
  etiqueta `health-report` aunque su tipo sea otro; nueva fuente «Series
  comparadas entre ciclos»; las copias «anteriores» del informe que no remiten
  a un documento histórico se eliminan.
- **No verificado.** Las reglas de Firestore desplegadas: el token de la sesión
  de COMPÁS no permite leerlas.

## 2026-11-23 · Una sola versión vigente de cada fuente del proceso actual

Pages al empezar: `0965d88`.

- **Decisión del responsable (2026-11-23).** «Solo debe haber un ejemplar de
  cada cosa, el último»: un informe de salud, un estudio complementario (en
  Atarfe, el IBSE de respuestas normalizadas), una priorización, un Localiza
  Salud. Lo histórico de otro ciclo, distinto, se conserva.
- **Cambio.**
  - `currentSources.ts`: identifica cada fuente canónica, elimina los
    ejemplares anteriores del proceso actual con sus originales, derivados,
    evidencias, validaciones de activos, conciliaciones e historiales, y
    respeta los documentos declarados de ciclo histórico.
  - Informe de Salud, estudios complementarios (también IBSE), Localiza Salud y
    priorización temática sustituyen y eliminan al cargar. Se retira el
    archivado y los historiales de sustitución que se añadieron en la #213 y
    los que ya existían para el IBSE y los informes.
  - Panel «Versiones vigentes de las fuentes» al pie de cada página: muestra
    qué se conserva y qué se eliminaría en el expediente abierto, y lo aplica
    con confirmación. Solo se activa con el expediente recuperado de Firebase.
  - `CONTRACT-REPOSITORY` §4 y «Sustituir» reescritos con la regla.
- **Comprobado (hechos).** Suite completa: 2977 pruebas correctas, 2 omitidas
  (3 nuevas para la regla; 2 de la #213 reescritas). Compilación correcta. Lint
  sin cambios.
- **No comprobado.** La depuración sobre los expedientes reales de Firestore:
  la aplica el responsable desde el panel, expediente por expediente, después de
  descargar una copia.

---

## 2026-11-23 · Integridad de la custodia documental y del Actualizador del Perfil (PR #209 consolidada)

Pages al empezar: `b8b3149`.

- **Decisión del responsable (2026-11-23).** Consolidar en esta sesión el trabajo
  de la PR #209, preparado con Codex en otro equipo, y no continuarlo allí.
- **Cambio (procedente de la #209, commits `24a5439` y `99d22b9`).**
  - Guardado en Firebase con control de revisión: antes de escribir se
    comprueba que el manifiesto remoto es el que se leyó (`snapshotId`); si
    otro equipo lo cambió, no se guarda y se pide conciliar.
  - Historial de estudios complementarios e informes anteriores: al sustituir
    uno, el anterior se conserva con sus documentos y evidencias.
  - La normalización de documentos repetidos ya no elimina revisiones
    encadenadas ni el informe vinculado.
  - Localiza: una ficha idéntica en dos cargas conserva ambas procedencias.
  - Actualizador del Perfil: marcas de revisión sustituibles por su causa,
    sin cruces de escala y con el último valor publicado ante secreto
    estadístico.
- **Integración.** Se incorporan los cambios de master del 23/11 sin
  conflictos.
- **Comprobado (hechos).** Compilación correcta. Suite completa: 2973 pruebas
  correctas, 2 omitidas. Lint: 23 errores y 3 avisos (sin cambios).
- **No comprobado.** Comportamiento con expedientes reales de Firestore y con
  dos equipos guardando a la vez.
- **Cierre.** La PR #209 se cierra como sustituida por esta. Las PR #169 y #161
  se cierran por desfase con master; la comparación del archivo con Firebase
  (#161) se retomará en la auditoría de Firestore.

---

## 2026-11-23 · IBSE de Atarfe en escala 0–100, referencias EAS y evaluación

Pages al empezar: `c0cb1d8`.

- **Decisión del responsable (2026-11-23).** Los microdatos se quedan en el
  repositorio. El fichero IBSE válido es el normalizado sobre 100; pide
  comprobarlo. Pide reconectar la evaluación y las referencias EAS.
- **IBSE, hechos observados.** `fixtures/ibse-atarfe.csv` (desde `887d459`,
  09/11/2026) tiene 910 registros con edad y sexo; 898 completos y 811 con
  los ocho ítems válidos. Recalculado desde los ítems con la escala común
  0–100 del parser: índice 62,2; Vínculo 72,4; Situación 60,3; Control 51,1;
  Persona 65,0. Coincide con el expediente inicial de Atarfe
  (`public/seeds`) y con las pruebas. La media del total de REDCap (63,2)
  mezcla escalas y no es válida. Un registro trae el año de nacimiento (1993)
  como edad; el parser lo convierte. 162 de los 910 registros declaran menos de 16 años.
- **IBSE, inconsistencia corregida.** Los dos documentos metodológicos del IBSE
  de Atarfe (23/10 y 20/11) daban 63,2 y afirmaban que el fixture no tenía
  edad ni sexo, o que esos microdatos estaban fuera de GitHub. Se les añade una
  nota que lo corrige y conserva el texto como historial.
- **No comprobado.** El estudio IBSE del expediente real de Atarfe en
  Firestore.
- **Referencias EAS, hechos.** Ya llegan a la aplicación: los valores de
  Andalucía por `andalusiaReferenceContract` y los de Granada y Andalucía de la
  EAS 2023 por `eas2023References`, en Estudios complementarios y en el Perfil.
  `EASComparativeReferences` es la calculadora que comprueba esos valores
  contra los microdatos en las pruebas; no hay nada que reconectar. Se corrige
  su cautela, que citaba Granada-Zaidín.
- **Evaluación, hechos.** La vista Evaluación es un marcador. Lo conservado no
  sirve para reconectarla sin contradecir decisiones vigentes:
  `AgendaResultSummary` se quitó de Evaluación por decisión del responsable
  (20/10/2026, commit `c623411`); `MonitoringPanel` lista actuaciones que
  genera automáticamente la agenda heredada del motor anterior y duplica el
  marco de evaluación (responsable, preguntas, momentos, línea base), que ya
  se edita en el Plan de Acción. El sistema de evaluación que el responsable
  quiere incorporar es el del repositorio histórico, que no está disponible
  en GitHub.
- **Pendiente (decisión del responsable).** Diseño de la evaluación: aportar
  el histórico o definir su contenido.

---

## 2026-11-23 · Retirada del código sin uso y de las fotografías de Zagra

Pages al empezar: `c4d020f`.

- **Decisión del responsable (2026-11-23).** Retirar el código del Perfil que
  generaba COMPÁS y el resto del código sin uso; quitar las fotografías del
  repositorio. La reconexión de la evaluación y de las referencias EAS queda
  pendiente de decisión.
- **Método.** Mapa de importaciones desde `src/main.tsx`, resolviendo los
  archivos índice nombre a nombre. Se retira lo que no alcanza ningún camino
  de la aplicación.
- **Cambio.**
  - 52 archivos de `src` (48 módulos y 4 índices que quedaban vacíos; 7265 líneas): la vista del Perfil generado
    (`LocalHealthProfileView`, `ProfileIntegratedEditorialPreview`), su espacio
    interpretativo (`ui/components/health-profile`), la validación
    institucional del Perfil generado (`approvePSL`, `invalidatePSL`,
    `createFormalValidation`, `FormalValidationForm`), los paneles anteriores
    de Plan de Acción, propuestas y agenda (`ActionPlanPanel`,
    `CanonicalActionPlanPanel`, `AuthoredProposalPanel`, `ProposalMenuPanel`,
    `ProposalReviewMode`, `AgendaPanel`) y otros módulos sin uso.
  - Se conservan, aunque hoy no se usan en la aplicación: las referencias EAS
    (`EASComparativeReferences` y adaptadores), `Esa2030.ts`,
    `MonitoringPanel`, `AgendaResultSummary`, `QuestionnaireBuilderPanel`,
    `EPVSAPanel`, los módulos SAM y SFA, y `buildLocalHealthProfile`,
    `createMunicipalInventory`, `municipality-context` y
    `HealthReportToEvidencePipeline`, que las pruebas de código vivo usan
    para construir expedientes de prueba.
  - 14 archivos de prueba dedicados solo al código retirado se eliminan; en
    otros 6 se retiran los casos que lo usaban.
  - `municipalities/zagra/exports`: se retiran 18 fotografías con personas
    reconocibles (14 de 2017 y 4 de grupo); el manifiesto lo registra y
    `.gitignore` excluye imágenes en `municipalities/`. Siguen en el historial
    de Git.
  - Índice de contratos: GOV-PSL-02 y GOV-PSL-03, retirados.
- **Comprobado (hechos).** Compilación correcta. Suite completa: 2954 pruebas
  correctas, 2 omitidas (antes 3108; la diferencia son las pruebas del código
  retirado). Lint: 23 errores y 3 avisos (antes 26 errores; ninguno nuevo).
- **Pendiente.** Los contratos que describen el Perfil generado
  (`CONTRACT-PSL-COMPAS`, `CONTRACT-MIT-PSL`, `CONTRACT-LOCAL-HEALTH-PROFILE-COMPILER`)
  siguen sin reformar. Microdatos individuales en `fixtures/` (IBSE Atarfe,
  EAS): sin decisión. Ramas integradas: el borrado no fue posible desde la
  sesión de trabajo en la nube.

---

## 2026-11-23 · Una sola fuente escrita: documentos de arranque y referencias al repositorio anterior

Pages al empezar: `033304a`.

- **Decisión del responsable (2026-11-23).** Se trabaja solo con
  `compas-ng-renovado`; `COMPAS_NG` queda fuera del trabajo.
- **Hechos observados (auditoría del 23/11).** `CLAUDE.md`,
  `docs/REPOSITORIO-CANONICO.md` y otros tres puntos de entrada designaban
  `COMPAS_NG` como repositorio único o describían el estado de septiembre. El
  panel de Administración enlazaba como reglas «que deben estar publicadas» el
  `firestore.rules` de `COMPAS_NG`, que no contempla las marcas de borrado y
  prohíbe borrar. Siete pruebas abrían o construían rutas bajo `/COMPAS_NG/`.
  El lint tenía 26 errores y 3 avisos, no 13.
- **Cambio.**
  - `CLAUDE.md`: repositorio, web, punto de entrada, custodia de expedientes y
    reglas vigentes; recuentos de pruebas y lint actualizados; referencias a
    carpetas del escritorio sustituidas. La doctrina vigente no cambia.
  - `README.md` reescrito con el estado actual.
  - A `docs/historico/`: `ROADMAP.md`, `docs/certification/`,
    `docs/planning/` y los documentos de estado y continuidad anteriores
    (`ESTADO-ACTUAL-COMPAS-NG`, `REPOSITORIO-CANONICO`,
    `CONTINUIDAD-COMPAS-NG`, `CONTINUAR-AQUI`, `RECUPERACION-Y-CONSOLIDACION`,
    `PLAN-PASO-4`, `PLAN-DOCUMENTO-VALIDADO`, `ESTADO-INTERVENCION-2`,
    `HANDOFF-GOV-SALIDA-01`, `RELAS-FIREBASE-ACTIVACION`,
    `PERFIL-PROCESAMIENTO-PDF-Y-RELAS`, `DOCUMENTOS-CONSULTA-Y-ORIGINALES`).
    Se actualizan los enlaces que apuntaban a ellos.
  - Panel de Administración: el enlace de reglas apunta a este repositorio.
  - Pruebas y scripts de navegador: ruta base `/compas-ng-renovado/`.
  - Flujo de publicación: «Deploy COMPAS to GitHub Pages».
  - Se retira `tmp-noop.txt`.
- **Comprobado (hechos).** Suite completa: 3108 pruebas correctas, 2 omitidas.
  Compilación correcta.
- **No comprobado.** Los scripts de navegador fuera de la CI
  (`collection-preparation`, `delete-workspace`, `original-files`,
  `load-atarfe-complete` y `test:smoke`): el entorno no pudo instalar el
  navegador de Playwright.
- **Pendiente (decisiones del responsable).** Contratos del Perfil (externo sin
  aprobar; `CONTRACT-PSL-COMPAS` y `CONTRACT-MIT-PSL` declarados vigentes);
  código sin uso (67 módulos); ramas; datos personales en el repositorio
  público; auditoría de Firestore.

---

## 2026-11-22 · Localiza Salud: una recarga no duplica fichas

Pages al empezar: `90188cc`.

- **Decisión del responsable (2026-11-22).** Cargar de nuevo el mismo listado de
  Localiza no debe duplicar activos.
- **Cambio.** Al incorporar un listado de Localiza, se omite la ficha idéntica,
  columna a columna (sin distinguir espacios ni mayúsculas), a otra ya presente
  en el expediente. Se mantiene la regla anterior: no se fusiona por título;
  dos fichas distintas con el mismo nombre siguen separadas.
- **Alcance (inferencia del código).** Si al recargar se elige sustituir la
  versión anterior, sus activos se archivan antes y la carga nueva los crea; el
  cambio actúa cuando se conservan las dos cargas.
- **Límite (hipótesis no comprobada en la interfaz).** Si después se elimina la
  primera carga, sus activos se retiran con ella y la segunda no los recupera.
- **Comprobado.** `document-ingestion-origins` (44/44, con una prueba nueva para
  fichas distintas del mismo título). Suite completa: 3108 pruebas correctas,
  ningún fallo.

---

## 2026-11-22 · Borrador antiguo del Plan de Acción: redacción visible en solo lectura

Pages al empezar: `432f279`.

- **Decisión del responsable (2026-11-22).** Un borrador guardado con una versión
  del catálogo que no es la vigente sigue bloqueado, y además muestra su redacción
  guardada en solo lectura.
- **Cambio.** `PlanPreparationPanel` mantiene el aviso y añade la lista de
  decisiones guardadas: código tal como se guardó, estado, texto vigente y texto
  de partida. Sin controles de edición; el borrador no se modifica.
- **Comprobado (hechos).** Prueba `plan-preparation` (11/11), las dos pruebas de
  navegador de la CI sobre versiones incompatibles y una revisión visual con un
  borrador de prueba en el expediente público de Loja. Suite completa: 3106
  pruebas correctas y 1 fallo, el de idempotencia de Localiza.

---

## 2026-11-22 · Impresión del Perfil: un solo bloque `@media print`

Pages al empezar: `848a564`.

- **Cambio.** El segundo bloque de impresión de `src/App.css` (sombra del modal y
  `break-inside: avoid` en el Plan y el Diagnóstico) pasa al final del bloque
  único. La regla del modal se escribe `.tp-modal.tp-modal`: una regla general
  posterior le da sombra y, sin más especificidad, ganaría al imprimir.
- **Comparación antes/después (hechos).** En impresión emulada, con todos los
  `<details>` abiertos, los estilos calculados de cada elemento coinciden y el
  PDF tiene el mismo tamaño en Perfil (Atarfe), Plan de Acción (Loja),
  Diagnóstico (Atarfe) e Inicio (Loja). El modal conserva la sombra en pantalla
  y no la tiene al imprimir, como antes. Datos: expedientes del repositorio.
- **Prueba.** `psl-c-impresion-regimen` pasa y entra en la CI.

---

## 2026-11-22 · Retirada de Granada-Zaidín: pruebas de navegador fuera de CI y restos visibles

Pages al empezar: `6bfaf4e`. Comprobaciones con expedientes del repositorio
(`public/seeds`) y PDF de ensayo, en navegador aislado; ninguna con Firestore.

### Pruebas adaptadas (todas pasan en local)

Muchas ya fallaban antes de la retirada: usaban la ruta antigua `/COMPAS_NG/` y
una portada sin acceso. Ahora montan la aplicación directamente o usan la entrada
actual.

- `admin-panel`: Loja en lugar de Zaidín; la portada muestra «COMPAS · Acceso».
- `plan-preparation` e `indicator-worksheet`: Loja (y Atarfe), con los apartados
  plegados del diseño de Inicio y los códigos visibles de la plantilla común
  (ENV-OE1.1, ENV-I1.1; el expediente guarda ENV-OE5.1, ENV-I5.1). La plantilla
  común da 47 fichas de indicador (18 + 12 + 17).
- `profile-pdf-enrichment`: el PDF del Informe incorporado se simula con el PLIZD
  de Fuente Vaqueros, solo como PDF de ensayo (252 páginas, huella verificada).
  Las subidas usan PDF generados en la prueba. Las cargas están ahora en
  Diagnóstico › «Carga manual por tipo»; el aviso de Perfil desactualizado se
  comprueba con `pslIsStale`.
- `browser-recovery`: Atarfe y Fuente Vaqueros; la copia incluye el PLIZD. Se
  conserva el borrador de la antigua demostración de coordinación porque las
  copias anteriores pueden contenerlo.
- `relas-login`: la portada ordinaria; la vista `relas-zaidin` ya no existe.
- `relas-firebase.rules`: ámbito `loja`. **No ejecutada**: requiere el emulador
  de Firebase, que no está instalado en esta sesión.
- `profile-complete-review`: se retira la rama de Zaidín. **Sigue fallando** por
  un motivo anterior: con Loja el Perfil sale `archived` y la prueba espera
  `generated`.

### Restos visibles corregidos

- Las dos propuestas de actuación de la ficha ENV-I1.1 decían «El Zaidín» en
  cualquier expediente (observado en Loja). Ahora dicen «el territorio». Prueba
  en `granada-zaidin-retired`.
- Dos comentarios de código con Zaidín como ejemplo.

### Queda (no tocado)

Código con ramas o comentarios de Zaidín, sin efecto visible comprobado:
`badeaMunicipalContext` (caso `granada-zaidin`), lectura UGC de
`HealthReportStructuredReading`, condición de `MunicipalActionPlanModule`,
`PlanPreparationDraft` (`ZAIDIN_*`) y comentarios en `health-profile`.

---

## 2026-11-21 · Retirada de Granada-Zaidín: fase 2, paso 5 (contratos y documentación histórica)

Pages al empezar: `1b5dba6`. Solo documentación; no cambia código ni datos.

### Contratos reformados

- **CONTRACT-LOCAL-HEALTH-PROFILE-METHODOLOGY 2.5.1.** La disposición
  transitoria del Art. 16 quater y la hipótesis sobre el número de conclusiones
  dejan de citar Granada-Zaidín como caso de referencia y se refieren a los
  expedientes de prueba Zagra, Atarfe y Loja. Sin cambios de doctrina.
- **CONTRACT-ACTION-PLAN-CATALOG 1.2 (§12).** El I Plan Local de Salud del
  Distrito Zaidín sigue como origen declarado de los módulos de envejecimiento
  saludable y adicciones. Quedan sin efecto la propuesta 92418 (§7) y la
  excepción de la edición final del Zaidín (§11); no hay rama territorial
  propia. Los apartados anteriores se conservan como historial, con remisión
  al §12.
- **CONTRACT-TERRITORIAL-STATISTICS 1.2.1** y **CONTRACT-DYNAMIC-TRIPYRAMID.**
  Los ejemplos de ámbito inframunicipal ya no nombran Granada-Zaidín.
- **CONTRACT-INDEX.** Recoge las dos versiones nuevas.

### Documentación histórica retirada del árbol

Se retiran siete documentos, consultables en Git en `1b5dba6`:
`COORDINACION-ZAIDIN-PROTOTIPO`, `ZAIDIN-CONCEPTOS-INDICADORES-REVISION`,
`ZAIDIN-CUATRO-BLOQUES-ENTREGA`, `ZAIDIN-INFORME-ORIGINAL-Y-PERFIL`,
`audits/ZAIDIN-EXTERNAL-PSL-FULL-EXPEDIENT-INVENTORY-2026-11-03` y, en
`methodology/reconstruction`, `GRANADA-ZAIDIN-ACTIVOS-LOCALIZA-AUDIT` y
`GRANADA-ZAIDIN-RECONSTRUCTION-PACK`. `CONTINUAR-AQUI.md` y
`CONTINUIDAD-COMPAS-NG.md` advierten de que sus secciones sobre Zaidín son
historial.

### Queda

- Comentarios de código que usan Granada-Zaidín como ejemplo
  (`profileSynthesisView.ts`, `territorialGrammar.ts`) y los seis smokes fuera
  de CI que aún lo usan.
- Las secciones históricas de `CONTRACT-ACTION-PLAN-CATALOG` (§2, §7, §10, §11)
  siguen nombrando el Zaidín como antecedente, a propósito.
- Paso 1 (inventario de Loja en Firestore): requiere `COMPAS_FIREBASE_SA_JSON`
  en el entorno.

---

## 2026-11-21 · Retirada de Granada-Zaidín: fase 2, paso 4 (código, datos y pruebas)

### Retirado del repositorio

- **Datos.**
  - El seed público (`public/seeds/compas-ng-workspace-granada-zaidin.json`).
  - `municipalities/granada-zaidin`: exportaciones, material fuente, Localiza
    y consola de restauración.
  - El PDF del Informe de Salud (`informe-salud-zaidin-abril-2023.pdf`). La
    aplicación publicada deja de servirlo.
- **Scripts y configuración.**
  - `buildGranadaZaidinWorkspace`, `rebuild-granada-zaidin`,
    `restore-zaidin-console` e `inject-ugc-sourcetext`, con sus scripts de
    `package.json`.
  - `vitest.reconstruction.config.ts` y su prueba, que dependía de DOCX
    privados de Granada-Zaidín.
- **Código propio.**
  - Las migraciones `correctZaidinHealthReport`,
    `removeNonObservedZaidinStudies` y `replaceZaidinFinalDraft`, y la marca
    de documentación canónica de Granada-Zaidín en la hidratación.
  - La vista de coordinación `?vista=coordinacion-zaidin`
    (`CoordinatorPreview` y su CSS).
  - El borrador final automático de Granada-Zaidín en el Plan de Acción y en
    el esbozo del Plan Local de Salud.
  - La rama de Granada-Zaidín en `municipalActionPlanModule`.
  - La denominación «Informe de salud de El Zaidín»: la tabla de
    denominaciones institucionales queda vacía.
  - El nombre «El Zaidín» en el Plan resultante y en la exportación del Plan.
  - Los ocho extractores específicos de su informe en la lectura estructurada,
    con sus funciones auxiliares (unas 670 líneas).
- **Interfaz.**
  - Los ejemplos con nombres de Granada-Zaidín en los formularios de
    incorporación se sustituyen por ejemplos genéricos.
  - El panel de administración ya no preselecciona plan de salud.
  - El enlace de acceso deja de usar `?vista=relas-zaidin`, que no era una
    ruta: los enlaces antiguos siguen llevando al acceso.

### Se conserva a propósito

- **El catálogo común de Envejecimiento saludable** (`ZAIDIN_AGING_PROPOSAL`
  y su procedencia: «Plan Local de Salud del Distrito Zaidín»).
- **`browserRecovery`** sigue aceptando, en copias antiguas, el borrador de la
  vista de coordinación y el identificador `granada-zaidin`. Así una
  restauración no falla ni lo recrea como ámbito propio; la lista de retirados
  lo mantiene oculto.

### Pruebas

- **Retiradas por ser propias de Granada-Zaidín.**
  - Sustitución del borrador final.
  - Retirada de estudios no observados.
  - Informe original.
  - Composición 56/92.
  - Informes de zona.
  - Cambio de informe (corrección de su PDF).
  - Lectura N1b de informes de zona, cuya única prueba usaba sus dos informes
    reales; el módulo queda sin cobertura hasta tener informes de zona de
    ensayo.
  - Casos sueltos en otras pruebas.
  - Tres pruebas de humo: vista de coordinación, acceso a su informe y
    referencias documentales, esta última ya desfasada.
- **Adaptadas.**
  - Acceso a documentos y plataforma documental, con copias municipales de
    ensayo de marcos comunes.
  - Esbozo del Plan Local de Salud con Loja.
  - Árbol operativo del Plan con Alfacar.
  - Antecedentes y recursos de Localiza sin Granada-Zaidín.
- **`granada-zaidin-retired`** comprueba ahora también que sus datos y su
  código propio no están en el repositorio.

### Comprobado

- `npm run build`: correcto.
- Suite completa: los mismos 3 fallos pendientes.
- Pruebas de humo de la integración continua: correctas.
- Vistas iniciales de Atarfe y Loja: sin desplazamiento.

### Pendiente

- **Pruebas de humo fuera de la integración continua** que aún citan
  Granada-Zaidín como dato de ejemplo: `admin-panel`, `browser-recovery`,
  `indicator-worksheet`, `plan-preparation`, `profile-complete-review` y
  `profile-pdf-enrichment`. Varias ya fallaban antes.
- **Paso 5:** contratos y documentación histórica de `docs/` (7 documentos
  con su nombre).
- **Paso 1 y paso 3:** Loja, con credenciales.
- **Firestore:** el responsable elimina el expediente compartido desde la
  aplicación, con copia previa.

---

## 2026-11-21 · Retirada de Granada-Zaidín: fase 2, paso 2 (expediente de ensayo neutro)

**Decisiones del responsable:**
- Loja como banco de pruebas real, cuando se pueda leer Firestore con
  credenciales.
- Expediente de ensayo neutro aparte para los estudios complementarios.
- Solo Atarfe tiene un estudio complementario real (IBSE).

### Hechos observados

- **El antiguo expediente de ensayo** (`granada-zaidin-synthetic-test.json`)
  contenía:
  - el texto real del Informe de Salud de Granada-Zaidín de 2023 (441 KB);
  - 56 activos reales de Localiza;
  - informes de zona;
  - 13 estudios: los de la EAS con agregados provinciales públicos de Granada
    («proxy piloto») y los demás de fixtures municipales sintéticas.
- **Lo usaban 36 ficheros de prueba:**
  - 17 de ellos formaban una «suite metodológica histórica» fuera de la
    integración continua, pendiente de realinear con Perfil 2.0. Fallaban
    todos: 138 fallos en 325 casos.
  - Las otras 19 eran pruebas activas.
- **Loja en el repositorio** tiene 6 documentos, 0 evidencias, sin informe con
  texto, sin estudios y sin Perfil. Su expediente completo está en Firestore.

### Cambio

- **Nuevo expediente de ensayo** `fixtures/workspaces/municipio-ensayo-synthetic-test.json`
  («Municipio de ensayo»), generado con `scripts/demo/build-municipio-ensayo.gen.ts`
  y las funciones de la propia aplicación:
  - los 13 estudios conservan sus agregados de ensayo, sin atribuirse a
    ningún municipio;
  - un Informe de Salud de ensayo, analizado con el mismo analizador de
    secciones (9 secciones);
  - 10 activos de ensayo en formato Localiza (8 columnas, vocabulario de
    Localiza Salud);
  - en total, 15 documentos y 46 evidencias. El generador comprueba que no
    queda ninguna mención a Granada-Zaidín.
- **Las 19 pruebas activas usan el expediente de ensayo.** Recuentos, nombres
  y textos se derivan de él. La instantánea de singularidad no cambia: mismas
  cinco unidades y mismas lagunas.
- **Se retiran:**
  - la suite histórica (17 ficheros), su configuración
    `vitest.profile-fixture.config.ts` y el script `test:profile-fixture`;
  - tres pruebas de la denominación institucional de Granada-Zaidín
    («Informe de salud de El Zaidín») en `psl-legado-saneado`;
  - el antiguo expediente de ensayo.

### Comprobado

- Las 19 pruebas pasan: 189 casos.
- Suite completa: los mismos 3 fallos pendientes.
- `npm run build`: correcto.
- Pruebas de humo: correctas.

### Pendiente (fase 2)

- **Paso 1:** inventario de Loja en Firestore (requiere `COMPAS_FIREBASE_SA_JSON`).
- **Paso 3:** pruebas con datos reales de Loja, según lo que se decida
  publicar.
- **Paso 4:**
  - retirar el código propio de Granada-Zaidín: migraciones, vista de
    coordinación, denominación institucional y scripts;
  - retirar sus datos: seed, `municipalities/granada-zaidin` y el PDF del
    informe;
  - retirar las 15 pruebas que leen el seed público y las 6 que leen
    `municipalities/`.
- **Paso 5:** contratos.

---

## 2026-11-21 · Retirada de Granada-Zaidín: fase 1 (aplicación)

**Decisiones del responsable (21/11/2026):**
- Eliminar el expediente de Granada-Zaidín por completo.
- Conservar la línea Envejecimiento saludable en el catálogo común, con su
  procedencia (Plan Local de Salud del Distrito Zaidín).
- No fijar ámbito por defecto ni caso de referencia.
- Borrar sus originales del árbol actual del repositorio; siguen en el
  historial de Git.

### Inventario de dependencias (hechos observados)

- **38 ficheros de `src`** lo mencionan. Entre ellos:
  - las migraciones propias del expediente (`correctZaidinHealthReport`,
    `removeNonObservedZaidinStudies`, `replaceZaidinFinalDraft` y la marca de
    documentación canónica);
  - la vista de coordinación (`?vista=coordinacion-zaidin`);
  - la propuesta `ZAIDIN_AGING_PROPOSAL`, de la que deriva la línea
    Envejecimiento del catálogo para todos los municipios.
- **95 ficheros de prueba** lo mencionan:
  - 33 usan `fixtures/workspaces/granada-zaidin-synthetic-test.json` como
    banco de pruebas del compilador del Perfil y de la lectura canónica;
  - 15 leen el seed público;
  - 6 leen `municipalities/granada-zaidin`;
  - 5 leen el PDF del informe.
- **24 ficheros de datos y documentación** fuera de `src` y `tests`: el seed,
  `municipalities/granada-zaidin` (2,5 MB), el PDF del informe, scripts y
  documentos.

### Fase 1 (esta entrada): retirada de la aplicación

- **Ámbitos.** Granada-Zaidín sale de la lista y del registro de expedientes
  de partida. Si un navegador lo tenía como ámbito activo, deja de abrirse.
- **Sin ámbito por defecto.** Sin elección previa, o si la elegida se retiró:
  - se abre el selector;
  - la barra muestra «Elige un ámbito» y no marca ninguno como activo.
  - Por razones técnicas se carga el primer ámbito de la lista, pero no se
    presenta como elegido. La elección se recuerda al recargar.
- **Otros cambios:**
  - se retiran el rótulo «Demostración» y el ámbito por defecto del panel de
    administración, que ahora pide elegir el plan de salud;
  - CLAUDE.md deja de fijar Granada-Zaidín como caso de referencia.
- **Pruebas:**
  - el mecanismo de hidratación (`municipality-seed-hydration`) se prueba con
    Atarfe;
  - se retiran dos casos propios de Granada-Zaidín: la comparación con su
    export y su migración de documentación;
  - nueva prueba `granada-zaidin-retired`.
- **Comprobado en el navegador:** primera visita, navegador que tenía
  Granada-Zaidín, navegador que tenía Atarfe, y elección de Alfacar y de Loja
  con recarga.

### Pendiente

- **Fase 2:**
  - sustituir los datos de Granada-Zaidín en las pruebas por otro banco de
    pruebas (decisión: cuál, sintético o un expediente existente);
  - retirar las migraciones y la vista de coordinación propias;
  - borrar el seed, `municipalities/granada-zaidin`, el PDF del informe y
    los scripts.
- **Fase 3:** documentación histórica en `docs/` (marcarla como retirada o
  archivarla) y contratos que lo citan.
- **Firestore:** el expediente compartido sigue existiendo hasta que el
  responsable lo elimine. Antes conviene descargar una copia de
  recuperación.

---

## 2026-11-21 · Fallos de la suite completa: paso 1

**Publicado al empezar:** `7b47c58a53c89a50bd942f93d35a3632a251dbe0` (#198).

### Clasificación de los 15 fallos (hechos observados)

| Grupo | Fallos | Causa | Resolución |
|---|---|---|---|
| Colores literales | 5 | `#fff` y similares en CSS sujeto al contrato de paleta | Sustituidos por variables. `#fff` pasa a `var(--blanco)`, con el mismo valor. El marrón de procedencia «propia» pasa a la variable `--procedencia-propia: #8a5a12`, con el mismo valor. No hay cambio visual. |
| Pruebas desfasadas tras el rediseño | 6 | Buscaban textos que cambiaron: «Sala de control», «Líneas estratégicas disponibles», «Descargar estas páginas · PDF» y «Objetivo general:»; contaban 30 fichas cuando, con Bienestar emocional, hay 47; esperaban el modo y los rótulos antiguos de edición | Pruebas actualizadas a la función vigente, sin rebajar lo que comprueban; los recuentos se calculan ahora a partir del catálogo |
| IBSE «se pierde al rehidratar» | 1 | La prueba creaba un estudio sin su documento y el saneamiento lo retira, por diseño | La prueba incluye ahora el documento de origen |
| Numeración visible del Plan | 1 | El indicador lleva `displayCode` | La prueba compara el contenido sin la numeración visible |
| **Pendientes** | 3 | Ver abajo | — |

### Comprobado

- Las funciones afectadas existen y responden. Por ejemplo, la descarga de
  las páginas de datos del Perfil se llama ahora «Guardar páginas en PDF», y
  la edición directa del Plan funciona (prueba de humo
  `action-plan-compatibility`).
- La suite completa pasa de 15 a 3 fallos.
- Integración continua:
  - incorpora los 9 ficheros corregidos y 8 pruebas creadas hoy que no
    estaban;
  - el bloque pasa a 55 ficheros y 402 pruebas, todas en verde;
  - se activa también con cualquier cambio en `tests/**`.

### Pendientes

1. **Impresión** (`psl-c-impresion-regimen`): hay dos bloques
   `@media print` y el contrato exige uno. Paso 2: fusionarlos comparando el
   PDF antes y después.
2. **Localiza duplicado** (`document-ingestion-origins`): cargar dos veces el
   mismo texto duplica los activos.
   - Decisión del responsable (21/11/2026): es una repetición y se ignora.
     Paso 2.
3. **Borrador de versión anterior** (`plan-preparation`, «conserva el
   borrador anterior y avisa de la revisión editorial»):
   - el panel muestra solo el aviso «Se conserva sin modificar y no se puede
     editar» y no enseña la redacción del territorio;
   - los datos se conservan;
   - en la aplicación, Granada-Zaidín migra su borrador antes de llegar ahí.

   Decisión pendiente: mostrar esa redacción en solo lectura, o mantener
   solo el aviso.

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
