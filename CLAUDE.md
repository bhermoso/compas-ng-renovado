# COMPÁS — Reglas permanentes de trabajo

## Verdad del proyecto
La única verdad es: el código, el historial Git, los contratos en docs/contracts/ y las validaciones ejecutables. Nunca uses conversaciones anteriores como verdad. Antes de cualquier tarea, reconstruye el estado: git status --short, git log --oneline -10, git rev-parse HEAD.

## Repositorio, publicación y datos
- Repositorio único de trabajo: `bhermoso/compas-ng-renovado`, rama `master`. Web: https://bhermoso.github.io/compas-ng-renovado/, publicada por `.github/workflows/deploy.yml` al fusionar en `master`.
- `bhermoso/COMPAS_NG` es una copia anterior y queda fuera del trabajo: no abrir ramas, PR ni cambios allí.
- Punto de entrada para retomar el trabajo: `docs/audits/REGISTRO-DE-TRABAJO.md`. Los documentos de estado, continuidad, planificación y certificación anteriores al 23/11/2026 están en `docs/historico/` y son historial, no estado vigente.
- Custodia de los expedientes: Firebase `compas-98dd7`. Los expedientes de `public/seeds/` son copias iniciales de octubre de 2026 (Atarfe, de julio): una comprobación hecha con ellos no acredita el comportamiento con los expedientes reales.
- Las reglas de Firestore vigentes son `firebase/firestore.rules` de este repositorio.

## Objetivo del producto
Producto prioritario: el Perfil de Salud Local — documento científico, editorial e institucional de referencia. Toda decisión se justifica contra una pregunta: ¿acerca esto al Perfil a su forma definitiva? Si la respuesta no es claramente afirmativa, detente y explica por qué antes de tocar código.

## Doctrina vigente (commit 298f195, no reabrir)
- Contrato rector: docs/contracts/CONTRACT-LOCAL-HEALTH-PROFILE-METHODOLOGY.md (versión vigente en el propio contrato)
- Regla N+1 (Art. 7 bis A / I-LHPM-7): Informe solo no es Perfil. Perfil = Informe + al menos una de: estudios complementarios, activos, priorización ciudadana.
- Modelo canónico único (Art. 17 bis / I-LHPM-8): pantalla, visor, DOCX, PDF e impresión son el mismo documento. Ninguna representación puede divergir.
- Cadena (Art. 16 bis / I-LHPM-9): evidencia, lectura integrada, conclusiones, recomendaciones del Perfil, frontera, priorización, Plan de Acción, actuaciones y agendas anuales. El Perfil concluye y recomienda (Conocer, Contrastar, Abordar; Art. 8 quater); las prioridades son del Grupo Motor; las líneas, objetivos e indicadores, del Plan de Acción; las actuaciones (responsable, plazo, recurso), de las agendas anuales de implantación, separadas del Plan de Acción (v2.3.1).
- Estructura del Perfil (Art. 16 quater, contrato v2.2.0): la conclusión es la unidad; el cuerpo tiene siete apartados y la evidencia completa va en el anexo compilado. Las conclusiones se abren con una lectura de conjunto y se escriben en prosa; los campos de trazabilidad van a una tabla del anexo.
- Datos epidemiológicos oficiales (Art. 13 bis, v2.2.0): se reproducen como los publica su fuente, sin cautelas añadidas; solo se declaran año, escala no municipal y ausencia de datos posteriores. Los bloques heredados del cuerpo se retiran uno a uno (disposición transitoria).
- Autoría acotada (Art. 16): el cuerpo diagnóstico es compilado y trazable, no editable a mano. La autoría humana vive en el cierre interpretativo y el enriquecimiento.
- El Perfil tiene una sola salida (Art. 17 ter), que se abre con seis páginas de datos comparables en el orden del marco de determinantes sociales (Art. 4 quater, v2.5.0): portada, contexto y población, ejes de desigualdad, condiciones de vida, servicios, salud y bienestar. El NHS y la salida comparativa breve se retiraron el 2026-10-23: no restaurarlos como salida aparte ni crear representaciones derivadas sin reformar el contrato.
- Panel comparable (Art. 17 quater, v2.3.0): núcleo cerrado de indicadores; comparadores Distrito, provincia y Andalucía cuando la fuente los publica; colores solo con intervalos o significación de la fuente; renta por sección censal del INE como eje de desigualdad interna.

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
- Suite: npm.cmd run test (2954 pruebas el 23/11/2026, tras retirar el código sin uso). Si falla con EPERM en node_modules/.vite-temp, hay un Vite vivo en el puerto 5173: matarlo y reintentar.
- npm run lint tiene 23 errores y 3 avisos preexistentes (23/11/2026): no tocarlos sin encargo y no añadir otros.
- Que compile y pase tests NO demuestra que mejore el producto. Verificar también coherencia editorial, narrativa y experiencia de lectura.
- En cada informe, separar: hechos observados / inferencias / decisiones institucionales / hipótesis. "No verificado" es respuesta válida.

## Municipios de prueba
- Zagra: Informe + priorización ciudadana (evidencia participativa, 0 átomos)
- Atarfe: Informe + IBSE con datos reales
- Granada-Zaidín se retiró de COMPÁS el 2026-11-21 (decisión del responsable). No hay caso de referencia fijado ni ámbito por defecto: la aplicación pide elegirlo. La línea Envejecimiento saludable del catálogo común conserva como procedencia el Plan Local de Salud del Distrito Zaidín.

## Referencias externas (solo consulta, nunca copiar)
- El repositorio histórico monolítico (COMPAS-RESCATE-20260514) no está hoy en GitHub. El archivo depurado del 09/05/2026 se conserva como zip fuera del repositorio. Si hace falta consultarlo, pedirlo al responsable.
