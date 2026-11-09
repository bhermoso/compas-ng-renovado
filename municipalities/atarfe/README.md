# Expediente canónico de Atarfe

Expediente municipal de Atarfe (INE **18022**, provincia de Granada) para COMPÁS NG.
Construido **exclusivamente con fuentes genuinamente municipales** y con los
servicios reales de la aplicación. No contiene datos fabricados, provinciales
atribuidos a Atarfe ni fixtures sintéticas.

## Artefactos

| Fichero | Uso |
|---|---|
| `exports/compas-ng-workspace-atarfe.json` | Export canónico (`MunicipalityWorkspace` serializado, `schemaVersion 1.0.0`). |
| `../../public/seeds/compas-ng-workspace-atarfe.json` | Seed desplegable (byte a byte idéntico al export; Vite lo publica en `dist/seeds/`). |

Generación reproducible: `npm run rebuild:atarfe`
(`scripts/demo/buildAtarfeWorkspace.ts` + `scripts/demo/rebuild-atarfe.gen.ts`,
config `vitest.rebuild.config.ts`; **no** forma parte de `npm test`).

### Reproducibilidad byte a byte

Los servicios de dominio emiten `crypto.randomUUID()` y `new Date()` en cada
llamada. El **constructor canónico** (`buildAtarfeWorkspace`) neutraliza esa
variación —sin alterar el comportamiento normal de la aplicación— aplicando:

- **Sello temporal fijo**: `CANONICAL_TIMESTAMP = 2026-07-16T00:00:00.000Z` en
  todos los `createdAt`/`updatedAt`/`extractedAt` (municipio, repositorio,
  documentos, EvidenceStore, átomos, Informe e IBSE).
- **Identificadores estables**: `doc-health-report-atarfe` (documento del
  Informe), `health-report-atarfe` (HealthReportDocument), `ibse-study-atarfe`
  (IBSEStudy), `doc-ibse-atarfe` (documento IBSE) y `doc-localiza-atarfe`
  (documento Localiza Salud). Los cinco activos usan IDs de átomo estables
  `doc-localiza-atarfe-atom-1..5` (no `crypto.randomUUID()`).

Ejecutar `npm run rebuild:atarfe` dos veces sin cambiar las fuentes produce el
**mismo SHA-256** y deja `git diff` vacío. La prueba `atarfe-canonical-workspace`
(caso 12) reconstruye el expediente con la **capa real de persistencia** y exige
igualdad byte a byte con el export; el caso 14 verifica el determinismo.

### SHA-256 de las fuentes de entrada

Verificado en la suite (caso 13): si una fuente cambia, la validación falla.

| Fuente | SHA-256 |
|---|---|
| `fixtures/health-reports/Informe_Salud_Atarfe.docx` | `597fcacf0342eeb8970ef61b3a9b1d58cfe9eeb1c6703af7639e843a6c5b8e2c` |
| `fixtures/ibse-atarfe.csv` | `3f23693fb62f80bbfd12c55a6da054110deb2d48dca9eaa5599b0a75c36f25be` (CRLF) |

## Actualización 2026-11-09

- **IBSE recalculado.** Las fórmulas del proyecto REDCap Monitor IBSE Atarfe 2026 no dejan los
  cuatro factores en la misma escala (Vínculo 0–75; Situación y Control 25–100; Persona 0–100).
  El parser puntúa ahora desde los ocho ítems en una escala común 0–100 y, para exports sin
  ítems, convierte de forma lineal y exacta. Diccionario corregido para REDCap:
  `redcap/MonitorIBSEAtarfe2026_DataDictionary_escala_corregida.csv`.
- **Export del 05/11/2026** (910 registros; sin marca temporal ni identificador de encuesta en la
  copia pública). Trae sexo y edad: SAM puede describir la composición por edad y sexo.
- **20 registros de Localiza Salud** (tablas aportadas el 05/11/2026 y el 09/11/2026; tres sin identificador). No se ha verificado en línea su vigencia.
- Migración `atarfe-documentacion-canonica-v3` para expedientes ya persistidos: añade las fichas
  que faltan y sustituye el estudio IBSE canónico (no toca un IBSE importado por la persona usuaria).

## Recuentos deterministas

