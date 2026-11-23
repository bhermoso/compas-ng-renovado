# Encargo del Paso 4 — Gates nuevos, `readingStatus` y reconciliación del gate de átomos

> Este documento es un encargo ejecutable por otro agente contra el remoto, sin
> la sesión que diseñó la Fase 1. Autoridad: `CLAUDE.md`,
> `docs/contracts/CONTRACT-LOCAL-HEALTH-PROFILE-METHODOLOGY.md` (v1.1) y
> `docs/ESTADO-INTERVENCION-2.md`. Antes de tocar código: reconstruir estado
> (`git status --short`, `git log --oneline -10`, `git rev-parse HEAD`) y
> **verificar cada premisa de este documento contra el código** — es una
> fotografía a fecha ffadb9e, no verdad viva.

## Objetivo

Cerrar la asimetría del gate de átomos y reubicar la autoría según el Art. 16 del
contrato metodológico, sin reabrir doctrina (el paso 4 IMPLEMENTA el Art. 16 tal
como está redactado: cuerpo compilado y trazable, no editable a mano; la autoría
humana vive en el cierre y el enriquecimiento).

## Premisas verificadas (a fecha ffadb9e — re-verificar)

- Gates actuales en `validateCompilationPreconditions`
  (`src/application/health-profile-compiler/LocalHealthProfileCompiler.ts`, ~L54-108):
  - G-LHC-1: `psl.status === "validated"`.
  - **G-LHC-2**: `psl.conclusiones.status === "authored"` (sobre el string de seis capítulos).
  - G-LHC-3: `psl.cierreInterpretativo.status === "authored"`.
  - G-LHC-4: `psl.priorizacionStatus === "complete"`.
  - G-LHC-5: `psl.priorizacion.consensoDocumentado`.
  - **G-LHC-6**: `psl.conclusiones.content` no vacío.
  - G-LHC-7: `psl.cierreInterpretativo.content` no vacío.
- Gate de átomos en la vista: `LocalHealthProfileView.tsx:799`
  `const isEmpty = psl.totalEvidenceAtoms === 0;` (usado en 925, 959, 1084). El
  **compilador NO tiene gate de átomos** (verificado): un municipio con 0 átomos
  compila hoy artefacto y export.
- `readingStatus` **no existe** todavía en el código.
- Documento canónico: `PSLCCanonicalDocument`
  (`src/application/psl-c-canonical/pslcCanonicalDocument.ts`): `editorialView`,
  `generatedDateLabel`, `provenance`. La `editorialView`
  (`ProfileIntegratedEditorialView`) tiene `territorialReadings` que puede estar
  vacía.
- **No hay export JSON de workspace de Zagra** en `municipalities/zagra/`
  (solo `manifest.json`). El ejecutor deberá construir/derivar una fixture
  "Informe + priorización, 0 átomos" o localizar una equivalente.

## Premisas a verificar por el ejecutor (no confirmadas aquí)

1. Dónde —y si— se enforce la **regla N+1** (Perfil = Informe + al menos una de:
   estudios complementarios, activos, priorización). Grep inicial: aparece en
   `buildLocalHealthProfile.ts`, `institutionalProfileModel.ts`,
   `ThematicPrioritisationToEvidenceAtoms.ts`, entre otros. Confirmar si es un
   gate del compilador o solo lógica de construcción.
2. Qué tests fijan hoy los mensajes/estructura de G-LHC-2/G-LHC-6
   (p. ej. `psl-c-institutional-contract.test.ts` sección de gates,
   `local-health-profile-compiler.test.ts`). Esos **son tests de gate**, no de
   capítulo: se actualizan en el paso 4 (no en el 5).

## Deliverables

### D1 — Discriminador `readingStatus`

Añadir a `PSLCCanonicalDocument` (y por tanto al sello) un campo
`readingStatus: "integrated" | "prioritization-pending"`.

- `"integrated"`: hay lectura territorial integrada (evidencia atomizada > 0 y
  `editorialView.territorialReadings.length > 0`).
