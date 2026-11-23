# COMPÁS NG — Estado actual y criterio de limpieza

> Revisión de conjunto: 13 de septiembre de 2026.
> Este documento resume qué merece permanecer, qué queda en reserva y qué falta
> para que COMPÁS NG llegue a generar y compilar todas las piezas de un Plan
> Local de Salud con evaluación.

> Actualización de limpieza contractual — 23 de septiembre de 2026:
> no se crea un contrato nuevo para Perfil/PLS. Se reconcilian los contratos
> existentes: `CONTRACT-MTE` es la ruta vigente del MTE; `CONTRACT-ACTION-PLAN`
> queda como legacy; y los bloqueos vivos del PLS son conectar
> `UnaddressedNeed[]` al flujo real del Plan de Acción y definir el
> `PLSEvaluationFramework`.

## 1. Juicio de conjunto

COMPÁS NG ya tiene una base valiosa y bastante más rica que una maqueta: conserva
expedientes territoriales, aplica contratos metodológicos, distingue fuentes
primarias, evidencias derivadas y borradores, y empieza a trazar el paso entre
diagnóstico y planificación.

Lo que todavía no tiene es una línea completa de producto institucional:
`expediente observado → perfil validado → decisión deliberativa → plan de acción
cerrado → plan local compilado → sistema de evaluación`. Hay piezas reales, pero
la cadena completa no está cerrada ni verificada de extremo a extremo.

Mi criterio de limpieza para esta rama es conservar lo que aporta una capacidad
real, una regla metodológica útil o una trazabilidad necesaria; retirar de la
interfaz lo que sugiera funciones abandonadas o todavía no gobernadas; y marcar
como histórico o pendiente todo documento que pueda inducir a una lectura falsa
del estado del producto.

## 2. Piezas que pasan el visto bueno

### Repositorio documental y expediente local

Debe permanecer. Es el corazón operativo actual: documentos, fuentes, metadatos,
texto preservado, evidencias derivadas cuando procede, persistencia local y
recuperación del trabajo. La separación entre documento original, texto
conservado y EvidenceStore es una buena decisión arquitectónica.

### Copias y recuperación

Debe permanecer. El sistema de copia en navegador, localStorage e IndexedDB es
una defensa importante contra pérdida de trabajo. Es una pieza poco vistosa pero
crítica para una herramienta usada con expedientes reales.

### Granada-Zaidín observado

Debe permanecer como piloto trazable, con cautela. El seed público observado no
contiene estudios de escalas ni resultados sintéticos: esa restricción es sana y
debe protegerse. Los fixtures sintéticos pueden seguir existiendo para tests,
pero no deben presentarse como expediente real.

### Perfil de Salud Local

Debe permanecer, con una mejora metodológica pendiente. No es un simple recuento
de palabras: combina agenda textual del Informe, lectura estructurada, señales
integradas, determinantes plausibles, activos, preguntas para Grupo Motor y
capítulos narrativos. Aun así, hoy sigue siendo más prudente y trazable que
interpretativo en sentido fuerte. Necesita una segunda generación que produzca
conclusiones más sintéticas, comparativas y propositivas sin perder cautela.

### MTE v1 y selección deliberativa

Debe permanecer. El MTE v1 ya existe y está contractualizado, aunque su lógica es
determinista y apoyada en marcos estáticos. La selección deliberativa es correcta
como compuerta para generación automática de borradores, pero no debe bloquear la
edición directa de textos del Plan de Acción cuando el usuario está trabajando
sobre el catálogo.

### Plan de Acción con edición directa

Debe permanecer como flujo principal actual. Si se elige `Modificar`, el texto
editado queda guardado inmediatamente como redacción vigente del ámbito. Esta
ruta no debe exigir una segunda aprobación administrativa para consolidar el
cambio en el expediente local.

## 3. Piezas que quedan en reserva

### Acceso autenticado para responsables territoriales

Queda fuera del flujo principal. La idea puede recuperarse en el futuro, pero no
debe aparecer como entrada visible ni condicionar la edición actual del Plan de
Acción. Antes de activarla harían falta reglas de permisos, migración de
expedientes, conflictos de edición y revisión de seguridad.

### Firebase y administración general

Pueden conservarse como infraestructura experimental, no como producto listo.
Las pruebas que dependen de emulador deben separarse de la suite ordinaria para
que no contaminen la señal de salud del repositorio.

### Motores históricos de Plan, Agenda y Seguimiento

No deben presentarse como ruta canónica visible si contradicen la cadena actual.
Pueden permanecer como compatibilidad y material de transición hasta que el Plan
Local de Salud tenga compilador propio.

## 4. Falta para una versión realmente completa

1. Perfil 2.0: más interpretación comparativa y conclusiva, con mecanismos
   plausibles, desigualdades, lagunas de información y preguntas de decisión.
2. Plan de Acción: renombrar y simplificar componentes legacy, consolidar el
   modelo directo y separar definitivamente edición local de revisión formal.
3. Compilador del Plan Local de Salud: secciones, manifiesto, fuentes, agenda,
   seguimiento, anexos y exportación.
4. Sistema de evaluación: indicadores, línea base, metas, responsables,
   periodicidad, evidencias de seguimiento y revisión temporal.
5. Suite de tests limpia: mantener `npm test` como señal ordinaria y revisar las
   suites especiales `test:profile-fixture`, `test:reconstruction` y
   `test:relas`.
6. Despliegue: sincronizar rama local, PR y GitHub Pages cuando las credenciales
   estén operativas.

## 5. Decisiones de esta limpieza

- Se retira el acceso `Administración` del menú principal y se elimina el CSS que
  lo ocultaba.
- El README deja de ser la plantilla de Vite y pasa a explicar el producto real.
- El contrato de selección deliberativa aclara que la compuerta humana afecta a
  la generación automática del borrador, no a la edición directa del Plan de
  Acción en el expediente local.
- `npm test` queda separado de las suites que necesitan Firebase, fuentes DOCX
  privadas o realineación metodológica del fixture sintético.
- Los documentos históricos de arquitectura y roadmap quedan referenciados como
  material de contexto cuando tengan partes desfasadas.

## 6. Próxima limpieza recomendada

La siguiente intervención debería ser la realineación de `test:profile-fixture`.
Esa suite conserva preguntas metodológicas útiles, pero hoy espera una lectura
del Perfil y una composición 20/92 anterior a la migración documental vigente.
