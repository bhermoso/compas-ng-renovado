> **Alcance histórico — aclaración 12-11-2026.** Las reglas de generación automática de este documento se conservan para artefactos heredados y sus pruebas. No gobiernan la producción externa ni reactivan el generador en la pestaña Perfil. Para los perfiles externos rigen el [contrato metodológico](../contracts/CONTRACT-LOCAL-HEALTH-PROFILE-METHODOLOGY.md), la [propuesta de contrato externo](../contracts/CONTRACT-EXTERNAL-PSL-FIDELITY-AND-PUBLICATION.md) y la [guía de entrega](../guides/ENTREGA-PERFIL-EXTERNO.md). La prohibición histórica de recomendaciones no se aplica a las recomendaciones Conocer, Contrastar o Abordar del contrato vigente.

# CONTRACT-LOCAL-HEALTH-PROFILE-COMPILER

> COMPÁS NG — Contrato del Compilador del Perfil de Salud Local COMPÁS
> Sprint 2.1 — 2026-06-28
> Estado: LEGACY para el compilador del Perfil; ruta externa descrita en EXTERNAL-PROFILE

---

## 1. Finalidad

El `LocalHealthProfileCompiler` transforma un `LocalHealthProfile` en estado `"validated"` en el **PSL-C** (Perfil de Salud Local COMPÁS): un documento institucional exportable, inmutable y trazable.

El PSL-C es la primera representación oficial del diagnóstico territorial del municipio fuera del sistema. Puede entregarse al Distrito Sanitario, a la Junta de Andalucía y a la ciudadanía.

Este contrato define qué es el PSL-C, qué lo constituye, qué lo excluye y cómo se produce. No modifica el objeto origen (`LocalHealthProfile`); produce un nuevo artefacto independiente.

---

## 2. Distinción fundamental

| Concepto | Tipo | Naturaleza | Mutabilidad |
|---|---|---|---|
| `LocalHealthProfile` | Objeto vivo del sistema | Se recalcula cuando cambia la evidencia | Mutable (se regenera) |
| `LocalHealthProfileArtifact` (PSL-C) | Documento institucional | Instantánea congelada del PSL en un momento preciso | Inmutable |

El PSL-C no es el PSL. El compilador captura el PSL; no lo modifica.

---

## 3. Precondiciones obligatorias (Gates)

El compilador **rechaza** la compilación si alguna de estas condiciones no se cumple:

| Gate | Condición | Razón metodológica |
|---|---|---|
| G-LHC-1 | `psl.status === "validated"` | Solo los PSL técnicamente validados pueden exportarse como documento institucional |
| G-LHC-2 | `psl.conclusiones.status === "authored"` | Las conclusiones deben ser de autoría humana, no scaffold del sistema |
| G-LHC-3 | `psl.cierreInterpretativo.status === "authored"` | El cierre interpretativo debe ser de autoría humana, no scaffold del sistema |
| G-LHC-4 | `psl.priorizacionStatus === "complete"` | El capítulo VII requiere deliberación y consenso documentados |
| G-LHC-5 | `psl.priorizacion.consensoDocumentado === true` | El consenso debe constar explícitamente en el PSL |
| G-LHC-6 | `psl.conclusiones.content.trim().length > 0` | No pueden exportarse conclusiones vacías |
| G-LHC-7 | `psl.cierreInterpretativo.content.trim().length > 0` | No puede exportarse un cierre interpretativo vacío |

Si algún gate falla, el compilador devuelve `CompilationResult` con `ok: false` y una lista de violaciones. No lanza excepciones.

---

## 4. Entradas

```typescript
interface CompileLocalHealthProfileInput {
  psl: LocalHealthProfile;         // El PSL validado que se va a compilar
  compiledBy?: string;             // Quién ejecuta la compilación (perfil técnico)
  municipalityName: string;        // Nombre del municipio para la portada
  municipalityProvince: string;    // Provincia para la portada
}
```

El compilador **no** consume:
- EvidenceStore directamente
- MunicipalDocumentRepository directamente
- Ningún motor del Nivel 2 ni del Nivel 3
- ActionPlanDraft, AgendaDraft, MonitoringDraft

Toda la información que necesita está contenida en el `LocalHealthProfile`.

---

## 5. Salidas

### 5.1 En caso de éxito