- `"prioritization-pending"`: el Perfil es válido por N+1 gracias a la
  priorización ciudadana pero no hay lectura territorial atomizada todavía
  (caso Zagra). El documento se declara DIGNO: cabecera, bloques de fuente,
  cierre y declaración explícita de "lectura de la priorización pendiente"
  (Popay: conocimiento pendiente, no ausencia), con `territorialReadings: []`.
  **No se fabrica** una lectura.

Lo fija `buildPSLCCanonicalDocument` a partir de los `answers`/psl. El campo
entra en el `payload` sellado y en el `canonicalHash`.

### D2 — Reubicación de gates (Art. 16)

- **Retirar G-LHC-2 y G-LHC-6** (que gatean el string libre `conclusiones.content`).
- **Introducir un gate estructural** en su lugar: el documento canónico compila a
  una `editorialView` NO degenerada (cabecera presente + cierre + trazabilidad;
  para `prioritization-pending`, la estructura digna descrita en D1). El cuerpo
  diagnóstico es COMPILADO, no "authored": no lleva gate de autoría.
- **Conservar G-LHC-3 y G-LHC-7** sobre `cierreInterpretativo`: ahí vive la
  autoría humana (Art. 16 / Art. 7 quater). El técnico firma el cierre y el
  enriquecimiento (interpretaciones/hipótesis/lagunas), no seis capítulos.
- Actualizar los tests de gate afectados a la nueva estructura (no silenciar).

> Nota de orden: el paso 4 cambia el CÓDIGO de los gates; la tabla de gates del
> contrato derivado `CONTRACT-LOCAL-HEALTH-PROFILE-COMPILER.md` se actualiza en el
> **paso 6** (requiere aprobación del responsable y revisión del diff). Habrá una
> divergencia temporal código↔contrato entre el paso 4 y el 6: es esperada y está
> aprobada.

### D3 — Reconciliación del gate de átomos

Hoy la vista decide `isEmpty` por su cuenta y el compilador no. Unificar:

- El compilador determina `readingStatus` (D1) y lo sella.
- La **pantalla del artefacto congelado** lee `readingStatus` del sello (no
  recalcula `isEmpty`). La **pantalla pre-compilación** sigue con lógica viva
  (criterio fijado: el técnico trabaja antes de compilar).
- 0 átomos con **al menos** un +1 (priorización, o estudios, o activos) →
  `prioritization-pending` (o `integrated` si el +1 aporta lectura) → compila
  con documento digno.
- 0 átomos y **ningún** +1 → **no es Perfil** (regla N+1) → la compilación se
  BLOQUEA con violación tipada (no un artefacto vacío).

### D4 — Caso Zagra

Zagra (Informe + priorización, 0 átomos) DEBE compilar y producir un documento
digno con `readingStatus: "prioritization-pending"` que no fabrica lectura y deja
la puerta abierta a la Fase 3 (la instantánea de priorización queda sellada en
`provenance`; `territorialReadings` es rellenable después sin cambiar esquema).

## Verificación (tests a añadir)

- Zagra-like (0 átomos + priorización) → `result.ok === true`,
  `readingStatus === "prioritization-pending"`, documento con declaración de
  lectura pendiente y `territorialReadings: []`.
- 0 átomos + ningún +1 → `result.ok === false` con la violación N+1 esperada.
- Municipio con evidencia atomizada (Granada-Zaidín) → `readingStatus ===
  "integrated"`, lectura presente.
- Gates: un PSL sin cierre `authored`/vacío sigue violando G-LHC-3/G-LHC-7; un
  PSL con `conclusiones` scaffold YA NO viola nada por sí mismo (G-LHC-2/6
  retirados) — verificar que el cuerpo compilado no exige autoría.
- Suite completa en verde; `tsc -b` exit 0.

## Fuera de alcance del paso 4

- Retirar `conclusiones.content`/cierre del artefacto y proyectar el export desde
  la `editorialView` → **paso 5** (ahí caen docx:130, pdf:135,
  institutional-contract:284, compiler:267, que hasta entonces siguen verdes).
- Actualizar la tabla de gates del contrato → **paso 6** (aprobación + diff).

## Entorno

Todo corre con fixtures; apto para GitHub Codespaces o Codex contra el remoto.
Los microdatos EAS solo hacen falta para derivar referencias nuevas, no para el
paso 4. No hacer push salvo instrucción explícita; commit solo cuando se pida.