| Elemento | Valor |
|---|---|
| Identidad | `atarfe` · Atarfe · Granada · INE 18022 |
| Documentos del repositorio | **3** (Informe de Salud + IBSE + Localiza Salud) |
| Estudios | **1** (IBSE municipal) |
| Activos para la salud (Localiza Salud) | **20** registros (EvidenceAtoms `asset`, origen `localiza-salud`; 61419 y 61585 comparten título, posible duplicado) |
| EvidenceAtoms totales | **26** (6 IBSE [5 `indicator` + 1 `qualitative-observation`] + 20 `asset` de Localiza Salud) |
| Átomos del Informe de Salud | **0** (D-HR-01 / Art. 7 bis §3) |
| Autoría del Informe | **2 firmantes** (Carlos del Moral Campaña, María José Molina Rueda — Epidemiología, Distrito Granada-Metropolitano) |
| IBSE (muestra **mixta**) | n=910 · nValid=811 · IBSE total 62,2 · Vínculo 72,4 · Situación 60,3 · Control 51,1 · Persona 65,0 (escala común 0–100) · `sampleScope: "mixed"` · distribución edad×sexo (810 asignables) |

## Fuentes incluidas

| Fuente | Categoría (fixtures/README.md) | Rol | Provenance |
|---|---|---|---|
| `fixtures/health-reports/Informe_Salud_Atarfe.docx` | municipal real (documento primario) | Base epidemiológica oficial (**N**), preservada sin atomizar y con su autoría (Art. 16) | `health-report`, `territorialScale: municipio`, `contentMode: full-text-non-atomized` |
| `fixtures/ibse-atarfe.csv` | `municipal-demo` (REDCap Monitor IBSE Atarfe 2026) | Único estudio genuinamente municipal (**+1**) → cumple la regla N+1. Muestra **mixta** (`sampleScope: "mixed"`) | `redcap-export` + tag `ibse`, `territorialScale: municipio`, `contentMode: atomized` |
| Localiza Salud — 5 activos para la salud de Atarfe (portal del Ministerio de Sanidad, [maparecursos](https://localizasalud.sanidad.gob.es/maparecursos/main/)) | municipal real (recursos comunitarios publicados) | Activos para la salud (**+1** comunitario adicional, Art. 7 bis A) | `localiza-salud`, origen `localiza-salud`, `territorialScale: municipio`, `contentMode: atomized`; texto fuente verbatim en `sourceText` |

### Activos para la salud — Localiza Salud (Opción B)

Cinco recursos comunitarios publicados en el portal **Localiza Salud** del
Ministerio de Sanidad para Atarfe. Se ingieren por la **misma ruta documental**
que Granada-Zaidín (`kind: "localiza-salud"` → un `EvidenceAtom` `asset` por
línea, origen `localiza-salud`), sin ampliar `EvidenceAtom` ni ningún contrato
compartido y sin crear un modelo paralelo.

El texto fuente TSV se conserva **verbatim** en `MunicipalDocument.sourceText`
(documento `doc-localiza-atarfe`), con columnas separadas por `" | "`:

```
Nombre | Descripción | Sexo | Grupo | Temas | Provincia | Localidad | IdLocaliza | UrlDetalle
```

Las dos últimas columnas (**IdLocaliza**, **UrlDetalle**) son el enriquecimiento
autorizado (Opción B): preservan el identificador externo del portal y la URL de
detalle de cada recurso. Los **temas múltiples** viajan unidos por `", "` dentro
de su columna, porque `EvidenceAtom` no admite arrays y **no se extiende** para
forzar uno. Las **erratas de origen** («útliles», «MUNUMENTOS») se preservan sin
corrección silenciosa. El **título** de cada átomo es la primera columna (Nombre).

Correspondencia identificador externo (IdLocaliza) → ID interno de átomo:

| Nombre | IdLocaliza (externo) | ID interno de átomo | UrlDetalle |
|---|---|---|---|
| Centro de Participación Activa de Atarfe | `61419` | `doc-localiza-atarfe-atom-1` | `…ResourcesSearchDetail.action?id=61419` |
| Piscina Cubierta Pública Atarfe (Granada) | `47602` | `doc-localiza-atarfe-atom-2` | `…?id=47602` |
| Punto Vuela Atarfe | `60152` | `doc-localiza-atarfe-atom-3` | `…?id=60152` |
| Taller de Coro del Centro de Participación Activa de Atarfe | `61425` | `doc-localiza-atarfe-atom-4` | `…?id=61425` |
| Taller de Senderismo del Centro de Participación Activa de Atarfe | `61429` | `doc-localiza-atarfe-atom-5` | `…?id=61429` |

Dedup por **clave estable** `stableAssetKey(municipio, origen, título)`: hidratar
Atarfe varias veces **no multiplica** los registros (validado en la suite).

#### Migración incremental para expedientes ya persistidos (`atarfe-localiza-v1`)

Un navegador con un Atarfe **anterior** a esta feature (2 docs / 6 evidencias) no se
reemplaza por el seed (la garantía "nunca pisar trabajo del usuario"). Para que esos
expedientes reciban los activos sin perder trabajo, existe una **migración incremental
marcada** (`src/appWorkspaceHydration.ts`): añade únicamente `doc-localiza-atarfe` y sus
5 átomos cuando faltan, y registra la marca versionada `atarfe-localiza-v1` en
`MunicipalityWorkspace.appliedSeedMigrations`.

- La marca **gana a la ausencia del documento**: si el usuario borra Localiza con
  «Eliminar» tras la migración, la marca persiste y **no se repone** (se respeta el borrado).
- El seed canónico lleva la marca estampada, de modo que una hidratación limpia o un
  reemplazo completo quedan marcados sin volver a proponer la migración.
- `schemaVersion` permanece en `1.0.0` (el campo es opcional y aditivo; subirlo
  descartaría todos los expedientes persistidos). Determinista e idempotente.

## Fuentes EXCLUIDAS (y por qué)

| Fuente | Categoría | Motivo de exclusión |
|---|---|---|
| DUKE / PREDIMED / SF-12 / Sueño / CAGE / IPAQ (`*-eas-granada.csv`) | `provincial-eas-granada` | Muestra **provincial de Granada**; el README declara que "no representa ningún municipio concreto". Atribuirlas a la población de Atarfe sería falso. Solo admisibles como contexto provincial explícito (patrón `PROXY_CAUTION`), no como dato municipal. |
| `ibse-granada-provincia.csv` | `municipal-demo` (monitor provincial) | Provincial, no Atarfe; es la referencia interna del módulo IBSE. |
| AUDIT-C / GHQ-12 / PHQ-9 / PSQI / Fagerström / SBQ (`*-municipal.csv`) | `synthetic-validation` | Datos **sintéticos**; "no representan ningún municipio real. No deben interpretarse epidemiológicamente." Prohibidos en un expediente canónico. |
| Priorización `priorizacion_atarfe.csv` (referida en `tests/atarfe-workspace.test.ts`) | dev-derivada | "Solo para integración y desarrollo… no procede de proceso REDCap." Presentarla como priorización ciudadana falsearía un proceso participativo. Además, el fichero no existe versionado. |

> Los arneses `tests/atarfe-workspace.test.ts` y `tests/load-atarfe-complete.mjs`
> construyen un "Atarfe" de desarrollo que **atribuye los EAS provinciales a
> Atarfe**; NO son la construcción canónica y no se reutilizan aquí.

## Cautelas

- El Informe de Salud es la fuente diagnóstica primaria; se conserva íntegro y no
  genera evidencia atomizada (D-HR-01).
- El IBSE es un instrumento de **origen escolar**, pero la muestra de Atarfe es
  **mixta**: incluye menores de 16 y personas de 16 o más. El export **no** aporta
  desglose etario (`strataCounts` ausente), por lo que **SAM no es evaluable por
  estrato con este export**: no se produce dictamen de representatividad ni para
  menores ni para 16+. Nunca se reutiliza el `nValid` total (811) contra dos
  poblaciones distintas. La ausencia de SAM etario **no invalida** el estudio: el
  IBSE sigue siendo un +1 municipal válido para la regla N+1.
- **Cautelas de muestra (dentro del propio artefacto)**: el estudio IBSE y **cada
  uno de sus átomos** llevan dos cautelas: (1) «Muestra municipal mixta: incluye
  menores de 16 y personas de 16 o más; el export disponible no permite desglosar
  los resultados por edad»; (2) «Los valores corresponden a la muestra municipal
  participante; no se ha demostrado representatividad poblacional por estrato con
  este export». Los átomos cuantitativos dicen «Media de la muestra municipal
  participante», nunca «Media municipal». El documento se titula «Monitor IBSE
  Atarfe 2026 (muestra mixta)».
- Regla N+1 (Art. 7 bis A): Informe (N) + IBSE municipal + 5 activos Localiza Salud.
  Hay **dos caminos +1 independientes** (estudio complementario y activos): el
  Perfil sigue siendo compilable con cualquiera de ellos por separado. El gate
  `G-LHC-8` solo dispara si se retiran **ambas** fuentes; no se ha alterado el gate
  para forzar ningún resultado (validado en los casos 17 y 25).