```typescript
interface CompilationResult {
  ok: true;
  artifact: LocalHealthProfileArtifact;
}
```

### 5.2 En caso de fallo de precondiciones

```typescript
interface CompilationResult {
  ok: false;
  violations: CompilationViolation[];
}

interface CompilationViolation {
  gate: string;      // Código del gate (G-LHC-1 … G-LHC-7)
  message: string;   // Descripción legible
}
```

---

## 6. Estructura del PSL-C (`LocalHealthProfileArtifact`)

El PSL-C contiene exactamente estas secciones. Nada más.

| Sección | Contenido | Origen en el PSL |
|---|---|---|
| `portada` | Identificación institucional: nombre del municipio, provincia, fecha de compilación, versión | Metadatos del workspace + compilación |
| `identificacionMunicipal` | ID del municipio, nombre, provincia, fecha de generación del PSL origen | `psl.municipalityId`, metadatos |
| `marcoEstrategico` | IDs de las secciones del marco estratégico aplicadas | `psl.strategicFrameworkSectionIds` |
| `informeSalud` | Referencia al Informe de Salud (título, documentId), sin el contenido del documento | `psl.healthReportDocumentId`, `psl.healthReportTitle` |
| `baseDocumental` | Estadísticas de evidencia: total de átomos, orígenes, flags de presencia de los 13 instrumentos (6 obligatorios `ibsePresent`…`cagePresent`; 7 opcionales `ipaqPresent`…`sbqPresent`), total y advertencias de integridad | `psl.totalEvidenceAtoms`, `psl.originsSummary`, `psl.ibsePresent`…`psl.sbqPresent`, etc. |
| `lecturaTerritorial` | Síntesis territorial: resumen, determinantes, activos, indicadores, áreas de intervención, tensiones estructurales | `psl.territorialSummary`, `psl.areasDeIntervencion`, etc. |
| `conclusiones` | Texto de conclusiones de autoría humana | `psl.conclusiones.content` |
| `cierreInterpretativo` | Alcance, limitaciones y síntesis metodológica del diagnóstico. Sin prescripción de acciones. Autoría humana. | `psl.cierreInterpretativo.content` |
| `priorizacion` | Candidaturas técnicas, temáticas ciudadanas seleccionadas, nota de deliberación, estado del consenso | `psl.priorizacion`, `psl.priorizacionStatus` |
| `notaValidacion` | Quién validó el PSL origen, cuándo, hash del PSL origen | `psl.validatedAt`, `psl.validatedBy`, hash calculado |
| `cautelasMetodologicas` | Advertencias de integridad y cautelas derivadas del EvidenceStore | `psl.integrityWarnings`, `psl.integrityErrors` |

### 6.1 Lo que el PSL-C NO debe contener

Los siguientes elementos son internos del pipeline y nunca aparecen en el PSL-C:

- `EvidenceAtom` individuales con sus campos técnicos
- `stableAssetKey`
- `LT1Result`, `OITResult`, `EstadoTerritorialEvolutivo`
- Nombres de variables TypeScript o módulos del sistema
- `ActionPlanDraft`, `AgendaDraft`, `MonitoringDraft`
- Compromisos de actuación, responsables, plazos, presupuesto
- Cualquier dato del Strategic Repository o del MTE

### 6.2 Cómo se presentan las áreas de intervención

Las `areasDeIntervencion` del PSL se incluyen como entradas descriptivas (título + rationale + cautelas) sin sus IDs internos ni sus `relatedEvidenceIds`. Son información institucional, no datos técnicos.

---

## 7. Trazabilidad (invariante)

Todo PSL-C debe incluir:

1. **`sourcePSLId`** — ID del `LocalHealthProfile` compilado
2. **`sourcePSLVersion`** — `version` (ISO timestamp de generación) del PSL compilado
3. **`sourcePSLEvidenceStoreVersion`** — `evidenceStoreVersion` del PSL compilado
4. **`sourceHash`** — hash determinista del contenido del PSL fuente
5. **`evidenceAtomIds`** — IDs de los átomos activos del PSL en el momento de compilación
6. **`compiledAt`** — ISO timestamp de la compilación
7. **`compiledBy`** — Perfil técnico que ejecutó la compilación (si se proporciona)

Esta trazabilidad permite:
- Verificar que el PSL-C fue generado a partir de un PSL específico
- Detectar si el PSL subyacente cambió después de la compilación (via `sourceHash`)
- Auditar el proceso de certificación

