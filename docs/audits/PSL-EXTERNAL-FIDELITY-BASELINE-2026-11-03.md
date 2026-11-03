# Auditoría inicial de fidelidad y comparabilidad de perfiles externos

> Fecha: 2026-11-03. Estado: **auditoría documental preliminar, no certificación de los expedientes de Firebase**.
>
> Se contrasta con la propuesta `docs/contracts/CONTRACT-EXTERNAL-PSL-FIDELITY-AND-PUBLICATION.md` y con `docs/contracts/CONTRACT-LOCAL-HEALTH-PROFILE-METHODOLOGY.md` v2.3.0 (vigente).

## Fuentes efectivamente examinadas

- Loja v0.3: `tests/fixtures/profile-text/loja-v0.3-package.txt` (27.252 caracteres). **Es texto de paquete conservado en el repositorio**, no certificación de posesión del PDF original.
- Zagra v0.1: `tests/fixtures/profile-text/zagra-v0.1-pdf.txt` (texto extraído, 13 marcadores de página) y PDF de 13 páginas facilitado en la conversación (`Perfil de Salud Local de Zagra (1).pdf`). **No se deduce de ello que los bytes del PDF estén asociados como original a una versión en Firebase.**
- Zagra v0.2: `tests/fixtures/profile-text/zagra-v0.2-docx.txt` y `tests/fixtures/profile-text/zagra-v0.2-pdf.txt` (extracciones conservadas en el repositorio; la última contiene 18 marcadores de página). La presencia de extracciones **no demuestra por sí sola** que los originales DOCX/PDF estén en la biblioteca de Firebase ni cuál sea la versión vigente.
- Implementación: `src/application/health-profile/externalProfiles.ts`, `profileStructure.ts`, `src/ui/components/ExternalProfileDashboard.tsx`, `ProfileResultsDashboard.tsx`; contrato de arquitectura `docs/architecture/EXTERNAL-PROFILE.md`.

## Resultado comparativo — documentos fuente

| Observación | Loja v0.3 | Zagra v0.1 | Zagra v0.2 |
|---|---|---|---|
| Naturaleza del material cotejado | Texto del paquete | PDF aportado + extracción | Extracciones DOCX/PDF |
| Extensión conocida del PDF | No verificada | **13 páginas** | **18 páginas según texto extraído de PDF** |
| Cuerpo de 7 apartados | Sí, según títulos | Sí, según títulos | Sí, según títulos |
| Conclusiones identificadas | **9 (C1–C9)** | **8 (C1–C8)** | **8 declaradas en lectura de conjunto** |
| Recomendaciones identificadas | **11 (R1–R11)** | **10 (R1–R10)** | **10, verificables en texto** |
| Fuentes bibliográficas | **38** ítems numerados en texto | **15** referencias en el PDF | Referencias presentes; recuento e identidad exacta pendientes de cotejo |
| Apertura | «Loja en datos», «Quién vive aquí», «Panel de salud», «Desigualdad» | Portada/créditos y resumen, sin las cuatro páginas comunes | Portada editorial y «Zagra en una página»; no equivale automáticamente a las cuatro páginas comunes |
| Anexos | Referencias y bloques documentales | A–J: diagnóstico por ámbitos, recursos, metodología y notas técnicas | A–J: incluye **J. Trazabilidad de las conclusiones** |
| Estado institucional | No certificado aquí | Borrador v0.1 sin validar | Borrador v0.2, pendiente de validación técnica |

**Interpretación de extensión:** Zagra v0.1 tiene más anexos descriptivos; Loja reúne más referencias y una apertura de datos. Zagra v0.2 introduce una composición editorial y una lectura de conjunto más desarrollada. No hay base para atribuir sus diferencias de páginas únicamente a COMPÁS o a un defecto de calidad. Las palabras del texto extraído no son equivalentes a páginas maquetadas.

## Matriz inicial de conformidad por requisito

Claves: **D** = documentado en el material examinado; **P** = parcial / requiere revisión; **NV** = no verificado. Esta tabla no otorga validación institucional.

