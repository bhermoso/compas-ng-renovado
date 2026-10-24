# Revisión del Perfil completo · 24 de octubre de 2026

Base: `bhermoso/compas-ng-renovado`, `master`, `667351ff4f2e0ff487487085dbc096da1ff6469c`. El remoto y la copia local coincidían al comenzar. No se han modificado contratos fundacionales ni expedientes del usuario.

## Resultado comprobable

Se han recorrido dos expedientes públicos: Loja, para seguir la documentación territorial sin atomización, y Granada-Zaidín, para comprobar el Informe original, los activos y el documento completo. La mejora recupera documentación que desaparecía de la presentación y corrige su estatuto; **no acredita todavía un PSL científicamente completo**.

| Aspecto | Antes | Después |
|---|---|---|
| Documentación de Loja visible en el documento canónico | Tres bloques genéricos; ninguna de las cuatro fuentes territoriales tenía bloque propio | Siete bloques: los tres existentes y cuatro fuentes con pasajes literales, localización y preguntas específicas |
| Soporte de los temas | Título, nombre de fichero, etiquetas y texto participaban en la detección | Solo texto conservado; se excluyen filas de índice con puntos; el pasaje se puede reconstruir por sus posiciones |
| Interpretación de palabras como «barrio» o «renta» | Podían producir determinantes «documentados» y concentración de vulnerabilidad | Se presentan como temas y cuestiones por contrastar; el reconocimiento oficial ERACIS conserva su procedencia propia |
| Periodo y escala | Sin trazabilidad de pasajes en la salida editorial | Escala declarada, fichero, identificador y año declarado; la ausencia de metadatos no se rellena con un año supuesto |
| Estado de Loja | La declaración genérica decía que el Perfil era válido por N+1 | Se indica que el borrador no acredita la combinación exigida; no se fabrica validación ni consenso |
| PDF | Los párrafos se trasladaban enteros a otra página, aunque fueran mayores que ella | Salto por líneas; cabeceras repetidas al continuar tablas y reserva de espacio al iniciarlas |
| Entrada de ficheros | El campo tenía como etiqueta accesible «Elegir archivo» | Cada campo identifica qué documento acepta; prueba real de carga PDF completada |

Los pasajes son evidencia de lo que trata el documento. Las preguntas conectan condiciones materiales, cuidados, bienestar, desigualdad y recursos como asuntos para contrastar. No son estimaciones ni mecanismos causales demostrados.

## Qué entra y qué no: Loja

| Fuente disponible | Contenido recuperado | Uso y límite |
|---|---:|---|
| Perfil completo, `PSL Loja 1ª parte.pdf` | 174.347 caracteres | Temas y extractos localizados; no reconstrucción automática de sus tablas |
| Actualización sociodemográfica 2019 | 1.115 caracteres | Etiquetas demográficas conservadas; no se emparejan columnas/años/valores de una tabla linealizada sin verificarla |
| Actualización epidemiológica 2010–2020 | 16.230 caracteres | Pasajes sobre población, condiciones de vida y salud; su título no demuestra vigencia actual |
| Problemas priorizados y propuesta de plan, 2022 | 5.855 caracteres | Voz y preocupaciones documentales; no prevalencia poblacional ni consenso del ciclo actual |
| Informe histórico `.doc` | Sin texto conservado | Referencia documental. No se afirma haber leído su contenido |
| Borrador histórico de Plan de Acción | 1.941 caracteres | Marco estratégico; no se convierte en diagnóstico ni decisión actual |

Las etiquetas históricas de estos materiales no equivalen al campo contractual `cycle.status`. No se ha declarado un ciclo en nombre del equipo. La salida advierte que el año de referencia no está declarado en metadatos. Las fuentes marcadas expresamente como históricas, archivadas o rechazadas quedan fuera de esta lectura corriente. Las fuentes de otro territorio también se excluyen.

## Recorrido observado de Granada-Zaidín

El PDF original se procesa completo: 130 páginas, 159.679 caracteres, doce secciones y diez dimensiones sanitarias de presencia textual. SHA-256: `c42dea2e4431f79f1accc19f95f9048b6d77273ae973d5424df5c6321fad06c1`.

El expediente público contiene 56 activos observados, no estudios complementarios aplicados. La prueba comprueba que la extracción no crea átomos del Informe ni reescribe un Perfil previamente validado. La carga suplementaria conserva el Informe principal; una sustitución posterior archiva el anterior y preserva su antecedente. Todo ello se ejecuta en un navegador aislado, montando el componente App local: no acredita autenticación ni escritura en producción.

Los dos informes UGC conservan su ruta especializada y escala asistencial; no se duplican como diagnóstico municipal por palabras clave. Los tres marcos estratégicos presentes como referencias no aportan texto a esta lectura. El PDF resultante tiene ocho páginas, con lectura, gráfico de menciones explícitamente rotulado, capacidades, preguntas, síntesis y espacio técnico. Se han renderizado y revisado sus ocho páginas, y las seis del documento de Loja.

