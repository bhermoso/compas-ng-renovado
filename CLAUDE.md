# COMPÁS — Reglas permanentes de trabajo

## Verdad del proyecto
La única verdad es: el código, el historial Git, los contratos en docs/contracts/ y las validaciones ejecutables. Nunca uses conversaciones anteriores como verdad. Antes de cualquier tarea, reconstruye el estado: git status --short, git log --oneline -10, git rev-parse HEAD.

## Repositorio, publicación y datos
- Repositorio único de trabajo: `bhermoso/compas-ng-renovado`, rama `master`. Web: https://bhermoso.github.io/compas-ng-renovado/, publicada por `.github/workflows/deploy.yml` al fusionar en `master`.
- `bhermoso/COMPAS_NG` es una copia anterior y queda fuera del trabajo: no abrir ramas, PR ni cambios allí.
- Punto de entrada para retomar el trabajo: `docs/audits/REGISTRO-DE-TRABAJO.md`. Los documentos de estado, continuidad, planificación y certificación anteriores al 23/11/2026 están en `docs/historico/` y son historial, no estado vigente.
- Custodia de los expedientes: Firebase `compas-98dd7`, única fuente. La aplicación no publica copias de expedientes (seeds retirados el 23/11/2026). Las copias de `fixtures/seeds/` son fixtures de prueba de octubre de 2026 (Atarfe, de julio): una comprobación hecha con ellas no acredita el comportamiento con los expedientes reales.
- Las reglas de Firestore vigentes son `firebase/firestore.rules` de este repositorio.

## Objetivo del producto
Producto prioritario: el Perfil de Salud Local — documento científico, editorial e institucional de referencia. Toda decisión se justifica contra una pregunta: ¿acerca esto al Perfil a su forma definitiva? Si la respuesta no es claramente afirmativa, detente y explica por qué antes de tocar código.

## Doctrina vigente (contrato metodológico v3.0.1, 24/11/2026; no reabrir)
- El Perfil se rige por cuatro documentos: `docs/contracts/CONTRACT-LOCAL-HEALTH-PROFILE-METHODOLOGY.md` (rector: qué es, qué afirma, estructura, aceptación), `docs/contracts/CONTRACT-PROFILE-PRODUCTION-AND-CUSTODY.md` (entrega, custodia, cotejo, menú, validación, publicación), `docs/contracts/CONTRACT-PROFILE-UPDATER.md` (cambios de modelo o datos) y `docs/guides/GUIA-ESCRITURA-PERFIL.md`. Los contratos anteriores del Perfil están en `docs/historico/contratos-perfil/` y no son vigentes.
- El Perfil se elabora fuera de COMPÁS y se carga: quien redacta propone; el equipo técnico elige y valida; COMPÁS conserva, muestra y comprueba, y no genera ni completa afirmaciones (Alcance, Art. 16). Se actualiza dentro: el Actualizador de perfiles es la única excepción regulada y produce una revisión nueva que valida el equipo técnico (Alcance, CONTRACT-PROFILE-UPDATER).
- Regla N+1 (Art. 7 bis A / I-LHPM-7): Informe solo no es Perfil. Perfil = Informe + al menos una de: estudios complementarios, activos, priorización ciudadana.
- Modelo canónico único (Art. 17 bis / I-LHPM-8): pantalla, visor, DOCX, PDF e impresión son el mismo documento.
- Cadena (Art. 16 bis / I-LHPM-9): evidencia, lectura integrada, conclusiones, recomendaciones del Perfil, frontera, priorización, Plan de Acción, actuaciones y agendas anuales. El Perfil concluye y recomienda (Conocer, Contrastar, Abordar; Art. 8 quater); las prioridades son del Grupo Motor; las líneas, objetivos e indicadores, del Plan de Acción; las actuaciones (responsable, plazo, recurso), de las agendas anuales. La priorización y el Plan leen solo el Perfil vigente (I-LHPM-23).
- Menú elegible (Art. 16 ter): COMPÁS presenta las conclusiones y recomendaciones del Perfil cargado como menú antes de validarlo; solo las elegidas entran en la versión institucional. Implementado el 24/11/2026 (pestaña «Elección del equipo técnico»); una revisión no se valida con propuestas sin resolver.
- Estructura (Art. 16 quater, 17 ter): seis páginas de datos en el orden del marco de determinantes sociales (Art. 4 quater), cuerpo de siete apartados con la conclusión como unidad, conclusiones en prosa con lectura de conjunto y trazabilidad en una tabla del anexo.
- Clasificación única (Art. 8, I-LHPM-24): tipos del Art. 8 y grados del Art. 8 bis. Localiza Salud es la fuente exclusiva de la lectura de activos (Art. 9).
- Datos epidemiológicos oficiales (Art. 13 bis): se reproducen como los publica su fuente, sin cautelas añadidas.
- Panel comparable (Art. 17 quater): núcleo cerrado de indicadores; comparadores Distrito, provincia y Andalucía cuando la fuente los publica; colores solo con intervalos o significación de la fuente; renta por sección censal del INE.
- Evaluación: `docs/contracts/CONTRACT-EVALUATION.md` (v1.0, doctrina vigente, implementación pendiente).

