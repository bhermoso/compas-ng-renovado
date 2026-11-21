# Continuidad verificable de COMPÁS NG

> Actualización de referencia — 10/09/2026: las secciones históricas de este documento no describen todas las capacidades actuales. Ya existe autenticación y almacenamiento territorial parcial en Firebase. Consultar [inventario funcional y hoja de ruta](planning/INVENTARIO-Y-HOJA-DE-RUTA-COMPAS.md) y [administración general](ADMINISTRACION-GENERAL-COMPAS.md) antes de continuar. Se conserva el texto anterior como historial.

> Granada-Zaidín se retiró de COMPÁS el 21 de noviembre de 2026. Las secciones que lo mencionan son historial: los archivos que citan (semillas, exportaciones, informe PDF, código de corrección y documentos `ZAIDIN-*`) ya no están en el árbol y pueden consultarse en Git en el commit `1b5dba6`.

Actualizado: 10 de septiembre de 2026. Este documento es un punto de entrada;
el estado efectivo se comprueba en Git, los expedientes y los despliegues.
No se debe reconstruir el proyecto a partir de una conversación.

Leer también docs/PERFIL-PROCESAMIENTO-PDF-Y-RELAS.md: procesamiento del PDF
original, cargador en enriquecimiento y estado real del acceso RELAS Zaidín.

## Regla fundamental

COMPÁS NG debe funcionar y ser mantenible sin memoria conversacional. Las
reglas, decisiones, fuentes, transformaciones, versiones, permisos y estados de
aprobación deben tener representación explícita y persistente. Cada nuevo cambio
debe actualizar su documentación y sus pruebas cuando corresponda.

Una mención no demuestra la existencia de un archivo. Una escala disponible no
significa que se haya aplicado. Un PDF incorporado no acredita que se hayan
revisado las conclusiones del Perfil. Un borrador de coordinación no equivale a
aprobación del Grupo Motor.

## Consolidación posterior

La PR #44 ya está publicada: commit b4545894ab2ca8c53f39243c69bf4e7309eda556,
GitHub Actions 34468459584 correcto y PDF público verificado por SHA-256.
Leer docs/RECUPERACION-Y-CONSOLIDACION.md para la nueva copia con originales,
sus pruebas, el inventario de copias antiguas y los límites pendientes.
Las referencias a intentos de publicación siguientes describen el estado histórico.

## Repositorio y publicación

- Repositorio: https://github.com/bhermoso/COMPAS_NG
- Rama de publicación: master.
- Web: https://bhermoso.github.io/COMPAS_NG/
- Despliegue: .github/workflows/deploy.yml, activado al actualizar master.
- Última publicación verificada antes de este paquete: PR 43,
  23ae34380c5b4b2ff24c7f21e784d3702b9d9dec.
- Commit local del paquete documental: 271b122013b2448281f35e22a969207445136325.
- El commit que añade este documento es posterior. Consultar el historial y
  GitHub Actions para determinar si el paquete ya está publicado; estas líneas
  no certifican un despliegue posterior.
- El usuario ha autorizado commit, push y despliegue, incluida expresamente la
  publicación del PDF original de abril de 2023 en el repositorio y la web públicos.
- El intento de push por terminal carecía de credenciales. Se inició la subida
  mediante el conector GitHub. El blob del PDF es
  c8f43facb4e002f1c12cced2745f32ade6561708. Un blob suelto no es un despliegue.

## Fuente documental del Zaidín

Documento retirado con el expediente (consultable en Git, commit `1b5dba6`).

El original aportado es «informe salud granada-zaidin completo abril 2023.pdf»:
130 páginas, 4.226.437 bytes, portada de abril de 2023. Archivo incorporado:
docs/source-material/health-reports/informe-salud-zaidin-abril-2023.pdf.
SHA-256: c42dea2e4431f79f1accc19f95f9048b6d77273ae973d5424df5c6321fad06c1.

La conversión Word «estilo Atarfe» se conserva como histórica; no es el original.
Los informes «Zaidin Centro Este» y «Zaidin Sur» conservan textos de Vigilancia
Integral de la Salud por UGC. No se han localizado sus archivos DOCX originales.
Los textos ya estaban en los datos iniciales; no proceden de extraer el PDF de
abril de 2023 en esta intervención. No está acreditada su integridad respecto de
los originales, su autoría o quién los aportó. No inventar esa procedencia.

## Cambios implementados en este paquete

- Migración acotada e idempotente del antiguo informe del Zaidín al PDF original;
  preserva conversiones, fuentes UGC, evidencias y revisiones anteriores.
- Los perfiles validados o aprobados quedan pendientes de revisión si cambia su
  fuente documental. No se sustituyen automáticamente sus conclusiones.