## Contraste británico

El [Local Authority Health Profile de Blackpool de 2019](https://fingertips.phe.org.uk/static-reports/health-profiles/2019/e06000009.html?area-name=blackpool) abre con una síntesis interpretativa y conecta desigualdades con salud infantil y adulta. Después permite contrastar indicadores con periodos, población y referencias regionales y nacionales. Distingue comparación estadística, tendencia y datos no calculables. Es una referencia para la estructura y la interpretación, no una fuente de datos para municipios andaluces.

La [colección oficial Local Authority Health Profiles](https://fingertips.phe.org.uk/profile/health-profiles) define el Perfil como apoyo a planificación y reducción de desigualdades. COMPÁS aún necesita que la apertura dependa más de resultados locales verificables, comparadores compatibles e incertidumbre estadística. Las barras actuales representan menciones del Informe: no deben recibir la apariencia ni el significado de las comparaciones sanitarias británicas.

Las preguntas sobre condiciones materiales, entorno y relaciones se apoyan en el marco general de [determinantes de salud de la OMS](https://www.who.int/news-room/questions-and-answers/item/determinants-of-health). Ese marco no demuestra una asociación ni su magnitud en Loja o Zaidín.

## Comprobaciones realizadas

- Suite ordinaria: **2.716 pruebas superadas, cinco omitidas**, 166 archivos. Nueve regresiones nuevas protegen procedencia, exclusiones, texto distinto bajo iguales metadatos, sello/proyección y paginación.
- Build correcto; permanecen los avisos de tamaño de paquetes y de importación dinámica existentes.
- ESLint dirigido sobre los archivos modificados: correcto. No se declara saneado todo el lint histórico.
- Recorrido `profile-complete-review.smoke.mjs`: fuente pública → lectura → modelo canónico → serialización del sello → proyector → PDF y pantalla. Comprueba guardado y recarga mediante los servicios reales de localStorage y equivalencia de respuestas.
- Recorrido `profile-pdf-enrichment.smoke.mjs`: PDF original → extracción → revisión → carga suplementaria → sustitución y conservación del anterior. Base Vite vigente, sin ruta de la aplicación antigua.
- Firebase **en emulador**, proyecto `demo-compas-relas`: veinte pruebas de reglas y una integración superadas; emuladores cerrados. Configuración de CLI aislada, sin credenciales de producción.
- Servicio local 5187 accesible. No se han certificado despliegue remoto ni datos efectivamente guardados en Firebase de producción.

## Lo que sigue abierto

1. **Interpretación sustantiva.** Se ha recuperado trazabilidad y se han eliminado afirmaciones temáticas excesivas. Falta convertir tablas y comparaciones verificadas en argumentos epidemiológicos locales. Zaidín continúa dependiendo mucho de presencia textual; Loja continúa siendo un borrador documental incompleto. No se ha fabricado una convergencia salud–determinantes–activos para llenar esos huecos.
2. **Gates y exclusiones.** Se conserva la regla N+1 y los requisitos de compilación. No se han cambiado los contratos para eliminar consenso ni ampliar familias elegibles. La documentación recuperada aparece sin atribuirle automáticamente el estatuto de lectura integrada.
3. **Deduplicación B10.** Persiste la regla contractual de clave por título/origen/municipio. No se ha alterado sin reforma autorizada del contrato de evidencias. Puede omitir fuentes distintas con el mismo título.
4. **Persistencia compartida.** Las pruebas emuladas no resuelven la concurrencia del manifiesto de `RemoteWorkspace`, su política de limpieza de versiones ni los fallos de lectura antes de guardar. La conservación local comprobada no acredita originales compartidos ni ausencia de pérdida entre dos sesiones.
5. **Zagra 2027–2030.** La búsqueda por nombre en Documentos, Descargas y Escritorio vuelve a encontrar XLS, PPT, imágenes y referencias poblacionales; no el PDF de cinco páginas solicitado ni un expediente recuperable completo. No se ha leído ese Perfil ni se atribuyen como hechos sus cifras o interpretaciones. No se ha tomado contenido de las copias antiguas de otras aplicaciones.

## Reproducción

Desde la copia vigente, con Vite sirviendo en 5187:

```powershell
npx vitest run tests/profile-documentary-lineage.test.ts
node tests/profile-complete-review.smoke.mjs
$env:COMPAS_QA_SCOPE = 'granada-zaidin'
node tests/profile-complete-review.smoke.mjs
node tests/profile-pdf-enrichment.smoke.mjs
npm test
npm run build
```

`COMPAS_QA_OUTPUT` permite dirigir los artefactos fuera de Git y `COMPAS_QA_URL` cambiar el servidor del recorrido completo. Los PDF entregados son documentos de trabajo derivados del mismo modelo canónico; no son artefactos institucionales aprobados ni se ha simulado aprobación para generarlos.