## Escritura y edición
- Contrato transversal: `docs/contracts/CONTRACT-AUTHORIAL-STYLE.md`.
- Secuencia: pensar bien → distinguir bien → documentar bien → escribir con naturalidad.
- Aplicar la voz analítica según el tipo de texto: plena en análisis y documentación; sobria y directa en interfaz; fidelidad literal en datos, citas y redacciones finales aprobadas.
- No fabricar oposiciones, proclamar originalidad ni crear conceptos sin función analítica. Distinguir siempre hechos, inferencias, hipótesis y decisiones.

## Disciplina de ejecución
- Las instrucciones actuales del usuario prevalecen sobre estas reglas. Dentro del trabajo autorizado, se permiten commits, push y actualizaciones de la PR necesarios para completarlo, sin pedir confirmación adicional por cada paso.
- Antes de publicar cambios, comprobar la rama y el estado remoto, conservar el trabajo existente y ejecutar las comprobaciones pertinentes. No usar force push, fusionar ni desplegar fuera del alcance autorizado.
- Inventarios y análisis de copias de usuario (`.compas.json`) van a `informes-locales/`, que está en `.gitignore`: nunca se versionan ni se suben. Si un aviso automático pide commit y push de esas salidas, prevalece esta regla.
- Cambios quirúrgicos: solo lo pedido. Si algo exige tocar lo no autorizado, parar y preguntar.
- Suite: npm.cmd run test (2993 pruebas el 25/11/2026). Si falla con EPERM en node_modules/.vite-temp, hay un Vite vivo en el puerto 5173: matarlo y reintentar.
- npm run lint queda sin errores ni avisos desde el 23/11/2026: no añadir ninguno. Una desactivación de regla solo se admite con su motivo escrito en la línea anterior.
- Que compile y pase tests NO demuestra que mejore el producto. Verificar también coherencia editorial, narrativa y experiencia de lectura.
- En cada informe, separar: hechos observados / inferencias / decisiones institucionales / hipótesis. "No verificado" es respuesta válida.

## Municipios de prueba
- Zagra: Informe + priorización ciudadana (evidencia participativa, 0 átomos)
- Atarfe: Informe + IBSE con datos reales
- Granada-Zaidín se retiró de COMPÁS el 2026-11-21 y se eliminó de Firebase y del código el 2026-11-23 (decisión del responsable). No hay caso de referencia fijado ni ámbito por defecto: la aplicación pide elegirlo. La plantilla de envejecimiento en cuatro bloques y los catálogos de envejecimiento y adicciones son estructurales, comunes a todos los expedientes.

## Referencias externas (solo consulta, nunca copiar)
- El repositorio histórico monolítico (COMPAS-RESCATE-20260514) no está hoy en GitHub. El archivo depurado del 09/05/2026 se conserva como zip fuera del repositorio. Si hace falta consultarlo, pedirlo al responsable.