- Acceso común a originales, textos conservados y referencias sin archivo.
- Catálogo documental con búsqueda y referencias desde Perfil, evidencias,
  estudios, repositorio y marcos estratégicos.
- Las referencias ambiguas requieren selección; un ID ausente no se sustituye
  por otro archivo con nombre parecido.

Archivos de entrada:
- src/application/workspace/correctZaidinHealthReport.ts
- src/application/health-profile/profileSourceChanged.ts
- src/infrastructure/persistence/local-storage/LocalStorageWorkspacePersistence.ts
- src/ui/components/Documentation.tsx
- src/ui/components/DocumentAccess.tsx
- src/ui/components/documentAccess.ts
- src/ui/components/FrameworkReference.tsx
- src/ui/components/HealthReportViewer.tsx
- src/ui/components/LocalHealthProfileView.tsx
- public/seeds/compas-ng-workspace-granada-zaidin.json

## Límites reales y objetivos pendientes

El acceso de coordinación es todavía una demostración: no acredita autenticación
ni aislamiento municipal en un servidor. Los archivos adjuntos se conservan en
IndexedDB del navegador; la exportación JSON del expediente no incluye esos
archivos. La nueva copia versionada accesible desde «Copias y recuperación» sí
incluye los originales disponibles y señala los ausentes. No afirmar que existe sincronización distribuida o recuperación
completa entre equipos. Los cuatro PDF incorporados al código sí se distribuyen
con la aplicación.

La independencia de la memoria conversacional NO está certificada por este
archivo. Hay que auditar: reconstrucción desde un clon limpio y un expediente,
exportación/importación completa, integridad de adjuntos, trazabilidad de cada
fuente y transformación, persistencia de borradores y estados, versiones del
modelo y migraciones. Registrar los fallos comprobados y corregirlos por etapas.

Diseño previsto: coordinadores y agentes municipales/comarcales/distritales
aportan documentos, fichas y registros dentro de su ámbito. La aprobación de
documentos corresponde al administrador; la aprobación del Plan tiene su propio
procedimiento. Los permisos deberán ser efectivos en el servidor.

Los instrumentos podrán servir como módulos de encuestas monográficas o amplias
ex post facto y para registrar datos de usuarios durante las actuaciones de los
agentes. Mantener separadas población, origen, momento, versión e interpretación.
No presentar valores de escalas como observados en Zaidín sin datos acreditados.
Usar IBSE: Índice de Bienestar Socioemocional.

## Edición y diseño

Español estándar. «Enviar para su aprobación». Ayudas breves orientadas a tareas,
espacios y resaltados que permitan distinguir instrucciones, fuentes y estados.
Paleta COMPÁS: #0074c8, #00acd9, #94d40b, #ffb61b, #ff6600, #dc143c.
Consultar los estilos del repositorio antes de extenderlos; el degradado se usa
como acento, con contraste suficiente para el texto.

La línea Envejecimiento saludable usa cuatro bloques: Edadismo, Soledad no
deseada, Autonomía y Participación. Conservar las versiones y los identificadores
ENV. Los textos editados del Plan y la propuesta codificada pueden representar
revisiones distintas: comprobar los archivos vigentes y no sustituirlos por
recuerdos o por este resumen. No cambiar automáticamente la ubicación de los
objetivos de accesibilidad o brecha digital al recuperar el proyecto.

## Comprobaciones y siguiente actuación

Pruebas específicas superadas en el paquete documental: 12 casos en
- tests/documentation-references.test.ts
- tests/document-access.test.tsx
- tests/zaidin-original-report.test.ts
- tests/profile-report-change.test.ts

Prueba de navegador: tests/documentation-references.smoke.mjs; verifica PDF
original mediante hash, textos UGC, búsqueda, referencia ausente y cierre.
Compilación superada con el entorno local disponible. GitHub Actions debe
comprobar npm ci y npm run build con el archivo de dependencias del repositorio.
No afirmar que se ha superado toda la batería: existen pruebas anteriores que
requieren DOCX originales no disponibles, documentadas en trabajos previos.

1. Comprobar git status, ramas, remotos, HEAD y diferencias con origin/master.
2. Leer instrucciones del repositorio y este documento; localizar los archivos.
3. Verificar si el paquete está subido e integrado. No duplicar commits o PR.
4. Si falta publicación, terminar la subida e integración autorizadas y vigilar
   el despliegue hasta su resultado. No equiparar build local con publicación.
5. Comprobar la web y el PDF publicado contra su hash.
6. Informar de commit, PR, despliegue y límites pendientes con evidencias.
7. Auditar después la independencia conversacional con una reconstrucción limpia,
   sin modificar expedientes reales ni sustituir datos por ejemplos inventados.
