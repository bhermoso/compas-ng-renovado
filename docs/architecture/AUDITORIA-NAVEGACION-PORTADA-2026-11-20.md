# Auditoría de navegación y portada · 20-11-2026

## Diagnóstico
- La navegación superior de `App.tsx` ya ofrece las nueve vistas de trabajo.
- `LocalHealthPlanningCycle` representa otras seis tarjetas navegables en todas las vistas.
- `HomePortada` muestra por tercera vez el ciclo, y duplica el municipio y su selector de ámbito.
- La segunda banda ocupa espacio permanente aunque su acción se limita a cambiar de pestaña.

## Decisión de diseño aplicada (rama aislada)
1. Mantener la navegación principal sin cambios.
2. Convertir el ciclo permanente en una línea de progreso, con seis estados detallados desplegables mediante `details/summary`; los estados y notas conservan su función `derivePhases`.
3. Retirar navegación de las tarjetas del ciclo de la portada: siguen siendo explicación institucional del método.
4. Evitar que `HomePortada` repita el municipio y el botón «Cambiar ámbito», ya presentes en la cabecera.
5. Conservar los cinco logotipos y el marco RELAS.

## Límites de esta intervención
- No cambia el cálculo de fases, el estado persistido, los expedientes ni la navegación principal.
- No modifica el PR #169 ni los módulos de Diagnóstico territorial / Perfil de Salud Local.
- La evaluación sigue etiquetada «No disponible» por la lógica de dominio existente; la pestaña informativa de Evaluación no se retira.
- No se ha certificado todavía la compilación, las pruebas automáticas ni la altura de portada a 1280×720; ejecutar la suite y comprobación visual antes de fusionar.
- El contrato antiguo de props de `HomePortada` y las clases CSS heredadas se preservan temporalmente para minimizar superficie de cambio; podrán limpiarse tras integrar cambios paralelos.

## Verificaciones pendientes para integración
- Comprobar que el indicador compacto aparece en Inicio y en las demás vistas sin duplicarse.
- Probar teclado: Tab al resumen, Enter/Espacio para abrir/cerrar.
- Verificar que los seis estados y sus notas coinciden con los de master para Atarfe y otros expedientes.
- Revisar escritorio 1280×720, móvil 375 px y 320 px, y que no existe desbordamiento horizontal.
- Confirmar que «Cambiar ámbito» sigue accesible desde la cabecera.
- Ejecutar typecheck, compilación y suite de pruebas; comprobar regresiones antes de solicitar revisión.
