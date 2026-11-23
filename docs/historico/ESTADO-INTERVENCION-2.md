# Estado de la Intervención 2 — Unificación documental del Perfil de Salud Local

**Fecha de cierre parcial:** 2026-07-15
**Último commit del avance:** ffadb9e · rama master

## Objetivo de la intervención

Un solo modelo canónico del Perfil (I-LHPM-8, Art. 17 bis del contrato
metodológico v1.1): pantalla, visor, DOCX, PDF e impresión sirven el mismo
documento. Se elimina la triple composición detectada en la Fase 0
(lectura canónica en pantalla / capítulos legados / export propio).

## Completado

**Paso 1 (f0d3525).** El artefacto PSL-C congela un documento canónico
sellado: tipo `PSLCSealedCanonicalDocument` (schemaVersion 2, payload
serializado, canonicalHash con prefijo `pslc-`) + instantánea de
DiagnosticAnswers como procedencia interna. Verificación de pureza de los
seis motores de la vista editorial: puros; única impureza (generatedDate
vía toLocaleDateString, dependiente de ICU/TZ) neutralizada con
formatCanonicalDate (UTC). Compilar dos veces → hash idéntico; mutar el
workspace después → artefacto inalterado.

**Paso 2 (4fc5eba).** El proyector (`pslcDocumentModel`, `pslcDocx`,
`pslcPdf`, `PSLCArtifactViewer`) consume exclusivamente el artefacto.
Eliminado el parámetro `answers`: muere la doble forma (el mismo hash ya
no puede producir documentos distintos). Camino legacy intacto: artefactos
sin canonicalDocument exportan desde conclusiones.content.
`psl-c-documento-visual.test.tsx` reescrito a fuente única (artefacto
canónico vs artefacto legacy). Verificado de forma independiente por
segundo agente: APTO.

**Paso 3 (ffadb9e).** Alcance A+B+C:
- **A** — La pantalla del artefacto congelado renderiza su lectura canónica
  con `ProfileIntegratedEditorialPreview` alimentado por
  `readSealedCanonicalDocument(artifact.canonicalDocument).editorialView` (la
  editorialView SELLADA, no recalculada). Es el mismo componente que la
  pantalla viva; la única diferencia es la fuente (answers vivos vs sello).
  `PSLCArtifactViewer` (document model = lo que exportan DOCX/PDF) queda tras
  el `<details>` como "documento institucional completo".
- **B** — Paridad de cabecera: el compilador sella el título INSTITUCIONAL del
  Informe (`institutionalHealthReportTitle`), el mismo transform que usan
  pantalla viva (`doc.primarySource.title`) y export. Tres vías, misma cabecera.
- **C** — `tests/psl-c-paso3-unificacion.test.tsx` (5 tests): paridad de
  cabecera sello↔export; mutar el workspace tras compilar no altera el document
  model ni el sello; `ProfileIntegratedEditorialPreview` renderiza el sello.

Suite tras el paso 3: **2226/2226** (82 ficheros). `tsc -b` exit 0.

## Decisiones tomadas (no reabrir sin causa)

- **Path A** en el paso 2: proyector desde el snapshot congelado; los
  tests de capítulo (docx:130, pdf:135, institutional-contract:284,
  compiler:267) siguen verdes por diseño y caen en el paso 5.
- **Payload opaco al dominio** (serializado, con schemaVersion interna):
  domain no importa application. Promoción a campo estructurado posible
  en el futuro, sin urgencia.
- **canonicalHash propio** (`pslc-`) sin tocar computePSLHash ni sus tests.
- **Alcance A+B+C del paso 3**: la pantalla del artefacto lee el sello; el
  export sigue proyectando el **document model** (desde el snapshot +
  `conclusiones.content`) HASTA EL PASO 5. La convergencia estructural plena
  export↔editorialView es del paso 5, no del 3.
- Artefactos v1 antiguos: material de desarrollo, invalidables; el sistema
  los declarará ilegibles con dignidad (paso 5).

## Pendiente (en orden)

- **Paso 4** — Gates nuevos (G-LHC-2/6 → gate estructural sobre el documento
  canónico; G-LHC-3/7 se conservan sobre el cierre), discriminador
  `readingStatus` ("integrated" | "prioritization-pending"), reconciliación del
  gate de átomos entre compilador y vista. Zagra (N+1 por priorización, 0
  átomos) compila con documento digno que declara la lectura pendiente; 0
  átomos sin ningún +1 se bloquea. **Encargo detallado en
  docs/PLAN-PASO-4.md.**
- **Paso 5** — Retirar `conclusiones.content`/cierre del artefacto y proyectar
  el export desde la editorialView. Caen y se reescriben los cuatro tests de
  capítulo (docx:130, pdf:135, institutional-contract:284, compiler:267). Guard
  de esquema para artefactos v1 (ilegibles con dignidad).
- **Paso 6** — Actualizar la tabla de gates en
  CONTRACT-LOCAL-HEALTH-PROFILE-COMPILER.md para reflejar el paso 4. Requiere
  aprobación del responsable y revisión del diff antes de commit.

## Líneas paralelas abiertas

- **Fase 3 — Priorización ciudadana como evidencia.** Auditoría completada
  (2026-07-15): el corte está en DiagnosticAnswers (sin campo participativo) y
  en LT1 (excluye átomos strategic-priority, con test). Frontera
  evidencia/decisión en el dato: ThematicPrioritisationStudy (ranking, votos,
  cautelas) es evidencia; selectedTopicIds es decisión — la lectura canónica
  bebe solo del Study. Datos reales: export REDCap de Atarfe 2026-07-15 con sexo
  y edad (n=164, 158 completos; sesgo a mujeres 65% y mayores de 50, 59% —
  cautela de representatividad declarable con datos) y export REDCap real de
  Zagra. AMBOS PENDIENTES DE SUBIR a municipalities/*/prioritisation/
  (git add -f, *.csv está ignorado).
- **Deuda visual** registrada en CONTRACT-INDEX (dos escalas de grises,
  1.400+ colores hardcodeados, tokens sin uso).

## Cómo retomar

Leer CLAUDE.md y este fichero. Reconstruir estado con Git. El diseño completo de
la Fase 1 (qué se congela, gates, migración, orden) está aprobado y sus
decisiones aquí; los pasos 4-6 se ejecutan de uno en uno, con verificación y sin
encadenar. Trabajable desde GitHub Codespaces o Codex contra el remoto: todo
corre con fixtures; los microdatos EAS solo son necesarios para derivar
referencias nuevas (D4-05 ampliada).