---

## 8. Congelación (invariante)

Un `LocalHealthProfileArtifact` compilado **nunca puede modificarse**.

- El campo `isCongealed: true` es un literal type invariante.
- Si el PSL cambia, debe generarse un nuevo artefacto con un nuevo `id` y nueva `compiledAt`.
- El artefacto anterior no se borra: queda en el historial.
- Nunca sobreescribir un artefacto existente.

---

## 9. Persistencia

Los PSL-C se persisten en `workspace.compiledProfiles: LocalHealthProfileArtifact[]`.

Reglas de persistencia:
- Los artefactos son **acumulativos**: se añaden pero no se reemplazan.
- No hay límite de artefactos por municipio (cada compilación genera uno nuevo).
- La búsqueda del artefacto más reciente se hace por `compiledAt` (ISO lexicográfico).
- Si el PSL origen cambia (detectado por `psl.id !== artifact.sourcePSLId` o `hash`), el artefacto anterior sigue siendo válido como historial pero debe marcarse como `"superseded"` en la UI.

---

## 10. Responsabilidades del compilador

| Responsabilidad | Descripción |
|---|---|
| Validar precondiciones | Verificar los 7 gates antes de compilar. Devolver violaciones si alguno falla. |
| Congelar el PSL | Capturar el contenido del PSL en el momento de compilación como instantánea inmutable. |
| Calcular el hash | Generar el `sourceHash` determinista del PSL fuente para auditoría. |
| Construir la estructura documental | Mapear los campos del PSL a las secciones del PSL-C según la tabla del §6. |
| Generar metadatos | `id` (UUID), `compiledAt` (ISO timestamp), `version` del artefacto. |
| Preservar trazabilidad | Incluir todos los campos de trazabilidad del §7. |
| Devolver resultado tipado | `CompilationResult` con `ok: true/false`; nunca lanzar excepciones. |

### Responsabilidades excluidas

El compilador **no**:
- Modifica el PSL origen
- Accede al EvidenceStore
- Accede al MunicipalDocumentRepository
- Produce texto narrativo nuevo
- Toma decisiones institucionales
- Valida la calidad del contenido humano (solo verifica su presencia)
- Envía el documento a ningún destinatario externo

---

## 11. Invariantes

- `isCongealed: true` es siempre el literal `true`. Nunca `false`.
- `compiledAt` es siempre posterior a `sourcePSLVersion`.
- `sourcePSLId` siempre referencia un PSL que existía en el sistema.
- `evidenceAtomIds` es siempre un array (puede estar vacío si el PSL no tenía átomos, lo que no ocurre si G-LHC-1 se cumple).
- El compilador nunca produce un `LocalHealthProfileArtifact` con campos `undefined` en secciones obligatorias.

---

## 12. Versioning del artefacto

El campo `version` del `LocalHealthProfileArtifact` sigue el formato `PSL-C/v{N}` donde N es el número de artefactos compilados para ese municipio + 1. Ejemplo: `PSL-C/v1`, `PSL-C/v2`.

---

## 13. Relaciones

- **Upstream:** `CONTRACT-MIT-PSL` — El PSL que el compilador consume.
- **Downstream:** `CONTRACT-LOCAL-HEALTH-PLAN-DOCUMENT` (cuando exista) — El PSL-C es el capítulo diagnóstico del PLS.
- **Implementación:** `src/application/health-profile-compiler/LocalHealthProfileCompiler.ts`
- **Tipos:** `src/domain/health-profile-artifact/LocalHealthProfileArtifact.ts`
- **Tests:** `tests/local-health-profile-compiler.test.ts`

---

## 14. No-contratos

Este contrato **no** define:
- Nuevos formatos de exportación fuera de los renderers PSL-C existentes. Estado actual: el PSL-C ya dispone de serialización DOCX y PDF mediante `src/application/psl-c-export/`.
- Cambios de experiencia de usuario ajenos al flujo existente. Estado actual: la pantalla del Perfil ofrece compilación, visor institucional y descargas DOCX/PDF cuando existe un artefacto PSL-C.
- Cómo se entrega el PSL-C al Distrito Sanitario (proceso externo)
- El contenido metodológico del diagnóstico (gobernado por CONTRACT-MIT-PSL)
