# Handoff — GOV-SALIDA-01 (paridad de representación del Perfil canónico)

> Documento de traspaso. Estado a `master` = `74aa98f`. Para decidir el siguiente frente.

## Estado de `master`
- HEAD: **`74aa98f`** (PR #23 fusionado + desplegado; deploy #109 `success`).
- Suite: **2340 passed · 37 skipped · 4 failed**. Los **4 fallos son baseline preexistente**
  (`ENOENT` de binarios `.docx` no versionados en `granada-zaidin-reconstruction` y
  `documents-ugc-sourcetext`). Lint: **13 = baseline**. No introducir fallos nuevos ni tocar
  esos 13 errores.
- Municipios de prueba: **Zagra** (Informe + priorización; lectura *pendiente*),
  **Atarfe** (Informe + IBSE), **Granada-Zaidín** (caso de referencia de la lectura canónica).

## Tema del programa
Cerrar la **paridad de representación del Perfil canónico** (Art. 17 bis: pantalla, visor,
DOCX, PDF e impresión = el mismo documento). Cada frente es un incremento quirúrgico bajo
disciplina estricta: reconstruir estado → diseño en modo lectura → autorización de alcance →
implementación → validación (`tsc`/build/suite/lint/`git diff --check`) → un commit local →
auditoría → push → PR → merge → vigilar deploy.

## Frentes entregados en la sesión (todos fusionados + desplegados)
| PR | Qué |
|----|-----|
| #14 | Régimen de **impresión único** (impresión = lectura canónica `.pie-*`; visor y espacio técnico no se imprimen). |
| #15 | Pantalla canónica: rinde **cierre humano** + **frontera institucional**; renombra columnas generadas a «Cierre de la lectura». |
| #16 | **Cierre humano en el borrador vivo** (prop `humanClosing`, misma fuente que la canónica). |
| #17 | **Frontera en el borrador vivo** (prop `institutionalBoundary`); excepción principiada del «Plan de Acción» en los chequeos de lenguaje. |
| #18 | Pantalla canónica: rinde las 2 visualizaciones omitidas — **ranking del Informe** y **señales para deliberación** — en posición canónica. |
| #19 | **Visor**: distingue el cierre humano con marca propia (`pslc-viewer__cierre-humano`). |
| #20 | Test: blinda la **frontera en el visor canónico** (ya se rendía). |
| #21 | Pantalla: **pendencia N+1** como sección propia «Lectura territorial pendiente»; suprime el cajón vacío de «Lectura integrada». |
| #22 | **Aviso de no exhaustividad** llevado al documento sellado (DOCX/PDF/visor) — proyector. |
| #23 | **Impresión**: la barra del ranking imprime su magnitud en negro (régimen B/N), no vacía. |

## Qué queda CERRADO
- Paridad de **lectura** pantalla↔proyector: **completa** (orden, presencia, estructura,
  cautelas). No se detectaron más divergencias de lectura.
- Cadena editorial (Art. 16 bis) rendida en pantalla, borrador, visor y documento sellado:
  evidencia → lectura → conclusiones → **cierre humano** → **frontera**.

## Candidatos abiertos para el siguiente frente (evidencia del survey)
1. **«Evaluación del Plan» (`App.tsx:3222`) — pendiente de implementación.** Placeholder de una
   **fase futura** (evaluación del Plan Local de Salud, posterior al Plan de Acción). Es un
   **producto entero**, no quirúrgico; requiere que exista la fase de Plan de Acción/seguimiento.
   Candidato de mayor calado, fuera del tema de paridad.
2. **Asimetría menor de criterio en el visor**: el cierre humano se distingue por `sectionId`
   (solo canónica); la frontera por **título** (canónica + legacy). Coherente pero inconsistente;
   endurecer perdería la ruta legacy. Muy menor.
3. **Ruta legacy sin el trato de paridad**: los frentes se centraron en la ruta **canónica (v2)**;
   la legacy (artefactos antiguos) no recibió el mismo trato (p. ej. no lleva el aviso de no
   exhaustividad ni marca de cierre humano). Bajo valor (fallback histórico).
4. **Otras marcas de color en impresión**: solo se corrigió la barra del ranking; el resto del
   régimen ya era B/N intencional (variante→negro, preguntas→negro, sin azul). Sin defecto
   pendiente conocido.

## Doctrina vigente (no reabrir; commit 298f195)
- Contrato rector: `docs/contracts/CONTRACT-LOCAL-HEALTH-PROFILE-METHODOLOGY.md v1.1`.
- Regla **N+1**: Informe solo no es Perfil (Perfil = Informe + ≥1 fuente adicional: estudios
  complementarios, activos, o priorización ciudadana).
- **Modelo canónico único** (Art. 17 bis) · **Cadena** (Art. 16 bis; el Perfil concluye, no
  recomienda) · **Autoría acotada** (Art. 16; la autoría humana vive en el cierre y el
  enriquecimiento) · el Perfil tiene una sola salida (NHS retirado el 2026-10-23).
- **Granada-Zaidín** no debe cambiar su lectura canónica **sin justificación**.
