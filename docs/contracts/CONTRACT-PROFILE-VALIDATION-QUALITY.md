# COMPÁS NG — Contrato del criterio de calidad «Perfil validado»

> Estado: CONCEPTUAL. Fecha: 2026-10-19.
> Decisión del autor (2026-10-19): la validación del Perfil deja de ser una restricción para avanzar y pasa a ser un criterio de calidad. Se prefiere la flexibilidad y se modifica la doctrina según las circunstancias.

## 1. Propósito

Que el municipio pueda avanzar en la lectura estratégica, el Plan de Acción y el documento del Plan Local de Salud sin que la validación del Perfil bloquee el trabajo, y que cada salida declare con honestidad si el Perfil estaba validado o no. La validación sigue siendo una garantía de calidad; deja de ser una puerta.

## 2. Criterio

`assessProfileValidation(status, isStale)` devuelve un criterio con identificador `perfil-validado`, un nivel, si se cumple, una etiqueta y un detalle.

| Nivel | Condición | Cumple |
|---|---|---|
| `approved` | Perfil aprobado y vigente | Sí |
| `validated` | Perfil validado y vigente | Sí |
| `validated-stale` | Validado, pero las fuentes han cambiado después | No |
| `not-validated` | Generado o en revisión, o sin Perfil validado | No |
| `retired` | Sustituido o archivado | No |

El criterio informa. No bloquea, salvo en un caso: un Perfil sustituido o archivado no es el Perfil vigente y no alimenta pasos posteriores (`profileCanFeedDownstream`).

## 3. Dónde se aplica

- **Motor de Traducción Estratégica (G-MTE-1):** deja de exigir `validated` o `approved`. Bloquea solo con Perfil sustituido o archivado.
- **Runtime del municipio:** expone `profileValidation` junto a la lectura; la lectura se genera con cualquier Perfil vigente.
- **Documento del Plan Local de Salud inicial:** compila sin Perfil validado, con Perfil desactualizado e incluso sin Perfil compilado. Declara el criterio en la portada, en la sección 1 y en la sección 7. Si no hay Perfil compilado, la sección 2 lo dice. Siguen bloqueando la ausencia de Plan de Acción validado y un Perfil compilado sin documento sellado.
- **Validación formal (`FormalValidationRecord`):** FVAL-01 se aplica solo al Perfil retirado. El registro guarda el nivel del criterio en `profileValidationAtValidation` (campo opcional).
- **Interfaz:** las vistas de lectura, Plan de Acción y compilación muestran el criterio como aviso de calidad, no como candado. La fase «Plan de Acción» del ciclo ya no se bloquea por el Perfil.

## 4. Lo que no cambia

- El ciclo de vida interno del Perfil (`generated → review → validated → approved`, `superseded`, `archived`) y el gate G-LHC-1 del compilador del Perfil siguen vigentes. Validar el Perfil sigue siendo una acción humana con registro.
- `approvePSL` exige un Perfil en estado `validated`.
- La aprobación institucional del PLS definitivo (G-PLS-1, `approved`) no se modifica aquí. Queda para el futuro `LocalHealthPlanCompiler`; si el autor decide aplicar el mismo criterio, se hará por decisión expresa.

## 5. Relación con otros contratos

- `CONTRACT-MTE` (G-MTE-1), `CONTRACT-INSTITUTIONAL-LIFECYCLE` (FVAL-01), `CONTRACT-LOCAL-HEALTH-PLAN-COMPILER` y `CONTRACT-LOCAL-HEALTH-PLAN-DOCUMENT`.

## 6. Invariantes

- **I-PVQ-1:** toda salida que dependa del Perfil declara el criterio `perfil-validado` cuando se produce sin cumplirlo.
- **I-PVQ-2:** el criterio nunca se simula. Sin Perfil validado, el nivel es `not-validated`.
- **I-PVQ-3:** un Perfil retirado no alimenta pasos posteriores.
