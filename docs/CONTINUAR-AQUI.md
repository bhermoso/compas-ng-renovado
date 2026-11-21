# Continuación de COMPAS NG

**Desde el 21 de noviembre de 2026, el punto de partida para retomar el trabajo
es el [Registro de trabajo](audits/REGISTRO-DE-TRABAJO.md)**: versión
publicada, comprobaciones con su fuente de datos, cambios y pendientes, por
fecha. Lo que sigue es contexto anterior.

Actualización de limpieza del 13 de septiembre de 2026: la foto de estado
operativa está en [Estado actual y criterio de limpieza](ESTADO-ACTUAL-COMPAS-NG.md).
El acceso autenticado para responsables territoriales queda fuera del flujo
visible principal. El Plan de Acción trabaja ahora con edición directa: `Modificar`
guarda la redacción vigente en el expediente local sin revisión formal
intermedia. `npm test` queda reservado para la suite ordinaria; Firebase,
reconstrucción con DOCX privados y fixture metodológico 56/92 viven en scripts
separados.

Referencia técnica comprobada el 11 de septiembre de 2026: master `e1475705ce9e20a6b0750816774f73b84364985e`, anterior a este documento. Las revisiones locales no deben considerarse pendientes solo por tener un hash diferente: comparar también los árboles de archivos.

## Leer antes de continuar

1. [Inventario funcional y hoja de ruta](planning/INVENTARIO-Y-HOJA-DE-RUTA-COMPAS.md).
2. [Administración y espacios territoriales](ADMINISTRACION-GENERAL-COMPAS.md).
3. [Fuentes y perfil de Zaidín](ZAIDIN-INFORME-ORIGINAL-Y-PERFIL.md).

Los pasos 1 y 2 de la hoja de ruta están documentados. El siguiente recorrido es fuente → revisión del perfil → borrador compartido → ficha. No confundir una entrega documental con nuevas funcionalidades de la aplicación.

## Bases de Zaidín disponibles en el repositorio

- `public/seeds/compas-ng-workspace-granada-zaidin.json`: ocho documentos, 56 evidencias de activos, sin campos de estudios de escalas ni fichas o borradores rellenados. Incluye el informe PDF principal y conserva la conversión histórica.
- `municipalities/granada-zaidin/exports/compas-ng-workspace-granada-zaidin.json` y `compas-ng-workspace-granada-zaidin-MANUAL-56-92.json`: siete documentos y 56 activos.
- `municipalities/granada-zaidin/exports/compas-ng-workspace-granada-zaidin-reproducible-minimo.json`: siete documentos y 15 activos; no es la versión más completa.
- Propuesta codificada: `src/domain/action-plan-catalog/PlanPreparationDraft.ts`.
- Informe original: `docs/source-material/health-reports/informe-salud-zaidin-abril-2023.pdf`.

Estas fuentes están confirmadas en Git; no son copias pendientes de commit. No utilizar `fixtures/workspaces/granada-zaidin-synthetic-test.json` como expediente real. La propuesta codificada no acredita la existencia de decisiones privadas del usuario.

## Condiciones para continuar

- Examinar diferencias históricas antes de fusionarlas. «Diferente de master» no significa «más nuevo».
- Separar código, expediente del navegador y datos de Firebase. Un bundle Git no contiene automáticamente los otros dos.
- No reemplazar expedientes por datos iniciales sin comparar y conservar las versiones existentes.
- Crear un ámbito en Firebase no migra el expediente completo. El espacio territorial comparte actualmente decisiones de borrador e historial.
- La autenticación y la administración general son funciones distintas. No conceder permisos por un correo escrito en una conversación.
- No presentar instrumentos disponibles como estudios realizados ni atribuir aprobación institucional a un borrador.
- No introducir suscripciones ni requisitos de ampliación del plan.

## Intervención 13 de septiembre de 2026: Plan de Acción resultante de Zaidín

- Base comprobada antes de tocar código: `master` y `origin/master` en `1341b41ea8a47f1c5e7909518f0ce04aacbac1f4`.
- Rama local de trabajo: `fix/zaidin-action-plan-result-runtime`.
- Commit local de corrección: `b64a2a1f42f110eef59beb915104ce039df55d0e` (`Fix Zaidin action plan result visibility`).
- Rama remota: creada mediante el conector GitHub, pero no sincronizada con los commits locales; sigue apuntando a la base porque `git push` local falló y `gh auth status` informó que el token local de la cuenta `bhermoso` es inválido.
- PR/deploy: PR no creado desde esta máquina porque no había herramienta de creación de PR disponible tras fallar `gh`; no se desplegó producción.

La reproducción previa en `https://bhermoso.github.io/COMPAS_NG/` confirmó que el usuario podía llegar al panel, pero la aplicación arrancaba por defecto en Atarfe. El encabezado activo decía `Atarfe · Granada · Plan Local de Salud 2027–2030`, mientras el catálogo ya incluía textos de Zaidín; por eso el resultado visible no aparecía inequívocamente como `Plan de Acción resultante · El Zaidín`.

La causa técnica fue triple y acotada:

