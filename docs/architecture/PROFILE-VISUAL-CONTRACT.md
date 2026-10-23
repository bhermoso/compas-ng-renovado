# Contrato visual del Perfil Local de Salud

> Documento operativo. La visualización del Perfil no decora: responde
> preguntas diagnósticas. Fundamento: PROFILE-SCIENTIFIC-FRAMEWORK.md. Implementación testeable:
> `profileVisualContract.ts`.

## 1. Regla madre

**Toda visualización responde una pregunta diagnóstica y declara fuente,
escala y cautela.** Si no puede declarar las tres cosas, no se visualiza.

## 2. Qué puede ser cada cosa

| Elemento | Forma | Pregunta que responde | Datos reales que lo sostienen |
|---|---|---|---|
| Señales sanitarias del Informe | **Tabla** (dimensión · presencia textual · términos · fuente · cautela) | ¿Qué trata el Informe de salud y con qué peso? | `healthReportSanitaryReading` |
| Indicadores trazadores | **Tabla** (bloque · indicador · valor · ref. Granada · ref. Andalucía · escala/cautela) | ¿Qué señales de vida cotidiana miden los estudios y frente a qué referencia? | `complementaryIndicatorReferences` |
| Matriz deliberativa/epistemológica | **Matriz** (señal → fuente → escala → desigualdad → mecanismo → capacidad → estatus causal → pregunta) | ¿Qué debe deliberar el Grupo Motor y con qué base? | `integratedProfileSignals` |
| Activos por ámbito de capacidad | **Tabla o barras simples** (ámbito · nº recursos · ejemplos) | ¿Dónde se concentra la capacidad comunitaria potencial? | `salutogenicReading` |
| Incertidumbres críticas | **Bloque destacado** (lista) | ¿Qué no sabemos y por qué importa? | incertidumbres + lagunas + EKC |
| BADEA/IECA | **Ficha secundaria** (contexto municipal) | ¿En qué contexto urbano se inscribe el municipio matriz? | `badeaMunicipalContext` |

## 3. Qué NO debe visualizarse

- **Menciones del Informe como prevalencia**: son trazabilidad textual; jamás
  gráfico de magnitud sanitaria.
- **Comparación valor demo ↔ referencia provincial**: coinciden por diseño
  (proxy); un gráfico sugeriría hallazgo donde hay construcción.
- **Series temporales**: no existen series en el expediente.
- **Desagregaciones** (sexo, edad, renta): no existen; su ausencia se
  visualiza solo como incertidumbre declarada.
- **Activos como cobertura o resultado**: nada de mapas de "servicios
  garantizados" ni porcentajes de cobertura.
- **BADEA como protagonista**: nunca en la apertura ni como gráfico principal.

## 4. Salida canónica única y espacio técnico

> Conforme a los Fundamentos del Perfil único (`CONTRACT-INDEX` §«Fundamentos del
> Perfil único», 2026-07-17). Deroga la versión anterior de §4 que repartía el
> contenido en tres composiciones distintas (pantalla / DOCX-PDF / anexo).

**Un solo modelo semántico canónico.** La lectura institucional es única. Pantalla,
impresión, DOCX y PDF **derivan del mismo modelo semántico** y conservan las mismas
**secciones, orden, contenido, estatuto epistemológico, fuentes, escalas, cautelas
y preguntas**. Cada medio dispone de su propio renderer y composición visual (una
tabla en pantalla puede ser interactiva y en PDF estática); **no se exige identidad
de píxeles, CSS ni paginación**, sí identidad de contenido semántico.

**Sin lectura larga alternativa.** No puede coexistir una segunda lectura del mismo
contenido —ni «ampliada» ni «plegada»— que compita con la lectura canónica. Cada
elemento (señales, trazadores, incertidumbres, activos) aparece **una vez**, en la
lectura o en el espacio técnico, no en ambos como composiciones divergentes.

**Espacio técnico después del documento.** La trazabilidad completa, las referencias
comparativas, la ficha BADEA y el detalle de cautelas viven en un **espacio técnico
posterior**, claramente separado de la lectura institucional. Es un anexo de
*trabajo*, no una segunda versión del Perfil.

**Adaptatividad.** Una sección/visualización puede **abrirse, comprimirse o no
aparecer** según la riqueza y solidez del expediente; una mera presencia textual no
obliga a generar un bloque completo.

### 4 bis. Una sola salida

El Perfil se visualiza como un único documento canónico. No hay una segunda salida
con otro renderer, otra densidad ni otra audiencia (CONTRACT-LOCAL-HEALTH-PROFILE-METHODOLOGY,
Art. 17 ter).

## 5. Declaración obligatoria

Toda tabla/gráfico lleva pie con: **Fuente** (instrumento/documento y fichero)
· **Escala** (muestra, ámbito, proxy) · **Cautela** (qué no permite leer).
El helper `visualCaption()` compone este pie de forma uniforme.
