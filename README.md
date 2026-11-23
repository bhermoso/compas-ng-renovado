# COMPÁS

COMPÁS acompaña la elaboración, la implantación y la evaluación de Planes
Locales de Salud municipales, mancomunados y de distrito municipal. Organiza el
expediente documental de cada ámbito, el Perfil de Salud Local, la priorización,
el Plan de Acción y las agendas anuales de implantación.

- Repositorio de trabajo: `bhermoso/compas-ng-renovado`, rama `master`.
- Web publicada: https://bhermoso.github.io/compas-ng-renovado/ (se publica al
  fusionar en `master`; `version.json` indica el commit servido).
- Expedientes: custodia en Firebase (`compas-98dd7`), única fuente. La web no
  publica copias de expedientes; las de `fixtures/seeds/` son fixtures de prueba.

## Dónde empezar

1. [Registro de trabajo](docs/audits/REGISTRO-DE-TRABAJO.md): versión
   publicada, comprobaciones, cambios y pendientes, por fecha.
2. [CLAUDE.md](CLAUDE.md): reglas permanentes y doctrina vigente.
3. [Índice de contratos](docs/contracts/CONTRACT-INDEX.md).

Los documentos de estado, continuidad, planificación y certificación anteriores
al 23 de noviembre de 2026 están en [`docs/historico/`](docs/historico/). Son
historial, no describen el estado actual.

## Cómo ejecutar

```bash
npm install
npm run dev
```

## Comprobaciones

```bash
npm run build
npm test          # suite ordinaria
npm run lint      # 21 errores y 3 avisos preexistentes a 23/11/2026
```

Suites con condiciones especiales:

- `npm run test:relas`: reglas de Firestore y administración con los
  emuladores de Firebase.
- `npm run test:smoke`: prueba de navegador de Inicio con Vite y Playwright.

## Estructura

- `src/domain`: tipos canónicos del expediente, evidencias, perfil, plan y
  planificación.
- `src/application`: motores, compiladores y servicios puros.
- `src/ui/components`: paneles de la aplicación.
- `src/infrastructure`: persistencia local y Firebase.
- `fixtures/seeds`: copias antiguas de expedientes, solo para pruebas.
- `firebase/firestore.rules`: reglas de Firestore vigentes.
- `docs/contracts`: contratos metodológicos y técnicos.
- `docs/audits`: registro de trabajo y auditorías.
- `tests`: pruebas unitarias, de integración y de navegador.

## Principio de uso

COMPÁS propone, estructura y hace trazable el trabajo técnico. No sustituye la
validación profesional ni acredita por sí solo una decisión institucional.