- `App.tsx` inicializaba siempre `DEMO_MUNICIPALITIES[0]` y no restauraba el último ámbito elegido.
- El selector de ámbito no persistía la elección, así que una recarga volvía a Atarfe.
- En Windows/Vite, la importación implícita de `DocumentAccess` podía resolver `documentAccess.ts` en vez de `DocumentAccess.tsx`; además `ActionPlanCatalogPanel.tsx` conservaba una implementación duplicada frente al wrapper canónico.

La solución aplicada:

- El arranque limpio toma como ámbito por defecto `granada-zaidin` y, después, respeta `localStorage` mediante `compas-ng:active-municipality`.
- Cambiar de ámbito guarda esa selección sin modificar semillas ni expedientes persistidos.
- `DefinitiveActionPlanPreview` muestra literalmente `Plan de Acción resultante · El Zaidín` antes del editor y conserva los estados `included`, `modified`, `excluded` y `pending`.
- Las importaciones locales apuntan explícitamente a `DocumentAccess.tsx`.
- `ActionPlanCatalogPanel.tsx` reexporta el wrapper canónico `BrowserCanonicalActionPlanPanel`, evitando una ruta alternativa obsoleta.

Verificación realizada:

- `npx vitest run tests/active-municipality.test.ts tests/definitive-action-plan-preview.test.tsx tests/pa-relas-02-ui.test.ts tests/document-access.test.tsx`: 4 archivos, 7 tests, todo correcto.
- `npm run build`: correcto; queda solo el aviso habitual de tamaño de chunk de Vite.
- Prueba visual con Playwright contra Vite local: el primer arranque abre `Granada-Zaidín`; el panel muestra `Plan de Acción resultante · El Zaidín`; tras modificar `ENV-B-edadismo` y `ENV-OE5.2`, aceptar `ENV-OE5.1`, `ENV-I5.1` y `ENV-I5.2`, y excluir `ENV-OE2.1`, la vista resultante enseña los textos modificados, oculta el texto histórico `CAMPAÑA/FESTIVAL ZAIDÍN SENIOR FEST`, oculta lo excluido, mantiene el recuento de pendientes y conserva todo tras recargar. Capturas de comprobación guardadas fuera del repositorio en `outputs/compas-local-zaidin-plan-edited.png` y `outputs/compas-local-zaidin-plan-after-reload.png`.

Limitaciones conocidas no resueltas en esta intervención:

- `npm test` completo sigue fallando por expectativas históricas ya existentes: conteos de documentos/evidencias de Zaidín que esperan 7/20 frente a los datos actuales, emulador Firebase no levantado en tests de administración, DOCX fuente ausente para reconstrucción de Granada-Zaidín, una huella SHA de Atarfe y dos expectativas antiguas de `plan-preparation.test.tsx`.
- No se alteraron datos semilla ni estados de borrador existentes; la corrección se limita a arranque, persistencia de ámbito, ruta canónica del panel y visibilidad del resultado.

## Próximo trabajo acotado

1. Resolver INV-01 del inventario: comprobar identidad de fuentes y ausencia de observaciones no acreditadas, en vez de exigir ciegamente siete documentos.
2. Contrastar las versiones disponibles del informe y el perfil, manteniendo las conclusiones anteriores hasta revisión humana.
3. Preparar el intercambio entre borrador local y compartido con vista previa, comparación de versiones y tratamiento de conflictos.
4. Conectar fichas, actuaciones y entregas al ámbito territorial, con aislamiento y revisión probados.

Los detalles privados de recuperación se conservan fuera del repositorio público. Pedir únicamente la información que falte después de leer las referencias anteriores. Registrar resultados y limitaciones de cada paso para poder continuar sin depender de una conversación.

## Intervención 13 de septiembre de 2026: edición directa del Plan de Acción

La ruta principal del Plan de Acción queda orientada a edición territorial directa. Al seleccionar `Modificar`, el panel crea o actualiza inmediatamente un `PlanPreparationDraft` del expediente del municipio, y al escribir en la caja de texto guarda la nueva redacción como texto vigente de ese ámbito. No se crea una `PlanPreparationReview` ni se muestra la revisión formal legacy cuando el flujo directo está activo.

Cambios técnicos aplicados:

- `PlanPreparationPanel` usa las etiquetas `Estado del Plan` y `Redacción vigente`; el helper de actualización evita depender de `draft!` y emite un draft completo en cada cambio.
- `LegacyActionPlanCatalogPanel` oculta el bloque `Revisión formal y catálogo original` cuando recibe `onDraftChange`, dejando la pantalla principal sin fase administrativa intermedia.
- `App.tsx` conserva borradores por par `municipalityId + moduleId`, evitando que un territorio pise el draft de otro con el mismo módulo.
- Las smoke tests de Plan y coordinación usan las nuevas etiquetas y verifican que no cambian las revisiones formales.

Verificación realizada:

- `npx vitest run tests/plan-preparation.test.tsx tests/pa-relas-02-ui.test.ts tests/definitive-action-plan-preview.test.tsx tests/active-municipality.test.ts`: 4 archivos, 12 tests, todo correcto.
- `npm run build`: correcto; solo el aviso habitual de tamaño de chunk de Vite.
- `node tests/plan-preparation.smoke.mjs`: correcto; modifica, persiste, recarga y conserva ficha/actuación sin crear revisión formal.
- `node tests/coordinator-preview.smoke.mjs`: correcto; la maqueta separada sigue funcionando con las nuevas etiquetas.
