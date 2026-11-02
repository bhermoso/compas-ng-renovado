# Evaluación comparativa del laboratorio editorial · Loja v0.3

**Fecha:** 2 de noviembre de 2026. **Carácter:** examen editorial preliminar, no validación científica.  
**Base reproducible:** `tests/fixtures/profile-text/loja-v0.3-package.txt` (originales C3/C6/C7) y `docs/loja-v03-laboratorio-alternativas-c3-c6-c7.md` (versiones experimentales).  
**No modifica:** el perfil vigente, sus conclusiones, las recomendaciones ni los archivos adjuntos.

## Resultados cuantitativos

| Conclusión | Palabras del texto original | Palabras de la alternativa | Incremento |
|---|---:|---:|---:|
| C3 | 175 | 276 | +58 % |
| C6 | 104 | 260 | +150 % |
| C7 | 184 | 297 | +61 % |

Las cifras son recuentos automáticos de palabras separadas por espacios, incluidos títulos y vínculos a recomendaciones; no equivalen a una valoración de calidad. Se excluyen las notas de revisión añadidas al documento experimental.

**Integridad de referencias:** las alternativas conservan todas las referencias entre corchetes presentes en los tres originales. No se ha comprobado aquí que las referencias respaldan las afirmaciones: eso exige leer las fuentes originales.

## Evaluación por conclusión

### C3 · Alfaguara
- **Ganancia identificable:** hace explícita la diferencia entre desigualdad de renta y desigualdad en salud, que los datos no demuestran por barrio.
- **Coste:** aumenta la extensión y repite de distintas formas la cautela sobre la falta de datos sanitarios.
- **Riesgo:** la correspondencia entre barrio y sección necesita contraste en [21] y [22].
- **Decisión provisional:** conservar el original hasta comprobar si un ajuste **puntual** del último párrafo basta para mejorar la precisión.

### C6 · Infecciones de transmisión sexual
- **Ganancia identificable:** aclara que los acumulados 2003–2010 y 2022–octubre 2026 no son tasas directamente comparables.
- **Coste:** la alternativa desarrolla una reserva metodológica extensa que puede resolverse con una frase.
- **Riesgo:** aún se necesita confrontar la caracterización de la tendencia sostenida con la serie del informe [5].
- **Decisión provisional:** **no sustituir** la conclusión; proponer una aclaración metodológica breve y comprobar [5].

### C7 · Prevención
- **Ganancia identificable:** distingue invitación y participación en cribado de mama, y evita extrapolar unos programas al conjunto de la prevención sanitaria.
- **Coste:** alarga una exposición ya densa en porcentajes.
- **Riesgo:** verificar la definición del indicador de cuello uterino y las bases del histórico de mama.
- **Decisión provisional:** revisar el **titular de C7** y precisar los denominadores sin reescribir completamente el apartado.

## Decisión sobre el proyecto

La prueba **no demuestra que el laboratorio genere perfiles de mayor calidad**. Sí identifica un uso concreto del apoyo automatizado: **auditar la consistencia y sugerir microcorrecciones justificadas** a textos profesionales existentes.

### Criterio de aceptación para nuevas pruebas
1. Mantener todas las cifras y referencias pertinentes, sin nuevas afirmaciones no verificadas.
2. Identificar el error o ambigüedad concreta que se pretende corregir.
3. Preferir la **intervención mínima necesaria** al reemplazo íntegro del capítulo.
4. Documentar la revisión profesional y el tiempo empleado antes de aprobar cambios.
5. No publicar alternativas sin aceptación explícita del equipo técnico.

**Recomendación:** conservar dos vías en COMPÁS: gestor de perfiles externos (principal) y laboratorio experimental (separado). No iniciar un generador de perfiles ni integrar una generación automática hasta observar mejoras verificables y reproducibles.