| Requisito | Loja v0.3 | Zagra v0.1 | Zagra v0.2 | Nota |
|---|---|---|---|---|
| Singularidad territorial | D | D | D | Contextos, periodos y antecedentes específicos |
| Siete apartados del art. 16 quater | D | D | D | La calidad de cada apartado no queda certificada |
| Lectura de conjunto inicial de conclusiones | P | P | D | Zagra v0.2 tiene título y tres párrafos explícitos; cotejar Loja y Zagra v0.1 |
| Conclusiones y recomendaciones ligadas | D | D | D | Revisión semántica de cada vínculo, pendiente |
| Referencias y cautelas | D | D | D | No se han contrastado los documentos primarios de todas las citas |
| Cuatro páginas iniciales del art. 17 ter | P | No acreditadas | P | «Zagra en una página» no es la plantilla de cuatro; Loja presenta bloques homónimos, su contenido y su maquetación no están certificados |
| Original PDF/DOCX en `externalProfileLibrary.attachments` | NV | NV | NV | Hace falta inspeccionar inventario y huellas del expediente |
| Texto importado idéntico al original | NV | NV | NV | Un resumen/estructura similar no prueba identidad literal, tablas ni anexos |
| Exportación COMPÁS fiel e íntegra | NV | NV | NV | Falta cotejar exportaciones reales, incluidos anexos y repetición |
| Validación humana institucional | NV | **No, borrador declarado** | **No, borrador declarado** | No confundir guardado, atribución de autoría y validación |

## Transformaciones permitidas e identificadas en el código

1. **Custodia:** `importProfileFile` guarda los bytes en base64, tamaño y SHA-256. `profileAttachmentBlob` comprueba tamaño y SHA-256 al recuperar el archivo; **solo se puede afirmar integridad cuando el adjunto existe realmente y supera esa comprobación**.
2. **Extracción:** PDF/DOCX a texto editable. El PDF podría perder diagramación, tablas y otros contenidos no textuales aunque el archivo fuente continúe preservado.
3. **Estructuración:** `parseProfileStructure` reconoce párrafos, secciones, conclusiones, recomendaciones y referencias y refluye bloques de PDF; `prefillFromStructure` completa campos vacíos desde el documento. Esta extracción no significa equivalencia literal certificada.
4. **Panel:** `ProfileResultsDashboard` destaca cifras del resumen cuando no hay paquete de resultados; el perfil de Zagra visto en la sesión mostraba ausencia de paquete de indicadores y 8 conclusiones, 10 recomendaciones y 13 páginas, consistentes con v0.1.
5. **Exportación:** la impresión del perfil genera un documento editorial derivado y, tras la mejora de noviembre, incluye además el texto de la revisión en un anexo de impresión. Esto puede **duplicar lectura e incrementar páginas respecto del original**. No se ha certificado visualmente cada tabla, nota, gráfico, pie y referencia.
6. **Versionado:** la edición crea nueva revisión; no debe confundirse PDF original, texto de revisión y representación impresa. La presencia de artefactos `compiledProfiles` heredados tampoco demuestra la ausencia de un perfil externo.

## Conclusiones verificables

- **Hay diferencias anteriores a la importación**: el texto de Loja v0.3 y los documentos de Zagra tienen aperturas y anexos diferentes.
- **La evolución entre Zagra v0.1 y v0.2 es real en los materiales conservados**: la segunda incluye una nueva entrada editorial, lectura de conjunto y anexo de trazabilidad; no debe tratarse como simple remaketado de la primera.
- **La presencia de un perfil en pantalla prueba consulta de una representación**, no custodia del original correspondiente ni aprobación técnica.
- **No corresponde homogeneizar las longitudes**. Se necesita compatibilidad científica, no uniformidad artificial.

## Próximas verificaciones de evidencia, sin modificar Firebase

1. Leer para cada municipio la `externalProfileLibrary` efectivamente cargada: identificador de versión, `activeId`, fecha de incorporación, estado, `attachmentIds`, nombres de archivo, tamaños y SHA-256, sin exponer el contenido base64.
2. Comparar la huella SHA-256 del PDF de Zagra v0.1 aportado con los adjuntos correspondientes; comprobar si v0.2 existe como versión distinta y si posee adjuntos propios.
3. Localizar y cotejar el PDF fuente exacto de Loja v0.3, si lo hay.
4. Cotejar texto y tablas contra los originales: faltas, cambios de orden, omisiones, valores, fechas, referencias y anexos.
5. Imprimir el perfil desde COMPÁS y comprobar página a página diferencias de visualización, ausencia de duplicaciones engañosas y documento editorial claramente rotulado.
6. Registrar acta de conformidad y **solo entonces**, si procede, proponer correcciones como nueva revisión o cambio de presentación, nunca reescritura silenciosa.

**Prohibición operacional durante esta auditoría:** no cargar otro archivo, cambiar `activeId`, validar, sustituir ni generar revisiones de Loja o Zagra sin decisión explícita del usuario.
