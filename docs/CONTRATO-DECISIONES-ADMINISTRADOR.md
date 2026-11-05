# COMPÁS · Contrato de decisiones del administrador (borrador v1)

## Principio
Toda operación sobre un expediente que pueda modificar fuentes, evidencias,
validaciones, perfiles, priorizaciones o sus dependencias debe presentar antes
un aviso comprensible con el alcance y las alternativas. La decisión corresponde
al administrador autorizado; la aplicación no decide por deduplicaciones de nombres.

## Aviso previo obligatorio
1. Qué se va a incorporar o modificar y el ámbito municipal.
2. Qué información existe ya (número, tipo, fecha, estado y referencias).
3. Qué cambiará en la versión vigente y qué conservará la histórica.
4. Consecuencias para la validez de resultados, indicadores, activos y documentos dependientes.
5. Opciones: cancelar, incorporar como nueva fuente/revisión y sustituir la vigente
   archivando el estado anterior cuando sea técnicamente posible.
6. Tras confirmar: resultado de persistencia en Firebase, fecha y estado; lectura de verificación.

## Activos Localiza Salud
- Una carga expresamente designada por el responsable como «Activos Localiza Salud»
  contiene activos validados. No requiere una segunda validación.
- Un recurso o actividad citado en conversación o aportado como documentación general
  NO es por sí mismo activo validado.
- Se preservan las fichas y sus identificadores. Dos fichas del mismo nombre no
  se fusionan automáticamente. El responsable controla duplicidades excepcionales.
- Cada acto de sustitución debe conservar el documento anterior, su validación
  y las evidencias históricas, sin alimentar dos veces el diagnóstico activo.
- El recuento visible corresponde a fuentes activas y evita considerar archivados.

## Perfil de Salud Local
- Nuevo PDF/JSON: revisión nueva, no sobrescritura silenciosa de la vigente.
- Se avisa de indicadores sin fuente/periodo, ausencia de PDF, y cualquier
  discrepancia entre paquete estructurado y fuentes primarias.
- La promoción a vigente o su validación requiere decisión explícita; no se
  equipara aprobación institucional con importación técnica.

## Alcance real al 5/11/2026
- Ruta manual Localiza: aviso y decisión cancelar/añadir/archivar previo;
  archivo histórico de las evidencias y declaraciones preservadas.
- Retirada de validaciones formales: aviso de consecuencias y confirmación.
- Perfil externo: admite revisión, archivo y confirmaciones existentes.
- Pendiente: aplicar este contrato íntegro a TODAS las demás operaciones,
  añadir una interfaz visual consistente con COMPÁS en vez de cuadros nativos,
  pruebas de regresión completas, verificar despliegue y lectura posterior de Firebase.

Este documento es una regla de desarrollo; NO acredita por sí solo que Firebase
se haya actualizado ni que el código ya esté desplegado.
