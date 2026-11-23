# Estructura física del repositorio — COMPÁS NG

## Directorios canónicos

### `src/`
Código fuente TypeScript. Dominio, aplicación, infraestructura y UI.
No debe contener datos, documentación ni fixtures.

### `tests/`
Tests Vitest. Solo ficheros `.test.ts`.
Las referencias a datos de prueba apuntan siempre a `fixtures/`.

### `fixtures/`
Datos de prueba versionados. Solo archivos explícitamente permitidos en `.gitignore`.
- CSV derivados de los microdatos EAS (provincia Granada).
- DOCX de informes municipales de referencia.
- `population/` — datos de población como módulos TypeScript tipados.
- `health-reports/` — informes de salud fuente en formato documental.

Los microdatos originales EAS (`EAS_COMPLETO.csv`, `EAS_microdatos_adulto_READY.csv`)
se mantienen en la raíz del proyecto para uso por los scripts de exportación en `scripts/`.
No son fixtures; no están versionados.

### `municipalities/`
Estructura de trabajo por municipio. Cada municipio tiene subcarpetas:
`sources/`, `processed/`, `profiles/`, `prioritisation/`, `exports/`, `plans/`, `audit/`, `evidence/`.

El contenido de trabajo local no está versionado (gitignoreado: `*.csv`, `*.docx`, `*.pdf`, `*.xlsx`).
Solo se versiona la estructura de carpetas (`.gitkeep`) y ficheros explícitamente promovidos.

### `docs/`
Documentación institucional y técnica. Solo Markdown.

| Subcarpeta | Contenido |
|---|---|
| `architecture/` | Constituciones, blueprints, modelos de dominio, gap register, este fichero |
| `contracts/` | Contratos canónicos de cada componente |
| `audits/` | Registro de trabajo (punto de entrada) y auditorías |
| `historico/` | Documentos de estado, continuidad, planificación y certificación anteriores al 23/11/2026; se conservan como historial |
| `methodology/` | Fundamentos metodológicos, taxonomía de instrumentos, metamodelo |
| `research/` | Benchmarks y referencias externas |
| `visual/` | Contratos visuales y referencias de diseño |

### `scripts/`
Scripts de exportación de fixtures EAS. Se ejecutan manualmente cuando los fixtures
necesitan regenerarse desde los microdatos originales.

### `public/`
Assets estáticos servidos por Vite. Branding institucional.

## Raíz del proyecto

Solo deben estar en raíz:
- Ficheros de configuración: `package.json`, `tsconfig*.json`, `vite.config.ts`, `eslint.config.js`, `.gitignore`
- `index.html` (entry point Vite)
- `README.md`, `CLAUDE.md`
- Microdatos EAS locales (gitignoreados): `EAS_COMPLETO.csv`, `EAS_microdatos_adulto_READY.csv`

No deben estar en raíz: documentos municipales, PDFs de referencia, XLSXs de datos, logos, scripts temporales.

## Política de cuarentena / archivo

Los ficheros históricos, temporales o supersedidos se mueven a:

```
_archive/repository-cleanup-YYYYMMDD/
```

Esta carpeta está en `.gitignore` y no se versiona.
Sirve de cuarentena local antes de decidir si se eliminan definitivamente.
