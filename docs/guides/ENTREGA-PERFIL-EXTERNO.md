# Elaborar y entregar un Perfil de Salud Local para COMPÁS

Revisión: 12-11-2026. Guía operativa subordinada al contrato metodológico vigente y a la propuesta de contrato externo v1.1. No es un certificado de conformidad ni modifica el estado de los perfiles cargados.

## 1. Preparar el encargo

- Confirmar municipio, identificador de COMPÁS, ciclo, responsable técnico y corte documental.
- Leer el expediente actual desde Firebase. Registrar revisión vigente y fuentes disponibles, distinguiendo documentos, módulos de estudio, priorizaciones y activos.
- Comprobar la suficiencia N+1 del contrato metodológico. Si solo hay Informe, conservarlo como Informe y declarar qué falta para elaborar un Perfil.
- Inventariar documentos con fecha, escala y localizador. No usar nombres de archivo o copias locales como prueba de que algo consta en el expediente.

## 2. Redactar un único documento

Cuatro páginas iniciales: «[Municipio] en datos» (portada con Resumen, Desigualdades, Comunidad y Salud), «Quién vive aquí», «Panel de salud», «Desigualdad». Estos rótulos ayudan al lector automático; no garantizan por sí solos suficiencia.

Después: 1. Punto de partida; 2. Conclusiones, con lectura de conjunto; 3. Convergencias y divergencias, si existen; 4. Lo que no sabemos; 5. Recomendaciones; 6. Paso al Plan de Acción; 7. Autoría y validación. Anexos y referencias completan el mismo documento. C1… y R1… permiten vínculos explícitos. El número de páginas, conclusiones e indicadores depende de la evidencia municipal.

Las recomendaciones son Conocer, Contrastar o Abordar. No fijan responsables, plazos ni líneas del Plan. Las conclusiones citan valores, fechas y fuentes; distinguen hechos, interpretación e hipótesis mediante su redacción. La renta censal, las cotas, los activos y las consultas conservan sus escalas y límites. No sustituir ausencias por ceros, ni contexto por datos locales.

## 3. Entregar los archivos de la misma revisión

| Archivo | Contenido |
|---|---|
| PDF | Documento canónico completo, con versión, fecha y estado |
| JSON | Paquete `compas-profile-package/v1`, texto completo e indicadores de esa revisión |
| Markdown | Acta de entrega con identidad, corte, archivos/SHA-256, cambios y cotejos |
| DOCX, opcional | Fuente editable identificada, coherente con el PDF |

El esquema admitido se describe en [EXTERNAL-PROFILE](../architecture/EXTERNAL-PROFILE.md). No confundirlo con el esquema interno `compas-external-profile/v1`. No incluir propiedades inventadas que el cargador vaya a ignorar. El acta puede conservar la información que aún no tiene campo propio.

Los resultados incluyen `id`, `title`, `value`, `unit`, `source`, `page`, `period`, `caution`. La localización puede ser tabla, página o consulta identificada; no inventar una página para una fuente web. Declarar además base/denominador, escala y tema cuando proceda. `chartValue` solo representa cifras exactas; `comparisons` aporta referencias explícitas compatibles; `supportsConclusions` aporta C1… ya presentes. Los valores literales conservan signos, intervalos y notas.

## 4. Cargar y comprobar

1. Abrir el ámbito correcto. Seleccionar juntos el PDF y su JSON; adjuntar el acta a la misma revisión. Confirmar el borrador antes de guardar.
2. Esperar confirmación remota. Releer desde Firebase y comprobar originales por SHA-256; un fichero en el ordenador no prueba custodia remota.
3. Consultar esa revisión exacta. Verificar portada, páginas, texto, tablas, conclusiones, recomendaciones, anexos y referencias. Comprobar PDF/Word derivados y paquete descargado sin filtros.
4. Registrar discrepancias y resultado del cotejo. Un original íntegro y cuatro rótulos reconocidos no bastan para declarar fidelidad.
5. Decidir explícitamente cuál será vigente. Una carga posterior puede quedar como histórica; no se promueve por ser más nueva.
6. Registrar validación técnica solo tras la revisión humana correspondiente. Estado vigente y estado validado son independientes.

## 5. Cerrar la entrega

Registrar para cada revisión: identidad y archivos; importabilidad; custodia remota; correspondencia entre representaciones; suficiencia metodológica; validación técnica; pendientes con responsable de revisión. Las incidencias se vinculan a una versión, no a la calidad genérica del municipio.

La auditoría del [12 de noviembre](../audits/PSL-EXTERNAL-BASELINE-2026-11-12.md) documenta el punto de partida de Alfacar, Atarfe, Loja y Zagra. No copiar sus recuentos como mínimos obligatorios.

## Acta mínima de entrega

```text
Municipio e identificador:
Título / versión editorial / fecha del documento / ciclo:
Autoría y responsable técnico:
Corte de fuentes y revisión de origen:
Archivos entregados, tamaño y SHA-256:
Cambios frente a la revisión anterior:
Correspondencia PDF / texto / JSON / exportaciones:
Suficiencia y limitaciones metodológicas:
Relectura desde Firebase (fecha y resultado):
Revisión vigente confirmada:
Validación técnica (realizada o pendiente, cuenta y fecha si consta):
Discrepancias y pendientes:
```
